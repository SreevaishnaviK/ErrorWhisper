import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  onSnapshot,
  deleteDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import defaultFirebaseConfig from '../firebase-applet-config.json';
import { ErrorDiagnosis } from './types';

// Active Firebase Configuration: Defaults to bundled firebase-applet-config.json,
// with optional VITE_FIREBASE_* environment variable overrides for custom deployments.
export const activeFirebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  firestoreDatabaseId:
    import.meta.env.VITE_FIREBASE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId,
  oAuthClientId: import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID || defaultFirebaseConfig.oAuthClientId,
  recaptchaSiteKey: defaultFirebaseConfig.recaptchaSiteKey || '',
};

// Initialize Firebase App
const app = initializeApp(activeFirebaseConfig);

// CRITICAL: Must pass activeFirebaseConfig.firestoreDatabaseId to getFirestore
export const db = getFirestore(app, activeFirebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Error Handling protocol mandated by Firebase Integration Skill
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

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on boot as mandated
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes('the client is offline')
    ) {
      console.warn('Firebase connection: client appears offline or connecting.');
    }
  }
}
testConnection();

// Authentication helpers
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Save/update user profile document in Firestore
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(
      userDocRef,
      {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'Anonymous Student',
        photoURL: user.photoURL || '',
        createdAt: new Date().toISOString(),
      },
      { merge: true }
    );

    return user;
  } catch (error) {
    throw error;
  }
}

export async function signOutUser(): Promise<void> {
  await fbSignOut(auth);
}

// Firestore persistence for analyses
export async function saveAnalysisToFirestore(
  userId: string,
  diagnosis: ErrorDiagnosis
): Promise<void> {
  const path = `users/${userId}/analyses/${diagnosis.id}`;
  try {
    const analysisDocRef = doc(db, 'users', userId, 'analyses', diagnosis.id);
    await setDoc(analysisDocRef, {
      id: diagnosis.id,
      userId: userId,
      language: diagnosis.language,
      title: diagnosis.title,
      category: diagnosis.category,
      severity: diagnosis.severity,
      severityReason: diagnosis.severityReason || '',
      explanation: diagnosis.explanation || '',
      likelyCause: diagnosis.likelyCause || '',
      inputCode: diagnosis.inputCode || '',
      inputError: diagnosis.inputError || '',
      correctedCode: diagnosis.correctedCode || '',
      createdAt: new Date(diagnosis.timestamp).toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteAnalysisFromFirestore(
  userId: string,
  analysisId: string
): Promise<void> {
  const path = `users/${userId}/analyses/${analysisId}`;
  try {
    const analysisDocRef = doc(db, 'users', userId, 'analyses', analysisId);
    await deleteDoc(analysisDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToUserAnalyses(
  userId: string,
  onData: (analyses: ErrorDiagnosis[]) => void,
  onError?: (err: any) => void
) {
  const path = `users/${userId}/analyses`;
  const q = query(
    collection(db, 'users', userId, 'analyses'),
    orderBy('createdAt', 'desc'),
    limit(30)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const records: ErrorDiagnosis[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        records.push({
          id: d.id || docSnap.id,
          timestamp: new Date(d.createdAt).getTime() || Date.now(),
          language: d.language || 'python',
          inputCode: d.inputCode || '',
          inputError: d.inputError || '',
          inputContext: '',
          title: d.title || 'Analysis',
          category: d.category || 'Unknown',
          severity: d.severity || 'Medium',
          severityReason: d.severityReason || '',
          explanation: d.explanation || '',
          technicalDetail: '',
          likelyCause: d.likelyCause || '',
          evidence: [],
          location: { line: null, column: null, note: '' },
          steps: [],
          correctedCode: d.correctedCode || null,
          changes: [],
          confidenceNote: '',
          preventionTip: '',
          practice: {
            question: 'What concept caused this error?',
            answer: d.likelyCause || 'Review the error cause.',
            explanation: d.explanation || '',
          },
        });
      });
      onData(records);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
