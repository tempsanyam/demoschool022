import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testCreate() {
  const testEmail = `test.verifier.${Date.now()}@malguwa.edu.in`;
  const testPass = 'VerifyTest@2026#';
  console.log('Testing user creation:', testEmail);
  try {
    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPass);
    console.log('User created successfully! UID:', cred.user.uid);
  } catch (err: any) {
    console.log('Create error code:', err.code, 'message:', err.message);
  }
}

testCreate().then(() => process.exit(0));
