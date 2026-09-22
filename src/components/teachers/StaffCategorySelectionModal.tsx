import React, { useEffect } from 'react';
import { X, GraduationCap, Utensils, Users, ChevronRight, Sparkles } from 'lucide-react';

export type StaffCategory = 'TEACHER' | 'OTHER_STAFF';

interface StaffCategorySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (category: StaffCategory) => void;
  selectedSessionId?: string;
  isSessionLocked?: boolean;
}

export const StaffCategorySelectionModal: React.FC<StaffCategorySelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  selectedSessionId,
  isSessionLocked = false
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id="staff-category-selection-backdrop"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        id="staff-category-selection-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-modal-heading"
        className="bg-white dark:bg-[#17211C] rounded-2xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl border border-[#DDE7E2] dark:border-[#2B3933] transform transition-all animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Users className="w-5 h-5 pointer-events-none" />
              </span>
              <div>
                <h3
                  id="category-modal-heading"
                  className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white"
                >
                  आप किसे जोड़ना चाहते हैं?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  कर्मचारी की उपयुक्त श्रेणी चुनें ताकि संबंधित प्रपत्र (Form) खोला जा सके
                </p>
              </div>
            </div>
          </div>
          <button
            id="btn-close-category-selection"
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="बंद करें (ESC)"
            aria-label="बंद करें"
          >
            <X className="w-5 h-5 pointer-events-none" />
          </button>
        </div>

        {selectedSessionId && (
          <div className="mt-3 flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-[#0F1713] rounded-lg border border-gray-200 dark:border-gray-800 text-xs text-gray-600 dark:text-gray-300">
            <span className="font-medium">शैक्षणिक सत्र:</span>
            <span className="font-bold font-mono text-[#0B6B4B] dark:text-emerald-400">{selectedSessionId}</span>
          </div>
        )}

        {isSessionLocked && (
          <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2">
            <span>🔒</span>
            <span>यह शैक्षणिक सत्र अभिलेखित/लॉक्ड है। इस सत्र में नया रिकॉर्ड जोड़ना प्रतिबंधित है।</span>
          </div>
        )}

        {/* 2 Prominent Options: Teacher & Other Staff */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Teacher */}
          <button
            id="btn-select-category-teacher"
            type="button"
            disabled={isSessionLocked}
            onClick={() => onSelectCategory('TEACHER')}
            className={`group p-5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isSessionLocked
                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                : 'bg-white dark:bg-[#121B17] border-purple-200 dark:border-purple-900/60 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6 pointer-events-none" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                  👨‍🏫 शिक्षक
                </span>
              </div>
              <div className="text-xs font-semibold text-purple-800 dark:text-purple-300 mt-1">
                शिक्षक/Teaching Staff की जानकारी जोड़ें
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                प्रधानाध्यापक, माध्यमिक शिक्षक, प्राथमिक शिक्षक, उच्च श्रेणी व अतिथि शिक्षक
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-950/60 flex items-center justify-between text-xs font-bold text-purple-700 dark:text-purple-400">
              <span>शिक्षक फॉर्म खोलें</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform pointer-events-none" />
            </div>
          </button>

          {/* Card 2: Other Staff */}
          <button
            id="btn-select-category-other-staff"
            type="button"
            disabled={isSessionLocked}
            onClick={() => onSelectCategory('OTHER_STAFF')}
            className={`group p-5 rounded-xl border text-left transition-all flex flex-col justify-between ${
              isSessionLocked
                ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200'
                : 'bg-white dark:bg-[#121B17] border-emerald-200 dark:border-emerald-900/60 hover:border-[#0B6B4B] dark:hover:border-emerald-500 hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
            }`}
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-[#0B6B4B] dark:text-emerald-300 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6 pointer-events-none" />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-base font-bold text-gray-900 dark:text-white group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-300 transition-colors">
                  👤 अन्य स्टाफ
                </span>
              </div>
              <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-300 mt-1">
                Non-teaching / अन्य कर्मचारी की जानकारी जोड़ें
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                भृत्य, कार्यालय सहायक, चौकीदार, प्रयोगशाला सहायक, सफाई कर्मचारी व अन्य गैर-शैक्षणिक कर्मचारी
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-100 dark:border-emerald-950/60 flex items-center justify-between text-xs font-bold text-[#0B6B4B] dark:text-emerald-400">
              <span>अन्य स्टाफ फॉर्म खोलें</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform pointer-events-none" />
            </div>
          </button>
        </div>

        {/* Footer with Cancel button */}
        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
          <button
            id="btn-cancel-category-selection"
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors border border-gray-300 dark:border-gray-700 cursor-pointer"
          >
            रद्द करें
          </button>
        </div>
      </div>
    </div>
  );
};
