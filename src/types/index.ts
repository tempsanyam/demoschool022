export type UserRole = 'ADMIN' | 'CAC' | 'SCHOOL';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'INACTIVE';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  employeeId: string;
  mobile: string;
  email: string;
  designation: string;
  subject?: string;
  assignedSchoolUdise?: string; // empty if CAC/Admin (all schools)
  schoolId?: string;
  schoolUdise?: string;
  schoolName?: string;
  status: UserStatus;
  approvalStatus?: 'APPROVED' | 'PENDING' | 'REJECTED';
  mustChangePassword?: boolean;
  rejectionReason?: string;
  deactivationReason?: string;
  deactivatedAt?: string;
  deactivatedBy?: string;
  accessResetAt?: string;
  lastLogin?: string;
  avatar?: string;
  createdAt: string;
  password?: string;
  fatherName?: string;
  gender?: Gender | string;
  dob?: string;
  alternateMobile?: string;
  address?: string;
  village?: string;
  pinCode?: string;
  department?: string;
  joiningDate?: string;
  currentPosting?: string;
  currentSchoolOrSankul?: string;
  block?: string;
  district?: string;
  assignedArea?: string;
  lastProfileUpdate?: string;
}

export type SchoolType = 'प्राथमिक' | 'माध्यमिक' | 'हाई स्कूल' | 'उच्चतर माध्यमिक' | 'कस्तूरबा गांधी बालिका विद्यालय' | 'अशासकीय प्राथमिक';

export interface School {
  udise: string;
  name: string;
  hindiName: string;
  schoolType: SchoolType;
  village: string;
  gramPanchayat: string;
  sankul: string;
  jsk: string; // Jan Shiksha Kendra
  block: string;
  district: string;
  pin: string;
  address: string;
  mobile: string;
  email: string;
  photo?: string;
  establishmentYear: number;
  principalName: string;
  principalMobile: string;
  principalEmployeeId: string;
  principalAssignmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  isDeleted?: boolean;
  deletedAt?: string | null;
  deletedBy?: string | null;
  archiveReason?: string | null;
  totalRooms?: number;
  totalClassrooms?: number;
}

export interface SchoolAcademicHistoryEntry {
  sessionId: string;
  sessionName: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED' | 'ARCHIVED' | 'LOCKED' | 'INACTIVE';
  isCurrent: boolean;
  isCurrentSelected: boolean;
  isLockedOrArchived: boolean;
  studentsCount: number;
  activeStudentsCount: number;
  promotedStudentsCount: number;
  transferredStudentsCount: number;
  staffCount: number;
  attendanceRecordsCount: number;
  hasAttendance: boolean;
  mdmRecordsCount: number;
  hasMDM: boolean;
  facilitiesCount: number;
  hasFacilities: boolean;
  govWorkCount: number;
  complaintsCount: number;
  documentsCount: number;
  literacyCount: number;
  totalRecords: number;
  hasData: boolean;
  operationalStatus?: 'OPERATIONAL' | 'PRE_ESTABLISHMENT' | 'UNKNOWN';
  operationalLabel?: string;
  lastActivityDate?: string;
  remarks?: string;
}

export type Gender = 'बालक' | 'बालिका' | 'अन्य' | 'MALE' | 'FEMALE' | 'OTHER';
export type SocialCategory = 'SC' | 'ST' | 'OBC' | 'GENERAL' | 'EWS';
export type StudentStatus = 'ACTIVE' | 'TC_ISSUED' | 'DROPOUT' | 'TRANSFERRED' | 'PROMOTED' | 'PASSED';
export type ApaarStatus = 'Available / Generated' | 'Pending' | 'Not Available';

export interface Student {
  id: string;
  srNumber?: string;
  scholarNo?: string;
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
  class: string;
  section?: string;
  category: SocialCategory;
  isCwsn: boolean;
  cwsnType?: string;
  schoolUdise: string;
  village?: string;
  address?: string;
  mobile: string;
  status: StudentStatus;
  admissionDate?: string;
  session?: string;
  sessionId?: string;
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
  history?: import('./session').StudentAcademicJourneyEntry[];
}

export type StaffDesignation =
  | 'प्राचार्य'
  | 'प्रधानाध्यापक'
  | 'उच्च माध्यमिक शिक्षक'
  | 'उच्च श्रेणी शिक्षक'
  | 'माध्यमिक शिक्षक'
  | 'प्राथमिक शिक्षक'
  | 'अतिथि शिक्षक'
  | 'रसोइया'
  | 'भृत्य'
  | 'कार्यालय सहायक'
  | 'चौकीदार'
  | 'प्रयोगशाला सहायक'
  | 'सफाई कर्मचारी'
  | 'सहायक ग्रेड-3'
  | 'अन्य कर्मचारी'
  | string;

