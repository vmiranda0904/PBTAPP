import type { ReactNode } from 'react';

export default function ProtectedRoute({
  user,
  children,
  fallback = <div className="p-6 text-slate-200">Please log in</div>,
}: {
  user: object | null | undefined;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  if (!user) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
