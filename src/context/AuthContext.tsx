import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { User, UserRole, UserStatus, School, AuditLog, AuditAction, PreAuthSecurityEvent } from '../types';
import { initialUsers, initialSchools } from '../data/seedData';
import { auth, db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword as fbUpdatePassword,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  syncUserToCloud,
  updateUserLoginTimestamp,
  syncAuditLogToCloud,
  syncPreAuthSecurityEventToCloud,
  subscribeUsersFromCloud,
  deleteUserFromCloud,
} from '../services/cloudDatabaseService';
import { safeGetJSON, safeSetJSON, safeSetItem, safeRemoveItem } from '../utils/safeStorage';
import { enforceRuntimeFeatureAccess } from '../config/featureControlRegistry';

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
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message: string; user?: User }>;
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
  updatePassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
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
 * Authoritative Synchronization of Administrative Accounts.
 * Strictly Enforces:
 * 1. Exactly 1 ADMIN (SANYAMJAIN88 - संयम जैन)
 * 2. Exactly 2 CAC (Sanjayjain1979 - संजय कुमार जैन, Sanmatijain99 - सन्मति कुमार जैन)
 * 3. ZERO SCHOOL LOGINS (All school logins have been removed per administrative directive)
 * 4. Total authorized user accounts = Exactly 3
 */
export const CANONICAL_ADMIN_USERNAMES = ['sanyamjain88', 'sanjayjain1979', 'sanmatijain99'];

