import { UserRole } from '../types';

export type ControllableRole = 'CAC' | 'SCHOOL';
export type ControlTargetScope = 'CAC' | 'SCHOOL' | 'BOTH';

export type ControlItemType = 'MODULE' | 'SUB_OPTION' | 'ACTION';

export interface FeatureControlSchedule {
  enabled: boolean;
  startTime?: string | null; // ISO string
  endTime?: string | null;   // ISO string
  startTimeMs?: number | null; // Authoritative epoch ms for Firestore rules & server-anchored evaluation
  endTimeMs?: number | null;   // Authoritative epoch ms for Firestore rules & server-anchored evaluation
  autoReactivate: boolean;
}

export interface FeatureControlItemConfig {
  key: string;
  labelHi: string;
  labelEn: string;
  descriptionHi: string;
  moduleKey: string;
  parentKey?: string;
  itemType: ControlItemType;
  routeId?: string;
  defaultCacEnabled: boolean;
  defaultSchoolEnabled: boolean;
  cacApplicable: boolean;
  schoolApplicable: boolean;
}

export interface FeatureControlRule {
  key: string;
  cacEnabled: boolean;
  schoolEnabled: boolean;
  scheduleCac?: FeatureControlSchedule;
  scheduleSchool?: FeatureControlSchedule;
  reason?: string;
  customMessage?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
}

export interface FeatureControlStore {
  version: number;
  updatedAt: string;
  updatedBy: string;
  updatedByName: string;
  rules: Record<string, FeatureControlRule>;
}

/**
 * Comprehensive Registry of all REAL Modules, Sub-Options, and Granular Actions
 * in the Sankul Management System (जन शिक्षा केंद्र प्रबंधन प्रणाली).
 *
 * Hierarchy:
 * - MODULE (Level 1): Sidebar & Top-level Route
 * - SUB_OPTION (Level 2): Sub-tabs, Views, Filters, Sections inside a Module
 * - ACTION (Level 3): Specific Buttons (Add, Edit, Delete, Print, Export, Upload, etc.)
 */
