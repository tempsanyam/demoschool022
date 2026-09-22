import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  X,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  GraduationCap,
  School as SchoolIcon,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react';
import { Student, School, AcademicSession } from '../../types';
import { StudentEnrollmentStatus } from '../../types/session';
import { useData } from '../../context/DataContext';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  currentSchool?: School;
  currentSessionId: string;
  onSuccess?: (message: string) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  isOpen,
  onClose,
  student,
  currentSchool,
  currentSessionId,
  onSuccess,
}) => {
  const {
    academicSessions,
    studentAcademicRecords,
    promoteStudents,
    currentUser,
    isSchoolUser,
    schools,
  } = useData();

  // Find next logical academic session (e.g., if 2026-27 -> 2027-28)
  const availableTargetSessions = useMemo(() => {
    const currentSessionObj = academicSessions.find((s) => s.id === currentSessionId);
    const curStartYear = currentSessionObj?.startYear || parseInt(currentSessionId.split('-')[0], 10) || 2026;

    return academicSessions
      .filter((s) => {
        // Target session should be upcoming or active with a higher or equal year, and not archived/closed
        return (
          s.id !== currentSessionId &&
          s.startYear >= curStartYear &&
          s.status !== 'ARCHIVED' &&
          s.status !== 'CLOSED'
        );
      })
      .sort((a, b) => a.startYear - b.startYear);
  }, [academicSessions, currentSessionId]);

  // Default target session is the immediate next session
  const defaultTargetSessionId = useMemo(() => {
    if (availableTargetSessions.length > 0) {
      return availableTargetSessions[0].id;
    }
    // Fallback: calculate next year session string
    const curYear = parseInt(currentSessionId.split('-')[0], 10) || 2026;
    const nextStart = curYear + 1;
    const nextEndShort = (nextStart + 1).toString().slice(-2);
    return `${nextStart}-${nextEndShort}`;
  }, [availableTargetSessions, currentSessionId]);

  const [toSessionId, setToSessionId] = useState<string>(defaultTargetSessionId);

  // Available classes based on school type
  const schoolClasses = useMemo(() => {
    if (!currentSchool) return ['1', '2', '3', '4', '5', '6', '7', '8'];
    const type = currentSchool.schoolType;
    if (type === 'प्राथमिक' || currentSchool.name.startsWith('PS ')) {
      return ['1', '2', '3', '4', '5'];
    }
    if (type === 'माध्यमिक' || currentSchool.name.startsWith('MS ')) {
      return ['6', '7', '8'];
    }
    if (type === 'हाई स्कूल') {
      return ['9', '10'];
    }
    if (type === 'उच्चतर माध्यमिक') {
      return ['9', '10', '11', '12'];
    }
    return ['1', '2', '3', '4', '5', '6', '7', '8'];
  }, [currentSchool]);

  // Determine suggested next class
  const suggestedNextClass = useMemo(() => {
    const curClsNum = parseInt(student.class, 10);
    if (!isNaN(curClsNum)) {
      const nextNum = curClsNum + 1;
      const nextStr = nextNum.toString();
      // If primary school and current class is 5, terminal class
      if (curClsNum === 5 && schoolClasses[schoolClasses.length - 1] === '5') {
        return '6'; // Can be promoted to Class 6 (Middle School) or marked PASSED
      }
      if (curClsNum === 8 && schoolClasses[schoolClasses.length - 1] === '8') {
        return '9';
      }
      return nextStr;
    }
    return '1';
  }, [student.class, schoolClasses]);

  const [newClass, setNewClass] = useState<string>(suggestedNextClass);
  const [status, setStatus] = useState<StudentEnrollmentStatus>('PROMOTED');
  const [targetSchoolUdise, setTargetSchoolUdise] = useState<string>(student.schoolUdise);
  const [remarks, setRemarks] = useState<string>(
    `सत्र ${currentSessionId} (कक्षा ${student.class}) से वार्षिक मूल्यांकन उपरांत कक्षोन्नत`
  );
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const middleSchools = useMemo(() => {
    return schools.filter(
      (s) =>
        s.schoolType?.includes('माध्यमिक') ||
        s.schoolType?.includes('उच्चतर') ||
        s.name.startsWith('MS ') ||
        s.name.startsWith('GMS ') ||
        s.name.startsWith('HS ') ||
        s.name.startsWith('HSS ')
    );
  }, [schools]);

  const isTerminalPrimary = student.class === '5' && parseInt(newClass, 10) >= 6;

  // Clean state reset whenever modal opens or student changes
  React.useEffect(() => {
    if (isOpen) {
      setToSessionId(defaultTargetSessionId);
      setNewClass(suggestedNextClass);
      setStatus('PROMOTED');
      setTargetSchoolUdise(student.schoolUdise);
      setRemarks(`सत्र ${currentSessionId} (कक्षा ${student.class}) से वार्षिक मूल्यांकन उपरांत कक्षोन्नत`);
      setShowConfirm(false);
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, student.id, student.class, student.schoolUdise, suggestedNextClass, defaultTargetSessionId, currentSessionId]);

  // Duplicate Check: Check if active record already exists in target session
  const duplicateActiveRecord = useMemo(() => {
    const effectiveTargetUdise = targetSchoolUdise || student.schoolUdise;
    return studentAcademicRecords.find(
      (r) =>
        r.studentId === student.id &&
        r.sessionId === toSessionId &&
        r.schoolUdise === effectiveTargetUdise &&
        r.enrollmentStatus === 'ACTIVE'
    );
  }, [studentAcademicRecords, student.id, toSessionId, targetSchoolUdise, student.schoolUdise]);

  if (!isOpen) return null;

  const handlePromote = () => {
    if (duplicateActiveRecord) {
      setErrorMessage('इस विद्यार्थी का चयनित शैक्षणिक सत्र में सक्रिय शैक्षणिक रिकॉर्ड पहले से उपलब्ध है।');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = promoteStudents([
        {
          studentId: student.id,
          fromSessionId: currentSessionId,
          toSessionId,
          oldClass: student.class,
          newClass: status === 'PASSED' ? student.class : newClass,
          status,
          schoolUdise: student.schoolUdise,
          targetSchoolUdise: targetSchoolUdise !== student.schoolUdise ? targetSchoolUdise : undefined,
          remarks,
        },
      ]);

      if (onSuccess) {
        onSuccess(
          `विद्यार्थी ${student.name} को सफलतापूर्वक सत्र ${toSessionId} में कक्षा ${newClass} में कक्षोन्नत कर दिया गया है।`
        );
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'कक्षा प्रोन्नति में त्रुटि उत्पन्न हुई।');
    } finally {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#16211D] rounded-2xl max-w-xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-[#0B6B4B] to-[#124D36] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">विद्यार्थी कक्षा प्रोन्नति (Class Promotion)</h3>
              <p className="text-xs text-emerald-100">
                शैक्षणिक सत्र परिवर्तन एवं आगामी कक्षा में प्रोन्नति
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
          {/* Current Student Profile Summary Card */}
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                वर्तमान विद्यार्थी विवरण
              </span>
              <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">
                समग्र: <span className="text-[#0B6B4B] dark:text-emerald-400">{student.samagraId}</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">विद्यार्थी का नाम:</span>
                <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-400" />
                  {student.name}
                </span>
                <span className="text-[11px] text-gray-500">पिता: {student.fatherName || '-'}</span>
              </div>

              <div>
                <span className="text-gray-500 dark:text-gray-400 block text-[11px]">वर्तमान विद्यालय:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 block truncate" title={currentSchool?.name || student.schoolUdise}>
                  {currentSchool?.name || currentSchool?.hindiName || student.schoolUdise}
                </span>
                <span className="text-[10px] font-mono text-gray-400">यूडाइस: {student.schoolUdise}</span>
              </div>
            </div>

            {/* Current Session & Class Flow Badge */}
            <div className="flex items-center justify-between pt-2 border-t border-emerald-200/50 dark:border-emerald-800/40">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  वर्तमान सत्र:{' '}
                  <strong className="text-gray-900 dark:text-white font-mono">{currentSessionId}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                <span className="text-gray-600 dark:text-gray-300">
                  वर्तमान कक्षा:{' '}
                  <strong className="text-[#0B6B4B] dark:text-emerald-400 font-bold">कक्षा {student.class}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Visual Progression Banner */}
          <div className="p-3 bg-gray-50 dark:bg-[#1A2621] rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-bold block">प्रस्थान सत्र</span>
              <span className="font-mono font-bold text-gray-800 dark:text-gray-200">{currentSessionId}</span>
              <div className="font-bold text-xs text-gray-700 dark:text-gray-300">कक्षा {student.class}</div>
            </div>

            <div className="flex flex-col items-center justify-center px-2">
              <ArrowRight className="w-5 h-5 text-[#0B6B4B] animate-pulse" />
              <span className="text-[10px] text-[#0B6B4B] font-bold">प्रोन्नति</span>
            </div>

            <div>
              <span className="text-[10px] text-emerald-600 uppercase font-bold block">लक्ष्य सत्र</span>
              <span className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400">{toSessionId}</span>
              <div className="font-bold text-xs text-emerald-700 dark:text-emerald-300">
                {status === 'PASSED' ? 'उत्तीर्ण (शाला पूर्ण)' : `कक्षा ${newClass}`}
              </div>
            </div>
          </div>

          {/* Error / Duplicate Warning Banner */}
          {duplicateActiveRecord && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300 animate-in fade-in duration-150">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold block text-xs">सक्रिय नामांकन डुप्लीकेट संरक्षण</strong>
                <p className="text-[11px] mt-0.5">
                  इस विद्यार्थी का चयनित शैक्षणिक सत्र में सक्रिय शैक्षणिक रिकॉर्ड पहले से उपलब्ध है।
                </p>
                <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-mono">
                  सत्र: {toSessionId} | विद्यालय: {duplicateActiveRecord.schoolUdise} | कक्षा: {duplicateActiveRecord.class}
                </p>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-start gap-2.5 text-rose-800 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span className="font-semibold text-xs">{errorMessage}</span>
            </div>
          )}

          {/* Form Inputs */}
          <div className="space-y-3.5 pt-2">
            {/* Target Session */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                प्रोन्नति का अगला शैक्षणिक सत्र (Target Academic Session) <span className="text-red-500">*</span>
              </label>
              <select
                value={toSessionId}
                onChange={(e) => {
                  setToSessionId(e.target.value);
                  setErrorMessage(null);
                }}
                className="w-full bg-white dark:bg-[#1A2621] border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-xs font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {availableTargetSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    सत्र {s.name || s.id} ({s.status === 'UPCOMING' ? 'आगामी सत्र' : s.status === 'ACTIVE' ? 'सक्रिय सत्र' : s.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Class & Status in Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  नई कक्षा (New Class) <span className="text-red-500">*</span>
                </label>
                <select
                  value={newClass}
                  disabled={status === 'PASSED'}
                  onChange={(e) => setNewClass(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A2621] border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-50"
                >
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                    <option key={cls} value={cls}>
                      कक्षा {cls} {cls === suggestedNextClass ? '(अनुशंसित)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  स्थिति (Promotion Status) <span className="text-red-500">*</span>
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as StudentEnrollmentStatus)}
                  className="w-full bg-white dark:bg-[#1A2621] border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-xs font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PROMOTED">कक्षोन्नत (Promoted - अगली कक्षा)</option>
                  <option value="RETAINED">उसी कक्षा में (Repeat / Retained)</option>
                  <option value="PASSED">शाला पूर्ण / उत्तीर्ण (Passed Out)</option>
                </select>
              </div>
            </div>

            {/* Terminal Class 5 -> Class 6 Transition & School Selection */}
            {isTerminalPrimary && (
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 font-bold text-xs">
                    <SchoolIcon className="w-3.5 h-3.5 text-blue-600" />
                    <span>कक्षा 5 से 6 संक्रमण: लक्ष्य शाला (Target School)</span>
                  </div>
                  <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 font-semibold px-2 py-0.5 rounded">
                    प्राथमिक ➔ माध्यमिक
                  </span>
                </div>

                <select
                  value={targetSchoolUdise}
                  onChange={(e) => setTargetSchoolUdise(e.target.value)}
                  className="w-full bg-white dark:bg-[#1A2621] border border-blue-300 dark:border-blue-700 rounded-xl p-2.5 text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value={student.schoolUdise}>
                    वर्तमान शाला में ही रखें ({currentSchool?.name || currentSchool?.hindiName || student.schoolUdise})
                  </option>
                  {middleSchools.map((ms) => (
                    <option key={ms.udise} value={ms.udise}>
                      {ms.name || ms.hindiName} ({ms.udise}) - {ms.schoolType}
                    </option>
                  ))}
                </select>

                {targetSchoolUdise === student.schoolUdise && (
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1">
                    <span>⚠️</span>
                    <span>
                      <strong>वैलिडेशन सूचना:</strong> प्राथमिक शाला (PS) में सामान्यतः कक्षा 5 अंतिम कक्षा होती है। यदि विद्यार्थी माध्यमिक स्तर (कक्षा 6) में संकुल की माध्यमिक शाला (उदा. MS MALGUWA) में जा रहा है, तो कृपया लक्ष्य शाला का चयन करें; अन्यथा विद्यार्थी इसी शाला कोड में कक्षा 6 में नामांकित रहेगा।
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Remarks */}
            <div>
              <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                टिप्पणी (Promotion Remarks)
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="वार्षिक मूल्यांकन उपरांत कक्षोन्नत..."
                className="w-full bg-white dark:bg-[#1A2621] border border-gray-300 dark:border-gray-700 rounded-xl p-2.5 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Historical Data Protection Warning Notice */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            <strong className="font-bold flex items-center gap-1.5 mb-0.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              अभिलेखीय सुरक्षा नियम (Session History Preservation)
            </strong>
            सत्र {currentSessionId} का वर्तमान कक्षा {student.class} का रिकॉर्ड सुरक्षित रहेगा एवं केवल स्थिति को 'PROMOTED' में अद्यतन किया जाएगा। लक्ष्य सत्र {toSessionId} में कक्षा {newClass} का नवीन सक्रिय शैक्षणिक नामांकन दर्ज होगा।
          </div>

          {/* Confirmation Checkbox Box */}
          {showConfirm && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl animate-in fade-in space-y-2">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold">
                <CheckCircle2 className="w-4 h-4 text-[#0B6B4B]" />
                <span>अंतिम पुष्टि (Final Confirmation)</span>
              </div>
              <p className="text-[11px] text-gray-700 dark:text-gray-300">
                क्या आप विद्यार्थी <strong>{student.name}</strong> (समग्र: {student.samagraId}) को सत्र{' '}
                <strong>{toSessionId}</strong> में कक्षा <strong>{newClass}</strong> में प्रोन्नत करने की पुष्टि करते हैं?
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handlePromote}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-[#0B6B4B] hover:bg-[#085239] text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center gap-1.5"
                >
                  {isSubmitting ? 'सहेज रहे हैं...' : 'हाँ, कक्षोन्नति पूर्ण करें'}
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
              disabled={!!duplicateActiveRecord || isSubmitting}
              onClick={() => setShowConfirm(true)}
              className="px-5 py-2 bg-[#0B6B4B] hover:bg-[#085239] text-white rounded-xl font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <TrendingUp className="w-4 h-4" />
              <span>कक्षा प्रोन्नत करें</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
