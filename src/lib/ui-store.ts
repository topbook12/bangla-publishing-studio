/**
 * UI ডায়ালগ ও লেআউট স্টেট (আলাদা রাখা হয়েছে এডিটর স্টোর থেকে)
 *
 * নেভিগেটর/ফোকাস-মোড অবস্থা localStorage-এ সংরক্ষিত — পরের সেশনেও মনে থাকে।
 * (ক্লায়েন্ট-অনলি অ্যাপ, তবু SSR/প্রাইভেট-মোড সুরক্ষায় window গার্ড রাখা হয়েছে।)
 */

'use client';

import { create } from 'zustand';

export type DialogName =
  | 'headerFooter'
  | 'cover'
  | 'projects'
  | 'review'
  | 'pageChrome'
  | 'templates'
  | 'findReplace'
  | 'snapshots'
  | 'krutiConverter'
  | 'aiVision'
  | 'aiSettings'
  | 'assetStore'
  | 'help';

/** AI ডায়ালগের কোন ট্যাব নিয়ে খুলবে */
export type AiVisionTab = 'vision' | 'text';

/** localStorage থেকে '1'/'0' ফ্ল্যাগ পড়া — ব্যর্থ হলে fallback */
function readBoolFlag(key: string, fallback: boolean): boolean {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = window.localStorage.getItem(key);
    if (raw === '1') return true;
    if (raw === '0') return false;
    return fallback;
  } catch {
    return fallback;
  }
}

/** localStorage-এ '1'/'0' ফ্ল্যাগ লেখা — ব্যর্থ হলে চুপচাপ এড়িয়ে যাওয়া */
function writeBoolFlag(key: string, value: boolean): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value ? '1' : '0');
  } catch {
    // প্রাইভেট মোড/কোটা ত্রুটি — UI অবস্থা তো মেমোরিতেই আছে
  }
}

interface UiState {
  openDialog: DialogName | null;
  /** pageChrome ডায়ালগ কোন পাতার জন্য খোলা হয়েছে */
  pageChromeId: string | null;
  /** AI ডায়ালগের প্রাথমিক ট্যাব (open-এর আগে সেট করা হয়) */
  aiVisionTab: AiVisionTab;
  /** আউটলাইন নেভিগেটর সাইডবার খোলা আছে কি না */
  navigatorOpen: boolean;
  /** ফোকাস মোড (নিরবচ্ছিন্ন লেখা) চালু আছে কি না */
  focusMode: boolean;
  /** AI চ্যাট প্যানেল (ডান পাশ) খোলা আছে কি না */
  aiChatOpen: boolean;
  open: (name: DialogName) => void;
  /** AI ডায়ালগ নির্দিষ্ট ট্যাবসহ খোলা */
  openAi: (tab: AiVisionTab) => void;
  openPageChrome: (pageId: string) => void;
  close: () => void;
  toggleNavigator: () => void;
  setFocusMode: (v: boolean) => void;
  toggleFocusMode: () => void;
  toggleAiChat: () => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  openDialog: null,
  pageChromeId: null,
  aiVisionTab: 'vision',
  navigatorOpen: readBoolFlag('bwp-navigator-open', false),
  focusMode: readBoolFlag('bwp-focus-mode', false),
  aiChatOpen: false,
  open: (name) => set({ openDialog: name }),
  openAi: (tab) => set({ openDialog: 'aiVision', aiVisionTab: tab }),
  openPageChrome: (pageId) => set({ openDialog: 'pageChrome', pageChromeId: pageId }),
  close: () => set({ openDialog: null, pageChromeId: null }),
  toggleNavigator: () => {
    const next = !get().navigatorOpen;
    writeBoolFlag('bwp-navigator-open', next);
    set({ navigatorOpen: next });
  },
  setFocusMode: (v) => {
    writeBoolFlag('bwp-focus-mode', v);
    set({ focusMode: v });
  },
  toggleFocusMode: () => get().setFocusMode(!get().focusMode),
  toggleAiChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),
}));
