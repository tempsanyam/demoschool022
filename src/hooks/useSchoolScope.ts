import { useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getSessionForDate, composeStudentsForSession, composeStaffForSession } from '../utils/sessionManager';
import {
  School,
  Student,
  Staff,
  PhysicalFacility,
  AttendanceRecord,
  MDMRecord,
  GovernmentWork,
  Complaint,
  DocumentItem,
  Rasoiya,
  SHG
} from '../types';

export interface UseSchoolScopeOptions {
  schoolUdise?: string;
  strict?: boolean;
}

/**
 * Centralized Hook for Enforcing School Scope & Access Security
 * 
 * Guarantees that:
 * 1. For SCHOOL/PRINCIPAL/TEACHER users, all data queries (students, staff, attendance, MDM, etc.)
 *    are strictly locked to the user's assigned school UDISE.
 * 2. Any attempt from UI components to request or manipulate records of another UDISE
 *    is intercepted, sanitized to the authorized scope, and server-side assertion errors are simulated.
 * 3. For ADMIN/CAC users, allows switching school scopes while still providing scoped queries and helpers.
 */
export const useSchoolScope = (options?: UseSchoolScopeOptions) => {
  const { currentUser } = useAuth();
  const dataContext = useData();
  const { isCurrentSessionSelected, selectedSessionId, activeSessionId } = dataContext;

  const isSchoolUser = currentUser?.role === 'SCHOOL';

  const isRestricted = isSchoolUser;
  const canAccessAllSchools = currentUser?.role === 'ADMIN' || currentUser?.role === 'CAC';
  const userAssignedUdise = (currentUser?.assignedSchoolUdise || '').trim();

  // Determine effective UDISE with strict restriction precedence
  const effectiveUdise = useMemo(() => {
    if (isSchoolUser) {
      // If UI explicitly requested a different UDISE, reject / sanitize it
      if (options?.schoolUdise && options.schoolUdise.trim() !== userAssignedUdise) {
        console.warn(
          `[useSchoolScope] Intercepted unauthorized scope request for UDISE '${options.schoolUdise}'. Forcing user's assigned UDISE '${userAssignedUdise}'.`
        );
        if (options.strict) {
          dataContext.assertSchoolAccess(options.schoolUdise, 'useSchoolScope:strictInit');
        }
      }
      return userAssignedUdise;
    }

    return (options?.schoolUdise || dataContext.selectedSchoolUdise || '').trim();
  }, [isSchoolUser, userAssignedUdise, options?.schoolUdise, options?.strict, dataContext]);

  // Current active School record
  const currentSchool = useMemo(() => {
    if (!effectiveUdise) return undefined;
    return dataContext.schools.find((s) => s.udise === effectiveUdise);
  }, [dataContext.schools, effectiveUdise]);

  // Visible Schools list (Strictly isolated: School users ONLY see their 1 school; CAC/Admin see active non-deactivated schools)
  const schools = useMemo(() => {
    if (isSchoolUser) {
      return currentSchool && !currentSchool.isDeleted && currentSchool.status === 'ACTIVE'
        ? [currentSchool]
        : dataContext.schools.filter((s) => s.udise === userAssignedUdise && !s.isDeleted && s.status === 'ACTIVE');
    }
    return dataContext.schools.filter((s) => !s.isDeleted && s.status === 'ACTIVE');
  }, [isSchoolUser, currentSchool, dataContext.schools, userAssignedUdise]);

  // ==========================================
  // SCOPED DATA COLLECTIONS (STRICT ISOLATION)
  // ==========================================

  const students = useMemo(() => {
    // Direct session composition ensures students strictly match dataContext.selectedSessionId
    if (dataContext.studentMasters && dataContext.studentAcademicRecords) {
      const composed = composeStudentsForSession(
        dataContext.studentMasters,
        dataContext.studentAcademicRecords,
        dataContext.selectedSessionId
      );
      if (!effectiveUdise) {
        return isSchoolUser ? composed.filter((s) => s.schoolUdise === userAssignedUdise) : composed;
      }
      return composed.filter((s) => s.schoolUdise === effectiveUdise);
    }
    if (!effectiveUdise) {
      return isSchoolUser
        ? dataContext.students.filter((s) => s.schoolUdise === userAssignedUdise)
        : dataContext.scopedStudents;
    }
    return dataContext.students.filter((s) => s.schoolUdise === effectiveUdise);
  }, [dataContext.studentMasters, dataContext.studentAcademicRecords, dataContext.selectedSessionId, dataContext.students, dataContext.scopedStudents, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const staff = useMemo(() => {
    // Direct session composition ensures staff strictly match dataContext.selectedSessionId
    if (dataContext.staffMasters && dataContext.staffPostings) {
      const composed = composeStaffForSession(
        dataContext.staffMasters,
        dataContext.staffPostings,
        dataContext.selectedSessionId
      );
      if (!effectiveUdise) {
        return isSchoolUser ? composed.filter((s) => s.assignedSchoolUdise === userAssignedUdise) : composed;
      }
      return composed.filter((s) => s.assignedSchoolUdise === effectiveUdise);
    }
    if (!effectiveUdise) {
      return isSchoolUser
        ? dataContext.staff.filter((s) => s.assignedSchoolUdise === userAssignedUdise)
        : dataContext.scopedStaff;
    }
    return dataContext.staff.filter((s) => s.assignedSchoolUdise === effectiveUdise);
  }, [dataContext.staffMasters, dataContext.staffPostings, dataContext.selectedSessionId, dataContext.staff, dataContext.scopedStaff, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const attendance = useMemo(() => {
    const raw = !effectiveUdise
      ? (isSchoolUser ? dataContext.attendance.filter((a) => a.schoolUdise === userAssignedUdise) : dataContext.scopedAttendance)
      : dataContext.attendance.filter((a) => a.schoolUdise === effectiveUdise);
    return raw.filter((a) => (a.sessionId || getSessionForDate(a.date)) === dataContext.selectedSessionId);
  }, [dataContext.attendance, dataContext.scopedAttendance, dataContext.selectedSessionId, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const mdmRecords = useMemo(() => {
    const raw = !effectiveUdise
      ? (isSchoolUser ? dataContext.mdmRecords.filter((m) => m.schoolUdise === userAssignedUdise) : dataContext.scopedMDM)
      : dataContext.mdmRecords.filter((m) => m.schoolUdise === effectiveUdise);
    return raw.filter((m) => (m.sessionId || getSessionForDate(m.date)) === dataContext.selectedSessionId);
  }, [dataContext.mdmRecords, dataContext.scopedMDM, dataContext.selectedSessionId, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const facilities = useMemo(() => {
    const raw = !effectiveUdise
      ? (isSchoolUser ? dataContext.facilities.filter((f) => f.schoolUdise === userAssignedUdise) : dataContext.scopedFacilities)
      : dataContext.facilities.filter((f) => f.schoolUdise === effectiveUdise);
    return raw.filter((f) => !f.sessionId || f.sessionId === dataContext.selectedSessionId);
  }, [dataContext.facilities, dataContext.scopedFacilities, dataContext.selectedSessionId, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const governmentWork = useMemo(() => {
    const raw = !effectiveUdise
      ? (isSchoolUser ? dataContext.governmentWork.filter((w) => w.schoolUdise === userAssignedUdise) : dataContext.scopedWork)
      : dataContext.governmentWork.filter((w) => w.schoolUdise === effectiveUdise);
    return raw.filter((w) => (w.sessionId || (w.assignedDate ? getSessionForDate(w.assignedDate) : '')) === dataContext.selectedSessionId);
  }, [dataContext.governmentWork, dataContext.scopedWork, dataContext.selectedSessionId, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const complaints = useMemo(() => {
    const raw = !effectiveUdise
      ? (isSchoolUser ? dataContext.complaints.filter((c) => c.schoolUdise === userAssignedUdise) : dataContext.scopedComplaints)
      : dataContext.complaints.filter((c) => c.schoolUdise === effectiveUdise);
    return raw.filter((c) => ((c as any).sessionId || (c.date ? getSessionForDate(c.date) : '')) === dataContext.selectedSessionId);
  }, [dataContext.complaints, dataContext.scopedComplaints, dataContext.selectedSessionId, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const documents = useMemo(() => {
    const raw = !effectiveUdise
      ? (isSchoolUser ? dataContext.documents.filter((d) => d.schoolUdise === userAssignedUdise || d.schoolUdise === 'ALL') : dataContext.scopedDocuments)
      : dataContext.documents.filter((d) => d.schoolUdise === effectiveUdise || d.schoolUdise === 'ALL');
    return raw.filter((d) => ((d as any).sessionId || (d.date ? getSessionForDate(d.date) : '')) === dataContext.selectedSessionId);
  }, [dataContext.documents, dataContext.scopedDocuments, dataContext.selectedSessionId, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const rasoiya = useMemo(() => {
    if (!effectiveUdise) {
      return isSchoolUser
        ? dataContext.rasoiya.filter((r) => r.schoolUdise === userAssignedUdise)
        : dataContext.scopedRasoiya;
    }
    return dataContext.rasoiya.filter((r) => r.schoolUdise === effectiveUdise);
  }, [dataContext.rasoiya, dataContext.scopedRasoiya, effectiveUdise, isSchoolUser, userAssignedUdise]);

  const shgs = useMemo(() => {
    const raw = !effectiveUdise
      ? (isSchoolUser ? dataContext.shgs.filter((s) => s.schoolUdise === userAssignedUdise) : dataContext.scopedSHGs)
      : dataContext.shgs.filter((s) => s.schoolUdise === effectiveUdise);
    return raw.filter((s) => !s.sessionId || s.sessionId === dataContext.selectedSessionId);
  }, [dataContext.shgs, dataContext.scopedSHGs, dataContext.selectedSessionId, effectiveUdise, isSchoolUser, userAssignedUdise]);

  // ==========================================
  // SAFE DATA FETCHING & QUERY OPERATIONS
  // ==========================================

  const fetchStudents = useCallback(
    (targetUdise?: string): Student[] => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      if (isSchoolUser && targetUdise && targetUdise !== userAssignedUdise) {
        dataContext.assertSchoolAccess(targetUdise, 'useSchoolScope:fetchStudents');
      }
      return dataContext.fetchStudents(sanitizedUdise);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const fetchStaff = useCallback(
    (targetUdise?: string): Staff[] => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      if (isSchoolUser && targetUdise && targetUdise !== userAssignedUdise) {
        dataContext.assertSchoolAccess(targetUdise, 'useSchoolScope:fetchStaff');
      }
      return dataContext.fetchStaff(sanitizedUdise);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const fetchAttendance = useCallback(
    (
      filters?: { date?: string; type?: string; class?: string },
      targetUdise?: string
    ): AttendanceRecord[] => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      if (isSchoolUser && targetUdise && targetUdise !== userAssignedUdise) {
        dataContext.assertSchoolAccess(targetUdise, 'useSchoolScope:fetchAttendance');
      }
      return dataContext.fetchAttendance(sanitizedUdise, filters);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const fetchMDM = useCallback(
    (
      filters?: { date?: string },
      targetUdise?: string
    ): MDMRecord[] => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      if (isSchoolUser && targetUdise && targetUdise !== userAssignedUdise) {
        dataContext.assertSchoolAccess(targetUdise, 'useSchoolScope:fetchMDM');
      }
      return dataContext.fetchMDM(sanitizedUdise, filters);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const fetchFacilities = useCallback(
    (targetUdise?: string): PhysicalFacility[] => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      if (isSchoolUser && targetUdise && targetUdise !== userAssignedUdise) {
        dataContext.assertSchoolAccess(targetUdise, 'useSchoolScope:fetchFacilities');
      }
      return dataContext.fetchFacilities(sanitizedUdise);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const fetchGovernmentWork = useCallback(
    (targetUdise?: string): GovernmentWork[] => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      if (isSchoolUser && targetUdise && targetUdise !== userAssignedUdise) {
        dataContext.assertSchoolAccess(targetUdise, 'useSchoolScope:fetchGovernmentWork');
      }
      return dataContext.fetchGovernmentWork(sanitizedUdise);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const fetchComplaints = useCallback(
    (targetUdise?: string): Complaint[] => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      if (isSchoolUser && targetUdise && targetUdise !== userAssignedUdise) {
        dataContext.assertSchoolAccess(targetUdise, 'useSchoolScope:fetchComplaints');
      }
      return dataContext.fetchComplaints(sanitizedUdise);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const fetchSchool = useCallback(
    (targetUdise?: string): School | undefined => {
      const sanitizedUdise = isSchoolUser ? userAssignedUdise : (targetUdise || effectiveUdise);
      return dataContext.fetchSchool(sanitizedUdise);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  // ==========================================
  // SCOPED CRUD MUTATORS (STAMPED WITH UDISE)
  // ==========================================

  const addStudent = useCallback(
    (studentData: Omit<Student, 'id'>) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (studentData.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'addStudent');
      dataContext.addStudent({ ...studentData, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const updateStudent = useCallback(
    (student: Student) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : student.schoolUdise;
      dataContext.assertSchoolAccess(targetUdise, 'updateStudent');
      dataContext.updateStudent({ ...student, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, dataContext]
  );

  const deleteStudent = useCallback(
    (id: string) => {
      const target = dataContext.students.find((s) => s.id === id);
      if (target) {
        dataContext.assertSchoolAccess(target.schoolUdise, 'deleteStudent');
      }
      dataContext.deleteStudent(id);
    },
    [dataContext]
  );

  const addStaff = useCallback(
    (staffData: Omit<Staff, 'id'>) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (staffData.assignedSchoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'addStaff');
      dataContext.addStaff({ ...staffData, assignedSchoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const updateStaff = useCallback(
    (stf: Staff) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : stf.assignedSchoolUdise;
      dataContext.assertSchoolAccess(targetUdise, 'updateStaff');
      dataContext.updateStaff({ ...stf, assignedSchoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, dataContext]
  );

  const deleteStaff = useCallback(
    (id: string) => {
      const target = dataContext.staff.find((s) => s.id === id);
      if (target) {
        dataContext.assertSchoolAccess(target.assignedSchoolUdise, 'deleteStaff');
      }
      dataContext.deleteStaff(id);
    },
    [dataContext]
  );

  const addRasoiya = useCallback(
    (data: Omit<Rasoiya, 'id'>) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (data.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'addRasoiya');
      return dataContext.addRasoiya({ ...data, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const updateRasoiya = useCallback(
    (data: Rasoiya) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : data.schoolUdise;
      dataContext.assertSchoolAccess(targetUdise, 'updateRasoiya');
      dataContext.updateRasoiya({ ...data, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, dataContext]
  );

  const deleteRasoiya = useCallback(
    (id: string) => {
      const target = dataContext.rasoiya.find((r) => r.id === id);
      if (target) {
        dataContext.assertSchoolAccess(target.schoolUdise, 'deleteRasoiya');
      }
      dataContext.deleteRasoiya(id);
    },
    [dataContext]
  );

  const addSHG = useCallback(
    (data: Omit<SHG, 'id'>) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (data.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'addSHG');
      return dataContext.addSHG({ ...data, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const updateSHG = useCallback(
    (data: SHG) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : data.schoolUdise;
      dataContext.assertSchoolAccess(targetUdise, 'updateSHG');
      dataContext.updateSHG({ ...data, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, dataContext]
  );

  const deleteSHG = useCallback(
    (id: string) => {
      const target = dataContext.shgs.find((s) => s.id === id);
      if (target) {
        dataContext.assertSchoolAccess(target.schoolUdise, 'deleteSHG');
      }
      dataContext.deleteSHG(id);
    },
    [dataContext]
  );

  const markAttendance = useCallback(
    (record: Omit<AttendanceRecord, 'id' | 'markedAt'>) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (record.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'markAttendance');
      dataContext.markAttendance({ ...record, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const markAttendanceBatch = useCallback(
    (records: Omit<AttendanceRecord, 'id' | 'markedAt'>[]) => {
      const sanitized = records.map((record) => {
        const targetUdise = isSchoolUser ? userAssignedUdise : (record.schoolUdise || effectiveUdise || userAssignedUdise);
        dataContext.assertSchoolAccess(targetUdise, 'markAttendanceBatch');
        return { ...record, schoolUdise: targetUdise };
      });
      dataContext.markAttendanceBatch(sanitized);
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const saveMDMRecord = useCallback(
    (record: Omit<MDMRecord, 'id'> & { id?: string }) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (record.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'saveMDMRecord');
      dataContext.saveMDMRecord({ ...record, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const deleteMDMRecord = useCallback(
    (id: string) => {
      dataContext.deleteMDMRecord(id);
    },
    [dataContext]
  );

  const updateFacility = useCallback(
    (facility: PhysicalFacility) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (facility.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'updateFacility');
      dataContext.updateFacility({ ...facility, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const addGovernmentWork = useCallback(
    (work: Omit<GovernmentWork, 'id'>) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (work.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'addGovernmentWork');
      dataContext.addGovernmentWork({ ...work, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const updateGovernmentWork = useCallback(
    (work: GovernmentWork) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (work.schoolUdise || effectiveUdise);
      dataContext.assertSchoolAccess(targetUdise, 'updateGovernmentWork');
      dataContext.updateGovernmentWork({ ...work, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const deleteGovernmentWork = useCallback(
    (id: string) => {
      const target = dataContext.governmentWork.find((w) => w.id === id);
      if (target) {
        dataContext.assertSchoolAccess(target.schoolUdise, 'deleteGovernmentWork');
      }
      dataContext.deleteGovernmentWork(id);
    },
    [dataContext]
  );

  const addComplaint = useCallback(
    (complaint: Omit<Complaint, 'id' | 'complaintId'>) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (complaint.schoolUdise || effectiveUdise || userAssignedUdise);
      dataContext.assertSchoolAccess(targetUdise, 'addComplaint');
      dataContext.addComplaint({ ...complaint, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  const updateComplaint = useCallback(
    (complaint: Complaint) => {
      const targetUdise = isSchoolUser ? userAssignedUdise : (complaint.schoolUdise || effectiveUdise);
      dataContext.assertSchoolAccess(targetUdise, 'updateComplaint');
      dataContext.updateComplaint({ ...complaint, schoolUdise: targetUdise });
    },
    [isSchoolUser, userAssignedUdise, effectiveUdise, dataContext]
  );

  // Security Verification Helpers
  const canAccessSchool = useCallback(
    (udise: string) => {
      return dataContext.verifySchoolAccess(udise);
    },
    [dataContext]
  );

  const assertSchoolAccess = useCallback(
    (udise?: string, opName?: string) => {
      dataContext.assertSchoolAccess(udise, opName);
    },
    [dataContext]
  );

  // ==========================================
  // REAL-TIME SCOPED CALCULATIONS & METRICS
  // ==========================================

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const scopedStats = useMemo(() => {
    const totalSchools = schools.length;
    const activeSchools = schools.filter((s) => !s.isDeleted && s.status === 'ACTIVE').length;
    const inactiveSchools = dataContext.inactiveSchools ? dataContext.inactiveSchools.length : 0;

    // Active students for this session (excluding those who have been promoted or transferred)
    const activeStudents = students.filter((s) => s.status === 'ACTIVE' || !s.status);
    const promotedStudents = students.filter((s) => s.status === 'PROMOTED');
    const totalStudents = activeStudents.length;
    const totalAllEnrolled = students.length;
    const promotedCount = promotedStudents.length;

    const boys = activeStudents.filter((s) => s.gender === 'बालक').length;
    const girls = activeStudents.filter((s) => s.gender === 'बालिका').length;
    const otherGender = activeStudents.filter((s) => s.gender === 'अन्य').length;

    const sc = activeStudents.filter((s) => s.category === 'SC').length;
    const st = activeStudents.filter((s) => s.category === 'ST').length;
    const obc = activeStudents.filter((s) => s.category === 'OBC').length;
    const general = activeStudents.filter((s) => s.category === 'GENERAL').length;
    const cwsn = activeStudents.filter((s) => s.isCwsn).length;

    const totalStaff = staff.length;
    const principals = staff.filter(
      (s) => s.designation === 'प्रधानाध्यापक' || s.designation === 'प्राचार्य'
    ).length;
    const teachers = staff.filter((s) => s.designation.includes('शिक्षक')).length;
    const rasoiya = staff.filter((s) => s.designation === 'रसोइया').length;
    const otherStaff = totalStaff - (principals + teachers + rasoiya);
    const activeStaff = staff.filter((s) => s.status === 'ACTIVE').length;

    // Real Attendance calculations for today
    const todayStudentAtt = attendance.filter(
      (a) => a.type === 'STUDENT' && a.date === todayStr
    );
    const todayAttendanceRecorded = todayStudentAtt.length > 0;
    let todayPresentStudents = 0;
    let todayTotalMarkedStudents = 0;

    todayStudentAtt.forEach((rec) => {
      todayPresentStudents += rec.presentCount;
      todayTotalMarkedStudents += rec.totalCount;
    });

    const todayAttendancePct =
      todayTotalMarkedStudents > 0
        ? Math.round((todayPresentStudents / todayTotalMarkedStudents) * 100)
        : 0;

    // Session-wide Attendance calculations (for historical/multi-year session views)
    const sessionStudentAtt = attendance.filter((a) => a.type === 'STUDENT');
    let sessionPresentTotal = 0;
    let sessionMarkedTotal = 0;
    sessionStudentAtt.forEach((rec) => {
      sessionPresentTotal += rec.presentCount;
      sessionMarkedTotal += rec.totalCount;
    });
    const sessionAttendancePct =
      sessionMarkedTotal > 0
        ? Math.round((sessionPresentTotal / sessionMarkedTotal) * 100)
        : 0;

    // Staff Attendance
    const todayStaffAtt = attendance.filter(
      (a) => a.type === 'STAFF' && a.date === todayStr
    );
    let staffPresentCount = 0;
    let staffTotalCount = 0;
    todayStaffAtt.forEach((rec) => {
      staffPresentCount += rec.presentCount;
      staffTotalCount += rec.totalCount;
    });
    const staffAttendancePct =
      staffTotalCount > 0 ? Math.round((staffPresentCount / staffTotalCount) * 100) : 0;

    // Real MDM records for today
    const todayMdm = mdmRecords.filter((m) => m.date === todayStr);
    const mdmRecordedToday = todayMdm.length > 0;
    let mdmServedCount = 0;
    let mdmEligibleCount = 0;
    let mdmMenuToday = '';

    todayMdm.forEach((m) => {
      mdmServedCount += m.mealsServed;
      mdmEligibleCount += m.eligibleStudents;
      if (m.menuItem) mdmMenuToday = m.menuItem;
    });

    // Session-wide MDM calculations
    let sessionMdmServedTotal = 0;
    let sessionMdmEligibleTotal = 0;
    mdmRecords.forEach((m) => {
      sessionMdmServedTotal += m.mealsServed;
      sessionMdmEligibleTotal += m.eligibleStudents;
    });

    const mdmStatusLabel = mdmRecordedToday
      ? mdmServedCount > 0
        ? 'वितरित (सत्यापित)'
        : 'शून्य वितरण दर्ज'
      : 'प्रविष्टि शेष';

    // Real Government Work counts
    const totalGovernmentWork = governmentWork.length;
    const pendingWorkCount = governmentWork.filter((w) => w.status === 'PENDING').length;
    const inProgressWorkCount = governmentWork.filter((w) => w.status === 'IN_PROGRESS').length;
    const completedWorkCount = governmentWork.filter((w) => w.status === 'COMPLETED').length;
    const overdueWorkCount = governmentWork.filter((w) => w.status === 'OVERDUE').length;

    // Real Complaints counts
    const totalComplaints = complaints.length;
    const pendingComplaints = complaints.filter(
      (c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS'
    ).length;
    const resolvedComplaints = complaints.filter((c) => c.status === 'RESOLVED').length;
    const rejectedComplaints = complaints.filter((c) => c.status === 'REJECTED').length;

    // Real Facilities counts
    const totalFacilities = facilities.length;
    const availableFacilities = facilities.filter((f) => f.available === 'YES').length;
    const criticalNeedFacilities = facilities.filter(
      (f) => f.available === 'NO' || f.condition === 'POOR' || f.condition === 'CRITICAL'
    ).length;
    const facilityCompletenessPct =
      totalFacilities > 0 ? Math.round((availableFacilities / totalFacilities) * 100) : 0;

    // Real Documents counts
    const totalDocuments = documents.length;

    // Notifications counts
    const unreadNotificationsCount = dataContext.notifications.filter(
      (n) => !n.isRead && (n.targetSchoolUdise === 'ALL' || n.targetSchoolUdise === effectiveUdise)
    ).length;

    return {
      totalSchools,
      activeSchools,
      inactiveSchools,
      totalStudents,
      totalAllEnrolled,
      promotedCount,
      boys,
      girls,
      otherGender,
      sc,
      st,
      obc,
      general,
      cwsn,
      totalStaff,
      principals,
      teachers,
      rasoiya,
      otherStaff,
      activeStaff,
      todayDate: todayStr,
      todayAttendanceRecorded,
      todayAttendancePct,
      todayPresentStudents,
      todayTotalMarkedStudents,
      sessionAttendancePct,
      sessionPresentTotal,
      sessionMarkedTotal,
      sessionStudentAttCount: sessionStudentAtt.length,
      staffAttendancePct,
      staffPresentCount,
      staffTotalCount,
      mdmRecordedToday,
      mdmServedCount,
      mdmEligibleCount,
      mdmStatusLabel,
      mdmMenuToday,
      sessionMdmServedTotal,
      sessionMdmEligibleTotal,
      sessionMdmCount: mdmRecords.length,
      totalGovernmentWork,
      pendingWorkCount,
      inProgressWorkCount,
      completedWorkCount,
      overdueWorkCount,
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      rejectedComplaints,
      totalFacilities,
      availableFacilities,
      criticalNeedFacilities,
      facilityCompletenessPct,
      totalDocuments,
      unreadNotificationsCount,
    };
  }, [
    schools,
    students,
    staff,
    attendance,
    mdmRecords,
    governmentWork,
    complaints,
    facilities,
    documents,
    dataContext.notifications,
    todayStr,
    effectiveUdise,
  ]);

  // ==========================================
  // DYNAMIC DATA COMPLETENESS CALCULATION
  // ==========================================

  const dataCompleteness = useMemo(() => {
    const pillars = [
      {
        id: 'profile',
        name: 'शाला प्रोफ़ाइल व UDISE सत्यापन',
        isComplete: Boolean(currentSchool?.principalName && currentSchool?.principalMobile && currentSchool?.schoolType),
        details: currentSchool?.principalName ? `प्र.अ. ${currentSchool.principalName}` : 'प्रधानाध्यापक विवरण अपूर्ण',
        scorePct: currentSchool?.principalName ? 100 : 0,
        route: 'profile',
      },
      {
        id: 'students',
        name: 'विद्यार्थी समग्र व छात्रवृत्ति नामांकन',
        isComplete: scopedStats.totalStudents > 0 && students.filter((s) => s.status === 'ACTIVE' || !s.status).every((s) => s.samagraId && s.category),
        details: scopedStats.totalStudents > 0 ? `${scopedStats.totalStudents} छात्र नामांकित` : 'कोई विद्यार्थी दर्ज नहीं',
        scorePct: scopedStats.totalStudents > 0 ? 100 : 0,
        route: 'students',
      },
      {
        id: 'staff',
        name: 'शैक्षणिक व गैर-शैक्षणिक स्टाफ मैपिंग',
        isComplete: staff.length > 0,
        details: staff.length > 0 ? `${staff.length} स्टाफ पदस्थ` : 'स्टाफ सूची रिक्त',
        scorePct: staff.length > 0 ? 100 : 0,
        route: 'teachers',
      },
      {
        id: 'facilities',
        name: 'भौतिक अधोसंरचना (पेयजल/विद्युत/शौचालय)',
        isComplete: facilities.length > 0 && !facilities.some((f) => f.available === 'UNKNOWN'),
        details: facilities.length > 0 ? `${facilities.filter((f) => f.available === 'YES').length}/${facilities.length} उपलब्ध` : 'ऑडिट शेष',
        scorePct: facilities.length > 0 ? Math.round((facilities.filter((f) => f.available !== 'UNKNOWN').length / facilities.length) * 100) : 0,
        route: 'facilities',
      },
      {
        id: 'attendance',
        name: 'दैनिक उपस्थिति अद्यतन',
        isComplete: scopedStats.todayAttendanceRecorded,
        details: scopedStats.todayAttendanceRecorded ? `आज: ${scopedStats.todayAttendancePct}% उपस्थित` : 'आज की प्रविष्टि शेष',
        scorePct: scopedStats.todayAttendanceRecorded ? 100 : 0,
        route: 'attendance',
      },
      {
        id: 'mdm',
        name: 'मध्याह्न भोजन (MDM) वितरण प्रविष्टि',
        isComplete: scopedStats.mdmRecordedToday,
        details: scopedStats.mdmRecordedToday ? `${scopedStats.mdmServedCount} छात्र लाभान्वित` : 'आज की प्रविष्टि शेष',
        scorePct: scopedStats.mdmRecordedToday ? 100 : 0,
        route: 'mdm',
      },
    ];

    const passedCount = pillars.filter((p) => p.isComplete).length;
    const totalScore = pillars.reduce((sum, p) => sum + p.scorePct, 0);
    const percentage = Math.round(totalScore / pillars.length);

    let status: 'उत्कृष्ट' | 'संतोषजनक' | 'सुधार आवश्यक' = 'सुधार आवश्यक';
    if (percentage >= 90) status = 'उत्कृष्ट';
    else if (percentage >= 70) status = 'संतोषजनक';

    return {
      percentage,
      status,
      passedCount,
      totalCount: pillars.length,
      pillars,
    };
  }, [currentSchool, students, staff, facilities, scopedStats]);

  // ==========================================
  // DYNAMIC PENDING ACTION ITEMS
  // ==========================================

  const pendingActionItems = useMemo(() => {
    const items = [];

    // 1. Attendance pending (Current Active Session Only)
    if (isCurrentSessionSelected && !scopedStats.todayAttendanceRecorded) {
      items.push({
        id: 'action-attendance',
        title: 'दैनिक छात्र उपस्थिति दर्ज करें',
        subtitle: 'आज की प्रातःकालीन छात्र व शिक्षक उपस्थिति प्रविष्टि प्रतीक्षित है।',
        priority: 'HIGH' as const,
        route: 'attendance',
        iconName: 'CalendarCheck',
        buttonText: 'उपस्थिति लगाएं',
      });
    }

    // 2. MDM pending (Current Active Session Only)
    if (isCurrentSessionSelected && !scopedStats.mdmRecordedToday && scopedStats.totalStudents > 0) {
      items.push({
        id: 'action-mdm',
        title: 'आज का MDM वितरण दर्ज करें',
        subtitle: 'मध्याह्न भोजन मेनू व लाभान्वित छात्रों की संख्या दर्ज करें।',
        priority: 'HIGH' as const,
        route: 'mdm',
        iconName: 'Utensils',
        buttonText: 'MDM दर्ज करें',
      });
    }

    // 3. Overdue Government Work
    if (scopedStats.overdueWorkCount > 0) {
      items.push({
        id: 'action-work-overdue',
        title: `${scopedStats.overdueWorkCount} शासकीय कार्य समय-सीमा पार`,
        subtitle: 'समय-सीमा समाप्त हो चुकी है, तत्काल अनुपालन स्थिति अद्यतन करें।',
        count: scopedStats.overdueWorkCount,
        priority: 'HIGH' as const,
        route: 'work',
        iconName: 'ClipboardList',
        buttonText: 'कार्य देखें',
      });
    } else if (scopedStats.pendingWorkCount > 0) {
      items.push({
        id: 'action-work-pending',
        title: `${scopedStats.pendingWorkCount} शासकीय कार्य प्रगतिशील/लंबित`,
        subtitle: 'विभागीय आदेशों के विरुद्ध आवश्यक कार्यवाही पूर्ण करें।',
        count: scopedStats.pendingWorkCount,
        priority: 'MEDIUM' as const,
        route: 'work',
        iconName: 'ClipboardList',
        buttonText: 'स्थिति अद्यतन करें',
      });
    }

    // 4. Pending Complaints
    if (scopedStats.pendingComplaints > 0) {
      items.push({
        id: 'action-complaints',
        title: `${scopedStats.pendingComplaints} शिकायतें त्वरित निवारण हेतु लंबित`,
        subtitle: 'सी.एम. हेल्पलाइन/जनसुनवाई शिकायतों की समय-सीमा अनुसार जांच करें।',
        count: scopedStats.pendingComplaints,
        priority: 'HIGH' as const,
        route: 'complaints',
        iconName: 'AlertTriangle',
        buttonText: 'निवारण करें',
      });
    }

    // 5. Critical Facility Needs
    if (scopedStats.criticalNeedFacilities > 0) {
      items.push({
        id: 'action-facilities',
        title: `${scopedStats.criticalNeedFacilities} भौतिक सुविधाओं में तत्काल सुधार आवश्यक`,
        subtitle: 'शौचालय, पेयजल या बाउंड्रीवाल की स्थिति में मरम्मत दरकार है।',
        count: scopedStats.criticalNeedFacilities,
        priority: 'MEDIUM' as const,
        route: 'facilities',
        iconName: 'ShieldCheck',
        buttonText: 'सुविधाएं देखें',
      });
    }

    // 6. Unread notifications
    if (scopedStats.unreadNotificationsCount > 0) {
      items.push({
        id: 'action-notifications',
        title: `${scopedStats.unreadNotificationsCount} नवीन विभागीय सूचनाएं व आदेश अपठित`,
        subtitle: 'संकुल एवं उच्चाधिकारियों द्वारा जारी नवीन आदेश देखें।',
        count: scopedStats.unreadNotificationsCount,
        priority: 'LOW' as const,
        route: 'notifications',
        iconName: 'Bell',
        buttonText: 'सूचनाएं देखें',
      });
    }

    return items;
  }, [scopedStats, isCurrentSessionSelected]);

  // ==========================================
  // REAL-TIME SCOPED RECENT ACTIVITIES
  // ==========================================

  const recentActivities = useMemo(() => {
    return dataContext.auditLogs
      .filter((log) => {
        if (!isSchoolUser) return true;
        return !log.schoolUdise || log.schoolUdise === userAssignedUdise;
      })
      .slice(0, 8);
  }, [dataContext.auditLogs, isSchoolUser, userAssignedUdise]);

  return {
    // Identity & Scope Information
    currentUser,
    currentSchool,
    currentSchoolUdise: effectiveUdise,
    userAssignedUdise,
    isSchoolUser,
    isRestricted,
    canAccessAllSchools,
    schoolName: currentSchool?.hindiName || currentSchool?.name || (effectiveUdise ? `विद्यालय UDISE: ${effectiveUdise}` : 'संकुल मलगुवां (समस्त विद्यालय)'),
    schoolType: currentSchool?.schoolType || 'शासकीय',
    principalName: currentSchool?.principalName || 'संस्था प्रधान',
    principalMobile: currentSchool?.principalMobile || '',

    // Visible Schools
    schools,

    // Strictly Scoped Data Collections
    students,
    staff,
    rasoiya,
    shgs,
    attendance,
    mdmRecords,
    facilities,
    governmentWork,
    complaints,
    documents,

    // Real Scoped Metrics & Dynamic Insights
    scopedStats,
    dataCompleteness,
    pendingActionItems,
    recentActivities,
    selectedSessionId,
    activeSessionId,
    isCurrentSessionSelected,

    // Scoped Data Fetching Operations
    fetchStudents,
    fetchStaff,
    fetchAttendance,
    fetchMDM,
    fetchFacilities,
    fetchGovernmentWork,
    fetchComplaints,
    fetchSchool,

    // Safe Scoped Mutators
    addStudent,
    updateStudent,
    deleteStudent,
    addStaff,
    updateStaff,
    deleteStaff,
    addRasoiya,
    updateRasoiya,
    deleteRasoiya,
    addSHG,
    updateSHG,
    deleteSHG,
    markAttendance,
    markAttendanceBatch,
    saveMDMRecord,
    deleteMDMRecord,
    updateFacility,
    addGovernmentWork,
    updateGovernmentWork,
    deleteGovernmentWork,
    addComplaint,
    updateComplaint,

    // Security Gate Helpers
    canAccessSchool,
    assertSchoolAccess,

    // Context Settings & Logger
    settings: dataContext.settings,
    notifications: dataContext.notifications,
    logActivity: dataContext.logActivity,
  };
};

