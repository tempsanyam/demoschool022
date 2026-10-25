import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testAuth() {
  console.log('Testing Firebase Auth with admin.malguwa@mp.gov.in ...');
  try {
    await signInWithEmailAndPassword(auth, 'admin.malguwa@mp.gov.in', 'Admin@Malguwa#2026');
    console.log('SignIn success! UID:', auth.currentUser?.uid);
  } catch (err: any) {
    console.log('SignIn error code:', err.code, 'message:', err.message);
  }
}

testAuth().then(() => process.exit(0));
