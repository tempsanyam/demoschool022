import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { institutionConfig } from '../config/institutionConfig';
import {
  DocumentStyle,
  PrintReportStyle,
  getDocumentStyle,
  toCanonicalDocumentStyle,
} from './documentStyle';
import { enforceRuntimeFeatureAccess } from '../config/featureControlRegistry';
import { resolvePrintFeatureKey } from './printUtils';

function getCurrentUserRoleForExport(): 'ADMIN' | 'CAC' | 'SCHOOL' | undefined {
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

function assertExportAllowed(payloadOrTitle: ExportDataPayload | string, actionType: 'EXCEL' | 'CSV' | 'PDF' | 'PRINT'): void {
  const role = typeof payloadOrTitle === 'object'
    ? (payloadOrTitle.userRole as 'ADMIN' | 'CAC' | 'SCHOOL' | undefined) || getCurrentUserRoleForExport()
    : getCurrentUserRoleForExport();
  const titleStr = typeof payloadOrTitle === 'object'
    ? (payloadOrTitle.reportType || payloadOrTitle.title || payloadOrTitle.fileName)
    : payloadOrTitle;
  const featureKey = resolvePrintFeatureKey(titleStr);
  const fcCheck = enforceRuntimeFeatureAccess(featureKey, role, `${actionType} एक्सपोर्ट (${titleStr})`);
  if (!fcCheck.allowed) {
    throw new Error(`[FEATURE_DISABLED: ${featureKey}] ${fcCheck.message}`);
  }
  if (featureKey === 'module.reports.action.print_export') {
    const formatKey =
      actionType === 'PDF'
        ? 'module.reports.action.pdf'
        : actionType === 'EXCEL'
        ? 'module.reports.action.excel'
        : actionType === 'CSV'
        ? 'module.reports.action.csv'
        : 'module.reports.action.print';
    const formatCheck = enforceRuntimeFeatureAccess(formatKey, role, `${actionType} प्रतिवेदन डाउनलोड (${titleStr})`);
    if (!formatCheck.allowed) {
      throw new Error(`[FEATURE_DISABLED: ${formatKey}] ${formatCheck.message}`);
    }
  }
}

export interface SummaryMetric {
  label: string;
  value: string | number;
}

export interface SheetData {
  sheetName: string;
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  summaryMetrics?: SummaryMetric[];
}

export interface ExportOptions {
  includeHeader?: boolean;
  includeSchoolIdentity?: boolean;
  includePageNumber?: boolean;
  includeSignature?: boolean;
  includeFooter?: boolean;
}

export interface ExportDataPayload {
  title: string;
  subtitle?: string;
  session?: string;
  schoolName?: string;
  udise?: string;
  generatedBy?: string;
  userRole?: string;
  reportType?: string;
  orientation?: 'portrait' | 'landscape';
  date?: string;
  summaryMetrics?: SummaryMetric[];
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
  additionalSheets?: SheetData[];
  notes?: string;
  options?: ExportOptions;
}

/**
 * Sanitizes file names to ensure reliable cross-platform downloads.
 */
export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, '_').replace(/_+/g, '_');
}

/**
 * Formats current timestamp for filenames
 */
export function getTimestampStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}

// Re-export print functions from printUtils for centralized printing
export { printReport, printElement, triggerPrint } from './printUtils';
export type { PrintDocumentOptions, PrintElementOptions } from './printUtils';

/**
 * Export to Excel (.xlsx) with UTF-8 Unicode support and custom column widths
 */
