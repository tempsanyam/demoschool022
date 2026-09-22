import React from 'react';
import { UserRole } from './index';
import { ExportDataPayload } from '../utils/exportUtils';

export type ReportCategory =
  | 'CONSOLIDATED'
  | 'SCHOOL'
  | 'STUDENT'
  | 'STAFF'
  | 'ATTENDANCE'
  | 'MDM'
  | 'FACILITIES'
  | 'GOVT_WORK'
  | 'COMPLAINTS'
  | 'ULLAS'
  | 'RASOIYA'
  | 'SHG'
  | 'COMPLETENESS'
  | 'ANALYTICS'
  | 'SESSION_COMPARE';

export type ReportScope = 'FULL' | 'SINGLE' | 'DUAL';

export interface ReportFilterState {
  sessionId: string;
  schoolUdise: string;
  dateFrom: string;
  dateTo: string;
  classLevel: string;
  status: string;
  category: string;
  searchQuery: string;
  scope: ReportScope;
  singleEntityId: string;
}

export interface MetricCardData {
  id: string;
  label: string;
  value: string | number;
  subtext?: string;
  iconName?: string;
  color?: string;
  targetReportId?: string;
  targetFilter?: Partial<ReportFilterState>;
}

export interface ReportColumn {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  format?: (val: any, row?: any) => string | React.ReactNode;
}

export interface ReportCalculationResult {
  title: string;
  subtitle: string;
  summaryMetrics: { label: string; value: string | number }[];
  headers: string[];
  rows: (string | number)[][];
  rawItems: any[];
  secondaryTitle?: string;
  secondaryHeaders?: string[];
  secondaryRows?: (string | number)[][];
  chartData?: {
    type: 'pie' | 'bar' | 'progress';
    title: string;
    items: { label: string; value: number; color?: string }[];
  }[];
  isEmpty: boolean;
  emptyMessage?: string;
}

export interface GovernmentReportDefinition {
  id: string;
  title: string;
  hindiTitle: string;
  category: ReportCategory;
  description: string;
  iconName: string;
  supportedRoles: UserRole[];
  availableScopes: ReportScope[];
  defaultScope: ReportScope;
  availableFilters: {
    school?: boolean;
    dateRange?: boolean;
    classLevel?: boolean;
    status?: boolean;
    category?: boolean;
    search?: boolean;
    singleEntity?: boolean;
  };
  calculate: (params: {
    filters: ReportFilterState;
    currentUserRole: UserRole;
    userAssignedSchoolUdise?: string;
    allData: any;
  }) => ReportCalculationResult;
  getExportPayload: (
    calcResult: ReportCalculationResult,
    filters: ReportFilterState,
    schoolInfo?: { name: string; udise: string }
  ) => ExportDataPayload;
}
