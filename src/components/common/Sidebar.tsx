import React from 'react';
import {
  LayoutDashboard,
  Search,
  School,
  GraduationCap,
  Users,
  CalendarCheck,
  ClipboardCheck,
  Building2,
  Utensils,
  ClipboardList,
  BellRing,
  AlertTriangle,
  FolderLock,
  Printer,
  UploadCloud,
  History,
  FileBarChart,
  UserCheck,
  Settings,
  Sun,
  Moon,
  LogOut,
  X,
  BookOpen,
  BookMarked,
  UserPlus,
  HeartHandshake,
  Award,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { institutionConfig } from '../../config/institutionConfig';

interface SidebarProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onOpenLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  onOpenLogout,
}) => {
  const { currentUser, users } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { selectedSessionId, activeSchools } = useData();
  const { isRouteEnabled } = useFeatureControl();

  const userRole = currentUser?.role || 'TEACHER';
  const isSchoolUser = userRole === 'SCHOOL' || userRole === 'PRINCIPAL' || userRole === 'TEACHER';

  const menuSections = [
    {
      title: '01. मुख्य डैशबोर्ड व खोज',
      items: [
        { id: 'dashboard', label: 'डैशबोर्ड', sub: 'Dashboard', icon: LayoutDashboard, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'search', label: 'वैश्विक खोज', sub: 'Global Search', icon: Search, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
      ],
    },
    {
      title: '02. मास्टर डेटा',
      items: [
        { 
          id: 'schools', 
          label: isSchoolUser ? 'विद्यालय डेटा' : 'संकुल विद्यालय सूची', 
          sub: isSchoolUser ? 'School Data' : 'Schools Directory', 
          icon: School, 
          badge: isSchoolUser ? 'सक्रिय' : String(activeSchools.length), 
          roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] 
        },
        { id: 'students', label: 'विद्यार्थी', sub: 'Students', icon: GraduationCap, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'teachers', label: 'शिक्षक एवं स्टाफ', sub: 'Teachers & Staff', icon: Users, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'rasoiya', label: 'रसोइया (Cook)', sub: 'Rasoiya (Cook)', icon: Utensils, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'shg', label: 'स्व-सहायता समूह (SHG)', sub: 'Self Help Group', icon: HeartHandshake, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
      ],
    },
    {
      title: '03. दैनिक मॉनिटरिंग',
      items: [
        { id: 'attendance', label: 'दैनिक उपस्थिति', sub: 'Attendance', icon: CalendarCheck, badge: 'दैनिक', roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'cac-attendance-monitoring', label: 'दैनिक उपस्थिति मॉनिटरिंग', sub: 'CAC Monitoring', icon: ClipboardCheck, badge: 'लाइव', roles: ['CAC', 'ADMIN'] },
        { id: 'facilities', label: 'भौतिक सुविधाएं', sub: 'Physical Facilities', icon: Building2, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'mdm', label: 'मध्याह्न भोजन', sub: 'MDM Tracking', icon: Utensils, badge: 'लाइव', roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'work', label: 'शासकीय कार्य', sub: 'Government Work', icon: ClipboardList, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
      ],
    },
    {
      title: '📚 नवभारत साक्षरता कार्यक्रम',
      items: [
        { id: 'literacy-dashboard', label: 'साक्षरता डैशबोर्ड', sub: 'Literacy Dashboard', icon: BookOpen, badge: 'ULLAS', roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'literacy-register', label: 'साक्षरता पंजी', sub: 'Literacy Register', icon: BookMarked, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'literacy-learners', label: 'असाक्षर व्यक्ति', sub: 'Learners Master', icon: Users, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'literacy-volunteers', label: 'अक्षर साथी', sub: 'Akshar Sathi', icon: UserPlus, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'literacy-exams', label: 'साक्षरता परीक्षा परिणाम', sub: 'Exam Results', icon: Award, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'literacy-partners', label: 'सहयोगी विभाग / संस्थाएँ', sub: 'Partner Entities', icon: HeartHandshake, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'literacy-reports', label: 'साक्षरता रिपोर्ट', sub: 'Literacy Reports', icon: FileText, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
      ],
    },
    {
      title: '04. संवाद, शिकायत व आदेश',
      items: [
        { id: 'complaints', label: 'शिकायत निवारण', sub: 'Complaints', icon: AlertTriangle, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'notifications', label: 'सूचनाएं / आदेश', sub: 'Notifications', icon: BellRing, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'documents', label: 'दस्तावेज व प्रपत्र', sub: 'Documents Hub', icon: FolderLock, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
      ],
    },
    {
      title: '05. प्रिंट, रिपोर्ट व डेटा',
      items: [
        { 
          id: 'export', 
          label: isSchoolUser ? 'प्रिंट एवं डाउनलोड' : 'एकीकृत प्रिंट केंद्र', 
          sub: isSchoolUser ? 'Print & Download' : 'Unified Print Center (General + ULLAS)', 
          icon: Printer, 
          badge: isSchoolUser ? null : 'Unified', 
          roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] 
        },
        { id: 'reports', label: 'शासकीय रिपोर्ट केंद्र', sub: 'Reports & Analytics', icon: FileBarChart, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        { id: 'upload', label: 'डेटा प्रविष्टि एवं अपलोड', sub: 'Data Entry & Upload', icon: UploadCloud, badge: null, roles: ['ADMIN'] },
        { id: 'history', label: 'गतिविधि इतिहास', sub: 'History / Audit', icon: History, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
      ],
    },
    {
      title: isSchoolUser ? '06. प्रोफ़ाइल' : '06. प्रोफ़ाइल व उपयोगकर्ता',
      items: [
        { id: 'profile', label: 'उपयोगकर्ता प्रोफ़ाइल', sub: 'Profile', icon: UserCheck, badge: null, roles: ['CAC', 'ADMIN', 'SCHOOL', 'PRINCIPAL', 'TEACHER', 'OPERATOR'] },
        ...(!isSchoolUser ? [{
          id: 'user-directory',
          label: 'संकुल उपयोगकर्ता डायरेक्टरी',
          sub: 'Cluster User Directory',
          icon: Users,
          badge: String(users.length),
          roles: ['CAC', 'ADMIN']
        }] : []),
        { id: 'settings', label: 'सिस्टम सेटिंग्स', sub: 'Settings', icon: Settings, badge: null, roles: ['CAC', 'ADMIN'] },
      ],
    },
  ];

  const handleItemClick = (id: string) => {
    onNavigate(id);
    onCloseMobile();
  };

  // Compute flattened dynamic sequential numbers for visible menu items
  let itemCounter = 0;

  return (
    <>
      {/* Backdrop for mobile / tablet drawer */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden no-print transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 bg-[#0C1E17] text-gray-200 border-r border-[#1B382D] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-30 lg:w-64 xl:w-72 shrink-0 no-print shadow-xl ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-3.5 border-b border-[#1B382D] flex items-center justify-between bg-[#071711]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#087F5B] text-white flex items-center justify-center font-black text-base shadow-md border border-emerald-400/30 shrink-0">
              🏛️
            </div>
            <div className="truncate min-w-0">
              <div className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase truncate">
                {institutionConfig.jskName || 'जन शिक्षा केंद्र'}
              </div>
              <div className="text-sm font-extrabold text-white leading-tight truncate">
                {institutionConfig.institutionShortName || 'संकुल मलगुवां'}
              </div>
              <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
                <span className="bg-[#087F5B]/80 text-emerald-100 px-1 py-0.2 rounded text-[8.5px] font-bold">
                  {currentUser?.role === 'ADMIN' ? 'Admin Panel' : currentUser?.role === 'SCHOOL' ? 'School Panel' : 'CAC Panel'}
                </span>
                <span>सत्र {selectedSessionId || institutionConfig.academicSession}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white"
            aria-label="मेन्यू बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Logged-In User Profile Banner */}
        <div className="p-2.5 mx-2.5 mt-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#1B382D] transition-colors">
          <button
            onClick={() => handleItemClick('profile')}
            className="w-full flex items-center gap-2.5 text-left cursor-pointer"
            title="मेरी प्रोफ़ाइल देखें"
          >
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-8 h-8 rounded-lg object-cover border border-emerald-400/40 shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[#087F5B] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-400/40">
                {currentUser?.name?.charAt(0) || 'स'}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {currentUser?.name || institutionConfig.cac1.name}
              </div>
              <div className="text-[10px] text-emerald-300 truncate">
                {currentUser?.designation || (currentUser?.role === 'CAC' ? 'संकुल समन्वयक' : 'स्टाफ')}
              </div>
            </div>
            <div className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800 shrink-0">
              प्रोफ़ाइल →
            </div>
          </button>
        </div>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto py-2.5 px-2 space-y-3.5 text-xs select-none custom-scrollbar">
          {menuSections.map((sec, sIdx) => {
            const filteredItems = sec.items.filter(
              (item) => item.roles.includes(userRole) && isRouteEnabled(item.id).allowed
            );
            if (filteredItems.length === 0) return null;

            return (
              <div key={sIdx}>
                <div className="px-2 pb-1 text-[9.5px] font-bold tracking-wider text-emerald-400/70 uppercase">
                  {sec.title}
                </div>
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    itemCounter += 1;
                    const itemNum = String(itemCounter).padStart(2, '0');
                    const Icon = item.icon;
                    const isActive = currentView === item.id || 
                      (item.id === 'search' && currentView === 'global-search') || 
                      (item.id === 'export' && currentView === 'export-center') ||
                      (item.id === 'teachers' && (currentView === 'teachers' || currentView === 'staff')) ||
                      (item.id === 'rasoiya' && (currentView === 'rasoiya' || currentView === 'cook' || currentView === 'rasoiya-management')) ||
                      (item.id === 'shg' && (currentView === 'shg' || currentView === 'shgs' || currentView === 'shg-management' || currentView === 'self-help-group')) ||
                      (item.id === 'literacy-dashboard' && currentView === 'literacy');
                    return (
                      <button
                        key={item.id}
                        id={`nav-${item.id}`}
                        data-testid={`nav-${item.id}`}
                        onClick={() => handleItemClick(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg font-medium transition-all group text-left cursor-pointer min-h-[40px] ${
                          isActive
                            ? 'bg-[#087F5B] text-white shadow-xs font-bold ring-1 ring-emerald-300/30'
                            : 'text-gray-300 hover:bg-white/10 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={`text-[9.5px] font-mono font-bold px-1 py-0.2 rounded shrink-0 ${
                              isActive
                                ? 'bg-[#075C46] text-emerald-200'
                                : 'text-gray-500 group-hover:text-emerald-300'
                            }`}
                          >
                            {itemNum}
                          </span>
                          <Icon
                            className={`w-4 h-4 shrink-0 ${
                              isActive ? 'text-white' : 'text-emerald-400/80 group-hover:text-white'
                            }`}
                          />
                          <div className="truncate min-w-0">
                            <div className="text-xs font-semibold leading-tight truncate">{item.label}</div>
                            <div className={`text-[9.5px] leading-none truncate ${isActive ? 'text-emerald-100' : 'text-gray-400'}`}>
                              {item.sub}
                            </div>
                          </div>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[8.5px] px-1.5 py-0.5 rounded font-bold shrink-0 ml-1 ${
                              isActive
                                ? 'bg-[#FF8A00] text-white'
                                : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky System Controls (Theme & Logout) */}
        <div className="p-2 border-t border-[#1B382D] bg-[#071711] space-y-1">
          {/* Light / Dark Mode Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-gray-300 hover:bg-white/10 hover:text-white transition-colors text-xs font-medium cursor-pointer min-h-[38px]"
          >
            <div className="flex items-center gap-2">
              <span className="text-[9.5px] font-mono font-bold text-gray-500">⚙️</span>
              {theme === 'light' ? (
                <Moon className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
              <span>थीम: {theme === 'light' ? 'लाइट मोड' : 'डार्क मोड'}</span>
            </div>
            <span className="text-xs">
              {theme === 'light' ? '☀️' : '🌙'}
            </span>
          </button>

          {/* 18 (or 19 for CAC) Logout Button */}
          <button
            onClick={() => {
              onCloseMobile();
              onOpenLogout();
            }}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors text-xs font-bold cursor-pointer min-h-[38px]"
          >
            <span className="text-[9.5px] font-mono font-bold text-red-500/70">
              {String(itemCounter + 1).padStart(2, '0')}
            </span>
            <LogOut className="w-4 h-4" />
            <span>लॉगआउट (Logout)</span>
          </button>
        </div>
      </aside>
    </>
  );
};
