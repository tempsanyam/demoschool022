import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  FEATURE_CONTROL_REGISTRY,
  FeatureControlItemConfig,
  FeatureControlRule,
  FeatureControlStore,
  FeatureControlSchedule,
  FeatureAccessEvaluation,
  ControllableRole,
  ControlTargetScope,
  ROUTE_TO_FEATURE_KEY_MAP,
  createDefaultFeatureControlStore,
  evaluateFeatureAccess,
  getTrustedNowMs,
  syncTrustedServerTime,
  setRuntimeFeatureControlStore,
} from '../config/featureControlRegistry';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';
import { safeGetJSON, safeSetJSON } from '../utils/safeStorage';
import {
  syncFeatureControlStoreToCloud,
  subscribeFeatureControlStoreFromCloud,
} from '../services/cloudDatabaseService';
import { auth } from '../services/firebase';
import { UserRole } from '../types';

const STORAGE_KEY = 'jsk_feature_control_store_v1';

function toTargetRoleAuditLabel(scope: ControlTargetScope): 'CAC_ONLY' | 'SCHOOL_ONLY' | 'BOTH' {
  if (scope === 'CAC') return 'CAC_ONLY';
  if (scope === 'SCHOOL') return 'SCHOOL_ONLY';
  return 'BOTH';
}

function toControlTypeAuditLabel(itemType?: string): 'FEATURE' | 'SUB_OPTION' | 'ACTION' {
  if (itemType === 'SUB_OPTION') return 'SUB_OPTION';
  if (itemType === 'ACTION') return 'ACTION';
  return 'FEATURE';
}

interface FeatureControlContextType {
  store: FeatureControlStore;
  registry: FeatureControlItemConfig[];
  nowMs: number;

  // Query / Evaluation Helpers
  getFeatureEvaluation: (featureKey: string, roleOverride?: UserRole) => FeatureAccessEvaluation;
  isFeatureEnabled: (featureKey: string, roleOverride?: UserRole) => boolean;
  isRouteEnabled: (routeId: string, roleOverride?: UserRole) => FeatureAccessEvaluation;

  // Admin Mutation Helpers
  toggleFeature: (
    featureKey: string,
    targetScope: ControlTargetScope,
    enabled: boolean,
    reason?: string,
    customMessage?: string
  ) => Promise<void>;

  scheduleTemporaryDeactivation: (
    featureKey: string,
    targetScope: ControlTargetScope,
    schedule: {
      startTime?: string | null;
      endTime: string;
      autoReactivate: boolean;
      reason?: string;
      customMessage?: string;
    }
  ) => Promise<void>;

  extendDeactivationDuration: (
    featureKey: string,
    targetScope: ControlTargetScope,
    additionalMinutes: number,
    reason?: string
  ) => Promise<void>;

  reactivateNow: (
    featureKey: string,
    targetScope: ControlTargetScope,
    reason?: string
  ) => Promise<void>;

  toggleModuleCascade: (
    moduleKey: string,
    targetScope: ControlTargetScope,
    enabled: boolean,
    reason?: string
  ) => Promise<void>;

  resetAllControlsToDefault: (reason?: string) => Promise<void>;
}

const FeatureControlContext = createContext<FeatureControlContextType | undefined>(undefined);

function normalizeSchedule(raw?: Partial<FeatureControlSchedule> | null): FeatureControlSchedule {
  const startTime = raw?.startTime || null;
  const endTime = raw?.endTime || null;
  const startTimeMs =
    typeof raw?.startTimeMs === 'number'
      ? raw.startTimeMs
      : startTime
      ? new Date(startTime).getTime()
      : null;
  const endTimeMs =
    typeof raw?.endTimeMs === 'number'
      ? raw.endTimeMs
      : endTime
      ? new Date(endTime).getTime()
      : null;
  return {
    enabled: Boolean(raw?.enabled),
    startTime,
    endTime,
    startTimeMs: startTimeMs && !isNaN(startTimeMs) ? startTimeMs : null,
    endTimeMs: endTimeMs && !isNaN(endTimeMs) ? endTimeMs : null,
    autoReactivate: raw?.autoReactivate !== undefined ? Boolean(raw.autoReactivate) : true,
  };
}

