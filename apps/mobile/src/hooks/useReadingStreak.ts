import { useEffect, useMemo, useRef, useState } from 'react';
import { streamUserBooks, UserBookDocument } from '../services/userBookService';
import {
  consumeJokerForProtectedDay,
  grantWeeklyJokerIfNeeded,
  streamUserDocument,
  UserDocument,
} from '../services/userService';
import { computeReadingStreakWithJokers, getIsoWeekKey } from '../utils/readingStreak';

export const useReadingStreak = (userId?: string | null) => {
  const [userBooks, setUserBooks] = useState<UserBookDocument[]>([]);
  const [userDocument, setUserDocument] = useState<UserDocument | null>(null);
  const [isUserBooksLoading, setIsUserBooksLoading] = useState(true);
  const [isUserDocumentLoading, setIsUserDocumentLoading] = useState(true);
  const pendingWeeklyGrantWeekRef = useRef<string | null>(null);
  const pendingProtectedDaysRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setUserBooks([]);
      setIsUserBooksLoading(false);
      return;
    }

    setIsUserBooksLoading(true);

    const unsubscribe = streamUserBooks(userId, (books) => {
      setUserBooks(books);
      setIsUserBooksLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUserDocument(null);
      setIsUserDocumentLoading(false);
      return;
    }

    setIsUserDocumentLoading(true);

    const unsubscribe = streamUserDocument(userId, (document) => {
      setUserDocument(document);
      setIsUserDocumentLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const persistedProtectedDayKeys = useMemo(
    () => userDocument?.streakState.protectedDayKeys ?? [],
    [userDocument?.streakState.protectedDayKeys],
  );

  const weekKey = useMemo(() => getIsoWeekKey(new Date()), []);

  const weeklyJokerAvailable = (userDocument?.jokers.weeklyJoker.weekKey === weekKey)
    ? (userDocument?.jokers.weeklyJoker.available ?? 0)
    : 0;
  const permanentJokers = userDocument?.jokers.permanentCount ?? 0;

  const streakComputation = useMemo(
    () => computeReadingStreakWithJokers({
      books: userBooks,
      weeklyJokerAvailable,
      permanentJokers,
      alreadyProtectedDayKeys: persistedProtectedDayKeys,
    }),
    [userBooks, weeklyJokerAvailable, permanentJokers, persistedProtectedDayKeys],
  );

  useEffect(() => {
    if (!userId || !userDocument) {
      return;
    }

    const currentWeekKey = streakComputation.weekKey;
    const hasValidWeeklyJoker = userDocument.jokers.weeklyJoker.weekKey === currentWeekKey 
      && userDocument.jokers.weeklyJoker.available > 0;

    if (hasValidWeeklyJoker) {
      return;
    }

    if (pendingWeeklyGrantWeekRef.current === currentWeekKey) {
      return;
    }

    pendingWeeklyGrantWeekRef.current = currentWeekKey;

    grantWeeklyJokerIfNeeded(userId, currentWeekKey)
      .catch((error) => {
        console.error('[useReadingStreak] Error granting weekly joker:', error);
      })
      .finally(() => {
        if (pendingWeeklyGrantWeekRef.current === currentWeekKey) {
          pendingWeeklyGrantWeekRef.current = null;
        }
      });
  }, [userId, userDocument, streakComputation.weekKey]);

  useEffect(() => {
    if (!userId || !userDocument || streakComputation.newlyProtectedDayKeys.length === 0) {
      return;
    }

    const currentWeekKey = streakComputation.weekKey;

    const dayKeysToPersist = streakComputation.newlyProtectedDayKeys.filter(
      (dayKey) =>
        !persistedProtectedDayKeys.includes(dayKey)
        && !pendingProtectedDaysRef.current.has(dayKey),
    );

    if (dayKeysToPersist.length === 0) {
      return;
    }

    dayKeysToPersist.forEach((dayKey) => pendingProtectedDaysRef.current.add(dayKey));

    (async () => {
      try {
        for (const dayKey of dayKeysToPersist) {
          await consumeJokerForProtectedDay(userId, dayKey, currentWeekKey);
        }
      } catch (error) {
        console.error('[useReadingStreak] Error persisting consumed jokers:', error);
      } finally {
        dayKeysToPersist.forEach((dayKey) => pendingProtectedDaysRef.current.delete(dayKey));
      }
    })();
  }, [
    userId,
    userDocument,
    persistedProtectedDayKeys,
    streakComputation.newlyProtectedDayKeys,
    streakComputation.weekKey,
  ]);

  const isLoading = isUserBooksLoading || isUserDocumentLoading;

  return {
    userBooks,
    userDocument,
    readingStreak: streakComputation.readingStreak,
    isBroken: streakComputation.isBroken,
    weekKey,
    weekTimeline: streakComputation.weekTimeline,
    availableJokers: streakComputation.remainingJokers,
    weeklyJokerAvailable: streakComputation.remainingWeeklyJokers,
    permanentJokers: streakComputation.remainingPermanentJokers,
    consumedJokersInCurrentComputation: streakComputation.consumedJokers,
    usedJokerInCurrentStreak: streakComputation.usedJokerInCurrentStreak,
    lastProtectedDayKey: streakComputation.lastProtectedDayKey,
    isLoading,
  };
};
