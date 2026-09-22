import * as XLSX from 'xlsx';
import { UploadDataType, School, Student, Staff, PhysicalFacility, AttendanceRecord, MDMRecord, Complaint, GovernmentWork, User } from '../../types';
import { DATA_TYPE_CONFIGS, DataTypeConfig } from './uploadConfig';

export interface ParsedRawData {
  fileName: string;
  fileSizeFormatted: string;
  fileType: string;
  headers: string[];
  rawRows: Record<string, any>[];
  totalRawRows: number;
}

export interface ColumnMappingItem {
  fieldKey: string;
  fieldLabelHi: string;
  fieldLabelEn: string;
  required: boolean;
  mappedHeader: string; // empty if not mapped
  confidence: 'HIGH' | 'MEDIUM' | 'NONE';
}

export interface ValidationErrorItem {
  rowNumber: number;
  originalRow: Record<string, any>;
  field: string;
  fieldLabel: string;
  uploadedValue: any;
  errorMessage: string;
  suggestedFix: string;
}

export interface RowComparisonItem {
  rowNumber: number;
  identifier: string;
  title: string;
  isExisting: boolean;
  existingRecord?: Record<string, any>;
  uploadedRecord: Record<string, any>;
  diffFields: { key: string; label: string; oldValue: any; newValue: any }[];
}

export interface ProcessedDataResult {
  dataType: UploadDataType;
  totalRows: number;
  validRows: any[];
  validCount: number;
  newCount: number;
  updateCount: number;
  duplicateCount: number;
  invalidCount: number;
  unauthorizedCount: number;
  errors: ValidationErrorItem[];
  comparisons: RowComparisonItem[];
  targetSchools: string[];
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Parse Excel / CSV File safely
export const parseUploadedFile = async (file: File): Promise<ParsedRawData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('फ़ाइल को पढ़ा नहीं जा सका।');
        }

        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('एक्सेल शीट में कोई डेटा पृष्ठ नहीं मिला।');
        }

        const worksheet = workbook.Sheets[firstSheetName];
        // Parse sheet as JSON array of objects
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: '',
          raw: false,
          blankrows: false
        });

        if (!rawJson || rawJson.length === 0) {
          throw new Error('अपलोड की गई फ़ाइल रिक्त है। कृपया सही एक्सेल या CSV फ़ाइल अपलोड करें।');
        }

        // Get headers from first row keys
        const headers = Object.keys(rawJson[0]).map((h) => h.trim()).filter(Boolean);

        resolve({
          fileName: file.name,
          fileSizeFormatted: formatFileSize(file.size),
          fileType: file.name.endsWith('.csv') ? 'CSV (.csv)' : 'Excel (.xlsx)',
          headers,
          rawRows: rawJson,
          totalRawRows: rawJson.length
        });
      } catch (err: any) {
        reject(new Error(err.message || 'फ़ाइल पार्सिंग में त्रुटि हुई।'));
      }
    };

    reader.onerror = () => reject(new Error('फ़ाइल पढ़ने में विफलता।'));
    reader.readAsBinaryString(file);
  });
};

// Auto-detect entity type from headers if not specified
export const detectDataTypeFromHeaders = (headers: string[]): UploadDataType => {
  const normalizedHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, ''));

  let bestType: UploadDataType = 'STUDENT';
  let maxScore = -1;

  (Object.keys(DATA_TYPE_CONFIGS) as UploadDataType[]).forEach((type) => {
    const config = DATA_TYPE_CONFIGS[type];
    let score = 0;

    config.fields.forEach((f) => {
      const match = normalizedHeaders.some((nh) =>
        f.aliases.some((alias) => nh.includes(alias.toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, ''))) ||
        nh.includes(f.key.toLowerCase())
      );
      if (match) {
        score += f.required ? 3 : 1;
      }
    });

    if (score > maxScore) {
      maxScore = score;
      bestType = type;
    }
  });

  return bestType;
};

