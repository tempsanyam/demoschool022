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

async function analyzePhase2HeldRecords() {
  console.log('Authenticating as Admin to analyze Phase 2 held records...');
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');

  // 1. Schools master map
  const schoolsSnap = await getDocs(collection(db, 'schools'));
  const schoolMap = new Map<string, string>();
  schoolsSnap.docs.forEach((d) => schoolMap.set(d.id, d.data().name || d.id));

  // 2. studentAcademicRecords analysis (992 records)
  const stuSnap = await getDocs(collection(db, 'studentAcademicRecords'));
  const stuBySchool: Record<string, number> = {};
  const stuBySession: Record<string, number> = {};
  const stuByClass: Record<string, number> = {};

  stuSnap.docs.forEach((d) => {
    const data = d.data();
    const u = data.schoolUdise;
    const sName = schoolMap.get(u) || u;
    stuBySchool[sName] = (stuBySchool[sName] || 0) + 1;
    stuBySession[data.sessionId] = (stuBySession[data.sessionId] || 0) + 1;
    stuByClass[data.class] = (stuByClass[data.class] || 0) + 1;
  });

  // 3. staffPostings analysis (431 records)
  const staffSnap = await getDocs(collection(db, 'staffPostings'));
  const staffBySchool: Record<string, number> = {};
  const staffBySession: Record<string, number> = {};
  const staffByDesignation: Record<string, number> = {};

  staffSnap.docs.forEach((d) => {
    const data = d.data();
    const u = data.schoolUdise;
    const sName = schoolMap.get(u) || u;
    staffBySchool[sName] = (staffBySchool[sName] || 0) + 1;
    staffBySession[data.sessionId] = (staffBySession[data.sessionId] || 0) + 1;
    staffByDesignation[data.designation] = (staffByDesignation[data.designation] || 0) + 1;
  });

  // 4. rasoiya analysis (148 records)
  const rsySnap = await getDocs(collection(db, 'rasoiya'));
  const rsyBySchool: Record<string, number> = {};
  const rsyByStatus: Record<string, number> = {};

  rsySnap.docs.forEach((d) => {
    const data = d.data();
    const u = data.schoolUdise;
    const sName = schoolMap.get(u) || u;
    rsyBySchool[sName] = (rsyBySchool[sName] || 0) + 1;
    rsyByStatus[data.status || 'ACTIVE'] = (rsyByStatus[data.status || 'ACTIVE'] || 0) + 1;
  });

  // 5. users analysis (88 docs)
  const userSnap = await getDocs(collection(db, 'users'));
  const usersMapping = userSnap.docs.map((d) => {
    const data = d.data();
    const docId = d.id;
    let category = 'UNKNOWN';
    if (/^[a-zA-Z0-9]{28}$/.test(docId)) {
      category = 'FIREBASE_AUTH_UID';
    } else if (/^\d{11}$/.test(docId)) {
      category = 'UDISE_KEYED_PROFILE';
    } else if (/^USR-SCH-/.test(docId)) {
      category = 'SEED_SCHOOL_ID';
    } else if (/^USR-/.test(docId)) {
      category = 'SEED_ADMIN_OR_CAC_ID';
    } else {
      category = 'USERNAME_KEYED_DOC';
    }
    return {
      docId,
      category,
      role: data.role,
      username: data.username || data.userName,
      email: data.email,
      assignedSchoolUdise: data.assignedSchoolUdise || null,
      schoolName: data.schoolName || null,
      status: data.status || 'ACTIVE',
      approvalStatus: data.approvalStatus || null,
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    studentAcademicRecordsHeld: {
      total: stuSnap.size,
      bySession: stuBySession,
      byClass: stuByClass,
      schoolCountRepresented: Object.keys(stuBySchool).length,
      sampleSchools: Object.entries(stuBySchool).slice(0, 5),
    },
    staffPostingsHeld: {
      total: staffSnap.size,
      bySession: staffBySession,
      byDesignation: staffByDesignation,
      schoolCountRepresented: Object.keys(staffBySchool).length,
      sampleSchools: Object.entries(staffBySchool).slice(0, 5),
    },
    rasoiyaHeld: {
      total: rsySnap.size,
      byStatus: rsyByStatus,
      schoolCountRepresented: Object.keys(rsyBySchool).length,
      perSchoolCountAverage: (rsySnap.size / Object.keys(rsyBySchool).length).toFixed(1),
    },
    usersMappingSummary: {
      total: usersMapping.length,
      byCategory: {
        FIREBASE_AUTH_UID: usersMapping.filter((u) => u.category === 'FIREBASE_AUTH_UID').length,
        UDISE_KEYED_PROFILE: usersMapping.filter((u) => u.category === 'UDISE_KEYED_PROFILE').length,
        SEED_SCHOOL_ID: usersMapping.filter((u) => u.category === 'SEED_SCHOOL_ID').length,
        SEED_ADMIN_OR_CAC_ID: usersMapping.filter((u) => u.category === 'SEED_ADMIN_OR_CAC_ID').length,
        USERNAME_KEYED_DOC: usersMapping.filter((u) => u.category === 'USERNAME_KEYED_DOC').length,
      },
      firebaseAuthUsers: usersMapping.filter((u) => u.category === 'FIREBASE_AUTH_UID'),
    },
  };

  fs.writeFileSync('scripts/phase2_held_records_analysis.json', JSON.stringify(report, null, 2));
  console.log('✅ Phase 2 held records analysis written to: scripts/phase2_held_records_analysis.json');
}

analyzePhase2HeldRecords()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
