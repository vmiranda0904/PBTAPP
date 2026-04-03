import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/services/supabase';

type UserWithRole = {
  id?: string;
  role?: string;
  authSource?: 'firestore' | 'supabase';
  user_metadata?: {
    role?: string;
  };
} | null | undefined;

export type AppUserRole = 'admin' | 'athlete' | 'coach' | 'recruiter';

export function normalizeUserRole(value?: string | null): AppUserRole | null {
  switch (value?.trim().toLowerCase()) {
    case 'admin':
      return 'admin';
    case 'coach':
      return 'coach';
    case 'recruiter':
      return 'recruiter';
    case 'athlete':
    case 'player':
    case 'parent':
      return 'athlete';
    default:
      return null;
  }
}

export function useUserRole(user: UserWithRole) {
  const userId = user?.id ?? null;
  const shouldFetchProfileRole = Boolean(user && supabase && user.authSource === 'supabase' && userId);
  const fallbackRole = useMemo(() => normalizeUserRole(user?.role ?? user?.user_metadata?.role), [user?.role, user?.user_metadata?.role]);
  const [profileState, setProfileState] = useState<{
    userId: string | null;
    role: AppUserRole | null;
    loading: boolean;
  }>({
    userId: null,
    role: null,
    loading: false,
  });

  useEffect(() => {
    let active = true;

    if (!user || !supabase || user.authSource !== 'supabase' || !userId) {
      return () => {
        active = false;
      };
    }

    void (async () => {
      setProfileState({ userId, role: null, loading: true });

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();

      if (!active) {
        return;
      }

      if (error) {
        console.error('Unable to load user role from profiles:', error);
      }

      setProfileState({
        userId,
        role: error ? null : normalizeUserRole(data?.role),
        loading: false,
      });
    })();

    return () => {
      active = false;
    };
  }, [user, userId]);

  return {
    role: profileState.userId === userId && profileState.role ? profileState.role : fallbackRole,
    loading: shouldFetchProfileRole && (profileState.userId !== userId || profileState.loading),
  };
}
