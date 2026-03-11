import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getUserByEmail,
  createRegistration,
  verifyPassword,
  type RegisteredUser,
} from '../lib/userService';
import { sendApprovalEmail } from '../lib/emailService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  avatar: string;
  role: string;
  email: string;
}

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

export type RegisterResult =
  | { success: true; emailSent: boolean; autoApproved: boolean }
  | { success: false; message: string };

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (fields: {
    name: string;
    email: string;
    password: string;
    role: string;
  }) => Promise<RegisterResult>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pbt_auth_user';
const ADMIN_EMAIL = ((import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '').toLowerCase().trim();

function toAuthUser(u: RegisteredUser): AuthUser {
  return { id: u.id, name: u.name, avatar: u.avatar, role: u.role, email: u.email };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as AuthUser) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const isAdmin = !!user && !!ADMIN_EMAIL && user.email.toLowerCase() === ADMIN_EMAIL;

  const login = async (email: string, password: string): Promise<LoginResult> => {
    const dbUser = await getUserByEmail(email);

    if (!dbUser) {
      return { success: false, message: 'No account found with that email address.' };
    }

    const passwordOk = await verifyPassword(password, dbUser.passwordHash, dbUser.passwordSalt);
    if (!passwordOk) {
      return { success: false, message: 'Invalid email or password. Please try again.' };
    }

    if (dbUser.status === 'pending') {
      return {
        success: false,
        message: 'Your account is pending approval. You will be notified once approved.',
      };
    }

    if (dbUser.status === 'rejected') {
      return {
        success: false,
        message: 'Your account request was not approved. Please contact the administrator.',
      };
    }

    setUser(toAuthUser(dbUser));
    return { success: true };
  };

  const register = async (fields: {
    name: string;
    email: string;
    password: string;
    role: string;
  }): Promise<RegisterResult> => {
    const existing = await getUserByEmail(fields.email);
    if (existing) {
      return { success: false, message: 'An account with that email already exists.' };
    }

    const newUser = await createRegistration(fields);

    let emailSent = true;
    // Admin accounts are auto-approved — no approval email needed
    if (newUser.status === 'pending') {
      try {
        await sendApprovalEmail(newUser);
      } catch {
        emailSent = false;
      }
    }

    return { success: true, emailSent, autoApproved: newUser.status === 'approved' };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
