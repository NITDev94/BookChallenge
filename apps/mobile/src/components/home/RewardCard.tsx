import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, LucideIcon } from 'lucide-react-native';

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
  xp
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon size={16} color={iconColor} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        <View style={styles.xpBadge}>
          <Sparkles size={8} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.xpText}>{xp} XP</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f5f5f4',
    flex: 1,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 4,
    alignSelf: 'flex-start',
  },
  xpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
});
