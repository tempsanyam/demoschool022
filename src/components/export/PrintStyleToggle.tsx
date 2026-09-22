import React, { useEffect, useState } from 'react';
import { Sliders, Contrast, Award, Feather, CheckCircle2, Check } from 'lucide-react';
import {
  DocumentStyle,
  DOCUMENT_STYLES,
  getDocumentStyle,
  setDocumentStyle,
  toCanonicalDocumentStyle,
} from '../../utils/documentStyle';

export type PrintReportStyle = DocumentStyle | 'PROFESSIONAL' | 'MINIMALIST' | 'HIGH_CONTRAST';

interface PrintStyleToggleProps {
  currentStyle?: DocumentStyle | PrintReportStyle;
  onChangeStyle?: (style: DocumentStyle) => void;
  onStyleChange?: (style: DocumentStyle) => void;
}

export const PrintStyleToggle: React.FC<PrintStyleToggleProps> = ({
  currentStyle: propStyle,
  onChangeStyle,
  onStyleChange,
}) => {
  // Sync with canonical local storage or prop
  const [activeStyle, setActiveStyle] = useState<DocumentStyle>(() => {
    return propStyle ? toCanonicalDocumentStyle(propStyle) : getDocumentStyle();
  });

  useEffect(() => {
    if (propStyle) {
      setActiveStyle(toCanonicalDocumentStyle(propStyle));
    }
  }, [propStyle]);

  // Listen for cross-component storage changes
  useEffect(() => {
    const handleStorageChange = (e: CustomEvent<{ style: DocumentStyle }> | Event) => {
      const customEvent = e as CustomEvent<{ style: DocumentStyle }>;
      if (customEvent?.detail?.style) {
        setActiveStyle(customEvent.detail.style);
      } else {
        setActiveStyle(getDocumentStyle());
      }
    };

    window.addEventListener('jsk-document-style-changed', handleStorageChange as EventListener);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('jsk-document-style-changed', handleStorageChange as EventListener);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSelect = (styleId: DocumentStyle) => {
    setActiveStyle(styleId);
    setDocumentStyle(styleId);
    if (onChangeStyle) {
      onChangeStyle(styleId);
    }
    if (onStyleChange) {
      onStyleChange(styleId);
    }
  };

  const styleItems: {
    id: DocumentStyle;
    title: string;
    englishTitle: string;
    description: string;
    inkBadge: string;
    icon: React.ComponentType<{ className?: string }>;
    accentColor: string;
  }[] = [
    {
      id: 'government',
      title: DOCUMENT_STYLES.government.label,
      englishTitle: DOCUMENT_STYLES.government.englishTitle,
      description: DOCUMENT_STYLES.government.description,
      inkBadge: DOCUMENT_STYLES.government.inkBadge,
      icon: Award,
      accentColor: 'border-[#0B6B4B] text-[#0B6B4B]',
    },
    {
      id: 'ink-saver',
      title: DOCUMENT_STYLES['ink-saver'].label,
      englishTitle: DOCUMENT_STYLES['ink-saver'].englishTitle,
      description: DOCUMENT_STYLES['ink-saver'].description,
      inkBadge: DOCUMENT_STYLES['ink-saver'].inkBadge,
      icon: Feather,
      accentColor: 'border-blue-600 text-blue-600',
    },
    {
      id: 'high-contrast',
      title: DOCUMENT_STYLES['high-contrast'].label,
      englishTitle: DOCUMENT_STYLES['high-contrast'].englishTitle,
      description: DOCUMENT_STYLES['high-contrast'].description,
      inkBadge: DOCUMENT_STYLES['high-contrast'].inkBadge,
      icon: Contrast,
      accentColor: 'border-black text-black',
    },
  ];

  return (
    <div
      id="print-style-toggle-container"
      className="bg-white dark:bg-[#16211D] p-4 sm:p-5 rounded-2xl border border-[#D9E2DD] dark:border-[#2B3A34] shadow-xs space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950 text-[#0B6B4B] dark:text-emerald-300 rounded-lg">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              प्रिंट एवं PDF दस्तावेज़ शैली (Document Style Layout)
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              प्रिंटर के प्रकार, स्याही उपयोग व पढ़ने की स्थिति के अनुसार फ़ॉन्ट वेट, बॉर्डर्स एवं बैकग्राउंड चुनें
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {styleItems.map((item) => {
          const Icon = item.icon;
          const isSelected = activeStyle === item.id;
          return (
            <button
              key={item.id}
              type="button"
              id={`style-btn-${item.id}`}
              onClick={() => handleSelect(item.id)}
              aria-pressed={isSelected ? 'true' : 'false'}
              className={`text-left p-3.5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                isSelected
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/40 border-[#0B6B4B] dark:border-emerald-500 shadow-sm ring-1 ring-[#0B6B4B]/30'
                  : 'bg-gray-50/70 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-[#0B6B4B] dark:text-emerald-400' : 'text-gray-500'
                      }`}
                    />
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                      {item.title}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      isSelected
                        ? 'bg-emerald-100 text-[#0B6B4B] border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700'
                        : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}
                  >
                    {item.inkBadge}
                  </span>
                </div>
                <div className="text-[10px] text-gray-400 font-mono mb-1">
                  {item.englishTitle}
                </div>
                <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-snug">
                  {item.description}
                </p>

                {/* Authentic Mini Mock Preview showing real styling rules */}
                <div className="mt-3 p-2 bg-white dark:bg-gray-900/60 rounded-lg border border-gray-200 dark:border-gray-700 text-[9px] space-y-1">
                  {item.id === 'government' && (
                    <div className="border border-[#0B6B4B] rounded-sm p-1.5 bg-white">
                      <div className="bg-[#0B6B4B] text-white px-1 py-0.5 text-[8px] font-bold rounded-xs flex justify-between">
                        <span>शासकीय प्रारूप</span>
                        <span>सत्र: 2026-27</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1 text-[8px]">
                        <div className="bg-[#F9FAFB] p-0.5 border border-gray-200">पंक्ति 1 (जेब्रा)</div>
                        <div className="bg-white p-0.5 border border-gray-200">पंक्ति 2 (सामान्य)</div>
                      </div>
                    </div>
                  )}
                  {item.id === 'ink-saver' && (
                    <div className="border border-gray-400 rounded-sm p-1.5 bg-white">
                      <div className="border-b border-gray-400 text-gray-800 px-1 py-0.5 text-[8px] font-semibold flex justify-between bg-transparent">
                        <span>मितव्ययी प्रारूप</span>
                        <span>0% स्याही भराव</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1 text-[8px]">
                        <div className="bg-white p-0.5 border border-gray-200">पंक्ति 1 (सफेद)</div>
                        <div className="bg-white p-0.5 border border-gray-200">पंक्ति 2 (सफेद)</div>
                      </div>
                    </div>
                  )}
                  {item.id === 'high-contrast' && (
                    <div className="border-2 border-black rounded-sm p-1 bg-white">
                      <div className="bg-black text-white px-1 py-0.5 text-[8px] font-black flex justify-between">
                        <span>उच्च कंट्रास्ट (बोल्ड)</span>
                        <span>फोटोकॉपी रेडी</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 mt-1 text-[8px] font-bold text-black">
                        <div className="border border-black p-0.5 bg-white">पंक्ति 1 (बोल्ड)</div>
                        <div className="border border-black p-0.5 bg-white">पंक्ति 2 (बोल्ड)</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700/60 flex items-center justify-between text-[11px]">
                {isSelected ? (
                  <span className="text-[#0B6B4B] dark:text-emerald-400 font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    ✓ सक्रिय प्रारूप
                  </span>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 font-medium">
                    चुनने हेतु क्लिक करें
                  </span>
                )}
                <span className="text-[10px] font-mono text-gray-400">
                  {item.id}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

