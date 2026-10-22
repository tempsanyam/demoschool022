import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Printer,
  FileSpreadsheet,
  FileText,
  Download,
  Building2,
  Users,
  GraduationCap,
  Utensils,
  ClipboardList,
  ShieldCheck,
  CheckCircle2,
  Filter,
  Sparkles,
  Layers,
  Search,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Type,
  School as SchoolIcon,
  BookOpen,
  History,
  FileCheck2,
  ChevronRight,
  Info,
  Calendar,
  X
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyPrintExportView } from '../literacy/LiteracyPrintExportView';
import {
  exportToExcel,
  exportToCSV,
  exportToUnicodePDF,
  generateUnicodePDFFromElement,
  triggerSystemPrint,
  ExportDataPayload,
  ExportOptions
} from '../../utils/exportUtils';
import { printElement } from '../../utils/printUtils';
import { exportDossierToExcel } from '../../utils/dossierExportUtils';
import { institutionConfig } from '../../config/institutionConfig';
import { PrintStyleToggle, PrintReportStyle } from './PrintStyleToggle';
import {
  DocumentStyle,
  getDocumentStyle,
  setDocumentStyle,
  toCanonicalDocumentStyle
} from '../../utils/documentStyle';
import { DATA_EXPORT_REGISTRY } from '../../utils/dataExportRegistry';
import { compileUniversalExportData } from '../../utils/universalExportCompiler';
import {
  DataExportRegistryItem,
  ExportScope,
  DataCategory,
  SingleSelectionType
} from '../../types/dataExportRegistry';
import { SmartExportDocument } from './SmartExportDocument';

export type DataTypeOption = string;

export interface FieldDefinition {
  key: string;
  label: string;
  default: boolean;
  minimal?: boolean;
  category?: string;
}

export interface ExportCenterViewProps {
  initialTab?: 'CUSTOM_BUILDER' | 'QUICK_TEMPLATES' | 'LITERACY_FORMS' | 'FONT_TEST';
}

const CATEGORY_TABS: Array<{ id: DataCategory; label: string }> = [
  { id: 'ALL', label: 'समस्त (17+ मॉड्यूल्स)' },
  { id: 'DOSSIER', label: '★ महा-डोजियर' },
  { id: 'SCHOOL', label: '02. शाला डेटा' },
  { id: 'STUDENT', label: '03. विद्यार्थी' },
  { id: 'STAFF', label: '04. शिक्षक/स्टाफ' },
  { id: 'COMMUNITY', label: '05-06. रसोइया व SHG' },
  { id: 'OPERATIONS', label: '07-08. उपस्थिति व MDM' },
  { id: 'GRIEVANCE_WORK', label: '09-10. कार्य व शिकायतें' },
  { id: 'DOCUMENTS', label: '11. दस्तावेज' },
  { id: 'LITERACY', label: '12. उल्लास साक्षरता' },
  { id: 'ADMIN', label: '13-14. व्यवस्थापक' },
  { id: 'DASHBOARD', label: '01. डैशबोर्ड KPI' },
  { id: 'SYSTEM', label: '17. फॉन्ट टेस्ट' },
];

