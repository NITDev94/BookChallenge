import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from '@react-native-firebase/functions';
import { getStorage, connectStorageEmulator } from '@react-native-firebase/storage';
import { Platform, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * Get the IP address of the machine running the metro server.
 * This is used to connect to the emulators from a real device.
 */
const getMachineIp = () => {
  const scriptURL = NativeModules.SourceCode.scriptURL;
  if (!scriptURL) return 'localhost';
  const address = scriptURL.split('://')[1].split('/')[0];
  const hostname = address.split(':')[0];
  return hostname;
};

/**
 * Get the emulator host based on the environment.
 * - Android Emulator: 10.0.2.2
 * - iOS Simulator: localhost
 * - Real Device: IP of the machine running Metro
 */
const getEmulatorHost = async () => {
    const isEmulator = await DeviceInfo.isEmulator();
    
    if (Platform.OS === 'android') {
        // Android Emulator uses 10.0.2.2 to access host localhost
        return '10.0.2.2';
    }

    if (isEmulator) {
        // iOS Simulator
        return 'localhost';
    }

    // Real Device (iOS or Android)
    return getMachineIp();
};

export const initializeFirebase = async () => {
  if (__DEV__) {
    try {
      const emulatorHost = await getEmulatorHost();
      console.log(`🔌 Connecting to Firebase Emulators at ${emulatorHost}`);

      // Auth Emulator
      const authInstance = getAuth();
      connectAuthEmulator(authInstance, `http://${emulatorHost}:9099`);

      // Firestore Emulator
      const firestoreInstance = getFirestore();
      connectFirestoreEmulator(firestoreInstance, emulatorHost, 8080);
      
      // Functions Emulator
      const functionsInstance = getFunctions();
      connectFunctionsEmulator(functionsInstance, emulatorHost, 5001);

      // Storage Emulator
      const storageInstance = getStorage();
      connectStorageEmulator(storageInstance, emulatorHost, 9199);
      
      console.log('✅ Connected to Firebase Emulators');
    } catch (error) {
      console.error('❌ Failed to connect to Firebase Emulators:', error);
    }
  } else {
      console.log('🚀 Running with production Firebase');
  }
};
