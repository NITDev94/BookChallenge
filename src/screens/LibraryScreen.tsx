import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookItem } from '../components/BookItem';

export const LibraryScreen = () => {
  const [filter, setFilter] = useState<'all' | 'read' | 'reading'>('all');

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Ma Bibliothèque</Text>

        <View style={styles.filterContainer}>
          {(['all', 'reading', 'read'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterButton,
                filter === f && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterText,
                filter === f && styles.filterTextActive
              ]}>
                {f === 'all' ? 'Tout' : f === 'reading' ? 'En cours' : 'Lus'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.list}>
          {(filter === 'all' || filter === 'reading') && (
            <BookItem
              title="La Passe-miroir"
              author="Christelle Dabos"
              status="reading"
              coverUrl="https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=800"
              progress={{ current: 342, total: 520 }}
            />
          )}
          {(filter === 'all' || filter === 'read') && (
            <>
              <BookItem
                title="Harry Potter à l'école des sorciers"
                author="J.K. Rowling"
                status="read"
                rating={5}
                coverUrl="https://images.unsplash.com/photo-1626618012641-bf8ca5e0ae1f?auto=format&fit=crop&q=80&w=800"
              />
              <BookItem
                title="1984"
                author="George Orwell"
                status="read"
                rating={4.5}
                coverUrl="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?auto=format&fit=crop&q=80&w=800"
              />
            </>
          )}
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
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f4',
    padding: 4,
    borderRadius: 12,
    marginBottom: 24,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  filterButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#78716c',
  },
  filterTextActive: {
    color: '#1c1917',
  },
  list: {
    gap: 12,
  },
});
