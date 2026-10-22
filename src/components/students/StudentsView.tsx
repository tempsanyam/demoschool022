import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Users,
  Eye,
  Sparkles,
  ArrowRightLeft,
  History,
  X,
  AlertCircle,
  Lock,
  TrendingUp,
  FileText,
  School as SchoolIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { FeatureGuard } from '../common/FeatureGuard';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { Student, Gender, SocialCategory } from '../../types';
import { StudentTransferRecord } from '../../types/session';
import { exportToExcel } from '../../utils/exportUtils';
import { triggerPrint } from '../../utils/printUtils';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { SmartExportModal } from '../export/SmartExportModal';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { PromotionModal } from './PromotionModal';
import { BulkPromotionModal } from './BulkPromotionModal';
import { StudentProfileModal } from './StudentProfileModal';
import { TransferCertificateModal } from './TransferCertificateModal';
import { TransferRegisterModal } from './TransferRegisterModal';
import { StudentPrintModal } from './StudentPrintModal';

export const StudentsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled, getFeatureEvaluation } = useFeatureControl();
  const {
    students: scopedStudents,
    schools,
    currentSchool,
    currentSchoolUdise,
    isSchoolUser: isSchoolRestricted,
    addStudent,
    updateStudent,
    deleteStudent,
    fetchStudents
  } = useSchoolScope();
  const {
    selectedSessionId,
    isCurrentSessionSelected,
    transferStudent,
    updateStudentTransfer,
    studentTransfers,
    getStudentAcademicJourney,
    academicSessions
  } = useData();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedGender, setSelectedGender] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formTab, setFormTab] = useState<'BASIC' | 'CONTACT' | 'BANK_BENEFIT'>('BASIC');
  const [formError, setFormError] = useState<string>('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Journey Tracker Modal State
  const [journeyStudentTarget, setJourneyStudentTarget] = useState<Student | null>(null);

  // Promotion & Profile Modal State
  const [promotionStudentTarget, setPromotionStudentTarget] = useState<Student | null>(null);
  const [isBulkPromotionOpen, setIsBulkPromotionOpen] = useState(false);
  const [profileStudentTarget, setProfileStudentTarget] = useState<Student | null>(null);
  const [printStudentTarget, setPrintStudentTarget] = useState<Student | null>(null);
  const [promotionSuccessToast, setPromotionSuccessToast] = useState<string | null>(null);

  // Transfer Modal State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStudentTarget, setTransferStudentTarget] = useState<Student | null>(null);
  const [transferForm, setTransferForm] = useState<{
    destinationSchoolName: string;
    destinationSchoolUdise: string;
    newClass: string;
    tcNumber: string;
    tcDate: string;
    reason: string;
    isEditingExistingTc?: boolean;
    existingTransferId?: string;
  }>({
    destinationSchoolName: '',
    destinationSchoolUdise: '',
    newClass: '5',
    tcNumber: '',
    tcDate: new Date().toISOString().split('T')[0],
    reason: 'निवास परिवर्तन / शाला उत्क्रमण',
    isEditingExistingTc: false,
  });
  const [showTcCertificatePreview, setShowTcCertificatePreview] = useState(false);
  const [previewTcStudentTarget, setPreviewTcStudentTarget] = useState<Student | null>(null);
  const [previewTcRecord, setPreviewTcRecord] = useState<Partial<StudentTransferRecord> | null>(null);
  const [isTcRegisterModalOpen, setIsTcRegisterModalOpen] = useState(false);
  const [transferFeedback, setTransferFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDestinationUdiseChange = (rawVal: string) => {
    const cleaned = rawVal.replace(/\D/g, '').slice(0, 11);
    let autoFilledName = transferForm.destinationSchoolName;
    if (cleaned.length === 11 && !transferForm.destinationSchoolName.trim()) {
      const matched = schools.find((s) => s.udise === cleaned);
      if (matched) {
        autoFilledName = matched.name || matched.hindiName || '';
      }
    }
    setTransferForm((prev) => ({
      ...prev,
      destinationSchoolUdise: cleaned,
      destinationSchoolName: autoFilledName,
    }));
  };

  // Invalidate and safely close stale form modals if academic session changes
  React.useEffect(() => {
    if (isModalOpen) {
      setIsModalOpen(false);
      setEditingStudent(null);
      setFormError('');
    }
    if (isTransferModalOpen) {
      setIsTransferModalOpen(false);
      setTransferStudentTarget(null);
    }
    if (journeyStudentTarget) {
      setJourneyStudentTarget(null);
    }
    if (promotionStudentTarget) {
      setPromotionStudentTarget(null);
    }
    if (isBulkPromotionOpen) {
      setIsBulkPromotionOpen(false);
    }
    if (profileStudentTarget) {
      setProfileStudentTarget(null);
    }
    if (printStudentTarget) {
      setPrintStudentTarget(null);
    }
  }, [selectedSessionId]);
  
  const defaultUdise = currentSchoolUdise || (schools[0]?.udise || '');

  const [formData, setFormData] = useState<Partial<Student>>({
    class: '5',
    section: 'A',
    gender: 'बालक',
    category: 'OBC',
    isCwsn: false,
    schoolUdise: defaultUdise,
    session: selectedSessionId,
    admissionDate: new Date().toISOString().split('T')[0],
    isAadhaarVerified: true,
    isKycVerified: true,
    apaarStatus: 'Available / Generated',
    panNumber: '',
    bankAccount: {
      accountNumber: '',
      ifsc: 'SBIN0001234',
      bankName: 'भारतीय स्टेट बैंक',
    },
    benefits: {
      freeUniform: true,
      freeBooks: true,
      scholarship: true,
    },
  });

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Smart Export State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportStudentTarget, setExportStudentTarget] = useState<Student | null>(null);

  const canEdit = currentUser?.role === 'CAC' || currentUser?.role === 'SCHOOL' || currentUser?.role === 'ADMIN';

  // Check if current session is locked or archived
  const currentSessionObj = academicSessions.find((s) => s.id === selectedSessionId);
  const isSessionArchivedOrLocked = currentSessionObj
    ? (currentSessionObj.status === 'LOCKED' ||
       currentSessionObj.status === 'CLOSED' ||
       currentSessionObj.status === 'ARCHIVED' ||
       currentSessionObj.status === 'INACTIVE')
    : false;
  const canMutate = canEdit && !isSessionArchivedOrLocked;

  // Filtered Students
  const filteredStudents = useMemo(() => {
    const term = (searchTerm || '').trim().toLowerCase();
    return scopedStudents.filter((st) => {
      const matchSearch =
        !term ||
        (st.name || '').toLowerCase().includes(term) ||
        (st.samagraId || '').includes(term) ||
        (st.fatherName || '').toLowerCase().includes(term) ||
        (st.scholarNo || st.srNumber || '').toLowerCase().includes(term) ||
        (st.schoolUdise || '').includes(term);

      const matchClass = selectedClass === 'ALL' || st.class === selectedClass;
      const matchGender = selectedGender === 'ALL' || st.gender === selectedGender;
      const matchCategory = selectedCategory === 'ALL' || st.category === selectedCategory;
      const matchSchool = selectedSchoolFilter === 'ALL' || st.schoolUdise === selectedSchoolFilter;

      return matchSearch && matchClass && matchGender && matchCategory && matchSchool;
    });
  }, [scopedStudents, searchTerm, selectedClass, selectedGender, selectedCategory, selectedSchoolFilter]);

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setFormTab('BASIC');
    setFormError('');
    const effectiveUdise = currentSchoolUdise || (schools[0]?.udise || '');

    setFormData({
      samagraId: '',
      apaarId: '',
      apaarStatus: 'Pending',
      panNumber: '',
      srNumber: '',
      scholarNo: '',
      name: '',
      fatherName: '',
      motherName: '',
      guardianName: '',
      dob: '',
      gender: 'बालक',
      category: 'OBC',
      class: '1',
      section: 'A',
      schoolUdise: effectiveUdise,
      village: '',
      address: '',
      isCwsn: false,
      cwsnType: '',
      mobile: '',
      session: selectedSessionId,
      admissionDate: new Date().toISOString().split('T')[0],
      isAadhaarVerified: false,
      isKycVerified: false,
      bankAccount: {
        accountNumber: '',
        ifsc: '',
        bankName: '',
      },
      benefits: {
        freeUniform: false,
        freeBooks: false,
        scholarship: false,
      },
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setEditingStudent(st);
    setFormTab('BASIC');
    setFormError('');
    setFormData({
      ...st,
      apaarStatus: st.apaarStatus,
      panNumber: st.panNumber || '',
      bankAccount: st.bankAccount || { accountNumber: '', ifsc: 'SBIN0001234', bankName: 'भारतीय स्टेट बैंक' },
      benefits: st.benefits || { freeUniform: true, freeBooks: true, scholarship: true },
    });
    setIsModalOpen(true);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const name = (formData.name || '').trim();
    const fatherName = (formData.fatherName || '').trim();
    const samagraId = (formData.samagraId || '').trim();
    const effectiveUdise = isSchoolRestricted
      ? (currentUser?.assignedSchoolUdise || formData.schoolUdise || '')
      : (formData.schoolUdise || '');

    if (!name || !fatherName || !samagraId || !effectiveUdise) {
      setFormError('कृपया विद्यार्थी का नाम, पिता का नाम, समग्र आईडी एवं विद्यालय अनिवार्य रूप से भरें।');
      return;
    }

    if (!/^\d{9}$/.test(samagraId)) {
      setFormError('समग्र आईडी अनिवार्य रूप से 9 अंकों की संख्या होनी चाहिए।');
      return;
    }

    // Check duplicate Samagra ID
    const isDuplicate = scopedStudents.some(
      (s) => s.samagraId === samagraId && (!editingStudent || s.id !== editingStudent.id)
    );

    if (isDuplicate) {
      setFormError(`समग्र आईडी (${samagraId}) पूर्व से ही नामांकित विद्यार्थी के रूप में पंजीकृत है। कृपया दूसरी आईडी दर्ज करें।`);
      return;
    }

    // Optional PAN Number validation
    const panClean = (formData.panNumber || '').trim().toUpperCase();
    if (panClean) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panClean)) {
        setFormError('विद्यार्थी पैन नंबर (PAN Number) अमान्य है। कृपया 10-अंकीय मान्य पैन दर्ज करें (उदा. ABCDE1234F) अथवा इसे खाली छोड़ें।');
        return;
      }
    }

    const payloadToSave = {
      ...formData,
      name,
      fatherName,
      samagraId,
      schoolUdise: effectiveUdise,
      panNumber: panClean ? panClean : undefined,
      apaarStatus: formData.apaarStatus || undefined,
    };

    if (editingStudent) {
      updateStudent(payloadToSave as Student);
    } else {
      addStudent(payloadToSave as Omit<Student, 'id'>);
    }
    setIsModalOpen(false);
  };

  const handleOpenTransfer = (st: Student, existingTc?: StudentTransferRecord) => {
    setTransferStudentTarget(st);
    setShowTcCertificatePreview(false);

    // Look for existing TC if not provided
    const activeTc =
      existingTc ||
      studentTransfers.find(
        (t) => t.studentId === st.id && (t.oldSessionId === selectedSessionId || !selectedSessionId)
      );

    if (activeTc) {
      const savedUdise = (
        activeTc.destinationSchoolUdise ||
        (activeTc.newSchoolUdise && activeTc.newSchoolUdise !== 'OTHER' ? activeTc.newSchoolUdise : '') ||
        ''
      ).trim();

      const savedName = (
        activeTc.destinationSchoolName ||
        (activeTc.newSchoolName && activeTc.newSchoolName !== 'OTHER' && activeTc.newSchoolName !== 'अन्य विद्यालय (Other)'
          ? activeTc.newSchoolName
          : '') ||
        ''
      ).trim();

      setTransferForm({
        destinationSchoolName: savedName,
        destinationSchoolUdise: savedUdise,
        newClass: activeTc.newClass || st.class,
        tcNumber: activeTc.tcNumber || '',
        tcDate: activeTc.tcDate || new Date().toISOString().split('T')[0],
        reason: activeTc.reason || 'निवास परिवर्तन / शाला उत्क्रमण',
        isEditingExistingTc: true,
        existingTransferId: activeTc.id,
      });
    } else {
      setTransferForm({
        destinationSchoolName: '',
        destinationSchoolUdise: '',
        newClass: st.class,
        tcNumber: `TC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        tcDate: new Date().toISOString().split('T')[0],
        reason: 'निवास परिवर्तन / शाला उत्क्रमण',
        isEditingExistingTc: false,
        existingTransferId: undefined,
      });
    }

    setTransferFeedback(null);
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferStudentTarget) return;

    const destName = transferForm.destinationSchoolName.trim();
    const destUdise = transferForm.destinationSchoolUdise.trim();

    // 1. Destination section validation: at least one of name or udise must be entered
    if (!destName && !destUdise) {
      setTransferFeedback({
        type: 'error',
        message: 'गंतव्य विद्यालय का नाम या DISE/UDISE Code में से कम से कम एक दर्ज करें।',
      });
      return;
    }

    // 2. DISE/UDISE Code validation: if provided, must be exactly 11 digits
    if (destUdise && !/^\d{11}$/.test(destUdise)) {
      setTransferFeedback({
        type: 'error',
        message: 'DISE/UDISE Code 11 अंकों का होना चाहिए।',
      });
      return;
    }

    // 3. TC Number validation
    if (!transferForm.tcNumber.trim()) {
      setTransferFeedback({ type: 'error', message: 'कृपया टीसी क्रमांक अनिवार्यतः दर्ज करें।' });
      return;
    }

    const oldSchool = schools.find((s) => s.udise === transferStudentTarget.schoolUdise);
    const oldSchoolName = oldSchool?.name || oldSchool?.hindiName || transferStudentTarget.schoolUdise;

    if (transferForm.isEditingExistingTc && transferForm.existingTransferId) {
      // Editing existing TC
      const res = updateStudentTransfer(transferForm.existingTransferId, {
        destinationSchoolName: destName || undefined,
        destinationSchoolUdise: destUdise || undefined,
        newClass: transferForm.newClass,
        tcNumber: transferForm.tcNumber.trim(),
        tcDate: transferForm.tcDate,
        reason: transferForm.reason,
      });

      if (res.success) {
        setTransferFeedback({ type: 'success', message: res.message });
        setTimeout(() => {
          setIsTransferModalOpen(false);
          setTransferStudentTarget(null);
        }, 1200);
      } else {
        setTransferFeedback({ type: 'error', message: res.message });
      }
    } else {
      // Creating new TC
      const res = transferStudent({
        studentId: transferStudentTarget.id,
        studentName: transferStudentTarget.name,
        samagraId: transferStudentTarget.samagraId,
        oldSchoolUdise: transferStudentTarget.schoolUdise,
        oldSchoolName,
        destinationSchoolName: destName || undefined,
        destinationSchoolUdise: destUdise || undefined,
        oldSessionId: selectedSessionId,
        newSessionId: selectedSessionId,
        oldClass: transferStudentTarget.class,
        newClass: transferForm.newClass,
        reason: transferForm.reason,
        tcNumber: transferForm.tcNumber.trim(),
        tcDate: transferForm.tcDate,
      });

      if (res.success) {
        setTransferFeedback({ type: 'success', message: res.message });
        setTimeout(() => {
          setIsTransferModalOpen(false);
          setTransferStudentTarget(null);
        }, 1200);
      } else {
        setTransferFeedback({ type: 'error', message: res.message });
      }
    }
  };

  const getStudentExportPayload = () => {
    const headers = [
      'क्रमांक',
      'समग्र आईडी',
      'विद्यार्थी का नाम',
      'पिता का नाम',
      'माता का नाम',
      'विद्यालय यूडाइस',
      'कक्षा',
      'लिंग',
      'सामाजिक वर्ग',
      'CWSN',
      'मोबाइल',
      'सत्र'
    ];

    const rows = filteredStudents.map((st, idx) => [
      idx + 1,
      st.samagraId,
      st.name,
      st.fatherName,
      st.motherName || '-',
      st.schoolUdise,
      st.class,
      st.gender,
      st.category,
      st.isCwsn ? 'हाँ' : 'नहीं',
      st.mobile || '-',
      st.session || selectedSessionId
    ]);

    return {
      title: 'जन शिक्षा केंद्र मलगुवां - विद्यार्थी नामांकन सूची',
      subtitle: `सत्र ${selectedSessionId} | कुल रिकॉर्ड: ${filteredStudents.length}`,
      schoolName: currentSchool?.name || currentSchool?.hindiName,
      udise: isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter === 'ALL' ? undefined : selectedSchoolFilter),
      session: selectedSessionId,
      headers,
      rows,
      fileName: `Students_${selectedSessionId}`,
    };
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {promotionSuccessToast && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-xl flex items-center justify-between text-emerald-900 dark:text-emerald-200 text-xs shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#0B6B4B] shrink-0" />
            <span className="font-bold">{promotionSuccessToast}</span>
          </div>
          <button
            onClick={() => setPromotionSuccessToast(null)}
            className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Locked / Archived Session Notice */}
      {isSessionArchivedOrLocked && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-3.5 rounded-xl flex items-center gap-3 text-amber-900 dark:text-amber-200 text-xs shadow-xs">
          <Lock className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <strong>अभिलेखीय / लॉक्ड शैक्षणिक सत्र ({selectedSessionId}): </strong>
            यह सत्र वर्तमान में {currentSessionObj?.status === 'ARCHIVED' ? 'अभिलेखीय (Archived)' : currentSessionObj?.status === 'CLOSED' ? 'समाप्त (Closed)' : 'लॉक्ड (Locked)'} स्थिति में है। यह केवल पठन-योग्य (Read-Only) है; इसमें विद्यार्थी जोड़ना, संशोधन, विलोपन अथवा प्रोन्नति अनुमत नहीं है।
          </div>
        </div>
      )}

      {/* Top Banner & Control */}
      <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              विद्यार्थी प्रबंधन (Students Enrollment)
            </h2>
            <span className="bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
              कुल {filteredStudents.length} विद्यार्थी
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            समग्र शिक्षा अभियान अंतर्गत 9-अंकीय समग्र आईडी एवं सामाजिक वर्ग आधारित लाइव नामांकन
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isFeatureEnabled('module.students.action.print_export') && (
            <UnifiedPrintButton
              id="students-unified-print"
              currentSession={selectedSessionId}
              currentSchoolName={currentSchool?.name || currentSchool?.hindiName}
              currentUdise={isSchoolRestricted ? currentSchoolUdise : (selectedSchoolFilter === 'ALL' ? undefined : selectedSchoolFilter)}
              onPrintCurrentView={() => triggerPrint()}
              onPrintReport={() => {
                setExportStudentTarget(null);
                setIsExportModalOpen(true);
              }}
              currentViewLabel="Print Current View"
              currentViewSubtext="वर्तमान विद्यार्थी तालिका एवं फ़िल्टर का प्रिंट निकालें"
              reportLabel="Print Report"
              reportSubtext="विद्यार्थी रोस्टर / आधिकारिक A4 स्मार्ट रिपोर्ट प्रारूप"
              exportPayload={getStudentExportPayload}
            />
          )}
          {isFeatureEnabled('module.students.sub.promotion_tc') && (
            <button
              id="open-tc-register-button"
              type="button"
              onClick={() => setIsTcRegisterModalOpen(true)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="शाला स्थानांतरण प्रमाण-पत्र (TC) पंजी देखें"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>TC पंजी ({studentTransfers.length})</span>
            </button>
          )}
          {canMutate && isFeatureEnabled('module.students.sub.promotion_tc') && (
            <button
              onClick={() => setIsBulkPromotionOpen(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="कक्षा-वार सामूहिक प्रोन्नति (Bulk Promotion)"
            >
              <TrendingUp className="w-4 h-4" />
              <span>कक्षा प्रोन्नति</span>
            </button>
          )}
          {canMutate && isFeatureEnabled('module.students.action.add') && (
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2 bg-[#0B6B4B] hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>नया विद्यार्थी दर्ज करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar & Students Data Table */}
      {isFeatureEnabled('module.students.sub.directory') ? (
        <>
          <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="नाम, 9-अंक समग्र आईडी, पिता का नाम..."
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0B6B4B]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
          >
            <option value="ALL">सभी कक्षाएं (1-12)</option>
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => (
              <option key={c} value={c}>
                कक्षा {c}
              </option>
            ))}
          </select>

          {/* Gender Filter */}
          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
          >
            <option value="ALL">सभी लिंग</option>
            <option value="बालक">बालक (Boys)</option>
            <option value="बालिका">बालिका (Girls)</option>
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-200 font-medium"
          >
            <option value="ALL">सभी सामाजिक वर्ग</option>
            <option value="SC">अनुसूचित जाति (SC)</option>
            <option value="ST">अनुसूचित जनजाति (ST)</option>
            <option value="OBC">अन्य पिछड़ा वर्ग (OBC)</option>
            <option value="GENERAL">सामान्य (General)</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold">क्र.</th>
                <th className="p-3 font-bold">समग्र आईडी</th>
                <th className="p-3 font-bold">विद्यार्थी का नाम</th>
                <th className="p-3 font-bold">पिता / माता का नाम</th>
                <th className="p-3 font-bold">विद्यालय (यूडाइस)</th>
                <th className="p-3 font-bold">कक्षा</th>
                <th className="p-3 font-bold">लिंग</th>
                <th className="p-3 font-bold">सामाजिक वर्ग</th>
                <th className="p-3 font-bold">CWSN</th>
                <th className="p-3 font-bold">मोबाइल</th>
                <th className="p-3 font-bold text-center">कार्यवाही</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st, idx) => {
                  const sObj = schools.find((s) => s.udise === st.schoolUdise);
                  return (
                    <tr key={st.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40">
                      <td className="p-3 text-gray-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {st.samagraId}
                      </td>
                      <td className="p-3 font-bold text-gray-900 dark:text-white">
                        {st.name}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        <div>{st.fatherName}</div>
                        {st.motherName && <div className="text-[11px] text-gray-400">{st.motherName}</div>}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300">
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          {sObj?.name || sObj?.hindiName || st.schoolUdise}
                        </div>
                        <div className="text-[10px] font-mono text-gray-400">{st.schoolUdise}</div>
                      </td>
                      <td className="p-3 font-bold text-[#0B6B4B] dark:text-emerald-400">
                        कक्षा {st.class}
                      </td>
                      <td className="p-3">{st.gender}</td>
                      <td className="p-3">
                        <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-bold">
                          {st.category}
                        </span>
                      </td>
                      <td className="p-3">
                        {st.isCwsn ? (
                          <span className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 px-2 py-0.5 rounded font-bold">
                            हाँ
                          </span>
                        ) : (
                          <span className="text-gray-400">नहीं</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-gray-500">{st.mobile || '-'}</td>
                      <td className="p-3 text-center">
                        {(() => {
                          const isAuthorizedForStudent = !isSchoolRestricted || currentUser?.assignedSchoolUdise === st.schoolUdise;
                          const canStudentMutate = canMutate && isAuthorizedForStudent;

                          return (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setProfileStudentTarget(st)}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                                title="विद्यार्थी विवरण देखें (Profile)"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {canStudentMutate ? (
                                <button
                                  onClick={() => setPromotionStudentTarget(st)}
                                  className="p-1.5 text-[#0B6B4B] hover:text-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded font-bold transition-colors"
                                  title="कक्षा प्रोन्नति (Promote Student)"
                                >
                                  <TrendingUp className="w-3.5 h-3.5" />
                                </button>
                              ) : isSessionArchivedOrLocked ? (
                                <span
                                  className="p-1.5 text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  title="लॉक्ड सत्र में प्रोन्नति प्रतिबंधित"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              ) : null}

                              {canStudentMutate && isFeatureEnabled('module.students.action.edit') && (
                                <button
                                  onClick={() => handleOpenEdit(st)}
                                  className="p-1.5 text-gray-500 hover:text-[#0B6B4B] hover:bg-emerald-50 rounded transition-colors"
                                  title="संशोधित करें"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {isFeatureEnabled('module.students.sub.promotion_tc') && (() => {
                                const stTc = studentTransfers.find(
                                  (t) => t.studentId === st.id && (t.oldSessionId === selectedSessionId || !selectedSessionId)
                                );
                                return (
                                  <>
                                    {stTc && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPreviewTcStudentTarget(st);
                                          setPreviewTcRecord(stTc);
                                          setShowTcCertificatePreview(true);
                                        }}
                                        className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded transition-colors"
                                        title={`टीसी क्रमांक: ${stTc.tcNumber || 'जारी'} देखें व प्रिंट करें`}
                                      >
                                        <FileText className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {canStudentMutate && (
                                      <button
                                        onClick={() => handleOpenTransfer(st, stTc)}
                                        className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded transition-colors"
                                        title={stTc ? "टीसी विवरण संशोधित करें" : "शाला स्थानांतरण (TC)"}
                                      >
                                        <ArrowRightLeft className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </>
                                );
                              })()}

                              <button
                                onClick={() => setJourneyStudentTarget(st)}
                                className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors"
                                title="शैक्षणिक यात्रा (Academic Journey)"
                              >
                                <History className="w-3.5 h-3.5" />
                              </button>

                              {isFeatureEnabled('module.students.action.print_export') && (
                                <button
                                  onClick={() => setPrintStudentTarget(st)}
                                  className="p-1.5 text-gray-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded transition-colors"
                                  title="🖨 विद्यार्थी का डेटा प्रिंट / PDF डाउनलोड करें"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {canStudentMutate && isFeatureEnabled('module.students.action.delete') && (
                                <button
                                  onClick={() => setDeleteTargetId(st.id)}
                                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="हटाएं"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="p-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <GraduationCap className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                      <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                        इस शैक्षणिक सत्र में अभी कोई डेटा उपलब्ध नहीं है।
                      </p>
                      <p className="text-xs text-gray-400">
                        सत्र {selectedSessionId} के लिए कोई विद्यार्थी नामांकन उपलब्ध नहीं है।
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-8 text-center text-amber-800 dark:text-amber-300">
          <p className="font-bold text-sm">विद्यार्थी पंजीयन तालिका (Student Directory) वर्तमान में प्रशासक द्वारा निष्क्रिय है।</p>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-[#0B6B4B] dark:text-emerald-400" />
                  {editingStudent ? 'विद्यार्थी विवरण संशोधित करें' : 'नया विद्यार्थी नामांकन दर्ज करें'}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                  समग्र शिक्षा पोर्टल एवं अपार (APAAR) मानक अनुरूप पूर्ण विद्यार्थी पंजीयन
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                ✕
              </button>
            </div>

            {/* Tabs for Clean Organization */}
            <div className="flex items-center gap-2 mt-3 p-1 bg-gray-100 dark:bg-gray-800/60 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormTab('BASIC')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  formTab === 'BASIC'
                    ? 'bg-white dark:bg-[#16211D] text-[#0B6B4B] dark:text-emerald-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                1. मूल विवरण (Basic)
              </button>
              <button
                type="button"
                onClick={() => setFormTab('CONTACT')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  formTab === 'CONTACT'
                    ? 'bg-white dark:bg-[#16211D] text-[#0B6B4B] dark:text-emerald-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                2. पहचान, पंजीयन व संपर्क (ID & Contact)
              </button>
              <button
                type="button"
                onClick={() => setFormTab('BANK_BENEFIT')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  formTab === 'BANK_BENEFIT'
                    ? 'bg-white dark:bg-[#16211D] text-[#0B6B4B] dark:text-emerald-300 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
              >
                3. बैंक एवं हितलाभ (Bank & Benefits)
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto mt-3 pr-1 space-y-4 text-xs">
              {formTab === 'BASIC' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        विद्यार्थी का नाम (Student Name) *
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="उदा. राहुल अहिरवार"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        पिता का नाम (Father's Name) *
                      </label>
                      <input
                        type="text"
                        value={formData.fatherName || ''}
                        onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                        placeholder="उदा. श्री रमेश अहिरवार"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        माता का नाम (Mother's Name)
                      </label>
                      <input
                        type="text"
                        value={formData.motherName || ''}
                        onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                        placeholder="उदा. श्रीमती सुनीता देवी"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        अभिभावक का नाम (Guardian Name)
                      </label>
                      <input
                        type="text"
                        value={formData.guardianName || ''}
                        onChange={(e) => setFormData({ ...formData, guardianName: e.target.value })}
                        placeholder="यदि माता-पिता के अतिरिक्त हो"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        जन्म दिनांक (DOB) *
                      </label>
                      <input
                        type="date"
                        value={formData.dob || '2015-05-10'}
                        onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        लिंग (Gender) *
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
                      >
                        <option value="बालक">बालक (Male)</option>
                        <option value="बालिका">बालिका (Female)</option>
                        <option value="अन्य">अन्य (Other)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        कक्षा (Class) *
                      </label>
                      <select
                        value={formData.class}
                        onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-bold text-[#0B6B4B]"
                      >
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((c) => (
                          <option key={c} value={c}>
                            कक्षा {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        वर्ग/सेक्शन (Section)
                      </label>
                      <input
                        type="text"
                        value={formData.section || 'A'}
                        onChange={(e) => setFormData({ ...formData, section: e.target.value.toUpperCase() })}
                        placeholder="उदा. A / B"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        सामाजिक वर्ग (Category) *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as SocialCategory })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
                      >
                        <option value="SC">अनुसूचित जाति (SC)</option>
                        <option value="ST">अनुसूचित जनजाति (ST)</option>
                        <option value="OBC">अन्य पिछड़ा वर्ग (OBC)</option>
                        <option value="GENERAL">सामान्य (General)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        नामांकित विद्यालय (Assigned School) *
                      </label>
                      {isSchoolRestricted ? (
                        <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800/80 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 font-bold flex items-center justify-between">
                          <span className="truncate">
                            {schools.find((s) => s.udise === formData.schoolUdise)?.hindiName || formData.schoolUdise}
                          </span>
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            Auto Locked
                          </span>
                        </div>
                      ) : (
                        <select
                          value={formData.schoolUdise}
                          onChange={(e) => setFormData({ ...formData, schoolUdise: e.target.value })}
                          className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold"
                        >
                          {schools.map((s) => (
                            <option key={s.udise} value={s.udise}>
                              {s.hindiName || s.name} ({s.udise})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                    <label className="block font-bold text-gray-800 dark:text-gray-200">
                      विशेष आवश्यकता वाले बच्चे (CWSN Status)
                    </label>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="radio"
                          name="cwsnRadio"
                          checked={formData.isCwsn === true}
                          onChange={() => setFormData({ ...formData, isCwsn: true })}
                          className="text-[#0B6B4B]"
                        />
                        <span>हाँ (CWSN श्रेणी)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer font-semibold">
                        <input
                          type="radio"
                          name="cwsnRadio"
                          checked={formData.isCwsn === false}
                          onChange={() => setFormData({ ...formData, isCwsn: false, cwsnType: '' })}
                          className="text-[#0B6B4B]"
                        />
                        <span>नहीं (सामान्य विद्यार्थी)</span>
                      </label>
                    </div>
                    {formData.isCwsn && (
                      <input
                        type="text"
                        value={formData.cwsnType || ''}
                        onChange={(e) => setFormData({ ...formData, cwsnType: e.target.value })}
                        placeholder="दिव्यांगता का प्रकार (उदा. दृष्टिबाधित, अस्थिबाधित, मूक-बधिर आदि)"
                        className="w-full mt-2 px-3 py-1.5 bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium"
                      />
                    )}
                  </div>
                </div>
              )}

              {formTab === 'CONTACT' && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        समग्र सामाजिक सुरक्षा आईडी (9 अंक) *
                      </label>
                      <input
                        type="text"
                        maxLength={9}
                        value={formData.samagraId || ''}
                        onChange={(e) => setFormData({ ...formData, samagraId: e.target.value.replace(/\D/g, '') })}
                        placeholder="उदा. 123456789"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-[#0B6B4B]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        अपार आईडी (APAAR / One Nation One Student ID)
                      </label>
                      <input
                        type="text"
                        value={formData.apaarId || ''}
                        onChange={(e) => setFormData({ ...formData, apaarId: e.target.value })}
                        placeholder="उदा. APAAR-10023456"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        अपार आईडी स्थिति (APAAR ID Status)
                      </label>
                      <select
                        value={formData.apaarStatus || 'Available / Generated'}
                        onChange={(e) => setFormData({ ...formData, apaarStatus: e.target.value as any })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-semibold focus:ring-2 focus:ring-[#0B6B4B]"
                      >
                        <option value="Available / Generated">Available / Generated</option>
                        <option value="Pending">Pending</option>
                        <option value="Not Available">Not Available</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block font-bold text-gray-700 dark:text-gray-300">
                          विद्यार्थी पैन नंबर (Student PAN Number)
                        </label>
                        <span className="text-[10px] text-gray-500 font-medium">वैकल्पिक (Optional)</span>
                      </div>
                      <input
                        type="text"
                        maxLength={10}
                        value={formData.panNumber || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            panNumber: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
                          })
                        }
                        placeholder="उदा. ABCDE1234F"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono font-bold tracking-wider text-gray-900 dark:text-white uppercase focus:ring-2 focus:ring-[#0B6B4B]"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        दाखिल खारिज / स्कॉलर क्रमांक (Scholar / SR No.)
                      </label>
                      <input
                        type="text"
                        value={formData.scholarNo || formData.srNumber || ''}
                        onChange={(e) => setFormData({ ...formData, scholarNo: e.target.value, srNumber: e.target.value })}
                        placeholder="उदा. SCH-2026-042"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        अभिभावक मोबाइल नंबर (10 अंक) *
                      </label>
                      <input
                        type="text"
                        maxLength={10}
                        value={formData.mobile || ''}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value.replace(/\D/g, '') })}
                        placeholder="उदा. 9826012345"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        ग्राम / मोहल्ला (Village / Ward)
                      </label>
                      <input
                        type="text"
                        value={formData.village || ''}
                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        placeholder="उदा. मलगुवां"
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                        प्रवेश दिनांक (Admission Date)
                      </label>
                      <input
                        type="date"
                        value={formData.admissionDate || '2026-06-15'}
                        onChange={(e) => setFormData({ ...formData, admissionDate: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      स्थाई पता (Full Address)
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="ग्राम, पोस्ट, विकासखंड बलदेवगढ़, जिला टीकमगढ़ (म.प्र.)"
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {formTab === 'BANK_BENEFIT' && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>🏦</span>
                      <span>बैंक खाता विवरण (छात्रवृत्ति एवं डीबीटी हेतु)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                          बैंक का नाम
                        </label>
                        <input
                          type="text"
                          value={formData.bankAccount?.bankName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankAccount: { ...formData.bankAccount, bankName: e.target.value },
                            })
                          }
                          placeholder="उदा. भारतीय स्टेट बैंक"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                          खाता क्रमांक (Account No)
                        </label>
                        <input
                          type="text"
                          value={formData.bankAccount?.accountNumber || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankAccount: { ...formData.bankAccount, accountNumber: e.target.value.replace(/\D/g, '') },
                            })
                          }
                          placeholder="38901234567"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 dark:text-gray-300 mb-1">
                          IFSC कोड
                        </label>
                        <input
                          type="text"
                          value={formData.bankAccount?.ifsc || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              bankAccount: { ...formData.bankAccount, ifsc: e.target.value.toUpperCase() },
                            })
                          }
                          placeholder="SBIN0001234"
                          className="w-full px-2.5 py-1.5 bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg font-mono text-gray-900 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-gray-200 dark:border-gray-800 space-y-3">
                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>🎁</span>
                      <span>शासकीय योजना एवं हितलाभ पात्रता</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <label className="flex items-center gap-2 p-2 bg-white dark:bg-[#16211D] rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.benefits?.freeUniform ?? true}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: { ...formData.benefits, freeUniform: e.target.checked },
                            })
                          }
                          className="text-[#0B6B4B] rounded"
                        />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">निःशुल्क गणवेश (Uniform)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white dark:bg-[#16211D] rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.benefits?.freeBooks ?? true}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: { ...formData.benefits, freeBooks: e.target.checked },
                            })
                          }
                          className="text-[#0B6B4B] rounded"
                        />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">निःशुल्क पाठ्यपुस्तक (Books)</span>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white dark:bg-[#16211D] rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.benefits?.scholarship ?? true}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              benefits: { ...formData.benefits, scholarship: e.target.checked },
                            })
                          }
                          className="text-[#0B6B4B] rounded"
                        />
                        <span className="font-semibold text-gray-800 dark:text-gray-200">समेकित छात्रवृत्ति (Scholarship)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0B6B4B] dark:text-emerald-300">
                      <input
                        type="checkbox"
                        checked={formData.isAadhaarVerified ?? true}
                        onChange={(e) => setFormData({ ...formData, isAadhaarVerified: e.target.checked })}
                        className="text-[#0B6B4B] rounded"
                      />
                      <span>आधार प्रमाणीकरण पूर्ण (Aadhaar Verified)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[#0B6B4B] dark:text-emerald-300">
                      <input
                        type="checkbox"
                        checked={formData.isKycVerified ?? true}
                        onChange={(e) => setFormData({ ...formData, isKycVerified: e.target.checked })}
                        className="text-[#0B6B4B] rounded"
                      />
                      <span>समग्र ई-केवाईसी पूर्ण (e-KYC Complete)</span>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  {formTab !== 'BASIC' && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === 'BANK_BENEFIT' ? 'CONTACT' : 'BASIC')}
                      className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold"
                    >
                      ← पिछला
                    </button>
                  )}
                  {formTab !== 'BANK_BENEFIT' && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === 'BASIC' ? 'CONTACT' : 'BANK_BENEFIT')}
                      className="px-3 py-1.5 bg-[#0B6B4B]/10 text-[#0B6B4B] dark:text-emerald-300 rounded-lg text-xs font-bold"
                    >
                      अगला →
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-bold text-white bg-[#0B6B4B] hover:bg-emerald-800 rounded-lg shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{editingStudent ? 'विवरण अद्यतन करें' : 'नामांकन सुरक्षित करें'}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        title="विद्यार्थी रिकॉर्ड हटाने की पुष्टि"
        message="क्या आप वास्तव में इस विद्यार्थी का नामांकन रिकॉर्ड हटाना चाहते हैं? यह कार्यवाही ऑडिट लॉग में दर्ज की जाएगी।"
        confirmText="हटाएं"
        cancelText="रद्द करें"
        isDestructive
        onConfirm={() => {
          if (deleteTargetId) {
            deleteStudent(deleteTargetId);
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Smart Export & Print Modal */}
      <SmartExportModal
        isOpen={isExportModalOpen}
        onClose={() => {
          setIsExportModalOpen(false);
          setExportStudentTarget(null);
        }}
        initialType="STUDENT"
        initialStudentId={exportStudentTarget?.id}
        initialUdise={exportStudentTarget?.schoolUdise || (selectedSchoolFilter !== 'ALL' ? selectedSchoolFilter : undefined)}
      />

      {/* Academic Journey Tracker Modal */}
      {journeyStudentTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A2620] rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-blue-900 to-indigo-950 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white/10 rounded-xl">
                  <History className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg">विद्यार्थी शैक्षणिक यात्रा (Multi-Year Journey)</h3>
                  <p className="text-xs text-blue-200">
                    स्थायी मास्टर आईडी: <span className="font-mono font-bold text-white">{journeyStudentTarget.id}</span> • समग्र: <span className="font-mono font-bold text-white">{journeyStudentTarget.samagraId}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setJourneyStudentTarget(null)}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Student Basic Summary */}
            <div className="bg-gray-50 dark:bg-[#15201A] px-5 py-3 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-gray-500">विद्यार्थी का नाम:</span>{' '}
                <strong className="text-gray-900 dark:text-white text-sm">{journeyStudentTarget.name}</strong>
              </div>
              <div>
                <span className="text-gray-500">पिता का नाम:</span>{' '}
                <strong className="text-gray-900 dark:text-white">{journeyStudentTarget.fatherName}</strong>
              </div>
              <div>
                <span className="text-gray-500">वर्ग:</span>{' '}
                <span className="font-bold px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-800 dark:text-gray-200">
                  {journeyStudentTarget.category}
                </span>
              </div>
              <div>
                <span className="text-gray-500">लिंग:</span>{' '}
                <strong className="text-gray-900 dark:text-white">{journeyStudentTarget.gender}</strong>
              </div>
            </div>

            {/* Journey Timeline */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {(() => {
                const journey = getStudentAcademicJourney(journeyStudentTarget.id);
                if (journey.length === 0) {
                  return (
                    <div className="p-8 text-center text-gray-500">
                      कोई पूर्व शैक्षणिक इतिहास उपलब्ध नहीं है।
                    </div>
                  );
                }
                return (
                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-blue-200 dark:before:bg-gray-700">
                    {journey.map((entry, idx) => {
                      const isCurrent = entry.sessionId === selectedSessionId;
                      const statusVariant =
                        entry.enrollmentStatus === 'ACTIVE'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : entry.enrollmentStatus === 'PROMOTED'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : entry.enrollmentStatus === 'TRANSFERRED'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

                      const statusLabel =
                        entry.enrollmentStatus === 'ACTIVE'
                          ? 'सक्रिय नामांकन'
                          : entry.enrollmentStatus === 'PROMOTED'
                          ? 'कक्षोन्नत (Promoted)'
                          : entry.enrollmentStatus === 'TRANSFERRED'
                          ? 'स्थानांतरित (Transferred)'
                          : entry.enrollmentStatus === 'PASSED'
                          ? 'उत्तीर्ण (Passed)'
                          : entry.enrollmentStatus;

                      return (
                        <div key={idx} className="relative">
                          <div
                            className={`absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-[#1A2620] ${
                              isCurrent
                                ? 'border-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950'
                                : 'border-blue-500'
                            }`}
                          />
                          <div className="bg-white dark:bg-[#202E27] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                  सत्र {entry.sessionName}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full">
                                    वर्तमान चयनित सत्र
                                  </span>
                                )}
                              </div>
                              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${statusVariant}`}>
                                {statusLabel}
                              </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-300">
                              <div>
                                <span className="text-gray-400">कक्षा एवं सेक्शन:</span>{' '}
                                <strong className="text-gray-800 dark:text-gray-100">
                                  कक्षा {entry.class} ({entry.section || 'A'})
                                </strong>
                              </div>
                              <div>
                                <span className="text-gray-400">उपस्थिति प्रतिशत:</span>{' '}
                                <strong className="text-gray-800 dark:text-gray-100">
                                  {entry.attendancePct !== undefined ? `${entry.attendancePct}%` : 'अद्यतन'}
                                </strong>
                              </div>
                              <div className="sm:col-span-2">
                                <span className="text-gray-400">विद्यालय:</span>{' '}
                                <strong className="text-gray-800 dark:text-gray-100">
                                  {entry.schoolName} ({entry.schoolUdise})
                                </strong>
                              </div>
                              {entry.remarks && (
                                <div className="sm:col-span-2 text-[11px] text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/40 p-2 rounded">
                                  टिप्पणी: {entry.remarks}
                                </div>
                              )}
                              {entry.transferDetails && (
                                <div className="sm:col-span-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-lg text-[11px] text-amber-900 dark:text-amber-200">
                                  <div className="font-bold mb-1">स्थानांतरण (TC) विवरण:</div>
                                  <div>टीसी क्रमांक: {entry.transferDetails.tcNumber || 'एन/ए'} • दिनांक: {entry.transferDetails.tcDate || '-'}</div>
                                  <div>कारण: {entry.transferDetails.reason}</div>
                                  <div>नवीन विद्यालय: {entry.transferDetails.newSchoolName}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-[#15201A] border-t border-gray-200 dark:border-gray-800 flex justify-end">
              <button
                onClick={() => setJourneyStudentTarget(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Transfer (TC) Modal */}
      {isTransferModalOpen && transferStudentTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#1A2620] rounded-2xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-amber-700 to-amber-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <ArrowRightLeft className="w-5 h-5 text-amber-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base">
                    {transferForm.isEditingExistingTc
                      ? 'स्थानांतरण प्रमाण-पत्र (TC) संशोधन'
                      : 'शाला स्थानांतरण प्रमाण-पत्र (TC) निर्गमन'}
                  </h3>
                  <p className="text-xs text-amber-200">
                    सत्र {selectedSessionId} • विद्यार्थी स्थानांतरण एवं नवीन शाला प्रवेश
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTransferStudentTarget(null);
                }}
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleExecuteTransfer} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {transferFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    transferFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{transferFeedback.message}</span>
                </div>
              )}

              {/* 1. विद्यार्थी की जानकारी (Student Information) */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-1.5">
                <div className="text-[11px] font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>१. विद्यार्थी की जानकारी (Student Info)</span>
                  <span className="font-mono text-[10px] bg-amber-100 dark:bg-amber-900 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200">
                    ID: {transferStudentTarget.samagraId}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">नाम: </span>
                    <strong className="text-gray-900 dark:text-white">{transferStudentTarget.name}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">पिता: </span>
                    <strong className="text-gray-900 dark:text-white">{transferStudentTarget.fatherName}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">माता: </span>
                    <strong className="text-gray-900 dark:text-white">{transferStudentTarget.motherName || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">जन्म दिनांक: </span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{transferStudentTarget.dob || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">वर्ग / लिंग: </span>
                    <span className="text-gray-800 dark:text-gray-200">{transferStudentTarget.category} • {transferStudentTarget.gender}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">वर्तमान कक्षा: </span>
                    <strong className="text-amber-800 dark:text-amber-300">कक्षा {transferStudentTarget.class} ({transferStudentTarget.section || 'A'})</strong>
                  </div>
                </div>
              </div>

              {/* 2. वर्तमान विद्यालय (Current School) */}
              <div className="p-3 bg-gray-50 dark:bg-[#121B17] rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-gray-400">२. वर्तमान मूल विद्यालय (Source School)</div>
                  <div className="font-bold text-gray-900 dark:text-white mt-0.5">
                    {schools.find((s) => s.udise === transferStudentTarget.schoolUdise)?.name ||
                     schools.find((s) => s.udise === transferStudentTarget.schoolUdise)?.hindiName ||
                     transferStudentTarget.schoolUdise}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-gray-400">यूडाइस कोड</div>
                  <div className="font-mono font-bold text-gray-700 dark:text-gray-300">
                    {transferStudentTarget.schoolUdise}
                  </div>
                </div>
              </div>

              {/* 3. स्थानांतरण विवरण (Transfer Particulars) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    टीसी प्रमाण-पत्र क्रमांक (TC Number) *
                  </label>
                  <input
                    id="tc-number-input"
                    type="text"
                    required
                    placeholder="उदा. TC-2026-0042"
                    value={transferForm.tcNumber}
                    onChange={(e) => setTransferForm({ ...transferForm, tcNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#15201A] border border-gray-300 dark:border-gray-700 rounded-xl font-mono font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    नवीन कक्षा (Destination Class) *
                  </label>
                  <select
                    id="tc-destination-class-select"
                    value={transferForm.newClass}
                    onChange={(e) => setTransferForm({ ...transferForm, newClass: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#15201A] border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                      <option key={cls} value={cls}>
                        कक्षा {cls}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 4. गंतव्य विद्यालय (Destination School) * - DIRECT INPUT SECTION */}
              <div className="p-4 bg-amber-50/40 dark:bg-[#15201A] rounded-xl border border-amber-300 dark:border-amber-700/60 space-y-3">
                <div>
                  <label className="block font-bold text-gray-900 dark:text-white text-xs sm:text-sm">
                    गंतव्य विद्यालय (Destination School) *
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                    विद्यालय का नाम या DISE/UDISE Code में से कम से कम एक दर्ज करें।
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <label
                      htmlFor="tc-destination-school-name-input"
                      className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                    >
                      विद्यालय का नाम — Optional
                    </label>
                    <input
                      id="tc-destination-school-name-input"
                      type="text"
                      value={transferForm.destinationSchoolName}
                      onChange={(e) =>
                        setTransferForm({ ...transferForm, destinationSchoolName: e.target.value })
                      }
                      placeholder="गंतव्य विद्यालय का नाम दर्ज करें"
                      className="w-full px-3 py-2 bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-medium text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="tc-destination-school-udise-input"
                      className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1"
                    >
                      DISE/UDISE Code — Optional
                    </label>
                    <input
                      id="tc-destination-school-udise-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={11}
                      value={transferForm.destinationSchoolUdise}
                      onChange={(e) => handleDestinationUdiseChange(e.target.value)}
                      placeholder="11 अंकों का DISE/UDISE Code दर्ज करें"
                      className="w-full px-3 py-2 bg-white dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-mono font-medium text-xs text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="text-[11px] text-amber-800 dark:text-amber-300/90 font-medium">
                  विद्यालय का नाम या DISE/UDISE Code में से कम से कम एक दर्ज करें।
                </div>
              </div>

              {/* 5. स्थानांतरण दिनांक एवं कारण */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    स्थानांतरण दिनांक (TC Date) *
                  </label>
                  <input
                    id="tc-date-input"
                    type="date"
                    required
                    value={transferForm.tcDate}
                    onChange={(e) => setTransferForm({ ...transferForm, tcDate: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#15201A] border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    स्थानांतरण का कारण (Reason)
                  </label>
                  <select
                    id="tc-reason-select"
                    value={transferForm.reason}
                    onChange={(e) => setTransferForm({ ...transferForm, reason: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-[#15201A] border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="निवास परिवर्तन / शाला उत्क्रमण">निवास परिवर्तन / शाला उत्क्रमण</option>
                    <option value="पालक का अन्यत्र स्थानांतरण">पालक का अन्यत्र स्थानांतरण</option>
                    <option value="उच्च कक्षा में प्रवेश (शाला पूर्ण)">उच्च कक्षा में प्रवेश (शाला पूर्ण)</option>
                    <option value="अन्य व्यक्तिगत कारण">अन्य व्यक्तिगत कारण</option>
                  </select>
                </div>
              </div>

              {/* 6. TC Preview Button & Actions */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const destName = transferForm.destinationSchoolName.trim();
                    const destUdise = transferForm.destinationSchoolUdise.trim();

                    if (!destName && !destUdise) {
                      setTransferFeedback({
                        type: 'error',
                        message: 'गंतव्य विद्यालय का नाम या DISE/UDISE Code में से कम से कम एक दर्ज करें।',
                      });
                      return;
                    }

                    if (destUdise && !/^\d{11}$/.test(destUdise)) {
                      setTransferFeedback({
                        type: 'error',
                        message: 'DISE/UDISE Code 11 अंकों का होना चाहिए।',
                      });
                      return;
                    }

                    setPreviewTcStudentTarget(transferStudentTarget);
                    setPreviewTcRecord({
                      studentId: transferStudentTarget.id,
                      studentName: transferStudentTarget.name,
                      samagraId: transferStudentTarget.samagraId,
                      oldSchoolUdise: transferStudentTarget.schoolUdise,
                      oldSchoolName:
                        schools.find((s) => s.udise === transferStudentTarget.schoolUdise)?.name ||
                        transferStudentTarget.schoolUdise,
                      destinationSchoolName: destName || undefined,
                      destinationSchoolUdise: destUdise || undefined,
                      newSchoolName: destName || (destUdise ? `UDISE: ${destUdise}` : undefined),
                      newSchoolUdise: destUdise || undefined,
                      newClass: transferForm.newClass,
                      tcNumber: transferForm.tcNumber.trim() || 'प्रारूप-TC',
                      tcDate: transferForm.tcDate,
                      reason: transferForm.reason,
                    });
                    setShowTcCertificatePreview(true);
                  }}
                  className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>TC पूर्वावलोकन (Preview TC)</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setTransferStudentTarget(null);
                    }}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold transition-colors"
                  >
                    रद्द करें
                  </button>
                  <button
                    id="tc-submit-button"
                    type="submit"
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>
                      {transferForm.isEditingExistingTc
                        ? 'टीसी विवरण सुरक्षित करें (Save TC)'
                        : 'स्थानांतरण दर्ज करें (Issue TC & Enroll)'}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official TC Certificate Preview / Print Modal */}
      {showTcCertificatePreview && previewTcStudentTarget && previewTcRecord && (
        <TransferCertificateModal
          isOpen={showTcCertificatePreview}
          onClose={() => {
            setShowTcCertificatePreview(false);
          }}
          student={previewTcStudentTarget}
          transferRecord={previewTcRecord}
          schools={schools}
          onEdit={() => {
            setShowTcCertificatePreview(false);
            handleOpenTransfer(previewTcStudentTarget);
          }}
        />
      )}

      {/* Transfer Certificate Register Modal */}
      {isTcRegisterModalOpen && (
        <TransferRegisterModal
          isOpen={isTcRegisterModalOpen}
          onClose={() => setIsTcRegisterModalOpen(false)}
          transfers={studentTransfers}
          students={scopedStudents}
          schools={schools}
          selectedSessionId={selectedSessionId}
          canMutate={canMutate}
          onEditTransfer={(st, tc) => {
            handleOpenTransfer(st, tc);
          }}
          onViewCertificate={(st, tc) => {
            setPreviewTcStudentTarget(st);
            setPreviewTcRecord(tc);
            setShowTcCertificatePreview(true);
          }}
        />
      )}

      {/* Individual Promotion Modal */}
      {promotionStudentTarget && (
        <PromotionModal
          isOpen={!!promotionStudentTarget}
          onClose={() => setPromotionStudentTarget(null)}
          student={promotionStudentTarget}
          currentSchool={schools.find((s) => s.udise === promotionStudentTarget.schoolUdise)}
          currentSessionId={selectedSessionId}
          onSuccess={(msg) => {
            setPromotionSuccessToast(msg);
            setTimeout(() => setPromotionSuccessToast(null), 7000);
          }}
        />
      )}

      {/* Bulk Promotion Modal */}
      {isBulkPromotionOpen && (
        <BulkPromotionModal
          isOpen={isBulkPromotionOpen}
          onClose={() => setIsBulkPromotionOpen(false)}
          currentSessionId={selectedSessionId}
          onSuccess={(msg) => {
            setPromotionSuccessToast(msg);
            setTimeout(() => setPromotionSuccessToast(null), 7000);
          }}
        />
      )}

      {/* Student Dossier / Profile Modal */}
      {profileStudentTarget && (
        <StudentProfileModal
          isOpen={!!profileStudentTarget}
          onClose={() => setProfileStudentTarget(null)}
          student={profileStudentTarget}
          currentSchool={schools.find((s) => s.udise === profileStudentTarget.schoolUdise)}
          canMutate={canMutate && (!isSchoolRestricted || currentUser?.assignedSchoolUdise === profileStudentTarget.schoolUdise)}
          onOpenPromotion={() => {
            const st = profileStudentTarget;
            setProfileStudentTarget(null);
            setPromotionStudentTarget(st);
          }}
          onOpenTransfer={() => {
            const st = profileStudentTarget;
            setProfileStudentTarget(null);
            handleOpenTransfer(st);
          }}
        />
      )}

      {/* Single Student Complete Data Print / PDF Modal */}
      {printStudentTarget && (
        <StudentPrintModal
          isOpen={!!printStudentTarget}
          onClose={() => setPrintStudentTarget(null)}
          student={printStudentTarget}
        />
      )}
    </div>
  );
};
