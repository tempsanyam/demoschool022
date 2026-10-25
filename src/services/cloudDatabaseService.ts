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
  where,
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
  SHG,
  LiteracyRegister,
  IlliteratePerson,
  AksharSathi,
  ExamCycle,
  LiteracyExamResult,
  SupportingInstitution,
  NotificationItem,
  DocumentItem,
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
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'studentAcademicRecords';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
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
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'staffPostings';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
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
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'attendance';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
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
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'mdmRecords';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
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
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'rasoiya';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
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
// SHG (Self-Help Groups / स्वयं सहायता समूह) Sync
// ----------------------
export async function syncSHGToCloud(record: SHG): Promise<void> {
  const path = 'shgs';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteSHGFromCloud(shgId: string): Promise<void> {
  const path = 'shgs';
  try {
    const docRef = doc(db, path, shgId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${shgId}`);
  }
}

export async function fetchSHGsFromCloud(): Promise<SHG[]> {
  const path = 'shgs';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as SHG);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeSHGsFromCloud(
  onData: (records: SHG[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'shgs';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as SHG);
      onData(items);
    },
    (err) => {
      console.warn('SHG Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// ULLAS Navbharat Literacy — 1. Literacy Registers Sync
// ----------------------
export async function syncLiteracyRegisterToCloud(record: LiteracyRegister): Promise<void> {
  const path = 'literacyRegisters';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteLiteracyRegisterFromCloud(id: string): Promise<void> {
  const path = 'literacyRegisters';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchLiteracyRegistersFromCloud(): Promise<LiteracyRegister[]> {
  const path = 'literacyRegisters';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as LiteracyRegister);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeLiteracyRegistersFromCloud(
  onData: (records: LiteracyRegister[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'literacyRegisters';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as LiteracyRegister);
      onData(items);
    },
    (err) => {
      console.warn('LiteracyRegisters Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// ULLAS Navbharat Literacy — 2. Illiterate Persons Sync
// ----------------------
export async function syncIlliteratePersonToCloud(record: IlliteratePerson): Promise<void> {
  const path = 'illiteratePersons';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteIlliteratePersonFromCloud(id: string): Promise<void> {
  const path = 'illiteratePersons';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchIlliteratePersonsFromCloud(): Promise<IlliteratePerson[]> {
  const path = 'illiteratePersons';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as IlliteratePerson);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeIlliteratePersonsFromCloud(
  onData: (records: IlliteratePerson[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'illiteratePersons';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as IlliteratePerson);
      onData(items);
    },
    (err) => {
      console.warn('IlliteratePersons Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// ULLAS Navbharat Literacy — 3. Akshar Sathis Sync
// ----------------------
export async function syncAksharSathiToCloud(record: AksharSathi): Promise<void> {
  const path = 'aksharSathis';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteAksharSathiFromCloud(id: string): Promise<void> {
  const path = 'aksharSathis';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchAksharSathisFromCloud(): Promise<AksharSathi[]> {
  const path = 'aksharSathis';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as AksharSathi);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeAksharSathisFromCloud(
  onData: (records: AksharSathi[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'aksharSathis';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as AksharSathi);
      onData(items);
    },
    (err) => {
      console.warn('AksharSathis Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// ULLAS Navbharat Literacy — 4. Exam Cycles Sync
// ----------------------
export async function syncExamCycleToCloud(record: ExamCycle): Promise<void> {
  const path = 'examCycles';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteExamCycleFromCloud(id: string): Promise<void> {
  const path = 'examCycles';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchExamCyclesFromCloud(): Promise<ExamCycle[]> {
  const path = 'examCycles';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as ExamCycle);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeExamCyclesFromCloud(
  onData: (records: ExamCycle[]) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'examCycles';
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as ExamCycle);
      onData(items);
    },
    (err) => {
      console.warn('ExamCycles Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// ULLAS Navbharat Literacy — 5. Literacy Exam Results Sync
// ----------------------
export async function syncLiteracyExamResultToCloud(record: LiteracyExamResult): Promise<void> {
  const path = 'literacyExamResults';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteLiteracyExamResultFromCloud(id: string): Promise<void> {
  const path = 'literacyExamResults';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchLiteracyExamResultsFromCloud(): Promise<LiteracyExamResult[]> {
  const path = 'literacyExamResults';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as LiteracyExamResult);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeLiteracyExamResultsFromCloud(
  onData: (records: LiteracyExamResult[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'literacyExamResults';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as LiteracyExamResult);
      onData(items);
    },
    (err) => {
      console.warn('LiteracyExamResults Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// ULLAS Navbharat Literacy — 6. Supporting Institutions Sync
// ----------------------
export async function syncSupportingInstitutionToCloud(record: SupportingInstitution): Promise<void> {
  const path = 'supportingInstitutions';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteSupportingInstitutionFromCloud(id: string): Promise<void> {
  const path = 'supportingInstitutions';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchSupportingInstitutionsFromCloud(): Promise<SupportingInstitution[]> {
  const path = 'supportingInstitutions';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as SupportingInstitution);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeSupportingInstitutionsFromCloud(
  onData: (records: SupportingInstitution[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'supportingInstitutions';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as SupportingInstitution);
      onData(items);
    },
    (err) => {
      console.warn('SupportingInstitutions Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Notifications (सूचना पटल एवं आदेश) Sync
// ----------------------
export async function syncNotificationToCloud(record: NotificationItem): Promise<void> {
  const path = 'notifications';
  try {
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(record), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteNotificationFromCloud(id: string): Promise<void> {
  const path = 'notifications';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export async function fetchNotificationsFromCloud(): Promise<NotificationItem[]> {
  const path = 'notifications';
  try {
    const colRef = collection(db, path);
    const snap = await getDocs(colRef);
    return snap.docs.map((d) => d.data() as NotificationItem);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeNotificationsFromCloud(
  onData: (records: NotificationItem[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'notifications';
  const colRef = collection(db, path);
  if (schoolUdise) {
    // SCHOOL users read cluster-wide ('ALL') notifications and their own school-targeted notifications
    let allNotifs: NotificationItem[] = [];
    let schoolNotifs: NotificationItem[] = [];
    const emitMerged = () => {
      const map = new Map<string, NotificationItem>();
      allNotifs.forEach((n) => map.set(n.id, n));
      schoolNotifs.forEach((n) => map.set(n.id, n));
      onData(Array.from(map.values()));
    };
    const qAll = query(colRef, where('targetType', '==', 'ALL'));
    const qSchool = query(colRef, where('targetSchoolUdise', '==', schoolUdise));
    const unsubAll = onSnapshot(
      qAll,
      (snap) => {
        allNotifs = snap.docs.map((d) => d.data() as NotificationItem);
        emitMerged();
      },
      (err) => {
        console.warn('Notifications (ALL) Firestore listener error:', err);
        if (onError) onError(err);
      }
    );
    const unsubSchool = onSnapshot(
      qSchool,
      (snap) => {
        schoolNotifs = snap.docs.map((d) => d.data() as NotificationItem);
        emitMerged();
      },
      (err) => {
        console.warn('Notifications (School) Firestore listener error:', err);
        if (onError) onError(err);
      }
    );
    return () => {
      unsubAll();
      unsubSchool();
    };
  }
  return onSnapshot(
    colRef,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as NotificationItem);
      onData(items);
    },
    (err) => {
      console.warn('Notifications Firestore listener error:', err);
      if (onError) onError(err);
    }
  );
}

// ----------------------
// Documents Metadata Sync
// ----------------------
export async function syncDocumentToCloud(record: DocumentItem): Promise<void> {
  const path = 'documents';
  try {
    const { fileData, ...metadataOnly } = record;
    const docRef = doc(db, path, record.id);
    await setDoc(docRef, sanitizeDoc(metadataOnly), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${record.id}`);
  }
}

export async function deleteDocumentFromCloud(id: string): Promise<void> {
  const path = 'documents';
  try {
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
  }
}

export function subscribeDocumentsFromCloud(
  onData: (records: DocumentItem[]) => void,
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'documents';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', 'in', [schoolUdise, 'ALL'])) : colRef;
  return onSnapshot(
    q,
    (snap) => {
      const items = snap.docs.map((d) => d.data() as DocumentItem);
      onData(items);
    },
    (err) => {
      console.warn('Documents Firestore listener error:', err);
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
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'governmentWork';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
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

export async function deleteComplaintFromCloud(compId: string): Promise<void> {
  const path = 'complaints';
  try {
    const docRef = doc(db, path, compId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${path}/${compId}`);
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
  onError?: (err: any) => void,
  schoolUdise?: string
): Unsubscribe {
  const path = 'complaints';
  const colRef = collection(db, path);
  const q = schoolUdise ? query(colRef, where('schoolUdise', '==', schoolUdise)) : colRef;
  return onSnapshot(
    q,
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
// Feature & Option Control Sync (systemSettings/feature_controls)
// ----------------------
export async function syncFeatureControlStoreToCloud(store: any): Promise<void> {
  const path = 'systemSettings';
  try {
    const docRef = doc(db, path, 'feature_controls');
    await setDoc(docRef, sanitizeDoc(store), { merge: false });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/feature_controls`);
  }
}

export function subscribeFeatureControlStoreFromCloud(
  onData: (store: any) => void,
  onError?: (err: any) => void
): Unsubscribe {
  const path = 'systemSettings';
  const docRef = doc(db, path, 'feature_controls');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data());
      } else {
        onData(null);
      }
    },
    (err) => {
      console.warn('FeatureControls Firestore listener error:', err);
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

export async function updateUserLoginTimestamp(userId: string): Promise<void> {
  const path = 'users';
  try {
    const docRef = doc(db, path, userId);
    await updateDoc(docRef, {
      lastLogin: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('Update login timestamp notice:', error);
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
  shgs?: SHG[];
  literacyRegisters?: LiteracyRegister[];
  illiteratePersons?: IlliteratePerson[];
  aksharSathis?: AksharSathi[];
  examCycles?: ExamCycle[];
  literacyExamResults?: LiteracyExamResult[];
  supportingInstitutions?: SupportingInstitution[];
  notifications?: NotificationItem[];
  documents?: DocumentItem[];
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
    if (data.shgs) {
      data.shgs.forEach((s) => operations.push({ collectionPath: 'shgs', id: s.id, data: s }));
    }
    if (data.literacyRegisters) {
      data.literacyRegisters.forEach((lr) => operations.push({ collectionPath: 'literacyRegisters', id: lr.id, data: lr }));
    }
    if (data.illiteratePersons) {
      data.illiteratePersons.forEach((ip) => operations.push({ collectionPath: 'illiteratePersons', id: ip.id, data: ip }));
    }
    if (data.aksharSathis) {
      data.aksharSathis.forEach((as) => operations.push({ collectionPath: 'aksharSathis', id: as.id, data: as }));
    }
    if (data.examCycles) {
      data.examCycles.forEach((ec) => operations.push({ collectionPath: 'examCycles', id: ec.id, data: ec }));
    }
    if (data.literacyExamResults) {
      data.literacyExamResults.forEach((er) => operations.push({ collectionPath: 'literacyExamResults', id: er.id, data: er }));
    }
    if (data.supportingInstitutions) {
      data.supportingInstitutions.forEach((si) => operations.push({ collectionPath: 'supportingInstitutions', id: si.id, data: si }));
    }
    if (data.notifications) {
      data.notifications.forEach((n) => operations.push({ collectionPath: 'notifications', id: n.id, data: n }));
    }
    if (data.documents) {
      data.documents.forEach((d) => {
        const { fileData, ...metadataOnly } = d;
        operations.push({ collectionPath: 'documents', id: d.id, data: metadataOnly });
      });
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

/**
 * Completely purges all operational collections from Firestore while protecting
/**
 * Completely purges all operational collections and schools from Firestore
 * per user directive to clear all school data.
 */
export async function purgeAllCloudSchools(): Promise<{ success: boolean; deletedCount: number }> {
  let deletedCount = 0;
  try {
    const snap = await getDocs(collection(db, 'schools'));
    if (!snap.empty) {
      const chunkSize = 400;
      const docs = snap.docs;
      for (let i = 0; i < docs.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + chunkSize);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
        deletedCount += chunk.length;
      }
    }
  } catch (err) {
    console.warn('Purge cloud schools notice:', err);
  }
  return { success: true, deletedCount };
}

export interface CloudPurgeResult {
  success: boolean;
  deletedCount: number;
  collectionBreakdown: Record<string, number>;
  errors: string[];
}

/**
 * Safely purges all residual/dummy operational cloud collections from Cloud Firestore.
 * Strictly PROTECTS:
 * - 37 Official Schools (`schools`)
 * - User Directory (`users`)
 * - System Settings (`systemSettings`)
 * - Academic Sessions (`academicSessions`)
 * - Audit Trail (`auditLogs`)
 */
export async function purgeLegacyAndOperationalCloudData(): Promise<CloudPurgeResult> {
  const collectionsToPurge = [
    'studentMasters',
    'studentAcademicRecords',
    'students',
    'staffMasters',
    'staffPostings',
    'staff',
    'attendance',
    'mdmRecords',
    'mdm_records',
    'rasoiya',
    'shgs',
    'literacyRegisters',
    'illiteratePersons',
    'aksharSathis',
    'literacyExamResults',
    'supportingInstitutions',
    'governmentWork',
    'complaints',
    'documents',
    'uploadHistory'
  ];

  let totalDeleted = 0;
  const collectionBreakdown: Record<string, number> = {};
  const errors: string[] = [];

  for (const colName of collectionsToPurge) {
    try {
      const snap = await getDocs(collection(db, colName));
      if (!snap.empty) {
        const chunkSize = 400;
        const docs = snap.docs;
        let colDeleted = 0;
        for (let i = 0; i < docs.length; i += chunkSize) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + chunkSize);
          chunk.forEach((d) => batch.delete(d.ref));
          await batch.commit();
          colDeleted += chunk.length;
        }
        collectionBreakdown[colName] = colDeleted;
        totalDeleted += colDeleted;
      } else {
        collectionBreakdown[colName] = 0;
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      console.warn(`Purge operational cloud collection notice (${colName}):`, err);
      errors.push(`${colName}: ${msg}`);
    }
  }

  return {
    success: errors.length === 0,
    deletedCount: totalDeleted,
    collectionBreakdown,
    errors,
  };
}

export async function purgeAllOperationalCloudCollections(): Promise<{ success: boolean; deletedCount: number }> {
  const res = await purgeLegacyAndOperationalCloudData();
  return { success: res.success, deletedCount: res.deletedCount };
}

// ----------------------
// Phase 2 Idempotent Local-to-Firestore Migration Engine
// (Backup Snapshot -> Dry-Run Deduplication -> Enrich Metadata -> Batch Sync -> Verification)
// ----------------------
export interface Phase2MigrationCollectionStat {
  collection: string;
  beforeCount: number;
  afterCount: number;
  uniqueIdsCount: number;
  duplicateIdsSkipped: number;
  enrichedWithMetadataCount: number;
  sampleIds: string[];
}

export interface Phase2LocalToFirestoreMigrationReport {
  migrationVersion: string;
  executedAt: string;
  dryRunPassed: boolean;
  backupKey: string;
  statusKey: string;
  totalBeforeCount: number;
  totalAfterCount: number;
  totalUniqueIds: number;
  zeroDuplicatesVerified: boolean;
  sourcePreservedUntilVerified: boolean;
  collections: Record<string, Phase2MigrationCollectionStat>;
  normalizedPayload: {
    shgs: SHG[];
    literacyRegisters: LiteracyRegister[];
    illiteratePersons: IlliteratePerson[];
    aksharSathis: AksharSathi[];
    examCycles: ExamCycle[];
    literacyExamResults: LiteracyExamResult[];
    supportingInstitutions: SupportingInstitution[];
    notifications: NotificationItem[];
    documents: DocumentItem[];
  };
}

export const PHASE2_MIGRATION_BACKUP_KEY = 'jsk_phase2_migration_backup_v1';
export const PHASE2_MIGRATION_WRITE_OK_KEY = 'jsk_phase2_migration_write_ok_v1';
export const PHASE2_MIGRATION_VERIFIED_KEY = 'jsk_phase2_migration_verified_v1';
export const PHASE2_MIGRATION_STATUS_KEY = 'jsk_phase2_migration_write_ok_v1'; // write_ok marker

/**
 * Pure, deterministic dry-run & normalization engine for Phase 2 Local-Only Modules:
 * 1. shgs
 * 2. literacyRegisters
 * 3. illiteratePersons
 * 4. aksharSathis
 * 5. examCycles
 * 6. literacyExamResults
 * 7. supportingInstitutions
 * 8. notifications
 * 9. documents (metadata only; fileData stripped to avoid 1MB limit and base64 bloat)
 */
export function preparePhase2LocalToFirestoreMigration(
  input: {
    shgs: SHG[];
    literacyRegisters: LiteracyRegister[];
    illiteratePersons: IlliteratePerson[];
    aksharSathis: AksharSathi[];
    examCycles: ExamCycle[];
    literacyExamResults: LiteracyExamResult[];
    supportingInstitutions: SupportingInstitution[];
    notifications: NotificationItem[];
    documents?: DocumentItem[];
  },
  defaultSessionId: string = '2026-27',
  fallbackUdise: string = '23080110702'
): Phase2LocalToFirestoreMigrationReport {
  const nowIso = new Date().toISOString();
  const collectionsReport: Record<string, Phase2MigrationCollectionStat> = {};

  function deduplicateAndNormalize<T extends { id: string }>(
    collectionName: string,
    items: T[],
    enricher: (item: T) => { item: T; enriched: boolean }
  ): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    let duplicateIdsSkipped = 0;
    let enrichedWithMetadataCount = 0;

    for (const raw of items || []) {
      if (!raw || !raw.id) continue;
      const cleanId = String(raw.id).trim();
      if (seen.has(cleanId)) {
        duplicateIdsSkipped++;
        continue;
      }
      seen.add(cleanId);
      const { item: normalized, enriched } = enricher({ ...raw, id: cleanId });
      if (enriched) enrichedWithMetadataCount++;
      result.push(normalized);
    }

    collectionsReport[collectionName] = {
      collection: collectionName,
      beforeCount: Array.isArray(items) ? items.length : 0,
      afterCount: result.length,
      uniqueIdsCount: seen.size,
      duplicateIdsSkipped,
      enrichedWithMetadataCount,
      sampleIds: result.slice(0, 5).map((x) => x.id),
    };

    return result;
  }

  const shgs = deduplicateAndNormalize('shgs', input.shgs, (s) => {
    const needsEnrich = !s.schoolUdise || !s.sessionId || !s.createdAt || !s.updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...s,
        schoolUdise: (s.schoolUdise || fallbackUdise).trim(),
        sessionId: s.sessionId || defaultSessionId,
        status: s.status || 'ACTIVE',
        members: Array.isArray(s.members) ? s.members : [],
        createdAt: s.createdAt || nowIso,
        updatedAt: s.updatedAt || s.createdAt || nowIso,
      },
    };
  });

  const literacyRegisters = deduplicateAndNormalize('literacyRegisters', input.literacyRegisters, (r) => {
    const sId = r.sessionId || r.academicYear || defaultSessionId;
    const needsEnrich = !r.schoolUdise || !r.sessionId || !r.academicYear || !r.createdAt || !r.updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...r,
        schoolUdise: (r.schoolUdise || fallbackUdise).trim(),
        sessionId: sId,
        academicYear: r.academicYear || sId,
        createdAt: r.createdAt || nowIso,
        updatedAt: r.updatedAt || r.createdAt || nowIso,
      },
    };
  });

  const illiteratePersons = deduplicateAndNormalize('illiteratePersons', input.illiteratePersons, (p) => {
    const sId = p.sessionId || p.academicYear || defaultSessionId;
    const needsEnrich = !p.schoolUdise || !p.sessionId || !p.academicYear || !p.createdAt || !p.updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...p,
        schoolUdise: (p.schoolUdise || fallbackUdise).trim(),
        sessionId: sId,
        academicYear: p.academicYear || sId,
        createdAt: p.createdAt || nowIso,
        updatedAt: p.updatedAt || p.createdAt || nowIso,
      },
    };
  });

  const aksharSathis = deduplicateAndNormalize('aksharSathis', input.aksharSathis, (v) => {
    const sId = v.sessionId || v.academicYear || defaultSessionId;
    const needsEnrich = !v.schoolUdise || !v.sessionId || !v.academicYear || !v.createdAt || !v.updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...v,
        schoolUdise: (v.schoolUdise || fallbackUdise).trim(),
        sessionId: sId,
        academicYear: v.academicYear || sId,
        createdAt: v.createdAt || nowIso,
        updatedAt: v.updatedAt || v.createdAt || nowIso,
      },
    };
  });

  const examCycles = deduplicateAndNormalize('examCycles', input.examCycles, (c) => {
    const sId = c.sessionId || c.academicYear || defaultSessionId;
    const needsEnrich = !c.sessionId || !c.academicYear || !c.createdAt || !c.updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...c,
        sessionId: sId,
        academicYear: c.academicYear || sId,
        createdAt: c.createdAt || nowIso,
        updatedAt: c.updatedAt || c.createdAt || nowIso,
      },
    };
  });

  const literacyExamResults = deduplicateAndNormalize('literacyExamResults', input.literacyExamResults, (er) => {
    const sId = er.sessionId || er.academicYear || defaultSessionId;
    const needsEnrich = !er.schoolUdise || !er.sessionId || !er.academicYear || !er.createdAt || !er.updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...er,
        schoolUdise: (er.schoolUdise || fallbackUdise).trim(),
        sessionId: sId,
        academicYear: er.academicYear || sId,
        createdAt: er.createdAt || nowIso,
        updatedAt: er.updatedAt || er.createdAt || nowIso,
      },
    };
  });

  const supportingInstitutions = deduplicateAndNormalize('supportingInstitutions', input.supportingInstitutions, (si) => {
    const sId = (si as any).sessionId || (si as any).academicYear || defaultSessionId;
    const needsEnrich = !si.schoolUdise || !(si as any).sessionId || !si.createdAt || !si.updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...si,
        schoolUdise: (si.schoolUdise || fallbackUdise).trim(),
        sessionId: sId,
        academicYear: (si as any).academicYear || sId,
        createdAt: si.createdAt || nowIso,
        updatedAt: si.updatedAt || si.createdAt || nowIso,
      } as SupportingInstitution,
    };
  });

  const notifications = deduplicateAndNormalize('notifications', input.notifications, (n) => {
    const needsEnrich = !Array.isArray(n.readBy) || !(n as any).createdAt || !(n as any).updatedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...n,
        readBy: Array.isArray(n.readBy) ? n.readBy : [],
        sessionId: (n as any).sessionId || defaultSessionId,
        createdAt: (n as any).createdAt || n.date || nowIso,
        updatedAt: (n as any).updatedAt || (n as any).createdAt || n.date || nowIso,
      } as NotificationItem,
    };
  });

  const documents = deduplicateAndNormalize('documents', input.documents || [], (d) => {
    const { fileData, ...metadataOnly } = d;
    const needsEnrich = !d.schoolUdise || !d.sessionId || !d.uploadedAt;
    return {
      enriched: needsEnrich,
      item: {
        ...metadataOnly,
        schoolUdise: (d.schoolUdise || 'ALL').trim(),
        sessionId: d.sessionId || defaultSessionId,
        uploadedAt: d.uploadedAt || d.date || nowIso,
      } as DocumentItem,
    };
  });

  const statsList = Object.values(collectionsReport);
  const totalBeforeCount = statsList.reduce((acc, s) => acc + s.beforeCount, 0);
  const totalAfterCount = statsList.reduce((acc, s) => acc + s.afterCount, 0);
  const totalUniqueIds = statsList.reduce((acc, s) => acc + s.uniqueIdsCount, 0);

  return {
    migrationVersion: 'phase2-v1.0.0',
    executedAt: nowIso,
    dryRunPassed: totalAfterCount === totalUniqueIds && totalAfterCount > 0,
    backupKey: PHASE2_MIGRATION_BACKUP_KEY,
    statusKey: PHASE2_MIGRATION_STATUS_KEY,
    totalBeforeCount,
    totalAfterCount,
    totalUniqueIds,
    zeroDuplicatesVerified: totalAfterCount === totalUniqueIds,
    sourcePreservedUntilVerified: true,
    collections: collectionsReport,
    normalizedPayload: {
      shgs,
      literacyRegisters,
      illiteratePersons,
      aksharSathis,
      examCycles,
      literacyExamResults,
      supportingInstitutions,
      notifications,
      documents,
    },
  };
}

