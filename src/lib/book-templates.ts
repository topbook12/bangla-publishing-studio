/**
 * বই-ব্লুপ্রিন্ট ক্যাটাগরি — টেমপ্লেট স্টোরের "বইয়ের ডিজাইন" সংগ্রহ।
 *
 * প্রতিটি ব্লুপ্রিন্ট = একটি ধাঁচের (genre) সম্পূর্ণ পেশাদার বই-ডিজাইন:
 *   • settings  — কাগজ, ফন্ট, লাইন-হাইট, হেডার/ফুটার, বর্ডার ইত্যাদি (বইয়ের পরিবেশ)
 *   • pages     — প্রি-ডিজাইন করা পাতার সেট (হাফ-টাইটেল → শিরোনাম → কপিরাইট → সূচি →
 *                 অধ্যায় সূচনা → নমুনা লেখা → শেষ পাতা), সবই এডিটরে সম্পূর্ণ এডিটেবল
 *
 * ডিজাইন-ভাষা (প্রিমিয়াম প্রকাশনা-গৃহের রীতি):
 *   • প্রতিটি genre-এর নিজস্ব কালি-প্যালেট — রাজকীয় মেরুন+সোনালি, বেগুনি+সোনালি, গাঢ় টিল+সোনালি,
 *     বন-সবুজ, সেপিয়া সংরক্ষণাগার, পাথর-কালি — নীল/ইন্ডিগো প্রাইমারি নয়
 *   • টাইপোগ্রাফিক অলংকরণ — ❦ ❧ ❖ ✦ ❁ ☾ ━ ⁂ শোভাযাত্রা, অক্ষর-ফাঁক করা ক্যাপস ক্যাপশন
 *   • ছায়া-ব্যান্ড শিরোনাম, স্তরিত ফ্রেম (ডাবল+সরু সোনালি), ড্রপ-ক্যাপ, দৃশ্য-বিরতির ⁂
 *
 * HTML নিয়ম (এডিটর স্কিমা-বৈধ — page-templates.ts-এর মতোই):
 *   paragraph/heading + inline style, fancyDivider hr, callout-box, doc-textbox,
 *   toc-block, table, blockquote, ul/ol। কোনো বাইরের রিসোর্স নয়, কোনো গ্রেডিয়েন্ট নয়।
 */

import type {
  DocumentSettings,
  HeaderFooterStyle,
  PaperColor,
  PaperSizeId,
  PageData,
} from './types';
import {
  buildCalloutHtml,
  buildDesignBoxHtml,
  buildTocHtml,
  type CalloutVariant,
  type DocBoxVariant,
} from './nodes-html';

export { buildCalloutHtml, buildDesignBoxHtml, buildTocHtml };
export type { CalloutVariant, DocBoxVariant };

/** ব্লুপ্রিন্টের genre শ্রেণি — স্টোরের সাইডবার ফিল্টার */
export type BlueprintGenre =
  | 'literature'
  | 'poetry'
  | 'textbook'
  | 'science'
  | 'children'
  | 'cooking'
  | 'history'
  | 'coaching'
  | 'journal'
  | 'report'
  | 'magazine'
  | 'islamic';

export const BLUEPRINT_GENRE_META: Record<BlueprintGenre, { label: string; emoji: string }> = {
  literature: { label: 'সাহিত্য', emoji: '📖' },
  poetry: { label: 'কবিতা', emoji: '🪶' },
  textbook: { label: 'পাঠ্যবই', emoji: '🎓' },
  science: { label: 'বিজ্ঞান', emoji: '🔬' },
  children: { label: 'শিশু', emoji: '🧸' },
  cooking: { label: 'রান্না', emoji: '🍳' },
  history: { label: 'ইতিহাস-জীবনী', emoji: '🏛️' },
  coaching: { label: 'কোচিং-সহায়িকা', emoji: '📝' },
  journal: { label: 'ডায়েরি-জার্নাল', emoji: '📔' },
  report: { label: 'প্রতিবেদন', emoji: '📊' },
  magazine: { label: 'ম্যাগাজিন', emoji: '🗞️' },
  islamic: { label: 'ইসলামিক', emoji: '🕌' },
};

/** ব্লুপ্রিন্ট প্রয়োগের দুই মোড */
export type BlueprintApplyMode = 'replace' | 'insert';

export interface BookBlueprintSettings {
  paperSize?: PaperSizeId;
  paperColor?: PaperColor;
  defaultFont?: string;
  defaultFontSize?: number;
  lineHeight?: number;
  paragraphSpacing?: number;
  headerStyle?: HeaderFooterStyle;
  /** হেডার/ফুটার/বর্ডারের অ্যাকসেন্ট রং */
  accentColor?: string;
  pageBorder?: DocumentSettings['pageBorder'];
  headerLeft?: string;
  headerCenter?: string;
  headerRight?: string;
}

export interface BookBlueprintPage {
  html: string;
  /** অধ্যায়-সূচনা ধাঁচের পাতা — হেডার/ফুটার/পেজ-নম্বর লুকানো */
  noChrome?: boolean;
  /** নকশা-পাতা (অটো-ফ্লো ভাঙবে না; ব্যবহারকারী লিখলেই খুলে যায়) — ডিফল্ট true */
  flowLock?: boolean;
}

export interface BookBlueprint {
  id: string;
  name: string;
  desc: string;
  /** কার্ড প্রিভিউয়ের অ্যাকসেন্ট */
  accent: string;
  genre: BlueprintGenre;
  /** কার্ডে দেখানো ছোট বৈশিষ্ট্য-ট্যাগ (কী কী পাতা আসবে) */
  tags: string[];
  settings: BookBlueprintSettings;
  pages: BookBlueprintPage[];
}

// ─────────────────────────── সাধারণ সহায়ক ───────────────────────────

/** উল্লম্ব স্পেসার — পাতার মাঝবরাবর নামানোর জন্য (ফিট-ইঞ্জিন দরকারমতো মুছে দেয়) */
export const sp = (n: number): string => Array.from({ length: n }, () => '<p style="text-align:center"></p>').join('\n');

/** প্লেসহোল্ডার-নির্দেশ প্যারা (fitTemplatePage শেষ ভরসা হিসেবে এটিও সরাতে পারে) */
export const TIP_NOTE =
  '<p class="tpl-hint" style="text-align:center"><span style="font-size:9pt; color:#94a3b8">প্লেসহোল্ডার লেখাগুলো মুছে নিজের তথ্য লিখুন</span></p>';

/** শেয়ার্ড কালি — পাথর-কালি ভিত্তি; প্রতিটি ব্লুপ্রিন্ট নিজের অ্যাকসেন্ট প্যালেট পাশে রাখে */
const C = {
  ink: '#292524', // পাথর-কালি মূল অক্ষর
  stone: '#44403c', // হালকা পাথর
  muted: '#57534e', // গাঢ় ছাই-বাদামি (সেকেন্ডারি লেখা)
  soft: '#a8a29e', // হালকা ছাই (ক্যাপশন)
  faint: '#d6d3d1', // অতি হালকা রেখা
  line: '#e7e5e4', // বর্ডার-হেয়ারলাইন
  gold: '#a16207', // পুরোনো সোনা
  goldDeep: '#b45309', // গাঢ় সোনা-তাম্র
  maroon: '#7f1d1d', // রাজকীয় মেরুন
  maroon2: '#9f1239', // গোলাপি-মেরুন (ম্যাগাজিন)
  plum: '#86198f', // বেগুনি (কবিতা)
  plumDeep: '#701a75',
  tealDeep: '#134e4a', // গাঢ় টিল (সহায়িকা)
  teal: '#115e59',
  forest: '#14532d', // বন-সবুজ (পাঠ্যবই)
  forest2: '#166534',
  sepia: '#5d4037', // সেপিয়া (ইতিহাস)
  sepiaDeep: '#7c2d12',
  sepiaGold: '#92702c', // পুরোনো ব্রঞ্জ
  terra: '#c2410c', // টেরাকোটা (রান্না)
  terraDeep: '#7c2d12',
  green: '#166534', // ইসলামিক সবুজ
  greenDeep: '#14532d',
};

/** এক-লাইনের কেন্দ্রিত ছোট ক্যাপশন — অক্ষর-ফাঁক করা ক্যাপস রীতি */
const cap = (text: string, color: string, size = 10, ls = 2) =>
  `<p style="text-align:center"><span style="font-size:${size}pt; color:${color}; letter-spacing:${ls}px">${text}</span></p>`;

/** অলংকার-সারি — '❦ ────────── ❖ ────────── ❦' ধাঁচের কেন্দ্রিত শোভাযাত্রা */
const orn = (l: string, m: string, r: string, color: string, size = 11, dash = 14) =>
  `<p style="text-align:center"><span style="font-size:${size}pt; color:${color}">${l} ${'─'.repeat(dash)} ${m} ${'─'.repeat(dash)} ${r}</span></p>`;

/** ছায়া-ব্যান্ড শিরোনাম — পুরো প্রস্থ জুড়ে রঙিন পটি, অক্ষর-ফাঁক করা বড় হরফ */
const band = (title: string, fg: string, fill: string, size = 14) =>
  buildDesignBoxHtml({ variant: 'shaded', border: fill, fill, bstyle: 'solid', bwidth: 1 },
    `<p style="text-align:center; letter-spacing:4px"><span style="font-size:${size}pt; color:${fg}"><strong>${title}</strong></span></p>`);

/** স্তরিত ফ্রেম — বাইরে ডাবল-রেখা, ভেতরে সরু সোনালি আঁচল (ফলক/রাজকীয় পাতার জন্য) */
const layeredFrame = (inner: string, outerColor: string, innerColor: string) =>
  buildDesignBoxHtml({ variant: 'double', border: outerColor, fill: 'transparent', bstyle: 'double', bwidth: 4 },
    buildDesignBoxHtml({ variant: 'box', border: innerColor, fill: 'transparent', bstyle: 'solid', bwidth: 1 }, inner));

