import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncCoordinator } from '../services/sync/syncCoordinator';
import { breedRepository } from '../services/repositories/breedRepository';
import { SyncMetadata } from '../types/domain';
import { logger } from '../utils/logger';

export function useSync() {
  const queryClient = useQueryClient();
  const [metadata, setMetadata] = useState<SyncMetadata>({
    id: 1,
    syncStatus: 'idle',
    persistedRecords: 0,
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(syncCoordinator.isSynchronizing());
  const [progress, setProgress] = useState<{
    currentPage: number;
    totalPages: number;
    fetchedBreeds: number;
    totalRecords?: number;
  } | null>(null);

  const loadMetadata = useCallback(async () => {
    try {
      const meta = await breedRepository.getSyncMetadata();
      setMetadata(meta);
      setIsSyncing(meta.syncStatus === 'syncing' || syncCoordinator.isSynchronizing());
    } catch (err) {
      logger.warn('[useSync] Failed to load metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadMetadata();

    const unsubProgress = syncCoordinator.subscribeProgress((p) => {
      setProgress(p);
      setIsSyncing(true);
    });

    return () => {
      unsubProgress();
    };
  }, [loadMetadata]);

  const syncNow = useCallback(
    async (isBackground = false) => {
      try {
        setIsSyncing(true);
        const result = await syncCoordinator.syncAll({ isBackground });
        await loadMetadata();
        // Invalidate breeds query so the UI receives fresh SQLite projections
        queryClient.invalidateQueries({ queryKey: ['breeds'] });
        queryClient.invalidateQueries({ queryKey: ['groups'] });
        return result;
      } finally {
        setIsSyncing(false);
        setProgress(null);
      }
    },
    [loadMetadata, queryClient],
  );

  const cancelSync = useCallback(() => {
    syncCoordinator.cancelSync();
    setIsSyncing(false);
    setProgress(null);
    loadMetadata();
  }, [loadMetadata]);

  return {
    metadata,
    isSyncing,
    progress,
    syncNow,
    cancelSync,
    reloadMetadata: loadMetadata,
  };
}
