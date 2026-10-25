import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  limit,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

console.log('================================================================================');
console.log('REAL FIRESTORE & PRODUCTION CODEBASE AUDIT');
console.log('Project ID:', firebaseConfig.projectId);
console.log('Database ID:', firebaseConfig.firestoreDatabaseId);
console.log('Timestamp:', new Date().toISOString());
console.log('================================================================================\n');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const collectionsToProbe = [
  'schools',
  'studentMasters',
  'studentAcademicRecords',
  'staffMasters',
  'staffPostings',
  'attendance',
  'mdmRecords',
  'rasoiya',
  'shgs',
  'facilities',
  'literacyRegisters',
  'illiteratePersons',
  'aksharSathis',
  'examCycles',
  'literacyExamResults',
  'supportingInstitutions',
  'governmentWork',
  'complaints',
  'notifications',
  'documents',
  'academicSessions',
  'users',
  'systemSettings',
  'auditLogs',
  'preAuthSecurityEvents',
  '_connection_test',
];

async function probeFirestore() {
  console.log('--- 1. DIRECT FIRESTORE READ PROBE (Unauthenticated Client SDK) ---');
  const results: Record<string, any> = {};

  for (const colName of collectionsToProbe) {
    try {
      const colRef = collection(db, colName);
      const snap = await getDocs(query(colRef, limit(50)));
      results[colName] = {
        status: 'SUCCESS',
        count: snap.size,
        docs: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
      };
      console.log(`[${colName}] SUCCESS - Read ${snap.size} documents.`);
    } catch (err: any) {
      results[colName] = {
        status: 'ERROR',
        code: err.code || 'unknown',
        message: err.message || String(err),
      };
      console.log(`[${colName}] ACCESS RESULT: ${err.code || err.message}`);
    }
  }

  return results;
}

async function run() {
  try {
    const probeResults = await probeFirestore();
    fs.writeFileSync('scripts/firestore_probe_results.json', JSON.stringify(probeResults, null, 2));
    console.log('\nProbe complete. Results saved to scripts/firestore_probe_results.json');
  } catch (e) {
    console.error('Probe execution fatal error:', e);
  } finally {
    process.exit(0);
  }
}

run();