// ═══════════════════════ ১. উপন্যাস — নীরব ক্লাসিক ═══════════════════════

const novel: BookBlueprint = {
  id: 'bp-novel',
  name: 'উপন্যাস — নীরব ক্লাসিক',
  desc: 'সাহিত্যের বইয়ের চিরায়ত ডিজাইন — সিরিফ টাইপ, মেরুন-সোনালি সংযত অলংকরণ, ড্রপ-ক্যাপসহ অধ্যায় সূচনা',
  accent: '#7f1d1d',
  genre: 'literature',
  tags: ['হাফ-টাইটেল', 'শিরোনাম পাতা', 'কপিরাইট', 'সূচিপত্র', 'অধ্যায় সূচনা', 'নমুনা অধ্যায়'],
  settings: {
    paperSize: 'demy-octavo',
    defaultFont: 'Tiro Bangla',
    defaultFontSize: 12,
    lineHeight: 1.7,
    paragraphSpacing: 6,
    headerStyle: 'plain',
    accentColor: '#7f1d1d',
    pageBorder: 'none',
    headerCenter: 'বইয়ের নাম',
  },
  pages: [
    { // হাফ-টাইটেল — সংযত, শুধু নাম আর একটি ফুল
      html: `
${sp(7)}
<p style="text-align:center"><span style="font-size:9pt; color:${C.faint}">━━━━━━━━━━━━</span></p>
${cap('বইয়ের নাম', C.ink, 16, 6)}
<p style="text-align:center"><span style="font-size:11pt; color:${C.gold}">❦</span></p>
${cap('উপন্যাস', C.soft, 9, 5)}
`.trim(),
    },
    { // শিরোনাম পাতা — লেখক শিরে, প্রকাশনী তলায়
      noChrome: true,
      html: `
${sp(3)}
${cap('লেখকের নাম', C.muted, 12, 3)}
${orn('❦', '❖', '❦', C.gold, 11, 12)}
<h1 style="text-align:center; color:${C.ink}; line-height:1.4"><span style="font-size:27pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:12pt; color:${C.muted}">— উপশিরোনাম —</span></p>
${sp(4)}
<p style="text-align:center"><span style="font-size:11pt; color:${C.gold}">❖</span></p>
${cap('প্রকাশনীর নাম', C.muted, 11, 2)}
`.trim(),
    },
    { // কপিরাইট — ছাপা-খাতার সংযত পাতা
      html: `
${sp(5)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.gold}">❖</span></p>
${cap('বইয়ের নাম', C.muted, 10, 3)}
<p style="text-align:center"><span style="font-size:9pt; color:${C.soft}">কপিরাইট © লেখকের নাম, সাল</span></p>
<p style="text-align:center"><span style="font-size:9pt; color:${C.soft}">সর্বস্বত্ব সংরক্ষিত — প্রকাশকের লিখিত অনুমতি ছাড়া বইটির কোনো অংশ পুনরুৎপাদন করা যাবে না</span></p>
<p style="text-align:center"><span style="font-size:9pt; color:${C.soft}">ISBN ৯৭৮-…… · মূল্য টাকা</span></p>
<p style="text-align:center"><span style="font-size:9pt; color:${C.soft}">মুদ্রণ: মুদ্রণালয়ের নাম, ঢাকা</span></p>
`.trim(),
    },
    { // সূচিপত্র — অলংকৃত শিরোনাম ও ডাবল রেখা
      html: `
${sp(1)}
${orn('❦', '❖', '❦', C.gold, 10, 12)}
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:20pt">সূচিপত্র</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', 'সূচিপত্র')}
`.trim(),
    },
    { // অধ্যায় সূচনা — সোনালি সংখ্যা, ড্রপ-ক্যাপ শুরু
      noChrome: true,
      html: `
${sp(6)}
${cap('এক', C.gold, 14, 8)}
<p style="text-align:center"><span style="font-size:8pt; color:${C.faint}">━━━━━━━━</span></p>
<h1 style="text-align:center; color:${C.ink}"><span style="font-size:21pt">অধ্যায়ের শিরোনাম</span></h1>
<p style="text-align:center"><span style="font-size:10pt; color:${C.gold}">❦</span></p>
${sp(1)}
<p style="text-indent:2em"><span style="font-size:17pt; color:${C.maroon}">এ</span>খানে উপন্যাসের প্রথম প্যারা বসবে — প্রথম লাইনে ইনডেন্টসহ গল্প শুরু হোক। এই পাতার সব লেখা মুছে নিজের লেখা বসান।</p>
<p style="text-indent:2em">চরিত্র, প্রেক্ষাপট আর আবেগের খোরাক এখানেই গড়ে উঠবে…</p>
`.trim(),
    },
    { // নমুনা মূল লেখা — দৃশ্য-বিরতির ⁂ চিহ্নসহ
      html: `
<p style="text-indent:2em"><span style="font-size:17pt; color:${C.maroon}">মূ</span>ল লেখা চলতে থাকবে এই পাতায় — এটি স্বাভাবিক ফ্লো-পাতা, লিখতে থাকলে বাকি অংশ নিজে থেকেই পরের পাতায় চলে যাবে।</p>
<p style="text-indent:2em">সংলাপ, বর্ণনা বা দৃশ্যপট — যেভাবে গল্প এগোয়।</p>
<p style="text-align:center"><span style="font-size:11pt; color:${C.soft}">⁂</span></p>
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
  ],
};

// ═══════════════════════ ২. সহায়িকা — একাডেমিক প্রো ═══════════════════════

const guide: BookBlueprint = {
  id: 'bp-guide',
  name: 'সহায়িকা — একাডেমিক প্রো',
  desc: 'কোচিং/স্কুল গাইড বইয়ের পূর্ণ সেটআপ — গাঢ় টিল-সোনালি প্যালেট, ব্যান্ড-শিরোনাম, কলআউট আর MCQ-বান্ধব কাঠামো',
  accent: '#115e59',
  genre: 'coaching',
  tags: ['প্রতিষ্ঠান শিরোনাম', 'কপিরাইট', 'সূচিপত্র', 'অধ্যায় + শেখার তালিকা', 'নমুনা পাঠ', 'শেষ পাতা'],
  settings: {
    paperSize: 'a4',
    defaultFont: 'Hind Siliguri',
    defaultFontSize: 11,
    lineHeight: 1.6,
    paragraphSpacing: 7,
    headerStyle: 'academic',
    accentColor: '#115e59',
    pageBorder: 'none',
    headerLeft: 'বিষয়ের নাম',
    headerRight: 'প্রতিষ্ঠানের নাম',
  },
  pages: [
    { // প্রতিষ্ঠান শিরোনাম পাতা — ব্যান্ড-মস্তক
      noChrome: true,
      html: `
${band('প্রতিষ্ঠানের পূর্ণ নাম', C.tealDeep, 'rgba(19,78,74,0.08)', 14)}
${cap('ঠিকানা · মোবাইল · ওয়েবসাইট', C.muted, 9, 2)}
<p style="text-align:center"></p>
<hr class="fancy-divider" data-style="double" />
<h1 style="text-align:center; color:${C.teal}"><span style="font-size:25pt">বইয়ের নাম</span></h1>
${cap('বিষয় · শ্রেণি · সংস্করণ', C.goldDeep, 11, 4)}
${sp(1)}
${buildCalloutHtml('note', 'এই বইয়ে যা আছে', '<ul><li>অধ্যায়ভিত্তিক সহজ ব্যাখ্যা</li><li>গুরুত্বপূর্ণ প্রশ্ন ও উত্তর</li><li>অনুশীলনী ও বোর্ড প্রশ্নব্যাংক</li></ul>')}
${sp(1)}
${cap('সম্পাদনা: লেখকের নাম · শিক্ষাবর্ষ ২০২৫–২৬', C.muted, 10, 2)}
`.trim(),
    },
    { // কপিরাইট + ঘোষণা
      html: `
${orn('✦', '❖', '✦', C.goldDeep, 10, 12)}
<h2 style="text-align:center; color:${C.tealDeep}"><span style="font-size:17pt">প্রকাশনা তথ্য</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('note', 'স্বত্ব', '<p>সমস্ত স্বত্ব সংরক্ষিত © প্রতিষ্ঠানের নাম, সাল</p><p>প্রথম সংস্করণ: সাল · মুদ্রণ: মুদ্রণালয়ের নাম</p><p>ISBN ৯৭৮-…… · মূল্য: টাকা</p>')}
${buildCalloutHtml('warning', 'ভুলত্রুটি', '<p>বইটি ছাপার সব যত্ন নেওয়া হলেও ভুলত্রুটি থাকতে পারে — পরবর্তী সংস্করণে সংশোধন করা হবে।</p>')}
${TIP_NOTE}
`.trim(),
    },
    { // সূচিপত্র — ছায়া-ব্যান্ড শিরোনাম
      html: `
${sp(1)}
${band('বিষয়সূচি', C.tealDeep, 'rgba(19,78,74,0.08)', 15)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.goldDeep}">❖</span></p>
${buildTocHtml('[]', 'বিষয়সূচি')}
${cap('অধ্যায়ে হেডিং দিলেই এখানে তালিকা বসে যাবে', C.soft, 9, 1)}
`.trim(),
    },
    { // অধ্যায় সূচনা — সোনালি সংখ্যা + শেখার-তালিকা
      noChrome: true,
      html: `
${sp(1)}
${cap('অধ্যায় ১', C.goldDeep, 12, 6)}
<p style="text-align:center"><span style="font-size:8pt; color:${C.faint}">━━━━━━━━</span></p>
<h1 style="text-align:center; color:${C.tealDeep}"><span style="font-size:22pt">অধ্যায়ের শিরোনাম</span></h1>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('concept', 'এ অধ্যায়ে শিখবে', '<ul><li>প্রথম শেখার বিষয়</li><li>দ্বিতীয় শেখার বিষয়</li><li>তৃতীয় শেখার বিষয়</li></ul>')}
`.trim(),
    },
    { // নমুনা পাঠ
      html: `
<h2 style="color:${C.tealDeep}">১.১ প্রথম টপিক</h2>
<p>এখানে মূল ব্যাখ্যা লিখুন — সহজ ভাষায়, উদাহরণসহ। এই পাতা স্বাভাবিক ফ্লো-পাতা: লিখতে থাকলে অবশিষ্ট পরের পাতায় চলে যাবে।</p>
${buildCalloutHtml('formula', 'সূত্র', '<p style="text-align:center"><strong>s = vt</strong> — সময় × গতি = দূরত্ব</p>')}
<p>ব্যাখ্যা চলবে…</p>
<h2 style="color:${C.tealDeep}">১.২ দ্বিতীয় টপিক</h2>
<p>দ্বিতীয় টপিকের ব্যাখ্যা এখানে।</p>
${buildCalloutHtml('warning', 'সাবধানতা', '<p>পরীক্ষায় এই ভুলটি সবচেয়ে বেশি হয় — খেয়াল রাখুন।</p>')}
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // শেষ পাতা — অলংকৃত বিদায়
      html: `
${sp(3)}
${orn('❦', '❖', '❦', C.goldDeep, 11, 14)}
${cap('আপনি পড়ছেন', C.muted, 10, 4)}
<h2 style="text-align:center; color:${C.tealDeep}"><span style="font-size:19pt">বইয়ের নাম</span></h2>
${buildCalloutHtml('note', 'এই বই থেকে আরও', '<ul><li>একই প্রতিষ্ঠানের অন্য বই</li><li>পরবর্তী সংস্করণ / সিরিজ</li></ul>')}
${cap('প্রতিষ্ঠানের নাম · ঠিকানা · ফোন · ওয়েবসাইট', C.muted, 10, 2)}
`.trim(),
    },
  ],
};

