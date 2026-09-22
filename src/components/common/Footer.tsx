import React from 'react';
import { RefreshCw, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { institutionConfig } from '../../config/institutionConfig';

interface FooterProps {
  onNavigate?: (viewId: string) => void;
  onOpenHelp?: () => void;
  onOpenPrivacy?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  const { currentUser } = useAuth();
  const { settings, schools, selectedSessionId, isCurrentSessionSelected } = useData();

  const currentSessionLabel = selectedSessionId || settings?.academicSession || institutionConfig.academicSession;

  return (
    <footer className="w-full bg-[#FFFFFF] dark:bg-[#101815] text-[#17211C] dark:text-[#FFFFFF] border-t border-[#DDE7E2] dark:border-[#1E2D27] text-xs no-print transition-colors mt-auto shadow-inner overflow-hidden">
      {/* Responsive Grid Section */}
      <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 py-6 sm:py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Section 1: Institution Info */}
        <div className="space-y-3 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0B6B4B] text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
              🏛️
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-[#0B6B4B] dark:text-emerald-400 text-sm leading-tight break-words">
                {institutionConfig.institutionName}
              </h3>
              <p className="text-[10px] text-gray-500 dark:text-[#B8C8C1] truncate">
                {institutionConfig.subtitle}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-gray-600 dark:text-[#B8C8C1] space-y-1.5 break-words">
            <p className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#0B6B4B] shrink-0 mt-0.5" />
              <span>
                विकास खंड — <strong>{institutionConfig.block}</strong><br />
                जिला — <strong>{institutionConfig.district}</strong>, {institutionConfig.state} ({institutionConfig.pinCode})
              </span>
            </p>
            <p className="pt-1">
              संकुल केंद्र (JSK) डाइज कोड: <strong className="font-mono text-gray-900 dark:text-white">{institutionConfig.diseCode}</strong>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 block font-sans">
                (शा. हाई स्कूल मलगुवां • संकुल केंद्र)
              </span>
            </p>
            {currentUser?.assignedSchoolUdise && (
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                लॉगिन संस्था डाइज कोड (School UDISE): <strong className="font-mono font-bold">{currentUser.assignedSchoolUdise}</strong>
              </p>
            )}
            <p>
              कुल संकुल विद्यालय: <strong className="text-[#0B6B4B] dark:text-emerald-400">{schools.length} शालाएं</strong>
            </p>
          </div>
        </div>

        {/* Section 2: CAC & Administrative Contact Info */}
        <div className="space-y-3 min-w-0">
          <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 border-b border-gray-100 dark:border-gray-800 pb-1 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-[#0B6B4B]" />
            संकुल प्रशासनिक संपर्क
          </h4>

          <div className="text-[11px] text-gray-600 dark:text-[#B8C8C1] space-y-2.5">
            <div className="bg-[#F8FAF8] dark:bg-[#16221D] p-2.5 rounded-lg border border-[#DDE7E2] dark:border-[#213028]">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-gray-900 dark:text-white">{institutionConfig.cac1.name}</span>
                <span className="text-[10px] bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">सी.ए.सी.</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                📞 {institutionConfig.cac1.mobile} • WA: {institutionConfig.cac1.whatsapp}
              </p>
            </div>

            <div className="bg-[#F8FAF8] dark:bg-[#16221D] p-2.5 rounded-lg border border-[#DDE7E2] dark:border-[#213028]">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-gray-900 dark:text-white">{institutionConfig.cac2.name}</span>
                <span className="text-[10px] bg-[#EAF6F0] dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">सी.ए.सी.</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
                📞 {institutionConfig.cac2.mobile} • WA: {institutionConfig.cac2.whatsapp}
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Current User & System Status */}
        <div className="space-y-3 min-w-0">
          <h4 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-[11px] mb-2.5 border-b border-gray-100 dark:border-gray-800 pb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            सक्रिय उपयोगकर्ता व सिस्टम स्थिति
          </h4>

          <div className="bg-[#F8FAF8] dark:bg-[#16221D] p-3 rounded-xl border border-[#DDE7E2] dark:border-[#213028] space-y-1.5">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
              लॉगिन उपयोगकर्ता (Logged In)
            </div>
            <div className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
              {currentUser?.name || institutionConfig.cac1.name}
            </div>
            <div className="text-[11px] text-[#0B6B4B] dark:text-emerald-300 font-semibold truncate">
              {currentUser?.designation || institutionConfig.cac1.role}
            </div>
            <div className="text-[10px] text-gray-500 dark:text-[#B8C8C1] truncate">
              आईडी: {currentUser?.employeeId || 'EMP-CAC-201'}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-[#EAF6F0] dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-800/60">
            <RefreshCw className="w-3 h-3 animate-spin text-[#0B6B4B] dark:text-emerald-400 shrink-0" />
            <span className="truncate">लाइव डेटा सिंक: सक्रिय</span>
          </div>
        </div>
      </div>

      {/* Bottom Copyright & Session Bar */}
      <div className="w-full bg-gray-50 dark:bg-[#0A100E] border-t border-[#DDE7E2] dark:border-[#1E2D27] py-3 px-3.5 sm:px-6">
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11px] text-gray-500 dark:text-[#B8C8C1] text-center sm:text-left">
          <div className="break-words">
            © {institutionConfig.copyrightYear} <strong>{institutionConfig.institutionName}</strong> | विकास खंड {institutionConfig.block}, जिला {institutionConfig.district}, {institutionConfig.state}
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-3 font-medium shrink-0">
            <span className="text-[#0B6B4B] dark:text-emerald-400 whitespace-nowrap">
              Academic Session: <strong>{currentSessionLabel}</strong> {!isCurrentSessionSelected && '(ReadOnly)'}
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">
              System Version: <strong>{institutionConfig.systemVersion}</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
