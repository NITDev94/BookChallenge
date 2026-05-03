import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Flame, Shield, Info } from 'lucide-react-native';
import { GlassCard } from '../shared/GlassCard';
import { WeekTimelineDay } from '../../utils/readingStreak';

interface StreakModalProps {
  isVisible: boolean;
  onClose: () => void;
  readingStreak: number;
  weeklyJokerAvailable: number;
  permanentJokers: number;
  weekTimeline: WeekTimelineDay[];
}

export const StreakModal: React.FC<StreakModalProps> = ({
  isVisible,
  onClose,
  readingStreak,
  weeklyJokerAvailable,
  permanentJokers,
  weekTimeline,
}) => {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <GlassCard variant="light" shadowPreset="dark" borderRadius={32} style={styles.card}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>Votre Série de Lecture</Text>
                  <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={24} color="#78350f" />
                  </TouchableOpacity>
                </View>

                {/* Big Streak Number */}
                <View style={styles.streakSection}>
                  <View style={styles.flameContainer}>
                    <Flame size={64} color="#f97316" fill="#f97316" />
                  </View>
                  <Text style={styles.streakNumber}>{readingStreak}</Text>
                  <Text style={styles.streakUnit}>Jours de suite</Text>
                </View>

                {/* Week Timeline */}
                <View style={styles.timelineSection}>
                  <Text style={styles.sectionTitle}>Cette Semaine</Text>
                  <View style={styles.timeline}>
                    {weekTimeline.map((day) => (
                      <View key={day.dayKey} style={styles.timelineDay}>
                        <View
                          style={[
                            styles.dayIndicator,
                            day.status === 'read' && styles.readDay,
                            day.status === 'protected' && styles.protectedDay,
                            day.isToday && styles.todayIndicator,
                          ]}
                        >
                          {day.status === 'read' && <Flame size={14} color="#ffffff" fill="#ffffff" />}
                          {day.status === 'protected' && <Shield size={14} color="#ffffff" fill="#ffffff" />}
                        </View>
                        <Text style={[styles.dayLabel, day.isToday && styles.todayLabel]}>
                          {day.label}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Jokers Breakdown */}
                <View style={styles.jokersSection}>
                  <Text style={styles.sectionTitle}>Vos Jokers</Text>
                  
                  <View style={styles.jokerRow}>
                    <View style={[styles.jokerIcon, { backgroundColor: '#fff7ed' }]}>
                      <Shield size={20} color="#f97316" />
                    </View>
                    <View style={styles.jokerInfo}>
                      <View style={styles.jokerHeader}>
                        <Text style={styles.jokerName}>Joker Hebdomadaire</Text>
                        <Text style={styles.jokerCount}>{weeklyJokerAvailable} / 1</Text>
                      </View>
                      <Text style={styles.jokerDesc}>Renouvelé chaque lundi. Utilisez-le ou perdez-le !</Text>
                    </View>
                  </View>

                  <View style={styles.jokerRow}>
                    <View style={[styles.jokerIcon, { backgroundColor: '#f0f9ff' }]}>
                      <Shield size={20} color="#0ea5e9" />
                    </View>
                    <View style={styles.jokerInfo}>
                    <View style={styles.jokerHeader}>
                        <Text style={styles.jokerName}>Jokers de Récompense</Text>
                        <Text style={styles.jokerCount}>{permanentJokers}</Text>
                      </View>
                      <Text style={styles.jokerDesc}>Gagnés en terminant des livres ou défis. Ils s'accumulent.</Text>
                    </View>
                  </View>
                </View>

                {/* Tip */}
                <View style={styles.tipSection}>
                  <Info size={16} color="#92400e" />
                  <Text style={styles.tipText}>
                    Les jokers protègent votre série automatiquement si vous oubliez de lire un jour.
                  </Text>
                </View>
              </GlassCard>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(120, 53, 15, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    padding: 24,
    backgroundColor: '#fffbeb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#78350f',
  },
  closeButton: {
    padding: 4,
  },
  streakSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  flameContainer: {
    marginBottom: 8,
    // Add a soft glow effect behind the flame
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  streakNumber: {
    fontSize: 56,
    fontWeight: '900',
    color: '#1c1917',
    lineHeight: 64,
  },
  streakUnit: {
    fontSize: 16,
    fontWeight: '700',
    color: '#78716c',
    marginTop: -4,
  },
  timelineSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timelineDay: {
    alignItems: 'center',
    gap: 8,
  },
  dayIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e7e5e4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  todayIndicator: {
    borderColor: '#f97316',
  },
  readDay: {
    backgroundColor: '#f97316',
  },
  protectedDay: {
    backgroundColor: '#0ea5e9',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a8a29e',
  },
  todayLabel: {
    color: '#f97316',
    fontWeight: '800',
  },
  jokersSection: {
    gap: 16,
    marginBottom: 24,
  },
  jokerRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  jokerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jokerInfo: {
    flex: 1,
  },
  jokerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jokerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
  },
  jokerCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#78350f',
  },
  jokerDesc: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 2,
  },
  tipSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 11,
    color: '#92400e',
    lineHeight: 16,
    fontWeight: '500',
  },
});