// ═══════════════════════ ৩. কবিতা — চন্মনী ═══════════════════════

const poetry: BookBlueprint = {
  id: 'bp-poetry',
  name: 'কবিতা সংকলন — চন্মনী',
  desc: 'হাওয়াদার কবিতার বই — ক্রিম কাগজ, বেগুনি-সোনালি অলংকরণ, কেন্দ্রিভূত স্তবক আর প্রশস্ত শ্বাসপ্রশ্বাসের ফাঁকা জায়গা',
  accent: '#86198f',
  genre: 'poetry',
  tags: ['হাফ-টাইটেল', 'শিরোনাম পাতা', 'কপিরাইট', 'সূচিপত্র', 'কবিতা পাতা', 'উৎসর্গ'],
  settings: {
    paperSize: 'a5',
    paperColor: 'cream',
    defaultFont: 'Tiro Bangla',
    defaultFontSize: 11,
    lineHeight: 1.9,
    paragraphSpacing: 10,
    headerStyle: 'royal',
    accentColor: '#86198f',
    pageBorder: 'ornamental',
    headerCenter: 'কবিতার নাম',
  },
  pages: [
    { // হাফ-টাইটেল — খুবই স্বল্প, হাওয়ার মতো
      html: `
${sp(6)}
${cap('কবিতা সংকলন', C.ink, 15, 8)}
<p style="text-align:center"><span style="font-size:12pt; color:${C.gold}">❁</span></p>
${cap('নির্বাচিত কবিতা', C.soft, 9, 5)}
`.trim(),
    },
    { // শিরোনাম পাতা — চাঁদ-ফুলের শোভা
      noChrome: true,
      html: `
${sp(3)}
${cap('লেখকের নাম', C.muted, 12, 3)}
<p style="text-align:center"><span style="font-size:12pt; color:${C.plum}">☾ ❁ ☽</span></p>
<h1 style="text-align:center; color:${C.ink}; line-height:1.5"><span style="font-size:25pt">কবিতার নাম</span></h1>
${cap('নির্বাচিত কবিতা · প্রথম সংকলন', C.gold, 10, 4)}
${sp(2)}
${orn('❁', '❖', '❁', C.plum, 11, 12)}
${cap('প্রকাশনীর নাম', C.muted, 11, 2)}
`.trim(),
    },
    { // কপিরাইট
      html: `
${sp(4)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.plum}">❖</span></p>
${cap('কবিতার নাম', C.muted, 10, 3)}
<p style="text-align:center"><span style="font-size:9pt; color:${C.soft}">কপিরাইট © লেখকের নাম, সাল</span></p>
<p style="text-align:center"><span style="font-size:9pt; color:${C.soft}">মুদ্রণ: মুদ্রণালয়ের নাম, ঢাকা</span></p>
`.trim(),
    },
    { // সূচিপত্র — ফুল-তারার শিরোনাম
      html: `
${sp(1)}
${orn('❁', '❖', '❁', C.gold, 10, 12)}
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:20pt">সূচিপত্র</span></h2>
<hr class="fancy-divider" data-style="stars" />
${buildTocHtml('[]', 'সূচিপত্র')}
`.trim(),
    },
    { // কবিতা পাতা — কেন্দ্রিভূত স্তবক
      html: `
${cap('এক', C.soft, 11, 6)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.gold}">❁</span></p>
<h2 style="text-align:center; color:${C.ink}">কবিতার শিরোনাম</h2>
<p style="text-align:center; line-height:1.9"><em>প্রথম স্তবকের প্রথম লাইন এখানে<br/>দ্বিতীয় লাইনে ছন্দ বয়ে যায়<br/>তৃতীয় লাইন একটু থেমে থাকে<br/>চতুর্থ লাইনে সকাল হয়</em></p>
<p style="text-align:center; line-height:1.9"><em>দ্বিতীয় স্তবক — নতুন ভাবনা<br/>শব্দে শব্দে জল জমে ওঠে<br/>নদীর ভাঙা সোনালি আলো</em></p>
<hr class="fancy-divider" data-style="stars" />
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // উৎসর্গ-ধাঁচের শেষ পাতা
      html: `
${sp(4)}
<p style="text-align:center"><span style="font-size:11pt; color:${C.gold}">☾</span></p>
<p style="text-align:center"><em><span style="font-size:12pt; color:${C.muted}">মাকে</span></em></p>
<p style="text-align:center"><em><span style="font-size:11pt; color:${C.muted}">যে প্রথম শব্দটি শেখাল, শেষ শব্দটাও তারই</span></em></p>
${sp(2)}
<hr class="fancy-divider" data-style="stars" />
${TIP_NOTE}
`.trim(),
    },
  ],
};

// ═══════════════════════ ৪. পাঠ্যবই — মানসম্মত ক্লাসরুম ═══════════════════════

const textbook: BookBlueprint = {
  id: 'bp-textbook',
  name: 'পাঠ্যবই — মানসম্মত ক্লাসরুম',
  desc: 'শিক্ষাপ্রতিষ্ঠানের পূর্ণাঙ্গ পাঠ্যবই — বন-সবুজ প্যালেট, শেখার-তালিকা, সূত্র-কলআউট, অনুশীলনীসহ ক্লাসরুম-প্রস্তুত কাঠামো',
  accent: '#166534',
  genre: 'textbook',
  tags: ['প্রতিষ্ঠান শিরোনাম', 'প্রকাশনা তথ্য', 'বিষয়সূচি', 'অধ্যায় + শেখার-তালিকা', 'নমুনা পাঠ + অনুশীলনী', 'শেষ পাতা'],
  settings: {
    paperSize: 'a4',
    defaultFont: 'Hind Siliguri',
    defaultFontSize: 11,
    lineHeight: 1.6,
    paragraphSpacing: 7,
    headerStyle: 'academic',
    accentColor: '#166534',
    pageBorder: 'none',
    headerLeft: 'শ্রেণি ও বিষয়',
    headerRight: 'প্রতিষ্ঠানের নাম',
  },
  pages: [
    { // প্রতিষ্ঠান শিরোনাম পাতা — ব্যান্ড-মস্তক
      noChrome: true,
      html: `
${band('বিদ্যানিকেতন উচ্চ বিদ্যালয়', C.forest, 'rgba(20,83,45,0.08)', 14)}
${cap('ঠিকানা · স্থাপিত ১৯—— · ওয়েবসাইট', C.muted, 9, 2)}
<p style="text-align:center"></p>
<hr class="fancy-divider" data-style="double" />
<h1 style="text-align:center; color:${C.forest2}"><span style="font-size:24pt">বিজ্ঞান : নবম শ্রেণি</span></h1>
${cap('পাঠ্যবই · জাতীয় শিক্ষাক্রম অনুসারে', C.gold, 10, 4)}
${buildCalloutHtml('note', 'এই বইয়ের বৈশিষ্ট্য', '<ul><li>অধ্যায়ের শুরুতে শেখার-তালিকা</li><li>উদাহরণসহ সহজ ব্যাখ্যা</li><li>অনুশীলনী ও সৃজনশীল প্রশ্ন</li></ul>')}
${cap('লেখকের নাম · সম্পাদকের নাম', C.muted, 10, 2)}
`.trim(),
    },
    { // প্রকাশনা তথ্য + মালিকানা-ফলক
      html: `
${orn('✦', '❖', '✦', C.gold, 10, 12)}
<h2 style="text-align:center; color:${C.forest}"><span style="font-size:17pt">প্রকাশনা ও স্বীকৃতি</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('note', 'মুদ্রণ তথ্য', '<p>প্রথম প্রকাশ: সাল · বর্তমান সংস্করণ: সাল</p><p>মুদ্রণ: মুদ্রণালয়ের নাম, ঢাকা · মূল্য: টাকা</p>')}
<p>বইটি অভিজ্ঞ শিক্ষক-শিক্ষিকা মহলের পরামর্শে প্রণীত — শিক্ষার্থীর সহজ উপলব্ধিই এর মূল লক্ষ্য।</p>
${buildDesignBoxHtml({ variant: 'box', border: C.forest2, fill: 'rgba(20,83,45,0.04)', bstyle: 'solid', bwidth: 1 }, '<p style="text-align:center"><strong>বইটির মালিক</strong></p><p style="text-align:center">শিক্ষার্থীর নাম ______________ · শ্রেণি ______ · রোল ______</p>')}
${TIP_NOTE}
`.trim(),
    },
    { // বিষয়সূচি — ছায়া-ব্যান্ড শিরোনাম
      html: `
${sp(1)}
${band('বিষয়সূচি', C.forest, 'rgba(20,83,45,0.08)', 15)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.gold}">❖</span></p>
${buildTocHtml('[]', 'বিষয়সূচি')}
${cap('অধ্যায়ে হেডিং দিলেই এখানে তালিকা বসে যাবে', C.soft, 9, 1)}
`.trim(),
    },
    { // অধ্যায় সূচনা + শেখার-তালিকা
      noChrome: true,
      html: `
${sp(1)}
${cap('অধ্যায় ৩', C.gold, 12, 6)}
<p style="text-align:center"><span style="font-size:8pt; color:${C.faint}">━━━━━━━━</span></p>
<h1 style="text-align:center; color:${C.forest}"><span style="font-size:22pt">জীবন বাঁচাতে বিজ্ঞান</span></h1>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('concept', 'শেখার-তালিকা', '<p>এ অধ্যায় শেষে শিক্ষার্থী —</p><ul><li>খাদ্য-সংরক্ষণের নিয়ম বর্ণনা করতে পারবে</li><li>চাপের ব্যবহার উদাহরণসহ ব্যাখ্যা করতে পারবে</li><li>প্রাত্যহিক জীবনে বিজ্ঞানের প্রয়োগ দেখাতে পারবে</li></ul>')}
`.trim(),
    },
    { // নমুনা পাঠ + অনুশীলনী
      html: `
<h2 style="color:${C.forest}">৩.১ খাদ্য সংরক্ষণ</h2>
<p>মূল ব্যাখ্যা এখানে লিখুন — সহজ ভাষায়, ঘরোয়া উদাহরণসহ। এই পাতা ফ্লো-পাতা: লিখতে থাকলে অবশিষ্ট পরের পাতায় চলে যাবে।</p>
${buildCalloutHtml('formula', 'সূত্র', '<p style="text-align:center"><strong>ঘনত্ব = ভর ÷ আয়তন</strong></p>')}
<h2 style="color:${C.forest}">৩.২ চাপ ও দৈনন্দিন জীবন</h2>
<p>দ্বিতীয় টপিকের ব্যাখ্যা এখানে।</p>
${buildCalloutHtml('warning', 'সতর্কতা', '<p>সংজ্ঞা লেখার সময় একক উল্লেখ করতে ভুলো না — পরীক্ষায় এখানেই নম্বর কাটা যায়।</p>')}
<h3 style="color:${C.sepiaDeep}">অনুশীলনী ৩</h3>
<ol><li>খাদ্য সংরক্ষণের দুটি পদ্ধতির নাম লেখো।</li><li>ঘনত্বের SI একক কী?</li><li>চাপ কমলে কী ঘটে — একটি উদাহরণ দাও।</li></ol>
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // শেষ পাতা — প্রয়োগের আহ্বান
      html: `
${sp(3)}
${orn('❖', '✦', '❖', C.gold, 11, 14)}
<h2 style="text-align:center; color:${C.forest}"><span style="font-size:19pt">পড়া শেষ — এবার প্রয়োগের পালা</span></h2>
${buildCalloutHtml('note', 'পরবর্তী পদক্ষেপ', '<ul><li>প্রতিটি অধ্যায়ের অনুশীলনী সমাধান করো</li><li>শিক্ষকের কাছে সন্দেহ মিটিয়ে নাও</li><li>পরীক্ষার আগে নিজের নোট নিজে তৈরি করো</li></ul>')}
${cap('বিদ্যানিকেতন উচ্চ বিদ্যালয় · ঠিকানা · ফোন', C.muted, 10, 2)}
`.trim(),
    },
  ],
};

