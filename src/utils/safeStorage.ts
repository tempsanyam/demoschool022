/**
 * Robust, quota-resilient storage utility for JSK School Management System.
 * Prevents DOMException QuotaExceededError crashes across all browsers and iframes.
 */

/**
 * Checks if an error is a Storage QuotaExceededError
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  const e = err as any;
  return (
    e.name === 'QuotaExceededError' ||
    e.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    e.code === 22 ||
    e.code === 1014 ||
    e.number === -2147024882 ||
    (typeof e.message === 'string' &&
      (e.message.toLowerCase().includes('quota') ||
        e.message.toLowerCase().includes('exceeded')))
  );
}

/**
 * Safely reads a string from localStorage
 */
export function safeGetItem(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return localStorage.getItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to read key "${key}":`, err);
    return null;
  }
}

/**
 * Safely reads and parses JSON from localStorage
 */
export function safeGetJSON<T>(key: string, fallback: T): T {
  try {
    const raw = safeGetItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[SafeStorage] Failed to parse JSON for key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safely removes a key from localStorage
 */
export function safeRemoveItem(key: string): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[SafeStorage] Failed to remove key "${key}":`, err);
  }
}

/**
 * Prunes auxiliary / volatile data from localStorage when storage quota is tight.
 * STRICT DATA LOSS PROTECTION: Pruning only targets volatile cache keys:
 * (jsk_audit_logs, jsk_upload_history, jsk_notifications, jsk_pre_migration_backup_snapshot).
 * Master entity collections (schools, students, staff, attendance, mdm, work, complaints, etc.)
 * are NEVER pruned or purged.
 * FIRESTORE AUDIT HISTORY IS 100% UNTOUCHED — No Firestore deletions or resets are ever performed.
 */
export function pruneAuxiliaryStorage(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  console.warn('[SafeStorage] Storage quota reached. Pruning volatile cache to prevent quota exhaustion...');

  // 1. Prune audit logs to latest 30 items (max cap is 50 in normal operation)
  try {
    const auditRaw = localStorage.getItem('jsk_audit_logs');
    if (auditRaw) {
      const logs = JSON.parse(auditRaw);
      if (Array.isArray(logs) && logs.length > 30) {
        localStorage.setItem('jsk_audit_logs', JSON.stringify(logs.slice(0, 30)));
        console.info('[SafeStorage] Pruned local jsk_audit_logs to 30 items.');
      }
    }
  } catch {
    // If setting even 30 fails, try 10
    try {
      const auditRaw = localStorage.getItem('jsk_audit_logs');
      if (auditRaw) {
        const logs = JSON.parse(auditRaw);
        if (Array.isArray(logs)) {
          localStorage.setItem('jsk_audit_logs', JSON.stringify(logs.slice(0, 10)));
          console.info('[SafeStorage] Emergency pruned local jsk_audit_logs to 10 items.');
        }
      }
    } catch {
      // Ignored
    }
  }

  // 2. Prune upload history to latest 10 items
  try {
    const uploadRaw = localStorage.getItem('jsk_upload_history');
    if (uploadRaw) {
      const history = JSON.parse(uploadRaw);
      if (Array.isArray(history) && history.length > 10) {
        localStorage.setItem('jsk_upload_history', JSON.stringify(history.slice(0, 10)));
        console.info('[SafeStorage] Pruned local jsk_upload_history to 10 items.');
      }
    }
  } catch {
    // Ignored
  }

  // 3. Prune notifications to latest 15 items
  try {
    const notifRaw = localStorage.getItem('jsk_notifications');
    if (notifRaw) {
      const notifs = JSON.parse(notifRaw);
      if (Array.isArray(notifs) && notifs.length > 15) {
        localStorage.setItem('jsk_notifications', JSON.stringify(notifs.slice(0, 15)));
        console.info('[SafeStorage] Pruned local jsk_notifications to 15 items.');
      }
    }
  } catch {
    // Ignored
  }

  // 4. Clean up huge pre-migration snapshot dumps
  try {
    const backupRaw = localStorage.getItem('jsk_pre_migration_backup_snapshot');
    if (backupRaw && backupRaw.length > 20000) {
      try {
        const parsed = JSON.parse(backupRaw);
        const slim = {
          timestamp: parsed.timestamp,
          reason: parsed.reason,
          recordCounts: parsed.recordCounts,
        };
        localStorage.setItem('jsk_pre_migration_backup_snapshot', JSON.stringify(slim));
        console.info('[SafeStorage] Compacted local jsk_pre_migration_backup_snapshot.');
      } catch {
        localStorage.removeItem('jsk_pre_migration_backup_snapshot');
      }
    }
  } catch {
    // Ignored
  }
}

/**
 * Safely sets a raw string in localStorage with automatic trimming and pruning on QuotaExceeded
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) return false;

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (!isQuotaExceededError(err)) {
      console.warn(`[SafeStorage] Non-quota error saving "${key}":`, err);
      return false;
    }

    // Handle QuotaExceeded
    console.warn(`[SafeStorage] Quota exceeded while saving "${key}". Initiating recovery...`);

    // If key is an array that we can trim down
    if (key === 'jsk_audit_logs') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          for (const limit of [50, 25, 10, 5]) {
            try {
              localStorage.setItem(key, JSON.stringify(parsed.slice(0, limit)));
              console.info(`[SafeStorage] Successfully saved trimmed audit logs (count: ${limit}).`);
              return true;
            } catch {
              continue;
            }
          }
        }
      } catch {
        // Not valid json array, continue
      }
    }

    // For any key: prune auxiliary storage and retry
    pruneAuxiliaryStorage();

    try {
      localStorage.setItem(key, value);
      console.info(`[SafeStorage] Saved "${key}" after pruning auxiliary storage.`);
      return true;
    } catch (secondErr) {
      // If key is audit logs and still failing, keep bare minimum
      if (key === 'jsk_audit_logs') {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            localStorage.setItem(key, JSON.stringify(parsed.slice(0, 5)));
            return true;
          }
        } catch {
          // Ignored
        }
      }

      console.warn(
        `[SafeStorage] Storage quota fully exhausted. Data for "${key}" kept in memory only.`
      );
      return false;
    }
  }
}

/**
 * Safely stores JSON data in localStorage with intelligent size caps
 */
export function safeSetJSON<T>(key: string, data: T, maxArrayItems?: number): boolean {
  try {
    let payload = data;
    if (Array.isArray(data)) {
      let cap = maxArrayItems;
      if (!cap) {
        if (key === 'jsk_audit_logs') cap = 50; // Hard boundary: strictly <= 50 in localStorage
        else if (key === 'jsk_upload_history') cap = 20; // Hard boundary: strictly <= 20 in localStorage
        else if (key === 'jsk_notifications') cap = 30; // Hard boundary: strictly <= 30 in localStorage
      }
      if (cap && data.length > cap) {
        payload = data.slice(0, cap) as any;
      }
    }
    const serialized = JSON.stringify(payload);
    return safeSetItem(key, serialized);
  } catch (err) {
    console.warn(`[SafeStorage] Serialization failed for key "${key}":`, err);
    return false;
  }
}
