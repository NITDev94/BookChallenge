import { ProgressHistoryEntry, UserBookDocument } from '../services/userBookService';

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;

export type WeekTimelineDayStatus = 'read' | 'protected' | 'empty';

export interface WeekTimelineDay {
  dayKey: string;
  label: (typeof WEEKDAY_LABELS)[number];
  status: WeekTimelineDayStatus;
  isToday: boolean;
}

export interface ReadingStreakComputationInput {
  books: UserBookDocument[];
  weeklyJokerAvailable: number;
  permanentJokers: number;
  alreadyProtectedDayKeys?: string[];
  today?: Date;
}

export interface ReadingStreakComputationResult {
  readingStreak: number;
  isBroken: boolean;
  consumedJokers: number;
  remainingJokers: number;
  remainingWeeklyJokers: number;
  remainingPermanentJokers: number;
  availableJokers: number;
  weekKey: string;
  weekTimeline: WeekTimelineDay[];
  activeProtectedDayKeys: string[];
  newlyProtectedDayKeys: string[];
  lastProtectedDayKey: string | null;
  usedJokerInCurrentStreak: boolean;
}

const isValidDayKey = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value);

const dayKeyToUtcTime = (dayKey: string): number => {
  const [year, month, day] = dayKey.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
};

const utcTimeToDayKey = (utcTime: number): string => {
  const date = new Date(utcTime);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addDaysToDayKey = (dayKey: string, dayDiff: number): string => {
  const nextTime = dayKeyToUtcTime(dayKey) + (dayDiff * DAY_MS);
  return utcTimeToDayKey(nextTime);
};

const normalizeNonNegativeInt = (value: number): number => {
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }

  return Math.floor(value);
};

export const toLocalDayKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getIsoWeekKey = (date: Date): string => {
  const normalized = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = normalized.getUTCDay() || 7;
  normalized.setUTCDate(normalized.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(normalized.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((normalized.getTime() - yearStart.getTime()) / DAY_MS) + 1) / 7);
  const week = String(weekNumber).padStart(2, '0');
  return `${normalized.getUTCFullYear()}-W${week}`;
};

const resolveDayKeyFromEntry = (entry: ProgressHistoryEntry): string | null => {
  if (entry.localDayKey && isValidDayKey(entry.localDayKey)) {
    return entry.localDayKey;
  }

  const parsedDate = new Date(entry.date);
  if (!Number.isNaN(parsedDate.getTime())) {
    return toLocalDayKey(parsedDate);
  }

  return null;
};

const collectUniqueActivityDayKeys = (books: UserBookDocument[]): string[] => {
  const uniqueDates = new Set<string>();

  books.forEach((book) => {
    (book.progressHistory || []).forEach((entry) => {
      const dayKey = resolveDayKeyFromEntry(entry);
      if (dayKey) {
        uniqueDates.add(dayKey);
      }
    });
  });

  return Array.from(uniqueDates).sort((a, b) => b.localeCompare(a));
};

const getCurrentWeekDayKeys = (today: Date): string[] => {
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const dayOfWeek = startOfDay.getDay();
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(startOfDay);
  monday.setDate(startOfDay.getDate() + diffToMonday);

  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return toLocalDayKey(day);
  });
};

const pushUnique = (target: string[], dayKey: string): void => {
  if (!target.includes(dayKey)) {
    target.push(dayKey);
  }
};

const buildWeekTimeline = (
  today: Date,
  readDayKeys: Set<string>,
  protectedDayKeys: Set<string>,
): WeekTimelineDay[] => {
  const weekDayKeys = getCurrentWeekDayKeys(today);
  const todayKey = toLocalDayKey(today);

  return weekDayKeys.map((dayKey, index) => {
    let status: WeekTimelineDayStatus = 'empty';
    if (readDayKeys.has(dayKey)) {
      status = 'read';
    } else if (protectedDayKeys.has(dayKey)) {
      status = 'protected';
    }

    return {
      dayKey,
      label: WEEKDAY_LABELS[index],
      status,
      isToday: dayKey === todayKey,
    };
  });
};

