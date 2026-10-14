import * as SQLite from 'expo-sqlite';
import { DatabaseClient } from '../services/database/sqliteClient';

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(),
  openDatabaseSync: jest.fn(),
}));

describe('DatabaseClient Concurrency & Locking', () => {
  let mockDb: {
    execAsync: jest.Mock;
    execSync: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = {
      execAsync: jest.fn().mockResolvedValue(undefined),
      execSync: jest.fn().mockReturnValue(undefined),
    };
    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
    (SQLite.openDatabaseSync as jest.Mock).mockReturnValue(mockDb);
  });

  it('serializes concurrent getDatabase calls to prevent concurrent schema initialization', async () => {
    const client = new DatabaseClient();

    // Trigger multiple getDatabase calls concurrently
    const [db1, db2, db3] = await Promise.all([
      client.getDatabase(),
      client.getDatabase(),
      client.getDatabase(),
    ]);

    expect(db1).toBe(mockDb);
    expect(db2).toBe(mockDb);
    expect(db3).toBe(mockDb);

    // openDatabaseAsync and execAsync should only be called once
    expect(SQLite.openDatabaseAsync).toHaveBeenCalledTimes(1);
    expect(mockDb.execAsync).toHaveBeenCalledTimes(1);

    // Verify busy_timeout PRAGMA is configured
    const initSql = mockDb.execAsync.mock.calls[0][0];
    expect(initSql).toContain('PRAGMA busy_timeout = 5000;');
    expect(initSql).toContain('PRAGMA journal_mode = WAL;');
  });

  it('retries initializeSchema if database is locked on first attempt', async () => {
    const client = new DatabaseClient();

    let attempts = 0;
    mockDb.execAsync = jest.fn().mockImplementation(async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error(
          "Call to function 'NativeDatabase.execAsync' has been rejected. → Caused by: database is locked",
        );
      }
      return undefined;
    });

    const db = await client.getDatabase();
    expect(db).toBe(mockDb);
    expect(mockDb.execAsync).toHaveBeenCalledTimes(2);
  });

  it('withWriteLock serializes concurrent write executions in FIFO order', async () => {
    const client = new DatabaseClient();
    const executionOrder: number[] = [];

    const task1 = client.withWriteLock(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      executionOrder.push(1);
      return 'task1-done';
    });

    const task2 = client.withWriteLock(async () => {
      executionOrder.push(2);
      return 'task2-done';
    });

    const task3 = client.withWriteLock(async () => {
      executionOrder.push(3);
      return 'task3-done';
    });

    const results = await Promise.all([task1, task2, task3]);

    expect(results).toEqual(['task1-done', 'task2-done', 'task3-done']);
    expect(executionOrder).toEqual([1, 2, 3]);
  });

  it('withWriteLock continues to execute next tasks even if a prior task threw an error', async () => {
    const client = new DatabaseClient();

    const failingTask = client.withWriteLock(async () => {
      throw new Error('Task 1 failed');
    });

    const succeedingTask = client.withWriteLock(async () => {
      return 'success';
    });

    await expect(failingTask).rejects.toThrow('Task 1 failed');
    const result = await succeedingTask;
    expect(result).toBe('success');
  });

  it('initializes synchronously via getDatabaseSync', () => {
    const client = new DatabaseClient();
    const db = client.getDatabaseSync();

    expect(db).toBe(mockDb);
    expect(SQLite.openDatabaseSync).toHaveBeenCalledTimes(1);
    expect(mockDb.execSync).toHaveBeenCalledTimes(1);

    const initSql = mockDb.execSync.mock.calls[0][0];
    expect(initSql).toContain('PRAGMA busy_timeout = 5000;');
    expect(initSql).toContain('PRAGMA journal_mode = WAL;');
  });

  it('resets write queue when all pending writes complete', async () => {
    const client = new DatabaseClient();

    await client.withWriteLock(async () => 'first');
    // Once idle, next withWriteLock should execute immediately without chained overhead
    const result = await client.withWriteLock(async () => 'second');
    expect(result).toBe('second');
  });
});
