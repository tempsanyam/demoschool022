import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Printer,
  ChevronDown,
  FileText,
  LayoutTemplate,
  FileSpreadsheet,
  Download,
  X,
  Calendar,
  Building2,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import {
  ExportDataPayload,
  exportToExcel,
  exportToUnicodePDF,
} from '../../utils/exportUtils';
import { triggerPrint } from '../../utils/printUtils';

export interface UnifiedPrintButtonProps {
  /** Triggered when user selects "Print Current View" (direct browser/screen print) */
  onPrintCurrentView?: () => void;
  /** Triggered when user selects "Print Report" (official document / smart report print) */
  onPrintReport?: () => void;
  /** Triggered when user selects "Literacy Form / Register" (ULLAS official form print) */
  onPrintLiteracyForm?: () => void;
  /** Explicit trigger for direct PDF file download */
  onDownloadPDF?: () => void | Promise<void>;
  /** Explicit trigger for direct Excel (.xlsx) file download */
  onDownloadExcel?: () => void | Promise<void>;
  /** Standard export data payload to automatically enable real PDF and Excel downloads */
  exportPayload?: ExportDataPayload | (() => ExportDataPayload);

  /** Current session to display as context (e.g. '2026-27') */
  currentSession?: string;
  /** Current school name or cluster scope to display */
  currentSchoolName?: string;
  /** Current UDISE code */
  currentUdise?: string;

  /** Label for Option 1 (Default: 'Print Current View') */
  currentViewLabel?: string;
  /** Subtext/description for Option 1 */
  currentViewSubtext?: string;
  /** Label for Option 2 (Default: 'Print Report') */
  reportLabel?: string;
  /** Subtext/description for Option 2 */
  reportSubtext?: string;
  /** Label for Option 3 - Literacy Form (Default: 'ULLAS Forms (01-05)') */
  literacyFormLabel?: string;
  /** Subtext/description for Option 3 */
  literacyFormSubtext?: string;

  /** Button main label (Default: 'Print & Download') */
  buttonLabel?: string;
  /** Visual variant */
  variant?: 'default' | 'primary' | 'compact';
  /** Dropdown menu alignment relative to button */
  align?: 'left' | 'right';
  /** Custom additional className */
  className?: string;
  /** Optional HTML id attribute */
  id?: string;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Optional container ref to print directly when onPrintCurrentView is not provided */
  previewContainerRef?: React.RefObject<HTMLElement | null>;
}

