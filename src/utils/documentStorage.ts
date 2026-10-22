/**
 * Utility for persisting, retrieving, validating, and downloading real document binaries
 * in the JSK Digital Archive using IndexedDB with in-memory & localStorage safe fallbacks.
 */
import { enforceRuntimeFeatureAccess } from '../config/featureControlRegistry';

const DB_NAME = 'JSK_Digital_Archive_DB';
const DB_VERSION = 1;
const STORE_NAME = 'document_files';

export interface StoredDocumentBinary {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataUrl: string;
  savedAt: string;
  schoolUdise?: string;
  uploadedByRole?: 'ADMIN' | 'CAC' | 'SCHOOL';
}

function getCurrentRuntimeUserContext(): {
  role?: 'ADMIN' | 'CAC' | 'SCHOOL';
  assignedSchoolUdise?: string;
} {
  if (typeof window === 'undefined') return {};
  try {
    const saved =
      window.localStorage.getItem('jsk_malguwa_current_user') ||
      window.localStorage.getItem('jsk_auth_user');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        role: parsed?.role,
        assignedSchoolUdise: parsed?.assignedSchoolUdise,
      };
    }
  } catch {
    // ignore
  }
  return {};
}

// In-memory cache for ultra-fast access during active session
const memoryCache = new Map<string, StoredDocumentBinary>();

/**
 * Initialize / Open IndexedDB
 */
function openArchiveDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Failed to open document archive database'));
    };
  });
}

/**
 * Convert File to Data URL
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('फाइल डेटा पढ़ने में त्रुटि हुई'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('फाइल पढ़ने में त्रुटि'));
    reader.readAsDataURL(file);
  });
}

/**
 * Format file size into readable string (B, KB, MB)
 */
export function formatDocumentSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 KB';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Supported File Extensions and MIME Types
 */
export const SUPPORTED_EXTENSIONS = [
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'jpg',
  'jpeg',
  'png'
];

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

export interface FileValidationResult {
  isValid: boolean;
  errorMessage?: string;
  extension: string;
  normalizedFileType: 'PDF' | 'EXCEL' | 'WORD' | 'IMAGE' | 'OTHER';
}

/**
 * Validate selected file for type and size
 */
export function validateDocumentFile(file: File): FileValidationResult {
  const nameParts = file.name.split('.');
  const ext = nameParts.length > 1 ? nameParts.pop()!.toLowerCase().trim() : '';

  // 1. Check supported extensions
  if (!ext || !SUPPORTED_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      errorMessage: 'यह फाइल प्रकार समर्थित नहीं है। (केवल PDF, DOC, DOCX, XLS, XLSX, CSV, JPG, PNG फाइलें समर्थित हैं)',
      extension: ext,
      normalizedFileType: 'OTHER',
    };
  }

  // 2. Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      errorMessage: `फाइल का आकार निर्धारित सीमा (25 MB) से अधिक है। आपकी फाइल का आकार: ${formatDocumentSize(file.size)}`,
      extension: ext,
      normalizedFileType: 'OTHER',
    };
  }

  // Determine normalized file type
  let normalizedFileType: 'PDF' | 'EXCEL' | 'WORD' | 'IMAGE' | 'OTHER' = 'OTHER';
  if (ext === 'pdf') {
    normalizedFileType = 'PDF';
  } else if (['xls', 'xlsx', 'csv'].includes(ext)) {
    normalizedFileType = 'EXCEL';
  } else if (['doc', 'docx'].includes(ext)) {
    normalizedFileType = 'WORD';
  } else if (['jpg', 'jpeg', 'png'].includes(ext)) {
    normalizedFileType = 'IMAGE';
  }

  return {
    isValid: true,
    extension: ext,
    normalizedFileType,
  };
}

/**
 * Save file binary to IndexedDB and memory cache
 */
export async function saveDocumentBinary(
  id: string,
  file: File,
  dataUrl?: string,
  schoolUdise?: string
): Promise<StoredDocumentBinary> {
  const userCtx = getCurrentRuntimeUserContext();
  const fcCheck = enforceRuntimeFeatureAccess(
    'module.documents.action.upload',
    userCtx.role,
    'दस्तावेज बाइनरी अपलोड करना (saveDocumentBinary)'
  );
  if (!fcCheck.allowed) {
    throw new Error(fcCheck.message);
  }

  const effectiveUdise =
    userCtx.role === 'SCHOOL'
      ? userCtx.assignedSchoolUdise || 'ALL'
      : schoolUdise || 'ALL';

  if (
    userCtx.role === 'SCHOOL' &&
    schoolUdise &&
    schoolUdise !== 'ALL' &&
    schoolUdise !== userCtx.assignedSchoolUdise
  ) {
    throw new Error(
      `[403 Forbidden] ACCESS_DENIED: विद्यालय उपयोगकर्ता (${userCtx.assignedSchoolUdise}) अन्य विद्यालय (${schoolUdise}) के लिए दस्तावेज़ बाइनरी सहेज नहीं सकता।`
    );
  }

  const resolvedDataUrl = dataUrl || (await readFileAsDataURL(file));
  const record: StoredDocumentBinary = {
    id,
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    dataUrl: resolvedDataUrl,
    savedAt: new Date().toISOString(),
    schoolUdise: effectiveUdise,
    uploadedByRole: userCtx.role,
  };

  // Cache in memory
  memoryCache.set(id, record);

  // Persist in IndexedDB
  try {
    const db = await openArchiveDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Could not save file to IndexedDB, fallback to memory cache:', err);
  }

  return record;
}

