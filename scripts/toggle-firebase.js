const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../apps/mobile/src/config/firebaseEnv.ts');
const mode = process.argv[2]; // 'emulator' or 'cloud'

if (!mode) {
  console.error('Usage: node toggle-firebase.js [emulator|cloud]');
  process.exit(1);
}

const useEmulator = mode === 'emulator';

const content = `/**
 * Toggle for Firebase Emulator usage.
 * This file is automatically modified by scripts/toggle-firebase.js.
 * Do not edit manually unless you know what you are doing.
 */
export const USE_FIREBASE_EMULATOR = ${useEmulator};
`;

try {
  fs.writeFileSync(targetPath, content);
  console.log(`🔌 Firebase mode set to: ${useEmulator ? 'EMULATOR' : 'CLOUD'}`);
} catch (error) {
  console.error('❌ Failed to update firebaseEnv.ts:', error);
  process.exit(1);
}
