/**
 * Kruti Dev 010 / DevLys (Remington Gail) ↔ Unicode দেবনাগরী রূপান্তর
 * ─────────────────────────────────────────────────────────────────────
 * ভারতীয় DTP/ছাপাখানায় Kruti Dev পরিবারের ফন্টে টাইপ করা লক্ষ লক্ষ পৃষ্ঠা আছে —
 * ওগুলোর টেক্সট ASCII-এ সংরক্ষিত (ফন্ট ছাড়া পড়লে ইংরেজি অক্ষরের স্তূপ)।
 * এই মডিউল সেই legacy টেক্সটকে ইউনিকোডে আনে (Kruti→Unicode), আর ইউনিকোড টেক্সটকে
 * Kruti-এনকোডে ফেরত পাঠায় (Unicode→Kruti) যাতে Kruti Dev/DevLys ফন্টে ছাপা যায়।
 *
 * অ্যালগরিদম নোট:
 * - টেবিল: src/lib/kruti-table.ts (ক্যানোনিকাল পাবলিক-ডোমেইন ২৪১ pairs, ক্রম সংরক্ষিত)।
 * - Kruti-তे 'ि' মাত্রা ব্যঞ্জনের আগে টাইপ হয় ('f'), ইউনিকোডে পরে — f-reorder স্টেজ
 *   + 'ि्X'→'्Xि' ফিক্সআপ স্টেজে সামলানো হয় (conjunct-ও)।
 * - reph (র্): Kruti-তে ক্লাস্টারের পরে 'Z'; ইউনিকোডে পরের ক্লাস্টারের আগে 'र্' —
 *   K2U-তে in-place, U2K-তে grapheme-walk। (রেফারেন্স প্যাকেজের prepend-লজিক বাগ —
 *   "dkZ;"→"कार्य" টেস্টে যাচাই করা।)
 * - U2K: গ্রাফিম-ক্লাস্টার ওয়াক — reph, 'ि' pre-base, '्র' (ª), রু (#)/রূ (:) বিশেষ চিহ্ন।
 */

'use client';

import { KRUTI_TABLE } from './kruti-table';

// ─── সাধারণ সহায়ক ───

function replaceAll(s: string, find: string, repl: string): string {
  return find.length === 0 ? s : s.split(find).join(repl);
}

const VIRAMA = '\u094d';
const IMATRA = '\u093f';
const CONS_RE = /[\u0915-\u0939\u0958-\u095F]/;
const MATRA_CHARS = '\u093e\u093f\u0940\u0941\u0942\u0943\u0944\u0945\u0947\u0948\u0949\u094a\u094b\u094c';
const NASAL_CHARS = '\u0901\u0902\u0903';
/** Kruti-স্পেস-ক্লিনআপের মাত্রা তালিকা (unattached) */
const CLEAN_MATRAS = ['\u093e', '\u093f', '\u0940', '\u0941', '\u0942', '\u0943', '\u0947', '\u0948', '\u094b', '\u094c', '\u0902', '\u0903', '\u0901', '\u0945'];

// ─── Kruti → Unicode ───

/**
 * Kruti Dev 010-এনকোড করা টেক্সট → ইউনিকোড দেবনাগরী।
 * সঠিক Remington Gail টাইপিং-এ তৈরি টেক্সটে নির্ভুল; ইংরেজি অংশ যা-আছে-তা-ই থাকে
 * (Kruti ফাইলে ইংরেজিও ASCII-তেই থাকে, তবে k/d/f-এর মতো অক্ষর দেবনাগরীতে ম্যাপ হয় —
 * এটাই legacy ফরম্যাটের স্বভাব)।
 */
