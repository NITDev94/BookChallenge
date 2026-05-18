/**
 * Popular book categories aligned with Google Books API / BISAC subject headings.
 * Used to provide a curated, user-friendly selection of genres for challenges.
 */
export interface BookCategory {
  /** Machine-friendly category key (lowercase, no spaces). */
  key: string;
  /** Human-readable display name. */
  label: string;
}

/**
 * Predefined list of popular book categories.
 * Ordered by general popularity and relevance to readers.
 */
export const BOOK_CATEGORIES: BookCategory[] = [
  { key: 'fiction', label: 'Fiction' },
  { key: 'science_fiction', label: 'Science Fiction' },
  { key: 'fantasy', label: 'Fantasy' },
  { key: 'mystery', label: 'Mystery & Detective' },
  { key: 'thriller', label: 'Thriller & Suspense' },
  { key: 'romance', label: 'Romance' },
  { key: 'horror', label: 'Horror' },
  { key: 'historical_fiction', label: 'Historical Fiction' },
  { key: 'literary_fiction', label: 'Literary Fiction' },
  { key: 'young_adult_fiction', label: 'Young Adult Fiction' },
  { key: 'childrens_fiction', label: "Children's Fiction" },
  { key: 'biography', label: 'Biography & Autobiography' },
  { key: 'history', label: 'History' },
  { key: 'science', label: 'Science' },
  { key: 'technology', label: 'Computers & Technology' },
  { key: 'business', label: 'Business & Economics' },
  { key: 'self_help', label: 'Self-Help' },
  { key: 'psychology', label: 'Psychology' },
  { key: 'philosophy', label: 'Philosophy' },
  { key: 'religion', label: 'Religion & Spirituality' },
  { key: 'travel', label: 'Travel' },
  { key: 'cooking', label: 'Cooking & Food' },
  { key: 'health', label: 'Health & Fitness' },
  { key: 'sports', label: 'Sports & Recreation' },
  { key: 'music', label: 'Music' },
  { key: 'art', label: 'Art' },
  { key: 'photography', label: 'Photography' },
  { key: 'comics', label: 'Comics & Graphic Novels' },
  { key: 'humor', label: 'Humor' },
  { key: 'true_crime', label: 'True Crime' },
  { key: 'law', label: 'Law' },
  { key: 'political_science', label: 'Political Science' },
  { key: 'social_science', label: 'Social Science' },
  { key: 'education', label: 'Education' },
  { key: 'reference', label: 'Reference' },
  { key: 'language_arts', label: 'Language Arts & Disciplines' },
  { key: 'poetry', label: 'Poetry' },
  { key: 'drama', label: 'Drama' },
  { key: 'performing_arts', label: 'Performing Arts' },
  { key: 'family', label: 'Family & Relationships' },
  { key: 'mind_body_spirit', label: 'Body, Mind & Spirit' },
  { key: 'crafts', label: 'Crafts & Hobbies' },
  { key: 'gardening', label: 'Gardening' },
  { key: 'house_home', label: 'House & Home' },
  { key: 'pets', label: 'Pets' },
  { key: 'antiques', label: 'Antiques & Collectibles' },
  { key: 'transportation', label: 'Transportation' },
  { key: 'engineering', label: 'Technology & Engineering' },
  { key: 'medicine', label: 'Medicine' },
  { key: 'mathematics', label: 'Mathematics' },
  { key: 'nature', label: 'Nature' },
];

/**
 * Finds a book category by its key.
 *
 * @param key - The category key.
 * @returns The matching BookCategory, or undefined if not found.
 */
export function findCategoryByKey(key: string): BookCategory | undefined {
  return BOOK_CATEGORIES.find((cat) => cat.key === key);
}

/**
 * Converts an array of category keys into their display labels.
 *
 * @param keys - Array of category keys.
 * @returns Array of display labels.
 */
export function getCategoryLabels(keys: string[]): string[] {
  return keys
    .map((key) => findCategoryByKey(key)?.label)
    .filter((label): label is string => !!label);
}
