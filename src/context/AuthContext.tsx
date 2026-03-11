import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  getUserByEmail,
  createRegistration,
  verifyPassword,
  adminUpdateUserStatus,
  subscribeToPendingUsers,
  type RegisteredUser,
} from '../lib/userService';
import { sendApprovalEmail } from '../lib/emailService';
import { getAppSettings } from '../lib/settingsService';
import { showBrowserNotification } from '../lib/pushNotificationService';

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
  approveUser: (uid: string, status: 'approved' | 'rejected') => Promise<boolean>;
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

  // ── Admin-side pending-user watcher ─────────────────────────────────────────
  // When the admin is logged in and push notifications are enabled, subscribe to
  // real-time Firestore updates for pending users. Each newly-pending user triggers
  // a browser notification directly in the admin's session.
  const seenPendingIds = useRef<Set<string>>(new Set());
  const isFirstSnapshot = useRef(true);
  useEffect(() => {
    if (!isAdmin) return;

    seenPendingIds.current = new Set();
    isFirstSnapshot.current = true;

    let unsubscribe: (() => void) | null = null;
    let active = true;

    getAppSettings().then(settings => {
      if (!active || !settings.pushNotificationsEnabled) return;

      unsubscribe = subscribeToPendingUsers((users: RegisteredUser[]) => {
        if (isFirstSnapshot.current) {
          // Seed the set with existing pending users so we only notify for new ones
          users.forEach(u => seenPendingIds.current.add(u.id));
          isFirstSnapshot.current = false;
          return;
        }

        for (const u of users) {
          if (!seenPendingIds.current.has(u.id)) {
            seenPendingIds.current.add(u.id);
            showBrowserNotification(
              'New Sign-Up Request',
              `${u.name} (${u.role}) wants to join PBT Sports.`,
              `signup-${u.id}`,
            );
          }
        }
      });
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

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

    // Check app-wide approval setting before creating the registration
    const settings = await getAppSettings();
    const newUser = await createRegistration(fields, settings.requireApproval);

    let emailSent = true;
    if (newUser.status === 'pending') {
      // Send approval email to admin
      try {
        await sendApprovalEmail(newUser);
      } catch {
        emailSent = false;
      }
      // Push notification to the admin is handled by the Firestore real-time
      // listener set up in the admin's browser session (see useEffect at line 82
      // in AuthContext.tsx).
    }

    return { success: true, emailSent, autoApproved: newUser.status === 'approved' };
  };

  const approveUser = async (uid: string, status: 'approved' | 'rejected'): Promise<boolean> => {
    const result = await adminUpdateUserStatus(uid, status);
    return result.success;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, approveUser, isAuthenticated: !!user, isAdmin }}>
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
