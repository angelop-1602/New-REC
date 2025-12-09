// lib/firebaseConfig.ts
import { initializeApp } from "firebase/app";

// Note: databaseURL is optional - only required for Realtime Database, not Firestore
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  ...(process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL && {
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  }),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Required Firebase configuration keys (databaseURL is optional for Firestore)
const requiredKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

// Debug Firebase configuration in development
if (process.env.NODE_ENV === 'development') {
  const missingKeys = requiredKeys
    .filter(key => !firebaseConfig[key as keyof typeof firebaseConfig])
    .map(key => key);
  
  if (missingKeys.length > 0) {
    console.warn('Missing required Firebase configuration keys:', missingKeys);
    console.warn('Make sure all required Firebase environment variables are set in your .env.local file');
  }
  
  // Optional: Log if databaseURL is missing (only needed for Realtime Database)
  if (!process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL) {
    console.info('Note: databaseURL is not set. This is optional for Firestore (only required for Realtime Database).');
  }
}

const firebaseApp = initializeApp(firebaseConfig);

export default firebaseApp;
