import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { normalizeUserRole, type AppUserRole } from '@/modules/auth/useUserRole';
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

function formatRoleLabel(role: AppUserRole) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'coach':
      return 'Coach';
    case 'recruiter':
      return 'Recruiter';
    case 'athlete':
    default:
      return 'Athlete';
  }
}

function toSupabaseErrorMessage(error: { message?: string } | null | undefined, fallback: string) {
  const message = error?.message?.trim();
  return message ? message : fallback;
}

async function upsertSupabaseProfile(user: SupabaseUser, {
  email,
  name,
  role,
  teamId,
}: {
  email: string;
  name: string;
  role: AppUserRole;
  teamId: string;
}) {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    email,
    full_name: name,
    role,
    team_id: teamId,
  });

  if (error) {
    throw error;
  }
}

async function resolveSupabaseAuthUser(user: SupabaseUser) {
  const authUser = toSupabaseAuthUser(user);

  if (!supabase) {
    return authUser;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error(`Unable to hydrate Supabase user role for ${user.id}:`, error);
    return authUser;
  }

  const normalizedRole = normalizeUserRole(data?.role);

  if (!normalizedRole) {
    return authUser;
  }

  return {
    ...authUser,
    role: formatRoleLabel(normalizedRole),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      setIsLoading(false);
      return undefined;
    }

    let active = true;

    const syncSupabaseSession = async (sessionUser: SupabaseUser | null) => {
      if (!active) {
        return;
      }

      if (!sessionUser) {
        setUser((currentUser) => (currentUser?.authSource === 'supabase' ? null : currentUser));
        setIsLoading(false);
        return;
      }

      const nextUser = await resolveSupabaseAuthUser(sessionUser);

      if (!active) {
        return;
      }

      setUser(nextUser);
      setIsLoading(false);
    };

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        setIsLoading(false);
        return;
      }

      void syncSupabaseSession(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      void syncSupabaseSession(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = normalizeUserRole(user?.role) === 'admin';
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
    const normalizedEmail = email.trim().toLowerCase();

    try {
      let supabaseLoginError: string | null = null;

      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (data.user) {
          setUser(await resolveSupabaseAuthUser(data.user));
          return { success: true };
        }

        if (error) {
          supabaseLoginError = toSupabaseErrorMessage(error, 'Unable to sign in with Supabase.');
        }
      }

      const dbUser = await getUserByEmail(normalizedEmail);

      if (!dbUser) {
        return { success: false, message: supabaseLoginError ?? 'No account found with that email address.' };
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
        const trimmedTeamName = fields.teamName?.trim();
        if (!trimmedTeamName) {
          return { success: false, message: 'Please enter a team name to create a new team.' };
        }
        const team = await createTeam(trimmedTeamName, fields.email);
        teamId = team.id;
        isTeamCreator = true;
        returnedTeamCode = team.teamCode;
      }

      const shouldAutoApprove = isTeamCreator || isAdminEmail;
      const normalizedRole = shouldAutoApprove ? 'admin' : normalizeUserRole(fields.role) ?? 'athlete';
      const legacyRole = formatRoleLabel(normalizedRole);
      const settings = await getAppSettings();

      if (supabase) {
        const displayName = fields.name.trim();
        const { data, error } = await supabase.auth.signUp({
          email: emailNorm,
          password: fields.password,
          options: {
            data: {
              name: displayName,
              avatar: getInitials(displayName),
              role: normalizedRole,
              teamId,
            },
          },
        });

        if (error || !data.user) {
          return {
            success: false,
            message: toSupabaseErrorMessage(error, 'Unable to create your account.'),
          };
        }

        await upsertSupabaseProfile(data.user, {
          email: emailNorm,
          name: displayName,
          role: normalizedRole,
          teamId,
        });

        if (data.session?.user) {
          setUser(await resolveSupabaseAuthUser(data.session.user));
        }

        return {
          success: true,
          emailSent: true,
          autoApproved: true,
          teamCode: returnedTeamCode,
          isAdminRegistration: normalizedRole === 'admin',
        };
      }

      const newUser = await createRegistration(
        { ...fields, teamId, role: legacyRole },
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
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
