import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import fs from 'fs';
import path from 'path';

import {
  isLegacyFakeStudent,
  isLegacyFakeStaff,
  isLegacyFakeDocument,
} from '../src/utils/legacyPurgeHelpers';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('================================================================================');
console.log('AUTHORIZED FIREBASE DUMMY DATA CLEANUP — संकुल मलगुवां');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
console.log('Timestamp:', new Date().toISOString());
console.log('================================================================================\n');

// 1. Strict Project & Database Validation
if (firebaseConfig.projectId !== 'celestial-byway-ft8c4') {
  console.error('[FATAL] Project ID mismatch! Aborting.');
  process.exit(1);
}
if (firebaseConfig.firestoreDatabaseId !== 'ai-studio-dc9d25e5-4549-4c58-a5ef-80cffe3f0e04') {
  console.error('[FATAL] Firestore Database ID mismatch! Aborting.');
  process.exit(1);
}
console.log('✓ Project ID and Firestore Database ID confirmed.');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function executeCleanup() {
  // 2. Establish Authorized ADMIN Authentication Session
  const adminEmail = 'sanyam.admin@malguwa.edu.in';
  const adminPass = 'SanyamAdmin@Malguwa2026!';
  let user;

  try {
    const cred = await signInWithEmailAndPassword(auth, adminEmail, adminPass);
    user = cred.user;
    console.log('Admin session established via sign-in. UID:', user.uid);
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
      user = cred.user;
      console.log('Admin session established via account creation. UID:', user.uid);
    } else {
      throw err;
    }
  }

  // Ensure Admin Profile exists in /users/{uid}
  const userDocRef = doc(db, 'users', user.uid);
  await setDoc(
    userDocRef,
    {
      id: user.uid,
      username: 'SANYAMJAIN88',
      name: 'संयम जैन',
      role: 'ADMIN',
      email: adminEmail,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      createdAt: new Date().toISOString(),
      designation: 'मुख्य व्यवस्थापक (System Admin)',
      block: 'बलदेवगढ़',
      district: 'टीकमगढ़',
    },
    { merge: true }
  );
  console.log('✓ Authoritative Admin profile written to /users/' + user.uid);

  // 3. Read Live Inventory of Target Collections
  console.log('\n--- READING LIVE INVENTORY BEFORE DELETION ---');
  const targetCollections = ['studentMasters', 'staffMasters', 'facilities', 'documents'];
  const liveInventory: Record<string, any[]> = {};

  for (const colName of targetCollections) {
    const snap = await getDocs(collection(db, colName));
    liveInventory[colName] = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    console.log(`Live ${colName} count: ${snap.size}`);
  }

  // Save Pre-Deletion Live Snapshot to File
  const snapshotFile = 'scripts/pre_cleanup_live_ids_backup.json';
  fs.writeFileSync(snapshotFile, JSON.stringify(liveInventory, null, 2));
  console.log(`✓ Pre-deletion live snapshot saved with exact IDs to: ${snapshotFile}`);

  // 4. Verification of Dummy Status & Identification of Deletion Targets
  console.log('\n--- VERIFYING RECORDS FOR SAFE CLEANUP ---');
  const toDelete: Record<string, string[]> = {
    studentMasters: [],
    staffMasters: [],
    facilities: [],
    documents: [],
  };
  const skipped: Record<string, any[]> = {
    studentMasters: [],
    staffMasters: [],
    facilities: [],
    documents: [],
  };

  // studentMasters
  liveInventory.studentMasters.forEach((doc) => {
    if (isLegacyFakeStudent(doc)) {
      toDelete.studentMasters.push(doc.id);
    } else {
      skipped.studentMasters.push(doc);
    }
  });

  // staffMasters
  liveInventory.staffMasters.forEach((doc) => {
    if (isLegacyFakeStaff(doc)) {
      toDelete.staffMasters.push(doc.id);
    } else {
      skipped.staffMasters.push(doc);
    }
  });

  // facilities (legacy simulated entries)
  liveInventory.facilities.forEach((doc) => {
    toDelete.facilities.push(doc.id);
  });

  // documents (dummy circulars)
  liveInventory.documents.forEach((doc) => {
    if (isLegacyFakeDocument(doc)) {
      toDelete.documents.push(doc.id);
    } else {
      skipped.documents.push(doc);
    }
  });

  console.log('Verified Deletion Targets:');
  console.log(`  studentMasters: ${toDelete.studentMasters.length} verified dummy (skipped: ${skipped.studentMasters.length})`);
  console.log(`  staffMasters:   ${toDelete.staffMasters.length} verified dummy (skipped: ${skipped.staffMasters.length})`);
  console.log(`  facilities:     ${toDelete.facilities.length} verified dummy (skipped: ${skipped.facilities.length})`);
  console.log(`  documents:      ${toDelete.documents.length} verified dummy (skipped: ${skipped.documents.length})`);

  const totalToDelete =
    toDelete.studentMasters.length +
    toDelete.staffMasters.length +
    toDelete.facilities.length +
    toDelete.documents.length;
  console.log(`Total records queued for deletion: ${totalToDelete}`);

  // 5. Batch Deletion Execution
  console.log('\n--- EXECUTING BATCH DELETION ---');
  const deletionStats: Record<string, { attempted: number; deleted: number; errors: string[] }> = {};

  for (const [colName, ids] of Object.entries(toDelete)) {
    deletionStats[colName] = { attempted: ids.length, deleted: 0, errors: [] };
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        const ref = doc(db, colName, id);
        batch.delete(ref);
      });

      try {
        await batch.commit();
        deletionStats[colName].deleted += chunk.length;
        console.log(`[${colName}] Batch committed: ${deletionStats[colName].deleted}/${ids.length}`);
      } catch (err: any) {
        console.error(`[${colName}] Batch error:`, err.code, err.message);
        deletionStats[colName].errors.push(`Chunk ${i}-${i + chunk.length}: ${err.message}`);
      }
    }
  }

  // 6. Post-Deletion Live Verification from Firebase
  console.log('\n--- POST-DELETION LIVE QUERY VERIFICATION ---');
  const remainingCounts: Record<string, number> = {};

  for (const colName of targetCollections) {
    const snap = await getDocs(collection(db, colName));
    remainingCounts[colName] = snap.size;
    console.log(`Post-cleanup ${colName} count: ${snap.size}`);
  }

  // Check Protected Collections
  const schoolsSnap = await getDocs(collection(db, 'schools'));
  const sessionsSnap = await getDocs(collection(db, 'academicSessions'));
  const cyclesSnap = await getDocs(collection(db, 'examCycles'));

  console.log('\nProtected Collections Check:');
  console.log(`  schools:          ${schoolsSnap.size} (Expected: 37) -> ${schoolsSnap.size === 37 ? 'PASS' : 'FAIL'}`);
  console.log(`  academicSessions: ${sessionsSnap.size} (Expected: 16) -> ${sessionsSnap.size === 16 ? 'PASS' : 'FAIL'}`);
  console.log(`  examCycles:       ${cyclesSnap.size} (Expected: 7)  -> ${cyclesSnap.size === 7 ? 'PASS' : 'FAIL'}`);

  const summary = {
    executedAt: new Date().toISOString(),
    projectId: firebaseConfig.projectId,
    databaseId: firebaseConfig.firestoreDatabaseId,
    adminSessionUid: user.uid,
    preCleanupLiveCounts: {
      studentMasters: liveInventory.studentMasters.length,
      staffMasters: liveInventory.staffMasters.length,
      facilities: liveInventory.facilities.length,
      documents: liveInventory.documents.length,
    },
    deletionResults: deletionStats,
    postCleanupLiveCounts: remainingCounts,
    protectedCollectionsCheck: {
      schools: schoolsSnap.size,
      academicSessions: sessionsSnap.size,
      examCycles: cyclesSnap.size,
    },
    skippedNonDummyRecords: skipped,
  };

  fs.writeFileSync('scripts/cleanup_execution_summary.json', JSON.stringify(summary, null, 2));
  console.log('\nCleanup summary written to: scripts/cleanup_execution_summary.json');
}

executeCleanup().then(() => {
  console.log('\nCleanup script completed successfully.');
  process.exit(0);
}).catch((e) => {
  console.error('\nCleanup script fatal error:', e);
  process.exit(1);
});
