'use client';

import { Toaster as SonnerToasterBase } from '@/components/ui/sonner';

/** Sonner টোস্ট — উপরে-মাঝে, প্রিন্টে লুকানো */
export function SonnerToaster() {
  return (
    <div className="no-print">
      <SonnerToasterBase position="top-center" richColors closeButton duration={2600} />
    </div>
  );
}
