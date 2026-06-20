import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import { routes } from '@/lib/routes';

const LINKS = [
  { href: routes.admin.dashboard, label: 'Dashboard', key: 'dashboard' },
  { href: routes.admin.verifications, label: 'Verifications', key: 'verifications' },
  { href: routes.admin.providers, label: 'Providers', key: 'providers' },
  { href: routes.admin.requests, label: 'Requests', key: 'requests' },
  { href: routes.admin.users, label: 'Users', key: 'users' },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="border-b border-border bg-surface px-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 py-3">
        <Link href={routes.admin.dashboard} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PackageCheck size={17} aria-hidden="true" />
          </span>
          <span className="text-sm font-bold text-foreground">DeliGo Admin</span>
        </Link>
        <div className="flex items-center gap-1 overflow-x-auto">
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
      </div>
    </nav>
  );
}
