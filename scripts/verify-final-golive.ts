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

async function runGoLiveVerification() {
  console.log('================================================================');
  console.log('🚀 FINAL GO-LIVE READ-ONLY VERIFICATION AUDIT');
  console.log('================================================================');

  const report: Record<string, any> = {
    timestamp: new Date().toISOString(),
    firebaseProject: firebaseConfig.projectId,
    firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    tests: {},
  };

  // -------------------------------------------------------------------------
  // TEST 1: Admin & CAC Login Verification
  // -------------------------------------------------------------------------
  console.log('\n[TEST 1] Verifying Admin & CAC Login Authentications...');
  const accountsToTest = [
    { name: 'Admin (Sanyam Jain)', email: 'sanyam.admin@malguwa.edu.in', pass: 'SanyamAdmin@Malguwa2026!', expectedRole: 'ADMIN' },
    { name: 'Admin (Official MP Gov)', email: 'admin.malguwa@mp.gov.in', pass: 'SanyamAdmin@Malguwa2026!', expectedRole: 'ADMIN' },
    { name: 'CAC-1 (Sanjay Jain)', email: 'cac.malguwa@mp.gov.in', pass: 'CacSanjay@Malguwa2026!', expectedRole: 'CAC' },
    { name: 'CAC-2 (Sanmati Jain)', email: 'cac.sanmati@mp.gov.in', pass: 'CacSanmati@Malguwa2026!', expectedRole: 'CAC' },
  ];

  const authTestResults: any[] = [];
  for (const acc of accountsToTest) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, acc.email, acc.pass);
      const uid = userCred.user.uid;
      const userDocSnap = await getDoc(doc(db, 'users', uid));
      const userData = userDocSnap.exists() ? userDocSnap.data() : null;
      
      authTestResults.push({
        account: acc.name,
        email: acc.email,
        uid,
        userDocExists: userDocSnap.exists(),
        roleInFirestore: userData?.role || 'NOT_FOUND',
        statusInFirestore: userData?.status || userData?.active ? 'ACTIVE' : 'INACTIVE',
        passed: userDocSnap.exists() && userData?.role === acc.expectedRole,
      });
      console.log(`   ✅ ${acc.name} authenticated! UID: ${uid}, Role: ${userData?.role}`);
    } catch (err: any) {
      console.error(`   ❌ ${acc.name} failed login:`, err.message);
      authTestResults.push({
        account: acc.name,
        email: acc.email,
        error: err.message,
        passed: false,
      });
    }
  }

  report.tests['adminAndCacAuth'] = {
    status: authTestResults.every(r => r.passed) ? 'PASS' : 'FAIL',
    results: authTestResults,
  };

  // -------------------------------------------------------------------------
  // Re-authenticate as Admin for remaining checks
  // -------------------------------------------------------------------------
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');

  // -------------------------------------------------------------------------
  // TEST 2: All 37 Official Cluster Schools in Firestore
  // -------------------------------------------------------------------------
  console.log('\n[TEST 2] Verifying All 37 Official Cluster Schools in Firestore...');
  const schoolsSnap = await getDocs(collection(db, 'schools'));
  const schoolsList: any[] = [];

  schoolsSnap.docs.forEach((d) => {
    const data = d.data();
    schoolsList.push({
      udise: d.id,
      name: data.name || data.schoolName || 'Unnamed',
      category: data.category || data.schoolCategory || 'N/A',
      status: data.status || 'ACTIVE',
      hasVillage: !!data.village,
      hasPincode: !!data.pincode,
    });
  });

  const schoolsCountMatches = schoolsList.length === 37;
  const allUdisesValid = schoolsList.every(s => /^[0-9]{11}$/.test(s.udise));

  console.log(`   Total schools found: ${schoolsList.length} (Expected: 37)`);
  console.log(`   All UDISEs 11 digits: ${allUdisesValid}`);

  report.tests['official37Schools'] = {
    status: schoolsCountMatches && allUdisesValid ? 'PASS' : 'FAIL',
    count: schoolsList.length,
    schools: schoolsList,
  };

  // -------------------------------------------------------------------------
  // TEST 3: School Auth & User Mapping Audit
  // -------------------------------------------------------------------------
  console.log('\n[TEST 3] Auditing School User Profiles & Firebase Auth mappings...');
  const usersSnap = await getDocs(collection(db, 'users'));
  const usersByUdise: Record<string, any[]> = {};
  const authUidDocs: any[] = [];

  usersSnap.docs.forEach((d) => {
    const data = d.data();
    const id = d.id;
    if (id.length >= 20 && !id.startsWith('USR-')) {
      authUidDocs.push({ id, ...data });
    }
    const udise = data.assignedSchoolUdise || data.schoolUdise || (/^[0-9]{11}$/.test(id) ? id : null);
    if (udise) {
      if (!usersByUdise[udise]) usersByUdise[udise] = [];
      usersByUdise[udise].push({ id, role: data.role, email: data.email, username: data.username, active: data.active ?? true });
    }
  });

  const schoolAuthSummary: any[] = [];
  for (const s of schoolsList) {
    const mappedUsers = usersByUdise[s.udise] || [];
    const hasUidDoc = mappedUsers.some(u => u.id.length >= 20 && !u.id.startsWith('USR-'));
    const hasUdiseDoc = mappedUsers.some(u => u.id === s.udise);
    const hasUsrSchDoc = mappedUsers.some(u => u.id === `USR-SCH-${s.udise}`);

    schoolAuthSummary.push({
      udise: s.udise,
      schoolName: s.name,
      mappedDocCount: mappedUsers.length,
      hasDirectUdiseDoc: hasUdiseDoc,
      hasUsrSchDoc: hasUsrSchDoc,
      hasDirectFirebaseAuthUid: hasUidDoc,
      authMethod: hasUidDoc ? 'FIREBASE_AUTH_UID' : 'CANONICAL_CREDENTIAL_MAPPING',
    });
  }

  const all37Mapped = schoolAuthSummary.every(s => s.hasDirectUdiseDoc || s.hasUsrSchDoc);
  const directFirebaseAuthCount = schoolAuthSummary.filter(s => s.hasDirectFirebaseAuthUid).length;

  console.log(`   37 Schools Profile Coverage: ${all37Mapped ? '100% (37/37)' : 'INCOMPLETE'}`);
  console.log(`   Schools with pre-provisioned Firebase Auth UID: ${directFirebaseAuthCount}`);
  console.log(`   Schools using Canonical Auto-Provisioning mapping: ${37 - directFirebaseAuthCount}`);

  report.tests['schoolUserMapping'] = {
    status: all37Mapped ? 'PASS' : 'FAIL',
    totalSchools: 37,
    all37Mapped,
    directFirebaseAuthCount,
    canonicalMappedCount: 37 - directFirebaseAuthCount,
    details: schoolAuthSummary,
  };

  // -------------------------------------------------------------------------
  // TEST 4: School Login Test (Real Auth verification on provisioned schools)
  // -------------------------------------------------------------------------
  console.log('\n[TEST 4] Testing Direct School Login on provisioned school accounts...');
  // Testing provisioned school account: HS Hirapur (23080100303)
  const schoolTestAccounts = [
    { udise: '23080100303', email: 'hshirapur@mp.gov.in', pass: 'School@Hirapur2026!', name: 'HS Hirapur' },
    { udise: '23080110701', email: 'psjanakpur@mp.gov.in', pass: 'School@Janakpur2026!', name: 'PS Janakpur' },
  ];

  const schoolLoginResults: any[] = [];
  for (const st of schoolTestAccounts) {
    try {
      const userCred = await signInWithEmailAndPassword(auth, st.email, st.pass);
      const uid = userCred.user.uid;
      const udoc = await getDoc(doc(db, 'users', uid));
      const udata = udoc.exists() ? udoc.data() : null;

      const isIsolatedToOwnSchool = udata?.assignedSchoolUdise === st.udise || udata?.schoolUdise === st.udise;
      schoolLoginResults.push({
        school: st.name,
        udise: st.udise,
        uid,
        loginSuccess: true,
        assignedSchoolUdise: udata?.assignedSchoolUdise || udata?.schoolUdise,
        isIsolatedToOwnSchool,
        role: udata?.role,
        passed: isIsolatedToOwnSchool && udata?.role === 'SCHOOL',
      });
      console.log(`   ✅ School Login Verified: ${st.name} (${st.udise}), Role: ${udata?.role}, Assigned: ${udata?.assignedSchoolUdise}`);
    } catch (err: any) {
      console.warn(`   ⚠️ School Login Notice for ${st.name}:`, err.message);
      schoolLoginResults.push({
        school: st.name,
        udise: st.udise,
        loginSuccess: false,
        error: err.message,
        passed: false,
      });
    }
  }

  // Restore Admin session
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');

  report.tests['schoolLoginVerification'] = {
    status: schoolLoginResults.every(r => r.passed) ? 'PASS' : 'PARTIAL_OR_FAIL',
    testedAccounts: schoolLoginResults,
    untestedSchoolsCount: 37 - schoolLoginResults.length,
    untestedNote: 'Only schools with verified passwords in test suite were directly authenticated. Remaining 35 schools authenticate via AuthContext canonical credential handler on initial login.',
  };

  // -------------------------------------------------------------------------
  // TEST 5: Complete Collection Count & Empty State Verification
  // -------------------------------------------------------------------------
  console.log('\n[TEST 5] Live Database Counts & Zero-Test-Data Audit...');
  const ALL_SYSTEM_COLLECTIONS = [
    'schools',
    'academicSessions',
    'examCycles',
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

  const dbCounts: Record<string, number> = {};
  for (const col of ALL_SYSTEM_COLLECTIONS) {
    const c = (await getCountFromServer(collection(db, col))).data().count;
    dbCounts[col] = c;
  }

  console.table(dbCounts);

  const resetCollections = [
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

  const allOperationalZero = resetCollections.every(c => dbCounts[c] === 0);
  const coreProtectedValid =
    dbCounts['schools'] === 37 &&
    dbCounts['academicSessions'] === 16 &&
    dbCounts['examCycles'] === 7 &&
    dbCounts['users'] >= 40 &&
    dbCounts['auditLogs'] > 0 &&
    dbCounts['preAuthSecurityEvents'] > 0;

  report.tests['databaseCountsAndEmptyStates'] = {
    status: allOperationalZero && coreProtectedValid ? 'PASS' : 'FAIL',
    dbCounts,
    allOperationalZero,
    coreProtectedValid,
  };

  // -------------------------------------------------------------------------
  // TEST 6: Security Rules & Multi-Tenant Access Isolation Audit
  // -------------------------------------------------------------------------
  console.log('\n[TEST 6] Auditing Firestore Security Rules...');
  const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
  const rulesContent = fs.readFileSync(rulesPath, 'utf8');

  const hasIsAdmin = rulesContent.includes('function isAdmin()');
  const hasIsCAC = rulesContent.includes('function isCAC()');
  const hasIsSchool = rulesContent.includes('function isSchool()');
  const hasIsMySchool = rulesContent.includes('function isMySchool(');
  const blocksSchoolDelete = rulesContent.includes('match /schools/{schoolId} {\n      allow delete: if false;');
  const appendOnlyAuditLogs = rulesContent.includes('match /auditLogs/{logId} {\n      allow read: if isSignedIn() && (isAdmin() || isCAC());\n      allow create: if isSignedIn()') && rulesContent.includes('allow update, delete: if false;');
  const appendOnlyPreAuth = rulesContent.includes('match /preAuthSecurityEvents/{eventId}') && rulesContent.includes('allow update, delete: if false;');

  console.log('   isAdmin rule:', hasIsAdmin);
  console.log('   isCAC rule:', hasIsCAC);
  console.log('   isSchool rule:', hasIsSchool);
  console.log('   isMySchool tenant isolation rule:', hasIsMySchool);
  console.log('   Schools physical delete blocked:', blocksSchoolDelete);
  console.log('   AuditLogs append-only (update/delete blocked):', appendOnlyAuditLogs);
  console.log('   PreAuthSecurityEvents append-only:', appendOnlyPreAuth);

  const securityRulesPassed =
    hasIsAdmin &&
    hasIsCAC &&
    hasIsSchool &&
    hasIsMySchool &&
    blocksSchoolDelete &&
    appendOnlyAuditLogs &&
    appendOnlyPreAuth;

  report.tests['securityRules'] = {
    status: securityRulesPassed ? 'PASS' : 'FAIL',
    checks: {
      hasIsAdmin,
      hasIsCAC,
      hasIsSchool,
      hasIsMySchool,
      blocksSchoolDelete,
      appendOnlyAuditLogs,
      appendOnlyPreAuth,
    },
  };

  fs.writeFileSync('scripts/final_golive_audit_report.json', JSON.stringify(report, null, 2));
  console.log('\n================================================================');
  console.log('FINAL AUDIT JSON WRITTEN TO: scripts/final_golive_audit_report.json');
  console.log('================================================================');

  process.exit(0);
}

runGoLiveVerification().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
