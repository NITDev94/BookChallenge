import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Gift, Sparkles, Shield, Coins, Medal } from 'lucide-react-native';
import { GlassCard } from '../shared/GlassCard';
import { UserReward } from '../../types/challenges';

interface RewardUnlockCardProps {
  reward: UserReward;
}

const getLabel = (reward: UserReward): string => {
  switch (reward.kind) {
    case 'joker':
      return `Joker +${reward.payload?.amount ?? 1}`;
    case 'xp':
      return `XP +${reward.payload?.amount ?? 0}`;
    case 'coins':
      return `Coins +${reward.payload?.amount ?? 0}`;
    case 'badge':
      return `Badge ${String(reward.payload?.badgeId ?? '').trim() || 'débloqué'}`;
    case 'reward_unlock':
      return `Reward ${String(reward.payload?.rewardId ?? '').trim() || 'débloquée'}`;
    default:
      return 'Récompense débloquée';
  }
};

const getIcon = (reward: UserReward) => {
  switch (reward.kind) {
    case 'joker':
      return <Shield size={16} color="#b45309" />;
    case 'xp':
      return <Sparkles size={16} color="#7c3aed" />;
    case 'coins':
      return <Coins size={16} color="#ca8a04" />;
    case 'badge':
      return <Medal size={16} color="#2563eb" />;
    default:
      return <Gift size={16} color="#475569" />;
  }
};

export const RewardUnlockCard: React.FC<RewardUnlockCardProps> = ({ reward }) => {
  const sourceLabel = String(reward.payload?.sourceTemplateTitle ?? '').trim()
    || String(reward.payload?.sourceTemplateKey ?? '').trim()
    || reward.sourceTemplateId;

  return (
    <GlassCard variant="light" shadowPreset="sm" style={styles.card}>
      <View style={styles.iconContainer}>{getIcon(reward)}</View>
      <View style={styles.content}>
        <Text style={styles.title}>{getLabel(reward)}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          Source: {sourceLabel}
        </Text>
      </View>
      <Text style={styles.status}>{reward.status}</Text>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f5f5f4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1917',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 10,
    color: '#78716c',
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
    color: '#57534e',
    textTransform: 'uppercase',
  },
});
