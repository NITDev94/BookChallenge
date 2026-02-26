import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';

export interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string | null;
  createdAt: any; // Firestore ServerTimestamp
  booksRead: number;
  currentChallenges: string[];
  badges: string[];
}

/**
 * Creates the user document in Firestore's `users` collection.
 * Called immediately after Firebase Auth account creation.
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
  console.log('📝 [userService] createUserDocument called', { uid, email, displayName });

  const userRef = doc(getFirestore(), 'users', uid);
  console.log('📝 [userService] Firestore ref path:', userRef.path);

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
    console.log('✅ [userService] User document written successfully!');
  } catch (err) {
    console.error('❌ [userService] setDoc FAILED:', err);
    throw err; // re-throw so the caller can show an error
  }
};
