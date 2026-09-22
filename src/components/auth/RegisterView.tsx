import React from 'react';
import { ArrowLeft, ShieldAlert } from 'lucide-react';
import { institutionConfig } from '../../config/institutionConfig';

interface RegisterViewProps {
  onBackToLogin?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterView: React.FC<RegisterViewProps> = ({ onBackToLogin, onNavigateToLogin }) => {
  const handleBack = () => {
    if (onNavigateToLogin) onNavigateToLogin();
    else if (onBackToLogin) onBackToLogin();
  };

  return (
    <div className="min-h-screen bg-[#F0F4F2] dark:bg-[#0E1511] py-8 px-4 sm:px-6 transition-colors">
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#17211C] rounded-2xl shadow-xl border border-[#DDE7E2] dark:border-[#2B3933] overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B6B4B] p-6 text-white flex items-center justify-between">
          <div>
            <span className="text-xs bg-emerald-800 text-emerald-100 px-2.5 py-0.5 rounded font-bold">
              पंजीकरण नीति
            </span>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">
              खाता पंजीकरण सूचना
            </h2>
            <p className="text-xs text-emerald-200 mt-0.5">
              {institutionConfig.institutionName} ({institutionConfig.district})
            </p>
          </div>
          <button
            onClick={handleBack}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>लॉगिन पर लौटें</span>
          </button>
        </div>

        {/* Registration Restricted Policy Notice */}
        <div className="p-8 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              नवीन खाता पंजीकरण प्रतिबंधित है
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
              संकुल पोर्टल सुरक्षा नीति के अनुसार केवल <strong>मुख्य व्यवस्थापक (Admin)</strong>, <strong>2 जन शिक्षक (CAC 1 व CAC 2)</strong>, एवं संकुल की <strong>अधिकृत प्राथमिक व माध्यमिक शालाओं (UDISE)</strong> के खाते ही अधिकृत हैं। अन्य किसी के लिए नया खाता खोलना अनुमत नहीं है।
            </p>
          </div>

          <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-900/60 p-4 rounded-xl border border-gray-200 dark:border-gray-800 text-left text-xs space-y-2">
            <div className="font-bold text-gray-800 dark:text-gray-200">अधिकृत लॉगिन श्रेणियां (Authorized Logins Only):</div>
            <ul className="space-y-1.5 text-gray-600 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>मुख्य व्यवस्थापक (Admin):</strong> SANYAMJAIN88</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>जन शिक्षक 1 (CAC 1):</strong> Sanjayjain1979</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>जन शिक्षक 2 (CAC 2):</strong> Sanmatijain99</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                <span><strong>संकुल की अधिकृत शालाएं (School):</strong> संस्था का 11-अंकीय UDISE कोड</span>
              </li>
            </ul>
          </div>

          <div className="pt-2">
            <button
              onClick={handleBack}
              className="bg-[#0B6B4B] hover:bg-[#08543A] text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm cursor-pointer"
            >
              लॉगिन पोर्टल पर वापस जाएं
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
