import React, { useState, useMemo } from 'react';
import {
  Award,
  PlusCircle,
  Search,
  Filter,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  Save,
  Calendar,
  AlertTriangle,
  AlertCircle,
  Users,
  UserCheck,
  User,
  Lock,
  Eye,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { LiteracyExamResult, ExamCycle } from '../../types/literacy';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyFormPrintModal } from './LiteracyFormPrintModal';

export const ExamResultsView: React.FC = () => {
  const { currentUser } = useAuth();
  const { isFeatureEnabled } = useFeatureControl();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    currentSchoolUdise,
    selectedSessionId,
    selectedSession,
    isSessionLocked,
    examCycles,
    scopedLiteracyExamResults,
    literacyExamResults,
    illiteratePersons,
    saveLiteracyExamResult,
    deleteLiteracyExamResult,
    addExamCycle,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const isCurrentSessionLocked = isSessionLocked ? isSessionLocked(selectedSessionId) : false;

  // Master source of truth for exam cycles
  const availableExamCycles = useMemo(() => {
    return [...examCycles].sort((a, b) => {
      const dateA = a.examDate || '';
      const dateB = b.examDate || '';
      return dateB.localeCompare(dateA);
    });
  }, [examCycles]);

  // Filters
  const [selectedCycleId, setSelectedCycleId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [editingResult, setEditingResult] = useState<Partial<LiteracyExamResult> | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
  const [newCycle, setNewCycle] = useState<Partial<ExamCycle>>({
    examName: '',
    examDate: new Date().toISOString().split('T')[0],
    academicYear: selectedSessionId || '2026-27',
    description: 'नवभारत साक्षरता कार्यक्रम बुनियादी मूल्यांकन महापरीक्षा',
  });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Open modal for Add or Edit
  const handleOpenModal = (res?: LiteracyExamResult, readOnly: boolean = false) => {
    setFormError(null);
    if (res) {
      const recordSession = res.sessionId || res.academicYear || selectedSessionId;
      const recordIsLocked = isSessionLocked ? isSessionLocked(recordSession) : false;
      setIsReadOnlyMode(readOnly || recordIsLocked);

      // Edit mode: locate matching cycle to ensure it's selected in dropdown
      const matchingCycle = availableExamCycles.find(
        (c) => c.id === res.examCycleId || c.examName === res.examName || c.examCycleName === res.examCycleName
      );
      const cycleId = res.examCycleId || matchingCycle?.id || '';

      const f = Number(res.femaleLearners ?? res.femaleCount) || 0;
      const m = Number(res.maleLearners ?? res.maleCount) || 0;
      const tot = Number(res.totalLearners ?? res.totalCount) || (f + m);
      const part = Number(res.participatedLearners ?? res.participatedCount) || 0;
      const pass = Number(res.passedLearners ?? res.passedCount) || 0;
      const fail = Number(res.failedLearners ?? res.failedCount) || 0;
      const rem = Number(res.remainingIlliterateLearners ?? res.remainingCount) ?? Math.max(0, tot - pass);

      setEditingResult({
        ...res,
        sessionId: recordSession,
        academicYear: recordSession,
        examCycleId: cycleId,
        examCycleName: res.examCycleName || matchingCycle?.examCycleName || matchingCycle?.examName || '',
        examName: res.examName || matchingCycle?.examName || '',
        examDate: res.examDate || matchingCycle?.examDate || '',
        femaleLearners: f,
        femaleCount: f,
        maleLearners: m,
        maleCount: m,
        totalLearners: tot,
        totalCount: tot,
        participatedLearners: part,
        participatedCount: part,
        passedLearners: pass,
        passedCount: pass,
        failedLearners: fail,
        failedCount: fail,
        remainingIlliterateLearners: rem,
        remainingCount: rem,
      });
    } else {
      if (isCurrentSessionLocked) {
        showToast(`शैक्षणिक सत्र ${selectedSessionId} वर्तमान में ${selectedSession?.status || 'अभिलेखीय'} है। इसमें नवीन प्रविष्टि प्रतिबंधित है।`);
        return;
      }
      setIsReadOnlyMode(false);
      // New entry: prompt user to select cycle via placeholder
      const targetUdise = isSchoolUser ? currentSchoolUdise : (selectedSchoolUdise || schools[0]?.udise || '');
      const schoolObj = schools.find((s) => s.udise === targetUdise);

      setEditingResult({
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || 'शासकीय प्राथमिक शाला',
        sessionId: selectedSessionId,
        academicYear: selectedSessionId || '2026-27',
        examCycleId: '', // Prompt to select from placeholder
        examCycleName: '',
        examName: '',
        examDate: '',
        femaleLearners: 0,
        femaleCount: 0,
        maleLearners: 0,
        maleCount: 0,
        totalLearners: 0,
        totalCount: 0,
        participatedLearners: 0,
        participatedCount: 0,
        passedLearners: 0,
        passedCount: 0,
        failedLearners: 0,
        failedCount: 0,
        remainingIlliterateLearners: 0,
        remainingCount: 0,
        remarks: 'सफलतापूर्वक परीक्षा संपन्न',
      });
    }
    setIsModalOpen(true);
  };

  // Cycle Change in Modal Form: load specific cycle data or initialize fresh numbers for this school
  const handleCycleChange = (cycleId: string) => {
    setFormError(null);
    if (!cycleId) {
      setEditingResult((prev) => (prev ? {
        ...prev,
        examCycleId: '',
        examCycleName: '',
        examName: '',
        examDate: '',
        femaleLearners: 0,
        femaleCount: 0,
        maleLearners: 0,
        maleCount: 0,
        totalLearners: 0,
        totalCount: 0,
        participatedLearners: 0,
        participatedCount: 0,
        passedLearners: 0,
        passedCount: 0,
        failedLearners: 0,
        failedCount: 0,
        remainingIlliterateLearners: 0,
        remainingCount: 0,
        remarks: '',
      } : null));
      return;
    }

    const selCycle = availableExamCycles.find((c) => c.id === cycleId);
    const targetUdise = editingResult?.schoolUdise || (isSchoolUser ? currentSchoolUdise : (selectedSchoolUdise || schools[0]?.udise || ''));
    const schoolObj = schools.find((s) => s.udise === targetUdise);
    const targetSession = editingResult?.sessionId || selectedSessionId || '2026-27';

    // Look for existing saved result for this school and this cycle in all literacyExamResults
    const existingForCycle = literacyExamResults.find(
      (r) => r.schoolUdise === targetUdise && (r.examCycleId === cycleId || (selCycle && r.examName === selCycle.examName))
    );

    if (existingForCycle) {
      const f = Number(existingForCycle.femaleLearners ?? existingForCycle.femaleCount) || 0;
      const m = Number(existingForCycle.maleLearners ?? existingForCycle.maleCount) || 0;
      const tot = Number(existingForCycle.totalLearners ?? existingForCycle.totalCount) || (f + m);
      const part = Number(existingForCycle.participatedLearners ?? existingForCycle.participatedCount) || 0;
      const pass = Number(existingForCycle.passedLearners ?? existingForCycle.passedCount) || 0;
      const fail = Number(existingForCycle.failedLearners ?? existingForCycle.failedCount) || 0;
      const rem = Number(existingForCycle.remainingIlliterateLearners ?? existingForCycle.remainingCount) ?? Math.max(0, tot - pass);

      setEditingResult({
        ...existingForCycle,
        id: existingForCycle.id,
        sessionId: existingForCycle.sessionId || targetSession,
        academicYear: existingForCycle.academicYear || targetSession,
        schoolUdise: targetUdise,
        schoolName: existingForCycle.schoolName || schoolObj?.name || '',
        examCycleId: cycleId,
        examCycleName: selCycle?.examCycleName || selCycle?.examName || existingForCycle.examCycleName,
        examName: selCycle?.examName || existingForCycle.examName,
        examDate: selCycle?.examDate || existingForCycle.examDate,
        femaleLearners: f,
        femaleCount: f,
        maleLearners: m,
        maleCount: m,
        totalLearners: tot,
        totalCount: tot,
        participatedLearners: part,
        participatedCount: part,
        passedLearners: pass,
        passedCount: pass,
        failedLearners: fail,
        failedCount: fail,
        remainingIlliterateLearners: rem,
        remainingCount: rem,
        remarks: existingForCycle.remarks || '',
      });
    } else {
      // Fresh values for this newly selected cycle
      const schoolLearners = illiteratePersons.filter((p) => p.schoolUdise === targetUdise && (p.sessionId ? p.sessionId === targetSession : true));
      const f = schoolLearners.filter((p) => p.gender === 'महिला').length;
      const m = schoolLearners.filter((p) => p.gender === 'पुरुष').length;
      const tot = f + m;

      setEditingResult((prev) => ({
        ...prev,
        id: undefined, // New record
        sessionId: targetSession,
        academicYear: targetSession,
        schoolUdise: targetUdise,
        schoolName: schoolObj?.name || prev?.schoolName || 'शासकीय प्राथमिक शाला',
        examCycleId: cycleId,
        examCycleName: selCycle?.examCycleName || selCycle?.examName || '',
        examName: selCycle?.examName || '',
        examDate: selCycle?.examDate || '',
        femaleLearners: f,
        femaleCount: f,
        maleLearners: m,
        maleCount: m,
        totalLearners: tot,
        totalCount: tot,
        participatedLearners: tot,
        participatedCount: tot,
        passedLearners: 0,
        passedCount: 0,
        failedLearners: 0,
        failedCount: 0,
        remainingIlliterateLearners: tot,
        remainingCount: tot,
        remarks: 'सफलतापूर्वक परीक्षा संपन्न',
      }));
    }
  };

  // Live calculation updates when user changes counts in form
  const handleCountChange = (
    field: 'femaleLearners' | 'maleLearners' | 'participatedLearners' | 'passedLearners' | 'failedLearners',
    val: number
  ) => {
    if (!editingResult) return;
    const cleanVal = Math.max(0, isNaN(val) ? 0 : val);
    const updated = { ...editingResult, [field]: cleanVal };

    const f = field === 'femaleLearners' ? cleanVal : (Number(updated.femaleLearners) || 0);
    const m = field === 'maleLearners' ? cleanVal : (Number(updated.maleLearners) || 0);
    const tot = f + m;
    updated.totalLearners = tot;
    updated.femaleLearners = f;
    updated.maleLearners = m;

    const pass = field === 'passedLearners' ? cleanVal : (Number(updated.passedLearners) || 0);
    updated.passedLearners = pass;
    updated.remainingIlliterateLearners = Math.max(0, tot - pass);

    setEditingResult(updated);
  };

  // Save Result
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingResult || !editingResult.schoolUdise) return;

    const targetSessionId = editingResult.sessionId || selectedSessionId || '2026-27';
    const isTargetLocked = isSessionLocked ? isSessionLocked(targetSessionId) : false;

    if (isTargetLocked) {
      const msg = `[403 Forbidden - Session LOCKED] शैक्षणिक सत्र ${targetSessionId} वर्तमान में लॉक अथवा अभिलेखीय (ARCHIVED) है। इसमें कोई नया डेटा अथवा संशोधन अनुमत नहीं है।`;
      setFormError(msg);
      showToast(msg);
      return;
    }

    if (!editingResult.examCycleId || editingResult.examCycleId.trim() === '') {
      setFormError('कृपया परीक्षा सत्र / साइकिल चुनें।');
      showToast('कृपया परीक्षा सत्र / साइकिल चुनें।');
      return;
    }

    const cycleObj = availableExamCycles.find((c) => c.id === editingResult.examCycleId);
    const f = Number(editingResult.femaleLearners) || 0;
    const m = Number(editingResult.maleLearners) || 0;
    const total = f + m;
    const appeared = Number(editingResult.participatedLearners) || 0;
    const passed = Number(editingResult.passedLearners) || 0;
    const failed = Number(editingResult.failedLearners) || 0;
    const remaining = Math.max(0, total - passed);

    try {
      saveLiteracyExamResult({
        id: editingResult.id,
        schoolUdise: editingResult.schoolUdise,
        schoolName: editingResult.schoolName || '',
        sessionId: targetSessionId,
        academicYear: targetSessionId,
        examCycleId: editingResult.examCycleId,
        cycleId: editingResult.examCycleId,
        examCycleName: cycleObj?.examCycleName || cycleObj?.examName || editingResult.examCycleName || '',
        cycleName: cycleObj?.examCycleName || cycleObj?.examName || editingResult.examCycleName || '',
        examName: cycleObj?.examName || editingResult.examName || 'साक्षरता मूल्यांकन परीक्षा',
        examDate: cycleObj?.examDate || editingResult.examDate || '',
        femaleLearners: f,
        femaleCount: f,
        maleLearners: m,
        maleCount: m,
        totalLearners: total,
        totalCount: total,
        participatedLearners: appeared,
        participatedCount: appeared,
        passedLearners: passed,
        passedCount: passed,
        failedLearners: failed,
        failedCount: failed,
        remainingIlliterateLearners: remaining,
        remainingCount: remaining,
        remarks: editingResult.remarks || '',
      });

      setIsModalOpen(false);
      setEditingResult(null);
      setFormError(null);
      showToast('साक्षरता परीक्षा परिणाम सुरक्षित कर लिया गया है।');
    } catch (err: any) {
      const errorMsg = err?.message || 'परिणाम सुरक्षित करने में त्रुटि हुई।';
      setFormError(errorMsg);
      showToast(errorMsg);
      console.error('Error saving literacy exam result:', err);
    }
  };

  // Add new Exam Cycle
  const handleAddCycle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCycle.examName || !newCycle.examDate) return;
    try {
      addExamCycle({
        examName: newCycle.examName.trim(),
        examCycleName: newCycle.examName.trim(),
        examDate: newCycle.examDate,
        academicYear: selectedSessionId || '2026-27',
        sessionId: selectedSessionId || '2026-27',
        isCompleted: false,
        remarks: newCycle.remarks || newCycle.description || '',
        createdBy: currentUser?.name || 'Admin',
        updatedBy: currentUser?.name || 'Admin',
      });
      setIsCycleModalOpen(false);
      setNewCycle({
        examName: '',
        examDate: new Date().toISOString().split('T')[0],
        academicYear: selectedSessionId || '2026-27',
        description: '',
      });
      showToast('नया परीक्षा सत्र सफलतापूर्वक जोड़ा गया।');
    } catch (err: any) {
      const errorMsg = err?.message || 'परीक्षा सत्र जोड़ने में त्रुटि हुई।';
      showToast(errorMsg);
      console.error('Error adding exam cycle:', err);
    }
  };

  // Delete
  const handleDelete = (id: string) => {
    try {
      deleteLiteracyExamResult(id);
      setDeleteConfirmId(null);
      showToast('परीक्षा परिणाम रिकॉर्ड हटा दिया गया।');
    } catch (err: any) {
      const errorMsg = err?.message || 'परिणाम हटाने में त्रुटि हुई।';
      showToast(errorMsg);
      console.error('Error deleting literacy exam result:', err);
    }
  };

  // Filtered list: school-scoped and cycle-filtered
  const filteredResults = useMemo(() => {
    const baseList = selectedCycleId !== 'ALL'
      ? (isSchoolUser ? literacyExamResults.filter((r) => r.schoolUdise === currentSchoolUdise) : (selectedSchoolUdise ? literacyExamResults.filter((r) => r.schoolUdise === selectedSchoolUdise) : literacyExamResults))
      : (isSchoolUser ? scopedLiteracyExamResults.filter((r) => r.schoolUdise === currentSchoolUdise) : (selectedSchoolUdise ? scopedLiteracyExamResults.filter((r) => r.schoolUdise === selectedSchoolUdise) : scopedLiteracyExamResults));

    return baseList.filter((r) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        (r.schoolName || '').toLowerCase().includes(term) ||
        (r.schoolUdise || '').includes(term) ||
        (r.examName || '').toLowerCase().includes(term) ||
        (r.examCycleName || '').toLowerCase().includes(term);

      const matchCycle = selectedCycleId === 'ALL' || r.examCycleId === selectedCycleId;

      return matchSearch && matchCycle;
    });
  }, [selectedCycleId, isSchoolUser, currentSchoolUdise, selectedSchoolUdise, literacyExamResults, scopedLiteracyExamResults, searchTerm]);

  // Aggregated summary counts for Form-04 learner metric cards
  const summaryStats = useMemo(() => {
    let female = 0;
    let male = 0;
    let total = 0;
    let participated = 0;
    let passed = 0;
    let failed = 0;

    filteredResults.forEach((r) => {
      const f = Number(r.femaleLearners ?? r.femaleCount) || 0;
      const m = Number(r.maleLearners ?? r.maleCount) || 0;
      const tot = Number(r.totalLearners ?? r.totalCount) || (f + m);
      female += f;
      male += m;
      total += tot;
      participated += (Number(r.participatedLearners ?? r.participatedCount) || 0);
      passed += (Number(r.passedLearners ?? r.passedCount) || 0);
      failed += (Number(r.failedLearners ?? r.failedCount) || 0);
    });

    return {
      femaleLearners: female,
      maleLearners: male,
      totalLearners: total,
      participatedLearners: participated,
      passedLearners: passed,
      failedLearners: failed,
    };
  }, [filteredResults]);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-emerald-500 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-5 h-5 text-emerald-200" />
          <span className="text-xs font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Session Locked / Archived Banner */}
      {isCurrentSessionLocked && (
        <div
          id="banner-session-archived-locked"
          className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-amber-900 dark:text-amber-200 text-xs font-medium"
        >
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              <strong>सत्र अभिलेखीय / लॉक सूचना:</strong> शैक्षणिक सत्र <strong>{selectedSessionId}</strong> वर्तमान में{' '}
              <strong>
                {selectedSession?.status === 'ARCHIVED'
                  ? 'अभिलेखीय (ARCHIVED)'
                  : selectedSession?.status === 'CLOSED'
                  ? 'समाप्त (CLOSED)'
                  : 'लॉक (LOCKED)'}
              </strong>{' '}
              है। इस सत्र में डेटा केवल देखा जा सकता है; नवीन संकलन, संपादन अथवा विलोपन प्रतिबंधित है।
            </span>
          </div>
          <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 shrink-0 self-start sm:self-auto">
            केवल पठन (Read-Only)
          </span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white dark:bg-[#16221D] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
            <Award className="w-4 h-4" />
            <span>प्रपत्र क्रमांक - 04 : साक्षरता परीक्षा परिणाम (Exam Evaluation)</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            साक्षरता परीक्षा परिणाम संकलन
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            सत्रवार राष्ट्रीय मुक्त विद्यालयी शिक्षा संस्थान (NIOS) साक्षरता मूल्यांकन परीक्षा परिणाम प्रविष्टि व प्रमाणन।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* School Selector (for CAC/Admin only) */}
          {!isSchoolUser && (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedSchoolUdise}
                onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                aria-label="विद्यालय का चयन करें"
                className="bg-transparent text-xs font-medium text-gray-900 dark:text-white border-0 focus:ring-0 focus:outline-hidden"
              >
                <option value="">समस्त विद्यालय ({schools.length})</option>
                {schools.map((s) => (
                  <option key={s.udise} value={s.udise}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!isSchoolUser && isFeatureEnabled('module.literacy-exams.action.add_edit') && (
            <button
              disabled={isCurrentSessionLocked}
              onClick={() => !isCurrentSessionLocked && setIsCycleModalOpen(true)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                isCurrentSessionLocked
                  ? 'border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/40 cursor-not-allowed'
                  : 'border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
              }`}
              title={isCurrentSessionLocked ? `सत्र ${selectedSessionId} लॉक/अभिलेखीय है` : 'नया परीक्षा सत्र'}
            >
              {isCurrentSessionLocked ? <Lock className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
              <span>नया परीक्षा सत्र</span>
            </button>
          )}

          {isFeatureEnabled('module.literacy-exams.action.print_export') && (
            <UnifiedPrintButton
              id="exam-results-unified-print"
              onPrintCurrentView={() => window.print()}
              onPrintReport={() => setIsPrintModalOpen(true)}
              onPrintLiteracyForm={() => setIsPrintModalOpen(true)}
              currentViewLabel="Current View"
              currentViewSubtext="परीक्षा परिणाम सूची का त्वरित स्क्रीन प्रिंट"
              reportLabel="Report"
              reportSubtext="मूल्यांकन परीक्षा समेकित परिणाम रिपोर्ट"
              literacyFormLabel="Literacy Form (प्रपत्र - 04)"
              literacyFormSubtext="आधिकारिक प्रपत्र 04 परीक्षा परिणाम A4 प्रारूप"
              buttonLabel="Print"
            />
          )}

          {isFeatureEnabled('module.literacy-exams.action.add_edit') && (
            <button
              id="btn-add-exam-result"
              disabled={isCurrentSessionLocked}
              onClick={() => handleOpenModal()}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-colors ${
                isCurrentSessionLocked
                  ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                  : 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer'
              }`}
              title={isCurrentSessionLocked ? `सत्र ${selectedSessionId} लॉक/अभिलेखीय है - नवीन प्रविष्टि प्रतिबंधित` : 'परिणाम प्रविष्टि दर्ज करें'}
            >
              {isCurrentSessionLocked ? <Lock className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
              <span>परिणाम प्रविष्टि दर्ज करें</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="शाला का नाम, UDISE या परीक्षा नाम से खोजें..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="w-full sm:w-80">
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            aria-label="परीक्षा सत्र फ़िल्टर"
            className="w-full py-2 px-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
          >
            <option value="ALL">समस्त परीक्षा सत्र (All Exam Cycles)</option>
            {availableExamCycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.examCycleName || cycle.examName} ({cycle.examDate})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 shrink-0">
          परिणाम रिकॉर्ड: <strong className="text-gray-900 dark:text-white">{filteredResults.length}</strong>
        </div>
      </div>

      {/* Form-04 Metric Cards: पंजीकृत असाक्षर शिक्षार्थी संख्या कार्ड (कुल, महिला, पुरुष) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="form04-learner-cards">
        {/* Card 1: पंजीकृत असाक्षर शिक्षार्थी (कुल प्रतिभागी) */}
        <div
          id="card-registered-total-learners"
          className="bg-amber-50 dark:bg-amber-950/70 rounded-2xl p-5 border-2 border-amber-400 dark:border-amber-600 shadow-sm flex flex-col justify-between transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 tracking-wide uppercase">
                पंजीकृत असाक्षर शिक्षार्थी
              </span>
              <p className="text-[11px] font-bold text-amber-900 dark:text-amber-200 mt-0.5">
                कुल नामांकित असाक्षर परीक्षार्थी
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-200 dark:bg-amber-900/90 text-amber-950 dark:text-amber-100 border border-amber-400 dark:border-amber-500 flex items-center justify-center shrink-0 shadow-xs">
              <Users className="w-5 h-5 text-amber-950 dark:text-amber-100" />
            </div>
          </div>

          <div className="my-3 text-center sm:text-left">
            <span className="text-3xl sm:text-4xl font-black font-mono text-amber-950 dark:text-amber-50 tracking-tight">
              {summaryStats.totalLearners}
            </span>
          </div>

          <div className="pt-2.5 border-t border-amber-300 dark:border-amber-700 flex items-center justify-between">
            <span className="text-xs font-black text-amber-950 dark:text-amber-100">
              कुल प्रतिभागी
            </span>
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 font-mono">
              सम्मिलित: <strong className="text-amber-950 dark:text-amber-50 font-black">{summaryStats.participatedLearners}</strong>
            </span>
          </div>
        </div>

        {/* Card 2: पंजीकृत महिला शिक्षार्थी */}
        <div
          id="card-registered-female-learners"
          className="bg-rose-50 dark:bg-rose-950/70 rounded-2xl p-5 border-2 border-rose-400 dark:border-rose-600 shadow-sm flex flex-col justify-between transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block text-xs sm:text-sm font-black text-rose-950 dark:text-rose-100 tracking-wide uppercase">
                पंजीकृत महिला शिक्षार्थी
              </span>
              <p className="text-[11px] font-bold text-rose-900 dark:text-rose-200 mt-0.5">
                महिला असाक्षर प्रतिभागी
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-200 dark:bg-rose-900/90 text-rose-950 dark:text-rose-100 border border-rose-400 dark:border-rose-500 flex items-center justify-center shrink-0 shadow-xs">
              <UserCheck className="w-5 h-5 text-rose-950 dark:text-rose-100" />
            </div>
          </div>

          <div className="my-3 text-center sm:text-left">
            <span className="text-3xl sm:text-4xl font-black font-mono text-rose-950 dark:text-rose-50 tracking-tight">
              {summaryStats.femaleLearners}
            </span>
          </div>

          <div className="pt-2.5 border-t border-rose-300 dark:border-rose-700 flex items-center justify-between">
            <span className="text-xs font-black text-rose-950 dark:text-rose-100">
              महिला सहभागिता
            </span>
            <span className="text-xs font-bold text-rose-900 dark:text-rose-200 font-mono">
              {summaryStats.totalLearners > 0
                ? `${Math.round((summaryStats.femaleLearners / summaryStats.totalLearners) * 100)}% अनुपात`
                : '0% अनुपात'}
            </span>
          </div>
        </div>

        {/* Card 3: पंजीकृत पुरुष शिक्षार्थी */}
        <div
          id="card-registered-male-learners"
          className="bg-sky-50 dark:bg-sky-950/70 rounded-2xl p-5 border-2 border-sky-400 dark:border-sky-600 shadow-sm flex flex-col justify-between transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="inline-block text-xs sm:text-sm font-black text-sky-950 dark:text-sky-100 tracking-wide uppercase">
                पंजीकृत पुरुष शिक्षार्थी
              </span>
              <p className="text-[11px] font-bold text-sky-900 dark:text-sky-200 mt-0.5">
                पुरुष असाक्षर प्रतिभागी
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-200 dark:bg-sky-900/90 text-sky-950 dark:text-sky-100 border border-sky-400 dark:border-sky-500 flex items-center justify-center shrink-0 shadow-xs">
              <User className="w-5 h-5 text-sky-950 dark:text-sky-100" />
            </div>
          </div>

          <div className="my-3 text-center sm:text-left">
            <span className="text-3xl sm:text-4xl font-black font-mono text-sky-950 dark:text-sky-50 tracking-tight">
              {summaryStats.maleLearners}
            </span>
          </div>

          <div className="pt-2.5 border-t border-sky-300 dark:border-sky-700 flex items-center justify-between">
            <span className="text-xs font-black text-sky-950 dark:text-sky-100">
              पुरुष सहभागिता
            </span>
            <span className="text-xs font-bold text-sky-900 dark:text-sky-200 font-mono">
              {summaryStats.totalLearners > 0
                ? `${Math.round((summaryStats.maleLearners / summaryStats.totalLearners) * 100)}% अनुपात`
                : '0% अनुपात'}
            </span>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#2B210C] text-amber-100 font-bold border-b border-[#4A3914] uppercase tracking-wider text-[10.5px]">
              <tr>
                <th className="py-3 px-3">क्र.</th>
                <th className="py-3 px-3">शाला का नाम व UDISE कोड</th>
                <th className="py-3 px-3">परीक्षा सत्र / तिथि</th>
                <th className="py-3 px-3 text-center">पंजीकृत असाक्षर<br />(महिला / पुरुष / कुल)</th>
                <th className="py-3 px-3 text-center">परीक्षा सम्मिलित</th>
                <th className="py-3 px-3 text-center">उत्तीर्ण साक्षर</th>
                <th className="py-3 px-3 text-center">अनुत्तीर्ण</th>
                <th className="py-3 px-3 text-center">शेष असाक्षर</th>
                <th className="py-3 px-3 text-center">सफलता दर (%)</th>
                <th className="py-3 px-3">विशेष विवरण</th>
                <th className="py-3 px-3 text-center">कार्यवाही</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
              {filteredResults.map((res, index) => {
                const fLearners = Number(res.femaleLearners ?? res.femaleCount) || 0;
                const mLearners = Number(res.maleLearners ?? res.maleCount) || 0;
                const totLearners = Number(res.totalLearners ?? res.totalCount) || (fLearners + mLearners);
                const partLearners = Number(res.participatedLearners ?? res.participatedCount) || 0;
                const passLearners = Number(res.passedLearners ?? res.passedCount) || 0;
                const failLearners = Number(res.failedLearners ?? res.failedCount) || 0;
                const remLearners = Number(res.remainingIlliterateLearners ?? res.remainingCount) ?? Math.max(0, totLearners - passLearners);

                const passRate = partLearners > 0
                  ? Math.round((passLearners / partLearners) * 100)
                  : 0;

                return (
                  <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">{res.schoolName}</div>
                      <div className="text-[10.5px] font-mono text-emerald-700 dark:text-emerald-400">{res.schoolUdise}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-amber-800 dark:text-amber-300">
                        {res.examCycleName || res.examName}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">दिनांक: {res.examDate}</div>
                    </td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="text-rose-600 font-semibold">{fLearners}</span> +{' '}
                      <span className="text-sky-600 font-semibold">{mLearners}</span> ={' '}
                      <strong className="text-gray-900 dark:text-white font-bold">{totLearners}</strong>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                      {partLearners}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {passLearners}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                      {failLearners}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-700 dark:text-gray-300">
                      {remLearners}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {passRate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-gray-600 dark:text-gray-300 text-[11px] truncate max-w-[140px]" title={res.remarks}>
                      {res.remarks || '—'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {(() => {
                        const recordSession = res.sessionId || res.academicYear || selectedSessionId;
                        const isRecordLocked = isSessionLocked ? isSessionLocked(recordSession) : false;
                        if (isRecordLocked) {
                          return (
                            <div className="flex items-center justify-center">
                              <button
                                onClick={() => handleOpenModal(res, true)}
                                className="p-1 rounded-md bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900/40 text-sky-700 dark:text-sky-300 flex items-center gap-1 px-2 text-[11px] font-bold cursor-pointer"
                                title="विवरण देखें (केवल पठन)"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>देखें</span>
                              </button>
                            </div>
                          );
                        }
                        return (
                          <div className="flex items-center justify-center gap-1.5">
                            {isFeatureEnabled('module.literacy-exams.action.add_edit') && (
                              <button
                                onClick={() => handleOpenModal(res)}
                                className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-gray-700 dark:text-gray-300 hover:text-amber-700 dark:hover:text-amber-300 cursor-pointer"
                                title="संपादित करें"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isFeatureEnabled('module.literacy-exams.action.delete') && (
                              <button
                                onClick={() => setDeleteConfirmId(res.id)}
                                className="p-1 rounded-md bg-gray-100 dark:bg-gray-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-gray-700 dark:text-gray-300 hover:text-rose-700 dark:hover:text-rose-300 cursor-pointer"
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
              })}
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    कोई परीक्षा परिणाम रिकॉर्ड उपलब्ध नहीं है।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog for Add / Edit Result (प्रपत्र-04) */}
      {isModalOpen && editingResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 my-8 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      साक्षरता परीक्षा परिणाम प्रविष्टि (प्रपत्र-04)
                    </h3>
                    {isReadOnlyMode && (
                      <span className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                        केवल पठन (Read-Only)
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {isReadOnlyMode
                      ? `शैक्षणिक सत्र ${editingResult.sessionId || editingResult.academicYear || selectedSessionId} अभिलेखीय/लॉक है — केवल अवलोकन अनुमत है।`
                      : editingResult.id
                      ? 'पुराने परिणाम रिकॉर्ड का संपादन'
                      : 'नवीन परीक्षा परिणाम की प्रविष्टि'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingResult(null);
                  setFormError(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Exam Cycle Selection - Top Priority Selection Box */}
              <div className="bg-amber-50/60 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="exam-cycle-dropdown" className="block text-xs font-bold text-gray-900 dark:text-white">
                    परीक्षा सत्र / साइकिल का चयन करें <span className="text-rose-500 font-black">*</span>
                  </label>
                  {editingResult.examCycleId && (
                    <span className="text-[10.5px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md">
                      ✓ साइकिल चयनित
                    </span>
                  )}
                </div>

                <select
                  id="exam-cycle-dropdown"
                  disabled={isReadOnlyMode}
                  value={editingResult.examCycleId || ''}
                  onChange={(e) => handleCycleChange(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    formError ? 'border-rose-500 ring-2 ring-rose-300 dark:ring-rose-900' : 'border-gray-300 dark:border-gray-700'
                  } ${
                    isReadOnlyMode
                      ? 'bg-gray-100 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                      : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white cursor-pointer'
                  } font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-hidden`}
                >
                  <option value="" disabled>
                    [ परीक्षा सत्र / साइकिल चुनें ▼ ]
                  </option>
                  {availableExamCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.examCycleName || c.examName} {c.academicYear ? `(सत्र ${c.academicYear})` : ''} — {c.examDate}
                    </option>
                  ))}
                  {availableExamCycles.length === 0 && (
                    <option value="" disabled>
                      अभी कोई परीक्षा सत्र / साइकिल उपलब्ध नहीं है। पहले परीक्षा सत्र / साइकिल बनाएं।
                    </option>
                  )}
                </select>

                {/* Empty State Warning */}
                {availableExamCycles.length === 0 && (
                  <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>अभी कोई परीक्षा सत्र / साइकिल उपलब्ध नहीं है। पहले परीक्षा सत्र / साइकिल बनाएं।</span>
                    </div>
                    {!isSchoolUser && (
                      <button
                        type="button"
                        onClick={() => setIsCycleModalOpen(true)}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold shrink-0 cursor-pointer"
                      >
                        + नया सत्र बनाएं
                      </button>
                    )}
                  </div>
                )}

                {/* Validation Error Message */}
                {formError && (
                  <p className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{formError}</span>
                  </p>
                )}

                {editingResult.examDate && (
                  <div className="flex items-center gap-3 text-[11px] text-gray-600 dark:text-gray-300 pt-0.5">
                    <span>
                      निर्धारित परीक्षा दिनांक: <strong className="text-amber-800 dark:text-amber-300 font-bold">{editingResult.examDate}</strong>
                    </span>
                    {editingResult.academicYear && (
                      <span>
                        सत्र: <strong className="text-gray-800 dark:text-gray-200">{editingResult.academicYear}</strong>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* School Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    विद्यालय का नाम
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingResult.schoolName || ''}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    UDISE कोड
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingResult.schoolUdise || ''}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Registered Counts & Total (3 High-Contrast Cards) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-gray-100 px-0.5">
                  <span className="uppercase tracking-wider">पंजीकृत असाक्षर शिक्षार्थी संख्या विवरण</span>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">महिला + पुरुष = कुल प्रतिभागी</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Modal Card 1: पंजीकृत असाक्षर शिक्षार्थी (कुल प्रतिभागी) */}
                  <div
                    id="modal-card-total-learners"
                    className="p-3.5 rounded-xl border-2 border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/70 flex flex-col justify-between shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-black text-amber-950 dark:text-amber-100 uppercase tracking-wider">
                        पंजीकृत असाक्षर शिक्षार्थी
                      </span>
                      <Users className="w-4 h-4 text-amber-900 dark:text-amber-200" />
                    </div>
                    <div className="my-1.5 text-center sm:text-left">
                      <span className="text-2xl sm:text-3xl font-black text-amber-950 dark:text-amber-50 font-mono">
                        {Number(editingResult.totalLearners) || 0}
                      </span>
                    </div>
                    <div className="text-[11px] font-black text-amber-950 dark:text-amber-100 border-t border-amber-300 dark:border-amber-700 pt-1.5 flex items-center justify-between">
                      <span>कुल प्रतिभागी</span>
                      <span className="text-[10px] font-bold text-amber-900 dark:text-amber-200 font-mono">(स्वतः संगणित)</span>
                    </div>
                  </div>

                  {/* Modal Card 2: पंजीकृत महिला शिक्षार्थी */}
                  <div
                    id="modal-card-female-learners"
                    className="p-3.5 rounded-xl border-2 border-rose-400 dark:border-rose-600 bg-rose-50 dark:bg-rose-950/70 flex flex-col justify-between shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <label htmlFor="female-learners-input" className="text-[11px] font-black text-rose-950 dark:text-rose-100 uppercase tracking-wider cursor-pointer">
                        पंजीकृत महिला शिक्षार्थी
                      </label>
                      <UserCheck className="w-4 h-4 text-rose-900 dark:text-rose-200" />
                    </div>
                    <div className="my-1">
                      <input
                        id="female-learners-input"
                        type="number"
                        min="0"
                        disabled={isReadOnlyMode}
                        value={editingResult.femaleLearners ?? 0}
                        onChange={(e) => handleCountChange('femaleLearners', Number(e.target.value))}
                        className={`w-full px-2.5 py-1 text-xl rounded-lg border-2 border-rose-400 dark:border-rose-500 font-black font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden ${
                          isReadOnlyMode ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed' : 'bg-white dark:bg-gray-900 text-rose-950 dark:text-rose-50'
                        }`}
                      />
                    </div>
                    <div className="text-[11px] font-black text-rose-950 dark:text-rose-100 border-t border-rose-300 dark:border-rose-700 pt-1.5 flex items-center justify-between">
                      <span>महिला शिक्षार्थी</span>
                      <span className="text-[10px] font-bold text-rose-900 dark:text-rose-200 font-mono">संख्या दर्ज करें</span>
                    </div>
                  </div>

                  {/* Modal Card 3: पंजीकृत पुरुष शिक्षार्थी */}
                  <div
                    id="modal-card-male-learners"
                    className="p-3.5 rounded-xl border-2 border-sky-400 dark:border-sky-600 bg-sky-50 dark:bg-sky-950/70 flex flex-col justify-between shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <label htmlFor="male-learners-input" className="text-[11px] font-black text-sky-950 dark:text-sky-100 uppercase tracking-wider cursor-pointer">
                        पंजीकृत पुरुष शिक्षार्थी
                      </label>
                      <User className="w-4 h-4 text-sky-900 dark:text-sky-200" />
                    </div>
                    <div className="my-1">
                      <input
                        id="male-learners-input"
                        type="number"
                        min="0"
                        disabled={isReadOnlyMode}
                        value={editingResult.maleLearners ?? 0}
                        onChange={(e) => handleCountChange('maleLearners', Number(e.target.value))}
                        className={`w-full px-2.5 py-1 text-xl rounded-lg border-2 border-sky-400 dark:border-sky-500 font-black font-mono focus:ring-2 focus:ring-sky-500 focus:outline-hidden ${
                          isReadOnlyMode ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed' : 'bg-white dark:bg-gray-900 text-sky-950 dark:text-sky-50'
                        }`}
                      />
                    </div>
                    <div className="text-[11px] font-black text-sky-950 dark:text-sky-100 border-t border-sky-300 dark:border-sky-700 pt-1.5 flex items-center justify-between">
                      <span>पुरुष शिक्षार्थी</span>
                      <span className="text-[10px] font-bold text-sky-900 dark:text-sky-200 font-mono">संख्या दर्ज करें</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-amber-50/50 dark:bg-amber-950/20 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/40">
                <div>
                  <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-300 mb-1">
                    परीक्षा सम्मिलित संख्या
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isReadOnlyMode}
                    value={editingResult.participatedLearners ?? 0}
                    onChange={(e) => handleCountChange('participatedLearners', Number(e.target.value))}
                    className={`w-full px-3 py-1.5 rounded-lg border border-blue-300 dark:border-blue-700 font-bold font-mono ${
                      isReadOnlyMode ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                    उत्तीर्ण शिक्षार्थी
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isReadOnlyMode}
                    value={editingResult.passedLearners ?? 0}
                    onChange={(e) => handleCountChange('passedLearners', Number(e.target.value))}
                    className={`w-full px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 font-bold font-mono ${
                      isReadOnlyMode ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-300 mb-1">
                    अनुत्तीर्ण शिक्षार्थी
                  </label>
                  <input
                    type="number"
                    min="0"
                    disabled={isReadOnlyMode}
                    value={editingResult.failedLearners ?? 0}
                    onChange={(e) => handleCountChange('failedLearners', Number(e.target.value))}
                    className={`w-full px-3 py-1.5 rounded-lg border border-rose-300 dark:border-rose-700 font-bold font-mono ${
                      isReadOnlyMode ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Calculated Remaining Illiterate Summary */}
              <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg text-xs">
                <span className="font-semibold text-gray-700 dark:text-gray-300">
                  शेष असाक्षर शिक्षार्थी (कुल − उत्तीर्ण):
                </span>
                <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                  {Number(editingResult.remainingIlliterateLearners) || 0}
                </span>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  विशेष विवरण / टिप्पणी
                </label>
                <input
                  type="text"
                  disabled={isReadOnlyMode}
                  value={editingResult.remarks || ''}
                  onChange={(e) => setEditingResult({ ...editingResult, remarks: e.target.value })}
                  className={`w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 ${
                    isReadOnlyMode ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 cursor-not-allowed' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                  placeholder="जैसे: सुगम एवं शांतिपूर्ण मूल्यांकन संपन्न"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                {isReadOnlyMode ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingResult(null);
                      setFormError(null);
                    }}
                    className="px-5 py-2 rounded-xl bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white font-bold transition-colors cursor-pointer"
                  >
                    बंद करें
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false);
                        setEditingResult(null);
                        setFormError(null);
                      }}
                      className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      रद्द करें
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      <Save className="w-4 h-4" />
                      <span>परिणाम सुरक्षित करें</span>
                    </button>
                  </>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Dialog for New Exam Cycle (CAC / Admin) */}
      {isCycleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  नया साक्षरता परीक्षा सत्र जोड़ें
                </h3>
              </div>
              <button
                onClick={() => setIsCycleModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCycle} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  परीक्षा का नाम <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCycle.examName || ''}
                  onChange={(e) => setNewCycle({ ...newCycle, examName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                  placeholder="जैसे: 23 मार्च परीक्षा 2025"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  परीक्षा तिथि <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newCycle.examDate || ''}
                  onChange={(e) => setNewCycle({ ...newCycle, examDate: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="जैसे: 23/03/2025"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  शैक्षणिक सत्र
                </label>
                <input
                  type="text"
                  value={newCycle.academicYear || selectedSessionId || '2026-27'}
                  onChange={(e) => setNewCycle({ ...newCycle, academicYear: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  विवरण / उद्देश्य
                </label>
                <textarea
                  rows={2}
                  value={newCycle.description || ''}
                  onChange={(e) => setNewCycle({ ...newCycle, description: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="मूल्यांकन का संक्षिप्त विवरण..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsCycleModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>सत्र जोड़ें</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16221D] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                परिणाम हटाने की पुष्टि करें
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                क्या आप इस साक्षरता परीक्षा परिणाम का संकलन हटाना चाहते हैं?
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                हटाएं
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official ULLAS Form 04 Print Modal */}
      <LiteracyFormPrintModal
        isOpen={isPrintModalOpen}
        initialForm="FORM_4"
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
