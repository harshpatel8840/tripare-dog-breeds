import { create } from 'zustand';
import { BreedFilters, HypoallergenicOption, INITIAL_FILTERS } from '../types/filters';
import { CoatLength, SizeBand } from '../types/domain';

interface FilterState extends BreedFilters {
  setSearchQuery: (query: string) => void;
  toggleGroupId: (groupId: string) => void;
  toggleSizeBand: (sizeBand: SizeBand) => void;
  toggleCoatLength: (coatLength: CoatLength) => void;
  toggleHypoallergenic: (option: HypoallergenicOption) => void;
  setHypoallergenic: (options: HypoallergenicOption[]) => void;
  setMinChildrenScore: (score: number | null) => void;
  setMinDogsScore: (score: number | null) => void;
  setMinStrangersScore: (score: number | null) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
  getActiveFilterCount: () => number;
}

export const useFilterStore = create<FilterState>((set, get) => ({
  ...INITIAL_FILTERS,

  setSearchQuery: (query) => set({ searchQuery: query }),

  toggleGroupId: (groupId) =>
    set((state) => {
      const exists = state.groupIds.includes(groupId);
      return {
        groupIds: exists
          ? state.groupIds.filter((id) => id !== groupId)
          : [...state.groupIds, groupId],
      };
    }),

  toggleSizeBand: (sizeBand) =>
    set((state) => {
      const exists = state.sizeBands.includes(sizeBand);
      return {
        sizeBands: exists
          ? state.sizeBands.filter((s) => s !== sizeBand)
          : [...state.sizeBands, sizeBand],
      };
    }),

  toggleCoatLength: (coatLength) =>
    set((state) => {
      const exists = state.coatLengths.includes(coatLength);
      return {
        coatLengths: exists
          ? state.coatLengths.filter((c) => c !== coatLength)
          : [...state.coatLengths, coatLength],
      };
    }),

  toggleHypoallergenic: (option) =>
    set((state) => {
      const exists = state.hypoallergenic.includes(option);
      return {
        hypoallergenic: exists
          ? state.hypoallergenic.filter((o) => o !== option)
          : [...state.hypoallergenic, option],
      };
    }),

  setHypoallergenic: (hypoallergenic) => set({ hypoallergenic }),

  setMinChildrenScore: (score) => set({ minChildrenScore: score }),

  setMinDogsScore: (score) => set({ minDogsScore: score }),

  setMinStrangersScore: (score) => set({ minStrangersScore: score }),

  resetFilters: () =>
    set({
      groupIds: [],
      sizeBands: [],
      coatLengths: [],
      hypoallergenic: [],
      minChildrenScore: null,
      minDogsScore: null,
      minStrangersScore: null,
      searchQuery: '',
    }),

  hasActiveFilters: () => {
    const s = get();
    return (
      s.groupIds.length > 0 ||
      s.sizeBands.length > 0 ||
      s.coatLengths.length > 0 ||
      s.hypoallergenic.length > 0 ||
      s.minChildrenScore !== null ||
      s.minDogsScore !== null ||
      s.minStrangersScore !== null
    );
  },

  getActiveFilterCount: () => {
    const s = get();
    let count = 0;
    count += s.groupIds.length;
    count += s.sizeBands.length;
    count += s.coatLengths.length;
    count += s.hypoallergenic.length;
    if (s.minChildrenScore !== null) count += 1;
    if (s.minDogsScore !== null) count += 1;
    if (s.minStrangersScore !== null) count += 1;
    return count;
  },
}));
