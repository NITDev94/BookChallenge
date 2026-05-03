/**
 * Firestore service for challenge templates and user instances.
 * Handles persistence and real-time streams.
 */
import {
  collection,
  doc,
  FirebaseFirestoreTypes,
  getFirestore,
  onSnapshot,
  setDoc,
} from '@react-native-firebase/firestore';
import {
  ChallengeReward,
  ChallengeRule,
  ChallengeTimeLimit,
  ChallengeTemplate,
  CreateCustomChallengeInput,
  UserChallengeInstance,
  UserChallengeStatus,
} from '../types/challenges';

/**
 * Type guard to check if value is a plain object.
 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/**
 * Safely extract a non-empty string or return null.
 */
const getStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

/**
 * Safely extract a boolean with fallback.
 */
const getBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === 'boolean' ? value : fallback;

/**
 * Safely extract a non-negative number with fallback.
 */
const getNonNegativeNumber = (value: unknown, fallback = 0): number => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback;
  }

  return value;
};

const isValidIsoDate = (value: string): boolean => !Number.isNaN(Date.parse(value));

const sanitizeInlineText = (value: string, maxLength: number): string => {
  return value.trim().replace(/\s+/g, ' ').slice(0, maxLength);
};

const normalizeCategories = (value: string[] | undefined): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set<string>();
  value.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }

    const normalized = entry.trim().toLowerCase();
    if (normalized.length > 0) {
      unique.add(normalized);
    }
  });

  return Array.from(unique);
};

const buildCustomChallengeRule = (input: CreateCustomChallengeInput): ChallengeRule => {
  const target = Math.max(1, Math.floor(input.target));
  const language = typeof input.language === 'string' && input.language.trim().length > 0
    ? input.language.trim().toLowerCase()
    : undefined;
  const categoriesAny = normalizeCategories(input.categoriesAny);
  const filters = {
    ...(language ? { language } : {}),
    ...(categoriesAny.length > 0 ? { categoriesAny } : {}),
  };

  if (input.goalKind === 'books_completed') {
    return {
      kind: 'books_completed',
      target,
      ...(Object.keys(filters).length > 0 ? { filters } : {}),
    };
  }

  if (input.goalKind === 'pages_read') {
    return {
      kind: 'pages_read',
      target,
    };
  }

  if (input.goalKind === 'reading_streak') {
    return {
      kind: 'reading_streak',
      target,
    };
  }

  return {
    kind: 'books_started',
    target,
  };
};

const SYSTEM_COMPLETE_BOOK_TEMPLATE: ChallengeTemplate = {
  id: 'complete_book_basic',
  key: 'complete-basic',
  title: 'Complete Your First Book',
  description: 'Mark a book as completed to earn your first joker.',
  type: 'system',
  scope: 'global',
  visibility: 'fixed',
  rule: { kind: 'books_completed', target: 1 },
  rewards: [{ kind: 'joker', amount: 1 }],
  timeLimit: { type: 'none' },
  isRepeatable: false,
  isActive: true,
};

const SYSTEM_COMPLETE_BOOK_ENGLISH_TEMPLATE: ChallengeTemplate = {
  id: 'complete_book_english',
  key: 'complete-english',
  title: 'Read in English',
  description: 'Complete a book written in English.',
  type: 'system',
  scope: 'global',
  visibility: 'selectable',
  rule: {
    kind: 'books_completed',
    target: 1,
    filters: { language: 'en' },
  },
  rewards: [{ kind: 'joker', amount: 1 }],
  isRepeatable: false,
  isActive: true,
};

const SYSTEM_COMPLETE_BOOK_HISTORY_TEMPLATE: ChallengeTemplate = {
  id: 'complete_book_history',
  key: 'complete-history',
  title: 'History Buff',
  description: 'Complete a history book.',
  type: 'system',
  scope: 'global',
  visibility: 'selectable',
  rule: {
    kind: 'books_completed',
    target: 1,
    filters: { categoriesAny: ['history'] },
  },
  rewards: [{ kind: 'joker', amount: 1 }],
  isRepeatable: false,
  isActive: true,
};

