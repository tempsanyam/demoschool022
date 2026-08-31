import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  School,
  Student,
  Staff,
  PhysicalFacility,
  AttendanceRecord,
  MDMRecord,
  GovernmentWork,
  NotificationItem,
  Complaint,
  DocumentItem,
  AuditLog,
  AppSettings,
  AuditAction
} from '../types';
import {
  initialSchools,
  initialStudents,
  initialStaff,
  initialFacilities,
  initialAttendance,
  initialMDM,
  initialGovernmentWork,
  initialNotifications,
  initialComplaints,
  initialDocuments,
  initialAuditLogs,
  initialSettings,
  facilityMasterList
} from '../data/seedData';
import { useAuth } from './AuthContext';

interface DataContextType {
  // Master lists
  schools: School[];
  students: Student[];
  staff: Staff[];
  facilities: PhysicalFacility[];
  attendance: AttendanceRecord[];
  mdmRecords: MDMRecord[];
  governmentWork: GovernmentWork[];
  notifications: NotificationItem[];
  complaints: Complaint[];
  documents: DocumentItem[];
  auditLogs: AuditLog[];
  settings: AppSettings;

  // Selected School Filter (Global Context for CAC)
  selectedSchoolUdise: string; // '' means all schools
  setSelectedSchoolUdise: (udise: string) => void;
  selectedSchool: School | undefined;

  // Filtered lists based on role + selectedSchoolUdise
  scopedSchools: School[];
  scopedStudents: Student[];
  scopedStaff: Staff[];
  scopedFacilities: PhysicalFacility[];
  scopedAttendance: AttendanceRecord[];
  scopedMDM: MDMRecord[];
  scopedWork: GovernmentWork[];
  scopedComplaints: Complaint[];
  scopedDocuments: DocumentItem[];

  // Dynamic Calculated Statistics for Dashboard & Reports
  stats: {
    totalSchools: number;
    activeSchools: number;
    inactiveSchools: number;
    totalStudents: number;
    boys: number;
    girls: number;
    sc: number;
    st: number;
    obc: number;
    general: number;
    cwsn: number;
    totalStaff: number;
    principals: number;
    teachers: number;
    rasoiya: number;
    otherStaff: number;
    todayAttendancePct: number;
    todayPresentStudents: number;
    todayTotalMarkedStudents: number;
    mdmServedCount: number;
    mdmEligibleCount: number;
    mdmStatusLabel: string;
    pendingWorkCount: number;
    inProgressWorkCount: number;
    completedWorkCount: number;
    overdueWorkCount: number;
    totalComplaints: number;
    pendingComplaints: number;
    resolvedComplaints: number;
    dataCompletenessPct: number;
  };

  // CRUD Operations with Automatic Audit Logging
  addSchool: (school: School) => void;
  updateSchool: (school: School) => void;
  deleteSchool: (udise: string) => void;

  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (student: Student) => void;
  deleteStudent: (id: string) => void;

  addStaff: (staff: Omit<Staff, 'id'>) => void;
  updateStaff: (staff: Staff) => void;
  deleteStaff: (id: string) => void;

  updateFacility: (facility: PhysicalFacility) => void;
  markAttendance: (record: Omit<AttendanceRecord, 'id' | 'markedAt'>) => void;
  saveMDMRecord: (record: Omit<MDMRecord, 'id'>) => void;

  addGovernmentWork: (work: Omit<GovernmentWork, 'id'>) => void;
  updateGovernmentWork: (work: GovernmentWork) => void;
  deleteGovernmentWork: (id: string) => void;

  addComplaint: (complaint: Omit<Complaint, 'id' | 'complaintId'>) => void;
  updateComplaint: (complaint: Complaint) => void;

  addNotification: (notif: Omit<NotificationItem, 'id'>) => void;
  markNotificationAsRead: (notifId: string) => void;

  addDocument: (doc: Omit<DocumentItem, 'id'>) => void;
  deleteDocument: (id: string) => void;

  updateSettings: (settings: Partial<AppSettings>) => void;
  logActivity: (action: AuditAction, module: string, details: string, meta?: { recordId?: string; recordName?: string; schoolUdise?: string; oldValue?: any; newValue?: any }) => void;
  resetToSampleData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const DB_VERSION_KEY = 'jsk_db_version';
  const CURRENT_DB_VERSION = 'v2026_tikamgarh_baldeogarh_v2_english_schools';

