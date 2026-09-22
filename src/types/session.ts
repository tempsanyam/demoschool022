import { Gender, SocialCategory, StaffDesignation, StaffStatus, ApaarStatus } from './index';

export type SessionStatus = 'ACTIVE' | 'CLOSED' | 'LOCKED' | 'UPCOMING' | 'ARCHIVED' | 'INACTIVE';

export interface AcademicSession {
  id: string; // e.g. "2026-27"
  sessionName: string; // "2026-27"
  name?: string;
  shortName?: string;
  startYear: number; // 2026
  endYear: number; // 2027
  startDate: string; // "2026-04-01"
  endDate: string; // "2027-03-31"
  status: SessionStatus; // 'ACTIVE' | 'CLOSED' | 'LOCKED' | 'UPCOMING' | 'ARCHIVED' | 'INACTIVE'
  isCurrent: boolean;
  visibleToCAC?: boolean;
  visibleToSchool?: boolean;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  lockedAt?: string;
  lockedBy?: string;
  remarks?: string;
}

export interface CarryForwardOptions {
  schools: boolean;
  studentMaster: boolean;
  staffMaster: boolean;
  staffPosting: boolean;
  studentPromotion: boolean;
  schoolFacilities: boolean;
  documents: boolean;
  attendance: boolean;
  mdm: boolean;
  governmentWork: boolean;
}

// Student Master (Permanent Identity Profile)
export interface StudentMaster {
  id: string; // e.g. "STM-23080110701-01"
  samagraId: string;
  apaarId?: string;
  apaarStatus?: ApaarStatus;
  panNumber?: string;
  name: string;
  fatherName: string;
  motherName?: string;
  guardianName?: string;
  gender: Gender;
  dob: string;
  category: SocialCategory;
  isCwsn: boolean;
  cwsnType?: string;
  village?: string;
  address?: string;
  mobile: string;
  aadhaarNumber?: string;
  isAadhaarVerified?: boolean;
  isKycVerified?: boolean;
  bankAccount?: {
    accountNumber?: string;
    ifsc?: string;
    bankName?: string;
  };
  benefits?: {
    freeUniform?: boolean;
    freeBooks?: boolean;
    scholarship?: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

// Student Academic Enrollment Status
export type StudentEnrollmentStatus =
  | 'ACTIVE'
  | 'PROMOTED'
  | 'REPEATED'
  | 'PASSED'
  | 'PASSED_OUT'
  | 'TRANSFERRED'
  | 'TC_ISSUED'
  | 'DROPOUT'
  | 'INACTIVE';

// Student Academic Record (Session Enrollment)
export interface StudentAcademicRecord {
  id: string; // e.g. "ENR-2026-27-10701-01"
  studentId: string; // references StudentMaster.id
  sessionId: string; // e.g. "2026-27", "2027-28"
  schoolUdise: string;
  class: string;
  section?: string;
  rollNumber?: string;
  admissionNumber?: string;
  srNumber?: string;
  scholarNo?: string;
  enrollmentStatus: StudentEnrollmentStatus;
  promotionStatus?: string;
  transferStatus?: string;
  result?: string;
  attendancePct?: number;
  remarks?: string;
  admissionDate?: string;
  tcNumber?: string;
  tcDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// Student Academic Journey Entry (for multi-year visual timeline)
export interface StudentAcademicJourneyEntry {
  sessionId: string;
  sessionName: string;
  schoolUdise: string;
  schoolName: string;
  class: string;
  section?: string;
  status: StudentEnrollmentStatus;
  rollNumber?: string;
  result?: string;
  attendancePct?: number;
  remarks?: string;
}

// Student Transfer History Record
export interface StudentTransferRecord {
  id: string;
  studentId: string;
  studentName: string;
  samagraId: string;
  oldSchoolUdise: string;
  oldSchoolName: string;
  newSchoolUdise?: string;
  newSchoolName?: string;
  destinationSchoolUdise?: string;
  destinationSchoolName?: string;
  destinationType?: 'INTERNAL' | 'OTHER';
  oldSessionId: string;
  newSessionId: string;
  oldClass: string;
  newClass: string;
  transferDate: string;
  reason: string;
  tcNumber?: string;
  tcDate?: string;
  createdBy: string;
  createdByName: string;
}

// Staff Master (Permanent Profile)
export interface StaffMaster {
  id: string;
  employeeId: string;
  employeeCode?: string;
  uniqueId?: string;
  name: string;
  gender: Gender;
  mobile: string;
  email?: string;
  dob: string;
  category: SocialCategory;
  caste?: string;
  aadhaarNumber?: string;
  voterIdNumber?: string;
  teacherType?: string;
  isBlo?: boolean | 'YES' | 'NO';
  isCensus?: boolean | 'YES' | 'NO';
  isOd?: boolean | 'YES' | 'NO';
  qualification: string;
  employmentType?: string;
  createdAt: string;
  updatedAt?: string;
}

// Staff Session Posting
export interface StaffPosting {
  id: string;
  staffId: string; // references StaffMaster.id
  sessionId: string; // e.g. "2026-27"
  schoolUdise: string;
  designation: StaffDesignation;
  subject: string;
  joiningDate: string;
  postingDate?: string;
  assignedClasses: string[];
  duty: string;
  status: StaffStatus;
  remarks?: string;
}

// Class Promotion Rule Mapping
export interface PromotionRuleMapping {
  fromClass: string;
  toClass: string;
  defaultStatus: StudentEnrollmentStatus;
}
