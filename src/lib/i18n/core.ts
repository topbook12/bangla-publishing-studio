/**
 * i18n core — ভাষা সিস্টেম (বাংলা / हिन्दी / English)
 *
 * - ভাষা স্টেট zustand-এ, localStorage ('bwp-lang')-এ সংরক্ষিত।
 * - অভিধান (dictionary) মডিউলভিত্তিক: dict-*.ts ফাইলগুলো index.ts-এ একত্রিত হয়।
 * - t(key, fallback) — না পেলে fallback (সাধারণত ইংরেজি), সেটিও না থাকলে key।
 * - localizeNumber — ভাষা অনুযায়ী সংখ্যা: বাংলা ০-৯, দেবনাগরী ०-९, ইংরেজি 0-9।
 */

'use client';

import { create } from 'zustand';

export type Lang = 'bn' | 'hi' | 'en';

export interface LangMeta {
  id: Lang;
  /** স্বদেশি নাম — মেনুতে এটাই দেখানো হয় */
  native: string;
  english: string;
}

/** ভাষা তালিকা — মেনুর ক্রম */
export const LANGUAGES: LangMeta[] = [
  { id: 'bn', native: 'বাংলা', english: 'Bangla' },
  { id: 'hi', native: 'हिन्दी', english: 'Hindi' },
  { id: 'en', native: 'English', english: 'English' },
];

/** একটি অভিধান-এন্ট্রি: তিন ভাষাতেই পূর্ণ অনুবাদ */
export type Entry = Record<Lang, string>;
export type Dict = Record<string, Entry>;

// ─── সংখ্যা ───

export const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export const HI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/** সংখ্যা/স্ট্রিং-এর ডিজিট ভাষা অনুযায়ী রূপান্তর */
export function localizeNumber(n: number | string, lang: Lang): string {
  const s = typeof n === 'number' ? String(n) : n;
  const digits = lang === 'bn' ? BN_DIGITS : lang === 'hi' ? HI_DIGITS : null;
  if (!digits) return s;
  return s.replace(/[0-9]/g, (d) => digits[Number(d)] ?? d);
}

// ─── তারিখ ───

const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const HI_MONTHS = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];
const EN_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const BN_DAYS = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
const HI_DAYS = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
const EN_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** আজকের তারিখ ভাষা অনুযায়ী — "শুক্রবার, ১২ জানুয়ারি ২০২৫" ধাঁচে */
export function formatDateLong(d: Date, lang: Lang): string {
  const digits = localizeNumber(d.getDate(), lang);
  const year = localizeNumber(d.getFullYear(), lang);
  if (lang === 'hi') return `${HI_DAYS[d.getDay()]}, ${digits} ${HI_MONTHS[d.getMonth()]} ${year}`;
  if (lang === 'en') return `${EN_DAYS[d.getDay()]}, ${digits} ${EN_MONTHS[d.getMonth()]} ${year}`;
  return `${BN_DAYS[d.getDay()]}, ${digits} ${BN_MONTHS[d.getMonth()]} ${year}`;
}

// ─── ভাষা স্টোর ───

function readStoredLang(): Lang {
  try {
    const v = window.localStorage.getItem('bwp-lang');
    if (v === 'bn' || v === 'hi' || v === 'en') return v;
  } catch { /* প্রাইভেট মোড */ }
  return 'bn'; // মূল অ্যাপ বাংলা — আচরণ অপরিবর্তিত
}

interface LangState {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: readStoredLang(),
  setLang: (lang) => {
    try { window.localStorage.setItem('bwp-lang', lang); } catch { /* কোটা ত্রুটি */ }
    // <html lang> সিঙ্ক — স্ক্রিন রিডার/স্পেলচেক সঠিক ভাষা পায়
    try { document.documentElement.lang = lang === 'bn' ? 'bn' : lang === 'hi' ? 'hi' : 'en'; } catch { /* ignore */ }
    set({ lang });
  },
}));

/** কম্পোনেন্টের বাইরে (টোস্ট/সার্ভিস) চলতি ভাষা */
export function getLang(): Lang {
  return useLangStore.getState().lang;
}