export const exportToExcel = (payload: ExportDataPayload) => {
  assertExportAllowed(payload, 'EXCEL');
  const { title, subtitle, schoolName, udise, session, summaryMetrics, headers, rows, fileName, additionalSheets, options } = payload;
  const opts = {
    includeHeader: options?.includeHeader ?? true,
    includeSchoolIdentity: options?.includeSchoolIdentity ?? true,
    ...options,
  };

  const wb = XLSX.utils.book_new();
  const worksheetData: (string | number)[][] = [];

  if (opts.includeHeader) {
    worksheetData.push([institutionConfig.department || 'स्कूल शिक्षा विभाग, मध्य प्रदेश शासन']);
    worksheetData.push([title]);
    if (subtitle) {
      worksheetData.push([subtitle]);
    }
    if (opts.includeSchoolIdentity) {
      if (schoolName) {
        worksheetData.push([
          `विद्यालय: ${schoolName} (UDISE: ${udise || 'N/A'})`,
          `विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`,
          `सत्र: ${session || institutionConfig.academicSession}`,
          `दिनांक: ${new Date().toLocaleDateString('hi-IN')}`
        ]);
      } else {
        worksheetData.push([
          `संस्था: ${institutionConfig.institutionName} | विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`,
          `सत्र: ${session || institutionConfig.academicSession}`,
          `दिनांक: ${new Date().toLocaleDateString('hi-IN')}`
        ]);
      }
    }
  }

  if (summaryMetrics && summaryMetrics.length > 0) {
    worksheetData.push([]);
    worksheetData.push(['--- मुख्य सारांश एवं सांख्यिकी ---']);
    summaryMetrics.forEach((m) => {
      worksheetData.push([m.label, m.value]);
    });
  }

  if (worksheetData.length > 0) {
    worksheetData.push([]);
  }

  worksheetData.push(headers);
  if (rows.length === 0) {
    worksheetData.push(['इस शैक्षणिक सत्र में अभी कोई डेटा उपलब्ध नहीं है।']);
  } else {
    rows.forEach((r) => worksheetData.push(r));
  }

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  const maxColLengths: number[] = [];
  worksheetData.forEach((row) => {
    row.forEach((cell, colIdx) => {
      const cellLen = cell ? String(cell).length : 0;
      maxColLengths[colIdx] = Math.max(maxColLengths[colIdx] || 10, Math.min(cellLen + 4, 55));
    });
  });
  ws['!cols'] = maxColLengths.map((w) => ({ wch: Math.max(w, 14) }));

  XLSX.utils.book_append_sheet(wb, ws, 'डेटा रिपोर्ट');

  if (additionalSheets && additionalSheets.length > 0) {
    additionalSheets.forEach((sheet) => {
      const sheetAOA: (string | number)[][] = [
        [sheet.title || sheet.sheetName],
        [opts.includeSchoolIdentity && schoolName ? `विद्यालय: ${schoolName} | सत्र: ${session || institutionConfig.academicSession}` : `${institutionConfig.institutionName} | सत्र: ${session || institutionConfig.academicSession}`],
        [],
      ];

      if (sheet.summaryMetrics && sheet.summaryMetrics.length > 0) {
        sheet.summaryMetrics.forEach((m) => sheetAOA.push([m.label, m.value]));
        sheetAOA.push([]);
      }

      sheetAOA.push(sheet.headers);
      sheet.rows.forEach((r) => sheetAOA.push(r));

      const subWS = XLSX.utils.aoa_to_sheet(sheetAOA);
      const subCols: number[] = [];
      sheetAOA.forEach((row) => {
        row.forEach((cell, colIdx) => {
          const len = cell ? String(cell).length : 0;
          subCols[colIdx] = Math.max(subCols[colIdx] || 10, Math.min(len + 4, 50));
        });
      });
      subWS['!cols'] = subCols.map((w) => ({ wch: Math.max(w, 14) }));

      const sanitizedSheetName = sheet.sheetName.replace(/[\\/?*[\]]/g, '').slice(0, 30);
      XLSX.utils.book_append_sheet(wb, subWS, sanitizedSheetName);
    });
  }

  const cleanFileName = sanitizeFileName(fileName || 'report');
  XLSX.writeFile(wb, `${cleanFileName}_${getTimestampStr()}.xlsx`);
};

/**
 * Export to CSV with UTF-8 BOM encoding for Hindi / Unicode script support
 */
