import React, { useState, useMemo, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Filter,
  Search,
  School as SchoolIcon,
  GraduationCap,
  Users,
  Utensils,
  Eye,
  CheckCircle2,
  Clock,
  Palmtree,
  AlertTriangle,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Layers,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import {
  getDailyAttendanceMonitoring,
  SchoolAttendanceSummary,
  AttendanceStatusType,
  OverallSchoolStatusType
} from '../../services/dailyAttendanceMonitoringService';
import { SchoolAttendanceDetailModal } from './SchoolAttendanceDetailModal';
import { triggerPrint } from '../../utils/printUtils';
import { exportToExcel, ExportDataPayload } from '../../utils/exportUtils';

type MonitoringTab = 'COMBINED' | 'STUDENT' | 'STAFF' | 'RASOIYA';
type LowAttendanceRange = 'ALL' | 'ABOVE_90' | '75_89' | '50_74' | 'BELOW_50';

export const CacAttendanceMonitoringView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    schools,
    students,
    staff,
    rasoiya,
    attendance,
    mdm,
    selectedSessionId,
    isCurrentSessionSelected,
    isSessionLocked
  } = useData();
  const { isSchoolUser } = useSchoolScope();

  // Role Access Guard: Only CAC and ADMIN can access the CAC Monitoring Module
  const isAuthorized = currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN';

  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeTab, setActiveTab] = useState<MonitoringTab>('COMBINED');

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lowAttendanceFilter, setLowAttendanceFilter] = useState<LowAttendanceRange>('ALL');

  // Drill-down Modal State
  const [selectedSchoolSummary, setSelectedSchoolSummary] = useState<SchoolAttendanceSummary | null>(null);

  // Auto-align date on academic session switch
  useEffect(() => {
    if (isCurrentSessionSelected) {
      setSelectedDate(today);
    } else {
      const datesInSession = attendance
        .filter((a) => a.sessionId === selectedSessionId)
        .map((a) => a.date)
        .sort()
        .reverse();

      if (datesInSession.length > 0) {
        setSelectedDate(datesInSession[0]);
      } else {
        setSelectedDate(today);
      }
    }
  }, [selectedSessionId, isCurrentSessionSelected, attendance, today]);

  // Compute daily monitoring data using the central service
  const { globalSummary, schoolSummaries } = useMemo(() => {
    return getDailyAttendanceMonitoring({
      schools,
      students,
      staff,
      rasoiya,
      attendance,
      mdmRecords: mdm,
      selectedSessionId,
      selectedDate,
      schoolScope: schoolFilter
    });
  }, [schools, students, staff, rasoiya, attendance, mdm, selectedSessionId, selectedDate, schoolFilter]);

  // Filter schools based on search, status, and low attendance filters
  const filteredSchoolSummaries = useMemo(() => {
    return schoolSummaries.filter((item) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.hindiName.toLowerCase().includes(q) ||
        item.udise.includes(q) ||
        (item.village && item.village.toLowerCase().includes(q));

      // 2. Status Filter
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        if (activeTab === 'COMBINED') {
          matchStatus = item.overall.status === statusFilter;
        } else if (activeTab === 'STUDENT') {
          matchStatus = item.student.status === statusFilter;
        } else if (activeTab === 'STAFF') {
          matchStatus = item.staff.status === statusFilter;
        } else if (activeTab === 'RASOIYA') {
          matchStatus = item.rasoiya.status === statusFilter;
        }
      }

      // 3. Low Attendance Filter (applied according to active tab or student for combined)
      let matchLowAttendance = true;
      if (lowAttendanceFilter !== 'ALL') {
        let pct: number | null = null;
        let isHol = false;
        let isPend = false;

        if (activeTab === 'STUDENT' || activeTab === 'COMBINED') {
          pct = item.student.percentage;
          isHol = item.student.isHoliday;
          isPend = item.student.status === 'PENDING';
        } else if (activeTab === 'STAFF') {
          pct = item.staff.percentage;
          isHol = item.staff.isHoliday;
          isPend = item.staff.status === 'PENDING';
        } else if (activeTab === 'RASOIYA') {
          pct = item.rasoiya.percentage;
          isHol = item.rasoiya.isHoliday;
          isPend = item.rasoiya.status === 'PENDING';
        }

        // Holiday and pending are not counted in percentage brackets
        if (isHol || isPend || pct === null) {
          matchLowAttendance = false;
        } else if (lowAttendanceFilter === 'ABOVE_90') {
          matchLowAttendance = pct >= 90;
        } else if (lowAttendanceFilter === '75_89') {
          matchLowAttendance = pct >= 75 && pct < 90;
        } else if (lowAttendanceFilter === '50_74') {
          matchLowAttendance = pct >= 50 && pct < 75;
        } else if (lowAttendanceFilter === 'BELOW_50') {
          matchLowAttendance = pct < 50;
        }
      }

      return matchSearch && matchStatus && matchLowAttendance;
    });
  }, [schoolSummaries, searchQuery, statusFilter, lowAttendanceFilter, activeTab]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setSearchQuery('');
    setSchoolFilter('ALL');
    setStatusFilter('ALL');
    setLowAttendanceFilter('ALL');
  };

  // Quick filter click helper
  const handleQuickStatusClick = (status: OverallSchoolStatusType | 'ALL', tab: MonitoringTab = 'COMBINED') => {
    setActiveTab(tab);
    setStatusFilter(status);
    setLowAttendanceFilter('ALL');
  };

  // Helper for generating Excel Export
  const handleExportExcel = () => {
    const headers = [
      'क्र.',
      'शाला का नाम',
      'यूडाइस (UDISE)',
      'ग्राम',
      'संवर्ग',
      'विद्यार्थी कुल',
      'विद्यार्थी उपस्थित',
      'विद्यार्थी अनुपस्थित',
      'विद्यार्थी उपस्थिति %',
      'विद्यार्थी स्थिति',
      'स्टाफ कुल',
      'स्टाफ उपस्थित',
      'स्टाफ अनुपस्थित',
      'स्टाफ अवकाश',
      'स्टाफ ऑन ड्यूटी',
      'स्टाफ उपस्थिति %',
      'स्टाफ स्थिति',
      'रसोइया कुल',
      'रसोइया उपस्थित',
      'रसोइया अनुपस्थित',
      'रसोइया अवकाश',
      'रसोइया ऑन ड्यूटी',
      'रसोइया उपस्थिति %',
      'रसोइया स्थिति',
      'समग्र स्थिति'
    ];

    const rows = filteredSchoolSummaries.map((item, idx) => [
      idx + 1,
      item.name,
      item.udise,
      item.village || 'मलगुवां',
      item.schoolType,
      item.student.registered,
      item.student.isHoliday ? 'अवकाश' : item.student.present !== null ? item.student.present : 'लंबित',
      item.student.isHoliday ? '—' : item.student.absent !== null ? item.student.absent : '—',
      item.student.isHoliday ? '—' : item.student.percentage !== null ? `${item.student.percentage}%` : '—',
      item.student.isHoliday ? 'अवकाश' : item.student.status === 'SUBMITTED' ? 'जमा' : item.student.status === 'ERROR' ? 'डेटा त्रुटि' : 'लंबित',
      item.staff.total,
      item.staff.isHoliday ? 'अवकाश' : item.staff.present !== null ? item.staff.present : 'लंबित',
      item.staff.isHoliday ? '—' : item.staff.absent !== null ? item.staff.absent : '—',
      item.staff.isHoliday ? '—' : item.staff.leave !== null ? item.staff.leave : '—',
      item.staff.isHoliday ? '—' : item.staff.od !== null ? item.staff.od : '—',
      item.staff.isHoliday ? '—' : item.staff.percentage !== null ? `${item.staff.percentage}%` : '—',
      item.staff.isHoliday ? 'अवकाश' : item.staff.status === 'SUBMITTED' ? 'जमा' : 'लंबित',
      item.rasoiya.total,
      item.rasoiya.isHoliday ? 'अवकाश' : item.rasoiya.present !== null ? item.rasoiya.present : 'लंबित',
      item.rasoiya.isHoliday ? '—' : item.rasoiya.absent !== null ? item.rasoiya.absent : '—',
      item.rasoiya.isHoliday ? '—' : item.rasoiya.leave !== null ? item.rasoiya.leave : '—',
      item.rasoiya.isHoliday ? '—' : item.rasoiya.od !== null ? item.rasoiya.od : '—',
      item.rasoiya.isHoliday ? '—' : item.rasoiya.percentage !== null ? `${item.rasoiya.percentage}%` : '—',
      item.rasoiya.isHoliday ? 'अवकाश' : item.rasoiya.status === 'SUBMITTED' ? 'जमा' : 'लंबित',
      item.overall.label
    ]);

    const payload: ExportDataPayload = {
      title: 'जन शिक्षा केंद्र / संकुल मलगुवां - दैनिक उपस्थिति समग्र मॉनिटरिंग रिपोर्ट',
      subtitle: `दिनांक: ${selectedDate} | सत्र: ${selectedSessionId} | कुल शालाएं: ${filteredSchoolSummaries.length}`,
      session: selectedSessionId,
      headers,
      rows,
      fileName: `CAC_Daily_Attendance_Monitoring_${selectedDate}_${selectedSessionId}`
    };

    exportToExcel(payload);
  };

  // Helper for Print View
  const handlePrintCurrent = () => {
    triggerPrint();
  };

  // If user is SCHOOL role, deny access with security message
  if (!isAuthorized) {
    return (
      <div className="p-6 max-w-3xl mx-auto my-8 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-800 text-center space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-red-900 dark:text-red-200">
          पहुंच अस्वीकृत (Access Denied)
        </h2>
        <p className="text-sm text-red-700 dark:text-red-300">
          सुरक्षा नियंत्रण: "दैनिक उपस्थिति मॉनिटरिंग (CAC Panel)" मॉड्यूल केवल संकुल समन्वयक (CAC) एवं मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है।
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          आपकी वर्तमान लॉगिन भूमिका: <strong>{currentUser?.role === 'SCHOOL' ? 'संस्था प्रभारी (SCHOOL)' : currentUser?.role || 'अज्ञात'}</strong>।
          कृपया अपने विद्यालय की दैनिक उपस्थिति भरने या देखने हेतु "दैनिक उपस्थिति" मॉड्यूल का उपयोग करें।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-xl bg-[#0B6B4B] text-white shadow-xs">
              <CalendarCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              दैनिक उपस्थिति मॉनिटरिंग (CAC Monitoring Center)
            </h2>
            <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full font-mono">
              दिनांक: {selectedDate}
            </span>
            <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              सत्र: {selectedSessionId}
            </span>
            {isSessionLocked && (
              <span className="bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>सत्र लॉक (केवल पठन)</span>
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            जन शिक्षा केंद्र / संकुल मलगुवां | विकासखंड: बलदेवगढ़ | जिला: टीकमगढ़, मध्य प्रदेश
          </p>
        </div>

        {/* Action Buttons: Print & Excel */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>एक्सेल निर्यात (Excel Export)</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCurrent}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Printer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span>प्रिंट (Print)</span>
          </button>
        </div>
      </div>

      {/* 2. School Count Master Integrity Warning (if applicable) */}
      {!globalSummary.schoolIntegrity.isValid && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{globalSummary.schoolIntegrity.warningMessage}</span>
        </div>
      )}

      {/* 3. Global Overview Summary Cards (Responsive 4-Card Grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: School Submission Status */}
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400">
                <SchoolIcon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                संकुल शालाएं (School Status)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              कुल: {globalSummary.totalSchools}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <button
              type="button"
              onClick={() => handleQuickStatusClick('SUBMITTED')}
              className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 hover:border-emerald-300 transition-colors text-left"
            >
              <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {globalSummary.submittedSchools}
              </div>
              <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                पूर्ण जमा शालाएं
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusClick('PENDING')}
              className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 hover:border-amber-300 transition-colors text-left"
            >
              <div className="text-lg font-bold text-amber-700 dark:text-amber-400 font-mono">
                {globalSummary.pendingSchools}
              </div>
              <div className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                लंबित शालाएं
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusClick('PARTIAL')}
              className="p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 hover:border-blue-300 transition-colors text-left"
            >
              <div className="text-lg font-bold text-blue-700 dark:text-blue-400 font-mono">
                {globalSummary.partialSchools}
              </div>
              <div className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                आंशिक जमा
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickStatusClick('HOLIDAY')}
              className="p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900 hover:border-purple-300 transition-colors text-left"
            >
              <div className="text-lg font-bold text-purple-700 dark:text-purple-400 font-mono">
                {globalSummary.holidaySchools}
              </div>
              <div className="text-[11px] text-purple-800 dark:text-purple-300 font-medium">
                अवकाश शालाएं
              </div>
            </button>
          </div>
        </div>

        {/* Card 2: Student Global Attendance */}
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400">
                <GraduationCap className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                विद्यार्थी उपस्थिति (Students)
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-[#0B6B4B] dark:text-emerald-400 font-mono">
                {globalSummary.student.percentage !== null ? `${globalSummary.student.percentage}%` : '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-1.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
              <div className="font-bold text-gray-900 dark:text-white font-mono">
                {globalSummary.student.totalRegistered}
              </div>
              <div className="text-[10px] text-gray-500">कुल दर्ज</div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">
                {globalSummary.student.totalPresent}
              </div>
              <div className="text-[10px] text-emerald-700">उपस्थित</div>
            </div>
            <div className="p-1.5 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
              <div className="font-bold text-red-700 dark:text-red-400 font-mono">
                {globalSummary.student.totalAbsent}
              </div>
              <div className="text-[10px] text-red-700">अनुपस्थित</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
            <span>जमा: <strong className="text-emerald-600 font-mono">{globalSummary.student.submittedSchoolsCount}</strong></span>
            <span>लंबित: <strong className="text-amber-600 font-mono">{globalSummary.student.pendingSchoolsCount}</strong></span>
            <span>अवकाश: <strong className="text-purple-600 font-mono">{globalSummary.student.holidaySchoolsCount}</strong></span>
          </div>
        </div>

        {/* Card 3: Teacher & Staff Global Attendance */}
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                शिक्षक व स्टाफ (Staff)
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-blue-600 dark:text-blue-400 font-mono">
                {globalSummary.staff.percentage !== null ? `${globalSummary.staff.percentage}%` : '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div className="p-1 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
              <div className="font-bold text-gray-900 dark:text-white font-mono">{globalSummary.staff.totalStaff}</div>
              <div className="text-[9px] text-gray-500">पदस्थ</div>
            </div>
            <div className="p-1 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{globalSummary.staff.totalPresent}</div>
              <div className="text-[9px] text-emerald-700">उपस्थित</div>
            </div>
            <div className="p-1 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
              <div className="font-bold text-red-700 dark:text-red-400 font-mono">{globalSummary.staff.totalAbsent}</div>
              <div className="text-[9px] text-red-700">अनुपस्थित</div>
            </div>
            <div className="p-1 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
              <div className="font-bold text-amber-700 dark:text-amber-400 font-mono">{globalSummary.staff.totalLeave + globalSummary.staff.totalOd}</div>
              <div className="text-[9px] text-amber-700">Leave/OD</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
            <span>जमा: <strong className="text-emerald-600 font-mono">{globalSummary.staff.submittedSchoolsCount}</strong></span>
            <span>लंबित: <strong className="text-amber-600 font-mono">{globalSummary.staff.pendingSchoolsCount}</strong></span>
            <span>अवकाश: <strong className="text-purple-600 font-mono">{globalSummary.staff.holidaySchoolsCount}</strong></span>
          </div>
        </div>

        {/* Card 4: MDM Rasoiya Global Attendance */}
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                <Utensils className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                मध्याह्न रसोइया (Rasoiya)
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-bold text-amber-600 dark:text-amber-400 font-mono">
                {globalSummary.rasoiya.percentage !== null ? `${globalSummary.rasoiya.percentage}%` : '—'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-1 text-center text-xs">
            <div className="p-1 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800">
              <div className="font-bold text-gray-900 dark:text-white font-mono">{globalSummary.rasoiya.totalRasoiya}</div>
              <div className="text-[9px] text-gray-500">कुल</div>
            </div>
            <div className="p-1 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 font-mono">{globalSummary.rasoiya.totalPresent}</div>
              <div className="text-[9px] text-emerald-700">उपस्थित</div>
            </div>
            <div className="p-1 rounded-lg bg-red-50/60 dark:bg-red-950/30 border border-red-100 dark:border-red-900">
              <div className="font-bold text-red-700 dark:text-red-400 font-mono">{globalSummary.rasoiya.totalAbsent}</div>
              <div className="text-[9px] text-red-700">अनुपस्थित</div>
            </div>
            <div className="p-1 rounded-lg bg-amber-50/60 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900">
              <div className="font-bold text-amber-700 dark:text-amber-400 font-mono">{globalSummary.rasoiya.totalLeave + globalSummary.rasoiya.totalOd}</div>
              <div className="text-[9px] text-amber-700">अवकाश</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-800">
            <span>जमा: <strong className="text-emerald-600 font-mono">{globalSummary.rasoiya.submittedSchoolsCount}</strong></span>
            <span>लंबित: <strong className="text-amber-600 font-mono">{globalSummary.rasoiya.pendingSchoolsCount}</strong></span>
            <span>अवकाश: <strong className="text-purple-600 font-mono">{globalSummary.rasoiya.holidaySchoolsCount}</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Tab Navigation Bar: [ संयुक्त / Combined ] [ विद्यार्थी ] [ शिक्षक एवं स्टाफ ] [ रसोइया ] */}
      <div className="bg-white dark:bg-[#17211C] p-2.5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="tab-monitoring-combined"
            type="button"
            onClick={() => setActiveTab('COMBINED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'COMBINED'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>संयुक्त अवलोकन (Combined View)</span>
          </button>

          <button
            id="tab-monitoring-student"
            type="button"
            onClick={() => setActiveTab('STUDENT')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'STUDENT'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>विद्यार्थी उपस्थिति</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 font-mono">
              {globalSummary.student.submittedSchoolsCount}/{globalSummary.totalSchools}
            </span>
          </button>

          <button
            id="tab-monitoring-staff"
            type="button"
            onClick={() => setActiveTab('STAFF')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'STAFF'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>शिक्षक एवं स्टाफ</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 font-mono">
              {globalSummary.staff.submittedSchoolsCount}/{globalSummary.totalSchools}
            </span>
          </button>

          <button
            id="tab-monitoring-rasoiya"
            type="button"
            onClick={() => setActiveTab('RASOIYA')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'RASOIYA'
                ? 'bg-[#0B6B4B] text-white shadow-sm'
                : 'bg-gray-100 dark:bg-gray-800/70 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>रसोइया (MDM Cook)</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 dark:bg-black/20 font-mono">
              {globalSummary.rasoiya.submittedSchoolsCount}/{globalSummary.totalSchools}
            </span>
          </button>
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5 self-center">
          <Info className="w-3.5 h-3.5 text-emerald-600" />
          <span>शाला पर क्लिक कर विस्तृत विवरण देखें</span>
        </div>
      </div>

      {/* 5. Interactive Filter Toolbar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left Filters Group */}
        <div className="flex items-center gap-3 flex-wrap flex-1">
          {/* Date Selector */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-bold"
            />
          </div>

          {/* School Selector */}
          <div className="flex items-center gap-1.5">
            <SchoolIcon className="w-4 h-4 text-gray-500" />
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white max-w-[200px]"
            >
              <option value="ALL">समस्त शालाएं ({schools.length})</option>
              {schools.map((s) => (
                <option key={s.udise} value={s.udise}>
                  {s.name} ({s.udise})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="ALL">सभी स्थितियां (All Status)</option>
              <option value="SUBMITTED">जमा (Submitted)</option>
              <option value="PENDING">लंबित (Pending)</option>
              <option value="PARTIAL">आंशिक जमा (Partial)</option>
              <option value="HOLIDAY">अवकाश (Holiday)</option>
              <option value="ERROR">डेटा त्रुटि (Data Error)</option>
            </select>
          </div>

          {/* Low Attendance Filter (Percentage Bands) */}
          <div className="flex items-center gap-1.5">
            <TrendingDown className="w-4 h-4 text-amber-500" />
            <select
              value={lowAttendanceFilter}
              onChange={(e) => setLowAttendanceFilter(e.target.value as LowAttendanceRange)}
              className="px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="ALL">उपस्थिति % सीमा (All %)</option>
              <option value="ABOVE_90">90% और अधिक (उत्कृष्ट)</option>
              <option value="75_89">75% - 89% (सामान्य)</option>
              <option value="50_74">50% - 74% (मध्यम)</option>
              <option value="BELOW_50">50% से कम (न्यूनतम अलर्ट)</option>
            </select>
          </div>

          {/* Reset Filters */}
          {(searchQuery || schoolFilter !== 'ALL' || statusFilter !== 'ALL' || lowAttendanceFilter !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg flex items-center gap-1 font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>फ़िल्टर हटाएं</span>
            </button>
          )}
        </div>

        {/* Right Search Input */}
        <div className="relative w-full sm:w-auto sm:min-w-[200px] min-w-0">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="शाला नाम, UDISE या ग्राम..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* 6. Active Tab Content Tables */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        {/* TAB 1: COMBINED MONITORING TABLE */}
        {activeTab === 'COMBINED' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-3 w-12 text-center">क्र.</th>
                  <th className="py-3 px-4">शाला का नाम व UDISE</th>
                  <th className="py-3 px-3">संवर्ग / ग्राम</th>
                  <th className="py-3 px-3 text-center">विद्यार्थी (उप/कुल)</th>
                  <th className="py-3 px-3 text-center">विद्यार्थी %</th>
                  <th className="py-3 px-3 text-center">स्टाफ (उप/कुल)</th>
                  <th className="py-3 px-3 text-center">स्टाफ %</th>
                  <th className="py-3 px-3 text-center">रसोइया (उप/कुल)</th>
                  <th className="py-3 px-3 text-center">रसोइया %</th>
                  <th className="py-3 px-3 text-center">समग्र स्थिति</th>
                  <th className="py-3 px-3 text-center w-24">विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {filteredSchoolSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-gray-400">
                      कोई शाला रिकॉर्ड नहीं मिला। कृपया फ़िल्टर बदलें।
                    </td>
                  </tr>
                ) : (
                  filteredSchoolSummaries.map((item, idx) => {
                    return (
                      <tr
                        key={item.udise}
                        onClick={() => setSelectedSchoolSummary(item)}
                        className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
                      >
                        <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                            <span>{item.name}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono">{item.udise}</div>
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                          <div>{item.schoolType}</div>
                          <div className="text-[11px] text-gray-500">{item.village || 'मलगुवां'}</div>
                        </td>

                        {/* Student Presence */}
                        <td className="py-3 px-3 text-center">
                          {item.student.isHoliday ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              अवकाश
                            </span>
                          ) : item.student.status === 'ERROR' ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                              त्रुटि
                            </span>
                          ) : item.student.present !== null ? (
                            <span className="font-mono font-semibold">
                              <strong className="text-emerald-700 dark:text-emerald-400">{item.student.present}</strong> / {item.student.registered}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">लंबित</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {item.student.isHoliday ? (
                            '—'
                          ) : item.student.percentage !== null ? (
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold ${
                                item.student.percentage >= 75
                                  ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/60'
                                  : item.student.percentage >= 50
                                  ? 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/60'
                                  : 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-950/60'
                              }`}
                            >
                              {item.student.percentage}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Staff Presence */}
                        <td className="py-3 px-3 text-center">
                          {item.staff.isHoliday ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              अवकाश
                            </span>
                          ) : item.staff.present !== null ? (
                            <span className="font-mono font-semibold">
                              <strong className="text-blue-700 dark:text-blue-400">{item.staff.present}</strong> / {item.staff.total}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">लंबित</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {item.staff.isHoliday ? (
                            '—'
                          ) : item.staff.percentage !== null ? (
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {item.staff.percentage}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Rasoiya Presence */}
                        <td className="py-3 px-3 text-center">
                          {item.rasoiya.isHoliday ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                              अवकाश
                            </span>
                          ) : item.rasoiya.present !== null ? (
                            <span className="font-mono font-semibold">
                              <strong className="text-amber-700 dark:text-amber-400">{item.rasoiya.present}</strong> / {item.rasoiya.total}
                            </span>
                          ) : (
                            <span className="text-amber-600 font-medium">लंबित</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono">
                          {item.rasoiya.isHoliday ? (
                            '—'
                          ) : item.rasoiya.percentage !== null ? (
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                              {item.rasoiya.percentage}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>

                        {/* Overall Status Badge */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                              item.overall.status === 'SUBMITTED'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : item.overall.status === 'PARTIAL'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : item.overall.status === 'HOLIDAY'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                : item.overall.status === 'ERROR'
                                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {item.overall.status === 'SUBMITTED' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                            {item.overall.status === 'PARTIAL' && <Clock className="w-3 h-3 text-blue-600" />}
                            {item.overall.status === 'PENDING' && <Clock className="w-3 h-3 text-amber-600" />}
                            {item.overall.status === 'HOLIDAY' && <Palmtree className="w-3 h-3 text-purple-600" />}
                            {item.overall.status === 'ERROR' && <AlertTriangle className="w-3 h-3 text-red-600" />}
                            <span>{item.overall.label}</span>
                          </span>
                        </td>

                        {/* View Button */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSchoolSummary(item);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#0B6B4B] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                            title="विस्तृत विवरण देखें"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2: SEPARATE STUDENT MONITORING TABLE */}
        {activeTab === 'STUDENT' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-3 w-12 text-center">क्र.</th>
                  <th className="py-3 px-4">शाला का नाम व UDISE</th>
                  <th className="py-3 px-3">ग्राम</th>
                  <th className="py-3 px-3 text-center">कुल दर्ज विद्यार्थी</th>
                  <th className="py-3 px-3 text-center">आज उपस्थित</th>
                  <th className="py-3 px-3 text-center">आज अनुपस्थित</th>
                  <th className="py-3 px-3 text-center">उपस्थिति %</th>
                  <th className="py-3 px-3 text-center">स्थिति</th>
                  <th className="py-3 px-3 text-center w-24">विवरण</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {filteredSchoolSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-gray-400">
                      कोई शाला रिकॉर्ड नहीं मिला।
                    </td>
                  </tr>
                ) : (
                  filteredSchoolSummaries.map((item, idx) => (
                    <tr
                      key={item.udise}
                      onClick={() => setSelectedSchoolSummary(item)}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{item.udise}</div>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{item.village || 'मलगुवां'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{item.student.registered}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700 dark:text-emerald-400">
                        {item.student.isHoliday ? '—' : item.student.present !== null ? item.student.present : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-red-700 dark:text-red-400">
                        {item.student.isHoliday ? '—' : item.student.absent !== null ? item.student.absent : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        {item.student.isHoliday ? (
                          '—'
                        ) : item.student.percentage !== null ? (
                          <span
                            className={`px-2 py-0.5 rounded font-bold ${
                              item.student.percentage >= 75
                                ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400'
                                : item.student.percentage >= 50
                                ? 'text-amber-700 bg-amber-50 dark:text-amber-400'
                                : 'text-red-700 bg-red-50 dark:text-red-400'
                            }`}
                          >
                            {item.student.percentage}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.student.isHoliday
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : item.student.status === 'SUBMITTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : item.student.status === 'ERROR'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.student.isHoliday
                            ? 'अवकाश'
                            : item.student.status === 'SUBMITTED'
                            ? 'जमा'
                            : item.student.status === 'ERROR'
                            ? 'डेटा त्रुटि'
                            : 'लंबित'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchoolSummary(item);
                          }}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-[#0B6B4B] hover:bg-emerald-50 dark:hover:bg-emerald-950/60 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: SEPARATE TEACHER & STAFF MONITORING TABLE */}
        {activeTab === 'STAFF' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-3 w-12 text-center">क्र.</th>
                  <th className="py-3 px-4">शाला का नाम व UDISE</th>
                  <th className="py-3 px-3 text-center">कुल पदस्थ स्टाफ</th>
                  <th className="py-3 px-3 text-center">उपस्थित</th>
                  <th className="py-3 px-3 text-center">अनुपस्थित</th>
                  <th className="py-3 px-3 text-center">अवकाश (Leave)</th>
                  <th className="py-3 px-3 text-center">ऑन ड्यूटी (OD)</th>
                  <th className="py-3 px-3 text-center">उपस्थिति %</th>
                  <th className="py-3 px-3 text-center">स्थिति</th>
                  <th className="py-3 px-3 text-center w-24">स्टाफ सूची</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {filteredSchoolSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      कोई शाला रिकॉर्ड नहीं मिला।
                    </td>
                  </tr>
                ) : (
                  filteredSchoolSummaries.map((item, idx) => (
                    <tr
                      key={item.udise}
                      onClick={() => setSelectedSchoolSummary(item)}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{item.udise}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{item.staff.total}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-blue-700 dark:text-blue-400">
                        {item.staff.isHoliday ? '—' : item.staff.present !== null ? item.staff.present : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-red-700 dark:text-red-400">
                        {item.staff.isHoliday ? '—' : item.staff.absent !== null ? item.staff.absent : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-400">
                        {item.staff.isHoliday ? '—' : item.staff.leave !== null ? item.staff.leave : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-blue-700 dark:text-blue-400">
                        {item.staff.isHoliday ? '—' : item.staff.od !== null ? item.staff.od : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {item.staff.isHoliday ? '—' : item.staff.percentage !== null ? `${item.staff.percentage}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.staff.isHoliday
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : item.staff.status === 'SUBMITTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.staff.isHoliday ? 'अवकाश' : item.staff.status === 'SUBMITTED' ? 'जमा' : 'लंबित'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchoolSummary(item);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-950/60 hover:bg-blue-100 transition-colors flex items-center gap-1 mx-auto"
                        >
                          <span>देखें</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 4: SEPARATE RASOIYA (MDM COOK) MONITORING TABLE */}
        {activeTab === 'RASOIYA' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-3 w-12 text-center">क्र.</th>
                  <th className="py-3 px-4">शाला का नाम व UDISE</th>
                  <th className="py-3 px-3 text-center">कुल रसोइया</th>
                  <th className="py-3 px-3 text-center">उपस्थित</th>
                  <th className="py-3 px-3 text-center">अनुपस्थित</th>
                  <th className="py-3 px-3 text-center">अवकाश</th>
                  <th className="py-3 px-3 text-center">अन्य कार्य</th>
                  <th className="py-3 px-3 text-center">उपस्थिति %</th>
                  <th className="py-3 px-3 text-center">स्थिति</th>
                  <th className="py-3 px-3 text-center w-24">रसोइया सूची</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                {filteredSchoolSummaries.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-gray-400">
                      कोई शाला रिकॉर्ड नहीं मिला।
                    </td>
                  </tr>
                ) : (
                  filteredSchoolSummaries.map((item, idx) => (
                    <tr
                      key={item.udise}
                      onClick={() => setSelectedSchoolSummary(item)}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-gray-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 dark:text-white">{item.name}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{item.udise}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{item.rasoiya.total}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-700 dark:text-amber-400">
                        {item.rasoiya.isHoliday ? '—' : item.rasoiya.present !== null ? item.rasoiya.present : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-red-700 dark:text-red-400">
                        {item.rasoiya.isHoliday ? '—' : item.rasoiya.absent !== null ? item.rasoiya.absent : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-amber-700 dark:text-amber-400">
                        {item.rasoiya.isHoliday ? '—' : item.rasoiya.leave !== null ? item.rasoiya.leave : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono text-blue-700 dark:text-blue-400">
                        {item.rasoiya.isHoliday ? '—' : item.rasoiya.od !== null ? item.rasoiya.od : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-bold">
                        {item.rasoiya.isHoliday ? '—' : item.rasoiya.percentage !== null ? `${item.rasoiya.percentage}%` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            item.rasoiya.isHoliday
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              : item.rasoiya.status === 'SUBMITTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {item.rasoiya.isHoliday ? 'अवकाश' : item.rasoiya.status === 'SUBMITTED' ? 'जमा' : 'लंबित'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSchoolSummary(item);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/60 hover:bg-amber-100 transition-colors flex items-center gap-1 mx-auto"
                        >
                          <span>देखें</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 7. School Attendance Detail Modal */}
      <SchoolAttendanceDetailModal
        summary={selectedSchoolSummary}
        selectedDate={selectedDate}
        selectedSessionId={selectedSessionId}
        onClose={() => setSelectedSchoolSummary(null)}
      />
    </div>
  );
};
