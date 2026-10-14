import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFilterStore } from '../store/filterStore';
import { useDebounce } from './useDebounce';
import { breedRepository } from '../services/repositories/breedRepository';
import { BreedFilters } from '../types/filters';

export function useBreeds() {
  const searchQuery = useFilterStore((s) => s.searchQuery);
  const groupIds = useFilterStore((s) => s.groupIds);
  const sizeBands = useFilterStore((s) => s.sizeBands);
  const coatLengths = useFilterStore((s) => s.coatLengths);
  const hypoallergenic = useFilterStore((s) => s.hypoallergenic);
  const minChildrenScore = useFilterStore((s) => s.minChildrenScore);
  const minDogsScore = useFilterStore((s) => s.minDogsScore);
  const minStrangersScore = useFilterStore((s) => s.minStrangersScore);

  const debouncedSearchQuery = useDebounce(searchQuery, 280);

  const filters: BreedFilters = useMemo(
    () => ({
      searchQuery: debouncedSearchQuery,
      groupIds,
      sizeBands,
      coatLengths,
      hypoallergenic,
      minChildrenScore,
      minDogsScore,
      minStrangersScore,
    }),
    [
      debouncedSearchQuery,
      groupIds,
      sizeBands,
      coatLengths,
      hypoallergenic,
      minChildrenScore,
      minDogsScore,
      minStrangersScore,
    ],
  );

  const {
    data: sections = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['breeds', filters],
    queryFn: async () => {
      return breedRepository.getBreedSections(filters);
    },
    staleTime: Infinity, // Backed by persistent SQLite
  });

  const totalMatchingBreeds = useMemo(() => {
    return sections.reduce((acc, sec) => acc + sec.data.length, 0);
  }, [sections]);

  const { data: groups = [] } = useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      return breedRepository.getGroups();
    },
    staleTime: Infinity,
  });

  return {
    sections,
    totalMatchingBreeds,
    groups,
    isLoading,
    isFetching,
    error,
    refetch,
    debouncedSearchQuery,
  };
}
