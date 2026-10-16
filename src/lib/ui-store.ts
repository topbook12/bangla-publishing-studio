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
  | 'accuracy'
  | 'pageChrome'
  | 'templates'
  | 'findReplace'
  | 'snapshots'
  | 'krutiConverter'
  | 'aiVision'
  | 'aiSettings'
  | 'assetStore'
  | 'vectorLib'
  | 'questionPaper'
  | 'sketchPad'
  | 'help';

/** AI ডায়ালগের কোন ট্যাব নিয়ে খুলবে */
export type AiVisionTab = 'vision' | 'text';

/** নেভিগেটর সাইডবারের ট্যাব — আউটলাইন (শিরোনাম) বা পাতা (থাম্বনেইল) */
export type NavigatorTab = 'outline' | 'pages';

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

/** localStorage থেকে স্ট্রিং পড়া — ব্যর্থ হলে fallback */
function readStrFlag(key: string, fallback: string): string {
  try {
    if (typeof window === 'undefined') return fallback;
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

/** localStorage-এ স্ট্রিং লেখা — চুপচাপ এড়িয়ে যাওয়া */
function writeStrFlag(key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, value);
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
  /** নেভিগেটরের চলতি ট্যাব — শিরোনাম-তালিকা বা পৃষ্ঠা-থাম্বনেইল */
  navigatorTab: NavigatorTab;
  /** ফোকাস মোড (নিরবচ্ছিন্ন লেখা) চালু আছে কি না */
  focusMode: boolean;
  /** AI চ্যাট প্যানেল (ডান পাশ) খোলা আছে কি না */
  aiChatOpen: boolean;
  /** ওয়ার্কস্পেসের স্কেল/রুলার (MS Word-ধাঁচের) দেখা যাচ্ছে কি না */
  rulerVisible: boolean;
  /** রুলারের একক — সেন্টিমিটার বা ইঞ্চি (অনুভূমিক + উল্লম্ব দুটোতেই একসাথে) */
  rulerUnit: 'cm' | 'in';
  open: (name: DialogName) => void;
  /** AI ডায়ালগ নির্দিষ্ট ট্যাবসহ খোলা */
  openAi: (tab: AiVisionTab) => void;
  openPageChrome: (pageId: string) => void;
  close: () => void;
  toggleNavigator: () => void;
  setNavigatorTab: (t: NavigatorTab) => void;
  setFocusMode: (v: boolean) => void;
  toggleFocusMode: () => void;
  toggleAiChat: () => void;
  setRulerVisible: (v: boolean) => void;
  toggleRuler: () => void;
  setRulerUnit: (u: 'cm' | 'in') => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  openDialog: null,
  pageChromeId: null,
  aiVisionTab: 'vision',
  navigatorOpen: readBoolFlag('bwp-navigator-open', false) && (typeof window === 'undefined' || window.innerWidth >= 640),
  navigatorTab: readStrFlag('bwp-navigator-tab', 'outline') === 'pages' ? 'pages' : 'outline',
  focusMode: readBoolFlag('bwp-focus-mode', false),
  aiChatOpen: false,
  // স্কেল/রুলার — ডেস্কটপে ডিফল্ট চালু, ছোট স্ক্রিনে (মোবাইল) ডিফল্ট বন্ধ
  rulerVisible: typeof window !== 'undefined' && window.innerWidth >= 900,
  rulerUnit: readStrFlag('bwp-ruler-unit', 'cm') === 'in' ? 'in' : 'cm',
  open: (name) => set({ openDialog: name }),
  openAi: (tab) => set({ openDialog: 'aiVision', aiVisionTab: tab }),
  openPageChrome: (pageId) => set({ openDialog: 'pageChrome', pageChromeId: pageId }),
  close: () => set({ openDialog: null, pageChromeId: null }),
  toggleNavigator: () => {
    const next = !get().navigatorOpen;
    writeBoolFlag('bwp-navigator-open', next);
    set({ navigatorOpen: next });
  },
  setNavigatorTab: (t) => {
    writeStrFlag('bwp-navigator-tab', t);
    set({ navigatorTab: t });
  },
  setFocusMode: (v) => {
    writeBoolFlag('bwp-focus-mode', v);
    set({ focusMode: v });
  },
  toggleFocusMode: () => get().setFocusMode(!get().focusMode),
  toggleAiChat: () => set((s) => ({ aiChatOpen: !s.aiChatOpen })),
  setRulerVisible: (v) => {
    writeBoolFlag('bwp-ruler-visible', v);
    set({ rulerVisible: v });
  },
  toggleRuler: () => get().setRulerVisible(!get().rulerVisible),
  setRulerUnit: (u) => {
    writeStrFlag('bwp-ruler-unit', u);
    set({ rulerUnit: u });
  },
}));
