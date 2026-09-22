import React from 'react';
import { X, History, Building2 } from 'lucide-react';
import { School } from '../../types';
import { SchoolHistoryView } from './SchoolHistoryView';

interface SchoolHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  school: School;
  onSelectSession?: (sessionId: string) => void;
}

export const SchoolHistoryModal: React.FC<SchoolHistoryModalProps> = ({
  isOpen,
  onClose,
  school,
  onSelectSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#151F1A] w-full max-w-5xl max-h-[92vh] rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded-2xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>विद्यालय इतिहास / शैक्षणिक सत्र समयरेखा</span>
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {school.hindiName || school.name} (यूडाइस: <span className="font-mono font-bold">{school.udise}</span>)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
            title="बंद करें"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <SchoolHistoryView
            school={school}
            onSelectSession={(sId) => {
              if (onSelectSession) {
                onSelectSession(sId);
              }
            }}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 px-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 flex items-center justify-between text-xs shrink-0">
          <span className="text-gray-500 dark:text-gray-400">
            संकुल केंद्र: मलगुवां • विकासखंड: बलदेवगढ़ • जिला: टीकमगढ़
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            बंद करें
          </button>
        </div>
      </div>
    </div>
  );
};
