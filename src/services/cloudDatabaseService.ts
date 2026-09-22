import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  deleteDoc,
  writeBatch,
  onSnapshot,
  Unsubscribe,
  query,
  limit,
} from 'firebase/firestore';
import { db, auth, testFirestoreConnection } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import {
  School,
  StudentMaster,
  StudentAcademicRecord,
  StaffMaster,
  StaffPosting,
  AttendanceRecord,
  MDMRecord,
  GovernmentWork,
  Complaint,
  PhysicalFacility,
  AcademicSession,
  Rasoiya,
  AuditLog,
  PreAuthSecurityEvent,
  User,
} from '../types';

/**
 * Clean data before sending to Firestore to avoid undefined field errors
 */
function sanitizeDoc<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = sanitizeDoc(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

// ----------------------
// Schools Sync
// ----------------------
export async function syncSchoolToCloud(school: School): Promise<void> {
  const path = 'schools';
  try {
    const docRef = doc(db, path, school.udise);
    await setDoc(docRef, sanitizeDoc(school), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${school.udise}`);
  }
}

export async function archiveSchoolInCloud(
  schoolUdise: string,
  deletedBy?: string,
  archiveReason?: string
): Promise<void> {
  const path = 'schools';
  try {
    const docRef = doc(db, path, schoolUdise);
    await updateDoc(docRef, {
      status: 'INACTIVE',
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: deletedBy || 'CAC',
      archiveReason: archiveReason || 'Deactivated via CAC Panel',
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${schoolUdise}`);
  }
}

export async function deactivateSchoolInCloud(
  schoolUdise: string,
  deletedBy?: string,
  reason?: string
): Promise<void> {
  return archiveSchoolInCloud(schoolUdise, deletedBy, reason || 'Deactivated');
}

export async function restoreSchoolInCloud(schoolUdise: string): Promise<void> {
  const path = 'schools';
  try {
    const docRef = doc(db, path, schoolUdise);
    await updateDoc(docRef, {
      status: 'ACTIVE',
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      archiveReason: null,
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${schoolUdise}`);
  }
}

export async function deleteSchoolFromCloud(schoolUdise: string): Promise<void> {
  // CRITICAL MANDATE: Physical deleteDoc is strictly forbidden!
  // Delegate safely to soft-delete / archive architecture
  return archiveSchoolInCloud(schoolUdise);
}

export async function fetchSchoolsFromCloud(): Promise<School[]> {
  const path = 'schools';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as School);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeSchoolsFromCloud(
  onData: (schools: School[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'schools';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as School);
      onData(items);
    },
    (err) => {
      console.warn('Schools Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Student Master & Enrollment Sync
// ----------------------
export async function syncStudentMasterToCloud(studentMaster: StudentMaster): Promise<void> {
  const path = 'studentMasters';
  try {
    const docRef = doc(db, path, studentMaster.id);
    await setDoc(docRef, sanitizeDoc(studentMaster), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${studentMaster.id}`);
  }
}

export async function deleteStudentMasterFromCloud(studentId: string): Promise<void> {
  const path = 'studentMasters';
  try {
    const docRef = doc(db, path, studentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${studentId}`);
  }
}

export async function fetchStudentMastersFromCloud(): Promise<StudentMaster[]> {
  const path = 'studentMasters';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StudentMaster);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeStudentMastersFromCloud(
  onData: (students: StudentMaster[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'studentMasters';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as StudentMaster);
      onData(items);
    },
    (err) => {
      console.warn('StudentMasters Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

export async function syncStudentEnrollmentToCloud(enrollment: StudentAcademicRecord): Promise<void> {
  const path = 'studentAcademicRecords';
  try {
    const docRef = doc(db, path, enrollment.id);
    await setDoc(docRef, sanitizeDoc(enrollment), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${enrollment.id}`);
  }
}

export async function fetchStudentEnrollmentsFromCloud(): Promise<StudentAcademicRecord[]> {
  const path = 'studentAcademicRecords';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StudentAcademicRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeStudentEnrollmentsFromCloud(
  onData: (records: StudentAcademicRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'studentAcademicRecords';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as StudentAcademicRecord);
      onData(items);
    },
    (err) => {
      console.warn('StudentAcademicRecords Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

export async function deleteStudentEnrollmentFromCloud(enrollmentId: string): Promise<void> {
  const path = 'studentAcademicRecords';
  try {
    const docRef = doc(db, path, enrollmentId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${enrollmentId}`);
  }
}

// ----------------------
// Staff Master & Postings Sync
// ----------------------
export async function syncStaffMasterToCloud(staffMaster: StaffMaster): Promise<void> {
  const path = 'staffMasters';
  try {
    const docRef = doc(db, path, staffMaster.id);
    await setDoc(docRef, sanitizeDoc(staffMaster), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${staffMaster.id}`);
  }
}

export async function deleteStaffMasterFromCloud(staffId: string): Promise<void> {
  const path = 'staffMasters';
  try {
    const docRef = doc(db, path, staffId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${staffId}`);
  }
}

export async function fetchStaffMastersFromCloud(): Promise<StaffMaster[]> {
  const path = 'staffMasters';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StaffMaster);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeStaffMastersFromCloud(
  onData: (staff: StaffMaster[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'staffMasters';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as StaffMaster);
      onData(items);
    },
    (err) => {
      console.warn('StaffMasters Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

export async function syncStaffPostingToCloud(posting: StaffPosting): Promise<void> {
  const path = 'staffPostings';
  try {
    const docRef = doc(db, path, posting.id);
    await setDoc(docRef, sanitizeDoc(posting), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${posting.id}`);
  }
}

export async function deleteStaffPostingFromCloud(postingId: string): Promise<void> {
  const path = 'staffPostings';
  try {
    const docRef = doc(db, path, postingId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${postingId}`);
  }
}

export async function fetchStaffPostingsFromCloud(): Promise<StaffPosting[]> {
  const path = 'staffPostings';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as StaffPosting);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeStaffPostingsFromCloud(
  onData: (postings: StaffPosting[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'staffPostings';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as StaffPosting);
      onData(items);
    },
    (err) => {
      console.warn('StaffPostings Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Attendance Sync
// ----------------------
export async function syncAttendanceToCloud(record: AttendanceRecord): Promise<void> {
  const path = 'attendance';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function fetchAttendanceFromCloud(): Promise<AttendanceRecord[]> {
  const path = 'attendance';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as AttendanceRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAttendanceFromCloud(
  onData: (records: AttendanceRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'attendance';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as AttendanceRecord);
      onData(items);
    },
    (err) => {
      console.warn('Attendance Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// MDM Sync
// ----------------------
export async function syncMDMToCloud(record: MDMRecord): Promise<void> {
  const path = 'mdmRecords';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteMDMFromCloud(id: string): Promise<void> {
  const path = 'mdmRecords';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchMDMFromCloud(): Promise<MDMRecord[]> {
  const path = 'mdmRecords';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as MDMRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeMDMFromCloud(
  onData: (records: MDMRecord[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'mdmRecords';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as MDMRecord);
      onData(items);
    },
    (err) => {
      console.warn('MDM Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Rasoiya Master Sync
// ----------------------
export async function syncRasoiyaToCloud(record: Rasoiya): Promise<void> {
  const path = 'rasoiya';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteRasoiyaFromCloud(rasoiyaId: string): Promise<void> {
  const path = 'rasoiya';
  try {
    const docRef = doc(db, path, rasoiyaId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${rasoiyaId}`);
  }
}

export async function fetchRasoiyaFromCloud(): Promise<Rasoiya[]> {
  const path = 'rasoiya';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as Rasoiya);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeRasoiyaFromCloud(
  onData: (records: Rasoiya[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'rasoiya';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as Rasoiya);
      onData(items);
    },
    (err) => {
      console.warn('Rasoiya Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Government Work Sync
// ----------------------
export async function syncGovernmentWorkToCloud(work: GovernmentWork): Promise<void> {
  const path = 'governmentWork';
  try {
    const docRef = doc(db, path, work.id);
    await setDoc(docRef, sanitizeDoc(work), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${work.id}`);
  }
}

export async function fetchGovernmentWorkFromCloud(): Promise<GovernmentWork[]> {
  const path = 'governmentWork';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as GovernmentWork);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteGovernmentWorkFromCloud(workId: string): Promise<void> {
  const path = 'governmentWork';
  try {
    const docRef = doc(db, path, workId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${workId}`);
  }
}

export function subscribeGovernmentWorkFromCloud(
  onData: (work: GovernmentWork[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'governmentWork';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as GovernmentWork);
      onData(items);
    },
    (err) => {
      console.warn('GovernmentWork Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Complaints Sync
// ----------------------
export async function syncComplaintToCloud(comp: Complaint): Promise<void> {
  const path = 'complaints';
  try {
    const docRef = doc(db, path, comp.id);
    await setDoc(docRef, sanitizeDoc(comp), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${comp.id}`);
  }
}

export async function fetchComplaintsFromCloud(): Promise<Complaint[]> {
  const path = 'complaints';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as Complaint);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeComplaintsFromCloud(
  onData: (complaints: Complaint[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'complaints';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as Complaint);
      onData(items);
    },
    (err) => {
      console.warn('Complaints Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Physical Facilities Sync
// ----------------------
export async function syncFacilityToCloud(facility: PhysicalFacility): Promise<void> {
  const path = 'facilities';
  try {
    const docRef = doc(db, path, facility.schoolUdise);
    await setDoc(docRef, sanitizeDoc(facility), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${facility.schoolUdise}`);
  }
}

export async function fetchFacilitiesFromCloud(): Promise<PhysicalFacility[]> {
  const path = 'facilities';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as PhysicalFacility);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeFacilitiesFromCloud(
  onData: (facilities: PhysicalFacility[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'facilities';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as PhysicalFacility);
      onData(items);
    },
    (err) => {
      console.warn('Facilities Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Academic Sessions Sync
// ----------------------
export async function syncAcademicSessionToCloud(session: AcademicSession): Promise<void> {
  const path = 'academicSessions';
  try {
    const docRef = doc(db, path, session.id);
    await setDoc(docRef, sanitizeDoc(session), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${session.id}`);
  }
}

export async function fetchAcademicSessionsFromCloud(): Promise<AcademicSession[]> {
  const path = 'academicSessions';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as AcademicSession);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAcademicSessionsFromCloud(
  onData: (sessions: AcademicSession[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'academicSessions';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as AcademicSession);
      onData(items);
    },
    (err) => {
      console.warn('AcademicSessions Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Audit Logs Sync (Authenticated & Append-Only)
// ----------------------
export async function syncAuditLogToCloud(log: AuditLog): Promise<void> {
  // CRITICAL: auditLogs is strictly for authenticated sessions.
  // Pre-auth events must never attempt writing to auditLogs.
  if (!auth.currentUser) {
    console.warn('[AuditLogs] Skipped write to auditLogs: User is unauthenticated.');
    return;
  }
  const path = 'auditLogs';
  try {
    const docRef = doc(db, path, log.id);
    await setDoc(docRef, sanitizeDoc(log), { merge: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${log.id}`);
  }
}

export async function fetchAuditLogsFromCloud(): Promise<AuditLog[]> {
  const path = 'auditLogs';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as AuditLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ----------------------
// Pre-Auth Security Events Sync (Abuse Protected)
// ----------------------
export async function syncPreAuthSecurityEventToCloud(event: PreAuthSecurityEvent): Promise<void> {
  const path = 'preAuthSecurityEvents';
  try {
    const docRef = doc(db, path, event.eventId);
    // Strict append-only write, sanitize to prevent arbitrary field injection
    const sanitized = {
      eventId: event.eventId,
      eventType: event.eventType,
      timestamp: event.timestamp,
      sanitizedIdentifier: (event.sanitizedIdentifier || 'unknown').slice(0, 100),
      success: false,
      reasonCode: (event.reasonCode || 'UNKNOWN').slice(0, 100),
      source: (event.source || 'WEB_CLIENT').slice(0, 50),
      ...(event.identifierHash ? { identifierHash: event.identifierHash.slice(0, 128) } : {}),
      ...(event.details ? { details: event.details.slice(0, 300) } : {}),
    };
    await setDoc(docRef, sanitized, { merge: false });
  } catch (error) {
    // Non-blocking warning for pre-auth security telemetry
    console.warn('[PreAuthSecurityEvent] Cloud sync notice:', error);
  }
}

export async function fetchPreAuthSecurityEventsFromCloud(): Promise<PreAuthSecurityEvent[]> {
  const path = 'preAuthSecurityEvents';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as PreAuthSecurityEvent);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAuditLogsFromCloud(
  onData: (logs: AuditLog[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'auditLogs';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as AuditLog);
      onData(items);
    },
    (err) => {
      console.warn('AuditLogs Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Users Sync
// ----------------------
export async function syncUserToCloud(user: User): Promise<void> {
  const path = 'users';
  try {
    const docRef = doc(db, path, user.id);
    await setDoc(docRef, sanitizeDoc(user), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${user.id}`);
  }
}

export async function fetchUsersFromCloud(): Promise<User[]> {
  const path = 'users';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as User);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeUsersFromCloud(
  onData: (users: User[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'users';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as User);
      onData(items);
    },
    (err) => {
      console.warn('Users Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

export async function deleteUserFromCloud(userId: string): Promise<void> {
  const path = 'users';
  try {
    const docRef = doc(db, path, userId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${userId}`);
  }
}

// ----------------------
// System Settings Sync
// ----------------------
export async function syncSystemSettingsToCloud(settings: any): Promise<void> {
  const path = 'systemSettings';
  try {
    const docRef = doc(db, path, 'clusterSettings');
    await setDoc(docRef, sanitizeDoc(settings), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/clusterSettings`);
  }
}

export async function fetchSystemSettingsFromCloud(): Promise<any> {
  const path = 'systemSettings';
  try {
    const docRef = doc(db, path, 'clusterSettings');
    const snap = await getDocs(collection(db, path));
    const d = snap.docs.find((x) => x.id === 'clusterSettings');
    return d ? d.data() : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

// ----------------------
// Batch Initial Seed/Sync to Cloud
// ----------------------
export async function uploadInitialDatasetToFirestore(data: {
  schools: School[];
  studentMasters: StudentMaster[];
  studentEnrollments: StudentAcademicRecord[];
  staffMasters: StaffMaster[];
  staffPostings: StaffPosting[];
  attendance?: AttendanceRecord[];
  mdmRecords?: MDMRecord[];
  governmentWork?: GovernmentWork[];
  complaints?: Complaint[];
  facilities?: PhysicalFacility[];
  rasoiya?: Rasoiya[];
  academicSessions?: AcademicSession[];
}): Promise<{ success: boolean; count: number }> {
  try {
    let writeCount = 0;
    const commitBatchList = async (items: { collectionPath: string; id: string; data: any }[]) => {
      const chunkSize = 400;
      for (let i = 0; i < items.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = items.slice(i, i + chunkSize);
        for (const item of chunk) {
          const ref = doc(db, item.collectionPath, item.id);
          batch.set(ref, sanitizeDoc(item.data), { merge: true });
        }
        await batch.commit();
        writeCount += chunk.length;
      }
    };

    const operations: { collectionPath: string; id: string; data: any }[] = [];

    data.schools.forEach((s) => operations.push({ collectionPath: 'schools', id: s.udise, data: s }));
    data.studentMasters.forEach((sm) => operations.push({ collectionPath: 'studentMasters', id: sm.id, data: sm }));
    data.studentEnrollments.forEach((se) => operations.push({ collectionPath: 'studentAcademicRecords', id: se.id, data: se }));
    data.staffMasters.forEach((stm) => operations.push({ collectionPath: 'staffMasters', id: stm.id, data: stm }));
    data.staffPostings.forEach((stp) => operations.push({ collectionPath: 'staffPostings', id: stp.id, data: stp }));
    
    if (data.facilities) {
      data.facilities.forEach((f) => operations.push({ collectionPath: 'facilities', id: f.schoolUdise, data: f }));
    }
    if (data.rasoiya) {
      data.rasoiya.forEach((r) => operations.push({ collectionPath: 'rasoiya', id: r.id, data: r }));
    }
    if (data.academicSessions) {
      data.academicSessions.forEach((s) => operations.push({ collectionPath: 'academicSessions', id: s.id, data: s }));
    }
    if (data.attendance) {
      data.attendance.forEach((a) => operations.push({ collectionPath: 'attendance', id: a.id, data: a }));
    }
    if (data.mdmRecords) {
      data.mdmRecords.forEach((m) => operations.push({ collectionPath: 'mdmRecords', id: m.id, data: m }));
    }
    if (data.governmentWork) {
      data.governmentWork.forEach((w) => operations.push({ collectionPath: 'governmentWork', id: w.id, data: w }));
    }
    if (data.complaints) {
      data.complaints.forEach((c) => operations.push({ collectionPath: 'complaints', id: c.id, data: c }));
    }

    await commitBatchList(operations);
    return { success: true, count: writeCount };
  } catch (error) {
    console.error('Initial dataset cloud sync error:', error);
    return { success: false, count: 0 };
  }
}

// ----------------------
// Dedicated Lightweight Cloud Connectivity Verifier
// ----------------------
export interface CloudConnectivityResult {
  isBrowserOnline: boolean;
  isFirebaseAuthActive: boolean;
  firebaseUid: string | null;
  status: 'connected' | 'auth_required' | 'auth_error' | 'permission_denied' | 'unavailable' | 'offline' | 'error';
  statusLabel: string;
  statusColor: 'emerald' | 'amber' | 'red' | 'blue' | 'gray';
  message: string;
  latencyMs?: number;
  timestamp: Date;
}

/**
 * Lightweight, non-intrusive Firestore connectivity check without mock documents.
 * Verifies browser network, Firebase Auth session, and performs a read-only probe
 * against canonical schools data to determine live status.
 */
export async function verifyCloudConnectivity(): Promise<CloudConnectivityResult> {
  // 1. Browser network status
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      isBrowserOnline: false,
      isFirebaseAuthActive: false,
      firebaseUid: null,
      status: 'offline',
      statusLabel: 'ऑफ़लाइन (Network Offline)',
      statusColor: 'red',
      message: 'डिवाइस का इंटरनेट कनेक्शन बंद है।',
      timestamp: new Date(),
    };
  }

  // 2. Firebase Auth verification
  const currentFbUser = auth.currentUser;
  if (!currentFbUser) {
    const isDbReachable = await testFirestoreConnection();
    return {
      isBrowserOnline: true,
      isFirebaseAuthActive: false,
      firebaseUid: null,
      status: 'auth_required',
      statusLabel: 'प्रमाणीकरण आवश्यक (Auth Required)',
      statusColor: 'amber',
      message: isDbReachable
        ? 'Google Cloud Firestore ऑनलाइन व सक्रिय है। डेटाबेस सुरक्षा नियमों हेतु Firebase Auth प्रमाणीकरण सत्र आवश्यक है।'
        : 'Firebase Auth सत्र उपलब्ध नहीं है (auth.currentUser == null)। Firestore सुरक्षा नियम सक्रिय हैं।',
      timestamp: new Date(),
    };
  }

  // 3. Lightweight read-only probe on canonical schools collection
  const t0 = performance.now();
  try {
    const q = query(collection(db, 'schools'), limit(1));
    await getDocs(q);
    const latencyMs = Math.round(performance.now() - t0);

    return {
      isBrowserOnline: true,
      isFirebaseAuthActive: true,
      firebaseUid: currentFbUser.uid,
      status: 'connected',
      statusLabel: 'क्लाउड लाइव (Cloud Live)',
      statusColor: 'emerald',
      message: `Google Cloud Firestore से सफल प्रमाणित कनेक्शन (${latencyMs}ms)।`,
      latencyMs,
      timestamp: new Date(),
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'permission-denied') {
      return {
        isBrowserOnline: true,
        isFirebaseAuthActive: true,
        firebaseUid: currentFbUser.uid,
        status: 'permission_denied',
        statusLabel: 'अनुमति त्रुटि (Authorization Error)',
        statusColor: 'red',
        message: `Firestore सुरक्षा नियमों द्वारा अनुमति अस्वीकृत (permission-denied)। UID: ${currentFbUser.uid}`,
        timestamp: new Date(),
      };
    } else if (code === 'unavailable' || code === 'deadline-exceeded') {
      return {
        isBrowserOnline: true,
        isFirebaseAuthActive: true,
        firebaseUid: currentFbUser.uid,
        status: 'unavailable',
        statusLabel: 'क्लाउड अनुपलब्ध (Unavailable)',
        statusColor: 'amber',
        message: 'Google Cloud Firestore सर्वर से अस्थायी कनेक्शन त्रुटि।',
        timestamp: new Date(),
      };
    } else {
      return {
        isBrowserOnline: true,
        isFirebaseAuthActive: true,
        firebaseUid: currentFbUser.uid,
        status: 'error',
        statusLabel: 'सिंक त्रुटि (Error)',
        statusColor: 'red',
        message: err?.message || 'Firestore कनेक्शन त्रुटि।',
        timestamp: new Date(),
      };
    }
  }
}

