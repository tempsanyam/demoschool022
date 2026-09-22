import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Bell,
  Sun,
  Moon,
  School as SchoolIcon,
  LogOut,
  User as UserIcon,
  Menu,
  ChevronDown,
  PlusCircle,
  Calendar,
  Printer,
  Phone,
  MessageSquare,
  GraduationCap,
  Users,
  Utensils,
  AlertTriangle,
  Settings,
  X,
  Key,
  FileText,
  Cloud,
  CloudOff,
  RefreshCw,
  ShieldAlert,
  WifiOff,
  KeyRound,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useTheme } from '../../context/ThemeContext';
import { institutionConfig } from '../../config/institutionConfig';

interface HeaderProps {
  onOpenGlobalSearch: () => void;
  onOpenMobileSidebar: () => void;
  onNavigate: (viewId: string) => void;
  onOpenLogoutDialog: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGlobalSearch,
  onOpenMobileSidebar,
  onNavigate,
  onOpenLogoutDialog,
}) => {
  const { currentUser, firebaseUser, firebaseAuthStatus, firebaseAuthError, retryFirebaseAuth } = useAuth();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    notifications,
    settings,
    academicSessions,
    visibleAcademicSessions,
    selectedSessionId,
    setSelectedSessionId,
    activeSessionId,
    isCurrentSessionSelected,
    isCloudConnected,
    cloudSyncStatus,
    triggerManualCloudSync,
    connectivityState,
    checkCloudConnectivity,
  } = useData();
  const { theme, toggleTheme } = useTheme();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNewEntryMenu, setShowNewEntryMenu] = useState(false);
  const [showCloudDetails, setShowCloudDetails] = useState(false);
  const [isRetryingAuth, setIsRetryingAuth] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const newEntryRef = useRef<HTMLDivElement>(null);
  const cloudDetailsRef = useRef<HTMLDivElement>(null);

  const activeSession = selectedSessionId || settings?.academicSession || institutionConfig.academicSession;

  const schoolTypeSummary = useMemo(() => {
    const ps = schools.filter((s) => s.schoolType?.includes('प्राथमिक')).length;
    const ms = schools.filter((s) => s.schoolType === 'माध्यमिक').length;
    const hs = schools.filter(
      (s) => s.schoolType === 'हाई स्कूल' || s.schoolType === 'उच्चतर माध्यमिक' || s.schoolType?.includes('हाई स्कूल')
    ).length;
    return { ps, ms, hs, total: schools.length };
  }, [schools]);

  // Keyboard shortcut Ctrl+K / Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onOpenGlobalSearch();
      }
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
        setShowNewEntryMenu(false);
        setShowCloudDetails(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenGlobalSearch]);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (newEntryRef.current && !newEntryRef.current.contains(e.target as Node)) {
        setShowNewEntryMenu(false);
      }
      if (cloudDetailsRef.current && !cloudDetailsRef.current.contains(e.target as Node)) {
        setShowCloudDetails(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadNotifs = notifications.filter(
    (n) => currentUser && !n.readBy.includes(currentUser.id)
  );

  const canSwitchSchools =
    currentUser?.role === 'CAC' ||
    currentUser?.role === 'ADMIN';

  return (
    <header className="w-full flex flex-col no-print z-40 relative">
      {/* ========================================================================= */}
      {/* 1. TOP OFFICIAL INSTITUTIONAL HEADER (White / Dark Neutral)                */}
      {/* ========================================================================= */}
      <div className="w-full bg-[#FFFFFF] dark:bg-[#101815] border-b border-[#DDE7E2] dark:border-[#1E2D27] px-3 sm:px-4 md:px-6 py-2.5 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2.5 sm:gap-3">
          
          {/* Left: Emblem & Official Institutional Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-start min-w-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              {/* Sankul Logo / SSA Emblem */}
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-b from-emerald-50 to-teal-50 dark:from-emerald-950/70 dark:to-teal-950/40 border border-emerald-300 dark:border-emerald-700/80 flex flex-col items-center justify-center p-1 shadow-2xs shrink-0 text-center">
                <span className="text-lg sm:text-xl leading-none">🏛️</span>
                <span className="text-[7px] sm:text-[7.5px] font-black text-[#0B6B4B] dark:text-emerald-300 uppercase tracking-tighter mt-0.5">
                  संकुल
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/60">
                    {institutionConfig.department || 'स्कूल शिक्षा विभाग, म.प्र.'}
                  </span>
                </div>
                <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-[#0B6B4B] dark:text-emerald-400 tracking-tight leading-tight truncate">
                  {institutionConfig.institutionName}
                </h1>
                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 font-medium truncate">
                  विकास खंड {institutionConfig.block} • जिला {institutionConfig.district} • {institutionConfig.state}
                </p>
              </div>
            </div>

            {/* Mobile Header Menu Button */}
            <div className="flex lg:hidden items-center gap-1.5 shrink-0">
              <button
                onClick={onOpenMobileSidebar}
                className="p-2 rounded-xl bg-[#0B6B4B] hover:bg-[#08553B] active:bg-[#074731] text-white shadow-2xs transition-colors"
                title="नेविगेशन मेन्यू खोलें"
                aria-label="नेविगेशन मेन्यू खोलें"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Right: CAC Information & Helpline Badges (Hidden on mobile, visible on md+) */}
          <div className="hidden md:flex items-center gap-2 lg:gap-2.5 flex-wrap justify-end shrink-0">
            {/* CAC 1: संजय कुमार जैन */}
            <div className="bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 rounded-xl px-2.5 py-1.5 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2 shadow-2xs">
              <div className="flex items-center gap-1 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                <span>सी.ए.सी.: {institutionConfig.cac1.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                <a
                  href={`tel:${institutionConfig.cac1.mobile}`}
                  className="flex items-center gap-0.5 text-blue-700 dark:text-blue-400 hover:underline font-semibold"
                  title="कॉल करें"
                >
                  <Phone className="w-3 h-3" /> {institutionConfig.cac1.mobile}
                </a>
                <span className="text-amber-300 dark:text-amber-700">|</span>
                <a
                  href={`https://wa.me/91${institutionConfig.cac1.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-0.5 text-emerald-700 dark:text-emerald-400 hover:underline font-semibold"
                  title="व्हाट्सएप संदेश भेजें"
                >
                  <MessageSquare className="w-3 h-3" /> WA: {institutionConfig.cac1.whatsapp}
                </a>
              </div>
            </div>

            {/* CAC 2: सन्मति कुमार जैन */}
            <div className="hidden xl:flex bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-2.5 py-1.5 text-xs text-emerald-900 dark:text-emerald-200 items-center gap-2 shadow-2xs">
              <div className="flex items-center gap-1 font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>सी.ए.सी.: {institutionConfig.cac2.name}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] shrink-0">
                <a
                  href={`tel:${institutionConfig.cac2.mobile}`}
                  className="flex items-center gap-0.5 text-blue-700 dark:text-blue-400 hover:underline font-semibold"
                  title="कॉल करें"
                >
                  <Phone className="w-3 h-3" /> {institutionConfig.cac2.mobile}
                </a>
              </div>
            </div>

            {/* Sub Padhein Sub Badhein Emblem */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-b from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border border-amber-300 dark:border-amber-600 flex flex-col items-center justify-center p-0.5 shadow-2xs text-center shrink-0">
              <span className="text-xs leading-none">✏️</span>
              <span className="text-[6px] font-black text-amber-700 dark:text-amber-300 leading-tight">
                सब पढ़ें
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN GREEN RESPONSIVE ACTION & NAVIGATION BAR                         */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-40 bg-[#0B6B4B] text-white shadow-md transition-colors w-full">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-2">
          
          {/* ===================================================================== */}
          {/* 2A. DESKTOP LAYOUT (lg: 1024px+) - Single Perfectly Aligned Row      */}
          {/* ===================================================================== */}
          <div className="hidden lg:flex items-center justify-between gap-3 w-full">
            
            {/* Left Group: CAC Panel & School Selector */}
            <div className="flex items-center gap-2 min-w-0 shrink-0">
              {/* Panel Button (ADMIN / CAC / SCHOOL) */}
              <button
                onClick={() => {
                  if (canSwitchSchools) {
                    setSelectedSchoolUdise('');
                  }
                  onNavigate('dashboard');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#08553B] hover:bg-[#074731] border border-emerald-400/30 text-white text-xs font-bold shadow-2xs transition-all shrink-0 cursor-pointer whitespace-nowrap"
                title={currentUser?.role === 'ADMIN' ? 'Admin Panel' : currentUser?.role === 'SCHOOL' ? 'School Panel' : 'CAC Panel'}
              >
                <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse"></span>
                <span>{currentUser?.role === 'ADMIN' ? 'Admin Panel' : currentUser?.role === 'SCHOOL' ? 'School Panel' : 'CAC Panel'}</span>
              </button>

              {/* School Selector Dropdown */}
              {canSwitchSchools ? (
                <div className="relative min-w-0 w-56 xl:w-64">
                  <select
                    value={selectedSchoolUdise}
                    onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                    aria-label="विद्यालय चुनें"
                    className="w-full bg-[#074731] hover:bg-[#063B29] text-emerald-100 font-semibold text-xs border border-emerald-400/40 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 cursor-pointer truncate"
                  >
                    <option value="">🏫 समस्त {schools.length} संकुल शालाएं</option>
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise} className="bg-white text-gray-900">
                        {s.name || s.hindiName} ({s.village})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-[#074731] text-emerald-100 text-xs px-3 py-1.5 rounded-lg border border-emerald-400/40 font-semibold shadow-2xs">
                  <SchoolIcon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                  <span className="truncate max-w-[180px] text-white">
                    {selectedSchool?.name || selectedSchool?.hindiName || 'मेरा विद्यालय'}
                  </span>
                  <span className="font-mono text-[10px] bg-[#063B29] text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/30">
                    {selectedSchool?.udise}
                  </span>
                </div>
              )}
            </div>

            {/* Center: Global Search Bar */}
            <div className="flex-1 min-w-[160px] max-w-md mx-2">
              <div
                onClick={onOpenGlobalSearch}
                className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-emerald-100 text-xs hover:border-emerald-300 transition-colors cursor-pointer group shadow-2xs"
                role="button"
                tabIndex={0}
                aria-label="वैश्विक खोज (Ctrl + K)"
              >
                <Search className="w-3.5 h-3.5 text-emerald-200 group-hover:text-white shrink-0" />
                <span className="truncate text-emerald-100/90 text-xs">
                  खोजें: UDISE, शाला, छात्र, शिक्षक, शिकायत...
                </span>
                <kbd className="ml-auto bg-black/25 border border-white/20 rounded px-1.5 py-0.2 text-[9px] text-emerald-200 font-mono shrink-0">
                  Ctrl + K
                </kbd>
              </div>
            </div>

            {/* Right Group: Actions, Session, New Entry, Export, Theme, Notifications & Profile */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Academic Session Switcher Dropdown */}
              <div className="relative flex items-center">
                <div className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition-all ${
                  !isCurrentSessionSelected
                    ? 'bg-amber-500 text-gray-950 font-black ring-2 ring-amber-300 shadow-sm'
                    : 'bg-[#08553B] text-emerald-100 border border-emerald-400/40'
                }`}>
                  <Calendar className={`w-3.5 h-3.5 shrink-0 ${!isCurrentSessionSelected ? 'text-gray-950' : 'text-[#FF7A00]'}`} />
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    aria-label="शैक्षणिक सत्र चुनें"
                    className={`bg-transparent font-bold text-xs focus:outline-none cursor-pointer pr-1 ${
                      !isCurrentSessionSelected ? 'text-gray-950 font-black' : 'text-emerald-100'
                    }`}
                    title={!isCurrentSessionSelected ? `विगत सत्र ${selectedSessionId} (अभिलेख केवल पठन हेतु)` : `सक्रिय सत्र ${selectedSessionId}`}
                  >
                    {visibleAcademicSessions.map((session) => (
                      <option key={session.id} value={session.id} className="bg-white text-gray-900 font-medium">
                        {session.isCurrent ? `★ सत्र ${session.sessionName || session.name || session.id} (वर्तमान सक्रिय)` : `सत्र ${session.sessionName || session.name || session.id} (${session.status === 'LOCKED' ? '🔒 लॉक' : session.status === 'UPCOMING' ? 'भविष्य' : 'विगत'})`}
                      </option>
                    ))}
                  </select>
                </div>
                {!isCurrentSessionSelected && (
                  <span className="hidden 2xl:inline-flex ml-1.5 items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-1 rounded shadow-xs animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                    पुराना सत्र (ReadOnly)
                  </span>
                )}
              </div>

              {/* + New Entry Shortcut Menu */}
              <div className="relative" ref={newEntryRef}>
                <button
                  onClick={() => setShowNewEntryMenu(!showNewEntryMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FF7A00] hover:bg-[#e06c00] active:bg-[#c96100] text-white text-xs font-bold shadow-xs transition-all cursor-pointer whitespace-nowrap"
                  title="त्वरित नई प्रविष्टि"
                  aria-label="त्वरित नई प्रविष्टि"
                >
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>+ नई प्रविष्टि</span>
                </button>

                {showNewEntryMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#16221D] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-1.5 z-50 text-xs text-gray-800 dark:text-gray-200 divide-y divide-gray-100 dark:divide-gray-800 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      त्वरित प्रविष्टि मेन्यू
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowNewEntryMenu(false);
                          onNavigate('students');
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#EAF6F0] dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium"
                      >
                        <GraduationCap className="w-4 h-4 text-[#0B6B4B]" />
                        नया विद्यार्थी दर्ज करें
                      </button>
                      <button
                        onClick={() => {
                          setShowNewEntryMenu(false);
                          onNavigate('teachers');
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#EAF6F0] dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium"
                      >
                        <Users className="w-4 h-4 text-[#0B6B4B]" />
                        नया शिक्षक / स्टाफ जोड़ें
                      </button>
                      <button
                        onClick={() => {
                          setShowNewEntryMenu(false);
                          onNavigate('attendance');
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#EAF6F0] dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium"
                      >
                        <Calendar className="w-4 h-4 text-[#0B6B4B]" />
                        दैनिक उपस्थिति भरें
                      </button>
                      <button
                        onClick={() => {
                          setShowNewEntryMenu(false);
                          onNavigate('mdm');
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#EAF6F0] dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium"
                      >
                        <Utensils className="w-4 h-4 text-[#FF7A00]" />
                        आज का MDM वितरण
                      </button>
                      <button
                        onClick={() => {
                          setShowNewEntryMenu(false);
                          onNavigate('complaints');
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2.5 hover:bg-[#EAF6F0] dark:hover:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium"
                      >
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        शिकायत दर्ज करें
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Cloud Database Live Sync Indicator & Diagnostics */}
              <div className="relative" ref={cloudDetailsRef}>
                <button
                  onClick={() => {
                    setShowCloudDetails((prev) => !prev);
                    checkCloudConnectivity();
                  }}
                  className={`p-1.5 px-2.5 py-1.5 rounded-lg border text-white transition-all flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
                    connectivityState.status === 'connected'
                      ? 'bg-emerald-900/60 border-emerald-400/40 hover:bg-emerald-900/80 text-emerald-100'
                      : connectivityState.status === 'syncing'
                      ? 'bg-blue-900/60 border-blue-400/40 hover:bg-blue-900/80 text-blue-100'
                      : connectivityState.status === 'initializing'
                      ? 'bg-amber-900/60 border-amber-400/40 hover:bg-amber-900/80 text-amber-100'
                      : connectivityState.status === 'auth_required' || connectivityState.status === 'auth_error'
                      ? 'bg-amber-950/70 border-amber-400/60 hover:bg-amber-900/80 text-amber-200'
                      : connectivityState.status === 'permission_denied'
                      ? 'bg-red-950/70 border-red-400/60 hover:bg-red-900/80 text-red-200'
                      : connectivityState.status === 'unavailable'
                      ? 'bg-amber-900/70 border-amber-400/50 hover:bg-amber-900/90 text-amber-200'
                      : 'bg-gray-800/80 border-gray-600/40 hover:bg-gray-800 text-gray-200'
                  }`}
                  title={`${connectivityState.statusLabel} - विस्तृत स्थिति देखने के लिए क्लिक करें`}
                  aria-label="क्लाउड डेटाबेस स्थिति"
                >
                  {connectivityState.status === 'connected' ? (
                    <>
                      <Cloud className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
                      <span className="hidden md:inline">क्लाउड लाइव</span>
                    </>
                  ) : connectivityState.status === 'syncing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-blue-200 animate-spin" />
                      <span className="hidden md:inline">सिंक जारी...</span>
                    </>
                  ) : connectivityState.status === 'initializing' ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 text-amber-200 animate-spin" />
                      <span className="hidden md:inline">कनेक्टिंग...</span>
                    </>
                  ) : connectivityState.status === 'auth_required' ? (
                    <>
                      <KeyRound className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden md:inline">प्रमाणीकरण आवश्यक</span>
                    </>
                  ) : connectivityState.status === 'auth_error' ? (
                    <>
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden md:inline">Auth Provider</span>
                    </>
                  ) : connectivityState.status === 'permission_denied' ? (
                    <>
                      <ShieldAlert className="w-3.5 h-3.5 text-red-300" />
                      <span className="hidden md:inline">अनुमति त्रुटि</span>
                    </>
                  ) : connectivityState.status === 'unavailable' ? (
                    <>
                      <CloudOff className="w-3.5 h-3.5 text-amber-300" />
                      <span className="hidden md:inline">क्लाउड अनुपलब्ध</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3.5 h-3.5 text-gray-400" />
                      <span className="hidden md:inline">नेटवर्क ऑफलाइन</span>
                    </>
                  )}
                </button>

                {/* Granular Connectivity Diagnostic Dropdown */}
                {showCloudDetails && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-3 px-4 z-50 text-gray-800 dark:text-gray-200 text-xs">
                    <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-bold text-sm text-gray-900 dark:text-white">क्लाउड कनेक्शन स्थिति</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        connectivityState.status === 'connected'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : connectivityState.status === 'offline'
                          ? 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
                          : connectivityState.status === 'permission_denied'
                          ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950/40 dark:text-red-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}>
                        {connectivityState.statusLabel}
                      </span>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60">
                        <span className="text-gray-500 dark:text-gray-400">इंटरनेट कनेक्टिविटी:</span>
                        <span className="font-medium flex items-center gap-1.5">
                          {connectivityState.isBrowserOnline ? (
                            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> ऑनलाइन (Online)
                            </span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                              <WifiOff className="w-3.5 h-3.5" /> ऑफ़लाइन (Offline)
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60">
                        <span className="text-gray-500 dark:text-gray-400">Firebase Auth सत्र:</span>
                        <span className="font-medium text-right truncate max-w-[180px]">
                          {firebaseUser ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-[11px]" title={firebaseUser.uid}>
                              {firebaseUser.uid.substring(0, 10)}...
                            </span>
                          ) : firebaseAuthStatus === 'error' && firebaseAuthError === 'auth/operation-not-allowed' ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Provider अक्षम (Console)
                            </span>
                          ) : firebaseAuthStatus === 'initializing' ? (
                            <span className="text-amber-600 dark:text-amber-400">सत्यापन जारी...</span>
                          ) : (
                            <span className="text-gray-500">अप्रमाणित (Not Authenticated)</span>
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60">
                        <span className="text-gray-500 dark:text-gray-400">Firestore Project:</span>
                        <span className="font-mono text-[11px] text-gray-700 dark:text-gray-300">
                          celestial-byway-ft8c4
                        </span>
                      </div>

                      <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60">
                        <span className="text-gray-500 dark:text-gray-400">लॉगिन उपयोगकर्ता / रोल:</span>
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {currentUser ? `${currentUser.name} (${currentUser.role})` : 'कोई नहीं'}
                        </span>
                      </div>

                      {connectivityState.latencyMs !== undefined && (
                        <div className="flex justify-between items-center py-1 border-b border-gray-100 dark:border-gray-800/60">
                          <span className="text-gray-500 dark:text-gray-400">डेटाबेस लेटेंसी:</span>
                          <span className="font-mono text-emerald-600 dark:text-emerald-400">
                            {connectivityState.latencyMs} ms
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/70 border border-gray-200 dark:border-gray-700 mb-3 text-[11px] leading-relaxed text-gray-600 dark:text-gray-300">
                      {connectivityState.message}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={async () => {
                          await checkCloudConnectivity();
                        }}
                        className="flex-1 py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        जाँचें (Verify)
                      </button>

                      {(!firebaseUser || connectivityState.status === 'auth_error' || connectivityState.status === 'auth_required') && (
                        <button
                          disabled={isRetryingAuth}
                          onClick={async () => {
                            setIsRetryingAuth(true);
                            try {
                              await retryFirebaseAuth();
                              await checkCloudConnectivity();
                            } finally {
                              setIsRetryingAuth(false);
                            }
                          }}
                          className="flex-1 py-1.5 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                          {isRetryingAuth ? 'प्रयास जारी...' : 'Auth पुनः प्रयास'}
                        </button>
                      )}

                      <button
                        onClick={async () => {
                          await triggerManualCloudSync();
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-xs transition-colors"
                        title="मैन्युअल सिंक ट्रिगर करें"
                      >
                        सिंक
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Print / Export Direct Shortcut */}
              <button
                onClick={() => onNavigate('export')}
                className="p-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
                title="प्रिंट एवं डेटा निर्यात केंद्र"
                aria-label="प्रिंट एवं डेटा निर्यात केंद्र"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-200" />
                <span className="hidden xl:inline">प्रिंट / एक्सपोर्ट</span>
              </button>

              {/* Notifications Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white relative transition-colors cursor-pointer"
                  title="शासकीय सूचनाएं व आदेश"
                  aria-label="शासकीय सूचनाएं व आदेश"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7A00] text-white text-[9px] font-black rounded-full flex items-center justify-center ring-2 ring-[#0B6B4B]">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 lg:w-96 bg-white dark:bg-[#16221D] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs text-gray-800 dark:text-gray-200 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                      <span className="font-bold text-sm text-gray-900 dark:text-white">
                        शासकीय सूचनाएं व आदेश
                      </span>
                      <span className="bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                        {unreadNotifs.length} नई सूचनाएं
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                      {notifications.slice(0, 5).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => {
                            setShowNotifications(false);
                            onNavigate('notifications');
                          }}
                          className="p-3 hover:bg-[#F8FAF8] dark:hover:bg-[#0F1713] cursor-pointer transition-colors"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-semibold text-gray-900 dark:text-white line-clamp-1">
                              {notif.title}
                            </span>
                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                              {notif.date}
                            </span>
                          </div>
                          <p className="text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">
                            {notif.message}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="p-2 text-center border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-[#0F1713]/50">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          onNavigate('notifications');
                        }}
                        className="text-[#0B6B4B] dark:text-emerald-400 font-semibold hover:underline"
                      >
                        सभी सूचनाएं व आदेश देखें →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Theme Toggle (☀️ / 🌙) */}
              <button
                onClick={toggleTheme}
                className="p-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1 text-xs font-semibold cursor-pointer"
                title={theme === 'light' ? 'डार्क थीम चालू करें' : 'लाइट थीम चालू करें'}
                aria-label="थीम बदलें"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-emerald-200" />
                    <span className="hidden xl:inline">डार्क</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-amber-300" />
                    <span className="hidden xl:inline">लाइट</span>
                  </>
                )}
              </button>

              {/* User Profile Pill & Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1 px-2 py-1 rounded-lg bg-[#074731] hover:bg-[#063B29] border border-emerald-400/30 text-white transition-colors cursor-pointer"
                  title="उपयोगकर्ता प्रोफ़ाइल एवं मेन्यू"
                  aria-label="उपयोगकर्ता प्रोफ़ाइल"
                >
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-6 h-6 rounded-full object-cover border border-emerald-300 shadow-2xs"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                      {currentUser?.name?.charAt(0) || 'स'}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold leading-tight truncate max-w-[100px]">
                      {currentUser?.name || institutionConfig.cac1.shortName}
                    </div>
                    <div className="text-[9px] text-emerald-200 font-medium leading-none">
                      {currentUser?.role === 'ADMIN'
                        ? 'व्यवस्थापक (Admin)'
                        : currentUser?.role === 'CAC'
                        ? 'जन शिक्षक (CAC)'
                        : 'शाला प्रभारी (School)'}
                    </div>
                  </div>
                  <ChevronDown className="w-3 h-3 text-emerald-300 shrink-0" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#16221D] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 py-2 z-50 text-xs text-gray-800 dark:text-gray-200 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
                      {currentUser?.avatar ? (
                        <img
                          src={currentUser.avatar}
                          alt={currentUser.name}
                          className="w-10 h-10 rounded-full object-cover border border-[#0B6B4B]"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#0B6B4B] text-white flex items-center justify-center font-bold text-sm">
                          {currentUser?.name?.charAt(0) || 'स'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          {currentUser?.name || institutionConfig.cac1.name}
                        </p>
                        <p className="text-gray-400 text-[11px] truncate">{currentUser?.email || currentUser?.mobile}</p>
                        <span className="mt-1 inline-block bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">
                          {currentUser?.designation || institutionConfig.cac1.role}
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('profile');
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-[#F8FAF8] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-medium"
                      >
                        <UserIcon className="w-4 h-4 text-[#0B6B4B]" />
                        मेरी प्रोफ़ाइल (My Profile)
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('profile');
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-[#F8FAF8] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                      >
                        <Key className="w-4 h-4 text-purple-600" />
                        पासवर्ड बदलें (Change Password)
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('history');
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-[#F8FAF8] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        गतिविधियां व ऑडिट लॉग्स
                      </button>

                      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'CAC') && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('settings');
                          }}
                          className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-[#F8FAF8] dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                        >
                          <Settings className="w-4 h-4 text-[#FF7A00]" />
                          सिस्टम सेटिंग्स (Settings)
                        </button>
                      )}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-1">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onOpenLogoutDialog();
                        }}
                        className="w-full px-4 py-2 text-left flex items-center gap-2.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-semibold"
                      >
                        <LogOut className="w-4 h-4" />
                        लॉगआउट (Logout)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Direct Logout Button */}
              <button
                onClick={onOpenLogoutDialog}
                className="p-1.5 px-2.5 py-1.5 rounded-lg bg-red-700/85 hover:bg-red-700 text-white transition-colors text-xs font-bold flex items-center gap-1 cursor-pointer"
                title="सत्र समाप्त व लॉगआउट करें"
                aria-label="लॉगआउट"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">लॉगआउट</span>
              </button>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 2B. TABLET & MEDIUM SCREENS (sm: 640px to lg: 1023px)                 */}
          {/* ===================================================================== */}
          <div className="hidden sm:flex lg:hidden flex-col gap-2 w-full">
            {/* Tablet Row 1: Sidebar Toggle, CAC Panel, School Selector & Action Controls */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  onClick={onOpenMobileSidebar}
                  className="p-2 rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/30 text-white shrink-0"
                  title="मेन्यू खोलें"
                  aria-label="मेन्यू खोलें"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (canSwitchSchools) {
                      setSelectedSchoolUdise('');
                    }
                    onNavigate('dashboard');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#08553B] hover:bg-[#074731] border border-emerald-400/30 text-white text-xs font-bold shrink-0"
                  title={currentUser?.role === 'ADMIN' ? 'Admin Panel' : currentUser?.role === 'SCHOOL' ? 'School Panel' : 'CAC Panel'}
                >
                  <span className="w-2 h-2 rounded-full bg-[#FF7A00] animate-pulse"></span>
                  <span>{currentUser?.role === 'ADMIN' ? 'Admin Panel' : currentUser?.role === 'SCHOOL' ? 'School Panel' : 'CAC Panel'}</span>
                </button>

                {canSwitchSchools ? (
                  <div className="relative min-w-0 flex-1 max-w-[200px]">
                    <select
                      value={selectedSchoolUdise}
                      onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                      className="w-full bg-[#074731] text-emerald-100 font-semibold text-xs border border-emerald-400/40 rounded-lg px-2 py-1.5 truncate"
                    >
                      <option value="">🏫 समस्त {schools.length} शालाएं</option>
                      {schools.map((s) => (
                        <option key={s.udise} value={s.udise} className="bg-white text-gray-900">
                          {s.name || s.hindiName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 bg-[#074731] text-emerald-100 text-xs px-2.5 py-1.5 rounded-lg border border-emerald-400/40 font-medium truncate max-w-[160px]">
                    <SchoolIcon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                    <span className="truncate">
                      {selectedSchool?.name || selectedSchool?.hindiName || 'मेरा विद्यालय'}
                    </span>
                  </div>
                )}

                {/* Tablet Session Switcher */}
                <div className="shrink-0">
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    aria-label="सत्र चुनें"
                    className={`text-xs font-bold rounded-lg px-2 py-1.5 cursor-pointer ${
                      !isCurrentSessionSelected
                        ? 'bg-amber-500 text-gray-950 font-black ring-1 ring-amber-300'
                        : 'bg-[#074731] text-emerald-100 border border-emerald-400/40'
                    }`}
                  >
                    {visibleAcademicSessions.map((session) => (
                      <option key={session.id} value={session.id} className="bg-white text-gray-900">
                        {session.sessionName || session.name || session.id} {session.isCurrent ? '★' : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tablet Quick Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onNavigate('export')}
                  className="p-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs flex items-center gap-1"
                  title="प्रिंट व एक्सपोर्ट"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white relative"
                  title="सूचनाएं"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FF7A00] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs"
                  title="थीम बदलें"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4 text-emerald-200" /> : <Sun className="w-4 h-4 text-amber-300" />}
                </button>

                <button
                  onClick={() => onNavigate('profile')}
                  className="p-1 px-1.5 rounded-lg bg-[#074731] border border-emerald-400/30 text-white flex items-center gap-1"
                  title="प्रोफ़ाइल"
                >
                  <div className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center font-bold text-xs">
                    {currentUser?.name?.charAt(0) || 'स'}
                  </div>
                </button>

                <button
                  onClick={onOpenLogoutDialog}
                  className="p-1.5 px-2 py-1.5 rounded-lg bg-red-700/80 hover:bg-red-700 text-white"
                  title="लॉगआउट"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Tablet Row 2: Full Width Flexible Search */}
            <div
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/15 border border-white/20 rounded-lg px-3 py-1.5 text-emerald-100 text-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-emerald-200" />
              <span className="truncate text-emerald-100/90 text-xs">
                खोजें: UDISE, शाला, छात्र, शिक्षक, शिकायत...
              </span>
              <kbd className="ml-auto bg-black/20 border border-white/20 rounded px-1.5 py-0.2 text-[9px] text-emerald-200 font-mono">
                खोजें 🔍
              </kbd>
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 2C. MOBILE LAYOUT (< 640px) - Multi-Tier Clean, Non-Overlapping Grid */}
          {/* ===================================================================== */}
          <div className="flex sm:hidden flex-col gap-2 w-full">
            {/* Mobile Row 1: Menu Toggle, Brand / CAC Panel & Top Actions */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={onOpenMobileSidebar}
                  className="p-2 rounded-lg bg-white/15 active:bg-white/30 text-white shrink-0"
                  title="नेविगेशन मेन्यू"
                  aria-label="नेविगेशन मेन्यू"
                >
                  <Menu className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    if (canSwitchSchools) {
                      setSelectedSchoolUdise('');
                    }
                    onNavigate('dashboard');
                  }}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#08553B] border border-emerald-400/30 text-white text-[11px] font-bold shrink-0"
                  title={currentUser?.role === 'ADMIN' ? 'Admin Panel' : currentUser?.role === 'SCHOOL' ? 'School Panel' : 'CAC Panel'}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-pulse"></span>
                  <span>{currentUser?.role === 'ADMIN' ? 'Admin Panel' : currentUser?.role === 'SCHOOL' ? 'School Panel' : 'CAC Panel'}</span>
                </button>
              </div>

              {/* Mobile Right Controls: Notifications, Theme & Profile */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onNavigate('export')}
                  className="p-1.5 rounded-lg bg-white/10 text-white"
                  title="प्रिंट व एक्सपोर्ट"
                >
                  <Printer className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigate('notifications')}
                  className="p-1.5 rounded-lg bg-white/10 text-white relative"
                  title="सूचनाएं"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF7A00] text-white text-[8px] font-black rounded-full flex items-center justify-center">
                      {unreadNotifs.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg bg-white/10 text-white"
                  title="थीम बदलें"
                >
                  {theme === 'light' ? <Moon className="w-4 h-4 text-emerald-200" /> : <Sun className="w-4 h-4 text-amber-300" />}
                </button>

                <button
                  onClick={() => onNavigate('profile')}
                  className="p-0.5 rounded-full ring-1 ring-emerald-300"
                  title="मेरी प्रोफ़ाइल"
                >
                  <div className="w-6 h-6 rounded-full bg-[#FF7A00] text-white flex items-center justify-center font-bold text-[10px]">
                    {currentUser?.name?.charAt(0) || 'स'}
                  </div>
                </button>
              </div>
            </div>

            {/* Mobile Row 2: School Selector & Academic Session Switcher */}
            <div className="w-full flex items-center gap-1.5">
              {canSwitchSchools ? (
                <div className="flex-1 min-w-0">
                  <select
                    value={selectedSchoolUdise}
                    onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                    className="w-full bg-[#074731] text-emerald-100 font-semibold text-xs border border-emerald-400/40 rounded-lg px-2 py-1.5 truncate"
                  >
                    <option value="">🏫 समस्त {schools.length} संकुल शालाएं</option>
                    {schools.map((s) => (
                      <option key={s.udise} value={s.udise} className="bg-white text-gray-900">
                        {s.name || s.hindiName} ({s.village})
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}

              {/* Mobile Academic Session Switcher */}
              <div className="shrink-0">
                <select
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  aria-label="सत्र चुनें"
                  className={`text-xs font-bold rounded-lg px-2 py-1.5 cursor-pointer ${
                    !isCurrentSessionSelected
                      ? 'bg-amber-500 text-gray-950 font-black ring-1 ring-amber-300'
                      : 'bg-[#074731] text-emerald-100 border border-emerald-400/40'
                  }`}
                >
                  {visibleAcademicSessions.map((session) => (
                    <option key={session.id} value={session.id} className="bg-white text-gray-900">
                      {session.sessionName || session.name || session.id} {session.isCurrent ? '★' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Row 3: Full Width Interactive Search Trigger */}
            <div
              onClick={onOpenGlobalSearch}
              className="w-full flex items-center gap-2 bg-white/10 active:bg-white/20 border border-white/20 rounded-lg px-3 py-1.5 text-emerald-100 text-xs cursor-pointer"
            >
              <Search className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
              <span className="truncate text-emerald-100/90 text-xs">
                खोजें: UDISE, शाला, छात्र, शिक्षक, शिकायत...
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. OFFICIAL SCHOOL / CLUSTER CONTEXT RIBBON                              */}
        {/* ========================================================================= */}
        <div className="w-full bg-[#08553B] dark:bg-[#0E231B] border-t border-emerald-500/30 dark:border-emerald-800/80 px-3 sm:px-4 md:px-6 py-2 text-white transition-colors">
          <div className="max-w-7xl mx-auto w-full">
            {selectedSchool ? (
              <>
                {/* 3A. SINGLE SCHOOL MODE - DESKTOP (lg: 1024px+) Layout */}
                <div className="hidden lg:flex items-center justify-between gap-3 text-xs">
                  {/* Left: School Name & UDISE */}
                  <div className="flex items-center gap-2 min-w-0 shrink-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-700/60 border border-emerald-400/40 flex items-center justify-center text-xs shrink-0">
                      🏫
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-white text-sm tracking-tight truncate max-w-[260px] xl:max-w-[320px]">
                        {selectedSchool.name || selectedSchool.hindiName}
                      </span>
                      <span className="font-mono text-[10px] font-bold bg-[#063B29] dark:bg-[#0A1813] text-emerald-200 px-1.5 py-0.5 rounded border border-emerald-400/40 shrink-0">
                        UDISE: {selectedSchool.udise}
                      </span>
                      {selectedSchool.schoolType && (
                        <span className="text-[10px] font-semibold bg-emerald-600/40 text-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400/20 shrink-0">
                          {selectedSchool.schoolType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Center: Location Details in Horizontal Sequence */}
                  <div className="flex items-center gap-2.5 text-emerald-100/90 text-xs min-w-0 flex-1 justify-center">
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-emerald-400 font-medium">ग्राम:</span>
                      <strong className="text-white">{selectedSchool.village}</strong>
                    </span>
                    <span className="text-emerald-500/60">•</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-emerald-400 font-medium">पं.:</span>
                      <strong className="text-white">{selectedSchool.gramPanchayat || selectedSchool.village}</strong>
                    </span>
                    <span className="text-emerald-500/60">•</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-emerald-400 font-medium">ब्लॉक:</span>
                      <strong className="text-white">{institutionConfig.block}</strong>
                    </span>
                    <span className="text-emerald-500/60">•</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-emerald-400 font-medium">जिला:</span>
                      <strong className="text-white">{institutionConfig.district}</strong>
                    </span>
                    {selectedSchool.principalName && (
                      <>
                        <span className="text-emerald-500/60">•</span>
                        <span className="flex items-center gap-1 truncate max-w-[160px]">
                          <span className="text-emerald-400 font-medium">HM:</span>
                          <strong className="text-emerald-200 truncate">{selectedSchool.principalName}</strong>
                        </span>
                      </>
                    )}
                  </div>

                  {/* Right: Clear / Switch Button (Only for CAC/Admin/Operator) */}
                  {canSwitchSchools && (
                    <div className="shrink-0">
                      <button
                        onClick={() => setSelectedSchoolUdise('')}
                        className="bg-white/10 hover:bg-white/20 active:bg-white/25 text-emerald-100 hover:text-white border border-emerald-400/30 px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        title="समस्त संकुल दृश्य पर जाएं"
                      >
                        <X className="w-3 h-3 text-amber-300" />
                        <span>समस्त शालाएं</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3B. SINGLE SCHOOL MODE - TABLET & MOBILE Layout */}
                <div className="flex lg:hidden flex-col gap-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-sm shrink-0">🏫</span>
                      <h3 className="font-extrabold text-white text-xs sm:text-sm truncate">
                        {selectedSchool.name || selectedSchool.hindiName}
                      </h3>
                      <span className="font-mono text-[10px] font-bold bg-[#063B29] text-emerald-200 px-1.5 py-0.2 rounded shrink-0">
                        {selectedSchool.udise}
                      </span>
                    </div>

                    {canSwitchSchools && (
                      <button
                        onClick={() => setSelectedSchoolUdise('')}
                        className="bg-white/15 active:bg-white/25 text-white border border-emerald-300/40 px-2 py-0.5 rounded text-[10px] font-bold shrink-0 flex items-center gap-1"
                      >
                        <X className="w-3 h-3 text-amber-300" />
                        <span>समस्त</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-x-2 gap-y-0.5 flex-wrap text-[10.5px] text-emerald-100/90 pt-1 border-t border-emerald-600/30">
                    <span>📍 {selectedSchool.village}</span>
                    <span className="text-emerald-500/50">•</span>
                    <span>पं: {selectedSchool.gramPanchayat || selectedSchool.village}</span>
                    <span className="text-emerald-500/50">•</span>
                    <span>{institutionConfig.block}, {institutionConfig.district}</span>
                    {selectedSchool.principalName && (
                      <>
                        <span className="text-emerald-500/50">•</span>
                        <span>HM: <strong className="text-emerald-200">{selectedSchool.principalName}</strong></span>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* 3C. CAC ALL SCHOOL MODE - DESKTOP Layout */}
                <div className="hidden lg:flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-emerald-700/60 border border-emerald-400/40 flex items-center justify-center text-xs shrink-0">
                      🏫
                    </div>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-extrabold text-white text-sm tracking-tight">
                        समस्त संकुल शालाएं ({schools.length} Schools)
                      </span>
                      <span className="bg-[#FF7A00] text-white text-[9px] font-black px-1.5 py-0.2 rounded shadow-2xs shrink-0 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                        सक्रिय क्लस्टर मोड
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-emerald-100/90 text-xs min-w-0 flex-1 justify-center">
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-emerald-400 font-medium">संकुल:</span>
                      <strong className="text-white">{institutionConfig.sankulName}</strong>
                    </span>
                    <span className="text-emerald-500/60">•</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-emerald-400 font-medium">ब्लॉक:</span>
                      <strong className="text-white">{institutionConfig.block}</strong>
                    </span>
                    <span className="text-emerald-500/60">•</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <span className="text-emerald-400 font-medium">जिला:</span>
                      <strong className="text-white">{institutionConfig.district}</strong>
                    </span>
                    <span className="text-emerald-500/60">•</span>
                    <span className="flex items-center gap-1 text-emerald-200 shrink-0">
                      <span>{schoolTypeSummary.ps} प्राथमिक (PS)</span> • <span>{schoolTypeSummary.ms} माध्यमिक (MS)</span> • <span>{schoolTypeSummary.hs} हाई स्कूल (HS)</span>
                    </span>
                  </div>

                  <div className="text-[11px] text-emerald-200/90 bg-[#063B29] dark:bg-[#0A1813] px-2.5 py-1 rounded-lg border border-emerald-400/30 shrink-0 font-medium">
                    शैक्षणिक सत्र: <strong className="text-white font-bold">{activeSession}</strong>
                  </div>
                </div>

                {/* 3D. CAC ALL SCHOOL MODE - TABLET & MOBILE Layout */}
                <div className="flex lg:hidden items-center justify-between gap-2 text-xs flex-wrap">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-sm shrink-0">🏫</span>
                    <span className="font-extrabold text-white text-xs sm:text-sm truncate">
                      समस्त संकुल शालाएं ({schools.length} शालाएं)
                    </span>
                    <span className="bg-[#FF7A00] text-white text-[8px] sm:text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                      क्लस्टर
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[10.5px] text-emerald-200">
                    <span>{institutionConfig.block}, {institutionConfig.district}</span>
                    <span>•</span>
                    <span>सत्र {activeSession}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Read-Only Notice Banner for Past / Inactive Sessions */}
      {!isCurrentSessionSelected && (
        <div className="w-full bg-amber-500 text-gray-950 px-3 sm:px-4 md:px-6 py-1.5 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm border-b-2 border-amber-600 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider shrink-0 animate-pulse">
              अभिलेख दृश्य (ReadOnly)
            </span>
            <span className="font-semibold">
              वर्तमान में आप विगत शैक्षणिक सत्र <strong className="font-black text-black underline">{selectedSessionId}</strong> का डेटा देख रहे हैं। इस सत्र में नवीन परिवर्तन सुरक्षित नहीं होंगे।
            </span>
          </div>
          <button
            onClick={() => setSelectedSessionId(activeSessionId)}
            className="px-3 py-1 bg-gray-950 text-amber-300 hover:bg-gray-800 rounded-lg font-bold text-xs transition-colors shrink-0 shadow-xs cursor-pointer flex items-center gap-1"
          >
            <span>सक्रिय सत्र ({activeSessionId}) पर जाएं</span>
            <span>→</span>
          </button>
        </div>
      )}
    </header>
  );
};
