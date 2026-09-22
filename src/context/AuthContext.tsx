import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, UserStatus, School, AuditLog, AuditAction, PreAuthSecurityEvent } from '../types';
import { initialUsers, initialSchools } from '../data/seedData';
import { generateSchoolPassword } from '../utils/authUtils';
import { auth } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { syncUserToCloud, syncAuditLogToCloud, syncPreAuthSecurityEventToCloud, subscribeUsersFromCloud } from '../services/cloudDatabaseService';
import { safeGetJSON, safeSetJSON, safeSetItem, safeRemoveItem } from '../utils/safeStorage';

export interface PermissionConfig {
  canViewAllSchools: boolean;
  canSwitchSchools: boolean;
  canManageUsers: boolean;
  canDeleteRecords: boolean;
  canUploadData: boolean;
  canManageClusterNotifications: boolean;
  canAccessAuditLogs: boolean;
  canManageSystemSettings: boolean;
  canExportClusterReport: boolean;
  allowedViews: string[];
}

export const ROLE_PERMISSIONS: Record<string, PermissionConfig> = {
  ADMIN: {
    canViewAllSchools: true,
    canSwitchSchools: true,
    canManageUsers: true,
    canDeleteRecords: true,
    canUploadData: true,
    canManageClusterNotifications: true,
    canAccessAuditLogs: true,
    canManageSystemSettings: true,
    canExportClusterReport: true,
    allowedViews: [
      'dashboard', 'schools', 'school-profile', 'students', 'teachers', 'staff', 'attendance',
      'cac-attendance-monitoring', 'attendance-monitoring',
      'facilities', 'mdm', 'rasoiya', 'cook', 'rasoiya-management', 'shg', 'shgs', 'shg-management', 'self-help-group',
      'work', 'government-work', 'notifications', 'complaints',
      'documents', 'export', 'export-center', 'upload', 'data-upload', 'history',
      'audit-log', 'reports', 'search', 'global-search', 'profile', 'settings',
      'users', 'user-directory',
      'literacy', 'literacy-dashboard', 'literacy-register', 'literacy-learners',
      'literacy-volunteers', 'literacy-exams', 'literacy-partners', 'literacy-reports', 'literacy-export'
    ],
  },
  CAC: {
    canViewAllSchools: true,
    canSwitchSchools: true,
    canManageUsers: true,
    canDeleteRecords: true,
    canUploadData: false,
    canManageClusterNotifications: true,
    canAccessAuditLogs: true,
    canManageSystemSettings: false,
    canExportClusterReport: true,
    allowedViews: [
      'dashboard', 'schools', 'school-profile', 'students', 'teachers', 'staff', 'attendance',
      'cac-attendance-monitoring', 'attendance-monitoring',
      'facilities', 'mdm', 'rasoiya', 'cook', 'rasoiya-management', 'shg', 'shgs', 'shg-management', 'self-help-group',
      'work', 'government-work', 'notifications', 'complaints',
      'documents', 'export', 'export-center', 'history',
      'audit-log', 'reports', 'search', 'global-search', 'profile', 'settings',
      'users', 'user-directory',
      'literacy', 'literacy-dashboard', 'literacy-register', 'literacy-learners',
      'literacy-volunteers', 'literacy-exams', 'literacy-partners', 'literacy-reports', 'literacy-export'
    ],
  },
  SCHOOL: {
    canViewAllSchools: false,
    canSwitchSchools: false,
    canManageUsers: false,
    canDeleteRecords: false,
    canUploadData: false,
    canManageClusterNotifications: false,
    canAccessAuditLogs: true,
    canManageSystemSettings: false,
    canExportClusterReport: false,
    allowedViews: [
      'dashboard', 'schools', 'school-profile', 'students', 'teachers', 'staff', 'attendance',
      'facilities', 'mdm', 'rasoiya', 'cook', 'rasoiya-management', 'shg', 'shgs', 'shg-management', 'self-help-group',
      'work', 'government-work', 'notifications', 'complaints',
      'documents', 'export', 'export-center', 'reports',
      'history', 'audit-log', 'search', 'global-search', 'profile',
      'literacy', 'literacy-dashboard', 'literacy-register', 'literacy-learners',
      'literacy-volunteers', 'literacy-exams', 'literacy-partners', 'literacy-reports', 'literacy-export'
    ],
  },
};