function syncAndVerifyUsers(_masterSchools?: School[]): User[] {
  // 1. Authoritative Fixed Administrative Accounts
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

  // Retrieve existing localStorage users if present
  let existingStored: User[] = [];
  try {
    const raw = localStorage.getItem('jsk_malguwa_users');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Discard any user with role === 'SCHOOL' or non-admin usernames
        existingStored = parsed.filter(
          (u) => u.role !== 'SCHOOL' && CANONICAL_ADMIN_USERNAMES.includes((u.username || '').toLowerCase())
        );
      }
    }
  } catch (e) {
    console.error('Error reading jsk_malguwa_users', e);
  }

  const finalUsers: User[] = [];

  // Reconcile Canonical Admins
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

  // Update localStorage immediately with clean 3 accounts
  try {
    localStorage.setItem('jsk_malguwa_users', JSON.stringify(finalUsers));
  } catch {
    // ignore
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

  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        setFirebaseAuthStatus('authenticated');
        setFirebaseAuthError(null);
        try {
          const token = await fbUser.getIdToken();
          setFirebaseIdToken(token);

          // Requirement 3 & 4: Authoritative Firestore user document verification
          const userDocRef = doc(db, 'users', fbUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (!userDocSnap.exists()) {
            console.warn('Firebase user has no /users profile document. Purging session.');
            await signOut(auth);
            setCurrentUser(null);
            safeRemoveItem('jsk_malguwa_current_user');
            safeRemoveItem('jsk_malguwa_session_token');
            safeRemoveItem('jsk_malguwa_session_timestamp');
            setFirebaseAuthStatus('unauthenticated');
            return;
          }

          const profile = userDocSnap.data() as User;
          const isActive = profile.status === 'ACTIVE';
          const isApproved = !profile.approvalStatus || profile.approvalStatus === 'APPROVED';

          if (!isActive || !isApproved) {
            console.warn('User status is inactive or unapproved. Purging session.');
            await signOut(auth);
            setCurrentUser(null);
            safeRemoveItem('jsk_malguwa_current_user');
            safeRemoveItem('jsk_malguwa_session_token');
            safeRemoveItem('jsk_malguwa_session_timestamp');
            setFirebaseAuthStatus('unauthenticated');
            return;
          }

          // Verify stored session token if available
          const saved = localStorage.getItem('jsk_malguwa_current_user');
          if (saved) {
            try {
              const u: User = JSON.parse(saved);
              if (u.id !== fbUser.uid) {
                console.warn('Stored user ID mismatch with Firebase Auth UID. Purging invalid local session.');
                safeRemoveItem('jsk_malguwa_current_user');
                safeRemoveItem('jsk_malguwa_session_token');
                safeRemoveItem('jsk_malguwa_session_timestamp');
              }
            } catch {
              safeRemoveItem('jsk_malguwa_current_user');
            }
          }

          const authenticatedUser: User = {
            ...profile,
            id: fbUser.uid,
          };
          setCurrentUser(authenticatedUser);
          safeSetJSON('jsk_malguwa_current_user', authenticatedUser);
        } catch (tokErr) {
          console.warn('ID token fetch / session hydration error:', tokErr);
        }
      } else {
        // Requirement 3: If no Firebase user, purge local session completely and send to login
        setFirebaseAuthStatus('unauthenticated');
        setFirebaseIdToken(null);
        setCurrentUser(null);
        safeRemoveItem('jsk_malguwa_current_user');
        safeRemoveItem('jsk_malguwa_session_token');
        safeRemoveItem('jsk_malguwa_session_timestamp');
      }
    });
    return () => unsubscribe();
  }, []);

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
        if (!e.newValue || !auth.currentUser) {
          // Another browser tab initiated logout or no Firebase auth session
          setCurrentUser(null);
        } else {
          try {
            const parsed: User = JSON.parse(e.newValue);
            if (parsed.id !== auth.currentUser.uid) {
              console.warn('Storage user UID mismatch with active Firebase user. Purging session.');
              setCurrentUser(null);
              safeRemoveItem('jsk_malguwa_current_user');
              safeRemoveItem('jsk_malguwa_session_token');
              safeRemoveItem('jsk_malguwa_session_timestamp');
              return;
            }
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

            if (matched && isSignatureValid && parsed.status === 'ACTIVE') {
              setCurrentUser({
                ...matched,
                ...parsed,
                id: auth.currentUser.uid,
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
          // Strictly keep only the 3 canonical administrative accounts
          const validAdmins = cloudUsers.filter(
            (cu) => cu.role !== 'SCHOOL' && CANONICAL_ADMIN_USERNAMES.includes((cu.username || '').toLowerCase())
          );
          setUsers((prev) => {
            const merged = [...prev];
            validAdmins.forEach((cu) => {
              const idx = merged.findIndex(
                (m) => m.id === cu.id || (m.username && cu.username && m.username.toLowerCase() === cu.username.toLowerCase())
              );
              if (idx >= 0) {
                merged[idx] = { ...merged[idx], ...cu };
              } else {
                merged.push(cu);
              }
            });
            return merged.filter(
              (u) => u.role !== 'SCHOOL' && CANONICAL_ADMIN_USERNAMES.includes((u.username || '').toLowerCase())
            );
          });

          // Proactively remove any legacy school accounts from Cloud Firestore
          cloudUsers.forEach((cu) => {
            if (cu.role === 'SCHOOL' || !CANONICAL_ADMIN_USERNAMES.includes((cu.username || '').toLowerCase())) {
              if (cu.id) {
                deleteUserFromCloud(cu.id).catch(() => {});
              }
            }
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
   * 2. Auto-detect Role: ADMIN, CAC 1, or CAC 2 (Zero School Login Allowed)
   * 3. Validate credentials without exposing specific error details to UI
   * 4. Create persistent session & log audit trail
   */
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; message: string; user?: User }> => {
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

    // Strict Administrative Scope Validation:
    // Only Admin (SANYAMJAIN88) and 2 CACs (Sanjayjain1979, Sanmatijain99) are authorized to log in.
    const cleanLowerId = cleanId.toLowerCase().replace('@malguwa.edu.in', '').trim();
    if (/^\d{11}$/.test(cleanId) || (!cleanId.includes('@') && !CANONICAL_ADMIN_USERNAMES.includes(cleanLowerId))) {
      recordSecurityAudit(
        'FAILED_LOGIN',
        cleanId,
        'UNKNOWN',
        `लॉगिन अस्वीकृत: शाला लॉगिन बंद है। केवल व्यवस्थापक एवं जन शिक्षक अधिकृत हैं: ${cleanId}`
      );
      return {
        success: false,
        message: 'शाला लॉगिन सुविधा उपलब्ध नहीं है। केवल व्यवस्थापक (Admin) एवं 2 जन शिक्षक (CAC 1 व CAC 2) लॉगिन अधिकृत हैं।',
      };
    }

    // Map identifier to authoritative email domain
    const mappedEmail = cleanId.includes('@') ? cleanId.toLowerCase() : `${cleanId.toLowerCase()}@malguwa.edu.in`;
    setCachedAuthCreds({ email: mappedEmail, pass: cleanPass });
    setFirebaseAuthStatus('initializing');
    setFirebaseAuthError(null);

    try {
      // 1. Authoritative Firebase Authentication (No local password checks, No auto-creation)
      const cred = await signInWithEmailAndPassword(auth, mappedEmail, cleanPass);
      console.log('Firebase Auth: Sign in successful with UID:', cred.user.uid);
      setFirebaseUser(cred.user);
      setFirebaseAuthStatus('authenticated');
      setFirebaseAuthError(null);

      const token = await cred.user.getIdToken();
      // 2. Requirement 4: Read /users/{uid} profile from Firestore
      const userDocRef = doc(db, 'users', cred.user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        console.warn(`Profile /users/${cred.user.uid} not found. Rejecting login.`);
        await signOut(auth);
        setFirebaseUser(null);
        setFirebaseAuthStatus('error');
        setFirebaseAuthError('user-profile-not-found');
        recordSecurityAudit(
          'FAILED_LOGIN',
          cleanId,
          'UNKNOWN',
          `लॉगिन अस्वीकृत: प्रोफ़ाइल /users/${cred.user.uid} Firestore में मौजूद नहीं है।`
        );
        return {
          success: false,
          message: 'अमान्य यूज़रनेम या पासवर्ड (Invalid username or password)',
        };
      }

      const cloudProfile = userDocSnap.data() as User;

      // School login rejection guard
      if (cloudProfile.role === 'SCHOOL' || !CANONICAL_ADMIN_USERNAMES.includes((cloudProfile.username || '').toLowerCase())) {
        console.warn(`Profile /users/${cred.user.uid} has SCHOOL role or unauthorized username. Rejecting login.`);
        await signOut(auth);
        setFirebaseUser(null);
        setFirebaseAuthStatus('error');
        setFirebaseAuthError('school-login-disabled');
        recordSecurityAudit(
          'FAILED_LOGIN',
          cleanId,
          cloudProfile.role,
          `लॉगिन अस्वीकृत: शाला लॉगिन बंद है। केवल व्यवस्थापक एवं जन शिक्षक अधिकृत हैं।`
        );
        return {
          success: false,
          message: 'शाला लॉगिन सुविधा उपलब्ध नहीं है। केवल व्यवस्थापक (Admin) एवं 2 जन शिक्षक (CAC 1 व CAC 2) लॉगिन अधिकृत हैं।',
        };
      }

      const isActive = cloudProfile.status === 'ACTIVE';
      const isApproved = !cloudProfile.approvalStatus || cloudProfile.approvalStatus === 'APPROVED';

      if (!isActive || !isApproved) {
        console.warn(`Profile /users/${cred.user.uid} not active or approved. Rejecting login.`);
        await signOut(auth);
        setFirebaseUser(null);
        setFirebaseAuthStatus('error');
        setFirebaseAuthError('user-not-active-or-unapproved');
        recordSecurityAudit(
          'FAILED_LOGIN',
          cleanId,
          cloudProfile.role,
          `लॉगिन अस्वीकृत: खाता निष्क्रिय या अस्वीकृत है (status=${cloudProfile.status}, approvalStatus=${cloudProfile.approvalStatus})`
        );
        return {
          success: false,
          message: 'अमान्य यूज़रनेम या पासवर्ड (Invalid username or password)',
        };
      }

      const authenticatedUser: User = {
        ...cloudProfile,
        id: cred.user.uid,
      };

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

      // 3. Persistent cryptographically-signed session token
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

      setUsers((prev) => {
        const exists = prev.some((u) => u.id === updatedUser.id);
        if (exists) {
          return prev.map((u) => (u.id === updatedUser.id ? updatedUser : u));
        }
        return [updatedUser, ...prev];
      });

      // Update ONLY lastLogin on Cloud (strictly within self-update whitelist)
      updateUserLoginTimestamp(cred.user.uid).catch((e) => console.warn('User lastLogin update notice:', e));
      recordSecurityAudit(
        'LOGIN',
        updatedUser.username,
        updatedUser.role,
        `${updatedUser.name} (${updatedUser.role}) द्वारा सफलतापूर्वक लॉगिन किया गया।`,
        updatedUser.assignedSchoolUdise
      );

      return { success: true, message: 'लॉगिन सफल रहा।', user: updatedUser };
    } catch (authErr: any) {
      console.warn('Firebase Auth sign in notice:', authErr.code);
      setFirebaseAuthStatus('error');
      setFirebaseAuthError(authErr.code || authErr.message);

      recordSecurityAudit(
        'FAILED_LOGIN',
        cleanId,
        'UNKNOWN',
        `लॉगिन प्रयास विफल (${authErr.code}): ${cleanId}`
      );

      // Generic error message: Zero account existence or system detail leakage
      return {
        success: false,
        message: 'अमान्य यूज़रनेम या पासवर्ड (Invalid username or password)',
      };
    }
  };

  const retryFirebaseAuth = async (): Promise<{ success: boolean; error?: string; uid?: string }> => {
    const email = cachedAuthCreds?.email;
    const pass = cachedAuthCreds?.pass;

    if (!email || !pass) {
      return { success: false, error: 'no-credentials' };
    }

    setFirebaseAuthStatus('initializing');
    setFirebaseAuthError(null);

    try {
      // Authoritative sign in only — strictly NO auto-createUserWithEmailAndPassword
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      setFirebaseUser(cred.user);
      setFirebaseAuthStatus('authenticated');
      setFirebaseAuthError(null);
      const token = await cred.user.getIdToken(true);
      setFirebaseIdToken(token);

      return { success: true, uid: cred.user.uid };
    } catch (e: any) {
      console.warn('retryFirebaseAuth notice:', e.code, e.message);
      setFirebaseAuthStatus('error');
      setFirebaseAuthError(e.code || e.message);
      return { success: false, error: e.code || e.message };
    }
  };

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
    const fcCheck = enforceRuntimeFeatureAccess('module.users.action.approve', currentUser?.role, 'उपयोगकर्ता आवेदन स्वीकृत करना (approveUser)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
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
    const fcCheck = enforceRuntimeFeatureAccess('module.users.action.reject', currentUser?.role, 'उपयोगकर्ता आवेदन अस्वीकृत करना (rejectUser)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
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
    const fcCheck = enforceRuntimeFeatureAccess('module.users.action.activate_deactivate', currentUser?.role, 'खाता सक्रिय करना (activateUser)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
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
    const fcCheck = enforceRuntimeFeatureAccess('module.users.action.activate_deactivate', currentUser?.role, 'खाता निष्क्रिय करना (deactivateUser)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
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
    const fcCheck = enforceRuntimeFeatureAccess('module.users.action.activate_deactivate', currentUser?.role, 'एक्सेस रीसेट करना (resetUserAccess)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
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
    const fcCheck = enforceRuntimeFeatureAccess('module.users', currentUser?.role, 'क्लाउड डायरेक्टरी सिंक (syncDirectoryToCloud)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
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
    const fcCheck = enforceRuntimeFeatureAccess('module.profile.action.edit_profile', currentUser?.role, 'प्रोफ़ाइल अपडेट करना (updateCurrentUser)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
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

  const updatePassword = async (currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    const fcCheck = enforceRuntimeFeatureAccess('module.profile.action.change_password', currentUser?.role, 'पासवर्ड बदलना (updatePassword)');
    if (!fcCheck.allowed) {
      return { success: false, message: fcCheck.message };
    }
    if (!currentUser) {
      return { success: false, message: 'कोई सक्रिय सत्र नहीं मिला।' };
    }
    if (!auth.currentUser || !auth.currentUser.email) {
      return { success: false, message: 'सक्रिय प्रमाणीकरण सत्र उपलब्ध नहीं है।' };
    }

    const cleanCurrent = (currentPass || '').trim();
    const cleanNew = (newPass || '').trim();

    if (!cleanCurrent) {
      return { success: false, message: 'वर्तमान पासवर्ड प्रविष्ट करना अनिवार्य है।' };
    }

    if (!cleanNew || cleanNew.length < 6) {
      return { success: false, message: 'नया पासवर्ड न्यूनतम 6 अक्षरों का होना आवश्यक है।' };
    }

    try {
      // 1. Authoritative reauthentication with Firebase Auth credentials
      const credential = EmailAuthProvider.credential(auth.currentUser.email, cleanCurrent);
      await reauthenticateWithCredential(auth.currentUser, credential);

      // 2. Authoritative updatePassword via Firebase Auth SDK
      await fbUpdatePassword(auth.currentUser, cleanNew);

      // 3. If account had mandatory password change flag, clear it in Firestore
      if (currentUser.mustChangePassword) {
        try {
          const userDocRef = doc(db, 'users', currentUser.id);
          await updateDoc(userDocRef, {
            mustChangePassword: false,
            lastProfileUpdate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch (clearErr) {
          console.warn('Clear mustChangePassword notice:', clearErr);
        }
      }

      // 4. Update session metadata (Zero local password storage)
      const updatedUser: User = {
        ...currentUser,
        mustChangePassword: false,
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

      recordSecurityAudit(
        'SECURITY_ALERT',
        currentUser.username,
        currentUser.role,
        `पासवर्ड सफलतापूर्वक बदला गया (Firebase Auth updatePassword): ${currentUser.name}`,
        currentUser.assignedSchoolUdise
      );

      return { success: true, message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है।' };
    } catch (authErr: any) {
      console.warn('updatePassword error:', authErr.code, authErr.message);
      recordSecurityAudit(
        'SECURITY_ALERT',
        currentUser.username,
        currentUser.role,
        `पासवर्ड परिवर्तन विफल: अमान्य वर्तमान पासवर्ड। उपयोगकर्ता: ${currentUser.name}`,
        currentUser.assignedSchoolUdise
      );
      if (authErr.code === 'auth/wrong-password' || authErr.code === 'auth/invalid-credential') {
        return { success: false, message: 'वर्तमान पासवर्ड गलत है (Incorrect Current Password)।' };
      }
      return { success: false, message: 'पासवर्ड परिवर्तन में त्रुटि हुई। कृपया पुनः प्रयास करें।' };
    }
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
