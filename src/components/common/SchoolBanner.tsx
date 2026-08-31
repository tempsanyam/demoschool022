import React from 'react';
import { institutionConfig } from '../../config/institutionConfig';

interface SchoolBannerProps {
  schoolName: string;
  hindiName?: string;
  udise: string;
  village: string;
  gramPanchayat?: string;
  block?: string;
  district?: string;
  schoolType?: string;
  principalName?: string;
  principalMobile?: string;
  academicSession?: string;
}

export const SchoolBanner: React.FC<SchoolBannerProps> = ({
  schoolName,
  hindiName,
  udise,
  village,
  gramPanchayat,
  block = institutionConfig.block,
  district = institutionConfig.district,
  schoolType,
  principalName,
  principalMobile,
  academicSession = institutionConfig.academicSession
}) => {
  return (
    <div className="bg-[#0B6B4B] dark:bg-[#0E231B] text-white rounded-xl p-3 sm:p-4 md:p-5 shadow-sm border border-emerald-700/60 dark:border-emerald-800/80 mb-5 relative overflow-hidden transition-colors w-full min-w-0">
      <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-700/30 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 relative z-10 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
            <span className="bg-[#FF7A00] text-white text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded shadow-2xs">
              यूडाइस: {udise}
            </span>
            {schoolType && (
              <span className="bg-emerald-800/90 text-emerald-100 text-[11px] sm:text-xs px-2.5 py-0.5 rounded font-medium border border-emerald-600/40">
                {schoolType}
              </span>
            )}
            <span className="bg-emerald-950/80 text-emerald-200 text-[11px] sm:text-xs px-2 py-0.5 rounded border border-emerald-800/50">
              सत्र {academicSession}
            </span>
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight leading-tight break-words">
            {schoolName || hindiName}
          </h2>
          <p className="text-emerald-200/90 text-xs sm:text-sm mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span>संकुल: <strong className="text-white">{institutionConfig.sankulName}</strong></span>
            <span className="text-emerald-400/60">•</span>
            <span>जन शिक्षा केंद्र: <strong className="text-white">{institutionConfig.jskName}</strong></span>
          </p>
        </div>

        <div className="bg-emerald-950/70 backdrop-blur-xs border border-emerald-700/60 rounded-lg p-2.5 sm:p-3 text-xs sm:text-sm grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1.5 text-emerald-100 min-w-0 shrink-0">
          <div className="min-w-0">
            <span className="text-emerald-400 block text-[10px] sm:text-[11px]">ग्राम / मजरा:</span>
            <span className="font-semibold text-white truncate block">{village}</span>
          </div>
          <div className="min-w-0">
            <span className="text-emerald-400 block text-[10px] sm:text-[11px]">ग्राम पंचायत:</span>
            <span className="font-semibold text-white truncate block">{gramPanchayat || village}</span>
          </div>
          <div className="min-w-0 col-span-2 sm:col-span-1">
            <span className="text-emerald-400 block text-[10px] sm:text-[11px]">विकासखंड / जिला:</span>
            <span className="font-semibold text-white truncate block">{block}, {district}</span>
          </div>
          {principalName && (
            <div className="col-span-2 sm:col-span-3 pt-1.5 border-t border-emerald-800/80 mt-0.5 flex items-center justify-between gap-2 flex-wrap text-xs">
              <div className="min-w-0 flex items-center gap-1 truncate">
                <span className="text-emerald-400 text-[10px] sm:text-[11px] shrink-0">संस्था प्रधान:</span>
                <span className="font-bold text-white truncate">{principalName}</span>
              </div>
              {principalMobile && (
                <div className="text-emerald-300 text-xs font-mono shrink-0">
                  📞 {principalMobile}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
