import { DogApiClient, dogApiClient } from '../api/dogApiClient';
import { BreedRepository, breedRepository } from '../repositories/breedRepository';
import { NetworkMonitor, networkMonitor } from '../network/networkMonitor';
import { SyncStatus } from '../../types/domain';
import { BreedDto } from '../../types/api';
import { logger } from '../../utils/logger';

export type SyncProgressListener = (progress: {
  currentPage: number;
  totalPages: number;
  fetchedBreeds: number;
  totalRecords?: number;
}) => void;

export class SyncCoordinator {
  private isSyncing = false;
  private currentAbortController: AbortController | null = null;
  private progressListeners = new Set<SyncProgressListener>();

  constructor(
    private api: DogApiClient = dogApiClient,
    private repository: BreedRepository = breedRepository,
    private network: NetworkMonitor = networkMonitor,
  ) {
    this.setupNetworkAutoSync();
  }

  private setupNetworkAutoSync(): void {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    this.network.subscribe((isConnected) => {
      if (isConnected) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          try {
            const meta = await this.repository.getSyncMetadata();
            const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour
            const isStale =
              !meta.lastSuccessfulAt ||
              Date.now() - meta.lastSuccessfulAt > STALE_THRESHOLD_MS ||
              meta.syncStatus === 'failed' ||
              meta.syncStatus === 'partial';

            if (isStale && !this.isSyncing) {
              logger.info(
                '[SyncCoordinator] Stale cache detected on reconnect. Triggering auto-sync...',
              );
              this.syncAll({ isBackground: true }).catch((err) => {
                logger.warn('[SyncCoordinator] Reconnect auto-sync failed:', err);
              });
            }
          } catch (err) {
            logger.warn('[SyncCoordinator] Auto-sync check error:', err);
          }
        }, 1500); // 1.5s debounce to avoid flurry of rapid reconnects
      }
    });
  }

  public subscribeProgress(listener: SyncProgressListener): () => void {
    this.progressListeners.add(listener);
    return () => {
      this.progressListeners.delete(listener);
    };
  }

  private emitProgress(
    currentPage: number,
    totalPages: number,
    fetchedBreeds: number,
    totalRecords?: number,
  ): void {
    this.progressListeners.forEach((fn) => {
      try {
        fn({ currentPage, totalPages, fetchedBreeds, totalRecords });
      } catch (err) {
        logger.warn('[SyncCoordinator] Progress listener error:', err);
      }
    });
  }

  public isSynchronizing(): boolean {
    return this.isSyncing;
  }

  /**
   * Main Synchronization:
   * 1. Fetches breed groups and persists them.
   * 2. Fetches page 1 with page[size]=48.
   * 3. Dynamically determines total pages from meta.pagination.
   * 4. Iteratively fetches remaining pages, validating each and upserting into SQLite immediately.
   * 5. Preserves existing cache on partial network failures.
   */
  public async syncAll(_options: { isBackground?: boolean } = {}): Promise<{
    status: SyncStatus;
    persistedCount: number;
    totalExpected?: number;
    error?: string;
  }> {
    if (this.isSyncing) {
      logger.warn('[SyncCoordinator] Synchronization already in progress. Ignoring request.');
      const currentMeta = await this.repository.getSyncMetadata();
      return {
        status: currentMeta.syncStatus,
        persistedCount: currentMeta.persistedRecords,
        totalExpected: currentMeta.expectedRecords,
      };
    }

    const isConnected = await this.network.checkConnectivity();
    if (!isConnected) {
      logger.info('[SyncCoordinator] Cannot sync while offline.');
      const meta = await this.repository.getSyncMetadata();
      return {
        status: meta.syncStatus === 'success' ? 'success' : 'failed',
        persistedCount: meta.persistedRecords,
        totalExpected: meta.expectedRecords,
        error: 'Device is offline.',
      };
    }

    this.isSyncing = true;
    this.currentAbortController = new AbortController();
    const startTime = Date.now();

    await this.repository.updateSyncMetadata({
      lastAttemptedAt: startTime,
      syncStatus: 'syncing',
      errorMessage: undefined,
    });

    let totalPersistedSoFar = await this.repository.getBreedCount();
    let totalExpectedRecords: number | undefined;

    try {
      logger.info('[SyncCoordinator] Starting full synchronization...');

      // Step 1: Sync Groups
      try {
        const groups = await this.api.fetchGroups({
          signal: this.currentAbortController.signal,
        });
        await this.repository.upsertGroups(groups);
      } catch (groupErr) {
        logger.warn('[SyncCoordinator] Failed to sync groups (continuing with breeds):', groupErr);
      }

      // Step 2: Fetch Page 1 of Breeds
      const PAGE_SIZE = 48;
      const page1 = await this.api.fetchBreedsPage(1, PAGE_SIZE, {
        signal: this.currentAbortController.signal,
      });

      const paginationMeta = page1.meta?.pagination;
      totalExpectedRecords = paginationMeta?.records ?? 283;
      const lastPage = paginationMeta?.last ?? Math.ceil(totalExpectedRecords / PAGE_SIZE);

      // Persist Page 1 immediately
      await this.repository.upsertBreeds(page1.data);
      totalPersistedSoFar = await this.repository.getBreedCount();
      this.emitProgress(1, lastPage, page1.data.length, totalExpectedRecords);

      // Step 3: Fetch Remaining Pages Sequentially (to avoid flooding and ensure deterministic persistence)
      const seenIds = new Set<string>(page1.data.map((b) => b.id));

      for (let pageNum = 2; pageNum <= lastPage; pageNum++) {
        if (this.currentAbortController.signal.aborted) {
          throw new Error('Sync cancelled by user');
        }

        try {
          const pageData = await this.api.fetchBreedsPage(pageNum, PAGE_SIZE, {
            signal: this.currentAbortController.signal,
          });

          // Deduplicate
          const uniqueBreeds: BreedDto[] = [];
          for (const breed of pageData.data) {
            if (!seenIds.has(breed.id)) {
              seenIds.add(breed.id);
              uniqueBreeds.push(breed);
            }
          }

          if (uniqueBreeds.length > 0) {
            await this.repository.upsertBreeds(uniqueBreeds);
          }

          totalPersistedSoFar = await this.repository.getBreedCount();
          this.emitProgress(pageNum, lastPage, seenIds.size, totalExpectedRecords);
        } catch (pageError: unknown) {
          const pageMsg = pageError instanceof Error ? pageError.message : 'Network error';
          logger.error(
            `[SyncCoordinator] Failed to fetch page ${pageNum} of ${lastPage}:`,
            pageError,
          );

          await this.repository.updateSyncMetadata({
            syncStatus: 'partial',
            expectedRecords: totalExpectedRecords,
            persistedRecords: totalPersistedSoFar,
            errorMessage: `Partial sync: failed on page ${pageNum} (${pageMsg})`,
          });

          return {
            status: 'partial',
            persistedCount: totalPersistedSoFar,
            totalExpected: totalExpectedRecords,
            error: pageMsg,
          };
        }
      }

      // Step 4: Complete Successful Sync
      const finalCount = await this.repository.getBreedCount();
      await this.repository.updateSyncMetadata({
        lastSuccessfulAt: Date.now(),
        syncStatus: 'success',
        expectedRecords: totalExpectedRecords,
        persistedRecords: finalCount,
        errorMessage: undefined,
      });

      logger.info(
        `[SyncCoordinator] Full sync completed successfully. Total breeds in database: ${finalCount}`,
      );
      return {
        status: 'success',
        persistedCount: finalCount,
        totalExpected: totalExpectedRecords,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Sync failed';
      logger.error('[SyncCoordinator] Sync failed with error:', err);

      const cachedCount = await this.repository.getBreedCount();
      const status: SyncStatus = cachedCount > 0 ? 'partial' : 'failed';

      await this.repository.updateSyncMetadata({
        syncStatus: status,
        expectedRecords: totalExpectedRecords,
        persistedRecords: cachedCount,
        errorMessage: errMsg,
      });

      return {
        status,
        persistedCount: cachedCount,
        totalExpected: totalExpectedRecords,
        error: errMsg,
      };
    } finally {
      this.isSyncing = false;
      this.currentAbortController = null;
    }
  }

  /**
   * Refreshes a single breed in the background without affecting other cached breeds.
   */
  public async refreshBreed(breedId: string): Promise<boolean> {
    const isConnected = await this.network.checkConnectivity();
    if (!isConnected) return false;

    try {
      const breedDto = await this.api.fetchBreedById(breedId);
      await this.repository.upsertBreeds([breedDto]);
      logger.info(`[SyncCoordinator] Refreshed breed ${breedDto.attributes.name} (${breedId})`);
      return true;
    } catch (err) {
      logger.warn(`[SyncCoordinator] Failed to refresh breed ${breedId}:`, err);
      return false;
    }
  }

  public cancelSync(): void {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
      this.currentAbortController = null;
      this.isSyncing = false;
    }
  }
}

export const syncCoordinator = new SyncCoordinator();
