import React, { useState, useRef, useMemo } from 'react';
import {
  FileBarChart,
  Printer,
  Download,
  School,
  GraduationCap,
  Users,
  CalendarCheck,
  Building2,
  Utensils,
  ClipboardList,
  AlertTriangle,
  Layers,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  BookOpen,
  TrendingUp,
  GitCompare,
  UtensilsCrossed,
  ShieldAlert,
  Search,
  RotateCcw,
  PieChart,
  Table,
  Check,
  Calendar,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { institutionConfig } from '../../config/institutionConfig';
import {
  exportToExcel,
  exportToCSV,
  generateUnicodePDFFromElement,
} from '../../utils/exportUtils';
import { printElement, triggerPrint } from '../../utils/printUtils';
import { SmartExportModal } from '../export/SmartExportModal';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import {
  GOVERNMENT_REPORT_REGISTRY,
  computeExecutiveKPIs,
  DATA_COMPLETENESS_CRITERIA,
} from '../../utils/governmentReportRegistry';
import {
  ReportFilterState,
  GovernmentReportDefinition,
} from '../../types/governmentReports';
import { safeGetJSON, safeSetJSON } from '../../utils/safeStorage';
import { syncAuditLogToCloud } from '../../services/cloudDatabaseService';

export const ReportsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const allDataContext = useData();
  const {
    schools,
    scopedSchools,
    selectedSchool,
    currentSchoolUdise,
    selectedSessionId,
    academicSessions,
  } = allDataContext;

  const reportPreviewRef = useRef<HTMLDivElement>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [viewTab, setViewTab] = useState<'DOCUMENT' | 'ANALYTICS'>('DOCUMENT');

  const isSchoolRestricted = currentUser?.role === 'SCHOOL';

  // Filters State
  const [filters, setFilters] = useState<ReportFilterState>({
    sessionId: selectedSessionId || institutionConfig.academicSession,
    schoolUdise: isSchoolRestricted ? currentSchoolUdise : 'ALL',
    dateFrom: '',
    dateTo: '',
    classLevel: 'ALL',
    status: 'ALL',
    category: 'ALL',
    searchQuery: '',
    scope: 'FULL',
    singleEntityId: '',
  });

  // Active Report ID State
  const [activeReportId, setActiveReportId] = useState<string>(
    isSchoolRestricted ? 'GOV_SCHOOL_PROFILE' : 'GOV_CONSOLIDATED'
  );

  // Keep filters.sessionId synchronized with global selectedSessionId
  React.useEffect(() => {
    if (selectedSessionId && selectedSessionId !== filters.sessionId) {
      setFilters((prev) => ({ ...prev, sessionId: selectedSessionId }));
    }
  }, [selectedSessionId]);

  // Security Check: URL query params / hash verification
  React.useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const queryUdise = urlParams.get('udise') || urlParams.get('schoolUdise');
      if (queryUdise) {
        setFilters((prev) => ({ ...prev, schoolUdise: queryUdise }));
      }
      const queryReport = urlParams.get('reportId') || urlParams.get('report');
      if (queryReport) {
        const found = GOVERNMENT_REPORT_REGISTRY.find((r) => r.id === queryReport);
        if (found) setActiveReportId(found.id);
      }
    } catch {
      // Safe no-op
    }
  }, []);

  // Security Check: Ensure SCHOOL user never accesses unauthorized UDISE
  const isSecurityViolation = useMemo(() => {
    if (isSchoolRestricted) {
      if (filters.schoolUdise && filters.schoolUdise !== 'ALL' && filters.schoolUdise !== currentSchoolUdise) {
        return true;
      }
    }
    return false;
  }, [isSchoolRestricted, filters.schoolUdise, currentSchoolUdise]);

  // Log Security Violation if attempted
  React.useEffect(() => {
    if (isSecurityViolation) {
      try {
        const logs = safeGetJSON<any[]>('jsk_audit_logs', []);
        const now = new Date();
        const secLog = {
          id: `SEC-${Date.now()}`,
          timestamp: now.toISOString(),
          date: now.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
          userId: currentUser?.id || currentUser?.username || 'unknown',
          userName: currentUser?.name || currentUser?.username || 'unknown',
          role: currentUser?.role || 'SCHOOL',
          action: 'ACCESS_DENIED' as const,
          module: 'रिपोर्ट्स एवं विवरण',
          entityType: 'REPORT_CENTER',
          entityId: filters.schoolUdise,
          performedBy: currentUser?.username || 'unknown',
          userRole: currentUser?.role || 'SCHOOL',
          details: `[ACCESS_DENIED] School user attempted unauthorized access to UDISE ${filters.schoolUdise}`,
        };
        logs.unshift(secLog);
        safeSetJSON('jsk_audit_logs', logs, 50);
        syncAuditLogToCloud(secLog as any).catch(() => {});
      } catch (e) {
        console.warn('Audit log write error:', e);
      }
    }
  }, [isSecurityViolation, filters.schoolUdise, currentUser]);

  // Filter available reports based on user role
  const availableReports = useMemo(() => {
    return GOVERNMENT_REPORT_REGISTRY.filter((rep) =>
      rep.supportedRoles.includes(currentUser?.role || 'SCHOOL')
    );
  }, [currentUser?.role]);

  // Active Report Definition
  const currentReportDef: GovernmentReportDefinition = useMemo(() => {
    const found = GOVERNMENT_REPORT_REGISTRY.find((r) => r.id === activeReportId);
    if (found && found.supportedRoles.includes(currentUser?.role || 'SCHOOL')) {
      return found;
    }
    return availableReports[0] || GOVERNMENT_REPORT_REGISTRY[0];
  }, [activeReportId, availableReports, currentUser?.role]);

  // Execute Dynamic Calculation for current report
  const reportCalculation = useMemo(() => {
    if (isSecurityViolation) {
      return {
        title: 'सुरक्षा चेतावनी: अनधिकृत पहुंच',
        subtitle: 'Security Restriction Violation',
        summaryMetrics: [],
        headers: [],
        rows: [],
        rawItems: [],
        isEmpty: true,
        emptyMessage: 'आप केवल अपने अधिकृत विद्यालय के अभिलेख देखने के लिए अधिकृत हैं।',
      };
    }

    return currentReportDef.calculate({
      filters,
      currentUserRole: currentUser?.role || 'SCHOOL',
      userAssignedSchoolUdise: isSchoolRestricted ? currentSchoolUdise : undefined,
      allData: allDataContext,
    });
  }, [currentReportDef, filters, currentUser?.role, isSchoolRestricted, currentSchoolUdise, allDataContext, isSecurityViolation]);

  // Live KPI Metric Cards
  const liveKpis = useMemo(() => {
    return computeExecutiveKPIs(
      allDataContext,
      currentUser?.role || 'SCHOOL',
      isSchoolRestricted ? currentSchoolUdise : undefined,
      filters.sessionId
    );
  }, [allDataContext, currentUser?.role, isSchoolRestricted, currentSchoolUdise, filters.sessionId]);

  // Session integrity check: Detect unmapped legacy records across operational datasets
  const unmappedRecords = useMemo(() => {
    const { attendance = [], mdmRecords = [], governmentWork = [], complaints = [] } = allDataContext;
    const unmappedAtt = attendance.filter((a: any) => !a.sessionId).length;
    const unmappedMdm = mdmRecords.filter((m: any) => !m.sessionId).length;
    const unmappedWork = governmentWork.filter((w: any) => !w.sessionId).length;
    const unmappedComp = complaints.filter((c: any) => !c.sessionId).length;
    const total = unmappedAtt + unmappedMdm + unmappedWork + unmappedComp;
    return {
      total,
      attendance: unmappedAtt,
      mdm: unmappedMdm,
      work: unmappedWork,
      complaints: unmappedComp,
    };
  }, [allDataContext]);

  // Target School Info for Headers
  const currentSchoolInfo = useMemo(() => {
    if (isSchoolRestricted) {
      return {
        name: selectedSchool?.name || selectedSchool?.hindiName || 'अधिकृत विद्यालय',
        udise: currentSchoolUdise,
      };
    }
    if (filters.schoolUdise && filters.schoolUdise !== 'ALL') {
      const sch = schools.find((s) => s.udise === filters.schoolUdise);
      if (sch) {
        return {
          name: sch.hindiName || sch.name,
          udise: sch.udise,
        };
      }
    }
    return undefined;
  }, [isSchoolRestricted, selectedSchool, currentSchoolUdise, filters.schoolUdise, schools]);

  // Export Payload for UnifiedPrintButton & Direct Export
  const currentExportPayload = useMemo(() => {
    return currentReportDef.getExportPayload(reportCalculation, filters, currentSchoolInfo);
  }, [currentReportDef, reportCalculation, filters, currentSchoolInfo]);

  // Handlers
  const handlePrint = () => {
    if (isSecurityViolation) return;
    if (reportPreviewRef.current) {
      printElement(reportPreviewRef.current, {
        title: `${currentReportDef.title} - सत्र ${filters.sessionId}`,
        orientation: 'landscape',
      });
    } else {
      triggerPrint();
    }
  };

  const handleDownloadPDF = async () => {
    if (isSecurityViolation || !reportPreviewRef.current) return;
    setIsPdfLoading(true);
    try {
      const fileName = `Official_Report_${currentReportDef.id}_${new Date().toISOString().split('T')[0]}`;
      await generateUnicodePDFFromElement(
        reportPreviewRef.current,
        fileName,
        'landscape',
        {
          includeHeader: true,
          includeSchoolIdentity: true,
          includePageNumber: true,
          includeSignature: true,
          includeFooter: true,
        },
        'PROFESSIONAL'
      );
    } catch (err) {
      console.error('PDF Generation failed:', err);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (isSecurityViolation) return;
    exportToExcel(currentExportPayload);
  };

  const handleExportCSV = () => {
    if (isSecurityViolation) return;
    exportToCSV(currentExportPayload);
  };

  const handleResetFilters = () => {
    setFilters({
      sessionId: selectedSessionId || institutionConfig.academicSession,
      schoolUdise: isSchoolRestricted ? currentSchoolUdise : 'ALL',
      dateFrom: '',
      dateTo: '',
      classLevel: 'ALL',
      status: 'ALL',
      category: 'ALL',
      searchQuery: '',
      scope: 'FULL',
      singleEntityId: '',
    });
  };

  // Get Icon Component helper
  const getIcon = (name: string) => {
    switch (name) {
      case 'Layers': return Layers;
      case 'School': return School;
      case 'GraduationCap': return GraduationCap;
      case 'Users': return Users;
      case 'CalendarCheck': return CalendarCheck;
      case 'Utensils': return Utensils;
      case 'Building2': return Building2;
      case 'ClipboardList': return ClipboardList;
      case 'AlertTriangle': return AlertTriangle;
      case 'BookOpen': return BookOpen;
      case 'UtensilsCrossed': return UtensilsCrossed;
      case 'Users2': return Users;
      case 'CheckCircle2': return CheckCircle2;
      case 'TrendingUp': return TrendingUp;
      case 'GitCompare': return GitCompare;
      default: return FileText;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in pb-12">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-6 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-400">
            <FileBarChart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                शासकीय रिपोर्ट एवं विश्लेषणात्मक केंद्र
              </h2>
              <span className="bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-[#0B6B4B]/20">
                Official Analytical Center
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              जन शिक्षा केंद्र / संकुल मलगुवां | विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district} | सत्र: {filters.sessionId}
            </p>
          </div>
        </div>

        {/* Global Export & Print Actions */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {isFeatureEnabled('module.reports.action.print') && (
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="वर्तमान दृश्य का प्रिंट"
            >
              <Printer className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              <span>Print View</span>
            </button>
          )}

          {isFeatureEnabled('module.reports.action.pdf') && (
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={isPdfLoading}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-50"
              title="आधिकारिक A4 PDF डाउनलोड"
            >
              <Download className="w-4 h-4 text-red-600" />
              <span>{isPdfLoading ? 'तैयार हो रहा है...' : 'PDF'}</span>
            </button>
          )}

          {isFeatureEnabled('module.reports.action.excel') && (
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Microsoft Excel (.xlsx) निर्यात"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
              <span>Excel (.xlsx)</span>
            </button>
          )}

          {isFeatureEnabled('module.reports.action.csv') && (
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="CSV (UTF-8 BOM) निर्यात"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              <span>CSV</span>
            </button>
          )}

          {(isFeatureEnabled('module.reports.action.print_export') && (isFeatureEnabled('module.reports.action.print') || isFeatureEnabled('module.reports.action.pdf') || isFeatureEnabled('module.reports.action.excel'))) && (
            <UnifiedPrintButton
              id="reports-unified-print-center"
              currentSession={filters.sessionId}
              currentSchoolName={currentSchoolInfo?.name}
              currentUdise={currentSchoolInfo?.udise}
              previewContainerRef={reportPreviewRef}
              onPrintCurrentView={handlePrint}
              onPrintReport={() => setIsExportModalOpen(true)}
              currentViewLabel="स्मार्ट प्रिंट"
              currentViewSubtext="वर्तमान प्रतिवेदन का A4 मुद्रण"
              reportLabel="सार्वभौमिक निर्यात केंद्र"
              reportSubtext="संकुल डेटा व प्रिंट प्रबंधन"
              exportPayload={() => currentExportPayload}
            />
          )}
        </div>
      </div>

      {/* Security Violation Alert Card */}
      {isSecurityViolation && (
        <div className="bg-red-50 dark:bg-red-950/60 border-2 border-red-400 dark:border-red-800 p-5 rounded-2xl flex items-start gap-3.5 shadow-sm no-print">
          <ShieldAlert className="w-6 h-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-red-900 dark:text-red-200">
              [ACCESS_DENIED] अनधिकृत पहुंच का प्रयास
            </h3>
            <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
              आपकी भूमिका विद्यालय स्तर (SCHOOL) पर सीमित है। आप केवल अपने आवंटित विद्यालय (UDISE: {currentSchoolUdise}) की रिपोर्ट देखने के लिए अधिकृत हैं। यह सुरक्षा प्रयास सिस्टम ऑडिट लॉग में दर्ज कर लिया गया है।
            </p>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, schoolUdise: currentSchoolUdise }))}
              className="mt-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              अपने अधिकृत विद्यालय पर वापस जाएं
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Live KPI Cards Banner (Clickable to jump to specific report) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 no-print">
        {liveKpis.map((kpi) => (
          <button
            key={kpi.id}
            onClick={() => {
              if (kpi.targetReportId) {
                setActiveReportId(kpi.targetReportId);
                if (kpi.targetFilter) {
                  setFilters((prev) => ({ ...prev, ...kpi.targetFilter }));
                }
              }
            }}
            className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col justify-between hover:shadow-xs ${
              activeReportId === kpi.targetReportId
                ? 'bg-emerald-50/80 dark:bg-emerald-950/60 border-[#0B6B4B] ring-2 ring-[#0B6B4B]/20'
                : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] hover:border-emerald-300'
            }`}
          >
            <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate" title={kpi.label}>
              {kpi.label}
            </div>
            <div className="text-base sm:text-lg font-bold text-gray-900 dark:text-white my-1 truncate">
              {kpi.value}
            </div>
            <div className="text-[9px] text-gray-400 dark:text-gray-500 truncate" title={kpi.subtext}>
              {kpi.subtext}
            </div>
          </button>
        ))}
      </div>

      {/* Top Filter Bar */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-3 no-print">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
              रिपोर्ट फ़िल्टर एवं चयन (Filters)
            </span>
            <span className="text-[10px] text-gray-400">
              (डेटा स्वतः अद्यतन होगा)
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-gray-500 hover:text-[#0B6B4B] flex items-center gap-1 font-medium transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>फ़िल्टर रीसेट</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Academic Session */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              शैक्षणिक सत्र
            </label>
            <select
              value={filters.sessionId}
              onChange={(e) => {
                const newSession = e.target.value;
                setFilters((prev) => ({ ...prev, sessionId: newSession }));
                if (allDataContext.setSelectedSessionId) {
                  allDataContext.setSelectedSessionId(newSession);
                }
              }}
              className="w-full text-xs font-medium p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-[#0B6B4B] outline-none"
            >
              {academicSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  सत्र {s.name} {s.status === 'ACTIVE' ? '(सक्रिय)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* School Selector (Locked for SCHOOL role) */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
              विद्यालय चयन
            </label>
            {isSchoolRestricted ? (
              <div className="w-full text-xs p-2 rounded-xl border border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 text-[#0B6B4B] dark:text-emerald-300 font-bold flex items-center justify-between">
                <span className="truncate">{selectedSchool?.name || selectedSchool?.hindiName || currentSchoolUdise}</span>
                <Lock className="w-3 h-3 shrink-0 ml-1 opacity-70" />
              </div>
            ) : (
              <select
                value={filters.schoolUdise}
                onChange={(e) => setFilters((prev) => ({ ...prev, schoolUdise: e.target.value }))}
                className="w-full text-xs font-medium p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-1 focus:ring-[#0B6B4B] outline-none"
              >
                <option value="ALL">समस्त विद्यालय (संपूर्ण संकुल)</option>
                {schools.map((sch) => (
                  <option key={sch.udise} value={sch.udise}>
                    {sch.hindiName || sch.name} ({sch.udise})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Date Range: From */}
          {currentReportDef.availableFilters.dateRange && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                दिनांक से (Date From)
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none"
              />
            </div>
          )}

          {/* Date Range: To */}
          {currentReportDef.availableFilters.dateRange && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                दिनांक तक (Date To)
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
                className="w-full text-xs p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none"
              />
            </div>
          )}

          {/* Class Filter */}
          {currentReportDef.availableFilters.classLevel && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                कक्षा (Class)
              </label>
              <select
                value={filters.classLevel}
                onChange={(e) => setFilters((prev) => ({ ...prev, classLevel: e.target.value }))}
                className="w-full text-xs font-medium p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none"
              >
                <option value="ALL">समस्त कक्षाएं (All Classes)</option>
                <option value="1">कक्षा 1</option>
                <option value="2">कक्षा 2</option>
                <option value="3">कक्षा 3</option>
                <option value="4">कक्षा 4</option>
                <option value="5">कक्षा 5</option>
                <option value="6">कक्षा 6</option>
                <option value="7">कक्षा 7</option>
                <option value="8">कक्षा 8</option>
              </select>
            </div>
          )}

          {/* Status Filter */}
          {currentReportDef.availableFilters.status && (
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                स्थिति (Status)
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                className="w-full text-xs font-medium p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none"
              >
                <option value="ALL">समस्त स्थितियां</option>
                <option value="ACTIVE">सक्रिय / कार्यरत</option>
                <option value="COMPLETED">पूर्ण (Completed)</option>
                <option value="IN_PROGRESS">प्रगतिरत (In Progress)</option>
                <option value="PENDING">लंबित (Pending)</option>
                <option value="OVERDUE">समय-सीमा पार (Overdue)</option>
                <option value="RESOLVED">निराकृत (Resolved)</option>
              </select>
            </div>
          )}

          {/* Search Box */}
          {currentReportDef.availableFilters.search && (
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                खोज (Search by Name / UDISE / ID)
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="नाम, समग्र आईडी, कर्मचारी कोड या यूडाइस दर्ज करें..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 outline-none focus:ring-1 focus:ring-[#0B6B4B]"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Official Forms & Report Categories Section - Landscape Horizontal Layout */}
      <div className="bg-white dark:bg-[#17211C] p-4 sm:p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-3.5 no-print">
        {/* Horizontal Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800/80 pb-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="p-1.5 rounded-lg bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-400 shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white whitespace-normal sm:whitespace-nowrap">
              शासकीय प्रपत्र एवं रिपोर्ट श्रेणियां
            </h3>
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-[#0B6B4B]/20 shrink-0">
              कुल श्रेणियां: {availableReports.length}
            </span>
          </div>

          <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            प्रपत्र चयन कर नीचे विस्तृत रिपोर्ट व विश्लेषिकी देखें
          </div>
        </div>

        {/* 3-Column Desktop, 2-Column Tablet, 1-Column Mobile Landscape Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
          {availableReports.map((rep) => {
            const Icon = getIcon(rep.iconName);
            const isActive = activeReportId === rep.id;
            return (
              <button
                key={rep.id}
                type="button"
                onClick={() => setActiveReportId(rep.id)}
                className={`p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between gap-3 group hover:shadow-xs ${
                  isActive
                    ? 'border-[#0B6B4B] bg-[#EAF6F0] dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 ring-2 ring-[#0B6B4B]/25 shadow-xs font-semibold'
                    : 'border-[#DDE7E2] dark:border-[#2B3933] bg-white dark:bg-[#17211C] hover:border-emerald-300 dark:hover:border-emerald-700/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20'
                }`}
              >
                {/* Left: Icon + Category Name & Short Description */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`p-2 rounded-xl shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#0B6B4B] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 group-hover:bg-[#0B6B4B]/15 group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-300">
                      {rep.hindiTitle}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 leading-snug">
                      {rep.description}
                    </p>
                  </div>
                </div>

                {/* Right: Action Indicator */}
                <div className="shrink-0 flex items-center gap-1 pl-1">
                  <span
                    className={`text-[11px] font-bold transition-colors whitespace-nowrap flex items-center gap-1 ${
                      isActive
                        ? 'text-[#0B6B4B] dark:text-emerald-300'
                        : 'text-gray-400 dark:text-gray-500 group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-300'
                    }`}
                  >
                    <span>{isActive ? 'सक्रिय' : 'रिपोर्ट देखें'}</span>
                    <ArrowRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Report Content & Printable Canvas Container (Full Width) */}
      <div className="space-y-4">
          {/* Session Integrity / Unmapped Data Warning Notice */}
          {unmappedRecords.total > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/70 rounded-xl text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5 no-print shadow-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">सत्र पृथक्करण एवं डेटा सुरक्षा चेतावनी (Data Requires Mapping): </span>
                प्रणाली में कुल <span className="font-bold underline">{unmappedRecords.total}</span> पुराने अभिलेखों में शैक्षणिक सत्र निर्धारित नहीं है। शासकीय डेटा अलगाव नियमों के अनुसार इन्हें चयनित सत्र में स्वतः सम्मिलित नहीं किया गया है ताकि डेटा लीकेज न हो।
              </div>
            </div>
          )}

          {/* View Tab Switcher */}
          <div className="flex items-center justify-between bg-white dark:bg-[#17211C] p-2 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs no-print">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewTab('DOCUMENT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  viewTab === 'DOCUMENT'
                    ? 'bg-[#0B6B4B] text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Table className="w-3.5 h-3.5" />
                <span>आधिकारिक प्रपत्र दृश्य (Printable Form)</span>
              </button>

              {isFeatureEnabled('module.reports.sub.analytical_center') && (
                <button
                  type="button"
                  onClick={() => setViewTab('ANALYTICS')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    viewTab === 'ANALYTICS'
                      ? 'bg-[#0B6B4B] text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <PieChart className="w-3.5 h-3.5" />
                  <span>विश्लेषणात्मक सारांश (Analytical Center)</span>
                </button>
              )}
            </div>

            <div className="text-[11px] text-gray-400 hidden sm:block">
              कुल पंक्तियां: <span className="font-bold text-gray-800 dark:text-gray-200">{reportCalculation.rows.length}</span>
            </div>
          </div>

          {/* Printable Official Canvas Container */}
          <div
            ref={reportPreviewRef}
            className="print-report-container unicode-safe bg-white dark:bg-[#17211C] p-6 sm:p-8 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-sm print:p-0 print:border-none print:shadow-none space-y-5"
          >
            {/* Institutional Printable Header */}
            <div className="border-b-2 border-[#0B6B4B] pb-4 flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#0B6B4B]/10 text-[#0B6B4B] dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-bold shrink-0 border border-[#0B6B4B]/20">
                  <FileBarChart className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                    {institutionConfig.sankulName} • संस्थागत प्रतिवेदन केंद्र
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold text-[#0B6B4B] dark:text-emerald-400 leading-tight">
                    {institutionConfig.institutionName} / {institutionConfig.sankulName}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium mt-0.5">
                    मलगुवां, विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district}, {institutionConfig.state}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    शैक्षणिक सत्र: <span className="font-bold text-gray-700 dark:text-gray-200">{filters.sessionId}</span> | संदर्भ क्षेत्र:{' '}
                    <span className="font-bold text-[#0B6B4B] dark:text-emerald-400">
                      {currentSchoolInfo ? `${currentSchoolInfo.name} (${currentSchoolInfo.udise})` : `समस्त संकुल (${schools.length} सक्रिय शालाएं)`}
                    </span>
                  </p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="bg-[#0B6B4B] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                  संस्थागत प्रतिवेदन
                </span>
                <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400 mt-1">
                  संकुल यूडाइस: {institutionConfig.diseCode}
                </div>
                <div className="text-[9px] text-gray-400 mt-0.5">
                  दिनांक: {new Date().toLocaleDateString('hi-IN')}
                </div>
              </div>
            </div>

            {/* Report Title & Subtitle Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-emerald-50/50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40">
              <div>
                <h3 className="text-sm font-bold text-[#0B6B4B] dark:text-emerald-300">
                  {reportCalculation.title}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {reportCalculation.subtitle}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] bg-white dark:bg-[#17211C] px-2.5 py-1 rounded-lg border text-gray-600 dark:text-gray-300 font-semibold shadow-2xs">
                  सत्यापित आधिकारिक रिकॉर्ड
                </span>
              </div>
            </div>

            {/* Summary Metrics Bar */}
            {reportCalculation.summaryMetrics && reportCalculation.summaryMetrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {reportCalculation.summaryMetrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700"
                  >
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      {metric.label}
                    </div>
                    <div className="text-sm sm:text-base font-bold text-gray-900 dark:text-white mt-0.5">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View Mode 1: Tabular Document View */}
            {viewTab === 'DOCUMENT' && (
              <div className="space-y-4">
                {activeReportId === 'GOV_DATA_COMPLETENESS' && (
                  <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <span className="font-bold text-[#0B6B4B] dark:text-emerald-400">
                        निर्धारित {DATA_COMPLETENESS_CRITERIA.length} डेटा पूर्णता मानक (Verification Criteria):
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        समस्त {DATA_COMPLETENESS_CRITERIA.length} मानक पूर्ण होने पर ही शाला की स्थिति 'पूर्ण' मानी जाती है
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {DATA_COMPLETENESS_CRITERIA.map((criterion, idx) => (
                        <div key={criterion.id} className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-emerald-100 dark:border-gray-700 text-[11px] shadow-2xs">
                          <div className="font-bold text-gray-800 dark:text-gray-200">{idx + 1}. {criterion.name}</div>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{criterion.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {reportCalculation.isEmpty ? (
                  <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 space-y-2">
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">
                      {reportCalculation.emptyMessage || 'चयनित शैक्षणिक सत्र एवं फ़िल्टर के अनुसार कोई डेटा उपलब्ध नहीं है।'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      सत्र <span className="font-semibold text-[#0B6B4B] dark:text-emerald-400">{filters.sessionId}</span> अथवा चयनित विद्यालय हेतु प्राथमिक अभिलेख दर्ज होने के पश्चात प्रतिवेदन यहां स्वतः संकलित होगा।
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-gray-100/90 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700 print:table-header-group">
                        <tr>
                          {reportCalculation.headers.map((h, idx) => (
                            <th key={idx} className="p-2.5 font-bold border-r border-gray-200/60 dark:border-gray-700 last:border-r-0 whitespace-nowrap">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-700 dark:text-gray-300">
                        {reportCalculation.rows.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors print:break-inside-avoid"
                          >
                            {row.map((cell, colIdx) => (
                              <td
                                key={colIdx}
                                className="p-2.5 border-r border-gray-100 dark:border-gray-800 last:border-r-0"
                              >
                                {cell !== null && cell !== undefined ? String(cell) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* View Mode 2: Analytical Center View */}
            {viewTab === 'ANALYTICS' && (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  <strong>विश्लेषणात्मक सारांश:</strong> सत्र {filters.sessionId} के अंतर्गत {institutionConfig.institutionName} / {institutionConfig.sankulName} के संदर्भित डेटाबेस से प्राप्त अद्यतन विश्लेषणात्मक विवरण।
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 bg-white dark:bg-[#17211C] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">डेटा रिकॉर्ड स्थिति</div>
                    <div className="text-2xl font-black text-[#0B6B4B]">{reportCalculation.rows.length}</div>
                    <div className="text-[10px] text-gray-400">कुल संकलित आधिकारिक प्रविष्टियां</div>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#17211C] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">डेटा पूर्णता स्थिति</div>
                    <div className="text-2xl font-black text-blue-600">
                      {reportCalculation.rows.length > 0 ? 'सत्यापित' : 'अपूर्ण'}
                    </div>
                    <div className="text-[10px] text-gray-400">प्रणालीगत डेटाबेस अखंडता</div>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#17211C] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-2">
                    <div className="text-xs font-bold text-gray-700 dark:text-gray-300">सत्र स्थिति</div>
                    <div className="text-2xl font-black text-amber-600">{filters.sessionId}</div>
                    <div className="text-[10px] text-gray-400">सक्रिय शैक्षणिक चक्र</div>
                  </div>
                </div>

                {/* Data Records Summary */}
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-gray-100/90 dark:bg-gray-800 font-bold border-b">
                      <tr>
                        {reportCalculation.headers.slice(0, 6).map((h, idx) => (
                          <th key={idx} className="p-2.5 font-bold border-r last:border-r-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y text-gray-700 dark:text-gray-300">
                      {reportCalculation.rows.slice(0, 10).map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-gray-50/50">
                          {row.slice(0, 6).map((cell, cIdx) => (
                            <td key={cIdx} className="p-2.5 border-r last:border-r-0">
                              {String(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Official Signature Footer for Prints */}
            <div className="pt-8 border-t border-gray-300 dark:border-gray-700 grid grid-cols-2 text-center text-xs print:pt-6">
              <div>
                <div className="h-12"></div>
                <div className="font-bold text-gray-900 dark:text-white">
                  हस्ताक्षर संस्था प्रधान / प्रभारी
                </div>
                <div className="text-[11px] text-gray-500">
                  {currentSchoolInfo?.name || 'शासकीय प्राथमिक/माध्यमिक शाला'}
                </div>
                <div className="text-[10px] text-gray-400">
                  UDISE: {currentSchoolInfo?.udise || 'संबद्ध शाला'}
                </div>
              </div>

              <div>
                <div className="h-12"></div>
                <div className="font-bold text-[#0B6B4B] dark:text-emerald-400">
                  हस्ताक्षर जन शिक्षक / संकुल समन्वयक (CAC)
                </div>
                <div className="text-[11px] text-gray-500">
                  {institutionConfig.institutionName} / {institutionConfig.sankulName}
                </div>
                <div className="text-[10px] text-gray-400">
                  विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Smart Export Modal Integration */}
      <SmartExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        initialType={
          activeReportId === 'GOV_STUDENTS_DEMOGRAPHICS'
            ? 'STUDENT'
            : activeReportId === 'GOV_STAFF_ROSTER'
            ? 'TEACHER'
            : activeReportId === 'GOV_ATTENDANCE_ANALYSIS'
            ? 'ATTENDANCE'
            : activeReportId === 'GOV_FACILITIES_REPORT'
            ? 'FACILITIES'
            : activeReportId === 'GOV_MDM_REPORT'
            ? 'MDM'
            : 'SCHOOL'
        }
        initialUdise={isSchoolRestricted ? currentSchoolUdise : filters.schoolUdise}
      />
    </div>
  );
};