const SYSTEM_COMPLETE_BOOK_ART_TEMPLATE: ChallengeTemplate = {
  id: 'complete_book_art',
  key: 'complete-art',
  title: 'Art Enthusiast',
  description: 'Complete an art book.',
  type: 'system',
  scope: 'global',
  visibility: 'selectable',
  rule: {
    kind: 'books_completed',
    target: 1,
    filters: { categoriesAny: ['art'] },
  },
  rewards: [{ kind: 'joker', amount: 1 }],
  isRepeatable: false,
  isActive: true,
};

const mapChallengeRule = (value: unknown): ChallengeRule | null => {
  if (!isRecord(value)) {
    return null;
  }

  const kind = value.kind;
  if (typeof kind !== 'string') {
    return null;
  }

  const target = getNonNegativeNumber(value.target, 1);

  if (kind === 'books_completed' || kind === 'pages_read' || kind === 'books_started') {
    const filters = isRecord(value.filters) ? value.filters : {};
    const authorIncludes = getStringOrNull(filters.authorIncludes);
    const titleIncludes = getStringOrNull(filters.titleIncludes);
    const language = getStringOrNull(filters.language);
    const categoriesAny = Array.isArray(filters.categoriesAny)
      ? filters.categoriesAny.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : undefined;

    return {
      kind,
      target,
      filters: {
        ...(authorIncludes ? { authorIncludes } : {}),
        ...(titleIncludes ? { titleIncludes } : {}),
        ...(language ? { language } : {}),
        ...(categoriesAny && categoriesAny.length > 0 ? { categoriesAny } : {}),
      },
    };
  }

  if (kind === 'reading_streak') {
    return { kind, target };
  }

  if (kind === 'books_by_genre') {
    const genre = getStringOrNull(value.genre);
    if (!genre) {
      return null;
    }
    return { kind, target, genre };
  }

  return null;
};

const mapChallengeTimeLimit = (value: unknown): ChallengeTimeLimit | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const type = value.type;
  if (type !== 'none' && type !== 'duration' && type !== 'fixed_range') {
    return undefined;
  }

  if (type === 'duration') {
    const durationDays = getNonNegativeNumber(value.durationDays);
    return { type, durationDays };
  }

  if (type === 'fixed_range') {
    const startAt = getStringOrNull(value.startAt);
    const endAt = getStringOrNull(value.endAt);
    if (!startAt || !endAt || !isValidIsoDate(startAt) || !isValidIsoDate(endAt)) {
      return undefined;
    }

    return { type, startAt, endAt };
  }

  return { type };
};

const mapChallengeReward = (value: unknown): ChallengeReward | null => {
  if (!isRecord(value)) {
    return null;
  }

  const kind = value.kind;
  const amount = getNonNegativeNumber(value.amount, 1);

  if (kind === 'joker' || kind === 'xp' || kind === 'coins') {
    return { kind, amount };
  }

  if (kind === 'badge') {
    const badgeId = getStringOrNull(value.badgeId);
    if (!badgeId) {
      return null;
    }
    return { kind, badgeId };
  }

  if (kind === 'reward_unlock') {
    const rewardId = getStringOrNull(value.rewardId);
    if (!rewardId) {
      return null;
    }
    return { kind, rewardId };
  }

  return null;
};

const isChallengeStatus = (value: unknown): value is UserChallengeStatus => {
  return value === 'active'
    || value === 'completed'
    || value === 'claimed'
    || value === 'expired'
    || value === 'archived';
};

const mapToUserChallenge = (id: string, userId: string, value: unknown): UserChallengeInstance | null => {
  if (!isRecord(value)) {
    return null;
  }

  const templateId = getStringOrNull(value.templateId);
  const templateKey = getStringOrNull(value.templateKey);
  const startedAt = getStringOrNull(value.startedAt);

  if (!templateId || !templateKey || !startedAt) {
    return null;
  }

  const status = isChallengeStatus(value.status) ? value.status : 'active';

  const rawProgress = isRecord(value.progress) ? value.progress : {};
  const target = Math.max(1, Math.floor(getNonNegativeNumber(rawProgress.target, 1)));
  const current = Math.floor(getNonNegativeNumber(rawProgress.current, 0));
  const percentage = Math.max(0, Math.min(100, Math.floor(getNonNegativeNumber(rawProgress.percentage, 0))));

  const rewardApplication = isRecord(value.rewardApplication)
    ? {
        applied: getBoolean(value.rewardApplication.applied, false),
        appliedAt: getStringOrNull(value.rewardApplication.appliedAt),
      }
    : undefined;

  return {
    id,
    userId,
    templateId,
    templateKey,
    status,
    progress: { current, target, percentage },
    startedAt,
    expiresAt: getStringOrNull(value.expiresAt),
    expiredAt: getStringOrNull(value.expiredAt),
    completedAt: getStringOrNull(value.completedAt),
    claimedAt: getStringOrNull(value.claimedAt),
    evaluationSnapshot: isRecord(value.evaluationSnapshot) ? value.evaluationSnapshot : undefined,
    rewardApplication,
  };
};

