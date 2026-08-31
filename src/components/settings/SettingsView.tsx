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
  Layers
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useData } from '../../context/DataContext';
import { initialSchools, initialStudents, initialStaff, initialFacilities, initialMDM, initialGovernmentWork, initialComplaints } from '../../data/seedData';
import { institutionConfig } from '../../config/institutionConfig';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const {
    schools,
    students,
    staff,
    facilities,
    attendance,
    mdmRecords,
    governmentWork,
    complaints
  } = useData();

  const [activeSession, setActiveSession] = useState(institutionConfig.academicSession);
  const [isResetDone, setIsResetDone] = useState(false);

  // Export full JSON Backup
  const handleBackupDownload = () => {
    const fullBackup = {
      clusterDiseCode: institutionConfig.diseCode,
      clusterName: institutionConfig.institutionName,
      block: institutionConfig.block,
      district: institutionConfig.district,
      exportedAt: new Date().toISOString(),
      session: activeSession,
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
    if (window.confirm('क्या आप वास्तव में सभी डेटा को प्रारंभिक 37 शालाओं के डिफ़ॉल्ट डेटा पर रीसेट करना चाहते हैं?')) {
      localStorage.removeItem('jsk_db_version');
      localStorage.setItem('jsk_schools', JSON.stringify(initialSchools));
      localStorage.setItem('jsk_students', JSON.stringify(initialStudents));
      localStorage.setItem('jsk_staff', JSON.stringify(initialStaff));
      localStorage.setItem('jsk_facilities', JSON.stringify(initialFacilities));
      localStorage.setItem('jsk_mdm', JSON.stringify(initialMDM));
      localStorage.setItem('jsk_work', JSON.stringify(initialGovernmentWork));
      localStorage.setItem('jsk_complaints', JSON.stringify(initialComplaints));
      localStorage.removeItem('jsk_schemes');
      setIsResetDone(true);
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150 max-w-4xl">
      {/* Top Banner */}
      <div className="bg-white dark:bg-[#17211C] p-6 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded-xl">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              सिस्टम सेटिंग्स एवं डेटा प्रबंधन (System Settings)
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              थीम, बैकअप, शैक्षणिक सत्र एवं डेटाबेस अनुकूलन
            </p>
          </div>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="space-y-4 text-xs">
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
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-[#FF7A00]" /> : <Moon className="w-4 h-4 text-gray-600" />}
            <span>थीम बदलें ({theme === 'dark' ? 'लाइट' : 'डार्क'})</span>
          </button>
        </div>

        {/* 2. Session Configuration */}
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0B6B4B]" />
              <span>सक्रिय शैक्षणिक सत्र (Academic Session)</span>
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              सभी रिपोर्ट एवं प्रविष्टियों के लिए डिफ़ॉल्ट शैक्षणिक सत्र
            </p>
          </div>

          <select
            value={activeSession}
            onChange={(e) => setActiveSession(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-[#0F1713] border border-gray-300 dark:border-gray-700 rounded-xl font-bold text-gray-900 dark:text-white"
          >
            <option value="2026-27">सत्र 2026-27 (चालू)</option>
            <option value="2025-26">सत्र 2025-26</option>
          </select>
        </div>

        {/* 3. Database Backup */}
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-600" />
              <span>डेटाबेस पूर्ण बैकअप (JSON Export)</span>
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              सभी 37 शालाओं, छात्रों, शिक्षकों, सुविधाओं एवं ऑडिट का संपूर्ण डेटाबेस डाउनलोड करें
            </p>
          </div>

          <button
            onClick={handleBackupDownload}
            className="px-4 py-2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-700 rounded-xl font-bold hover:bg-blue-100 flex items-center gap-1.5"
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
              स्थानीय स्टोरेज साफ़ कर पुनः मूल 37 शालाओं का प्रामाणिक डेटा लोड करें
            </p>
          </div>

          <button
            onClick={handleResetData}
            className="px-4 py-2 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-xl font-bold hover:bg-red-100 flex items-center gap-1.5"
          >
            <RotateCcw className="w-4 h-4" />
            <span>डेटा रीसेट करें</span>
          </button>
        </div>

        {/* System Information Card */}
        <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs">
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
              <span className="font-bold text-gray-800 dark:text-gray-200">{schools.length || institutionConfig.totalSchoolsCount} शासकीय प्राथमिक एवं माध्यमिक शालाएं</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100 dark:border-gray-800">
              <span className="text-gray-500">संस्करण (Version):</span>
              <span className="font-mono font-bold text-purple-600">v{institutionConfig.systemVersion} ({institutionConfig.academicSession} Edition)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">प्रशासन:</span>
              <span className="font-medium text-gray-700 dark:text-gray-300">स्कूल शिक्षा विभाग, म.प्र. शासन</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
