import { institutionConfig } from '../config/institutionConfig';
import {
  GovernmentReportDefinition,
  ReportFilterState,
  ReportCalculationResult,
  MetricCardData,
} from '../types/governmentReports';
import { ExportDataPayload } from './exportUtils';
import { composeStudentsForSession, composeStaffForSession } from './sessionManager';

/**
 * Mask Aadhaar number to display only last 4 digits (e.g. XXXX-XXXX-1234)
 */
export function maskAadhaar(aadhaar?: string): string {
  if (!aadhaar) return '-';
  const clean = aadhaar.replace(/\D/g, '');
  if (clean.length < 4) return aadhaar;
  const last4 = clean.slice(-4);
  return `XXXX-XXXX-${last4}`;
}

/**
 * Shared Selector: Filter Schools according to Role, Session and Scope
 */
export function getSchoolsBySessionAndScope(
  allSchools: any[],
  schoolUdise: string,
  userRole: string,
  userAssignedUdise?: string,
  includeInactive: boolean = false
) {
  let list = Array.isArray(allSchools) ? [...allSchools] : [];

  // Exclude inactive and soft-deleted schools from standard government reports
  if (!includeInactive) {
    list = list.filter((s) => !s.isDeleted && s.status === 'ACTIVE');
  }

  if (userRole === 'SCHOOL') {
    const target = userAssignedUdise || schoolUdise;
    return list.filter((s) => s.udise === target);
  }

  if (schoolUdise && schoolUdise !== 'ALL') {
    return list.filter((s) => s.udise === schoolUdise);
  }

  return list;
}

/**
 * Shared Selector: Filter Students by Session, School, Class, and Search
 */
export function getStudentsBySessionAndSchool(
  allStudents: any[],
  filters: ReportFilterState,
  userRole: string,
  userAssignedUdise?: string
) {
  let list = Array.isArray(allStudents) ? [...allStudents] : [];

  if (userRole === 'SCHOOL') {
    const assigned = userAssignedUdise || filters.schoolUdise;
    list = list.filter((s) => s.schoolUdise === assigned);
  } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
    list = list.filter((s) => s.schoolUdise === filters.schoolUdise);
  }

  if (filters.sessionId) {
    list = list.filter((s) => s.sessionId === filters.sessionId);
  }

  if (filters.classLevel && filters.classLevel !== 'ALL') {
    list = list.filter((s) => String(s.class) === String(filters.classLevel));
  }

  if (filters.category && filters.category !== 'ALL') {
    list = list.filter((s) => s.category === filters.category);
  }

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter((s) => s.status === filters.status);
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.samagraId?.toLowerCase().includes(q) ||
        s.fatherName?.toLowerCase().includes(q) ||
        s.schoolUdise?.includes(q)
    );
  }

  return list;
}

/**
 * Shared Selector: Filter Staff by Session, School, Designation, and Search
 */
export function getStaffBySessionAndSchool(
  allStaff: any[],
  filters: ReportFilterState,
  userRole: string,
  userAssignedUdise?: string
) {
  let list = Array.isArray(allStaff) ? [...allStaff] : [];

  if (userRole === 'SCHOOL') {
    const assigned = userAssignedUdise || filters.schoolUdise;
    list = list.filter((s) => s.assignedSchoolUdise === assigned);
  } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
    list = list.filter((s) => s.assignedSchoolUdise === filters.schoolUdise);
  }

  if (filters.sessionId) {
    list = list.filter((s) => s.sessionId === filters.sessionId);
  }

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter((s) => s.status === filters.status);
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (s) =>
        s.name?.toLowerCase().includes(q) ||
        s.employeeId?.toLowerCase().includes(q) ||
        s.mobile?.includes(q) ||
        s.designation?.toLowerCase().includes(q) ||
        s.subject?.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Shared Selector: Filter Attendance by Session, School, Date Range, Class
 */
export function getAttendanceBySessionAndSchool(
  allAttendance: any[],
  filters: ReportFilterState,
  userRole: string,
  userAssignedUdise?: string
) {
  let list = Array.isArray(allAttendance) ? [...allAttendance] : [];

  if (userRole === 'SCHOOL') {
    const assigned = userAssignedUdise || filters.schoolUdise;
    list = list.filter((a) => a.schoolUdise === assigned);
  } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
    list = list.filter((a) => a.schoolUdise === filters.schoolUdise);
  }

  if (filters.sessionId) {
    list = list.filter((a) => a.sessionId === filters.sessionId);
  }

  if (filters.dateFrom) {
    list = list.filter((a) => a.date >= filters.dateFrom);
  }
  if (filters.dateTo) {
    list = list.filter((a) => a.date <= filters.dateTo);
  }

  if (filters.classLevel && filters.classLevel !== 'ALL') {
    list = list.filter((a) => !a.class || String(a.class) === String(filters.classLevel));
  }

  return list;
}

/**
 * Shared Selector: Filter MDM by Session, School, Date Range
 */
export function getMDMBySessionAndSchool(
  allMDM: any[],
  filters: ReportFilterState,
  userRole: string,
  userAssignedUdise?: string
) {
  let list = Array.isArray(allMDM) ? [...allMDM] : [];

  if (userRole === 'SCHOOL') {
    const assigned = userAssignedUdise || filters.schoolUdise;
    list = list.filter((m) => m.schoolUdise === assigned);
  } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
    list = list.filter((m) => m.schoolUdise === filters.schoolUdise);
  }

  if (filters.sessionId) {
    list = list.filter((m) => m.sessionId === filters.sessionId);
  }

  if (filters.dateFrom) {
    list = list.filter((m) => m.date >= filters.dateFrom);
  }
  if (filters.dateTo) {
    list = list.filter((m) => m.date <= filters.dateTo);
  }

  return list;
}

/**
 * Shared Selector: Filter Government Work by Session, School, Status
 */
export function getGovernmentWorkBySessionAndSchool(
  allWork: any[],
  filters: ReportFilterState,
  userRole: string,
  userAssignedUdise?: string
) {
  let list = Array.isArray(allWork) ? [...allWork] : [];

  if (userRole === 'SCHOOL') {
    const assigned = userAssignedUdise || filters.schoolUdise;
    list = list.filter((w) => !w.schoolUdise || w.schoolUdise === 'ALL' || w.schoolUdise === assigned);
  } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
    list = list.filter((w) => !w.schoolUdise || w.schoolUdise === 'ALL' || w.schoolUdise === filters.schoolUdise);
  }

  if (filters.sessionId) {
    list = list.filter((w) => w.sessionId === filters.sessionId);
  }

  if (filters.status && filters.status !== 'ALL') {
    if (filters.status === 'OVERDUE') {
      const today = new Date().toISOString().split('T')[0];
      list = list.filter((w) => w.status !== 'COMPLETED' && w.dueDate && w.dueDate < today);
    } else {
      list = list.filter((w) => w.status === filters.status);
    }
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (w) =>
        w.workName?.toLowerCase().includes(q) ||
        w.orderNumber?.toLowerCase().includes(q) ||
        w.description?.toLowerCase().includes(q) ||
        w.responsiblePerson?.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Shared Selector: Filter Complaints by Session, School, Status, Category
 */
export function getComplaintsBySessionAndSchool(
  allComplaints: any[],
  filters: ReportFilterState,
  userRole: string,
  userAssignedUdise?: string
) {
  let list = Array.isArray(allComplaints) ? [...allComplaints] : [];

  if (userRole === 'SCHOOL') {
    const assigned = userAssignedUdise || filters.schoolUdise;
    list = list.filter((c) => c.schoolUdise === assigned);
  } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
    list = list.filter((c) => c.schoolUdise === filters.schoolUdise);
  }

  if (filters.sessionId) {
    list = list.filter((c) => c.sessionId === filters.sessionId);
  }

  if (filters.status && filters.status !== 'ALL') {
    list = list.filter((c) => c.status === filters.status);
  }

  if (filters.category && filters.category !== 'ALL') {
    list = list.filter((c) => c.category === filters.category);
  }

  if (filters.searchQuery) {
    const q = filters.searchQuery.toLowerCase().trim();
    list = list.filter(
      (c) =>
        c.subject?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.complaintId?.toLowerCase().includes(q) ||
        c.complainantName?.toLowerCase().includes(q)
    );
  }

  return list;
}

/**
 * Centralized Data Completeness Criteria
 * Calculation source and displayed criteria match exactly.
 */
export interface CompletenessCriterionDefinition {
  id: string;
  name: string;
  shortCode: string;
  description: string;
}

export const DATA_COMPLETENESS_CRITERIA: readonly CompletenessCriterionDefinition[] = [
  { id: 'PROFILE', name: 'संस्था विवरण (Profile)', shortCode: 'PROF', description: 'शाला नाम, यूडाइस, ग्राम, प्रकार व प्रधान' },
  { id: 'STUDENTS', name: 'विद्यार्थी नामांकन (Students)', shortCode: 'STUD', description: 'सत्र में कम से कम 1 विद्यार्थी नामांकित' },
  { id: 'STAFF', name: 'शिक्षक पदस्थापना (Staff)', shortCode: 'STAF', description: 'सत्र में पदस्थ शिक्षक विवरण' },
  { id: 'FACILITIES', name: 'भौतिक सुविधाएं (Facilities)', shortCode: 'FACL', description: 'न्यूनतम 5 अधोसंरचना मानक प्रविष्ट' },
  { id: 'ATTENDANCE', name: 'उपस्थिति प्रविष्टि (Attendance)', shortCode: 'ATTN', description: 'सत्र में छात्र उपस्थिति अभिलेख' },
  { id: 'MDM', name: 'मध्याह्न भोजन (MDM)', shortCode: 'PM-POSHAN', description: 'सत्र में पीएम-पोषण वितरण प्रविष्टि' },
  { id: 'WORK', name: 'शासकीय कार्य (Govt Work)', shortCode: 'WORK', description: 'सत्र के शासकीय दायित्व व प्रगति' },
  { id: 'COMPLAINTS', name: 'जन शिकायत निवारण (Complaints)', shortCode: 'COMP', description: 'सत्र की जन शिकायतों का रिकॉर्ड' },
  { id: 'ULLAS', name: 'नवभारत साक्षरता (ULLAS)', shortCode: 'LITR', description: 'उल्लास साक्षरता पंजीयन विवरण' },
] as const;

