/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';

// Layout and Common Components
import { SplashScreen } from './components/splash/SplashScreen';
import { LoginView } from './components/auth/LoginView';
import { RegisterView } from './components/auth/RegisterView';
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
import { FacilitiesView } from './components/facilities/FacilitiesView';
import { MDMView } from './components/mdm/MDMView';
import { GovernmentWorkView } from './components/work/GovernmentWorkView';
import { ComplaintsView } from './components/complaints/ComplaintsView';
import { NotificationsView } from './components/notifications/NotificationsView';
import { DocumentsView } from './components/documents/DocumentsView';
import { ExportCenterView } from './components/export/ExportCenterView';
import { DataUploadView } from './components/upload/DataUploadView';
import { AuditLogView } from './components/audit/AuditLogView';
import { ReportsView } from './components/reports/ReportsView';
import { GlobalSearchView } from './components/search/GlobalSearchView';
import { ProfileView } from './components/profile/ProfileView';
import { SettingsView } from './components/settings/SettingsView';

// Icons
import { LogOut } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, logout, currentUser } = useAuth();
  const { logActivity } = useData();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Auth View State ('LOGIN' or 'REGISTER')
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');

  // Active Navigation View State
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProfileUdise, setSelectedProfileUdise] = useState<string | null>(null);

  // Mobile Sidebar Drawer State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Global Search Query State
  const [searchQuery, setSearchQuery] = useState('');

  // Logout Confirmation Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

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

  const handleSelectSchoolFromList = (udise: string) => {
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
    logout();
    setAuthMode('LOGIN');
  };

  return (
    <div className="min-h-screen bg-[#F8FAF8] dark:bg-[#0F1714] text-[#17211C] dark:text-[#F4F7F5] flex flex-col font-sans transition-colors duration-150 w-full overflow-x-hidden">
      {/* 1. Official Top & Navigation Header with Context Ribbon */}
      <Header
        onOpenGlobalSearch={() => handleGlobalSearch('')}
        onOpenMobileSidebar={() => setIsSidebarOpen(true)}
        onNavigate={(viewId) => {
          setCurrentView(viewId);
          setIsSidebarOpen(false);
        }}
        onOpenLogoutDialog={() => setShowLogoutModal(true)}
      />

      {/* 2. Main Workspace Layout */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 gap-4 md:gap-6 min-w-0">
        {/* Navigation Sidebar (Desktop visible, Tablet/Mobile Drawer) */}
        <Sidebar
          currentView={currentView}
          onNavigate={(viewId) => {
            setCurrentView(viewId);
            setIsSidebarOpen(false);
          }}
          mobileOpen={isSidebarOpen}
          onCloseMobile={() => setIsSidebarOpen(false)}
          onOpenLogout={() => setShowLogoutModal(true)}
        />

        {/* Dynamic Main Workspace Content */}
        <main className="flex-1 min-w-0 w-full space-y-4 md:space-y-6">
          {/* Views Routing */}
          {/* Fallback to Dashboard if invalid/legacy route */}
          {!['schools', 'school-profile', 'students', 'teachers', 'attendance', 'facilities', 'mdm', 'work', 'government-work', 'notifications', 'complaints', 'documents', 'export', 'export-center', 'upload', 'history', 'audit-log', 'reports', 'search', 'global-search', 'profile', 'settings'].includes(currentView) && (
            <DashboardView
              onNavigate={(viewId) => setCurrentView(viewId)}
              onSelectSchool={handleSelectSchoolFromList}
            />
          )}

          {currentView === 'schools' && (
            <SchoolListView onSelectSchool={handleSelectSchoolFromList} />
          )}

          {currentView === 'school-profile' && selectedProfileUdise && (
            <SchoolProfileView
              udise={selectedProfileUdise}
              onBack={() => setCurrentView('schools')}
              onNavigateToStudent={() => setCurrentView('students')}
              onNavigateToStaff={() => setCurrentView('teachers')}
            />
          )}

          {currentView === 'students' && <StudentsView />}

          {currentView === 'teachers' && <TeachersView />}

          {currentView === 'attendance' && <AttendanceView />}

          {currentView === 'facilities' && <FacilitiesView />}

          {currentView === 'mdm' && <MDMView />}

          {(currentView === 'work' || currentView === 'government-work') && <GovernmentWorkView />}

          {currentView === 'notifications' && <NotificationsView />}

          {currentView === 'complaints' && <ComplaintsView />}

          {currentView === 'documents' && <DocumentsView />}

          {(currentView === 'export' || currentView === 'export-center') && <ExportCenterView />}

          {currentView === 'upload' && <DataUploadView />}

          {(currentView === 'history' || currentView === 'audit-log') && <AuditLogView />}

          {currentView === 'reports' && <ReportsView />}

          {(currentView === 'search' || currentView === 'global-search') && (
            <GlobalSearchView
              initialQuery={searchQuery}
              onSelectSchool={handleSelectSchoolFromList}
              onNavigate={(viewId) => setCurrentView(viewId)}
            />
          )}

          {currentView === 'profile' && <ProfileView />}

          {currentView === 'settings' && <SettingsView />}
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
          <MainAppContent />
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
