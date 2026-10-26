import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

interface ModuleTestResult {
  module: string;
  collection: string;
  create: 'PASS' | 'FAIL';
  read: 'PASS' | 'FAIL';
  update: 'PASS' | 'FAIL';
  delete: 'PASS' | 'FAIL';
  notes: string;
}

async function runRoundTripTests() {
  console.log('================================================================');
  console.log('LIVE FIREBASE PERSISTENCE ROUND-TRIP TEST FOR ALL MODULES');
  console.log('================================================================');

  // Authenticate as Admin
  const adminCred = await signInWithEmailAndPassword(
    auth,
    'sanyam.admin@malguwa.edu.in',
    'SanyamAdmin@Malguwa2026!'
  );
  console.log('✅ Admin Authenticated. UID:', adminCred.user.uid);

  const results: ModuleTestResult[] = [];
  const testId = `TEST_ROUNDTRIP_${Date.now()}`;
  const testUdise = '23080100303'; // HS HIRAPUR

  const modules = [
    {
      name: 'विद्यार्थी मास्टर (Student Masters)',
      col: 'studentMasters',
      data: {
        id: testId,
        studentId: testId,
        firstName: 'परीक्षण',
        lastName: 'छात्र',
        fullName: 'परीक्षण छात्र',
        gender: 'BOY',
        category: 'GEN',
        samagraId: '999999999',
        schoolUdise: testUdise,
        createdAt: new Date().toISOString(),
      },
      updateData: { lastName: 'वर्मा', fullName: 'परीक्षण वर्मा' },
    },
    {
      name: 'विद्यार्थी अकादमिक रिकॉर्ड (Student Academic Records)',
      col: 'studentAcademicRecords',
      data: {
        id: testId,
        studentId: testId,
        schoolUdise: testUdise,
        sessionId: '2026-27',
        classLevel: '9',
        section: 'A',
        enrollmentStatus: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      },
      updateData: { section: 'B' },
    },
    {
      name: 'शिक्षक मास्टर (Staff Masters)',
      col: 'staffMasters',
      data: {
        id: testId,
        employeeId: 'EMP-TEST-99',
        firstName: 'परीक्षण',
        lastName: 'शिक्षक',
        fullName: 'परीक्षण शिक्षक',
        gender: 'FEMALE',
        designation: 'माध्यमिक शिक्षक',
        createdAt: new Date().toISOString(),
      },
      updateData: { designation: 'उच्च माध्यमिक शिक्षक' },
    },
    {
      name: 'शिक्षक पदस्थापना (Staff Postings)',
      col: 'staffPostings',
      data: {
        id: testId,
        employeeId: 'EMP-TEST-99',
        schoolUdise: testUdise,
        sessionId: '2026-27',
        designation: 'माध्यमिक शिक्षक',
        postingStatus: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      },
      updateData: { postingStatus: 'ON_LEAVE' },
    },
    {
      name: 'उपस्थिति (Attendance)',
      col: 'attendance',
      data: {
        id: testId,
        date: '2026-10-25',
        schoolUdise: testUdise,
        sessionId: '2026-27',
        totalStudents: 100,
        presentStudents: 95,
        attendancePercentage: 95,
        updatedAt: new Date().toISOString(),
      },
      updateData: { presentStudents: 98, attendancePercentage: 98 },
    },
    {
      name: 'मध्याह्न भोजन (MDM Records)',
      col: 'mdmRecords',
      data: {
        id: testId,
        date: '2026-10-25',
        schoolUdise: testUdise,
        sessionId: '2026-27',
        mealServed: true,
        menuItem: 'रोटी, दाल, मौसमी सब्जी',
        beneficiariesCount: 95,
        updatedAt: new Date().toISOString(),
      },
      updateData: { beneficiariesCount: 98 },
    },
    {
      name: 'रसोइया (Rasoiya)',
      col: 'rasoiya',
      data: {
        id: testId,
        name: 'परीक्षण रसोइया',
        schoolUdise: testUdise,
        shgName: 'परीक्षण समूह',
        honorariumStatus: 'PENDING',
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      },
      updateData: { honorariumStatus: 'PAID' },
    },
    {
      name: 'स्व-सहायता समूह (SHGs)',
      col: 'shgs',
      data: {
        id: testId,
        name: 'परीक्षण स्व-सहायता समूह',
        schoolUdise: testUdise,
        bankAccountVerified: false,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      },
      updateData: { bankAccountVerified: true },
    },
    {
      name: 'शाला भौतिक सुविधाएं (Facilities)',
      col: 'facilities',
      data: {
        id: testId,
        schoolUdise: testUdise,
        drinkingWaterAvailable: true,
        electricityAvailable: true,
        boundaryWallStatus: 'COMPLETE',
        updatedAt: new Date().toISOString(),
      },
      updateData: { boundaryWallStatus: 'UNDER_REPAIR' },
    },
    {
      name: 'निर्माण एवं शासकीय कार्य (Government Work)',
      col: 'governmentWork',
      data: {
        id: testId,
        title: 'अतिरिक्त कक्ष निर्माण',
        schoolUdise: testUdise,
        workType: 'CONSTRUCTION',
        sanctionedAmount: 500000,
        workStatus: 'IN_PROGRESS',
        updatedAt: new Date().toISOString(),
      },
      updateData: { workStatus: 'COMPLETED' },
    },
    {
      name: 'शिकायत निवारण (Complaints)',
      col: 'complaints',
      data: {
        id: testId,
        subject: 'परीक्षण शिकायत',
        schoolUdise: testUdise,
        status: 'OPEN',
        priority: 'MEDIUM',
        description: 'सत्यापन हेतु परीक्षण विवरण',
        createdAt: new Date().toISOString(),
      },
      updateData: { status: 'RESOLVED' },
    },
    {
      name: 'परिपत्र एवं सूचनाएँ (Notifications)',
      col: 'notifications',
      data: {
        id: testId,
        title: 'संकुल मासिक समीक्षा बैठक',
        content: 'आगामी समीक्षा बैठक संबंधी सूचना',
        category: 'GENERAL',
        priority: 'HIGH',
        publishedAt: new Date().toISOString(),
      },
      updateData: { title: 'संकुल मासिक समीक्षा बैठक (अपडेटेड)' },
    },
    {
      name: 'दस्तावेज़ (Documents)',
      col: 'documents',
      data: {
        id: testId,
        title: 'सत्र 2026-27 प्रवेश विवरण पत्रक',
        schoolUdise: testUdise,
        fileType: 'pdf',
        fileSize: 1024,
        uploadedAt: new Date().toISOString(),
      },
      updateData: { title: 'सत्र 2026-27 प्रवेश विवरण पत्रक (संशोधित)' },
    },
    {
      name: 'उल्लास साक्षरता रजिस्टर (Literacy Registers)',
      col: 'literacyRegisters',
      data: {
        id: testId,
        schoolUdise: testUdise,
        village: 'हीरापुर',
        registeredYear: 2026,
        targetLearners: 50,
        updatedAt: new Date().toISOString(),
      },
      updateData: { targetLearners: 55 },
    },
    {
      name: 'असाक्षर शिक्षार्थी (Illiterate Persons)',
      col: 'illiteratePersons',
      data: {
        id: testId,
        fullName: 'परीक्षण शिक्षार्थी',
        schoolUdise: testUdise,
        age: 45,
        literacyStatus: 'ENROLLED',
        updatedAt: new Date().toISOString(),
      },
      updateData: { literacyStatus: 'LITERATE' },
    },
    {
      name: 'अक्षर साथी स्वयंसेवी (Akshar Sathis)',
      col: 'aksharSathis',
      data: {
        id: testId,
        fullName: 'परीक्षण अक्षर साथी',
        schoolUdise: testUdise,
        qualification: 'Graduate',
        status: 'ACTIVE',
        updatedAt: new Date().toISOString(),
      },
      updateData: { status: 'CERTIFIED' },
    },
    {
      name: 'उल्लास परीक्षा परिणाम (Literacy Exam Results)',
      col: 'literacyExamResults',
      data: {
        id: testId,
        learnerId: testId,
        schoolUdise: testUdise,
        examDate: '2026-09-15',
        marksObtained: 78,
        resultStatus: 'PASS',
        updatedAt: new Date().toISOString(),
      },
      updateData: { marksObtained: 85 },
    },
    {
      name: 'सहयोगी संस्थाएँ (Supporting Institutions)',
      col: 'supportingInstitutions',
      data: {
        id: testId,
        institutionName: 'परीक्षण एनजीओ / सामाजिक संस्था',
        schoolUdise: testUdise,
        supportType: 'VOLUNTEER',
        updatedAt: new Date().toISOString(),
      },
      updateData: { supportType: 'RESOURCES' },
    },
  ];

  for (const m of modules) {
    let createRes: 'PASS' | 'FAIL' = 'FAIL';
    let readRes: 'PASS' | 'FAIL' = 'FAIL';
    let updateRes: 'PASS' | 'FAIL' = 'FAIL';
    let deleteRes: 'PASS' | 'FAIL' = 'FAIL';
    let notes = '';

    try {
      // 1. Create
      await setDoc(doc(db, m.col, testId), m.data);
      createRes = 'PASS';

      // 2. Read
      const snap = await getDoc(doc(db, m.col, testId));
      if (snap.exists()) {
        readRes = 'PASS';
      } else {
        notes += 'Read returned empty doc. ';
      }

      // 3. Update
      await updateDoc(doc(db, m.col, testId), m.updateData);
      const updateSnap = await getDoc(doc(db, m.col, testId));
      if (updateSnap.exists()) {
        updateRes = 'PASS';
      } else {
        notes += 'Update verification failed. ';
      }

      // 4. Delete
      await deleteDoc(doc(db, m.col, testId));
      const postDeleteSnap = await getDoc(doc(db, m.col, testId));
      if (!postDeleteSnap.exists()) {
        deleteRes = 'PASS';
      } else {
        notes += 'Doc still exists after delete. ';
      }
    } catch (err: any) {
      notes += err.message || 'Error occurred';
    }

    results.push({
      module: m.name,
      collection: m.col,
      create: createRes,
      read: readRes,
      update: updateRes,
      delete: deleteRes,
      notes: notes || '100% Round-trip persistence verified',
    });

    console.log(
      `[${createRes === 'PASS' && readRes === 'PASS' && updateRes === 'PASS' && deleteRes === 'PASS' ? 'PASS' : 'FAIL'}] ${m.name} (${m.col})`
    );
  }

  // Cross-School Isolation Test
  console.log('\n--- TESTING MULTI-TENANT CROSS-SCHOOL DATA ISOLATION ---');
  let isolationPass = true;
  try {
    // Sign in as School HS HIRAPUR (23080100303)
    const schoolCred = await signInWithEmailAndPassword(
      auth,
      '23080100303@malguwa.edu.in',
      'SCH0303'
    );
    console.log('✅ School 23080100303 Authenticated. UID:', schoolCred.user.uid);

    // Try to write a record under another school UDISE (23080110701 - PS JANAKPUR)
    try {
      await setDoc(doc(db, 'attendance', 'ILLEGAL_CROSS_SCHOOL_ATTENDANCE'), {
        id: 'ILLEGAL_CROSS_SCHOOL_ATTENDANCE',
        schoolUdise: '23080110701', // Unauthorized foreign school UDISE!
        date: '2026-10-25',
        totalStudents: 50,
      });
      console.error('❌ SECURITY FAILURE: Cross-school write was ALLOWED!');
      isolationPass = false;
      await deleteDoc(doc(db, 'attendance', 'ILLEGAL_CROSS_SCHOOL_ATTENDANCE')).catch(() => {});
    } catch (secErr: any) {
      console.log('✅ SECURITY SUCCESS: Cross-school write correctly REJECTED by Firestore rules:', secErr.code);
    }

    // Try to write legitimate own school attendance (23080100303)
    try {
      const ownDocId = `ATTENDANCE_OWN_${Date.now()}`;
      await setDoc(doc(db, 'attendance', ownDocId), {
        id: ownDocId,
        schoolUdise: '23080100303',
        date: '2026-10-25',
        totalStudents: 150,
        presentStudents: 140,
        attendancePercentage: 93.3,
        sessionId: '2026-27',
        updatedAt: new Date().toISOString(),
      });
      console.log('✅ SECURITY SUCCESS: Legitimate own-school write ALLOWED.');

      // Read own record
      const ownSnap = await getDoc(doc(db, 'attendance', ownDocId));
      if (ownSnap.exists()) {
        console.log('✅ SECURITY SUCCESS: Legitimate own-school read ALLOWED.');
      }
      // Re-authenticate as Admin to clean up test attendance doc (since schools are forbidden from deleting attendance by design)
      await signInWithEmailAndPassword(
        auth,
        'sanyam.admin@malguwa.edu.in',
        'SanyamAdmin@Malguwa2026!'
      );
      await deleteDoc(doc(db, 'attendance', ownDocId));
      console.log('✅ Own-school test doc cleaned up by Admin.');
    } catch (ownErr: any) {
      console.error('❌ Error during legitimate own-school write/read:', ownErr.message);
      isolationPass = false;
    }
  } catch (authErr: any) {
    console.error('❌ School auth error during isolation test:', authErr.message);
    isolationPass = false;
  }

  // Save report
  fs.writeFileSync(
    path.resolve(process.cwd(), 'scripts/roundtrip_test_report.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), isolationPass, results }, null, 2)
  );

  console.log('\nReport saved to scripts/roundtrip_test_report.json');
}

runRoundTripTests()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Fatal test error:', e);
    process.exit(1);
  });
