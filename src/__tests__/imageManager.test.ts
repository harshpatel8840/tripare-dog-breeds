import { ImageManager } from '../services/images/imageManager';
import { DatabaseClient } from '../services/database/sqliteClient';

// Mock File and Directory from expo-file-system
jest.mock('expo-file-system', () => {
  const mockDelete = jest.fn();
  const mockCreate = jest.fn();

  class MockFile {
    uri: string;
    exists = true;
    size = 1024 * 1024; // 1 MB
    constructor(...uris: (string | { uri: string })[]) {
      this.uri = uris.map((u) => (typeof u === 'string' ? u : u.uri)).join('/');
    }
    delete = mockDelete;
    static downloadFileAsync = jest
      .fn()
      .mockImplementation(async (url: string, dest: { uri?: string }) => {
        return {
          uri: dest.uri || `file:///cache/mock_${url.slice(-10)}`,
          size: 1024 * 1024, // 1 MB
        };
      });
  }

  class MockDirectory {
    uri = 'file:///cache/dog_images';
    exists = true;
    create = mockCreate;
    delete = mockDelete;
    constructor(..._args: unknown[]) {}
  }

  return {
    Paths: {
      cache: new MockDirectory(),
      document: new MockDirectory(),
    },
    File: MockFile,
    Directory: MockDirectory,
  };
});

describe('ImageManager', () => {
  let mockDb: {
    getFirstAsync: jest.Mock;
    getAllAsync: jest.Mock;
    runAsync: jest.Mock;
  };
  let mockClient: {
    getDatabase: jest.Mock;
  };
  let manager: ImageManager;

  beforeEach(() => {
    mockDb = {
      getFirstAsync: jest.fn(),
      getAllAsync: jest.fn(),
      runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
    };

    mockClient = {
      getDatabase: jest.fn().mockResolvedValue(mockDb),
    };

    manager = new ImageManager(mockClient as unknown as DatabaseClient);
  });

  it('initializes with default or configurable byte limit', () => {
    // 150 MB * 1024 * 1024 = 157,286,400 bytes
    expect(manager.getCacheLimitBytes()).toBe(150 * 1024 * 1024);

    manager.setCacheLimitBytes(50 * 1024 * 1024);
    expect(manager.getCacheLimitBytes()).toBe(50 * 1024 * 1024);
  });

  it('triggers LRU eviction when cache exceeds budget and protects active images', async () => {
    // Set 2 MB budget (2 * 1024 * 1024 bytes)
    manager.setCacheLimitBytes(2 * 1024 * 1024);

    // Total bytes = 5 MB (excess = 3 MB)
    mockDb.getFirstAsync.mockResolvedValueOnce({
      total_bytes: 5 * 1024 * 1024,
    });

    // Candidates ordered by oldest last_accessed_at:
    // img-1: 1 MB, accessed at 1000
    // img-2: 1 MB, accessed at 2000 (actively displayed on screen!)
    // img-3: 1 MB, accessed at 3000
    // img-4: 1 MB, accessed at 4000
    mockDb.getAllAsync.mockResolvedValueOnce([
      { id: 'img-1', local_path: 'file:///cache/img1.jpg', file_size: 1024 * 1024 },
      { id: 'img-2', local_path: 'file:///cache/img2.jpg', file_size: 1024 * 1024 },
      { id: 'img-3', local_path: 'file:///cache/img3.jpg', file_size: 1024 * 1024 },
      { id: 'img-4', local_path: 'file:///cache/img4.jpg', file_size: 1024 * 1024 },
    ]);

    // Protect img-2 because it is currently shown on screen
    manager.registerActiveImage('img-2');

    const freedBytes = await manager.triggerEvictionIfNeeded();

    // Excess was 3 MB.
    // Candidate 1 (img-1) evicted: 1 MB freed.
    // Candidate 2 (img-2) SKIPPED (active on screen!).
    // Candidate 3 (img-3) evicted: 2 MB freed.
    // Candidate 4 (img-4) evicted: 3 MB freed (target met!).
    expect(freedBytes).toBe(3 * 1024 * 1024);

    // Verify SQLite update was called for img-1, img-3, img-4, but NOT img-2
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE breed_images SET local_path = NULL'),
      ['img-1'],
    );
    expect(mockDb.runAsync).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE breed_images SET local_path = NULL'),
      ['img-2'],
    );
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE breed_images SET local_path = NULL'),
      ['img-3'],
    );
  });

  it('coalesces duplicate concurrent download requests for the same URL', async () => {
    mockDb.getFirstAsync.mockResolvedValue(null);

    const testUrl = 'https://images.dogapi.dog/sample_puppy.jpg';

    // Request same URL twice simultaneously
    const promise1 = manager.getCachedImageUrl('img-10', testUrl, 'thumb');
    const promise2 = manager.getCachedImageUrl('img-10', testUrl, 'thumb');

    const [res1, res2] = await Promise.all([promise1, promise2]);

    expect(res1).toBeDefined();
    expect(res2).toBe(res1);
  });
});
