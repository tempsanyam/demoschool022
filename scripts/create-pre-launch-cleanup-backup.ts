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

const ALL_COLLECTIONS = [
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
];

async function runBackupAndDeepAnalysis() {
  console.log('Authenticating as Admin to execute full database dump and analysis...');
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('Authenticated! UID:', auth.currentUser?.uid);

  const fullBackupData: Record<string, any[]> = {};
  const collectionCounts: Record<string, number> = {};

  for (const col of ALL_COLLECTIONS) {
    const snap = await getDocs(collection(db, col));
    collectionCounts[col] = snap.size;
    fullBackupData[col] = snap.docs.map(d => ({
      _id: d.id,
      ...d.data(),
    }));
    console.log(`Exported collection: ${col} (${snap.size} docs)`);
  }

  // Save master backup to artifacts brain directory
  const artifactDir = path.resolve(process.cwd(), '.aistudio/artifacts/brain/dc9d25e5-4549-4c58-a5ef-80cffe3f0e04');
  if (!fs.existsSync(artifactDir)) {
    fs.mkdirSync(artifactDir, { recursive: true });
  }
  const backupPath = path.join(artifactDir, 'pre-launch-cleanup-backup.json');
  fs.writeFileSync(backupPath, JSON.stringify(fullBackupData, null, 2));
  console.log(`\n✅ FULL BACKUP WRITTEN TO: ${backupPath}`);
  console.log(`Total backup size: ${(fs.statSync(backupPath).size / 1024).toFixed(2)} KB`);

  // Also save a local reference copy in scripts/
  fs.writeFileSync('scripts/pre_launch_cleanup_backup.json', JSON.stringify(fullBackupData, null, 2));

  // -------------------------------------------------------------
  // DEEP CATEGORIZATION & FORENSIC ANALYSIS
  // -------------------------------------------------------------
  const officialUdises = new Set(fullBackupData['schools'].map(s => s._id));
  console.log(`\nOfficial Cluster Schools: ${officialUdises.size}`);

  // 1. studentAcademicRecords analysis
  const stuRecords = fullBackupData['studentAcademicRecords'];
  const stuInCluster = stuRecords.filter(r => officialUdises.has(r.schoolUdise));
  const stuNonCluster = stuRecords.filter(r => !officialUdises.has(r.schoolUdise));
  const stuNonClusterUdises = Array.from(new Set(stuNonCluster.map(r => r.schoolUdise)));

  // 2. staffPostings analysis
  const staffRecords = fullBackupData['staffPostings'];
  const staffInCluster = staffRecords.filter(r => officialUdises.has(r.schoolUdise));
  const staffNonCluster = staffRecords.filter(r => !officialUdises.has(r.schoolUdise));
  const staffNonClusterUdises = Array.from(new Set(staffNonCluster.map(r => r.schoolUdise)));

  // 3. rasoiya analysis
  const rasoiyaRecords = fullBackupData['rasoiya'];
  const rasoiyaInCluster = rasoiyaRecords.filter(r => officialUdises.has(r.schoolUdise));
  const rasoiyaNonCluster = rasoiyaRecords.filter(r => !officialUdises.has(r.schoolUdise));
  const rasoiyaNonClusterUdises = Array.from(new Set(rasoiyaNonCluster.map(r => r.schoolUdise)));

  // 4. attendance analysis
  const attRecords = fullBackupData['attendance'];
  const attInCluster = attRecords.filter(r => officialUdises.has(r.schoolUdise));
  const attNonCluster = attRecords.filter(r => !officialUdises.has(r.schoolUdise));

  // 5. users analysis
  const usersRecords = fullBackupData['users'];
  const usersAnalysis = {
    total: usersRecords.length,
    admins: usersRecords.filter(u => u.role === 'ADMIN').map(u => ({ docId: u._id, username: u.username, email: u.email })),
    cacs: usersRecords.filter(u => u.role === 'CAC').map(u => ({ docId: u._id, username: u.username, email: u.email })),
    schools: {
      total: usersRecords.filter(u => u.role === 'SCHOOL').length,
      udiseDocIds: usersRecords.filter(u => u.role === 'SCHOOL' && /^\d{11}$/.test(u._id)).length,
      usrSeedDocIds: usersRecords.filter(u => u.role === 'SCHOOL' && /^USR-SCH-/.test(u._id)).length,
      authUidDocIds: usersRecords.filter(u => u.role === 'SCHOOL' && /^[a-zA-Z0-9]{28}$/.test(u._id)).length,
    }
  };

  const analysisReport = {
    timestamp: new Date().toISOString(),
    collectionCounts,
    officialSchoolsCount: officialUdises.size,
    studentAcademicRecords: {
      total: stuRecords.length,
      inCluster: stuInCluster.length,
      nonCluster: stuNonCluster.length,
      nonClusterUdiseSample: stuNonClusterUdises.slice(0, 10),
      nonClusterUdiseCount: stuNonClusterUdises.length,
    },
    staffPostings: {
      total: staffRecords.length,
      inCluster: staffInCluster.length,
      nonCluster: staffNonCluster.length,
      nonClusterUdiseCount: staffNonClusterUdises.length,
    },
    rasoiya: {
      total: rasoiyaRecords.length,
      inCluster: rasoiyaInCluster.length,
      nonCluster: rasoiyaNonCluster.length,
      nonClusterUdiseCount: rasoiyaNonClusterUdises.length,
    },
    attendance: {
      total: attRecords.length,
      inCluster: attInCluster.length,
      nonCluster: attNonCluster.length,
      sampleDates: Array.from(new Set(attRecords.map(a => a.date))).slice(0, 10),
    },
    governmentWork: {
      total: fullBackupData['governmentWork'].length,
      sample: fullBackupData['governmentWork'].map(w => ({ id: w._id, name: w.workName, status: w.status, date: w.assignedDate })),
    },
    notifications: {
      total: fullBackupData['notifications'].length,
      sample: fullBackupData['notifications'].map(n => ({ id: n._id, title: n.title, date: n.date })),
    },
    literacyModule: {
      registers: fullBackupData['literacyRegisters'].length,
      illiteratePersons: fullBackupData['illiteratePersons'].length,
      aksharSathis: fullBackupData['aksharSathis'].length,
      examResults: fullBackupData['literacyExamResults'].length,
      supportingInstitutions: fullBackupData['supportingInstitutions'].length,
    },
    usersAnalysis,
    auditLogsCount: fullBackupData['auditLogs'].length,
    securityEventsCount: fullBackupData['preAuthSecurityEvents'].length,
  };

  fs.writeFileSync('scripts/forensic_analysis_report.json', JSON.stringify(analysisReport, null, 2));
  console.log('\nAnalysis Report saved to scripts/forensic_analysis_report.json');
}

runBackupAndDeepAnalysis().then(() => process.exit(0)).catch(e => {
  console.error('Fatal backup/analysis error:', e);
  process.exit(1);
});
