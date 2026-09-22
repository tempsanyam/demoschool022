import React, { useState } from 'react';
import {
  FileText,
  Filter,
  Download,
  Printer,
  BarChart3,
  PieChart as PieIcon,
  Users,
  Award,
  CheckCircle,
  Building,
  TrendingUp,
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { UnifiedPrintButton } from '../common/UnifiedPrintButton';
import { LiteracyFormPrintModal } from './LiteracyFormPrintModal';

export const LiteracyReportView: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    schools,
    selectedSchoolUdise,
    setSelectedSchoolUdise,
    selectedSchool,
    currentSchoolUdise,
    scopedLiteracyRegisters,
    scopedIlliteratePersons,
    scopedAksharSathis,
    scopedLiteracyExamResults,
    scopedSupportingInstitutions,
  } = useData();

  const isSchoolUser = currentUser?.role === 'SCHOOL';

  // Active Report Tab
  const [activeTab, setActiveTab] = useState<'SCHOOL_SUMMARY' | 'CATEGORY_ANALYSIS' | 'AGE_ANALYSIS' | 'EXAM_PERFORMANCE'>('SCHOOL_SUMMARY');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Calculations for Category Analysis
  const categories = ['SC', 'ST', 'OBC', 'GEN', 'अल्पसंख्यक'];
  const categoryData = categories.map((cat) => {
    const list = scopedIlliteratePersons.filter((p) => p.category === cat);
    const m = list.filter((p) => p.gender === 'पुरुष').length;
    const f = list.filter((p) => p.gender === 'महिला').length;
    const passed = list.filter((p) => p.examResult === 'उत्तीर्ण').length;
    return {
      category: cat,
      male: m,
      female: f,
      total: m + f,
      passed,
      percentage: scopedIlliteratePersons.length > 0 ? Math.round(((m + f) / scopedIlliteratePersons.length) * 100) : 0,
    };
  });

  // Calculations for Age Groups
  const ageGroups = [
    { label: '15 से 25 वर्ष', min: 15, max: 25 },
    { label: '26 से 35 वर्ष', min: 26, max: 35 },
    { label: '36 से 50 वर्ष', min: 36, max: 50 },
    { label: '50 वर्ष से अधिक', min: 51, max: 120 },
  ];

  const ageData = ageGroups.map((grp) => {
    const list = scopedIlliteratePersons.filter((p) => p.age >= grp.min && p.age <= grp.max);
    const m = list.filter((p) => p.gender === 'पुरुष').length;
    const f = list.filter((p) => p.gender === 'महिला').length;
    const passed = list.filter((p) => p.examResult === 'उत्तीर्ण').length;
    return {
      group: grp.label,
      male: m,
      female: f,
      total: m + f,
      passed,
      percentage: scopedIlliteratePersons.length > 0 ? Math.round(((m + f) / scopedIlliteratePersons.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-[#16221D] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <FileText className="w-4 h-4" />
            <span>साक्षरता प्रगति एवं सांख्यिकी रिपोर्ट (Progress Reports)</span>
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white mt-1">
            नवभारत साक्षरता कार्यक्रम रिपोर्ट
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            शालावार प्रगति, सामाजिक वर्गवार विश्लेषण, आयु वर्ग वर्गीकरण एवं परीक्षा परिणामों की विश्लेषणात्मक रिपोर्ट।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* School Selector (for CAC/Admin only) */}
          {!isSchoolUser && (
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              <select
                value={selectedSchoolUdise}
                onChange={(e) => setSelectedSchoolUdise(e.target.value)}
                aria-label="विद्यालय का चयन करें"
                className="bg-transparent text-xs font-medium text-gray-900 dark:text-white border-0 focus:ring-0 focus:outline-hidden"
              >
                <option value="">समस्त विद्यालय ({schools.length})</option>
                {schools.map((s) => (
                  <option key={s.udise} value={s.udise}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <UnifiedPrintButton
            id="literacy-report-unified-print"
            onPrintCurrentView={() => window.print()}
            onPrintReport={() => setIsPrintModalOpen(true)}
            onPrintLiteracyForm={() => setIsPrintModalOpen(true)}
            currentViewLabel="Print Current View"
            currentViewSubtext="वर्तमान साक्षरता रिपोर्ट व सांख्यिकी तालिका का प्रिंट"
            reportLabel="Print Report"
            reportSubtext="साक्षरता विश्लेषण / आधिकारिक A4 रिपोर्ट प्रारूप"
            literacyFormLabel="ULLAS Forms (01-05)"
            literacyFormSubtext="ULLAS आधिकारिक प्रपत्र 01 से 05 प्रिंट करें"
            buttonLabel="Print"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab('SCHOOL_SUMMARY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'SCHOOL_SUMMARY'
              ? 'bg-[#087F5B] text-white shadow-xs'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          १. शालावार साक्षरता प्रगति सारांश
        </button>
        <button
          onClick={() => setActiveTab('CATEGORY_ANALYSIS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'CATEGORY_ANALYSIS'
              ? 'bg-[#087F5B] text-white shadow-xs'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          २. सामाजिक वर्गवार विश्लेषण
        </button>
        <button
          onClick={() => setActiveTab('AGE_ANALYSIS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'AGE_ANALYSIS'
              ? 'bg-[#087F5B] text-white shadow-xs'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          ३. आयु वर्गवार वर्गीकरण
        </button>
        <button
          onClick={() => setActiveTab('EXAM_PERFORMANCE')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'EXAM_PERFORMANCE'
              ? 'bg-[#087F5B] text-white shadow-xs'
              : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          ४. परीक्षा परिणाम व सफलता दर
        </button>
      </div>

      {/* Tab 1: School-wise Summary */}
      {activeTab === 'SCHOOL_SUMMARY' && (
        <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              शालावार साक्षरता प्रगति सारांश विवरणी
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              कुल शालाएं: <strong>{scopedLiteracyRegisters.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0C291F] text-emerald-100 font-bold border-b border-[#1A4234] uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-3">क्र.</th>
                  <th className="py-3 px-3">शाला का नाम</th>
                  <th className="py-3 px-3">UDISE कोड</th>
                  <th className="py-3 px-3 text-center">परिवार</th>
                  <th className="py-3 px-3 text-center">असाक्षर (पु / म)</th>
                  <th className="py-3 px-3 text-center">कुल असाक्षर</th>
                  <th className="py-3 px-3 text-center">ऐप पंजी.</th>
                  <th className="py-3 px-3 text-center">अक्षर साथी</th>
                  <th className="py-3 px-3 text-center">केंद्र</th>
                  <th className="py-3 px-3 text-center">परीक्षा सम्मिलित</th>
                  <th className="py-3 px-3 text-center">उत्तीर्ण</th>
                  <th className="py-3 px-3 text-center">शेष असाक्षर</th>
                  <th className="py-3 px-3 text-center">प्रमाणन</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
                {scopedLiteracyRegisters.map((reg, idx) => (
                  <tr key={reg.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="py-3 px-3 font-mono text-gray-500">{idx + 1}</td>
                    <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{reg.schoolName}</td>
                    <td className="py-3 px-3 font-mono text-emerald-700 dark:text-emerald-400">{reg.schoolUdise}</td>
                    <td className="py-3 px-3 text-center font-semibold">{reg.totalHouseholds}</td>
                    <td className="py-3 px-3 text-center font-mono">
                      <span className="text-sky-600 font-semibold">{reg.surveyedMaleIlliterates}</span> /{' '}
                      <span className="text-rose-600 font-semibold">{reg.surveyedFemaleIlliterates}</span>
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-gray-900 dark:text-white">
                      {reg.totalSurveyedIlliterates}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-blue-600 dark:text-blue-400">
                      {reg.registeredOnApp}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-purple-700 dark:text-purple-300">
                      {reg.totalAksharSathis}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-700 dark:text-gray-300">
                      {reg.teachingCentersCount}
                    </td>
                    <td className="py-3 px-3 text-center font-semibold text-amber-600 dark:text-amber-400">
                      {reg.examAppearedLearners}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                      {reg.passedLearners}
                    </td>
                    <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                      {reg.remainingIlliterates}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.isCertified
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {reg.isCertified ? 'प्रमाणित' : 'लंबित'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Category Analysis */}
      {activeTab === 'CATEGORY_ANALYSIS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                सामाजिक वर्गवार असाक्षर वर्गीकरण (SC, ST, OBC, GEN, अल्पसंख्यक)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C291F] text-emerald-100 font-bold border-b border-[#1A4234] uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="py-3 px-3">क्र.</th>
                    <th className="py-3 px-3">सामाजिक वर्ग</th>
                    <th className="py-3 px-3 text-center">पुरुष</th>
                    <th className="py-3 px-3 text-center">महिला</th>
                    <th className="py-3 px-3 text-center">कुल असाक्षर</th>
                    <th className="py-3 px-3 text-center">उत्तीर्ण साक्षर</th>
                    <th className="py-3 px-3 text-center">प्रतिशत (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
                  {categoryData.map((c, idx) => (
                    <tr key={c.category} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-3 font-mono text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{c.category}</td>
                      <td className="py-3 px-3 text-center text-sky-600 font-semibold">{c.male}</td>
                      <td className="py-3 px-3 text-center text-rose-600 font-semibold">{c.female}</td>
                      <td className="py-3 px-3 text-center font-bold text-gray-900 dark:text-white">{c.total}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{c.passed}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{c.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Bars Card */}
          <div className="bg-white dark:bg-[#16221D] rounded-xl p-5 border border-gray-200 dark:border-gray-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              वर्गवार असाक्षर अनुपात
            </h4>
            <div className="space-y-3">
              {categoryData.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{c.category}</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400">
                      {c.total} ({c.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, c.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Age Analysis */}
      {activeTab === 'AGE_ANALYSIS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                आयु वर्गवार असाक्षर वर्गीकरण (15+ आयु समूह)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0C291F] text-emerald-100 font-bold border-b border-[#1A4234] uppercase tracking-wider text-[10.5px]">
                  <tr>
                    <th className="py-3 px-3">क्र.</th>
                    <th className="py-3 px-3">आयु समूह</th>
                    <th className="py-3 px-3 text-center">पुरुष</th>
                    <th className="py-3 px-3 text-center">महिला</th>
                    <th className="py-3 px-3 text-center">कुल असाक्षर</th>
                    <th className="py-3 px-3 text-center">उत्तीर्ण साक्षर</th>
                    <th className="py-3 px-3 text-center">प्रतिशत (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
                  {ageData.map((a, idx) => (
                    <tr key={a.group} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                      <td className="py-3 px-3 font-mono text-gray-500">{idx + 1}</td>
                      <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{a.group}</td>
                      <td className="py-3 px-3 text-center text-sky-600 font-semibold">{a.male}</td>
                      <td className="py-3 px-3 text-center text-rose-600 font-semibold">{a.female}</td>
                      <td className="py-3 px-3 text-center font-bold text-gray-900 dark:text-white">{a.total}</td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">{a.passed}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold">{a.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Bars Card */}
          <div className="bg-white dark:bg-[#16221D] rounded-xl p-5 border border-gray-200 dark:border-gray-800 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              आयु वर्गवार असाक्षर अनुपात
            </h4>
            <div className="space-y-3">
              {ageData.map((a) => (
                <div key={a.group} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200">{a.group}</span>
                    <span className="font-mono text-gray-600 dark:text-gray-400">
                      {a.total} ({a.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(5, a.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Exam Performance */}
      {activeTab === 'EXAM_PERFORMANCE' && (
        <div className="bg-white dark:bg-[#16221D] rounded-xl border border-gray-200 dark:border-gray-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              साक्षरता परीक्षा मूल्यांकन व सफलता दर रिपोर्ट
            </h3>
            <span className="text-xs text-gray-500 font-medium">
              कुल सत्र परिणाम: <strong>{scopedLiteracyExamResults.length}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#2B210C] text-amber-100 font-bold border-b border-[#4A3914] uppercase tracking-wider text-[10.5px]">
                <tr>
                  <th className="py-3 px-3">क्र.</th>
                  <th className="py-3 px-3">शाला का नाम</th>
                  <th className="py-3 px-3">UDISE कोड</th>
                  <th className="py-3 px-3">परीक्षा सत्र / तिथि</th>
                  <th className="py-3 px-3 text-center">महिला</th>
                  <th className="py-3 px-3 text-center">पुरुष</th>
                  <th className="py-3 px-3 text-center">कुल पंजीकृत</th>
                  <th className="py-3 px-3 text-center">सम्मिलित</th>
                  <th className="py-3 px-3 text-center">उत्तीर्ण</th>
                  <th className="py-3 px-3 text-center">अनुत्तीर्ण</th>
                  <th className="py-3 px-3 text-center">शेष असाक्षर</th>
                  <th className="py-3 px-3 text-center">सफलता दर (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-normal">
                {scopedLiteracyExamResults.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      वर्तमान चयनित सत्र में कोई साक्षरता परीक्षा परिणाम उपलब्ध नहीं है।
                    </td>
                  </tr>
                ) : (
                  scopedLiteracyExamResults.map((res, idx) => {
                    const passRate = res.participatedLearners > 0
                      ? Math.round((res.passedLearners / res.participatedLearners) * 100)
                      : 0;
                    const remaining = res.remainingIlliterateLearners ?? res.remainingCount ?? Math.max(0, (res.totalLearners ?? 0) - (res.passedLearners ?? 0) - (res.failedLearners ?? 0));
                    return (
                      <tr key={res.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="py-3 px-3 font-mono text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-bold text-gray-900 dark:text-white">{res.schoolName}</td>
                        <td className="py-3 px-3 font-mono text-emerald-700 dark:text-emerald-400">{res.schoolUdise}</td>
                        <td className="py-3 px-3 font-semibold text-amber-800 dark:text-amber-300">
                          {res.examName} ({res.examDate})
                        </td>
                        <td className="py-3 px-3 text-center text-rose-600 font-semibold">{res.femaleLearners}</td>
                        <td className="py-3 px-3 text-center text-sky-600 font-semibold">{res.maleLearners}</td>
                        <td className="py-3 px-3 text-center font-bold text-gray-900 dark:text-white">{res.totalLearners}</td>
                        <td className="py-3 px-3 text-center font-bold text-blue-600 dark:text-blue-400">
                          {res.participatedLearners}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-600 dark:text-emerald-400">
                          {res.passedLearners}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-rose-600 dark:text-rose-400">
                          {res.failedLearners}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-amber-700 dark:text-amber-400">
                          {remaining}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            {passRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official ULLAS Form Print Modal */}
      <LiteracyFormPrintModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        schoolUdise={selectedSchoolUdise}
      />
    </div>
  );
};
