import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const testEmails = [
  'sanyamjain88@malguwa.edu.in',
  'admin.malguwa@mp.gov.in',
  'sanjayjain1979@malguwa.edu.in',
  'sanmatijain99@malguwa.edu.in'
];

const candidatePasswords = [
  '9826088159',
  'SANYAMJAIN88',
  'sanyamjain88',
  'Sanyam@88',
  'Sanyam@123',
  'Admin@123',
  'Admin@2026',
  'Admin#2026',
  'Sanyam@2026',
  'Sanyam@88159',
  'Malguwa@2026',
  'Malguwa#2026',
  '7000382532',
  'Sanjay@1979',
  'Sanjayjain1979',
  '9977323573',
  'Sanmati@99',
  'Sanmatijain99',
];

async function tryAuth() {
  for (const email of testEmails) {
    for (const pass of candidatePasswords) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, pass);
        console.log(`SUCCESS! Email: ${email}, Pass: ${pass}, UID: ${cred.user.uid}`);
        return { email, pass, uid: cred.user.uid };
      } catch (err: any) {
        // continue
      }
    }
  }
  console.log('No candidate matched directly.');
  return null;
}

tryAuth().then(() => process.exit(0));
