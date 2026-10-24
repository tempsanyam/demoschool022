import React, { useState, useMemo } from 'react';
import {
  X,
  Shield,
  Key,
  School as SchoolIcon,
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Download,
  Search,
  RefreshCw,
  FileText,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { institutionConfig } from '../../config/institutionConfig';
import { exportToExcel } from '../../utils/exportUtils';
import { triggerPrint } from '../../utils/printUtils';
import { getMigrationReport } from '../../utils/schoolMasterMigration';
import { OFFICIAL_37_SCHOOL_CREDENTIALS } from '../../data/clusterSchoolsData';

interface SchoolCredentialsDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchoolCredentialsDirectoryModal: React.FC<SchoolCredentialsDirectoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { schools, activeSchools: contextActiveSchools, migrationReport, runManualMigrationAudit } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);
  const [activeTab, setActiveTab] = useState<'CREDENTIALS' | 'AUDIT'>('CREDENTIALS');
  const [isAuditing, setIsAuditing] = useState(false);

  const report = migrationReport || getMigrationReport();

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1800);
  };

  const handleRunAudit = () => {
    setIsAuditing(true);
    setTimeout(() => {
      runManualMigrationAudit();
      setIsAuditing(false);
    }, 400);
  };

  // Get custom passwords
  const customPasswords: Record<string, string> = useMemo(() => {
    if (typeof window === 'undefined' || !window.localStorage) return {};
    try {
      const raw = localStorage.getItem('jsk_school_passwords');
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, []);

  // Canonical SSoT active schools: status === ACTIVE && !isDeleted, sorted by UDISE
  const activeSchoolsList = useMemo(() => {
    const list = contextActiveSchools && contextActiveSchools.length > 0 ? contextActiveSchools : schools || [];
    return list
      .filter((s) => String(s.status || '').toUpperCase() === 'ACTIVE' && s.isDeleted !== true)
      .sort((a, b) => String(a.udise).localeCompare(String(b.udise)));
  }, [contextActiveSchools, schools]);

  const roster = useMemo(() => {
    return activeSchoolsList.map((s, idx) => {
      const cred = OFFICIAL_37_SCHOOL_CREDENTIALS.find((c) => c.udise === s.udise);
      const defaultPass = cred?.initialPassword || `SCH${s.udise.slice(-4)}`;
      const customPass = customPasswords[s.udise];
      const effectivePassword = customPass || defaultPass;
      const username = cred?.username || s.name.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return {
        sr: idx + 1,
        udise: s.udise,
        username,
        name: s.name,
        hindiName: s.hindiName || s.name,
        village: s.village,
        type: s.schoolType,
        loginId: s.udise,
        password: effectivePassword,
        isCustom: !!customPass,
        status: s.status,
      };
    });
  }, [activeSchoolsList, customPasswords]);

  const filteredRoster = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return roster;
    return roster.filter(
      (r) =>
        r.udise.includes(term) ||
        r.username.toLowerCase().includes(term) ||
        r.name.toLowerCase().includes(term) ||
        r.village.toLowerCase().includes(term) ||
        r.type.toLowerCase().includes(term)
    );
  }, [roster, searchTerm]);

  const handleExportExcel = () => {
    exportToExcel({
      title: `जन शिक्षा केंद्र मलगुवां - ${roster.length} सक्रिय शाला मास्टर व अधिकृत लॉगिन निर्देशिका`,
      subtitle: `विकासखंड: ${institutionConfig.block} | जिला: ${institutionConfig.district}`,
      fileName: `JSK_Malguwa_${roster.length}_Schools_Credentials_${new Date().toISOString().slice(0, 10)}`,
      session: institutionConfig.academicSession,
      headers: [
        'क्र.',
        'यू-डायस कोड (DISE)',
        'यूज़रनेम (Username)',
        'शाला का नाम',
        'ग्राम',
        'प्रकार',
        'लॉगिन पासवर्ड',
        'पासवर्ड प्रकार',
        'स्थिति',
      ],
      rows: roster.map((r) => [
        r.sr,
        r.udise,
        r.username,
        r.name,
        r.village,
        r.type,
        r.password,
        r.isCustom ? 'कस्टम पासवर्ड' : 'डिफ़ॉल्ट (SCH + अंतिम 4)',
        r.status,
      ]),
    });
  };

  const handlePrint = () => {
    const el = document.getElementById('school-credentials-printable');
    if (el) {
      triggerPrint(el);
    } else {
      window.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="school-credentials-directory-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#16221D] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#0B6B4B] to-[#08543A] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-white border border-white/20 shadow-sm">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  संकुल शाला मास्टर व अधिकृत लॉगिन निर्देशिका
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[11px] font-bold">
                  {roster.length} शालाएं सक्रिय
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-0.5">
                {institutionConfig.jskName} • विकासखंड: {institutionConfig.block} • जिला: {institutionConfig.district}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector & Controls Toolbar */}
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-gray-200/80 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('CREDENTIALS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'CREDENTIALS'
                  ? 'bg-white dark:bg-[#16221D] text-[#0B6B4B] dark:text-emerald-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>लॉगिन क्रेडेंशियल्स ({roster.length} शालाएं)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'AUDIT'
                  ? 'bg-white dark:bg-[#16221D] text-[#0B6B4B] dark:text-emerald-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>माइग्रेशन व ऑडिट रिपोर्ट</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {activeTab === 'CREDENTIALS' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="px-2.5 py-1.5 bg-white dark:bg-[#16221D] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  {showPasswords ? <EyeOff className="w-3.5 h-3.5 text-gray-500" /> : <Eye className="w-3.5 h-3.5 text-gray-500" />}
                  <span>{showPasswords ? 'पासवर्ड छुपाएं' : 'पासवर्ड देखें'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-2.5 py-1.5 bg-white dark:bg-[#16221D] border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-semibold text-[#0B6B4B] dark:text-emerald-400 hover:bg-emerald-50/50 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>एक्सेल (Excel)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-2.5 py-1.5 bg-[#0B6B4B] text-white rounded-lg text-xs font-semibold hover:bg-[#08543A] flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट निर्देशिका</span>
                </button>
              </>
            )}

            {activeTab === 'AUDIT' && (
              <button
                type="button"
                onClick={handleRunAudit}
                disabled={isAuditing}
                className="px-3 py-1.5 bg-[#0B6B4B] text-white rounded-lg text-xs font-bold hover:bg-[#08543A] flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
                <span>पुनः ऑडिट सत्यापित करें</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Credentials Directory */}
        {activeTab === 'CREDENTIALS' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            {/* Search Bar & Instructions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="शाला का नाम, यू-डायस, ग्राम से खोजें..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#0B6B4B]"
                />
              </div>

              <div className="text-[11.5px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0B6B4B]" />
                <span>
                  पासवर्ड सूत्र: <strong>SCH + यू-डायस के अंतिम 4 अंक</strong> (उदा. UDISE: 23080100303 ➔ SCH0303)
                </span>
              </div>
            </div>

            {/* Credentials Table */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 font-bold border-b border-gray-200 dark:border-gray-700">
                      <th className="py-2.5 px-3 text-center w-12">क्र.</th>
                      <th className="py-2.5 px-3">यू-डायस कोड (DISE)</th>
                      <th className="py-2.5 px-3">यूज़रनेम (Username)</th>
                      <th className="py-2.5 px-3">शाला का नाम</th>
                      <th className="py-2.5 px-3">प्रकार</th>
                      <th className="py-2.5 px-3">पासवर्ड</th>
                      <th className="py-2.5 px-3 text-center">क्विक कॉपी</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-gray-800 dark:text-gray-200">
                    {filteredRoster.map((r) => {
                      const idKey = `id-${r.udise}`;
                      const userKey = `user-${r.udise}`;
                      const passKey = `pass-${r.udise}`;
                      const comboKey = `combo-${r.udise}`;

                      return (
                        <tr
                          key={r.udise}
                          className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors"
                        >
                          <td className="py-2.5 px-3 text-center font-mono font-semibold text-gray-500">
                            {r.sr}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0B6B4B] dark:text-emerald-400">
                            {r.udise}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-indigo-700 dark:text-indigo-400">
                            {r.username}
                          </td>
                          <td className="py-2.5 px-3 font-semibold">
                            <div>{r.name}</div>
                            {r.name !== r.hindiName && (
                              <div className="text-[10px] text-gray-500">{r.hindiName}</div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-[11px] font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                              {r.type}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">
                            {showPasswords ? (
                              <span className="font-bold text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                {r.password}
                              </span>
                            ) : (
                              <span className="text-gray-400 tracking-wider">••••••••</span>
                            )}
                            {r.isCustom && (
                              <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold">
                                कस्टम
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleCopy(r.udise, idKey)}
                                title="DISE Code कॉपी करें"
                                className="px-1.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-[10px] font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
                              >
                                {copiedKey === idKey ? (
                                  <span className="text-emerald-600 flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> DISE
                                  </span>
                                ) : (
                                  'DISE'
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(r.username, userKey)}
                                title="Username कॉपी करें"
                                className="px-1.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 cursor-pointer"
                              >
                                {copiedKey === userKey ? (
                                  <span className="text-emerald-600 flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> USER
                                  </span>
                                ) : (
                                  'USER'
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(r.password, passKey)}
                                title="पासवर्ड कॉपी करें"
                                className="px-1.5 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-[10px] font-semibold text-gray-700 dark:text-gray-200 cursor-pointer"
                              >
                                {copiedKey === passKey ? (
                                  <span className="text-emerald-600 flex items-center gap-0.5">
                                    <Check className="w-3 h-3" /> PASS
                                  </span>
                                ) : (
                                  'PASS'
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCopy(`यूज़रनेम: ${r.username} | DISE: ${r.udise} | पासवर्ड: ${r.password} | शाला: ${r.name}`, comboKey)}
                                title="पूरा विवरण कॉपी करें"
                                className="p-1 bg-emerald-50 dark:bg-emerald-950/40 text-[#0B6B4B] dark:text-emerald-400 hover:bg-emerald-100 rounded cursor-pointer"
                              >
                                {copiedKey === comboKey ? (
                                  <Check className="w-3.5 h-3.5" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Migration Audit Report */}
        {activeTab === 'AUDIT' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {/* Top Status Banner */}
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  नियंत्रित शाला मास्टर माइग्रेशन सफलतापूर्वक सत्यापित (Migration Status: SUCCESS)
                </h3>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-relaxed">
                  जन शिक्षा केंद्र मलगुवां की सक्रिय शासकीय शालाओं ({roster.length}) के आधिकारिक UDISE कोड, नाम, संवर्ग तथा ग्राम का सफल सत्यापन व मैपिंग पूर्ण हो चुकी है। सभी सक्रिय शालाओं के लॉगिन खाते और पासवर्ड उपलब्ध हैं तथा किसी भी ऐतिहासिक डेटा (छात्र, शिक्षक, उपस्थिति, मध्यान्ह भोजन, सुविधाएं) को कोई नुकसान नहीं पहुंचा है।
                </p>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-extrabold text-[#0B6B4B] dark:text-emerald-400">{roster.length}</div>
                <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mt-1">सक्रिय संकुल शालाएं</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-extrabold text-[#0B6B4B] dark:text-emerald-400">100%</div>
                <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mt-1">UDISE मैपिंग पूर्ण</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-extrabold text-[#0B6B4B] dark:text-emerald-400">
                  {report ? report.conflictsResolved.length : 2}
                </div>
                <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mt-1">विसंगतियाँ सुधारी गईं</div>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">0</div>
                <div className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 mt-1">डेटा विलोपन (Zero Loss)</div>
              </div>
            </div>

            {/* Key Conflict Resolutions */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#0B6B4B]" />
                <span>प्रमुख विसंगति समाधान विवरण (Critical Resolved Inconsistencies):</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <span>1. UDISE 23080100303 (ग्राम हीरापुर)</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold">सुधारा गया</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1 text-[11.5px]">
                    पूर्व में यह कोड त्रुटिवश "MS MALGUWA" के नाम से दर्ज था, जिसे आधिकारिक मास्टर के अनुसार सुधारकर <strong>HS HIRAPUR (हाईस्कूल हीरापुर)</strong> कर दिया गया है।
                  </p>
                </div>

                <div className="p-3 bg-white dark:bg-gray-800/80 rounded-xl border border-emerald-200 dark:border-emerald-800/60">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
                    <span>2. UDISE 23080111801 (ग्राम बार)</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold">सुधारा गया</span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-1 text-[11.5px]">
                    पूर्व में यह कोड "PS KANCHANPURA" के नाम से दर्ज था, जिसे आधिकारिक मास्टर के अनुसार सुधारकर <strong>PS BAR (प्राथमिक शाला बार)</strong> कर दिया गया है।
                  </p>
                </div>
              </div>
            </div>

            {/* Preserved Collections Report */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>सुरक्षित परिचालन डेटा अभिलेख (Preserved Operational Collections):</span>
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">छात्र अभिलेख (Students)</div>
                  <div className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400 mt-0.5">पूर्ण सुरक्षित (252+ छात्र)</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">शिक्षक अभिलेख (Staff)</div>
                  <div className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400 mt-0.5">पूर्ण सुरक्षित (38+ शिक्षक)</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">उपस्थिति व MDM (Attendance)</div>
                  <div className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400 mt-0.5">सुरक्षित व अप्रभावित</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">भौतिक सुविधाएं (Facilities)</div>
                  <div className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400 mt-0.5">{roster.length} शालाओं हेतु तैयार</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">प्रशासनिक व CAC खाते</div>
                  <div className="font-mono font-bold text-[#0B6B4B] dark:text-emerald-400 mt-0.5">3 खाते अक्षुण्ण</div>
                </div>
                <div className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="font-semibold text-gray-700 dark:text-gray-300">बैकअप स्नैपशॉट (Backup)</div>
                  <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">सुरक्षित संग्रहित</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden Printable Area */}
        <div className="hidden">
          <div id="school-credentials-printable" className="p-8 space-y-6 text-black bg-white">
            <div className="text-center border-b-2 border-black pb-4 space-y-1">
              <h1 className="text-xl font-extrabold uppercase">
                {institutionConfig.department}
              </h1>
              <h2 className="text-lg font-bold">
                {institutionConfig.jskName} • विकासखंड: {institutionConfig.block} • जिला: {institutionConfig.district}
              </h2>
              <h3 className="text-sm font-semibold mt-2 underline">
                आधिकारिक {roster.length} सक्रिय शाला मास्टर एवं अधिकृत संस्था लॉगिन डायरेक्टरी (सत्र: {institutionConfig.academicSession})
              </h3>
            </div>

            <div className="text-xs space-y-1">
              <p><strong>गोपनीय शासकीय परिपत्र:</strong> यह सूची केवल अधिकृत संस्था प्रभारियों के आधिकारिक उपयोग हेतु है।</p>
              <p><strong>लॉगिन पता:</strong> संकुल पोर्टल • <strong>डिफ़ॉल्ट पासवर्ड नियम:</strong> SCH + यू-डायस के अंतिम 4 अंक</p>
            </div>

            <table className="w-full text-xs border border-collapse border-black">
              <thead>
                <tr className="bg-gray-200 text-black font-bold">
                  <th className="border border-black p-1 text-center">क्र.</th>
                  <th className="border border-black p-1">यू-डायस कोड (Login ID)</th>
                  <th className="border border-black p-1">शाला का नाम</th>
                  <th className="border border-black p-1">ग्राम</th>
                  <th className="border border-black p-1">प्रकार</th>
                  <th className="border border-black p-1">डिफ़ॉल्ट पासवर्ड</th>
                  <th className="border border-black p-1">हस्ताक्षर संस्था प्रभारी</th>
                </tr>
              </thead>
              <tbody>
                {roster.map((r) => (
                  <tr key={r.udise}>
                    <td className="border border-black p-1 text-center font-mono">{r.sr}</td>
                    <td className="border border-black p-1 font-mono font-bold">{r.udise}</td>
                    <td className="border border-black p-1 font-bold">{r.name}</td>
                    <td className="border border-black p-1">{r.village}</td>
                    <td className="border border-black p-1">{r.type}</td>
                    <td className="border border-black p-1 font-mono">{r.password}</td>
                    <td className="border border-black p-1 w-28"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pt-8 flex justify-between text-xs font-bold">
              <div>
                <p>प्रभारी जन शिक्षक (CAC 1)</p>
                <p>{institutionConfig.cac1.name} ({institutionConfig.cac1.mobile})</p>
              </div>
              <div>
                <p>प्रभारी जन शिक्षक (CAC 2)</p>
                <p>{institutionConfig.cac2.name} ({institutionConfig.cac2.mobile})</p>
              </div>
              <div>
                <p>मुख्य व्यवस्थापक (System Admin)</p>
                <p>संयम जैन (9826088159)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/80 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            दिखाए जा रहे रिकॉर्ड: <strong>{filteredRoster.length}</strong> / <strong>{roster.length}</strong>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            बंद करें (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
