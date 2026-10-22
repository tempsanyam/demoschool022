import React, { useState } from 'react';
import {
  Settings,
  Moon,
  Sun,
  Database,
  RotateCcw,
  Download,
  Info,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ShieldAlert,
  Cloud,
  CloudOff,
  RefreshCw,
  WifiOff,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useFeatureControl } from '../../context/FeatureControlContext';
import { initialSchools, initialStudents, initialStaff, initialFacilities, initialMDM, initialGovernmentWork, initialComplaints } from '../../data/seedData';
import { institutionConfig } from '../../config/institutionConfig';
import { AcademicSessionManagement } from './AcademicSessionManagement';
import { FeatureControlPanel } from './FeatureControlPanel';
import { FeatureGuard } from '../common/FeatureGuard';
import { safeSetJSON, safeRemoveItem } from '../../utils/safeStorage';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, firebaseUser, firebaseAuthStatus, firebaseAuthError, retryFirebaseAuth } = useAuth();
  const { getFeatureEvaluation } = useFeatureControl();
  const isAdmin = currentUser?.role === 'ADMIN';
  const isSchoolUser = currentUser?.role === 'SCHOOL';

  if (isSchoolUser) {
    return (
      <div className="bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 p-6 rounded-2xl text-center space-y-3 max-w-xl mx-auto my-8 animate-in fade-in">
        <ShieldAlert className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
        <h3 className="text-base font-bold text-red-900 dark:text-red-200">
          अनधिकृत पहुंच (Access Restricted)
        </h3>
        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
          सिस्टम सेटिंग्स, डेटा बैकअप एवं प्रणाली सूचना केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) के लिए अधिकृत हैं।
        </p>
      </div>
    );
  }

  const {
    schools,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    governmentWork,
    complaints,
    academicSessions,
    activeSessionId,
    activateSession,
    isCloudConnected,
    cloudSyncStatus,
    lastCloudSyncAt,
    triggerManualCloudSync,
    connectivityState,
    checkCloudConnectivity,
  } = useData();

  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [isRetryingAuth, setIsRetryingAuth] = useState(false);
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'SESSIONS' | 'GENERAL' | 'BACKUP' | 'INFO' | 'FEATURE_CONTROL'>('SESSIONS');
  const [isResetDone, setIsResetDone] = useState(false);
  const [sessionChangeFeedback, setSessionChangeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const sessionsSubEval = getFeatureEvaluation('module.settings.sub.sessions');
  const backupSubEval = getFeatureEvaluation('module.settings.sub.backup');

  // Export full JSON Backup
  const handleBackupDownload = () => {
    if (isSchoolUser) {
      alert('अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) एवं जन शिक्षक (CAC) ही डेटा बैकअप डाउनलोड कर सकते हैं।');
      return;
    }
    const fullBackup = {
      clusterDiseCode: institutionConfig.diseCode,
      clusterName: institutionConfig.institutionName,
      block: institutionConfig.block,
      district: institutionConfig.district,
      exportedAt: new Date().toISOString(),
      session: activeSessionId,
      academicSessions,
      schools,
      students,
      staff,
      facilities,
      attendance,
      mdmRecords,
      governmentWork,
      complaints
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Malguwa_Complete_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset to default seed data
  const handleResetData = () => {
    if (!isAdmin) {
      alert('अनधिकृत कार्रवाई (403 Forbidden): केवल संकुल प्रशासक (ADMIN) ही फ़ैक्टरी डेटा रीसेट कर सकते हैं।');
      return;
    }
    if (window.confirm('क्या आप वास्तव में सभी डेटा को प्रारंभिक संकुल शालाओं के डिफ़ॉल्ट डेटा पर रीसेट करना चाहते हैं?')) {
      safeRemoveItem('jsk_db_version');
      safeSetJSON('jsk_schools', initialSchools);
      safeSetJSON('jsk_students', initialStudents);
      safeSetJSON('jsk_staff', initialStaff);
      safeSetJSON('jsk_facilities', initialFacilities);
      safeSetJSON('jsk_mdm', initialMDM);
      safeSetJSON('jsk_work', initialGovernmentWork);
      safeSetJSON('jsk_complaints', initialComplaints);
      safeRemoveItem('jsk_malguwa_users');
      safeRemoveItem('jsk_malguwa_current_user');
      safeRemoveItem('jsk_schemes');
      setIsResetDone(true);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-6 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              सिस्टम प्रबंधन एवं सेटिंग्स (System Settings)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              सत्र प्रबंधन, थीम, डेटाबेस बैकअप एवं रीसेट विकल्प
            </p>
          </div>
        </div>

        {/* Header Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-xl text-xs font-bold">
          {isAdmin && (
            <button
              onClick={() => setActiveTab('FEATURE_CONTROL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'FEATURE_CONTROL'
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'text-[#0B6B4B] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>🔐 मॉड्यूल एवं विकल्प नियंत्रण</span>
            </button>
          )}

          {sessionsSubEval.allowed && (
            <button
              onClick={() => setActiveTab('SESSIONS')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'SESSIONS'
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>सत्र प्रबंधन</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('GENERAL')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'GENERAL'
                ? 'bg-[#0B6B4B] text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>सामान्य व थीम</span>
          </button>

          {backupSubEval.allowed && (
            <button
              onClick={() => setActiveTab('BACKUP')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'BACKUP'
                  ? 'bg-[#0B6B4B] text-white shadow-xs'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>डेटा बैकअप</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('INFO')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'INFO'
                ? 'bg-[#0B6B4B] text-white shadow-xs'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>सिस्टम सूचना</span>
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'FEATURE_CONTROL' && isAdmin && <FeatureControlPanel />}

      {activeTab === 'SESSIONS' && (
        <FeatureGuard featureKey="module.settings.sub.sessions" evaluation={sessionsSubEval} mode="banner">
          <AcademicSessionManagement />
        </FeatureGuard>
      )}

      {activeTab === 'GENERAL' && (
        <div className="space-y-4 text-xs max-w-3xl">
          {/* 1. Theme Configuration */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                {theme === 'dark' ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-[#FF7A00]" />}
                <span>डार्क मोड / लाइट मोड थीम (Theme Setting)</span>
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                वर्तमान में {theme === 'dark' ? 'डार्क थीम (Eye-Safe Night Mode)' : 'लाइट थीम (Official Govt Green)'} सक्रिय है
              </p>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FF7A00]" /> : <Moon className="w-4 h-4 text-gray-600" />}
              <span>थीम बदलें ({theme === 'dark' ? 'लाइट' : 'डार्क'})</span>
            </button>
          </div>

          {/* Feedback banner */}
          {sessionChangeFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between ${
                sessionChangeFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              <span>{sessionChangeFeedback.message}</span>
              <button
                type="button"
                onClick={() => setSessionChangeFeedback(null)}
                className="text-xs underline hover:opacity-75 cursor-pointer ml-3"
              >
                हटाएं
              </button>
            </div>
          )}

          {/* 2. Session Configuration */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#0B6B4B]" />
                <span>सक्रिय शैक्षणिक सत्र (Active Academic Session)</span>
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                वर्तमान में चालू सत्र: <strong className="text-emerald-700 dark:text-emerald-300">{activeSessionId}</strong>
              </p>
              {!isAdmin && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/60 inline-block mt-1">
                  ⓘ संकुल का सक्रिय सत्र केवल संकुल प्रशासक (ADMIN) द्वारा निर्धारित किया जाता है। आप शीर्ष हेडर से अपना कार्यशील सत्र (Working View Session) चुन सकते हैं।
                </p>
              )}
            </div>

            {isAdmin ? (
              <select
                value={activeSessionId}
                onChange={(e) => {
                  const targetSession = e.target.value;
                  if (targetSession !== activeSessionId) {
                    if (window.confirm(`क्या आप सत्र "${targetSession}" को सम्पूर्ण संकुल के लिए चालू सत्र (Active LIVE Session) बनाना चाहते हैं?`)) {
                      const res = activateSession(targetSession);
                      if (res.success) {
                        setSessionChangeFeedback({ type: 'success', message: res.message });
                      } else {
                        setSessionChangeFeedback({ type: 'error', message: res.message });
                      }
                    }
                  }
                }}
                className="px-4 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white cursor-pointer"
              >
                {academicSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    सत्र {s.sessionName} {s.isCurrent ? '(सक्रिय)' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>सत्र {activeSessionId} (सक्रिय)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'BACKUP' && (
        <div className="space-y-4 text-xs max-w-3xl">
          {/* Cloud Database Cross-Device Synchronization Control & Diagnostics (ADMIN ONLY) */}
          {isAdmin && (
            <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-emerald-300 dark:border-emerald-800/70 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-[#0B6B4B] dark:text-emerald-400" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white">
                      केंद्रीकृत क्लाउड डेटाबेस (Google Cloud Firestore Central Database)
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        connectivityState.status === 'connected'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                          : connectivityState.status === 'syncing'
                          ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300'
                          : connectivityState.status === 'permission_denied'
                          ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300'
                          : connectivityState.status === 'offline'
                          ? 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                      }`}
                    >
                      {connectivityState.statusLabel}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300">
                    सभी संकुल शालाएं, जन शिक्षक (CAC) एवं व्यवस्थापक (Admin) मोबाइल या कंप्यूटर किसी भी डिवाइस से वास्तविक समय में एक ही सेंट्रलाइज्ड क्लाउड डेटाबेस से जुड़े हैं।
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={async () => {
                      await checkCloudConnectivity();
                    }}
                    className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 rounded-xl font-bold hover:bg-emerald-100 flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>जाँचें</span>
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
                      className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer text-xs disabled:opacity-50"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isRetryingAuth ? 'Auth प्रयास...' : 'Auth पुनः प्रयास'}</span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      setIsCloudSyncing(true);
                      setCloudSyncMessage(null);
                      try {
                        const res = await triggerManualCloudSync();
                        if (res.success) {
                          setCloudSyncMessage(`डेटाबेस सफलतापूर्वक सिंक हुआ (${res.count} रिकॉर्ड्स क्लाउड में अद्यतन)`);
                        } else {
                          setCloudSyncMessage('क्लाउड सिंक में त्रुटि आई। कृपया नेटवर्क जांचें।');
                        }
                      } catch (e) {
                        setCloudSyncMessage('सिंक विफल हुआ।');
                      } finally {
                        setIsCloudSyncing(false);
                      }
                    }}
                    disabled={isCloudSyncing}
                    className="px-4 py-2 bg-[#0B6B4B] hover:bg-[#08553B] text-white rounded-xl font-bold transition-colors flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 text-xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                    <span>{isCloudSyncing ? 'सिंक हो रहा है...' : 'मैन्युअल क्लाउड सिंक'}</span>
                  </button>
                </div>
              </div>

              {/* Granular status breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 text-[11px]">
                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">इंटरनेट स्थिति:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1 mt-0.5">
                    {connectivityState.isBrowserOnline ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> ऑनलाइन
                      </span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                        <WifiOff className="w-3.5 h-3.5" /> ऑफलाइन
                      </span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">Firebase Auth:</span>
                  <span className="font-mono text-[11px] text-gray-800 dark:text-gray-200 block truncate mt-0.5">
                    {firebaseUser ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        सक्रिय ({firebaseUser.uid.substring(0, 8)}...)
                      </span>
                    ) : firebaseAuthStatus === 'error' && firebaseAuthError === 'auth/operation-not-allowed' ? (
                      <span className="text-amber-600 dark:text-amber-400 font-bold">
                        Provider अक्षम (Console)
                      </span>
                    ) : firebaseAuthStatus === 'initializing' ? (
                      <span className="text-amber-600 dark:text-amber-400">सत्यापन जारी...</span>
                    ) : (
                      <span className="text-gray-500">अप्रमाणित</span>
                    )}
                  </span>
                </div>

                <div>
                  <span className="text-gray-500 dark:text-gray-400 block">अंतिम सिंक समय:</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 block mt-0.5">
                    {lastCloudSyncAt ? lastCloudSyncAt.toLocaleTimeString('hi-IN') : 'सक्रिय'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-[11px] text-gray-600 dark:text-gray-300">
                {connectivityState.message}
              </div>

              {cloudSyncMessage && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 font-semibold text-xs flex items-center justify-between">
                  <span>{cloudSyncMessage}</span>
                  <button
                    onClick={() => setCloudSyncMessage(null)}
                    className="text-emerald-600 dark:text-emerald-400 underline cursor-pointer"
                  >
                    हटाएं
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Database Backup */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span>डेटाबेस पूर्ण बैकअप (JSON Export)</span>
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                समस्त संकुल शालाओं, छात्रों, शिक्षकों, सुविधाओं एवं ऑडिट का संपूर्ण डेटाबेस डाउनलोड करें
              </p>
            </div>

            <button
              onClick={handleBackupDownload}
              className="px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-xl font-bold hover:bg-blue-100 flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>बैकअप डाउनलोड करें</span>
            </button>
          </div>

          {/* 4. Factory Reset to Seed Data */}
          <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-xs flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-red-700 dark:text-red-400 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-red-600" />
                <span>फ़ैक्टरी डेटा रीसेट (Reset to Seed Data)</span>
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                स्थानीय स्टोरेज साफ़ कर पुनः मूल संकुल शालाओं का प्रामाणिक डेटा लोड करें
              </p>
              {!isAdmin && (
                <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                  * केवल संकुल व्यवस्थापक (ADMIN) ही डेटा रीसेट कर सकते हैं।
                </p>
              )}
            </div>

            <button
              onClick={handleResetData}
              disabled={!isAdmin}
              className={`px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 ${
                isAdmin
                  ? 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 hover:bg-red-100 cursor-pointer'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-60'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>डेटा रीसेट करें</span>
            </button>
          </div>
        </div>
      )}

      {activeTab === 'INFO' && (
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs max-w-3xl">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white pb-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#0B6B4B]" />
            <span>प्रणाली सूचना एवं संस्करण (System Information)</span>
          </h3>

          <div className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">पोर्टल नाम:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{institutionConfig.institutionName} प्रबंधन प्रणाली</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">डाइज कोड:</span>
              <span className="font-mono font-bold text-[#0B6B4B]">{institutionConfig.diseCode}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">विकास खंड व जिला:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{institutionConfig.block}, {institutionConfig.district}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">संबद्ध विद्यालय संख्या:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200">{schools.length} शासकीय प्राथमिक एवं माध्यमिक शालाएं</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">सक्रिय शैक्षणिक सत्र:</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{activeSessionId}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">प्रणाली संरचना:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">मास्टर-अभिलेख सत्र वास्तुकला (Master/Record Session Architecture)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">प्रशासन:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">स्कूल शिक्षा विभाग, म.प्र. शासन</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

