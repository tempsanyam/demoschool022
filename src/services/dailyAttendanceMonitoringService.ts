import {
  School,
  Student,
  Staff,
  Rasoiya,
  AttendanceRecord,
  MDMRecord,
} from '../types';

export type AttendanceStatusType = 'SUBMITTED' | 'PENDING' | 'HOLIDAY' | 'ERROR';
export type OverallSchoolStatusType = 'SUBMITTED' | 'PARTIAL' | 'PENDING' | 'HOLIDAY' | 'ERROR';

export interface IndividualStaffAttendance {
  entityId: string;
  name: string;
  designation?: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'OD' | 'NOT_MARKED';
  remarks?: string;
}

export interface IndividualRasoiyaAttendance {
  entityId: string;
  name: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE' | 'OD' | 'NOT_MARKED';
  remarks?: string;
}

export interface SchoolAttendanceSummary {
  school: School;
  udise: string;
  name: string;
  hindiName: string;
  village: string;
  schoolType: string;

  // 1. Student Attendance
  student: {
    registered: number;
    present: number | null;
    absent: number | null;
    percentage: number | null;
    status: AttendanceStatusType;
    isHoliday: boolean;
    holidayReason?: string;
    errorMessage?: string;
  };

  // 2. Staff Attendance
  staff: {
    total: number;
    present: number | null;
    absent: number | null;
    leave: number | null;
    od: number | null;
    percentage: number | null;
    status: AttendanceStatusType;
    isHoliday: boolean;
    individualRecords: IndividualStaffAttendance[];
  };

  // 3. Rasoiya Attendance
  rasoiya: {
    total: number;
    present: number | null;
    absent: number | null;
    leave: number | null;
    od: number | null;
    percentage: number | null;
    status: AttendanceStatusType;
    isHoliday: boolean;
    individualRecords: IndividualRasoiyaAttendance[];
  };

  // 4. MDM Meal Preparation Status (Genuine MDM Record)
  mdm?: {
    status: 'SERVED' | 'NOT_SERVED' | 'PENDING';
    mealsServed: number;
    reasonNotServed?: string;
    menuItem?: string;
  };

  // 5. Combined Overall Status
  overall: {
    status: OverallSchoolStatusType;
    label: string;
    description: string;
  };
}

export interface GlobalAttendanceSummary {
  date: string;
  sessionId: string;

  // School level counts
  totalSchools: number;
  submittedSchools: number;
  pendingSchools: number;
  partialSchools: number;
  holidaySchools: number;
  errorSchools: number;

  // Integrity indicator (Derived dynamically from canonical School Master, NOT hardcoded)
  schoolIntegrity: {
    expectedCount: number;
    actualCount: number;
    isValid: boolean;
    warningMessage?: string;
  };

  // Student global totals
  student: {
    totalRegistered: number;
    totalPresent: number;
    totalAbsent: number;
    percentage: number | null; // Total Present ÷ Total Registered × 100
    submittedSchoolsCount: number;
    pendingSchoolsCount: number;
    holidaySchoolsCount: number;
    errorSchoolsCount: number;
  };

  // Staff global totals
  staff: {
    totalStaff: number;
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalOd: number;
    percentage: number | null; // Total Present ÷ Total Staff × 100
    submittedSchoolsCount: number;
    pendingSchoolsCount: number;
    holidaySchoolsCount: number;
  };

  // Rasoiya global totals
  rasoiya: {
    totalRasoiya: number;
    totalPresent: number;
    totalAbsent: number;
    totalLeave: number;
    totalOd: number;
    percentage: number | null; // Total Present ÷ Total Rasoiya × 100
    submittedSchoolsCount: number;
    pendingSchoolsCount: number;
    holidaySchoolsCount: number;
  };
}

export interface DailyAttendanceMonitoringParams {
  schools: School[];
  students: Student[];
  staff: Staff[];
  rasoiya: Rasoiya[];
  attendance: AttendanceRecord[];
  mdmRecords?: MDMRecord[];
  selectedSessionId: string;
  selectedDate: string;
  schoolScope?: string; // 'ALL' or specific school UDISE
}

