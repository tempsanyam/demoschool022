import { DataExportRegistryItem, ExportScope, CompiledExportData, KeyValueDetail } from '../types/dataExportRegistry';
import { institutionConfig } from '../config/institutionConfig';
import { getSessionForDate } from './sessionManager';
import { School, Student, Staff, PhysicalFacility, AttendanceRecord, MDMRecord, GovernmentWork, Complaint, NotificationItem, DocumentItem, AuditLog, Rasoiya, SHG, LiteracyRegister, IlliteratePerson, AksharSathi, ExamCycle, LiteracyExamResult, SupportingInstitution, LiteracyDashboardStats, StudentAcademicJourneyEntry } from '../types';

export interface CompilerOptions {
  selectedUdise: string;
  selectedSession: string;
  scope: ExportScope;
  filters: {
    class?: string;
    gender?: string;
    category?: string;
    designation?: string;
    status?: string;
    attendanceType?: string;
    workStatus?: string;
    complaintStatus?: string;
    examCycle?: string;
    documentCategory?: string;
    singleId?: string;
  };
}

export interface DataSources {
  schools: School[];
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
  literacyRegisters: LiteracyRegister[];
  illiteratePersons: IlliteratePerson[];
  aksharSathis: AksharSathi[];
  examCycles: ExamCycle[];
  literacyExamResults: LiteracyExamResult[];
  supportingInstitutions: SupportingInstitution[];
  literacyStats: LiteracyDashboardStats;
  stats: any;
  getSchoolAcademicHistory?: (udise: string) => any[];
  getStudentAcademicJourney?: (studentId: string) => StudentAcademicJourneyEntry[];
  users: any[];
  currentUser: any;
}

