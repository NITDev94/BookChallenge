# Challenge & Reward System Implementation

## Overview
This commit introduces a complete challenge and reward system that gamifies the reading experience. Users complete challenges to earn rewards like joker passes.

---

## Core Types (`src/types/challenges.ts`)

### Domain Models
- **`ChallengeRule`** (lines 20-30): Defines evaluation rules - supports `books_completed`, `pages_read`, `reading_streak`, `books_by_genre`, and `books_started`. Each rule includes a target value and optional filters (language, category, author, title).

- **`ChallengeReward`** (lines 35-45): Defines rewards - currently supports `joker` (passes for streak protection), `xp` (experience points), `badge`, `reward_unlock`, and `coins`.

- **`ChallengeTemplate`** (lines 65-92): Challenge definition stored in Firestore `challengeTemplates` collection. Includes title, description, rule, rewards, time limits, and visibility settings.

- **`UserChallengeInstance`** (lines 139-169): User's active instance of a challenge. Progress is tracked with current/target/percentage. Status flows: `active` → `completed` → `claimed` → (terminal: `expired` | `archived`).

- **`UserReward`** (lines 178-201): User's earned reward, stored in Firestore `users/{uid}/rewards` collection.

---

## Services

### `src/services/challengeService.ts` (623 lines)

**Purpose**: Firestore persistence for challenge templates and user instances.

**Key Functions**:
- `streamChallengeTemplates()` (line 444): Real-time stream from Firestore, merges with fallback defaults (lines 413-418)
- `streamUserChallenges()` (line 483): Real-time stream of user's challenge instances
- `upsertUserChallengeInstance()` (line 521): Creates or updates challenge instance (uses check-then-act pattern)
- `createCustomChallengeTemplate()` (line 557): Allows users to create custom challenges
- `getDefaultChallengeTemplates()` (line 413): Returns 4 built-in system challenges:
  - `complete_book_basic` - Complete one book (auto-added)
  - `complete_book_english` - Complete an English book (selectable)
  - `complete_book_history` - Complete a history book (selectable)
  - `complete_book_art` - Complete an art book (selectable)

**Data Model**:
- Templates: Firestore `challengeTemplates` collection
- Instances: Firestore `users/{uid}/challenges` collection

---

### `src/services/rewardService.ts` (253 lines)

**Purpose**: Firestore persistence for user rewards and reward application.

**Key Functions**:
- `streamUserRewards()` (line 106): Real-time stream of user's rewards
- `applyChallengeRewards()` (line 159): Applies rewards when a challenge completes. Uses idempotent check-then-act pattern with Firestore retry logic (lines 171-178)
- `claimReward()` (line 235): Marks a reward as claimed

**Key Implementation Detail**:
- Retry logic with exponential backoff (lines 59-92) handles Firestore transient errors
- Idempotent design prevents duplicate rewards

---

## Utils

### `src/utils/challengeEvaluator.ts` (177 lines)

**Purpose**: Evaluates challenge rules against user data.

**Key Function**:
- `evaluateChallengeRule()` (line 153): Takes a rule and aggregates, returns progress and completion status

**Evaluation Logic**:
- `books_completed`: Filters books by status=read, then applies language/category/author/title filters
- `pages_read`: Sums all currentPage values
- `reading_streak`: Uses computed streak from aggregates
- `books_by_genre`: Uses booksByGenre from aggregates
- `books_started`: Counts books with reading activity

---

### `src/utils/challengeAggregates.ts` (151 lines)

**Purpose**: Derives aggregate metrics from user books for challenge evaluation.

**Key Function**:
- `buildChallengeAggregates()` (line 97): Computes all metrics needed for challenge evaluation

**Aggregates**:
- `booksCompleted`: Count of books with status=read
- `booksStarted`: Count of books with any reading activity
- `pagesRead`: Sum of currentPage across all books
- `readingStreak`: Calculated from progressHistory dates
- `booksByLanguage`: Grouped by normalized language code
- `booksByCategory`: Grouped by normalized category (uses canonicalization)
- `booksByGenre`: Alias for booksByCategory (backward compatibility)

