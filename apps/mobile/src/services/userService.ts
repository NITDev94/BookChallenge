import { 
  getFirestore, 
  doc, 
  setDoc,
  serverTimestamp 
} from '@react-native-firebase/firestore';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: FirebaseFirestoreTypes.FieldValue;
  booksRead: number;
  currentChallenges: string[];
  badges: string[];
}

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
