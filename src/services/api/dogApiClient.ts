import {
  BreedsResponse,
  BreedsResponseSchema,
  BreedDto,
  SingleBreedResponseSchema,
  GroupsResponseSchema,
  GroupDto,
} from '../../types/api';
import { logger } from '../../utils/logger';

export class ApiClientError extends Error {
  public readonly statusCode?: number;
  public readonly isNetworkError: boolean;
  public readonly isTimeout: boolean;
  public readonly isRetryable: boolean;

  constructor(params: {
    message: string;
    statusCode?: number;
    isNetworkError?: boolean;
    isTimeout?: boolean;
    cause?: unknown;
  }) {
    super(params.message);
    this.name = 'ApiClientError';
    this.statusCode = params.statusCode;
    this.isNetworkError = params.isNetworkError ?? false;
    this.isTimeout = params.isTimeout ?? false;

    // Retryable: 408 (Timeout), 429 (Rate Limit), 5xx (Server Error), Network/Timeout errors
    if (this.isNetworkError || this.isTimeout) {
      this.isRetryable = true;
    } else if (this.statusCode) {
      this.isRetryable =
        this.statusCode === 408 ||
        this.statusCode === 429 ||
        (this.statusCode >= 500 && this.statusCode <= 599);
    } else {
      this.isRetryable = false;
    }
  }
}

export interface RequestOptions {
  timeoutMs?: number;
  maxRetries?: number;
  signal?: AbortSignal;
}

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 6000;

export class DogApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (
      baseUrl ||
      process.env.EXPO_PUBLIC_DOG_API_BASE_URL ||
      'https://dogapi.dog/api/v2'
    ).replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  private async sleep(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new ApiClientError({ message: 'Request aborted', isTimeout: false }));
      }
      const timer = setTimeout(resolve, ms);
      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            clearTimeout(timer);
            reject(
              new ApiClientError({
                message: 'Request aborted',
                isTimeout: false,
              }),
            );
          },
          { once: true },
        );
      }
    });
  }

  private calculateBackoffWithJitter(attempt: number, retryAfterHeader?: string | null): number {
    if (retryAfterHeader) {
      const parsedSeconds = parseInt(retryAfterHeader, 10);
      if (!isNaN(parsedSeconds) && parsedSeconds > 0) {
        return Math.min(parsedSeconds * 1000, 15000);
      }
    }
    // Exponential backoff: base * 2^attempt + jitter (0 - 300ms)
    const baseBackoff = Math.min(INITIAL_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
    const jitter = Math.floor(Math.random() * 300);
    return baseBackoff + jitter;
  }

  private async request<T>(
    endpoint: string,
    validator: (data: unknown) => T,
    options: RequestOptions = {},
  ): Promise<T> {
    const { timeoutMs = DEFAULT_TIMEOUT_MS, maxRetries = DEFAULT_MAX_RETRIES, signal } = options;

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    let attempt = 0;

    while (attempt <= maxRetries) {
      if (signal?.aborted) {
        throw new ApiClientError({
          message: 'Request aborted before start',
          isTimeout: false,
        });
      }

      const controller = new AbortController();
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);

      // Link external signal if provided
      const abortHandler = () => {
        controller.abort();
      };
      if (signal) {
        signal.addEventListener('abort', abortHandler, { once: true });
      }

      try {
        logger.debug(`[DogApiClient] HTTP GET ${url} (attempt ${attempt + 1}/${maxRetries + 1})`);

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timer);
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }

        if (!response.ok) {
          const retryAfter = response.headers.get('Retry-After');
          const error = new ApiClientError({
            message: `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
          });

          if (error.isRetryable && attempt < maxRetries) {
            const delay = this.calculateBackoffWithJitter(attempt, retryAfter);
            logger.warn(
              `[DogApiClient] Retryable error ${response.status}. Retrying in ${delay}ms...`,
            );
            await this.sleep(delay, signal);
            attempt++;
            continue;
          }
          throw error;
        }

        const rawJson: unknown = await response.json();
        const parsed = validator(rawJson);
        return parsed;
      } catch (err: unknown) {
        clearTimeout(timer);
        if (signal) {
          signal.removeEventListener('abort', abortHandler);
        }

        if (err instanceof ApiClientError && !err.isRetryable) {
          throw err;
        }

        const isTimeoutError =
          timedOut || (err instanceof Error && err.name === 'AbortError' && timedOut);
        const isAbort =
          !timedOut && (signal?.aborted || (err instanceof Error && err.name === 'AbortError'));

        if (isAbort) {
          throw new ApiClientError({
            message: 'Request aborted by caller',
            isTimeout: false,
            cause: err,
          });
        }

        const networkError = new ApiClientError({
          message: isTimeoutError
            ? `Request timed out after ${timeoutMs}ms`
            : err instanceof Error
              ? err.message
              : 'Network request failed',
          isNetworkError: !isTimeoutError,
          isTimeout: isTimeoutError,
          cause: err,
        });

        if (networkError.isRetryable && attempt < maxRetries) {
          const delay = this.calculateBackoffWithJitter(attempt);
          logger.warn(`[DogApiClient] Error: ${networkError.message}. Retrying in ${delay}ms...`);
          await this.sleep(delay, signal);
          attempt++;
          continue;
        }

        throw networkError;
      }
    }

    throw new ApiClientError({
      message: `Max retries (${maxRetries}) exceeded for ${url}`,
      isNetworkError: true,
    });
  }

  /**
   * Fetches a paginated page of breeds.
   */
  public async fetchBreedsPage(
    pageNumber = 1,
    pageSize = 48,
    options: RequestOptions = {},
  ): Promise<BreedsResponse> {
    const endpoint = `/breeds?page[number]=${pageNumber}&page[size]=${pageSize}`;
    return this.request(endpoint, (json) => BreedsResponseSchema.parse(json), options);
  }

  /**
   * Fetches details of a single breed by UUID.
   */
  public async fetchBreedById(id: string, options: RequestOptions = {}): Promise<BreedDto> {
    const endpoint = `/breeds/${encodeURIComponent(id)}`;
    const response = await this.request(
      endpoint,
      (json) => SingleBreedResponseSchema.parse(json),
      options,
    );
    return response.data;
  }

  /**
   * Fetches all breed groups.
   */
  public async fetchGroups(options: RequestOptions = {}): Promise<GroupDto[]> {
    const endpoint = '/groups';
    const response = await this.request(
      endpoint,
      (json) => GroupsResponseSchema.parse(json),
      options,
    );
    return response.data;
  }
}

export const dogApiClient = new DogApiClient();
