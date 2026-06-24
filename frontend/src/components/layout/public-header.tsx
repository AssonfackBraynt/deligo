'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, PackageCheck, UserRound } from 'lucide-react';
import { routes } from '@/lib/routes';
import { useAuthStore, selectIsAuthenticated } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export function PublicHeader() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isProvider = useAuthStore((s) => s.user?.roles.includes('provider') ?? false);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  function handleJobsClick() {
    if (isAuthenticated && isProvider) {
      router.push(routes.provider.marketplace);
    } else {
      router.push(routes.auth.login);
    }
  }

  function handleLogout() {
    clearAuth();
    setDialogOpen(false);
    router.push(routes.auth.login);
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={routes.home}
            className="flex items-center gap-2 font-semibold text-foreground"
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageCheck size={20} aria-hidden="true" />
            </span>
            <span>DeliGo</span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/providers" className="text-muted-foreground hover:text-foreground">
              Providers
            </Link>
            <button
              type="button"
              onClick={handleJobsClick}
              className="text-muted-foreground hover:text-foreground"
            >
              Jobs
            </button>
            <Link href="/track/demo" className="text-muted-foreground hover:text-foreground">
              Track
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {/* Only render after hydration to avoid flash */}
            {hasHydrated && (
              isAuthenticated ? (
                <Button
                  variant="outline"
                  className="hidden sm:inline-flex"
                  onClick={() => setDialogOpen(true)}
                >
                  <LogOut size={17} aria-hidden="true" />
                  Logout
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" className="hidden sm:inline-flex">
                    <Link href={routes.auth.login}>
                      <UserRound size={17} aria-hidden="true" />
                      Login
                    </Link>
                  </Button>
                  <Button asChild className="hidden sm:inline-flex bg-success hover:bg-success/90 text-white border-0">
                    <Link href={routes.auth.register}>
                      Register
                    </Link>
                  </Button>
                </>
              )
            )}
          </div>
        </div>
      </header>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Sign out of DeliGo?"
        description="You will be returned to the login page and will need to sign in again to access your account."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            className="border-danger text-danger hover:bg-danger hover:border-danger hover:text-white"
            onClick={handleLogout}
          >
            <LogOut size={17} aria-hidden="true" />
            Logout
          </Button>
        </div>
      </Dialog>
    </>
  );
}