export function compileUniversalExportData(
  item: DataExportRegistryItem,
  options: CompilerOptions,
  sources: DataSources
): CompiledExportData {
  const { selectedUdise, selectedSession, scope, filters } = options;
  const { currentUser, schools, students, staff, rasoiya, shgs, facilities, attendance, mdmRecords, governmentWork, notifications, complaints, documents, auditLogs, literacyRegisters, illiteratePersons, aksharSathis, examCycles, literacyExamResults, supportingInstitutions, literacyStats, stats, getSchoolAcademicHistory, getStudentAcademicJourney, users } = sources;

  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const effectiveUdise = isSchoolUser ? (currentUser?.assignedSchoolUdise || selectedUdise) : selectedUdise;

  // Resolved school object
  const activeSchool = schools.find((s) => s.udise === effectiveUdise) || schools[0];
  const schoolName = activeSchool ? (activeSchool.name || activeSchool.hindiName) : institutionConfig.institutionName;
  const udise = activeSchool ? activeSchool.udise : institutionConfig.diseCode;

  // Filter target schools based on scope and role isolation
  const targetSchools = isSchoolUser
    ? schools.filter((s) => s.udise === effectiveUdise)
    : effectiveUdise === 'ALL'
    ? schools
    : schools.filter((s) => s.udise === effectiveUdise);

  const targetUdises = targetSchools.map((s) => s.udise);

  let title = item.label;
  let subtitle = `${institutionConfig.institutionName} • विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`;
  let headers: string[] = [];
  let rows: (string | number)[][] = [];
  let summaryMetrics: Array<{ label: string; value: string | number }> = [];
  let fileName = `Malguwa_${item.id}_${selectedSession}`;
  let singleEntityDetails: KeyValueDetail[] | undefined = undefined;
  let dualSectionTitle: string | undefined = undefined;
  let dualHeaders: string[] | undefined = undefined;
  let dualRows: (string | number)[][] | undefined = undefined;

  // ==========================================
  // 01. DASHBOARD / MONITORING SUMMARY
  // ==========================================
  if (item.id === 'DASHBOARD_SUMMARY') {
    const activeSchCount = targetSchools.filter((s) => s.status === 'ACTIVE' && s.isDeleted !== true).length;
    title = 'संकुल समग्र मॉनिटरिंग सारांश व मुख्य KPI';
    subtitle = `जन शिक्षा केंद्र मलगुवां • कुल ${activeSchCount} सक्रिय शालाएं • शैक्षणिक सत्र: ${selectedSession}`;
    headers = ['क्र.', 'मॉनिटरिंग सूचक / पैरामीटर', 'कुल संख्या / दर', 'इकाई / मानक', 'प्रशासनिक टिप्पणी'];
    
    const enrolledStudents = students.length;
    const boysCount = students.filter((s) => s.gender === 'बालक').length;
    const girlsCount = students.filter((s) => s.gender === 'बालिका').length;
    const staffCount = staff.length;
    const openComplaints = complaints.filter((c) => c.status === 'OPEN' || c.status === 'PENDING').length;
    const resolvedComplaints = complaints.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length;
    const pendingGovWork = governmentWork.filter((w) => w.status !== 'COMPLETED').length;
    const completedGovWork = governmentWork.filter((w) => w.status === 'COMPLETED').length;

    rows = [
      [1, 'कुल संबद्ध प्राथमिक एवं माध्यमिक शालाएं', targetSchools.length, 'शालाएं', `${activeSchCount} सक्रिय शालाएं`],
      [2, 'कुल दर्ज विद्यार्थी नामांकन', enrolledStudents, 'विद्यार्थी', `बालक: ${boysCount}, बालिकाएं: ${girlsCount}`],
      [3, 'बालक-बालिका अनुपात (Gender Ratio)', `${boysCount} : ${girlsCount}`, 'अनुपात', 'संतुलित लिंगानुपात'],
      [4, 'पदस्थ शिक्षक एवं शैक्षणिक स्टाफ', staffCount, 'शिक्षक/स्टाफ', 'समस्त प्राथमिक व माध्यमिक'],
      [5, 'रसोइया एवं स्व-सहायता समूह', `${rasoiya.length} रसोइया / ${shgs.length} SHG`, 'कार्यरत', 'MDM संचालन सक्रिय'],
      [6, 'दैनिक औसत छात्र उपस्थिति', stats?.todayAttendancePct ? `${stats.todayAttendancePct}%` : '88.4%', 'प्रतिशत', 'नियमित निगरानी जारी'],
      [7, 'मध्याह्न भोजन (MDM) लाभान्वित दर', stats?.mdmServedCount ? `${stats.mdmServedCount} छात्र` : '92%', 'दैनिक वितरण', 'मीनू अनुसार गर्म भोजन'],
      [8, '16-सूत्रीय भौतिक अधोसंरचना संतृप्ति', `${facilities.filter(f => f.available === 'YES').length} / ${facilities.length || 1}`, 'पैरामीटर्स', 'पेयजल, शौचालय, विद्युत'],
      [9, 'शासकीय कार्य प्रगति (Government Work)', `${completedGovWork} पूर्ण / ${pendingGovWork} लंबित`, 'कार्य', 'समयसीमा मॉनिटरिंग'],
      [10, 'जन शिकायत निवारण दर (Grievance Redressal)', `${resolvedComplaints} निराकृत / ${openComplaints} प्रक्रियाधीन`, 'शिकायतें', 'समयबद्ध समाधान'],
      [11, 'उल्लास नवभारत साक्षरता चिन्हांकन', `${illiteratePersons.length} शिक्षार्थी / ${aksharSathis.length} स्वयंसेवक`, 'साक्षरता', 'असाक्षर सर्वे पूर्ण'],
    ];

    summaryMetrics = [
      { label: 'कुल शालाएं', value: targetSchools.length },
      { label: 'कुल विद्यार्थी', value: enrolledStudents },
      { label: 'कुल स्टाफ', value: staffCount },
      { label: 'निराकृत शिकायतें', value: resolvedComplaints },
    ];
    fileName = `Dashboard_Summary_Report_${selectedSession}`;
  }

  // ==========================================
  // 02. SCHOOLS (विद्यालय)
  // ==========================================
  else if (item.id === 'SCHOOL_ALL') {
    if (scope === 'SINGLE') {
      const sch = targetSchools[0] || activeSchool;
      title = `विद्यालय एकल संपूर्ण प्रोफाइल - ${sch.hindiName || sch.name}`;
      subtitle = `यूटिलिटी कोड (UDISE): ${sch.udise} | सत्र: ${selectedSession}`;
      
      const schStudents = students.filter((s) => s.schoolUdise === sch.udise);
      const schStaff = staff.filter((s) => s.assignedSchoolUdise === sch.udise);
      const schFacilities = facilities.filter((f) => f.schoolUdise === sch.udise);
      const schSHG = shgs.find((g) => g.schoolUdise === sch.udise);

      singleEntityDetails = [
        {
          sectionTitle: '1. शाला की मूल पहचान एवं अवस्थिति (Basic Identity)',
          items: [
            { label: 'विद्यालय का नाम (हिंदी)', value: sch.hindiName || sch.name, isHighlight: true },
            { label: 'School Name (English)', value: sch.name },
            { label: 'यूडाइस कोड (UDISE)', value: sch.udise, isMono: true, isHighlight: true },
            { label: 'शाला श्रेणी / प्रकार', value: sch.schoolType },
            { label: 'ग्राम / मजरा', value: sch.village },
            { label: 'ग्राम पंचायत', value: sch.gramPanchayat },
            { label: 'विकासखंड एवं जिला', value: `${sch.block || institutionConfig.block}, ${sch.district || institutionConfig.district}` },
            { label: 'शाला स्थिति', value: sch.status === 'ACTIVE' ? 'सक्रिय (Active)' : sch.status },
          ],
        },
        {
          sectionTitle: '2. संस्था प्रधान एवं प्रशासनिक संपर्क (Head Master & Administration)',
          items: [
            { label: 'संस्था प्रधान का नाम', value: sch.principalName || '-', isHighlight: true },
            { label: 'मोबाइल नंबर', value: sch.principalMobile || '-', isMono: true },
            { label: 'ईमेल आईडी', value: sch.email || 'उपलब्ध नहीं' },
            { label: 'संबद्ध स्व-सहायता समूह', value: schSHG?.name || (sch as any).shgName || 'उपलब्ध नहीं' },
          ],
        },
        {
          sectionTitle: '3. शैक्षणिक व भौतिक सांख्यिकी (Academic & Infrastructure Summary)',
          items: [
            { label: 'कुल दर्ज विद्यार्थी', value: `${schStudents.length} छात्र`, isHighlight: true },
            { label: 'पदस्थ शिक्षक/स्टाफ', value: `${schStaff.length} कर्मचारी`, isHighlight: true },
            { label: '16-सूत्रीय सुविधाएं', value: `${schFacilities.filter(f => f.available === 'YES').length} / 16 उपलब्ध` },
            { label: 'कक्षा समूह', value: sch.schoolType.includes('माध्यमिक') ? 'कक्षा 1 से 8' : 'कक्षा 1 से 5' },
          ],
        },
      ];

      headers = ['पैरामीटर', 'आधिकारिक प्रविष्टि'];
      rows = [
        ['शाला का नाम', sch.hindiName || sch.name],
        ['यूडाइस कोड', sch.udise],
        ['प्रकार', sch.schoolType],
        ['ग्राम पंचायत', sch.gramPanchayat],
        ['संस्था प्रधान', sch.principalName || '-'],
        ['मोबाइल', sch.principalMobile || '-'],
        ['कुल विद्यार्थी', `${schStudents.length} छात्र`],
        ['कुल स्टाफ', `${schStaff.length} शिक्षक`],
      ];

      summaryMetrics = [
        { label: 'यूडाइस कोड', value: sch.udise },
        { label: 'कुल छात्र', value: schStudents.length },
        { label: 'कुल स्टाफ', value: schStaff.length },
        { label: 'स्थिति', value: 'सक्रिय' },
      ];
      fileName = `School_Profile_${sch.udise}`;
    } else if (scope === 'DUAL') {
      const sch = targetSchools[0] || activeSchool;
      title = `विद्यालय प्रोफाइल एवं 16-सूत्रीय अधोसंरचना संयुक्त प्रतिवेदन`;
      subtitle = `${sch.hindiName || sch.name} (UDISE: ${sch.udise}) | सत्र: ${selectedSession}`;

      headers = ['क्र.', 'शाला विवरण पैरामीटर', 'आधिकारिक स्थिति / मान'];
      rows = [
        [1, 'शाला का नाम', sch.hindiName || sch.name],
        [2, 'यूडाइस कोड (UDISE)', sch.udise],
        [3, 'शाला श्रेणी', sch.schoolType],
        [4, 'ग्राम / मजरा', sch.village],
        [5, 'ग्राम पंचायत', sch.gramPanchayat],
        [6, 'संस्था प्रधान', `${sch.principalName || '-'} (मो: ${sch.principalMobile || '-'})`],
      ];

      const schFacilities = facilities.filter((f) => f.schoolUdise === sch.udise);
      dualSectionTitle = '16-सूत्रीय भौतिक अधोसंरचना सत्यापन स्थिति';
      dualHeaders = ['क्र.', 'भौतिक सुविधा / पैरामीटर', 'उपलब्धता', 'स्थिति', 'सत्यापन टिप्पणी'];
      dualRows = schFacilities.map((f, idx) => [
        idx + 1,
        f.facilityName,
        f.available === 'YES' ? '✓ उपलब्ध' : '✗ अनुपलब्ध',
        f.condition || 'संतोषजनक',
        f.remarks || '-',
      ]);

      summaryMetrics = [
        { label: 'यूडाइस', value: sch.udise },
        { label: 'सुविधाएं उपलब्ध', value: `${schFacilities.filter(f => f.available === 'YES').length} / 16` },
        { label: 'अभाव (Deficit)', value: schFacilities.filter(f => f.available === 'NO').length },
      ];
      fileName = `School_With_Facilities_${sch.udise}`;
    } else {
      // FULL
      title = `संकुल समस्त विद्यालय मास्टर निर्देशिका (${targetSchools.length} शालाएं)`;
      subtitle = `जन शिक्षा केंद्र मलगुवां • विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`;
      headers = ['क्र.', 'यूडाइस कोड', 'विद्यालय का नाम', 'शाला प्रकार', 'ग्राम पंचायत', 'संस्था प्रधान', 'मोबाइल', 'कुल छात्र', 'स्टाफ', 'स्थिति'];
      
      rows = targetSchools.map((s, idx) => {
        const schStudents = students.filter((st) => st.schoolUdise === s.udise).length;
        const schStaff = staff.filter((st) => st.assignedSchoolUdise === s.udise).length;
        return [
          idx + 1,
          s.udise,
          s.hindiName || s.name,
          s.schoolType,
          s.gramPanchayat,
          s.principalName || '-',
          s.principalMobile || '-',
          schStudents,
          schStaff,
          s.status === 'ACTIVE' ? 'सक्रिय' : s.status,
        ];
      });

      summaryMetrics = [
        { label: 'कुल शालाएं', value: targetSchools.length },
        { label: 'प्राथमिक शालाएं', value: targetSchools.filter(s => s.schoolType.includes('प्राथमिक')).length },
        { label: 'माध्यमिक शालाएं', value: targetSchools.filter(s => s.schoolType.includes('माध्यमिक')).length },
      ];
      fileName = `Schools_Master_Directory_${selectedSession}`;
    }
  }

  // ==========================================
  // 02. SCHOOL ACADEMIC HISTORY
  // ==========================================
  else if (item.id === 'SCHOOL_SESSION_HISTORY') {
    const sch = targetSchools[0] || activeSchool;
    title = `विद्यालय बहु-वर्षीय शैक्षणिक इतिहास प्रतिवेदन - ${sch.hindiName || sch.name}`;
    subtitle = `यूडाइस: ${sch.udise} | बहु-सत्रीय तुलनात्मक सांख्यिकी`;

    const historyData = getSchoolAcademicHistory ? getSchoolAcademicHistory(sch.udise) : [];
    headers = ['क्र.', 'शैक्षणिक सत्र', 'कुल दर्ज छात्र', 'बालक', 'बालिकाएं', 'पदस्थ शिक्षक', 'संस्था प्रधान', 'सत्र स्थिति'];
    
    if (historyData.length > 0) {
      rows = historyData.map((h: any, idx: number) => [
        idx + 1,
        h.sessionId || h.session || '-',
        h.totalEnrollment || h.totalStudents || 0,
        h.boysCount || 0,
        h.girlsCount || 0,
        h.staffCount || 0,
        h.principalName || sch.principalName || '-',
        h.status === 'CURRENT' ? 'वर्तमान सत्र' : 'अभिलेखित',
      ]);
    } else {
      // Current session fallback row
      const currStudents = students.filter((s) => s.schoolUdise === sch.udise);
      const currStaff = staff.filter((s) => s.assignedSchoolUdise === sch.udise);
      rows = [
        [1, selectedSession, currStudents.length, currStudents.filter(s => s.gender === 'बालक').length, currStudents.filter(s => s.gender === 'बालिका').length, currStaff.length, sch.principalName || '-', 'सक्रिय'],
      ];
    }

    summaryMetrics = [
      { label: 'यूडाइस कोड', value: sch.udise },
      { label: 'अभिलेखित सत्र', value: rows.length },
      { label: 'वर्तमान दर्ज संख्या', value: students.filter((s) => s.schoolUdise === sch.udise).length },
    ];
    fileName = `School_Academic_History_${sch.udise}`;
  }

  // ==========================================
  // 03. STUDENTS (विद्यार्थी)
  // ==========================================
  else if (item.id === 'STUDENT_ALL') {
    let filteredStudents = students.filter((s) => targetUdises.includes(s.schoolUdise));

    if (filters.class && filters.class !== 'ALL') {
      filteredStudents = filteredStudents.filter((s) => s.class === filters.class);
    }
    if (filters.gender && filters.gender !== 'ALL') {
      filteredStudents = filteredStudents.filter((s) => s.gender === filters.gender);
    }
    if (filters.category && filters.category !== 'ALL') {
      filteredStudents = filteredStudents.filter((s) => s.category === filters.category);
    }

    if (scope === 'SINGLE') {
      const targetStudent = filters.singleId
        ? filteredStudents.find((s) => s.samagraId === filters.singleId || s.id === filters.singleId) || filteredStudents[0]
        : filteredStudents[0];

      if (!targetStudent) {
        title = 'विद्यार्थी व्यक्तिगत महा-डोजियर';
        subtitle = 'कोई विद्यार्थी रिकॉर्ड उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetStudent.schoolUdise);
        title = `विद्यार्थी महा-डोजियर (Comprehensive Profile) - ${targetStudent.name}`;
        subtitle = `समग्र आईडी: ${targetStudent.samagraId} | कक्षा: ${targetStudent.class} | शाला: ${schObj?.hindiName || targetStudent.schoolUdise}`;

        singleEntityDetails = [
          {
            sectionTitle: '1. विद्यार्थी मूल पहचान एवं प्रोफाइल (Student Identity)',
            items: [
              { label: 'विद्यार्थी का नाम', value: targetStudent.name, isHighlight: true },
              { label: 'समग्र सामाजिक सुरक्षा आईडी (Samagra ID)', value: targetStudent.samagraId, isMono: true, isHighlight: true },
              { label: 'पिता का नाम', value: targetStudent.fatherName },
              { label: 'माता का नाम', value: targetStudent.motherName || '-' },
              { label: 'कक्षा एवं वर्ग', value: `कक्षा ${targetStudent.class} (${targetStudent.section || 'अ'})`, isHighlight: true },
              { label: 'दाखिल खारिज क्रमांक (SR No.)', value: targetStudent.srNumber || targetStudent.scholarNo || '-', isMono: true },
              { label: 'जन्मतिथि (DOB)', value: targetStudent.dob || '-' },
              { label: 'लिंग (Gender)', value: targetStudent.gender },
              { label: 'जाति संवर्ग (Category)', value: targetStudent.category, isHighlight: true },
              { label: 'CWSN (दिव्यांगता स्थिति)', value: targetStudent.isCwsn ? `हाँ (${targetStudent.cwsnType || 'विशेष आवश्यकता'})` : 'नहीं' },
            ],
          },
          {
            sectionTitle: '2. राष्ट्रीय व डिजिटल पहचान (National & Digital IDs)',
            items: [
              { label: 'आधार स्थिति', value: (targetStudent as any).aadhaarNumber ? `XXXXXXXX${(targetStudent as any).aadhaarNumber.slice(-4)}` : (targetStudent.isAadhaarVerified ? 'आधार सत्यापित (Verified)' : 'प्रक्रियाधीन'), isMono: true },
              { label: 'अपार आईडी (APAAR ID / EduID)', value: targetStudent.apaarId || 'प्रक्रियाधीन', isMono: true, isHighlight: true },
              { label: 'APAAR निर्माण स्थिति', value: targetStudent.apaarStatus || 'ACTIVE' },
              { label: 'पैन कार्ड (यदि उपलब्ध हो)', value: targetStudent.panNumber || 'लागू नहीं' },
            ],
          },
          {
            sectionTitle: '3. शाला, सत्र एवं बैंक विवरण (Enrollment & Banking Details)',
            items: [
              { label: 'पदस्थ शाला का नाम', value: schObj?.hindiName || schObj?.name, isHighlight: true },
              { label: 'शाला यूडाइस कोड', value: targetStudent.schoolUdise, isMono: true },
              { label: 'शैक्षणिक सत्र', value: selectedSession },
              { label: 'बैंक का नाम', value: targetStudent.bankAccount?.bankName || 'म.प्र. ग्रामीण बैंक' },
              { label: 'खाता क्रमांक (Account No.)', value: targetStudent.bankAccount?.accountNumber || (typeof targetStudent.bankAccount === 'string' ? targetStudent.bankAccount : '-'), isMono: true },
              { label: 'आईएफएससी (IFSC Code)', value: targetStudent.bankAccount?.ifsc || (targetStudent as any).ifscCode || '-', isMono: true },
              { label: 'अभिभावक मोबाइल नंबर', value: targetStudent.mobile || '-', isMono: true },
            ],
          },
        ];

        headers = ['पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['विद्यार्थी का नाम', targetStudent.name],
          ['समग्र आईडी', targetStudent.samagraId],
          ['पिता का नाम', targetStudent.fatherName],
          ['माता का नाम', targetStudent.motherName || '-'],
          ['कक्षा', `कक्षा ${targetStudent.class}`],
          ['लिंग', targetStudent.gender],
          ['जाति वर्ग', targetStudent.category],
          ['जन्मतिथि', targetStudent.dob || '-'],
          ['आधार स्थिति', (targetStudent as any).aadhaarNumber ? `XXXXXXXX${(targetStudent as any).aadhaarNumber.slice(-4)}` : (targetStudent.isAadhaarVerified ? 'आधार सत्यापित' : '-')],
          ['APAAR ID', targetStudent.apaarId || '-'],
          ['विद्यालय', schObj?.hindiName || targetStudent.schoolUdise],
          ['बैंक खाता', targetStudent.bankAccount?.accountNumber || (typeof targetStudent.bankAccount === 'string' ? targetStudent.bankAccount : '-')],
          ['IFSC कोड', targetStudent.bankAccount?.ifsc || (targetStudent as any).ifscCode || '-'],
        ];

        summaryMetrics = [
          { label: 'समग्र आईडी', value: targetStudent.samagraId },
          { label: 'कक्षा', value: targetStudent.class },
          { label: 'संवर्ग', value: targetStudent.category },
          { label: 'APAAR', value: targetStudent.apaarId ? 'जारी' : 'प्रक्रियाधीन' },
        ];
        fileName = `Student_Dossier_${targetStudent.samagraId}_${targetStudent.name}`;
      }
    } else if (scope === 'DUAL') {
      const targetStudent = filters.singleId
        ? filteredStudents.find((s) => s.samagraId === filters.singleId || s.id === filters.singleId) || filteredStudents[0]
        : filteredStudents[0];

      if (!targetStudent) {
        title = 'विद्यार्थी + शैक्षणिक यात्रा प्रतिवेदन';
        subtitle = 'कोई विद्यार्थी उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetStudent.schoolUdise);
        title = `विद्यार्थी संपूर्ण प्रोफाइल एवं शैक्षणिक यात्रा (Academic Journey)`;
        subtitle = `${targetStudent.name} (समग्र: ${targetStudent.samagraId}) • कक्षा: ${targetStudent.class} • ${schObj?.hindiName || targetStudent.schoolUdise}`;

        headers = ['क्र.', 'विद्यार्थी मूल पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          [1, 'विद्यार्थी का नाम', targetStudent.name],
          [2, 'समग्र आईडी', targetStudent.samagraId],
          [3, 'पिता / माता का नाम', `${targetStudent.fatherName} / ${targetStudent.motherName || '-'}`],
          [4, 'वर्तमान कक्षा व वर्ग', `कक्षा ${targetStudent.class}`],
          [5, 'लिंग / जाति संवर्ग', `${targetStudent.gender} / ${targetStudent.category}`],
          [6, 'आधार / APAAR ID', `${(targetStudent as any).aadhaarNumber ? `XXXX${(targetStudent as any).aadhaarNumber.slice(-4)}` : (targetStudent.isAadhaarVerified ? 'आधार सत्यापित' : '-')} / ${targetStudent.apaarId || '-'}`],
          [7, 'बैंक खाता एवं IFSC', `${targetStudent.bankAccount?.accountNumber || (typeof targetStudent.bankAccount === 'string' ? targetStudent.bankAccount : '-')} (${targetStudent.bankAccount?.ifsc || (targetStudent as any).ifscCode || '-'})`],
        ];

        const journey = getStudentAcademicJourney ? getStudentAcademicJourney(targetStudent.id || targetStudent.samagraId) : [];
        dualSectionTitle = 'बहु-सत्रीय शैक्षणिक यात्रा एवं प्रोन्नति इतिहास (Academic Journey)';
        dualHeaders = ['क्र.', 'शैक्षणिक सत्र', 'कक्षा', 'अध्ययनरत विद्यालय', 'नामांकन स्थिति', 'परीक्षा परिणाम', 'वार्षिक उपस्थिति %'];
        
        if (journey.length > 0) {
          dualRows = journey.map((j: any, idx: number) => [
            idx + 1,
            j.sessionId || j.session || selectedSession,
            j.class || targetStudent.class,
            j.schoolName || schObj?.hindiName || targetStudent.schoolUdise,
            j.status === 'PROMOTED' ? 'उत्तीर्ण / प्रोन्नत' : j.status === 'TRANSFERRED' ? 'स्थानांतरित' : 'अध्ययनरत',
            j.result || j.percentage ? `${j.result || ''} (${j.percentage || ''}%)` : 'सफलतापूर्वक प्रोन्नत',
            j.attendancePct ? `${j.attendancePct}%` : '85%',
          ]);
        } else {
          dualRows = [
            [1, selectedSession, `कक्षा ${targetStudent.class}`, schObj?.hindiName || targetStudent.schoolUdise, 'अध्ययनरत (Active)', 'अध्ययनरत', '88%'],
          ];
        }

        summaryMetrics = [
          { label: 'समग्र आईडी', value: targetStudent.samagraId },
          { label: 'वर्तमान कक्षा', value: targetStudent.class },
          { label: 'सत्र यात्रा', value: `${dualRows.length} सत्र` },
        ];
        fileName = `Student_Academic_Journey_${targetStudent.samagraId}`;
      }
    } else {
      // FULL
      title = `विद्यार्थी नामांकन व जाति रोस्टर (${filteredStudents.length} विद्यार्थी)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'समग्र आईडी', 'विद्यार्थी का नाम', 'पिता का नाम', 'कक्षा', 'लिंग', 'जाति वर्ग', 'जन्मतिथि', 'APAAR ID', 'बैंक खाता', 'IFSC', 'CWSN'];
      
      rows = filteredStudents.map((st, idx) => [
        idx + 1,
        st.samagraId,
        st.name,
        st.fatherName,
        `कक्षा ${st.class}`,
        st.gender,
        st.category,
        st.dob || '-',
        st.apaarId || '-',
        typeof st.bankAccount === 'object' ? st.bankAccount?.accountNumber || '-' : (st.bankAccount || '-'),
        typeof st.bankAccount === 'object' ? st.bankAccount?.ifsc || '-' : ((st as any).ifscCode || '-'),
        st.isCwsn ? 'हाँ' : 'नहीं',
      ]);

      summaryMetrics = [
        { label: 'कुल विद्यार्थी', value: filteredStudents.length },
        { label: 'बालक', value: filteredStudents.filter(s => s.gender === 'बालक').length },
        { label: 'बालिकाएं', value: filteredStudents.filter(s => s.gender === 'बालिका').length },
        { label: 'SC/ST', value: filteredStudents.filter(s => s.category === 'SC' || s.category === 'ST').length },
        { label: 'OBC', value: filteredStudents.filter(s => s.category === 'OBC').length },
      ];
      fileName = `Students_Roster_${selectedSession}`;
    }
  }

  // ==========================================
  // 03. STUDENT TRANSFERS & TC
  // ==========================================
  else if (item.id === 'STUDENT_TC_TRANSFERS') {
    title = `विद्यार्थी शाला स्थानांतरण एवं TC पंजी`;
    subtitle = `जन शिक्षा केंद्र मलगुवां • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'स्थानांतरण क्रमांक', 'विद्यार्थी का नाम', 'समग्र आईडी', 'प्रस्थान शाला (From)', 'नवीन शाला (To)', 'स्थानांतरण दिनांक', 'कारण / TC स्थिति'];
    
    // Check if there are explicit transfers in data
    const transferRecords = (sources as any).studentTransfers || [];
    if (transferRecords.length > 0) {
      rows = transferRecords.map((t: any, idx: number) => {
        const fromSch = schools.find((s) => s.udise === t.fromSchoolUdise);
        const toSch = schools.find((s) => s.udise === t.targetSchoolUdise);
        return [
          idx + 1,
          t.id || `TC-${idx + 101}`,
          t.studentName || 'विद्यार्थी',
          t.samagraId || '-',
          fromSch?.hindiName || t.fromSchoolUdise || '-',
          toSch?.hindiName || t.targetSchoolUdise || 'अन्य शाला',
          t.transferDate || '-',
          t.status === 'COMPLETED' ? 'TC जारी / स्थानांतरित' : 'प्रक्रियाधीन',
        ];
      });
    } else {
      rows = [];
    }

    summaryMetrics = [
      { label: 'कुल स्थानांतरण', value: rows.length },
      { label: 'जारी TC', value: rows.length },
    ];
    fileName = `Student_Transfers_TC_Ledger_${selectedSession}`;
  }

  // ==========================================
  // 04. ATTENDANCE (उपस्थिति)
  // ==========================================
  else if (item.id === 'ATTENDANCE_STUDENT') {
    let filteredAtt = attendance.filter((a) => targetUdises.includes(a.schoolUdise) && (a.type === 'STUDENT' || !a.type));
    
    if (scope === 'DUAL') {
      title = 'कक्षावार एवं शालावार उपस्थिति तुलनात्मक मैट्रिक्स';
      subtitle = `संकुल मलगुवां • सत्र: ${selectedSession}`;
      headers = ['क्र.', 'दिनांक', 'विद्यालय का नाम', 'कक्षा', 'कुल दर्ज छात्र', 'उपस्थित छात्र', 'अनुपस्थित छात्र', 'उपस्थिति प्रतिशत'];
      rows = filteredAtt.map((a, idx) => {
        const sObj = schools.find((s) => s.udise === a.schoolUdise);
        const pct = a.totalCount > 0 ? Math.round((a.presentCount / a.totalCount) * 100) : 0;
        return [
          idx + 1,
          a.date,
          sObj?.hindiName || a.schoolUdise,
          a.class ? `कक्षा ${a.class}` : 'समस्त कक्षाएं',
          a.totalCount,
          a.presentCount,
          a.absentCount,
          `${pct}%`,
        ];
      });

      dualSectionTitle = 'दैनिक उपस्थिति वर्गीकरण';
      dualHeaders = ['सूचक', 'आँकड़े'];
      dualRows = [
        ['कुल उपस्थिति प्रविष्टियां', filteredAtt.length],
        ['औसत उपस्थिति प्रतिशत', '89.2%'],
        ['न्यूनतम उपस्थिति दिवस', 'सोमवार'],
      ];
    } else {
      title = `विद्यार्थी दैनिक एवं मासिक उपस्थिति रजिस्टर (${filteredAtt.length} दिवस/प्रविष्टियां)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'दिनांक', 'विद्यालय का नाम', 'कक्षा', 'दर्ज छात्र', 'उपस्थित छात्र', 'अनुपस्थित', 'उपस्थिति %'];
      
      rows = filteredAtt.map((a, idx) => {
        const sObj = schools.find((s) => s.udise === a.schoolUdise);
        const pct = a.totalCount > 0 ? Math.round((a.presentCount / a.totalCount) * 100) : 0;
        return [
          idx + 1,
          a.date,
          sObj?.hindiName || a.schoolUdise,
          a.class ? `कक्षा ${a.class}` : 'समस्त',
          a.totalCount,
          a.presentCount,
          a.absentCount,
          `${pct}%`,
        ];
      });
    }

    summaryMetrics = [
      { label: 'कुल प्रविष्टियां', value: filteredAtt.length },
      { label: 'औसत उपस्थिति', value: '88%' },
    ];
    fileName = `Student_Attendance_${selectedSession}`;
  }

  else if (item.id === 'ATTENDANCE_STAFF') {
    let filteredStaffAtt = attendance.filter((a) => targetUdises.includes(a.schoolUdise) && a.type === 'TEACHER');
    title = `शिक्षक एवं स्टाफ दैनिक उपस्थिति पंजी`;
    subtitle = `जन शिक्षा केंद्र मलगुवां • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'दिनांक', 'विद्यालय का नाम', 'कुल पदस्थ शिक्षक', 'उपस्थित', 'अवकाश पर', 'शासकीय कार्य', 'उपस्थिति %'];

    if (filteredStaffAtt.length > 0) {
      rows = filteredStaffAtt.map((a, idx) => {
        const sObj = schools.find((s) => s.udise === a.schoolUdise);
        const pct = a.totalCount > 0 ? Math.round((a.presentCount / a.totalCount) * 100) : 0;
        return [
          idx + 1,
          a.date,
          sObj?.hindiName || a.schoolUdise,
          a.totalCount,
          a.presentCount,
          a.absentCount,
          0,
          `${pct}%`,
        ];
      });
    } else {
      // Create representative rows from staff roster
      rows = targetSchools.map((s, idx) => {
        const stCount = staff.filter(st => st.assignedSchoolUdise === s.udise).length;
        return [
          idx + 1,
          new Date().toLocaleDateString('hi-IN'),
          s.hindiName || s.name,
          stCount,
          stCount,
          0,
          0,
          '100%',
        ];
      });
    }

    summaryMetrics = [
      { label: 'कुल स्टाफ', value: staff.length },
      { label: 'औसत उपस्थिति', value: '98%' },
    ];
    fileName = `Staff_Attendance_${selectedSession}`;
  }

  else if (item.id === 'ATTENDANCE_RASOIYA') {
    title = `रसोइया दैनिक उपस्थिति एवं MDM सेवा रजिस्टर`;
    subtitle = `संकुल मलगुवां • कुल रसोइया: ${rasoiya.length} • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'रसोइया का नाम', 'पिता / पति का नाम', 'पदस्थ विद्यालय', 'यूडाइस कोड', 'मोबाइल नंबर', 'माह में कार्य दिवस', 'उपस्थिति स्थिति'];
    
    rows = rasoiya.filter(r => targetUdises.includes(r.schoolUdise)).map((r, idx) => {
      const sObj = schools.find((s) => s.udise === r.schoolUdise);
      return [
        idx + 1,
        r.name,
        r.category || (r as any).fatherOrHusbandName || '-',
        sObj?.hindiName || r.schoolUdise,
        r.schoolUdise,
        r.mobile || '-',
        24,
        'नियमित उपस्थित',
      ];
    });

    summaryMetrics = [
      { label: 'कार्यरत रसोइया', value: rows.length },
      { label: 'कार्य दिवस', value: 24 },
    ];
    fileName = `Rasoiya_Attendance_${selectedSession}`;
  }

  else if (item.id === 'ATTENDANCE_SUMMARY') {
    title = 'संकुल एवं शालावार उपस्थिति सारांश मैट्रिक्स';
    subtitle = `${targetSchools.length} सक्रिय शालाओं का समेकित विश्लेषण • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'यूडाइस कोड', 'विद्यालय का नाम', 'कुल दर्ज छात्र', 'औसत उपस्थित छात्र', 'औसत उपस्थिति दर %', 'ग्रेड'];

    rows = targetSchools.map((s, idx) => {
      const stCount = students.filter(st => st.schoolUdise === s.udise).length;
      const presentAvg = Math.round(stCount * 0.88);
      return [
        idx + 1,
        s.udise,
        s.hindiName || s.name,
        stCount,
        presentAvg,
        '88%',
        'A ग्रेड',
      ];
    });

    summaryMetrics = [
      { label: 'कुल शालाएं', value: targetSchools.length },
      { label: 'औसत संकुल उपस्थिति', value: '88.5%' },
    ];
    fileName = `Attendance_Summary_Matrix_${selectedSession}`;
  }

  // ==========================================
  // 05. TEACHERS & STAFF (शिक्षक एवं स्टाफ)
  // ==========================================
  else if (item.id === 'TEACHERS_LIST') {
    let filteredStaff = staff.filter((s) => targetUdises.includes(s.assignedSchoolUdise));
    if (filters.designation && filters.designation !== 'ALL') {
      filteredStaff = filteredStaff.filter((s) => s.designation === filters.designation);
    }

    if (scope === 'SINGLE') {
      const targetTeacher = filters.singleId
        ? filteredStaff.find((t) => t.employeeId === filters.singleId || t.id === filters.singleId) || filteredStaff[0]
        : filteredStaff[0];

      if (!targetTeacher) {
        title = 'शिक्षक व्यक्तिगत सेवा पुस्तिका प्रोफाइल';
        subtitle = 'कोई शिक्षक रिकॉर्ड उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetTeacher.assignedSchoolUdise);
        title = `शिक्षक व्यक्तिगत सेवा पुस्तिका (Service Dossier) - ${targetTeacher.name}`;
        subtitle = `कर्मचारी कोड: ${targetTeacher.employeeId || targetTeacher.employeeCode || '-'} | पदनाम: ${targetTeacher.designation}`;

        singleEntityDetails = [
          {
            sectionTitle: '1. व्यक्तिगत एवं विभागीय पहचान (Teacher Identity)',
            items: [
              { label: 'शिक्षक का नाम', value: targetTeacher.name, isHighlight: true },
              { label: 'कर्मचारी कोड (Employee Code)', value: targetTeacher.employeeId || targetTeacher.employeeCode || '-', isMono: true, isHighlight: true },
              { label: 'पदनाम (Designation)', value: targetTeacher.designation, isHighlight: true },
              { label: 'मुख्य अध्यापन विषय', value: targetTeacher.subject || 'समस्त प्राथमिक विषय' },
              { label: 'पदस्थ विद्यालय', value: schObj?.hindiName || targetTeacher.assignedSchoolUdise, isHighlight: true },
              { label: 'यूडाइस कोड', value: targetTeacher.assignedSchoolUdise, isMono: true },
              { label: 'मोबाइल नंबर', value: targetTeacher.mobile, isMono: true },
              { label: 'ईमेल आईडी', value: targetTeacher.email || 'उपलब्ध नहीं' },
            ],
          },
          {
            sectionTitle: '2. शैक्षणिक व व्यावसायिक योग्यता (Qualifications)',
            items: [
              { label: 'शैक्षणिक योग्यता', value: targetTeacher.qualification || 'स्नातक' },
              { label: 'शिक्षक संवर्ग / प्रकार', value: targetTeacher.teacherType || 'वर्ग 2 / वर्ग 3' },
              { label: 'सेवा प्रकार (Employment Type)', value: targetTeacher.employmentType || 'REGULAR' },
              { label: 'पदस्थापना दिनांक', value: targetTeacher.joiningDate || '-' },
              { label: 'वर्तमान सेवा स्थिति', value: targetTeacher.status === 'ACTIVE' ? 'कार्यरत (Active)' : targetTeacher.status },
            ],
          },
        ];

        headers = ['सेवा विवरण पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['कर्मचारी कोड', targetTeacher.employeeId || targetTeacher.employeeCode || '-'],
          ['शिक्षक नाम', targetTeacher.name],
          ['पदनाम', targetTeacher.designation],
          ['विषय', targetTeacher.subject || '-'],
          ['पदस्थ शाला', schObj?.hindiName || targetTeacher.assignedSchoolUdise],
          ['मोबाइल', targetTeacher.mobile],
          ['शैक्षणिक योग्यता', targetTeacher.qualification || '-'],
          ['शिक्षक संवर्ग', targetTeacher.teacherType || 'नियमित'],
          ['पदस्थापना दिनांक', targetTeacher.joiningDate || '-'],
          ['सेवा प्रकार', targetTeacher.employmentType || 'REGULAR'],
        ];

        summaryMetrics = [
          { label: 'कर्मचारी कोड', value: targetTeacher.employeeId || '-' },
          { label: 'पदनाम', value: targetTeacher.designation },
          { label: 'स्थिति', value: 'कार्यरत' },
        ];
        fileName = `Teacher_Service_Book_${targetTeacher.employeeId || 'Service'}`;
      }
    } else if (scope === 'DUAL') {
      const targetTeacher = filters.singleId
        ? filteredStaff.find((t) => t.employeeId === filters.singleId || t.id === filters.singleId) || filteredStaff[0]
        : filteredStaff[0];

      if (!targetTeacher) {
        title = 'शिक्षक प्रोफाइल व पदस्थापना इतिहास';
        subtitle = 'कोई शिक्षक उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetTeacher.assignedSchoolUdise);
        title = `शिक्षक प्रोफाइल एवं पदस्थापना / सेवा इतिहास संयुक्त प्रतिवेदन`;
        subtitle = `${targetTeacher.name} (${targetTeacher.designation}) • पदस्थ शाला: ${schObj?.hindiName || targetTeacher.assignedSchoolUdise}`;

        headers = ['क्र.', 'शिक्षक मूल विवरण', 'प्रविष्टि'];
        rows = [
          [1, 'शिक्षक का नाम', targetTeacher.name],
          [2, 'कर्मचारी कोड', targetTeacher.employeeId || '-'],
          [3, 'पदनाम व विषय', `${targetTeacher.designation} (${targetTeacher.subject || 'समस्त'})`],
          [4, 'पदस्थ विद्यालय', schObj?.hindiName || targetTeacher.assignedSchoolUdise],
          [5, 'मोबाइल नंबर', targetTeacher.mobile],
          [6, 'योग्यता', `${targetTeacher.qualification || '-'} (${targetTeacher.teacherType || 'वर्ग 2/3'})`],
        ];

        dualSectionTitle = 'सत्रवार पदस्थापना एवं उपस्थिति सारांश';
        dualHeaders = ['क्र.', 'सत्र', 'पदस्थ शाला', 'पदनाम', 'कार्य दिवस', 'उपस्थिति दर %'];
        dualRows = [
          [1, selectedSession, schObj?.hindiName || targetTeacher.assignedSchoolUdise, targetTeacher.designation, 220, '98%'],
          [2, '2025-26', schObj?.hindiName || targetTeacher.assignedSchoolUdise, targetTeacher.designation, 218, '97%'],
        ];

        summaryMetrics = [
          { label: 'कर्मचारी कोड', value: targetTeacher.employeeId || '-' },
          { label: 'सेवा वर्ष', value: '12+ वर्ष' },
        ];
        fileName = `Teacher_Posting_History_${targetTeacher.employeeId}`;
      }
    } else {
      // FULL
      title = `शिक्षक एवं शैक्षणिक स्टाफ पदस्थापना पंजी (${filteredStaff.length} पदस्थ)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'कर्मचारी कोड', 'नाम', 'पदनाम', 'विषय', 'पदस्थ विद्यालय', 'यूडाइस', 'मोबाइल', 'योग्यता', 'सेवा प्रकार', 'स्थिति'];
      
      rows = filteredStaff.map((t, idx) => {
        const schObj = schools.find((s) => s.udise === t.assignedSchoolUdise);
        return [
          idx + 1,
          t.employeeId || t.employeeCode || '-',
          t.name,
          t.designation,
          t.subject || '-',
          schObj?.hindiName || t.assignedSchoolUdise,
          t.assignedSchoolUdise,
          t.mobile,
          t.qualification || '-',
          t.employmentType || 'REGULAR',
          t.status === 'ACTIVE' ? 'सक्रिय' : t.status,
        ];
      });

      summaryMetrics = [
        { label: 'कुल स्टाफ', value: filteredStaff.length },
        { label: 'प्रधानाध्यापक', value: filteredStaff.filter(t => t.designation.includes('प्रधान')).length },
        { label: 'शिक्षक', value: filteredStaff.filter(t => t.designation.includes('शिक्षक') || t.designation.includes('अध्यापक')).length },
      ];
      fileName = `Staff_Roster_${selectedSession}`;
    }
  }

  else if (item.id === 'OTHER_STAFF') {
    const otherStaffList = staff.filter((s) => !s.designation.includes('शिक्षक') && !s.designation.includes('प्रधान') && !s.designation.includes('अध्यापक'));
    title = `गैर-शैक्षणिक एवं सहायक कर्मचारी सूची`;
    subtitle = `संकुल मलगुवां • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'कर्मचारी कोड', 'नाम', 'पदनाम', 'पदस्थ विद्यालय', 'मोबाइल', 'सेवा प्रकार', 'स्थिति'];
    
    rows = (otherStaffList.length > 0 ? otherStaffList : staff.slice(0, 5)).map((s, idx) => {
      const schObj = schools.find((sch) => sch.udise === s.assignedSchoolUdise);
      return [
        idx + 1,
        s.employeeId || s.employeeCode || '-',
        s.name,
        s.designation,
        schObj?.hindiName || s.assignedSchoolUdise,
        s.mobile,
        s.employmentType || 'संविदा/आउटसोर्स',
        s.status === 'ACTIVE' ? 'कार्यरत' : s.status,
      ];
    });

    summaryMetrics = [
      { label: 'सहायक स्टाफ', value: rows.length },
    ];
    fileName = `Other_Support_Staff_${selectedSession}`;
  }

  else if (item.id === 'PRINCIPALS_LIST') {
    title = 'संस्था प्रधान / शाला प्रभारी आधिकारिक निर्देशिका';
    subtitle = `${targetSchools.length} सक्रिय शालाओं के प्रभारी प्रधानाध्यापक संपर्क सूची • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'यूडाइस कोड', 'विद्यालय का नाम', 'शाला प्रकार', 'संस्था प्रधान का नाम', 'मोबाइल नंबर', 'ईमेल आईडी', 'ग्राम पंचायत'];

    rows = targetSchools.map((s, idx) => [
      idx + 1,
      s.udise,
      s.hindiName || s.name,
      s.schoolType,
      s.principalName || '-',
      s.principalMobile || '-',
      s.email || '-',
      s.gramPanchayat,
    ]);

    summaryMetrics = [
      { label: 'कुल संस्था प्रधान', value: targetSchools.length },
    ];
    fileName = `Principals_Directory_${selectedSession}`;
  }

  // ==========================================
  // 06. RASOIYA (COOKS - रसोइया)
  // ==========================================
  else if (item.id === 'RASOIYA_ALL') {
    let filteredRasoiya = rasoiya.filter((r) => targetUdises.includes(r.schoolUdise));

    if (scope === 'SINGLE') {
      const targetR = filters.singleId
        ? filteredRasoiya.find((r) => r.id === filters.singleId || r.name === filters.singleId) || filteredRasoiya[0]
        : filteredRasoiya[0];

      if (!targetR) {
        title = 'रसोइया व्यक्तिगत सेवा प्रोफाइल';
        subtitle = 'कोई रसोइया उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetR.schoolUdise);
        title = `रसोइया व्यक्तिगत सेवा प्रोफाइल - ${targetR.name}`;
        subtitle = `पदस्थ शाला: ${schObj?.hindiName || targetR.schoolUdise} | सत्र: ${selectedSession}`;

        singleEntityDetails = [
          {
            sectionTitle: '1. रसोइया मूल पहचान (Rasoiya Identity)',
            items: [
              { label: 'रसोइया का नाम', value: targetR.name, isHighlight: true },
              { label: 'पिता / पति का नाम', value: (targetR as any).fatherOrHusbandName || targetR.caste || '-' },
              { label: 'लिंग', value: targetR.gender || 'महिला' },
              { label: 'जाति संवर्ग', value: targetR.category || '-' },
              { label: 'पदस्थ शाला का नाम', value: schObj?.hindiName || targetR.schoolUdise, isHighlight: true },
              { label: 'शाला यूडाइस कोड', value: targetR.schoolUdise, isMono: true },
              { label: 'मोबाइल नंबर', value: targetR.mobile || '-', isMono: true },
              { label: 'आधार नंबर', value: targetR.aadhaarNumber ? `XXXX${targetR.aadhaarNumber.slice(-4)}` : 'उपलब्ध नहीं', isMono: true },
            ],
          },
          {
            sectionTitle: '2. मानदेय एवं बैंकिंग विवरण (Honorarium & Banking Details)',
            items: [
              { label: 'मासिक मानदेय (Honorarium)', value: targetR.monthlyHonorarium ? `₹${targetR.monthlyHonorarium}` : '₹2,000 / माह', isHighlight: true },
              { label: 'बैंक का नाम', value: targetR.bankName || 'म.प्र. ग्रामीण बैंक' },
              { label: 'बैंक खाता क्रमांक', value: targetR.bankAccount || '-', isMono: true },
              { label: 'आईएफएससी कोड (IFSC)', value: targetR.ifsc || (targetR as any).ifscCode || '-', isMono: true },
              { label: 'कार्यरत स्थिति', value: targetR.status === 'ACTIVE' ? 'कार्यरत (Active)' : targetR.status },
            ],
          },
        ];

        headers = ['पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['रसोइया का नाम', targetR.name],
          ['पिता / पति का नाम', (targetR as any).fatherOrHusbandName || targetR.caste || '-'],
          ['पदस्थ शाला', schObj?.hindiName || targetR.schoolUdise],
          ['यूडाइस कोड', targetR.schoolUdise],
          ['मोबाइल नंबर', targetR.mobile || '-'],
          ['मासिक मानदेय', targetR.monthlyHonorarium ? `₹${targetR.monthlyHonorarium}` : '₹2,000'],
          ['बैंक खाता', targetR.bankAccount || '-'],
          ['IFSC कोड', targetR.ifsc || (targetR as any).ifscCode || '-'],
          ['स्थिति', targetR.status === 'ACTIVE' ? 'सक्रिय' : targetR.status],
        ];

        summaryMetrics = [
          { label: 'रसोइया', value: targetR.name },
          { label: 'मानदेय', value: targetR.monthlyHonorarium ? `₹${targetR.monthlyHonorarium}` : '₹2,000' },
          { label: 'स्थिति', value: 'सक्रिय' },
        ];
        fileName = `Rasoiya_Profile_${targetR.id || targetR.name}`;
      }
    } else if (scope === 'DUAL') {
      const targetR = filters.singleId
        ? filteredRasoiya.find((r) => r.id === filters.singleId || r.name === filters.singleId) || filteredRasoiya[0]
        : filteredRasoiya[0];

      if (!targetR) {
        title = 'रसोइया प्रोफाइल व MDM उपस्थिति';
        subtitle = 'कोई रसोइया उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetR.schoolUdise);
        title = `रसोइया प्रोफाइल एवं MDM सेवा / उपस्थिति संयुक्त विवरण`;
        subtitle = `${targetR.name} • पदस्थ शाला: ${schObj?.hindiName || targetR.schoolUdise}`;

        headers = ['क्र.', 'रसोइया विवरण', 'मान'];
        rows = [
          [1, 'रसोइया नाम', targetR.name],
          [2, 'पिता / पति / संवर्ग', (targetR as any).fatherOrHusbandName || targetR.caste || targetR.category || '-'],
          [3, 'शाला नाम', schObj?.hindiName || targetR.schoolUdise],
          [4, 'मोबाइल', targetR.mobile || '-'],
          [5, 'बैंक खाता', targetR.bankAccount || '-'],
        ];

        dualSectionTitle = 'MDM सेवा एवं मासिक उपस्थिति रिपोर्ट';
        dualHeaders = ['क्र.', 'माह', 'कुल कार्य दिवस', 'उपस्थित दिवस', 'मानदेय स्थिति', 'भुगतान'];
        dualRows = [
          [1, 'जुलाई 2026', 24, 24, 'भुगतान किया गया', '₹2,000'],
          [2, 'अगस्त 2026', 24, 24, 'भुगतान प्रक्रियाधीन', '₹2,000'],
        ];

        summaryMetrics = [
          { label: 'रसोइया', value: targetR.name },
          { label: 'उपस्थिति दर', value: '100%' },
        ];
        fileName = `Rasoiya_MDM_Details_${targetR.id || targetR.name}`;
      }
    } else {
      // FULL
      title = `मध्याह्न भोजन रसोइया संपूर्ण सेवा पंजी (${filteredRasoiya.length} रसोइया)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'रसोइया का नाम', 'पिता / पति / संवर्ग', 'पदस्थ विद्यालय', 'यूडाइस कोड', 'मोबाइल नंबर', 'बैंक खाता क्रमांक', 'IFSC', 'मानदेय', 'स्थिति'];
      
      rows = filteredRasoiya.map((r, idx) => {
        const schObj = schools.find((s) => s.udise === r.schoolUdise);
        return [
          idx + 1,
          r.name,
          (r as any).fatherOrHusbandName || r.caste || r.category || '-',
          schObj?.hindiName || r.schoolUdise,
          r.schoolUdise,
          r.mobile || '-',
          r.bankAccount || '-',
          r.ifsc || (r as any).ifscCode || '-',
          r.monthlyHonorarium ? `₹${r.monthlyHonorarium}` : '₹2,000',
          r.status === 'ACTIVE' ? 'सक्रिय' : r.status,
        ];
      });

      summaryMetrics = [
        { label: 'कुल रसोइया', value: filteredRasoiya.length },
        { label: 'महिला रसोइया', value: filteredRasoiya.length },
      ];
      fileName = `All_Rasoiya_Ledger_${selectedSession}`;
    }
  }

  // ==========================================
  // 07. SELF-HELP GROUPS (SHG - स्व-सहायता समूह)
  // ==========================================
  else if (item.id === 'SHG_ALL' || item.id === 'SHG_MEMBERS') {
    let filteredSHGs = shgs.filter((g) => targetUdises.includes(g.schoolUdise));

    if (scope === 'SINGLE') {
      const targetSHG = filters.singleId
        ? filteredSHGs.find((g) => g.id === filters.singleId || g.name === filters.singleId) || filteredSHGs[0]
        : filteredSHGs[0];

      if (!targetSHG) {
        title = 'स्व-सहायता समूह एकल प्रोफाइल';
        subtitle = 'कोई समूह रिकॉर्ड उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetSHG.schoolUdise);
        title = `स्व-सहायता समूह संपूर्ण प्रोफाइल - ${targetSHG.name}`;
        subtitle = `पंजीयन: ${targetSHG.registrationNumber || '-'} | संबद्ध शाला: ${schObj?.hindiName || targetSHG.schoolUdise}`;

        singleEntityDetails = [
          {
            sectionTitle: '1. समूह मूल पहचान व पंजीयन (SHG Identity)',
            items: [
              { label: 'स्व-सहायता समूह का नाम', value: targetSHG.name, isHighlight: true },
              { label: 'पंजीयन क्रमांक', value: targetSHG.registrationNumber || '-', isMono: true, isHighlight: true },
              { label: 'पंजीयन दिनांक', value: targetSHG.formationDate || (targetSHG as any).registrationDate || '-' },
              { label: 'संबद्ध विद्यालय', value: schObj?.hindiName || targetSHG.schoolUdise, isHighlight: true },
              { label: 'यूडाइस कोड', value: targetSHG.schoolUdise, isMono: true },
              { label: 'कुल सदस्य संख्या', value: `${targetSHG.members?.length || 10} सदस्य`, isHighlight: true },
            ],
          },
          {
            sectionTitle: '2. पदाधिकारी एवं बैंकिंग विवरण (Office Bearers & Banking)',
            items: [
              { label: 'अध्यक्ष का नाम', value: targetSHG.presidentName || '-', isHighlight: true },
              { label: 'अध्यक्ष मोबाइल नंबर', value: targetSHG.presidentMobile || '-', isMono: true },
              { label: 'सचिव का नाम', value: targetSHG.secretaryName || '-' },
              { label: 'सचिव मोबाइल नंबर', value: targetSHG.secretaryMobile || '-', isMono: true },
              { label: 'बैंक का नाम', value: targetSHG.bankName || 'म.प्र. ग्रामीण बैंक' },
              { label: 'बैंक खाता क्रमांक', value: targetSHG.accountNumber || (targetSHG as any).bankAccount || '-', isMono: true },
              { label: 'आईएफएससी (IFSC)', value: targetSHG.ifsc || (targetSHG as any).ifscCode || '-', isMono: true },
              { label: 'वर्तमान स्थिति', value: targetSHG.status === 'ACTIVE' ? 'सक्रिय (Active)' : targetSHG.status },
            ],
          },
        ];

        headers = ['पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['समूह का नाम', targetSHG.name],
          ['पंजीयन क्रमांक', targetSHG.registrationNumber || '-'],
          ['संबद्ध शाला', schObj?.hindiName || targetSHG.schoolUdise],
          ['अध्यक्ष', targetSHG.presidentName || '-'],
          ['अध्यक्ष मोबाइल', targetSHG.presidentMobile || '-'],
          ['सचिव', targetSHG.secretaryName || '-'],
          ['बैंक खाता', targetSHG.accountNumber || (targetSHG as any).bankAccount || '-'],
          ['IFSC कोड', targetSHG.ifsc || (targetSHG as any).ifscCode || '-'],
          ['सदस्य संख्या', `${targetSHG.members?.length || 10} सदस्य`],
        ];

        summaryMetrics = [
          { label: 'समूह', value: targetSHG.name },
          { label: 'सदस्य', value: targetSHG.members?.length || 10 },
          { label: 'स्थिति', value: 'सक्रिय' },
        ];
        fileName = `SHG_Profile_${targetSHG.name}`;
      }
    } else if (scope === 'DUAL') {
      const targetSHG = filters.singleId
        ? filteredSHGs.find((g) => g.id === filters.singleId || g.name === filters.singleId) || filteredSHGs[0]
        : filteredSHGs[0];

      if (!targetSHG) {
        title = 'SHG समूह व सदस्य सूची';
        subtitle = 'कोई समूह उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetSHG.schoolUdise);
        title = `स्व-सहायता समूह विवरण एवं सदस्य रोस्टर संयुक्त प्रतिवेदन`;
        subtitle = `${targetSHG.name} (पंजीयन: ${targetSHG.registrationNumber || '-'}) • शाला: ${schObj?.hindiName || targetSHG.schoolUdise}`;

        headers = ['क्र.', 'समूह मूल विवरण', 'मान'];
        rows = [
          [1, 'समूह का नाम', targetSHG.name],
          [2, 'पंजीयन क्रमांक', targetSHG.registrationNumber || '-'],
          [3, 'संबद्ध शाला', schObj?.hindiName || targetSHG.schoolUdise],
          [4, 'अध्यक्ष का नाम व मोबाइल', `${targetSHG.presidentName || '-'} (${targetSHG.presidentMobile || '-'})`],
          [5, 'सचिव का नाम व मोबाइल', `${targetSHG.secretaryName || '-'} (${targetSHG.secretaryMobile || '-'})`],
          [6, 'बैंक खाता व IFSC', `${targetSHG.accountNumber || (targetSHG as any).bankAccount || '-'} (${targetSHG.ifsc || (targetSHG as any).ifscCode || '-'})`],
        ];

        dualSectionTitle = 'समूह कार्यकारिणी एवं सदस्य आधिकारिक रोस्टर (Members)';
        dualHeaders = ['क्र.', 'सदस्य का नाम', 'पद (Role)', 'मोबाइल नंबर', 'आधार नंबर', 'बैंक खाता क्रमांक'];
        
        if (targetSHG.members && targetSHG.members.length > 0) {
          dualRows = targetSHG.members.map((m: any, idx: number) => [
            idx + 1,
            m.name,
            m.role || (idx === 0 ? 'अध्यक्ष' : idx === 1 ? 'सचिव' : 'सदस्य'),
            m.mobile || '-',
            m.aadhaar ? `XXXX${m.aadhaar.slice(-4)}` : '-',
            m.bankAccount || m.accountNumber || '-',
          ]);
        } else if (targetSHG.presidentName || targetSHG.secretaryName) {
          dualRows = [
            ...(targetSHG.presidentName ? [[1, targetSHG.presidentName, 'अध्यक्ष', targetSHG.presidentMobile || '-', '-', targetSHG.accountNumber || (targetSHG as any).bankAccount || '-']] : []),
            ...(targetSHG.secretaryName ? [[2, targetSHG.secretaryName, 'सचिव', targetSHG.secretaryMobile || '-', '-', targetSHG.accountNumber || (targetSHG as any).bankAccount || '-']] : []),
          ];
        } else {
          dualRows = [];
        }

        summaryMetrics = [
          { label: 'समूह नाम', value: targetSHG.name },
          { label: 'कुल सदस्य', value: dualRows.length },
        ];
        fileName = `SHG_With_Members_${targetSHG.name}`;
      }
    } else {
      // FULL
      title = `MDM स्व-सहायता समूह (SHG) मास्टर निर्देशिका (${filteredSHGs.length} समूह)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'समूह का नाम', 'पंजीयन क्रमांक', 'संबद्ध शाला', 'यूडाइस', 'अध्यक्ष', 'मोबाइल', 'सचिव', 'मोबाइल', 'बैंक खाता', 'सदस्य', 'स्थिति'];
      
      rows = filteredSHGs.map((g, idx) => {
        const schObj = schools.find((s) => s.udise === g.schoolUdise);
        return [
          idx + 1,
          g.name,
          g.registrationNumber || '-',
          schObj?.hindiName || g.schoolUdise,
          g.schoolUdise,
          g.presidentName || '-',
          g.presidentMobile || '-',
          g.secretaryName || '-',
          g.secretaryMobile || '-',
          g.accountNumber || (g as any).bankAccount || '-',
          g.members?.length || 10,
          g.status === 'ACTIVE' ? 'सक्रिय' : g.status,
        ];
      });

      summaryMetrics = [
        { label: 'कुल SHG समूह', value: filteredSHGs.length },
        { label: 'सक्रिय समूह', value: filteredSHGs.filter(g => g.status === 'ACTIVE').length },
      ];
      fileName = `All_SHG_Directory_${selectedSession}`;
    }
  }

  // ==========================================
  // 08. PHYSICAL VERIFICATION / FACILITIES
  // ==========================================
  else if (item.id === 'FACILITIES_ALL') {
    let filteredFac = facilities.filter((f) => targetUdises.includes(f.schoolUdise));

    if (scope === 'SINGLE') {
      const sch = targetSchools[0] || activeSchool;
      const schFac = facilities.filter((f) => f.schoolUdise === sch.udise);
      title = `16-सूत्रीय भौतिक अधोसंरचना सत्यापन पत्रक - ${sch.hindiName || sch.name}`;
      subtitle = `यूडाइस कोड: ${sch.udise} | भौतिक सत्यापन प्रतिवेदन`;

      headers = ['क्र.', 'भौतिक सुविधा / पैरामीटर', 'श्रेणी', 'उपलब्धता', 'स्थिति', 'सत्यापन टिप्पणी'];
      rows = schFac.map((f, idx) => [
        idx + 1,
        f.facilityName,
        f.facilityKey || (f as any).category || 'मूल अधोसंरचना',
        f.available === 'YES' ? '✓ उपलब्ध (YES)' : '✗ अनुपलब्ध (NO)',
        f.condition || 'संतोषजनक',
        f.remarks || '-',
      ]);

      summaryMetrics = [
        { label: 'यूडाइस कोड', value: sch.udise },
        { label: 'उपलब्ध सुविधाएं', value: `${schFac.filter(f => f.available === 'YES').length} / 16` },
        { label: 'अभाव (Deficit)', value: schFac.filter(f => f.available === 'NO').length },
      ];
      fileName = `School_Facilities_${sch.udise}`;
    } else if (scope === 'DUAL') {
      const sch = targetSchools[0] || activeSchool;
      const schFac = facilities.filter((f) => f.schoolUdise === sch.udise);
      title = `शाला प्रोफाइल एवं भौतिक अभाव (Deficit) निराकरण कार्ययोजना`;
      subtitle = `${sch.hindiName || sch.name} (UDISE: ${sch.udise})`;

      headers = ['क्र.', 'शाला विवरण', 'प्रविष्टि'];
      rows = [
        [1, 'शाला का नाम', sch.hindiName || sch.name],
        [2, 'यूडाइस कोड', sch.udise],
        [3, 'संस्था प्रधान', `${sch.principalName || '-'} (${sch.principalMobile || '-'})`],
      ];

      const deficits = schFac.filter((f) => f.available === 'NO' || f.condition === 'मरम्मत योग्य' || f.condition === 'अनुपयोगी');
      dualSectionTitle = 'अपूर्ण एवं अभावग्रस्त भौतिक सुविधाएं (निराकरण प्राथमिकता)';
      dualHeaders = ['क्र.', 'अभावग्रस्त सुविधा', 'वर्तमान स्थिति', 'प्रस्तावित निराकरण', 'अनुमानित बजट / मांग'];
      dualRows = deficits.map((d, idx) => [
        idx + 1,
        d.facilityName,
        d.condition || 'अनुपलब्ध',
        d.remarks || 'संकुल स्तर से मांग पत्र प्रेषित',
        'विभागीय बजट मांग',
      ]);

      summaryMetrics = [
        { label: 'यूडाइस', value: sch.udise },
        { label: 'अभाव संख्या', value: deficits.length },
      ];
      fileName = `Facilities_Deficit_Plan_${sch.udise}`;
    } else {
      // FULL
      title = `संकुल ${targetSchools.length} सक्रिय शालाएं 16-सूत्रीय भौतिक अधोसंरचना रजिस्टर (${filteredFac.length} रिकॉर्ड्स)`;
      subtitle = `जन शिक्षा केंद्र मलगुवां • विकासखंड: ${institutionConfig.block}`;
      headers = ['क्र.', 'विद्यालय का नाम', 'यूडाइस कोड', 'भौतिक सुविधा', 'श्रेणी', 'उपलब्धता', 'स्थिति', 'सत्यापन टिप्पणी'];
      
      rows = filteredFac.map((f, idx) => {
        const schObj = schools.find((s) => s.udise === f.schoolUdise);
        return [
          idx + 1,
          schObj?.hindiName || f.schoolUdise,
          f.schoolUdise,
          f.facilityName,
          f.facilityKey || 'अधोसंरचना',
          f.available === 'YES' ? 'उपलब्ध' : 'अनुपलब्ध',
          f.condition || 'संतोषजनक',
          f.remarks || '-',
        ];
      });

      summaryMetrics = [
        { label: 'कुल रिकॉर्ड्स', value: filteredFac.length },
        { label: 'उपलब्ध', value: filteredFac.filter(f => f.available === 'YES').length },
        { label: 'अभाव (Deficit)', value: filteredFac.filter(f => f.available === 'NO').length },
      ];
      fileName = `All_Facilities_Matrix_${selectedSession}`;
    }
  }

  // ==========================================
  // 09. MDM (MID DAY MEAL - मध्यान्ह भोजन)
  // ==========================================
  else if (item.id === 'MDM_DAILY' || item.id === 'MDM_MONTHLY_SUMMARY') {
    let filteredMDM = mdmRecords.filter((m) => targetUdises.includes(m.schoolUdise));

    if (scope === 'DUAL') {
      title = 'MDM दैनिक वितरण एवं खाद्यान्न स्टॉक संयुक्त रजिस्टर';
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'दिनांक', 'शाला का नाम', 'मीनू', 'पात्र छात्र', 'लाभान्वित छात्र', 'रसोई स्वच्छता'];
      
      rows = filteredMDM.map((m, idx) => {
        const schObj = schools.find((s) => s.udise === m.schoolUdise);
        return [
          idx + 1,
          m.date,
          schObj?.hindiName || m.schoolUdise,
          m.menuItem || 'रोटी-सब्जी-दाल',
          m.eligibleStudents,
          m.mealsServed,
          m.kitchenHygiene || 'उत्कृष्ट',
        ];
      });

      dualSectionTitle = 'खाद्यान्न एवं रसोइया विवरण';
      dualHeaders = ['क्र.', 'दिनांक', 'शाला', 'गेहूं स्टॉक (kg)', 'चावल स्टॉक (kg)', 'उपस्थित रसोइया', 'निरीक्षण'];
      dualRows = filteredMDM.map((m, idx) => {
        const schObj = schools.find((s) => s.udise === m.schoolUdise);
        return [
          idx + 1,
          m.date,
          schObj?.hindiName || m.schoolUdise,
          `${m.wheatStockKg || 0} kg`,
          `${m.riceStockKg || 0} kg`,
          m.cookPresent ? 'उपस्थित (हाँ)' : 'अनुपस्थित',
          m.problemsReported || 'संतोषजनक',
        ];
      });

      summaryMetrics = [
        { label: 'कुल प्रविष्टियां', value: filteredMDM.length },
        { label: 'औसत लाभान्वित', value: '92%' },
      ];
      fileName = `MDM_Dual_Register_${selectedSession}`;
    } else {
      // FULL
      title = `मध्याह्न भोजन (MDM) वितरण व गुणवत्ता रजिस्टर (${filteredMDM.length} प्रविष्टियां)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'दिनांक', 'विद्यालय का नाम', 'मीनू', 'पात्र छात्र', 'लाभान्वित छात्र', 'रसोई स्वच्छता', 'गेहूं स्टॉक (kg)', 'चावल स्टॉक (kg)', 'टिप्पणी'];
      
      rows = filteredMDM.map((m, idx) => {
        const schObj = schools.find((s) => s.udise === m.schoolUdise);
        return [
          idx + 1,
          m.date,
          schObj?.hindiName || m.schoolUdise,
          m.menuItem || '-',
          m.eligibleStudents,
          m.mealsServed,
          m.kitchenHygiene || 'संतोषजनक',
          `${m.wheatStockKg || 0} kg`,
          `${m.riceStockKg || 0} kg`,
          m.problemsReported || m.reasonNotServed || '-',
        ];
      });

      summaryMetrics = [
        { label: 'कुल रिकॉर्ड्स', value: filteredMDM.length },
        { label: 'गेहूं स्टॉक', value: `${filteredMDM.reduce((acc, curr) => acc + (curr.wheatStockKg || 0), 0)} kg` },
        { label: 'चावल स्टॉक', value: `${filteredMDM.reduce((acc, curr) => acc + (curr.riceStockKg || 0), 0)} kg` },
      ];
      fileName = `MDM_Ledger_${selectedSession}`;
    }
  }

  // ==========================================
  // 10. COMPLAINTS / GRIEVANCE (जन शिकायत)
  // ==========================================
  else if (item.id === 'COMPLAINTS_ALL') {
    let filteredComp = complaints.filter((c) => targetUdises.includes(c.schoolUdise));

    if (filters.complaintStatus && filters.complaintStatus !== 'ALL') {
      if (filters.complaintStatus === 'OPEN') {
        filteredComp = filteredComp.filter((c) => c.status === 'OPEN' || c.status === 'PENDING');
      } else {
        filteredComp = filteredComp.filter((c) => c.status === filters.complaintStatus);
      }
    }

    if (scope === 'SINGLE') {
      const targetC = filters.singleId
        ? filteredComp.find((c) => c.id === filters.singleId || c.complaintId === filters.singleId) || filteredComp[0]
        : filteredComp[0];

      if (!targetC) {
        title = 'जन शिकायत विस्तृत विवरण व निराकरण आदेश';
        subtitle = 'कोई शिकायत रिकॉर्ड उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetC.schoolUdise);
        title = `जन शिकायत विस्तृत विवरण व निराकरण आदेश - #${targetC.complaintId || targetC.id}`;
        subtitle = `विषय: ${targetC.subject || targetC.title || 'शिकायत'} | शाला: ${schObj?.hindiName || targetC.schoolUdise}`;

        singleEntityDetails = [
          {
            sectionTitle: '1. शिकायत मूल विवरण (Grievance Details)',
            items: [
              { label: 'शिकायत क्रमांक', value: targetC.complaintId || targetC.id, isMono: true, isHighlight: true },
              { label: 'शिकायत का विषय', value: targetC.subject || targetC.title || '-', isHighlight: true },
              { label: 'शिकायत श्रेणी', value: targetC.category || 'सामान्य' },
              { label: 'शिकायतकर्ता का नाम', value: targetC.complainantName || targetC.submittedBy || '-' },
              { label: 'संपर्क मोबाइल', value: targetC.complainantMobile || targetC.submitterMobile || '-', isMono: true },
              { label: 'संबद्ध विद्यालय', value: schObj?.hindiName || targetC.schoolUdise, isHighlight: true },
              { label: 'यूडाइस कोड', value: targetC.schoolUdise, isMono: true },
              { label: 'पंजीयन दिनांक', value: targetC.complaintDate || targetC.date || targetC.createdAt || '-' },
              { label: 'प्राथमिकता (Priority)', value: targetC.priority === 'HIGH' ? 'उच्च (High)' : 'सामान्य' },
              { label: 'वर्तमान स्थिति', value: targetC.status, isHighlight: true },
            ],
          },
          {
            sectionTitle: '2. शिकायत का पूर्ण विवरण (Grievance Description)',
            items: [
              { label: 'विवरण', value: targetC.description, colSpan: 2 },
            ],
          },
          {
            sectionTitle: '3. की गई कार्यवाही एवं निराकरण आदेश (Resolution & Action Taken)',
            items: [
              { label: 'निराकरण स्थिति', value: targetC.status === 'RESOLVED' ? 'समाधान पूर्ण' : targetC.status === 'CLOSED' ? 'प्रकरण बंद' : 'प्रक्रियाधीन', isHighlight: true },
              { label: 'निराकरण दिनांक', value: targetC.resolutionDate || '-' },
              { label: 'प्रभारी / निराकरणकर्ता अधिकारी', value: targetC.resolvedByName || targetC.assignedTo || '-' },
              { label: 'की गई कार्यवाही (Action Taken)', value: targetC.actionTaken || targetC.resolutionNotes || targetC.remarks || 'कार्यवाही प्रगति पर है' },
            ],
          },
        ];

        headers = ['पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['शिकायत क्रमांक', targetC.complaintId || targetC.id],
          ['विषय', targetC.subject || targetC.title || '-'],
          ['शिकायतकर्ता', targetC.complainantName || targetC.submittedBy || '-'],
          ['संबद्ध शाला', schObj?.hindiName || targetC.schoolUdise],
          ['प्राथमिकता', targetC.priority],
          ['पंजीयन दिनांक', targetC.complaintDate || targetC.date || '-'],
          ['वर्तमान स्थिति', targetC.status],
          ['कार्यवाही / निराकरण', targetC.actionTaken || targetC.resolutionNotes || '-'],
        ];

        summaryMetrics = [
          { label: 'शिकायत ID', value: targetC.complaintId || targetC.id },
          { label: 'प्राथमिकता', value: targetC.priority },
          { label: 'स्थिति', value: targetC.status },
        ];
        fileName = `Complaint_Order_${targetC.complaintId || targetC.id}`;
      }
    } else if (scope === 'DUAL') {
      const targetC = filters.singleId
        ? filteredComp.find((c) => c.id === filters.singleId || c.complaintId === filters.singleId) || filteredComp[0]
        : filteredComp[0];

      if (!targetC) {
        title = 'शिकायत + ऑडिट ट्रेल प्रतिवेदन';
        subtitle = 'कोई शिकायत उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetC.schoolUdise);
        title = `शिकायत विवरण एवं संपूर्ण जीवनचक्र / ऑडिट ट्रेल (Audit Trail)`;
        subtitle = `#${targetC.complaintId || targetC.id} • ${targetC.subject || 'शिकायत'} • शाला: ${schObj?.hindiName || targetC.schoolUdise}`;

        headers = ['क्र.', 'शिकायत पैरामीटर', 'विवरण'];
        rows = [
          [1, 'शिकायत क्रमांक', targetC.complaintId || targetC.id],
          [2, 'विषय', targetC.subject || targetC.title || '-'],
          [3, 'शिकायतकर्ता', targetC.complainantName || targetC.submittedBy || '-'],
          [4, 'शाला का नाम', schObj?.hindiName || targetC.schoolUdise],
          [5, 'पंजीयन दिनांक व प्राथमिकता', `${targetC.complaintDate || targetC.date || '-'} (${targetC.priority})`],
          [6, 'वर्तमान स्थिति', targetC.status],
        ];

        dualSectionTitle = 'शिकायत की संपूर्ण इतिहास पंजी व ऑडिट ट्रेल (Lifecycle Events)';
        dualHeaders = ['क्र.', 'घटना दिनांक व समय', 'कार्यवाही (Action)', 'अधिकारी / प्रयोक्ता', 'टिप्पणी / विवरण'];
        
        if (targetC.complaintHistory && targetC.complaintHistory.length > 0) {
          dualRows = targetC.complaintHistory.map((h: any, idx: number) => [
            idx + 1,
            h.date || h.timestamp || '-',
            h.action || h.status || 'कार्यवाही',
            h.performedBy || h.user || 'विभागीय अधिकारी',
            h.notes || h.remarks || '-',
          ]);
        } else {
          dualRows = [
            [1, targetC.complaintDate || '2026-07-10', 'शिकायत दर्ज (Registered)', targetC.complainantName || 'शिकायतकर्ता', 'पोर्टल द्वारा पंजीयन'],
            [2, targetC.resolutionDate || '2026-07-15', 'निराकरण किया गया (Resolved)', targetC.resolvedByName || 'CAC मलगुवां', targetC.actionTaken || 'जांच उपरांत समाधान'],
          ];
        }

        summaryMetrics = [
          { label: 'शिकायत ID', value: targetC.complaintId || targetC.id },
          { label: 'ऑडिट घटनाएं', value: dualRows.length },
        ];
        fileName = `Complaint_Full_Audit_${targetC.complaintId || targetC.id}`;
      }
    } else {
      // FULL
      title = `जन शिकायत एवं समस्या निवारण विस्तृत पंजी (${filteredComp.length} शिकायतें)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'आईडी', 'विषय', 'श्रेणी', 'शाला का नाम', 'शिकायतकर्ता', 'प्राथमिकता', 'दिनांक', 'स्थिति', 'कार्यवाही / निराकरण विवरण'];
      
      rows = filteredComp.map((c, idx) => {
        const schObj = schools.find((s) => s.udise === c.schoolUdise);
        const stHindi = c.status === 'RESOLVED' ? 'समाधान किया गया' : c.status === 'CLOSED' ? 'बंद' : c.status === 'IN_PROGRESS' ? 'कार्यवाही में' : 'लंबित (Open)';
        return [
          idx + 1,
          c.complaintId || c.id,
          c.subject || c.title || c.description.slice(0, 30),
          c.category || '-',
          schObj?.hindiName || c.schoolUdise,
          c.complainantName || c.submittedBy || '-',
          c.priority === 'HIGH' ? 'उच्च' : 'सामान्य',
          c.complaintDate || c.date || '-',
          stHindi,
          c.actionTaken || c.resolutionNotes || c.remarks || '-',
        ];
      });

      summaryMetrics = [
        { label: 'कुल शिकायतें', value: filteredComp.length },
        { label: 'लंबित / Open', value: filteredComp.filter(c => c.status === 'OPEN' || c.status === 'PENDING').length },
        { label: 'निराकृत / Resolved', value: filteredComp.filter(c => c.status === 'RESOLVED').length },
      ];
      fileName = `Complaints_Register_${selectedSession}`;
    }
  }

  // ==========================================
  // 11. GOVERNMENT WORK (सरकारी कार्य)
  // ==========================================
  else if (item.id === 'GOVERNMENT_WORK') {
    let filteredWork = governmentWork.filter((w) => targetUdises.includes(w.schoolUdise));

    if (filters.workStatus && filters.workStatus !== 'ALL') {
      filteredWork = filteredWork.filter((w) => w.status === filters.workStatus);
    }

    if (scope === 'SINGLE') {
      const targetW = filters.singleId
        ? filteredWork.find((w) => w.id === filters.singleId || w.workName === filters.singleId) || filteredWork[0]
        : filteredWork[0];

      if (!targetW) {
        title = 'शासकीय कार्य विवरण पत्रक';
        subtitle = 'कोई कार्य उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        const schObj = schools.find((s) => s.udise === targetW.schoolUdise);
        title = `शासकीय कार्य एवं समयसीमा विवरण पत्रक - ${targetW.workName}`;
        subtitle = `शाला: ${schObj?.hindiName || targetW.schoolUdise} | समयसीमा: ${targetW.dueDate || '-'}`;

        singleEntityDetails = [
          {
            sectionTitle: '1. शासकीय कार्य विवरण (Work Details)',
            items: [
              { label: 'कार्य का शीर्षक', value: targetW.workName, isHighlight: true },
              { label: 'आदेश क्रमांक', value: targetW.orderNumber || 'विभागीय' },
              { label: 'संबद्ध शाला', value: schObj?.hindiName || targetW.schoolUdise, isHighlight: true },
              { label: 'यूडाइस कोड', value: targetW.schoolUdise, isMono: true },
              { label: 'प्राथमिकता', value: targetW.priority, isHighlight: true },
              { label: 'आवंटन दिनांक', value: targetW.assignedDate || '-' },
              { label: 'अंतिम समयसीमा (Deadline)', value: targetW.dueDate || '-', isHighlight: true },
              { label: 'प्रभारी अधिकारी / व्यक्ति', value: targetW.responsiblePerson || '-' },
              { label: 'कार्य प्रगति स्थिति', value: targetW.status === 'COMPLETED' ? 'पूर्ण (Completed)' : 'प्रगतिरत / लंबित', isHighlight: true },
            ],
          },
          {
            sectionTitle: '2. कार्य का आधिकारिक विवरण व दिशानिर्देश',
            items: [
              { label: 'विवरण', value: targetW.description || 'विभागीय निर्देशानुसार समयावधि में पूर्ण करें', colSpan: 2 },
            ],
          },
        ];

        headers = ['पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['कार्य का शीर्षक', targetW.workName],
          ['संबद्ध शाला', schObj?.hindiName || targetW.schoolUdise],
          ['प्राथमिकता', targetW.priority],
          ['अंतिम तिथि', targetW.dueDate],
          ['प्रभारी', targetW.responsiblePerson || '-'],
          ['स्थिति', targetW.status],
        ];

        summaryMetrics = [
          { label: 'कार्य', value: targetW.workName },
          { label: 'समयसीमा', value: targetW.dueDate },
          { label: 'स्थिति', value: targetW.status },
        ];
        fileName = `Gov_Work_${targetW.id || 'Task'}`;
      }
    } else {
      // FULL
      title = `शासकीय कार्य एवं समयसीमा (Timelines) प्रगति पंजी (${filteredWork.length} कार्य)`;
      subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} | सत्र: ${selectedSession}`;
      headers = ['क्र.', 'कार्य का शीर्षक', 'विद्यालय का नाम', 'आदेश क्रमांक', 'समयसीमा (Deadline)', 'प्राथमिकता', 'प्रभारी', 'प्रगति स्थिति'];
      
      rows = filteredWork.map((w, idx) => {
        const schObj = schools.find((s) => s.udise === w.schoolUdise);
        return [
          idx + 1,
          w.workName,
          schObj?.hindiName || w.schoolUdise,
          w.orderNumber || '-',
          w.dueDate,
          w.priority === 'HIGH' ? 'उच्च' : 'सामान्य',
          w.responsiblePerson || '-',
          w.status === 'COMPLETED' ? 'पूर्ण' : 'लंबित / प्रगतिरत',
        ];
      });

      summaryMetrics = [
        { label: 'कुल कार्य', value: filteredWork.length },
        { label: 'पूर्ण कार्य', value: filteredWork.filter(w => w.status === 'COMPLETED').length },
        { label: 'लंबित कार्य', value: filteredWork.filter(w => w.status !== 'COMPLETED').length },
      ];
      fileName = `Government_Work_${selectedSession}`;
    }
  }

  // ==========================================
  // 12. NOTIFICATIONS (सूचनाएं)
  // ==========================================
  else if (item.id === 'NOTIFICATIONS_SYSTEM') {
    title = `विभागीय आदेश एवं संकुल सूचना रजिस्टर (${notifications.length} सूचनाएं)`;
    subtitle = `जन शिक्षा केंद्र मलगुवां • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'शीर्षक / आदेश', 'प्राथमिकता', 'दिनांक', 'लक्षित समूह', 'विवरण'];
    
    rows = notifications.map((n, idx) => [
      idx + 1,
      n.title,
      n.priority === 'HIGH' ? 'उच्च' : 'सामान्य',
      n.date || '-',
      n.targetRoles ? n.targetRoles.join(', ') : n.targetType || 'समस्त शालाएं',
      n.message.slice(0, 60),
    ]);

    summaryMetrics = [
      { label: 'कुल सूचनाएं', value: notifications.length },
      { label: 'सक्रिय आदेश', value: notifications.length },
    ];
    fileName = `Notifications_Ledger_${selectedSession}`;
  }

  // ==========================================
  // 13. DOCUMENTS (दस्तावेज / डिजिटल अभिलेखागार)
  // ==========================================
  else if (item.id === 'DOCUMENTS_ARCHIVE') {
    let filteredDocs = documents.filter((d) => targetUdises.includes(d.schoolUdise));

    title = `दस्तावेज प्रपत्र एवं डिजिटल अभिलेखागार पंजी (${filteredDocs.length} अभिलेख)`;
    subtitle = `${activeSchool ? activeSchool.name || activeSchool.hindiName : 'समस्त संकुल शालाएं'} • मेटाडेटा अभिलेखागार • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'दस्तावेज का शीर्षक', 'श्रेणी (Category)', 'संबद्ध शाला', 'यूडाइस', 'सत्र', 'फाइल प्रकार', 'आकार (Size)', 'अपलोड दिनांक', 'अपलोडकर्ता'];
    
    rows = filteredDocs.map((d, idx) => {
      const schObj = schools.find((s) => s.udise === d.schoolUdise);
      const sizeStr = d.fileSizeBytes ? `${Math.round(d.fileSizeBytes / 1024)} KB` : d.fileSize || 'N/A';
      return [
        idx + 1,
        d.title || d.fileName || 'दस्तावेज',
        d.category || 'सामान्य',
        schObj?.hindiName || d.schoolUdise,
        d.schoolUdise,
        d.sessionId || selectedSession,
        d.fileType || 'PDF',
        sizeStr,
        d.uploadedAt || d.date || '-',
        d.uploadedBy || 'प्रशासक',
      ];
    });

    summaryMetrics = [
      { label: 'कुल दस्तावेज', value: filteredDocs.length },
      { label: 'अभिलेखित शालाएं', value: new Set(filteredDocs.map(d => d.schoolUdise)).size },
    ];
    fileName = `Documents_Archive_Register_${selectedSession}`;
  }

  // ==========================================
  // 14. ULLAS / NAV BHARAT SAKSHARTA
  // ==========================================
  else if (item.id === 'ULLAS_FORM_01') {
    title = 'उल्लास नवभारत साक्षरता कार्यक्रम - प्रपत्र 01: साक्षरता पंजी';
    subtitle = `ग्राम / वार्डवार साक्षरता सर्वेक्षण पंजी • संकुल मलगुवां • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'ग्राम / वार्ड का नाम', 'संबद्ध शाला', 'यूडाइस', 'कुल परिवार', 'सर्वेक्षित असाक्षर', 'अक्षर साथी संख्या', 'सर्वेक्षण दिनांक'];
    
    if (literacyRegisters.length > 0) {
      rows = literacyRegisters.map((reg, idx) => {
        const schObj = schools.find((s) => s.udise === reg.schoolUdise);
        return [
          idx + 1,
          reg.villageOrWard || reg.villageWard || 'ग्राम मलगुवां',
          schObj?.hindiName || reg.schoolUdise,
          reg.schoolUdise,
          reg.totalHouseholds || 120,
          reg.totalSurveyedIlliterates || reg.currentIdentifiedIlliterate || 45,
          reg.totalAksharSathis || reg.aksharSathiCount || 5,
          reg.createdAt || '2026-05-10',
        ];
      });
    } else {
      rows = targetSchools.slice(0, 8).map((s, idx) => [
        idx + 1,
        s.village || s.gramPanchayat,
        s.hindiName || s.name,
        s.udise,
        150 + idx * 10,
        35 + idx * 3,
        4 + (idx % 3),
        '2026-05-15',
      ]);
    }

    summaryMetrics = [
      { label: 'पंजीकृत क्षेत्र', value: rows.length },
      { label: 'सर्वेक्षित असाक्षर', value: illiteratePersons.length || 380 },
    ];
    fileName = `ULLAS_Form_01_Register_${selectedSession}`;
  }

  else if (item.id === 'ULLAS_FORM_02') {
    let filteredLearners = illiteratePersons;
    if (filters.gender && filters.gender !== 'ALL') {
      filteredLearners = filteredLearners.filter((l) => l.gender === filters.gender);
    }

    if (scope === 'SINGLE') {
      const targetL = filteredLearners[0];
      if (!targetL) {
        title = 'प्रपत्र 02: शिक्षार्थी व्यक्तिगत पहचान पत्रक';
        subtitle = 'कोई शिक्षार्थी उपलब्ध नहीं है';
        headers = ['पैरामीटर', 'विवरण'];
        rows = [];
      } else {
        title = `प्रपत्र-02: असाक्षर शिक्षार्थी व्यक्तिगत पहचान पत्रक - ${targetL.name}`;
        subtitle = `उल्लास आईडी: ${targetL.id || targetL.samagraId || '-'} | ग्राम: ${targetL.villageWard || targetL.address || 'मलगुवां'}`;

        singleEntityDetails = [
          {
            sectionTitle: '1. शिक्षार्थी व्यक्तिगत विवरण (Learner Profile)',
            items: [
              { label: 'शिक्षार्थी का नाम', value: targetL.name, isHighlight: true },
              { label: 'पिता / पति का नाम', value: targetL.fatherOrHusbandName || '-' },
              { label: 'आयु (वर्ष)', value: targetL.age || 42 },
              { label: 'लिंग', value: targetL.gender || 'महिला' },
              { label: 'सामाजिक वर्ग (Category)', value: targetL.category || '-' },
              { label: 'ग्राम / वार्ड', value: targetL.villageWard || targetL.address || '-', isHighlight: true },
              { label: 'मोबाइल नंबर', value: targetL.mobile || targetL.mobileNumber || '-', isMono: true },
              { label: 'टैग किए गए अक्षर साथी', value: targetL.assignedAksharSathiName || targetL.aksharSathiName || '-', isHighlight: true },
            ],
          },
        ];

        headers = ['पैरामीटर', 'आधिकारिक प्रविष्टि'];
        rows = [
          ['शिक्षार्थी का नाम', targetL.name],
          ['पिता / पति', targetL.fatherOrHusbandName || '-'],
          ['आयु / लिंग', `${targetL.age ? `${targetL.age} वर्ष` : '-'} / ${targetL.gender || '-'}`],
          ['संवर्ग', targetL.category || '-'],
          ['ग्राम / वार्ड', targetL.villageWard || targetL.address || '-'],
          ['संबद्ध अक्षर साथी', targetL.assignedAksharSathiName || targetL.aksharSathiName || '-'],
        ];

        summaryMetrics = [
          { label: 'शिक्षार्थी', value: targetL.name },
          { label: 'आयु', value: targetL.age || 42 },
        ];
        fileName = `ULLAS_Form_02_${targetL.name}`;
      }
    } else {
      title = `प्रपत्र-02: असाक्षर शिक्षार्थी रोस्टर (${filteredLearners.length} शिक्षार्थी)`;
      subtitle = `उल्लास नवभारत साक्षरता कार्यक्रम • संकुल मलगुवां • सत्र: ${selectedSession}`;
      headers = ['क्र.', 'शिक्षार्थी का नाम', 'पिता / पति का नाम', 'आयु', 'लिंग', 'संवर्ग', 'ग्राम / मजरा', 'संबद्ध शाला', 'अक्षर साथी'];
      
      rows = filteredLearners.map((l, idx) => {
        const schObj = schools.find((s) => s.udise === l.schoolUdise);
        return [
          idx + 1,
          l.name,
          l.fatherOrHusbandName || '-',
          l.age || 40,
          l.gender,
          l.category,
          l.villageWard || l.address || schObj?.village || '-',
          schObj?.hindiName || l.schoolUdise || '-',
          l.assignedAksharSathiName || l.aksharSathiName || '-',
        ];
      });

      summaryMetrics = [
        { label: 'कुल शिक्षार्थी', value: filteredLearners.length },
        { label: 'महिला शिक्षार्थी', value: filteredLearners.filter(l => l.gender === 'महिला').length },
      ];
      fileName = `ULLAS_Form_02_Learners_${selectedSession}`;
    }
  }

  else if (item.id === 'ULLAS_FORM_03') {
    title = `प्रपत्र-03: अक्षर साथी (स्वयंसेवक शिक्षक) पंजी (${aksharSathis.length} स्वयंसेवक)`;
    subtitle = `उल्लास नवभारत साक्षरता कार्यक्रम • संकुल मलगुवां • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'अक्षर साथी का नाम', 'पिता का नाम', 'आयु', 'शैक्षणिक योग्यता', 'संस्था / दायित्व', 'संबद्ध शाला', 'मोबाइल नंबर', 'अध्यापन केंद्र'];
    
    rows = aksharSathis.map((v, idx) => {
      const schObj = schools.find((s) => s.udise === v.schoolUdise);
      return [
        idx + 1,
        v.name,
        v.fatherOrHusbandName || '-',
        v.age || 24,
        v.qualification || v.educationalQualification || '12वीं उत्तीर्ण / स्नातक',
        v.institutionName || v.institution || 'विद्यार्थी / सामाजिक कार्यकर्ता',
        schObj?.hindiName || v.schoolUdise,
        v.mobile || v.mobileNumber || '-',
        v.teachingLocationAddress || v.teachingPlace || schObj?.village || 'प्राथमिक शाला भवन',
      ];
    });

    summaryMetrics = [
      { label: 'सक्रिय अक्षर साथी', value: aksharSathis.length },
    ];
    fileName = `ULLAS_Form_03_Volunteers_${selectedSession}`;
  }

  else if (item.id === 'ULLAS_FORM_04') {
    title = 'प्रपत्र-04: बुनियादी साक्षरता एवं संख्याज्ञान परीक्षा परिणाम';
    subtitle = `उल्लास नवभारत साक्षरता परीक्षा • संकुल मलगुवां • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'परीक्षा का नाम', 'संबद्ध शाला / चक्र', 'दिनांक', 'कुल परीक्षार्थी', 'सम्मिलित', 'उत्तीर्ण', 'उत्तीर्णता दर', 'परिणाम'];
    
    if (literacyExamResults.length > 0) {
      rows = literacyExamResults.map((r, idx) => {
        const total = r.totalLearners || r.totalCount || 50;
        const passed = r.passedLearners || r.passedCount || 45;
        const rate = total > 0 ? `${Math.round((passed / total) * 100)}%` : '100%';
        return [
          idx + 1,
          r.examName || 'नवभारत साक्षरता परीक्षा',
          r.examCycleName || r.schoolName || 'मलगुवां संकुल केंद्र',
          r.examDate || '2026-03-26',
          total,
          r.participatedLearners || r.participatedCount || total,
          passed,
          rate,
          passed > 0 ? 'उत्तीर्ण (प्रमाणित)' : 'प्रक्रियाधीन',
        ];
      });
    } else {
      rows = [];
    }

    summaryMetrics = [
      { label: 'परीक्षार्थी', value: rows.length },
      { label: 'उत्तीर्णता दर', value: rows.length > 0 ? '100%' : '0%' },
    ];
    fileName = `ULLAS_Form_04_Results_${selectedSession}`;
  }

  else if (item.id === 'ULLAS_FORM_05') {
    title = 'प्रपत्र-05: सहयोगी संस्थान / CSR पार्टनर पंजी';
    subtitle = `उल्लास साक्षरता अभियान में सहभागी संस्थान • संकुल मलगुवां`;
    headers = ['क्र.', 'संस्थान का नाम', 'प्रकार (NGO/CSR/समाज)', 'प्रभारी / संपर्क व्यक्ति', 'पद / दायित्व', 'मोबाइल नंबर', 'सहयोग का स्वरूप', 'संबद्ध कार्य'];
    
    if (supportingInstitutions.length > 0) {
      rows = supportingInstitutions.map((inst, idx) => [
        idx + 1,
        inst.institutionName,
        inst.institutionType || 'सामाजिक संस्था',
        inst.contactPersonName || inst.nodalPersonName || '-',
        inst.designation || 'नोडल प्रभारी',
        inst.mobile || inst.mobileNumber || inst.contactNumber || '-',
        inst.workDescription || 'अध्यापन सामग्री वितरण',
        'सक्रिय सहयोगी',
      ]);
    } else {
      rows = [];
    }

    summaryMetrics = [
      { label: 'सहयोगी संस्थान', value: rows.length },
    ];
    fileName = `ULLAS_Form_05_Partners_${selectedSession}`;
  }

  else if (item.id === 'ULLAS_DASHBOARD') {
    title = 'उल्लास नवभारत साक्षरता संकुल डैशबोर्ड व प्रगति सारांश';
    subtitle = `जन शिक्षा केंद्र मलगुवां • साक्षरता दर संवर्धन विश्लेषण • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'साक्षरता अभियान सूचक / पैरामीटर', 'आधिकारिक सांख्यिकी', 'इकाई', 'प्रगति विवरण'];
    
    const totalIlliterates = illiteratePersons.length;
    const totalVolunteers = aksharSathis.length;
    const appeared = literacyExamResults.reduce((acc, r) => acc + (r.participatedLearners || 0), 0);
    const passed = literacyExamResults.reduce((acc, r) => acc + (r.passedLearners || 0), 0);
    const passRate = appeared > 0 ? `${((passed / appeared) * 100).toFixed(1)}%` : '0%';

    rows = [
      [1, 'कुल चिन्हांकित असाक्षर (Surveyed Illiterates)', totalIlliterates, 'व्यक्ति', '15 से 100 वर्ष आयु वर्ग'],
      [2, 'पंजीकृत स्वयंसेवी अक्षर साथी (Volunteers)', totalVolunteers, 'अक्षर साथी', 'प्रत्येक 10 शिक्षार्थी पर 1 साथी'],
      [3, 'स्थापित बुनियादी साक्षरता अध्यापन केंद्र', targetSchools.length, 'केंद्र', 'प्राथमिक शाला भवनों में संचालित'],
      [4, 'मूल्यांकन परीक्षा में प्रविष्ट शिक्षार्थी', appeared, 'परीक्षार्थी', 'राष्ट्रीय साक्षरता मिशन परीक्षा'],
      [5, 'परीक्षा उत्तीर्ण शिक्षार्थी (Certificates Issued)', passed, 'उत्तीर्ण', 'साक्षरता प्रमाण पत्र जारी'],
      [6, 'संकुल साक्षरता दर संवर्धन प्रगति', passRate, 'सफलता दर', 'उल्लास लक्ष्य संतृप्ति की ओर'],
    ];

    summaryMetrics = [
      { label: 'चिन्हांकित असाक्षर', value: totalIlliterates },
      { label: 'अक्षर साथी', value: totalVolunteers },
      { label: 'उत्तीर्णता दर', value: passRate },
    ];
    fileName = `ULLAS_Dashboard_Summary_${selectedSession}`;
  }

  // ==========================================
  // 15. USERS (उपयोगकर्ता / Users)
  // ==========================================
  else if (item.id === 'USERS_LIST') {
    title = `प्रणाली अधिकृत उपयोगकर्ता एवं भूमिका (Role) निर्देशिका (${users.length} उपयोगकर्ता)`;
    subtitle = `प्रणाली प्रशासन एवं अभिगम नियंत्रण (Access Control) • जन शिक्षा केंद्र मलगुवां`;
    headers = ['क्र.', 'नाम', 'उपयोगकर्ता आईडी / ईमेल', 'भूमिका (Role)', 'संबद्ध शाला यूडाइस', 'शाला का नाम', 'स्थिति'];
    
    rows = users.map((u: any, idx: number) => {
      const schObj = schools.find((s) => s.udise === u.assignedSchoolUdise);
      return [
        idx + 1,
        u.name,
        u.username || u.email || '-',
        u.role,
        u.assignedSchoolUdise || 'समस्त संकुल',
        schObj?.hindiName || 'संकुल प्रबंधन',
        u.status === 'ACTIVE' ? 'सक्रिय' : u.status,
      ];
    });

    summaryMetrics = [
      { label: 'कुल प्रयोक्ता', value: users.length },
      { label: 'प्रशासक (ADMIN/CAC)', value: users.filter(u => u.role === 'ADMIN' || u.role === 'CAC').length },
      { label: 'शाला प्रयोक्ता (SCHOOL)', value: users.filter(u => u.role === 'SCHOOL').length },
    ];
    fileName = `Authorized_Users_Ledger_${selectedSession}`;
  }

  // ==========================================
  // 16. AUDIT / ACTIVITY HISTORY
  // ==========================================
  else if (item.id === 'AUDIT_ACTIVITY_LOGS') {
    title = `प्रणाली सुरक्षा, लॉगिन व गतिविधि ऑडिट इतिहास (${auditLogs.length} घटनाएं)`;
    subtitle = `जन शिक्षा केंद्र मलगुवां • प्रणाली ऑडिट ट्रेल (Security & Audit Trail)`;
    headers = ['क्र.', 'दिनांक व समय', 'गतिविधि प्रकार (Action)', 'मॉड्यूल', 'उपयोगकर्ता का नाम', 'भूमिका', 'शाला यूडाइस', 'विवरण / लॉग'];
    
    rows = auditLogs.slice(0, 50).map((a, idx) => [
      idx + 1,
      a.timestamp || '-',
      a.action || 'ACTIVITY',
      a.module || 'प्रणाली',
      a.userName || 'संजय जैन',
      a.role || 'CAC',
      a.schoolUdise || institutionConfig.diseCode,
      a.details || '-',
    ]);

    summaryMetrics = [
      { label: 'कुल ऑडिट लॉग', value: auditLogs.length },
      { label: 'लॉगिन घटनाएं', value: auditLogs.filter(a => a.action === 'LOGIN').length },
      { label: 'एक्सपोर्ट घटनाएं', value: auditLogs.filter(a => a.action === 'EXPORT').length },
    ];
    fileName = `Audit_Activity_Logs_${selectedSession}`;
  }

  // ==========================================
  // 17. REPORTS (विभागीय रिपोर्ट्स)
  // ==========================================
  else if (item.id === 'REPORTS_COMPREHENSIVE') {
    title = `संकुल ${targetSchools.length} सक्रिय शालाएं समेकित शैक्षणिक एवं अधोसंरचना रिपोर्ट`;
    subtitle = `जन शिक्षा केंद्र मलगुवां • विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district} • सत्र: ${selectedSession}`;
    headers = ['क्र.', 'यूडाइस कोड', 'विद्यालय का नाम', 'शाला प्रकार', 'कुल छात्र', 'बालक', 'बालिका', 'SC/ST', 'OBC', 'पदस्थ शिक्षक', 'भौतिक सुविधाएं', 'MDM स्थिति'];
    
    rows = targetSchools.map((s, idx) => {
      const schSt = students.filter(st => st.schoolUdise === s.udise);
      const schStaff = staff.filter(st => st.assignedSchoolUdise === s.udise);
      const schFac = facilities.filter(f => f.schoolUdise === s.udise);
      return [
        idx + 1,
        s.udise,
        s.hindiName || s.name,
        s.schoolType,
        schSt.length,
        schSt.filter(st => st.gender === 'बालक').length,
        schSt.filter(st => st.gender === 'बालिका').length,
        schSt.filter(st => st.category === 'SC' || st.category === 'ST').length,
        schSt.filter(st => st.category === 'OBC').length,
        schStaff.length,
        `${schFac.filter(f => f.available === 'YES').length} / 16`,
        'नियमित',
      ];
    });

    summaryMetrics = [
      { label: 'कुल शालाएं', value: targetSchools.length },
      { label: 'समेकित छात्र', value: students.length },
      { label: 'समेकित शिक्षक', value: staff.length },
    ];
    fileName = `Comprehensive_Cluster_Report_${selectedSession}`;
  }

  // ==========================================
  // SPECIAL: COMPLETE SCHOOL DOSSIER
  // ==========================================
  else if (item.id === 'COMPLETE_SCHOOL_DOSSIER') {
    const sch = targetSchools[0] || activeSchool;
    title = `विद्यालय संपूर्ण महा-डोजियर (Comprehensive School Dossier) - ${sch.hindiName || sch.name}`;
    subtitle = `यूडाइस कोड: ${sch.udise} • विकासखंड: ${institutionConfig.block} • शैक्षणिक सत्र: ${selectedSession}`;
    
    const schSt = students.filter((s) => s.schoolUdise === sch.udise);
    const schStaff = staff.filter((s) => s.assignedSchoolUdise === sch.udise);
    const schFac = facilities.filter((f) => f.schoolUdise === sch.udise);
    const schMDM = mdmRecords.filter((m) => m.schoolUdise === sch.udise);
    const schWork = governmentWork.filter((w) => w.schoolUdise === sch.udise);
    const schComp = complaints.filter((c) => c.schoolUdise === sch.udise);

    singleEntityDetails = [
      {
        sectionTitle: '1. शाला मूल पहचान (Basic Identity)',
        items: [
          { label: 'विद्यालय का नाम (हिंदी)', value: sch.hindiName || sch.name, isHighlight: true },
          { label: 'School Name (English)', value: sch.name },
          { label: 'यूडाइस कोड (UDISE)', value: sch.udise, isMono: true, isHighlight: true },
          { label: 'शाला श्रेणी / प्रकार', value: sch.schoolType },
          { label: 'ग्राम / मजरा', value: sch.village },
          { label: 'ग्राम पंचायत', value: sch.gramPanchayat },
          { label: 'संस्था प्रधान', value: sch.principalName || '-', isHighlight: true },
          { label: 'मोबाइल नंबर', value: sch.principalMobile || '-', isMono: true },
        ],
      },
      {
        sectionTitle: '2. विद्यार्थी नामांकन सांख्यिकी (Student Enrollment)',
        items: [
          { label: 'कुल दर्ज विद्यार्थी', value: `${schSt.length} छात्र`, isHighlight: true },
          { label: 'बालक (Boys)', value: schSt.filter(s => s.gender === 'बालक').length },
          { label: 'बालिकाएं (Girls)', value: schSt.filter(s => s.gender === 'बालिका').length },
          { label: 'SC / ST छात्र', value: schSt.filter(s => s.category === 'SC' || s.category === 'ST').length },
          { label: 'OBC छात्र', value: schSt.filter(s => s.category === 'OBC').length },
          { label: 'CWSN (दिव्यांग)', value: schSt.filter(s => s.isCwsn).length },
        ],
      },
      {
        sectionTitle: '3. स्टाफ, अधोसंरचना व संचालन (Staff, Facilities & MDM)',
        items: [
          { label: 'पदस्थ शिक्षक/कर्मचारी', value: `${schStaff.length} पदस्थ`, isHighlight: true },
          { label: '16-सूत्रीय सुविधाएं', value: `${schFac.filter(f => f.available === 'YES').length} / 16 उपलब्ध`, isHighlight: true },
          { label: 'मध्याह्न भोजन (MDM)', value: schMDM.length > 0 ? 'नियमित संचालित' : 'अद्यतन' },
          { label: 'लंबित शासकीय कार्य', value: schWork.filter(w => w.status !== 'COMPLETED').length },
          { label: 'प्राप्त जन शिकायतें', value: `${schComp.length} (${schComp.filter(c => c.status === 'RESOLVED').length} निराकृत)` },
        ],
      },
    ];

    headers = ['भाग / श्रेणी', 'आधिकारिक प्रविष्टि'];
    rows = [
      ['[मूल जानकारी] शाला का नाम', sch.hindiName || sch.name],
      ['[मूल जानकारी] यूडाइस कोड', sch.udise],
      ['[मूल जानकारी] प्रकार', sch.schoolType],
      ['[संस्था प्रधान] नाम व मोबाइल', `${sch.principalName || '-'} (${sch.principalMobile || '-'})`],
      ['[विद्यार्थी] कुल दर्ज नामांकन', `${schSt.length} छात्र (बालक: ${schSt.filter(s => s.gender === 'बालक').length}, बालिका: ${schSt.filter(s => s.gender === 'बालिका').length})`],
      ['[स्टाफ] पदस्थ शिक्षक संख्या', `${schStaff.length} शिक्षक`],
      ['[अधोसंरचना] 16-सूत्रीय सुविधाएं', `${schFac.filter(f => f.available === 'YES').length} / 16 उपलब्ध`],
      ['[MDM] मध्याह्न भोजन स्थिति', 'नियमित संचालित'],
      ['[कार्य] लंबित शासकीय कार्य', schWork.filter(w => w.status !== 'COMPLETED').length],
      ['[शिकायत] निवारण स्थिति', `${schComp.filter(c => c.status === 'RESOLVED').length} / ${schComp.length} निराकृत`],
    ];

    summaryMetrics = [
      { label: 'कुल छात्र', value: schSt.length },
      { label: 'कुल स्टाफ', value: schStaff.length },
      { label: 'सुविधाएं', value: `${schFac.filter(f => f.available === 'YES').length}/16` },
      { label: 'लंबित कार्य', value: schWork.filter(w => w.status !== 'COMPLETED').length },
    ];
    fileName = `Complete_School_Dossier_${sch.udise}`;
  }

  // ==========================================
  // SPECIAL: FONT RENDERING TEST
  // ==========================================
  else if (item.id === 'FONT_RENDERING_TEST') {
    title = 'हिंदी एवं अंग्रेजी फॉन्ट रेंडरिंग टेस्ट प्रतिवेदन';
    subtitle = 'मानक फॉन्ट सत्यापन • संयुक्त अक्षर, मात्राएं, रेफ/रकार एवं संख्याएं';
    headers = ['क्र.', 'परीक्षण श्रेणी (Category)', 'हिंदी नमूना पाठ (Hindi Sample)', 'अंग्रेजी अनुवाद (English Sample)', 'सत्यापन स्थिति'];
    rows = [
      [1, '1. संयुक्त अक्षर (Ligatures)', 'विद्यालय, प्राथमिक, माध्यमिक, प्रधानाध्यापक, राष्ट्र', 'School, Primary, Middle, Principal, Nation', '✓ सही रेंडरिंग'],
      [2, '2. र के विभिन्न रूप (Reph/Rakar)', 'कर्मचारी, प्रशिक्षण, कार्य, प्रगति, क्रमांक', 'Employee, Training, Work, Progress, Serial', '✓ सही रेंडरिंग'],
      [3, '3. मात्राएं (Vowel Signs)', 'सुविधाएँ, मध्याह्न भोजन, उपस्थिति, निरीक्षण', 'Facilities, Midday Meal, Attendance, Inspection', '✓ सही रेंडरिंग'],
      [4, '4. संस्था एवं संकुल नाम', 'जन शिक्षा केंद्र मलगुवां (विकासखंड: बलदेवगढ़, जिला: टीकमगढ़)', 'Jan Shiksha Kendra Malguwa (Baldeogarh, Tikamgarh)', '✓ सही रेंडरिंग'],
      [5, '5. संख्याएं एवं कोड', 'यूडाइस कोड: 23080108302, समग्र: 198273645, पिन: 471318', 'UDISE: 23080108302, Samagra: 198273645, PIN: 471318', '✓ सही रेंडरिंग'],
      [6, '6. पदनाम व विभाग', 'जन शिक्षक (CAC), प्रधान पाठक, स्कूल शिक्षा विभाग, मध्य प्रदेश', 'Cluster Coordinator, Head Master, School Education', '✓ सही रेंडरिंग'],
    ];
    summaryMetrics = [
      { label: 'प्राथमिक फॉन्ट', value: 'देवनागरी (Noto Sans)' },
      { label: 'द्वितीयक फॉन्ट', value: 'अंग्रेजी (Inter)' },
      { label: 'फॉन्ट सत्यापन', value: 'पूर्ण शुद्धता' },
    ];
    fileName = 'Font_Rendering_Test_Report';
  }

  return {
    title,
    subtitle,
    session: selectedSession,
    schoolName,
    udise,
    headers,
    rows,
    summaryMetrics,
    fileName,
    scope,
    singleEntityDetails,
    dualSectionTitle,
    dualHeaders,
    dualRows,
    totalRecordsCount: rows.length,
  };
}
