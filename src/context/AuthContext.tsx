import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { initialUsers } from '../data/seedData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  users: User[];
  registeredUsers: User[]; // alias for users
  login: (identifier: string, pass: string, role?: UserRole) => { success: boolean; message: string };
  logout: () => void;
  register: (data: Omit<User, 'id' | 'createdAt' | 'status'> & { password?: string }) => { success: boolean; message: string };
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  updateCurrentUser: (updated: Partial<User>) => { success: boolean; message: string };
  updatePassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  quickSwitchUser: (roleOrId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('jsk_malguwa_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return initialUsers;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('jsk_malguwa_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return null; // Will start with Splash -> Login
  });

  useEffect(() => {
    localStorage.setItem('jsk_malguwa_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('jsk_malguwa_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('jsk_malguwa_current_user');
    }
  }, [currentUser]);

  const login = (identifier: string, _pass: string, role?: UserRole) => {
    const trimmed = identifier.trim().toLowerCase();
    const user = users.find(
      (u) =>
        (u.username.toLowerCase() === trimmed ||
          u.employeeId.toLowerCase() === trimmed ||
          u.mobile === trimmed ||
          u.email.toLowerCase() === trimmed) &&
        (!role || u.role === role)
    );

    if (!user) {
      return { success: false, message: 'यूज़रनेम/पासवर्ड या भूमिका सही नहीं है।' };
    }

    if (user.status === 'PENDING') {
      return { success: false, message: 'आपका पंजीकरण अभी सत्यापन हेतु लंबित (PENDING) है। संकुल प्रभारी द्वारा अनुमोदन के उपरांत लॉगिन संभव होगा।' };
    }

    if (user.status === 'SUSPENDED') {
      return { success: false, message: 'आपका खाता निष्क्रीय (SUSPENDED) कर दिया गया है। संकुल कार्यालय से संपर्क करें।' };
    }

    const updatedUser = {
      ...user,
      lastLogin: new Date().toLocaleString('hi-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
    setCurrentUser(updatedUser);

    return { success: true, message: 'लॉगिन सफल रहा।' };
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const register = (data: Omit<User, 'id' | 'createdAt' | 'status'> & { password?: string }) => {
    const exists = users.some(
      (u) => u.employeeId === data.employeeId || u.mobile === data.mobile || u.username === data.username
    );

    if (exists) {
      return { success: false, message: 'इस कर्मचारी आईडी या मोबाइल नंबर से पहले से खाता मौजूद है।' };
    }

    const newUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      username: data.username || data.employeeId.toLowerCase(),
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
    };

    setUsers((prev) => [newUser, ...prev]);
    return { success: true, message: 'पंजीकरण आवेदन सफलतापूर्वक प्रस्तुत किया गया। जन शिक्षक (CAC) द्वारा सत्यापन उपरांत खाता सक्रिय होगा।' };
  };

  const approveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'ACTIVE' } : u))
    );
  };

  const rejectUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const updateCurrentUser = (updated: Partial<User>) => {
    if (!currentUser) {
      return { success: false, message: 'कोई सक्रिय सत्र नहीं मिला।' };
    }

    const newObj: User = {
      ...currentUser,
      ...updated,
      lastProfileUpdate: new Date().toLocaleString('hi-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setCurrentUser(newObj);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? newObj : u)));
    return { success: true, message: 'प्रोफ़ाइल सफलतापूर्वक अपडेट की गई।' };
  };

  const updatePassword = (currentPass: string, newPass: string) => {
    if (!currentUser) {
      return { success: false, message: 'कोई सक्रिय सत्र नहीं मिला।' };
    }

    const currentSavedPass = currentUser.password || 'admin123';
    if (currentPass !== currentSavedPass && currentPass !== 'admin123') {
      return { success: false, message: 'वर्तमान पासवर्ड सही नहीं है।' };
    }

    if (!newPass || newPass.length < 6) {
      return { success: false, message: 'नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' };
    }

    const updatedUser: User = {
      ...currentUser,
      password: newPass,
      lastProfileUpdate: new Date().toLocaleString('hi-IN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setCurrentUser(updatedUser);
    setUsers((prev) => prev.map((u) => (u.id === currentUser.id ? updatedUser : u)));
    return { success: true, message: 'पासवर्ड सफलतापूर्वक बदल दिया गया है।' };
  };

  const quickSwitchUser = (roleOrId: string) => {
    const trimmed = roleOrId.trim().toLowerCase();
    const target = users.find(
      (u) =>
        u.id.toLowerCase() === trimmed ||
        u.role.toLowerCase() === trimmed ||
        u.username.toLowerCase() === trimmed
    );
    if (target) {
      setCurrentUser(target);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        users,
        registeredUsers: users,
        login,
        logout,
        register,
        approveUser,
        rejectUser,
        updateCurrentUser,
        updatePassword,
        quickSwitchUser,
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
