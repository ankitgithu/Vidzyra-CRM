import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import localConfig from '../firebase-applet-config.json';

// Support Vercel env vars or fallback to firebase-applet-config.json
const env = (typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {}) as Record<string, string | undefined>;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || localConfig.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || localConfig.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || localConfig.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || localConfig.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || localConfig.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || localConfig.appId,
};

const firestoreDatabaseId =
  env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  localConfig.firestoreDatabaseId ||
  '(default)';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

let firestoreDb;
try {
  firestoreDb = initializeFirestore(
    app,
    {
      ignoreUndefinedProperties: true,
      experimentalAutoDetectLongPolling: true,
    },
    firestoreDatabaseId
  );
} catch {
  firestoreDb = getFirestore(app, firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  // If the error is a transient connectivity glitch, log an informative warning instead of treating it as fatal
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('unavailable') || msg.includes('offline') || msg.includes('network')) {
    console.warn(`[Firebase] Firestore transient network status (${operationType} at ${path}):`, msg);
  }

  const errInfo: FirestoreErrorInfo = {
    error: msg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  return errInfo;
}

export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('[Firebase] Connected to Firestore database:', firestoreDatabaseId);
    return true;
  } catch (error) {
    // getDocFromServer throws code=unavailable if the initial socket handshake is still negotiating.
    // This is expected and normal during initial page load, and Firestore continues to connect seamlessly.
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('unavailable') || msg.includes('offline')) {
      console.log('[Firebase] Firestore is establishing backend connection...');
    } else {
      console.warn('[Firebase] Connection status note:', msg);
    }
    return false;
  }
}

// Initial connection test with slight deferral to allow network socket to warm up
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 1000);
} else {
  testConnection().catch(() => {});
}
