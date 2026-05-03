import { 
  getFirestore, 
  doc, 
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp 
} from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type JokerLedgerEventType =
  | 'weekly_grant'
  | 'book_completion_reward'
  | 'challenge_reward'
  | 'manual_grant'
  | 'streak_freeze_used'
  | 'admin_adjustment';

export interface JokerLedgerEvent {
  id: string;
  type: JokerLedgerEventType;
  amount: number;
  createdAt: string | null;
  weekKey?: string | null;
  dayKey?: string | null;
  sourceId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UserJokerWallet {
  permanentCount: number;
  weeklyJoker: {
    available: number;
    weekKey: string | null;
  };
  totalEarned: number;
  totalUsed: number;
}

export interface UserStreakState {
  current: number;
  longest: number;
  lastActiveDayKey: string | null;
  lastProtectedDayKey: string | null;
  protectedDayKeys: string[];
}

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue | null;
  booksRead: number;
  currentChallenges: string[];
  badges: string[];
  jokers: UserJokerWallet;
  streakState: UserStreakState;
  jokerLedger: JokerLedgerEvent[];
}

const MAX_LEDGER_EVENTS = 40;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

const createDefaultJokerWallet = (): UserJokerWallet => ({
  permanentCount: 0,
  weeklyJoker: {
    available: 0,
    weekKey: null,
  },
  totalEarned: 0,
  totalUsed: 0,
});

const createDefaultStreakState = (): UserStreakState => ({
  current: 0,
  longest: 0,
  lastActiveDayKey: null,
  lastProtectedDayKey: null,
  protectedDayKeys: [],
});

const getStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.length > 0 ? value : null;

const getNonNegativeNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;

const normalizeProtectedDayKeys = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string')))
    .sort((a, b) => a.localeCompare(b));
};

const mapToJokerWallet = (value: unknown): UserJokerWallet => {
  if (!isRecord(value)) {
    return createDefaultJokerWallet();
  }

  const weeklyJoker = isRecord(value.weeklyJoker) ? value.weeklyJoker : {};

  return {
    permanentCount: getNonNegativeNumber(value.permanentCount ?? value.available),
    weeklyJoker: {
      available: getNonNegativeNumber(weeklyJoker.available, 0),
      weekKey: getStringOrNull(weeklyJoker.weekKey ?? (isRecord(value.weeklyGrant) ? value.weeklyGrant.lastGrantedWeekKey : null)),
    },
    totalEarned: getNonNegativeNumber(value.totalEarned),
    totalUsed: getNonNegativeNumber(value.totalUsed),
  };
};

const mapToStreakState = (value: unknown): UserStreakState => {
  if (!isRecord(value)) {
    return createDefaultStreakState();
  }

  return {
    current: getNonNegativeNumber(value.current),
    longest: getNonNegativeNumber(value.longest),
    lastActiveDayKey: getStringOrNull(value.lastActiveDayKey),
    lastProtectedDayKey: getStringOrNull(value.lastProtectedDayKey),
    protectedDayKeys: normalizeProtectedDayKeys(value.protectedDayKeys),
  };
};

const mapToLedgerEvent = (value: unknown): JokerLedgerEvent | null => {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.id !== 'string' || typeof value.type !== 'string' || typeof value.amount !== 'number') {
    return null;
  }

  const allowedTypes: JokerLedgerEventType[] = [
    'weekly_grant',
    'book_completion_reward',
    'challenge_reward',
    'manual_grant',
    'streak_freeze_used',
    'admin_adjustment',
  ];

  if (!allowedTypes.includes(value.type as JokerLedgerEventType)) {
    return null;
  }

  const weekKey = getStringOrNull(value.weekKey);
  const dayKey = getStringOrNull(value.dayKey);
  const sourceId = getStringOrNull(value.sourceId);

  const metadata = isRecord(value.metadata)
    ? Object.entries(value.metadata).reduce<Record<string, string | number | boolean | null>>((acc, [key, metadataValue]) => {
        if (
          typeof metadataValue === 'string' ||
          typeof metadataValue === 'number' ||
          typeof metadataValue === 'boolean' ||
          metadataValue === null
        ) {
          acc[key] = metadataValue;
        }
        return acc;
      }, {})
    : null;

  return {
    id: value.id,
    type: value.type as JokerLedgerEventType,
    amount: value.amount,
    createdAt: mapLedgerCreatedAt(value.createdAt),
    ...(weekKey !== null ? { weekKey } : {}),
    ...(dayKey !== null ? { dayKey } : {}),
    ...(sourceId !== null ? { sourceId } : {}),
    ...(metadata ? { metadata } : {}),
  };
};

const mapToLedger = (value: unknown): JokerLedgerEvent[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(mapToLedgerEvent)
    .filter((entry): entry is JokerLedgerEvent => !!entry)
    .slice(-MAX_LEDGER_EVENTS);
};

