import React, { useState, useMemo } from 'react';
import {
  School as SchoolIcon,
  Search,
  Filter,
  Plus,
  ArrowRight,
  MapPin,
  Users,
  GraduationCap,
  Download,
  Printer,
  ExternalLink,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Key,
  Archive,
  RotateCcw,
  AlertTriangle,
  Power,
  Copy,
  Check,
  X,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { School, SchoolType } from '../../types';
import { exportToExcel } from '../../utils/exportUtils';
import { triggerPrint } from '../../utils/printUtils';
import { institutionConfig } from '../../config/institutionConfig';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { SmartExportModal } from '../export/SmartExportModal';
import { SchoolCredentialsDirectoryModal } from './SchoolCredentialsDirectoryModal';
import { SchoolProfileView } from './SchoolProfileView';

interface SchoolListViewProps {
  onSelectSchool: (udise: string) => void;
}

type StatusFilterType = 'ACTIVE' | 'INACTIVE';

export const SchoolListView: React.FC<SchoolListViewProps> = ({ onSelectSchool }) => {
  const { currentUser } = useAuth();
  const isSchoolRestricted = currentUser?.role === 'SCHOOL';

  if (isSchoolRestricted) {
    return (
      <SchoolProfileView
        udise={currentUser?.assignedSchoolUdise || '23080104101'}
        onBack={() => {}}
      />
    );
  }

  const {
    schools,
    allSchools,
    activeSchools,
    inactiveSchools,
    scopedSchools,
    addSchool,
    updateSchool,
    archiveSchool,
    restoreSchool,
    activateSchool,
    deactivateSchool,
    resetSchoolPassword,
    students,
    staff,
    selectedSessionId,
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterVillage, setFilterVillage] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ACTIVE');

  // Modal State for Add / Edit School
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSmartExportOpen, setIsSmartExportOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [formData, setFormData] = useState<Partial<School>>({
    schoolType: 'प्राथमिक',
    status: 'ACTIVE',
    district: institutionConfig.district,
    block: institutionConfig.block,
    sankul: 'मलगुवां',
    jsk: 'मलगुवां',
    establishmentYear: 2005,
    pin: institutionConfig.pinCode,
    address: 'ग्राम मलगुवां',
    mobile: institutionConfig.cac1.mobile,
    email: '',
    principalEmployeeId: '',
    principalAssignmentDate: '2020-01-01',
  });

  // Deactivate Modal State
  const [archiveTarget, setArchiveTarget] = useState<School | null>(null);
  const [archiveReason, setArchiveReason] = useState('प्रशासनिक निर्देश / शाला संविलियन');
  const [isArchiving, setIsArchiving] = useState(false);

  // Restore Modal State
  const [restoreTarget, setRestoreTarget] = useState<School | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  // Password Reset Modal State
  const [passwordResetTarget, setPasswordResetTarget] = useState<School | null>(null);
  const [customPasswordInput, setCustomPasswordInput] = useState('');
  const [resetGeneratedResult, setResetGeneratedResult] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Toast / Feedback message
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setActionFeedback({ type, message });
    setTimeout(() => setActionFeedback(null), 5000);
  };

  const isAdmin = currentUser?.role === 'ADMIN';
  const canEdit = currentUser?.role === 'CAC' || isAdmin;

  // Counts strictly bound to active / inactive
  const activeSchoolsCount = useMemo(
    () => (activeSchools ? activeSchools.length : 0),
    [activeSchools]
  );
  const archivedSchoolsCount = useMemo(
    () => (inactiveSchools ? inactiveSchools.length : 0),
    [inactiveSchools]
  );
  const totalSchoolsCount = (allSchools || schools).length;

  // Village list for dropdown (from active operational schools)
  const villageList = useMemo(() => {
    const list = activeSchools || schools;
    const set = new Set(list.map((s) => s.village).filter(Boolean));
    return Array.from(set).sort();
  }, [activeSchools, schools]);

  // Filtered schools based on search, type, village, and tab
  const filteredSchools = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();

    if (statusFilter === 'ACTIVE') {
      return (activeSchools || []).filter((s) => {
        const matchSearch =
          !term ||
          (s.name || '').toLowerCase().includes(term) ||
          (s.hindiName || '').toLowerCase().includes(term) ||
          (s.udise || '').includes(term) ||
          (s.village || '').toLowerCase().includes(term);

        const matchType = filterType === 'ALL' || s.schoolType === filterType;
        const matchVillage = filterVillage === 'ALL' || s.village === filterVillage;

        return matchSearch && matchType && matchVillage;
      });
    }

    // Inactive / Archived Section: special comprehensive search
    return (inactiveSchools || []).filter((s) => {
      if (!term) return true;
      return (
        (s.name || '').toLowerCase().includes(term) ||
        (s.hindiName || '').toLowerCase().includes(term) ||
        (s.udise || '').includes(term) ||
        (s.village || '').toLowerCase().includes(term) ||
        (s.gramPanchayat || '').toLowerCase().includes(term) ||
        (s.principalName || '').toLowerCase().includes(term) ||
        (s.archiveReason || '').toLowerCase().includes(term) ||
        (s.deletedBy || '').toLowerCase().includes(term) ||
        (s.deletedAt || '').includes(term)
      );
    });
  }, [activeSchools, inactiveSchools, statusFilter, searchTerm, filterType, filterVillage]);

  const handleOpenAdd = () => {
    setEditingSchool(null);
    setFormData({
      udise: '230801',
      name: 'GPS ',
      hindiName: 'शा.प्रा.शा. ',
      village: 'मलगुवां',
      gramPanchayat: 'मलगुवां',
      block: institutionConfig.block,
      district: institutionConfig.district,
      sankul: 'मलगुवां',
      jsk: 'मलगुवां',
      schoolType: 'प्राथमिक',
      status: 'ACTIVE',
      establishmentYear: 2008,
      pin: institutionConfig.pinCode,
      address: `ग्राम मलगुवां, ${institutionConfig.block}`,
      mobile: '',
      email: '',
      principalName: '',
      principalMobile: '',
      principalEmployeeId: 'EMP-HM-NEW',
      principalAssignmentDate: '2022-01-01',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (school: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSchool(school);
    setFormData(school);
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUdise = (formData.udise || '').trim();
    if (!cleanUdise || !/^\d{11}$/.test(cleanUdise)) {
      alert('यूडाइस कोड ठीक 11 अंकों का संख्यात्मक मान होना अनिवार्य है।');
      return;
    }
    if (!formData.hindiName || !formData.village) {
      alert('विद्यालय का नाम एवं ग्राम आवश्यक हैं।');
      return;
    }

    if (editingSchool) {
      updateSchool(formData as School);
      showToast('success', `विद्यालय ${formData.hindiName || formData.name} विवरण अद्यतन किया गया।`);
    } else {
      addSchool(formData as School);
      showToast('success', `नया विद्यालय ${formData.hindiName || formData.name} (${cleanUdise}) सफलतापूर्वक पंजीकृत हुआ।`);
    }
    setIsModalOpen(false);
  };

  // Perform soft archive
  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      const res = await archiveSchool(archiveTarget.udise, archiveReason);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'आर्काइव करते समय त्रुटि हुई।');
    } finally {
      setIsArchiving(false);
      setArchiveTarget(null);
      setArchiveReason('');
    }
  };

  // Perform restore
  const handleConfirmRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      const res = await restoreSchool(restoreTarget.udise);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    } catch (err: any) {
      showToast('error', err?.message || 'पुनर्स्थापित करते समय त्रुटि हुई।');
    } finally {
      setIsRestoring(false);
      setRestoreTarget(null);
    }
  };

  // Status toggle (Active / Inactive)
  const handleToggleActiveStatus = async (school: School, e: React.MouseEvent) => {
    e.stopPropagation();
    if (school.status === 'ARCHIVED' || school.isDeleted) {
      setRestoreTarget(school);
      return;
    }
    if (school.status === 'ACTIVE') {
      const res = await deactivateSchool(school.udise);
      if (res.success) showToast('success', `${school.hindiName || school.name} को निष्क्रिय किया गया।`);
    } else {
      const res = await activateSchool(school.udise);
      if (res.success) showToast('success', `${school.hindiName || school.name} को सक्रिय किया गया।`);
    }
  };

  // Reset School Password
  const handleOpenPasswordReset = (school: School, e: React.MouseEvent) => {
    e.stopPropagation();
    setPasswordResetTarget(school);
    setCustomPasswordInput(`SCH${school.udise.slice(-4)}`);
    setResetGeneratedResult(null);
    setIsCopied(false);
  };

  const handleExecutePasswordReset = async () => {
    if (!passwordResetTarget) return;
    const res = await resetSchoolPassword(passwordResetTarget.udise, customPasswordInput);
    if (res.success && res.generatedPassword) {
      setResetGeneratedResult(res.generatedPassword);
      showToast('success', res.message);
    } else {
      showToast('error', res.message);
    }
  };

  const handleCopyPassword = () => {
    if (resetGeneratedResult) {
      navigator.clipboard.writeText(resetGeneratedResult);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleExport = () => {
    const headers = [
      'क्रमांक',
      'यूडाइस कोड',
      'विद्यालय का नाम (हिंदी)',
      'अंग्रेजी नाम',
      'प्रकार',
      'स्थिति (Status)',
      'ग्राम / मजरा',
      'ग्राम पंचायत',
      'प्रधानाध्यापक',
      'मोबाइल',
      'छात्र संख्या',
      'स्टाफ संख्या',
    ];

    const rows = filteredSchools.map((s, idx) => {
      const sStudents = students.filter((st) => st.schoolUdise === s.udise).length;
      const sStaff = staff.filter((stf) => stf.assignedSchoolUdise === s.udise).length;
      const statusLabel =
        s.isDeleted || s.status === 'ARCHIVED' ? 'ARCHIVED (संग्रहीत)' : s.status === 'INACTIVE' ? 'INACTIVE (निष्क्रिय)' : 'ACTIVE (सक्रिय)';

      return [
        idx + 1,
        s.udise,
        s.hindiName,
        s.name,
        s.schoolType,
        statusLabel,
        s.village,
        s.gramPanchayat,
        s.principalName,
        s.principalMobile,
        sStudents,
        sStaff,
      ];
    });

    const payload = {
      title: 'जन शिक्षा केंद्र मलगुवां - विद्यालय प्रबंधन एवं डायरेक्टरी',
      subtitle: `सत्र ${selectedSessionId} | फ़िल्टर: ${statusFilter} | कुल विद्यालय: ${filteredSchools.length}`,
      headers,
      rows,
      fileName: `Malguwa_Schools_Management_${statusFilter}_${selectedSessionId.replace('-', '_')}`,
    };

    exportToExcel(payload);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast feedback */}
      {actionFeedback && (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold shadow-md transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/80 border-red-300 text-red-800 dark:text-red-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <SchoolIcon className="w-6 h-6 text-[#0B6B4B]" />
              <span>संकुल विद्यालय प्रबंधन (CAC School Management)</span>
            </h2>

            <div className="flex items-center gap-1.5">
              <span className="bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                सक्रिय: {activeSchoolsCount}
              </span>
              {archivedSchoolsCount > 0 && (
                <span className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                  आर्काइव्ड: {archivedSchoolsCount}
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {institutionConfig.institutionName} ({institutionConfig.district}) • विद्यालय पंजीयन, संपादन, पासवर्ड रीसेट व सुरक्षित सॉफ्ट-आर्काइव प्रबंधन
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <UnifiedPrintButton
            id="schools-list-unified-print"
            onPrintCurrentView={() => triggerPrint()}
            onPrintReport={() => setIsSmartExportOpen(true)}
            currentViewLabel="Print Current View"
            currentViewSubtext="संकुल विद्यालय डायरेक्टरी व सूची का त्वरित प्रिंट"
            reportLabel="Print Report"
            reportSubtext="शाला विवरण प्रतिवेदन / आधिकारिक A4 स्मार्ट रिपोर्ट प्रारूप"
          />

          <button
            onClick={handleExport}
            className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold rounded-lg border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>एक्सेल निर्यात (Excel)</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCredentialsModalOpen(true)}
            className="px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            title={`${activeSchoolsCount} सक्रिय शालाओं के UDISE, लॉगिन पासवर्ड व माइग्रेशन ऑडिट देखें`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>शाला लॉगिन व ऑडिट ({activeSchoolsCount})</span>
          </button>

          {canEdit && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>नया विद्यालय जोड़ें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Toolbar with Status Filter Tabs */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 text-xs">
          {/* Status View Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#0F1713] p-1 rounded-xl border border-gray-200 dark:border-gray-800 self-start">
            <button
              onClick={() => {
                setStatusFilter('ACTIVE');
                setSearchTerm('');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'ACTIVE'
                  ? 'bg-white dark:bg-[#1C2822] text-[#0B6B4B] dark:text-emerald-300 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>सक्रिय विद्यालय (Active - {activeSchoolsCount})</span>
            </button>

            <button
              onClick={() => {
                setStatusFilter('INACTIVE');
                setSearchTerm('');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'INACTIVE'
                  ? 'bg-white dark:bg-[#1C2822] text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Archive className="w-4 h-4 text-amber-600" />
              <span>निष्क्रिय / संगृहीत विद्यालय (Archived - {archivedSchoolsCount})</span>
            </button>
          </div>

          {/* Search box & Dropdowns */}
          <div className="flex items-center gap-2 flex-wrap flex-1 lg:justify-end">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={
                  statusFilter === 'ACTIVE'
                    ? 'यूडाइस, नाम या ग्राम से खोजें...'
                    : 'निष्क्रिय विद्यालय खोजें (यूडाइस, नाम, ग्राम, कारण, दिनांक)...'
                }
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
              />
            </div>

            {statusFilter === 'ACTIVE' && (
              <>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
                >
                  <option value="ALL">सभी शाला प्रकार</option>
                  <option value="प्राथमिक">प्राथमिक शाला (PS)</option>
                  <option value="माध्यमिक">माध्यमिक शाला (MS)</option>
                  <option value="हाई स्कूल">हाई स्कूल (HS/GHS)</option>
                  <option value="उच्चतर माध्यमिक">उच्चतर माध्यमिक शाला (HSS)</option>
                  <option value="अशासकीय प्राथमिक">अशासकीय प्राथमिक (Private)</option>
                  <option value="कस्तूरबा गांधी बालिका विद्यालय">KGBV</option>
                </select>

                <select
                  value={filterVillage}
                  onChange={(e) => setFilterVillage(e.target.value)}
                  className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg font-medium text-gray-700 dark:text-gray-200 focus:outline-none"
                >
                  <option value="ALL">सभी ग्राम / मजरे</option>
                  {villageList.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>
        </div>

        {statusFilter === 'INACTIVE' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-sm text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span>निष्क्रिय व सुरक्षित संगृहीत विद्यालय (Isolated Inactive Vault)</span>
            </div>
            <p className="leading-relaxed">
              यह विद्यालय सामान्य परिचालन, मुख्य डैशबोर्ड, स्कूल चयन, ड्रॉपडाउन एवं सामान्य खोज से <strong>पूरी तरह पृथक (Hidden)</strong> हैं। 
              इनका समस्त ऐतिहासिक डेटा (विद्यार्थी, शिक्षक, छात्रवृत्ति, उपस्थिति, MDM) डेटाबेस में 100% सुरक्षित है। आवश्यकता पड़ने पर किसी भी समय इन्हें <strong>'विद्यालय पुनः सक्रिय करें (Restore)'</strong> किया जा सकता है।
            </p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredSchools.length === 0 && (
        <div className="bg-white dark:bg-[#17211C] p-12 text-center rounded-2xl border border-gray-200 dark:border-gray-800">
          <SchoolIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
            {statusFilter === 'ACTIVE'
              ? 'कोई सक्रिय विद्यालय नहीं मिला'
              : 'कोई निष्क्रिय या संगृहीत विद्यालय नहीं है'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {statusFilter === 'ACTIVE'
              ? 'दिए गए खोज या फ़िल्टर मापदंडों के अनुसार कोई सक्रिय विद्यालय उपलब्ध नहीं है।'
              : 'क्लस्टर के समस्त विद्यालय वर्तमान में सक्रिय संचालित हैं।'}
          </p>
        </div>
      )}

      {/* Inactive Vault Card Grid */}
      {statusFilter === 'INACTIVE' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map((school) => {
            const sStudents = students.filter((st) => st.schoolUdise === school.udise).length;
            const sStaff = staff.filter((stf) => stf.assignedSchoolUdise === school.udise).length;

            return (
              <div
                key={school.udise}
                className="p-4 rounded-xl border border-amber-300 dark:border-amber-800/70 bg-amber-50/30 dark:bg-amber-950/20 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[11px] font-bold px-2 py-0.5 rounded border border-amber-300 dark:border-amber-800 font-mono">
                        यूडाइस: {school.udise}
                      </span>
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold px-2 py-0.5 rounded">
                        {school.schoolType}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-100 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-700">
                      <Archive className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                      <span>निष्क्रिय / INACTIVE</span>
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-gray-800 dark:text-gray-200 line-through decoration-amber-600">
                    {school.hindiName || school.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {school.name} • {school.village}
                  </p>

                  {/* Audit Details Box (Requirement 16) */}
                  <div className="mt-3 p-3 bg-white/90 dark:bg-[#121A16] rounded-xl border border-amber-200/80 dark:border-amber-900/60 text-xs space-y-1.5 text-gray-700 dark:text-gray-300">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">निष्क्रिय दिनांक:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {school.deletedAt
                          ? new Date(school.deletedAt).toLocaleDateString('hi-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'पूर्व दिनांक'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">निष्क्रियकर्ता:</span>
                      <span className="font-semibold text-gray-800 dark:text-gray-200">
                        {school.deletedBy || 'CAC Admin'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 dark:text-gray-400">निष्क्रियता का कारण:</span>
                      <span className="font-semibold text-amber-800 dark:text-amber-300 text-right truncate max-w-[170px]">
                        {school.archiveReason || 'प्रशासनिक निर्देश / संविलियन'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-gray-500 dark:text-gray-400">पूर्व स्थिति:</span>
                      <span className="font-bold text-emerald-700 dark:text-emerald-400">
                        सक्रिय (ACTIVE)
                      </span>
                    </div>
                  </div>

                  {/* Preserved Data Counters */}
                  <div className="mt-3 flex items-center justify-between px-2.5 py-1.5 bg-amber-100/60 dark:bg-amber-950/40 rounded-lg text-[11px] font-medium text-amber-900 dark:text-amber-200">
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
                      {sStudents} छात्र सुरक्षित
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-amber-700" />
                      {sStaff} शिक्षक सुरक्षित
                    </span>
                  </div>
                </div>

                {/* Restore Action */}
                <div className="mt-4 pt-3 border-t border-amber-200/80 dark:border-amber-900/60">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => setRestoreTarget(school)}
                      className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                      title="विद्यालय पुनः सक्रिय करें (Restore School)"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>विद्यालय पुनः सक्रिय करें (Restore School)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Active School Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSchools.map((school) => {
            const sStudents = students.filter((st) => st.schoolUdise === school.udise).length;
            const sStaff = staff.filter((stf) => stf.assignedSchoolUdise === school.udise).length;

            return (
              <div
                key={school.udise}
                onClick={() => onSelectSchool(school.udise)}
                className="p-4 rounded-xl border bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 cursor-pointer flex flex-col justify-between group transition-all"
              >
                <div>
                  {/* Badges row */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-mono">
                        यूडाइस: {school.udise}
                      </span>
                      <span className="text-[10px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold px-2 py-0.5 rounded">
                        {school.schoolType}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>सक्रिय</span>
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className="font-bold text-base text-gray-900 dark:text-white group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-400 transition-colors line-clamp-1">
                    {school.hindiName || school.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                    {school.name} • {school.village}
                  </p>

                  {/* School Details */}
                  <div className="mt-3 text-xs space-y-1 text-gray-600 dark:text-gray-300">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        ग्राम: {school.village} (पंचायत: {school.gramPanchayat})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span className="truncate">
                        प्र.अ.: {school.principalName || 'निर्धारित नहीं'} (
                        {school.principalMobile || 'मोबाइल अप्राप्त'})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom stats & action buttons */}
                <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-blue-700 dark:text-blue-400 font-semibold flex items-center gap-1 text-[11px]">
                      <GraduationCap className="w-3.5 h-3.5" /> {sStudents} छात्र
                    </span>
                    <span className="text-purple-700 dark:text-purple-400 font-semibold flex items-center gap-1 text-[11px]">
                      <Users className="w-3.5 h-3.5" /> {sStaff} स्टाफ
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {/* Password Reset */}
                    {canEdit && (
                      <button
                        onClick={(e) => handleOpenPasswordReset(school, e)}
                        className="p-1.5 text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors cursor-pointer"
                        title="पासवर्ड रीसेट करें (Reset Login Password)"
                      >
                        <Key className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Edit */}
                    {canEdit && (
                      <button
                        onClick={(e) => handleOpenEdit(school, e)}
                        className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded transition-colors cursor-pointer"
                        title="संपादित करें (Edit)"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Deactivate School Action */}
                    {canEdit && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchiveTarget(school);
                        }}
                        className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded transition-colors cursor-pointer"
                        title="विद्यालय निष्क्रिय करें (Deactivate School)"
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Open profile arrow */}
                    <button
                      onClick={() => onSelectSchool(school.udise)}
                      className="p-1.5 text-[#0B6B4B] group-hover:translate-x-0.5 transition-transform"
                      title="डोजियर देखें"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <SchoolIcon className="w-5 h-5 text-[#0B6B4B]" />
                <span>{editingSchool ? 'विद्यालय विवरण संशोधित करें' : 'नया विद्यालय पंजीकृत करें'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    यूडाइस कोड (11 अंक संख्यात्मक मान) *
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={formData.udise || ''}
                    onChange={(e) => setFormData({ ...formData, udise: e.target.value.replace(/\D/g, '') })}
                    disabled={!!editingSchool}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-[#0B6B4B]"
                    required
                  />
                  <p className="text-[10px] text-gray-500 mt-1">11 अंकों का आधिकारिक UDISE कोड दर्ज करें।</p>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    शाला प्रकार (School Type) *
                  </label>
                  <select
                    value={formData.schoolType || 'प्राथमिक'}
                    onChange={(e) => setFormData({ ...formData, schoolType: e.target.value as SchoolType })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="प्राथमिक">प्राथमिक शाला (1-5)</option>
                    <option value="माध्यमिक">माध्यमिक शाला (6-8)</option>
                    <option value="हाई स्कूल">हाई स्कूल (9-10)</option>
                    <option value="उच्चतर माध्यमिक">उच्चतर माध्यमिक शाला (9-12)</option>
                    <option value="अशासकीय प्राथमिक">अशासकीय प्राथमिक (मान्यता प्राप्त)</option>
                    <option value="कस्तूरबा गांधी बालिका विद्यालय">कस्तूरबा गांधी बालिका विद्यालय (KGBV)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">
                      विद्यालय का नाम (हिंदी) *
                    </label>
                    {editingSchool && !isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                        <Lock className="w-2.5 h-2.5" />
                        <span>(केवल Admin द्वारा संपादन योग्य)</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.hindiName || ''}
                    onChange={(e) => setFormData({ ...formData, hindiName: e.target.value })}
                    placeholder="उदा. शा.प्रा.शा. मलगुवां"
                    disabled={Boolean(editingSchool && !isAdmin)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      editingSchool && !isAdmin
                        ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 dark:bg-[#0F1713] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                    }`}
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-gray-700 dark:text-gray-300">
                      विद्यालय का नाम (English)
                    </label>
                    {editingSchool && !isAdmin && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-normal">
                        <Lock className="w-2.5 h-2.5" />
                        <span>(केवल Admin द्वारा संपादन योग्य)</span>
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. GPS MALGUWA"
                    disabled={Boolean(editingSchool && !isAdmin)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg ${
                      editingSchool && !isAdmin
                        ? 'bg-gray-100 dark:bg-gray-800/60 border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                        : 'bg-gray-50 dark:bg-[#0F1713] border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ग्राम / मजरा *
                  </label>
                  <input
                    type="text"
                    value={formData.village || ''}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    ग्राम पंचायत
                  </label>
                  <input
                    type="text"
                    value={formData.gramPanchayat || ''}
                    onChange={(e) => setFormData({ ...formData, gramPanchayat: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    संस्था प्रधान का नाम
                  </label>
                  <input
                    type="text"
                    value={formData.principalName || ''}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    placeholder="उदा. श्री हरिशंकर चौबे"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    प्रधान का मोबाइल नंबर
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={formData.principalMobile || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, principalMobile: e.target.value.replace(/\D/g, '') })
                    }
                    placeholder="10 अंकों का नंबर"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm"
                >
                  सुरक्षित करें (Save)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal (Safe Soft-Deactivate) */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 dark:bg-amber-950 text-amber-700 rounded-xl">
                <Power className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  विद्यालय निष्क्रिय (Deactivate) करने की पुष्टि
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {archiveTarget.hindiName || archiveTarget.name} (यूडाइस: {archiveTarget.udise})
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                <span>सुरक्षित निष्क्रियता एवं ज़ीरो डेटा लॉस नीति</span>
              </p>
              <p className="leading-relaxed">
                विद्यालय को निष्क्रिय करने पर यह सामान्य परिचालन, ड्रॉपडाउन, डैशबोर्ड व सामान्य खोज से <strong>पूरी तरह छुप (Hidden)</strong> जाएगा।
              </p>
              <p className="leading-relaxed">
                <strong>छात्र, शिक्षक, उपस्थिति, एमडीएम, परीक्षा आदि का कोई भी रिकॉर्ड डेटाबेस से नष्ट नहीं होगा।</strong> आप इसे कभी भी 'निष्क्रिय / संगृहीत विद्यालय' टैब से तुरंत पुनः सक्रिय (Restore) कर सकते हैं।
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block font-bold text-gray-700 dark:text-gray-300 text-xs">
                निष्क्रिय करने का कारण (Select / Enter Reason)
              </label>
              <select
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white mb-2"
              >
                <option value="प्रशासनिक निर्देश / शाला संविलियन">शाला संविलियन (School Merger)</option>
                <option value="शून्य दर्ज संख्या (Zero Enrollment)">शून्य दर्ज संख्या (Zero Enrollment)</option>
                <option value="शाला बंद / क्रमोन्नत (School Upgraded / Shifted)">शाला बंद / क्रमोन्नत (School Upgraded / Shifted)</option>
                <option value="प्रशासनिक आदेश (Administrative Order)">प्रशासनिक आदेश (Administrative Order)</option>
                <option value="अन्य कारण (Other Reason)">अन्य कारण (Other Reason)</option>
              </select>

              <input
                type="text"
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                placeholder="उदा. शाला संविलियन / अन्य प्रशासनिक आदेश क्रमांक..."
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
              <button
                type="button"
                disabled={isArchiving}
                onClick={() => {
                  setArchiveTarget(null);
                  setArchiveReason('प्रशासनिक निर्देश / शाला संविलियन');
                }}
                className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                disabled={isArchiving}
                onClick={handleConfirmArchive}
                className="px-5 py-2 font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isArchiving ? (
                  <span>निष्क्रिय हो रहा है...</span>
                ) : (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>हाँ, निष्क्रिय करें (Deactivate)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {restoreTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-300 dark:border-emerald-800">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] rounded-xl">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  विद्यालय पुनः सक्रिय (Restore) करने की पुष्टि
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {restoreTarget.hindiName || restoreTarget.name} (यूडाइस: {restoreTarget.udise})
                </p>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
              <p className="font-semibold flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>पुनर्स्थापन प्रभाव (Restoration Effect)</span>
              </p>
              <p className="leading-relaxed">
                यह विद्यालय तुरंत संकुल की <strong>सक्रिय सूची (Active Schools)</strong>, मुख्य डैशबोर्ड, स्कूल चयन, ड्रॉपडाउन और सामान्य खोज में पूर्ववत उपलब्ध हो जाएगा।
              </p>
              <p className="leading-relaxed">
                इसके समस्त पूर्ववर्ती छात्र, शिक्षक, उपस्थिति एवं एमडीएम रिकॉर्ड्स सामान्य कार्यप्रणाली में पुनः सक्रिय हो जाएंगे।
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
              <button
                type="button"
                disabled={isRestoring}
                onClick={() => setRestoreTarget(null)}
                className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                disabled={isRestoring}
                onClick={handleConfirmRestore}
                className="px-5 py-2 font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                {isRestoring ? (
                  <span>सक्रिय हो रहा है...</span>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>हाँ, पुनः सक्रिय करें (Restore School)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {passwordResetTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-300 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] rounded-xl">
                <Key className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  विद्यालय लॉगिन पासवर्ड रीसेट
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {passwordResetTarget.hindiName || passwordResetTarget.name}
                </p>
                <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                  यूडाइस: {passwordResetTarget.udise}
                </span>
              </div>
              <button
                onClick={() => setPasswordResetTarget(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {!resetGeneratedResult ? (
              <div className="mt-4 space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    नया पासवर्ड निर्धारित करें
                  </label>
                  <input
                    type="text"
                    value={customPasswordInput}
                    onChange={(e) => setCustomPasswordInput(e.target.value)}
                    placeholder="उदा. SCH + अंतिम 4 अंक"
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    मानक पासवर्ड प्रारूप: <code>SCH{passwordResetTarget.udise.slice(-4)}</code>
                  </p>
                </div>

                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] text-blue-800 dark:text-blue-300">
                  यह पासवर्ड विद्यालय संस्था प्रधान को संकुल स्तर से साझा किया जा सकता है।
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setPasswordResetTarget(null)}
                    className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="button"
                    onClick={handleExecutePasswordReset}
                    className="px-4 py-2 font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm"
                  >
                    पासवर्ड रीसेट करें
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3 text-xs">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center space-y-2">
                  <span className="text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    पासवर्ड सफलतापूर्वक रीसेट किया गया!
                  </span>
                  <div className="text-lg font-mono font-black text-gray-900 dark:text-white tracking-wider bg-white dark:bg-[#0F1713] p-2 rounded-lg border border-emerald-300 dark:border-emerald-700 flex items-center justify-center gap-2">
                    <span>{resetGeneratedResult}</span>
                    <button
                      onClick={handleCopyPassword}
                      className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-950 rounded text-emerald-700"
                      title="कॉपी करें"
                    >
                      {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {isCopied && (
                    <span className="text-[11px] text-emerald-600 font-bold block">
                      क्लिपबोर्ड पर कॉपी हो गया!
                    </span>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setPasswordResetTarget(null)}
                    className="px-5 py-2 font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg text-xs"
                  >
                    पूर्ण (Done)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Smart Export Modal for Schools */}
      <SmartExportModal
        isOpen={isSmartExportOpen}
        onClose={() => setIsSmartExportOpen(false)}
        initialType="COMPLETE_SCHOOL"
      />

      {/* 37 Schools Credentials & Migration Audit Modal */}
      <SchoolCredentialsDirectoryModal
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
      />
    </div>
  );
};
