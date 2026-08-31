import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { institutionConfig } from '../../config/institutionConfig';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 15;
      });
    }, 150);

    return () => clearInterval(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0B6B4B] flex flex-col items-center justify-between p-6 text-white select-none">
      {/* Decorative Top pattern */}
      <div className="w-full flex justify-between items-center opacity-75 text-xs text-emerald-200">
        <span>राज्य शिक्षा केंद्र, मध्य प्रदेश</span>
        <span>जिला: {institutionConfig.district} | विकासखंड: {institutionConfig.block}</span>
      </div>

      {/* Main Center Branding */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center text-center max-w-lg"
      >
        {/* National / State Style Emblem Graphic */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-2xl bg-white text-[#0B6B4B] flex items-center justify-center p-3 shadow-2xl border-4 border-emerald-300">
            <div className="text-center">
              <span className="text-4xl block">🏛️</span>
              <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-950 mt-1">
                म.प्र. शासन
              </span>
            </div>
          </div>
          <div className="absolute -inset-1 bg-amber-400 rounded-2xl -z-10 blur-sm opacity-50 animate-pulse" />
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mb-2">
          {institutionConfig.institutionName}
        </h1>

        <p className="text-emerald-100 text-sm sm:text-base font-medium mb-4 leading-relaxed">
          {institutionConfig.fullTitle}
        </p>

        {/* Academic Session Badge */}
        <div className="inline-flex items-center gap-2 bg-[#FF7A00] text-white font-bold text-sm px-4 py-1.5 rounded-full shadow-md mb-8">
          <span>शैक्षणिक सत्र {institutionConfig.academicSession}</span>
        </div>

        {/* Quote */}
        <div className="bg-emerald-950/40 border border-emerald-600/60 rounded-xl px-6 py-2.5 mb-8">
          <p className="text-amber-300 font-bold text-base tracking-wide">
            "सब पढ़ें, सब बढ़ें"
          </p>
          <span className="text-[11px] text-emerald-200">
            सर्व शिक्षा अभियान • समग्र शिक्षा
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-64 max-w-xs">
          <div className="flex justify-between text-xs text-emerald-200 mb-1.5 font-medium">
            <span>डेटा लोड हो रहा है...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-emerald-950/60 rounded-full h-2 overflow-hidden border border-emerald-700">
            <div
              className="bg-amber-400 h-full rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>

      {/* Footer Info */}
      <div className="text-center text-xs text-emerald-200/80">
        <span>© {institutionConfig.copyrightYear} {institutionConfig.institutionName} • विकास खंड {institutionConfig.block}, जिला {institutionConfig.district}</span>
      </div>
    </div>
  );
};
