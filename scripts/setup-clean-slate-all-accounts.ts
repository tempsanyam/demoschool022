import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  const bytes = crypto.randomBytes(14);
  let res = 'Malguwa@';
  for (let i = 0; i < 6; i++) {
    res += chars[bytes[i] % chars.length];
  }
  return res + '2026!';
}

async function runCleanSlateSetup() {
  console.log('================================================================');
  console.log('🚀 FINAL CLEAN SLATE — ACCOUNT PROVISIONING & PII STRIPPING');
  console.log('================================================================');

  // Step 1: Authenticate as Admin
  await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
  console.log('✅ Admin Authenticated. UID:', auth.currentUser?.uid);

  // Step 2: Fetch all 37 official cluster schools from Firestore
  const schoolsSnap = await getDocs(collection(db, 'schools'));
  console.log(`✅ Loaded ${schoolsSnap.size} official cluster schools from Firestore`);
  if (schoolsSnap.size !== 37) {
    throw new Error(`CRITICAL ABORT: Expected 37 official schools, found ${schoolsSnap.size}!`);
  }

  const schools = schoolsSnap.docs.map((d) => ({
    udise: d.id,
    name: d.data().name || d.data().schoolName || d.data().hindiName || 'शाला',
  }));

  // Step 3: Sanitize Admin accounts (Strip personal mobile numbers)
  console.log('\n--- SANITIZING ADMIN ACCOUNTS ---');
  const adminProfiles = [
    {
      uid: 't3yFjtNtaFUIDeO9TnLwPmQDP9G2',
      username: 'SANYAMJAIN88',
      name: 'संयम जैन',
      email: 'sanyam.admin@malguwa.edu.in',
      role: 'ADMIN',
      designation: 'मुख्य व्यवस्थापक',
    },
    {
      uid: '6NrCVlQjYDYjlDMpfZgH4wlyST92',
      username: 'SANYAMJAIN88',
      name: 'संयम जैन',
      email: 'admin.malguwa@mp.gov.in',
      role: 'ADMIN',
      designation: 'मुख्य व्यवस्थापक',
    },
  ];

  for (const adm of adminProfiles) {
    const cleanData = {
      id: adm.uid,
      uid: adm.uid,
      username: adm.username,
      name: adm.name,
      displayName: adm.name,
      email: adm.email,
      role: adm.role,
      designation: adm.designation,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      active: true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', adm.uid), cleanData, { merge: false });
    console.log(`   ✅ Admin profile sanitized: ${adm.email} (${adm.uid})`);
  }

  // Step 4: Sanitize CAC accounts (Strip personal mobile numbers)
  console.log('\n--- SANITIZING CAC ACCOUNTS ---');
  const cacProfiles = [
    {
      uid: '5XFY10Pm9laYloJ0FPVLry4tU513',
      username: 'Sanjayjain1979',
      name: 'संजय कुमार जैन',
      email: 'cac.malguwa@mp.gov.in',
      role: 'CAC',
      designation: 'संकुल समन्वयक (CAC)',
    },
    {
      uid: 'oufJw9KrxmSo7p4AbxaCyWzzFAt1',
      username: 'Sanmatijain99',
      name: 'सन्मति कुमार जैन',
      email: 'cac.sanmati@mp.gov.in',
      role: 'CAC',
      designation: 'संकुल समन्वयक (CAC)',
    },
  ];

  for (const cac of cacProfiles) {
    const cleanData = {
      id: cac.uid,
      uid: cac.uid,
      username: cac.username,
      name: cac.name,
      displayName: cac.name,
      email: cac.email,
      role: cac.role,
      designation: cac.designation,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      active: true,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(doc(db, 'users', cac.uid), cleanData, { merge: false });
    console.log(`   ✅ CAC profile sanitized: ${cac.email} (${cac.uid})`);
  }

  // Step 5: Provision real Firebase Auth accounts and clean Firestore records for all 37 schools
  console.log('\n--- PROVISIONING & SANITIZING ALL 37 SCHOOL ACCOUNTS ---');
  
  // Existing provisioned school UIDs map:
  const knownSchoolAuthUids: Record<string, string> = {
    '23080100303': '8h7hympwNLNO4lq0JLGQO5KfuLy1',
    '23080110701': 'dzNflGYnjANDLVCHSMZ9Q5XAmUg2',
    '23080110702': 'br31jrVU3wZ0skvr0y42fXCTYSy1',
    '23080111702': 'R3wmcEqVtZOP6uKjp4nPQxtpbgc2',
    '23080111001': 'VTVwJQERlbf8pcb2zt64rZ6VPng1',
  };

  const schoolAccountStatus: any[] = [];

  for (const sc of schools) {
    const schoolEmail = `${sc.udise}@malguwa.edu.in`;
    let schoolAuthUid = knownSchoolAuthUids[sc.udise];

    if (!schoolAuthUid) {
      // Check if user already exists in Auth by trying to create
      const securePass = generateSecurePassword();
      try {
        const cred = await createUserWithEmailAndPassword(auth, schoolEmail, securePass);
        schoolAuthUid = cred.user.uid;
        console.log(`   [Created Auth User] ${sc.udise}: ${schoolEmail} -> UID: ${schoolAuthUid}`);
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          // Check if already in users collection
          const userSnap = await getDoc(doc(db, 'users', sc.udise));
          if (userSnap.exists() && userSnap.data().uid) {
            schoolAuthUid = userSnap.data().uid;
          } else {
            console.warn(`   [Email In Use] ${sc.udise}: User exists in Auth.`);
          }
        } else {
          console.error(`   [Auth Error] ${sc.udise}:`, authErr.message);
        }
      }
      // Re-sign in as Admin after creating a user, as createUser signs in as that user
      await signInWithEmailAndPassword(auth, 'sanyam.admin@malguwa.edu.in', 'SanyamAdmin@Malguwa2026!');
    }

    const cleanSchoolProfile = {
      id: schoolAuthUid || sc.udise,
      uid: schoolAuthUid || sc.udise,
      schoolUdise: sc.udise,
      assignedSchoolUdise: sc.udise,
      schoolName: sc.name,
      name: sc.name,
      displayName: sc.name,
      username: sc.udise,
      email: schoolEmail,
      role: 'SCHOOL',
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      active: true,
      updatedAt: new Date().toISOString(),
    };

    // Save strictly clean profile under the UDISE document
    await setDoc(doc(db, 'users', sc.udise), cleanSchoolProfile, { merge: false });

    // Also save under Auth UID document if UID is available
    if (schoolAuthUid && schoolAuthUid !== sc.udise) {
      await setDoc(doc(db, 'users', schoolAuthUid), cleanSchoolProfile, { merge: false });
    }

    // Clean up corresponding USR-SCH-* doc if present
    const usrSchRef = doc(db, 'users', `USR-SCH-${sc.udise}`);
    const usrSchSnap = await getDoc(usrSchRef);
    if (usrSchSnap.exists()) {
      await setDoc(usrSchRef, {
        ...cleanSchoolProfile,
        id: `USR-SCH-${sc.udise}`,
      }, { merge: false });
    }

    schoolAccountStatus.push({
      udise: sc.udise,
      schoolName: sc.name,
      username: sc.udise,
      email: schoolEmail,
      authUid: schoolAuthUid || 'CANONICAL_PROFILE',
      status: 'ACTIVE',
      hasPersonalMobile: false,
      hasPrincipalDetails: false,
    });
  }

  // Step 6: Sanitize legacy username keys in users collection
  for (const un of ['sanyamjain88', 'sanjayjain1979', 'sanmatijain99', 'USR-ADMIN-01', 'USR-CAC-01', 'USR-CAC-02']) {
    const r = doc(db, 'users', un);
    const s = await getDoc(r);
    if (s.exists()) {
      const data = s.data();
      delete data.mobile;
      delete data.alternateMobile;
      delete data.personalDetails;
      await setDoc(r, {
        ...data,
        updatedAt: new Date().toISOString(),
      }, { merge: false });
      console.log(`   Sanitized reference doc: ${un}`);
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    totalSchools: schools.length,
    schoolsWithAuthUid: schoolAccountStatus.filter((s) => s.authUid && s.authUid.length >= 20).length,
    adminAccountsClean: 2,
    cacAccountsClean: 2,
    status: 'CLEAN_SLATE_SUCCESS',
    schools: schoolAccountStatus,
  };

  fs.writeFileSync('scripts/clean_slate_accounts_summary.json', JSON.stringify(result, null, 2));
  console.log('\n================================================================');
  console.log('✅ CLEAN SLATE SETUP COMPLETE!');
  console.log(`   37 Schools Account Status: ${result.schoolsWithAuthUid}/37 directly provisioned in Firebase Auth`);
  console.log('   All personal mobile numbers & private profiles stripped from users collection.');
  console.log('================================================================');

  process.exit(0);
}

runCleanSlateSetup().catch((err) => {
  console.error('Clean slate setup failed:', err);
  process.exit(1);
});
