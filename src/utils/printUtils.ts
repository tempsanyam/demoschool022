/**
 * Centralized Print Utility for Malguwa Educational Management System
 * 
 * Guarantees:
 * 1. Dedicated print container (#print-area) - screen chrome (sidebar, nav, header,
 *    search, action buttons, modals, footer) is 100% excluded from print.
 * 2. Official A4 Government of MP format (Emblem, Institution, DISE code, Academic Session,
 *    Summary Metrics, Data Table with repeating header across pages, Signatures, Footer).
 * 3. Unicode & Devanagari font fidelity (Noto Sans Devanagari, UTF-8 charset).
 * 4. Multi-page pagination safety: repeating thead, page-break-inside avoid on rows and cards.
 * 5. Visual feedback (loading state) before browser print dialog opens.
 */

import { institutionConfig } from '../config/institutionConfig';
import { ExportDataPayload, ExportOptions } from './exportUtils';
import { enforceRuntimeFeatureAccess } from '../config/featureControlRegistry';
import {
  DocumentStyle,
  PrintReportStyle,
  getDocumentStyle,
  toCanonicalDocumentStyle,
  DOCUMENT_STYLES,
} from './documentStyle';

function getCurrentUserRoleForPrint(): 'ADMIN' | 'CAC' | 'SCHOOL' | undefined {
  try {
    const raw = localStorage.getItem('jsk_malguwa_current_user');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.role;
    }
  } catch {
    // ignore
  }
  return undefined;
}

export function resolvePrintFeatureKey(titleOrType?: string): string {
  const t = (titleOrType || '').toLowerCase();
  if (t.includes('डैशबोर्ड') || t.includes('dashboard')) return 'module.dashboard.action.print_summary';
  if (t.includes('विद्यालय') || t.includes('शाला') || t.includes('school')) return 'module.schools.action.print_export';
  if (t.includes('विद्यार्थी') || t.includes('छात्र') || t.includes('student')) return 'module.students.action.print_export';
  if (t.includes('शिक्षक') || t.includes('स्टाफ') || t.includes('staff') || t.includes('teacher')) return 'module.teachers.action.print_export';
  if (t.includes('उपस्थिति') || t.includes('attendance')) return 'module.attendance.action.print_export';
  if (t.includes('सुविधा') || t.includes('facility')) return 'module.facilities.action.print_export';
  if (t.includes('रसोइया') || t.includes('rasoiya') || t.includes('cook')) return 'module.rasoiya.action.print_export';
  if (t.includes('समूह') || t.includes('shg')) return 'module.shg.action.print_export';
  if (t.includes('मध्याह्न') || t.includes('mdm') || t.includes('poshan')) return 'module.mdm.action.print_export';
  if (t.includes('शासकीय कार्य') || t.includes('work')) return 'module.work.action.print_export';
  if (t.includes('शिकायत') || t.includes('complaint')) return 'module.complaints.action.print_export';
  if (t.includes('दस्तावेज') || t.includes('दस्तावेज़') || t.includes('document')) return 'module.documents.action.print_export';
  if (t.includes('असाक्षर') || t.includes('शिक्षार्थी') || t.includes('learner') || t.includes('illiterate')) return 'module.literacy-learners.action.print_export';
  if (t.includes('अक्षर साथी') || t.includes('स्वयंसेवक') || t.includes('volunteer') || t.includes('akshar')) return 'module.literacy-volunteers.action.print_export';
  if (t.includes('परीक्षा') || t.includes('flnat') || t.includes('exam')) return 'module.literacy-exams.action.print_export';
  if (t.includes('सहयोगी संस्था') || t.includes('partner') || t.includes('institution')) return 'module.literacy-partners.action.print_export';
  if (t.includes('साक्षरता पंजी') || t.includes('सर्वे') || t.includes('literacy-register')) return 'module.literacy-register.action.print_export';
  if (t.includes('साक्षरता समेकित') || t.includes('literacy-report')) return 'module.literacy-reports.action.print_export';
  if (t.includes('साक्षरता') || t.includes('literacy')) return 'module.literacy.action.print_export';
  if (t.includes('यूज़र') || t.includes('उपयोगकर्ता') || t.includes('user')) return 'module.users.action.export';
  if (t.includes('ऑडिट') || t.includes('audit')) return 'module.audit.action.export';
  if (t.includes('प्रोफाइल') || t.includes('प्रोफ़ाइल') || t.includes('profile')) return 'module.profile.action.print_export';
  if (t.includes('आधिकारिक') || t.includes('official-print')) return 'module.export.action.official_print';
  if (t.includes('कस्टम एक्सपोर्ट') || t.includes('export-center')) return 'module.export.action.csv_excel';
  return 'module.reports.action.print_export';
}

