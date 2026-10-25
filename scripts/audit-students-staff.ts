import fs from 'fs';
import { isLegacyFakeStudent, isLegacyFakeStaff } from '../src/utils/legacyPurgeHelpers';

const probe = JSON.parse(fs.readFileSync('scripts/authenticated_probe_results.json', 'utf8'));
const cloudStudents = probe.studentMasters?.docs || [];
const cloudStaff = probe.staffMasters?.docs || [];

console.log('--- DETAILED AUDIT: STUDENTS & STAFF (REAL VS FAKE) ---');

// 1. Analyze Cloud studentMasters
let fakeStudentCount = 0;
let realStudentCount = 0;
const suspectRealStudents: any[] = [];

cloudStudents.forEach((s: any) => {
  if (isLegacyFakeStudent(s)) {
    fakeStudentCount++;
  } else {
    // Check if it looks synthetic or real
    suspectRealStudents.push(s);
  }
});

console.log(`Cloud studentMasters total: ${cloudStudents.length}`);
console.log(`  Identified as Legacy Fake: ${fakeStudentCount}`);
console.log(`  Suspect Real/Incomplete: ${suspectRealStudents.length}`);

if (suspectRealStudents.length > 0) {
  console.log('Sample Suspect Real Students:', suspectRealStudents.slice(0, 5));
}

// 2. Analyze Cloud staffMasters
let fakeStaffCount = 0;
let realStaffCount = 0;
const suspectRealStaff: any[] = [];

cloudStaff.forEach((s: any) => {
  if (isLegacyFakeStaff(s)) {
    fakeStaffCount++;
  } else {
    suspectRealStaff.push(s);
  }
});

console.log(`\nCloud staffMasters total: ${cloudStaff.length}`);
console.log(`  Identified as Legacy Fake: ${fakeStaffCount}`);
console.log(`  Suspect Real/Incomplete: ${suspectRealStaff.length}`);

if (suspectRealStaff.length > 0) {
  console.log('Sample Suspect Real Staff:', suspectRealStaff.slice(0, 5));
}

// 3. Inspect Pre-Cleanup Backup
const backup = JSON.parse(fs.readFileSync('.aistudio/artifacts/brain/dc9d25e5-4549-4c58-a5ef-80cffe3f0e04/pre-cleanup-backup.json', 'utf8'));
console.log('\n--- PRE-CLEANUP BACKUP ARTIFACT AUDIT ---');
console.log('Backup metadata:', backup.metadata);
console.log('Students in backup:', backup.storesSnapshot?.students?.length || 0);
console.log('Staff in backup:', backup.storesSnapshot?.staff?.length || 0);
console.log('Schools in backup:', backup.storesSnapshot?.schools?.length || 0);
console.log('Users in backup:', backup.storesSnapshot?.users?.length || 0);
console.log('Sessions in backup:', backup.storesSnapshot?.academicSessions?.length || 0);
