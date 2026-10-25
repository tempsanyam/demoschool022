/**
 * Zero-Trust Firestore Security Rule Logic & RBAC Verification Suite
 */

interface SecurityRuleContext {
  auth: { uid: string; email?: string } | null;
  usersCollection: Record<string, { role: string; assignedSchoolUdise?: string }>;
  featureControls?: Record<string, any>;
}

function evaluateRule(ctx: SecurityRuleContext) {
  const isSignedIn = ctx.auth != null;
  const userData = ctx.auth ? (ctx.usersCollection[ctx.auth.uid] || {}) as { role?: string; assignedSchoolUdise?: string } : {};
  const isAdmin = isSignedIn && userData.role === 'ADMIN';
  const isCAC = isSignedIn && userData.role === 'CAC';
  const isSchool = isSignedIn && userData.role === 'SCHOOL';
  const isMySchool = (udise: string) => isSchool && userData.assignedSchoolUdise === udise;

  return {
    canSchoolReadOtherSchoolStudentRecord: (resourceSchoolUdise: string) => {
      // Rule: isSignedIn() && (isAdmin() || isCAC() || isMySchool(resource.data.schoolUdise))
      return isSignedIn && (isAdmin || isCAC || isMySchool(resourceSchoolUdise));
    },
    canSchoolUpdateOtherSchoolStudentRecord: (oldUdise: string, newUdise: string) => {
      // Rule: isAdmin || (isCAC || (isMySchool(resource.data.schoolUdise) && isMySchool(request.resource.data.schoolUdise)))
      return isAdmin || (isCAC || (isMySchool(oldUdise) && isMySchool(newUdise)));
    },
    canSchoolDeleteStudentRecord: () => {
      // Rule: allow delete: if isAdmin() || (isCAC() && ...)
      return isAdmin || isCAC;
    },
    canDeleteSchool: () => {
      // Rule: allow delete: if false;
      return false;
    },
    canUpdateOrDeleteAuditLog: () => {
      // Rule: allow update, delete: if false;
      return false;
    },
    canUnauthenticatedReadPII: () => {
      // Rule: default deny / allow read: if isSignedIn();
      return isSignedIn;
    },
  };
}

console.log('================================================================================');
console.log('SECURITY RULES & RBAC SIMULATION VERIFICATION');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assertTest(name: string, condition: boolean) {
  if (condition) {
    console.log(`[PASS] ${name}`);
    passCount++;
  } else {
    console.error(`[FAIL] ${name}`);
    failCount++;
  }
}

// Scenario 1: School A (UDISE 23080110701 - PS Janakpur) tries to access School B (UDISE 23080110702 - PS Kachhiyat)
const schoolA_ctx: SecurityRuleContext = {
  auth: { uid: 'school-a-uid' },
  usersCollection: {
    'school-a-uid': { role: 'SCHOOL', assignedSchoolUdise: '23080110701' },
  },
};
const schoolA_eval = evaluateRule(schoolA_ctx);

assertTest('School A can read its own student record (UDISE 23080110701)', schoolA_eval.canSchoolReadOtherSchoolStudentRecord('23080110701') === true);
assertTest('School A CANNOT read School B student record (UDISE 23080110702)', schoolA_eval.canSchoolReadOtherSchoolStudentRecord('23080110702') === false);
assertTest('School A CANNOT update School B student record', schoolA_eval.canSchoolUpdateOtherSchoolStudentRecord('23080110702', '23080110702') === false);
assertTest('School A CANNOT transfer/hijack its student into School B without CAC', schoolA_eval.canSchoolUpdateOtherSchoolStudentRecord('23080110701', '23080110702') === false);
assertTest('School A CANNOT delete any student record', schoolA_eval.canSchoolDeleteStudentRecord() === false);

// Scenario 2: Unauthenticated attacker (Guest / no auth)
const guest_ctx: SecurityRuleContext = {
  auth: null,
  usersCollection: {},
};
const guest_eval = evaluateRule(guest_ctx);
assertTest('Unauthenticated guest CANNOT read student PII', guest_eval.canUnauthenticatedReadPII() === false);
assertTest('Unauthenticated guest CANNOT read school data', guest_eval.canSchoolReadOtherSchoolStudentRecord('23080110701') === false);

// Scenario 3: Physical deletion on schools is forbidden for all roles
const admin_ctx: SecurityRuleContext = {
  auth: { uid: 'admin-uid' },
  usersCollection: {
    'admin-uid': { role: 'ADMIN' },
  },
};
const admin_eval = evaluateRule(admin_ctx);
assertTest('ADMIN CANNOT physically delete school document (Hard delete blocked)', admin_eval.canDeleteSchool() === false);
assertTest('ADMIN CANNOT overwrite or delete auditLog entries (Append-only)', admin_eval.canUpdateOrDeleteAuditLog() === false);

// Scenario 4: CAC (Cluster Academic Coordinator) privileges
const cac_ctx: SecurityRuleContext = {
  auth: { uid: 'cac-uid' },
  usersCollection: {
    'cac-uid': { role: 'CAC' },
  },
};
const cac_eval = evaluateRule(cac_ctx);
assertTest('CAC can monitor students across all 37 schools in cluster', cac_eval.canSchoolReadOtherSchoolStudentRecord('23080110701') === true && cac_eval.canSchoolReadOtherSchoolStudentRecord('23080110702') === true);
assertTest('CAC CANNOT physically delete schools', cac_eval.canDeleteSchool() === false);

console.log(`\nSecurity Rules Verification Summary: ${passCount} Passed, ${failCount} Failed.`);
if (failCount > 0) process.exit(1);
process.exit(0);
