/**
 * সাইন-ইন ডায়ালগ — ইমেইল (ডেমো) + Google (কনফিগার থাকলে)
 * next-auth/react-এর signIn ব্যবহার করে; সফল হলে সেশন রিফ্রেশ হয়।
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, LogIn, Mail } from 'lucide-react';
import { getProviders, signIn } from 'next-auth/react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useT } from '@/lib/i18n';
import { toast } from 'sonner';

export function AuthDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tt = useT();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [googleOn, setGoogleOn] = useState(false);

  // next-auth v4 — প্রোভাইডার তালিকা নন-হুক API (getProviders) দিয়ে আনা হয়
  useEffect(() => {
    if (!open) return;
    let alive = true;
    void getProviders().then((p) => {
      if (alive) setGoogleOn(Boolean(p?.google));
    });
    return () => { alive = false; };
  }, [open]);

  const doEmail = async () => {
    const mail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) {
      setErr(tt('auth.invalid.email'));
      return;
    }
    setErr(null);
    setBusy(true);
    try {
      const res = await signIn('demo', {
        email: mail,
        name: name.trim(),
        callbackUrl: '/',
        redirect: false,
      });
      if (res?.error) {
        setErr(tt('auth.error'));
      } else {
        toast.success(tt('auth.signin') + ' ✓');
        onClose();
        // হেডার/ডায়ালগ রিফ্রেশের জন্য সফট রিলোড — সেশন সর্বত্র পৌঁছায়
        window.dispatchEvent(new Event('bwp-session-updated'));
      }
    } catch {
      setErr(tt('auth.error'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LogIn size={17} className="text-emerald-700" aria-hidden="true" /> {tt('auth.title')}
          </DialogTitle>
          <DialogDescription>{tt('auth.desc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="text-xs font-semibold text-muted-foreground">
              {tt('auth.email')} *
            </label>
            <Input
              id="auth-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={tt('auth.email.ph')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void doEmail(); }}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="auth-name" className="text-xs font-semibold text-muted-foreground">
              {tt('auth.name')}
            </label>
            <Input
              id="auth-name"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void doEmail(); }}
            />
          </div>

          {err ? <p className="text-xs font-medium text-red-600" role="alert">{err}</p> : null}

          <Button
            onClick={() => void doEmail()}
            disabled={busy}
            className="w-full gap-2 bg-emerald-700 hover:bg-emerald-800"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            {tt('auth.continue')}
          </Button>

          {googleOn ? (
            <>
              <div className="flex items-center gap-2 py-1" aria-hidden="true">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[11px] text-muted-foreground">{tt('auth.or')}</span>
                <span className="h-px flex-1 bg-border" />
              </div>
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => void signIn('google', { callbackUrl: '/' })}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52Z" />
                </svg>
                {tt('auth.google')}
              </Button>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
