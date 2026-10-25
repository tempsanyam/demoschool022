import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  query,
  limit,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const collectionsToProbe = [
  'schools',
  'studentMasters',
  'studentAcademicRecords',
  'staffMasters',
  'staffPostings',
  'attendance',
  'mdmRecords',
  'rasoiya',
  'shgs',
  'facilities',
  'literacyRegisters',
  'illiteratePersons',
  'aksharSathis',
  'examCycles',
  'literacyExamResults',
  'supportingInstitutions',
  'governmentWork',
  'complaints',
  'notifications',
  'documents',
  'academicSessions',
  'users',
  'systemSettings',
  'auditLogs',
  'preAuthSecurityEvents',
];

async function runAuthenticatedProbe() {
  console.log('Authenticating as test user...');
  await signInWithEmailAndPassword(auth, 'test.verifier.1792829584543@malguwa.edu.in', 'VerifyTest@2026#');
  console.log('Authenticated! UID:', auth.currentUser?.uid);

  const results: Record<string, any> = {};

  for (const colName of collectionsToProbe) {
    try {
      const snap = await getDocs(collection(db, colName));
      results[colName] = {
        status: 'SUCCESS',
        count: snap.size,
        docs: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
      console.log(`[${colName}] SUCCESS - Actual Firestore count: ${snap.size}`);
    } catch (err: any) {
      results[colName] = {
        status: 'ERROR',
        code: err.code || 'unknown',
        message: err.message || String(err),
      };
      console.log(`[${colName}] ACCESS FAILED: ${err.code || err.message}`);
    }
  }

  fs.writeFileSync('scripts/authenticated_probe_results.json', JSON.stringify(results, null, 2));
}

runAuthenticatedProbe().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