const mapChallengeTemplate = (id: string, value: unknown): ChallengeTemplate | null => {
  if (!isRecord(value)) {
    return null;
  }

  const key = getStringOrNull(value.key);
  const ownerUserId = getStringOrNull(value.ownerUserId) ?? undefined;
  const title = getStringOrNull(value.title);
  const description = getStringOrNull(value.description);

  if (!key || !title || !description) {
    return null;
  }

  const rule = mapChallengeRule(value.rule);
  if (!rule) {
    return null;
  }

  const type = value.type;
  if (type !== 'system' && type !== 'custom') {
    return null;
  }

  const scope = value.scope;
  if (scope !== 'global' && scope !== 'weekly' && scope !== 'monthly' && scope !== 'custom_range') {
    return null;
  }

  const visibility = value.visibility;
  if (visibility !== 'fixed' && visibility !== 'selectable' && visibility !== 'user_created') {
    return null;
  }

  const rewards = Array.isArray(value.rewards)
    ? value.rewards.map(mapChallengeReward).filter((r): r is ChallengeReward => !!r)
    : [];

  return {
    id,
    key,
    ownerUserId,
    title,
    description,
    type,
    scope,
    visibility,
    rule,
    rewards,
    timeLimit: mapChallengeTimeLimit(value.timeLimit),
    isRepeatable: getBoolean(value.isRepeatable, false),
    isActive: getBoolean(value.isActive, true),
  };
};

const canTemplateBeReadByUser = (template: ChallengeTemplate, userId?: string | null): boolean => {
  if (template.type === 'system') {
    return true;
  }

  return !!userId && template.ownerUserId === userId;
};

/**
 * Get default system challenge templates.
 * These are used as fallback when Firestore collection is empty.
 * @returns Array of system challenge templates
 */
export const getDefaultChallengeTemplates = (): ChallengeTemplate[] => [
  SYSTEM_COMPLETE_BOOK_TEMPLATE,
  SYSTEM_COMPLETE_BOOK_ENGLISH_TEMPLATE,
  SYSTEM_COMPLETE_BOOK_HISTORY_TEMPLATE,
  SYSTEM_COMPLETE_BOOK_ART_TEMPLATE,
];

const mergeWithFallbackTemplates = (templates: ChallengeTemplate[]): ChallengeTemplate[] => {
  const seen = new Map<string, ChallengeTemplate>();

  templates.forEach((template) => {
    seen.set(template.id, template);
  });

  const defaults = getDefaultChallengeTemplates();
  defaults.forEach((template) => {
    if (!seen.has(template.id)) {
      seen.set(template.id, template);
    }
  });

  return Array.from(seen.values());
};

/**
 * Stream active challenge templates from Firestore.
 * Merges with default templates as fallback.
 * @param callback Function to receive templates
 * @param userId Optional user ID for filtering custom templates
 * @returns Unsubscribe function
 */
export const streamChallengeTemplates = (
  callback: (templates: ChallengeTemplate[]) => void,
  userId?: string | null,
) => {
  try {
    const db = getFirestore();
    const templatesRef = collection(db, 'challengeTemplates');

    return onSnapshot(
      templatesRef,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((snapshotDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => (
            mapChallengeTemplate(snapshotDoc.id, snapshotDoc.data())
          ))
          .filter((template: ChallengeTemplate | null): template is ChallengeTemplate => !!template)
          .filter((template: ChallengeTemplate) => template.isActive)
          .filter((template: ChallengeTemplate) => canTemplateBeReadByUser(template, userId));

        callback(mergeWithFallbackTemplates(mapped));
      },
      (error) => {
        console.error('[challengeService] Error streaming templates:', error);
        callback(getDefaultChallengeTemplates());
      },
    );
  } catch (error) {
    console.error('[challengeService] Error setting up template stream:', error);
    callback(getDefaultChallengeTemplates());
    return () => {};
  }
};