// ═══════════════════════ ৫. বিজ্ঞান — পরীক্ষা প্রস্তুতি ═══════════════════════

const science: BookBlueprint = {
  id: 'bp-science',
  name: 'বিজ্ঞান — পরীক্ষা প্রস্তুতি',
  desc: 'পরীক্ষা-কেন্দ্রিক বিজ্ঞানের বই — পাথর-কালি ও সোনালি-তাম্রের গম্ভীর প্যালেট, সূত্র, SI এককের টেবিল আর ভুলের সতর্কতা',
  accent: '#b45309',
  genre: 'science',
  tags: ['শিরোনাম পাতা', 'বিষয়সূচি', 'অধ্যায় + মূল ধারণা', 'সূত্র + SI একক টেবিল', 'পরীক্ষার ভুল-সতর্কতা', 'শেষ পাতা'],
  settings: {
    paperSize: 'a4',
    defaultFont: 'Kalpurush',
    defaultFontSize: 11,
    lineHeight: 1.65,
    paragraphSpacing: 6,
    headerStyle: 'parallel',
    accentColor: '#b45309',
    pageBorder: 'none',
    headerLeft: 'পদার্থবিজ্ঞান',
    headerRight: 'পরীক্ষা প্রস্তুতি',
  },
  pages: [
    { // শিরোনাম পাতা — ব্যান্ড-শিরোনাম, গম্ভীর আধুনিক
      noChrome: true,
      html: `
${sp(2)}
${cap('নবম-দশম শ্রেণি · পদার্থবিজ্ঞান', C.muted, 11, 4)}
${band('বিজ্ঞান — পরীক্ষা প্রস্তুতি', C.ink, 'rgba(180,83,9,0.10)', 19)}
${orn('✦', '✦', '✦', C.goldDeep, 10, 10)}
${buildCalloutHtml('concept', 'মূল ধারণা', '<p>প্রতিটি অধ্যায়ে থাকবে — মূল ধারণা, সূত্র, SI এককের তালিকা আর পরীক্ষায় সবচেয়ে বেশি হওয়া ভুলের সতর্কতা।</p>')}
${cap('লেখকের নাম · সংস্করণ ২০২৫', C.muted, 10, 2)}
`.trim(),
    },
    { // বিষয়সূচি — ছায়া-ব্যান্ড
      html: `
${sp(1)}
${band('বিষয়সূচি', C.ink, 'rgba(180,83,9,0.10)', 15)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.goldDeep}">✦</span></p>
${buildTocHtml('[]', 'বিষয়সূচি')}
${cap('অধ্যায়ে হেডিং দিলেই এখানে তালিকা বসে যাবে', C.soft, 9, 1)}
`.trim(),
    },
    { // অধ্যায় সূচনা
      noChrome: true,
      html: `
${sp(1)}
${cap('অধ্যায় ২', C.goldDeep, 12, 6)}
<p style="text-align:center"><span style="font-size:8pt; color:${C.faint}">━━━━━━━━</span></p>
<h1 style="text-align:center; color:${C.ink}"><span style="font-size:21pt">গতি</span></h1>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('concept', 'মূল ধারণা', '<ul><li>দ্রুতি ও বেগের পার্থক্য</li><li>সমবেগ ও সমত্বরণ</li><li>দূরত্ব-সময় লেখচিত্র পড়া</li></ul>')}
`.trim(),
    },
    { // নমুনা পাঠ + SI একক টেবিল + ভুল-সতর্কতা
      html: `
<h2 style="color:${C.ink}">২.১ সমবেগ</h2>
<p>সমান সময় ব্যবধানে সমান দূরত্ব অতিক্রম করলে তাকে সমবেগ বলে। ব্যাখ্যা এখানে লিখুন — এই পাতা ফ্লো-পাতা।</p>
${buildCalloutHtml('formula', 'সূত্র', '<p style="text-align:center"><strong>s = vt</strong></p><p style="text-align:center">দূরত্ব = বেগ × সময়</p>')}
<h2 style="color:${C.ink}">২.২ একক ও পরিমাপ</h2>
<table><tr><th style="text-align:left; background:rgba(180,83,9,0.10)">রাশি</th><th style="text-align:left; background:rgba(180,83,9,0.10)">SI একক</th></tr><tr><td>দৈর্ঘ্য</td><td>মিটার (m)</td></tr><tr><td>ভর</td><td>কিলোগ্রাম (kg)</td></tr><tr><td>সময়</td><td>সেকেন্ড (s)</td></tr><tr><td>বল</td><td>নিউটন (N)</td></tr></table>
${buildCalloutHtml('warning', 'পরীক্ষার সাধারণ ভুল', '<p>বেগ km/h থেকে m/s-এ রূপান্তরে ৫/১৮ দিয়ে গুণ করা ভুলো না — এখানেই সবচেয়ে বেশি নম্বর কাটা যায়।</p>')}
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // শেষ পাতা — পরীক্ষার হলে
      html: `
${sp(3)}
${orn('✦', '✜', '✦', C.goldDeep, 11, 14)}
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:19pt">পরীক্ষার হলে</span></h2>
${buildCalloutHtml('note', 'শেষ পরামর্শ', '<ul><li>প্রথমে সহজ প্রশ্নগুলো সমাধান করো</li><li>সূত্র লিখে তবেই হিসাব শুরু করো</li><li>শেষ পাঁচ মিনিট খাতা যাচাইয়ে দাও</li></ul>')}
${cap('লেখকের নাম · প্রকাশনীর নাম', C.muted, 10, 2)}
`.trim(),
    },
  ],
};

// ═══════════════════════ ৬. শিশু — রঙিন গল্প ═══════════════════════

const children: BookBlueprint = {
  id: 'bp-children',
  name: 'শিশু কিতাব — রঙিন গল্প',
  desc: 'ছোট্টদের বড় বড় অক্ষরে রঙিন গল্পের বই — উষ্ণ কমলা-সোনালি রং, মজার ডিজাইন-বক্স, ছবির ফ্রেম আর গল্প-বীজের পাতা',
  accent: '#ea580c',
  genre: 'children',
  tags: ['রঙিন শিরোনাম পাতা', 'গল্প পাতা + ছবির ফ্রেম', 'শেকড়ে শেখা', 'গল্প-বীজ', 'শেষ পাতা'],
  settings: {
    paperSize: 'a5',
    defaultFont: 'Baloo Da 2',
    defaultFontSize: 13,
    lineHeight: 1.8,
    paragraphSpacing: 8,
    headerStyle: 'none',
    accentColor: '#ea580c',
    pageBorder: 'none',
  },
  pages: [
    { // রঙিন শিরোনাম পাতা — তারা-ঝরা আমোদ
      noChrome: true,
      html: `
${sp(2)}
<p style="text-align:center"><span style="font-size:16pt; color:#f59e0b">✦ 🌟 ✦</span></p>
<h1 style="text-align:center; color:#9a3412"><span style="font-size:26pt">রঙিন গল্পের কিতাব</span></h1>
${cap('ছোট্টদের জন্য মজার গল্প', '#ea580c', 12, 3)}
<p style="text-align:center"><span style="font-size:13pt; color:#ea580c">🌟 ✦ 🌟</span></p>
${buildDesignBoxHtml({ variant: 'pill', border: '#ea580c', fill: '#fff7ed' }, '<p style="text-align:center"><strong>গল্প লিখো, আঁকিয়ে সাজাও!</strong></p><p style="text-align:center">প্রতি পাতায় তোমার নিজের গল্পটা জমবে</p>')}
${cap('লেখক: তোমার নাম', C.muted, 12, 2)}
`.trim(),
    },
    { // গল্প পাতা — বড় প্রথম অক্ষর + ছবির ফ্রেম
      html: `
<p style="text-align:center"><span style="font-size:11pt; color:#f59e0b">✦ ─── ✦ ─── ✦</span></p>
<h2 style="text-align:center; color:#9a3412">বিড়ালের রঙিন জুতো</h2>
<p><span style="font-size:22pt; color:#ea580c">এ</span>কটা ছিল ছোট্ট মেয়ে, নাম তার মিনি। সকালবেলা বাগানে খেলতে গিয়ে মিনি দেখল — একটা ছোট্ট বিড়াল কোণায় বসে কাঁদছে!</p>
<p>মিনি বিড়ালটাকে বলল, "কেঁদো না বন্ধু! চলো, একসাথে তোমার জুতোটা খুঁজি।" এভাবেই শুরু হলো তাদের মজার অভিযান…</p>
${buildDesignBoxHtml({ variant: 'dashed', border: '#ea580c', fill: '#fffbeb' }, '<p style="text-align:center"><span style="font-size:12pt; color:#9a3412">🖼️ এখানে ছবি বসাও (Insert → Image)</span></p><p style="text-align:center"><span style="font-size:10pt; color:#9a3412">তোমার কল্পনার দৃশ্যটা এঁকে ফেলো</span></p>')}
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // শেকড়ে শেখা — মজার কাজ
      html: `
<h2 style="text-align:center; color:#9a3412">শেকড়ে শেখা 🌳</h2>
<p style="text-align:center">গল্পটা পড়া শেষ? এবার নিচের কাজগুলো করো —</p>
<ul><li>তোমার প্রিয় চরিত্রটির নাম লেখো</li><li>গল্পের শেষটা নিজের মতো বদলে লেখো</li><li>রঙিন জুতোটার নতুন একটা ছবি আঁকো</li></ul>
${buildDesignBoxHtml({ variant: 'rounded', border: '#f59e0b', fill: '#fffbeb' }, '<p style="text-align:center"><strong>আজকের মজার প্রশ্ন</strong></p><p style="text-align:center">মিনির বদলে তুমি হলে কী করতে?</p>')}
`.trim(),
    },
    { // গল্প-বীজ — তিন শব্দে নতুন গল্প
      html: `
<h2 style="text-align:center; color:#9a3412">নতুন গল্পের বীজ 🌱</h2>
<p style="text-align:center">এই তিনটি শব্দ দেখো — এদের নিয়েই সাজাও একটা নতুন গল্প:</p>
${buildDesignBoxHtml({ variant: 'pill', border: '#f59e0b', fill: '#fffbeb' }, '<p style="text-align:center"><span style="font-size:14pt; color:#9a3412"><strong>চাঁদ · ডিম · রঙিন ঘুড়ি</strong></span></p>')}
${buildDesignBoxHtml({ variant: 'dashed', border: '#ea580c', fill: '#fff7ed' }, '<p style="text-align:center"><span style="font-size:12pt; color:#9a3412">🖼️ গল্পের ছবি এঁকে এখানে বসাও</span></p>')}
<p>গল্পটা এখানে লিখো — শুরুটা করো "একটা ছিল…"</p>
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // শেষ পাতা — উদ্‌যাপন
      html: `
${sp(2)}
<p style="text-align:center"><span style="font-size:14pt; color:#ea580c">🌟 ✦ 🌟</span></p>
<h2 style="text-align:center; color:#9a3412"><span style="font-size:20pt">গল্প শেষ!</span></h2>
<p style="text-align:center">কী সুন্দর গল্প গড়লে তুমি!</p>
<p style="text-align:center"><em>আগামীকাল আবার নতুন গল্পে দেখা হবে…</em></p>
<p style="text-align:center"><span style="font-size:11pt; color:#f59e0b">✦ ─── ✦ ─── ✦</span></p>
`.trim(),
    },
  ],
};

// ═══════════════════════ ৭. রান্না — স্বাদের সংকলন ═══════════════════════

const cooking: BookBlueprint = {
  id: 'bp-cooking',
  name: 'রান্নার বই — স্বাদের সংকলন',
  desc: 'ঘরোয়া রেসিপির বই — টেরাকোটা-সোনালি উষ্ণতা, ফলক-ফ্রেমের শিরোনাম, উপকরণ-বক্স আর ধাপে ধাপে প্রণালি',
  accent: '#c2410c',
  genre: 'cooking',
  tags: ['শিরোনাম পাতা', 'রান্নার তালিকা', 'রেসিপি: উপকরণ + প্রণালি', 'দ্বিতীয় রেসিপি', 'রান্নাঘরের কথা'],
  settings: {
    paperSize: 'a5',
    defaultFont: 'Anek Bangla',
    defaultFontSize: 11,
    lineHeight: 1.6,
    paragraphSpacing: 6,
    headerStyle: 'plain',
    accentColor: '#c2410c',
    pageBorder: 'none',
    headerCenter: 'রান্নার বই',
  },
  pages: [
    { // শিরোনাম পাতা — পুরোনো মেনু-কার্ডের ফ্রেম
      noChrome: true,
      html: `
${sp(2)}
${layeredFrame(
  `<p style="text-align:center"><span style="font-size:16pt; color:${C.terra}">🍲</span></p>
<h1 style="text-align:center; color:${C.terraDeep}"><span style="font-size:23pt">রান্নার বই</span></h1>
${cap('ঘরোয়া স্বাদের সংকলন', C.goldDeep, 10, 4)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.terra}">❦ ────────── ❦</span></p>`,
  C.terra, C.goldDeep)}
${sp(2)}
${cap('রাঁধুনি: নিজের নাম', C.muted, 11, 2)}
`.trim(),
    },
    { // রান্নার তালিকা
      html: `
${sp(1)}
${orn('❦', '❖', '❦', C.terra, 10, 12)}
<h2 style="text-align:center; color:${C.terraDeep}"><span style="font-size:20pt">রান্নার তালিকা</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', 'রান্নার তালিকা')}
${cap('রেসিপির নাম হেডিং দিলেই তালিকা বসে যাবে', C.soft, 9, 1)}
`.trim(),
    },
    { // রেসিপি পাতা ১
      html: `
<h2 style="color:${C.terraDeep}">নরম খিচুড়ি</h2>
${cap('৪ জনের জন্য · সময়: ৪০ মিনিট', C.goldDeep, 10, 2)}
${buildDesignBoxHtml({ variant: 'shaded', border: C.terra, fill: 'rgba(194,65,12,0.05)' }, '<p style="color:' + C.terraDeep + '"><strong>উপকরণ</strong></p><ul><li>চাল — দুই কাপ</li><li>মসুর ডাল — আধ কাপ</li><li>আদা, রসুন, হলুদ — স্বাদমতো</li></ul>')}
<p style="color:${C.terraDeep}"><strong>প্রণালি</strong></p>
<ol><li>চাল আর ডাল ভালো করে ধুয়ে পানি ঝরিয়ে নাও।</li><li>কড়াইয়ে তেল গরম করে পেঁয়াজ ও মসলা কষাও।</li><li>চাল-ডাল ও গরম পানি ঢেলে মাঝারি আঁচে নরম হওয়া পর্যন্ত দিয়াও।</li></ol>
${buildCalloutHtml('note', 'রান্নার টিপস', '<p>আঁচ মাঝারি রাখবে — তলায় লেগে যাবে না, খিচুড়ি থাকবে ঝরঝরে।</p>')}
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // রেসিপি পাতা ২ — ছোট রেসিপি
      html: `
<h2 style="color:${C.terraDeep}">টক দইয়ে বেগুন</h2>
${cap('সাইড ডিশ · ২০ মিনিট', C.goldDeep, 10, 2)}
${buildDesignBoxHtml({ variant: 'shaded', border: C.terra, fill: 'rgba(194,65,12,0.05)' }, '<p style="color:' + C.terraDeep + '"><strong>উপকরণ</strong></p><ul><li>বেগুন — দুটো</li><li>টক দই — এক কাপ</li><li>লবণ-চিনি — স্বাদমতো</li></ul>')}
<p style="color:${C.terraDeep}"><strong>প্রণালি</strong></p>
<ol><li>বেগুন লম্বালম্বি কেটে হালকা লবণ মাখিয়ে রাখো।</li><li>দইয়ে হলুদ ও মরিচ মিশিয়ে বেগুন ঢেকে রাখো।</li><li>সেঁকে গরম গরম পরিবেশন করো।</li></ol>
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // শেষ পাতা — রান্নাঘরের প্রবাদ
      html: `
${sp(3)}
${orn('❦', '🍲', '❦', C.terra, 11, 12)}
<h2 style="text-align:center; color:${C.terraDeep}"><span style="font-size:19pt">রান্নাঘরের কথা</span></h2>
<hr class="fancy-divider" data-style="flourish" />
<p style="text-align:center"><em>"যে ভালোবেসে রাঁধে, তার ঘরে হাসি থাকে।"</em></p>
<p style="text-align:center"><em>"মসলা মেপে নয়, মন দিয়ে রান্না।"</em></p>
${TIP_NOTE}
`.trim(),
    },
  ],
};

// ═══════════════════════ ৮. ইতিহাস-জীবনী — ঐতিহ্যবাহী ═══════════════════════

const history: BookBlueprint = {
  id: 'bp-history',
  name: 'ইতিহাস ও জীবনী — ঐতিহ্যবাহী',
  desc: 'মহিমাময় ইতিহাস-গ্রন্থের ডিজাইন — ক্রিম কাগজে সেপিয়া-ব্রঞ্জ কালি, স্তরিত ফলক-ফ্রেম, সময়রেখার টেবিল আর প্রামাণ্য উদ্ধৃতি',
  accent: '#7c2d12',
  genre: 'history',
  tags: ['ফলক-শিরোনাম পাতা', 'সূচিপত্র', 'পরিচ্ছেদ সূচনা', 'সময়রেখার টেবিল', 'শেষ পাতা'],
  settings: {
    paperSize: 'demy-octavo',
    paperColor: 'cream',
    defaultFont: 'Siyam Rupali',
    defaultFontSize: 12,
    lineHeight: 1.7,
    paragraphSpacing: 6,
    headerStyle: 'royal',
    accentColor: '#7c2d12',
    pageBorder: 'double',
    headerCenter: 'ইতিহাসের নাম',
  },
  pages: [
    { // ফলক-ধাঁচের শিরোনাম পাতা — স্তরিত ব্রঞ্জ-ফ্রেম
      noChrome: true,
      html: `
${sp(2)}
${layeredFrame(
  `${cap('ঐতিহ্যবাহী ইতিহাস-গ্রন্থ', C.muted, 10, 5)}
<h1 style="text-align:center; color:${C.ink}"><span style="font-size:24pt">ইতিহাসের নাম</span></h1>
${orn('❦', '❖', '❦', C.sepiaGold, 10, 12)}`,
  C.sepiaGold, C.sepia)}
${sp(1)}
${buildDesignBoxHtml({ variant: 'double', border: C.sepiaGold, fill: 'transparent' }, '<p style="text-align:center"><span style="font-size:12pt; color:' + C.sepia + '">লেখকের নাম</span></p><p style="text-align:center"><span style="font-size:10pt; color:' + C.muted + '">গবেষণামূলক জীবনী · সংশোধিত সংস্করণ</span></p>')}
${sp(2)}
<hr class="fancy-divider" data-style="flourish" />
${cap('প্রকাশনীর নাম · ঢাকা', C.muted, 11, 2)}
`.trim(),
    },
    { // সূচিপত্র — ব্রঞ্জ শোভাযাত্রা
      html: `
${sp(1)}
${orn('❦', '❖', '❦', C.sepiaGold, 10, 12)}
<h2 style="text-align:center; color:${C.sepia}"><span style="font-size:20pt">সূচিপত্র</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', 'সূচিপত্র')}
`.trim(),
    },
    { // পরিচ্ছেদ সূচনা — প্রামাণ্য উদ্ধৃতিসহ
      noChrome: true,
      html: `
${sp(4)}
${cap('পরিচ্ছেদ ১', C.sepiaGold, 12, 6)}
<p style="text-align:center"><span style="font-size:8pt; color:${C.faint}">━━━━━━━━</span></p>
<h1 style="text-align:center; color:${C.ink}"><span style="font-size:21pt">প্রথম পরিচ্ছেদের শিরোনাম</span></h1>
<hr class="fancy-divider" data-style="flourish" />
<p style="text-align:center"><em>পরিচ্ছেদ শুরুর উদ্ধৃতি এখানে — সমকালীন কোনো প্রামাণ্য সূত্র থেকে।</em></p>
`.trim(),
    },
    { // সময়রেখার নমুনা পাতা
      html: `
<h2 style="color:${C.sepia}">সময়রেখা</h2>
<p>এই পরিচ্ছেদের প্রধান ঘটনাগুলো এক নজরে — নিজের তথ্য দিয়ে টেবিলটা পূরণ করুন।</p>
<table><tr><th style="text-align:left; background:rgba(146,112,44,0.12)">সাল</th><th style="text-align:left; background:rgba(146,112,44,0.12)">ঘটনা</th></tr><tr><td>১৬০০</td><td>এই স্থানের প্রথম প্রামাণ্য উল্লেখ</td></tr><tr><td>১৭৫৭</td><td>একটি নির্ণায়ক ঘটনা</td></tr><tr><td>১৮৫৭</td><td>আন্দোলনের উত্থান</td></tr><tr><td>১৯৪৭</td><td>পরিবর্তনের সাল</td></tr></table>
<blockquote style="text-align:center; color:${C.muted}">ইতিহাস শুধু তারিখ নয় — তারিখের ভেতরের মানুষটিই ইতিহাস।</blockquote>
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // শেষ পাতা — সমাপ্তি-ফলক
      html: `
${sp(4)}
${orn('❧', '❋', '❧', C.sepiaGold, 11, 12)}
<p style="text-align:center"><em>ইতিহাস ফিরে আসে তাদেরই কাছে, যাঁরা মন দিয়ে শোনে।</em></p>
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:19pt">সমাপ্ত</span></h2>
${cap('প্রকাশনীর নাম · ঢাকা', C.muted, 10, 2)}
`.trim(),
    },
  ],
};