export const exportToCSV = (payload: ExportDataPayload) => {
  assertExportAllowed(payload, 'CSV');
  const { title, subtitle, schoolName, udise, session, summaryMetrics, headers, rows, fileName, options } = payload;
  const opts = {
    includeHeader: options?.includeHeader ?? true,
    includeSchoolIdentity: options?.includeSchoolIdentity ?? true,
    ...options,
  };

  const lines: string[] = [];

  const escapeCSVCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return `"${str}"`;
  };

  if (opts.includeHeader) {
    lines.push(escapeCSVCell(institutionConfig.department || 'स्कूल शिक्षा विभाग, मध्य प्रदेश शासन'));
    lines.push(escapeCSVCell(title));
    if (subtitle) {
      lines.push(escapeCSVCell(subtitle));
    }
    if (opts.includeSchoolIdentity) {
      if (schoolName) {
        lines.push([
          escapeCSVCell(`विद्यालय: ${schoolName} (UDISE: ${udise || 'N/A'})`),
          escapeCSVCell(`विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`),
          escapeCSVCell(`सत्र: ${session || institutionConfig.academicSession}`),
          escapeCSVCell(`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`)
        ].join(','));
      } else {
        lines.push([
          escapeCSVCell(`संस्था: ${institutionConfig.institutionName} | विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`),
          escapeCSVCell(`सत्र: ${session || institutionConfig.academicSession}`),
          escapeCSVCell(`दिनांक: ${new Date().toLocaleDateString('hi-IN')}`)
        ].join(','));
      }
    }
    lines.push('');
  }

  if (summaryMetrics && summaryMetrics.length > 0) {
    lines.push(escapeCSVCell('--- मुख्य सारांश एवं सांख्यिकी ---'));
    summaryMetrics.forEach((m) => {
      lines.push([escapeCSVCell(m.label), escapeCSVCell(m.value)].join(','));
    });
    lines.push('');
  }

  lines.push(headers.map(escapeCSVCell).join(','));

  if (rows.length === 0) {
    lines.push(escapeCSVCell('इस शैक्षणिक सत्र में अभी कोई डेटा उपलब्ध नहीं है।'));
  } else {
    rows.forEach((row) => {
      lines.push(row.map(escapeCSVCell).join(','));
    });
  }

  const csvContent = '\uFEFF' + lines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const cleanFileName = sanitizeFileName(fileName || 'report');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanFileName}_${getTimestampStr()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export Multi-sheet Excel workbook
 */
export const exportMultiSheetExcel = (
  sheetList: { sheetName: string; title?: string; headers: string[]; rows: (string | number)[][] }[],
  fileName: string
) => {
  assertExportAllowed(fileName, 'EXCEL');
  const wb = XLSX.utils.book_new();
  sheetList.forEach((sheet) => {
    const data = [
      [sheet.title || sheet.sheetName],
      [`${institutionConfig.institutionName} | सत्र: ${institutionConfig.academicSession} | दिनांक: ${new Date().toLocaleDateString('hi-IN')}`],
      [],
      sheet.headers,
      ...sheet.rows,
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths: number[] = [];
    data.forEach((row) => {
      row.forEach((cell, idx) => {
        const len = cell ? String(cell).length : 0;
        colWidths[idx] = Math.max(colWidths[idx] || 10, Math.min(len + 4, 50));
      });
    });
    ws['!cols'] = colWidths.map((w) => ({ wch: Math.max(w, 14) }));
    const cleanSheetName = sheet.sheetName.replace(/[\\/?*[\]]/g, '').slice(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
  });
  const cleanFileName = sanitizeFileName(fileName || 'complete_dossier');
  XLSX.writeFile(wb, `${cleanFileName}_${getTimestampStr()}.xlsx`);
};

/**
 * Trigger Native Browser Print Dialog with exact A4 page styles and report style
 */
export const triggerSystemPrint = (
  orientation: 'portrait' | 'landscape' = 'portrait',
  reportStyle?: DocumentStyle | PrintReportStyle
) => {
  const canonicalStyle = toCanonicalDocumentStyle(reportStyle || getDocumentStyle());
  const styleId = 'dynamic-print-orientation-style';
  let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }
  styleEl.innerHTML = `@page { size: A4 ${orientation}; margin: 8mm 8mm 10mm 8mm; }`;

  document.body.classList.remove(
    'print-style-professional',
    'print-style-minimalist',
    'print-style-high-contrast',
    'document-style-government',
    'document-style-ink-saver',
    'document-style-high-contrast'
  );
  document.body.classList.add(
    `document-style-${canonicalStyle}`,
    `print-style-${canonicalStyle}`,
    'print-active'
  );

  if (orientation === 'landscape') {
    document.body.classList.add('print-landscape');
  } else {
    document.body.classList.remove('print-landscape');
  }

  // Ensure window is focused so print works reliably within iframe / tab
  try {
    window.focus();
  } catch {
    // ignore focus errors
  }

  // Allow layout recalculation before triggering print dialog
  setTimeout(() => {
    try {
      window.print();
    } catch (printErr) {
      console.error('Window print error:', printErr);
    }
  }, 100);

  setTimeout(() => {
    document.body.classList.remove(
      'print-active',
      'print-landscape',
      'print-style-professional',
      'print-style-minimalist',
      'print-style-high-contrast',
      'document-style-government',
      'document-style-ink-saver',
      'document-style-high-contrast'
    );
    if (styleEl && styleEl.parentNode) {
      styleEl.parentNode.removeChild(styleEl);
    }
  }, 2500);
};

/**
 * Ensures Google Fonts Devanagari & Latin fonts are ready in the browser
 */
async function ensureBrowserFontsLoaded(): Promise<void> {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      const fontCheck = Promise.allSettled([
        document.fonts.load('400 12px "Noto Sans Devanagari"'),
        document.fonts.load('600 12px "Noto Sans Devanagari"'),
        document.fonts.load('700 12px "Noto Sans Devanagari"'),
        document.fonts.load('400 12px "Noto Serif Devanagari"'),
        document.fonts.load('700 12px "Noto Serif Devanagari"'),
        document.fonts.ready,
      ]);
      // Maximum 1.2s timeout safeguard
      await Promise.race([
        fontCheck,
        new Promise((resolve) => setTimeout(resolve, 1200))
      ]);
    } catch (e) {
      console.warn('Font loading check completed with fallback:', e);
    }
  }
}

