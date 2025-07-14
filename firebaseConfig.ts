import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// IMPORTANT: Replace this with your actual Firebase config from your Firebase project settings
const firebaseConfig = {
  apiKey: "AIzaSyCUuGBuOCmDOUMABciifaNjD4ezpML4En8",
  authDomain: "pinpoint-95107.firebaseapp.com",
  projectId: "pinpoint-95107",
  storageBucket: "pinpoint-95107.appspot.com",
  messagingSenderId: "896139017077",
  appId: "1:896139017077:ios:fdc8c5349806db94c2f13c",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

// Initialize Firebase Auth with persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

export { auth, db };

