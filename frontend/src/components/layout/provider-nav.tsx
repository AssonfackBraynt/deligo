'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, UserCircle } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { routes } from '@/lib/routes';

type Props = {
  activePath: string;
};

const NAV_LINKS = [
  { href: routes.provider.dashboard, label: 'Dashboard' },
  { href: routes.provider.marketplace, label: 'Marketplace' },
  { href: routes.provider.myRequests, label: 'My Requests' },
  { href: routes.provider.myRoutes, label: 'My Routes' },
  { href: routes.provider.agents, label: 'Agents' },
];

export function ProviderNav({ activePath }: Props) {
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  function handleLogout() {
    clearAuth();
    router.push(routes.auth.login);
  }

  return (
    <nav className="border-b border-border bg-surface px-4 py-3">
      <div className="mx-auto flex max-w-5xl items-center gap-6 text-sm">
        <span className="font-semibold text-foreground">DeliGo Provider</span>

        <div className="flex gap-5">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={
                activePath === href
                  ? 'font-medium text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }
            >
              {label}
            </Link>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={routes.provider.myProfile}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <UserCircle size={16} />
            <span>Profile</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Log out"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