export function krutiToUnicode(input: string): string {
  let text = input.replace(/\r\n/g, '\n').normalize('NFC');

  // ০) কোট-সুরক্ষা: Kruti ডকুমেন্টের curly-quote গ্লিফগুলো ('‘’“” — cp1252) সোজা ASCII
  //     কোটে ম্যাপ হয়, কিন্তু টেবিলের পরে ['"k','ष'] নিয়ম সেই ASCII '"'-কে ষ-তে ধরে ফেলে
  //     (cascade বাগ)। তাই প্লেসহোল্ডারে লুকিয়ে টেবিল শেষে ফেরত আনই।
  text = replaceAll(text, '\u2018', '\u0001');
  text = replaceAll(text, '\u2019', '\u0002');
  text = replaceAll(text, '\u201c', '\u0003');
  text = replaceAll(text, '\u201d', '\u0004');

  // ১) প্রি-ক্লিন: মাত্রার আগের ভুল স্পেস (ক্যানোনিকাল ক্রম)
  text = replaceAll(text, ' ª', 'ª');
  text = replaceAll(text, ' ~j', '~j');
  text = replaceAll(text, ' z', 'z');

  // ২) মূল টেবিল — ক্রম গুরুত্বপূর্ণ (longest-first হাতে-সাজানো)
  for (const [k, v] of KRUTI_TABLE) text = replaceAll(text, k, v);

  // ৩) লিগেচার বিশেষ চিহ্ন (ক্যানোনিকাল ক্রমে)
  text = replaceAll(text, '±', 'Z\u0902'); // ±  ->  Zं
  text = replaceAll(text, 'Æ', '\u0930\u094df'); // Æ  ->  र्f

  // ৪) f-স্টেজ: 'fX' → 'X' + ि (ि মাত্রা ব্যঞ্জনের পরে বসবে; ff/ক্রমের জন্য লুপ)
  let prev: string;
  do {
    prev = text;
    text = text.replace(/f(.?)/g, '$1\u093f');
  } while (text !== prev);

  text = replaceAll(text, 'Ç', 'fa'); // Ç  ->  fa
  text = replaceAll(text, '¯', 'fa'); // ¯  ->  fa
  text = replaceAll(text, 'É', '\u0930\u094dfa'); // É  ->  र्fa

  // ৫) fa-স্টেজ: 'faX' → 'X' + िं
  do {
    prev = text;
    text = text.replace(/fa(.?)/g, '$1\u093f\u0902');
  } while (text !== prev);

  text = replaceAll(text, 'Ê', '\u0940Z'); // Ê  ->  ीZ

  // ৬) 'ि्X' → '्Xि' — ि conjunct-এর ভেতরে ঢুকে গেলে ঠিক জায়গায় টানে
  do {
    prev = text;
    text = text.replace(/\u093f\u094d(.?)/g, '\u094d$1\u093f');
  } while (text !== prev);

  text = replaceAll(text, '\u094dZ', 'Z'); // ् + Z  ->  Z

  // ৭) reph — in-place: 'Z' (ক্লাস্টারের পরে) → 'र्' ("dkZ;" → "कार्य")
  text = replaceAll(text, 'Z', '\u0930\u094d');

  // ৮) ক্লিনআপ
  for (const m of CLEAN_MATRAS) text = replaceAll(text, ' ' + m, m);
  text = replaceAll(text, '\u094d\u094d\u0930', '\u094d\u0930'); // ््र → ्र
  text = replaceAll(text, '\u094d\u0930\u094d', '\u0930\u094d'); // ्र् → र्
  text = replaceAll(text, '\u094d\u094d', '\u094d'); // ्् → ्
  text = replaceAll(text, '\u094d ', ' '); // শব্দশেষে ঝুলন্ত ্ বাদ

  // ৯) কোট ফেরত — Kruti '‘'→" এবং '“'→'
  text = replaceAll(text, '\u0001', '"');
  text = replaceAll(text, '\u0002', '"');
  text = replaceAll(text, '\u0003', "'");
  text = replaceAll(text, '\u0004', "'");

  return text.trim();
}

// ─── Unicode → Kruti ───

interface RevEntry { key: string; val: string }
let REV_SORTED: RevEntry[] | null = null;

/** যে ইউনিকোড punctuation-গুলোর Kruti-গ্লিফ ম্যাপিং রিভার্স টেবিলে রাখা দরকার */
const PUNCT_KEEP = new Set([',', '.', ';', ':', '?', '-', '"', "'"]);

/**
 * বিপরীত টেবিল — ইউনিকোড-কী, দৈর্ঘ্য-অবরোহী।
 * সংঘর্ষে প্রথম occurrence জেতে — টেবিলে স্ট্যান্ডার্ড Remington টাইপিং আগে থাকে
 * (যেমन 'क'→'d' ['d'] আগে, 'Dk' পরে; 'भ'→'Hk' আগে, 'Ò' পরে)।
 */
