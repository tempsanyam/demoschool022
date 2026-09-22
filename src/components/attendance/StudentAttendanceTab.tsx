import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  XCircle,
  Save,
  GraduationCap,
  Calendar,
  AlertCircle,
  Percent,
  School as SchoolIcon,
  Check,
  RefreshCw,
  Sparkles,
  Palmtree,
  Coffee
} from 'lucide-react';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { AttendanceRecord } from '../../types';

interface StudentAttendanceTabProps {
  selectedDate: string;
  selectedSchoolUdise: string;
  onSaved?: () => void;
  onOpenQuickModal?: () => void;
}

interface ClassEntryState {
  present: number | '';
  absent: number | '';
}

const COMMON_HOLIDAY_REASONS = [
  'रविवार (Sunday)',
  'शासकीय अवकाश (Gazetted Holiday)',
  'स्थानीय अवकाश (Local Holiday)',
  'दीपावली अवकाश',
  'होली अवकाश',
  'ग्रीष्मकालीन अवकाश',
  'स्वतंत्रता दिवस',
  'गणतंत्र दिवस',
  'गांधी जयंती',
  'अन्य अवकाश (Other)'
];

export const StudentAttendanceTab: React.FC<StudentAttendanceTabProps> = ({
  selectedDate,
  selectedSchoolUdise,
  onSaved
}) => {
  const {
    students: scopedStudents,
    schools,
    attendance: scopedAttendance,
    markAttendanceBatch,
    currentUser,
    selectedSessionId,
    isSchoolUser,
    currentSchoolUdise
  } = useSchoolScope();

  // Determine active school UDISE
  const [internalSchoolUdise, setInternalSchoolUdise] = useState<string>('');

  const activeSchoolUdise = useMemo(() => {
    if (isSchoolUser) return currentSchoolUdise;
    if (selectedSchoolUdise && selectedSchoolUdise !== 'ALL') return selectedSchoolUdise;
    if (internalSchoolUdise) return internalSchoolUdise;
    return schools[0]?.udise || '';
  }, [isSchoolUser, currentSchoolUdise, selectedSchoolUdise, internalSchoolUdise, schools]);

  // Keep internalSchoolUdise in sync if selectedSchoolUdise changes
  useEffect(() => {
    if (selectedSchoolUdise && selectedSchoolUdise !== 'ALL') {
      setInternalSchoolUdise(selectedSchoolUdise);
    } else if (!internalSchoolUdise && schools[0]?.udise) {
      setInternalSchoolUdise(schools[0].udise);
    }
  }, [selectedSchoolUdise, schools, internalSchoolUdise]);

  const activeSchool = useMemo(() => {
    return schools.find((s) => s.udise === activeSchoolUdise);
  }, [schools, activeSchoolUdise]);

  // Registered students strictly for this school & current academic session
  const schoolStudents = useMemo(() => {
    return scopedStudents.filter((s) => s.schoolUdise === activeSchoolUdise);
  }, [scopedStudents, activeSchoolUdise]);

  // Available classes: Standard classes for the school type + any class with enrolled students
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    const isMiddle = activeSchool?.type === 'Middle' || (activeSchool as any)?.schoolType === 'माध्यमिक';
    
    if (isMiddle) {
      ['6', '7', '8'].forEach((c) => classSet.add(c));
    } else {
      ['1', '2', '3', '4', '5'].forEach((c) => classSet.add(c));
    }

    // Also include any class that has registered students
    schoolStudents.forEach((s) => {
      if (s.class) classSet.add(String(s.class).trim());
    });

    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [activeSchool, schoolStudents]);

  // Holiday State
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [holidayReason, setHolidayReason] = useState<string>('शासकीय अवकाश');
  const [customHolidayReason, setCustomHolidayReason] = useState<string>('');

  // Numerical entries for each class (Present & Absent ONLY)
  const [classEntries, setClassEntries] = useState<Record<string, ClassEntryState>>({});
  const [validationError, setValidationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSavedDataOnDate, setHasSavedDataOnDate] = useState(false);

  // Load existing saved attendance for (selectedDate + activeSchoolUdise + selectedSessionId)
  useEffect(() => {
    setValidationError(null);
    setSuccessMessage(null);

    const existingRecords = scopedAttendance.filter(
      (a) =>
        a.type === 'STUDENT' &&
        a.date === selectedDate &&
        a.schoolUdise === activeSchoolUdise &&
        (!a.sessionId || a.sessionId === selectedSessionId)
    );

    const hasSaved = existingRecords.length > 0;
    setHasSavedDataOnDate(hasSaved);

    // Check if previously saved as holiday
    const savedHolidayRecord = existingRecords.find(
      (r) => r.isHoliday || r.holidayReason || (r.remarks && r.remarks.includes('अवकाश'))
    );

    if (savedHolidayRecord) {
      setIsHoliday(true);
      const rsn = savedHolidayRecord.holidayReason || savedHolidayRecord.remarks?.replace('अवकाश: ', '') || 'शासकीय अवकाश';
      if (COMMON_HOLIDAY_REASONS.includes(rsn)) {
        setHolidayReason(rsn);
        setCustomHolidayReason('');
      } else {
        setHolidayReason('अन्य अवकाश (Other)');
        setCustomHolidayReason(rsn);
      }
    } else {
      // Check if selected date is Sunday
      try {
        const d = new Date(selectedDate);
        if (d.getDay() === 0 && !hasSaved) {
          setIsHoliday(true);
          setHolidayReason('रविवार (Sunday)');
          setCustomHolidayReason('');
        } else {
          setIsHoliday(false);
        }
      } catch {
        setIsHoliday(false);
      }
    }

    const newEntries: Record<string, ClassEntryState> = {};

    availableClasses.forEach((cls) => {
      const classStudentsCount = schoolStudents.filter((s) => String(s.class).trim() === cls).length;
      
      // Look for a class-specific record
      const classRecord = existingRecords.find((r) => String(r.class).trim() === cls);

      if (classRecord) {
        newEntries[cls] = {
          present: classRecord.presentCount ?? 0,
          absent: classRecord.absentCount ?? 0,
        };
      } else if (hasSaved && existingRecords.length === 1 && !existingRecords[0].class && existingRecords[0].records) {
        // Fallback for legacy whole-school records
        const classStudentIds = new Set(
          schoolStudents.filter((s) => String(s.class).trim() === cls).map((s) => s.id)
        );
        let p = 0;
        let a = 0;
        existingRecords[0].records?.forEach((rec) => {
          if (classStudentIds.has(rec.entityId)) {
            if (rec.status === 'ABSENT') a++;
            else p++;
          }
        });
        newEntries[cls] = {
          present: p,
          absent: a,
        };
      } else {
        // Default when not yet marked: all registered students present, 0 absent
        newEntries[cls] = {
          present: classStudentsCount > 0 ? classStudentsCount : 0,
          absent: 0,
        };
      }
    });

    setClassEntries(newEntries);
  }, [selectedDate, activeSchoolUdise, selectedSessionId, availableClasses, schoolStudents, scopedAttendance]);

  // Handle numerical input change for a class
  const handleInputChange = (
    cls: string,
    field: keyof ClassEntryState,
    valueStr: string
  ) => {
    setValidationError(null);
    setSuccessMessage(null);

    const regCount = schoolStudents.filter((s) => String(s.class).trim() === cls).length;

    let parsedVal: number | '' = '';
    if (valueStr !== '') {
      const num = parseInt(valueStr, 10);
      parsedVal = isNaN(num) ? 0 : Math.max(0, num);
    }

    // Auto-calculate the opposite field for convenience if valid number entered <= regCount
    setClassEntries((prev) => {
      const currentEntry = prev[cls] || { present: 0, absent: 0 };
      const updated = { ...currentEntry, [field]: parsedVal };

      if (typeof parsedVal === 'number' && parsedVal <= regCount) {
        if (field === 'present') {
          updated.absent = Math.max(0, regCount - parsedVal);
        } else if (field === 'absent') {
          updated.present = Math.max(0, regCount - parsedVal);
        }
      }

      return {
        ...prev,
        [cls]: updated,
      };
    });
  };

  // Helper to mark a single class all present
  const handleSetClassAllPresent = (cls: string) => {
    const regCount = schoolStudents.filter((s) => String(s.class).trim() === cls).length;
    setClassEntries((prev) => ({
      ...prev,
      [cls]: {
        present: regCount,
        absent: 0,
      },
    }));
    setValidationError(null);
  };

  // Helper to mark all classes all present
  const handleSetAllClassesPresent = () => {
    const newEntries: Record<string, ClassEntryState> = {};
    availableClasses.forEach((cls) => {
      const regCount = schoolStudents.filter((s) => String(s.class).trim() === cls).length;
      newEntries[cls] = {
        present: regCount,
        absent: 0,
      };
    });
    setClassEntries(newEntries);
    setValidationError(null);
  };

  // Effective holiday reason text
  const effectiveHolidayReason = useMemo(() => {
    if (holidayReason === 'अन्य अवकाश (Other)') {
      return customHolidayReason.trim() || 'अवकाश';
    }
    return holidayReason;
  }, [holidayReason, customHolidayReason]);

  // Compute metrics per class
  // Class Attendance % = (Present ÷ Registered) × 100
  const classRowsData = useMemo(() => {
    return availableClasses.map((cls) => {
      const registered = schoolStudents.filter((s) => String(s.class).trim() === cls).length;
      const entry = classEntries[cls] || { present: 0, absent: 0 };
      const present = typeof entry.present === 'number' ? entry.present : 0;
      const absent = typeof entry.absent === 'number' ? entry.absent : 0;
      const totalEntered = present + absent;
      const isBalanced = totalEntered === registered;
      // Class-wise percentage: Present ÷ Registered × 100
      const percentage = registered > 0 ? Math.round(((present / registered) * 100) * 10) / 10 : 0;

      return {
        cls,
        registered,
        present: entry.present,
        absent: entry.absent,
        presentNum: present,
        absentNum: absent,
        totalEntered,
        isBalanced,
        percentage,
      };
    });
  }, [availableClasses, schoolStudents, classEntries]);

  // Overall automatic summary across all classes
  // कुल उपस्थिति % = (सभी कक्षाओं के कुल उपस्थित ÷ सभी कक्षाओं के कुल पंजीकृत) × 100
  const overallSummary = useMemo(() => {
    let totalRegistered = 0;
    let totalPresent = 0;
    let totalAbsent = 0;
    let allBalanced = true;
    const mismatchedClasses: string[] = [];

    classRowsData.forEach((row) => {
      totalRegistered += row.registered;
      totalPresent += row.presentNum;
      totalAbsent += row.absentNum;

      if (!row.isBalanced) {
        allBalanced = false;
        mismatchedClasses.push(`कक्षा ${row.cls}`);
      }
    });

    // School Total Attendance % = (सभी कक्षाओं के कुल उपस्थित ÷ सभी कक्षाओं के कुल पंजीकृत) × 100
    // Strictly weighted total, NEVER simple average of class percentages
    const percentage =
      totalRegistered > 0 ? Math.round(((totalPresent / totalRegistered) * 100) * 10) / 10 : 0;

    return {
      totalRegistered,
      totalPresent,
      totalAbsent,
      percentage,
      allBalanced,
      mismatchedClasses,
    };
  }, [classRowsData]);

  // Validate and Save attendance or holiday
  const handleSaveAttendance = async () => {
    setValidationError(null);
    setSuccessMessage(null);

    // Case 1: Saving Holiday
    if (isHoliday) {
      if (!effectiveHolidayReason) {
        setValidationError('कृपया अवकाश का कारण / नाम दर्ज करें।');
        return;
      }

      setIsSaving(true);
      try {
        const recordsToSave: Omit<AttendanceRecord, 'id' | 'markedAt'>[] = availableClasses.map(
          (cls) => {
            const registered = schoolStudents.filter((s) => String(s.class).trim() === cls).length;
            return {
              date: selectedDate,
              schoolUdise: activeSchoolUdise,
              sessionId: selectedSessionId,
              type: 'STUDENT',
              class: cls,
              totalCount: registered,
              presentCount: 0,
              absentCount: 0,
              leaveCount: 0,
              onDutyCount: 0,
              isHoliday: true,
              holidayReason: effectiveHolidayReason,
              remarks: `अवकाश: ${effectiveHolidayReason}`,
              percentage: undefined,
              markedBy: currentUser?.name || currentUser?.username || 'शाला प्रभारी',
              records: [],
            };
          }
        );

        markAttendanceBatch(recordsToSave);

        setSuccessMessage(`दिनांक ${selectedDate} हेतु अवकाश (${effectiveHolidayReason}) सफलतापूर्वक सुरक्षित किया गया।`);
        setHasSavedDataOnDate(true);

        if (onSaved) {
          onSaved();
        }
      } catch (err: any) {
        setValidationError(err?.message || 'अवकाश सुरक्षित करते समय त्रुटि उत्पन्न हुई।');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // Case 2: Regular Working Day Validation
    // Strict rule: उपस्थित + अनुपस्थित = कुल पंजीकृत विद्यार्थी
    if (!overallSummary.allBalanced) {
      setValidationError('उपस्थिति का कुल योग (उपस्थित + अनुपस्थित) पंजीकृत विद्यार्थियों की संख्या के बराबर होना चाहिए।');
      return;
    }

    setIsSaving(true);

    try {
      const recordsToSave: Omit<AttendanceRecord, 'id' | 'markedAt'>[] = classRowsData.map(
        (row) => ({
          date: selectedDate,
          schoolUdise: activeSchoolUdise,
          sessionId: selectedSessionId,
          type: 'STUDENT',
          class: row.cls,
          totalCount: row.registered,
          presentCount: row.presentNum,
          absentCount: row.absentNum,
          leaveCount: 0,
          onDutyCount: 0,
          isHoliday: false,
          percentage: row.percentage,
          markedBy: currentUser?.name || currentUser?.username || 'शाला प्रभारी',
          records: [], // Strictly no individual student records
        })
      );

      markAttendanceBatch(recordsToSave);

      setSuccessMessage('कक्षा-वार विद्यार्थियों की उपस्थिति सफलतापूर्वक सुरक्षित की गई।');
      setHasSavedDataOnDate(true);

      if (onSaved) {
        onSaved();
      }
    } catch (err: any) {
      setValidationError(err?.message || 'उपस्थिति सुरक्षित करते समय त्रुटि उत्पन्न हुई।');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header & School Context */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              कक्षा-वार विद्यार्थी उपस्थिति (Class-wise Total Attendance)
            </h2>
            {hasSavedDataOnDate && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                ✓ सुरक्षित रिकॉर्ड
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            सभी कक्षाओं की कुल उपस्थिति दर्ज करें। सामान्य दिवस पर (उपस्थित + अनुपस्थित = कुल पंजीकृत)।
          </p>
        </div>

        {/* School Context & Selector for CAC/Admin if ALL was chosen */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          {!isSchoolUser && selectedSchoolUdise === 'ALL' && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap flex items-center gap-1">
                <SchoolIcon className="w-3.5 h-3.5 text-emerald-600" />
                शाला:
              </span>
              <select
                id="select-student-attendance-school"
                value={activeSchoolUdise}
                onChange={(e) => setInternalSchoolUdise(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-lg text-xs text-gray-900 dark:text-white font-medium max-w-[280px]"
              >
                {schools.map((s) => (
                  <option key={s.udise} value={s.udise}>
                    {s.name || s.hindiName} ({s.udise})
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeSchool && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-800 rounded-xl text-xs">
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {activeSchool.name || activeSchool.hindiName}
              </span>
              <span className="text-gray-400">|</span>
              <span className="font-mono text-gray-500 dark:text-gray-400">
                {activeSchool.udise}
              </span>
              <span className="text-gray-400">|</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                सत्र: {selectedSessionId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Holiday Toggle & Reason Bar */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isHoliday 
          ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs' 
          : 'bg-white dark:bg-[#17211C] border-[#DDE7E2] dark:border-[#2B3933]'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="checkbox-is-holiday"
              checked={isHoliday}
              onChange={(e) => {
                setIsHoliday(e.target.checked);
                setValidationError(null);
                setSuccessMessage(null);
              }}
              className="w-5 h-5 text-amber-600 rounded-md border-gray-300 dark:border-gray-600 focus:ring-amber-500 cursor-pointer"
            />
            <label
              htmlFor="checkbox-is-holiday"
              className="font-bold text-sm text-gray-900 dark:text-white cursor-pointer select-none flex items-center gap-2"
            >
              <Palmtree className={`w-4 h-4 ${isHoliday ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'}`} />
              <span>आज अवकाश है? (Mark as Holiday)</span>
            </label>
          </div>

          {/* Holiday Reason Selector & Input if isHoliday is Checked */}
          {isHoliday && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto animate-in fade-in">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 whitespace-nowrap">
                अवकाश का कारण / नाम:
              </span>
              <select
                id="select-holiday-reason"
                value={holidayReason}
                onChange={(e) => setHolidayReason(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-[#0F1713] border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-gray-900 dark:text-white font-medium"
              >
                {COMMON_HOLIDAY_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {holidayReason === 'अन्य अवकाश (Other)' && (
                <input
                  id="input-custom-holiday-reason"
                  type="text"
                  value={customHolidayReason}
                  onChange={(e) => setCustomHolidayReason(e.target.value)}
                  placeholder="अवकाश का नाम दर्ज करें..."
                  className="px-3 py-1.5 bg-white dark:bg-[#0F1713] border border-amber-300 dark:border-amber-700 rounded-lg text-xs text-gray-900 dark:text-white font-medium"
                />
              )}
            </div>
          )}
        </div>

        {isHoliday && (
          <div className="mt-2.5 pt-2.5 border-t border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <Coffee className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              अवकाश के दिवस पर कक्षा-वार संख्या भरने की आवश्यकता नहीं है। नीचे दिए गए बटन से अवकाश सुरक्षित करें।
            </span>
          </div>
        )}
      </div>

      {/* Automatic Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Total Registered Students */}
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              कुल पंजीकृत विद्यार्थी
            </span>
            <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-2xl font-black text-gray-900 dark:text-white font-mono">
              {overallSummary.totalRegistered}
            </span>
            <span className="text-[11px] text-gray-400">विद्यार्थी</span>
          </div>
        </div>

        {/* Card 2: Today's Present / Holiday Status */}
        {isHoliday ? (
          <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                शाला स्थिति
              </span>
              <Palmtree className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2">
              <span className="text-lg font-black text-amber-900 dark:text-amber-200">
                आज अवकाश है
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                आज उपस्थित
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {overallSummary.totalPresent}
              </span>
              <span className="text-[11px] text-emerald-600/70">उपस्थित</span>
            </div>
          </div>
        )}

        {/* Card 3: Today's Absent / Holiday Reason */}
        {isHoliday ? (
          <div className="bg-amber-50/80 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                अवकाश का कारण
              </span>
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="mt-2 truncate" title={effectiveHolidayReason}>
              <span className="text-sm font-bold text-amber-900 dark:text-amber-200">
                {effectiveHolidayReason}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-rose-100 dark:border-rose-950/60 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                आज अनुपस्थित
              </span>
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono">
                {overallSummary.totalAbsent}
              </span>
              <span className="text-[11px] text-rose-600/70">अनुपस्थित</span>
            </div>
          </div>
        )}

        {/* Card 4: School Total Attendance Percentage (— / N/A on Holiday) */}
        <div className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-teal-100 dark:border-teal-950/60 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">
              कुल उपस्थिति %
            </span>
            <Percent className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            {isHoliday ? (
              <span className="text-2xl font-black text-gray-400 dark:text-gray-500 font-mono" title="अवकाश होने के कारण उपस्थिति प्रतिशत लागू नहीं">
                — / N/A
              </span>
            ) : (
              <>
                <span
                  className="text-2xl font-black text-teal-700 dark:text-teal-400 font-mono"
                  title="कुल उपस्थिति % = (सभी कक्षाओं के कुल उपस्थित ÷ सभी कक्षाओं के कुल पंजीकृत) × 100"
                >
                  {overallSummary.percentage}%
                </span>
                <span className="text-[11px] text-teal-600/70 font-bold">
                  (कुल)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Validation Alert / Success Notification */}
      {validationError && (
        <div
          id="student-attendance-error"
          className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-3 text-xs animate-in fade-in"
        >
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">{validationError}</p>
            {!isHoliday && overallSummary.mismatchedClasses.length > 0 && (
              <p className="text-xs text-rose-700 dark:text-rose-300">
                असंतुलित कक्षाएं: {overallSummary.mismatchedClasses.join(', ')} — कृपया सुनिश्चित करें कि (उपस्थित + अनुपस्थित = कुल पंजीकृत)।
              </p>
            )}
          </div>
        </div>
      )}

      {successMessage && (
        <div
          id="student-attendance-success"
          className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-3 text-xs animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="font-bold text-sm">{successMessage}</p>
        </div>
      )}

      {/* Main Class-Wise Attendance Section */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        {/* Table Action Bar */}
        <div className="p-3.5 bg-gray-50/80 dark:bg-[#0F1713]/80 border-b border-[#DDE7E2] dark:border-[#2B3933] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-700 dark:text-gray-300">
              कक्षा-वार उपस्थिति तालिका ({availableClasses.length} कक्षाएं)
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500 dark:text-gray-400">
              दिनांक: <span className="font-bold text-gray-900 dark:text-white font-mono">{selectedDate}</span>
            </span>
          </div>

          {!isHoliday && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSetAllClassesPresent}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#17211C] border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>सभी कक्षाएं पूर्ण उपस्थित सेट करें</span>
              </button>
            </div>
          )}
        </div>

        {/* Holiday Banner inside Table Area if Holiday */}
        {isHoliday ? (
          <div className="p-8 text-center bg-amber-50/40 dark:bg-amber-950/20 border-b border-[#DDE7E2] dark:border-[#2B3933] space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center mx-auto text-amber-700 dark:text-amber-300">
              <Palmtree className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900 dark:text-amber-200">
                📅 दिनांक {selectedDate}: आज शाला में अवकाश है
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                अवकाश का कारण: <span className="font-bold">{effectiveHolidayReason}</span>
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                आज के दिन संख्यात्मक उपस्थिति (उपस्थित / अनुपस्थित) दर्ज करने की आवश्यकता नहीं है।
              </p>
            </div>
          </div>
        ) : (
          /* Regular Working Day Class-wise Attendance Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100/70 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 font-bold border-b border-[#DDE7E2] dark:border-[#2B3933]">
                  <th className="py-3 px-4 w-32">कक्षा</th>
                  <th className="py-3 px-4 text-center w-32">कुल पंजीकृत</th>
                  <th className="py-3 px-4 text-center w-36">उपस्थित</th>
                  <th className="py-3 px-4 text-center w-36">अनुपस्थित</th>
                  <th className="py-3 px-4 text-center w-32">उपस्थिति %</th>
                  <th className="py-3 px-4 text-center w-40">सत्यापन स्थिति</th>
                  <th className="py-3 px-3 text-center w-32">त्वरित क्रिया</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DDE7E2] dark:divide-[#2B3933]">
                {classRowsData.map((row) => (
                  <tr
                    key={row.cls}
                    className={`transition-colors ${
                      !row.isBalanced
                        ? 'bg-rose-50/40 dark:bg-rose-950/20'
                        : 'hover:bg-gray-50/70 dark:hover:bg-gray-800/20'
                    }`}
                  >
                    {/* Class Name */}
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-gray-900 dark:text-white text-sm">
                        कक्षा {row.cls}
                      </span>
                    </td>

                    {/* Registered Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 font-mono font-black text-gray-900 dark:text-white rounded-lg text-sm">
                        {row.registered}
                      </span>
                    </td>

                    {/* Present Input */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        id={`input-present-class-${row.cls}`}
                        type="number"
                        min="0"
                        max={row.registered}
                        value={row.present === '' ? '' : row.present}
                        onChange={(e) => handleInputChange(row.cls, 'present', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2.5 py-1.5 text-center font-mono font-bold text-sm bg-white dark:bg-[#0F1713] border border-emerald-300 dark:border-emerald-700/80 text-emerald-800 dark:text-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </td>

                    {/* Absent Input */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        id={`input-absent-class-${row.cls}`}
                        type="number"
                        min="0"
                        max={row.registered}
                        value={row.absent === '' ? '' : row.absent}
                        onChange={(e) => handleInputChange(row.cls, 'absent', e.target.value)}
                        placeholder="0"
                        className="w-24 px-2.5 py-1.5 text-center font-mono font-bold text-sm bg-white dark:bg-[#0F1713] border border-rose-300 dark:border-rose-700/80 text-rose-800 dark:text-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                      />
                    </td>

                    {/* Percentage */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-mono font-bold text-sm ${
                          row.percentage >= 75
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : row.percentage >= 60
                            ? 'text-amber-700 dark:text-amber-400'
                            : 'text-rose-700 dark:text-rose-400'
                        }`}
                      >
                        {row.percentage}%
                      </span>
                    </td>

                    {/* Balance / Validation Status */}
                    <td className="py-3.5 px-4 text-center">
                      {row.isBalanced ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3" />
                          <span>{row.presentNum} + {row.absentNum} = {row.registered} (सही)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 animate-pulse">
                          <AlertCircle className="w-3 h-3" />
                          <span>योग: {row.totalEntered} / {row.registered} (असंतुलित)</span>
                        </span>
                      )}
                    </td>

                    {/* Row Action: Fill full present */}
                    <td className="py-3.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleSetClassAllPresent(row.cls)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-md border border-emerald-200 dark:border-emerald-800 transition-colors"
                        title="इस कक्षा के सभी विद्यार्थियों को उपस्थित सेट करें"
                      >
                        पूर्ण उपस्थित
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Total Row */}
              <tfoot>
                <tr className="bg-gray-100 dark:bg-gray-800/80 font-black text-gray-900 dark:text-white border-t-2 border-gray-300 dark:border-gray-700">
                  <td className="py-3.5 px-4 text-sm font-black">
                    कुल योग (Total)
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-sm text-blue-700 dark:text-blue-300">
                    {overallSummary.totalRegistered}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-sm text-emerald-700 dark:text-emerald-300">
                    {overallSummary.totalPresent}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-sm text-rose-700 dark:text-rose-300">
                    {overallSummary.totalAbsent}
                  </td>
                  <td className="py-3.5 px-4 text-center font-mono text-sm text-teal-700 dark:text-teal-300">
                    {overallSummary.percentage}%
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {overallSummary.allBalanced ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                        <span>सभी कक्षाएं संतुलित</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-xs">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>असंतुलित कक्षाएं उपस्थित</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-center text-[10px] text-gray-500 dark:text-gray-400">
                    {availableClasses.length} कक्षाएं
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Bottom Save Bar */}
        <div className="p-4 bg-gray-50 dark:bg-[#0F1713] border-t border-[#DDE7E2] dark:border-[#2B3933] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            {isHoliday ? (
              <span className="text-amber-800 dark:text-amber-300 font-bold flex items-center gap-1.5">
                <Palmtree className="w-4 h-4 text-amber-600" />
                दिनांक {selectedDate} को &quot;{effectiveHolidayReason}&quot; के रूप में सुरक्षित किया जाएगा।
              </span>
            ) : overallSummary.allBalanced ? (
              <span className="text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                सभी कक्षाओं का कुल योग (उपस्थित + अनुपस्थित) पंजीकृत विद्यार्थियों ({overallSummary.totalRegistered}) के पूर्णतः बराबर है।
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                कृपया असंतुलित कक्षाओं में (उपस्थित + अनुपस्थित = कुल पंजीकृत) सुनिश्चित करें।
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              id="btn-save-student-attendance"
              type="button"
              onClick={handleSaveAttendance}
              disabled={isSaving || (!isHoliday && !overallSummary.allBalanced)}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                isHoliday
                  ? 'bg-amber-600 hover:bg-amber-700 text-white cursor-pointer active:scale-95'
                  : overallSummary.allBalanced
                  ? 'bg-[#0B6B4B] hover:bg-[#09573D] text-white cursor-pointer active:scale-95'
                  : 'bg-gray-400 dark:bg-gray-700 text-gray-200 cursor-not-allowed'
              }`}
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>सुरक्षित किया जा रहा है...</span>
                </>
              ) : isHoliday ? (
                <>
                  <Save className="w-4 h-4" />
                  <span>अवकाश सुरक्षित करें</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>उपस्थिति सुरक्षित करें</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
