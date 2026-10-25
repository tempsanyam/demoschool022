import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const collectionsToAudit = [
  'schools',
  'academicSessions',
  'examCycles',
  'studentMasters',
  'studentAcademicRecords',
  'staffMasters',
  'staffPostings',
  'facilities',
  'attendance',
  'mdmRecords',
  'rasoiya',
  'shgs',
  'literacyRegisters',
  'illiteratePersons',
  'aksharSathis',
  'literacyExamResults',
  'supportingInstitutions',
  'governmentWork',
  'complaints',
  'notifications',
  'documents',
  'users',
  'systemSettings',
  'auditLogs',
  'preAuthSecurityEvents',
  '_connection_test',
];

async function runLiveAudit() {
  console.log('Authenticating as Admin (sanyam.admin@malguwa.edu.in)...');
  const userCredential = await signInWithEmailAndPassword(
    auth,
    'sanyam.admin@malguwa.edu.in',
    'SanyamAdmin@Malguwa2026!'
  );
  console.log('Admin authenticated successfully! UID:', userCredential.user.uid);

  const collectionResults: Record<string, any> = {};

  for (const colName of collectionsToAudit) {
    try {
      const snap = await getDocs(collection(db, colName));
      const docIds = snap.docs.map((d) => d.id);
      const sampleFields = snap.docs.length > 0 ? Object.keys(snap.docs[0].data()).slice(0, 10) : [];
      
      collectionResults[colName] = {
        path: colName,
        status: 'SUCCESS',
        documentCount: snap.size,
        docIdsSample: docIds.slice(0, 10),
        totalDocIds: docIds.length,
        sampleFields,
      };
      console.log(`[PASS] Collection: ${colName.padEnd(25)} Count: ${snap.size}`);
    } catch (err: any) {
      console.error(`[FAIL] Collection: ${colName.padEnd(25)} Error:`, err?.code || err?.message);
      collectionResults[colName] = {
        path: colName,
        status: err?.code === 'permission-denied' ? 'PERMISSION_DENIED' : 'ERROR',
        error: err?.message,
        documentCount: null,
      };
    }
  }

  // Deep dive into users collection
  console.log('\nFetching all users in `users` collection...');
  let usersList: any[] = [];
  try {
    const userSnap = await getDocs(collection(db, 'users'));
    usersList = userSnap.docs.map((d) => {
      const data = d.data();
      return {
        docId: d.id,
        username: data.username || data.userName || null,
        email: data.email || null,
        role: data.role || null,
        assignedSchoolUdise: data.assignedSchoolUdise || null,
        schoolName: data.schoolName || null,
        status: data.status || 'ACTIVE',
        approvalStatus: data.approvalStatus || null,
        designation: data.designation || null,
        mustChangePassword: data.mustChangePassword ?? null,
        createdAt: data.createdAt || null,
        hasPasswordConfigured: !!(data.passwordHash || data.password || data.authUid),
      };
    });
    console.log(`Retrieved ${usersList.length} users from Firestore 'users' collection.`);
  } catch (err: any) {
    console.error('Failed to query users collection:', err);
  }

  // Audit systemSettings collection details
  let systemSettingsList: any[] = [];
  try {
    const settingsSnap = await getDocs(collection(db, 'systemSettings'));
    systemSettingsList = settingsSnap.docs.map((d) => ({
      docId: d.id,
      keys: Object.keys(d.data()),
      dataSnippet: d.id === 'feature_controls' ? 'Contains feature rules' : d.data(),
    }));
  } catch (err) {
    console.warn('Could not query systemSettings:', err);
  }

  // Audit schools details
  let schoolsSummary: any = {};
  try {
    const schoolsSnap = await getDocs(collection(db, 'schools'));
    schoolsSummary = {
      count: schoolsSnap.size,
      udises: schoolsSnap.docs.map((d) => d.id),
      activeCount: schoolsSnap.docs.filter((d) => !d.data().isDeleted).length,
      inactiveCount: schoolsSnap.docs.filter((d) => d.data().isDeleted).length,
    };
  } catch (err) {
    console.warn('Could not query schools:', err);
  }

  const auditReport = {
    timestamp: new Date().toISOString(),
    project: {
      projectId: firebaseConfig.projectId,
      appId: firebaseConfig.appId,
      authDomain: firebaseConfig.authDomain,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
    },
    authenticatedUser: {
      uid: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    collections: collectionResults,
    users: usersList,
    schoolsSummary,
    systemSettingsList,
  };

  fs.writeFileSync('scripts/live_audit_inventory.json', JSON.stringify(auditReport, null, 2));
  console.log('\nAudit complete! Results saved to scripts/live_audit_inventory.json');
}

runLiveAudit()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal audit error:', e);
    process.exit(1);
  });