**Normalization Helpers**:
- `normalizeChallengeText()` (line 31): Lowercases and removes diacritics
- `normalizeLanguageCode()` (line 33): Normalizes "English"/"english"/"en" → "en", etc.
- `canonicalizeChallengeCategory()` (line 51): Maps "history"/"historical"/"histoire" → "history", "art"/"fine art"/"design" → "art", etc.

---

### `src/utils/readingStreak.ts` (381 lines)

**Purpose**: Calculates reading streaks with joker protection.

**Note**: This file existed before but is now used by challenge system.

---

## Hooks

### `src/hooks/useChallenges.ts` (592 lines)

**Purpose**: Main orchestration hook that ties everything together.

**Responsibilities**:
1. Streams templates, instances, rewards, and user books
2. Builds aggregates from user books
3. Evaluates progress for each challenge (runs on every data change)
4. Persists updated instances to Firestore automatically
5. Applies rewards when challenges complete
6. Handles join/leave for selectable challenges
7. Allows custom challenge creation

**Key State Management**:
- Uses refs to prevent race conditions when persisting (lines 173-175)
- Implements terminal status freezing (lines 287-293)
- Filters challenges by visibility (`fixed`, `selectable`, `user_created`)

**Exported Interface**:
```typescript
{
  templates: ChallengeTemplate[];
  instances: UserChallengeInstance[];
  rewards: UserReward[];
  activeChallenges: ChallengeViewModelItem[];
  completedChallenges: ChallengeViewModelItem[];
  failedChallenges: ChallengeViewModelItem[];
  archivedChallenges: ChallengeViewModelItem[];
  availableChallenges: ChallengeTemplate[];
  joinChallenge: (templateId: string) => Promise<boolean>;
  createChallenge: (input: CreateCustomChallengeInput) => Promise<boolean>;
  isCreatingChallenge: boolean;
  joiningTemplateIds: Record<string, boolean>;
  isLoading: boolean;
}
```

---

## Components

### `src/components/challenges/ChallengeProgressCard.tsx` (172 lines)

**Purpose**: UI card showing challenge progress.

**Features**:
- Displays title, description, status label
- Shows progress bar with current/target
- Color-coded by status (completed=green, expired=red, active=amber)

---

### `src/components/challenges/RewardUnlockCard.tsx`

Displays earned rewards when a challenge completes.

---

### `src/components/challenges/ChallengeSection.tsx`

Container component that groups challenges by status.

---

## Screens

### `src/screens/ChallengesScreen.tsx` (539 lines)

**Purpose**: Full challenge management screen.

**Features**:
- Shows active, completed, failed, and archived challenges
- Lists available challenges to join
- Custom challenge creation form
- Reward display section

---

## Integration Points

### Modified Files
- **`ProfileScreen.tsx`**: Now shows completed challenges count (lines 73-77) instead of template count
- **`HomeScreen.tsx`**: Uses useChallenges() hook
- **`MainTabNavigator.tsx`**: Added Challenges tab

---

## Data Flow

```
User Book Changes
      ↓
streamUserBooks() → useChallenges hook
      ↓
buildChallengeAggregates() → challengeEvaluator.ts
      ↓
evaluateChallengeRule() for each template
      ↓
upsertUserChallengeInstance() → Firestore
      ↓
applyChallengeRewards() when completed
      ↓
UserReward created in Firestore
```

---

## Firestore Collections

- `challengeTemplates`: Challenge definitions (system + custom)
- `users/{uid}/challenges`: User's challenge instances
- `users/{uid}/rewards`: User's earned rewards
- `users/{uid}`: User document (existing)

---

## Error Handling

- **Firestore retry logic**: Exponential backoff with jitter (rewardService.ts lines 59-92)
- **Graceful degradation**: Uses fallback defaults when Firestore unavailable
- **Idempotent operations**: Prevents duplicate rewards/challenges
- **Race condition prevention**: Uses refs to track pending operations