/**
 * Executes the idempotent one-time migration of SHG, ULLAS Literacy, Notifications, and Documents
 * from localStorage to Firestore, with backup creation, dry-run validation, and verification.
 */
export async function executePhase2LocalToFirestoreMigration(
  input: {
    shgs: SHG[];
    literacyRegisters: LiteracyRegister[];
    illiteratePersons: IlliteratePerson[];
    aksharSathis: AksharSathi[];
    examCycles: ExamCycle[];
    literacyExamResults: LiteracyExamResult[];
    supportingInstitutions: SupportingInstitution[];
    notifications: NotificationItem[];
    documents?: DocumentItem[];
  },
  options?: { force?: boolean; dryRunOnly?: boolean; sessionId?: string }
): Promise<{
  success: boolean;
  alreadyMigrated: boolean;
  syncedToFirestoreCount: number;
  report: Phase2LocalToFirestoreMigrationReport;
}> {
  // 1. Always prepare and run the dry-run validation first
  const report = preparePhase2LocalToFirestoreMigration(input, options?.sessionId || '2026-27');

  // 2. Check idempotency marker if not forced
  if (typeof localStorage !== 'undefined' && !options?.force) {
    const existingStatusRaw = localStorage.getItem(PHASE2_MIGRATION_STATUS_KEY);
    if (existingStatusRaw) {
      try {
        const parsed = JSON.parse(existingStatusRaw);
        if (parsed && parsed.verified === true && parsed.migrationVersion === 'phase2-v1.0.0') {
          return {
            success: true,
            alreadyMigrated: true,
            syncedToFirestoreCount: parsed.syncedToFirestoreCount || report.totalAfterCount,
            report,
          };
        }
      } catch {
        // Proceed with fresh migration if marker corrupted
      }
    }
  }

  // 3. Save non-destructive Backup Snapshot before any write
  if (typeof localStorage !== 'undefined') {
    try {
      const existingBackup = localStorage.getItem(PHASE2_MIGRATION_BACKUP_KEY);
      if (!existingBackup) {
        const backupSnapshot = {
          createdAt: report.executedAt,
          migrationVersion: report.migrationVersion,
          countsBefore: Object.fromEntries(
            Object.entries(report.collections).map(([k, v]) => [k, v.beforeCount])
          ),
          rawCollections: input,
        };
        localStorage.setItem(PHASE2_MIGRATION_BACKUP_KEY, JSON.stringify(backupSnapshot));
      }
    } catch (e) {
      console.warn('[Phase2Migration] Backup snapshot storage notice:', e);
    }
  }

  if (options?.dryRunOnly) {
    return {
      success: report.dryRunPassed,
      alreadyMigrated: false,
      syncedToFirestoreCount: 0,
      report,
    };
  }

  // 4. If authenticated with Firebase, commit idempotent batch writes to Firestore
  let syncedToFirestoreCount = 0;
  if (auth.currentUser) {
    try {
      const operations: { collectionPath: string; id: string; data: any }[] = [];
      const p = report.normalizedPayload;

      p.shgs.forEach((item) => operations.push({ collectionPath: 'shgs', id: item.id, data: item }));
      p.literacyRegisters.forEach((item) => operations.push({ collectionPath: 'literacyRegisters', id: item.id, data: item }));
      p.illiteratePersons.forEach((item) => operations.push({ collectionPath: 'illiteratePersons', id: item.id, data: item }));
      p.aksharSathis.forEach((item) => operations.push({ collectionPath: 'aksharSathis', id: item.id, data: item }));
      p.examCycles.forEach((item) => operations.push({ collectionPath: 'examCycles', id: item.id, data: item }));
      p.literacyExamResults.forEach((item) => operations.push({ collectionPath: 'literacyExamResults', id: item.id, data: item }));
      p.supportingInstitutions.forEach((item) => operations.push({ collectionPath: 'supportingInstitutions', id: item.id, data: item }));
      p.notifications.forEach((item) => operations.push({ collectionPath: 'notifications', id: item.id, data: item }));
      p.documents.forEach((item) => operations.push({ collectionPath: 'documents', id: item.id, data: item }));

      const chunkSize = 400;
      for (let i = 0; i < operations.length; i += chunkSize) {
        const batch = writeBatch(db);
        const chunk = operations.slice(i, i + chunkSize);
        for (const op of chunk) {
          const ref = doc(db, op.collectionPath, op.id);
          batch.set(ref, sanitizeDoc(op.data), { merge: true });
        }
        await batch.commit();
        syncedToFirestoreCount += chunk.length;
      }

      // 5. Mark write_ok status in localStorage (write batch commit successful)
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(
          PHASE2_MIGRATION_WRITE_OK_KEY,
          JSON.stringify({
            migrationVersion: report.migrationVersion,
            writeOk: true,
            executedAt: new Date().toISOString(),
            syncedToFirestoreCount,
            totalBeforeCount: report.totalBeforeCount,
            totalAfterCount: report.totalAfterCount,
            totalUniqueIds: report.totalUniqueIds,
            collections: report.collections,
          })
        );
      }

      return {
        success: true,
        alreadyMigrated: false,
        syncedToFirestoreCount,
        report,
      };
    } catch (err) {
      console.warn('[Phase2Migration] Cloud batch commit notice (source preserved):', err);
      return {
        success: false,
        alreadyMigrated: false,
        syncedToFirestoreCount,
        report,
      };
    }
  }

  return {
    success: report.dryRunPassed,
    alreadyMigrated: false,
    syncedToFirestoreCount: 0,
    report,
  };
}

