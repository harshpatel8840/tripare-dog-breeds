import * as SQLite from 'expo-sqlite';
import { logger } from '../../utils/logger';

const DB_NAME = 'dog_breeds.db';

export class DatabaseClient {
  private db: SQLite.SQLiteDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private pendingWrites = 0;

  public async getDatabase(): Promise<SQLite.SQLiteDatabase> {
    if (this.db && this.isInitialized) {
      return this.db;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        if (!this.db) {
          this.db = await SQLite.openDatabaseAsync(DB_NAME);
        }
        if (!this.isInitialized) {
          await this.initializeSchema(this.db);
          this.isInitialized = true;
        }
        return this.db;
      } finally {
        this.initPromise = null;
      }
    })();

    return this.initPromise;
  }

  /**
   * Serializes write operations to prevent concurrent write lock contention.
   */
  public async withWriteLock<T>(action: () => Promise<T>): Promise<T> {
    this.pendingWrites++;
    let release: () => void;
    const waitPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentQueue = this.writeQueue;
    this.writeQueue = this.writeQueue.then(
      () => waitPromise,
      () => waitPromise,
    );
    try {
      await currentQueue;
    } catch {
      // Continue even if previous write operation failed
    }
    try {
      return await action();
    } finally {
      this.pendingWrites--;
      if (this.pendingWrites === 0) {
        this.writeQueue = Promise.resolve();
      }
      release!();
    }
  }

  /**
   * For synchronous access when database is already initialized.
   */
  public getDatabaseSync(): SQLite.SQLiteDatabase {
    if (!this.db) {
      this.db = SQLite.openDatabaseSync(DB_NAME);
    }
    if (!this.isInitialized) {
      this.initializeSchemaSync(this.db);
      this.isInitialized = true;
    }
    return this.db;
  }

  public async initialize(): Promise<void> {
    await this.getDatabase();
  }

  private async initializeSchema(db: SQLite.SQLiteDatabase): Promise<void> {
    logger.info('[DatabaseClient] Initializing database schema...');

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await db.execAsync(`
          PRAGMA busy_timeout = 5000;
          PRAGMA journal_mode = WAL;
          PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS breed_groups (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS breeds (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        description TEXT,
        hypoallergenic INTEGER NOT NULL DEFAULT 0,
        group_id TEXT,
        life_min REAL,
        life_max REAL,
        male_weight_min REAL,
        male_weight_max REAL,
        female_weight_min REAL,
        female_weight_max REAL,
        male_height_min REAL,
        male_height_max REAL,
        female_height_min REAL,
        female_height_max REAL,
        origin_era TEXT,
        origin_region TEXT,
        origin_country TEXT,
        coat_type TEXT,
        coat_length TEXT,
        traits_json TEXT,
        temperament_json TEXT,
        other_names_json TEXT,
        recognized_by_json TEXT,
        size_band TEXT NOT NULL DEFAULT 'unknown',
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES breed_groups(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_breeds_group_id ON breeds(group_id);
      CREATE INDEX IF NOT EXISTS idx_breeds_normalized_name ON breeds(normalized_name);
      CREATE INDEX IF NOT EXISTS idx_breeds_hypoallergenic ON breeds(hypoallergenic);
      CREATE INDEX IF NOT EXISTS idx_breeds_size_band ON breeds(size_band);

      CREATE TABLE IF NOT EXISTS breed_images (
        id TEXT PRIMARY KEY NOT NULL,
        breed_id TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        url TEXT NOT NULL,
        thumb_url TEXT,
        medium_url TEXT,
        large_url TEXT,
        author TEXT,
        license TEXT,
        license_url TEXT,
        source TEXT,
        source_url TEXT,
        local_path TEXT,
        file_size INTEGER,
        last_accessed_at INTEGER,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (breed_id) REFERENCES breeds(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_breed_images_breed_id ON breed_images(breed_id);
      CREATE INDEX IF NOT EXISTS idx_breed_images_last_accessed ON breed_images(last_accessed_at);
      CREATE INDEX IF NOT EXISTS idx_breed_images_local_path ON breed_images(local_path);

      CREATE TABLE IF NOT EXISTS image_cache_entries (
        cache_key TEXT PRIMARY KEY NOT NULL,
        image_id TEXT NOT NULL,
        variant TEXT NOT NULL,
        url TEXT NOT NULL,
        local_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        last_accessed_at INTEGER NOT NULL,
        FOREIGN KEY (image_id) REFERENCES breed_images(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_image_cache_access ON image_cache_entries(last_accessed_at);
      CREATE INDEX IF NOT EXISTS idx_image_cache_image_id ON image_cache_entries(image_id);

      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_attempted_at INTEGER,
        last_successful_at INTEGER,
        sync_status TEXT NOT NULL,
        expected_records INTEGER,
        persisted_records INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      );

      INSERT OR IGNORE INTO sync_metadata (id, sync_status, persisted_records)
      VALUES (1, 'idle', 0);
    `);

        logger.info('[DatabaseClient] Database schema initialized successfully.');
        return;
      } catch (err: unknown) {
        const isLocked =
          err instanceof Error &&
          (err.message.includes('database is locked') || err.message.includes('busy'));
        if (isLocked && attempt < maxRetries) {
          logger.warn(
            `[DatabaseClient] Database locked during init (attempt ${attempt}/${maxRetries}), retrying in ${attempt * 200}ms...`,
          );
          await new Promise((resolve) => setTimeout(resolve, attempt * 200));
        } else {
          throw err;
        }
      }
    }
  }

  private initializeSchemaSync(db: SQLite.SQLiteDatabase): void {
    db.execSync(`
      PRAGMA busy_timeout = 5000;
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS breed_groups (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS breeds (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        normalized_name TEXT NOT NULL,
        description TEXT,
        hypoallergenic INTEGER NOT NULL DEFAULT 0,
        group_id TEXT,
        life_min REAL,
        life_max REAL,
        male_weight_min REAL,
        male_weight_max REAL,
        female_weight_min REAL,
        female_weight_max REAL,
        male_height_min REAL,
        male_height_max REAL,
        female_height_min REAL,
        female_height_max REAL,
        origin_era TEXT,
        origin_region TEXT,
        origin_country TEXT,
        coat_type TEXT,
        coat_length TEXT,
        traits_json TEXT,
        temperament_json TEXT,
        other_names_json TEXT,
        recognized_by_json TEXT,
        size_band TEXT NOT NULL DEFAULT 'unknown',
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (group_id) REFERENCES breed_groups(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_breeds_group_id ON breeds(group_id);
      CREATE INDEX IF NOT EXISTS idx_breeds_normalized_name ON breeds(normalized_name);
      CREATE INDEX IF NOT EXISTS idx_breeds_hypoallergenic ON breeds(hypoallergenic);
      CREATE INDEX IF NOT EXISTS idx_breeds_size_band ON breeds(size_band);

      CREATE TABLE IF NOT EXISTS breed_images (
        id TEXT PRIMARY KEY NOT NULL,
        breed_id TEXT NOT NULL,
        display_order INTEGER NOT NULL,
        url TEXT NOT NULL,
        thumb_url TEXT,
        medium_url TEXT,
        large_url TEXT,
        author TEXT,
        license TEXT,
        license_url TEXT,
        source TEXT,
        source_url TEXT,
        local_path TEXT,
        file_size INTEGER,
        last_accessed_at INTEGER,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (breed_id) REFERENCES breeds(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_breed_images_breed_id ON breed_images(breed_id);
      CREATE INDEX IF NOT EXISTS idx_breed_images_last_accessed ON breed_images(last_accessed_at);
      CREATE INDEX IF NOT EXISTS idx_breed_images_local_path ON breed_images(local_path);

      CREATE TABLE IF NOT EXISTS image_cache_entries (
        cache_key TEXT PRIMARY KEY NOT NULL,
        image_id TEXT NOT NULL,
        variant TEXT NOT NULL,
        url TEXT NOT NULL,
        local_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        last_accessed_at INTEGER NOT NULL,
        FOREIGN KEY (image_id) REFERENCES breed_images(id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_image_cache_sync_access ON image_cache_entries(last_accessed_at);
      CREATE INDEX IF NOT EXISTS idx_image_cache_sync_image_id ON image_cache_entries(image_id);

      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        last_attempted_at INTEGER,
        last_successful_at INTEGER,
        sync_status TEXT NOT NULL,
        expected_records INTEGER,
        persisted_records INTEGER NOT NULL DEFAULT 0,
        error_message TEXT
      );

      INSERT OR IGNORE INTO sync_metadata (id, sync_status, persisted_records)
      VALUES (1, 'idle', 0);
    `);
  }
}

declare global {
  var __tripare_db_client__: DatabaseClient | undefined;
}

export const databaseClient = globalThis.__tripare_db_client__ ?? new DatabaseClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__tripare_db_client__ = databaseClient;
}
