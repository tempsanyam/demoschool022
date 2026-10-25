import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function verifyFinalCloudState() {
  console.log('Authenticating as Admin to verify post-cleanup Firestore state...');
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('Admin authenticated. UID:', auth.currentUser?.uid);

  const collections = [
    'schools',
    'studentMasters',
    'staffMasters',
    'facilities',
    'documents',
    'academicSessions',
    'examCycles',
  ];

  const report: Record<string, number> = {};
  for (const c of collections) {
    const snap = await getDocs(collection(db, c));
    report[c] = snap.size;
    console.log(`[VERIFIED LIVE FIRESTORE] ${c}: ${snap.size} records`);
  }

  const schoolsSnap = await getDocs(collection(db, 'schools'));
  const schoolNames = schoolsSnap.docs.map(d => d.data().name);
  console.log('\nSample School Names in Firestore:', schoolNames.slice(0, 5));

  fs.writeFileSync('scripts/final_verified_cloud_state.json', JSON.stringify(report, null, 2));
}

verifyFinalCloudState().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
