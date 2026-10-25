import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  writeBatch,
  query,
  limit,
  startAfter,
  orderBy,
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

const COLLECTIONS_TO_RESET = [
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
];

const PROTECTED_COLLECTIONS = [
  'schools',
  'academicSessions',
  'examCycles',
  'users',
  'auditLogs',
  'preAuthSecurityEvents',
];

async function fetchAllDocIds(colName: string): Promise<{ id: string; meta: any }[]> {
  const all: { id: string; meta: any }[] = [];
  let lastVisible = null;
  while (true) {
    let q = lastVisible
      ? query(collection(db, colName), orderBy('__name__'), startAfter(lastVisible), limit(300))
      : query(collection(db, colName), orderBy('__name__'), limit(300));
    const snap = await getDocs(q);
    if (snap.empty) break;
    snap.docs.forEach((d) => {
      const data = d.data();
      all.push({
        id: d.id,
        meta: {
          schoolUdise: data.schoolUdise || data.udise || null,
          sessionId: data.sessionId || null,
          title: data.title || data.name || data.workName || null,
        },
      });
    });
    lastVisible = snap.docs[snap.docs.length - 1];
    if (snap.size < 300) break;
  }
  return all;
}

async function executeBatchDeletions(colName: string, docIds: string[]) {
  const BATCH_SIZE = 100;
  let deletedCount = 0;
  for (let i = 0; i < docIds.length; i += BATCH_SIZE) {
    const chunk = docIds.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const id of chunk) {
      batch.delete(doc(db, colName, id));
    }
    await batch.commit();
    deletedCount += chunk.length;
    console.log(`   [${colName}] Deleted batch ${Math.floor(i / BATCH_SIZE) + 1} (${deletedCount}/${docIds.length})`);
  }
  console.log(`✅ [${colName}] All ${deletedCount} records deleted.`);
}