export const FEATURE_CONTROL_REGISTRY: FeatureControlItemConfig[] = [
  // ============================================================================
  // 1. DASHBOARD (डैशबोर्ड)
  // ============================================================================
  {
    key: 'module.dashboard',
    labelHi: 'डैशबोर्ड (Dashboard)',
    labelEn: 'Dashboard Module',
    descriptionHi: 'मुख्य संकुल एवं शाला डैशबोर्ड दृश्य',
    moduleKey: 'module.dashboard',
    itemType: 'MODULE',
    routeId: 'dashboard',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.dashboard.sub.kpi_cards',
    labelHi: 'मुख्य सांख्यिकी कार्ड (KPI Summary Cards)',
    labelEn: 'KPI Summary Cards',
    descriptionHi: 'डैशबोर्ड पर कुल शालाएं, छात्र, शिक्षक, उपस्थिति व एमडीएम कार्ड',
    moduleKey: 'module.dashboard',
    parentKey: 'module.dashboard',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.dashboard.sub.pending_actions',
    labelHi: 'लंबित कार्यवाही एवं अलर्ट (Pending Actions & Alerts)',
    labelEn: 'Pending Actions & Alerts Panel',
    descriptionHi: 'अपूर्ण उपस्थिति, लंबित शिकायतें व अतिदेय शासकीय कार्य अलर्ट',
    moduleKey: 'module.dashboard',
    parentKey: 'module.dashboard',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.dashboard.sub.analytics_charts',
    labelHi: 'विश्लेषण चार्ट एवं डेटा पूर्णता (Analytics & Data Completeness)',
    labelEn: 'Analytics Charts & Data Completeness',
    descriptionHi: 'नामांकन, उपस्थिति ग्राफ तथा शाला डेटा पूर्णता सूचकांक',
    moduleKey: 'module.dashboard',
    parentKey: 'module.dashboard',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.dashboard.action.quick_entry',
    labelHi: '+ त्वरित प्रविष्टि बटन (Quick Entry Action)',
    labelEn: 'Header & Dashboard Quick Entry',
    descriptionHi: 'शीर्ष बार एवं डैशबोर्ड से त्वरित नई प्रविष्टि करना',
    moduleKey: 'module.dashboard',
    parentKey: 'module.dashboard',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.dashboard.action.print_summary',
    labelHi: 'डैशबोर्ड प्रिंट / एक्सपोर्ट (Print Dashboard Summary)',
    labelEn: 'Print Dashboard Summary',
    descriptionHi: 'डैशबोर्ड सारांश रिपोर्ट प्रिंट करना',
    moduleKey: 'module.dashboard',
    parentKey: 'module.dashboard',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 2. SCHOOLS (शाला निर्देशिका / हमारी शाला)
  // ============================================================================
  {
    key: 'module.schools',
    labelHi: 'शाला निर्देशिका / हमारी शाला (Schools Directory)',
    labelEn: 'Schools Module',
    descriptionHi: 'संकुल की समस्त शालाओं की निर्देशिका एवं शाला प्रोफाइल',
    moduleKey: 'module.schools',
    itemType: 'MODULE',
    routeId: 'schools',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.schools.sub.profile_details',
    labelHi: 'शाला विस्तृत प्रोफाइल एवं शैक्षणिक इतिहास (School Detail & Academic History)',
    labelEn: 'School Profile & Multi-Year History',
    descriptionHi: 'शाला का संपूर्ण विवरण एवं सत्रवार शैक्षणिक इतिहास देखना',
    moduleKey: 'module.schools',
    parentKey: 'module.schools',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.schools.sub.archive_vault',
    labelHi: 'निष्क्रिय / आर्काइव शाला वॉल्ट (Archived Schools Vault)',
    labelEn: 'Archived Schools Vault',
    descriptionHi: 'बंद या आर्काइव की गई शालाओं की सूची देखना',
    moduleKey: 'module.schools',
    parentKey: 'module.schools',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.schools.action.add',
    labelHi: 'नई शाला जोड़ें (Add New School)',
    labelEn: 'Add School Button',
    descriptionHi: 'संकुल में नवीन विद्यालय पंजीकृत करना',
    moduleKey: 'module.schools',
    parentKey: 'module.schools',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.schools.action.edit',
    labelHi: 'शाला विवरण संपादित करें (Edit School Profile)',
    labelEn: 'Edit School Button',
    descriptionHi: 'शाला का नाम, प्रभारी, मोबाइल व संपर्क विवरण अपडेट करना',
    moduleKey: 'module.schools',
    parentKey: 'module.schools',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.schools.action.print_export',
    labelHi: 'शाला सूची प्रिंट एवं एक्सपोर्ट (Print & Export Schools)',
    labelEn: 'Print & Export Schools',
    descriptionHi: 'शाला निर्देशिका अथवा शाला प्रोफाइल प्रिंट/एक्सपोर्ट करना',
    moduleKey: 'module.schools',
    parentKey: 'module.schools',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 3. STUDENTS (छात्र प्रबंधन)
  // ============================================================================
  {
    key: 'module.students',
    labelHi: 'छात्र प्रबंधन (Students Management)',
    labelEn: 'Students Module',
    descriptionHi: 'छात्र नामांकन, समग्र/अपार आईडी, कक्षोन्नति एवं टीसी प्रबंधन',
    moduleKey: 'module.students',
    itemType: 'MODULE',
    routeId: 'students',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.students.sub.directory',
    labelHi: 'छात्र नामांकन सूची (Student Enrollment Directory)',
    labelEn: 'Student Directory Tab',
    descriptionHi: 'कक्षावार एवं संवर्गवार छात्र सूची देखना व खोजना',
    moduleKey: 'module.students',
    parentKey: 'module.students',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.students.sub.promotion_tc',
    labelHi: 'कक्षोन्नति एवं स्थानांतरण / टीसी (Promotion & TC Management)',
    labelEn: 'Student Promotion & TC Tab',
    descriptionHi: 'वार्षिक कक्षोन्नति (Promotion) एवं शाला स्थानांतरण/TC जारी करना',
    moduleKey: 'module.students',
    parentKey: 'module.students',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.students.action.add',
    labelHi: 'नया छात्र जोड़ें (Add New Student)',
    labelEn: 'Add Student Action',
    descriptionHi: 'नवीन छात्र का नामांकन दर्ज करना',
    moduleKey: 'module.students',
    parentKey: 'module.students',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.students.action.edit',
    labelHi: 'छात्र विवरण संपादित करें (Edit Student)',
    labelEn: 'Edit Student Action',
    descriptionHi: 'छात्र की प्रोफाइल, समग्र, अपार, बैंक खाता या लाभ अपडेट करना',
    moduleKey: 'module.students',
    parentKey: 'module.students',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.students.action.delete',
    labelHi: 'छात्र रिकॉर्ड हटाएं (Delete Student)',
    labelEn: 'Delete Student Action',
    descriptionHi: 'छात्र प्रविष्टि को हटाना',
    moduleKey: 'module.students',
    parentKey: 'module.students',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.students.action.print_export',
    labelHi: 'छात्र सूची प्रिंट एवं एक्सपोर्ट (Print & Export Students)',
    labelEn: 'Print & Export Students',
    descriptionHi: 'छात्र पंजी का प्रिंट या एक्सेल/CSV डाउनलोड करना',
    moduleKey: 'module.students',
    parentKey: 'module.students',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 4. TEACHERS / STAFF (शिक्षक एवं स्टाफ)
  // ============================================================================
  {
    key: 'module.teachers',
    labelHi: 'शिक्षक एवं स्टाफ (Teachers & Staff)',
    labelEn: 'Teachers & Staff Module',
    descriptionHi: 'शिक्षकों व कर्मचारियों की पदस्थापना, योग्यता व शासकीय दायित्व (BLO/जनगणना)',
    moduleKey: 'module.teachers',
    itemType: 'MODULE',
    routeId: 'teachers',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.teachers.sub.duty_filter',
    labelHi: 'बी.एल.ओ. / जनगणना / अन्य ड्यूटी फ़िल्टर (BLO & Duty Filters)',
    labelEn: 'Staff Duty Filters & Analytics',
    descriptionHi: 'BLO, जनगणना व अन्य शासकीय ड्यूटी वाले शिक्षकों का वर्गीकरण',
    moduleKey: 'module.teachers',
    parentKey: 'module.teachers',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.teachers.action.add',
    labelHi: 'नया शिक्षक/स्टाफ जोड़ें (Add Teacher/Staff)',
    labelEn: 'Add Staff Action',
    descriptionHi: 'नवीन शिक्षक या कर्मचारी का पंजीकरण करना',
    moduleKey: 'module.teachers',
    parentKey: 'module.teachers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.teachers.action.edit',
    labelHi: 'शिक्षक विवरण संपादित करें (Edit Teacher/Staff)',
    labelEn: 'Edit Staff Action',
    descriptionHi: 'शिक्षक का पदनाम, विषय, मोबाइल, BLO स्थिति आदि अपडेट करना',
    moduleKey: 'module.teachers',
    parentKey: 'module.teachers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.teachers.action.delete',
    labelHi: 'शिक्षक रिकॉर्ड हटाएं (Delete Teacher/Staff)',
    labelEn: 'Delete Staff Action',
    descriptionHi: 'शिक्षक/कर्मचारी प्रविष्टि को हटाना',
    moduleKey: 'module.teachers',
    parentKey: 'module.teachers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.teachers.action.print_export',
    labelHi: 'शिक्षक सूची प्रिंट एवं एक्सपोर्ट (Print & Export Staff)',
    labelEn: 'Print & Export Staff',
    descriptionHi: 'शिक्षक निर्देशिका प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.teachers',
    parentKey: 'module.teachers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 5. ATTENDANCE (दैनिक उपस्थिति)
  // ============================================================================
  {
    key: 'module.attendance',
    labelHi: 'दैनिक उपस्थिति (Daily Attendance)',
    labelEn: 'Attendance Module',
    descriptionHi: 'छात्र, शिक्षक, प्राचार्य एवं रसोइया की दैनिक व मासिक उपस्थिति पंजी',
    moduleKey: 'module.attendance',
    itemType: 'MODULE',
    routeId: 'attendance',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.attendance.sub.student_attendance',
    labelHi: 'छात्र उपस्थिति टैब (Student Attendance Tab)',
    labelEn: 'Student Attendance Tab',
    descriptionHi: 'कक्षावार छात्र उपस्थिति दर्ज करना व देखना',
    moduleKey: 'module.attendance',
    parentKey: 'module.attendance',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.attendance.sub.staff_attendance',
    labelHi: 'शिक्षक एवं कर्मचारी उपस्थिति टैब (Staff Attendance Tab)',
    labelEn: 'Staff Attendance Tab',
    descriptionHi: 'शिक्षक एवं प्राचार्य की उपस्थिति व अवकाश (CL/ML/OD) दर्ज करना',
    moduleKey: 'module.attendance',
    parentKey: 'module.attendance',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.attendance.sub.rasoiya_attendance',
    labelHi: 'रसोइया उपस्थिति टैब (Rasoiya Attendance Tab)',
    labelEn: 'Rasoiya Attendance Tab',
    descriptionHi: 'मध्याह्न भोजन रसोइया की दैनिक उपस्थिति दर्ज करना व देखना',
    moduleKey: 'module.attendance',
    parentKey: 'module.attendance',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.attendance.sub.cac_monitoring',
    labelHi: 'संकुल दैनिक उपस्थिति मॉनिटरिंग (CAC Attendance Monitoring)',
    labelEn: 'CAC Attendance Monitoring View',
    descriptionHi: 'संकुल की समस्त शालाओं की लाइव दैनिक उपस्थिति मॉनिटरिंग',
    moduleKey: 'module.attendance',
    parentKey: 'module.attendance',
    itemType: 'SUB_OPTION',
    routeId: 'cac-attendance-monitoring',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.attendance.sub.monthly_register',
    labelHi: 'मासिक उपस्थिति रजिस्टर दृश्य (Monthly Attendance Matrix)',
    labelEn: 'Monthly Register View',
    descriptionHi: 'पूरे माह का उपस्थिति कैलेंडर/रजिस्टर देखना',
    moduleKey: 'module.attendance',
    parentKey: 'module.attendance',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.attendance.action.mark_save',
    labelHi: 'उपस्थिति दर्ज / संशोधित करें (Mark & Save Attendance)',
    labelEn: 'Mark & Save Attendance Action',
    descriptionHi: 'दैनिक उपस्थिति या अवकाश सहेजना/अपडेट करना',
    moduleKey: 'module.attendance',
    parentKey: 'module.attendance',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.attendance.action.print_export',
    labelHi: 'उपस्थिति रिपोर्ट प्रिंट एवं एक्सपोर्ट (Print & Export Attendance)',
    labelEn: 'Print & Export Attendance',
    descriptionHi: 'दैनिक या मासिक उपस्थिति पत्रक प्रिंट/एक्सपोर्ट करना',
    moduleKey: 'module.attendance',
    parentKey: 'module.attendance',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 6. MDM (मध्याह्न भोजन - MDM)
  // ============================================================================
  {
    key: 'module.mdm',
    labelHi: 'मध्याह्न भोजन (PM POSHAN - MDM)',
    labelEn: 'MDM Module',
    descriptionHi: 'दैनिक मध्याह्न भोजन वितरण, खाद्यान्न स्टॉक एवं रसोई स्वच्छता पंजी',
    moduleKey: 'module.mdm',
    itemType: 'MODULE',
    routeId: 'mdm',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.mdm.sub.stock_monitoring',
    labelHi: 'खाद्यान्न स्टॉक एवं स्वच्छता निगरानी (Grain Stock & Hygiene)',
    labelEn: 'Grain Stock & Kitchen Hygiene View',
    descriptionHi: 'गेहूं/चावल स्टॉक एवं रसोई स्वच्छता स्थिति देखना',
    moduleKey: 'module.mdm',
    parentKey: 'module.mdm',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.mdm.action.add_edit',
    labelHi: 'एमडीएम दैनिक प्रविष्टि जोड़ें / सुधारें (Add/Edit MDM Entry)',
    labelEn: 'Add/Edit MDM Record Action',
    descriptionHi: 'दैनिक लाभान्वित छात्र संख्या, मेनू व खाद्यान्न स्टॉक दर्ज करना',
    moduleKey: 'module.mdm',
    parentKey: 'module.mdm',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.mdm.action.delete',
    labelHi: 'एमडीएम प्रविष्टि हटाएं (Delete MDM Entry)',
    labelEn: 'Delete MDM Record Action',
    descriptionHi: 'मध्याह्न भोजन रिकॉर्ड हटाना',
    moduleKey: 'module.mdm',
    parentKey: 'module.mdm',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.mdm.action.print_export',
    labelHi: 'एमडीएम रिपोर्ट प्रिंट एवं एक्सपोर्ट (Print & Export MDM)',
    labelEn: 'Print & Export MDM',
    descriptionHi: 'मध्याह्न भोजन पंजी प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.mdm',
    parentKey: 'module.mdm',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 7. RASOIYA (रसोइया प्रबंधन)
  // ============================================================================
  {
    key: 'module.rasoiya',
    labelHi: 'रसोइया प्रबंधन (Cook-cum-Helper Management)',
    labelEn: 'Rasoiya Module',
    descriptionHi: 'विद्यालय में कार्यरत रसोइयों का विवरण, मानदेय व बैंक खाता प्रबंधन',
    moduleKey: 'module.rasoiya',
    itemType: 'MODULE',
    routeId: 'rasoiya',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.rasoiya.action.add',
    labelHi: 'नया रसोइया जोड़ें (Add Rasoiya)',
    labelEn: 'Add Rasoiya Action',
    descriptionHi: 'नवीन रसोइया का पंजीकरण करना',
    moduleKey: 'module.rasoiya',
    parentKey: 'module.rasoiya',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.rasoiya.action.edit',
    labelHi: 'रसोइया विवरण संपादित करें (Edit Rasoiya)',
    labelEn: 'Edit Rasoiya Action',
    descriptionHi: 'रसोइया का बैंक खाता, मानदेय स्थिति व मोबाइल नंबर अपडेट करना',
    moduleKey: 'module.rasoiya',
    parentKey: 'module.rasoiya',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.rasoiya.action.delete',
    labelHi: 'रसोइया रिकॉर्ड हटाएं (Delete Rasoiya)',
    labelEn: 'Delete Rasoiya Action',
    descriptionHi: 'रसोइया की प्रविष्टि हटाना',
    moduleKey: 'module.rasoiya',
    parentKey: 'module.rasoiya',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.rasoiya.action.print_export',
    labelHi: 'रसोइया सूची प्रिंट एवं एक्सपोर्ट (Print & Export Rasoiya)',
    labelEn: 'Print & Export Rasoiya',
    descriptionHi: 'रसोइया पंजी प्रिंट या डाउनलोड करना',
    moduleKey: 'module.rasoiya',
    parentKey: 'module.rasoiya',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 8. SHG (स्व-सहायता समूह प्रबंधन)
  // ============================================================================
  {
    key: 'module.shg',
    labelHi: 'स्व-सहायता समूह (Self-Help Groups - SHG)',
    labelEn: 'SHG Module',
    descriptionHi: 'मध्याह्न भोजन एवं गणवेश से जुड़े स्व-सहायता समूहों का प्रबंधन',
    moduleKey: 'module.shg',
    itemType: 'MODULE',
    routeId: 'shg',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.shg.action.add',
    labelHi: 'नया समूह जोड़ें (Add SHG)',
    labelEn: 'Add SHG Action',
    descriptionHi: 'नवीन स्व-सहायता समूह पंजीकृत करना',
    moduleKey: 'module.shg',
    parentKey: 'module.shg',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.shg.action.edit',
    labelHi: 'समूह विवरण संपादित करें (Edit SHG)',
    labelEn: 'Edit SHG Action',
    descriptionHi: 'अध्यक्ष, सचिव, बैंक खाता व सदस्यों की जानकारी अपडेट करना',
    moduleKey: 'module.shg',
    parentKey: 'module.shg',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.shg.action.delete',
    labelHi: 'समूह हटाएं (Delete SHG)',
    labelEn: 'Delete SHG Action',
    descriptionHi: 'स्व-सहायता समूह रिकॉर्ड हटाना',
    moduleKey: 'module.shg',
    parentKey: 'module.shg',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.shg.action.print_export',
    labelHi: 'समूह सूची प्रिंट एवं एक्सपोर्ट (Print & Export SHG)',
    labelEn: 'Print & Export SHG',
    descriptionHi: 'स्व-सहायता समूह सूची प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.shg',
    parentKey: 'module.shg',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 9. FACILITIES (भौतिक सुविधाएं)
  // ============================================================================
  {
    key: 'module.facilities',
    labelHi: 'भौतिक सुविधाएं (Physical Facilities)',
    labelEn: 'Physical Facilities Module',
    descriptionHi: 'विद्यालय भवन, पेयजल, शौचालय, विद्युत, खेल मैदान व फर्नीचर की स्थिति',
    moduleKey: 'module.facilities',
    itemType: 'MODULE',
    routeId: 'facilities',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.facilities.sub.gap_analysis',
    labelHi: 'सुविधा अभाव एवं आवश्यकता विश्लेषण (Deficit / Gap Analysis)',
    labelEn: 'Facility Deficit Analysis',
    descriptionHi: 'अनुपलब्ध या मरम्मत योग्य सुविधाओं का विश्लेषण देखना',
    moduleKey: 'module.facilities',
    parentKey: 'module.facilities',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.facilities.action.update',
    labelHi: 'भौतिक सुविधा स्थिति अपडेट करें (Update Facility Status)',
    labelEn: 'Update Facility Action',
    descriptionHi: 'सुविधा की उपलब्धता (हाँ/नहीं), स्थिति व मांग विवरण सहेजना',
    moduleKey: 'module.facilities',
    parentKey: 'module.facilities',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.facilities.action.print_export',
    labelHi: 'सुविधा रिपोर्ट प्रिंट एवं एक्सपोर्ट (Print & Export Facilities)',
    labelEn: 'Print & Export Facilities',
    descriptionHi: 'भौतिक सुविधा मूल्यांकन पत्रक प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.facilities',
    parentKey: 'module.facilities',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 10. LITERACY (नवभारत साक्षरता कार्यक्रम)
  // ============================================================================
  {
    key: 'module.literacy',
    labelHi: 'नवभारत साक्षरता कार्यक्रम (NILP Literacy Program)',
    labelEn: 'Literacy Program Module',
    descriptionHi: 'नवभारत साक्षरता डैशबोर्ड, असाक्षर चिन्हांकन, अक्षर साथी व परीक्षा परिणाम',
    moduleKey: 'module.literacy',
    itemType: 'MODULE',
    routeId: 'literacy-dashboard',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy.sub.registers',
    labelHi: 'साक्षरता सर्वे एवं पंजी (Literacy Survey Registers)',
    labelEn: 'Literacy Registers Sub-module',
    descriptionHi: 'ग्राम/वार्ड साक्षरता सर्वे रजिस्टर प्रबंधन',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy',
    itemType: 'SUB_OPTION',
    routeId: 'literacy-registers',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy.sub.learners',
    labelHi: 'असाक्षर / शिक्षार्थी सूची (Illiterate Learners Directory)',
    labelEn: 'Illiterate Persons Sub-module',
    descriptionHi: 'चिन्हांकित असाक्षर व्यक्तियों (15+ आयु वर्ग) की सूची',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy',
    itemType: 'SUB_OPTION',
    routeId: 'illiterate-persons',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy.sub.volunteers',
    labelHi: 'अक्षर साथी / स्वयंसेवक (Akshar Sathi Volunteers)',
    labelEn: 'Akshar Sathi Sub-module',
    descriptionHi: 'साक्षरता स्वयंसेवकों (अक्षर साथी) का पंजीकरण व मैपिंग',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy',
    itemType: 'SUB_OPTION',
    routeId: 'akshar-sathi',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy.sub.exams',
    labelHi: 'साक्षरता परीक्षा परिणाम (FLNAT Exam Results)',
    labelEn: 'Literacy Exam Results Sub-module',
    descriptionHi: 'बुनियादी साक्षरता एवं संख्याज्ञान परीक्षा परिणाम प्रविष्टि',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy',
    itemType: 'SUB_OPTION',
    routeId: 'exam-results',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy.sub.institutions',
    labelHi: 'सहयोगी संस्थाएं (Supporting Institutions)',
    labelEn: 'Supporting Institutions Sub-module',
    descriptionHi: 'साक्षरता कार्यक्रम में सहयोगी संस्थाओं का विवरण',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy',
    itemType: 'SUB_OPTION',
    routeId: 'supporting-institutions',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy.sub.reports',
    labelHi: 'साक्षरता रिपोर्ट केंद्र (Literacy Analytical Reports)',
    labelEn: 'Literacy Reports Sub-module',
    descriptionHi: 'उल्लास नवभारत साक्षरता कार्यक्रम की समेकित प्रगति एवं मूल्यांकन रिपोर्ट',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy',
    itemType: 'SUB_OPTION',
    routeId: 'literacy-reports',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy.action.print_export',
    labelHi: 'साक्षरता डैशबोर्ड प्रिंट एवं एक्सपोर्ट (Print & Export Literacy Dashboard)',
    labelEn: 'Print & Export Literacy',
    descriptionHi: 'साक्षरता डैशबोर्ड पत्रक प्रिंट या एक्सेल डाउनलोड करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  // Granular Literacy Sub-Module Actions
  {
    key: 'module.literacy-register.action.edit',
    labelHi: 'साक्षरता पंजी प्रविष्टि जोड़ें / सुधारें (Add/Edit Literacy Register)',
    labelEn: 'Edit Literacy Register Action',
    descriptionHi: 'साक्षरता सर्वे पंजी में रिकॉर्ड जोड़ना या संशोधित करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.registers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-register.action.delete',
    labelHi: 'साक्षरता पंजी रिकॉर्ड हटाएं (Delete Literacy Register)',
    labelEn: 'Delete Literacy Register Action',
    descriptionHi: 'साक्षरता पंजी से प्रविष्टि हटाना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.registers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-register.action.print_export',
    labelHi: 'साक्षरता पंजी प्रिंट एवं एक्सपोर्ट (Print/Export Literacy Register)',
    labelEn: 'Print/Export Literacy Register Action',
    descriptionHi: 'साक्षरता पंजी प्रपत्र प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.registers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-learners.action.add',
    labelHi: 'नया असाक्षर व्यक्ति जोड़ें (Add Illiterate Learner)',
    labelEn: 'Add Learner Action',
    descriptionHi: 'नवीन असाक्षर व्यक्ति का पंजीकरण करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.learners',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-learners.action.edit',
    labelHi: 'असाक्षर व्यक्ति विवरण सुधारें (Edit Illiterate Learner)',
    labelEn: 'Edit Learner Action',
    descriptionHi: 'असाक्षर व्यक्ति की जानकारी एवं मैपिंग अपडेट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.learners',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-learners.action.delete',
    labelHi: 'असाक्षर व्यक्ति रिकॉर्ड हटाएं (Delete Illiterate Learner)',
    labelEn: 'Delete Learner Action',
    descriptionHi: 'असाक्षर सूची से रिकॉर्ड हटाना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.learners',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-learners.action.print_export',
    labelHi: 'असाक्षर सूची प्रिंट एवं एक्सपोर्ट (Print/Export Learners)',
    labelEn: 'Print/Export Learners Action',
    descriptionHi: 'असाक्षर शिक्षार्थियों की सूची प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.learners',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-volunteers.action.add',
    labelHi: 'नया अक्षर साथी जोड़ें (Add Akshar Sathi Volunteer)',
    labelEn: 'Add Volunteer Action',
    descriptionHi: 'नवीन अक्षर साथी (स्वयंसेवक) पंजीकृत करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.volunteers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-volunteers.action.edit',
    labelHi: 'अक्षर साथी विवरण संपादित करें (Edit Akshar Sathi)',
    labelEn: 'Edit Volunteer Action',
    descriptionHi: 'अक्षर साथी का विवरण व मैपिंग अपडेट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.volunteers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-volunteers.action.delete',
    labelHi: 'अक्षर साथी रिकॉर्ड हटाएं (Delete Akshar Sathi)',
    labelEn: 'Delete Volunteer Action',
    descriptionHi: 'अक्षर साथी की प्रविष्टि हटाना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.volunteers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-volunteers.action.print_export',
    labelHi: 'अक्षर साथी सूची प्रिंट एवं एक्सपोर्ट (Print/Export Volunteers)',
    labelEn: 'Print/Export Volunteers Action',
    descriptionHi: 'अक्षर साथी पंजी प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.volunteers',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-exams.action.add_edit',
    labelHi: 'साक्षरता परीक्षा परिणाम दर्ज/सुधारें (Add/Edit Exam Results)',
    labelEn: 'Add/Edit Exam Results Action',
    descriptionHi: 'FLNAT साक्षरता परीक्षा के प्राप्तांक व परिणाम दर्ज करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.exams',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-exams.action.delete',
    labelHi: 'साक्षरता परीक्षा परिणाम हटाएं (Delete Exam Result)',
    labelEn: 'Delete Exam Result Action',
    descriptionHi: 'परीक्षा परिणाम प्रविष्टि हटाना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.exams',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-exams.action.print_export',
    labelHi: 'परीक्षा परिणाम प्रिंट एवं एक्सपोर्ट (Print/Export Exam Results)',
    labelEn: 'Print/Export Exam Results Action',
    descriptionHi: 'साक्षरता परीक्षा परिणाम पत्रक प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.exams',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-partners.action.add',
    labelHi: 'नई सहयोगी संस्था जोड़ें (Add Partner Institution)',
    labelEn: 'Add Partner Institution Action',
    descriptionHi: 'साक्षरता अभियान में नई सहयोगी संस्था दर्ज करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.institutions',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-partners.action.edit',
    labelHi: 'सहयोगी संस्था विवरण सुधारें (Edit Partner Institution)',
    labelEn: 'Edit Partner Institution Action',
    descriptionHi: 'सहयोगी संस्था का विवरण अपडेट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.institutions',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-partners.action.delete',
    labelHi: 'सहयोगी संस्था हटाएं (Delete Partner Institution)',
    labelEn: 'Delete Partner Institution Action',
    descriptionHi: 'सहयोगी संस्था की प्रविष्टि हटाना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.institutions',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-partners.action.print_export',
    labelHi: 'सहयोगी संस्था सूची प्रिंट एवं एक्सपोर्ट (Print/Export Partners)',
    labelEn: 'Print/Export Partners Action',
    descriptionHi: 'सहयोगी संस्थाओं की सूची प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.institutions',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.literacy-reports.action.print_export',
    labelHi: 'साक्षरता समेकित रिपोर्ट प्रिंट/एक्सपोर्ट (Print/Export Literacy Reports)',
    labelEn: 'Print/Export Literacy Reports Action',
    descriptionHi: 'साक्षरता रिपोर्ट केंद्र से प्रपत्र प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.literacy',
    parentKey: 'module.literacy.sub.reports',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 11. GOVERNMENT WORK (शासकीय कार्य ट्रैकिंग)
  // ============================================================================
  {
    key: 'module.work',
    labelHi: 'शासकीय कार्य ट्रैकिंग (Government Work Tracking)',
    labelEn: 'Government Work Module',
    descriptionHi: 'वरिष्ठ कार्यालय व संकुल से जारी शासकीय कार्यों की समय-सीमा व प्रगति ट्रैकिंग',
    moduleKey: 'module.work',
    itemType: 'MODULE',
    routeId: 'work',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.work.action.add',
    labelHi: 'नया शासकीय कार्य सौंपें / जोड़ें (Create/Assign Gov Work)',
    labelEn: 'Add Government Work Action',
    descriptionHi: 'नवीन शासकीय कार्य या आदेश दर्ज करना',
    moduleKey: 'module.work',
    parentKey: 'module.work',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.work.action.edit',
    labelHi: 'शासकीय कार्य विवरण संपादित करें (Edit Gov Work)',
    labelEn: 'Edit Government Work Action',
    descriptionHi: 'शासकीय कार्य का शीर्षक, समय-सीमा या प्राथमिकता संशोधित करना',
    moduleKey: 'module.work',
    parentKey: 'module.work',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.work.action.update_status',
    labelHi: 'कार्य प्रगति / स्थिति अपडेट करें (Update Work Status)',
    labelEn: 'Update Work Status Action',
    descriptionHi: 'शासकीय कार्य को प्रगतिशील या पूर्ण चिन्हित करना व टीप लिखना',
    moduleKey: 'module.work',
    parentKey: 'module.work',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.work.action.delete',
    labelHi: 'शासकीय कार्य हटाएं (Delete Gov Work)',
    labelEn: 'Delete Government Work Action',
    descriptionHi: 'शासकीय कार्य प्रविष्टि हटाना',
    moduleKey: 'module.work',
    parentKey: 'module.work',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.work.action.print_export',
    labelHi: 'शासकीय कार्य रिपोर्ट प्रिंट एवं एक्सपोर्ट (Print & Export Work)',
    labelEn: 'Print & Export Government Work',
    descriptionHi: 'शासकीय कार्य प्रगति रिपोर्ट प्रिंट/एक्सपोर्ट करना',
    moduleKey: 'module.work',
    parentKey: 'module.work',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 12. COMPLAINTS (शिकायत एवं समाधान)
  // ============================================================================
  {
    key: 'module.complaints',
    labelHi: 'शिकायत एवं समाधान (Grievance & Complaints)',
    labelEn: 'Complaints Module',
    descriptionHi: 'विद्यालय संबंधी शिकायतों का पंजीकरण, निराकरण, क्लोजर एवं री-ओपन ट्रैकिंग',
    moduleKey: 'module.complaints',
    itemType: 'MODULE',
    routeId: 'complaints',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.complaints.action.create',
    labelHi: 'नई शिकायत दर्ज करें (Register New Complaint)',
    labelEn: 'Create Complaint Action',
    descriptionHi: 'नवीन शिकायत या समस्या दर्ज करना',
    moduleKey: 'module.complaints',
    parentKey: 'module.complaints',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.complaints.action.edit',
    labelHi: 'शिकायत विवरण संपादित करें (Edit Complaint)',
    labelEn: 'Edit Complaint Action',
    descriptionHi: 'दर्ज शिकायत के विवरण में सुधार करना',
    moduleKey: 'module.complaints',
    parentKey: 'module.complaints',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.complaints.action.resolve',
    labelHi: 'शिकायत निराकरण दर्ज करें (Resolve Complaint)',
    labelEn: 'Resolve Complaint Action',
    descriptionHi: 'शिकायत पर समाधान/कार्यवाही विवरण दर्ज कर निराकृत करना',
    moduleKey: 'module.complaints',
    parentKey: 'module.complaints',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.complaints.action.close',
    labelHi: 'शिकायत अंतिम रूप से बंद करें (Close Complaint)',
    labelEn: 'Close Complaint Action',
    descriptionHi: 'निराकृत शिकायत का सत्यापन कर क्लोज (बंद) करना',
    moduleKey: 'module.complaints',
    parentKey: 'module.complaints',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.complaints.action.reopen',
    labelHi: 'शिकायत पुनः खोलें (Reopen Complaint)',
    labelEn: 'Reopen Complaint Action',
    descriptionHi: 'असंतुष्ट होने पर शिकायत को पुनः कार्यवाही हेतु खोलना',
    moduleKey: 'module.complaints',
    parentKey: 'module.complaints',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.complaints.action.delete',
    labelHi: 'शिकायत रिकॉर्ड हटाएं (Delete Complaint)',
    labelEn: 'Delete Complaint Action',
    descriptionHi: 'शिकायत प्रविष्टि को हटाना',
    moduleKey: 'module.complaints',
    parentKey: 'module.complaints',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.complaints.action.print_export',
    labelHi: 'शिकायत पंजी प्रिंट एवं एक्सपोर्ट (Print & Export Complaints)',
    labelEn: 'Print & Export Complaints',
    descriptionHi: 'शिकायत निवारण पंजी प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.complaints',
    parentKey: 'module.complaints',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 13. NOTIFICATIONS (सूचना पटल एवं आदेश)
  // ============================================================================
  {
    key: 'module.notifications',
    labelHi: 'सूचना पटल एवं आदेश (Notice Board & Circulars)',
    labelEn: 'Notifications Module',
    descriptionHi: 'संकुल सूचना पटल, शासकीय परिपत्र एवं महत्वपूर्ण अलर्ट',
    moduleKey: 'module.notifications',
    itemType: 'MODULE',
    routeId: 'notifications',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.notifications.action.create',
    labelHi: 'नई सूचना / आदेश प्रसारित करें (Publish Notice/Circular)',
    labelEn: 'Create Notification Action',
    descriptionHi: 'शालाओं के लिए नई सूचना या आदेश जारी करना',
    moduleKey: 'module.notifications',
    parentKey: 'module.notifications',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.notifications.action.mark_read',
    labelHi: 'सूचना पठित चिन्हित करें (Mark Notification as Read)',
    labelEn: 'Mark Notification Read Action',
    descriptionHi: 'सूचनाओं को पठित (Read) चिन्हित करना',
    moduleKey: 'module.notifications',
    parentKey: 'module.notifications',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.notifications.action.delete',
    labelHi: 'सूचना हटाएं (Delete Notice)',
    labelEn: 'Delete Notification Action',
    descriptionHi: 'प्रसारित सूचना को हटाना',
    moduleKey: 'module.notifications',
    parentKey: 'module.notifications',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },

  // ============================================================================
  // 14. DOCUMENTS (दस्तावेज़ एवं अभिलेख)
  // ============================================================================
  {
    key: 'module.documents',
    labelHi: 'दस्तावेज़ एवं अभिलेख (Documents Repository)',
    labelEn: 'Documents Module',
    descriptionHi: 'शासकीय आदेश, निरीक्षण प्रतिवेदन, प्रमाण-पत्र व शाला दस्तावेज़ संग्रह',
    moduleKey: 'module.documents',
    itemType: 'MODULE',
    routeId: 'documents',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.documents.action.upload',
    labelHi: 'नया दस्तावेज़ अपलोड करें (Upload Document)',
    labelEn: 'Upload Document Action',
    descriptionHi: 'पोर्टल पर पीडीएफ/इमेज दस्तावेज़ अपलोड करना',
    moduleKey: 'module.documents',
    parentKey: 'module.documents',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.documents.action.download',
    labelHi: 'दस्तावेज़ देखें एवं डाउनलोड करें (View & Download Document)',
    labelEn: 'Download Document Action',
    descriptionHi: 'अपलोड किए गए दस्तावेज़ को देखना व डाउनलोड करना',
    moduleKey: 'module.documents',
    parentKey: 'module.documents',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.documents.action.print_export',
    labelHi: 'दस्तावेज़ सूची प्रिंट एवं एक्सपोर्ट (Print & Export Documents)',
    labelEn: 'Print & Export Documents Action',
    descriptionHi: 'दस्तावेज़ एवं प्रपत्र सूची प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.documents',
    parentKey: 'module.documents',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.documents.action.delete',
    labelHi: 'दस्तावेज़ हटाएं (Delete Document)',
    labelEn: 'Delete Document Action',
    descriptionHi: 'दस्तावेज़ को संग्रह से हटाना',
    moduleKey: 'module.documents',
    parentKey: 'module.documents',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 15. REPORTS (संकुल एवं शाला प्रतिवेदन - Reports)
  // ============================================================================
  {
    key: 'module.reports',
    labelHi: 'संकुल एवं शाला प्रतिवेदन (Analytical Reports)',
    labelEn: 'Reports Module',
    descriptionHi: 'समेकित नामांकन, उपस्थिति, एमडीएम, सुविधा एवं कार्य प्रगति प्रतिवेदन',
    moduleKey: 'module.reports',
    itemType: 'MODULE',
    routeId: 'reports',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.reports.sub.analytical_center',
    labelHi: 'विस्तृत विश्लेषणात्मक चार्ट एवं तुलना (Analytical Charts & Comparison)',
    labelEn: 'Analytical Center Sub-option',
    descriptionHi: 'संकुल एवं शाला स्तर के ग्राफिकल चार्ट व तुलनात्मक विश्लेषण',
    moduleKey: 'module.reports',
    parentKey: 'module.reports',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.reports.action.print',
    labelHi: 'प्रतिवेदन सीधा प्रिंट करें (Direct Print Report)',
    labelEn: 'Print Report Action',
    descriptionHi: 'चयनित शासकीय प्रतिवेदन को प्रिंट करना',
    moduleKey: 'module.reports',
    parentKey: 'module.reports',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.reports.action.pdf',
    labelHi: 'प्रतिवेदन PDF डाउनलोड (Export Report as PDF)',
    labelEn: 'Export PDF Report Action',
    descriptionHi: 'चयनित प्रतिवेदन को PDF प्रारूप में सहेजना',
    moduleKey: 'module.reports',
    parentKey: 'module.reports',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.reports.action.excel',
    labelHi: 'प्रतिवेदन Excel डाउनलोड (Export Report as Excel)',
    labelEn: 'Export Excel Report Action',
    descriptionHi: 'चयनित प्रतिवेदन को Excel प्रारूप में डाउनलोड करना',
    moduleKey: 'module.reports',
    parentKey: 'module.reports',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.reports.action.csv',
    labelHi: 'प्रतिवेदन CSV डाउनलोड (Export Report as CSV)',
    labelEn: 'Export CSV Report Action',
    descriptionHi: 'चयनित प्रतिवेदन को CSV प्रारूप में डाउनलोड करना',
    moduleKey: 'module.reports',
    parentKey: 'module.reports',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.reports.action.print_export',
    labelHi: 'प्रतिवेदन स्मार्ट प्रिंट एवं एक्सपोर्ट (Unified Print & Export Reports)',
    labelEn: 'Print & Export Reports Action',
    descriptionHi: 'विश्लेषणात्मक प्रतिवेदन प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.reports',
    parentKey: 'module.reports',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 16. EXPORT CENTER (प्रिंट एवं एक्सपोर्ट केंद्र)
  // ============================================================================
  {
    key: 'module.export',
    labelHi: 'प्रिंट एवं एक्सपोर्ट केंद्र (Print & Export Center)',
    labelEn: 'Export Center Module',
    descriptionHi: 'कस्टम कॉलम चयन के साथ समस्त मॉड्यूल का आधिकारिक प्रिंट, PDF व Excel/CSV निर्यात',
    moduleKey: 'module.export',
    itemType: 'MODULE',
    routeId: 'export',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.export.action.csv_excel',
    labelHi: 'एक्सेल / CSV डाउनलोड (Download Excel / CSV)',
    labelEn: 'Export CSV/Excel Action',
    descriptionHi: 'डेटा को CSV या Excel प्रारूप में डाउनलोड करना',
    moduleKey: 'module.export',
    parentKey: 'module.export',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.export.action.official_print',
    labelHi: 'आधिकारिक शासकीय पत्रक प्रिंट (Official Print / PDF)',
    labelEn: 'Official Print Action',
    descriptionHi: 'हस्ताक्षर ब्लॉक सहित शासकीय प्रारूप में प्रिंट करना',
    moduleKey: 'module.export',
    parentKey: 'module.export',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 17. DATA UPLOAD (बल्क डेटा अपलोड / आयात)
  // ============================================================================
  {
    key: 'module.upload',
    labelHi: 'डेटा अपलोड केंद्र (Bulk Data Upload & Import)',
    labelEn: 'Data Upload Module',
    descriptionHi: 'Excel/CSV फाइल के माध्यम से छात्र, शिक्षक, सुविधा आदि का बल्क डेटा इम्पोर्ट',
    moduleKey: 'module.upload',
    itemType: 'MODULE',
    routeId: 'upload',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.upload.sub.history',
    labelHi: 'अपलोड इतिहास लॉग (Upload History Tab)',
    labelEn: 'Upload History View',
    descriptionHi: 'पूर्व में किए गए बल्क डेटा अपलोड का विवरण देखना',
    moduleKey: 'module.upload',
    parentKey: 'module.upload',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.upload.action.import_file',
    labelHi: 'फाइल इम्पोर्ट एवं डेटा सिंक करें (Execute Bulk Import)',
    labelEn: 'Execute Bulk Import Action',
    descriptionHi: 'चयनित CSV/Excel फाइल के रिकॉर्ड्स को डेटाबेस में जोड़ना/अपडेट करना',
    moduleKey: 'module.upload',
    parentKey: 'module.upload',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 18. CLUSTER USERS (संकुल यूज़र एवं लॉगिन प्रबंधन)
  // ============================================================================
  {
    key: 'module.users',
    labelHi: 'संकुल यूज़र प्रबंधन (Cluster User Directory)',
    labelEn: 'User Management Module',
    descriptionHi: 'शाला प्रभारियों व उपयोगकर्ताओं के लॉगिन खाते, पासवर्ड रीसेट व अनुमोदन',
    moduleKey: 'module.users',
    itemType: 'MODULE',
    routeId: 'users',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.users.action.approve',
    labelHi: 'नवीन यूज़र पंजीकरण स्वीकृत करें (Approve User Registration)',
    labelEn: 'Approve User Action',
    descriptionHi: 'लंबित शाला उपयोगकर्ता पंजीकरण को स्वीकृत करना',
    moduleKey: 'module.users',
    parentKey: 'module.users',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.users.action.reject',
    labelHi: 'यूज़र पंजीकरण अस्वीकृत करें (Reject User Registration)',
    labelEn: 'Reject User Action',
    descriptionHi: 'लंबित उपयोगकर्ता पंजीकरण को अस्वीकृत करना',
    moduleKey: 'module.users',
    parentKey: 'module.users',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.users.action.activate_deactivate',
    labelHi: 'यूज़र खाता सक्रिय / निष्क्रिय करें (Activate/Deactivate User)',
    labelEn: 'Activate/Deactivate User Action',
    descriptionHi: 'उपयोगकर्ता खाते की लॉगिन स्थिति चालू या बंद करना',
    moduleKey: 'module.users',
    parentKey: 'module.users',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.users.action.export',
    labelHi: 'यूज़र डायरेक्टरी प्रिंट एवं एक्सपोर्ट (Print & Export Users)',
    labelEn: 'Print & Export Users Action',
    descriptionHi: 'संकुल उपयोगकर्ता सूची प्रिंट या एक्सपोर्ट करना',
    moduleKey: 'module.users',
    parentKey: 'module.users',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },

  // ============================================================================
  // 19. AUDIT LOGS (ऑडिट लॉग एवं सुरक्षा ट्रैकिंग)
  // ============================================================================
  {
    key: 'module.audit',
    labelHi: 'ऑडिट लॉग (System Audit Trail)',
    labelEn: 'Audit Logs Module',
    descriptionHi: 'प्रणाली में किए गए समस्त परिवर्तनों एवं लॉगिन गतिविधियों का सुरक्षा अभिलेख',
    moduleKey: 'module.audit',
    itemType: 'MODULE',
    routeId: 'audit',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.audit.action.export',
    labelHi: 'ऑडिट लॉग प्रिंट एवं एक्सपोर्ट (Print & Export Audit Trail)',
    labelEn: 'Export Audit Logs Action',
    descriptionHi: 'गतिविधि इतिहास एवं ऑडिट लॉग प्रिंट या डाउनलोड करना',
    moduleKey: 'module.audit',
    parentKey: 'module.audit',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },

  // ============================================================================
  // 20. SETTINGS (प्रणाली सेटिंग्स)
  // ============================================================================
  {
    key: 'module.settings',
    labelHi: 'प्रणाली सेटिंग्स (System Settings)',
    labelEn: 'Settings Module',
    descriptionHi: 'संस्था विवरण, शैक्षणिक सत्र प्रबंधन, डेटा बैकअप व प्रणाली सूचना',
    moduleKey: 'module.settings',
    itemType: 'MODULE',
    routeId: 'settings',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.settings.sub.sessions',
    labelHi: 'शैक्षणिक सत्र प्रबंधन टैब (Academic Session Management)',
    labelEn: 'Session Management Sub-option',
    descriptionHi: 'शैक्षणिक सत्र देखना व सत्र विवरण की जाँच करना',
    moduleKey: 'module.settings',
    parentKey: 'module.settings',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },
  {
    key: 'module.settings.sub.backup',
    labelHi: 'डेटा बैकअप डाउनलोड टैब (Data Backup Download)',
    labelEn: 'Backup Download Sub-option',
    descriptionHi: 'JSON प्रारूप में संकुल डेटा का सुरक्षा बैकअप डाउनलोड करना',
    moduleKey: 'module.settings',
    parentKey: 'module.settings',
    itemType: 'SUB_OPTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: false,
    cacApplicable: true,
    schoolApplicable: false,
  },

  // ============================================================================
  // 21. PROFILE (मेरी प्रोफाइल)
  // ============================================================================
  {
    key: 'module.profile',
    labelHi: 'मेरी प्रोफाइल (My User Profile)',
    labelEn: 'My Profile Module',
    descriptionHi: 'उपयोगकर्ता का व्यक्तिगत विवरण, पदस्थापना व पासवर्ड प्रबंधन',
    moduleKey: 'module.profile',
    itemType: 'MODULE',
    routeId: 'profile',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.profile.action.edit_profile',
    labelHi: 'प्रोफाइल विवरण संपादित करें (Edit Profile Details)',
    labelEn: 'Edit Profile Action',
    descriptionHi: 'अपना व्यक्तिगत विवरण, मोबाइल नंबर व फोटो अपडेट करना',
    moduleKey: 'module.profile',
    parentKey: 'module.profile',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.profile.action.change_password',
    labelHi: 'लॉगिन पासवर्ड बदलें (Change Password)',
    labelEn: 'Change Password Action',
    descriptionHi: 'अपने खाते का पासवर्ड परिवर्तित करना',
    moduleKey: 'module.profile',
    parentKey: 'module.profile',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
  {
    key: 'module.profile.action.print_export',
    labelHi: 'प्रोफाइल कार्ड प्रिंट करें (Print Profile Card)',
    labelEn: 'Print Profile Action',
    descriptionHi: 'उपयोगकर्ता प्रोफाइल विवरण प्रिंट करना',
    moduleKey: 'module.profile',
    parentKey: 'module.profile',
    itemType: 'ACTION',
    defaultCacEnabled: true,
    defaultSchoolEnabled: true,
    cacApplicable: true,
    schoolApplicable: true,
  },
];

/**
 * Maps a sidebar/navigation route ID to its governing module key (and sub-option key if applicable)
 */
export const ROUTE_TO_FEATURE_KEY_MAP: Record<string, { moduleKey: string; subOptionKey?: string }> = {
  dashboard: { moduleKey: 'module.dashboard' },
  schools: { moduleKey: 'module.schools' },
  students: { moduleKey: 'module.students' },
  teachers: { moduleKey: 'module.teachers' },
  staff: { moduleKey: 'module.teachers' },
  attendance: { moduleKey: 'module.attendance' },
  'cac-attendance-monitoring': { moduleKey: 'module.attendance', subOptionKey: 'module.attendance.sub.cac_monitoring' },
  mdm: { moduleKey: 'module.mdm' },
  rasoiya: { moduleKey: 'module.rasoiya' },
  cook: { moduleKey: 'module.rasoiya' },
  'rasoiya-management': { moduleKey: 'module.rasoiya' },
  shg: { moduleKey: 'module.shg' },
  shgs: { moduleKey: 'module.shg' },
  'shg-management': { moduleKey: 'module.shg' },
  'self-help-group': { moduleKey: 'module.shg' },
  facilities: { moduleKey: 'module.facilities' },
  literacy: { moduleKey: 'module.literacy' },
  'literacy-dashboard': { moduleKey: 'module.literacy' },
  'literacy-register': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.registers' },
  'literacy-registers': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.registers' },
  'literacy-learners': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.learners' },
  'illiterate-persons': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.learners' },
  'literacy-volunteers': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.volunteers' },
  'akshar-sathi': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.volunteers' },
  'literacy-exams': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.exams' },
  'exam-results': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.exams' },
  'literacy-partners': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.institutions' },
  'supporting-institutions': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.institutions' },
  'literacy-reports': { moduleKey: 'module.literacy', subOptionKey: 'module.literacy.sub.reports' },
  work: { moduleKey: 'module.work' },
  complaints: { moduleKey: 'module.complaints' },
  notifications: { moduleKey: 'module.notifications' },
  documents: { moduleKey: 'module.documents' },
  reports: { moduleKey: 'module.reports' },
  export: { moduleKey: 'module.export' },
  'export-center': { moduleKey: 'module.export' },
  upload: { moduleKey: 'module.upload' },
  users: { moduleKey: 'module.users' },
  'user-directory': { moduleKey: 'module.users' },
  audit: { moduleKey: 'module.audit' },
  history: { moduleKey: 'module.audit' },
  settings: { moduleKey: 'module.settings' },
  profile: { moduleKey: 'module.profile' },
};

export function createDefaultFeatureControlStore(): FeatureControlStore {
  const rules: Record<string, FeatureControlRule> = {};
  for (const item of FEATURE_CONTROL_REGISTRY) {
    rules[item.key] = {
      key: item.key,
      cacEnabled: item.defaultCacEnabled,
      schoolEnabled: item.defaultSchoolEnabled,
      scheduleCac: {
        enabled: false,
        startTime: null,
        endTime: null,
        autoReactivate: true,
      },
      scheduleSchool: {
        enabled: false,
        startTime: null,
        endTime: null,
        autoReactivate: true,
      },
      reason: '',
      customMessage: '',
    };
  }
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    updatedBy: 'SYSTEM',
    updatedByName: 'System Default',
    rules,
  };
}

export interface FeatureAccessEvaluation {
  allowed: boolean;
  isTemporarilyDisabled: boolean;
  isPermanentlyDisabled: boolean;
  parentModuleDisabled: boolean;
  reason?: string;
  customMessage?: string;
  reactivateAt?: string | null;
  remainingMs?: number | null;
  rule?: FeatureControlRule;
  config?: FeatureControlItemConfig;
}

/**
 * Evaluates whether a specific feature key is currently enabled for a given UserRole at `nowMs`.
 *
 * Rules:
 * 1. ADMIN is NEVER blocked by Feature Controls (always allowed: true).
 * 2. If parent MODULE is disabled (or temporarily disabled right now), all child SUB_OPTIONs and ACTIONs are automatically disabled.
 * 3. Time-based temporary deactivation:
 *    - If schedule.enabled === true and endTime is in the future (now < endTime) and (!startTime || now >= startTime):
 *      the feature is considered TEMPORARILY DEACTIVATED during that window.
 *    - Once now >= endTime (and autoReactivate !== false), the temporary deactivation expires and the feature automatically becomes ACTIVE again!
 */
export function evaluateFeatureAccess(
  featureKey: string,
  role: UserRole | undefined,
  store: FeatureControlStore,
  nowMs: number = Date.now()
): FeatureAccessEvaluation {
  // ADMIN always has full access
  if (!role || role === 'ADMIN') {
    return {
      allowed: true,
      isTemporarilyDisabled: false,
      isPermanentlyDisabled: false,
      parentModuleDisabled: false,
    };
  }

  const config = FEATURE_CONTROL_REGISTRY.find((c) => c.key === featureKey);
  if (!config) {
    return {
      allowed: true,
      isTemporarilyDisabled: false,
      isPermanentlyDisabled: false,
      parentModuleDisabled: false,
    };
  }

  // Check if parent module is disabled first (when evaluating SUB_OPTION or ACTION)
  if (config.itemType !== 'MODULE' && config.moduleKey && config.moduleKey !== featureKey) {
    const parentEval = evaluateFeatureAccess(config.moduleKey, role, store, nowMs);
    if (!parentEval.allowed) {
      return {
        ...parentEval,
        parentModuleDisabled: true,
      };
    }
  }

  const rule = store.rules?.[featureKey];
  if (!rule) {
    const defaultAllowed = role === 'CAC' ? config.defaultCacEnabled : config.defaultSchoolEnabled;
    return {
      allowed: defaultAllowed,
      isTemporarilyDisabled: false,
      isPermanentlyDisabled: !defaultAllowed,
      parentModuleDisabled: false,
      config,
    };
  }

  const isCac = role === 'CAC';
  const baseEnabled = isCac ? rule.cacEnabled : rule.schoolEnabled;
  const schedule = isCac ? rule.scheduleCac : rule.scheduleSchool;

  // Check if schedule-based temporary deactivation is configured
  if (schedule && schedule.enabled && (schedule.endTime || schedule.endTimeMs)) {
    const startMs =
      typeof schedule.startTimeMs === 'number'
        ? schedule.startTimeMs
        : schedule.startTime
        ? new Date(schedule.startTime).getTime()
        : 0;
    const endMs =
      typeof schedule.endTimeMs === 'number'
        ? schedule.endTimeMs
        : schedule.endTime
        ? new Date(schedule.endTime).getTime()
        : NaN;

    if (!isNaN(endMs)) {
      if (nowMs >= startMs && nowMs < endMs) {
        // Currently within temporary deactivation window
        return {
          allowed: false,
          isTemporarilyDisabled: true,
          isPermanentlyDisabled: false,
          parentModuleDisabled: false,
          reason: rule.reason || 'प्रशासनिक रखरखाव / अस्थायी रोक',
          customMessage: rule.customMessage,
          reactivateAt: schedule.endTime || new Date(endMs).toISOString(),
          remainingMs: Math.max(0, endMs - nowMs),
          rule,
          config,
        };
      } else if (nowMs >= endMs && schedule.autoReactivate) {
        // Timer has expired and autoReactivate is true -> Feature is AUTOMATICALLY ACTIVE!
        return {
          allowed: true,
          isTemporarilyDisabled: false,
          isPermanentlyDisabled: false,
          parentModuleDisabled: false,
          rule,
          config,
        };
      } else if (nowMs >= endMs && !schedule.autoReactivate) {
        // Timer expired but autoReactivate is false -> Remains disabled until manually reactivated
        return {
          allowed: false,
          isTemporarilyDisabled: false,
          isPermanentlyDisabled: true,
          parentModuleDisabled: false,
          reason: rule.reason || 'निर्धारित अवधि उपरांत स्थायी रोक (Manual Reactivation Required)',
          customMessage: rule.customMessage,
          rule,
          config,
        };
      }
    }
  }

  if (!baseEnabled) {
    return {
      allowed: false,
      isTemporarilyDisabled: false,
      isPermanentlyDisabled: true,
      parentModuleDisabled: false,
      reason: rule.reason || 'व्यवस्थापक (ADMIN) द्वारा निष्क्रिय किया गया',
      customMessage: rule.customMessage,
      rule,
      config,
    };
  }

  return {
    allowed: true,
    isTemporarilyDisabled: false,
    isPermanentlyDisabled: false,
    parentModuleDisabled: false,
    rule,
    config,
  };
}

export function formatRemainingDurationHi(remainingMs: number): string {
  if (remainingMs <= 0) return '0 सेकंड';
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} दिन`);
  if (hours > 0) parts.push(`${hours} घंटे`);
  if (minutes > 0) parts.push(`${minutes} मिनट`);
  if (days === 0 && hours === 0 && seconds > 0) parts.push(`${seconds} सेकंड`);
  return parts.join(' ') || 'कुछ सेकंड';
}

// ============================================================================
// AUTHORITATIVE RUNTIME STORE & MONOTONIC SERVER-ANCHORED CLOCK
// ============================================================================

let _authoritativeStore: FeatureControlStore = createDefaultFeatureControlStore();
let _serverEpochAnchorMs: number = Date.now();
let _perfAnchorMs: number = typeof performance !== 'undefined' ? performance.now() : 0;

/**
 * Anchors the monotonic hardware timer (`performance.now()`) to an authoritative
 * server timestamp (from HTTP Date header or Firestore server timestamp) so that
 * client OS clock manipulation (`Date.now()` tampering) cannot prematurely expire
 * or bypass an active temporary deactivation window.
 */
export function anchorTrustedServerTime(serverEpochMs: number): void {
  if (typeof serverEpochMs === 'number' && !isNaN(serverEpochMs) && serverEpochMs > 1700000000000) {
    _serverEpochAnchorMs = serverEpochMs;
    _perfAnchorMs = typeof performance !== 'undefined' ? performance.now() : 0;
  }
}

export async function syncTrustedServerTime(): Promise<number> {
  if (typeof window === 'undefined' || typeof fetch === 'undefined') {
    return getTrustedNowMs();
  }
  try {
    const res = await fetch(window.location.origin, { method: 'HEAD', cache: 'no-store' });
    const dateHeader = res.headers.get('Date') || res.headers.get('date');
    if (dateHeader) {
      const parsed = new Date(dateHeader).getTime();
      if (!isNaN(parsed)) {
        anchorTrustedServerTime(parsed);
      }
    }
  } catch {
    // Fallback to monotonic anchor established at startup
  }
  return getTrustedNowMs();
}

export function getTrustedNowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    const elapsed = Math.max(0, performance.now() - _perfAnchorMs);
    return Math.round(_serverEpochAnchorMs + elapsed);
  }
  return Date.now();
}

export function setRuntimeFeatureControlStore(store: FeatureControlStore): void {
  if (store && typeof store === 'object' && store.rules) {
    _authoritativeStore = store;
  }
}

export function getRuntimeFeatureControlStore(): FeatureControlStore {
  return _authoritativeStore;
}

/**
 * Enforces feature & action control at the service/handler boundary (beyond UI hiding).
 * Throws an explicit [403 Feature Disabled] error if the requested featureKey (or its parent module)
 * is disabled for the given role.
 */
export function assertFeatureActionAllowed(
  featureKey: string,
  role: UserRole | undefined,
  operationLabel?: string
): FeatureAccessEvaluation {
  const evaluation = evaluateFeatureAccess(
    featureKey,
    role,
    _authoritativeStore,
    getTrustedNowMs()
  );
  if (!evaluation.allowed) {
    const label = evaluation.config?.labelHi || operationLabel || featureKey;
    const msg = `[403 Feature Disabled] सुविधा प्रतिबंधित: "${label}" (${featureKey}) वर्तमान में ${role} भूमिका के लिए व्यवस्थापक (ADMIN) द्वारा बंद की गई है। ${evaluation.reason ? `कारण: ${evaluation.reason}` : ''}`;
    throw new Error(msg);
  }
  return evaluation;
}

export function enforceRuntimeFeatureAccess(
  featureKey: string,
  role: UserRole | undefined,
  operationLabel?: string
): { allowed: boolean; message: string; evaluation: FeatureAccessEvaluation } {
  const evaluation = evaluateFeatureAccess(
    featureKey,
    role,
    _authoritativeStore,
    getTrustedNowMs()
  );
  if (!evaluation.allowed) {
    const label = evaluation.config?.labelHi || operationLabel || featureKey;
    const msg = `सुविधा प्रतिबंधित: "${label}" (${featureKey}) वर्तमान में ${role || 'उपयोगकर्ता'} भूमिका के लिए व्यवस्थापक (ADMIN) द्वारा बंद की गई है। ${evaluation.reason ? `कारण: ${evaluation.reason}` : ''}`;
    return { allowed: false, message: msg, evaluation };
  }
  return { allowed: true, message: '', evaluation };
}

