import { useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { breedRepository } from '../services/repositories/breedRepository';
import { syncCoordinator } from '../services/sync/syncCoordinator';
import { useNetwork } from './useNetwork';

export function useBreedDetails(breedId: string) {
  const queryClient = useQueryClient();
  const isConnected = useNetwork();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: breed = null,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['breed', breedId],
    queryFn: async () => {
      return breedRepository.getBreedById(breedId);
    },
    staleTime: 60 * 1000,
  });

  const refreshFromApi = useCallback(async () => {
    if (!isConnected || isRefreshing) return;
    try {
      setIsRefreshing(true);
      const updated = await syncCoordinator.refreshBreed(breedId);
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['breed', breedId] });
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [breedId, isConnected, isRefreshing, queryClient]);

  // Non-blocking background enrichment when opened
  useEffect(() => {
    if (breedId && isConnected) {
      refreshFromApi();
    }
  }, [breedId, isConnected, refreshFromApi]);

  return {
    breed,
    isLoading,
    isRefreshing,
    error,
    refresh: refreshFromApi,
  };
}