/**
 * Reliable Multi-page PDF Generator from an HTML Element using high-DPI canvas
 * and intelligent page-slicing that ensures 100% accurate Hindi Devanagari rendering.
 * Automatically flows across unlimited pages without fixed-height truncations.
 */
export const generateUnicodePDFFromElement = async (
  elementIdOrRef: string | HTMLElement,
  fileName: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  options?: ExportOptions,
  reportStyle?: DocumentStyle | PrintReportStyle
): Promise<void> => {
  assertExportAllowed(fileName, 'PDF');
  const element = typeof elementIdOrRef === 'string' ? document.getElementById(elementIdOrRef) : elementIdOrRef;
  if (!element) {
    const errorMsg = `PDF Export Error: Document element "${elementIdOrRef}" not found in DOM.`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  await ensureBrowserFontsLoaded();

  const canonicalStyle = toCanonicalDocumentStyle(reportStyle || getDocumentStyle());
  const styleClass = `document-style-${canonicalStyle}`;
  const pageWidth = orientation === 'landscape' ? 297 : 210; // mm
  const pageHeight = orientation === 'landscape' ? 210 : 297; // mm
  const marginMm = 8; // mm margin on all sides
  const contentWidthMm = pageWidth - marginMm * 2;
  const contentHeightMm = pageHeight - marginMm * 2;

  // Calculate safe DPI scale based on total content height to avoid browser Canvas Max Texture limits
  const elementScrollHeight = element.scrollHeight || element.offsetHeight || 1000;
  // Standard browser canvas max height is 16,384px; cap total canvas height at 14,000px
  const rawScale = Math.max(1.0, Math.min(1.5, 14000 / Math.max(elementScrollHeight, 1)));
  const calculatedScale = Math.round(rawScale * 10) / 10;
  const targetWindowWidth = orientation === 'landscape' ? 1400 : 1050;

  try {
    const canvas = await html2canvas(element, {
      scale: calculatedScale,
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: targetWindowWidth,
      windowHeight: Math.max(elementScrollHeight + 400, typeof window !== 'undefined' ? window.innerHeight : 1200),
      scrollX: 0,
      scrollY: 0,
      imageTimeout: 15000,
      onclone: (clonedDoc, clonedEl) => {
        // 1. Unconstrain all ancestors of clonedEl in the cloned DOM tree so modals / scroll containers don't clip
        let curr: HTMLElement | null = clonedEl.parentElement;
        while (curr && curr !== clonedDoc.body) {
          curr.style.overflow = 'visible';
          curr.style.maxHeight = 'none';
          curr.style.height = 'auto';
          curr.style.transform = 'none';
          curr.style.position = 'static';
          curr = curr.parentElement;
        }
        if (clonedDoc.body) {
          clonedDoc.body.style.overflow = 'visible';
          clonedDoc.body.style.height = 'auto';
          clonedDoc.body.style.maxHeight = 'none';
          clonedDoc.body.classList.add(styleClass, `print-style-${canonicalStyle}`);
        }

        // 2. Style clonedEl root
        clonedEl.classList.add(styleClass, `print-style-${canonicalStyle}`);
        clonedEl.style.fontFamily =
          "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Nirmala UI', 'Inter', 'Noto Sans', sans-serif";
        clonedEl.style.letterSpacing = 'normal';
        clonedEl.style.setProperty('-webkit-font-smoothing', 'antialiased');
        clonedEl.style.height = 'auto';
        clonedEl.style.minHeight = 'auto';
        clonedEl.style.maxHeight = 'none';
        clonedEl.style.overflow = 'visible';
        clonedEl.style.boxShadow = 'none';
        clonedEl.style.backgroundColor = '#ffffff';
        clonedEl.style.color = '#111827';
        clonedEl.style.width = orientation === 'landscape' ? '1200px' : '900px';
        clonedEl.style.maxWidth = orientation === 'landscape' ? '1200px' : '900px';
        clonedEl.style.transform = 'none';
        clonedEl.style.transformOrigin = 'unset';
        clonedEl.style.position = 'static';
        clonedEl.style.left = '0';
        clonedEl.style.top = '0';
        clonedEl.style.margin = '0 auto';
        clonedEl.style.opacity = '1';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.display = 'block';

        // 3. Unconstrain inner document containers
        const subContainers = clonedEl.querySelectorAll<HTMLElement>(
          '.smart-export-document, .unicode-safe, #printable-school-dossier > div, .max-w-\\[850px\\], .max-w-\\[1150px\\], .max-w-4xl, .max-w-5xl, .max-w-6xl'
        );
        subContainers.forEach((sc) => {
          sc.style.maxWidth = '100%';
          sc.style.width = '100%';
          sc.style.boxShadow = 'none';
        });

        // 4. Ensure all child typography uses clean Devanagari font stack
        const allTextElements = clonedEl.querySelectorAll(
          'table, thead, tbody, tr, th, td, h1, h2, h3, h4, p, span, div, strong, label, input, select'
        );
        allTextElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.fontFamily =
            "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Nirmala UI', 'Inter', 'Noto Sans', sans-serif";
        });
      },
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering produced an empty image.');
    }

    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    // Calculate pixel-to-mm ratio and page slice metrics
    const pxPerMm = canvas.width / contentWidthMm;
    const pageHeightPx = Math.floor(contentHeightMm * pxPerMm);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage('a4', orientation);
      }

      const srcY = page * pageHeightPx;
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - srcY);

      if (sliceHeightPx <= 0) continue;

      // Create high-fidelity sub-canvas for the page slice
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeightPx;
      const pageCtx = pageCanvas.getContext('2d');

      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff';
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pageCtx.drawImage(
          canvas,
          0,
          srcY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );

        const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.92);
        const destHeightMm = sliceHeightPx / pxPerMm;

        pdf.addImage(
          pageImgData,
          'JPEG',
          marginMm,
          marginMm,
          contentWidthMm,
          destHeightMm,
          undefined,
          'FAST'
        );
      }

      // Add page number footer bar
      if (options?.includePageNumber !== false) {
        pdf.setFontSize(8);
        pdf.setTextColor(100, 116, 139);
        pdf.text(
          `पृष्ठ ${page + 1} / ${totalPages} (Page ${page + 1} of ${totalPages})`,
          pageWidth / 2,
          pageHeight - 3.5,
          { align: 'center' }
        );
      }
    }

    const cleanFileName = sanitizeFileName(fileName || 'report');
    const finalPdfName = `${cleanFileName}_${getTimestampStr()}.pdf`;

    // Resilient cross-browser / sandboxed iframe download flow
    try {
      const blob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = blobUrl;
      downloadLink.download = finalPdfName;
      downloadLink.style.display = 'none';
      document.body.appendChild(downloadLink);
      downloadLink.click();
      setTimeout(() => {
        if (downloadLink.parentNode) {
          downloadLink.parentNode.removeChild(downloadLink);
        }
        URL.revokeObjectURL(blobUrl);
      }, 2500);
    } catch (saveErr) {
      console.warn('Direct Blob download fallback to pdf.save():', saveErr);
      pdf.save(finalPdfName);
    }
  } catch (err: any) {
    console.error('PDF Generation Pipeline Error:', err);
    throw err;
  }
};

