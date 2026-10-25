import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  deleteDoc,
  getCountFromServer,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const TARGET_COLS = [
  'notifications',
  'literacyRegisters',
  'illiteratePersons',
  'aksharSathis',
  'literacyExamResults',
  'supportingInstitutions',
];

async function purgeRemaining() {
  console.log('Authenticating as Admin to purge remaining dummy collections...');
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('✅ Admin authenticated. UID:', auth.currentUser?.uid);

  for (const col of TARGET_COLS) {
    const snap = await getDocs(collection(db, col));
    console.log(`Purging [${col}] (${snap.size} docs)...`);
    for (const d of snap.docs) {
      await deleteDoc(doc(db, col, d.id));
      console.log(`   Deleted ${col}/${d.id}`);
    }
    const afterCount = (await getCountFromServer(collection(db, col))).data().count;
    console.log(`✅ [${col}] count after purge: ${afterCount}`);
  }
  process.exit(0);
}

purgeRemaining().catch((err) => {
  console.error('Purge error:', err);
  process.exit(1);
});