function revTable(): RevEntry[] {
  if (REV_SORTED) return REV_SORTED;
  const dev = /[\u0900-\u097F]/;
  const best = new Map<string, string>();
  for (const [k, v] of KRUTI_TABLE) {
    if (!dev.test(v) && !PUNCT_KEEP.has(v)) continue; // অভ্যন্তরীণ নরমালাইজ-রুল (যেমন ['aa','a']) বাদ
    if (!best.has(v)) best.set(v, k); // প্রথম occurrence = স্ট্যান্ডার্ড টাইপিং
  }
  REV_SORTED = Array.from(best, ([key, val]) => ({ key, val }))
    .sort((a, b) => b.key.length - a.key.length);
  return REV_SORTED;
}

/** অবস্থান i-তে দীর্ঘতম বিপরীত-ম্যাচ */
function revMatchAt(s: string, i: number): { len: number; val: string } | null {
  for (const { key, val } of revTable()) {
    if (s.startsWith(key, i)) return { len: key.length, val };
  }
  return null;
}

/** ক্লাস্টার-কোর স্ট্রিং-এ লোভী বিপরীত-ম্যাপ */
function revGreedy(s: string): string {
  let out = '';
  let i = 0;
  while (i < s.length) {
    const m = revMatchAt(s, i);
    if (m) { out += m.val; i += m.len; } else { out += s[i]; i += 1; }
  }
  return out;
}

/**
 * ইউনিকোড দেবনাগরী → Kruti Dev 010-এনকোড (Kruti Dev/DevLys ফন্টে দেখাতে/ছাপাতে)।
 * গ্রাফিম-ক্লাস্টার ওয়াক: reph(र্→Z), ি pre-base(→f), ्র(→ª), रु(→#), रू(→:) সামলায়।
 */
export function unicodeToKruti(input: string): string {
  const s = input.replace(/\r\n/g, '\n').normalize('NFC');
  let out = '';
  let i = 0;
  const n = s.length;
  while (i < n) {
    // ১) reph: র + ্ (ক্লাস্টারের আগে) → 'Z' ক্লাস্টারের পরে বসবে
    if (s[i] === '\u0930' && s[i + 1] === VIRAMA) { out += 'Z'; i += 2; continue; }
    // ২) ব্যঞ্জন-ক্লাস্টার: ব্যঞ্জন-চেইন + মাত্রা আলাদা করে সংগ্রহ
    if (CONS_RE.test(s[i])) {
      let j = i;
      let chain = '';
      while (j < n && (CONS_RE.test(s[j]) || s[j] === VIRAMA)) { chain += s[j]; j += 1; }
      let matras = '';
      while (j < n && (MATRA_CHARS.includes(s[j]) || NASAL_CHARS.includes(s[j]))) { matras += s[j]; j += 1; }
      const hasI = matras.includes(IMATRA);
      const matrasNoI = hasI ? matras.split(IMATRA).join('') : matras;
      if (hasI && chain.length > 0) {
        // ि শেষ ব্যঞ্জনের ঠিক আগে বসে (Kruti pre-base), আগের ব্যঞ্জনগুলো অর্ধ-রূপে:
        // "भक्ति" → 'Hk'+'D'+'f'+'r', "द्वि" → 'n~'+'f'+'o'
        const cut = chain.length - 1;
        out += revGreedy(chain.slice(0, cut)) + 'f' + revGreedy(chain[cut]) + revGreedy(matrasNoI);
      } else {
        out += revGreedy(chain + matras);
      }
      i = j;
      continue;
    }
    // ৩) দীর্ঘতম একক/লিগেচার ম্যাচ (স্বর, ०-९, मात्रा, रु, रू…)
    const m = revMatchAt(s, i);
    if (m) { out += m.val; i += m.len; continue; }
    // ৪) বাকি সব যেমন আছে
    out += s[i];
    i += 1;
  }
  return out;
}

export type KrutiDirection = 'kruti2uni' | 'uni2kruti';

/** দিক অনুযায়ী রূপান্তর */
export function convertKruti(text: string, dir: KrutiDirection): string {
  return dir === 'kruti2uni' ? krutiToUnicode(text) : unicodeToKruti(text);
}

/** টেক্সটে দেবনাগরী আছে কি না — ডিফল্ট দিক বাছাইয়ে কাজে লাগে */
export function hasDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/** ডেমোর জন্য নমুনা Kruti টেক্সট (Remington Gail টাইপিং) — "भारत हमारी राष्ट्रभाषा है।" */
export const KRUTI_SAMPLE = 'Hkkjr gekjh jk"VªHkk"kk gSA';
