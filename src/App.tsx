/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth, recordSecurityAudit } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { FeatureControlProvider, useFeatureControl } from './context/FeatureControlContext';
import { FeatureGuard } from './components/common/FeatureGuard';

// Layout and Common Components
import { SplashScreen } from './components/splash/SplashScreen';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
import { MandatoryPasswordChangeView } from './components/auth/MandatoryPasswordChangeView';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { Footer } from './components/common/Footer';

// Application Module Views
import { DashboardView } from './components/dashboard/DashboardView';
import { SchoolListView } from './components/schools/SchoolListView';
import { SchoolProfileView } from './components/schools/SchoolProfileView';
import { StudentsView } from './components/students/StudentsView';
import { TeachersView } from './components/teachers/TeachersView';
import { AttendanceView } from './components/attendance/AttendanceView';
import { CacAttendanceMonitoringView } from './components/attendance/CacAttendanceMonitoringView';
import { FacilitiesView } from './components/facilities/FacilitiesView';
import { MDMView } from './components/mdm/MDMView';
import { RasoiyaView } from './components/mdm/RasoiyaView';
import { SHGView } from './components/mdm/SHGView';
import { GovernmentWorkView } from './components/work/GovernmentWorkView';
import { ComplaintsView } from './components/complaints/ComplaintsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { DocumentsView } from './components/documents/DocumentsView';
import { ExportCenterView } from './components/export/ExportCenterView';
import { DataUploadView } from './components/upload/DataUploadView';
import { AuditLogView } from './components/audit/AuditLogView';
import { LiveQATestDashboard } from './components/audit/LiveQATestDashboard';
import { ReportsView } from './components/reports/ReportsView';
import { GlobalSearchView } from './components/search/GlobalSearchView';
import { ProfileView } from './components/profile/ProfileView';
import { ClusterUserDirectoryView } from './components/users/ClusterUserDirectoryView';
import { SettingsView } from './components/settings/SettingsView';

// Navbharat Literacy Program (नवभारत साक्षरता कार्यक्रम) Views
import { LiteracyDashboardView } from './components/literacy/LiteracyDashboardView';
import { LiteracyRegisterView } from './components/literacy/LiteracyRegisterView';
import { IlliteratePersonView } from './components/literacy/IlliteratePersonView';
import { AksharSathiView } from './components/literacy/AksharSathiView';
import { ExamResultsView } from './components/literacy/ExamResultsView';
import { SupportingInstitutionsView } from './components/literacy/SupportingInstitutionsView';
import { LiteracyReportView } from './components/literacy/LiteracyReportView';
import { LiteracyPrintExportView } from './components/literacy/LiteracyPrintExportView';

