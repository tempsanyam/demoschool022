import fs from 'fs';

const raw = JSON.parse(fs.readFileSync('scripts/authenticated_probe_results.json', 'utf8'));

console.log('--- FIRESTORE ACTUAL CONTENT BREAKDOWN ---');
console.log('1. Schools in Firestore:', raw.schools?.count);
if (raw.schools?.docs) {
  console.log('Sample schools:', raw.schools.docs.slice(0, 3).map((d: any) => ({ udise: d.udise || d.id, name: d.name, status: d.status })));
}

console.log('\n2. studentMasters in Firestore:', raw.studentMasters?.count);
if (raw.studentMasters?.docs) {
  console.log('Sample studentMasters (first 5):', raw.studentMasters.docs.slice(0, 5).map((d: any) => ({ id: d.id, name: d.name, father: d.fatherName, samagra: d.samagraId, udise: d.schoolUdise || d.currentSchoolUdise })));
  console.log('Sample studentMasters (last 5):', raw.studentMasters.docs.slice(-5).map((d: any) => ({ id: d.id, name: d.name, father: d.fatherName, samagra: d.samagraId, udise: d.schoolUdise || d.currentSchoolUdise })));
}

console.log('\n3. staffMasters in Firestore:', raw.staffMasters?.count);
if (raw.staffMasters?.docs) {
  console.log('Sample staffMasters (first 5):', raw.staffMasters.docs.slice(0, 5).map((d: any) => ({ id: d.id, name: d.name, empCode: d.employeeCode || d.employeeId, mobile: d.mobile })));
  console.log('Sample staffMasters (last 5):', raw.staffMasters.docs.slice(-5).map((d: any) => ({ id: d.id, name: d.name, empCode: d.employeeCode || d.employeeId, mobile: d.mobile })));
}

console.log('\n4. facilities in Firestore:', raw.facilities?.count);
if (raw.facilities?.docs) {
  console.log('Sample facilities:', raw.facilities.docs.slice(0, 3).map((d: any) => ({ id: d.id, udise: d.schoolUdise })));
}

console.log('\n5. documents in Firestore:', raw.documents?.count);
if (raw.documents?.docs) {
  console.log('Sample documents:', raw.documents.docs.map((d: any) => ({ id: d.id, title: d.title, docNo: d.documentNumber, isUserUploaded: d.isUserUploaded })));
}

console.log('\n6. academicSessions in Firestore:', raw.academicSessions?.count);
if (raw.academicSessions?.docs) {
  console.log('Sessions:', raw.academicSessions.docs.map((d: any) => d.id));
}
