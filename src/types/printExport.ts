/**
 * Centralized Print & Download Center Types & Configuration
 * Provides unified schema for Print, Report, PDF, Excel, and CSV actions.
 */

import { ExportDataPayload } from '../utils/exportUtils';

export interface PrintActionItem {
  id: string;
  label: string;
  subtext?: string;
  badge?: string;
  iconType?: 'print' | 'report' | 'form';
  onAction: () => void | Promise<void>;
  disabled?: boolean;
}

export interface DownloadActionItem {
  id: string;
  type: 'PDF' | 'EXCEL';
  label: string;
  subtext?: string;
  fileExtension: '.pdf' | '.xlsx';
  onAction: () => void | Promise<void>;
  disabled?: boolean;
}

export interface PrintExportConfig {
  title: string;
  moduleName?: string;
  session?: string;
  schoolName?: string;
  udise?: string;
  totalRecords?: number;
  filterDescription?: string;
  printActions: PrintActionItem[];
  downloadActions: DownloadActionItem[];
  exportPayload?: ExportDataPayload | (() => ExportDataPayload);
}