// ═══════════════════════ ৯. ডায়েরি-জার্নাল — আমার খাতা ═══════════════════════

const journal: BookBlueprint = {
  id: 'bp-journal',
  name: 'ডায়েরি ও জার্নাল — আমার খাতা',
  desc: 'লেখার অভ্যাস গড়ার ব্যক্তিগত খাতা — কোমল জলপাই-সবুজ ছোঁয়া, বিন্দু-রেখার শোভা, অভ্যাস-ট্র্যাকার আর সাপ্তাহিক প্রতিফলন',
  accent: '#4d7c0f',
  genre: 'journal',
  tags: ['নরম শিরোনাম পাতা', 'কীভাবে লিখবে', 'অভ্যাস খাতা', 'সাপ্তাহিক প্রতিফলন', 'শেষ পাতা'],
  settings: {
    paperSize: 'a5',
    defaultFont: 'Mina',
    defaultFontSize: 12,
    lineHeight: 1.9,
    paragraphSpacing: 8,
    headerStyle: 'none',
    accentColor: '#4d7c0f',
    pageBorder: 'none',
  },
  pages: [
    { // নরম শিরোনাম পাতা — বিন্দু-রেখার আভা
      noChrome: true,
      html: `
${sp(3)}
<p style="text-align:center"><span style="font-size:14pt; color:#4d7c0f">❧</span></p>
<h1 style="text-align:center; color:#1a2e05"><span style="font-size:24pt">আমার খাতা</span></h1>
${cap('প্রতিদিনের ভাবনা · তারিখের মতো তাজা', C.muted, 11, 2)}
<hr class="fancy-divider" data-style="dotted" />
${cap('যার খাতা এটি: ______________', C.muted, 11, 1)}
<p style="text-align:center"><span style="font-size:10pt; color:#a8a29e">· ─ · ─ ·</span></p>
`.trim(),
    },
    { // কীভাবে লিখবে
      html: `
<h2 style="text-align:center; color:#3f6212">কীভাবে লিখবে</h2>
<hr class="fancy-divider" data-style="dotted" />
${buildCalloutHtml('note', 'শুরুর নিয়ম', '<ul><li>দিনে মাত্র পাঁচ মিনিট — বেশি নয়</li><li>যা মনে আসে সেটাই লেখো, শুদ্ধতা পরে দেখো</li><li>সপ্তাহ শেষে নিজের লেখা পড়ে নাও</li></ul>')}
<p style="text-align:center"><em>কাল নিজেকে যা জানাতে চাই — আজ সেটাই লেখো।</em></p>
`.trim(),
    },
    { // অভ্যাস খাতা
      html: `
<h2 style="text-align:center; color:#3f6212">অভ্যাস খাতা</h2>
<p style="text-align:center">যে কাজটি প্রতিদিন করেছ, তালিকায় টিক দাও —</p>
<table><tr><th style="text-align:left; background:rgba(77,124,15,0.10)">দিন</th><th style="text-align:left; background:rgba(77,124,15,0.10)">কাজ</th><th style="background:rgba(77,124,15,0.10)">✓</th></tr><tr><td>সোমবার</td><td>সকালে হাঁটা</td><td></td></tr><tr><td>মঙ্গলবার</td><td>বই পড়া</td><td></td></tr><tr><td>বুধবার</td><td>পানি ৮ গ্লাস</td><td></td></tr><tr><td>বৃহস্পতিবার</td><td>নতুন শব্দ শেখা</td><td></td></tr><tr><td>শুক্রবার</td><td>দাওয়াতে পড়া</td><td></td></tr></table>
<p style="text-align:center"><span style="font-size:10pt; color:${C.soft}">সপ্তাহ শেষে পাঁচটির কয়টি পূরণ হলো, গুনে নাও</span></p>
`.trim(),
    },
    { // সাপ্তাহিক প্রতিফলন — লেখার ফাঁকা জায়গা
      html: `
<h2 style="text-align:center; color:#3f6212">সপ্তাহের প্রতিফলন</h2>
<p style="text-align:center"><em>এই সপ্তাহে আমি শিখলাম —</em></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<p></p>
<hr class="fancy-divider" data-style="dotted" />
<p style="text-align:center"><em>আগামী সপ্তাহে আমার একটি ছোট প্রতিশ্রুতি —</em></p>
`.trim(),
    },
    { // শেষ পাতা — আবার লেখার ডাক
      html: `
${sp(3)}
<p style="text-align:center"><span style="font-size:13pt; color:#4d7c0f">❧ ─── ✦ ─── ❧</span></p>
<p style="text-align:center"><em>লেখা বদলায় না — বদলে যায় লেখা মানুষটিই।</em></p>
<h2 style="text-align:center; color:#1a2e05"><span style="font-size:19pt">চলো, আবার লিখি</span></h2>
${TIP_NOTE}
`.trim(),
    },
  ],
};

