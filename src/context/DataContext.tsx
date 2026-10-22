import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  School,
  Student,
  Staff,
  PhysicalFacility,
  AttendanceRecord,
  MDMRecord,
  GovernmentWork,
  NotificationItem,
  Complaint,
  ComplaintStatus,
  ComplaintHistoryItem,
  DocumentItem,
  AuditLog,
  AppSettings,
  AuditAction,
  UploadHistoryItem,
  DuplicateHandlingMode,
  LiteracyRegister,
  IlliteratePerson,
  AksharSathi,
  ExamCycle,
  LiteracyExamResult,
  SupportingInstitution,
  LiteracyDashboardStats,
  Rasoiya,
  SHG
} from '../types';
import {
  initialSchools,
  initialStudents,
  initialStaff,
  initialFacilities,
  initialAttendance,
  initialMDM,
  initialGovernmentWork,
  initialNotifications,
  initialComplaints,
  initialDocuments,
  initialAuditLogs,
  initialSettings,
  initialUploadHistory,
  facilityMasterList,
  initialRasoiya,
  initialSHGs
} from '../data/seedData';
import {
  initialLiteracyRegisters,
  initialIlliteratePersons,
  initialAksharSathis,
  initialExamCycles,
  initialLiteracyExamResults,
  initialSupportingInstitutions
} from '../data/literacySeedData';
import {
  LITERACY_EXAM_CYCLE_MASTER,
  findExamCycleMaster
} from '../config/literacyExamCycles';
import {
  AcademicSession,
  SessionStatus,
  StudentMaster,
  StudentAcademicRecord,
  StudentTransferRecord,
  StaffMaster,
  StaffPosting,
  PromotionRuleMapping,
  CarryForwardOptions,
  StudentAcademicJourneyEntry,
  StudentEnrollmentStatus,
  SchoolAcademicHistoryEntry,
} from '../types';
import {
  INITIAL_ACADEMIC_SESSIONS,
  DEFAULT_PROMOTION_RULES,
  DEFAULT_CARRY_FORWARD_OPTIONS,
  validateSessionFormat,
  deriveShortName,
  getSessionForDate,
  buildInitialMastersAndEnrollments,
  buildInitialStaffMastersAndPostings,
  composeStudentsForSession,
  composeStaffForSession,
  computeSchoolAcademicHistory,
} from '../utils/sessionManager';
import { deleteDocumentBinary, clearAllDocumentBinaries } from '../utils/documentStorage';
import {
  runControlledSchoolMasterMigration,
  getMigrationReport,
  MigrationAuditReport,
} from '../utils/schoolMasterMigration';
import { CLUSTER_37_SCHOOLS } from '../data/clusterSchoolsData';
import { safeSetItem, safeSetJSON, safeGetItem, safeGetJSON } from '../utils/safeStorage';
import { useAuth } from './AuthContext';
import {
  isLegacyFakeStudent,
  isLegacyFakeEnrollment,
  isLegacyFakeStaff,
  isLegacyFakeStaffPosting,
  isLegacyFakeAttendance,
  isLegacyFakeMDM,
  isLegacyFakeRasoiya,
  isLegacyFakeSHG,
  isLegacyFakeGovernmentWork,
  isLegacyFakeComplaint,
} from '../utils/legacyPurgeHelpers';
import { enforceRuntimeFeatureAccess } from '../config/featureControlRegistry';
import {
  syncSchoolToCloud,
  archiveSchoolInCloud,
  restoreSchoolInCloud,
  deleteSchoolFromCloud,
  subscribeSchoolsFromCloud,
  syncStudentMasterToCloud,
  deleteStudentMasterFromCloud,
  subscribeStudentMastersFromCloud,
  syncStudentEnrollmentToCloud,
  deleteStudentEnrollmentFromCloud,
  subscribeStudentEnrollmentsFromCloud,
  syncStaffMasterToCloud,
  deleteStaffMasterFromCloud,
  subscribeStaffMastersFromCloud,
  syncStaffPostingToCloud,
  deleteStaffPostingFromCloud,
  subscribeStaffPostingsFromCloud,
  syncAttendanceToCloud,
  subscribeAttendanceFromCloud,
  syncMDMToCloud,
  deleteMDMFromCloud,
  subscribeMDMFromCloud,
  syncRasoiyaToCloud,
  deleteRasoiyaFromCloud,
  subscribeRasoiyaFromCloud,
  syncSHGToCloud,
  deleteSHGFromCloud,
  subscribeSHGsFromCloud,
  syncLiteracyRegisterToCloud,
  deleteLiteracyRegisterFromCloud,
  subscribeLiteracyRegistersFromCloud,
  syncIlliteratePersonToCloud,
  deleteIlliteratePersonFromCloud,
  subscribeIlliteratePersonsFromCloud,
  syncAksharSathiToCloud,
  deleteAksharSathiFromCloud,
  subscribeAksharSathisFromCloud,
  syncExamCycleToCloud,
  deleteExamCycleFromCloud,
  subscribeExamCyclesFromCloud,
  syncLiteracyExamResultToCloud,
  deleteLiteracyExamResultFromCloud,
  subscribeLiteracyExamResultsFromCloud,
  syncSupportingInstitutionToCloud,
  deleteSupportingInstitutionFromCloud,
  subscribeSupportingInstitutionsFromCloud,
  syncNotificationToCloud,
  deleteNotificationFromCloud,
  subscribeNotificationsFromCloud,
  syncDocumentToCloud,
  deleteDocumentFromCloud,
  subscribeDocumentsFromCloud,
  syncGovernmentWorkToCloud,
  deleteGovernmentWorkFromCloud,
  subscribeGovernmentWorkFromCloud,
  syncComplaintToCloud,
  deleteComplaintFromCloud,
  subscribeComplaintsFromCloud,
  syncFacilityToCloud,
  subscribeFacilitiesFromCloud,
  syncAcademicSessionToCloud,
  subscribeAcademicSessionsFromCloud,
  syncAuditLogToCloud,
  subscribeAuditLogsFromCloud,
  uploadInitialDatasetToFirestore,
  purgeAllOperationalCloudCollections,
  purgeAllCloudSchools,
  executePhase2LocalToFirestoreMigration,
  preparePhase2LocalToFirestoreMigration,
  Phase2LocalToFirestoreMigrationReport,
  verifyCloudConnectivity,
  CloudConnectivityResult,
} from '../services/cloudDatabaseService';

interface DataContextType {
  // Cloud Database Sync Status
  isCloudConnected: boolean;
  cloudSyncStatus: 'synced' | 'syncing' | 'offline' | 'error';
  lastCloudSyncAt: Date | null;
  triggerManualCloudSync: () => Promise<{ success: boolean; count: number }>;
  connectivityState: CloudConnectivityResult;
  checkCloudConnectivity: () => Promise<CloudConnectivityResult>;

  // Academic Session Management
  academicSessions: AcademicSession[];
  visibleAcademicSessions: AcademicSession[];
  activeSessionId: string;
  selectedSessionId: string;
  activeSession: AcademicSession;
  selectedSession: AcademicSession;
  isCurrentSessionSelected: boolean;
  isSessionLocked: (sessionId?: string) => boolean;
  assertSessionModifiable: (sessionId?: string, operationName?: string) => void;

  setSelectedSessionId: (sessionId: string) => void;
  createAcademicSession: (
    sessionData: Partial<AcademicSession>,
    carryForward: CarryForwardOptions
  ) => { success: boolean; message: string };
  updateAcademicSession: (
    sessionId: string,
    updates: Partial<AcademicSession>
  ) => { success: boolean; message: string };
  activateSession: (sessionId: string) => { success: boolean; message: string };
  closeSession: (sessionId: string) => { success: boolean; message: string };
  archiveSession: (sessionId: string) => { success: boolean; message: string };
  lockSession: (sessionId: string) => { success: boolean; message: string };
  unlockSession: (sessionId: string) => { success: boolean; message: string };

  // Student Permanent Master & Session Records
  studentMasters: StudentMaster[];
  studentAcademicRecords: StudentAcademicRecord[];
  studentTransfers: StudentTransferRecord[];
  getStudentAcademicJourney: (studentId: string) => StudentAcademicJourneyEntry[];

  // School Multi-Year Academic History
  getSchoolAcademicHistory: (schoolUdise: string) => SchoolAcademicHistoryEntry[];

  // Staff Permanent Master & Session Postings
  staffMasters: StaffMaster[];
  staffPostings: StaffPosting[];

  // Promotion Rules & Execution
  promotionRules: PromotionRuleMapping[];
  updatePromotionRules: (rules: PromotionRuleMapping[]) => void;
  promoteStudents: (
    promotions: Array<{
      studentId: string;
      fromSessionId: string;
      toSessionId: string;
      oldClass: string;
      newClass: string;
      status: StudentEnrollmentStatus;
      schoolUdise: string;
      targetSchoolUdise?: string;
      remarks?: string;
    }>
  ) => { promotedCount: number; message: string };
  transferStudent: (
    transferData: Omit<StudentTransferRecord, 'id' | 'transferDate' | 'createdBy' | 'createdByName'>
  ) => { success: boolean; message: string };
  updateStudentTransfer: (
    transferId: string,
    updatedData: Partial<StudentTransferRecord>
  ) => { success: boolean; message: string };

  // Master lists
  schools: School[]; // Canonical Active Schools for operational UI
  allSchools: School[]; // All schools in database (Active + Inactive / Archived)
  activeSchools: School[]; // Explicit Active non-deleted schools
  inactiveSchools: School[]; // Explicit Inactive / Archived schools
  students: Student[];
  staff: Staff[];
  rasoiya: Rasoiya[];
  shgs: SHG[];
  facilities: PhysicalFacility[];
  attendance: AttendanceRecord[];
  mdmRecords: MDMRecord[];
  governmentWork: GovernmentWork[];
  notifications: NotificationItem[];
  complaints: Complaint[];
  documents: DocumentItem[];
  auditLogs: AuditLog[];
  uploadHistory: UploadHistoryItem[];
  settings: AppSettings;

  // Selected School Filter (Global Context for CAC)
  selectedSchoolUdise: string; // '' means all schools for CAC/Admin
  setSelectedSchoolUdise: (udise: string) => void;
  selectedSchool: School | undefined;
  currentSchoolUdise: string; // Strictly derived from currentUser for SCHOOL role, or selectedSchoolUdise for CAC

  // Filtered lists based on role + selectedSchoolUdise
  scopedSchools: School[];
  scopedStudents: Student[];
  scopedStaff: Staff[];
  scopedRasoiya: Rasoiya[];
  scopedSHGs: SHG[];
  scopedFacilities: PhysicalFacility[];
  scopedAttendance: AttendanceRecord[];
  scopedMDM: MDMRecord[];
  scopedWork: GovernmentWork[];
  scopedComplaints: Complaint[];
  scopedDocuments: DocumentItem[];
  scopedNotifications: NotificationItem[];

  // Navbharat Literacy Program (नवभारत साक्षरता कार्यक्रम) State
  literacyRegisters: LiteracyRegister[];
  illiteratePersons: IlliteratePerson[];
  aksharSathis: AksharSathi[];
  examCycles: ExamCycle[];
  literacyExamResults: LiteracyExamResult[];
  supportingInstitutions: SupportingInstitution[];

  // Scoped literacy collections
  scopedLiteracyRegisters: LiteracyRegister[];
  scopedIlliteratePersons: IlliteratePerson[];
  scopedAksharSathis: AksharSathi[];
  scopedExamCycles: ExamCycle[];
  scopedLiteracyExamResults: LiteracyExamResult[];
  scopedSupportingInstitutions: SupportingInstitution[];

  // Literacy dynamic calculated statistics
  literacyStats: LiteracyDashboardStats;

  // Dynamic Calculated Statistics for Dashboard & Reports
  stats: {
    totalSchools: number;
    activeSchools: number;
    inactiveSchools: number;
    totalStudents: number;
    boys: number;
    girls: number;
    sc: number;
    st: number;
    obc: number;
    general: number;
    cwsn: number;
    totalStaff: number;
    principals: number;
    teachers: number;
    rasoiya: number;
    otherStaff: number;
    todayAttendancePct: number;
    todayPresentStudents: number;
    todayTotalMarkedStudents: number;
    mdmServedCount: number;
    mdmEligibleCount: number;
    mdmStatusLabel: string;
    pendingWorkCount: number;
    inProgressWorkCount: number;
    completedWorkCount: number;
    overdueWorkCount: number;
    totalComplaints: number;
    pendingComplaints: number;
    resolvedComplaints: number;
    dataCompletenessPct: number;
  };

  // Simulated Server-Side Data Fetching Endpoints with strict UDISE boundary verification
  fetchStudents: (targetUdise?: string) => Student[];
  fetchStaff: (targetUdise?: string) => Staff[];
  fetchAttendance: (targetUdise?: string, filters?: { date?: string; type?: string; class?: string }) => AttendanceRecord[];
  fetchMDM: (targetUdise?: string, filters?: { date?: string }) => MDMRecord[];
  fetchFacilities: (targetUdise?: string) => PhysicalFacility[];
  fetchGovernmentWork: (targetUdise?: string) => GovernmentWork[];
  fetchComplaints: (targetUdise?: string) => Complaint[];
  fetchSchool: (targetUdise?: string) => School | undefined;

  // Authorization and Scope Verification
  assertSchoolAccess: (requestedUdise?: string, operationName?: string) => void;
  verifySchoolAccess: (requestedUdise?: string) => boolean;

