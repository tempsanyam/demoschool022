import React, { useState, useMemo } from 'react';
import {
  Calendar,
  History,
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Utensils,
  AlertCircle,
  Search,
  ArrowUpDown,
  Download,
  Printer,
  Eye,
  ArrowRight,
  ShieldAlert,
  Building2,
  FileSpreadsheet,
  Layers,
  FileCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { School, SchoolAcademicHistoryEntry } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';
import { triggerPrint } from '../../utils/printUtils';
import { institutionConfig } from '../../config/institutionConfig';

interface SchoolHistoryViewProps {
  school: School;
  onSelectSession?: (sessionId: string) => void;
  compact?: boolean;
}

type FilterType = 'ALL' | 'DATA_AVAILABLE' | 'NO_DATA' | 'ACTIVE' | 'ARCHIVED' | 'CLOSED';
type SortOrder = 'NEWEST' | 'OLDEST';

export const SchoolHistoryView: React.FC<SchoolHistoryViewProps> = ({
  school,
  onSelectSession,
  compact = false,
}) => {
  const {
    getSchoolAcademicHistory,
    selectedSessionId,
    setSelectedSessionId,
    activeSessionId,
  } = useData();

  const { currentUser } = useAuth();
  const isSchoolRestricted = currentUser?.role === 'SCHOOL';
  const isUnauthorized =
    isSchoolRestricted &&
    Boolean(currentUser?.assignedSchoolUdise) &&
    school.udise !== currentUser?.assignedSchoolUdise;

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [sortOrder, setSortOrder] = useState<SortOrder>('NEWEST');
  const [sessionSwitchSuccess, setSessionSwitchSuccess] = useState<string | null>(null);

  // Dynamically compute all session history records for this school
  const allHistoryEntries: SchoolAcademicHistoryEntry[] = useMemo(() => {
    if (isUnauthorized) return [];
    try {
      return getSchoolAcademicHistory(school.udise);
    } catch (err) {
      console.error('Failed to load school academic history:', err);
      return [];
    }
  }, [getSchoolAcademicHistory, school.udise, isUnauthorized]);

  // Aggregate stats
  const totalSessionsCount = allHistoryEntries.length;
  const sessionsWithDataCount = allHistoryEntries.filter((e) => e.hasData).length;
  const totalStudentsEverRecorded = allHistoryEntries.reduce((acc, curr) => acc + curr.studentsCount, 0);
  const totalHistoricalRecordsCount = allHistoryEntries.reduce((acc, curr) => acc + curr.totalRecords, 0);

  // Filter & Search & Sort
  const filteredEntries = useMemo(() => {
    let list = [...allHistoryEntries];

    // Search filter
    if (searchTerm && searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (e) =>
          (e.sessionId || '').toLowerCase().includes(q) ||
          (e.sessionName || '').toLowerCase().includes(q) ||
          Boolean(e.remarks && e.remarks.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filterType === 'DATA_AVAILABLE') {
      list = list.filter((e) => e.hasData);
    } else if (filterType === 'NO_DATA') {
      list = list.filter((e) => !e.hasData);
    } else if (filterType === 'ACTIVE') {
      list = list.filter((e) => e.status === 'ACTIVE');
    } else if (filterType === 'ARCHIVED') {
      list = list.filter((e) => e.status === 'ARCHIVED');
    } else if (filterType === 'CLOSED') {
      list = list.filter((e) => e.status === 'CLOSED');
    }

    // Sort order
    list.sort((a, b) => {
      const startYearA = parseInt(a.sessionId.split('-')[0], 10) || 0;
      const startYearB = parseInt(b.sessionId.split('-')[0], 10) || 0;
      return sortOrder === 'NEWEST' ? startYearB - startYearA : startYearA - startYearB;
    });

    return list;
  }, [allHistoryEntries, searchTerm, filterType, sortOrder]);

  const handleSwitchSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSessionSwitchSuccess(sessionId);
    setTimeout(() => {
      setSessionSwitchSuccess(null);
    }, 4000);
    if (onSelectSession) {
      onSelectSession(sessionId);
    }
  };

  const handleExportExcel = () => {
    if (isUnauthorized) return;

    const headers = [
      'शैक्षणिक सत्र (Session)',
      'सत्र स्थिति (Status)',
      'शाला संचालन स्थिति (Operational Status)',
      'डिजिटल डेटा उपलब्धता (Data Availability)',
      'कुल विद्यार्थी (Students)',
      'सक्रिय विद्यार्थी (Active Students)',
      'प्रोन्नत विद्यार्थी (Promoted Students)',
      'पदस्थ स्टाफ संख्या (Staff Count)',
      'उपस्थिति रिकॉर्ड स्थिति (Attendance)',
      'मध्याह्न भोजन रिकॉर्ड (MDM)',
      'भौतिक अधोसंरचना (Facilities)',
      'शासकीय कार्य (Govt Work)',
      'कुल अभिलेख संख्या (Total Records)',
      'अंतिम गतिविधि दिनांक (Last Activity)',
      'विवरण / रिमार्क (Remarks)',
    ];

    const rows = filteredEntries.map((e) => [
      e.sessionId,
      e.status === 'ACTIVE'
        ? 'सक्रिय सत्र'
        : e.status === 'ARCHIVED'
        ? 'अभिलेखीय'
        : e.status === 'CLOSED'
        ? 'बंद सत्र'
        : e.status === 'UPCOMING'
        ? 'आगामी'
        : e.status,
      e.operationalLabel || 'सत्र में शाला संचालित',
      e.hasData ? 'डेटा उपलब्ध' : 'कोई डेटा नहीं',
      e.studentsCount,
      e.activeStudentsCount,
      e.promotedStudentsCount,
      e.staffCount,
      e.hasAttendance ? `${e.attendanceRecordsCount} रिकॉर्ड्स दर्ज` : 'अनुपलब्ध',
      e.hasMDM ? `${e.mdmRecordsCount} रिकॉर्ड्स दर्ज` : 'अनुपलब्ध',
      e.hasFacilities ? 'भौतिक सुविधाएं दर्ज' : 'अनुपलब्ध',
      e.govWorkCount,
      e.totalRecords,
      e.lastActivityDate || '-',
      e.remarks || '-',
    ]);

    exportToExcel({
      title: `विद्यालय बहु-सत्र शैक्षणिक इतिहास: ${school.hindiName || school.name}`,
      subtitle: `यूडाइस: ${school.udise} | संकुल: मलगुवां | कुल सत्र: ${filteredEntries.length}`,
      schoolName: school.hindiName || school.name,
      udise: school.udise,
      headers,
      rows,
      fileName: `School_History_${school.udise}_${new Date().toISOString().slice(0, 10)}`,
    });
  };

  const handlePrintHistory = () => {
    if (isUnauthorized) return;
    const printEl = document.getElementById('school-history-printable-dossier');
    if (printEl) {
      triggerPrint(printEl, { orientation: 'landscape' });
    } else {
      window.print();
    }
  };

  if (isUnauthorized) {
    return (
      <div className="p-8 text-center bg-white dark:bg-[#17211C] rounded-2xl border border-rose-200 dark:border-rose-900 shadow-sm">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-3" />
        <h3 className="text-base font-black text-rose-900 dark:text-rose-200">
          अनधिकृत पहुंच (Unauthorized Access Denied)
        </h3>
        <p className="text-xs text-rose-700 dark:text-rose-300 mt-2 max-w-md mx-auto">
          आपके लॉगिन खाते को केवल अपने अधिकृत विद्यालय (यूडाइस: {currentUser?.assignedSchoolUdise}) का इतिहास देखने व मुद्रित/निर्यात करने की अनुमति है। अन्य विद्यालयों का इतिहास अभिगम प्रतिबंधित है।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header & Quick Summary */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                विद्यालय इतिहास व बहु-सत्र अभिलेख (School Academic History)
              </h3>
              <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                कुल उपलब्ध सत्र: {sessionsWithDataCount} / {totalSessionsCount}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              यह विद्यालय निम्न शैक्षणिक सत्रों में सिस्टम में उपलब्ध है। किसी भी सत्र के विवरण का अवलोकन करने हेतु संबंधित सत्र पर क्लिक करें।
            </p>
            <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
              विद्यालय: <strong>{school.hindiName || school.name}</strong> • यूडाइस: <strong className="font-mono">{school.udise}</strong> • प्रकार: {school.schoolType}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0 no-print">
            <button
              onClick={handlePrintHistory}
              className="px-3.5 py-2 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>प्रिंट इतिहास</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 hover:bg-emerald-100 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>एक्सेल निर्यात</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stat Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="bg-gray-50 dark:bg-[#1A2621] p-3 rounded-xl border border-gray-200 dark:border-gray-800">
            <span className="text-gray-500 dark:text-gray-400 block text-[11px]">सिस्टम में कुल सत्र</span>
            <strong className="text-base font-black text-gray-900 dark:text-white font-mono">{totalSessionsCount}</strong>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
            <span className="text-emerald-700 dark:text-emerald-400 block text-[11px]">डेटा उपलब्ध सत्र</span>
            <strong className="text-base font-black text-emerald-800 dark:text-emerald-200 font-mono">{sessionsWithDataCount} सत्र</strong>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200 dark:border-blue-800/60">
            <span className="text-blue-700 dark:text-blue-400 block text-[11px]">वर्तमान चयनित सत्र</span>
            <strong className="text-base font-black text-blue-900 dark:text-blue-200 font-mono">{selectedSessionId}</strong>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60">
            <span className="text-amber-800 dark:text-amber-400 block text-[11px]">कुल दर्ज अभिलेख</span>
            <strong className="text-base font-black text-amber-900 dark:text-amber-200 font-mono">{totalHistoricalRecordsCount} प्रविष्टियां</strong>
          </div>
        </div>
      </div>

      {/* Session Switch Success Alert */}
      {sessionSwitchSuccess && (
        <div className="p-3.5 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0B6B4B] shrink-0" />
            <span>
              शैक्षणिक सत्र <strong>{sessionSwitchSuccess}</strong> सफलतापूर्वक चुना गया। समस्त मॉड्यूल (छात्र, शिक्षक, उपस्थिति, एमडीएम आदि) अब इसी सत्र के डेटा के अनुसार प्रदर्शित हो रहे हैं।
            </span>
          </div>
          <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 rounded text-[10px]">
            सक्रिय
          </span>
        </div>
      )}

      {/* 2. Search, Filters & Sorting Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-3 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-col md:flex-row items-center justify-between gap-3 no-print">
        <div className="flex items-center gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="सत्र खोजें (उदा. 2018-19, 2026)..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#1E2B25] border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-800 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {(
              [
                { id: 'ALL', label: 'सभी सत्र' },
                { id: 'DATA_AVAILABLE', label: `डेटा उपलब्ध (${sessionsWithDataCount})` },
                { id: 'NO_DATA', label: 'कोई डेटा नहीं' },
                { id: 'ACTIVE', label: 'सक्रिय' },
                { id: 'ARCHIVED', label: 'अभिलेखीय' },
                { id: 'CLOSED', label: 'बंद' },
              ] as { id: FilterType; label: string }[]
            ).map((flt) => (
              <button
                key={flt.id}
                onClick={() => setFilterType(flt.id)}
                className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  filterType === flt.id
                    ? 'bg-[#0B6B4B] text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {flt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
          <button
            onClick={() => setSortOrder(sortOrder === 'NEWEST' ? 'OLDEST' : 'NEWEST')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 cursor-pointer"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>क्रम: {sortOrder === 'NEWEST' ? 'नवीनतम → पुराना' : 'पुराना → नवीनतम'}</span>
          </button>
        </div>
      </div>

      {/* 3. Interactive Multi-Session Timeline */}
      {filteredEntries.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#17211C] rounded-2xl border border-gray-200 dark:border-gray-800">
          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
            चयनित खोज अथवा फ़िल्टर के अनुसार कोई शैक्षणिक सत्र नहीं मिला।
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterType('ALL');
            }}
            className="mt-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold cursor-pointer"
          >
            फ़िल्टर रीसेट करें
          </button>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-400 before:via-blue-300 before:to-gray-300 dark:before:from-emerald-700 dark:before:via-blue-800 dark:before:to-gray-700">
          {filteredEntries.map((entry) => {
            const isSelected = entry.isCurrentSelected;
            const isCurrentActive = entry.sessionId === activeSessionId;

            return (
              <div key={entry.sessionId} className="relative group">
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-4 w-4 h-4 rounded-full border-2 transition-all ${
                    isSelected
                      ? 'border-[#0B6B4B] bg-[#0B6B4B] ring-4 ring-emerald-200 dark:ring-emerald-950 scale-110'
                      : entry.hasData
                      ? 'border-emerald-500 bg-white dark:bg-gray-900 ring-2 ring-emerald-100 dark:ring-emerald-950'
                      : 'border-gray-400 bg-gray-200 dark:bg-gray-800'
                  }`}
                />

                {/* Session Card */}
                <div
                  className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-[#0B6B4B] shadow-md ring-1 ring-[#0B6B4B]'
                      : entry.hasData
                      ? 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-emerald-400 shadow-xs'
                      : 'bg-gray-50/70 dark:bg-[#121A16] border-gray-200 dark:border-gray-800 opacity-80'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800/80 pb-3">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-base sm:text-lg font-black font-mono text-gray-900 dark:text-white">
                        सत्र {entry.sessionId}
                      </span>

                      {/* Current Active or System Badge */}
                      {isCurrentActive && (
                        <span className="bg-[#0B6B4B] text-white text-[10.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                          वर्तमान सक्रिय सत्र
                        </span>
                      )}

                      {/* Status badge */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          entry.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : entry.status === 'ARCHIVED'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : entry.status === 'CLOSED'
                            ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {entry.status === 'ACTIVE'
                          ? 'सक्रिय (Active)'
                          : entry.status === 'ARCHIVED'
                          ? 'अभिलेखीय (Archived)'
                          : entry.status === 'CLOSED'
                          ? 'सत्र बंद (Closed)'
                          : entry.status === 'UPCOMING'
                          ? 'आगामी (Upcoming)'
                          : entry.status}
                      </span>

                      {/* Operational / Existence Status Badge (Requirement 11) */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          entry.operationalStatus === 'PRE_ESTABLISHMENT'
                            ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            : 'bg-slate-50 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                        title="विद्यालय स्थापना एवं संचालन स्थिति (डिजिटल डेटा से पृथक)"
                      >
                        {entry.operationalLabel || 'सत्र में शाला संचालित'}
                      </span>

                      {/* Data Availability Badge */}
                      {entry.hasData ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-[10.5px] font-bold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>डेटा उपलब्ध ({entry.totalRecords} अभिलेख)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 text-[10.5px] font-medium px-2 py-0.5 rounded-md">
                          <span>कोई डेटा उपलब्ध नहीं</span>
                        </span>
                      )}

                      {entry.isLockedOrArchived && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                          Read Only
                        </span>
                      )}
                    </div>

                    {/* Action Button: Switch or View */}
                    <div className="flex items-center gap-2 no-print self-end lg:self-auto">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-black shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>वर्तमान में चयनित सत्र</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSwitchSession(entry.sessionId)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ${
                            entry.hasData
                              ? 'bg-white dark:bg-[#1E2B25] text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 hover:border-[#0B6B4B] hover:text-[#0B6B4B]'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 text-[#0B6B4B]" />
                          <span>यह सत्र खोलें / डेटा देखें</span>
                          <ArrowRight className="w-3 h-3 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Metrics Breakdown Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3 text-xs">
                    {/* 1. Students */}
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1F2C26]/60 border border-gray-200/80 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mb-1">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>विद्यार्थी</span>
                      </div>
                      <div className="font-black text-sm text-gray-900 dark:text-white font-mono">
                        {entry.studentsCount}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {entry.studentsCount > 0
                          ? `सक्रिय: ${entry.activeStudentsCount} • प्रोन्नत: ${entry.promotedStudentsCount}`
                          : 'शून्य नामांकन'}
                      </div>
                    </div>

                    {/* 2. Staff */}
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1F2C26]/60 border border-gray-200/80 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mb-1">
                        <Users className="w-3.5 h-3.5 text-emerald-600" />
                        <span>पदस्थ स्टाफ</span>
                      </div>
                      <div className="font-black text-sm text-gray-900 dark:text-white font-mono">
                        {entry.staffCount}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {entry.staffCount > 0 ? 'शिक्षक पदस्थ' : 'कोई प्रविष्टि नहीं'}
                      </div>
                    </div>

                    {/* 3. Attendance */}
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1F2C26]/60 border border-gray-200/80 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mb-1">
                        <Clock className="w-3.5 h-3.5 text-purple-600" />
                        <span>उपस्थिति</span>
                      </div>
                      <div className="font-bold text-xs text-gray-800 dark:text-gray-200">
                        {entry.hasAttendance ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-black">उपलब्ध ({entry.attendanceRecordsCount})</span>
                        ) : (
                          <span className="text-gray-400 font-normal">उपलब्ध नहीं</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {entry.hasAttendance ? 'दैनिक उपस्थिति दर्ज' : 'रिकॉर्ड नहीं'}
                      </div>
                    </div>

                    {/* 4. MDM */}
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1F2C26]/60 border border-gray-200/80 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mb-1">
                        <Utensils className="w-3.5 h-3.5 text-amber-600" />
                        <span>मध्याह्न भोजन (MDM)</span>
                      </div>
                      <div className="font-bold text-xs text-gray-800 dark:text-gray-200">
                        {entry.hasMDM ? (
                          <span className="text-amber-700 dark:text-amber-300 font-black">उपलब्ध ({entry.mdmRecordsCount})</span>
                        ) : (
                          <span className="text-gray-400 font-normal">उपलब्ध नहीं</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {entry.hasMDM ? 'पोषण वितरण दर्ज' : 'रिकॉर्ड नहीं'}
                      </div>
                    </div>

                    {/* 5. Government Work */}
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1F2C26]/60 border border-gray-200/80 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mb-1">
                        <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                        <span>शासकीय कार्य</span>
                      </div>
                      <div className="font-black text-sm text-gray-900 dark:text-white font-mono">
                        {entry.govWorkCount}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {entry.govWorkCount > 0 ? 'आदेश/कार्य पूर्ण' : 'कोई कार्य नहीं'}
                      </div>
                    </div>

                    {/* 6. Facilities & Others */}
                    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#1F2C26]/60 border border-gray-200/80 dark:border-gray-800">
                      <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-[11px] mb-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>भौतिक अधोसंरचना</span>
                      </div>
                      <div className="font-bold text-xs text-gray-800 dark:text-gray-200">
                        {entry.hasFacilities ? (
                          <span className="text-emerald-700 dark:text-emerald-300 font-bold">सत्यापित दर्ज</span>
                        ) : (
                          <span className="text-gray-400 font-normal">अनुपलब्ध</span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5">
                        {entry.complaintsCount + entry.documentsCount > 0
                          ? `अभिलेख/SMC: ${entry.complaintsCount + entry.documentsCount}`
                          : 'मूल भौतिक विवरण'}
                      </div>
                    </div>
                  </div>

                  {/* Remarks & Last activity */}
                  {(entry.remarks || entry.lastActivityDate) && (
                    <div className="mt-2.5 pt-2 text-[11px] text-gray-500 dark:text-gray-400 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-800/60">
                      <span>{entry.remarks}</span>
                      {entry.lastActivityDate && (
                        <span className="font-mono text-[10.5px]">
                          अंतिम प्रविष्टि: {entry.lastActivityDate}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. HIDDEN PRINTABLE DOSSIER (Rendered only on print)                      */}
      {/* ========================================================================= */}
      <div id="school-history-printable-dossier" className="hidden print:block p-8 bg-white text-black">
        <div className="text-center border-b-2 border-black pb-4 mb-6">
          <h1 className="text-xl font-black tracking-tight">{institutionConfig.department}</h1>
          <h2 className="text-base font-bold">{institutionConfig.institutionName} ({institutionConfig.sankulName})</h2>
          <p className="text-xs mt-1">
            यूडाइस: {institutionConfig.diseCode}, विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district}, {institutionConfig.state} - {institutionConfig.pinCode}
          </p>
          <div className="mt-3 inline-block bg-gray-100 border border-black px-4 py-1 text-sm font-black uppercase">
            विद्यालय बहु-सत्र शैक्षणिक इतिहास एवं अभिलेख प्रतिवेदन
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-black p-3 mb-6 text-xs">
          <div>
            <div><strong>विद्यालय का नाम:</strong> {school.hindiName || school.name}</div>
            <div><strong>यूडाइस कोड:</strong> {school.udise}</div>
            <div><strong>शाला प्रकार:</strong> {school.schoolType}</div>
          </div>
          <div>
            <div><strong>ग्राम / मजरा:</strong> {school.village} (पं.: {school.gramPanchayat})</div>
            <div><strong>कुल उपलब्ध सत्र:</strong> {sessionsWithDataCount} (सिस्टम में दर्ज: {totalSessionsCount})</div>
            <div><strong>प्रतिवेदन तिथि:</strong> {new Date().toLocaleDateString('hi-IN')}</div>
          </div>
        </div>

        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100 text-center font-bold">
              <th className="border border-black p-2">सत्र</th>
              <th className="border border-black p-2">सत्र स्थिति</th>
              <th className="border border-black p-2">संचालन स्थिति</th>
              <th className="border border-black p-2">डिजिटल डेटा स्थिति</th>
              <th className="border border-black p-2">विद्यार्थी</th>
              <th className="border border-black p-2">स्टाफ</th>
              <th className="border border-black p-2">उपस्थिति</th>
              <th className="border border-black p-2">MDM</th>
              <th className="border border-black p-2">शासकीय कार्य</th>
              <th className="border border-black p-2">कुल अभिलेख</th>
              <th className="border border-black p-2">रिमार्क</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.map((e) => (
              <tr key={e.sessionId} className="text-center">
                <td className="border border-black p-1.5 font-bold font-mono">{e.sessionId}</td>
                <td className="border border-black p-1.5">{e.status}</td>
                <td className="border border-black p-1.5 text-[11px]">{e.operationalLabel || 'शाला संचालित'}</td>
                <td className="border border-black p-1.5 font-bold">
                  {e.hasData ? 'डेटा उपलब्ध' : 'डेटा अनुपलब्ध'}
                </td>
                <td className="border border-black p-1.5 font-mono">{e.studentsCount}</td>
                <td className="border border-black p-1.5 font-mono">{e.staffCount}</td>
                <td className="border border-black p-1.5">{e.hasAttendance ? `${e.attendanceRecordsCount} दर्ज` : '-'}</td>
                <td className="border border-black p-1.5">{e.hasMDM ? `${e.mdmRecordsCount} दर्ज` : '-'}</td>
                <td className="border border-black p-1.5 font-mono">{e.govWorkCount}</td>
                <td className="border border-black p-1.5 font-mono font-bold">{e.totalRecords}</td>
                <td className="border border-black p-1.5 text-left text-[11px]">{e.remarks || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-12 flex justify-between text-xs pt-8 border-t border-black">
          <div className="text-center">
            <p className="mt-8 font-bold">हस्ताक्षर संस्था प्रधान / प्रभारी</p>
            <p className="text-[10px]">{school.principalName || 'प्रधानाध्यापक'}</p>
          </div>
          <div className="text-center">
            <p className="mt-8 font-bold">हस्ताक्षर जनशिक्षक (CAC)</p>
            <p className="text-[10px]">{institutionConfig.cac1.name} (संकुल मलगुवां)</p>
          </div>
        </div>
      </div>
    </div>
  );
};
