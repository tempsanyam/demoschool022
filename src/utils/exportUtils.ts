import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { institutionConfig } from '../config/institutionConfig';

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
  summaryMetrics?: SummaryMetric[];
  headers: string[];
  rows: (string | number)[][];
  fileName: string;
  additionalSheets?: SheetData[];
  notes?: string;
  options?: ExportOptions;
}

/**
 * Export to CSV with UTF-8 BOM encoding for complete Hindi font compatibility in Excel
 * Does NOT inject HTML print footers, signature blocks or unwanted portal text.
 */
export const exportToCSV = (payload: ExportDataPayload) => {
  const { title, subtitle, schoolName, udise, session, summaryMetrics, headers, rows, fileName, options } = payload;
  const opts = {
    includeHeader: options?.includeHeader ?? true,
    includeSchoolIdentity: options?.includeSchoolIdentity ?? true,
    ...options
  };
  
  let csvContent = '\uFEFF'; // UTF-8 BOM for Microsoft Excel Hindi/Devanagari rendering
  
  // Header Meta Information (Only if includeHeader is enabled)
  if (opts.includeHeader) {
    csvContent += `"${institutionConfig.department || 'स्कूल शिक्षा विभाग, मध्य प्रदेश'}"\n`;
    csvContent += `"${title}"\n`;
    if (subtitle) csvContent += `"${subtitle}"\n`;
    
    if (opts.includeSchoolIdentity) {
      if (schoolName) {
        csvContent += `"विद्यालय: ${schoolName}","UDISE: ${udise || 'N/A'}"\n`;
      } else {
        csvContent += `"संस्था: ${institutionConfig.institutionName}","डाइस कोड: ${institutionConfig.diseCode}"\n`;
      }
    }
    
    csvContent += `"शैक्षणिक सत्र: ${session || institutionConfig.academicSession}","दिनांक: ${new Date().toLocaleDateString('hi-IN')}"\n\n`;
  }

  // Summary Metrics if available
  if (summaryMetrics && summaryMetrics.length > 0) {
    csvContent += `"--- सांख्यिकी सारांश ---"\n`;
    summaryMetrics.forEach((m) => {
      csvContent += `"${m.label}","${m.value}"\n`;
    });
    csvContent += `\n`;
  }

  // Data Column Headers
  csvContent += headers.map((h) => `"${String(h).replace(/"/g, '""')}"`).join(',') + '\n';

  // Data Rows - Clean tabular data only
  rows.forEach((row) => {
    csvContent += row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',') + '\n';
  });

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const cleanFileName = sanitizeFileName(fileName || 'report');
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanFileName}_${getTimestampStr()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export to Excel (.xlsx) with UTF-8 Unicode support, clean headers, auto column widths.
 * Does NOT inject unwanted signatures, artificial footers, or unrequested metadata.
 */
export const exportToExcel = (payload: ExportDataPayload) => {
  const { title, subtitle, schoolName, udise, session, summaryMetrics, headers, rows, fileName, additionalSheets, options } = payload;
  const opts = {
    includeHeader: options?.includeHeader ?? true,
    includeSchoolIdentity: options?.includeSchoolIdentity ?? true,
    ...options
  };

  const wb = XLSX.utils.book_new();

  // Primary Sheet Data Array
  const worksheetData: (string | number)[][] = [];

  if (opts.includeHeader) {
    worksheetData.push([institutionConfig.department || 'स्कूल शिक्षा विभाग, मध्य प्रदेश']);
    worksheetData.push([title]);
    if (subtitle) {
      worksheetData.push([subtitle]);
    }
    if (opts.includeSchoolIdentity) {
      if (schoolName) {
        worksheetData.push([`विद्यालय: ${schoolName} (UDISE: ${udise || 'N/A'})`, `सत्र: ${session || institutionConfig.academicSession}`, `दिनांक: ${new Date().toLocaleDateString('hi-IN')}`]);
      } else {
        worksheetData.push([`संस्था: ${institutionConfig.institutionName} | विकास खंड: ${institutionConfig.block}, जिला: ${institutionConfig.district}`, `सत्र: ${session || institutionConfig.academicSession}`, `दिनांक: ${new Date().toLocaleDateString('hi-IN')}`]);
      }
    }
  }

  // Summary Metrics insertion
  if (summaryMetrics && summaryMetrics.length > 0) {
    worksheetData.push([]);
    worksheetData.push(['--- मुख्य सारांश एवं सांख्यिकी ---']);
    summaryMetrics.forEach((m) => {
      worksheetData.push([m.label, m.value]);
    });
  }

  if (worksheetData.length > 0) {
    worksheetData.push([]); // blank row before table
  }

  worksheetData.push(headers);
  rows.forEach((r) => worksheetData.push(r));

  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // Auto-calculate column widths
  const maxColLengths: number[] = [];
  worksheetData.forEach((row) => {
    row.forEach((cell, colIdx) => {
      const cellLen = cell ? String(cell).length : 0;
      maxColLengths[colIdx] = Math.max(maxColLengths[colIdx] || 10, Math.min(cellLen + 3, 50));
    });
  });
  ws['!cols'] = maxColLengths.map((w) => ({ wch: Math.max(w, 12) }));

  XLSX.utils.book_append_sheet(wb, ws, 'डेटा रिपोर्ट');

  // If Additional Sheets are provided
  if (additionalSheets && additionalSheets.length > 0) {
    additionalSheets.forEach((sheet) => {
      const sheetAOA: (string | number)[][] = [
        [sheet.title || sheet.sheetName],
        [opts.includeSchoolIdentity && schoolName ? `विद्यालय: ${schoolName} | सत्र: ${session || institutionConfig.academicSession}` : `${institutionConfig.institutionName} | सत्र: ${session || institutionConfig.academicSession}`],
        []
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
          subCols[colIdx] = Math.max(subCols[colIdx] || 10, Math.min(len + 3, 45));
        });
      });
      subWS['!cols'] = subCols.map((w) => ({ wch: Math.max(w, 12) }));

      const sanitizedSheetName = sheet.sheetName.replace(/[\\/?*[\]]/g, '').slice(0, 30);
      XLSX.utils.book_append_sheet(wb, subWS, sanitizedSheetName);
    });
  }

  const cleanFileName = sanitizeFileName(fileName || 'report');
  XLSX.writeFile(wb, `${cleanFileName}_${getTimestampStr()}.xlsx`);
};

