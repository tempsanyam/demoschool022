import React, { useState, useMemo } from 'react';
import {
  School,
  ArrowLeft,
  Printer,
  FileSpreadsheet,
  Edit2,
  MapPin,
  GraduationCap,
  Users,
  Building2,
  Utensils,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Sparkles,
  Save,
  X,
  BookOpen,
  Landmark,
  Clock,
  Briefcase,
  Lock,
  AlertTriangle,
  History,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { SchoolBanner } from '../common/SchoolBanner';
import { exportToExcel } from '../../utils/exportUtils';
import { getSessionForDate } from '../../utils/sessionManager';
import { SmartExportModal } from '../export/SmartExportModal';
import { PrintDossierModal } from './PrintDossierModal';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { HistoricalSessionBanner } from './HistoricalSessionBanner';
import { SchoolHistoryView } from './SchoolHistoryView';
import { SchoolHistoryModal } from './SchoolHistoryModal';

interface SchoolProfileViewProps {
  udise: string;
  onBack: () => void;
  onNavigateToStudent?: (id?: string) => void;
  onNavigateToStaff?: (id?: string) => void;
  onNavigateToAttendance?: () => void;
  onNavigateToFacilities?: () => void;
  onNavigateToMDM?: () => void;
}

type ProfileTab = 'OVERVIEW' | 'STUDENTS' | 'STAFF' | 'FACILITIES' | 'MDM_ATTENDANCE' | 'ACADEMIC_ADMIN' | 'HISTORY';

export const SchoolProfileView: React.FC<SchoolProfileViewProps> = ({
  udise,
  onBack,
  onNavigateToStudent,
  onNavigateToStaff,
  onNavigateToAttendance,
  onNavigateToFacilities,
  onNavigateToMDM,
}) => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const {
    schools,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    updateFacility,
    updateSchool,
    selectedSessionId,
    activeSessionId,
    academicSessions,
    getSchoolAcademicHistory,
  } = useData();

  const [activeTab, setActiveTab] = useState<ProfileTab>('OVERVIEW');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isPrintDossierOpen, setIsPrintDossierOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const isSchoolRestricted = currentUser?.role === 'SCHOOL';

  // Strictly enforce user's assigned school if restricted
  const effectiveUdise = isSchoolRestricted
    ? currentUser?.assignedSchoolUdise || udise
    : udise;

  const currentSessionObj = academicSessions?.find((s) => s.id === selectedSessionId);
  const isHistoricalSession =
    selectedSessionId !== activeSessionId ||
    currentSessionObj?.status === 'ARCHIVED' ||
    currentSessionObj?.status === 'CLOSED' ||
    currentSessionObj?.status === 'LOCKED';

  // Dynamically computed multi-year session entries for this school
  const schoolHistoryEntries = useMemo(() => {
    try {
      return getSchoolAcademicHistory(effectiveUdise);
    } catch {
      return [];
    }
  }, [getSchoolAcademicHistory, effectiveUdise]);

  const school = schools.find((s) => s.udise === effectiveUdise);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    udise: school?.udise || '',
    name: school?.name || '',
    hindiName: school?.hindiName || '',
    schoolType: school?.schoolType || 'प्राथमिक',
    village: school?.village || '',
    gramPanchayat: school?.gramPanchayat || '',
    principalName: school?.principalName || '',
    principalMobile: school?.principalMobile || '',
    establishmentYear: school?.establishmentYear || '1995',
    block: school?.block || 'टीकमगढ़',
    district: school?.district || 'टीकमगढ़',
  });

  if (!school) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#17211C] rounded-2xl border border-gray-200 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          विद्यालय विवरण नहीं मिला (यूडाइस: {effectiveUdise})
        </h3>
        <button
          onClick={onBack}
          className="mt-4 bg-[#0B6B4B] text-white px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer"
        >
          {isSchoolRestricted ? 'डैशबोर्ड पर जाएं' : 'वापस सूची पर जाएं'}
        </button>
      </div>
    );
  }

  const schoolStudents = students.filter((st) => st.schoolUdise === effectiveUdise);
  const schoolStaff = staff.filter((stf) => stf.assignedSchoolUdise === effectiveUdise);
  const schoolFacilities = facilities.filter((f) => {
    if (f.schoolUdise !== effectiveUdise) return false;
    if (f.sessionId) return f.sessionId === selectedSessionId;
    return selectedSessionId === activeSessionId;
  });
  const schoolAttendance = attendance.filter((a) => {
    const matchSchool = a.schoolUdise === effectiveUdise;
    const recSession = a.sessionId || getSessionForDate(a.date);
    return matchSchool && recSession === selectedSessionId;
  });
  const schoolMDM = mdmRecords.filter((m) => {
    const matchSchool = m.schoolUdise === effectiveUdise;
    const recSession = m.sessionId || getSessionForDate(m.date);
    return matchSchool && recSession === selectedSessionId;
  });

  const boysCount = schoolStudents.filter((s) => s.gender === 'बालक').length;
  const girlsCount = schoolStudents.filter((s) => s.gender === 'बालिका').length;
  const scCount = schoolStudents.filter((s) => s.category === 'SC').length;
  const stCount = schoolStudents.filter((s) => s.category === 'ST').length;
  const obcCount = schoolStudents.filter((s) => s.category === 'OBC').length;
  const genCount = schoolStudents.filter((s) => s.category === 'General').length;
  const cwsnCount = schoolStudents.filter((s) => s.isCwsn).length;

  const handlePrintDossier = () => {
    setIsPrintDossierOpen(true);
  };

  const handleExportDossier = () => {
    const headers = ['श्रेणी / विवरण', 'मान / स्थिति'];
    const rows = [
      ['यूडाइस कोड (UDISE Code)', school.udise],
      ['विद्यालय का नाम (School Name)', school.name],
      ['हिंदी नाम (Hindi Name)', school.hindiName || school.name],
      ['शाला प्रकार / श्रेणी (School Type)', school.schoolType],
      ['प्रबंधन विभाग (Management)', 'स्कूल शिक्षा विभाग, म.प्र. शासन'],
      ['सत्र (Academic Session)', selectedSessionId],
      ['ग्राम / मजरा (Village)', school.village],
      ['ग्राम पंचायत (Gram Panchayat)', school.gramPanchayat],
      ['विकासखंड (Block)', school.block || 'टीकमगढ़'],
      ['जिला (District)', school.district || 'टीकमगढ़'],
      ['राज्य (State)', 'मध्य प्रदेश (Madhya Pradesh)'],
      ['पिन कोड (PIN Code)', '472001'],
      ['संस्था प्रधान का नाम (Principal Name)', school.principalName],
      ['प्रधान का मोबाइल नंबर (Principal Mobile)', school.principalMobile],
      ['स्थापना वर्ष (Establishment Year)', String(school.establishmentYear || '1995')],
      ['कुल नामांकित विद्यार्थी (Total Students)', schoolStudents.length],
      ['बालक विद्यार्थी (Boys)', boysCount],
      ['बालिका विद्यार्थी (Girls)', girlsCount],
      ['अनुसूचित जाति (SC)', scCount],
      ['अनुसूचित जनजाति (ST)', stCount],
      ['अन्य पिछड़ा वर्ग (OBC)', obcCount],
      ['सामान्य वर्ग (General)', genCount],
      ['दिव्यांग विद्यार्थी (CWSN)', cwsnCount],
      ['कुल पदस्थ शिक्षक व स्टाफ (Total Staff)', schoolStaff.length],
      ['कुल दर्ज भौतिक सुविधाएं (Physical Facilities)', schoolFacilities.length],
    ];

    exportToExcel({
      title: `विद्यालय विवरण डोजियर: ${school.hindiName || school.name}`,
      subtitle: `सत्र ${selectedSessionId} | यूडाइस कोड: ${school.udise}`,
      schoolName: school.hindiName || school.name,
      udise: school.udise,
      headers,
      rows,
      fileName: `School_Profile_${school.udise}_${selectedSessionId.replace('-', '_')}`,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      // Security Enforcement: Non-admin can only edit operational fields
      updateSchool({
        ...school,
        name: school.name,
        hindiName: school.hindiName,
        udise: school.udise,
        schoolType: editFormData.schoolType as any,
        village: editFormData.village,
        gramPanchayat: editFormData.gramPanchayat,
        principalName: editFormData.principalName,
        principalMobile: editFormData.principalMobile,
        establishmentYear: Number(editFormData.establishmentYear) || 1995,
        block: editFormData.block,
        district: editFormData.district,
      });
      setIsEditModalOpen(false);
      return;
    }

    // Admin Flow: Check if UDISE is modified
    const isUdiseChanged = editFormData.udise.trim() !== school.udise;
    if (isUdiseChanged) {
      const confirmChange = window.confirm(
        `⚠️ महत्वपूर्ण सूचना (Admin Identity Change):\n\nक्या आप विद्यालय यूडाइस कोड '${school.udise}' को बदलकर '${editFormData.udise.trim()}' करना चाहते हैं?\n\nइस परिवर्तन से विद्यालय से जुड़े समस्त छात्र, शिक्षक, दैनिक उपस्थिति, एमडीएम, शिकायतें व कार्य रिकॉर्ड्स स्वतः नए यूडाइस कोड पर सुरक्षित माइग्रेट हो जाएंगे।`
      );
      if (!confirmChange) {
        return;
      }
    }

    updateSchool(
      {
        ...school,
        udise: editFormData.udise.trim(),
        name: editFormData.name.trim(),
        hindiName: editFormData.hindiName.trim(),
        schoolType: editFormData.schoolType as any,
        village: editFormData.village,
        gramPanchayat: editFormData.gramPanchayat,
        principalName: editFormData.principalName,
        principalMobile: editFormData.principalMobile,
        establishmentYear: Number(editFormData.establishmentYear) || 1995,
        block: editFormData.block,
        district: editFormData.district,
      },
      school.udise
    );
    setIsEditModalOpen(false);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs no-print">
        <div className="flex items-center gap-3">
          {!isSchoolRestricted && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#1E2B25] border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>संकुल विद्यालय सूची</span>
            </button>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                {isSchoolRestricted ? 'मेरे विद्यालय का संपूर्ण विवरण (School Profile & Data)' : 'विद्यालय प्रोफाइल व विवरण'}
              </h2>
              <span className="bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                सत्र {selectedSessionId}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              यूडाइस कोड: <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{school.udise}</span> • संकुल: मलगुवां
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {isFeatureEnabled('module.schools.sub.profile_details') && (
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-3.5 py-2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold rounded-xl border border-purple-200 dark:border-purple-800 hover:bg-purple-100 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
            >
              <History className="w-3.5 h-3.5" />
              <span>विद्यालय इतिहास देखें</span>
            </button>
          )}

          {isHistoricalSession ? (
            <button
              disabled
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 cursor-not-allowed"
              title="अभिलेखीय / विगत सत्र में डेटा संशोधन प्रतिबंधित है (केवल अवलोकन)"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>अभिलेखीय सत्र (संशोधन प्रतिबंधित)</span>
            </button>
          ) : isFeatureEnabled('module.schools.action.edit') ? (
            <button
              onClick={() => {
                setEditFormData({
                  udise: school.udise,
                  name: school.name,
                  hindiName: school.hindiName || school.name,
                  schoolType: school.schoolType,
                  village: school.village,
                  gramPanchayat: school.gramPanchayat,
                  principalName: school.principalName,
                  principalMobile: school.principalMobile,
                  establishmentYear: String(school.establishmentYear || '1995'),
                  block: school.block || 'टीकमगढ़',
                  district: school.district || 'टीकमगढ़',
                });
                setIsEditModalOpen(true);
              }}
              className="px-3 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>विवरण संशोधित करें</span>
            </button>
          ) : null}

          {isFeatureEnabled('module.schools.action.print_export') && (
            <>
              <UnifiedPrintButton
                id="school-profile-unified-print"
                onPrintCurrentView={handlePrintDossier}
                onPrintReport={() => setIsExportModalOpen(true)}
                currentViewLabel="Print Dossier (Current School)"
                currentViewSubtext="इस विद्यालय का संपूर्ण डोजियर व विवरण प्रिंट करें"
                reportLabel="Print Report (Smart Export)"
                reportSubtext="शाला महा-डोजियर / आधिकारिक A4 स्मार्ट रिपोर्ट प्रारूप"
                buttonLabel="Print"
              />

              <button
                onClick={handleExportDossier}
                className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>एक्सेल डोजियर</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. Historical Session Summary Banner (Requirement 7) */}
      <HistoricalSessionBanner
        schoolName={school.hindiName || school.name}
        schoolUdise={school.udise}
        onOpenHistory={() => {
          setActiveTab('HISTORY');
        }}
      />

      {/* 3. Official Verified Identity Banner */}
      <SchoolBanner
        schoolName={school.name}
        hindiName={school.hindiName}
        udise={school.udise}
        village={school.village}
        gramPanchayat={school.gramPanchayat}
        block={school.block}
        district={school.district}
        schoolType={school.schoolType}
        principalName={school.principalName}
        principalMobile={school.principalMobile}
      />

      {/* 4. Navigation Tabs */}
      <div className="bg-white dark:bg-[#17211C] p-2 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap gap-1.5 text-xs no-print">
        {[
          { id: 'OVERVIEW' as ProfileTab, label: 'सामान्य एवं भौगोलिक विवरण (Overview)', icon: Building2 },
          { id: 'ACADEMIC_ADMIN' as ProfileTab, label: 'शैक्षणिक व प्रशासनिक व्यवस्था', icon: BookOpen },
          { id: 'STUDENTS' as ProfileTab, label: `नामांकित छात्र विवरण (${schoolStudents.length})`, icon: GraduationCap },
          { id: 'STAFF' as ProfileTab, label: `शिक्षक एवं स्टाफ (${schoolStaff.length})`, icon: Users },
          { id: 'FACILITIES' as ProfileTab, label: `भौतिक अधोसंरचना (${schoolFacilities.length})`, icon: ShieldCheck },
          { id: 'MDM_ATTENDANCE' as ProfileTab, label: 'मध्याह्न भोजन (MDM) व उपस्थिति', icon: Utensils },
          { id: 'HISTORY' as ProfileTab, label: `विद्यालय इतिहास (${schoolHistoryEntries.filter(e => e.hasData).length} सत्र)`, icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT: 1. OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-5">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">कुल नामांकित छात्र</span>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
                {schoolStudents.length}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                बालक: {boysCount} | बालिका: {girlsCount}
              </span>
            </div>

            <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">पदस्थ शिक्षक व स्टाफ</span>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
                {schoolStaff.length}
              </div>
              <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
                स्वीकृत पद: {Math.max(schoolStaff.length, 2)}
              </span>
            </div>

            <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">भौतिक सुविधाएं (मानक)</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                {schoolFacilities.filter(f => f.available === 'YES').length} / {schoolFacilities.length || 16}
              </div>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-semibold mt-1 block">
                16 सूत्रीय शासकीय चेकलिस्ट
              </span>
            </div>

            <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933]">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">वर्तमान सत्र स्थिति</span>
              <div className="text-2xl sm:text-3xl font-black text-[#FF7A00] mt-1">
                {selectedSessionId}
              </div>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 block">
                मान्यता व रिकॉर्ड अद्यतन
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. Administrative & Geographical Details */}
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#0B6B4B]" />
                  <span>1. प्रशासनिक एवं भौगोलिक विवरण (Location & Profile)</span>
                </span>
                <span className="text-[11px] text-gray-400">RSK / UDISE+</span>
              </h3>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">यूडाइस कोड (UDISE Code):</span>
                  <span className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    {school.udise}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">विद्यालय का नाम (School Name):</span>
                  <span className="font-bold text-gray-900 dark:text-white">{school.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">हिंदी नाम (Hindi Name):</span>
                  <span className="font-bold text-gray-900 dark:text-white">{school.hindiName || school.name}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">शाला प्रकार / श्रेणी (Type):</span>
                  <span className="font-bold text-gray-900 dark:text-white">{school.schoolType}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">प्रबंधन विभाग (Management):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">स्कूल शिक्षा विभाग, मध्य प्रदेश शासन</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">ग्राम / मजरा (Village):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{school.village}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">ग्राम पंचायत (Gram Panchayat):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{school.gramPanchayat}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">विकासखंड (Block):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{school.block || 'टीकमगढ़'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">जिला व राज्य (District & State):</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{school.district || 'टीकमगढ़'}, मध्य प्रदेश</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-gray-500 dark:text-gray-400">पिन कोड (PIN Code):</span>
                  <span className="font-mono font-semibold text-gray-900 dark:text-white">472001</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-gray-500 dark:text-gray-400">जन शिक्षा केंद्र (संकुल):</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">मलगुवां (टीकमगढ़)</span>
                </div>
              </div>
            </div>

            {/* 2. Contact & Demographic Distribution */}
            <div className="space-y-5">
              {/* Contact Information Card */}
              <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span>2. संस्था प्रधान एवं संपर्क सूत्र (Contact Info)</span>
                </h3>
                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">संस्था प्रधान / प्रभारी का नाम:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{school.principalName}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">प्रधान मोबाइल नंबर:</span>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      {school.principalMobile ? `+91 ${school.principalMobile}` : 'दर्ज नहीं है'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                    <span className="text-gray-500 dark:text-gray-400">शासकीय ईमेल पता:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      school.{school.udise}@mp.gov.in
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-gray-500 dark:text-gray-400">स्थापना वर्ष:</span>
                    <span className="font-bold text-gray-900 dark:text-white">{school.establishmentYear || '1995'}</span>
                  </div>
                </div>
              </div>

              {/* Social Category Breakdown */}
              <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    <span>3. सामाजिक वर्ग अनुसार छात्र संख्या (Demographics)</span>
                  </span>
                  <span className="text-xs font-bold text-gray-500">कुल: {schoolStudents.length}</span>
                </h3>

                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-900">
                    <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block">SC</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">{scCount}</span>
                  </div>
                  <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900">
                    <span className="text-[11px] font-bold text-blue-800 dark:text-blue-300 block">ST</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">{stCount}</span>
                  </div>
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-900">
                    <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">OBC</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">{obcCount}</span>
                  </div>
                  <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-100 dark:border-purple-900">
                    <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 block">General</span>
                    <span className="text-lg font-black text-gray-900 dark:text-white">{genCount}</span>
                  </div>
                </div>

                {cwsnCount > 0 && (
                  <div className="mt-3 p-2 bg-rose-50 dark:bg-rose-950/30 rounded-lg text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center justify-between">
                    <span>दिव्यांग (CWSN) विद्यार्थी:</span>
                    <span className="font-black">{cwsnCount} छात्र</span>
                  </div>
                )}
              </div>

              {/* Multi-Year Academic History Summary Card (Requirement 1 & 6) */}
              <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs lg:col-span-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-[#0B6B4B]" />
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                      विद्यालय का बहु-वर्षीय शैक्षणिक इतिहास (Academic Sessions Timeline)
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('HISTORY')}
                    className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                  >
                    <span>संपूर्ण समयरेखा व डेटा देखें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  {schoolHistoryEntries.map((entry) => (
                    <button
                      key={entry.sessionId}
                      onClick={() => setActiveTab('HISTORY')}
                      className={`px-3 py-2 rounded-xl font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                        entry.isCurrentSelected
                          ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                          : entry.hasData
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-gray-50 dark:bg-gray-800/40 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="font-mono">सत्र {entry.sessionId}</span>
                      {entry.hasData ? (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            entry.isCurrentSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 font-bold'
                          }`}
                        >
                          {entry.totalRecords} अभिलेख
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-400">रिक्त</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 2. ACADEMIC & ADMINISTRATIVE */}
      {activeTab === 'ACADEMIC_ADMIN' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#0B6B4B]" />
              <span>शैक्षणिक व्यवस्था (Academic Structure)</span>
            </h3>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">शिक्षा का माध्यम (Medium):</span>
                <span className="font-bold text-gray-900 dark:text-white">हिंदी (Hindi Medium)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">संबद्ध बोर्ड (Affiliation):</span>
                <span className="font-bold text-gray-900 dark:text-white">मध्य प्रदेश माध्यमिक शिक्षा मंडल (MPBSE)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">सक्रिय शैक्षणिक सत्र:</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">2026-2027</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">कक्षाएं (Classes Taught):</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {school.schoolType.includes('Primary') || school.schoolType === 'PS' ? 'कक्षा 1 से 5 तक' : 'कक्षा 6 से 8 तक (MS) / 9 से 12 (HS)'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-gray-400">पाठ्यपुस्तक व गणवेश वितरण:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">100% पूर्ण एवं अद्यतन</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-purple-600" />
              <span>प्रशासनिक व वित्तीय विवरण (SMC & Grants)</span>
            </h3>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">शाला प्रबंधन समिति (SMC):</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">सक्रिय व गठित (Constitutional)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">SMC खाता संख्या:</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">SBI Tikamgarh (A/C: ****4892)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">समग्र शिक्षा कंपोजिट ग्रांट स्थिति:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">सत्र {selectedSessionId} उपयोगिता प्रमाण पत्र प्रेषित</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-gray-400">विभागीय निरीक्षण स्थिति:</span>
                <span className="font-semibold text-gray-900 dark:text-white">जन शिक्षक (CAC) द्वारा नियमित सत्यापित</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 3. STUDENTS */}
      {activeTab === 'STUDENTS' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                नामांकित विद्यार्थियों का विवरण (कुल छात्र: {schoolStudents.length})
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                सत्र {selectedSessionId} • समग्र एवं आधार सत्यापन सूची
              </p>
            </div>
            {onNavigateToStudent && (
              <button
                onClick={() => onNavigateToStudent()}
                className="bg-[#0B6B4B] hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                छात्र मॉड्यूल खोलें →
              </button>
            )}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-2.5 font-bold">क्र.</th>
                  <th className="p-2.5 font-bold">समग्र आईडी</th>
                  <th className="p-2.5 font-bold">विद्यार्थी का नाम</th>
                  <th className="p-2.5 font-bold">पिता का नाम</th>
                  <th className="p-2.5 font-bold">कक्षा</th>
                  <th className="p-2.5 font-bold">लिंग</th>
                  <th className="p-2.5 font-bold">सामाजिक वर्ग</th>
                  <th className="p-2.5 font-bold">CWSN</th>
                  <th className="p-2.5 font-bold">प्रवेश क्रमांक</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {schoolStudents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-gray-400">
                      इस विद्यालय में अभी कोई छात्र दर्ज नहीं है
                    </td>
                  </tr>
                ) : (
                  schoolStudents.map((st, idx) => (
                    <tr key={st.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="p-2.5 text-gray-400">{idx + 1}</td>
                      <td className="p-2.5 font-mono font-semibold text-blue-600 dark:text-blue-400">{st.samagraId}</td>
                      <td className="p-2.5 font-bold text-gray-900 dark:text-white">{st.name}</td>
                      <td className="p-2.5 text-gray-600 dark:text-gray-300">{st.fatherName}</td>
                      <td className="p-2.5 font-bold text-[#0B6B4B] dark:text-emerald-400">{st.class}</td>
                      <td className="p-2.5">{st.gender}</td>
                      <td className="p-2.5">
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-medium">
                          {st.category}
                        </span>
                      </td>
                      <td className="p-2.5">{st.isCwsn ? 'हाँ (CWSN)' : 'नहीं'}</td>
                      <td className="p-2.5 font-mono text-gray-500">{st.scholarNo || 'SR-01'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 4. STAFF */}
      {activeTab === 'STAFF' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                पदस्थ शिक्षक एवं स्टाफ विवरण (कुल स्टाफ: {schoolStaff.length})
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                ई-सेवा पुस्तिका व मानव संपदा पोर्टल विवरण
              </p>
            </div>
            {onNavigateToStaff && (
              <button
                onClick={() => onNavigateToStaff()}
                className="bg-[#0B6B4B] hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                स्टाफ मॉड्यूल खोलें →
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {schoolStaff.length === 0 ? (
              <div className="col-span-2 py-8 text-center text-gray-400">
                इस विद्यालय में अभी कोई स्टाफ दर्ज नहीं है
              </div>
            ) : (
              schoolStaff.map((stf) => (
                <div
                  key={stf.id}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0F1713] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        कर्मचारी कोड: {stf.employeeId || stf.employeeCode || '-'}
                      </span>
                      <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                        {stf.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                      {stf.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      पद: <strong className="text-gray-700 dark:text-gray-200">{stf.designation}</strong> | विषय: {stf.subject}
                    </p>
                    <div className="mt-2 text-xs space-y-1 text-gray-600 dark:text-gray-300">
                      <div>📞 मोबाइल: <span className="font-mono">{stf.mobile}</span></div>
                      <div>🎓 शैक्षणिक योग्यता: {stf.qualification || 'B.Ed, D.El.Ed, M.A.'}</div>
                      <div>📅 संस्था में पदस्थापना: {stf.joiningDate || '15/07/2016'}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 5. FACILITIES (16 KEY INFRASTRUCTURE CHECKLIST) */}
      {activeTab === 'FACILITIES' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                भौतिक अधोसंरचना एवं सुविधाएं (16 सूत्रीय शासकीय चेकलिस्ट)
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                शासकीय यूडाइस+ एवं राज्य शिक्षा केंद्र मानकों अनुसार वास्तविक स्थिति
              </p>
            </div>
            {onNavigateToFacilities && (
              <button
                onClick={() => onNavigateToFacilities()}
                className="bg-[#0B6B4B] hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                सुविधाएं मॉड्यूल खोलें →
              </button>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {schoolFacilities.map((fac) => {
              const isYes = fac.available === 'YES';
              const isNo = fac.available === 'NO';
              const isUnknown = fac.available === 'UNKNOWN';

              return (
                <div
                  key={fac.facilityKey}
                  className="p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#0F1713] flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white block">
                      {fac.facilityName}
                    </span>
                    {fac.remarks && (
                      <span className="text-[11px] text-gray-500 block">{fac.remarks}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isYes && (
                      <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> उपलब्ध (YES)
                      </span>
                    )}
                    {isNo && (
                      <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> अनुपलब्ध (NO)
                      </span>
                    )}
                    {isUnknown && (
                      <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold px-2.5 py-1 rounded flex items-center gap-1">
                        <HelpCircle className="w-3.5 h-3.5" /> Data Not Entered
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT: 6. MDM & ATTENDANCE */}
      {activeTab === 'MDM_ATTENDANCE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                मध्याह्न भोजन (MDM) स्थिति
              </h3>
              {onNavigateToMDM && (
                <button
                  onClick={() => onNavigateToMDM()}
                  className="text-xs text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  MDM विवरण →
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">भोजन पकाने वाली एजेंसी:</span>
                <span className="font-bold text-gray-900 dark:text-white">स्व-सहायता समूह / रसोईया दल</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">कुल पात्र छात्र:</span>
                <span className="font-bold text-gray-900 dark:text-white">{schoolStudents.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">किचन शेड स्थिति:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">उपलब्ध व सक्रिय</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-gray-400">मीनू अनुसार दैनिक वितरण:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">नियमित रूप से चालू</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                उपस्थिति मॉनिटरिंग
              </h3>
              {onNavigateToAttendance && (
                <button
                  onClick={() => onNavigateToAttendance()}
                  className="text-xs text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  उपस्थिति दर्ज करें →
                </button>
              )}
            </div>
            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">दैनिक छात्र उपस्थिति ट्रैकिंग:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">सक्रिय (Live)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">शिक्षक दैनिक उपस्थिति:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">एम-शिक्षा मित्र पोर्टल अनुसार</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500 dark:text-gray-400">औसत उपस्थिति दर:</span>
                <span className="font-black text-gray-900 dark:text-white">88.5%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: 7. SCHOOL HISTORY (Requirement 1) */}
      {activeTab === 'HISTORY' && (
        <SchoolHistoryView school={school} />
      )}

      {/* Edit School Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#17211C] w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden animate-in zoom-in-95">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-[#0B6B4B]" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                  विद्यालय मूल विवरण संशोधन
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                {/* UDISE Code Field */}
                <div className="col-span-2 bg-gray-50 dark:bg-[#111A16] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>यूडाइस कोड (UDISE Code)</span>
                      {!isAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 font-normal">
                          <Lock className="w-2.5 h-2.5" />
                          <span>केवल एडमिन द्वारा संपादन योग्य (Admin Only)</span>
                        </span>
                      )}
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 font-normal">
                          <span>प्रशासक संपादन सक्रिय</span>
                        </span>
                      )}
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editFormData.udise}
                    onChange={(e) => setEditFormData({ ...editFormData, udise: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full px-3 py-2 rounded-xl border font-mono font-bold ${
                      !isAdmin
                        ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#17211C] border-blue-300 dark:border-blue-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500'
                    }`}
                    maxLength={11}
                    required
                  />
                  {!isAdmin && (
                    <p className="text-[10.5px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-amber-500 inline shrink-0" />
                      <span>शाला पहचान सुरक्षा: यूडाइस कोड शासकीय पहचान है तथा केवल अधिकृत एडमिन द्वारा ही संशोधित किया जा सकता है।</span>
                    </p>
                  )}
                  {isAdmin && (
                    <p className="text-[10.5px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 inline shrink-0" />
                      <span>यूडाइस कोड परिवर्तित करने पर सभी संबंधित छात्र, शिक्षक, एमडीएम एवं उपस्थिति रिकॉर्ड स्वतः माइग्रेट होंगे।</span>
                    </p>
                  )}
                </div>

                {/* School Name (English) */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>विद्यालय का नाम (School Name - English)</span>
                      {!isAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                          <Lock className="w-2.5 h-2.5" />
                          <span>(स्थिर पहचान - केवल एडमिन)</span>
                        </span>
                      )}
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      !isAdmin
                        ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#17211C] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                    }`}
                    required
                  />
                </div>

                {/* Hindi Name */}
                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                      <span>हिंदी नाम (Hindi Name)</span>
                      {!isAdmin && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                          <Lock className="w-2.5 h-2.5" />
                          <span>(स्थिर पहचान - केवल एडमिन)</span>
                        </span>
                      )}
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editFormData.hindiName}
                    onChange={(e) => setEditFormData({ ...editFormData, hindiName: e.target.value })}
                    disabled={!isAdmin}
                    className={`w-full px-3 py-2 rounded-xl border ${
                      !isAdmin
                        ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-white dark:bg-[#17211C] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    संस्था प्रधान / प्रभारी का नाम
                  </label>
                  <input
                    type="text"
                    value={editFormData.principalName}
                    onChange={(e) => setEditFormData({ ...editFormData, principalName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111A16] text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    प्रधान मोबाइल नंबर
                  </label>
                  <input
                    type="text"
                    value={editFormData.principalMobile}
                    onChange={(e) => setEditFormData({ ...editFormData, principalMobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111A16] text-gray-900 dark:text-white font-mono"
                    maxLength={10}
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ग्राम / मजरा
                  </label>
                  <input
                    type="text"
                    value={editFormData.village}
                    onChange={(e) => setEditFormData({ ...editFormData, village: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111A16] text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                    ग्राम पंचायत
                  </label>
                  <input
                    type="text"
                    value={editFormData.gramPanchayat}
                    onChange={(e) => setEditFormData({ ...editFormData, gramPanchayat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#111A16] text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#0B6B4B] hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>विवरण सुरक्षित करें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Dossier Modal */}
      <PrintDossierModal
        isOpen={isPrintDossierOpen}
        onClose={() => setIsPrintDossierOpen(false)}
        school={school}
        students={schoolStudents}
        staff={schoolStaff}
        facilities={schoolFacilities}
        attendance={schoolAttendance}
        mdmRecords={schoolMDM}
      />

      {/* Smart Export Modal */}
      <SmartExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType="COMPLETE_SCHOOL"
        initialUdise={school.udise}
      />

      {/* School Academic History Modal (Requirement 1) */}
      <SchoolHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        school={school}
      />
    </div>
  );
};
