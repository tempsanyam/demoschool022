import React, { useState, useMemo, useRef } from 'react';
import {
  X,
  Printer,
  FileSpreadsheet,
  FileText,
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
  Settings
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { institutionConfig } from '../../config/institutionConfig';
import {
  exportToExcel,
  exportToCSV,
  exportMultiSheetExcel,
  generateUnicodePDFFromElement,
  generateQuickPDF,
  triggerSystemPrint,
  ExportDataPayload,
  ExportOptions
} from '../../utils/exportUtils';
import { School, Student, Staff } from '../../types';

export interface SmartExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: string; // 'SCHOOL' | 'STUDENT' | 'TEACHER' | 'ATTENDANCE' | 'FACILITIES' | 'MDM' | 'COMPLAINTS' | 'WORK' | 'COMPLETE_SCHOOL';
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
  } = useData();

  const previewRef = useRef<HTMLDivElement>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);

  const [dataType, setDataType] = useState<string>(initialType);
  const [selectedUdise, setSelectedUdise] = useState<string>(initialUdise || 'ALL');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId || 'ALL');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacherId || 'ALL');
  const [activeSession, setActiveSession] = useState<string>('2026-27');

  // Document formatting options
  const [options, setOptions] = useState<ExportOptions>({
    includeHeader: true,
    includeSchoolIdentity: true,
    includePageNumber: false,
    includeSignature: false,
    includeFooter: false,
  });

  if (!isOpen) return null;

  const activeSchool = schools.find((s) => s.udise === selectedUdise);
  const schoolStudents = selectedUdise === 'ALL' ? students : students.filter((s) => s.schoolUdise === selectedUdise);
  const schoolStaff = selectedUdise === 'ALL' ? staff : staff.filter((s) => s.assignedSchoolUdise === selectedUdise);
  const schoolFacilities = selectedUdise === 'ALL' ? facilities : facilities.filter((f) => f.schoolUdise === selectedUdise);
  const schoolAttendance = selectedUdise === 'ALL' ? attendance : attendance.filter((a) => a.schoolUdise === selectedUdise);
  const schoolMDM = selectedUdise === 'ALL' ? mdmRecords : mdmRecords.filter((m) => m.schoolUdise === selectedUdise);
  const schoolWork = selectedUdise === 'ALL' ? governmentWork : governmentWork.filter((w) => w.schoolUdise === selectedUdise);
  const schoolComplaints = selectedUdise === 'ALL' ? complaints : complaints.filter((c) => c.schoolUdise === selectedUdise);

  // Compute Current Dataset Based on dataType & Filters
  const dataset = useMemo(() => {
    let title = 'शासकीय प्रतिवेदन';
    let subtitle = `जन शिक्षा केंद्र / संकुल मलगुवां | सत्र ${activeSession}`;
    let headers: string[] = [];
    let rows: (string | number)[][] = [];
    let summaryMetrics: { label: string; value: string | number }[] = [];
    let fileName = `Report_${dataType}_${selectedUdise}`;

    if (dataType === 'SCHOOL' || dataType === 'ALL_SCHOOLS') {
      title = selectedUdise === 'ALL' ? 'संकुल अंतर्गत समस्त 37 विद्यालयों की मास्टर निर्देशिका' : `विद्यालय मास्टर विवरण - ${activeSchool?.name || activeSchool?.hindiName}`;
      headers = ['क्र.', 'यूडाइस कोड', 'विद्यालय का नाम', 'श्रेणी/प्रकार', 'ग्राम', 'ग्राम पंचायत', 'संस्था प्रधान', 'मोबाइल', 'स्थिति'];
      const targetSchools = selectedUdise === 'ALL' ? schools : schools.filter((s) => s.udise === selectedUdise);
      rows = targetSchools.map((s, idx) => [
        idx + 1,
        s.udise,
        s.name || s.hindiName,
        s.schoolType,
        s.village,
        s.gramPanchayat,
        s.principalName,
        s.principalMobile,
        s.status === 'ACTIVE' ? 'सक्रिय' : 'निष्क्रिय'
      ]);
      summaryMetrics = [
        { label: 'कुल विद्यालय', value: targetSchools.length },
        { label: 'प्राथमिक', value: targetSchools.filter((s) => s.schoolType.includes('प्राथमिक')).length },
        { label: 'माध्यमिक', value: targetSchools.filter((s) => s.schoolType.includes('माध्यमिक')).length },
      ];
      fileName = `Schools_Directory_${selectedUdise}`;
    } else if (dataType === 'STUDENT' || dataType === 'STUDENTS') {
      let filtered = schoolStudents;
      if (selectedClass !== 'ALL') filtered = filtered.filter((s) => s.class === selectedClass);
      if (selectedGender !== 'ALL') filtered = filtered.filter((s) => s.gender === selectedGender);
      if (selectedStudentId !== 'ALL') filtered = filtered.filter((s) => s.id === selectedStudentId);

      title = `विद्यार्थी नामांकन एवं रोस्टर सूची (${selectedUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
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
      ];
      fileName = `Students_List_${selectedUdise}`;
    } else if (dataType === 'TEACHER' || dataType === 'STAFF') {
      let filtered = schoolStaff;
      if (selectedTeacherId !== 'ALL') filtered = filtered.filter((t) => t.id === selectedTeacherId || t.employeeId === selectedTeacherId);

      title = `शिक्षक एवं स्टाफ पदस्थापना सूची (${selectedUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
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
      ];
      fileName = `Staff_List_${selectedUdise}`;
    } else if (dataType === 'ATTENDANCE') {
      title = `दैनिक एवं मासिक उपस्थिति रजिस्टर (${selectedUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
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
      ];
      fileName = `Attendance_${selectedUdise}`;
    } else if (dataType === 'MDM') {
      title = `मध्याह्न भोजन (MDM) वितरण अभिलेख (${selectedUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
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
      fileName = `MDM_Report_${selectedUdise}`;
    } else if (dataType === 'FACILITIES') {
      title = `16-सूत्रीय भौतिक अधोसंरचना प्रपत्र (${selectedUdise === 'ALL' ? 'समस्त संकुल' : activeSchool?.name || activeSchool?.hindiName})`;
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
        { label: 'उपलब्ध', value: schoolFacilities.filter((f) => f.available === 'YES').length },
      ];
      fileName = `Facilities_${selectedUdise}`;
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
      fileName = `Complete_School_${selectedUdise}`;
    }

    return {
      title,
      subtitle,
      headers,
      rows,
      summaryMetrics,
      fileName,
    };
  }, [dataType, selectedUdise, activeSession, selectedClass, selectedGender, selectedStudentId, selectedTeacherId, schools, schoolStudents, schoolStaff, schoolFacilities, schoolAttendance, schoolMDM, schoolWork, schoolComplaints, activeSchool]);

  const handlePrint = () => {
    logActivity('EXPORT', 'SmartExport', `प्रिंट रिपोर्ट: ${dataset.title}`, {
      schoolUdise: selectedUdise,
    });
    triggerSystemPrint(orientation);
  };

  const handlePDF = async () => {
    logActivity('EXPORT', 'SmartExport', `PDF डाउनलोड: ${dataset.title}`, {
      schoolUdise: selectedUdise,
    });
    setIsPdfGenerating(true);
    try {
      if (previewRef.current) {
        await generateUnicodePDFFromElement(
          previewRef.current,
          dataset.fileName,
          orientation,
          options
        );
      } else {
        const payload: ExportDataPayload = {
          title: dataset.title,
          subtitle: dataset.subtitle,
          session: activeSession,
          schoolName: selectedUdise !== 'ALL' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
          udise: selectedUdise !== 'ALL' ? selectedUdise : undefined,
          generatedBy: currentUser?.name || 'संजय जैन',
          userRole: currentUser?.role || 'CAC',
          orientation,
          summaryMetrics: dataset.summaryMetrics,
          headers: dataset.headers,
          rows: dataset.rows,
          fileName: dataset.fileName,
          options
        };
        generateQuickPDF(payload);
      }
    } catch (err) {
      console.error('PDF Export Error:', err);
    } finally {
      setIsPdfGenerating(false);
    }
  };

  const handleExcel = () => {
    logActivity('EXPORT', 'SmartExport', `Excel डाउनलोड: ${dataset.title}`, {
      schoolUdise: selectedUdise,
    });
    const payload: ExportDataPayload = {
      title: dataset.title,
      subtitle: dataset.subtitle,
      session: activeSession,
      schoolName: selectedUdise !== 'ALL' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
      udise: selectedUdise !== 'ALL' ? selectedUdise : undefined,
      generatedBy: currentUser?.name || 'संजय जैन',
      userRole: currentUser?.role || 'CAC',
      summaryMetrics: dataset.summaryMetrics,
      headers: dataset.headers,
      rows: dataset.rows,
      fileName: dataset.fileName,
      options
    };
    exportToExcel(payload);
  };

  const handleCSV = () => {
    logActivity('EXPORT', 'SmartExport', `CSV डाउनलोड: ${dataset.title}`, {
      schoolUdise: selectedUdise,
    });
    const payload: ExportDataPayload = {
      title: dataset.title,
      subtitle: dataset.subtitle,
      session: activeSession,
      schoolName: selectedUdise !== 'ALL' ? (activeSchool?.name || activeSchool?.hindiName) : undefined,
      udise: selectedUdise !== 'ALL' ? selectedUdise : undefined,
      generatedBy: currentUser?.name || 'संजय जैन',
      userRole: currentUser?.role || 'CAC',
      summaryMetrics: dataset.summaryMetrics,
      headers: dataset.headers,
      rows: dataset.rows,
      fileName: dataset.fileName,
      options
    };
    exportToCSV(payload);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#16211D] w-full max-w-6xl max-h-[92vh] rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-50/50 dark:bg-[#1A2620] border-b border-[#D9E2DD] dark:border-[#2B3A34] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/80 text-[#0B6B4B] dark:text-emerald-300 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>स्मार्ट प्रिंट व एक्सपोर्ट केंद्र (Smart Export Dialog)</span>
                <span className="bg-[#FF7A00] text-white text-[10px] px-2 py-0.5 rounded font-bold">
                  यूनिकोड सुरक्षित
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                100% सटीक हिंदी एवं अंग्रेजी फॉन्ट रेंडरिंग • A4 प्रिंट, PDF, Excel एवं CSV निर्यात
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Split Layout */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Controls Column */}
          <div className="w-full md:w-80 bg-gray-50 dark:bg-[#0F1714] border-r border-[#D9E2DD] dark:border-[#2B3A34] p-4 overflow-y-auto space-y-4 text-xs">
            {/* Step 1: Data Type */}
            <div>
              <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                1. डेटा रिपोर्ट प्रकार:
              </label>
              <select
                value={dataType}
                onChange={(e) => setDataType(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1A2620] border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B]"
              >
                <option value="COMPLETE_SCHOOL">★ संपूर्ण शाला महा-डोजियर</option>
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
                2. शाला का चयन (Filter School):
              </label>
              <select
                value={selectedUdise}
                onChange={(e) => setSelectedUdise(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-[#1A2620] border border-gray-300 dark:border-gray-700 rounded-lg font-bold text-gray-900 dark:text-white"
              >
                <option value="ALL">★ समस्त 37 संकुल शालाएं (All Schools)</option>
                {schools.map((s) => (
                  <option key={s.udise} value={s.udise}>
                    {s.name || s.hindiName} ({s.udise})
                  </option>
                ))}
              </select>
            </div>

            {/* Step 3: Layout Orientation */}
            <div>
              <label className="block font-bold text-gray-800 dark:text-gray-200 mb-1.5">
                3. पृष्ठ अभिविन्यास (Page Layout):
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrientation('portrait')}
                  className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    orientation === 'portrait'
                      ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                      : 'bg-white dark:bg-[#1A2620] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <span>A4 पोर्ट्रेट</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrientation('landscape')}
                  className={`py-2 px-3 rounded-lg font-bold border flex items-center justify-center gap-1.5 transition-all ${
                    orientation === 'landscape'
                      ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                      : 'bg-white dark:bg-[#1A2620] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                  }`}
                >
                  <span>A4 लैंडस्केप</span>
                </button>
              </div>
            </div>

            {/* Step 4: Optional Section Checklist */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 space-y-2">
              <label className="block font-bold text-gray-800 dark:text-gray-200">
                4. दस्तावेज़ विकल्प (Options):
              </label>
              <div className="space-y-1.5 bg-white dark:bg-[#1A2620] p-2.5 rounded-lg border border-gray-200 dark:border-gray-700">
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
                  <span>शाला पहचान (Identity Info)</span>
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
            </div>

            {/* Summary Badge */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-bold block">
                चयनित सारांश
              </span>
              <div className="text-base font-bold text-[#0B6B4B] dark:text-emerald-400">
                {dataset.rows.length} रिकॉर्ड्स
              </div>
            </div>
          </div>

          {/* Right Live Preview Column */}
          <div className="flex-1 bg-gray-200 dark:bg-black/60 p-4 overflow-y-auto flex flex-col items-center">
            {/* Simulation A4 Paper Sheet */}
            <div
              ref={previewRef}
              className={`print-report-container unicode-safe bg-white text-gray-900 p-6 sm:p-8 shadow-xl border border-gray-300 rounded-sm w-full min-h-[500px] flex flex-col justify-between transition-all ${
                orientation === 'landscape' ? 'max-w-4xl' : 'max-w-3xl'
              }`}
              style={{ fontFamily: "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Inter', 'Noto Sans', sans-serif" }}
            >
              <div>
                {/* Official Document Header (Controlled by options.includeHeader) */}
                {(options.includeHeader ?? true) && (
                  <div className="border-b-2 border-[#0B6B4B] pb-3 text-center space-y-0.5">
                    <div className="text-[10px] font-bold tracking-wider text-gray-600 uppercase">
                      {institutionConfig.department || 'मध्य प्रदेश शासन • स्कूल शिक्षा विभाग'}
                    </div>
                    <h1 className="text-base sm:text-lg font-bold text-[#0B6B4B]">
                      {institutionConfig.institutionName}
                    </h1>
                    <p className="text-[11px] text-gray-600">
                      संकुल मलगुवां • विकास खंड: {institutionConfig.block}, जिला: {institutionConfig.district} (म.प्र.)
                    </p>
                    
                    {(options.includeSchoolIdentity ?? true) && (
                      <div className="flex items-center justify-between text-[10px] text-gray-500 pt-1.5 px-2 border-t border-gray-200 mt-2">
                        <span>विद्यालय: <strong>{activeSchool ? (activeSchool.name || activeSchool.hindiName) : 'समस्त संकुल (37 शालाएं)'}</strong></span>
                        <span>UDISE: <strong>{selectedUdise === 'ALL' ? institutionConfig.diseCode : selectedUdise}</strong></span>
                        <span>सत्र: <strong>{activeSession}</strong></span>
                      </div>
                    )}
                  </div>
                )}

                {/* Report Title Banner */}
                <div className="py-2.5 my-2.5 bg-gray-50 rounded border border-gray-200 px-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-xs font-bold text-gray-900">{dataset.title}</h2>
                    <p className="text-[10px] text-gray-500">दिनांक: {new Date().toLocaleDateString('hi-IN')}</p>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                    अधिकृत प्रतिवेदन
                  </span>
                </div>

                {/* Summary Metrics */}
                {dataset.summaryMetrics && dataset.summaryMetrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
                    {dataset.summaryMetrics.map((m, idx) => (
                      <div key={idx} className="p-1.5 bg-gray-50 border rounded text-center">
                        <span className="text-[9px] text-gray-500 block">{m.label}</span>
                        <span className="text-xs font-bold text-[#0B6B4B]">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Preview Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[10px] border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-100 font-bold text-gray-800 border-b border-gray-300">
                        {dataset.headers.map((h, i) => (
                          <th key={i} className="p-1.5 border border-gray-300">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 text-gray-700">
                      {dataset.rows.slice(0, 12).map((row, rIdx) => (
                        <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}>
                          {row.map((c, cIdx) => (
                            <td key={cIdx} className="p-1.5 border border-gray-300 font-medium">
                              {String(c ?? '-')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {dataset.rows.length > 12 && (
                    <div className="text-center text-[10px] text-gray-400 py-1.5 bg-gray-50 border-t">
                      ... और {dataset.rows.length - 12} रिकॉर्ड्स (पूर्ण डेटा प्रिंट/डाउनलोड में सम्मिलित रहेगा)
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Document Signatures (Controlled by options.includeSignature) */}
              {options.includeSignature && (
                <div className="pt-8 mt-4 border-t border-gray-300">
                  <div className="grid grid-cols-2 text-center text-[10px] text-gray-800">
                    <div>
                      <div className="h-8"></div>
                      <div className="font-bold">हस्ताक्षर संस्था प्रधान / शाला प्रभारी</div>
                      <div className="text-[9px] text-gray-500">{activeSchool?.name || activeSchool?.hindiName || 'शासकीय विद्यालय'}</div>
                    </div>
                    <div>
                      <div className="h-8"></div>
                      <div className="font-bold text-[#0B6B4B]">हस्ताक्षर जन शिक्षक / CAC</div>
                      <div className="text-[9px] text-gray-500">{institutionConfig.institutionName}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optional Footer (Controlled by options.includeFooter) */}
              {options.includeFooter && (
                <div className="mt-4 pt-2 border-t border-dashed border-gray-200 flex items-center justify-between text-[9px] text-gray-400">
                  <span>{institutionConfig.institutionName} ({institutionConfig.district})</span>
                  <span>दिनांक: {new Date().toLocaleDateString('hi-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Bar */}
        <div className="px-5 py-3 bg-white dark:bg-[#16211D] border-t border-[#D9E2DD] dark:border-[#2B3A34] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            आउटपुट प्रारूप चुनें और एक-क्लिक में डाउनलोड या प्रिंट करें
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCSV}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV (UTF-8)</span>
            </button>

            <button
              onClick={handleExcel}
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>एक्सेल (.xlsx)</span>
            </button>

            <button
              onClick={handlePDF}
              disabled={isPdfGenerating}
              className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              <FileText className="w-4 h-4" />
              <span>{isPdfGenerating ? 'PDF बन रही है...' : 'PDF डाउनलोड'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>A4 प्रिंट (Print)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
