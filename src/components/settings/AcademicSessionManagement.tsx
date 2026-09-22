import React, { useState, useMemo } from 'react';
import {
  Calendar,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Users,
  GraduationCap,
  School as SchoolIcon,
  RefreshCw,
  Search,
  ChevronRight,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  HelpCircle,
  Archive,
  ArrowUpRight,
  Sparkles,
  Info,
  Edit2,
  Eye,
  EyeOff,
  Table as TableIcon,
  LayoutGrid,
  X,
  SlidersHorizontal,
  ArrowLeft,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { AcademicSession, SessionStatus, StudentEnrollmentStatus, PromotionRuleMapping, CarryForwardOptions } from '../../types';
import { validateSessionFormat, getNextSessionSuggestion } from '../../utils/sessionManager';

interface AcademicSessionManagementProps {
  embedded?: boolean;
}

export const AcademicSessionManagement: React.FC<AcademicSessionManagementProps> = ({ embedded = false }) => {
  const { currentUser } = useAuth();
  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const isAdmin = currentUser?.role === 'ADMIN';
  const isCAC = currentUser?.role === 'CAC';
  const myUdise = (currentUser?.assignedSchoolUdise || '').trim();

  const {
    academicSessions,
    visibleAcademicSessions,
    activeSessionId,
    selectedSessionId,
    setSelectedSessionId,
    activateSession,
    closeSession,
    archiveSession,
    lockSession,
    unlockSession,
    createAcademicSession,
    updateAcademicSession,
    studentMasters,
    studentAcademicRecords,
    staffMasters,
    staffPostings,
    promotionRules,
    promoteStudents,
    getStudentAcademicJourney,
    schools,
    isCurrentSessionSelected,
  } = useData();

  const formatHindiSessionPeriod = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return '01 अप्रैल 2026 — 31 मार्च 2027';
    const monthsHindi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
    try {
      const sParts = startDate.split('-');
      const eParts = endDate.split('-');
      if (sParts.length === 3 && eParts.length === 3) {
        const sDay = sParts[2];
        const sMonth = monthsHindi[parseInt(sParts[1], 10) - 1] || sParts[1];
        const sYear = sParts[0];
        const eDay = eParts[2];
        const eMonth = monthsHindi[parseInt(eParts[1], 10) - 1] || eParts[1];
        const eYear = eParts[0];
        return `${sDay} ${sMonth} ${sYear} — ${eDay} ${eMonth} ${eYear}`;
      }
    } catch {}
    return `${startDate} — ${endDate}`;
  };

  const activeSessionObj = useMemo(() => {
    return academicSessions.find((s) => s.id === activeSessionId) || academicSessions.find((s) => s.isCurrent) || null;
  }, [academicSessions, activeSessionId]);

  const totalSessionsCount = academicSessions.length;
  const activeSessionsCount = academicSessions.filter((s) => s.status === 'ACTIVE' || s.isCurrent).length;
  const upcomingSessionsCount = academicSessions.filter((s) => s.status === 'UPCOMING').length;
  const archivedOrClosedCount = academicSessions.filter((s) => s.status === 'ARCHIVED' || s.status === 'CLOSED').length;

  // Active Tab State
  const [activeTab, setActiveTab] = useState<'LIST' | 'CREATE' | 'PROMOTION' | 'JOURNEY' | 'RULES'>('LIST');

  // List View Controls & Filters
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'ALL' | SessionStatus>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'CARDS'>('TABLE');

  // Edit Session Modal State
  const [editingSession, setEditingSession] = useState<AcademicSession | null>(null);
  const [editFormData, setEditFormData] = useState<{
    sessionName: string;
    shortName: string;
    startDate: string;
    endDate: string;
    status: SessionStatus;
    visibleToCAC: boolean;
    visibleToSchool: boolean;
    remarks: string;
  }>({
    sessionName: '',
    shortName: '',
    startDate: '',
    endDate: '',
    status: 'ACTIVE',
    visibleToCAC: true,
    visibleToSchool: true,
    remarks: '',
  });
  const [editError, setEditError] = useState<string | null>(null);

  // New Session Form State
  const [newSessionName, setNewSessionName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [newRemarks, setNewRemarks] = useState('');
  const [newVisibleToCAC, setNewVisibleToCAC] = useState(true);
  const [newVisibleToSchool, setNewVisibleToSchool] = useState(true);
  const [setAsActiveImmediately, setSetAsActiveImmediately] = useState(false);
  const [carryForwardConfig, setCarryForwardConfig] = useState<CarryForwardOptions>({
    schools: true,
    studentMaster: true,
    staffMaster: true,
    staffPosting: true,
    studentPromotion: true,
    schoolFacilities: true,
    documents: true,
    attendance: false,
    mdm: false,
    governmentWork: false,
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  // Student Promotion Module State
  const [promotionSourceSession, setPromotionSourceSession] = useState(activeSessionId || '2026-27');
  const [promotionTargetSession, setPromotionTargetSession] = useState('');
  const [promotionSchoolFilter, setPromotionSchoolFilter] = useState('');
  const [promotionClassFilter, setPromotionClassFilter] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<Record<string, boolean>>({});
  const [customClassMapping, setCustomClassMapping] = useState<Record<string, string>>({});
  const [promotionActionStatus, setPromotionActionStatus] = useState<Record<string, StudentEnrollmentStatus>>({});
  const [promotionSuccessMsg, setPromotionSuccessMsg] = useState<string | null>(null);

  // Journey Tracker Search
  const [journeySearchQuery, setJourneySearchQuery] = useState('');
  const [selectedJourneyStudentId, setSelectedJourneyStudentId] = useState<string | null>(null);

  // Modals / Confirmations
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Calculate default dates when typing session name
  const handleSessionNameChange = (val: string) => {
    setNewSessionName(val);
    setCreateError(null);
    const match = val.trim().match(/^(\d{4})-(\d{2})$/);
    if (match) {
      const startYear = match[1];
      const endYear = (parseInt(startYear, 10) + 1).toString();
      setNewStartDate(`${startYear}-04-01`);
      setNewEndDate(`${endYear}-03-31`);
    }
  };

  const handleAutoSuggestNextSession = () => {
    const suggestion = getNextSessionSuggestion(academicSessions);
    setNewSessionName(suggestion.sessionName);
    setNewStartDate(suggestion.startDate);
    setNewEndDate(suggestion.endDate);
    setNewRemarks(`शैक्षणिक सत्र ${suggestion.sessionName} (संकुल मलगुवां)`);
    setCreateError(null);
  };

  // Pre-fill target session for promotion
  const availableTargetSessions = useMemo(() => {
    return academicSessions.filter((s) => s.id !== promotionSourceSession);
  }, [academicSessions, promotionSourceSession]);

  // Students eligible for promotion in source session
  const sourceSessionStudents = useMemo(() => {
    const sourceRecords = studentAcademicRecords.filter(
      (r) => r.sessionId === promotionSourceSession && r.enrollmentStatus !== 'TC_ISSUED' && r.enrollmentStatus !== 'DROPOUT'
    );

    const masterMap = new Map(studentMasters.map((m) => [m.id, m]));
    const schoolMap = new Map(schools.map((s) => [s.udise, s]));

    return sourceRecords
      .map((rec) => {
        const master = masterMap.get(rec.studentId);
        const school = schoolMap.get(rec.schoolUdise);
        return {
          rec,
          master,
          school,
        };
      })
      .filter((item) => {
        if (!item.master) return false;
        const targetSchool = isSchoolUser ? myUdise : promotionSchoolFilter;
        if (targetSchool && item.rec.schoolUdise !== targetSchool) return false;
        if (promotionClassFilter && item.rec.class !== promotionClassFilter) return false;
        return true;
      });
  }, [studentAcademicRecords, studentMasters, schools, promotionSourceSession, promotionSchoolFilter, promotionClassFilter, isSchoolUser, myUdise]);

  // Session Statistics
  const getSessionStats = (sessionId: string) => {
    const studentsCount = studentAcademicRecords.filter((r) => r.sessionId === sessionId).length;
    const staffCount = staffPostings.filter((p) => p.sessionId === sessionId).length;
    return { studentsCount, staffCount };
  };

  // Sessions to display (Administrators see all sessions; other roles see visibleAcademicSessions)
  const displayableSessions = isAdmin ? academicSessions : visibleAcademicSessions;

  const filteredSessions = useMemo(() => {
    return displayableSessions.filter((s) => {
      if (sessionStatusFilter !== 'ALL' && s.status !== sessionStatusFilter) return false;
      if (sessionSearchQuery && sessionSearchQuery.trim()) {
        const q = sessionSearchQuery.toLowerCase().trim();
        const matchName = (s.sessionName || s.name || s.id || '').toLowerCase().includes(q);
        const matchShort = (s.shortName || '').toLowerCase().includes(q);
        const matchRemarks = (s.remarks || '').toLowerCase().includes(q);
        if (!matchName && !matchShort && !matchRemarks) return false;
      }
      return true;
    });
  }, [displayableSessions, sessionStatusFilter, sessionSearchQuery]);

  const handleStartEditSession = (session: AcademicSession) => {
    setEditingSession(session);
    setEditFormData({
      sessionName: session.sessionName || session.name || session.id,
      shortName: session.shortName || '',
      startDate: session.startDate || '',
      endDate: session.endDate || '',
      status: session.status,
      visibleToCAC: session.visibleToCAC ?? true,
      visibleToSchool: session.visibleToSchool ?? true,
      remarks: session.remarks || '',
    });
    setEditError(null);
  };

  const handleSaveEditedSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    if (!editFormData.sessionName.trim()) {
      setEditError('कृपया सत्र नाम दर्ज करें।');
      return;
    }

    const res = updateAcademicSession(editingSession.id, {
      sessionName: editFormData.sessionName.trim(),
      name: editFormData.sessionName.trim(),
      shortName: editFormData.shortName.trim(),
      startDate: editFormData.startDate,
      endDate: editFormData.endDate,
      status: editFormData.status,
      visibleToCAC: editFormData.visibleToCAC,
      visibleToSchool: editFormData.visibleToSchool,
      remarks: editFormData.remarks.trim(),
    });

    if (res.success) {
      setEditingSession(null);
    } else {
      setEditError(res.message);
    }
  };

  const handleToggleVisibility = (sessionId: string, target: 'CAC' | 'SCHOOL', currentVal: boolean) => {
    if (target === 'CAC') {
      updateAcademicSession(sessionId, { visibleToCAC: !currentVal });
    } else {
      updateAcademicSession(sessionId, { visibleToSchool: !currentVal });
    }
  };

  // Handle Session Creation
  const handleCreateSessionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreateSuccess(null);

    const validation = validateSessionFormat(newSessionName);
    if (!validation.isValid) {
      setCreateError(validation.error || 'अमान्य सत्र प्रारूप');
      return;
    }

    if (!newStartDate || !newEndDate) {
      setCreateError('कृपया सत्र प्रारंभ एवं समाप्ति तिथि दर्ज करें।');
      return;
    }

    const startYear = parseInt(newSessionName.split('-')[0], 10);
    const endYear = startYear + 1;

    const result = createAcademicSession(
      {
        id: newSessionName.trim(),
        sessionName: newSessionName.trim(),
        startYear,
        endYear,
        startDate: newStartDate,
        endDate: newEndDate,
        isCurrent: setAsActiveImmediately,
        status: setAsActiveImmediately ? 'ACTIVE' : 'UPCOMING',
        visibleToCAC: newVisibleToCAC,
        visibleToSchool: newVisibleToSchool,
        remarks: newRemarks || `शैक्षणिक सत्र ${newSessionName.trim()}`,
      },
      carryForwardConfig
    );

    if (result.success) {
      setCreateSuccess(result.message);
      setNewSessionName('');
      setNewStartDate('');
      setNewEndDate('');
      setNewRemarks('');
      setNewVisibleToCAC(true);
      setNewVisibleToSchool(true);
      setTimeout(() => {
        setActiveTab('LIST');
        setCreateSuccess(null);
      }, 1500);
    } else {
      setCreateError(result.message);
    }
  };

  // Handle Bulk Promotion
  const handleExecuteBulkPromotion = () => {
    if (!promotionTargetSession) {
      alert('कृपया लक्ष्य (Target) शैक्षणिक सत्र चुनें!');
      return;
    }

    const targetsToPromote = sourceSessionStudents.filter((item) => selectedStudentIds[item.rec.studentId]);
    if (targetsToPromote.length === 0) {
      alert('कृपया कम से कम एक विद्यार्थी का चयन करें!');
      return;
    }

    const payload = targetsToPromote.map((item) => {
      const currClass = item.rec.class;
      let nextClass = customClassMapping[item.rec.studentId];

      if (!nextClass) {
        // default rule
        const rule = promotionRules.find((r) => r.fromClass === currClass);
        nextClass = rule ? rule.toClass : currClass;
      }

      const stStatus: StudentEnrollmentStatus =
        promotionActionStatus[item.rec.studentId] || (nextClass === 'PASSED' ? 'PASSED_OUT' : 'PROMOTED');

      return {
        studentId: item.rec.studentId,
        fromSessionId: promotionSourceSession,
        toSessionId: promotionTargetSession,
        oldClass: currClass,
        newClass: nextClass === 'PASSED' ? currClass : nextClass,
        status: stStatus,
        schoolUdise: item.rec.schoolUdise,
        remarks: `सत्र ${promotionSourceSession} से सत्र ${promotionTargetSession} में कक्षोन्नत`,
      };
    });

    const res = promoteStudents(payload);
    setPromotionSuccessMsg(res.message);
    setSelectedStudentIds({});
    setTimeout(() => setPromotionSuccessMsg(null), 4000);
  };

  // Toggle select all students
  const handleSelectAll = (checked: boolean) => {
    const updated: Record<string, boolean> = {};
    if (checked) {
      sourceSessionStudents.forEach((s) => {
        updated[s.rec.studentId] = true;
      });
    }
    setSelectedStudentIds(updated);
  };

  // Journey Search Candidates (strictly scoped to own school for SCHOOL role)
  const candidateMasters = useMemo(() => {
    if (!isSchoolUser || !myUdise) return studentMasters;
    const enrolledStudentIds = new Set(
      studentAcademicRecords
        .filter((r) => r.schoolUdise === myUdise)
        .map((r) => r.studentId)
    );
    return studentMasters.filter((m) => enrolledStudentIds.has(m.id));
  }, [studentMasters, studentAcademicRecords, isSchoolUser, myUdise]);

  const journeySearchResults = useMemo(() => {
    if (!journeySearchQuery || !journeySearchQuery.trim()) {
      return candidateMasters.slice(0, 10);
    }
    const q = journeySearchQuery.toLowerCase().trim();
    return candidateMasters.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(q) ||
        (m.samagraId || '').toLowerCase().includes(q) ||
        Boolean(m.fatherName && m.fatherName.toLowerCase().includes(q))
    ).slice(0, 20);
  }, [candidateMasters, journeySearchQuery]);

  const activeJourneyStudent = useMemo(() => {
    if (!selectedJourneyStudentId) return null;
    const master = studentMasters.find((m) => m.id === selectedJourneyStudentId);
    if (!master) return null;
    const journey = getStudentAcademicJourney(selectedJourneyStudentId);
    return { master, journey };
  }, [selectedJourneyStudentId, studentMasters, getStudentAcademicJourney]);

  if (isSchoolUser) {
    return (
      <div className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 p-6 rounded-2xl text-center space-y-3 max-w-xl mx-auto my-8 animate-in fade-in">
        <ShieldCheck className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-red-900 dark:text-red-200">
          अनधिकृत पहुंच (Access Restricted)
        </h3>
        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
          सत्र प्रबंधन एवं शैक्षणिक सत्र नियंत्रण केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) के लिए अधिकृत है।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-200">
      {/* Top Banner & Active Session Card (Only shown when not embedded in Settings) */}
      {!embedded && (
        <div className="bg-gradient-to-r from-[#0B6B4B] to-[#074731] text-white p-6 rounded-2xl shadow-md border border-emerald-600/40 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-amber-400 text-gray-950 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  सत्र प्रबंधन प्रणाली (Academic Sessions)
                </span>
                <span className="text-xs text-emerald-200 font-medium">
                  जन शिक्षा केंद्र मलगुवां (विकासखंड बलदेवगढ़)
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 tracking-tight">
                शैक्षणिक सत्र एवं कक्षोन्नति प्रबंधन
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
                सत्र 2026-27 सहित आगामी एवं विगत शैक्षणिक वर्षों का पूर्ण डेटा अलगाव, ऑटो-प्रमोशन, अभिलेख फ्रीज व विद्यार्थी शैक्षणिक यात्रा ट्रैकिंग।
              </p>
            </div>

            {/* Current vs Selected Session Status Box */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0 shadow-lg">
              <div className="border-b sm:border-b-0 sm:border-r border-white/20 pb-3 sm:pb-0 sm:pr-4">
                <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold block">
                  ★ वर्तमान सक्रिय सत्र
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-white">{activeSessionId}</span>
                  <span className="bg-emerald-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded">
                    सक्रिय (LIVE)
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-200 font-bold block">
                  वर्तमान दृश्य (Viewing Session)
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-amber-300">{selectedSessionId}</span>
                  {!isCurrentSessionSelected ? (
                    <span className="bg-amber-500 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded animate-pulse">
                      पुराना सत्र (ReadOnly)
                    </span>
                  ) : (
                    <span className="bg-emerald-300 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded">
                      सक्रिय सत्र
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveTab('LIST')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'LIST'
              ? 'bg-[#0B6B4B] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>सभी सत्रों की सूची ({academicSessions.length})</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('CREATE')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'CREATE'
                ? 'bg-[#0B6B4B] text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ नया सत्र बनाएं</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('PROMOTION')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'PROMOTION'
              ? 'bg-[#0B6B4B] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>विद्यार्थी कक्षोन्नति (Promotion)</span>
        </button>

        <button
          onClick={() => setActiveTab('JOURNEY')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'JOURNEY'
              ? 'bg-[#0B6B4B] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>विद्यार्थी शैक्षणिक इतिहास (Journey Tracker)</span>
        </button>

        <button
          onClick={() => setActiveTab('RULES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'RULES'
              ? 'bg-[#0B6B4B] text-white shadow-xs'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>कक्षोन्नति नियम निर्देशिका</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL SESSIONS LIST & OPERATIONAL CONTROLS                           */}
      {/* ========================================================================= */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          {/* Current Active Session & Viewing Session Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Active Session Card */}
            <div className="bg-gradient-to-br from-[#0B6B4B] to-[#074731] text-white p-5 rounded-2xl shadow-sm border border-emerald-600/40 relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  ★ वर्तमान सक्रिय सत्र
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="bg-emerald-400 text-gray-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-950 animate-pulse"></span>
                    LIVE
                  </span>
                  <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    सक्रिय सत्र
                  </span>
                </div>
              </div>
              <div className="mt-3">
                <div className="text-3xl font-black tracking-tight text-white">
                  {activeSessionId || '2026-27'}
                </div>
                <div className="text-xs text-emerald-100 font-medium mt-1 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{formatHindiSessionPeriod(activeSessionObj?.startDate, activeSessionObj?.endDate)}</span>
                </div>
              </div>
            </div>

            {/* Viewing Session Card */}
            <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  वर्तमान दृश्य सत्र (Viewing Session)
                </span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    isCurrentSessionSelected
                      ? 'bg-emerald-50 text-[#0B6B4B] border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}
                >
                  {isCurrentSessionSelected ? 'सक्रिय सत्र (कार्यशील)' : 'पुराना सत्र (अभिलेखीय दृश्य)'}
                </span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <div>
                  <div className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                    {selectedSessionId || activeSessionId}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {isCurrentSessionSelected
                      ? 'वर्तमान में वास्तविक लाइव शैक्षणिक सत्र का डेटा प्रदर्शित हो रहा है'
                      : `सत्र ${selectedSessionId} का ऐतिहासिक अभिलेखीय डेटा देखा जा रहा है`}
                  </div>
                </div>
                {!isCurrentSessionSelected && (
                  <button
                    type="button"
                    onClick={() => setSelectedSessionId(activeSessionId)}
                    className="px-2.5 py-1 bg-[#0B6B4B] hover:bg-[#08553B] text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    सक्रिय सत्र पर लौटें
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Four Session Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#16211D] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block">कुल सत्र</span>
              <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                {totalSessionsCount}
              </div>
              <span className="text-[10px] text-gray-400 mt-0.5 block">2015-16 से 2030-31</span>
            </div>

            <div className="bg-white dark:bg-[#16211D] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">सक्रिय सत्र</span>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
                {activeSessionsCount}
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">वर्तमान कार्यशील</span>
            </div>

            <div className="bg-white dark:bg-[#16211D] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400 block">आगामी सत्र</span>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                {upcomingSessionsCount}
              </div>
              <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">भविष्य नियोजन</span>
            </div>

            <div className="bg-white dark:bg-[#16211D] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 block">अभिलेखीय / समाप्त</span>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                {archivedOrClosedCount}
              </div>
              <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5 block">सुरक्षित ऐतिहासिक रिकॉर्ड</span>
            </div>
          </div>

          {/* Promotion, Journey & Rules Action Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. विद्यार्थी कक्षोन्नति */}
            <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-extrabold text-sm">
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl">
                    <GraduationCap className="w-5 h-5 text-[#0B6B4B] dark:text-emerald-300" />
                  </div>
                  <span>विद्यार्थी कक्षोन्नति</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  पिछले सत्र के विद्यार्थियों को अगले सत्र में कक्षोन्नत करें
                </p>
              </div>
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveTab('PROMOTION')}
                  className="px-3.5 py-1.5 bg-[#0B6B4B] hover:bg-[#08553B] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>कक्षोन्नति प्रारंभ करें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('JOURNEY')}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <span>कक्षोन्नति इतिहास</span>
                </button>
              </div>
            </div>

            {/* 2. विद्यार्थी शैक्षणिक यात्रा */}
            <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-extrabold text-sm">
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <span>विद्यार्थी शैक्षणिक यात्रा</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  विद्यार्थी की सत्रवार शैक्षणिक यात्रा देखें
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('JOURNEY')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>Journey Tracker खोलें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. कक्षोन्नति नियम */}
            <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-extrabold text-sm">
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-xl">
                    <HelpCircle className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <span>कक्षोन्नति नियम</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">
                  कक्षोन्नति से विद्यार्थी की स्थायी पहचान सुरक्षित रहती है। प्रत्येक सत्र में नया academic record बनाया जाता है और पिछला अभिलेख सुरक्षित रहता है।
                </p>
              </div>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('RULES')}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <span>नियम देखें</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Header Bar & Quick Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#0B6B4B]" />
                <span>पंजीकृत शैक्षणिक सत्र विवरण (Academic Sessions Master)</span>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                  कुल {filteredSessions.length} सत्र
                </span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                सत्र 2015-16 से 2030-31 तक के सत्रों का नियंत्रण, दृश्यता (CAC/स्कूल) एवं अभिलेख प्रबंधन।
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Switcher: Table vs Cards */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setViewMode('TABLE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'TABLE'
                      ? 'bg-white dark:bg-gray-900 text-[#0B6B4B] shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                  title="तालिका दृश्य"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">तालिका</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('CARDS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'CARDS'
                      ? 'bg-white dark:bg-gray-900 text-[#0B6B4B] shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                  }`}
                  title="कार्ड दृश्य"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">कार्ड</span>
                </button>
              </div>

              {isAdmin && (
                <button
                  onClick={() => setActiveTab('CREATE')}
                  className="px-3.5 py-1.5 bg-[#FF7A00] hover:bg-[#e06c00] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ नया सत्र जोड़ें</span>
                </button>
              )}
            </div>
          </div>

          {/* Search & Status Filters */}
          <div className="bg-white dark:bg-[#16211D] p-3 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={sessionSearchQuery}
                onChange={(e) => setSessionSearchQuery(e.target.value)}
                placeholder="सत्र वर्ष या विवरण खोजें (उदा. 2027-28)..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              {sessionSearchQuery && (
                <button
                  type="button"
                  onClick={() => setSessionSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
              {(['ALL', 'ACTIVE', 'UPCOMING', 'LOCKED', 'CLOSED', 'ARCHIVED', 'INACTIVE'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSessionStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] whitespace-nowrap cursor-pointer transition-all ${
                    sessionStatusFilter === st
                      ? 'bg-[#0B6B4B] text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                  }`}
                >
                  {st === 'ALL'
                    ? 'सभी'
                    : st === 'ACTIVE'
                    ? 'सक्रिय'
                    : st === 'UPCOMING'
                    ? 'आगामी'
                    : st === 'LOCKED'
                    ? 'लॉक'
                    : st === 'CLOSED'
                    ? 'समाप्त'
                    : st === 'ARCHIVED'
                    ? 'अभिलेख'
                    : 'निष्क्रिय'}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE VIEW */}
          {viewMode === 'TABLE' && (
            <div className="bg-white dark:bg-[#16211D] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50/90 dark:bg-[#0F1713] border-b border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-extrabold uppercase tracking-wider text-[11px]">
                      <th className="py-3 px-3.5">सत्र</th>
                      <th className="py-3 px-3">अवधि</th>
                      <th className="py-3 px-3 text-center">स्थिति</th>
                      <th className="py-3 px-3 text-center">नामांकित छात्र</th>
                      <th className="py-3 px-3 text-center">शिक्षक</th>
                      <th className="py-3 px-3 text-center">दृश्यता</th>
                      <th className="py-3 px-3 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-medium">
                    {filteredSessions.map((session) => {
                      const stats = getSessionStats(session.id);
                      const isCurrent = session.isCurrent;
                      const isSelected = selectedSessionId === session.id;
                      const isLocked = session.status === 'LOCKED';
                      const isClosed = session.status === 'CLOSED';
                      const isArchived = session.status === 'ARCHIVED';
                      const isInactive = session.status === 'INACTIVE';
                      const isUpcoming = session.status === 'UPCOMING';

                      return (
                        <tr
                          key={session.id}
                          className={`hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors ${
                            isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          {/* 1. सत्र */}
                          <td className="py-3 px-3.5">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                  isCurrent
                                    ? 'bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                              >
                                {isCurrent ? '★' : '📅'}
                              </div>
                              <div>
                                <div className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                                  <span>{session.sessionName || session.name || session.id}</span>
                                  {session.shortName && (
                                    <span className="text-[10px] text-gray-400 font-mono">({session.shortName})</span>
                                  )}
                                  {isSelected && (
                                    <span className="bg-[#0B6B4B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                      चयनित
                                    </span>
                                  )}
                                </div>
                                {session.remarks && (
                                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-xs block">
                                    {session.remarks}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. अवधि */}
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                            <div className="text-[11px] font-mono">
                              <div>{session.startDate || '—'}</div>
                              <div className="text-gray-400">से {session.endDate || '—'}</div>
                            </div>
                          </td>

                          {/* 3. स्थिति */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                सक्रिय
                              </span>
                            ) : isLocked ? (
                              <span className="inline-flex items-center gap-1 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                                <Lock className="w-3 h-3" />
                                लॉक
                              </span>
                            ) : isArchived ? (
                              <span className="inline-flex items-center gap-1 bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
                                <Archive className="w-3 h-3" />
                                अभिलेखीय
                              </span>
                            ) : isClosed ? (
                              <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                समाप्त
                              </span>
                            ) : isInactive ? (
                              <span className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-red-200 dark:border-red-800">
                                निष्क्रिय
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                                आगामी
                              </span>
                            )}
                          </td>

                          {/* 4. नामांकित छात्र */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              {stats.studentsCount} छात्र
                            </span>
                          </td>

                          {/* 5. शिक्षक */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                              {stats.staffCount} शिक्षक
                            </span>
                          </td>

                          {/* 6. दृश्यता */}
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {isAdmin ? (
                                <button
                                  type="button"
                                  onClick={() => handleToggleVisibility(session.id, 'CAC', session.visibleToCAC ?? true)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    session.visibleToCAC !== false
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800'
                                  }`}
                                  title="CAC दृश्यता टॉगल करें"
                                >
                                  CAC {session.visibleToCAC !== false ? '✓' : '✕'}
                                </button>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    session.visibleToCAC !== false
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                  }`}
                                >
                                  CAC {session.visibleToCAC !== false ? '✓' : '✕'}
                                </span>
                              )}

                              {isAdmin ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleToggleVisibility(session.id, 'SCHOOL', session.visibleToSchool ?? true)
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                    session.visibleToSchool !== false
                                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800'
                                  }`}
                                  title="स्कूल दृश्यता टॉगल करें"
                                >
                                  School {session.visibleToSchool !== false ? '✓' : '✕'}
                                </button>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    session.visibleToSchool !== false
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : 'bg-gray-100 text-gray-500 dark:bg-gray-800'
                                  }`}
                                >
                                  School {session.visibleToSchool !== false ? '✓' : '✕'}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 7. कार्य */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Switch view */}
                              {isSelected ? (
                                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-bold">
                                  चयनित
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSessionId(session.id)}
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-[#0B6B4B] dark:text-emerald-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
                                  title="इस सत्र का डेटा देखें"
                                >
                                  {isArchived || isClosed ? 'अभिलेख देखें' : 'देखें'}
                                </button>
                              )}

                              {/* Edit Modal Button (Admin only) */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => handleStartEditSession(session)}
                                  className="p-1 text-gray-600 hover:text-emerald-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                                  title="सत्र संपादित करें (Edit)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Lock indicator */}
                              {isLocked && (
                                <span className="p-1 text-gray-400 dark:text-gray-500" title="सत्र लॉक है">
                                  <Lock className="w-3.5 h-3.5" />
                                </span>
                              )}

                              {/* Activate Button */}
                              {isAdmin && !isCurrent && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: `सत्र ${session.sessionName || session.id} को चालू सत्र बनाएं?`,
                                      message: `क्या आप सत्र "${session.sessionName || session.id}" को सम्पूर्ण संकुल के लिए चालू सत्र (Active LIVE Session) बनाना चाहते हैं?`,
                                      onConfirm: () => {
                                        const res = activateSession(session.id);
                                        if (!res.success) {
                                          alert(res.message);
                                        }
                                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                      },
                                    });
                                  }}
                                  className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                  title="चालू सत्र बनाएं (Activate)"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Lock / Unlock */}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isLocked) {
                                      const res = unlockSession(session.id);
                                      if (!res.success) {
                                        alert(res.message);
                                      }
                                    } else {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: `सत्र ${session.sessionName || session.id} लॉक करें?`,
                                        message: `सत्र लॉक करने के उपरांत इसमें नया डेटा या संशोधन नहीं किया जा सकेगा।`,
                                        onConfirm: () => {
                                          const res = lockSession(session.id);
                                          if (!res.success) {
                                            alert(res.message);
                                          }
                                          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                        },
                                      });
                                    }
                                  }}
                                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                                    isLocked
                                      ? 'text-purple-600 hover:bg-purple-100'
                                      : 'text-amber-600 hover:bg-amber-100'
                                  }`}
                                  title={isLocked ? 'सत्र अनलॉक करें' : 'सत्र लॉक (Freeze) करें'}
                                >
                                  {isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                                </button>
                              )}

                              {/* Close */}
                              {isAdmin && !isClosed && !isCurrent && !isArchived && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: `सत्र ${session.sessionName || session.id} समाप्त (Close) करें?`,
                                      message: `क्या आप सत्र "${session.sessionName || session.id}" को समाप्त करना चाहते हैं?`,
                                      onConfirm: () => {
                                        const res = closeSession(session.id);
                                        if (!res.success) {
                                          alert(res.message);
                                        }
                                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                      },
                                    });
                                  }}
                                  className="p-1 text-red-600 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                                  title="सत्र समाप्त करें (Close)"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Archive */}
                              {isAdmin && !isCurrent && !isArchived && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setConfirmModal({
                                      isOpen: true,
                                      title: `सत्र ${session.sessionName || session.id} अभिलेखीय (Archive) करें?`,
                                      message: `क्या आप सत्र "${session.sessionName || session.id}" को अभिलेखीय घोषित करना चाहते हैं?`,
                                      onConfirm: () => {
                                        const res = archiveSession(session.id);
                                        if (!res.success) {
                                          alert(res.message);
                                        }
                                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                      },
                                    });
                                  }}
                                  className="p-1 text-gray-500 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                                  title="अभिलेखीय घोषित करें (Archive)"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CARDS VIEW */}
          {viewMode === 'CARDS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSessions.map((session) => {
                const stats = getSessionStats(session.id);
                const isCurrent = session.isCurrent;
                const isSelected = selectedSessionId === session.id;
                const isLocked = session.status === 'LOCKED';
                const isClosed = session.status === 'CLOSED';
                const isArchived = session.status === 'ARCHIVED';

                return (
                  <div
                    key={session.id}
                    className={`bg-white dark:bg-[#16211D] rounded-2xl border transition-all p-5 shadow-xs flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#0B6B4B] ring-2 ring-emerald-500/20 dark:border-emerald-500'
                        : 'border-gray-200 dark:border-gray-800 hover:border-gray-300'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header: Session Name & Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm ${
                              isCurrent
                                ? 'bg-emerald-100 text-[#0B6B4B] dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            📅
                          </div>
                          <div>
                            <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-1.5">
                              <span>सत्र {session.sessionName || session.id}</span>
                              {session.shortName && (
                                <span className="text-xs text-gray-400 font-mono">({session.shortName})</span>
                              )}
                            </h3>
                            <span className="text-[11px] text-gray-500 dark:text-gray-400">
                              {session.startDate} से {session.endDate}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {isCurrent ? (
                            <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                              वर्तमान सक्रिय
                            </span>
                          ) : isLocked ? (
                            <span className="bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              लॉक (Freeze)
                            </span>
                          ) : isArchived ? (
                            <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Archive className="w-3 h-3" />
                              अभिलेखीय
                            </span>
                          ) : isClosed ? (
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              समाप्त (Closed)
                            </span>
                          ) : (
                            <span className="bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              आगामी सत्र
                            </span>
                          )}

                          {isSelected && (
                            <span className="bg-[#0B6B4B] text-white text-[9px] font-bold px-2 py-0.5 rounded">
                              वर्तमान में चयनित दृश्य
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Stats Pill in Card */}
                      <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-[#0F1713] p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="w-4 h-4 text-[#0B6B4B]" />
                          <div>
                            <span className="text-gray-500 text-[10px] block">नामांकित छात्र</span>
                            <span className="font-extrabold text-gray-900 dark:text-white">
                              {stats.studentsCount} विद्यार्थी
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-blue-600" />
                          <div>
                            <span className="text-gray-500 text-[10px] block">पदस्थ शिक्षक</span>
                            <span className="font-extrabold text-gray-900 dark:text-white">
                              {stats.staffCount} शिक्षक
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Visibility Badges & Toggles in Card */}
                      <div className="flex items-center justify-between bg-gray-50/60 dark:bg-[#0F1713]/60 p-2 rounded-xl border border-gray-100 dark:border-gray-800 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 text-[10px]">CAC:</span>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() => handleToggleVisibility(session.id, 'CAC', session.visibleToCAC ?? true)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                session.visibleToCAC !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {session.visibleToCAC !== false ? '✓ दृश्यमान' : '✗ अदृश्य'}
                            </button>
                          ) : (
                            <span className="font-bold">{session.visibleToCAC !== false ? 'हाँ' : 'नहीं'}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-500 text-[10px]">स्कूल:</span>
                          {isAdmin ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleVisibility(session.id, 'SCHOOL', session.visibleToSchool ?? true)
                              }
                              className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-all ${
                                session.visibleToSchool !== false
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              {session.visibleToSchool !== false ? '✓ दृश्यमान' : '✗ अदृश्य'}
                            </button>
                          ) : (
                            <span className="font-bold">{session.visibleToSchool !== false ? 'हाँ' : 'नहीं'}</span>
                          )}
                        </div>

                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handleStartEditSession(session)}
                            className="text-xs text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>संपादित</span>
                          </button>
                        )}
                      </div>

                      {session.remarks && (
                        <p className="text-[11px] text-gray-600 dark:text-gray-400 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                          {session.remarks}
                        </p>
                      )}
                    </div>

                    {/* Actions Grid */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* View Data in this Session */}
                        <button
                          onClick={() => setSelectedSessionId(session.id)}
                          className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold'
                              : 'bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 hover:bg-emerald-100'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                          <span>{isSelected ? 'चयनित दृश्य' : 'डेटा देखें'}</span>
                        </button>

                        {/* Set as Active Session (ADMIN only) */}
                        {isAdmin && !isCurrent && (
                          <button
                            onClick={() => {
                              setConfirmModal({
                                isOpen: true,
                                title: `सत्र ${session.sessionName} को सक्रिय घोषित करें?`,
                                message: `क्या आप सत्र "${session.sessionName}" को सम्पूर्ण संकुल के लिए चालू सत्र घोषित करना चाहते हैं? सभी नई प्रविष्टियां डिफ़ॉल्ट रूप से इसी सत्र में दर्ज होंगी।`,
                                onConfirm: () => {
                                  const res = activateSession(session.id);
                                  if (!res.success) {
                                    alert(res.message);
                                  }
                                  setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                },
                              });
                            }}
                            className="w-full py-1.5 px-2 rounded-lg text-xs font-bold bg-[#0B6B4B] hover:bg-[#08553B] text-white transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>सक्रिय बनाएं</span>
                          </button>
                        )}
                      </div>

                      {/* Lock / Freeze / Close Buttons for Admin only */}
                      {isAdmin && (
                        <div className="flex items-center gap-2 pt-1">
                          {isLocked ? (
                            <button
                              onClick={() => {
                                const res = unlockSession(session.id);
                                if (!res.success) {
                                  alert(res.message);
                                }
                              }}
                              className="flex-1 py-1 px-2 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Unlock className="w-3 h-3 text-emerald-600" />
                              <span>अनलॉक करें</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: `सत्र ${session.sessionName} लॉक (Freeze) करें?`,
                                  message: `सत्र लॉक करने के उपरांत इसमें कोई भी नया डेटा या संशोधन नहीं किया जा सकेगा। यह अभिलेख के रूप में सुरक्षित रहेगा।`,
                                  onConfirm: () => {
                                    const res = lockSession(session.id);
                                    if (!res.success) {
                                      alert(res.message);
                                    }
                                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                  },
                                });
                              }}
                              className="flex-1 py-1 px-2 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Lock className="w-3 h-3 text-amber-600" />
                              <span>सत्र लॉक करें</span>
                            </button>
                          )}

                          {!isClosed && !isCurrent && session.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: `सत्र ${session.sessionName} समाप्त (Close) करें?`,
                                  message: `क्या आप सत्र "${session.sessionName}" को समाप्त करना चाहते हैं?`,
                                  onConfirm: () => {
                                    const res = closeSession(session.id);
                                    if (!res.success) {
                                      alert(res.message);
                                    }
                                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                  },
                                });
                              }}
                              className="py-1 px-2 rounded text-[11px] font-semibold bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900/40 flex items-center gap-1 cursor-pointer"
                            >
                              <Archive className="w-3 h-3" />
                              <span>बंद करें</span>
                            </button>
                          )}

                          {!isCurrent && session.status !== 'ARCHIVED' && (
                            <button
                              onClick={() => {
                                setConfirmModal({
                                  isOpen: true,
                                  title: `सत्र ${session.sessionName} अभिलेखीय (Archive) करें?`,
                                  message: `क्या आप सत्र "${session.sessionName}" को अभिलेखीय (Archived) घोषित करना चाहते हैं? इसके पश्चात यह स्थायी रिकॉर्ड के रूप में सुरक्षित रहेगा।`,
                                  onConfirm: () => {
                                    const res = archiveSession(session.id);
                                    if (!res.success) {
                                      alert(res.message);
                                    }
                                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                  },
                                });
                              }}
                              className="py-1 px-2 rounded text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 flex items-center gap-1 cursor-pointer"
                              title="अभिलेखीय घोषित करें"
                            >
                              <Archive className="w-3 h-3 text-gray-500" />
                              <span>अभिलेख</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREATE NEW ACADEMIC SESSION FORM                                   */}
      {/* ========================================================================= */}
      {activeTab === 'CREATE' && (
        <div className="bg-white dark:bg-[#16211D] rounded-2xl border border-gray-200 dark:border-gray-800 p-6 shadow-xs max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-[#0B6B4B]" />
              <span>नवीन शैक्षणिक सत्र सृजन प्रपत्र (Create Academic Session)</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              नए शैक्षणिक वर्ष के लिए नया सत्र बनाएं। इसमें पूर्व सत्र के विद्यार्थियों की कक्षोन्नति एवं शिक्षकों की पदस्थापनाएं स्वतः अग्रेषित करने की सुविधा उपलब्ध है।
            </p>
          </div>

          {createError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{createSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateSessionSubmit} className="space-y-5 text-xs">
            {/* Session Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-gray-800 dark:text-gray-200 block">
                    सत्र नाम (YYYY-YY प्रारूप) *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSuggestNextSession}
                    className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    title="डेटाबेस के आधार पर अगला सत्र स्वतः भरें"
                  >
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>अगला सत्र सुझाएं</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="उदा. 2027-28"
                  value={newSessionName}
                  onChange={(e) => handleSessionNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-gray-400 mt-0.5 block">
                  उदा: 2027-28, 2028-29, 2029-30...
                </span>
              </div>

              <div>
                <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  सत्र प्रारंभ तिथि *
                </label>
                <input
                  type="date"
                  required
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  सत्र समाप्ति तिथि *
                </label>
                <input
                  type="date"
                  required
                  value={newEndDate}
                  onChange={(e) => setNewEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Set as active immediately checkbox */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3">
              <input
                type="checkbox"
                id="setAsActive"
                checked={setAsActiveImmediately}
                onChange={(e) => setSetAsActiveImmediately(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="setAsActive" className="cursor-pointer">
                <span className="font-bold text-emerald-900 dark:text-emerald-200 block">
                  सृजित करते ही इसे वर्तमान सक्रिय सत्र (Active Session) बनाएं
                </span>
                <span className="text-[11px] text-emerald-800/80 dark:text-emerald-400 block">
                  यदि चुना जाता है, तो पूरे पोर्टल में यह नया सत्र चालू सत्र के रूप में सक्रिय हो जाएगा।
                </span>
              </label>
            </div>

            {/* Visibility Settings for CAC & SCHOOL */}
            <div className="bg-gray-50 dark:bg-[#0F1713] p-3.5 rounded-xl border border-gray-200 dark:border-gray-700 space-y-3">
              <span className="font-bold text-xs text-gray-900 dark:text-white block">
                भूमिका-वार दृश्यता नियंत्रण (Role-based Visibility)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVisibleToCAC}
                    onChange={(e) => setNewVisibleToCAC(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>जनशिक्षक (CAC) को दृश्यमान रखें</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs text-gray-700 dark:text-gray-300 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newVisibleToSchool}
                    onChange={(e) => setNewVisibleToSchool(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>शालाओं / शिक्षकों (SCHOOL) को दृश्यमान रखें</span>
                </label>
              </div>
            </div>

            {/* Carry Forward Options Section */}
            <div className="space-y-3 pt-2">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-[#FF7A00]" />
                <span>पूर्व सत्र से डेटा अग्रेषण विकल्प (Data Carry Forward Options)</span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                वर्तमान सत्र से नए सत्र में कौन सा डेटा स्वतः अंतरित किया जाना है, चुनें:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F1713] cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={carryForwardConfig.studentPromotion}
                    onChange={(e) =>
                      setCarryForwardConfig({ ...carryForwardConfig, studentPromotion: e.target.checked })
                    }
                    className="mt-0.5 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      विद्यार्थी कक्षोन्नति (Auto-Promote Students)
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      कक्षा 1 से 7 के विद्यार्थियों को स्वतः अगली कक्षा में कक्षोन्नत कर नए सत्र में नामांकित करें।
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F1713] cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={carryForwardConfig.staffPosting}
                    onChange={(e) =>
                      setCarryForwardConfig({ ...carryForwardConfig, staffPosting: e.target.checked })
                    }
                    className="mt-0.5 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      शिक्षक पदस्थापनाएं (Carry Staff Postings)
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      शिक्षकों व स्टाफ की शाला-वार पदस्थापनाएं नए सत्र में निरंतर रखें।
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F1713] cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={carryForwardConfig.schoolFacilities}
                    onChange={(e) =>
                      setCarryForwardConfig({ ...carryForwardConfig, schoolFacilities: e.target.checked })
                    }
                    className="mt-0.5 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      भौतिक सुविधाएं (Carry Facilities Data)
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      समस्त संकुल शालाओं की भौतिक अधोसंरचना स्थिति नए सत्र में स्थानांतरित करें।
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#0F1713] cursor-pointer hover:bg-gray-100">
                  <input
                    type="checkbox"
                    checked={carryForwardConfig.documents}
                    onChange={(e) =>
                      setCarryForwardConfig({ ...carryForwardConfig, documents: e.target.checked })
                    }
                    className="mt-0.5 text-emerald-600 rounded"
                  />
                  <div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 block">
                      दस्तावेज व प्रारूप (Carry Documents Repository)
                    </span>
                    <span className="text-[10px] text-gray-500 block">
                      विभागीय प्रपत्र व परिपत्र नए सत्र में भी सुलभ रखें।
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Remarks input */}
            <div>
              <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                विशेष विवरण / आदेश संदर्भ (Remarks)
              </label>
              <textarea
                rows={2}
                placeholder="उदा. राज्य शिक्षा केंद्र आदेश क्र./... के परिपालन में नवीन शैक्षणिक सत्र सृजन"
                value={newRemarks}
                onChange={(e) => setNewRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('LIST')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                रद्द करें
              </button>

              <button
                type="submit"
                className="px-5 py-2 bg-[#0B6B4B] hover:bg-[#08553B] text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>सत्र सृजित करें (Create Session)</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: STUDENT PROMOTION & TRANSITION MODULE                              */}
      {/* ========================================================================= */}
      {activeTab === 'PROMOTION' && (
        <div className="space-y-4 text-xs">
          <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#0B6B4B]" />
                <span>विद्यार्थी वार्षिक कक्षोन्नति मॉड्यूल (Annual Student Promotion)</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                एक शैक्षणिक सत्र से दूसरे सत्र में विद्यार्थियों को अगली कक्षा में प्रोन्नत करें।
              </p>
            </div>

            {/* Filter Bar: Source Session, Target Session, School, Class */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50 dark:bg-[#0F1713] p-3.5 rounded-xl border border-gray-200 dark:border-gray-800">
              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  1. मूल सत्र (From Session)
                </label>
                <select
                  value={promotionSourceSession}
                  onChange={(e) => setPromotionSourceSession(e.target.value)}
                  className="w-full bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-bold"
                >
                  {academicSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      सत्र {s.sessionName} {s.isCurrent ? '(सक्रिय)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  2. लक्ष्य सत्र (To Session) *
                </label>
                <select
                  value={promotionTargetSession}
                  onChange={(e) => setPromotionTargetSession(e.target.value)}
                  className="w-full bg-white dark:bg-[#16211D] border border-amber-400 rounded-lg px-2.5 py-1.5 font-bold text-gray-900 dark:text-white"
                >
                  <option value="">-- लक्ष्य सत्र चुनें --</option>
                  {availableTargetSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      सत्र {s.sessionName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  3. शाला फ़िल्टर (School)
                </label>
                {isSchoolUser ? (
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={schools.find((s) => s.udise === myUdise)?.name || currentUser?.assignedSchoolName || 'मेरी पदस्थ शाला'}
                    className="w-full bg-gray-100 dark:bg-[#121a16] border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-bold text-gray-700 dark:text-gray-300 truncate cursor-not-allowed"
                  />
                ) : (
                  <select
                    value={promotionSchoolFilter}
                    onChange={(e) => setPromotionSchoolFilter(e.target.value)}
                    className="w-full bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-medium truncate"
                  >
                    <option value="">समस्त संकुल शालाएं</option>
                    {schools.map((sch) => (
                      <option key={sch.udise} value={sch.udise}>
                        {sch.name || sch.hindiName}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  4. कक्षा फ़िल्टर (Class)
                </label>
                <select
                  value={promotionClassFilter}
                  onChange={(e) => setPromotionClassFilter(e.target.value)}
                  className="w-full bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 font-medium"
                >
                  <option value="">सभी कक्षाएं (1 से 8)</option>
                  {['1', '2', '3', '4', '5', '6', '7', '8'].map((c) => (
                    <option key={c} value={c}>
                      कक्षा {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Promotion Success / Alert */}
            {promotionSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 text-emerald-800 dark:text-emerald-300 rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{promotionSuccessMsg}</span>
              </div>
            )}

            {/* Action Header & Bulk Action Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  सत्र {promotionSourceSession} में कुल विद्यार्थी:{' '}
                  <strong className="text-black dark:text-white font-black">{sourceSessionStudents.length}</strong>
                </span>
                <span className="text-gray-400">|</span>
                <span className="font-bold text-amber-900 dark:text-amber-200">
                  चयनित:{' '}
                  <strong className="text-[#0B6B4B] dark:text-emerald-400 font-black">
                    {Object.values(selectedStudentIds).filter(Boolean).length}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="px-2.5 py-1 bg-white dark:bg-[#16211D] border border-gray-300 rounded-lg text-[11px] font-bold"
                >
                  सभी चुनें
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="px-2.5 py-1 bg-white dark:bg-[#16211D] border border-gray-300 rounded-lg text-[11px] font-bold"
                >
                  चयन हटाएं
                </button>

                <button
                  type="button"
                  disabled={!promotionTargetSession || Object.values(selectedStudentIds).filter(Boolean).length === 0}
                  onClick={handleExecuteBulkPromotion}
                  className="px-4 py-1.5 bg-[#0B6B4B] hover:bg-[#08553B] disabled:opacity-50 text-white rounded-lg font-black text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>
                    चयनित ({Object.values(selectedStudentIds).filter(Boolean).length}) कक्षोन्नत करें →
                  </span>
                </button>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="w-full text-left divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-[#0F1713] text-[11px] font-black text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <input
                        type="checkbox"
                        aria-label="सभी का चयन करें"
                        checked={
                          sourceSessionStudents.length > 0 &&
                          sourceSessionStudents.every((s) => selectedStudentIds[s.rec.studentId])
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded text-emerald-600"
                      />
                    </th>
                    <th className="p-3">समग्र / स्कॉलर नं.</th>
                    <th className="p-3">विद्यार्थी का नाम</th>
                    <th className="p-3">वर्तमान शाला</th>
                    <th className="p-3 text-center">वर्तमान कक्षा</th>
                    <th className="p-3 text-center">प्रस्तावित अगली कक्षा</th>
                    <th className="p-3 text-center">कक्षोन्नति स्थिति (Action)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-medium">
                  {sourceSessionStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-gray-500">
                        कोई विद्यार्थी रिकॉर्ड नहीं मिला। कृपया फ़िल्टर बदलें।
                      </td>
                    </tr>
                  ) : (
                    sourceSessionStudents.map(({ rec, master, school }) => {
                      const isSelected = !!selectedStudentIds[rec.studentId];
                      const currClass = rec.class;
                      const rule = promotionRules.find((r) => r.fromClass === currClass);
                      const defaultNextClass = rule ? rule.toClass : currClass;
                      const currentAssignedClass = customClassMapping[rec.studentId] || defaultNextClass;
                      const currentStatus =
                        promotionActionStatus[rec.studentId] ||
                        (currentAssignedClass === 'PASSED' ? 'PASSED_OUT' : 'PROMOTED');

                      return (
                        <tr
                          key={rec.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-gray-800/40 ${
                            isSelected ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                          }`}
                        >
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              aria-label={`विद्यार्थी ${master?.name} चुनें`}
                              checked={isSelected}
                              onChange={(e) =>
                                setSelectedStudentIds({
                                  ...selectedStudentIds,
                                  [rec.studentId]: e.target.checked,
                                })
                              }
                              className="rounded text-emerald-600"
                            />
                          </td>
                          <td className="p-3">
                            <span className="font-mono font-bold text-[#0B6B4B] block">
                              {master?.samagraId}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              स्कॉलर: {rec.scholarNo || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {master?.name}
                            </span>
                            <span className="text-[10px] text-gray-500">
                              पिता: {master?.fatherName || '-'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="truncate max-w-[180px] block text-gray-700 dark:text-gray-300">
                              {school?.name || school?.hindiName || rec.schoolUdise}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-bold">
                              कक्षा {currClass}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={currentAssignedClass}
                              onChange={(e) => {
                                setCustomClassMapping({
                                  ...customClassMapping,
                                  [rec.studentId]: e.target.value,
                                });
                              }}
                              className="bg-white dark:bg-[#16211D] border border-gray-300 dark:border-gray-700 rounded px-2 py-1 font-bold text-xs"
                            >
                              <option value="1">कक्षा 1</option>
                              <option value="2">कक्षा 2</option>
                              <option value="3">कक्षा 3</option>
                              <option value="4">कक्षा 4</option>
                              <option value="5">कक्षा 5</option>
                              <option value="6">कक्षा 6</option>
                              <option value="7">कक्षा 7</option>
                              <option value="8">कक्षा 8</option>
                              <option value="PASSED">शाला पूर्ण (Passed Out)</option>
                            </select>
                          </td>
                          <td className="p-3 text-center">
                            <select
                              value={currentStatus}
                              onChange={(e) => {
                                setPromotionActionStatus({
                                  ...promotionActionStatus,
                                  [rec.studentId]: e.target.value as StudentEnrollmentStatus,
                                });
                              }}
                              className={`rounded px-2 py-1 text-xs font-bold ${
                                currentStatus === 'PROMOTED'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : currentStatus === 'PASSED_OUT'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              }`}
                            >
                              <option value="PROMOTED">कक्षोन्नत (Promoted)</option>
                              <option value="ACTIVE">समान कक्षा (Repeat)</option>
                              <option value="PASSED_OUT">शाला पूर्ण (Passed Out)</option>
                              <option value="TC_ISSUED">टी.सी. निर्गत (TC Issued)</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: STUDENT ACADEMIC JOURNEY TRACKER                                    */}
      {/* ========================================================================= */}
      {activeTab === 'JOURNEY' && (
        <div className="space-y-5 text-xs">
          <div className="bg-white dark:bg-[#16211D] p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#0B6B4B]" />
                <span>विद्यार्थी शैक्षणिक इतिहास ट्रैकर (Multi-Year Academic Journey)</span>
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">
                किसी भी विद्यार्थी का सत्र-वार सम्पूर्ण शैक्षणिक इतिहास (सत्र 2024-25, 2025-26, 2026-27 आदि) देखें।
              </p>
            </div>

            {/* Search Box */}
            <div className="relative max-w-lg">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="विद्यार्थी का नाम, समग्र आईडी या पिता का नाम खोजें..."
                value={journeySearchQuery}
                onChange={(e) => setJourneySearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Candidate chips */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-gray-500">त्वरित चयन:</span>
              {journeySearchResults.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedJourneyStudentId(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedJourneyStudentId === m.id
                      ? 'bg-[#0B6B4B] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {m.name} ({m.samagraId})
                </button>
              ))}
            </div>

            {/* Active Student Journey View */}
            {activeJourneyStudent ? (
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                {/* Permanent Master Details Card */}
                <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-[#0B6B4B] text-white text-[10px] font-black px-2 py-0.5 rounded">
                        स्थायी मास्टर रिकॉर्ड
                      </span>
                      <span className="font-mono text-emerald-800 dark:text-emerald-300 font-bold">
                        समग्र: {activeJourneyStudent.master.samagraId}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                      {activeJourneyStudent.master.name}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                      पिता: {activeJourneyStudent.master.fatherName || '-'} • माता: {activeJourneyStudent.master.motherName || '-'} • जन्म तिथि: {activeJourneyStudent.master.dob || '-'}
                    </p>
                  </div>

                  <div className="text-right text-[11px] text-gray-600 dark:text-gray-300 shrink-0">
                    <div>वर्ग: <strong>{activeJourneyStudent.master.category || 'सामान्य'}</strong></div>
                    <div>लिंग: <strong>{activeJourneyStudent.master.gender === 'M' ? 'बालक (M)' : 'बालिका (F)'}</strong></div>
                    <div>ग्राम: <strong>{activeJourneyStudent.master.village || 'मलगुवां'}</strong></div>
                  </div>
                </div>

                {/* Timeline Across Sessions */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#0B6B4B]" />
                    <span>शैक्षणिक सत्रवार इतिहास (Academic Timeline)</span>
                  </h4>

                  <div className="relative pl-6 space-y-4 border-l-2 border-emerald-500/40 ml-3">
                    {activeJourneyStudent.journey.map((entry, idx) => (
                      <div
                        key={idx}
                        className="bg-white dark:bg-[#16211D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs relative"
                      >
                        {/* Dot */}
                        <div className="absolute -left-[31px] top-4 w-4 h-4 rounded-full bg-[#0B6B4B] border-2 border-white dark:border-[#101815]"></div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-[#0B6B4B] dark:text-emerald-400 font-mono">
                              सत्र {entry.sessionId}
                            </span>
                            <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold px-2 py-0.5 rounded">
                              कक्षा {entry.class} ({entry.section || 'A'})
                            </span>
                            {entry.rollNumber && (
                              <span className="text-gray-500 font-mono text-[11px]">
                                रोल नं: {entry.rollNumber}
                              </span>
                            )}
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              entry.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : entry.status === 'PROMOTED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                            }`}
                          >
                            {entry.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800 text-[11px]">
                          <div>
                            <span className="text-gray-400 block">विद्यालय UDISE:</span>
                            <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                              {entry.schoolUdise}
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-400 block">वार्षिक उपस्थिति %:</span>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400">
                              {entry.attendancePct ? `${entry.attendancePct}%` : 'नियमित'}
                            </span>
                          </div>

                          <div>
                            <span className="text-gray-400 block">वार्षिक परिणाम / ग्रेड:</span>
                            <span className="font-bold text-purple-700 dark:text-purple-300">
                              {entry.result || 'उत्तीर्ण'}
                            </span>
                          </div>
                        </div>

                        {entry.remarks && (
                          <p className="text-[11px] text-gray-500 mt-2 italic">
                            टिप्पणी: {entry.remarks}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 dark:bg-[#0F1713] rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                कृपया ऊपर सूची में से किसी विद्यार्थी का चयन करें या नाम/समग्र आईडी द्वारा खोजें।
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PROMOTION RULES GUIDELINE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'RULES' && (
        <div className="bg-white dark:bg-[#16211D] p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs space-y-5 text-xs">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#0B6B4B]" />
              <span>मध्य प्रदेश स्कूल शिक्षा विभाग: वार्षिक कक्षोन्नति नियम एवं नीति</span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 mt-0.5">
              RTE अधिनियम 2009 एवं राज्य शिक्षा केंद्र (RSK) मध्य प्रदेश के वर्तमान निर्देशानुसार।
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-2">
              <h3 className="font-bold text-sm text-[#0B6B4B] dark:text-emerald-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                प्राथमिक शालाएं (कक्षा 1 से 5)
              </h3>
              <ul className="space-y-1.5 text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>कक्षा 1 से 4 के विद्यार्थियों का सतत एवं समग्र मूल्यांकन (CCE) कर स्वतः अगली कक्षा में कक्षोन्नति की जाती है।</li>
                <li>कक्षा 5 में बोर्ड पैटर्न वार्षिक परीक्षा आयोजित होती है। परीक्षा उत्तीर्ण होने पर कक्षा 6 (माध्यमिक शाला) में अंतरण होता है।</li>
                <li>अनुत्तीर्ण विद्यार्थियों के लिए 2 माह बाद पुनः परीक्षा का प्रावधान है।</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-2">
              <h3 className="font-bold text-sm text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                माध्यमिक शालाएं (कक्षा 6 से 8)
              </h3>
              <ul className="space-y-1.5 text-gray-700 dark:text-gray-300 list-disc list-inside">
                <li>कक्षा 6 एवं 7 के विद्यार्थी वार्षिक मूल्यांकन उपरांत कक्षा 7 एवं 8 में कक्षोन्नत होते हैं।</li>
                <li>कक्षा 8 में बोर्ड पैटर्न परीक्षा होती है। कक्षा 8 उत्तीर्ण होने पर शाला पूर्ण (Passed Out) व टी.सी. निर्गत की जाती है।</li>
                <li>हाई स्कूल मलगुवां (UDISE: 23080208404) में कक्षा 9 हेतु नामांकन हेतु अग्रसारित।</li>
              </ul>
            </div>
          </div>

          {/* Current System Promotion Map */}
          <div className="space-y-3 pt-2">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white">
              प्रणाली में लागू मानक कक्षोन्नति मैपिंग तालिका:
            </h3>

            <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-xl">
              <table className="w-full text-left divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-[#0F1713] text-[11px] font-bold text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="p-2.5">मूल कक्षा (Current Class)</th>
                    <th className="p-2.5 text-center">→</th>
                    <th className="p-2.5">कक्षोन्नति उपरांत कक्षा (Next Class)</th>
                    <th className="p-2.5">डिफ़ॉल्ट स्थिति</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-semibold">
                  {promotionRules.map((r, i) => (
                    <tr key={i}>
                      <td className="p-2.5">कक्षा {r.fromClass}</td>
                      <td className="p-2.5 text-center text-[#0B6B4B]">→</td>
                      <td className="p-2.5">
                        {r.toClass === 'PASSED' ? 'शाला पूर्ण / उत्तीर्ण (Passed Out)' : `कक्षा ${r.toClass}`}
                      </td>
                      <td className="p-2.5 text-gray-500">{r.defaultStatus}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#16211D] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 animate-in fade-in zoom-in-95 duration-100 my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                    सत्र संपादित करें: {editingSession.sessionName || editingSession.id}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    सत्र का नाम, अवधि, स्थिति एवं भूमिका-वार दृश्यता अद्यतन करें
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                    सत्र नाम *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.sessionName}
                    onChange={(e) => setEditFormData({ ...editFormData, sessionName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                    लघु नाम (Short Name)
                  </label>
                  <input
                    type="text"
                    value={editFormData.shortName}
                    onChange={(e) => setEditFormData({ ...editFormData, shortName: e.target.value })}
                    placeholder="उदा. 27-28"
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                    प्रारंभ तिथि
                  </label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                    समाप्ति तिथि
                  </label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  सत्र स्थिति (Status)
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as AcademicSession['status'],
                    })
                  }
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ACTIVE">ACTIVE (सक्रिय)</option>
                  <option value="UPCOMING">UPCOMING (आगामी)</option>
                  <option value="LOCKED">LOCKED (लॉक / सुरक्षित)</option>
                  <option value="CLOSED">CLOSED (समाप्त)</option>
                  <option value="ARCHIVED">ARCHIVED (अभिलेखीय)</option>
                  <option value="INACTIVE">INACTIVE (निष्क्रिय)</option>
                </select>
              </div>

              {/* Role-based Visibility in Edit Modal */}
              <div className="bg-gray-50 dark:bg-[#0F1713] p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2.5">
                <span className="font-bold text-gray-900 dark:text-white block">
                  भूमिका-वार दृश्यता (Visibility Controls)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={editFormData.visibleToCAC}
                      onChange={(e) => setEditFormData({ ...editFormData, visibleToCAC: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>CAC को दृश्यमान</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={editFormData.visibleToSchool}
                      onChange={(e) => setEditFormData({ ...editFormData, visibleToSchool: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>स्कूल को दृश्यमान</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-bold text-gray-800 dark:text-gray-200 block mb-1">
                  विशेष विवरण / टिप्पणी (Remarks)
                </label>
                <textarea
                  rows={2}
                  value={editFormData.remarks}
                  onChange={(e) => setEditFormData({ ...editFormData, remarks: e.target.value })}
                  placeholder="आदेश संदर्भ या विशेष टिप्पणी..."
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setEditingSession(null)}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSession}
                className="px-5 py-2 rounded-xl bg-[#0B6B4B] hover:bg-[#08553B] text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>सुरक्षित करें (Save Changes)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16211D] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  {confirmModal.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 rounded-xl bg-[#0B6B4B] hover:bg-[#08553B] text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                पुष्टि करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
