/**
 * ডকুমেন্ট স্টুডিও — কোর লজিক (Document Studio — core logic)
 * ──────────────────────────────────────────────────────────────────
 * প্রশ্নপত্র ও সাজেশনের পাশাপাশি বিশ্বমানের পেশাদার ডকুমেন্ট-সংগ্রহ —
 * রেজিউমে ও ক্যারিয়ার, ব্যবসা-অফিস, ইনভয়েস-আর্থিক, আইনি-চুক্তি, সনদ-পুরস্কার,
 * শিক্ষা, অনুষ্ঠান, চিকিৎসা, মার্কেটিং — ৯টি বৈশ্বিক ক্যাটাগরি + একটি
 * আঞ্চলিক সংগ্রহ (বাংলাদেশ ও ভারত) = ১০ ক্যাটাগরিতে ৫৫টি ফরম্যাট-নির্ভুল নকশা।
 *
 * বৈশ্বিক মান (MS Word / Google Docs / Canva-র ক্যাটাগরি-প্রথা অনুসরণে):
 *  - Resume & Career, Business & Office, Invoices & Finance, Legal & Contracts,
 *    Certificates & Awards, Education & Academic, Events & Invitations,
 *    Health & Medical, Marketing & Media — সব দেশের প্রচলিত ডকুমেন্ট।
 *  - Regional Collection — বাংলাদেশ ও ভারতের ইউনিয়ন-সনদ, ভূমি-দলিল, দরখাস্ত।
 *
 * কাঠামো (UI-মুক্ত, সম্পূর্ণ পরীক্ষণযোগ্য):
 *  - DsField/DsTemplate — ফরম-ফিল্ড স্কিমা + HTML-নির্মাতা
 *  - buildDsHtml — মান → এডিটর-স্কিমা-বৈধ HTML (paragraph/heading/table/
 *    doc-textbox/callout-box/doc-columns/fancy-divider মাত্র)
 *
 * ডিজাইন-সিদ্ধান্ত:
 *  - ফরম্যাট-নির্ভুলতা প্রথম: আন্তর্জাতিক চিঠি/চুক্তি/রেজিউমের পেশাদার ধাঁচ,
 *    ইউনিয়ন-সনদের "প্রত্যয়িত করা হচ্ছে যে" ভাষা, দরখাস্তের "বিনীত নিবেদক"
 *    পদ্ধতি, ইনভয়েসে কথায়-টাকা — প্রতিটি নকশা সেই প্রথার আসল ধাঁচে।
 *  - এক কালি-প্যালেট প্রথা — রয়্যাল মেরুন+গোল্ড, বন-সবুজ, গাঢ় টিল, সেপিয়া +
 *    অরোরা ব্র্যান্ড-লাইন (ভায়োলেট/অর্কিড/রোজউড/জেড) — নীল/ইন্ডিগো প্রাইমারি নয়।
 *    প্রিন্ট-ফার্স্ট ডিজাইন — সব শিরোনাম-রং সাদা কাগজে 5:1+ কনট্রাস্ট।
 *  - ব্যবহারকারীর লেখা সব মান escape করা — কোনো raw HTML সন্নিবেশ নয়।
 */

import type { Lang } from './i18n/core';
import { formatDateLong } from './i18n/core';
import {
  buildColumnsHtml, buildDesignBoxHtml, buildDividerHtml,
  columnsStyleText, docBoxStyleText, parseColumnsAttrs,
  type ColumnsRuleStyle, type DocBoxAttrs, type DocBoxVariant,
} from './nodes-html';

// ─── সাহায্যকারী ───

/** ব্যবহারকারীর লেখা → নিরাপদ HTML টেক্সট */
function esc(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** মান-পাঠ — ফাঁকা থাকলে ফলব্যাক */
function V(values: Record<string, string>, id: string, fallback = ''): string {
  const v = (values[id] ?? '').trim();
  return v || fallback;
}

/** বহু-লাইন মান → অ-খালি লাইনগুলো */
function lines(v: string): string[] {
  return String(v ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

/** কেন্দ্র-সারিত অনুচ্ছেদ */
function pc(html: string, extra = ''): string {
  return `<p style="text-align:center;${extra}">${html}</p>`;
}

/**
 * বাঁ/ডান দুই-স্তম্ভ নিরাকার-টেবিল সারি (স্বাক্ষর-ব্লক/শিরোনাম-তথ্য)।
 * এডিটর-চুক্তি (question-paper.ts-এর মতো): নিরাকার সেলে data-border="none" —
 * TipTap সেলের সাধারণ style ফেলে দেয়, তাই অ্যাট্রিবিউটই প্রকৃত বাহক।
 *
 * কলাম-প্রস্থ ইচ্ছাকৃতভাবে colwidth ছাড়া তরল: সব-সেলে colwidth দিলে TipTap
 * টেবিলকে নির্দিষ্ট px-প্রস্থে আটকে দেয় — ডেমি/ক্রাউন/A5-এর সরু কনটেন্ট-বক্সে
 * উপচে লেখা কাটা পড়ত। colwidth ছাড়া টেবিল width:100% + table-layout:fixed
 * চলে — যে-কাগজেই ঢোকাক, স্তম্ভ দুটি সমান ভাগে পুরো প্রস্থ জুড়ে থাকে
 * (প্রিভিউ/স্ট্যান্ডঅ্যালোনে সেলের width:% ইনলাইন-স্টাইলই অনুপাত ধরে রাখে)।
 */
function row2(leftHtml: string, rightHtml: string, leftPct = 50, rightPct = 50): string {
  const cell = (html: string, pct: number) =>
    `<td data-border="none" style="border:none; width:${pct}%; vertical-align:top">${html}</td>`;
  return `<table style="width:100%"><tr>${cell(leftHtml, leftPct)}${cell(rightHtml, rightPct)}</tr></table>`;
}

/** ডট-লাইন পূরণ-জায়গা (ফরমের ফাঁকা ঘর) — রং প্যালেট-সচেতন (ধূসর-স্লেট নয়) */
function dots(n = 18, P?: DsPalette): string {
  return `<span style="color:${P ? P.border : '#94a3b8'}; letter-spacing:1px">${'·'.repeat(n)}</span>`;
}

/** শেডেড ব্যান্ড শিরোনাম (নোটিশ/আদেশ/সনদের শিরোনাম-পটি) */
function band(title: string, P: DsPalette): string {
  return pc(
    `<strong style="font-size:13pt">${esc(title)}</strong>`,
    `background:${P.band}; border-top:1.5px solid ${P.border}; border-bottom:1.5px solid ${P.border}; padding:5px 8px; color:${P.head}`,
  );
}

// ─── অনুবাদ-সহায়ক ───

interface T3 { bn: string; hi: string; en: string }
const L3 = (bn: string, hi: string, en: string): T3 => ({ bn, hi, en });
function tx(lang: Lang, e: T3): string {
  return lang === 'en' ? e.en : lang === 'hi' ? e.hi || e.en : e.bn;
}
function pick(lang: Lang, bn: string, hi: string, en: string): string {
  return tx(lang, L3(bn, hi, en));
}

/** সাঝা লেবেল */
const DSB = {
  govt: L3('গণপ্রজাতন্ত্রী বাংলাদেশ সরকার', 'गणप्रजातंत्री बांग्लादेश सरकार', 'Government of the People\u2019s Republic of Bangladesh'),
  refNo: L3('স্মারক নং', 'स्मारक सं.', 'Memo No.'),
  date: L3('তারিখ', 'तारीख', 'Date'),
  subject: L3('বিষয়', 'विषय', 'Subject'),
  sir: L3('মহোদয়,', 'महोदय,', 'Sir,'),
  sincerely: L3('সম্মানের সাথে বিনীত নিবেদক', 'सादर निवेदक', 'Yours faithfully'),
  signature: L3('স্বাক্ষর', 'हस्ताक्षर', 'Signature'),
  total: L3('সর্বমোট', 'कुल योग', 'Total'),
  inWords: L3('কথায়', 'शब्दों में', 'In words'),
};

/** স্বাক্ষর-ব্লক — বাঁ/ডান দুই কর্তৃপক্ষ */
function sig2(lang: Lang, P: DsPalette, left: { t: string; n: string; o: string }, right: { t: string; n: string; o: string }): string {
  const sig = (side: { t: string; n: string; o: string }) =>
    `<p style="text-align:center; margin-bottom:2px; font-size:10pt; color:${P.soft}">${esc(side.t)}</p>` +
    `<p style="text-align:center; margin:0; border-top:1px solid ${P.border}; padding-top:4px; font-size:10.5pt"><strong>${esc(side.n)}</strong></p>` +
    (side.o ? `<p style="text-align:center; margin:0; font-size:9.5pt; color:${P.soft}">${esc(side.o)}</p>` : '') +
    `<p style="text-align:center; margin:0; font-size:9.5pt; color:${P.soft}">${tx(lang, DSB.signature)}</p>`;
  return `<p style="margin-top:2.2em"></p>${row2(sig(left), sig(right))}`;
}

/** এক-স্বাক্ষর ডান-ব্লক (দরখাস্তের নিবেদক/চিঠির স্বাক্ষরকারী) */
function sigOne(lang: Lang, P: DsPalette, title: string, name: string, meta: string): string {
  const out =
    `<p style="text-align:right; margin-bottom:1px; font-size:10pt; color:${P.soft}">${tx(lang, DSB.sincerely)}</p>` +
    `<p style="text-align:right; margin:0.4em 0 0; font-size:10.5pt"><strong>${esc(name)}</strong></p>`;
  const metaLines = lines(meta)
    .map((l) => `<p style="text-align:right; margin:0; font-size:9.5pt; color:${P.soft}">${esc(l)}</p>`)
    .join('');
  const tHtml = title ? `<p style="text-align:right; margin:0; font-size:9.5pt; color:${P.soft}">${esc(title)}</p>` : '';
  return out + tHtml + metaLines;
}

// ─── প্যালেট (বুক-টেমপ্লেটের কালি-প্রথা — নীল/ইন্ডিগো নয়) ───

export interface DsPalette {
  ink: string;
  head: string;
  soft: string;
  band: string;
  border: string;
}

export interface DsStyleOpt {
  id: string;
  name: T3;
  P: DsPalette;
}

const P_CLASSIC: DsPalette = { ink: '#1f2937', head: '#111827', soft: '#6b7280', band: 'rgba(31,41,55,0.07)', border: '#94a3b8' };
const P_ROYAL: DsPalette = { ink: '#3f2412', head: '#7f1d1d', soft: '#8d6e63', band: 'rgba(127,29,29,0.08)', border: '#b45309' };
const P_GREEN: DsPalette = { ink: '#14352a', head: '#14532d', soft: '#5f7268', band: 'rgba(20,83,45,0.09)', border: '#15803d' };
const P_TEAL: DsPalette = { ink: '#123c3a', head: '#115e59', soft: '#5f7a76', band: 'rgba(19,78,74,0.08)', border: '#0f766e' };
const P_SEPIA: DsPalette = { ink: '#3f2f1e', head: '#7c2d12', soft: '#8d7358', band: 'rgba(124,45,18,0.08)', border: '#a16207' };
// ─── প্রিমিয়াম সংযোজন — কুরেটেড রং-সংযোগ (Canva/Adobe-গ্যালারি প্রথায়) ───
const P_WINE: DsPalette = { ink: '#3c2029', head: '#86183d', soft: '#8f6470', band: 'rgba(134,24,61,0.07)', border: '#b08a57' };
const P_PLUM: DsPalette = { ink: '#37223a', head: '#6b2151', soft: '#7d6b83', band: 'rgba(107,33,81,0.07)', border: '#a3763d' };
const P_OLIVE: DsPalette = { ink: '#2c331f', head: '#4d5e23', soft: '#7a7a5c', band: 'rgba(77,94,35,0.09)', border: '#c2703d' };
const P_ESPRESSO: DsPalette = { ink: '#33261d', head: '#5d3a22', soft: '#8a6d58', band: 'rgba(93,58,34,0.08)', border: '#b4632f' };
const P_GRAPHITE: DsPalette = { ink: '#27272a', head: '#3f3f46', soft: '#71717a', band: 'rgba(63,63,70,0.06)', border: '#b8860b' };
// ─── অরোরা ব্র্যান্ড-লাইন — ব্র্যান্ডের রয়্যাল-ভায়োলেট→অর্কিড ফাক্সিয়া + প্রিমিয়াম দুই-সুর (Aurora Studio) ───
const P_AURORA: DsPalette = { ink: '#3b2a5e', head: '#6d28d9', soft: '#8b7fa8', band: 'rgba(109,40,217,0.07)', border: '#a78bfa' };
const P_ORCHID: DsPalette = { ink: '#4a1f42', head: '#a21caf', soft: '#97718f', band: 'rgba(162,28,175,0.07)', border: '#d8b4fe' };
const P_ROSEWOOD: DsPalette = { ink: '#43222a', head: '#9f1239', soft: '#96696f', band: 'rgba(159,18,57,0.07)', border: '#c98a7e' };
const P_JADE: DsPalette = { ink: '#1d3b31', head: '#047857', soft: '#6f8a7d', band: 'rgba(4,120,87,0.08)', border: '#c9a962' };

/** সাজ-বিকল্প — প্রতিটি টেমপ্লেট এর মধ্য থেকে বেছে নেয় */
export const DS_STYLES: DsStyleOpt[] = [
  { id: 'classic', name: L3('ক্লাসিক কালি', 'क्लासिक', 'Classic ink'), P: P_CLASSIC },
  { id: 'royal', name: L3('রয়্যাল মেরুন', 'रॉयल मैरून', 'Royal maroon'), P: P_ROYAL },
  { id: 'green', name: L3('বন-সবুজ', 'वन-हरित', 'Forest green'), P: P_GREEN },
  { id: 'teal', name: L3('গাঢ় টিল', 'गहरा टील', 'Deep teal'), P: P_TEAL },
  { id: 'sepia', name: L3('সেপিয়া সংরক্ষণাগার', 'सेपिया', 'Sepia archive'), P: P_SEPIA },
  { id: 'wine', name: L3('ওয়াইন ও পিতল', 'वाइन व पीतल', 'Wine & brass'), P: P_WINE },
  { id: 'plum', name: L3('প্লাম ও শ্যাম্পেন', 'प्लम व शैम्पेन', 'Plum & champagne'), P: P_PLUM },
  { id: 'olive', name: L3('অলিভ ও টেরাকোটা', 'ऑलिव व टेराकोटा', 'Olive & terracotta'), P: P_OLIVE },
  { id: 'espresso', name: L3('এসপ্রেসো ও কপার', 'एस्प्रेसो व कॉपर', 'Espresso & copper'), P: P_ESPRESSO },
  { id: 'graphite', name: L3('গ্রাফাইট ও গোল্ড', 'ग्रेफाइट व गोल्ड', 'Graphite & gold'), P: P_GRAPHITE },
  { id: 'aurora', name: L3('অরোরা ভায়োলেট', 'ऑरोरा वायलेट', 'Aurora violet'), P: P_AURORA },
  { id: 'orchid', name: L3('অর্কিড ফাক্সিয়া', 'ऑर्किड फ़्यूशिया', 'Orchid fuchsia'), P: P_ORCHID },
  { id: 'rosewood', name: L3('রোজউড ও রোজ-গোল্ড', 'रोज़वुड व रोज़-गोल्ड', 'Rosewood & rose-gold'), P: P_ROSEWOOD },
  { id: 'jade', name: L3('জেড ও শ্যাম্পেন', 'जेड व शैम्पेन', 'Jade & champagne'), P: P_JADE },
];

/** পুরো প্যালেট-গ্যালারি — প্রতিটি টেমপ্লেট চৌদ্দটি কিউরেটেড রং-সংযোগ পায় */
const ALL_STYLES: string[] = DS_STYLES.map((s) => s.id);

function styleById(id: string, fallback = 'classic'): DsStyleOpt {
  // দ্বিস্তর-ফলব্যাক + শেষ ভরসা classic — ভুল styleId-তে কখনোই undefined নয়
  return DS_STYLES.find((s) => s.id === id)
    ?? DS_STYLES.find((s) => s.id === fallback)
    ?? DS_STYLES[0]!;
}

// ─── টাইপ ───

/**
 * বৈশ্বিক ক্যাটাগরি-তকমা (MS Word / Google Docs / Canva প্রথায়) —
 * career/office/finance/legal/cert/edu/event/med/promo সব দেশের প্রচলিত,
 * regional শুধু বাংলাদেশ ও ভারতের প্রথাসিদ্ধ ডকুমেন্টের সংগ্রহ।
 */
export type DsCategory =
  | 'career'   // Resume & Career
  | 'office'   // Business & Office
  | 'finance'  // Invoices & Finance
  | 'legal'    // Legal & Contracts
  | 'cert'     // Certificates & Awards
  | 'edu'      // Education & Academic
  | 'event'    // Events & Invitations
  | 'med'      // Health & Medical
  | 'promo'    // Marketing & Media
  | 'regional';// Bangladesh & India

export const DS_CATEGORY_ORDER: DsCategory[] = [
  'career', 'office', 'finance', 'legal', 'cert', 'edu', 'event', 'med', 'promo', 'regional',
];

export const DS_CATEGORY_LABELS: Record<DsCategory, T3> = {
  career: L3('চাকরি ও ক্যারিয়ার', 'करियर', 'Resume & Career'),
  office: L3('ব্যবসা ও অফিস', 'व्यापार व कार्यालय', 'Business & Office'),
  finance: L3('ইনভয়েস ও আর্থিক', 'इनवॉइस व वित्त', 'Invoices & Finance'),
  legal: L3('আইনি ও চুক্তি', 'कानूनी व अनुबंध', 'Legal & Contracts'),
  cert: L3('সনদ ও পুরস্কার', 'प्रमाणपत्र व पुरस्कार', 'Certificates & Awards'),
  edu: L3('শিক্ষা ও একাডেমিক', 'शिक्षा', 'Education & Academic'),
  event: L3('অনুষ্ঠান ও আমন্ত্রণ', 'अनुष्ठान व निमंत्रण', 'Events & Invitations'),
  med: L3('চিকিৎসা ও স্বাস্থ্য', 'चिकित्सा व स्वास्थ्य', 'Health & Medical'),
  promo: L3('মার্কেটিং ও প্রচার', 'मार्केटिंग', 'Marketing & Media'),
  regional: L3('বাংলাদেশ ও ভারত', 'बांग्लादेश व भारत', 'Bangladesh & India'),
};

export type DsFieldKind = 'text' | 'textarea' | 'date' | 'table';

export interface DsField {
  id: string;
  kind: DsFieldKind;
  label: T3;
  ph?: T3;
  rows?: number;
  /** table-এর কলাম-শিরোনাম */
  cols?: T3[];
  /** আধা-প্রশস্ত ফিল্ড (বড় ইনপুট বক্স) */
  wide?: boolean;
}

export interface DsTemplate {
  id: string;
  category: DsCategory;
  name: T3;
  desc: T3;
  styles: string[];
  defaultStyle: string;
  fields: DsField[];
  build: (values: Record<string, string>, lang: Lang, P: DsPalette) => string;
}

export type DsValues = Record<string, string>;

/** বর্তমান ভাষায় লম্বা তারিখ (ডেট-ফিল্ডের ডিফল্ট) */
export function dsToday(lang: Lang): string {
  try {
    return formatDateLong(new Date(), lang);
  } catch {
    return new Date().toLocaleDateString();
  }
}

/** প্রতিটি ডেট-ফিল্ডে আজকের তারিখ — বাকি ফিল্ড খালি */
export function dsDefaultValues(tpl: DsTemplate, lang: Lang): DsValues {
  const out: DsValues = {};
  for (const f of tpl.fields) {
    if (f.kind === 'date') out[f.id] = dsToday(lang);
  }
  return out;
}

// ═════════════════════════ ডেমো-মান (গ্যালারি-নমুনা) ═════════════════════════
/**
 * থাম্বনেইল-প্রিভিউ ও "নমুনা পূরণ" বোতামের জন্য বাস্তবধর্মী নমুনা-মান।
 * দুই স্তর: ফিল্ড-id → মান (সাঝা) + টেমপ্লেট-id → ফিল্ড-id → মান (বিশেষ)।
 * ক্যানভা/ওয়ার্ড-গ্যালারির মতো থাম্বনেইল যেন পূরণ-করা আসল দলিলের মতো দেখায়।
 */

const DEMO_TAKA = L3('১৮,৫০০ টাকা', '₹18,500', 'BDT 18,500');

/** সাঝা ফিল্ড-id → নমুনা (তিন ভাষায়) */
const DS_DEMO: Record<string, T3> = {
  // ব্যক্তি
  name: L3('মোঃ রাকিব হাসান', 'राकिब हसन', 'Rakib Hasan'),
  father: L3('মোঃ আব্দুল করিম', 'अब्दुल करीम', 'Abdul Karim'),
  mother: L3('মোসা. রহিমা বেগম', 'रहीमा बेगम', 'Rahima Begum'),
  husband: L3('মোঃ সাইফুল ইসলাম', 'सैफुल इस्लाम', 'Saiful Islam'),
  age: L3('৩২', '32', '32'),
  sex: L3('মহিলা', 'महिला', 'Female'),
  village: L3('উত্তরপাড়া', 'उत्तरपाड़ा', 'Uttarpara'),
  post: L3('মিরপুর', 'मीरपुर', 'Mirpur'),
  upazila: L3('সদর', 'सदर', 'Sadar'),
  district: L3('ঢাকা', 'ढाका', 'Dhaka'),
  address: L3('১২/এ, কলেজ রোড, মিরপুর, ঢাকা', '12/ए, कॉलेज रोड, मीरपुर', '12/A, College Road, Mirpur, Dhaka'),
  income: DEMO_TAKA,
  // যোগাযোগ
  phone: L3('+৮৮০ ১৭১২-৩৪৫৬৭৮', '+91 98765 43210', '+880 1712-345678'),
  email: L3('rakib@example.com', 'rakib@example.com', 'rakib@example.com'),
  website: L3('www.topbook.example', 'www.topbook.example', 'www.topbook.example'),
  // প্রতিষ্ঠান
  office: L3('টপবুক পাবলিকেশন্স', 'टॉपबुक पब्लिकेशन्स', 'Topbook Publications'),
  shop: L3('নূরানী ট্রেডার্স', 'नूरानी ट्रेडर्स', 'Noorani Traders'),
  institution: L3('আদর্শ উচ্চ বিদ্যালয়', 'आदर्श उच्च विद्यालय', 'Adarsha High School'),
  clinic: L3('শাপলা ক্লিনিক', 'शपला क्लिनिक', 'Shapla Clinic'),
  tagline: L3('জ্ঞানে জাতি গড়ি', 'ज्ञान से राष्ट्र निर्माण', 'Building the nation through knowledge'),
  regNo: L3('ট্রেড লাইসেন্স নং ট্র্যাড-০৯১২', 'पंजीकरण सं. TRD-0912', 'Trade licence no. TRD-0912'),
  // নম্বর-তারিখ
  refNo: L3('৫১২/টিপি/২০২৫', '512/TP/2025', 'TP-2025-512'),
  invoiceNo: L3('ইনভ-০০৮৭', 'INV-0087', 'INV-0087'),
  quoteNo: L3('কোট-০৪৩', 'QT-043', 'QT-043'),
  receiptNo: L3('রসিদ-২৯৮', 'RCP-298', 'RCP-298'),
  poNo: L3('পিও-২০২৫-১৬', 'PO-2025-16', 'PO-2025-16'),
  deathDate: L3('১২ ফেব্রুয়ারি ২০২৪', '12 फरवरी 2024', '12 February 2024'),
  // পদ-প্রতিষ্ঠান (ক্যারিয়ার)
  headline: L3('সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার', 'वरिष्ठ सॉफ्टवेयर इंजीनियर', 'Senior Software Engineer'),
  position: L3('সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার', 'वरिष्ठ सॉफ्टवेयर इंजीनियर', 'Senior Software Engineer'),
  department: L3('প্রকৌশল বিভাগ', 'इंजीनियरिंग विभाग', 'Engineering'),
  company: L3('ডাটাসফট লিমিটেড', 'डाटासॉफ्ट लिमिटेड', 'DataSoft Limited'),
  recipient: L3('নিয়োগ ব্যবস্থাপক', 'हायरिंग मैनेजर', 'Hiring Manager'),
  candidate: L3('মোঃ রাকিব হাসান', 'राकिब हसन', 'Rakib Hasan'),
  employee: L3('মোঃ রাকিব হাসান', 'राकिब हसन', 'Rakib Hasan'),
  employer: L3('ডাটাসফট লিমিটেড', 'डाटासॉफ्ट लिमिटेड', 'DataSoft Limited'),
  partyA: L3('টপবুক পাবলিকেশন্স (প্রকাশক)', 'टॉपबुक (पक्षकार-क)', 'Topbook Publications (Disclosing Party)'),
  partyB: L3('নূরানী ট্রেডার্স (প্রাপক)', 'नूरानी ट्रेडर्स (पक्षकार-ख)', 'Noorani Traders (Receiving Party)'),
  landlord: L3('মোঃ শফিকুর রহমান', 'शफ़ीकुर रहमान', 'Shafiqur Rahman'),
  tenant: L3('মোসা. নাসরিন আক্তার', 'नसरीन अख्तर', 'Nasrin Akhter'),
  donor: L3('মোঃ আব্দুল করিম', 'अब्दुल करीम', 'Abdul Karim'),
  donee: L3('মোঃ রাকিব হাসান', 'राकिब हसन', 'Rakib Hasan'),
  // সভা-অনুষ্ঠান
  to: L3('সকল বিভাগীয় প্রধান', 'सभी विभाग प्रमुख', 'All department heads'),
  from: L3('প্রশাসন বিভাগ', 'प्रशासन विभाग', 'Administration'),
  meetingTitle: L3('মাসিক সমন্বয় সভা', 'मासिक समन्वय बैठक', 'Monthly Coordination Meeting'),
  chair: L3('পরিচালক (প্রশাসন)', 'निदेशक (प्रशासन)', 'Director (Admin)'),
  time: L3('সকাল ১০টা', 'सुबह 10 बजे', '10:00 AM'),
  venue: L3('প্রতিষ্ঠানের মিলনায়তন', 'सभागृह', 'Institution auditorium'),
  guest: L3('প্রধান অতিথি: জেলা প্রশাসক', 'मुख्य अतिथि', 'Chief Guest: District Commissioner'),
  host: L3('জনাব আব্দুল করিম ও পরিবার', 'अब्दुल करीम एवं परिवार', 'Mr. & Mrs. Abdul Karim'),
  bride: L3('মোসা. শিরিন আক্তার', 'शिरीन अख्तर', 'Shirin Akhter'),
  brideGuard: L3('কন্যার পিতা: মোঃ আব্দুল করিম', 'कन्या के पिता', 'Daughter of Mr. Abdul Karim'),
  groom: L3('মোঃ রাকিব হাসান', 'राकिब हसन', 'Rakib Hasan'),
  groomGuard: L3('বরের পিতা: মোঃ সাইফুল ইসলাম', 'वर के पिता', 'Son of Mr. Saiful Islam'),
  // শিক্ষা
  className: L3('নবম শ্রেণি', 'कक्षा 9', 'Class 9'),
  section: L3('ক', 'A', 'A'),
  roll: L3('০৭', '07', '07'),
  examName: L3('অর্ধবার্ষিক মূল্যায়ন — ২০২৫', 'अर्धवार्षिक मूल्यांकन — 2025', 'Half-Yearly Assessment — 2025'),
  gpa: L3('৪.৮৯', '4.89', '4.89'),
  division: L3('প্রথম বিভাগ', 'प्रथम श्रेणी', 'First division'),
  student: L3('মোসা. জান্নাতুল ফেরদৌস', 'जन्नतुल फरदौस', 'Jannatul Ferdous'),
  teacherName: L3('মোসা. নাসরিন আক্তার', 'नसरीन अख्तर', 'Nasrin Akhter'),
  subject: L3('সহযোগিতা ও অনুমোদন প্রসঙ্গে', 'सहयोग एवं अनुमोदन हेतु', 'Regarding collaboration & approval'),
  attendance: L3('৯৬%', '96%', '96%'),
  result: L3('উত্তীর্ণ (A গ্রেড)', 'उत्तीर्ण (ग्रेड A)', 'Passed (Grade A)'),
  conduct: L3('সন্তোষজনক', 'संतोषजनक', 'Satisfactory'),
  effective: L3('১ জানুয়ারি ২০২৬', '1 जनवरी 2026', '1 January 2026'),
  duration: L3('৪৫ মিনিট', '45 मिनट', '45 minutes'),
  // চিকিৎসা
  doctor: L3('ডা. ফারহানা ইয়াসমিন', 'डॉ. फरहाना यासमीन', 'Dr. Farhana Yasmin'),
  degrees: L3('এমবিবিএস (ঢামেক), বিসিএস (স্বাস্থ্য)', 'एमबीबीएस, बीसीएस', 'MBBS (DMC), BCS (Health)'),
  designation: L3('উপ-পরিচালক (চিকিৎসা)', 'उप-निदेशक (चिकित्सा)', 'Deputy Director (Medical)'),
  bmdc: L3('এ-৪৫৩২১', 'A-45321', 'A-45321'),
  chamber: L3('শাপলা ক্লিনিক, রুম-৩০২, স্টেশন রোড, ঢাকা\nসন্ধ্যা ৫টা–রাত ৯টা (শুক্রবার বন্ধ)', 'शपला क्लिनिक', 'Shapla Clinic, Room 302, Station Road, Dhaka\n5 PM – 9 PM (Friday closed)'),
  patient: L3('মোসা. জান্নাতুল ফেরদৌস', 'जन्नतुल फरदौस', 'Jannatul Ferdous'),
  weight: L3('৫৮ কেজি', '58 किग्रा', '58 kg'),
  bp: L3('১২০/৮০ মিমিহি', '120/80 mmHg', '120/80 mmHg'),
  next: L3('৭ দিন পর পুনরায় দেখা দিন', '7 दिन बाद पुनः आएँ', 'Review after 7 days'),
  // স্বাক্ষর
  sign1Name: L3('মোঃ শফিকুর রহমান', 'शफ़ीकुर रहमान', 'Shafiqur Rahman'),
  sign2Name: L3('মোসা. নাসরিন আক্তার', 'नसरीन अख्तर', 'Nasrin Akhter'),
  sign1Title: L3('চেয়ারম্যান', 'अध्यक्ष', 'Chairman'),
  sign2Title: L3('সচিব', 'सचिव', 'Secretary'),
  witness1: L3('মোঃ আব্দুল জলিল', 'अब्दुल जलील', 'Abdul Jalil'),
  witness2: L3('মোঃ কামরুল হাসান', 'कमरुल हसन', 'Kamrul Hasan'),
  // ক্যারিয়ার-পাঠ্য (রেজিউমে/সিভি)
  summary: L3(
    '৮ বছরের অভিজ্ঞতাসম্পন্ন সফটওয়্যার প্রকৌশলী — ওয়েব-প্ল্যাটফর্ম, পেমেন্ট-সিস্টেম ও দল-নেতৃত্বে দক্ষ। পরিষ্কার কোড ও ব্যবহারকারী-বান্ধব ডিজাইনে বিশ্বাসী।',
    '8 वर्ष का अनुभवी सॉफ्टवेयर इंजीनियर — वेब-प्लेटफ़ॉर्म व टीम-नेतृत्व में दक्ष।',
    'Software engineer with 8 years of experience across web platforms, payment systems and team leadership. Believes in clean code and user-first design.',
  ),
  expRows: L3(
    'সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার | ডাটাসফট লিমিটেড | ২০২১–বর্তমান | পেমেন্ট-প্ল্যাটফর্মের নেতৃত্ব\nসফটওয়্যার ইঞ্জিনিয়ার | টেকনো সফট | ২০১৮–২০২১ | ওয়েব-অ্যাপ নির্মাণ',
    'वरिष्ठ इंजीनियर | डाटासॉफ्ट | 2021–अब | पेमेंट प्लेटफ़ॉर्म\nइंजीनियर | टेक्नो सॉफ्ट | 2018–2021 | वेब-ऐप',
    'Senior Software Engineer | DataSoft Limited | 2021–present | Led the payments platform\nSoftware Engineer | TechnoSoft | 2018–2021 | Built web apps',
  ),
  eduRows: L3(
    'বিএসসি (কম্পিউটার সায়েন্স) | ঢাকা বিশ্ববিদ্যালয় | ২০১৮\nএইচএসসি (বিজ্ঞান) | ঢাকা কলেজ | ২০১৪',
    'बीएससी (कंप्यूटर विज्ञान) | ढाका विश्वविद्यालय | 2018',
    'BSc Computer Science | University of Dhaka | 2018\nHSc Science | Dhaka College | 2014',
  ),
  skills: L3('টাইপস্ক্রিপ্ট · রিঅ্যাক্ট · নোড.জেএস\nপ্রজেক্ট ম্যানেজমেন্ট\nদল-নেতৃত্ব ও মেন্টরিং', 'टाइपस्क्रिप्ट · रिएक्ट · नोड\nप्रोजेक्ट मैनेजमेंट', 'TypeScript · React · Node.js\nProject management\nTeam leadership & mentoring'),
  languages: L3('বাংলা — মাতৃভাষা\nইংরেজি — সাবলীল', 'हिन्दी — मातृभाषा\nअंग्रेज़ी — प्रवीण', 'Bangla — native\nEnglish — fluent'),
  extras: L3('AWS সার্টিফাইড সলিউশন আর্কিটেক্ট (২০২৩)\nজাতীয় প্রোগ্রামিং প্রতিযোগিতা — রানার-আপ', 'AWS प्रमाणपत्र (2023)', 'AWS Certified Solutions Architect (2023)\nNational programming contest — runner-up'),
  contactLine: L3('মোবাইল: +৮৮০ ১৭১২-৩৪৫৬৭৮ · ইমেইল: rakib@example.com · ঢাকা, বাংলাদেশ', 'मोबाइल · ईमेल · शहर', 'Phone: +880 1712-345678 · Email: rakib@example.com · Dhaka, Bangladesh'),
  refsNote: L3('চাহিবামাত্র প্রাপ্য', 'मांग पर उपलब्ध', 'Available upon request'),
  // টেক্সট-ধর্মী তারিখ (অনুষ্ঠান-টেমপ্লেট)
  date: L3('১ জানুয়ারি ২০২৭', '1 जनवरी 2027', '1 January 2027'),
  // চিঠি-চুক্তির সাঝা পাঠ্য
  addressLines: L3('১২/এ, কলেজ রোড\nমিরপুর, ঢাকা-১২০৭', 'कॉलेज रोड\nमीरपुर', '12/A, College Road\nMirpur, Dhaka-1207'),
  phoneEmail: L3('+৮৮০ ১৭১২-৩৪৫৬৭৮ · rakib@example.com', '+91 98765 43210 · rakib@example.com', '+880 1712-345678 · rakib@example.com'),
  companyAddress: L3('রুম-৫০১, স্টেশন রোড\nঢাকা-১২১৬', 'स्टेशन रोड\nदिल्ली', 'Room 501, Station Road\nDhaka-1216'),
  body: L3(
    'বিনীত নিবেদন এই যে, আমি দীর্ঘদিন যাবৎ এ অঞ্চলের বাসিন্দা — উপর্যুক্ত বিষয়ে আপনার সদয় অনুমোদন ও সহযোগিতা প্রার্থনা করছি।',
    'विनम्र निवेदन है कि…',
    'I respectfully state that I am a long-standing resident of this area — your kind approval and cooperation are requested.',
  ),
  relation: L3(
    'গত তিন বছর তাঁর শ্রেণি-শিক্ষক হিসাবে ঘনিষ্ঠভাবে পরিচিত — তাঁর কর্ম-নিষ্ঠা ও অধ্যয়ন-অভ্যাস আমি কাছ থেকে দেখেছি।',
    'तीन वर्षों से उनके शिक्षक रहा हूँ।',
    'As his/her class teacher for three years, I have seen the diligence and study habits first-hand.',
  ),
  qualities: L3('অধ্যবসায়ী ও কৌতূহলী শিক্ষার্থী\nগণিত ও প্রোগ্রামিংয়ে অসাধারণ দক্ষতা\nসহপাঠীদের সহযোগিতায় সবসময় এগিয়ে', 'परिश्रमी व जिज्ञासु\nगणित व प्रोग्रामिंग में उत्कृष्ट', 'Persistent and curious learner\nExceptional in mathematics and programming\nAlways ready to help classmates'),
  closer: L3(
    'আমি অকাতরে তাঁর জন্য সুপারিশ করছি — তিনি যে-কোনো প্রতিষ্ঠানে বিশ্বাসযোগ্যতা ও মেধা নিয়ে অবদান রাখবেন।',
    'मैं पूर्ण विश्वास के साथ सिफ़ारिश करता हूँ।',
    'I recommend him/her without reservation — any institution will gain a capable and trustworthy member.',
  ),
  contact: L3('office@example.com · +৮৮০ ১৭১২-৩৪৫৬৭৮', 'office@example.com', 'office@example.com · +880 1712-345678'),
  lastDay: L3('৩০ ডিসেম্বর ২০২৬', '30 दिसंबर 2026', '30 December 2026'),
  notice: L3(
    'কোম্পানির নিয়ম-মেনে এক মাসের নোটিশ দিয়ে আমি আমার পদ থেকে পদত্যাগের অভিপ্রায় জানাচ্ছি।',
    'एक माह की सूचना देकर त्यागपत्र।',
    'With the company\u2019s required one month\u2019s notice, I hereby resign from my position.',
  ),
  gratitude: L3(
    'এ প্রতিষ্ঠানে পাওয়া অভিজ্ঞতা ও সহযোগিতার জন্য আন্তরিক কৃতজ্ঞ — হস্তান্তর নির্বিঘ্নে সম্পন্ন করার প্রতিশ্রুতি দিচ্ছি।',
    'कृतज्ञता व हस्तांतरण का वादा।',
    'Grateful for the experience and support here — I commit to a smooth handover.',
  ),
  toWho: L3('বরাবর, উপজেলা নির্বাহী অফিসার', 'सेवा में, उपजेला अधिकारी', 'The Upazila Nirbahi Officer'),
  deedDate: L3('২০ নভেম্বর ২০২৬', '20 नवंबर 2026', '20 November 2026'),
  landDesc: L3(
    'জেলা ঢাকা, উপজেলা সদর, মৌজা মিরপুর — খতিয়ান নং ৪৭, দাগ নং ৩২১, জমি ১০ শতক।',
    'मौजा मीरपुर, दाग 321, क्षेत्रफल 10 शतक।',
    'District Dhaka, Sadar upazila, Mirpur mauza — khatian 47, dag 321, land 10 shotok.',
  ),
  consideration: L3('দানমূল্য/বিবেচনা-মূল্য: ৫,০০,০০০ টাকা', 'विचार-मूल्य: ₹5,00,000', 'Consideration: BDT 5,00,000'),
  draftsman: L3('দলিল-লেখক: মোঃ হারুন অর রশিদ', 'लेखक: हारून रशीद', 'Drafted by: Md. Harun Or Rashid'),
  // সংবাদ
  city: L3('ঢাকা', 'दिल्ली', 'Dhaka'),
};

/** বিশেষ টেমপ্লেট-ভিত্তিক নমুনা — ফিল্ড-অর্থ ভিন্ন হলে বা টেবিলের সারিতে */
const DS_DEMO_SPECIAL: Record<string, Record<string, T3>> = {
  // ── সনদ (regional) ──
  residence: {
    office: L3('মিরপুর ইউনিয়ন পরিষদ', 'मीरपुर यूनियन परिषद', 'Mirpur Union Parishad'),
    body: L3('তিনি দীর্ঘদিন যাবৎ এ এলাকার সুনামধন্য, শান্তিপ্রিয় ও সৎ ব্যক্তি হিসাবে পরিচিত।', 'वे इस क्षेत्र के प्रतिष्ठित निवासी हैं।', 'He/She is a long-standing respected resident of this area.'),
  },
  character: {
    office: L3('মিরপুর ইউনিয়ন পরিষদ', 'मीरपुर यूनियन परिषद', 'Mirpur Union Parishad'),
    body: L3('তাঁর ব্যক্তিগত চরিত্র সম্পর্কে এ এলাকায় কোনো অভিযোগ নেই।', 'उनके चरित्र के बारे में कोई शिकायत नहीं है।', 'His/Her personal character is beyond reproach in this area.'),
  },
  unmarried: {
    office: L3('মিরপুর ইউনিয়ন পরিষদ', 'मीरपुर यूनियन परिषद', 'Mirpur Union Parishad'),
    body: L3('তিনি এ পর্যন্ত বিবাহবন্ধনে আবদ্ধ হননি — এমন কোনো তথ্য এ অফিসে নেই।', 'वे अविवाहित हैं।', 'Records show he/she is unmarried.'),
  },
  income: {
    office: L3('মিরপুর ইউনিয়ন পরিষদ', 'मीरপुर यूनियन परिषद', 'Mirpur Union Parishad'),
    body: L3('তাঁর ঘোষিত বার্ষিক আয়ের সূত্র: ক্ষুদ্র ব্যবসা ও কৃষি।', 'आय का स्रोत: छोटा व्यवसाय।', 'Declared income sources: small business & agriculture.'),
  },
  heir: {
    body: L3('মৃত ব্যক্তি এ এলাকার স্থায়ী বাসিন্দা ছিলেন এবং তাঁর ওয়ারিশগণ নিম্নরূপ।', 'मृतक इस क्षेत्र के स्थायी निवासी थे।', 'The deceased was a permanent resident of this area.'),
    heirs: L3(
      'রহিমা বেগম | স্ত্রী | ৬২\nরাকিব হাসান | ছেলে | ৩৪\nশিরিন আক্তার | মেয়ে | ২৯',
      'रहीमा बेगम | पत्नी | 62\nराकिब हसन | पुत्र | 34',
      'Rahima Begum | Wife | 62\nRakib Hasan | Son | 34\nShirin Akhter | Daughter | 29',
    ),
  },
  affidavit: {
    court: L3('নোটারি পাবলিক, ঢাকা', 'नोटरी पब्लिक, दिल्ली', 'Notary Public, Dhaka'),
    body: L3('আমি ঘোষণা করছি যে আমার সঠিক নাম, ঠিকানা ও পরিচয় উপরে বর্ণিত অনুযায়ী।\nআমি আরও ঘোষণা করছি যে বক্তব্যগুলো সত্য ও সঠিক।', 'मैं घोषणा करता हूँ…', 'I declare that my name and identity are as stated above.\nI further declare the statements are true.'),
  },
  'general-app': {
    ask: L3('অতএব, মহোদয়ের নিকট বিনীত আবেদন, উপর্যুক্ত বিষয়ে প্রয়োজনীয় ব্যবস্থা গ্রহণের নির্দেশ প্রদান করতে আপনার মর্জি হয়।', 'अतः आवश्यक कार्रवाई की जाए।', 'I therefore request the necessary action.'),
    signMeta: L3('পিতা: মোঃ আব্দুল করিম\nগ্রাম: উত্তরপাড়া, মিরপুর\nমোবাইল: +৮৮০ ১৭১২-৩৪৫৬৭৮', 'पिता: अब्दुल करीम', 'Father: Abdul Karim\nVillage: Uttarpara, Mirpur\nMobile: +880 1712-345678'),
  },
  mutation: {
    body: L3('আমার পিতার নামে খতিয়ান-সংশোধনের জন্য সকল দলিল সংযুক্ত করা হলো।', 'खसरा संशोधन हेतु आवेदन।', 'Application for record correction with all deeds attached.'),
    ask: L3('অতএব, মহোদয়ের নিকট বিনীত আবেদন, দাখিলা রেকর্ড সংশোধন করতে আপনার মর্জি হয়।', 'अतः रिकॉर्ड संशोधन करें।', 'I therefore request the record correction.'),
  },
  // ── অফিস ──
  notice: {
    title: L3('গুরুত্বপূর্ণ বিজ্ঞপ্তি', 'महत्वपूर्ण सूचना', 'Important Notice'),
    body: L3('প্রতিষ্ঠানের বার্ষিক রক্ষণাবেক্ষণ-কার্যক্রমের কারণে আগামী শুক্রবার প্রতিষ্ঠান বন্ধ থাকবে।', 'रखरखाव के कारण शुक्रवार को बंद रहेगा।', 'Due to annual maintenance, the office will remain closed this Friday.'),
    points: L3('শুক্রবার সকাল ৯টা থেকে বন্ধ\nরবিবার সকাল ১০টায় স্বাভাবিক\nজরুরি যোগাযোগ: +৮৮০ ১৭১২-৩৪৫৬৭৮', 'शुक्रवार बंद', 'Closed from 9 AM Friday\nReopens Sunday 10 AM\nEmergency: +880 1712-345678'),
  },
  'office-order': {
    title: L3('অফিস আদেশ', 'कार्यालय आदेश', 'Office Order'),
    body: L3('উপরের নির্দেশনাগুলো তাৎক্ষণিক কার্যকর করা হচ্ছে — সংশ্লিষ্ট সবাই বাধ্য থাকবেন।', 'ये निर्देश तत्काल प्रभावी हैं।', 'The above directives take immediate effect.'),
    orders: L3('কমপ্লায়েন্স-টিম পুনর্গঠন করা হয়েছে।\nসকল শাখার রিপোর্ট প্রতি বৃহস্পতিবার জমা দিতে হবে।\nনিরাপত্তা-প্রশিক্ষণে সবার অংশগ্রহণ বাধ্যতামূলক।', 'आदेश…', 'The compliance team is restructured.\nWeekly reports due every Thursday.\nSecurity training is mandatory.'),
  },
  'official-letter': {
    toBlock: L3('বরাবর\nজেলা শিক্ষা অফিসার\nজেলা প্রশাসন, ঢাকা', 'जिला शिक्षा अधिकारी', 'The District Education Officer\nDhaka District'),
    sourceRef: L3('আপনার স্মারক নং ৪৭/শিক্ষা/২০২৫, তারিখ ১১ নভেম্বর ২০২৫', 'पत्र सं. 47/2025', 'Ref: your memo 47/Edu/2025 dated 11 Nov 2025'),
    body: L3('আপনার আদেশের আলোকে প্রতিষ্ঠানের হালনাগাদ অবস্থা ও প্রয়োজনীয় ব্যবস্থার বিবরণ এ পত্রের সাথে প্রেরণ করা হলো — পরবর্তী নির্দেশনা প্রার্থনা করছি।', 'विवरण संलग्न है।', 'As directed, the current status and required measures are enclosed — further guidance is requested.'),
  },
  report: {
    title: L3('পরিদর্শন-প্রতিবেদন', 'निरीक्षण रिपोर्ट', 'Inspection Report'),
    intro: L3('নির্দেশিত স্থান পরিদর্শন সম্পন্ন করে প্রাপ্ত তথ্যের ভিত্তিতে এ প্রতিবেদন প্রস্তুত করা হলো।', 'निरीक्षण रिपोर्ट।', 'This report is prepared after the assigned site visit.'),
    visit: L3('পরিদর্শনের সময়: সকাল ১১টা–দুপুর ১টা · উপস্থিত: ব্যবস্থাপক ও দুইজন কর্মকর্তা', 'समय…', 'Visit time: 11 AM–1 PM · Present: manager & two officers'),
    findings: L3('কার্যক্রম সাধারণভাবে সন্তোষজনক, তবে সংরক্ষণ-ঘরে দুর্বল ব্যবস্থাপনা লক্ষ্য করা যায়।', 'क्रियाएँ संतोषजनक हैं।', 'Operations are generally satisfactory; storage management needs improvement.'),
    obs: L3('নিরাপত্তা-সরঞ্জামের ব্যবহার নিয়মিত নয়।\nরেজিস্টার-হালনাগাদ দেরিতে হচ্ছে।\nকর্মীদের প্রশিক্ষণ প্রয়োজন।', 'टिप्पणियाँ…', 'Safety gear usage is inconsistent.\nRegister updates lag.\nStaff training is needed.'),
    recs: L3('সংরক্ষণ-ঘরে মাসিক জবাবদিহি চালু করা।\nত্রৈমাসিক নিরাপত্তা-প্রশিক্ষণ আয়োজন।', 'सुझाव…', 'Introduce monthly stock reconciliation.\nHold quarterly safety training.'),
  },
  letterhead: {
    name: L3('টপবুক পাবলিকেশন্স', 'टॉपबुक पब्लिकेशन्स', 'Topbook Publications'),
    tagline: L3('বইয়ের হাতে-কলমে প্রযুক্তি', 'पुस्तक प्रौद्योगिकी', 'Craft technology for books'),
    address: L3('১২/এ, কলেজ রোড, মিরপুর, ঢাকা-১২০৭', 'कॉलेज रोड, दिल्ली', '12/A, College Road, Mirpur, Dhaka-1207'),
  },
  memo: {
    subject: L3('শীতকালীন কর্মঘণ্টা পরিবর্তন', 'शीतकालीन कार्यघंटा', 'Winter working hours change'),
    body: L3('১ ডিসেম্বর থেকে অফিসের কর্মঘণ্টা সকাল ৯টা–বিকেল ৫টা নির্ধারিত হয়েছে। সব বিভাগ অনুগত থাকার অনুরোধ করা হলো।', 'समय बदलाव।', 'From 1 December, office hours are 9 AM–5 PM. All departments are requested to comply.'),
  },
  'meeting-agenda': {
    items: L3(
      'শুভেচ্ছা ও স্বাগত\nপূর্ববর্তী সভার কার্যবিবরণী অনুমোদন\nগত তিন মাসের অগ্রগতি পর্যালোচনা\nবাজেট ও পরবর্তী পরিকল্পনা\nযে-কোনো অন্য বিষয়',
      'स्वागत\nपिछली बैठक के कार्यवृत्त की स्वीकृति\nप्रगति समीक्षा\nबजट व योजना\nअन्य विषय',
      'Welcome & roll call\nApproval of previous minutes\nReview of last quarter\u2019s progress\nBudget & next plan\nAny other business',
    ),
    note: L3('সভায় উপস্থিতি একান্ত বাধ্যতামূলক।', 'उपस्थिति अनिवार्य है।', 'Attendance is mandatory.'),
  },
  'meeting-minutes': {
    attendees: L3('মোঃ শফিকুর রহমান — সভাপতি\nনাসরিন আক্তার — সচিব\nরাকিব হাসান — প্রকৌশল\nকামরুল হাসান — বিতরণ', 'शफ़ीकुर…', 'Shafiqur Rahman — Chair\nNasrin Akhter — Secretary\nRakib Hasan — Engineering\nKamrul Hasan — Distribution'),
    discussion: L3('প্রকাশনা-ক্যালেন্ডারের অগ্রগতি, মুদ্রণ-দর ও বিতরণ-চ্যালেঞ্জ নিয়ে বিস্তারিত আলোচনা হয়; সদস্যগণ পরবর্তী পদক্ষেপ মত করেন।', 'चर्चा…', 'Progress of the publishing calendar, printing rates and distribution challenges were discussed.'),
    decisions: L3('মুদ্রণ-দর পুনর্নির্ধারণ করা হবে।\nতিনটি নতুন শিরোনাম জানুয়ারিতে প্রকাশ হবে।\nপ্রতি মাসের প্রথম সোমবার সমন্বয় সভা।', 'निर्णय…', 'Printing rates will be revised.\nThree new titles publish in January.\nCoordination meeting on the first Monday monthly.'),
    nextMeeting: L3('পরবর্তী সভা: ৫ জানুয়ারি ২০২৬, সকাল ১০টা', 'अगली बैठक', 'Next meeting: 5 January 2026, 10 AM'),
    actions: L3(
      'মুদ্রণ-কোটেশন সংগ্রহ | প্রশাসন | ৩০ নভেম্বর\nনতুন শিরোনামের প্রুফ | সম্পাদনা | ১০ ডিসেম্বর',
      'कोटेशन | प्रशासन | 30 नवंबर',
      'Collect print quotations | Admin | 30 Nov\nProof new titles | Editorial | 10 Dec',
    ),
  },
  // ── অর্থ-আর্থিক ──
  invoice: {
    buyer: L3('অমুক স্টোর\nস্টেশন রোড, মিরপুর বাজার\nঢাকা-১২১৬', 'स्टोर…', 'A. K. Store\nStation Road, Mirpur Bazar\nDhaka-1216'),
    items: L3(
      'টিনের ছাদ (৮ ফুট) | ১২ | ১,৪৫০ | ১৭,৪০০\nসিমেন্ট (বস্তা) | ৫ | ৪১০ | ২,০৫০\nরং (গ্যালন) | ২ | ৭৮০ | ১,৫৬০',
      'छत | 12 | 1,450 | 17,400',
      'Roof sheet (8 ft) | 12 | 1,450 | 17,400\nCement (bag) | 5 | 410 | 2,050\nPaint (gallon) | 2 | 780 | 1,560',
    ),
    discount: L3('১,০০০', '1,000', '1,000'),
    vat: L3('৫', '5', '5'),
    note: L3('পণ্য নেওয়ার পর কোনো অভিযোগ গ্রহণযোগ্য নয়।', 'माल लेने के बाद शिकायत नहीं।', 'No claim accepted after goods are taken away.'),
  },
  quotation: {
    buyer: L3('অমুক স্টোর\nস্টেশন রোড, মিরপুর\nঢাকা-১২১৬', 'स्टोर…', 'A. K. Store\nStation Road, Mirpur\nDhaka-1216'),
    items: L3(
      'ওয়েবসাইট ডিজাইন ও নির্মাণ | ১ | ২৫,০০০ | ২৫,০০০\nহোস্টিং (বার্ষিক) | ১ | ৪,৫০০ | ৪,৫০০\nডোমেইন (বার্ষিক) | ১ | ১,২০০ | ১,২০০',
      'वेबसाइट | 1 | 25,000 | 25,000',
      'Website design & build | 1 | 25,000 | 25,000\nHosting (annual) | 1 | 4,500 | 4,500\nDomain (annual) | 1 | 1,200 | 1,200',
    ),
    validity: L3('এ কোটেশন ১৫ দিন পর্যন্ত বহাল থাকবে।', '15 दिन वैध।', 'This quotation is valid for 15 days.'),
    terms: L3('অগ্রিম ৫০% — ডেলিভারিতে বাকি।\nকাজের পরিধি বাড়লে খরচ পুনর্গণনা হবে।', 'शर्तें…', '50% advance — rest on delivery.\nScope changes are re-estimated.'),
  },
  'purchase-order': {
    vendor: L3('নূরানী ট্রেডার্স\nস্টেশন রোড, মিরপুর\nঢাকা-১২১৬', 'विक्रेता…', 'Noorani Traders\nStation Road, Mirpur\nDhaka-1216'),
    shipTo: L3('টপবুক পাবলিকেশন্স\nগুদাম-২, কলেজ রোড\nঢাকা-১২০৭', 'पता…', 'Topbook Publications\nWarehouse 2, College Road\nDhaka-1207'),
    items: L3(
      'এ-৪ কাগজ (রিম) | ২০ | ৫২০ | ১০,৪০০\nটোনার কার্ট্রিজ | ২ | ৫,৮০০ | ১১,৬০০\nহোয়াইটবোর্ড (৪×৩) | ৩ | ২,৪০০ | ৭,২০০',
      'कागज | 20 | 520 | 10,400',
      'A4 paper (ream) | 20 | 520 | 10,400\nToner cartridge | 2 | 5,800 | 11,600\nWhiteboard (4×3) | 3 | 2,400 | 7,200',
    ),
    deliveryDate: L3('১৫ ডিসেম্বর ২০২৫-এর মধ্যে', '15 दिसंबर 2025 तक', 'By 15 December 2025'),
    paymentTerms: L3('ডেলিভারির ১৫ দিনের মধ্যে', 'Net 15', 'Net 15'),
  },
  'money-receipt': {
    payer: L3('মোঃ রাকিব হাসান', 'राकिब हसन', 'Rakib Hasan'),
    amount: L3('৫০,০০০', '50,000', '50,000'),
    amountWords: L3('পঞ্চাশ হাজার টাকা মাত্র', 'पचास हज़ार रुपये मात्र', 'Fifty thousand taka only'),
    purpose: L3('বই-মুদ্রণের অগ্রিম পরিশোধ', 'मुद्रण अग्रिम', 'Advance payment for book printing'),
    byCheque: L3('চেক নং ৪৫৩২১০, সোনালী ব্যাংক', 'चेक सं.', 'Cheque no. 453210, Sonali Bank'),
  },
  // ── আইনি ──
  agreement: {
    title: L3('সম্মতি-পত্র', 'समझौता पत्र', 'Agreement Deed'),
    deedDate: L3('২০ নভেম্বর ২০২৫', '20 नवंबर 2025', '20 November 2025'),
    body: L3('উভয় পক্ষ স্বেচ্ছায় ও সুস্থ-মস্তিষ্কে নিম্নোক্ত শর্তে সম্মত হইয়াছে।', 'दोनों पक्ष सहमत हैं।', 'Both parties freely agree to the following terms.'),
    clauses: L3(
      'এক। চুক্তি কার্যকর হইতে উভয় পক্ষ এ শর্তাবলির বাধ্য হইবে।\nদুই। কোনো শর্ত ভঙ্গ হইলে চুক্তি বাতিল গণ্য হইবে।\nতিন। বিরোধ হইলে উভয় পক্ষের সম্মতিতে সমাধান হইবে।\nচার। এ সম্মতি-পত্র দুই কপিতে লেখা, উভয় পক্ষের নিকট এক-একটি থাকিবে।',
      'शर्तें…',
      '1. Both parties are bound by these terms from the effective date.\n2. Breach of any term voids the agreement.\n3. Disputes are settled by mutual consent.\n4. Executed in two copies — one for each party.',
    ),
  },
  'rental-agreement': {
    title: L3('ভাড়া-চুক্তিনামা', 'किराया अनुबंध', 'Rental Agreement'),
    deedDate: L3('১ ডিসেম্বর ২০২৫', '1 दिसंबर 2025', '1 December 2025'),
    property: L3('রুম-৫বি, তৃতীয় তলা, ১২/এ কলেজ রোড, মিরপুর, ঢাকা', 'कमरा 5B', 'Room 5B, 3rd floor, 12/A College Road, Mirpur, Dhaka'),
    termStart: L3('১ ডিসেম্বর ২০২৫', '1 दिसंबर 2025', '1 December 2025'),
    termEnd: L3('৩০ নভেম্বর ২০২৬', '30 नवंबर 2026', '30 November 2026'),
    rent: DEMO_TAKA,
    advance: L3('৫৫,৫০০ টাকা (৩ মাসের অগ্রিম)', '₹55,500', 'BDT 55,500 (3 months advance)'),
    clauses: L3(
      'এক। ভাড়া প্রতি মাসের ১০ তারিখের মধ্যে পরিশোধ্য।\nদুই। বিদ্যুৎ-গ্যাস-পানির বিল ভাড়াটিয়া বহন করিবেন।\nতিন। তিন মাসের অগ্রিম-নোটিশ ছাড়া উভয় পক্ষ চুক্তি বাতিল করিতে পারিবেন না।',
      'शर्तें…',
      '1. Rent is due by the 10th of each month.\n2. Utilities are borne by the tenant.\n3. Either party may terminate with three months\u2019 notice.',
    ),
  },
  'employment-contract': {
    title: L3('চাকরির চুক্তি', 'रोजगार अनुबंध', 'Employment Contract'),
    deedDate: L3('১ ডিসেম্বর ২০২৫', '1 दिसंबर 2025', '1 December 2025'),
    startDate: L3('১৫ ডিসেম্বর ২০২৫', '15 दिसंबर 2025', '15 December 2025'),
    salary: L3('৮৫,০০০ টাকা (মাসিক)', '₹85,000 (मासिक)', 'BDT 85,000 (monthly)'),
    duties: L3('ওয়েব-প্ল্যাটফর্মের উন্নয়ন ও রক্ষণাবেক্ষণ; দল-পরিচালনা; প্রতিবেদন প্রস্তুত।', 'कर्तव्य…', 'Develop and maintain the web platform; lead the team; prepare reports.'),
    clauses: L3(
      'এক। প্রারম্ভিক চাকরির মেয়াদ এক বৎসর — পরীক্ষামূলক সময় তিন মাস।\nদুই। কনফিডেনশিয়ালিটি-শর্ত চাকরি-শেষেও বহাল থাকিবে।\nতিন। উভয় পক্ষ এক মাসের নোটিশে চুক্তি বদল করিতে পারিবে।',
      'शर्तें…',
      '1. Initial term is one year with a three-month probation.\n2. Confidentiality survives termination.\n3. Either party may amend with one month\u2019s notice.',
    ),
  },
  nda: {
    deedDate: L3('২০ নভেম্বর ২০২৫', '20 नवंबर 2025', '20 November 2025'),
    purpose: L3('পাণ্ডুলিপি ও প্রকাশনা-সম্পদ সুরক্ষার জন্য গোপনীয়তা-চুক্তি।', 'गोपनीयता अनुबंध।', 'Confidentiality agreement to protect manuscripts and publishing assets.'),
    definition: L3('গোপন তথ্য: পাণ্ডুলিপি, লেখক-চুক্তি, বিক্রয়-তথ্য, গ্রাহক-তালিকা ও আর্থিক বিবরণ।', 'गोपनीय जानकारी…', 'Confidential information: manuscripts, author contracts, sales data, client lists and financials.'),
    obligations: L3('প্রাপক গোপন তথ্য তৃতীয় পক্ষকে দিবেন না।\nশুধু নির্ধারিত কাজে ব্যবহার করিবেন।\nচুক্তি-শেষে সব কপি ফেরত দিবেন।', 'दायित्व…', 'The recipient shall not disclose confidential information.\nUse it solely for the defined work.\nReturn all copies on termination.'),
    term: L3('৩ বৎসর (চুক্তি-শেষেও ২ বৎসর বহাল)', '3 वर्ष', '3 years (2 years after termination)'),
    governingLaw: L3('বাংলাদেশের প্রচলিত আইন', 'भारतीय कानून', 'Laws of Bangladesh'),
  },
  // ── সনদ-পুরস্কার ──
  award: {
    title: L3('সম্মাননা স্মারক', 'सम्मान प्रमाणपत्र', 'Award of Honour'),
    body: L3('শিক্ষা-ক্ষেত্রে অসামান্য অবদানের জন্য এ সম্মাননা প্রদান করা হলো।', 'शिक्षा में योगदान हेतु।', 'Presented for outstanding contribution to education.'),
    body2: L3('প্রতিষ্ঠান তাঁর প্রতি আন্তরিক কৃতজ্ঞতা ও শুভেচ্ছা জানাচ্ছে।', 'कृतज्ञता।', 'The institution extends its sincere gratitude and best wishes.'),
  },
  'certificate-appreciation': {
    reason: L3('স্বেচ্ছাসেবা ও সংগঠন-দক্ষতায় বিশেষ অবদানের জন্য।', 'स्वयंसेवा हेतु।', 'For exceptional volunteer service and organisational skill.'),
    body2: L3('আশা করি ভবিষ্যতেও তিনি একই নিষ্ঠায় কাজ চালিয়ে যাবেন।', 'आशा है…', 'We look forward to his/her continued dedication.'),
  },
  'certificate-participation': {
    eventName: L3('জাতীয় প্রোগ্রামিং প্রতিযোগিতা ২০২৫', 'राष्ट्रीय प्रोग्रामिंग प्रतियोगिता', 'National Programming Contest 2025'),
    role: L3('অংশগ্রহণকারী', 'प्रतिभागी', 'Participant'),
    venue: L3('ঢাকা বিশ্ববিদ্যালয়', 'दिल्ली विश्वविद्यालय', 'University of Dhaka'),
  },
  'certificate-training': {
    programName: L3('তথ্য-প্রযুক্তি দক্ষতা উন্নয়ন কর্মশালা', 'आईटी कौशल कार्यशाला', 'IT Skills Development Workshop'),
    duration: L3('৩ মাসের কোর্স (৬০ ঘণ্টা)', '3 माह (60 घंटे)', '3-month course (60 hours)'),
    topics: L3('ওয়েব-উন্নয়নের ভিত্তি\nডাটাবেজ ও সার্ভার\nপ্রজেক্ট-পোর্টফোলিও', 'विषय…', 'Web development fundamentals\nDatabases & servers\nProject portfolio'),
  },
  // ── শিক্ষা ──
  'class-routine': {
    title: L3('ক্লাস রুটিন — ২০২৬', 'कक्षा रुटीन — 2026', 'Class Routine — 2026'),
    grid: L3(
      '৯:০০–৯:৪৫ | বাংলা | ইংরেজি | গণিত | বিজ্ঞান | ধর্ম\n৯:৪৫–১০:৩০ | ইংরেজি | গণিত | বাংলা | আইসিটি | বিজ্ঞান\n১০:৩০–১১:১৫ | গণিত | বিজ্ঞান | ইংরেজি | বাংলা | সমাজ\n১১:১৫–১১:৩০ | টিফিন | টিফিন | টিফিন | টিফিন | টিফিন\n১১:৩০–১২:১৫ | বিজ্ঞান | ধর্ম | সমাজ | ইংরেজি | গণিত',
      '9:00 | हिंदी | अंग्रेज़ी | गणित…',
      '9:00–9:45 | Bangla | English | Math | Science | Religion\n9:45–10:30 | English | Math | Bangla | ICT | Science\n10:30–11:15 | Math | Science | English | Bangla | Social\n11:15–11:30 | Break | Break | Break | Break | Break\n11:30–12:15 | Science | Religion | Social | English | Math',
    ),
    note: L3('শিক্ষক-সভা: প্রতি শনিবার শেষ পিরিয়ডে।', 'शिक्षक सभा…', 'Staff meeting: last period every Saturday.'),
  },
  'exam-routine': {
    title: L3('অর্ধবার্ষিক পরীক্ষা — ২০২৬', 'अर्धवार्षिक परीक्षा — 2026', 'Half-Yearly Examination — 2026'),
    rows: L3(
      '১ ডিসেম্বর | সোমবার | ১০:০০–১:০০ | বাংলা\n৩ ডিসেম্বর | বুধবার | ১০:০০–১:০০ | ইংরেজি\n৫ ডিসেম্বর | শুক্রবার | ১০:০০–১:০০ | গণিত\n৭ ডিসেম্বর | রবিবার | ১০:০০–১:০০ | বিজ্ঞান\n৯ ডিসেম্বর | মঙ্গলবার | ১০:০০–১:০০ | সমাজবিজ্ঞান',
      '1 दिसंबर | सोमवार | हिंदी',
      '1 Dec | Mon | 10:00–1:00 | Bangla\n3 Dec | Wed | 10:00–1:00 | English\n5 Dec | Fri | 10:00–1:00 | Mathematics\n7 Dec | Sun | 10:00–1:00 | Science\n9 Dec | Tue | 10:00–1:00 | Social Science',
    ),
    rules: L3('পরীক্ষা শুরুর ১৫ মিনিট পূর্বে হলে প্রবেশ করতে হবে।\nমোবাইল ফোন সম্পূর্ণ নিষিদ্ধ।\nঅ্যাডমিট কার্ড ছাড়া প্রবেশ নিষেধ।', 'नियम…', 'Enter the hall 15 minutes before the exam.\nMobile phones are strictly prohibited.\nNo entry without the admit card.'),
  },
  marksheet: {
    subjects: L3(
      'বাংলা | ১০০ | ৭৮ | A\nইংরেজি | ১০০ | ৭১ | A\nগণিত | ১০০ | ৮২ | A+\nবিজ্ঞান | ১০০ | ৭৪ | A\nবাংলাদেশ ও বিশ্বপরিচয় | ১০০ | ৮০ | A+\nধর্ম ও নৈতিক শিক্ষা | ১০০ | ৮৫ | A+',
      'हिंदी | 100 | 78 | A',
      'Bangla | 100 | 78 | A\nEnglish | 100 | 71 | A\nMathematics | 100 | 82 | A+\nScience | 100 | 74 | A\nSocial Studies | 100 | 80 | A+\nReligion & Ethics | 100 | 85 | A+',
    ),
    sign1Title: L3('শ্রেণি শিক্ষক', 'वर्ग शिक्षक', 'Class Teacher'),
    sign2Title: L3('প্রধান শিক্ষক', 'प्रधानाचार्य', 'Headmaster'),
  },
  'report-card': {
    subjects: L3(
      'বাংলা | ১০০ | ৮১ | A+\nইংরেজি | ১০০ | ৭৪ | A\nগণিত | ১০০ | ৬৯ | A-\nবিজ্ঞান | ১০০ | ৭৭ | A\nসমাজবিজ্ঞান | ১০০ | ৮৩ | A+',
      'हिंदी | 100 | 81 | A+',
      'Bangla | 100 | 81 | A+\nEnglish | 100 | 74 | A\nMathematics | 100 | 69 | A-\nScience | 100 | 77 | A\nSocial Science | 100 | 83 | A+',
    ),
    remarks: L3('এ বছর উল্লেখযোগ্য উন্নতি — নিয়মিত অনুশীলনে আরও ভালো ফল সম্ভব।', 'उन्नति हुई है।', 'Marked improvement this year — regular practice can lift results further.'),
    sign1Title: L3('শ্রেণি শিক্ষক', 'वर्ग शिक्षक', 'Class Teacher'),
    sign2Title: L3('প্রধান শিক্ষক', 'प्रधानाचार्य', 'Headmaster'),
  },
  admission: {
    photoLabel: L3('পাসপোর্ট সাইজ ছবি', 'पासपोर्ट फोटो', 'PP-size photo'),
    title: L3('ভর্তি ফরম — ২০২৬', 'प्रवेश फॉर्म — 2026', 'Admission Form — 2026'),
    fields: L3(
      'ছাত্র/ছাত্রীর নাম\nপিতার নাম\nমাতার নাম\nজন্মতারিখ\nএনআইডি/জন্মনিবন্ধন নং\nঠিকানা\nমোবাইল\nপূর্ববর্তী প্রতিষ্ঠান',
      'छात्र का नाम\nपिता का नाम\nमाता का नाम',
      'Student\u2019s name\nFather\u2019s name\nMother\u2019s name\nDate of birth\nNID/Birth registration no.\nAddress\nMobile\nPrevious institution',
    ),
    declare: L3('আমি ঘোষণা করছি যে উপরের সব তথ্য সঠিক — কোনো তথ্য মিথ্যা প্রমাণিত হইলে ভর্তি বাতিল হবে।', 'मैं घोषणा करता हूँ…', 'I declare the above information is true; false information voids admission.'),
    sign1Title: L3('অভিভাবক', 'अभिभावक', 'Guardian'),
    sign2Title: L3('প্রধান শিক্ষক', 'प्रधानाचार्य', 'Headmaster'),
  },
  'lesson-plan': {
    topic: L3('মাধ্যম: ছবি ও বর্ণনা — গল্প-সাজানো', 'पाठ…', 'Topic: storytelling with pictures'),
    outcomes: L3('শিক্ষার্থী গল্পের মূল-ভাব শনাক্ত করতে পারবে।\nনিজের ভাষায় ঘটনা-ক্রম বলতে পারবে।\nদলে সক্রিয়ভাবে অংশ নেবে।', 'लक्ष्य…', 'Students will identify the main idea.\nRetell the sequence in their own words.\nParticipate actively in groups.'),
    materials: L3('গল্পের ছবি-কার্ড\nচক/সাদা-বোর্ড\nছাত্র-নোটবই', 'सामग्री…', 'Picture story cards\nChalk/whiteboard\nStudent notebooks'),
    stages: L3(
      'সূচনা | পূর্ব-জ্ঞান যাচাই | ৫ মিনিট\nপ্রদর্শন | ছবি-দেখে মডেল বর্ণনা | ১০ মিনিট\nঅনুশীলন | দলীয় গল্প-সাজানো | ২০ মিনিট\nমূল্যায়ন | প্রশ্নোত্তর | ১০ মিনিট',
      'चरण…',
      'Warm-up | Activate prior knowledge | 5 min\nModel | Describe a picture together | 10 min\nPractice | Group story-building | 20 min\nAssess | Q&A | 10 min',
    ),
    assessment: L3('মুখস্থ প্রশ্নোত্তর ও নোটবই-নিরীক্ষা', 'मूल्यांकन…', 'Oral Q&A and notebook check'),
    homework: L3('পাঁচ বাক্যে নিজের গল্প লেখা', 'गृहकार्य…', 'Write your own story in five sentences'),
  },
  // ── অনুষ্ঠান ──
  invitation: {
    title: L3('বার্ষিক সাংস্কৃতিক অনুষ্ঠান ২০২৫', 'वार्षिक सांस्कृतिक उत्सव', 'Annual Cultural Festival 2025'),
    body: L3('প্রতিষ্ঠানের বার্ষিক সাংস্কৃতিক অনুষ্ঠানে আপনাকে স্বাগত জানাতে আমরা আনন্দিত — আপনার উপস্থিতিই আয়োজনের সার্থকতা।', 'आपका स्वागत है।', 'We are delighted to invite you to our annual cultural festival — your presence makes the event complete.'),
    note: L3('রঙে, ছন্দে, গল্পে — একদিনের উৎসব', 'रंग, ताल, कहानी', 'Colour, rhythm, stories — a one-day festival'),
  },
  'wedding-card': {
    note: L3('স্বপ্নের শুভ সংযোগে আপনাদের সাদরে আমন্ত্রণ', 'शुभ विवाह में आमंत्रण', 'With joy, we invite you to our wedding'),
  },
  program: {
    title: L3('অনুষ্ঠানের ধারাবাহিক সূচি', 'कार्यक्रम सूची', 'Programme Schedule'),
    rows: L3(
      '১০:০০ | স্বাগত ভাষণ\n১০:১৫ | মূল আলোচনা\n১১:০০ | সাংস্কৃতিক পরিবেশনা\n১২:৩০ | পুরস্কার বিতরণ\n১:০০ | শেষ-ভাষণ ও দোয়া',
      '10:00 | स्वागत',
      '10:00 | Welcome address\n10:15 | Keynote\n11:00 | Cultural performance\n12:30 | Prize giving\n1:00 | Closing remarks & prayer',
    ),
    note: L3('সবার সময়মতো উপস্থিতি প্রত্যাশিত।', 'समय पर आएँ।', 'All are requested to arrive on time.'),
  },
  // ── চিকিৎসা ──
  prescription: {
    diagnosis: L3('ভাইরাল জ্বর ও শ্বাসকষ্ট', 'वायरल बुखार', 'Viral fever with breathing discomfort'),
    meds: L3(
      'প্যারাসিটামল ৫০০ মি.গ্রা. | ১+০+১ | খাবারের পরে\nঅ্যান্টাসিড জেল | ১+১+১ | খাবারের আগে\nভিটামিন-সি | ০+০+১ | রাতে',
      'पैरासिटामोल | 1+0+1',
      'Paracetamol 500 mg | 1+0+1 | After meals\nAntacid gel | 1+1+1 | Before meals\nVitamin C | 0+0+1 | At night',
    ),
    advice: L3('প্রচুর পানি পান করুন\nবিশ্রামে থাকুন\nজ্বর ৩ দিনের বেশি থাকলে যোগাযোগ করুন', 'सलाह…', 'Drink plenty of fluids\nTake rest\nCall if fever persists beyond 3 days'),
  },
  'medical-certificate': {
    statement: L3('রোগীর শারীরিক পরীক্ষা ও উপসর্গের ভিত্তিতে উল্লিখিত সময়ে কর্ম/শ্রেণিতে উপস্থিত হওয়া তাঁর পক্ষে উপযুক্ত নয়।', 'रोगी अनुपस्थित रहेगा।', 'Based on examination and symptoms, attendance at work/school is not advisable during the stated period.'),
    unfitFrom: L3('২০ নভেম্বর ২০২৫', '20 नवंबर 2025', '20 November 2025'),
    unfitTo: L3('২৪ নভেম্বর ২০২৫', '24 नवंबर 2025', '24 November 2025'),
    diagnosis: L3('ভাইরাল ইনফেকশন (উর্ধ্ব-শ্বাসনালি)', 'वायरल संक्रमण', 'Viral upper-respiratory infection'),
  },
  // ── মার্কেটিং ──
  poster: {
    kicker: L3('আমন্ত্রণ', 'आमंत्रण', 'Invitation'),
    title: L3('বার্ষিক সাংস্কৃতিক অনুষ্ঠান ২০২৫', 'वार्षिक उत्सव 2025', 'Annual Cultural Festival 2025'),
    sub: L3('রঙে, ছন্দে, গল্পে — একদিনের উৎসব', 'रंग, ताल, कहानी', 'Colour, rhythm, stories — one day of celebration'),
    body: L3('সারা বছরের শ্রেষ্ঠ মুহূর্তগুলো এক মঞ্চে — সঙ্গীত, নৃত্য, নাটক ও পুরস্কার-বিতরণ।', 'कार्यक्रम…', 'The year\u2019s best moments on one stage — music, dance, drama and awards.'),
    points: L3('প্রবেশ: সবার জন্য উন্মুক্ত\nসন্ধ্যা ৬টায় মূল পরিবেশনা\nখাবারের স্টল থাকবে', 'प्रवेश…', 'Entry open to all\nMain show at 6 PM\nFood stalls on site'),
    contact: L3('+৮৮০ ১৭১২-৩৪৫৬৭৮ · hello@example.com', '+91 …', '+880 1712-345678 · hello@example.com'),
  },
  flyer: {
    title: L3('শীতকালীন বই-মেলা — বিশেষ ছাড়', 'शीतकालीन बुक मेला', 'Winter Book Fair — Special Offers'),
    sub: L3('প্রিয় বইগুলো এবার আপস-চাহিদা মূল্যে', 'छूट…', 'Favourite books at give-away prices'),
    col1: L3('নতুন প্রকাশে ৩০% পর্যন্ত ছাড়\nপুরনো সংগ্রহে ৫০% ছাড়\nপ্রতি ১০০০ টাকায় এক উপহার', 'छाड़…', 'Up to 30% off new titles\n50% off backlist\nA gift on every 1,000 taka'),
    col2: L3('স্বাক্ষর-অনুষ্ঠান: শুক্রবার বিকেল ৪টা\nলেখক-সংলাপ: শনিবার সন্ধ্যা ৬টা\nশিশুদের গল্প-সময়: প্রতিদিন সকাল ১১টা', 'कार्यक्रम…', 'Signing: Friday 4 PM\nAuthor talk: Saturday 6 PM\nKids\u2019 story time: daily 11 AM'),
    priceNote: L3('মেলা চলবে ১০–২০ ডিসেম্বর', '10–20 दिसंबर', 'Fair runs 10–20 December'),
    contact: L3('+৮৮০ ১৭১২-৩৪৫৬৭৮', 'फोन…', '+880 1712-345678'),
  },
  'brochure-trifold': {
    name: L3('টপবুক পাবলিকেশন্স', 'टॉपबुक', 'Topbook Publications'),
    tagline: L3('বইয়ের হাতে-কলমে প্রযুক্তি', 'पुस्तक प्रौद्योगिकी', 'Craft technology for books'),
    about: L3('গত ১০ বছরে ২০০+ শিরোনাম — পাঠ্যপুস্তক থেকে সাহিত্য, প্রতিটি পাঠক-দলের জন্য নির্ভরযোগ্য প্রকাশনা।', 'परिचय…', '10 years, 200+ titles — from textbooks to literature, dependable publishing for every reader.'),
    offerings: L3('পাঠ্যপুস্তক ও সাহায্য-সিরিজ\nশিশু-সাহিত্য\nসাধারণ জ্ঞান ও গল্প-সংকলন', 'सेवाएँ…', 'Textbooks & study series\nChildren\u2019s literature\nGeneral knowledge & story collections'),
    features: L3('নিজস্ব মান-নিয়ন্ত্রিত মুদ্রণ\nজাতীয় বিতরণ-নেটওয়ার্ক\nঅনলাইন অর্ডার-সহায়তা', 'विशेषताएँ…', 'In-house quality printing\nNationwide distribution\nOnline order support'),
    contactLines: L3('১২/এ, কলেজ রোড, মিরপুর, ঢাকা-১২০৭\n+৮৮০ ১৭১২-৩৪৫৬৭৮ · hello@example.com\nwww.topbook.example', 'संपर्क…', '12/A, College Road, Mirpur, Dhaka-1207\n+880 1712-345678 · hello@example.com\nwww.topbook.example'),
  },
  newsletter: {
    name: L3('পাঠক-চিঠি', 'पाठक-पत्र', 'Reader\u2019s Letter'),
    issue: L3('সংখ্যা ১২', 'अंक 12', 'Issue 12'),
    leadHeadline: L3('নতুন শিক্ষাবর্ষে ১২টি নতুন শিরোনাম', 'नया सत्र, नई किताबें', 'Twelve new titles for the new school year'),
    leadBody: L3('শিক্ষাবর্ষ শুরুর আগেই আমাদের সম্পাদনা-টিম শিক্ষকদের পরামর্শে ১২টি নতুন সহায়-পুস্তক প্রস্তুত করেছে — প্রতিটি শ্রেণির জন্য পরীক্ষিত অনুশীলন-কৌশল।', 'लेख…', 'Ahead of the new school year, our editorial team has prepared twelve new study guides with teachers — tested practice methods for every class.'),
    headline2: L3('গ্রন্থাগার-অংশীদারি কর্মসূচি', 'पुस्तकालय कार्यक्रम', 'Library partnership programme'),
    body2: L3('২০টি জেলা-গ্রন্থাগারের সাথে চুক্তি — প্রতি গ্রন্থাগারে ৫০ শিরোনামের নির্বাচিত সংগ্রহ।', 'समाचार…', 'Contracts with 20 district libraries — a curated 50-title collection each.'),
    headline3: L3('পাঠক-পোলের ফল', 'पाठक सर्वेक्षण', 'Reader poll results'),
    body3: L3('বছরের প্রিয় শিরোনাম নির্বাচনে ৪,২০০ জন পাঠক ভোট দিয়েছেন — ফলাফল পরের সংখ্যায়।', 'समाचार…', '4,200 readers voted for the title of the year — results in the next issue.'),
    highlights: L3('বই-মেলা: ১০–২০ ডিসেম্বর\nলেখক-সংলাপ: শনিবার সন্ধ্যা ৬টা\nনতুন সদস্যদের জন্য বিশেষ ছাড়', 'एक नज़र में…', 'Book fair: 10–20 December\nAuthor talk: Saturday 6 PM\nSpecial discount for new members'),
    contact: L3('সম্পাদক: নাসরিন আক্তার · newsletter@example.com', 'संपादक', 'Editor: Nasrin Akhter · newsletter@example.com'),
  },
  'press-release': {
    headline: L3('টপবুক পাবলিকেশন্স জাতীয় প্রকাশনা-পুরস্কারে ভূষিত', 'टॉपबुक पुरस्कृत', 'Topbook Publications wins national publishing award'),
    subhead: L3('শিশু-সাহিত্য-সিরিজ নির্বাচকমণ্ডলীর প্রশংসা অর্জন করেছে', 'शिशु-साहित्य श्रृंखला', 'Children\u2019s series earns jury acclaim'),
    body1: L3('ঢাকা, ২০ নভেম্বর ২০২৫ — টপবুক পাবলিকেশন্স এ বছরের জাতীয় প্রকাশনা-পুরস্কারের সেরা শিশু-সাহিত্য-প্রকাশক হিসাবে স্বীকৃতি পেয়েছে।', 'समाचार…', 'DHAKA, 20 November 2025 — Topbook Publications has been named the year\u2019s best children\u2019s publisher in the national publishing awards.'),
    body2: L3('নির্বাচকমণ্ডলী উল্লেখ করেছে — সিরিজের ভাষা-সরলতা, ছবি-নকশা ও শ্রেণিকক্ষে ব্যবহার-উপযোগিতা নির্ণায়ক ছিল।', 'विवरण…', 'The jury cited the series\u2019s language clarity, illustration design and classroom usability.'),
    about: L3('টপবুক পাবলিকেশন্স গত ১০ বছরে ২০০+ শিরোনাম প্রকাশ করেছে।', 'परिचय…', 'Topbook Publications has released 200+ titles over the past decade.'),
    contactLines: L3('প্রচার-দল: +৮৮০ ১৭১২-৩৪৫৬৭৮\npress@example.com', 'संपर्क…', 'Press desk: +880 1712-345678\npress@example.com'),
  },
  'resume-cover': {
    opening: L3(
      'ডাটাসফট লিমিটেডের ওয়েবসাইটে প্রকাশিত "সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার" পদের বিজ্ঞাপন দেখে আমি আবেদন করছি — এ পদ আমার অভিজ্ঞতার সাথে হুবহু মেলে।',
      'विज्ञापन देखकर आवेदन कर रहा हूँ।',
      'I am writing to apply for the Senior Software Engineer position posted on DataSoft\u2019s careers page — the role matches my experience exactly.',
    ),
    body: L3(
      'আট বছরের অভিজ্ঞতায় আমি ওয়েব-প্ল্যাটফর্ম ও পেমেন্ট-সিস্টেম নির্মাণ ও রক্ষণাবেক্ষণ করেছি; আপনার দলে এ অভিজ্ঞতা ও দল-নেতৃত্ব কাজে লাগবে বলে বিশ্বাস করি।',
      'अनुभव आपकी टीम के लिए उपयोगी होगा।',
      'Over eight years I have built and maintained web platforms and payment systems; I believe this experience and team leadership will serve your team well.',
    ),
    closing: L3(
      'আমার সম্পর্কে আরও জানতে চাইলে সাক্ষাৎকারের সুযোগ দিলে কৃতজ্ঞ থাকব।',
      'साक्षात्कार की कृपा करें।',
      'I would welcome the opportunity to interview and tell you more.',
    ),
  },
  // ── বৈশ্বিক সম্পূর্ণতা: প্রস্তাবনা/ক্যালেন্ডার ──
  'project-proposal': {
    projectTitle: L3('গ্রামীণ ডিজিটাল লাইব্রেরি প্রকল্প', 'ग्रामीण डिजिटल लाइब्रेरी परियोजना', 'Rural Digital Library Project'),
    client: L3('জেলা শিক্ষা অফিস', 'जिला शिक्षा कार्यालय', 'District Education Office'),
    preparedBy: L3('মোঃ রাকিব হাসান', 'राकिब हसन', 'Rakib Hasan'),
    duration: L3('৬ মাস', '6 महीने', '6 months'),
    budget: L3('৪,৫০,০০০ টাকা', '₹4,50,000', 'BDT 4,50,000'),
    objectives: L3('পাঁচটি গ্রামে ডিজিটাল পাঠ-কোণ স্থাপন।\n৩০০ জন শিক্ষার্থীর ব্যবহার-প্রশিক্ষণ।\nস্থানীয় শিক্ষকদের ফ্যাসিলিটেটর হিসাবে গড়ে তোলা।', 'उद्देश्य…', 'Set up digital reading corners in five villages.\nTrain 300 students to use them.\nGrow local teachers into facilitators.'),
    scope: L3('সরঞ্জাম-ক্রয়, প্রশিক্ষণ-মডিউল প্রস্তুত, তিন ধাপে স্থাপন ও ছয় মাসের পরিচর্যা — এ প্রকল্পের পুরো পরিসর এক চুক্তিতে।', 'कार्य का दायरा…', 'Equipment procurement, training-module preparation, three installation phases and six months of support — all in one contract.'),
    deliverables: L3('প্রশিক্ষণ-মডিউল ও গাইড (বাংলা)।\nপাঁচটি পাঠ-কোণের স্থাপন ও পরীক্ষা।\nপ্রতি মাসের অগ্রগতি-প্রতিবেদন।\nশেষ-পর্যায়ের মূল্যায়ন।', 'डिलिवरेबल…', 'Training module & guide (local language).\nFive reading corners installed & tested.\nMonthly progress reports.\nEnd-of-project evaluation.'),
    timeline: L3(
      'প্রস্তুতি | মাস ১ | সরঞ্জাম ও স্থান-নির্বাচন\nস্থাপন | মাস ২–৩ | পাঁচটি পাঠ-কোণ চালু\nপ্রশিক্ষণ | মাস ৩–৪ | ৩০০ শিক্ষার্থী\nপরিচর্যা | মাস ৪–৬ | মাসিক প্রতিবেদন\nমূল্যায়ন | মাস ৬ | চূড়ান্ত রিপোর্ট',
      'चरण…',
      'Preparation | Month 1 | Sites & equipment\nInstallation | Months 2–3 | Five corners live\nTraining | Months 3–4 | 300 students\nSupport | Months 4–6 | Monthly reports\nEvaluation | Month 6 | Final report',
    ),
    terms: L3('অগ্রিম ৪০% — বাকি ধাপ-ভিত্তিক।\nসরঞ্জামে এক বৎসরের ওয়ারেন্টি।\nপরিবহন প্রস্তাবকের দায়িত্ব।', 'शर्तें…', '40% advance — balance per phase.\nOne-year equipment warranty.\nLogistics handled by the submitter.'),
  },
  'calendar-month': {
    title: L3('কার্যক্রম ক্যালেন্ডার', 'कार्यक्रम कैलेंडर', 'Activity Calendar'),
    events: L3(
      '৫: সমন্বয় সভা\n১২: শিক্ষক-প্রশিক্ষণ\n২১: ফল-বিতরণ দিবস',
      '5: समन्वय बैठक\n12: प्रशिक्षण\n21: पुरस्कार दिवस',
      '5: Coordination meeting\n12: Teacher training\n21: Prize-giving day',
    ),
    note: L3('ছুটি ও পরিবর্তন প্রজ্ঞাপন অনুযায়ী হালনাগাদ হবে।', 'सूचना…', 'Holidays are updated per official notices.'),
  },
};

/** টেবিল/টেক্সটের সাঝা ফলব্যাক (পুলে না থাকলে) */
const DEMO_FALLBACK_PARA = L3(
  'এ অংশে নথির মূল বক্তব্য লিখুন — টেমপ্লেটের ধাঁচ অনুযায়ী প্যারা সাজানো থাকবে।',
  'यहाँ मुख्य विषय लिखें।',
  'Write the document\u2019s main content here — styled to the template\u2019s convention.',
);
const DEMO_FALLBACK_TEXT = L3('নমুনা', 'नमूना', 'Sample');

/**
 * টেমপ্লেট + ভাষা → বাস্তবধর্মী নমুনা-মান (গ্যালারি-থাম্বনেইল ও "নমুনা পূরণ")।
 * ক্যানভা/ওয়ার্ড-প্রথায় থাম্বনেইল যেন ভরা-দলিলের মতো দেখায়।
 */
export function dsDemoValues(tpl: DsTemplate, lang: Lang): DsValues {
  const out: DsValues = {};
  const special = DS_DEMO_SPECIAL[tpl.id] ?? {};
  for (const f of tpl.fields) {
    // ক্যালেন্ডারের মাস — বর্তমান মাসের নমুনা (ভাষা-ভেদে লেবেল)
    if (tpl.id === 'calendar-month' && f.id === 'month') { out[f.id] = demoMonthLabel(lang); continue; }
    // প্রকৃত ডেট-ফিল্ড আজকেরই — পুলের আগে (টেক্সট-ধর্মী 'date' ফিল্ড পুল থেকে নেবে)
    if (f.kind === 'date') { out[f.id] = dsToday(lang); continue; }
    const e = special[f.id] ?? DS_DEMO[f.id];
    if (e) { out[f.id] = tx(lang, e); continue; }
    if (f.kind === 'table') out[f.id] = (f.cols ?? []).map((c) => tx(lang, c)).join(' | ');
    else if (f.kind === 'textarea') out[f.id] = tx(lang, DEMO_FALLBACK_PARA);
    else out[f.id] = tx(lang, DEMO_FALLBACK_TEXT);
  }
  return out;
}

// ═════════════════════════ সাঝা ফিল্ড-সেট ═════════════════════════

function fOffice(): DsField[] {
  return [
    { id: 'office', kind: 'text', label: L3('অফিস/প্রতিষ্ঠানের নাম', 'कार्यालय/संस्था का नाम', 'Office/institution name') },
    { id: 'address', kind: 'text', label: L3('ঠিকানা (উপজেলা, জেলা)', 'पता (उपजेला, जिला)', 'Address (upazila, district)') },
  ];
}

function fRef(): DsField[] {
  return [
    { id: 'refNo', kind: 'text', label: L3('স্মারক/সনদ নং', 'स्मारक/प्रमाण सं.', 'Memo/certificate no.') },
    { id: 'date', kind: 'date', label: DSB.date },
  ];
}

function fSign2(t1: T3, t2: T3): DsField[] {
  return [
    { id: 'sign1Title', kind: 'text', label: t1 },
    { id: 'sign1Name', kind: 'text', label: L3('নাম (প্রথম স্বাক্ষরকারী)', 'नाम (प्रथम हस्ताक्षरकर्ता)', 'Name (first signatory)') },
    { id: 'sign2Title', kind: 'text', label: t2 },
    { id: 'sign2Name', kind: 'text', label: L3('নাম (দ্বিতীয় স্বাক্ষরকারী)', 'नाम (द्वितीय हस्ताक्षरकर्ता)', 'Name (second signatory)') },
  ];
}

const SIG_CHAIR = L3('পদবি (চেয়ারম্যান/অফিসার)', 'पद (अध्यक्ष/अधिकारी)', 'Title (Chairman/Officer)');
const SIG_SEC = L3('পদবি (সচিব/উপ-অফিসার)', 'पद (सचिव/उप-अधिकारी)', 'Title (Secretary/Officer)');

/** ফিল্ড-id → সনদ-বাক্যের লেবেল */
const FIELD_SENTENCE: Record<string, T3> = {
  father: L3('পিতা', 'पिता', 'Father'),
  mother: L3('মাতা', 'माता', 'Mother'),
  husband: L3('স্বামী/স্ত্রী', 'पति/पत्नी', 'Spouse'),
  age: L3('সাংগতিক বয়স', 'उम्र', 'age'),
  village: L3('গ্রাম/মহল্লা', 'ग्राम/महल्ला', 'Village/Ward'),
  post: L3('ডাকঘর', 'डाकघर', 'Post office'),
  upazila: L3('উপজেলা', 'उपजेला', 'Upazila'),
  district: L3('জেলা', 'जिला', 'District'),
};

/** প্রত্যয়ন-সনদের সাঝা কাঠামো — "প্রত্যয়িত করা হচ্ছে যে" ধাঁচ */
function attestationBody(v: Record<string, string>, lang: Lang, P: DsPalette, opts: {
  title: string;
  opener: string;
  /** মূল বাক্যের অংশ হিসেবে নাগরিক-তথ্য (ফিল্ড-id ক্রমে) */
  details: string[];
  closer: string;
  /** closer-পরবর্তী বাড়তি অনুচ্ছেদ (আয়-রাশি ইত্যাদি) */
  tailHtml?: string;
}): string {
  const office = V(v, 'office');
  const detailHtml = opts.details
    .filter((d) => V(v, d) && FIELD_SENTENCE[d])
    .map((d) => `, ${esc(tx(lang, FIELD_SENTENCE[d]))} — <strong>${esc(V(v, d))}</strong>`)
    .join('');
  return [
    pc(`<strong style="font-size:11pt; letter-spacing:0.4px">${tx(lang, DSB.govt)}</strong>`, `color:${P.head}`),
    pc(`<strong style="font-size:13pt">${esc(office)}</strong>`),
    V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
    row2(
      `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'refNo') ? `${tx(lang, DSB.refNo)}: ${V(v, 'refNo')}` : '')}</p>`,
      `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
    ),
    buildDividerHtml('double'),
    band(opts.title, P),
    `<p style="margin-top:0.9em; line-height:1.9; text-align:justify">${esc(opts.opener)} <strong>${esc(V(v, 'name'))}</strong>${detailHtml}${pick(lang, '।', '।', '. ')} ${esc(V(v, 'body'))}</p>`,
    opts.tailHtml ?? '',
    `<p style="margin-top:0.7em; line-height:1.9; text-align:justify">${esc(opts.closer)}</p>`,
    buildDividerHtml('single'),
    sig2(lang, P, { t: V(v, 'sign1Title'), n: V(v, 'sign1Name'), o: office }, { t: V(v, 'sign2Title'), n: V(v, 'sign2Name'), o: '' }),
  ].filter(Boolean).join('');
}

// ═════════════════════════ সনদপত্র (cert) ═════════════════════════

const CERT_FIELDS: DsField[] = [
  ...fOffice(),
  ...fRef(),
  { id: 'name', kind: 'text', label: L3('নাগরিকের নাম', 'नागरिक का नाम', 'Citizen\u2019s name') },
  { id: 'father', kind: 'text', label: L3('পিতা', 'पिता', 'Father') },
  { id: 'mother', kind: 'text', label: L3('মাতা', 'माता', 'Mother') },
  { id: 'husband', kind: 'text', label: L3('স্বামী/স্ত্রী (প্রযোজ্য হলে)', 'पति/पत्नी (हो तो)', 'Spouse (if applicable)') },
  { id: 'age', kind: 'text', label: L3('বয়স', 'उम्र', 'Age') },
  { id: 'village', kind: 'text', label: L3('গ্রাম/মহল্লা', 'ग्राम/महल्ला', 'Village/ward') },
  { id: 'post', kind: 'text', label: L3('ডাকঘর', 'डাকঘর', 'Post office') },
  { id: 'upazila', kind: 'text', label: L3('উপজেলা/থানা', 'उपजेला/थाना', 'Upazila/Thana') },
  { id: 'district', kind: 'text', label: L3('জেলা', 'जिला', 'District') },
  { id: 'body', kind: 'textarea', wide: true, rows: 4, label: L3('সনদের মূল বক্তব্য', 'प्रमाणपत्र का मुख्य कथन', 'Main attestation statement'), ph: L3('যেমন: তিনি দীর্ঘদিন যাবৎ এলাকার সুনামধন্য ব্যক্তি…', 'उदा.: वे बहु समय से क्षेत्र के प्रतिष्ठित व्यक्ति…', 'e.g. He/She is a long-standing respected resident…') },
  ...fSign2(SIG_CHAIR, SIG_SEC),
];

const RESIDENCE_TPL: DsTemplate = {
  id: 'residence',
  category: 'regional',
  name: L3('স্থায়ী নিবাসী সনদ', 'स्थायी निवास प्रमाणपत्र', 'Permanent Residence Certificate'),
  desc: L3('ইউনিয়ন/পৌরসভার স্থায়ী বাসিন্দা হওয়ার অফিসিয়াল সনদ — ভর্তি, নামজারি ও সরকারি কাজে লাগে।', 'स्थायी निवासी प्रमाणपत्र।', 'Official permanent-residence certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: CERT_FIELDS,
  build: (v, lang, P) =>
    attestationBody(v, lang, P, {
      title: pick(lang, 'স্থায়ী নিবাসী সনদ', 'स्थायी निवासी प्रमाणपत्र', 'PERMANENT RESIDENCE CERTIFICATE'),
      opener: pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে,', 'यह प्रमाणित किया जाता है कि,', 'This is to certify that,'),
      details: ['father', 'mother', 'husband', 'age', 'village', 'post', 'upazila', 'district'],
      closer: pick(
        lang,
        'এই মর্মে আবারও প্রত্যয়িত করা হচ্ছে যে, তিনি অত্র ইউনিয়ন/এলাকার স্থায়ী বাসিন্দা এবং সনদে উল্লিখিত তথ্য অত্র অফিসের নথি-নির্ভর সঠিক তথ্য।',
        'यह भी प्रमाणित किया जाता है कि वे इस क्षेत्र के स्थायी निवासी हैं और उपरोक्त सूचना अभिलेख के अनुसार सही है।',
        'It is further certified that the above information is correct as per office records.',
      ),
    }),
};

const CHARACTER_TPL: DsTemplate = {
  id: 'character',
  category: 'regional',
  name: L3('চারিত্রিক সনদ', 'चारित्रिक प्रमाणपत्र', 'Character Certificate'),
  desc: L3('নাগরিকের আচরণ-চরিত্র সম্পর্কে এলাকার কর্তৃপক্ষের প্রত্যয়ন — চাকরি ও ভর্তিতে ব্যবহৃত।', 'चारित्रिक प्रमाणपत्र।', 'Character attestation certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: CERT_FIELDS,
  build: (v, lang, P) =>
    attestationBody(v, lang, P, {
      title: pick(lang, 'চারিত্রিক সনদ', 'चारित्रिक प्रमाणपत्र', 'CHARACTER CERTIFICATE'),
      opener: pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে,', 'यह प्रमाणित किया जाता है कि,', 'This is to certify that,'),
      details: ['father', 'mother', 'age', 'village', 'post', 'upazila', 'district'],
      closer: pick(
        lang,
        'তাঁর আচরণ-চরিত্র সম্পর্কে অত্র অফিসের নিকট কোনো নিন্দাজনক তথ্য নেই। তিনি এলাকার শান্ত-শিষ্ট, স্বচ্ছচিত্ত ও সুনামধন্য ব্যক্তি।',
        'उनके चरित्र के बारे में इस कार्यालय में कोई प्रतिकूल सूचना नहीं है। वे क्षेत्र के शांत, शिष्ट व प्रतिष्ठित व्यक्ति हैं।',
        'Nothing adverse about his/her character is known to this office.',
      ),
    }),
};

const UNMARRIED_TPL: DsTemplate = {
  id: 'unmarried',
  category: 'regional',
  name: L3('অবিবাহিত সনদ', 'अविवाहित प्रमाणपत्र', 'Unmarried Certificate'),
  desc: L3('বিবাহ-বহির্ভূত অবস্থা প্রত্যয়ন — নিয়োগ, ভিসা ও প্রশাসনিক কাজে ব্যবহৃত।', 'अविवाहित प्रमाणपत्र।', 'Unmarried status certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: CERT_FIELDS,
  build: (v, lang, P) =>
    attestationBody(v, lang, P, {
      title: pick(lang, 'অবিবাহিত সনদ', 'अविवाहित प्रमाणपत्र', 'UNMARRIED CERTIFICATE'),
      opener: pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে,', 'यह प्रमाणित किया जाता है कि,', 'This is to certify that,'),
      details: ['father', 'mother', 'age', 'village', 'post', 'upazila', 'district'],
      closer: pick(
        lang,
        'অত্র অফিসের নথি ও এলাকার তথ্য অনুযায়ী জানা যায় যে, তিনি এখন পর্যন্ত অবিবাহিত।',
        'कार्यालयीन अभिलेख के अनुसार वे अब तक अविवाहित हैं।',
        'According to office records, he/she is unmarried as of this date.',
      ),
    }),
};

const INCOME_TPL: DsTemplate = {
  id: 'income',
  category: 'regional',
  name: L3('বার্ষিক আয় সনদ', 'वार्षिक आय प्रमाणपत्र', 'Annual Income Certificate'),
  desc: L3('পারিবারিক বার্ষিক আয়ের প্রত্যয়ন — বৃত্তি, ভর্তি-ছাড় ও আইনসহায়তায় লাগে।', 'वार्षिक आय प्रमाणपत्र।', 'Annual income certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'olive',
  fields: [
    ...CERT_FIELDS.slice(0, 10),
    { id: 'income', kind: 'text', label: L3('বার্ষিক আয় (টাকায়)', 'वार्षिक आय (रुपये)', 'Annual income (Tk.)') },
    ...CERT_FIELDS.slice(10),
  ],
  build: (v, lang, P) => {
    const amount = V(v, 'income');
    const tailHtml = amount
      ? `<p style="line-height:1.9; text-align:justify">${esc(pick(lang, 'তাঁর পারিবারিক বার্ষিক আয় প্রায়', 'उनकी पारिवारिक वार्षिक आय लगभग', 'His/her approximate family annual income is'))} <strong>${esc(amount)}</strong>${esc(pick(lang, ' টাকা। আয়ের এই হিসাব অত্র অফিসের নথি অনুযায়ী সঠিক।', ' रुपये। यह आय विवरण अभिलेख के अनुसार सही है।', ' Tk. This income statement is correct as per office records.'))}</p>`
      : '';
    return attestationBody(v, lang, P, {
      title: pick(lang, 'বার্ষিক আয় সনদ', 'वार्षिक आय प्रमाणपत्र', 'ANNUAL INCOME CERTIFICATE'),
      opener: pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে,', 'यह प्रमाणित किया जाता है कि,', 'This is to certify that,'),
      details: ['father', 'village', 'post', 'upazila', 'district'],
      closer: pick(
        lang,
        'এই আয়-সনদটি বৃত্তি/ভর্তি-ছাড় প্রাপ্তির উদ্দেশ্যে প্রদান করা হইল।',
        'यह आय-प्रमाणपत्र छात्रवृत्ति/छूट के उद्देश्य से दिया गया है।',
        'This income certificate is issued for scholarship/fee-waiver purposes.',
      ),
      tailHtml,
    });
  },
};

const HEIR_TPL: DsTemplate = {
  id: 'heir',
  category: 'regional',
  name: L3('ওয়ারিশ সনদ', 'वारिस प्रमाणपत्र', 'Heir / Inheritance Certificate'),
  desc: L3('মৃত ব্যক্তির স্বামী/স্ত্রী, ছেলে-মেয়ে ও ওয়ারিশগণের তালিকাসহ সনদ — নামজারি ও দলিলে প্রয়োজন।', 'वारिस प्रमाणपत्र।', 'Certificate listing legal heirs.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    ...fOffice(),
    ...fRef(),
    { id: 'name', kind: 'text', label: L3('মৃত ব্যক্তির নাম', 'मृतक का नाम', 'Deceased\u2019s name') },
    { id: 'father', kind: 'text', label: L3('মৃতের পিতা', 'मृतक के पिता', 'Deceased\u2019s father') },
    { id: 'mother', kind: 'text', label: L3('মৃতের মাতা', 'मृतक की माता', 'Deceased\u2019s mother') },
    { id: 'village', kind: 'text', label: L3('গ্রাম/মহল্লা', 'ग्राम/महल्ला', 'Village/ward') },
    { id: 'post', kind: 'text', label: L3('ডাকঘর', 'डाकघর', 'Post office') },
    { id: 'district', kind: 'text', label: L3('জেলা', 'जिला', 'District') },
    { id: 'deathDate', kind: 'text', label: L3('মৃত্যুতারিখ', 'मृत्यु तिथि', 'Date of death') },
    {
      id: 'heirs', kind: 'table', wide: true, rows: 5,
      label: L3('ওয়ারিশ-তালিকা (প্রতি সারি: নাম | সম্পর্ক | বয়স)', 'वारिस सूची (नाम | संबंध | उम्र)', 'Heirs (name | relation | age)'),
      ph: L3('অমুক | স্ত্রী | ৬০\nতমুক | ছেলে | ৩৫\nঅমুকা | মেয়ে | ২৮', 'अमुक | पत्नी | ६०', 'Abul | Wife | 60'),
      cols: [L3('নাম', 'नाम', 'Name'), L3('সম্পর্ক', 'संबंध', 'Relation'), L3('বয়স', 'उम्र', 'Age')],
    },
    ...fSign2(SIG_CHAIR, SIG_SEC),
  ],
  build: (v, lang, P) => {
    const office = V(v, 'office');
    const rows = lines(V(v, 'heirs')).map((l) => l.split('|').map((c) => c.trim()));
    const heirRows = rows
      .map((cells) => `<tr>${[0, 1, 2].map((i) => `<td>${esc(cells[i] ?? '')}</td>`).join('')}</tr>`)
      .join('');
    const heirTable = `<table><tr><th style="text-align:left">${esc(pick(lang, 'ওয়ারিশের নাম', 'वारिस का नाम', 'Heir\u2019s name'))}</th><th style="text-align:left">${esc(pick(lang, 'সম্পর্ক', 'संबंध', 'Relation'))}</th><th style="text-align:left">${esc(pick(lang, 'বয়স', 'उम्र', 'Age'))}</th></tr>${heirRows}</table>`;
    return [
      pc(`<strong style="font-size:11pt; letter-spacing:0.4px">${tx(lang, DSB.govt)}</strong>`, `color:${P.head}`),
      pc(`<strong style="font-size:13pt">${esc(office)}</strong>`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'refNo') ? `${tx(lang, DSB.refNo)}: ${V(v, 'refNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      buildDividerHtml('double'),
      band(pick(lang, 'ওয়ারিশ সনদ', 'वारिस प्रमाणपत्र', 'HEIR CERTIFICATE'), P),
      `<p style="margin-top:0.9em; line-height:1.9; text-align:justify">${esc(pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে,', 'यह प्रमाणित किया जाता है कि,', 'This is to certify that,'))} <strong>${esc(V(v, 'name'))}</strong>, ${esc(pick(lang, 'পিতা', 'पिता', 'father'))} — <strong>${esc(V(v, 'father'))}</strong>, ${esc(pick(lang, 'মাতা', 'माता', 'mother'))} — <strong>${esc(V(v, 'mother'))}</strong>${V(v, 'village') ? `, ${esc(pick(lang, 'গ্রাম/মহল্লা', 'ग्राम', 'village'))} — <strong>${esc(V(v, 'village'))}</strong>` : ''}${V(v, 'post') ? `, ${esc(pick(lang, 'ডাকঘর', 'डाकघर', 'post office'))} — <strong>${esc(V(v, 'post'))}</strong>` : ''}${V(v, 'district') ? `, ${esc(pick(lang, 'জেলা', 'जिला', 'district'))} — <strong>${esc(V(v, 'district'))}</strong>` : ''} ${esc(pick(lang, 'নামের ব্যক্তি', 'नाम के व्यक्ति', 'of the name stated above'))} <strong>${esc(V(v, 'deathDate'))}</strong>${esc(pick(lang, ' তারিখে মৃত্যুবরণ করেছেন। তাঁর বৈধ ওয়ারিশগণ নিম্নোক্ত:', ' को निधन हुआ। उनके वैध वारिस निम्नलिखित:', ' died on. The legal heirs are:'))}</p>`,
      heirTable,
      `<p style="line-height:1.85; text-align:justify">${esc(pick(lang, 'এই তালিকাটি অত্র অফিসের নথি ও এলাকার তথ্য-নির্ভর; কোনো ওয়ারিশ বাদ পড়লে অত্র অফিস দায়ী থাকবে না।', 'यह सूची कार्यालयीन अभिलेख पर आधारित है।', 'This list is based on office records; omission, if any, is not this office\u2019s responsibility.'))}</p>`,
      buildDividerHtml('single'),
      sig2(lang, P, { t: V(v, 'sign1Title'), n: V(v, 'sign1Name'), o: office }, { t: V(v, 'sign2Title'), n: V(v, 'sign2Name'), o: '' }),
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ হলফনামা ও দরখাস্ত (apply) ═════════════════════════

const AFFIDAVIT_TPL: DsTemplate = {
  id: 'affidavit',
  category: 'legal',
  name: L3('হলফনামা', 'शपथ पत्र', 'Affidavit'),
  desc: L3('নোটারি-পাবলিক প্রথায় স্বঘোষিত হলফনামা — সাধারণ ঘোষণা, তথ্য-নিশ্চিতকরণ ও প্রতিশ্রুতি।', 'शपथ पत्र।', 'Self-declared affidavit.'),
  styles: ALL_STYLES,
  defaultStyle: 'sepia',
  fields: [
    { id: 'court', kind: 'text', label: L3('আদালত/প্রথা-শিরোনাম', 'अदालत/शीर्षक', 'Court/heading'), wide: true },
    { id: 'name', kind: 'text', label: L3('হলফকারীর নাম', 'शपथकर्ता का नाम', 'Deponent\u2019s name') },
    { id: 'father', kind: 'text', label: L3('পিতা/স্বামী', 'पिता/पति', 'Father/Husband') },
    { id: 'address', kind: 'text', label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'body', kind: 'textarea', wide: true, rows: 6, label: L3('হলফনামার ঘোষণাসমূহ (প্রতি লাইনে একটি)', 'घोषणाएँ (प्रति पंक्ति एक)', 'Declarations (one per line)'), ph: L3('আমি ঘোষণা করছি যে আমার সঠিক নাম …\nআমি আরও ঘোষণা করছি যে …', 'मैं घोषणा करता हूँ…', 'I declare that…') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'sign1Name', kind: 'text', label: L3('হলফকারীর নাম (স্বাক্ষরে)', 'शपथकर्ता (हस्ताक्षर)', 'Deponent (signature)') },
  ],
  build: (v, lang, P) => {
    const decls = lines(V(v, 'body'));
    return [
      pc(`<strong style="font-size:11pt; letter-spacing:0.4px">${esc(V(v, 'court') || pick(lang, 'নোটারি পাবলিকের সম্মুখে হলফপূর্বক প্রদত্ত ঘোষণা', 'नोटरी के समक्ष शपथ', 'Declared before the Notary Public'))}</strong>`, `color:${P.head}`),
      band(pick(lang, 'হলফনামা', 'शपथ पत्र', 'AFFIDAVIT'), P),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(pick(lang, 'আমি', 'मैं,', 'I,'))} <strong>${esc(V(v, 'name'))}</strong>, ${esc(pick(lang, 'পিতা/স্বামী', 'पिता/पति', 'father/husband'))} — <strong>${esc(V(v, 'father'))}</strong>${V(v, 'address') ? `, ${esc(pick(lang, 'ঠিকানা', 'पता', 'address'))} — <strong>${esc(V(v, 'address'))}</strong>` : ''}, ${esc(pick(lang, 'স্বেচ্ছায়, সুস্থ-স্বাভাবিক মস্তিষ্কে ও কারো দম্ভ/প্ররোচনা ছাড়া নিম্নোক্ত বিষয়ে হলফপূর্বক ঘোষণা করছি:', 'स्वेच्छा से, स्वस्थ मस्तिष्क से, बिना किसी प्रेरणा के, निम्नलिखित का शपथपूर्वक घोषणा करता/करती हूँ:', 'do hereby solemnly declare as follows:'))}</p>`,
      decls.length
        ? `<ol>${decls.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>`
        : `<ol><li>${dots(60, P)}</li></ol>`,
      `<p style="line-height:1.9; text-align:justify">${esc(pick(lang, 'উপরোক্ত ঘোষণাসমূহ সত্য; কোনো অসত্য ধরা পড়লে আমি প্রচলিত আইনানুগ দায়ভার নিতে রাজি। তদুপরি হলফপূর্বক ঘোষণা করছি।', 'उपरोक्त घोषणाएँ सत्य हैं; असत्य पाए जाने पर विधि के अधीन दायित्व ग्रहण करता हूँ।', 'The above declarations are true; I accept legal liability if found false.'))}</p>`,
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt">${esc(pick(lang, 'হলফকারীর স্বাক্ষর', 'शपथकर्ता के हस्ताक्षर', 'Signature of deponent'))}</p>`,
      ),
      pc(`<strong style="font-size:10.5pt">${esc(V(v, 'sign1Name'))}</strong>`),
      buildDividerHtml('single'),
    ].filter(Boolean).join('');
  },
};

const GENERAL_APP_TPL: DsTemplate = {
  id: 'general-app',
  category: 'regional',
  name: L3('সাধারণ দরখাস্ত', 'सामान्य आवेदन/दरखास्त', 'General Application'),
  desc: L3('কর্তৃপক্ষ বরাবর বিনীত দরখাস্ত — ভর্তি, চাকরি, অনুমতি, সাহায্য — যেকোনো বিষয়ে।', 'सामान्य आवेदन।', 'General petition/application.'),
  styles: ALL_STYLES,
  defaultStyle: 'classic',
  fields: [
    { id: 'toWho', kind: 'text', label: L3('বরাবর (পদবি)', 'सेवा में (पद)', 'To (designation)'), wide: true },
    { id: 'office', kind: 'text', label: L3('অফিস/প্রতিষ্ঠান', 'कार्यालय/संस्था', 'Office/institution') },
    { id: 'address', kind: 'text', label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'subject', kind: 'text', wide: true, label: DSB.subject },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'body', kind: 'textarea', wide: true, rows: 6, label: L3('মূল আবেদন', 'मुख्य आवेदन', 'Main petition'), ph: L3('বিনীত নিবেদন এই যে, আমি দীর্ঘদিন যাবৎ আপনার প্রতিষ্ঠানের ছাত্র/গ্রাহক…', 'विनम्र निवेदन है कि…', 'I humbly state that…') },
    { id: 'ask', kind: 'textarea', wide: true, rows: 2, label: L3('আবেদন-মর্ম', 'अनुरोध', 'Request line'), ph: L3('অতএব, মহোদয়ের নিকট বিনীত আবেদন, …', 'अतः महोदय से विनम्र अनुरोध है…', 'I therefore request…') },
    { id: 'sign1Name', kind: 'text', label: L3('নিবেদকের নাম', 'निवेदक का नाम', 'Applicant\u2019s name') },
    { id: 'signMeta', kind: 'textarea', rows: 2, label: L3('পরিচয় (পিতা/ঠিকানা/মোবাইল — প্রতি লাইনে একটি)', 'परिचय (प्रति पंक्ति एक)', 'Identity (one per line)'), ph: L3('পিতা: অমুক\nগ্রাম: তমুক\nমোবাইল: ০১…', 'पिता:…', 'Father: …') },
  ],
  build: (v, lang, P) => [
    `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
    `<p style="margin-top:0.6em; font-size:11.5pt"><strong>${esc(pick(lang, 'বরাবর', 'सेवा में,', 'To,'))}</strong></p>`,
    `<p style="margin:0.1em 0; font-size:11pt">${esc(V(v, 'toWho'))}</p>`,
    V(v, 'office') ? `<p style="margin:0.1em 0; font-size:11pt">${esc(V(v, 'office'))}</p>` : '',
    V(v, 'address') ? `<p style="margin:0.1em 0; font-size:11pt">${esc(V(v, 'address'))}</p>` : '',
    V(v, 'subject')
      ? `<p style="margin-top:1em"><strong>${esc(tx(lang, DSB.subject))}:</strong> <span style="text-decoration:underline; font-weight:600">${esc(V(v, 'subject'))}</span></p>`
      : '',
    `<p style="margin-top:1em"><strong>${tx(lang, DSB.sir)}</strong></p>`,
    `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'body'))}</p>`,
    `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'ask'))}</p>`,
    sigOne(lang, P, '', V(v, 'sign1Name'), V(v, 'signMeta')),
  ].filter(Boolean).join(''),
};

const MUTATION_TPL: DsTemplate = {
  id: 'mutation',
  category: 'regional',
  name: L3('নামজারির দরখাস্ত', 'नामजारी आवेदन', 'Land Mutation Application'),
  desc: L3('উপজেলা নির্বাহী অফিসার/সার্কেল অফিস বরাবর ভূমি-নামজারির প্রথাসিদ্ধ দরখাস্ত।', 'नामजारी आवेदन।', 'Mutation petition to land office.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'toWho', kind: 'text', label: L3('বরাবর (পদবি)', 'सेवा में (पद)', 'To (designation)'), wide: true },
    { id: 'subject', kind: 'text', wide: true, label: DSB.subject },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'name', kind: 'text', label: L3('আবেদনকারীর নাম', 'आवेदक का नाम', 'Applicant\u2019s name') },
    { id: 'father', kind: 'text', label: L3('পিতা/স্বামী', 'पिता/पति', 'Father/Husband') },
    { id: 'village', kind: 'text', label: L3('গ্রাম/মৌজা', 'ग्राम/मौजा', 'Village/Mouza') },
    { id: 'post', kind: 'text', label: L3('ডাকঘর', 'डाकघর', 'Post office') },
    { id: 'district', kind: 'text', label: L3('জেলা', 'जिला', 'District') },
    { id: 'body', kind: 'textarea', wide: true, rows: 5, label: L3('জমির বিবরণ (দাগ নং, খতিয়ান, এলাকা, কারণ)', 'भूमि विवरण (दाग, खतियान, रकबा, कारण)', 'Land details (dag, khatian, area, reason)'), ph: L3('বিনীত নিবেদন এই যে, অমুক মৌজার দাগ নং … খতিয়ান নং …-এ জমি … শতাংশ; কারণ: ক্রয়/ওয়ারিশ…', 'दाग सं. …, खतियान …', 'Dag no. …, khatian …') },
    { id: 'ask', kind: 'textarea', wide: true, rows: 2, label: L3('আবেদন-মর্ম', 'अनुरोध', 'Request line') },
    { id: 'sign1Name', kind: 'text', label: L3('নিবেদকের নাম', 'निवेदक का नाम', 'Applicant\u2019s name') },
  ],
  build: (v, lang, P) => {
    const meta = ['father', 'village', 'post']
      .map((id) => (V(v, id) ? `${tx(lang, FIELD_SENTENCE[id])}: ${V(v, id)}` : ''))
      .filter(Boolean)
      .join('\n');
    return [
      `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      `<p style="margin-top:0.6em; font-size:11.5pt"><strong>${esc(pick(lang, 'বরাবর', 'सेवा में,', 'To,'))}</strong></p>`,
      `<p style="margin:0.1em 0; font-size:11pt">${esc(V(v, 'toWho'))}</p>`,
      V(v, 'subject') ? `<p style="margin-top:1em"><strong>${esc(tx(lang, DSB.subject))}:</strong> <span style="text-decoration:underline; font-weight:600">${esc(V(v, 'subject'))}</span></p>` : '',
      `<p style="margin-top:1em"><strong>${tx(lang, DSB.sir)}</strong></p>`,
      `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'body'))}</p>`,
      `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'ask'))}</p>`,
      sigOne(lang, P, '', V(v, 'sign1Name'), meta),
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ জমি-দলিল (land) ═════════════════════════

const DEED_FIELDS: DsField[] = [
  { id: 'deedDate', kind: 'text', label: L3('দলিল রচনার তারিখ', 'दस्तावेज़ तिथि', 'Deed date') },
  { id: 'donor', kind: 'text', label: L3('দাতা/বিক্রেতা/পক্ষক (নাম, পিতা, ঠিকানা)', 'दाता/विक्रेता', 'Donor/seller details'), wide: true },
  { id: 'donee', kind: 'text', label: L3('গ্রহীতা/ক্রেতা/পক্ষখ (নাম, পিতা, ঠিকানা)', 'ग्रहीता/क्रेता', 'Recipient/buyer details'), wide: true },
  { id: 'landDesc', kind: 'textarea', wide: true, rows: 4, label: L3('জমির বিবরণ (মৌজা, দাগ, খতিয়ান, এলাকা)', 'भूमि विवरण', 'Land description (mouza, dag, khatian, area)'), ph: L3('জেলা …, উপজেলা …, মৌজা …, দাগ নং …, খতিয়ান …, এলাকা … শতাংশ', 'मौजा…, दाग…, खतियान…', 'District …, mouza …, dag …') },
  { id: 'consideration', kind: 'textarea', wide: true, rows: 2, label: L3('শর্ত/প্রতিদান (ভায়া হলে দাম, হেবা হলে শর্ত)', 'शर्त/प्रतिदान', 'Terms / consideration') },
  { id: 'witness1', kind: 'text', label: L3('সাক্ষী ১ (নাম, পিতা, ঠিকানা)', 'साक्षी १', 'Witness 1') },
  { id: 'witness2', kind: 'text', label: L3('সাক্ষী ২ (নাম, পিতা, ঠিকানা)', 'साक्षी २', 'Witness 2') },
  { id: 'draftsman', kind: 'text', label: L3('দস্তুরি লেপক (ঐচ্ছিক)', 'दस्तूरी लेखक (वैकल्पिक)', 'Draftsman (optional)') },
];

function deedShell(v: Record<string, string>, lang: Lang, P: DsPalette, title: string, opening: string, termsHtml: string, closing: string): string {
  const c = esc(pick(lang, 'ক', 'क', 'A'));
  const k = esc(pick(lang, 'খ', 'ख', 'B'));
  return [
    band(title, P),
    `<p style="margin-top:0.8em; line-height:1.95; text-align:justify">${esc(pick(lang, 'এই দলিল লেখা হইয়া গেল', 'यह दस्तावेज़ लिखा गया', 'This deed is executed on'))} <strong>${esc(V(v, 'deedDate'))}</strong>${esc(pick(lang, ' তারিখে, পক্ষক', ' को, पक्षक', ' by party A'))} <strong>${c}</strong> ${esc(V(v, 'donor'))} ${esc(pick(lang, 'এক পক্ষে এবং পক্ষখ', 'एक पक्ष में और पक्षख', 'and party B'))} <strong>${k}</strong> ${esc(V(v, 'donee'))} ${esc(pick(lang, 'অপর পক্ষে।', 'दूसरे पक्ष में।', 'as the other party.'))}</p>`,
    `<p style="line-height:1.95; text-align:justify">${opening}</p>`,
    `<p style="line-height:1.95; text-align:justify"><strong>${esc(pick(lang, 'জমির বিবরণ:', 'भूमि का विवरण:', 'Description of the land:'))}</strong> ${esc(V(v, 'landDesc'))}</p>`,
    termsHtml,
    `<p style="line-height:1.95; text-align:justify">${closing}</p>`,
    `<p style="margin-top:1.1em"><strong>${esc(pick(lang, 'সাক্ষীগণ:', 'साक्षीगण:', 'Witnesses:'))}</strong></p>`,
    `<ol><li>${esc(V(v, 'witness1'))}</li><li>${esc(V(v, 'witness2'))}</li></ol>`,
    `<p style="line-height:1.9; text-align:justify">${esc(pick(lang, 'আমি দস্তুরি লেপক এই দলিল পক্ষদ্বয়ের নির্দেশমতো হুবহু পাঠ করিয়া শুনাইলাম; পক্ষদ্বয় অর্থ বুঝিয়া স্বাক্ষর করিলেন।', 'मैं दस्तूरी लेखक ने यह दस्तावेज़ पक्षकारों को पढ़कर सुनाया; उन्होंने अर्थ समझकर हस्ताक्षर किए।', 'I, the draftsman, read over and explained this deed; both parties signed after understanding.'))}</p>`,
    V(v, 'draftsman')
      ? `<p style="text-align:right; margin:0; font-size:10pt"><strong>${esc(V(v, 'draftsman'))}</strong><br /><span style="font-size:9.5pt; color:${P.soft}">${esc(pick(lang, 'দস্তুরি লেপক', 'दस्तूरी लेखक', 'Draftsman'))}</span></p>`
      : '',
  ].filter(Boolean).join('');
}

const GIFT_TPL: DsTemplate = {
  id: 'gift-deed',
  category: 'regional',
  name: L3('হেবানামা (দানপত্র)', 'हेबा-नामा (दानपत्र)', 'Gift Deed (Heba)'),
  desc: L3('পিতা-মাতা → ছেলে-মেয়ে বা আত্মীয়কে বিনা-প্রতিদানে জমি দানের আইনি হেবানামা।', 'हेबा-नामा।', 'Gift deed without consideration.'),
  styles: ALL_STYLES,
  defaultStyle: 'sepia',
  fields: DEED_FIELDS,
  build: (v, lang, P) =>
    deedShell(
      v,
      lang,
      P,
      pick(lang, 'হেবানামা', 'हेबा-नामा', 'DEED OF GIFT (HEBA)'),
      esc(pick(
        lang,
        'এই মর্মে ঘোষণা করছি যে, আমি দাতা আপন সন্তান/আত্মীয়কে স্নেহ ও ভালোবাসার প্রেক্ষিতে বিনা-প্রতিদানে নিম্নোক্ত জমি হেবা করলাম; গ্রহীতা দান কবুল করলেন এবং দখল লইলেন।',
        'मैं दाता अपने संतान/रिश्तेदार को स्नेह के कारण बिना प्रतिदान निम्न भूमि हेबा (दान) कर रहा/रही हूँ; ग्रहीता ने दान स्वीकार किया।',
        'I, the donor, out of love and affection, give without consideration the land described below to the donee, who accepts and takes possession.',
      )),
      V(v, 'consideration')
        ? `<p style="line-height:1.95; text-align:justify"><strong>${esc(pick(lang, 'শর্তাবলি:', 'शर्तें:', 'Conditions:'))}</strong> ${esc(V(v, 'consideration'))}</p>`
        : '',
      esc(pick(lang, 'আজ হইতে গ্রহীতা উক্ত জমির স্বত্বাধিকারী ও দখলদার; ভবিষ্যতে দাতা বা তার স্থলাভিষিক্ত কেহ কোনো দাবি করিতে পারিবেন না।', 'आज से ग्रहीता इस भूमि का स्वामी है; भविष्य में कोई दावा नहीं कर सकेगा।', 'From today the donee is the absolute owner; no future claim shall arise.')),
    ),
};

const PARTITION_TPL: DsTemplate = {
  id: 'partition',
  category: 'regional',
  name: L3('বন্টননামা', 'बंटननामा', 'Deed of Partition'),
  desc: L3('ওয়ারিশদের মধ্যে ঐত্যভাগ জমি সমান-শর্তে বণ্টনের আইনি দলিল।', 'बंटननामा।', 'Partition deed among heirs.'),
  styles: ALL_STYLES,
  defaultStyle: 'sepia',
  fields: DEED_FIELDS,
  build: (v, lang, P) =>
    deedShell(
      v,
      lang,
      P,
      pick(lang, 'বন্টননামা', 'बंटननामा', 'DEED OF PARTITION'),
      esc(pick(
        lang,
        'পক্ষক ও পক্ষখ উভয়েই উক্ত জমির ঐত্যভাগ-স্বত্বাধিকারী; মতবিরোধ এড়াইতে সকলের সম্মতিক্রমে জমি নিম্নবিধিতে বণ্টন করা হইল।',
        'पक्षक और पक्षख दोनों संयुक्त स्वामी हैं; मतभेद से बचने के लिए सहमति से भूमि बाँटी गई।',
        'Parties A and B are co-sharers; by mutual consent the land is partitioned as below.',
      )),
      V(v, 'consideration')
        ? `<p style="line-height:1.95; text-align:justify"><strong>${esc(pick(lang, 'বণ্টন-শর্ত:', 'बंटन-शर्तें:', 'Partition terms:'))}</strong> ${esc(V(v, 'consideration'))}</p>`
        : '',
      esc(pick(lang, 'প্রত্যেক পক্ষ নিজ নিজ অংশে স্বত্বাধিকারী ও দখলদার হইয়া গেল; কেহ অপরের অংশে কোনো দাবি করিতে পারিবেন না।', 'प्रत्येक पक्ष अपने-अपने भाग का स्वामी हुआ; कोई दूसरे के भाग पर दावा नहीं करेगा।', 'Each party holds own share absolutely; no claim on others\u2019 share.')),
    ),
};

const SALE_TPL: DsTemplate = {
  id: 'sale-deed',
  category: 'regional',
  name: L3('ভায়া দলিল (সাফ কবলা)', 'भाया दस्तावेज़ (सफ कबला)', 'Sale Deed (Vhaya)'),
  desc: L3('নগদ প্রতিদানে জমি ক্রয়-বিক্রয়ের ভায়া দলিল — পাটোয়ারি প্রথা অনুযায়ী।', 'भाया दस्तावेज़।', 'Sale deed for consideration.'),
  styles: ALL_STYLES,
  defaultStyle: 'sepia',
  fields: DEED_FIELDS,
  build: (v, lang, P) =>
    deedShell(
      v,
      lang,
      P,
      pick(lang, 'ভায়া দলিল', 'भाया दस्तावेज़', 'DEED OF SALE'),
      esc(pick(
        lang,
        'এই মর্মে ঘোষণা করছি যে, আমি বিক্রেতা পক্ষক সাফ-কবলা-স্বত্বে অধিকারী নিম্নোক্ত জমি আপন সম্মতিক্রমে নগদ টাকায় পক্ষখকে বায়না-ভায়া করিলাম; ক্রেতা দাম পরিশোধ করিয়া দখল লইলেন।',
        'मैं विक्रेता सफ-कबला अधिकारी निम्न भूमि नकद में पक्षख को बिक्री कर रहा/रही हूँ; क्रेता ने मूल्य चुकाकर दखल लिया।',
        'I, the seller, sell the land described below for cash; the buyer has paid and taken possession.',
      )),
      V(v, 'consideration')
        ? `<p style="line-height:1.95; text-align:justify"><strong>${esc(pick(lang, 'প্রতিদান-শর্ত:', 'प्रतिदान-शर्तें:', 'Consideration terms:'))}</strong> ${esc(V(v, 'consideration'))}</p>`
        : '',
      esc(pick(lang, 'আজ হইতে ক্রেতা সম্পূর্ণ স্বত্বাধিকারী; ভবিষ্যতে বিক্রেতা বা তার স্থলাভিষিক্ত কেহ কোনো দাবি করিতে পারিবেন না।', 'आज से क्रेता पूर्ण स्वामी है; भविष्य में कोई दावा नहीं होगा।', 'From today the buyer is the absolute owner; no future claim shall arise.')),
    ),
};

// ═════════════════════════ অফিস-প্রশাসন (office) ═════════════════════════

const NOTICE_TPL: DsTemplate = {
  id: 'notice',
  category: 'office',
  name: L3('নোটিশ/সার্কুলার', 'नोटिस/सर्कुलर', 'Notice / Circular'),
  desc: L3('প্রতিষ্ঠান-বহির্মুখী ঘোষণা — সভা, ভর্তি, নিয়োগ, শর্তাবলি ও তারিখসহ।', 'नोटिस।', 'Public notice with points.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    ...fOffice(),
    ...fRef(),
    { id: 'title', kind: 'text', wide: true, label: L3('নোটিশের শিরোনাম', 'नोटिस शीर्षक', 'Notice title'), ph: L3('ভর্তি বিজ্ঞপ্তি / জরুরি নোটিশ', 'प्रवेश सूचना', 'Admission notice') },
    { id: 'body', kind: 'textarea', wide: true, rows: 3, label: L3('ভূমিকা (সবাইকে জানানো হচ্ছে…)', 'परिचय', 'Opening line') },
    { id: 'points', kind: 'textarea', wide: true, rows: 5, label: L3('নোটিশ-পয়েন্ট (প্রতি লাইনে একটি)', 'बिंदु (प्रति पंक्ति एक)', 'Points (one per line)'), ph: L3('আবেদন ফরম বিতরণ: ১ জানুয়ারি হইতে\nশেষ তারিখ: ২০ জানুয়ারি\nঅফিস সময়: সকাল ১০টা–বিকেল ৪টা', 'बिंदु…', 'Forms available from…') },
    { id: 'sign1Name', kind: 'text', label: L3('স্বাক্ষরকারী (নাম ও পদবি)', 'हस्ताक्षरकर्ता', 'Signatory') },
  ],
  build: (v, lang, P) => {
    const pts = lines(V(v, 'points'));
    return [
      pc(`<strong style="font-size:12pt; letter-spacing:0.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('double'),
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'refNo') ? `${tx(lang, DSB.refNo)}: ${V(v, 'refNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      band(V(v, 'title') || pick(lang, 'নোটিশ', 'नोटिस', 'NOTICE'), P),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(V(v, 'body') || pick(lang, 'সংশ্লিষ্ট সকলের অবগতি ও প্রয়োজনীয় পদক্ষেপের জন্য নিম্নোক্ত বিষয়গুলো জানানো হইতেছে:', 'संबंधित सभी को सूचित किया जाता है:', 'All concerned are informed of the following:'))}</p>`,
      pts.length ? `<ol>${pts.map((pt) => `<li>${esc(pt)}</li>`).join('')}</ol>` : '',
      `<p style="margin-top:1em; line-height:1.9; text-align:justify">${esc(pick(lang, 'এতদসংক্রান্ত কোনো জিজ্ঞাসা অত্র অফিসের নিকট করা যাইতে পারে।', 'कोई जानकारी चाहिए तो कार्यालय में संपर्क करें।', 'For any query contact this office.'))}</p>`,
      `<p style="text-align:right; margin-top:1.2em; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'আদেশক্রমে', 'आदेशानुसार', 'By order of'))}</p>`,
      `<p style="text-align:right; margin:0.3em 0 0; font-size:10.5pt"><strong>${esc(V(v, 'sign1Name'))}</strong></p>`,
    ].filter(Boolean).join('');
  },
};

const OFFICE_ORDER_TPL: DsTemplate = {
  id: 'office-order',
  category: 'office',
  name: L3('অফিস আদেশ', 'कार्यालय आदेश', 'Office Order'),
  desc: L3('স্মারক-নম্বরসহ আনুষ্ঠানিক আদেশ — নিয়োগ, বদলি, ছুটি ও নির্দেশনা।', 'कार्यालय आदेश।', 'Formal office order.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    ...fOffice(),
    ...fRef(),
    { id: 'title', kind: 'text', wide: true, label: L3('আদেশের শিরোনাম', 'आदेश शीर्षक', 'Order title'), ph: L3('নিয়োগক্রমে বদলি আদেশ', 'नियुक्ति/बदली आदेश', 'Transfer order') },
    { id: 'body', kind: 'textarea', wide: true, rows: 3, label: L3('ভূমিকা', 'परिचय', 'Opening line') },
    { id: 'orders', kind: 'textarea', wide: true, rows: 5, label: L3('আদেশসমূহ (প্রতি লাইনে একটি)', 'आदेश (प्रति पंक्ति एक)', 'Orders (one per line)'), ph: L3('অমুককে তমুক শাখায় ইনচার্জ হিসাবে বদলি করা হইল।\nএই আদেশ কার্যকর হইবে ১ জানুয়ারি হইতে।', 'आदेश…', 'Order text…') },
    ...fSign2(L3('পদবি (অনুমোদনকারী)', 'पद (अनुमोदक)', 'Title (approving)'), L3('পদবি (প্রেরণকারী)', 'पद (प्रेषक)', 'Title (issuing)')),
  ],
  build: (v, lang, P) => {
    const ords = lines(V(v, 'orders'));
    return [
      pc(`<strong style="font-size:12pt; letter-spacing:0.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('double'),
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'refNo') ? `${tx(lang, DSB.refNo)}: ${V(v, 'refNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      band(V(v, 'title') || pick(lang, 'অফিস আদেশ', 'कार्यालय आदेश', 'OFFICE ORDER'), P),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(V(v, 'body'))}</p>`,
      ords.length ? `<ol>${ords.map((o) => `<li>${esc(o)}</li>`).join('')}</ol>` : '',
      `<p style="margin-top:1em; line-height:1.9; text-align:justify">${esc(pick(lang, 'সংশ্লিষ্ট সকলে এই আদেশ কার্যকরভাবে পালনের নির্দেশ প্রাপ্ত হইলেন।', 'सभी संबंधित इस आदेश का पालन करें।', 'All concerned shall comply with this order.'))}</p>`,
      sig2(lang, P, { t: V(v, 'sign1Title'), n: V(v, 'sign1Name'), o: V(v, 'office') }, { t: V(v, 'sign2Title'), n: V(v, 'sign2Name'), o: '' }),
    ].filter(Boolean).join('');
  },
};

const OFFICIAL_LETTER_TPL: DsTemplate = {
  id: 'official-letter',
  category: 'office',
  name: L3('অফিসিয়াল চিঠি', 'आधिकारिक पत्र', 'Official Letter'),
  desc: L3('চিঠির শিরোনাম, স্মারক-নং, সূত্র ও প্রাপক-ব্লকসহ সরকারি ধাঁচের পত্র।', 'आधिकारिक पत्र।', 'Letter with memo header.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    ...fOffice(),
    ...fRef(),
    { id: 'tagline', kind: 'text', wide: true, label: L3('চিঠির শিরোনাম-পঙক্তি (মোটো)', 'मोटो', 'Tagline'), ph: L3('শিক্ষার আলো, সবার ভালোবাসা', '…', 'Motto text') },
    { id: 'toBlock', kind: 'textarea', rows: 3, label: L3('প্রাপক-ব্লক (প্রতি লাইনে একটি)', 'प्रापक (प्रति पंक्ति एक)', 'Recipient block (one per line)'), ph: L3('উপজেলা শিক্ষা অফিসার\nতমুক উপজেলা, তমুক জেলা', '…', 'Recipient lines') },
    { id: 'subject', kind: 'text', wide: true, label: DSB.subject },
    { id: 'sourceRef', kind: 'text', wide: true, label: L3('সূত্র (ঐচ্ছিক)', 'संदर्भ (वैकल्पिक)', 'Reference (optional)'), ph: L3('সূত্র: মহাপরিচালকের পত্র স্মারক নং …', 'संदर्भ:…', 'Reference no.') },
    { id: 'body', kind: 'textarea', wide: true, rows: 6, label: L3('মূল পত্র', 'पत्र का मुख्य भाग', 'Body'), ph: L3('উপর্যুক্ত বিষয়ে অবগতি ও প্রয়োজনীয় পদক্ষেপ…', '…', 'Body text…') },
    { id: 'sign1Name', kind: 'text', label: L3('স্বাক্ষরকারী (নাম ও পদবি)', 'हस्ताक्षरकर्ता', 'Signatory') },
  ],
  build: (v, lang, P) => {
    const toLines = lines(V(v, 'toBlock'));
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      V(v, 'tagline') ? pc(`<span style="font-size:9.5pt; font-style:italic; color:${P.soft}">${esc(V(v, 'tagline'))}</span>`) : '',
      buildDividerHtml('double'),
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'refNo') ? `${tx(lang, DSB.refNo)}: ${V(v, 'refNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      toLines.length
        ? `<p style="margin-top:0.8em"><strong>${esc(pick(lang, 'বরাবর', 'सेवा में,', 'To,'))}</strong></p>${toLines.map((l) => `<p style="margin:0.1em 0; font-size:11pt">${esc(l)}</p>`).join('')}`
        : '',
      V(v, 'sourceRef') ? `<p style="margin-top:0.8em; font-size:10.5pt; color:${P.soft}">${esc(V(v, 'sourceRef'))}</p>` : '',
      V(v, 'subject') ? `<p style="margin-top:0.8em"><strong>${esc(tx(lang, DSB.subject))}:</strong> <span style="text-decoration:underline; font-weight:600">${esc(V(v, 'subject'))}</span></p>` : '',
      `<p style="margin-top:1em"><strong>${tx(lang, DSB.sir)}</strong></p>`,
      `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'body'))}</p>`,
      `<p style="text-align:right; margin-top:1.4em; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'আপনার বিশ্বস্ত', 'आपका', 'Yours faithfully'))}</p>`,
      `<p style="text-align:right; margin:0.3em 0 0; font-size:10.5pt"><strong>${esc(V(v, 'sign1Name'))}</strong></p>`,
    ].filter(Boolean).join('');
  },
};

const REPORT_TPL: DsTemplate = {
  id: 'report',
  category: 'office',
  name: L3('প্রতিবেদন', 'प्रतिवेदन', 'Report'),
  desc: L3('ভূমিকা–পরিদর্শন–প্রাপ্ত তথ্য–পর্যবেক্ষণ–সুপারিশ — পূর্ণাঙ্গ প্রতিবেদন-কাঠামো।', 'प्रतिवेदन।', 'Structured official report.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    ...fOffice(),
    { id: 'title', kind: 'text', wide: true, label: L3('প্রতিবেদনের শিরোনাম', 'प्रतिवेदन शीर्षक', 'Report title') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'intro', kind: 'textarea', wide: true, rows: 3, label: L3('ভূমিকা', 'परिचय', 'Introduction') },
    { id: 'visit', kind: 'textarea', wide: true, rows: 3, label: L3('পরিদর্শন/কাজের বিবরণ', 'कार्य का विवरण', 'Field work') },
    { id: 'findings', kind: 'textarea', wide: true, rows: 4, label: L3('প্রাপ্ত তথ্য (প্রতি লাইনে একটি)', 'प्राप्त तथ्य (प्रति पंक्ति)', 'Findings (one per line)') },
    { id: 'obs', kind: 'textarea', wide: true, rows: 3, label: L3('পর্যবেক্ষণ ও বিশ্লেষণ', 'पर्यवेक्षण', 'Observation & analysis') },
    { id: 'recs', kind: 'textarea', wide: true, rows: 4, label: L3('সুপারিশ (প্রতি লাইনে একটি)', 'सिफारिशें (प्रति पंक्ति)', 'Recommendations (one per line)') },
    { id: 'sign1Name', kind: 'text', label: L3('প্রতিবেদক (নাম ও পদবি)', 'प्रतिवेदक', 'Reporter') },
  ],
  build: (v, lang, P) => {
    const list = (id: string) => lines(V(v, id)).map((l) => `<li>${esc(l)}</li>`).join('');
    const sec = (title: T3, inner: string) =>
      inner ? `<h3 style="color:${P.head}; font-size:12pt; margin-top:1em; border-bottom:1px solid ${P.border}; padding-bottom:2px">${tx(lang, title)}</h3>${inner}` : '';
    return [
      pc(`<strong style="font-size:12pt; letter-spacing:0.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('double'),
      band(V(v, 'title') || pick(lang, 'প্রতিবেদন', 'प्रतिवेदन', 'REPORT'), P),
      V(v, 'date') ? `<p style="text-align:right; margin-top:0.5em; font-size:10pt; color:${P.soft}">${esc(`${tx(lang, DSB.date)}: ${V(v, 'date')}`)}</p>` : '',
      sec(L3('ভূমিকা', 'परिचय', 'Introduction'), V(v, 'intro') ? `<p style="line-height:1.9; text-align:justify">${esc(V(v, 'intro'))}</p>` : ''),
      sec(L3('পরিদর্শন ও কাজের বিবরণ', 'कार्य का विवरण', 'Field work'), V(v, 'visit') ? `<p style="line-height:1.9; text-align:justify">${esc(V(v, 'visit'))}</p>` : ''),
      sec(L3('প্রাপ্ত তথ্য', 'प्राप्त तथ्य', 'Findings'), lines(V(v, 'findings')).length ? `<ul>${list('findings')}</ul>` : ''),
      sec(L3('পর্যবেক্ষণ ও বিশ্লেষণ', 'पर्यवेक्षण', 'Observation'), V(v, 'obs') ? `<p style="line-height:1.9; text-align:justify">${esc(V(v, 'obs'))}</p>` : ''),
      sec(L3('সুপারিশ', 'सिफारिशें', 'Recommendations'), lines(V(v, 'recs')).length ? `<ol>${list('recs')}</ol>` : ''),
      `<p style="text-align:right; margin-top:1.4em; font-size:10.5pt"><strong>${esc(V(v, 'sign1Name'))}</strong></p>`,
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ ব্যবসা (biz) ═════════════════════════

/** সংখ্যা → ভাষাভেদে অঙ্ক-স্ট্রিং (বাংলা ভাষায় বাংলা অঙ্ক) */
function numStr(n: number, lang: Lang): string {
  const s = String(Math.round(n));
  if (lang !== 'bn') return s;
  const digits = '০১২৩৪৫৬৭৮৯';
  return s.replace(/\d/g, (d) => digits[Number(d)]);
}

/** সংখ্যা-লেখা → সংখ্যা (বাংলা/ইংরেজি অঙ্ক দুটোই) */
function toNum(s: string): number {
  const cleaned = String(s ?? '')
    .replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)))
    .replace(/[^\d.-]/g, '');
  return Number(cleaned) || 0;
}

/**
 * টাকা → কথায় (ইনভয়েস/রসিদের "কথায়" পঙক্তি)।
 * বাংলা ভাষায় বাংলা কথায়; হিন্দি/ইংরেজিতে ইংরেজি কথায় (সাধারণ প্রথা)।
 * ০–৯৯,৯৯,৯৯,৯৯৯ পর্যন্ত সম্পূর্ণ সঠিক — শত/হাজার/লক্ষ/কোটি স্তরসহ
 * (যেমন ৩০,৪৫০ → "ত্রিশ হাজার চারশত পঞ্চাশ টাকা মাত্র" / "thirty thousand four hundred fifty taka only")।
 */
export function wordsTaka(n: number, lang: Lang): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  n = Math.round(n);
  const onesBn = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'উনত্রিশ', 'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ', 'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ', 'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট', 'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর', 'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'উনআশি', 'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'উননব্বই', 'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];
  const onesEn = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tensEn = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const twoEn = (x: number): string => (x < 20 ? onesEn[x] : `${tensEn[Math.floor(x / 10)]}${x % 10 ? `-${onesEn[x % 10]}` : ''}`);
  /** ০–৯৯৯ → কথায় (শত-স্তরসহ) — ইংরেজি */
  const threeEn = (x: number): string => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    const head = h ? `${onesEn[h]} hundred` : '';
    const tail = r ? twoEn(r) : '';
    return [head, tail].filter(Boolean).join(' ');
  };
  /** ০–৯৯৯ → কথায় (শত-স্তরসহ) — বাংলা: চারশত পঞ্চাশ */
  const threeBn = (x: number): string => {
    const h = Math.floor(x / 100);
    const r = x % 100;
    const head = h ? `${onesBn[h]}শত` : '';
    const tail = r ? twoBn(r) : '';
    return [head, tail].filter(Boolean).join(' ');
  };
  const twoBn = (x: number): string => (x < onesBn.length ? onesBn[x] : String(x));

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (lang !== 'bn') {
    const parts: string[] = [];
    if (crore) parts.push(`${threeEn(crore)} crore`);
    if (lakh) parts.push(`${threeEn(lakh)} lakh`);
    if (thousand) parts.push(`${threeEn(thousand)} thousand`);
    if (rest) parts.push(threeEn(rest));
    return `${parts.join(' ')} taka only`;
  }
  const parts: string[] = [];
  if (crore) parts.push(`${threeBn(crore)} কোটি`);
  if (lakh) parts.push(`${threeBn(lakh)} লক্ষ`);
  if (thousand) parts.push(`${threeBn(thousand)} হাজার`);
  if (rest) parts.push(threeBn(rest));
  return `${parts.join(' ')} টাকা মাত্র`;
}

const INVOICE_TPL: DsTemplate = {
  id: 'invoice',
  category: 'finance',
  name: L3('ইনভয়েস/চালান', 'इनवॉइस/चालान', 'Invoice'),
  desc: L3('পরিমাণ×দর=টাকা স্বয়ংক্রিয় গণনাসহ পেশাদার চালান — কথায়-মোট, ভ্যাট, স্বাক্ষর।', 'पेशेवर इनवॉइस।', 'Invoice with auto totals.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'shop', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'प्रतिष्ठान का नाम', 'Business name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'phone', kind: 'text', label: L3('মোবাইল/ফোন', 'मोबाइल/फोन', 'Phone') },
    { id: 'invoiceNo', kind: 'text', label: L3('চালান/ইনভয়েস নং', 'इनवॉइस सं.', 'Invoice no.') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'buyer', kind: 'textarea', rows: 3, label: L3('প্রাপকের নাম ও ঠিকানা (প্রতি লাইনে একটি)', 'प्रापक का नाम व पता', 'Buyer name & address'), ph: L3('অমুক স্টোর\nতমুক রোড, তমুক বাজার', '…', 'Buyer lines') },
    {
      id: 'items', kind: 'table', wide: true, rows: 6,
      label: L3('পণ্য-তালিকা (প্রতি সারি: নাম | পরিমাণ | দর)', 'सूची (नाम | मात्रा | दर)', 'Items (name | qty | rate)'),
      ph: L3('টিনের ছাদ | ১২ | ১৪৫০\nসিমেন্ট (বস্তা) | ৫ | ৪১০\nরং | ২ | ৭৮০', '…', 'Roof sheet | 12 | 1450'),
      cols: [L3('বিবরণ', 'विवरण', 'Description'), L3('পরিমাণ', 'मात्रा', 'Qty'), L3('দর', 'दर', 'Rate'), L3('টাকা', 'राशि', 'Amount')],
    },
    { id: 'discount', kind: 'text', label: L3('ছাড় (টাকায়, ঐচ্ছিক)', 'छूट (वैकल्पिक)', 'Discount (optional)') },
    { id: 'vat', kind: 'text', label: L3('ভ্যাট/ট্যাক্স (%)', 'वैट/टैक्स (%)', 'VAT/tax (%)') },
    { id: 'note', kind: 'text', wide: true, label: L3('শর্ত/নোট', 'नोट', 'Terms note') },
    { id: 'sign1Name', kind: 'text', label: L3('স্বাক্ষরকারী', 'हस्ताक्षरकर्ता', 'Signatory') },
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'items')).map((l) => l.split('|').map((c) => c.trim()));
    let sub = 0;
    const bodyRows = rows
      .map((cells) => {
        const [name = '', qty = '', rate = ''] = cells;
        const amt = toNum(qty) * toNum(rate);
        sub += amt;
        return `<tr><td>${esc(name)}</td><td style="text-align:center">${esc(qty)}</td><td style="text-align:right">${esc(rate)}</td><td style="text-align:right">${esc(amt ? numStr(amt, lang) : '')}</td></tr>`;
      })
      .join('');
    const disc = toNum(V(v, 'discount'));
    const vatRate = toNum(V(v, 'vat'));
    const vatAmt = Math.round(((sub - disc) * vatRate) / 100);
    const total = Math.max(0, sub - disc + vatAmt);
    const totalRow = (label: string, val: string, bold = false, tint = false) =>
      `<tr><td colspan="3" style="text-align:right${bold ? '; font-weight:700' : ''}"${tint ? ` data-bg="${P.band}"` : ''}>${esc(label)}</td><td style="text-align:right${bold ? '; font-weight:700' : ''}"${tint ? ` data-bg="${P.band}"` : ''}>${esc(val)}</td></tr>`;
    return [
      pc(`<strong style="font-size:14pt; letter-spacing:0.5px">${esc(V(v, 'shop'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      V(v, 'phone') ? pc(`<span style="font-size:10.5pt; color:${P.soft}">${esc(V(v, 'phone'))}</span>`) : '',
      band(pick(lang, 'চালান / ইনভয়েস', 'चालान / इनवॉइस', 'INVOICE'), P),
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'invoiceNo') ? `${pick(lang, 'চালান নং', 'चालान सं.', 'Invoice no.')}: ${V(v, 'invoiceNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      V(v, 'buyer')
        ? `<div class="doc-textbox" data-variant="box" data-border="${P.border}" data-fill="transparent" data-bstyle="solid" data-bwidth="1"><p style="margin:0"><strong>${esc(pick(lang, 'প্রাপকের নাম ও ঠিকানা', 'प्रापक का नाम व पता', 'Bill to:'))}</strong></p>${lines(V(v, 'buyer')).map((l) => `<p style="margin:0.1em 0">${esc(l)}</p>`).join('')}</div>`
        : '',
      `<table><tr><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'বিবরণ', 'विवरण', 'Description'))}</th><th data-bg="${P.band}">${esc(pick(lang, 'পরিমাণ', 'मात्रा', 'Qty'))}</th><th data-bg="${P.band}" style="text-align:right">${esc(pick(lang, 'দর', 'दर', 'Rate'))}</th><th data-bg="${P.band}" style="text-align:right">${esc(pick(lang, 'টাকা', 'राशि', 'Amount'))}</th></tr>${bodyRows}${totalRow(tx(lang, DSB.total), numStr(sub, lang))}${disc ? totalRow(pick(lang, 'ছাড়', 'छूट', 'Discount'), `− ${numStr(disc, lang)}`) : ''}${vatAmt ? totalRow(`${pick(lang, 'ভ্যাট', 'वैट', 'VAT')} (${V(v, 'vat')}%)`, `+ ${numStr(vatAmt, lang)}`) : ''}${totalRow(pick(lang, 'সর্বমোট প্রদেয়', 'कुल देय', 'Grand total'), numStr(total, lang), true, true)}</table>`,
      `<p style="font-size:10.5pt"><strong>${tx(lang, DSB.inWords)}:</strong> ${esc(wordsTaka(total, lang))}</p>`,
      V(v, 'note') ? `<p style="font-size:10pt; color:${P.soft}">${esc(V(v, 'note'))}</p>` : '',
      // স্বাক্ষর-রেখা — float/inline-block এডিটর-চুক্তির বাইরে হারিয়ে যেত; ডান-সারিত
      // প্যারা + border-top (extensions-এর নতুন borderTop* অ্যাট্রিবিউটে রাউন্ড-ট্রিপ করে)
      `<p style="text-align:right; margin-top:1.6em; border-top:1px solid ${P.border}; padding-top:4px; font-size:10pt">${esc(V(v, 'sign1Name') || pick(lang, 'অনুমোদিত স্বাক্ষর', 'अनुमोदित हस्ताक्षर', 'Authorised signature'))}</p>`,
    ].filter(Boolean).join('');
  },
};

const MONEY_RECEIPT_TPL: DsTemplate = {
  id: 'money-receipt',
  category: 'finance',
  name: L3('টাকা আদায়ের রসিদ', 'नकद रसीद', 'Money Receipt'),
  desc: L3('রসিদ-নম্বর ও কথায়-টাকাসহ নগদ আদায়ের প্রথাসিদ্ধ রসিদ — মোহর-স্থানসহ।', 'नकद रसीद।', 'Cash receipt with stamp spot.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'shop', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'प्रतिष्ठान', 'Business name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা/মোবাইল', 'पता/मोबाइल', 'Address / phone') },
    { id: 'receiptNo', kind: 'text', label: L3('রসিদ নং', 'रसीद सं.', 'Receipt no.') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'payer', kind: 'text', wide: true, label: L3('যিনি টাকা দিলেন', 'राशि देने वाला', 'Received from') },
    { id: 'amount', kind: 'text', label: L3('টাকা (অঙ্কে)', 'राशि (अंक में)', 'Amount (figures)'), ph: L3('৳ ৫,০০০', '₹…', 'Tk. 5,000') },
    { id: 'amountWords', kind: 'text', wide: true, label: L3('টাকা (কথায়)', 'राशि (शब्दों में)', 'Amount (in words)'), ph: L3('পাঁচ হাজার টাকা মাত্র', 'पाँच हज़ार', 'Five thousand only') },
    { id: 'purpose', kind: 'text', wide: true, label: L3('বাবদ', 'बाबत', 'Being payment of'), ph: L3('বই ক্রয়-মূল্য বাবদ', '…', 'Book purchase') },
    { id: 'byCheque', kind: 'text', wide: true, label: L3('চেক/বিকাশ/নগদ (ঐচ্ছিক)', 'चेक/बिकाश (वैकल्पिक)', 'Cheque/mobile payment (optional)') },
    { id: 'sign1Name', kind: 'text', label: L3('গ্রহীতার নাম', 'ग्रहीता का नाम', 'Receiver\u2019s name') },
  ],
  build: (v, lang, P) => [
    pc(`<strong style="font-size:13pt; letter-spacing:0.5px">${esc(V(v, 'shop'))}</strong>`, `color:${P.head}`),
    V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
    buildDividerHtml('double'),
    band(pick(lang, 'টাকা আদায়ের রসিদ', 'नकद रसीद', 'MONEY RECEIPT'), P),
    row2(
      `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'receiptNo') ? `${pick(lang, 'রসিদ নং', 'रसीद सं.', 'Receipt no.')}: ${V(v, 'receiptNo')}` : '')}</p>`,
      `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
    ),
    `<p style="margin-top:0.9em; line-height:2"><strong>${esc(pick(lang, 'যিনি টাকা দিলেন', 'राशि देने वाला', 'Received with thanks from'))}:</strong> ${esc(V(v, 'payer'))}</p>`,
    `<p style="line-height:2"><strong>${esc(pick(lang, 'টাকা', 'राशि', 'A sum of'))}:</strong> <strong style="font-size:12pt">${esc(V(v, 'amount'))}</strong> <span style="color:${P.soft}">( ${esc(V(v, 'amountWords'))} )</span></p>`,
    `<p style="line-height:2"><strong>${esc(pick(lang, 'বাবদ', 'बाबत', 'Being payment of'))}:</strong> ${esc(V(v, 'purpose'))}</p>`,
    V(v, 'byCheque') ? `<p style="line-height:2"><strong>${esc(pick(lang, 'চেক/মোবাইল-ব্যাংকিং', 'चेक/मोबाइल', 'Cheque/mobile'))}:</strong> ${esc(V(v, 'byCheque'))}</p>` : '',
    buildDividerHtml('single'),
    row2(
      `<p style="text-align:left; margin:0; font-size:9.5pt; color:${P.soft}">${esc(pick(lang, 'মোহর', 'मुहर', 'Stamp'))}</p>`,
      `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'গ্রহীতার স্বাক্ষর', 'ग्रहीता के हस्ताक्षर', 'Receiver\u2019s signature'))}</p>`,
    ),
    pc(`<strong style="font-size:10.5pt">${esc(V(v, 'sign1Name'))}</strong>`),
  ].filter(Boolean).join(''),
};

const AGREEMENT_TPL: DsTemplate = {
  id: 'agreement',
  category: 'legal',
  name: L3('চুক্তিপত্র', 'समझौता पत्र', 'Agreement'),
  desc: L3('দুই পক্ষের সমঝোতা চুক্তি — শর্তাবলি, সাক্ষী ও স্বাক্ষর-ব্লকসহ আইনি ধাঁচ।', 'समझौता पत्र।', 'Two-party agreement.'),
  styles: ALL_STYLES,
  defaultStyle: 'sepia',
  fields: [
    { id: 'title', kind: 'text', wide: true, label: L3('চুক্তির শিরোনাম', 'समझौते का शीर्षक', 'Agreement title'), ph: L3('দোকান ভাড়া চুক্তিপত্র', 'किराया समझौता', 'Shop rent agreement') },
    { id: 'deedDate', kind: 'text', label: L3('তারিখ', 'तिथि', 'Date') },
    { id: 'donor', kind: 'text', wide: true, label: L3('পক্ষক (নাম, পিতা, ঠিকানা)', 'पक्षक (नाम…)', 'Party A details') },
    { id: 'donee', kind: 'text', wide: true, label: L3('পক্ষখ (নাম, পিতা, ঠিকানা)', 'पक्षख (नाम…)', 'Party B details') },
    { id: 'body', kind: 'textarea', wide: true, rows: 3, label: L3('চুক্তির ভূমিকা', 'समझौते का परिचय', 'Opening'), ph: L3('পক্ষদ্বয়ের স্বেচ্ছায় ও সম্মতিক্রমে নিম্নোক্ত শর্তে চুক্তি হইল…', '…', 'The parties agree as follows…') },
    { id: 'clauses', kind: 'textarea', wide: true, rows: 6, label: L3('শর্তাবলি (প্রতি লাইনে একটি)', 'शर्तें (प्रति पंक्ति एक)', 'Clauses (one per line)'), ph: L3('ভাড়া মাসিক ৫,০০০ টাকা — প্রতি মাসের ৫ তারিখের মধ্যে।\nভাড়াটিয়া ১১ মাস পর নবায়ন করিতে পারিবেন।\nতিন মাসের নোটিশ ছাড়া খালি করা যাইবে না।', 'शर्त…', 'Clause text…') },
    { id: 'witness1', kind: 'text', label: L3('সাক্ষী ১', 'साक्षी १', 'Witness 1') },
    { id: 'witness2', kind: 'text', label: L3('সাক্ষী ২', 'साक्षी २', 'Witness 2') },
  ],
  build: (v, lang, P) => {
    const clauses = lines(V(v, 'clauses'));
    return [
      band(V(v, 'title') || pick(lang, 'চুক্তিপত্র', 'समझौता पत्र', 'AGREEMENT'), P),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(pick(lang, 'এই চুক্তিপত্র', 'यह समझौता', 'This agreement is made on'))} <strong>${esc(V(v, 'deedDate'))}</strong>${esc(pick(lang, ' তারিখে পক্ষক', ' को पक्षक', ' between party A'))} <strong>${esc(pick(lang, 'ক', 'क', 'A'))}</strong> ${esc(V(v, 'donor'))} ${esc(pick(lang, 'এবং পক্ষখ', 'और पक्षख', 'and party B'))} <strong>${esc(pick(lang, 'খ', 'ख', 'B'))}</strong> ${esc(V(v, 'donee'))} ${esc(pick(lang, 'মধ্যে সম্পাদিত হইল।', 'के मध्य सम्पन्न हुआ।', 'is executed.'))}</p>`,
      `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'body'))}</p>`,
      `<p style="margin-top:0.6em"><strong>${esc(pick(lang, 'শর্তাবলি:', 'शर्तें:', 'Terms and conditions:'))}</strong></p>`,
      clauses.length ? `<ol>${clauses.map((cl) => `<li>${esc(cl)}</li>`).join('')}</ol>` : '',
      `<p style="line-height:1.9; text-align:justify">${esc(pick(lang, 'চুক্তির এই প্রতিলিপি পক্ষদ্বয় পাঠ-শুনিয়া অর্থ বুঝিয়া সম্মতিক্রমে স্বাক্ষর করিলেন।', 'पक्षकारों ने पढ़कर सुनकर सहमति से हस्ताक्षर किए।', 'Both parties signed after reading and understanding.'))}</p>`,
      `<p style="margin-top:1.1em"><strong>${esc(pick(lang, 'সাক্ষীগণ:', 'साक्षीगण:', 'Witnesses:'))}</strong></p>`,
      `<ol><li>${esc(V(v, 'witness1'))}</li><li>${esc(V(v, 'witness2'))}</li></ol>`,
      sig2(lang, P, { t: pick(lang, 'পক্ষক', 'पक्षक', 'Party A'), n: '', o: '' }, { t: pick(lang, 'পক্ষখ', 'पक्षख', 'Party B'), n: '', o: '' }),
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ শিক্ষা-প্রতিষ্ঠান (edu) ═════════════════════════

const ROUTINE_DAYS: T3[] = [
  L3('সময়', 'समय', 'Time'),
  L3('রবিবার', 'रविवार', 'Sun'),
  L3('সোমবার', 'सोमवार', 'Mon'),
  L3('মঙ্গলবার', 'मंगलवार', 'Tue'),
  L3('বুধবার', 'बुधवार', 'Wed'),
  L3('বৃহস্পতিবার', 'गुरुवार', 'Thu'),
];

const CLASS_ROUTINE_TPL: DsTemplate = {
  id: 'class-routine',
  category: 'edu',
  name: L3('ক্লাস রুটিন', 'कक्षा रुटीन', 'Class Routine'),
  desc: L3('পিরিয়ড×দিন গ্রিডের ক্লাস-রুটিন — শ্রেণি, শাখা ও নোটসহ।', 'कक्षा रुटीन।', 'Period×day class routine.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था का नाम', 'Institution name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'title', kind: 'text', wide: true, label: L3('শিরোনাম', 'शीर्षक', 'Title'), ph: L3('ক্লাস রুটিন — ২০২৫', 'कक्षा रुटीन', 'Class Routine 2025') },
    { id: 'className', kind: 'text', label: L3('শ্রেণি/কোর্স', 'कक्षा/कोर्स', 'Class/course') },
    { id: 'effective', kind: 'text', label: L3('কার্যকর থেকে', 'प्रभावी', 'Effective from') },
    {
      id: 'grid', kind: 'table', wide: true, rows: 6,
      label: L3('রুটিন-গ্রিড (প্রতি সারি: সময় | রবি | সোম | মঙ্গল | বুধ | বৃহ)', 'ग्रिड (समय | रवि | सोम | मंगल | बुध | गुरु)', 'Grid (time | Sun | Mon | Tue | Wed | Thu)'),
      ph: L3('৯:০০–৯:৪৫ | বাংলা | ইংরেজি | গণিত | বিজ্ঞান | ধর্ম\n৯:৪৫–১০:৩০ | ইংরেজি | গণিত | বাংলা | আইসিটি | বিজ্ঞান', '…', '9:00–9:45 | Bangla | English | Math'),
      cols: ROUTINE_DAYS,
    },
    { id: 'note', kind: 'textarea', rows: 2, wide: true, label: L3('নোট (ঐচ্ছিক)', 'नोट', 'Note'), ph: L3('টিফিন: ১১:১৫–১১:৩০ | শিক্ষক সভা: শনিবার শেষ পিরিয়ড', '…', 'Tiffin: …') },
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'grid')).map((l) => l.split('|').map((c) => c.trim()));
    const head = ROUTINE_DAYS.map((d) => `<th style="text-align:left">${esc(tx(lang, d))}</th>`).join('');
    const body = rows
      .map((cells) => `<tr>${ROUTINE_DAYS.map((_, i) => `<td>${esc(cells[i] ?? '')}</td>`).join('')}</tr>`)
      .join('');
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('single'),
      pc(`<strong style="font-size:13pt">${esc(V(v, 'title') || pick(lang, 'ক্লাস রুটিন', 'कक्षा रुटीन', 'CLASS ROUTINE'))}</strong>`, `color:${P.head}`),
      row2(
        V(v, 'className') ? `<p style="text-align:left; margin:0; font-size:10.5pt">${esc(`${pick(lang, 'শ্রেণি/কোর্স', 'कक्षा', 'Class')}: ${V(v, 'className')}`)}</p>` : '',
        `<p style="text-align:right; margin:0; font-size:10.5pt; color:${P.soft}">${esc(V(v, 'effective') ? `${pick(lang, 'কার্যকর', 'प्रभावी', 'Effective')}: ${V(v, 'effective')}` : '')}</p>`,
      ),
      `<table><tr>${head}</tr>${body}</table>`,
      V(v, 'note') ? `<p style="font-size:10pt; color:${P.soft}">${esc(V(v, 'note'))}</p>` : '',
    ].filter(Boolean).join('');
  },
};

const EXAM_ROUTINE_TPL: DsTemplate = {
  id: 'exam-routine',
  category: 'edu',
  name: L3('পরীক্ষার রুটিন', 'परीक्षा रुटीन', 'Exam Routine'),
  desc: L3('তারিখ-বার-সময়-বিষয় কলামের পরীক্ষা-রুটিন — নির্দেশনা-বক্সসহ।', 'परीक्षा रुटीन।', 'Exam schedule with instructions.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Institution name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'title', kind: 'text', wide: true, label: L3('পরীক্ষার নাম', 'परीक्षा का नाम', 'Exam name'), ph: L3('বার্ষিক পরীক্ষা — ২০২৫', 'वार्षिक परीक्षा', 'Annual Exam 2025') },
    { id: 'className', kind: 'text', label: L3('শ্রেণি/কোর্স', 'कक्षा', 'Class/course') },
    {
      id: 'rows', kind: 'table', wide: true, rows: 6,
      label: L3('সূচি (প্রতি সারি: তারিখ | বার | সময় | বিষয়)', 'सूची (तिथि | बार | समय | विषय)', 'Rows (date | day | time | subject)'),
      ph: L3('১ ডিসেম্বর | সোমবার | ১০:০০–১:০০ | বাংলা\n৩ ডিসেম্বর | বুধবার | ১০:০০–১:০০ | ইংরেজি\n৫ ডিসেম্বর | শুক্রবার | ১০:০০–১:০০ | গণিত', '…', '1 Dec | Mon | 10:00 | Bangla'),
      cols: [L3('তারিখ', 'तिथि', 'Date'), L3('বার', 'बार', 'Day'), L3('সময়', 'समय', 'Time'), L3('বিষয়', 'विषय', 'Subject')],
    },
    {
      id: 'rules', kind: 'textarea', wide: true, rows: 4,
      label: L3('নির্দেশনা (প্রতি লাইনে একটি)', 'निर्देश (प्रति पंक्ति एक)', 'Instructions (one per line)'),
      ph: L3('পরীক্ষার্থীদের ৩০ মিনিট পূর্বে হাজির হইতে হইবে।\nমোবাইল ফোন কঠোরভাবে নিষিদ্ধ।\nহলে প্রবেশপত্র বাধ্যতামূলক।', 'निर्देश…', 'Arrive 30 min early…'),
    },
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'rows')).map((l) => l.split('|').map((c) => c.trim()));
    const rules = lines(V(v, 'rules'));
    const head = [L3('তারিখ', 'तिथि', 'Date'), L3('বার', 'बार', 'Day'), L3('সময়', 'समय', 'Time'), L3('বিষয়', 'विषय', 'Subject')]
      .map((c) => `<th style="text-align:left">${esc(tx(lang, c))}</th>`)
      .join('');
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('double'),
      pc(`<strong style="font-size:13pt">${esc(V(v, 'title') || pick(lang, 'পরীক্ষার রুটিন', 'परीक्षा रुटीन', 'EXAM ROUTINE'))}</strong>`, `color:${P.head}`),
      V(v, 'className') ? pc(`<span style="font-size:11pt">${esc(`${pick(lang, 'শ্রেণি/কোর্স', 'कक्षा', 'Class')}: ${V(v, 'className')}`)}</span>`) : '',
      `<table><tr>${head}</tr>${rows.map((cells) => `<tr>${[0, 1, 2, 3].map((i) => `<td>${esc(cells[i] ?? '')}</td>`).join('')}</tr>`).join('')}</table>`,
      rules.length
        ? buildDesignBoxHtml({ variant: 'box', border: P.border, fill: P.band, bstyle: 'solid', bwidth: 1 }, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'নির্দেশনা:', 'निर्देश:', 'Instructions:'))}</strong></p><ol>${rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ol>`)
        : '',
    ].filter(Boolean).join('');
  },
};

const MARKSHEET_TPL: DsTemplate = {
  id: 'marksheet',
  category: 'edu',
  name: L3('মার্কশিট', 'मार्कशीट', 'Marksheet'),
  desc: L3('বিষয়-নম্বর-গ্রেড টেবিল, সর্বমোট ও জিপিএ-সহ স্কুল-প্রথার মার্কশিট।', 'मार्कशीट।', 'Subject marks with totals & GPA.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Institution name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'examName', kind: 'text', wide: true, label: L3('পরীক্ষার নাম', 'परीक्षा', 'Exam name'), ph: L3('অর্ধবার্ষিক মূল্যায়ন — ২০২৫', '…', 'Half-yearly exam') },
    { id: 'name', kind: 'text', label: L3('ছাত্র/ছাত্রীর নাম', 'छात्र का नाम', 'Student name') },
    { id: 'className', kind: 'text', label: L3('শ্রেণি', 'कक्षा', 'Class') },
    { id: 'roll', kind: 'text', label: L3('রোল নং', 'रोल सं.', 'Roll no.') },
    { id: 'section', kind: 'text', label: L3('শাখা', 'शाखा', 'Section') },
    {
      id: 'subjects', kind: 'table', wide: true, rows: 7,
      label: L3('বিষয়-তালিকা (প্রতি সারি: বিষয় | পূর্ণমান | প্রাপ্ত নম্বর | গ্রেড)', 'विषय (विषय | पूर्णांक | प्राप्तांक | ग्रेड)', 'Subjects (name | full | got | grade)'),
      ph: L3('বাংলা | ১০০ | ৭৮ | A\nইংরেজি | ১০০ | ৭১ | A\nগণিত | ১০০ | ৮২ | A+', '…', 'Bangla | 100 | 78 | A'),
      cols: [L3('বিষয়', 'विषय', 'Subject'), L3('পূর্ণমান', 'पूर्णांक', 'Full marks'), L3('প্রাপ্ত নম্বর', 'प्राप्तांक', 'Marks'), L3('গ্রেড', 'ग्रेड', 'Grade')],
    },
    { id: 'gpa', kind: 'text', label: L3('জিপিএ/মান', 'जीपीए', 'GPA') },
    { id: 'division', kind: 'text', label: L3('বিভাগ/মেধাস্থান', 'विभाग', 'Division/merit') },
    ...fSign2(L3('পদবি (শিক্ষক)', 'पद (शिक्षक)', 'Title (teacher)'), L3('পদবি (প্রধান শিক্ষক)', 'पद (प्रधानाचार्य)', 'Title (head)')),
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'subjects')).map((l) => l.split('|').map((c) => c.trim()));
    const head = [L3('বিষয়', 'विषय', 'Subject'), L3('পূর্ণমান', 'पूर्णांक', 'Full'), L3('প্রাপ্ত নম্বর', 'प्राप्तांक', 'Marks'), L3('গ্রেড', 'ग्रेड', 'Grade')]
      .map((c) => `<th style="text-align:left">${esc(tx(lang, c))}</th>`)
      .join('');
    const meta = (label: string, val: string) =>
      `<p style="margin:0.15em 0; font-size:11pt"><strong>${esc(label)}:</strong> ${esc(val || '—')}</p>`;
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('double'),
      pc(`<strong style="font-size:13pt">${esc(pick(lang, 'নম্বর-পত্র', 'अंक-पत्र', 'MARKSHEET'))}</strong>`, `color:${P.head}`),
      V(v, 'examName') ? pc(`<span style="font-size:11pt">${esc(V(v, 'examName'))}</span>`) : '',
      buildDesignBoxHtml({ variant: 'shaded', border: P.border, fill: P.band, bstyle: 'solid', bwidth: 1 },
        row2(
          meta(pick(lang, 'নাম', 'नाम', 'Name'), V(v, 'name')) + meta(pick(lang, 'শ্রেণি', 'कक्षा', 'Class'), V(v, 'className')) + meta(pick(lang, 'রোল', 'रोल', 'Roll'), V(v, 'roll')),
          meta(pick(lang, 'শাখা', 'शाखा', 'Section'), V(v, 'section')) + meta(pick(lang, 'জিপিএ', 'जीपीए', 'GPA'), V(v, 'gpa')) + meta(pick(lang, 'মেধাস্থান', 'मेधा स्थान', 'Merit'), V(v, 'division')),
        )),
      `<table><tr>${head}</tr>${rows.map((cells) => `<tr>${[0, 1, 2, 3].map((i) => `<td>${esc(cells[i] ?? '')}</td>`).join('')}</tr>`).join('')}</table>`,
      sig2(lang, P, { t: V(v, 'sign1Title'), n: V(v, 'sign1Name'), o: '' }, { t: V(v, 'sign2Title'), n: V(v, 'sign2Name'), o: '' }),
    ].filter(Boolean).join('');
  },
};

const AWARD_TPL: DsTemplate = {
  id: 'award',
  category: 'cert',
  name: L3('প্রশংসাপত্র', 'प्रशंसा पत्र', 'Award Certificate'),
  desc: L3('স্বর্ণ-ফ্রেমসহ সম্মাননা-সনদ — সেরা ছাত্র, প্রতিযোগিতা ও কৃতিত্বের স্বীকৃতি।', 'प्रशंसा पत्र।', 'Framed award certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান/আয়োজক', 'संस्था', 'Institution / organiser') },
    { id: 'title', kind: 'text', wide: true, label: L3('শিরোনাম', 'शीर्षक', 'Title'), ph: L3('প্রশংসাপত্র / কৃতিত্ব-সনদ', 'प्रशंसा पत्र', 'Certificate of Merit') },
    { id: 'name', kind: 'text', wide: true, label: L3('প্রাপকের নাম', 'प्रापक का नाम', 'Recipient\u2019s name') },
    { id: 'body', kind: 'textarea', wide: true, rows: 3, label: L3('সম্মাননার কারণ', 'सम्मान का कारण', 'Reason of honour'), ph: L3('জাতীয় গণিত অলিম্পিয়াডে প্রথম স্থান অর্জনের জন্য…', '…', 'For securing 1st position in…') },
    { id: 'body2', kind: 'textarea', wide: true, rows: 2, label: L3('অতিরিক্ত প্রশংসা (ঐচ্ছিক)', 'अतिरिक्त', 'Extra praise'), ph: L3('তোমার সাফল্য আমাদের গর্ব…', '…', 'Your success makes us proud…') },
    { id: 'date', kind: 'date', label: DSB.date },
    ...fSign2(L3('পদবি (প্রধান অতিথি)', 'पद (मुख्य अतिथि)', 'Title (chief guest)'), L3('পদবি (আয়োজক)', 'पद (आयोजक)', 'Title (organiser)')),
  ],
  build: (v, lang, P) => framedCert(lang, P, v, [
    pc(`<strong style="font-size:11pt; letter-spacing:2.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.soft}`),
    pc(`<span style="font-size:20pt; color:${P.head}">✦</span>`),
    pc(`<strong style="font-size:19pt; letter-spacing:1px">${esc(V(v, 'title') || pick(lang, 'প্রশংসাপত্র', 'प्रशंसा पत्र', 'CERTIFICATE OF MERIT'))}</strong>`, `color:${P.head}`),
    pc(`<span style="font-size:11pt; color:${P.soft}">❦ ❖ ❦</span>`),
    `<p style="margin-top:1.1em; line-height:1.9; text-align:center; font-size:11.5pt">${esc(pick(lang, 'এই সনদ দ্বারা ঘোষিত হইতেছে যে,', 'यह प्रमाणपत्र घोषित किया जाता है कि,', 'This certificate is awarded to'))}</p>`,
    pc(`<strong style="font-size:17pt; color:${P.head}; border-bottom:2px solid ${P.border}; padding-bottom:2px">${esc(V(v, 'name'))}</strong>`),
    `<p style="margin-top:1em; line-height:1.95; text-align:center; font-size:11.5pt">${esc(V(v, 'body'))}</p>`,
    V(v, 'body2') ? `<p style="line-height:1.95; text-align:center; font-size:11pt; color:${P.soft}">${esc(V(v, 'body2'))}</p>` : '',
  ]),
};

const ADMISSION_TPL: DsTemplate = {
  id: 'admission',
  category: 'edu',
  name: L3('ভর্তি ফরম', 'प्रवेश फॉर्म', 'Admission Form'),
  desc: L3('ছবি-ঘর ও পূরণ-যোগ্য তথ্য-পঙক্তিসহ স্কুল-প্রথার ভর্তি ফরম।', 'प्रवेश फॉर्म।', 'Admission form with photo box.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Institution name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'title', kind: 'text', wide: true, label: L3('ফরম-শিরোনাম', 'फॉर्म शीर्षक', 'Form title'), ph: L3('ভর্তি ফরম — ২০২৫', 'प्रवेश फॉर्म', 'Admission Form 2025') },
    { id: 'className', kind: 'text', label: L3('শ্রেণি/কোর্স', 'कक्षा', 'Class/course') },
    { id: 'photoLabel', kind: 'text', label: L3('ছবি-ঘরের লেখা', 'फोटो', 'Photo box label'), ph: L3('পাসপোর্ট সাইজ ছবি', '…', 'PP size photo') },
    {
      id: 'fields', kind: 'table', wide: true, rows: 8,
      label: L3('তথ্য-পঙক্তি (প্রতি লাইনে একটি)', 'पंक्तियाँ (प्रति पंक्ति एक)', 'Rows (one per line)'),
      ph: L3('ছাত্রের নাম\nপিতার নাম\nমাতার নাম\nজন্মতারিখ\nএনআইডি/জন্মনিবন্ধন নং\nঠিকানা\nমোবাইল\nপূর্ববর্তী প্রতিষ্ঠান', '…', 'Student\u2019s name\nFather\u2019s name'),
      cols: [L3('তথ্য-পঙক্তি', 'विवरण', 'Field')],
    },
    { id: 'declare', kind: 'textarea', wide: true, rows: 2, label: L3('ঘোষণাপত্র', 'घोषणा', 'Declaration'), ph: L3('আমি ঘোষণা করছি যে উপরের সব তথ্য সঠিক…', '…', 'I declare the above is true…') },
    ...fSign2(L3('পদবি (অভিভাবক)', 'पद (अभिभावक)', 'Title (guardian)'), L3('পদবি (প্রধান শিক্ষক)', 'पद (प्रधानाचार्य)', 'Title (head)')),
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'fields'));
    // ভর্তি-ফরমের সারি — লেবেল + ডট-ফিল (CSS ডট-বর্ডার TipTap-এ টিকে না, তাই
    // ডট-চিহ্নই স্বাক্ষর-যোগ্য পূরণ-রেখা); ছবি-ঘর ডান স্তম্ভে rowspan-সেল
    const fieldRows = rows
      .map((label) =>
        `<tr><td data-border="none" style="border:none; width:40%; vertical-align:middle"><p style="margin:0.2em 0; font-size:11pt">${esc(label)}</p></td>` +
        `<td data-border="none" style="border:none; vertical-align:bottom"><p style="margin:0.5em 0; letter-spacing:1px">${dots(26, P)}</p></td></tr>`)
      .join('');
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('double'),
      pc(`<strong style="font-size:13pt">${esc(V(v, 'title') || pick(lang, 'ভর্তি ফরম', 'प्रवेश फॉर्म', 'ADMISSION FORM'))}</strong>`, `color:${P.head}`),
      V(v, 'className') ? pc(`<span style="font-size:11pt">${esc(`${pick(lang, 'শ্রেণি/কোর্স', 'कक्षा', 'Class')}: ${V(v, 'className')}`)}</span>`) : '',
      row2(
        '<p style="margin:0"></p>',
        buildDesignBoxHtml(
          { variant: 'box', border: P.border, fill: 'transparent', bstyle: 'solid', bwidth: 1 },
          pc(`<span style="font-size:9pt; color:${P.soft}">${esc(V(v, 'photoLabel') || pick(lang, 'ছবি', 'फोटो', 'Photo'))}</span>`, 'padding-top:2.2em; padding-bottom:2.2em'),
        ),
        55,
        45,
      ),
      // fields খালি করলে fieldRows = '' → <tr></tr> স্কিমা-ভাঙা টেবিল ঢুকত —
      // ফাঁকা হলে টেবিল-ই বাদ (বাকি ফরম-অংশ অক্ষত থাকে)
      fieldRows ? `<table style="width:100%"><tr>${fieldRows}</tr></table>` : '',
      V(v, 'declare') ? `<p style="margin-top:1em; line-height:1.9; text-align:justify; font-size:10.5pt">${esc(V(v, 'declare'))}</p>` : '',
      sig2(lang, P, { t: V(v, 'sign1Title'), n: '', o: '' }, { t: V(v, 'sign2Title'), n: '', o: '' }),
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ অনুষ্ঠান (event) ═════════════════════════

const INVITATION_TPL: DsTemplate = {
  id: 'invitation',
  category: 'event',
  name: L3('আমন্ত্রণ পত্র', 'निमंत्रण पत्र', 'Invitation Card'),
  desc: L3('অনুষ্ঠানের সম্মানিত আমন্ত্রণ — ফ্রেম, অলংকরণ ও তারিখ-স্থানসহ।', 'निमंत्रण कार्ड।', 'Framed event invitation.'),
  styles: ALL_STYLES,
  defaultStyle: 'plum',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('আয়োজক', 'आयोजक', 'Host / organiser') },
    { id: 'title', kind: 'text', wide: true, label: L3('অনুষ্ঠানের নাম', 'अनुष्ठान', 'Event name'), ph: L3('বার্ষিক সাংস্কৃতিক অনুষ্ঠান', '…', 'Annual cultural event') },
    { id: 'body', kind: 'textarea', wide: true, rows: 2, label: L3('আমন্ত্রণ-বাক্য', 'निमंत्रण वाक्य', 'Invitation line'), ph: L3('আপনাকে স্বাগত জানাতে আমরা আনন্দিত…', '…', 'We are delighted to invite you…') },
    { id: 'guest', kind: 'text', wide: true, label: L3('সম্মানিত অতিথি', 'मान्य अतिथि', 'Honoured guest'), ph: L3('জনাব অমুক ও পরিবার বরগ্রহণ', '…', 'Mr. … and family') },
    { id: 'date', kind: 'text', label: L3('তারিখ', 'तिथि', 'Date') },
    { id: 'time', kind: 'text', label: L3('সময়', 'समय', 'Time') },
    { id: 'venue', kind: 'text', wide: true, label: L3('স্থান', 'स्थान', 'Venue') },
    { id: 'note', kind: 'text', wide: true, label: L3('নোট (ঐচ্ছিক)', 'नोट', 'Note') },
  ],
  build: (v, lang, P) => {
    const inner = [
      pc(`<strong style="font-size:12pt; letter-spacing:1.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.soft}`),
      pc(`<span style="font-size:18pt; color:${P.head}">❦</span>`),
      pc(`<strong style="font-size:16pt; letter-spacing:1px">${esc(V(v, 'title'))}</strong>`, `color:${P.head}`),
      buildDividerHtml('flourish'),
      `<p style="margin-top:0.8em; line-height:1.9; text-align:center; font-size:11.5pt">${esc(V(v, 'body'))}</p>`,
      V(v, 'guest') ? pc(`<strong style="font-size:12.5pt; color:${P.head}">${esc(V(v, 'guest'))}</strong>`, 'margin-top:0.6em') : '',
      buildDividerHtml('single'),
      pc(`<span style="font-size:11pt"><strong>${esc(pick(lang, 'তারিখ', 'तिथि', 'Date'))}:</strong> ${esc(V(v, 'date'))}</span>`),
      V(v, 'time') ? pc(`<span style="font-size:11pt"><strong>${esc(pick(lang, 'সময়', 'समय', 'Time'))}:</strong> ${esc(V(v, 'time'))}</span>`) : '',
      V(v, 'venue') ? pc(`<span style="font-size:11pt"><strong>${esc(pick(lang, 'স্থান', 'स्थान', 'Venue'))}:</strong> ${esc(V(v, 'venue'))}</span>`) : '',
      V(v, 'note') ? pc(`<span style="font-size:10pt; color:${P.soft}">${esc(V(v, 'note'))}</span>`, 'margin-top:0.8em') : '',
    ].filter(Boolean).join('');
    return buildDesignBoxHtml({ variant: 'double', border: P.border, fill: 'transparent', bstyle: 'double', bwidth: 4 }, inner);
  },
};

const WEDDING_TPL: DsTemplate = {
  id: 'wedding-card',
  category: 'event',
  name: L3('বিয়ের আমন্ত্রণ কার্ড', 'विवाह निमंत्रण', 'Wedding Invitation'),
  desc: L3('কনে-বরের নাম-অভিভাবকসহ প্রথাসিদ্ধ বিবাহ-দাওয়াত — অলংকৃত ফ্রেম।', 'विवाह निमंत्रण कार्ड।', 'Traditional wedding card.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'host', kind: 'text', wide: true, label: L3('দাওয়াতকারী (পরিবার)', 'आमंत्रणकर्ता', 'Inviting family'), ph: L3('আমাদের একমাত্র কন্যা বিবাহ উপলক্ষে', '…', 'On the marriage of our daughter') },
    { id: 'bride', kind: 'text', label: L3('কনের নাম', 'वधू का नाम', 'Bride\u2019s name') },
    { id: 'brideGuard', kind: 'text', label: L3('কনের অভিভাবক (পিতা/মাতা)', 'वधू के अभिभावक', 'Bride\u2019s guardian') },
    { id: 'groom', kind: 'text', label: L3('বরের নাম', 'वर का नाम', 'Groom\u2019s name') },
    { id: 'groomGuard', kind: 'text', label: L3('বরের অভিভাবক', 'वर के अभिभावक', 'Groom\u2019s guardian') },
    { id: 'date', kind: 'text', label: L3('বিবাহের তারিখ', 'विवाह तिथि', 'Wedding date') },
    { id: 'time', kind: 'text', label: L3('সময়', 'समय', 'Time') },
    { id: 'venue', kind: 'text', wide: true, label: L3('স্থান', 'स्थान', 'Venue') },
    { id: 'note', kind: 'text', wide: true, label: L3('নোট (ঐচ্ছিক)', 'नोट', 'Note'), ph: L3('আপনার উপস্থিতিই আমাদের সাধ…', '…', 'Your presence is our joy…') },
  ],
  build: (v, lang, P) => {
    const inner = [
      pc(`<span style="font-size:17pt; color:${P.head}">✦ ❦ ✦</span>`),
      pc(`<strong style="font-size:11pt; letter-spacing:1.5px">${esc(V(v, 'host'))}</strong>`, `color:${P.soft}`),
      pc(`<strong style="font-size:15pt; color:${P.head}">${esc(V(v, 'bride'))}</strong>`, 'margin-top:0.9em'),
      V(v, 'brideGuard') ? pc(`<span style="font-size:10pt; color:${P.soft}">${esc(pick(lang, 'কন্যা শ্রীযুক্ত', 'कन्या', 'Daughter of'))} ${esc(V(v, 'brideGuard'))}</span>`, 'margin:0.2em 0') : '',
      pc(`<span style="font-size:12pt; color:${P.head}">${pick(lang, 'ও', 'एवं', '&')}</span>`, 'margin:0.3em 0'),
      pc(`<strong style="font-size:15pt; color:${P.head}">${esc(V(v, 'groom'))}</strong>`),
      V(v, 'groomGuard') ? pc(`<span style="font-size:10pt; color:${P.soft}">${esc(pick(lang, 'পুত্র শ্রীযুক্ত', 'पुत्र', 'Son of'))} ${esc(V(v, 'groomGuard'))}</span>`, 'margin:0.2em 0') : '',
      buildDividerHtml('flourish'),
      pc(`<span style="font-size:11.5pt"><strong>${esc(pick(lang, 'বিবাহ', 'विवाह', 'Wedding'))}:</strong> ${esc(V(v, 'date'))}</span>`, 'margin-top:0.7em'),
      V(v, 'time') ? pc(`<span style="font-size:11pt"><strong>${esc(pick(lang, 'সময়', 'समय', 'Time'))}:</strong> ${esc(V(v, 'time'))}</span>`) : '',
      V(v, 'venue') ? pc(`<span style="font-size:11pt"><strong>${esc(pick(lang, 'স্থান', 'स्थान', 'Venue'))}:</strong> ${esc(V(v, 'venue'))}</span>`) : '',
      V(v, 'note') ? pc(`<em style="font-size:10.5pt; color:${P.soft}">${esc(V(v, 'note'))}</em>`, 'margin-top:0.9em') : '',
    ].filter(Boolean).join('');
    return buildDesignBoxHtml({ variant: 'double', border: P.border, fill: 'transparent', bstyle: 'double', bwidth: 4 },
      buildDesignBoxHtml({ variant: 'box', border: P.border, fill: 'transparent', bstyle: 'solid', bwidth: 1 }, inner));
  },
};

const PROGRAM_TPL: DsTemplate = {
  id: 'program',
  category: 'event',
  name: L3('প্রোগ্রাম সূচি', 'कार्यक्रम सूची', 'Program Schedule'),
  desc: L3('সময়-পর্ব টেবিলের অনুষ্ঠান-সূচি — আয়োজক ও স্লোগানসহ।', 'कार्यक्रम सूची।', 'Time-item programme sheet.'),
  styles: ALL_STYLES,
  defaultStyle: 'wine',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('আয়োজক', 'आयोजक', 'Organiser') },
    { id: 'title', kind: 'text', wide: true, label: L3('অনুষ্ঠানের নাম', 'अनुष्ठान', 'Event name') },
    { id: 'date', kind: 'text', label: L3('তারিখ', 'तिथि', 'Date') },
    { id: 'venue', kind: 'text', wide: true, label: L3('স্থান', 'स्थान', 'Venue') },
    {
      id: 'rows', kind: 'table', wide: true, rows: 7,
      label: L3('সূচি (প্রতি সারি: সময় | পর্ব)', 'सूची (समय | पर्व)', 'Rows (time | item)'),
      ph: L3('১০:০০ | আয়োজকের স্বাগত ভাষণ\n১০:১৫ | ধর্মীয় আলোচনা\n১০:৪৫ | সাংস্কৃতিক পরিবেশনা', '…', '10:00 | Welcome speech'),
      cols: [L3('সময়', 'समय', 'Time'), L3('পর্ব', 'पर्व', 'Programme')],
    },
    { id: 'note', kind: 'text', wide: true, label: L3('স্লোগান/নোট', 'स्लोगन/नोट', 'Slogan/note') },
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'rows')).map((l) => l.split('|').map((c) => c.trim()));
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      pc(`<strong style="font-size:13.5pt">${esc(V(v, 'title'))}</strong>`, `color:${P.head}`),
      buildDividerHtml('single'),
      row2(
        `<p style="text-align:left; margin:0; font-size:10.5pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10.5pt; color:${P.soft}">${esc(V(v, 'venue') ? `${pick(lang, 'স্থান', 'स्थान', 'Venue')}: ${V(v, 'venue')}` : '')}</p>`,
      ),
      `<table><tr><th data-bg="${P.band}" style="text-align:left; width:22%">${esc(pick(lang, 'সময়', 'समय', 'Time'))}</th><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'পর্ব', 'पर्व', 'Programme'))}</th></tr>${rows.map((cells) => `<tr><td>${esc(cells[0] ?? '')}</td><td>${esc(cells[1] ?? '')}</td></tr>`).join('')}</table>`,
      V(v, 'note') ? pc(`<em style="font-size:10.5pt; color:${P.soft}">${esc(V(v, 'note'))}</em>`, 'margin-top:0.8em') : '',
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ চিকিৎসা (med) ═════════════════════════

const PRESCRIPTION_TPL: DsTemplate = {
  id: 'prescription',
  category: 'med',
  name: L3('প্রেসক্রিপশন প্যাড', 'पर्चा पैड', 'Prescription Pad'),
  desc: L3('ডাক্তার-শিরোনাম, রোগী-তথ্য, ℞-ওষুধ-তালিকা ও পরামর্শসহ ক্লিনিক-প্রথার পর্চা।', 'पर्चा पैड।', 'Clinic prescription pad.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'doctor', kind: 'text', wide: true, label: L3('ডাক্তারের নাম', 'डॉक्टर का नाम', 'Doctor\u2019s name') },
    { id: 'degrees', kind: 'text', wide: true, label: L3('ডিগ্রি', 'डिग्री', 'Degrees'), ph: L3('MBBS, BCS (Health), FCPS (Medicine)', '…', 'MBBS, FCPS') },
    { id: 'designation', kind: 'text', label: L3('পদবি/বিভাগ', 'पद/विभाग', 'Designation') },
    { id: 'bmdc', kind: 'text', label: L3('BMDC নং', 'BMDC सं.', 'BMDC no.') },
    { id: 'chamber', kind: 'textarea', rows: 2, wide: true, label: L3('চেম্বার ও সময় (প্রতি লাইনে একটি)', 'चेंबर व समय', 'Chamber & hours (one per line)'), ph: L3('তমুক ডায়াগনস্টিক, তমুক রোড — বিকেল ৫টা–রাত ৯টা', '…', 'Chamber lines') },
    { id: 'phone', kind: 'text', label: L3('মোবাইল', 'मोबाइल', 'Mobile') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'patient', kind: 'text', label: L3('রোগীর নাম', 'रोगी का नाम', 'Patient name') },
    { id: 'age', kind: 'text', label: L3('বয়স', 'उम्र', 'Age') },
    { id: 'weight', kind: 'text', label: L3('ওজন', 'वजन', 'Weight') },
    { id: 'bp', kind: 'text', label: L3('রক্তচাপ/তাপমাত্রা', 'BP/ताप', 'BP/temp') },
    { id: 'diagnosis', kind: 'textarea', wide: true, rows: 2, label: L3('রোগ-নির্ণয় / প্রধান সমস্যা', 'निदान', 'Diagnosis / chief complaint') },
    {
      id: 'meds', kind: 'table', wide: true, rows: 6,
      label: L3('ওষুধ (প্রতি সারি: নাম | মাত্রা | নিয়ম)', 'दवा (नाम | मात्रा | कैसे)', 'Medicines (name | dose | timing)'),
      ph: L3('প্যারাসিটামল ৫০০ | ১+১+১ | খাবারের পরে\nএন্টাসিড জেল | ১+১ | খাবারের আগে', '…', 'Paracetamol 500 | 1+1+1 | after meal'),
      cols: [L3('ওষুধ', 'दवा', 'Medicine'), L3('মাত্রা', 'मात्रा', 'Dose'), L3('নিয়ম', 'नियम', 'Timing')],
    },
    {
      id: 'advice', kind: 'textarea', wide: true, rows: 3,
      label: L3('পরামর্শ (প্রতি লাইনে একটি)', 'सलाह (प्रति पंक्ति एक)', 'Advice (one per line)'),
      ph: L3('প্রচুর পানি পান করুন।\n৭ দিন পর ফলো-আপ।', '…', 'Drink plenty of water…'),
    },
    { id: 'next', kind: 'text', wide: true, label: L3('পুনঃমূল্যায়ন', 'पुनः देखा जाएगा', 'Review after'), ph: L3('৭ দিন পর', '…', 'After 7 days') },
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'meds')).map((l) => l.split('|').map((c) => c.trim()));
    const advice = lines(V(v, 'advice'));
    const chamber = lines(V(v, 'chamber'));
    const docLines = [
      `<p style="margin:0.1em 0; font-size:13.5pt; text-align:left"><strong>${esc(V(v, 'doctor'))}</strong></p>`,
      V(v, 'degrees') ? `<p style="margin:0.1em 0; font-size:10pt; text-align:left; color:${P.soft}">${esc(V(v, 'degrees'))}</p>` : '',
      V(v, 'designation') ? `<p style="margin:0.1em 0; font-size:10pt; text-align:left; color:${P.soft}">${esc(V(v, 'designation'))}</p>` : '',
      V(v, 'bmdc') ? `<p style="margin:0.1em 0; font-size:9.5pt; text-align:left; color:${P.soft}">BMDC: ${esc(V(v, 'bmdc'))}</p>` : '',
    ].filter(Boolean).join('');
    const chamberLines = [
      ...chamber.map((cl) => `<p style="margin:0.1em 0; font-size:9.5pt; text-align:right">${esc(cl)}</p>`),
      V(v, 'phone') ? `<p style="margin:0.1em 0; font-size:9.5pt; text-align:right; color:${P.soft}">${esc(V(v, 'phone'))}</p>` : '',
    ].filter(Boolean).join('');
    return [
      buildDesignBoxHtml({ variant: 'shaded', border: P.border, fill: P.band, bstyle: 'solid', bwidth: 1 },
        row2(docLines, chamberLines, 62, 38)),
      row2(
        `<p style="margin:0.2em 0; font-size:10.5pt"><strong>${esc(pick(lang, 'রোগীর নাম', 'रोगी', 'Patient'))}:</strong> ${esc(V(v, 'patient'))}</p>` +
        `<p style="margin:0.2em 0; font-size:10.5pt"><strong>${esc(pick(lang, 'বয়স', 'उम्र', 'Age'))}:</strong> ${esc(V(v, 'age'))}${V(v, 'weight') ? `&nbsp;&nbsp;<strong>${esc(pick(lang, 'ওজন', 'वजन', 'Wt'))}:</strong> ${esc(V(v, 'weight'))}` : ''}</p>`,
        `<p style="margin:0.2em 0; font-size:10.5pt; text-align:right"><strong>${esc(tx(lang, DSB.date))}:</strong> ${esc(V(v, 'date'))}</p>` +
        (V(v, 'bp') ? `<p style="margin:0.2em 0; font-size:10.5pt; text-align:right"><strong>${esc(pick(lang, 'রক্তচাপ/তাপ', 'BP', 'BP/Temp'))}:</strong> ${esc(V(v, 'bp'))}</p>` : ''),
      ),
      buildDividerHtml('single'),
      pc(`<strong style="font-size:13pt; color:${P.head}; font-style:italic">℞</strong>`, 'margin-top:0.4em'),
      rows.length
        ? `<table><tr><th data-bg="${P.band}" style="text-align:left; width:52%">${esc(pick(lang, 'ওষুধ', 'दवा', 'Medicine'))}</th><th data-bg="${P.band}" style="text-align:center; width:22%">${esc(pick(lang, 'মাত্রা', 'मात्रा', 'Dose'))}</th><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'নিয়ম', 'नিয়ম', 'Timing'))}</th></tr>${rows.map((cells) => `<tr><td>${esc(cells[0] ?? '')}</td><td style="text-align:center">${esc(cells[1] ?? '')}</td><td>${esc(cells[2] ?? '')}</td></tr>`).join('')}</table>`
        : '',
      V(v, 'diagnosis') ? `<p style="font-size:10.5pt"><strong>${esc(pick(lang, 'রোগ-নির্ণয়', 'निदान', 'Diagnosis'))}:</strong> ${esc(V(v, 'diagnosis'))}</p>` : '',
      advice.length
        ? buildDesignBoxHtml({ variant: 'box', border: P.border, fill: 'transparent', bstyle: 'dashed', bwidth: 1 }, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'পরামর্শ', 'सलाह', 'Advice'))}:</strong></p><ol>${advice.map((a) => `<li>${esc(a)}</li>`).join('')}</ol>`)
        : '',
      row2(
        V(v, 'next') ? `<p style="margin:0.3em 0; font-size:10.5pt; color:${P.soft}">${esc(`${pick(lang, 'পুনঃমূল্যায়ন', 'पुनः देखा जाएगा', 'Review')}: ${V(v, 'next')}`)}</p>` : '',
        `<p style="margin:0.3em 0; font-size:10pt; text-align:right; color:${P.soft}">${esc(pick(lang, 'ডাক্তারের স্বাক্ষর', 'डॉक्टर के हस्ताक्षर', 'Doctor\u2019s signature'))}</p>`,
      ),
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ প্রচার-মাধ্যম (promo) ═════════════════════════

const POSTER_TPL: DsTemplate = {
  id: 'poster',
  category: 'promo',
  name: L3('পোস্টার', 'पोस्टर', 'Poster'),
  desc: L3('বড়-শিরোনামের ঘোষণা-পোস্টার — আয়োজন, পয়েন্ট, তারিখ-স্থান ও যোগাযোগ।', 'पोस्टर।', 'Bold announcement poster.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'kicker', kind: 'text', wide: true, label: L3('উপরের ছোট-পঙক্তি', 'ऊपरी पंक्ति', 'Kicker line'), ph: L3('সবার জন্য উন্মুক্ত', '…', 'Open for all') },
    { id: 'title', kind: 'text', wide: true, label: L3('প্রধান শিরোনাম', 'मुख्य शीर्षक', 'Main title'), ph: L3('বিনামূল্যে চিকিৎসা ক্যাম্প', '…', 'Free Medical Camp') },
    { id: 'sub', kind: 'text', wide: true, label: L3('উপ-শিরোনাম', 'उप-शीर्षक', 'Subtitle') },
    { id: 'body', kind: 'textarea', wide: true, rows: 2, label: L3('ভূমিকা-বাক্য', 'परिचय', 'Opening line') },
    { id: 'points', kind: 'textarea', wide: true, rows: 4, label: L3('বিশেষত্ব (প্রতি লাইনে একটি)', 'विशेषताएँ', 'Highlights (one per line)'), ph: L3('বিনামূল্যে রক্তের গ্রুপ পরীক্ষা\nডাক্তারি পরামর্শ', '…', 'Free blood grouping…') },
    { id: 'date', kind: 'text', label: L3('তারিখ', 'तिथि', 'Date') },
    { id: 'time', kind: 'text', label: L3('সময়', 'समय', 'Time') },
    { id: 'venue', kind: 'text', wide: true, label: L3('স্থান', 'स्थान', 'Venue') },
    { id: 'contact', kind: 'text', wide: true, label: L3('যোগাযোগ', 'संपर्क', 'Contact') },
    { id: 'office', kind: 'text', wide: true, label: L3('আয়োজক', 'आयोजक', 'Organiser') },
  ],
  build: (v, lang, P) => [
    V(v, 'kicker') ? pc(`<span style="font-size:10.5pt; letter-spacing:2px; color:${P.soft}">${esc(V(v, 'kicker'))}</span>`, 'margin-bottom:0.2em') : '',
    pc(`<strong style="font-size:20pt; letter-spacing:1px; line-height:1.35">${esc(V(v, 'title'))}</strong>`, `color:${P.head}`),
    V(v, 'sub') ? pc(`<strong style="font-size:12.5pt; color:${P.soft}">${esc(V(v, 'sub'))}</strong>`, 'margin-top:0.2em') : '',
    buildDividerHtml('stars'),
    V(v, 'body') ? `<p style="line-height:1.9; text-align:center; font-size:11.5pt">${esc(V(v, 'body'))}</p>` : '',
    lines(V(v, 'points')).length
      ? buildDesignBoxHtml({ variant: 'rounded', border: P.border, fill: P.band, bstyle: 'solid', bwidth: 1.5 }, `<ul>${lines(V(v, 'points')).map((pt) => `<li>${esc(pt)}</li>`).join('')}</ul>`)
      : '',
    pc(`<span style="font-size:12pt"><strong>${esc(pick(lang, 'তারিখ', 'तिथि', 'Date'))}:</strong> ${esc(V(v, 'date'))}${V(v, 'time') ? ` &nbsp;·&nbsp; <strong>${esc(pick(lang, 'সময়', 'समय', 'Time'))}:</strong> ${esc(V(v, 'time'))}` : ''}</span>`, 'margin-top:0.9em'),
    V(v, 'venue') ? pc(`<span style="font-size:11.5pt"><strong>${esc(pick(lang, 'স্থান', 'स्थान', 'Venue'))}:</strong> ${esc(V(v, 'venue'))}</span>`) : '',
    buildDividerHtml('single'),
    V(v, 'contact') ? pc(`<span style="font-size:11pt"><strong>${esc(pick(lang, 'যোগাযোগ', 'संपर्क', 'Contact'))}:</strong> ${esc(V(v, 'contact'))}</span>`) : '',
    V(v, 'office') ? pc(`<strong style="font-size:11pt; color:${P.soft}">${esc(V(v, 'office'))}</strong>`, 'margin-top:0.4em') : '',
  ].filter(Boolean).join(''),
};

const FLYER_TPL: DsTemplate = {
  id: 'flyer',
  category: 'promo',
  name: L3('লিফলেট (দুই-স্তম্ভ)', 'लीफलेट (दो स्तंभ)', 'Two-column Flyer'),
  desc: L3('দুই-স্তম্ভ সংবাদপত্র-ধাঁচের লিফলেট — সেবা-তালিকা ও দামসহ কমপ্যাক্ট।', 'लीफलेट।', 'Compact two-column flyer.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'प्रतिष्ठान', 'Business name') },
    { id: 'title', kind: 'text', wide: true, label: L3('শিরোনাম', 'शीर्षक', 'Headline') },
    { id: 'sub', kind: 'text', wide: true, label: L3('উপ-শিরোনাম', 'उप-शीर्षक', 'Sub-headline') },
    { id: 'col1', kind: 'textarea', wide: true, rows: 5, label: L3('বাঁ-স্তম্ভ (প্রতি লাইনে একটি পয়েন্ট)', 'बायां स्तंभ', 'Left column (one per line)'), ph: L3('হাতে-লেখা বই ছাপানো\nডিজাইন-টাইপসেটিং\nফটোকপি ও লেমিনেশন', '…', 'Service one\nService two') },
    { id: 'col2', kind: 'textarea', wide: true, rows: 5, label: L3('ডান-স্তম্ভ (প্রতি লাইনে একটি পয়েন্ট)', 'दायां स्तंभ', 'Right column (one per line)'), ph: L3('প্রশ্নপত্র ও ফরমা ছাপানো\nএক্সেল-কার্ড\nবাঁধাই', '…', 'Item one\nItem two') },
    { id: 'priceNote', kind: 'text', wide: true, label: L3('দাম-নোট', 'मूल्य नोट', 'Price note'), ph: L3('প্রতি পাতা মাত্র ৩ টাকা হইতে', '…', 'From Tk. 3 per page') },
    { id: 'contact', kind: 'text', wide: true, label: L3('ঠিকানা ও মোবাইল', 'पता व मोबाइल', 'Address & phone') },
  ],
  build: (v, lang, P) => [
    pc(`<strong style="font-size:13pt; letter-spacing:0.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
    buildDividerHtml('double'),
    pc(`<strong style="font-size:16pt">${esc(V(v, 'title'))}</strong>`, `color:${P.head}`),
    V(v, 'sub') ? pc(`<strong style="font-size:11.5pt; color:${P.soft}">${esc(V(v, 'sub'))}</strong>`, 'margin-top:0.2em') : '',
    buildColumnsHtml({ count: 2, gap: 24, rule: true, fill: 'balance' }, `<ul>${lines(V(v, 'col1')).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`),
    buildColumnsHtml({ count: 2, gap: 24, rule: true, fill: 'balance' }, `<ul>${lines(V(v, 'col2')).map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`),
    V(v, 'priceNote') ? pc(`<strong style="font-size:11.5pt; color:${P.head}">${esc(V(v, 'priceNote'))}</strong>`, 'margin-top:0.7em') : '',
    buildDividerHtml('single'),
    V(v, 'contact') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'contact'))}</span>`) : '',
  ].filter(Boolean).join(''),
};

// ═════════════════════════ সাঝা ক্যারিয়ার/প্রতিষ্ঠান-সাজ সহায়ক ═════════════════════════

/** রেজিউমে/মিনিটস-সেকশন শিরোনাম — লেটার-স্পেসড ছোট-ক্যাপ + নিচের রুল */
function secH(t: string, P: DsPalette): string {
  return `<h3 style="margin:1.1em 0 0.35em; font-size:10.5pt; letter-spacing:1.6px; color:${P.head}; border-bottom:1.5px solid ${P.border}; padding-bottom:2px">${esc(t)}</h3>`;
}

/** সাইডবার-বক্সের ছোট শিরোনাম */
function miniH(t: string, P: DsPalette): string {
  return `<p style="margin:0.9em 0 0.25em; font-size:9.5pt; letter-spacing:1.4px; color:${P.head}; border-bottom:1px solid ${P.border}; padding-bottom:2px"><strong>${esc(t)}</strong></p>`;
}

/** শেডেড তথ্য-বক্স */
function shadeBox(P: DsPalette, inner: string): string {
  return buildDesignBoxHtml({ variant: 'shaded', border: P.border, fill: P.band, bstyle: 'solid', bwidth: 1 }, inner);
}

/** অভিজ্ঞতা/শিক্ষা-এন্ট্রি — বাঁ: পদবি-প্রতিষ্ঠান, ডান: সময়কাল; নিচে বিবরণ */
function entryRow(P: DsPalette, leftBold: string, leftSoft: string, right: string, detail: string): string {
  return [
    row2(
      `<p style="text-align:left; margin:0.55em 0 0; font-size:11pt"><strong>${esc(leftBold)}</strong>${leftSoft ? `<span style="color:${P.soft}"> — ${esc(leftSoft)}</span>` : ''}</p>`,
      `<p style="text-align:right; margin:0.6em 0 0; font-size:9.5pt; color:${P.soft}">${esc(right)}</p>`,
    ),
    detail ? `<p style="margin:0.15em 0 0; font-size:10.5pt; line-height:1.75; text-align:justify">${esc(detail)}</p>` : '',
  ].join('');
}

/** লেবেল-মান সারি (চুক্তি/সার্টিফিকেটের মেটা-টেবিল) */
function metaRow(label: string, val: string): string {
  return `<p style="margin:0.25em 0; font-size:11pt"><strong>${esc(label)}:</strong> ${esc(val || '—')}</p>`;
}

// ═════════════════════════ চাকরি ও ক্যারিয়ার (career) ═════════════════════════

/** রেজিউমে-অভিজ্ঞতা সারি: পদবি | প্রতিষ্ঠান | সময়কাল | কাজ */
const RESUME_EXP_COLS = [
  L3('পদবি', 'पद', 'Role'),
  L3('প্রতিষ্ঠান', 'संस्था', 'Company'),
  L3('সময়কাল', 'अवधि', 'Period'),
  L3('মূল কাজ', 'मुख्य कार्य', 'Key work'),
];

/** রেজিউমে-শিক্ষা সারি: ডিগ্রি | প্রতিষ্ঠান | বছর */
const RESUME_EDU_COLS = [
  L3('ডিগ্রি', 'डिग्री', 'Degree'),
  L3('প্রতিষ্ঠান', 'संस्था', 'Institution'),
  L3('বছর', 'वर्ष', 'Year'),
];

const RESUME_MODERN_TPL: DsTemplate = {
  id: 'resume-modern',
  category: 'career',
  name: L3('আধুনিক রেজিউমে', 'आधुनिक रिज़्यूमे', 'Modern Resume'),
  desc: L3('দুই-স্তম্ভ সমসাময়িক রেজিউমে — বাঁ-পাশে অভিজ্ঞতা-শিক্ষা, ডানে যোগাযোগ-দক্ষতা-ভাষা।', 'दो-स्तंभ रिज़्यूमे।', 'Two-column resume with sidebar.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'name', kind: 'text', wide: true, label: L3('পূর্ণ নাম', 'पूरा नाम', 'Full name') },
    { id: 'headline', kind: 'text', wide: true, label: L3('পদবি/পেশা-শিরোনাম', 'पद/पेशा', 'Professional title'), ph: L3('সিনিয়র সফটওয়্যার ইঞ্জিনিয়ার', 'वरिष्ठ सॉफ्टवेयर इंजीनियर', 'Senior Software Engineer') },
    { id: 'phone', kind: 'text', label: L3('মোবাইল', 'मोबाइल', 'Phone') },
    { id: 'email', kind: 'text', label: L3('ইমেইল', 'ईमेल', 'Email') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা (শহর, দেশ)', 'पता (शहर, देश)', 'Location (city, country)') },
    { id: 'website', kind: 'text', wide: true, label: L3('লিঙ্কডইন/পোর্টফোলিও (ঐচ্ছিক)', 'लिंक्डइन/पोर्टफोलियो', 'LinkedIn/portfolio (optional)') },
    { id: 'summary', kind: 'textarea', wide: true, rows: 4, label: L3('প্রোফাইল সারসংক্ষেপ', 'प्रोफ़ाइल सारांश', 'Profile summary'), ph: L3('৮ বছরের অভিজ্ঞতাসম্পন্ন…', '8 वर्ष का अनुभव…', 'Engineer with 8 years of…') },
    {
      id: 'expRows', kind: 'table', wide: true, rows: 4,
      label: L3('অভিজ্ঞতা (প্রতি সারি: পদবি | প্রতিষ্ঠান | সময়কাল | মূল কাজ)', 'अनुभव (पद | संस्था | अवधि | कार्य)', 'Experience (role | company | period | key work)'),
      ph: L3('সিনিয়র ইঞ্জিনিয়ার | টমুক টেক | ২০২১–বর্তমান | পেমেন্ট-প্ল্যাটফর্মের নেতৃত্ব\nইঞ্জিনিয়ার | টমুক সফট | ২০১৮–২০২১ | ওয়েব-অ্যাপ ডেভেলপমেন্ট', '…', 'Senior Engineer | Tech Co | 2021–now | Led payments'),
      cols: RESUME_EXP_COLS,
    },
    {
      id: 'eduRows', kind: 'table', wide: true, rows: 3,
      label: L3('শিক্ষা (প্রতি সারি: ডিগ্রি | প্রতিষ্ঠান | বছর)', 'शिक्षा (डिग्री | संस्था | वर्ष)', 'Education (degree | institution | year)'),
      ph: L3('বিএসসি কম্পিউটার সায়েন্স | টমুক বিশ্ববিদ্যালয় | ২০১৮', '…', 'BSc Computer Science | University | 2018'),
      cols: RESUME_EDU_COLS,
    },
    { id: 'skills', kind: 'textarea', wide: true, rows: 4, label: L3('দক্ষতা (প্রতি লাইনে একটি)', 'कौशल (प्रति पंक्ति)', 'Skills (one per line)'), ph: L3('TypeScript, React, Node.js\nপ্রজেক্ট ম্যানেজমেন্ট\nদল-নেতৃত্ব', '…', 'TypeScript, React\nProject management') },
    { id: 'languages', kind: 'textarea', wide: true, rows: 2, label: L3('ভাষা (প্রতি লাইনে একটি)', 'भाषाएँ (प्रति पंक्ति)', 'Languages (one per line)'), ph: L3('বাংলা — মাতৃভাষা\nইংরেজি — সাবলীল', '…', 'English — Fluent') },
    { id: 'extras', kind: 'textarea', wide: true, rows: 2, label: L3('পুরস্কার/সার্টিফিকেট (ঐচ্ছিক, প্রতি লাইনে একটি)', 'पुरस्कार/प्रमाणपत्र', 'Awards/certifications (one per line)') },
  ],
  build: (v, lang, P) => {
    const exp = lines(V(v, 'expRows')).map((l) => l.split('|').map((c) => c.trim()));
    const edu = lines(V(v, 'eduRows')).map((l) => l.split('|').map((c) => c.trim()));
    const contact = [V(v, 'phone'), V(v, 'email'), V(v, 'address'), V(v, 'website')].filter(Boolean).join('  ·  ');
    const main = [
      V(v, 'summary') ? secH(pick(lang, 'প্রোফাইল', 'प्रोफ़ाइल', 'PROFILE'), P) + `<p style="margin:0.2em 0; font-size:10.5pt; line-height:1.8; text-align:justify">${esc(V(v, 'summary'))}</p>` : '',
      exp.length ? secH(pick(lang, 'অভিজ্ঞতা', 'अनुभव', 'EXPERIENCE'), P) + exp.map((c) => entryRow(P, c[0] ?? '', c[1] ?? '', c[2] ?? '', c[3] ?? '')).join('') : '',
      edu.length ? secH(pick(lang, 'শিক্ষা', 'शिक्षा', 'EDUCATION'), P) + edu.map((c) => entryRow(P, c[0] ?? '', c[1] ?? '', c[2] ?? '', '')).join('') : '',
    ].join('');
    const side = [
      shadeBox(P, [
        miniH(pick(lang, 'যোগাযোগ', 'संपर्क', 'CONTACT'), P),
        [V(v, 'phone'), V(v, 'email'), V(v, 'address'), V(v, 'website')].filter(Boolean).map((c) => `<p style="margin:0.2em 0; font-size:9.5pt; line-height:1.5">${esc(c)}</p>`).join(''),
      ].join('')),
      lines(V(v, 'skills')).length
        ? miniH(pick(lang, 'দক্ষতা', 'कौशल', 'SKILLS'), P) + `<ul style="margin:0.2em 0 0">${lines(V(v, 'skills')).map((s) => `<li style="font-size:10pt">${esc(s)}</li>`).join('')}</ul>`
        : '',
      lines(V(v, 'languages')).length
        ? miniH(pick(lang, 'ভাষা', 'भाषाएँ', 'LANGUAGES'), P) + `<ul style="margin:0.2em 0 0">${lines(V(v, 'languages')).map((s) => `<li style="font-size:10pt">${esc(s)}</li>`).join('')}</ul>`
        : '',
      lines(V(v, 'extras')).length
        ? miniH(pick(lang, 'পুরস্কার', 'पुरस्कार', 'AWARDS'), P) + `<ul style="margin:0.2em 0 0">${lines(V(v, 'extras')).map((s) => `<li style="font-size:10pt">${esc(s)}</li>`).join('')}</ul>`
        : '',
    ].join('');
    return [
      `<p style="margin:0.1em 0; font-size:19pt; line-height:1.3"><strong style="color:${P.head}">${esc(V(v, 'name'))}</strong></p>`,
      V(v, 'headline') ? `<p style="margin:0; font-size:12pt; letter-spacing:0.6px; color:${P.soft}">${esc(V(v, 'headline'))}</p>` : '',
      contact ? `<p style="margin:0.45em 0 0.2em; font-size:9.5pt; color:${P.soft}">${esc(contact)}</p>` : '',
      buildDividerHtml('double'),
      row2(main, side, 66, 34),
    ].join('');
  },
};

const RESUME_CLASSIC_TPL: DsTemplate = {
  id: 'resume-classic',
  category: 'career',
  name: L3('ক্লাসিক সিভি', 'क्लासिक सीवी', 'Classic CV'),
  desc: L3('ঐতিহ্যবাহী এক-স্তম্ভ সিভি — কেন্দ্র-শিরোনাম, ধারাবাহিক সেকশন, সাদৃশ্য-বান্ধব বিন্যাস।', 'पारंपरिक सीवी।', 'Traditional single-column CV.'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'name', kind: 'text', wide: true, label: L3('পূর্ণ নাম', 'पूरा नाम', 'Full name') },
    { id: 'headline', kind: 'text', wide: true, label: L3('পদবি/পেশা-শিরোনাম', 'पद/पेशা', 'Professional title') },
    { id: 'contactLine', kind: 'text', wide: true, label: L3('যোগাযোগ (এক পঙক্তিতে)', 'संपर्क (एक पंक्ति)', 'Contact (single line)'), ph: L3('মোবাইল · ইমেইল · শহর', '…', 'Phone · Email · City') },
    { id: 'summary', kind: 'textarea', wide: true, rows: 4, label: L3('উদ্দেশ্য/সারসংক্ষেপ', 'उद्देश्य/सारांश', 'Objective / summary') },
    {
      id: 'expRows', kind: 'table', wide: true, rows: 4,
      label: L3('অভিজ্ঞতা (প্রতি সারি: পদবি | প্রতিষ্ঠান | সময়কাল | মূল কাজ)', 'अनुभव (पद | संस्था | अवधि | कार्य)', 'Experience (role | company | period | key work)'),
      ph: L3('শিক্ষক | টমুক কলেজ | ২০২০–বর্তমান | পদার্থবিজ্ঞান পাঠদান', '…', 'Teacher | College | 2020–now | Physics'),
      cols: RESUME_EXP_COLS,
    },
    {
      id: 'eduRows', kind: 'table', wide: true, rows: 3,
      label: L3('শিক্ষা (প্রতি সারি: ডিগ্রি | প্রতিষ্ঠান | বছর)', 'शिक्षा (डिग्री | संस्था | वर्ष)', 'Education (degree | institution | year)'),
      cols: RESUME_EDU_COLS,
    },
    { id: 'skills', kind: 'textarea', wide: true, rows: 3, label: L3('দক্ষতা (প্রতি লাইনে একটি)', 'कौशल (प्रति पंক्तি)', 'Skills (one per line)') },
    { id: 'refsNote', kind: 'text', wide: true, label: L3('রেফারেন্স-নোট', 'संदर्भ नोट', 'References note'), ph: L3('চাহিবামাত্র প্রাপ্য', 'मांग पर उपलब्ध', 'Available upon request') },
  ],
  build: (v, lang, P) => {
    const exp = lines(V(v, 'expRows')).map((l) => l.split('|').map((c) => c.trim()));
    const edu = lines(V(v, 'eduRows')).map((l) => l.split('|').map((c) => c.trim()));
    return [
      pc(`<strong style="font-size:17pt; letter-spacing:0.8px">${esc(V(v, 'name'))}</strong>`, `color:${P.head}`),
      V(v, 'headline') ? pc(`<span style="font-size:11.5pt; color:${P.soft}">${esc(V(v, 'headline'))}</span>`) : '',
      V(v, 'contactLine') ? pc(`<span style="font-size:9.5pt; color:${P.soft}">${esc(V(v, 'contactLine'))}</span>`, 'margin-top:0.3em') : '',
      pc(`<span style="font-size:9.5pt; color:${P.border}">❖</span>`, 'margin-top:0.15em'),
      buildDividerHtml('double'),
      V(v, 'summary') ? secH(pick(lang, 'উদ্দেশ্য', 'उद्देश্য', 'OBJECTIVE'), P) + `<p style="margin:0.2em 0; font-size:10.5pt; line-height:1.8; text-align:justify">${esc(V(v, 'summary'))}</p>` : '',
      exp.length ? secH(pick(lang, 'অভিজ্ঞতা', 'अनुभव', 'EXPERIENCE'), P) + exp.map((c) => entryRow(P, c[0] ?? '', c[1] ?? '', c[2] ?? '', c[3] ?? '')).join('') : '',
      edu.length ? secH(pick(lang, 'শিক্ষা', 'शिक्षा', 'EDUCATION'), P) + edu.map((c) => entryRow(P, c[0] ?? '', c[1] ?? '', c[2] ?? '', '')).join('') : '',
      lines(V(v, 'skills')).length ? secH(pick(lang, 'দক্ষতা', 'कौशल', 'SKILLS'), P) + `<ul>${lines(V(v, 'skills')).map((s) => `<li>${esc(s)}</li>`).join('')}</ul>` : '',
      V(v, 'refsNote') ? secH(pick(lang, 'রেফারেন্স', 'संदर्भ', 'REFERENCES'), P) + `<p style="margin:0.2em 0; font-size:10.5pt">${esc(V(v, 'refsNote'))}</p>` : '',
    ].filter(Boolean).join('');
  },
};

const COVER_LETTER_TPL: DsTemplate = {
  id: 'resume-cover',
  category: 'career',
  name: L3('কভার লেটার', 'कवर लेटर', 'Cover Letter'),
  desc: L3('চাকরির আবেদনের সঙ্গী-পত্র — প্রেরক-প্রাপক-ব্লক, পদ-উল্লেখ ও তিন-অনুচ্ছেদ বক্তব্য।', 'कवर लेटर।', 'Job application cover letter.'),
  styles: ALL_STYLES,
  defaultStyle: 'espresso',
  fields: [
    { id: 'name', kind: 'text', wide: true, label: L3('আপনার নাম', 'आपका नाम', 'Your name') },
    { id: 'addressLines', kind: 'textarea', rows: 2, label: L3('ঠিকানা (প্রতি লাইনে একটি)', 'पता (प्रति पंक्ति)', 'Address (one per line)') },
    { id: 'phoneEmail', kind: 'text', wide: true, label: L3('মোবাইল · ইমেইল', 'मोबाइल · ईमेल', 'Phone · email') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'recipient', kind: 'text', wide: true, label: L3('প্রাপক (নাম/পদবি)', 'प्रापक (नाम/पद)', 'Recipient (name/title)'), ph: L3('নিয়োগ ব্যবস্থাপক', 'हायरिंग मैनेजर', 'Hiring Manager') },
    { id: 'company', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Company name') },
    { id: 'companyAddress', kind: 'textarea', rows: 2, wide: true, label: L3('প্রতিষ্ঠানের ঠিকানা (ঐচ্ছিক)', 'संस्था का पता', 'Company address (optional)') },
    { id: 'position', kind: 'text', wide: true, label: L3('যে পদে আবেদন', 'किस पद के लिए', 'Position applied for') },
    { id: 'opening', kind: 'textarea', wide: true, rows: 3, label: L3('প্রথম অনুচ্ছেদ — পদ ও সূত্র', 'पहला अनुच्छेद', 'Opening paragraph — role & source'), ph: L3('…-এ প্রকাশিত বিজ্ঞাপন দেখে আমি আবেদন করছি…', '…', 'I am writing to apply for…') },
    { id: 'body', kind: 'textarea', wide: true, rows: 5, label: L3('মূল অনুচ্ছেদ — যোগ্যতা ও মিল', 'मुख्य अनुच्छेद', 'Main paragraph — fit & qualifications') },
    { id: 'closing', kind: 'textarea', wide: true, rows: 2, label: L3('শেষ অনুচ্ছেদ — সাক্ষাৎকার-প্রার্থনা', 'अंतिम अनुच्छेद', 'Closing paragraph — interview request') },
  ],
  build: (v, lang, P) => {
    const addr = lines(V(v, 'addressLines')).map((l) => `<p style="margin:0.05em 0; font-size:10.5pt; line-height:1.5">${esc(l)}</p>`).join('');
    const coAddr = lines(V(v, 'companyAddress'));
    return [
      `<p style="margin:0.1em 0; font-size:13pt"><strong>${esc(V(v, 'name'))}</strong></p>`,
      addr,
      V(v, 'phoneEmail') ? `<p style="margin:0.15em 0 0; font-size:9.5pt; color:${P.soft}">${esc(V(v, 'phoneEmail'))}</p>` : '',
      `<p style="text-align:right; margin-top:1.1em; font-size:10.5pt; color:${P.soft}">${esc(V(v, 'date'))}</p>`,
      `<p style="margin-top:0.9em; margin-bottom:0"><strong>${esc(V(v, 'recipient'))}</strong></p>`,
      V(v, 'company') ? `<p style="margin:0.05em 0; font-size:11pt">${esc(V(v, 'company'))}</p>` : '',
      coAddr.map((l) => `<p style="margin:0.05em 0; font-size:10pt; line-height:1.5">${esc(l)}</p>`).join(''),
      V(v, 'position')
        ? `<p style="margin-top:0.9em; font-size:11pt"><strong>${esc(pick(lang, 'বিষয়: পদে আবেদন —', 'विषय: आवेदन —', 'Re: Application for'))} ${esc(V(v, 'position'))}</strong></p>`
        : '',
      `<p style="margin-top:0.9em">${esc(pick(lang, 'জনাব/মহোদয়া,', 'महोदय/महोदया,', 'Dear Sir/Madam,'))}</p>`,
      `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'opening'))}</p>`,
      `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'body'))}</p>`,
      `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'closing'))}</p>`,
      `<p style="text-align:right; margin-top:1.3em; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'বিনীত', 'सादर', 'Sincerely'))}</p>`,
      `<p style="text-align:right; margin:0.3em 0 0; font-size:11pt"><strong>${esc(V(v, 'name'))}</strong></p>`,
    ].filter(Boolean).join('');
  },
};

const RECOMMENDATION_TPL: DsTemplate = {
  id: 'letter-recommendation',
  category: 'career',
  name: L3('সুপারিশপত্র', 'सिफारिश पत्र', 'Recommendation Letter'),
  desc: L3('শিক্ষক/বসের সুপারিশ-পত্র — সম্পর্ক, গুণাবলি ও দৃঢ়-সুপারিশের ধাঁচ।', 'सिफारिश पत्र।', 'Reference letter from mentor.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Institution / company') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'candidate', kind: 'text', wide: true, label: L3('যাঁর জন্য সুপারিশ', 'किसके लिए', 'Candidate name') },
    { id: 'relation', kind: 'textarea', wide: true, rows: 3, label: L3('আপনার সম্পর্ক ও পরিচিতির সময়কাল', 'संबंध व अवधि', 'Relationship & duration'), ph: L3('গত তিন বছর তাঁর শ্রেণি-শিক্ষক হিসাবে…', '…', 'As his/her teacher for three years…') },
    { id: 'qualities', kind: 'textarea', wide: true, rows: 4, label: L3('গুণাবলি ও কৃতিত্ব (প্রতি লাইনে একটি)', 'गुण (प्रति पंक्ति)', 'Qualities & achievements (one per line)') },
    { id: 'closer', kind: 'textarea', wide: true, rows: 3, label: L3('দৃঢ়-সুপারিশের বাক্য', 'अंतिम अनुच्छेद', 'Strong closing recommendation') },
    { id: 'sign1Name', kind: 'text', label: L3('সুপারিশকারীর নাম', 'सिफारिशकर্তा', 'Recommender name') },
    { id: 'sign1Title', kind: 'text', label: L3('পদবি', 'पद', 'Title') },
    { id: 'contact', kind: 'text', wide: true, label: L3('যোগাযোগ (ঐচ্ছিক)', 'संपर्क (वैकल्पিক)', 'Contact (optional)') },
  ],
  build: (v, lang, P) => {
    const quals = lines(V(v, 'qualities'));
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      buildDividerHtml('double'),
      `<p style="text-align:right; margin-top:0.6em; font-size:10.5pt; color:${P.soft}">${esc(V(v, 'date'))}</p>`,
      pc(`<strong style="font-size:11pt; letter-spacing:1px">${esc(pick(lang, 'যাঁকে এ সংক্রান্তে সংশ্লিষ্ট', 'जिसे यह संबंधित है', 'TO WHOM IT MAY CONCERN'))}</strong>`, 'margin-top:0.6em'),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(V(v, 'relation'))}</p>`,
      quals.length ? `<ul>${quals.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` : '',
      `<p style="margin-top:0.5em; line-height:1.95; text-align:justify">${esc(V(v, 'closer'))}</p>`,
      `<p style="text-align:right; margin-top:1.2em; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'বিশ্বাসভাজন', 'सादर', 'Yours sincerely'))}</p>`,
      `<p style="text-align:right; margin:0.3em 0 0; font-size:11pt"><strong>${esc(V(v, 'sign1Name'))}</strong></p>`,
      V(v, 'sign1Title') ? `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'sign1Title'))}</p>` : '',
      V(v, 'contact') ? `<p style="text-align:right; margin:0; font-size:9.5pt; color:${P.soft}">${esc(V(v, 'contact'))}</p>` : '',
    ].filter(Boolean).join('');
  },
};

const RESIGNATION_TPL: DsTemplate = {
  id: 'letter-resignation',
  category: 'career',
  name: L3('পদত্যাগপত্র', 'त्यागपत्र', 'Resignation Letter'),
  desc: L3('আনুষ্ঠানিক পদত্যাগ — নোটিশ, শেষ কার্যদিবস, কৃতজ্ঞতা ও হস্তান্তর-প্রতিশ্রুতি।', 'त्यागपत्र।', 'Formal resignation with notice.'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'name', kind: 'text', wide: true, label: L3('আপনার নাম', 'आपका नाम', 'Your name') },
    { id: 'position', kind: 'text', wide: true, label: L3('বর্তমান পদবি', 'वर्तमान पद', 'Current position') },
    { id: 'department', kind: 'text', wide: true, label: L3('বিভাগ (ঐচ্ছিক)', 'विभाग (वैकल्पिक)', 'Department (optional)') },
    { id: 'company', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Company name') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'recipient', kind: 'text', wide: true, label: L3('প্রাপক (নাম ও পদবি)', 'प्रापक (नाम व पद)', 'Recipient (name & title)') },
    { id: 'lastDay', kind: 'text', wide: true, label: L3('শেষ কার্যদিবস', 'अंतिम कार्य दिवस', 'Last working day') },
    { id: 'notice', kind: 'textarea', wide: true, rows: 3, label: L3('নোটিশ-অনুচ্ছেদ', 'नोटिस अनुच्छेद', 'Notice paragraph'), ph: L3('…নোটিশ মেনে পদত্যাগের অভিপ্রায়…', '…', 'I hereby resign from my position…') },
    { id: 'gratitude', kind: 'textarea', wide: true, rows: 3, label: L3('কৃতজ্ঞতা ও হস্তান্তর-প্রতিশ্রুতি', 'कृतज्ञता', 'Gratitude & handover commitment') },
  ],
  build: (v, lang, P) => [
    `<p style="margin:0.1em 0; font-size:12.5pt"><strong>${esc(V(v, 'name'))}</strong></p>`,
    V(v, 'position') ? `<p style="margin:0.05em 0; font-size:10.5pt">${esc(V(v, 'position'))}${V(v, 'department') ? `, ${esc(V(v, 'department'))}` : ''}</p>` : '',
    `<p style="text-align:right; margin-top:1em; font-size:10.5pt; color:${P.soft}">${esc(V(v, 'date'))}</p>`,
    `<p style="margin-top:0.8em; margin-bottom:0"><strong>${esc(V(v, 'recipient'))}</strong></p>`,
    V(v, 'company') ? `<p style="margin:0.05em 0; font-size:11pt">${esc(V(v, 'company'))}</p>` : '',
    V(v, 'position')
      ? `<p style="margin-top:0.9em; font-size:11pt"><strong>${esc(pick(lang, 'বিষয়: পদত্যাগ —', 'विषय: त्यागपत्र —', 'Re: Resignation from the post of'))} ${esc(V(v, 'position'))}</strong></p>`
      : '',
    `<p style="margin-top:0.9em">${esc(pick(lang, 'জনাব/মহোদয়া,', 'महोदय/महोदया,', 'Dear Sir/Madam,'))}</p>`,
    `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'notice'))}${V(v, 'lastDay') ? ` ${esc(pick(lang, 'আমার শেষ কার্যদিবস হইবে', 'मेरा अंतिम कार्य दिवस होगा', 'My last working day will be'))} <strong>${esc(V(v, 'lastDay'))}</strong>${pick(lang, '।', '।', '.')}` : ''}</p>`,
    `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'gratitude'))}</p>`,
    `<p style="text-align:right; margin-top:1.2em; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'বিনীত', 'सादर', 'Sincerely'))}</p>`,
    `<p style="text-align:right; margin:0.3em 0 0; font-size:11pt"><strong>${esc(V(v, 'name'))}</strong></p>`,
  ].filter(Boolean).join(''),
};

// ═════════════════════════ ব্যবসা ও অফিস — নতুন (office) ═════════════════════════

const LETTERHEAD_TPL: DsTemplate = {
  id: 'letterhead',
  category: 'office',
  name: L3('লেটারহেড', 'लेटरहेड', 'Letterhead'),
  desc: L3('প্রতিষ্ঠানের মাস্টহেড-চিঠির কাগজ — নাম, ট্যাগলাইন, যোগাযোগ-পটি ও লেখা-জায়গা।', 'लेटरहेड।', 'Branded letterhead with contact strip.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'name', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था का नाम', 'Organization name') },
    { id: 'tagline', kind: 'text', wide: true, label: L3('ট্যাগলাইন (ঐচ্ছিক)', 'टैगलाइन (वैकल्पिक)', 'Tagline (optional)') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'phone', kind: 'text', label: L3('ফোন', 'फ़ोन', 'Phone') },
    { id: 'email', kind: 'text', label: L3('ইমেইল', 'ईमेल', 'Email') },
    { id: 'website', kind: 'text', wide: true, label: L3('ওয়েবসাইট', 'वेबसाइट', 'Website') },
    { id: 'regNo', kind: 'text', wide: true, label: L3('নিবন্ধন নং (ঐচ্ছিক)', 'पंजीकरण सं. (वैकल्पिक)', 'Registration no. (optional)') },
  ],
  build: (v, lang, P) => {
    const contacts = [V(v, 'address'), V(v, 'phone'), V(v, 'email'), V(v, 'website')].filter(Boolean);
    return [
      pc(`<strong style="font-size:16pt; letter-spacing:1.2px">${esc(V(v, 'name'))}</strong>`, `color:${P.head}`),
      V(v, 'tagline') ? pc(`<em style="font-size:10.5pt; color:${P.soft}">${esc(V(v, 'tagline'))}</em>`, 'margin-top:0.15em') : '',
      pc(`<span style="font-size:16pt; color:${P.border}">❖</span>`, 'margin-top:0.4em'),
      pc(`<span style="font-size:9.5pt; color:${P.soft}">${contacts.map((c) => esc(c)).join('  ·  ')}</span>`),
      buildDividerHtml('double'),
      '<p style="margin-top:0.4em"></p>',
      '<p style="margin-top:1.6em"></p>',
      '<p style="margin-top:1.6em"></p>',
      '<p style="margin-top:1.6em"></p>',
      '<p style="margin-top:1.6em"></p>',
      '<p style="margin-top:1.6em"></p>',
      buildDividerHtml('single'),
      V(v, 'regNo') ? pc(`<span style="font-size:9pt; color:${P.soft}">${esc(V(v, 'regNo'))}</span>`, 'margin-top:0.3em') : '',
    ].filter(Boolean).join('');
  },
};

const MEMO_TPL: DsTemplate = {
  id: 'memo',
  category: 'office',
  name: L3('মেমোর‍্যান্ডাম', 'ज्ञापन', 'Memorandum'),
  desc: L3('TO-FROM-DATE-RE গ্রিডের অভ্যন্তরীণ স্মারক-পত্র — সংক্ষিপ্ত ও সরাসরি।', 'ज्ञापन।', 'Internal memo with header grid.'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান/বিভাগ', 'संस्था/विभाग', 'Organization / department') },
    { id: 'to', kind: 'text', wide: true, label: L3('প্রাপক (TO)', 'प्रापक (TO)', 'To') },
    { id: 'from', kind: 'text', wide: true, label: L3('প্রেরক (FROM)', 'प्रेषक (FROM)', 'From') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'subject', kind: 'text', wide: true, label: L3('বিষয় (RE)', 'विषय (RE)', 'Subject (RE)') },
    { id: 'body', kind: 'textarea', wide: true, rows: 6, label: L3('মূল বক্তব্য', 'मुख्य विषय', 'Body') },
    { id: 'sign1Name', kind: 'text', label: L3('প্রেরকের নাম', 'प्रेषक का नाम', 'Sender name') },
  ],
  build: (v, lang, P) => {
    const mRow = (label: string, val: string) =>
      `<tr><td data-border="none" style="border:none; width:16%; vertical-align:top"><p style="margin:0.3em 0; font-size:10.5pt; letter-spacing:1px"><strong>${esc(label)}</strong></p></td><td data-border="none" style="border:none; vertical-align:top"><p style="margin:0.3em 0; font-size:11pt">${esc(val || '—')}</p></td></tr>`;
    return [
      pc(`<strong style="font-size:11pt; letter-spacing:0.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      band(pick(lang, 'মেমোর‍্যান্ডাম', 'ज्ञापन', 'MEMORANDUM'), P),
      `<table style="width:100%">${mRow(pick(lang, 'প্রতি', 'सेवा में', 'TO'), V(v, 'to'))}${mRow(pick(lang, 'প্রেরক', 'प्रेषक', 'FROM'), V(v, 'from'))}${mRow(tx(lang, DSB.date), V(v, 'date'))}${mRow(pick(lang, 'বিষয়', 'विषय', 'RE'), V(v, 'subject'))}</table>`,
      buildDividerHtml('single'),
      `<p style="margin-top:0.8em; line-height:1.95; text-align:justify">${esc(V(v, 'body'))}</p>`,
      `<p style="text-align:right; margin-top:1.3em; font-size:10.5pt"><strong>${esc(V(v, 'sign1Name'))}</strong></p>`,
    ].filter(Boolean).join('');
  },
};

const MEETING_AGENDA_TPL: DsTemplate = {
  id: 'meeting-agenda',
  category: 'office',
  name: L3('সভার আলোচ্যসূচি', 'बैठक की कार्यसूची', 'Meeting Agenda'),
  desc: L3('তারিখ-স্থান-সভাপতি গ্রিডসহ আলোচ্যসূচি — ধারাবাহিক বিষয়-তালিকা।', 'कार्यसूची।', 'Structured meeting agenda.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান', 'संस्था', 'Organization') },
    { id: 'meetingTitle', kind: 'text', wide: true, label: L3('সভার নাম', 'बैठक का नाम', 'Meeting title') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'time', kind: 'text', label: L3('সময়', 'समय', 'Time') },
    { id: 'venue', kind: 'text', wide: true, label: L3('স্থান', 'स्थान', 'Venue') },
    { id: 'chair', kind: 'text', wide: true, label: L3('সভাপতি', 'अध्यक्ष', 'Chairperson') },
    { id: 'items', kind: 'textarea', wide: true, rows: 6, label: L3('আলোচ্য বিষয় (প্রতি লাইনে একটি)', 'विषय (प्रति पंक्ति)', 'Agenda items (one per line)'), ph: L3('শুভেচ্ছা ও স্বাগত\nপূর্ববর্তী সভার কার্যবিবরণী অনুমোদন\nনতুন এজেন্ডা আলোচনা', '…', 'Welcome\nMinutes approval') },
    { id: 'note', kind: 'text', wide: true, label: L3('নোট (ঐচ্ছিক)', 'नोट', 'Note (optional)') },
  ],
  build: (v, lang, P) => [
    pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
    pc(`<strong style="font-size:13.5pt">${esc(V(v, 'meetingTitle'))}</strong>`, `color:${P.head}`),
    buildDividerHtml('single'),
    row2(
      `<p style="text-align:left; margin:0; font-size:10.5pt">${esc([V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '', V(v, 'time') ? `${pick(lang, 'সময়', 'समय', 'Time')}: ${V(v, 'time')}` : ''].filter(Boolean).join('   '))}</p>`,
      `<p style="text-align:right; margin:0; font-size:10.5pt">${esc(V(v, 'venue') ? `${pick(lang, 'স্থান', 'स्थान', 'Venue')}: ${V(v, 'venue')}` : '')}</p>`,
    ),
    band(pick(lang, 'আলোচ্যসূচি', 'कार्यसूची', 'AGENDA'), P),
    `<ol style="margin-top:0.8em">${lines(V(v, 'items')).map((it) => `<li>${esc(it)}</li>`).join('')}</ol>`,
    V(v, 'chair')
      ? `<p style="margin-top:1.2em; font-size:10.5pt">${esc(pick(lang, 'সভাপতিত্বে', 'अध्यक्षता में', 'Chairing'))}: <strong>${esc(V(v, 'chair'))}</strong></p>`
      : '',
    V(v, 'note') ? `<p style="margin-top:0.6em; font-size:10pt; color:${P.soft}">${esc(V(v, 'note'))}</p>` : '',
  ].filter(Boolean).join(''),
};

const MEETING_MINUTES_TPL: DsTemplate = {
  id: 'meeting-minutes',
  category: 'office',
  name: L3('সভার কার্যবিবরণী', 'बैठक का कार्यवृत्त', 'Meeting Minutes'),
  desc: L3('উপস্থিতি-আলোচনা-সিদ্ধান্ত ও কর্ম-তালিকার পূর্ণাঙ্গ কার্যবিবরণী — সভাপতি ও সচিবের স্বাক্ষর।', 'कार्यवृत्त।', 'Minutes with action items.'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান', 'संस्था', 'Organization') },
    { id: 'meetingTitle', kind: 'text', wide: true, label: L3('সভার নাম', 'बैठক का नाम', 'Meeting title') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'venue', kind: 'text', wide: true, label: L3('স্থান', 'स्थान', 'Venue') },
    { id: 'attendees', kind: 'textarea', wide: true, rows: 4, label: L3('উপস্থিত (প্রতি লাইনে একজন)', 'उपस्थित (प्रति पंक्ति)', 'Attendees (one per line)') },
    { id: 'discussion', kind: 'textarea', wide: true, rows: 5, label: L3('আলোচনার সারমর্ম', 'चर्चा का सार', 'Discussion summary') },
    { id: 'decisions', kind: 'textarea', wide: true, rows: 4, label: L3('সিদ্ধান্ত (প্রতি লাইনে একটি)', 'निर्णय (प्रति पंक्तি)', 'Decisions (one per line)') },
    {
      id: 'actions', kind: 'table', wide: true, rows: 4,
      label: L3('কর্ম-তালিকা (প্রতি সারি: কাজ | দায়িত্বে | শেষ-তারিখ)', 'कार्य (कार्य | जिम्मेदार | समय-सीमा)', 'Action items (task | owner | deadline)'),
      cols: [L3('কাজ', 'कार्य', 'Task'), L3('দায়িত্বে', 'जिम्मेदार', 'Owner'), L3('শেষ-তারিখ', 'समय-सीमा', 'Deadline')],
    },
    { id: 'nextMeeting', kind: 'text', wide: true, label: L3('পরবর্তী সভা (ঐচ্ছিক)', 'अगली बैठक', 'Next meeting (optional)') },
    { id: 'sign1Name', kind: 'text', label: L3('সভাপতির নাম', 'अध्यक्ष', 'Chairperson name') },
    { id: 'sign2Name', kind: 'text', label: L3('সচিবের নাম', 'सचिव', 'Secretary name') },
  ],
  build: (v, lang, P) => {
    const acts = lines(V(v, 'actions')).map((l) => l.split('|').map((c) => c.trim()));
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      band(pick(lang, 'কার্যবিবরণী', 'कार्यवृत्त', 'MINUTES') + (V(v, 'meetingTitle') ? ` — ${V(v, 'meetingTitle')}` : ''), P),
      row2(
        `<p style="text-align:left; margin:0; font-size:10.5pt">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10.5pt">${esc(V(v, 'venue') ? `${pick(lang, 'স্থান', 'स्थान', 'Venue')}: ${V(v, 'venue')}` : '')}</p>`,
      ),
      lines(V(v, 'attendees')).length
        ? secH(pick(lang, 'উপস্থিত', 'उपस्थित', 'ATTENDEES'), P) + `<ul style="margin:0.2em 0">${lines(V(v, 'attendees')).map((a) => `<li>${esc(a)}</li>`).join('')}</ul>`
        : '',
      V(v, 'discussion') ? secH(pick(lang, 'আলোচনা', 'चर्चा', 'DISCUSSION'), P) + `<p style="margin:0.2em 0; line-height:1.9; text-align:justify">${esc(V(v, 'discussion'))}</p>` : '',
      lines(V(v, 'decisions')).length ? secH(pick(lang, 'সিদ্ধান্ত', 'निर्णय', 'DECISIONS'), P) + `<ol>${lines(V(v, 'decisions')).map((d) => `<li>${esc(d)}</li>`).join('')}</ol>` : '',
      acts.length
        ? secH(pick(lang, 'কর্ম-তালিকা', 'कार्य सूची', 'ACTION ITEMS'), P) + `<table><tr><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'কাজ', 'कार्य', 'Task'))}</th><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'দায়িত্বে', 'जिम्मेदार', 'Owner'))}</th><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'শেষ-তারিখ', 'समय-सीमा', 'Deadline'))}</th></tr>${acts.map((c) => `<tr><td>${esc(c[0] ?? '')}</td><td>${esc(c[1] ?? '')}</td><td>${esc(c[2] ?? '')}</td></tr>`).join('')}</table>`
        : '',
      V(v, 'nextMeeting') ? `<p style="margin-top:0.8em; font-size:10.5pt"><strong>${esc(pick(lang, 'পরবর্তী সভা', 'अगली बैठक', 'Next meeting'))}:</strong> ${esc(V(v, 'nextMeeting'))}</p>` : '',
      sig2(lang, P, { t: pick(lang, 'সভাপতি', 'अध्यक्ष', 'Chairperson'), n: V(v, 'sign1Name'), o: '' }, { t: pick(lang, 'সচিব', 'सचिव', 'Secretary'), n: V(v, 'sign2Name'), o: '' }),
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ ইনভয়েস ও আর্থিক — নতুন (finance) ═════════════════════════

/** স্বয়ংক্রিয়-গণনা টেবিল (নাম|পরিমাণ|দর → টাকা) — ইনভয়েস/কোটেশন/পিও সাঝা */
function calcItems(v: Record<string, string>, lang: Lang, nameLbl: T3, qtyLbl: T3, rateLbl: T3, amtLbl: T3): { html: string; total: number } {
  const rows = lines(V(v, 'items')).map((l) => l.split('|').map((c) => c.trim()));
  let total = 0;
  const body = rows
    .map((cells) => {
      const [name = '', qty = '', rate = ''] = cells;
      const amt = toNum(qty) * toNum(rate);
      total += amt;
      return `<tr><td>${esc(name)}</td><td style="text-align:center">${esc(qty)}</td><td style="text-align:right">${esc(rate)}</td><td style="text-align:right">${esc(amt ? numStr(amt, lang) : '')}</td></tr>`;
    })
    .join('');
  const head = `<tr><th style="text-align:left">${tx(lang, nameLbl)}</th><th>${tx(lang, qtyLbl)}</th><th style="text-align:right">${tx(lang, rateLbl)}</th><th style="text-align:right">${tx(lang, amtLbl)}</th></tr>`;
  const totalRow = `<tr><td colspan="3" style="text-align:right; font-weight:700">${tx(lang, DSB.total)}</td><td style="text-align:right; font-weight:700">${numStr(total, lang)}</td></tr>`;
  return { html: `<table>${head}${body}${totalRow}</table>`, total };
}

const QUOTATION_TPL: DsTemplate = {
  id: 'quotation',
  category: 'finance',
  name: L3('দর-উদ্ধৃতি (কোটেশন)', 'कोटेशन', 'Quotation'),
  desc: L3('স্বয়ংক্রিয় মোট-গণনার দরপত্র — প্রাপক, বৈধতা-সময় ও শর্তাবলিসহ।', 'कोटेशन।', 'Price quotation with validity.'),
  styles: ALL_STYLES,
  defaultStyle: 'espresso',
  fields: [
    { id: 'shop', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'प्रतिष्ठान', 'Business name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'phone', kind: 'text', label: L3('মোবাইল/ফোন', 'मोबाइल/फोन', 'Phone') },
    { id: 'quoteNo', kind: 'text', label: L3('কোটেশন নং', 'कोटेशन सं.', 'Quote no.') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'buyer', kind: 'textarea', rows: 3, label: L3('প্রাপকের নাম ও ঠিকানা (প্রতি লাইনে একটি)', 'प्रापक (प्रति पंक्ति)', 'Recipient (one per line)') },
    {
      id: 'items', kind: 'table', wide: true, rows: 6,
      label: L3('পণ্য/সেবা (প্রতি সারি: নাম | পরিমাণ | দর)', 'सूची (नाम | मात्रा | दर)', 'Items (name | qty | rate)'),
      ph: L3('ওয়েবসাইট ডিজাইন | ১ | ২৫০০০\nহোস্টিং (বার্ষিক) | ১ | ৪৫০০', '…', 'Website design | 1 | 25000'),
      cols: [L3('বিবরণ', 'विवरণ', 'Description'), L3('পরিমাণ', 'मात्रा', 'Qty'), L3('দর', 'दर', 'Rate'), L3('টাকা', 'रাশি', 'Amount')],
    },
    { id: 'validity', kind: 'text', wide: true, label: L3('বৈধতা', 'वैधता', 'Valid until'), ph: L3('৩০ দিন', '30 दिन', '30 days') },
    { id: 'terms', kind: 'textarea', wide: true, rows: 3, label: L3('শর্তাবলি (প্রতি লাইনে একটি)', 'शर्तें (प्रति पंक्ति)', 'Terms (one per line)') },
    { id: 'sign1Name', kind: 'text', label: L3('স্বাক্ষরকারী', 'हस्ताक्षरकर्तা', 'Signatory') },
  ],
  build: (v, lang, P) => {
    const { html: itemsHtml, total } = calcItems(v, lang,
      L3('বিবরণ', 'विवरण', 'Description'), L3('পরিমাণ', 'मात्रा', 'Qty'), L3('দর', 'दर', 'Rate'), L3('টাকা', 'राशि', 'Amount'));
    const terms = lines(V(v, 'terms'));
    return [
      pc(`<strong style="font-size:14pt; letter-spacing:0.5px">${esc(V(v, 'shop'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      V(v, 'phone') ? pc(`<span style="font-size:10.5pt; color:${P.soft}">${esc(V(v, 'phone'))}</span>`) : '',
      pc(`<strong style="font-size:11.5pt">${esc(pick(lang, 'দর-উদ্ধৃতি', 'कोटेशन', 'QUOTATION'))}</strong>`, `color:${P.head}`),
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'quoteNo') ? `${pick(lang, 'কোটেশন নং', 'कोटेशन सं.', 'Quote no.')}: ${V(v, 'quoteNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      V(v, 'buyer')
        ? `<div class="doc-textbox" data-variant="box" data-border="${P.border}" data-fill="transparent" data-bstyle="solid" data-bwidth="1"><p style="margin:0"><strong>${esc(pick(lang, 'প্রাপক', 'प्रापक', 'Prepared for:'))}</strong></p>${lines(V(v, 'buyer')).map((l) => `<p style="margin:0.1em 0">${esc(l)}</p>`).join('')}</div>`
        : '',
      itemsHtml,
      `<p style="font-size:10.5pt"><strong>${tx(lang, DSB.inWords)}:</strong> ${esc(wordsTaka(total, lang))}</p>`,
      V(v, 'validity') ? `<p style="font-size:10.5pt"><strong>${esc(pick(lang, 'এই উদ্ধৃতিটি বৈধ', 'यह कोटेशन वैध है', 'This quotation is valid'))}</strong> ${esc(V(v, 'validity'))}.</p>` : '',
      terms.length
        ? buildDesignBoxHtml({ variant: 'box', border: P.border, fill: 'transparent', bstyle: 'dashed', bwidth: 1 }, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'শর্তাবলি:', 'शर्तें:', 'Terms:'))}</strong></p><ol>${terms.map((t) => `<li>${esc(t)}</li>`).join('')}</ol>`)
        : '',
      // স্বাক্ষর-রেখা — float/inline-block এডিটর-চুক্তির বাইরে হারিয়ে যেত; ডান-সারিত
      // প্যারা + border-top (extensions-এর নতুন borderTop* অ্যাট্রিবিউটে রাউন্ড-ট্রিপ করে)
      `<p style="text-align:right; margin-top:1.6em; border-top:1px solid ${P.border}; padding-top:4px; font-size:10pt">${esc(V(v, 'sign1Name') || pick(lang, 'অনুমোদিত স্বাক্ষর', 'अनुमोदित हस्ताक्षर', 'Authorised signature'))}</p>`,
    ].filter(Boolean).join('');
  },
};

const PURCHASE_ORDER_TPL: DsTemplate = {
  id: 'purchase-order',
  category: 'finance',
  name: L3('ক্রয়াদেশ (পিও)', 'क्रय आदेश', 'Purchase Order'),
  desc: L3('PO-নম্বরসহ আনুষ্ঠানিক ক্রয়াদেশ — বিক্রেতা, সরবরাহ-ঠিকানা ও স্বয়ংক্রিয় মোট।', 'क्रय आदेश।', 'Formal PO with vendor block.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'shop', kind: 'text', wide: true, label: L3('ক্রেতা-প্রতিষ্ঠান', 'खरीदार संस्था', 'Buying organization') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'poNo', kind: 'text', label: L3('PO নং', 'PO सं.', 'PO no.') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'vendor', kind: 'textarea', rows: 3, label: L3('বিক্রেতা (প্রতি লাইনে একটি)', 'विक्रेता (प्रति पंक्ति)', 'Vendor (one per line)') },
    { id: 'shipTo', kind: 'textarea', rows: 3, label: L3('সরবরাহ-ঠিকানা (প্রতি লাইনে একটি)', 'शिपिंग पता', 'Ship-to (one per line)') },
    {
      id: 'items', kind: 'table', wide: true, rows: 6,
      label: L3('পণ্য-তালিকা (প্রতি সারি: নাম | পরিমাণ | দর)', 'सूची (नाम | मात्रा | दর)', 'Items (name | qty | rate)'),
      cols: [L3('বিবরণ', 'विवरण', 'Description'), L3('পরিমাণ', 'मात्रा', 'Qty'), L3('দর', 'दर', 'Rate'), L3('টাকা', 'रাশি', 'Amount')],
    },
    { id: 'deliveryDate', kind: 'text', wide: true, label: L3('সরবরাহের শেষ-তারিখ', 'आपूर्ति समय-सीमा', 'Delivery deadline') },
    { id: 'paymentTerms', kind: 'text', wide: true, label: L3('মূল্যপরিশোধ-শর্ত', 'भुगतान शर्तें', 'Payment terms'), ph: L3('ডেলিভারির ১৫ দিনের মধ্যে', '…', 'Net 15') },
    { id: 'sign1Name', kind: 'text', label: L3('অনুমোদনকারী', 'अनुमोदक', 'Authorised by') },
  ],
  build: (v, lang, P) => {
    const { html: itemsHtml, total } = calcItems(v, lang,
      L3('বিবরণ', 'विवरণ', 'Description'), L3('পরিমাণ', 'मात्रा', 'Qty'), L3('দর', 'দর', 'Rate'), L3('টাকা', 'राशि', 'Amount'));
    const vendor = lines(V(v, 'vendor'));
    const ship = lines(V(v, 'shipTo'));
    const block = (title: string, ls: string[]) =>
      `<div class="doc-textbox" data-variant="box" data-border="${P.border}" data-fill="transparent" data-bstyle="solid" data-bwidth="1"><p style="margin:0"><strong>${esc(title)}</strong></p>${ls.map((l) => `<p style="margin:0.1em 0">${esc(l)}</p>`).join('')}</div>`;
    return [
      pc(`<strong style="font-size:13.5pt; letter-spacing:0.5px">${esc(V(v, 'shop'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      band(pick(lang, 'ক্রয়াদেশ', 'क्रय आदेश', 'PURCHASE ORDER'), P),
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'poNo') ? `${pick(lang, 'ক্রয়াদেশ নং', 'क्रय आदेश सं.', 'PO')}: ${V(v, 'poNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      row2(
        block(pick(lang, 'বিক্রেতা', 'विक्रेतা', 'Vendor:'), vendor),
        block(pick(lang, 'সরবরাহ-ঠিকানা', 'शिपिंग पता', 'Ship to:'), ship),
      ),
      itemsHtml,
      `<p style="font-size:10.5pt"><strong>${tx(lang, DSB.inWords)}:</strong> ${esc(wordsTaka(total, lang))}</p>`,
      V(v, 'deliveryDate') ? `<p style="font-size:10.5pt"><strong>${esc(pick(lang, 'সরবরাহের শেষ-তারিখ', 'आपूर्ति समय-सीमा', 'Delivery by'))}:</strong> ${esc(V(v, 'deliveryDate'))}</p>` : '',
      V(v, 'paymentTerms') ? `<p style="font-size:10.5pt"><strong>${esc(pick(lang, 'মূল্যপরিশোধ', 'भुगतान', 'Payment'))}:</strong> ${esc(V(v, 'paymentTerms'))}</p>` : '',
      `<p style="text-align:right; margin-top:1.6em; border-top:1px solid ${P.border}; padding-top:4px; font-size:10pt">${esc(V(v, 'sign1Name') || pick(lang, 'অনুমোদিত স্বাক্ষর', 'अनुमोदিত हस्ताक्षর', 'Authorised signature'))}</p>`,
      // স্বাক্ষর-রেখার পরে float-পরিষ্কারক ফাঁকা প্যারা আর দরকার নেই (float বাদ)
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ আইনি ও চুক্তি — নতুন (legal) ═════════════════════════

const RENTAL_AGREEMENT_TPL: DsTemplate = {
  id: 'rental-agreement',
  category: 'legal',
  name: L3('ভাড়া চুক্তিপত্র', 'किराया अनुबंध', 'Rental / Lease Agreement'),
  desc: L3('বাড়ি/দোকান ভাড়ার চুক্তি — বাড়িওয়ালা-ভাড়াটিয়া, মেয়াদ, ভাড়া ও শর্তাবলি।', 'किराया अनुबंध।', 'Landlord-tenant lease contract.'),
  styles: ALL_STYLES,
  defaultStyle: 'sepia',
  fields: [
    { id: 'title', kind: 'text', wide: true, label: L3('চুক্তির শিরোনাম', 'शीर्षक', 'Agreement title'), ph: L3('বাসা ভাড়া চুক্তিপত্র', '…', 'Residential Lease Agreement') },
    { id: 'deedDate', kind: 'text', label: L3('তারিখ', 'तिथि', 'Date') },
    { id: 'landlord', kind: 'text', wide: true, label: L3('বাড়িওয়ালা (নাম, ঠিকানা)', 'मकान मालिक (नाम…)', 'Landlord (name, address)') },
    { id: 'tenant', kind: 'text', wide: true, label: L3('ভাড়াটিয়া (নাম, ঠিকানা)', 'किरायेदार (नाम…)', 'Tenant (name, address)') },
    { id: 'property', kind: 'textarea', wide: true, rows: 2, label: L3('ভাড়া-সম্পত্তির বিবরণ', 'संपत्ति', 'Property description') },
    { id: 'termStart', kind: 'text', label: L3('মেয়াদ শুরু', 'शुरू', 'Term start') },
    { id: 'termEnd', kind: 'text', label: L3('মেয়াদ শেষ', 'समाप्ति', 'Term end') },
    { id: 'rent', kind: 'text', label: L3('মাসিক ভাড়া', 'मासिक किराया', 'Monthly rent') },
    { id: 'advance', kind: 'text', label: L3('অগ্রিম/জামানত', 'अग्रिम/जमा', 'Advance/deposit') },
    { id: 'clauses', kind: 'textarea', wide: true, rows: 6, label: L3('শর্তাবলি (প্রতি লাইনে একটি)', 'शर्तें (प्रतি पंक्ति)', 'Clauses (one per line)'), ph: L3('ভাড়া প্রতি মাসের ৫ তারিখের মধ্যে পরিশোধ।\nতিন মাসের নোটিশ ছাড়া খালি করা যাইবে না।\nবিদ্যুৎ-পানির বিল ভাড়াটিয়া বহন করিবেন।', '…', 'Rent due by the 5th…') },
    { id: 'witness1', kind: 'text', label: L3('সাক্ষী ১', 'साक्षी १', 'Witness 1') },
    { id: 'witness2', kind: 'text', label: L3('সাক্ষী ২', 'साक्षी २', 'Witness 2') },
  ],
  build: (v, lang, P) => {
    const clauses = lines(V(v, 'clauses'));
    const meta = shadeBox(P, [
      metaRow(pick(lang, 'সম্পত্তি', 'संपत्ति', 'Property'), V(v, 'property')),
      row2(
        metaRow(pick(lang, 'মেয়াদ শুরু', 'शुरू', 'From'), V(v, 'termStart')) + metaRow(pick(lang, 'মাসিক ভাড়া', 'मासिक किरायা', 'Rent'), V(v, 'rent')),
        metaRow(pick(lang, 'মেয়াদ শেষ', 'समाप्ति', 'To'), V(v, 'termEnd')) + metaRow(pick(lang, 'অগ্রিম', 'अग्रिम', 'Deposit'), V(v, 'advance')),
      ),
    ].join(''));
    return [
      band(V(v, 'title') || pick(lang, 'ভাড়া চুক্তিপত্র', 'किराया अनुबंধ', 'RENTAL AGREEMENT'), P),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(pick(lang, 'এই চুক্তিপত্র', 'यह अनुबंध', 'This agreement is made on'))} <strong>${esc(V(v, 'deedDate'))}</strong>${esc(pick(lang, ' তারিখে বাড়িওয়ালা', ' को मकान मालिक', ' between the Landlord'))} <strong>${esc(V(v, 'landlord'))}</strong> ${esc(pick(lang, 'এবং ভাড়াটিয়া', 'और किरायेदार', 'and the Tenant'))} <strong>${esc(V(v, 'tenant'))}</strong> ${esc(pick(lang, 'মধ্যে সম্পাদিত হইল।', 'के मध्य सम्पन्न हुआ।', 'is executed.'))}</p>`,
      meta,
      `<p style="margin-top:0.6em"><strong>${esc(pick(lang, 'শর্তাবলি:', 'शर्तें:', 'Terms and conditions:'))}</strong></p>`,
      clauses.length ? `<ol>${clauses.map((cl) => `<li>${esc(cl)}</li>`).join('')}</ol>` : '',
      `<p style="margin-top:1em; line-height:1.9; text-align:justify">${esc(pick(lang, 'পক্ষদ্বয় পাঠ-শুনিয়া অর্থ বুঝিয়া স্বেচ্ছায় সম্মতিক্রমে স্বাক্ষর করিলেন।', 'दोनों पक्षों ने पढ़कर, समझकर सहमति से हस्ताक्षर किए।', 'Both parties signed after reading and understanding.'))}</p>`,
      sig2(lang, P, { t: pick(lang, 'বাড়িওয়ালা', 'मकान मालিক', 'Landlord'), n: '', o: '' }, { t: pick(lang, 'ভাড়াটিয়া', 'किरायेदार', 'Tenant'), n: '', o: '' }),
      `<p style="margin-top:1em"><strong>${esc(pick(lang, 'সাক্ষীগণ:', 'साक्षीगण:', 'Witnesses:'))}</strong></p>`,
      `<ol><li>${esc(V(v, 'witness1'))}</li><li>${esc(V(v, 'witness2'))}</li></ol>`,
    ].filter(Boolean).join('');
  },
};

const EMPLOYMENT_CONTRACT_TPL: DsTemplate = {
  id: 'employment-contract',
  category: 'legal',
  name: L3('নিয়োগ চুক্তি', 'नियोजन अनुबंध', 'Employment Contract'),
  desc: L3('চাকরির চুক্তি — পদবি, বেতন, দায়িত্ব, কর্মঘণ্টা ও নোটিশ-শর্তসহ।', 'नियोजन अनुबंध।', 'Employment terms contract.'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'title', kind: 'text', wide: true, label: L3('চুক্তির শিরোনাম', 'शीर्षক', 'Contract title'), ph: L3('নিয়োগ ও সেবা-শর্ত চুক্তি', '…', 'Employment Agreement') },
    { id: 'deedDate', kind: 'text', label: L3('তারিখ', 'तिथि', 'Date') },
    { id: 'employer', kind: 'text', wide: true, label: L3('নিয়োগকর্তা (প্রতিষ্ঠান)', 'नियोक्ता', 'Employer (organization)') },
    { id: 'employee', kind: 'text', wide: true, label: L3('কর্মচারী (নাম, ঠিকানা)', 'कर्मचारी (नाम…)', 'Employee (name, address)') },
    { id: 'position', kind: 'text', wide: true, label: L3('পদবি', 'पद', 'Position') },
    { id: 'startDate', kind: 'text', label: L3('যোগদানের তারিখ', 'कार्यारंभ', 'Start date') },
    { id: 'salary', kind: 'text', wide: true, label: L3('বেতন ও সুবিধা', 'वेतन', 'Salary & benefits') },
    { id: 'duties', kind: 'textarea', wide: true, rows: 4, label: L3('প্রধান দায়িত্ব', 'मुख्य दायित्व', 'Main duties') },
    { id: 'clauses', kind: 'textarea', wide: true, rows: 6, label: L3('সেবা-শর্ত (প্রতি লাইনে একটি)', 'शर्तें (प्रति पंक্তি)', 'Terms (one per line)'), ph: L3('কর্মঘণ্টা: সপ্তাহে ৪৮ ঘণ্টা।\nবার্ষিক ছুটি ২০ দিন।\nদুই পক্ষের এক-মাস নোটিশ।', '…', 'Working hours: 48/week…') },
    { id: 'witness1', kind: 'text', label: L3('সাক্ষী ১', 'साक्षी १', 'Witness 1') },
    { id: 'witness2', kind: 'text', label: L3('সাক্ষী ২', 'साक্ষी २', 'Witness 2') },
  ],
  build: (v, lang, P) => {
    const clauses = lines(V(v, 'clauses'));
    const meta = shadeBox(P, [
      metaRow(pick(lang, 'পদবি', 'पद', 'Position'), V(v, 'position')),
      row2(
        metaRow(pick(lang, 'যোগদান', 'कार्यारंभ', 'Start date'), V(v, 'startDate')),
        metaRow(pick(lang, 'বেতন ও সুবিধা', 'वेतन', 'Salary & benefits'), V(v, 'salary')),
      ),
    ].join(''));
    return [
      band(V(v, 'title') || pick(lang, 'নিয়োগ চুক্তি', 'नियोजन अनुबंध', 'EMPLOYMENT CONTRACT'), P),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(pick(lang, 'এই চুক্তিপত্র', 'यह अनुबंध', 'This agreement is made on'))} <strong>${esc(V(v, 'deedDate'))}</strong>${esc(pick(lang, ' তারিখে নিয়োগকর্তা', ' को नियोक्ता', ' between the Employer'))} <strong>${esc(V(v, 'employer'))}</strong> ${esc(pick(lang, 'এবং কর্মচারী', 'और कर्मचারी', 'and the Employee'))} <strong>${esc(V(v, 'employee'))}</strong> ${esc(pick(lang, 'মধ্যে সম্পাদিত হইল।', 'के मध्य सम्पन्न हुআ।', 'is executed.'))}</p>`,
      meta,
      V(v, 'duties') ? secH(pick(lang, 'প্রধান দায়িত্ব', 'मुख्य दायित्व', 'DUTIES'), P) + `<p style="margin:0.2em 0; line-height:1.9; text-align:justify">${esc(V(v, 'duties'))}</p>` : '',
      clauses.length ? secH(pick(lang, 'সেবা-শর্ত', 'शर्तें', 'TERMS & CONDITIONS'), P) + `<ol>${clauses.map((cl) => `<li>${esc(cl)}</li>`).join('')}</ol>` : '',
      `<p style="margin-top:1em; line-height:1.9; text-align:justify">${esc(pick(lang, 'পক্ষদ্বয় পাঠ-শুনিয়া অর্থ বুঝিয়া স্বেচ্ছায় সম্মতিক্রমে স্বাক্ষর করিলেন।', 'दोनों पक्षों ने पढ़कर, समझकर सहमति से हस्ताक्षर किए।', 'Both parties signed after reading and understanding.'))}</p>`,
      sig2(lang, P, { t: pick(lang, 'নিয়োগকর্তা', 'नियोक্তা', 'Employer'), n: '', o: '' }, { t: pick(lang, 'কর্মচারী', 'कर्मचारी', 'Employee'), n: '', o: '' }),
      `<p style="margin-top:1em"><strong>${esc(pick(lang, 'সাক্ষীগণ:', 'साक्षीगण:', 'Witnesses:'))}</strong></p>`,
      `<ol><li>${esc(V(v, 'witness1'))}</li><li>${esc(V(v, 'witness2'))}</li></ol>`,
    ].filter(Boolean).join('');
  },
};

const NDA_TPL: DsTemplate = {
  id: 'nda',
  category: 'legal',
  name: L3('গোপনীয়তা চুক্তি (NDA)', 'गोपनीयता अनुबंध', 'Non-Disclosure Agreement'),
  desc: L3('NDA — গোপন-তথ্যের সংজ্ঞা, দায়বদ্ধতা, ব্যতিক্রম ও মেয়াদ।', 'एनडीए।', 'Confidentiality agreement (NDA).'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'deedDate', kind: 'text', label: L3('তারিখ', 'तिथि', 'Date') },
    { id: 'partyA', kind: 'text', wide: true, label: L3('পক্ষক — তথ্য-প্রদানকারী (নাম, ঠিকানা)', 'पक्षक (नाम…)', 'Party A — disclosing (name, address)') },
    { id: 'partyB', kind: 'text', wide: true, label: L3('পক্ষখ — তথ্য-গ্রহীতা (নাম, ঠিকানা)', 'पक्षख (नाम…)', 'Party B — receiving (name, address)') },
    { id: 'purpose', kind: 'textarea', wide: true, rows: 3, label: L3('উদ্দেশ্য', 'उद्देश্য', 'Purpose') },
    { id: 'definition', kind: 'textarea', wide: true, rows: 3, label: L3('গোপন-তথ্যের সংজ্ঞা', 'गोपनीय सूचना की परिभाषा', 'Definition of confidential information') },
    { id: 'obligations', kind: 'textarea', wide: true, rows: 4, label: L3('দায়বদ্ধতা (প্রতি লাইনে একটি)', 'दायित्व (प्रति पंक्ति)', 'Obligations (one per line)'), ph: L3('গোপন-তথ্য তৃতীয় পক্ষকে প্রকাশ নিষিদ্ধ।\nশুধু কাজের উদ্দেশ্যে ব্যবহার করা যাইবে।', '…', 'No disclosure to third parties…') },
    { id: 'term', kind: 'text', wide: true, label: L3('মেয়াদ', 'अवधि', 'Term'), ph: L3('২ বছর', '2 साल', '2 years') },
    { id: 'governingLaw', kind: 'text', wide: true, label: L3('আইনের এখতিয়ার', 'क्षेत्राधिकार', 'Governing law'), ph: L3('বাংলাদেশের আইন', 'भारतीय कानून', 'Laws of Bangladesh') },
    { id: 'witness1', kind: 'text', label: L3('সাক্ষী ১', 'साक्षी १', 'Witness 1') },
    { id: 'witness2', kind: 'text', label: L3('সাক্ষী ২', 'साक্ষी २', 'Witness 2') },
  ],
  build: (v, lang, P) => {
    const obligations = lines(V(v, 'obligations'));
    return [
      band(pick(lang, 'গোপনীয়তা চুক্তি (NDA)', 'गोपनीयता अनुबंध', 'NON-DISCLOSURE AGREEMENT'), P),
      `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(pick(lang, 'এই চুক্তিপত্র', 'यह अनुबंध', 'This agreement is made on'))} <strong>${esc(V(v, 'deedDate'))}</strong>${esc(pick(lang, ' তারিখে পক্ষক', ' को पक्षक', ' between Party A'))} <strong>${esc(V(v, 'partyA'))}</strong> ${esc(pick(lang, 'এবং পক্ষখ', 'और पक्षख', 'and Party B'))} <strong>${esc(V(v, 'partyB'))}</strong> ${esc(pick(lang, 'মধ্যে সম্পাদিত হইল।', 'के मध्य सम्पन्न हुआ।', 'is executed.'))}</p>`,
      V(v, 'purpose') ? secH(pick(lang, '১. উদ্দেশ্য', '1. उद्देश्य', '1. PURPOSE'), P) + `<p style="margin:0.2em 0; line-height:1.9; text-align:justify">${esc(V(v, 'purpose'))}</p>` : '',
      V(v, 'definition') ? secH(pick(lang, '২. গোপন-তথ্যের সংজ্ঞা', '2. परिभाषा', '2. CONFIDENTIAL INFORMATION'), P) + `<p style="margin:0.2em 0; line-height:1.9; text-align:justify">${esc(V(v, 'definition'))}</p>` : '',
      obligations.length ? secH(pick(lang, '৩. দায়বদ্ধতা', '3. दायित्व', '3. OBLIGATIONS'), P) + `<ol>${obligations.map((o) => `<li>${esc(o)}</li>`).join('')}</ol>` : '',
      V(v, 'term') ? secH(pick(lang, '৪. মেয়াদ', '4. अवधि', '4. TERM'), P) + `<p style="margin:0.2em 0; line-height:1.9">${esc(V(v, 'term'))}</p>` : '',
      V(v, 'governingLaw') ? secH(pick(lang, '৫. আইনের এখতিয়ার', '5. क्षेत्राधिकार', '5. GOVERNING LAW'), P) + `<p style="margin:0.2em 0; line-height:1.9">${esc(V(v, 'governingLaw'))}</p>` : '',
      sig2(lang, P, { t: pick(lang, 'পক্ষক', 'पक्षक', 'Party A'), n: '', o: '' }, { t: pick(lang, 'পক্ষখ', 'पक्षख', 'Party B'), n: '', o: '' }),
      `<p style="margin-top:1em"><strong>${esc(pick(lang, 'সাক্ষীগণ:', 'साक्षीगণ:', 'Witnesses:'))}</strong></p>`,
      `<ol><li>${esc(V(v, 'witness1'))}</li><li>${esc(V(v, 'witness2'))}</li></ol>`,
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ সনদ ও পুরস্কার — নতুন (cert) ═════════════════════════

/** সাজসজ্জা-সনদের সাঝা নির্মাতা — স্বর্ণ-ফ্রেম + কেন্দ্র-লেখা (award-প্রথা) */
function framedCert(lang: Lang, P: DsPalette, v: Record<string, string>, inner: string[]): string {
  const tail = [
    V(v, 'date') ? pc(`<span style="font-size:11pt; color:${P.soft}">${esc(`${tx(lang, DSB.date)}: ${V(v, 'date')}`)}</span>`, 'margin-top:1em') : '',
    sig2(lang, P, { t: V(v, 'sign1Title'), n: V(v, 'sign1Name'), o: '' }, { t: V(v, 'sign2Title'), n: V(v, 'sign2Name'), o: '' }),
  ].join('');
  return buildDesignBoxHtml({ variant: 'double', border: P.border, fill: 'transparent', bstyle: 'double', bwidth: 4 },
    buildDesignBoxHtml({ variant: 'box', border: P.border, fill: 'transparent', bstyle: 'solid', bwidth: 1 },
      [...inner, tail].join('')));
}

const CERT_APPRECIATION_TPL: DsTemplate = {
  id: 'certificate-appreciation',
  category: 'cert',
  name: L3('কৃতজ্ঞতা সনদ', 'कृतज्ञता प्रमाणपत्र', 'Certificate of Appreciation'),
  desc: L3('অবদানের স্বীকৃতি-সনদ — কর্মী, স্বেচ্ছাসেবক ও সহযোগীদের সম্মানে।', 'कृतज्ञता प्रमाणपत्र।', 'Recognition of contribution.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান/আয়োজক', 'संस्था', 'Institution / organiser') },
    { id: 'name', kind: 'text', wide: true, label: L3('প্রাপকের নাম', 'प्रापक का नाम', 'Recipient\u2019s name') },
    { id: 'reason', kind: 'textarea', wide: true, rows: 3, label: L3('কৃতজ্ঞতার কারণ', 'कारण', 'Reason for appreciation'), ph: L3('স্বেচ্ছাসেবক হিসাবে অসামান্য অবদানের জন্য…', '…', 'For outstanding volunteer service…') },
    { id: 'body2', kind: 'textarea', wide: true, rows: 2, label: L3('অতিরিক্ত প্রশংসা (ঐচ্ছিক)', 'अतिरिक्त', 'Extra praise (optional)') },
    { id: 'date', kind: 'date', label: DSB.date },
    ...fSign2(L3('পদবি (প্রথম স্বাক্ষরকারী)', 'पद (हस्ताक्षरकर्ता १)', 'Title (first signatory)'), L3('পদবি (দ্বিতীয় স্বাক্ষরকারী)', 'पद (हस्ताक्षरकर्ता २)', 'Title (second signatory)')),
  ],
  build: (v, lang, P) => framedCert(lang, P, v, [
    pc(`<strong style="font-size:11pt; letter-spacing:2.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.soft}`),
    pc(`<span style="font-size:20pt; color:${P.head}">✦</span>`),
    pc(`<strong style="font-size:18pt; letter-spacing:1px">${esc(pick(lang, 'কৃতজ্ঞতা সনদ', 'कृतज्ञता प्रमाणपत्र', 'CERTIFICATE OF APPRECIATION'))}</strong>`, `color:${P.head}`),
    pc(`<span style="font-size:11pt; color:${P.soft}">❦ ❖ ❦</span>`),
    `<p style="margin-top:1.1em; line-height:1.9; text-align:center; font-size:11.5pt">${esc(pick(lang, 'অভিনন্দন জানানো যাইতেছে,', 'सम्मानित किया जाता है,', 'Proudly presented to'))}</p>`,
    pc(`<strong style="font-size:17pt; color:${P.head}; border-bottom:2px solid ${P.border}; padding-bottom:2px">${esc(V(v, 'name'))}</strong>`),
    `<p style="margin-top:1em; line-height:1.95; text-align:center; font-size:11.5pt">${esc(V(v, 'reason'))}</p>`,
    V(v, 'body2') ? `<p style="line-height:1.95; text-align:center; font-size:11pt; color:${P.soft}">${esc(V(v, 'body2'))}</p>` : '',
  ]),
};

const CERT_PARTICIPATION_TPL: DsTemplate = {
  id: 'certificate-participation',
  category: 'cert',
  name: L3('অংশগ্রহণ সনদ', 'भागीदारी प्रमाणপत्र', 'Certificate of Participation'),
  desc: L3('প্রতিযোগিতা/কর্মশালায় অংশগ্রহণের স্বীকৃতি — অনুষ্ঠান, ভূমিকা ও তারিখসহ।', 'भागीदारी प्रमाणपত्र।', 'Event participation certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'wine',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান/আয়োজক', 'संस्था', 'Institution / organiser') },
    { id: 'eventName', kind: 'text', wide: true, label: L3('অনুষ্ঠানের নাম', 'अनुष्ठान', 'Event name'), ph: L3('জাতীয় বিজ্ঞান অলিম্পিয়াড ২০২৫', '…', 'National Science Olympiad 2025') },
    { id: 'name', kind: 'text', wide: true, label: L3('প্রাপকের নাম', 'प्रापक का नाम', 'Recipient\u2019s name') },
    { id: 'role', kind: 'text', wide: true, label: L3('ভূমিকা (ঐচ্ছিক)', 'भूमिका (वैकल्पिक)', 'Role (optional)'), ph: L3('অংশগ্রহণকারী / স্বেচ্ছাসেবক / বক্তা', '…', 'Participant / Volunteer / Speaker') },
    { id: 'venue', kind: 'text', wide: true, label: L3('স্থান (ঐচ্ছিক)', 'स्थान', 'Venue (optional)') },
    { id: 'date', kind: 'date', label: DSB.date },
    ...fSign2(L3('পদবি (প্রথম স্বাক্ষরকারী)', 'पद (हस्ताक्षरकर्ता १)', 'Title (first signatory)'), L3('পদবি (দ্বিতীয় স্বাক্ষরকারী)', 'पद (हस्ताक्षरकर्ता २)', 'Title (second signatory)')),
  ],
  build: (v, lang, P) => framedCert(lang, P, v, [
    pc(`<strong style="font-size:11pt; letter-spacing:2.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.soft}`),
    pc(`<span style="font-size:20pt; color:${P.head}">✦</span>`),
    pc(`<strong style="font-size:18pt; letter-spacing:1px">${esc(pick(lang, 'অংশগ্রহণ সনদ', 'भागीदারी प्रमाणपत्र', 'CERTIFICATE OF PARTICIPATION'))}</strong>`, `color:${P.head}`),
    pc(`<span style="font-size:11pt; color:${P.soft}">❦ ❖ ❦</span>`),
    `<p style="margin-top:1.1em; line-height:1.9; text-align:center; font-size:11.5pt">${esc(pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে,', 'यह प्रमाणित किया जाता है कि,', 'This is to certify that'))}</p>`,
    pc(`<strong style="font-size:17pt; color:${P.head}; border-bottom:2px solid ${P.border}; padding-bottom:2px">${esc(V(v, 'name'))}</strong>`),
    `<p style="margin-top:1em; line-height:1.95; text-align:center; font-size:11.5pt">${esc(pick(lang, 'নিম্নোক্ত অনুষ্ঠানে সম্মানের সাথে অংশগ্রহণ করিয়াছেন —', 'निम्नलिखित अनुष्ठान में सम्मानपूर्वक भाग लिया —', 'has honourably participated in'))} <strong>${esc(V(v, 'eventName'))}</strong>${V(v, 'role') ? ` ${esc(pick(lang, '— ভূমিকা:', '— भूमिका:', 'as'))} <strong>${esc(V(v, 'role'))}</strong>` : ''}${pick(lang, '।', '।', '.')}</p>`,
    V(v, 'venue') ? pc(`<span style="font-size:10.5pt; color:${P.soft}">${esc(V(v, 'venue'))}</span>`, 'margin-top:0.4em') : '',
  ]),
};

const CERT_TRAINING_TPL: DsTemplate = {
  id: 'certificate-training',
  category: 'cert',
  name: L3('প্রশিক্ষণ সমাপ্তি সনদ', 'प्रशिक्षण पूर्णता प्रमाणপत्र', 'Training Completion Certificate'),
  desc: L3('কর্মশালা/কোর্স সমাপ্তির সনদ — প্রশিক্ষণ-সময়, বিষয়-তালিকা ও প্রশিক্ষক-স্বাক্ষর।', 'प्रशिक्षण प्रमाणपत्र।', 'Course completion certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান/আয়োজক', 'संस्था', 'Institution / organiser') },
    { id: 'programName', kind: 'text', wide: true, label: L3('প্রশিক্ষণ-কোর্সের নাম', 'कोर्स का नाम', 'Training programme') },
    { id: 'name', kind: 'text', wide: true, label: L3('প্রাপকের নাম', 'प्रापक का नाम', 'Recipient\u2019s name') },
    { id: 'duration', kind: 'text', wide: true, label: L3('সময়কাল', 'अवधि', 'Duration'), ph: L3('৬ সপ্তাহ (মোট ৩৬ ঘণ্টা)', '…', '6 weeks (36 hours)') },
    { id: 'topics', kind: 'textarea', wide: true, rows: 3, label: L3('আচ্ছাদিত বিষয় (প্রতি লাইনে একটি, ঐচ্ছিক)', 'विषय (प्रति पंक्ति)', 'Topics covered (one per line, optional)') },
    { id: 'date', kind: 'date', label: DSB.date },
    ...fSign2(L3('পদবি (প্রশিক্ষক)', 'पद (प्रशिक्षक)', 'Title (trainer)'), L3('পদবি (পরিচালক)', 'पद (निदेशक)', 'Title (director)')),
  ],
  build: (v, lang, P) => {
    const topics = lines(V(v, 'topics'));
    return framedCert(lang, P, v, [
      pc(`<strong style="font-size:11pt; letter-spacing:2.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.soft}`),
      pc(`<span style="font-size:20pt; color:${P.head}">✦</span>`),
      pc(`<strong style="font-size:17pt; letter-spacing:1px">${esc(pick(lang, 'প্রশিক্ষণ সমাপ্তি সনদ', 'प्रशिक्षण पूर्णता प्रमाणपত्र', 'TRAINING COMPLETION CERTIFICATE'))}</strong>`, `color:${P.head}`),
      pc(`<span style="font-size:11pt; color:${P.soft}">❦ ❖ ❦</span>`),
      `<p style="margin-top:1.1em; line-height:1.9; text-align:center; font-size:11.5pt">${esc(pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে,', 'यह प्रमाणित किया जाता है कि,', 'This is to certify that'))}</p>`,
      pc(`<strong style="font-size:17pt; color:${P.head}; border-bottom:2px solid ${P.border}; padding-bottom:2px">${esc(V(v, 'name'))}</strong>`),
      `<p style="margin-top:1em; line-height:1.95; text-align:center; font-size:11.5pt">${esc(pick(lang, 'সফলতার সাথে সমাপ্ত করিয়াছেন —', 'ने सफलतापूर्वक पूर्ण किया —', 'has successfully completed'))} <strong>${esc(V(v, 'programName'))}</strong>${V(v, 'duration') ? ` (${esc(V(v, 'duration'))})` : ''}${pick(lang, '।', '।', '.')}</p>`,
      topics.length ? `<ul style="margin-top:0.6em">${topics.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : '',
    ]);
  },
};

// ═════════════════════════ শিক্ষা — নতুন (edu) ═════════════════════════

const LESSON_PLAN_TPL: DsTemplate = {
  id: 'lesson-plan',
  category: 'edu',
  name: L3('পাঠ পরিকল্পনা', 'पाठ योजना', 'Lesson Plan'),
  desc: L3('শিক্ষকের পাঠ-পরিকল্পনা — শেখার-লক্ষ্য, উপকরণ ও ধাপে-ধাপে কার্যক্রম।', 'पाठ योजना।', 'Structured lesson plan.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'institution', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান', 'संस्था', 'Institution') },
    { id: 'teacherName', kind: 'text', wide: true, label: L3('শিক্ষকের নাম', 'शिक्षक', 'Teacher name') },
    { id: 'subject', kind: 'text', label: L3('বিষয়', 'विषय', 'Subject') },
    { id: 'className', kind: 'text', label: L3('শ্রেণি/কোর্স', 'कक्षा', 'Class / course') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'duration', kind: 'text', label: L3('সময়কাল', 'अवधि', 'Duration'), ph: L3('৪৫ মিনিট', '45 मिनट', '45 minutes') },
    { id: 'topic', kind: 'text', wide: true, label: L3('পাঠের বিষয়', 'पाठ का विषय', 'Lesson topic') },
    { id: 'outcomes', kind: 'textarea', wide: true, rows: 4, label: L3('শেখার-লক্ষ্য (প্রতি লাইনে একটি)', 'शिक्षण लक्ष्य (प्रति पंक्ति)', 'Learning outcomes (one per line)') },
    { id: 'materials', kind: 'textarea', wide: true, rows: 3, label: L3('উপকরণ (প্রতি লাইনে একটি)', 'सामग्री (प्रति पंक्ति)', 'Materials (one per line)') },
    {
      id: 'stages', kind: 'table', wide: true, rows: 5,
      label: L3('কার্যক্রম (প্রতি সারি: ধাপ | কার্যক্রম | সময়)', 'चरण (चरण | गतिविधि | समय)', 'Stages (stage | activity | time)'),
      ph: L3('সূচনা | পূর্ব-জ্ঞান যাচাই | ৫ মিনিট\nমূল পাঠ | ব্যাখ্যা ও আলোচনা | ২৫ মিনিট\nমূল্যায়ন | প্রশ্নোত্তর | ১০ মিনিট', '…', 'Intro | Warm-up | 5 min'),
      cols: [L3('ধাপ', 'चरण', 'Stage'), L3('কার্যক্রম', 'गतिवিধि', 'Activity'), L3('সময়', 'समय', 'Time')],
    },
    { id: 'assessment', kind: 'textarea', wide: true, rows: 3, label: L3('মূল্যায়ন পদ্ধতি', 'मूल्यांकन', 'Assessment method') },
    { id: 'homework', kind: 'textarea', wide: true, rows: 2, label: L3('বাড়ির কাজ (ঐচ্ছিক)', 'गृहकार्य (वैकल्पिक)', 'Homework (optional)') },
  ],
  build: (v, lang, P) => {
    const stages = lines(V(v, 'stages')).map((l) => l.split('|').map((c) => c.trim()));
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'institution'))}</strong>`, `color:${P.head}`),
      V(v, 'teacherName') ? pc(`<span style="font-size:10.5pt; color:${P.soft}">${esc(pick(lang, 'শিক্ষক', 'शिक्षक', 'Teacher'))}: ${esc(V(v, 'teacherName'))}</span>`) : '',
      buildDividerHtml('single'),
      pc(`<strong style="font-size:13pt">${esc(pick(lang, 'পাঠ পরিকল্পনা', 'पाठ योजना', 'LESSON PLAN'))}</strong>`, `color:${P.head}`),
      shadeBox(P, row2(
        metaRow(pick(lang, 'বিষয়', 'विषय', 'Subject'), V(v, 'subject')) + metaRow(pick(lang, 'শ্রেণি/কোর্স', 'कक्षा', 'Class'), V(v, 'className')) + metaRow(pick(lang, 'সময়কাল', 'अवधि', 'Duration'), V(v, 'duration')),
        metaRow(pick(lang, 'তারিখ', 'तिथि', 'Date'), V(v, 'date')) + metaRow(pick(lang, 'পাঠের বিষয়', 'पाठ', 'Topic'), V(v, 'topic')),
      )),
      lines(V(v, 'outcomes')).length ? secH(pick(lang, 'শেখার-লক্ষ্য', 'शिक्षण लक्ष्य', 'LEARNING OUTCOMES'), P) + `<ol>${lines(V(v, 'outcomes')).map((o) => `<li>${esc(o)}</li>`).join('')}</ol>` : '',
      lines(V(v, 'materials')).length ? secH(pick(lang, 'উপকরণ', 'सामग्री', 'MATERIALS'), P) + `<ul>${lines(V(v, 'materials')).map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : '',
      stages.length
        ? secH(pick(lang, 'কার্যক্রম', 'गतिविधि', 'PROCEDURE'), P) + `<table><tr><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'ধাপ', 'चरण', 'Stage'))}</th><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'কার্যক্রম', 'गतिविधि', 'Activity'))}</th><th data-bg="${P.band}" style="text-align:left">${esc(pick(lang, 'সময়', 'समय', 'Time'))}</th></tr>${stages.map((c) => `<tr><td>${esc(c[0] ?? '')}</td><td>${esc(c[1] ?? '')}</td><td>${esc(c[2] ?? '')}</td></tr>`).join('')}</table>`
        : '',
      V(v, 'assessment') ? secH(pick(lang, 'মূল্যায়ন', 'मूल्यांकन', 'ASSESSMENT'), P) + `<p style="margin:0.2em 0; line-height:1.9; text-align:justify">${esc(V(v, 'assessment'))}</p>` : '',
      V(v, 'homework') ? shadeBox(P, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'বাড়ির কাজ:', 'गृहकार्य:', 'Homework:'))}</strong> ${esc(V(v, 'homework'))}</p>`) : '',
    ].filter(Boolean).join('');
  },
};

const REPORT_CARD_TPL: DsTemplate = {
  id: 'report-card',
  category: 'edu',
  name: L3('প্রগতি পত্র (রিপোর্ট কার্ড)', 'प्रगति पत्र', 'Report Card'),
  desc: L3('সাময়িক মূল্যায়নের প্রগতি-পত্র — গ্রেড, উপস্থিতি, আচরণ ও শিক্ষকের মন্তব্য।', 'प्रगति पत्र।', 'Term report with remarks.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'institution', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Institution name') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'examName', kind: 'text', wide: true, label: L3('মূল্যায়নের নাম', 'मूल्यांकन', 'Term / assessment'), ph: L3('প্রথম সাময়িক — ২০২৫', '…', 'First Term 2025') },
    { id: 'student', kind: 'text', label: L3('ছাত্র/ছাত্রীর নাম', 'छात्र का नाम', 'Student name') },
    { id: 'className', kind: 'text', label: L3('শ্রেণি', 'कक्षा', 'Class') },
    { id: 'section', kind: 'text', label: L3('শাখা', 'शाखा', 'Section') },
    { id: 'roll', kind: 'text', label: L3('রোল নং', 'रोल सं.', 'Roll no.') },
    { id: 'attendance', kind: 'text', label: L3('উপস্থিতি (%)', 'उपस्थिति (%)', 'Attendance (%)') },
    {
      id: 'subjects', kind: 'table', wide: true, rows: 7,
      label: L3('বিষয়-তালিকা (প্রতি সারি: বিষয় | পূর্ণমান | প্রাপ্ত নম্বর | গ্রেড)', 'विषय (विषय | पूर्णांक | प्राप्तांक | ग्रेड)', 'Subjects (name | full | got | grade)'),
      cols: [L3('বিষয়', 'विषय', 'Subject'), L3('পূর্ণমান', 'पूर्णांक', 'Full marks'), L3('প্রাপ্ত নম্বর', 'प्राप्तांक', 'Marks'), L3('গ্রেড', 'ग्रेड', 'Grade')],
    },
    { id: 'result', kind: 'text', label: L3('ফলাফল', 'परिणाम', 'Result'), ph: L3('উত্তীর্ণ / A গ্রেড', '…', 'Passed / Grade A') },
    { id: 'conduct', kind: 'text', label: L3('আচরণ', 'आचरण', 'Conduct'), ph: L3('সন্তোষজনক', '…', 'Satisfactory') },
    { id: 'remarks', kind: 'textarea', wide: true, rows: 3, label: L3('শিক্ষকের মন্তব্য', 'शिक्षक की टिप्पणी', 'Teacher\u2019s remarks') },
    ...fSign2(L3('পদবি (শ্রেণি-শিক্ষক)', 'पद (वर्ग शिक्षक)', 'Title (class teacher)'), L3('পদবি (প্রধান শিক্ষক)', 'पद (प्रधानाचार्य)', 'Title (principal)')),
  ],
  build: (v, lang, P) => {
    const rows = lines(V(v, 'subjects')).map((l) => l.split('|').map((c) => c.trim()));
    const head = [L3('বিষয়', 'विषय', 'Subject'), L3('পূর্ণমান', 'पूर्णांक', 'Full'), L3('প্রাপ্ত নম্বর', 'प्राप्तांक', 'Marks'), L3('গ্রেড', 'ग्रेड', 'Grade')]
      .map((c) => `<th style="text-align:left">${esc(tx(lang, c))}</th>`).join('');
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'institution'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10pt">${esc(V(v, 'address'))}</span>`) : '',
      buildDividerHtml('double'),
      pc(`<strong style="font-size:13pt">${esc(pick(lang, 'প্রগতি পত্র', 'प्रगতি पत्र', 'REPORT CARD'))}</strong>`, `color:${P.head}`),
      V(v, 'examName') ? pc(`<span style="font-size:11pt">${esc(V(v, 'examName'))}</span>`) : '',
      shadeBox(P, row2(
        metaRow(pick(lang, 'নাম', 'नाम', 'Name'), V(v, 'student')) + metaRow(pick(lang, 'শ্রেণি', 'कक्षा', 'Class'), V(v, 'className')) + metaRow(pick(lang, 'শাখা', 'शाखा', 'Section'), V(v, 'section')),
        metaRow(pick(lang, 'রোল', 'रोल', 'Roll'), V(v, 'roll')) + metaRow(pick(lang, 'উপস্থিতি', 'उपस्थिति', 'Attendance'), V(v, 'attendance') ? `${V(v, 'attendance')}%` : '') + metaRow(pick(lang, 'আচরণ', 'आचरण', 'Conduct'), V(v, 'conduct')),
      )),
      `<table><tr>${head}</tr>${rows.map((cells) => `<tr>${[0, 1, 2, 3].map((i) => `<td>${esc(cells[i] ?? '')}</td>`).join('')}</tr>`).join('')}</table>`,
      V(v, 'result') ? pc(`<strong style="font-size:11.5pt">${esc(pick(lang, 'ফলাফল', 'परिणाम', 'RESULT'))}: ${esc(V(v, 'result'))}</strong>`, 'margin-top:0.6em') : '',
      V(v, 'remarks') ? shadeBox(P, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'শিক্ষকের মন্তব্য:', 'शिक्षक की टिप्पणी:', 'Remarks:'))}</strong> ${esc(V(v, 'remarks'))}</p>`) : '',
      sig2(lang, P, { t: V(v, 'sign1Title'), n: '', o: '' }, { t: V(v, 'sign2Title'), n: '', o: '' }),
    ].filter(Boolean).join('');
  },
};

// ═════════════════════════ চিকিৎসা — নতুন (med) ═════════════════════════

const MEDICAL_CERT_TPL: DsTemplate = {
  id: 'medical-certificate',
  category: 'med',
  name: L3('মেডিকেল সনদ', 'चिकित्सा प्रमाणपत्र', 'Medical Certificate'),
  desc: L3('চিকিৎসকের অসুস্থতা-সনদ — পরীক্ষা-বক্তব্য, অনুপস্থিতি-মেয়াদ ও নিবন্ধন-নম্বর।', 'चिकित्सा प्रमाणपत्र।', 'Doctor\u2019s sick-leave certificate.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'clinic', kind: 'text', wide: true, label: L3('ক্লিনিক/হাসপাতালের নাম', 'क्लिनिक/अस्पताल', 'Clinic / hospital') },
    { id: 'doctor', kind: 'text', wide: true, label: L3('চিকিৎসকের নাম', 'डॉक्टर का नाम', 'Doctor\u2019s name') },
    { id: 'degrees', kind: 'text', wide: true, label: L3('ডিগ্রি', 'डिग्री', 'Degrees') },
    { id: 'regNo', kind: 'text', wide: true, label: L3('নিবন্ধন নং', 'पंजीकरण सं.', 'Registration no.') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'patient', kind: 'text', label: L3('রোগীর নাম', 'रोगी का नाम', 'Patient name') },
    { id: 'age', kind: 'text', label: L3('বয়স', 'उम्र', 'Age') },
    { id: 'sex', kind: 'text', label: L3('লিঙ্গ', 'लिंग', 'Sex') },
    { id: 'statement', kind: 'textarea', wide: true, rows: 4, label: L3('বক্তব্য', 'कथन', 'Statement'), ph: L3('রোগীর অবস্থা পরীক্ষা করে দেখা গেল যে…', '…', 'On examination, I found that…') },
    { id: 'unfitFrom', kind: 'text', label: L3('অনুপস্থিতি শুরু', 'अवकाश प्रारंभ', 'Unfit from') },
    { id: 'unfitTo', kind: 'text', label: L3('অনুপস্থিতি শেষ', 'अवकाश समाप्ति', 'Unfit until') },
    { id: 'diagnosis', kind: 'text', wide: true, label: L3('রোগ-নির্ণয় (ঐচ্ছিক)', 'निदान (वैकल्पिक)', 'Diagnosis (optional)') },
  ],
  build: (v, lang, P) => buildDesignBoxHtml(
    // চিকিৎসা-সনদও সনদ-পরিবারেরই সদস্য — প্যালেট-বর্ডার ফ্রেমে মর্যাদাপূর্ণ উপস্থাপনা
    { variant: 'box', border: P.border, fill: 'transparent', bstyle: 'solid', bwidth: 2 },
    [
    pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'clinic'))}</strong>`, `color:${P.head}`),
    pc(`<span style="font-size:11pt; color:${P.soft}">❦</span>`),
    row2(
      `<p style="text-align:left; margin:0; font-size:10.5pt"><strong>${esc(V(v, 'doctor'))}</strong></p><p style="margin:0.05em 0; font-size:9.5pt; color:${P.soft}">${esc(V(v, 'degrees'))}</p>`,
      `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
    ),
    band(pick(lang, 'মেডিকেল সনদ', 'चिकित्सा प्रमाणपত्र', 'MEDICAL CERTIFICATE'), P),
    shadeBox(P, row2(
      metaRow(pick(lang, 'রোগীর নাম', 'रोगी', 'Patient'), V(v, 'patient')) + metaRow(pick(lang, 'বয়স', 'उम्र', 'Age'), V(v, 'age')),
      metaRow(pick(lang, 'লিঙ্গ', 'लिंग', 'Sex'), V(v, 'sex')),
    )),
    `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${esc(pick(lang, 'এই মর্মে প্রত্যয়িত করা হচ্ছে যে, আমি', 'यह प्रमाणित किया जाता है कि, मैंने', 'This is to certify that I have examined'))} <strong>${esc(V(v, 'patient'))}</strong>${esc(pick(lang, '-কে পরীক্ষা করিয়াছি এবং পরিদৃষ্টে তাঁর অবস্থা —', 'को देखा है और उनकी स्थिति —', ', and in my opinion'))} <strong>${esc(V(v, 'statement'))}</strong>${V(v, 'unfitFrom') || V(v, 'unfitTo') ? ` ${esc(pick(lang, 'তিনি অক্ষম আছেন', 'वे अनुपस्थित रहेंगे', 'He/She is unfit'))} <strong>${esc(V(v, 'unfitFrom'))}</strong> — <strong>${esc(V(v, 'unfitTo'))}</strong>${pick(lang, '।', '।', '.')}` : ''}</p>`,
    V(v, 'diagnosis') ? shadeBox(P, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'রোগ-নির্ণয়:', 'निदान:', 'Diagnosis:'))}</strong> ${esc(V(v, 'diagnosis'))}</p>`) : '',
    `<p style="text-align:right; margin-top:1.6em; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'চিকিৎসকের স্বাক্ষর ও মোহর', 'डॉक्टर के हस्ताक्षर व मुहर', 'Doctor\u2019s signature & seal'))}</p>`,
    `<p style="text-align:right; margin:0.3em 0 0; font-size:11pt"><strong>${esc(V(v, 'doctor'))}</strong></p>`,
    V(v, 'regNo') ? `<p style="text-align:right; margin:0; font-size:9.5pt; color:${P.soft}">${esc(pick(lang, 'নিবন্ধন নং', 'पंजीकरण सं.', 'Reg. no.'))}: ${esc(V(v, 'regNo'))}</p>` : '',
    ].filter(Boolean).join(''),
  ),
};

// ═════════════════════════ মার্কেটিং — নতুন (promo) ═════════════════════════

const BROCHURE_TPL: DsTemplate = {
  id: 'brochure-trifold',
  category: 'promo',
  name: L3('ত্রি-ভাঁজ ব্রোশিওর', 'त्रिकोण ब्रोशर', 'Tri-fold Brochure'),
  desc: L3('তিন-স্তম্ভ প্রচার-ব্রোশিওর — পরিচিতি, সেবা-তালিকা ও যোগাযোগ-প্যানেল।', 'ब्रोशर।', 'Three-panel marketing brochure.'),
  styles: ALL_STYLES,
  defaultStyle: 'teal',
  fields: [
    { id: 'name', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'प्रतिष्ठान', 'Business name') },
    { id: 'tagline', kind: 'text', wide: true, label: L3('ট্যাগলাইন', 'टैगलाइन', 'Tagline') },
    { id: 'about', kind: 'textarea', wide: true, rows: 4, label: L3('আমাদের সম্পর্কে', 'हमारे बारे में', 'About us') },
    { id: 'offerings', kind: 'textarea', wide: true, rows: 5, label: L3('সেবা/পণ্য (প্রতি লাইনে একটি)', 'सेवाएँ (प्रति पंक्ति)', 'Products / services (one per line)') },
    { id: 'features', kind: 'textarea', wide: true, rows: 5, label: L3('কেন আমরা (প্রতি লাইনে একটি)', 'हमसे क्यों (प्रति पंक्ति)', 'Why choose us (one per line)') },
    { id: 'contactLines', kind: 'textarea', wide: true, rows: 4, label: L3('যোগাযোগ (প্রতি লাইনে একটি)', 'संपर्क (प्रति पंक्ति)', 'Contact (one per line)'), ph: L3('ঠিকানা\nমোবাইল\nইমেইল\nওয়েবসাইট', '…', 'Address\nPhone') },
  ],
  build: (v, lang, P) => {
    const col = (title: string, bodyHtml: string) =>
      `<p style="margin:0 0 0.3em; font-size:10pt; letter-spacing:1.2px; color:${P.head}"><strong>${esc(title)}</strong></p>${bodyHtml}`;
    return [
      pc(`<strong style="font-size:16pt; letter-spacing:0.8px">${esc(V(v, 'name'))}</strong>`, `color:${P.head}`),
      V(v, 'tagline') ? pc(`<em style="font-size:11pt; color:${P.soft}">${esc(V(v, 'tagline'))}</em>`) : '',
      buildDividerHtml('double'),
      buildColumnsHtml({ count: 3, gap: 18, rule: true, fill: 'balance' }, [
        col(pick(lang, 'আমাদের সম্পর্কে', 'हमारे बारे में', 'ABOUT US'), `<p style="font-size:10pt; line-height:1.75; text-align:justify">${esc(V(v, 'about'))}</p>`),
        col(pick(lang, 'সেবা ও পণ্য', 'सेवाएँ', 'WHAT WE OFFER'), `<ul>${lines(V(v, 'offerings')).map((o) => `<li style="font-size:10pt">${esc(o)}</li>`).join('')}</ul>`),
        col(pick(lang, 'কেন আমরা', 'हमसे क्यों', 'WHY CHOOSE US'), `<ul>${lines(V(v, 'features')).map((f) => `<li style="font-size:10pt">${esc(f)}</li>`).join('')}</ul>`),
      ].join('')),
      buildDividerHtml('single'),
      shadeBox(P, `<p style="margin:0.2em 0; text-align:center; font-size:10.5pt">${lines(V(v, 'contactLines')).map((c) => esc(c)).join('  ·  ')}</p>`),
    ].filter(Boolean).join('');
  },
};

const NEWSLETTER_TPL: DsTemplate = {
  id: 'newsletter',
  category: 'promo',
  name: L3('নিউজলেটার', 'न्यूज़लेटर', 'Newsletter'),
  desc: L3('প্রতিষ্ঠানের সংবাদ-পত্র — মাস্টহেড, প্রধান-সংবাদ, দুই-স্তম্ভ আয়োজন ও হাইলাইট।', 'न्यूज़लेटर।', 'Masthead newsletter with highlights.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'name', kind: 'text', wide: true, label: L3('নিউজলেটারের নাম', 'न्यूज़लेटर का नाम', 'Newsletter name') },
    { id: 'issue', kind: 'text', label: L3('সংখ্যা', 'अंक', 'Issue'), ph: L3('সংখ্যা ১২', '…', 'Issue 12') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'leadHeadline', kind: 'text', wide: true, label: L3('প্রধান শিরোনাম', 'मुख्य शीर्षक', 'Lead headline') },
    { id: 'leadBody', kind: 'textarea', wide: true, rows: 4, label: L3('প্রধান সংবাদ', 'मुख्य समाचार', 'Lead article') },
    { id: 'headline2', kind: 'text', wide: true, label: L3('দ্বিতীয় শিরোনাম', 'दूसरा शीर्षক', 'Second headline') },
    { id: 'body2', kind: 'textarea', wide: true, rows: 4, label: L3('দ্বিতীয় সংবাদ', 'दूसरा समाचार', 'Second article') },
    { id: 'headline3', kind: 'text', wide: true, label: L3('তৃতীয় শিরোনাম', 'तीसरा शीर्षक', 'Third headline') },
    { id: 'body3', kind: 'textarea', wide: true, rows: 4, label: L3('তৃতীয় সংবাদ', 'तीसरा समाचार', 'Third article') },
    { id: 'highlights', kind: 'textarea', wide: true, rows: 3, label: L3('এক-নজরে (প্রতি লাইনে একটি)', 'एक नज़र में', 'Highlights (one per line)') },
    { id: 'contact', kind: 'text', wide: true, label: L3('যোগাযোগ/সম্পাদক (ঐচ্ছিক)', 'संपादक (वैकल्पिक)', 'Editor / contact (optional)') },
  ],
  build: (v, lang, P) => [
    pc(`<strong style="font-size:18pt; letter-spacing:1px">${esc(V(v, 'name'))}</strong>`, `color:${P.head}`),
    row2(
      `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'issue'))}</p>`,
      `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date'))}</p>`,
    ),
    buildDividerHtml('double'),
    V(v, 'leadHeadline') ? `<h3 style="margin:0.5em 0 0.3em; font-size:14pt; color:${P.head}">${esc(V(v, 'leadHeadline'))}</h3>` : '',
    `<p style="line-height:1.9; text-align:justify">${esc(V(v, 'leadBody'))}</p>`,
    buildDividerHtml('single'),
    buildColumnsHtml({ count: 2, gap: 24, rule: true, fill: 'balance' }, [
      V(v, 'headline2') ? `<p style="margin:0 0 0.25em; font-size:11.5pt; color:${P.head}"><strong>${esc(V(v, 'headline2'))}</strong></p>` : '',
      `<p style="font-size:10.5pt; line-height:1.8; text-align:justify">${esc(V(v, 'body2'))}</p>`,
      V(v, 'headline3') ? `<p style="margin:0.6em 0 0.25em; font-size:11.5pt; color:${P.head}"><strong>${esc(V(v, 'headline3'))}</strong></p>` : '',
      `<p style="font-size:10.5pt; line-height:1.8; text-align:justify">${esc(V(v, 'body3'))}</p>`,
    ].join('')),
    lines(V(v, 'highlights')).length
      ? shadeBox(P, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'এক-নজরে:', 'एक नज़र में:', 'In brief:'))}</strong></p><ul>${lines(V(v, 'highlights')).map((h) => `<li>${esc(h)}</li>`).join('')}</ul>`)
      : '',
    V(v, 'contact') ? pc(`<span style="font-size:9.5pt; color:${P.soft}">${esc(V(v, 'contact'))}</span>`, 'margin-top:0.6em') : '',
  ].filter(Boolean).join(''),
};

const PRESS_RELEASE_TPL: DsTemplate = {
  id: 'press-release',
  category: 'promo',
  name: L3('প্রেস বিজ্ঞপ্তি', 'प्रेस विज्ञप्ति', 'Press Release'),
  desc: L3('সংবাদ-মাধ্যমের জন্য ঘোষণা — শিরোনাম, ডেটলাইন, মূল-বক্তব্য ও যোগাযোগ-ব্লক।', 'प्रेस विज्ञप्ति।', 'Media announcement release.'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান', 'संस्था', 'Organization') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'city', kind: 'text', label: L3('শহর (ডেটলাইন)', 'शहर', 'City (dateline)') },
    { id: 'headline', kind: 'text', wide: true, label: L3('শিরোনাম', 'शीर्षक', 'Headline') },
    { id: 'subhead', kind: 'text', wide: true, label: L3('উপ-শিরোনাম (ঐচ্ছিক)', 'उप-शीर्षक', 'Sub-headline (optional)') },
    { id: 'body1', kind: 'textarea', wide: true, rows: 5, label: L3('মূল সংবাদ (১ম অনুচ্ছেদ)', 'मुख्य समाचार', 'Lead paragraph') },
    { id: 'body2', kind: 'textarea', wide: true, rows: 5, label: L3('বিস্তারিত (২য় অনুচ্ছেদ)', 'विवरण', 'Details paragraph') },
    { id: 'about', kind: 'textarea', wide: true, rows: 3, label: L3('প্রতিষ্ঠান পরিচিতি (About)', 'संस्था परिचय', 'About the organization') },
    { id: 'contactLines', kind: 'textarea', wide: true, rows: 3, label: L3('মিডিয়া-যোগাযোগ (প্রতি লাইনে একটি)', 'मीडिया संपर्क', 'Media contact (one per line)') },
  ],
  build: (v, lang, P) => [
    pc(`<span style="font-size:9.5pt; letter-spacing:2.5px; color:${P.soft}">${esc(pick(lang, 'সঙ্গে-সঙ্গে প্রকাশযোগ্য', 'तुरंत प्रकाशन हेतु', 'FOR IMMEDIATE RELEASE'))}</span>`),
    pc(`<strong style="font-size:12pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
    buildDividerHtml('double'),
    V(v, 'headline') ? `<h3 style="margin:0.4em 0 0.2em; font-size:15pt; color:${P.head}; text-align:center">${esc(V(v, 'headline'))}</h3>` : '',
    V(v, 'subhead') ? pc(`<em style="font-size:11.5pt; color:${P.soft}">${esc(V(v, 'subhead'))}</em>`) : '',
    `<p style="margin-top:0.9em; line-height:1.95; text-align:justify">${V(v, 'city') || V(v, 'date') ? `<strong>${esc([V(v, 'city'), V(v, 'date')].filter(Boolean).join(', '))}</strong> — ` : ''}${esc(V(v, 'body1'))}</p>`,
    `<p style="line-height:1.95; text-align:justify">${esc(V(v, 'body2'))}</p>`,
    V(v, 'about') ? shadeBox(P, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'প্রতিষ্ঠান সম্পর্কে:', 'संस्था के बारे में:', 'About:'))}</strong> ${esc(V(v, 'about'))}</p>`) : '',
    lines(V(v, 'contactLines')).length
      ? `<p style="margin-top:0.8em"><strong>${esc(pick(lang, 'মিডিয়া-যোগাযোগ:', 'मीडिया संपर्क:', 'Media contact:'))}</strong></p>${lines(V(v, 'contactLines')).map((c) => `<p style="margin:0.1em 0; font-size:10.5pt">${esc(c)}</p>`).join('')}`
      : '',
    pc(`<span style="font-size:11pt; color:${P.soft}">###</span>`, 'margin-top:1em'),
  ].filter(Boolean).join(''),
};

// ═════════════════════════ বৈশ্বিক সম্পূর্ণতা — প্রস্তাব/ক্যালেন্ডার/বিজনেস-কার্ড ═════════════════════════

const PROJECT_PROPOSAL_TPL: DsTemplate = {
  id: 'project-proposal',
  category: 'office',
  name: L3('প্রকল্প প্রস্তাবনা', 'परियोजना प्रस्ताव', 'Project Proposal'),
  desc: L3('দরপত্র/অনুদানের প্রস্তাব — উদ্দেশ্য, পরিসর, ডেলিভারেবল, সময়সূচি-টেবিল ও বাজেট।', 'प्रस्ताव — उद्देश्य, समय-सारिणी, बजट।', 'Client-facing proposal with timeline and budget.'),
  styles: ALL_STYLES,
  defaultStyle: 'green',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রস্তাবক প্রতিষ্ঠান', 'प्रस्तावक संस्था', 'Submitting organization') },
    { id: 'projectTitle', kind: 'text', wide: true, label: L3('প্রকল্পের নাম', 'परियोजना का नाम', 'Project title') },
    { id: 'client', kind: 'text', wide: true, label: L3('ক্লায়েন্ট/অনুদানদাতা', 'क्लाइंट/दाता', 'Client / funder') },
    { id: 'preparedBy', kind: 'text', label: L3('প্রস্তুতকারী', 'प्रस्तुतकर्ता', 'Prepared by') },
    { id: 'date', kind: 'date', label: DSB.date },
    { id: 'duration', kind: 'text', label: L3('প্রকল্প-মেয়াদ', 'अवधि', 'Duration') },
    { id: 'budget', kind: 'text', wide: true, label: L3('বাজেট (মোট)', 'बजट', 'Total budget') },
    { id: 'objectives', kind: 'textarea', wide: true, rows: 4, label: L3('উদ্দেশ্য (প্রতি লাইনে একটি)', 'उद्देश्य (प्रति पंक्ति)', 'Objectives (one per line)') },
    { id: 'scope', kind: 'textarea', wide: true, rows: 4, label: L3('কাজের পরিসর', 'कार्य का दायरा', 'Scope of work') },
    { id: 'deliverables', kind: 'textarea', wide: true, rows: 4, label: L3('ডেলিভারেবল (প্রতি লাইনে একটি)', 'डिलिवरेबल (प्रति पंक्ति)', 'Deliverables (one per line)') },
    {
      id: 'timeline', kind: 'table', wide: true, rows: 5,
      label: L3('সময়সূচি (প্রতি সারি: ধাপ | সময়কাল | ফলাফল)', 'समय-सारिणी (चरण | अवधि | परिणाम)', 'Timeline (phase | period | output)'),
      cols: [L3('ধাপ', 'चरण', 'Phase'), L3('সময়কাল', 'अवधि', 'Period'), L3('ফলাফল', 'परिणाम', 'Output')],
    },
    { id: 'terms', kind: 'textarea', wide: true, rows: 3, label: L3('শর্তাবলি (প্রতি লাইনে একটি)', 'शर्तें (प्रति पंक्ति)', 'Terms (one per line)') },
  ],
  build: (v, lang, P) => {
    const tl = lines(V(v, 'timeline')).map((l) => l.split('|').map((c) => c.trim()));
    return [
      pc(`<strong style="font-size:12.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`),
      band(V(v, 'projectTitle') || pick(lang, 'প্রকল্প প্রস্তাবনা', 'परियोजना प्रस्ताव', 'PROJECT PROPOSAL'), P),
      `<table style="width:100%">${[
        [V(v, 'client'), pick(lang, 'ক্লায়েন্ট/অনুদানদাতা', 'क्लाइंट', 'Client')],
        [V(v, 'preparedBy'), pick(lang, 'প্রস্তুতকারী', 'प्रस्तुतकर्ता', 'Prepared by')],
        [V(v, 'duration'), pick(lang, 'মেয়াদ', 'अवधि', 'Duration')],
        [V(v, 'budget'), pick(lang, 'বাজেট', 'बजट', 'Budget')],
      ].map(([val, lab]) => val ? `<tr><td data-border="none" style="border:none; width:22%; vertical-align:top"><p style="margin:0.3em 0; font-size:10.5pt; color:${P.soft}"><strong>${esc(lab)}</strong></p></td><td data-border="none" style="border:none; vertical-align:top"><p style="margin:0.3em 0; font-size:11pt">${esc(val)}</p></td></tr>` : '').join('')}</table>`,
      V(v, 'date') ? pc(`<span style="font-size:10pt; color:${P.soft}">${esc(V(v, 'date'))}</span>`) : '',
      buildDividerHtml('single'),
      lines(V(v, 'objectives')).length
        ? secH(pick(lang, 'উদ্দেশ্যসমূহ', 'उद्देश्य', 'OBJECTIVES'), P) + `<ol style="margin:0.2em 0">${lines(V(v, 'objectives')).map((o) => `<li style="font-size:11pt; line-height:1.8">${esc(o)}</li>`).join('')}</ol>`
        : '',
      V(v, 'scope') ? secH(pick(lang, 'কাজের পরিসর', 'कार्य का दायरा', 'SCOPE OF WORK'), P) + `<p style="margin:0.2em 0; font-size:10.5pt; line-height:1.9; text-align:justify">${esc(V(v, 'scope'))}</p>` : '',
      lines(V(v, 'deliverables')).length
        ? secH(pick(lang, 'ডেলিভারেবল', 'डिलिवरेबल', 'DELIVERABLES'), P) + `<ul style="margin:0.2em 0">${lines(V(v, 'deliverables')).map((d) => `<li style="font-size:11pt; line-height:1.8">${esc(d)}</li>`).join('')}</ul>`
        : '',
      tl.length ? secH(pick(lang, 'সময়সূচি', 'समय-सारिणी', 'TIMELINE'), P) + `<table style="width:100%"><tr>${[pick(lang, 'ধাপ', 'चरण', 'Phase'), pick(lang, 'সময়কাল', 'अवधि', 'Period'), pick(lang, 'ফলাফল', 'परिणाम', 'Output')].map((h) => `<th style="text-align:left">${esc(h)}</th>`).join('')}</tr>${tl.map((c) => `<tr>${c.map((cell) => `<td>${esc(cell ?? '')}</td>`).join('')}</tr>`).join('')}</table>` : '',
      lines(V(v, 'terms')).length
        ? shadeBox(P, `<p style="margin:0.2em 0"><strong>${esc(pick(lang, 'শর্তাবলি:', 'शर्तें:', 'Terms:'))}</strong></p><ul>${lines(V(v, 'terms')).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`)
        : '',
      `<p style="margin-top:2em; text-align:right; font-size:10pt; color:${P.soft}">${esc(pick(lang, 'প্রস্তুতকারী', 'प्रस्तुतकर्ता', 'Prepared by'))}</p><p style="text-align:right; margin:0.3em 0 0; font-size:11pt"><strong>${esc(V(v, 'preparedBy'))}</strong></p>`,
    ].filter(Boolean).join('');
  },
};

/** মাস-নাম (ক্যালেন্ডার) — তিন ভাষায় */
const DS_MONTHS: Record<Lang, string[]> = {
  bn: ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'],
  hi: ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
};

const bnDigits = (n: number): string => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

/** বর্তমান মাস-লেবেল (ক্যালেন্ডারের নমুনা-মান) */
function demoMonthLabel(lang: Lang): string {
  const d = new Date();
  const label = `${DS_MONTHS[lang][d.getMonth()]} ${lang === 'bn' ? bnDigits(d.getFullYear()) : d.getFullYear()}`;
  return label;
}

/** "নভেম্বর ২০২৫" / "नवंबर 2025" / "November 2025" → {y, m} — না পড়লে বর্তমান মাস */
function parseMonthYear(s: string): { y: number; m: number } {
  const norm = String(s ?? '').replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
  const ym = norm.match(/(\d{4})/);
  const y = ym ? Number(ym[1]) : new Date().getFullYear();
  const low = norm.toLowerCase();
  let m = -1;
  for (const list of [DS_MONTHS.bn, DS_MONTHS.hi, DS_MONTHS.en]) {
    m = list.findIndex((mo) => low.includes(mo.toLowerCase()));
    if (m >= 0) break;
  }
  if (m < 0) m = new Date().getMonth();
  return { y, m };
}

const CALENDAR_TPL: DsTemplate = {
  id: 'calendar-month',
  category: 'office',
  name: L3('মাসিক ক্যালেন্ডার', 'मासिक कैलेंडर', 'Monthly Calendar'),
  desc: L3('সত্যিকারের মাস-গ্রিড — মাস-বছর লিখলেই বার-ক্যালকুলেশনসহ ক্যালেন্ডার, অনুষ্ঠান-চিহ্নসহ।', 'सही महीने का ग्रिड।', 'Real month grid — auto weekdays, event marks.'),
  styles: ALL_STYLES,
  defaultStyle: 'royal',
  fields: [
    { id: 'office', kind: 'text', wide: true, label: L3('প্রতিষ্ঠান (ঐচ্ছিক)', 'संस्था', 'Organization (optional)') },
    { id: 'title', kind: 'text', wide: true, label: L3('শিরোনাম (ঐচ্ছিক)', 'शीर्षक', 'Title (optional)'), ph: L3('কার্যক্রম ক্যালেন্ডার', 'कार्यक्रम कैलेंडर', 'Activity calendar') },
    { id: 'month', kind: 'text', wide: true, label: L3('মাস ও বছর', 'माह व वर्ष', 'Month & year'), ph: L3('নভেম্বর ২০২৫', 'नवंबर 2025', 'November 2025') },
    { id: 'events', kind: 'textarea', wide: true, rows: 4, label: L3('অনুষ্ঠান (প্রতি লাইনে: দিন : লেখা)', 'कार्यक्रम (दिन : विवरण)', 'Events (one per line: day : label)'), ph: L3('৫: সমন্বয় সভা\n১২: প্রশিক্ষণ', '5: सभा', '5: Team meeting') },
    { id: 'note', kind: 'text', wide: true, label: L3('নোট (ঐচ্ছিক)', 'नोट', 'Note (optional)') },
  ],
  build: (v, lang, P) => {
    const { y, m } = parseMonthYear(V(v, 'month'));
    const firstDay = new Date(y, m, 1).getDay();
    const daysIn = new Date(y, m + 1, 0).getDate();
    // অনুষ্ঠান — "৫: সমন্বয় সভা" ধাঁচ
    const evMap = new Map<number, string[]>();
    for (const line of lines(V(v, 'events'))) {
      const norm = line.replace(/[০-৯]/g, (d) => String('০১২৩৪৫৬৭৮৯'.indexOf(d)));
      const em = norm.match(/^\s*(\d{1,2})\s*[:\-–]\s*(.+)$/);
      if (em) {
        const day = Number(em[1]);
        if (day >= 1 && day <= daysIn) evMap.set(day, [...(evMap.get(day) ?? []), line.replace(/^\s*[০-৯\d]+\s*[:\-–]\s*/, '')]);
      }
    }
    const week = lang === 'bn'
      ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি']
      : lang === 'hi'
        ? ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const fmt = (n: number) => (lang === 'bn' ? bnDigits(n) : String(n));
    const rows: string[] = [];
    for (let r = 0; r < 6; r++) {
      const tds: string[] = [];
      let lastDay = 0;
      for (let c = 0; c < 7; c++) {
        const day = r * 7 + c - firstDay + 1;
        if (day < 1 || day > daysIn) { tds.push('<td></td>'); continue; }
        lastDay = day;
        // দিনে ৩টির বেশি অনুষ্ঠান ঘরে না-আঁটাক — বাকিগুলোর সংখ্যা-নির্দেশ
        // (পূর্ণ তালিকা নিচে ছাপা হয়; নইলে ৬-সারির গ্রিড পাতা উপচে পড়ে)
        const evs = evMap.get(day) ?? [];
        const shown = evs.slice(0, 3);
        const extra = evs.length - shown.length;
        const ev = shown.map((e) => `<p style="margin:0.1em 0 0; font-size:8pt; line-height:1.4; color:${P.head}">${esc(e)}</p>`).join('')
          + (extra > 0 ? `<p style="margin:0.1em 0 0; font-size:8pt; color:${P.soft}">+${fmt(extra)} ${pick(lang, 'আরও', 'और', 'more')}</p>` : '');
        tds.push(`<td style="height:58px; vertical-align:top; text-align:left"><p style="margin:0.1em 0 0; font-size:10pt"><strong>${fmt(day)}</strong></p>${ev}</td>`);
      }
      rows.push(`<tr>${tds.join('')}</tr>`);
      if (lastDay >= daysIn) break;
    }
    return [
      V(v, 'office') ? pc(`<strong style="font-size:11.5pt; letter-spacing:0.4px">${esc(V(v, 'office'))}</strong>`, `color:${P.head}`) : '',
      pc(`<strong style="font-size:14pt; letter-spacing:1px">${esc(V(v, 'title') || '')}</strong>`, `color:${P.head}`),
      pc(`<span style="font-size:13pt; color:${P.soft}">${esc(V(v, 'month') || `${DS_MONTHS[lang][m]} ${lang === 'bn' ? bnDigits(y) : y}`)}</span>`),
      buildDividerHtml('single'),
      `<table style="width:100%"><tr>${week.map((w) => `<th style="text-align:center">${esc(w)}</th>`).join('')}</tr>${rows.join('')}</table>`,
      lines(V(v, 'events')).length
        ? `<p style="margin-top:0.7em; font-size:9.5pt; color:${P.soft}">${esc(pick(lang, 'অনুষ্ঠান-তালিকা:', 'कार्यक्रम:', 'Events:'))} ${lines(V(v, 'events')).map((e) => esc(e)).join(' · ')}</p>`
        : '',
      V(v, 'note') ? pc(`<span style="font-size:9.5pt; color:${P.soft}">${esc(V(v, 'note'))}</span>`, 'margin-top:0.4em') : '',
    ].filter(Boolean).join('');
  },
};

const BUSINESS_CARD_TPL: DsTemplate = {
  id: 'business-card',
  category: 'promo',
  name: L3('বিজনেস কার্ড', 'विज़नेस कार्ड', 'Business Card'),
  desc: L3('পরিচয়-পত্রিকা — সামনের পিঠে নাম-পদবি-যোগাযোগ, উল্টা পিঠে মনোগ্রাম; কার্ড-বক্স নকশা।', 'परिचय-पत्रिका।', 'Front + back visiting card design.'),
  styles: ALL_STYLES,
  defaultStyle: 'graphite',
  fields: [
    { id: 'company', kind: 'text', wide: true, label: L3('প্রতিষ্ঠানের নাম', 'संस्था', 'Company name') },
    { id: 'tagline', kind: 'text', wide: true, label: L3('ট্যাগলাইন (ঐচ্ছিক)', 'टैगलाइन', 'Tagline (optional)') },
    { id: 'name', kind: 'text', wide: true, label: L3('ব্যক্তির নাম', 'नाम', 'Person name') },
    { id: 'position', kind: 'text', wide: true, label: L3('পদবি', 'पद', 'Position') },
    { id: 'phone', kind: 'text', label: L3('ফোন', 'फ़ोन', 'Phone') },
    { id: 'email', kind: 'text', label: L3('ইমেইল', 'ईमेल', 'Email') },
    { id: 'address', kind: 'text', wide: true, label: L3('ঠিকানা', 'पता', 'Address') },
    { id: 'website', kind: 'text', wide: true, label: L3('ওয়েবসাইট', 'वेबसाइट', 'Website') },
  ],
  build: (v, lang, P) => {
    const mono = (V(v, 'company') || '●').split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
    const contacts = [V(v, 'phone'), V(v, 'email'), V(v, 'website')].filter(Boolean);
    const front = buildDesignBoxHtml(
      { variant: 'rounded', border: P.border, fill: 'transparent', bstyle: 'solid', bwidth: 1.5 },
      [
        pc(`<strong style="font-size:14pt; letter-spacing:1.2px">${esc(V(v, 'company'))}</strong>`, `color:${P.head}; background:${P.band}; border-bottom:2px solid ${P.border}; padding:8px 10px`),
        V(v, 'tagline') ? pc(`<em style="font-size:9.5pt; color:${P.soft}">${esc(V(v, 'tagline'))}</em>`, 'margin-top:0.25em') : '',
        row2(
          [
            `<p style="text-align:left; margin:0.6em 0 0; font-size:12.5pt"><strong>${esc(V(v, 'name'))}</strong></p>`,
            V(v, 'position') ? `<p style="text-align:left; margin:0.05em 0; font-size:10pt; color:${P.soft}">${esc(V(v, 'position'))}</p>` : '',
          ].join(''),
          contacts.map((c) => `<p style="text-align:right; margin:0.15em 0; font-size:9.5pt; color:${P.ink}">${esc(c)}</p>`).join(''),
          55, 45,
        ),
        V(v, 'address') ? `<p style="margin:0.4em 0 0.3em; font-size:9pt; color:${P.soft}; border-top:1px solid ${P.border}; padding-top:4px; text-align:center">${esc(V(v, 'address'))}</p>` : '',
      ].join(''),
    );
    const back = buildDesignBoxHtml(
      { variant: 'shaded', border: P.border, fill: P.band, bstyle: 'solid', bwidth: 1 },
      [
        pc(`<strong style="font-size:22pt; letter-spacing:2px">${esc(mono)}</strong>`, `color:${P.head}; margin-top:0.4em`),
        pc(`<span style="font-size:11pt; letter-spacing:0.8px">${esc(V(v, 'company'))}</span>`, `color:${P.ink}`),
        V(v, 'tagline') ? pc(`<em style="font-size:9pt; color:${P.soft}">${esc(V(v, 'tagline'))}</em>`, 'margin-bottom:0.3em') : '',
      ].join(''),
    );
    return [
      pc(`<span style="font-size:9pt; letter-spacing:2px; color:${P.soft}">${esc(pick(lang, 'সামনের পিঠ', 'सामने का पक्ष', 'FRONT'))}</span>`),
      front,
      `<p style="margin-top:0.5em"></p>`,
      pc(`<span style="font-size:9pt; letter-spacing:2px; color:${P.soft}">${esc(pick(lang, 'উল্টা পিঠ', 'पीछे का पक्ष', 'BACK'))}</span>`, 'margin-top:0.6em'),
      back,
    ].join('');
  },
};

// ═════════════════════════ নিবন্ধিত টেমপ্লেট ═════════════════════════

/** সব টেমপ্লেট — ক্যাটাগরি-ক্রম অনুযায়ী (৫৫টি) */
export const DS_TEMPLATES: DsTemplate[] = [
  // চাকরি ও ক্যারিয়ার (career) — বৈশ্বিক
  RESUME_MODERN_TPL, RESUME_CLASSIC_TPL, COVER_LETTER_TPL, RECOMMENDATION_TPL, RESIGNATION_TPL,
  // ব্যবসা ও অফিস (office) — বৈশ্বিক
  LETTERHEAD_TPL, MEMO_TPL, MEETING_AGENDA_TPL, MEETING_MINUTES_TPL, NOTICE_TPL, OFFICE_ORDER_TPL, OFFICIAL_LETTER_TPL, REPORT_TPL,
  PROJECT_PROPOSAL_TPL, CALENDAR_TPL,
  // ইনভয়েস ও আর্থিক (finance) — বৈশ্বিক
  INVOICE_TPL, QUOTATION_TPL, PURCHASE_ORDER_TPL, MONEY_RECEIPT_TPL,
  // আইনি ও চুক্তি (legal) — বৈশ্বিক
  AGREEMENT_TPL, RENTAL_AGREEMENT_TPL, EMPLOYMENT_CONTRACT_TPL, NDA_TPL, AFFIDAVIT_TPL,
  // সনদ ও পুরস্কার (cert) — বৈশ্বিক
  AWARD_TPL, CERT_APPRECIATION_TPL, CERT_PARTICIPATION_TPL, CERT_TRAINING_TPL,
  // শিক্ষা ও একাডেমিক (edu) — বৈশ্বিক
  CLASS_ROUTINE_TPL, EXAM_ROUTINE_TPL, MARKSHEET_TPL, REPORT_CARD_TPL, ADMISSION_TPL, LESSON_PLAN_TPL,
  // অনুষ্ঠান ও আমন্ত্রণ (event) — বৈশ্বিক
  INVITATION_TPL, WEDDING_TPL, PROGRAM_TPL,
  // চিকিৎসা ও স্বাস্থ্য (med) — বৈশ্বিক
  PRESCRIPTION_TPL, MEDICAL_CERT_TPL,
  // মার্কেটিং ও প্রচার (promo) — বৈশ্বিক
  POSTER_TPL, FLYER_TPL, BROCHURE_TPL, BUSINESS_CARD_TPL, NEWSLETTER_TPL, PRESS_RELEASE_TPL,
  // আঞ্চলিক সংগ্রহ — বাংলাদেশ ও ভারত (regional)
  GENERAL_APP_TPL, RESIDENCE_TPL, CHARACTER_TPL, UNMARRIED_TPL, INCOME_TPL, HEIR_TPL,
  MUTATION_TPL, GIFT_TPL, PARTITION_TPL, SALE_TPL,
];

export function dsTemplateById(id: string): DsTemplate | undefined {
  return DS_TEMPLATES.find((t) => t.id === id);
}

// ─── নির্মাতা ───

/** টেমপ্লেট + মান → সম্পূর্ণ এডিটর-বৈধ HTML */
export function buildDsHtml(tpl: DsTemplate, values: DsValues, lang: Lang, styleId: string): string {
  const style = styleById(styleId, tpl.defaultStyle);
  return tpl.build(values, lang, style.P);
}

/**
 * প্রিভিউ-নির্মাণ — কাঁচা এডিটর-HTML-এ কাস্টম নোডের (doc-textbox/doc-columns)
 * দৃশ্যমান সাজ data-attrs থেকে ইনলাইন style-এ ঢালাই করা। ফলে প্রিভিউ কাঁচা
 * dangerouslySetInnerHTML-এও হুবহু আসল-পাতার মতো দেখায় (p-র ইনলাইন স্টাইলসহ),
 * যেমন প্রশ্নপত্র-প্রিভিউ চুক্তি।
 */
export function dsPreviewInline(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
    const root = doc.getElementById('r');
    if (!root) return html;
    root.querySelectorAll('div.doc-textbox').forEach((el) => {
      const bwidthRaw = el.getAttribute('data-bwidth');
      const style = docBoxStyleText({
        variant: (el.getAttribute('data-variant') ?? 'rounded') as DocBoxVariant,
        border: el.getAttribute('data-border') ?? undefined,
        fill: el.getAttribute('data-fill') ?? undefined,
        bstyle: (el.getAttribute('data-bstyle') ?? undefined) as DocBoxAttrs['bstyle'],
        bwidth: bwidthRaw ? Number(bwidthRaw) : undefined,
      });
      el.setAttribute('style', style);
    });
    root.querySelectorAll('div.doc-columns').forEach((el) => {
      el.setAttribute('style', columnsStyleText({ ...parseColumnsAttrs(el) }));
    });
    // টেবিল-সেলের এডিটর-চুক্তি অ্যাট্রিবিউট (table-cell-bg.ts-এর মতো) — প্রিভিউ-শীটের
    // সাধারণ td/th-বর্ডার/ধূসর-হেডার রুল কাঁচা HTML-এ ভুল সাজ দেখাত; data-bg/
    // data-border="none"-কে ইনলাইন style-এ ঢেলে প্রিভিউ হুবহু ঢোকানো পাতার মতো দেখায়
    root.querySelectorAll('td, th').forEach((el) => {
      const style = el.getAttribute('style') ?? '';
      const add: string[] = [];
      if (el.getAttribute('data-border') === 'none' && !/(^|;|\s)border\s*:/.test(style)) add.push('border:none');
      const bg = el.getAttribute('data-bg');
      if (bg) add.push(`background-color:${bg}`);
      if (add.length) el.setAttribute('style', `${style ? `${style}${style.endsWith(';') ? '' : ';'}` : ''}${add.join(';')}`);
    });
    return root.innerHTML;
  } catch {
    return html;
  }
}