// Auto Map Uploaded Columns to Schema
export const generateColumnMappings = (
  headers: string[],
  dataType: UploadDataType
): ColumnMappingItem[] => {
  const config = DATA_TYPE_CONFIGS[dataType];

  return config.fields.map((field) => {
    let matchedHeader = '';
    let confidence: 'HIGH' | 'MEDIUM' | 'NONE' = 'NONE';

    // 1. Exact key match
    const exactMatch = headers.find((h) => Boolean(h && h.toLowerCase().trim() === (field.key || '').toLowerCase().trim()));
    if (exactMatch) {
      matchedHeader = exactMatch;
      confidence = 'HIGH';
    } else {
      // 2. Alias match
      const aliasMatch = headers.find((h) => {
        if (!h) return false;
        const cleanH = (h || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
        return field.aliases.some((a) => {
          const cleanA = (a || '').toLowerCase().replace(/[^a-z0-9\u0900-\u097F]/g, '');
          return cleanH.includes(cleanA) || cleanA.includes(cleanH);
        });
      });

      if (aliasMatch) {
        matchedHeader = aliasMatch;
        confidence = 'MEDIUM';
      }
    }

    return {
      fieldKey: field.key,
      fieldLabelHi: field.labelHi,
      fieldLabelEn: field.labelEn,
      required: field.required,
      mappedHeader: matchedHeader,
      confidence
    };
  });
};

// Helper Normalizers
const normalizeDate = (val: any): string => {
  if (!val) return '';
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Handle DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  return s;
};

const normalizeGender = (val: any): 'बालक' | 'बालिका' | 'अन्य' => {
  const s = String(val).trim().toLowerCase();
  if (s.includes('बालिका') || s.includes('girl') || s.includes('female') || s === 'f' || s.includes('महिला')) {
    return 'बालिका';
  }
  if (s.includes('अन्य') || s.includes('other') || s === 'o') {
    return 'अन्य';
  }
  return 'बालक';
};

const normalizeCategory = (val: any): 'SC' | 'ST' | 'OBC' | 'GENERAL' => {
  const s = String(val).trim().toUpperCase();
  if (s.includes('SC') || s.includes('अ.जा.') || s.includes('अनुसूचित जाति')) return 'SC';
  if (s.includes('ST') || s.includes('अ.ज.जा.') || s.includes('अनुसूचित जनजाति')) return 'ST';
  if (s.includes('OBC') || s.includes('पिछड़ा') || s.includes('अन्य पिछड़ा')) return 'OBC';
  return 'GENERAL';
};

const normalizeBoolean = (val: any): boolean => {
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'yes' || s === 'हाँ' || s === 'हां' || s === 'y';
};

const normalizeFacilityAvailability = (val: any): 'YES' | 'NO' | 'UNKNOWN' => {
  if (val === null || val === undefined || String(val).trim() === '') {
    return 'UNKNOWN';
  }
  const s = String(val).trim().toUpperCase();
  if (s === 'YES' || s === 'Y' || s === 'हाँ' || s === 'हां' || s === '1' || s === 'TRUE' || s === 'उपलब्ध') {
    return 'YES';
  }
  if (s === 'NO' || s === 'N' || s === 'नहीं' || s === '0' || s === 'FALSE' || s === 'अनुपलब्ध') {
    return 'NO';
  }
  return 'UNKNOWN';
};

// Validate and Process Data
export const processAndValidateRows = (
  rawRows: Record<string, any>[],
  dataType: UploadDataType,
  mappings: ColumnMappingItem[],
  existingData: {
    schools: School[];
    students: Student[];
    staff: Staff[];
    facilities: PhysicalFacility[];
    attendance: AttendanceRecord[];
    mdmRecords: MDMRecord[];
    complaints: Complaint[];
    governmentWork: GovernmentWork[];
  },
  currentUser: User | null
): ProcessedDataResult => {
  const config = DATA_TYPE_CONFIGS[dataType];
  const validRows: any[] = [];
  const errors: ValidationErrorItem[] = [];
  const comparisons: RowComparisonItem[] = [];
  const targetSchoolSet = new Set<string>();

  const mappingMap = new Map<string, string>();
  mappings.forEach((m) => {
    if (m.mappedHeader) {
      mappingMap.set(m.fieldKey, m.mappedHeader);
    }
  });

  const validSchoolUdises = new Set(existingData.schools.map((s) => s.udise.trim()));

  // RBAC school isolation
  const isCacOrAdmin = !currentUser || currentUser.role === 'CAC' || currentUser.role === 'ADMIN';
  const assignedSchoolUdise = currentUser?.assignedSchoolUdise?.trim() || '';

  let newCount = 0;
  let updateCount = 0;
  let duplicateCount = 0;
  let unauthorizedCount = 0;

  rawRows.forEach((row, idx) => {
    const rowNum = idx + 2; // Excel row numbering (header = row 1)
    const rowErrors: ValidationErrorItem[] = [];
    const transformed: Record<string, any> = {};

    // 1. Extract and map values
    config.fields.forEach((field) => {
      const headerKey = mappingMap.get(field.key);
      let rawVal = headerKey ? row[headerKey] : row[field.key];
      if (rawVal === undefined || rawVal === null) rawVal = '';

      if (typeof rawVal === 'string') {
        rawVal = rawVal.trim();
      }

      transformed[field.key] = rawVal;
    });

    // 2. Check required fields
    config.fields.forEach((field) => {
      if (field.required) {
        const val = transformed[field.key];
        if (val === undefined || val === null || val === '') {
          rowErrors.push({
            rowNumber: rowNum,
            originalRow: row,
            field: field.key,
            fieldLabel: field.labelHi,
            uploadedValue: 'रिक्त (Empty)',
            errorMessage: `अनिवार्य फ़ील्ड '${field.labelHi}' का मान रिक्त है।`,
            suggestedFix: `पंक्ति संख्या ${rowNum} में ${field.labelHi} का मान्य मान दर्ज करें।`
          });
        }
      }
    });

    // 3. School UDISE validation and Isolation check
    const udiseToCheck = (
      dataType === 'SCHOOL'
        ? transformed.udise
        : dataType === 'TEACHER'
        ? transformed.assignedSchoolUdise
        : transformed.schoolUdise
    )?.trim();

    if (udiseToCheck) {
      // Must be numeric
      if (!/^\d{8,12}$/.test(udiseToCheck)) {
        rowErrors.push({
          rowNumber: rowNum,
          originalRow: row,
          field: 'schoolUdise',
          fieldLabel: 'यू-डायस कोड (UDISE)',
          uploadedValue: udiseToCheck,
          errorMessage: 'यू-डायस कोड अमान्य है (8 से 12 अंकों का संख्यात्मक मान अपेक्षित)।',
          suggestedFix: '11 अंकों का सही शाला यू-डायस कोड प्रविष्ट करें।'
        });
      } else if (dataType !== 'SCHOOL' && !validSchoolUdises.has(udiseToCheck)) {
        rowErrors.push({
          rowNumber: rowNum,
          originalRow: row,
          field: 'schoolUdise',
          fieldLabel: 'यू-डायस कोड (UDISE)',
          uploadedValue: udiseToCheck,
          errorMessage: `यू-डायस कोड (${udiseToCheck}) संकुल मलगुवां के अधिकृत सक्रिय विद्यालयों में नहीं मिला।`,
          suggestedFix: 'पहले विद्यालय मास्टर में यह यू-डायस कोड जोड़ें अथवा सही शाला कोड दर्ज करें।'
        });
      }

      // RBAC check: Principal or Teacher cannot upload for another school
      if (!isCacOrAdmin && assignedSchoolUdise && udiseToCheck !== assignedSchoolUdise) {
        unauthorizedCount++;
        rowErrors.push({
          rowNumber: rowNum,
          originalRow: row,
          field: 'schoolUdise',
          fieldLabel: 'यू-डायस कोड (UDISE)',
          uploadedValue: udiseToCheck,
          errorMessage: `अनधिकृत विद्यालय: आपकी भूमिका (${currentUser?.role}) के अंतर्गत केवल आपकी पदस्थ शाला (${assignedSchoolUdise}) का डेटा अपलोड मान्य है।`,
          suggestedFix: 'केवल अपनी आवंटित शाला का डेटा अपलोड करें।'
        });
      }

      if (udiseToCheck) {
        targetSchoolSet.add(udiseToCheck);
      }
    }

    // 4. Specific Entity Normalizations & Validations
    if (dataType === 'STUDENT') {
      transformed.gender = normalizeGender(transformed.gender);
      transformed.category = normalizeCategory(transformed.category);
      transformed.dob = normalizeDate(transformed.dob);
      transformed.isCwsn = normalizeBoolean(transformed.isCwsn);
      transformed.status = transformed.status ? transformed.status.toUpperCase() : 'ACTIVE';
      if (!['ACTIVE', 'TC_ISSUED', 'DROPOUT'].includes(transformed.status)) {
        transformed.status = 'ACTIVE';
      }

      if (transformed.mobile && !/^\d{10}$/.test(transformed.mobile.replace(/[^0-9]/g, ''))) {
        rowErrors.push({
          rowNumber: rowNum,
          originalRow: row,
          field: 'mobile',
          fieldLabel: 'मोबाइल नंबर',
          uploadedValue: transformed.mobile,
          errorMessage: 'मोबाइल नंबर अमान्य है (10 अंक अपेक्षित)।',
          suggestedFix: '10 अंकों का मान्य भारतीय मोबाइल नंबर दर्ज करें।'
        });
      }
    } else if (dataType === 'TEACHER') {
      transformed.gender = normalizeGender(transformed.gender);
      transformed.category = normalizeCategory(transformed.category);
      transformed.joiningDate = normalizeDate(transformed.joiningDate);
      transformed.dob = normalizeDate(transformed.dob);
      transformed.status = transformed.status ? transformed.status.toUpperCase() : 'ACTIVE';
      if (!['ACTIVE', 'ON_LEAVE', 'TRANSFERRED'].includes(transformed.status)) {
        transformed.status = 'ACTIVE';
      }

      if (transformed.mobile && !/^\d{10}$/.test(transformed.mobile.replace(/[^0-9]/g, ''))) {
        rowErrors.push({
          rowNumber: rowNum,
          originalRow: row,
          field: 'mobile',
          fieldLabel: 'मोबाइल नंबर',
          uploadedValue: transformed.mobile,
          errorMessage: 'मोबाइल नंबर अमान्य है (10 अंक अपेक्षित)।',
          suggestedFix: '10 अंकों का मान्य मोबाइल नंबर दर्ज करें।'
        });
      }
    } else if (dataType === 'FACILITY') {
      transformed.available = normalizeFacilityAvailability(transformed.available);
      transformed.count = Number(transformed.count) || 0;
      transformed.usableCount = Number(transformed.usableCount) || 0;
      transformed.repairRequiredCount = Number(transformed.repairRequiredCount) || 0;
      if (!transformed.facilityKey) {
        transformed.facilityKey = 'facility_' + Date.now().toString().slice(-4);
      }
    } else if (dataType === 'ATTENDANCE') {
      transformed.date = normalizeDate(transformed.date);
      transformed.totalCount = Number(transformed.totalCount) || 0;
      transformed.presentCount = Number(transformed.presentCount) || 0;
      transformed.absentCount = Number(transformed.absentCount) || Math.max(0, transformed.totalCount - transformed.presentCount);
      if (!transformed.type) transformed.type = 'STUDENT';
    } else if (dataType === 'MDM') {
      transformed.date = normalizeDate(transformed.date);
      transformed.eligibleStudents = Number(transformed.eligibleStudents) || 0;
      transformed.presentStudents = Number(transformed.presentStudents) || 0;
      transformed.mealsServed = Number(transformed.mealsServed) || 0;
      transformed.mealsNotServed = Number(transformed.mealsNotServed) || Math.max(0, transformed.eligibleStudents - transformed.mealsServed);
      transformed.cookPresent = normalizeBoolean(transformed.cookPresent);
      transformed.wheatStockKg = Number(transformed.wheatStockKg) || 0;
      transformed.riceStockKg = Number(transformed.riceStockKg) || 0;
    } else if (dataType === 'COMPLAINT') {
      transformed.date = normalizeDate(transformed.date) || new Date().toISOString().split('T')[0];
      if (!transformed.priority) transformed.priority = 'HIGH';
      if (!transformed.status) transformed.status = 'PENDING';
    } else if (dataType === 'WORK') {
      transformed.assignedDate = normalizeDate(transformed.assignedDate) || new Date().toISOString().split('T')[0];
      transformed.dueDate = normalizeDate(transformed.dueDate);
      if (!transformed.priority) transformed.priority = 'HIGH';
      if (!transformed.status) transformed.status = 'IN_PROGRESS';
    }

    // 5. If has errors, push to error list; otherwise check duplicate / update comparison
    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
    } else {
      // Find matching existing record
      let existingRecord: any = null;
      let identifier = '';
      let title = '';

      if (dataType === 'SCHOOL') {
        identifier = transformed.udise;
        title = transformed.name || transformed.hindiName;
        existingRecord = existingData.schools.find((s) => s.udise.trim() === transformed.udise.trim());
      } else if (dataType === 'STUDENT') {
        identifier = transformed.samagraId || transformed.srNumber;
        title = transformed.name;
        existingRecord = existingData.students.find(
          (s) =>
            (transformed.samagraId && s.samagraId === transformed.samagraId) ||
            (transformed.srNumber && s.srNumber === transformed.srNumber && s.schoolUdise === transformed.schoolUdise)
        );
      } else if (dataType === 'TEACHER') {
        identifier = transformed.employeeId;
        title = transformed.name;
        existingRecord = existingData.staff.find((stf) => stf.employeeId === transformed.employeeId);
      } else if (dataType === 'FACILITY') {
        identifier = `${transformed.schoolUdise}_${transformed.facilityKey}`;
        title = transformed.facilityName;
        existingRecord = existingData.facilities.find(
          (f) => f.schoolUdise === transformed.schoolUdise && f.facilityKey === transformed.facilityKey
        );
      } else if (dataType === 'ATTENDANCE') {
        identifier = `${transformed.date}_${transformed.schoolUdise}_${transformed.type}`;
        title = `${transformed.type} Attendance (${transformed.date})`;
        existingRecord = existingData.attendance.find(
          (a) => a.date === transformed.date && a.schoolUdise === transformed.schoolUdise && a.type === transformed.type
        );
      } else if (dataType === 'MDM') {
        identifier = `${transformed.date}_${transformed.schoolUdise}`;
        title = `MDM (${transformed.date})`;
        existingRecord = existingData.mdmRecords.find(
          (m) => m.date === transformed.date && m.schoolUdise === transformed.schoolUdise
        );
      } else if (dataType === 'COMPLAINT') {
        identifier = transformed.complaintId;
        title = transformed.subject;
        if (transformed.complaintId) {
          existingRecord = existingData.complaints.find((c) => c.complaintId === transformed.complaintId);
        }
      } else if (dataType === 'WORK') {
        identifier = transformed.orderNumber;
        title = transformed.workName;
        existingRecord = existingData.governmentWork.find(
          (w) => w.orderNumber === transformed.orderNumber && w.schoolUdise === transformed.schoolUdise
        );
      }

      // Check differences if existing record is found
      if (existingRecord) {
        const diffs: { key: string; label: string; oldValue: any; newValue: any }[] = [];
        config.fields.forEach((f) => {
          const oldV = existingRecord[f.key];
          const newV = transformed[f.key];
          if (newV !== undefined && newV !== '' && String(oldV) !== String(newV)) {
            diffs.push({
              key: f.key,
              label: f.labelHi,
              oldValue: oldV ?? 'रिक्त',
              newValue: newV
            });
          }
        });

        if (diffs.length > 0) {
          updateCount++;
        } else {
          duplicateCount++;
        }

        comparisons.push({
          rowNumber: rowNum,
          identifier,
          title,
          isExisting: true,
          existingRecord,
          uploadedRecord: transformed,
          diffFields: diffs
        });
      } else {
        newCount++;
        comparisons.push({
          rowNumber: rowNum,
          identifier,
          title,
          isExisting: false,
          uploadedRecord: transformed,
          diffFields: []
        });
      }

      validRows.push(transformed);
    }
  });

  return {
    dataType,
    totalRows: rawRows.length,
    validRows,
    validCount: validRows.length,
    newCount,
    updateCount,
    duplicateCount,
    invalidCount: rawRows.length - validRows.length,
    unauthorizedCount,
    errors,
    comparisons,
    targetSchools: Array.from(targetSchoolSet)
  };
};

