// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";
// import { getStorage, ref, uploadBytes } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const database = getDatabase(app);
// const storage = getStorage(app);

// export const uploadFile = async (file) => {
//   try {
//     const storageRef = ref(storage, file.name);
//     await uploadBytes(storageRef, file);
//     return storageRef.getDownloadURL();
//   } catch (error) {
//     console.error(error);
//     throw error;
//   }
// };

// Utility functions
export function getTimestampFromKey(key) {
  // Extract the first 8 characters
  const timestampPart = key.substr(0, 8);
  // Convert from base 64 to decimal
  const timestampInt = parseInt(timestampPart, 36);
  // Adjust for the epoch used by Firebase (June 2015)
  return timestampInt + 1420070400000;
}
