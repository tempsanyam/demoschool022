import React from 'react';
import {
  CalendarCheck,
  Utensils,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  LucideIcon,
} from 'lucide-react';
import { PendingActionItem } from '../../types';

const iconMap: Record<string, LucideIcon> = {
  CalendarCheck,
  Utensils,
  ClipboardList,
  AlertTriangle,
  ShieldCheck,
  Bell,
};

interface PendingActionsCardProps {
  items: PendingActionItem[];
  onNavigate: (route: string) => void;
  onOpenQuickAttendance?: () => void;
  onOpenQuickMDM?: () => void;
}

export const PendingActionsCard: React.FC<PendingActionsCardProps> = ({
  items,
  onNavigate,
  onOpenQuickAttendance,
  onOpenQuickMDM,
}) => {
  const getPriorityBadge = (priority: 'HIGH' | 'MEDIUM' | 'LOW') => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-300 dark:border-rose-800">
            अति-प्राथमिक (Immediate)
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
            मध्यम (Pending)
          </span>
        );
      case 'LOW':
        return (
          <span className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-blue-300 dark:border-blue-800">
            सामान्य (Routine)
          </span>
        );
    }
  };

  const handleActionClick = (item: PendingActionItem) => {
    if (item.id === 'action-attendance' && onOpenQuickAttendance) {
      onOpenQuickAttendance();
      return;
    }
    if (item.id === 'action-mdm' && onOpenQuickMDM) {
      onOpenQuickMDM();
      return;
    }
    onNavigate(item.route);
  };

  return (
    <div className="bg-white dark:bg-[#17211C] p-5 rounded-2xl border border-[#DDE7E2] dark:border-[#2B3933] shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-[#FF7A00] flex items-center justify-center">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                लंबित एवं आवश्यक कार्य (Action Items)
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                आज के प्राथमिकता आधारित शासकीय दायित्व
              </p>
            </div>
          </div>

          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
              items.length > 0
                ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            {items.length > 0 ? `${items.length} कार्य लंबित` : 'सभी पूर्ण'}
          </span>
        </div>

        {/* Action Items List */}
        <div className="mt-4 space-y-2.5">
          {items.length === 0 ? (
            <div className="py-8 text-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-900/40 p-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 text-[#0B6B4B] dark:text-emerald-300 mx-auto flex items-center justify-center mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                सभी कार्य अद्यतन हैं!
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-xs mx-auto">
                आज की उपस्थिति, MDM वितरण एवं सभी विभागीय कार्य समय-सीमा अनुसार अद्यतन हैं।
              </p>
            </div>
          ) : (
            items.slice(0, 5).map((item) => {
              const IconComp = iconMap[item.iconName] || ClipboardList;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-[#111A16] hover:bg-white dark:hover:bg-[#18231E] hover:border-gray-300 dark:hover:border-gray-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#1E2B25] border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 shrink-0 mt-0.5">
                      <IconComp className="w-4 h-4 text-[#0B6B4B] dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {item.title}
                        </span>
                        {getPriorityBadge(item.priority)}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleActionClick(item)}
                    className="bg-[#0B6B4B] hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center shadow-xs"
                  >
                    <span>{item.buttonText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span>विभागीय समय-सीमा अनुसार स्वचालित अद्यतन</span>
        <button
          onClick={() => onNavigate('work')}
          className="text-[#0B6B4B] dark:text-emerald-400 font-bold hover:underline"
        >
          समस्त शासकीय कार्य देखें →
        </button>
      </div>
    </div>
  );
};
