import Link from 'next/link';
import { PackageCheck } from 'lucide-react';
import { routes } from '@/lib/routes';

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-4">
          {/* Brand — always full width on mobile, 1 col on lg */}
          <div className="space-y-3">
            <Link href={routes.home} className="flex items-center gap-2 font-semibold text-foreground">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <PackageCheck size={17} aria-hidden="true" />
              </span>
              <span>DeliGo</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Logistics coordination for Cameroon — connecting senders, providers, and travelers.
            </p>
          </div>

          {/* Link sections — 2 per row on mobile, 3 across on lg */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-3 lg:grid-cols-3">
            {/* Services */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Services</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/request" className="hover:text-foreground">Post a Delivery</Link></li>
                <li><Link href="/providers" className="hover:text-foreground">Find a Provider</Link></li>
                <li><Link href="/track/demo" className="hover:text-foreground">Track a Package</Link></li>
              </ul>
            </div>

            {/* Providers */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">For Providers</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href={routes.auth.register} className="hover:text-foreground">Register as Provider</Link></li>
                <li><Link href={routes.auth.login} className="hover:text-foreground">Provider Login</Link></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="mb-3 text-sm font-semibold text-foreground">Support</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a href="mailto:assonfack.braynt@ictuniversity.edu.cm" className="hover:text-foreground break-all">
                    assonfack.braynt@ictuniversity.edu.cm
                  </a>
                </li>
                <li>
                  <a href="https://wa.me/237690000019" target="_blank" rel="noreferrer" className="hover:text-foreground">
                    WhatsApp: +237 690 000 019
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 space-y-3 text-center text-xs text-muted-foreground">
          <p className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs leading-5">
            <span className="font-semibold text-foreground">Academic Project Disclaimer:</span>{' '}
            DeliGo is a student project developed at ICT University as part of an academic programme.
            It is intended solely for educational and demonstration purposes. No real deliveries are
            fulfilled through this platform, and no financial transactions are processed.
          </p>
          <p>&copy; {new Date().getFullYear()} DeliGo. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
