import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { streamUserBooks, UserBookDocument } from '../services/userBookService';
import {
  createCustomChallengeTemplate,
  streamChallengeTemplates,
  streamUserChallenges,
  upsertUserChallengeInstance,
} from '../services/challengeService';
import { streamUserRewards, applyChallengeRewards } from '../services/rewardService';
import {
  ChallengeTemplate,
  CreateCustomChallengeInput,
  UserChallengeInstance,
  UserChallengeStatus,
  UserReward,
} from '../types/challenges';
import { buildChallengeAggregates } from '../utils/challengeAggregates';
import { evaluateChallengeRule } from '../utils/challengeEvaluator';

/**
 * Challenge orchestration hook.
 * Manages challenge templates, user instances, progress evaluation, and reward application.
 *
 * Responsibilities:
 * - Stream challenge templates from Firestore (with fallback defaults)
 * - Stream user's challenge instances
 * - Derive aggregates from user books
 * - Evaluate progress for each challenge
 * - Automatically apply rewards when challenges complete
 * - Handle selection/unselection of selectable challenges
 *
 * @param userId Current user ID (null if not authenticated)
 */
const createChallengeInstanceId = (template: ChallengeTemplate): string => template.id;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const parseIsoToMs = (value?: string | null): number | null => {
  if (!value) {
    return null;
  }

  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
};

/**
 * Resolves the expiration date for a challenge instance.
 *
 * Edge cases covered:
 * - invalid/missing ISO values from Firestore
 * - malformed duration values
 * - legacy instances without expiresAt (computed on the fly)
 */
const resolveExpiresAt = (
  template: ChallengeTemplate,
  startedAt: string,
  existingExpiresAt: string | null | undefined,
  nowIso: string,
): string | null => {
  if (existingExpiresAt && parseIsoToMs(existingExpiresAt) !== null) {
    return existingExpiresAt;
  }

  const timeLimit = template.timeLimit;

  if (!timeLimit || timeLimit.type === 'none') {
    return null;
  }

  if (timeLimit.type === 'fixed_range') {
    return parseIsoToMs(timeLimit.endAt) !== null ? timeLimit.endAt ?? null : null;
  }

  if (timeLimit.type === 'duration') {
    const durationDays = typeof timeLimit.durationDays === 'number'
      ? Math.floor(timeLimit.durationDays)
      : 0;

    if (durationDays < 1) {
      return null;
    }

    const startedMs = parseIsoToMs(startedAt) ?? Date.parse(nowIso);
    return new Date(startedMs + (durationDays * DAY_IN_MS)).toISOString();
  }

  return null;
};

const isExpiredAt = (expiresAt: string | null | undefined, nowMs: number): boolean => {
  const expiresMs = parseIsoToMs(expiresAt);
  return expiresMs !== null && expiresMs <= nowMs;
};

const deriveStatus = (
  existingStatus: UserChallengeStatus | undefined,
  isCompletedNow: boolean,
  isExpiredNow: boolean,
): UserChallengeStatus => {
  if (existingStatus === 'archived') {
    return 'archived';
  }

  if (existingStatus === 'claimed') {
    return 'claimed';
  }

  if (existingStatus === 'completed') {
    return 'completed';
  }

  if (existingStatus === 'expired') {
    return 'expired';
  }

  if (isCompletedNow) {
    return 'completed';
  }

  return isExpiredNow ? 'expired' : 'active';
};

const isTerminalStatus = (status: UserChallengeStatus | undefined): boolean => {
  return status === 'completed'
    || status === 'claimed'
    || status === 'expired'
    || status === 'archived';
};

/**
 * View model item for UI rendering.
 * Combines template with user's instance data.
 */
export interface ChallengeViewModelItem {
  /** Template definition */
  template: ChallengeTemplate;
  /** User's instance for this challenge */
  instance: UserChallengeInstance;
}

const sortByProgressAndTitle = (a: ChallengeViewModelItem, b: ChallengeViewModelItem): number => {
  if (a.instance.status !== b.instance.status) {
    return a.instance.status === 'active' ? -1 : 1;
  }

  if (a.instance.progress.percentage !== b.instance.progress.percentage) {
    return b.instance.progress.percentage - a.instance.progress.percentage;
  }

  return a.template.title.localeCompare(b.template.title);
};

/**
 * Main hook for challenge management.
 * Returns challenges, rewards, and actions for UI.
 *
 * @param userId Optional user ID
 * @returns Object with challenges, rewards, and callbacks
 */
