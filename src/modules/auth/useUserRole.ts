import { useEffect, useState } from 'react';
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
  const [role, setRole] = useState<AppUserRole | null>(() => normalizeUserRole(user?.role ?? user?.user_metadata?.role));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fallbackRole = normalizeUserRole(user?.role ?? user?.user_metadata?.role);

    if (!user) {
      setRole(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    if (!supabase || user.authSource !== 'supabase' || !user.id) {
      setRole(fallbackRole);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);

    void supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) {
          return;
        }

        if (error) {
          setRole(fallbackRole);
          setLoading(false);
          return;
        }

        setRole(normalizeUserRole(data?.role ?? user.user_metadata?.role ?? user.role));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  return { role, loading };
}