/**
 * Stream user's challenge instances from Firestore.
 * @param uid User ID
 * @param callback Function to receive user challenges
 * @returns Unsubscribe function
 */
export const streamUserChallenges = (
  uid: string,
  callback: (challenges: UserChallengeInstance[]) => void,
) => {
  try {
    const db = getFirestore();
    const challengesRef = collection(db, 'users', uid, 'challenges');

    return onSnapshot(
      challengesRef,
      (snapshot) => {
        const docs = snapshot.docs;
        const mapped: UserChallengeInstance[] = [];
        for (let i = 0; i < docs.length; i += 1) {
          const doc = docs[i];
          const instance = mapToUserChallenge(doc.id, uid, doc.data());
          if (instance !== null) {
            mapped.push(instance);
          }
        }
        callback(mapped);
      },
      (error) => {
        console.error('[challengeService] Error streaming user challenges:', error);
      },
    );
  } catch (error) {
    console.error('[challengeService] Error setting up user challenge stream:', error);
    return () => {};
  }
};

/**
 * Create or update a user's challenge instance.
 * Uses upsert pattern - creates if not exists, updates if exists.
 * @param uid User ID
 * @param instance Challenge instance to save
 */
export const upsertUserChallengeInstance = async (
  uid: string,
  instance: UserChallengeInstance,
): Promise<void> => {
  const db = getFirestore();
  const challengeRef = doc(db, 'users', uid, 'challenges', instance.id);

  const payload: Record<string, unknown> = {
    id: instance.id,
    userId: instance.userId,
    templateId: instance.templateId,
    templateKey: instance.templateKey,
    status: instance.status,
    progress: {
      current: Math.max(0, Math.floor(instance.progress.current)),
      target: Math.max(1, Math.floor(instance.progress.target)),
      percentage: Math.max(0, Math.min(100, Math.floor(instance.progress.percentage))),
    },
    startedAt: instance.startedAt,
    expiresAt: instance.expiresAt ?? null,
    expiredAt: instance.expiredAt ?? null,
    completedAt: instance.completedAt ?? null,
    claimedAt: instance.claimedAt ?? null,
    rewardApplication: {
      applied: !!instance.rewardApplication?.applied,
      appliedAt: instance.rewardApplication?.appliedAt ?? null,
    },
  };

  if (isRecord(instance.evaluationSnapshot)) {
    payload.evaluationSnapshot = instance.evaluationSnapshot;
  }

  await setDoc(challengeRef, payload, { merge: true });
};

export const createCustomChallengeTemplate = async (
  uid: string,
  input: CreateCustomChallengeInput,
): Promise<ChallengeTemplate> => {
  const db = getFirestore();
  const templatesRef = collection(db, 'challengeTemplates');
  const templateRef = doc(templatesRef);

  const title = sanitizeInlineText(input.title, 80);
  const description = sanitizeInlineText(input.description, 220);

  if (!title || !description) {
    throw new Error('INVALID_CUSTOM_CHALLENGE_INPUT');
  }

  const target = Math.max(1, Math.floor(input.target));
  const durationDays = typeof input.durationDays === 'number'
    ? Math.max(0, Math.floor(input.durationDays))
    : 0;
  const createdAt = new Date().toISOString();

  const template: ChallengeTemplate = {
    id: templateRef.id,
    key: `custom_${uid}_${Date.now()}`,
    ownerUserId: uid,
    title,
    description,
    type: 'custom',
    scope: 'global',
    visibility: 'user_created',
    rule: buildCustomChallengeRule({
      ...input,
      target,
    }),
    rewards: [{ kind: 'joker', amount: 1 }],
    ...(durationDays > 0
      ? {
          timeLimit: {
            type: 'duration' as const,
            durationDays,
          },
        }
      : {}),
    isRepeatable: false,
    isActive: true,
  };

  const payload: Record<string, unknown> = {
    id: template.id,
    key: template.key,
    ownerUserId: template.ownerUserId,
    title: template.title,
    description: template.description,
    type: template.type,
    scope: template.scope,
    visibility: template.visibility,
    rule: template.rule,
    rewards: template.rewards,
    timeLimit: template.timeLimit ?? null,
    isRepeatable: template.isRepeatable,
    isActive: template.isActive,
    createdAt,
  };

  await setDoc(templateRef, payload, { merge: true });
  return template;
};