const appendLedgerEvent = (ledger: JokerLedgerEvent[], event: JokerLedgerEvent): JokerLedgerEvent[] => {
  const nextLedger = [...ledger, event];
  return nextLedger.slice(-MAX_LEDGER_EVENTS);
};

const createEventId = (): string => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
const getNowIsoTimestamp = (): string => new Date().toISOString();

const mapLedgerCreatedAt = (value: unknown): string | null => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  if (
    isRecord(value)
    && 'toDate' in value
    && typeof value.toDate === 'function'
  ) {
    try {
      const parsed = value.toDate();
      if (parsed instanceof Date && !Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    } catch {
      return null;
    }
  }

  return null;
};

const mapToUserDocument = (
  uid: string,
  data: FirebaseFirestoreTypes.DocumentData,
): UserDocument => ({
  uid: (typeof data.uid === 'string' && data.uid.length > 0) ? data.uid : uid,
  email: typeof data.email === 'string' ? data.email : null,
  displayName: typeof data.displayName === 'string' ? data.displayName : null,
  createdAt: data.createdAt ?? null,
  booksRead: typeof data.booksRead === 'number' ? data.booksRead : 0,
  currentChallenges: Array.isArray(data.currentChallenges)
    ? data.currentChallenges.filter((challenge): challenge is string => typeof challenge === 'string')
    : [],
  badges: Array.isArray(data.badges)
    ? data.badges.filter((badge): badge is string => typeof badge === 'string')
    : [],
  jokers: mapToJokerWallet(data.jokers),
  streakState: mapToStreakState(data.streakState),
  jokerLedger: mapToLedger(data.jokerLedger),
});

/**
 * Creates the user document in Firestore's `users` collection.
 * Called immediately after Firebase Auth account creation (SignupScreen).
 *
 * @param uid - Firebase Auth UID
 * @param email - User email
 * @param displayName - Username chosen during signup
 */
export const createUserDocument = async (
  uid: string,
  email: string | null,
  displayName: string | null,
): Promise<void> => {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);

  const userData: UserDocument = {
    uid,
    email,
    displayName,
    createdAt: serverTimestamp(),
    booksRead: 0,
    currentChallenges: [],
    badges: [],
    jokers: createDefaultJokerWallet(),
    streakState: createDefaultStreakState(),
    jokerLedger: [],
  };

  try {
    await setDoc(userRef, userData, { merge: true });
  } catch (err: any) {
    console.error('[userService] Failed to create user document:', err.code, err.message);
    throw err;
  }
};

/**
 * Retrieves one user document from Firestore.
 */
export const getUserDocument = async (uid: string): Promise<UserDocument | null> => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    if (!data) {
      return null;
    }

    return mapToUserDocument(uid, data);
  } catch (error) {
    console.error('[userService] Error fetching user document:', error);
    return null;
  }
};

/**
 * Stream one user document in real-time.
 */
export const streamUserDocument = (
  uid: string,
  callback: (userDocument: UserDocument | null) => void,
) => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);

    return onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
          return;
        }

        const data = snapshot.data();
        if (!data) {
          callback(null);
          return;
        }

        callback(mapToUserDocument(uid, data));
      },
      (error) => {
        console.error('[userService] Error streaming user document:', error);
      },
    );
  } catch (error) {
    console.error('[userService] Error setting up user document stream:', error);
    return () => {};
  }
};

export const grantWeeklyJokerIfNeeded = async (uid: string, weekKey: string): Promise<boolean> => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return false;
    }

    const mappedUser = mapToUserDocument(uid, snapshot.data() || {});
    if (mappedUser.jokers.weeklyJoker.weekKey === weekKey && mappedUser.jokers.weeklyJoker.available > 0) {
      return false;
    }

    const nextWallet: UserJokerWallet = {
      ...mappedUser.jokers,
      weeklyJoker: {
        available: 1,
        weekKey: weekKey,
      },
      totalEarned: mappedUser.jokers.totalEarned + 1,
    };

    const nextLedger = appendLedgerEvent(mappedUser.jokerLedger, {
      id: createEventId(),
      type: 'weekly_grant',
      amount: 1,
      weekKey,
      createdAt: getNowIsoTimestamp(),
    });

    await setDoc(
      userRef,
      {
        jokers: nextWallet,
        jokerLedger: nextLedger,
      },
      { merge: true },
    );

    return true;
  } catch (error) {
    console.error('[userService] Error granting weekly joker:', error);
    return false;
  }
};

