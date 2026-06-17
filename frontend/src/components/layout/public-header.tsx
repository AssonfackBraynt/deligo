import Link from 'next/link';
import { PackageCheck, Search, UserRound } from 'lucide-react';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={routes.home} className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <PackageCheck size={20} aria-hidden="true" />
          </span>
          <span>DeliGo</span>
        </Link>
        <nav aria-label="Primary" className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/providers" className="text-muted-foreground hover:text-foreground">
            Providers
          </Link>
          <Link href="/carrier/jobs" className="text-muted-foreground hover:text-foreground">
            Jobs
          </Link>
          <Link href="/track/demo" className="text-muted-foreground hover:text-foreground">
            Track
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Search providers">
            <Link href="/providers">
              <Search size={19} aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/auth/login">
              <UserRound size={17} aria-hidden="true" />
              Login
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