export const UnifiedPrintButton: React.FC<UnifiedPrintButtonProps> = ({
  onPrintCurrentView,
  onPrintReport,
  onPrintLiteracyForm,
  onDownloadPDF,
  onDownloadExcel,
  exportPayload,
  currentSession,
  currentSchoolName,
  currentUdise,
  currentViewLabel = 'Print Current View',
  currentViewSubtext = 'वर्तमान स्क्रीन/तालिका प्रिंट करें',
  reportLabel = 'Print Report',
  reportSubtext = 'A4 रिपोर्ट प्रारूप में प्रिंट करें',
  literacyFormLabel = 'ULLAS Forms (01-05)',
  literacyFormSubtext = 'ULLAS आधिकारिक प्रपत्र 01 से 05 प्रिंट करें',
  buttonLabel = 'Print & Download',
  variant = 'default',
  align = 'right',
  className = '',
  id = 'unified-print-button',
  disabled = false,
  previewContainerRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [effectiveAlign, setEffectiveAlign] = useState<'left' | 'right'>(align);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Determine if downloads are available either via explicit handlers or via exportPayload
  const hasPayload = Boolean(exportPayload);
  const canDownloadPDF = Boolean(onDownloadPDF || hasPayload);
  const canDownloadExcel = Boolean(onDownloadExcel || hasPayload);

  const hasPrintOptions = Boolean(onPrintCurrentView || onPrintReport || onPrintLiteracyForm);
  const hasDownloadOptions = canDownloadPDF || canDownloadExcel;

  // Auto-detect alignment to prevent horizontal bleed on mobile/edge
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const popoverWidth = 360;

      if (rect.right < popoverWidth && rect.left + popoverWidth <= viewportWidth) {
        setEffectiveAlign('left');
      } else if (rect.left + popoverWidth > viewportWidth && rect.right >= popoverWidth) {
        setEffectiveAlign('right');
      } else {
        setEffectiveAlign(align);
      }
    }
  }, [isOpen, align]);

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    },
    []
  );

  const getResolvedPayload = (): ExportDataPayload | null => {
    if (!exportPayload) return null;
    return typeof exportPayload === 'function' ? exportPayload() : exportPayload;
  };

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen((prev) => !prev);
  };

  // Action Handlers
  const handleCurrentView = () => {
    setIsOpen(false);
    if (onPrintCurrentView) {
      onPrintCurrentView();
    } else if (previewContainerRef?.current) {
      triggerPrint(previewContainerRef.current);
    } else {
      triggerPrint();
    }
  };

  const handleReport = () => {
    setIsOpen(false);
    if (onPrintReport) {
      onPrintReport();
    }
  };

  const handleLiteracyForm = () => {
    setIsOpen(false);
    if (onPrintLiteracyForm) {
      onPrintLiteracyForm();
    }
  };

  const handlePDFDownload = async () => {
    try {
      setIsProcessing('PDF');
      if (onDownloadPDF) {
        await onDownloadPDF();
      } else {
        const payload = getResolvedPayload();
        if (payload) {
          await exportToUnicodePDF(payload);
        }
      }
      setFeedbackMsg('PDF डाउनलोड संपन्न');
      setTimeout(() => {
        setFeedbackMsg(null);
        setIsOpen(false);
      }, 1000);
    } catch (err) {
      console.error('PDF export error:', err);
      setFeedbackMsg('डाउनलोड विफल');
      setTimeout(() => setFeedbackMsg(null), 2000);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleExcelDownload = async () => {
    try {
      setIsProcessing('EXCEL');
      if (onDownloadExcel) {
        await onDownloadExcel();
      } else {
        const payload = getResolvedPayload();
        if (payload) {
          exportToExcel(payload);
        }
      }
      setFeedbackMsg('Excel डाउनलोड संपन्न');
      setTimeout(() => {
        setFeedbackMsg(null);
        setIsOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Excel export error:', err);
      setFeedbackMsg('डाउनलोड विफल');
      setTimeout(() => setFeedbackMsg(null), 2000);
    } finally {
      setIsProcessing(null);
    }
  };

  // Base Button Styles
  let btnClasses =
    'h-10 sm:h-10.5 px-3 sm:px-3.5 py-2 text-xs sm:text-[13px] font-semibold rounded-lg transition-all flex items-center gap-2 cursor-pointer select-none no-print';
  if (variant === 'primary') {
    btnClasses +=
      ' bg-[#0B6B4B] hover:bg-emerald-800 text-white shadow-xs border border-emerald-900/30';
  } else if (variant === 'compact') {
    btnClasses +=
      ' h-9 px-2.5 py-1.5 bg-white dark:bg-[#17211C] border border-gray-300 dark:border-[#2B3933] text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-2xs';
  } else {
    btnClasses +=
      ' bg-white dark:bg-[#17211C] border border-gray-300 dark:border-[#2B3933] text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-[#202E27] hover:border-gray-400 dark:hover:border-gray-600 shadow-2xs';
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left no-print ${className}`}
      onKeyDown={handleKeyDown}
      id={`${id}-container`}
    >
      {/* Primary Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={buttonLabel}
        className={`${btnClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        title="प्रिंट एवं डाउनलोड केंद्र (Print & Download Center)"
      >
        <Printer className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" aria-hidden="true" />
        <span className="font-semibold tracking-tight">{buttonLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-0.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-600 dark:text-emerald-400' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Popover / Compact Center Modal */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={`${id}-title`}
          className={`absolute ${
            effectiveAlign === 'right' ? 'right-0' : 'left-0'
          } mt-2 w-80 sm:w-[350px] max-w-[calc(100vw-24px)] bg-white dark:bg-[#16211D] rounded-xl shadow-2xl border border-gray-200 dark:border-[#2B3933] z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden text-gray-800 dark:text-gray-100`}
        >
          {/* Header Bar */}
          <div className="px-4 py-3 bg-gray-50/90 dark:bg-[#121B17] border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                <Printer className="w-3.5 h-3.5" />
              </div>
              <div>
                <h3 id={`${id}-title`} className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                  Print & Download
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  प्रिंट एवं डाउनलोड केंद्र
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Context Banner: Session & School Metadata */}
          {(currentSession || currentSchoolName || currentUdise) && (
            <div className="px-4 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border-b border-emerald-100/60 dark:border-emerald-900/30 flex flex-wrap items-center gap-2 text-[10.5px]">
              {currentSession && (
                <span className="inline-flex items-center gap-1 font-semibold text-emerald-900 dark:text-emerald-300 font-mono">
                  <Calendar className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  सत्र: {currentSession}
                </span>
              )}
              {(currentSchoolName || currentUdise) && (
                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
                  <Building2 className="w-3 h-3 text-gray-400" />
                  {currentSchoolName || `UDISE: ${currentUdise}`}
                </span>
              )}
            </div>
          )}

          {/* Feedback or Status Toast */}
          {feedbackMsg && (
            <div className="mx-3 mt-2.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-in fade-in duration-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          <div className="p-3 space-y-3.5 max-h-[75vh] overflow-y-auto">
            {/* ================= SECTION 1: PRINT ================= */}
            {hasPrintOptions && (
              <div>
                <div className="px-1 mb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>PRINT (प्रिंट विकल्प)</span>
                </div>

                <div className="space-y-1">
                  {/* Option 1: Print Current View */}
                  {onPrintCurrentView && (
                    <button
                      type="button"
                      onClick={handleCurrentView}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/50"
                    >
                      <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 group-hover:bg-[#0B6B4B]/10 group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-400 transition-colors shrink-0 mt-0.5">
                        <LayoutTemplate className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-400 flex items-center justify-between">
                          <span>{currentViewLabel}</span>
                          <span className="text-[10px] text-gray-400 font-normal">स्क्रीन प्रिंट →</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                          {currentViewSubtext}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Option 2: Print Report (A4 Smart Report) */}
                  {onPrintReport && (
                    <button
                      type="button"
                      onClick={handleReport}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-purple-200 dark:hover:border-purple-900/50"
                    >
                      <div className="p-1.5 rounded-md bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/60 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-purple-700 dark:group-hover:text-purple-300 flex items-center justify-between">
                          <span>{reportLabel}</span>
                          <span className="text-[9.5px] font-bold bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded font-mono">
                            A4 प्रारूप →
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                          {reportSubtext}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Option 3: ULLAS Forms (if applicable) */}
                  {onPrintLiteracyForm && (
                    <button
                      type="button"
                      onClick={handleLiteracyForm}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/50"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-[#087F5B] dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 transition-colors shrink-0 mt-0.5">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#087F5B] dark:group-hover:text-emerald-300 flex items-center justify-between">
                          <span>{literacyFormLabel}</span>
                          <span className="text-[9.5px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-[#087F5B] dark:text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                            प्रपत्र 01-05 →
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                          {literacyFormSubtext}
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ================= SECTION 2: DOWNLOAD ================= */}
            {hasDownloadOptions && (
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="px-1 mb-1.5 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                  <span>DOWNLOAD (डाउनलोड विकल्प)</span>
                </div>

                <div className="space-y-1">
                  {/* Download Option 1: PDF */}
                  {canDownloadPDF && (
                    <button
                      type="button"
                      disabled={isProcessing !== null}
                      onClick={handlePDFDownload}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                    >
                      <div className="p-1.5 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/60 group-hover:text-rose-700 dark:group-hover:text-rose-300 transition-colors shrink-0 mt-0.5">
                        {isProcessing === 'PDF' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileText className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-rose-700 dark:group-hover:text-rose-300 flex items-center justify-between">
                          <span>📕 PDF फ़ाइल</span>
                          <span className="text-[10px] text-gray-400 font-mono font-normal">.pdf ↓</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                          आधिकारिक दस्तावेज़ प्रारूप में PDF डाउनलोड करें
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Download Option 2: Excel */}
                  {canDownloadExcel && (
                    <button
                      type="button"
                      disabled={isProcessing !== null}
                      onClick={handleExcelDownload}
                      className="w-full text-left p-2.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors flex items-start gap-2.5 group cursor-pointer border border-transparent hover:border-emerald-200 dark:hover:border-emerald-900/50"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors shrink-0 mt-0.5">
                        {isProcessing === 'EXCEL' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100 group-hover:text-[#0B6B4B] dark:group-hover:text-emerald-300 flex items-center justify-between">
                          <span>📊 Excel फ़ाइल</span>
                          <span className="text-[10px] text-gray-400 font-mono font-normal">.xlsx ↓</span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">
                          स्प्रेडशीट विश्लेषण हेतु Excel फ़ाइल डाउनलोड करें
                        </p>
                      </div>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-[#121B17] border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
            <span>A4 एवं यूनिकोड संगत</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-2.5 py-1 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-800 rounded transition-colors cursor-pointer"
            >
              बंद करें
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const PrintDownloadCenter = UnifiedPrintButton;
