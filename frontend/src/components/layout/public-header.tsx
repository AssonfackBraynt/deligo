'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, PackageCheck, UserRound, X } from 'lucide-react';
import { routes } from '@/lib/routes';
import { useAuthStore, selectIsAuthenticated } from '@/features/auth/auth-store';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

export function PublicHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isProvider = useAuthStore((s) => s.user?.roles.includes('provider') ?? false);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  function handleJobsClick() {
    if (isAuthenticated && isProvider) {
      router.push(routes.provider.marketplace);
    } else {
      router.push(routes.auth.login);
    }
    setMenuOpen(false);
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
          {/* Brand */}
          <Link href={routes.home} className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageCheck size={20} aria-hidden="true" />
            </span>
            <span>DeliGo</span>
          </Link>

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium md:flex">
            <Link href="/providers" className="text-muted-foreground hover:text-foreground">Providers</Link>
            <button type="button" onClick={handleJobsClick} className="text-muted-foreground hover:text-foreground">Jobs</button>
            <Link href="/track/demo" className="text-muted-foreground hover:text-foreground">Track</Link>
          </nav>

          {/* Desktop auth buttons */}
          <div className="hidden items-center gap-2 md:flex">
            {hasHydrated && (
              isAuthenticated ? (
                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  <LogOut size={17} aria-hidden="true" />
                  Logout
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href={routes.auth.login}>
                      <UserRound size={17} aria-hidden="true" />
                      Login
                    </Link>
                  </Button>
                  <Button asChild className="bg-success hover:bg-success/90 text-white border-0">
                    <Link href={routes.auth.register}>Register</Link>
                  </Button>
                </>
              )
            )}
          </div>

          {/* Mobile: hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div className="border-t border-border bg-background md:hidden">
            <div className="mx-auto max-w-7xl space-y-0.5 px-4 py-3">
              <Link href="/providers" className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                Providers
              </Link>
              <button type="button" onClick={handleJobsClick} className="block w-full rounded-md px-3 py-2.5 text-left text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                Jobs
              </button>
              <Link href="/track/demo" className="block rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
                Track
              </Link>

              {hasHydrated && (
                <div className="flex gap-2 border-t border-border pt-3 pb-1">
                  {isAuthenticated ? (
                    <Button variant="outline" className="flex-1" onClick={() => { setMenuOpen(false); setDialogOpen(true); }}>
                      <LogOut size={16} />
                      Logout
                    </Button>
                  ) : (
                    <>
                      <Button asChild variant="outline" className="flex-1">
                        <Link href={routes.auth.login}>
                          <UserRound size={16} />
                          Login
                        </Link>
                      </Button>
                      <Button asChild className="flex-1 bg-success hover:bg-success/90 text-white border-0">
                        <Link href={routes.auth.register}>Register</Link>
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Sign out of DeliGo?"
        description="You will be returned to the login page and will need to sign in again to access your account."
      >
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
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
