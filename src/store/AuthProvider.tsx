import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import type { AuthContextValue, AuthUser, LoginResult, RegisterFields, RegisterResult } from '@/types/auth';
import { AuthContext } from '@/store/auth-context';
import {
  adminUpdateUserStatus,
  createRegistration,
  getUserByEmail,
  subscribeToPendingUsers,
  type RegisteredUser,
  verifyPassword,
} from '../lib/userService';
import { sendApprovalEmail } from '../lib/emailService';
import { showBrowserNotification } from '../lib/pushNotificationService';
import { getAppSettings } from '../lib/settingsService';
import { createTeam, getTeamByCode } from '../lib/teamService';

const ADMIN_EMAIL_ENV = ((import.meta.env.VITE_ADMIN_EMAIL as string | undefined) ?? '').toLowerCase().trim();
const DEFAULT_AVATAR_INITIALS = 'PB';

function getInitials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return DEFAULT_AVATAR_INITIALS;
  }

  return parts
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function toAuthUser(user: RegisteredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    avatar: user.avatar,
    role: user.role,
    email: user.email,
    teamId: user.teamId,
    authSource: 'firestore',
  };
}

function toSupabaseAuthUser(user: SupabaseUser): AuthUser {
  const metadata = user.user_metadata;
  const fallbackName = metadata.name ?? user.email?.split('@')[0] ?? 'PBT User';

  return {
    id: user.id,
    name: fallbackName,
    avatar: metadata.avatar ?? getInitials(fallbackName),
    role: metadata.role ?? 'Athlete',
    email: user.email ?? '',
    teamId: metadata.teamId ?? '',
    authSource: 'supabase',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    if (!supabase) {
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active || error || !data.session?.user) {
        return;
      }

      setUser((currentUser) => currentUser ?? toSupabaseAuthUser(data.session.user));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser((currentUser) => {
        if (session?.user) {
          return currentUser ?? toSupabaseAuthUser(session.user);
        }

        return currentUser?.authSource === 'supabase' ? null : currentUser;
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = !!user && user.role === 'Admin';
  const adminTeamId = user?.teamId;
  const seenPendingIds = useRef<Set<string>>(new Set());
  const isFirstSnapshot = useRef(true);

  useEffect(() => {
    if (!isAdmin || !user) return;

    seenPendingIds.current = new Set();
    isFirstSnapshot.current = true;

    let unsubscribe: (() => void) | null = null;
    let active = true;

    getAppSettings().then((settings) => {
      if (!active || !settings.pushNotificationsEnabled) return;

      unsubscribe = subscribeToPendingUsers((users: RegisteredUser[]) => {
        if (isFirstSnapshot.current) {
          users.forEach((pendingUser) => seenPendingIds.current.add(pendingUser.id));
          isFirstSnapshot.current = false;
          return;
        }

        for (const pendingUser of users) {
          if (!seenPendingIds.current.has(pendingUser.id)) {
            seenPendingIds.current.add(pendingUser.id);
            showBrowserNotification(
              'New Sign-Up Request',
              `${pendingUser.name} (${pendingUser.role}) wants to join your team.`,
              `signup-${pendingUser.id}`,
            );
          }
        }
      }, adminTeamId);
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminTeamId, isAdmin]);

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
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Unable to sign in. Please check your connection and try again.' };
    }
  };

  const register = async (fields: RegisterFields): Promise<RegisterResult> => {
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
        const team = await getTeamByCode(fields.teamCode);
        if (!team) {
          return { success: false, message: 'No team found with that code. Please check and try again.' };
        }
        teamId = team.id;
        teamAdminEmail = team.adminEmail;
      } else {
        const teamName = fields.teamName?.trim();
        if (!teamName) {
          return { success: false, message: 'Please enter a team name to create a new team.' };
        }
        const team = await createTeam(teamName, fields.email);
        teamId = team.id;
        isTeamCreator = true;
        returnedTeamCode = team.teamCode;
      }

      const shouldAutoApprove = isTeamCreator || isAdminEmail;
      const settings = await getAppSettings();
      const newUser = await createRegistration(
        { ...fields, teamId, role: shouldAutoApprove ? 'Admin' : fields.role },
        shouldAutoApprove,
        settings.requireApproval,
      );

      let emailSent = true;
      if (newUser.status === 'pending') {
        try {
          await sendApprovalEmail(newUser, teamAdminEmail);
        } catch {
          emailSent = false;
        }
      }

      return {
        success: true,
        emailSent,
        autoApproved: newUser.status === 'approved',
        teamCode: returnedTeamCode,
        isAdminRegistration: newUser.role === 'Admin',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, message: 'Unable to create account. Please check your connection and try again.' };
    }
  };

  const approveUser = async (uid: string, status: 'approved' | 'rejected') => {
    const result = await adminUpdateUserStatus(uid, status);
    return result.success;
  };

  const logout = () => {
    void supabase?.auth.signOut();
    setUser(null);
  };

  const value: AuthContextValue = {
    user,
    login,
    register,
    logout,
    approveUser,
    isAuthenticated: !!user,
    isAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
