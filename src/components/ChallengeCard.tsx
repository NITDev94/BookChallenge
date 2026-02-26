import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { Trophy, Sparkles } from 'lucide-react-native';
import { ProgressBar } from './ProgressBar';

interface ChallengeProps {
  title: string;
  current: number;
  target: number;
  deadline?: string;
  imageUrl?: string;
  theme?: 'light' | 'dark';
  xp?: number;
}

export const ChallengeCard: React.FC<ChallengeProps> = ({ 
  title, 
  current, 
  target, 
  deadline, 
  imageUrl,
  theme = 'light',
  xp
}) => {
  const percentage = Math.round((current / target) * 100);
  const isDark = theme === 'dark';

  return (
    <View style={[
      styles.container, 
      isDark ? styles.containerDark : styles.containerLight
    ]}>
      {imageUrl && (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.backgroundImage} 
          blurRadius={isDark ? 5 : 2}
        />
      )}
      
      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.trophyContainer}>
            <Trophy size={16} color="#b45309" />
          </View>
          {deadline && (
            <View style={[styles.deadlineBadge, isDark ? styles.deadlineBadgeDark : styles.deadlineBadgeLight]}>
              <Text style={[styles.deadlineText, isDark ? styles.deadlineTextDark : styles.deadlineTextLight]}>
                {deadline}
              </Text>
            </View>
          )}
        </View>

        <View>
          <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}>
            {current} / {target} livres
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.progressRow}>
            <ProgressBar 
              progress={percentage} 
              style={styles.progressBar} 
              color={percentage === 100 ? '#22c55e' : '#d97706'}
            />
            <Text style={[styles.percentageText, isDark ? styles.textDark : styles.textLight]}>
              {percentage}%
            </Text>
          </View>
          
          {xp && (
            <View style={styles.xpRow}>
              <View style={[styles.xpBadge, isDark ? styles.xpBadgeDark : styles.xpBadgeLight]}>
                <Sparkles size={10} color="#f59e0b" fill="#f59e0b" />
                <Text style={[styles.xpText, isDark ? styles.xpTextDark : styles.xpTextLight]}>
                  +{xp} XP
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    height: 160,
    justifyContent: 'space-between',
    overflow: 'hidden',
    position: 'relative',
  },
  containerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#f5f5f4',
  },
  containerDark: {
    backgroundColor: '#0f172a', // slate-900
    borderColor: '#1e293b',
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  trophyContainer: {
    padding: 6,
    backgroundColor: '#fef3c7', // amber-100
    borderRadius: 8,
  },
  deadlineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  deadlineBadgeLight: {
    backgroundColor: '#f5f5f4', // stone-100
  },
  deadlineBadgeDark: {
    backgroundColor: '#1e293b',
  },
  deadlineText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  deadlineTextLight: {
    color: '#78716c',
  },
  deadlineTextDark: {
    color: '#cbd5e1',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleLight: {
    color: '#1c1917',
  },
  titleDark: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 10,
  },
  subtitleLight: {
    color: '#78716c',
  },
  subtitleDark: {
    color: '#94a3b8',
  },
  footer: {
    marginTop: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
  },
  percentageText: {
    fontSize: 10,
    fontWeight: '700',
    width: 30,
    textAlign: 'right',
  },
  textLight: {
    color: '#1c1917',
  },
  textDark: {
    color: '#ffffff',
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    gap: 4,
  },
  xpBadgeLight: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
  },
  xpBadgeDark: {
    backgroundColor: 'rgba(120, 53, 15, 0.3)',
    borderColor: 'rgba(120, 53, 15, 0.5)',
  },
  xpText: {
    fontSize: 10,
    fontWeight: '700',
  },
  xpTextLight: {
    color: '#b45309',
  },
  xpTextDark: {
    color: '#fbbf24',
  },
});