export interface CloudReconciliationMatchItem {
  collection: string;
  localCount: number;
  cloudCount: number;
  matchedCount: number;
  missingLocalIds: string[];
  extraCloudIds: string[];
  isMatch: boolean;
}

export interface CloudReconciliationReport {
  timestamp: string;
  isFullyMatched: boolean;
  totalLocalItems: number;
  totalCloudItems: number;
  totalMatchedItems: number;
  collections: Record<string, CloudReconciliationMatchItem>;
}

/**
 * Authoritative reconciliation engine that reads IDs back from Cloud Firestore
 * and writes the verified marker ONLY after full ID and count verification.
 */
export async function verifyPhase2CloudReconciliation(
  localData: {
    shgs: { id: string }[];
    literacyRegisters: { id: string }[];
    illiteratePersons: { id: string }[];
    aksharSathis: { id: string }[];
    examCycles: { id: string }[];
    literacyExamResults: { id: string }[];
    supportingInstitutions: { id: string }[];
    notifications: { id: string }[];
    documents?: { id: string }[];
  }
): Promise<CloudReconciliationReport> {
  const collectionsMap: Record<string, { id: string }[]> = {
    shgs: localData.shgs || [],
    literacyRegisters: localData.literacyRegisters || [],
    illiteratePersons: localData.illiteratePersons || [],
    aksharSathis: localData.aksharSathis || [],
    examCycles: localData.examCycles || [],
    literacyExamResults: localData.literacyExamResults || [],
    supportingInstitutions: localData.supportingInstitutions || [],
    notifications: localData.notifications || [],
    documents: localData.documents || [],
  };

  const reportItems: Record<string, CloudReconciliationMatchItem> = {};
  let isFullyMatched = true;
  let totalLocal = 0;
  let totalCloud = 0;
  let totalMatched = 0;

  for (const [colName, localList] of Object.entries(collectionsMap)) {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    const cloudDocs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const cloudIds = new Set(cloudDocs.map((d) => d.id));
    const localIds = new Set(localList.map((item) => String(item.id).trim()));

    const missingInCloud: string[] = [];
    let matched = 0;

    localIds.forEach((id) => {
      if (cloudIds.has(id)) {
        matched++;
      } else {
        missingInCloud.push(id);
      }
    });

    const extraInCloud: string[] = [];
    cloudIds.forEach((id) => {
      if (!localIds.has(id)) {
        extraInCloud.push(id);
      }
    });

    const colMatched = missingInCloud.length === 0;
    if (!colMatched) isFullyMatched = false;

    totalLocal += localList.length;
    totalCloud += cloudDocs.length;
    totalMatched += matched;

    reportItems[colName] = {
      collection: colName,
      localCount: localList.length,
      cloudCount: cloudDocs.length,
      matchedCount: matched,
      missingLocalIds: missingInCloud,
      extraCloudIds: extraInCloud,
      isMatch: colMatched,
    };
  }

  // Only when 100% of local IDs are verified in Cloud Firestore, mark verified!
  if (isFullyMatched && typeof localStorage !== 'undefined') {
    localStorage.setItem(
      PHASE2_MIGRATION_VERIFIED_KEY,
      JSON.stringify({
        verified: true,
        verifiedAt: new Date().toISOString(),
        totalLocalItems: totalLocal,
        totalCloudItems: totalCloud,
        totalMatchedItems: totalMatched,
      })
    );
  }

  return {
    timestamp: new Date().toISOString(),
    isFullyMatched,
    totalLocalItems: totalLocal,
    totalCloudItems: totalCloud,
    totalMatchedItems: totalMatched,
    collections: reportItems,
  };
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