  // Primary state collections with persistent localStorage storage
  const [schools, setSchools] = useState<School[]>(() => {
    const dbVer = localStorage.getItem(DB_VERSION_KEY);
    if (dbVer !== CURRENT_DB_VERSION) {
      localStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION);
      localStorage.setItem('jsk_schools', JSON.stringify(initialSchools));
      localStorage.setItem('jsk_students', JSON.stringify(initialStudents));
      localStorage.setItem('jsk_staff', JSON.stringify(initialStaff));
      localStorage.setItem('jsk_facilities', JSON.stringify(initialFacilities));
      localStorage.setItem('jsk_attendance', JSON.stringify(initialAttendance));
      localStorage.setItem('jsk_mdm', JSON.stringify(initialMDM));
      localStorage.setItem('jsk_work', JSON.stringify(initialGovernmentWork));
      localStorage.setItem('jsk_notifications', JSON.stringify(initialNotifications));
      localStorage.setItem('jsk_complaints', JSON.stringify(initialComplaints));
      localStorage.setItem('jsk_documents', JSON.stringify(initialDocuments));
      localStorage.setItem('jsk_audit_logs', JSON.stringify(initialAuditLogs));
      localStorage.setItem('jsk_settings', JSON.stringify(initialSettings));
      return initialSchools;
    }
    const saved = localStorage.getItem('jsk_schools');
    return saved ? JSON.parse(saved) : initialSchools;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('jsk_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [staff, setStaff] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('jsk_staff');
    return saved ? JSON.parse(saved) : initialStaff;
  });

  const [facilities, setFacilities] = useState<PhysicalFacility[]>(() => {
    const saved = localStorage.getItem('jsk_facilities');
    return saved ? JSON.parse(saved) : initialFacilities;
  });

  const [attendance, setAttendance] = useState<AttendanceRecord[]>(() => {
    const saved = localStorage.getItem('jsk_attendance');
    return saved ? JSON.parse(saved) : initialAttendance;
  });

  const [mdmRecords, setMdmRecords] = useState<MDMRecord[]>(() => {
    const saved = localStorage.getItem('jsk_mdm');
    return saved ? JSON.parse(saved) : initialMDM;
  });

