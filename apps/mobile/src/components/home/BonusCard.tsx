import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, LucideIcon } from 'lucide-react-native';
import { GlassCard } from '../shared/GlassCard';
import { commonStyles } from '../../theme';

interface BonusCardProps {
  title: string;
  points: number;
  icon: LucideIcon;
  color?: string;
}

export const BonusCard: React.FC<BonusCardProps> = ({
  title,
  points,
  icon: Icon,
  color = '#fef3c7',
}) => {
  return (
    <GlassCard variant="light" shadowPreset="card" style={styles.card}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon size={20} color="#44403c" />
      </View>

      <Text style={styles.title} numberOfLines={2}>{title}</Text>

      <View style={commonStyles.xpBadge}>
        <Sparkles size={10} color="#f59e0b" fill="#f59e0b" />
        <Text style={commonStyles.xpText}>+{points} XP</Text>
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    minHeight: 120,
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1c1917',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
});
