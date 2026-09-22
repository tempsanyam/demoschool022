import * as XLSX from 'xlsx';
import { institutionConfig } from '../config/institutionConfig';
import {
  School,
  Student,
  Staff,
  PhysicalFacility,
  AttendanceRecord,
  MDMRecord,
  GovernmentWork,
  Complaint,
  NotificationItem,
  DocumentItem
} from '../types';
import { sanitizeFileName, getTimestampStr } from './exportUtils';

export interface DossierDataPayload {
  school: School;
  students: Student[];
  staff: Staff[];
  facilities: PhysicalFacility[];
  attendance: AttendanceRecord[];
  mdmRecords: MDMRecord[];
  governmentWork: GovernmentWork[];
  complaints: Complaint[];
  notifications: NotificationItem[];
  documents: DocumentItem[];
  session?: string;
}

/**
 * Exports complete school dossier into a structured 10-sheet XLSX workbook
 */
export function exportDossierToExcel(data: DossierDataPayload): void {
  const {
    school,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    governmentWork,
    complaints,
    notifications,
    documents,
    session = '2026-27'
  } = data;

  const wb = XLSX.utils.book_new();
  const schoolName = school.name || school.hindiName || 'School';
  const udise = school.udise || 'N/A';

  const formatHeader = (sheetTitle: string) => [
    ['जन शिक्षा केंद्र / संकुल मलगुवां'],
    ['मलगुवां, विकासखंड: बलदेवगढ़, जिला: टीकमगढ़, मध्य प्रदेश'],
    ['विद्यालय संपूर्ण शासकीय डोजियर'],
    [`विद्यालय का नाम: ${schoolName}`, `यूडाइस कोड: ${udise}`, `सत्र: ${session}`, `दिनांक: ${new Date().toLocaleDateString('hi-IN')}`],
    [`अनुभाग: ${sheetTitle}`],
    []
  ];

  // Helper to auto-size columns
  const autoSizeColumns = (aoa: (string | number)[][]) => {
    const colWidths: number[] = [];
    aoa.forEach((row) => {
      row.forEach((cell, idx) => {
        const len = cell !== undefined && cell !== null ? String(cell).length : 0;
        colWidths[idx] = Math.max(colWidths[idx] || 10, Math.min(len + 4, 60));
      });
    });
    return colWidths.map((w) => ({ wch: Math.max(w, 14) }));
  };

  // ----------------------------------------------------
  // SHEET 1: विद्यालय जानकारी (School Basic Info)
  // ----------------------------------------------------
  const boys = students.filter((s) => s.gender === 'बालक').length;
  const girls = students.filter((s) => s.gender === 'बालिका').length;
  const sc = students.filter((s) => s.category === 'SC').length;
  const st = students.filter((s) => s.category === 'ST').length;
  const obc = students.filter((s) => s.category === 'OBC').length;
  const gen = students.filter((s) => s.category === 'GENERAL').length;
  const cwsn = students.filter((s) => s.isCwsn).length;

  const sheet1Data: (string | number)[][] = [
    ...formatHeader('अनुभाग 1 - विद्यालय की मूल जानकारी'),
    ['क्र.', 'विवरण / फील्ड', 'आधिकारिक मान / स्थिति'],
    [1, 'विद्यालय का नाम (हिंदी)', school.hindiName || school.name],
    [2, 'School Name (English)', school.name],
    [3, 'यूडाइस कोड (UDISE Code)', school.udise],
    [4, 'शाला प्रकार (School Type)', school.schoolType],
    [5, 'प्रबंधन विभाग', 'स्कूल शिक्षा विभाग, मध्य प्रदेश शासन'],
    [6, 'जन शिक्षा केंद्र / संकुल', `${institutionConfig.sankulName} (${institutionConfig.diseCode})`],
    [7, 'विकासखंड (Block)', school.block || institutionConfig.block],
    [8, 'जिला (District)', school.district || institutionConfig.district],
    [9, 'राज्य (State)', institutionConfig.state],
    [10, 'पिन कोड (PIN Code)', school.pin || institutionConfig.pinCode],
    [11, 'ग्राम / मजरा', school.village],
    [12, 'ग्राम पंचायत', school.gramPanchayat],
    [13, 'संस्था प्रधान / प्रभारी', school.principalName || '-'],
    [14, 'प्रधान का मोबाइल', school.principalMobile || '-'],
    [15, 'शाला ईमेल', school.email || '-'],
    [16, 'स्थापना वर्ष', String(school.establishmentYear || '1985')],
    [17, 'कुल कक्ष', school.totalRooms || '-'],
    [18, 'कक्षा कक्ष संख्या', school.totalClassrooms || '-'],
    [19, 'सक्रियता स्थिति', school.status === 'ACTIVE' ? 'सक्रिय (Active)' : 'निष्क्रिय'],
    [20, `सत्र ${session || '2026-27'} कुल नामांकन`, students.length],
    [21, 'बालक (Boys)', boys],
    [22, 'बालिकाएं (Girls)', girls],
    [23, 'अनुसूचित जाति (SC)', sc],
    [24, 'अनुसूचित जनजाति (ST)', st],
    [25, 'अन्य पिछड़ा वर्ग (OBC)', obc],
    [26, 'सामान्य वर्ग (General)', gen],
    [27, 'दिव्यांग छात्र (CWSN)', cwsn],
    [28, 'पदस्थ शिक्षक व कर्मचारी', staff.length]
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);
  ws1['!cols'] = autoSizeColumns(sheet1Data);
  XLSX.utils.book_append_sheet(wb, ws1, 'विद्यालय जानकारी');

  // ----------------------------------------------------
  // SHEET 2: विद्यार्थी (Students)
  // ----------------------------------------------------
  const sheet2Headers = ['क्र.', 'विद्यार्थी का नाम', 'समग्र आईडी / प्रवेश क्र.', 'पिता का नाम', 'कक्षा', 'लिंग', 'जन्मतिथि', 'श्रेणी', 'CWSN', 'मोबाइल', 'स्थिति'];
  const sheet2Rows = students.map((s, idx) => [
    idx + 1,
    s.name,
    s.samagraId || s.scholarNo || '-',
    s.fatherName || '-',
    `कक्षा ${s.class}`,
    s.gender,
    s.dob || '-',
    s.category,
    s.isCwsn ? `हाँ (${s.cwsnType || 'CWSN'})` : 'नहीं',
    s.mobile || '-',
    s.status === 'ACTIVE' ? 'सक्रिय अध्ययनरत' : s.status
  ]);
  const sheet2Data = [
    ...formatHeader('अनुभाग 2 - विद्यार्थी विवरण'),
    sheet2Headers,
    ...(sheet2Rows.length > 0 ? sheet2Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  ws2['!cols'] = autoSizeColumns(sheet2Data);
  XLSX.utils.book_append_sheet(wb, ws2, 'विद्यार्थी');

  // ----------------------------------------------------
  // SHEET 3: शिक्षक एवं कर्मचारी (Staff)
  // ----------------------------------------------------
  const sheet3Headers = ['क्र.', 'कर्मचारी कोड (Employee ID)', 'नाम', 'पद (Designation)', 'विषय / कार्य', 'मोबाइल', 'शैक्षणिक योग्यता', 'सेवा प्रकार', 'स्थिति'];
  const sheet3Rows = staff.map((st, idx) => [
    idx + 1,
    st.employeeId || st.employeeCode || '-',
    st.name,
    st.designation,
    st.subject || 'समस्त प्राथमिक विषय',
    st.mobile || '-',
    st.qualification || '-',
    st.employmentType || 'REGULAR',
    st.status === 'ACTIVE' ? 'कार्यरत (सक्रिय)' : st.status
  ]);
  const sheet3Data = [
    ...formatHeader('अनुभाग 3 - शिक्षक एवं कर्मचारी रोस्टर'),
    sheet3Headers,
    ...(sheet3Rows.length > 0 ? sheet3Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-', '-', '-']])
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(sheet3Data);
  ws3['!cols'] = autoSizeColumns(sheet3Data);
  XLSX.utils.book_append_sheet(wb, ws3, 'शिक्षक एवं कर्मचारी');

  // ----------------------------------------------------
  // SHEET 4: उपस्थिति (Attendance)
  // ----------------------------------------------------
  const sheet4Headers = ['क्र.', 'दिनांक', 'प्रकार', 'कक्षा', 'कुल दर्ज', 'उपस्थित', 'अनुपस्थित', 'अवकाश / छुट्टी', 'उपस्थिति %', 'दर्जकर्ता'];
  const sheet4Rows = attendance.map((a, idx) => {
    const pct = a.totalCount > 0 ? Math.round((a.presentCount / a.totalCount) * 100) : 0;
    return [
      idx + 1,
      a.date,
      a.type === 'STUDENT' ? 'विद्यार्थी' : a.type === 'TEACHER' ? 'शिक्षक' : a.type,
      a.class ? `कक्षा ${a.class}` : 'समस्त',
      a.totalCount,
      a.presentCount,
      a.absentCount,
      a.leaveCount || 0,
      `${pct}%`,
      a.markedBy || 'शाला प्रभारी'
    ];
  });
  const sheet4Data = [
    ...formatHeader('अनुभाग 4 - दैनिक उपस्थिति विवरण'),
    sheet4Headers,
    ...(sheet4Rows.length > 0 ? sheet4Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(sheet4Data);
  ws4['!cols'] = autoSizeColumns(sheet4Data);
  XLSX.utils.book_append_sheet(wb, ws4, 'उपस्थिति');

  // ----------------------------------------------------
  // SHEET 5: भौतिक सुविधाएं (Facilities)
  // ----------------------------------------------------
  const sheet5Headers = ['क्र.', 'भौतिक सुविधा का नाम', 'उपलब्धता', 'संख्या / क्षमता', 'स्थिति', 'उपयोग योग्य संख्या', 'मरम्मत आवश्यक संख्या', 'टिप्पणी'];
  const sheet5Rows = facilities.map((f, idx) => [
    idx + 1,
    f.facilityName,
    f.available === 'YES' ? 'उपलब्ध (हाँ)' : f.available === 'NO' ? 'अनुपलब्ध (नहीं)' : 'अपूर्ण',
    f.count || '-',
    f.condition || (f.available === 'YES' ? 'संतोषजनक' : 'अनुपलब्ध'),
    f.usableCount ?? (f.available === 'YES' ? (f.count || 1) : 0),
    f.repairRequiredCount ?? 0,
    f.remarks || f.requirementDetails || '-'
  ]);
  const sheet5Data = [
    ...formatHeader('अनुभाग 5 - 16-सूत्रीय भौतिक अधोसंरचना स्थिति'),
    sheet5Headers,
    ...(sheet5Rows.length > 0 ? sheet5Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-', '-']])
  ];
  const ws5 = XLSX.utils.aoa_to_sheet(sheet5Data);
  ws5['!cols'] = autoSizeColumns(sheet5Data);
  XLSX.utils.book_append_sheet(wb, ws5, 'भौतिक सुविधाएं');

  // ----------------------------------------------------
  // SHEET 6: MDM (Mid-Day Meal)
  // ----------------------------------------------------
  const sheet6Headers = ['क्र.', 'दिनांक', 'भोजन स्थिति', 'उपस्थित विद्यार्थी', 'भोजन प्राप्त विद्यार्थी', 'दैनिक मेनू', 'गेहूं स्टॉक (kg)', 'चावल स्टॉक (kg)', 'रसोई स्वच्छता', 'SHG समूह'];
  const sheet6Rows = mdmRecords.map((m, idx) => [
    idx + 1,
    m.date,
    m.mealsServed > 0 ? 'वितरित (सफल)' : 'अवितरित',
    m.presentStudents,
    m.mealsServed,
    m.menuItem || 'रोटी-सब्जी / दाल-चावल',
    m.wheatStockKg || 0,
    m.riceStockKg || 0,
    m.kitchenHygiene || 'संतोषजनक',
    m.shgName || 'माँ शारदा स्व सहायता समूह'
  ]);
  const sheet6Data = [
    ...formatHeader('अनुभाग 6 - मध्याह्न भोजन (MDM) वितरण रजिस्टर'),
    sheet6Headers,
    ...(sheet6Rows.length > 0 ? sheet6Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];
  const ws6 = XLSX.utils.aoa_to_sheet(sheet6Data);
  ws6['!cols'] = autoSizeColumns(sheet6Data);
  XLSX.utils.book_append_sheet(wb, ws6, 'MDM');

  // ----------------------------------------------------
  // SHEET 7: शासकीय कार्य (Government Work)
  // ----------------------------------------------------
  const sheet7Headers = ['क्र.', 'शासकीय कार्य का नाम', 'आदेश क्रमांक', 'विभाग', 'प्रारंभ दिनांक', 'नियत दिनांक', 'स्थिति', 'प्राथमिकता', 'जिम्मेदार व्यक्ति', 'पूर्णता दिनांक', 'टिप्पणी'];
  const sheet7Rows = governmentWork.map((w, idx) => {
    const statusText = w.status === 'COMPLETED' ? 'पूर्ण' : w.status === 'IN_PROGRESS' ? 'प्रगतिरत' : w.status === 'OVERDUE' ? 'अतिदेय' : 'लंबित';
    const priorityText = w.priority === 'HIGH' ? 'उच्च' : w.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य';
    return [
      idx + 1,
      w.workName,
      w.orderNumber || '-',
      'स्कूल शिक्षा विभाग',
      w.assignedDate || '-',
      w.dueDate || '-',
      statusText,
      priorityText,
      w.responsiblePerson || school.principalName || '-',
      w.completionDate || '-',
      w.remarks || '-'
    ];
  });
  const sheet7Data = [
    ...formatHeader('अनुभाग 7 - समयबद्ध शासकीय कार्य रजिस्टर'),
    sheet7Headers,
    ...(sheet7Rows.length > 0 ? sheet7Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];
  const ws7 = XLSX.utils.aoa_to_sheet(sheet7Data);
  ws7['!cols'] = autoSizeColumns(sheet7Data);
  XLSX.utils.book_append_sheet(wb, ws7, 'शासकीय कार्य');

  // ----------------------------------------------------
  // SHEET 8: शिकायतें (Complaints)
  // ----------------------------------------------------
  const sheet8Headers = [
    'क्र.',
    'शिकायत क्रमांक',
    'शिकायत विषय / शीर्षक',
    'श्रेणी',
    'प्राथमिकता',
    'मूल पंजीयन दिनांक',
    'वर्तमान स्थिति',
    'समाधान / की गई कार्यवाही',
    'निराकरण दिनांक व कर्ता',
    'बंद दिनांक व कर्ता',
    'पुनः खोलने का विवरण',
    'कार्यवाही इतिहास संक्षेप'
  ];
  const sheet8Rows = complaints.map((c, idx) => {
    let statusText = 'नई शिकायत (OPEN)';
    if (c.status === 'RESOLVED') statusText = 'समाधान किया गया (RESOLVED)';
    else if (c.status === 'CLOSED') statusText = 'बंद (CLOSED)';
    else if (c.status === 'REOPENED' || (c.status as string) === 'RE_OPENED') statusText = 'पुनः खोली गई (RE-OPENED)';
    else if (c.status === 'IN_PROGRESS') statusText = 'कार्यवाही में (IN_PROGRESS)';
    else if (c.status === 'REJECTED') statusText = 'निरस्त (REJECTED)';

    const priorityText = c.priority === 'HIGH' ? 'उच्च (High)' : c.priority === 'MEDIUM' ? 'मध्यम (Medium)' : 'सामान्य (Low)';
    const resolutionDetails = c.resolutionDate
      ? `${c.resolutionDate} ${c.resolvedByName ? `(${c.resolvedByName}${c.resolverRole ? ` - ${c.resolverRole}` : ''})` : ''}`
      : '-';
    const closeDetails = c.closeDate
      ? `${c.closeDate} ${c.closedByName ? `(${c.closedByName}${c.closerRole ? ` - ${c.closerRole}` : ''})` : ''}`
      : '-';
    const reopenDetails = c.reopenedDate
      ? `${c.reopenedDate}${c.reopenReason ? `: ${c.reopenReason}` : ''} ${c.reopenedBy ? `(${c.reopenedBy})` : ''}`
      : '-';
    const historySummary = Array.isArray(c.complaintHistory) && c.complaintHistory.length > 0
      ? c.complaintHistory.map((h, i) => `${i + 1}. [${h.action}] ${h.date || h.timestamp || ''} (${h.userName || h.userId || 'उपयोगकर्ता'}${h.userRole ? ` - ${h.userRole}` : ''}): ${h.remark || h.reason || h.newStatus || ''}`).join(' | ')
      : '-';

    return [
      idx + 1,
      c.complaintId || c.id,
      c.subject || c.title || '-',
      c.category || '-',
      priorityText,
      c.complaintDate || c.date || c.createdAt || '-',
      statusText,
      c.actionTaken || c.resolutionNotes || c.description || '-',
      resolutionDetails,
      closeDetails,
      reopenDetails,
      historySummary
    ];
  });
  const sheet8Data = [
    ...formatHeader('अनुभाग 8 - जन शिकायत एवं समस्या निवारण पंजी (Grievance Lifecycle Register)'),
    sheet8Headers,
    ...(sheet8Rows.length > 0 ? sheet8Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-', '-', '-', '-', '-', '-']])
  ];
  const ws8 = XLSX.utils.aoa_to_sheet(sheet8Data);
  ws8['!cols'] = autoSizeColumns(sheet8Data);
  XLSX.utils.book_append_sheet(wb, ws8, 'शिकायतें');

  // ----------------------------------------------------
  // SHEET 9: सूचनाएं (Notifications)
  // ----------------------------------------------------
  const sheet9Headers = ['क्र.', 'सूचना / आदेश शीर्षक', 'आदेश क्रमांक', 'दिनांक', 'प्राथमिकता', 'जारीकर्ता', 'विवरण'];
  const sheet9Rows = notifications.map((n, idx) => [
    idx + 1,
    n.title,
    n.orderNumber || '-',
    n.date,
    n.priority === 'HIGH' ? 'उच्च' : n.priority === 'MEDIUM' ? 'मध्यम' : 'सामान्य',
    n.publishedByName || 'संकुल समन्वयक मलगुवां',
    n.message || '-'
  ]);
  const sheet9Data = [
    ...formatHeader('अनुभाग 9 - शासकीय सूचनाएं व परिपत्र'),
    sheet9Headers,
    ...(sheet9Rows.length > 0 ? sheet9Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-']])
  ];
  const ws9 = XLSX.utils.aoa_to_sheet(sheet9Data);
  ws9['!cols'] = autoSizeColumns(sheet9Data);
  XLSX.utils.book_append_sheet(wb, ws9, 'सूचनाएं');

  // ----------------------------------------------------
  // SHEET 10: दस्तावेज (Documents)
  // ----------------------------------------------------
  const sheet10Headers = ['क्र.', 'दस्तावेज का नाम', 'श्रेणी', 'दस्तावेज क्रमांक', 'अपलोड दिनांक', 'फाइल प्रकार', 'विवरण'];
  const sheet10Rows = documents.map((d, idx) => [
    idx + 1,
    d.title,
    d.category,
    d.documentNumber || '-',
    d.date,
    d.fileType || 'PDF',
    d.description || '-'
  ]);
  const sheet10Data = [
    ...formatHeader('अनुभाग 10 - विद्यालयीन दस्तावेज एवं पंजी संचिका'),
    sheet10Headers,
    ...(sheet10Rows.length > 0 ? sheet10Rows : [['-', 'इस अनुभाग में वर्तमान में कोई डेटा उपलब्ध नहीं है।', '-', '-', '-', '-', '-']])
  ];
  const ws10 = XLSX.utils.aoa_to_sheet(sheet10Data);
  ws10['!cols'] = autoSizeColumns(sheet10Data);
  XLSX.utils.book_append_sheet(wb, ws10, 'दस्तावेज');

  // Write and download workbook
  const safeSchoolName = sanitizeFileName(schoolName.replace(/\s+/g, '-'));
  const safeFileName = `${safeSchoolName}-UDISE-${udise}-Dossier-${session.replace('/', '-')}`;
  XLSX.writeFile(wb, `${safeFileName}_${getTimestampStr()}.xlsx`);
}
