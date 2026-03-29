import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Image, ScrollView,
    TouchableOpacity, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { AppStackParamList } from '../navigation/AppNavigator';
import { CheckCircle2, BookOpen, Clock, Hash, Percent } from 'lucide-react-native';
import { RootState } from '../store';
import { getBookById, GoogleBookVolumeInfo } from '../services/googleBooksService';
import { getUserBook, saveOrUpdateUserBook, UserBookDocument } from '../services/userBookService';
import { ProgressBar } from '../components/shared/ProgressBar';

type BookDetailRouteProp = {
    key: string;
    name: 'BookDetail';
    params: AppStackParamList['BookDetail'];
};

type NavigationProp = NativeStackNavigationProp<AppStackParamList, 'BookDetail'>;
type ProgressMode = 'pages' | 'percent';

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
    const [percentRead, setPercentRead] = useState('0');
    const [progressMode, setProgressMode] = useState<ProgressMode>('pages');
    const [existingBook, setExistingBook] = useState<UserBookDocument | null>(null);
    // Enriched data from Google Books API (fetched when description is missing)
    const [richVolumeInfo, setRichVolumeInfo] = useState<GoogleBookVolumeInfo>(volumeInfo || {});

    const totalPages = richVolumeInfo?.pageCount || volumeInfo?.pageCount || 0;
    const coverUrl = (richVolumeInfo?.imageLinks?.thumbnail || volumeInfo?.imageLinks?.thumbnail)?.replace('http:', 'https:');

    const currentPage = parseInt(pagesRead, 10) || 0;
    const percentage = totalPages > 0 ? Math.min(Math.round((currentPage / totalPages) * 100), 100) : parseInt(percentRead, 10) || 0;

    useEffect(() => {
        const init = async () => {
            setIsLoading(true);

            // 1. Fetch full details from Google Books API if description is missing
            if (!volumeInfo?.description) {
                const fullBook = await getBookById(book.id);
                if (fullBook?.volumeInfo) {
                    setRichVolumeInfo(prev => ({ ...prev, ...fullBook.volumeInfo }));
                }
            }

            // 2. Load user's saved progress from Firestore
            if (user) {
                const userBook = await getUserBook(user.uid, book.id);
                if (userBook) {
                    setExistingBook(userBook);
                    setStatus(userBook.status);
                    setPagesRead(userBook.currentPage.toString());
                    setPercentRead(Math.round(userBook.percentage).toString());
                }
            }

            setIsLoading(false);
        };
        init();
    }, [book.id, user]);

    // Sync pages → percent
    const handlePagesChange = (val: string) => {
        setPagesRead(val);
        const p = parseInt(val, 10) || 0;
        if (totalPages > 0) {
            setPercentRead(Math.min(Math.round((p / totalPages) * 100), 100).toString());
        }
    };

    // Sync percent → pages
    const handlePercentChange = (val: string) => {
        setPercentRead(val);
        const pc = parseInt(val, 10) || 0;
        if (totalPages > 0) {
            setPagesRead(Math.round((pc / 100) * totalPages).toString());
        }
    };

    const handleSaveProgress = async () => {
        if (!user) return;
        const currentPagesNumber = parseInt(pagesRead, 10) || 0;
        const total = totalPages || 1;
        const newPercentage = Math.min((currentPagesNumber / total) * 100, 100);

        const historyEntry = { date: new Date().toISOString(), page: currentPagesNumber };
        const updatedHistory = existingBook
            ? [...(existingBook.progressHistory || []), historyEntry]
            : [historyEntry];

        setIsSaving(true);
        const finalStatus = currentPagesNumber >= total ? 'read' : status;
        setStatus(finalStatus);

        await saveOrUpdateUserBook(user.uid, {
            bookId: book.id,
            title: volumeInfo.title,
            authors: volumeInfo.authors || [],
            thumbnailUrl: coverUrl,
            status: finalStatus,
            currentPage: currentPagesNumber,
            totalPages: total,
            percentage: newPercentage,
            progressHistory: updatedHistory,
        });

        setIsSaving(false);
        Alert.alert('Succès !', 'Votre progression a été enregistrée.');
        navigation.goBack();
    };

    const handleStatusChange = async (newStatus: 'none' | 'want-to-read' | 'reading' | 'read') => {
        setStatus(newStatus);
        if (newStatus === 'read' || newStatus === 'want-to-read') {
            if (!user) return;
            setIsSaving(true);
            const total = totalPages || 1;
            const currentPages = newStatus === 'read' ? total : (parseInt(pagesRead, 10) || 0);
            if (newStatus === 'read') {
                setPagesRead(total.toString());
                setPercentRead('100');
            }
            await saveOrUpdateUserBook(user.uid, {
                bookId: book.id,
                title: volumeInfo.title,
                authors: volumeInfo.authors || [],
                thumbnailUrl: coverUrl,
                status: newStatus,
                currentPage: currentPages,
                totalPages: total,
                percentage: (currentPages / total) * 100,
                progressHistory: existingBook?.progressHistory || [],
            });
            setIsSaving(false);
            if (newStatus === 'read') Alert.alert('Félicitations !', 'Livre marqué comme terminé 🎉');
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
            {/* Header */}
            <View style={styles.header}>
                {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={styles.cover} />
                ) : (
                    <View style={styles.noCover}>
                        <Text style={styles.noCoverText}>Pas de couverture</Text>
                    </View>
                )}
                <View style={styles.info}>
                    <Text style={styles.title} numberOfLines={3}>{richVolumeInfo?.title || volumeInfo?.title || 'Titre inconnu'}</Text>
                    {(richVolumeInfo?.authors || volumeInfo?.authors) && (
                        <Text style={styles.author}>{(richVolumeInfo?.authors || volumeInfo?.authors)!.join(', ')}</Text>
                    )}
                    {totalPages > 0 && (
                        <View style={styles.pagesBadge}>
                            <Text style={styles.pagesText}>{totalPages} pages</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity
                    style={[styles.actionButton, status === 'want-to-read' && styles.actionButtonActive]}
                    onPress={() => handleStatusChange('want-to-read')}
                >
                    <Clock size={16} color={status === 'want-to-read' ? '#ffffff' : '#64748b'} />
                    <Text style={[styles.actionText, status === 'want-to-read' && styles.actionTextActive]}>À lire</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, status === 'reading' && styles.actionButtonReadingActive]}
                    onPress={() => handleStatusChange('reading')}
                >
                    <BookOpen size={16} color={status === 'reading' ? '#ffffff' : '#d97706'} />
                    <Text style={[styles.actionText, status === 'reading' && styles.actionTextActive]}>En cours</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionButton, status === 'read' && styles.actionButtonReadActive]}
                    onPress={() => handleStatusChange('read')}
                >
                    <CheckCircle2 size={16} color={status === 'read' ? '#ffffff' : '#10b981'} />
                    <Text style={[styles.actionText, status === 'read' && styles.actionTextActive]}>Terminé</Text>
                </TouchableOpacity>
            </View>

            {/* Progress Section — only when 'reading' and totalPages known */}
            {status === 'reading' && totalPages > 0 && (
                <View style={styles.progressSection}>
                    <Text style={styles.sectionTitle}>Mettre à jour ma progression</Text>

                    {/* Progress bar preview */}
                    <View style={styles.progressPreview}>
                        <View style={styles.progressPreviewLabels}>
                            <Text style={styles.progressPreviewPages}>{pagesRead} pages lues</Text>
                            <Text style={styles.progressPreviewPercent}>{percentage}%</Text>
                        </View>
                        <ProgressBar progress={percentage} style={styles.progressBar} color="#f59e0b" />
                    </View>

                    {/* Mode toggle */}
                    <View style={styles.modeToggle}>
                        <TouchableOpacity
                            style={[styles.modeButton, progressMode === 'pages' && styles.modeButtonActive]}
                            onPress={() => setProgressMode('pages')}
                        >
                            <Hash size={13} color={progressMode === 'pages' ? '#ffffff' : '#78716c'} />
                            <Text style={[styles.modeButtonText, progressMode === 'pages' && styles.modeButtonTextActive]}>
                                Pages
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.modeButton, progressMode === 'percent' && styles.modeButtonActive]}
                            onPress={() => setProgressMode('percent')}
                        >
                            <Percent size={13} color={progressMode === 'percent' ? '#ffffff' : '#78716c'} />
                            <Text style={[styles.modeButtonText, progressMode === 'percent' && styles.modeButtonTextActive]}>
                                Pourcentage
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Input row */}
                    {progressMode === 'pages' ? (
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={pagesRead}
                                onChangeText={handlePagesChange}
                                placeholder="0"
                                placeholderTextColor="#a8a29e"
                            />
                            <Text style={styles.inputLabel}>pages</Text>
                            <Text style={styles.slash}>/</Text>
                            <Text style={styles.totalPagesText}>{totalPages} pages</Text>
                        </View>
                    ) : (
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                keyboardType="number-pad"
                                value={percentRead}
                                onChangeText={handlePercentChange}
                                placeholder="0"
                                placeholderTextColor="#a8a29e"
                            />
                            <Text style={styles.inputLabel}>%</Text>
                            <Text style={styles.slash}>→</Text>
                            <Text style={styles.totalPagesText}>{pagesRead} pages</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.saveButton} onPress={handleSaveProgress} disabled={isSaving}>
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Enregistrer la progression</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {/* Description */}
            {richVolumeInfo?.description ? (
                <View style={styles.descriptionSection}>
                    <Text style={styles.sectionTitle}>Résumé</Text>
                    <Text style={styles.descriptionText}>
                        {richVolumeInfo.description.replace(/<[^>]+>/g, '')}
                    </Text>
                </View>
            ) : isLoading ? null : (
                <View style={styles.noDescriptionContainer}>
                    <Text style={styles.noDescriptionText}>Aucun résumé disponible pour ce livre.</Text>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#ffffff' },
    contentContainer: { padding: 24, paddingBottom: 48 },
    header: { flexDirection: 'row', marginBottom: 24 },
    cover: { width: 100, height: 150, borderRadius: 10, backgroundColor: '#e7e5e4' },
    noCover: {
        width: 100, height: 150, borderRadius: 10,
        backgroundColor: '#e7e5e4', alignItems: 'center', justifyContent: 'center', padding: 8,
    },
    noCoverText: { fontSize: 11, color: '#a8a29e', textAlign: 'center' },
    info: { flex: 1, marginLeft: 16, justifyContent: 'center', gap: 6 },
    title: { fontSize: 18, fontWeight: '700', color: '#1c1917', lineHeight: 24 },
    author: { fontSize: 14, color: '#78716c' },
    pagesBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#f5f5f4', borderRadius: 8,
        paddingHorizontal: 8, paddingVertical: 3,
    },
    pagesText: { fontSize: 12, color: '#78716c', fontWeight: '500' },

    actionsContainer: { flexDirection: 'row', gap: 8, marginBottom: 28 },
    actionButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, paddingHorizontal: 6,
        borderRadius: 10, borderWidth: 1, borderColor: '#e7e5e4',
        backgroundColor: '#ffffff', gap: 5,
    },
    actionButtonActive: { backgroundColor: '#64748b', borderColor: '#64748b' },
    actionButtonReadingActive: { backgroundColor: '#d97706', borderColor: '#d97706' },
    actionButtonReadActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
    actionText: { fontSize: 12, fontWeight: '600', color: '#44403c' },
    actionTextActive: { color: '#ffffff' },

    progressSection: {
        backgroundColor: '#fffbeb', padding: 16,
        borderRadius: 14, marginBottom: 28, gap: 12,
        borderWidth: 1, borderColor: '#fef3c7',
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1c1917' },

    progressPreview: { gap: 6 },
    progressPreviewLabels: { flexDirection: 'row', justifyContent: 'space-between' },
    progressPreviewPages: { fontSize: 12, color: '#78716c', fontWeight: '500' },
    progressPreviewPercent: { fontSize: 12, color: '#d97706', fontWeight: '700' },
    progressBar: { height: 6 },

    modeToggle: {
        flexDirection: 'row',
        backgroundColor: '#fef3c7',
        borderRadius: 10, padding: 3, gap: 3,
    },
    modeButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center',
        justifyContent: 'center', paddingVertical: 7,
        borderRadius: 8, gap: 4,
    },
    modeButtonActive: { backgroundColor: '#d97706' },
    modeButtonText: { fontSize: 12, fontWeight: '600', color: '#78716c' },
    modeButtonTextActive: { color: '#ffffff' },

    inputRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#ffffff', borderRadius: 10,
        paddingHorizontal: 12, paddingVertical: 8,
        borderWidth: 1, borderColor: '#fef3c7', gap: 8,
    },
    input: {
        fontSize: 18, fontWeight: '700', color: '#1c1917',
        minWidth: 52, textAlign: 'center',
        borderBottomWidth: 2, borderBottomColor: '#f59e0b',
        paddingVertical: 2,
    },
    inputLabel: { fontSize: 13, color: '#78716c', fontWeight: '500' },
    slash: { fontSize: 16, color: '#a8a29e', marginHorizontal: 2 },
    totalPagesText: { fontSize: 13, color: '#44403c', fontWeight: '600' },

    saveButton: {
        backgroundColor: '#b45309', paddingVertical: 13,
        borderRadius: 12, alignItems: 'center',
    },
    saveButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '700' },

    descriptionSection: { marginBottom: 24 },
    descriptionText: { fontSize: 14, lineHeight: 24, color: '#44403c', marginTop: 10 },
    noDescriptionContainer: {
        padding: 16, backgroundColor: '#f9fafb',
        borderRadius: 10, alignItems: 'center',
    },
    noDescriptionText: { fontSize: 13, color: '#a8a29e', fontStyle: 'italic' },
});