// Generate and Download Excel/CSV Templates
export const downloadTemplateFile = (dataType: UploadDataType, format: 'xlsx' | 'csv') => {
  const config = DATA_TYPE_CONFIGS[dataType];

  // Header row in Hindi and English
  const headers = config.fields.map((f) => `${f.labelHi} [${f.key}]`);
  const dataRows = config.sampleRows.map((row) => {
    return config.fields.map((f) => row[f.key] ?? '');
  });

  const wsData = [headers, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths
  const colWidths = config.fields.map((f) => ({ wch: Math.max(f.labelHi.length * 2, 20) }));
  ws['!cols'] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, config.titleEn.slice(0, 31));

  const fileName = `${(dataType || 'template').toLowerCase()}_template_baldeogarh.${format}`;
  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  }
};

// Export Error Report
export const downloadErrorReport = (
  errors: ValidationErrorItem[],
  originalFileName: string,
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  if (errors.length === 0) return;

  const headers = [
    'पंक्ति संख्या (Row No)',
    'फ़ील्ड नाम (Field)',
    'अपलोड किया गया मान (Uploaded Value)',
    'त्रुटि का कारण (Error Reason)',
    'सुधार का सुझाव (Suggested Fix)',
    'मूल डेटा स्निपेट (Original Data)'
  ];

  const rows = errors.map((err) => [
    err.rowNumber,
    err.fieldLabel,
    String(err.uploadedValue ?? ''),
    err.errorMessage,
    err.suggestedFix,
    JSON.stringify(err.originalRow)
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws['!cols'] = [{ wch: 10 }, { wch: 25 }, { wch: 25 }, { wch: 45 }, { wch: 45 }, { wch: 40 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Validation_Errors');

  const cleanName = originalFileName.replace(/\.[^/.]+$/, '');
  const outName = `${cleanName}_error_report.${format}`;
  XLSX.writeFile(wb, outName, { bookType: format });
};