export const upsertProgressHistoryEntry = (
  history: ProgressHistoryEntry[],
  nextEntry: ProgressHistoryEntry
): ProgressHistoryEntry[] => {
  const entriesByDayKey = new Map<string, ProgressHistoryEntry>();

  history.forEach((entry) => {
    const dayKey = resolveDayKeyFromEntry(entry);
    if (!dayKey) {
      return;
    }

    const existing = entriesByDayKey.get(dayKey);
    if (!existing) {
      entriesByDayKey.set(dayKey, { ...entry, localDayKey: dayKey });
      return;
    }

    const existingTime = Date.parse(existing.date);
    const nextTime = Date.parse(entry.date);
    if (Number.isNaN(existingTime) || (!Number.isNaN(nextTime) && nextTime >= existingTime)) {
      entriesByDayKey.set(dayKey, { ...entry, localDayKey: dayKey });
    }
  });

  const targetDayKey = resolveDayKeyFromEntry(nextEntry);
  if (targetDayKey) {
    entriesByDayKey.set(targetDayKey, { ...nextEntry, localDayKey: targetDayKey });
  }

  return Array.from(entriesByDayKey.values()).sort((a, b) => {
    const aTime = Date.parse(a.date);
    const bTime = Date.parse(b.date);

    if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
      return 0;
    }
    if (Number.isNaN(aTime)) {
      return -1;
    }
    if (Number.isNaN(bTime)) {
      return 1;
    }

    return aTime - bTime;
  });
};

export const getReadingStreakFromBooks = (books: UserBookDocument[]): number => {
  const result = computeReadingStreakWithJokers({
    books,
    weeklyJokerAvailable: 0,
    permanentJokers: 0,
  });

  return result.readingStreak;
};

