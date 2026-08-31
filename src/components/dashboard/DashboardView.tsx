import React from 'react';
import {
  School,
  GraduationCap,
  Users,
  CalendarCheck,
  Utensils,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { SchoolBanner } from '../common/SchoolBanner';
import { institutionConfig } from '../../config/institutionConfig';

interface DashboardViewProps {
  onNavigate: (viewId: string) => void;
  onOpenQuickAttendance?: () => void;
  onOpenQuickMDM?: () => void;
  onSelectSchool?: (udise: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenQuickAttendance,
  onOpenQuickMDM,
}) => {
  const { currentUser } = useAuth();
  const { stats, selectedSchool, schools, scopedSchools, scopedWork, notifications, auditLogs } = useData();

  const isSingleSchool = !!selectedSchool;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* If single school selected, show the official School Context Banner */}
      {selectedSchool ? (
        <SchoolBanner
          schoolName={selectedSchool.name}
          hindiName={selectedSchool.hindiName}
          udise={selectedSchool.udise}
          village={selectedSchool.village}
          gramPanchayat={selectedSchool.gramPanchayat}
          block={selectedSchool.block}
          district={selectedSchool.district}
          schoolType={selectedSchool.schoolType}
          principalName={selectedSchool.principalName}
          principalMobile={selectedSchool.principalMobile}
        />
      ) : (
        /* Cluster Welcome Banner */
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#FF7A00] text-white text-xs font-bold px-2.5 py-0.5 rounded shadow-xs">
                क्लस्टर डैशबोर्ड
              </span>
              <span className="bg-emerald-800 text-emerald-200 text-xs px-2.5 py-0.5 rounded font-medium">
                सत्र 2026-27
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {institutionConfig.institutionName} ({institutionConfig.district})
            </h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              विकास खंड {institutionConfig.block} अंतर्गत कुल {schools.length || institutionConfig.totalSchoolsCount} शासकीय विद्यालयों की वास्तविक समय शैक्षणिक, भौतिक एवं प्रशासनिक निगरानी प्रणाली
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('export')}
              className="bg-white hover:bg-emerald-50 text-[#0B6B4B] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#0B6B4B]" />
              <span>स्मार्ट प्रिंट व रिपोर्ट</span>
            </button>
            <button
              onClick={() => onNavigate('search')}
              className="bg-emerald-800/80 hover:bg-emerald-700 text-emerald-100 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-emerald-700"
            >
              वैश्विक खोज
            </button>
          </div>
        </div>
      )}

      {/* CORE DYNAMIC METRICS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Schools */}
        <div
          onClick={() => onNavigate('schools')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              {isSingleSchool ? 'विद्यालय प्रकार' : 'कुल विद्यालय'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <School className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {isSingleSchool ? selectedSchool?.schoolType : stats.totalSchools}
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center justify-between">
            <span>{isSingleSchool ? `${selectedSchool?.village || ''} | ${selectedSchool?.schoolType || ''}` : `सक्रिय: ${stats.activeSchools} | 100% संकुल`}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 2: Students */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              कुल दर्ज विद्यार्थी
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats.totalStudents}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center justify-between">
            <span>बालक: {stats.boys} | बालिका: {stats.girls}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 3: Teachers & Staff */}
        <div
          onClick={() => onNavigate('teachers')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              शिक्षक एवं स्टाफ
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white">
            {stats.totalStaff}
          </div>
          <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center justify-between">
            <span>प्र.अ.: {stats.principals} | शिक्षक: {stats.teachers} | रसोइया: {stats.rasoiya}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>

        {/* Card 4: Attendance */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs hover:border-[#0B6B4B] dark:hover:border-emerald-600 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              आज की उपस्थिति
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950 text-[#FF7A00] flex items-center justify-center group-hover:scale-105 transition-transform">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900 dark:text-white flex items-baseline gap-1.5">
            <span>{stats.todayAttendancePct}%</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              ({stats.todayPresentStudents}/{stats.todayTotalMarkedStudents})
            </span>
          </div>
          <div className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-medium flex items-center justify-between">
            <span>दैनिक उपस्थिति स्थिति</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>

      {/* SECONDARY MONITORING TILES (MDM, Facilities, Tasks, Complaints) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* MDM */}
        <div
          onClick={() => onNavigate('mdm')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              मध्याह्न भोजन (MDM)
            </span>
            <Utensils className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {stats.mdmServedCount} छात्र
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            स्थिति: <span className="font-semibold text-emerald-600 dark:text-emerald-400">{stats.mdmStatusLabel}</span>
          </p>
        </div>

        {/* Govt Work */}
        <div
          onClick={() => onNavigate('work')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              शासकीय कार्य / आदेश
            </span>
            <ClipboardList className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>{stats.pendingWorkCount + stats.inProgressWorkCount} लंबित</span>
            {stats.overdueWorkCount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold">
                {stats.overdueWorkCount} अति-लंबित
              </span>
            )}
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            पूर्ण कार्य: {stats.completedWorkCount}
          </p>
        </div>

        {/* Complaints */}
        <div
          onClick={() => onNavigate('complaints')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              शिकायत निवारण
            </span>
            <AlertTriangle className="w-4 h-4 text-[#FF7A00]" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {stats.pendingComplaints} प्रक्रियाधीन
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            कुल: {stats.totalComplaints} | निराकृत: {stats.resolvedComplaints}
          </p>
        </div>

        {/* Facilities Data Completeness */}
        <div
          onClick={() => onNavigate('facilities')}
          className="bg-white dark:bg-[#17211C] p-4 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs cursor-pointer hover:border-emerald-500 transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
              भौतिक डेटा पूर्णता
            </span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
            {stats.dataCompletenessPct}% सत्यापित
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
            विद्युत, पेयजल, शौचालय, बाउंड्रीवाल
          </p>
        </div>
      </div>

      {/* DETAILED STATISTICAL BREAKDOWN PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Social Category & CWSN Distribution */}
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              सामाजिक वर्ग अनुसार नामांकन
            </h3>
            <span className="text-xs text-gray-400 font-medium">कुल {stats.totalStudents}</span>
          </div>

          <div className="mt-4 space-y-3">
            {[
              { label: 'अनुसूचित जाति (SC)', count: stats.sc, color: 'bg-emerald-600' },
              { label: 'अनुसूचित जनजाति (ST)', count: stats.st, color: 'bg-blue-600' },
              { label: 'अन्य पिछड़ा वर्ग (OBC)', count: stats.obc, color: 'bg-amber-500' },
              { label: 'सामान्य (General)', count: stats.general, color: 'bg-purple-600' },
              { label: 'दिव्यांग (CWSN)', count: stats.cwsn, color: 'bg-rose-500' },
            ].map((cat, idx) => {
              const pct = stats.totalStudents > 0 ? Math.round((cat.count / stats.totalStudents) * 100) : 0;
              return (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-gray-700 dark:text-gray-300">{cat.label}</span>
                    <span className="text-gray-900 dark:text-white">
                      {cat.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                    <div className={`${cat.color} h-full rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800">
            त्वरित शासकीय कार्य (Quick Actions)
          </h3>
          <div className="mt-4 grid grid-cols-1 gap-2.5">
            <button
              onClick={onOpenQuickAttendance || (() => onNavigate('attendance'))}
              className="w-full p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-[#EAF6F0] dark:bg-emerald-950/50 hover:bg-emerald-100 text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#0B6B4B] text-white flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-300">
                    दैनिक उपस्थिति दर्ज करें
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">छात्र एवं शिक्षक उपस्थिति प्रविष्टि</div>
                </div>
              </div>
              <PlusCircle className="w-4 h-4 text-[#0B6B4B]" />
            </button>

            <button
              onClick={onOpenQuickMDM || (() => onNavigate('mdm'))}
              className="w-full p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 text-left flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FF7A00] text-white flex items-center justify-center">
                  <Utensils className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    MDM वितरण प्रविष्टि करें
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">आज का मेनू व लाभान्वित संख्या</div>
                </div>
              </div>
              <PlusCircle className="w-4 h-4 text-[#FF7A00]" />
            </button>

            <button
              onClick={() => onNavigate('upload')}
              className="w-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 text-left flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                    डेटा आयात / एक्सेल अपलोड
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">CSV/Excel से बल्क डेटा प्रविष्टि</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-600" />
            </button>

            <button
              onClick={() => onNavigate('export')}
              className="w-full p-2.5 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 text-left flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
                    यूनिवर्सल प्रिंट व रिपोर्ट केंद्र
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">सभी 37 विद्यालयों का संपूर्ण डोजियर</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-purple-600" />
            </button>
          </div>
        </div>

        {/* Recent Audit & System Updates */}
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              हाल की गतिविधियां (Audit Log)
            </h3>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs text-[#0B6B4B] dark:text-emerald-400 font-semibold hover:underline"
            >
              सभी देखें
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {auditLogs.slice(0, 4).map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-gray-50 dark:bg-[#0F1713] border border-gray-100 dark:border-gray-800 text-xs"
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-gray-900 dark:text-white truncate">
                    {log.details}
                  </span>
                  <span className="text-[10px] text-gray-400 whitespace-nowrap">
                    {log.time}
                  </span>
                </div>
                <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-between">
                  <span>👤 {log.userName}</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-[10px] px-1.5 py-0.2 rounded font-semibold">
                    {log.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
