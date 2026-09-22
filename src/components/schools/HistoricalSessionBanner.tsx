import React from 'react';
import { Calendar, AlertTriangle, ArrowRight, ShieldAlert, History } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface HistoricalSessionBannerProps {
  schoolName: string;
  schoolUdise: string;
  onOpenHistory?: () => void;
  className?: string;
}

export const HistoricalSessionBanner: React.FC<HistoricalSessionBannerProps> = ({
  schoolName,
  schoolUdise,
  onOpenHistory,
  className = '',
}) => {
  const { selectedSessionId, activeSessionId, setSelectedSessionId, academicSessions } = useData();

  const isCurrentSession = selectedSessionId === activeSessionId;
  const currentSessionObj = academicSessions.find((s) => s.id === selectedSessionId);
  const isLockedOrArchived =
    currentSessionObj?.status === 'ARCHIVED' ||
    currentSessionObj?.status === 'CLOSED' ||
    currentSessionObj?.status === 'LOCKED';

  if (isCurrentSession && !isLockedOrArchived) {
    return null;
  }

  return (
    <div
      id="historical-session-summary-banner"
      className={`rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-amber-950/40 p-4 sm:p-5 shadow-sm text-gray-900 dark:text-gray-100 no-print animate-in slide-in-from-top-2 ${className}`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-amber-600 text-white text-xs font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs">
              <Calendar className="w-3.5 h-3.5" />
              <span>शैक्षणिक सत्र: {selectedSessionId}</span>
            </span>

            <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-800">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>अभिलेखीय / केवल अवलोकन दृश्य (Read Only)</span>
            </span>

            {currentSessionObj?.status && (
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                स्थिति: {currentSessionObj.status}
              </span>
            )}
          </div>

          <div className="text-sm font-bold text-gray-800 dark:text-gray-200">
            विद्यालय: <span className="text-[#0B6B4B] dark:text-emerald-400 font-black">{schoolName}</span> • यूडाइस कोड: <span className="font-mono font-black">{schoolUdise}</span>
          </div>

          <div className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed font-medium flex items-start gap-1.5 pt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              यह एक <strong>ऐतिहासिक / विगत शैक्षणिक सत्र ({selectedSessionId})</strong> है। इस सत्र का डेटा केवल अभिलेखीय अवलोकन (Read-Only) हेतु उपलब्ध है। इस सत्र में किसी भी प्रकार का नवीन प्रविष्टि, संपादन, स्थानांतरण, प्रोन्नति अथवा विलोपन सुरक्षित नहीं किया जा सकता।
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0 self-stretch md:self-center justify-end">
          {onOpenHistory && (
            <button
              onClick={onOpenHistory}
              className="px-3.5 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>विद्यालय इतिहास देखें</span>
            </button>
          )}

          <button
            onClick={() => setSelectedSessionId(activeSessionId)}
            className="px-4 py-2 bg-[#0B6B4B] hover:bg-[#09573D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>वर्तमान सत्र ({activeSessionId}) पर जाएं</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