export const ExportCenterView: React.FC<ExportCenterViewProps> = ({ initialTab = 'CUSTOM_BUILDER' }) => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const {
    schools,
    students,
    staff,
    rasoiya,
    shgs,
    facilities,
    attendance,
    mdmRecords,
    governmentWork,
    notifications,
    complaints,
    documents,
    auditLogs,
    literacyRegisters,
    illiteratePersons,
    aksharSathis,
    examCycles,
    literacyExamResults,
    supportingInstitutions,
    literacyStats,
    stats,
    logActivity,
    academicSessions,
    selectedSessionId,
    getSchoolAcademicHistory,
    getStudentAcademicJourney,
  } = useData();

  const { users } = useAuth();

  const printReportRef = useRef<HTMLDivElement>(null);
  const [isPdfGenerating, setIsPdfGenerating] = useState<boolean>(false);
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);
  const [pdfFeedback, setPdfFeedback] = useState<{
    type: 'success' | 'error' | 'loading';
    message: string;
  } | null>(null);

  const isSchoolRestricted = currentUser?.role === 'SCHOOL';

  const defaultSchoolUdise = isSchoolRestricted
    ? (currentUser?.assignedSchoolUdise || schools[0]?.udise || '23080108302')
    : (schools[0]?.udise || '23080108302');

  // Workflow Tabs
  const [activeTab, setActiveTab] = useState<'CUSTOM_BUILDER' | 'QUICK_TEMPLATES' | 'LITERACY_FORMS' | 'FONT_TEST'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Registry Selection State
  const [selectedRegistryId, setSelectedRegistryId] = useState<string>('COMPLETE_SCHOOL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<DataCategory>('ALL');

  // Scope State
  const [scope, setScope] = useState<ExportScope>('FULL');

  // Common Filter State
  const [selectedUdise, setSelectedUdise] = useState<string>(defaultSchoolUdise);
  const [selectedSession, setSelectedSession] = useState<string>(selectedSessionId || '2026-27');

  // Contextual Dynamic Filter Values
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [filterGender, setFilterGender] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterDesignation, setFilterDesignation] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAttendanceType, setFilterAttendanceType] = useState<string>('STUDENT');
  const [filterWorkStatus, setFilterWorkStatus] = useState<string>('ALL');
  const [filterComplaintStatus, setFilterComplaintStatus] = useState<string>('ALL');
  const [filterExamCycle, setFilterExamCycle] = useState<string>('ALL');
  const [filterDocumentCategory, setFilterDocumentCategory] = useState<string>('ALL');

  // Single Entity Selection ID (for Single Scope)
  const [singleId, setSingleId] = useState<string>('');

  // School security isolation
  useEffect(() => {
    if (isSchoolRestricted && currentUser?.assignedSchoolUdise) {
      setSelectedUdise(currentUser.assignedSchoolUdise);
    }
  }, [isSchoolRestricted, currentUser]);

  useEffect(() => {
    if (selectedSessionId) {
      setSelectedSession(selectedSessionId);
    }
  }, [selectedSessionId]);

  // Active Registry Item
  const activeRegistryItem: DataExportRegistryItem = useMemo(() => {
    return DATA_EXPORT_REGISTRY.find((item) => item.id === selectedRegistryId) || DATA_EXPORT_REGISTRY[0];
  }, [selectedRegistryId]);

  // Filtered Registry Items based on Search and Category
  const filteredRegistryItems = useMemo(() => {
    return DATA_EXPORT_REGISTRY.filter((item) => {
      // Role permission check
      if (item.requiredPermission === 'ADMIN_ONLY' && currentUser?.role !== 'ADMIN') {
        return false;
      }
      if (item.requiredPermission === 'CAC_OR_ADMIN' && currentUser?.role !== 'ADMIN' && currentUser?.role !== 'CAC') {
        return false;
      }

      // Category check
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.label.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesModule = item.moduleName.toLowerCase().includes(q);
        const matchesNum = item.moduleNumber.toLowerCase().includes(q);
        const matchesId = item.id.toLowerCase().includes(q);
        return matchesName || matchesDesc || matchesModule || matchesNum || matchesId;
      }

      return true;
    });
  }, [selectedCategory, searchQuery, currentUser]);

  // Ensure valid scope when switching registry items
  useEffect(() => {
    if (activeRegistryItem) {
      if (scope === 'SINGLE' && !activeRegistryItem.supportsSingle) {
        setScope(activeRegistryItem.supportsFull ? 'FULL' : activeRegistryItem.supportsDual ? 'DUAL' : 'FULL');
      } else if (scope === 'DUAL' && !activeRegistryItem.supportsDual) {
        setScope(activeRegistryItem.supportsFull ? 'FULL' : activeRegistryItem.supportsSingle ? 'SINGLE' : 'FULL');
      } else if (scope === 'FULL' && !activeRegistryItem.supportsFull) {
        setScope(activeRegistryItem.supportsSingle ? 'SINGLE' : activeRegistryItem.supportsDual ? 'DUAL' : 'FULL');
      }
    }
  }, [activeRegistryItem, scope]);

  // Format & Layout Controls
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [reportStyle, setReportStyle] = useState<DocumentStyle>(() => getDocumentStyle());

  // Listen for document style changes across components
  useEffect(() => {
    const handleStyleChange = (e: CustomEvent<{ style: DocumentStyle }> | Event) => {
      const customEvent = e as CustomEvent<{ style: DocumentStyle }>;
      if (customEvent?.detail?.style) {
        setReportStyle(customEvent.detail.style);
      }
    };
    window.addEventListener('jsk-document-style-changed', handleStyleChange as EventListener);
    return () => {
      window.removeEventListener('jsk-document-style-changed', handleStyleChange as EventListener);
    };
  }, []);

  // Clean Document Options
  const [options, setOptions] = useState<ExportOptions>({
    includeHeader: true,
    includeSchoolIdentity: true,
    includePageNumber: false,
    includeSignature: false,
    includeFooter: false,
  });

  // Effective Single UDISE considering isolation
  const effectiveSingleUdise = isSchoolRestricted
    ? (currentUser?.assignedSchoolUdise || selectedUdise)
    : selectedUdise;

  // Active School Object (from DB)
  const activeSchool = useMemo(() => {
    return schools.find((s) => s.udise === effectiveSingleUdise) || schools[0];
  }, [schools, effectiveSingleUdise]);

  // Dynamic Options for Single Entity Picker
  const singleEntityOptions = useMemo(() => {
    if (!activeRegistryItem.singleSelectionType) return [];

    const targetSchoolUdises = isSchoolRestricted
      ? [effectiveSingleUdise]
      : selectedUdise === 'ALL'
      ? schools.map((s) => s.udise)
      : [selectedUdise];

    switch (activeRegistryItem.singleSelectionType) {
      case 'SCHOOL':
        return schools
          .filter((s) => (isSchoolRestricted ? s.udise === effectiveSingleUdise : true))
          .map((s) => ({
            id: s.udise,
            label: `${s.name || s.hindiName} (यूडाइस: ${s.udise})`,
          }));

      case 'STUDENT': {
        const pool = students.filter((s) => targetSchoolUdises.includes(s.schoolUdise));
        return pool.map((s) => ({
          id: s.samagraId,
          label: `${s.name} (कक्षा ${s.class} | समग्र: ${s.samagraId})`,
        }));
      }

      case 'TEACHER': {
        const pool = staff.filter((t) => targetSchoolUdises.includes(t.assignedSchoolUdise));
        return pool.map((t) => ({
          id: t.employeeCode || t.id,
          label: `${t.name} (${t.designation || 'शिक्षक'} | कोड: ${t.employeeCode || t.id})`,
        }));
      }

      case 'RASOIYA': {
        const pool = rasoiya.filter((r) => targetSchoolUdises.includes(r.schoolUdise));
        return pool.map((r) => ({
          id: r.id,
          label: `${r.name} (${r.category || 'रसोइया'} | मोबाइल: ${r.mobileNumber || '-'})`,
        }));
      }

      case 'SHG': {
        const pool = shgs.filter((sh) => targetSchoolUdises.includes(sh.assignedSchoolUdise));
        return pool.map((sh) => ({
          id: sh.id,
          label: `${sh.name} (सचिव: ${sh.secretaryName || '-'} | खाता: ${sh.bankAccountNumber || '-'})`,
        }));
      }

      case 'COMPLAINT': {
        const pool = complaints.filter((c) => targetSchoolUdises.includes(c.schoolUdise));
        return pool.map((c) => ({
          id: c.id,
          label: `#${c.complaintNumber || c.id.slice(0, 6)} - ${c.complainantName} (${c.type} | ${c.status})`,
        }));
      }

      case 'WORK': {
        const pool = governmentWork.filter((w) => targetSchoolUdises.includes(w.schoolUdise));
        return pool.map((w) => ({
          id: w.id,
          label: `${w.title} (${w.priority} | स्थिति: ${w.status})`,
        }));
      }

      case 'DOCUMENT': {
        return documents.map((d) => ({
          id: d.id,
          label: `${d.title} (${d.category || 'दस्तावेज'})`,
        }));
      }

      case 'LITERACY_REG': {
        return literacyRegisters.map((lr) => ({
          id: lr.id,
          label: `${lr.surveyYear} - ${lr.village} (${lr.surveyConductorName})`,
        }));
      }

      case 'LITERACY_LEARNER': {
        return illiteratePersons.map((p) => ({
          id: p.id,
          label: `${p.fullName} (आयु: ${p.age} | पिता/पति: ${p.fatherOrHusbandName})`,
        }));
      }

      case 'LITERACY_VOLUNTEER': {
        return aksharSathis.map((v) => ({
          id: v.id,
          label: `${v.fullName} (ग्राम: ${v.village} | मो: ${v.contactNumber})`,
        }));
      }

      case 'LITERACY_RESULT': {
        return literacyExamResults.map((r) => ({
          id: r.id,
          label: `${r.learnerName} (रोल नं: ${r.rollNumber} | अंक: ${r.totalMarksObtained})`,
        }));
      }

      case 'USER': {
        return (users || []).map((u: any) => ({
          id: u.id,
          label: `${u.name} (${u.role} | यूज़रनेम: ${u.username})`,
        }));
      }

      case 'AUDIT': {
        return auditLogs.map((a) => ({
          id: a.id,
          label: `${a.userName} - ${a.action} (${new Date(a.timestamp).toLocaleString('hi-IN')})`,
        }));
      }

      default:
        return [];
    }
  }, [
    activeRegistryItem,
    isSchoolRestricted,
    effectiveSingleUdise,
    selectedUdise,
    schools,
    students,
    staff,
    rasoiya,
    shgs,
    complaints,
    governmentWork,
    documents,
    literacyRegisters,
    illiteratePersons,
    aksharSathis,
    literacyExamResults,
    users,
    auditLogs
  ]);

  // Set default singleId whenever the singleEntityOptions change
  useEffect(() => {
    if (scope === 'SINGLE' && singleEntityOptions.length > 0) {
      if (!singleId || !singleEntityOptions.some((o) => o.id === singleId)) {
        setSingleId(singleEntityOptions[0].id);
      }
    }
  }, [scope, singleEntityOptions, singleId]);

  // Compile Comprehensive Export Dataset using Centralized Engine
  const compiledData = useMemo(() => {
    return compileUniversalExportData(
      activeRegistryItem,
      {
        selectedUdise: effectiveSingleUdise,
        selectedSession,
        scope,
        filters: {
          class: filterClass,
          gender: filterGender,
          category: filterCategory,
          designation: filterDesignation,
          status: filterStatus,
          attendanceType: filterAttendanceType,
          workStatus: filterWorkStatus,
          complaintStatus: filterComplaintStatus,
          examCycle: filterExamCycle,
          documentCategory: filterDocumentCategory,
          singleId,
        },
      },
      {
        currentUser,
        schools,
        students,
        staff,
        rasoiya,
        shgs,
        facilities,
        attendance,
        mdmRecords,
        governmentWork,
        notifications,
        complaints,
        documents,
        auditLogs,
        literacyRegisters,
        illiteratePersons,
        aksharSathis,
        examCycles,
        literacyExamResults,
        supportingInstitutions,
        literacyStats,
        stats,
        getSchoolAcademicHistory,
        getStudentAcademicJourney,
        users: users || [],
      }
    );
  }, [
    activeRegistryItem,
    effectiveSingleUdise,
    selectedSession,
    scope,
    filterClass,
    filterGender,
    filterCategory,
    filterDesignation,
    filterStatus,
    filterAttendanceType,
    filterWorkStatus,
    filterComplaintStatus,
    filterExamCycle,
    filterDocumentCategory,
    singleId,
    currentUser,
    schools,
    students,
    staff,
    rasoiya,
    shgs,
    facilities,
    attendance,
    mdmRecords,
    governmentWork,
    notifications,
    complaints,
    documents,
    auditLogs,
    literacyRegisters,
    illiteratePersons,
    aksharSathis,
    examCycles,
    literacyExamResults,
    supportingInstitutions,
    literacyStats,
    stats,
    getSchoolAcademicHistory,
    getStudentAcademicJourney,
    users,
  ]);

  // Perform Print Action
  const handlePrint = () => {
    logActivity('EXPORT', 'PrintCenter', `प्रिंट रिपोर्ट: ${compiledData.title} (${scope}) [${reportStyle}]`, {
      schoolUdise: effectiveSingleUdise,
      recordName: compiledData.title,
    });
    if (printReportRef.current) {
      printElement(printReportRef.current, {
        title: compiledData.title,
        orientation: orientation === 'landscape' ? 'landscape' : 'portrait',
        documentStyle: reportStyle,
      });
    } else {
      triggerSystemPrint(orientation, reportStyle);
    }
  };

  // Perform Direct Client-Side PDF Download
  const handlePDF = async () => {
    logActivity('EXPORT', 'PrintCenter', `PDF डाउनलोड: ${compiledData.title} (${scope}) [${reportStyle}]`, {
      schoolUdise: effectiveSingleUdise,
      recordName: compiledData.title,
    });

    setIsPdfGenerating(true);
    setPdfFeedback({
      type: 'loading',
      message: 'PDF तैयार किया जा रहा है... (jsPDF और html2canvas द्वारा संकलन प्रगति पर है)',
    });

    try {
      if (printReportRef.current) {
        await generateUnicodePDFFromElement(
          printReportRef.current,
          compiledData.fileName,
          orientation,
          options,
          reportStyle
        );
      } else {
        const payload: ExportDataPayload = {
          title: compiledData.title,
          subtitle: compiledData.subtitle,
          session: selectedSession,
          schoolName: compiledData.schoolName,
          udise: compiledData.udise,
          generatedBy: currentUser?.name || 'संजय जैन',
          userRole: currentUser?.role || 'CAC',
          orientation,
          summaryMetrics: compiledData.summaryMetrics,
          headers: compiledData.headers,
          rows: compiledData.rows,
          fileName: compiledData.fileName,
          options,
        };
        await exportToUnicodePDF(payload, reportStyle);
      }

      setPdfFeedback({
        type: 'success',
        message: `PDF फाइल सफलतापूर्वक डाउनलोड हो गई (${compiledData.fileName}.pdf)`,
      });
      setTimeout(() => {
        setPdfFeedback((prev) => (prev?.type === 'success' ? null : prev));
      }, 4500);
    } catch (err) {
      console.error('Primary PDF generation error:', err);
      try {
        const payload: ExportDataPayload = {
          title: compiledData.title,
          subtitle: compiledData.subtitle,
          session: selectedSession,
          schoolName: compiledData.schoolName,
          udise: compiledData.udise,
          generatedBy: currentUser?.name || 'संजय जैन',
          userRole: currentUser?.role || 'CAC',
          orientation,
          summaryMetrics: compiledData.summaryMetrics,
          headers: compiledData.headers,
          rows: compiledData.rows,
          fileName: compiledData.fileName,
          options,
        };
        await exportToUnicodePDF(payload, reportStyle);
        setPdfFeedback({
          type: 'success',
          message: `PDF फाइल सफलतापूर्वक डाउनलोड हो गई (${compiledData.fileName}.pdf)`,
        });
        setTimeout(() => {
          setPdfFeedback((prev) => (prev?.type === 'success' ? null : prev));
        }, 4500);
      } catch (fallbackErr) {
        console.error('Fallback PDF generation error:', fallbackErr);
        setPdfFeedback({
          type: 'error',
          message: 'PDF तैयार नहीं हो सका। कृपया पुनः प्रयास करें अथवा A4 प्रिंट विकल्प से "Save as PDF" चुनें।',
        });
        setTimeout(() => {
          setPdfFeedback((prev) => (prev?.type === 'error' ? null : prev));
        }, 6000);
      }
    } finally {
      setIsPdfGenerating(false);
    }
  };

  // Perform Excel Export (.xlsx)
  const handleExcel = () => {
    setIsExportingExcel(true);
    try {
      logActivity('EXPORT', 'PrintCenter', `Excel निर्यात: ${compiledData.title} (${scope})`, {
        schoolUdise: effectiveSingleUdise,
        recordName: compiledData.title,
      });

      if (selectedRegistryId === 'COMPLETE_SCHOOL' && activeSchool) {
        exportDossierToExcel({
          school: activeSchool,
          students: students.filter((s) => s.schoolUdise === activeSchool.udise),
          staff: staff.filter((t) => t.assignedSchoolUdise === activeSchool.udise),
          facilities: facilities.filter((f) => f.schoolUdise === activeSchool.udise),
          attendance: attendance.filter((a) => a.schoolUdise === activeSchool.udise),
          mdmRecords: mdmRecords.filter((m) => m.schoolUdise === activeSchool.udise),
          governmentWork: governmentWork.filter((w) => w.schoolUdise === activeSchool.udise),
          complaints: complaints.filter((c) => c.schoolUdise === activeSchool.udise),
          notifications: [],
          documents: [],
          session: selectedSession,
        });
        return;
      }

      const payload: ExportDataPayload = {
        title: compiledData.title,
        subtitle: compiledData.subtitle,
        session: selectedSession,
        schoolName: compiledData.schoolName,
        udise: compiledData.udise,
        generatedBy: currentUser?.name || 'संजय जैन',
        userRole: currentUser?.role || 'CAC',
        summaryMetrics: compiledData.summaryMetrics,
        headers: compiledData.headers,
        rows: compiledData.rows,
        fileName: compiledData.fileName,
        options,
      };
      exportToExcel(payload);
    } catch (err) {
      console.error('Excel Export Error:', err);
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Perform CSV Export (.csv)
  const handleCSV = () => {
    setIsExportingCSV(true);
    try {
      logActivity('EXPORT', 'PrintCenter', `CSV निर्यात: ${compiledData.title} (${scope})`, {
        schoolUdise: effectiveSingleUdise,
        recordName: compiledData.title,
      });

      const payload: ExportDataPayload = {
        title: compiledData.title,
        subtitle: compiledData.subtitle,
        session: selectedSession,
        schoolName: compiledData.schoolName,
        udise: compiledData.udise,
        generatedBy: currentUser?.name || 'संजय जैन',
        userRole: currentUser?.role || 'CAC',
        summaryMetrics: compiledData.summaryMetrics,
        headers: compiledData.headers,
        rows: compiledData.rows,
        fileName: compiledData.fileName,
        options,
      };
      exportToCSV(payload);
    } catch (err) {
      console.error('CSV Export Error:', err);
    } finally {
      setIsExportingCSV(false);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* TOP BANNER */}
      <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-[#0B6B4B] dark:text-emerald-300 shrink-0">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                सार्वभौमिक प्रिंट एवं डेटा निर्यात केंद्र
              </h2>
              <span className="bg-[#0B6B4B] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                17+ संपूर्ण मॉड्यूल्स
              </span>
              <span className="bg-[#FF7A00] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                Print • PDF • Excel • CSV
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {institutionConfig.institutionName} (विकासखंड: {institutionConfig.block}, जिला: {institutionConfig.district}) • एकल व संपूर्ण संकुल अभिलेख
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('CUSTOM_BUILDER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'CUSTOM_BUILDER'
                ? 'bg-[#0B6B4B] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>कस्टम रिपोर्ट बिल्डर</span>
          </button>

          <button
            onClick={() => setActiveTab('QUICK_TEMPLATES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'QUICK_TEMPLATES'
                ? 'bg-[#0B6B4B] text-white shadow-xs'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>त्वरित टेम्पलेट्स</span>
          </button>

          <button
            onClick={() => setActiveTab('LITERACY_FORMS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'LITERACY_FORMS'
                ? 'bg-[#0B6B4B] text-white shadow-xs ring-2 ring-emerald-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-700'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>उल्लास साक्षरता प्रपत्र (01-05)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('FONT_TEST');
              setSelectedRegistryId('FONT_TEST');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'FONT_TEST'
                ? 'bg-[#FF7A00] text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>फ़ॉन्ट रेंडरिंग टेस्ट</span>
          </button>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 hidden sm:block mx-1" />

          <UnifiedPrintButton
            id="btn-top-unified-print"
            onPrintCurrentView={handlePrint}
            onPrintReport={handlePDF}
            onPrintLiteracyForm={() => setActiveTab('LITERACY_FORMS')}
            currentViewLabel="Current View"
            currentViewSubtext="वर्तमान स्क्रीन / तालिका का सीधा A4 प्रिंट"
            reportLabel="Report (PDF Download)"
            reportSubtext="A4 शासकीय प्रारूप में सीधे PDF डाउनलोड"
            literacyFormLabel="ULLAS Literacy Form"
            literacyFormSubtext="उल्लास नवभारत साक्षरता प्रपत्र 01 से 05"
            buttonLabel="Print"
          />
        </div>
      </div>

      {/* ULLAS LITERACY FORMS TAB */}
      {activeTab === 'LITERACY_FORMS' && (
        <div className="animate-in fade-in duration-150">
          <LiteracyPrintExportView />
        </div>
      )}

      {/* QUICK TEMPLATES TAB */}
      {activeTab === 'QUICK_TEMPLATES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 no-print">
          {[
            {
              id: 'COMPLETE_SCHOOL',
              title: '★ संपूर्ण शाला महा-डोजियर',
              desc: 'एकल शाला का संपूर्ण एकीकृत डोजियर (मूल जानकारी, स्टाफ, छात्र, अधोसंरचना, MDM व कार्य)',
              icon: Building2,
              cat: 'DOSSIER',
            },
            {
              id: 'SCHOOL_ALL',
              title: isSchoolRestricted ? 'विद्यालय मास्टर विवरण' : 'सक्रिय विद्यालयों की मास्टर निर्देशिका',
              desc: 'यूडाइस कोड, शाला नाम, श्रेणी, ग्राम, पंचायत, संस्था प्रधान, मोबाइल व कुल दर्ज संख्या',
              icon: Building2,
              cat: 'SCHOOL',
            },
            {
              id: 'STUDENT_ALL',
              title: 'विद्यार्थी नामांकन व जाति/श्रेणी रोस्टर',
              desc: 'समग्र आईडी, APAAR, कक्षा, वर्ग (SC/ST/OBC/GEN), लिंग, CWSN व बैंक खाता विवरण',
              icon: GraduationCap,
              cat: 'STUDENT',
            },
            {
              id: 'STAFF_ALL',
              title: 'शिक्षक एवं स्टाफ पदस्थापना पंजी',
              desc: 'कर्मचारी कोड, पदनाम, विषय, मोबाइल, योग्यता, सेवा प्रकार व पदस्थ शाला',
              icon: Users,
              cat: 'STAFF',
            },
            {
              id: 'RASOIYA_ALL',
              title: 'मध्याह्न भोजन रसोइया पंजी',
              desc: 'कार्यरत रसोइया नाम, मानदेय स्थिति, बैंक खाता, आधार एवं शाला मैपिंग',
              icon: Utensils,
              cat: 'COMMUNITY',
            },
            {
              id: 'SHG_ALL',
              title: 'स्व-सहायता समूह (SHG) मास्टर',
              desc: 'समूह नाम, अध्यक्ष, सचिव, संपर्क, बैंक खाता व संबद्ध शाला विवरण',
              icon: Users,
              cat: 'COMMUNITY',
            },
            {
              id: 'FACILITIES_ALL',
              title: '16-सूत्रीय भौतिक अधोसंरचना प्रपत्र',
              desc: 'भवन, विद्युत, पेयजल, बालक/बालिका शौचालय, रैंप, CWSN, किचन शेड व खेल मैदान',
              icon: Building2,
              cat: 'OPERATIONS',
            },
            {
              id: 'MDM_DAILY_DISTRIBUTION',
              title: 'मध्याह्न भोजन (MDM) दैनिक वितरण',
              desc: 'दैनिक दर्ज छात्र, लाभांवित छात्र संख्या, मेनू, खाद्यान्न गेहूं/चावल एवं स्वच्छता ग्रेड',
              icon: Utensils,
              cat: 'OPERATIONS',
            },
            {
              id: 'WORK_REGISTER',
              title: 'शासकीय कार्य एवं समयसीमा पंजी',
              desc: 'प्राथमिकता, कार्य विवरण, समयसीमा, प्रभारी व प्रगति स्थिति',
              icon: ClipboardList,
              cat: 'GRIEVANCE_WORK',
            },
            {
              id: 'COMPLAINTS_REGISTER',
              title: 'शिकायत निवारण पंजी (Grievance)',
              desc: 'शिकायत क्रमांक, शिकायतकर्ता, विषय, दिनांक, समाधान व संपूर्ण लाइफसाइकिल',
              icon: ShieldCheck,
              cat: 'GRIEVANCE_WORK',
            },
            {
              id: 'DOCUMENTS_ARCHIVE',
              title: 'डिजिटल अभिलेखागार एवं प्रपत्र',
              desc: 'विभागीय आदेश, परिपत्र, प्रपत्र व अपलोड की गई फाइलों की अधिकृत सूची',
              icon: FileCheck2,
              cat: 'DOCUMENTS',
            },
            {
              id: 'LITERACY_SUMMARY',
              title: 'उल्लास नवभारत साक्षरता समग्र सारांश',
              desc: 'असाक्षर सर्वे, अक्षर साथी स्वयंसेवक, परीक्षा चक्र एवं परिणाम का समेकित प्रतिवेदन',
              icon: BookOpen,
              cat: 'LITERACY',
            },
          ].map((tmpl) => {
            const Icon = tmpl.icon;
            return (
              <div
                key={tmpl.id}
                onClick={() => {
                  setSelectedRegistryId(tmpl.id);
                  setActiveTab('CUSTOM_BUILDER');
                }}
                className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] hover:border-[#0B6B4B] hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                      {tmpl.cat}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#0B6B4B] transition-colors">
                    {tmpl.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {tmpl.desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs font-bold text-[#0B6B4B]">
                  <span>कस्टम बिल्डर में खोलें</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FONT TEST BANNER (IF ACTIVE) */}
      {activeTab === 'FONT_TEST' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <Type className="w-5 h-5 text-[#FF7A00]" />
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                हिंदी एवं अंग्रेजी फॉन्ट रेंडरिंग टेस्ट मोड
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                नीचे स्क्रीन पूर्वावलोकन, प्रिंट डायलॉग, PDF, Excel और CSV में देवनागरी संयुक्त अक्षरों (जैसे 'प्रधानाध्यापक', 'मलगुवां', 'बलदेवगढ़'), मात्राओं और अंकों की शुद्धता का परीक्षण करें।
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('CUSTOM_BUILDER');
              setSelectedRegistryId('SCHOOL_ALL');
            }}
            className="px-3 py-1.5 bg-white dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer"
          >
            वापस जाएं
          </button>
        </div>
      )}

      {/* CUSTOM BUILDER MAIN WORKFLOW */}
      {(activeTab === 'CUSTOM_BUILDER' || activeTab === 'FONT_TEST') && (
        <div className="space-y-5">
          {/* CONTROLS MATRIX CONTAINER */}
          <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs space-y-4 no-print">
            {/* 1. Category Filter Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-[#0B6B4B]" />
                  <span>मॉड्यूल श्रेणी चयन (Module Categories)</span>
                </span>
                <span className="text-[11px] text-gray-500">
                  कुल {DATA_EXPORT_REGISTRY.length} डेटा प्रकार उपलब्ध
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
                {CATEGORY_TABS.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#0B6B4B] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Search & Data Type Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Search Box */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  1. खोजें (Search Registry)
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="डेटा प्रकार या मॉड्यूल नाम खोजें..."
                    className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Data Type Dropdown */}
              <div className="md:col-span-8">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 flex items-center justify-between">
                  <span>2. डेटा प्रकार चुनें (Data Type Selection)</span>
                  <span className="text-[11px] font-normal text-[#0B6B4B]">
                    {filteredRegistryItems.length} परिणाम उपलब्ध
                  </span>
                </label>
                <select
                  value={selectedRegistryId}
                  onChange={(e) => {
                    setSelectedRegistryId(e.target.value);
                  }}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B]"
                >
                  {filteredRegistryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      [{item.moduleNumber}] {item.label} ({item.moduleName})
                    </option>
                  ))}
                  {filteredRegistryItems.length === 0 && (
                    <option value="">कोई डेटा प्रकार मेल नहीं खाता</option>
                  )}
                </select>
              </div>
            </div>

            {/* Selected Registry Item Detail Ribbon */}
            <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-200">
              <Info className="w-4 h-4 text-[#0B6B4B] shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold flex items-center gap-2 flex-wrap">
                  <span>{activeRegistryItem.label}</span>
                  <span className="text-[10px] bg-white dark:bg-emerald-900 px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-700 font-mono">
                    मॉड्यूल: {activeRegistryItem.moduleNumber} ({activeRegistryItem.moduleName})
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                  {activeRegistryItem.description}
                </p>
              </div>
            </div>

            {/* 3. Scope, School & Session Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {/* 3.1 Scope Selection (3 Options: Single, Dual, Full) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  3. दायरा (Scope: 3 विकल्प)
                </label>
                <div className="grid grid-cols-3 gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    disabled={!activeRegistryItem.supportsSingle}
                    onClick={() => setScope('SINGLE')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      scope === 'SINGLE'
                        ? 'bg-[#0B6B4B] text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={activeRegistryItem.singleLabel || 'एकल रिकॉर्ड प्रोफाइल'}
                  >
                    एकल (Single)
                  </button>

                  <button
                    type="button"
                    disabled={!activeRegistryItem.supportsDual}
                    onClick={() => setScope('DUAL')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      scope === 'DUAL'
                        ? 'bg-[#0B6B4B] text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={activeRegistryItem.dualLabel || 'संयुक्त / संबंधित डेटा'}
                  >
                    संयुक्त (Dual)
                  </button>

                  <button
                    type="button"
                    disabled={!activeRegistryItem.supportsFull}
                    onClick={() => setScope('FULL')}
                    className={`py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                      scope === 'FULL'
                        ? 'bg-[#0B6B4B] text-white shadow-xs'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={activeRegistryItem.fullLabel || 'संपूर्ण सूची'}
                  >
                    संपूर्ण (Full)
                  </button>
                </div>
                <div className="text-[10px] text-gray-500 mt-1 truncate">
                  {scope === 'SINGLE' && (activeRegistryItem.singleLabel || 'एकल रिकॉर्ड की संपूर्ण प्रोफाइल')}
                  {scope === 'DUAL' && (activeRegistryItem.dualLabel || 'संयुक्त व संबंधित प्रविष्टियां')}
                  {scope === 'FULL' && (activeRegistryItem.fullLabel || 'समस्त अधिकृत सूची')}
                </div>
              </div>

              {/* 3.2 School Selector (Respecting Role Security) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  4. विद्यालय (School Isolation)
                </label>
                {isSchoolRestricted ? (
                  <div className="w-full px-3 py-2 bg-emerald-50 dark:bg-[#0F1714] border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-[#0B6B4B] dark:text-emerald-300 truncate">
                    🔒 {activeSchool?.name || activeSchool?.hindiName} ({activeSchool?.udise})
                  </div>
                ) : (
                  <select
                    value={selectedUdise}
                    onChange={(e) => setSelectedUdise(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="ALL">समस्त संकुल शालाएं</option>
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise}>
                        {s.name || s.hindiName} ({s.udise})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3.3 Academic Session Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  5. शैक्षणिक सत्र (Academic Session)
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  {(academicSessions || []).map((ses) => (
                    <option key={ses.id} value={ses.id}>
                      सत्र {ses.sessionName || ses.name || ses.id} {ses.isCurrent || ses.status === 'ACTIVE' ? '(सक्रिय)' : ''}
                    </option>
                  ))}
                  {(!academicSessions || academicSessions.length === 0) && (
                    <option value="2026-27">सत्र 2026-27</option>
                  )}
                </select>
              </div>

              {/* 3.4 Print Layout Orientation */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  6. प्रिंट व PDF लेआउट (Orientation)
                </label>
                <div className="grid grid-cols-2 gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrientation('portrait')}
                    className={`py-2 px-2 rounded-xl font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      orientation === 'portrait'
                        ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                        : 'bg-gray-50 dark:bg-[#0F1714] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <span>A4 पोर्ट्रेट</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrientation('landscape')}
                    className={`py-2 px-2 rounded-xl font-bold border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      orientation === 'landscape'
                        ? 'bg-[#0B6B4B] text-white border-[#0B6B4B] shadow-xs'
                        : 'bg-gray-50 dark:bg-[#0F1714] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700'
                    }`}
                  >
                    <span>A4 लैंडस्केप</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Contextual Dynamic Filters & Single Entity Picker */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
              {/* 4.1 Single Entity Dropdown (When scope is SINGLE) */}
              {scope === 'SINGLE' && activeRegistryItem.supportsSingle && singleEntityOptions.length > 0 && (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <label className="block text-xs font-bold text-blue-900 dark:text-blue-300 mb-1">
                    एकल इकाई चुनें ({singleEntityOptions.length} उपलब्ध)
                  </label>
                  <select
                    value={singleId}
                    onChange={(e) => setSingleId(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-[#0F1714] border border-blue-300 dark:border-blue-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    {singleEntityOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 4.2 Module-Specific Sub-Filters */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {/* Class Filter */}
                {activeRegistryItem.supportedFilters.class && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      कक्षा (Class)
                    </label>
                    <select
                      value={filterClass}
                      onChange={(e) => setFilterClass(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त कक्षाएं</option>
                      {['1', '2', '3', '4', '5', '6', '7', '8'].map((c) => (
                        <option key={c} value={c}>कक्षा {c}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Gender Filter */}
                {activeRegistryItem.supportedFilters.gender && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      लिंग (Gender)
                    </label>
                    <select
                      value={filterGender}
                      onChange={(e) => setFilterGender(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त लिंग</option>
                      <option value="बालक">बालक (Boys)</option>
                      <option value="बालिका">बालिका (Girls)</option>
                    </select>
                  </div>
                )}

                {/* Category Filter */}
                {activeRegistryItem.supportedFilters.category && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      जाति वर्ग (Category)
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त वर्ग</option>
                      <option value="SC">SC (अनुसूचित जाति)</option>
                      <option value="ST">ST (अनुसूचित जनजाति)</option>
                      <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                      <option value="GEN">GEN (सामान्य)</option>
                    </select>
                  </div>
                )}

                {/* Designation Filter */}
                {activeRegistryItem.supportedFilters.designation && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      पदनाम (Designation)
                    </label>
                    <select
                      value={filterDesignation}
                      onChange={(e) => setFilterDesignation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त पदनाम</option>
                      <option value="प्राथमिक शिक्षक">प्राथमिक शिक्षक (PRT)</option>
                      <option value="माध्यमिक शिक्षक">माध्यमिक शिक्षक (TGT)</option>
                      <option value="उच्च श्रेणी शिक्षक">उच्च श्रेणी शिक्षक</option>
                      <option value="प्रधानाध्यापक">प्रधानाध्यापक (HM)</option>
                      <option value="अतिथि शिक्षक">अतिथि शिक्षक (Guest)</option>
                    </select>
                  </div>
                )}

                {/* Status Filter */}
                {activeRegistryItem.supportedFilters.status && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      स्थिति (Status)
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त स्थिति</option>
                      <option value="ACTIVE">सक्रिय (Active)</option>
                      <option value="INACTIVE">निष्क्रिय (Inactive)</option>
                    </select>
                  </div>
                )}

                {/* Attendance Type */}
                {activeRegistryItem.supportedFilters.attendanceType && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      उपस्थिति प्रकार
                    </label>
                    <select
                      value={filterAttendanceType}
                      onChange={(e) => setFilterAttendanceType(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="STUDENT">विद्यार्थी उपस्थिति</option>
                      <option value="STAFF">शिक्षक/स्टाफ उपस्थिति</option>
                    </select>
                  </div>
                )}

                {/* Work Status */}
                {activeRegistryItem.supportedFilters.workStatus && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      कार्य स्थिति
                    </label>
                    <select
                      value={filterWorkStatus}
                      onChange={(e) => setFilterWorkStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त कार्य</option>
                      <option value="PENDING">लंबित (Pending)</option>
                      <option value="IN_PROGRESS">प्रगतिरत (In Progress)</option>
                      <option value="COMPLETED">पूर्ण (Completed)</option>
                    </select>
                  </div>
                )}

                {/* Complaint Status */}
                {activeRegistryItem.supportedFilters.complaintStatus && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      शिकायत स्थिति
                    </label>
                    <select
                      value={filterComplaintStatus}
                      onChange={(e) => setFilterComplaintStatus(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त शिकायतें</option>
                      <option value="OPEN">नई / खुली (Open)</option>
                      <option value="IN_PROGRESS">कार्यवाही में (In Progress)</option>
                      <option value="RESOLVED">निराकृत (Resolved)</option>
                      <option value="CLOSED">बंद (Closed)</option>
                    </select>
                  </div>
                )}

                {/* Exam Cycle */}
                {activeRegistryItem.supportedFilters.examCycle && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      परीक्षा चक्र
                    </label>
                    <select
                      value={filterExamCycle}
                      onChange={(e) => setFilterExamCycle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त चक्र</option>
                      {examCycles.map((c) => (
                        <option key={c.id} value={c.cycleName}>
                          {c.cycleName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Document Category */}
                {activeRegistryItem.supportedFilters.documentCategory && (
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                      दस्तावेज श्रेणी
                    </label>
                    <select
                      value={filterDocumentCategory}
                      onChange={(e) => setFilterDocumentCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-gray-50 dark:bg-[#0F1714] border border-gray-300 dark:border-gray-700 rounded-lg text-xs"
                    >
                      <option value="ALL">समस्त श्रेणियां</option>
                      <option value="शासकीय आदेश">शासकीय आदेश</option>
                      <option value="परिपत्र">परिपत्र</option>
                      <option value="प्रपत्र">प्रपत्र</option>
                      <option value="योजना व निर्देश">योजना व निर्देश</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* 5. Document Display Checkbox Toggles */}
            <div className="pt-2 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="font-bold text-gray-600 dark:text-gray-400">प्रारूप विकल्प:</span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeHeader ?? true}
                    onChange={(e) => setOptions((p) => ({ ...p, includeHeader: e.target.checked }))}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span>शासकीय हेडर</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSchoolIdentity ?? true}
                    onChange={(e) => setOptions((p) => ({ ...p, includeSchoolIdentity: e.target.checked }))}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span>शाला पहचान रिबन</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeSignature ?? false}
                    onChange={(e) => setOptions((p) => ({ ...p, includeSignature: e.target.checked }))}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span>हस्ताक्षर ब्लॉक (HM / CAC)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeFooter ?? false}
                    onChange={(e) => setOptions((p) => ({ ...p, includeFooter: e.target.checked }))}
                    className="rounded text-[#0B6B4B] focus:ring-[#0B6B4B]"
                  />
                  <span>पाद-टिप्पणी (Footer)</span>
                </label>
              </div>

              {/* Print Style Toggle */}
              <PrintStyleToggle currentStyle={reportStyle} onStyleChange={setReportStyle} />
            </div>
          </div>

          {/* ACTION BAR: 4 PRIMARY FORMATS & ZOOM CONTROLS */}
          <div className="bg-white dark:bg-[#16211D] p-4 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print">
            {/* Record Count & Status */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                वर्तमान संकलित रिकॉर्ड:
              </span>
              <span className="bg-emerald-100 dark:bg-emerald-900/60 text-[#0B6B4B] dark:text-emerald-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                {compiledData.totalRecordsCount} प्रविष्टियां
              </span>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 border-l border-gray-300 dark:border-gray-700 pl-3">
                <button
                  onClick={() => setZoomLevel(Math.max(70, zoomLevel - 10))}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 text-gray-700 dark:text-gray-300 cursor-pointer"
                  title="ज़ूम कम करें"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono text-gray-600 dark:text-gray-400 min-w-10 text-center">
                  {zoomLevel}%
                </span>
                <button
                  onClick={() => setZoomLevel(Math.min(130, zoomLevel + 10))}
                  className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded hover:bg-gray-200 text-gray-700 dark:text-gray-300 cursor-pointer"
                  title="ज़ूम बढ़ाएं"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4 FORMAT ACTION BUTTONS: Print, PDF, Excel, CSV */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* CSV Export Button */}
              {isFeatureEnabled('module.export.action.csv_excel') && (
                <button
                  type="button"
                  id="btn-export-center-csv"
                  onClick={handleCSV}
                  disabled={isExportingCSV}
                  className="px-3 py-2 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="CSV फाइल डाउनलोड करें"
                >
                  <FileText className="w-4 h-4 text-[#FF7A00] shrink-0" />
                  <span>{isExportingCSV ? 'CSV तैयार...' : 'CSV (.csv)'}</span>
                </button>
              )}

              {/* Excel Export Button */}
              {isFeatureEnabled('module.export.action.csv_excel') && (
                <button
                  type="button"
                  id="btn-export-center-excel"
                  onClick={handleExcel}
                  disabled={isExportingExcel}
                  className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-xl border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="एक्सेल (.xlsx) फाइल डाउनलोड करें"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  <span>{isExportingExcel ? 'Excel तैयार...' : 'एक्सेल (.xlsx)'}</span>
                </button>
              )}

              {/* Direct PDF Download Button */}
              {isFeatureEnabled('module.export.action.official_print') && (
                <button
                  type="button"
                  id="btn-export-center-pdf"
                  onClick={handlePDF}
                  disabled={isPdfGenerating}
                  className="px-3.5 py-2 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-bold rounded-xl border border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="A4 PDF सीधे डाउनलोड करें"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span>{isPdfGenerating ? 'PDF बन रहा है...' : 'PDF डाउनलोड'}</span>
                </button>
              )}

              {/* Unified Browser Print Button */}
              {isFeatureEnabled('module.export.action.official_print') && (
                <UnifiedPrintButton
                  id="export-center-unified-print"
                  onPrintCurrentView={handlePrint}
                  onPrintReport={handlePDF}
                  onPrintLiteracyForm={() => setActiveTab('LITERACY_FORMS')}
                  currentViewLabel="A4 शासकीय प्रिंट"
                  currentViewSubtext="वर्तमान रिपोर्ट का सीधा ब्राउज़र A4 प्रिंट"
                  reportLabel="PDF रिपोर्ट डाउनलोड"
                  reportSubtext="A4 शासकीय प्रारूप में PDF डाउनलोड एवं सेव करें"
                  literacyFormLabel="उल्लास प्रपत्र 01-05"
                  literacyFormSubtext="उल्लास नवभारत साक्षरता प्रपत्र 01 से 05"
                  buttonLabel="प्रिंट (A4)"
                />
              )}
            </div>
          </div>

          {/* Real-time PDF Feedback Notification */}
          {pdfFeedback && (
            <div
              id="export-center-pdf-feedback"
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center justify-between gap-2 shadow-xs transition-all no-print ${
                pdfFeedback.type === 'loading'
                  ? 'bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200'
                  : pdfFeedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  : 'bg-red-50 dark:bg-red-950/80 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {pdfFeedback.type === 'loading' && (
                  <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400" />
                )}
                {pdfFeedback.type === 'success' && (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                )}
                {pdfFeedback.type === 'error' && (
                  <FileText className="w-4 h-4 shrink-0 text-red-600 dark:text-red-400" />
                )}
                <span className="font-semibold">{pdfFeedback.message}</span>
              </div>
              {pdfFeedback.type !== 'loading' && (
                <button
                  type="button"
                  onClick={() => setPdfFeedback(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 font-bold px-1.5 py-0.5 text-sm cursor-pointer"
                  title="बंद करें"
                >
                  ✕
                </button>
              )}
            </div>
          )}

          {/* LIVE WYSIWYG A4 DOCUMENT PREVIEW CONTAINER */}
          <div className="bg-gray-200 dark:bg-black/50 p-4 sm:p-8 rounded-2xl flex flex-col items-center overflow-x-auto">
            <div
              id="printable-report-container"
              ref={printReportRef}
              className={`w-full flex justify-center transition-all ${
                orientation === 'landscape' ? 'max-w-5xl' : 'max-w-4xl'
              }`}
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
              }}
            >
              <SmartExportDocument
                title={compiledData.title}
                subtitle={compiledData.subtitle}
                session={selectedSession}
                schoolName={compiledData.schoolName}
                udise={compiledData.udise}
                orientation={orientation}
                documentStyle={reportStyle}
                summaryMetrics={compiledData.summaryMetrics}
                headers={compiledData.headers}
                rows={compiledData.rows}
                options={options}
                dataType={selectedRegistryId}
                school={activeSchool}
                students={students.filter((s) => s.schoolUdise === effectiveSingleUdise)}
                staff={staff.filter((t) => t.assignedSchoolUdise === effectiveSingleUdise)}
                facilities={facilities.filter((f) => f.schoolUdise === effectiveSingleUdise)}
                attendance={attendance.filter((a) => a.schoolUdise === effectiveSingleUdise)}
                mdmRecords={mdmRecords.filter((m) => m.schoolUdise === effectiveSingleUdise)}
                governmentWork={governmentWork.filter((w) => w.schoolUdise === effectiveSingleUdise)}
                complaints={complaints.filter((c) => c.schoolUdise === effectiveSingleUdise)}
                singleEntityDetails={compiledData.singleEntityDetails}
                dualSectionTitle={compiledData.dualSectionTitle}
                dualHeaders={compiledData.dualHeaders}
                dualRows={compiledData.dualRows}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
