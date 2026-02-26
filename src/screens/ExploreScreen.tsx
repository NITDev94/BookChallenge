import React from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity } from 'react-native';
import { Search } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ExploreScreen = () => {
  const tags = ["Fantasy", "Thriller", "Romance", "Science-fiction", "Classique", "Manga"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Explorer</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color="#a8a29e" style={styles.searchIcon} />
          <TextInput
            placeholder="Rechercher un libro, un auteur..."
            placeholderTextColor="#a8a29e"
            style={styles.input}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genres populaires</Text>
          <View style={styles.tagGrid}>
            {tags.map(tag => (
              <TouchableOpacity key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nouveaux Challenges</Text>
          <View style={styles.grid}>
            <View style={[styles.challengeCard, styles.emeraldCard]}>
              <Text style={styles.emoji}>🌿</Text>
              <Text style={styles.challengeTitle}>Nature & Écologie</Text>
              <Text style={styles.challengeSubtitle}>3 livres • 1 mois</Text>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonTextEmerald}>Rejoindre</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.challengeCard, styles.indigoCard]}>
              <Text style={styles.emoji}>🕵️‍♀️</Text>
              <Text style={styles.challengeTitle}>Mois du Polar</Text>
              <Text style={styles.challengeSubtitle}>4 livres • Octobre</Text>
              <TouchableOpacity style={styles.joinButton}>
                <Text style={styles.joinButtonTextIndigo}>Rejoindre</Text>
              </TouchableOpacity>
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
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 24,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4', // stone-100
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 32,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: 14,
    color: '#1c1917',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 16,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e7e5e4', // stone-200
    borderRadius: 999,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#57534e', // stone-600
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  challengeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  emeraldCard: {
    backgroundColor: '#ecfdf5', // emerald-50
    borderColor: '#d1fae5', // emerald-100
  },
  indigoCard: {
    backgroundColor: '#eef2ff', // indigo-50
    borderColor: '#e0e7ff', // indigo-100
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  challengeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 12,
    color: '#57534e',
    marginBottom: 12,
  },
  joinButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  joinButtonTextEmerald: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857', // emerald-700
  },
  joinButtonTextIndigo: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4338ca', // indigo-700
  },
});
