'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, selectIsAuthenticated, selectIsAdmin, selectIsProvider } from '@/features/auth/auth-store';
import { routes } from '@/lib/routes';

/**
 * Drop this into any public page that authenticated users should leave.
 * Waits for Zustand hydration, then redirects based on role.
 * Renders nothing visible.
 */
export function AuthRedirect() {
  const router = useRouter();
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isAdmin = useAuthStore(selectIsAdmin);
  const isProvider = useAuthStore(selectIsProvider);

  useEffect(() => {
    if (!_hasHydrated || !isAuthenticated) return;
    if (isAdmin) {
      router.replace(routes.admin.dashboard);
    } else if (isProvider) {
      router.replace(routes.provider.dashboard);
    }
  }, [_hasHydrated, isAuthenticated, isAdmin, isProvider, router]);

  return null;
}
