/**
 * অ্যাপ ভিউ স্টোর — এক রুটে (/) পাঁচটি ভিউ:
 *   landing → পাবলিক ল্যান্ডিং পেজ (SEO প্রথম-ইমপ্রেশন)
 *   studio  → এডিটর (ব্যবহারকারী একবার ঢুকলে মনে থাকে)
 *   share   → রিড-অনলি শেয়ার ভিউ (?share=<token>)
 *   stats   → অ্যানালিটিক্স ড্যাশবোর্ড (?stats=1)
 *   pack    → প্যাক-ভিউয়ার (?pack=<payload>) — লিংক দিয়ে প্যাক বিতরণ (দিন ৬২)
 *
 * URL হ্যাশ/কুয়েরি শুধু প্রথম লোডে পড়া হয় — এরপর ক্লায়েন্ট স্টেটে চলে
 * (পুরো অ্যাপ ক্লায়েন্ট-অনলি, তাই সার্ভার রাউট ছাড়াই সব ঠিকঠাক)।
 */

'use client';

import { create } from 'zustand';
import { track } from './analytics';

export type AppView = 'landing' | 'studio' | 'share' | 'stats' | 'pack';

const VIEW_KEY = 'bwp-view';

interface ViewState {
  view: AppView;
  shareToken: string | null;
  /** ?pack= পেলোড — প্যাক-ভিউয়ার ডিকোড করে */
  packPayload: string | null;
  /** প্রথম মাউন্টে URL/localStorage থেকে ভিউ নির্ধারণ */
  initFromUrl: () => void;
  goStudio: () => void;
  goLanding: () => void;
  goStats: () => void;
}

export const useViewStore = create<ViewState>((set) => ({
  view: 'landing',
  shareToken: null,
  packPayload: null,
  initFromUrl: () => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const pack = sp.get('pack');
      if (pack) {
        set({ view: 'pack', packPayload: pack });
        return;
      }
      const share = sp.get('share');
      if (share) {
        set({ view: 'share', shareToken: share });
        return;
      }
      if (sp.get('stats') === '1') {
        set({ view: 'stats' });
        return;
      }
      const saved = window.localStorage.getItem(VIEW_KEY);
      set({ view: saved === 'studio' ? 'studio' : 'landing' });
    } catch {
      set({ view: 'landing' });
    }
  },
  goStudio: () => {
    try { window.localStorage.setItem(VIEW_KEY, 'studio'); } catch { /* ignore */ }
    try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
    set({ view: 'studio' });
    track('studio_open');
  },
  goLanding: () => {
    try { window.localStorage.setItem(VIEW_KEY, 'landing'); } catch { /* ignore */ }
    try { window.history.replaceState(null, '', '/'); } catch { /* ignore */ }
    set({ view: 'landing' });
  },
  goStats: () => {
    try { window.history.replaceState(null, '', '/?stats=1'); } catch { /* ignore */ }
    set({ view: 'stats' });
  },
}));