async function runFullProductionReset() {
  console.log('================================================================');
  console.log('STEP 1: PRE-RESET BACKUP & AUTHORIZATION VERIFICATION');
  console.log('================================================================');

  const artifactBackupPath = path.resolve(
    process.cwd(),
    '.aistudio/artifacts/brain/dc9d25e5-4549-4c58-a5ef-80cffe3f0e04/pre-full-reset-backup.json'
  );
  const localBackupPath = path.resolve(process.cwd(), 'scripts/pre_full_reset_backup.json');

  if (!fs.existsSync(artifactBackupPath)) {
    throw new Error(`CRITICAL ABORT: Master pre-reset backup missing at ${artifactBackupPath}`);
  }
  if (!fs.existsSync(localBackupPath)) {
    throw new Error(`CRITICAL ABORT: Local pre-reset backup missing at ${localBackupPath}`);
  }

  const backupStats = fs.statSync(artifactBackupPath);
  console.log(`✅ Master Backup verified: ${artifactBackupPath} (${(backupStats.size / 1024).toFixed(2)} KB)`);

  console.log('\nAuthenticating as Admin (sanyam.admin@malguwa.edu.in)...');
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('✅ Admin Authenticated. UID:', auth.currentUser?.uid);

  // Verify protected schools count before doing anything
  const schoolsCountPre = (await getCountFromServer(collection(db, 'schools'))).data().count;
  if (schoolsCountPre !== 37) {
    throw new Error(`CRITICAL ABORT: Expected 37 schools in Firestore, but count is ${schoolsCountPre}!`);
  }
  console.log(`✅ Protected 37 Cluster Schools verified intact (Count: ${schoolsCountPre})`);

  console.log('\n================================================================');
  console.log('STEP 2: SCANNING ALL COLLECTIONS FOR DELETION MANIFEST');
  console.log('================================================================');

  const deletionManifest: Record<string, any> = {
    timestamp: new Date().toISOString(),
    adminUid: auth.currentUser?.uid,
    adminEmail: auth.currentUser?.email,
    targets: {},
    totalRecordsToDelete: 0,
    records: {},
  };

  let totalDocsToDelete = 0;

  for (const col of COLLECTIONS_TO_RESET) {
    const docs = await fetchAllDocIds(col);
    deletionManifest.targets[col] = docs.length;
    deletionManifest.records[col] = docs;
    totalDocsToDelete += docs.length;
    console.log(`Targeting [${col}]: ${docs.length} documents`);
  }

  deletionManifest.totalRecordsToDelete = totalDocsToDelete;
  fs.writeFileSync('scripts/full_reset_deletion_manifest.json', JSON.stringify(deletionManifest, null, 2));
  console.log(`\n✅ Deletion manifest generated: scripts/full_reset_deletion_manifest.json`);
  console.log(`   TOTAL RECORDS TO BE PERMANENTLY PURGED: ${totalDocsToDelete}`);

  console.log('\n================================================================');
  console.log('STEP 3: EXECUTING BATCH DELETIONS ACROSS ALL MODULES');
  console.log('================================================================');

  for (const col of COLLECTIONS_TO_RESET) {
    const docIds = deletionManifest.records[col].map((x: any) => x.id);
    if (docIds.length === 0) {
      console.log(`[${col}] Already 0 records. Skipping.`);
      continue;
    }
    console.log(`\nPurging ${docIds.length} records from [${col}]...`);
    await executeBatchDeletions(col, docIds);
  }

  console.log('\n================================================================');
  console.log('STEP 4: POST-RESET COMPREHENSIVE LIVE AUDIT & VERIFICATION');
  console.log('================================================================');

  const finalAuditResults: Record<string, { count: number; status: string; expected: number }> = {};

  // Check reset collections
  for (const col of COLLECTIONS_TO_RESET) {
    const count = (await getCountFromServer(collection(db, col))).data().count;
    finalAuditResults[col] = {
      count,
      expected: 0,
      status: count === 0 ? 'CLEAN_ZERO (PASSED)' : 'FAILED_NOT_ZERO',
    };
  }

  // Check already clean collections
  const alreadyCleanCols = ['attendance', 'mdmRecords', 'shgs', 'facilities', 'complaints', 'documents', 'studentMasters', 'staffMasters'];
  for (const col of alreadyCleanCols) {
    const count = (await getCountFromServer(collection(db, col))).data().count;
    finalAuditResults[col] = {
      count,
      expected: 0,
      status: count === 0 ? 'CLEAN_ZERO (PASSED)' : 'FAILED_NOT_ZERO',
    };
  }

  // Check protected collections
  for (const col of PROTECTED_COLLECTIONS) {
    const count = (await getCountFromServer(collection(db, col))).data().count;
    let expected = 0;
    if (col === 'schools') expected = 37;
    else if (col === 'academicSessions') expected = 16;
    else if (col === 'examCycles') expected = 7;
    else if (col === 'users') expected = 88;
    else if (col === 'auditLogs') expected = 14;
    else if (col === 'preAuthSecurityEvents') expected = 405;

    finalAuditResults[col] = {
      count,
      expected,
      status: count >= expected ? 'PROTECTED_INTACT (PASSED)' : 'MISMATCH_WARNING',
    };
  }

  console.log('FINAL AUDIT RESULTS:');
  console.table(finalAuditResults);

  const allPassed = Object.entries(finalAuditResults).every(([col, res]) => {
    if (COLLECTIONS_TO_RESET.includes(col) || alreadyCleanCols.includes(col)) {
      return res.count === 0;
    }
    return res.count >= res.expected;
  });

  const executionSummary = {
    timestamp: new Date().toISOString(),
    status: allPassed ? 'SUCCESS' : 'FAILURE',
    adminUid: auth.currentUser?.uid,
    adminEmail: auth.currentUser?.email,
    purgedSummary: deletionManifest.targets,
    totalPurged: totalDocsToDelete,
    finalAuditResults,
  };

  fs.writeFileSync('scripts/full_reset_cleanup_execution_summary.json', JSON.stringify(executionSummary, null, 2));
  console.log('\n✅ EXECUTION SUMMARY SAVED TO: scripts/full_reset_cleanup_execution_summary.json');

  if (!allPassed) {
    throw new Error('CRITICAL FAILURE: One or more collections failed post-reset verification!');
  }

  console.log('\n🎉 FULL PRODUCTION RESET COMPLETED WITH 100% INTEGRITY AND PRECISION!');
  process.exit(0);
}

runFullProductionReset().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
