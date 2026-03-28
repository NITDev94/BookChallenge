import React, { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { store, RootState } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initializeFirebase } from './src/config/firebaseConfig';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { setUser, clearUser, AuthUser } from './src/store/slices/authSlice';

/**
 * Inner component — has access to the Redux store via Provider above.
 * Attaches the Firebase auth listener once, after Firebase is initialised.
 */
const AppInner = () => {
  const dispatch = useDispatch();
  const isLoading = useSelector((state: RootState) => state.auth.isLoading);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    const bootstrap = async () => {
      // Ensure emulators are connected before subscribing
      await initializeFirebase();

      // Listen to Firebase Auth state — fires immediately with current user
      unsubscribe = onAuthStateChanged(getAuth(), firebaseUser => {
        if (firebaseUser) {
          const user: AuthUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
          };
          dispatch(setUser(user));
        } else {
          dispatch(clearUser());
        }
      });
    };

    bootstrap();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [dispatch]);

  // Show a splash/loading indicator while Firebase resolves the initial state
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <RootNavigator />;
};

function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppInner />
      </SafeAreaProvider>
    </Provider>
  );
}

export default App;
