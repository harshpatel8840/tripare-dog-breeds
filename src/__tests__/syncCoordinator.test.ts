import { SyncCoordinator } from '../services/sync/syncCoordinator';
import { DogApiClient } from '../services/api/dogApiClient';
import { BreedRepository } from '../services/repositories/breedRepository';
import { NetworkMonitor } from '../services/network/networkMonitor';
import { BreedDto, GroupDto } from '../types/api';

describe('SyncCoordinator', () => {
  let mockApi: {
    fetchGroups: jest.Mock;
    fetchBreedsPage: jest.Mock;
    fetchBreedById: jest.Mock;
  };
  let mockRepo: {
    getBreedCount: jest.Mock;
    upsertGroups: jest.Mock;
    upsertBreeds: jest.Mock;
    getSyncMetadata: jest.Mock;
    updateSyncMetadata: jest.Mock;
  };
  let mockNetwork: {
    getIsConnected: jest.Mock;
    checkConnectivity: jest.Mock;
    subscribe: jest.Mock;
  };
  let coordinator: SyncCoordinator;

  const mockGroups: GroupDto[] = [{ id: 'g1', type: 'group', attributes: { name: 'Working' } }];

  const page1Breeds: BreedDto[] = [
    {
      id: 'b1',
      type: 'breed',
      attributes: { name: 'Akita' },
    },
    {
      id: 'b2',
      type: 'breed',
      attributes: { name: 'Boxer' },
    },
  ];

  const page2Breeds: BreedDto[] = [
    {
      id: 'b2', // Duplicate UUID to test deduplication
      type: 'breed',
      attributes: { name: 'Boxer' },
    },
    {
      id: 'b3',
      type: 'breed',
      attributes: { name: 'Chihuahua' },
    },
  ];

  beforeEach(() => {
    mockApi = {
      fetchGroups: jest.fn().mockResolvedValue(mockGroups),
      fetchBreedsPage: jest.fn().mockImplementation((pageNum: number) => {
        if (pageNum === 1) {
          return Promise.resolve({
            data: page1Breeds,
            meta: { pagination: { current: 1, last: 2, records: 3 } },
          });
        }
        if (pageNum === 2) {
          return Promise.resolve({
            data: page2Breeds,
            meta: { pagination: { current: 2, last: 2, records: 3 } },
          });
        }
        return Promise.reject(new Error('Out of bounds'));
      }),
      fetchBreedById: jest.fn().mockImplementation((id: string) => {
        return Promise.resolve({
          id,
          type: 'breed',
          attributes: { name: 'Refreshed Breed' },
        });
      }),
    };

    let persistedCount = 0;
    mockRepo = {
      getBreedCount: jest.fn().mockImplementation(async () => persistedCount),
      upsertGroups: jest.fn().mockResolvedValue(undefined),
      upsertBreeds: jest.fn().mockImplementation(async (breeds: BreedDto[]) => {
        persistedCount += breeds.length;
      }),
      getSyncMetadata: jest.fn().mockResolvedValue({
        id: 1,
        syncStatus: 'idle',
        persistedRecords: 0,
      }),
      updateSyncMetadata: jest.fn().mockResolvedValue(undefined),
    };

    mockNetwork = {
      getIsConnected: jest.fn().mockReturnValue(true),
      checkConnectivity: jest.fn().mockResolvedValue(true),
      subscribe: jest.fn().mockReturnValue(jest.fn()),
    };

    coordinator = new SyncCoordinator(
      mockApi as unknown as DogApiClient,
      mockRepo as unknown as BreedRepository,
      mockNetwork as unknown as NetworkMonitor,
    );
  });

  it('performs full sync: fetches groups, paginates dynamically, deduplicates, and updates metadata', async () => {
    const result = await coordinator.syncAll();

    expect(result.status).toBe('success');
    expect(mockApi.fetchGroups).toHaveBeenCalledTimes(1);
    expect(mockRepo.upsertGroups).toHaveBeenCalledWith(mockGroups);

    expect(mockApi.fetchBreedsPage).toHaveBeenCalledWith(1, 48, expect.any(Object));
    expect(mockApi.fetchBreedsPage).toHaveBeenCalledWith(2, 48, expect.any(Object));

    // Page 1 has 2 breeds, Page 2 has 1 unique breed (b2 was duplicate) -> total 3
    expect(mockRepo.upsertBreeds).toHaveBeenCalledTimes(2);

    expect(mockRepo.updateSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        syncStatus: 'success',
        expectedRecords: 3,
        errorMessage: undefined,
      }),
    );
  });

  it('preserves cached data when a later page fails (partial sync)', async () => {
    mockApi.fetchBreedsPage.mockImplementation((pageNum: number) => {
      if (pageNum === 1) {
        return Promise.resolve({
          data: page1Breeds,
          meta: { pagination: { current: 1, last: 3, records: 10 } },
        });
      }
      return Promise.reject(new Error('Network drop on page 2'));
    });

    const result = await coordinator.syncAll();

    expect(result.status).toBe('partial');
    // Page 1 was already upserted into SQLite!
    expect(mockRepo.upsertBreeds).toHaveBeenCalledWith(page1Breeds);

    // Metadata is updated to partial, without false lastSuccessfulAt
    expect(mockRepo.updateSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        syncStatus: 'partial',
        errorMessage: expect.stringContaining('Network drop on page 2'),
      }),
    );
  });

  it('does not wipe cache and aborts when offline', async () => {
    mockNetwork.checkConnectivity.mockResolvedValue(false);
    mockRepo.getSyncMetadata.mockResolvedValue({
      id: 1,
      syncStatus: 'success',
      persistedRecords: 50,
    });

    const result = await coordinator.syncAll();

    expect(result.error).toBe('Device is offline.');
    expect(mockApi.fetchBreedsPage).not.toHaveBeenCalled();
    expect(mockRepo.upsertBreeds).not.toHaveBeenCalled();
  });

  it('refreshes a single breed transactionally', async () => {
    const refreshed = await coordinator.refreshBreed('b1');

    expect(refreshed).toBe(true);
    expect(mockApi.fetchBreedById).toHaveBeenCalledWith('b1', {});
    expect(mockRepo.upsertBreeds).toHaveBeenCalledWith([expect.objectContaining({ id: 'b1' })]);
  });

  it('detects unexpected empty page and halts as partial without setting lastSuccessfulAt', async () => {
    mockApi.fetchBreedsPage.mockImplementation((pageNum: number) => {
      if (pageNum === 1) {
        return Promise.resolve({
          data: page1Breeds,
          meta: { pagination: { current: 1, last: 3, records: 10 } },
        });
      }
      // Unexpected empty data on page 2 before reaching last page 3
      return Promise.resolve({
        data: [],
        meta: { pagination: { current: 2, last: 3, records: 10 } },
      });
    });

    const result = await coordinator.syncAll();

    expect(result.status).toBe('partial');
    expect(mockRepo.updateSyncMetadata).toHaveBeenCalledWith(
      expect.objectContaining({
        syncStatus: 'partial',
        errorMessage: expect.stringContaining('Unexpected empty page'),
      }),
    );
  });

  it('marks sync as partial when final persisted count is less than expected count', async () => {
    // API claims 10 records, but page 1 and 2 only return 3 total
    mockApi.fetchBreedsPage.mockImplementation((pageNum: number) => {
      if (pageNum === 1) {
        return Promise.resolve({
          data: page1Breeds,
          meta: { pagination: { current: 1, last: 2, records: 10 } },
        });
      }
      return Promise.resolve({
        data: page2Breeds,
        meta: { pagination: { current: 2, last: 2, records: 10 } },
      });
    });

    const result = await coordinator.syncAll();

    expect(result.status).toBe('partial');
    expect(result.error).toContain('Incomplete sync');
    // Ensure lastSuccessfulAt was NOT set
    expect(mockRepo.updateSyncMetadata).not.toHaveBeenCalledWith(
      expect.objectContaining({
        syncStatus: 'success',
      }),
    );
  });

  it('skips auto-sync on initial subscriber notification and triggers auto-sync upon reconnect', async () => {
    jest.useFakeTimers();
    let networkCallback: ((connected: boolean) => void) | null = null;
    mockNetwork.subscribe.mockImplementation((cb: (connected: boolean) => void) => {
      networkCallback = cb;
      // NetInfo.subscribe immediately emits current state
      cb(true);
      return jest.fn();
    });

    // Reconstruct coordinator with this subscription mock
    const coord = new SyncCoordinator(
      mockApi as unknown as DogApiClient,
      mockRepo as unknown as BreedRepository,
      mockNetwork as unknown as NetworkMonitor,
    );
    expect(coord.isSynchronizing()).toBe(false);

    // Initial subscribe should NOT trigger auto-sync even after timeout
    jest.advanceTimersByTime(2000);
    expect(mockApi.fetchGroups).not.toHaveBeenCalled();

    // Now simulate reconnect (offline -> online)
    networkCallback!(false);
    networkCallback!(true);

    // Advance debounce timer (1500ms)
    jest.advanceTimersByTime(1600);

    // Wait for the async tick
    await Promise.resolve();

    expect(mockRepo.getSyncMetadata).toHaveBeenCalled();
    jest.useRealTimers();
  });
});
