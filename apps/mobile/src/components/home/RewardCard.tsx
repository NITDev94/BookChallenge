import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, LucideIcon } from 'lucide-react-native';
import { GlassCard } from '../shared/GlassCard';
import { commonStyles } from '../../theme';

interface RewardCardProps {
  title: string;
  icon: LucideIcon;
  color?: string;
  iconColor?: string;
  xp: number;
}

export const RewardCard: React.FC<RewardCardProps> = ({
  title,
  icon: Icon,
  color = '#fef3c7',
  iconColor = '#d97706',
  xp,
}) => {
  return (
    <GlassCard variant="light" shadowPreset="card" style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={commonStyles.xpBadge}>
          <Sparkles size={8} color="#f59e0b" fill="#f59e0b" />
          <Text style={commonStyles.xpText}>{xp} XP</Text>
        </View>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    gap: 10,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1917',
    lineHeight: 16,
  },
});
