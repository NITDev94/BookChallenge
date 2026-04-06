import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Star, CheckCircle2, Clock, Sparkles } from 'lucide-react-native';
import { ProgressBar } from './ProgressBar';
import { GlassCard } from './GlassCard';
import { commonStyles } from '../../theme';

interface BookProps {
  title: string;
  author: string;
  coverUrl?: string;
  status: 'read' | 'reading' | 'want-to-read';
  rating?: number;
  progress?: {
    current: number;
    total: number;
  };
  xpReward?: number;
  onPress?: () => void;
}

export const BookItem: React.FC<BookProps> = ({
  title,
  author,
  coverUrl,
  status,
  rating,
  progress,
  xpReward,
  onPress,
}) => {
  const percentage = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} disabled={!onPress}>
      <GlassCard variant="light" shadowPreset="card" borderRadius={12} style={styles.card}>
        <View style={styles.coverContainer}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.cover} />
          ) : (
            <View style={styles.noCover}>
              <Text style={styles.noCoverText}>No Cover</Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View>
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
            <Text style={styles.author} numberOfLines={1}>{author}</Text>
          </View>

          {progress ? (
            <View style={styles.progressContainer}>
              <View style={styles.progressTextRow}>
                <Text style={styles.progressText}>{progress.current} pages lues / {progress.total} pages</Text>
                <Text style={styles.percentageText}>{percentage}%</Text>
              </View>
              <ProgressBar progress={percentage} style={styles.progressBar} color="#f59e0b" />

              {xpReward && (
                <View style={styles.xpRow}>
                  <View style={commonStyles.xpBadge}>
                    <Sparkles size={10} color="#f59e0b" fill="#f59e0b" />
                    <Text style={commonStyles.xpText}>+{xpReward} XP à gagner</Text>
                  </View>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.statusRow}>
              {status === 'read' && (
                <View style={styles.statusBadgeRead}>
                  <CheckCircle2 size={12} color="#10b981" />
                  <Text style={styles.statusTextRead}>Lu</Text>
                </View>
              )}
              {status === 'reading' && (
                <View style={styles.statusBadgeReading}>
                  <Clock size={12} color="#f59e0b" />
                  <Text style={styles.statusTextReading}>En cours</Text>
                </View>
              )}
              {status === 'want-to-read' && (
                <View style={styles.statusBadgeWant}>
                  <Text style={styles.statusTextWant}>À lire</Text>
                </View>
              )}

              {rating && (
                <View style={styles.ratingContainer}>
                  <Star size={12} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.ratingText}>{rating}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  coverContainer: {
    width: 64,
    height: 96,
    backgroundColor: '#e7e5e4',
    borderRadius: 6,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  noCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  noCoverText: {
    fontSize: 10,
    color: '#a8a29e',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginLeft: 16,
    height: 96,
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 2,
  },
  author: {
    fontSize: 12,
    color: '#78716c',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressText: {
    fontSize: 10,
    color: '#78716c',
    fontWeight: '500',
  },
  percentageText: {
    fontSize: 10,
    color: '#44403c',
  },
  progressBar: {
    height: 6,
    marginBottom: 8,
  },
  xpRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 'auto',
  },
  statusBadgeRead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 4,
  },
  statusTextRead: {
    fontSize: 12,
    fontWeight: '500',
    color: '#059669',
  },
  statusBadgeReading: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    gap: 4,
  },
  statusTextReading: {
    fontSize: 12,
    fontWeight: '500',
    color: '#d97706',
  },
  statusBadgeWant: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  statusTextWant: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#44403c',
  },
});
