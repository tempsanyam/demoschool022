import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  School as SchoolIcon,
  Filter,
  Users,
  ShieldAlert,
  Check,
} from 'lucide-react';
import { Student, School, AcademicSession } from '../../types';
import { StudentEnrollmentStatus } from '../../types/session';
import { useData } from '../../context/DataContext';

interface BulkPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSessionId: string;
  onSuccess?: (message: string) => void;
}

export const BulkPromotionModal: React.FC<BulkPromotionModalProps> = ({
  isOpen,
  onClose,
  currentSessionId,
  onSuccess,
}) => {
  const {
    scopedSchools,
    scopedStudents,
    academicSessions,
    studentAcademicRecords,
    promoteStudents,
    currentUser,
    isSchoolUser,
    currentSchoolUdise,
  } = useData();

  // Selected School (restricted to current school for SCHOOL users)
  const [selectedUdise, setSelectedUdise] = useState<string>(
    currentSchoolUdise || scopedSchools[0]?.udise || ''
  );

  const activeSchool = useMemo(() => {
    return scopedSchools.find((s) => s.udise === selectedUdise);
  }, [scopedSchools, selectedUdise]);

  // Available classes in active school
  const schoolClasses = useMemo(() => {
    if (!activeSchool) return ['1', '2', '3', '4', '5'];
    const type = activeSchool.schoolType;
    if (type === 'प्राथमिक' || activeSchool.name.startsWith('PS ')) {
      return ['1', '2', '3', '4', '5'];
    }
    if (type === 'माध्यमिक' || activeSchool.name.startsWith('MS ')) {
      return ['6', '7', '8'];
    }
    if (type === 'हाई स्कूल') {
      return ['9', '10'];
    }
    if (type === 'उच्चतर माध्यमिक') {
      return ['9', '10', '11', '12'];
    }
    return ['1', '2', '3', '4', '5', '6', '7', '8'];
  }, [activeSchool]);

  const [fromClass, setFromClass] = useState<string>(schoolClasses[0] || '1');

  // Next academic session options
  const availableTargetSessions = useMemo(() => {
    const curSessionObj = academicSessions.find((s) => s.id === currentSessionId);
    const curStartYear = curSessionObj?.startYear || parseInt(currentSessionId.split('-')[0], 10) || 2026;

    return academicSessions
      .filter((s) => {
        return (
          s.id !== currentSessionId &&
          s.startYear >= curStartYear &&
          s.status !== 'ARCHIVED' &&
          s.status !== 'CLOSED'
        );
      })
      .sort((a, b) => a.startYear - b.startYear);
  }, [academicSessions, currentSessionId]);

  const defaultTargetSessionId = useMemo(() => {
    if (availableTargetSessions.length > 0) {
      return availableTargetSessions[0].id;
    }
    const curYear = parseInt(currentSessionId.split('-')[0], 10) || 2026;
    const nextStart = curYear + 1;
    const nextEndShort = (nextStart + 1).toString().slice(-2);
    return `${nextStart}-${nextEndShort}`;
  }, [availableTargetSessions, currentSessionId]);

  const [toSessionId, setToSessionId] = useState<string>(defaultTargetSessionId);

  // Suggested Target Class
  const suggestedTargetClass = useMemo(() => {
    const curNum = parseInt(fromClass, 10);
    if (!isNaN(curNum)) {
      if (curNum === 5 && schoolClasses[schoolClasses.length - 1] === '5') {
        return '6';
      }
      if (curNum === 8 && schoolClasses[schoolClasses.length - 1] === '8') {
        return '9';
      }
      return (curNum + 1).toString();
    }
    return '2';
  }, [fromClass, schoolClasses]);

  const [toClass, setToClass] = useState<string>(suggestedTargetClass);

  // Update toClass whenever fromClass changes
  React.useEffect(() => {
    setToClass(suggestedTargetClass);
  }, [suggestedTargetClass]);

  // Students in selected school and class
  const eligibleStudents = useMemo(() => {
    return scopedStudents.filter(
      (s) => s.schoolUdise === selectedUdise && s.class === fromClass
    );
  }, [scopedStudents, selectedUdise, fromClass]);

  // Determine duplicate records in target session
  const studentEligibilityMap = useMemo(() => {
    const map = new Map<string, { isDuplicate: boolean; duplicateRecord?: any }>();
    eligibleStudents.forEach((st) => {
      const existingActive = studentAcademicRecords.find(
        (r) =>
          r.studentId === st.id &&
          r.sessionId === toSessionId &&
          r.schoolUdise === selectedUdise &&
          r.enrollmentStatus === 'ACTIVE'
      );
      map.set(st.id, {
        isDuplicate: !!existingActive,
        duplicateRecord: existingActive,
      });
    });
    return map;
  }, [eligibleStudents, studentAcademicRecords, toSessionId, selectedUdise]);

  // Selected students checkboxes
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});

  // Auto-select eligible students (excluding duplicates) when list changes
  React.useEffect(() => {
    const initialSelection: Record<string, boolean> = {};
    eligibleStudents.forEach((st) => {
      const info = studentEligibilityMap.get(st.id);
      if (!info?.isDuplicate) {
        initialSelection[st.id] = true;
      }
    });
    setSelectedIds(initialSelection);
  }, [eligibleStudents, studentEligibilityMap]);

  const toggleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    if (checked) {
      eligibleStudents.forEach((st) => {
        const info = studentEligibilityMap.get(st.id);
        if (!info?.isDuplicate) {
          updated[st.id] = true;
        }
      });
    }
    setSelectedIds(updated);
  };

  const selectedCount = useMemo(() => {
    return Object.values(selectedIds).filter(Boolean).length;
  }, [selectedIds]);

  const duplicateCount = useMemo(() => {
    let count = 0;
    studentEligibilityMap.forEach((val) => {
      if (val.isDuplicate) count++;
    });
    return count;
  }, [studentEligibilityMap]);

  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteBulkPromotion = () => {
    const studentsToPromote = eligibleStudents.filter((st) => selectedIds[st.id]);

    if (studentsToPromote.length === 0) {
      setErrorMessage('कृपया प्रोन्नति हेतु कम से कम एक विद्यार्थी का चयन करें।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = studentsToPromote.map((st) => ({
        studentId: st.id,
        fromSessionId: currentSessionId,
        toSessionId,
        oldClass: fromClass,
        newClass: toClass,
        status: 'PROMOTED' as StudentEnrollmentStatus,
        schoolUdise: selectedUdise,
        remarks: `सत्र ${currentSessionId} (कक्षा ${fromClass}) से सामूहिक कक्षोन्नति (Bulk Promotion)`,
      }));

      const res = promoteStudents(payload);
      if (onSuccess) {
        onSuccess(
          `सफलतापूर्वक ${res.promotedCount} विद्यार्थियों को सत्र ${toSessionId} में कक्षा ${toClass} में कक्षोन्नत कर दिया गया है।`
        );
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'सामूहिक कक्षोन्नति में त्रुटि उत्पन्न हुई।');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16211D] rounded-2xl max-w-4xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-[#0B6B4B] to-[#124D36] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <Users className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">सामूहिक कक्षा प्रोन्नति (Bulk Class Promotion)</h3>
              <p className="text-xs text-emerald-100">
                कक्षा-वार समस्त पात्र विद्यार्थियों को आगामी शैक्षणिक सत्र एवं कक्षा में एक साथ प्रोन्नत करें
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Filter Bar */}
          <div className="bg-gray-50 dark:bg-[#1A2621] p-4 rounded-xl border border-gray-200 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* School Selection */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                विद्यालय (यूडाइस) {isSchoolUser && <span className="text-[10px] text-gray-400 font-normal">(अधिकृत)</span>}
              </label>
              <select
                value={selectedUdise}
                disabled={isSchoolUser}
                onChange={(e) => setSelectedUdise(e.target.value)}
                className="w-full bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-75"
              >
                {scopedSchools.map((s) => (
                  <option key={s.udise} value={s.udise}>
                    {s.name} ({s.udise})
                  </option>
                ))}
              </select>
            </div>

            {/* Source Class */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                वर्तमान कक्षा (Source Class)
              </label>
              <select
                value={fromClass}
                onChange={(e) => setFromClass(e.target.value)}
                className="w-full bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-xs font-bold text-[#0B6B4B] dark:text-emerald-400 focus:ring-2 focus:ring-emerald-500"
              >
                {schoolClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    कक्षा {cls}
                  </option>
                ))}
              </select>
            </div>

            {/* Target Session */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                लक्ष्य शैक्षणिक सत्र (Target Session)
              </label>
              <select
                value={toSessionId}
                onChange={(e) => setToSessionId(e.target.value)}
                className="w-full bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-xs font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {availableTargetSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    सत्र {s.id} ({s.status === 'UPCOMING' ? 'आगामी' : s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Class */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                लक्ष्य कक्षा (Target Class)
              </label>
              <select
                value={toClass}
                onChange={(e) => setToClass(e.target.value)}
                className="w-full bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg p-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 focus:ring-2 focus:ring-emerald-500"
              >
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                  <option key={cls} value={cls}>
                    कक्षा {cls} {cls === suggestedTargetClass ? '(अनुशंसित)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Metric Badges Summary */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900 text-center">
              <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold uppercase block">
                कक्षा {fromClass} के कुल विद्यार्थी
              </span>
              <span className="text-xl font-black text-blue-900 dark:text-blue-200">
                {eligibleStudents.length}
              </span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900 text-center">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase block">
                प्रोन्नति हेतु चयनित
              </span>
              <span className="text-xl font-black text-emerald-900 dark:text-emerald-200">
                {selectedCount}
              </span>
            </div>

            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900 text-center">
              <span className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold uppercase block">
                पात्र विद्यार्थी (Eligible)
              </span>
              <span className="text-xl font-black text-indigo-900 dark:text-indigo-200">
                {eligibleStudents.length - duplicateCount}
              </span>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-100 dark:border-amber-900 text-center">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase block">
                पूर्व नामांकित (Duplicates)
              </span>
              <span className="text-xl font-black text-amber-900 dark:text-amber-200">
                {duplicateCount}
              </span>
            </div>
          </div>

          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-xs">{errorMessage}</span>
            </div>
          )}

          {/* Student Selection Table */}
          <div className="bg-white dark:bg-[#1A2621] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="p-3 bg-gray-50 dark:bg-[#121B17] border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="bulk-select-all"
                  checked={eligibleStudents.length > 0 && selectedCount === eligibleStudents.length - duplicateCount}
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <label htmlFor="bulk-select-all" className="font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                  समस्त पात्र विद्यार्थियों का चयन करें ({selectedCount}/{eligibleStudents.length - duplicateCount})
                </label>
              </div>

              <div className="text-[11px] text-gray-500">
                कक्षा {fromClass} ({currentSessionId}) ➔ कक्षा {toClass} ({toSessionId})
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100/60 dark:bg-[#0F1713] text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                    <th className="p-2.5 text-center w-12">चयन</th>
                    <th className="p-2.5 font-bold">समग्र आईडी</th>
                    <th className="p-2.5 font-bold">विद्यार्थी का नाम</th>
                    <th className="p-2.5 font-bold">पिता का नाम</th>
                    <th className="p-2.5 font-bold text-center">वर्तमान कक्षा</th>
                    <th className="p-2.5 font-bold text-center">लक्ष्य कक्षा</th>
                    <th className="p-2.5 font-bold text-center">पात्रता स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {eligibleStudents.length > 0 ? (
                    eligibleStudents.map((st) => {
                      const eligInfo = studentEligibilityMap.get(st.id);
                      const isDuplicate = eligInfo?.isDuplicate;
                      const isSelected = !!selectedIds[st.id];

                      return (
                        <tr
                          key={st.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${
                            isDuplicate ? 'opacity-60 bg-amber-50/20' : isSelected ? 'bg-emerald-50/30' : ''
                          }`}
                        >
                          <td className="p-2.5 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isDuplicate}
                              onChange={(e) =>
                                setSelectedIds({
                                  ...selectedIds,
                                  [st.id]: e.target.checked,
                                })
                              }
                              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 disabled:opacity-40"
                            />
                          </td>
                          <td className="p-2.5 font-mono font-bold text-[#0B6B4B] dark:text-emerald-400">
                            {st.samagraId}
                          </td>
                          <td className="p-2.5 font-bold text-gray-900 dark:text-white">{st.name}</td>
                          <td className="p-2.5 text-gray-600 dark:text-gray-300">{st.fatherName || '-'}</td>
                          <td className="p-2.5 text-center font-semibold text-gray-700 dark:text-gray-300">
                            कक्षा {st.class}
                          </td>
                          <td className="p-2.5 text-center font-bold text-emerald-700 dark:text-emerald-300">
                            कक्षा {toClass}
                          </td>
                          <td className="p-2.5 text-center">
                            {isDuplicate ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                <ShieldAlert className="w-3 h-3" />
                                पहले से नामांकित
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold text-[10px]">
                                <Check className="w-3 h-3" />
                                प्रोन्नति हेतु पात्र
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-500">
                        इस विद्यालय में कक्षा {fromClass} में कोई विद्यार्थी उपलब्ध नहीं है।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historical Session Integrity Notice */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl text-blue-900 dark:text-blue-300 text-[11px] leading-relaxed">
            <strong className="font-bold flex items-center gap-1 mb-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              सत्र अखंडता नीति (Multi-Year Session Integrity)
            </strong>
            सामूहिक प्रोन्नति के दौरान विद्यार्थियों के सत्र {currentSessionId} के पूर्व अभिलेख सुरक्षित रहते हैं। लक्ष्य सत्र {toSessionId} में प्रत्येक विद्यार्थी का नवीन 'ACTIVE' शैक्षणिक नामांकन उत्पन्न किया जाता है।
          </div>

          {/* Confirmation Box */}
          {showConfirm && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl animate-in fade-in space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#0B6B4B]" />
                <span>अंतिम पुष्टि (Final Bulk Confirmation)</span>
              </div>
              <p className="text-[11px] text-gray-700 dark:text-gray-300">
                क्या आप चयनित <strong>{selectedCount}</strong> विद्यार्थियों को सत्र <strong>{currentSessionId} (कक्षा {fromClass})</strong> से सत्र <strong>{toSessionId} (कक्षा {toClass})</strong> में कक्षोन्नत करने की पुष्टि करते हैं?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExecuteBulkPromotion}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#0B6B4B] hover:bg-[#085239] text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'प्रक्रियाधीन है...' : 'हाँ, सामूहिक प्रोन्नति सहेजें'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-lg text-xs"
                >
                  निरस्त करें
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-[#111A15] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 hover:bg-gray-100 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs transition-colors"
          >
            रद्द करें
          </button>

          {!showConfirm && (
            <button
              type="button"
              disabled={selectedCount === 0 || isSubmitting}
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2 bg-[#0B6B4B] hover:bg-[#085239] text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>चयनित ({selectedCount}) विद्यार्थियों को प्रोन्नत करें</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
