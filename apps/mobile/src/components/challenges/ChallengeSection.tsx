import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { commonStyles } from '../../theme';

interface ChallengeSectionProps {
  title: string;
  count?: number;
  children: React.ReactNode;
}

export const ChallengeSection: React.FC<ChallengeSectionProps> = ({
  title,
  count,
  children,
}) => {
  return (
    <View style={styles.section}>
      <View style={commonStyles.sectionHeader}>
        <View style={styles.titleRow}>
          <Text style={commonStyles.sectionTitle}>{title}</Text>
          {typeof count === 'number' && (
            <View style={commonStyles.countBadge}>
              <Text style={commonStyles.countBadgeText}>{count}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 28,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  content: {
    gap: 10,
  },
});
