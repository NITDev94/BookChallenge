/**
 * Firestore service for user rewards earned from challenges.
 * Handles persistence, streaming, and reward application.
 */
import {
  collection,
  doc,
  FirebaseFirestoreTypes,
  getDoc,
  getFirestore,
  onSnapshot,
  setDoc,
} from '@react-native-firebase/firestore';
import { grantChallengeJokerReward } from './userService';
import { ChallengeTemplate, UserChallengeInstance, UserReward } from '../types/challenges';

/** Type guard for plain objects */
const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);

/** Safely extract non-empty string or return null */
const getStringOrNull = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null;

/** Retryable Firestore error codes */
const FIRESTORE_RETRYABLE_CODES = new Set([
  'firestore/unavailable',
  'firestore/deadline-exceeded',
  'firestore/aborted',
  'firestore/resource-exhausted',
]);

/** Simple sleep utility for retry delays */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

/** Extract Firestore error code from unknown error */
const getFirestoreErrorCode = (error: unknown): string | null => {
  if (isRecord(error) && typeof error.code === 'string' && error.code.trim().length > 0) {
    return error.code.startsWith('firestore/') ? error.code : `firestore/${error.code}`;
  }

  if (error instanceof Error) {
    const match = error.message.match(/\[(firestore\/[a-z-]+)\]/i);
    if (match?.[1]) {
      return match[1].toLowerCase();
    }
  }

  return null;
};

const isRetryableFirestoreError = (error: unknown): boolean => {
  const code = getFirestoreErrorCode(error);
  return !!code && FIRESTORE_RETRYABLE_CODES.has(code);
};

const withFirestoreRetry = async <T>(
  operationName: string,
  operation: () => Promise<T>,
  maxAttempts = 4,
): Promise<T> => {
  let attempt = 0;

  while (attempt < maxAttempts) {
    attempt += 1;

    try {
      return await operation();
    } catch (error) {
      const isRetryable = isRetryableFirestoreError(error);

      if (!isRetryable || attempt >= maxAttempts) {
        throw error;
      }

      const baseBackoff = Math.min(250 * (2 ** (attempt - 1)), 3000);
      const jitter = Math.floor(Math.random() * 120);
      const waitMs = baseBackoff + jitter;
      const code = getFirestoreErrorCode(error) ?? 'firestore/unknown';

      console.warn(
        `[rewardService] ${operationName} failed with ${code} (attempt ${attempt}/${maxAttempts}). Retrying in ${waitMs}ms...`,
      );

      await sleep(waitMs);
    }
  }

throw new Error(`[rewardService] ${operationName} failed after ${maxAttempts} attempts`);
};

const rewardDocId = (
  challengeId: string,
  templateId: string,
  rewardIndex: number,
): string => `${challengeId}__${templateId}__${rewardIndex}`;

/**
 * Stream user's rewards from Firestore.
 * @param uid User ID
 * @param callback Function to receive rewards
 * @returns Unsubscribe function
 */
export const streamUserRewards = (
  uid: string,
  callback: (rewards: UserReward[]) => void,
) => {
  try {
    const db = getFirestore();
    const rewardsRef = collection(db, 'users', uid, 'rewards');

    return onSnapshot(
      rewardsRef,
      (snapshot) => {
        const mapped = snapshot.docs
          .map((snapshotDoc: FirebaseFirestoreTypes.QueryDocumentSnapshot): UserReward | null => {
            const data = snapshotDoc.data();
            if (!data?.rewardId || !data?.unlockedAt) {
              return null;
            }
            return {
              id: snapshotDoc.id,
              userId: uid,
              rewardId: data.rewardId ?? snapshotDoc.id,
              sourceChallengeId: data.sourceChallengeId ?? '',
              sourceTemplateId: data.sourceTemplateId ?? '',
              kind: (data.kind as UserReward['kind']) ?? 'joker',
              status: (data.status as UserReward['status']) ?? 'unlocked',
              unlockedAt: data.unlockedAt ?? new Date().toISOString(),
              claimedAt: data.claimedAt ?? null,
              usedAt: data?.usedAt ?? null,
              payload: data?.payload,
            } as UserReward;
          })
          .filter((r: UserReward): r is UserReward => r !== null && !!r.rewardId && !!r.unlockedAt);

        callback(mapped);
      },
      (error) => {
        console.error('[rewardService] Error streaming user rewards:', error);
      },
    );
  } catch (error) {
    console.error('[rewardService] Error setting up reward stream:', error);
    return () => {};
  }
};

/**
 * Apply rewards from a completed challenge to the user.
 * Handles idempotent reward granting using check-then-act pattern.
 * @param uid User ID
 * @param challenge Completed user challenge instance
 * @param template Challenge template with reward definitions
 * @returns True if rewards applied successfully
 */
export const applyChallengeRewards = async (
  uid: string,
  challenge: UserChallengeInstance,
  template: ChallengeTemplate,
): Promise<boolean> => {
  try {
    const db = getFirestore();

    for (let i = 0; i < template.rewards.length; i += 1) {
      const reward = template.rewards[i];
      const userRewardId = rewardDocId(challenge.id, template.id, i);
      const userRewardRef = doc(db, 'users', uid, 'rewards', userRewardId);
      const existingRewardSnapshot = await withFirestoreRetry(
        `get reward doc ${userRewardId}`,
        () => getDoc(userRewardRef),
      );

      if (existingRewardSnapshot.exists()) {
        continue;
      }

      if (reward.kind === 'joker') {
        const granted = await grantChallengeJokerReward(uid, reward.amount, challenge.id, template.id);
        if (!granted) {
          return false;
        }
      }

      const payload: Record<string, string | number | boolean | null> = {};
      payload.sourceTemplateKey = template.key;
      payload.sourceTemplateTitle = template.title;

      if (reward.kind === 'joker' || reward.kind === 'xp' || reward.kind === 'coins') {
        payload.amount = reward.amount;
      }
      if (reward.kind === 'badge') {
        payload.badgeId = reward.badgeId;
      }
      if (reward.kind === 'reward_unlock') {
        payload.rewardId = reward.rewardId;
      }

      const userReward: UserReward = {
        id: userRewardId,
        userId: uid,
        rewardId: `${template.key}__${i}__${reward.kind}`,
        sourceChallengeId: challenge.id,
        sourceTemplateId: template.id,
        kind: reward.kind,
        status: 'claimed',
        unlockedAt: new Date().toISOString(),
        claimedAt: new Date().toISOString(),
        payload,
      };

      await withFirestoreRetry(
        `set reward doc ${userRewardId}`,
        () => setDoc(userRewardRef, userReward, { merge: true }),
      );
    }

    return true;
  } catch (error) {
    const code = getFirestoreErrorCode(error);
    if (code) {
      console.error(
        `[rewardService] Error applying challenge rewards (${code}) for challenge=${challenge.id} template=${template.id}:`,
        error,
      );
    } else {
      console.error('[rewardService] Error applying challenge rewards:', error);
    }
    return false;
  }
};

export const claimReward = async (uid: string, rewardId: string): Promise<boolean> => {
  try {
    const db = getFirestore();
    const rewardRef = doc(db, 'users', uid, 'rewards', rewardId);

    await withFirestoreRetry(
      `claim reward ${rewardId}`,
      () => setDoc(rewardRef, {
        status: 'claimed',
        claimedAt: new Date().toISOString(),
      }, { merge: true }),
    );

    return true;
  } catch (error) {
    console.error('[rewardService] Error claiming reward:', error);
    return false;
  }
};
