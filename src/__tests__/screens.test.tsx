import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { OfflineBanner } from '../components/common/OfflineBanner';
import { FilterScreen } from '../screens/FilterScreen';
import { BreedDetailsScreen } from '../screens/BreedDetailsScreen';
import { BreedListScreen } from '../screens/BreedListScreen';
import { useSync } from '../hooks/useSync';
import { useNetwork } from '../hooks/useNetwork';
import { useBreeds } from '../hooks/useBreeds';
import { useBreedDetails } from '../hooks/useBreedDetails';
import { useFilterStore } from '../store/filterStore';
import { Breed, BreedSection } from '../types/domain';

// Mock custom hooks for isolated screen testing
jest.mock('../hooks/useSync');
jest.mock('../hooks/useNetwork');
jest.mock('../hooks/useBreeds');
jest.mock('../hooks/useBreedDetails');

const mockedUseSync = useSync as jest.MockedFunction<typeof useSync>;
const mockedUseNetwork = useNetwork as jest.MockedFunction<typeof useNetwork>;
const mockedUseBreeds = useBreeds as jest.MockedFunction<typeof useBreeds>;
const mockedUseBreedDetails = useBreedDetails as jest.MockedFunction<typeof useBreedDetails>;

function createMockSyncReturn(
  overrides?: Partial<ReturnType<typeof useSync>>,
): ReturnType<typeof useSync> {
  return {
    metadata: {
      id: 1,
      syncStatus: 'success',
      persistedRecords: 100,
      lastSuccessfulAt: Date.now() - 3600000,
    },
    isSyncing: false,
    progress: null,
    syncNow: jest.fn().mockResolvedValue({ status: 'success', persistedCount: 100 }),
    cancelSync: jest.fn(),
    reloadMetadata: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function createMockBreedsReturn(
  overrides?: Partial<ReturnType<typeof useBreeds>>,
): ReturnType<typeof useBreeds> {
  return {
    sections: [],
    totalMatchingBreeds: 0,
    groups: [
      { id: 'g1', name: 'Working Group', updatedAt: Date.now() },
      { id: 'g2', name: 'Hound Group', updatedAt: Date.now() },
    ],
    isLoading: false,
    isFetching: false,
    error: null,
    refetch: jest.fn(),
    debouncedSearchQuery: '',
    ...overrides,
  };
}

describe('Screen & Banner UI Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useFilterStore.getState().resetFilters();

    mockedUseNetwork.mockReturnValue(true);
    mockedUseSync.mockReturnValue(createMockSyncReturn());
    mockedUseBreeds.mockReturnValue(createMockBreedsReturn());
  });

  describe('OfflineBanner', () => {
    it('renders initial download required state when no cache exists', async () => {
      mockedUseSync.mockReturnValue(
        createMockSyncReturn({
          metadata: { id: 1, syncStatus: 'idle', persistedRecords: 0 },
        }),
      );

      const { getByText } = await render(<OfflineBanner />);

      expect(getByText('⚠️ Initial catalogue download required.')).toBeTruthy();
      expect(getByText('Download')).toBeTruthy();
    });

    it('renders synchronizing progress state during active sync', async () => {
      mockedUseSync.mockReturnValue(
        createMockSyncReturn({
          metadata: { id: 1, syncStatus: 'syncing', persistedRecords: 48 },
          isSyncing: true,
          progress: {
            currentPage: 2,
            totalPages: 6,
            fetchedBreeds: 96,
          },
        }),
      );

      const { getByText } = await render(<OfflineBanner />);

      expect(getByText('Synchronizing — Page 2 of 6 (96 breeds)')).toBeTruthy();
    });

    it('renders offline banner when network is disconnected and cached data exists', async () => {
      mockedUseNetwork.mockReturnValue(false);
      mockedUseSync.mockReturnValue(
        createMockSyncReturn({
          metadata: {
            id: 1,
            syncStatus: 'success',
            persistedRecords: 283,
            lastSuccessfulAt: Date.now() - 7200000,
          },
        }),
      );

      const { getByText } = await render(<OfflineBanner />);

      expect(getByText(/📶 Offline — showing saved data/)).toBeTruthy();
    });

    it('renders partial sync warning with retry action button', async () => {
      const syncNowMock = jest.fn();
      mockedUseSync.mockReturnValue(
        createMockSyncReturn({
          metadata: {
            id: 1,
            syncStatus: 'partial',
            persistedRecords: 48,
            errorMessage: 'Page 2 network timeout',
          },
          syncNow: syncNowMock,
        }),
      );

      const { getByText } = await render(<OfflineBanner />);

      expect(getByText('⚠️ Partial sync — some updates failed')).toBeTruthy();
      const retryBtn = getByText('Retry');
      await fireEvent.press(retryBtn);
      expect(syncNowMock).toHaveBeenCalledTimes(1);
    });

    it('renders up-to-date subtle indicator when catalog is fully synced', async () => {
      mockedUseSync.mockReturnValue(
        createMockSyncReturn({
          metadata: {
            id: 1,
            syncStatus: 'success',
            persistedRecords: 283,
            lastSuccessfulAt: Date.now() - 60000,
          },
        }),
      );

      const { getByText } = await render(<OfflineBanner />);

      expect(getByText(/✓ Up to date • Last synced/)).toBeTruthy();
    });
  });

  describe('FilterScreen', () => {
    it('renders filter groups, size categories, coat types, and multi-select hypoallergenic pills', async () => {
      const { getByText } = await render(<FilterScreen />);

      expect(getByText('Filter Breeds')).toBeTruthy();
      expect(getByText('Breed Group (2)')).toBeTruthy();
      expect(getByText('Working Group')).toBeTruthy();
      expect(getByText('Hound Group')).toBeTruthy();
      expect(getByText('Small (≤10 kg)')).toBeTruthy();
      expect(getByText('Wire')).toBeTruthy();
      expect(getByText('Hypoallergenic')).toBeTruthy();
      expect(getByText('Yes')).toBeTruthy();
      expect(getByText('No')).toBeTruthy();
    });

    it('allows toggling hypoallergenic multi-select options independently', async () => {
      const { getByText } = await render(<FilterScreen />);

      const yesPill = getByText('Yes');
      const noPill = getByText('No');

      // Tap Yes
      await fireEvent.press(yesPill);
      expect(useFilterStore.getState().hypoallergenic).toEqual(['yes']);

      // Tap No (both Yes and No selected simultaneously)
      await fireEvent.press(noPill);
      expect(useFilterStore.getState().hypoallergenic).toEqual(['yes', 'no']);

      // Untap Yes
      await fireEvent.press(yesPill);
      expect(useFilterStore.getState().hypoallergenic).toEqual(['no']);
    });

    it('resets all filters when Clear All is clicked', async () => {
      useFilterStore.getState().toggleGroupId('g1');
      useFilterStore.getState().toggleSizeBand('small');
      useFilterStore.getState().toggleHypoallergenic('yes');
      useFilterStore.getState().setMinChildrenScore(4);

      expect(useFilterStore.getState().hasActiveFilters()).toBe(true);

      const { getByText } = await render(<FilterScreen />);
      const clearBtn = getByText('Clear All');
      await fireEvent.press(clearBtn);

      expect(useFilterStore.getState().hasActiveFilters()).toBe(false);
      expect(useFilterStore.getState().hypoallergenic).toEqual([]);
      expect(useFilterStore.getState().sizeBands).toEqual([]);
    });
  });

  describe('BreedDetailsScreen', () => {
    const mockBreed: Breed = {
      id: 'test-breed-id',
      name: 'Golden Retriever',
      normalizedName: 'golden retriever',
      description: 'Intelligent, friendly, and devoted sporting dog.',
      hypoallergenic: false,
      groupId: 'g-sporting',
      groupName: 'Sporting Group',
      sizeBand: 'large',
      life: { min: 10, max: 12 },
      maleWeight: { min: 30, max: 34 },
      femaleWeight: { min: 25, max: 32 },
      maleHeight: { min: 58, max: 61 },
      femaleHeight: { min: 55, max: 57 },
      coat: { type: 'double', length: 'medium', colors: ['Golden', 'Light Golden', 'Dark Golden'] },
      origin: { country: 'Scotland', region: 'Highlands', era: '19th Century' },
      otherNames: ['Yellow Retriever'],
      recognizedBy: ['AKC', 'UKC', 'FCI'],
      traits: {
        energy: 4,
        barking: 2,
        drooling: 2,
        grooming: 3,
        shedding: 4,
        trainability: 5,
        goodWithDogs: 5,
        exerciseMinutes: 60,
        apartmentFriendly: 3,
        goodWithChildren: 5,
        goodWithStrangers: 5,
        temperament: ['Friendly', 'Intelligent', 'Devoted'],
      },
      images: [
        {
          id: 'img-1',
          breedId: 'test-breed-id',
          url: 'https://images.dogapi.dog/golden_large.jpg',
          mediumUrl: 'https://images.dogapi.dog/golden_med.jpg',
          thumbUrl: 'https://images.dogapi.dog/golden_thumb.jpg',
          attribution: {
            author: 'John Doe',
            license: 'CC BY-SA 4.0',
            licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0',
            source: 'Wikimedia Commons',
            sourceUrl: 'https://commons.wikimedia.org',
          },
        },
      ],
      updatedAt: Date.now(),
    };

    it('renders overview tab with physical characteristics and origin', async () => {
      mockedUseBreedDetails.mockReturnValue({
        breed: mockBreed,
        isLoading: false,
        isRefreshing: false,
        error: null,
        refresh: jest.fn(),
      });

      const { getByText } = await render(<BreedDetailsScreen />);
      expect(getByText('Sporting Group')).toBeTruthy();
      expect(getByText('About the Breed')).toBeTruthy();
      expect(getByText('Intelligent, friendly, and devoted sporting dog.')).toBeTruthy();
      expect(getByText(/10.*12 years/)).toBeTruthy();
      expect(getByText(/30.*34 kg/)).toBeTruthy();
      expect(getByText('Scotland')).toBeTruthy();
      expect(getByText('Golden, Light Golden, Dark Golden')).toBeTruthy();
    });

    it('switches between Overview, Traits, and Gallery tabs', async () => {
      mockedUseBreedDetails.mockReturnValue({
        breed: mockBreed,
        isLoading: false,
        isRefreshing: false,
        error: null,
        refresh: jest.fn(),
      });

      const { getByText, getByLabelText } = await render(<BreedDetailsScreen />);

      // Switch to Traits Tab
      const traitsTab = getByLabelText('Traits tab');
      await fireEvent.press(traitsTab);

      expect(getByText('Behavioral & Physical Traits')).toBeTruthy();
      expect(getByText('Trainability')).toBeTruthy();
      expect(getByText('Friendly')).toBeTruthy();

      // Switch to Gallery Tab
      const galleryTab = getByLabelText('Gallery tab');
      await fireEvent.press(galleryTab);

      expect(getByText('Image 1 of 1')).toBeTruthy();
      expect(getByText('John Doe')).toBeTruthy();
      expect(getByText('CC BY-SA 4.0 ↗')).toBeTruthy();
    });
  });

  describe('BreedListScreen', () => {
    const sampleSections: BreedSection[] = [
      {
        title: 'Working Group',
        groupId: 'g1',
        data: [
          {
            id: 'b1',
            name: 'Boxer',
            groupId: 'g1',
            groupName: 'Working Group',
            sizeBand: 'large',
            hypoallergenic: false,
            lifeMin: 10,
            lifeMax: 12,
            weightMin: 25,
            weightMax: 32,
          },
        ],
      },
    ];

    it('renders breed list with section headers, search input, and counts', async () => {
      mockedUseBreeds.mockReturnValue(
        createMockBreedsReturn({
          sections: sampleSections,
          totalMatchingBreeds: 1,
          groups: [{ id: 'g1', name: 'Working Group', updatedAt: Date.now() }],
        }),
      );

      const { getByText, getAllByText } = await render(<BreedListScreen />);

      expect(getByText('Tripare Dog Breeds')).toBeTruthy();
      expect(getByText(/1.*breeds available/)).toBeTruthy();
      expect(getAllByText('Working Group').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Boxer')).toBeTruthy();
    });

    it('handles search input text changes', async () => {
      mockedUseBreeds.mockReturnValue(
        createMockBreedsReturn({
          sections: sampleSections,
          totalMatchingBreeds: 1,
          groups: [],
        }),
      );

      const { getByPlaceholderText } = await render(<BreedListScreen />);

      const searchInput = getByPlaceholderText('Search by breed or alternate names...');
      await fireEvent.changeText(searchInput, 'Boxer');

      expect(useFilterStore.getState().searchQuery).toBe('Boxer');
    });

    it('renders empty state when no breeds match search or filters', async () => {
      mockedUseBreeds.mockReturnValue(
        createMockBreedsReturn({
          sections: [],
          totalMatchingBreeds: 0,
          groups: [],
          debouncedSearchQuery: 'NonExistentBreed',
        }),
      );

      const { getByText } = await render(<BreedListScreen />);

      expect(getByText('No matching breeds')).toBeTruthy();
      expect(getByText('Reset All Filters')).toBeTruthy();
    });
  });
});
