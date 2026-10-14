import { useEffect, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncCoordinator, SyncProgress } from '../services/sync/syncCoordinator';
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
  const [progress, setProgress] = useState<SyncProgress | null>(null);

  const loadMetadata = useCallback(async () => {
    try {
      const meta = await breedRepository.getSyncMetadata();
      setMetadata(meta);
      const isCurrentlySyncing = syncCoordinator.isSynchronizing();
      setIsSyncing(isCurrentlySyncing);
      if (!isCurrentlySyncing) {
        setProgress(null);
      }
    } catch (err) {
      logger.warn('[useSync] Failed to load metadata:', err);
    }
  }, []);

  useEffect(() => {
    loadMetadata();

    const unsubState = syncCoordinator.subscribeSyncState((state) => {
      setIsSyncing(state.isSyncing);
      setProgress(state.progress);
      if (!state.isSyncing) {
        loadMetadata();
        queryClient.invalidateQueries({ queryKey: ['breeds'] });
        queryClient.invalidateQueries({ queryKey: ['groups'] });
      }
    });

    return () => {
      unsubState();
    };
  }, [loadMetadata, queryClient]);

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
