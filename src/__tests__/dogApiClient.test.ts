import { DogApiClient, ApiClientError } from '../services/api/dogApiClient';

describe('DogApiClient', () => {
  let client: DogApiClient;
  const mockBaseUrl = 'https://api.test-dog.com/v2';

  beforeEach(() => {
    client = new DogApiClient(mockBaseUrl);
    jest.clearAllMocks();
  });

  it('initializes with custom or environment base URL', () => {
    expect(client.getBaseUrl()).toBe(mockBaseUrl);
  });

  it('fetches and validates breeds page', async () => {
    const mockApiResponse = {
      data: [
        {
          id: 'test-breed-1',
          type: 'breed',
          attributes: {
            name: 'Golden Retriever',
            description: 'Friendly and intelligent.',
            hypoallergenic: false,
          },
        },
      ],
      meta: {
        pagination: {
          current: 1,
          next: 2,
          last: 6,
          records: 283,
        },
      },
      links: {
        self: `${mockBaseUrl}/breeds?page[number]=1&page[size]=48`,
        next: `${mockBaseUrl}/breeds?page[number]=2&page[size]=48`,
      },
    };

    const mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as unknown as Response;

    globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse);

    const result = await client.fetchBreedsPage(1, 48);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${mockBaseUrl}/breeds?page[number]=1&page[size]=48`,
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      }),
    );
    expect(result.data.length).toBe(1);
    expect(result.data[0].attributes.name).toBe('Golden Retriever');
    expect(result.meta?.pagination?.records).toBe(283);
  });

  it('throws ApiClientError when response schema is invalid', async () => {
    const invalidResponse = {
      data: [{ invalid_field: 123 }], // Missing id and attributes
    };

    const mockFetchResponse = {
      ok: true,
      status: 200,
      json: async () => invalidResponse,
    } as unknown as Response;

    globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse);

    await expect(client.fetchBreedsPage(1, 48)).rejects.toThrow();
  });

  it('does not retry 404 client errors', async () => {
    const mockFetchResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers(),
    } as unknown as Response;

    globalThis.fetch = jest.fn().mockResolvedValue(mockFetchResponse);

    await expect(client.fetchBreedById('non-existent-id', { maxRetries: 2 })).rejects.toThrow(
      ApiClientError,
    );

    // Should only be called once because 404 is not retryable
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries on 500 server errors up to maxRetries', async () => {
    const errorResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers(),
    } as unknown as Response;

    const successResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          id: 'recovered-breed',
          type: 'breed',
          attributes: { name: 'Poodle' },
        },
      }),
    } as unknown as Response;

    globalThis.fetch = jest
      .fn()
      .mockResolvedValueOnce(errorResponse)
      .mockResolvedValueOnce(successResponse);

    const result = await client.fetchBreedById('recovered-breed', {
      maxRetries: 2,
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
    expect(result.attributes.name).toBe('Poodle');
  });

  it('aborts request when AbortSignal is cancelled', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(client.fetchBreedsPage(1, 48, { signal: controller.signal })).rejects.toThrow(
      ApiClientError,
    );
  });
});
