/**
 * Canonical Document Style Configuration and Utilities for Malguwa JSK
 *
 * Supports three canonical print & PDF layouts:
 * 1. 'government'    : मानक शासकीय (Professional Official) - Balanced header, dark green borders, soft zebra table
 * 2. 'ink-saver'     : मितव्ययी / हल्का (Minimalist Ink-Saver) - 0% fill, transparent zebra, thin borders, compact spacing
 * 3. 'high-contrast' : उच्च कंट्रास्ट / बोल्ड (High-Contrast Bold) - Thick black borders, 800 bold headings, clear grid, no zebra
 */

import { safeSetItem } from './safeStorage';

export type DocumentStyle = 'government' | 'ink-saver' | 'high-contrast';

/** Compatibility alias for legacy callers */
export type PrintReportStyle = DocumentStyle | 'PROFESSIONAL' | 'MINIMALIST' | 'HIGH_CONTRAST';

export const DOCUMENT_STYLE_STORAGE_KEY = 'jsk_document_style';

export interface DocumentStyleDefinition {
  id: DocumentStyle;
  label: string;
  englishTitle: string;
  className: string;
  description: string;
  inkBadge: string;
  accentColor: string;
  theme: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    headerBg: string;
    headerText: string;
    outerBorder: string;
    tableBorder: string;
    cellBorder: string;
    headingWeight: string;
    bodyWeight: string;
    rowSpacing: string;
    cellPadding: string;
    zebraBg: string;
    badgeBg: string;
    badgeText: string;
    badgeBorder: string;
  };
}

export const DOCUMENT_STYLES: Record<DocumentStyle, DocumentStyleDefinition> = {
  government: {
    id: 'government',
    label: 'मानक शासकीय',
    englishTitle: 'Professional Official',
    className: 'document-style-government',
    description: 'संतुलित शासकीय हेडर, गहरा हरा बॉर्डर, हल्का जेब्रा बैकग्राउंड व मानक औपचारिक प्रारूप।',
    inkBadge: 'मानक शासकीय',
    accentColor: 'border-[#0B6B4B] text-[#0B6B4B]',
    theme: {
      primary: '#0B6B4B',
      primaryDark: '#08553B',
      primaryLight: '#EAF6F0',
      headerBg: '#0B6B4B',
      headerText: '#FFFFFF',
      outerBorder: '2px solid #0B6B4B',
      tableBorder: '1px solid #08553B',
      cellBorder: '1px solid #D1D5DB',
      headingWeight: '700',
      bodyWeight: '400',
      rowSpacing: '6px',
      cellPadding: '6px 9px',
      zebraBg: '#F9FAFB',
      badgeBg: '#EAF6F0',
      badgeText: '#0B6B4B',
      badgeBorder: '#B2E0CD',
    },
  },
  'ink-saver': {
    id: 'ink-saver',
    label: 'मितव्ययी / हल्का',
    englishTitle: 'Minimalist / Ink-Saver',
    className: 'document-style-ink-saver',
    description: '0% बैकग्राउंड स्याही भराव, पतले बॉर्डर्स व सघन स्पेसिंग — इंक-जेट व ड्राफ्ट प्रिंट हेतु आदर्श।',
    inkBadge: 'इंक-सेवर (0% Fill)',
    accentColor: 'border-blue-600 text-blue-600',
    theme: {
      primary: '#1F2937',
      primaryDark: '#111827',
      primaryLight: 'transparent',
      headerBg: '#FFFFFF',
      headerText: '#111827',
      outerBorder: '1px solid #4B5563',
      tableBorder: '1px solid #6B7280',
      cellBorder: '1px solid #E5E7EB',
      headingWeight: '600',
      bodyWeight: '400',
      rowSpacing: '3px',
      cellPadding: '4px 6px',
      zebraBg: 'transparent',
      badgeBg: 'transparent',
      badgeText: '#374151',
      badgeBorder: '#9CA3AF',
    },
  },
  'high-contrast': {
    id: 'high-contrast',
    label: 'उच्च कंट्रास्ट / बोल्ड',
    englishTitle: 'High-Contrast Bold',
    className: 'document-style-high-contrast',
    description: 'मोटे ब्लैक बॉर्डर्स, 800 बोल्ड हेडिंग्स व स्पष्ट ग्रिड — फोटोकॉपी व फील्ड निरीक्षण हेतु स्पष्ट।',
    inkBadge: 'फोटोकॉपी रेडी (Bold)',
    accentColor: 'border-black text-black',
    theme: {
      primary: '#000000',
      primaryDark: '#000000',
      primaryLight: '#FFFFFF',
      headerBg: '#000000',
      headerText: '#FFFFFF',
      outerBorder: '3px solid #000000',
      tableBorder: '2px solid #000000',
      cellBorder: '1.5px solid #000000',
      headingWeight: '800',
      bodyWeight: '700',
      rowSpacing: '5px',
      cellPadding: '6px 8px',
      zebraBg: 'transparent',
      badgeBg: '#FFFFFF',
      badgeText: '#000000',
      badgeBorder: '#000000',
    },
  },
};

/**
 * Normalizes any incoming style string to a valid canonical DocumentStyle
 */
export function toCanonicalDocumentStyle(style?: string | null): DocumentStyle {
  if (!style) return 'government';
  const normalized = style.trim().toLowerCase().replace(/_/g, '-');
  if (normalized === 'ink-saver' || normalized === 'ink_saver' || normalized === 'minimalist') {
    return 'ink-saver';
  }
  if (normalized === 'high-contrast' || normalized === 'high_contrast') {
    return 'high-contrast';
  }
  if (normalized === 'government' || normalized === 'professional') {
    return 'government';
  }
  return 'government';
}

/**
 * Reads the canonical persisted DocumentStyle from localStorage (default: 'government')
 */
export function getDocumentStyle(): DocumentStyle {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = window.localStorage.getItem(DOCUMENT_STYLE_STORAGE_KEY);
      if (stored) {
        return toCanonicalDocumentStyle(stored);
      }
    }
  } catch (err) {
    console.warn('Could not read document style from localStorage:', err);
  }
  return 'government';
}

/**
 * Persists the selected DocumentStyle to localStorage and dispatches a change event
 */
export function setDocumentStyle(style: DocumentStyle | string): DocumentStyle {
  const canonical = toCanonicalDocumentStyle(style);
  try {
    if (typeof window !== 'undefined') {
      safeSetItem(DOCUMENT_STYLE_STORAGE_KEY, canonical);
      // Dispatch browser event so all components update immediately
      window.dispatchEvent(
        new CustomEvent('jsk-document-style-changed', {
          detail: { style: canonical },
        })
      );
    }
  } catch (err) {
    console.warn('Could not persist document style to localStorage:', err);
  }
  return canonical;
}

/**
 * Returns the theme tokens for a given document style
 */
export function getDocumentTheme(style?: DocumentStyle | string): DocumentStyleDefinition['theme'] {
  const canonical = toCanonicalDocumentStyle(style);
  return DOCUMENT_STYLES[canonical].theme;
}
