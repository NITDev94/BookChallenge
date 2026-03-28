import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sparkles, LucideIcon } from 'lucide-react-native';

interface BonusCardProps {
  title: string;
  points: number;
  icon: LucideIcon;
  color?: string; // Hex color for the icon background
}

export const BonusCard: React.FC<BonusCardProps> = ({ 
  title, 
  points,
  icon: Icon,
  color = '#fef3c7' // Default amber-100
}) => {
  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <Icon size={20} color="#44403c" />
      </View>
      
      <Text style={styles.title} numberOfLines={2}>{title}</Text>
      
      <View style={styles.xpBadge}>
        <Sparkles size={10} color="#f59e0b" fill="#f59e0b" />
        <Text style={styles.xpText}>+{points} XP</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f5f5f4',
    minHeight: 120,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
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
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#fef3c7',
    gap: 4,
  },
  xpText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
});
