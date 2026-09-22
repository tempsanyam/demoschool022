import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import {
  UploadDataType,
  DuplicateHandlingMode,
  UploadHistoryItem,
  AuditAction,
  BulkImportResult
} from '../../types';
import { DATA_TYPE_CONFIGS } from './uploadConfig';
import {
  parseUploadedFile,
  detectDataTypeFromHeaders,
  generateColumnMappings,
  processAndValidateRows,
  downloadTemplateFile,
  downloadErrorReport,
  ParsedRawData,
  ColumnMappingItem,
  ProcessedDataResult,
  ValidationErrorItem,
  RowComparisonItem
} from './uploadUtils';
import { ManualDataEntryModal } from './ManualDataEntryModal';
import { UploadHistoryView } from './UploadHistoryView';
import { ValidationErrorsView } from './ValidationErrorsView';
import { DownloadTemplatesView } from './DownloadTemplatesView';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  History,
  FileText,
  HelpCircle,
  Download,
  ArrowRight,
  Eye,
  Check,
  X,
  ChevronRight,
  School,
  GraduationCap,
  Users,
  Building2,
  ClipboardCheck,
  Utensils,
  ClipboardList,
  Layers,
  ArrowLeft,
  Sparkles,
  Info,
  ShieldCheck,
  Lock,
  BookOpen,
  Award
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataUploadViewProps {
  onNavigateToModule?: (moduleKey: string) => void;
}

