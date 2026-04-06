import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Flame, Sparkles, Calendar, Globe, Book, Coffee, ShoppingBag } from 'lucide-react-native';
import { CurrentlyReading } from '../components/home/CurrentlyReading';
import { ChallengeCard } from '../components/home/ChallengeCard';
import { BonusCard } from '../components/home/BonusCard';
import { RewardCard } from '../components/home/RewardCard';
import { GlassCard } from '../components/shared/GlassCard';
import { commonStyles } from '../theme';

export const HomeScreen = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const displayName = user?.displayName?.split(' ')[0] || 'Utilisateur';

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

            {/* TODO: connect to real data — streak */}
            <GlassCard variant="amber" shadowPreset="sm" borderRadius={24} style={styles.streakBadge}>
              <Flame size={20} color="#f97316" fill="#f97316" />
              <View style={styles.streakTextContainer}>
                <Text style={styles.streakLabel}>SÉRIE</Text>
                <Text style={styles.streakValue}>12 Jours</Text>
              </View>
            </GlassCard>
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
          {/* TODO: connect to real data — active challenges */}
          <View style={styles.section}>
            <View style={commonStyles.sectionHeader}>
              <View style={styles.titleWithCount}>
                <Text style={commonStyles.sectionTitle}>Challenges en cours</Text>
                <View style={commonStyles.countBadge}>
                  <Text style={commonStyles.countBadgeText}>3</Text>
                </View>
              </View>
              <TouchableOpacity>
                <Text style={styles.seeAll}>Voir tout</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              <View style={styles.gridCol}>
                <ChallengeCard
                  title="Objectif 2026"
                  current={12}
                  target={30}
                  deadline="31 DÉC"
                  imageUrl="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1080"
                  xp={500}
                />
              </View>
              <View style={styles.gridCol}>
                <ChallengeCard
                  title="Objectif Février"
                  current={3}
                  target={5}
                  deadline="28 FÉV"
                  theme="dark"
                  xp={150}
                />
              </View>
            </View>
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
          {/* TODO: connect to real data — unlocked rewards */}
          <View style={styles.section}>
            <View style={commonStyles.sectionHeader}>
              <View style={styles.titleWithCount}>
                <Text style={commonStyles.sectionTitle}>Récompenses débloquées</Text>
                <View style={commonStyles.countBadge}>
                  <Text style={commonStyles.countBadgeText}>2</Text>
                </View>
              </View>
            </View>
            <View style={styles.rewardList}>
              <RewardCard
                title="Chocolat chaud et lecture dans un café"
                icon={Coffee}
                color="#fff7ed"
                iconColor="#ea580c"
                xp={150}
              />
              <RewardCard
                title="Achat d'un livre poche"
                icon={ShoppingBag}
                color="#fff1f2"
                iconColor="#e11d48"
                xp={300}
              />
            </View>
          </View>

        </View>
      </ScrollView>
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
});
