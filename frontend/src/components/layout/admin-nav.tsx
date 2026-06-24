'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, PackageCheck, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { routes } from '@/lib/routes';

const LINKS = [
  { href: routes.admin.dashboard,      label: 'Dashboard',     key: 'dashboard' },
  { href: routes.admin.verifications,  label: 'Verifications', key: 'verifications' },
  { href: routes.admin.providers,      label: 'Providers',     key: 'providers' },
  { href: routes.admin.requests,       label: 'Requests',      key: 'requests' },
  { href: routes.admin.users,          label: 'Users',         key: 'users' },
  { href: routes.admin.reports,        label: 'Reports',       key: 'reports' },
];

export function AdminNav({ active }: { active: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [open, setOpen] = useState(false);

  // Close drawer on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  function handleLogout() {
    clearAuth();
    router.push(routes.auth.login);
  }

  return (
    <>
      <nav className="border-b border-border bg-surface px-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-3">
          {/* Brand */}
          <Link href={routes.admin.dashboard} className="flex shrink-0 items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <PackageCheck size={17} aria-hidden="true" />
            </span>
            <span className="text-sm font-bold text-foreground">DeliGo Admin</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  active === l.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground md:inline-flex"
          >
            <LogOut size={15} />
            Logout
          </button>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-b border-border bg-surface md:hidden">
          <div className="mx-auto max-w-6xl space-y-0.5 px-4 py-2">
            {LINKS.map((l) => (
              <Link
                key={l.key}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block rounded-md px-3 py-2.5 text-sm font-medium ${
                  active === l.key
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="border-t border-border pt-2 pb-1">
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
