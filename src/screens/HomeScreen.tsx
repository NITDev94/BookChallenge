import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { Flame, Sparkles, Calendar, Globe, Book, Coffee, ShoppingBag } from 'lucide-react-native';
import { BookItem } from '../components/BookItem';
import { ChallengeCard } from '../components/ChallengeCard';
import { BonusCard } from '../components/BonusCard';
import { RewardCard } from '../components/RewardCard';

export const HomeScreen = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const displayName = user?.displayName?.split(' ')[0] || 'Utilisateur';

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* Header Section */}
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
                                <Text style={styles.subtitle}>Prête à lire ?</Text>
                            </View>
                        </View>

                        <View style={styles.streakBadge}>
                            <Flame size={20} color="#f97316" fill="#f97316" />
                            <View style={styles.streakTextContainer}>
                                <Text style={styles.streakLabel}>SÉRIE</Text>
                                <Text style={styles.streakValue}>12 Jours</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* XP & Level Section */}
                <View style={styles.xpSection}>
                    <View style={styles.xpCard}>
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
                    </View>
                </View>

                <View style={styles.mainContent}>
                    {/* Lectures en cours */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Lectures en cours</Text>
                            <View style={styles.countBadge}>
                                <Text style={styles.countText}>1</Text>
                            </View>
                        </View>
                        <BookItem
                            title="La Passe-miroir - Livre 1"
                            author="Christelle Dabos"
                            status="reading"
                            coverUrl="https://images.unsplash.com/photo-1638623141545-7197addbc00d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxMZXMlMjBmaWFuYyVDMyVBOXMlMjBkZSUyMGwlMjdoaXZlciUyMGJvb2slMjBjb3ZlcnxlbnwxfHx8fDE3NzAzOTcyMjd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                            progress={{
                                current: 342,
                                total: 520
                            }}
                            xpReward={50}
                        />
                    </View>

                    {/* Challenges en cours */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleWithCount}>
                                <Text style={styles.sectionTitle}>Challenges en cours</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>3</Text>
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
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Mes bonus</Text>
                        <View style={styles.bonusGrid}>
                            <BonusCard
                                title="3 jours de suite"
                                points={15}
                                icon={Calendar}
                                color="#eff6ff" // blue-50
                            />
                            <BonusCard
                                title="Lecture VO"
                                points={30}
                                icon={Globe}
                                color="#f5f3ff" // purple-50
                            />
                            <BonusCard
                                title="Pavé (+500p)"
                                points={50}
                                icon={Book}
                                color="#ecfdf5" // emerald-50
                            />
                        </View>
                    </View>

                    {/* Récompenses débloquées */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.titleWithCount}>
                                <Text style={styles.sectionTitle}>Récompenses débloquées</Text>
                                <View style={styles.countBadge}>
                                    <Text style={styles.countText}>2</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.rewardList}>
                            <RewardCard
                                title="Chocolat chaud et lecture dans un café"
                                icon={Coffee}
                                color="#fff7ed" // orange-50
                                iconColor="#ea580c" // orange-600
                                xp={150}
                            />
                            <RewardCard
                                title="Achat d'un livre poche"
                                icon={ShoppingBag}
                                color="#fff1f2" // rose-50
                                iconColor="#e11d48" // rose-600
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
        backgroundColor: '#fffbeb', // amber-50
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 40,
    },
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    avatar: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    greeting: {
        fontSize: 18,
        fontWeight: '700',
        color: '#78350f', // amber-900
        lineHeight: 22,
    },
    subtitle: {
        fontSize: 12,
        color: 'rgba(120, 53, 15, 0.6)', // amber-700/60
    },
    streakBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: '#ffffff',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
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
    xpSection: {
        paddingHorizontal: 24,
        marginTop: -24,
    },
    xpCard: {
        backgroundColor: '#1c1917', // stone-900
        borderRadius: 16,
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        position: 'relative',
        overflow: 'hidden',
    },
    xpCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    xpIconContainer: {
        padding: 8,
        backgroundColor: '#262626',
        borderRadius: 8,
    },
    xpLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#a8a29e', // stone-400
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
    mainContent: {
        paddingHorizontal: 24,
        paddingTop: 32,
        backgroundColor: '#ffffff',
        flex: 1,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleWithCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1c1917',
    },
    countBadge: {
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 999,
    },
    countText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#92400e',
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
