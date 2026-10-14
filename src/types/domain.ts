// ==========================================
// DOMAIN MODELS (Decoupled from DTOs / SQLite)
// ==========================================

export interface ImageAttribution {
  author?: string;
  license?: string;
  licenseUrl?: string;
  source?: string;
  sourceUrl?: string;
}

export interface BreedImage {
  id: string;
  breedId: string;
  url: string;
  thumbUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  attribution?: ImageAttribution;
  localPath?: string;
  fileSize?: number;
  lastAccessedAt?: number;
}

export interface TraitScores {
  energy?: number;
  barking?: number;
  drooling?: number;
  grooming?: number;
  shedding?: number;
  trainability?: number;
  goodWithDogs?: number;
  exerciseMinutes?: number;
  apartmentFriendly?: number;
  goodWithChildren?: number;
  goodWithStrangers?: number;
  temperament?: string[];
}

export interface MinMaxRange {
  min?: number | null;
  max?: number | null;
}

export interface BreedOrigin {
  era?: string;
  region?: string;
  country?: string;
}

export interface BreedCoat {
  type?: string;
  colors?: string[];
  length?: string;
}

export type SizeBand = 'small' | 'medium' | 'large' | 'giant' | 'unknown';
export type CoatLength = 'short' | 'medium' | 'long' | 'wire';

export interface Breed {
  id: string;
  name: string;
  normalizedName: string;
  description?: string;
  hypoallergenic: boolean;
  groupId?: string;
  groupName?: string;
  life?: MinMaxRange;
  maleWeight?: MinMaxRange;
  femaleWeight?: MinMaxRange;
  maleHeight?: MinMaxRange;
  femaleHeight?: MinMaxRange;
  origin?: BreedOrigin;
  coat?: BreedCoat;
  traits?: TraitScores;
  otherNames?: string[];
  recognizedBy?: string[];
  images?: BreedImage[];
  sizeBand: SizeBand;
  updatedAt: number;
}

/**
 * Lightweight projection for high-performance virtualized SectionList rendering.
 * Does not carry heavy trait trees, full origin descriptors, or multiple full-res images.
 */
export interface BreedListItem {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  thumbUrl?: string;
  hypoallergenic: boolean;
  sizeBand: SizeBand;
  coatLength?: string;
  lifeMin?: number;
  lifeMax?: number;
  weightMin?: number;
  weightMax?: number;
}

export interface BreedGroup {
  id: string;
  name: string;
  updatedAt: number;
}

export interface BreedSection {
  title: string;
  groupId: string;
  data: BreedListItem[];
}

export type SyncStatus = 'idle' | 'syncing' | 'failed' | 'partial' | 'success';

export interface SyncMetadata {
  id: number;
  lastAttemptedAt?: number;
  lastSuccessfulAt?: number;
  syncStatus: SyncStatus;
  expectedRecords?: number;
  persistedRecords: number;
  errorMessage?: string;
}
