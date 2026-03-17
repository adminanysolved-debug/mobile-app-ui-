import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  OAuthProvider,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  Auth,
  UserCredential,
  ConfirmationResult,
  ApplicationVerifier,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  initializeAuth,
  getAuth,
  getReactNativePersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig =
  Platform.OS === 'web'
    ? {
      apiKey: extra.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      authDomain:
        extra.firebaseAuthDomain ||
        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId:
        extra.firebaseProjectId ||
        process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:
        extra.firebaseStorageBucket ||
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId:
        extra.firebaseMessagingSenderId ||
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: extra.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    }
    : {
      apiKey: 'AIzaSyBnrYh1GpuL6InMp61rOA40cE7qJTYbQN4', // from google-services.json
      projectId:
        extra.firebaseProjectId ||
        process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket:
        extra.firebaseStorageBucket ||
        process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId:
        extra.firebaseMessagingSenderId ||
        process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: extra.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    };

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// ✅ Configure Auth with persistence for native
if (Platform.OS !== 'web') {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} else {
  auth = getAuth(app);
}

export { auth };


// ================= EMAIL / PASSWORD =================

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const signOutUser = () => signOut(auth);

export const resetPassword = (email: string) =>
  sendPasswordResetEmail(auth, email);

// ================= GOOGLE =================

// ✅ Web only
export async function signInWithGooglePopup(): Promise<UserCredential | null> {
  if (Platform.OS !== 'web') {
    throw new Error('Google popup login is web-only');
  }
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  return signInWithPopup(auth, provider);
}

// ✅ Android / iOS — Firebase only (NO hooks)
export async function signInWithGoogleCredential(
  idToken: string
): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken);
  return signInWithCredential(auth, credential);
}

// ================= FACEBOOK =================

export async function signInWithFacebookPopup(): Promise<UserCredential | null> {
  if (Platform.OS !== 'web') {
    throw new Error('Facebook popup login is web-only');
  }
  const provider = new OAuthProvider('facebook.com');
  provider.addScope('email');
  provider.addScope('public_profile');
  return signInWithPopup(auth, provider);
}


export function onAuthStateChanged(
  callback: (user: any) => void
) {
  return firebaseOnAuthStateChanged(auth, callback);
}

// ================= PHONE =================

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (Platform.OS !== 'web') {
    throw new Error('Recaptcha web-only');
  }

  if (recaptchaVerifier) recaptchaVerifier.clear();

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
  });

  return recaptchaVerifier;
}

export async function sendPhoneOTP(
  phoneNumber: string,
  appVerifier: ApplicationVerifier
) {
  confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    appVerifier
  );
  return confirmationResult;
}

export async function verifyPhoneOTP(code: string) {
  if (!confirmationResult) throw new Error('No OTP request');
  const res = await confirmationResult.confirm(code);
  confirmationResult = null;
  return res;
}

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}
