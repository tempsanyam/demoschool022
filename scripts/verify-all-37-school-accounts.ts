import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
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

async function verifyAllAccounts() {
  console.log('================================================================');
  console.log('FINAL AUDIT: ALL 37 SCHOOLS & AUTH PROFILES');
  console.log('================================================================');

  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('✅ Admin authenticated. UID:', auth.currentUser?.uid);

  // 1. Check schools count
  const schoolsSnap = await getDocs(collection(db, 'schools'));
  console.log(`Live Schools count: ${schoolsSnap.size} (Expected: 37)`);

  // 2. Check each school has a valid Auth UID and clean profile in users
  const schoolsAudit: any[] = [];
  let piiLeakCount = 0;

  for (const s of schoolsSnap.docs) {
    const udise = s.id;
    const sName = s.data().name || s.data().schoolName;

    // Check UDISE document in users
    const uDoc = await getDoc(doc(db, 'users', udise));
    if (!uDoc.exists()) {
      schoolsAudit.push({ udise, name: sName, status: 'MISSING_USER_DOC' });
      continue;
    }

    const data = uDoc.data();
    const hasUid = data.uid && data.uid.length >= 20;
    const hasMobile = !!data.mobile || !!data.principalMobile || !!data.phone;

    if (hasMobile) piiLeakCount++;

    // Check Auth UID document in users
    let authDocExists = false;
    if (hasUid) {
      const authDoc = await getDoc(doc(db, 'users', data.uid));
      authDocExists = authDoc.exists();
    }

    schoolsAudit.push({
      udise,
      schoolName: sName,
      authUid: data.uid,
      authDocExists,
      role: data.role,
      status: data.status,
      hasPiiLeak: hasMobile,
      verified: hasUid && authDocExists && data.role === 'SCHOOL' && !hasMobile,
    });
  }

  const allVerified = schoolsAudit.every((s) => s.verified);
  console.log(`\nSchools Audit: ${schoolsAudit.filter((s) => s.verified).length}/37 verified.`);
  console.log(`PII Leaks (personal mobiles): ${piiLeakCount}`);

  // 3. Check Admin and CAC profiles
  const adminDoc = await getDoc(doc(db, 'users', 't3yFjtNtaFUIDeO9TnLwPmQDP9G2'));
  const cac1Doc = await getDoc(doc(db, 'users', '5XFY10Pm9laYloJ0FPVLry4tU513'));
  const cac2Doc = await getDoc(doc(db, 'users', 'oufJw9KrxmSo7p4AbxaCyWzzFAt1'));

  console.log('Admin mobile present:', !!adminDoc.data()?.mobile);
  console.log('CAC-1 mobile present:', !!cac1Doc.data()?.mobile);
  console.log('CAC-2 mobile present:', !!cac2Doc.data()?.mobile);

  // 4. Check all operational collection counts
  const operationalCols = [
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

  const colCounts: Record<string, number> = {};
  for (const c of operationalCols) {
    colCounts[c] = (await getCountFromServer(collection(db, c))).data().count;
  }

  console.log('\nOperational Collection Counts:');
  console.table(colCounts);

  const allZero = Object.values(colCounts).every((cnt) => cnt === 0);
  console.log(`All operational collections clean zero: ${allZero}`);

  const report = {
    timestamp: new Date().toISOString(),
    all37SchoolsVerified: allVerified,
    piiLeakCount,
    adminPiiFree: !adminDoc.data()?.mobile,
    cac1PiiFree: !cac1Doc.data()?.mobile,
    cac2PiiFree: !cac2Doc.data()?.mobile,
    allOperationalZero: allZero,
    colCounts,
    schools: schoolsAudit,
  };

  fs.writeFileSync('scripts/final_verified_clean_slate_audit.json', JSON.stringify(report, null, 2));
  console.log('Audit saved to scripts/final_verified_clean_slate_audit.json');

  if (allVerified && allZero && piiLeakCount === 0) {
    console.log('🎉 100% CLEAN SLATE CERTIFIED SUCCESS!');
  } else {
    throw new Error('Audit discrepancies found!');
  }
  process.exit(0);
}

verifyAllAccounts().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
