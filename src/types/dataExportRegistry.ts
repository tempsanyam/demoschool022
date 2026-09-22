export type ExportScope = 'SINGLE' | 'DUAL' | 'FULL';

export type ExportFormat = 'PRINT' | 'PDF' | 'EXCEL' | 'CSV';

export type DataCategory =
  | 'ALL'
  | 'DASHBOARD'
  | 'SCHOOL'
  | 'STUDENT'
  | 'STAFF'
  | 'COMMUNITY'
  | 'OPERATIONS'
  | 'GRIEVANCE_WORK'
  | 'DOCUMENTS'
  | 'LITERACY'
  | 'ADMIN'
  | 'DOSSIER'
  | 'SYSTEM';

export type SingleSelectionType =
  | 'SCHOOL'
  | 'STUDENT'
  | 'TEACHER'
  | 'RASOIYA'
  | 'SHG'
  | 'COMPLAINT'
  | 'WORK'
  | 'DOCUMENT'
  | 'LITERACY_REG'
  | 'LITERACY_LEARNER'
  | 'LITERACY_VOLUNTEER'
  | 'LITERACY_RESULT'
  | 'USER'
  | 'AUDIT';

export interface DataExportRegistryItem {
  id: string;
  moduleNumber: string;
  moduleName: string;
  label: string;
  category: DataCategory;
  description: string;
  iconName: string;
  supportedFormats: ExportFormat[];
  supportsSingle: boolean;
  supportsDual: boolean;
  supportsFull: boolean;
  singleLabel?: string;
  dualLabel?: string;
  fullLabel?: string;
  singleSelectionType?: SingleSelectionType;
  supportedFilters: {
    school?: boolean;
    session?: boolean;
    class?: boolean;
    gender?: boolean;
    category?: boolean;
    designation?: boolean;
    status?: boolean;
    attendanceType?: boolean;
    workStatus?: boolean;
    complaintStatus?: boolean;
    examCycle?: boolean;
    documentCategory?: boolean;
  };
  requiredPermission?: 'ALL' | 'ADMIN_ONLY' | 'CAC_OR_ADMIN';
}

export interface KeyValueDetail {
  sectionTitle: string;
  items: Array<{
    label: string;
    value: string | number | null | undefined;
    isHighlight?: boolean;
    isMono?: boolean;
    colSpan?: number;
  }>;
}

export interface CompiledExportData {
  title: string;
  subtitle: string;
  session: string;
  schoolName?: string;
  udise?: string;
  headers: string[];
  rows: (string | number)[][];
  summaryMetrics: Array<{ label: string; value: string | number }>;
  fileName: string;
  scope: ExportScope;
  // If single record detail is provided for rich card view
  singleEntityDetails?: KeyValueDetail[];
  // If dual record detail is provided (e.g. related table)
  dualSectionTitle?: string;
  dualHeaders?: string[];
  dualRows?: (string | number)[][];
  totalRecordsCount: number;
}
