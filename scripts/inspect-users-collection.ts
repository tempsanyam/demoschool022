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

async function inspectUsers() {
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  const snap = await getDocs(collection(db, 'users'));
  console.log(`Total users docs: ${snap.size}`);
  
  const byCategory: Record<string, any[]> = {
    authUids: [],
    udiseKeys: [],
    usrSch: [],
    usrAdminCac: [],
    usernameKeys: [],
    other: []
  };

  snap.docs.forEach(docSnap => {
    const id = docSnap.id;
    const d = docSnap.data();
    if (/^[0-9]{11}$/.test(id)) {
      byCategory.udiseKeys.push({ id, role: d.role, name: d.name, email: d.email, udise: d.schoolUdise || d.udise });
    } else if (id.startsWith('USR-SCH-')) {
      byCategory.usrSch.push({ id, role: d.role, name: d.name, username: d.username, udise: d.schoolUdise || d.udise });
    } else if (id.startsWith('USR-ADMIN') || id.startsWith('USR-CAC')) {
      byCategory.usrAdminCac.push({ id, role: d.role, name: d.name, username: d.username });
    } else if (['sanyamjain88', 'sanjayjain1979', 'sanmatijain99'].includes(id)) {
      byCategory.usernameKeys.push({ id, role: d.role, name: d.name, username: d.username });
    } else if (id.length >= 20) {
      byCategory.authUids.push({ id, role: d.role, name: d.name, email: d.email, username: d.username, udise: d.schoolUdise || d.udise });
    } else {
      byCategory.other.push({ id, ...d });
    }
  });

  console.log('Summary:');
  console.log('Auth UIDs:', byCategory.authUids.length);
  console.log('UDISE Keys (11 digits):', byCategory.udiseKeys.length);
  console.log('USR-SCH- docs:', byCategory.usrSch.length);
  console.log('USR-ADMIN / USR-CAC docs:', byCategory.usrAdminCac.length);
  console.log('Username keys:', byCategory.usernameKeys.length);
  console.log('Other docs:', byCategory.other.length);

  fs.writeFileSync('scripts/users_inspection.json', JSON.stringify(byCategory, null, 2));
}

inspectUsers().catch(console.error);