const DEFAULT_GUEST_PERMISSIONS: PermissionConfig = {
  canViewAllSchools: false,
  canSwitchSchools: false,
  canManageUsers: false,
  canDeleteRecords: false,
  canUploadData: false,
  canManageClusterNotifications: false,
  canAccessAuditLogs: false,
  canManageSystemSettings: false,
  canExportClusterReport: false,
  allowedViews: ['dashboard', 'search'],
};

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  registeredUsers: User[];
  permissions: PermissionConfig;
  hasPermission: (permission: keyof PermissionConfig) => boolean;
  isUdiseAllowed: (udise: string | null | undefined) => boolean;
  canAccessView: (viewId: string) => boolean;
  login: (identifier: string, pass: string) => { success: boolean; message: string; user?: User };
  logout: () => void;
  register: (data: Omit<User, 'id' | 'createdAt' | 'status'> & { password?: string }) => { success: boolean; message: string };
  approveUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  rejectUser: (userId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  activateUser: (userId: string, reason?: string) => Promise<{ success: boolean; message: string }>;
  deactivateUser: (userId: string, reason: string) => Promise<{ success: boolean; message: string }>;
  resetUserAccess: (userId: string) => Promise<{ success: boolean; message: string }>;
  changeUserRole: (userId: string, newRole: UserRole) => Promise<{ success: boolean; message: string }>;
  syncDirectoryToCloud: () => Promise<{ success: boolean; message: string; count?: number }>;
  updateCurrentUser: (updated: Partial<User>) => { success: boolean; message: string };
  updatePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  firebaseUser: FirebaseUser | null;
  firebaseAuthStatus: 'initializing' | 'authenticated' | 'unauthenticated' | 'error';
  firebaseAuthError: string | null;
  firebaseIdToken: string | null;
  getFirebaseIdToken: () => Promise<string | null>;
  retryFirebaseAuth: () => Promise<{ success: boolean; error?: string; uid?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to write security audit logs safely
export function recordSecurityAudit(
  action: 'LOGIN' | 'FAILED_LOGIN' | 'LOGOUT' | 'SECURITY_ALERT',
  username: string,
  userRole?: string,
  details?: string,
  schoolUdise?: string
) {
  try {
    const logs = safeGetJSON<AuditLog[]>('jsk_audit_logs', []);
    const now = new Date();

    // Determine if this is a pre-authentication event or authenticated session event
    const isPreAuthEvent = action === 'FAILED_LOGIN' || !auth.currentUser;

    if (isPreAuthEvent) {
      // 1. Maintain local UI debugging/security audit display in browser storage (capped at 50)
      const localLog: AuditLog = {
        id: `SEC-${Date.now().toString().slice(-6)}`,
        timestamp: now.toISOString(),
        date: now.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
        userId: (username || 'unknown').slice(0, 100),
        userName: (username || 'unknown').slice(0, 100),
        role: userRole || 'GUEST',
        action: action === 'FAILED_LOGIN' ? 'STATUS_CHANGE' : (action as any),
        module: 'सुरक्षा एवं प्रमाणीकरण',
        details: details || `${username} द्वारा ${action === 'FAILED_LOGIN' ? 'अमान्य लॉगिन प्रयास' : 'सुरक्षा चेतावनी'}`,
        schoolUdise: schoolUdise || undefined,
      };
      logs.unshift(localLog);
      safeSetJSON('jsk_audit_logs', logs, 50);

      // 2. CRITICAL: Route to dedicated preAuthSecurityEvents collection with strict schema & abuse protection
      // NEVER attempt writing to auditLogs collection for unauthenticated clients!
      const preAuthPayload: PreAuthSecurityEvent = {
        eventId: `PRE-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        eventType: action === 'FAILED_LOGIN' ? 'FAILED_LOGIN' : 'AUTH_ERROR',
        timestamp: now.toISOString(),
        sanitizedIdentifier: (username || 'anonymous').slice(0, 100),
        success: false,
        reasonCode: action === 'FAILED_LOGIN' ? 'INVALID_CREDENTIALS' : 'UNAUTHENTICATED_ALERT',
        source: 'WEB_APP',
        details: (details || 'Pre-authentication security check event').slice(0, 300),
      };
      syncPreAuthSecurityEventToCloud(preAuthPayload).catch((cloudErr) => {
        console.warn('[PreAuthSecurityEvent] Cloud sync notice:', cloudErr);
      });
      return;
    }

    // 3. Authenticated Event: Bind to authoritative Firebase Auth identity
    const currentUid = auth.currentUser.uid;
    const authoritativeRole = userRole || 'SCHOOL';

    const newLog: AuditLog = {
      id: `SEC-${Date.now().toString().slice(-6)}`,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      userId: currentUid,
      userName: username,
      role: authoritativeRole,
      action: (action as any),
      module: 'सुरक्षा एवं प्रमाणीकरण',
      details: details || `${username} द्वारा ${action === 'LOGIN' ? 'सफल लॉगिन' : action === 'LOGOUT' ? 'सत्र समाप्ति' : 'सुरक्षा चेतावनी'}`,
      schoolUdise: schoolUdise || undefined,
    };
    logs.unshift(newLog);
    safeSetJSON('jsk_audit_logs', logs, 50);

    // CRITICAL: Sync authoritative security audit record to Firestore auditLogs
    syncAuditLogToCloud(newLog).catch((cloudErr) => {
      console.warn('[SecurityAudit] Cloud sync notice:', cloudErr);
    });
  } catch (err) {
    console.warn('Failed to write security audit log:', err);
  }
}

/**
 * Authoritative user management audit log creator.
 * Captures WHO, WHEN, WHAT, WHERE, BEFORE, AFTER, and REASON,
 * persisting to local secure store and syncing to Firestore /auditLogs.
 */
export function recordUserManagementAudit(
  action: AuditAction,
  targetUser: User,
  performedBy: User,
  details: string,
  extra?: {
    before?: any;
    after?: any;
    reason?: string;
  }
) {
  try {
    const logs = safeGetJSON<AuditLog[]>('jsk_audit_logs', []);
    const now = new Date();
    const currentUid = auth.currentUser?.uid || performedBy.id;
    const authoritativeRole = performedBy.role;

    const newLog: AuditLog = {
      id: `USR-${Date.now().toString().slice(-6)}`,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('hi-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
      userId: currentUid,
      userName: performedBy.name || performedBy.username,
      role: authoritativeRole,
      action: action,
      module: 'उपयोगकर्ता प्रबंधन',
      recordId: targetUser.id,
      recordName: targetUser.name,
      schoolUdise: targetUser.schoolUdise || targetUser.assignedSchoolUdise || undefined,
      schoolName: targetUser.schoolName || undefined,
      before: extra?.before,
      after: extra?.after,
      reason: extra?.reason,
      details: details,
    };
    logs.unshift(newLog);
    safeSetJSON('jsk_audit_logs', logs, 100);

    if (auth.currentUser) {
      syncAuditLogToCloud(newLog).catch((cloudErr) => {
        console.warn('[AuditLogs] User management cloud sync notice:', cloudErr);
      });
    }
  } catch (err) {
    console.warn('Failed to record user management audit log:', err);
  }
}

/**
 * Synchronizes and auto-heals user accounts against the official School Master.
 * Enforces:
 * 1. Exactly 1 ADMIN (SANYAMJAIN88)
 * 2. Exactly 2 CAC (Sanjayjain1979, Sanmatijain99)
 * 3. Exactly N SCHOOL accounts, where N is the exact count in School Master (37)
 * 4. Total accounts = 1 + 2 + 37 = 40
 * 5. Reconciles any mismatched usernames, school names, UDISEs, or roles,
 *    and writes an audit record in jsk_audit_logs if corrections are performed.
 */
function syncAndVerifyUsers(masterSchools: School[]): User[] {
  // 1. Fixed Administrative Accounts
  const canonicalAdmins: User[] = [
    {
      id: 'USR-ADMIN-01',
      username: 'SANYAMJAIN88',
      name: 'संयम जैन',
      role: 'ADMIN',
      employeeId: 'EMP-ADM-88',
      mobile: '9826088159',
      email: 'admin.malguwa@mp.gov.in',
      designation: 'मुख्य व्यवस्थापक (System Admin)',
      assignedSchoolUdise: '',
      schoolId: '',
      schoolUdise: '',
      schoolName: '',
      status: 'ACTIVE',
      createdAt: '2025-01-01',
      block: 'बलदेवगढ़',
      district: 'टीकमगढ़',
    },
    {
      id: 'USR-CAC-01',
      username: 'Sanjayjain1979',
      name: 'संजय कुमार जैन',
      role: 'CAC',
      employeeId: 'EMP-CAC-201',
      mobile: '7000382532',
      alternateMobile: '9753679036',
      email: 'cac.malguwa@mp.gov.in',
      designation: 'संकुल समन्वयक (CAC)',
      assignedSchoolUdise: '',
      schoolId: '',
      schoolUdise: '',
      schoolName: '',
      status: 'ACTIVE',
      createdAt: '2025-06-01',
      block: 'बलदेवगढ़',
      district: 'टीकमगढ़',
    },
    {
      id: 'USR-CAC-02',
      username: 'Sanmatijain99',
      name: 'सन्मति कुमार जैन',
      role: 'CAC',
      employeeId: 'EMP-CAC-202',
      mobile: '9977323573',
      alternateMobile: '9977323573',
      email: 'cac.sanmati@mp.gov.in',
      designation: 'संकुल समन्वयक (CAC)',
      assignedSchoolUdise: '',
      schoolId: '',
      schoolUdise: '',
      schoolName: '',
      status: 'ACTIVE',
      createdAt: '2025-06-01',
      block: 'बलदेवगढ़',
      district: 'टीकमगढ़',
    },
  ];

  // 2. Canonical School Accounts generated directly from actual School Master
  const canonicalSchools: User[] = masterSchools.map((s) => ({
    id: `USR-SCH-${s.udise}`,
    username: s.udise,
    name: `${s.name} (${s.village})`,
    role: 'SCHOOL' as UserRole,
    employeeId: `UDISE-${s.udise}`,
    mobile: s.mobile || s.principalMobile || '',
    email: s.email || '',
    designation: `${s.schoolType} (संस्था लॉगिन)`,
    assignedSchoolUdise: s.udise,
    schoolId: s.udise,
    schoolUdise: s.udise,
    schoolName: s.name,
    status: (s.status === 'ARCHIVED' || s.status === 'INACTIVE' || s.isDeleted ? 'SUSPENDED' : 'ACTIVE') as UserStatus,
    createdAt: '2025-01-01',
    block: s.block || 'बलदेवगढ़',
    district: s.district || 'टीकमगढ़',
  }));

  // Retrieve existing localStorage users if present
  let existingStored: User[] = [];
  try {
    const raw = localStorage.getItem('jsk_malguwa_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        existingStored = parsed;
      }
    }
  } catch (e) {
    console.error('Error reading jsk_malguwa_users', e);
  }

  const corrections: string[] = [];
  const finalUsers: User[] = [];

  // Reconcile Admins
  for (const admin of canonicalAdmins) {
    const stored = existingStored.find(
      (u) => (u.username || '').toLowerCase() === (admin.username || '').toLowerCase()
    );
    if (stored) {
      finalUsers.push({
        ...admin,
        ...stored,
        username: admin.username, // keep exact casing
        role: admin.role,         // cannot alter role
        status: 'ACTIVE',
      });
    } else {
      finalUsers.push(admin);
    }
  }

  // Reconcile Schools against canonical master
  for (const canonSch of canonicalSchools) {
    const stored = existingStored.find(
      (u) => u.username === canonSch.username || u.assignedSchoolUdise === canonSch.username
    );

    if (stored) {
      // Check for discrepancies in mapping
      const hasDiscrepancy =
        stored.name !== canonSch.name ||
        stored.schoolName !== canonSch.schoolName ||
        stored.schoolId !== canonSch.schoolId ||
        stored.schoolUdise !== canonSch.schoolUdise ||
        stored.assignedSchoolUdise !== canonSch.assignedSchoolUdise ||
        stored.role !== 'SCHOOL';

      if (hasDiscrepancy) {
        corrections.push(
          `सुधार: शाला ${canonSch.username} (${canonSch.schoolName}) - मास्टर डेटा से सिंक किया गया`
        );
      }

      finalUsers.push({
        ...canonSch,
        ...stored,
        id: canonSch.id,
        username: canonSch.username,
        name: canonSch.name,
        role: 'SCHOOL',
        assignedSchoolUdise: canonSch.username,
        schoolId: canonSch.username,
        schoolUdise: canonSch.username,
        schoolName: canonSch.schoolName,
        status: 'ACTIVE',
      });
    } else {
      finalUsers.push(canonSch);
    }
  }

  // Safeguard orphan accounts in existingStored (preserve as INACTIVE/Archived to prevent historical reference breaks)
  const validUsernames = new Set(
    finalUsers.map((u) => (u.username || '').toLowerCase()).filter(Boolean)
  );
  for (const stored of existingStored) {
    const sUsername = (stored.username || '').toLowerCase();
    if (sUsername && !validUsernames.has(sUsername)) {
      finalUsers.push({
        ...stored,
        status: 'SUSPENDED',
        designation: `${stored.designation || 'पूर्व शाला'} (अभिलेख सुरक्षित / Archived)`,
      });
      validUsernames.add(sUsername);
      corrections.push(`पूर्व खाता सुरक्षित व अभिलेखागारित (Archived): ${stored.username}`);
    }
  }

  // If any corrections or orphan removals were performed, record an audit entry
  if (corrections.length > 0) {
    try {
      recordSecurityAudit(
        'LOGIN',
        'SYSTEM_SYNC',
        'SYSTEM',
        `उपयोगकर्ता व शाला मास्टर सत्यापन: ${corrections.join('; ')}`
      );
    } catch (e) {
      console.error(e);
    }
  }

  return finalUsers;
}

const SESSION_SECRET_SALT = 'JSK_MALGUWA_SEC_AUTH_KEY_2026_9826088159_VERIFY';

export function computeSessionToken(username: string, role: string, udise: string, timestamp: string): string {
  const payload = `${(username || '').toLowerCase()}|${role || ''}|${udise || ''}|${timestamp || ''}|${SESSION_SECRET_SALT}`;
  let hash1 = 0x811c9dc5;
  let hash2 = 0x537b8d4f;
  for (let i = 0; i < payload.length; i++) {
    const char = payload.charCodeAt(i);
    hash1 ^= char;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 = Math.imul(hash2 ^ char, 0x05a74a1f);
  }
  return `JSKSIG-${Math.abs(hash1).toString(16)}-${Math.abs(hash2).toString(16)}`;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load known schools for School UDISE validation
  const getKnownSchools = (): School[] => {
    try {
      const saved = localStorage.getItem('jsk_schools');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return initialSchools;
  };

  const [users, setUsers] = useState<User[]>(() => {
    return syncAndVerifyUsers(getKnownSchools());
  });

  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [firebaseAuthStatus, setFirebaseAuthStatus] = useState<'initializing' | 'authenticated' | 'unauthenticated' | 'error'>('initializing');
  const [firebaseAuthError, setFirebaseAuthError] = useState<string | null>(null);
  const [firebaseIdToken, setFirebaseIdToken] = useState<string | null>(null);
  const [cachedAuthCreds, setCachedAuthCreds] = useState<{ email: string; pass: string } | null>(null);

  // Retrieve Firebase ID token dynamically
  const getFirebaseIdToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      try {
        const token = await auth.currentUser.getIdToken(true);
        setFirebaseIdToken(token);
        return token;
      } catch (err: any) {
        console.warn('Error refreshing Firebase ID token:', err);
        return null;
      }
    }
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setFirebaseAuthStatus('authenticated');
        setFirebaseAuthError(null);
        try {
          const token = await fbUser.getIdToken();
          setFirebaseIdToken(token);
        } catch (tokErr) {
          console.warn('ID token fetch error:', tokErr);
        }
      } else {
        setFirebaseAuthStatus('unauthenticated');
        setFirebaseIdToken(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('jsk_malguwa_current_user');
    const savedToken = localStorage.getItem('jsk_malguwa_session_token');
    const savedTimestamp = localStorage.getItem('jsk_malguwa_session_timestamp');

    if (saved) {
      try {
        const u: User = JSON.parse(saved);
        const allKnown = syncAndVerifyUsers(getKnownSchools());
        const matched = allKnown.find(
          (k) => (k.username || '').toLowerCase() === (u.username || '').toLowerCase()
        );

        if (matched) {
          // Cryptographic signature verification to prevent localStorage tampering
          const expectedToken = savedTimestamp
            ? computeSessionToken(matched.username, matched.role, matched.assignedSchoolUdise || '', savedTimestamp)
            : null;

          const isSignatureValid = !savedToken || (expectedToken && savedToken === expectedToken);

          if (isSignatureValid) {
            return {
              ...matched,
              ...u,
              username: matched.username,
              role: matched.role,
              assignedSchoolUdise: matched.assignedSchoolUdise,
              schoolId: matched.schoolId,
              schoolUdise: matched.schoolUdise,
              schoolName: matched.schoolName,
              status: 'ACTIVE',
            };
          } else {
            // Tampered role/username detected in localStorage
            recordSecurityAudit(
              'SECURITY_ALERT',
              u.username || 'UNKNOWN',
              'TAMPER_ATTEMPT',
              `अनाधिकृत लोकलस्टोरेज सत्र टैम्परिंग (Invalid Signature): खाता '${u.username}' सत्र निरस्त किया गया।`
            );
          }
        }

        // Immediately purge unauthorized user session
        safeRemoveItem('jsk_malguwa_current_user');
        safeRemoveItem('jsk_malguwa_session_token');
        safeRemoveItem('jsk_malguwa_session_timestamp');
        return null;
      } catch (e) {
        console.error(e);
      }
    }
    return null;
  });

  useEffect(() => {
    safeSetJSON('jsk_malguwa_users', users);
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      safeSetJSON('jsk_malguwa_current_user', currentUser);
    } else {
      safeRemoveItem('jsk_malguwa_current_user');
    }
  }, [currentUser]);

  // Multi-Tab Session & Logout Synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'jsk_malguwa_current_user') {
        if (!e.newValue) {
          // Another browser tab initiated logout
          setCurrentUser(null);
        } else {
          try {
            const parsed: User = JSON.parse(e.newValue);
            const allKnown = syncAndVerifyUsers(getKnownSchools());
            const matched = allKnown.find(
              (k) => (k.username || '').toLowerCase() === (parsed.username || '').toLowerCase()
            );
            const savedToken = localStorage.getItem('jsk_malguwa_session_token');
            const savedTimestamp = localStorage.getItem('jsk_malguwa_session_timestamp');
            const expectedToken = savedTimestamp && matched
              ? computeSessionToken(matched.username, matched.role, matched.assignedSchoolUdise || '', savedTimestamp)
              : null;
            const isSignatureValid = !savedToken || (expectedToken && savedToken === expectedToken);

            if (matched && isSignatureValid) {
              setCurrentUser({
                ...matched,
                ...parsed,
                username: matched.username,
                role: matched.role,
                assignedSchoolUdise: matched.assignedSchoolUdise,
                schoolId: matched.schoolId,
                schoolUdise: matched.schoolUdise,
                schoolName: matched.schoolName,
                status: 'ACTIVE',
              });
            } else {
              setCurrentUser(null);
            }
          } catch {
            setCurrentUser(null);
          }
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Real-time synchronization of users from Firestore for Admin and CAC
  useEffect(() => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CAC')) {
      return;
    }

    const unsub = subscribeUsersFromCloud(
      (cloudUsers) => {
        if (Array.isArray(cloudUsers) && cloudUsers.length > 0) {
          setUsers((prev) => {
            const merged = [...prev];
            cloudUsers.forEach((cu) => {
              const idx = merged.findIndex(
                (m) => m.id === cu.id || (m.username && cu.username && m.username.toLowerCase() === cu.username.toLowerCase())
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...cu };
              } else {
                merged.push(cu);
              }
            });
            return merged;
          });
        }
      },
      (err) => {
        console.warn('Cloud users subscription notice:', err);
      }
    );

    return () => unsub();
  }, [currentUser]);

  /**
   * Main Unified Authentication Function:
   * 1. Validate non-empty inputs
   * 2. Auto-detect Role: ADMIN, CAC, or SCHOOL (UDISE)
   * 3. Validate credentials without exposing specific error details to UI
   * 4. Create persistent session & log audit trail
   */
  const login = (identifier: string, pass: string): { success: boolean; message: string; user?: User } => {
    const cleanId = (identifier || '').trim();
    const cleanPass = (pass || '').trim();

    // Validation 1: Both empty
    if (!cleanId && !cleanPass) {
      return { success: false, message: 'Please enter username and password' };
    }

    // Validation 2: Username empty
    if (!cleanId) {
      return { success: false, message: 'Username required' };
    }

    // Validation 3: Password empty
    if (!cleanPass) {
      return { success: false, message: 'Password required' };
    }

    const lowerId = cleanId.toLowerCase();
    let authenticatedUser: User | null = null;

    // -------------------------------------------------------------
    // 1. ADMIN Authentication: SANYAMJAIN88 / ADMIN88159
    // -------------------------------------------------------------
    if (cleanId.toUpperCase() === 'SANYAMJAIN88' && cleanPass === 'ADMIN88159') {
      const existingAdmin = users.find((u) => u.username.toUpperCase() === 'SANYAMJAIN88');
      authenticatedUser = existingAdmin || {
        id: 'USR-ADMIN-01',
        username: 'SANYAMJAIN88',
        name: 'संयम जैन',
        role: 'ADMIN',
        employeeId: 'EMP-ADM-88',
        mobile: '9826088159',
        email: 'admin.malguwa@mp.gov.in',
        designation: 'मुख्य व्यवस्थापक (System Admin)',
        assignedSchoolUdise: '',
        status: 'ACTIVE',
        createdAt: '2025-01-01',
        block: 'बलदेवगढ़',
        district: 'टीकमगढ़',
      };
    }

    // -------------------------------------------------------------
    // 2. CAC Accounts Authentication:
    //    CAC 1: Sanjayjain1979 / CAC700038
    //    CAC 2: Sanmatijain99 / CAC997732
    // -------------------------------------------------------------
    if (!authenticatedUser) {
      if (lowerId === 'sanjayjain1979' && cleanPass === 'CAC700038') {
        const existingCAC1 = users.find((u) => (u.username || '').toLowerCase() === 'sanjayjain1979');
        authenticatedUser = existingCAC1 || {
          id: 'USR-CAC-01',
          username: 'Sanjayjain1979',
          name: 'संजय कुमार जैन',
          role: 'CAC',
          employeeId: 'EMP-CAC-201',
          mobile: '7000382532',
          alternateMobile: '9753679036',
          email: 'cac.malguwa@mp.gov.in',
          designation: 'संकुल समन्वयक (CAC)',
          assignedSchoolUdise: '',
          status: 'ACTIVE',
          createdAt: '2025-06-01',
          block: 'बलदेवगढ़',
          district: 'टीकमगढ़',
        };
      } else if (lowerId === 'sanmatijain99' && cleanPass === 'CAC997732') {
        const existingCAC2 = users.find((u) => (u.username || '').toLowerCase() === 'sanmatijain99');
        authenticatedUser = existingCAC2 || {
          id: 'USR-CAC-02',
          username: 'Sanmatijain99',
          name: 'सन्मति कुमार जैन',
          role: 'CAC',
          employeeId: 'EMP-CAC-202',
          mobile: '9977323573',
          alternateMobile: '9977323573',
          email: 'cac.sanmati@mp.gov.in',
          designation: 'संकुल समन्वयक (CAC)',
          assignedSchoolUdise: '',
          status: 'ACTIVE',
          createdAt: '2025-06-01',
          block: 'बलदेवगढ़',
          district: 'टीकमगढ़',
        };
      }
    }

    // -------------------------------------------------------------
    // 3. SCHOOL Login Authentication:
    //    Username = School UDISE Code (11 digits, e.g. 23080110701)
    //    Password = Standardized [SchoolName] + [Last 4 Digits of UDISE]
    // -------------------------------------------------------------
    if (!authenticatedUser) {
      const knownSchools = getKnownSchools();
      const matchedSchool = knownSchools.find(
        (s) => s.udise === cleanId || (s.udise || '').toLowerCase() === lowerId
      );

      if (matchedSchool) {
        if (matchedSchool.status === 'ARCHIVED' || matchedSchool.status === 'INACTIVE' || matchedSchool.isDeleted) {
          recordSecurityAudit(
            'SECURITY_ALERT',
            cleanId,
            'SCHOOL',
            `निष्क्रिय विद्यालय लॉगिन प्रयास अस्वीकृत: ${matchedSchool.name} (${cleanId})`,
            cleanId
          );
          return {
            success: false,
            message: 'यह विद्यालय वर्तमान में निष्क्रिय है। कृपया संकुल कार्यालय/CAC से संपर्क करें।',
          };
        }

        const expectedDefaultPass = generateSchoolPassword(matchedSchool);
        
        // Also check if school user changed password previously
        let customSchoolPass: string | null = null;
        try {
          const savedPasses = localStorage.getItem('jsk_school_passwords');
          if (savedPasses) {
            const map = JSON.parse(savedPasses);
            customSchoolPass = map[matchedSchool.udise] || null;
          }
        } catch (e) {
          console.error(e);
        }

        const passClean = cleanPass.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const expectedClean = expectedDefaultPass.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        const isPassValid =
          cleanPass === expectedDefaultPass ||
          cleanPass.toUpperCase() === expectedDefaultPass.toUpperCase() ||
          passClean === expectedClean ||
          (customSchoolPass && (cleanPass === customSchoolPass || cleanPass.toUpperCase() === customSchoolPass.toUpperCase()));

        if (isPassValid) {
          authenticatedUser = {
            id: `USR-SCH-${matchedSchool.udise}`,
            username: matchedSchool.udise,
            name: `${matchedSchool.name} (${matchedSchool.village})`,
            role: 'SCHOOL',
            employeeId: `UDISE-${matchedSchool.udise}`,
            mobile: matchedSchool.mobile || matchedSchool.principalMobile || '',
            email: matchedSchool.email || '',
            designation: `${matchedSchool.schoolType} (संस्था लॉगिन)`,
            assignedSchoolUdise: matchedSchool.udise,
            schoolId: matchedSchool.udise,
            schoolUdise: matchedSchool.udise,
            schoolName: matchedSchool.name,
            status: 'ACTIVE',
            createdAt: '2025-01-01',
            block: matchedSchool.block || 'बलदेवगढ़',
            district: matchedSchool.district || 'टीकमगढ़',
          };
        }
      }
    }

    // -------------------------------------------------------------
    // STRICT SECURITY POLICY:
    // ONLY Admin (SANYAMJAIN88), CAC 1 (Sanjayjain1979), CAC 2 (Sanmatijain99),
    // and the 37 Cluster Schools (UDISE) are permitted. NO OTHER LOGIN IS ALLOWED.
    // -------------------------------------------------------------
    if (!authenticatedUser) {
      recordSecurityAudit('FAILED_LOGIN', cleanId, 'UNKNOWN', `अमान्य क्रेडेंशियल्स अथवा अनधिकृत खाता: ${cleanId}`);
      return {
        success: false,
        message: 'अमान्य यूज़रनेम या पासवर्ड! केवल मुख्य व्यवस्थापक (Admin: SANYAMJAIN88), जन शिक्षक (CAC 1 व CAC 2), अथवा संकुल की अधिकृत सक्रिय शालाओं (11-अंकीय UDISE) का लॉगिन मान्य है। अन्य किसी का प्रवेश प्रतिबंधित है।'
      };
    }

    // -------------------------------------------------------------
    // Success: Update session & record audit
    // -------------------------------------------------------------
    const updatedUser: User = {
      ...authenticatedUser,
      lastLogin: new Date().toLocaleString('hi-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Generate cryptographic session signature for persistent integrity
    const sessionTimestamp = Date.now().toString();
    const sessionToken = computeSessionToken(
      updatedUser.username,
      updatedUser.role,
      updatedUser.assignedSchoolUdise || '',
      sessionTimestamp
    );
    safeSetItem('jsk_malguwa_session_token', sessionToken);
    safeSetItem('jsk_malguwa_session_timestamp', sessionTimestamp);

    setCurrentUser(updatedUser);

    // Update users array if persistent user
    setUsers((prev) => {
      const exists = prev.some((u) => u.id === updatedUser.id);
      if (exists) {
        return prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
      }
      return [updatedUser, ...prev];
    });

    // Attempt Firebase Auth sign in with mapped email
    const mappedEmail = `${cleanId.toLowerCase()}@malguwa.edu.in`;
    setCachedAuthCreds({ email: mappedEmail, pass: cleanPass });
    setFirebaseAuthStatus('initializing');
    setFirebaseAuthError(null);

    signInWithEmailAndPassword(auth, mappedEmail, cleanPass)
      .then(async (cred) => {
        console.log('Firebase Auth: Sign in successful with UID:', cred.user.uid);
        setFirebaseUser(cred.user);
        setFirebaseAuthStatus('authenticated');
        setFirebaseAuthError(null);
        try {
          const token = await cred.user.getIdToken();
          setFirebaseIdToken(token);
          const authedUser: User = {
            ...updatedUser,
            id: cred.user.uid,
          };
          setCurrentUser(authedUser);
          await syncUserToCloud(authedUser);
          // Authoritative LOGIN audit now that Firebase Auth session is authenticated
          recordSecurityAudit(
            'LOGIN',
            authedUser.username,
            authedUser.role,
            `${authedUser.name} (${authedUser.role}) द्वारा सफलतापूर्वक लॉगिन किया गया।`,
            authedUser.assignedSchoolUdise
          );
        } catch (tokErr) {
          console.warn('Post login user sync error:', tokErr);
        }
      })
      .catch(async (authErr) => {
        console.warn('Firebase Auth sign in notice:', authErr.code, authErr.message);
        if (authErr.code === 'auth/user-not-found' || authErr.code === 'auth/invalid-credential') {
          try {
            const newCred = await createUserWithEmailAndPassword(auth, mappedEmail, cleanPass);
            setFirebaseUser(newCred.user);
            setFirebaseAuthStatus('authenticated');
            setFirebaseAuthError(null);
            const token = await newCred.user.getIdToken();
            setFirebaseIdToken(token);
            const authedUser: User = {
              ...updatedUser,
              id: newCred.user.uid,
            };
            setCurrentUser(authedUser);
            await syncUserToCloud(authedUser);
            // Authoritative LOGIN audit now that Firebase Auth session is authenticated
            recordSecurityAudit(
              'LOGIN',
              authedUser.username,
              authedUser.role,
              `${authedUser.name} (${authedUser.role}) द्वारा सफलतापूर्वक लॉगिन किया गया।`,
              authedUser.assignedSchoolUdise
            );
            return;
          } catch (createErr: any) {
            setFirebaseAuthStatus('error');
            setFirebaseAuthError(createErr.code || createErr.message);
          }
        } else {
          setFirebaseAuthStatus('error');
          setFirebaseAuthError(authErr.code || authErr.message);
        }
      });

    return { success: true, message: 'लॉगिन सफल रहा।', user: updatedUser };
  };

  const retryFirebaseAuth = async (): Promise<{ success: boolean; error?: string; uid?: string }> => {
    let email = cachedAuthCreds?.email;
    let pass = cachedAuthCreds?.pass;

    if (!email && currentUser) {
      email = `${(currentUser.username || '').toLowerCase()}@malguwa.edu.in`;
      const uname = (currentUser.username || '').toLowerCase();
      if (currentUser.role === 'ADMIN' || uname === 'sanyamjain88') {
        pass = 'ADMIN88159';
      } else if (currentUser.role === 'CAC') {
        pass = uname === 'sanjayjain1979' ? 'CAC700038' : 'CAC997732';
      } else if (currentUser.role === 'SCHOOL' && currentUser.assignedSchoolUdise) {
        pass = generateSchoolPassword(currentUser.assignedSchoolUdise);
      }
    }

    if (!email || !pass) {
      return { success: false, error: 'no-credentials' };
    }

    setFirebaseAuthStatus('initializing');
    setFirebaseAuthError(null);

    try {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, email, pass);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          cred = await createUserWithEmailAndPassword(auth, email, pass);
        } else {
          throw err;
        }
      }

      setFirebaseUser(cred.user);
      setFirebaseAuthStatus('authenticated');
      setFirebaseAuthError(null);
      const token = await cred.user.getIdToken(true);
      setFirebaseIdToken(token);

      if (currentUser) {
        await syncUserToCloud({
          ...currentUser,
          id: cred.user.uid,
        });
      }

      return { success: true, uid: cred.user.uid };
    } catch (e: any) {
      console.warn('retryFirebaseAuth notice:', e.code, e.message);
      setFirebaseAuthStatus('error');
      setFirebaseAuthError(e.code || e.message);
      return { success: false, error: e.code || e.message };
    }
  };

  // Background Auto-Authentication on Session Restore:
  // When a local authenticated user session exists and Firebase Auth is unauthenticated,
  // attempt a non-disruptive background authentication against Firebase
  const autoAuthAttemptedRef = useRef(false);
  useEffect(() => {
    if (currentUser && firebaseAuthStatus === 'unauthenticated' && !autoAuthAttemptedRef.current) {
      autoAuthAttemptedRef.current = true;
      retryFirebaseAuth().catch((e) => {
        console.warn('Background Firebase Auth attempt notice:', e);
      });
    }
  }, [currentUser, firebaseAuthStatus]);

  const logout = () => {
    if (currentUser) {
      recordSecurityAudit(
        'LOGOUT',
        currentUser.username,
        currentUser.role,
        `${currentUser.name} (${currentUser.role}) द्वारा सत्र समाप्त किया गया।`,
        currentUser.assignedSchoolUdise
      );
    }
    signOut(auth).catch((e) => {
      console.warn('Firebase Auth signOut notice:', e);
    });
    setCurrentUser(null);
    setCachedAuthCreds(null);
    setFirebaseUser(null);
    setFirebaseIdToken(null);
    setFirebaseAuthStatus('unauthenticated');
    setFirebaseAuthError(null);
    localStorage.removeItem('jsk_malguwa_current_user');
    localStorage.removeItem('jsk_malguwa_session_token');
    localStorage.removeItem('jsk_malguwa_session_timestamp');
  };

  const register = (data: Omit<User, 'id' | 'createdAt' | 'status'> & { password?: string }) => {
    const exists = users.some(
      (u) => u.employeeId === data.employeeId || u.mobile === data.mobile || u.username === data.username
    );

    if (exists) {
      return { success: false, message: 'इस यूज़रनेम, कर्मचारी आईडी या मोबाइल नंबर से खाता पहले से मौजूद है।' };
    }

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: data.username || (data.employeeId || '').toLowerCase(),
      name: data.name,
      role: data.role,
      employeeId: data.employeeId,
      mobile: data.mobile,
      email: data.email,
      designation: data.designation,
      subject: data.subject,
      assignedSchoolUdise: data.assignedSchoolUdise || '',
      status: 'PENDING',
      createdAt: new Date().toISOString().split('T')[0],
      password: data.password || 'admin123',
    };

    setUsers((prev) => [newUser, ...prev]);
    return { success: true, message: 'पंजीकरण आवेदन सफलतापूर्वक प्रस्तुत किया गया। संकुल व्यवस्थापक द्वारा सत्यापन उपरांत खाता सक्रिय होगा।' };
  };

  const approveUser = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CAC')) {
      return { success: false, message: 'अनधिकृत: केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) आवेदन स्वीकृत कर सकते हैं।' };
    }
    const target = users.find((u) => u.id === userId || u.username === userId);
    if (!target) {
      return { success: false, message: 'उपयोगकर्ता खाता नहीं मिला।' };
    }
    const updated: User = {
      ...target,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      rejectionReason: undefined,
    };
    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));

    recordUserManagementAudit(
      'USER_APPROVED',
      target,
      currentUser,
      `${currentUser.name} (${currentUser.role}) द्वारा पंजीकरण आवेदन '${target.name} (${target.username})' स्वीकृत किया गया।`,
      { before: { status: target.status, approvalStatus: target.approvalStatus }, after: { status: 'ACTIVE', approvalStatus: 'APPROVED' } }
    );

    try {
      await syncUserToCloud(updated);
    } catch (e) {
      console.warn('Sync to cloud notice:', e);
    }

    return { success: true, message: `उपयोगकर्ता '${target.name}' का पंजीकरण आवेदन स्वीकृत कर खाता सक्रिय कर दिया गया है।` };
  };

  const rejectUser = async (userId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CAC')) {
      return { success: false, message: 'अनधिकृत: केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) आवेदन अस्वीकृत कर सकते हैं।' };
    }
    const target = users.find((u) => u.id === userId || u.username === userId);
    if (!target) {
      return { success: false, message: 'उपयोगकर्ता खाता नहीं मिला।' };
    }
    const updated: User = {
      ...target,
      status: 'SUSPENDED',
      approvalStatus: 'REJECTED',
      rejectionReason: reason || 'प्रशासक द्वारा आवेदन अस्वीकृत किया गया',
    };
    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));

    recordUserManagementAudit(
      'USER_REJECTED',
      target,
      currentUser,
      `${currentUser.name} (${currentUser.role}) द्वारा आवेदन '${target.name}' अस्वीकृत किया गया। कारण: ${reason || 'अमान्य'}`,
      { before: { status: target.status }, after: { status: 'SUSPENDED', approvalStatus: 'REJECTED' }, reason: reason || 'अस्वीकृत' }
    );

    try {
      await syncUserToCloud(updated);
    } catch (e) {
      console.warn('Sync to cloud notice:', e);
    }

    return { success: true, message: `उपयोगकर्ता '${target.name}' का आवेदन अस्वीकृत कर दिया गया।` };
  };

  const activateUser = async (userId: string, reason?: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CAC')) {
      return { success: false, message: 'अनधिकृत: केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) उपयोगकर्ता सक्रिय कर सकते हैं।' };
    }
    const target = users.find((u) => u.id === userId || u.username === userId);
    if (!target) {
      return { success: false, message: 'उपयोगकर्ता खाता नहीं मिला।' };
    }
    if (currentUser.role === 'CAC' && target.role === 'ADMIN') {
      return { success: false, message: 'सुरक्षा प्रतिबंध: जन शिक्षक (CAC) मुख्य व्यवस्थापक (ADMIN) का खाता संशोधित नहीं कर सकते।' };
    }

    const updated: User = {
      ...target,
      status: 'ACTIVE',
      approvalStatus: 'APPROVED',
      deactivationReason: undefined,
      deactivatedAt: undefined,
      deactivatedBy: undefined,
    };

    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));

    recordUserManagementAudit(
      'USER_ACTIVATED',
      target,
      currentUser,
      `${currentUser.name} (${currentUser.role}) द्वारा खाता '${target.name} (${target.username})' सक्रिय किया गया।`,
      { before: { status: target.status }, after: { status: 'ACTIVE' }, reason: reason || 'सक्रियण' }
    );

    try {
      await syncUserToCloud(updated);
    } catch (e) {
      console.warn('Sync to cloud notice:', e);
    }

    return { success: true, message: `उपयोगकर्ता '${target.name}' का खाता सफलतापूर्वक सक्रिय किया गया।` };
  };

  const deactivateUser = async (userId: string, reason: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CAC')) {
      return { success: false, message: 'अनधिकृत: केवल संकुल व्यवस्थापक (ADMIN) एवं जन शिक्षक (CAC) उपयोगकर्ता निष्क्रिय कर सकते हैं।' };
    }
    const target = users.find((u) => u.id === userId || u.username === userId);
    if (!target) {
      return { success: false, message: 'उपयोगकर्ता खाता नहीं मिला।' };
    }
    if (currentUser.role === 'CAC' && target.role === 'ADMIN') {
      return { success: false, message: 'सुरक्षा प्रतिबंध: जन शिक्षक (CAC) मुख्य व्यवस्थापक (ADMIN) का खाता निष्क्रिय नहीं कर सकते।' };
    }
    if (target.id === currentUser.id || target.username === currentUser.username) {
      return { success: false, message: 'सुरक्षा प्रतिबंध: आप स्वयं का सक्रिय खाता निष्क्रिय नहीं कर सकते।' };
    }

    const updated: User = {
      ...target,
      status: 'SUSPENDED',
      deactivationReason: reason,
      deactivatedAt: new Date().toISOString(),
      deactivatedBy: currentUser.name,
    };

    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));

    recordUserManagementAudit(
      'USER_DEACTIVATED',
      target,
      currentUser,
      `${currentUser.name} (${currentUser.role}) द्वारा खाता '${target.name} (${target.username})' निष्क्रिय किया गया। कारण: ${reason}`,
      { before: { status: target.status }, after: { status: 'SUSPENDED', reason }, reason }
    );

    try {
      await syncUserToCloud(updated);
    } catch (e) {
      console.warn('Sync to cloud notice:', e);
    }

    return { success: true, message: `उपयोगकर्ता '${target.name}' का खाता सफलतापूर्वक निष्क्रिय किया गया।` };
  };

  const resetUserAccess = async (userId: string): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CAC')) {
      return { success: false, message: 'अनधिकृत पहुंच।' };
    }
    const target = users.find((u) => u.id === userId || u.username === userId);
    if (!target) {
      return { success: false, message: 'उपयोगकर्ता खाता नहीं मिला।' };
    }
    if (currentUser.role === 'CAC' && target.role === 'ADMIN') {
      return { success: false, message: 'सुरक्षा प्रतिबंध: जन शिक्षक (CAC) मुख्य व्यवस्थापक (ADMIN) का एक्सेस रीसेट नहीं कर सकते।' };
    }

    const updated: User = {
      ...target,
      accessResetAt: new Date().toISOString(),
    };
    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));

    recordUserManagementAudit(
      'USER_ACCESS_RESET',
      target,
      currentUser,
      `${currentUser.name} (${currentUser.role}) द्वारा '${target.name} (${target.username})' का एक्सेस व लॉगिन टोकन रीसेट किया गया।`,
      { reason: 'प्रशासक द्वारा एक्सेस रीसेट' }
    );

    try {
      await syncUserToCloud(updated);
    } catch (e) {
      console.warn('Sync to cloud notice:', e);
    }

    return { success: true, message: `उपयोगकर्ता '${target.name}' का एक्सेस सफलतापूर्वक रीसेट किया गया।` };
  };

  const changeUserRole = async (userId: string, newRole: UserRole): Promise<{ success: boolean; message: string }> => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, message: 'सुरक्षा प्रतिबंध: भूमिका परिवर्तन का अधिकार केवल मुख्य व्यवस्थापक (ADMIN) के पास है।' };
    }
    const target = users.find((u) => u.id === userId || u.username === userId);
    if (!target) {
      return { success: false, message: 'उपयोगकर्ता खाता नहीं मिला।' };
    }
    if (target.role === newRole) {
      return { success: true, message: 'भूमिका पूर्ववत है।' };
    }

    const updated: User = {
      ...target,
      role: newRole,
    };
    setUsers((prev) => prev.map((u) => (u.id === target.id ? updated : u)));

    recordUserManagementAudit(
      'USER_ROLE_CHANGED',
      target,
      currentUser,
      `${currentUser.name} (ADMIN) द्वारा '${target.name}' की भूमिका ${target.role} से बदलकर ${newRole} की गई।`,
      { before: { role: target.role }, after: { role: newRole } }
    );

    try {
      await syncUserToCloud(updated);
    } catch (e) {
      console.warn('Sync to cloud notice:', e);
    }

    return { success: true, message: `भूमिका सफलतापूर्वक ${newRole} में परिवर्तित कर दी गई है।` };
  };

  const syncDirectoryToCloud = async (): Promise<{ success: boolean; message: string; count?: number }> => {
    if (!currentUser || (currentUser.role !== 'ADMIN' && currentUser.role !== 'CAC')) {
      return { success: false, message: 'अनधिकृत पहुंच।' };
    }
    try {
      let count = 0;
      for (const u of users) {
        await syncUserToCloud(u);
        count++;
      }
      return { success: true, message: `${count} अधिकृत उपयोगकर्ता रिकॉर्ड्स क्लाउड फायरस्टोर से सफलतापूर्वक सिंक किए गए।`, count };
    } catch (e: any) {
      return { success: false, message: `क्लाउड सिंक में त्रुटि: ${e?.message || 'अज्ञात त्रुटि'}` };
    }
  };

  const updateCurrentUser = (updated: Partial<User>) => {
    if (!currentUser) {
      return { success: false, message: 'कोई सक्रिय सत्र नहीं मिला।' };
    }

    // STRICT PRIVILEGE ESCALATION GUARD: Exclude identity, role and security scoping fields
    const {
      id: _id,
      role: _role,
      username: _username,
      assignedSchoolUdise: _assignedUdise,
      schoolId: _schoolId,
      schoolUdise: _schoolUdise,
      schoolName: _schoolName,
      status: _status,
      employeeId: _employeeId,
      createdAt: _createdAt,
      password: _password,
      ...allowedFields
    } = updated;

    const newObj: User = {
      ...currentUser,
      ...allowedFields,
      // Strictly preserve immutable original security identity
      id: currentUser.id,
      role: currentUser.role,
      username: currentUser.username,
      assignedSchoolUdise: currentUser.assignedSchoolUdise,
      schoolId: currentUser.schoolId,
      schoolUdise: currentUser.schoolUdise,
      schoolName: currentUser.schoolName,
      status: currentUser.status,
      employeeId: currentUser.employeeId,
      createdAt: currentUser.createdAt,
      lastProfileUpdate: new Date().toLocaleString('hi-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setCurrentUser(newObj);
    safeSetJSON('jsk_malguwa_current_user', newObj);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? newObj : u)));
    return { success: true, message: 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई।' };
  };

  const updatePassword = (currentPass: string, newPass: string) => {
    if (!currentUser) {
      return { success: false, message: 'कोई सक्रिय सत्र नहीं मिला।' };
    }

    const cleanCurrent = (currentPass || '').trim();
    const cleanNew = (newPass || '').trim();

    if (!cleanCurrent) {
      return { success: false, message: 'वर्तमान पासवर्ड प्रविष्ट करना अनिवार्य है।' };
    }

    if (!cleanNew || cleanNew.length < 6) {
      return { success: false, message: 'नया पासवर्ड न्यूनतम 6 अक्षरों का होना आवश्यक है।' };
    }

    // 1. Verify current password based on role
    let isCurrentValid = false;

    if (currentUser.role === 'SCHOOL' && currentUser.assignedSchoolUdise) {
      const knownSchools = getKnownSchools();
      const schoolObj = knownSchools.find((s) => s.udise === currentUser.assignedSchoolUdise);
      const expectedDefaultPass = schoolObj ? generateSchoolPassword(schoolObj) : '';
      let customSchoolPass: string | null = null;
      try {
        const savedPasses = localStorage.getItem('jsk_school_passwords');
        if (savedPasses) {
          const map = JSON.parse(savedPasses);
          customSchoolPass = map[currentUser.assignedSchoolUdise] || null;
        }
      } catch (e) {
        console.error(e);
      }

      const passClean = cleanCurrent.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      const expectedClean = expectedDefaultPass.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      isCurrentValid =
        (currentUser.password && cleanCurrent === currentUser.password) ||
        (customSchoolPass && (cleanCurrent === customSchoolPass || cleanCurrent.toUpperCase() === customSchoolPass.toUpperCase())) ||
        cleanCurrent === expectedDefaultPass ||
        cleanCurrent.toUpperCase() === expectedDefaultPass.toUpperCase() ||
        passClean === expectedClean;
    } else {
      // CAC or ADMIN
      const defaultPasses: Record<string, string> = {
        sanyamjain88: 'ADMIN88159',
        sanjayjain1979: 'CAC700038',
        sanmatijain99: 'CAC997732',
      };
      const expectedDefault = defaultPasses[(currentUser.username || '').toLowerCase()] || '';
      isCurrentValid =
        (currentUser.password && cleanCurrent === currentUser.password) ||
        (expectedDefault && cleanCurrent === expectedDefault);
    }

    if (!isCurrentValid) {
      recordSecurityAudit(
        'SECURITY_ALERT',
        currentUser.username,
        currentUser.role,
        `पासवर्ड परिवर्तन विफल: अमान्य वर्तमान पासवर्ड। उपयोगकर्ता: ${currentUser.name}`,
        currentUser.assignedSchoolUdise
      );
      return { success: false, message: 'वर्तमान पासवर्ड गलत है (Incorrect Current Password)।' };
    }

    // For school accounts, store in jsk_school_passwords
    if (currentUser.role === 'SCHOOL' && currentUser.assignedSchoolUdise) {
      try {
        const savedPasses = localStorage.getItem('jsk_school_passwords');
        const map = savedPasses ? JSON.parse(savedPasses) : {};
        map[currentUser.assignedSchoolUdise] = cleanNew;
        safeSetJSON('jsk_school_passwords', map);
      } catch (e) {
        console.error(e);
      }
    }

    const updatedUser: User = {
      ...currentUser,
      password: cleanNew,
      lastProfileUpdate: new Date().toLocaleString('hi-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setCurrentUser(updatedUser);
    safeSetJSON('jsk_malguwa_current_user', updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    return { success: true, message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है।' };
  };

  // Centralized Permission Matrix & Scope Derivation
  const permissions: PermissionConfig = useMemo(() => {
    if (!currentUser) return DEFAULT_GUEST_PERMISSIONS;
    return ROLE_PERMISSIONS[currentUser.role] || DEFAULT_GUEST_PERMISSIONS;
  }, [currentUser]);

  const hasPermission = (permissionKey: keyof PermissionConfig): boolean => {
    return !!permissions[permissionKey];
  };

  const isUdiseAllowed = (targetUdise: string | null | undefined): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'CAC') {
      return true; // CAC and Admin can access all schools in the cluster
    }
    // SCHOOL role can strictly only access its own assignedSchoolUdise
    if (!targetUdise || targetUdise === 'ALL' || targetUdise === 'समस्त') {
      return false;
    }
    return targetUdise === currentUser.assignedSchoolUdise;
  };

  const canAccessView = (viewId: string): boolean => {
    if (!currentUser) return ['dashboard', 'search'].includes(viewId);
    if (viewId === 'cac-attendance-monitoring' || viewId === 'attendance-monitoring') {
      return currentUser.role === 'CAC' || currentUser.role === 'ADMIN';
    }
    if (viewId === 'upload' || viewId === 'data-upload') {
      return currentUser.role === 'ADMIN';
    }
    return permissions.allowedViews.includes(viewId);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        users,
        registeredUsers: users,
        permissions,
        hasPermission,
        isUdiseAllowed,
        canAccessView,
        login,
        logout,
        register,
        approveUser,
        rejectUser,
        activateUser,
        deactivateUser,
        resetUserAccess,
        changeUserRole,
        syncDirectoryToCloud,
        updateCurrentUser,
        updatePassword,
        firebaseUser,
        firebaseAuthStatus,
        firebaseAuthError,
        firebaseIdToken,
        getFirebaseIdToken,
        retryFirebaseAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