export const computeReadingStreakWithJokers = ({
  books,
  weeklyJokerAvailable,
  permanentJokers,
  alreadyProtectedDayKeys = [],
  today = new Date(),
}: ReadingStreakComputationInput): ReadingStreakComputationResult => {
  const sortedDates = collectUniqueActivityDayKeys(books);
  const normalizedWeeklyJokers = normalizeNonNegativeInt(weeklyJokerAvailable);
  const normalizedPermanentJokers = normalizeNonNegativeInt(permanentJokers);
  const totalAvailableJokers = normalizedWeeklyJokers + normalizedPermanentJokers;
  const readDayKeysSet = new Set(sortedDates);
  const existingProtectedSet = new Set(
    alreadyProtectedDayKeys.filter((dayKey) => isValidDayKey(dayKey)),
  );

  const weekKey = getIsoWeekKey(today);

  if (sortedDates.length === 0) {
    const weekTimeline = buildWeekTimeline(today, readDayKeysSet, existingProtectedSet);
    return {
      readingStreak: 0,
      isBroken: true,
      consumedJokers: 0,
      remainingJokers: totalAvailableJokers,
      remainingWeeklyJokers: normalizedWeeklyJokers,
      remainingPermanentJokers: normalizedPermanentJokers,
      availableJokers: totalAvailableJokers,
      weekKey,
      weekTimeline,
      activeProtectedDayKeys: [],
      newlyProtectedDayKeys: [],
      lastProtectedDayKey: null,
      usedJokerInCurrentStreak: false,
    };
  }

  const activeProtectedDayKeys: string[] = [];
  const newlyProtectedDayKeys: string[] = [];
  let consumedWeeklyJokers = 0;
  let consumedPermanentJokers = 0;

  const consumeJokerForDay = (dayKey: string): boolean => {
    if (existingProtectedSet.has(dayKey)) {
      pushUnique(activeProtectedDayKeys, dayKey);
      return true;
    }

    if (normalizedWeeklyJokers > consumedWeeklyJokers) {
      consumedWeeklyJokers += 1;
      pushUnique(newlyProtectedDayKeys, dayKey);
      pushUnique(activeProtectedDayKeys, dayKey);
      return true;
    }

    if (normalizedPermanentJokers > consumedPermanentJokers) {
      consumedPermanentJokers += 1;
      pushUnique(newlyProtectedDayKeys, dayKey);
      pushUnique(activeProtectedDayKeys, dayKey);
      return true;
    }

    return false;
  };

  const todayKey = toLocalDayKey(today);
  const latestActivityTime = dayKeyToUtcTime(sortedDates[0]);
  const todayTime = dayKeyToUtcTime(todayKey);
  const diffFromToday = Math.floor((todayTime - latestActivityTime) / DAY_MS);

  let streak = 0;

  if (diffFromToday <= 1) {
    streak = 1;
  } else if (diffFromToday === 2) {
    const missingYesterdayKey = addDaysToDayKey(todayKey, -1);
    const couldProtect = consumeJokerForDay(missingYesterdayKey);
    if (!couldProtect) {
      const weekTimeline = buildWeekTimeline(today, readDayKeysSet, existingProtectedSet);
      return {
        readingStreak: 0,
        isBroken: true,
        consumedJokers: 0,
        remainingJokers: totalAvailableJokers,
        remainingWeeklyJokers: normalizedWeeklyJokers,
        remainingPermanentJokers: normalizedPermanentJokers,
        availableJokers: totalAvailableJokers,
        weekKey,
        weekTimeline,
        activeProtectedDayKeys: [],
        newlyProtectedDayKeys: [],
        lastProtectedDayKey: null,
        usedJokerInCurrentStreak: false,
      };
    }

    streak = 2;
  } else {
    const weekTimeline = buildWeekTimeline(today, readDayKeysSet, existingProtectedSet);
    return {
      readingStreak: 0,
      isBroken: true,
      consumedJokers: 0,
      remainingJokers: totalAvailableJokers,
      remainingWeeklyJokers: normalizedWeeklyJokers,
      remainingPermanentJokers: normalizedPermanentJokers,
      availableJokers: totalAvailableJokers,
      weekKey,
      weekTimeline,
      activeProtectedDayKeys: [],
      newlyProtectedDayKeys: [],
      lastProtectedDayKey: null,
      usedJokerInCurrentStreak: false,
    };
  }

  for (let i = 1; i < sortedDates.length; i += 1) {
    const previousTime = dayKeyToUtcTime(sortedDates[i - 1]);
    const currentTime = dayKeyToUtcTime(sortedDates[i]);
    const diffInDays = (previousTime - currentTime) / DAY_MS;

    if (diffInDays === 1) {
      streak += 1;
      continue;
    }

    if (diffInDays === 2) {
      const protectedGapDayKey = addDaysToDayKey(sortedDates[i - 1], -1);
      const couldProtect = consumeJokerForDay(protectedGapDayKey);
      if (!couldProtect) {
        break;
      }

      streak += 2;
      continue;
    }

    break;
  }

  const consumedJokers = newlyProtectedDayKeys.length;
  const remainingJokers = totalAvailableJokers - consumedJokers;
  const remainingWeeklyJokers = normalizedWeeklyJokers - consumedWeeklyJokers;
  const remainingPermanentJokers = normalizedPermanentJokers - consumedPermanentJokers;

  const mergedProtectedSet = new Set<string>([
    ...existingProtectedSet,
    ...newlyProtectedDayKeys,
  ]);
  const weekTimeline = buildWeekTimeline(today, readDayKeysSet, mergedProtectedSet);

  return {
    readingStreak: streak,
    isBroken: streak === 0,
    consumedJokers,
    remainingJokers,
    remainingWeeklyJokers,
    remainingPermanentJokers,
    availableJokers: totalAvailableJokers,
    weekKey,
    weekTimeline,
    activeProtectedDayKeys,
    newlyProtectedDayKeys,
    lastProtectedDayKey: activeProtectedDayKeys[0] ?? null,
    usedJokerInCurrentStreak: activeProtectedDayKeys.length > 0,
  };
};
