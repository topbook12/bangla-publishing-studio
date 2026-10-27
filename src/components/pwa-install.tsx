'use client';

/**
 * PWA install prompt — ফেজ-৬ (দিন ৫১–৬০)
 *
 * beforeinstallprompt ধরে রাখে এবং নন-ইনট্রুসিভ প্রিমিয়াম ব্যানারে দেখায়:
 *  - শুধু ইনস্টল-সাপোর্টেড ব্রাউজারে (event পেলেই), standalone মোডে লুকানো
 *  - ১২ সেকেন্ড দেরি — ইউজার প্রথমে অ্যাপটা দেখুক
 *  - "Not now" → ৭ দিন পরে আবার (localStorage টাইমস্ট্যাম্প)
 *  - ইনস্টল শেষ হলে স্বয়ংক্রিয় অদৃশ্য (appinstalled + display-mode watch)
 * সাইলেন্ট no-op: dev/অসমর্থক ব্রাউজারে কিছুই রেন্ডার করে না।
 */

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'bwp-install-dismissed-at';
const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 12_000;

export default function PwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return;

    const standalone = window.matchMedia(
      '(display-mode: standalone)',
    ).matches;
    if (standalone) return;

    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const dismissedRecently =
      dismissedAt > 0 &&
      Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    if (dismissedRecently) return;

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      window.setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    setInstalling(true);
    try {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setVisible(false);
    } catch {
      // নীরব — ব্যানার থাকবে, ইউজার পরে আবার চেষ্টা করতে পারবে
    } finally {
      setInstalling(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // private mode — সেশনেই শেষ
    }
  };

  if (!visible || !deferred) return null;

  return (
    <div
      role="dialog"
      aria-label="Install app"
      className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300 max-sm:bottom-3 max-sm:left-3 max-sm:right-3 max-sm:w-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <Download className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug">
              Install বাংলা পাবলিশিং স্টুডিও
            </p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Full editor on your device — works completely offline.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={install}
                disabled={installing}
                className="inline-flex h-8 items-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
              >
                {installing ? 'Installing…' : 'Install'}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="inline-flex h-8 items-center rounded-md px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Not now
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss install banner"
            className="-mr-1 -mt-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
