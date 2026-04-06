import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BookItem } from '../components/shared/BookItem';
import {
  searchBooks,
  GoogleBookItem,
  isGoogleBooksServiceError,
} from '../services/googleBooksService';
import { Search, BookMarked, BookOpen, CheckCheck, Library } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppStackParamList } from '../navigation/AppNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { streamUserBooks, UserBookDocument, userBookToPartialGoogleBook } from '../services/userBookService';
import { shadows } from '../theme';

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'MainTabs'>;

type FilterKey = 'all' | 'read' | 'reading' | 'want-to-read';

interface EmptyStateConfig {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const EMPTY_STATES: Record<FilterKey, EmptyStateConfig> = {
  all: {
    icon: <Library size={32} color="#d97706" />,
    title: 'Votre bibliothèque est vide',
    subtitle: 'Recherchez un livre ci-dessus pour commencer votre collection.',
  },
  'want-to-read': {
    icon: <BookMarked size={32} color="#64748b" />,
    title: 'Pas encore de liste de souhaits',
    subtitle: 'Les livres que vous voulez lire apparaîtront ici.',
  },
  reading: {
    icon: <BookOpen size={32} color="#d97706" />,
    title: 'Aucune lecture en cours',
    subtitle: 'Commencez un livre depuis votre liste ou via la recherche.',
  },
  read: {
    icon: <CheckCheck size={32} color="#10b981" />,
    title: 'Aucun livre terminé pour l\'instant',
    subtitle: 'Vos livres lus apparaîtront ici une fois terminés. Bonne lecture !',
  },
};

export const LibraryScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GoogleBookItem[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [userBooks, setUserBooks] = useState<UserBookDocument[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isBooksLoading, setIsBooksLoading] = useState(true);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    if (!user) {
      setUserBooks([]);
      setIsBooksLoading(false);
      return;
    }

    const unsubscribe = streamUserBooks(user.uid, (books) => {
      setUserBooks(books);
      setIsBooksLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const normalizedQuery = searchQuery.trim();
    if (normalizedQuery.length <= 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const abortController = new AbortController();

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);

      try {
        const results = await searchBooks(normalizedQuery, {
          signal: abortController.signal,
        });
        setSearchResults(results);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }

        if (isGoogleBooksServiceError(error) && error.code === 'RATE_LIMIT') {
          setSearchError('Trop de recherches en peu de temps. Réessayez dans quelques secondes.');
        } else {
          setSearchError('Impossible de récupérer les livres. Vérifiez votre connexion et réessayez.');
        }

        setSearchResults([]);
      } finally {
        if (!abortController.signal.aborted) {
          setIsSearching(false);
        }
      }
    }, 800);

    return () => {
      clearTimeout(delayDebounceFn);
      abortController.abort();
    };
  }, [searchQuery]);

  const isSearchMode = searchQuery.trim().length > 2;

  const filteredBooks = userBooks.filter(
    book => book.status !== 'none' && (filter === 'all' || book.status === filter)
  );

  const emptyState = EMPTY_STATES[filter];

  const renderEmptyState = (config: EmptyStateConfig) => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrapper}>{config.icon}</View>
      <Text style={styles.emptyTitle}>{config.title}</Text>
      <Text style={styles.emptySubtitle}>{config.subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>Ma Bibliothèque</Text>

        <View style={styles.searchContainer}>
          <Search size={20} color="#78716c" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un livre, un auteur..."
            placeholderTextColor="#a8a29e"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Text style={styles.clearText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {!isSearchMode && (
          <View style={styles.filterContainer}>
            {(['all', 'want-to-read', 'reading', 'read'] as FilterKey[]).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              >
                <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                  {f === 'all' ? 'Tout' : f === 'want-to-read' ? 'À lire' : f === 'reading' ? 'En cours' : 'Lus'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.list}>
          {isSearchMode ? (
            isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#d97706" />
                <Text style={styles.loadingText}>Recherche en cours...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              searchResults.map((book) => (
                <BookItem
                  key={book.id}
                  title={book.volumeInfo.title}
                  author={book.volumeInfo.authors?.[0] || 'Auteur inconnu'}
                  status="want-to-read"
                  coverUrl={book.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:')}
                  onPress={() => navigation.navigate('BookDetail', { book })}
                />
              ))
            ) : searchError ? (
              renderEmptyState({
                icon: <Search size={32} color="#f97316" />,
                title: 'Recherche temporairement limitée',
                subtitle: searchError,
              })
            ) : (
              renderEmptyState({
                icon: <Search size={32} color="#a8a29e" />,
                title: 'Aucun résultat',
                subtitle: `Aucun livre trouvé pour "${searchQuery}".`,
              })
            )
          ) : isBooksLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#d97706" />
            </View>
          ) : filteredBooks.length > 0 ? (
            filteredBooks.map(book => (
              <BookItem
                key={book.id}
                title={book.title}
                author={book.authors?.[0] || 'Auteur inconnu'}
                status={book.status as 'read' | 'reading' | 'want-to-read'}
                coverUrl={book.thumbnailUrl}
                rating={book.status === 'read' ? 5 : undefined}
                progress={
                  book.status === 'reading'
                    ? { current: book.currentPage, total: book.totalPages }
                    : undefined
                }
                onPress={() => {
                  navigation.navigate('BookDetail', {
                    book: userBookToPartialGoogleBook(book),
                  });
                }}
              />
            ))
          ) : (
            renderEmptyState(emptyState)
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
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1c1917',
  },
  clearButton: {
    padding: 4,
  },
  clearText: {
    fontSize: 14,
    color: '#a8a29e',
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
    ...shadows.sm,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#78716c',
  },
  filterTextActive: {
    color: '#1c1917',
    fontWeight: '700',
  },
  list: {
    gap: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  loadingText: {
    color: '#78716c',
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    backgroundColor: '#fafaf9',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f5f5f4',
    borderStyle: 'dashed',
    marginTop: 8,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1c1917',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#78716c',
    textAlign: 'center',
    lineHeight: 20,
  },
});
