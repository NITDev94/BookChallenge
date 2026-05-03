import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Trophy } from 'lucide-react-native';
import { GlassCard } from '../shared/GlassCard';
import { ProgressBar } from '../shared/ProgressBar';
import { ChallengeViewModelItem } from '../../hooks/useChallenges';

interface ChallengeProgressCardProps {
  item: ChallengeViewModelItem;
}

export const ChallengeProgressCard: React.FC<ChallengeProgressCardProps> = ({ item }) => {
  const { template, instance } = item;
  const statusConfig = (() => {
    // Keep all status labels in French while maintaining deterministic color mapping.
    if (instance.status === 'completed' || instance.status === 'claimed') {
      return {
        label: 'Complété',
        variant: 'light' as const,
        statusStyle: styles.statusCompleted,
        progressColor: '#16a34a',
      };
    }

    if (instance.status === 'expired') {
      return {
        label: 'Échoué',
        variant: 'light' as const,
        statusStyle: styles.statusFailed,
        progressColor: '#dc2626',
      };
    }

    if (instance.status === 'archived') {
      return {
        label: 'Abandonné',
        variant: 'light' as const,
        statusStyle: styles.statusArchived,
        progressColor: '#6b7280',
      };
    }

    return {
      label: 'En cours',
      variant: 'amber' as const,
      statusStyle: null,
      progressColor: '#d97706',
    };
  })();

  const cardStyle = {
    ...styles.card,
    ...(instance.status === 'expired' ? styles.cardFailed : {}),
    ...(instance.status === 'archived' ? styles.cardArchived : {}),
  };

  return (
    <GlassCard variant={statusConfig.variant} shadowPreset="card" style={cardStyle}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrapper}>
            <Trophy size={14} color="#b45309" />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{template.title}</Text>
            <Text style={styles.description} numberOfLines={2}>{template.description}</Text>
          </View>
        </View>
        <Text style={[styles.status, statusConfig.statusStyle]}>
          {statusConfig.label}
        </Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressValue}>
            {instance.progress.current} / {instance.progress.target}
          </Text>
          <Text style={styles.progressPercent}>{instance.progress.percentage}%</Text>
        </View>
        <ProgressBar
          progress={instance.progress.percentage}
          style={styles.progressBar}
          color={statusConfig.progressColor}
        />
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 14,
    gap: 10,
  },
  cardFailed: {
    borderColor: 'rgba(248, 113, 113, 0.45)',
    borderTopColor: 'rgba(254, 226, 226, 0.95)',
  },
  cardArchived: {
    borderColor: 'rgba(161, 161, 170, 0.4)',
    borderTopColor: 'rgba(245, 245, 245, 0.9)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  titleContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  description: {
    fontSize: 11,
    color: '#78716c',
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
    textTransform: 'uppercase',
  },
  statusCompleted: {
    color: '#15803d',
  },
  statusFailed: {
    color: '#b91c1c',
  },
  statusArchived: {
    color: '#52525b',
  },
  progressContainer: {
    gap: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#44403c',
  },
  progressPercent: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1c1917',
  },
  progressBar: {
    height: 7,
  },
});
