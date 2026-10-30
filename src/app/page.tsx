'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { SessionProvider } from 'next-auth/react';
import { useViewStore } from '@/lib/view-store';
import { ShareViewer } from '@/components/share/share-viewer';
import { PackViewer } from '@/components/share/pack-viewer';
import { StatsDashboard } from '@/components/analytics/stats-dashboard';

const EditorApp = dynamic(() => import('@/components/editor-app'), {
  ssr: false,
  // ভাষা-নিরপেক্ষ লোডিং — bn/hi/en সবার আগে ব্রাউজারের ভাষা জানা যায় না
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
        role="status"
        aria-label="Loading"
      />
    </div>
  ),
});

const LandingPage = dynamic(() => import('@/components/landing/landing-page').then((m) => m.LandingPage), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center bg-stone-50">
      <span
        className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-700"
        role="status"
        aria-label="Loading"
      />
    </div>
  ),
});

/**
 * ফেজ-৩ — এক রুটে (/) পাঁচ ভিউ (পাবলিক ল্যান্ডিং / এডিটর / শেয়ার / স্ট্যাট / প্যাক):
 * - ?share=<token> → রিড-অনলি শেয়ার ভিউ
 * - ?pack=<payload> → প্যাক-ভিউয়ার (লিংক দিয়ে প্যাক বিতরণ — দিন ৬২)
 * - ?stats=1       → অ্যানালিটিক্স ড্যাশবোর্ড
 * - অন্যথায়       → ল্যান্ডিং (প্রথমবার) বা স্টুডিও (localStorage 'bwp-view')
 * SessionProvider সব ভিউর বাইরে — সাইন-ইন স্টেট সবখানে একইভাবে পাওয়া যায়।
 */
export default function Home() {
  const view = useViewStore((s) => s.view);
  const shareToken = useViewStore((s) => s.shareToken);
  const packPayload = useViewStore((s) => s.packPayload);
  const initFromUrl = useViewStore((s) => s.initFromUrl);

  useEffect(() => {
    initFromUrl();
  }, [initFromUrl]);

  return (
    <SessionProvider>
      {view === 'pack' && packPayload ? (
        <PackViewer payload={packPayload} />
      ) : view === 'share' && shareToken ? (
        <ShareViewer token={shareToken} />
      ) : view === 'stats' ? (
        <StatsDashboard />
      ) : view === 'studio' ? (
        <EditorApp />
      ) : (
        <LandingPage />
      )}
    </SessionProvider>
  );
}
