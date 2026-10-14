import { Paths, File, Directory } from 'expo-file-system';
import { DatabaseClient, databaseClient } from '../database/sqliteClient';
import { logger } from '../../utils/logger';

export type ImageVariant = 'thumb' | 'medium' | 'large';

const DEFAULT_MAX_MB = 150;
const BYTES_PER_MB = 1024 * 1024;

export class ImageManager {
  private cacheDirectory: Directory;
  private maxCacheBytes: number;
  private pendingDownloads = new Map<string, Promise<string | null>>();
  private activeDisplayedImages = new Set<string>();

  constructor(private client: DatabaseClient = databaseClient) {
    const envMb = parseInt(process.env.EXPO_PUBLIC_IMAGE_CACHE_MAX_MB || '', 10);
    const maxMb = !isNaN(envMb) && envMb > 0 ? envMb : DEFAULT_MAX_MB;
    this.maxCacheBytes = maxMb * BYTES_PER_MB;
    this.cacheDirectory = new Directory(Paths.cache, 'dog_images');
  }

  public getCacheLimitBytes(): number {
    return this.maxCacheBytes;
  }

  public setCacheLimitBytes(bytes: number): void {
    this.maxCacheBytes = bytes;
  }

  private ensureCacheDir(): void {
    try {
      if (!this.cacheDirectory.exists) {
        this.cacheDirectory.create();
      }
    } catch (err) {
      logger.warn('[ImageManager] Failed to ensure cache directory:', err);
    }
  }

  /**
   * Generates a deterministic safe filename from the image URL.
   */
  private getFilenameFromUrl(url: string): string {
    const sanitized = url.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `${sanitized.slice(-64)}.jpg`;
  }

  /**
   * Marks an image as actively displayed so LRU eviction will not remove it.
   */
  public registerActiveImage(imageId: string): void {
    this.activeDisplayedImages.add(imageId);
  }

  public unregisterActiveImage(imageId: string): void {
    this.activeDisplayedImages.delete(imageId);
  }

  /**
   * Retrieves a cached local file path for an image URL.
   * If not cached locally, downloads it, tracks file size, updates SQLite, and triggers LRU eviction if needed.
   * If download fails, returns the original remote URL as fallback.
   */
  public async getCachedImageUrl(
    imageId: string,
    url?: string | null,
    variant: ImageVariant = 'thumb',
  ): Promise<string> {
    if (!url) return '';

    // If download is already in progress for this URL, reuse the promise to prevent duplicate concurrent downloads
    if (this.pendingDownloads.has(url)) {
      const inFlight = await this.pendingDownloads.get(url);
      if (inFlight) return inFlight;
    }

    const downloadTask = (async () => {
      try {
        this.ensureCacheDir();
        const db = await this.client.getDatabase();
        const now = Date.now();

        // 1. Check database for existing local_path
        const row = await db.getFirstAsync<{ local_path: string | null; file_size: number | null }>(
          'SELECT local_path, file_size FROM breed_images WHERE id = ?;',
          [imageId],
        );

        if (row?.local_path) {
          const file = new File(row.local_path);
          if (file.exists) {
            // Update last_accessed_at in SQLite
            await db.runAsync('UPDATE breed_images SET last_accessed_at = ? WHERE id = ?;', [
              now,
              imageId,
            ]);
            return row.local_path;
          }
        }

        // 2. File not on disk or missing: download it using Expo 57 File.downloadFileAsync
        const filename = this.getFilenameFromUrl(url);
        const destinationFile = new File(this.cacheDirectory, filename);

        logger.debug(`[ImageManager] Downloading variant ${variant} for image ${imageId}...`);
        const downloadedFile = await File.downloadFileAsync(url, destinationFile, {
          idempotent: true,
        });

        const localUri = downloadedFile.uri;
        const fileSize = downloadedFile.size ?? 0;

        // Record local file in SQLite
        await db.runAsync(
          `UPDATE breed_images
           SET local_path = ?, file_size = ?, last_accessed_at = ?
           WHERE id = ?;`,
          [localUri, fileSize, now, imageId],
        );

        // Check and perform LRU eviction if budget is exceeded
        this.triggerEvictionIfNeeded().catch((evictErr) => {
          logger.warn('[ImageManager] Eviction check error:', evictErr);
        });

        return localUri;
      } catch (err) {
        logger.warn(`[ImageManager] Download failed for ${url}. Falling back to remote:`, err);
        return url;
      } finally {
        this.pendingDownloads.delete(url);
      }
    })();

    this.pendingDownloads.set(url, downloadTask);
    const result = await downloadTask;
    return result || url;
  }

  /**
   * Enforces the hard storage limit using Least-Recently-Used (LRU) eviction.
   * Protects actively displayed images.
   */
  public async triggerEvictionIfNeeded(): Promise<number> {
    const db = await this.client.getDatabase();

    // 1. Calculate total cached bytes
    const totalRow = await db.getFirstAsync<{ total_bytes: number | null }>(
      'SELECT SUM(file_size) as total_bytes FROM breed_images WHERE local_path IS NOT NULL;',
    );
    const totalBytes = totalRow?.total_bytes ?? 0;

    if (totalBytes <= this.maxCacheBytes) {
      return 0; // Within budget
    }

    const excessBytes = totalBytes - this.maxCacheBytes;
    logger.info(
      `[ImageManager] Cache exceeded by ${Math.round(excessBytes / 1024)} KB. Starting LRU eviction...`,
    );

    // 2. Query candidates ordered by oldest access time
    const candidates = await db.getAllAsync<{
      id: string;
      local_path: string;
      file_size: number | null;
    }>(
      `SELECT id, local_path, file_size
       FROM breed_images
       WHERE local_path IS NOT NULL
       ORDER BY COALESCE(last_accessed_at, 0) ASC;`,
    );

    let bytesFreed = 0;
    for (const item of candidates) {
      if (bytesFreed >= excessBytes) break;

      // Do not evict images that are currently active on screen
      if (this.activeDisplayedImages.has(item.id)) {
        continue;
      }

      try {
        const file = new File(item.local_path);
        if (file.exists) {
          file.delete();
        }
        await db.runAsync(
          'UPDATE breed_images SET local_path = NULL, file_size = NULL WHERE id = ?;',
          [item.id],
        );
        bytesFreed += item.file_size ?? 0;
      } catch (delErr) {
        logger.warn(`[ImageManager] Failed to delete cached file ${item.local_path}:`, delErr);
      }
    }

    logger.info(`[ImageManager] Evicted ${Math.round(bytesFreed / 1024)} KB of image cache.`);
    return bytesFreed;
  }

  /**
   * Clears the entire managed image cache.
   */
  public async clearCache(): Promise<void> {
    try {
      if (this.cacheDirectory.exists) {
        this.cacheDirectory.delete();
      }
      const db = await this.client.getDatabase();
      await db.runAsync('UPDATE breed_images SET local_path = NULL, file_size = NULL;');
      logger.info('[ImageManager] Cleared entire image cache.');
    } catch (err) {
      logger.warn('[ImageManager] Failed to clear image cache:', err);
    }
  }
}

export const imageManager = new ImageManager();
