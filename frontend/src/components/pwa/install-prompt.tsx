'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function detectIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

const DISMISSED_KEY = 'deligo-pwa-dismissed-at';
const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000;

function isDismissedRecently(): boolean {
  const raw = localStorage.getItem(DISMISSED_KEY);
  if (!raw) return false;
  return Date.now() - Number(raw) < TWO_DAYS_MS;
}

export function InstallPrompt() {
  const pathname = usePathname();
  const isTrackingPage = pathname?.startsWith('/track/');
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSTip, setShowIOSTip] = useState(false);

  useEffect(() => {
    // Already running as installed PWA — nothing to show
    if (isInstalled()) return;
    // On non-tracking pages respect the 2-day dismiss window
    if (!isTrackingPage && isDismissedRecently()) return;

    if (detectIOS()) {
      setShowIOSTip(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function dismiss() {
    // On tracking page don't store — prompt reappears on every visit there
    if (!isTrackingPage) {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    setInstallEvent(null);
    setShowIOSTip(false);
  }

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') dismiss();
  }

  if (!installEvent && !showIOSTip) return null;

  /* ── iOS tip ────────────────────────────────────────────────────────────── */
  if (showIOSTip) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-24 left-1/2 z-50 w-80 -translate-x-1/2 rounded-xl border border-border bg-background p-4 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Download size={18} aria-hidden="true" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install DeliGo</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              Tap the{' '}
              <span className="inline-flex items-center gap-0.5 font-semibold text-foreground">
                <Share size={12} aria-hidden="true" />
                Share
              </span>{' '}
              button in Safari, then choose{' '}
              <span className="font-semibold text-foreground">"Add to Home Screen"</span> to install
              the app on your iPhone.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install tip"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        {/* Downward arrow pointing toward bottom bar */}
        <div className="absolute -bottom-[9px] left-1/2 -translate-x-1/2 size-4 rotate-45 border-b border-r border-border bg-background" />
      </div>
    );
  }

  /* ── Android / Chrome install banner ───────────────────────────────────── */
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-50 w-80 -translate-x-1/2 rounded-xl border border-border bg-background p-4 shadow-xl"
    >
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Download size={18} aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install DeliGo</p>
          <p className="text-xs text-muted-foreground">
            Add to your home screen for instant access — works like a native app.
          </p>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={dismiss}>
          Not now
        </Button>
        <Button type="button" size="sm" onClick={handleInstall}>
          <Download size={15} aria-hidden="true" />
          Install
        </Button>
      </div>
    </div>
  );
}
