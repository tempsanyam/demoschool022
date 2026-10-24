import {
  CLUSTER_37_SCHOOLS,
  OFFICIAL_37_SCHOOL_USERS,
  OFFICIAL_37_SCHOOL_CREDENTIALS,
} from './clusterSchoolsData';
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
  DocumentItem,
  AuditLog,
  User,
  AppSettings,
  UploadHistoryItem,
  Rasoiya,
  SHG
} from '../types';

export const initialSettings: AppSettings = {
  academicSession: '2026-27',
  sankulName: 'संकुल मलगुवां',
  jskName: 'जन शिक्षा केंद्र मलगुवां',
  blockName: 'बलदेवगढ़',
  districtName: 'टीकमगढ़ (म.प्र.)',
  allowSelfRegistration: false,
  requireApprovalForRegistration: true,
  enableAuditLogging: true,
  defaultPrintOrientation: 'PORTRAIT',
};

export const initialAdminUsers: User[] = [
  {
    id: 'USR-ADMIN-01',
    username: 'SANYAMJAIN88',
    name: 'संयम जैन',
    role: 'ADMIN',
    employeeId: 'EMP-ADM-88',
    mobile: '9826088159',
    email: 'admin.malguwa@mp.gov.in',
    designation: 'मुख्य व्यवस्थापक (System Admin)',
    assignedSchoolUdise: '',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 09:00 AM',
    createdAt: '2025-01-01',
    block: 'बलदेवगढ़',
    district: 'टीकमगढ़',
  },
  {
    id: 'USR-CAC-01',
    username: 'Sanjayjain1979',
    name: 'संजय कुमार जैन',
    role: 'CAC',
    employeeId: 'EMP-CAC-201',
    mobile: '7000382532',
    alternateMobile: '9753679036',
    email: 'cac.malguwa@mp.gov.in',
    designation: 'संकुल समन्वयक (CAC)',
    assignedSchoolUdise: '',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 08:30 AM',
    createdAt: '2025-06-01',
    block: 'बलदेवगढ़',
    district: 'टीकमगढ़',
  },
  {
    id: 'USR-CAC-02',
    username: 'Sanmatijain99',
    name: 'सन्मति कुमार जैन',
    role: 'CAC',
    employeeId: 'EMP-CAC-202',
    mobile: '9977323573',
    alternateMobile: '9977323573',
    email: 'cac.sanmati@mp.gov.in',
    designation: 'संकुल समन्वयक (CAC)',
    assignedSchoolUdise: '',
    status: 'ACTIVE',
    lastLogin: '2026-08-31 08:15 AM',
    createdAt: '2025-06-01',
    block: 'बलदेवगढ़',
    district: 'टीकमगढ़',
  }
];

export const initialUsers: User[] = [
  ...initialAdminUsers,
  ...OFFICIAL_37_SCHOOL_USERS,
];

// All 37 Official Schools for Jan Shiksha Kendra Malguwa
export const initialSchools: School[] = CLUSTER_37_SCHOOLS;

// All 22 Physical Facilities Master definition (Canonical Facility Reference)
export const facilityMasterList = [
  { key: 'building', name: 'भवन (Building)' },
  { key: 'rooms', name: 'कुल कक्ष (Total Rooms)' },
  { key: 'classrooms', name: 'अध्यापन कक्ष (Classrooms)' },
  { key: 'toilets', name: 'शौचालय सुविधा (Toilets)' },
  { key: 'drinkingWater', name: 'पेयजल सुविधा (Drinking Water)' },
  { key: 'electricity', name: 'विद्युत संयोजन (Electricity)' },
  { key: 'furniture', name: 'फर्नीचर/डेस्क-बेंच (Furniture)' },
  { key: 'boundaryWall', name: 'चारदीवारी/बाउंड्री वॉल (Boundary Wall)' },
  { key: 'playground', name: 'खेल का मैदान (Playground)' },
  { key: 'ramp', name: 'दिव्यांग रैंप व रेलिंग (Ramp with Railing)' },
  { key: 'kitchen', name: 'रसोई शेड (Kitchen Shed)' },
  { key: 'poshanVatika', name: 'पोषण वाटिका (Poshan Vatika)' },
  { key: 'playEquipment', name: 'खेल सामग्री (Play Equipment)' },
  { key: 'laboratory', name: 'विज्ञान प्रयोगशाला (Laboratory)' },
  { key: 'library', name: 'पुस्तकालय/रीडिंग कॉर्नर (Library)' },
  { key: 'ict', name: 'कंप्यूटर/ICT लैब (ICT Facility)' },
  { key: 'internet', name: 'इंटरनेट कनेक्टिविटी (Internet)' },
  { key: 'handwash', name: 'हैंडवॉश यूनिट (Handwash Unit)' },
  { key: 'safety', name: 'अग्नि सुरक्षा उपकरण (Fire Safety)' },
  { key: 'communication', name: 'साउंड सिस्टम/माइक (Sound System)' },
  { key: 'sanitation', name: 'कूड़ेदान व स्वच्छता (Sanitation/Dustbin)' },
  { key: 'otherFacilities', name: 'अन्य सुविधाएं (Other Facilities)' }
];

// CLEAN INITIAL COLLECTIONS — READY FOR VERIFIED REAL DATA ENTRY
export const initialStudents: Student[] = [];
export const initialStaff: Staff[] = [];
export const initialFacilities: PhysicalFacility[] = [];
export const initialAttendance: AttendanceRecord[] = [];
export const initialMDM: MDMRecord[] = [];
export const initialGovernmentWork: GovernmentWork[] = [];

// Clean Notifications & Circulars (Ready for real announcements)
export const initialNotifications: NotificationItem[] = [];

export const initialComplaints: Complaint[] = [];
export const initialDocuments: DocumentItem[] = [];

// Audit Trail with Complete System Cleanup Record
export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-CLEANUP-001',
    timestamp: '2026-10-20T10:00:00.000Z',
    date: '20/10/2026',
    time: '10:00 AM',
    userId: 'USR-ADMIN-01',
    userName: 'संयम जैन',
    role: 'ADMIN',
    action: 'DELETE',
    module: 'System Cleanup',
    details: 'जन शिक्षा केंद्र मलगुवां: संपूर्ण डेटा वाइप पूर्ण। 37 शाला मास्टर व प्रशासनिक प्रणाली सुरक्षित। वास्तविक डेटा प्रविष्टि हेतु प्रणाली पूर्णतः तैयार।',
    ip: '192.168.1.1',
  },
  {
    id: 'AUD-SYS-002',
    timestamp: '2026-08-30T09:30:00.000Z',
    date: '30/08/2026',
    time: '09:30 AM',
    userId: 'USR-CAC-01',
    userName: 'संजय कुमार जैन',
    role: 'CAC',
    action: 'LOGIN',
    module: 'Authentication',
    details: 'जन शिक्षक संजय कुमार जैन द्वारा संकुल प्रणाली का अधिकृत प्रमाणीकरण।',
    ip: '192.168.1.102',
  }
];

export const initialUploadHistory: UploadHistoryItem[] = [];
export const initialSHGs: SHG[] = [];
export const initialRasoiya: Rasoiya[] = [];