function mergeWithDefaultStore(raw: Partial<FeatureControlStore> | null | undefined): FeatureControlStore {
  const def = createDefaultFeatureControlStore();
  if (!raw || typeof raw !== 'object' || !raw.rules) {
    return def;
  }
  const mergedRules: Record<string, FeatureControlRule> = { ...def.rules };
  for (const item of FEATURE_CONTROL_REGISTRY) {
    const incoming = raw.rules[item.key];
    if (incoming && typeof incoming === 'object') {
      mergedRules[item.key] = {
        ...def.rules[item.key],
        ...incoming,
        key: item.key,
        scheduleCac: normalizeSchedule(incoming.scheduleCac),
        scheduleSchool: normalizeSchedule(incoming.scheduleSchool),
      };
    }
  }
  return {
    version: raw.version || 1,
    updatedAt: raw.updatedAt || def.updatedAt,
    updatedBy: raw.updatedBy || def.updatedBy,
    updatedByName: raw.updatedByName || def.updatedByName,
    rules: mergedRules,
  };
}

export const FeatureControlProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { logActivity } = useData();

  const [store, setStore] = useState<FeatureControlStore>(() => {
    const cached = safeGetJSON<FeatureControlStore | null>(STORAGE_KEY, null);
    const initial = mergeWithDefaultStore(cached);
    setRuntimeFeatureControlStore(initial);
    return initial;
  });

  const authoritativeStoreRef = useRef<FeatureControlStore>(store);
  useEffect(() => {
    authoritativeStoreRef.current = store;
    setRuntimeFeatureControlStore(store);
  }, [store]);

  // Live clock tick every 2 seconds + server time anchor + visibilitychange/focus listeners
  const [nowMs, setNowMs] = useState<number>(() => getTrustedNowMs());

  useEffect(() => {
    syncTrustedServerTime().then((trusted) => {
      setNowMs(trusted);
    });

    const interval = setInterval(() => {
      setNowMs(getTrustedNowMs());
    }, 2000);

    const handleVisibilityOrFocus = () => {
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        syncTrustedServerTime().then((trusted) => {
          setNowMs(trusted);
        });
      }
    };

    // Guard against unauthorized localStorage tampering via storage events
    const handleStorageTamper = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        // Restore authoritative in-memory/Firestore state immediately; never let untrusted localStorage override Firestore
        safeSetJSON(STORAGE_KEY, authoritativeStoreRef.current);
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus);
      window.addEventListener('storage', handleStorageTamper);
    }

    return () => {
      clearInterval(interval);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus);
        window.removeEventListener('storage', handleStorageTamper);
      }
    };
  }, []);

  // Subscribe to Firestore `systemSettings/feature_controls` as the single authoritative source of truth
  useEffect(() => {
    const unsub = subscribeFeatureControlStoreFromCloud(
      (cloudStore) => {
        const merged = mergeWithDefaultStore(cloudStore);
        authoritativeStoreRef.current = merged;
        setRuntimeFeatureControlStore(merged);
        setStore(merged);
        safeSetJSON(STORAGE_KEY, merged);
        setNowMs(getTrustedNowMs());
      },
      (err) => {
        console.warn('[FeatureControl] Firestore subscription fallback to local cache:', err);
      }
    );
    return () => unsub();
  }, [currentUser?.id]);

  const persistStore = useCallback(
    async (nextStore: FeatureControlStore) => {
      authoritativeStoreRef.current = nextStore;
      setRuntimeFeatureControlStore(nextStore);
      setStore(nextStore);
      safeSetJSON(STORAGE_KEY, nextStore);
      await syncFeatureControlStoreToCloud(nextStore);
    },
    []
  );

  const getFeatureEvaluation = useCallback(
    (featureKey: string, roleOverride?: UserRole): FeatureAccessEvaluation => {
      const effectiveRole = roleOverride || currentUser?.role;
      return evaluateFeatureAccess(featureKey, effectiveRole, store, nowMs);
    },
    [currentUser?.role, store, nowMs]
  );

  const isFeatureEnabled = useCallback(
    (featureKey: string, roleOverride?: UserRole): boolean => {
      return getFeatureEvaluation(featureKey, roleOverride).allowed;
    },
    [getFeatureEvaluation]
  );

  const isRouteEnabled = useCallback(
    (routeId: string, roleOverride?: UserRole): FeatureAccessEvaluation => {
      const mapping = ROUTE_TO_FEATURE_KEY_MAP[routeId];
      if (!mapping) {
        return {
          allowed: true,
          isTemporarilyDisabled: false,
          isPermanentlyDisabled: false,
          parentModuleDisabled: false,
        };
      }
      if (mapping.subOptionKey) {
        return getFeatureEvaluation(mapping.subOptionKey, roleOverride);
      }
      return getFeatureEvaluation(mapping.moduleKey, roleOverride);
    },
    [getFeatureEvaluation]
  );

  const toggleFeature = useCallback(
    async (
      featureKey: string,
      targetScope: ControlTargetScope,
      enabled: boolean,
      reason?: string,
      customMessage?: string
    ) => {
      if (currentUser?.role !== 'ADMIN') {
        throw new Error('केवल व्यवस्थापक (ADMIN) ही मॉड्यूल नियंत्रण बदल सकते हैं।');
      }

      const itemConfig = FEATURE_CONTROL_REGISTRY.find((c) => c.key === featureKey);
      const existingRule = store.rules[featureKey] || createDefaultFeatureControlStore().rules[featureKey];
      const nowIso = new Date(getTrustedNowMs()).toISOString();
      const adminUid = auth.currentUser?.uid || currentUser.id;

      const clearedSchedule: FeatureControlSchedule = {
        enabled: false,
        startTime: null,
        endTime: null,
        startTimeMs: null,
        endTimeMs: null,
        autoReactivate: true,
      };

      const nextRule: FeatureControlRule = {
        ...existingRule,
        cacEnabled:
          targetScope === 'CAC' || targetScope === 'BOTH' ? enabled : existingRule.cacEnabled,
        schoolEnabled:
          targetScope === 'SCHOOL' || targetScope === 'BOTH' ? enabled : existingRule.schoolEnabled,
        scheduleCac:
          targetScope === 'CAC' || targetScope === 'BOTH'
            ? clearedSchedule
            : existingRule.scheduleCac,
        scheduleSchool:
          targetScope === 'SCHOOL' || targetScope === 'BOTH'
            ? clearedSchedule
            : existingRule.scheduleSchool,
        reason: reason !== undefined ? reason : existingRule.reason,
        customMessage: customMessage !== undefined ? customMessage : existingRule.customMessage,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        updatedAt: nowIso,
      };

      const nextStore: FeatureControlStore = {
        ...store,
        updatedAt: nowIso,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        rules: {
          ...store.rules,
          [featureKey]: nextRule,
        },
      };

      await persistStore(nextStore);

      const targetRoleLabel = toTargetRoleAuditLabel(targetScope);
      const controlTypeLabel = toControlTypeAuditLabel(itemConfig?.itemType);

      logActivity(
        enabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
        'मॉड्यूल एवं विकल्प नियंत्रण (Feature Control)',
        `${itemConfig?.labelHi || featureKey} (${controlTypeLabel}) को [${targetRoleLabel}] के लिए ${enabled ? 'सक्रिय (ON)' : 'निष्क्रिय (OFF)'} किया गया। ${reason ? `कारण: ${reason}` : ''}`,
        {
          recordId: featureKey,
          recordName: itemConfig?.labelHi || featureKey,
          featureKey,
          controlType: controlTypeLabel,
          targetRole: targetRoleLabel,
          startTime: null,
          endTime: null,
          adminUid,
          oldValue: JSON.stringify({
            cacEnabled: existingRule.cacEnabled,
            schoolEnabled: existingRule.schoolEnabled,
          }),
          newValue: JSON.stringify({
            cacEnabled: nextRule.cacEnabled,
            schoolEnabled: nextRule.schoolEnabled,
          }),
          reason: reason || (enabled ? 'प्रशासनिक सक्रियण' : 'प्रशासनिक रोक'),
        }
      );
    },
    [currentUser, store, persistStore, logActivity]
  );

  const scheduleTemporaryDeactivation = useCallback(
    async (
      featureKey: string,
      targetScope: ControlTargetScope,
      scheduleInput: {
        startTime?: string | null;
        endTime: string;
        autoReactivate: boolean;
        reason?: string;
        customMessage?: string;
      }
    ) => {
      if (currentUser?.role !== 'ADMIN') {
        throw new Error('केवल व्यवस्थापक (ADMIN) ही समय-आधारित नियंत्रण सेट कर सकते हैं।');
      }

      const itemConfig = FEATURE_CONTROL_REGISTRY.find((c) => c.key === featureKey);
      const existingRule = store.rules[featureKey] || createDefaultFeatureControlStore().rules[featureKey];
      const trustedNow = getTrustedNowMs();
      const nowIso = new Date(trustedNow).toISOString();
      const adminUid = auth.currentUser?.uid || currentUser.id;

      const startIso = scheduleInput.startTime || nowIso;
      const startMs = new Date(startIso).getTime();
      const endMs = new Date(scheduleInput.endTime).getTime();

      const newSchedule: FeatureControlSchedule = {
        enabled: true,
        startTime: startIso,
        endTime: scheduleInput.endTime,
        startTimeMs: !isNaN(startMs) ? startMs : trustedNow,
        endTimeMs: !isNaN(endMs) ? endMs : trustedNow + 30 * 60 * 1000,
        autoReactivate: scheduleInput.autoReactivate,
      };

      const nextRule: FeatureControlRule = {
        ...existingRule,
        // Ensure baseEnabled matches autoReactivate so when timer expires it resumes automatically if autoReactivate is true
        cacEnabled:
          targetScope === 'CAC' || targetScope === 'BOTH'
            ? scheduleInput.autoReactivate
            : existingRule.cacEnabled,
        schoolEnabled:
          targetScope === 'SCHOOL' || targetScope === 'BOTH'
            ? scheduleInput.autoReactivate
            : existingRule.schoolEnabled,
        scheduleCac:
          targetScope === 'CAC' || targetScope === 'BOTH'
            ? newSchedule
            : existingRule.scheduleCac,
        scheduleSchool:
          targetScope === 'SCHOOL' || targetScope === 'BOTH'
            ? newSchedule
            : existingRule.scheduleSchool,
        reason: scheduleInput.reason || 'निर्धारित समय तक अस्थायी रूप से बंद',
        customMessage: scheduleInput.customMessage || '',
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        updatedAt: nowIso,
      };

      const nextStore: FeatureControlStore = {
        ...store,
        updatedAt: nowIso,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        rules: {
          ...store.rules,
          [featureKey]: nextRule,
        },
      };

      await persistStore(nextStore);
      setNowMs(getTrustedNowMs());

      const targetRoleLabel = toTargetRoleAuditLabel(targetScope);
      const controlTypeLabel = toControlTypeAuditLabel(itemConfig?.itemType);
      const formattedEnd = new Date(scheduleInput.endTime).toLocaleString('hi-IN');

      logActivity(
        'FEATURE_SCHEDULED_DEACTIVATION',
        'मॉड्यूल एवं विकल्प नियंत्रण (Feature Control)',
        `${itemConfig?.labelHi || featureKey} (${controlTypeLabel}) को [${targetRoleLabel}] के लिए ${formattedEnd} तक अस्थायी रूप से निष्क्रिय (Scheduled Deactivation) किया गया। ${scheduleInput.reason ? `कारण: ${scheduleInput.reason}` : ''}`,
        {
          recordId: featureKey,
          recordName: itemConfig?.labelHi || featureKey,
          featureKey,
          controlType: controlTypeLabel,
          targetRole: targetRoleLabel,
          startTime: startIso,
          endTime: scheduleInput.endTime,
          adminUid,
          oldValue: JSON.stringify({
            cacEnabled: existingRule.cacEnabled,
            schoolEnabled: existingRule.schoolEnabled,
            scheduleCac: existingRule.scheduleCac,
            scheduleSchool: existingRule.scheduleSchool,
          }),
          newValue: JSON.stringify(newSchedule),
          reason: scheduleInput.reason || 'निर्धारित समय-सीमा रोक',
        }
      );
    },
    [currentUser, store, persistStore, logActivity]
  );

  const extendDeactivationDuration = useCallback(
    async (
      featureKey: string,
      targetScope: ControlTargetScope,
      additionalMinutes: number,
      reason?: string
    ) => {
      if (currentUser?.role !== 'ADMIN') {
        throw new Error('केवल व्यवस्थापक (ADMIN) ही समय-सीमा बढ़ा सकते हैं।');
      }

      const itemConfig = FEATURE_CONTROL_REGISTRY.find((c) => c.key === featureKey);
      const existingRule = store.rules[featureKey] || createDefaultFeatureControlStore().rules[featureKey];
      const trustedNow = getTrustedNowMs();
      const nowIso = new Date(trustedNow).toISOString();
      const adminUid = auth.currentUser?.uid || currentUser.id;
      const addMs = Math.max(1, additionalMinutes) * 60 * 1000;

      const extendSched = (sched?: FeatureControlSchedule): FeatureControlSchedule => {
        const currentEndMs =
          sched?.endTimeMs ||
          (sched?.endTime ? new Date(sched.endTime).getTime() : trustedNow);
        const baseMs = Math.max(trustedNow, isNaN(currentEndMs) ? trustedNow : currentEndMs);
        const nextEndMs = baseMs + addMs;
        const startIso = sched?.startTime || nowIso;
        const startMs = sched?.startTimeMs || new Date(startIso).getTime() || trustedNow;
        return {
          enabled: true,
          startTime: startIso,
          endTime: new Date(nextEndMs).toISOString(),
          startTimeMs: startMs,
          endTimeMs: nextEndMs,
          autoReactivate: sched?.autoReactivate !== undefined ? sched.autoReactivate : true,
        };
      };

      const nextSchedCac =
        targetScope === 'CAC' || targetScope === 'BOTH'
          ? extendSched(existingRule.scheduleCac)
          : existingRule.scheduleCac;
      const nextSchedSchool =
        targetScope === 'SCHOOL' || targetScope === 'BOTH'
          ? extendSched(existingRule.scheduleSchool)
          : existingRule.scheduleSchool;

      const nextRule: FeatureControlRule = {
        ...existingRule,
        scheduleCac: nextSchedCac,
        scheduleSchool: nextSchedSchool,
        reason: reason || existingRule.reason || `अवधि +${additionalMinutes} मिनट बढ़ाई गई`,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        updatedAt: nowIso,
      };

      const nextStore: FeatureControlStore = {
        ...store,
        updatedAt: nowIso,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        rules: {
          ...store.rules,
          [featureKey]: nextRule,
        },
      };

      await persistStore(nextStore);
      setNowMs(getTrustedNowMs());

      const targetRoleLabel = toTargetRoleAuditLabel(targetScope);
      const controlTypeLabel = toControlTypeAuditLabel(itemConfig?.itemType);
      const effectiveSched = targetScope === 'SCHOOL' ? nextSchedSchool : nextSchedCac;

      logActivity(
        'FEATURE_DURATION_EXTENDED',
        'मॉड्यूल एवं विकल्प नियंत्रण (Feature Control)',
        `${itemConfig?.labelHi || featureKey} (${controlTypeLabel}) की निष्क्रियता अवधि [${targetRoleLabel}] के लिए +${additionalMinutes} मिनट बढ़ाई गई।`,
        {
          recordId: featureKey,
          recordName: itemConfig?.labelHi || featureKey,
          featureKey,
          controlType: controlTypeLabel,
          targetRole: targetRoleLabel,
          startTime: effectiveSched?.startTime || nowIso,
          endTime: effectiveSched?.endTime || null,
          adminUid,
          oldValue: JSON.stringify({
            scheduleCac: existingRule.scheduleCac,
            scheduleSchool: existingRule.scheduleSchool,
          }),
          newValue: JSON.stringify({
            scheduleCac: nextSchedCac,
            scheduleSchool: nextSchedSchool,
          }),
          reason: reason || `अवधि +${additionalMinutes} मिनट विस्तारित`,
        }
      );
    },
    [currentUser, store, persistStore, logActivity]
  );

  const reactivateNow = useCallback(
    async (featureKey: string, targetScope: ControlTargetScope, reason?: string) => {
      if (currentUser?.role !== 'ADMIN') {
        throw new Error('केवल व्यवस्थापक (ADMIN) ही सुविधा को पुनः सक्रिय कर सकते हैं।');
      }

      const itemConfig = FEATURE_CONTROL_REGISTRY.find((c) => c.key === featureKey);
      const existingRule = store.rules[featureKey] || createDefaultFeatureControlStore().rules[featureKey];
      const nowIso = new Date(getTrustedNowMs()).toISOString();
      const adminUid = auth.currentUser?.uid || currentUser.id;

      const clearedSchedule: FeatureControlSchedule = {
        enabled: false,
        startTime: null,
        endTime: null,
        startTimeMs: null,
        endTimeMs: null,
        autoReactivate: true,
      };

      const nextRule: FeatureControlRule = {
        ...existingRule,
        cacEnabled:
          targetScope === 'CAC' || targetScope === 'BOTH' ? true : existingRule.cacEnabled,
        schoolEnabled:
          targetScope === 'SCHOOL' || targetScope === 'BOTH' ? true : existingRule.schoolEnabled,
        scheduleCac:
          targetScope === 'CAC' || targetScope === 'BOTH'
            ? clearedSchedule
            : existingRule.scheduleCac,
        scheduleSchool:
          targetScope === 'SCHOOL' || targetScope === 'BOTH'
            ? clearedSchedule
            : existingRule.scheduleSchool,
        reason: '',
        customMessage: '',
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        updatedAt: nowIso,
      };

      const nextStore: FeatureControlStore = {
        ...store,
        updatedAt: nowIso,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        rules: {
          ...store.rules,
          [featureKey]: nextRule,
        },
      };

      await persistStore(nextStore);
      setNowMs(getTrustedNowMs());

      const targetRoleLabel = toTargetRoleAuditLabel(targetScope);
      const controlTypeLabel = toControlTypeAuditLabel(itemConfig?.itemType);

      logActivity(
        'FEATURE_MANUAL_REACTIVATION',
        'मॉड्यूल एवं विकल्प नियंत्रण (Feature Control)',
        `${itemConfig?.labelHi || featureKey} (${controlTypeLabel}) को [${targetRoleLabel}] के लिए तत्काल प्रभाव से पुनः सक्रिय (Reactivate Now) किया गया।`,
        {
          recordId: featureKey,
          recordName: itemConfig?.labelHi || featureKey,
          featureKey,
          controlType: controlTypeLabel,
          targetRole: targetRoleLabel,
          startTime: null,
          endTime: null,
          adminUid,
          oldValue: JSON.stringify({
            cacEnabled: existingRule.cacEnabled,
            schoolEnabled: existingRule.schoolEnabled,
            scheduleCac: existingRule.scheduleCac,
            scheduleSchool: existingRule.scheduleSchool,
          }),
          newValue: JSON.stringify({
            cacEnabled: nextRule.cacEnabled,
            schoolEnabled: nextRule.schoolEnabled,
          }),
          reason: reason || 'व्यवस्थापक द्वारा मैनुअल पुनः सक्रियण',
        }
      );
    },
    [currentUser, store, persistStore, logActivity]
  );

  const toggleModuleCascade = useCallback(
    async (
      moduleKey: string,
      targetScope: ControlTargetScope,
      enabled: boolean,
      reason?: string
    ) => {
      if (currentUser?.role !== 'ADMIN') {
        throw new Error('केवल व्यवस्थापक (ADMIN) ही मॉड्यूल नियंत्रण बदल सकते हैं।');
      }

      const nowIso = new Date(getTrustedNowMs()).toISOString();
      const adminUid = auth.currentUser?.uid || currentUser.id;
      const clearedSchedule: FeatureControlSchedule = {
        enabled: false,
        startTime: null,
        endTime: null,
        startTimeMs: null,
        endTimeMs: null,
        autoReactivate: true,
      };

      const updatedRules = { ...store.rules };
      const affectedItems = FEATURE_CONTROL_REGISTRY.filter((item) => item.moduleKey === moduleKey);
      const existingModRule = store.rules[moduleKey] || createDefaultFeatureControlStore().rules[moduleKey];

      for (const item of affectedItems) {
        const existing = updatedRules[item.key] || createDefaultFeatureControlStore().rules[item.key];
        updatedRules[item.key] = {
          ...existing,
          cacEnabled:
            (targetScope === 'CAC' || targetScope === 'BOTH') && item.cacApplicable
              ? enabled
              : existing.cacEnabled,
          schoolEnabled:
            (targetScope === 'SCHOOL' || targetScope === 'BOTH') && item.schoolApplicable
              ? enabled
              : existing.schoolEnabled,
          scheduleCac:
            targetScope === 'CAC' || targetScope === 'BOTH' ? clearedSchedule : existing.scheduleCac,
          scheduleSchool:
            targetScope === 'SCHOOL' || targetScope === 'BOTH'
              ? clearedSchedule
              : existing.scheduleSchool,
          reason: enabled ? '' : reason || 'मॉड्यूल प्रशासनिक रूप से बंद',
          updatedBy: adminUid,
          updatedByName: currentUser.name,
          updatedAt: nowIso,
        };
      }

      const nextStore: FeatureControlStore = {
        ...store,
        updatedAt: nowIso,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
        rules: updatedRules,
      };

      await persistStore(nextStore);

      const modConfig = FEATURE_CONTROL_REGISTRY.find((c) => c.key === moduleKey);
      const targetRoleLabel = toTargetRoleAuditLabel(targetScope);

      logActivity(
        enabled ? 'FEATURE_ENABLED' : 'FEATURE_DISABLED',
        'मॉड्यूल एवं विकल्प नियंत्रण (Feature Control)',
        `संपूर्ण मॉड्यूल "${modConfig?.labelHi || moduleKey}" एवं उसके समस्त ${affectedItems.length} उप-विकल्पों को [${targetRoleLabel}] हेतु ${enabled ? 'सक्रिय (ON)' : 'निष्क्रिय (OFF)'} किया गया।`,
        {
          recordId: moduleKey,
          recordName: modConfig?.labelHi || moduleKey,
          featureKey: moduleKey,
          controlType: 'FEATURE',
          targetRole: targetRoleLabel,
          startTime: null,
          endTime: null,
          adminUid,
          oldValue: JSON.stringify({
            cacEnabled: existingModRule?.cacEnabled,
            schoolEnabled: existingModRule?.schoolEnabled,
          }),
          newValue: JSON.stringify({
            cacEnabled: updatedRules[moduleKey]?.cacEnabled,
            schoolEnabled: updatedRules[moduleKey]?.schoolEnabled,
            cascadeCount: affectedItems.length,
          }),
          reason: reason || (enabled ? 'संपूर्ण मॉड्यूल सक्रिय' : 'संपूर्ण मॉड्यूल निष्क्रिय'),
        }
      );
    },
    [currentUser, store, persistStore, logActivity]
  );

  const resetAllControlsToDefault = useCallback(
    async (reason?: string) => {
      if (currentUser?.role !== 'ADMIN') {
        throw new Error('केवल व्यवस्थापक (ADMIN) ही समस्त नियंत्रण रीसेट कर सकते हैं।');
      }

      const def = createDefaultFeatureControlStore();
      const nowIso = new Date(getTrustedNowMs()).toISOString();
      const adminUid = auth.currentUser?.uid || currentUser.id;
      const nextStore: FeatureControlStore = {
        ...def,
        updatedAt: nowIso,
        updatedBy: adminUid,
        updatedByName: currentUser.name,
      };

      await persistStore(nextStore);
      setNowMs(getTrustedNowMs());

      logActivity(
        'FEATURE_BULK_RESET',
        'मॉड्यूल एवं विकल्प नियंत्रण (Feature Control)',
        `समस्त 129 मॉड्यूल एवं विकल्प नियंत्रणों को डिफ़ॉल्ट स्थिति (Default Active State) में रीसेट किया गया।`,
        {
          recordId: 'ALL_129_CONTROLS',
          recordName: 'समस्त मॉड्यूल एवं विकल्प नियंत्रण',
          featureKey: 'ALL_129_CONTROLS',
          controlType: 'FEATURE',
          targetRole: 'BOTH',
          startTime: null,
          endTime: null,
          adminUid,
          oldValue: 'CUSTOM_RULES',
          newValue: 'DEFAULT_ACTIVE_129',
          reason: reason || 'समस्त मॉड्यूल डिफ़ॉल्ट रीसेट',
        }
      );
    },
    [currentUser, persistStore, logActivity]
  );

  const value = useMemo<FeatureControlContextType>(
    () => ({
      store,
      registry: FEATURE_CONTROL_REGISTRY,
      nowMs,
      getFeatureEvaluation,
      isFeatureEnabled,
      isRouteEnabled,
      toggleFeature,
      scheduleTemporaryDeactivation,
      extendDeactivationDuration,
      reactivateNow,
      toggleModuleCascade,
      resetAllControlsToDefault,
    }),
    [
      store,
      nowMs,
      getFeatureEvaluation,
      isFeatureEnabled,
      isRouteEnabled,
      toggleFeature,
      scheduleTemporaryDeactivation,
      extendDeactivationDuration,
      reactivateNow,
      toggleModuleCascade,
      resetAllControlsToDefault,
    ]
  );

  return (
    <FeatureControlContext.Provider value={value}>
      {children}
    </FeatureControlContext.Provider>
  );
};

export const useFeatureControl = (): FeatureControlContextType => {
  const ctx = useContext(FeatureControlContext);
  if (!ctx) {
    throw new Error('useFeatureControl must be used within a FeatureControlProvider');
  }
  return ctx;
};

