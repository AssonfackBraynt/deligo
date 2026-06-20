'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, selectIsAuthenticated, selectIsProvider } from '@/features/auth/auth-store';

export function ProviderGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isProvider = useAuthStore(selectIsProvider);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Do nothing until Zustand has finished reading from localStorage.
    // Without this guard, the effect sees user: null on every page refresh
    // and redirects to login before the stored token is loaded.
    if (!hasHydrated) return;

    if (!isAuthenticated) {
      router.replace(`/auth/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!isProvider) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [hasHydrated, isAuthenticated, isProvider, router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
