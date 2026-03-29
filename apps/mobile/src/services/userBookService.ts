import { 
  getFirestore, 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  onSnapshot,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';

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
    startedAt?: FirebaseFirestoreTypes.Timestamp;
    updatedAt: FirebaseFirestoreTypes.Timestamp;
}

/**
 * Minimal book shape accepted by BookDetailScreen when navigating from a
 * UserBookDocument. BookDetailScreen fetches the full data if description
 * is missing, so we only need identity + display fields here.
 */
export interface PartialGoogleBook {
    id: string;
    volumeInfo: {
        title: string;
        authors: string[];
        imageLinks?: { thumbnail?: string };
        pageCount?: number;
        description?: string;
    };
}

/**
 * Converts a UserBookDocument into the minimal shape expected by the
 * BookDetail route param. Use this instead of inline `as any` casts.
 */
export const userBookToPartialGoogleBook = (book: UserBookDocument): PartialGoogleBook => ({
    id: book.bookId,
    volumeInfo: {
        title: book.title,
        authors: book.authors,
        imageLinks: book.thumbnailUrl ? { thumbnail: book.thumbnailUrl } : undefined,
        pageCount: book.totalPages,
        // description intentionally omitted — BookDetailScreen will fetch it
    },
});

// ---------------------------------------------------------------------------
// Helpers for mapping Firestore snapshots without `any`
// ---------------------------------------------------------------------------
const docToUserBook = (
    snapshot: FirebaseFirestoreTypes.QueryDocumentSnapshot
): UserBookDocument => ({ id: snapshot.id, ...snapshot.data() } as UserBookDocument);

// ---------------------------------------------------------------------------

/**
 * Retrieves a single user book if it exists, otherwise null
 */
export const getUserBook = async (userId: string, bookId: string): Promise<UserBookDocument | null> => {
    try {
        const db = getFirestore();
        const docId = `${userId}_${bookId}`;
        const docRef = doc(db, 'userBooks', docId);
        const snapshot = await getDoc(docRef);

        if (snapshot.exists()) {
            return { id: snapshot.id, ...snapshot.data() } as UserBookDocument;
        }
        return null;
    } catch (error) {
        console.error('[userBookService] Error fetching user book:', error);
        return null;
    }
};

/**
 * Retrieves all books for a specific user
 */
export const getUserBooks = async (userId: string): Promise<UserBookDocument[]> => {
    try {
        const db = getFirestore();
        const userBooksRef = collection(db, 'userBooks');
        const q = query(userBooksRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(docToUserBook);
    } catch (error) {
        console.error('[userBookService] Error fetching user books:', error);
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

        const dataToSave = {
            ...bookDetails,
            userId,
            updatedAt: serverTimestamp(),
            ...(bookDetails.status === 'reading' && !snapshot.exists()
                ? { startedAt: serverTimestamp() }
                : {}),
        };

        await setDoc(docRef, dataToSave, { merge: true });
    } catch (error) {
        console.error('[userBookService] Error saving book:', error);
        throw error;
    }
};

/**
 * Stream all books for a specific user in real-time
 */
export const streamUserBooks = (userId: string, callback: (books: UserBookDocument[]) => void) => {
    try {
        const db = getFirestore();
        const userBooksRef = collection(db, 'userBooks');
        const q = query(userBooksRef, where('userId', '==', userId));

        return onSnapshot(q, (snapshot) => {
            callback(snapshot.docs.map(docToUserBook));
        }, (error) => {
            console.error('[userBookService] Error streaming user books:', error);
        });
    } catch (error) {
        console.error('[userBookService] Error setting up user books stream:', error);
        return () => {};
    }
};