export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'TRANSFERRED';

export type TeacherType = 'वर्ग 1' | 'वर्ग 2' | 'वर्ग 3' | 'अन्य';

export interface Staff {
  id: string;
  employeeId: string;
  employeeCode?: string;
  uniqueId?: string; // स्थायी यूनिक आईडी
  name: string;
  gender: Gender;
  designation: StaffDesignation;
  subject: string;
  mobile: string;
  email?: string;
  joiningDate: string; // मूल कार्यभार ग्रहण तिथि
  postingDate?: string; // वर्तमान पदस्थापना दिनांक
  assignedSchoolUdise: string;
  assignedClasses: string[];
  duty: string;
  status: StaffStatus;
  qualification: string;
  dob: string;
  category: SocialCategory;
  caste?: string; // जाति
  aadhaarNumber?: string; // आधार नंबर (12 अंक)
  voterIdNumber?: string; // मतदाता परिचय पत्र (EPIC / Voter ID)
  teacherType?: TeacherType | string; // शिक्षक प्रकार (वर्ग 1 / वर्ग 2 / वर्ग 3 / अन्य)
  isBlo?: boolean | 'YES' | 'NO'; // बी.एल.ओ. दायित्व
  isCensus?: boolean | 'YES' | 'NO'; // जनगणना दायित्व
  isOd?: boolean | 'YES' | 'NO'; // अन्य शासकीय कर्तव्य / On Duty
  employmentType?: 'REGULAR' | 'GUEST' | 'CONTRACT' | 'OTHER' | string;
  sessionId?: string;
}

export type FacilityAvailability = 'YES' | 'NO' | 'UNKNOWN';
export type FacilityStatus = FacilityAvailability;
export type FacilityCondition = 'उत्कृष्ट' | 'संतोषजनक' | 'मरम्मत योग्य' | 'अनुपयोगी';

export interface PhysicalFacility {
  id?: string;
  schoolUdise: string;
  facilityKey: string;
  facilityName: string;
  available: FacilityAvailability;
  condition?: FacilityCondition;
  count?: number;
  usableCount?: number;
  repairRequiredCount?: number;
  details?: string;
  remarks?: string;
  requirementDetails?: string; // Reason/Need when available === 'NO'
  lastInspectionDate?: string;
  sessionId?: string;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  schoolUdise: string;
  sessionId?: string;
  type: 'STUDENT' | 'TEACHER' | 'STAFF' | 'PRINCIPAL' | 'RASOIYA';
  class?: string;
  totalCount: number;
  presentCount: number;
  absentCount: number;
  leaveCount?: number;
  onDutyCount?: number;
  isHoliday?: boolean;
  holidayReason?: string;
  percentage?: number;
  markedBy?: string;
  recordedBy?: string;
  markedAt?: string;
  remarks?: string;
  records?: {
    entityId: string;
    name: string;
    status: 'PRESENT' | 'ABSENT' | 'CL' | 'ML' | 'EL' | 'OD' | 'LEAVE';
    remarks?: string;
  }[];
}

export interface MDMRecord {
  id: string;
  date: string;
  schoolUdise: string;
  sessionId?: string;
  eligibleStudents: number;
  presentStudents: number;
  mealsServed: number;
  mealsNotServed: number;
  reasonNotServed?: string;
  cookPresent: boolean;
  shgName: string;
  wheatStockKg: number;
  riceStockKg: number;
  fuelAvailable: boolean;
  kitchenHygiene: 'उत्कृष्ट' | 'संतोषजनक' | 'सुधार आवश्यक';
  inspectedBy?: string;
  problemsReported?: string;
  menuItem?: string;
}

