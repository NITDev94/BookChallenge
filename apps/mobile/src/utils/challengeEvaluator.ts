import { ChallengeRule } from '../types/challenges';
import {
  canonicalizeChallengeCategory,
  ChallengeAggregates,
  normalizeChallengeText,
  normalizeLanguageCode,
} from './challengeAggregates';

/**
 * Challenge evaluation result.
 * Contains progress metrics and completion status.
 */
export interface ChallengeEvaluationResult {
  /** Progress towards target */
  progress: {
    /** Current value (e.g., books read) */
    current: number;
    /** Target value to reach */
    target: number;
    /** Percentage complete (0-100) */
    percentage: number;
  };
  /** Whether target has been reached */
  isCompleted: boolean;
  /** Snapshot of aggregates at evaluation time */
  evaluationSnapshot: Record<string, unknown>;
}

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

const normalizeTarget = (target: number): number => {
  if (!Number.isFinite(target) || target <= 0) {
    return 1;
  }
  return Math.floor(target);
};

const includesNormalized = (value: string, query: string): boolean => value.toLowerCase().includes(query.toLowerCase());

const matchesLanguageFilter = (
  aggregates: ChallengeAggregates,
  expectedLanguage?: string,
): ((book: ChallengeAggregates['books'][number]) => boolean) => {
  if (typeof expectedLanguage !== 'string' || expectedLanguage.trim().length === 0) {
    return () => true;
  }

  const expected = normalizeLanguageCode(expectedLanguage);

  return (book) => {
    if (typeof book.language !== 'string' || book.language.trim().length === 0) {
      return false;
    }

    const normalizedBookLanguage = normalizeLanguageCode(book.language);

    if (normalizedBookLanguage === expected) {
      return true;
    }

    const languageCount = aggregates.booksByLanguage[expected] ?? 0;
    return languageCount > 0 && normalizedBookLanguage === expected;
  };
};

const matchesCategoriesFilter = (
  book: ChallengeAggregates['books'][number],
  categoriesAny?: string[],
): boolean => {
  if (!Array.isArray(categoriesAny) || categoriesAny.length === 0) {
    return true;
  }

  const expectedCategories = new Set(
    categoriesAny
      .filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
      .map(canonicalizeChallengeCategory)
      .filter((category) => category.length > 0),
  );

  if (expectedCategories.size === 0) {
    return true;
  }

  const bookCategories = new Set(
    (Array.isArray(book.categories) ? book.categories : [])
      .filter((category): category is string => typeof category === 'string' && category.trim().length > 0)
      .map(canonicalizeChallengeCategory)
      .filter((category) => category.length > 0),
  );

  if (bookCategories.size === 0) {
    return false;
  }

  return Array.from(expectedCategories).some((category) => bookCategories.has(category));
};

const countCompletedBooks = (aggregates: ChallengeAggregates, rule: Extract<ChallengeRule, { kind: 'books_completed' }>): number => {
  const matchesLanguage = matchesLanguageFilter(aggregates, rule.filters?.language);

  return aggregates.books.filter((book) => {
    if (book.status !== 'read') {
      return false;
    }

    if (!matchesLanguage(book)) {
      return false;
    }

    if (!matchesCategoriesFilter(book, rule.filters?.categoriesAny)) {
      return false;
    }

    if (rule.filters?.authorIncludes) {
      const expectedAuthor = normalizeChallengeText(rule.filters.authorIncludes);
      const hasAuthor = (book.authors || []).some((author) => includesNormalized(normalizeChallengeText(author), expectedAuthor));
      if (!hasAuthor) {
        return false;
      }
    }

    if (rule.filters?.titleIncludes) {
      const expectedTitle = normalizeChallengeText(rule.filters.titleIncludes);
      if (!includesNormalized(normalizeChallengeText(book.title || ''), expectedTitle)) {
        return false;
      }
    }

    return true;
  }).length;
};

const getCurrentValueByRule = (rule: ChallengeRule, aggregates: ChallengeAggregates): number => {
  switch (rule.kind) {
    case 'books_completed':
      return countCompletedBooks(aggregates, rule);
    case 'pages_read':
      return aggregates.pagesRead;
    case 'reading_streak':
      return aggregates.readingStreak;
    case 'books_by_genre': {
      const genreKey = canonicalizeChallengeCategory(rule.genre);
      return aggregates.booksByGenre[genreKey] ?? 0;
    }
    case 'books_started':
      return aggregates.booksStarted;
    default:
      return 0;
  }
};

export const evaluateChallengeRule = (
  rule: ChallengeRule,
  aggregates: ChallengeAggregates,
): ChallengeEvaluationResult => {
  const target = normalizeTarget(rule.target);
  const rawCurrent = getCurrentValueByRule(rule, aggregates);
  const current = Math.max(0, Math.floor(rawCurrent));
  const percentage = clamp(Math.round((current / target) * 100), 0, 100);

  return {
    progress: {
      current,
      target,
      percentage,
    },
    isCompleted: current >= target,
    evaluationSnapshot: {
      ruleKind: rule.kind,
      booksCompleted: aggregates.booksCompleted,
      booksStarted: aggregates.booksStarted,
      pagesRead: aggregates.pagesRead,
      readingStreak: aggregates.readingStreak,
    },
  };
};
