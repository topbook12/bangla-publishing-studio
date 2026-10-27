/**
 * হেডার অ্যাকাউন্ট বাটন — সাইন-ইন থাকলে অ্যাভাটার মেনু (ক্লাউড ডকুমেন্ট,
 * সাইন আউট), না থাকলে "সাইন ইন" বোতাম। সেশন bwp-session-updated ইভেন্টে
 * রিফ্রেশ হয় (signIn রিডাইরেক্টহীন ফ্লোতে তাৎক্ষণিক আপডেটের জন্য)।
 */

'use client';

import { useEffect, useState } from 'react';
import { Cloud, Crown, LogIn, LogOut } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useT } from '@/lib/i18n';
import { useUiStore } from '@/lib/ui-store';
import { AuthDialog } from './auth-dialog';

export function AccountButton() {
  const tt = useT();
  const { data: session, status, update } = useSession();
  const openDialog = useUiStore((s) => s.open);
  const [authOpen, setAuthOpen] = useState(false);

  // ডেমো signIn (redirect:false) শেষে কাস্টম ইভেন্ট আসে — সেশন রিফ্রেশ
  useEffect(() => {
    const handler = () => void update();
    window.addEventListener('bwp-session-updated', handler);
    return () => window.removeEventListener('bwp-session-updated', handler);
  }, [update]);

  // ফেজ-৪ — অন্য কোথাও (বিলিং ডায়ালগ ইত্যাদি) থেকে 'সাইন ইন' খোলার ইভেন্ট
  useEffect(() => {
    const openAuth = () => setAuthOpen(true);
    window.addEventListener('bwp-open-auth', openAuth);
    return () => window.removeEventListener('bwp-open-auth', openAuth);
  }, []);

  const user = session?.user;

  return (
    <div data-tour="account" className="flex items-center">
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="header-action gap-1.5 px-1.5 max-sm:h-11 max-sm:w-11 max-sm:px-0"
              aria-label={tt('auth.account')}
            >
              <Avatar className="h-6 w-6">
                <AvatarImage src={user.image ?? undefined} alt="" />
                <AvatarFallback className="bg-emerald-700 text-[10px] font-bold text-white">
                  {(user.name ?? user.email ?? '?').slice(0, 1).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-24 truncate lg:inline">{user.name ?? user.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              {tt('auth.signedin.as')}
              <span className="mt-0.5 block truncate text-sm font-semibold text-foreground">
                {user.email ?? user.name}
              </span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => openDialog('cloud')}>
              <Cloud size={14} /> {tt('auth.cloud.docs')}
            </DropdownMenuItem>
            {/* ফেজ-৪ — প্ল্যান ও বিলিং কেন্দ্র */}
            <DropdownMenuItem onClick={() => openDialog('billing')} data-tour="billing">
              <Crown size={14} /> {tt('bill.menu')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => void signOut({ callbackUrl: '/' })}
            >
              <LogOut size={14} /> {tt('auth.signout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="header-action gap-1.5"
          aria-label={tt('auth.signin')}
          onClick={() => setAuthOpen(true)}
          disabled={status === 'loading'}
        >
          <LogIn size={14} />
          <span className="hidden sm:inline">{tt('auth.signin')}</span>
        </Button>
      )}

      {/* AuthDialog — সাইন-ইন থাকলে মাউন্টই হয় না */}
      {!user ? (
        <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
      ) : null}
    </div>
  );
}
