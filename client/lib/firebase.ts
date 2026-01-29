import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
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
  PhoneAuthProvider,
  Auth,
  UserCredential,
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth';
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

const firebaseConfig = {
  apiKey: extra.firebaseApiKey || process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: extra.firebaseAuthDomain || process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: extra.firebaseProjectId || process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: extra.firebaseStorageBucket || process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: extra.firebaseMessagingSenderId || process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: extra.firebaseAppId || process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);

export { auth };

export async function signInWithEmail(email: string, password: string): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(email: string, password: string): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  return signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(auth, email);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (user) {
    return user.getIdToken();
  }
  return null;
}

export async function signInWithGooglePopup(): Promise<UserCredential | null> {
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    console.error('Google sign-in error:', error?.code, error?.message);
    throw error;
  }
}

export async function signInWithFacebookPopup(): Promise<UserCredential | null> {
  try {
    const provider = new OAuthProvider('facebook.com');
    provider.addScope('email');
    provider.addScope('public_profile');
    const result = await signInWithPopup(auth, provider);
    return result;
  } catch (error: any) {
    console.error('Facebook sign-in error:', error);
    throw error;
  }
}

export async function signInWithGoogleCredential(idToken: string, accessToken?: string): Promise<UserCredential> {
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  return signInWithCredential(auth, credential);
}

export async function signInWithFacebookCredential(accessToken: string): Promise<UserCredential> {
  const provider = new OAuthProvider('facebook.com');
  const credential = provider.credential({ accessToken });
  return signInWithCredential(auth, credential);
}

export function onAuthStateChanged(callback: (user: any) => void) {
  return auth.onAuthStateChanged(callback);
}

export function getCurrentUser() {
  return auth.currentUser;
}

let confirmationResult: ConfirmationResult | null = null;
let recaptchaVerifier: RecaptchaVerifier | null = null;

export function setupRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }
  
  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {},
    'expired-callback': () => {}
  });
  
  return recaptchaVerifier;
}

export async function sendPhoneOTP(phoneNumber: string, appVerifier: ApplicationVerifier): Promise<ConfirmationResult> {
  const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  confirmationResult = result;
  return result;
}

export async function verifyPhoneOTP(code: string): Promise<UserCredential | null> {
  if (!confirmationResult) {
    throw new Error('No confirmation result. Please request OTP first.');
  }
  
  const result = await confirmationResult.confirm(code);
  confirmationResult = null;
  return result;
}

export function getRecaptchaVerifier(): RecaptchaVerifier | null {
  return recaptchaVerifier;
}

export function clearRecaptcha() {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
  confirmationResult = null;
}
