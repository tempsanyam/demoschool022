import React, { useState } from 'react';
import {
  BookOpen,
  Users,
  Award,
  UserPlus,
  HeartHandshake,
  FileSpreadsheet,
  Printer,
  CheckCircle2,
  Clock,
  TrendingUp,
  School as SchoolIcon,
  ChevronRight,
  Filter,
  PlusCircle,
  HelpCircle,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { institutionConfig } from '../../config/institutionConfig';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyFormPrintModal } from './LiteracyFormPrintModal';

interface LiteracyDashboardViewProps {
  onNavigate: (viewId: string) => void;
}

export const LiteracyDashboardView: React.FC<LiteracyDashboardViewProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    scopedLiteracyRegisters,
    scopedIlliteratePersons,
    scopedAksharSathis,
    scopedExamCycles,
    scopedLiteracyExamResults,
    scopedSupportingInstitutions,
    literacyStats,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';
  const [selectedCycleId, setSelectedCycleId] = useState<string>('ALL');

  // Compute gender stats from scoped learners
  const totalLearners = scopedIlliteratePersons.length;
  const femaleLearners = scopedIlliteratePersons.filter((p) => p.gender === 'महिला').length;
  const maleLearners = scopedIlliteratePersons.filter((p) => p.gender === 'पुरुष').length;
  const femalePct = totalLearners > 0 ? Math.round((femaleLearners / totalLearners) * 100) : 0;
  const malePct = totalLearners > 0 ? 100 - femalePct : 0;

  // Category stats
  const scCount = scopedIlliteratePersons.filter((p) => p.category === 'SC').length;
  const stCount = scopedIlliteratePersons.filter((p) => p.category === 'ST').length;
  const obcCount = scopedIlliteratePersons.filter((p) => p.category === 'OBC').length;
  const genCount = scopedIlliteratePersons.filter((p) => p.category === 'GEN' || p.category === 'सामान्य').length;

  // Volunteer stats
  const totalVolunteers = scopedAksharSathis.length;
  const mappedVolunteers = scopedAksharSathis.filter((v) => v.mappedLearnerCount > 0).length;

  // Literacy certification rate
  const passRate = literacyStats.totalExamAppeared > 0
    ? Math.round((literacyStats.totalCertified / literacyStats.totalExamAppeared) * 100)
    : 0;

  const getUllasDashboardExportPayload = () => {
    const headers = ['सूचकांक (Metric)', 'मान (Value)', 'विवरण'];
    const rows = [
      ['कुल सर्वेक्षित असाक्षर', String(literacyStats.totalIdentified), `पुरुष: ${maleLearners}, महिला: ${femaleLearners}`],
      ['उल्लास मोबाइल ऐप पंजीकृत', String(literacyStats.totalRegisteredOnApp), 'मोबाइल ऐप पर सत्यापित असाक्षर'],
      ['कुल पंजीकृत अक्षर साथी (VT)', String(literacyStats.totalVolunteers), `मैप्ड स्वयंसेवक: ${mappedVolunteers}`],
      ['संचालित अध्यापन केंद्र', String(literacyStats.totalTeachingCenters), 'संकुल अंतर्गत क्रियाशील केंद्र'],
      ['मूल्यांकन परीक्षा सम्मिलित', String(literacyStats.totalExamAppeared), 'FLNAT बुनियादी साक्षरता मूल्यांकन परीक्षा'],
      ['सफलतापूर्वक उत्तीर्ण व प्रमाणित', String(literacyStats.totalCertified), `उत्तीर्ण दर: ${passRate}%`],
      ['अवशेष असाक्षर लक्ष्य', String(literacyStats.totalRemaining), 'आगामी सत्र हेतु शेष लक्ष्य']
    ];
    return {
      title: 'उल्लास नव भारत साक्षरता कार्यक्रम (ULLAS - NILP) - सारांश रिपोर्ट',
      subtitle: `संकुल मलगुवां | तिथि: ${new Date().toLocaleDateString('hi-IN')}`,
      schoolName: selectedSchool?.name || currentUser?.assignedSchoolName,
      udise: currentSchoolUdise,
      headers,
      rows,
      fileName: `ULLAS_Summary_${Date.now()}`
    };
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-[#0C3827] via-[#0D4D36] to-[#0A6345] rounded-2xl p-5 sm:p-6 text-white shadow-lg border border-emerald-500/20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-xs font-semibold border border-emerald-300/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>उल्लास : नवभारत साक्षरता कार्यक्रम (ULLAS - NILP)</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>📚 साक्षरता मॉनिटरिंग डैशबोर्ड</span>
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
              15 वर्ष से अधिक आयु वर्ग के असाक्षर नागरिकों का चिन्हांकन, अक्षर साथी मैपिंग, शिक्षण संचालन एवं बुनियादी साक्षरता व संख्याज्ञान मूल्यांकन।
            </p>
          </div>

          {/* School Selector (CAC/Admin only) or School Badge (School user) */}
          <div className="shrink-0">
            {isSchoolUser ? (
              <div className="bg-black/30 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-white/10 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <SchoolIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-emerald-300 font-medium">लॉगिन शाला (अधिकार क्षेत्र)</div>
                  <div className="text-sm font-bold text-white truncate max-w-[240px]">
                    {selectedSchool?.name || currentUser?.assignedSchoolName || 'शासकीय शाला'}
                  </div>
                  <div className="text-[10px] text-emerald-200 font-mono">UDISE: {currentSchoolUdise}</div>
                </div>
              </div>
            ) : (
              <div className="bg-black/30 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 space-y-1">
                <label className="text-[11px] font-semibold text-emerald-200 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" />
                  <span>शाला फ़िल्टर (Cluster Control)</span>
                </label>
                <select
                  id="literacy-school-filter"
                  value={selectedSchoolUdise}
                  onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                  aria-label="शाला का चयन करें"
                  className="w-full sm:w-64 bg-emerald-950/80 text-white text-xs rounded-lg px-3 py-1.5 border border-emerald-500/40 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 font-medium"
                >
                  <option value="">समस्त सक्रिय विद्यालय (संकुल मलगुवां)</option>
                  {schools.map((s) => (
                    <option key={s.udise} value={s.udise}>
                      {s.name} ({s.village})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Quick Module Buttons Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-4 mt-4 border-t border-white/10">
          <button
            onClick={() => onNavigate('literacy-register')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
          >
            <span>साक्षरता पंजी</span>
          </button>
          <button
            onClick={() => onNavigate('literacy-learners')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
          >
            <span>असाक्षर व्यक्ति</span>
          </button>
          <button
            onClick={() => onNavigate('literacy-volunteers')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
          >
            <span>अक्षर साथी</span>
          </button>
          <button
            onClick={() => onNavigate('literacy-exams')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
          >
            <span>परीक्षा परिणाम</span>
          </button>
          <button
            onClick={() => onNavigate('literacy-partners')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
          >
            <span>सहयोगी संस्थाएँ</span>
          </button>
          <button
            onClick={() => onNavigate('literacy-reports')}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer text-center"
          >
            <span>रिपोर्ट्स</span>
          </button>
          <UnifiedPrintButton
            id="literacy-dashboard-unified-print"
            currentSchoolName={selectedSchool?.name || currentUser?.assignedSchoolName}
            currentUdise={currentSchoolUdise}
            onPrintCurrentView={() => window.print()}
            onPrintReport={() => onNavigate('export')}
            onPrintLiteracyForm={() => setIsPrintModalOpen(true)}
            currentViewLabel="Print Current View"
            currentViewSubtext="डैशबोर्ड स्क्रीन एवं सांख्यिकी का त्वरित प्रिंट"
            reportLabel="Report (General Center)"
            reportSubtext="शाला, शिक्षक एवं संकुल महा-डोजियर प्रिंट केंद्र"
            literacyFormLabel="Literacy Form (ULLAS)"
            literacyFormSubtext="उल्लास नवभारत साक्षरता आधिकारिक प्रपत्र (01 से 05)"
            exportPayload={getUllasDashboardExportPayload}
          />
        </div>
      </div>

      {/* 2. Key Metrics Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Surveyed */}
        <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">कुल चिन्हांकित असाक्षर</span>
            <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-gray-900 dark:text-white">
            {literacyStats.totalSurveyedIlliterate}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            15+ आयु वर्ग सर्वे
          </div>
        </div>

        {/* Registered on App */}
        <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">उल्लास ऐप पंजीकृत</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-blue-600 dark:text-blue-400">
            {literacyStats.totalRegisteredOnApp}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {totalLearners > 0 ? Math.round((literacyStats.totalRegisteredOnApp / totalLearners) * 100) : 0}% कवरेज
          </div>
        </div>

        {/* Akshar Sathis */}
        <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">सक्रिय अक्षर साथी</span>
            <UserPlus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-purple-600 dark:text-purple-400">
            {totalVolunteers}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {mappedVolunteers} साथी अध्यापनरत
          </div>
        </div>

        {/* Exam Appeared */}
        <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">परीक्षा में सम्मिलित</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-400">
            {literacyStats.totalExamAppeared}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            मूल्यांकन में उपस्थित
          </div>
        </div>

        {/* Certified Literate */}
        <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">उत्तीर्ण / साक्षर प्रमाणित</span>
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {literacyStats.totalCertified}
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {passRate}% सफलता दर
          </div>
        </div>

        {/* Remaining Illiterate */}
        <div className="bg-white dark:bg-[#16221D] p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400">
            <span className="text-xs font-medium">अवशेष असाक्षर व्यक्ति</span>
            <TrendingUp className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600 dark:text-rose-400">
            {literacyStats.totalRemaining}
          </div>
          <div className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            लक्ष्य प्रगति हेतु शेष
          </div>
        </div>
      </div>

      {/* 3. Detailed Progress & Category Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gender Breakdown */}
        <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>लिंगवार अनुपात (Gender Distribution)</span>
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">कुल {totalLearners}</span>
          </div>

          <div className="space-y-3">
            {/* Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden flex">
              <div
                className="bg-rose-500 h-full transition-all"
                style={{ width: `${femalePct}%` }}
                title={`महिला: ${femaleLearners} (${femalePct}%)`}
              />
              <div
                className="bg-sky-500 h-full transition-all"
                style={{ width: `${malePct}%` }}
                title={`पुरुष: ${maleLearners} (${malePct}%)`}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40">
                <div className="text-xs text-rose-700 dark:text-rose-300 font-medium">महिला शिक्षार्थी</div>
                <div className="text-xl font-bold text-rose-800 dark:text-rose-200 mt-1">{femaleLearners}</div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400">{femalePct}% अनुपात</div>
              </div>
              <div className="p-3 rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900/40">
                <div className="text-xs text-sky-700 dark:text-sky-300 font-medium">पुरुष शिक्षार्थी</div>
                <div className="text-xl font-bold text-sky-800 dark:text-sky-200 mt-1">{maleLearners}</div>
                <div className="text-[11px] text-sky-600 dark:text-sky-400">{malePct}% अनुपात</div>
              </div>
            </div>
          </div>

          {/* Category Split */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
            <div className="text-xs font-semibold text-gray-700 dark:text-gray-300">सामाजिक वर्गवार विवरण</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">SC</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{scCount}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">ST</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{stCount}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">OBC</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{obcCount}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
                <div className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">सामान्य</div>
                <div className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">{genCount}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Examination & Certification Status */}
        <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>मूल्यांकन एवं परीक्षा प्रगति</span>
            </h3>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
              {scopedExamCycles.length} सत्र
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">सर्वेक्षित कुल शिक्षार्थी:</span>
              <span className="font-bold text-gray-900 dark:text-white">{literacyStats.totalSurveyedIlliterate}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">परीक्षा में सम्मिलित:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{literacyStats.totalExamAppeared}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">साक्षर उत्तीर्ण प्रमाणित:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{literacyStats.totalCertified}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">अनुत्तीर्ण शिक्षार्थी:</span>
              <span className="font-bold text-rose-600 dark:text-rose-400">{literacyStats.totalFailed}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-600 dark:text-gray-400">शेष असाक्षर शिक्षार्थी:</span>
              <span className="font-bold text-gray-900 dark:text-white">{literacyStats.totalRemaining}</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('literacy-exams')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors text-xs cursor-pointer"
          >
            <span>परीक्षा परिणाम प्रविष्टि व विवरण देखें →</span>
          </button>
        </div>

        {/* Akshar Sathi & Community Collaboration */}
        <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>अक्षर साथी व सहयोगी संस्थाएँ</span>
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">स्वयंसेवी संबल</span>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-purple-900 dark:text-purple-200">पंजीकृत अक्षर साथी</div>
                <div className="text-[11px] text-purple-700 dark:text-purple-300 mt-0.5">शिक्षण कार्य में समर्पित स्वयंसेवक</div>
              </div>
              <div className="text-2xl font-black text-purple-700 dark:text-purple-300">{totalVolunteers}</div>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">सहयोगी विभाग / संस्थाएँ</div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-0.5">WCD, NYK, आजीविका मिशन आदि</div>
              </div>
              <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {scopedSupportingInstitutions.length}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-blue-900 dark:text-blue-200">साक्षरता पंजी संधारित</div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">विद्यालयवार अद्यतन पंजी अभिलेख</div>
              </div>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-300">
                {scopedLiteracyRegisters.length}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('literacy-volunteers')}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs cursor-pointer"
          >
            <span>अक्षर साथी सूची व मैपिंग देखें →</span>
          </button>
        </div>
      </div>

      {/* 4. Recent Surveyed Learners Sample Table */}
      <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/50 dark:bg-gray-900/20">
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>असाक्षर व्यक्ति सर्वेक्षण पंजी (हाल ही में दर्ज)</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                कुल: {scopedIlliteratePersons.length}
              </span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              15+ आयु वर्ग असाक्षर व्यक्तियों का अभिलेखीय विवरण
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('literacy-learners')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#087F5B] hover:bg-[#076C4D] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>नया व्यक्ति जोड़ें</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-gray-800 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3">क्र.</th>
                <th className="py-2.5 px-3">असाक्षर व्यक्ति का नाम</th>
                <th className="py-2.5 px-3">पिता/पति का नाम</th>
                <th className="py-2.5 px-3">आयु / लिंग</th>
                <th className="py-2.5 px-3">वर्ग</th>
                <th className="py-2.5 px-3">मोबाइल नंबर</th>
                <th className="py-2.5 px-3">शाला / ग्राम</th>
                <th className="py-2.5 px-3">अक्षर साथी</th>
                <th className="py-2.5 px-3">परीक्षा स्थिति</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
              {scopedIlliteratePersons.slice(0, 8).map((person, idx) => (
                <tr key={person.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-gray-500 dark:text-gray-400">{idx + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">
                    {person.name}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 dark:text-gray-300">
                    {person.fatherOrHusbandName || '—'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-medium text-gray-900 dark:text-white">{person.age} वर्ष</span> /{' '}
                    <span className={person.gender === 'महिला' ? 'text-rose-600 font-semibold' : 'text-sky-600 font-semibold'}>
                      {person.gender}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {person.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-gray-600 dark:text-gray-300">
                    {person.mobileNumber || '—'}
                  </td>
                  <td className="py-2.5 px-3 text-gray-700 dark:text-gray-300 truncate max-w-[160px]" title={person.schoolName}>
                    {person.schoolName}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-purple-700 dark:text-purple-300">
                    {person.assignedAksharSathiName || 'आवंटित नहीं'}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        person.examResult === 'उत्तीर्ण'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : person.examResult === 'अनुत्तीर्ण'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {person.examResult || 'सम्मिलित नहीं'}
                    </span>
                  </td>
                </tr>
              ))}
              {scopedIlliteratePersons.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-500 dark:text-gray-400">
                    कोई असाक्षर व्यक्ति का रिकॉर्ड उपलब्ध नहीं है।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {scopedIlliteratePersons.length > 8 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-800 text-center bg-gray-50/30 dark:bg-gray-900/10">
            <button
              onClick={() => onNavigate('literacy-learners')}
              className="text-xs font-bold text-[#087F5B] hover:text-[#076C4D] cursor-pointer inline-flex items-center gap-1"
            >
              <span>समस्त {scopedIlliteratePersons.length} असाक्षर व्यक्तियों की पूर्ण सूची देखें</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 5. Instructions & Reference Guidelines */}
      <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-3">
        <HelpCircle className="w-5 h-5 text-[#087F5B] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold">नवभारत साक्षरता कार्यक्रम (ULLAS) महत्वपूर्ण दिशा-निर्देश:</div>
          <p className="leading-relaxed">
            1. 15 वर्ष या अधिक आयु वर्ग के असाक्षर नागरिकों का सर्वेक्षण कर 'असाक्षर व्यक्ति पंजी' में प्रविष्टि अनिवार्य है।<br />
            2. प्रत्येक 10 असाक्षरों पर कम से कम एक 'अक्षर साथी' (स्वयंसेवक) का चयन एवं टैगिंग की जाए।<br />
            3. बुनियादी साक्षरता एवं संख्याज्ञान मूल्यांकन परीक्षा वर्ष में दो बार राष्ट्रीय मुक्त विद्यालयी शिक्षा संस्थान (NIOS) के समन्वय से आयोजित की जाती है।
          </p>
        </div>
      </div>

      {isPrintModalOpen && (
        <LiteracyFormPrintModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          defaultForm="FORM_3"
        />
      )}
    </div>
  );
};
