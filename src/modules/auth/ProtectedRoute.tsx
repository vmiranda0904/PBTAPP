import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { AppUserRole } from '@/modules/auth/useUserRole';

export default function ProtectedRoute({
  user,
  role,
  allowedRoles,
  isLoading = false,
  children,
  redirectTo,
  fallback = <div className="p-6 text-slate-200">Please log in</div>,
  loadingFallback = <div className="p-6 text-slate-200">Checking access…</div>,
  unauthorizedFallback = <div className="p-6 text-slate-200">You do not have access to this page.</div>,
}: {
  user: object | null | undefined;
  role?: AppUserRole | null;
  allowedRoles?: AppUserRole[];
  isLoading?: boolean;
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
  unauthorizedFallback?: ReactNode;
}) {
  const location = useLocation();

  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (!user) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace state={{ from: location }} />;
    }
    return <>{fallback}</>;
  }

  if (allowedRoles?.length && (!role || !allowedRoles.includes(role))) {
    return <>{unauthorizedFallback}</>;
  }

  return <>{children}</>;
}
