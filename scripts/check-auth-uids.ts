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

async function run() {
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  const snap = await getDocs(collection(db, 'users'));
  const authUids = snap.docs.filter((d) => d.id.length >= 20 && !d.id.startsWith('USR-'));
  console.log(`Found ${authUids.length} Auth UID docs in Firestore:`);
  for (const d of authUids) {
    const data = d.data();
    console.log(JSON.stringify({
      uid: d.id,
      role: data.role,
      email: data.email,
      username: data.username,
      schoolUdise: data.schoolUdise || data.assignedSchoolUdise,
    }));
  }
  process.exit(0);
}

run().catch(console.error);
