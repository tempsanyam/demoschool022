import React, { useState } from 'react';
import {
  RefreshCw,
  FileSpreadsheet,
  PlusCircle,
  CalendarCheck,
  Utensils,
  TrendingUp,
  ArrowRight,
  School,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react';
import { useSchoolScope } from '../../hooks/useSchoolScope';
import { useData } from '../../context/DataContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { SchoolBanner } from '../common/SchoolBanner';
import { institutionConfig } from '../../config/institutionConfig';
import { getActiveDashboardWidgets } from '../../config/dashboardWidgets';
import { DashboardWidgetCard } from './DashboardWidgetCard';
import { PendingActionsCard } from './PendingActionsCard';
import { AuditRecentActivityCard } from './AuditRecentActivityCard';

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
  onSelectSchool,
}) => {
  const scope = useSchoolScope();
  const { selectedSessionId } = useData();
  const { isFeatureEnabled, isRouteEnabled } = useFeatureControl();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>(() =>
    new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setLastRefreshTime(
        new Date().toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
      setIsRefreshing(false);
    }, 450);
  };

  const coreWidgets = getActiveDashboardWidgets(scope, 'CORE_METRIC');
  const secondaryWidgets = getActiveDashboardWidgets(scope, 'SECONDARY_METRIC');

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-200">
      {/* 1. Context Banner (School-Specific for School Users vs Cluster Banner for CAC/Admin) */}
      {scope.isSchoolUser && scope.currentSchool ? (
        <SchoolBanner
          schoolName={scope.currentSchool.name}
          hindiName={scope.currentSchool.hindiName}
          udise={scope.currentSchool.udise}
          village={scope.currentSchool.village}
          gramPanchayat={scope.currentSchool.gramPanchayat}
          block={scope.currentSchool.block}
          district={scope.currentSchool.district}
          schoolType={scope.currentSchool.schoolType}
          principalName={scope.currentSchool.principalName}
          principalMobile={scope.currentSchool.principalMobile}
        />
      ) : (
        /* Cluster Welcome Banner (Admin & CAC) */
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-900 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-[#FF7A00] text-white text-xs font-bold px-2.5 py-0.5 rounded shadow-xs">
                क्लस्टर डैशबोर्ड
              </span>
              <span className="bg-emerald-800 text-emerald-200 text-xs px-2.5 py-0.5 rounded font-medium">
                सत्र {selectedSessionId}
              </span>
              <span className="bg-emerald-700/60 text-emerald-100 text-xs px-2 py-0.5 rounded font-medium">
                {institutionConfig.sankulName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {institutionConfig.institutionName} ({institutionConfig.district})
            </h1>
            <p className="text-emerald-200 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              विकास खंड {institutionConfig.block} अंतर्गत कुल {scope.schools.length} शासकीय विद्यालयों की वास्तविक समय शैक्षणिक, भौतिक एवं प्रशासनिक निगरानी प्रणाली
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isFeatureEnabled('module.dashboard.action.print_summary') && (
              <button
                onClick={() => onNavigate('export')}
                className="bg-white hover:bg-emerald-50 text-[#0B6B4B] font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-[#0B6B4B]" />
                <span>डोजियर व रिपोर्ट</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('search')}
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all border border-emerald-700 flex items-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>वैश्विक खोज</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Live Sync & Refresh Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-[#17211C] px-4 py-2.5 rounded-xl border border-[#DDE7E2] dark:border-[#2B3933] text-xs">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0B6B4B]"></span>
          </span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            वास्तविक समय डेटा सिंक सक्रिय
          </span>
          <span className="text-gray-400 hidden sm:inline">•</span>
          <span className="text-gray-500 dark:text-gray-400 hidden sm:inline">
            अंतिम अद्यतन: {lastRefreshTime}
          </span>
        </div>

        <button
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs font-bold text-[#0B6B4B] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/80 transition-all cursor-pointer"
          title="डेटा पुनः ताज़ा करें"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'सिंक हो रहा है...' : 'ताज़ा करें'}</span>
        </button>
      </div>

      {/* 3. CORE DYNAMIC METRICS GRID (Extensible Widget Architecture) */}
      {isFeatureEnabled('module.dashboard.sub.kpi_cards') && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {coreWidgets.map((widget) => (
              <DashboardWidgetCard
                key={widget.id}
                widget={widget}
                scopeContext={scope}
                onNavigate={onNavigate}
                variant="core"
              />
            ))}
          </div>

          {/* 4. SECONDARY OPERATIONAL METRIC TILES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            {secondaryWidgets.map((widget) => (
              <DashboardWidgetCard
                key={widget.id}
                widget={widget}
                scopeContext={scope}
                onNavigate={onNavigate}
                variant="secondary"
              />
            ))}
          </div>
        </>
      )}

      {/* 5. DETAILED ANALYTICAL & ACTION PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Column 1: Social Category & Demographic Distribution */}
        {isFeatureEnabled('module.dashboard.sub.analytics_charts') && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                    सामाजिक वर्ग अनुसार नामांकन
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    SC, ST, OBC, General एवं दिव्यांग
                  </p>
                </div>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold px-2 py-0.5 rounded-md">
                कुल: {scope.scopedStats.totalStudents}
              </span>
            </div>

            {scope.scopedStats.totalStudents === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400 dark:text-gray-500">
                अभी कोई विद्यार्थी दर्ज नहीं है
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {[
                  { label: 'अनुसूचित जाति (SC)', count: scope.scopedStats.sc, color: 'bg-emerald-600' },
                  { label: 'अनुसूचित जनजाति (ST)', count: scope.scopedStats.st, color: 'bg-blue-600' },
                  { label: 'अन्य पिछड़ा वर्ग (OBC)', count: scope.scopedStats.obc, color: 'bg-amber-500' },
                  { label: 'सामान्य (General)', count: scope.scopedStats.general, color: 'bg-purple-600' },
                  { label: 'दिव्यांग विद्यार्थी (CWSN)', count: scope.scopedStats.cwsn, color: 'bg-rose-500' },
                ].map((cat, idx) => {
                  const pct =
                    scope.scopedStats.totalStudents > 0
                      ? Math.round((cat.count / scope.scopedStats.totalStudents) * 100)
                      : 0;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-gray-700 dark:text-gray-300">{cat.label}</span>
                        <span className="text-gray-900 dark:text-white font-mono">
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
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>समेकित छात्रवृत्ति पोर्टल सत्यापन</span>
            {isRouteEnabled('students').allowed && (
              <button
                onClick={() => onNavigate('students')}
                className="text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
              >
                छात्र सूची देखें →
              </button>
            )}
          </div>
        </div>
        )}

        {/* Column 2: Pending & Action Required Items Card */}
        {isFeatureEnabled('module.dashboard.sub.pending_actions') && (
          <PendingActionsCard
            items={scope.pendingActionItems}
            onNavigate={onNavigate}
            onOpenQuickAttendance={onOpenQuickAttendance}
            onOpenQuickMDM={onOpenQuickMDM}
          />
        )}
      </div>

      {/* 6. LOWER WORKSPACE: QUICK ACTIONS & RECENT AUDIT TRAIL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        {/* Quick Government Actions Panel */}
        {isFeatureEnabled('module.dashboard.action.quick_entry') && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#FF7A00]" />
                त्वरित शासकीय कार्य (Quick Actions)
              </h3>
              <span className="text-[11px] text-gray-400">एक-क्लिक पहुंच</span>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {isRouteEnabled('attendance').allowed && isFeatureEnabled('module.attendance.action.mark_save') && (
              <button
                onClick={onOpenQuickAttendance || (() => onNavigate('attendance'))}
                className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-[#EAF6F0] dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/70 text-left flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#0B6B4B] text-white flex items-center justify-center shrink-0">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#0B6B4B] dark:text-emerald-300">
                      दैनिक उपस्थिति दर्ज करें
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      छात्र एवं शिक्षक उपस्थिति प्रविष्टि
                    </div>
                  </div>
                </div>
                <PlusCircle className="w-4 h-4 text-[#0B6B4B]" />
              </button>
              )}

              {isRouteEnabled('mdm').allowed && isFeatureEnabled('module.mdm.action.add_edit') && (
              <button
                onClick={onOpenQuickMDM || (() => onNavigate('mdm'))}
                className="p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/70 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-950/60 text-left flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#FF7A00] text-white flex items-center justify-center shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900 dark:text-amber-300">
                      MDM वितरण प्रविष्टि
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      आज का मेनू व लाभान्वित संख्या
                    </div>
                  </div>
                </div>
                <PlusCircle className="w-4 h-4 text-[#FF7A00]" />
              </button>
              )}

              {isRouteEnabled('upload').allowed && (
                <button
                  onClick={() => onNavigate('upload')}
                  className="p-3 rounded-xl border border-blue-200 dark:border-blue-800/60 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-950/60 text-left flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-300">
                        डेटा प्रविष्टि एवं अपलोड
                      </div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-400">
                        Excel (.xlsx) से थोक डेटा प्रविष्टि
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-blue-600" />
                </button>
              )}

              {isRouteEnabled('export').allowed && (
              <button
                onClick={() => onNavigate('export')}
                className="p-3 rounded-xl border border-purple-200 dark:border-purple-800/60 bg-purple-50/70 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-950/60 text-left flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-300">
                      प्रिंट व रिपोर्ट केंद्र
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      दस्तावेज, रोस्टर व प्रमाण पत्र
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </button>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>अक्सर प्रयुक्त शासकीय सेवाएं</span>
            {isRouteEnabled('complaints').allowed && (
              <button
                onClick={() => onNavigate('complaints')}
                className="text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
              >
                शिकायत दर्ज करें →
              </button>
            )}
          </div>
        </div>
        )}

        {/* Scoped Recent Audit Log Activity Card */}
        <AuditRecentActivityCard
          activities={scope.recentActivities}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
};