// Icons
import { LogOut, ShieldAlert, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, logout, currentUser, isUdiseAllowed, canAccessView } = useAuth();
  const { logActivity, selectedSessionId } = useData();
  const { isRouteEnabled } = useFeatureControl();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Auth View State ('LOGIN' or 'REGISTER')
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Active Navigation View State with Session & URL Hash Persistence
  const getInitialView = () => {
    try {
      const hash = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
      if (hash) {
        if (hash === 'shgs' || hash === 'shg-management' || hash === 'self-help-group') return 'shg';
        if (hash === 'staff') return 'teachers';
        if (hash === 'cook' || hash === 'rasoiya-management') return 'rasoiya';
        return hash;
      }
      const saved = sessionStorage.getItem('jsk_current_view');
      if (saved) return saved;
    } catch (e) {
      // ignore
    }
    return 'dashboard';
  };

  const [currentView, setCurrentView] = useState<string>(getInitialView);
  const [selectedProfileUdise, setSelectedProfileUdise] = useState<string | null>(null);

  // Mobile Sidebar Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  // Logout Confirmation Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Route Access Denied Message State for URL verification
  const [routeAccessDeniedMessage, setRouteAccessDeniedMessage] = useState<string | null>(null);

  const isSchoolRestricted = currentUser?.role === 'SCHOOL';

  // Centralized navigation handler supporting URL hash and session preservation
  const handleNavigate = (viewId: string) => {
    let normalized = viewId;
    if (viewId === 'shgs' || viewId === 'shg-management' || viewId === 'self-help-group') {
      normalized = 'shg';
    } else if (viewId === 'staff') {
      normalized = 'teachers';
    } else if (viewId === 'cook' || viewId === 'rasoiya-management') {
      normalized = 'rasoiya';
    } else if (viewId === 'academic-sessions' || viewId === 'sessions') {
      normalized = 'settings';
    }

    // Direct guard: CAC Attendance Monitoring is restricted to CAC and ADMIN
    if ((normalized === 'cac-attendance-monitoring' || normalized === 'attendance-monitoring') && currentUser?.role === 'SCHOOL') {
      setRouteAccessDeniedMessage(
        'सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "दैनिक उपस्थिति मॉनिटरिंग" मॉड्यूल केवल संकुल समन्वयक (CAC) एवं मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है।'
      );
      setCurrentView('attendance');
      setIsSidebarOpen(false);
      return;
    }

    // Direct guard: Cluster User Directory is restricted to CAC and ADMIN
    if ((normalized === 'user-directory' || normalized === 'users') && currentUser?.role === 'SCHOOL') {
      setRouteAccessDeniedMessage(
        'सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "संकुल उपयोगकर्ता डायरेक्टरी" मॉड्यूल केवल संकुल समन्वयक (CAC) एवं मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है।'
      );
      setCurrentView('profile');
      setIsSidebarOpen(false);
      return;
    }

    // Direct guard: Data Entry & Upload is strictly restricted to ADMIN
    if ((normalized === 'upload' || normalized === 'data-upload') && currentUser?.role !== 'ADMIN') {
      setRouteAccessDeniedMessage(
        'सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "डेटा प्रविष्टि एवं अपलोड" मॉड्यूल केवल मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है।'
      );
      setCurrentView('dashboard');
      setIsSidebarOpen(false);
      logActivity(
        'SESSION_ACCESS_DENIED' as any,
        'डेटा प्रविष्टि एवं अपलोड',
        `अनधिकृत नेविगेशन प्रयास (#${normalized}): केवल ADMIN के लिए अधिकृत है। उपयोगकर्ता: ${currentUser?.name || 'अज्ञात'} (${currentUser?.role || 'अज्ञात'})`
      );
      recordSecurityAudit(
        'SECURITY_ALERT',
        currentUser?.username || 'unknown',
        currentUser?.role,
        `अनधिकृत नेविगेशन प्रयास (#${normalized}): डेटा प्रविष्टि एवं अपलोड केवल ADMIN के लिए अधिकृत है।`
      );
      if (window.location.hash || window.location.search) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      return;
    }

    setCurrentView(normalized);
    setIsSidebarOpen(false);
    setRouteAccessDeniedMessage(null);
    try {
      sessionStorage.setItem('jsk_current_view', normalized);
      const currentHash = (window.location.hash || '').replace(/^#\/?/, '').toLowerCase();
      if (currentHash !== normalized) {
        window.history.pushState({ view: normalized }, '', `#${normalized}`);
      }
    } catch (e) {
      // ignore
    }
  };

  // Role Routing and Direct URL Verification (/admin, /cac, /school, /upload, /data-upload)
  React.useEffect(() => {
    if (!currentUser) return;

    const checkRolePath = () => {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      const search = (window.location.search || '').toLowerCase();

      // Guard: Data Entry & Upload is strictly restricted to ADMIN role only
      const uploadTargets = ['data-upload', 'upload', 'data_upload'];
      const isUploadTarget = uploadTargets.some(
        (target) => path.includes(`/${target}`) || hash.includes(`#${target}`) || hash.includes(`#/${target}`) || search.includes(`=${target}`)
      );

      if (isUploadTarget) {
        if (currentUser.role === 'ADMIN') {
          setCurrentView('upload');
          setRouteAccessDeniedMessage(null);
        } else {
          setRouteAccessDeniedMessage(
            `सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "डेटा प्रविष्टि एवं अपलोड" मॉड्यूल केवल मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है। आपकी वर्तमान लॉगिन भूमिका: ${currentUser.role === 'CAC' ? 'जन शिक्षक (CAC)' : 'संस्था प्रभारी (SCHOOL)'}।`
          );
          setCurrentView('dashboard');
          logActivity(
            'SESSION_ACCESS_DENIED' as any,
            'डेटा प्रविष्टि एवं अपलोड',
            `अनधिकृत पहुंच प्रयास: "डेटा प्रविष्टि एवं अपलोड" (#data-upload) केवल मुख्य व्यवस्थापक (ADMIN) के लिए उपलब्ध है। उपयोगकर्ता: ${currentUser.name} (${currentUser.role})`
          );
          recordSecurityAudit(
            'SECURITY_ALERT',
            currentUser.username,
            currentUser.role,
            'अनधिकृत पहुंच प्रयास: डेटा प्रविष्टि एवं अपलोड (#data-upload) केवल ADMIN के लिए अधिकृत है।'
          );
          if (window.location.hash || window.location.search) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          return;
        }
      }

      // Guard: Data Backup, System Info, Settings, and Sessions are prohibited for School users
      const restrictedForSchool = [
        'settings', 'backup', 'data-backup', 'system-info', 'system_info', 'info',
        'academic-sessions', 'sessions', 'users', 'user-management'
      ];
      const isRestrictedTarget = restrictedForSchool.some(
        (target) => path.includes(`/${target}`) || hash.includes(`#${target}`) || hash.includes(`#/${target}`) || search.includes(`=${target}`)
      );

      if (currentUser.role === 'SCHOOL' && isRestrictedTarget) {
        setRouteAccessDeniedMessage(
          'सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "डेटा बैकअप", "सिस्टम सूचना", "उपयोगकर्ता प्रबंधन" एवं "सिस्टम सेटिंग्स" विकल्प केवल संकुल प्रशासक (ADMIN) एवं जन शिक्षक (CAC) के लिए अधिकृत हैं।'
        );
        setCurrentView('dashboard');
        if (window.location.hash || window.location.search) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        return;
      }

      if (path === '/admin' || hash === '#admin' || hash === '#/admin') {
        if (currentUser.role === 'ADMIN') {
          setCurrentView('dashboard');
          setRouteAccessDeniedMessage(null);
        } else {
          setRouteAccessDeniedMessage(
            `पहुंच अस्वीकृत (Access Denied): मार्ग /admin केवल मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है। आपकी वर्तमान लॉगिन भूमिका: ${currentUser.role === 'CAC' ? 'जन शिक्षक (CAC)' : 'संस्था प्रभारी (SCHOOL)'}।`
          );
          setCurrentView('dashboard');
        }
      } else if (path === '/cac' || hash === '#cac' || hash === '#/cac') {
        if (currentUser.role === 'CAC') {
          setCurrentView('dashboard');
          setRouteAccessDeniedMessage(null);
        } else {
          setRouteAccessDeniedMessage(
            `पहुंच अस्वीकृत (Access Denied): मार्ग /cac केवल जन शिक्षक (CAC) के लिए अधिकृत है। आपकी वर्तमान लॉगिन भूमिका: ${currentUser.role === 'ADMIN' ? 'मुख्य व्यवस्थापक (ADMIN)' : 'संस्था प्रभारी (SCHOOL)'}।`
          );
          setCurrentView('dashboard');
        }
      } else if (path === '/school' || hash === '#school' || hash === '#/school') {
        if (currentUser.role === 'SCHOOL') {
          setCurrentView('dashboard');
          setRouteAccessDeniedMessage(null);
        } else {
          setRouteAccessDeniedMessage(
            `पहुंच अस्वीकृत (Access Denied): मार्ग /school केवल संस्था प्रभारी (SCHOOL) के लिए अधिकृत है। आपकी वर्तमान लॉगिन भूमिका: ${currentUser.role === 'ADMIN' ? 'मुख्य व्यवस्थापक (ADMIN)' : 'जन शिक्षक (CAC)'}।`
          );
          setCurrentView('dashboard');
        }
      } else if (
        path === '/settings' || hash === '#settings' || hash === '#/settings' ||
        path === '/academic-sessions' || hash === '#academic-sessions' || hash === '#/academic-sessions' ||
        path === '/sessions' || hash === '#sessions' || hash === '#/sessions'
      ) {
        if (currentUser.role === 'ADMIN' || currentUser.role === 'CAC') {
          setCurrentView('settings');
          setRouteAccessDeniedMessage(null);
        }
      } else {
        // Generic hash navigation support (e.g. #shg, #teachers, #mdm, #rasoiya, etc.)
        const cleanHash = hash.replace(/^#\/?/, '').trim();
        if (cleanHash) {
          let target = cleanHash;
          if (cleanHash === 'shgs' || cleanHash === 'shg-management' || cleanHash === 'self-help-group') {
            target = 'shg';
          } else if (cleanHash === 'staff') {
            target = 'teachers';
          } else if (cleanHash === 'cook' || cleanHash === 'rasoiya-management') {
            target = 'rasoiya';
          }

          if (target === 'cac-attendance-monitoring' || target === 'attendance-monitoring') {
            if (currentUser.role === 'ADMIN' || currentUser.role === 'CAC') {
              setCurrentView('cac-attendance-monitoring');
              setRouteAccessDeniedMessage(null);
            } else {
              setRouteAccessDeniedMessage(
                `सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "दैनिक उपस्थिति मॉनिटरिंग" मॉड्यूल केवल संकुल समन्वयक (CAC) एवं मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है।`
              );
              setCurrentView('attendance');
            }
            return;
          }

          if (target === 'upload' || target === 'data-upload') {
            if (currentUser.role === 'ADMIN') {
              setCurrentView('upload');
              setRouteAccessDeniedMessage(null);
            } else {
              setRouteAccessDeniedMessage(
                `सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "डेटा प्रविष्टि एवं अपलोड" मॉड्यूल केवल मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है। आपकी वर्तमान लॉगिन भूमिका: ${currentUser.role === 'CAC' ? 'जन शिक्षक (CAC)' : 'संस्था प्रभारी (SCHOOL)'}।`
              );
              setCurrentView('dashboard');
              logActivity(
                'SESSION_ACCESS_DENIED' as any,
                'डेटा प्रविष्टि एवं अपलोड',
                `अनधिकृत पहुंच प्रयास (#${target}): डेटा प्रविष्टि एवं अपलोड केवल ADMIN के लिए अधिकृत है। उपयोगकर्ता: ${currentUser.name} (${currentUser.role})`
              );
              recordSecurityAudit(
                'SECURITY_ALERT',
                currentUser.username,
                currentUser.role,
                `अनधिकृत पहुंच प्रयास (#${target}): डेटा प्रविष्टि एवं अपलोड केवल ADMIN के लिए अधिकृत है।`
              );
              if (window.location.hash || window.location.search) {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
            }
          } else if (canAccessView(target)) {
            setCurrentView(target);
            setRouteAccessDeniedMessage(null);
          }
        }
      }
    };

    checkRolePath();
    window.addEventListener('popstate', checkRolePath);
    window.addEventListener('hashchange', checkRolePath);
    return () => {
      window.removeEventListener('popstate', checkRolePath);
      window.removeEventListener('hashchange', checkRolePath);
    };
  }, [currentUser, canAccessView, logActivity]);

  // Security Route & UDISE Guard Effect
  React.useEffect(() => {
    if (currentUser) {
      // 1. View Access Enforcement
      if (!canAccessView(currentView)) {
        if (currentView === 'upload' || currentView === 'data-upload') {
          setRouteAccessDeniedMessage(
            'सुरक्षा नियंत्रण: पहुंच अस्वीकृत (Access Denied): "डेटा प्रविष्टि एवं अपलोड" केवल मुख्य व्यवस्थापक (ADMIN) के लिए अधिकृत है।'
          );
          logActivity(
            'SESSION_ACCESS_DENIED' as any,
            'डेटा प्रविष्टि एवं अपलोड',
            `अनधिकृत पहुंच प्रयास: डेटा प्रविष्टि एवं अपलोड केवल ADMIN के लिए अधिकृत है। उपयोगकर्ता: ${currentUser.name} (${currentUser.role})`
          );
          recordSecurityAudit(
            'SECURITY_ALERT',
            currentUser.username,
            currentUser.role,
            'अनधिकृत पहुंच प्रयास: डेटा प्रविष्टि एवं अपलोड केवल ADMIN के लिए अधिकृत है।'
          );
        }
        setCurrentView('dashboard');
      }

      // 2. School Role Guard: enforce assigned school UDISE for school users
      if (isSchoolRestricted && currentUser.assignedSchoolUdise) {
        if (selectedProfileUdise && selectedProfileUdise !== currentUser.assignedSchoolUdise) {
          setSelectedProfileUdise(currentUser.assignedSchoolUdise);
        }
        // Protect against URL query tampering (?schoolUdise=... / ?schoolId=...)
        try {
          const params = new URLSearchParams(window.location.search);
          const queryUdise = params.get('schoolUdise') || params.get('schoolId') || params.get('udise');
          if (queryUdise && queryUdise !== currentUser.assignedSchoolUdise) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (e) {
          // ignore
        }
      }

      // 3. Cluster UDISE Access Enforcement for CAC/Admin
      if (!isSchoolRestricted && currentView === 'school-profile' && selectedProfileUdise) {
        if (!isUdiseAllowed(selectedProfileUdise)) {
          setCurrentView('dashboard');
        }
      }
    }
  }, [currentView, selectedProfileUdise, currentUser, isSchoolRestricted, isUdiseAllowed, canAccessView]);

  // If splash screen is active
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  // If unauthenticated, show Login or Register view
  if (!isAuthenticated) {
    if (authMode === 'REGISTER') {
      return (
        <RegisterView
          onNavigateToLogin={() => setAuthMode('LOGIN')}
          onBackToLogin={() => setAuthMode('LOGIN')}
        />
      );
    }
    return (
      <LoginView
        onNavigateToRegister={() => setAuthMode('REGISTER')}
        onLoginSuccess={() => setCurrentView('dashboard')}
      />
    );
  }

  // Requirement 2.d: If user must change password on first login, lock the entire app until changed!
  if (currentUser?.mustChangePassword) {
    return <MandatoryPasswordChangeView user={currentUser} />;
  }

  const handleSelectSchoolFromList = (udise: string) => {
    if (!isUdiseAllowed(udise)) {
      if (currentUser?.assignedSchoolUdise) {
        setSelectedProfileUdise(currentUser.assignedSchoolUdise);
        setCurrentView('school-profile');
      } else {
        setCurrentView('dashboard');
      }
      return;
    }
    setSelectedProfileUdise(udise);
    setCurrentView('school-profile');
  };

  const handleGlobalSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
  };

  const handleConfirmLogout = () => {
    logActivity(
      'LOGOUT',
      'Auth',
      `${currentUser?.name} (${currentUser?.role}) द्वारा सत्र समाप्त एवं लॉगआउट किया गया।`
    );
    setShowLogoutModal(false);
    setSelectedProfileUdise(null);
    setCurrentView('dashboard');
    logout();
    setAuthMode('LOGIN');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0F1714] text-[#17211C] dark:text-[#F4F7F5] flex flex-col font-sans transition-colors duration-150 w-full max-w-full">
      {/* 1. Official Top & Navigation Header with Context Ribbon */}
      <Header
        onOpenGlobalSearch={() => handleGlobalSearch('')}
        onOpenMobileSidebar={() => setIsSidebarOpen(true)}
        onNavigate={handleNavigate}
        onOpenLogoutDialog={() => setShowLogoutModal(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-2.5 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 gap-3 md:gap-5 min-w-0">
        {/* Navigation Sidebar (Desktop visible, Tablet/Mobile Drawer) */}
        <Sidebar
          currentView={currentView}
          onNavigate={handleNavigate}
          mobileOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onOpenLogout={() => setShowLogoutModal(true)}
        />

        {/* Dynamic Main Workspace Content */}
        <main key={selectedSessionId} className="flex-1 min-w-0 max-w-full w-full space-y-4 md:space-y-6">
          {/* Direct Route Access Violation Alert */}
          {routeAccessDeniedMessage && (
              <div className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 p-4 rounded-xl flex items-start justify-between gap-3 text-red-800 dark:text-red-200 shadow-sm animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-sm">सुरक्षा नियंत्रण: अनाधिकृत मार्ग अनुरोध (Unauthorized Direct Route)</div>
                    <div className="text-xs mt-0.5 text-red-700 dark:text-red-300 leading-relaxed">{routeAccessDeniedMessage}</div>
                  </div>
                </div>
                <button
                  onClick={() => setRouteAccessDeniedMessage(null)}
                  className="text-red-600 hover:text-red-900 dark:hover:text-red-100 p-1 rounded-md transition-colors cursor-pointer"
                  title="बंद करें"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

          {/* Views Routing (Protected by Admin Granular Feature & Option Control System) */}
          <FeatureGuard
            featureKey={currentView}
            evaluation={isRouteEnabled(currentView)}
            mode="page"
            onReturnToDashboard={
              currentView !== 'dashboard' ? () => handleNavigate('dashboard') : undefined
            }
          >
          {/* Fallback to Dashboard if invalid/legacy route */}
          {(currentView === 'dashboard' ||
            ![
              'schools',
              'school-profile',
              'students',
              'teachers',
              'staff',
              'attendance',
              'cac-attendance-monitoring',
              'attendance-monitoring',
              'facilities',
              'mdm',
              'rasoiya',
              'cook',
              'rasoiya-management',
              'shg',
              'shgs',
              'shg-management',
              'self-help-group',
              'work',
              'government-work',
              'notifications',
              'complaints',
              'documents',
              'export',
              'export-center',
              'upload',
              'data-upload',
              'history',
              'audit-log',
              'reports',
              'search',
              'global-search',
              'profile',
              'user-directory',
              'users',
              'settings',
              'literacy',
              'literacy-dashboard',
              'literacy-register',
              'illiterate-persons',
              'literacy-learners',
              'akshar-sathi',
              'literacy-volunteers',
              'exam-results',
              'literacy-exams',
              'supporting-institutions',
              'literacy-institutions',
              'literacy-partners',
              'literacy-reports',
              'literacy-print',
              'literacy-export',
            ].includes(currentView)) && (
            <DashboardView
              onNavigate={handleNavigate}
              onSelectSchool={handleSelectSchoolFromList}
            />
          )}

          {currentView === 'schools' && (
            isSchoolRestricted ? (
              <SchoolProfileView
                udise={currentUser?.assignedSchoolUdise || '23080104101'}
                onBack={() => handleNavigate('dashboard')}
                onNavigateToStudent={() => handleNavigate('students')}
                onNavigateToStaff={() => handleNavigate('teachers')}
                onNavigateToAttendance={() => handleNavigate('attendance')}
                onNavigateToFacilities={() => handleNavigate('facilities')}
                onNavigateToMDM={() => handleNavigate('mdm')}
              />
            ) : (
              <SchoolListView onSelectSchool={handleSelectSchoolFromList} />
            )
          )}

          {currentView === 'school-profile' && (
            <SchoolProfileView
              udise={isSchoolRestricted ? (currentUser?.assignedSchoolUdise || '23080104101') : (selectedProfileUdise || '23080104101')}
              onBack={() => handleNavigate(isSchoolRestricted ? 'dashboard' : 'schools')}
              onNavigateToStudent={() => handleNavigate('students')}
              onNavigateToStaff={() => handleNavigate('teachers')}
              onNavigateToAttendance={() => handleNavigate('attendance')}
              onNavigateToFacilities={() => handleNavigate('facilities')}
              onNavigateToMDM={() => handleNavigate('mdm')}
            />
          )}

          {currentView === 'students' && <StudentsView />}

          {(currentView === 'teachers' || currentView === 'staff') && <TeachersView />}

          {currentView === 'attendance' && <AttendanceView />}

          {(currentView === 'cac-attendance-monitoring' || currentView === 'attendance-monitoring') &&
            (currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN') && (
              <CacAttendanceMonitoringView />
            )}

          {currentView === 'facilities' && <FacilitiesView />}

          {currentView === 'mdm' && <MDMView />}

          {(currentView === 'rasoiya' || currentView === 'cook' || currentView === 'rasoiya-management') && <RasoiyaView />}

          {(currentView === 'shg' || currentView === 'shgs' || currentView === 'shg-management' || currentView === 'self-help-group') && <SHGView />}

          {(currentView === 'work' || currentView === 'government-work') && <GovernmentWorkView />}

          {currentView === 'notifications' && <NotificationsView />}

          {currentView === 'complaints' && <ComplaintsView />}

          {currentView === 'documents' && <DocumentsView />}

          {(currentView === 'export' || currentView === 'export-center') && <ExportCenterView />}

          {(currentView === 'upload' || currentView === 'data-upload') && (
            <DataUploadView onNavigateToModule={(mod) => setCurrentView(mod)} />
          )}

          {(currentView === 'history' || currentView === 'audit-log') && <AuditLogView />}

          {(currentView === 'qa-runner' || currentView === 'qa-dashboard') && <LiveQATestDashboard />}

          {currentView === 'reports' && <ReportsView />}

          {(currentView === 'search' || currentView === 'global-search') && (
            <GlobalSearchView
              initialQuery={searchQuery}
              onSelectSchool={handleSelectSchoolFromList}
              onNavigate={(viewId) => setCurrentView(viewId)}
            />
          )}

          {currentView === 'profile' && <ProfileView />}

          {(currentView === 'user-directory' || currentView === 'users') && (
            currentUser?.role === 'CAC' || currentUser?.role === 'ADMIN' ? (
              <ClusterUserDirectoryView />
            ) : (
              <div className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 p-6 rounded-2xl text-center space-y-3 max-w-xl mx-auto my-8">
                <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
                <h3 className="text-base font-bold text-red-900 dark:text-red-200">
                  अनधिकृत पहुंच (Access Restricted)
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300">
                  संकुल उपयोगकर्ता डायरेक्टरी केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) के लिए अधिकृत है।
                </p>
              </div>
            )
          )}

          {currentView === 'settings' && (
            isSchoolRestricted ? (
              <div className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 p-6 rounded-2xl text-center space-y-3 max-w-xl mx-auto my-8">
                <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
                <h3 className="text-base font-bold text-red-900 dark:text-red-200">
                  अनधिकृत पहुंच (Access Restricted)
                </h3>
                <p className="text-xs text-red-700 dark:text-red-300">
                  सिस्टम सेटिंग्स, डेटा बैकअप एवं प्रणाली सूचना केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) के लिए अधिकृत हैं।
                </p>
              </div>
            ) : (
              <SettingsView />
            )
          )}

          {/* 📚 नवभारत साक्षरता कार्यक्रम (Navbharat Literacy Program) Routes */}
          {(currentView === 'literacy' || currentView === 'literacy-dashboard') && (
            <LiteracyDashboardView onNavigate={(viewId) => setCurrentView(viewId)} />
          )}

          {currentView === 'literacy-register' && <LiteracyRegisterView />}

          {(currentView === 'illiterate-persons' || currentView === 'literacy-learners') && (
            <IlliteratePersonView />
          )}

          {(currentView === 'akshar-sathi' || currentView === 'literacy-volunteers') && (
            <AksharSathiView />
          )}

          {(currentView === 'exam-results' || currentView === 'literacy-exams') && (
            <ExamResultsView />
          )}

          {(currentView === 'supporting-institutions' || currentView === 'literacy-institutions' || currentView === 'literacy-partners') && (
            <SupportingInstitutionsView />
          )}

          {currentView === 'literacy-reports' && <LiteracyReportView />}

          {(currentView === 'literacy-print' || currentView === 'literacy-export') && (
            <ExportCenterView initialTab="LITERACY_FORMS" />
          )}
          </FeatureGuard>
        </main>
      </div>

      {/* 3. Official Government Footer */}
      <Footer />

      {/* 4. Logout Confirmation Dialog Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16211D] rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-gray-800 text-center space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                लॉगआउट की पुष्टि करें
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                क्या आप जन शिक्षा केंद्र मलगुवां शैक्षिक एवं प्रशासनिक प्रबंधन प्रणाली से सुरक्षित लॉगआउट करना चाहते हैं?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                लॉगआउट (Logout)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <FeatureControlProvider>
            <MainAppContent />
          </FeatureControlProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
