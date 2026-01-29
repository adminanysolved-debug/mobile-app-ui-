import admin from 'firebase-admin';

let initialized = false;

export function initializeFirebaseAdmin() {
  if (initialized) {
    return admin;
  }

  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccountKey) {
  console.warn('Firebase Admin disabled (no service account key)');
  return admin;
}


  try {
    const serviceAccount = JSON.parse(serviceAccountKey);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    
    initialized = true;
    console.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
    throw error;
  }

  return admin;
}

export async function verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
  if (!initialized) {
    initializeFirebaseAdmin();
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Error verifying ID token:', error);
    throw error;
  }
}

export async function getFirebaseUser(uid: string): Promise<admin.auth.UserRecord | null> {
  if (!initialized) {
    initializeFirebaseAdmin();
  }
  
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord;
  } catch (error) {
    console.error('Error getting Firebase user:', error);
    return null;
  }
}

export { admin };
