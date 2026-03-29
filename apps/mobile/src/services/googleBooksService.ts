/**
 * Google Books API service.
 *
 * To avoid 429 rate-limit errors (anonymous quota = ~1000 req/day):
 *  1. Set GOOGLE_BOOKS_API_KEY in the repository root `.env`.
 *  2. Results are cached in memory for the lifetime of the JS bundle.
 */

import { GOOGLE_BOOKS_API_KEY as GOOGLE_BOOKS_API_KEY_ENV } from '@env';

// ─── Optional API key ────────────────────────────────────────────────────────
// Set this via your build-time env. If missing, anonymous quota is used.
const GOOGLE_BOOKS_API_KEY = GOOGLE_BOOKS_API_KEY_ENV || '';
let hasWarnedMissingApiKey = false;

const BASE_URL = 'https://www.googleapis.com/books/v1';

function withKey(url: string): string {
  if (!GOOGLE_BOOKS_API_KEY) {
    if (!hasWarnedMissingApiKey) {
      hasWarnedMissingApiKey = true;
      console.warn(
        '[GoogleBooks] GOOGLE_BOOKS_API_KEY is missing. Using anonymous quota (more likely to hit 429).',
      );
    }
    return url;
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}key=${GOOGLE_BOOKS_API_KEY}`;
}

type GoogleBooksErrorCode = 'RATE_LIMIT' | 'HTTP_ERROR' | 'NETWORK_ERROR';

interface GoogleBooksServiceErrorOptions {
  status?: number;
  retryAfterMs?: number;
  originalError?: unknown;
}

export class GoogleBooksServiceError extends Error {
  code: GoogleBooksErrorCode;
  status?: number;
  retryAfterMs?: number;
  originalError?: unknown;

  constructor(
    code: GoogleBooksErrorCode,
    message: string,
    options: GoogleBooksServiceErrorOptions = {},
  ) {
    super(message);
    this.name = 'GoogleBooksServiceError';
    this.code = code;
    this.status = options.status;
    this.retryAfterMs = options.retryAfterMs;
    this.originalError = options.originalError;
  }
}

export function isGoogleBooksServiceError(error: unknown): error is GoogleBooksServiceError {
  return error instanceof GoogleBooksServiceError;
}

// ─── In-memory caches ─────────────────────────────────────────────────────────
const searchCache = new Map<string, GoogleBookItem[]>();
const bookCache   = new Map<string, GoogleBookItem>();

// ─── Types ─────────────────────────────────────────────────────────────────────
export interface GoogleBookVolumeInfo {
  title: string;
  authors?: string[];
  description?: string;
  publisher?: string;
  publishedDate?: string;
  categories?: string[];
  averageRating?: number;
  ratingsCount?: number;
  language?: string;
  imageLinks?: {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
    extraLarge?: string;
  };
  pageCount?: number;
}

export interface GoogleBookItem {
  id: string;
  volumeInfo: GoogleBookVolumeInfo;
}

export interface GoogleBooksResponse {
  items?: GoogleBookItem[];
  totalItems: number;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Best available thumbnail URL, always using https. */
export function bestCoverUrl(volumeInfo?: GoogleBookVolumeInfo): string | undefined {
  if (!volumeInfo?.imageLinks) return undefined;
  const { large, medium, small, thumbnail, smallThumbnail } = volumeInfo.imageLinks;
  const url = large || medium || small || thumbnail || smallThumbnail;
  return url?.replace('http:', 'https:');
}

/**
 * Fetch with automatic retry on 429 (rate-limit).
 * Waits `retryAfterMs` ms before retrying (default 2 s).
 */
async function fetchWithRetry(
  url: string,
  retries = 2,
  retryAfterMs = 2000,
  signal?: AbortSignal,
): Promise<Response> {
  const res = await fetch(withKey(url), { signal });
  if (res.status === 429 && retries > 0) {
    const retryAfterHeader = parseRetryAfterMs(res.headers.get('Retry-After'));
    const waitMs = retryAfterHeader ?? retryAfterMs;
    console.warn(`[GoogleBooks] 429 rate-limit — retrying in ${waitMs}ms...`);
    await sleep(waitMs, signal);
    return fetchWithRetry(url, retries - 1, retryAfterMs * 2, signal);
  }
  return res;
}

function parseRetryAfterMs(value: string | null): number | null {
  if (!value) return null;

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.floor(seconds * 1000));
  }

  const dateMs = Date.parse(value);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function createAbortError(): Error {
  const err = new Error('The request was aborted');
  err.name = 'AbortError';
  return err;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    const onAbort = () => {
      clearTimeout(timeoutId);
      signal?.removeEventListener('abort', onAbort);
      reject(createAbortError());
    };

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export interface SearchBooksOptions {
  signal?: AbortSignal;
}

// ─── Public API ────────────────────────────────────────────────────────────────

/**
 * Search books. Results are cached by query string for the session.
 */
export const searchBooks = async (
  query: string,
  options: SearchBooksOptions = {},
): Promise<GoogleBookItem[]> => {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const cacheKey = normalizedQuery.toLowerCase();
  if (searchCache.has(cacheKey)) {
    return searchCache.get(cacheKey)!;
  }

  try {
    const url = `${BASE_URL}/volumes?q=${encodeURIComponent(normalizedQuery)}&maxResults=20&fields=totalItems,items(id,volumeInfo(title,authors,imageLinks,pageCount,description))`;
    const response = await fetchWithRetry(url, 2, 2000, options.signal);

    if (!response.ok) {
      if (response.status === 429) {
        throw new GoogleBooksServiceError(
          'RATE_LIMIT',
          'Google Books API rate-limit reached.',
          {
            status: 429,
            retryAfterMs: parseRetryAfterMs(response.headers.get('Retry-After')) ?? undefined,
          },
        );
      }

      throw new GoogleBooksServiceError(
        'HTTP_ERROR',
        `Google Books request failed with status ${response.status}.`,
        { status: response.status },
      );
    }

    const data: GoogleBooksResponse = await response.json();
    const items = data.items || [];
    searchCache.set(cacheKey, items);
    return items;
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    if (error instanceof GoogleBooksServiceError) {
      console.error('[GoogleBooks] Error searching books:', error);
      throw error;
    }

    console.error('[GoogleBooks] Error searching books:', error);
    throw new GoogleBooksServiceError(
      'NETWORK_ERROR',
      'Network error while searching books.',
      { originalError: error },
    );
  }
};

/**
 * Fetch a single book's full details by Google Books volume ID.
 * Result is cached so navigating back and forth doesn't repeat requests.
 */
export const getBookById = async (bookId: string): Promise<GoogleBookItem | null> => {
  if (bookCache.has(bookId)) {
    return bookCache.get(bookId)!;
  }

  try {
    const url = `${BASE_URL}/volumes/${encodeURIComponent(bookId)}`;
    const response = await fetchWithRetry(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GoogleBookItem = await response.json();
    bookCache.set(bookId, data);
    return data;
  } catch (error) {
    console.error('[GoogleBooks] Error fetching book by ID:', error);
    return null;
  }
};

/** Clear all caches (call on logout if needed). */
export const clearGoogleBooksCache = () => {
  searchCache.clear();
  bookCache.clear();
};
