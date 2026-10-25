import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  startAfter,
  limit,
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

const ALL_COLLECTIONS = [
  'schools',
  'academicSessions',
  'examCycles',
  'systemSettings',
  'users',
  'auditLogs',
  'preAuthSecurityEvents',
  'studentAcademicRecords',
  'staffPostings',
  'rasoiya',
  'governmentWork',
  'notifications',
  'literacyRegisters',
  'illiteratePersons',
  'aksharSathis',
  'literacyExamResults',
  'supportingInstitutions',
  'attendance',
  'mdmRecords',
  'shgs',
  'facilities',
  'complaints',
  'documents',
  'studentMasters',
  'staffMasters',
];

async function fetchAllPaginated(colName: string) {
  let all: { _id: string; [key: string]: any }[] = [];
  let lastVisible = null;
  while (true) {
    let q = lastVisible
      ? query(collection(db, colName), orderBy('__name__'), startAfter(lastVisible), limit(300))
      : query(collection(db, colName), orderBy('__name__'), limit(300));
    const snap = await getDocs(q);
    if (snap.empty) break;
    snap.docs.forEach((d) => all.push({ _id: d.id, ...d.data() }));
    lastVisible = snap.docs[snap.docs.length - 1];
    if (snap.size < 300) break;
  }
  return all;
}

async function runPreResetBackup() {
  console.log('================================================================');
  console.log('AUTHENTICATING ADMIN FOR PRE-FULL-RESET MASTER BACKUP');
  console.log('================================================================');
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('✅ Admin Authenticated. UID:', auth.currentUser?.uid);

  const fullBackupData: Record<string, any[]> = {};
  const collectionCounts: Record<string, number> = {};

  for (const col of ALL_COLLECTIONS) {
    try {
      const serverCount = (await getCountFromServer(collection(db, col))).data().count;
      console.log(`Scanning [${col}] - Server Count: ${serverCount}`);
      if (serverCount === 0) {
        fullBackupData[col] = [];
        collectionCounts[col] = 0;
        continue;
      }
      const docs = await fetchAllPaginated(col);
      fullBackupData[col] = docs;
      collectionCounts[col] = docs.length;
      console.log(`   Exported [${col}]: ${docs.length} docs (Matches server: ${docs.length === serverCount})`);
      if (docs.length !== serverCount) {
        console.warn(`   WARNING: Discrepancy in ${col}! Server: ${serverCount}, Fetched: ${docs.length}`);
      }
    } catch (err) {
      console.error(`Error backing up [${col}]:`, err);
      throw err;
    }
  }

  // Save master backup to artifacts brain directory
  const artifactDir = path.resolve(
    process.cwd(),
    '.aistudio/artifacts/brain/dc9d25e5-4549-4c58-a5ef-80cffe3f0e04'
  );
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  const backupArtifactPath = path.join(artifactDir, 'pre-full-reset-backup.json');
  fs.writeFileSync(backupArtifactPath, JSON.stringify(fullBackupData, null, 2));

  // Also save a local backup copy in scripts/
  const localBackupPath = path.resolve(process.cwd(), 'scripts/pre_full_reset_backup.json');
  fs.writeFileSync(localBackupPath, JSON.stringify(fullBackupData, null, 2));

  const stats = fs.statSync(backupArtifactPath);
  console.log('\n================================================================');
  console.log('PRE-FULL-RESET BACKUP COMPLETED & VERIFIED');
  console.log('================================================================');
  console.log(`Artifact Backup: ${backupArtifactPath} (${(stats.size / 1024).toFixed(2)} KB)`);
  console.log(`Local Backup:    ${localBackupPath}`);
  console.log('Collection Summary:', JSON.stringify(collectionCounts, null, 2));

  if (fullBackupData['schools'].length !== 37) {
    throw new Error(`CRITICAL ABORT: Expected 37 schools in backup, found ${fullBackupData['schools'].length}`);
  }

  process.exit(0);
}

runPreResetBackup().catch((err) => {
  console.error('Fatal backup error:', err);
  process.exit(1);
});