/**
 * Universal Unicode PDF Export from a Data Payload.
 * Constructs an official, standardized HTML report template in memory,
 * renders it with native Devanagari typography, and exports a high-definition A4 PDF.
 */
export const exportToUnicodePDF = async (
  payload: ExportDataPayload,
  reportStyle?: DocumentStyle | PrintReportStyle
): Promise<void> => {
  assertExportAllowed(payload, 'PDF');
  const canonicalStyle = toCanonicalDocumentStyle(reportStyle || getDocumentStyle());
  const orientation = payload.orientation || (payload.headers.length > 7 ? 'landscape' : 'portrait');
  const opts = {
    includeHeader: payload.options?.includeHeader ?? true,
    includeSchoolIdentity: payload.options?.includeSchoolIdentity ?? true,
    includePageNumber: payload.options?.includePageNumber ?? true,
    includeSignature: payload.options?.includeSignature ?? false,
    includeFooter: payload.options?.includeFooter ?? false,
    ...payload.options,
  };

  // Theme configuration matching the 3 canonical document styles
  const theme = canonicalStyle === 'high-contrast'
    ? {
        outerBorder: '3.5px solid #000000',
        headerBorder: '3px solid #000000',
        headerTitleColor: '#000000',
        deptColor: '#000000',
        ribbonBg: '#FFFFFF',
        ribbonBorder: '2px solid #000000',
        ribbonColor: '#000000',
        metricBg: '#FFFFFF',
        metricBorder: '2px solid #000000',
        metricValColor: '#000000',
        thBg: '#000000',
        thColor: '#FFFFFF',
        thBorder: '2px solid #000000',
        thWeight: '900',
        tdBorder: '1.5px solid #000000',
        tdColor: '#000000',
        tdWeight: '700',
        rowAltBg: '#FFFFFF',
        sigBorder: '1.5px solid #000000',
      }
    : canonicalStyle === 'ink-saver'
    ? {
        outerBorder: '1px solid #6B7280',
        headerBorder: '1px solid #4B5563',
        headerTitleColor: '#111827',
        deptColor: '#374151',
        ribbonBg: '#FFFFFF',
        ribbonBorder: '1px solid #9CA3AF',
        ribbonColor: '#111827',
        metricBg: '#FFFFFF',
        metricBorder: '1px solid #9CA3AF',
        metricValColor: '#111827',
        thBg: '#FFFFFF',
        thColor: '#111827',
        thBorder: '1px solid #9CA3AF; border-bottom: 2px solid #4B5563;',
        thWeight: '600',
        tdBorder: '1px solid #E5E7EB',
        tdColor: '#111827',
        tdWeight: '400',
        rowAltBg: '#FFFFFF',
        sigBorder: '1px solid #4B5563',
      }
    : {
        // canonical 'government'
        outerBorder: '2px solid #0B6B4B',
        headerBorder: '2px solid #0B6B4B',
        headerTitleColor: '#0B6B4B',
        deptColor: '#0B6B4B',
        ribbonBg: '#F3F4F6',
        ribbonBorder: '1px solid #0B6B4B',
        ribbonColor: '#374151',
        metricBg: '#F9FAFB',
        metricBorder: '1px solid #0B6B4B',
        metricValColor: '#0B6B4B',
        thBg: '#0B6B4B',
        thColor: '#FFFFFF',
        thBorder: '1px solid #08553B',
        thWeight: '700',
        tdBorder: '1px solid #D1D5DB',
        tdColor: '#1F2937',
        tdWeight: '500',
        rowAltBg: '#F9FAFB',
        sigBorder: '1px solid #0B6B4B',
      };

  // Create temporary container attached to DOM with low opacity to allow full geometry calculation
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '0';
  container.style.top = '0';
  container.style.width = orientation === 'landscape' ? '1200px' : '900px';
  container.style.backgroundColor = '#ffffff';
  container.style.color = '#17211C';
  container.style.padding = '24px';
  container.style.boxSizing = 'border-box';
  container.style.zIndex = '-99999';
  container.style.opacity = '0.01';
  container.style.pointerEvents = 'none';
  container.style.border = theme.outerBorder;
  container.style.borderRadius = '4px';
  container.style.fontFamily =
    "'Noto Sans Devanagari', 'Noto Serif Devanagari', 'Mangal', 'Nirmala UI', system-ui, sans-serif";
  container.className = `print-report-container unicode-safe document-style-${canonicalStyle} print-style-${canonicalStyle}`;

  // Header
  let headerHtml = '';
  if (opts.includeHeader) {
    const dept = institutionConfig.department || 'स्कूल शिक्षा विभाग, मध्य प्रदेश शासन';
    const sub = payload.subtitle || `जन शिक्षा केंद्र: ${institutionConfig.institutionName} | विकासखंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`;
    
    let schoolIdentityHtml = '';
    if (opts.includeSchoolIdentity) {
      if (payload.schoolName) {
        schoolIdentityHtml = `
          <div style="background-color: ${theme.ribbonBg}; border: ${theme.ribbonBorder}; border-radius: 4px; padding: 6px 12px; margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: ${theme.ribbonColor};">
            <span>विद्यालय: <strong>${payload.schoolName}</strong> (UDISE: ${payload.udise || 'N/A'})</span>
            <span>विकासखंड: ${institutionConfig.block} | जिला: ${institutionConfig.district}</span>
            <span>सत्र: ${payload.session || institutionConfig.academicSession} | दिनांक: ${new Date().toLocaleDateString('hi-IN')}</span>
          </div>
        `;
      } else {
        schoolIdentityHtml = `
          <div style="background-color: ${theme.ribbonBg}; border: ${theme.ribbonBorder}; border-radius: 4px; padding: 6px 12px; margin-top: 10px; display: flex; justify-content: space-between; font-size: 11px; font-weight: 600; color: ${theme.ribbonColor};">
            <span>संस्था: <strong>${institutionConfig.institutionName}</strong> (डाइस: ${institutionConfig.diseCode})</span>
            <span>सत्र: ${payload.session || institutionConfig.academicSession}</span>
            <span>दिनांक: ${new Date().toLocaleDateString('hi-IN')}</span>
          </div>
        `;
      }
    }

    headerHtml = `
      <div style="text-align: center; border-bottom: ${theme.headerBorder}; padding-bottom: 12px; margin-bottom: 14px;">
        <div style="font-size: 12px; font-weight: 700; color: ${theme.deptColor}; letter-spacing: 0.5px;">${dept}</div>
        <div style="font-size: 18px; font-weight: 800; color: ${theme.headerTitleColor}; margin: 3px 0;">${payload.title}</div>
        <div style="font-size: 11px; color: #4B5563;">${sub}</div>
        ${schoolIdentityHtml}
      </div>
    `;
  }

  // Summary Metrics Cards
  let metricsHtml = '';
  if (payload.summaryMetrics && payload.summaryMetrics.length > 0) {
    const cards = payload.summaryMetrics
      .map(
        (m) => `
      <div style="background: ${theme.metricBg}; border: ${theme.metricBorder}; border-radius: 4px; padding: 6px 10px; text-align: center; flex: 1; min-width: 100px;">
        <div style="font-size: 10px; color: #4B5563; font-weight: 600;">${m.label}</div>
        <div style="font-size: 14px; font-weight: 800; color: ${theme.metricValColor}; margin-top: 2px;">${m.value}</div>
      </div>
    `
      )
      .join('');
    metricsHtml = `<div style="display: flex; gap: 8px; margin-bottom: 14px; flex-wrap: wrap;">${cards}</div>`;
  }

  // Data Table
  const tableHeaders = payload.headers
    .map(
      (h) => `
    <th style="background-color: ${theme.thBg}; color: ${theme.thColor}; padding: 7px 9px; font-size: 11px; font-weight: ${theme.thWeight}; border: ${theme.thBorder}; text-align: left; vertical-align: middle;">
      ${h}
    </th>
  `
    )
    .join('');

  const tableBody = payload.rows.length === 0
    ? `<tr><td colspan="${payload.headers.length || 1}" style="padding: 24px 12px; text-align: center; font-size: 12px; color: #6B7280; font-style: italic; border: ${theme.tdBorder}; background-color: #ffffff;">इस शैक्षणिक सत्र में अभी कोई डेटा उपलब्ध नहीं है।</td></tr>`
    : payload.rows
        .map((row, idx) => {
          const bg = idx % 2 === 0 ? '#ffffff' : theme.rowAltBg;
          const cells = row
            .map(
              (cell) => `
            <td style="padding: 6px 9px; font-size: 10.5px; font-weight: ${theme.tdWeight}; border: ${theme.tdBorder}; color: ${theme.tdColor}; vertical-align: middle; word-break: break-word;">
              ${cell === null || cell === undefined || cell === '' ? '-' : String(cell)}
            </td>
          `
            )
            .join('');
          return `<tr style="background-color: ${bg};">${cells}</tr>`;
        })
        .join('');

  const tableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <thead>
        <tr>${tableHeaders}</tr>
      </thead>
      <tbody>
        ${tableBody}
      </tbody>
    </table>
  `;

  // Signatures
  let signaturesHtml = '';
  if (opts.includeSignature) {
    signaturesHtml = `
      <div style="margin-top: 28px; display: flex; justify-content: space-between; padding-top: 14px; border-top: 1px dashed #9CA3AF;">
        <div style="text-align: center; width: 220px;">
          <div style="border-top: ${theme.sigBorder}; padding-top: 5px; font-size: 11px; font-weight: 700; color: #111827;">
            हस्ताक्षर संस्था प्रधान / प्रभारी
          </div>
          <div style="font-size: 10px; color: #6B7280;">(पदमुद्रा एवं दिनांक)</div>
        </div>
        <div style="text-align: center; width: 220px;">
          <div style="border-top: ${theme.sigBorder}; padding-top: 5px; font-size: 11px; font-weight: 700; color: #111827;">
            हस्ताक्षर जन शिक्षक / संकुल समन्वयक (CAC)
          </div>
          <div style="font-size: 10px; color: #6B7280;">${institutionConfig.institutionName} / ${institutionConfig.sankulName}</div>
        </div>
      </div>
    `;
  }

  // Footer
  let footerHtml = '';
  if (opts.includeFooter) {
    footerHtml = `
      <div style="margin-top: 14px; text-align: center; font-size: 9.5px; color: #6B7280; border-top: 1px solid #E5E7EB; padding-top: 6px;">
        ${institutionConfig.department || 'स्कूल शिक्षा विभाग मध्य प्रदेश'} • ${institutionConfig.institutionName} (${institutionConfig.block}, ${institutionConfig.district}) • शैक्षणिक सत्र ${payload.session || institutionConfig.academicSession || '2026-27'}
      </div>
    `;
  }

  container.innerHTML = `
    ${headerHtml}
    ${metricsHtml}
    ${tableHtml}
    ${signaturesHtml}
    ${footerHtml}
  `;

  document.body.appendChild(container);

  // Short layout stabilization tick
  await new Promise((resolve) => setTimeout(resolve, 80));

  try {
    await generateUnicodePDFFromElement(container, payload.fileName, orientation, opts, canonicalStyle);
  } finally {
    if (container.parentNode) {
      document.body.removeChild(container);
    }
  }
};

/**
 * Direct alias for Searchable Vector/Unicode PDF Export
 */
export const generateSearchablePDF = exportToUnicodePDF;

/**
 * Quick PDF Generation aliased to Unicode PDF Export
 */
export const generateQuickPDF = exportToUnicodePDF;

/**
 * Direct Element-to-PDF export alias
 */
export const exportElementToPdf = generateUnicodePDFFromElement;

