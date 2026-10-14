import { CoatLength, SizeBand } from './domain';

export type HypoallergenicOption = 'yes' | 'no';

export interface BreedFilters {
  searchQuery: string;
  groupIds: string[];
  sizeBands: SizeBand[];
  coatLengths: CoatLength[];
  hypoallergenic: HypoallergenicOption[];
  minChildrenScore: number | null;
  minDogsScore: number | null;
  minStrangersScore: number | null;
}

export const INITIAL_FILTERS: BreedFilters = {
  searchQuery: '',
  groupIds: [],
  sizeBands: [],
  coatLengths: [],
  hypoallergenic: [],
  minChildrenScore: null,
  minDogsScore: null,
  minStrangersScore: null,
};

export interface FilterOption<T> {
  id: T;
  label: string;
}

export const SIZE_BAND_OPTIONS: FilterOption<SizeBand>[] = [
  { id: 'small', label: 'Small (≤10 kg)' },
  { id: 'medium', label: 'Medium (11–25 kg)' },
  { id: 'large', label: 'Large (26–45 kg)' },
  { id: 'giant', label: 'Giant (>45 kg)' },
  { id: 'unknown', label: 'Unknown Size' },
];

export const COAT_LENGTH_OPTIONS: FilterOption<CoatLength>[] = [
  { id: 'short', label: 'Short' },
  { id: 'medium', label: 'Medium' },
  { id: 'long', label: 'Long' },
  { id: 'wire', label: 'Wire' },
];

export const HYPOALLERGENIC_OPTIONS: FilterOption<HypoallergenicOption>[] = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
];
