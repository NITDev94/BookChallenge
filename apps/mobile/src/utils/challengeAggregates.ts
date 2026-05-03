import { UserBookDocument } from '../services/userBookService';
import { getReadingStreakFromBooks } from './readingStreak';

/**
 * Aggregates derived from user books for challenge evaluation.
 * Computed from UserBookDocument collection.
 */
export interface ChallengeAggregates {
  /** All user books (for detailed filtering) */
  books: UserBookDocument[];
  /** Count of completed books */
  booksCompleted: number;
  /** Count of started (not yet completed) books */
  booksStarted: number;
  /** Total pages read across all books */
  pagesRead: number;
  /** Current reading streak in days */
  readingStreak: number;
  /** Completed books grouped by language code */
  booksByLanguage: Record<string, number>;
  /** Completed books grouped by normalized category */
  booksByCategory: Record<string, number>;
  /** Completed books grouped by genre */
  booksByGenre: Record<string, number>;
}

const normalize = (value: string): string => value.trim().toLowerCase();

const removeDiacritics = (value: string): string => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export const normalizeChallengeText = (value: string): string => removeDiacritics(normalize(value));

export const normalizeLanguageCode = (value: string): string => {
  const normalized = normalizeChallengeText(value);

  if (normalized === 'english' || normalized === 'anglais') {
    return 'en';
  }

  if (normalized === 'espanol' || normalized === 'espanol (castellano)' || normalized === 'spanish') {
    return 'es';
  }

  if (normalized === 'francais' || normalized === 'french') {
    return 'fr';
  }

  return normalized.split('-')[0];
};

export const canonicalizeChallengeCategory = (value: string): string => {
  const normalized = normalizeChallengeText(value);

  if (
    normalized.includes('history')
    || normalized.includes('historical')
    || normalized.includes('histoire')
    || normalized.includes('historia')
  ) {
    return 'history';
  }

  if (
    normalized.includes('art')
    || normalized.includes('arts')
    || normalized.includes('fine art')
    || normalized.includes('design')
    || normalized.includes('painting')
    || normalized.includes('sculpt')
  ) {
    return 'art';
  }

  return normalized;
};

const getNormalizedBookCategories = (book: UserBookDocument): string[] => {
  const rawCategories = Array.isArray(book.categories)
    ? book.categories
    : [];

  const rawGenre = (book as UserBookDocument & { genre?: string | null }).genre;

  const allCandidates = [
    ...rawCategories,
    ...(typeof rawGenre === 'string' && rawGenre.trim().length > 0 ? [rawGenre] : []),
  ];

  return Array.from(new Set(
    allCandidates
      .filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
      .map(canonicalizeChallengeCategory)
      .filter((category) => category.length > 0),
  ));
};

export const buildChallengeAggregates = (
  books: UserBookDocument[],
  readingStreak?: number,
): ChallengeAggregates => {
  const booksCompleted = books.filter((book) => book.status === 'read').length;
  const booksStarted = books.filter((book) => (
    book.status === 'reading'
      || book.status === 'read'
      || (book.currentPage ?? 0) > 0
      || (book.progressHistory?.length ?? 0) > 0
  )).length;

  const pagesRead = books.reduce((sum, book) => {
    const currentPage = Number.isFinite(book.currentPage) ? Math.max(0, Math.floor(book.currentPage)) : 0;
    return sum + currentPage;
  }, 0);

  const booksByLanguage: Record<string, number> = books.reduce<Record<string, number>>((acc, book) => {
    if (typeof book.language !== 'string' || book.language.trim().length === 0) {
      return acc;
    }

    const key = normalizeLanguageCode(book.language);
    if (key.length === 0) {
      return acc;
    }

    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const booksByCategory: Record<string, number> = books.reduce<Record<string, number>>((acc, book) => {
    const categories = getNormalizedBookCategories(book);

    categories.forEach((category) => {
      acc[category] = (acc[category] ?? 0) + 1;
    });

    return acc;
  }, {});

  // Backward-compatible alias for existing rules.
  const booksByGenre = booksByCategory;

  return {
    books,
    booksCompleted,
    booksStarted,
    pagesRead,
    readingStreak: typeof readingStreak === 'number' ? Math.max(0, Math.floor(readingStreak)) : getReadingStreakFromBooks(books),
    booksByLanguage,
    booksByCategory,
    booksByGenre,
  };
};