export const DATA_COMPLETENESS_CRITERIA_COUNT = DATA_COMPLETENESS_CRITERIA.length;

/**
 * Compute School Data Completeness across vital parameters
 */
export function computeDataCompleteness(
  schools: any[],
  students: any[],
  staff: any[],
  facilities: any[],
  attendance: any[],
  mdm: any[],
  works: any[],
  complaints: any[],
  literacy: any[],
  sessionId: string
) {
  const effectiveSession = sessionId || institutionConfig.academicSession;
  return schools.map((school) => {
    const schStudents = students.filter((s) => s.schoolUdise === school.udise);
    const schStaff = staff.filter((s) => s.assignedSchoolUdise === school.udise);
    const schFac = facilities.filter((f) => f.schoolUdise === school.udise);
    const schAtt = attendance.filter((a) => a.schoolUdise === school.udise && a.sessionId === effectiveSession);
    const schMdm = mdm.filter((m) => m.schoolUdise === school.udise && m.sessionId === effectiveSession);
    const schWorks = works.filter((w) => (w.schoolUdise === school.udise || w.schoolUdise === 'ALL') && w.sessionId === effectiveSession);
    const schComplaints = complaints.filter((c) => c.schoolUdise === school.udise && c.sessionId === effectiveSession);
    const schLit = literacy.filter((l) => l.schoolUdise === school.udise && (l.sessionId === effectiveSession || l.academicYear === effectiveSession));

    const checks = [
      { id: 'PROFILE', name: DATA_COMPLETENESS_CRITERIA[0].name, passed: !!(school.udise && school.name && school.village && school.schoolType && school.principalName) },
      { id: 'STUDENTS', name: DATA_COMPLETENESS_CRITERIA[1].name, passed: schStudents.length > 0 },
      { id: 'STAFF', name: DATA_COMPLETENESS_CRITERIA[2].name, passed: schStaff.length > 0 },
      { id: 'FACILITIES', name: DATA_COMPLETENESS_CRITERIA[3].name, passed: schFac.length >= 5 },
      { id: 'ATTENDANCE', name: DATA_COMPLETENESS_CRITERIA[4].name, passed: schAtt.length > 0 },
      { id: 'MDM', name: DATA_COMPLETENESS_CRITERIA[5].name, passed: schMdm.length > 0 },
      { id: 'WORK', name: DATA_COMPLETENESS_CRITERIA[6].name, passed: schWorks.length > 0 },
      { id: 'COMPLAINTS', name: DATA_COMPLETENESS_CRITERIA[7].name, passed: schComplaints.length > 0 },
      { id: 'ULLAS', name: DATA_COMPLETENESS_CRITERIA[8].name, passed: schLit.length > 0 },
    ];

    const passedCount = checks.filter((c) => c.passed).length;
    const pct = Math.round((passedCount / checks.length) * 100);
    const missing = checks.filter((c) => !c.passed).map((c) => c.name);

    let status: 'पूर्ण' | 'आंशिक' | 'अपूर्ण' = 'पूर्ण';
    if (pct < 50) status = 'अपूर्ण';
    else if (pct < 100) status = 'आंशिक';

    return {
      udise: school.udise,
      schoolName: school.hindiName || school.name,
      schoolType: school.schoolType,
      village: school.village,
      principal: school.principalName,
      mobile: school.principalMobile,
      passedCount,
      totalChecks: checks.length,
      percentage: pct,
      status,
      missingItems: missing,
      checks,
      counts: {
        students: schStudents.length,
        staff: schStaff.length,
        facilities: schFac.length,
        attendance: schAtt.length,
        mdm: schMdm.length,
      },
    };
  });
}

/**
 * Compute Live Dynamic KPIs for Dashboard
 */
export function computeExecutiveKPIs(allData: any, userRole: string, userAssignedUdise?: string, sessionId?: string): MetricCardData[] {
  const {
    schools = [],
    students = [],
    staff = [],
    rasoiya = [],
    attendance = [],
    mdmRecords = [],
    governmentWork = [],
    complaints = [],
    facilities = [],
    literacyRegisters = [],
  } = allData;

  const targetUdise = userRole === 'SCHOOL' ? userAssignedUdise : undefined;
  const effectiveSessionId = sessionId || allData.selectedSessionId || institutionConfig.academicSession;

  // Session-isolated student and staff composition
  let activeStudents = [];
  if (allData.studentMasters && allData.studentAcademicRecords) {
    activeStudents = composeStudentsForSession(allData.studentMasters, allData.studentAcademicRecords, effectiveSessionId);
  } else {
    activeStudents = students.filter((s: any) => s.sessionId === effectiveSessionId);
  }

  let activeStaff = [];
  if (allData.staffMasters && allData.staffPostings) {
    activeStaff = composeStaffForSession(allData.staffMasters, allData.staffPostings, effectiveSessionId);
  } else {
    activeStaff = staff.filter((s: any) => s.sessionId === effectiveSessionId);
  }

  // Session-isolated operational records: STRICT matching, ZERO fallback
  const sessionAttendance = attendance.filter((a: any) => a.sessionId === effectiveSessionId);
  const sessionMDM = mdmRecords.filter((m: any) => m.sessionId === effectiveSessionId);
  const sessionWork = governmentWork.filter((w: any) => w.sessionId === effectiveSessionId);
  const sessionComplaints = complaints.filter((c: any) => c.sessionId === effectiveSessionId);
  const sessionRasoiya = rasoiya.filter((r: any) => r.sessionId === effectiveSessionId);

  const scopedSchools = targetUdise ? schools.filter((s: any) => s.udise === targetUdise) : schools;
  const scopedStudents = targetUdise ? activeStudents.filter((s: any) => s.schoolUdise === targetUdise) : activeStudents;
  const scopedStaff = targetUdise ? activeStaff.filter((s: any) => s.assignedSchoolUdise === targetUdise) : activeStaff;
  const scopedRasoiya = targetUdise ? sessionRasoiya.filter((r: any) => r.schoolUdise === targetUdise) : sessionRasoiya;
  const scopedWork = targetUdise ? sessionWork.filter((w: any) => !w.schoolUdise || w.schoolUdise === targetUdise || w.schoolUdise === 'ALL') : sessionWork;
  const scopedComplaints = targetUdise ? sessionComplaints.filter((c: any) => c.schoolUdise === targetUdise) : sessionComplaints;
  const scopedAttendance = targetUdise ? sessionAttendance.filter((a: any) => a.schoolUdise === targetUdise) : sessionAttendance;
  const scopedMDM = targetUdise ? sessionMDM.filter((m: any) => m.schoolUdise === targetUdise) : sessionMDM;

  const boys = scopedStudents.filter((s: any) => s.gender === 'बालक' || s.gender === 'MALE').length;
  const girls = scopedStudents.filter((s: any) => s.gender === 'बालिका' || s.gender === 'FEMALE').length;

  const teachers = scopedStaff.filter(
    (s: any) =>
      s.designation?.includes('शिक्षक') ||
      s.designation?.includes('Teacher') ||
      s.designation?.includes('अध्यापक') ||
      s.designation?.includes('प्रधानाध्यापक')
  ).length;

  const otherStaff = scopedStaff.length - teachers;

  // Attendance calculation
  const today = new Date().toISOString().split('T')[0];
  const todayAtt = scopedAttendance.filter((a: any) => a.date === today);
  let todayAttPct = 0;
  if (todayAtt.length > 0) {
    const totalReg = todayAtt.reduce((sum: number, a: any) => sum + (a.totalCount || 0), 0);
    const totalPres = todayAtt.reduce((sum: number, a: any) => sum + (a.presentCount || 0), 0);
    todayAttPct = totalReg > 0 ? Math.round((totalPres / totalReg) * 100) : 0;
  } else if (scopedAttendance.length > 0) {
    // Recent attendance average
    const recent = scopedAttendance.slice(-10);
    const totalReg = recent.reduce((sum: number, a: any) => sum + (a.totalCount || 0), 0);
    const totalPres = recent.reduce((sum: number, a: any) => sum + (a.presentCount || 0), 0);
    todayAttPct = totalReg > 0 ? Math.round((totalPres / totalReg) * 100) : 0;
  }

  // Today MDM
  const todayMDM = scopedMDM.filter((m: any) => m.date === today);
  const mdmServedToday = todayMDM.reduce((sum: number, m: any) => sum + (m.mealsServed || 0), 0);

  // Government Work
  const pendingWork = scopedWork.filter((w: any) => w.status !== 'COMPLETED').length;
  const overdueWork = scopedWork.filter((w: any) => w.status !== 'COMPLETED' && w.dueDate && w.dueDate < today).length;

  // Complaints
  const pendingComplaints = scopedComplaints.filter((c: any) => c.status !== 'RESOLVED' && c.status !== 'CLOSED').length;

  // Data incomplete schools
  const completenessList = computeDataCompleteness(
    scopedSchools,
    activeStudents,
    activeStaff,
    facilities,
    sessionAttendance,
    sessionMDM,
    sessionWork,
    sessionComplaints,
    literacyRegisters,
    effectiveSessionId
  );
  const incompleteSchools = completenessList.filter((c) => c.status !== 'पूर्ण').length;

  return [
    {
      id: 'kpi-schools',
      label: 'कुल संबद्ध विद्यालय',
      value: scopedSchools.length,
      subtext: userRole === 'SCHOOL' ? 'अधिकृत विद्यालय' : `संकुल: ${scopedSchools.length} सक्रिय शालाएं`,
      color: 'emerald',
      targetReportId: 'GOV_SCHOOL_PROFILE',
    },
    {
      id: 'kpi-students',
      label: 'कुल विद्यार्थी',
      value: scopedStudents.length,
      subtext: `बालक: ${boys} | बालिका: ${girls}`,
      color: 'blue',
      targetReportId: 'GOV_STUDENTS_DEMOGRAPHICS',
    },
    {
      id: 'kpi-teachers',
      label: 'कुल शिक्षक',
      value: teachers,
      subtext: `अन्य स्टाफ: ${otherStaff}`,
      color: 'amber',
      targetReportId: 'GOV_STAFF_ROSTER',
    },
    {
      id: 'kpi-attendance',
      label: 'दैनिक उपस्थिति',
      value: `${todayAttPct}%`,
      subtext: todayAtt.length > 0 ? 'आज का औसत' : 'हालिया औसत',
      color: 'purple',
      targetReportId: 'GOV_ATTENDANCE_ANALYSIS',
    },
    {
      id: 'kpi-mdm',
      label: 'मध्याह्न भोजन (MDM)',
      value: mdmServedToday > 0 ? `${mdmServedToday} छात्र` : `${scopedMDM.length} प्रविष्टियां`,
      subtext: mdmServedToday > 0 ? 'आज लाभान्वित' : 'सत्र अभिलेख',
      color: 'orange',
      targetReportId: 'GOV_MDM_REPORT',
    },
    {
      id: 'kpi-work',
      label: 'लंबित शासकीय कार्य',
      value: pendingWork,
      subtext: overdueWork > 0 ? `⚠️ ${overdueWork} समयावधि पार (Overdue)` : 'समय-सीमा में',
      color: overdueWork > 0 ? 'red' : 'indigo',
      targetReportId: 'GOV_GOVT_WORK_REPORT',
      targetFilter: { status: 'PENDING' },
    },
    {
      id: 'kpi-complaints',
      label: 'लंबित शिकायतें',
      value: pendingComplaints,
      subtext: `${scopedComplaints.length - pendingComplaints} का सफल निराकरण`,
      color: pendingComplaints > 0 ? 'rose' : 'teal',
      targetReportId: 'GOV_COMPLAINTS_REPORT',
      targetFilter: { status: 'OPEN' },
    },
    {
      id: 'kpi-completeness',
      label: 'डेटा अपूर्ण शालाएं',
      value: incompleteSchools,
      subtext: incompleteSchools === 0 ? 'शत-प्रतिशत पूर्ण' : 'तत्काल पूर्णता अपेक्षित',
      color: incompleteSchools > 0 ? 'yellow' : 'emerald',
      targetReportId: 'GOV_DATA_COMPLETENESS',
      targetFilter: { status: 'INCOMPLETE' },
    },
  ];
}

