/**
 * Filters to apply when evaluating a challenge rule against user books.
 * Used for language-specific or category-specific challenges.
 */
export interface BookFilters {
  /** Match books containing this author name (case-insensitive partial match) */
  authorIncludes?: string;
  /** Match books containing this title (case-insensitive partial match) */
  titleIncludes?: string;
  /** Match books in this language */
  language?: string;
  /** Match books belonging to any of these categories */
  categoriesAny?: string[];
}

/**
 * Defines the evaluation rule for a challenge.
 * Each kind specifies what metric to track and the target value to reach.
 */
export type ChallengeRule =
  /** Count books marked as completed. Supports filters for language/category. */
  | { kind: 'books_completed'; target: number; filters?: BookFilters }
  /** Count total pages read across all books. Supports filters. */
  | { kind: 'pages_read'; target: number; filters?: BookFilters }
  /** Match a reading streak (consecutive days with activity). */
  | { kind: 'reading_streak'; target: number }
  /** Count completed books of a specific genre. */
  | { kind: 'books_by_genre'; target: number; genre: string }
  /** Count books started (not yet completed). */
  | { kind: 'books_started'; target: number };

/**
 * Defines rewards granted when a challenge is completed.
 */
export type ChallengeReward =
  /** Joker passes for protection (permanent, does not expire) */
  | { kind: 'joker'; amount: number }
  /** Experience points (future use) */
  | { kind: 'xp'; amount: number }
  /** Badge achievement (future use) */
  | { kind: 'badge'; badgeId: string }
  /** Unlock another reward (future use) */
  | { kind: 'reward_unlock'; rewardId: string }
  /** Virtual coins (future use) */
  | { kind: 'coins'; amount: number };

/**
 * Time constraints for a challenge.
 */
export interface ChallengeTimeLimit {
  /** Type of time limit applied */
  type: 'none' | 'duration' | 'fixed_range';
  /** Number of days from start (for 'duration' type) */
  durationDays?: number;
  /** ISO timestamp when challenge starts (for 'fixed_range' type) */
  startAt?: string;
  /** ISO timestamp when challenge ends (for 'fixed_range' type) */
  endAt?: string;
}

/**
 * Challenge template definition.
 * Stored in Firestore collection 'challengeTemplates'.
 */
export interface ChallengeTemplate {
  /** Unique identifier (e.g., 'complete_book_basic') */
  id: string;
  /** Human-readable key for display (e.g., 'complete-basic') */
  key: string;
  /** User ID who created this challenge (system challenges have none) */
  ownerUserId?: string;
  /** Display title shown in UI */
  title: string;
  /** Detailed description shown in UI */
  description: string;
  /** Challenge origin: system-provided or user-created */
  type: 'system' | 'custom';
  /** Scope: how often the challenge resets */
  scope: 'global' | 'weekly' | 'monthly' | 'custom_range';
  /** Participation type: auto-added, user-selected, or user-created */
  visibility: 'fixed' | 'selectable' | 'user_created';
  /** Rule defining how progress is calculated */
  rule: ChallengeRule;
  /** Rewards granted upon completion */
  rewards: ChallengeReward[];
  /** Optional time constraints */
  timeLimit?: ChallengeTimeLimit;
  /** Whether user can repeat this challenge after completion */
  isRepeatable: boolean;
  /** Whether this challenge is currently active */
  isActive: boolean;
}

/** Goal kinds available when creating custom challenges */
export type CustomChallengeGoalKind =
  | 'books_completed'
  | 'pages_read'
  | 'reading_streak'
  | 'books_started';

/** Input for creating a custom user challenge */
export interface CreateCustomChallengeInput {
  title: string;
  description: string;
  goalKind: CustomChallengeGoalKind;
  target: number;
  language?: string;
  categoriesAny?: string[];
  durationDays?: number;
}

/** Possible states for a user's challenge instance */
export type UserChallengeStatus =
  /** Currently in progress */
  | 'active'
  /** Target reached, awaiting reward claim */
  | 'completed'
  /** Reward has been claimed */
  | 'claimed'
  /** Time expired without completion */
  | 'expired'
  /** Archived by user */
  | 'archived';

/** Progress data for UI display */
export interface UserChallengeProgress {
  /** Current progress value (e.g., books read) */
  current: number;
  /** Target value to reach */
  target: number;
  /** Percentage of completion (0-100) */
  percentage: number;
}

/**
 * User's instance of a challenge.
 * Stored in Firestore collection 'users/{uid}/challenges'.
 */
export interface UserChallengeInstance {
  /** Unique instance ID (same as template ID for system challenges) */
  id: string;
  /** User ID who owns this instance */
  userId: string;
  /** Template ID this instance was created from */
  templateId: string;
  /** Template key for display */
  templateKey: string;
  /** Current status of this instance */
  status: UserChallengeStatus;
  /** Calculated progress */
  progress: UserChallengeProgress;
  /** ISO timestamp when instance was created */
  startedAt: string;
  /** Optional ISO timestamp when challenge expires */
  expiresAt?: string | null;
  /** ISO timestamp when marked as expired */
  expiredAt?: string | null;
  /** ISO timestamp when marked as completed */
  completedAt?: string | null;
  /** ISO timestamp when reward was claimed */
  claimedAt?: string | null;
  /** Snapshot of aggregates at last evaluation */
  evaluationSnapshot?: Record<string, unknown>;
  /** Tracks whether reward has been applied */
  rewardApplication?: {
    applied: boolean;
    appliedAt?: string | null;
  };
}

/** Possible states for a user's reward */
export type UserRewardStatus = 'unlocked' | 'claimed' | 'used' | 'archived';

/**
 * User's reward earned from completing a challenge.
 * Stored in Firestore collection 'users/{uid}/rewards'.
 */
export interface UserReward {
  /** Unique reward ID */
  id: string;
  /** User ID who owns this reward */
  userId: string;
  /** Reward identifier (templateKey__index__kind) */
  rewardId: string;
  /** Challenge ID that generated this reward */
  sourceChallengeId: string;
  /** Template ID that generated this reward */
  sourceTemplateId: string;
  /** Type of reward */
  kind: ChallengeReward['kind'];
  /** Current status */
  status: UserRewardStatus;
  /** ISO timestamp when unlocked */
  unlockedAt: string;
  /** ISO timestamp when claimed by user */
  claimedAt?: string | null;
  /** ISO timestamp when used/consumed */
  usedAt?: string | null;
  /** Additional metadata (amount, badgeId, etc.) */
  payload?: Record<string, string | number | boolean | null>;
}