/**
 * Export Multi-sheet Excel workbook
 */
export const exportMultiSheetExcel = (
  sheetList: { sheetName: string; title?: string; headers: string[]; rows: (string | number)[][] }[],
  fileName: string
) => {
  const wb = XLSX.utils.book_new();
  sheetList.forEach((sheet) => {
    const data = [
      [sheet.title || sheet.sheetName],
      [`${institutionConfig.institutionName} | सत्र: ${institutionConfig.academicSession} | दिनांक: ${new Date().toLocaleDateString('hi-IN')}`],
      [],
      sheet.headers,
      ...sheet.rows
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const colWidths: number[] = [];
    data.forEach((row) => {
      row.forEach((cell, idx) => {
        const len = cell ? String(cell).length : 0;
        colWidths[idx] = Math.max(colWidths[idx] || 10, Math.min(len + 3, 45));
      });
    });
    ws['!cols'] = colWidths.map((w) => ({ wch: Math.max(w, 12) }));
    const cleanSheetName = sheet.sheetName.replace(/[\\/?*[\]]/g, '').slice(0, 30);
    XLSX.utils.book_append_sheet(wb, ws, cleanSheetName);
  });
  const cleanFileName = sanitizeFileName(fileName || 'complete_dossier');
  XLSX.writeFile(wb, `${cleanFileName}_${getTimestampStr()}.xlsx`);
};

/**
 * Trigger Native System Print with temporary orientation adjustment
 */
export const triggerSystemPrint = (orientation: 'portrait' | 'landscape' = 'portrait') => {
  if (orientation === 'landscape') {
    document.body.classList.add('print-landscape');
  } else {
    document.body.classList.remove('print-landscape');
  }

  window.print();

  // Reset after printing
  setTimeout(() => {
    document.body.classList.remove('print-landscape');
  }, 1000);
};

/**
 * Generate 100% Unicode-Safe Devanagari PDF by capturing the rendered DOM container
 * with high-DPI canvas rasterization and slicing into A4 pages cleanly.
 * This guarantees zero broken glyphs, correct conjuncts (संयुक्त अक्षर) and perfect matras.
 */
export const generateUnicodePDFFromElement = async (
  elementIdOrRef: string | HTMLElement,
  fileName: string,
  orientation: 'portrait' | 'landscape' = 'portrait',
  options?: ExportOptions
) => {
  const element = typeof elementIdOrRef === 'string' ? document.getElementById(elementIdOrRef) : elementIdOrRef;
  if (!element) {
    throw new Error('PDF Export: Document element not found.');
  }

  // Create High-DPI Canvas from element
  const canvas = await html2canvas(element, {
    scale: 2, // 2x high resolution for crisp text
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: orientation === 'landscape' ? 1200 : 900,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);

  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const margin = 10;
  const printWidth = pageWidth - margin * 2;
  const printHeight = (canvas.height * printWidth) / canvas.width;

  let heightLeft = printHeight;
  let position = margin;
  let pageNum = 1;

  pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
  heightLeft -= (pageHeight - margin * 2);

  while (heightLeft > 0) {
    position = heightLeft - printHeight + margin;
    pdf.addPage();
    pageNum++;
    pdf.addImage(imgData, 'JPEG', margin, position, printWidth, printHeight);
    heightLeft -= (pageHeight - margin * 2);
  }

  // Optional clean page numbers only if requested
  if (options?.includePageNumber) {
    const totalPages = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
  }

  const cleanFileName = sanitizeFileName(fileName || 'report');
  pdf.save(`${cleanFileName}_${getTimestampStr()}.pdf`);
};

/**
 * Fallback Quick PDF Generation with clean layout and options handling
 */
export const generateQuickPDF = (payload: ExportDataPayload) => {
  const orientation = payload.orientation || (payload.headers.length > 7 ? 'landscape' : 'portrait');
  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = orientation === 'landscape' ? 297 : 210;
  const pageHeight = orientation === 'landscape' ? 210 : 297;
  const margin = 12;
  let y = 16;
  const opts = payload.options;

  if (opts?.includeHeader ?? true) {
    doc.setFontSize(13);
    doc.setTextColor(11, 107, 75);
    doc.text(institutionConfig.department || 'School Education Department, MP', margin, y);
    y += 6;

    doc.setFontSize(11);
    doc.setTextColor(30, 41, 59);
    doc.text(payload.title || institutionConfig.institutionName, margin, y);
    y += 5;

    if (opts?.includeSchoolIdentity ?? true) {
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      if (payload.schoolName) {
        doc.text(`School: ${payload.schoolName} | UDISE: ${payload.udise || 'N/A'} | Session: ${payload.session || institutionConfig.academicSession}`, margin, y);
      } else {
        doc.text(`Scope: All Schools (37) | Cluster: ${institutionConfig.institutionName} | Session: ${payload.session || institutionConfig.academicSession}`, margin, y);
      }
      y += 5;
    }

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Date: ${new Date().toLocaleDateString('en-GB')} | Total Records: ${payload.rows.length}`, margin, y);
    y += 4;

    doc.setDrawColor(11, 107, 75);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  }

  // Summary Metrics block if provided
  if (payload.summaryMetrics && payload.summaryMetrics.length > 0) {
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    const metricsStr = payload.summaryMetrics.map((m) => `${m.label}: ${m.value}`).join('  |  ');
    doc.text(metricsStr, margin, y);
    y += 5;
    doc.line(margin, y, pageWidth - margin, y);
    y += 5;
  }

  // Draw Table Columns
  const maxCols = orientation === 'landscape' ? 10 : 7;
  const displayHeaders = payload.headers.slice(0, maxCols);
  const colWidth = (pageWidth - margin * 2) / displayHeaders.length;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setFillColor(243, 244, 246);
  doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
  doc.setTextColor(15, 23, 42);

  displayHeaders.forEach((h, i) => {
    doc.text(String(h).slice(0, 18), margin + i * colWidth + 2, y);
  });
  y += 5;
  doc.setFont('helvetica', 'normal');

  // Render Rows
  payload.rows.forEach((row) => {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 16;
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(243, 244, 246);
      doc.rect(margin, y - 4, pageWidth - margin * 2, 7, 'F');
      displayHeaders.forEach((h, i) => {
        doc.text(String(h).slice(0, 18), margin + i * colWidth + 2, y);
      });
      y += 6;
      doc.setFont('helvetica', 'normal');
    }

    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    displayHeaders.forEach((_, colIdx) => {
      const val = String(row[colIdx] ?? '');
      doc.text(val.slice(0, 20), margin + colIdx * colWidth + 2, y);
    });

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.line(margin, y + 2, pageWidth - margin, y + 2);
    y += 5.5;
  });

  // Optional clean page number
  if (opts?.includePageNumber) {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    }
  }

  const cleanFileName = sanitizeFileName(payload.fileName || 'report');
  doc.save(`${cleanFileName}_${getTimestampStr()}.pdf`);
};

export function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\u0900-\u097F-]/g, '_').replace(/_+/g, '_');
}

export function getTimestampStr(): string {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}_${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`;
}
