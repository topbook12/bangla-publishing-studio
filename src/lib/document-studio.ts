/**
 * ডকুমেন্ট স্টুডিও — কোর লজিক (Document Studio — core logic)
 * ──────────────────────────────────────────────────────────────────
 * প্রশ্নপত্র ও সাজেশনের পাশাপাশি বাংলাদেশের সব প্রথাসিদ্ধ ডকুমেন্ট —
 * সনদপত্র, দরখাস্ত, দলিল, অফিস-প্রশাসন, ব্যবসা, শিক্ষা-প্রতিষ্ঠান, অনুষ্ঠান,
 * চিকিৎসা ও প্রচার — ৯ ক্যাটাগরিতে ২৯টি ফরম্যাট-নির্ভুল নকশা।
 *
 * কাঠামো (UI-মুক্ত, সম্পূর্ণ পরীক্ষণযোগ্য):
 *  - DsField/DsTemplate — ফরম-ফিল্ড স্কিমা + HTML-নির্মাতা
 *  - buildDsHtml — মান → এডিটর-স্কিমা-বৈধ HTML (paragraph/heading/table/
 *    doc-textbox/callout-box/doc-columns/fancy-divider মাত্র)
 *
 * ডিজাইন-সিদ্ধান্ত:
 *  - ফরম্যাট-নির্ভুলতা প্রথম: ইউনিয়ন-সনদের "প্রত্যয়িত করা হচ্ছে যে" ভাষা,
 *    দরখাস্তের "বিনীত নিবেদক" পদ্ধতি, দলিলের আইনি ধাঁচ, ইনভয়েসে কথায়-টাকা —
 *    সবই বাংলাদেশের আসল প্রথা অনুযায়ী।
 *  - এক কালি-প্যালেট প্রথা — রয়্যাল মেরুন+গোল্ড, বন-সবুজ, গাঢ় টিল, সেপিয়া —
 *    নীল/ইন্ডিগো প্রাইমারি নয়। সনদ/দরখাস্ত/রসিদ জিরোক্স-প্রথায় প্রিন্ট-ফার্স্ট।
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
 * TipTap সেলের সাধারণ style ফেলে দেয়, তাই অ্যাট্রিবিউটই প্রকৃত বাহক; colwidth
 * অ্যাট্রিবিউট এডিটরে স্তম্ভ-প্রস্থ ধরে রাখে।
 */
function row2(leftHtml: string, rightHtml: string, leftPct = 50, rightPct = 50): string {
  const cell = (html: string, pct: number) =>
    `<td colwidth="${Math.round((600 * pct) / 100)}" data-border="none" style="border:none; width:${pct}%; vertical-align:top">${html}</td>`;
  return `<table style="width:100%"><tr>${cell(leftHtml, leftPct)}${cell(rightHtml, rightPct)}</tr></table>`;
}

