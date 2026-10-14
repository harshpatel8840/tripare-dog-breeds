import { DatabaseClient, databaseClient } from '../database/sqliteClient';
import {
  Breed,
  BreedGroup,
  BreedImage,
  BreedListItem,
  BreedSection,
  SyncMetadata,
  SyncStatus,
  TraitScores,
  SizeBand,
} from '../../types/domain';
import { BreedDto, GroupDto } from '../../types/api';
import { BreedFilters } from '../../types/filters';
import { BreedGroupRow, BreedImageRow, BreedRow, SyncMetadataRow } from '../../types/database';
import { deriveSizeBand } from '../../utils/sizeBand';
import { matchesCoatFilter } from '../../utils/coatNormalizer';
import { logger } from '../../utils/logger';

export class BreedRepository {
  constructor(private client: DatabaseClient = databaseClient) {}

  public async getGroups(): Promise<BreedGroup[]> {
    const db = await this.client.getDatabase();
    const rows = await db.getAllAsync<BreedGroupRow>(
      'SELECT id, name, updated_at FROM breed_groups ORDER BY name ASC;',
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      updatedAt: r.updated_at,
    }));
  }

  public async upsertGroups(groups: GroupDto[]): Promise<void> {
    if (groups.length === 0) return;
    const db = await this.client.getDatabase();
    const now = Date.now();

    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const group of groups) {
        await txn.runAsync(
          `INSERT INTO breed_groups (id, name, updated_at)
           VALUES (?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             name = excluded.name,
             updated_at = excluded.updated_at;`,
          [group.id, group.attributes.name, now],
        );
      }
    });
    logger.debug(`[BreedRepository] Upserted ${groups.length} groups.`);
  }

  public async upsertBreeds(breedDtos: BreedDto[]): Promise<void> {
    if (breedDtos.length === 0) return;
    const db = await this.client.getDatabase();
    const now = Date.now();

    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const dto of breedDtos) {
        const attr = dto.attributes;
        const normalizedName = attr.name.trim().toLowerCase();
        const groupId = dto.relationships?.group?.data?.id ?? null;

        const sizeBand = deriveSizeBand(
          attr.male_weight ?? attr.female_weight,
          attr.male_height ?? attr.female_height,
        );

        const traitsJson = attr.traits ? JSON.stringify(attr.traits) : null;
        const temperamentJson = attr.traits?.temperament
          ? JSON.stringify(attr.traits.temperament)
          : null;
        const otherNamesJson = attr.other_names ? JSON.stringify(attr.other_names) : null;
        const recognizedByJson = attr.recognized_by ? JSON.stringify(attr.recognized_by) : null;

        // Upsert Breed
        await txn.runAsync(
          `INSERT INTO breeds (
            id, name, normalized_name, description, hypoallergenic, group_id,
            life_min, life_max, male_weight_min, male_weight_max, female_weight_min, female_weight_max,
            male_height_min, male_height_max, female_height_min, female_height_max,
            origin_era, origin_region, origin_country, coat_type, coat_length,
            traits_json, temperament_json, other_names_json, recognized_by_json,
            size_band, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            normalized_name = excluded.normalized_name,
            description = excluded.description,
            hypoallergenic = excluded.hypoallergenic,
            group_id = excluded.group_id,
            life_min = excluded.life_min,
            life_max = excluded.life_max,
            male_weight_min = excluded.male_weight_min,
            male_weight_max = excluded.male_weight_max,
            female_weight_min = excluded.female_weight_min,
            female_weight_max = excluded.female_weight_max,
            male_height_min = excluded.male_height_min,
            male_height_max = excluded.male_height_max,
            female_height_min = excluded.female_height_min,
            female_height_max = excluded.female_height_max,
            origin_era = excluded.origin_era,
            origin_region = excluded.origin_region,
            origin_country = excluded.origin_country,
            coat_type = excluded.coat_type,
            coat_length = excluded.coat_length,
            traits_json = excluded.traits_json,
            temperament_json = excluded.temperament_json,
            other_names_json = excluded.other_names_json,
            recognized_by_json = excluded.recognized_by_json,
            size_band = excluded.size_band,
            updated_at = excluded.updated_at;`,
          [
            dto.id,
            attr.name,
            normalizedName,
            attr.description ?? null,
            attr.hypoallergenic ? 1 : 0,
            groupId,
            attr.life?.min ?? null,
            attr.life?.max ?? null,
            attr.male_weight?.min ?? null,
            attr.male_weight?.max ?? null,
            attr.female_weight?.min ?? null,
            attr.female_weight?.max ?? null,
            attr.male_height?.min ?? null,
            attr.male_height?.max ?? null,
            attr.female_height?.min ?? null,
            attr.female_height?.max ?? null,
            attr.origin?.era ?? null,
            attr.origin?.region ?? null,
            attr.origin?.country ?? null,
            attr.coat?.type ?? null,
            attr.coat?.length ?? null,
            traitsJson,
            temperamentJson,
            otherNamesJson,
            recognizedByJson,
            sizeBand,
            now,
          ],
        );

        // Upsert images while preserving local_path and file_size if already cached
        if (attr.images && attr.images.length > 0) {
          for (let i = 0; i < attr.images.length; i++) {
            const img = attr.images[i];
            await txn.runAsync(
              `INSERT INTO breed_images (
                id, breed_id, display_order, url, thumb_url, medium_url, large_url,
                author, license, license_url, source, source_url,
                updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
              ON CONFLICT(id) DO UPDATE SET
                breed_id = excluded.breed_id,
                display_order = excluded.display_order,
                url = excluded.url,
                thumb_url = excluded.thumb_url,
                medium_url = excluded.medium_url,
                large_url = excluded.large_url,
                author = excluded.author,
                license = excluded.license,
                license_url = excluded.license_url,
                source = excluded.source,
                source_url = excluded.source_url,
                updated_at = excluded.updated_at;`,
              [
                img.id,
                dto.id,
                i,
                img.url,
                img.thumb ?? null,
                img.medium ?? null,
                img.large ?? null,
                img.attribution?.author ?? null,
                img.attribution?.license ?? null,
                img.attribution?.license_url ?? null,
                img.attribution?.source ?? null,
                img.attribution?.source_url ?? null,
                now,
              ],
            );
          }
        }
      }
    });

    logger.debug(`[BreedRepository] Upserted ${breedDtos.length} breeds.`);
  }

  public async getBreedCount(): Promise<number> {
    const db = await this.client.getDatabase();
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM breeds;',
    );
    return result?.count ?? 0;
  }

  /**
   * Optimized SectionList query: returns lightweight projections grouped by breed group.
   */
  public async getBreedSections(filters: BreedFilters): Promise<BreedSection[]> {
    const db = await this.client.getDatabase();

    // Query lightweight projection joining groups and first image thumb
    const rows = await db.getAllAsync<{
      id: string;
      name: string;
      group_id: string | null;
      group_name: string | null;
      thumb_url: string | null;
      hypoallergenic: number;
      size_band: string;
      coat_type: string | null;
      coat_length: string | null;
      life_min: number | null;
      life_max: number | null;
      male_weight_min: number | null;
      male_weight_max: number | null;
      female_weight_min: number | null;
      female_weight_max: number | null;
      other_names_json: string | null;
      traits_json: string | null;
    }>(`
      SELECT
        b.id,
        b.name,
        b.group_id,
        COALESCE(g.name, 'Other Breeds') AS group_name,
        (
          SELECT COALESCE(img.thumb_url, img.url)
          FROM breed_images img
          WHERE img.breed_id = b.id
          ORDER BY img.display_order ASC
          LIMIT 1
        ) AS thumb_url,
        b.hypoallergenic,
        b.size_band,
        b.coat_type,
        b.coat_length,
        b.life_min,
        b.life_max,
        b.male_weight_min,
        b.male_weight_max,
        b.female_weight_min,
        b.female_weight_max,
        b.other_names_json,
        b.traits_json
      FROM breeds b
      LEFT JOIN breed_groups g ON b.group_id = g.id
      ORDER BY group_name ASC, b.name ASC;
    `);

    const query = filters.searchQuery.trim().toLowerCase();

    // In-memory filter evaluation on projected items for fast client interaction
    const filteredItems: BreedListItem[] = [];

    for (const row of rows) {
      // 1. Group Filter
      if (filters.groupIds.length > 0) {
        if (!row.group_id || !filters.groupIds.includes(row.group_id)) {
          continue;
        }
      }

      // 2. Hypoallergenic Filter
      if (filters.hypoallergenic === 'yes' && row.hypoallergenic !== 1) {
        continue;
      }
      if (filters.hypoallergenic === 'no' && row.hypoallergenic !== 0) {
        continue;
      }

      // 3. Size Band Filter
      if (filters.sizeBands.length > 0) {
        if (!filters.sizeBands.includes(row.size_band as SizeBand)) {
          continue;
        }
      }

      // 4. Coat Length Filter (with wire normalization)
      if (filters.coatLengths.length > 0) {
        if (!matchesCoatFilter(filters.coatLengths, row.coat_type, row.coat_length)) {
          continue;
        }
      }

      // 5. Search Filter (checks breed name AND other_names)
      if (query.length > 0) {
        const nameMatches = row.name.toLowerCase().includes(query);
        let otherNameMatches = false;
        if (!nameMatches && row.other_names_json) {
          try {
            const otherNames: string[] = JSON.parse(row.other_names_json);
            otherNameMatches = otherNames.some((on) => on.toLowerCase().includes(query));
          } catch {
            otherNameMatches = false;
          }
        }
        if (!nameMatches && !otherNameMatches) {
          continue;
        }
      }

      // 6. Trait Threshold Filters
      if (
        filters.minChildrenScore !== null ||
        filters.minDogsScore !== null ||
        filters.minStrangersScore !== null
      ) {
        if (!row.traits_json) {
          continue; // Missing traits do not pass explicit threshold filters
        }
        try {
          const rawTraits = JSON.parse(row.traits_json);
          const goodWithChildren = rawTraits.good_with_children ?? rawTraits.goodWithChildren;
          const goodWithDogs = rawTraits.good_with_dogs ?? rawTraits.goodWithDogs;
          const goodWithStrangers = rawTraits.good_with_strangers ?? rawTraits.goodWithStrangers;

          if (
            filters.minChildrenScore !== null &&
            (goodWithChildren == null || goodWithChildren < filters.minChildrenScore)
          ) {
            continue;
          }
          if (
            filters.minDogsScore !== null &&
            (goodWithDogs == null || goodWithDogs < filters.minDogsScore)
          ) {
            continue;
          }
          if (
            filters.minStrangersScore !== null &&
            (goodWithStrangers == null || goodWithStrangers < filters.minStrangersScore)
          ) {
            continue;
          }
        } catch {
          continue;
        }
      }

      const weightMin = row.male_weight_min ?? row.female_weight_min ?? undefined;
      const weightMax = row.male_weight_max ?? row.female_weight_max ?? undefined;

      filteredItems.push({
        id: row.id,
        name: row.name,
        groupId: row.group_id ?? 'other',
        groupName: row.group_name ?? 'Other Breeds',
        thumbUrl: row.thumb_url ?? undefined,
        hypoallergenic: row.hypoallergenic === 1,
        sizeBand: row.size_band as SizeBand,
        coatLength: row.coat_length ?? undefined,
        lifeMin: row.life_min ?? undefined,
        lifeMax: row.life_max ?? undefined,
        weightMin,
        weightMax,
      });
    }

    // Group into sections by groupName
    const sectionsMap = new Map<string, BreedListItem[]>();
    for (const item of filteredItems) {
      const groupKey = item.groupName;
      if (!sectionsMap.has(groupKey)) {
        sectionsMap.set(groupKey, []);
      }
      sectionsMap.get(groupKey)!.push(item);
    }

    const sections: BreedSection[] = [];
    sectionsMap.forEach((data, title) => {
      sections.push({
        title,
        groupId: data[0]?.groupId ?? 'other',
        data,
      });
    });

    return sections;
  }

  /**
   * Fetches full breed details with images and group info.
   */
  public async getBreedById(id: string): Promise<Breed | null> {
    const db = await this.client.getDatabase();

    const row = await db.getFirstAsync<BreedRow & { group_name: string | null }>(
      `SELECT b.*, g.name as group_name
       FROM breeds b
       LEFT JOIN breed_groups g ON b.group_id = g.id
       WHERE b.id = ?;`,
      [id],
    );

    if (!row) return null;

    const imgRows = await db.getAllAsync<BreedImageRow>(
      `SELECT * FROM breed_images
       WHERE breed_id = ?
       ORDER BY display_order ASC;`,
      [id],
    );

    const images: BreedImage[] = imgRows.map((img) => ({
      id: img.id,
      breedId: img.breed_id,
      url: img.url,
      thumbUrl: img.thumb_url ?? undefined,
      mediumUrl: img.medium_url ?? undefined,
      largeUrl: img.large_url ?? undefined,
      attribution: {
        author: img.author ?? undefined,
        license: img.license ?? undefined,
        licenseUrl: img.license_url ?? undefined,
        source: img.source ?? undefined,
        sourceUrl: img.source_url ?? undefined,
      },
      localPath: img.local_path ?? undefined,
      fileSize: img.file_size ?? undefined,
      lastAccessedAt: img.last_accessed_at ?? undefined,
    }));

    let traits: TraitScores | undefined;
    if (row.traits_json) {
      try {
        const raw = JSON.parse(row.traits_json);
        traits = {
          energy: raw.energy,
          barking: raw.barking,
          drooling: raw.drooling,
          grooming: raw.grooming,
          shedding: raw.shedding,
          trainability: raw.trainability,
          goodWithDogs: raw.good_with_dogs,
          exerciseMinutes: raw.exercise_minutes,
          apartmentFriendly: raw.apartment_friendly,
          goodWithChildren: raw.good_with_children,
          goodWithStrangers: raw.good_with_strangers,
          temperament: raw.temperament,
        };
      } catch {
        traits = undefined;
      }
    }

    let otherNames: string[] | undefined;
    if (row.other_names_json) {
      try {
        otherNames = JSON.parse(row.other_names_json);
      } catch {
        otherNames = undefined;
      }
    }

    let recognizedBy: string[] | undefined;
    if (row.recognized_by_json) {
      try {
        recognizedBy = JSON.parse(row.recognized_by_json);
      } catch {
        recognizedBy = undefined;
      }
    }

    return {
      id: row.id,
      name: row.name,
      normalizedName: row.normalized_name,
      description: row.description ?? undefined,
      hypoallergenic: row.hypoallergenic === 1,
      groupId: row.group_id ?? undefined,
      groupName: row.group_name ?? 'Other Breeds',
      life: { min: row.life_min ?? undefined, max: row.life_max ?? undefined },
      maleWeight: { min: row.male_weight_min ?? undefined, max: row.male_weight_max ?? undefined },
      femaleWeight: {
        min: row.female_weight_min ?? undefined,
        max: row.female_weight_max ?? undefined,
      },
      maleHeight: { min: row.male_height_min ?? undefined, max: row.male_height_max ?? undefined },
      femaleHeight: {
        min: row.female_height_min ?? undefined,
        max: row.female_height_max ?? undefined,
      },
      origin: {
        era: row.origin_era ?? undefined,
        region: row.origin_region ?? undefined,
        country: row.origin_country ?? undefined,
      },
      coat: {
        type: row.coat_type ?? undefined,
        length: row.coat_length ?? undefined,
      },
      traits,
      otherNames,
      recognizedBy,
      images,
      sizeBand: row.size_band as SizeBand,
      updatedAt: row.updated_at,
    };
  }

  public async getSyncMetadata(): Promise<SyncMetadata> {
    const db = await this.client.getDatabase();
    const row = await db.getFirstAsync<SyncMetadataRow>(
      'SELECT * FROM sync_metadata WHERE id = 1;',
    );

    if (!row) {
      return {
        id: 1,
        syncStatus: 'idle',
        persistedRecords: 0,
      };
    }

    return {
      id: row.id,
      lastAttemptedAt: row.last_attempted_at ?? undefined,
      lastSuccessfulAt: row.last_successful_at ?? undefined,
      syncStatus: (row.sync_status as SyncStatus) || 'idle',
      expectedRecords: row.expected_records ?? undefined,
      persistedRecords: row.persisted_records,
      errorMessage: row.error_message ?? undefined,
    };
  }

  public async updateSyncMetadata(update: Partial<SyncMetadata>): Promise<void> {
    const db = await this.client.getDatabase();
    const current = await this.getSyncMetadata();

    const lastAttemptedAt =
      update.lastAttemptedAt !== undefined
        ? update.lastAttemptedAt
        : (current.lastAttemptedAt ?? null);
    const lastSuccessfulAt =
      update.lastSuccessfulAt !== undefined
        ? update.lastSuccessfulAt
        : (current.lastSuccessfulAt ?? null);
    const syncStatus = update.syncStatus !== undefined ? update.syncStatus : current.syncStatus;
    const expectedRecords =
      update.expectedRecords !== undefined
        ? update.expectedRecords
        : (current.expectedRecords ?? null);
    const persistedRecords =
      update.persistedRecords !== undefined ? update.persistedRecords : current.persistedRecords;
    const errorMessage =
      update.errorMessage !== undefined ? update.errorMessage : (current.errorMessage ?? null);

    await db.runAsync(
      `INSERT INTO sync_metadata (id, last_attempted_at, last_successful_at, sync_status, expected_records, persisted_records, error_message)
       VALUES (1, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         last_attempted_at = excluded.last_attempted_at,
         last_successful_at = excluded.last_successful_at,
         sync_status = excluded.sync_status,
         expected_records = excluded.expected_records,
         persisted_records = excluded.persisted_records,
         error_message = excluded.error_message;`,
      [
        lastAttemptedAt,
        lastSuccessfulAt,
        syncStatus,
        expectedRecords,
        persistedRecords,
        errorMessage,
      ],
    );
  }
}

export const breedRepository = new BreedRepository();