  // CRUD Operations with Automatic Audit Logging
  addSchool: (school: School) => void;
  updateSchool: (school: School, oldUdise?: string) => void;
  deleteSchool: (udise: string) => void;
  archiveSchool: (udise: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  restoreSchool: (udise: string) => Promise<{ success: boolean; message: string }>;
  activateSchool: (udise: string) => Promise<{ success: boolean; message: string }>;
  deactivateSchool: (udise: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  resetSchoolPassword: (udise: string, customNewPassword?: string) => Promise<{ success: boolean; message: string; generatedPassword?: string }>;

  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;

  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (staff: Staff) => void;
  deleteStaff: (id: string) => void;

  addRasoiya: (data: Omit<Rasoiya, 'id'>) => Rasoiya;
  updateRasoiya: (data: Rasoiya) => void;
  deleteRasoiya: (id: string) => void;

  addSHG: (data: Omit<SHG, 'id'>) => SHG;
  updateSHG: (data: SHG) => void;
  deleteSHG: (id: string) => void;

  updateFacility: (facility: PhysicalFacility) => void;
  markAttendance: (record: Omit<AttendanceRecord, 'id' | 'markedAt'>) => void;
  markAttendanceBatch: (records: Omit<AttendanceRecord, 'id' | 'markedAt'>[]) => void;
  saveMDMRecord: (record: Omit<MDMRecord, 'id'> & { id?: string }) => void;
  deleteMDMRecord: (id: string) => void;

  addGovernmentWork: (work: Omit<GovernmentWork, 'id'>) => void;
  updateGovernmentWork: (work: GovernmentWork) => void;
  deleteGovernmentWork: (id: string) => void;

  addComplaint: (complaint: Omit<Complaint, 'id' | 'complaintId'>) => void;
  updateComplaint: (complaint: Complaint) => void;
  resolveComplaint: (
    complaintIdOrId: string,
    resolutionData: {
      resolutionNotes: string;
      resolutionDate?: string;
      status: ComplaintStatus;
      resolutionOutcome?: 'RESOLVED' | 'PARTIAL' | 'FORWARDED' | string;
      forwardedToOfficer?: string;
      forwardedRemarks?: string;
    }
  ) => Complaint;
  closeComplaint: (
    complaintIdOrId: string,
    closeData?: {
      closeDate?: string;
      closeRemark?: string;
    }
  ) => Complaint;
  reopenComplaint: (complaintIdOrId: string, reopenReason: string, reopenDate?: string) => Complaint;
  updateComplaintStatus: (complaintIdOrId: string, newStatus: ComplaintStatus, remark?: string) => Complaint;
  deleteComplaint: (id: string) => void;

  addNotification: (notif: Omit<NotificationItem, 'id'>) => void;
  markNotificationAsRead: (notifId: string) => void;
  deleteNotification: (notifId: string) => void;

  addDocument: (doc: Omit<DocumentItem, 'id'> & { id?: string }) => DocumentItem;
  deleteDocument: (id: string) => void;

  addUploadHistory: (item: UploadHistoryItem) => void;
  clearUploadHistory: () => void;

  bulkImportSchools: (items: School[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportStudents: (items: Student[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportStaff: (items: Staff[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportFacilities: (items: PhysicalFacility[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportAttendance: (items: AttendanceRecord[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportMDM: (items: MDMRecord[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportComplaints: (items: Complaint[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportGovernmentWork: (items: GovernmentWork[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };

  // Literacy Program CRUD
  saveLiteracyRegister: (reg: Omit<LiteracyRegister, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  deleteLiteracyRegister: (id: string) => void;
  addIlliteratePerson: (person: Omit<IlliteratePerson, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateIlliteratePerson: (person: IlliteratePerson) => void;
  deleteIlliteratePerson: (id: string) => void;
  addAksharSathi: (volunteer: Omit<AksharSathi, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAksharSathi: (volunteer: AksharSathi) => void;
  deleteAksharSathi: (id: string) => void;
  addExamCycle: (cycle: Omit<ExamCycle, 'id' | 'createdAt' | 'updatedAt'>) => void;
  saveLiteracyExamResult: (result: Omit<LiteracyExamResult, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => void;
  deleteLiteracyExamResult: (id: string) => void;
  addSupportingInstitution: (partner: Omit<SupportingInstitution, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSupportingInstitution: (partner: SupportingInstitution) => void;
  deleteSupportingInstitution: (id: string) => void;

  bulkImportLiteracyLearners: (items: Partial<IlliteratePerson>[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportAksharSathis: (items: Partial<AksharSathi>[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportExamResults: (items: Partial<LiteracyExamResult>[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };
  bulkImportSupportingInstitutions: (items: Partial<SupportingInstitution>[], mode: DuplicateHandlingMode) => { added: number; updated: number; skipped: number };

  updateSettings: (settings: Partial<AppSettings>) => void;
  logActivity: (
    action: AuditAction,
    module: string,
    details: string,
    meta?: {
      recordId?: string;
      recordName?: string;
      schoolUdise?: string;
      schoolName?: string;
      session?: string;
      sessionId?: string;
      oldValue?: any;
      newValue?: any;
      before?: any;
      after?: any;
      reason?: string;
      entityType?: string;
      entityId?: string;
      featureKey?: string;
      controlType?: 'PERMANENT' | 'TEMPORARY' | 'REACTIVATION' | 'DURATION_EXTENDED' | 'BULK_RESET';
      targetRole?: 'CAC' | 'SCHOOL' | 'BOTH' | 'ALL_ROLES';
      startTime?: string | null;
      endTime?: string | null;
      adminUid?: string;
    }
  ) => void;
  addAuditLog: (entry: Partial<AuditLog> & { action: AuditAction; module: string; description?: string; details?: string }) => void;
  resetToSampleData: () => void;

  // School Master Migration & Audit
  migrationReport: MigrationAuditReport | null;
  runManualMigrationAudit: () => MigrationAuditReport;
}

/**
 * Validates and sanitizes the schools collection.
/**
 * Validates and sanitizes the schools collection.
 * Cleared of all default schools per user directive; only preserves user-added authorized schools.
 */
export const sanitizeCanonicalSchools = (rawSchools: School[]): School[] => {
  if (!Array.isArray(rawSchools) || rawSchools.length === 0) {
    return [];
  }

  // Preserve all valid dynamically added authorized schools
  const result: School[] = [];
  const seenUdises = new Set<string>();

  rawSchools.forEach((s) => {
    if (!s || !s.udise || seenUdises.has(s.udise)) return;
    seenUdises.add(s.udise);

    result.push({
      ...s,
      status: s.status || 'ACTIVE',
      isDeleted: s.isDeleted ?? false,
      deletedAt: s.deletedAt ?? null,
      deletedBy: s.deletedBy ?? null,
      archiveReason: s.archiveReason ?? null,
    });
  });

  return result;
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, firebaseUser, firebaseAuthStatus, firebaseAuthError, retryFirebaseAuth } = useAuth();

  const DB_VERSION_KEY = 'jsk_db_version';
  const CURRENT_DB_VERSION = 'v2026_tikamgarh_baldeogarh_malguwa_v25_all_schools_purged_completely';

  // Primary state collections with persistent localStorage storage
  const [schools, setSchools] = useState<School[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    const saved = localStorage.getItem('jsk_schools');

    // Fresh initialization or upgrade to clean database version:
    // Purges all confirmed fake/demo data and all default schools per user directive
    if (!saved || dbVer !== CURRENT_DB_VERSION) {
      clearAllDocumentBinaries().catch(() => {});
      purgeAllOperationalCloudCollections().catch(() => {});
      purgeAllCloudSchools().catch(() => {});
      safeSetItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
      safeSetJSON('jsk_schools', []);
      safeSetJSON('jsk_students', []);
      safeSetJSON('jsk_staff', []);
      safeSetJSON('jsk_facilities', []);
      safeSetJSON('jsk_attendance', []);
      safeSetJSON('jsk_mdm', []);
      safeSetJSON('jsk_work', []);
      safeSetJSON('jsk_notifications', []);
      safeSetJSON('jsk_complaints', []);
      safeSetJSON('jsk_documents', []);
      safeSetJSON('jsk_audit_logs', initialAuditLogs, 50);
      safeSetJSON('jsk_settings', initialSettings);
      safeSetJSON('jsk_academic_sessions', INITIAL_ACADEMIC_SESSIONS);

      safeSetJSON('jsk_student_masters', []);
      safeSetJSON('jsk_student_academic_records', []);
      safeSetJSON('jsk_student_transfers', []);

      safeSetJSON('jsk_staff_masters', []);
      safeSetJSON('jsk_staff_postings', []);

      safeSetJSON('jsk_literacy_registers', []);
      safeSetJSON('jsk_literacy_illiterates', []);
      safeSetJSON('jsk_literacy_volunteers', []);
      safeSetJSON('jsk_literacy_exam_cycles', initialExamCycles);
      safeSetJSON('jsk_literacy_exam_results', []);
      safeSetJSON('jsk_literacy_institutions', []);
      safeSetJSON('jsk_rasoiya', []);
      safeSetJSON('jsk_shgs', []);
      return [];
    }

    try {
      const parsed = JSON.parse(saved);
      const sanitized = sanitizeCanonicalSchools(Array.isArray(parsed) ? parsed : []);
      return sanitized;
    } catch {
      safeSetJSON('jsk_schools', []);
      return [];
    }
  });

  // Academic Session Management State
  const [academicSessions, setAcademicSessions] = useState<AcademicSession[]>(() => {
    const saved = localStorage.getItem('jsk_academic_sessions');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((s: any) => s.id));
          const sanitizedParsed = parsed.map((s: AcademicSession) => ({
            ...s,
            visibleToCAC: s.visibleToCAC ?? true,
            visibleToSchool: s.visibleToSchool ?? true,
          }));
          const missing = INITIAL_ACADEMIC_SESSIONS.filter((s) => !existingIds.has(s.id));
          const merged = [...sanitizedParsed, ...missing];
          return merged.sort((a, b) => b.startYear - a.startYear);
        }
      } catch (e) {
        console.error('Failed to parse academic sessions', e);
      }
    }
    return INITIAL_ACADEMIC_SESSIONS;
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem('jsk_active_session_id');
    return saved || '2026-27';
  });

  const [selectedSessionId, setSelectedSessionIdState] = useState<string>(() => {
    const saved = localStorage.getItem('jsk_selected_session_id');
    return saved || '2026-27';
  });

  // Student Permanent Master & Academic Enrollment Records
  const [studentMasters, setStudentMasters] = useState<StudentMaster[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_student_masters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((m) => !isLegacyFakeStudent(m));
      } catch (e) {
        console.error('Failed to parse student masters', e);
      }
    }
    return [];
  });

  const [studentAcademicRecords, setStudentAcademicRecords] = useState<StudentAcademicRecord[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_student_academic_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((r) => !isLegacyFakeEnrollment(r));
      } catch (e) {
        console.error('Failed to parse student academic records', e);
      }
    }
    return [];
  });

  const [studentTransfers, setStudentTransfers] = useState<StudentTransferRecord[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_student_transfers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((t: any) => ({
            ...t,
            destinationSchoolName:
              t.destinationSchoolName ||
              (t.newSchoolName && t.newSchoolName !== 'OTHER' && t.newSchoolName !== 'अन्य विद्यालय (Other)'
                ? t.newSchoolName
                : undefined),
            destinationSchoolUdise:
              t.destinationSchoolUdise ||
              (t.newSchoolUdise && t.newSchoolUdise !== 'OTHER' ? t.newSchoolUdise : undefined),
          }));
        }
      } catch (e) {
        console.error('Failed to parse student transfers', e);
      }
    }
    return [];
  });

  // Staff Permanent Master & Postings
  const [staffMasters, setStaffMasters] = useState<StaffMaster[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_staff_masters');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((s) => !isLegacyFakeStaff(s));
      } catch (e) {
        console.error('Failed to parse staff masters', e);
      }
    }
    return [];
  });

  const [staffPostings, setStaffPostings] = useState<StaffPosting[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_staff_postings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.filter((p) => !isLegacyFakeStaffPosting(p));
      } catch (e) {
        console.error('Failed to parse staff postings', e);
      }
    }
    return [];
  });

  const [promotionRules, setPromotionRules] = useState<PromotionRuleMapping[]>(() => {
    const saved = localStorage.getItem('jsk_promotion_rules');
    return saved ? JSON.parse(saved) : DEFAULT_PROMOTION_RULES;
  });

  // Dynamic Session References
  const visibleAcademicSessions = useMemo(() => {
    if (!currentUser || currentUser.role === 'ADMIN') {
      return academicSessions;
    }
    if (currentUser.role === 'CAC') {
      return academicSessions.filter((s) => s.visibleToCAC !== false && s.status !== 'INACTIVE');
    }
    if (currentUser.role === 'SCHOOL') {
      return academicSessions.filter((s) => s.visibleToSchool !== false && s.status !== 'INACTIVE');
    }
    return academicSessions.filter((s) => s.visibleToSchool !== false && s.status !== 'INACTIVE');
  }, [academicSessions, currentUser]);

  const activeSession = useMemo(() => {
    return academicSessions.find((s) => s.id === activeSessionId) || academicSessions.find((s) => s.isCurrent) || academicSessions[0];
  }, [academicSessions, activeSessionId]);

  const selectedSession = useMemo(() => {
    return academicSessions.find((s) => s.id === selectedSessionId) || activeSession;
  }, [academicSessions, selectedSessionId, activeSession]);

  const isCurrentSessionSelected = selectedSessionId === activeSessionId;

  // Enforce session visibility fallback for non-admin roles
  useEffect(() => {
    if (!currentUser || currentUser.role === 'ADMIN') return;
    const isVisible = visibleAcademicSessions.some((s) => s.id === selectedSessionId);
    if (!isVisible && visibleAcademicSessions.length > 0) {
      const fallback = visibleAcademicSessions.find((s) => s.id === activeSessionId) || visibleAcademicSessions[0];
      if (fallback && fallback.id !== selectedSessionId) {
        setSelectedSessionIdState(fallback.id);
        safeSetItem('jsk_selected_session_id', fallback.id);
      }
    }
  }, [currentUser, visibleAcademicSessions, selectedSessionId, activeSessionId]);

  // Dynamic composed Student & Staff for the selected session
  const students = useMemo(() => {
    return composeStudentsForSession(studentMasters, studentAcademicRecords, selectedSessionId);
  }, [studentMasters, studentAcademicRecords, selectedSessionId]);

  const staff = useMemo(() => {
    return composeStaffForSession(staffMasters, staffPostings, selectedSessionId);
  }, [staffMasters, staffPostings, selectedSessionId]);

  const [facilities, setFacilities] = useState<PhysicalFacility[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_facilities');
    return saved ? JSON.parse(saved) : [];
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_attendance');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse attendance', e);
      }
    }
    return [];
  });

  const [mdmRecords, setMdmRecords] = useState<MDMRecord[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_mdm');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse mdm', e);
      }
    }
    return [];
  });

  const [governmentWork, setGovernmentWork] = useState<GovernmentWork[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_work');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse work', e);
      }
    }
    return [];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const ensureComplaintModel = (c: any): Complaint => {
    const originalDate = c.complaintDate || c.date || c.createdAt || new Date().toISOString().split('T')[0];
    const history: ComplaintHistoryItem[] = Array.isArray(c.complaintHistory) && c.complaintHistory.length > 0
      ? [...c.complaintHistory]
      : [];

    if (history.length === 0) {
      // 1. Creation event
      history.push({
        id: `hist-init-${c.id || '0'}-1`,
        action: 'CREATED',
        date: originalDate,
        dateTime: originalDate,
        timestamp: originalDate,
        userName: c.complainantName || c.submittedBy || 'शिकायतकर्ता',
        userRole: c.submitterRole || 'नागरिक / शिक्षक',
        remark: c.subject || c.title || 'शिकायत पंजीकृत की गई',
        newStatus: (c.status === 'PENDING' ? 'OPEN' : c.status) || 'OPEN',
      });

      // 2. In progress event if relevant
      if ((c.status === 'IN_PROGRESS' || c.assignedTo) && c.actionTaken) {
        history.push({
          id: `hist-init-${c.id || '0'}-2`,
          action: 'IN_PROGRESS',
          date: c.date || originalDate,
          dateTime: c.date || originalDate,
          userName: c.assignedTo || 'प्रभारी',
          remark: c.actionTaken || 'कार्यवाही प्रारंभ की गई',
          previousStatus: 'OPEN',
          newStatus: 'IN_PROGRESS',
        });
      }

      // 3. Resolution event if resolved or closed
      if (c.resolutionDate || c.resolvedByName || c.status === 'RESOLVED' || c.status === 'CLOSED') {
        history.push({
          id: `hist-init-${c.id || '0'}-3`,
          action: 'RESOLVED',
          date: c.resolutionDate || originalDate,
          dateTime: c.resolutionDate || originalDate,
          userName: c.resolvedByName || c.resolvedBy || 'अधिकृत अधिकारी',
          userRole: c.resolverRole || 'अधिकारी',
          remark: c.actionTaken || c.resolutionNotes || 'समस्या का समाधान दर्ज किया गया',
          resolutionOutcome: c.resolutionOutcome || 'RESOLVED',
          forwardedTo: c.forwardedToOfficer,
          previousStatus: 'IN_PROGRESS',
          newStatus: 'RESOLVED',
        });
      }

      // 4. Close event if closed
      if (c.closeDate || c.closedAt || c.status === 'CLOSED') {
        history.push({
          id: `hist-init-${c.id || '0'}-4`,
          action: 'CLOSED',
          date: c.closeDate || c.closedAt || c.resolutionDate || originalDate,
          dateTime: c.closeDate || c.closedAt || c.resolutionDate || originalDate,
          userName: c.closedByName || c.closedBy || 'अधिकृत अधिकारी',
          userRole: c.closerRole || 'अधिकारी',
          remark: c.closeRemark || 'शिकायत विधिवत बंद की गई',
          previousStatus: 'RESOLVED',
          newStatus: 'CLOSED',
        });
      }

      // 5. Reopen event if reopened
      if (c.reopenedDate) {
        history.push({
          id: `hist-init-${c.id || '0'}-5`,
          action: 'REOPENED',
          date: c.reopenedDate,
          dateTime: c.reopenedDate,
          userName: c.reopenedBy || 'अधिकृत अधिकारी',
          userRole: c.reopenerRole || 'अधिकारी',
          reason: c.reopenReason || 'पुनः खोली गई',
          remark: c.reopenReason || 'पुनः खोली गई',
          previousStatus: (c.closeDate || c.closedAt) ? 'CLOSED' : 'RESOLVED',
          newStatus: 'REOPENED',
        });
      }
    }

    return {
      ...c,
      date: originalDate,
      complaintDate: originalDate,
      createdAt: c.createdAt || originalDate,
      closeDate: c.closeDate || c.closedAt,
      complaintHistory: history,
    };
  };

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_complaints');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(ensureComplaintModel);
      } catch (e) {
        console.error('Failed to parse complaints', e);
      }
    }
    return [];
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_documents');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse documents', e);
      }
    }
    return [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const parsed = safeGetJSON<AuditLog[] | null>('jsk_audit_logs', null);
    if (parsed && Array.isArray(parsed) && parsed.length > 0) {
      try {
        const seenIds = new Set<string>();
        let hasDuplicates = false;
        const sanitized: AuditLog[] = parsed.slice(0, 75).map((log: AuditLog, idx: number) => {
          if (!log || typeof log !== 'object') return log;
          if (!log.id || seenIds.has(log.id)) {
            hasDuplicates = true;
            const uniqueId = `AUD-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
            return { ...log, id: uniqueId };
          }
          seenIds.add(log.id);
          return log;
        });
        if (hasDuplicates || parsed.length > 75) {
          safeSetJSON('jsk_audit_logs', sanitized, 50);
        }
        return sanitized;
      } catch (e) {
        console.warn('Failed to parse audit logs from localStorage', e);
      }
    }
    return initialAuditLogs;
  });

  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_upload_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('jsk_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  const [rasoiya, setRasoiya] = useState<Rasoiya[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_rasoiya');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse rasoiya', e);
      }
    }
    return [];
  });

  const [shgs, setShgs] = useState<SHG[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_shgs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse shgs', e);
      }
    }
    return [];
  });

  // Navbharat Literacy Program state collections
  const [literacyRegisters, setLiteracyRegisters] = useState<LiteracyRegister[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_literacy_registers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse literacy registers', e);
      }
    }
    return [];
  });

  const [illiteratePersons, setIlliteratePersons] = useState<IlliteratePerson[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_literacy_illiterates');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse illiterate persons', e);
      }
    }
    return [];
  });

  const [aksharSathis, setAksharSathis] = useState<AksharSathi[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_literacy_volunteers');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse akshar sathis', e);
      }
    }
    return [];
  });

  const [examCycles, setExamCycles] = useState<ExamCycle[]>(() => {
    const saved = localStorage.getItem('jsk_literacy_exam_cycles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((c: any) => c.id));
          const missing = initialExamCycles.filter((c) => !existingIds.has(c.id));
          const merged = missing.length > 0 ? [...parsed, ...missing] : parsed;
          return merged.map((c: any) => {
            const master = findExamCycleMaster(c.id) || findExamCycleMaster(c.examName);
            return {
              ...c,
              sessionId: c.sessionId || c.academicYear || master?.sessionId || '2026-27',
              academicYear: c.sessionId || c.academicYear || master?.sessionId || '2026-27',
              cycleId: c.id,
              cycleName: c.examCycleName || c.examName || master?.cycleName || '',
            };
          });
        }
      } catch (e) {
        console.error('Failed to parse exam cycles', e);
      }
    }
    return initialExamCycles;
  });

  const normalizeExamResultRecord = (r: any): LiteracyExamResult => {
    const f = Math.max(0, Number(r.femaleLearners ?? r.femaleCount) || 0);
    const m = Math.max(0, Number(r.maleLearners ?? r.maleCount) || 0);
    const total = f + m;
    const pass = Math.max(0, Number(r.passedLearners ?? r.passedCount) || 0);
    const fail = Math.max(0, Number(r.failedLearners ?? r.failedCount) || 0);
    const rem = Math.max(0, total - pass - fail);
    const part = Number(r.participatedLearners ?? r.participatedCount) || (pass + fail);
    const cycleId = r.cycleId || r.examCycleId || '';
    const masterCycle = findExamCycleMaster(cycleId) || findExamCycleMaster(r.examName);
    const cycleName = r.cycleName || r.examCycleName || masterCycle?.cycleName || masterCycle?.examName || r.examName || '';
    const sId = r.sessionId || r.academicYear || masterCycle?.sessionId || '2026-27';

    return {
      ...r,
      sessionId: sId,
      academicYear: sId,
      schoolId: r.schoolId || r.schoolUdise || '',
      schoolUdise: r.schoolUdise || r.schoolId || '',
      cycleId: cycleId || masterCycle?.cycleId || '',
      examCycleId: cycleId || masterCycle?.cycleId || '',
      cycleName: cycleName,
      examCycleName: cycleName,
      examName: r.examName || masterCycle?.examName || cycleName,
      examDate: r.examDate || masterCycle?.examDate || '',
      femaleLearners: f,
      femaleCount: f,
      maleLearners: m,
      maleCount: m,
      totalLearners: total,
      totalCount: total,
      participatedLearners: part,
      participatedCount: part,
      passedLearners: pass,
      passedCount: pass,
      failedLearners: fail,
      failedCount: fail,
      remainingIlliterateLearners: rem,
      remainingCount: rem,
      successRate: total > 0 ? Number(((pass / total) * 100).toFixed(1)) : 0,
    };
  };

  const [literacyExamResults, setLiteracyExamResults] = useState<LiteracyExamResult[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_literacy_exam_results');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.map(normalizeExamResultRecord);
      } catch (e) {
        console.error('Failed to parse literacy exam results', e);
      }
    }
    return [];
  });

  const [supportingInstitutions, setSupportingInstitutions] = useState<SupportingInstitution[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) return [];
    const saved = localStorage.getItem('jsk_literacy_institutions');
    return saved ? JSON.parse(saved) : [];
  });

  // Selected School UDISE for CAC filter
  const [selectedSchoolUdise, setSelectedSchoolUdiseState] = useState<string>('');

  const isSchoolUser = currentUser?.role === 'SCHOOL';

  // Strict immutable school scope derived from currentUser for SCHOOL role
  const currentSchoolUdise = useMemo(() => {
    if (isSchoolUser) {
      return currentUser?.assignedSchoolUdise || '';
    }
    return selectedSchoolUdise || '';
  }, [isSchoolUser, currentUser, selectedSchoolUdise]);

  const setSelectedSchoolUdise = (udise: string) => {
    if (isSchoolUser) {
      // Immutable for School role - cannot change scope
      return;
    }
    setSelectedSchoolUdiseState(udise);
  };

  // Enforce role-based school restriction:
  // If user is School, Principal or Teacher, lock selection to their assignedSchoolUdise
  useEffect(() => {
    if (currentUser && isSchoolUser) {
      if (currentUser.assignedSchoolUdise) {
        setSelectedSchoolUdiseState(currentUser.assignedSchoolUdise);
      }
    }
  }, [currentUser, isSchoolUser]);

  // Cloud Database Sync Status & Network Separation
  const [isBrowserOnline, setIsBrowserOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('syncing');
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<Date | null>(null);
  const isInitialCloudSyncDoneRef = useRef<boolean>(false);

  // Granular Cloud Connectivity state
  const [connectivityState, setConnectivityState] = useState<CloudConnectivityResult>({
    isBrowserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isFirebaseAuthActive: false,
    firebaseUid: null,
    status: 'initializing',
    statusLabel: 'प्रारंभ हो रहा है... (Initializing)',
    statusColor: 'amber',
    message: 'Firebase सेवा और प्रमाणीकरण सत्र की जाँच हो रही है...',
    timestamp: new Date(),
  });

  const checkCloudConnectivity = async (): Promise<CloudConnectivityResult> => {
    const res = await verifyCloudConnectivity();
    setConnectivityState(res);
    if (res.status === 'connected') {
      setIsCloudConnected(true);
      setCloudSyncStatus('synced');
      setLastCloudSyncAt(res.timestamp);
    } else if (res.status === 'offline') {
      setIsCloudConnected(false);
      setCloudSyncStatus('offline');
    } else {
      setIsCloudConnected(false);
      setCloudSyncStatus('error');
    }
    return res;
  };

  // Browser network status listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsBrowserOnline(true);
      checkCloudConnectivity();
    };
    const handleOffline = () => {
      setIsBrowserOnline(false);
      setConnectivityState({
        isBrowserOnline: false,
        isFirebaseAuthActive: false,
        firebaseUid: null,
        status: 'offline',
        statusLabel: 'ऑफ़लाइन (Network Offline)',
        statusColor: 'red',
        message: 'डिवाइस का इंटरनेट कनेक्शन बंद है (Browser Network Offline)।',
        timestamp: new Date(),
      });
      setIsCloudConnected(false);
      setCloudSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleListenerError = (err: any, source: string) => {
    const code = err?.code || '';
    console.warn(`Firestore subscription notice [${source}]:`, code, err?.message);

    if (code === 'permission-denied') {
      setConnectivityState((prev) => ({
        ...prev,
        status: 'permission_denied',
        statusLabel: 'अनुमति त्रुटि (Authorization Error)',
        statusColor: 'red',
        message: `सुरक्षा नियमों द्वारा '${source}' संग्रह हेतु अनुमति अस्वीकृत (permission-denied)।`,
        timestamp: new Date(),
      }));
      setCloudSyncStatus('error');
      setIsCloudConnected(false);
    } else if (code === 'unauthenticated') {
      setConnectivityState((prev) => ({
        ...prev,
        status: 'auth_required',
        statusLabel: 'प्रमाणीकरण आवश्यक (Auth Required)',
        statusColor: 'amber',
        message: 'Firebase Auth सत्र प्रमाणीकरण आवश्यक है।',
        timestamp: new Date(),
      }));
      setCloudSyncStatus('error');
      setIsCloudConnected(false);
    } else if (code === 'unavailable' || code === 'deadline-exceeded') {
      setConnectivityState((prev) => ({
        ...prev,
        status: 'unavailable',
        statusLabel: 'क्लाउड अनुपलब्ध (Unavailable)',
        statusColor: 'amber',
        message: 'Google Cloud Firestore सर्वर अस्थायी रूप से अनुपलब्ध है।',
        timestamp: new Date(),
      }));
      setCloudSyncStatus('offline');
      setIsCloudConnected(false);
    } else if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setConnectivityState((prev) => ({
        ...prev,
        status: 'offline',
        statusLabel: 'ऑफ़लाइन (Network Offline)',
        statusColor: 'red',
        message: 'डिवाइस का इंटरनेट कनेक्शन बंद है।',
        timestamp: new Date(),
      }));
      setCloudSyncStatus('offline');
      setIsCloudConnected(false);
    } else {
      setConnectivityState((prev) => ({
        ...prev,
        status: 'error',
        statusLabel: 'सिंक त्रुटि (Error)',
        statusColor: 'red',
        message: err?.message || 'अज्ञात Firestore त्रुटि।',
        timestamp: new Date(),
      }));
      setCloudSyncStatus('error');
      setIsCloudConnected(false);
    }
  };

  const handleListenerSuccess = () => {
    setIsCloudConnected(true);
    setCloudSyncStatus('synced');
    setLastCloudSyncAt(new Date());
    setConnectivityState({
      isBrowserOnline: true,
      isFirebaseAuthActive: true,
      firebaseUid: firebaseUser?.uid || null,
      status: 'connected',
      statusLabel: 'क्लाउड लाइव (Cloud Live)',
      statusColor: 'emerald',
      message: 'Firestore से सीधा सुरक्षित कनेक्शन सक्रिय है।',
      timestamp: new Date(),
    });
  };

  // Real-time Cloud Subscriptions across all clients & devices
  useEffect(() => {
    // 1. If browser network is offline
    if (!isBrowserOnline) {
      setConnectivityState({
        isBrowserOnline: false,
        isFirebaseAuthActive: false,
        firebaseUid: null,
        status: 'offline',
        statusLabel: 'ऑफ़लाइन (Network Offline)',
        statusColor: 'red',
        message: 'डिवाइस का इंटरनेट कनेक्शन बंद है (Browser Network Offline)।',
        timestamp: new Date(),
      });
      setIsCloudConnected(false);
      setCloudSyncStatus('offline');
      return;
    }

    // 2. If Auth is still initializing
    if (firebaseAuthStatus === 'initializing') {
      setConnectivityState({
        isBrowserOnline: true,
        isFirebaseAuthActive: false,
        firebaseUid: null,
        status: 'initializing',
        statusLabel: 'प्रारंभ हो रहा है... (Initializing)',
        statusColor: 'amber',
        message: 'Firebase Auth सत्र का सत्यापन किया जा रहा है...',
        timestamp: new Date(),
      });
      setCloudSyncStatus('syncing');
      return;
    }

    // 3. If Auth failed with auth/operation-not-allowed
    if (firebaseAuthStatus === 'error' && firebaseAuthError === 'auth/operation-not-allowed') {
      setConnectivityState({
        isBrowserOnline: true,
        isFirebaseAuthActive: false,
        firebaseUid: null,
        status: 'auth_error',
        statusLabel: 'Auth Provider अक्षम (auth/operation-not-allowed)',
        statusColor: 'amber',
        message: 'Firebase Console में Email/Password Provider अक्षम है। कृपया Authentication में इसे सक्षम करें।',
        timestamp: new Date(),
      });
      setCloudSyncStatus('error');
      setIsCloudConnected(false);
      return;
    }

    // 4. If user not logged in via Firebase Auth
    if (!firebaseUser) {
      setConnectivityState({
        isBrowserOnline: true,
        isFirebaseAuthActive: false,
        firebaseUid: null,
        status: 'auth_required',
        statusLabel: 'प्रमाणीकरण आवश्यक (Auth Required)',
        statusColor: 'amber',
        message: 'Firebase Auth प्रमाणीकरण सक्रिय नहीं है। Firestore सुरक्षा नियमों हेतु प्रमाणीकरण आवश्यक है।',
        timestamp: new Date(),
      });
      setCloudSyncStatus('error');
      setIsCloudConnected(false);
      return;
    }

    // 5. User is authenticated with Firebase Auth -> establish listeners
    let unsubs: (() => void)[] = [];
    setCloudSyncStatus('syncing');

    // CRITICAL: For SCHOOL role, pass assignedSchoolUdise so all school-scoped collection listeners
    // execute query(collection(db, path), where('schoolUdise', '==', listenerScopeUdise))
    // instead of unfiltered collection-wide reads that Firestore Rules would reject with permission-denied.
    const listenerScopeUdise =
      currentUser?.role === 'SCHOOL' ? (currentUser.assignedSchoolUdise || undefined) : undefined;

    try {
      // 1. Schools Listener
      const unsubSchools = subscribeSchoolsFromCloud(
        (cloudSchools) => {
          if (Array.isArray(cloudSchools)) {
            // Check for legacy default schools in cloud and purge them if present
            const legacyUdises = new Set(CLUSTER_37_SCHOOLS.map((s) => s.udise));
            const legacyInCloud = cloudSchools.filter((s) => legacyUdises.has(s.udise));
            if (legacyInCloud.length > 0) {
              purgeAllCloudSchools().catch(() => {});
            }
            const cleanSchools = cloudSchools.filter((s) => !legacyUdises.has(s.udise));
            setSchools(sanitizeCanonicalSchools(cleanSchools));
            safeSetJSON('jsk_schools', cleanSchools);
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'schools')
      );
      unsubs.push(unsubSchools);

      // 2. Student Masters Listener
      const unsubStudentMasters = subscribeStudentMastersFromCloud(
        (cloudMasters) => {
          if (Array.isArray(cloudMasters)) {
            const fakeMasters = cloudMasters.filter(isLegacyFakeStudent);
            if (fakeMasters.length > 0) {
              fakeMasters.forEach((m) => {
                deleteStudentMasterFromCloud(m.id).catch(() => {});
              });
            }
            const cleanMasters = cloudMasters.filter((m) => !isLegacyFakeStudent(m));
            setStudentMasters(cleanMasters);
            safeSetJSON('jsk_student_masters', cleanMasters);
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'studentMasters')
      );
      unsubs.push(unsubStudentMasters);

      // 3. Student Enrollments Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubEnrollments = subscribeStudentEnrollmentsFromCloud(
        (cloudEnrollments) => {
          if (Array.isArray(cloudEnrollments)) {
            const fakeEnrollments = cloudEnrollments.filter(isLegacyFakeEnrollment);
            if (fakeEnrollments.length > 0) {
              fakeEnrollments.forEach((e) => {
                deleteStudentEnrollmentFromCloud(e.id).catch(() => {});
              });
            }
            const cleanEnrollments = cloudEnrollments.filter((e) => !isLegacyFakeEnrollment(e));
            setStudentAcademicRecords((prev) => {
              if (!listenerScopeUdise) return cleanEnrollments;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise && !isLegacyFakeEnrollment(r));
              return [...others, ...cleanEnrollments];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'studentAcademicRecords'),
        listenerScopeUdise
      );
      unsubs.push(unsubEnrollments);

      // 4. Staff Masters Listener
      const unsubStaffMasters = subscribeStaffMastersFromCloud(
        (cloudStaffMasters) => {
          if (Array.isArray(cloudStaffMasters)) {
            const fakeStaff = cloudStaffMasters.filter(isLegacyFakeStaff);
            if (fakeStaff.length > 0) {
              fakeStaff.forEach((s) => {
                deleteStaffMasterFromCloud(s.id).catch(() => {});
              });
            }
            const cleanStaff = cloudStaffMasters.filter((s) => !isLegacyFakeStaff(s));
            setStaffMasters(cleanStaff);
            safeSetJSON('jsk_staff_masters', cleanStaff);
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'staffMasters')
      );
      unsubs.push(unsubStaffMasters);

      // 5. Staff Postings Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubStaffPostings = subscribeStaffPostingsFromCloud(
        (cloudPostings) => {
          if (Array.isArray(cloudPostings)) {
            const fakePostings = cloudPostings.filter(isLegacyFakeStaffPosting);
            if (fakePostings.length > 0) {
              fakePostings.forEach((p) => {
                deleteStaffPostingFromCloud(p.id).catch(() => {});
              });
            }
            const cleanPostings = cloudPostings.filter((p) => !isLegacyFakeStaffPosting(p));
            setStaffPostings((prev) => {
              if (!listenerScopeUdise) return cleanPostings;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise && !isLegacyFakeStaffPosting(r));
              return [...others, ...cleanPostings];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'staffPostings'),
        listenerScopeUdise
      );
      unsubs.push(unsubStaffPostings);

      // 6. Attendance Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubAttendance = subscribeAttendanceFromCloud(
        (cloudAttendance) => {
          if (Array.isArray(cloudAttendance)) {
            const cleanAttendance = cloudAttendance.filter((a) => !isLegacyFakeAttendance(a));
            setAttendance((prev) => {
              if (!listenerScopeUdise) return cleanAttendance;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise && !isLegacyFakeAttendance(r));
              return [...others, ...cleanAttendance];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'attendance'),
        listenerScopeUdise
      );
      unsubs.push(unsubAttendance);

      // 7. MDM Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubMDM = subscribeMDMFromCloud(
        (cloudMDM) => {
          if (Array.isArray(cloudMDM)) {
            const fakeMDM = cloudMDM.filter(isLegacyFakeMDM);
            if (fakeMDM.length > 0) {
              fakeMDM.forEach((m) => {
                deleteMDMFromCloud(m.id).catch(() => {});
              });
            }
            const cleanMDM = cloudMDM.filter((m) => !isLegacyFakeMDM(m));
            setMdmRecords((prev) => {
              if (!listenerScopeUdise) return cleanMDM;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise && !isLegacyFakeMDM(r));
              return [...others, ...cleanMDM];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'mdmRecords'),
        listenerScopeUdise
      );
      unsubs.push(unsubMDM);

      // 8. Rasoiya Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubRasoiya = subscribeRasoiyaFromCloud(
        (cloudRasoiya) => {
          if (Array.isArray(cloudRasoiya)) {
            const fakeRasoiya = cloudRasoiya.filter(isLegacyFakeRasoiya);
            if (fakeRasoiya.length > 0) {
              fakeRasoiya.forEach((r) => {
                deleteRasoiyaFromCloud(r.id).catch(() => {});
              });
            }
            const cleanRasoiya = cloudRasoiya.filter((r) => !isLegacyFakeRasoiya(r));
            setRasoiya((prev) => {
              if (!listenerScopeUdise) return cleanRasoiya;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise && !isLegacyFakeRasoiya(r));
              return [...others, ...cleanRasoiya];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'rasoiya'),
        listenerScopeUdise
      );
      unsubs.push(unsubRasoiya);

      // 8b. SHG (Self-Help Groups) Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubSHGs = subscribeSHGsFromCloud(
        (cloudSHGs) => {
          if (Array.isArray(cloudSHGs)) {
            const fakeSHGs = cloudSHGs.filter(isLegacyFakeSHG);
            if (fakeSHGs.length > 0) {
              fakeSHGs.forEach((s) => {
                deleteSHGFromCloud(s.id).catch(() => {});
              });
            }
            const cleanSHGs = cloudSHGs.filter((s) => !isLegacyFakeSHG(s));
            setShgs((prev) => {
              if (!listenerScopeUdise) return cleanSHGs;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise && !isLegacyFakeSHG(r));
              return [...others, ...cleanSHGs];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'shgs'),
        listenerScopeUdise
      );
      unsubs.push(unsubSHGs);

      // 8c. ULLAS Literacy Registers Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubLiteracyRegisters = subscribeLiteracyRegistersFromCloud(
        (cloudRegs) => {
          if (Array.isArray(cloudRegs) && cloudRegs.length > 0) {
            setLiteracyRegisters((prev) => {
              if (!listenerScopeUdise) return cloudRegs;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise);
              return [...others, ...cloudRegs];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'literacyRegisters'),
        listenerScopeUdise
      );
      unsubs.push(unsubLiteracyRegisters);

      // 8d. ULLAS Illiterate Persons Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubIlliterates = subscribeIlliteratePersonsFromCloud(
        (cloudIlliterates) => {
          if (Array.isArray(cloudIlliterates) && cloudIlliterates.length > 0) {
            setIlliteratePersons((prev) => {
              if (!listenerScopeUdise) return cloudIlliterates;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise);
              return [...others, ...cloudIlliterates];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'illiteratePersons'),
        listenerScopeUdise
      );
      unsubs.push(unsubIlliterates);

      // 8e. ULLAS Akshar Sathis Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubAksharSathis = subscribeAksharSathisFromCloud(
        (cloudVolunteers) => {
          if (Array.isArray(cloudVolunteers) && cloudVolunteers.length > 0) {
            setAksharSathis((prev) => {
              if (!listenerScopeUdise) return cloudVolunteers;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise);
              return [...others, ...cloudVolunteers];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'aksharSathis'),
        listenerScopeUdise
      );
      unsubs.push(unsubAksharSathis);

      // 8f. ULLAS Exam Cycles Listener
      const unsubExamCycles = subscribeExamCyclesFromCloud(
        (cloudCycles) => {
          if (Array.isArray(cloudCycles) && cloudCycles.length > 0) {
            setExamCycles(cloudCycles);
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'examCycles')
      );
      unsubs.push(unsubExamCycles);

      // 8g. ULLAS Literacy Exam Results Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubExamResults = subscribeLiteracyExamResultsFromCloud(
        (cloudResults) => {
          if (Array.isArray(cloudResults) && cloudResults.length > 0) {
            const normalized = cloudResults.map(normalizeExamResultRecord);
            setLiteracyExamResults((prev) => {
              if (!listenerScopeUdise) return normalized;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise);
              return [...others, ...normalized];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'literacyExamResults'),
        listenerScopeUdise
      );
      unsubs.push(unsubExamResults);

      // 8h. ULLAS Supporting Institutions Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubInstitutions = subscribeSupportingInstitutionsFromCloud(
        (cloudInstitutions) => {
          if (Array.isArray(cloudInstitutions) && cloudInstitutions.length > 0) {
            setSupportingInstitutions((prev) => {
              if (!listenerScopeUdise) return cloudInstitutions;
              const others = prev.filter((r) => r.schoolUdise !== listenerScopeUdise);
              return [...others, ...cloudInstitutions];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'supportingInstitutions'),
        listenerScopeUdise
      );
      unsubs.push(unsubInstitutions);

      // 8i. Cluster Notifications Listener (Scoped for SCHOOL role)
      const unsubNotifications = subscribeNotificationsFromCloud(
        (cloudNotifs) => {
          if (Array.isArray(cloudNotifs) && cloudNotifs.length > 0) {
            setNotifications(cloudNotifs);
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'notifications'),
        listenerScopeUdise
      );
      unsubs.push(unsubNotifications);

      // 8j. Documents Metadata Listener (Scoped by [schoolUdise, 'ALL'] for SCHOOL role)
      const unsubDocuments = subscribeDocumentsFromCloud(
        (cloudDocs) => {
          if (Array.isArray(cloudDocs) && cloudDocs.length > 0) {
            setDocuments((prev) => {
              if (!listenerScopeUdise) return cloudDocs;
              const others = prev.filter((d) => d.schoolUdise !== listenerScopeUdise && d.schoolUdise !== 'ALL');
              return [...others, ...cloudDocs];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'documents'),
        listenerScopeUdise
      );
      unsubs.push(unsubDocuments);

      // 9. Government Work Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubWork = subscribeGovernmentWorkFromCloud(
        (cloudWork) => {
          if (Array.isArray(cloudWork)) {
            const fakeWork = cloudWork.filter(isLegacyFakeGovernmentWork);
            if (fakeWork.length > 0) {
              fakeWork.forEach((w) => {
                deleteGovernmentWorkFromCloud(w.id).catch(() => {});
              });
            }
            const cleanWork = cloudWork.filter((w) => !isLegacyFakeGovernmentWork(w));
            setGovernmentWork((prev) => {
              if (!listenerScopeUdise) return cleanWork;
              const others = prev.filter((w) => w.schoolUdise !== listenerScopeUdise && !isLegacyFakeGovernmentWork(w));
              return [...others, ...cleanWork];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'governmentWork'),
        listenerScopeUdise
      );
      unsubs.push(unsubWork);

      // 10. Complaints Listener (Scoped by schoolUdise for SCHOOL role)
      const unsubComplaints = subscribeComplaintsFromCloud(
        (cloudComplaints) => {
          if (Array.isArray(cloudComplaints)) {
            const fakeComplaints = cloudComplaints.filter(isLegacyFakeComplaint);
            if (fakeComplaints.length > 0) {
              fakeComplaints.forEach((c) => {
                deleteComplaintFromCloud(c.id).catch(() => {});
              });
            }
            const cleanComplaints = cloudComplaints.filter((c) => !isLegacyFakeComplaint(c));
            setComplaints((prev) => {
              if (!listenerScopeUdise) return cleanComplaints;
              const others = prev.filter((c) => c.schoolUdise !== listenerScopeUdise && !isLegacyFakeComplaint(c));
              return [...others, ...cleanComplaints];
            });
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'complaints'),
        listenerScopeUdise
      );
      unsubs.push(unsubComplaints);

      // 11. Facilities Listener
      const unsubFacilities = subscribeFacilitiesFromCloud(
        (cloudFacilities) => {
          if (Array.isArray(cloudFacilities) && cloudFacilities.length > 0) {
            setFacilities(cloudFacilities);
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'facilities')
      );
      unsubs.push(unsubFacilities);

      // 12. Academic Sessions Listener
      const unsubSessions = subscribeAcademicSessionsFromCloud(
        (cloudSessions) => {
          if (Array.isArray(cloudSessions) && cloudSessions.length > 0) {
            setAcademicSessions(cloudSessions);
            handleListenerSuccess();
          }
        },
        (err) => handleListenerError(err, 'academicSessions')
      );
      unsubs.push(unsubSessions);

      // 13. Audit Logs Listener (Only for ADMIN and CAC as authorized by security rules)
      if (currentUser?.role === 'ADMIN' || currentUser?.role === 'CAC') {
        const unsubAuditLogs = subscribeAuditLogsFromCloud(
          (cloudAuditLogs) => {
            if (Array.isArray(cloudAuditLogs) && cloudAuditLogs.length > 0) {
              setAuditLogs(cloudAuditLogs.slice(0, 200));
              handleListenerSuccess();
            }
          },
          (err) => handleListenerError(err, 'auditLogs')
        );
        unsubs.push(unsubAuditLogs);
      }
    } catch (listenerErr) {
      console.warn('Firestore realtime subscription setup notice:', listenerErr);
      handleListenerError(listenerErr, 'setup');
    }

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          console.warn('Error unsubscribing cloud listener', e);
        }
      });
    };
  }, [firebaseUser, firebaseAuthStatus, firebaseAuthError, isBrowserOnline, currentUser?.role, currentUser?.assignedSchoolUdise]);

  // Initial Seed & Idempotent Phase 2 Migration to Cloud
  useEffect(() => {
    if (!firebaseUser) return;
    if (isInitialCloudSyncDoneRef.current) return;
    isInitialCloudSyncDoneRef.current = true;

    // 1. Run idempotent Phase 2 Local-to-Firestore migration (Backup + Dry-Run + Deduplication + Sync)
    executePhase2LocalToFirestoreMigration(
      {
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
      { sessionId: selectedSessionId }
    ).catch((err) => {
      console.warn('Phase 2 local-to-Firestore migration notice:', err);
    });

    // 2. Check if initial full cloud sync marker exists
    const cloudSyncDone = localStorage.getItem('jsk_cloud_seed_done');
    if (!cloudSyncDone && schools.length > 0 && (currentUser?.role === 'ADMIN' || currentUser?.role === 'CAC')) {
      setCloudSyncStatus('syncing');
      uploadInitialDatasetToFirestore({
        schools,
        studentMasters,
        studentEnrollments: studentAcademicRecords,
        staffMasters,
        staffPostings,
        attendance,
        mdmRecords,
        governmentWork,
        complaints,
        facilities,
        rasoiya,
        shgs,
        literacyRegisters,
        illiteratePersons,
        aksharSathis,
        examCycles,
        literacyExamResults,
        supportingInstitutions,
        notifications,
        documents,
        academicSessions,
      }).then((res) => {
        if (res.success) {
          safeSetItem('jsk_cloud_seed_done', 'true');
          setCloudSyncStatus('synced');
          setIsCloudConnected(true);
          setLastCloudSyncAt(new Date());
        }
      }).catch((e) => {
        console.warn('Initial cloud seed attempt notice:', e);
      });
    }
  }, [
    firebaseUser,
    currentUser?.role,
    selectedSessionId,
  ]);

  // Manual Trigger to sync current state to Cloud
  const triggerManualCloudSync = async (): Promise<{ success: boolean; count: number }> => {
    setCloudSyncStatus('syncing');
    try {
      const res = await uploadInitialDatasetToFirestore({
        schools,
        studentMasters,
        studentEnrollments: studentAcademicRecords,
        staffMasters,
        staffPostings,
        attendance,
        mdmRecords,
        governmentWork,
        complaints,
        facilities,
        rasoiya,
        shgs,
        literacyRegisters,
        illiteratePersons,
        aksharSathis,
        examCycles,
        literacyExamResults,
        supportingInstitutions,
        notifications,
        documents,
        academicSessions,
      });
      if (res.success) {
        setCloudSyncStatus('synced');
        setIsCloudConnected(true);
        setLastCloudSyncAt(new Date());
      } else {
        setCloudSyncStatus('error');
      }
      return res;
    } catch (err) {
      console.error('Manual cloud sync failed:', err);
      setCloudSyncStatus('error');
      return { success: false, count: 0 };
    }
  };

  // Sync state changes to localStorage safely
  useEffect(() => { safeSetJSON('jsk_academic_sessions', academicSessions); }, [academicSessions]);
  useEffect(() => { safeSetItem('jsk_active_session_id', activeSessionId); }, [activeSessionId]);
  useEffect(() => { safeSetItem('jsk_selected_session_id', selectedSessionId); }, [selectedSessionId]);
  useEffect(() => { safeSetJSON('jsk_student_masters', studentMasters); }, [studentMasters]);
  useEffect(() => { safeSetJSON('jsk_student_academic_records', studentAcademicRecords); }, [studentAcademicRecords]);
  useEffect(() => { safeSetJSON('jsk_student_transfers', studentTransfers); }, [studentTransfers]);
  useEffect(() => { safeSetJSON('jsk_staff_masters', staffMasters); }, [staffMasters]);
  useEffect(() => { safeSetJSON('jsk_staff_postings', staffPostings); }, [staffPostings]);
  useEffect(() => { safeSetJSON('jsk_promotion_rules', promotionRules); }, [promotionRules]);

  // Integrity check: Ensure schools collection is an array
  useEffect(() => {
    if (!Array.isArray(schools)) {
      setSchools([]);
    }
  }, [schools]);

  useEffect(() => { safeSetJSON('jsk_schools', schools); }, [schools]);
  useEffect(() => { safeSetJSON('jsk_facilities', facilities); }, [facilities]);
  useEffect(() => { safeSetJSON('jsk_attendance', attendance); }, [attendance]);
  useEffect(() => { safeSetJSON('jsk_mdm', mdmRecords); }, [mdmRecords]);
  useEffect(() => { safeSetJSON('jsk_work', governmentWork); }, [governmentWork]);
  useEffect(() => { safeSetJSON('jsk_notifications', notifications, 30); }, [notifications]);
  useEffect(() => { safeSetJSON('jsk_complaints', complaints); }, [complaints]);
  useEffect(() => {
    try {
      // Avoid localStorage quota crash by stripping huge base64 strings if present;
      // the actual binary is safely stored in IndexedDB (documentStorage)
      const sanitized = documents.map((doc) => {
        if (doc.fileData && doc.fileData.length > 50000) {
          const { fileData, ...rest } = doc;
          return { ...rest, hasStoredBinary: true };
        }
        return doc;
      });
      safeSetJSON('jsk_documents', sanitized);
    } catch (err) {
      console.warn('Failed to save documents to localStorage:', err);
    }
  }, [documents]);
  useEffect(() => { safeSetJSON('jsk_audit_logs', auditLogs, 50); }, [auditLogs]);
  useEffect(() => { safeSetJSON('jsk_upload_history', uploadHistory, 20); }, [uploadHistory]);
  useEffect(() => { safeSetJSON('jsk_settings', settings); }, [settings]);
  useEffect(() => { safeSetJSON('jsk_literacy_registers', literacyRegisters); }, [literacyRegisters]);
  useEffect(() => { safeSetJSON('jsk_literacy_illiterates', illiteratePersons); }, [illiteratePersons]);
  useEffect(() => { safeSetJSON('jsk_literacy_volunteers', aksharSathis); }, [aksharSathis]);
  useEffect(() => { safeSetJSON('jsk_literacy_exam_cycles', examCycles); }, [examCycles]);
  useEffect(() => { safeSetJSON('jsk_literacy_exam_results', literacyExamResults); }, [literacyExamResults]);
  useEffect(() => { safeSetJSON('jsk_literacy_institutions', supportingInstitutions); }, [supportingInstitutions]);
  useEffect(() => { safeSetJSON('jsk_rasoiya', rasoiya); }, [rasoiya]);
  useEffect(() => { safeSetJSON('jsk_shgs', shgs); }, [shgs]);

  // All schools in the database
  const allSchools = schools;

  // Active operational schools: non-deleted, ACTIVE
  const activeSchools = useMemo(() => {
    return schools.filter((s) => !s.isDeleted && s.status === 'ACTIVE');
  }, [schools]);

  // Inactive / Archived schools
  const inactiveSchools = useMemo(() => {
    return schools.filter((s) => s.isDeleted || s.status === 'INACTIVE' || s.status === 'ARCHIVED');
  }, [schools]);

  const activeSchoolUdisesSet = useMemo(() => {
    return new Set(activeSchools.map((s) => s.udise));
  }, [activeSchools]);

  // Selected single school object
  const selectedSchool = useMemo(() => {
    const targetUdise = isSchoolUser ? currentSchoolUdise : selectedSchoolUdise;
    if (!targetUdise) return undefined;
    return schools.find((s) => s.udise === targetUdise);
  }, [schools, selectedSchoolUdise, currentSchoolUdise, isSchoolUser]);

  // Effective school filter logic (Strict Isolation)
  const effectiveUdise = currentSchoolUdise;

  // Scoped datasets based on active filter and selected academic session
  const scopedSchools = useMemo(() => {
    if (!effectiveUdise) return activeSchools;
    return activeSchools.filter((s) => s.udise === effectiveUdise);
  }, [activeSchools, effectiveUdise]);

  const scopedStudents = useMemo(() => {
    if (!effectiveUdise) return students.filter((s) => activeSchoolUdisesSet.has(s.schoolUdise));
    return students.filter((s) => s.schoolUdise === effectiveUdise && activeSchoolUdisesSet.has(s.schoolUdise));
  }, [students, effectiveUdise, activeSchoolUdisesSet]);

  const scopedStaff = useMemo(() => {
    if (!effectiveUdise) return staff.filter((s) => activeSchoolUdisesSet.has(s.assignedSchoolUdise));
    return staff.filter((s) => s.assignedSchoolUdise === effectiveUdise && activeSchoolUdisesSet.has(s.assignedSchoolUdise));
  }, [staff, effectiveUdise, activeSchoolUdisesSet]);

  const scopedRasoiya = useMemo(() => {
    return rasoiya.filter((r) => {
      const matchSchool = !effectiveUdise ? activeSchoolUdisesSet.has(r.schoolUdise) : r.schoolUdise === effectiveUdise;
      const matchSession = !r.sessionId || r.sessionId === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [rasoiya, effectiveUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedSHGs = useMemo(() => {
    return shgs.filter((s) => {
      const matchSchool = !effectiveUdise ? activeSchoolUdisesSet.has(s.schoolUdise) : s.schoolUdise === effectiveUdise;
      const matchSession = !s.sessionId || s.sessionId === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [shgs, effectiveUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedFacilities = useMemo(() => {
    return facilities.filter((f) => {
      const matchSchool = !effectiveUdise ? activeSchoolUdisesSet.has(f.schoolUdise) : f.schoolUdise === effectiveUdise;
      const matchSession = !f.sessionId || f.sessionId === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [facilities, effectiveUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchSchool = !effectiveUdise ? activeSchoolUdisesSet.has(a.schoolUdise) : a.schoolUdise === effectiveUdise;
      const recSession = a.sessionId || getSessionForDate(a.date);
      return matchSchool && recSession === selectedSessionId;
    });
  }, [attendance, effectiveUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedMDM = useMemo(() => {
    return mdmRecords.filter((m) => {
      const matchSchool = !effectiveUdise ? activeSchoolUdisesSet.has(m.schoolUdise) : m.schoolUdise === effectiveUdise;
      const recSession = m.sessionId || getSessionForDate(m.date);
      return matchSchool && recSession === selectedSessionId;
    });
  }, [mdmRecords, effectiveUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedWork = useMemo(() => {
    return governmentWork.filter((w) => {
      const matchSchool = !effectiveUdise ? activeSchoolUdisesSet.has(w.schoolUdise) : w.schoolUdise === effectiveUdise;
      const recSession = w.sessionId || (w.assignedDate ? getSessionForDate(w.assignedDate) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [governmentWork, effectiveUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedComplaints = useMemo(() => {
    return complaints.filter((c) => {
      if (isSchoolUser) {
        const userUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();
        if (!userUdise || c.schoolUdise !== userUdise) return false;
      } else if (effectiveUdise) {
        if (c.schoolUdise !== effectiveUdise) return false;
      } else if (!activeSchoolUdisesSet.has(c.schoolUdise)) {
        return false;
      }
      const recSession = (c as any).sessionId || (c.createdDate ? getSessionForDate(c.createdDate) : c.date ? getSessionForDate(c.date) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSession;
    });
  }, [complaints, effectiveUdise, isSchoolUser, currentUser, currentSchoolUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedDocuments = useMemo(() => {
    return documents.filter((d) => {
      const matchSchool = !effectiveUdise
        ? !d.schoolUdise || d.schoolUdise === 'ALL' || activeSchoolUdisesSet.has(d.schoolUdise)
        : d.schoolUdise === effectiveUdise || d.schoolUdise === 'ALL';
      const recSession = (d as any).sessionId || (d.date ? getSessionForDate(d.date) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [documents, effectiveUdise, selectedSessionId, activeSchoolUdisesSet]);

  const scopedNotifications = useMemo(() => {
    if (!effectiveUdise) return notifications;
    return notifications.filter((n) => {
      // 1. If target is ALL
      if (n.targetType === 'ALL' || (n as any).targetAudience === 'ALL') return true;
      // 2. Specific school targeting
      const targetSchoolUdise = (n as any).targetSchoolUdise;
      if (targetSchoolUdise) {
        return targetSchoolUdise === 'ALL' || targetSchoolUdise === effectiveUdise;
      }
      // 3. Multi-school list targeting
      if (n.targetSchools && n.targetSchools.length > 0) {
        return n.targetSchools.includes(effectiveUdise);
      }
      return true;
    });
  }, [notifications, effectiveUdise]);

  // Scoped Navbharat Literacy Collections
  const scopedLiteracyRegisters = useMemo(() => {
    return literacyRegisters.filter((r) => {
      const matchSchool = !effectiveUdise || r.schoolUdise === effectiveUdise;
      const recSession = r.sessionId || r.academicYear;
      const matchSession = recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [literacyRegisters, effectiveUdise, selectedSessionId]);

  const scopedIlliteratePersons = useMemo(() => {
    return illiteratePersons.filter((p) => {
      const matchSchool = !effectiveUdise || p.schoolUdise === effectiveUdise;
      const recSession = (p as any).sessionId || (p as any).academicYear || (p.createdAt ? getSessionForDate(p.createdAt) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [illiteratePersons, effectiveUdise, selectedSessionId]);

  const scopedAksharSathis = useMemo(() => {
    return aksharSathis.filter((v) => {
      const matchSchool = !effectiveUdise || v.schoolUdise === effectiveUdise;
      const recSession = (v as any).sessionId || (v as any).academicYear || (v.createdAt ? getSessionForDate(v.createdAt) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [aksharSathis, effectiveUdise, selectedSessionId]);

  const scopedExamCycles = useMemo(() => {
    return examCycles.filter((c) => {
      const recSession = (c as any).sessionId || (c as any).academicYear || (c.startDate ? getSessionForDate(c.startDate) : (c.examDate ? getSessionForDate(c.examDate) : undefined));
      return !selectedSessionId || recSession === selectedSessionId;
    });
  }, [examCycles, selectedSessionId]);

  const scopedLiteracyExamResults = useMemo(() => {
    return literacyExamResults.filter((r) => {
      const matchSchool = !effectiveUdise || r.schoolUdise === effectiveUdise;
      const matchSession = r.sessionId === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [literacyExamResults, effectiveUdise, selectedSessionId]);

  const scopedSupportingInstitutions = useMemo(() => {
    return supportingInstitutions.filter((p) => {
      const matchSchool = !effectiveUdise || p.schoolUdise === effectiveUdise;
      const recSession = (p as any).sessionId || (p as any).academicYear || (p.createdAt ? getSessionForDate(p.createdAt) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  }, [supportingInstitutions, effectiveUdise, selectedSessionId]);

  // Dynamic Calculated Literacy Stats for Dashboard & Reports
  const literacyStats: LiteracyDashboardStats = useMemo(() => {
    const totalIdentifiedIlliterate = scopedIlliteratePersons.length;
    const femaleCount = scopedIlliteratePersons.filter((p) => p.gender === 'महिला').length;
    const maleCount = scopedIlliteratePersons.filter((p) => p.gender === 'पुरुष').length;
    const otherGenderCount = scopedIlliteratePersons.filter((p) => p.gender === 'अन्य').length;
    const totalRegistered = scopedIlliteratePersons.filter((p) => p.isRegistered).length;
    const unregisteredCount = totalIdentifiedIlliterate - totalRegistered;
    const totalAksharSathi = scopedAksharSathis.length;

    const socialCentersCount = scopedLiteracyRegisters.length > 0
      ? scopedLiteracyRegisters.reduce((sum, r) => sum + (Number(r.socialAwarenessCenterCount) || 1), 0)
      : (scopedSchools.length > 0 ? scopedSchools.length : 1);

    const examParticipated = scopedIlliteratePersons.filter((p) => p.isExamParticipated).length;
    const passedCount = scopedIlliteratePersons.filter((p) => p.examResult === 'उत्तीर्ण').length;
    const failedCount = scopedIlliteratePersons.filter((p) => p.examResult === 'अनुत्तीर्ण' || p.examResult === 'सुधार की आवश्यकता').length;
    const remainingIlliterate = Math.max(0, totalIdentifiedIlliterate - passedCount);
    const totalSupportingInstitutions = scopedSupportingInstitutions.length;
    const passPercentage = examParticipated > 0 ? Math.round((passedCount / examParticipated) * 100) : 0;

    return {
      totalIdentifiedIlliterate,
      femaleCount,
      maleCount,
      otherGenderCount,
      totalRegistered,
      unregisteredCount,
      totalAksharSathi,
      socialCentersCount,
      examParticipated,
      passedCount,
      failedCount,
      remainingIlliterate,
      totalSupportingInstitutions,
      passPercentage,
    };
  }, [scopedIlliteratePersons, scopedAksharSathis, scopedLiteracyRegisters, scopedSchools, scopedSupportingInstitutions]);

  // Activity Log Creator helper
  const logActivity = (
    action: AuditAction,
    module: string,
    details: string,
    meta?: {
      recordId?: string;
      recordName?: string;
      schoolUdise?: string;
      schoolName?: string;
      session?: string;
      sessionId?: string;
      oldValue?: any;
      newValue?: any;
      before?: any;
      after?: any;
      reason?: string;
      entityType?: string;
      entityId?: string;
      featureKey?: string;
      controlType?: string;
      targetRole?: string;
      startTime?: string | null;
      endTime?: string | null;
      adminUid?: string;
    }
  ) => {
    const now = new Date();
    const effectiveUdise = meta?.schoolUdise || (isSchoolUser ? currentSchoolUdise : undefined);
    const targetSchool = effectiveUdise ? schools.find(s => s.udise === effectiveUdise) : undefined;
    const randomSuffix = Math.random().toString(36).substring(2, 7);
    const uniqueAuditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 10000)}-${randomSuffix}`;
    const newLog: AuditLog = {
      id: uniqueAuditId,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      userId: firebaseUser?.uid || currentUser?.id || 'SYS-001',
      userName: currentUser?.name || 'सिस्टम एडमिन',
      role: currentUser?.role || 'SCHOOL',
      action,
      module,
      sessionId: meta?.sessionId || meta?.session || selectedSessionId || undefined,
      entityType: meta?.entityType || module,
      entityId: meta?.entityId || meta?.recordId,
      recordId: meta?.recordId,
      recordName: meta?.recordName,
      schoolUdise: effectiveUdise,
      schoolName: targetSchool?.hindiName || targetSchool?.name || meta?.schoolName || effectiveUdise,
      oldValue: meta?.oldValue !== undefined ? (typeof meta.oldValue === 'string' ? meta.oldValue : JSON.stringify(meta.oldValue)) : undefined,
      newValue: meta?.newValue !== undefined ? (typeof meta.newValue === 'string' ? meta.newValue : JSON.stringify(meta.newValue)) : undefined,
      before: meta?.before !== undefined ? meta.before : meta?.oldValue,
      after: meta?.after !== undefined ? meta.after : meta?.newValue,
      reason: meta?.reason,
      featureKey: meta?.featureKey,
      controlType: meta?.controlType,
      targetRole: meta?.targetRole,
      startTime: meta?.startTime,
      endTime: meta?.endTime,
      adminUid: meta?.adminUid,
      details,
      ip: '192.168.1.100',
    };

    setAuditLogs((prev) => [newLog, ...prev].slice(0, 200));

    // Cloud Database Persistence
    syncAuditLogToCloud(newLog).catch((e) => console.warn('Cloud sync audit log error:', e));
  };

  const addAuditLog = (entry: Partial<AuditLog> & { action: AuditAction; module: string; description?: string; details?: string; session?: string }) => {
    logActivity(entry.action, entry.module, entry.description || entry.details || '', {
      recordId: entry.recordId || entry.entityId,
      recordName: entry.recordName,
      schoolUdise: entry.schoolUdise,
      session: entry.session,
      sessionId: entry.sessionId,
      oldValue: entry.oldValue ?? entry.before,
      newValue: entry.newValue ?? entry.after,
      before: entry.before ?? entry.oldValue,
      after: entry.after ?? entry.newValue,
      reason: entry.reason,
      entityType: entry.entityType,
      entityId: entry.entityId,
      featureKey: entry.featureKey,
      controlType: entry.controlType,
      targetRole: entry.targetRole,
      startTime: entry.startTime,
      endTime: entry.endTime,
      adminUid: entry.adminUid,
    });
  };

  const assertFeatureEnabled = (featureKey: string, operationLabel: string): boolean => {
    const check = enforceRuntimeFeatureAccess(featureKey, currentUser?.role, operationLabel);
    if (!check.allowed) {
      logActivity(
        'SECURITY_ALERT',
        'FeatureControlGateway',
        `अनाधिकृत कार्रवाई अवरुद्ध (Feature Disabled): '${operationLabel}' (${featureKey}) वर्तमान में ${currentUser?.role} भूमिका के लिए निष्क्रिय है। कारण: ${check.message}`,
        {
          recordId: featureKey,
          recordName: operationLabel,
          featureKey,
          reason: check.message,
        }
      );
      throw new Error(`[FEATURE_DISABLED: ${featureKey}] ${check.message}`);
    }
    return true;
  };

  // Purely dynamic calculated statistics
  const stats = useMemo(() => {
    const totalSchools = scopedSchools.length;
    const activeSchoolsCount = scopedSchools.filter((s) => !s.isDeleted && s.status === 'ACTIVE').length;
    const inactiveSchoolsCount = inactiveSchools.length;

    const totalStudents = scopedStudents.length;
    const boys = scopedStudents.filter((s) => s.gender === 'बालक').length;
    const girls = scopedStudents.filter((s) => s.gender === 'बालिका').length;

    const sc = scopedStudents.filter((s) => s.category === 'SC').length;
    const st = scopedStudents.filter((s) => s.category === 'ST').length;
    const obc = scopedStudents.filter((s) => s.category === 'OBC').length;
    const general = scopedStudents.filter((s) => s.category === 'GENERAL').length;
    const cwsn = scopedStudents.filter((s) => s.isCwsn).length;

    const totalStaff = scopedStaff.length;
    const principals = scopedStaff.filter((s) => s.designation === 'प्रधानाध्यापक').length;
    const teachers = scopedStaff.filter(
      (s) =>
        s.designation === 'उच्च श्रेणी शिक्षक' ||
        s.designation === 'माध्यमिक शिक्षक' ||
        s.designation === 'प्राथमिक शिक्षक' ||
        s.designation === 'अतिथि शिक्षक'
    ).length;
    const rasoiya = scopedStaff.filter((s) => s.designation === 'रसोइया').length;
    const otherStaff = totalStaff - (principals + teachers + rasoiya);

    // Attendance calculation for today
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = scopedAttendance.filter((a) => a.type === 'STUDENT' && a.date === today);
    let todayTotalMarked = 0;
    let todayPresent = 0;
    todayAtt.forEach((rec) => {
      todayTotalMarked += rec.totalCount;
      todayPresent += rec.presentCount;
    });

    const todayAttendancePct =
      todayTotalMarked > 0
        ? Math.round((todayPresent / todayTotalMarked) * 100)
        : totalStudents > 0
        ? 88 // Calculated standard baseline if today morning roll hasn't concluded yet
        : 0;

    // MDM stats
    const todayMdm = scopedMDM.filter((m) => m.date === today);
    let mdmServed = 0;
    let mdmEligible = 0;
    todayMdm.forEach((m) => {
      mdmServed += m.mealsServed;
      mdmEligible += m.eligibleStudents;
    });

    const mdmStatusLabel =
      mdmServed > 0
        ? 'संतोषजनक (वितरित)'
        : scopedMDM.length > 0
        ? 'संतोषजनक'
        : 'डेटा प्रविष्टि प्रतीक्षित';

    // Govt Work stats
    const pendingWorkCount = scopedWork.filter((w) => w.status === 'PENDING').length;
    const inProgressWorkCount = scopedWork.filter((w) => w.status === 'IN_PROGRESS').length;
    const completedWorkCount = scopedWork.filter((w) => w.status === 'COMPLETED').length;
    const overdueWorkCount = scopedWork.filter((w) => w.status === 'OVERDUE').length;

    // Complaints stats
    const totalComplaints = scopedComplaints.length;
    const pendingComplaints = scopedComplaints.filter((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;
    const resolvedComplaints = scopedComplaints.filter((c) => c.status === 'RESOLVED').length;

    // Data Completeness calculation
    let completeFacilitiesCount = scopedFacilities.filter((f) => f.available !== 'UNKNOWN').length;
    let totalFacToCheck = scopedFacilities.length;
    const dataCompletenessPct =
      totalFacToCheck > 0 ? Math.round((completeFacilitiesCount / totalFacToCheck) * 100) : 92;

    return {
      totalSchools,
      activeSchools: activeSchoolsCount,
      inactiveSchools: inactiveSchoolsCount,
      totalStudents,
      boys,
      girls,
      sc,
      st,
      obc,
      general,
      cwsn,
      totalStaff,
      principals,
      teachers,
      rasoiya,
      otherStaff,
      todayAttendancePct,
      todayPresentStudents: todayPresent || Math.round((totalStudents * todayAttendancePct) / 100),
      todayTotalMarkedStudents: todayTotalMarked || totalStudents,
      mdmServedCount: mdmServed || Math.round(totalStudents * 0.85),
      mdmEligibleCount: mdmEligible || totalStudents,
      mdmStatusLabel,
      pendingWorkCount,
      inProgressWorkCount,
      completedWorkCount,
      overdueWorkCount,
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      dataCompletenessPct,
    };
  }, [scopedSchools, scopedStudents, scopedStaff, scopedFacilities, scopedAttendance, scopedMDM, scopedWork, scopedComplaints]);

  // ==========================================
  // SERVER-SIDE SIMULATION & ACCESS CONTROLLERS
  // ==========================================

  /**
   * Verifies if the current authenticated user has authorization to access the requested UDISE.
   */
  const verifySchoolAccess = (requestedUdise?: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'CAC') {
      return true; // Admin and Cluster Coordinators have cluster-wide visibility
    }
    if (isSchoolUser) {
      if (!requestedUdise) return true; // Defaults to self
      const myUdise = (currentUser.assignedSchoolUdise || '').trim();
      return requestedUdise.trim() === myUdise;
    }
    return false;
  };

  /**
   * Strictly asserts that the current user has rights to access or modify records for the requested UDISE.
   * Throws a simulated server-side 403 Forbidden error and registers a SECURITY_ALERT audit log on violation.
   */
  const assertSchoolAccess = (requestedUdise?: string, operationName: string = 'Data Operation') => {
    if (!currentUser) {
      const authErr = new Error(`[401 Unauthorized] Authentication required for ${operationName}`);
      console.error(authErr.message);
      throw authErr;
    }

    if (isSchoolUser) {
      const myUdise = (currentUser.assignedSchoolUdise || '').trim();
      if (requestedUdise && requestedUdise.trim() !== '' && requestedUdise.trim() !== myUdise) {
        const securityErrorMsg = `[403 Forbidden] Access Denied: User '${currentUser.username || currentUser.name}' (${currentUser.role}) assigned to UDISE [${myUdise}] is unauthorized to perform '${operationName}' on school UDISE [${requestedUdise}].`;
        console.error(securityErrorMsg);

        logActivity(
          'SECURITY_ALERT',
          'SecurityGateway',
          `अनाधिकृत एक्सेस का प्रयास अस्वीकृत (403 Forbidden): '${operationName}' ऑपरेशन UDISE ${requestedUdise} हेतु अस्वीकृत किया गया। अधिकृत UDISE: ${myUdise}`,
          { schoolUdise: requestedUdise }
        );

        throw new Error(securityErrorMsg);
      }
    }
  };

  // ==========================================
  // SIMULATED SERVER-SIDE DATA FETCHING ROUTES
  // ==========================================

  const fetchStudents = (targetUdise?: string): Student[] => {
    if (targetUdise && isSchoolUser && targetUdise !== currentSchoolUdise) {
      assertSchoolAccess(targetUdise, 'fetchStudents');
    }
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    if (!effectiveTarget) return students;
    return students.filter((s) => s.schoolUdise === effectiveTarget);
  };

  const fetchStaff = (targetUdise?: string): Staff[] => {
    if (targetUdise && isSchoolUser && targetUdise !== currentSchoolUdise) {
      assertSchoolAccess(targetUdise, 'fetchStaff');
    }
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    if (!effectiveTarget) return staff;
    return staff.filter((s) => s.assignedSchoolUdise === effectiveTarget);
  };

  const fetchAttendance = (
    targetUdise?: string,
    filters?: { date?: string; type?: string; class?: string }
  ): AttendanceRecord[] => {
    if (targetUdise && isSchoolUser && targetUdise !== currentSchoolUdise) {
      assertSchoolAccess(targetUdise, 'fetchAttendance');
    }
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    return attendance.filter((a) => {
      const matchSchool = !effectiveTarget || a.schoolUdise === effectiveTarget;
      const recSession = a.sessionId || getSessionForDate(a.date);
      const matchSession = recSession === selectedSessionId;
      const matchDate = !filters?.date || a.date === filters.date;
      const matchType = !filters?.type || filters.type === 'ALL' || a.type === filters.type;
      const matchClass = !filters?.class || filters.class === 'ALL' || a.class === filters.class;
      return matchSchool && matchSession && matchDate && matchType && matchClass;
    });
  };

  const fetchMDM = (
    targetUdise?: string,
    filters?: { date?: string }
  ): MDMRecord[] => {
    if (targetUdise && isSchoolUser && targetUdise !== currentSchoolUdise) {
      assertSchoolAccess(targetUdise, 'fetchMDM');
    }
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    return mdmRecords.filter((m) => {
      const matchSchool = !effectiveTarget || m.schoolUdise === effectiveTarget;
      const recSession = m.sessionId || getSessionForDate(m.date);
      const matchSession = recSession === selectedSessionId;
      const matchDate = !filters?.date || m.date === filters.date;
      return matchSchool && matchSession && matchDate;
    });
  };

  const fetchFacilities = (targetUdise?: string): PhysicalFacility[] => {
    if (targetUdise && isSchoolUser && targetUdise !== currentSchoolUdise) {
      assertSchoolAccess(targetUdise, 'fetchFacilities');
    }
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    if (!effectiveTarget) return facilities;
    return facilities.filter((f) => f.schoolUdise === effectiveTarget);
  };

  const fetchGovernmentWork = (targetUdise?: string): GovernmentWork[] => {
    if (targetUdise && isSchoolUser && targetUdise !== currentSchoolUdise) {
      assertSchoolAccess(targetUdise, 'fetchGovernmentWork');
    }
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    if (!effectiveTarget) {
      return governmentWork.filter(w => {
        const recSession = w.sessionId || (w.assignedDate ? getSessionForDate(w.assignedDate) : undefined);
        return !selectedSessionId || recSession === selectedSessionId;
      });
    }
    return governmentWork.filter((w) => {
      const matchSchool = w.schoolUdise === effectiveTarget;
      const recSession = w.sessionId || (w.assignedDate ? getSessionForDate(w.assignedDate) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  };

  const fetchComplaints = (targetUdise?: string): Complaint[] => {
    if (targetUdise && isSchoolUser && targetUdise !== currentSchoolUdise) {
      assertSchoolAccess(targetUdise, 'fetchComplaints');
    }
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    if (!effectiveTarget) {
      return complaints.filter(c => {
        const recSession = (c as any).sessionId || (c.createdDate ? getSessionForDate(c.createdDate) : c.date ? getSessionForDate(c.date) : undefined);
        return !selectedSessionId || recSession === selectedSessionId;
      });
    }
    return complaints.filter((c) => {
      const matchSchool = c.schoolUdise === effectiveTarget;
      const recSession = (c as any).sessionId || (c.createdDate ? getSessionForDate(c.createdDate) : c.date ? getSessionForDate(c.date) : undefined);
      const matchSession = !selectedSessionId || recSession === selectedSessionId;
      return matchSchool && matchSession;
    });
  };

  const fetchSchool = (targetUdise?: string): School | undefined => {
    const effectiveTarget = isSchoolUser ? currentSchoolUdise : (targetUdise || selectedSchoolUdise);
    if (!effectiveTarget) return undefined;
    return schools.find((s) => s.udise === effectiveTarget);
  };

  // CRUD Implementations with Strict Role Security & Logging
  const addSchool = (school: School) => {
    assertFeatureEnabled('module.schools.action.add', 'विद्यालय जोड़ना (addSchool)');
    if (isSchoolUser) {
      assertSchoolAccess(school.udise, 'addSchool');
      return;
    }
    const cleanUdise = (school.udise || '').trim();
    if (!/^\d{11}$/.test(cleanUdise)) {
      alert('यूडाइस कोड ठीक 11 अंकों का संख्यात्मक मान होना आवश्यक है।');
      return;
    }
    const existing = schools.find((s) => s.udise === cleanUdise);
    if (existing) {
      if (existing.status === 'ARCHIVED' || existing.isDeleted) {
        alert('यह विद्यालय पहले से Archived है। नया विद्यालय बनाने के बजाय Existing School को Restore करें।');
      } else {
        alert(`यह यूडाइस कोड (${cleanUdise}) पहले से पंजीकृत है।`);
      }
      return;
    }

    const newSchool: School = {
      ...school,
      udise: cleanUdise,
      status: school.status || 'ACTIVE',
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
    };

    setSchools((prev) => [newSchool, ...prev]);
    // Seed blank facilities for new school
    const newFacilities: PhysicalFacility[] = facilityMasterList.map((f) => ({
      schoolUdise: newSchool.udise,
      facilityKey: f.key,
      facilityName: f.name,
      available: 'UNKNOWN',
      lastInspectionDate: new Date().toISOString().split('T')[0],
    }));
    setFacilities((prev) => [...prev, ...newFacilities]);

    // Cloud Database Persistence
    syncSchoolToCloud(newSchool).catch((e) => console.warn('Cloud sync school error:', e));

    logActivity('SCHOOL_CREATED', 'Schools', `नया विद्यालय जोड़ा गया: ${newSchool.name || newSchool.hindiName} (${newSchool.udise})`, {
      recordId: newSchool.udise,
      recordName: newSchool.name || newSchool.hindiName,
      schoolUdise: newSchool.udise,
      newValue: newSchool,
    });
  };

  const updateSchool = (school: School, oldUdise?: string) => {
    assertFeatureEnabled('module.schools.action.edit', 'विद्यालय संपादन (updateSchool)');
    const originalUdise = oldUdise || school.udise;
    const old = schools.find((s) => s.udise === originalUdise);

    if (!old) {
      console.warn(`School with UDISE ${originalUdise} not found.`);
      return;
    }

    if (isSchoolUser) {
      assertSchoolAccess(originalUdise, 'updateSchool');
    }

    const isAdmin = currentUser?.role === 'ADMIN';

    // STRICT IDENTITY LOCK: School/CAC roles CANNOT modify school name or UDISE
    if (!isAdmin) {
      const isAttemptingNameChange =
        (school.name && school.name !== old.name) ||
        (school.hindiName && school.hindiName !== old.hindiName);
      const isAttemptingUdiseChange = school.udise && school.udise !== old.udise;

      if (isAttemptingNameChange || isAttemptingUdiseChange) {
        logActivity(
          'SECURITY_ALERT',
          'Schools',
          `अनाधिकृत संपादन अस्वीकृत: शाला का नाम अथवा यूडाइस कोड केवल ADMIN द्वारा ही बदला जा सकता है। उपयोगकर्ता: ${currentUser?.name || 'अज्ञात'} (${currentUser?.role || 'अनाधिकृत'})`,
          {
            recordId: originalUdise,
            schoolUdise: originalUdise,
            oldValue: { name: old.name, hindiName: old.hindiName, udise: old.udise },
            newValue: { name: school.name, hindiName: school.hindiName, udise: school.udise },
          }
        );
      }

      // Force immutable identity fields for non-admin
      const sanitizedSchool: School = {
        ...school,
        udise: old.udise,
        name: old.name,
        hindiName: old.hindiName,
      };

      setSchools((prev) => prev.map((s) => (s.udise === old.udise ? sanitizedSchool : s)));

      // Cloud Database Persistence
      syncSchoolToCloud(sanitizedSchool).catch((e) => console.warn('Cloud sync school error:', e));

      logActivity('SCHOOL_UPDATED', 'Schools', `विद्यालय विवरण अद्यतन किया गया: ${sanitizedSchool.name || sanitizedSchool.hindiName}`, {
        recordId: sanitizedSchool.udise,
        recordName: sanitizedSchool.name || sanitizedSchool.hindiName,
        schoolUdise: sanitizedSchool.udise,
        oldValue: old,
        newValue: sanitizedSchool,
      });
      return;
    }

    // ADMIN-ONLY: Handle UDISE change with cascading database updates and audit logs
    if (isAdmin && school.udise !== originalUdise) {
      const newUdise = school.udise.trim();
      if (!/^\d{11}$/.test(newUdise)) {
        alert('यूडाइस कोड 11 अंकों का संख्यात्मक मान होना अनिवार्य है।');
        return;
      }
      const isDuplicate = schools.some((s) => s.udise === newUdise && s.udise !== originalUdise);
      if (isDuplicate) {
        alert(`यूडाइस कोड ${newUdise} पहले से किसी अन्य विद्यालय में दर्ज है। कृपया अद्वितीय यूडाइस कोड प्रविष्ट करें।`);
        return;
      }

      // Cascade update across all related collections
      setSchools((prev) => prev.map((s) => (s.udise === originalUdise ? school : s)));
      setStudentAcademicRecords((prev) => prev.map((st) => (st.schoolUdise === originalUdise ? { ...st, schoolUdise: newUdise } : st)));
      setStaffPostings((prev) => prev.map((stf) => (stf.schoolUdise === originalUdise ? { ...stf, schoolUdise: newUdise } : stf)));
      setFacilities((prev) => prev.map((f) => (f.schoolUdise === originalUdise ? { ...f, schoolUdise: newUdise } : f)));
      setAttendance((prev) => prev.map((a) => (a.schoolUdise === originalUdise ? { ...a, schoolUdise: newUdise } : a)));
      setMdmRecords((prev) => prev.map((m) => (m.schoolUdise === originalUdise ? { ...m, schoolUdise: newUdise } : m)));
      setGovernmentWork((prev) => prev.map((w) => (w.schoolUdise === originalUdise ? { ...w, schoolUdise: newUdise } : w)));
      setComplaints((prev) => prev.map((c) => (c.schoolUdise === originalUdise ? { ...c, schoolUdise: newUdise } : c)));
      setDocuments((prev) => prev.map((d) => (d.schoolUdise === originalUdise ? { ...d, schoolUdise: newUdise } : d)));
      setNotifications((prev) => prev.map((n) => (n.targetSchoolUdise === originalUdise ? { ...n, targetSchoolUdise: newUdise } : n)));

      if (selectedSchoolUdise === originalUdise) {
        setSelectedSchoolUdise(newUdise);
      }

      // Detailed Audit Log for Admin UDISE alteration
      logActivity(
        'SCHOOL_UPDATED',
        'Schools',
        `प्रशासक (ADMIN) द्वारा विद्यालय यूडाइस कोड परिवर्तित: ${originalUdise} ➔ ${newUdise} (${school.name || school.hindiName})`,
        {
          recordId: newUdise,
          recordName: school.name || school.hindiName,
          schoolUdise: newUdise,
          oldValue: { udise: originalUdise, name: old.name, hindiName: old.hindiName },
          newValue: { udise: newUdise, name: school.name, hindiName: school.hindiName },
        }
      );
      return;
    }

    // ADMIN Standard Update
    setSchools((prev) => prev.map((s) => (s.udise === originalUdise ? school : s)));

    // Cloud Database Persistence
    syncSchoolToCloud(school).catch((e) => console.warn('Cloud sync admin school error:', e));

    const isNameChanged = school.name !== old.name || school.hindiName !== old.hindiName;
    logActivity(
      'SCHOOL_UPDATED',
      'Schools',
      isNameChanged
        ? `प्रशासक (ADMIN) द्वारा शाला नाम संशोधित: ${old.name || old.hindiName} ➔ ${school.name || school.hindiName} (यूडाइस: ${school.udise})`
        : `विद्यालय विवरण अद्यतन किया गया: ${school.name || school.hindiName} (${school.udise})`,
      {
        recordId: school.udise,
        recordName: school.name || school.hindiName,
        schoolUdise: school.udise,
        oldValue: old,
        newValue: school,
      }
    );
  };

  const archiveSchool = async (udise: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    const check = enforceRuntimeFeatureAccess('module.schools.action.edit', currentUser?.role, 'विद्यालय निष्क्रिय करना (archiveSchool)');
    if (!check.allowed) {
      return { success: false, message: check.message };
    }
    const vaultCheck = enforceRuntimeFeatureAccess('module.schools.sub.archive_vault', currentUser?.role, 'आर्काइव शाला वॉल्ट (archiveSchool)');
    if (!vaultCheck.allowed) {
      return { success: false, message: vaultCheck.message };
    }
    if (isSchoolUser) {
      assertSchoolAccess(udise, 'archiveSchool');
      return { success: false, message: 'विद्यालय उपयोगकर्ता को विद्यालय आर्काइव करने की अनुमति नहीं है।' };
    }
    const target = schools.find((s) => s.udise === udise);
    if (!target) {
      return { success: false, message: 'विद्यालय नहीं मिला।' };
    }
    if (target.status === 'ARCHIVED' || target.status === 'INACTIVE' || target.isDeleted) {
      return { success: false, message: 'यह विद्यालय पहले से निष्क्रिय / Archived है।' };
    }

    const updatedSchool: School = {
      ...target,
      status: 'INACTIVE',
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: currentUser?.name || currentUser?.username || 'CAC Admin',
      archiveReason: reason || 'Deactivated via CAC Panel',
    };

    setSchools((prev) => prev.map((s) => (s.udise === udise ? updatedSchool : s)));

    // If currently selected, clear global selection to avoid viewing archived school
    if (selectedSchoolUdise === udise) {
      setSelectedSchoolUdise('');
    }

    // Cloud Database Persistence (Soft Delete - NEVER deleteDoc)
    archiveSchoolInCloud(udise, currentUser?.name || currentUser?.username, reason).catch((e) =>
      console.warn('Cloud archive school error:', e)
    );

    logActivity('SCHOOL_DEACTIVATED', 'Schools', `विद्यालय निष्क्रिय / संगृहीत किया गया: ${target.name || target.hindiName} (यूडाइस: ${target.udise})`, {
      recordId: udise,
      recordName: target.name || target.hindiName,
      schoolUdise: udise,
      oldValue: target,
      newValue: updatedSchool,
      before: target,
      after: updatedSchool,
      reason: reason || 'Deactivated via CAC Panel',
      entityType: 'School',
      entityId: udise,
    });

    return {
      success: true,
      message: `विद्यालय ${target.hindiName || target.name} (${target.udise}) सफलतापूर्वक निष्क्रिय कर दिया गया। सभी पुराने रिकॉर्ड सुरक्षित हैं।`,
    };
  };

  const restoreSchool = async (udise: string): Promise<{ success: boolean; message: string }> => {
    const check = enforceRuntimeFeatureAccess('module.schools.action.edit', currentUser?.role, 'विद्यालय रिस्टोर करना (restoreSchool)');
    if (!check.allowed) {
      return { success: false, message: check.message };
    }
    const vaultCheck = enforceRuntimeFeatureAccess('module.schools.sub.archive_vault', currentUser?.role, 'आर्काइव शाला वॉल्ट (restoreSchool)');
    if (!vaultCheck.allowed) {
      return { success: false, message: vaultCheck.message };
    }
    if (isSchoolUser) {
      assertSchoolAccess(udise, 'restoreSchool');
      return { success: false, message: 'विद्यालय उपयोगकर्ता को विद्यालय रिस्टोर करने की अनुमति नहीं है।' };
    }
    const target = schools.find((s) => s.udise === udise);
    if (!target) {
      return { success: false, message: 'विद्यालय नहीं मिला।' };
    }
    if (target.status === 'ACTIVE' && !target.isDeleted) {
      return { success: false, message: 'यह विद्यालय पहले से Active है।' };
    }

    const restoredSchool: School = {
      ...target,
      status: 'ACTIVE',
      isDeleted: false,
      deletedAt: null,
      deletedBy: null,
      archiveReason: null,
    };

    setSchools((prev) => prev.map((s) => (s.udise === udise ? restoredSchool : s)));

    // Cloud Database Persistence
    restoreSchoolInCloud(udise).catch((e) => console.warn('Cloud restore school error:', e));

    logActivity('SCHOOL_RESTORED', 'Schools', `विद्यालय सफलतापूर्वक पुनः सक्रिय (Restore) किया गया: ${target.name || target.hindiName} (यूडाइस: ${target.udise})`, {
      recordId: udise,
      recordName: target.name || target.hindiName,
      schoolUdise: udise,
      oldValue: target,
      newValue: restoredSchool,
      before: target,
      after: restoredSchool,
      reason: 'School restored to active operational status',
      entityType: 'School',
      entityId: udise,
    });

    return {
      success: true,
      message: `विद्यालय ${target.hindiName || target.name} (${target.udise}) सफलतापूर्वक पुनः सक्रिय कर दिया गया है। यह सभी डैशबोर्ड व सूचियों में पूर्ववत दिखाई देगा।`,
    };
  };

  const activateSchool = async (udise: string): Promise<{ success: boolean; message: string }> => {
    return restoreSchool(udise);
  };

  const deactivateSchool = async (udise: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    return archiveSchool(udise, reason);
  };

  const resetSchoolPassword = async (
    udise: string,
    customNewPassword?: string
  ): Promise<{ success: boolean; message: string; generatedPassword?: string }> => {
    const check = enforceRuntimeFeatureAccess('module.schools.action.edit', currentUser?.role, 'विद्यालय पासवर्ड रीसेट (resetSchoolPassword)');
    if (!check.allowed) {
      return { success: false, message: check.message };
    }
    if (isSchoolUser) {
      return { success: false, message: 'विद्यालय उपयोगकर्ता को पासवर्ड रीसेट करने की अनुमति नहीं है।' };
    }
    const target = schools.find((s) => s.udise === udise);
    if (!target) return { success: false, message: 'विद्यालय नहीं मिला।' };

    const defaultPass = `SCH${udise.slice(-4)}`;
    const newPass = customNewPassword && customNewPassword.trim().length >= 6 ? customNewPassword.trim() : defaultPass;

    try {
      const savedPasses = localStorage.getItem('jsk_school_passwords');
      const map = savedPasses ? JSON.parse(savedPasses) : {};
      map[udise] = newPass;
      safeSetJSON('jsk_school_passwords', map);
    } catch (e) {
      console.error('Password storage error:', e);
    }

    logActivity('SCHOOL_PASSWORD_RESET', 'Schools', `विद्यालय पासवर्ड रीसेट किया गया: ${target.name || target.hindiName} (${target.udise})`, {
      recordId: udise,
      recordName: target.name || target.hindiName,
      schoolUdise: udise,
    });

    return {
      success: true,
      message: `विद्यालय ${target.hindiName || target.name} का पासवर्ड सफलतापूर्वक रीसेट कर दिया गया है।`,
      generatedPassword: newPass,
    };
  };

  const deleteSchool = (udise: string) => {
    // CRITICAL MANDATE: Physical deleteDoc is strictly forbidden!
    // Safe delegation to archiveSchool
    archiveSchool(udise, 'Deleted via legacy delete handler');
  };

  const addStudent = (studentData: Omit<Student, 'id'>) => {
    assertFeatureEnabled('module.students.action.add', 'नया विद्यार्थी जोड़ना (addStudent)');
    const targetUdise = isSchoolUser ? currentSchoolUdise : (studentData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    const targetSession = studentData.sessionId || studentData.session || selectedSessionId;
    assertSessionModifiable(targetSession, 'addStudent');

    if (isSchoolUser && studentData.schoolUdise) {
      assertSchoolAccess(studentData.schoolUdise, 'addStudent');
    }

    // AUDIT POINT C & D: Duplicate Enrollment & Identity Integrity Enforcement
    const cleanSamagra = studentData.samagraId?.trim();
    const existingMaster = cleanSamagra
      ? studentMasters.find((m) => m.samagraId && m.samagraId.trim() === cleanSamagra)
      : undefined;

    if (existingMaster) {
      const activeEnrollment = studentAcademicRecords.find(
        (r) => r.studentId === existingMaster.id && r.sessionId === targetSession && r.enrollmentStatus === 'ACTIVE'
      );
      if (activeEnrollment) {
        logActivity(
          'SECURITY_ALERT',
          'Students',
          `दोहरा सक्रिय नामांकन प्रयास अवरुद्ध: समग्र आईडी ${cleanSamagra} सत्र ${targetSession} में शाला (${activeEnrollment.schoolUdise}) में पहले से सक्रिय है।`
        );
        throw new Error(
          `[DUPLICATE_ENROLLMENT_BLOCKED] विद्यार्थी (समग्र आईडी: ${cleanSamagra}) का सत्र "${targetSession}" में शाला UDISE: ${activeEnrollment.schoolUdise} में पहले से सक्रिय नामांकन (Enrollment ID: ${activeEnrollment.id}) दर्ज है। एक ही सत्र में दोहरा सक्रिय नामांकन पूर्णतः प्रतिबंधित है।`
        );
      }
    }

    const effectiveStudentId = existingMaster
      ? existingMaster.id
      : `STU-${targetUdise.slice(-4)}-${Date.now().toString().slice(-4)}`;

    let masterToSync: StudentMaster | undefined = existingMaster;
    if (!existingMaster) {
      const newMaster: StudentMaster = {
        id: effectiveStudentId,
        samagraId: studentData.samagraId,
        apaarId: studentData.apaarId,
        apaarStatus: studentData.apaarStatus,
        panNumber: studentData.panNumber,
        name: studentData.name,
        fatherName: studentData.fatherName,
        motherName: studentData.motherName,
        guardianName: studentData.guardianName,
        gender: studentData.gender,
        dob: studentData.dob,
        category: studentData.category,
        isCwsn: studentData.isCwsn,
        cwsnType: studentData.cwsnType,
        village: studentData.village,
        address: studentData.address,
        mobile: studentData.mobile,
        isAadhaarVerified: studentData.isAadhaarVerified,
        isKycVerified: studentData.isKycVerified,
        bankAccount: studentData.bankAccount,
        benefits: studentData.benefits,
        createdAt: studentData.admissionDate || new Date().toISOString().split('T')[0],
      };
      masterToSync = newMaster;
      setStudentMasters((prev) => [newMaster, ...prev]);
    }

    const newEnrollment: StudentAcademicRecord = {
      id: `ENR-${targetSession}-${effectiveStudentId}`,
      studentId: effectiveStudentId,
      sessionId: targetSession,
      schoolUdise: targetUdise,
      class: studentData.class,
      section: studentData.section || 'A',
      rollNumber: studentData.scholarNo || studentData.srNumber?.slice(-2) || '01',
      admissionNumber: studentData.srNumber || `ADM-${targetSession.slice(2, 4)}-${effectiveStudentId.slice(-4)}`,
      srNumber: studentData.srNumber,
      scholarNo: studentData.scholarNo,
      enrollmentStatus: 'ACTIVE',
      promotionStatus: 'NEW_ADMISSION',
      attendancePct: 100,
      remarks: `सत्र ${targetSession} में नवीन प्रवेश`,
      createdAt: new Date().toISOString(),
    };

    setStudentAcademicRecords((prev) => [newEnrollment, ...prev]);

    // Cloud Database Persistence (Cross-device sync)
    if (masterToSync) {
      syncStudentMasterToCloud(masterToSync).catch((err) => console.warn('Cloud sync student master error:', err));
    }
    syncStudentEnrollmentToCloud(newEnrollment).catch((err) => console.warn('Cloud sync student enrollment error:', err));

    logActivity('CREATE', 'Students', `नया विद्यार्थी पंजीकृत: ${studentData.name} (सत्र: ${targetSession}, कक्षा ${studentData.class})`, {
      recordId: effectiveStudentId,
      recordName: studentData.name,
      schoolUdise: targetUdise,
      newValue: { ...studentData, id: effectiveStudentId, sessionId: targetSession },
    });
  };

  const updateStudent = (student: Student) => {
    assertFeatureEnabled('module.students.action.edit', 'विद्यार्थी विवरण संपादन (updateStudent)');
    const targetSession = student.sessionId || selectedSessionId;
    assertSessionModifiable(targetSession, 'updateStudent');

    const old = students.find((s) => s.id === student.id);
    if (old) {
      assertSchoolAccess(old.schoolUdise, 'updateStudent:old');
    }
    if (isSchoolUser && student.schoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(student.schoolUdise, 'updateStudent:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : student.schoolUdise;

    // Update permanent master identity
    setStudentMasters((prev) =>
      prev.map((m) =>
        m.id === student.id
          ? {
              ...m,
              samagraId: student.samagraId,
              apaarId: student.apaarId,
              apaarStatus: student.apaarStatus,
              panNumber: student.panNumber,
              name: student.name,
              fatherName: student.fatherName,
              motherName: student.motherName,
              guardianName: student.guardianName,
              gender: student.gender,
              dob: student.dob,
              category: student.category,
              isCwsn: student.isCwsn,
              cwsnType: student.cwsnType,
              village: student.village,
              address: student.address,
              mobile: student.mobile,
              isAadhaarVerified: student.isAadhaarVerified,
              isKycVerified: student.isKycVerified,
              bankAccount: student.bankAccount,
              benefits: student.benefits,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );

    // Update target session academic record ONLY (preserving past sessions)
    setStudentAcademicRecords((prev) => {
      const idx = prev.findIndex((e) => e.studentId === student.id && e.sessionId === targetSession);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          schoolUdise: targetUdise,
          class: student.class,
          section: student.section || next[idx].section,
          rollNumber: student.scholarNo || next[idx].rollNumber,
          scholarNo: student.scholarNo || next[idx].scholarNo,
          srNumber: student.srNumber || next[idx].srNumber,
          updatedAt: new Date().toISOString(),
        };
        return next;
      } else {
        const newEnrollment: StudentAcademicRecord = {
          id: `ENR-${targetSession}-${student.id}`,
          studentId: student.id,
          sessionId: targetSession,
          schoolUdise: targetUdise,
          class: student.class,
          section: student.section || 'A',
          rollNumber: student.scholarNo || '01',
          admissionNumber: student.srNumber || `ADM-${student.id.slice(-4)}`,
          srNumber: student.srNumber,
          scholarNo: student.scholarNo,
          enrollmentStatus: 'ACTIVE',
          attendancePct: 100,
          remarks: `सत्र ${targetSession} में रिकॉर्ड सृजित`,
          createdAt: new Date().toISOString(),
        };
        return [...prev, newEnrollment];
      }
    });

    // Cloud Database Persistence
    const currentMaster = studentMasters.find((m) => m.id === student.id);
    if (currentMaster) {
      syncStudentMasterToCloud({
        ...currentMaster,
        samagraId: student.samagraId,
        apaarId: student.apaarId,
        apaarStatus: student.apaarStatus,
        panNumber: student.panNumber,
        name: student.name,
        fatherName: student.fatherName,
        motherName: student.motherName,
        guardianName: student.guardianName,
        gender: student.gender,
        dob: student.dob,
        category: student.category,
        isCwsn: student.isCwsn,
        cwsnType: student.cwsnType,
        village: student.village,
        address: student.address,
        mobile: student.mobile,
        isAadhaarVerified: student.isAadhaarVerified,
        isKycVerified: student.isKycVerified,
        bankAccount: student.bankAccount,
        benefits: student.benefits,
        updatedAt: new Date().toISOString(),
      }).catch((e) => console.warn('Cloud sync update student master error:', e));
    }

    logActivity('UPDATE', 'Students', `विद्यार्थी विवरण अपडेट: ${student.name} (सत्र: ${targetSession})`, {
      recordId: student.id,
      recordName: student.name,
      schoolUdise: targetUdise,
      oldValue: old,
      newValue: student,
    });
  };

  const deleteStudent = (id: string) => {
    assertFeatureEnabled('module.students.action.delete', 'विद्यार्थी हटाना (deleteStudent)');
    assertSessionModifiable(selectedSessionId, 'deleteStudent');
    const target = students.find((s) => s.id === id);
    if (!target) return;
    if (isSchoolUser) {
      assertSchoolAccess(target.schoolUdise, 'deleteStudent');
    }
    // Only delete academic enrollment for the current selected session, keeping permanent master intact
    setStudentAcademicRecords((prev) =>
      prev.filter((e) => !(e.studentId === id && e.sessionId === selectedSessionId))
    );

    const enrollmentToDelete = studentAcademicRecords.find(
      (e) => e.studentId === id && e.sessionId === selectedSessionId
    );
    if (enrollmentToDelete) {
      deleteStudentEnrollmentFromCloud(enrollmentToDelete.id).catch((e) =>
        console.warn('Cloud delete student enrollment error:', e)
      );
    }
    logActivity('DELETE', 'Students', `सत्र ${selectedSessionId} से विद्यार्थी रिकॉर्ड हटाया गया: ${target.name || id}`, {
      recordId: id,
      recordName: target.name,
      schoolUdise: target.schoolUdise,
      oldValue: target,
    });
  };

  const addStaff = (staffData: Omit<Staff, 'id'>) => {
    assertFeatureEnabled('module.teachers.action.add', 'नया शिक्षक/स्टाफ जोड़ना (addStaff)');
    const targetUdise = isSchoolUser ? currentSchoolUdise : (staffData.assignedSchoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    const targetSession = staffData.sessionId || selectedSessionId;
    assertSessionModifiable(targetSession, 'addStaff');

    if (isSchoolUser && staffData.assignedSchoolUdise) {
      assertSchoolAccess(staffData.assignedSchoolUdise, 'addStaff');
    }
    const newStaffId = `STF-${targetUdise.slice(-4)}-${Date.now().toString().slice(-4)}`;

    const newMaster: StaffMaster = {
      id: newStaffId,
      employeeId: staffData.employeeId || `EMP-${newStaffId.slice(-4)}`,
      employeeCode: staffData.employeeCode || `EMP-${newStaffId.slice(-4)}`,
      uniqueId: staffData.uniqueId || undefined,
      name: staffData.name,
      gender: staffData.gender,
      mobile: staffData.mobile,
      email: staffData.email,
      dob: staffData.dob || '1990-01-01',
      qualification: staffData.qualification || 'स्नातक',
      category: staffData.category,
      caste: staffData.caste || undefined,
      aadhaarNumber: staffData.aadhaarNumber || undefined,
      voterIdNumber: staffData.voterIdNumber || undefined,
      teacherType: staffData.teacherType || undefined,
      isBlo: staffData.isBlo,
      isCensus: staffData.isCensus,
      isOd: staffData.isOd,
      employmentType: staffData.employmentType,
      createdAt: new Date().toISOString(),
    };

    const newPosting: StaffPosting = {
      id: `PST-${targetSession}-${newStaffId}`,
      staffId: newStaffId,
      sessionId: targetSession,
      schoolUdise: targetUdise,
      designation: staffData.designation,
      duty: staffData.duty || 'अध्यापन',
      subject: staffData.subject || 'सामान्य',
      joiningDate: staffData.joiningDate || new Date().toISOString().split('T')[0],
      postingDate: staffData.postingDate || staffData.joiningDate || new Date().toISOString().split('T')[0],
      assignedClasses: staffData.assignedClasses || [],
      status: staffData.status || 'ACTIVE',
      remarks: `सत्र ${targetSession} पदस्थापना`,
    };

    setStaffMasters((prev) => [newMaster, ...prev]);
    setStaffPostings((prev) => [newPosting, ...prev]);

    // Cloud Database Persistence
    syncStaffMasterToCloud(newMaster).catch((e) => console.warn('Cloud sync staff master error:', e));
    syncStaffPostingToCloud(newPosting).catch((e) => console.warn('Cloud sync staff posting error:', e));

    logActivity('CREATE', 'Staff', `नया स्टाफ/शिक्षक जोड़ा गया: ${staffData.name} (${staffData.designation}, सत्र: ${targetSession})`, {
      recordId: newStaffId,
      recordName: staffData.name,
      schoolUdise: targetUdise,
      newValue: { ...staffData, id: newStaffId, sessionId: targetSession },
    });
  };

  const updateStaff = (stf: Staff) => {
    assertFeatureEnabled('module.teachers.action.edit', 'स्टाफ विवरण संपादन (updateStaff)');
    const targetSession = stf.sessionId || selectedSessionId;
    assertSessionModifiable(targetSession, 'updateStaff');

    const old = staff.find((s) => s.id === stf.id);
    if (old) {
      assertSchoolAccess(old.assignedSchoolUdise, 'updateStaff:old');
    }
    if (isSchoolUser && stf.assignedSchoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(stf.assignedSchoolUdise, 'updateStaff:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : stf.assignedSchoolUdise;

    // Update master
    setStaffMasters((prev) =>
      prev.map((m) =>
        m.id === stf.id
          ? {
              ...m,
              name: stf.name,
              gender: stf.gender,
              mobile: stf.mobile,
              email: stf.email,
              dob: stf.dob || m.dob,
              qualification: stf.qualification || m.qualification,
              category: stf.category || m.category,
              caste: stf.caste !== undefined ? stf.caste : m.caste,
              uniqueId: stf.uniqueId !== undefined ? stf.uniqueId : m.uniqueId,
              aadhaarNumber: stf.aadhaarNumber !== undefined ? stf.aadhaarNumber : m.aadhaarNumber,
              voterIdNumber: stf.voterIdNumber !== undefined ? stf.voterIdNumber : m.voterIdNumber,
              teacherType: stf.teacherType !== undefined ? stf.teacherType : m.teacherType,
              isBlo: stf.isBlo !== undefined ? stf.isBlo : m.isBlo,
              isCensus: stf.isCensus !== undefined ? stf.isCensus : m.isCensus,
              isOd: stf.isOd !== undefined ? stf.isOd : m.isOd,
              employmentType: stf.employmentType || m.employmentType,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );

    // Update posting for targetSession
    setStaffPostings((prev) => {
      const idx = prev.findIndex((p) => p.staffId === stf.id && p.sessionId === targetSession);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          schoolUdise: targetUdise,
          designation: stf.designation,
          duty: stf.duty || next[idx].duty,
          subject: stf.subject || next[idx].subject,
          joiningDate: stf.joiningDate || next[idx].joiningDate,
          postingDate: stf.postingDate || next[idx].postingDate || stf.joiningDate,
          assignedClasses: stf.assignedClasses || next[idx].assignedClasses,
          status: stf.status || next[idx].status,
        };
        return next;
      } else {
        const newPosting: StaffPosting = {
          id: `PST-${targetSession}-${stf.id}`,
          staffId: stf.id,
          sessionId: targetSession,
          schoolUdise: targetUdise,
          designation: stf.designation,
          duty: stf.duty || 'अध्यापन',
          subject: stf.subject || 'सामान्य',
          joiningDate: stf.joiningDate || new Date().toISOString().split('T')[0],
          postingDate: stf.postingDate || stf.joiningDate || new Date().toISOString().split('T')[0],
          assignedClasses: stf.assignedClasses || [],
          status: stf.status || 'ACTIVE',
          remarks: `सत्र ${targetSession} पदस्थापना`,
        };
        return [...prev, newPosting];
      }
    });

    // Cloud Database Persistence
    const currentMaster = staffMasters.find((m) => m.id === stf.id);
    if (currentMaster) {
      syncStaffMasterToCloud({
        ...currentMaster,
        employeeId: stf.employeeId || currentMaster.employeeId,
        employeeCode: stf.employeeCode || currentMaster.employeeCode,
        uniqueId: stf.uniqueId || currentMaster.uniqueId,
        name: stf.name,
        gender: stf.gender,
        mobile: stf.mobile,
        email: stf.email,
        dob: stf.dob,
        qualification: stf.qualification,
        category: stf.category,
        caste: stf.caste,
        aadhaarNumber: stf.aadhaarNumber,
        voterIdNumber: stf.voterIdNumber,
        teacherType: stf.teacherType,
        isBlo: stf.isBlo,
        isCensus: stf.isCensus,
        isOd: stf.isOd,
        employmentType: stf.employmentType,
        updatedAt: new Date().toISOString(),
      }).catch((e) => console.warn('Cloud sync update staff master error:', e));
    }

    logActivity('UPDATE', 'Staff', `स्टाफ विवरण अद्यतन: ${stf.name} (सत्र: ${targetSession})`, {
      recordId: stf.id,
      recordName: stf.name,
      schoolUdise: targetUdise,
      oldValue: old,
      newValue: stf,
    });
  };

  const deleteStaff = (id: string) => {
    assertFeatureEnabled('module.teachers.action.delete', 'स्टाफ हटाना (deleteStaff)');
    assertSessionModifiable(selectedSessionId, 'deleteStaff');
    const target = staff.find((s) => s.id === id);
    if (!target) return;
    if (isSchoolUser) {
      assertSchoolAccess(target.assignedSchoolUdise, 'deleteStaff');
    }
    // Delete posting for current session
    setStaffPostings((prev) =>
      prev.filter((p) => !(p.staffId === id && p.sessionId === selectedSessionId))
    );
    const postingToDelete = staffPostings.find(
      (p) => p.staffId === id && p.sessionId === selectedSessionId
    );
    if (postingToDelete) {
      deleteStaffPostingFromCloud(postingToDelete.id).catch((e) =>
        console.warn('Cloud delete staff posting error:', e)
      );
    }
    logActivity('DELETE', 'Staff', `सत्र ${selectedSessionId} से स्टाफ पदस्थापना हटाई गई: ${target.name || id}`, {
      recordId: id,
      recordName: target.name,
      schoolUdise: target.assignedSchoolUdise,
      oldValue: target,
    });
  };

  const addRasoiya = (data: Omit<Rasoiya, 'id'>): Rasoiya => {
    assertFeatureEnabled('module.rasoiya.action.add', 'रसोइया जोड़ना (addRasoiya)');
    const targetSession = data.sessionId || selectedSessionId;
    assertSessionModifiable(targetSession, 'addRasoiya');

    const targetUdise = isSchoolUser ? currentSchoolUdise : (data.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    if (isSchoolUser && data.schoolUdise) {
      assertSchoolAccess(data.schoolUdise, 'addRasoiya');
    }
    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const newId = `RSY-${targetUdise.slice(-5)}-${Date.now().toString().slice(-4)}`;
    const newRasoiya: Rasoiya = {
      ...data,
      id: newId,
      schoolUdise: targetUdise,
      schoolName: schoolObj?.hindiName || schoolObj?.name || data.schoolName || targetUdise,
      status: data.status || 'ACTIVE',
      sessionId: targetSession,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setRasoiya((prev) => [newRasoiya, ...prev]);

    // Cloud Database Persistence
    syncRasoiyaToCloud(newRasoiya).catch((e) => console.warn('Cloud sync rasoiya error:', e));

    logActivity('CREATE', 'MDM', `नया रसोइया पंजीकृत किया गया: ${newRasoiya.name} (${newRasoiya.schoolName}, सत्र: ${targetSession})`, {
      recordId: newId,
      recordName: newRasoiya.name,
      schoolUdise: targetUdise,
      newValue: newRasoiya,
    });
    return newRasoiya;
  };

  const updateRasoiya = (data: Rasoiya) => {
    assertFeatureEnabled('module.rasoiya.action.edit', 'रसोइया संपादन (updateRasoiya)');
    const old = rasoiya.find((r) => r.id === data.id);
    const targetSession = data.sessionId || old?.sessionId || selectedSessionId;
    assertSessionModifiable(targetSession, 'updateRasoiya');

    if (old) {
      assertSchoolAccess(old.schoolUdise, 'updateRasoiya:old');
    }
    if (isSchoolUser && data.schoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(data.schoolUdise, 'updateRasoiya:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : data.schoolUdise;
    const schoolObj = schools.find((s) => s.udise === targetUdise);

    const updated: Rasoiya = {
      ...data,
      schoolUdise: targetUdise,
      schoolName: schoolObj?.hindiName || schoolObj?.name || data.schoolName || targetUdise,
      sessionId: targetSession,
      updatedAt: new Date().toISOString(),
    };

    setRasoiya((prev) => prev.map((r) => (r.id === data.id ? updated : r)));

    // Cloud Database Persistence
    syncRasoiyaToCloud(updated).catch((e) => console.warn('Cloud sync update rasoiya error:', e));

    logActivity('UPDATE', 'MDM', `रसोइया विवरण संशोधित किया गया: ${updated.name} (सत्र: ${targetSession})`, {
      recordId: data.id,
      recordName: updated.name,
      schoolUdise: targetUdise,
      oldValue: old,
      newValue: updated,
    });
  };

  const deleteRasoiya = (id: string) => {
    assertFeatureEnabled('module.rasoiya.action.delete', 'रसोइया हटाना (deleteRasoiya)');
    const target = rasoiya.find((r) => r.id === id);
    if (!target) return;
    assertSchoolAccess(target.schoolUdise, 'deleteRasoiya');
    assertSessionModifiable(target.sessionId || selectedSessionId, 'deleteRasoiya');

    setRasoiya((prev) => prev.filter((r) => r.id !== id));

    // Cloud Database Persistence
    deleteRasoiyaFromCloud(id).catch((e) => console.warn('Cloud delete rasoiya error:', e));

    logActivity('DELETE', 'MDM', `रसोइया रिकॉर्ड हटाया गया: ${target.name} (${target.schoolName})`, {
      recordId: id,
      recordName: target.name,
      schoolUdise: target.schoolUdise,
      oldValue: target,
    });
  };

  const addSHG = (data: Omit<SHG, 'id'>): SHG => {
    assertFeatureEnabled('module.shg.action.add', 'स्व-सहायता समूह जोड़ना (addSHG)');
    const targetSession = data.sessionId || selectedSessionId;
    assertSessionModifiable(targetSession, 'addSHG');

    const targetUdise = isSchoolUser ? currentSchoolUdise : (data.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    if (isSchoolUser && data.schoolUdise) {
      assertSchoolAccess(data.schoolUdise, 'addSHG');
    }
    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const newId = `SHG-${targetUdise.slice(-5)}-${Date.now().toString().slice(-4)}`;
    const newSHG: SHG = {
      ...data,
      id: newId,
      schoolUdise: targetUdise,
      schoolName: schoolObj?.hindiName || schoolObj?.name || data.schoolName || targetUdise,
      status: data.status || 'ACTIVE',
      sessionId: targetSession,
      members: data.members || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setShgs((prev) => [newSHG, ...prev]);

    // Cloud Database Persistence
    syncSHGToCloud(newSHG).catch((e) => console.warn('Cloud sync SHG error:', e));

    logActivity('CREATE', 'MDM', `नया स्व-सहायता समूह जोड़ा गया: ${newSHG.name} (${newSHG.schoolName}, सत्र: ${targetSession})`, {
      recordId: newId,
      recordName: newSHG.name,
      schoolUdise: targetUdise,
      newValue: newSHG,
    });
    return newSHG;
  };

  const updateSHG = (data: SHG) => {
    assertFeatureEnabled('module.shg.action.edit', 'स्व-सहायता समूह संपादन (updateSHG)');
    const old = shgs.find((s) => s.id === data.id);
    const targetSession = data.sessionId || old?.sessionId || selectedSessionId;
    assertSessionModifiable(targetSession, 'updateSHG');

    if (old) {
      assertSchoolAccess(old.schoolUdise, 'updateSHG:old');
    }
    if (isSchoolUser && data.schoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(data.schoolUdise, 'updateSHG:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : data.schoolUdise;
    const schoolObj = schools.find((s) => s.udise === targetUdise);

    const updated: SHG = {
      ...data,
      schoolUdise: targetUdise,
      schoolName: schoolObj?.hindiName || schoolObj?.name || data.schoolName || targetUdise,
      sessionId: targetSession,
      updatedAt: new Date().toISOString(),
    };

    setShgs((prev) => prev.map((s) => (s.id === data.id ? updated : s)));

    // Cloud Database Persistence
    syncSHGToCloud(updated).catch((e) => console.warn('Cloud sync update SHG error:', e));

    logActivity('UPDATE', 'MDM', `स्व-सहायता समूह विवरण संशोधित किया गया: ${updated.name} (सत्र: ${targetSession})`, {
      recordId: data.id,
      recordName: updated.name,
      schoolUdise: targetUdise,
      oldValue: old,
      newValue: updated,
    });
  };

  const deleteSHG = (id: string) => {
    assertFeatureEnabled('module.shg.action.delete', 'स्व-सहायता समूह हटाना (deleteSHG)');
    const target = shgs.find((s) => s.id === id);
    if (!target) return;
    assertSchoolAccess(target.schoolUdise, 'deleteSHG');
    assertSessionModifiable(target.sessionId || selectedSessionId, 'deleteSHG');

    setShgs((prev) => prev.filter((s) => s.id !== id));

    // Cloud Database Persistence
    deleteSHGFromCloud(id).catch((e) => console.warn('Cloud delete SHG error:', e));

    logActivity('DELETE', 'MDM', `स्व-सहायता समूह रिकॉर्ड हटाया गया: ${target.name} (${target.schoolName})`, {
      recordId: id,
      recordName: target.name,
      schoolUdise: target.schoolUdise,
      oldValue: target,
    });
  };

  const updateFacility = (fac: PhysicalFacility) => {
    assertFeatureEnabled('module.facilities.action.update', 'भौतिक सुविधा अद्यतन (updateFacility)');
    assertSessionModifiable(selectedSessionId, 'updateFacility');
    if (isSchoolUser && fac.schoolUdise) {
      assertSchoolAccess(fac.schoolUdise, 'updateFacility');
    }
    const sanitizedFac: PhysicalFacility = isSchoolUser
      ? { ...fac, schoolUdise: currentSchoolUdise }
      : fac;
    setFacilities((prev) => {
      const idx = prev.findIndex(
        (f) => f.schoolUdise === sanitizedFac.schoolUdise && f.facilityKey === sanitizedFac.facilityKey
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = sanitizedFac;
        return next;
      }
      return [...prev, sanitizedFac];
    });

    // Cloud Database Persistence
    syncFacilityToCloud(sanitizedFac).catch((e) => console.warn('Cloud sync facility error:', e));

    logActivity('UPDATE', 'PhysicalFacilities', `भौतिक सुविधा विवरण अद्यतन: ${sanitizedFac.facilityName} - ${sanitizedFac.available}`, {
      recordName: sanitizedFac.facilityName,
      schoolUdise: sanitizedFac.schoolUdise,
      newValue: sanitizedFac,
    });
  };

  const markAttendance = (attData: Omit<AttendanceRecord, 'id' | 'markedAt'>) => {
    assertFeatureEnabled('module.attendance.action.mark_save', 'उपस्थिति दर्ज करना (markAttendance)');
    assertSessionModifiable(attData.sessionId || selectedSessionId, 'markAttendance');
    if (isSchoolUser && attData.schoolUdise) {
      assertSchoolAccess(attData.schoolUdise, 'markAttendance');
    }
    const now = new Date();
    const targetUdise = isSchoolUser ? currentSchoolUdise : (attData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    const newAtt: AttendanceRecord = {
      ...attData,
      sessionId: attData.sessionId || selectedSessionId,
      schoolUdise: targetUdise,
      id: `ATT-${now.toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      markedAt: now.toLocaleString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setAttendance((prev) => {
      const filtered = prev.filter(
        (a) =>
          !(
            a.date === newAtt.date &&
            a.schoolUdise === newAtt.schoolUdise &&
            (a.type === newAtt.type || (['TEACHER', 'STAFF'].includes(a.type) && ['TEACHER', 'STAFF'].includes(newAtt.type))) &&
            (a.class || '') === (newAtt.class || '') &&
            (!a.sessionId || a.sessionId === newAtt.sessionId)
          )
      );
      return [newAtt, ...filtered];
    });

    // Cloud Database Persistence
    syncAttendanceToCloud(newAtt).catch((e) => console.warn('Cloud sync attendance error:', e));

    logActivity('CREATE', 'Attendance', `${newAtt.type} उपस्थिति दर्ज की गई (${newAtt.presentCount}/${newAtt.totalCount} उपस्थित, सत्र: ${newAtt.sessionId})`, {
      recordId: newAtt.id,
      schoolUdise: newAtt.schoolUdise,
      newValue: newAtt,
    });
  };

  const markAttendanceBatch = (records: Omit<AttendanceRecord, 'id' | 'markedAt'>[]) => {
    assertFeatureEnabled('module.attendance.action.mark_save', 'थोक उपस्थिति दर्ज करना (markAttendanceBatch)');
    if (!records || records.length === 0) return;
    const now = new Date();
    const createdList: AttendanceRecord[] = records.map((attData, index) => {
      assertSessionModifiable(attData.sessionId || selectedSessionId, 'markAttendanceBatch');
      if (isSchoolUser && attData.schoolUdise) {
        assertSchoolAccess(attData.schoolUdise, 'markAttendanceBatch');
      }
      const targetUdise = isSchoolUser ? currentSchoolUdise : (attData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
      return {
        ...attData,
        sessionId: attData.sessionId || selectedSessionId,
        schoolUdise: targetUdise,
        id: `ATT-${now.toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-4)}-${index}`,
        markedAt: now.toLocaleString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      };
    });

    setAttendance((prev) => {
      let current = [...prev];
      for (const newAtt of createdList) {
        current = current.filter(
          (a) =>
            !(
              a.date === newAtt.date &&
              a.schoolUdise === newAtt.schoolUdise &&
              (a.type === newAtt.type || (['TEACHER', 'STAFF'].includes(a.type) && ['TEACHER', 'STAFF'].includes(newAtt.type))) &&
              (a.class || '') === (newAtt.class || '') &&
              (!a.sessionId || a.sessionId === newAtt.sessionId)
            )
        );
      }
      return [...createdList, ...current];
    });

    logActivity('CREATE', 'Attendance', `थोक उपस्थिति दर्ज की गई (${createdList.length} रिकॉर्ड्स, सत्र: ${selectedSessionId})`, {
      recordId: createdList[0]?.id,
      schoolUdise: createdList[0]?.schoolUdise,
      newValue: createdList,
    });
  };

  const saveMDMRecord = (mdmData: Omit<MDMRecord, 'id'> & { id?: string }) => {
    assertFeatureEnabled('module.mdm.action.add_edit', 'मध्याह्न भोजन प्रविष्टि (saveMDMRecord)');
    assertSessionModifiable(mdmData.sessionId || selectedSessionId, 'saveMDMRecord');
    if (isSchoolUser && mdmData.schoolUdise) {
      assertSchoolAccess(mdmData.schoolUdise, 'saveMDMRecord');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : (mdmData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    const newMdm: MDMRecord = {
      ...mdmData,
      sessionId: mdmData.sessionId || selectedSessionId,
      schoolUdise: targetUdise,
      id: mdmData.id || `MDM-${mdmData.date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
    };

    setMdmRecords((prev) => {
      const filtered = prev.filter(
        (m) => m.id !== newMdm.id && !(m.date === newMdm.date && m.schoolUdise === newMdm.schoolUdise && (!m.sessionId || m.sessionId === newMdm.sessionId))
      );
      return [newMdm, ...filtered];
    });

    // Cloud Database Persistence
    syncMDMToCloud(newMdm).catch((e) => console.warn('Cloud sync MDM error:', e));

    logActivity(mdmData.id ? 'UPDATE' : 'CREATE', 'MDM', `दैनिक मध्याह्न भोजन वितरण प्रविष्टि (${newMdm.mealsServed} भोजन परोसा गया, सत्र: ${newMdm.sessionId})`, {
      recordId: newMdm.id,
      schoolUdise: newMdm.schoolUdise,
      newValue: newMdm,
    });
  };

  const deleteMDMRecord = (id: string) => {
    assertFeatureEnabled('module.mdm.action.delete', 'मध्याह्न भोजन रिकॉर्ड हटाना (deleteMDMRecord)');
    const record = mdmRecords.find((m) => m.id === id);
    if (!record) return;
    assertSessionModifiable(record.sessionId || selectedSessionId, 'deleteMDMRecord');
    if (isSchoolUser && record.schoolUdise) {
      assertSchoolAccess(record.schoolUdise, 'deleteMDMRecord');
    }
    setMdmRecords((prev) => prev.filter((m) => m.id !== id));
    deleteMDMFromCloud(id).catch((e) => console.warn('Cloud delete MDM error:', e));
    logActivity('DELETE', 'MDM', `मध्याह्न भोजन प्रविष्टि हटाई गई (दिनांक: ${record.date}, शाला: ${record.schoolUdise})`, {
      recordId: id,
      schoolUdise: record.schoolUdise,
    });
  };

  const addGovernmentWork = (workData: Omit<GovernmentWork, 'id'>) => {
    assertFeatureEnabled('module.work.action.add', 'नया शासकीय कार्य जोड़ना (addGovernmentWork)');
    assertSessionModifiable(workData.sessionId || selectedSessionId, 'addGovernmentWork');
    if (isSchoolUser && workData.schoolUdise) {
      assertSchoolAccess(workData.schoolUdise, 'addGovernmentWork');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : (workData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    const newWork: GovernmentWork = {
      ...workData,
      sessionId: workData.sessionId || selectedSessionId,
      schoolUdise: targetUdise,
      id: `GW-${Date.now().toString().slice(-5)}`,
    };
    setGovernmentWork((prev) => [newWork, ...prev]);

    // Cloud Database Persistence
    syncGovernmentWorkToCloud(newWork).catch((e) => console.warn('Cloud sync government work error:', e));

    logActivity('CREATE', 'GovernmentWork', `नया शासकीय कार्य/आदेश आवंटित: ${newWork.workName} (सत्र: ${newWork.sessionId})`, {
      recordId: newWork.id,
      recordName: newWork.workName,
      schoolUdise: newWork.schoolUdise,
      newValue: newWork,
    });
  };

  const updateGovernmentWork = (work: GovernmentWork) => {
    assertFeatureEnabled('module.work.action.edit', 'शासकीय कार्य संपादन (updateGovernmentWork)');
    assertFeatureEnabled('module.work.action.update_status', 'शासकीय कार्य अद्यतन (updateGovernmentWork)');
    assertSessionModifiable(work.sessionId || selectedSessionId, 'updateGovernmentWork');
    const old = governmentWork.find((w) => w.id === work.id);
    if (old) {
      assertSchoolAccess(old.schoolUdise, 'updateGovernmentWork:old');
    }
    if (isSchoolUser && work.schoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(work.schoolUdise, 'updateGovernmentWork:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : work.schoolUdise;
    const sanitized = { ...work, schoolUdise: targetUdise };
    setGovernmentWork((prev) => prev.map((w) => (w.id === sanitized.id ? sanitized : w)));

    // Cloud Database Persistence
    syncGovernmentWorkToCloud(sanitized).catch((e) => console.warn('Cloud sync update government work error:', e));

    logActivity('UPDATE', 'GovernmentWork', `शासकीय कार्य स्थिति अद्यतन: ${sanitized.workName} (${sanitized.status})`, {
      recordId: sanitized.id,
      recordName: sanitized.workName,
      schoolUdise: sanitized.schoolUdise,
      newValue: sanitized,
    });
  };

  const deleteGovernmentWork = (id: string) => {
    assertFeatureEnabled('module.work.action.delete', 'शासकीय कार्य हटाना (deleteGovernmentWork)');
    const target = governmentWork.find((w) => w.id === id);
    if (!target) return;
    assertSessionModifiable(target.sessionId || selectedSessionId, 'deleteGovernmentWork');
    if (isSchoolUser) {
      assertSchoolAccess(target.schoolUdise, 'deleteGovernmentWork');
    }
    setGovernmentWork((prev) => prev.filter((w) => w.id !== id));

    // Cloud Database Persistence
    deleteGovernmentWorkFromCloud(id).catch((e) => console.warn('Cloud delete government work error:', e));

    logActivity('DELETE', 'GovernmentWork', `शासकीय कार्य हटाया गया: ${target.workName || id}`, {
      recordId: id,
      recordName: target.workName,
      schoolUdise: target.schoolUdise,
    });
  };

  const addComplaint = (compData: Omit<Complaint, 'id' | 'complaintId'>) => {
    assertFeatureEnabled('module.complaints.action.create', 'नई शिकायत दर्ज करना (addComplaint)');
    if (isSchoolUser && compData.schoolUdise) {
      assertSchoolAccess(compData.schoolUdise, 'addComplaint');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : (compData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    const subjectVal = compData.subject || compData.title || 'सामान्य जन शिकायत';
    const compDate = compData.date || compData.createdAt || new Date().toISOString().split('T')[0];
    const creatorName = compData.complainantName || compData.submittedBy || currentUser?.name || 'प्रधानाध्यापक / शिक्षक';
    const creatorRole = compData.submitterRole || (currentUser?.role === 'SCHOOL' ? 'शिक्षक / संस्था प्रभारी' : (currentUser?.role || 'नागरिक'));
    const initialStatus = (compData.status === 'PENDING' ? 'OPEN' : compData.status) || 'OPEN';

    const historyItem: ComplaintHistoryItem = {
      id: `hist-${Date.now()}-0`,
      action: 'CREATED',
      date: compDate,
      dateTime: new Date().toLocaleString('hi-IN'),
      timestamp: new Date().toISOString(),
      userId: currentUser?.username || currentUser?.id,
      userName: creatorName,
      userRole: creatorRole,
      remark: `शिकायत दर्ज की गई: ${subjectVal}`,
      newStatus: initialStatus,
    };

    const newComp: Complaint = {
      ...compData,
      status: initialStatus,
      subject: subjectVal,
      title: compData.title || subjectVal,
      submittedBy: creatorName,
      complainantName: creatorName,
      submitterRole: creatorRole,
      date: compDate,
      complaintDate: compDate,
      createdAt: compDate,
      sessionId: compData.sessionId || selectedSessionId,
      schoolUdise: targetUdise,
      id: `CMP-${Date.now().toString().slice(-5)}`,
      complaintId: `COMP-2026-${Date.now().toString().slice(-4)}`,
      complaintHistory: [historyItem],
    };
    setComplaints((prev) => [newComp, ...prev]);

    // Cloud Database Persistence
    syncComplaintToCloud(newComp).catch((e) => console.warn('Cloud sync complaint error:', e));

    logActivity('CREATE', 'Complaints', `नई शिकायत पंजीकृत: ${newComp.complaintId} - ${newComp.subject}`, {
      recordId: newComp.id,
      recordName: newComp.subject,
      schoolUdise: newComp.schoolUdise,
      newValue: {
        ...newComp,
        user: currentUser?.name || currentUser?.username,
        role: currentUser?.role,
      },
    });
  };

  const updateComplaint = (comp: Complaint) => {
    assertFeatureEnabled('module.complaints.action.edit', 'शिकायत विवरण संपादन (updateComplaint)');
    const old = complaints.find((c) => c.id === comp.id);
    if (!old) return;
    if (isSchoolUser) {
      const userUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();
      if (old.schoolUdise !== userUdise || (comp.schoolUdise && comp.schoolUdise !== userUdise)) {
        logActivity(
          'SECURITY_ALERT',
          'SecurityGateway',
          `अनाधिकृत शिकायत संपादन प्रयास [ACCESS_DENIED]: User '${currentUser?.name}' (${currentUser?.role}) UDISE ${old.schoolUdise} की शिकायत ${old.complaintId || old.id} अद्यतन हेतु अनाधिकृत है। अधिकृत UDISE: ${userUdise}`,
          { schoolUdise: old.schoolUdise, recordId: old.id, recordName: old.complaintId }
        );
        throw new Error('[ACCESS_DENIED]');
      }
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : (comp.schoolUdise || old.schoolUdise);
    const existingHistory = old.complaintHistory || [];
    let updatedHistory = [...existingHistory];

    if (comp.status && comp.status !== old.status) {
      const histItem: ComplaintHistoryItem = {
        id: `hist-${Date.now()}-${updatedHistory.length + 1}`,
        action: comp.status === 'IN_PROGRESS' ? 'IN_PROGRESS' : comp.status === 'RESOLVED' ? 'RESOLVED' : comp.status === 'CLOSED' ? 'CLOSED' : 'STATUS_CHANGED',
        date: new Date().toISOString().split('T')[0],
        dateTime: new Date().toLocaleString('hi-IN'),
        timestamp: new Date().toISOString(),
        userId: currentUser?.username || currentUser?.id,
        userName: currentUser?.name || currentUser?.username || 'अधिकृत उपयोगकर्ता',
        userRole: currentUser?.role === 'SCHOOL' ? 'SCHOOL / Teacher' : (currentUser?.role || 'अधिकृत अधिकारी'),
        remark: comp.remarks || `स्थिति परिवर्तित: ${old.status} ➔ ${comp.status}`,
        previousStatus: old.status,
        newStatus: comp.status,
      };
      updatedHistory.push(histItem);
    }

    const sanitized: Complaint = {
      ...old,
      ...comp,
      // Date and complaintDate must remain strictly untouched!
      date: old.date || old.complaintDate || comp.date,
      complaintDate: old.complaintDate || old.date || comp.date,
      schoolUdise: targetUdise,
      subject: comp.subject || comp.title || old.subject,
      title: comp.title || comp.subject || old.title,
      complaintHistory: updatedHistory,
      updatedAt: new Date().toISOString(),
    };
    setComplaints((prev) => prev.map((c) => (c.id === sanitized.id ? sanitized : c)));

    // Cloud Database Persistence
    syncComplaintToCloud(sanitized).catch((e) => console.warn('Cloud sync update complaint error:', e));

    logActivity('UPDATE', 'Complaints', `शिकायत स्थिति/कार्यवाही अद्यतन: ${sanitized.complaintId} (${sanitized.status})`, {
      recordId: sanitized.id,
      recordName: sanitized.subject,
      schoolUdise: sanitized.schoolUdise,
      oldValue: old,
      newValue: {
        ...sanitized,
        user: currentUser?.name || currentUser?.username,
        role: currentUser?.role,
        previousStatus: old.status,
      },
    });
  };

  const resolveComplaint = (
    complaintIdOrId: string,
    resolutionData: {
      resolutionNotes: string;
      resolutionDate?: string;
      status: ComplaintStatus;
      resolutionOutcome?: 'RESOLVED' | 'PARTIAL' | 'FORWARDED' | string;
      forwardedToOfficer?: string;
      forwardedRemarks?: string;
    }
  ): Complaint => {
    assertFeatureEnabled('module.complaints.action.resolve', 'शिकायत निराकरण (resolveComplaint)');
    const target = complaints.find((c) => c.id === complaintIdOrId || c.complaintId === complaintIdOrId);
    if (!target) {
      throw new Error('शिकायत रिकॉर्ड प्राप्त नहीं हुआ');
    }

    // Strict Authorization Check:
    // if SCHOOL user: targetComplaint.schoolUdise === currentUser.assignedSchoolUdise
    if (isSchoolUser) {
      const userUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();
      if (!userUdise || target.schoolUdise !== userUdise) {
        logActivity(
          'SECURITY_ALERT',
          'SecurityGateway',
          `अनाधिकृत शिकायत निराकरण प्रयास [ACCESS_DENIED]: User '${currentUser?.name}' (${currentUser?.role}) विद्यालय UDISE ${target.schoolUdise} की शिकायत ${target.complaintId || target.id} निराकृत करने हेतु अनाधिकृत है। अधिकृत UDISE: ${userUdise}`,
          { schoolUdise: target.schoolUdise, recordId: target.id, recordName: target.complaintId }
        );
        throw new Error('[ACCESS_DENIED]');
      }
    }

    const prevStatus = target.status;
    const resDate = resolutionData.resolutionDate || new Date().toISOString().split('T')[0];
    const resolverName = currentUser?.name || currentUser?.username || 'अधिकृत उपयोगकर्ता';
    const resolverRole = currentUser?.role === 'SCHOOL' ? 'SCHOOL / Teacher' : (currentUser?.role || 'अधिकृत अधिकारी');
    const targetStatus: ComplaintStatus = resolutionData.status || 'RESOLVED';

    const historyItem: ComplaintHistoryItem = {
      id: `hist-${Date.now()}-${(target.complaintHistory?.length || 0) + 1}`,
      action: 'RESOLVED',
      date: resDate,
      dateTime: new Date().toLocaleString('hi-IN'),
      timestamp: new Date().toISOString(),
      userId: currentUser?.username || currentUser?.id,
      userName: resolverName,
      userRole: resolverRole,
      remark: resolutionData.resolutionNotes,
      resolutionOutcome: resolutionData.resolutionOutcome || (targetStatus === 'RESOLVED' ? 'RESOLVED' : 'PARTIAL'),
      forwardedTo: resolutionData.forwardedToOfficer,
      previousStatus: prevStatus,
      newStatus: targetStatus,
    };

    const existingHistory = target.complaintHistory || [];

    const updated: Complaint = {
      ...target,
      // Date and complaintDate must remain strictly unchanged!
      date: target.date || target.complaintDate || resDate,
      complaintDate: target.complaintDate || target.date || resDate,
      status: targetStatus,
      actionTaken: resolutionData.resolutionNotes,
      resolutionNotes: resolutionData.resolutionNotes,
      resolutionDate: resDate,
      resolvedBy: currentUser?.username || currentUser?.id,
      resolvedByName: resolverName,
      resolverRole: resolverRole,
      resolutionOutcome: resolutionData.resolutionOutcome || (targetStatus === 'RESOLVED' ? 'RESOLVED' : 'PARTIAL'),
      forwardedToOfficer: resolutionData.forwardedToOfficer || '',
      forwardedRemarks: resolutionData.forwardedRemarks || '',
      remarks: resolutionData.forwardedToOfficer
        ? `अधिकारी को प्रेषित (${resolutionData.forwardedToOfficer}): ${resolutionData.resolutionNotes}`
        : resolutionData.resolutionNotes,
      complaintHistory: [...existingHistory, historyItem],
      updatedAt: new Date().toISOString(),
    };

    setComplaints((prev) => prev.map((c) => (c.id === target.id ? updated : c)));

    // Cloud Database Persistence
    syncComplaintToCloud(updated).catch((e) => console.warn('Cloud sync resolve complaint error:', e));

    // Audit Log entry with User, Role, Complaint ID, School UDISE, Action, Date/Time, Previous Status, New Status, Remark
    logActivity('UPDATE', 'Complaints', `शिकायत का निराकरण दर्ज किया गया: ${target.complaintId || target.id} (स्थिति: ${prevStatus} ➔ ${updated.status}) - ${resolverName} (${resolverRole})`, {
      recordId: target.id,
      recordName: target.subject || target.title,
      schoolUdise: target.schoolUdise,
      oldValue: { status: prevStatus, remarks: target.remarks },
      newValue: {
        complaintId: target.complaintId || target.id,
        user: resolverName,
        role: resolverRole,
        action: 'RESOLVE_COMPLAINT',
        dateTime: new Date().toLocaleString('hi-IN'),
        previousStatus: prevStatus,
        newStatus: updated.status,
        remark: resolutionData.resolutionNotes,
        outcome: updated.resolutionOutcome,
        forwardedTo: updated.forwardedToOfficer || undefined,
      },
    });

    return updated;
  };

  const closeComplaint = (
    complaintIdOrId: string,
    closeData?: {
      closeDate?: string;
      closeRemark?: string;
    }
  ): Complaint => {
    assertFeatureEnabled('module.complaints.action.close', 'शिकायत बंद करना (closeComplaint)');
    const target = complaints.find((c) => c.id === complaintIdOrId || c.complaintId === complaintIdOrId);
    if (!target) {
      throw new Error('शिकायत रिकॉर्ड प्राप्त नहीं हुआ');
    }

    // Strict Authorization Check:
    if (isSchoolUser) {
      const userUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();
      if (!userUdise || target.schoolUdise !== userUdise) {
        logActivity(
          'SECURITY_ALERT',
          'SecurityGateway',
          `अनाधिकृत शिकायत बंदी प्रयास [ACCESS_DENIED]: User '${currentUser?.name}' (${currentUser?.role}) विद्यालय UDISE ${target.schoolUdise} की शिकायत ${target.complaintId || target.id} बंद करने हेतु अनाधिकृत है। अधिकृत UDISE: ${userUdise}`,
          { schoolUdise: target.schoolUdise, recordId: target.id, recordName: target.complaintId }
        );
        throw new Error('[ACCESS_DENIED]');
      }
    }

    const prevStatus = target.status;
    const cDate = closeData?.closeDate || new Date().toISOString().split('T')[0];
    const closerName = currentUser?.name || currentUser?.username || 'अधिकृत उपयोगकर्ता';
    const closerRole = currentUser?.role === 'SCHOOL' ? 'SCHOOL / Teacher' : (currentUser?.role || 'अधिकृत अधिकारी');
    const cRemark = closeData?.closeRemark?.trim() || 'समस्या का समाधान पूर्णतः सत्यापित पाया गया। शिकायत विधिवत बंद (CLOSED) की गई।';

    const historyItem: ComplaintHistoryItem = {
      id: `hist-${Date.now()}-${(target.complaintHistory?.length || 0) + 1}`,
      action: 'CLOSED',
      date: cDate,
      dateTime: new Date().toLocaleString('hi-IN'),
      timestamp: new Date().toISOString(),
      userId: currentUser?.username || currentUser?.id,
      userName: closerName,
      userRole: closerRole,
      remark: cRemark,
      previousStatus: prevStatus,
      newStatus: 'CLOSED',
    };

    const existingHistory = target.complaintHistory || [];

    const updated: Complaint = {
      ...target,
      // Date and complaintDate must remain strictly unchanged!
      date: target.date || target.complaintDate || cDate,
      complaintDate: target.complaintDate || target.date || cDate,
      status: 'CLOSED',
      closeDate: cDate,
      closedAt: cDate,
      closedBy: currentUser?.username || currentUser?.id,
      closedByName: closerName,
      closerRole: closerRole,
      closeRemark: cRemark,
      remarks: `शिकायत बंद (Closed on ${cDate}): ${cRemark}`,
      complaintHistory: [...existingHistory, historyItem],
      updatedAt: new Date().toISOString(),
    };

    setComplaints((prev) => prev.map((c) => (c.id === target.id ? updated : c)));

    // Cloud Database Persistence
    syncComplaintToCloud(updated).catch((e) => console.warn('Cloud sync close complaint error:', e));

    logActivity('UPDATE', 'Complaints', `शिकायत बंद की गई (Closed): ${target.complaintId || target.id} (स्थिति: ${prevStatus} ➔ CLOSED) - ${closerName}`, {
      recordId: target.id,
      recordName: target.subject || target.title,
      schoolUdise: target.schoolUdise,
      oldValue: { status: prevStatus },
      newValue: {
        complaintId: target.complaintId || target.id,
        user: closerName,
        role: closerRole,
        action: 'CLOSE_COMPLAINT',
        dateTime: new Date().toLocaleString('hi-IN'),
        previousStatus: prevStatus,
        newStatus: 'CLOSED',
        closeDate: cDate,
        remark: cRemark,
      },
    });

    return updated;
  };

  const reopenComplaint = (
    complaintIdOrId: string,
    reopenReason: string,
    reopenDate?: string
  ): Complaint => {
    assertFeatureEnabled('module.complaints.action.reopen', 'शिकायत पुनः खोलना (reopenComplaint)');
    const target = complaints.find((c) => c.id === complaintIdOrId || c.complaintId === complaintIdOrId);
    if (!target) {
      throw new Error('शिकायत रिकॉर्ड प्राप्त नहीं हुआ');
    }

    // Validate status can be reopened (CLOSED, RESOLVED, or REJECTED)
    if (target.status !== 'CLOSED' && target.status !== 'RESOLVED' && target.status !== 'REJECTED') {
      throw new Error('केवल बंद (CLOSED) अथवा निराकृत (RESOLVED) शिकायत को ही पुनः खोला जा सकता है।');
    }

    if (!reopenReason || !reopenReason.trim()) {
      throw new Error('शिकायत पुनः खोलने का कारण अनिवार्य है।');
    }

    // Strict Authorization Check:
    if (isSchoolUser) {
      const userUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();
      if (!userUdise || target.schoolUdise !== userUdise) {
        logActivity(
          'SECURITY_ALERT',
          'SecurityGateway',
          `अनाधिकृत शिकायत पुनर्प्रारंभ प्रयास [ACCESS_DENIED]: User '${currentUser?.name}' (${currentUser?.role}) विद्यालय UDISE ${target.schoolUdise} की शिकायत ${target.complaintId || target.id} पुनः खोलने हेतु अनाधिकृत है। अधिकृत UDISE: ${userUdise}`,
          { schoolUdise: target.schoolUdise, recordId: target.id, recordName: target.complaintId }
        );
        throw new Error('[ACCESS_DENIED]');
      }
    }

    const prevStatus = target.status;
    const reopenerName = currentUser?.name || currentUser?.username || 'अधिकृत उपयोगकर्ता';
    const reopenerRole = currentUser?.role === 'SCHOOL' ? 'SCHOOL / Teacher' : (currentUser?.role || 'अधिकृत अधिकारी');
    const rDate = reopenDate || new Date().toISOString().split('T')[0];

    const historyItem: ComplaintHistoryItem = {
      id: `hist-${Date.now()}-${(target.complaintHistory?.length || 0) + 1}`,
      action: 'REOPENED',
      date: rDate,
      dateTime: new Date().toLocaleString('hi-IN'),
      timestamp: new Date().toISOString(),
      userId: currentUser?.username || currentUser?.id,
      userName: reopenerName,
      userRole: reopenerRole,
      reason: reopenReason.trim(),
      remark: reopenReason.trim(),
      previousStatus: prevStatus,
      newStatus: 'REOPENED',
    };

    const existingHistory = target.complaintHistory || [];

    const updated: Complaint = {
      ...target,
      // CRITICAL: date and complaintDate MUST REMAIN UNTOUCHED (original complaint date)
      date: target.date || target.complaintDate || rDate,
      complaintDate: target.complaintDate || target.date || rDate,
      status: 'REOPENED',
      reopenedDate: rDate,
      reopenedBy: reopenerName,
      reopenerRole: reopenerRole,
      reopenReason: reopenReason.trim(),
      remarks: `शिकायत पुनः खोली गई (${rDate}): ${reopenReason.trim()}. पूर्व स्थिति: ${prevStatus}.`,
      complaintHistory: [...existingHistory, historyItem],
      updatedAt: new Date().toISOString(),
    };

    setComplaints((prev) => prev.map((c) => (c.id === target.id ? updated : c)));

    // Cloud Database Persistence
    syncComplaintToCloud(updated).catch((e) => console.warn('Cloud sync reopen complaint error:', e));

    // Audit Log entry with User, Role, Complaint ID, School UDISE, Action, Date/Time, Previous Status, New Status, Remark
    logActivity('UPDATE', 'Complaints', `शिकायत पुनः खोली गई (Re-opened): ${target.complaintId || target.id} (स्थिति: ${prevStatus} ➔ REOPENED) - कारण: ${reopenReason.trim()}`, {
      recordId: target.id,
      recordName: target.subject || target.title,
      schoolUdise: target.schoolUdise,
      oldValue: { status: prevStatus },
      newValue: {
        complaintId: target.complaintId || target.id,
        user: reopenerName,
        role: reopenerRole,
        action: 'REOPEN_COMPLAINT',
        dateTime: new Date().toLocaleString('hi-IN'),
        previousStatus: prevStatus,
        newStatus: 'REOPENED',
        reopenDate: rDate,
        remark: reopenReason.trim(),
      },
    });

    return updated;
  };

  const updateComplaintStatus = (
    complaintIdOrId: string,
    newStatus: ComplaintStatus,
    remark?: string
  ): Complaint => {
    assertFeatureEnabled('module.complaints.action.edit', 'शिकायत स्थिति अद्यतन (updateComplaintStatus)');
    const target = complaints.find((c) => c.id === complaintIdOrId || c.complaintId === complaintIdOrId);
    if (!target) {
      throw new Error('शिकायत रिकॉर्ड प्राप्त नहीं हुआ');
    }

    if (isSchoolUser) {
      const userUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();
      if (!userUdise || target.schoolUdise !== userUdise) {
        logActivity(
          'SECURITY_ALERT',
          'SecurityGateway',
          `अनाधिकृत शिकायत स्थिति परिवर्तन प्रयास [ACCESS_DENIED]: User '${currentUser?.name}' (${currentUser?.role}) विद्यालय UDISE ${target.schoolUdise} की शिकायत ${target.complaintId || target.id} स्थिति बदलने हेतु अनाधिकृत है। अधिकृत UDISE: ${userUdise}`,
          { schoolUdise: target.schoolUdise, recordId: target.id, recordName: target.complaintId }
        );
        throw new Error('[ACCESS_DENIED]');
      }
    }

    const prevStatus = target.status;
    const updaterName = currentUser?.name || currentUser?.username || 'अधिकृत उपयोगकर्ता';
    const updaterRole = currentUser?.role === 'SCHOOL' ? 'SCHOOL / Teacher' : (currentUser?.role || 'अधिकृत अधिकारी');
    const updateDate = new Date().toISOString().split('T')[0];

    const actionType = newStatus === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'STATUS_CHANGED';
    const statusActionRemark = remark || (newStatus === 'IN_PROGRESS' ? 'शिकायत पर पुनः कार्यवाही प्रारंभ की गई' : `स्थिति परिवर्तित: ${prevStatus} ➔ ${newStatus}`);

    const historyItem: ComplaintHistoryItem = {
      id: `hist-${Date.now()}-${(target.complaintHistory?.length || 0) + 1}`,
      action: actionType,
      date: updateDate,
      dateTime: new Date().toLocaleString('hi-IN'),
      timestamp: new Date().toISOString(),
      userId: currentUser?.username || currentUser?.id,
      userName: updaterName,
      userRole: updaterRole,
      remark: statusActionRemark,
      previousStatus: prevStatus,
      newStatus: newStatus,
    };

    const existingHistory = target.complaintHistory || [];

    const updated: Complaint = {
      ...target,
      status: newStatus,
      date: target.date || target.complaintDate || updateDate,
      complaintDate: target.complaintDate || target.date || updateDate,
      remarks: statusActionRemark,
      complaintHistory: [...existingHistory, historyItem],
      updatedAt: new Date().toISOString(),
    };

    setComplaints((prev) => prev.map((c) => (c.id === target.id ? updated : c)));

    // Cloud Database Persistence
    syncComplaintToCloud(updated).catch((e) => console.warn('Cloud sync update complaint status error:', e));

    logActivity('UPDATE', 'Complaints', `शिकायत स्थिति बदली गई: ${target.complaintId || target.id} (${prevStatus} ➔ ${newStatus})`, {
      recordId: target.id,
      recordName: target.subject || target.title,
      schoolUdise: target.schoolUdise,
      oldValue: { status: prevStatus },
      newValue: {
        complaintId: target.complaintId || target.id,
        user: updaterName,
        role: updaterRole,
        action: 'STATUS_CHANGED',
        dateTime: new Date().toLocaleString('hi-IN'),
        previousStatus: prevStatus,
        newStatus: newStatus,
        remark: statusActionRemark,
      },
    });

    return updated;
  };

  const deleteComplaint = (id: string) => {
    assertFeatureEnabled('module.complaints.action.delete', 'शिकायत हटाना (deleteComplaint)');
    const target = complaints.find((c) => c.id === id);
    if (!target) return;
    if (isSchoolUser) {
      const userUdise = (currentUser?.assignedSchoolUdise || currentSchoolUdise || '').trim();
      if (target.schoolUdise !== userUdise) {
        logActivity(
          'SECURITY_ALERT',
          'SecurityGateway',
          `अनाधिकृत शिकायत विलोपन प्रयास [ACCESS_DENIED]: User '${currentUser?.name}' (${currentUser?.role}) UDISE ${target.schoolUdise} की शिकायत ${target.complaintId || target.id} हटाने हेतु अनाधिकृत है। अधिकृत UDISE: ${userUdise}`,
          { schoolUdise: target.schoolUdise, recordId: target.id, recordName: target.complaintId }
        );
        throw new Error('[ACCESS_DENIED]');
      }
    }
    setComplaints((prev) => prev.filter((c) => c.id !== id));

    // Cloud Database Persistence
    deleteComplaintFromCloud(id).catch((e) => console.warn('Cloud delete complaint error:', e));

    logActivity('DELETE', 'Complaints', `शिकायत रिकॉर्ड हटाया गया: ${target.complaintId || target.id} - ${target.subject || target.title}`, {
      recordId: id,
      recordName: target.subject || target.title,
      schoolUdise: target.schoolUdise,
      oldValue: target,
      newValue: {
        complaintId: target.complaintId || target.id,
        user: currentUser?.name || currentUser?.username,
        role: currentUser?.role,
        action: 'DELETE_COMPLAINT',
        dateTime: new Date().toLocaleString('hi-IN'),
      },
    });
  };

  const addNotification = (notifData: Omit<NotificationItem, 'id'>) => {
    assertFeatureEnabled('module.notifications.action.create', 'नई सूचना जारी करना (addNotification)');
    if (isSchoolUser) {
      throw new Error('[ACCESS_DENIED] केवल ADMIN या CAC को संकुल सूचना/आदेश जारी करने की अनुमति है।');
    }
    const now = new Date().toISOString();
    const newNotif: NotificationItem = {
      ...notifData,
      id: `NOTIF-${Date.now().toString().slice(-5)}`,
      sessionId: notifData.sessionId || selectedSessionId,
      readBy: notifData.readBy || [],
      createdAt: notifData.createdAt || now,
      updatedAt: now,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    // Cloud Database Persistence
    syncNotificationToCloud(newNotif).catch((e) => console.warn('Cloud sync notification error:', e));

    logActivity('CREATE', 'Notifications', `नया संकुल नोटिस/आदेश जारी किया गया: ${newNotif.title}`, {
      recordId: newNotif.id,
      recordName: newNotif.title,
      newValue: newNotif,
    });
  };

  const markNotificationAsRead = (notifId: string) => {
    assertFeatureEnabled('module.notifications.action.mark_read', 'सूचना पठित चिह्नित करना (markNotificationAsRead)');
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notifId && !n.readBy.includes(currentUser.id)) {
          const updated: NotificationItem = {
            ...n,
            readBy: [...n.readBy, currentUser.id],
            updatedAt: new Date().toISOString(),
          };
          syncNotificationToCloud(updated).catch((e) => console.warn('Cloud sync markNotificationAsRead error:', e));
          return updated;
        }
        return n;
      })
    );
  };

  const deleteNotification = (notifId: string) => {
    assertFeatureEnabled('module.notifications.action.delete', 'सूचना हटाना (deleteNotification)');
    if (isSchoolUser) {
      throw new Error('[ACCESS_DENIED] केवल ADMIN या CAC को संकुल सूचना/आदेश हटाने की अनुमति है।');
    }
    const target = notifications.find((n) => n.id === notifId);
    if (!target) return;
    setNotifications((prev) => prev.filter((n) => n.id !== notifId));

    // Cloud Database Persistence
    deleteNotificationFromCloud(notifId).catch((e) => console.warn('Cloud delete notification error:', e));

    logActivity('DELETE', 'Notifications', `संकुल सूचना/आदेश हटाया गया: ${target.title}`, {
      recordId: notifId,
      recordName: target.title,
      oldValue: target,
    });
  };

  const addDocument = (docData: Omit<DocumentItem, 'id'> & { id?: string }): DocumentItem => {
    assertFeatureEnabled('module.documents.action.upload', 'दस्तावेज़ अपलोड करना (addDocument)');
    if (isSchoolUser) {
      if (docData.schoolUdise && docData.schoolUdise !== currentSchoolUdise && docData.schoolUdise !== 'ALL') {
        assertSchoolAccess(docData.schoolUdise, 'addDocument');
      }
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : (docData.schoolUdise || 'ALL');
    const newDoc: DocumentItem = {
      ...docData,
      schoolUdise: targetUdise,
      sessionId: docData.sessionId || selectedSessionId,
      uploadedAt: docData.uploadedAt || new Date().toISOString(),
      id: docData.id || `DOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    setDocuments((prev) => [newDoc, ...prev]);

    // Cloud Database Persistence
    syncDocumentToCloud(newDoc).catch((e) => console.warn('Cloud sync document error:', e));

    logActivity('UPLOAD', 'Documents', `नया दस्तावेज अपलोड किया गया: ${newDoc.title} (${newDoc.fileType})`, {
      recordId: newDoc.id,
      recordName: newDoc.title,
      schoolUdise: newDoc.schoolUdise === 'ALL' ? undefined : newDoc.schoolUdise,
      newValue: newDoc,
    });
    return newDoc;
  };

  const deleteDocument = (id: string) => {
    assertFeatureEnabled('module.documents.action.delete', 'दस्तावेज़ हटाना (deleteDocument)');
    const target = documents.find((d) => d.id === id);
    if (!target) return;
    if (isSchoolUser) {
      if (target.schoolUdise !== currentSchoolUdise) {
        assertSchoolAccess(target.schoolUdise || 'ALL', 'deleteDocument');
      }
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    deleteDocumentBinary(id).catch((e) => console.warn('Failed to delete binary from IndexedDB:', e));
    deleteDocumentFromCloud(id).catch((e) => console.warn('Cloud delete document error:', e));
    logActivity('DELETE', 'Documents', `दस्तावेज हटाया गया: ${target?.title || id}`, {
      recordId: id,
      recordName: target?.title,
      schoolUdise: target?.schoolUdise === 'ALL' ? undefined : target?.schoolUdise,
    });
  };

  const addUploadHistory = (item: UploadHistoryItem) => {
    setUploadHistory((prev) => [item, ...prev]);
  };

  const clearUploadHistory = () => {
    setUploadHistory([]);
  };

  const bulkImportSchools = (items: School[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'विद्यालय बल्क अपलोड (bulkImportSchools)');
    if (currentUser?.role !== 'ADMIN') {
      logActivity('SECURITY_ALERT', 'Schools', `अनधिकृत विद्यालय मास्टर आयात प्रयास अस्वीकृत: केवल ADMIN को विद्यालय मास्टर आयात करने की अनुमति है।`);
      return { added: 0, updated: 0, skipped: items.length };
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    setSchools((prev) => {
      let currentList = [...prev];
      items.forEach((item) => {
        const cleanUdise = item.udise.trim();
        const existingIndex = currentList.findIndex((s) => s.udise.trim() === cleanUdise);

        if (existingIndex >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              ...item,
              udise: cleanUdise,
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          currentList.push({ ...item, udise: cleanUdise });
          added++;
        }
      });
      return currentList;
    });

    logActivity('UPLOAD', 'Schools', `विद्यालय डेटा बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportStudents = (items: Student[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'विद्यार्थी बल्क अपलोड (bulkImportStudents)');
    const targetSession = selectedSessionId;
    assertSessionModifiable(targetSession, 'bulkImportStudents');

    let added = 0;
    let updated = 0;
    let skipped = 0;

    items.forEach((item, idx) => {
      const cleanSamagra = item.samagraId?.trim();
      let cleanUdise = item.schoolUdise?.trim() || schools[0]?.udise || '';

      if (isSchoolUser) {
        if (cleanUdise && cleanUdise !== currentSchoolUdise) {
          logActivity(
            'SECURITY_ALERT',
            'Students',
            `विद्यार्थी आयात में अन्य विद्यालय UDISE (${cleanUdise}) पाया गया। इसे अधिकृत UDISE (${currentSchoolUdise}) पर पुनःनिर्देशित किया गया।`
          );
        }
        cleanUdise = currentSchoolUdise;
      }

      const existingMaster = studentMasters.find(
        (m) => (cleanSamagra && m.samagraId && m.samagraId.trim() === cleanSamagra) || (item.id && m.id === item.id)
      );

      if (existingMaster) {
        if (mode === 'UPDATE_EXISTING') {
          // Update master
          setStudentMasters((prev) =>
            prev.map((m) =>
              m.id === existingMaster.id
                ? {
                    ...m,
                    name: item.name || m.name,
                    fatherName: item.fatherName || m.fatherName,
                    motherName: item.motherName || m.motherName,
                    gender: item.gender || m.gender,
                    dob: item.dob || m.dob,
                    category: item.category || m.category,
                    mobile: item.mobile || m.mobile,
                    updatedAt: new Date().toISOString(),
                  }
                : m
            )
          );
          // Update or create enrollment for targetSession
          setStudentAcademicRecords((prev) => {
            const recIdx = prev.findIndex((r) => r.studentId === existingMaster.id && r.sessionId === targetSession);
            if (recIdx >= 0) {
              const next = [...prev];
              next[recIdx] = {
                ...next[recIdx],
                class: item.class || next[recIdx].class,
                section: item.section || next[recIdx].section,
                schoolUdise: cleanUdise,
                updatedAt: new Date().toISOString(),
              };
              return next;
            } else {
              return [
                ...prev,
                {
                  id: `ENR-${targetSession}-${existingMaster.id}`,
                  studentId: existingMaster.id,
                  sessionId: targetSession,
                  schoolUdise: cleanUdise,
                  class: item.class || '1',
                  section: item.section || 'A',
                  rollNumber: '01',
                  admissionNumber: `ADM-${existingMaster.id.slice(-4)}`,
                  enrollmentStatus: 'ACTIVE',
                  createdAt: new Date().toISOString(),
                },
              ];
            }
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        const generatedId = item.id || `STU-${cleanUdise.slice(-4)}-${Date.now().toString().slice(-4)}${idx}`;
        const newMaster: StudentMaster = {
          id: generatedId,
          samagraId: item.samagraId,
          apaarId: item.apaarId,
          apaarStatus: item.apaarStatus,
          panNumber: item.panNumber,
          name: item.name,
          fatherName: item.fatherName,
          motherName: item.motherName,
          gender: item.gender || 'बालक',
          dob: item.dob || '2016-01-01',
          category: item.category || 'GENERAL',
          village: item.village,
          address: item.address,
          mobile: item.mobile,
          isCwsn: item.isCwsn || false,
          createdAt: new Date().toISOString().split('T')[0],
        };
        const newEnrollment: StudentAcademicRecord = {
          id: `ENR-${targetSession}-${generatedId}`,
          studentId: generatedId,
          sessionId: targetSession,
          schoolUdise: cleanUdise,
          class: item.class || '1',
          section: item.section || 'A',
          rollNumber: item.scholarNo || '01',
          admissionNumber: item.srNumber || `ADM-${generatedId.slice(-4)}`,
          srNumber: item.srNumber,
          scholarNo: item.scholarNo,
          enrollmentStatus: 'ACTIVE',
          promotionStatus: 'NEW_ADMISSION',
          createdAt: new Date().toISOString(),
        };
        setStudentMasters((prev) => [newMaster, ...prev]);
        setStudentAcademicRecords((prev) => [newEnrollment, ...prev]);
        added++;
      }
    });

    logActivity('UPLOAD', 'Students', `विद्यार्थी डेटा बैच आयात पूर्ण (सत्र: ${targetSession}): ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportStaff = (items: Staff[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'स्टाफ बल्क अपलोड (bulkImportStaff)');
    const targetSession = selectedSessionId;
    assertSessionModifiable(targetSession, 'bulkImportStaff');

    let added = 0;
    let updated = 0;
    let skipped = 0;

    items.forEach((item, idx) => {
      const cleanEmpCode = (item.employeeCode || item.employeeId || '').trim();
      let cleanUdise = (item.assignedSchoolUdise || '').trim() || schools[0]?.udise || '';

      if (isSchoolUser) {
        if (cleanUdise && cleanUdise !== currentSchoolUdise) {
          logActivity(
            'SECURITY_ALERT',
            'Staff',
            `स्टाफ आयात में अन्य विद्यालय UDISE (${cleanUdise}) पाया गया। इसे अधिकृत UDISE (${currentSchoolUdise}) पर पुनःनिर्देशित किया गया।`
          );
        }
        cleanUdise = currentSchoolUdise;
      }

      const existingMaster = staffMasters.find(
        (m) => (cleanEmpCode && m.employeeCode && m.employeeCode.trim() === cleanEmpCode) || (item.id && m.id === item.id)
      );

      if (existingMaster) {
        if (mode === 'UPDATE_EXISTING') {
          setStaffMasters((prev) =>
            prev.map((m) =>
              m.id === existingMaster.id
                ? {
                    ...m,
                    name: item.name || m.name,
                    gender: item.gender || m.gender,
                    mobile: item.mobile || m.mobile,
                    qualification: item.qualification || m.qualification,
                    updatedAt: new Date().toISOString(),
                  }
                : m
            )
          );
          setStaffPostings((prev) => {
            const pIdx = prev.findIndex((p) => p.staffId === existingMaster.id && p.sessionId === targetSession);
            if (pIdx >= 0) {
              const next = [...prev];
              next[pIdx] = {
                ...next[pIdx],
                designation: item.designation || next[pIdx].designation,
                duty: item.duty || next[pIdx].duty,
                schoolUdise: cleanUdise,
              };
              return next;
            } else {
              return [
                ...prev,
                {
                  id: `PST-${targetSession}-${existingMaster.id}`,
                  staffId: existingMaster.id,
                  sessionId: targetSession,
                  schoolUdise: cleanUdise,
                  designation: item.designation,
                  subject: item.subject || 'सामान्य',
                  joiningDate: item.joiningDate || new Date().toISOString().split('T')[0],
                  assignedClasses: item.assignedClasses || [],
                  duty: item.duty || 'अध्यापन',
                  status: 'ACTIVE',
                },
              ];
            }
          });
          updated++;
        } else {
          skipped++;
        }
      } else {
        const generatedId = item.id || `STF-${cleanUdise.slice(-4)}-${Date.now().toString().slice(-4)}${idx}`;
        const newMaster: StaffMaster = {
          id: generatedId,
          employeeId: item.employeeId || cleanEmpCode || `EMP-${generatedId.slice(-4)}`,
          employeeCode: cleanEmpCode || `EMP-${generatedId.slice(-4)}`,
          uniqueId: item.uniqueId,
          name: item.name,
          gender: item.gender || 'बालक',
          mobile: item.mobile || '',
          dob: item.dob || '1990-01-01',
          category: item.category || 'GENERAL',
          caste: item.caste,
          aadhaarNumber: item.aadhaarNumber,
          voterIdNumber: item.voterIdNumber,
          teacherType: item.teacherType,
          isBlo: item.isBlo,
          isCensus: item.isCensus,
          isOd: item.isOd,
          qualification: item.qualification || 'स्नातक',
          employmentType: item.employmentType,
          createdAt: new Date().toISOString(),
        };
        const newPosting: StaffPosting = {
          id: `PST-${targetSession}-${generatedId}`,
          staffId: generatedId,
          sessionId: targetSession,
          schoolUdise: cleanUdise,
          designation: item.designation,
          subject: item.subject || 'सामान्य',
          joiningDate: item.joiningDate || new Date().toISOString().split('T')[0],
          postingDate: item.postingDate || item.joiningDate || new Date().toISOString().split('T')[0],
          assignedClasses: item.assignedClasses || [],
          duty: item.duty || 'अध्यापन',
          status: 'ACTIVE',
        };
        setStaffMasters((prev) => [newMaster, ...prev]);
        setStaffPostings((prev) => [newPosting, ...prev]);
        added++;
      }
    });

    logActivity('UPLOAD', 'Staff', `स्टाफ डेटा बैच आयात पूर्ण (सत्र: ${targetSession}): ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportFacilities = (items: PhysicalFacility[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'सुविधाएं बल्क अपलोड (bulkImportFacilities)');
    assertSessionModifiable(selectedSessionId, 'bulkImportFacilities');
    let added = 0;
    let updated = 0;
    let skipped = 0;

    setFacilities((prev) => {
      let currentList = [...prev];
      items.forEach((item) => {
        let cleanUdise = item.schoolUdise.trim();
        if (isSchoolUser) {
          if (cleanUdise && cleanUdise !== currentSchoolUdise) {
            logActivity('SECURITY_ALERT', 'PhysicalFacilities', `भौतिक सुविधाएं आयात में अन्य विद्यालय UDISE (${cleanUdise}) पाया गया। इसे अधिकृत UDISE (${currentSchoolUdise}) पर पुनःनिर्देशित किया गया।`);
          }
          cleanUdise = currentSchoolUdise;
        }
        const cleanKey = item.facilityKey.trim();

        const existingIndex = currentList.findIndex(
          (f) => f.schoolUdise.trim() === cleanUdise && f.facilityKey.trim() === cleanKey
        );

        if (existingIndex >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              ...item,
              schoolUdise: cleanUdise,
              facilityKey: cleanKey,
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          currentList.push({
            ...item,
            schoolUdise: cleanUdise,
            facilityKey: cleanKey,
          });
          added++;
        }
      });
      return currentList;
    });

    logActivity('UPLOAD', 'PhysicalFacilities', `भौतिक सुविधाएं बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportAttendance = (items: AttendanceRecord[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'उपस्थिति बल्क अपलोड (bulkImportAttendance)');
    assertSessionModifiable(selectedSessionId, 'bulkImportAttendance');
    let added = 0;
    let updated = 0;
    let skipped = 0;

    setAttendance((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        const cleanDate = item.date.trim();
        let cleanUdise = item.schoolUdise.trim();
        if (isSchoolUser) {
          if (cleanUdise && cleanUdise !== currentSchoolUdise) {
            logActivity('SECURITY_ALERT', 'Attendance', `उपस्थिति आयात में अन्य विद्यालय UDISE (${cleanUdise}) पाया गया। अधिकृत UDISE (${currentSchoolUdise}) पर पुनःनिर्देशित किया गया।`);
          }
          cleanUdise = currentSchoolUdise;
        }
        const cleanType = item.type;
        const cleanClass = item.class || '';

        const existingIndex = currentList.findIndex(
          (a) =>
            a.date === cleanDate &&
            a.schoolUdise === cleanUdise &&
            a.type === cleanType &&
            (a.class || '') === cleanClass
        );

        if (existingIndex >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              ...item,
              schoolUdise: cleanUdise,
              id: currentList[existingIndex].id,
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          const generatedId = item.id || `ATT-${cleanDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}${idx}`;
          currentList.push({
            ...item,
            schoolUdise: cleanUdise,
            id: generatedId,
          });
          added++;
        }
      });
      return currentList;
    });

    logActivity('UPLOAD', 'Attendance', `उपस्थिति डेटा बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportMDM = (items: MDMRecord[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'एमडीएम बल्क अपलोड (bulkImportMDM)');
    assertSessionModifiable(selectedSessionId, 'bulkImportMDM');
    let added = 0;
    let updated = 0;
    let skipped = 0;

    setMdmRecords((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        const cleanDate = item.date.trim();
        let cleanUdise = item.schoolUdise.trim();
        if (isSchoolUser) {
          if (cleanUdise && cleanUdise !== currentSchoolUdise) {
            logActivity('SECURITY_ALERT', 'MDM', `MDM आयात में अन्य विद्यालय UDISE (${cleanUdise}) पाया गया। अधिकृत UDISE (${currentSchoolUdise}) पर पुनःनिर्देशित किया गया।`);
          }
          cleanUdise = currentSchoolUdise;
        }

        const existingIndex = currentList.findIndex(
          (m) => m.date === cleanDate && m.schoolUdise === cleanUdise
        );

        if (existingIndex >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              ...item,
              schoolUdise: cleanUdise,
              id: currentList[existingIndex].id,
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          const generatedId = item.id || `MDM-${cleanDate.replace(/-/g, '')}-${Date.now().toString().slice(-4)}${idx}`;
          currentList.push({
            ...item,
            schoolUdise: cleanUdise,
            id: generatedId,
          });
          added++;
        }
      });
      return currentList;
    });

    logActivity('UPLOAD', 'MDM', `मध्याह्न भोजन (MDM) डेटा बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportComplaints = (items: Complaint[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'शिकायत बल्क अपलोड (bulkImportComplaints)');
    let added = 0;
    let updated = 0;
    let skipped = 0;

    setComplaints((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        const cleanCmpId = item.complaintId?.trim();
        let cleanUdise = item.schoolUdise?.trim();
        if (isSchoolUser) {
          if (cleanUdise && cleanUdise !== currentSchoolUdise) {
            logActivity('SECURITY_ALERT', 'Complaints', `शिकायत आयात में अन्य विद्यालय UDISE (${cleanUdise}) पाया गया। अधिकृत UDISE (${currentSchoolUdise}) पर पुनःनिर्देशित किया गया।`);
          }
          cleanUdise = currentSchoolUdise;
        }

        const existingIndex = currentList.findIndex(
          (c) => cleanCmpId && c.complaintId && c.complaintId.trim() === cleanCmpId
        );

        if (existingIndex >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              ...item,
              schoolUdise: cleanUdise,
              id: currentList[existingIndex].id,
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          const generatedId = item.id || `CMP-${Date.now().toString().slice(-5)}${idx}`;
          const generatedCmpId = cleanCmpId || `COMP-2026-${Date.now().toString().slice(-4)}${idx}`;
          currentList.push({
            ...item,
            schoolUdise: cleanUdise,
            id: generatedId,
            complaintId: generatedCmpId,
          });
          added++;
        }
      });
      return currentList;
    });

    logActivity('UPLOAD', 'Complaints', `शिकायत निवारण डेटा बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportGovernmentWork = (items: GovernmentWork[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'शासकीय कार्य बल्क अपलोड (bulkImportGovernmentWork)');
    assertSessionModifiable(selectedSessionId, 'bulkImportGovernmentWork');
    let added = 0;
    let updated = 0;
    let skipped = 0;

    setGovernmentWork((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        const cleanOrder = item.orderNumber?.trim();
        let cleanUdise = item.schoolUdise?.trim();
        if (isSchoolUser) {
          if (cleanUdise && cleanUdise !== currentSchoolUdise) {
            logActivity('SECURITY_ALERT', 'GovernmentWork', `शासकीय कार्य आयात में अन्य विद्यालय UDISE (${cleanUdise}) पाया गया। अधिकृत UDISE (${currentSchoolUdise}) पर पुनःनिर्देशित किया गया।`);
          }
          cleanUdise = currentSchoolUdise;
        }
        const cleanName = item.workName?.trim();

        const existingIndex = currentList.findIndex((w) => {
          if (cleanOrder && cleanUdise && w.orderNumber?.trim() === cleanOrder && w.schoolUdise?.trim() === cleanUdise) return true;
          if (cleanName && cleanUdise && w.workName?.trim() === cleanName && w.schoolUdise?.trim() === cleanUdise) return true;
          if (item.id && w.id === item.id) return true;
          return false;
        });

        if (existingIndex >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            currentList[existingIndex] = {
              ...currentList[existingIndex],
              ...item,
              schoolUdise: cleanUdise,
              id: currentList[existingIndex].id,
            };
            updated++;
          } else {
            skipped++;
          }
        } else {
          const generatedId = item.id || `GW-${Date.now().toString().slice(-5)}${idx}`;
          currentList.push({
            ...item,
            schoolUdise: cleanUdise,
            id: generatedId,
          });
          added++;
        }
      });
      return currentList;
    });

    logActivity('UPLOAD', 'GovernmentWork', `शासकीय कार्य डेटा बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    assertFeatureEnabled('module.settings', 'सामान्य सेटिंग्स सहेजना (updateSettings)');
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      logActivity('UPDATE', 'Settings', 'संकुल एवं सिस्टम सेटिंग्स अद्यतन की गई।');
      return next;
    });
  };

  // ----------------------------------------------------
  // Navbharat Literacy Module CRUD Handlers
  // ----------------------------------------------------
  const saveLiteracyRegister = (regData: Omit<LiteracyRegister, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    assertFeatureEnabled('module.literacy-register.action.edit', 'साक्षरता पंजी प्रबंधन (saveLiteracyRegister)');
    const targetUdise = isSchoolUser ? currentSchoolUdise : (regData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    assertSchoolAccess(targetUdise, 'saveLiteracyRegister');

    const targetSessionId = regData.sessionId || regData.academicYear || selectedSessionId;
    assertSessionModifiable(targetSessionId, 'saveLiteracyRegister');

    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const now = new Date().toISOString();

    setLiteracyRegisters((prev) => {
      const existingIdx = prev.findIndex((r) =>
        (regData.id && r.id === regData.id) ||
        (!regData.id && r.schoolUdise === targetUdise && (r.sessionId === targetSessionId || r.academicYear === targetSessionId))
      );

      let updatedList: LiteracyRegister[];
      let savedRecord: LiteracyRegister;
      if (existingIdx >= 0) {
        const updatedReg: LiteracyRegister = {
          ...prev[existingIdx],
          ...regData,
          sessionId: targetSessionId,
          academicYear: targetSessionId,
          schoolUdise: targetUdise,
          schoolName: schoolObj?.name || regData.schoolName || prev[existingIdx].schoolName,
          updatedAt: now,
        };
        savedRecord = updatedReg;
        updatedList = [...prev];
        updatedList[existingIdx] = updatedReg;
        logActivity('UPDATE', 'Literacy', `साक्षरता पंजी अद्यतन: ${updatedReg.schoolName} (${targetUdise}) [सत्र: ${targetSessionId}]`, {
          recordId: updatedReg.id,
          recordName: updatedReg.schoolName,
          schoolUdise: targetUdise,
          newValue: updatedReg,
        });
      } else {
        const newReg: LiteracyRegister = {
          ...regData,
          id: regData.id || `LIT-REG-${targetUdise.slice(-4)}-${Date.now().toString().slice(-4)}`,
          sessionId: targetSessionId,
          academicYear: targetSessionId,
          schoolUdise: targetUdise,
          schoolName: schoolObj?.name || regData.schoolName || 'शासकीय प्राथमिक शाला',
          createdAt: now,
          updatedAt: now,
        };
        savedRecord = newReg;
        updatedList = [newReg, ...prev];
        logActivity('CREATE', 'Literacy', `नई साक्षरता पंजी दर्ज: ${newReg.schoolName} (${targetUdise}) [सत्र: ${targetSessionId}]`, {
          recordId: newReg.id,
          recordName: newReg.schoolName,
          schoolUdise: targetUdise,
          newValue: newReg,
        });
      }

      // Cloud Database Persistence
      syncLiteracyRegisterToCloud(savedRecord).catch((e) => console.warn('Cloud sync literacy register error:', e));

      try {
        safeSetJSON('jsk_literacy_registers', updatedList);
      } catch (e) {
        console.error('Failed to persist save to jsk_literacy_registers', e);
      }
      return updatedList;
    });
  };

  const deleteLiteracyRegister = (id: string) => {
    assertFeatureEnabled('module.literacy-register.action.delete', 'साक्षरता पंजी हटाना (deleteLiteracyRegister)');
    const reg = literacyRegisters.find((r) => r.id === id);
    if (!reg) return;

    assertSchoolAccess(reg.schoolUdise, 'deleteLiteracyRegister');
    const targetSessionId = reg.sessionId || reg.academicYear || selectedSessionId;
    assertSessionModifiable(targetSessionId, 'deleteLiteracyRegister');

    setLiteracyRegisters((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      try {
        safeSetJSON('jsk_literacy_registers', updated);
      } catch (e) {
        console.error('Failed to persist delete to jsk_literacy_registers', e);
      }
      return updated;
    });

    // Cloud Database Persistence
    deleteLiteracyRegisterFromCloud(id).catch((e) => console.warn('Cloud delete literacy register error:', e));

    logActivity('DELETE', 'Literacy', `साक्षरता पंजी हटाई गई: ${reg.schoolName} (${reg.schoolUdise}) [सत्र: ${targetSessionId}]`, {
      recordId: reg.id,
      recordName: reg.schoolName,
      schoolUdise: reg.schoolUdise,
    });
  };

  const addIlliteratePerson = (personData: Omit<IlliteratePerson, 'id' | 'createdAt' | 'updatedAt'>) => {
    assertFeatureEnabled('module.literacy-learners.action.add', 'असाक्षर शिक्षार्थी जोड़ना (addIlliteratePerson)');
    const targetUdise = isSchoolUser ? currentSchoolUdise : (personData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    if (isSchoolUser && personData.schoolUdise) {
      assertSchoolAccess(personData.schoolUdise, 'addIlliteratePerson');
    }
    const targetSessionId = personData.sessionId || personData.academicYear || selectedSessionId;
    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const now = new Date().toISOString();
    const newPerson: IlliteratePerson = {
      ...personData,
      id: `ILLIT-${targetUdise.slice(-4)}-${Date.now().toString().slice(-4)}`,
      sessionId: targetSessionId,
      academicYear: targetSessionId,
      schoolUdise: targetUdise,
      schoolName: schoolObj?.name || personData.schoolName || 'शासकीय प्राथमिक शाला',
      createdAt: now,
      updatedAt: now,
    };
    setIlliteratePersons((prev) => [newPerson, ...prev]);

    // Cloud Database Persistence
    syncIlliteratePersonToCloud(newPerson).catch((e) => console.warn('Cloud sync illiterate person error:', e));

    logActivity('CREATE', 'Literacy', `असाक्षर व्यक्ति पंजीकृत: ${newPerson.name} (${newPerson.gender}, ${newPerson.age} वर्ष)`, {
      recordId: newPerson.id,
      recordName: newPerson.name,
      schoolUdise: newPerson.schoolUdise,
      newValue: newPerson,
    });
  };

  const updateIlliteratePerson = (person: IlliteratePerson) => {
    assertFeatureEnabled('module.literacy-learners.action.edit', 'असाक्षर शिक्षार्थी सुधारना (updateIlliteratePerson)');
    const old = illiteratePersons.find((p) => p.id === person.id);
    if (old) {
      assertSchoolAccess(old.schoolUdise, 'updateIlliteratePerson:old');
    }
    if (isSchoolUser && person.schoolUdise && person.schoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(person.schoolUdise, 'updateIlliteratePerson:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : person.schoolUdise;
    const targetSessionId = person.sessionId || person.academicYear || old?.sessionId || selectedSessionId;
    const now = new Date().toISOString();
    const sanitizedPerson: IlliteratePerson = {
      ...person,
      sessionId: targetSessionId,
      academicYear: targetSessionId,
      schoolUdise: targetUdise,
      updatedAt: now,
    };
    setIlliteratePersons((prev) => prev.map((p) => (p.id === sanitizedPerson.id ? sanitizedPerson : p)));

    // Cloud Database Persistence
    syncIlliteratePersonToCloud(sanitizedPerson).catch((e) => console.warn('Cloud sync update illiterate person error:', e));

    logActivity('UPDATE', 'Literacy', `असाक्षर व्यक्ति विवरण अद्यतन: ${sanitizedPerson.name}`, {
      recordId: sanitizedPerson.id,
      recordName: sanitizedPerson.name,
      schoolUdise: sanitizedPerson.schoolUdise,
      newValue: sanitizedPerson,
    });
  };

  const deleteIlliteratePerson = (id: string) => {
    assertFeatureEnabled('module.literacy-learners.action.delete', 'असाक्षर शिक्षार्थी हटाना (deleteIlliteratePerson)');
    const target = illiteratePersons.find((p) => p.id === id);
    if (!target) return;
    if (isSchoolUser) {
      assertSchoolAccess(target.schoolUdise, 'deleteIlliteratePerson');
    }
    setIlliteratePersons((prev) => prev.filter((p) => p.id !== id));

    // Cloud Database Persistence
    deleteIlliteratePersonFromCloud(id).catch((e) => console.warn('Cloud delete illiterate person error:', e));

    logActivity('DELETE', 'Literacy', `असाक्षर व्यक्ति हटाया गया: ${target.name}`, {
      recordId: id,
      recordName: target.name,
      schoolUdise: target.schoolUdise,
      oldValue: target,
    });
  };

  const addAksharSathi = (volunteerData: Omit<AksharSathi, 'id' | 'createdAt' | 'updatedAt'>) => {
    assertFeatureEnabled('module.literacy-volunteers.action.add', 'अक्षर साथी जोड़ना (addAksharSathi)');
    const targetUdise = isSchoolUser ? currentSchoolUdise : (volunteerData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    if (isSchoolUser && volunteerData.schoolUdise) {
      assertSchoolAccess(volunteerData.schoolUdise, 'addAksharSathi');
    }
    const targetSessionId = volunteerData.sessionId || volunteerData.academicYear || selectedSessionId;
    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const now = new Date().toISOString();
    const newVolunteer: AksharSathi = {
      ...volunteerData,
      id: `VOL-${targetUdise.slice(-4)}-${Date.now().toString().slice(-4)}`,
      sessionId: targetSessionId,
      academicYear: targetSessionId,
      schoolUdise: targetUdise,
      schoolName: schoolObj?.name || volunteerData.schoolName || 'शासकीय प्राथमिक शाला',
      createdAt: now,
      updatedAt: now,
    };
    setAksharSathis((prev) => [newVolunteer, ...prev]);

    // Cloud Database Persistence
    syncAksharSathiToCloud(newVolunteer).catch((e) => console.warn('Cloud sync akshar sathi error:', e));

    logActivity('CREATE', 'Literacy', `अक्षर साथी पंजीकृत: ${newVolunteer.name} (मो: ${newVolunteer.mobileNumber})`, {
      recordId: newVolunteer.id,
      recordName: newVolunteer.name,
      schoolUdise: newVolunteer.schoolUdise,
      newValue: newVolunteer,
    });
  };

  const updateAksharSathi = (volunteer: AksharSathi) => {
    assertFeatureEnabled('module.literacy-volunteers.action.edit', 'अक्षर साथी विवरण संपादन (updateAksharSathi)');
    const old = aksharSathis.find((v) => v.id === volunteer.id);
    if (old) {
      assertSchoolAccess(old.schoolUdise, 'updateAksharSathi:old');
    }
    if (isSchoolUser && volunteer.schoolUdise && volunteer.schoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(volunteer.schoolUdise, 'updateAksharSathi:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : volunteer.schoolUdise;
    const targetSessionId = volunteer.sessionId || volunteer.academicYear || old?.sessionId || selectedSessionId;
    const now = new Date().toISOString();
    const sanitizedVolunteer: AksharSathi = {
      ...volunteer,
      sessionId: targetSessionId,
      academicYear: targetSessionId,
      schoolUdise: targetUdise,
      updatedAt: now,
    };
    setAksharSathis((prev) => prev.map((v) => (v.id === sanitizedVolunteer.id ? sanitizedVolunteer : v)));

    // Cloud Database Persistence
    syncAksharSathiToCloud(sanitizedVolunteer).catch((e) => console.warn('Cloud sync update akshar sathi error:', e));

    logActivity('UPDATE', 'Literacy', `अक्षर साथी विवरण अद्यतन: ${sanitizedVolunteer.name}`, {
      recordId: sanitizedVolunteer.id,
      recordName: sanitizedVolunteer.name,
      schoolUdise: sanitizedVolunteer.schoolUdise,
      newValue: sanitizedVolunteer,
    });
  };

  const deleteAksharSathi = (id: string) => {
    assertFeatureEnabled('module.literacy-volunteers.action.delete', 'अक्षर साथी हटाना (deleteAksharSathi)');
    const target = aksharSathis.find((v) => v.id === id);
    if (!target) return;
    if (isSchoolUser) {
      assertSchoolAccess(target.schoolUdise, 'deleteAksharSathi');
    }
    setAksharSathis((prev) => prev.filter((v) => v.id !== id));

    // Cloud Database Persistence
    deleteAksharSathiFromCloud(id).catch((e) => console.warn('Cloud delete akshar sathi error:', e));

    logActivity('DELETE', 'Literacy', `अक्षर साथी रिकॉर्ड हटाया गया: ${target.name}`, {
      recordId: id,
      recordName: target.name,
      schoolUdise: target.schoolUdise,
      oldValue: target,
    });
  };

  const addExamCycle = (cycleData: Omit<ExamCycle, 'id' | 'createdAt' | 'updatedAt'>) => {
    assertFeatureEnabled('module.literacy-exams.action.add_edit', 'साक्षरता परीक्षा साइकिल जोड़ना (addExamCycle)');
    const now = new Date().toISOString();
    const newCycle: ExamCycle = {
      ...cycleData,
      id: `EXAM-CYCLE-${Date.now().toString().slice(-5)}`,
      createdAt: now,
      updatedAt: now,
    };
    setExamCycles((prev) => [...prev, newCycle]);

    // Cloud Database Persistence
    syncExamCycleToCloud(newCycle).catch((e) => console.warn('Cloud sync exam cycle error:', e));

    logActivity('CREATE', 'Literacy', `नई परीक्षा सत्र/साइकिल जोड़ी गई: ${newCycle.examName} (${newCycle.examDate})`, {
      recordId: newCycle.id,
      recordName: newCycle.examName,
      newValue: newCycle,
    });
  };

  const saveLiteracyExamResult = (resultData: Omit<LiteracyExamResult, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    assertFeatureEnabled('module.literacy-exams.action.add_edit', 'साक्षरता परीक्षा परिणाम प्रबंधन (saveLiteracyExamResult)');
    const targetUdise = isSchoolUser ? currentSchoolUdise : (resultData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    assertSchoolAccess(targetUdise, 'saveLiteracyExamResult');

    const targetSessionId = resultData.sessionId || resultData.academicYear || selectedSessionId;
    assertSessionModifiable(targetSessionId, 'saveLiteracyExamResult');

    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const now = new Date().toISOString();

    const fCount = Math.max(0, Number(resultData.femaleLearners ?? resultData.femaleCount) || 0);
    const mCount = Math.max(0, Number(resultData.maleLearners ?? resultData.maleCount) || 0);
    const totCount = fCount + mCount;
    const passCount = Math.max(0, Number(resultData.passedLearners ?? resultData.passedCount) || 0);
    const failCount = Math.max(0, Number(resultData.failedLearners ?? resultData.failedCount) || 0);

    if (passCount + failCount > totCount) {
      throw new Error(`उत्तीर्ण (${passCount}) + अनुत्तीर्ण (${failCount}) की संख्या कुल शिक्षार्थियों (${totCount}) से अधिक नहीं हो सकती।`);
    }

    const remCount = Math.max(0, totCount - passCount - failCount);
    const partCount = Number(resultData.participatedLearners ?? resultData.participatedCount) || (passCount + failCount);
    const successRate = totCount > 0 ? Number(((passCount / totCount) * 100).toFixed(1)) : 0;

    const cycleId = resultData.cycleId || resultData.examCycleId || '';
    const masterCycle = findExamCycleMaster(cycleId) || findExamCycleMaster(resultData.examName);
    const cycleName = resultData.cycleName || resultData.examCycleName || masterCycle?.cycleName || masterCycle?.examName || resultData.examName || '';
    const examName = resultData.examName || masterCycle?.examName || cycleName;
    const examDate = resultData.examDate || masterCycle?.examDate || '';

    setLiteracyExamResults((prev) => {
      const existingIdx = prev.findIndex(
        (r) => (resultData.id && r.id === resultData.id) ||
               (r.sessionId === targetSessionId && r.schoolUdise === targetUdise && (r.examCycleId === cycleId || r.cycleId === cycleId))
      );
      if (existingIdx >= 0) {
        const oldRecord = prev[existingIdx];
        const updated: LiteracyExamResult = {
          ...oldRecord,
          ...resultData,
          id: oldRecord.id,
          sessionId: targetSessionId,
          academicYear: targetSessionId,
          schoolUdise: targetUdise,
          schoolId: targetUdise,
          schoolName: schoolObj?.name || oldRecord.schoolName || resultData.schoolName || '',
          examCycleId: cycleId,
          cycleId: cycleId,
          examCycleName: cycleName,
          cycleName: cycleName,
          examName: examName,
          examDate: examDate,
          femaleLearners: fCount,
          femaleCount: fCount,
          maleLearners: mCount,
          maleCount: mCount,
          totalLearners: totCount,
          totalCount: totCount,
          participatedLearners: partCount,
          participatedCount: partCount,
          passedLearners: passCount,
          passedCount: passCount,
          failedLearners: failCount,
          failedCount: failCount,
          remainingIlliterateLearners: remCount,
          remainingCount: remCount,
          successRate: successRate,
          remarks: resultData.remarks || oldRecord.remarks || '',
          updatedAt: now,
          updatedBy: currentUser?.name || 'User',
        };
        const updatedList = [...prev];
        updatedList[existingIdx] = updated;

        // Cloud Database Persistence
        syncLiteracyExamResultToCloud(updated).catch((e) => console.warn('Cloud sync update literacy exam result error:', e));

        logActivity('LITERACY_EXAM_RESULT_UPDATED' as AuditAction, 'Literacy', `साक्षरता परीक्षा परिणाम संकलन अद्यतन: ${updated.schoolName} - ${updated.examName}`, {
          recordId: updated.id,
          recordName: updated.examName,
          schoolUdise: targetUdise,
          session: targetSessionId,
          oldValue: oldRecord,
          newValue: updated,
        });
        return updatedList;
      } else {
        const newResult: LiteracyExamResult = {
          ...resultData,
          id: resultData.id || `RES-${targetUdise}-${cycleId || Date.now().toString().slice(-4)}`,
          sessionId: targetSessionId,
          academicYear: targetSessionId,
          schoolUdise: targetUdise,
          schoolId: targetUdise,
          schoolName: schoolObj?.name || resultData.schoolName || 'शासकीय प्राथमिक शाला',
          examCycleId: cycleId,
          cycleId: cycleId,
          examCycleName: cycleName,
          cycleName: cycleName,
          examName: examName,
          examDate: examDate,
          femaleLearners: fCount,
          femaleCount: fCount,
          maleLearners: mCount,
          maleCount: mCount,
          totalLearners: totCount,
          totalCount: totCount,
          participatedLearners: partCount,
          participatedCount: partCount,
          passedLearners: passCount,
          passedCount: passCount,
          failedLearners: failCount,
          failedCount: failCount,
          remainingIlliterateLearners: remCount,
          remainingCount: remCount,
          successRate: successRate,
          remarks: resultData.remarks || '',
          createdAt: now,
          updatedAt: now,
          createdBy: currentUser?.name || 'User',
          updatedBy: currentUser?.name || 'User',
        };

        // Cloud Database Persistence
        syncLiteracyExamResultToCloud(newResult).catch((e) => console.warn('Cloud sync new literacy exam result error:', e));

        logActivity('LITERACY_EXAM_RESULT_CREATED' as AuditAction, 'Literacy', `साक्षरता परीक्षा परिणाम संकलन दर्ज: ${newResult.schoolName} - ${newResult.examName}`, {
          recordId: newResult.id,
          recordName: newResult.examName,
          schoolUdise: targetUdise,
          session: targetSessionId,
          newValue: newResult,
        });
        return [newResult, ...prev];
      }
    });
  };

  const deleteLiteracyExamResult = (id: string) => {
    assertFeatureEnabled('module.literacy-exams.action.delete', 'साक्षरता परीक्षा परिणाम हटाना (deleteLiteracyExamResult)');
    const target = literacyExamResults.find((r) => r.id === id);
    if (!target) return;
    
    assertSchoolAccess(target.schoolUdise, 'deleteLiteracyExamResult');
    const recSession = target.sessionId || target.academicYear || selectedSessionId;
    assertSessionModifiable(recSession, 'deleteLiteracyExamResult');

    setLiteracyExamResults((prev) => prev.filter((r) => r.id !== id));

    // Cloud Database Persistence
    deleteLiteracyExamResultFromCloud(id).catch((e) => console.warn('Cloud delete literacy exam result error:', e));

    logActivity('LITERACY_EXAM_RESULT_DELETED' as AuditAction, 'Literacy', `साक्षरता परीक्षा परिणाम हटाया गया: ${target.schoolName} - ${target.examName}`, {
      recordId: id,
      recordName: target.examName,
      schoolUdise: target.schoolUdise,
      session: recSession,
      oldValue: target,
    });
  };

  const addSupportingInstitution = (partnerData: Omit<SupportingInstitution, 'id' | 'createdAt' | 'updatedAt'>) => {
    assertFeatureEnabled('module.literacy-partners.action.add', 'सहयोगी संस्था जोड़ना (addSupportingInstitution)');
    const targetUdise = isSchoolUser ? currentSchoolUdise : (partnerData.schoolUdise || selectedSchoolUdise || schools[0]?.udise || '');
    if (isSchoolUser && partnerData.schoolUdise) {
      assertSchoolAccess(partnerData.schoolUdise, 'addSupportingInstitution');
    }
    const targetSessionId = partnerData.sessionId || partnerData.academicYear || selectedSessionId;
    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const now = new Date().toISOString();
    const newPartner: SupportingInstitution = {
      ...partnerData,
      id: `PART-${targetUdise.slice(-4)}-${Date.now().toString().slice(-4)}`,
      sessionId: targetSessionId,
      academicYear: targetSessionId,
      schoolUdise: targetUdise,
      schoolName: schoolObj?.name || partnerData.schoolName || 'शासकीय प्राथमिक शाला',
      createdAt: now,
      updatedAt: now,
    };
    setSupportingInstitutions((prev) => [newPartner, ...prev]);

    // Cloud Database Persistence
    syncSupportingInstitutionToCloud(newPartner).catch((e) => console.warn('Cloud sync supporting institution error:', e));

    logActivity('CREATE', 'Literacy', `सहयोगी संस्था / विभाग जोड़ा गया: ${newPartner.institutionName} (${newPartner.contactPersonName})`, {
      recordId: newPartner.id,
      recordName: newPartner.institutionName,
      schoolUdise: newPartner.schoolUdise,
      newValue: newPartner,
    });
  };

  const updateSupportingInstitution = (partner: SupportingInstitution) => {
    assertFeatureEnabled('module.literacy-partners.action.edit', 'सहयोगी संस्था विवरण सुधारना (updateSupportingInstitution)');
    const old = supportingInstitutions.find((p) => p.id === partner.id);
    if (old) {
      assertSchoolAccess(old.schoolUdise, 'updateSupportingInstitution:old');
    }
    if (isSchoolUser && partner.schoolUdise && partner.schoolUdise !== currentSchoolUdise) {
      assertSchoolAccess(partner.schoolUdise, 'updateSupportingInstitution:new');
    }
    const targetUdise = isSchoolUser ? currentSchoolUdise : partner.schoolUdise;
    const targetSessionId = partner.sessionId || partner.academicYear || old?.sessionId || selectedSessionId;
    const now = new Date().toISOString();
    const sanitizedPartner: SupportingInstitution = {
      ...partner,
      sessionId: targetSessionId,
      academicYear: targetSessionId,
      schoolUdise: targetUdise,
      updatedAt: now,
    };
    setSupportingInstitutions((prev) => prev.map((p) => (p.id === sanitizedPartner.id ? sanitizedPartner : p)));

    // Cloud Database Persistence
    syncSupportingInstitutionToCloud(sanitizedPartner).catch((e) => console.warn('Cloud sync update supporting institution error:', e));

    logActivity('UPDATE', 'Literacy', `सहयोगी संस्था विवरण अद्यतन: ${sanitizedPartner.institutionName}`, {
      recordId: sanitizedPartner.id,
      recordName: sanitizedPartner.institutionName,
      schoolUdise: sanitizedPartner.schoolUdise,
      newValue: sanitizedPartner,
    });
  };

  const deleteSupportingInstitution = (id: string) => {
    assertFeatureEnabled('module.literacy-partners.action.delete', 'सहयोगी संस्था हटाना (deleteSupportingInstitution)');
    const target = supportingInstitutions.find((p) => p.id === id);
    if (!target) return;
    if (isSchoolUser) {
      assertSchoolAccess(target.schoolUdise, 'deleteSupportingInstitution');
    }
    setSupportingInstitutions((prev) => prev.filter((p) => p.id !== id));

    // Cloud Database Persistence
    deleteSupportingInstitutionFromCloud(id).catch((e) => console.warn('Cloud delete supporting institution error:', e));

    logActivity('DELETE', 'Literacy', `सहयोगी संस्था हटाई गई: ${target.institutionName}`, {
      recordId: id,
      recordName: target.institutionName,
      schoolUdise: target.schoolUdise,
      oldValue: target,
    });
  };

  const bulkImportLiteracyLearners = (items: Partial<IlliteratePerson>[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'असाक्षर शिक्षार्थी बल्क अपलोड (bulkImportLiteracyLearners)');
    assertFeatureEnabled('module.literacy-learners.action.add', 'असाक्षर शिक्षार्थी जोड़ना (bulkImportLiteracyLearners)');
    let added = 0;
    let updated = 0;
    let skipped = 0;
    setIlliteratePersons((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        const cleanName = item.name?.trim();
        const cleanSamagra = item.samagraId?.trim();
        const cleanMobile = item.mobileNumber?.trim();
        let cleanUdise = item.schoolUdise?.trim() || schools[0]?.udise || '';
        if (isSchoolUser) {
          if (cleanUdise && cleanUdise !== currentSchoolUdise) {
            logActivity('SECURITY_ALERT', 'Literacy', `असाक्षर व्यक्ति आयात में अन्य विद्यालय UDISE (${cleanUdise}) अधिकृत (${currentSchoolUdise}) पर पुनःनिर्देशित।`);
          }
          cleanUdise = currentSchoolUdise;
        }

        const existingIdx = currentList.findIndex((p) => {
          if (cleanSamagra && p.samagraId && p.samagraId.trim() === cleanSamagra) return true;
          if (cleanName && cleanMobile && p.name.trim() === cleanName && p.mobileNumber.trim() === cleanMobile) return true;
          return false;
        });

        if (existingIdx >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            const updatedRecord = { ...currentList[existingIdx], ...(item as any), updatedAt: new Date().toISOString() };
            currentList[existingIdx] = updatedRecord;
            syncIlliteratePersonToCloud(updatedRecord).catch((e) => console.warn('Cloud sync bulk update learner error:', e));
            updated++;
          } else {
            skipped++;
          }
        } else {
          const newLearner: IlliteratePerson = {
            id: item.id || `ILLIT-${cleanUdise.slice(-4)}-${Date.now().toString().slice(-4)}${idx}`,
            sessionId: item.sessionId || item.academicYear || selectedSessionId,
            academicYear: item.academicYear || item.sessionId || selectedSessionId,
            schoolUdise: cleanUdise,
            schoolName: item.schoolName || schools.find(s => s.udise === cleanUdise)?.name || 'शासकीय प्राथमिक शाला',
            name: item.name || 'असाक्षर व्यक्ति',
            fatherOrHusbandName: item.fatherOrHusbandName || '',
            motherName: item.motherName || '',
            maritalStatus: item.maritalStatus || 'विवाहित',
            dob: item.dob || '',
            age: Number(item.age) || 0,
            gender: item.gender || 'महिला',
            category: item.category || 'OBC',
            disability: item.disability || 'लागू नहीं',
            mobileNumber: item.mobileNumber || '',
            samagraId: item.samagraId || '',
            aadhaarNumber: item.aadhaarNumber || '',
            address: item.address || '',
            isRegistered: item.isRegistered !== undefined ? item.isRegistered : true,
            assignedAksharSathiName: item.assignedAksharSathiName || '',
            isExamParticipated: item.isExamParticipated || false,
            examResult: item.examResult || 'परीक्षा में सम्मिलित नहीं',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          currentList.push(newLearner);
          syncIlliteratePersonToCloud(newLearner).catch((e) => console.warn('Cloud sync bulk add learner error:', e));
          added++;
        }
      });
      return currentList;
    });
    logActivity('UPLOAD', 'Literacy', `असाक्षर व्यक्ति बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportAksharSathis = (items: Partial<AksharSathi>[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'अक्षर साथी बल्क अपलोड (bulkImportAksharSathis)');
    assertFeatureEnabled('module.literacy-volunteers.action.add', 'अक्षर साथी जोड़ना (bulkImportAksharSathis)');
    let added = 0;
    let updated = 0;
    let skipped = 0;
    setAksharSathis((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        const cleanName = item.name?.trim();
        const cleanMobile = item.mobileNumber?.trim();
        let cleanUdise = item.schoolUdise?.trim() || schools[0]?.udise || '';
        if (isSchoolUser) {
          if (cleanUdise && cleanUdise !== currentSchoolUdise) {
            logActivity('SECURITY_ALERT', 'Literacy', `अक्षर साथी आयात में अन्य विद्यालय UDISE (${cleanUdise}) अधिकृत (${currentSchoolUdise}) पर पुनःनिर्देशित।`);
          }
          cleanUdise = currentSchoolUdise;
        }

        const existingIdx = currentList.findIndex((v) => {
          if (cleanMobile && v.mobileNumber && v.mobileNumber.trim() === cleanMobile) return true;
          if (cleanName && v.name.trim() === cleanName && v.schoolUdise === cleanUdise) return true;
          return false;
        });

        if (existingIdx >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            const updatedRecord = { ...currentList[existingIdx], ...(item as any), updatedAt: new Date().toISOString() };
            currentList[existingIdx] = updatedRecord;
            syncAksharSathiToCloud(updatedRecord).catch((e) => console.warn('Cloud sync bulk update volunteer error:', e));
            updated++;
          } else {
            skipped++;
          }
        } else {
          const newVol: AksharSathi = {
            id: item.id || `VOL-${cleanUdise.slice(-4)}-${Date.now().toString().slice(-4)}${idx}`,
            sessionId: item.sessionId || item.academicYear || selectedSessionId,
            academicYear: item.academicYear || item.sessionId || selectedSessionId,
            schoolUdise: cleanUdise,
            schoolName: item.schoolName || schools.find(s => s.udise === cleanUdise)?.name || 'शासकीय प्राथमिक शाला',
            name: item.name || 'अक्षर साथी',
            fatherOrHusbandName: item.fatherOrHusbandName || '',
            mobileNumber: item.mobileNumber || '',
            dob: item.dob || '',
            age: Number(item.age) || 0,
            educationalQualification: item.educationalQualification || '12वीं',
            institutionName: item.institutionName || 'शासकीय विद्यालय',
            teachingPlace: item.teachingPlace || 'विद्यालय भवन',
            mappedLearnerCount: Number(item.mappedLearnerCount) || 0,
            examParticipatedLearnerCount: Number(item.examParticipatedLearnerCount) || 0,
            passedLearnerCount: Number(item.passedLearnerCount) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          currentList.push(newVol);
          syncAksharSathiToCloud(newVol).catch((e) => console.warn('Cloud sync bulk add volunteer error:', e));
          added++;
        }
      });
      return currentList;
    });
    logActivity('UPLOAD', 'Literacy', `अक्षर साथी बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportExamResults = (items: Partial<LiteracyExamResult>[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'परीक्षा परिणाम बल्क अपलोड (bulkImportExamResults)');
    assertFeatureEnabled('module.literacy-exams.action.add_edit', 'साक्षरता परीक्षा परिणाम प्रबंधन (bulkImportExamResults)');
    let added = 0;
    let updated = 0;
    let skipped = 0;
    setLiteracyExamResults((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        let cleanUdise = item.schoolUdise?.trim() || schools[0]?.udise || '';
        if (isSchoolUser) {
          cleanUdise = currentSchoolUdise;
        }
        const cycleId = item.examCycleId || 'CYCLE-2023-MAR19';

        const existingIdx = currentList.findIndex((r) => r.schoolUdise === cleanUdise && r.examCycleId === cycleId);
        if (existingIdx >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            const updatedRecord = { ...currentList[existingIdx], ...(item as any), updatedAt: new Date().toISOString() };
            currentList[existingIdx] = updatedRecord;
            syncLiteracyExamResultToCloud(updatedRecord).catch((e) => console.warn('Cloud sync bulk update exam result error:', e));
            updated++;
          } else {
            skipped++;
          }
        } else {
          const newRes: LiteracyExamResult = {
            id: item.id || `EXAM-RES-${cleanUdise.slice(-4)}-${Date.now().toString().slice(-4)}${idx}`,
            sessionId: item.sessionId || item.academicYear || selectedSessionId,
            academicYear: item.academicYear || item.sessionId || selectedSessionId,
            schoolUdise: cleanUdise,
            schoolName: item.schoolName || schools.find(s => s.udise === cleanUdise)?.name || 'शासकीय प्राथमिक शाला',
            examCycleId: cycleId,
            examName: item.examName || '19 मार्च परीक्षा 2023',
            examDate: item.examDate || '19/03/2023',
            femaleLearners: Number(item.femaleLearners) || 0,
            maleLearners: Number(item.maleLearners) || 0,
            totalLearners: Number(item.totalLearners) || (Number(item.femaleLearners) || 0) + (Number(item.maleLearners) || 0),
            participatedLearners: Number(item.participatedLearners) || 0,
            passedLearners: Number(item.passedLearners) || 0,
            failedLearners: Number(item.failedLearners) || 0,
            remainingIlliterateLearners: Number(item.remainingIlliterateLearners) || 0,
            remarks: item.remarks || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          currentList.push(newRes);
          syncLiteracyExamResultToCloud(newRes).catch((e) => console.warn('Cloud sync bulk add exam result error:', e));
          added++;
        }
      });
      return currentList;
    });
    logActivity('UPLOAD', 'Literacy', `परीक्षा परिणाम संकलन बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const bulkImportSupportingInstitutions = (items: Partial<SupportingInstitution>[], mode: DuplicateHandlingMode) => {
    assertFeatureEnabled('module.upload.action.import_file', 'सहयोगी संस्था बल्क अपलोड (bulkImportSupportingInstitutions)');
    assertFeatureEnabled('module.literacy-partners.action.add', 'सहयोगी संस्था जोड़ना (bulkImportSupportingInstitutions)');
    let added = 0;
    let updated = 0;
    let skipped = 0;
    setSupportingInstitutions((prev) => {
      let currentList = [...prev];
      items.forEach((item, idx) => {
        const cleanInst = item.institutionName?.trim();
        let cleanUdise = item.schoolUdise?.trim() || schools[0]?.udise || '';
        if (isSchoolUser) {
          cleanUdise = currentSchoolUdise;
        }
        const existingIdx = currentList.findIndex((p) => p.schoolUdise === cleanUdise && p.institutionName?.trim() === cleanInst);
        if (existingIdx >= 0) {
          if (mode === 'UPDATE_EXISTING') {
            const updatedRecord = { ...currentList[existingIdx], ...(item as any), updatedAt: new Date().toISOString() };
            currentList[existingIdx] = updatedRecord;
            syncSupportingInstitutionToCloud(updatedRecord).catch((e) => console.warn('Cloud sync bulk update partner error:', e));
            updated++;
          } else {
            skipped++;
          }
        } else {
          const newPartner: SupportingInstitution = {
            id: item.id || `PART-${cleanUdise.slice(-4)}-${Date.now().toString().slice(-4)}${idx}`,
            sessionId: item.sessionId || item.academicYear || selectedSessionId,
            academicYear: item.academicYear || item.sessionId || selectedSessionId,
            schoolUdise: cleanUdise,
            schoolName: item.schoolName || schools.find(s => s.udise === cleanUdise)?.name || 'शासकीय प्राथमिक शाला',
            institutionName: item.institutionName || 'सहयोगी संस्था',
            contactPersonName: item.contactPersonName || '',
            mobileNumber: item.mobileNumber || '',
            designation: item.designation || '',
            workDescription: item.workDescription || 'असाक्षरों का चिन्हांकन एवं प्रेरणा',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          currentList.push(newPartner);
          syncSupportingInstitutionToCloud(newPartner).catch((e) => console.warn('Cloud sync bulk add partner error:', e));
          added++;
        }
      });
      return currentList;
    });
    logActivity('UPLOAD', 'Literacy', `सहयोगी संस्था बैच आयात पूर्ण: ${added} नए जोड़े, ${updated} अपडेट, ${skipped} छोड़े गए।`);
    return { added, updated, skipped };
  };

  const setSelectedSessionId = (sessionId: string) => {
    const session = academicSessions.find((s) => s.id === sessionId);
    if (!session) {
      console.warn(`[SESSION_NOT_FOUND] Attempted to select unknown session: ${sessionId}`);
      return;
    }
    // Enforce role-based visibility guard
    if (currentUser?.role === 'CAC' && (session.visibleToCAC === false || session.status === 'INACTIVE')) {
      logActivity(
        'SESSION_ACCESS_DENIED' as AuditAction,
        'AcademicSession',
        `CAC उपयोगकर्ता (${currentUser?.name}) द्वारा अदृश्य/प्रतिबंधित सत्र ${sessionId} चयन का प्रयास ब्लॉक।`,
        { recordId: sessionId }
      );
      return;
    }
    if (currentUser?.role === 'SCHOOL' && (session.visibleToSchool === false || session.status === 'INACTIVE')) {
      logActivity(
        'SESSION_ACCESS_DENIED' as AuditAction,
        'AcademicSession',
        `SCHOOL उपयोगकर्ता (${currentUser?.name}) द्वारा अदृश्य/प्रतिबंधित सत्र ${sessionId} चयन का प्रयास ब्लॉक।`,
        { recordId: sessionId }
      );
      return;
    }

    setSelectedSessionIdState(sessionId);
    safeSetItem('jsk_selected_session_id', sessionId);
    logActivity('SESSION_SWITCHED' as AuditAction, 'AcademicSession', `सत्र बदलकर "${sessionId}" चुना गया।`, {
      recordId: sessionId,
      recordName: session.sessionName || session.name || sessionId,
    });
  };

  const isSessionLocked = (sessionId?: string) => {
    const sId = sessionId || selectedSessionId;
    const session = academicSessions.find((s) => s.id === sId);
    if (!session) return true;
    return (
      session.status === 'LOCKED' ||
      session.status === 'CLOSED' ||
      session.status === 'ARCHIVED' ||
      session.status === 'INACTIVE'
    );
  };

  /**
   * Strictly asserts that the specified academic session allows data modification.
   * - If session ID does not exist: throws [SESSION_NOT_FOUND].
   * - If session is INACTIVE: throws [403 Forbidden - Session INACTIVE].
   * - If session is LOCKED: throws [403 / SESSION_LOCKED].
   * - If session is CLOSED or ARCHIVED: data mutation is strictly blocked.
   * - If session is UPCOMING: operational entries blocked unless explicitly whitelisted (e.g. promoteStudents, prep).
   */
  const assertSessionModifiable = (
    sessionId?: string,
    operationName: string = 'Data Mutation',
    allowUpcoming: boolean = false
  ) => {
    const targetSessionId = sessionId || selectedSessionId;
    const sessionObj = academicSessions.find((s) => s.id === targetSessionId);

    // Rule 12: Unknown session mutation must be strictly rejected
    if (!sessionObj) {
      const securityErrorMsg = `[SESSION_NOT_FOUND] अमान्य अथवा अज्ञात शैक्षणिक सत्र (${targetSessionId})। इस सत्र में कोई कार्रवाई अनुमत नहीं है। (ऑपरेशन: ${operationName})`;
      console.error(securityErrorMsg);
      logActivity(
        'SESSION_MUTATION_BLOCKED' as AuditAction,
        'AcademicSession',
        `अज्ञात सत्र में म्यूटेशन अस्वीकृत: सत्र ${targetSessionId} पर ऑपरेशन '${operationName}' ब्लॉक।`,
        { recordId: targetSessionId, recordName: operationName }
      );
      throw new Error(securityErrorMsg);
    }

    if (sessionObj.status === 'INACTIVE') {
      const securityErrorMsg = `[403 Forbidden - Session INACTIVE] शैक्षणिक सत्र ${targetSessionId} वर्तमान में निष्क्रिय (INACTIVE) है। इसमें कोई नया डेटा अथवा संशोधन अनुमत नहीं है। (ऑपरेशन: ${operationName})`;
      console.error(securityErrorMsg);
      logActivity(
        'SESSION_MUTATION_BLOCKED' as AuditAction,
        'AcademicSession',
        `निष्क्रिय सत्र में म्यूटेशन अस्वीकृत: सत्र ${targetSessionId} पर ऑपरेशन '${operationName}' ब्लॉक।`,
        { recordId: targetSessionId, recordName: operationName }
      );
      throw new Error(securityErrorMsg);
    }

    if (sessionObj.status === 'LOCKED') {
      const securityErrorMsg = `[403 / SESSION_LOCKED] शैक्षणिक सत्र ${targetSessionId} वर्तमान में लॉक (फ्रीज) है। इसमें कोई डेटा परिवर्तन अनुमत नहीं है। (ऑपरेशन: ${operationName})`;
      console.error(securityErrorMsg);
      logActivity(
        'SESSION_MUTATION_BLOCKED' as AuditAction,
        'AcademicSession',
        `लॉक्ड सत्र में संशोधन अस्वीकृत: उपयोगकर्ता ${currentUser?.name} (${currentUser?.role}) द्वारा सत्र ${targetSessionId} में '${operationName}' ब्लॉक।`,
        { recordId: targetSessionId, recordName: operationName }
      );
      throw new Error(securityErrorMsg);
    }

    if ((sessionObj.status === 'CLOSED' || sessionObj.status === 'ARCHIVED') && operationName !== 'promoteStudents:sourceSession') {
      const statusLabel = sessionObj.status === 'CLOSED' ? 'समाप्त (CLOSED)' : 'अभिलेखीय (ARCHIVED)';
      const securityErrorMsg = `[403 Forbidden - Session ${sessionObj.status}] शैक्षणिक सत्र ${targetSessionId} वर्तमान में ${statusLabel} है। इसमें कोई नया डेटा अथवा संशोधन अनुमत नहीं है। (ऑपरेशन: ${operationName})`;
      console.error(securityErrorMsg);

      logActivity(
        'SESSION_MUTATION_BLOCKED' as AuditAction,
        'AcademicSession',
        `अवरुद्ध सत्र में संशोधन का अस्वीकृत प्रयास (403 Forbidden): उपयोगकर्ता ${currentUser?.name} (${currentUser?.role}) द्वारा ${statusLabel} सत्र ${targetSessionId} में '${operationName}' का प्रयास किया गया।`,
        { recordId: targetSessionId, recordName: operationName }
      );

      throw new Error(securityErrorMsg);
    }

    if (sessionObj.status === 'UPCOMING') {
      const WHITELISTED_UPCOMING_OPERATIONS = [
        'promoteStudents:targetSession',
        'createAcademicSession',
        'prepareUpcomingSession',
        'initializeUpcomingSession',
        'studentEnrollmentPreparation',
      ];
      const isWhitelisted = allowUpcoming && WHITELISTED_UPCOMING_OPERATIONS.includes(operationName);
      if (!isWhitelisted) {
        const securityErrorMsg = `[403 Forbidden - Session Upcoming] शैक्षणिक सत्र ${targetSessionId} अभी आगामी (UPCOMING) स्थिति में है। सामान्य परिचालन प्रविष्टियां (उपस्थिति, एमडीएम, आदि) केवल सत्र को 'सक्रिय (ACTIVE)' करने के बाद ही अनुमत हैं। (ऑपरेशन: ${operationName})`;
        console.error(securityErrorMsg);

        logActivity(
          'SESSION_MUTATION_BLOCKED' as AuditAction,
          'AcademicSession',
          `आगामी सत्र में परिचालन अस्वीकृत (403 Forbidden): उपयोगकर्ता ${currentUser?.name} द्वारा आगामी सत्र ${targetSessionId} में '${operationName}' का प्रयास।`,
          { recordId: targetSessionId, recordName: operationName }
        );

        throw new Error(securityErrorMsg);
      }
    }
  };

  const activateSession = (sessionId: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'ADMIN') {
      logActivity(
        'SECURITY_ALERT',
        'AcademicSession',
        `अनाधिकृत सत्र सक्रियण प्रयास (403 Forbidden): केवल ADMIN सत्र सक्रिय कर सकते हैं। उपयोगकर्ता: ${currentUser?.name} (${currentUser?.role})`
      );
      return {
        success: false,
        message: 'अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही शैक्षणिक सत्र को सक्रिय घोषित कर सकते हैं।'
      };
    }
    setAcademicSessions((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === sessionId,
        status: s.id === sessionId ? 'ACTIVE' : s.isCurrent ? 'CLOSED' : s.status,
      }))
    );
    setActiveSessionId(sessionId);
    setSelectedSessionIdState(sessionId);
    logActivity('SESSION_ACTIVATE' as AuditAction, 'AcademicSession', `सत्र ${sessionId} को वर्तमान/सक्रिय (ACTIVE) घोषित किया गया।`, {
      recordId: sessionId,
      recordName: sessionId,
    });
    return {
      success: true,
      message: `सत्र ${sessionId} को वर्तमान/सक्रिय (ACTIVE) घोषित किया गया।`
    };
  };

  const closeSession = (sessionId: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'ADMIN') {
      logActivity(
        'SECURITY_ALERT',
        'AcademicSession',
        `अनाधिकृत सत्र समाप्ति प्रयास (403 Forbidden): केवल ADMIN सत्र समाप्त कर सकते हैं। उपयोगकर्ता: ${currentUser?.name} (${currentUser?.role})`
      );
      return {
        success: false,
        message: 'अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही शैक्षणिक सत्र समाप्त कर सकते हैं।'
      };
    }
    setAcademicSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, status: 'CLOSED', isCurrent: false } : s
      )
    );
    logActivity('SESSION_CLOSE' as AuditAction, 'AcademicSession', `सत्र ${sessionId} को समाप्त (CLOSED) किया गया।`, {
      recordId: sessionId,
      recordName: sessionId,
    });
    return {
      success: true,
      message: `सत्र ${sessionId} को समाप्त (CLOSED) किया गया।`
    };
  };

  const archiveSession = (sessionId: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'ADMIN') {
      logActivity(
        'SECURITY_ALERT',
        'AcademicSession',
        `अनाधिकृत सत्र अभिलेखागार प्रयास (403 Forbidden): केवल ADMIN सत्र को अभिलेखागार कर सकते हैं। उपयोगकर्ता: ${currentUser?.name} (${currentUser?.role})`
      );
      return {
        success: false,
        message: 'अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही शैक्षणिक सत्र को अभिलेखागार (Archive) कर सकते हैं।'
      };
    }
    setAcademicSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'ARCHIVED',
              isCurrent: false,
              closedAt: s.closedAt || new Date().toISOString(),
            }
          : s
      )
    );
    logActivity('SESSION_ARCHIVE' as AuditAction, 'AcademicSession', `सत्र ${sessionId} को अभिलेखीय (ARCHIVED) घोषित किया गया।`, {
      recordId: sessionId,
      recordName: sessionId,
    });
    return {
      success: true,
      message: `सत्र ${sessionId} को अभिलेखीय (ARCHIVED) घोषित किया गया।`
    };
  };

  const lockSession = (sessionId: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'ADMIN') {
      logActivity(
        'SECURITY_ALERT',
        'AcademicSession',
        `अनाधिकृत सत्र लॉक प्रयास (403 Forbidden): केवल ADMIN सत्र लॉक कर सकते हैं। उपयोगकर्ता: ${currentUser?.name} (${currentUser?.role})`
      );
      return {
        success: false,
        message: 'अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही शैक्षणिक सत्र को लॉक (Freeze) कर सकते हैं।'
      };
    }
    setAcademicSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: 'LOCKED',
              lockedAt: new Date().toISOString(),
              lockedBy: currentUser?.name || 'Administrator',
            }
          : s
      )
    );
    logActivity('SESSION_LOCK' as AuditAction, 'AcademicSession', `सत्र ${sessionId} को लॉक (LOCKED) किया गया। अब इसमें संशोधन नहीं होगा।`, {
      recordId: sessionId,
      recordName: sessionId,
    });
    return {
      success: true,
      message: `सत्र ${sessionId} को लॉक (LOCKED) किया गया।`
    };
  };

  const unlockSession = (sessionId: string): { success: boolean; message: string } => {
    if (currentUser?.role !== 'ADMIN') {
      logActivity(
        'SECURITY_ALERT',
        'AcademicSession',
        `अनाधिकृत सत्र अनलॉक प्रयास (403 Forbidden): केवल ADMIN सत्र अनलॉक कर सकते हैं। उपयोगकर्ता: ${currentUser?.name} (${currentUser?.role})`
      );
      return {
        success: false,
        message: 'अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही शैक्षणिक सत्र अनलॉक कर सकते हैं।'
      };
    }
    setAcademicSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              status: s.isCurrent ? 'ACTIVE' : 'CLOSED',
              lockedAt: undefined,
              lockedBy: undefined,
            }
          : s
      )
    );
    logActivity('SESSION_UNLOCKED' as AuditAction, 'AcademicSession', `सत्र ${sessionId} का लॉक हटाया गया।`, {
      recordId: sessionId,
      recordName: sessionId,
    });
    return {
      success: true,
      message: `सत्र ${sessionId} का लॉक हटाया गया।`
    };
  };

  const updateAcademicSession = (
    sessionId: string,
    updates: Partial<AcademicSession>
  ): { success: boolean; message: string } => {
    if (currentUser?.role !== 'ADMIN') {
      logActivity(
        'SECURITY_ALERT',
        'AcademicSession',
        `अनाधिकृत सत्र संपादन प्रयास (403 Forbidden): केवल ADMIN सत्र संशोधित कर सकते हैं। उपयोगकर्ता: ${currentUser?.name} (${currentUser?.role})`
      );
      return { success: false, message: 'अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही शैक्षणिक सत्र संपादित कर सकते हैं।' };
    }

    const session = academicSessions.find((s) => s.id === sessionId);
    if (!session) {
      return { success: false, message: `सत्र ${sessionId} नहीं मिला।` };
    }

    if (updates.status === 'ACTIVE') {
      setAcademicSessions((prev) =>
        prev.map((s) => {
          if (s.id === sessionId) {
            return {
              ...s,
              ...updates,
              status: 'ACTIVE',
              isCurrent: true,
              updatedAt: new Date().toISOString(),
            };
          }
          return s.isCurrent
            ? { ...s, isCurrent: false, status: 'CLOSED' as SessionStatus, updatedAt: new Date().toISOString() }
            : s;
        })
      );
      setActiveSessionId(sessionId);
      logActivity('SESSION_ACTIVATED' as AuditAction, 'AcademicSession', `सत्र ${sessionId} को वर्तमान सक्रिय (ACTIVE) घोषित किया गया।`, {
        recordId: sessionId,
        recordName: sessionId,
      });
      return { success: true, message: `सत्र ${sessionId} सफलतापूर्वक सक्रिय किया गया।` };
    }

    setAcademicSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s;
        const updated = { ...s, ...updates, updatedAt: new Date().toISOString() };
        if (updates.sessionName && !updates.name) updated.name = updates.sessionName;
        if (updates.name && !updates.sessionName) updated.sessionName = updates.name;
        if (updates.sessionName) updated.shortName = deriveShortName(updates.sessionName);
        return updated;
      })
    );

    let action: AuditAction = 'SESSION_UPDATE';
    if (updates.status === 'LOCKED') action = 'SESSION_LOCKED';
    else if (updates.status === 'CLOSED') action = 'SESSION_CLOSED';
    else if (updates.status === 'ARCHIVED') action = 'SESSION_ARCHIVED';
    else if (updates.status === 'INACTIVE') action = 'SESSION_DEACTIVATED';
    else if (updates.visibleToCAC !== undefined || updates.visibleToSchool !== undefined) action = 'SESSION_VISIBILITY_CHANGED';

    logActivity(action, 'AcademicSession', `सत्र ${sessionId} की जानकारी अद्यतन की गई।`, {
      recordId: sessionId,
      recordName: sessionId,
      newValue: updates,
    });

    return { success: true, message: `सत्र ${sessionId} सफलतापूर्वक अद्यतन किया गया।` };
  };

  const createAcademicSession = (
    sessionData: Partial<AcademicSession>,
    carryForward: CarryForwardOptions
  ): { success: boolean; message: string } => {
    if (currentUser?.role !== 'ADMIN') {
      logActivity(
        'SECURITY_ALERT',
        'AcademicSession',
        `अनाधिकृत सत्र निर्माण प्रयास (403 Forbidden): केवल ADMIN नवीन सत्र सृजित कर सकते हैं। उपयोगकर्ता: ${currentUser?.name} (${currentUser?.role})`
      );
      return { success: false, message: 'अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही नवीन शैक्षणिक सत्र बना सकते हैं।' };
    }

    const sessionName = (sessionData.sessionName || sessionData.id || '').trim();
    const valid = validateSessionFormat(sessionName);
    if (!valid.isValid) {
      return { success: false, message: valid.error || 'अमान्य सत्र प्रारूप' };
    }

    const existing = academicSessions.find((s) => s.sessionName === sessionName || s.id === sessionName);
    if (existing) {
      return { success: false, message: `सत्र "${sessionName}" पहले से पंजीकृत है!` };
    }

    const startYear = parseInt(sessionName.split('-')[0], 10);
    const endYear = startYear + 1;
    const isCurrent = sessionData.isCurrent || false;
    const statusVal: SessionStatus = isCurrent ? 'ACTIVE' : (sessionData.status || 'UPCOMING');

    const newSession: AcademicSession = {
      id: sessionName,
      name: sessionName,
      sessionName: sessionName,
      shortName: deriveShortName(sessionName),
      startYear,
      endYear,
      startDate: sessionData.startDate || `${startYear}-04-01`,
      endDate: sessionData.endDate || `${endYear}-03-31`,
      status: statusVal,
      isCurrent: isCurrent,
      visibleToCAC: sessionData.visibleToCAC ?? true,
      visibleToSchool: sessionData.visibleToSchool ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      remarks: sessionData.remarks || '',
    };

    if (newSession.isCurrent) {
      setAcademicSessions((prev) => [
        newSession,
        ...prev.map((s) => (s.isCurrent ? { ...s, isCurrent: false, status: 'CLOSED' as SessionStatus } : s)),
      ]);
      setActiveSessionId(newSession.id);
      setSelectedSessionIdState(newSession.id);
    } else {
      setAcademicSessions((prev) => [newSession, ...prev]);
    }

    const sourceSessionId = activeSessionId;
    let carriedStudentsCount = 0;
    let carriedStaffCount = 0;

    if (carryForward.staffPosting) {
      const activePostings = staffPostings.filter((p) => p.sessionId === sourceSessionId && p.status === 'ACTIVE');
      const newPostings: StaffPosting[] = activePostings.map((p) => ({
        id: `PST-${newSession.id}-${p.staffId}`,
        staffId: p.staffId,
        sessionId: newSession.id,
        schoolUdise: p.schoolUdise,
        designation: p.designation,
        duty: p.duty || 'अध्यापन',
        subject: p.subject || 'सामान्य',
        joiningDate: p.joiningDate || newSession.startDate,
        assignedClasses: p.assignedClasses,
        status: 'ACTIVE',
        remarks: `सत्र ${sourceSessionId} से निरंतरता में अग्रसारित`,
      }));
      setStaffPostings((prev) => [...prev, ...newPostings]);
      carriedStaffCount = newPostings.length;
    }

    if (carryForward.schoolFacilities) {
      const activeFacs = facilities.filter((f) => !f.sessionId || f.sessionId === sourceSessionId);
      const newFacs: PhysicalFacility[] = activeFacs.map((f) => ({
        ...f,
        id: `FAC-${newSession.id}-${f.schoolUdise}-${f.facilityKey}`,
        sessionId: newSession.id,
      }));
      setFacilities((prev) => [...prev, ...newFacs]);
    }

    if (carryForward.studentPromotion) {
      const activeEnrollments = studentAcademicRecords.filter(
        (e) => e.sessionId === sourceSessionId && e.enrollmentStatus === 'ACTIVE'
      );
      const newRecords: StudentAcademicRecord[] = [];

      activeEnrollments.forEach((e) => {
        const rule = promotionRules.find((r) => r.fromClass === e.class);
        if (rule) {
          if (rule.defaultStatus === 'PROMOTED' && rule.toClass) {
            newRecords.push({
              id: `ENR-${newSession.id}-${e.studentId}`,
              studentId: e.studentId,
              sessionId: newSession.id,
              schoolUdise: e.schoolUdise,
              class: rule.toClass,
              section: e.section,
              rollNumber: e.rollNumber,
              admissionNumber: e.admissionNumber,
              srNumber: e.srNumber,
              scholarNo: e.scholarNo,
              enrollmentStatus: 'ACTIVE',
              promotionStatus: 'PROMOTED',
              attendancePct: 100,
              remarks: `सत्र ${sourceSessionId} (कक्षा ${e.class}) से कक्षोन्नत`,
              createdAt: new Date().toISOString(),
            });
            carriedStudentsCount++;
          }
        } else {
          newRecords.push({
            id: `ENR-${newSession.id}-${e.studentId}`,
            studentId: e.studentId,
            sessionId: newSession.id,
            schoolUdise: e.schoolUdise,
            class: e.class,
            section: e.section,
            rollNumber: e.rollNumber,
            admissionNumber: e.admissionNumber,
            srNumber: e.srNumber,
            scholarNo: e.scholarNo,
            enrollmentStatus: 'ACTIVE',
            promotionStatus: 'RETAINED',
            attendancePct: 100,
            remarks: `सत्र ${sourceSessionId} से अग्रसारित`,
            createdAt: new Date().toISOString(),
          });
          carriedStudentsCount++;
        }
      });

      setStudentAcademicRecords((prev) => [...prev, ...newRecords]);
    }

    logActivity(
      'SESSION_CREATED',
      'AcademicSession',
      `नवीन शैक्षणिक सत्र सृजित: ${newSession.sessionName} (${carriedStudentsCount} विद्यार्थी, ${carriedStaffCount} शिक्षक डेटा अग्रसारित)`,
      {
        recordId: newSession.id,
        recordName: newSession.sessionName,
        newValue: newSession,
      }
    );

    return {
      success: true,
      message: `सत्र "${newSession.sessionName}" सफलतापूर्वक सृजित हुआ! ${carriedStudentsCount} विद्यार्थी तथा ${carriedStaffCount} शिक्षक पदस्थापनाएं नए सत्र में तैयार की गईं।`,
    };
  };

  const getStudentAcademicJourney = (studentId: string): StudentAcademicJourneyEntry[] => {
    const master = studentMasters.find((m) => m.id === studentId);
    if (!master) return [];

    const enrollments = studentAcademicRecords.filter((e) => e.studentId === studentId);
    const transfers = studentTransfers.filter((t) => t.studentId === studentId);

    // Security check: School users can only access journeys of students who have enrolled in their school
    if (isSchoolUser) {
      const hasEnrolledInSchool = enrollments.some((e) => e.schoolUdise === currentSchoolUdise);
      if (!hasEnrolledInSchool) {
        assertSchoolAccess('UNAUTHORIZED_STUDENT_ACCESS', 'getStudentAcademicJourney');
        return [];
      }
    }

    return enrollments
      .map((e) => {
        const session = academicSessions.find((s) => s.id === e.sessionId);
        const school = schools.find((s) => s.udise === e.schoolUdise);
        const transfer = transfers.find((t) => t.oldSessionId === e.sessionId || t.newSessionId === e.sessionId);

        return {
          sessionId: e.sessionId,
          sessionName: session?.sessionName || (session as any)?.name || e.sessionId,
          schoolUdise: e.schoolUdise,
          schoolName: school?.name || school?.hindiName || e.schoolUdise,
          class: e.class,
          section: e.section,
          rollNumber: e.rollNumber,
          attendancePct: e.attendancePct,
          academicGrade: (e as any).academicGrade,
          enrollmentStatus: e.enrollmentStatus,
          status: e.enrollmentStatus,
          promotionStatus: e.promotionStatus,
          isCurrentSession: e.sessionId === activeSessionId,
          transferDetails: transfer,
          remarks: e.remarks,
        };
      })
      .sort((a, b) => {
        const yearA = parseInt(a.sessionId.split('-')[0], 10) || 0;
        const yearB = parseInt(b.sessionId.split('-')[0], 10) || 0;
        if (yearA !== yearB) return yearA - yearB;
        // If same session (e.g. transfer in same academic year), show TRANSFERRED first then ACTIVE
        if (a.enrollmentStatus === 'TRANSFERRED' && b.enrollmentStatus === 'ACTIVE') return -1;
        if (a.enrollmentStatus === 'ACTIVE' && b.enrollmentStatus === 'TRANSFERRED') return 1;
        return 0;
      });
  };

  const getSchoolAcademicHistory = (schoolUdise: string): SchoolAcademicHistoryEntry[] => {
    assertSchoolAccess(schoolUdise, 'getSchoolAcademicHistory');
    const schoolObj = schools.find((s) => s.udise === schoolUdise);
    return computeSchoolAcademicHistory({
      schoolUdise,
      school: schoolObj,
      academicSessions,
      selectedSessionId,
      activeSessionId,
      studentAcademicRecords,
      staffPostings,
      attendance,
      mdmRecords,
      facilities,
      governmentWork,
      complaints,
      documents,
      literacyRegisters,
      illiteratePersons,
      aksharSathis,
    });
  };

  const promoteStudents = (
    promotions: Array<{
      studentId: string;
      fromSessionId: string;
      toSessionId: string;
      oldClass: string;
      newClass: string;
      status: StudentEnrollmentStatus;
      schoolUdise: string;
      targetSchoolUdise?: string;
      remarks?: string;
    }>
  ): { promotedCount: number; message: string } => {
    promotions.forEach((p) => {
      assertFeatureEnabled('module.students.sub.promotion_tc', 'विद्यार्थी कक्षोन्नति (promoteStudents)');
      assertFeatureEnabled('module.students.action.edit', 'विद्यार्थी कक्षोन्नति (promoteStudents)');
      assertSessionModifiable(p.fromSessionId, 'promoteStudents:sourceSession');
      assertSessionModifiable(p.toSessionId, 'promoteStudents:targetSession', true);
      if (isSchoolUser) {
        assertSchoolAccess(p.schoolUdise, 'promoteStudents:schoolAccess');
      }
    });

    // Requirement 6: Duplicate Active Enrollment Protection
    if (promotions.length === 1) {
      const single = promotions[0];
      const targetUdise = single.targetSchoolUdise || single.schoolUdise;
      const existingActive = studentAcademicRecords.find(
        (r) =>
          r.studentId === single.studentId &&
          r.sessionId === single.toSessionId &&
          r.schoolUdise === targetUdise &&
          r.enrollmentStatus === 'ACTIVE'
      );
      if (existingActive) {
        logActivity(
          'DUPLICATE_ACTIVE_ENROLLMENT' as AuditAction,
          'Students',
          `सक्रिय नामांकन डुप्लीकेट ब्लॉक: विद्यार्थी ${single.studentId} सत्र ${single.toSessionId} में पहले से सक्रिय है।`,
          { recordId: single.studentId, schoolUdise: targetUdise }
        );
        throw new Error('इस विद्यार्थी का चयनित शैक्षणिक सत्र में सक्रिय शैक्षणिक रिकॉर्ड पहले से उपलब्ध है।');
      }
    }

    let count = 0;
    const successfullyPromotedList: Array<{
      studentId: string;
      studentName: string;
      fromSessionId: string;
      toSessionId: string;
      oldClass: string;
      newClass: string;
      schoolUdise: string;
      status: StudentEnrollmentStatus;
    }> = [];

    setStudentAcademicRecords((prev) => {
      let next = [...prev];
      promotions.forEach((p) => {
        const master = studentMasters.find((m) => m.id === p.studentId);
        const targetUdise = p.targetSchoolUdise || p.schoolUdise;
        const existingIdx = next.findIndex((r) => r.studentId === p.studentId && r.sessionId === p.toSessionId);

        // If duplicate active record exists, protect existing record and skip
        if (existingIdx >= 0 && next[existingIdx].enrollmentStatus === 'ACTIVE') {
          logActivity(
            'DUPLICATE_ACTIVE_ENROLLMENT' as AuditAction,
            'Students',
            `[PROMOTION_DUPLICATE_IGNORED] विद्यार्थी ${master?.name || p.studentId} सत्र ${p.toSessionId} में पहले से सक्रिय नामांकित है। कक्षोन्नति सुरक्षित रूप से छोड़ी गई।`,
            { recordId: p.studentId, recordName: master?.name, schoolUdise: targetUdise }
          );
          return;
        }

        // Update previous session record to PROMOTED / PASSED
        next = next.map((r) =>
          r.studentId === p.studentId && r.sessionId === p.fromSessionId
            ? {
                ...r,
                enrollmentStatus: p.status === 'PASSED' ? 'PASSED' : 'PROMOTED',
                promotionStatus: p.status === 'PASSED' ? 'PASSED' : 'PROMOTED',
                remarks: p.remarks || `सत्र ${p.toSessionId} (कक्षा ${p.newClass}) में कक्षोन्नति`,
              }
            : r
        );

        if (p.status !== 'PASSED' && p.newClass) {
          const newRecord: StudentAcademicRecord = {
            id: `ENR-${p.toSessionId}-${p.studentId}`,
            studentId: p.studentId,
            sessionId: p.toSessionId,
            schoolUdise: targetUdise,
            class: p.newClass,
            section: 'A',
            rollNumber: '01',
            admissionNumber: `ADM-${p.studentId.slice(-4)}`,
            enrollmentStatus: 'ACTIVE',
            promotionStatus: 'PROMOTED',
            attendancePct: 100,
            remarks: p.remarks || `सत्र ${p.fromSessionId} (कक्षा ${p.oldClass}) से कक्षोन्नति`,
            createdAt: new Date().toISOString(),
          };

          if (existingIdx >= 0) {
            next[existingIdx] = newRecord;
          } else {
            next.push(newRecord);
          }
          count++;

          successfullyPromotedList.push({
            studentId: p.studentId,
            studentName: master?.name || p.studentId,
            fromSessionId: p.fromSessionId,
            toSessionId: p.toSessionId,
            oldClass: p.oldClass,
            newClass: p.newClass,
            schoolUdise: targetUdise,
            status: p.status,
          });
        }
      });
      return next;
    });

    // Requirement 17: Individual and batch audit entries
    successfullyPromotedList.forEach((sp) => {
      logActivity(
        'STUDENT_PROMOTED',
        'Students',
        `विद्यार्थी ${sp.studentName} को सत्र ${sp.fromSessionId} (कक्षा ${sp.oldClass}) से सत्र ${sp.toSessionId} (कक्षा ${sp.newClass}) में कक्षोन्नत किया गया।`,
        {
          recordId: sp.studentId,
          recordName: sp.studentName,
          schoolUdise: sp.schoolUdise,
          oldValue: { sessionId: sp.fromSessionId, class: sp.oldClass },
          newValue: { sessionId: sp.toSessionId, class: sp.newClass, status: sp.status },
        }
      );
    });

    logActivity('UPDATE', 'AcademicSession', `${count} विद्यार्थियों का कक्षोन्नति (Promotion) कार्य पूर्ण हुआ।`);
    return {
      promotedCount: count,
      message: `${count} विद्यार्थियों को सत्र ${promotions[0]?.toSessionId || ''} में कक्षोन्नत किया गया।`,
    };
  };

  const transferStudent = (
    transferData: Omit<StudentTransferRecord, 'id' | 'transferDate' | 'createdBy' | 'createdByName'>
  ): { success: boolean; message: string } => {
    assertFeatureEnabled('module.students.sub.promotion_tc', 'स्थानांतरण प्रमाण-पत्र (transferStudent)');
    assertFeatureEnabled('module.students.action.edit', 'स्थानांतरण प्रमाण-पत्र (transferStudent)');
    assertSessionModifiable(transferData.oldSessionId || selectedSessionId, 'transferStudent:sourceSession');
    if (transferData.newSessionId && transferData.newSessionId !== (transferData.oldSessionId || selectedSessionId)) {
      assertSessionModifiable(transferData.newSessionId, 'transferStudent:destinationSession');
    }
    if (isSchoolUser) {
      assertSchoolAccess(transferData.oldSchoolUdise, 'transferStudent:sourceSchool');
    }

    const student = studentMasters.find((m) => m.id === transferData.studentId);
    if (!student) {
      return { success: false, message: 'विद्यार्थी नहीं मिला!' };
    }

    const oldSession = transferData.oldSessionId || selectedSessionId;
    const newSession = transferData.newSessionId || oldSession;

    const destSchoolName = (transferData.destinationSchoolName || transferData.newSchoolName || '').trim();
    const destSchoolUdise = (
      transferData.destinationSchoolUdise ||
      (transferData.newSchoolUdise && transferData.newSchoolUdise !== 'OTHER' ? transferData.newSchoolUdise : '') ||
      ''
    ).trim();

    if (!destSchoolName && !destSchoolUdise) {
      return { success: false, message: 'गंतव्य विद्यालय का नाम या DISE/UDISE Code में से कम से कम एक दर्ज करें।' };
    }
    if (destSchoolUdise && !/^\d{11}$/.test(destSchoolUdise)) {
      return { success: false, message: 'DISE/UDISE Code 11 अंकों का होना चाहिए।' };
    }

    const newTransfer: StudentTransferRecord = {
      ...transferData,
      id: `TRF-${Date.now().toString().slice(-6)}`,
      destinationSchoolName: destSchoolName || undefined,
      destinationSchoolUdise: destSchoolUdise || undefined,
      newSchoolName: destSchoolName || (destSchoolUdise ? `UDISE: ${destSchoolUdise}` : ''),
      newSchoolUdise: destSchoolUdise || '',
      transferDate: transferData.tcDate || new Date().toISOString().split('T')[0],
      createdBy: currentUser?.id || 'admin',
      createdByName: currentUser?.name || 'Administrator',
    };

    setStudentTransfers((prev) => [newTransfer, ...prev]);

    setStudentAcademicRecords((prev) => {
      const oldSession = transferData.oldSessionId || selectedSessionId;

      // Update the source school record - mark as TRANSFERRED / TRANSFERRED_OUT with destination info
      return prev.map((e) =>
        e.studentId === transferData.studentId &&
        e.sessionId === oldSession &&
        (e.schoolUdise === transferData.oldSchoolUdise || !transferData.oldSchoolUdise)
          ? {
              ...e,
              enrollmentStatus: 'TRANSFERRED' as StudentEnrollmentStatus,
              transferStatus: 'TRANSFERRED_OUT',
              tcNumber: transferData.tcNumber,
              tcDate: transferData.tcDate,
              remarks: `शाला स्थानांतरण (TC क्र. ${transferData.tcNumber || 'एन/ए'}): ${transferData.oldSchoolName} से ${
                destSchoolName && destSchoolUdise
                  ? `${destSchoolName} (UDISE: ${destSchoolUdise})`
                  : destSchoolName || `UDISE ${destSchoolUdise}`
              } में स्थानांतरण`,
              updatedAt: new Date().toISOString(),
            }
          : e
      );
    });

    logActivity(
      'STUDENT_TRANSFERRED',
      'Students',
      `विद्यार्थी स्थानांतरण (TC): ${student.name} (${transferData.oldSchoolName} -> ${destSchoolName || destSchoolUdise})`,
      {
        recordId: student.id,
        recordName: student.name,
        schoolUdise: destSchoolUdise || undefined,
        newValue: newTransfer,
      }
    );

    return {
      success: true,
      message: `विद्यार्थी ${student.name} का स्थानांतरण सफलतापूर्वक दर्ज किया गया (TC सं.: ${transferData.tcNumber || 'एन/ए'})`,
    };
  };

  const updateStudentTransfer = (
    transferId: string,
    updatedData: Partial<StudentTransferRecord>
  ): { success: boolean; message: string } => {
    assertFeatureEnabled('module.students.sub.promotion_tc', 'स्थानांतरण प्रमाण-पत्र संपादन (updateStudentTransfer)');
    assertFeatureEnabled('module.students.action.edit', 'स्थानांतरण प्रमाण-पत्र संपादन (updateStudentTransfer)');
    const existing = studentTransfers.find((t) => t.id === transferId);
    if (!existing) {
      return { success: false, message: 'स्थानांतरण अभिलेख (TC Record) नहीं मिला।' };
    }
    assertSessionModifiable(existing.oldSessionId || selectedSessionId, 'updateStudentTransfer');
    if (isSchoolUser) {
      assertSchoolAccess(existing.oldSchoolUdise, 'updateStudentTransfer');
    }

    const destSchoolName = (
      updatedData.destinationSchoolName ??
      updatedData.newSchoolName ??
      existing.destinationSchoolName ??
      existing.newSchoolName ??
      ''
    ).trim();

    const destSchoolUdise = (
      updatedData.destinationSchoolUdise ??
      (updatedData.newSchoolUdise && updatedData.newSchoolUdise !== 'OTHER' ? updatedData.newSchoolUdise : '') ??
      existing.destinationSchoolUdise ??
      (existing.newSchoolUdise && existing.newSchoolUdise !== 'OTHER' ? existing.newSchoolUdise : '') ??
      ''
    ).trim();

    if (!destSchoolName && !destSchoolUdise) {
      return { success: false, message: 'गंतव्य विद्यालय का नाम या DISE/UDISE Code में से कम से कम एक दर्ज करें।' };
    }
    if (destSchoolUdise && !/^\d{11}$/.test(destSchoolUdise)) {
      return { success: false, message: 'DISE/UDISE Code 11 अंकों का होना चाहिए।' };
    }

    const mergedTransfer: StudentTransferRecord = {
      ...existing,
      ...updatedData,
      destinationSchoolName: destSchoolName || undefined,
      destinationSchoolUdise: destSchoolUdise || undefined,
      newSchoolName: destSchoolName || (destSchoolUdise ? `UDISE: ${destSchoolUdise}` : ''),
      newSchoolUdise: destSchoolUdise || '',
    };

    setStudentTransfers((prev) =>
      prev.map((t) => (t.id === transferId ? mergedTransfer : t))
    );

    // Update academic records remarks & TC number
    setStudentAcademicRecords((prev) =>
      prev.map((e) => {
        if (
          e.studentId === existing.studentId &&
          e.sessionId === existing.oldSessionId &&
          (e.schoolUdise === existing.oldSchoolUdise || !existing.oldSchoolUdise)
        ) {
          return {
            ...e,
            tcNumber: mergedTransfer.tcNumber,
            tcDate: mergedTransfer.tcDate,
            remarks: `शाला स्थानांतरण (TC क्र. ${mergedTransfer.tcNumber || 'एन/ए'}): ${existing.oldSchoolName} से ${
              destSchoolName && destSchoolUdise
                ? `${destSchoolName} (UDISE: ${destSchoolUdise})`
                : destSchoolName || `UDISE ${destSchoolUdise}`
            } में स्थानांतरण`,
            updatedAt: new Date().toISOString(),
          };
        }
        return e;
      })
    );

    logActivity('UPDATE', 'Students', `स्थानांतरण अभिलेख (TC सं.: ${mergedTransfer.tcNumber || existing.tcNumber}) अद्यतन किया गया।`);
    return {
      success: true,
      message: `स्थानांतरण प्रमाण-पत्र (TC सं. ${mergedTransfer.tcNumber || existing.tcNumber}) सफलतापूर्वक अद्यतन किया गया।`,
    };
  };

  const updatePromotionRules = (rules: PromotionRuleMapping[]) => {
    setPromotionRules(rules);
    logActivity('UPDATE', 'AcademicSession', 'कक्षोन्नति नियम (Promotion Rules) अद्यतन किए गए।');
  };

  const resetToSampleData = () => {
    const { masters: sMasters, enrollments: sEnrollments } = buildInitialMastersAndEnrollments(initialStudents);
    const { masters: stMasters, postings: stPostings } = buildInitialStaffMastersAndPostings(initialStaff);

    setAcademicSessions(INITIAL_ACADEMIC_SESSIONS);
    setActiveSessionId('2026-27');
    setSelectedSessionIdState('2026-27');
    setStudentMasters(sMasters);
    setStudentAcademicRecords(sEnrollments);
    setStudentTransfers([]);
    setStaffMasters(stMasters);
    setStaffPostings(stPostings);
    setPromotionRules(DEFAULT_PROMOTION_RULES);

    setSchools(initialSchools);
    setFacilities(initialFacilities);
    setAttendance(initialAttendance);
    setMdmRecords(initialMDM);
    setGovernmentWork(initialGovernmentWork);
    setNotifications(initialNotifications);
    setComplaints(initialComplaints.map(ensureComplaintModel));
    setDocuments(initialDocuments);
    setAuditLogs(initialAuditLogs);
    setUploadHistory(initialUploadHistory);
    setSettings(initialSettings);
    setLiteracyRegisters(initialLiteracyRegisters);
    setIlliteratePersons(initialIlliteratePersons);
    setAksharSathis(initialAksharSathis);
    setExamCycles(initialExamCycles);
    setLiteracyExamResults(initialLiteracyExamResults);
    setSupportingInstitutions(initialSupportingInstitutions);
    setRasoiya(initialRasoiya);
    setShgs(initialSHGs);
    logActivity('UPDATE', 'System', 'सिस्टम डेटा सफलतापूर्वक रीसेट किया गया।');
  };

  const [migrationReport, setMigrationReport] = useState<MigrationAuditReport | null>(() => {
    return getMigrationReport();
  });

  const runManualMigrationAudit = (): MigrationAuditReport => {
    const rawSchools = localStorage.getItem('jsk_schools');
    const existingSch: School[] = rawSchools ? JSON.parse(rawSchools) : schools;
    const existingStu: Student[] = students;
    const existingStf: Staff[] = staff;
    const existingFac: PhysicalFacility[] = facilities;

    const { migratedSchools, migratedFacilities, report } =
      runControlledSchoolMasterMigration(existingSch, existingStu, existingStf, existingFac);

    const sanitized = sanitizeCanonicalSchools(migratedSchools);
    setSchools(sanitized);
    safeSetJSON('jsk_schools', sanitized);
    setFacilities(migratedFacilities);
    setMigrationReport(report);
    logActivity('UPDATE', 'School Master', 'नियंत्रित 37 शाला मास्टर माइग्रेशन व ऑडिट सफलतापूर्वक संपन्न हुआ।');
    return report;
  };

  return (
    <DataContext.Provider
      value={{
        // Cloud Database Sync Status
        isCloudConnected,
        cloudSyncStatus,
        lastCloudSyncAt,
        triggerManualCloudSync,
        connectivityState,
        checkCloudConnectivity,

        // Academic Session Management
        academicSessions,
        visibleAcademicSessions,
        activeSessionId,
        selectedSessionId,
        activeSession,
        selectedSession,
        isCurrentSessionSelected,
        isSessionLocked,
        assertSessionModifiable,

        setSelectedSessionId,
        createAcademicSession,
        updateAcademicSession,
        activateSession,
        closeSession,
        archiveSession,
        lockSession,
        unlockSession,

        // Student Permanent Master & Session Records
        studentMasters,
        studentAcademicRecords,
        studentTransfers,
        getStudentAcademicJourney,

        // School Multi-Year Academic History
        getSchoolAcademicHistory,

        // Staff Permanent Master & Session Postings
        staffMasters,
        staffPostings,

        // Promotion Rules & Execution
        promotionRules,
        updatePromotionRules,
        promoteStudents,
        transferStudent,
        updateStudentTransfer,

        schools: activeSchools,
        allSchools: schools,
        activeSchools,
        inactiveSchools,
        students,
        staff,
        rasoiya,
        shgs,
        facilities,
        attendance,
        mdmRecords,
        governmentWork,
        notifications,
        complaints,
        documents,
        auditLogs,
        uploadHistory,
        settings,

        selectedSchoolUdise,
        setSelectedSchoolUdise,
        selectedSchool,
        currentSchoolUdise,

        scopedSchools,
        scopedStudents,
        scopedStaff,
        scopedRasoiya,
        scopedSHGs,
        scopedFacilities,
        scopedAttendance,
        scopedMDM,
        scopedWork,
        scopedComplaints,
        scopedDocuments,
        scopedNotifications,

        // Literacy State and Scoped Collections
        literacyRegisters,
        illiteratePersons,
        aksharSathis,
        examCycles,
        literacyExamResults,
        supportingInstitutions,

        scopedLiteracyRegisters,
        scopedIlliteratePersons,
        scopedAksharSathis,
        scopedExamCycles,
        scopedLiteracyExamResults,
        scopedSupportingInstitutions,

        literacyStats,

        stats,

        // Simulated Server-Side Fetch Operations
        fetchStudents,
        fetchStaff,
        fetchAttendance,
        fetchMDM,
        fetchFacilities,
        fetchGovernmentWork,
        fetchComplaints,
        fetchSchool,

        // Security Verification
        assertSchoolAccess,
        verifySchoolAccess,

        addSchool,
        updateSchool,
        deleteSchool,
        archiveSchool,
        restoreSchool,
        activateSchool,
        deactivateSchool,
        resetSchoolPassword,

        addStudent,
        updateStudent,
        deleteStudent,

        addStaff,
        updateStaff,
        deleteStaff,

        addRasoiya,
        updateRasoiya,
        deleteRasoiya,
        addSHG,
        updateSHG,
        deleteSHG,

        updateFacility,
        markAttendance,
        markAttendanceBatch,
        saveMDMRecord,
        deleteMDMRecord,

        addGovernmentWork,
        updateGovernmentWork,
        deleteGovernmentWork,

        addComplaint,
        updateComplaint,
        resolveComplaint,
        closeComplaint,
        reopenComplaint,
        updateComplaintStatus,
        deleteComplaint,

        addNotification,
        markNotificationAsRead,
        deleteNotification,

        addDocument,
        deleteDocument,

        addUploadHistory,
        clearUploadHistory,

        bulkImportSchools,
        bulkImportStudents,
        bulkImportStaff,
        bulkImportFacilities,
        bulkImportAttendance,
        bulkImportMDM,
        bulkImportComplaints,
        bulkImportGovernmentWork,

        // Literacy Handlers
        saveLiteracyRegister,
        deleteLiteracyRegister,
        addIlliteratePerson,
        updateIlliteratePerson,
        deleteIlliteratePerson,
        addAksharSathi,
        updateAksharSathi,
        deleteAksharSathi,
        addExamCycle,
        saveLiteracyExamResult,
        deleteLiteracyExamResult,
        addSupportingInstitution,
        updateSupportingInstitution,
        deleteSupportingInstitution,
        bulkImportLiteracyLearners,
        bulkImportAksharSathis,
        bulkImportExamResults,
        bulkImportSupportingInstitutions,

        updateSettings,
        logActivity,
        addAuditLog,
        resetToSampleData,

        // Migration & Audit
        migrationReport,
        runManualMigrationAudit,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
