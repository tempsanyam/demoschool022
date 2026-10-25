import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const testCombinations = [
  // Admin
  { id: 'Admin 1', email: 'sanyam.admin@malguwa.edu.in', passes: ['SanyamAdmin@Malguwa2026!'] },
  { id: 'Admin 2', email: 'admin.malguwa@mp.gov.in', passes: ['Admin@Malguwa#2026', 'SanyamAdmin@Malguwa2026!', 'Malguwa@2026', 'Admin@2026'] },
  { id: 'Admin 3', email: 'sanyamjain88@malguwa.edu.in', passes: ['SanyamAdmin@Malguwa2026!', 'Admin@Malguwa#2026', 'Sanyam@88'] },
  // CAC-1
  { id: 'CAC-1', email: 'sanjayjain1979@malguwa.edu.in', passes: ['Cac@Malguwa#2026', 'CacSanjay@Malguwa2026!', 'Sanjay@1979', '7000382532'] },
  { id: 'CAC-1 alt', email: 'cac.malguwa@mp.gov.in', passes: ['Cac@Malguwa#2026', 'CacSanjay@Malguwa2026!', 'Sanjay@1979', '7000382532'] },
  // CAC-2
  { id: 'CAC-2', email: 'sanmatijain99@malguwa.edu.in', passes: ['Cac@Malguwa#2026', 'CacSanmati@Malguwa2026!', 'Sanmati@99', '9977323573'] },
  { id: 'CAC-2 alt', email: 'cac.sanmati@mp.gov.in', passes: ['Cac@Malguwa#2026', 'CacSanmati@Malguwa2026!', 'Sanmati@99', '9977323573'] },
];

async function testAll() {
  for (const t of testCombinations) {
    for (const p of t.passes) {
      try {
        const res = await signInWithEmailAndPassword(auth, t.email, p);
        const udoc = await getDoc(doc(db, 'users', res.user.uid));
        console.log(`SUCCESS: [${t.id}] Email: ${t.email} -> UID: ${res.user.uid}, Firestore Role: ${udoc.data()?.role}`);
        break;
      } catch (err: any) {
        // continue
      }
    }
  }
  process.exit(0);
}

testAll();
