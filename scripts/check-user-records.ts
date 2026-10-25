import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function run() {
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  const d1 = await getDoc(doc(db, 'users', 'USR-SCH-23080100303'));
  const d2 = await getDoc(doc(db, 'users', '23080100303'));
  console.log('USR-SCH exists:', d1.exists(), d1.data());
  console.log('UDISE exists:', d2.exists(), d2.data());
  process.exit(0);
}

run().catch(console.error);
