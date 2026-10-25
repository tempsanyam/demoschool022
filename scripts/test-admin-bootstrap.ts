import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function testAdminBootstrap() {
  const adminEmail = 'sanyamjain88@malguwa.edu.in';
  const adminPass = 'Sanyam@Malguwa#2026';

  let user;
  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    user = cred.user;
    console.log('Admin signed in successfully! UID:', user.uid);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      console.log('Admin account not found or invalid credential, creating account...');
      try {
        const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
        user = cred.user;
        console.log('Admin user created successfully! UID:', user.uid);
      } catch (createErr: any) {
        console.log('Create error:', createErr.code, createErr.message);
      }
    } else {
      console.log('SignIn error:', err.code, err.message);
    }
  }

  if (user) {
    // Check if /users/{uid} exists
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const snap = await getDoc(userDocRef);
      if (!snap.exists()) {
        console.log('Creating /users/' + user.uid + ' profile...');
        await setDoc(userDocRef, {
          id: user.uid,
          username: 'SANYAMJAIN88',
          name: 'संयम जैन',
          role: 'ADMIN',
          email: adminEmail,
          status: 'ACTIVE',
          approvalStatus: 'APPROVED',
          createdAt: new Date().toISOString(),
        });
        console.log('Admin profile created in Firestore!');
      } else {
        console.log('Admin profile already exists:', snap.data());
      }
    } catch (e: any) {
      console.log('Profile write error:', e.code, e.message);
    }
  }
}

testAdminBootstrap().then(() => process.exit(0)).catch((e) => {
  console.error(e);
  process.exit(1);
});