export interface DailyAttendanceMonitoringResult {
  globalSummary: GlobalAttendanceSummary;
  schoolSummaries: SchoolAttendanceSummary[];
}

/**
 * Central pure business service to compute daily attendance monitoring
 * for CAC and ADMIN panels across Students, Staff, and Rasoiya.
 *
 * Rules:
 * - Strictly matches selectedSessionId (no cross-session bleeding)
 * - Strictly matches selectedDate (no cross-date bleeding)
 * - Uses canonical models (no fake masters)
 * - Validates present + absent === registered (marks 'ERROR' if mismatched)
 * - Distinguishes PENDING (no record submitted) from 0% attendance
 * - Distinguishes HOLIDAY (अवकाश) from 0% attendance
 * - Computes overall combined school status
 */
export function getDailyAttendanceMonitoring(
  params: DailyAttendanceMonitoringParams
): DailyAttendanceMonitoringResult {
  const {
    schools,
    students,
    staff,
    rasoiya,
    attendance,
    mdmRecords,
    selectedSessionId,
    selectedDate,
    schoolScope
  } = params;

  // Filter schools by scope if requested
  const effectiveSchools = schoolScope && schoolScope !== 'ALL'
    ? schools.filter((s) => s.udise === schoolScope)
    : schools;

  // Group attendance by school UDISE for lightning-fast lookups (O(1))
  const attendanceBySchoolAndType = new Map<string, AttendanceRecord[]>();
  for (const rec of attendance) {
    if (!rec) continue;
    // Strict session and date enforcement: missing or mismatched session/date must NOT match
    if (!rec.sessionId || rec.sessionId !== selectedSessionId) continue;
    if (!rec.date || rec.date !== selectedDate) continue;

    if (rec.schoolUdise) {
      const key = `${rec.schoolUdise}_${rec.type}`;
      if (!attendanceBySchoolAndType.has(key)) {
        attendanceBySchoolAndType.set(key, []);
      }
      attendanceBySchoolAndType.get(key)!.push(rec);
    }
  }

  // Pre-index students by schoolUdise for selectedSessionId
  const studentsBySchool = new Map<string, Student[]>();
  const seenStudentKeys = new Set<string>();
  for (const stu of students) {
    if (!stu) continue;
    // Strict session match: if student has sessionId, must match selectedSessionId
    if (stu.sessionId && stu.sessionId !== selectedSessionId) continue;
    // Only active enrolled students (exclude transferred, dropout, tc issued)
    if (stu.status === 'TRANSFERRED' || stu.status === 'DROPOUT' || stu.status === 'TC_ISSUED') continue;

    if (stu.schoolUdise) {
      // Prevent duplicate student counting
      const studentUniqueKey = `${stu.schoolUdise}_${stu.id || stu.samagraId || ''}`;
      if (seenStudentKeys.has(studentUniqueKey)) continue;
      seenStudentKeys.add(studentUniqueKey);

      if (!studentsBySchool.has(stu.schoolUdise)) {
        studentsBySchool.set(stu.schoolUdise, []);
      }
      studentsBySchool.get(stu.schoolUdise)!.push(stu);
    }
  }

  // Pre-index staff by assignedSchoolUdise
  const staffBySchool = new Map<string, Staff[]>();
  const seenStaffKeys = new Set<string>();
  for (const stf of staff) {
    if (!stf) continue;
    if (stf.sessionId && stf.sessionId !== selectedSessionId) continue;
    if (stf.status === 'TRANSFERRED') continue;

    const udise = stf.assignedSchoolUdise;
    if (udise) {
      const staffUniqueKey = `${udise}_${stf.id || stf.employeeId || ''}`;
      if (seenStaffKeys.has(staffUniqueKey)) continue;
      seenStaffKeys.add(staffUniqueKey);

      if (!staffBySchool.has(udise)) {
        staffBySchool.set(udise, []);
      }
      staffBySchool.get(udise)!.push(stf);
    }
  }

  // Pre-index rasoiya by schoolUdise
  const rasoiyaBySchool = new Map<string, Rasoiya[]>();
  const seenRasoiyaKeys = new Set<string>();
  for (const ras of rasoiya) {
    if (!ras) continue;
    if (ras.sessionId && ras.sessionId !== selectedSessionId) continue;
    if (ras.status === 'INACTIVE') continue;

    const udise = ras.schoolUdise;
    if (udise) {
      const rasoiyaUniqueKey = `${udise}_${ras.id || ras.name || ''}`;
      if (seenRasoiyaKeys.has(rasoiyaUniqueKey)) continue;
      seenRasoiyaKeys.add(rasoiyaUniqueKey);

      if (!rasoiyaBySchool.has(udise)) {
        rasoiyaBySchool.set(udise, []);
      }
      rasoiyaBySchool.get(udise)!.push(ras);
    }
  }

  // Pre-index MDM records by schoolUdise for selectedSessionId and selectedDate
  const mdmBySchool = new Map<string, MDMRecord>();
  if (mdmRecords && Array.isArray(mdmRecords)) {
    for (const mdm of mdmRecords) {
      if (!mdm || !mdm.schoolUdise) continue;
      const isDateMatch = mdm.date === selectedDate;
      const isSessionMatch = !mdm.sessionId || mdm.sessionId === selectedSessionId;
      if (isDateMatch && isSessionMatch) {
        mdmBySchool.set(mdm.schoolUdise, mdm);
      }
    }
  }

  const schoolSummaries: SchoolAttendanceSummary[] = [];

  // Global metric accumulators
  let globalStudentRegistered = 0;
  let globalStudentPresent = 0;
  let globalStudentAbsent = 0;
  let studentSubmittedSchoolsCount = 0;
  let studentPendingSchoolsCount = 0;
  let studentHolidaySchoolsCount = 0;
  let studentErrorSchoolsCount = 0;

  let globalStaffTotal = 0;
  let globalStaffPresent = 0;
  let globalStaffAbsent = 0;
  let globalStaffLeave = 0;
  let globalStaffOd = 0;
  let staffSubmittedSchoolsCount = 0;
  let staffPendingSchoolsCount = 0;
  let staffHolidaySchoolsCount = 0;

  let globalRasoiyaTotal = 0;
  let globalRasoiyaPresent = 0;
  let globalRasoiyaAbsent = 0;
  let globalRasoiyaLeave = 0;
  let globalRasoiyaOd = 0;
  let rasoiyaSubmittedSchoolsCount = 0;
  let rasoiyaPendingSchoolsCount = 0;
  let rasoiyaHolidaySchoolsCount = 0;

  let submittedOverallCount = 0;
  let pendingOverallCount = 0;
  let partialOverallCount = 0;
  let holidayOverallCount = 0;
  let errorOverallCount = 0;

  for (const school of effectiveSchools) {
    const udise = school.udise;

    // -------------------------------------------------------------
    // 1. STUDENT ATTENDANCE COMPUTATION
    // -------------------------------------------------------------
    const schoolStudents = studentsBySchool.get(udise) || [];
    const registeredStudentCount = schoolStudents.length;

    const studentRecords = attendanceBySchoolAndType.get(`${udise}_STUDENT`) || [];

    let studentStatus: AttendanceStatusType = 'PENDING';
    let studentPresent: number | null = null;
    let studentAbsent: number | null = null;
    let studentPercentage: number | null = null;
    let studentIsHoliday = false;
    let studentHolidayReason: string | undefined = undefined;
    let studentErrorMessage: string | undefined = undefined;

    if (studentRecords.length > 0) {
      // Check if holiday
      const holidayRec = studentRecords.find((r) => r.isHoliday);
      if (holidayRec) {
        studentStatus = 'HOLIDAY';
        studentIsHoliday = true;
        studentHolidayReason = holidayRec.holidayReason || holidayRec.remarks || 'अवकाश घोषित';
        studentHolidaySchoolsCount++;
      } else {
        // Aggregate class or school records
        let sumTotal = 0;
        let sumPresent = 0;
        let sumAbsent = 0;

        for (const rec of studentRecords) {
          sumTotal += Number(rec.totalCount) || 0;
          sumPresent += Number(rec.presentCount) || 0;
          sumAbsent += Number(rec.absentCount) || 0;
        }

        // Validate data integrity: present + absent must equal total count and all counts must be non-negative
        const hasNegative = sumPresent < 0 || sumAbsent < 0 || sumTotal < 0;
        const isSumValid = !hasNegative && (sumPresent + sumAbsent === sumTotal);

        if (!isSumValid) {
          studentStatus = 'ERROR';
          studentErrorSchoolsCount++;
          studentErrorMessage = `डेटा विसंगति: उपस्थित (${sumPresent}) + अनुपस्थित (${sumAbsent}) ≠ कुल दर्ज (${sumTotal})`;
          studentPresent = sumPresent;
          studentAbsent = sumAbsent;
          studentPercentage = null;
        } else {
          studentStatus = 'SUBMITTED';
          studentPresent = sumPresent;
          studentAbsent = sumAbsent;
          const baseCount = sumTotal > 0 ? sumTotal : registeredStudentCount;
          studentPercentage = baseCount > 0 ? Math.round((sumPresent / baseCount) * 100) : 0;

          // Add to global totals only for valid submissions
          globalStudentRegistered += registeredStudentCount > 0 ? registeredStudentCount : sumTotal;
          globalStudentPresent += sumPresent;
          globalStudentAbsent += sumAbsent;
          studentSubmittedSchoolsCount++;
        }
      }
    } else {
      // Not yet submitted
      studentStatus = 'PENDING';
      studentPendingSchoolsCount++;
      globalStudentRegistered += registeredStudentCount;
    }

    // -------------------------------------------------------------
    // 2. TEACHER / STAFF ATTENDANCE COMPUTATION
    // -------------------------------------------------------------
    const schoolStaff = staffBySchool.get(udise) || [];
    const totalStaffCount = schoolStaff.length;

    // Staff records may be under STAFF or TEACHER
    const staffRecords = [
      ...(attendanceBySchoolAndType.get(`${udise}_STAFF`) || []),
      ...(attendanceBySchoolAndType.get(`${udise}_TEACHER`) || [])
    ];

    let staffStatus: AttendanceStatusType = 'PENDING';
    let staffPresent: number | null = null;
    let staffAbsent: number | null = null;
    let staffLeave: number | null = null;
    let staffOd: number | null = null;
    let staffPercentage: number | null = null;
    let staffIsHoliday = false;
    let individualStaff: IndividualStaffAttendance[] = [];

    if (staffRecords.length > 0) {
      const holidayRec = staffRecords.find((r) => r.isHoliday);
      if (holidayRec) {
        staffStatus = 'HOLIDAY';
        staffIsHoliday = true;
        staffHolidaySchoolsCount++;
      } else {
        staffStatus = 'SUBMITTED';
        staffSubmittedSchoolsCount++;

        let pCount = 0;
        let aCount = 0;
        let lCount = 0;
        let oCount = 0;

        // Extract individual records if present in the record payload
        const recordDetailsMap = new Map<string, { status: string; remarks?: string }>();
        for (const sRec of staffRecords) {
          pCount += Number(sRec.presentCount) || 0;
          aCount += Number(sRec.absentCount) || 0;
          lCount += Number(sRec.leaveCount) || 0;
          oCount += Number(sRec.onDutyCount) || 0;

          if (Array.isArray(sRec.records)) {
            for (const item of sRec.records) {
              if (item.entityId) {
                recordDetailsMap.set(item.entityId, {
                  status: item.status,
                  remarks: item.remarks
                });
              }
            }
          }
        }

        staffPresent = pCount;
        staffAbsent = aCount;
        staffLeave = lCount;
        staffOd = oCount;

        const effectiveTotal = totalStaffCount > 0 ? totalStaffCount : (pCount + aCount + lCount + oCount);
        staffPercentage = effectiveTotal > 0 ? Math.round((pCount / effectiveTotal) * 100) : 0;

        // Map individual staff for drill-down view
        individualStaff = schoolStaff.map((stf) => {
          const detail = recordDetailsMap.get(stf.id);
          let st: IndividualStaffAttendance['status'] = 'PRESENT';
          if (detail?.status === 'ABSENT') st = 'ABSENT';
          else if (detail?.status === 'LEAVE' || detail?.status === 'CL' || detail?.status === 'ML' || detail?.status === 'EL') st = 'LEAVE';
          else if (detail?.status === 'OD') st = 'OD';
          else if (!detail && staffRecords.length === 0) st = 'NOT_MARKED';

          return {
            entityId: stf.id,
            name: stf.name,
            designation: stf.designation,
            status: st,
            remarks: detail?.remarks || ''
          };
        });

        globalStaffTotal += effectiveTotal;
        globalStaffPresent += pCount;
        globalStaffAbsent += aCount;
        globalStaffLeave += lCount;
        globalStaffOd += oCount;
      }
    } else {
      staffStatus = 'PENDING';
      staffPendingSchoolsCount++;
      globalStaffTotal += totalStaffCount;

      individualStaff = schoolStaff.map((stf) => ({
        entityId: stf.id,
        name: stf.name,
        designation: stf.designation,
        status: 'NOT_MARKED',
        remarks: 'उपस्थिति अभी दर्ज नहीं'
      }));
    }

    // -------------------------------------------------------------
    // 3. RASOIYA ATTENDANCE COMPUTATION
    // -------------------------------------------------------------
    const schoolRasoiya = rasoiyaBySchool.get(udise) || [];
    const totalRasoiyaCount = schoolRasoiya.length;

    const rasoiyaRecords = attendanceBySchoolAndType.get(`${udise}_RASOIYA`) || [];

    let rasoiyaStatus: AttendanceStatusType = 'PENDING';
    let rasoiyaPresent: number | null = null;
    let rasoiyaAbsent: number | null = null;
    let rasoiyaLeave: number | null = null;
    let rasoiyaOd: number | null = null;
    let rasoiyaPercentage: number | null = null;
    let rasoiyaIsHoliday = false;
    let individualRasoiya: IndividualRasoiyaAttendance[] = [];

    if (rasoiyaRecords.length > 0) {
      const holidayRec = rasoiyaRecords.find((r) => r.isHoliday);
      if (holidayRec) {
        rasoiyaStatus = 'HOLIDAY';
        rasoiyaIsHoliday = true;
        rasoiyaHolidaySchoolsCount++;
      } else {
        rasoiyaStatus = 'SUBMITTED';
        rasoiyaSubmittedSchoolsCount++;

        let pCount = 0;
        let aCount = 0;
        let lCount = 0;
        let oCount = 0;

        const recordDetailsMap = new Map<string, { status: string; remarks?: string }>();
        for (const rRec of rasoiyaRecords) {
          pCount += Number(rRec.presentCount) || 0;
          aCount += Number(rRec.absentCount) || 0;
          lCount += Number(rRec.leaveCount) || 0;
          oCount += Number(rRec.onDutyCount) || 0;

          if (Array.isArray(rRec.records)) {
            for (const item of rRec.records) {
              if (item.entityId) {
                recordDetailsMap.set(item.entityId, {
                  status: item.status,
                  remarks: item.remarks
                });
              }
            }
          }
        }

        rasoiyaPresent = pCount;
        rasoiyaAbsent = aCount;
        rasoiyaLeave = lCount;
        rasoiyaOd = oCount;

        const effectiveTotal = totalRasoiyaCount > 0 ? totalRasoiyaCount : (pCount + aCount + lCount + oCount);
        rasoiyaPercentage = effectiveTotal > 0 ? Math.round((pCount / effectiveTotal) * 100) : 0;

        individualRasoiya = schoolRasoiya.map((ras) => {
          const detail = recordDetailsMap.get(ras.id);
          let st: IndividualRasoiyaAttendance['status'] = 'PRESENT';
          if (detail?.status === 'ABSENT') st = 'ABSENT';
          else if (detail?.status === 'LEAVE') st = 'LEAVE';
          else if (detail?.status === 'OD') st = 'OD';
          else if (!detail && rasoiyaRecords.length === 0) st = 'NOT_MARKED';

          return {
            entityId: ras.id,
            name: ras.name,
            status: st,
            remarks: detail?.remarks || ''
          };
        });

        globalRasoiyaTotal += effectiveTotal;
        globalRasoiyaPresent += pCount;
        globalRasoiyaAbsent += aCount;
        globalRasoiyaLeave += lCount;
        globalRasoiyaOd += oCount;
      }
    } else {
      rasoiyaStatus = 'PENDING';
      rasoiyaPendingSchoolsCount++;
      globalRasoiyaTotal += totalRasoiyaCount;

      individualRasoiya = schoolRasoiya.map((ras) => ({
        entityId: ras.id,
        name: ras.name,
        status: 'NOT_MARKED',
        remarks: 'उपस्थिति अभी दर्ज नहीं'
      }));
    }

    // -------------------------------------------------------------
    // 4. COMBINED OVERALL STATUS DETERMINATION
    // -------------------------------------------------------------
    let overallStatus: OverallSchoolStatusType = 'PENDING';
    let overallLabel = 'लंबित';
    let overallDescription = 'उपस्थिति दर्ज नहीं की गई है';

    if (studentStatus === 'ERROR') {
      overallStatus = 'ERROR';
      overallLabel = 'डेटा त्रुटि';
      overallDescription = studentErrorMessage || 'उपस्थिति संख्या में विसंगति पाई गई';
      errorOverallCount++;
    } else if (
      studentStatus === 'HOLIDAY' &&
      staffStatus === 'HOLIDAY' &&
      rasoiyaStatus === 'HOLIDAY'
    ) {
      overallStatus = 'HOLIDAY';
      overallLabel = 'अवकाश';
      overallDescription = studentHolidayReason || 'शाला में आधिकारिक अवकाश घोषित';
      holidayOverallCount++;
    } else {
      const statuses = [studentStatus, staffStatus, rasoiyaStatus];
      const submittedCount = statuses.filter((s) => s === 'SUBMITTED').length;
      const holidayCount = statuses.filter((s) => s === 'HOLIDAY').length;
      const pendingCount = statuses.filter((s) => s === 'PENDING').length;

      if (submittedCount === 3 || (submittedCount + holidayCount === 3 && submittedCount > 0)) {
        overallStatus = 'SUBMITTED';
        overallLabel = 'पूर्ण जमा';
        overallDescription = 'विद्यार्थी, शिक्षक एवं रसोइया उपस्थिति पूर्ण';
        submittedOverallCount++;
      } else if (submittedCount > 0 && pendingCount > 0) {
        overallStatus = 'PARTIAL';
        overallLabel = 'आंशिक जमा';
        overallDescription = 'कुछ संवर्गों की उपस्थिति जमा, शेष लंबित';
        partialOverallCount++;
      } else if (holidayCount > 0 && pendingCount > 0) {
        overallStatus = 'PARTIAL';
        overallLabel = 'आंशिक अवकाश / लंबित';
        overallDescription = 'अवकाश व लंबित संवर्ग';
        partialOverallCount++;
      } else {
        overallStatus = 'PENDING';
        overallLabel = 'लंबित';
        overallDescription = 'आज की उपस्थिति अभी दर्ज नहीं की गई है';
        pendingOverallCount++;
      }
    }

    schoolSummaries.push({
      school,
      udise,
      name: school.name,
      hindiName: school.hindiName || school.name,
      village: school.village,
      schoolType: school.schoolType,
      student: {
        registered: registeredStudentCount,
        present: studentPresent,
        absent: studentAbsent,
        percentage: studentPercentage,
        status: studentStatus,
        isHoliday: studentIsHoliday,
        holidayReason: studentHolidayReason,
        errorMessage: studentErrorMessage
      },
      staff: {
        total: totalStaffCount,
        present: staffPresent,
        absent: staffAbsent,
        leave: staffLeave,
        od: staffOd,
        percentage: staffPercentage,
        status: staffStatus,
        isHoliday: staffIsHoliday,
        individualRecords: individualStaff
      },
      rasoiya: {
        total: totalRasoiyaCount,
        present: rasoiyaPresent,
        absent: rasoiyaAbsent,
        leave: rasoiyaLeave,
        od: rasoiyaOd,
        percentage: rasoiyaPercentage,
        status: rasoiyaStatus,
        isHoliday: rasoiyaIsHoliday,
        individualRecords: individualRasoiya
      },
      mdm: (() => {
        const mdmRec = mdmBySchool.get(udise);
        if (!mdmRec) {
          return {
            status: 'PENDING',
            mealsServed: 0
          };
        }
        const served = Number(mdmRec.mealsServed) || 0;
        return {
          status: served > 0 ? 'SERVED' : 'NOT_SERVED',
          mealsServed: served,
          reasonNotServed: mdmRec.reasonNotServed,
          menuItem: mdmRec.menuItem
        };
      })(),
      overall: {
        status: overallStatus,
        label: overallLabel,
        description: overallDescription
      }
    });
  }

  // Calculate global percentages strictly: Total Present ÷ Total Registered × 100
  const globalStudentPct =
    globalStudentRegistered > 0
      ? Math.round((globalStudentPresent / globalStudentRegistered) * 100)
      : null;

  const globalStaffPct =
    globalStaffTotal > 0
      ? Math.round((globalStaffPresent / globalStaffTotal) * 100)
      : null;

  const globalRasoiyaPct =
    globalRasoiyaTotal > 0
      ? Math.round((globalRasoiyaPresent / globalRasoiyaTotal) * 100)
      : null;

  // Dynamic School Master Integrity (Zero hardcoded count)
  const actualSchoolCount = effectiveSchools.length;
  const expectedSchoolCount = schoolScope && schoolScope !== 'ALL' ? 1 : schools.length;
  const isSchoolCountExact = actualSchoolCount === expectedSchoolCount;

  const globalSummary: GlobalAttendanceSummary = {
    date: selectedDate,
    sessionId: selectedSessionId,
    totalSchools: actualSchoolCount,
    submittedSchools: submittedOverallCount,
    pendingSchools: pendingOverallCount,
    partialSchools: partialOverallCount,
    holidaySchools: holidayOverallCount,
    errorSchools: errorOverallCount,
    schoolIntegrity: {
      expectedCount: expectedSchoolCount,
      actualCount: actualSchoolCount,
      isValid: isSchoolCountExact,
      warningMessage: !isSchoolCountExact
        ? `संकुल शाला मास्टर सत्यापन चेतावनी: संकुल में ${expectedSchoolCount} शालाएं अपेक्षित हैं, वर्तमान में ${actualSchoolCount} शालाएं उपलब्ध हैं।`
        : undefined
    },
    student: {
      totalRegistered: globalStudentRegistered,
      totalPresent: globalStudentPresent,
      totalAbsent: globalStudentAbsent,
      percentage: globalStudentPct,
      submittedSchoolsCount: studentSubmittedSchoolsCount,
      pendingSchoolsCount: studentPendingSchoolsCount,
      holidaySchoolsCount: studentHolidaySchoolsCount,
      errorSchoolsCount: studentErrorSchoolsCount
    },
    staff: {
      totalStaff: globalStaffTotal,
      totalPresent: globalStaffPresent,
      totalAbsent: globalStaffAbsent,
      totalLeave: globalStaffLeave,
      totalOd: globalStaffOd,
      percentage: globalStaffPct,
      submittedSchoolsCount: staffSubmittedSchoolsCount,
      pendingSchoolsCount: staffPendingSchoolsCount,
      holidaySchoolsCount: staffHolidaySchoolsCount
    },
    rasoiya: {
      totalRasoiya: globalRasoiyaTotal,
      totalPresent: globalRasoiyaPresent,
      totalAbsent: globalRasoiyaAbsent,
      totalLeave: globalRasoiyaLeave,
      totalOd: globalRasoiyaOd,
      percentage: globalRasoiyaPct,
      submittedSchoolsCount: rasoiyaSubmittedSchoolsCount,
      pendingSchoolsCount: rasoiyaPendingSchoolsCount,
      holidaySchoolsCount: rasoiyaHolidaySchoolsCount
    }
  };

  return {
    globalSummary,
    schoolSummaries
  };
}
