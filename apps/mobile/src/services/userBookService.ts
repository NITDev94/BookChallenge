import { getFirestore, collection, doc, setDoc, getDoc, query, where, getDocs, serverTimestamp, updateDoc } from '@react-native-firebase/firestore';

export interface ProgressHistoryEntry {
    date: string;
    page: number;
}

export interface UserBookDocument {
    id?: string;
    userId: string;
    bookId: string;
    title: string;
    authors: string[];
    thumbnailUrl?: string;
    status: 'none' | 'want-to-read' | 'reading' | 'read';
    currentPage: number;
    totalPages: number;
    percentage: number;
    progressHistory: ProgressHistoryEntry[];
    startedAt?: any; // Firestore Timestamp
    updatedAt: any; // Firestore Timestamp
}

/**
 * Retrieves a single user book if it exists, otherwise null
 */
export const getUserBook = async (userId: string, bookId: string): Promise<UserBookDocument | null> => {
    try {
        const docId = `${userId}_${bookId}`;
        const db = getFirestore();
        const docRef = doc(db, 'userBooks', docId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as UserBookDocument;
        }
        return null;
    } catch (error) {
        console.error('Error fetching user book:', error);
        return null;
    }
};

/**
 * Retrieves all books for a specific user
 */
export const getUserBooks = async (userId: string): Promise<UserBookDocument[]> => {
    try {
        const db = getFirestore();
        const q = query(collection(db, 'userBooks'), where('userId', '==', userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as UserBookDocument));
    } catch (error) {
        console.error('Error fetching user books:', error);
        return [];
    }
};

/**
 * Saves or updates a book associated with a user
 */
export const saveOrUpdateUserBook = async (
    userId: string,
    bookDetails: Omit<UserBookDocument, 'userId' | 'updatedAt' | 'id'>
): Promise<void> => {
    try {
        const db = getFirestore();
        const docId = `${userId}_${bookDetails.bookId}`;
        const docRef = doc(db, 'userBooks', docId);

        const snapshot = await getDoc(docRef);

        const dataToSave: Partial<UserBookDocument> = {
            ...bookDetails,
            userId,
            updatedAt: serverTimestamp(),
        };

        if (bookDetails.status === 'reading' && !snapshot.exists()) {
            dataToSave.startedAt = serverTimestamp();
        }

        await setDoc(docRef, dataToSave, { merge: true });

        console.log('✅ [userBookService] Book saved successfully:', docId);
    } catch (error) {
        console.error('❌ [userBookService] Error saving book:', error);
        throw error;
    }
};
