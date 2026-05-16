import { Platform, NativeModules } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { getAuth, connectAuthEmulator } from '@react-native-firebase/auth';
import { getFirestore, connectFirestoreEmulator } from '@react-native-firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from '@react-native-firebase/functions';
import { getStorage, connectStorageEmulator } from '@react-native-firebase/storage';
import { DEV_MACHINE_IP, USE_FIREBASE_EMULATOR } from '@env';

/**
 * Parses the machine IP address from the Metro bundler script URL.
 * Falls back to 'localhost' if the script URL is not available.
 * 
 * @returns {string} The bundler's hostname or IP address.
 */
const getBundlerHost = (): string => {
  const scriptURL = NativeModules.SourceCode.scriptURL;
  if (!scriptURL) return 'localhost';
  
  try {
    const address = scriptURL.split('://')[1].split('/')[0];
    const hostname = address.split(':')[0];
    return hostname;
  } catch (e) {
    return 'localhost';
  }
};

/**
 * Determines the correct host for Firebase Emulators based on the current environment.
 * Handles Android emulator, iOS simulator, and physical devices via Hotspot or local network.
 * 
 * @returns {Promise<string>} The IP or hostname to connect to.
 */
const getEmulatorHost = async (): Promise<string> => {
    const isEmulator = await DeviceInfo.isEmulator();
    
    if (Platform.OS === 'android') {
        // Android Emulator uses 10.0.2.2 to access the machine's localhost
        return '10.0.2.2';
    }

    if (isEmulator) {
        // iOS Simulator uses localhost
        return 'localhost';
    }

    const detectedIp = getBundlerHost();
    
    // If on a real device and the detected IP is a loopback or unavailable,
    // we use the configured IP from the .env file as a fallback.
    if (detectedIp === 'localhost' || detectedIp === '127.0.0.1' || !detectedIp) {
        return DEV_MACHINE_IP || 'localhost'; 
    }

    return detectedIp;
};

/**
 * Initializes Firebase services and connects them to local emulators if enabled.
 * Logging is provided to verify connectivity on physical devices.
 */
export const initializeFirebase = async () => {
  if (USE_FIREBASE_EMULATOR === 'true') {
    try {
      const emulatorHost = await getEmulatorHost();
      
      console.log(`🔌 FIREBASE: Connecting to emulators at ${emulatorHost}`);

      // Auth Emulator (Port 9099)
      connectAuthEmulator(getAuth(), `http://${emulatorHost}:9099`);

      // Firestore Emulator (Port 8080)
      connectFirestoreEmulator(getFirestore(), emulatorHost, 8080);

      // Functions Emulator (Port 5001)
      connectFunctionsEmulator(getFunctions(), emulatorHost, 5001);

      // Storage Emulator (Port 9199)
      connectStorageEmulator(getStorage(), emulatorHost, 9199);

      console.log('✅ FIREBASE: Successfully connected to emulators');
    } catch (error) {
      console.error('❌ FIREBASE: Emulator connection failed:', error);
    }
  }
};
