'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, Menu, UserCircle, X } from 'lucide-react';
import { useAuthStore } from '@/features/auth/auth-store';
import { routes } from '@/lib/routes';
import { getBadgeCounts, getMyProfile } from '@/features/provider-portal/provider-portal-api';
import { useProviderBadgeStore } from '@/features/provider-portal/provider-badge-store';
import { useProviderNavSocket } from '@/hooks/use-provider-nav-socket';

type Props = { activePath: string };

export function ProviderNav({ activePath }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? '';
  const [open, setOpen] = useState(false);

  const clearAuth = useAuthStore((s) => s.clearAuth);
  const accessToken = useAuthStore((s) => s.accessToken);

  const marketplace = useProviderBadgeStore((s) => s.marketplace);
  const direct = useProviderBadgeStore((s) => s.direct);
  const profileId = useProviderBadgeStore((s) => s.profileId);
  const setMarketplace = useProviderBadgeStore((s) => s.setMarketplace);
  const setDirect = useProviderBadgeStore((s) => s.setDirect);
  const setProfileId = useProviderBadgeStore((s) => s.setProfileId);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getBadgeCounts(), getMyProfile()])
      .then(([counts, profile]) => {
        if (cancelled) return;
        setMarketplace(counts.marketplaceCount);
        setDirect(counts.directCount);
        setProfileId(profile.id);
      })
      .catch(() => null);
    return () => { cancelled = true; };
  }, [setMarketplace, setDirect, setProfileId]);

  useProviderNavSocket(accessToken, profileId, pathname);

  // Close the mobile drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  function handleLogout() {
    clearAuth();
    router.push(routes.auth.login);
  }

  const NAV_LINKS = [
    { href: routes.provider.dashboard,   label: 'Dashboard',   badge: 0 },
    { href: routes.provider.marketplace, label: 'Marketplace', badge: marketplace },
    { href: routes.provider.myRequests,  label: 'My Requests', badge: direct },
    { href: routes.provider.myRoutes,    label: 'My Routes',   badge: 0 },
    { href: routes.provider.agents,      label: 'Agents',      badge: 0 },
  ];

  return (
    <>
      <nav className="border-b border-border bg-surface px-4 py-3">
        <div className="mx-auto flex max-w-5xl items-center gap-4 text-sm">
          {/* Brand */}
          <span className="font-semibold text-foreground">DeliGo Provider</span>

          {/* Desktop links */}
          <div className="hidden md:flex md:gap-5">
            {NAV_LINKS.map(({ href, label, badge }) => (
              <NavLink key={href} href={href} active={activePath === href} badge={badge}>
                {label}
              </NavLink>
            ))}
          </div>

          {/* Desktop right actions */}
          <div className="ml-auto hidden items-center gap-1 md:flex">
            <ProfileLink />
            <LogoutButton onLogout={handleLogout} />
          </div>

          {/* Mobile: hamburger */}
          <button
            type="button"
            className="ml-auto rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground md:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="border-b border-border bg-surface md:hidden">
          <div className="mx-auto max-w-5xl space-y-0.5 px-4 py-2">
            {NAV_LINKS.map(({ href, label, badge }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium ${
                  activePath === href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {label}
                {badge > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="flex gap-2 border-t border-border pt-2 pb-1">
              <ProfileLink mobile />
              <LogoutButton onLogout={handleLogout} mobile />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function NavLink({
  href,
  active,
  badge,
  children,
}: {
  href: string;
  active: boolean;
  badge: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 ${
        active ? 'font-medium text-primary' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
      {badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </Link>
  );
}

function ProfileLink({ mobile }: { mobile?: boolean }) {
  return (
    <Link
      href={routes.provider.myProfile}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground ${mobile ? 'flex-1 text-sm' : ''}`}
    >
      <UserCircle size={16} />
      <span>Profile</span>
    </Link>
  );
}

function LogoutButton({ onLogout, mobile }: { onLogout: () => void; mobile?: boolean }) {
  return (
    <button
      type="button"
      onClick={onLogout}
      className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground ${mobile ? 'flex-1 text-sm' : ''}`}
      aria-label="Log out"
    >
      <LogOut size={16} />
      <span>Logout</span>
    </button>
  );
}