/** ডট-লাইন পূরণ-জায়গা (ফরমের ফাঁকা ঘর) */
function dots(n = 18): string {
  return `<span style="color:#94a3b8; letter-spacing:1px">${'·'.repeat(n)}</span>`;
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

/** সাজ-বিকল্প — প্রতিটি টেমপ্লেট এর মধ্য থেকে বেছে নেয় */
export const DS_STYLES: DsStyleOpt[] = [
  { id: 'classic', name: L3('ক্লাসিক কালি', 'क्लासिक', 'Classic ink'), P: P_CLASSIC },
  { id: 'royal', name: L3('রয়্যাল মেরুন', 'रॉयल मैरून', 'Royal maroon'), P: P_ROYAL },
  { id: 'green', name: L3('বন-সবুজ', 'वन-हरित', 'Forest green'), P: P_GREEN },
  { id: 'teal', name: L3('গাঢ় টিল', 'गहरा टील', 'Deep teal'), P: P_TEAL },
  { id: 'sepia', name: L3('সেপিয়া সংরক্ষণাগার', 'सेपिया', 'Sepia archive'), P: P_SEPIA },
];

function styleById(id: string, fallback = 'classic'): DsStyleOpt {
  return DS_STYLES.find((s) => s.id === id) ?? DS_STYLES.find((s) => s.id === fallback)!;
}

// ─── টাইপ ───

export type DsCategory = 'cert' | 'apply' | 'land' | 'office' | 'biz' | 'edu' | 'event' | 'med' | 'promo';

export const DS_CATEGORY_ORDER: DsCategory[] = ['cert', 'apply', 'land', 'office', 'biz', 'edu', 'event', 'med', 'promo'];

export const DS_CATEGORY_LABELS: Record<DsCategory, T3> = {
  cert: L3('সনদপত্র', 'प्रमाणपत्र', 'Certificates'),
  apply: L3('হলফনামা ও দরখাস্ত', 'शपथ व आवेदन', 'Affidavits & Applications'),
  land: L3('জমি-দলিল', 'भूमि-दस्तावेज', 'Land Deeds'),
  office: L3('অফিস-প্রশাসন', 'कार्यालय-प्रशासন', 'Office & Administration'),
  biz: L3('ব্যবসা', 'व्यापार', 'Business'),
  edu: L3('শিক্ষা-প্রতিষ্ঠান', 'शिक्षा-संस्था', 'Institutions'),
  event: L3('অনুষ্ঠান', 'अनुष्ठान', 'Events'),
  med: L3('চিকিৎসা', 'चिकित्सा', 'Medical'),
  promo: L3('প্রচার-মাধ্যম', 'प्रचार-माध्यम', 'Promotion'),
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
    `<p style="margin-top:0.9em; line-height:1.9; text-align:justify">${esc(opts.opener)} <strong>${esc(V(v, 'name'))}</strong>${detailHtml}। ${esc(V(v, 'body'))}</p>`,
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
  category: 'cert',
  name: L3('স্থায়ী নিবাসী সনদ', 'स्थायी निवास प्रमाणपत्र', 'Permanent Residence Certificate'),
  desc: L3('ইউনিয়ন/পৌরসভার স্থায়ী বাসিন্দা হওয়ার অফিসিয়াল সনদ — ভর্তি, নামজারি ও সরকারি কাজে লাগে।', 'स्थायी निवासी प्रमाणपत्र।', 'Official permanent-residence certificate.'),
  styles: ['classic', 'green', 'royal'],
  defaultStyle: 'classic',
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
  category: 'cert',
  name: L3('চারিত্রিক সনদ', 'चारित्रिक प्रमाणपत्र', 'Character Certificate'),
  desc: L3('নাগরিকের আচরণ-চরিত্র সম্পর্কে এলাকার কর্তৃপক্ষের প্রত্যয়ন — চাকরি ও ভর্তিতে ব্যবহৃত।', 'चारित्रिक प्रमाणपत्र।', 'Character attestation certificate.'),
  styles: ['classic', 'green', 'royal'],
  defaultStyle: 'classic',
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
  category: 'cert',
  name: L3('অবিবাহিত সনদ', 'अविवाहित प्रमाणपत्र', 'Unmarried Certificate'),
  desc: L3('বিবাহ-বহির্ভূত অবস্থা প্রত্যয়ন — নিয়োগ, ভিসা ও প্রশাসনিক কাজে ব্যবহৃত।', 'अविवाहित प्रमाणपत्र।', 'Unmarried status certificate.'),
  styles: ['classic', 'green'],
  defaultStyle: 'classic',
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
  category: 'cert',
  name: L3('বার্ষিক আয় সনদ', 'वार्षिक आय प्रमाणपत्र', 'Annual Income Certificate'),
  desc: L3('পারিবারিক বার্ষিক আয়ের প্রত্যয়ন — বৃত্তি, ভর্তি-ছাড় ও আইনসহায়তায় লাগে।', 'वार्षिक आय प्रमाणपत्र।', 'Annual income certificate.'),
  styles: ['classic', 'green'],
  defaultStyle: 'classic',
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
  category: 'cert',
  name: L3('ওয়ারিশ সনদ', 'वारिस प्रमाणपत्र', 'Heir / Inheritance Certificate'),
  desc: L3('মৃত ব্যক্তির স্বামী/স্ত্রী, ছেলে-মেয়ে ও ওয়ারিশগণের তালিকাসহ সনদ — নামজারি ও দলিলে প্রয়োজন।', 'वारिस प्रमाणपत्र।', 'Certificate listing legal heirs.'),
  styles: ['classic', 'green', 'royal'],
  defaultStyle: 'classic',
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
  category: 'apply',
  name: L3('হলফনামা', 'शपथ पत्र', 'Affidavit'),
  desc: L3('নোটারি-পাবলিক প্রথায় স্বঘোষিত হলফনামা — সাধারণ ঘোষণা, তথ্য-নিশ্চিতকরণ ও প্রতিশ্রুতি।', 'शपथ पत्र।', 'Self-declared affidavit.'),
  styles: ['classic', 'sepia', 'royal'],
  defaultStyle: 'classic',
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
        : `<ol><li>${dots(60)}</li></ol>`,
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
  category: 'apply',
  name: L3('সাধারণ দরখাস্ত', 'सामान्य आवेदन/दरखास्त', 'General Application'),
  desc: L3('কর্তৃপক্ষ বরাবর বিনীত দরখাস্ত — ভর্তি, চাকরি, অনুমতি, সাহায্য — যেকোনো বিষয়ে।', 'सामान्य आवेदन।', 'General petition/application.'),
  styles: ['classic', 'green', 'teal'],
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
  category: 'apply',
  name: L3('নামজারির দরখাস্ত', 'नामजारी आवेदन', 'Land Mutation Application'),
  desc: L3('উপজেলা নির্বাহী অফিসার/সার্কেল অফিস বরাবর ভূমি-নামজারির প্রথাসিদ্ধ দরখাস্ত।', 'नामजारी आवेदन।', 'Mutation petition to land office.'),
  styles: ['classic', 'sepia'],
  defaultStyle: 'classic',
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
  category: 'land',
  name: L3('হেবানামা (দানপত্র)', 'हेबा-नामा (दानपत्र)', 'Gift Deed (Heba)'),
  desc: L3('পিতা-মাতা → ছেলে-মেয়ে বা আত্মীয়কে বিনা-প্রতিদানে জমি দানের আইনি হেবানামা।', 'हेबा-नामा।', 'Gift deed without consideration.'),
  styles: ['classic', 'sepia'],
  defaultStyle: 'classic',
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
  category: 'land',
  name: L3('বন্টননামা', 'बंटननामा', 'Deed of Partition'),
  desc: L3('ওয়ারিশদের মধ্যে ঐত্যভাগ জমি সমান-শর্তে বণ্টনের আইনি দলিল।', 'बंटननामा।', 'Partition deed among heirs.'),
  styles: ['classic', 'sepia'],
  defaultStyle: 'classic',
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
  category: 'land',
  name: L3('ভায়া দলিল (সাফ কবলা)', 'भाया दस्तावेज़ (सफ कबला)', 'Sale Deed (Vhaya)'),
  desc: L3('নগদ প্রতিদানে জমি ক্রয়-বিক্রয়ের ভায়া দলিল — পাটোয়ারি প্রথা অনুযায়ী।', 'भाया दस्तावेज़।', 'Sale deed for consideration.'),
  styles: ['classic', 'sepia'],
  defaultStyle: 'classic',
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
  styles: ['classic', 'green', 'royal', 'teal'],
  defaultStyle: 'classic',
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
  styles: ['classic', 'green', 'sepia'],
  defaultStyle: 'classic',
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
  styles: ['classic', 'green', 'teal'],
  defaultStyle: 'classic',
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
  styles: ['classic', 'green', 'teal', 'sepia'],
  defaultStyle: 'classic',
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
 */
export function wordsTaka(n: number, lang: Lang): string {
  if (!Number.isFinite(n) || n <= 0) return '—';
  const onesBn = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ', 'বিশ', 'একুশ', 'বাইশ', 'তেইশ', 'চব্বিশ', 'পঁচিশ', 'ছাব্বিশ', 'সাতাশ', 'আটাশ', 'উনত্রিশ', 'ত্রিশ', 'একত্রিশ', 'বত্রিশ', 'তেত্রিশ', 'চৌত্রিশ', 'পঁয়ত্রিশ', 'ছত্রিশ', 'সাঁইত্রিশ', 'আটত্রিশ', 'উনচল্লিশ', 'চল্লিশ', 'একচল্লিশ', 'বিয়াল্লিশ', 'তেতাল্লিশ', 'চুয়াল্লিশ', 'পঁয়তাল্লিশ', 'ছেচল্লিশ', 'সাতচল্লিশ', 'আটচল্লিশ', 'উনপঞ্চাশ', 'পঞ্চাশ', 'একান্ন', 'বায়ান্ন', 'তিপ্পান্ন', 'চুয়ান্ন', 'পঞ্চান্ন', 'ছাপ্পান্ন', 'সাতান্ন', 'আটান্ন', 'উনষাট', 'ষাট', 'একষট্টি', 'বাষট্টি', 'তেষট্টি', 'চৌষট্টি', 'পঁয়ষট্টি', 'ছেষট্টি', 'সাতষট্টি', 'আটষট্টি', 'উনসত্তর', 'সত্তর', 'একাত্তর', 'বাহাত্তর', 'তিয়াত্তর', 'চুয়াত্তর', 'পঁচাত্তর', 'ছিয়াত্তর', 'সাতাত্তর', 'আটাত্তর', 'উনআশি', 'আশি', 'একাশি', 'বিরাশি', 'তিরাশি', 'চুরাশি', 'পঁচাশি', 'ছিয়াশি', 'সাতাশি', 'আটাশি', 'উননব্বই', 'নব্বই', 'একানব্বই', 'বিরানব্বই', 'তিরানব্বই', 'চুরানব্বই', 'পঁচানব্বই', 'ছিয়ানব্বই', 'সাতানব্বই', 'আটানব্বই', 'নিরানব্বই'];
  const onesEn = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const tensEn = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const twoEn = (x: number): string => (x < 20 ? onesEn[x] : `${tensEn[Math.floor(x / 10)]}${x % 10 ? `-${onesEn[x % 10]}` : ''}`);
  const twoBn = (x: number): string => (x < onesBn.length ? onesBn[x] : String(x));

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const rest = n % 1000;
  if (lang !== 'bn') {
    const parts: string[] = [];
    if (crore) parts.push(`${twoEn(crore)} crore`);
    if (lakh) parts.push(`${twoEn(lakh)} lakh`);
    if (thousand) parts.push(`${twoEn(thousand)} thousand`);
    if (rest) parts.push(twoEn(rest));
    return `${parts.join(' ')} taka only`;
  }
  const parts: string[] = [];
  if (crore) parts.push(`${twoBn(crore)} কোটি`);
  if (lakh) parts.push(`${twoBn(lakh)} লক্ষ`);
  if (thousand) parts.push(`${twoBn(thousand)} হাজার`);
  if (rest) parts.push(twoBn(rest));
  return `${parts.join(' ')} টাকা মাত্র`;
}

const INVOICE_TPL: DsTemplate = {
  id: 'invoice',
  category: 'biz',
  name: L3('ইনভয়েস/চালান', 'इनवॉइस/चालान', 'Invoice'),
  desc: L3('পরিমাণ×দর=টাকা স্বয়ংক্রিয় গণনাসহ পেশাদার চালান — কথায়-মোট, ভ্যাট, স্বাক্ষর।', 'पेशेवर इनवॉइस।', 'Invoice with auto totals.'),
  styles: ['classic', 'teal', 'royal', 'green'],
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
    const totalRow = (label: string, val: string, bold = false) =>
      `<tr><td colspan="3" style="text-align:right${bold ? '; font-weight:700' : ''}">${esc(label)}</td><td style="text-align:right${bold ? '; font-weight:700' : ''}">${esc(val)}</td></tr>`;
    return [
      pc(`<strong style="font-size:14pt; letter-spacing:0.5px">${esc(V(v, 'shop'))}</strong>`, `color:${P.head}`),
      V(v, 'address') ? pc(`<span style="font-size:10.5pt">${esc(V(v, 'address'))}</span>`) : '',
      V(v, 'phone') ? pc(`<span style="font-size:10.5pt; color:${P.soft}">${esc(V(v, 'phone'))}</span>`) : '',
      pc(`<strong style="font-size:11.5pt">${esc(pick(lang, 'চালান / ইনভয়েস', 'चालान / इनवॉइस', 'INVOICE'))}</strong>`, `color:${P.head}`),
      row2(
        `<p style="text-align:left; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'invoiceNo') ? `${pick(lang, 'চালান নং', 'चालान सं.', 'Invoice no.')}: ${V(v, 'invoiceNo')}` : '')}</p>`,
        `<p style="text-align:right; margin:0; font-size:10pt; color:${P.soft}">${esc(V(v, 'date') ? `${tx(lang, DSB.date)}: ${V(v, 'date')}` : '')}</p>`,
      ),
      V(v, 'buyer')
        ? `<div class="doc-textbox" data-variant="box" data-border="${P.border}" data-fill="transparent" data-bstyle="solid" data-bwidth="1"><p style="margin:0"><strong>${esc(pick(lang, 'প্রাপকের নাম ও ঠিকানা', 'प्रापक का नाम व पता', 'Bill to:'))}</strong></p>${lines(V(v, 'buyer')).map((l) => `<p style="margin:0.1em 0">${esc(l)}</p>`).join('')}</div>`
        : '',
      `<table><tr><th style="text-align:left">${esc(pick(lang, 'বিবরণ', 'विवरण', 'Description'))}</th><th>${esc(pick(lang, 'পরিমাণ', 'मात्रा', 'Qty'))}</th><th style="text-align:right">${esc(pick(lang, 'দর', 'दर', 'Rate'))}</th><th style="text-align:right">${esc(pick(lang, 'টাকা', 'राशि', 'Amount'))}</th></tr>${bodyRows}${totalRow(tx(lang, DSB.total), numStr(sub, lang))}${disc ? totalRow(pick(lang, 'ছাড়', 'छूट', 'Discount'), `− ${numStr(disc, lang)}`) : ''}${vatAmt ? totalRow(`${pick(lang, 'ভ্যাট', 'वैट', 'VAT')} (${V(v, 'vat')}%)`, `+ ${numStr(vatAmt, lang)}`) : ''}${totalRow(pick(lang, 'সর্বমোট প্রদেয়', 'कुल देय', 'Grand total'), numStr(total, lang), true)}</table>`,
      `<p style="font-size:10.5pt"><strong>${tx(lang, DSB.inWords)}:</strong> ${esc(wordsTaka(total, lang))}</p>`,
      V(v, 'note') ? `<p style="font-size:10pt; color:${P.soft}">${esc(V(v, 'note'))}</p>` : '',
      `<p style="text-align:right; margin-top:1.6em; border-top:1px solid ${P.border}; display:inline-block; float:right; padding:4px 26px 0; font-size:10pt">${esc(V(v, 'sign1Name') || pick(lang, 'অনুমোদিত স্বাক্ষর', 'अनुमोदित हस्ताक्षर', 'Authorised signature'))}</p>`,
      '<p style="clear:both; margin:0"></p>',
    ].filter(Boolean).join('');
  },
};

const MONEY_RECEIPT_TPL: DsTemplate = {
  id: 'money-receipt',
  category: 'biz',
  name: L3('টাকা আদায়ের রসিদ', 'नकद रसीद', 'Money Receipt'),
  desc: L3('রসিদ-নম্বর ও কথায়-টাকাসহ নগদ আদায়ের প্রথাসিদ্ধ রসিদ — মোহর-স্থানসহ।', 'नकद रसीद।', 'Cash receipt with stamp spot.'),
  styles: ['classic', 'green', 'royal'],
  defaultStyle: 'classic',
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
  category: 'biz',
  name: L3('চুক্তিপত্র', 'समझौता पत्र', 'Agreement'),
  desc: L3('দুই পক্ষের সমঝোতা চুক্তি — শর্তাবলি, সাক্ষী ও স্বাক্ষর-ব্লকসহ আইনি ধাঁচ।', 'समझौता पत्र।', 'Two-party agreement.'),
  styles: ['classic', 'sepia', 'royal'],
  defaultStyle: 'classic',
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
  styles: ['classic', 'teal', 'green', 'royal'],
  defaultStyle: 'teal',
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
  styles: ['classic', 'royal', 'teal', 'green'],
  defaultStyle: 'classic',
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
  styles: ['classic', 'green', 'teal'],
  defaultStyle: 'classic',
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
  category: 'edu',
  name: L3('প্রশংসাপত্র', 'प्रशंसा पत्र', 'Award Certificate'),
  desc: L3('স্বর্ণ-ফ্রেমসহ সম্মাননা-সনদ — সেরা ছাত্র, প্রতিযোগিতা ও কৃতিত্বের স্বীকৃতি।', 'प्रशंसा पत्र।', 'Framed award certificate.'),
  styles: ['royal', 'sepia', 'green', 'teal'],
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
  build: (v, lang, P) => {
    const inner = [
      pc(`<strong style="font-size:11pt; letter-spacing:2.5px">${esc(V(v, 'office'))}</strong>`, `color:${P.soft}`),
      pc(`<span style="font-size:20pt; color:${P.head}">✦</span>`),
      pc(`<strong style="font-size:19pt; letter-spacing:1px">${esc(V(v, 'title') || pick(lang, 'প্রশংসাপত্র', 'प्रशंसा पत्र', 'CERTIFICATE OF MERIT'))}</strong>`, `color:${P.head}`),
      pc(`<span style="font-size:11pt; color:${P.soft}">❦ ❖ ❦</span>`),
      `<p style="margin-top:1.1em; line-height:1.9; text-align:center; font-size:11.5pt">${esc(pick(lang, 'এই সনদ দ্বারা ঘোষিত হইতেছে যে,', 'यह प्रमाणपत्र घोषित किया जाता है कि,', 'This certificate is awarded to'))}</p>`,
      pc(`<strong style="font-size:17pt; color:${P.head}; border-bottom:2px solid ${P.border}; padding-bottom:2px">${esc(V(v, 'name'))}</strong>`),
      `<p style="margin-top:1em; line-height:1.95; text-align:center; font-size:11.5pt">${esc(V(v, 'body'))}</p>`,
      V(v, 'body2') ? `<p style="line-height:1.95; text-align:center; font-size:11pt; color:${P.soft}">${esc(V(v, 'body2'))}</p>` : '',
      V(v, 'date') ? pc(`<span style="font-size:11pt; color:${P.soft}">${esc(`${tx(lang, DSB.date)}: ${V(v, 'date')}`)}</span>`, 'margin-top:1em') : '',
      sig2(lang, P, { t: V(v, 'sign1Title'), n: V(v, 'sign1Name'), o: '' }, { t: V(v, 'sign2Title'), n: V(v, 'sign2Name'), o: '' }),
    ].filter(Boolean).join('');
    // স্বর্ণ-ফ্রেম: ডাবল-বক্সের ভিতরে সরু-বক্স (নেস্টিং সমর্থিত)
    return buildDesignBoxHtml({ variant: 'double', border: P.border, fill: 'transparent', bstyle: 'double', bwidth: 4 },
      buildDesignBoxHtml({ variant: 'box', border: P.border, fill: 'transparent', bstyle: 'solid', bwidth: 1 }, inner));
  },
};

const ADMISSION_TPL: DsTemplate = {
  id: 'admission',
  category: 'edu',
  name: L3('ভর্তি ফরম', 'प्रवेश फॉर्म', 'Admission Form'),
  desc: L3('ছবি-ঘর ও পূরণ-যোগ্য তথ্য-পঙক্তিসহ স্কুল-প্রথার ভর্তি ফরম।', 'प्रवेश फॉर्म।', 'Admission form with photo box.'),
  styles: ['classic', 'teal', 'green'],
  defaultStyle: 'classic',
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
        `<tr><td colwidth="240" data-border="none" style="border:none; width:40%; vertical-align:middle"><p style="margin:0.2em 0; font-size:11pt">${esc(label)}</p></td>` +
        `<td data-border="none" style="border:none; vertical-align:bottom"><p style="margin:0.5em 0; color:#94a3b8; letter-spacing:1px">${dots(26)}</p></td></tr>`)
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
      `<table style="width:100%"><tr>${fieldRows}</tr></table>`,
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
  styles: ['royal', 'teal', 'green', 'sepia'],
  defaultStyle: 'royal',
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
  styles: ['royal', 'sepia', 'teal'],
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
      pc(`<span style="font-size:12pt; color:${P.head}">ও</span>`, 'margin:0.3em 0'),
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
  styles: ['classic', 'teal', 'royal', 'green'],
  defaultStyle: 'classic',
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
      `<table><tr><th style="text-align:left; width:22%">${esc(pick(lang, 'সময়', 'समय', 'Time'))}</th><th style="text-align:left">${esc(pick(lang, 'পর্ব', 'पर्व', 'Programme'))}</th></tr>${rows.map((cells) => `<tr><td>${esc(cells[0] ?? '')}</td><td>${esc(cells[1] ?? '')}</td></tr>`).join('')}</table>`,
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
  styles: ['classic', 'teal', 'green'],
  defaultStyle: 'teal',
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
        ? `<table><tr><th style="text-align:left; width:52%">${esc(pick(lang, 'ওষুধ', 'दवा', 'Medicine'))}</th><th style="text-align:center; width:22%">${esc(pick(lang, 'মাত্রা', 'मात्रा', 'Dose'))}</th><th style="text-align:left">${esc(pick(lang, 'নিয়ম', 'नियम', 'Timing'))}</th></tr>${rows.map((cells) => `<tr><td>${esc(cells[0] ?? '')}</td><td style="text-align:center">${esc(cells[1] ?? '')}</td><td>${esc(cells[2] ?? '')}</td></tr>`).join('')}</table>`
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
  styles: ['royal', 'teal', 'green', 'sepia'],
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
  styles: ['teal', 'royal', 'green', 'classic'],
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

// ═════════════════════════ নিবন্ধিত টেমপ্লেট ═════════════════════════

/** সব টেমপ্লেট — ক্যাটাগরি-ক্রম অনুযায়ী (২৯টি) */
export const DS_TEMPLATES: DsTemplate[] = [
  RESIDENCE_TPL, CHARACTER_TPL, UNMARRIED_TPL, INCOME_TPL, HEIR_TPL,
  AFFIDAVIT_TPL, GENERAL_APP_TPL, MUTATION_TPL,
  GIFT_TPL, PARTITION_TPL, SALE_TPL,
  NOTICE_TPL, OFFICE_ORDER_TPL, OFFICIAL_LETTER_TPL, REPORT_TPL,
  INVOICE_TPL, MONEY_RECEIPT_TPL, AGREEMENT_TPL,
  CLASS_ROUTINE_TPL, EXAM_ROUTINE_TPL, MARKSHEET_TPL, AWARD_TPL, ADMISSION_TPL,
  INVITATION_TPL, WEDDING_TPL, PROGRAM_TPL,
  PRESCRIPTION_TPL,
  POSTER_TPL, FLYER_TPL,
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
    return root.innerHTML;
  } catch {
    return html;
  }
}
