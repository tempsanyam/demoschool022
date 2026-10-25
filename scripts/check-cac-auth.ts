import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function checkCAC() {
  const cacEmail = 'sanjayjain1979@malguwa.edu.in';
  const cacPass = 'Cac@Malguwa#2026';
  try {
    const cred = await createUserWithEmailAndPassword(auth, cacEmail, cacPass);
    console.log('Created CAC account successfully! UID:', cred.user.uid);
    // write profile
    await setDoc(doc(db, 'users', cred.user.uid), {
      id: cred.user.uid,
      username: 'Sanjayjain1979',
      name: 'संजय कुमार जैन',
      role: 'CAC',
      email: cacEmail,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      createdAt: new Date().toISOString(),
    });
    console.log('CAC profile written to Firestore!');
  } catch (err: any) {
    console.log('CAC create/auth result:', err.code, err.message);
  }
}

checkCAC().then(() => process.exit(0));