export const useChallenges = (userId?: string | null) => {
  const [userBooks, setUserBooks] = useState<UserBookDocument[]>([]);
  const [templates, setTemplates] = useState<ChallengeTemplate[]>([]);
  const [instances, setInstances] = useState<UserChallengeInstance[]>([]);
  const [rewards, setRewards] = useState<UserReward[]>([]);

  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const [isTemplatesLoading, setIsTemplatesLoading] = useState(true);
  const [isInstancesLoading, setIsInstancesLoading] = useState(true);
  const [isRewardsLoading, setIsRewardsLoading] = useState(true);
  const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
  const [joiningTemplateIds, setJoiningTemplateIds] = useState<Record<string, boolean>>({});

  const pendingInstancePersistRef = useRef<Set<string>>(new Set());
  const pendingRewardApplicationRef = useRef<Set<string>>(new Set());
  const pendingJoinRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) {
      setUserBooks([]);
      setIsBooksLoading(false);
      return;
    }

    setIsBooksLoading(true);
    const unsubscribe = streamUserBooks(userId, (books) => {
      setUserBooks(books);
      setIsBooksLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    setIsTemplatesLoading(true);
    const unsubscribe = streamChallengeTemplates((nextTemplates) => {
      setTemplates(nextTemplates.filter((template) => template.isActive));
      setIsTemplatesLoading(false);
    }, userId);

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setInstances([]);
      setIsInstancesLoading(false);
      return;
    }

    setIsInstancesLoading(true);

    const unsubscribe = streamUserChallenges(userId, (nextInstances) => {
      setInstances(nextInstances);
      setIsInstancesLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setRewards([]);
      setIsRewardsLoading(false);
      return;
    }

    setIsRewardsLoading(true);

    const unsubscribe = streamUserRewards(userId, (nextRewards) => {
      setRewards(nextRewards);
      setIsRewardsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const aggregates = useMemo(
    () => buildChallengeAggregates(userBooks),
    [userBooks],
  );

  const templateById = useMemo(() => {
    return templates.reduce<Record<string, ChallengeTemplate>>((acc, template) => {
      acc[template.id] = template;
      return acc;
    }, {});
  }, [templates]);

  const instanceByTemplateId = useMemo(() => {
    return instances.reduce<Record<string, UserChallengeInstance>>((acc, instance) => {
      acc[instance.templateId] = instance;
      return acc;
    }, {});
  }, [instances]);

  useEffect(() => {
    if (!userId || templates.length === 0) {
      return;
    }

    const trackedTemplates = templates.filter((template) => (
      template.visibility === 'fixed' || !!instanceByTemplateId[template.id]
    ));

    if (trackedTemplates.length === 0) {
      return;
    }

    const nowDate = new Date();
    const nowIso = nowDate.toISOString();
    const nowMs = nowDate.getTime();

    trackedTemplates.forEach((template) => {
      const evaluation = evaluateChallengeRule(template.rule, aggregates);
      const existingInstance = instanceByTemplateId[template.id];
      const nextId = existingInstance?.id ?? createChallengeInstanceId(template);
      const startedAt = existingInstance?.startedAt ?? nowIso;
      const expiresAt = resolveExpiresAt(
        template,
        startedAt,
        existingInstance?.expiresAt,
        nowIso,
      );
      const isExpiredNow = !evaluation.isCompleted && isExpiredAt(expiresAt, nowMs);

      const nextStatus = deriveStatus(existingInstance?.status, evaluation.isCompleted, isExpiredNow);
      const isFrozen = isTerminalStatus(existingInstance?.status);
      const nextProgress = isFrozen && existingInstance
        ? existingInstance.progress
        : evaluation.progress;
      const nextEvaluationSnapshot = isFrozen && existingInstance
        ? existingInstance.evaluationSnapshot
        : evaluation.evaluationSnapshot;

      const nextInstance: UserChallengeInstance = {
        id: nextId,
        userId,
        templateId: template.id,
        templateKey: template.key,
        status: nextStatus,
        progress: nextProgress,
        startedAt,
        expiresAt,
        expiredAt: nextStatus === 'expired'
          ? (existingInstance?.expiredAt ?? nowIso)
          : null,
        completedAt: nextStatus === 'completed' || nextStatus === 'claimed'
          ? (existingInstance?.completedAt ?? nowIso)
          : null,
        claimedAt: existingInstance?.claimedAt ?? null,
        evaluationSnapshot: nextEvaluationSnapshot,
        rewardApplication: existingInstance?.rewardApplication ?? {
          applied: false,
          appliedAt: null,
        },
      };

      const hasChanged = !existingInstance
        || existingInstance.status !== nextInstance.status
        || existingInstance.progress.current !== nextInstance.progress.current
        || existingInstance.progress.target !== nextInstance.progress.target
        || existingInstance.progress.percentage !== nextInstance.progress.percentage
        || (existingInstance.expiresAt ?? null) !== (nextInstance.expiresAt ?? null)
        || (existingInstance.expiredAt ?? null) !== (nextInstance.expiredAt ?? null)
        || (existingInstance.completedAt ?? null) !== (nextInstance.completedAt ?? null)
        || JSON.stringify(existingInstance.evaluationSnapshot ?? {}) !== JSON.stringify(nextInstance.evaluationSnapshot ?? {});

      if (!hasChanged) {
        return;
      }

      if (pendingInstancePersistRef.current.has(nextInstance.id)) {
        return;
      }

      pendingInstancePersistRef.current.add(nextInstance.id);

      upsertUserChallengeInstance(userId, nextInstance)
        .catch((error) => {
          console.error('[useChallenges] Error persisting challenge instance:', error);
        })
        .finally(() => {
          pendingInstancePersistRef.current.delete(nextInstance.id);
        });
    });
  }, [userId, templates, instanceByTemplateId, aggregates]);

  const joinChallenge = useCallback(async (templateId: string): Promise<boolean> => {
    if (!userId) {
      return false;
    }

    const template = templateById[templateId];
    if (!template || template.visibility !== 'selectable') {
      return false;
    }

    if (instanceByTemplateId[templateId]) {
      return true;
    }

    if (pendingJoinRef.current.has(templateId)) {
      return false;
    }

    pendingJoinRef.current.add(templateId);
    setJoiningTemplateIds((prev) => ({ ...prev, [templateId]: true }));

    try {
      const evaluation = evaluateChallengeRule(template.rule, aggregates);
      const nowIso = new Date().toISOString();
      const expiresAt = resolveExpiresAt(template, nowIso, null, nowIso);
      const isExpiredNow = !evaluation.isCompleted && isExpiredAt(expiresAt, Date.now());
      const nextStatus = deriveStatus(undefined, evaluation.isCompleted, isExpiredNow);

      const instance: UserChallengeInstance = {
        id: createChallengeInstanceId(template),
        userId,
        templateId: template.id,
        templateKey: template.key,
        status: nextStatus,
        progress: evaluation.progress,
        startedAt: nowIso,
        expiresAt,
        expiredAt: nextStatus === 'expired' ? nowIso : null,
        completedAt: nextStatus === 'completed' ? nowIso : null,
        claimedAt: null,
        evaluationSnapshot: evaluation.evaluationSnapshot,
        rewardApplication: {
          applied: false,
          appliedAt: null,
        },
      };

      await upsertUserChallengeInstance(userId, instance);
      return true;
    } catch (error) {
      console.error('[useChallenges] Error joining challenge:', error);
      return false;
    } finally {
      pendingJoinRef.current.delete(templateId);
      setJoiningTemplateIds((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
    }
  }, [userId, templateById, instanceByTemplateId, aggregates]);

  const createChallenge = useCallback(async (input: CreateCustomChallengeInput): Promise<boolean> => {
    if (!userId || isCreatingChallenge) {
      return false;
    }

    setIsCreatingChallenge(true);

    try {
      const template = await createCustomChallengeTemplate(userId, input);
      const evaluation = evaluateChallengeRule(template.rule, aggregates);
      const nowIso = new Date().toISOString();
      const expiresAt = resolveExpiresAt(template, nowIso, null, nowIso);
      const isExpiredNow = !evaluation.isCompleted && isExpiredAt(expiresAt, Date.now());
      const nextStatus = deriveStatus(undefined, evaluation.isCompleted, isExpiredNow);

      const instance: UserChallengeInstance = {
        id: createChallengeInstanceId(template),
        userId,
        templateId: template.id,
        templateKey: template.key,
        status: nextStatus,
        progress: evaluation.progress,
        startedAt: nowIso,
        expiresAt,
        expiredAt: nextStatus === 'expired' ? nowIso : null,
        completedAt: nextStatus === 'completed' ? nowIso : null,
        claimedAt: null,
        evaluationSnapshot: evaluation.evaluationSnapshot,
        rewardApplication: {
          applied: false,
          appliedAt: null,
        },
      };

      await upsertUserChallengeInstance(userId, instance);
      return true;
    } catch (error) {
      console.error('[useChallenges] Error creating custom challenge:', error);
      return false;
    } finally {
      setIsCreatingChallenge(false);
    }
  }, [userId, isCreatingChallenge, aggregates]);

  useEffect(() => {
    if (!userId || instances.length === 0) {
      return;
    }

    instances.forEach((instance) => {
      if (instance.status !== 'completed') {
        return;
      }

      if (instance.rewardApplication?.applied) {
        return;
      }

      if (pendingRewardApplicationRef.current.has(instance.id)) {
        return;
      }

      const template = templateById[instance.templateId];
      if (!template) {
        return;
      }

      pendingRewardApplicationRef.current.add(instance.id);

      (async () => {
        try {
          const applied = await applyChallengeRewards(userId, instance, template);
          if (!applied) {
            return;
          }

          await upsertUserChallengeInstance(userId, {
            ...instance,
            rewardApplication: {
              applied: true,
              appliedAt: new Date().toISOString(),
            },
          });
        } catch (error) {
          console.error('[useChallenges] Error applying challenge rewards:', error);
        } finally {
          pendingRewardApplicationRef.current.delete(instance.id);
        }
      })();
    });
  }, [userId, instances, templateById]);

  const items = useMemo<ChallengeViewModelItem[]>(() => {
    const nowDate = new Date();
    const nowIso = nowDate.toISOString();
    const nowMs = nowDate.getTime();

    return templates
      .filter((template) => template.visibility === 'fixed' || !!instanceByTemplateId[template.id])
      .map((template) => {
        const evaluation = evaluateChallengeRule(template.rule, aggregates);
        const existing = instanceByTemplateId[template.id];
        const startedAt = existing?.startedAt ?? nowIso;
        const expiresAt = resolveExpiresAt(template, startedAt, existing?.expiresAt, nowIso);
        const isExpiredNow = !evaluation.isCompleted && isExpiredAt(expiresAt, nowMs);
        const fallbackStatus = deriveStatus(existing?.status, evaluation.isCompleted, isExpiredNow);
        const isFrozen = isTerminalStatus(existing?.status);
        const displayProgress = isFrozen && existing ? existing.progress : evaluation.progress;
        const displayEvaluationSnapshot = isFrozen && existing
          ? existing.evaluationSnapshot
          : evaluation.evaluationSnapshot;

        const instance: UserChallengeInstance = existing
          ? {
              ...existing,
              status: fallbackStatus,
              expiresAt,
              expiredAt: fallbackStatus === 'expired'
                ? (existing.expiredAt ?? nowIso)
                : null,
              completedAt: fallbackStatus === 'completed' || fallbackStatus === 'claimed'
                ? (existing.completedAt ?? nowIso)
                : null,
              progress: displayProgress,
              evaluationSnapshot: displayEvaluationSnapshot,
            }
          : {
              id: createChallengeInstanceId(template),
              userId: userId ?? 'unknown',
              templateId: template.id,
              templateKey: template.key,
              status: fallbackStatus,
              progress: displayProgress,
              startedAt,
              expiresAt,
              expiredAt: fallbackStatus === 'expired' ? nowIso : null,
              completedAt: fallbackStatus === 'completed' ? nowIso : null,
              claimedAt: null,
              evaluationSnapshot: displayEvaluationSnapshot,
              rewardApplication: {
                applied: false,
                appliedAt: null,
              },
            };

        return {
          template,
          instance,
        };
      })
      .sort(sortByProgressAndTitle);
  }, [templates, instanceByTemplateId, aggregates, userId]);

  const availableChallenges = useMemo(() => {
    return templates
      .filter((template) => template.visibility === 'selectable')
      .filter((template) => !instanceByTemplateId[template.id])
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [templates, instanceByTemplateId]);

  const activeChallenges = items.filter((item) => item.instance.status === 'active');
  const completedChallenges = items.filter((item) => (
    item.instance.status === 'completed' || item.instance.status === 'claimed'
  ));
  const failedChallenges = items.filter((item) => item.instance.status === 'expired');
  const archivedChallenges = items.filter((item) => item.instance.status === 'archived');

  return {
    templates,
    instances,
    rewards,
    activeChallenges,
    completedChallenges,
    failedChallenges,
    archivedChallenges,
    availableChallenges,
    joinChallenge,
    createChallenge,
    isCreatingChallenge,
    joiningTemplateIds,
    isLoading: isBooksLoading || isTemplatesLoading || isInstancesLoading || isRewardsLoading,
  };
};
