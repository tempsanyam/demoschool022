export type UserRole = 'CAC' | 'PRINCIPAL' | 'TEACHER' | 'OPERATOR' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED';

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
  status: UserStatus;
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
  status: 'ACTIVE' | 'INACTIVE';
  totalRooms?: number;
  totalClassrooms?: number;
}

export type Gender = 'बालक' | 'बालिका' | 'अन्य';
export type SocialCategory = 'SC' | 'ST' | 'OBC' | 'GENERAL';
export type StudentStatus = 'ACTIVE' | 'TC_ISSUED' | 'DROPOUT';

export interface Student {
  id: string;
  srNumber: string;
  samagraId: string;
  apaarId: string;
  name: string;
  fatherName: string;
  motherName: string;
  gender: Gender;
  dob: string;
  class: string;
  section: string;
  category: SocialCategory;
  isCwsn: boolean;
  cwsnType?: string;
  schoolUdise: string;
  address: string;
  mobile: string;
  status: StudentStatus;
  admissionDate: string;
  bankAccount?: {
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
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
  | 'सफाई कर्मचारी'
  | 'सहायक ग्रेड-3';

export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'TRANSFERRED';

export interface Staff {
  id: string;
  employeeId: string;
  employeeCode?: string;
  name: string;
  gender: Gender;
  designation: StaffDesignation;
  subject: string;
  mobile: string;
  email?: string;
  joiningDate: string;
  assignedSchoolUdise: string;
  assignedClasses: string[];
  duty: string;
  status: StaffStatus;
  qualification: string;
  dob: string;
  category: SocialCategory;
  employmentType?: 'REGULAR' | 'GUEST' | 'CONTRACT' | 'OTHER' | string;
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
}

export interface AttendanceRecord {
  id: string;
  date: string;
  schoolUdise: string;
  type: 'STUDENT' | 'TEACHER' | 'PRINCIPAL' | 'RASOIYA';
  class?: string;
  totalCount: number;
  presentCount: number;
  absentCount: number;
  leaveCount?: number;
  onDutyCount?: number;
  markedBy: string;
  markedAt: string;
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

export type WorkStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type WorkPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GovernmentWork {
  id: string;
  workName: string;
  orderNumber: string;
  schoolUdise: string;
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
  targetRoles?: UserRole[];
  publishedBy: string;
  publishedByName: string;
  attachmentUrl?: string;
  dueDate?: string;
  readBy: string[]; // user IDs
}

export type ComplaintCategory =
  | 'शिक्षक अनुपस्थिति/लेट'
  | 'मध्याह्न भोजन गुणवत्ता'
  | 'पेयजल/शौचालय समस्या'
  | 'भवन व विद्युत मरम्मत'
  | 'छात्रवृत्ति/गणवेश वितरण'
  | 'प्रशासनिक व अन्य';

export type ComplaintStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
export type ComplaintPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Complaint {
  id: string;
  complaintId: string;
  schoolUdise: string;
  category: ComplaintCategory;
  subject: string;
  description: string;
  submittedBy: string;
  submitterRole: string;
  submitterMobile: string;
  date: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  assignedTo?: string;
  actionTaken?: string;
  resolutionDate?: string;
  remarks?: string;
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
  category: DocumentCategory;
  documentNumber?: string;
  date: string;
  uploadedBy: string;
  fileType: string;
  fileSize: string;
  fileUrl?: string;
  description?: string;
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
  | 'STATUS_CHANGE';

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
  recordId?: string;
  recordName?: string;
  schoolUdise?: string;
  schoolName?: string;
  oldValue?: string;
  newValue?: string;
  details: string;
  ip?: string;
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
