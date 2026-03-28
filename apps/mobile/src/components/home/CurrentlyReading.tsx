import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus } from 'lucide-react-native';
import { BookItem } from '../shared/BookItem';
import { typography } from '../../theme/typography';
import { colors } from '../../theme/colors';
import { AppStackParamList } from '../../navigation/AppNavigator';
import { searchBooks, GoogleBookItem } from '../../services/googleBooksService';

import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type TabParamList = {
    Home: undefined;
    Explore: undefined;
    Library: undefined;
    Profile: undefined;
};

type NavigationProp = BottomTabNavigationProp<TabParamList, 'Home'>;

export const CurrentlyReading = () => {
    const navigation = useNavigation<NavigationProp>();

    // We will fetch some recent French books to show as a demo
    const [recentBook, setRecentBook] = useState<GoogleBookItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDemoBook = async () => {
            try {
                // Fetch a popular French book for the demo
                const results = await searchBooks('Harry Potter');
                if (results.length > 0) {
                    setRecentBook(results[0]);
                }
            } catch (error) {
                console.error("Failed to fetch demo book:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDemoBook();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.sectionHeader}>
                <View style={styles.titleWithBadge}>
                    <Text style={styles.sectionTitle}>Lectures en cours</Text>
                    <View style={styles.countBadge}>
                        <Text style={styles.countText}>{recentBook ? '1' : '0'}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => navigation.navigate('Library')}
                >
                    <Plus color="#d97706" size={24} />
                </TouchableOpacity>
            </View>

            {isLoading ? (
                <ActivityIndicator size="small" color="#d97706" />
            ) : recentBook ? (
                <BookItem
                    title={recentBook.volumeInfo.title}
                    author={recentBook.volumeInfo.authors?.[0] || 'Auteur Inconnu'}
                    status="reading"
                    coverUrl={recentBook.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:')}
                    progress={{
                        current: 120, // Mock progress for demo
                        total: recentBook.volumeInfo.pageCount || 300
                    }}
                    xpReward={50}
                    onPress={() => {
                        navigation.getParent()?.navigate('BookDetail', { book: recentBook });
                    }}
                />
            ) : (
                <Text style={{ color: '#78716c' }}>Aucune lecture en cours.</Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleWithBadge: {
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
    addButton: {
        padding: 6,
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
