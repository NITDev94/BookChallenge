import { 
  getFirestore, 
  doc, 
  getDoc,
  onSnapshot,
  setDoc,
  serverTimestamp 
} from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: FirebaseFirestoreTypes.Timestamp | FirebaseFirestoreTypes.FieldValue | null;
  booksRead: number;
  currentChallenges: string[];
  badges: string[];
}

const mapToUserDocument = (
  uid: string,
  data: FirebaseFirestoreTypes.DocumentData,
): UserDocument => ({
  uid: (typeof data.uid === 'string' && data.uid.length > 0) ? data.uid : uid,
  email: typeof data.email === 'string' ? data.email : null,
  displayName: typeof data.displayName === 'string' ? data.displayName : null,
  createdAt: data.createdAt ?? null,
  booksRead: typeof data.booksRead === 'number' ? data.booksRead : 0,
  currentChallenges: Array.isArray(data.currentChallenges)
    ? data.currentChallenges.filter((challenge): challenge is string => typeof challenge === 'string')
    : [],
  badges: Array.isArray(data.badges)
    ? data.badges.filter((badge): badge is string => typeof badge === 'string')
    : [],
});

/**
 * Creates the user document in Firestore's `users` collection.
 * Called immediately after Firebase Auth account creation (SignupScreen).
 *
 * @param uid - Firebase Auth UID
 * @param email - User email
 * @param displayName - Username chosen during signup
 */
export const createUserDocument = async (
  uid: string,
  email: string | null,
  displayName: string | null,
): Promise<void> => {
  const db = getFirestore();
  const userRef = doc(db, 'users', uid);

  const userData: UserDocument = {
    uid,
    email,
    displayName,
    createdAt: serverTimestamp(),
    booksRead: 0,
    currentChallenges: [],
    badges: [],
  };

  try {
    await setDoc(userRef, userData, { merge: true });
  } catch (err: any) {
    console.error('[userService] Failed to create user document:', err.code, err.message);
    throw err;
  }
};

/**
 * Retrieves one user document from Firestore.
 */
export const getUserDocument = async (uid: string): Promise<UserDocument | null> => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    if (!data) {
      return null;
    }

    return mapToUserDocument(uid, data);
  } catch (error) {
    console.error('[userService] Error fetching user document:', error);
    return null;
  }
};

/**
 * Stream one user document in real-time.
 */
export const streamUserDocument = (
  uid: string,
  callback: (userDocument: UserDocument | null) => void,
) => {
  try {
    const db = getFirestore();
    const userRef = doc(db, 'users', uid);

    return onSnapshot(
      userRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          callback(null);
          return;
        }

        const data = snapshot.data();
        if (!data) {
          callback(null);
          return;
        }

        callback(mapToUserDocument(uid, data));
      },
      (error) => {
        console.error('[userService] Error streaming user document:', error);
      },
    );
  } catch (error) {
    console.error('[userService] Error setting up user document stream:', error);
    return () => {};
  }
};
