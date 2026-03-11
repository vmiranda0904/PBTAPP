import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  getUserByEmail,
  createRegistration,
  verifyPassword,
  adminUpdateUserStatus,
  subscribeToPendingUsers,
  type RegisteredUser,
} from '../lib/userService';
import { createTeam, getTeamByCode } from '../lib/teamService';
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
  teamId: string;
}

export type LoginResult =
  | { success: true }
  | { success: false; message: string };

export type RegisterResult =
  | { success: true; emailSent: boolean; autoApproved: boolean; teamCode?: string; isAdminRegistration: boolean }
  | { success: false; message: string };

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (fields: {
    name: string;
    email: string;
    password: string;
    role: string;
    /** Provide to join an existing team; omit to create a new team. */
    teamCode?: string;
    /** Required when creating a new team (teamCode is absent). */
    teamName?: string;
  }) => Promise<RegisterResult>;
  logout: () => void;
  approveUser: (uid: string, status: 'approved' | 'rejected') => Promise<boolean>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'pbt_auth_user';
const ADMIN_EMAIL_ENV = ((import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '').toLowerCase().trim();

function toAuthUser(u: RegisteredUser): AuthUser {
  return { id: u.id, name: u.name, avatar: u.avatar, role: u.role, email: u.email, teamId: u.teamId };
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

  // A user is an admin when their role is 'Admin'.
  const isAdmin = !!user && user.role === 'Admin';

  // ── Admin-side pending-user watcher ─────────────────────────────────────────
  // When the admin is logged in and push notifications are enabled, subscribe to
  // real-time Firestore updates for pending users. Each newly-pending user triggers
  // a browser notification directly in the admin's session.
  const seenPendingIds = useRef<Set<string>>(new Set());
  const isFirstSnapshot = useRef(true);
  useEffect(() => {
    if (!isAdmin || !user) return;

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
              `${u.name} (${u.role}) wants to join your team.`,
              `signup-${u.id}`,
            );
          }
        }
      }, user.teamId);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const dbUser = await getUserByEmail(email.trim());

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
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Unable to sign in. Please check your connection and try again.' };
    }
  };

  const register = async (fields: {
    name: string;
    email: string;
    password: string;
    role: string;
    teamCode?: string;
    teamName?: string;
  }): Promise<RegisterResult> => {
    try {
      const existing = await getUserByEmail(fields.email);
      if (existing) {
        return { success: false, message: 'An account with that email already exists.' };
      }

      let teamId: string;
      let isTeamCreator = false;
      let teamAdminEmail: string | undefined;
      let returnedTeamCode: string | undefined;

      const emailNorm = fields.email.toLowerCase().trim();
      const isAdminEmail = !!ADMIN_EMAIL_ENV && emailNorm === ADMIN_EMAIL_ENV;

      if (fields.teamCode) {
        // ── Join existing team ──────────────────────────────────────────────────
        const team = await getTeamByCode(fields.teamCode);
        if (!team) {
          return { success: false, message: 'No team found with that code. Please check and try again.' };
        }
        teamId = team.id;
        teamAdminEmail = team.adminEmail;
      } else {
        // ── Create new team ─────────────────────────────────────────────────────
        const name = fields.teamName?.trim();
        if (!name) {
          return { success: false, message: 'Please enter a team name to create a new team.' };
        }
        const team = await createTeam(name, fields.email);
        teamId = team.id;
        isTeamCreator = true;
        returnedTeamCode = team.teamCode;
      }

      // The designated admin email is always auto-approved (bypasses the approval queue)
      const shouldAutoApprove = isTeamCreator || isAdminEmail;

      // Check app-wide approval setting before creating the registration
      const settings = await getAppSettings();
      const newUser = await createRegistration(
        { ...fields, teamId, role: shouldAutoApprove ? 'Admin' : fields.role },
        shouldAutoApprove,
        settings.requireApproval,
      );

      let emailSent = true;
      if (newUser.status === 'pending') {
        // Send approval email to the team admin
        try {
          await sendApprovalEmail(newUser, teamAdminEmail);
        } catch {
          emailSent = false;
        }
        // Push notification to the admin is handled by the Firestore real-time
        // listener set up in the admin's browser session.
      }

      return {
        success: true,
        emailSent,
        autoApproved: newUser.status === 'approved',
        teamCode: returnedTeamCode,
        isAdminRegistration: newUser.role === 'Admin',
      };
    } catch (err) {
      console.error('Registration error:', err);
      return { success: false, message: 'Unable to create account. Please check your connection and try again.' };
    }
  };

  const approveUser = async (uid: string, status: 'approved' | 'rejected'): Promise<boolean> => {
    const result = await adminUpdateUserStatus(uid, status);
    return result.success;
  };

  const logout = () => {
    setUser(null);
  };

  // Expose getTeamById so components can look up team info by the logged-in user's teamId.
  // (Not added to context to keep the API minimal; components import it directly.)

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
