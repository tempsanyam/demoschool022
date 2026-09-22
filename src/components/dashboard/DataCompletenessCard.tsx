import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { DataCompletenessPillar } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface DataCompletenessCardProps {
  percentage: number;
  status: 'उत्कृष्ट' | 'संतोषजनक' | 'सुधार आवश्यक';
  passedCount: number;
  totalCount: number;
  pillars: DataCompletenessPillar[];
  onNavigate: (route: string) => void;
}

export const DataCompletenessCard: React.FC<DataCompletenessCardProps> = ({
  percentage,
  status,
  passedCount,
  totalCount,
  pillars,
  onNavigate,
}) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const getStatusBadge = () => {
    if (percentage >= 90) {
      return (
        <span className="bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          उत्कृष्ट (90%+)
        </span>
      );
    }
    if (percentage >= 70) {
      return (
        <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" />
          संतोषजनक ({percentage}%)
        </span>
      );
    }
    return (
      <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-300 dark:border-rose-800 flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        सुधार आवश्यक ({percentage}%)
      </span>
    );
  };

  const getProgressColor = () => {
    if (percentage >= 90) return 'bg-[#0B6B4B]';
    if (percentage >= 70) return 'bg-[#FF7A00]';
    return 'bg-rose-600';
  };

  return (
    <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-[#0B6B4B] dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                डेटा पूर्णता एवं गुणवत्ता मीटर
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                शासकीय रिकॉर्ड व पोर्टल अद्यतन स्थिति
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Big Progress Bar */}
        <div className="my-4">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white">
              {percentage}%
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {passedCount} / {totalCount} मानक पूर्ण
            </span>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${getProgressColor()}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Pillars breakdown list */}
        <div className="space-y-2 mt-4">
          {pillars.map((pillar) => (
            <div
              key={pillar.id}
              onClick={() => onNavigate(pillar.route)}
              className="p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1E2B25] transition-colors cursor-pointer flex items-center justify-between group border border-transparent hover:border-gray-200 dark:hover:border-gray-800"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {pillar.isComplete ? (
                  <CheckCircle2 className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                )}
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-gray-800 dark:text-gray-200 truncate group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-300">
                    {pillar.name}
                  </div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">
                    {pillar.details}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600 dark:text-gray-400 shrink-0 ml-2">
                <span>{pillar.scorePct}%</span>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#0B6B4B] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-between">
        <span>डेटाबेस से वास्तविक समय गणना</span>
        {isAdmin ? (
          <button
            onClick={() => onNavigate('upload')}
            className="text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
          >
            बल्क एक्सेल अपलोड करें →
          </button>
        ) : (
          <button
            onClick={() => onNavigate('reports')}
            className="text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
          >
            विभागीय रिपोर्ट्स देखें →
          </button>
        )}
      </div>
    </div>
  );
};