export const consumeJokerForProtectedDay = async (
  uid: string,
  protectedDayKey: string,
  weekKey: string,
): Promise<boolean> => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return false;
    }

    const mappedUser = mapToUserDocument(uid, snapshot.data() || {});

    let nextPermanentCount = mappedUser.jokers.permanentCount;
    let nextWeeklyJokerAvailable = mappedUser.jokers.weeklyJoker.available;

    const isWeeklyJokerValid = mappedUser.jokers.weeklyJoker.weekKey === weekKey;

    if (isWeeklyJokerValid && nextWeeklyJokerAvailable > 0) {
      nextWeeklyJokerAvailable = 0;
    } else if (nextPermanentCount > 0) {
      nextPermanentCount -= 1;
    } else {
      return false;
    }

    const nextWallet: UserJokerWallet = {
      ...mappedUser.jokers,
      permanentCount: nextPermanentCount,
      weeklyJoker: {
        ...mappedUser.jokers.weeklyJoker,
        available: nextWeeklyJokerAvailable,
      },
      totalUsed: mappedUser.jokers.totalUsed + 1,
    };

    const nextProtectedDayKeys = Array.from(new Set([
      ...mappedUser.streakState.protectedDayKeys,
      protectedDayKey,
    ])).sort((a, b) => a.localeCompare(b)).slice(-30);

    const nextStreakState: UserStreakState = {
      ...mappedUser.streakState,
      lastProtectedDayKey: protectedDayKey,
      protectedDayKeys: nextProtectedDayKeys,
    };

    const nextLedger = appendLedgerEvent(mappedUser.jokerLedger, {
      id: createEventId(),
      type: 'streak_freeze_used',
      amount: -1,
      weekKey,
      dayKey: protectedDayKey,
      createdAt: getNowIsoTimestamp(),
    });

    await setDoc(
      userRef,
      {
        jokers: nextWallet,
        streakState: nextStreakState,
        jokerLedger: nextLedger,
      },
      { merge: true },
    );

    return true;
  } catch (error) {
    console.error('[userService] Error consuming joker for streak protection:', error);
    return false;
  }
};

export const grantChallengeJokerReward = async (
  uid: string,
  amount: number,
  sourceChallengeId: string,
  sourceTemplateId: string,
): Promise<boolean> => {
  try {
    const normalizedAmount = Number.isFinite(amount) ? Math.max(1, Math.floor(amount)) : 1;
    const normalizedSourceChallengeId = typeof sourceChallengeId === 'string' && sourceChallengeId.trim().length > 0
      ? sourceChallengeId
      : null;
    const normalizedSourceTemplateId = typeof sourceTemplateId === 'string' && sourceTemplateId.trim().length > 0
      ? sourceTemplateId
      : null;

    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return false;
    }

    const mappedUser = mapToUserDocument(uid, snapshot.data() || {});

    const nextWallet: UserJokerWallet = {
      ...mappedUser.jokers,
      permanentCount: mappedUser.jokers.permanentCount + normalizedAmount,
      totalEarned: mappedUser.jokers.totalEarned + normalizedAmount,
    };

    const nextLedger = appendLedgerEvent(mappedUser.jokerLedger, {
      id: createEventId(),
      type: 'challenge_reward',
      amount: normalizedAmount,
      sourceId: normalizedSourceChallengeId,
      createdAt: getNowIsoTimestamp(),
      ...(normalizedSourceTemplateId
        ? {
            metadata: {
              sourceTemplateId: normalizedSourceTemplateId,
            },
          }
        : {}),
    });

    await setDoc(
      userRef,
      {
        jokers: nextWallet,
        jokerLedger: nextLedger,
      },
      { merge: true },
    );

    return true;
  } catch (error) {
    console.error('[userService] Error granting challenge joker reward:', error);
    return false;
  }
};

export const grantBookCompletionJoker = async (
  uid: string,
  bookId: string,
  dayKey: string | null = null,
): Promise<boolean> => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return false;
    }

    const mappedUser = mapToUserDocument(uid, snapshot.data() || {});
    const alreadyGranted = mappedUser.jokerLedger.some(
      (entry) => entry.type === 'book_completion_reward' && entry.sourceId === bookId,
    );

    if (alreadyGranted) {
      return false;
    }

    const nextWallet: UserJokerWallet = {
      ...mappedUser.jokers,
      permanentCount: mappedUser.jokers.permanentCount + 1,
      totalEarned: mappedUser.jokers.totalEarned + 1,
    };

    const nextLedger = appendLedgerEvent(mappedUser.jokerLedger, {
      id: createEventId(),
      type: 'book_completion_reward',
      amount: 1,
      dayKey,
      sourceId: bookId,
      createdAt: getNowIsoTimestamp(),
    });

    await setDoc(
      userRef,
      {
        jokers: nextWallet,
        jokerLedger: nextLedger,
      },
      { merge: true },
    );

    return true;
  } catch (error) {
    console.error('[userService] Error granting book completion joker:', error);
    return false;
  }
};
