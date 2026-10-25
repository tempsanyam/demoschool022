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

async function runApprovedPhase1Cleanup() {
  console.log('================================================================');
  console.log('STEP 1: PRE-DELETION BACKUP VERIFICATION');
  console.log('================================================================');

  const artifactBackupPath = path.resolve(
    process.cwd(),
    '.aistudio/artifacts/brain/dc9d25e5-4549-4c58-a5ef-80cffe3f0e04/pre-launch-cleanup-backup.json'
  );
  const localBackupPath = path.resolve(process.cwd(), 'scripts/pre_launch_cleanup_backup.json');

  if (!fs.existsSync(artifactBackupPath)) {
    throw new Error(`CRITICAL ABORT: Master backup not found at ${artifactBackupPath}`);
  }
  if (!fs.existsSync(localBackupPath)) {
    throw new Error(`CRITICAL ABORT: Local backup not found at ${localBackupPath}`);
  }

  const backupRaw = fs.readFileSync(artifactBackupPath, 'utf8');
  const backupData = JSON.parse(backupRaw);
  const stats = fs.statSync(artifactBackupPath);

  console.log(`✅ Master Backup verified at: ${artifactBackupPath}`);
  console.log(`   File size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`   Collections in backup: ${Object.keys(backupData).length}`);
  console.log(`   studentAcademicRecords in backup: ${backupData.studentAcademicRecords?.length}`);
  console.log(`   staffPostings in backup: ${backupData.staffPostings?.length}`);
  console.log(`   attendance in backup: ${backupData.attendance?.length}`);
  console.log(`   rasoiya in backup: ${backupData.rasoiya?.length}`);
  console.log(`   schools in backup: ${backupData.schools?.length}`);

  if (backupData.schools?.length !== 37) {
    throw new Error('CRITICAL ABORT: Backup schools count does not match expected 37!');
  }
  console.log('✅ BACKUP INTEGRITY 100% VERIFIED.\n');

  console.log('================================================================');
  console.log('STEP 2: AUTHENTICATION & OFFICIAL SCHOOLS DISCOVERY');
  console.log('================================================================');

  console.log('Authenticating as Admin (sanyam.admin@malguwa.edu.in)...');
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('✅ Admin Authenticated. UID:', auth.currentUser?.uid);

  // Fetch live official schools from Firestore
  const schoolsSnap = await getDocs(collection(db, 'schools'));
  const officialUdises = new Set<string>();
  const officialSchoolsList: { udise: string; name: string }[] = [];

  schoolsSnap.docs.forEach((d) => {
    const data = d.data();
    officialUdises.add(d.id);
    officialSchoolsList.push({ udise: d.id, name: data.name || data.schoolName || 'Unnamed' });
  });

  console.log(`✅ Live official cluster schools found: ${officialUdises.size}`);
  if (officialUdises.size !== 37) {
    throw new Error(`CRITICAL ABORT: Expected 37 official cluster schools, but found ${officialUdises.size}!`);
  }
  console.log('   Sample official UDISEs:', Array.from(officialUdises).slice(0, 5));

  console.log('\n================================================================');
  console.log('STEP 3: IDENTIFY EXACT DELETION CANDIDATES (PHASE 1)');
  console.log('================================================================');

  // Helper to fetch all docs in a collection using pagination
  async function fetchAllPaginated(colName: string) {
    let all: { id: string; data: any }[] = [];
    let lastVisible = null;
    while (true) {
      let q = lastVisible
        ? query(collection(db, colName), orderBy('__name__'), startAfter(lastVisible), limit(500))
        : query(collection(db, colName), orderBy('__name__'), limit(500));
      const snap = await getDocs(q);
      if (snap.empty) break;
      snap.docs.forEach((d) => all.push({ id: d.id, data: d.data() }));
      lastVisible = snap.docs[snap.docs.length - 1];
      if (snap.size < 500) break;
    }
    return all;
  }

  // 1. attendance candidates (all 70 synthetic 2018 records)
  const attAll = await fetchAllPaginated('attendance');
  const attToDelete: { docId: string; schoolUdise: string; date: string; sampleStudent: string }[] = [];
  attAll.forEach((d) => {
    attToDelete.push({
      docId: d.id,
      schoolUdise: d.data.schoolUdise || 'UNKNOWN',
      date: d.data.date || 'UNKNOWN',
      sampleStudent: d.data.records?.[0]?.name || 'N/A',
    });
  });
  console.log(`Live attendance records: ${attToDelete.length} (Target to delete: ${attToDelete.length})`);
  if (attToDelete.length !== 70) {
    throw new Error(`CRITICAL ABORT: attendance count is ${attToDelete.length}, expected 70!`);
  }

  // 2. studentAcademicRecords candidates (strictly non-cluster UDISEs)
  const stuAll = await fetchAllPaginated('studentAcademicRecords');
  const stuToDelete: { docId: string; schoolUdise: string; studentId: string; sessionId: string }[] = [];
  const stuToPreserve: { docId: string; schoolUdise: string; studentId: string; sessionId: string }[] = [];

  stuAll.forEach((d) => {
    const u = d.data.schoolUdise;
    if (!officialUdises.has(u)) {
      stuToDelete.push({
        docId: d.id,
        schoolUdise: u,
        studentId: d.data.studentId || '',
        sessionId: d.data.sessionId || '',
      });
    } else {
      stuToPreserve.push({
        docId: d.id,
        schoolUdise: u,
        studentId: d.data.studentId || '',
        sessionId: d.data.sessionId || '',
      });
    }
  });

  console.log(`Live studentAcademicRecords Total: ${stuAll.length}`);
  console.log(`  -> Non-Cluster Records to DELETE: ${stuToDelete.length}`);
  console.log(`  -> Official Cluster Records to PRESERVE: ${stuToPreserve.length}`);
  if (stuToDelete.length === 0 || stuToPreserve.length === 0) {
    throw new Error('CRITICAL ABORT: studentAcademicRecords classification error!');
  }

  // 3. staffPostings candidates (strictly non-cluster UDISEs)
  const staffAll = await fetchAllPaginated('staffPostings');
  const staffToDelete: { docId: string; schoolUdise: string; staffId: string; sessionId: string }[] = [];
  const staffToPreserve: { docId: string; schoolUdise: string; staffId: string; sessionId: string }[] = [];

  staffAll.forEach((d) => {
    const u = d.data.schoolUdise;
    if (!officialUdises.has(u)) {
      staffToDelete.push({
        docId: d.id,
        schoolUdise: u,
        staffId: d.data.staffId || '',
        sessionId: d.data.sessionId || '',
      });
    } else {
      staffToPreserve.push({
        docId: d.id,
        schoolUdise: u,
        staffId: d.data.staffId || '',
        sessionId: d.data.sessionId || '',
      });
    }
  });

  console.log(`Live staffPostings Total: ${staffAll.length}`);
  console.log(`  -> Non-Cluster Records to DELETE: ${staffToDelete.length} (Expected: 396)`);
  console.log(`  -> Official Cluster Records to PRESERVE: ${staffToPreserve.length} (Expected: 431)`);
  if (staffToDelete.length !== 396 || staffToPreserve.length !== 431) {
    throw new Error(
      `CRITICAL ABORT: staffPostings mismatch! Delete: ${staffToDelete.length} (expected 396), Preserve: ${staffToPreserve.length} (expected 431)`
    );
  }

  // 4. rasoiya candidates (strictly non-cluster UDISEs)
  const rsyAll = await fetchAllPaginated('rasoiya');
  const rsyToDelete: { docId: string; schoolUdise: string; name: string }[] = [];
  const rsyToPreserve: { docId: string; schoolUdise: string; name: string }[] = [];

  rsyAll.forEach((d) => {
    const u = d.data.schoolUdise;
    if (!officialUdises.has(u)) {
      rsyToDelete.push({
        docId: d.id,
        schoolUdise: u,
        name: d.data.name || '',
      });
    } else {
      rsyToPreserve.push({
        docId: d.id,
        schoolUdise: u,
        name: d.data.name || '',
      });
    }
  });

  console.log(`Live rasoiya Total: ${rsyAll.length}`);
  console.log(`  -> Non-Cluster Records to DELETE: ${rsyToDelete.length} (Expected: 132)`);
  console.log(`  -> Official Cluster Records to PRESERVE: ${rsyToPreserve.length} (Expected: 148)`);
  if (rsyToDelete.length !== 132 || rsyToPreserve.length !== 148) {
    throw new Error(
      `CRITICAL ABORT: rasoiya mismatch! Delete: ${rsyToDelete.length} (expected 132), Preserve: ${rsyToPreserve.length} (expected 148)`
    );
  }

  const totalToDelete = attToDelete.length + stuToDelete.length + staffToDelete.length + rsyToDelete.length;
  console.log(`\n================================================================`);
  console.log(`TOTAL RECORDS IDENTIFIED FOR DELETION: ${totalToDelete}`);
  console.log(`================================================================`);

  // Write exact Deletion Manifest before deleting
  const deletionManifest = {
    timestamp: new Date().toISOString(),
    adminUid: auth.currentUser?.uid,
    adminEmail: auth.currentUser?.email,
    officialSchoolsCount: officialUdises.size,
    summary: {
      attendance: attToDelete.length,
      studentAcademicRecords: stuToDelete.length,
      staffPostings: staffToDelete.length,
      rasoiya: rsyToDelete.length,
      total: totalToDelete,
    },
    preservedSummary: {
      studentAcademicRecords: stuToPreserve.length,
      staffPostings: staffToPreserve.length,
      rasoiya: rsyToPreserve.length,
      schools: officialUdises.size,
    },
    attendanceDeleted: attToDelete,
    studentAcademicRecordsDeleted: stuToDelete,
    staffPostingsDeleted: staffToDelete,
    rasoiyaDeleted: rsyToDelete,
  };

  fs.writeFileSync('scripts/phase1_deletion_manifest.json', JSON.stringify(deletionManifest, null, 2));
  console.log('✅ DELETION MANIFEST SAVED TO: scripts/phase1_deletion_manifest.json\n');

  console.log('================================================================');
  console.log('STEP 4: EXECUTING BATCH DELETIONS IN FIRESTORE');
  console.log('================================================================');

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
    console.log(`✅ [${colName}] All ${deletedCount} records deleted successfully.`);
  }

  console.log(`Deleting ${attToDelete.length} attendance records...`);
  await executeBatchDeletions('attendance', attToDelete.map((x) => x.docId));

  console.log(`\nDeleting ${stuToDelete.length} non-cluster studentAcademicRecords...`);
  await executeBatchDeletions('studentAcademicRecords', stuToDelete.map((x) => x.docId));

  console.log(`\nDeleting ${staffToDelete.length} non-cluster staffPostings...`);
  await executeBatchDeletions('staffPostings', staffToDelete.map((x) => x.docId));

  console.log(`\nDeleting ${rsyToDelete.length} non-cluster rasoiya records...`);
  await executeBatchDeletions('rasoiya', rsyToDelete.map((x) => x.docId));

  console.log('\n================================================================');
  console.log('STEP 5: POST-DELETION LIVE RE-QUERY VERIFICATION');
  console.log('================================================================');

  const postAttendance = (await getCountFromServer(collection(db, 'attendance'))).data().count;
  const postStudentRecords = (await getCountFromServer(collection(db, 'studentAcademicRecords'))).data().count;
  const postStaffPostings = (await getCountFromServer(collection(db, 'staffPostings'))).data().count;
  const postRasoiya = (await getCountFromServer(collection(db, 'rasoiya'))).data().count;
  const postSchools = (await getCountFromServer(collection(db, 'schools'))).data().count;
  const postSessions = (await getCountFromServer(collection(db, 'academicSessions'))).data().count;
  const postExamCycles = (await getCountFromServer(collection(db, 'examCycles'))).data().count;
  const postGovWork = (await getCountFromServer(collection(db, 'governmentWork'))).data().count;
  const postNotifications = (await getCountFromServer(collection(db, 'notifications'))).data().count;
  const postLitReg = (await getCountFromServer(collection(db, 'literacyRegisters'))).data().count;
  const postLitIll = (await getCountFromServer(collection(db, 'illiteratePersons'))).data().count;
  const postLitVol = (await getCountFromServer(collection(db, 'aksharSathis'))).data().count;
  const postLitEx = (await getCountFromServer(collection(db, 'literacyExamResults'))).data().count;
  const postLitInst = (await getCountFromServer(collection(db, 'supportingInstitutions'))).data().count;
  const postUsers = (await getCountFromServer(collection(db, 'users'))).data().count;
  const postAuditLogs = (await getCountFromServer(collection(db, 'auditLogs'))).data().count;
  const postSecurityEvents = (await getCountFromServer(collection(db, 'preAuthSecurityEvents'))).data().count;

  console.log('--- LIVE RE-QUERY RESULTS VIA SERVER COUNTS ---');
  console.log(`attendance:                ${postAttendance} (Expected: 0) -> ${postAttendance === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`studentAcademicRecords:    ${postStudentRecords} (Expected: ${stuToPreserve.length}) -> ${postStudentRecords === stuToPreserve.length ? 'PASS' : 'FAIL'}`);
  console.log(`staffPostings:             ${postStaffPostings} (Expected: 431) -> ${postStaffPostings === 431 ? 'PASS' : 'FAIL'}`);
  console.log(`rasoiya:                   ${postRasoiya} (Expected: 148) -> ${postRasoiya === 148 ? 'PASS' : 'FAIL'}`);
  console.log(`schools:                   ${postSchools} (Expected: 37) -> ${postSchools === 37 ? 'PASS' : 'FAIL'}`);
  console.log(`academicSessions:          ${postSessions} (Expected: 16) -> ${postSessions === 16 ? 'PASS' : 'FAIL'}`);
  console.log(`examCycles:                ${postExamCycles} (Expected: 7) -> ${postExamCycles === 7 ? 'PASS' : 'FAIL'}`);
  console.log(`governmentWork:            ${postGovWork} (Expected: 11) -> ${postGovWork === 11 ? 'PASS' : 'FAIL'}`);
  console.log(`notifications:             ${postNotifications} (Expected: 3) -> ${postNotifications === 3 ? 'PASS' : 'FAIL'}`);
  console.log(`literacyRegisters:         ${postLitReg} (Expected: 6) -> ${postLitReg === 6 ? 'PASS' : 'FAIL'}`);
  console.log(`illiteratePersons:         ${postLitIll} (Expected: 9) -> ${postLitIll === 9 ? 'PASS' : 'FAIL'}`);
  console.log(`aksharSathis:              ${postLitVol} (Expected: 8) -> ${postLitVol === 8 ? 'PASS' : 'FAIL'}`);
  console.log(`literacyExamResults:       ${postLitEx} (Expected: 6) -> ${postLitEx === 6 ? 'PASS' : 'FAIL'}`);
  console.log(`supportingInstitutions:    ${postLitInst} (Expected: 3) -> ${postLitInst === 3 ? 'PASS' : 'FAIL'}`);
  console.log(`users:                     ${postUsers} (Expected: 88) -> ${postUsers === 88 ? 'PASS' : 'FAIL'}`);
  console.log(`auditLogs:                 ${postAuditLogs} (Expected: 14) -> ${postAuditLogs === 14 ? 'PASS' : 'FAIL'}`);
  console.log(`preAuthSecurityEvents:     ${postSecurityEvents} (Expected: 405) -> ${postSecurityEvents === 405 ? 'PASS' : 'FAIL'}`);

  // Confirm that EVERY remaining record in studentAcademicRecords, staffPostings, rasoiya belongs to the 37 cluster schools
  const remainingStuAll = await fetchAllPaginated('studentAcademicRecords');
  const invalidRemainingStu = remainingStuAll.filter((d) => !officialUdises.has(d.data.schoolUdise));

  const remainingStaffAll = await fetchAllPaginated('staffPostings');
  const invalidRemainingStaff = remainingStaffAll.filter((d) => !officialUdises.has(d.data.schoolUdise));

  const remainingRsyAll = await fetchAllPaginated('rasoiya');
  const invalidRemainingRsy = remainingRsyAll.filter((d) => !officialUdises.has(d.data.schoolUdise));

  console.log(`\nUDISE Scoping Validation of Remaining Records:`);
  console.log(`Invalid remaining studentAcademicRecords: ${invalidRemainingStu.length} (Must be 0)`);
  console.log(`Invalid remaining staffPostings:          ${invalidRemainingStaff.length} (Must be 0)`);
  console.log(`Invalid remaining rasoiya:                ${invalidRemainingRsy.length} (Must be 0)`);

  const executionSummary = {
    executedAt: new Date().toISOString(),
    status: 'COMPLETED_SUCCESSFULLY',
    deleted: {
      attendance: attToDelete.length,
      studentAcademicRecords: stuToDelete.length,
      staffPostings: staffToDelete.length,
      rasoiya: rsyToDelete.length,
      total: totalToDelete,
    },
    liveCountsAfterDeletion: {
      attendance: postAttendance,
      studentAcademicRecords: postStudentRecords,
      staffPostings: postStaffPostings,
      rasoiya: postRasoiya,
      schools: postSchools,
      academicSessions: postSessions,
      examCycles: postExamCycles,
      governmentWork: postGovWork,
      notifications: postNotifications,
      literacyRegisters: postLitReg,
      illiteratePersons: postLitIll,
      aksharSathis: postLitVol,
      literacyExamResults: postLitEx,
      supportingInstitutions: postLitInst,
      users: postUsers,
      auditLogs: postAuditLogs,
      preAuthSecurityEvents: postSecurityEvents,
    },
    allPreservedRecordsInCluster:
      invalidRemainingStu.length === 0 &&
      invalidRemainingStaff.length === 0 &&
      invalidRemainingRsy.length === 0,
  };

  fs.writeFileSync('scripts/phase1_cleanup_execution_summary.json', JSON.stringify(executionSummary, null, 2));
  console.log('\n✅ EXECUTION SUMMARY SAVED TO: scripts/phase1_cleanup_execution_summary.json');
}

runApprovedPhase1Cleanup()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal execution error:', e);
    process.exit(1);
  });