export interface PrintDocumentOptions extends ExportOptions {
  orientation?: 'portrait' | 'landscape';
  reportStyle?: DocumentStyle | PrintReportStyle;
  documentStyle?: DocumentStyle | PrintReportStyle;
  watermarkText?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export interface PrintElementOptions {
  orientation?: 'portrait' | 'landscape';
  title?: string;
  reportStyle?: DocumentStyle | PrintReportStyle;
  documentStyle?: DocumentStyle | PrintReportStyle;
  onAfterPrint?: () => void;
}

const PRINT_CONTAINER_ID = 'print-area';
const DYNAMIC_STYLE_ID = 'print-dynamic-page-style';

/**
 * Ensures the dedicated #print-area DOM element exists under document.body
 */
function getOrCreatePrintContainer(): HTMLElement {
  let container = document.getElementById(PRINT_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = PRINT_CONTAINER_ID;
    container.className = 'print-area-container unicode-safe';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Injects dynamic @page CSS rule for orientation and margins
 */
function setPrintOrientationStyle(orientation: 'portrait' | 'landscape'): void {
  let styleEl = document.getElementById(DYNAMIC_STYLE_ID) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = DYNAMIC_STYLE_ID;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `
    @page {
      size: A4 ${orientation};
      margin: 8mm 8mm 10mm 8mm;
    }
  `;
}

/**
 * Cleans up temporary print styling and DOM nodes
 */
function cleanupPrintState(onAfter?: () => void): void {
  document.body.classList.remove(
    'print-active-isolated',
    'print-landscape',
    'print-style-professional',
    'print-style-minimalist',
    'print-style-high-contrast',
    'document-style-government',
    'document-style-ink-saver',
    'document-style-high-contrast'
  );
  
  const container = document.getElementById(PRINT_CONTAINER_ID);
  if (container) {
    container.innerHTML = '';
  }

  const styleEl = document.getElementById(DYNAMIC_STYLE_ID);
  if (styleEl && styleEl.parentNode) {
    styleEl.parentNode.removeChild(styleEl);
  }

  if (onAfter) {
    try {
      onAfter();
    } catch (e) {
      console.error('Error in onAfterPrint callback:', e);
    }
  }
}

/**
 * Generates an official, publication-quality A4 Government report template HTML string
 */
export function generateOfficialReportHtml(
  payload: ExportDataPayload,
  options: PrintDocumentOptions = {}
): string {
  const {
    title,
    subtitle,
    session,
    schoolName,
    udise,
    summaryMetrics,
    headers,
    rows,
    generatedBy,
    date,
  } = payload;

  const currentSession = session || institutionConfig.academicSession;
  const printDate = date || new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const printTime = new Date().toLocaleTimeString('hi-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const includeHeader = options.includeHeader ?? true;
  const includeSchoolIdentity = options.includeSchoolIdentity ?? true;
  const includeSignature = options.includeSignature ?? true;
  const includeFooter = options.includeFooter ?? true;

  const canonicalStyle = toCanonicalDocumentStyle(
    options.documentStyle || options.reportStyle || getDocumentStyle()
  );

  const themeConfig = {
    government: {
      primary: '#0B6B4B',
      primaryDark: '#08553B',
      primaryLight: '#EAF6F0',
      headerBg: '#0B6B4B',
      headerText: '#ffffff',
      headerBorder: '#08553B',
      rowAlt: '#F9FAFB',
      cellBorder: '#D1D5DB',
      outerBorder: '2px solid #0B6B4B',
      badgeBg: '#EAF6F0',
      badgeText: '#0B6B4B',
      badgeBorder: '#B2E0CD',
      cellPadding: '6px 8px',
      fontSize: '8.5pt',
      fontWeight: 'normal',
      headingWeight: '700',
    },
    'ink-saver': {
      primary: '#111827',
      primaryDark: '#374151',
      primaryLight: '#ffffff',
      headerBg: '#ffffff',
      headerText: '#111827',
      headerBorder: '#4B5563',
      rowAlt: '#ffffff', // 0% background fill - pure white for ink economy!
      cellBorder: '#9CA3AF',
      outerBorder: '1px solid #6B7280',
      badgeBg: '#ffffff',
      badgeText: '#111827',
      badgeBorder: '#9CA3AF',
      cellPadding: '3.5px 5px',
      fontSize: '8pt',
      fontWeight: 'normal',
      headingWeight: '600',
    },
    'high-contrast': {
      primary: '#000000',
      primaryDark: '#000000',
      primaryLight: '#ffffff',
      headerBg: '#000000',
      headerText: '#ffffff',
      headerBorder: '#000000',
      rowAlt: '#ffffff', // Clean white background for crisp photocopying
      cellBorder: '#000000',
      outerBorder: '3.5px solid #000000',
      badgeBg: '#ffffff',
      badgeText: '#000000',
      badgeBorder: '#000000',
      cellPadding: '6px 8px',
      fontSize: '9pt',
      fontWeight: '600',
      headingWeight: '900',
    },
  }[canonicalStyle];

  // 1. Official Institutional Header
  let headerHtml = '';
  if (includeHeader) {
    headerHtml = `
      <div style="border-bottom: 2.5px solid ${themeConfig.primary}; padding-bottom: 10px; margin-bottom: 12px; display: flex; align-items: flex-start; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 44px; height: 44px; border-radius: 6px; background-color: ${themeConfig.primary}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 22px; font-weight: bold; flex-shrink: 0;">
            🏛️
          </div>
          <div>
            <div style="font-size: 9pt; font-weight: ${themeConfig.headingWeight}; color: ${themeConfig.primary}; text-transform: uppercase; letter-spacing: 0.5px;">
              ${institutionConfig.department || 'स्कूल शिक्षा विभाग • मध्य प्रदेश शासन'}
            </div>
            <div style="font-size: 14pt; font-weight: ${themeConfig.headingWeight}; color: #111827; line-height: 1.2;">
              ${institutionConfig.institutionName} / ${institutionConfig.sankulName}
            </div>
            <div style="font-size: 8.5pt; color: #4B5563; margin-top: 1px;">
              मलगुवां, विकासखंड: <strong>${institutionConfig.block}</strong> • जिला: <strong>${institutionConfig.district}</strong>, ${institutionConfig.state} • शैक्षणिक सत्र: <strong>${currentSession}</strong>
            </div>
          </div>
        </div>

        <div style="text-align: right; min-width: 170px;">
          <div style="display: inline-block; background-color: ${themeConfig.primary}; color: #ffffff; font-size: 8pt; font-weight: 800; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.5px;">
            शासकीय अभिलेख
          </div>
          <div style="font-size: 8pt; color: #6B7280; margin-top: 3px;">
            दिनांक: <strong>${printDate}</strong> ${printTime}
          </div>
          ${udise ? `<div style="font-size: 8pt; font-weight: 700; color: #111827; font-family: monospace;">UDISE: ${udise}</div>` : ''}
        </div>
      </div>
    `;
  }

  // 2. Document Title & Subtitle Card
  let titleCardHtml = `
    <div style="background-color: ${themeConfig.primaryLight}; border: 1px solid ${themeConfig.badgeBorder}; border-left: 4px solid ${themeConfig.primary}; padding: 8px 12px; margin-bottom: 12px; border-radius: 4px; display: flex; align-items: center; justify-content: space-between;">
      <div>
        <div style="font-size: 12pt; font-weight: ${themeConfig.headingWeight}; color: #111827;">
          ${title}
        </div>
        ${subtitle ? `<div style="font-size: 8.5pt; color: #4B5563; margin-top: 2px;">${subtitle}</div>` : ''}
      </div>
      ${schoolName && includeSchoolIdentity ? `
        <div style="text-align: right; background-color: #ffffff; border: 1px solid ${themeConfig.badgeBorder}; padding: 4px 8px; border-radius: 4px;">
          <div style="font-size: 7.5pt; color: #6B7280; font-weight: 600;">संबंधित विद्यालय:</div>
          <div style="font-size: 9pt; font-weight: 800; color: ${themeConfig.primary};">${schoolName}</div>
        </div>
      ` : ''}
    </div>
  `;

  // 3. Summary Metrics Badges
  let metricsHtml = '';
  if (summaryMetrics && summaryMetrics.length > 0) {
    const metricCards = summaryMetrics
      .map(
        (m) => `
        <div style="background-color: ${themeConfig.badgeBg}; border: 1px solid ${themeConfig.badgeBorder}; padding: 6px 10px; border-radius: 4px; min-width: 110px; flex: 1; break-inside: avoid; page-break-inside: avoid;">
          <div style="font-size: 8pt; color: #4B5563; font-weight: 600;">${m.label}</div>
          <div style="font-size: 12pt; font-weight: ${themeConfig.headingWeight}; color: ${themeConfig.badgeText}; margin-top: 2px;">${m.value}</div>
        </div>
      `
      )
      .join('');

    metricsHtml = `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; break-inside: avoid; page-break-inside: avoid;">
        ${metricCards}
      </div>
    `;
  }

  // 4. Data Table with Repeating thead & Safe Row Breaks
  const headCells = headers
    .map(
      (h) => `
      <th style="background-color: ${themeConfig.headerBg}; color: ${themeConfig.headerText}; font-size: ${themeConfig.fontSize}; font-weight: ${themeConfig.headingWeight}; padding: ${themeConfig.cellPadding}; border: 1px solid ${themeConfig.headerBorder}; text-align: left; vertical-align: middle;">
        ${h}
      </th>
    `
    )
    .join('');

  const bodyRows = rows.length === 0
    ? `
      <tr>
        <td colspan="${headers.length || 1}" style="text-align: center; padding: 24px; font-size: 9pt; color: #6B7280; font-style: italic; border: 1px solid ${themeConfig.cellBorder}; background-color: #ffffff;">
          वर्तमान सत्र (${currentSession}) हेतु कोई रिकॉर्ड उपलब्ध नहीं है।
        </td>
      </tr>
    `
    : rows
        .map((row, idx) => {
          const bg = idx % 2 === 0 ? '#ffffff' : themeConfig.rowAlt;
          const cells = (Array.isArray(row) ? row : Object.values(row))
            .map(
              (cell) => `
            <td style="padding: ${themeConfig.cellPadding}; font-size: ${themeConfig.fontSize}; font-weight: ${themeConfig.fontWeight}; border: 1px solid ${themeConfig.cellBorder}; color: #1F2937; vertical-align: middle; word-break: break-word;">
              ${cell === null || cell === undefined || cell === '' ? '-' : String(cell)}
            </td>
          `
            )
            .join('');

          return `<tr style="background-color: ${bg}; break-inside: avoid; page-break-inside: avoid;">${cells}</tr>`;
        })
        .join('');

  const tableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-family: inherit;">
      <thead>
        <tr style="break-inside: avoid; page-break-inside: avoid;">
          ${headCells}
        </tr>
      </thead>
      <tbody>
        ${bodyRows}
      </tbody>
    </table>
  `;

  // 5. Official Verification Signatures Block
  let signatureHtml = '';
  if (includeSignature) {
    signatureHtml = `
      <div style="margin-top: 36px; padding-top: 14px; border-top: 1px dashed #9CA3AF; display: flex; justify-content: space-between; align-items: flex-end; break-inside: avoid; page-break-inside: avoid;">
        <div style="text-align: center; width: 200px;">
          <div style="height: 36px;"></div>
          <div style="border-top: 1px solid #4B5563; padding-top: 4px; font-size: 8.5pt; font-weight: 700; color: #1F2937;">
            हस्ताक्षर संस्था प्रधान / प्रभारी
          </div>
          <div style="font-size: 7.5pt; color: #6B7280;">(पदमुद्रा एवं दिनांक)</div>
        </div>

        <div style="text-align: center; width: 220px;">
          <div style="height: 36px;"></div>
          <div style="border-top: 1px solid #4B5563; padding-top: 4px; font-size: 8.5pt; font-weight: 700; color: #1F2937;">
            हस्ताक्षर जन शिक्षक / संकुल समन्वयक (CAC)
          </div>
          <div style="font-size: 7.5pt; color: #6B7280;">${institutionConfig.institutionName} / ${institutionConfig.sankulName}</div>
        </div>
      </div>
    `;
  }

  // 6. Institutional Footer
  let footerHtml = '';
  if (includeFooter) {
    footerHtml = `
      <div style="margin-top: 18px; border-top: 1px solid #E5E7EB; padding-top: 6px; font-size: 7.5pt; color: #6B7280; display: flex; justify-content: space-between; align-items: center; break-inside: avoid; page-break-inside: avoid;">
        <div>
          प्रणाली जनित शासकीय प्रतिवेदन • ${institutionConfig.institutionName} (${institutionConfig.diseCode})
        </div>
        <div>
          उत्पन्नकर्ता: <strong>${generatedBy || 'अधिकृत उपयोगकर्ता'}</strong> • पृष्ठ प्रमाणीकरण
        </div>
      </div>
    `;
  }

  return `
    <div class="print-document document-style-${canonicalStyle}" style="font-family: 'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Nirmala UI', 'Inter', Arial, sans-serif; color: #111827; background-color: #ffffff; padding: 12px; margin: 0; width: 100%; box-sizing: border-box; line-height: 1.35; border: ${themeConfig.outerBorder}; border-radius: 4px;">
      ${headerHtml}
      ${titleCardHtml}
      ${metricsHtml}
      ${tableHtml}
      ${signatureHtml}
      ${footerHtml}
    </div>
  `;
}

/**
 * Central function to print a structured ExportDataPayload.
 * Builds official government layout, isolates it in #print-area, and invokes browser print dialog.
 */
export async function printReport(
  payload: ExportDataPayload,
  options: PrintDocumentOptions = {}
): Promise<void> {
  const role = (payload.userRole as 'ADMIN' | 'CAC' | 'SCHOOL' | undefined) || getCurrentUserRoleForPrint();
  const featureKey = resolvePrintFeatureKey(payload.reportType || payload.title || payload.fileName);
  const fcCheck = enforceRuntimeFeatureAccess(featureKey, role, `प्रिंट रिपोर्ट (${payload.title || 'Print'})`);
  if (!fcCheck.allowed) {
    throw new Error(`[FEATURE_DISABLED: ${featureKey}] ${fcCheck.message}`);
  }
  if (featureKey === 'module.reports.action.print_export') {
    const directPrintCheck = enforceRuntimeFeatureAccess('module.reports.action.print', role, `सीधा प्रिंट (${payload.title || 'Print'})`);
    if (!directPrintCheck.allowed) {
      throw new Error(`[FEATURE_DISABLED: module.reports.action.print] ${directPrintCheck.message}`);
    }
  }
  const orientation = options.orientation || payload.orientation || (payload.headers.length > 7 ? 'landscape' : 'portrait');
  const canonicalStyle = toCanonicalDocumentStyle(
    options.documentStyle || options.reportStyle || getDocumentStyle()
  );

  if (options.onBeforePrint) {
    options.onBeforePrint();
  }

  // 1. Prepare HTML and mount into dedicated #print-area
  const container = getOrCreatePrintContainer();
  container.className = `print-area-container unicode-safe document-style-${canonicalStyle}`;
  const reportHtml = generateOfficialReportHtml(payload, { ...options, orientation, reportStyle: canonicalStyle, documentStyle: canonicalStyle });
  container.innerHTML = reportHtml;

  // 2. Configure Dynamic Orientation & Print Isolation Class
  setPrintOrientationStyle(orientation);
  document.body.classList.add('print-active-isolated', `document-style-${canonicalStyle}`);
  if (orientation === 'landscape') {
    document.body.classList.add('print-landscape');
  } else {
    document.body.classList.remove('print-landscape');
  }

  // 3. Ensure Focus and wait for font rendering
  try {
    window.focus();
  } catch {
    // ignore focus errors
  }

  await new Promise((resolve) => setTimeout(resolve, 80));

  // 4. Trigger Native Browser Print Dialog
  try {
    window.print();
  } catch (err) {
    console.error('Print Execution Error:', err);
  } finally {
    // 5. Cleanup after print dialog dismisses or completes
    setTimeout(() => {
      cleanupPrintState(options.onAfterPrint);
    }, 2000);
  }
}

/**
 * Central function to print an existing DOM Element (e.g. SmartExportDocument, Dossier preview)
 * Clones the element into #print-area to ensure complete isolation from app chrome.
 */
export async function printElement(
  element: HTMLElement,
  orientationOrOptions: 'portrait' | 'landscape' | PrintElementOptions = 'portrait',
  onAfterPrintCallback?: () => void
): Promise<void> {
  const options: PrintElementOptions = typeof orientationOrOptions === 'string'
    ? { orientation: orientationOrOptions, onAfterPrint: onAfterPrintCallback }
    : { ...orientationOrOptions, onAfterPrint: orientationOrOptions?.onAfterPrint || onAfterPrintCallback };

  const role = getCurrentUserRoleForPrint();
  const featureKey = resolvePrintFeatureKey(options.title || element.id || document.title);
  const fcCheck = enforceRuntimeFeatureAccess(featureKey, role, `प्रिंट दस्तावेज़ (${options.title || 'Print Element'})`);
  if (!fcCheck.allowed) {
    throw new Error(`[FEATURE_DISABLED: ${featureKey}] ${fcCheck.message}`);
  }

  const orientation = options.orientation || 'portrait';
  const canonicalStyle = toCanonicalDocumentStyle(
    options.documentStyle || options.reportStyle || getDocumentStyle()
  );

  const originalTitle = document.title;
  if (options.title) {
    document.title = options.title;
  }

  const container = getOrCreatePrintContainer();
  container.innerHTML = '';
  container.className = `print-area-container unicode-safe document-style-${canonicalStyle}`;

  const clone = element.cloneNode(true) as HTMLElement;
  clone.classList.remove('no-print');
  clone.classList.add(`document-style-${canonicalStyle}`);
  container.appendChild(clone);

  setPrintOrientationStyle(orientation);
  document.body.classList.add('print-active-isolated', `document-style-${canonicalStyle}`);
  if (orientation === 'landscape') {
    document.body.classList.add('print-landscape');
  } else {
    document.body.classList.remove('print-landscape');
  }

  try {
    window.focus();
  } catch {
    // ignore focus errors
  }

  await new Promise((resolve) => setTimeout(resolve, 80));

  try {
    window.print();
  } catch (err) {
    console.error('Element Print Error:', err);
  } finally {
    setTimeout(() => {
      if (options.title) {
        document.title = originalTitle;
      }
      cleanupPrintState(options.onAfterPrint);
    }, 2000);
  }
}

/**
 * Standard trigger to print either a Payload, an Element, or invoke direct print
 */
export async function triggerPrint(
  target?: ExportDataPayload | HTMLElement | (() => ExportDataPayload) | PrintDocumentOptions,
  options?: PrintDocumentOptions
): Promise<void> {
  if (!target) {
    window.print();
    return;
  }

  // If passed an options object without payload (e.g. { orientation: 'landscape' })
  if (
    typeof target === 'object' &&
    !(target instanceof HTMLElement) &&
    !('headers' in target) &&
    !('rows' in target) &&
    !('title' in target)
  ) {
    const opts = target as PrintDocumentOptions;
    const canonicalStyle = toCanonicalDocumentStyle(
      opts.documentStyle || opts.reportStyle || getDocumentStyle()
    );
    if (opts.orientation) {
      setPrintOrientationStyle(opts.orientation);
      if (opts.orientation === 'landscape') {
        document.body.classList.add('print-landscape');
      } else {
        document.body.classList.remove('print-landscape');
      }
    }
    document.body.classList.add('print-active-isolated', `document-style-${canonicalStyle}`);
    window.print();
    if (opts.onAfterPrint) {
      setTimeout(() => {
        cleanupPrintState(opts.onAfterPrint);
      }, 1000);
    } else {
      setTimeout(() => {
        cleanupPrintState();
      }, 1000);
    }
    return;
  }

  if (target instanceof HTMLElement) {
    await printElement(target, options);
    return;
  }

  const payload = (typeof target === 'function' ? target() : target) as ExportDataPayload;
  await printReport(payload, options);
}
