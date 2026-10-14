import { BreedRepository } from '../services/repositories/breedRepository';
import { DatabaseClient } from '../services/database/sqliteClient';
import { INITIAL_FILTERS } from '../types/filters';
import { BreedDto, GroupDto } from '../types/api';

describe('BreedRepository', () => {
  let mockDb: {
    getAllAsync: jest.Mock;
    getFirstAsync: jest.Mock;
    runAsync: jest.Mock;
    withExclusiveTransactionAsync: jest.Mock;
  };
  let mockClient: {
    getDatabase: jest.Mock;
    getDatabaseSync: jest.Mock;
    initialize: jest.Mock;
  };
  let repo: BreedRepository;

  beforeEach(() => {
    // In-memory mock SQLite database simulator
    const tables = {
      breed_groups: new Map<string, Record<string, unknown>>(),
      breeds: new Map<string, Record<string, unknown>>(),
      breed_images: new Map<string, Record<string, unknown>>(),
      sync_metadata: new Map<number, Record<string, unknown>>([
        [1, { id: 1, sync_status: 'idle', persisted_records: 0 }],
      ]),
    };

    mockDb = {
      getAllAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes('FROM breed_groups')) {
          return Array.from(tables.breed_groups.values());
        }
        if (sql.includes('FROM breeds b') && sql.includes('LEFT JOIN breed_groups')) {
          return Array.from(tables.breeds.values()).map((b) => {
            const group = tables.breed_groups.get(b.group_id as string);
            const image = Array.from(tables.breed_images.values()).find(
              (img) => img.breed_id === b.id,
            );
            return {
              id: b.id,
              name: b.name,
              group_id: b.group_id,
              group_name: group?.name ?? 'Other Breeds',
              thumb_url: image?.thumb_url ?? image?.url ?? null,
              hypoallergenic: b.hypoallergenic,
              size_band: b.size_band,
              coat_type: b.coat_type,
              coat_length: b.coat_length,
              life_min: b.life_min,
              life_max: b.life_max,
              male_weight_min: b.male_weight_min,
              male_weight_max: b.male_weight_max,
              female_weight_min: b.female_weight_min,
              female_weight_max: b.female_weight_max,
              other_names_json: b.other_names_json,
              traits_json: b.traits_json,
            };
          });
        }
        if (sql.includes('FROM breed_images') && sql.includes('WHERE breed_id = ?')) {
          return Array.from(tables.breed_images.values()).filter(
            (img) => img.breed_id === params[0],
          );
        }
        return [];
      }),
      getFirstAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes('COUNT(*) as count FROM breeds')) {
          return { count: tables.breeds.size };
        }
        if (sql.includes('FROM sync_metadata WHERE id = 1')) {
          return tables.sync_metadata.get(1);
        }
        if (sql.includes('FROM breeds b') && sql.includes('WHERE b.id = ?')) {
          const b = tables.breeds.get(params[0] as string);
          if (!b) return null;
          const group = tables.breed_groups.get(b.group_id as string);
          return { ...b, group_name: group?.name ?? 'Other Breeds' };
        }
        return null;
      }),
      runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
        if (sql.includes('INSERT INTO breed_groups')) {
          tables.breed_groups.set(params[0] as string, {
            id: params[0],
            name: params[1],
            updated_at: params[2],
          });
        }
        if (sql.includes('INSERT INTO sync_metadata')) {
          tables.sync_metadata.set(1, {
            id: 1,
            last_attempted_at: params[0],
            last_successful_at: params[1],
            sync_status: params[2],
            expected_records: params[3],
            persisted_records: params[4],
            error_message: params[5],
          });
        }
        return { changes: 1 };
      }),
      withExclusiveTransactionAsync: jest.fn(
        async (fn: (txn: { runAsync: jest.Mock }) => Promise<void>) => {
          const txn = {
            runAsync: jest.fn(async (sql: string, params: unknown[] = []) => {
              if (sql.includes('INSERT INTO breed_groups')) {
                tables.breed_groups.set(params[0] as string, {
                  id: params[0],
                  name: params[1],
                  updated_at: params[2],
                });
              } else if (sql.includes('INSERT INTO breeds')) {
                tables.breeds.set(params[0] as string, {
                  id: params[0],
                  name: params[1],
                  normalized_name: params[2],
                  description: params[3],
                  hypoallergenic: params[4],
                  group_id: params[5],
                  life_min: params[6],
                  life_max: params[7],
                  male_weight_min: params[8],
                  male_weight_max: params[9],
                  female_weight_min: params[10],
                  female_weight_max: params[11],
                  male_height_min: params[12],
                  male_height_max: params[13],
                  female_height_min: params[14],
                  female_height_max: params[15],
                  origin_era: params[16],
                  origin_region: params[17],
                  origin_country: params[18],
                  coat_type: params[19],
                  coat_length: params[20],
                  traits_json: params[21],
                  temperament_json: params[22],
                  other_names_json: params[23],
                  recognized_by_json: params[24],
                  size_band: params[25],
                  updated_at: params[26],
                });
              } else if (sql.includes('INSERT INTO breed_images')) {
                tables.breed_images.set(params[0] as string, {
                  id: params[0],
                  breed_id: params[1],
                  display_order: params[2],
                  url: params[3],
                  thumb_url: params[4],
                  medium_url: params[5],
                  large_url: params[6],
                  author: params[7],
                  license: params[8],
                  license_url: params[9],
                  source: params[10],
                  source_url: params[11],
                  updated_at: params[12],
                });
              }
            }),
          };
          await fn(txn);
        },
      ),
    };

    mockClient = {
      getDatabase: jest.fn().mockResolvedValue(mockDb),
      getDatabaseSync: jest.fn().mockReturnValue(mockDb),
      initialize: jest.fn().mockResolvedValue(undefined),
    };

    repo = new BreedRepository(mockClient as unknown as DatabaseClient);
  });

  it('upserts and retrieves breed groups', async () => {
    const groups: GroupDto[] = [
      {
        id: 'group-1',
        type: 'group',
        attributes: { name: 'Working Group' },
      },
      {
        id: 'group-2',
        type: 'group',
        attributes: { name: 'Toy Group' },
      },
    ];

    await repo.upsertGroups(groups);
    const result = await repo.getGroups();

    expect(result.length).toBe(2);
    expect(result.find((g) => g.id === 'group-1')?.name).toBe('Working Group');
  });

  it('upserts breeds and maintains idempotency upon repeat sync', async () => {
    const sampleBreed: BreedDto = {
      id: 'breed-1',
      type: 'breed',
      attributes: {
        name: 'Affenpinscher',
        description: 'Small monkey terrier.',
        hypoallergenic: true,
        life: { min: 14, max: 16 },
        male_weight: { min: 4, max: 6 },
        coat: { type: 'wire', length: 'short' },
        traits: {
          energy: 3,
          good_with_children: 3,
          good_with_dogs: 3,
          good_with_strangers: 2,
          exercise_minutes: 30,
        },
        other_names: ['Monkey Terrier', 'Affen'],
        images: [
          {
            id: 'img-1',
            url: 'https://images.dogapi.dog/img-1.jpg',
            thumb: 'https://images.dogapi.dog/thumb-1.jpg',
            attribution: { author: 'Photographer', license: 'CC BY 2.0' },
          },
        ],
      },
      relationships: {
        group: { data: { id: 'group-2', type: 'group' } },
      },
    };

    // First upsert
    await repo.upsertBreeds([sampleBreed]);
    expect(await repo.getBreedCount()).toBe(1);

    // Repeat upsert (idempotent)
    await repo.upsertBreeds([sampleBreed]);
    expect(await repo.getBreedCount()).toBe(1);

    const fetched = await repo.getBreedById('breed-1');
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Affenpinscher');
    expect(fetched?.hypoallergenic).toBe(true);
    expect(fetched?.sizeBand).toBe('small');
    expect(fetched?.images?.length).toBe(1);
    expect(fetched?.images?.[0].attribution?.author).toBe('Photographer');
  });

  it('filters breeds by search query matching alternate names', async () => {
    const breed1: BreedDto = {
      id: 'breed-1',
      type: 'breed',
      attributes: {
        name: 'Affenpinscher',
        other_names: ['Monkey Terrier'],
        hypoallergenic: true,
      },
    };
    const breed2: BreedDto = {
      id: 'breed-2',
      type: 'breed',
      attributes: {
        name: 'Beagle',
        other_names: ['English Beagle'],
        hypoallergenic: false,
      },
    };

    await repo.upsertBreeds([breed1, breed2]);

    // Search for "monkey" (present in breed1 other_names)
    const sections = await repo.getBreedSections({
      ...INITIAL_FILTERS,
      searchQuery: 'monkey',
    });

    const matchingItems = sections.flatMap((s) => s.data);
    expect(matchingItems.length).toBe(1);
    expect(matchingItems[0].name).toBe('Affenpinscher');
  });

  it('filters breeds by multi-select hypoallergenic options', async () => {
    const hypoBreed: BreedDto = {
      id: 'b-hypo',
      type: 'breed',
      attributes: {
        name: 'Poodle',
        hypoallergenic: true,
      },
    };
    const nonHypoBreed: BreedDto = {
      id: 'b-non-hypo',
      type: 'breed',
      attributes: {
        name: 'German Shepherd',
        hypoallergenic: false,
      },
    };

    await repo.upsertBreeds([hypoBreed, nonHypoBreed]);

    // Select 'yes'
    const yesSections = await repo.getBreedSections({
      ...INITIAL_FILTERS,
      hypoallergenic: ['yes'],
    });
    const yesItems = yesSections.flatMap((s) => s.data);
    expect(yesItems.length).toBe(1);
    expect(yesItems[0].name).toBe('Poodle');

    // Select 'no'
    const noSections = await repo.getBreedSections({
      ...INITIAL_FILTERS,
      hypoallergenic: ['no'],
    });
    const noItems = noSections.flatMap((s) => s.data);
    expect(noItems.length).toBe(1);
    expect(noItems[0].name).toBe('German Shepherd');

    // Multi-select both 'yes' and 'no' -> both match
    const bothSections = await repo.getBreedSections({
      ...INITIAL_FILTERS,
      hypoallergenic: ['yes', 'no'],
    });
    const bothItems = bothSections.flatMap((s) => s.data);
    expect(bothItems.length).toBe(2);
  });

  it('filters breeds by multi-select size and coat wire mapping', async () => {
    const smallWireBreed: BreedDto = {
      id: 'b-1',
      type: 'breed',
      attributes: {
        name: 'Wire Fox Terrier',
        male_weight: { min: 7, max: 9 }, // small (<= 10)
        coat: { type: 'wire', length: 'short' }, // matches 'wire'
      },
    };
    const giantShortBreed: BreedDto = {
      id: 'b-2',
      type: 'breed',
      attributes: {
        name: 'Great Dane',
        male_weight: { min: 50, max: 70 }, // giant (> 45)
        coat: { type: 'smooth', length: 'short' }, // matches 'short'
      },
    };

    await repo.upsertBreeds([smallWireBreed, giantShortBreed]);

    // Filter by 'wire' coat
    const wireSections = await repo.getBreedSections({
      ...INITIAL_FILTERS,
      coatLengths: ['wire'],
    });
    const wireItems = wireSections.flatMap((s) => s.data);
    expect(wireItems.length).toBe(1);
    expect(wireItems[0].name).toBe('Wire Fox Terrier');

    // Filter by 'giant' size
    const giantSections = await repo.getBreedSections({
      ...INITIAL_FILTERS,
      sizeBands: ['giant'],
    });
    const giantItems = giantSections.flatMap((s) => s.data);
    expect(giantItems.length).toBe(1);
    expect(giantItems[0].name).toBe('Great Dane');
  });

  it('filters breeds by trait minimum thresholds without treating missing scores as zero', async () => {
    const breedWithScores: BreedDto = {
      id: 'b-score',
      type: 'breed',
      attributes: {
        name: 'Labrador',
        traits: { good_with_children: 5, good_with_dogs: 4 },
      },
    };
    const breedMissingScores: BreedDto = {
      id: 'b-missing',
      type: 'breed',
      attributes: {
        name: 'Unknown Pup',
        traits: {}, // missing good_with_children
      },
    };

    await repo.upsertBreeds([breedWithScores, breedMissingScores]);

    // Threshold >= 4 on good_with_children
    const sections = await repo.getBreedSections({
      ...INITIAL_FILTERS,
      minChildrenScore: 4,
    });
    const items = sections.flatMap((s) => s.data);

    expect(items.length).toBe(1);
    expect(items[0].name).toBe('Labrador');
  });

  it('updates and retrieves sync metadata correctly', async () => {
    await repo.updateSyncMetadata({
      syncStatus: 'partial',
      persistedRecords: 48,
      expectedRecords: 283,
      errorMessage: 'Network timeout on page 2',
    });

    const meta = await repo.getSyncMetadata();
    expect(meta.syncStatus).toBe('partial');
    expect(meta.persistedRecords).toBe(48);
    expect(meta.expectedRecords).toBe(283);
    expect(meta.errorMessage).toBe('Network timeout on page 2');
  });
});
