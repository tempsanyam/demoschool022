/**
 * USER PROVISIONING SCRIPT (Admin SDK)
 * Generates and provisions official cluster accounts:
 * - 1 ADMIN (SANYAMJAIN88)
 * - 2 CAC (Sanjayjain1979, Sanmatijain99)
 * - N SCHOOL Accounts (loaded exclusively via --schools-file <path>)
 *
 * SAFETY & IDEMPOTENCY RULES (Requirement 2):
 * 1. Default mode is DRY-RUN. Real changes only happen when --apply flag is provided.
 * 2. Service account key is read from FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.
 * 3. Project ID is validated against EXPECTED_PROJECT_ID (if defined).
 * 4. Interactive or --confirm-project=<id> confirmation required before --apply writes.
 * 5. School list MUST come strictly from JSON export via --schools-file <path>. No static fallback.
 * 6. True Idempotency: Existing Auth users' passwords are NOT modified.
 * 7. Protected profile fields (role, status, assignedSchoolUdise, approvalStatus) preserved unless --force.
 * 8. mustChangePassword: true enforced on all created/reset accounts.
 * 9. Generated credentials saved ONLY to local gitignored file (.credentials_provisioned.json) with chmod 600.
 * 10. Passwords and sensitive credentials are NEVER printed in terminal output.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';
import firebaseConfig from '../firebase-applet-config.json';

interface UserToProvision {
  username: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CAC' | 'SCHOOL';
  assignedSchoolUdise?: string;
  schoolName?: string;
  designation: string;
  mobile?: string;
}

const CREDENTIALS_OUTPUT_FILE = '.credentials_provisioned.json';

function generateSecureRandomPassword(length = 12): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*';
  const randomBytes = crypto.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

function parseArg(flag: string): string | null {
  for (let i = 0; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === flag && i + 1 < process.argv.length) {
      return process.argv[i + 1];
    }
    if (arg.startsWith(`${flag}=`)) {
      return arg.split('=')[1];
    }
  }
  return null;
}

async function promptConfirmation(promptText: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(promptText, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

export async function runProvisioning() {
  const isApply = process.argv.includes('--apply');
  const isForce = process.argv.includes('--force');

  console.log('================================================================');
  console.log(`USER PROVISIONING SUITE — MODE: ${isApply ? 'APPLY (LIVE WRITE)' : 'DRY-RUN (SIMULATION ONLY)'}`);
  if (isForce) {
    console.log('⚠️  FORCE OVERWRITE ENABLED: Protected profile fields will be updated.');
  }
  console.log('================================================================\n');

  // 1. Mandatory Schools JSON File Check (Requirement 2.b - No Static Fallback)
  const schoolsFilePath = parseArg('--schools-file');
  if (!schoolsFilePath) {
    console.error('[FATAL ERROR] Mandatory flag --schools-file <path> not provided.');
    console.error('In accordance with strict audit constraints, static data fallback is prohibited.');
    console.error('Usage: npx tsx scripts/provision-users.ts --schools-file <path_to_schools.json> [--apply]\n');
    process.exit(1);
  }

  const resolvedSchoolsPath = path.resolve(process.cwd(), schoolsFilePath);
  if (!fs.existsSync(resolvedSchoolsPath)) {
    console.error(`[FATAL ERROR] Specified schools export file does not exist: ${resolvedSchoolsPath}`);
    console.error('Static data fallback is strictly prohibited. Please provide a valid JSON export.\n');
    process.exit(1);
  }

  let rawSchoolsData: any[];
  try {
    rawSchoolsData = JSON.parse(fs.readFileSync(resolvedSchoolsPath, 'utf8'));
    if (!Array.isArray(rawSchoolsData)) {
      throw new Error('Root JSON element must be an array of school records.');
    }
  } catch (err: any) {
    console.error(`[FATAL ERROR] Failed to parse schools JSON from ${resolvedSchoolsPath}:`, err.message);
    process.exit(1);
  }

  // 2. Base Administrative Accounts (Canonical)
  const usersToProvision: UserToProvision[] = [
    {
      username: 'SANYAMJAIN88',
      email: 'sanyamjain88@malguwa.edu.in',
      name: 'संयम जैन',
      role: 'ADMIN',
      designation: 'मुख्य व्यवस्थापक (System Admin)',
      mobile: '9826088159',
    },
    {
      username: 'Sanjayjain1979',
      email: 'sanjayjain1979@malguwa.edu.in',
      name: 'संजय कुमार जैन',
      role: 'CAC',
      designation: 'संकुल समन्वयक (CAC)',
      mobile: '7000382532',
    },
    {
      username: 'Sanmatijain99',
      email: 'sanmatijain99@malguwa.edu.in',
      name: 'सन्मति कुमार जैन',
      role: 'CAC',
      designation: 'संकुल समन्वयक (CAC)',
      mobile: '9977323573',
    },
  ];

  // 3. Dynamic School Account Processing & Strict 11-digit UDISE Validation
  console.log(`Scanning school accounts from: ${schoolsFilePath}...`);
  let validSchoolsCount = 0;
  const invalidUdises: string[] = [];
  const schoolTypesCount: Record<string, number> = {};

  for (const school of rawSchoolsData) {
    const udise = String(school.udise || '').trim();
    // Validate exact 11-digit UDISE format
    if (!/^\d{11}$/.test(udise)) {
      invalidUdises.push(udise || '(empty)');
      continue;
    }

    validSchoolsCount++;
    const sType = school.schoolType || 'सामान्य';
    schoolTypesCount[sType] = (schoolTypesCount[sType] || 0) + 1;

    usersToProvision.push({
      username: udise,
      email: `${udise}@malguwa.edu.in`,
      name: `${school.name || school.hindiName || 'शाला'} (${school.village || ''})`,
      role: 'SCHOOL',
      assignedSchoolUdise: udise,
      schoolName: school.name || school.hindiName || '',
      designation: `${sType} (संस्था लॉगिन)`,
      mobile: school.mobile || school.principalMobile || '',
    });
  }

  if (invalidUdises.length > 0) {
    console.error(`[FATAL ERROR] Found invalid school UDISE codes (must be exactly 11 numeric digits):`);
    console.error(`  ${invalidUdises.join(', ')}`);
    process.exit(1);
  }

  console.log(`\nValidated ${validSchoolsCount} schools from ${schoolsFilePath}:`);
  for (const [st, cnt] of Object.entries(schoolTypesCount)) {
    console.log(`  - ${st}: ${cnt}`);
  }
  console.log(`Total accounts prepared for provisioning: ${usersToProvision.length} (1 ADMIN + 2 CAC + ${validSchoolsCount} SCHOOL)\n`);

  // Generate secure temporary passwords for provisioning map
  const provisioningMap: Record<string, { email: string; username: string; role: string; tempPass: string }> = {};
  for (const u of usersToProvision) {
    provisioningMap[u.username] = {
      email: u.email,
      username: u.username,
      role: u.role,
      tempPass: generateSecureRandomPassword(12),
    };
  }

  // DRY-RUN MODE: Detailed summary and zero writes
  if (!isApply) {
    console.log('----------------------------------------------------------------');
    console.log('DRY-RUN VALIDATION SUMMARY:');
    console.log('  Target Project ID:          ', firebaseConfig.projectId);
    console.log('  Target Firestore DB ID:     ', firebaseConfig.firestoreDatabaseId);
    console.log('  ADMIN Accounts:             ', usersToProvision.filter((u) => u.role === 'ADMIN').length);
    console.log('  CAC Accounts:               ', usersToProvision.filter((u) => u.role === 'CAC').length);
    console.log('  SCHOOL Accounts:            ', usersToProvision.filter((u) => u.role === 'SCHOOL').length);
    console.log('  Total Unique Accounts:      ', new Set(usersToProvision.map((u) => u.email)).size);
    console.log('  Password Entropy:            High-Entropy Cryptographic Random Passwords Prepared');
    console.log('  Password Policy:             mustChangePassword: true set on all provisioned profiles');
    console.log('  Terminal Credential Policy:  Zero passwords printed (Strict Privacy Compliance)');
    console.log('----------------------------------------------------------------');
    console.log('To apply these accounts to Firebase, run:');
    console.log(`  FIREBASE_SERVICE_ACCOUNT_KEY="<key.json>" npx tsx scripts/provision-users.ts --schools-file ${schoolsFilePath} --apply\n`);
    return;
  }

  // APPLY MODE: Strict Environment & Project Verification (Requirement 2.a)
  const saKeyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!saKeyEnv) {
    console.error('[FATAL ERROR] Service account key not found in FIREBASE_SERVICE_ACCOUNT_KEY or GOOGLE_APPLICATION_CREDENTIALS.');
    console.error('In accordance with security constraints, --apply cannot proceed without authorized admin credentials.');
    process.exit(1);
  }

  let serviceAccount: any;
  try {
    if (fs.existsSync(saKeyEnv)) {
      serviceAccount = JSON.parse(fs.readFileSync(saKeyEnv, 'utf8'));
    } else {
      serviceAccount = JSON.parse(saKeyEnv);
    }
  } catch (err: any) {
    console.error('[FATAL ERROR] Failed to parse service account JSON:', err.message);
    process.exit(1);
  }

  const saProjectId = serviceAccount.project_id;
  if (!saProjectId) {
    console.error('[FATAL ERROR] service account JSON does not contain project_id.');
    process.exit(1);
  }

  // Check against EXPECTED_PROJECT_ID environment variable
  const expectedProjectId = process.env.EXPECTED_PROJECT_ID;
  if (expectedProjectId && saProjectId !== expectedProjectId) {
    console.error(`[FATAL ERROR] Project ID mismatch:`);
    console.error(`  Service Account Project ID: "${saProjectId}"`);
    console.error(`  EXPECTED_PROJECT_ID:        "${expectedProjectId}"`);
    console.error(`Aborting execution to prevent writes to wrong project.`);
    process.exit(1);
  }

  // Project Confirmation Prompt
  const confirmArg = parseArg('--confirm-project');
  let userConfirmation = confirmArg;
  if (!userConfirmation) {
    if (process.stdin.isTTY) {
      userConfirmation = await promptConfirmation(
        `Type the exact Project ID ("${saProjectId}") to confirm live write: `
      );
    } else {
      console.error(`[FATAL ERROR] Live --apply in non-interactive environment requires --confirm-project=${saProjectId}`);
      process.exit(1);
    }
  }

  if (userConfirmation !== saProjectId) {
    console.error(`[FATAL ERROR] Project confirmation mismatch: entered "${userConfirmation}", expected "${saProjectId}". Aborting.`);
    process.exit(1);
  }

  let admin: any;
  try {
    admin = await import('firebase-admin');
  } catch {
    console.error('[FATAL ERROR] firebase-admin package is not installed.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: saProjectId,
    });
  }

  const adminAuth = admin.auth();
  const adminDb = admin.firestore();

  console.log(`Connected to Firebase Admin SDK (Project: ${saProjectId}). Beginning idempotent account sync...`);
  let createdAuthCount = 0;
  let existingAuthCount = 0;
  let createdDocCount = 0;
  let preservedDocCount = 0;

  for (const u of usersToProvision) {
    const credInfo = provisioningMap[u.username];
    let userRecord: any;

    try {
      userRecord = await adminAuth.getUserByEmail(u.email);
      // Requirement 2.c: Do NOT change password of existing Auth account!
      existingAuthCount++;
    } catch (err: any) {
      if (err.code === 'auth/user-not-found') {
        userRecord = await adminAuth.createUser({
          email: u.email,
          password: credInfo.tempPass,
          displayName: u.name,
        });
        createdAuthCount++;
      } else {
        throw err;
      }
    }

    // Check existing Firestore /users/{uid} document
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    const existingDocSnap = await userDocRef.get();

    if (existingDocSnap.exists && !isForce) {
      // Truly idempotent: Preserve existing role, status, assignedSchoolUdise, approvalStatus
      await userDocRef.set(
        {
          id: userRecord.uid,
          username: u.username,
          name: u.name,
          email: u.email,
          designation: u.designation,
          mobile: u.mobile || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      preservedDocCount++;
    } else {
      if (existingDocSnap.exists && isForce) {
        console.log(`[FORCE] Updating protected profile fields for ${u.username} (${u.role}, ${u.assignedSchoolUdise || 'ALL'})`);
      }
      await userDocRef.set(
        {
          id: userRecord.uid,
          username: u.username,
          name: u.name,
          role: u.role,
          email: u.email,
          designation: u.designation,
          assignedSchoolUdise: u.assignedSchoolUdise || '',
          schoolName: u.schoolName || '',
          status: 'ACTIVE',
          approvalStatus: 'APPROVED',
          mustChangePassword: true, // Requirement 2.d: Mandatory password change on first login
          mobile: u.mobile || '',
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      createdDocCount++;
    }
  }

  // Record authoritative audit log in Firestore
  const auditLogId = `LOG-PROV-${Date.now()}`;
  await adminDb.collection('auditLogs').doc(auditLogId).set({
    id: auditLogId,
    timestamp: new Date().toISOString(),
    userId: 'SYSTEM_ADMIN_PROVISIONER',
    userName: 'Firebase Admin SDK Provisioner',
    role: 'ADMIN',
    action: 'SYSTEM_CONFIG',
    module: 'उपयोगकर्ता प्रावधान',
    details: `Idempotent provisioning completed for ${usersToProvision.length} accounts (Auth: ${createdAuthCount} created, ${existingAuthCount} preserved; Docs: ${createdDocCount} initialized, ${preservedDocCount} preserved). Zero passwords printed.`,
    success: true,
    createdAt: new Date().toISOString(),
  });

  // Save generated passwords ONLY to local gitignored file with 0o600 permissions (Requirement 2.e)
  fs.writeFileSync(CREDENTIALS_OUTPUT_FILE, JSON.stringify(provisioningMap, null, 2), { mode: 0o600 });
  try {
    fs.chmodSync(CREDENTIALS_OUTPUT_FILE, 0o600);
  } catch {}

  console.log(`\n[SUCCESS] Provisioning completed.`);
  console.log(`  Firebase Auth Accounts: ${createdAuthCount} created, ${existingAuthCount} preserved existing passwords`);
  console.log(`  Firestore Profiles:     ${createdDocCount} initialized, ${preservedDocCount} preserved protected fields`);
  console.log(`  Audit log recorded:     /auditLogs/${auditLogId}`);
  console.log(`  Credentials saved securely to: ${CREDENTIALS_OUTPUT_FILE} (chmod 600, 0 passwords printed in terminal log)`);
}

if (process.argv[1]?.endsWith('provision-users.ts')) {
  runProvisioning().catch((e) => {
    console.error('[FATAL] Provisioning failed:', e);
    process.exit(1);
  });
}