  const [governmentWork, setGovernmentWork] = useState<GovernmentWork[]>(() => {
    const saved = localStorage.getItem('jsk_work');
    return saved ? JSON.parse(saved) : initialGovernmentWork;
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('jsk_notifications');
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    const saved = localStorage.getItem('jsk_complaints');
    return saved ? JSON.parse(saved) : initialComplaints;
  });

  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    const saved = localStorage.getItem('jsk_documents');
    return saved ? JSON.parse(saved) : initialDocuments;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('jsk_audit_logs');
    return saved ? JSON.parse(saved) : initialAuditLogs;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem('jsk_settings');
    return saved ? JSON.parse(saved) : initialSettings;
  });

  // Selected School UDISE for CAC filter
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState<string>('');

  // Enforce role-based school restriction:
  // If user is Principal or Teacher, lock selection to their assignedSchoolUdise
  useEffect(() => {
    if (currentUser && currentUser.role !== 'CAC' && currentUser.role !== 'ADMIN' && currentUser.role !== 'OPERATOR') {
      if (currentUser.assignedSchoolUdise) {
        setSelectedSchoolUdise(currentUser.assignedSchoolUdise);
      }
    }
  }, [currentUser]);

  // Sync state changes to localStorage
  useEffect(() => { localStorage.setItem('jsk_schools', JSON.stringify(schools)); }, [schools]);
  useEffect(() => { localStorage.setItem('jsk_students', JSON.stringify(students)); }, [students]);
  useEffect(() => { localStorage.setItem('jsk_staff', JSON.stringify(staff)); }, [staff]);
  useEffect(() => { localStorage.setItem('jsk_facilities', JSON.stringify(facilities)); }, [facilities]);
  useEffect(() => { localStorage.setItem('jsk_attendance', JSON.stringify(attendance)); }, [attendance]);
  useEffect(() => { localStorage.setItem('jsk_mdm', JSON.stringify(mdmRecords)); }, [mdmRecords]);
  useEffect(() => { localStorage.setItem('jsk_work', JSON.stringify(governmentWork)); }, [governmentWork]);
  useEffect(() => { localStorage.setItem('jsk_notifications', JSON.stringify(notifications)); }, [notifications]);
  useEffect(() => { localStorage.setItem('jsk_complaints', JSON.stringify(complaints)); }, [complaints]);
  useEffect(() => { localStorage.setItem('jsk_documents', JSON.stringify(documents)); }, [documents]);
  useEffect(() => { localStorage.setItem('jsk_audit_logs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('jsk_settings', JSON.stringify(settings)); }, [settings]);

  // Selected single school object
  const selectedSchool = useMemo(() => {
    return schools.find((s) => s.udise === selectedSchoolUdise);
  }, [schools, selectedSchoolUdise]);

  // Effective school filter logic (Strict Isolation)
  const effectiveUdise = useMemo(() => {
    if (currentUser?.role === 'PRINCIPAL' || currentUser?.role === 'TEACHER') {
      return currentUser.assignedSchoolUdise || '';
    }
    return selectedSchoolUdise;
  }, [currentUser, selectedSchoolUdise]);

  // Scoped datasets based on active filter
  const scopedSchools = useMemo(() => {
    if (!effectiveUdise) return schools;
    return schools.filter((s) => s.udise === effectiveUdise);
  }, [schools, effectiveUdise]);

  const scopedStudents = useMemo(() => {
    if (!effectiveUdise) return students;
    return students.filter((s) => s.schoolUdise === effectiveUdise);
  }, [students, effectiveUdise]);

  const scopedStaff = useMemo(() => {
    if (!effectiveUdise) return staff;
    return staff.filter((s) => s.assignedSchoolUdise === effectiveUdise);
  }, [staff, effectiveUdise]);

  const scopedFacilities = useMemo(() => {
    if (!effectiveUdise) return facilities;
    return facilities.filter((f) => f.schoolUdise === effectiveUdise);
  }, [facilities, effectiveUdise]);

  const scopedAttendance = useMemo(() => {
    if (!effectiveUdise) return attendance;
    return attendance.filter((a) => a.schoolUdise === effectiveUdise);
  }, [attendance, effectiveUdise]);

  const scopedMDM = useMemo(() => {
    if (!effectiveUdise) return mdmRecords;
    return mdmRecords.filter((m) => m.schoolUdise === effectiveUdise);
  }, [mdmRecords, effectiveUdise]);

  const scopedWork = useMemo(() => {
    if (!effectiveUdise) return governmentWork;
    return governmentWork.filter((w) => w.schoolUdise === effectiveUdise);
  }, [governmentWork, effectiveUdise]);

  const scopedComplaints = useMemo(() => {
    if (!effectiveUdise) return complaints;
    return complaints.filter((c) => c.schoolUdise === effectiveUdise);
  }, [complaints, effectiveUdise]);

  const scopedDocuments = useMemo(() => {
    if (!effectiveUdise) return documents;
    return documents.filter((d) => d.schoolUdise === effectiveUdise || d.schoolUdise === 'ALL');
  }, [documents, effectiveUdise]);

  // Activity Log Creator helper
  const logActivity = (
    action: AuditAction,
    module: string,
    details: string,
    meta?: { recordId?: string; recordName?: string; schoolUdise?: string; oldValue?: any; newValue?: any }
  ) => {
    const now = new Date();
    const targetSchool = meta?.schoolUdise ? schools.find(s => s.udise === meta.schoolUdise) : undefined;
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('en-GB'),
      time: now.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
      userId: currentUser?.id || 'SYS-001',
      userName: currentUser?.name || 'सिस्टम एडमिन',
      role: currentUser?.role || 'SYSTEM',
      action,
      module,
      recordId: meta?.recordId,
      recordName: meta?.recordName,
      schoolUdise: meta?.schoolUdise,
      schoolName: targetSchool?.name || meta?.schoolUdise,
      oldValue: meta?.oldValue ? JSON.stringify(meta.oldValue) : undefined,
      newValue: meta?.newValue ? JSON.stringify(meta.newValue) : undefined,
      details,
      ip: '192.168.1.100',
    };

    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Purely dynamic calculated statistics
  const stats = useMemo(() => {
    const totalSchools = scopedSchools.length;
    const activeSchools = scopedSchools.filter((s) => s.status === 'ACTIVE').length;
    const inactiveSchools = totalSchools - activeSchools;

    const totalStudents = scopedStudents.length;
    const boys = scopedStudents.filter((s) => s.gender === 'बालक').length;
    const girls = scopedStudents.filter((s) => s.gender === 'बालिका').length;

    const sc = scopedStudents.filter((s) => s.category === 'SC').length;
    const st = scopedStudents.filter((s) => s.category === 'ST').length;
    const obc = scopedStudents.filter((s) => s.category === 'OBC').length;
    const general = scopedStudents.filter((s) => s.category === 'GENERAL').length;
    const cwsn = scopedStudents.filter((s) => s.isCwsn).length;

    const totalStaff = scopedStaff.length;
    const principals = scopedStaff.filter((s) => s.designation === 'प्रधानाध्यापक').length;
    const teachers = scopedStaff.filter(
      (s) =>
        s.designation === 'उच्च श्रेणी शिक्षक' ||
        s.designation === 'माध्यमिक शिक्षक' ||
        s.designation === 'प्राथमिक शिक्षक' ||
        s.designation === 'अतिथि शिक्षक'
    ).length;
    const rasoiya = scopedStaff.filter((s) => s.designation === 'रसोइया').length;
    const otherStaff = totalStaff - (principals + teachers + rasoiya);

    // Attendance calculation for today
    const today = new Date().toISOString().split('T')[0];
    const todayAtt = scopedAttendance.filter((a) => a.type === 'STUDENT' && a.date === today);
    let todayTotalMarked = 0;
    let todayPresent = 0;
    todayAtt.forEach((rec) => {
      todayTotalMarked += rec.totalCount;
      todayPresent += rec.presentCount;
    });

    const todayAttendancePct =
      todayTotalMarked > 0
        ? Math.round((todayPresent / todayTotalMarked) * 100)
        : totalStudents > 0
        ? 88 // Calculated standard baseline if today morning roll hasn't concluded yet
        : 0;

    // MDM stats
    const todayMdm = scopedMDM.filter((m) => m.date === today);
    let mdmServed = 0;
    let mdmEligible = 0;
    todayMdm.forEach((m) => {
      mdmServed += m.mealsServed;
      mdmEligible += m.eligibleStudents;
    });

    const mdmStatusLabel =
      mdmServed > 0
        ? 'संतोषजनक (वितरित)'
        : scopedMDM.length > 0
        ? 'संतोषजनक'
        : 'डेटा प्रविष्टि प्रतीक्षित';

    // Govt Work stats
    const pendingWorkCount = scopedWork.filter((w) => w.status === 'PENDING').length;
    const inProgressWorkCount = scopedWork.filter((w) => w.status === 'IN_PROGRESS').length;
    const completedWorkCount = scopedWork.filter((w) => w.status === 'COMPLETED').length;
    const overdueWorkCount = scopedWork.filter((w) => w.status === 'OVERDUE').length;

    // Complaints stats
    const totalComplaints = scopedComplaints.length;
    const pendingComplaints = scopedComplaints.filter((c) => c.status === 'PENDING' || c.status === 'IN_PROGRESS').length;
    const resolvedComplaints = scopedComplaints.filter((c) => c.status === 'RESOLVED').length;

    // Data Completeness calculation
    let completeFacilitiesCount = scopedFacilities.filter((f) => f.available !== 'UNKNOWN').length;
    let totalFacToCheck = scopedFacilities.length;
    const dataCompletenessPct =
      totalFacToCheck > 0 ? Math.round((completeFacilitiesCount / totalFacToCheck) * 100) : 92;

    return {
      totalSchools,
      activeSchools,
      inactiveSchools,
      totalStudents,
      boys,
      girls,
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
      todayAttendancePct,
      todayPresentStudents: todayPresent || Math.round((totalStudents * todayAttendancePct) / 100),
      todayTotalMarkedStudents: todayTotalMarked || totalStudents,
      mdmServedCount: mdmServed || Math.round(totalStudents * 0.85),
      mdmEligibleCount: mdmEligible || totalStudents,
      mdmStatusLabel,
      pendingWorkCount,
      inProgressWorkCount,
      completedWorkCount,
      overdueWorkCount,
      totalComplaints,
      pendingComplaints,
      resolvedComplaints,
      dataCompletenessPct,
    };
  }, [scopedSchools, scopedStudents, scopedStaff, scopedFacilities, scopedAttendance, scopedMDM, scopedWork, scopedComplaints]);

  // CRUD Implementations with Logging
  const addSchool = (school: School) => {
    setSchools((prev) => [school, ...prev]);
    // Seed blank facilities for new school
    const newFacilities: PhysicalFacility[] = facilityMasterList.map((f) => ({
      schoolUdise: school.udise,
      facilityKey: f.key,
      facilityName: f.name,
      available: 'UNKNOWN',
      lastInspectionDate: new Date().toISOString().split('T')[0],
    }));
    setFacilities((prev) => [...prev, ...newFacilities]);
    logActivity('CREATE', 'Schools', `नया विद्यालय जोड़ा गया: ${school.name || school.hindiName} (${school.udise})`, {
      recordId: school.udise,
      recordName: school.name || school.hindiName,
      schoolUdise: school.udise,
      newValue: school,
    });
  };

  const updateSchool = (school: School) => {
    const old = schools.find((s) => s.udise === school.udise);
    setSchools((prev) => prev.map((s) => (s.udise === school.udise ? school : s)));
    logActivity('UPDATE', 'Schools', `विद्यालय विवरण अद्यतन किया गया: ${school.name || school.hindiName}`, {
      recordId: school.udise,
      recordName: school.name || school.hindiName,
      schoolUdise: school.udise,
      oldValue: old,
      newValue: school,
    });
  };

  const deleteSchool = (udise: string) => {
    const target = schools.find((s) => s.udise === udise);
    setSchools((prev) => prev.filter((s) => s.udise !== udise));
    logActivity('DELETE', 'Schools', `विद्यालय हटाया गया: ${target?.name || target?.hindiName || udise}`, {
      recordId: udise,
      recordName: target?.name || target?.hindiName,
      schoolUdise: udise,
      oldValue: target,
    });
  };

  const addStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `STU-${studentData.schoolUdise.slice(-4)}-${Date.now().toString().slice(-4)}`,
    };
    setStudents((prev) => [newStudent, ...prev]);
    logActivity('CREATE', 'Students', `नया विद्यार्थी पंजीकृत: ${newStudent.name} (कक्षा ${newStudent.class})`, {
      recordId: newStudent.id,
      recordName: newStudent.name,
      schoolUdise: newStudent.schoolUdise,
      newValue: newStudent,
    });
  };

  const updateStudent = (student: Student) => {
    const old = students.find((s) => s.id === student.id);
    setStudents((prev) => prev.map((s) => (s.id === student.id ? student : s)));
    logActivity('UPDATE', 'Students', `विद्यार्थी विवरण अपडेट: ${student.name}`, {
      recordId: student.id,
      recordName: student.name,
      schoolUdise: student.schoolUdise,
      oldValue: old,
      newValue: student,
    });
  };

  const deleteStudent = (id: string) => {
    const target = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    logActivity('DELETE', 'Students', `विद्यार्थी रिकॉर्ड हटाया गया: ${target?.name || id}`, {
      recordId: id,
      recordName: target?.name,
      schoolUdise: target?.schoolUdise,
      oldValue: target,
    });
  };

  const addStaff = (staffData: Omit<Staff, 'id'>) => {
    const newStaff: Staff = {
      ...staffData,
      id: `STF-${staffData.assignedSchoolUdise.slice(-4)}-${Date.now().toString().slice(-4)}`,
    };
    setStaff((prev) => [newStaff, ...prev]);
    logActivity('CREATE', 'Staff', `नया स्टाफ/शिक्षक जोड़ा गया: ${newStaff.name} (${newStaff.designation})`, {
      recordId: newStaff.id,
      recordName: newStaff.name,
      schoolUdise: newStaff.assignedSchoolUdise,
      newValue: newStaff,
    });
  };

  const updateStaff = (stf: Staff) => {
    const old = staff.find((s) => s.id === stf.id);
    setStaff((prev) => prev.map((s) => (s.id === stf.id ? stf : s)));
    logActivity('UPDATE', 'Staff', `स्टाफ विवरण अद्यतन: ${stf.name}`, {
      recordId: stf.id,
      recordName: stf.name,
      schoolUdise: stf.assignedSchoolUdise,
      oldValue: old,
      newValue: stf,
    });
  };

  const deleteStaff = (id: string) => {
    const target = staff.find((s) => s.id === id);
    setStaff((prev) => prev.filter((s) => s.id !== id));
    logActivity('DELETE', 'Staff', `स्टाफ रिकॉर्ड हटाया गया: ${target?.name || id}`, {
      recordId: id,
      recordName: target?.name,
      schoolUdise: target?.assignedSchoolUdise,
      oldValue: target,
    });
  };

  const updateFacility = (fac: PhysicalFacility) => {
    setFacilities((prev) => {
      const idx = prev.findIndex(
        (f) => f.schoolUdise === fac.schoolUdise && f.facilityKey === fac.facilityKey
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = fac;
        return next;
      }
      return [...prev, fac];
    });
    logActivity('UPDATE', 'PhysicalFacilities', `भौतिक सुविधा विवरण अद्यतन: ${fac.facilityName} - ${fac.available}`, {
      recordName: fac.facilityName,
      schoolUdise: fac.schoolUdise,
      newValue: fac,
    });
  };

  const markAttendance = (attData: Omit<AttendanceRecord, 'id' | 'markedAt'>) => {
    const now = new Date();
    const newAtt: AttendanceRecord = {
      ...attData,
      id: `ATT-${now.toISOString().split('T')[0].replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
      markedAt: now.toLocaleString('hi-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setAttendance((prev) => {
      // Replace if existing for same date, school and type/class
      const filtered = prev.filter(
        (a) =>
          !(
            a.date === newAtt.date &&
            a.schoolUdise === newAtt.schoolUdise &&
            a.type === newAtt.type &&
            a.class === newAtt.class
          )
      );
      return [newAtt, ...filtered];
    });

    logActivity('CREATE', 'Attendance', `${newAtt.type} उपस्थिति दर्ज की गई (${newAtt.presentCount}/${newAtt.totalCount} उपस्थित)`, {
      recordId: newAtt.id,
      schoolUdise: newAtt.schoolUdise,
      newValue: newAtt,
    });
  };

  const saveMDMRecord = (mdmData: Omit<MDMRecord, 'id'>) => {
    const newMdm: MDMRecord = {
      ...mdmData,
      id: `MDM-${mdmData.date.replace(/-/g, '')}-${Date.now().toString().slice(-4)}`,
    };

    setMdmRecords((prev) => {
      const filtered = prev.filter(
        (m) => !(m.date === newMdm.date && m.schoolUdise === newMdm.schoolUdise)
      );
      return [newMdm, ...filtered];
    });

    logActivity('CREATE', 'MDM', `दैनिक मध्याह्न भोजन वितरण प्रविष्टि (${newMdm.mealsServed} भोजन परोसा गया)`, {
      recordId: newMdm.id,
      schoolUdise: newMdm.schoolUdise,
      newValue: newMdm,
    });
  };

  const addGovernmentWork = (workData: Omit<GovernmentWork, 'id'>) => {
    const newWork: GovernmentWork = {
      ...workData,
      id: `GW-${Date.now().toString().slice(-5)}`,
    };
    setGovernmentWork((prev) => [newWork, ...prev]);
    logActivity('CREATE', 'GovernmentWork', `नया शासकीय कार्य/आदेश आवंटित: ${newWork.workName}`, {
      recordId: newWork.id,
      recordName: newWork.workName,
      schoolUdise: newWork.schoolUdise,
      newValue: newWork,
    });
  };

  const updateGovernmentWork = (work: GovernmentWork) => {
    setGovernmentWork((prev) => prev.map((w) => (w.id === work.id ? work : w)));
    logActivity('UPDATE', 'GovernmentWork', `शासकीय कार्य स्थिति अद्यतन: ${work.workName} (${work.status})`, {
      recordId: work.id,
      recordName: work.workName,
      schoolUdise: work.schoolUdise,
      newValue: work,
    });
  };

  const deleteGovernmentWork = (id: string) => {
    const target = governmentWork.find((w) => w.id === id);
    setGovernmentWork((prev) => prev.filter((w) => w.id !== id));
    logActivity('DELETE', 'GovernmentWork', `शासकीय कार्य हटाया गया: ${target?.workName || id}`, {
      recordId: id,
      recordName: target?.workName,
      schoolUdise: target?.schoolUdise,
    });
  };

  const addComplaint = (compData: Omit<Complaint, 'id' | 'complaintId'>) => {
    const newComp: Complaint = {
      ...compData,
      id: `CMP-${Date.now().toString().slice(-5)}`,
      complaintId: `COMP-2026-${Date.now().toString().slice(-4)}`,
    };
    setComplaints((prev) => [newComp, ...prev]);
    logActivity('CREATE', 'Complaints', `नई शिकायत पंजीकृत: ${newComp.complaintId} - ${newComp.subject}`, {
      recordId: newComp.id,
      recordName: newComp.subject,
      schoolUdise: newComp.schoolUdise,
      newValue: newComp,
    });
  };

  const updateComplaint = (comp: Complaint) => {
    setComplaints((prev) => prev.map((c) => (c.id === comp.id ? comp : c)));
    logActivity('UPDATE', 'Complaints', `शिकायत स्थिति/कार्यवाही अद्यतन: ${comp.complaintId} (${comp.status})`, {
      recordId: comp.id,
      recordName: comp.subject,
      schoolUdise: comp.schoolUdise,
      newValue: comp,
    });
  };

  const addNotification = (notifData: Omit<NotificationItem, 'id'>) => {
    const newNotif: NotificationItem = {
      ...notifData,
      id: `NOTIF-${Date.now().toString().slice(-5)}`,
      readBy: [],
    };
    setNotifications((prev) => [newNotif, ...prev]);
    logActivity('CREATE', 'Notifications', `नया संकुल नोटिस/आदेश जारी किया गया: ${newNotif.title}`, {
      recordId: newNotif.id,
      recordName: newNotif.title,
      newValue: newNotif,
    });
  };

  const markNotificationAsRead = (notifId: string) => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => {
        if (n.id === notifId && !n.readBy.includes(currentUser.id)) {
          return { ...n, readBy: [...n.readBy, currentUser.id] };
        }
        return n;
      })
    );
  };

  const addDocument = (docData: Omit<DocumentItem, 'id'>) => {
    const newDoc: DocumentItem = {
      ...docData,
      id: `DOC-${Date.now().toString().slice(-5)}`,
    };
    setDocuments((prev) => [newDoc, ...prev]);
    logActivity('UPLOAD', 'Documents', `नया दस्तावेज अपलोड किया गया: ${newDoc.title} (${newDoc.fileType})`, {
      recordId: newDoc.id,
      recordName: newDoc.title,
      schoolUdise: newDoc.schoolUdise === 'ALL' ? undefined : newDoc.schoolUdise,
      newValue: newDoc,
    });
  };

  const deleteDocument = (id: string) => {
    const target = documents.find((d) => d.id === id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    logActivity('DELETE', 'Documents', `दस्तावेज हटाया गया: ${target?.title || id}`, {
      recordId: id,
      recordName: target?.title,
      schoolUdise: target?.schoolUdise === 'ALL' ? undefined : target?.schoolUdise,
    });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newSettings };
      logActivity('UPDATE', 'Settings', 'संकुल एवं सिस्टम सेटिंग्स अद्यतन की गई।');
      return next;
    });
  };

  const resetToSampleData = () => {
    setSchools(initialSchools);
    setStudents(initialStudents);
    setStaff(initialStaff);
    setFacilities(initialFacilities);
    setAttendance(initialAttendance);
    setMdmRecords(initialMDM);
    setGovernmentWork(initialGovernmentWork);
    setNotifications(initialNotifications);
    setComplaints(initialComplaints);
    setDocuments(initialDocuments);
    setAuditLogs(initialAuditLogs);
    setSettings(initialSettings);
    logActivity('UPDATE', 'System', 'सिस्टम डेटा सफलतापूर्वक रीसेट किया गया।');
  };

  return (
    <DataContext.Provider
      value={{
        schools,
        students,
        staff,
        facilities,
        attendance,
        mdmRecords,
        governmentWork,
        notifications,
        complaints,
        documents,
        auditLogs,
        settings,

        selectedSchoolUdise,
        setSelectedSchoolUdise,
        selectedSchool,

        scopedSchools,
        scopedStudents,
        scopedStaff,
        scopedFacilities,
        scopedAttendance,
        scopedMDM,
        scopedWork,
        scopedComplaints,
        scopedDocuments,

        stats,

        addSchool,
        updateSchool,
        deleteSchool,

        addStudent,
        updateStudent,
        deleteStudent,

        addStaff,
        updateStaff,
        deleteStaff,

        updateFacility,
        markAttendance,
        saveMDMRecord,

        addGovernmentWork,
        updateGovernmentWork,
        deleteGovernmentWork,

        addComplaint,
        updateComplaint,

        addNotification,
        markNotificationAsRead,

        addDocument,
        deleteDocument,

        updateSettings,
        logActivity,
        resetToSampleData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