// ═══════════════════════ ১০. প্রতিবেদন — পেশাদার গবেষণা ═══════════════════════

const report: BookBlueprint = {
  id: 'bp-report',
  name: 'প্রতিবেদন — পেশাদার গবেষণা',
  desc: 'গবেষণা ও মূল্যায়নের আনুষ্ঠানিক প্রতিবেদন — পাথর-কালি ও তাম্র-সোনার দৃঢ় প্যালেট, নির্বাহী সারসংক্ষেপ আর তথ্য-টেবিল',
  accent: '#44403c',
  genre: 'report',
  tags: ['আনুষ্ঠানিক শিরোনাম পাতা', 'নির্বাহী সারসংক্ষেপ', 'বিষয়সূচি', 'তথ্য-টেবিলসহ ফলাফল', 'সুপারিশ', 'শেষ পাতা'],
  settings: {
    paperSize: 'a4',
    defaultFont: 'Noto Sans Bengali',
    defaultFontSize: 11,
    lineHeight: 1.55,
    paragraphSpacing: 6,
    headerStyle: 'academic',
    accentColor: '#44403c',
    pageBorder: 'none',
    headerLeft: 'প্রতিবেদন',
    headerRight: 'সংস্করণ · তারিখ',
  },
  pages: [
    { // আনুষ্ঠানিক শিরোনাম পাতা — ডাবল-রেখার দলিল ধাঁচ
      noChrome: true,
      html: `
${sp(2)}
${cap('প্রতিষ্ঠানের নাম', C.muted, 12, 4)}
<hr class="fancy-divider" data-style="double" />
<h1 style="text-align:center; color:${C.ink}"><span style="font-size:24pt">প্রতিবেদনের শিরোনাম</span></h1>
<hr class="fancy-divider" data-style="double" />
${cap('প্রস্তুতকর্তা: নাম · পদবি', C.muted, 11, 2)}
${cap('তারিখ: দিন-মাস-সাল', C.muted, 11, 2)}
${sp(2)}
${buildDesignBoxHtml({ variant: 'pill', border: C.stone, fill: 'rgba(41,37,36,0.05)' }, '<p style="text-align:center"><span style="font-size:9pt; color:' + C.stone + '; letter-spacing:3px">শ্রেণিবিন্যাস: অভ্যন্তরীণ ব্যবহার</span></p>')}
`.trim(),
    },
    { // নির্বাহী সারসংক্ষেপ
      html: `
${orn('✦', '❖', '✦', C.soft, 10, 12)}
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:17pt">নির্বাহী সারসংক্ষেপ</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('concept', 'এক নজরে', '<p>এই প্রতিবেদনে যাচাই করা হয়েছে প্রকল্পের অগ্রগতি, ব্যয় ও ঝুঁকি — সামগ্রিক অবস্থা প্রত্যাশামতো।</p>')}
<h3 style="color:${C.stone}">মুখ্য ফলাফল</h3>
<ul><li>প্রথম ফলাফল — এক লাইনে</li><li>দ্বিতীয় ফলাফল — সংখ্যাসহ</li><li>তৃতীয় ফলাফল — পরবর্তী পদক্ষেপসহ</li></ul>
${TIP_NOTE}
`.trim(),
    },
    { // বিষয়সূচি — ছায়া-ব্যান্ড
      html: `
${sp(1)}
${band('বিষয়সূচি', C.ink, 'rgba(41,37,36,0.06)', 15)}
<p style="text-align:center"><span style="font-size:10pt; color:${C.gold}">❖</span></p>
${buildTocHtml('[]', 'বিষয়সূচি')}
`.trim(),
    },
    { // ফলাফল পাতা — তথ্য-টেবিল
      html: `
<h2 style="color:${C.ink}">৩. তথ্য উপস্থাপন</h2>
<h3 style="color:${C.stone}">৩.১ মূল তথ্য</h3>
<p>টেবিলের তথ্যের সংক্ষিপ্ত ব্যাখ্যা এখানে লিখুন — এই পাতা ফ্লো-পাতা।</p>
<table><tr><th style="text-align:left; background:rgba(41,37,36,0.07)">বিষয়</th><th style="text-align:left; background:rgba(41,37,36,0.07)">সংখ্যা</th><th style="text-align:left; background:rgba(41,37,36,0.07)">মন্তব্য</th></tr><tr><td>জরিপে অংশগ্রহণ</td><td>৫০০ জন</td><td>লক্ষ্যমাত্রা পূরণ</td></tr><tr><td>ইতিবাচক মত</td><td>৬৮%</td><td>গত বছরের চেয়ে বেশি</td></tr><tr><td>সমস্যা জানিয়েছেন</td><td>২২%</td><td>বেশিরভাগ পরিবহন</td></tr><tr><td>পুনরায় অংশ নেবেন</td><td>৮১%</td><td>আস্থার সংকেত</td></tr></table>
<h3 style="color:${C.stone}">৩.২ পর্যবেক্ষণ</h3>
<p>পর্যবেক্ষণের ব্যাখ্যা — সংখ্যার পেছনের কারণটি এখানে ব্যাখ্যা করুন।</p>
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // সুপারিশ
      html: `
${orn('━', '❖', '━', C.soft, 10, 10)}
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:17pt">৪. সুপারিশ</span></h2>
<hr class="fancy-divider" data-style="double" />
<p>তথ্য-বিশ্লেষণের ভিত্তিতে নিম্নলিখিত সুপারিশগুলো করা হলো —</p>
<ol><li>প্রথম সুপারিশ — কাজের সুযোগ ও দায়িত্বসহ</li><li>দ্বিতীয় সুপারিশ — সময়সীমা উল্লেখসহ</li><li>তৃতীয় সুপারিশ — বাজেটের অনুমানসহ</li><li>চতুর্থ সুপারিশ — যাচাই-পদ্ধতিসহ</li></ol>
${buildCalloutHtml('warning', 'ঝুঁকি নোট', '<p>সুপারিশ বাস্তবায়নে সময়সীমা না মানলে প্রকল্পের সময়রেখা প্রভাবিত হবে।</p>')}
`.trim(),
    },
    { // শেষ পাতা — দলিল-সমাপ্তি
      html: `
${sp(4)}
${orn('❖', '━', '❖', C.soft, 10, 10)}
${cap('প্রতিষ্ঠানের নাম', C.muted, 12, 3)}
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:18pt">প্রতিবেদন সমাপ্ত</span></h2>
<hr class="fancy-divider" data-style="double" />
${cap('প্রস্তুতকর্তা · যাচাইকারী · তারিখ', C.muted, 10, 2)}
`.trim(),
    },
  ],
};

// ═══════════════════════ ১১. ম্যাগাজিন — সাহিত্য পত্রিকা ═══════════════════════

const magazine: BookBlueprint = {
  id: 'bp-magazine',
  name: 'ম্যাগাজিন — সাহিত্য পত্রিকা',
  desc: 'পত্রিকার মস্তহেড থেকে কবিতা-কোণ — মেরুন-সোনালি সাহসী মস্তহেড, সম্পাদকীয়, গল্প আর পাঠকের লেখা পাঠানোর তথ্যসহ পূর্ণাঙ্গ সংখ্যা',
  accent: '#9f1239',
  genre: 'magazine',
  tags: ['মস্তহেড পাতা', 'সম্পাদকীয়', 'এ সংখ্যায়', 'গল্প', 'কবিতা-কোণ', 'লেখা পাঠাও'],
  settings: {
    paperSize: 'letter',
    defaultFont: 'Anek Bangla',
    defaultFontSize: 11,
    lineHeight: 1.6,
    paragraphSpacing: 6,
    headerStyle: 'parallel',
    accentColor: '#9f1239',
    pageBorder: 'none',
    headerLeft: 'বর্ষ ১ · সংখ্যা ১',
    headerRight: 'মাস-সাল',
  },
  pages: [
    { // মস্তহেড পাতা — ডাবল-রেখার সাহসী মস্তক
      noChrome: true,
      html: `
${sp(2)}
${cap('সাহিত্য পত্রিকা', C.goldDeep, 10, 6)}
<h1 style="text-align:center; color:#881337"><span style="font-size:28pt">পত্রিকার নাম</span></h1>
${cap('বর্ষ ১ · সংখ্যা ১ · মাস-সাল', C.muted, 11, 3)}
<hr class="fancy-divider" data-style="double" />
${orn('❖', '✦', '❖', C.maroon2, 10, 10)}
${cap('সম্পাদক: নাম', C.muted, 10, 2)}
`.trim(),
    },
    { // সম্পাদকীয় — ড্রপ-ক্যাপ চিঠি
      html: `
<h2 style="text-align:center; color:#881337"><span style="font-size:17pt">সম্পাদকীয়</span></h2>
<hr class="fancy-divider" data-style="double" />
<p><span style="font-size:15pt; color:${C.maroon2}">এ</span>ই সংখ্যায় পাঠকদের জন্য রয়েছে নতুন গল্প, কবিতা আর স্মরণীয় কিছু চিঠি। এই পাতায় সম্পাদকের মনের কথা লিখুন — এই সংখ্যা কেন ভিন্ন, তারই ভূমিকা।</p>
<p>দ্বিতীয় প্যারায় পাঠক-লেখকের প্রতি ধন্যবাদ আর পরের সংখ্যার ইঙ্গিত দিন।</p>
${buildCalloutHtml('note', 'সম্পাদকের চোখে', '<p>পত্রিকাটি পাঠক-লেখকের সেতু — তোমার লেখাও এখানে ছাপা হতে পারে।</p>')}
<p style="text-align:right"><em>— সম্পাদকের নাম</em></p>
${TIP_NOTE}
`.trim(),
    },
    { // এ সংখ্যায়
      html: `
${sp(1)}
${orn('❖', '✦', '❖', C.maroon2, 10, 12)}
<h2 style="text-align:center; color:${C.maroon2}"><span style="font-size:20pt">এ সংখ্যায়</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', 'এ সংখ্যায়')}
${cap('লেখায় হেডিং দিলেই তালিকা বসে যাবে', C.soft, 9, 1)}
`.trim(),
    },
    { // গল্প পাতা — ড্রপ-ক্যাপ শুরু
      html: `
<h2 style="color:#881337">গল্প: নদীর নাম ছিল রূপকথা</h2>
<p><span style="font-size:16pt; color:${C.maroon2}">সে</span>দিন সকালে নদীর ধারে কুয়াশা এখনো চুলোয় জমে ছিল — গল্পের প্রথম প্যারা এখানে লিখুন। প্রথম প্যারাই পাঠককে ধরে রাখে, তাই শুরুটা রাখুন দৃশ্যপট দিয়ে।</p>
<p>দ্বিতীয় প্যারায় চরিত্র আর ঘটনার সূত্র ধরুন — লিখতে থাকলে বাকি অংশ পরের পাতায় নিজেই চলে যাবে।</p>
<p style="text-align:center"><span style="font-size:11pt; color:${C.soft}">❧</span></p>
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // কবিতা-কোণ
      html: `
<p style="text-align:center"><span style="font-size:10pt; color:${C.goldDeep}; letter-spacing:5px">কবিতা-কোণ</span></p>
<p style="text-align:center"><span style="font-size:10pt; color:${C.maroon2}">✦</span></p>
<h2 style="text-align:center; color:#881337">বৃষ্টির চিঠি</h2>
<p style="text-align:center; line-height:1.9"><em>ছাদের কলসে জল জমেছে<br/>পেট্রিকটে ভোর শোয়ে<br/>তোমার নামটা লিখে<br/>বৃষ্টি চলে গেছে চুপিচুপি</em></p>
<hr class="fancy-divider" data-style="stars" />
`.trim(),
    },
    { // শেষ পাতা — লেখা পাঠাও
      html: `
${sp(2)}
${orn('❖', '✦', '❖', C.maroon2, 11, 12)}
<h2 style="text-align:center; color:#881337"><span style="font-size:19pt">পরের সংখ্যায়</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('note', 'লেখা পাঠাও', '<ul><li>গল্প, কবিতা বা প্রবন্ধ ইমেইলে পাঠাও</li><li>গল্প ১৫০০ শব্দ · কবিতা ৩০ লাইন পর্যন্ত</li><li>নাম, ঠিকানা ও ফোন নম্বর সহ লিখো</li></ul>')}
${cap('পত্রিকার নাম · ইমেইল · ঠিকানা', C.muted, 10, 2)}
`.trim(),
    },
  ],
};

