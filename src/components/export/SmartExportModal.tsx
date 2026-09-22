import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
  FileDown,
  Download,
  Building2,
  Users,
  GraduationCap,
  Utensils,
  ClipboardList,
  AlertTriangle,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Maximize2,
  Settings,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  RotateCcw,
  Check
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { institutionConfig } from '../../config/institutionConfig';
import {
  exportToExcel,
  exportToUnicodePDF,
  generateUnicodePDFFromElement,
  triggerSystemPrint,
  ExportDataPayload,
  ExportOptions
} from '../../utils/exportUtils';
import { printElement } from '../../utils/printUtils';
import { exportDossierToExcel } from '../../utils/dossierExportUtils';
import { School, Student, Staff } from '../../types';
import { SmartExportDocument } from './SmartExportDocument';
import { PrintStyleToggle } from './PrintStyleToggle';
import {
  DocumentStyle,
  getDocumentStyle,
  setDocumentStyle,
} from '../../utils/documentStyle';

export interface SmartExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string;
  initialUdise?: string;
  initialStudentId?: string;
  initialTeacherId?: string;
}

export const SmartExportModal: React.FC<SmartExportModalProps> = ({
  isOpen,
  onClose,
  initialType = 'SCHOOL',
  initialUdise,
  initialStudentId,
  initialTeacherId,
}) => {
  const { currentUser } = useAuth();
  const {
    schools,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    governmentWork,
    complaints,
    logActivity,
    academicSessions,
    selectedSessionId,
  } = useData();

  const previewRef = useRef<HTMLDivElement>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const isSchoolRestricted = currentUser?.role === 'SCHOOL';

  const defaultUdise = isSchoolRestricted
    ? (currentUser?.assignedSchoolUdise || schools[0]?.udise || '23080108302')
    : (initialUdise || 'ALL');

  const [dataType, setDataType] = useState<string>(initialType);
  const [selectedUdise, setSelectedUdise] = useState<string>(defaultUdise);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || 'ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId || 'ALL');
  const [activeSession, setActiveSession] = useState<string>(selectedSessionId || '2026-27');
  const [docStyle, setDocStyle] = useState<DocumentStyle>(() => getDocumentStyle());

  useEffect(() => {
    const handleStyleChange = (e: CustomEvent<{ style: DocumentStyle }> | Event) => {
      const customEvent = e as CustomEvent<{ style: DocumentStyle }>;
      if (customEvent?.detail?.style) {
        setDocStyle(customEvent.detail.style);
      }
    };
    window.addEventListener('jsk-document-style-changed', handleStyleChange as EventListener);
    return () => {
      window.removeEventListener('jsk-document-style-changed', handleStyleChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (selectedSessionId) {
      setActiveSession(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Document formatting options
  const [options, setOptions] = useState<ExportOptions>({
    includeHeader: true,
    includeSchoolIdentity: true,
    includePageNumber: true,
    includeSignature: false,
    includeFooter: false,
  });

  const effectiveUdise = isSchoolRestricted
    ? (currentUser?.assignedSchoolUdise || '')
    : selectedUdise;

  const activeSchool = useMemo(() => {
    if (!isSchoolRestricted && effectiveUdise === 'ALL') {
      return schools[0];
    }
    return schools.find((s) => s.udise === effectiveUdise) || schools[0];
  }, [schools, effectiveUdise, isSchoolRestricted]);

  const schoolStudents = useMemo(() => {
    if (isSchoolRestricted) {
      return students.filter((s) => s.schoolUdise === effectiveUdise);
    }
    return effectiveUdise === 'ALL' ? students : students.filter((s) => s.schoolUdise === effectiveUdise);
  }, [students, effectiveUdise, isSchoolRestricted]);

  const schoolStaff = useMemo(() => {
    if (isSchoolRestricted) {
      return staff.filter((s) => s.assignedSchoolUdise === effectiveUdise);
    }
    return effectiveUdise === 'ALL' ? staff : staff.filter((s) => s.assignedSchoolUdise === effectiveUdise);
  }, [staff, effectiveUdise, isSchoolRestricted]);

  const schoolFacilities = useMemo(() => {
    if (isSchoolRestricted) {
      return facilities.filter((f) => f.schoolUdise === effectiveUdise);
    }
    return effectiveUdise === 'ALL' ? facilities : facilities.filter((f) => f.schoolUdise === effectiveUdise);
  }, [facilities, effectiveUdise, isSchoolRestricted]);

  const schoolAttendance = useMemo(() => {
    if (isSchoolRestricted) {
      return attendance.filter((a) => a.schoolUdise === effectiveUdise);
    }
    return effectiveUdise === 'ALL' ? attendance : attendance.filter((a) => a.schoolUdise === effectiveUdise);
  }, [attendance, effectiveUdise, isSchoolRestricted]);

  const schoolMDM = useMemo(() => {
    if (isSchoolRestricted) {
      return mdmRecords.filter((m) => m.schoolUdise === effectiveUdise);
    }
    return effectiveUdise === 'ALL' ? mdmRecords : mdmRecords.filter((m) => m.schoolUdise === effectiveUdise);
  }, [mdmRecords, effectiveUdise, isSchoolRestricted]);

  const schoolWork = useMemo(() => {
    if (isSchoolRestricted) {
      return governmentWork.filter((w) => w.schoolUdise === effectiveUdise);
    }
    return effectiveUdise === 'ALL' ? governmentWork : governmentWork.filter((w) => w.schoolUdise === effectiveUdise);
  }, [governmentWork, effectiveUdise, isSchoolRestricted]);

  const schoolComplaints = useMemo(() => {
    if (isSchoolRestricted) {
      return complaints.filter((c) => c.schoolUdise === effectiveUdise);
    }
    return effectiveUdise === 'ALL' ? complaints : complaints.filter((c) => c.schoolUdise === effectiveUdise);
  }, [complaints, effectiveUdise, isSchoolRestricted]);

  // Compute Current Dataset Based on dataType & Filters
  const dataset = useMemo(() => {
    let title = 'शासकीय प्रतिवेदन';
    let subtitle = `जन शिक्षा केंद्र / संकुल मलगुवां | सत्र ${activeSession}`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let summaryMetrics: { label: string; value: string | number }[] = [];
    let fileName = `Report_${dataType}_${effectiveUdise}`;

    if (dataType === 'SCHOOL' || dataType === 'ALL_SCHOOLS') {
      const isAll = !isSchoolRestricted && effectiveUdise === 'ALL';
      title = isAll
        ? 'संकुल अंतर्गत समस्त सक्रिय विद्यालयों की मास्टर निर्देशिका'
        : `विद्यालय मास्टर विवरण - ${activeSchool?.name || activeSchool?.hindiName}`;
      headers = ['क्र.', 'यूडाइस कोड', 'विद्यालय का नाम', 'श्रेणी/प्रकार', 'ग्राम', 'ग्राम पंचायत', 'संस्था प्रधान', 'मोबाइल', 'स्थिति'];
      const targetSchools = isAll ? schools : schools.filter((s) => s.udise === effectiveUdise);
      rows = targetSchools.map((s, idx) => [
        idx + 1,
        s.udise,
        s.name || s.hindiName,
        s.schoolType,
        s.village,
        s.gramPanchayat,
        s.principalName || '-',
        s.principalMobile || '-',
        s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ]);
      summaryMetrics = [
        { label: 'कुल विद्यालय', value: targetSchools.length },
        { label: 'प्राथमिक', value: targetSchools.filter((s) => s.schoolType.includes('प्राथमिक')).length },
        { label: 'माध्यमिक', value: targetSchools.filter((s) => s.schoolType.includes('माध्यमिक')).length },
        { label: 'सक्रिय', value: targetSchools.filter((s) => s.status === 'ACTIVE').length },
      ];
      fileName = `Schools_Directory_${effectiveUdise}`;
    } else if (dataType === 'STUDENT' || dataType === 'STUDENTS') {
      let filtered = schoolStudents;
      if (selectedClass !== 'ALL') filtered = filtered.filter((s) => s.class === selectedClass);
      if (selectedGender !== 'ALL') filtered = filtered.filter((s) => s.gender === selectedGender);
      if (selectedStudentId !== 'ALL') filtered = filtered.filter((s) => s.id === selectedStudentId || s.samagraId === selectedStudentId);

      title = `विद्यार्थी नामांकन एवं रोस्टर सूची (${effectiveUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
      headers = ['क्र.', 'समग्र आईडी', 'विद्यार्थी का नाम', 'पिता का नाम', 'माता का नाम', 'कक्षा', 'लिंग', 'जाति वर्ग', 'CWSN', 'मोबाइल'];
      rows = filtered.map((st, idx) => [
        idx + 1,
        st.samagraId,
        st.name,
        st.fatherName,
        st.motherName || '-',
        `कक्षा ${st.class}`,
        st.gender,
        st.category,
        st.isCwsn ? 'हाँ' : 'नहीं',
        st.mobile || '-'
      ]);
      summaryMetrics = [
        { label: 'कुल विद्यार्थी', value: filtered.length },
        { label: 'बालक', value: filtered.filter((s) => s.gender === 'बालक').length },
        { label: 'बालिका', value: filtered.filter((s) => s.gender === 'बालिका').length },
        { label: 'CWSN विशेष', value: filtered.filter((s) => s.isCwsn).length },
      ];
      fileName = `Students_List_${effectiveUdise}`;
    } else if (dataType === 'TEACHER' || dataType === 'STAFF') {
      let filtered = schoolStaff;
      if (selectedTeacherId !== 'ALL') filtered = filtered.filter((t) => t.id === selectedTeacherId || t.employeeId === selectedTeacherId);

      title = `शिक्षक एवं स्टाफ पदस्थापना सूची (${effectiveUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
      headers = ['क्र.', 'कर्मचारी कोड', 'नाम', 'पदनाम', 'मुख्य विषय', 'पदस्थ शाला', 'मोबाइल', 'शैक्षणिक योग्यता', 'स्थिति'];
      rows = filtered.map((t, idx) => {
        const sch = schools.find((s) => s.udise === t.assignedSchoolUdise);
        return [
          idx + 1,
          t.employeeId || t.employeeCode || '-',
          t.name,
          t.designation,
          t.subject || 'समस्त प्राथमिक',
          sch?.name || sch?.hindiName || t.assignedSchoolUdise,
          t.mobile,
          t.qualification || '-',
          t.status === 'ACTIVE' ? 'सक्रिय' : t.status
        ];
      });
      summaryMetrics = [
        { label: 'कुल शिक्षक/स्टाफ', value: filtered.length },
        { label: 'नियमित', value: filtered.filter((t) => t.employmentType === 'REGULAR').length },
        { label: 'अतिथि / अन्य', value: filtered.filter((t) => t.employmentType !== 'REGULAR').length },
      ];
      fileName = `Staff_List_${effectiveUdise}`;
    } else if (dataType === 'ATTENDANCE') {
      title = `दैनिक एवं मासिक उपस्थिति रजिस्टर (${effectiveUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
      headers = ['क्र.', 'दिनांक', 'शाला का नाम', 'उपस्थिति प्रकार', 'कक्षा', 'कुल दर्ज', 'उपस्थित', 'अनुपस्थित', 'उपस्थिति %'];
      rows = schoolAttendance.map((a, idx) => {
        const sch = schools.find((s) => s.udise === a.schoolUdise);
        const pct = a.totalCount > 0 ? Math.round((a.presentCount / a.totalCount) * 100) : 0;
        return [
          idx + 1,
          a.date,
          sch?.name || sch?.hindiName || a.schoolUdise,
          a.type === 'STUDENT' ? 'विद्यार्थी' : 'शिक्षक',
          a.class ? `कक्षा ${a.class}` : 'समस्त',
          a.totalCount,
          a.presentCount,
          a.absentCount,
          `${pct}%`
        ];
      });
      summaryMetrics = [
        { label: 'कुल रिकॉर्ड्स', value: schoolAttendance.length },
        { label: 'औसत उपस्थिति', value: `${Math.round(schoolAttendance.reduce((acc, a) => acc + (a.totalCount ? (a.presentCount / a.totalCount) * 100 : 0), 0) / (schoolAttendance.length || 1))}%` }
      ];
      fileName = `Attendance_${effectiveUdise}`;
    } else if (dataType === 'MDM') {
      title = `मध्याह्न भोजन (MDM) वितरण अभिलेख (${effectiveUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
      headers = ['क्र.', 'दिनांक', 'शाला का नाम', 'दैनिक मीनू', 'पात्र छात्र', 'लाभान्वित छात्र', 'रसोई स्वच्छता', 'गेहूं स्टॉक (kg)', 'चावल स्टॉक (kg)'];
      rows = schoolMDM.map((m, idx) => {
        const sch = schools.find((s) => s.udise === m.schoolUdise);
        return [
          idx + 1,
          m.date,
          sch?.name || sch?.hindiName || m.schoolUdise,
          m.menuItem || '-',
          m.eligibleStudents,
          m.mealsServed,
          m.kitchenHygiene,
          m.wheatStockKg || 0,
          m.riceStockKg || 0
        ];
      });
      summaryMetrics = [
        { label: 'कुल प्रविष्टियां', value: schoolMDM.length },
        { label: 'औसत लाभान्वित', value: Math.round(schoolMDM.reduce((sum, m) => sum + (m.mealsServed || 0), 0) / (schoolMDM.length || 1)) },
      ];
      fileName = `MDM_Report_${effectiveUdise}`;
    } else if (dataType === 'FACILITIES') {
      title = `16-सूत्रीय भौतिक अधोसंरचना प्रपत्र (${effectiveUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
      headers = ['क्र.', 'शाला का नाम', 'सुविधा का नाम', 'उपलब्धता', 'भौतिक स्थिति', 'सत्यापन टिप्पणी'];
      rows = schoolFacilities.map((f, idx) => {
        const sch = schools.find((s) => s.udise === f.schoolUdise);
        return [
          idx + 1,
          sch?.name || sch?.hindiName || f.schoolUdise,
          f.facilityName,
          f.available === 'YES' ? 'उपलब्ध' : 'अनुपलब्ध',
          f.condition || 'संतोषजनक',
          f.remarks || '-'
        ];
      });
      summaryMetrics = [
        { label: 'कुल पैरामीटर्स', value: schoolFacilities.length },
        { label: 'उपलब्ध सुविधाएं', value: schoolFacilities.filter((f) => f.available === 'YES').length },
      ];
      fileName = `Facilities_${effectiveUdise}`;
    } else if (dataType === 'COMPLETE_SCHOOL') {
      title = `विद्यालय संपूर्ण महा-डोजियर (Complete Dossier) - ${activeSchool?.name || activeSchool?.hindiName || 'शाला'}`;
      headers = ['श्रेणी/पैरामीटर', 'आधिकारिक प्रविष्टि'];
      rows = [
        ['शाला का नाम', activeSchool?.name || activeSchool?.hindiName || '-'],
        ['यूडाइस कोड', activeSchool?.udise || '-'],
        ['शाला प्रकार', activeSchool?.schoolType || '-'],
        ['ग्राम / मजरा', activeSchool?.village || '-'],
        ['ग्राम पंचायत', activeSchool?.gramPanchayat || '-'],
        ['संस्था प्रधान', activeSchool?.principalName || '-'],
        ['प्रधान मोबाइल', activeSchool?.principalMobile || '-'],
        ['कुल दर्ज विद्यार्थी', schoolStudents.length],
        ['कुल पदस्थ शिक्षक/स्टाफ', schoolStaff.length],
        ['भौतिक सुविधाएं (उपलब्ध/16)', `${schoolFacilities.filter((f) => f.available === 'YES').length} / 16`],
        ['लंबित शासकीय कार्य', schoolWork.filter((w) => w.status !== 'COMPLETED').length],
        ['कुल प्राप्त शिकायतें', schoolComplaints.length]
      ];
      summaryMetrics = [
        { label: 'कुल विद्यार्थी', value: schoolStudents.length },
        { label: 'कुल स्टाफ', value: schoolStaff.length },
        { label: 'उपलब्ध सुविधाएं', value: `${schoolFacilities.filter((f) => f.available === 'YES').length}/16` }
      ];
      fileName = `Complete_School_${effectiveUdise}`;
    }

    return {
      title,
      subtitle,
      headers,
      rows,
      summaryMetrics,
      fileName,
    };
  }, [dataType, effectiveUdise, activeSession, selectedClass, selectedGender, selectedStudentId, selectedTeacherId, schools, schoolStudents, schoolStaff, schoolFacilities, schoolAttendance, schoolMDM, schoolWork, schoolComplaints, activeSchool]);

  // Dynamic Page Count Estimation based on data density and orientation
  const estimatedPages = useMemo(() => {
    if (dataType === 'COMPLETE_SCHOOL') {
      return orientation === 'landscape' ? 4 : 3;
    }
    const rowCount = dataset.rows.length;
    const rowsPerPage = orientation === 'landscape' ? 16 : 24;
    return Math.max(1, Math.ceil(rowCount / rowsPerPage));
  }, [dataType, dataset.rows.length, orientation]);

  const showFeedback = (msg: string, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setTimeout(() => setErrorMessage(null), 4000);
    } else {
      setStatusMessage(msg);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setStatusMessage('प्रिंटर डायलॉग खोला जा रहा है...');
    try {
      logActivity('EXPORT', 'SmartExport', `प्रिंट रिपोर्ट: ${dataset.title}`, {
        schoolUdise: effectiveUdise,
      });
      if (previewRef.current) {
        printElement(previewRef.current, {
          title: dataset.title,
          orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
          documentStyle: docStyle,
        });
      } else {
        triggerSystemPrint(orientation, docStyle);
      }
    } catch (err) {
      console.error('Print Error:', err);
      showFeedback('प्रिंट में त्रुटि हुई।', true);
    } finally {
      setTimeout(() => {
        setIsPrinting(false);
        setStatusMessage(null);
      }, 2000);
    }
  };

  const handlePDF = async () => {
    logActivity('EXPORT', 'SmartExport', `PDF डाउनलोड: ${dataset.title}`, {
      schoolUdise: effectiveUdise,
    });
    setIsPdfGenerating(true);
    setErrorMessage(null);
    setStatusMessage('PDF तैयार किया जा रहा है...');

    const payload: ExportDataPayload = {
      title: dataset.title,
      subtitle: dataset.subtitle,
      session: activeSession,
      schoolName: effectiveUdise !== 'ALL' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
      udise: effectiveUdise !== 'ALL' ? effectiveUdise : undefined,
      generatedBy: currentUser?.name || 'संजय जैन',
      userRole: currentUser?.role || 'CAC',
      orientation,
      summaryMetrics: dataset.summaryMetrics,
      headers: dataset.headers,
      rows: dataset.rows,
      fileName: dataset.fileName,
      options,
    };

    try {
      if (previewRef.current) {
        try {
          await generateUnicodePDFFromElement(
            previewRef.current,
            dataset.fileName,
            orientation,
            options,
            docStyle
          );
        } catch (domErr) {
          console.warn('DOM PDF generation error, trying payload fallback:', domErr);
          await exportToUnicodePDF(payload);
        }
      } else {
        await exportToUnicodePDF(payload);
      }
      showFeedback('PDF सफलतापूर्वक डाउनलोड हो गया!');
    } catch (err) {
      console.error('Smart Export PDF Error:', err);
      showFeedback('PDF तैयार नहीं हो सका। कृपया पुनः प्रयास करें।', true);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleExcel = () => {
    setIsExportingExcel(true);
    try {
      logActivity('EXPORT', 'SmartExport', `Excel डाउनलोड: ${dataset.title}`, {
        schoolUdise: effectiveUdise,
      });

      if (dataType === 'COMPLETE_SCHOOL' && activeSchool) {
        exportDossierToExcel({
          school: activeSchool,
          students: schoolStudents,
          staff: schoolStaff,
          facilities: schoolFacilities,
          attendance: schoolAttendance,
          mdmRecords: schoolMDM,
          governmentWork: schoolWork,
          complaints: schoolComplaints,
          notifications: [],
          documents: [],
          session: activeSession
        });
        showFeedback('10-अनुभाग संपूर्ण एक्सेल वर्कबुक डाउनलोड हो गया!');
        return;
      }

      const payload: ExportDataPayload = {
        title: dataset.title,
        subtitle: dataset.subtitle,
        session: activeSession,
        schoolName: effectiveUdise !== 'ALL' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
        udise: effectiveUdise !== 'ALL' ? effectiveUdise : undefined,
        generatedBy: currentUser?.name || 'संजय जैन',
        userRole: currentUser?.role || 'CAC',
        summaryMetrics: dataset.summaryMetrics,
        headers: dataset.headers,
        rows: dataset.rows,
        fileName: dataset.fileName,
        options
      };
      exportToExcel(payload);
      showFeedback('एक्सेल फाइल डाउनलोड हो गई!');
    } catch (err) {
      console.error('Excel Export Error:', err);
      showFeedback('एक्सेल फाइल तैयार करने में त्रुटि हुई।', true);
    } finally {
      setIsExportingExcel(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 modal-print-wrapper">
      <div className="bg-white dark:bg-[#16211D] w-full max-w-6xl max-h-[96vh] rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-2xl flex flex-col overflow-hidden print-modal-container">
        
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#0B6B4B] text-white flex items-center justify-between shrink-0 shadow-xs no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl text-emerald-100 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  स्मार्ट प्रिंट व एक्सपोर्ट केंद्र (Smart Export Dialog)
                </h2>
                <span className="bg-[#FF7A00] text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  A4 प्रिंट व PDF
                </span>
                <span className="bg-emerald-800 text-emerald-100 text-[10px] px-2 py-0.5 rounded font-medium">
                  ऑटो-पेज लेआउट
                </span>
              </div>
              <p className="text-[11px] text-emerald-100 mt-0.5">
                A4 प्रिंट, PDF एवं Excel निर्यात
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status / Alert Bar */}
        {statusMessage && (
          <div className="bg-emerald-50 dark:bg-emerald-950/80 border-b border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 px-4 py-2 text-xs font-bold flex items-center gap-2 no-print">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
        {errorMessage && (
          <div className="bg-rose-50 dark:bg-rose-950/80 border-b border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 px-4 py-2 text-xs font-bold flex items-center justify-between gap-2 no-print">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-700 dark:text-rose-300 underline font-bold cursor-pointer"
            >
              हटाएं
            </button>
          </div>
        )}

        {/* Modal Body: Split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Controls Column */}
          <div className="w-full md:w-80 bg-gray-50 dark:bg-[#0F1714] border-r border-[#D9E2DD] dark:border-[#2B3A34] p-4 overflow-y-auto space-y-4 text-xs no-print">
            {/* Step 1: Data Type */}
            <div>
              <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                1. डेटा रिपोर्ट प्रकार:
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1A2620] border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] cursor-pointer"
              >
                <option value="COMPLETE_SCHOOL">★ संपूर्ण शाला महा-डोजियर (Multi-Section)</option>
                <option value="SCHOOL">विद्यालय निर्देशिका (Schools Directory)</option>
                <option value="STUDENT">विद्यार्थी नामांकन व रोस्टर (Students)</option>
                <option value="TEACHER">शिक्षक एवं स्टाफ पंजी (Staff & Teachers)</option>
                <option value="ATTENDANCE">दैनिक व मासिक उपस्थिति (Attendance)</option>
                <option value="MDM">मध्याह्न भोजन रजिस्टर (MDM Register)</option>
                <option value="FACILITIES">16-सूत्रीय भौतिक अधोसंरचना (Facilities)</option>
              </select>
            </div>

            {/* Step 2: Scope Selection */}
            <div>
              <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                2. {isSchoolRestricted ? 'अधिकृत विद्यालय (Assigned School):' : 'शाला का चयन (Filter School):'}
              </label>
              {isSchoolRestricted ? (
                <div className="w-full px-3 py-2 bg-gray-100 dark:bg-[#1A2620] border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-gray-900 dark:text-white truncate">
                  {activeSchool?.name || activeSchool?.hindiName || 'मेरा विद्यालय'} ({effectiveUdise})
                </div>
              ) : (
                <select
                  value={selectedUdise}
                  onChange={(e) => setSelectedUdise(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1A2620] border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-gray-900 dark:text-white cursor-pointer"
                >
                  <option value="ALL">★ समस्त संकुल शालाएं (All Schools)</option>
                  {schools.map((s) => (
                    <option key={s.udise} value={s.udise}>
                      {s.name || s.hindiName} ({s.udise})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Step 3: Session Information (Single Source of Truth) */}
            <div>
              <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1.5 text-xs">
                3. शैक्षणिक सत्र (Academic Session):
              </label>
              <div className="w-full px-3 py-2 bg-gray-50 dark:bg-[#16211D] border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400 font-mono">
                  सत्र {activeSession}
                </span>
                <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-medium">
                  सक्रिय सत्र
                </span>
              </div>
            </div>

            {/* Sub-Filters for Students */}
            {dataType === 'STUDENT' && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">कक्षा फ़िल्टर:</label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A2620] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                  >
                    <option value="ALL">समस्त कक्षाएं (All Classes)</option>
                    {['1', '2', '3', '4', '5', '6', '7', '8'].map((c) => (
                      <option key={c} value={c}>कक्षा {c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">लिंग (Gender):</label>
                  <select
                    value={selectedGender}
                    onChange={(e) => setSelectedGender(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-[#1A2620] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                  >
                    <option value="ALL">समस्त लिंग (All)</option>
                    <option value="बालक">बालक (Boys)</option>
                    <option value="बालिका">बालिका (Girls)</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Layout Orientation */}
            <div>
              <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                3. पृष्ठ अभिविन्यास (Page Orientation):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    orientation === 'portrait'
                      ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                      : 'bg-white dark:bg-[#1A2620] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>A4 पोर्ट्रेट</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    orientation === 'landscape'
                      ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                      : 'bg-white dark:bg-[#1A2620] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span>A4 लैंडस्केप</span>
                </button>
              </div>
            </div>

            {/* Step 4: Optional Formatting Checklist under More Options */}
            <details className="pt-2 border-t border-gray-200 dark:border-gray-800 group">
              <summary className="font-bold text-gray-800 dark:text-gray-200 cursor-pointer list-none flex items-center justify-between py-1 text-xs">
                <span>अतिरिक्त प्रारूप विकल्प (More Options)</span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▾</span>
              </summary>
              <div className="mt-2 space-y-1.5 bg-gray-50 dark:bg-[#16211D] p-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeHeader ?? true}
                    onChange={(e) => setOptions({ ...options, includeHeader: e.target.checked })}
                    className="rounded text-[#0B6B4B]"
                  />
                  <span>शीर्षक हेडर (Header)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSchoolIdentity ?? true}
                    onChange={(e) => setOptions({ ...options, includeSchoolIdentity: e.target.checked })}
                    className="rounded text-[#0B6B4B]"
                  />
                  <span>शाला पहचान रिबन (Identity)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includePageNumber ?? true}
                    onChange={(e) => setOptions({ ...options, includePageNumber: e.target.checked })}
                    className="rounded text-[#0B6B4B]"
                  />
                  <span>पृष्ठ क्रमांक (Page Numbers)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSignature ?? false}
                    onChange={(e) => setOptions({ ...options, includeSignature: e.target.checked })}
                    className="rounded text-[#0B6B4B]"
                  />
                  <span>हस्ताक्षर ब्लॉक (Signatures)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeFooter ?? false}
                    onChange={(e) => setOptions({ ...options, includeFooter: e.target.checked })}
                    className="rounded text-[#0B6B4B]"
                  />
                  <span>दस्तावेज़ फुटर (Footer)</span>
                </label>
              </div>
            </details>

            {/* Document Style Selection */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
              <PrintStyleToggle currentStyle={docStyle} onStyleChange={setDocStyle} />
            </div>

            {/* Summary Badge */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                चयनित डेटा सारांश
              </span>
              <div className="text-sm font-bold text-[#0B6B4B] dark:text-emerald-400">
                {dataType === 'COMPLETE_SCHOOL' ? 'संपूर्ण 6-अनुभाग डोजियर' : `${dataset.rows.length} रिकॉर्ड्स`}
              </div>
              <div className="text-[11px] text-emerald-900 dark:text-emerald-300 font-bold flex items-center gap-1">
                <span>अनुमानित पृष्ठ: ~{estimatedPages} पृष्ठ</span>
              </div>
              <div className="text-[10px] text-gray-500">
                A4 स्वचालित मल्टी-पेज फ्लो सक्षम
              </div>
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div className="flex-1 bg-gray-200 dark:bg-black/60 p-3 sm:p-6 overflow-y-auto flex flex-col items-center">
            
            {/* Preview Toolbar */}
            <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-gray-300 dark:border-gray-700 no-print text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 dark:text-white">लाइव दस्तावेज़ पूर्वावलोकन:</span>
                <span className="bg-white dark:bg-gray-800 px-2 py-0.5 rounded text-[11px] font-mono border border-gray-300 dark:border-gray-700">
                  {orientation === 'landscape' ? 'A4 Landscape' : 'A4 Portrait'}
                </span>
                <span className="bg-emerald-100 dark:bg-emerald-900/60 text-[#0B6B4B] dark:text-emerald-300 px-2 py-0.5 rounded text-[10.5px] font-bold border border-emerald-300 dark:border-emerald-700">
                  कुल अनुमानित: ~{estimatedPages} पृष्ठ (Auto-Flow)
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 cursor-pointer"
                  title="ज़ूम कम करें"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono w-10 text-center text-gray-800 dark:text-gray-200 font-bold">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 cursor-pointer"
                  title="ज़ूम बढ़ाएं"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 cursor-pointer ml-1"
                  title="रीसेट ज़ूम"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Scaled Preview Wrapper */}
            <div
              className="w-full flex justify-center transition-transform origin-top"
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
            >
              <div ref={previewRef} id="printable-smart-export-preview" className="w-full">
                <SmartExportDocument
                  title={dataset.title}
                  subtitle={dataset.subtitle}
                  session={activeSession}
                  schoolName={effectiveUdise !== 'ALL' ? (activeSchool?.name || activeSchool?.hindiName) : 'समस्त संकुल शालाएं'}
                  udise={effectiveUdise !== 'ALL' ? effectiveUdise : institutionConfig.diseCode}
                  orientation={orientation}
                  documentStyle={docStyle}
                  summaryMetrics={dataset.summaryMetrics}
                  headers={dataset.headers}
                  rows={dataset.rows}
                  options={options}
                  dataType={dataType}
                  school={activeSchool}
                  students={schoolStudents}
                  staff={schoolStaff}
                  facilities={schoolFacilities}
                  attendance={schoolAttendance}
                  mdmRecords={schoolMDM}
                  governmentWork={schoolWork}
                  complaints={schoolComplaints}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3 bg-white dark:bg-[#16211D] border-t border-[#D9E2DD] dark:border-[#2B3A34] flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="text-xs text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
            <span>सत्र: <strong>{activeSession}</strong></span>
            <span>•</span>
            <span>दस्तावेज़: <strong>{dataset.title}</strong></span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Excel Export Button */}
            <button
              type="button"
              id="btn-smart-export-excel"
              onClick={handleExcel}
              disabled={isExportingExcel}
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="माइक्रोसॉफ्ट एक्सेल (.xlsx) डाउनलोड करें"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
              <span>{isExportingExcel ? 'Excel तैयार हो रहा है...' : 'एक्सेल (.xlsx)'}</span>
            </button>

            {/* PDF Export Button */}
            <button
              type="button"
              id="btn-smart-export-pdf"
              onClick={handlePDF}
              disabled={isPdfGenerating}
              className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              title="PDF डाउनलोड करें"
            >
              {isPdfGenerating ? (
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              ) : (
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" aria-hidden="true" />
              )}
              <span>{isPdfGenerating ? 'PDF बन रही है...' : 'PDF डाउनलोड'}</span>
            </button>

            {/* Direct A4 Print Button */}
            <button
              type="button"
              id="btn-smart-export-print"
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
              title="A4 साइज में सीधे प्रिंट करें"
            >
              <Printer className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
              <span>{isPrinting ? 'प्रिंट विंडो खुल रही है...' : 'A4 प्रिंट (Print)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
