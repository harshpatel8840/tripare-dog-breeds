import { useEffect, useState, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { breedRepository } from '../services/repositories/breedRepository';
import { syncCoordinator } from '../services/sync/syncCoordinator';
import { useNetwork } from './useNetwork';

export function useBreedDetails(breedId: string) {
  const queryClient = useQueryClient();
  const isConnected = useNetwork();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isRefreshingRef = useRef(false);

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
    if (!isConnected || isRefreshingRef.current || !breedId) return;
    try {
      isRefreshingRef.current = true;
      setIsRefreshing(true);
      const updated = await syncCoordinator.refreshBreed(breedId);
      if (updated) {
        queryClient.invalidateQueries({ queryKey: ['breed', breedId] });
      }
    } finally {
      isRefreshingRef.current = false;
      setIsRefreshing(false);
    }
  }, [breedId, isConnected, queryClient]);

  // Non-blocking background enrichment when opened - with cancellation and race-condition prevention
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    if (breedId && isConnected && !isRefreshingRef.current) {
      isRefreshingRef.current = true;
      setIsRefreshing(true);

      syncCoordinator
        .refreshBreed(breedId, { signal: controller.signal })
        .then((updated) => {
          if (isMounted && updated) {
            queryClient.invalidateQueries({ queryKey: ['breed', breedId] });
          }
        })
        .finally(() => {
          if (isMounted) {
            isRefreshingRef.current = false;
            setIsRefreshing(false);
          }
        });
    }

    return () => {
      isMounted = false;
      controller.abort();
      isRefreshingRef.current = false;
    };
  }, [breedId, isConnected, queryClient]);

  return {
    breed,
    isLoading,
    isRefreshing,
    error,
    refresh: refreshFromApi,
  };
}
