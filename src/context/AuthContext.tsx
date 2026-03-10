import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getUserByEmail,
  createRegistration,
  verifyPassword,
  type RegisteredUser,
} from '../lib/userService';
import { send as emailjsSend } from '@emailjs/browser';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  avatar: string;
  position: string;
  email: string;
}

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

export type RegisterResult =
  | { success: true; emailSent: boolean }
  | { success: false; message: string };

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (fields: {
    name: string;
    email: string;
    password: string;
    position: string;
  }) => Promise<RegisterResult>;
  logout: () => void;
  isAuthenticated: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pbt_auth_user';
const APP_URL = (import.meta.env.VITE_APP_URL as string | undefined) ?? window.location.origin;
const BASE_PATH = import.meta.env.BASE_URL ?? '/';
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '';
const EMAILJS_SERVICE_ID = (import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined) ?? '';
const EMAILJS_TEMPLATE_ID = (import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined) ?? '';
const EMAILJS_PUBLIC_KEY = (import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined) ?? '';

function toAuthUser(u: RegisteredUser): AuthUser {
  return { id: u.id, name: u.name, avatar: u.avatar, position: u.position, email: u.email };
}

async function sendApprovalEmail(user: RegisteredUser): Promise<void> {
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) return;

  const base = `${APP_URL}${BASE_PATH}approve`;
  const approveUrl = `${base}?uid=${user.id}&token=${user.approvalToken}&action=approve`;
  const rejectUrl = `${base}?uid=${user.id}&token=${user.approvalToken}&action=reject`;

  await emailjsSend(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email: ADMIN_EMAIL,
      user_name: user.name,
      user_email: user.email,
      user_position: user.position,
      approve_url: approveUrl,
      reject_url: rejectUrl,
    },
    EMAILJS_PUBLIC_KEY
  );
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
    position: string;
  }): Promise<RegisterResult> => {
    const existing = await getUserByEmail(fields.email);
    if (existing) {
      return { success: false, message: 'An account with that email already exists.' };
    }

    const newUser = await createRegistration(fields);

    let emailSent = true;
    try {
      await sendApprovalEmail(newUser);
    } catch {
      emailSent = false;
    }

    return { success: true, emailSent };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
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
