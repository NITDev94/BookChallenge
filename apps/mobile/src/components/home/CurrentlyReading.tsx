import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, BookOpen } from 'lucide-react-native';
import { BookItem } from '../shared/BookItem';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { MainTabParamList } from '../../navigation/MainTabNavigator';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { streamUserBooks, UserBookDocument, userBookToPartialGoogleBook } from '../../services/userBookService';
import { commonStyles } from '../../theme';

type NavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

export const CurrentlyReading = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);

  const [readingBooks, setReadingBooks] = useState<UserBookDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = streamUserBooks(user.uid, (books) => {
      const currentlyReading = books.filter(b => b.status === 'reading');
      setReadingBooks(currentlyReading);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <View style={styles.container}>
      <View style={commonStyles.sectionHeader}>
        <View style={styles.titleWithBadge}>
          <Text style={commonStyles.sectionTitle}>Lectures en cours</Text>
          <View style={commonStyles.countBadge}>
            <Text style={commonStyles.countBadgeText}>{readingBooks.length}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('Library')}
        >
          <Plus color="#d97706" size={22} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.skeletonCard} />
      ) : readingBooks.length === 0 ? (
        <View style={commonStyles.emptyContainer}>
          <View style={commonStyles.emptyIconWrapper}>
            <BookOpen size={28} color="#d97706" />
          </View>
          <Text style={commonStyles.emptyTitle}>Aucune lecture en cours</Text>
          <Text style={commonStyles.emptySubtitle}>
            Ajoutez un livre depuis la bibliothèque pour commencer !
          </Text>
        </View>
      ) : (
        <View style={styles.bookList}>
          {readingBooks.map(book => (
            <BookItem
              key={book.id}
              title={book.title}
              author={book.authors?.[0] || 'Auteur inconnu'}
              status="reading"
              coverUrl={book.thumbnailUrl}
              progress={{
                current: book.currentPage,
                total: book.totalPages,
              }}
              xpReward={50}
              onPress={() => {
                navigation.navigate('BookDetail', {
                  book: userBookToPartialGoogleBook(book),
                });
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addButton: {
    padding: 6,
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookList: {
    gap: 12,
  },
  skeletonCard: {
    height: 96,
    backgroundColor: '#f5f5f4',
    borderRadius: 12,
  },
});
