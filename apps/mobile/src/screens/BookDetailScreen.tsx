import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { AppStackParamList } from '../navigation/AppNavigator';
import { CheckCircle2, BookOpen } from 'lucide-react-native';
import { RootState } from '../store';
import { getUserBook, saveOrUpdateUserBook, UserBookDocument } from '../services/userBookService';

type BookDetailRouteProp = {
    key: string;
    name: 'BookDetail';
    params: AppStackParamList['BookDetail'];
};

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'BookDetail'>;

export const BookDetailScreen = () => {
    const route = useRoute<BookDetailRouteProp>();
    const navigation = useNavigation<NavigationProp>();
    const user = useSelector((state: RootState) => state.auth.user);

    const { book } = route.params;
    const { volumeInfo } = book;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState<'none' | 'want-to-read' | 'reading' | 'read'>('none');
    const [pagesRead, setPagesRead] = useState('0');
    const [existingBook, setExistingBook] = useState<UserBookDocument | null>(null);

    const coverUrl = volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:');

    useEffect(() => {
        const fetchBookStatus = async () => {
            if (!user) return;
            setIsLoading(true);
            const userBook = await getUserBook(user.uid, book.id);
            if (userBook) {
                setExistingBook(userBook);
                setStatus(userBook.status);
                setPagesRead(userBook.currentPage.toString());
            }
            setIsLoading(false);
        };

        fetchBookStatus();
    }, [book.id, user]);

    const handleSaveProgress = async () => {
        if (!user) return;

        const currentPagesNumber = parseInt(pagesRead, 10) || 0;
        const totalPages = volumeInfo.pageCount || 1;
        const newPercentage = Math.min((currentPagesNumber / totalPages) * 100, 100);

        const historyEntry = {
            date: new Date().toISOString(),
            page: currentPagesNumber,
        };

        const updatedHistory = existingBook
            ? [...(existingBook.progressHistory || []), historyEntry]
            : [historyEntry];

        setIsSaving(true);

        // Automatically set as read if pages >= totalPages
        const finalStatus = currentPagesNumber >= totalPages ? 'read' : status;
        setStatus(finalStatus);

        await saveOrUpdateUserBook(user.uid, {
            bookId: book.id,
            title: volumeInfo.title,
            authors: volumeInfo.authors || [],
            thumbnailUrl: coverUrl,
            status: finalStatus,
            currentPage: currentPagesNumber,
            totalPages,
            percentage: newPercentage,
            progressHistory: updatedHistory,
        });

        setIsSaving(false);

        Alert.alert('Succès!', 'Votre progression a été enregistrée.');
        navigation.goBack();
    };

    const handleStatusChange = async (newStatus: 'none' | 'want-to-read' | 'reading' | 'read') => {
        setStatus(newStatus);
        // We can trigger an auto-save here if we just mark it as 'read' or 'want-to-read'
        if (newStatus === 'read' || newStatus === 'want-to-read') {
            if (!user) return;
            setIsSaving(true);
            const totalPages = volumeInfo.pageCount || 1;
            const currentPages = newStatus === 'read' ? totalPages : (parseInt(pagesRead, 10) || 0);

            if (newStatus === 'read') {
                setPagesRead(totalPages.toString());
            }

            await saveOrUpdateUserBook(user.uid, {
                bookId: book.id,
                title: volumeInfo.title,
                authors: volumeInfo.authors || [],
                thumbnailUrl: coverUrl,
                status: newStatus,
                currentPage: currentPages,
                totalPages,
                percentage: (currentPages / totalPages) * 100,
                progressHistory: existingBook?.progressHistory || [],
            });
            setIsSaving(false);
            if (newStatus === 'read') {
                Alert.alert('Félicitations!', 'Livre marqué comme terminé.');
            }
        }
    };

    if (isLoading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#d97706" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
                {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.cover} />
                ) : (
                    <View style={styles.noCover}>
                        <Text style={styles.noCoverText}>Pas de couverture</Text>
                    </View>
                )}
                <View style={styles.info}>
                    <Text style={styles.title}>{volumeInfo.title}</Text>
                    {volumeInfo.authors && (
                        <Text style={styles.author}>{volumeInfo.authors.join(', ')}</Text>
                    )}
                    {volumeInfo.pageCount && (
                        <Text style={styles.pages}>{volumeInfo.pageCount} pages totales</Text>
                    )}
                </View>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, status === 'reading' && styles.actionButtonActive]}
                    onPress={() => setStatus('reading')}
                >
                    <BookOpen size={20} color={status === 'reading' ? '#ffffff' : '#d97706'} />
                    <Text style={[styles.actionText, status === 'reading' && styles.actionTextActive]}>
                        En cours
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, status === 'read' && styles.actionButtonActive]}
                    onPress={() => setStatus('read')}
                >
                    <CheckCircle2 size={20} color={status === 'read' ? '#ffffff' : '#10b981'} />
                    <Text style={[styles.actionText, status === 'read' && styles.actionTextActive]}>
                        Terminé
                    </Text>
                </TouchableOpacity>
            </View>

            {status === 'reading' && volumeInfo.pageCount && (
                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>Mettre à jour ma progression</Text>
                    <View style={styles.progressInputContainer}>
                        <TextInput
                            style={styles.input}
                            keyboardType="number-pad"
                            value={pagesRead}
                            onChangeText={setPagesRead}
                            placeholder="0"
                        />
                        <Text style={styles.slash}>/</Text>
                        <Text style={styles.totalPages}>{volumeInfo.pageCount}</Text>
                    </View>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveProgress}>
                        <Text style={styles.saveButtonText}>Enregistrer</Text>
                    </TouchableOpacity>
                </View>
            )}

            {volumeInfo.description && (
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>Résumé</Text>
                    <Text style={styles.descriptionText}>
                        {volumeInfo.description.replace(/<[^>]+>/g, '')}
                    </Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    contentContainer: {
        padding: 24,
    },
    header: {
        flexDirection: 'row',
        marginBottom: 24,
    },
    cover: {
        width: 100,
        height: 150,
        borderRadius: 8,
        backgroundColor: '#e7e5e4',
    },
    noCover: {
        width: 100,
        height: 150,
        borderRadius: 8,
        backgroundColor: '#e7e5e4',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    noCoverText: {
        fontSize: 12,
        color: '#a8a29e',
        textAlign: 'center',
    },
    info: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1c1917',
        marginBottom: 8,
    },
    author: {
        fontSize: 16,
        color: '#78716c',
        marginBottom: 8,
    },
    pages: {
        fontSize: 14,
        color: '#a8a29e',
        fontWeight: '500',
    },
    actionsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#e7e5e4',
        backgroundColor: '#ffffff',
        gap: 8,
    },
    actionButtonActive: {
        backgroundColor: '#d97706',
        borderColor: '#d97706',
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1c1917',
    },
    actionTextActive: {
        color: '#ffffff',
    },
    progressSection: {
        backgroundColor: '#fffbeb',
        padding: 24,
        borderRadius: 16,
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1c1917',
        marginBottom: 16,
    },
    progressInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 12,
    },
    input: {
        backgroundColor: '#ffffff',
        fontSize: 24,
        fontWeight: '700',
        color: '#1c1917',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        width: 100,
        textAlign: 'center',
        borderWidth: 1,
        borderColor: '#fef3c7',
    },
    slash: {
        fontSize: 24,
        fontWeight: '300',
        color: '#a8a29e',
    },
    totalPages: {
        fontSize: 24,
        fontWeight: '700',
        color: '#78716c',
    },
    saveButton: {
        backgroundColor: '#b45309',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    descriptionSection: {
        marginBottom: 32,
    },
    descriptionText: {
        fontSize: 14,
        lineHeight: 24,
        color: '#44403c',
    },
});
