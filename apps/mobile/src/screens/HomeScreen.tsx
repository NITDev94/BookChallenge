import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { RootState } from '../store';
import { Flame, Sparkles, Calendar, Globe, Book } from 'lucide-react-native';
import { CurrentlyReading } from '../components/home/CurrentlyReading';
import { BonusCard } from '../components/home/BonusCard';
import { GlassCard } from '../components/shared/GlassCard';
import { useReadingStreak } from '../hooks/useReadingStreak';
import { useChallenges } from '../hooks/useChallenges';
import { ChallengeProgressCard } from '../components/challenges/ChallengeProgressCard';
import { RewardUnlockCard } from '../components/challenges/RewardUnlockCard';
import { MainTabParamList } from '../navigation/MainTabNavigator';
import { commonStyles } from '../theme';
import { StreakModal } from '../components/home/StreakModal';

type HomeNavigationProp = BottomTabNavigationProp<MainTabParamList, 'Home'>;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);
  const {
    readingStreak,
    availableJokers,
    weeklyJokerAvailable,
    permanentJokers,
    weekTimeline,
    usedJokerInCurrentStreak,
    isLoading: isReadingStreakLoading,
  } = useReadingStreak(user?.uid);
  const [isStreakModalVisible, setIsStreakModalVisible] = React.useState(false);
  const {
    activeChallenges,
    rewards,
    isLoading: isChallengesLoading,
  } = useChallenges(user?.uid);
  const displayName = user?.displayName?.split(' ')[0] || 'Utilisateur';
  const streakLabel = isReadingStreakLoading
    ? '...'
    : `${readingStreak} ${readingStreak === 1 ? 'Jour' : 'Jours'}`;
  const jokersLabel = isReadingStreakLoading
    ? '...'
    : `${availableJokers} joker${availableJokers === 1 ? '' : 's'}`;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.userInfo}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1671757562233-0a7414c91ca4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200' }}
                  style={styles.avatar}
                />
              </View>
              <View>
                <Text style={styles.greeting}>Bonjour {displayName},</Text>
                <Text style={styles.headerSubtitle}>Prête à lire ?</Text>
              </View>
            </View>

            <TouchableOpacity onPress={() => setIsStreakModalVisible(true)} activeOpacity={0.7}>
              <GlassCard variant="amber" shadowPreset="sm" borderRadius={24} style={styles.streakBadge}>
                <Flame size={20} color="#f97316" fill="#f97316" />
                <View style={styles.streakTextContainer}>
                  <Text style={styles.streakLabel}>SÉRIE</Text>
                  <Text style={styles.streakValue}>{streakLabel}</Text>
                  <Text style={styles.streakMetaText}>🃏 {jokersLabel}</Text>
                  {usedJokerInCurrentStreak && (
                    <Text style={styles.streakProtectedText}>Série protégée</Text>
                  )}
                </View>
              </GlassCard>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── XP & Level Card ─────────────────────────────────────────── */}
        {/* TODO: connect to real data — XP, level, progress */}
        <View style={styles.xpSection}>
          <GlassCard variant="dark" shadowPreset="dark" style={styles.xpCard}>
            <View style={styles.xpCardLeft}>
              <View style={styles.xpIconContainer}>
                <Sparkles size={20} color="#fbbf24" fill="#fbbf24" />
              </View>
              <View>
                <Text style={styles.xpLabel}>CAGNOTTE</Text>
                <Text style={styles.xpValue}>1 250 XP</Text>
              </View>
            </View>

            <View style={styles.levelContainer}>
              <Text style={styles.levelLabel}>Niveau 7</Text>
              <View style={styles.levelProgressBar}>
                <View style={[styles.levelProgressFill, styles.levelProgressFillValue]} />
              </View>
            </View>
          </GlassCard>
        </View>

        {/* ── Main Content ─────────────────────────────────────────────── */}
        <View style={styles.mainContent}>

          {/* Lectures en cours */}
          <CurrentlyReading />

          {/* Challenges en cours */}
          <View style={styles.section}>
            <View style={commonStyles.sectionHeader}>
              <View style={styles.titleWithCount}>
                <Text style={commonStyles.sectionTitle}>Challenges en cours</Text>
                <View style={commonStyles.countBadge}>
                  <Text style={commonStyles.countBadgeText}>{activeChallenges.length}</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Challenges')}>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>

            {isChallengesLoading ? (
              <View style={styles.skeletonCard} />
            ) : activeChallenges.length === 0 ? (
              <Text style={styles.emptyText}>Aucun challenge actif pour le moment.</Text>
            ) : (
              <View style={styles.challengeList}>
                {activeChallenges.slice(0, 2).map((item) => (
                  <ChallengeProgressCard key={item.instance.id} item={item} />
                ))}
              </View>
            )}
          </View>

          {/* Mes bonus */}
          {/* TODO: connect to real data — bonuses */}
          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>Mes bonus</Text>
            <View style={styles.bonusGrid}>
              <BonusCard
                title="3 jours de suite"
                points={15}
                icon={Calendar}
                color="#eff6ff"
              />
              <BonusCard
                title="Lecture VO"
                points={30}
                icon={Globe}
                color="#f5f3ff"
              />
              <BonusCard
                title="Pavé (+500p)"
                points={50}
                icon={Book}
                color="#ecfdf5"
              />
            </View>
          </View>

          {/* Récompenses débloquées */}
          <View style={styles.section}>
            <View style={commonStyles.sectionHeader}>
              <View style={styles.titleWithCount}>
                <Text style={commonStyles.sectionTitle}>Récompenses débloquées</Text>
                <View style={commonStyles.countBadge}>
                  <Text style={commonStyles.countBadgeText}>{rewards.length}</Text>
                </View>
              </View>
            </View>
            {isChallengesLoading ? (
              <View style={styles.skeletonCard} />
            ) : rewards.length === 0 ? (
              <Text style={styles.emptyText}>Aucune récompense débloquée pour l’instant.</Text>
            ) : (
              <View style={styles.rewardList}>
                {rewards.slice(0, 2).map((reward) => (
                  <RewardUnlockCard key={reward.id} reward={reward} />
                ))}
              </View>
            )}
          </View>

        </View>
      </ScrollView>

      <StreakModal
        isVisible={isStreakModalVisible}
        onClose={() => setIsStreakModalVisible(false)}
        readingStreak={readingStreak}
        weeklyJokerAvailable={weeklyJokerAvailable}
        permanentJokers={permanentJokers}
        weekTimeline={weekTimeline}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fffbeb',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    backgroundColor: '#fffbeb',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#fef3c7',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#78350f',
    lineHeight: 22,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(120, 53, 15, 0.6)',
  },

  // ── Streak Badge (now a GlassCard) ────────────────────────────────────
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  streakTextContainer: {
    alignItems: 'flex-start',
  },
  streakLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#78716c',
    letterSpacing: 0.5,
  },
  streakValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  streakMetaText: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
  streakProtectedText: {
    marginTop: 1,
    fontSize: 9,
    fontWeight: '700',
    color: '#b45309',
  },

  // ── XP Card (now a GlassCard with dark variant) ────────────────────────
  xpSection: {
    paddingHorizontal: 24,
    marginTop: -24,
  },
  xpCard: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  xpCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  xpIconContainer: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
  },
  xpLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a8a29e',
    letterSpacing: 1,
  },
  xpValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  levelContainer: {
    alignItems: 'flex-end',
  },
  levelLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a8a29e',
    marginBottom: 4,
  },
  levelProgressBar: {
    width: 80,
    height: 6,
    backgroundColor: 'rgba(120, 53, 15, 0.4)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 3,
  },
  levelProgressFillValue: {
    width: '73%',
  },

  // ── Main Content ────────────────────────────────────────────────────────
  mainContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    backgroundColor: '#ffffff',
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  titleWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  seeAll: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  challengeList: {
    gap: 10,
  },
  gridCol: {
    flex: 1,
  },
  bonusGrid: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  rewardList: {
    gap: 12,
  },
  skeletonCard: {
    height: 96,
    borderRadius: 12,
    backgroundColor: '#f5f5f4',
  },
  emptyText: {
    fontSize: 12,
    color: '#78716c',
  },
});