/**
 * Retrieve file binary from memory cache or IndexedDB with strict role & UDISE authorization
 */
export async function getDocumentBinary(
  id: string,
  expectedSchoolUdise?: string,
  userRole?: 'ADMIN' | 'CAC' | 'SCHOOL',
  assignedSchoolUdise?: string
): Promise<StoredDocumentBinary | null> {
  const userCtx = getCurrentRuntimeUserContext();
  const effectiveRole = userRole || userCtx.role;
  const effectiveAssignedUdise = assignedSchoolUdise || userCtx.assignedSchoolUdise;

  // Enforce parent module.documents access before returning binary
  const moduleCheck = enforceRuntimeFeatureAccess(
    'module.documents',
    effectiveRole,
    'दस्तावेज बाइनरी एक्सेस (getDocumentBinary)'
  );
  if (!moduleCheck.allowed) {
    throw new Error(moduleCheck.message);
  }

  let record: StoredDocumentBinary | null = null;

  // Check memory cache first
  if (memoryCache.has(id)) {
    record = memoryCache.get(id)!;
  } else {
    // Check IndexedDB
    try {
      const db = await openArchiveDB();
      record = await new Promise<StoredDocumentBinary | null>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
      });

      if (record) {
        memoryCache.set(id, record);
      }
    } catch (err) {
      console.warn('Could not retrieve file from IndexedDB:', err);
    }
  }

  if (!record) return null;

  // Verify UDISE scoping for SCHOOL users on binary access
  const docUdise = record.schoolUdise || expectedSchoolUdise;
  if (
    effectiveRole === 'SCHOOL' &&
    docUdise &&
    docUdise !== 'ALL' &&
    effectiveAssignedUdise &&
    docUdise !== effectiveAssignedUdise
  ) {
    throw new Error(
      `[403 Forbidden] ACCESS_DENIED: विद्यालय (${effectiveAssignedUdise}) को अन्य विद्यालय (${docUdise}) की दस्तावेज़ बाइनरी पढ़ने या डाउनलोड करने की अनुमति नहीं है।`
    );
  }

  return record;
}

/**
 * Delete file binary from IndexedDB and memory cache
 */
export async function deleteDocumentBinary(id: string): Promise<boolean> {
  memoryCache.delete(id);

  try {
    const db = await openArchiveDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    return true;
  } catch (err) {
    console.warn('Could not delete file from IndexedDB:', err);
    return false;
  }
}

/**
 * Wipe all file binaries from IndexedDB and memory cache (for complete clean slate)
 */
export async function clearAllDocumentBinaries(): Promise<boolean> {
  memoryCache.clear();
  try {
    const db = await openArchiveDB();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
    return true;
  } catch (err) {
    console.warn('Could not clear IndexedDB document archive:', err);
    return false;
  }
}

/**
 * Trigger native browser file download from Data URL / Blob
 */
export function downloadFile(
  dataUrl: string,
  fileName: string,
  mimeType?: string,
  userRole?: 'ADMIN' | 'CAC' | 'SCHOOL'
) {
  let role = userRole;
  if (!role && typeof window !== 'undefined') {
    try {
      const saved =
        window.localStorage.getItem('jsk_malguwa_current_user') ||
        window.localStorage.getItem('jsk_user');
      if (saved) role = JSON.parse(saved)?.role;
    } catch {
      // ignore
    }
  }
  const fcCheck = enforceRuntimeFeatureAccess('module.documents.action.download', role, 'दस्तावेज डाउनलोड करना (downloadFile)');
  if (!fcCheck.allowed) {
    throw new Error(fcCheck.message);
  }
  try {
    // Convert data URL to Blob for more reliable download in sandboxed environments
    const arr = dataUrl.split(',');
    const match = arr[0].match(/:(.*?);/);
    const resolvedMime = mimeType || (match ? match[1] : 'application/octet-stream');
    const bstr = atob(arr[1] || '');
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const blob = new Blob([u8arr], { type: resolvedMime });
    const blobUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 100);
  } catch (e) {
    // Fallback direct link click
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