export interface Rasoiya {
  id: string;
  name: string; // रसोइया का नाम
  workLocation?: string; // कहाँ है / कार्यस्थल या वर्तमान स्थिति (उदा. विद्यालय मध्याह्न भोजन रसोई शेड)
  status?: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'; // स्थिति
  schoolUdise: string; // विद्यालय यूडाइस
  schoolName?: string; // विद्यालय का नाम
  bankAccount?: string; // Bank Account Number
  ifsc?: string; // IFSC
  bankName?: string; // बैंक का नाम
  branchName?: string; // बैंक शाखा
  mobile?: string; // Mobile Number
  aadhaarNumber?: string; // Aadhaar Card / Aadhaar Number
  gender?: 'FEMALE' | 'MALE' | 'OTHER'; // लिंग (महिला / पुरुष)
  category?: 'SC' | 'ST' | 'OBC' | 'GENERAL'; // सामाजिक संवर्ग
  caste?: string; // जाति
  joiningDate?: string; // कार्यभार ग्रहण दिनांक
  trainingStatus?: 'TRAINED' | 'UNTRAINED'; // पाककला प्रशिक्षण स्थिति (प्रशिक्षित / अप्रशिक्षित)
  healthCheckupStatus?: 'UP_TO_DATE' | 'REGULAR' | 'PENDING'; // स्वास्थ्य परीक्षण स्थिति (अद्यतन / नियमित / लंबित)
  lastHealthCheckupDate?: string; // अंतिम स्वास्थ्य परीक्षण दिनांक
  paymentStatus?: 'PAID' | 'PENDING' | 'PROCESSING'; // मानदेय भुगतान स्थिति
  monthlyHonorarium?: number; // मासिक मानदेय राशि
  samagraId?: string; // Samagra ID
  panNumber?: string; // PAN Number
  shgId?: string; // संबंधित समूह ID
  shgName?: string; // संबंधित समूह का नाम
  sessionId?: string;
  remarks?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SHGMember {
  id: string;
  name: string; // सदस्य का नाम
  role?: string; // पद/भूमिका (उदा. मुख्य रसोइया, सहायक रसोइया, सदस्य)
  mobile?: string;
  aadhaarNumber?: string;
  category?: string;
}

export interface SHG {
  id: string;
  name: string; // समूह का नाम
  presidentName: string; // समूह अध्यक्ष
  presidentMobile?: string;
  secretaryName: string; // समूह सचिव
  secretaryMobile?: string;
  members: SHGMember[]; // समूह सदस्य (Multiple member functionality)
  totalMembers?: number; // कुल सदस्य संख्या
  schoolUdise: string; // संबंधित विद्यालय यूडाइस
  schoolName?: string; // संबंधित विद्यालय का नाम
  accountNumber?: string; // Bank Account Number
  ifsc?: string;
  bankName?: string;
  branchName?: string; // बैंक शाखा
  registrationNumber?: string;
  formationDate?: string; // गठन दिनांक / Registration Date
  purpose?: string; // कार्य / उद्देश्य
  status?: 'ACTIVE' | 'INACTIVE';
  remarks?: string; // विशेष विवरण
  sessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type WorkStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type WorkPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GovernmentWork {
  id: string;
  workName: string;
  orderNumber: string;
  schoolUdise: string;
  sessionId?: string;
  description: string;
  assignedDate: string;
  dueDate: string;
  status: WorkStatus;
  priority: WorkPriority;
  responsiblePerson: string;
  completionDate?: string;
  documentUrl?: string;
  remarks?: string;
}

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'NORMAL';
export type NotificationTarget = 'ALL' | 'SELECTED_SCHOOLS' | 'SELECTED_ROLES';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  orderNumber?: string;
  date: string;
  priority: NotificationPriority;
  targetType: NotificationTarget;
  targetSchools?: string[];
  targetSchoolUdise?: string;
  targetRoles?: UserRole[];
  publishedBy: string;
  publishedByName: string;
  attachmentUrl?: string;
  dueDate?: string;
  readBy: string[]; // user IDs
  sessionId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type ComplaintCategory =
  | 'शिक्षक अनुपस्थिति/लेट'
  | 'मध्याह्न भोजन गुणवत्ता'
  | 'पेयजल/शौचालय समस्या'
  | 'भवन व विद्युत मरम्मत'
  | 'छात्रवृत्ति/गणवेश वितरण'
  | 'प्रशासनिक व अन्य';

export type ComplaintStatus =
  | 'OPEN'
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REOPENED'
  | 'RE_OPENED'
  | 'REJECTED';

export type ComplaintPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ComplaintHistoryItem {
  id?: string;
  action: 'CREATED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'STATUS_CHANGED' | 'UPDATED';
  date: string;
  dateTime?: string;
  timestamp?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  remark?: string;
  reason?: string;
  previousStatus?: string;
  newStatus?: string;
  resolutionOutcome?: string;
  forwardedTo?: string;
}

export interface Complaint {
  id: string;
  complaintId: string;
  schoolUdise: string;
  sessionId?: string;
  category: ComplaintCategory | string;
  subject: string;
  title?: string;
  description: string;
  submittedBy: string;
  complainantName?: string;
  submitterRole?: string;
  submitterMobile?: string;
  complainantMobile?: string;
  date: string; // Original complaint date (immutable on re-open)
  complaintDate?: string; // Alias for original complaint date
  createdAt?: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: string;
  actionTaken?: string;
  resolutionDate?: string;
  resolutionNotes?: string;
  remarks?: string;
  resolvedBy?: string;
  resolvedByName?: string;
  resolverRole?: string;
  resolutionOutcome?: 'RESOLVED' | 'PARTIAL' | 'FORWARDED' | string;
  forwardedToOfficer?: string;
  forwardedRemarks?: string;
  closeDate?: string; // Latest close date
  closedAt?: string;
  closedBy?: string;
  closedByName?: string;
  closerRole?: string;
  closeRemark?: string;
  reopenedDate?: string; // Latest re-open date
  reopenedBy?: string;
  reopenerRole?: string;
  reopenReason?: string; // Latest re-open reason
  complaintHistory?: ComplaintHistoryItem[]; // Full event history across reopen/close cycles
  updatedAt?: string;
}

export type DocumentCategory =
  | 'SCHOOL_DOC'
  | 'GOV_ORDER'
  | 'CIRCULAR'
  | 'CERTIFICATE'
  | 'INSPECTION'
  | 'MDM_DOC'
  | 'WORK_DOC'
  | 'STUDENT_DOC'
  | 'TEACHER_DOC'
  | 'OTHER';

export interface DocumentItem {
  id: string;
  title: string;
  schoolUdise: string | 'ALL';
  sessionId?: string;
  category: DocumentCategory;
  documentNumber?: string;
  date: string;
  uploadedBy: string;
  fileType: string;
  fileSize: string;
  fileUrl?: string;
  description?: string;
  fileName?: string;
  mimeType?: string;
  fileData?: string;
  fileSizeBytes?: number;
  uploadedAt?: string;
  hasStoredBinary?: boolean;
}

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'PRINT'
  | 'APPROVE'
  | 'REJECT'
  | 'UPLOAD'
  | 'STATUS_CHANGE'
  | 'SECURITY_ALERT'
  | 'SESSION_CREATE'
  | 'SESSION_CREATED'
  | 'SESSION_UPDATE'
  | 'SESSION_ACTIVATE'
  | 'SESSION_ACTIVATED'
  | 'SESSION_SWITCH'
  | 'SESSION_SWITCHED'
  | 'SESSION_LOCK'
  | 'SESSION_LOCKED'
  | 'SESSION_UNLOCKED'
  | 'SESSION_CLOSE'
  | 'SESSION_CLOSED'
  | 'SESSION_ARCHIVE'
  | 'SESSION_ARCHIVED'
  | 'SESSION_ACCESS_DENIED'
  | 'SESSION_DEACTIVATED'
  | 'SESSION_VISIBILITY_CHANGED'
  | 'SESSION_MUTATION_BLOCKED'
  | 'DUPLICATE_ACTIVE_ENROLLMENT'
  | 'STUDENT_PROMOTED'
  | 'STUDENT_REPEATED'
  | 'STUDENT_TRANSFERRED'
  | 'STUDENT_CARRIED_FORWARD'
  | 'STAFF_CARRIED_FORWARD'
  | 'DATA_IMPORTED'
  | 'HISTORICAL_DATA_EDITED'
  | 'LITERACY_EXAM_RESULT_CREATED'
  | 'LITERACY_EXAM_RESULT_UPDATED'
  | 'LITERACY_EXAM_RESULT_DELETED'
  | 'SCHOOL_CREATED'
  | 'SCHOOL_UPDATED'
  | 'SCHOOL_ARCHIVED'
  | 'SCHOOL_RESTORED'
  | 'SCHOOL_ACTIVATED'
  | 'SCHOOL_DEACTIVATED'
  | 'SCHOOL_PASSWORD_RESET'
  | 'ACCESS_DENIED'
  | 'USER_VIEWED'
  | 'USER_APPROVED'
  | 'USER_REJECTED'
  | 'USER_ACTIVATED'
  | 'USER_DEACTIVATED'
  | 'USER_ACCESS_RESET'
  | 'USER_ROLE_CHANGED'
  | 'USER_SCHOOL_ASSIGNED'
  | 'FEATURE_ENABLED'
  | 'FEATURE_DISABLED'
  | 'FEATURE_SCHEDULED_DEACTIVATION'
  | 'FEATURE_MANUAL_REACTIVATION'
  | 'FEATURE_DURATION_EXTENDED'
  | 'FEATURE_BULK_RESET';

export interface AuditLog {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  userId: string;
  userName: string;
  role: string;
  action: AuditAction;
  module: string;
  sessionId?: string;
  recordId?: string;
  recordName?: string;
  schoolUdise?: string;
  schoolName?: string;
  oldValue?: string;
  newValue?: string;
  before?: any;
  after?: any;
  reason?: string;
  entityType?: string;
  entityId?: string;
  details: string;
  ip?: string;
  userRole?: string;
  // Granular Feature Control Audit Fields
  featureKey?: string;
  controlType?: 'FEATURE' | 'SUB_OPTION' | 'ACTION' | string;
  targetRole?: 'CAC_ONLY' | 'SCHOOL_ONLY' | 'BOTH' | string;
  startTime?: string | null;
  endTime?: string | null;
  adminUid?: string;
}

export type PreAuthEventType =
  | 'FAILED_LOGIN'
  | 'AUTH_ATTEMPT'
  | 'AUTH_ERROR'
  | 'LOGIN_LOCKOUT'
  | 'UNKNOWN_USER'
  | 'SESSION_EXPIRED'
  | 'SESSION_TAMPERED';

export interface PreAuthSecurityEvent {
  eventId: string;
  eventType: PreAuthEventType;
  timestamp: string;
  sanitizedIdentifier: string;
  identifierHash?: string;
  success: boolean;
  reasonCode: string;
  source: string;
  details?: string;
}

export type UploadDataType =
  | 'SCHOOL'
  | 'STUDENT'
  | 'TEACHER'
  | 'FACILITY'
  | 'ATTENDANCE'
  | 'MDM'
  | 'COMPLAINT'
  | 'WORK'
  | 'LITERACY_LEARNERS'
  | 'LITERACY_VOLUNTEERS'
  | 'LITERACY_EXAMS'
  | 'LITERACY_PARTNERS';

export * from './literacy';
export * from './session';

export type DuplicateHandlingMode = 'ADD_NEW' | 'UPDATE_EXISTING' | 'SKIP_DUPLICATES';

export interface BulkImportResult {
  added: number;
  updated: number;
  skipped: number;
  securityRejected?: number;
  rejectedReasons?: string[];
}

export interface UploadHistoryItem {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  uploadedBy: string;
  userId: string;
  userRole: string;
  dataType: UploadDataType;
  dataTypeLabel: string;
  fileName: string;
  fileSize: string;
  totalRows: number;
  addedCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  securityRejectedCount?: number;
  rejectedReasons?: string[];
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED';
  duplicateMode?: DuplicateHandlingMode;
  targetSchools?: string[];
  remarks?: string;
}

export interface AppSettings {
  academicSession: string;
  sankulName: string;
  jskName: string;
  blockName: string;
  districtName: string;
  allowSelfRegistration: boolean;
  requireApprovalForRegistration: boolean;
  enableAuditLogging: boolean;
  defaultPrintOrientation: 'PORTRAIT' | 'LANDSCAPE';
}

export type WidgetCategory =
  | 'CORE_METRIC'
  | 'SECONDARY_METRIC'
  | 'ACTION_REQUIRED'
  | 'ANALYTICS'
  | 'QUICK_ACTION'
  | 'ACTIVITY';

export type WidgetStatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface DashboardMetricValue {
  mainValue: string | number;
  subValue?: string;
  badge?: {
    text: string;
    variant: WidgetStatusVariant;
  };
  breakdown?: Array<{
    label: string;
    count: number;
    color?: string;
  }>;
  isActionRequired?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export interface DashboardWidgetConfig {
  id: string;
  title: string;
  hindiTitle: string;
  subtitle?: string;
  category: WidgetCategory;
  iconName: string;
  route: string;
  order: number;
  allowedRoles?: UserRole[];
  schoolOnly?: boolean;
  clusterOnly?: boolean;
  accentColor?: string;
}

export interface DataCompletenessPillar {
  id: string;
  name: string;
  isComplete: boolean;
  details: string;
  scorePct: number;
  route: string;
}

export interface PendingActionItem {
  id: string;
  title: string;
  subtitle: string;
  count?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  route: string;
  iconName: string;
  buttonText: string;
}

