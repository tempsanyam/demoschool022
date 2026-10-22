import React from 'react';
import { ShieldAlert, Clock, ArrowLeft, Lock, CalendarClock } from 'lucide-react';
import {
  FeatureAccessEvaluation,
  formatRemainingDurationHi,
} from '../../config/featureControlRegistry';
import { useFeatureControl } from '../../context/FeatureControlContext';

interface FeatureGuardProps {
  featureKey: string;
  evaluation?: FeatureAccessEvaluation;
  mode?: 'hide' | 'disable' | 'banner' | 'page';
  onReturnToDashboard?: () => void;
  children: React.ReactNode;
}

/**
 * Reusable Feature / Option Control Guard:
 * - mode="hide": Hides the child element completely when disabled.
 * - mode="banner": Displays a clean Hindi informational banner instead of the sub-section.
 * - mode="page": Full route-level guard screen with timer countdown & return button.
 */
export const FeatureGuard: React.FC<FeatureGuardProps> = ({
  featureKey,
  evaluation: providedEvaluation,
  mode = 'hide',
  onReturnToDashboard,
  children,
}) => {
  const { getFeatureEvaluation } = useFeatureControl();
  const evaluation = providedEvaluation || getFeatureEvaluation(featureKey);

  if (evaluation.allowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return null;
  }

  const label = evaluation.config?.labelHi || 'यह सुविधा';
  const formattedEnd = evaluation.reactivateAt
    ? new Date(evaluation.reactivateAt).toLocaleString('hi-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : null;

  if (mode === 'banner') {
    return (
      <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 flex items-start gap-3 text-xs my-2">
        <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 shrink-0">
          {evaluation.isTemporarilyDisabled ? (
            <Clock className="w-4 h-4" />
          ) : (
            <Lock className="w-4 h-4" />
          )}
        </div>
        <div className="space-y-1 flex-1 min-w-0">
          <p className="font-bold text-amber-900 dark:text-amber-200">
            {label} — यह सुविधा वर्तमान में व्यवस्थापक (ADMIN) द्वारा अस्थायी रूप से बंद की गई है।
          </p>
          {evaluation.customMessage && (
            <p className="text-amber-800 dark:text-amber-300 font-medium">
              सूचना: {evaluation.customMessage}
            </p>
          )}
          {evaluation.reason && (
            <p className="text-amber-700 dark:text-amber-400">
              कारण: {evaluation.reason}
            </p>
          )}
          {evaluation.isTemporarilyDisabled && formattedEnd && (
            <p className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5 pt-0.5">
              <CalendarClock className="w-3.5 h-3.5" />
              <span>
                निर्धारित समय ({formattedEnd}) के बाद यह सुविधा स्वतः पुनः सक्रिय हो जाएगी
                {evaluation.remainingMs
                  ? ` (शेष समय: ${formatRemainingDurationHi(evaluation.remainingMs)})`
                  : ''}
                ।
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }

  // mode === 'page' (Full Route Access Guard)
  return (
    <div className="min-h-[65vh] flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white dark:bg-[#17211C] border border-[#DDE7E2] dark:border-[#2B3933] rounded-2xl shadow-sm p-6 sm:p-8 text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
          {evaluation.isTemporarilyDisabled ? (
            <Clock className="w-8 h-8 animate-pulse" />
          ) : (
            <ShieldAlert className="w-8 h-8" />
          )}
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            {evaluation.isTemporarilyDisabled
              ? '⏳ समय-सीमा आधारित अस्थायी रोक (Scheduled Maintenance)'
              : '🔒 प्रशासनिक रूप से निष्क्रिय (Disabled by Admin)'}
          </span>

          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pt-1">
            {label}
          </h2>

          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {evaluation.customMessage ||
              'यह सुविधा वर्तमान में व्यवस्थापक (ADMIN) द्वारा अस्थायी रूप से बंद की गई है।'}
          </p>
        </div>

        <div className="bg-[#F6F9F7] dark:bg-[#111A16] border border-[#DDE7E2] dark:border-[#2B3933] rounded-xl p-4 text-left space-y-2 text-xs">
          {evaluation.reason && (
            <div className="flex justify-between gap-2">
              <span className="text-gray-500 dark:text-gray-400 font-medium">कारण:</span>
              <span className="font-bold text-gray-800 dark:text-gray-200 text-right">
                {evaluation.reason}
              </span>
            </div>
          )}

          {evaluation.isTemporarilyDisabled && formattedEnd && (
            <>
              <div className="flex justify-between gap-2 pt-1 border-t border-gray-200/70 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  पुनः सक्रिय होने का समय:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-right">
                  {formattedEnd}
                </span>
              </div>
              {evaluation.remainingMs !== null && evaluation.remainingMs !== undefined && (
                <div className="flex justify-between gap-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    शेष प्रतीक्षा समय:
                  </span>
                  <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                    {formatRemainingDurationHi(evaluation.remainingMs)}
                  </span>
                </div>
              )}
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium pt-1">
                ✓ निर्धारित समय समाप्त होते ही यह सुविधा अपने आप पुनः चालू (ACTIVE) हो जाएगी।
              </p>
            </>
          )}
        </div>

        {onReturnToDashboard && (
          <div className="pt-2">
            <button
              onClick={onReturnToDashboard}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0B6B4B] hover:bg-[#09563C] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>मुख्य डैशबोर्ड पर वापस जाएं</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