export const DataUploadView: React.FC<DataUploadViewProps> = ({ onNavigateToModule }) => {
  const {
    schools,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    complaints,
    governmentWork,
    addUploadHistory,
    bulkImportSchools,
    bulkImportStudents,
    bulkImportStaff,
    bulkImportFacilities,
    bulkImportAttendance,
    bulkImportMDM,
    bulkImportComplaints,
    bulkImportGovernmentWork,
    bulkImportLiteracyLearners,
    bulkImportAksharSathis,
    bulkImportExamResults,
    bulkImportSupportingInstitutions,
    logActivity
  } = useData();

  const { currentUser } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'MANUAL' | 'HISTORY' | 'ERRORS' | 'TEMPLATES'>('UPLOAD');

  // Manual Modal state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);

  // Upload Process Steps: 1: Select/File -> 2: Map -> 3: Preview -> 4: Result
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Upload Configuration State
  const [selectedDataType, setSelectedDataType] = useState<UploadDataType>('STUDENT');
  const [duplicateMode, setDuplicateMode] = useState<DuplicateHandlingMode>('UPDATE_EXISTING');

  // File and Parsed State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedRaw, setParsedRaw] = useState<ParsedRawData | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string>('');

  // Column Mappings
  const [columnMappings, setColumnMappings] = useState<ColumnMappingItem[]>([]);

  // Validation & Processed Output
  const [processedResult, setProcessedResult] = useState<ProcessedDataResult | null>(null);
  const [previewFilter, setPreviewFilter] = useState<'ALL' | 'NEW' | 'UPDATE' | 'DUPLICATE' | 'INVALID'>('ALL');

  // Comparison Modal state
  const [selectedComparison, setSelectedComparison] = useState<RowComparisonItem | null>(null);

  // Import Execution state
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importProgressText, setImportProgressText] = useState('');
  const [importSummary, setImportSummary] = useState<{
    added: number;
    updated: number;
    skipped: number;
    failed: number;
    securityRejected?: number;
    rejectedReasons?: string[];
    dataType: UploadDataType;
    fileName: string;
    total: number;
  } | null>(null);

  // Persistent Error List for Errors Tab
  const [activeErrors, setActiveErrors] = useState<ValidationErrorItem[]>([]);

  // Icon Resolver
  const getEntityIcon = (type: UploadDataType, className: string = 'w-5 h-5') => {
    switch (type) {
      case 'SCHOOL': return <School className={className} />;
      case 'STUDENT': return <GraduationCap className={className} />;
      case 'TEACHER': return <Users className={className} />;
      case 'FACILITY': return <Building2 className={className} />;
      case 'ATTENDANCE': return <ClipboardCheck className={className} />;
      case 'MDM': return <Utensils className={className} />;
      case 'COMPLAINT': return <AlertTriangle className={className} />;
      case 'WORK': return <ClipboardList className={className} />;
      case 'LITERACY_LEARNERS': return <BookOpen className={className} />;
      case 'LITERACY_VOLUNTEERS': return <Users className={className} />;
      case 'LITERACY_EXAMS': return <Award className={className} />;
      case 'LITERACY_PARTNERS': return <Building2 className={className} />;
    }
  };

  // Step 1: File selection & Parsing
  const handleFileChange = async (file: File) => {
    setParseError('');
    setUploadedFile(file);
    setIsParsing(true);

    try {
      // Validate file extension
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (!['xlsx', 'xls', 'csv'].includes(ext || '')) {
        throw new Error('कृपया केवल Excel (.xlsx, .xls) या CSV (.csv) फ़ाइल अपलोड करें। PDF या चित्र फ़ाइलें डेटा आयात हेतु समर्थित नहीं हैं।');
      }

      const parsed = await parseUploadedFile(file);
      setParsedRaw(parsed);

      // Auto detect data type if headers give strong indication
      const detected = detectDataTypeFromHeaders(parsed.headers);
      setSelectedDataType(detected);

      // Generate column mappings
      const initialMappings = generateColumnMappings(parsed.headers, detected);
      setColumnMappings(initialMappings);

      // Move to Step 2
      setCurrentStep(2);
    } catch (err: any) {
      setParseError(err.message || 'फ़ाइल को पढ़ने में विफलता।');
      setUploadedFile(null);
      setParsedRaw(null);
    } finally {
      setIsParsing(false);
    }
  };

  // Recompute mappings when dataType changes in Step 2
  const handleDataTypeChange = (type: UploadDataType) => {
    setSelectedDataType(type);
    if (parsedRaw) {
      const newMappings = generateColumnMappings(parsedRaw.headers, type);
      setColumnMappings(newMappings);
    }
  };

  // Step 2 -> Step 3: Run Validation & Processing
  const handleProceedToPreview = () => {
    if (!parsedRaw) return;

    // Check if required fields have mapped headers
    const config = DATA_TYPE_CONFIGS[selectedDataType];
    const missingRequired = columnMappings.filter(
      (m) => m.required && (!m.mappedHeader || m.mappedHeader.trim() === '')
    );

    if (missingRequired.length > 0) {
      alert(`कृपया अनिवार्य फ़ील्ड्स को मैप करें: ${missingRequired.map((m) => m.fieldLabelHi).join(', ')}`);
      return;
    }

    const existingMaster = {
      schools,
      students,
      staff,
      facilities,
      attendance,
      mdmRecords,
      complaints,
      governmentWork
    };

    const res = processAndValidateRows(
      parsedRaw.rawRows,
      selectedDataType,
      columnMappings,
      existingMaster,
      currentUser
    );

    setProcessedResult(res);
    setActiveErrors(res.errors);
    setCurrentStep(3);
  };

  // Step 3 -> Step 4: Execute Bulk Import into real DataContext
  const handleConfirmImport = async () => {
    if (!processedResult || processedResult.validRows.length === 0) {
      alert('आयात करने हेतु कोई वैध पंक्तियाँ उपलब्ध नहीं हैं।');
      return;
    }

    setIsImporting(true);
    setImportProgress(10);
    setImportProgressText('डेटाबेस सत्यापन एवं सुरक्षा जांच जारी...');

    await new Promise((resolve) => setTimeout(resolve, 300));
    setImportProgress(40);
    setImportProgressText(`${processedResult.validRows.length} रिकॉर्ड्स का विश्लेषण एवं रूपांतरण जारी...`);

    await new Promise((resolve) => setTimeout(resolve, 350));
    setImportProgress(75);
    setImportProgressText('डेटाबेस में स्थायी रूप से सुरक्षित किया जा रहा है...');

    let importRes: BulkImportResult = { added: 0, updated: 0, skipped: 0, securityRejected: 0, rejectedReasons: [] };

    switch (selectedDataType) {
      case 'SCHOOL':
        importRes = bulkImportSchools(processedResult.validRows, duplicateMode);
        break;
      case 'STUDENT':
        importRes = bulkImportStudents(processedResult.validRows, duplicateMode);
        break;
      case 'TEACHER':
        importRes = bulkImportStaff(processedResult.validRows, duplicateMode);
        break;
      case 'FACILITY':
        importRes = bulkImportFacilities(processedResult.validRows, duplicateMode);
        break;
      case 'ATTENDANCE':
        importRes = bulkImportAttendance(processedResult.validRows, duplicateMode);
        break;
      case 'MDM':
        importRes = bulkImportMDM(processedResult.validRows, duplicateMode);
        break;
      case 'COMPLAINT':
        importRes = bulkImportComplaints(processedResult.validRows, duplicateMode);
        break;
      case 'WORK':
        importRes = bulkImportGovernmentWork(processedResult.validRows, duplicateMode);
        break;
      case 'LITERACY_LEARNERS':
        importRes = bulkImportLiteracyLearners(processedResult.validRows, duplicateMode);
        break;
      case 'LITERACY_VOLUNTEERS':
        importRes = bulkImportAksharSathis(processedResult.validRows, duplicateMode);
        break;
      case 'LITERACY_EXAMS':
        importRes = bulkImportExamResults(processedResult.validRows, duplicateMode);
        break;
      case 'LITERACY_PARTNERS':
        importRes = bulkImportSupportingInstitutions(processedResult.validRows, duplicateMode);
        break;
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
    setImportProgress(100);
    setImportProgressText('डेटा आयात पूर्ण!');

    const secRejected = importRes.securityRejected || 0;
    const rejReasons = importRes.rejectedReasons || [];
    const failedCount = processedResult.invalidCount + secRejected;
    const historyItem: UploadHistoryItem = {
      id: `UPL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      uploadedBy: currentUser?.name || 'Authorized User',
      userId: currentUser?.id || 'AUTH-USER',
      userRole: currentUser?.role || 'CAC',
      dataType: selectedDataType,
      dataTypeLabel: DATA_TYPE_CONFIGS[selectedDataType].titleHi,
      fileName: parsedRaw?.fileName || 'uploaded_data.xlsx',
      fileSize: parsedRaw?.fileSizeFormatted || '1 MB',
      totalRows: processedResult.totalRows,
      addedCount: importRes.added,
      updatedCount: importRes.updated,
      skippedCount: importRes.skipped + (duplicateMode === 'SKIP_DUPLICATES' ? processedResult.duplicateCount : 0),
      failedCount,
      securityRejectedCount: secRejected,
      rejectedReasons: rejReasons,
      duplicateMode,
      targetSchools: processedResult.targetSchools,
      status: failedCount === 0 ? 'SUCCESS' : importRes.added + importRes.updated > 0 ? 'PARTIAL' : 'FAILED',
      remarks: secRejected > 0
        ? `${DATA_TYPE_CONFIGS[selectedDataType].titleHi} डेटा थोक आयात: ${secRejected} पंक्तियाँ सुरक्षा कारणों से अस्वीकृत।`
        : `${DATA_TYPE_CONFIGS[selectedDataType].titleHi} डेटा थोक आयात पूर्ण।`
    };

    addUploadHistory(historyItem);

    setImportSummary({
      added: importRes.added,
      updated: importRes.updated,
      skipped: importRes.skipped,
      failed: failedCount,
      securityRejected: secRejected,
      rejectedReasons: rejReasons,
      dataType: selectedDataType,
      fileName: parsedRaw?.fileName || 'upload.xlsx',
      total: processedResult.totalRows
    });

    setIsImporting(false);
    setCurrentStep(4);
  };

  // Reset entire upload wizard
  const handleResetUpload = () => {
    setUploadedFile(null);
    setParsedRaw(null);
    setColumnMappings([]);
    setProcessedResult(null);
    setImportSummary(null);
    setCurrentStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Quick navigation to relevant module after successful upload
  const handleGoToModule = () => {
    if (!onNavigateToModule) return;
    switch (selectedDataType) {
      case 'SCHOOL': onNavigateToModule('schools'); break;
      case 'STUDENT': onNavigateToModule('students'); break;
      case 'TEACHER': onNavigateToModule('staff'); break;
      case 'FACILITY': onNavigateToModule('infrastructure'); break;
      case 'ATTENDANCE': onNavigateToModule('attendance'); break;
      case 'MDM': onNavigateToModule('mdm'); break;
      case 'COMPLAINT': onNavigateToModule('grievance'); break;
      case 'WORK': onNavigateToModule('works'); break;
      case 'LITERACY_LEARNERS': onNavigateToModule('literacy-learners'); break;
      case 'LITERACY_VOLUNTEERS': onNavigateToModule('literacy-volunteers'); break;
      case 'LITERACY_EXAMS': onNavigateToModule('literacy-exams'); break;
      case 'LITERACY_PARTNERS': onNavigateToModule('literacy-partners'); break;
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-white dark:bg-[#1E293B] rounded-2xl shadow-sm border border-red-200 dark:border-red-900/50 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center text-red-600 dark:text-red-400">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
          पहुंच अस्वीकृत (Access Denied)
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
          "डेटा प्रविष्टि एवं अपलोड" केवल मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है। आपकी वर्तमान लॉगिन भूमिका: <span className="font-bold">{currentUser?.role === 'CAC' ? 'जन शिक्षक (CAC)' : 'संस्था प्रभारी (SCHOOL)'}</span>।
        </p>
        <button
          onClick={() => onNavigateToModule ? onNavigateToModule('dashboard') : (window.location.hash = '#dashboard')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B6B4B] hover:bg-[#09533a] text-white text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          डैशबोर्ड पर वापस जाएं
        </button>
      </div>
    );
  }

  return (
    <div id="data-upload-main-page" className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="bg-linear-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 md:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 border border-white/10 mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>प्रमाणीकृत डेटा आयात एवं अद्यतन प्रणाली</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">
              डेटा प्रविष्टि एवं अपलोड (Data Upload & Master Management)
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              एक्सेल (Excel) व CSV फ़ाइलों से वास्तविक थोक डेटा आयात, स्वचालित कॉलम मैपिंग, यू-डायस सत्यापन, डुप्लीकेट रिकॉर्ड समाधान एवं तत्काल डेटाबेस अद्यतन।
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="open-manual-entry-quick-btn"
              onClick={() => setIsManualModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-2xl shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>+ एकल प्रविष्टि (Manual Entry)</span>
            </button>
          </div>
        </div>

        {/* 5 Main Tabs Navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10 overflow-x-auto no-scrollbar">
          <button
            id="tab-btn-upload-data"
            onClick={() => setActiveTab('UPLOAD')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'UPLOAD'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>A. डेटा अपलोड (Bulk Upload)</span>
          </button>

          <button
            id="tab-btn-manual-entry"
            onClick={() => {
              setActiveTab('MANUAL');
              setIsManualModalOpen(true);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'MANUAL'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>B. एकल प्रविष्टि (Manual Entry)</span>
          </button>

          <button
            id="tab-btn-upload-history"
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'HISTORY'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <History className="w-4 h-4" />
            <span>C. अपलोड इतिहास (Upload History)</span>
          </button>

          <button
            id="tab-btn-validation-errors"
            onClick={() => setActiveTab('ERRORS')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'ERRORS'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>D. त्रुटि विश्लेषण ({activeErrors.length})</span>
          </button>

          <button
            id="tab-btn-download-templates"
            onClick={() => setActiveTab('TEMPLATES')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'TEMPLATES'
                ? 'bg-white text-slate-900 shadow-md scale-[1.02]'
                : 'text-slate-300 hover:text-white hover:bg-white/10'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>E. मानक टेम्पलेट्स (Templates)</span>
          </button>
        </div>
      </div>

      {/* TAB B: Manual Entry Modal */}
      <ManualDataEntryModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          if (activeTab === 'MANUAL') setActiveTab('UPLOAD');
        }}
        defaultType={selectedDataType}
      />

      {/* TAB C: Upload History */}
      {activeTab === 'HISTORY' && <UploadHistoryView />}

      {/* TAB D: Validation Errors */}
      {activeTab === 'ERRORS' && (
        <ValidationErrorsView
          errors={activeErrors}
          originalFileName={parsedRaw?.fileName || 'uploaded_data.xlsx'}
          onClearErrors={() => setActiveErrors([])}
          onGoToUpload={() => setActiveTab('UPLOAD')}
        />
      )}

      {/* TAB E: Download Templates */}
      {activeTab === 'TEMPLATES' && <DownloadTemplatesView />}

      {/* TAB A: Bulk Upload Wizard */}
      {activeTab === 'UPLOAD' && (
        <div className="space-y-6">
          {/* Multi-Step Stepper Header */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 1 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                }`}>
                  1
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${currentStep >= 1 ? 'text-slate-800' : 'text-slate-400'}`}>
                  फ़ाइल व प्रकार चयन
                </span>
              </div>

              <div className={`flex-1 h-0.5 mx-3 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`} />

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 2 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                }`}>
                  2
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${currentStep >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>
                  कॉलम मैपिंग
                </span>
              </div>

              <div className={`flex-1 h-0.5 mx-3 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`} />

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 3 ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                }`}>
                  3
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${currentStep >= 3 ? 'text-slate-800' : 'text-slate-400'}`}>
                  सत्यापन व पूर्वावलोकन
                </span>
              </div>

              <div className={`flex-1 h-0.5 mx-3 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-slate-200'}`} />

              {/* Step 4 */}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep >= 4 ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-400'
                }`}>
                  {currentStep === 4 ? <Check className="w-4 h-4" /> : '4'}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${currentStep >= 4 ? 'text-emerald-700' : 'text-slate-400'}`}>
                  परिणाम एवं पुष्टि
                </span>
              </div>
            </div>
          </div>

          {/* ================= STEP 1: ENTITY & FILE SELECTION ================= */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Entity Selector 8 Cards */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">1. डेटा प्रकार का चयन करें (Select Data Type)</h3>
                    <p className="text-xs text-slate-500">जिस प्रकार का डेटा आप अपलोड करना चाहते हैं उस पर क्लिक करें:</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('TEMPLATES')}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>टेम्पलेट डाउनलोड करें</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(Object.keys(DATA_TYPE_CONFIGS) as UploadDataType[])
                    .filter((type) => currentUser?.role !== 'SCHOOL' || type !== 'SCHOOL')
                    .map((type) => {
                    const isSelected = selectedDataType === type;
                    const cfg = DATA_TYPE_CONFIGS[type];
                    return (
                      <div
                        key={type}
                        id={`select-upload-type-${type.toLowerCase()}`}
                        onClick={() => setSelectedDataType(type)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'bg-blue-50/70 border-blue-500 shadow-md ring-2 ring-blue-500/20'
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-2 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {getEntityIcon(type, 'w-4 h-4')}
                          </div>
                          <span className="text-xs font-bold text-slate-800">{cfg.titleHi.split(' ')[0]}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {cfg.description}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Duplicate Handling Mode Selection */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  डुप्लीकेट रिकॉर्ड्स नीति (Duplicate Record Policy):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'UPDATE_EXISTING'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      checked={duplicateMode === 'UPDATE_EXISTING'}
                      onChange={() => setDuplicateMode('UPDATE_EXISTING')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">पुराने रिकॉर्ड्स अपडेट करें (Update Existing)</span>
                      <span className="text-[11px] text-slate-500">यदि यू-डायस/समग्र/आईडी पहले से मौजूद है, तो डेटा अद्यतन होगा।</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'ADD_NEW'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      checked={duplicateMode === 'ADD_NEW'}
                      onChange={() => setDuplicateMode('ADD_NEW')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">केवल नए रिकॉर्ड जोड़ें (Add New Only)</span>
                      <span className="text-[11px] text-slate-500">मौजूदा रिकॉर्ड्स को न बदलें, केवल नए जोड़े जाएंगे।</span>
                    </div>
                  </label>

                  <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    duplicateMode === 'SKIP_DUPLICATES'
                      ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                  }`}>
                    <input
                      type="radio"
                      name="dupMode"
                      checked={duplicateMode === 'SKIP_DUPLICATES'}
                      onChange={() => setDuplicateMode('SKIP_DUPLICATES')}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">डुप्लीकेट छोड़ें (Skip Duplicates)</span>
                      <span className="text-[11px] text-slate-500">डुप्लीकेट को बिना बदलाव के छोड़ दिया जाएगा।</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Drag & Drop File Upload Area */}
              <div className="bg-white p-6 rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 transition-all text-center space-y-4">
                <input
                  ref={fileInputRef}
                  id="excel-csv-file-input"
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileChange(file);
                  }}
                  className="hidden"
                />

                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                  <FileSpreadsheet className="w-8 h-8" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    एक्सेल (.xlsx) या CSV (.csv) फ़ाइल यहाँ खींचें या चुनें
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    अधिकतम फ़ाइल आकार: 15 MB | स्वतः हेडर मैपिंग व त्वरित सत्यापन सक्षम
                  </p>
                </div>

                {parseError && (
                  <div className="max-w-md mx-auto p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{parseError}</span>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 pt-2">
                  <button
                    id="browse-file-btn"
                    type="button"
                    disabled={isParsing}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isParsing ? 'फ़ाइल पार्स हो रही है...' : 'फ़ाइल ब्राउज़ करें (Choose File)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadTemplateFile(selectedDataType, 'xlsx')}
                    className="flex items-center gap-1.5 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>{DATA_TYPE_CONFIGS[selectedDataType].titleHi.split(' ')[0]} टेम्पलेट (.xlsx)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 2: COLUMN MAPPING ================= */}
          {currentStep === 2 && parsedRaw && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* File Info Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{parsedRaw.fileName}</h4>
                    <span className="text-xs text-slate-400">
                      आकार: {parsedRaw.fileSizeFormatted} | कुल पंक्तियाँ: {parsedRaw.totalRawRows} | प्रारूप: {parsedRaw.fileType}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-semibold">डेटा प्रकार:</span>
                  <select
                    value={selectedDataType}
                    onChange={(e) => handleDataTypeChange(e.target.value as UploadDataType)}
                    className="px-3 py-1.5 text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {(Object.keys(DATA_TYPE_CONFIGS) as UploadDataType[]).map((t) => (
                      <option key={t} value={t}>
                        {DATA_TYPE_CONFIGS[t].titleHi}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Column Mapping Table */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">कॉलम मैपिंग (Field & Column Alignment)</h3>
                    <p className="text-xs text-slate-500">
                      सिस्टम ने आपके फ़ाइल हेडर्स को स्वतः पहचान लिया है। यदि कोई फ़ील्ड गलत मैप हुआ हो, तो ड्रॉपडाउन से सही हेडर चुनें:
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-semibold flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>स्मार्ट ऑटो-मैपिंग सक्रिय</span>
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">सिस्टम फ़ील्ड (System Field)</th>
                        <th className="px-4 py-3">प्रकार (Type)</th>
                        <th className="px-4 py-3">अनिवार्यता</th>
                        <th className="px-4 py-3">आपकी फ़ाइल का हेडर (Uploaded Header)</th>
                        <th className="px-4 py-3 text-center">मैपिंग स्थिति</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {columnMappings.map((m, idx) => (
                        <tr key={m.fieldKey} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {m.fieldLabelHi}
                            <span className="text-xs text-slate-400 font-normal block">
                              {m.fieldLabelEn} ({m.fieldKey})
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs text-slate-500 font-mono">
                            {DATA_TYPE_CONFIGS[selectedDataType].fields.find((f) => f.key === m.fieldKey)?.type || 'string'}
                          </td>
                          <td className="px-4 py-3">
                            {m.required ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-700 border border-rose-200">
                                अनिवार्य (*)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-medium rounded bg-slate-100 text-slate-600">
                                ऐच्छिक
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={m.mappedHeader}
                              onChange={(e) => {
                                const val = e.target.value;
                                setColumnMappings((prev) =>
                                  prev.map((item, i) =>
                                    i === idx ? { ...item, mappedHeader: val, confidence: val ? 'HIGH' : 'NONE' } : item
                                  )
                                );
                              }}
                              className={`w-full max-w-xs px-3 py-1.5 text-xs rounded-xl border transition-all ${
                                m.mappedHeader
                                  ? 'bg-white border-slate-300 text-slate-800'
                                  : m.required
                                  ? 'bg-red-50 border-red-300 text-red-700'
                                  : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              <option value="">-- हेडर चुनें (None) --</option>
                              {parsedRaw.headers.map((h) => (
                                <option key={h} value={h}>
                                  {h}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {m.mappedHeader ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>मैप्ड</span>
                              </span>
                            ) : m.required ? (
                              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600">
                                <AlertCircle className="w-3.5 h-3.5" />
                                <span>आवश्यक</span>
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">छोड़ा गया</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>पीछे जाएं (Back)</span>
                  </button>

                  <button
                    id="proceed-to-preview-btn"
                    onClick={handleProceedToPreview}
                    className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors"
                  >
                    <span>सत्यापन व पूर्वावलोकन करें (Validate & Preview)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 3: PREVIEW & DUPLICATE HANDLING ================= */}
          {currentStep === 3 && processedResult && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Summary Metric Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">कुल पंक्तियां</span>
                  <span className="text-2xl font-black text-slate-800 mt-1 block">{processedResult.totalRows}</span>
                </div>

                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">वैध (Valid)</span>
                  <span className="text-2xl font-black text-emerald-700 mt-1 block">{processedResult.validCount}</span>
                </div>

                <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">नए रिकॉर्ड्स</span>
                  <span className="text-2xl font-black text-blue-700 mt-1 block">+{processedResult.newCount}</span>
                </div>

                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-xs">
                  <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">अपडेट होने वाले</span>
                  <span className="text-2xl font-black text-amber-700 mt-1 block">~{processedResult.updateCount}</span>
                </div>

                <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">डुप्लीकेट (यथावत)</span>
                  <span className="text-2xl font-black text-slate-700 mt-1 block">{processedResult.duplicateCount}</span>
                </div>

                <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
                  <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">अमान्य / त्रुटियां</span>
                  <span className="text-2xl font-black text-rose-700 mt-1 block">{processedResult.invalidCount}</span>
                </div>
              </div>

              {/* Preview Filter and Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <span className="text-xs font-bold text-slate-500">फ़िल्टर:</span>
                  {(['ALL', 'NEW', 'UPDATE', 'DUPLICATE', 'INVALID'] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setPreviewFilter(f)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                        previewFilter === f
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f === 'ALL' && `सभी (${processedResult.comparisons.length})`}
                      {f === 'NEW' && `नए (+${processedResult.newCount})`}
                      {f === 'UPDATE' && `अपडेट (~${processedResult.updateCount})`}
                      {f === 'DUPLICATE' && `डुप्लीकेट (${processedResult.duplicateCount})`}
                      {f === 'INVALID' && `त्रुटियां (${processedResult.invalidCount})`}
                    </button>
                  ))}
                </div>

                {processedResult.errors.length > 0 && (
                  <button
                    onClick={() => downloadErrorReport(processedResult.errors, parsedRaw?.fileName || 'upload.xlsx')}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>एरर रिपोर्ट डाउनलोड ({processedResult.errors.length})</span>
                  </button>
                )}
              </div>

              {/* Preview Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-center">पंक्ति</th>
                        <th className="px-4 py-3">पहचान / आईडी</th>
                        <th className="px-4 py-3">शीर्षक / नाम</th>
                        <th className="px-4 py-3">स्थिति (Status)</th>
                        <th className="px-4 py-3">परिवर्तन / विवरण</th>
                        <th className="px-4 py-3 text-right">तुलना (Diff)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {processedResult.comparisons
                        .filter((comp) => {
                          if (previewFilter === 'NEW') return !comp.isExisting;
                          if (previewFilter === 'UPDATE') return comp.isExisting && comp.diffFields.length > 0;
                          if (previewFilter === 'DUPLICATE') return comp.isExisting && comp.diffFields.length === 0;
                          return true;
                        })
                        .map((comp) => {
                          const isNew = !comp.isExisting;
                          const isUpdate = comp.isExisting && comp.diffFields.length > 0;
                          const isDup = comp.isExisting && comp.diffFields.length === 0;

                          return (
                            <tr key={comp.rowNumber} className="hover:bg-slate-50/80 transition-colors">
                              <td className="px-4 py-3 text-center font-mono font-bold text-slate-500 text-xs">
                                #{comp.rowNumber}
                              </td>
                              <td className="px-4 py-3 font-mono font-bold text-slate-800 text-xs">
                                {comp.identifier || '—'}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-800 text-xs max-w-xs truncate">
                                {comp.title || '—'}
                              </td>
                              <td className="px-4 py-3">
                                {isNew ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    + नया रिकॉर्ड
                                  </span>
                                ) : isUpdate ? (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    ~ अपडेट ({comp.diffFields.length} फ़ील्ड्स)
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    यथावत (Duplicate)
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-slate-600 max-w-md truncate">
                                {isUpdate ? (
                                  <span>
                                    बदलाव: {comp.diffFields.map((d) => `${d.label} (${d.oldValue} -> ${d.newValue})`).join(', ')}
                                  </span>
                                ) : isNew ? (
                                  <span className="text-emerald-700 font-medium">डेटाबेस में नया जोड़ा जाएगा</span>
                                ) : (
                                  <span className="text-slate-400">कोई डेटा परिवर्तन नहीं</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-right">
                                {isUpdate && (
                                  <button
                                    onClick={() => setSelectedComparison(comp)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-bold flex items-center gap-1 ml-auto"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>तुलना देखें</span>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>मैपिंग सुधारें (Edit Mapping)</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleResetUpload}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    रद्द करें
                  </button>

                  <button
                    id="confirm-and-import-btn"
                    onClick={handleConfirmImport}
                    disabled={isImporting || processedResult.validCount === 0}
                    className="flex items-center gap-2 px-7 py-3 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {isImporting ? 'आयात हो रहा है...' : `डेटाबेस में आयात करें (${processedResult.validCount} रिकॉर्ड्स)`}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= STEP 4: RESULT & COMPLETION ================= */}
          {currentStep === 4 && importSummary && (
            <div className="space-y-6 animate-in zoom-in-95 duration-200">
              <div className="bg-linear-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-8 rounded-3xl text-center space-y-6 shadow-sm">
                <div className="w-20 h-20 bg-emerald-600 text-white rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-600/30 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="max-w-xl mx-auto">
                  <h2 className="text-2xl font-black text-emerald-950">डेटा आयात सफलतापूर्वक पूर्ण हुआ!</h2>
                  <p className="text-xs text-emerald-800 mt-2 leading-relaxed">
                    फ़ाइल <strong>'{importSummary.fileName}'</strong> से <strong>{importSummary.dataType}</strong> डेटा सफलतापूर्वक डेटाबेस व लोकल स्टोरेज में अद्यतन हो गया है। डैशबोर्ड एवं संबंधित मॉड्यूल में तत्काल डेटा रिफ्रेश हो चुका है।
                  </p>
                </div>

                {/* Stat Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-3xl mx-auto">
                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 block">कुल पंक्तियां</span>
                    <span className="text-xl font-black text-slate-800 mt-1">{importSummary.total}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                    <span className="text-xs font-bold text-emerald-600 block">नए जोड़े गए</span>
                    <span className="text-xl font-black text-emerald-700 mt-1">+{importSummary.added}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                    <span className="text-xs font-bold text-blue-600 block">अद्यतन (Updated)</span>
                    <span className="text-xl font-black text-blue-700 mt-1">~{importSummary.updated}</span>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 block">छोड़े गए / डुप्लीकेट</span>
                    <span className="text-xl font-black text-slate-700 mt-1">{importSummary.skipped}</span>
                  </div>

                  {importSummary.securityRejected && importSummary.securityRejected > 0 ? (
                    <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 shadow-xs">
                      <span className="text-xs font-bold text-rose-600 block">सुरक्षा अस्वीकृत</span>
                      <span className="text-xl font-black text-rose-700 mt-1">{importSummary.securityRejected}</span>
                    </div>
                  ) : null}
                </div>

                {/* Security Rejection Details Banner if any */}
                {importSummary.securityRejected && importSummary.securityRejected > 0 && (
                  <div className="bg-rose-50 border border-rose-300 p-5 rounded-2xl text-left space-y-2 max-w-2xl mx-auto shadow-xs">
                    <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>सुरक्षा / अधिकार कारणों से अस्वीकृत रिकॉर्ड्स ({importSummary.securityRejected})</span>
                    </div>
                    <p className="text-xs text-rose-700 leading-relaxed">
                      आपकी भूमिका (SCHOOL/शिक्षक) के अंतर्गत केवल आपकी अधिकृत पदस्थ शाला का डेटा अपलोड किया जा सकता है। अन्य शालाओं के यू-डायस वाले रिकॉर्ड्स को अनाधिकृत पहुँच रोकने हेतु सिस्टम द्वारा अस्वीकृत (Blocked) कर दिया गया है।
                    </p>
                    {importSummary.rejectedReasons && importSummary.rejectedReasons.length > 0 && (
                      <ul className="mt-2 space-y-1.5 max-h-40 overflow-y-auto text-xs text-rose-900 bg-white/90 p-3 rounded-xl border border-rose-200 divide-y divide-rose-100">
                        {importSummary.rejectedReasons.map((reason, idx) => (
                          <li key={idx} className="pt-1 first:pt-0 flex items-start gap-1.5">
                            <span className="text-rose-500 font-black">•</span>
                            <span className="font-medium">{reason}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Quick Action Navigation Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                  <button
                    id="view-imported-module-btn"
                    onClick={handleGoToModule}
                    className="flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all hover:scale-[1.02]"
                  >
                    <span>संबंधित मॉड्यूल में डेटा देखें</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveTab('HISTORY')}
                    className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-xs transition-colors"
                  >
                    <History className="w-4 h-4" />
                    <span>अपलोड इतिहास देखें</span>
                  </button>

                  <button
                    onClick={handleResetUpload}
                    className="flex items-center gap-2 px-5 py-3 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>अन्य फ़ाइल अपलोड करें</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Modal overlay during import */}
          {isImporting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center space-y-5 border border-slate-200">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto animate-spin">
                  <RefreshCw className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">डेटाबेस में डेटा सुरक्षित किया जा रहा है...</h3>
                  <p className="text-xs text-slate-500 mt-1">{importProgressText}</p>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                    style={{ width: `${importProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Record Comparison Modal */}
          {selectedComparison && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 border border-slate-200 animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">रिकॉर्ड तुलना एवं परिवर्तन (Diff Comparison)</h3>
                    <p className="text-xs text-slate-500">
                      पंक्ति #{selectedComparison.rowNumber} — {selectedComparison.identifier} ({selectedComparison.title})
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedComparison(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 space-y-3 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-semibold uppercase border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">फ़ील्ड</th>
                        <th className="px-3 py-2 text-rose-700 bg-rose-50/50">मौजूदा मान (Current Value)</th>
                        <th className="px-3 py-2 text-emerald-700 bg-emerald-50/50">नया अपलोड मान (New Value)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {selectedComparison.diffFields.map((d) => (
                        <tr key={d.key} className="hover:bg-slate-50">
                          <td className="px-3 py-2.5 font-bold text-slate-800">{d.label}</td>
                          <td className="px-3 py-2.5 text-rose-700 bg-rose-50/30 line-through">
                            {String(d.oldValue || 'रिक्त')}
                          </td>
                          <td className="px-3 py-2.5 text-emerald-700 bg-emerald-50/30 font-bold">
                            {String(d.newValue || 'रिक्त')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-slate-200 flex justify-end">
                  <button
                    onClick={() => setSelectedComparison(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    बंद करें
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