// ═══════════════════════ ১২. ইসলামিক — নূর সংকলন ═══════════════════════

const islamic: BookBlueprint = {
  id: 'bp-islamic',
  name: 'ইসলামিক — নূর সংকলন',
  desc: 'প্রশান্ত ইসলামিক সংকলন — ক্রিম কাগজে সবুজ-সোনালি জ্যামিতিক শোভা, স্তরিত ফ্রেমের শিরোনাম, দোয়া-হাদিসের কলআউট',
  accent: '#166534',
  genre: 'islamic',
  tags: ['বিসমিল্লাহ শিরোনাম পাতা', 'সূচিপত্র', 'পরিচ্ছেদ পাতা', 'দোয়া ও হাদিস', 'ফজিলত', 'দোয়ার শেষ পাতা'],
  settings: {
    paperSize: 'demy-octavo',
    paperColor: 'cream',
    defaultFont: 'Tiro Bangla',
    defaultFontSize: 12,
    lineHeight: 1.8,
    paragraphSpacing: 6,
    headerStyle: 'royal',
    accentColor: '#166534',
    pageBorder: 'ornamental',
    headerCenter: 'নূর সংকলন',
  },
  pages: [
    { // বিসমিল্লাহ শিরোনাম পাতা — স্তরিত সবুজ-সোনা ফ্রেম
      noChrome: true,
      html: `
${sp(2)}
${layeredFrame(
  `<p style="text-align:center"><span style="font-size:13pt; color:${C.green}">☾ ❁ ☾</span></p>
<h1 style="text-align:center; color:${C.ink}"><span style="font-size:24pt">নূর সংকলন</span></h1>
<p style="text-align:center"><span style="font-size:13pt; color:${C.goldDeep}">বিসমিল্লাহির রাহমানির রাহীম</span></p>
${cap('দোয়া · হাদিস · আমলের সংকলন', C.muted, 10, 3)}`,
  C.green, C.goldDeep)}
${sp(2)}
<hr class="fancy-divider" data-style="flourish" />
${cap('সংকলকের নাম', C.muted, 11, 2)}
`.trim(),
    },
    { // সূচিপত্র — সবুজ শোভাযাত্রা
      html: `
${sp(1)}
${orn('❁', '✜', '❁', C.green, 10, 12)}
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:20pt">সূচিপত্র</span></h2>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', 'সূচিপত্র')}
`.trim(),
    },
    { // পরিচ্ছেদ পাতা — প্রশান্ত উদ্বোধন
      noChrome: true,
      html: `
${sp(4)}
${cap('পরিচ্ছেদ ১', C.goldDeep, 12, 6)}
<p style="text-align:center"><span style="font-size:8pt; color:${C.faint}">━━━━━━━━</span></p>
<h1 style="text-align:center; color:${C.ink}"><span style="font-size:21pt">দোয়া ও ফজিলত</span></h1>
${orn('✦', '✜', '✦', C.green, 10, 10)}
<p style="text-align:center"><em>প্রতিটি দোয়া কবুল হয় — হয়তো একবারে, হয়তো একটু পরে, আরও ভালো কিছুর বিনিময়ে।</em></p>
`.trim(),
    },
    { // দোয়া ও হাদিস
      html: `
<h2 style="color:${C.greenDeep}">দোয়া</h2>
${buildCalloutHtml('note', 'দোয়া', '<p style="text-align:center"><span style="font-size:13pt; color:' + C.greenDeep + '">রাব্বানা আতিনা ফিদ-দুনিয়া হাসানাহ, ওয়া ফিল-আখিরাতি হাসানাহ, ওয়া ক্বিনা আযাবান-নার</span></p><p style="text-align:center"><span style="font-size:10pt; color:' + C.muted + '">হে আমাদের প্রতিপালক! দুনিয়ায় কল্যাণ দাও, পরকালেও কল্যাণ দাও, আগুনের আযাব থেকে রক্ষা করো।</span></p>')}
<p>দোয়াটির প্রসঙ্গ আর কখন পড়া ভালো — তার সংক্ষিপ্ত ব্যাখ্যা এখানে লিখুন।</p>
<h2 style="color:${C.greenDeep}">হাদিস</h2>
${buildCalloutHtml('note', 'হাদিস', '<p style="text-align:center"><em>"সব কাজ নিয়তের উপর নির্ভর করে।"</em></p><p style="text-align:center"><span style="font-size:10pt; color:' + C.muted + '">— সহিহ বুখারী</span></p>')}
${TIP_NOTE}
`.trim(),
      flowLock: false,
    },
    { // ফজিলত
      html: `
<h2 style="text-align:center; color:${C.greenDeep}">আমলের ফজিলত</h2>
${orn('✦', '❁', '✦', C.goldDeep, 10, 10)}
${buildCalloutHtml('note', 'তিলাওয়াতের ফজিলত', '<p>কুরআনের প্রতিটি হরফ পড়ার জন্য নেকি রয়েছে — নিয়মিত অল্প অল্প করে পড়াই শ্রেয়।</p>')}
<ul><li>ফজর ও ইশার সালাতে জামাতে শরিক হওয়া</li><li>সকাল-সন্ধ্যার আজকার নিয়মিত পাঠ</li><li>প্রতি সপ্তাহে অন্তত এক পারা তিলাওয়াত</li></ul>
${TIP_NOTE}
`.trim(),
    },
    { // শেষ পাতা — দোয়ার আবেদন
      html: `
${sp(4)}
${orn('❁', '☾', '❁', C.green, 11, 12)}
<p style="text-align:center"><em>সংকলনে ভুলত্রুটি হলে ক্ষমাসুন্দর দৃষ্টিতে দেখুন — সবার দোয়া কাম্য।</em></p>
<h2 style="text-align:center; color:${C.ink}"><span style="font-size:19pt">সমাপ্ত</span></h2>
${cap('ওয়া সাল্লাল্লাহু আলা নাবিয়্যিনা মুহাম্মাদ', C.soft, 9, 2)}
`.trim(),
    },
  ],
};

/** স্টোরের "বইয়ের ডিজাইন" তালিকা — ক্রমই প্রদর্শনের ক্রম */
export const BOOK_BLUEPRINTS: BookBlueprint[] = [
  novel,
  guide,
  poetry,
  textbook,
  science,
  children,
  cooking,
  history,
  journal,
  report,
  magazine,
  islamic,
];

/** id দিয়ে ব্লুপ্রিন্ট খোঁজা */
export function getBlueprint(id: string): BookBlueprint | undefined {
  return BOOK_BLUEPRINTS.find((b) => b.id === id);
}

/** ব্লুপ্রিন্টের পাতাগুলোকে স্টোরের PageData-তে রূপ দেওয়া */
export function blueprintToPageData(bp: BookBlueprint, newId: (prefix: string) => string): PageData[] {
  return bp.pages.map((p) => ({
    id: newId('pg'),
    kind: 'normal' as const,
    html: p.html || '<p></p>',
    noChrome: Boolean(p.noChrome),
    flowLock: p.flowLock ?? true,
  }));
}