/**
 * Standard Export Payload Builder Helper
 */
function buildPayload(
  calcResult: ReportCalculationResult,
  filters: ReportFilterState,
  schoolInfo?: { name: string; udise: string },
  orientation: 'portrait' | 'landscape' = 'portrait'
): ExportDataPayload {
  return {
    title: calcResult.title,
    subtitle: calcResult.subtitle,
    session: filters.sessionId || institutionConfig.academicSession,
    schoolName: schoolInfo?.name,
    udise: schoolInfo?.udise,
    orientation,
    summaryMetrics: calcResult.summaryMetrics,
    headers: calcResult.headers,
    rows: calcResult.rows,
    fileName: `Government_Report_${calcResult.title.replace(/\s+/g, '_')}`,
  };
}

/**
 * CENTRALIZED GOVERNMENT REPORT REGISTRY
 * All 15 official report modules with calculation, export payloads, and real data bindings
 */
export const GOVERNMENT_REPORT_REGISTRY: GovernmentReportDefinition[] = [
  // 1. CONSOLIDATED CLUSTER REPORT
  {
    id: 'GOV_CONSOLIDATED',
    title: 'संकुल समेकित कार्यपालन प्रतिवेदन',
    hindiTitle: 'संकुल समेकित कार्यपालन प्रतिवेदन',
    category: 'CONSOLIDATED',
    description: 'सक्रिय विद्यालयों का समग्र विश्लेषणात्मक सारांश, नामांकन, शिक्षक, उपस्थिति एवं अधोसंरचना',
    iconName: 'Layers',
    supportedRoles: ['ADMIN', 'CAC'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { search: true },
    calculate: ({ filters, allData }) => {
      const schools = allData.schools || [];
      const sess = filters.sessionId;
      const students = (allData.studentMasters && allData.studentAcademicRecords && sess)
        ? composeStudentsForSession(allData.studentMasters, allData.studentAcademicRecords, sess)
        : (allData.students || []).filter((s: any) => sess ? s.sessionId === sess : true);
      const staff = (allData.staffMasters && allData.staffPostings && sess)
        ? composeStaffForSession(allData.staffMasters, allData.staffPostings, sess)
        : (allData.staff || []).filter((st: any) => sess ? st.sessionId === sess : true);
      const attendance = (allData.attendance || []).filter((a: any) => sess ? a.sessionId === sess : true);
      const mdm = (allData.mdmRecords || []).filter((m: any) => sess ? m.sessionId === sess : true);
      const work = (allData.governmentWork || []).filter((w: any) => sess ? w.sessionId === sess : true);
      const complaints = (allData.complaints || []).filter((c: any) => sess ? c.sessionId === sess : true);

      const totalSchools = schools.length;
      const totalStudents = students.length;
      const boys = students.filter((s: any) => s.gender === 'बालक' || s.gender === 'MALE').length;
      const girls = students.filter((s: any) => s.gender === 'बालिका' || s.gender === 'FEMALE').length;
      const totalStaff = staff.length;
      const teachers = staff.filter((s: any) => s.designation?.includes('शिक्षक') || s.designation?.includes('Teacher') || s.designation?.includes('प्रधानाध्यापक')).length;
      const completedWorks = work.filter((w: any) => w.status === 'COMPLETED').length;
      const resolvedComplaints = complaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

      const headers = [
        'क्र.',
        'यूडाइस कोड',
        'विद्यालय का नाम',
        'प्रकार',
        'ग्राम / पंचायत',
        'संस्था प्रधान',
        'मोबाइल',
        'नामांकन',
        'शिक्षक संख्या',
        'स्थिति',
      ];

      const rows = schools.map((s: any, idx: number) => {
        const schStudCount = students.filter((st: any) => st.schoolUdise === s.udise).length;
        const schStaffCount = staff.filter((st: any) => st.assignedSchoolUdise === s.udise).length;
        return [
          idx + 1,
          s.udise,
          s.hindiName || s.name,
          s.schoolType,
          `${s.village || '-'} / ${s.gramPanchayat || '-'}`,
          s.principalName || '-',
          s.principalMobile || '-',
          schStudCount,
          schStaffCount,
          s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय',
        ];
      });

      return {
        title: 'संकुल समेकित कार्यपालन प्रतिवेदन (Executive Cluster Report)',
        subtitle: `${institutionConfig.institutionName} | विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}, ${institutionConfig.state}`,
        summaryMetrics: [
          { label: 'कुल संबद्ध विद्यालय', value: totalSchools },
          { label: 'कुल विद्यार्थी', value: totalStudents },
          { label: 'बालक / बालिका', value: `${boys} / ${girls}` },
          { label: 'कुल शिक्षक', value: teachers },
          { label: 'शासकीय कार्य पूर्णता', value: `${work.length > 0 ? Math.round((completedWorks / work.length) * 100) : 0}%` },
          { label: 'शिकायत निवारण दर', value: `${complaints.length > 0 ? Math.round((resolvedComplaints / complaints.length) * 100) : 100}%` },
        ],
        headers,
        rows,
        rawItems: schools,
        isEmpty: schools.length === 0,
        emptyMessage: 'संकुल में अभी कोई विद्यालय दर्ज नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 2. SCHOOL WISE PROFILE
  {
    id: 'GOV_SCHOOL_PROFILE',
    title: 'विद्यालयवार प्रोफ़ाइल एवं अधोसंरचना विवरण',
    hindiTitle: 'विद्यालयवार प्रोफ़ाइल एवं अधोसंरचना विवरण',
    category: 'SCHOOL',
    description: 'UDISE कोड, स्थापना वर्ष, संस्था प्रधान, संपर्क विवरण एवं शाला प्रकार',
    iconName: 'School',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE'],
    defaultScope: 'FULL',
    availableFilters: { school: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const schools = getSchoolsBySessionAndScope(
        allData.schools || [],
        filters.schoolUdise,
        currentUserRole,
        userAssignedSchoolUdise
      );

      let filtered = schools;
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (s: any) =>
            s.name?.toLowerCase().includes(q) ||
            s.hindiName?.toLowerCase().includes(q) ||
            s.udise?.includes(q) ||
            s.village?.toLowerCase().includes(q)
        );
      }

      const headers = [
        'क्र.',
        'यूडाइस कोड',
        'विद्यालय का नाम',
        'शाला प्रकार',
        'ग्राम / मजरा',
        'ग्राम पंचायत',
        'स्थापना वर्ष',
        'संस्था प्रधान का नाम',
        'मोबाइल नंबर',
        'स्थिति',
      ];

      const rows = filtered.map((s: any, idx: number) => [
        idx + 1,
        s.udise,
        s.hindiName || s.name,
        s.schoolType,
        s.village || '-',
        s.gramPanchayat || '-',
        s.establishmentYear || '-',
        s.principalName || '-',
        s.principalMobile || '-',
        s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय',
      ]);

      return {
        title: 'विद्यालयवार प्रोफ़ाइल प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | अधिकृत विद्यालय विवरण`,
        summaryMetrics: [
          { label: 'सूचीबद्ध विद्यालय', value: filtered.length },
          { label: 'प्राथमिक विद्यालय', value: filtered.filter((s: any) => s.schoolType?.includes('प्राथमिक')).length },
          { label: 'माध्यमिक विद्यालय', value: filtered.filter((s: any) => s.schoolType?.includes('माध्यमिक')).length },
        ],
        headers,
        rows,
        rawItems: filtered,
        isEmpty: filtered.length === 0,
        emptyMessage: 'चयनित विद्यालय की प्रोफ़ाइल उपलब्ध नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 3. STUDENT ENROLLMENT LIST
  {
    id: 'GOV_STUDENTS_ENROLLMENT',
    title: 'विद्यार्थी पंजीयन एवं व्यक्तिगत नामावली प्रतिवेदन',
    hindiTitle: 'विद्यार्थी पंजीयन एवं व्यक्तिगत नामावली प्रतिवेदन',
    category: 'STUDENT',
    description: 'समग्र आईडी, स्कॉलर नंबर, छात्र/छात्रा नाम, अभिभावक विवरण, कक्षा व शाला',
    iconName: 'GraduationCap',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE'],
    defaultScope: 'FULL',
    availableFilters: { school: true, classLevel: true, category: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const students = getStudentsBySessionAndSchool(
        allData.students || [],
        filters,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const boys = students.filter((s: any) => s.gender === 'बालक' || s.gender === 'MALE').length;
      const girls = students.filter((s: any) => s.gender === 'बालिका' || s.gender === 'FEMALE').length;

      const headers = [
        'क्र.',
        'समग्र आईडी',
        'स्कॉलर क्रमांक',
        'विद्यार्थी का नाम',
        'पिता का नाम',
        'माता का नाम',
        'कक्षा',
        'जेंडर',
        'सामाजिक वर्ग',
        'दिव्यांग (CWSN)',
        'यूडाइस कोड',
      ];

      const rows = students.map((st: any, idx: number) => [
        idx + 1,
        st.samagraId || '-',
        st.scholarNo || st.rollNumber || '-',
        st.name,
        st.fatherName || '-',
        st.motherName || '-',
        `कक्षा ${st.class}`,
        st.gender || '-',
        st.category || '-',
        st.isCwsn ? 'हाँ (CWSN)' : 'नहीं',
        st.schoolUdise,
      ]);

      return {
        title: 'विद्यार्थी पंजीयन एवं व्यक्तिगत विवरण प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल दर्ज छात्र: ${students.length}`,
        summaryMetrics: [
          { label: 'कुल नामांकन', value: students.length },
          { label: 'बालक', value: boys },
          { label: 'बालिका', value: girls },
          { label: 'सक्रिय शालाएं', value: new Set(students.map((s: any) => s.schoolUdise)).size },
        ],
        headers,
        rows,
        rawItems: students,
        isEmpty: students.length === 0,
        emptyMessage: 'चयनित फ़िल्टर के अनुसार कोई विद्यार्थी रिकॉर्ड उपलब्ध नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 4. STUDENT DEMOGRAPHICS
  {
    id: 'GOV_STUDENTS_DEMOGRAPHICS',
    title: 'विद्यार्थी वर्ग एवं जेंडर सांख्यिकी प्रतिवेदन',
    hindiTitle: 'विद्यार्थी वर्ग एवं जेंडर सांख्यिकी प्रतिवेदन',
    category: 'STUDENT',
    description: 'कक्षावार, जेंडर (बालक/बालिका), सामाजिक वर्ग (SC/ST/OBC/GEN) एवं CWSN समेकित सांख्यिकी',
    iconName: 'Users',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE'],
    defaultScope: 'FULL',
    availableFilters: { school: true, classLevel: true, category: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const students = getStudentsBySessionAndSchool(
        allData.students || [],
        filters,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const classes = filters.classLevel && filters.classLevel !== 'ALL'
        ? [filters.classLevel]
        : ['1', '2', '3', '4', '5', '6', '7', '8'];

      let totalBoys = 0;
      let totalGirls = 0;
      let totalSC = 0;
      let totalST = 0;
      let totalOBC = 0;
      let totalGen = 0;
      let totalCwsn = 0;

      const classRows = classes.map((cls, idx) => {
        const clsStudents = students.filter((s: any) => String(s.class) === String(cls));
        const boys = clsStudents.filter((s: any) => s.gender === 'बालक' || s.gender === 'MALE').length;
        const girls = clsStudents.filter((s: any) => s.gender === 'बालिका' || s.gender === 'FEMALE').length;
        const sc = clsStudents.filter((s: any) => s.category === 'SC').length;
        const st = clsStudents.filter((s: any) => s.category === 'ST').length;
        const obc = clsStudents.filter((s: any) => s.category === 'OBC').length;
        const gen = clsStudents.filter((s: any) => s.category === 'GENERAL' || s.category === 'सामान्य').length;
        const cwsn = clsStudents.filter((s: any) => s.isCwsn).length;

        totalBoys += boys;
        totalGirls += girls;
        totalSC += sc;
        totalST += st;
        totalOBC += obc;
        totalGen += gen;
        totalCwsn += cwsn;

        return [
          idx + 1,
          `कक्षा ${cls}`,
          boys,
          girls,
          clsStudents.length,
          sc,
          st,
          obc,
          gen,
          cwsn,
        ];
      });

      if (classes.length > 1) {
        classRows.push([
          '-',
          'कुल योग (Grand Total)',
          totalBoys,
          totalGirls,
          students.length,
          totalSC,
          totalST,
          totalOBC,
          totalGen,
          totalCwsn,
        ]);
      }

      const headers = [
        'क्र.',
        'कक्षा',
        'बालक (Boys)',
        'बालिकाएं (Girls)',
        'कुल दर्ज',
        'अनुसूचित जाति (SC)',
        'अनुसूचित जनजाति (ST)',
        'अन्य पिछड़ा वर्ग (OBC)',
        'सामान्य (GEN)',
        'दिव्यांग (CWSN)',
      ];

      return {
        title: 'विद्यार्थी सामाजिक वर्ग एवं जेंडर सांख्यिकी प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल दर्ज छात्र: ${students.length}`,
        summaryMetrics: [
          { label: 'कुल नामांकन', value: students.length },
          { label: 'बालक', value: totalBoys },
          { label: 'बालिका', value: totalGirls },
          { label: 'SC छात्र', value: totalSC },
          { label: 'ST छात्र', value: totalST },
          { label: 'OBC छात्र', value: totalOBC },
          { label: 'सामान्य वर्ग', value: totalGen },
          { label: 'दिव्यांग (CWSN)', value: totalCwsn },
        ],
        headers,
        rows: classRows,
        rawItems: students,
        isEmpty: students.length === 0,
        emptyMessage: 'चयनित फ़िल्टर के अनुसार कोई विद्यार्थी डेटा उपलब्ध नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 4. STAFF ROSTER
  {
    id: 'GOV_STAFF_ROSTER',
    title: 'शिक्षक एवं कर्मचारी पदस्थापना विवरण',
    hindiTitle: 'शिक्षक एवं कर्मचारी पदस्थापना विवरण',
    category: 'STAFF',
    description: 'कर्मचारी कोड, पदनाम, विषय, पदस्थ शाला, मोबाइल व शैक्षणिक योग्यता',
    iconName: 'Users',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE'],
    defaultScope: 'FULL',
    availableFilters: { school: true, status: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const staff = getStaffBySessionAndSchool(
        allData.staff || [],
        filters,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const principals = staff.filter((s: any) => s.designation?.includes('प्रधानाध्यापक') || s.designation?.includes('Headmaster')).length;
      const teachers = staff.filter((s: any) => s.designation?.includes('शिक्षक') || s.designation?.includes('Teacher')).length;
      const bloCount = staff.filter((s: any) => s.isBlo === true || s.isBlo === 'YES').length;

      const headers = [
        'क्र.',
        'कर्मचारी कोड',
        'शिक्षक / कर्मचारी का नाम',
        'पदनाम',
        'विषय',
        'योग्यता',
        'मोबाइल नंबर',
        'पदस्थ शाला कोड',
        'बी.एल.ओ. दायित्व',
        'स्थिति',
      ];

      const rows = staff.map((t: any, idx: number) => [
        idx + 1,
        t.employeeId || t.employeeCode || '-',
        t.name,
        t.designation || '-',
        t.subject || 'समस्त प्राथमिक विषय',
        t.qualification || '-',
        t.mobile || '-',
        t.assignedSchoolUdise || '-',
        t.isBlo === true || t.isBlo === 'YES' ? 'हाँ (BLO)' : 'नहीं',
        t.status === 'ACTIVE' ? 'कार्यरत' : t.status || 'कार्यरत',
      ]);

      return {
        title: 'शिक्षक एवं कर्मचारी पदस्थापना प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल स्टाफ: ${staff.length}`,
        summaryMetrics: [
          { label: 'कुल कर्मचारी', value: staff.length },
          { label: 'प्रधानाध्यापक', value: principals },
          { label: 'शिक्षक', value: teachers },
          { label: 'बी.एल.ओ. दायित्व पर', value: bloCount },
        ],
        headers,
        rows,
        rawItems: staff,
        isEmpty: staff.length === 0,
        emptyMessage: 'चयनित विद्यालय अथवा फ़िल्टर में कोई शिक्षक/स्टाफ रिकॉर्ड नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 5. ATTENDANCE ANALYSIS
  {
    id: 'GOV_ATTENDANCE_ANALYSIS',
    title: 'दैनिक एवं सत्रीय उपस्थिति विश्लेषण प्रतिवेदन',
    hindiTitle: 'दैनिक एवं सत्रीय उपस्थिति विश्लेषण प्रतिवेदन',
    category: 'ATTENDANCE',
    description: 'छात्र व शिक्षक दैनिक उपस्थिति %, औसत, अवकाश प्रविष्टि व कक्षावार विश्लेषण',
    iconName: 'CalendarCheck',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { school: true, dateRange: true, classLevel: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const attendance = getAttendanceBySessionAndSchool(
        allData.attendance || [],
        filters,
        currentUserRole,
        userAssignedSchoolUdise
      );

      let totalPresent = 0;
      let totalRegistered = 0;
      let holidayCount = 0;

      attendance.forEach((a: any) => {
        if (a.isHoliday) {
          holidayCount++;
        } else {
          totalRegistered += a.totalCount || 0;
          totalPresent += a.presentCount || 0;
        }
      });

      const overallPct = totalRegistered > 0 ? Math.round((totalPresent / totalRegistered) * 100) : 0;

      const headers = [
        'क्र.',
        'दिनांक',
        'यूडाइस कोड',
        'प्रकार',
        'कक्षा',
        'कुल दर्ज',
        'उपस्थित',
        'अनुपस्थित',
        'उपस्थिति %',
        'अवकाश / टिप्पणी',
      ];

      const rows = attendance.map((a: any, idx: number) => {
        if (a.isHoliday) {
          return [
            idx + 1,
            a.date,
            a.schoolUdise,
            a.type === 'STUDENT' ? 'विद्यार्थी' : 'स्टाफ',
            a.class ? `कक्षा ${a.class}` : 'समस्त',
            a.totalCount || '-',
            '-',
            '-',
            'N/A',
            `शासकीय अवकाश (${a.holidayReason || 'निर्धारित अवकाश'})`,
          ];
        }

        const pct = a.totalCount > 0 ? Math.round(((a.presentCount || 0) / a.totalCount) * 100) : 0;
        return [
          idx + 1,
          a.date,
          a.schoolUdise,
          a.type === 'STUDENT' ? 'विद्यार्थी' : 'स्टाफ',
          a.class ? `कक्षा ${a.class}` : 'समस्त',
          a.totalCount,
          a.presentCount,
          a.absentCount,
          `${pct}%`,
          a.remarks || 'नियमित कार्य दिवस',
        ];
      });

      return {
        title: 'छात्र एवं स्टाफ उपस्थिति विश्लेषण प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल अभिलेख: ${attendance.length}`,
        summaryMetrics: [
          { label: 'कुल प्रविष्टियां', value: attendance.length },
          { label: 'औसत संकुल उपस्थिति', value: `${overallPct}%` },
          { label: 'कुल उपस्थित छात्र संख्या', value: totalPresent },
          { label: 'अवकाश दिवस', value: holidayCount },
        ],
        headers,
        rows,
        rawItems: attendance,
        isEmpty: attendance.length === 0,
        emptyMessage: 'चयनित समयावधि अथवा विद्यालय हेतु कोई उपस्थिति प्रविष्टि दर्ज नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 6. MDM DISTRIBUTION REPORT
  {
    id: 'GOV_MDM_REPORT',
    title: 'मध्याह्न भोजन (MDM) वितरण व स्टॉक प्रतिवेदन',
    hindiTitle: 'मध्याह्न भोजन (MDM) वितरण व स्टॉक प्रतिवेदन',
    category: 'MDM',
    description: 'लाभान्वित छात्र, खाद्यान्न उपलब्धता (गेहूं/चावल), रसोइया उपस्थिति एवं SHG विवरण',
    iconName: 'Utensils',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { school: true, dateRange: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const mdmList = getMDMBySessionAndSchool(
        allData.mdmRecords || [],
        filters,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const totalMealsServed = mdmList.reduce((acc: number, curr: any) => acc + (curr.mealsServed || 0), 0);
      const totalEligible = mdmList.reduce((acc: number, curr: any) => acc + (curr.eligibleStudents || 0), 0);
      const avgMeals = mdmList.length > 0 ? Math.round(totalMealsServed / mdmList.length) : 0;
      const completionRate = totalEligible > 0 ? Math.round((totalMealsServed / totalEligible) * 100) : 0;

      const headers = [
        'क्र.',
        'दिनांक',
        'यूडाइस कोड',
        'पात्र छात्र',
        'लाभान्वित छात्र',
        'मीनू प्रकार',
        'स्व-सहायता समूह (SHG)',
        'गेहूं स्टॉक (किग्रा)',
        'चावल स्टॉक (किग्रा)',
        'रसोई स्वच्छता',
      ];

      const rows = mdmList.map((m: any, idx: number) => [
        idx + 1,
        m.date,
        m.schoolUdise,
        m.eligibleStudents || 0,
        m.mealsServed || 0,
        m.menuItem || 'रोटी-सब्जी / दाल-चावल',
        m.shgName || '-',
        m.wheatStockKg || '-',
        m.riceStockKg || '-',
        m.kitchenHygiene || 'संतोषजनक',
      ]);

      return {
        title: 'मध्याह्न भोजन (MDM) वितरण एवं स्टॉक प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल वितरण दिवस: ${mdmList.length}`,
        summaryMetrics: [
          { label: 'वितरण दिवस', value: mdmList.length },
          { label: 'कुल परोसे गए भोजन', value: totalMealsServed },
          { label: 'औसत दैनिक लाभान्वित', value: avgMeals },
          { label: 'पात्रता पूर्ति दर', value: `${completionRate}%` },
        ],
        headers,
        rows,
        rawItems: mdmList,
        isEmpty: mdmList.length === 0,
        emptyMessage: 'चयनित विद्यालय अथवा दिनांक हेतु मध्याह्न भोजन का कोई रिकॉर्ड उपलब्ध नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 7. FACILITIES REPORT
  {
    id: 'GOV_FACILITIES_REPORT',
    title: 'भौतिक अधोसंरचना एवं 17-बिंदु संसाधन प्रतिवेदन',
    hindiTitle: 'भौतिक अधोसंरचना एवं 17-बिंदु संसाधन प्रतिवेदन',
    category: 'FACILITIES',
    description: 'भवन, शौचालय, पेयजल, विद्युत, बाउंड्रीवाल, खेल मैदान, ICT लैब आदि का भौतिक सत्यापन',
    iconName: 'Building2',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE'],
    defaultScope: 'FULL',
    availableFilters: { school: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      let facilities = allData.facilities || [];

      if (currentUserRole === 'SCHOOL') {
        const assigned = userAssignedSchoolUdise || filters.schoolUdise;
        facilities = facilities.filter((f: any) => f.schoolUdise === assigned);
      } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
        facilities = facilities.filter((f: any) => f.schoolUdise === filters.schoolUdise);
      }

      const availableCount = facilities.filter((f: any) => f.available === 'YES').length;
      const deficitCount = facilities.filter((f: any) => f.available === 'NO').length;
      const repairCount = facilities.filter((f: any) => f.condition === 'मरम्मत योग्य').length;

      const headers = [
        'क्र.',
        'यूडाइस कोड',
        'संसाधन / सुविधा का नाम',
        'उपलब्धता',
        'भौतिक स्थिति',
        'उपलब्ध संख्या',
        'मरम्मत अपेक्षित संख्या',
        'आवश्यकता / विवरण / टिप्पणी',
      ];

      const rows = facilities.map((f: any, idx: number) => [
        idx + 1,
        f.schoolUdise,
        f.facilityName,
        f.available === 'YES' ? 'उपलब्ध (हाँ)' : 'अनुपलब्ध (नहीं)',
        f.condition || 'संतोषजनक',
        f.usableCount || f.count || '-',
        f.repairRequiredCount || 0,
        f.available === 'NO' ? (f.requirementDetails || 'संसाधन की नवीन मांग') : (f.remarks || '-'),
      ]);

      return {
        title: 'भौतिक अधोसंरचना एवं 17-बिंदु सत्यापन प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल प्रविष्टियां: ${facilities.length}`,
        summaryMetrics: [
          { label: 'सत्यापित पैरामीटर', value: facilities.length },
          { label: 'उपलब्ध सुविधाएं', value: availableCount },
          { label: 'अभाव / अनुपलब्ध', value: deficitCount },
          { label: 'मरम्मत योग्य', value: repairCount },
        ],
        headers,
        rows,
        rawItems: facilities,
        isEmpty: facilities.length === 0,
        emptyMessage: 'संबंधित विद्यालय हेतु भौतिक संसाधन डेटा प्रविष्ट नहीं किया गया है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 8. GOVERNMENT WORK PROGRESS
  {
    id: 'GOV_GOVT_WORK_REPORT',
    title: 'शासकीय कार्य एवं समय-सीमा (Overdue) प्रगति प्रतिवेदन',
    hindiTitle: 'शासकीय कार्य एवं समय-सीमा (Overdue) प्रगति प्रतिवेदन',
    category: 'GOVT_WORK',
    description: 'आदेश क्रमांक, कार्य विवरण, प्रभारी, अंतिम तिथि, पूर्णता एवं लंबित कार्य विश्लेषण',
    iconName: 'ClipboardList',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { school: true, status: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const works = getGovernmentWorkBySessionAndSchool(
        allData.governmentWork || [],
        filters,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const today = new Date().toISOString().split('T')[0];
      const completed = works.filter((w: any) => w.status === 'COMPLETED').length;
      const inProgress = works.filter((w: any) => w.status === 'IN_PROGRESS').length;
      const pending = works.filter((w: any) => w.status === 'PENDING').length;
      const overdue = works.filter((w: any) => w.status !== 'COMPLETED' && w.dueDate && w.dueDate < today).length;

      const headers = [
        'क्र.',
        'कार्य का शीर्षक',
        'आदेश क्रमांक',
        'संबंधित शाला यूडाइस',
        'दायित्वधारी प्रभारी',
        'जारी दिनांक',
        'अंतिम तिथि',
        'प्राथमिकता',
        'कार्य स्थिति',
      ];

      const rows = works.map((w: any, idx: number) => {
        const isOverdue = w.status !== 'COMPLETED' && w.dueDate && w.dueDate < today;
        return [
          idx + 1,
          w.workName || w.title || '-',
          w.orderNumber || '-',
          w.schoolUdise || 'समस्त संकुल',
          w.responsiblePerson || '-',
          w.assignedDate || '-',
          w.dueDate || '-',
          w.priority === 'HIGH' ? 'उच्च' : w.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य',
          isOverdue
            ? 'समय-सीमा समाप्त (OVERDUE)'
            : w.status === 'COMPLETED'
            ? 'पूर्ण (Completed)'
            : w.status === 'IN_PROGRESS'
            ? 'प्रगतिरत (In Progress)'
            : 'लंबित (Pending)',
        ];
      });

      return {
        title: 'शासकीय कार्य एवं समय-सीमा प्रगति प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल कार्य: ${works.length}`,
        summaryMetrics: [
          { label: 'कुल कार्य', value: works.length },
          { label: 'पूर्ण कार्य', value: completed },
          { label: 'प्रगतिरत', value: inProgress },
          { label: 'लंबित', value: pending },
          { label: 'समय-सीमा पार (Overdue)', value: overdue },
        ],
        headers,
        rows,
        rawItems: works,
        isEmpty: works.length === 0,
        emptyMessage: 'वर्तमान फ़िल्टर के अनुसार कोई शासकीय कार्य प्रविष्टि नहीं मिली।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 9. COMPLAINTS RESOLUTION REPORT
  {
    id: 'GOV_COMPLAINTS_REPORT',
    title: 'जन शिकायत निवारण रजिस्टर एवं समाधान प्रतिवेदन',
    hindiTitle: 'जन शिकायत निवारण रजिस्टर एवं समाधान प्रतिवेदन',
    category: 'COMPLAINTS',
    description: 'दर्ज शिकायतें, श्रेणी, शिकायतकर्ता, जांच अधिकारी, समाधान दिनांक व इतिहास',
    iconName: 'AlertTriangle',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE'],
    defaultScope: 'FULL',
    availableFilters: { school: true, status: true, category: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const complaints = getComplaintsBySessionAndSchool(
        allData.complaints || [],
        filters,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const resolved = complaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
      const inProgress = complaints.filter((c: any) => c.status === 'IN_PROGRESS').length;
      const open = complaints.filter((c: any) => c.status === 'OPEN' || c.status === 'PENDING').length;
      const reopened = complaints.filter((c: any) => c.status === 'REOPENED' || c.status === 'RE_OPENED').length;

      const headers = [
        'क्र.',
        'शिकायत क्रमांक',
        'विषय / विवरण',
        'श्रेणी',
        'संबंधित विद्यालय यूडाइस',
        'शिकायतकर्ता',
        'दर्ज दिनांक (Complaint Date)',
        'स्थिति',
        'निराकरण दिनांक',
        'निराकरणकर्ता (Resolved By)',
        'समापन दिनांक (Close Date)',
        'समापनकर्ता (Closed By)',
        'पुनः खुलने का कारण',
        'कार्यवाही / इतिहास सारांश',
      ];

      const rows = complaints.map((c: any, idx: number) => {
        let historyStr = '-';
        if (Array.isArray(c.history) && c.history.length > 0) {
          historyStr = c.history
            .map((h: any) => `[${h.date || h.timestamp || ''}] ${h.action || h.status || ''}: ${h.notes || h.comment || ''}`)
            .join(' | ');
        } else if (c.resolutionNotes || c.actionTaken) {
          historyStr = c.resolutionNotes || c.actionTaken;
        }

        return [
          idx + 1,
          c.complaintId || `CMP-${idx + 1}`,
          c.subject || c.description || '-',
          c.category || '-',
          c.schoolUdise || '-',
          c.complainantName || c.submittedBy || '-',
          c.complaintDate || c.date || c.createdAt || '-',
          c.status === 'RESOLVED'
            ? 'निराकृत (Resolved)'
            : c.status === 'CLOSED'
            ? 'बंद (Closed)'
            : c.status === 'REOPENED'
            ? 'पुनः खुली (Reopened)'
            : c.status === 'IN_PROGRESS'
            ? 'प्रगतिरत (In Progress)'
            : 'लंबित (Open)',
          c.resolutionDate || '-',
          c.resolvedBy || '-',
          c.closeDate || c.closedAt || '-',
          c.closedBy || '-',
          c.reopenReason || c.reopenNotes || '-',
          historyStr,
        ];
      });

      return {
        title: 'जन शिकायत निवारण एवं समाधान प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल शिकायतें: ${complaints.length}`,
        summaryMetrics: [
          { label: 'कुल शिकायतें', value: complaints.length },
          { label: 'निराकृत (Resolved)', value: resolved },
          { label: 'प्रगतिरत (In Progress)', value: inProgress },
          { label: 'लंबित (Open)', value: open },
          { label: 'पुनः खुली (Reopened)', value: reopened },
        ],
        headers,
        rows,
        rawItems: complaints,
        isEmpty: complaints.length === 0,
        emptyMessage: 'वर्तमान में कोई शिकायत दर्ज नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 10. ULLAS LITERACY REPORT
  {
    id: 'GOV_ULLAS_REPORT',
    title: 'नवभारत साक्षरता कार्यक्रम (ULLAS) प्रपत्र 01-05 प्रतिवेदन',
    hindiTitle: 'नवभारत साक्षरता कार्यक्रम (ULLAS) प्रपत्र 01-05 प्रतिवेदन',
    category: 'ULLAS',
    description: 'साक्षरता पंजी, असाक्षर व्यक्ति, अक्षर साथी वालंटियर, परीक्षा परिणाम व संस्थाएं',
    iconName: 'BookOpen',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { school: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      let persons = allData.illiteratePersons || [];
      let sathis = allData.aksharSathis || [];
      let examResults = allData.literacyExamResults || [];

      if (currentUserRole === 'SCHOOL') {
        const assigned = userAssignedSchoolUdise || filters.schoolUdise;
        persons = persons.filter((p: any) => p.schoolUdise === assigned);
        sathis = sathis.filter((s: any) => s.schoolUdise === assigned);
        examResults = examResults.filter((e: any) => e.schoolUdise === assigned);
      } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
        persons = persons.filter((p: any) => p.schoolUdise === filters.schoolUdise);
        sathis = sathis.filter((s: any) => s.schoolUdise === filters.schoolUdise);
        examResults = examResults.filter((e: any) => e.schoolUdise === filters.schoolUdise);
      }

      if (filters.sessionId) {
        persons = persons.filter((p: any) => p.sessionId === filters.sessionId || p.academicYear === filters.sessionId);
        sathis = sathis.filter((s: any) => s.sessionId === filters.sessionId || s.academicYear === filters.sessionId);
        examResults = examResults.filter((e: any) => e.sessionId === filters.sessionId || e.academicYear === filters.sessionId);
      }

      const certified = examResults.filter((r: any) => r.resultStatus === 'PASS' || r.isCertified).length;

      const headers = [
        'क्र.',
        'शिक्षार्थी का नाम',
        'पिता / पति का नाम',
        'उम्र',
        'लिंग',
        'सामाजिक वर्ग',
        'ग्राम / मजरा',
        'संबद्ध शाला यूडाइस',
        'मार्गदर्शक अक्षर साथी',
        'मूल्यांकन स्थिति',
      ];

      const rows = persons.map((p: any, idx: number) => {
        const sathi = sathis.find((s: any) => s.id === p.assignedAksharSathiId);
        const result = examResults.find((r: any) => r.personId === p.id);
        return [
          idx + 1,
          p.name,
          p.fatherOrHusbandName || '-',
          p.age || '-',
          p.gender === 'FEMALE' ? 'महिला' : 'पुरुष',
          p.category || '-',
          p.village || '-',
          p.schoolUdise,
          sathi?.name || p.assignedAksharSathiName || 'नियुक्त नहीं',
          result ? (result.resultStatus === 'PASS' ? 'उत्तीर्ण (प्रमाणित)' : 'अनुत्तीर्ण') : 'अध्ययनरत',
        ];
      });

      return {
        title: 'नवभारत साक्षरता कार्यक्रम (ULLAS) प्रगति प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | चिन्हित असाक्षर शिक्षार्थी`,
        summaryMetrics: [
          { label: 'चिन्हित असाक्षर', value: persons.length },
          { label: 'अक्षर साथी वालंटियर', value: sathis.length },
          { label: 'परीक्षा में सम्मिलित', value: examResults.length },
          { label: 'प्रमाणित / साक्षर', value: certified },
        ],
        headers,
        rows,
        rawItems: persons,
        isEmpty: persons.length === 0,
        emptyMessage: 'नवभारत साक्षरता कार्यक्रम के अंतर्गत कोई शिक्षार्थी दर्ज नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 11. RASOIYA REPORT
  {
    id: 'GOV_RASOIYA_REPORT',
    title: 'मध्याह्न भोजन रसोइया विवरण एवं मानदेय प्रतिवेदन',
    hindiTitle: 'मध्याह्न भोजन रसोइया विवरण एवं मानदेय प्रतिवेदन',
    category: 'RASOIYA',
    description: 'रसोइया नाम, पदस्थ शाला, आधार (मास्क्ड), स्वास्थ्य परीक्षण, प्रशिक्षण एवं मानदेय',
    iconName: 'UtensilsCrossed',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE'],
    defaultScope: 'FULL',
    availableFilters: { school: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      let rasoiyaList = allData.rasoiya || [];

      if (currentUserRole === 'SCHOOL') {
        const assigned = userAssignedSchoolUdise || filters.schoolUdise;
        rasoiyaList = rasoiyaList.filter((r: any) => r.schoolUdise === assigned);
      } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
        rasoiyaList = rasoiyaList.filter((r: any) => r.schoolUdise === filters.schoolUdise);
      }

      if (filters.sessionId) {
        rasoiyaList = rasoiyaList.filter((r: any) => r.sessionId === filters.sessionId);
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        rasoiyaList = rasoiyaList.filter(
          (r: any) =>
            r.name?.toLowerCase().includes(q) ||
            r.mobile?.includes(q) ||
            r.schoolUdise?.includes(q)
        );
      }

      const trainedCount = rasoiyaList.filter((r: any) => r.trainingStatus === 'TRAINED').length;
      const medicalDone = rasoiyaList.filter((r: any) => r.healthCheckupStatus === 'UP_TO_DATE' || r.healthCheckupStatus === 'REGULAR').length;

      const headers = [
        'क्र.',
        'रसोइया का नाम',
        'पदस्थ शाला कोड',
        'संबंधित स्व-सहायता समूह',
        'मोबाइल नंबर',
        'आधार क्रमांक (मास्क्ड)',
        'पाककला प्रशिक्षण',
        'स्वास्थ्य परीक्षण',
        'मासिक मानदेय (रु.)',
        'भुगतान स्थिति',
      ];

      const rows = rasoiyaList.map((r: any, idx: number) => [
        idx + 1,
        r.name,
        r.schoolUdise,
        r.shgName || '-',
        r.mobile || '-',
        maskAadhaar(r.aadhaarNumber),
        r.trainingStatus === 'TRAINED' ? 'प्रशिक्षित' : 'अप्रशिक्षित',
        r.healthCheckupStatus === 'UP_TO_DATE' ? 'अद्यतन' : 'लंबित',
        r.monthlyHonorarium ? `₹${r.monthlyHonorarium}` : '₹2,000',
        r.paymentStatus === 'PAID' ? 'भुगतान पूर्ण' : 'प्रक्रियाधीन',
      ]);

      return {
        title: 'मध्याह्न भोजन रसोइया एवं मानदेय प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल रसोइया: ${rasoiyaList.length}`,
        summaryMetrics: [
          { label: 'कुल कार्यरत रसोइया', value: rasoiyaList.length },
          { label: 'प्रशिक्षित रसोइया', value: trainedCount },
          { label: 'स्वास्थ्य परीक्षण पूर्ण', value: medicalDone },
        ],
        headers,
        rows,
        rawItems: rasoiyaList,
        isEmpty: rasoiyaList.length === 0,
        emptyMessage: 'चयनित विद्यालय अथवा संकुल में कोई रसोइया प्रविष्टि उपलब्ध नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 12. SHG REPORT
  {
    id: 'GOV_SHG_REPORT',
    title: 'स्व-सहायता समूह (SHG) संकुल विवरण एवं सदस्य सूची',
    hindiTitle: 'स्व-सहायता समूह (SHG) संकुल विवरण एवं सदस्य सूची',
    category: 'SHG',
    description: 'समूह का नाम, पंजीयन क्रमांक, अध्यक्ष, सचिव, बैंक खाता एवं कुल सदस्य',
    iconName: 'Users2',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL', 'SINGLE', 'DUAL'],
    defaultScope: 'FULL',
    availableFilters: { school: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      let shgList = allData.shgs || [];

      if (currentUserRole === 'SCHOOL') {
        const assigned = userAssignedSchoolUdise || filters.schoolUdise;
        shgList = shgList.filter((s: any) => s.schoolUdise === assigned);
      } else if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
        shgList = shgList.filter((s: any) => s.schoolUdise === filters.schoolUdise);
      }

      if (filters.sessionId) {
        shgList = shgList.filter((s: any) => s.sessionId === filters.sessionId);
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        shgList = shgList.filter(
          (s: any) =>
            s.name?.toLowerCase().includes(q) ||
            s.presidentName?.toLowerCase().includes(q) ||
            s.secretaryName?.toLowerCase().includes(q)
        );
      }

      const totalMembers = shgList.reduce((acc: number, s: any) => acc + (s.members?.length || s.totalMembers || 0), 0);

      const headers = [
        'क्र.',
        'स्व-सहायता समूह का नाम',
        'संबद्ध शाला यूडाइस',
        'अध्यक्ष का नाम',
        'अध्यक्ष मोबाइल',
        'सचिव का नाम',
        'सचिव मोबाइल',
        'सदस्य संख्या',
        'बैंक का नाम',
        'खाता क्रमांक',
      ];

      const rows = shgList.map((s: any, idx: number) => [
        idx + 1,
        s.name,
        s.schoolUdise,
        s.presidentName || '-',
        s.presidentMobile || '-',
        s.secretaryName || '-',
        s.secretaryMobile || '-',
        s.members?.length || s.totalMembers || 0,
        s.bankName || '-',
        s.accountNumber ? `XXXX${s.accountNumber.slice(-4)}` : '-',
      ]);

      return {
        title: 'स्व-सहायता समूह (SHG) संकुल विवरण प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | कुल समूह: ${shgList.length}`,
        summaryMetrics: [
          { label: 'कुल सक्रिय समूह', value: shgList.length },
          { label: 'कुल समूह सदस्य', value: totalMembers },
        ],
        headers,
        rows,
        rawItems: shgList,
        isEmpty: shgList.length === 0,
        emptyMessage: 'चयनित विद्यालय से संबंधित कोई स्व-सहायता समूह दर्ज नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 13. DATA COMPLETENESS REPORT
  {
    id: 'GOV_DATA_COMPLETENESS',
    title: 'विद्यालयवार डेटा पूर्णता एवं सत्यापन प्रतिवेदन',
    hindiTitle: 'विद्यालयवार डेटा पूर्णता एवं सत्यापन प्रतिवेदन',
    category: 'COMPLETENESS',
    description: `${DATA_COMPLETENESS_CRITERIA_COUNT} मूलभूत मानकों पर प्रत्येक विद्यालय की डेटा एंट्री स्थिति व अपूर्णताएं`,
    iconName: 'CheckCircle2',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { school: true, status: true, search: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      let schools = getSchoolsBySessionAndScope(
        allData.schools || [],
        filters.schoolUdise,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const sess = filters.sessionId || institutionConfig.academicSession;
      const activeStudents = (allData.studentMasters && allData.studentAcademicRecords)
        ? composeStudentsForSession(allData.studentMasters, allData.studentAcademicRecords, sess)
        : (allData.students || []).filter((s: any) => s.sessionId === sess);
      const activeStaff = (allData.staffMasters && allData.staffPostings)
        ? composeStaffForSession(allData.staffMasters, allData.staffPostings, sess)
        : (allData.staff || []).filter((st: any) => st.sessionId === sess);

      const completeness = computeDataCompleteness(
        schools,
        activeStudents,
        activeStaff,
        allData.facilities || [],
        allData.attendance || [],
        allData.mdmRecords || [],
        allData.governmentWork || [],
        allData.complaints || [],
        allData.literacyRegisters || [],
        sess
      );

      let filtered = completeness;
      if (filters.status && filters.status !== 'ALL') {
        if (filters.status === 'INCOMPLETE' || filters.status === 'अपूर्ण') {
          filtered = filtered.filter((c) => c.status !== 'पूर्ण');
        } else if (filters.status === 'COMPLETE' || filters.status === 'पूर्ण') {
          filtered = filtered.filter((c) => c.status === 'पूर्ण');
        } else if (filters.status === 'PARTIAL' || filters.status === 'आंशिक') {
          filtered = filtered.filter((c) => c.status === 'आंशिक');
        } else {
          filtered = filtered.filter((c) => c.status === filters.status);
        }
      }

      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (c) =>
            c.schoolName.toLowerCase().includes(q) ||
            c.udise.includes(q) ||
            c.status.toLowerCase().includes(q)
        );
      }

      const fullyComplete = filtered.filter((c) => c.status === 'पूर्ण').length;
      const partial = filtered.filter((c) => c.status === 'आंशिक').length;
      const incomplete = filtered.filter((c) => c.status === 'अपूर्ण').length;

      const headers = [
        'क्र.',
        'यूडाइस कोड',
        'विद्यालय का नाम',
        'संस्था प्रधान',
        'मोबाइल',
        `पूर्ण मानक (${DATA_COMPLETENESS_CRITERIA_COUNT} में से)`,
        'पूर्णता प्रतिशत',
        'डेटा स्थिति',
        'अपूर्ण मानक / शेष आवश्यकताएं',
      ];

      const rows = filtered.map((c, idx) => [
        idx + 1,
        c.udise,
        c.schoolName,
        c.principal || '-',
        c.mobile || '-',
        `${c.passedCount} / ${c.totalChecks}`,
        `${c.percentage}%`,
        c.status,
        c.missingItems.length > 0 ? c.missingItems.join(', ') : 'समस्त मानक पूर्ण',
      ]);

      return {
        title: 'विद्यालयवार डेटा पूर्णता एवं सत्यापन प्रतिवेदन',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | ${DATA_COMPLETENESS_CRITERIA_COUNT} अनिवार्य मानकों का विश्लेषण`,
        summaryMetrics: [
          { label: 'विश्लेषित शालाएं', value: filtered.length },
          { label: 'शत-प्रतिशत पूर्ण', value: fullyComplete },
          { label: 'आंशिक पूर्ण', value: partial },
          { label: 'अपूर्ण / ध्यान अपेक्षित', value: incomplete },
        ],
        headers,
        rows,
        rawItems: filtered,
        isEmpty: filtered.length === 0,
        emptyMessage: 'डेटा पूर्णता विश्लेषण हेतु कोई विद्यालय उपलब्ध नहीं है।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 14. MONITORING ANALYTICS
  {
    id: 'GOV_MONITORING_ANALYTICS',
    title: 'संकुल विश्लेषणात्मक केंद्र एवं परफॉरमेंस इंडिकेटर्स',
    hindiTitle: 'संकुल विश्लेषणात्मक केंद्र एवं परफॉरमेंस इंडिकेटर्स',
    category: 'ANALYTICS',
    description: 'उपस्थिति ट्रेंड, शासकीय कार्य निस्तारण, शिकायत समाधान चक्र एवं संकुल रैंकिंग',
    iconName: 'TrendingUp',
    supportedRoles: ['ADMIN', 'CAC', 'SCHOOL'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { school: true },
    calculate: ({ filters, currentUserRole, userAssignedSchoolUdise, allData }) => {
      const schools = getSchoolsBySessionAndScope(
        allData.schools || [],
        filters.schoolUdise,
        currentUserRole,
        userAssignedSchoolUdise
      );

      const sess = filters.sessionId;
      const students = (allData.studentMasters && allData.studentAcademicRecords && sess)
        ? composeStudentsForSession(allData.studentMasters, allData.studentAcademicRecords, sess)
        : (allData.students || []).filter((s: any) => sess ? s.sessionId === sess : true);
      const staff = (allData.staffMasters && allData.staffPostings && sess)
        ? composeStaffForSession(allData.staffMasters, allData.staffPostings, sess)
        : (allData.staff || []).filter((st: any) => sess ? st.sessionId === sess : true);
      const attendance = (allData.attendance || []).filter((a: any) => sess ? a.sessionId === sess : true);
      const works = (allData.governmentWork || []).filter((w: any) => sess ? w.sessionId === sess : true);
      const complaints = (allData.complaints || []).filter((c: any) => sess ? c.sessionId === sess : true);

      // Calculate performance score per school:
      // Attendance weight 40%, Data completeness 30%, Work completion 20%, Complaint resolution 10%
      const performanceList = schools.map((sch: any) => {
        const schStud = students.filter((s: any) => s.schoolUdise === sch.udise);
        const schStaff = staff.filter((s: any) => s.assignedSchoolUdise === sch.udise);
        const schAtt = attendance.filter((a: any) => a.schoolUdise === sch.udise && !a.isHoliday);

        let attPct = 0;
        if (schAtt.length > 0) {
          const reg = schAtt.reduce((sum: number, a: any) => sum + (a.totalCount || 0), 0);
          const pres = schAtt.reduce((sum: number, a: any) => sum + (a.presentCount || 0), 0);
          attPct = reg > 0 ? Math.round((pres / reg) * 100) : 0;
        }

        const schWorks = works.filter((w: any) => w.schoolUdise === sch.udise);
        const compWorks = schWorks.filter((w: any) => w.status === 'COMPLETED').length;
        const workPct = schWorks.length > 0 ? Math.round((compWorks / schWorks.length) * 100) : 100;

        const schComplaints = complaints.filter((c: any) => c.schoolUdise === sch.udise);
        const resolved = schComplaints.filter((c: any) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
        const compPct = schComplaints.length > 0 ? Math.round((resolved / schComplaints.length) * 100) : 100;

        // Composite Index
        const compositeScore = Math.round(attPct * 0.4 + workPct * 0.3 + compPct * 0.3);

        let grade = 'A+';
        if (compositeScore < 50) grade = 'D';
        else if (compositeScore < 65) grade = 'C';
        else if (compositeScore < 80) grade = 'B';
        else if (compositeScore < 90) grade = 'A';

        return {
          udise: sch.udise,
          name: sch.hindiName || sch.name,
          village: sch.village,
          studentsCount: schStud.length,
          staffCount: schStaff.length,
          attPct,
          workPct,
          compPct,
          compositeScore,
          grade,
        };
      });

      // Sort by composite score descending
      performanceList.sort((a, b) => b.compositeScore - a.compositeScore);

      const headers = [
        'रैंक',
        'यूडाइस कोड',
        'विद्यालय का नाम',
        'ग्राम',
        'नामांकन',
        'स्टाफ',
        'उपस्थिति %',
        'कार्य पूर्णता %',
        'शिकायत निराकरण %',
        'समग्र स्कोर',
        'ग्रेड',
      ];

      const rows = performanceList.map((p, idx) => [
        idx + 1,
        p.udise,
        p.name,
        p.village || '-',
        p.studentsCount,
        p.staffCount,
        `${p.attPct}%`,
        `${p.workPct}%`,
        `${p.compPct}%`,
        `${p.compositeScore}/100`,
        p.grade,
      ]);

      const avgScore = performanceList.length > 0
        ? Math.round(performanceList.reduce((sum, p) => sum + p.compositeScore, 0) / performanceList.length)
        : 0;

      return {
        title: 'संकुल विश्लेषणात्मक केंद्र एवं परफॉरमेंस इंडिकेटर्स',
        subtitle: `सत्र: ${filters.sessionId || institutionConfig.academicSession} | समग्र गुणवत्ता मूल्यांकन`,
        summaryMetrics: [
          { label: 'मूल्यांकित शालाएं', value: performanceList.length },
          { label: 'संकुल औसत स्कोर', value: `${avgScore}/100` },
          { label: 'उत्कृष्ट (A/A+ ग्रेड)', value: performanceList.filter((p) => p.grade === 'A' || p.grade === 'A+').length },
          { label: 'सुधार अपेक्षित (C/D ग्रेड)', value: performanceList.filter((p) => p.grade === 'C' || p.grade === 'D').length },
        ],
        headers,
        rows,
        rawItems: performanceList,
        isEmpty: performanceList.length === 0,
        emptyMessage: 'पर्याप्त डेटा बिंदु उपलब्ध नहीं हैं।',
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'landscape'),
  },

  // 15. SESSION COMPARISON
  {
    id: 'GOV_SESSION_COMPARISON',
    title: 'बहु-सत्रीय तुलनात्मक प्रगति प्रतिवेदन',
    hindiTitle: 'बहु-सत्रीय तुलनात्मक प्रगति प्रतिवेदन',
    category: 'SESSION_COMPARE',
    description: 'वर्तमान सत्र बनाम विगत शैक्षणिक सत्रों का नामांकन, शिक्षक व कार्य तुलना',
    iconName: 'GitCompare',
    supportedRoles: ['ADMIN', 'CAC'],
    availableScopes: ['FULL'],
    defaultScope: 'FULL',
    availableFilters: { school: true },
    calculate: ({ filters, allData }) => {
      const currentSession = filters.sessionId || institutionConfig.academicSession;
      const academicSessions = allData.academicSessions || [];
      const students = allData.students || [];
      const staff = allData.staff || [];
      const works = allData.governmentWork || [];
      const complaints = allData.complaints || [];

      // Determine previous session
      const prevSessions = academicSessions.filter((s: any) => s.id !== currentSession);
      const prevSession = prevSessions.length > 0 ? prevSessions[0].id : '2025-26';

      const curStudents = students.filter((s: any) => s.sessionId === currentSession).length;
      const prevStudents = students.filter((s: any) => s.sessionId === prevSession).length;

      const curStaff = staff.filter((s: any) => s.sessionId === currentSession).length;
      const prevStaff = staff.filter((s: any) => s.sessionId === prevSession).length;

      const curWorks = works.filter((w: any) => w.sessionId === currentSession).length;
      const prevWorks = works.filter((w: any) => w.sessionId === prevSession).length;

      const curComplaints = complaints.filter((c: any) => c.sessionId === currentSession).length;
      const prevComplaints = complaints.filter((c: any) => c.sessionId === prevSession).length;

      const headers = [
        'क्र.',
        'पैरामीटर / मानक',
        `सत्र ${prevSession} (विगत)`,
        `सत्र ${currentSession} (वर्तमान)`,
        'परिवर्तन / अंतर',
        'प्रवृत्ति (Trend)',
      ];

      const getDiff = (cur: number, prev: number) => {
        const diff = cur - prev;
        if (diff > 0) return `+${diff}`;
        return `${diff}`;
      };

      const getTrend = (cur: number, prev: number) => {
        if (cur > prev) return 'वृद्धि ↗️';
        if (cur < prev) return 'कमी ↘️';
        return 'यथावत ➡️';
      };

      const rows = [
        [1, 'कुल विद्यार्थी नामांकन', prevStudents, curStudents, getDiff(curStudents, prevStudents), getTrend(curStudents, prevStudents)],
        [2, 'शिक्षक एवं कर्मचारी संख्या', prevStaff, curStaff, getDiff(curStaff, prevStaff), getTrend(curStaff, prevStaff)],
        [3, 'शासकीय कार्य अभिलेख', prevWorks, curWorks, getDiff(curWorks, prevWorks), getTrend(curWorks, prevWorks)],
        [4, 'दर्ज जन शिकायतें', prevComplaints, curComplaints, getDiff(curComplaints, prevComplaints), getTrend(curComplaints, prevComplaints)],
      ];

      return {
        title: 'बहु-सत्रीय तुलनात्मक प्रगति प्रतिवेदन',
        subtitle: `तुलना: सत्र ${prevSession} बनाम सत्र ${currentSession}`,
        summaryMetrics: [
          { label: 'समीक्षित सत्र', value: `${prevSession} vs ${currentSession}` },
          { label: 'वर्तमान नामांकन', value: curStudents },
          { label: 'विगत नामांकन', value: prevStudents > 0 ? prevStudents : 'डेटा प्रतीक्षित' },
          { label: 'स्टाफ स्थिति', value: `${curStaff} कार्यरत` },
        ],
        headers,
        rows,
        rawItems: rows,
        isEmpty: false,
      };
    },
    getExportPayload: (calc, filters, school) => buildPayload(calc, filters, school, 'portrait'),
  },
];
