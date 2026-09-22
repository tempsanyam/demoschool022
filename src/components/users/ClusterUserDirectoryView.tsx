import React, { useState, useMemo } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Shield,
  ShieldAlert,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Settings as SettingsIcon,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building2,
  Phone,
  Mail,
  Copy,
  Check,
  Printer,
  FileSpreadsheet,
  FileText,
  X,
  Calendar,
  Lock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { User, UserRole, UserStatus } from '../../types';
import { exportToCSV, exportToExcel, printReport } from '../../utils/exportUtils';

interface ClusterUserDirectoryViewProps {
  isEmbedded?: boolean;
}

export const ClusterUserDirectoryView: React.FC<ClusterUserDirectoryViewProps> = ({ isEmbedded = false }) => {
  const {
    currentUser,
    users,
    activateUser,
    deactivateUser,
    approveUser,
    rejectUser,
    resetUserAccess,
    changeUserRole,
    syncDirectoryToCloud
  } = useAuth();

  const { schools, activeSchools } = useData();

  // Access Guard: only CAC and ADMIN are allowed
  const isAuthorized = currentUser?.role === 'ADMIN' || currentUser?.role === 'CAC';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [schoolStatusFilter, setSchoolStatusFilter] = useState<'ACTIVE' | 'ALL' | 'ARCHIVED'>('ACTIVE');
  const [selectedSchoolUdise, setSelectedSchoolUdise] = useState<string>('ALL');
  const [approvalFilter, setApprovalFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Modals State
  const [selectedUserForView, setSelectedUserForView] = useState<User | null>(null);
  const [selectedUserForManage, setSelectedUserForManage] = useState<User | null>(null);
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [userToReject, setUserToReject] = useState<User | null>(null);

  // Feedback notifications
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const showFeedback = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setActionFeedback({ type, text });
    setTimeout(() => {
      setActionFeedback(null);
    }, 4500);
  };

  const copyToClipboard = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Map school status to users
  const activeUdiseSet = useMemo(() => new Set(activeSchools.map((s) => s.udise)), [activeSchools]);
  const allSchoolsMap = useMemo(() => {
    const map = new Map<string, (typeof schools)[0]>();
    schools.forEach((s) => map.set(s.udise, s));
    return map;
  }, [schools]);

  // Cloud Sync Handler
  const handleCloudSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncDirectoryToCloud();
      if (res.success) {
        showFeedback(res.message || 'उपयोगकर्ता डायरेक्टरी सफलतापूर्वक सिंक हुई।', 'success');
      } else {
        showFeedback(res.message || 'सिंक विफल रहा।', 'error');
      }
    } catch (err: any) {
      showFeedback(`सिंक में त्रुटि: ${err?.message || 'अज्ञात'}`, 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Summary Metrics (Dynamically calculated from real user array, no hardcoded constant)
  const metrics = useMemo(() => {
    const total = users.length;
    const active = users.filter((u) => u.status === 'ACTIVE').length;
    const pending = users.filter((u) => u.status === 'PENDING').length;
    const inactive = users.filter((u) => u.status === 'SUSPENDED' || u.status === 'INACTIVE').length;
    const admin = users.filter((u) => u.role === 'ADMIN').length;
    const cac = users.filter((u) => u.role === 'CAC').length;
    const school = users.filter((u) => u.role === 'SCHOOL').length;

    return { total, active, pending, inactive, admin, cac, school };
  }, [users]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // 1. School Status Filter
      const userSchoolUdise = u.schoolUdise || u.assignedSchoolUdise;
      const isSchoolAssigned = Boolean(userSchoolUdise);
      const isSchoolActive = userSchoolUdise ? activeUdiseSet.has(userSchoolUdise) : true;

      if (schoolStatusFilter === 'ACTIVE' && isSchoolAssigned && !isSchoolActive) {
        return false;
      }
      if (schoolStatusFilter === 'ARCHIVED' && isSchoolAssigned && isSchoolActive) {
        return false;
      }

      // 2. Specific School Filter
      if (selectedSchoolUdise !== 'ALL') {
        if (userSchoolUdise !== selectedSchoolUdise) {
          return false;
        }
      }

      // 3. Role Filter
      if (roleFilter !== 'ALL' && u.role !== roleFilter) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SUSPENDED' && (u.status === 'SUSPENDED' || u.status === 'INACTIVE')) {
          // match
        } else if (u.status !== statusFilter) {
          return false;
        }
      }

      // 5. Approval Filter
      if (approvalFilter !== 'ALL') {
        if (approvalFilter === 'APPROVED' && u.approvalStatus !== 'APPROVED' && u.status !== 'ACTIVE') {
          return false;
        }
        if (approvalFilter === 'PENDING' && u.approvalStatus !== 'PENDING' && u.status !== 'PENDING') {
          return false;
        }
        if (approvalFilter === 'REJECTED' && u.approvalStatus !== 'REJECTED') {
          return false;
        }
      }

      // 6. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const schoolObj = userSchoolUdise ? allSchoolsMap.get(userSchoolUdise) : null;
        const searchPool = [
          u.name,
          u.username,
          u.employeeId,
          u.mobile,
          u.alternateMobile,
          u.email,
          u.designation,
          u.subject,
          u.schoolName,
          schoolObj?.name,
          userSchoolUdise,
          u.role,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!searchPool.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [users, schoolStatusFilter, selectedSchoolUdise, roleFilter, statusFilter, approvalFilter, searchQuery, activeUdiseSet, allSchoolsMap]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Export Handlers (Strictly sans passwords)
  const getExportPayload = () => {
    const headers = [
      'क्र.',
      'उपयोगकर्ता नाम',
      'यूज़रनेम',
      'भूमिका (Role)',
      'कर्मचारी / UDISE कोड',
      'संस्था / विद्यालय',
      'शाला UDISE',
      'मोबाइल नंबर',
      'पदनाम',
      'खाता स्थिति',
      'पंजीकरण दिनांक',
    ];

    const rows = filteredUsers.map((u, idx) => {
      const userSchoolUdise = u.schoolUdise || u.assignedSchoolUdise;
      const sObj = userSchoolUdise ? allSchoolsMap.get(userSchoolUdise) : null;
      const schoolDisplay = sObj ? `${sObj.name} (${sObj.village})` : u.schoolName || 'संकुल केंद्र मलगुवां';

      let statusDisplay = 'सक्रिय';
      if (u.status === 'PENDING') statusDisplay = 'लंबित अनुमोदन';
      else if (u.status === 'SUSPENDED' || u.status === 'INACTIVE') statusDisplay = 'निष्क्रिय / निलंबित';

      return [
        idx + 1,
        u.name,
        u.username,
        u.role,
        u.employeeId || '—',
        schoolDisplay,
        userSchoolUdise || 'मलगुवां',
        u.mobile || '—',
        u.designation || '—',
        statusDisplay,
        u.createdAt || '2025-01-01',
      ];
    });

    return {
      title: 'संकुल पंजीकृत उपयोगकर्ता डायरेक्टरी (Cluster User Directory)',
      subtitle: `संकुल केंद्र: शासकीय उच्चतर माध्यमिक विद्यालय मलगुवां | कुल उपयोगकर्ता: ${filteredUsers.length}`,
      headers,
      rows,
      fileName: 'Sankul_User_Directory',
      orientation: 'landscape' as const,
      summaryMetrics: [
        { label: 'कुल उपयोगकर्ता', value: metrics.total },
        { label: 'सक्रिय खाते', value: metrics.active },
        { label: 'लंबित अनुमोदन', value: metrics.pending },
        { label: 'निष्क्रिय खाते', value: metrics.inactive },
        { label: 'प्रशासक (ADMIN)', value: metrics.admin },
        { label: 'जन शिक्षक (CAC)', value: metrics.cac },
        { label: 'संस्था खाते (SCHOOL)', value: metrics.school },
      ],
    };
  };

  const handleExportCSV = () => {
    exportToCSV(getExportPayload());
    showFeedback('उपयोगकर्ता डायरेक्टरी CSV फ़ाइल डाउनलोड हो गई है।', 'success');
  };

  const handleExportExcel = () => {
    exportToExcel(getExportPayload());
    showFeedback('उपयोगकर्ता डायरेक्टरी Excel फ़ाइल डाउनलोड हो गई है।', 'success');
  };

  const handlePrintDirectory = () => {
    printReport(getExportPayload(), { orientation: 'landscape' });
  };

  // Quick Action Handlers
  const handleQuickApprove = async (user: User) => {
    const res = await approveUser(user.id);
    if (res.success) {
      showFeedback(res.message, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleOpenRejectDialog = (user: User) => {
    setUserToReject(user);
    setRejectReason('');
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!userToReject) return;
    const res = await rejectUser(userToReject.id, rejectReason || 'प्रशासक द्वारा आवेदन अस्वीकृत');
    setIsRejectDialogOpen(false);
    setUserToReject(null);
    if (res.success) {
      showFeedback(res.message, 'info');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleOpenDeactivateDialog = (user: User) => {
    if (user.id === currentUser?.id || user.username === currentUser?.username) {
      showFeedback('सुरक्षा प्रतिबंध: आप स्वयं का सक्रिय खाता निष्क्रिय नहीं कर सकते।', 'error');
      return;
    }
    if (currentUser?.role === 'CAC' && user.role === 'ADMIN') {
      showFeedback('सुरक्षा प्रतिबंध: जन शिक्षक (CAC) मुख्य व्यवस्थापक (ADMIN) का खाता निष्क्रिय नहीं कर सकते।', 'error');
      return;
    }
    setUserToDeactivate(user);
    setDeactivateReason('');
    setIsDeactivateDialogOpen(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!userToDeactivate) return;
    if (!deactivateReason.trim()) {
      showFeedback('कृपया खाता निष्क्रिय करने का कारण अवश्य दर्ज करें।', 'error');
      return;
    }
    const res = await deactivateUser(userToDeactivate.id, deactivateReason.trim());
    setIsDeactivateDialogOpen(false);
    setUserToDeactivate(null);
    if (res.success) {
      showFeedback(res.message, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleActivateUser = async (user: User) => {
    const res = await activateUser(user.id, 'प्रशासक द्वारा खाता सक्रियण');
    if (res.success) {
      showFeedback(res.message, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleResetAccess = async (user: User) => {
    const res = await resetUserAccess(user.id);
    if (res.success) {
      showFeedback(res.message, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    const res = await changeUserRole(user.id, newRole);
    if (res.success) {
      showFeedback(res.message, 'success');
    } else {
      showFeedback(res.message, 'error');
    }
  };

  // If unauthenticated or unauthorized role
  if (!isAuthorized) {
    return (
      <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 shadow-sm space-y-4">
        <ShieldAlert className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto" />
        <h3 className="text-lg font-bold text-red-900 dark:text-red-200">
          सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied)
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">
          "संकुल उपयोगकर्ता डायरेक्टरी" मॉड्यूल केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) के लिए अधिकृत है।
          संस्था/शाला उपयोगकर्ता केवल अपनी संस्था के विवरण देखने के लिए अधिकृत हैं।
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-5 ${isEmbedded ? '' : 'p-4 sm:p-6 max-w-7xl mx-auto'}`}>
      {/* Toast Feedback Notification */}
      {actionFeedback && (
        <div
          className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-bold transition-all ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              : actionFeedback.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800'
              : 'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800'
          }`}
        >
          {actionFeedback.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {actionFeedback.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          {actionFeedback.type === 'info' && <Shield className="w-5 h-5 text-blue-600 shrink-0" />}
          <span>{actionFeedback.text}</span>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="ml-2 text-gray-400 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. HEADER SECTION                                            */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#17211C] p-5 sm:p-6 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-10 h-10 rounded-xl bg-[#EAF6F0] dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  संकुल उपयोगकर्ता डायरेक्टरी
                </h1>
                {/* DYNAMIC LIVE COUNT BADGE - NEVER HARDCODED */}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {metrics.total}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                संकुल केंद्र मलगुवां (बलदेवगढ़, टीकमगढ़) के सभी अधिकृत सिस्टम लॉगिन खातों का केंद्रीय नियंत्रण
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Cloud Sync Button */}
          <button
            type="button"
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="क्लाउड फायरस्टोर से लाइव सिंक्रोनाइजेशन"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#0B6B4B]' : ''}`} />
            <span>{isSyncing ? 'सिंक हो रहा...' : 'ताज़ा करें (Sync)'}</span>
          </button>

          {/* Export Center Actions */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 transition-colors"
            title="Excel फ़ॉर्मेट में डाउनलोड करें"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1.5 transition-colors"
            title="CSV फ़ॉर्मेट में डाउनलोड करें"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrintDirectory}
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-[#0B6B4B] hover:bg-[#09573D] text-white flex items-center gap-1.5 shadow-xs transition-colors"
            title="डायरेक्टरी प्रिंट या PDF बनाएं"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>प्रिंट डायरेक्टरी</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DYNAMIC SUMMARY METRIC CARDS (7 LIVE CARDS)              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* 1. Total Users */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('ALL');
            setStatusFilter('ALL');
            setApprovalFilter('ALL');
          }}
          className="p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] text-left hover:border-[#0B6B4B] transition-all group"
        >
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold">कुल उपयोगकर्ता</span>
            <Users className="w-4 h-4 text-gray-400 group-hover:text-[#0B6B4B]" />
          </div>
          <div className="text-xl font-extrabold text-gray-900 dark:text-white font-mono">{metrics.total}</div>
          <div className="text-[10px] text-gray-400 mt-0.5">संकुल मलगुवां अधिकृत</div>
        </button>

        {/* 2. Active Accounts */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('ACTIVE');
            setApprovalFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all group ${
            statusFilter === 'ACTIVE'
              ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold">सक्रिय खाते</span>
            <UserCheck className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 font-mono">{metrics.active}</div>
          <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">सत्यापित लॉगिन</div>
        </button>

        {/* 3. Pending Approval */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('PENDING');
            setApprovalFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all group ${
            statusFilter === 'PENDING'
              ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <span className="text-[11px] font-bold">लंबित अनुमोदन</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-amber-700 dark:text-amber-300 font-mono">{metrics.pending}</div>
          <div className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5">स्वीकृति प्रतीक्षित</div>
        </button>

        {/* 4. Inactive/Suspended */}
        <button
          type="button"
          onClick={() => {
            setStatusFilter('SUSPENDED');
            setApprovalFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all group ${
            statusFilter === 'SUSPENDED'
              ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/40'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[11px] font-bold">निष्क्रिय खाते</span>
            <UserX className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-rose-700 dark:text-rose-300 font-mono">{metrics.inactive}</div>
          <div className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">निलंबित / अक्रिय</div>
        </button>

        {/* 5. ADMIN Role */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('ADMIN');
            setStatusFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all group ${
            roleFilter === 'ADMIN'
              ? 'border-purple-500 bg-purple-50/50 dark:bg-purple-950/40'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] hover:border-purple-400'
          }`}
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <span className="text-[11px] font-bold">ADMIN</span>
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-purple-700 dark:text-purple-300 font-mono">{metrics.admin}</div>
          <div className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5">मुख्य व्यवस्थापक</div>
        </button>

        {/* 6. CAC Role */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('CAC');
            setStatusFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all group ${
            roleFilter === 'CAC'
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
            <span className="text-[11px] font-bold">CAC</span>
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-blue-700 dark:text-blue-300 font-mono">{metrics.cac}</div>
          <div className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5">जन शिक्षक समन्वयक</div>
        </button>

        {/* 7. SCHOOL Role */}
        <button
          type="button"
          onClick={() => {
            setRoleFilter('SCHOOL');
            setStatusFilter('ALL');
          }}
          className={`p-3.5 rounded-xl border text-left transition-all group ${
            roleFilter === 'SCHOOL'
              ? 'border-[#0B6B4B] bg-emerald-50/50 dark:bg-emerald-950/40'
              : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-[#17211C] hover:border-[#0B6B4B]'
          }`}
        >
          <div className="flex items-center justify-between text-[#0B6B4B] dark:text-emerald-400 mb-1">
            <span className="text-[11px] font-bold">SCHOOL</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-xl font-extrabold text-emerald-800 dark:text-emerald-200 font-mono">{metrics.school}</div>
          <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">संस्था लॉगिन खाते</div>
        </button>
      </div>

      {/* ============================================================ */}
      {/* 3. SEARCH & MULTI-DIMENSIONAL FILTER BAR                     */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#17211C] p-4 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="lg:col-span-5 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="खोजें: नाम, यूज़रनेम, कर्मचारी ID, मोबाइल, संस्था, UDISE..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#0B6B4B] focus:bg-white dark:focus:bg-gray-800 outline-hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Role Filter */}
          <div className="lg:col-span-2">
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
            >
              <option value="ALL">सभी भूमिकाएं (All Roles)</option>
              <option value="ADMIN">ADMIN (प्रशासक)</option>
              <option value="CAC">CAC (जन शिक्षक)</option>
              <option value="SCHOOL">SCHOOL (संस्था)</option>
            </select>
          </div>

          {/* Account Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
            >
              <option value="ALL">सभी खाता स्थितियां (All Status)</option>
              <option value="ACTIVE">सक्रिय (Active)</option>
              <option value="PENDING">लंबित (Pending)</option>
              <option value="SUSPENDED">निष्क्रिय / निलंबित (Inactive)</option>
            </select>
          </div>

          {/* School Master Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={schoolStatusFilter}
              onChange={(e) => {
                setSchoolStatusFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
            >
              <option value="ACTIVE">केवल सक्रिय शालाएं (Active Schools - Default)</option>
              <option value="ALL">समस्त शालाएं (सक्रिय + अक्रिय)</option>
              <option value="ARCHIVED">केवल अक्रिय / संग्रहित शालाएं (Archived)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Specific School & Approval */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800/80">
          {/* Specific School Picker */}
          <div className="lg:col-span-7">
            <select
              value={selectedSchoolUdise}
              onChange={(e) => {
                setSelectedSchoolUdise(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
            >
              <option value="ALL">समस्त संस्थाएं / शालाएं (All Schools)</option>
              {schools.map((s) => (
                <option key={s.udise} value={s.udise}>
                  {s.name} ({s.village}) — UDISE: {s.udise}
                </option>
              ))}
            </select>
          </div>

          {/* Approval Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={approvalFilter}
              onChange={(e) => {
                setApprovalFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-[#0B6B4B] outline-hidden"
            >
              <option value="ALL">सभी पंजीकरण स्थितियां</option>
              <option value="APPROVED">स्वीकृत (Approved)</option>
              <option value="PENDING">प्रतीक्षित (Pending)</option>
              <option value="REJECTED">अस्वीकृत (Rejected)</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="lg:col-span-2 flex items-center justify-end">
            {(searchQuery ||
              roleFilter !== 'ALL' ||
              statusFilter !== 'ALL' ||
              schoolStatusFilter !== 'ACTIVE' ||
              selectedSchoolUdise !== 'ALL' ||
              approvalFilter !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                  setSchoolStatusFilter('ACTIVE');
                  setSelectedSchoolUdise('ALL');
                  setApprovalFilter('ALL');
                  setCurrentPage(1);
                }}
                className="w-full py-2 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-900/60 transition-colors flex items-center justify-center gap-1"
              >
                <X className="w-3.5 h-3.5" />
                <span>फ़िल्टर हटाएं</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4. MAIN USER DIRECTORY TABLE                                 */}
      {/* ============================================================ */}
      <div className="bg-white dark:bg-[#17211C] rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              प्रदर्शित रिकॉर्ड: {filteredUsers.length} में से {paginatedUsers.length}
            </span>
            {schoolStatusFilter === 'ACTIVE' && (
              <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-300 px-2 py-0.5 rounded font-bold">
                सक्रिय शालाएं
              </span>
            )}
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>प्रति पृष्ठ:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
            >
              <option value={15}>15</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-[#0F1713] text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 font-bold w-12 text-center">क्र.</th>
                <th className="p-3 font-bold">उपयोगकर्ता विवरण</th>
                <th className="p-3 font-bold">यूज़रनेम</th>
                <th className="p-3 font-bold text-center">भूमिका</th>
                <th className="p-3 font-bold">पद एवं संस्था (School / Post)</th>
                <th className="p-3 font-bold">UDISE कोड</th>
                <th className="p-3 font-bold">मोबाइल नंबर</th>
                <th className="p-3 font-bold text-center">खाता स्थिति</th>
                <th className="p-3 font-bold">पंजीकरण</th>
                <th className="p-3 font-bold text-center">कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-gray-400 dark:text-gray-500">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400">कोई उपयोगकर्ता नहीं मिला</p>
                    <p className="text-xs text-gray-400 mt-1">दिए गए खोज या फ़िल्टर मापदंडों के अनुसार कोई खाता उपलब्ध नहीं है।</p>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, idx) => {
                  const serialNo = (currentPage - 1) * itemsPerPage + idx + 1;
                  const userSchoolUdise = u.schoolUdise || u.assignedSchoolUdise;
                  const sObj = userSchoolUdise ? allSchoolsMap.get(userSchoolUdise) : null;
                  const isSchoolArchived = userSchoolUdise ? !activeUdiseSet.has(userSchoolUdise) : false;

                  const roleBadgeColor =
                    u.role === 'ADMIN'
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200'
                      : u.role === 'CAC'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200';

                  const isPending = u.status === 'PENDING' || u.approvalStatus === 'PENDING';
                  const isSuspended = u.status === 'SUSPENDED' || u.status === 'INACTIVE';

                  return (
                    <tr
                      key={u.id || u.username}
                      className="hover:bg-gray-50/80 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Serial */}
                      <td className="p-3 text-center text-gray-400 font-mono">{serialNo}</td>

                      {/* User Details */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-600 text-white'
                                : u.role === 'CAC'
                                ? 'bg-blue-600 text-white'
                                : 'bg-[#0B6B4B] text-white'
                            }`}
                          >
                            {u.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSchoolArchived && (
                                <span className="text-[9px] px-1.5 py-0.2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded font-bold">
                                  संग्रहित शाला
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-gray-500 dark:text-gray-400">
                              {u.employeeId ? `कर्मचारी ID: ${u.employeeId}` : u.designation || 'अधिकृत उपयोगकर्ता'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Username */}
                      <td className="p-3 font-mono">
                        <div className="flex items-center gap-1 text-gray-800 dark:text-gray-200 font-medium">
                          <span>{u.username}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(u.username, `user-${u.id}`)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                            title="यूज़रनेम कॉपी करें"
                          >
                            {copiedField === `user-${u.id}` ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="p-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadgeColor}`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Post & School */}
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {sObj ? `${sObj.name}` : u.schoolName || 'संकुल केंद्र मलगुवां'}
                        </div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {sObj?.village ? `ग्राम: ${sObj.village}` : u.designation || 'संकुल समन्वय'}
                        </div>
                      </td>

                      {/* UDISE Code */}
                      <td className="p-3 font-mono text-gray-700 dark:text-gray-300">
                        {userSchoolUdise ? (
                          <div className="flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-400">
                            <span>{userSchoolUdise}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(userSchoolUdise, `udise-${u.id}`)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="UDISE कॉपी करें"
                            >
                              {copiedField === `udise-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">मलगुवां (संकुल)</span>
                        )}
                      </td>

                      {/* Mobile */}
                      <td className="p-3 font-mono text-gray-600 dark:text-gray-400">
                        {u.mobile ? (
                          <div className="flex items-center gap-1">
                            <span>{u.mobile}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.mobile || '', `mob-${u.id}`)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="मोबाइल नंबर कॉपी करें"
                            >
                              {copiedField === `mob-${u.id}` ? (
                                <Check className="w-3 h-3 text-emerald-600" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200">
                            <Clock className="w-3 h-3" />
                            <span>लंबित</span>
                          </span>
                        ) : isSuspended ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200">
                            <XCircle className="w-3 h-3" />
                            <span>निष्क्रिय</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>सक्रिय</span>
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="p-3 font-mono text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {u.createdAt || '2025-01-01'}
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Quick View Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForView(u)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                            title="उपयोगकर्ता प्रोफ़ाइल विवरण देखें"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Manage Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedUserForManage(u)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-[#0B6B4B] dark:text-emerald-400 transition-colors"
                            title="खाता प्रबंधन एवं सेटिंग्स"
                          >
                            <SettingsIcon className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Approval / Rejection if pending */}
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleQuickApprove(u)}
                                className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors"
                                title="आवेदन स्वीकृत करें"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenRejectDialog(u)}
                                className="p-1.5 rounded-lg bg-rose-100 text-rose-800 hover:bg-rose-200 transition-colors"
                                title="आवेदन अस्वीकृत करें"
                              >
                                <XCircle className="w-3.5 h-3.5 text-rose-700" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="text-gray-500 dark:text-gray-400">
            पृष्ठ {currentPage} / {totalPages} (कुल {filteredUsers.length} रिकॉर्ड)
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-gray-700 dark:text-gray-300">
              {currentPage}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 disabled:opacity-40 hover:bg-gray-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 5. VIEW PROFILE DRAWER / MODAL                               */}
      {/* ============================================================ */}
      {selectedUserForView && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-5 my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#0B6B4B] text-white flex items-center justify-center text-xl font-bold">
                  {selectedUserForView.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {selectedUserForView.name}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedUserForView.role === 'ADMIN'
                          ? 'bg-purple-100 text-purple-800'
                          : selectedUserForView.role === 'CAC'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {selectedUserForView.role}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-gray-500 mt-0.5">
                    @{selectedUserForView.username} • UID: {selectedUserForView.id}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserForView(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Detail Grid */}
            <div className="space-y-4 text-xs">
              {/* Basic Details Box */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#0B6B4B]" />
                  <span>व्यक्तिगत एवं पद विवरण (Basic Profile)</span>
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800/40 rounded-xl p-3.5 border border-gray-100 dark:border-gray-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block text-[11px]">कर्मचारी / लॉगिन आईडी:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                      {selectedUserForView.employeeId || selectedUserForView.username}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">पदनाम (Designation):</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">
                      {selectedUserForView.designation || 'उपलब्ध नहीं'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">प्राथमिक संपर्क मोबाइल:</span>
                    <span className="font-mono font-bold text-gray-800 dark:text-gray-200">
                      {selectedUserForView.mobile || 'उपलब्ध नहीं'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">वैकल्पिक मोबाइल / ईमेल:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">
                      {selectedUserForView.email || selectedUserForView.alternateMobile || 'उपलब्ध नहीं'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">खाता स्थिति:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedUserForView.status === 'ACTIVE'
                        ? 'सक्रिय (ACTIVE)'
                        : selectedUserForView.status === 'PENDING'
                        ? 'लंबित अनुमोदन (PENDING)'
                        : 'निलंबित / निष्क्रिय (SUSPENDED)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">पंजीकरण दिनांक:</span>
                    <span className="font-mono text-gray-700 dark:text-gray-300">
                      {selectedUserForView.createdAt || '2025-01-01'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Institution / School Details */}
              <div>
                <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#0B6B4B]" />
                  <span>संस्था एवं संकुल विवरण (Institution & Cluster)</span>
                </h4>
                <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-3.5 border border-emerald-100 dark:border-emerald-900/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-gray-500 block text-[11px]">संस्था का नाम:</span>
                    <span className="font-bold text-gray-900 dark:text-white">
                      {selectedUserForView.schoolName ||
                        allSchoolsMap.get(selectedUserForView.assignedSchoolUdise || '')?.name ||
                        'संकुल केंद्र शासकीय उच्चतर माध्यमिक विद्यालय मलगुवां'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">शाला UDISE कोड:</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {selectedUserForView.schoolUdise || selectedUserForView.assignedSchoolUdise || 'मलगुवां'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">संकुल / विकासखंड:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">मलगुवां • बलदेवगढ़</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[11px]">जिला एवं पिन कोड:</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">टीकमगढ़ (म.प्र.) - 472115</span>
                  </div>
                </div>
              </div>

              {/* Security & Access Protection Box */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">सुरक्षा प्रोटोकॉल सूचना:</span>
                  उपयोगकर्ता के पासवर्ड शासकीय सुरक्षा एवं गोपनीयता मानकों के तहत इंक्रिप्टेड रखे जाते हैं। पासवर्ड केवल अधिकृत सत्यापन उपरांत उपयोगकर्ता द्वारा स्वयं बदला जा सकता है।
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedUserForManage(selectedUserForView);
                  setSelectedUserForView(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 flex items-center gap-1.5"
              >
                <SettingsIcon className="w-3.5 h-3.5" />
                <span>खाता प्रबंधित करें</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedUserForView(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-[#0B6B4B] text-white hover:bg-[#09573D]"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. MANAGE USER MODAL DIALOG                                  */}
      {/* ============================================================ */}
      {selectedUserForManage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-gray-200 dark:border-gray-800 space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    उपयोगकर्ता खाता प्रबंधन (User Management)
                  </h3>
                  <p className="text-xs text-gray-500">
                    {selectedUserForManage.name} (@{selectedUserForManage.username})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserForManage(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Account Status Card */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-gray-500 block text-[11px]">वर्तमान खाता स्थिति:</span>
                  <span className="font-bold text-sm text-gray-900 dark:text-white">
                    {selectedUserForManage.status === 'ACTIVE'
                      ? 'सक्रिय (ACTIVE)'
                      : selectedUserForManage.status === 'PENDING'
                      ? 'लंबित अनुमोदन (PENDING)'
                      : 'निष्क्रिय / निलंबित (SUSPENDED)'}
                  </span>
                </div>

                <div>
                  {selectedUserForManage.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenDeactivateDialog(selectedUserForManage);
                        setSelectedUserForManage(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                    >
                      <UserX className="w-3.5 h-3.5" />
                      <span>खाता निष्क्रिय करें</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        await handleActivateUser(selectedUserForManage);
                        setSelectedUserForManage(null);
                      }}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors flex items-center gap-1"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>खाता सक्रिय करें</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Role Change (Restricted to Admin with privilege escalation guards) */}
              {currentUser?.role === 'ADMIN' && (
                <div className="p-3.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200 dark:border-purple-800 space-y-2">
                  <div className="font-bold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>भूमिका परिवर्तन (Role Assignment - Admin Only)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedUserForManage.role}
                      onChange={(e) => handleChangeRole(selectedUserForManage, e.target.value as UserRole)}
                      className="px-3 py-1.5 text-xs rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-bold"
                    >
                      <option value="SCHOOL">SCHOOL (संस्था लॉगिन)</option>
                      <option value="CAC">CAC (जन शिक्षक / संकुल समन्वयक)</option>
                      <option value="ADMIN">ADMIN (मुख्य व्यवस्थापक)</option>
                    </select>
                    <span className="text-[10px] text-gray-500">
                      बदलने पर उपयोगकर्ता की सभी अनुमतियां तुरंत अद्यतन हो जाएंगी।
                    </span>
                  </div>
                </div>
              )}

              {/* Session Access Reset */}
              <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                <div>
                  <div className="font-bold text-blue-900 dark:text-blue-200">एक्सेस एवं सत्र रीसेट</div>
                  <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                    सक्रिय टोकन अमान्य कर उपयोगकर्ता को पुनः लॉगिन के लिए बाध्य करें।
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await handleResetAccess(selectedUserForManage);
                    setSelectedUserForManage(null);
                  }}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
                >
                  रीसेट करें
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedUserForManage(null)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300"
              >
                बंद करें
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. DEACTIVATE CONFIRMATION MODAL                             */}
      {/* ============================================================ */}
      {isDeactivateDialogOpen && userToDeactivate && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-200 dark:border-rose-800 space-y-4 my-8">
            <div className="flex items-center gap-2.5 text-rose-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                खाता निष्क्रिय करें (Deactivate Account)
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              क्या आप उपयोगकर्ता <strong>{userToDeactivate.name}</strong> (@{userToDeactivate.username}) का लॉगिन एक्सेस निष्क्रिय करना चाहते हैं?
              खाता निष्क्रिय होने के बाद यह उपयोगकर्ता सिस्टम में लॉगिन नहीं कर सकेगा।
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                निष्क्रिय करने का कारण (अनिवार्य) *
              </label>
              <textarea
                rows={3}
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                placeholder="उदा. पदोन्नति/स्थानांतरण, सेवा निवृत्ति, अनधिकृत प्रयास, संस्था परिवर्तन..."
                className="w-full p-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeactivateDialogOpen(false);
                  setUserToDeactivate(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 dark:text-gray-300"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmDeactivate}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                निष्क्रिय करें (Confirm)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. REJECT CONFIRMATION MODAL                                 */}
      {/* ============================================================ */}
      {isRejectDialogOpen && userToReject && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto no-print">
          <div className="bg-white dark:bg-[#17211C] rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-rose-200 dark:border-rose-800 space-y-4 my-8">
            <div className="flex items-center gap-2.5 text-rose-600">
              <XCircle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                आवेदन अस्वीकृत करें (Reject Application)
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              क्या आप <strong>{userToReject.name}</strong> (@{userToReject.username}) का पंजीकरण आवेदन अस्वीकृत करना चाहते हैं?
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                अस्वीकृति का कारण (Optional)
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="उदा. संस्था विवरण मिसमैच, अमान्य कर्मचारी आईडी..."
                className="w-full p-2.5 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRejectDialogOpen(false);
                  setUserToReject(null);
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 text-gray-700 dark:text-gray-300"
              >
                रद्द करें
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs"
              >
                अस्वीकृत करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
