/**
 * প্রশ্নপত্র স্টুডিও — কোর লজিক (Question Paper Studio — core logic)
 * ──────────────────────────────────────────────────────────────────
 * শিক্ষক হাতে-লেখা ছবি বা কাঁচা লেখা দেয় → AI বিশ্লেষণ করে প্রশ্ন শনাক্ত করে →
 * বিভাগ/নম্বর/নম্বর-মান/MCQ/গণিত-সহ পূর্ণ প্রিন্ট-রেডি প্রশ্নপত্র বানিয়ে দেয়।
 *
 * এই মডিউলে (UI মুক্ত, সম্পূর্ণ পরীক্ষণযোগ্য):
 *  - টাইপ + ডিফল্ট মেটা
 *  - AI সিস্টেম-প্রম্পট (হস্তলিপি-উদ্ধার + কাঠামোকরণ)
 *  - mathToHtml — $…$ LaTeX সেগমেন্ট → এডিটর-নিরাপদ HTML (sup/sub + ইউনিকোড)
 *  - parseQuestionText — AI ছাড়া লাইন-ভিত্তিক ফলব্যাক পার্সার
 *  - paperToEditorHtml / paperToStandaloneHtml — সন্নিবেশ + ডাউনলোড
 *
 * ডিজাইন-সিদ্ধান্ত:
 *  - KaTeX নয়: sup/sub + ইউনিকোড গণিত-চিহ্ন TipTap, DOCX/EPUB এক্সপোর্ট ও
 *    প্রিন্ট — সব পাইপলাইনে টিকে থাকে, নতুন ডিপেন্ডেন্সি লাগে না, অফলাইন চলে।
 *  - মনোক্রোম: প্রশ্নপত্র জিরোক্স-প্রথায় কালো-সাদা — প্রিন্ট-ফার্স্ট।
 */

import { toBanglaNumber, toDevanagariNumber, toEnglishDigits } from './bangla';
import type { Lang } from './i18n/core';
import { columnsStyleText } from './nodes-html';
// চিত্র-স্মার্ট-সিস্টেম — স্লট-মার্কার ক্যানোনিক্যাল এখানেই; রি-এক্সপোর্টে পুরনো আমদানিকারক অক্ষত
import { QP_FIGURE_RE, figureHtmlFor, type QpFigureFill } from './qp-figures';
export { QP_FIGURE_RE } from './qp-figures';
export type { QpFigureFill } from './qp-figures';

// ─── টাইপ ───

export type QpFormat = 'auto' | 'classic' | 'modern' | 'compact' | 'board' | 'royal' | 'twocol' | 'university' | 'sugslip' | 'quiz';
export type QpResolvedFormat = 'classic' | 'modern' | 'compact' | 'board' | 'royal' | 'twocol' | 'university' | 'sugslip' | 'quiz';
/** টাইপোগ্রাফি স্কেল — ছোট / মাঝারি / বড় */
export type QpFontScale = 'sm' | 'md' | 'lg';

// ─── উন্নত লেআউট-সিস্টেম (শিক্ষকের সাজানোর পূর্ণ নিয়ন্ত্রণ) ───

/** কলাম — স্বয়ংক্রিয় (MCQ-বিভাগে ২) বা নির্দিষ্ট ১/২/৩; বাংলাদেশে নৈর্ব্যক্তিকে ২-৩ কলাম প্রথা */
export type QpColumns = 'auto' | '1' | '2' | '3';
/** পাতার মাপ — A4 / Letter / Legal / A5 (শ্রেণি-পরীক্ষা) */
export type QpPageSize = 'a4' | 'letter' | 'legal' | 'a5';
/** প্রশ্ন-নম্বরের ধরন — ১। (দণ্ড) / ১. / (১) / ১) */
export type QpNumStyle = 'danda' | 'dot' | 'paren' | 'dash';
/** নম্বর-মানের ধরন — ডান কলাম (আসল-পত্র প্রথা) / [২] / (২) / ২ নম্বর */
export type QpMarksStyle = 'right' | 'bracket' | 'paren' | 'word';
/** বিভাগ-শিরোনামের ধরন — মাঝে / বাক্সে / বাঁয়ে-রেখাযুক্ত */
export type QpSectionStyle = 'center' | 'box' | 'left';
/** MCQ-অপশনের সাজ — এক লাইনে / ২ সারিতে / তালিকায় */
export type QpMcqLayout = 'inline' | 'grid' | 'list';
/** উত্তরের জায়গা — প্রশ্নের নিচে ডট-লাইন (শ্রেণি-পরীক্ষার খাতা-ধাঁচ) */
export type QpAnswerSpace = 'none' | 'sm' | 'md' | 'lg';
/** প্রশ্নের ধরন — সংক্ষিপ্ত / MCQ / সৃজনশীল / মিলকরণ / সত্য-মিথ্যা / শূন্যস্থান */
export type QpQKind = 'short' | 'mcq' | 'creative' | 'match' | 'tf' | 'blank';

/** ডকুমেন্ট-ধরন — পরীক্ষার প্রশ্নপত্র নাকি শিক্ষকের সাজেশন শিট */
export type QpDocType = 'question' | 'suggestion';
/** প্রশ্নের গুরুত্ব — সাজেশন-শিটে ★ (১) / ★★ (২); অনুপস্থিত = সাধারণ */
export type QpImportance = 1 | 2;
/** শিক্ষার স্তর — স্কুল/মাদ্রাসা-প্রথা নাকি বিশ্ববিদ্যালয়-প্রথা (কোর্স-কোড, বিভাগ, বর্ষ-সেশন) */
export type QpLevel = 'school' | 'university';

/** স্তর-মান নিরাপদ — অজানা মান পেলে undefined */
export function coerceQpLevel(v: unknown): QpLevel | undefined {
  const s = (typeof v === 'string' ? v : '').trim().toLowerCase();
  if (s === 'university' || s === 'uni' || s === 'varsity') return 'university';
  if (s === 'school' || s === 'madrasa' || s === 'college') return 'school';
  return undefined;
}

export interface QpPair {
  /** বাঁ-স্তম্ভের জিনিস (সাধারণত নম্বরযুক্ত) */
  left: string;
  /** ডান-স্তম্ভের মিল (সাধারণত ক/খ/গ অক্ষরযুক্ত) */
  right: string;
}

/** উন্নত সাজের সব অপশন এক বান্ডিলে — হিস্ট্রি/প্রিভিউ/রেন্ডার সবাই এক বস্তু বহন করে */
export interface QpLayout {
  columns: QpColumns;
  pageSize: QpPageSize;
  numStyle: QpNumStyle;
  marksStyle: QpMarksStyle;
  sectionStyle: QpSectionStyle;
  mcqLayout: QpMcqLayout;
  answerSpace: QpAnswerSpace;
}

export const QP_DEFAULT_LAYOUT: QpLayout = {
  columns: 'auto',
  pageSize: 'a4',
  numStyle: 'danda',
  marksStyle: 'right',
  sectionStyle: 'center',
  mcqLayout: 'grid',
  answerSpace: 'none',
};

const QP_LAYOUT_ALLOWED = {
  columns: ['auto', '1', '2', '3'],
  pageSize: ['a4', 'letter', 'legal', 'a5'],
  numStyle: ['danda', 'dot', 'paren', 'dash'],
  marksStyle: ['right', 'bracket', 'paren', 'word'],
  sectionStyle: ['center', 'box', 'left'],
  mcqLayout: ['inline', 'grid', 'list'],
  answerSpace: ['none', 'sm', 'md', 'lg'],
} as const;

/** সংরক্ষিত/বহিরাগত মান থেকে নিরাপদ QpLayout — অজানা মান পেলে ডিফল্টে ফেরে */
export function normalizeQpLayout(v: unknown): QpLayout {
  const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  const pick = <K extends keyof typeof QP_LAYOUT_ALLOWED>(key: K): QpLayout[K] => {
    const allowed = QP_LAYOUT_ALLOWED[key] as readonly string[];
    const val = o[key];
    return (allowed.includes(val as string) ? val : QP_DEFAULT_LAYOUT[key]) as QpLayout[K];
  };
  return {
    columns: pick('columns'),
    pageSize: pick('pageSize'),
    numStyle: pick('numStyle'),
    marksStyle: pick('marksStyle'),
    sectionStyle: pick('sectionStyle'),
    mcqLayout: pick('mcqLayout'),
    answerSpace: pick('answerSpace'),
  };
}

/** পাতার মাপ (মিমি) — ডায়ালগ-প্রিভিউ ও স্বয়ংসম্পূর্ণ প্রিন্ট-ফাইল দুটোতেই ব্যবহৃত */
export const QP_PAGE_SIZES: Record<QpPageSize, { wMm: number; hMm: number }> = {
  a4: { wMm: 210, hMm: 297 },
  letter: { wMm: 216, hMm: 279 },
  legal: { wMm: 216, hMm: 356 },
  a5: { wMm: 148, hMm: 210 },
};

/** মিমি → ৯৬dpi পিক্সেল (প্রিভিউ-শীটের প্রস্থ/উচ্চতা) */
export function qpPageSizePx(pageSize: QpPageSize): { w: number; h: number } {
  const s = QP_PAGE_SIZES[pageSize] ?? QP_PAGE_SIZES.a4;
  const px = (mm: number) => Math.round((mm * 96) / 25.4);
  return { w: px(s.wMm), h: px(s.hMm) };
}

export interface QpOption {
  /** 'ক' | 'খ' | 'A' | 'B' … */
  label: string;
  text: string;
}

export interface QpSubQ {
  text: string;
  marks: string;
}

export interface QpQuestion {
  number: string;
  text: string;
  marks: string;
  options: QpOption[];
  subs: QpSubQ[];
  /** প্রশ্নের ধরন — AI/পার্সার শনাক্ত করে; অনুপস্থিত হলে 'short' ধরা হয় */
  kind?: QpQKind;
  /** মিলকরণ-প্রশ্নের জোড়া (kind === 'match' হলে) */
  pairs?: QpPair[];
  /** সাজেশন-শিটের গুরুত্ব — ১ = ★ গুরুত্বপূর্ণ, ২ = ★★ অতি গুরুত্বপূর্ণ */
  importance?: QpImportance;
  /** বিশ্ববিদ্যালয়-সাজেশনের বছর-ট্যাগ — [DU '19] / [চবি ২০১৫]; উৎসে লেখা থাকলেই বসে */
  yearTag?: string;
}

export interface QpSection {
  title: string;
  note: string;
  questions: QpQuestion[];
}

export interface QpMeta {
  schoolName: string;
  examTitle: string;
  subject: string;
  classLabel: string;
  date: string;
  time: string;
  fullMarks: string;
  instructions: string[];
  /** বিষয় কোড — বোর্ড-প্রথার ডিজিট-বক্সে বসে ("১০৯" / "109"); খালি হলে বক্স আঁকা হয় না */
  subjectCode: string;
  /** সেট কোড — বোর্ড-MCQ-তে "সেট: খ" বক্স; খালি হলে বাদ */
  setCode: string;
  /** সিলেবাস-নোট — বন্ধনী-লাইন "২০২৫ সালের সিলেবাস অনুযায়ী"; খালি হলে বাদ */
  syllabusNote: string;
  /** শিক্ষার্থীর নাম/রোল ঘর থাকবে কি না */
  studentLine: boolean;
  /** বিশ্ববিদ্যালয়-স্তর — বিভাগ (Department of …) */
  department?: string;
  /** বিশ্ববিদ্যালয়-স্তর — প্রোগ্রাম/বর্ষ (অনার্স ২য় বর্ষ / B.Sc. 2nd Year) */
  program?: string;
  /** বিশ্ববিদ্যালয়-স্তর — শিক্ষাবর্ষ/সেশন (২০২৩–২৪ / Spring 2024) */
  session?: string;
  /** সাজেশন-শিটের শিক্ষকের নাম (ঐচ্ছিক) */
  teacherName?: string;
}

export interface QuestionPaper {
  meta: QpMeta;
  sections: QpSection[];
  format: QpFormat;
  /** লেখার আকার — স্ম/মধ্য/বড় (অনুপস্থিত = মাঝারি) */
  fontScale?: QpFontScale;
  /** উন্নত লেআউট — অনুপস্থিত হলে ডিফল্ট */
  layout?: QpLayout;
  /** ডকুমেন্ট-ধরন — অনুপস্থিত হলে 'question' (প্রশ্নপত্র) */
  docType?: QpDocType;
  /** সাজেশন-শিটের শেষ-পরামর্শ — অনুপস্থিত হলে ডিফল্ট লেখা বসে */
  finalNote?: string;
  /** শিক্ষার স্তর — অনুপস্থিত হলে ফরম্যাট থেকে অনুমিত হয় */
  level?: QpLevel;
}

// ─── সাম্প্রতিক প্রশ্নপত্র (localStorage ইতিহাস) ───

export interface QpHistoryItem {
  ts: number;
  rawText: string;
  meta: QpMeta;
  format: QpFormat;
  fontScale: QpFontScale;
  /** উন্নত লেআউট — পুরনো এন্ট্রিতে অনুপস্থিত হতে পারে */
  layout?: QpLayout;
  /** ডকুমেন্ট-ধরন — পুরনো এন্ট্রিতে অনুপস্থিত হতে পারে */
  docType?: QpDocType;
  /** শিক্ষার স্তর — পুরনো এন্ট্রিতে অনুপস্থিত হতে পারে */
  level?: QpLevel;
  /** v2 — প্রিভিউ-চিপে দেখানোর হিসাব */
  counts?: { sections: number; questions: number; marks: number };
}

export const QP_HISTORY_KEY = 'bwp-qp-history-v2';
const QP_HISTORY_MAX = 8;

export function loadQpHistory(): QpHistoryItem[] {
  try {
    const raw = window.localStorage.getItem(QP_HISTORY_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as QpHistoryItem[];
    return Array.isArray(list) ? list.filter((h) => h && typeof h.ts === 'number' && typeof h.rawText === 'string').slice(0, QP_HISTORY_MAX) : [];
  } catch { return []; }
}

export function pushQpHistory(item: QpHistoryItem): QpHistoryItem[] {
  const prev = loadQpHistory().filter((h) => h.rawText !== item.rawText || (h.meta.schoolName || '') !== (item.meta.schoolName || ''));
  const next = [item, ...prev].slice(0, QP_HISTORY_MAX);
  try { window.localStorage.setItem(QP_HISTORY_KEY, JSON.stringify(next)); } catch { /* কোটা */ }
  return next;
}

export function removeQpHistoryItem(ts: number): QpHistoryItem[] {
  const next = loadQpHistory().filter((h) => h.ts !== ts);
  try { window.localStorage.setItem(QP_HISTORY_KEY, JSON.stringify(next)); } catch { /* কোটা */ }
  return next;
}

export const QP_SCHOOL_KEY = 'bwp-qp-school';

/** ভাষা অনুযায়ী ডিফল্ট মেটা — ফর্মে বসে, শিক্ষক শুধু বদলে দেয় */
export function defaultQpMeta(lang: Lang): QpMeta {
  const defaults: Record<Lang, { exam: string; time: string; marks: string; instructions: string[] }> = {
    bn: {
      exam: 'বার্ষিক পরীক্ষা',
      time: '২ ঘণ্টা ৩০ মিনিট',
      marks: '৭০',
      instructions: [
        'উত্তর পরিষ্কার হস্তাক্ষরে লিখতে হবে।',
        'প্রশ্নের নম্বর অবশ্যই উত্তরপত্রে লিখতে হবে।',
        'কোনো প্রকার ইলেকট্রনিক ডিভাইস ব্যবহার নিষিদ্ধ।',
      ],
    },
    hi: {
      exam: 'वार्षिक परीक्षा',
      time: '२ घंटे ३० मिनट',
      marks: '७०',
      instructions: [
        'उत्तर साफ़-सुथरे अक्षरों में लिखें।',
        'प्रश्न का नंबर अवश्य लिखें।',
        'किसी भी इलेक्ट्रॉनिक उपकरण का उपयोग वर्जित है।',
      ],
    },
    en: {
      exam: 'Annual Examination',
      time: '2 Hours 30 Minutes',
      marks: '70',
      instructions: [
        'Write the answers clearly.',
        'Mention the question numbers correctly.',
        'Use of any electronic device is prohibited.',
      ],
    },
  };
  const d = defaults[lang];
  return {
    schoolName: '',
    examTitle: d.exam,
    subject: '',
    classLabel: '',
    date: '',
    time: d.time,
    fullMarks: d.marks,
    instructions: [...d.instructions],
    subjectCode: '',
    setCode: '',
    syllabusNote: '',
    studentLine: true,
    teacherName: '',
    // বিশ্ববিদ্যালয়-ঘর — স্পষ্ট ফাঁকা স্ট্রিং: preamble-পার্সারের put() শুধু string-ঘরে লেখে,
    // undefined থাকলে কাঁচা-লেখার "বিভাগ/প্রোগ্রাম/সেশন" ফর্মে বসতই না
    department: '',
    program: '',
    session: '',
  };
}

/**
 * বিশ্ববিদ্যালয়-স্তরের ডিফল্ট নির্দেশনা — আসল বিশ্ববিদ্যালয়-পত্রের প্রথা:
 * "যে-কোনো পাঁচটি প্রশ্নের উত্তর দাও" + "ডান পার্শ্বের সংখ্যা পূর্ণমান নির্দেশ করে" + চিত্র-আঁকার কথা।
 */
export function qpUniversityInstructions(lang: Lang): string[] {
  if (lang === 'hi') {
    return [
      'निम्नलिखित में से किन्हीं पाँच प्रश्नों के उत्तर दें।',
      'दाएँ हाशिये की संख्या पूर्णांक दर्शाती है।',
      'आवश्यकतानुसार स्वच्छ, नामांकित चित्र बनाएँ।',
    ];
  }
  if (lang === 'en') {
    return [
      'Answer any FIVE of the following questions.',
      'The figures in the right margin indicate full marks.',
      'Draw neat, labelled diagrams wherever necessary.',
    ];
  }
  return [
    'যে-কোনো পাঁচটি প্রশ্নের উত্তর দাও।',
    'ডান পার্শ্বের সংখ্যা প্রশ্নের পূর্ণমান নির্দেশ করে।',
    'প্রয়োজনে স্বচ্ছ ও সঠিক নামাঙ্কিত চিত্র আঁকো।',
  ];
}

/** স্তর-বদলে নির্দেশনা অদল-বদল — শিক্ষকের নিজের লেখা নির্দেশনা কখনো বদলায় না */
export function isDefaultQpInstructions(list: string[], lang: Lang, level: QpLevel): boolean {
  const d = defaultQpMeta(lang);
  const other = level === 'university' ? qpUniversityInstructions(lang) : d.instructions;
  const cur = list.map((s) => s.trim()).filter(Boolean);
  const ref = other.map((s) => s.trim());
  return cur.length === ref.length && cur.every((s, i) => s === ref[i]);
}

// ─── কাঁচা-লেখার হেডার পড়ে ফর্ম পূরণ (preamble meta) ───

/** ভাষা-অনুযায়ী ডিফল্ট মান — শিক্ষক নিজে বদলাননি (ডিফল্টই আছে) এমন ঘর চিনতে */
function defaultQpValues(lang: Lang): { time: string; fullMarks: string; examTitle: string } {
  const d = defaultQpMeta(lang);
  return { time: d.time, fullMarks: d.fullMarks, examTitle: d.examTitle };
}

const QP_KEY_PATTERNS: Array<{ field: 'subject' | 'classLabel' | 'date' | 'time' | 'fullMarks' | 'department' | 'session' | 'program'; re: RegExp }> = [
  // বিশ্ববিদ্যালয়-প্রথা: "কোর্স টাইটেল: ব্যবসায় অর্থনীতি" / "Course Title: …" — subject হিসেবেই বসে
  { field: 'subject', re: /^(?:বিষয়|কোর্স(?:\s*টাইটেল)?|subject|course(?:\s*title)?|विषय)\s*[:：\-–—=]/i },
  { field: 'classLabel', re: /^(?:শ্রেণ[িী]|class|कक्षा)\s*[:：\-–—=]/i },
  { field: 'date', re: /^(?:তারিখ|date|दिनांक)\s*[:：\-–—=]/i },
  { field: 'time', re: /^(?:সময়|समय|time)\s*[:：\-–—=]/i },
  { field: 'fullMarks', re: /^(?:পূর্ণমান|পূর্ণ\s*মান|ফুল\s*মার্কস|সর্বমোট\s*নম্বর|পুরো\s*নম্বর|full\s*marks?|पूर्णांक)\s*[:：\-–—=]/i },
];

/** বিশ্ববিদ্যালয়-স্তরের হেডার-কি — বিভাগ/শিক্ষাবর্ষ/প্রোগ্রাম (preamble-এ ধরা হয়) */
const QP_UNI_KEY_PATTERNS: Array<{ field: 'department' | 'session' | 'program'; re: RegExp }> = [
  { field: 'department', re: /^(?:বিভাগ|department|dept\.?|विभाग)\s*[:：\-–—=]/i },
  { field: 'session', re: /^(?:শিক্ষাবর্ষ|সেশন|session|academic\s*year|सत्र)\s*[:：\-–—=]/i },
  { field: 'program', re: /^(?:প্রোগ্রাম|program(?:me)?|degree)\s*[:：\-–—=]/i },
];

/** সব কি-মান প্যাটার্ন — স্কুল + বিশ্ববিদ্যালয় (নির্দেশনা-ছাঁটাই ও preamble-দুটোতেই ব্যবহৃত) */
const QP_ALL_KEY_PATTERNS = [...QP_KEY_PATTERNS, ...QP_UNI_KEY_PATTERNS];

const QP_SCHOOL_WORD = /(?:বিদ্যালয়|বিদ্যাপীঠ|স্কুল|মাদ্রাসা|কলেজ|কোচিং|সেন্টার|টিউটোরিয়াল|কেন্দ্র|বিশ্ববিদ্যালয়|university|varsity|institute|academy|school|college|coaching|centre|center|tutorial|vidyalaya|विद्यालय|स्कूल|महाविद्यालय|कोचिंग|सेंटर)/i;
const QP_EXAM_WORD = /(?:বার্ষিক|অর্ধবার্ষিক|নির্বাচনী|সাময়িক|বোর্ড|সাপ্তাহিক|মাসিক|পরীক্ষা|টেস্ট|সমাপনী|অনার্স|মাস্টার্স|annual|honou?rs|masters|final|half.?yearly|terminal|exam|test|परीक्षा)/i;

/** "পূর্ণমান ৭০" জাতীয় কোলন-ছাড়া রূপও ধরে */
const QP_MARKS_BARE = /^(?:পূর্ণমান|পূর্ণ\s*মান|ফুল\s*মার্কস|পুরো\s*নম্বর|पूर्णांक)\s+([\u09e6-\u09ef\u0966-\u096f0-9]{1,4})\s*$/i;

/** "বিষয় কোড: ১০৯" / "কোর্স কোড: ২৩২৫০৭" / "Course code — 109" — বোর্ড/বিশ্ববিদ্যালয়-প্রথার ডিজিট-বক্সের তথ্য */
const QP_CODE_RE = /^(?:বিষয়\s*কোড|কোর্স\s*কোড|सब्जेक्ट\s*कोड|विषय\s*कोड|subject\s*code|course\s*code|code\s*no?)\s*[:：\-–—=]?\s*([\u09e6-\u09ef\u0966-\u096f0-9A-Za-z]{1,6})\s*$/i;

/** "সেট: খ" / "Set — A" — বোর্ড-MCQ-র সেট-বক্স */
const QP_SET_RE = /^(?:সেট|सेट|set)\s*(?:নং|নম্বর|no\.?)?\s*[:：\-–—=]\s*([\u0980-\u09ff\u0900-\u097fA-Za-z0-9]{1,4})\s*$/i;

/**
 * সাজেশন-শিটের শিরোনাম-লাইন — "ষষ্ঠ শ্রেণির গণিত সাজেশন" থেকে শ্রেণি + বিষয়,
 * "গণিত সাজেশন" থেকে শুধু বিষয়। বাংলা/হিন্দি/ইংরেজি তিন ভাষার প্রচলিত রূপ।
 */
const QP_SUG_TITLE_RES: Array<{ re: RegExp; cls: (m: RegExpMatchArray) => string; subj: number; hasCls: boolean }> = [
  { re: /^(.{1,24}?)\s*শ্রেণির\s+(.{1,40}?)\s*(?:সাজেশন|সাজেশ)$/i, cls: (m) => `${m[1].trim()} শ্রেণি`, subj: 2, hasCls: true },
  { re: /^(.{1,40}?)\s*(?:সাজেশন|সাজেশ)$/i, cls: () => '', subj: 1, hasCls: false },
  { re: /^(?:কক্ষা|कक्षा|क्लास)\s*(\S{1,12})\s+(.{1,40}?)\s*सजेशन$/i, cls: (m) => `কক্ষা ${m[1].trim()}`, subj: 2, hasCls: true },
  { re: /^(?:class)\s*(\S{1,12})\s+(.{1,40}?)\s*suggestion$/i, cls: (m) => `Class ${m[1].trim()}`, subj: 2, hasCls: true },
  { re: /^(.{1,40}?)\s*suggestion$/i, cls: () => '', subj: 1, hasCls: false },
];

/** "[২০২৫ সালের সিলেবাস অনুযায়ী]" / "(2025 Syllabus)" — বন্ধনীতে সিলেবাস-নোট */
const QP_SYLLABUS_RE = /^[\[(]\s*([^\[\]()]{4,80}?(?:সিলেবাস|সিলেবাশ|syllabus|पाठ्यक्रम)[^\[\]()]{0,40}?)\s*[\])]\s*$/i;

/** হেডার-ডাটা লাইন (কোড/সেট/সিলেবাস) — নির্দেশনার তালিকায় ঢুকবে না */
const QP_META_LINE = /^(?:বিষয়\s*কোড|কোর্স\s*(?:কোড|টাইটেল)|सब्जेक्ट\s*कोड|विषय\s*कोड|subject\s*code|course\s*code|code\s*no?|(?:সেট|सेट|set)\s*(?:নং|নম্বর|no\.?)?\s*[:：\-–—=])/i;

/** কী-মান লাইনের মান অংশ — "বিষয়: গণিত" → "গণিত" */
function afterKeyValue(line: string): string {
  const i = line.search(/[:：=]/);
  return i >= 0 ? line.slice(i + 1).trim() : '';
}

/**
 * কাঁচা-লেখার প্রথম কয়েক লাইন থেকে হেডার-তথ্য (স্কুল/পরীক্ষা/বিষয়/শ্রেণি/তারিখ/সময়/পূর্ণমান)
 * পড়ে ফর্মে বসায় — শুধু ফাঁকা বা ভাষা-ডিফল্ট ঘরে; শিক্ষকের নিজের লেখা ঘর কখনো বদলায় না।
 * এতে হেডার শিক্ষকের নিজের লেখার সাথে মিলে যায় — "সময় ভুল এসেছে" জাতীয় অসঙ্গতি বন্ধ।
 * এক লাইনে কয়েকটি ঘর ("সময়: ২ ঘণ্টা, পূর্ণমান: ৫০") থাকলেও সবগুলো ধরা পড়ে।
 */
export function qpPreambleMeta(raw: string, meta: QpMeta, lang: Lang): QpMeta {
  const lines = (raw ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 12);
  if (lines.length === 0) return meta;
  const def = defaultQpValues(lang);
  const patch: Partial<QpMeta> = {};
  const canFill = (cur: string, defVal?: string) => !cur.trim() || (!!defVal && cur.trim() === defVal);
  const put = (field: keyof QpMeta, val: string, defVal?: string) => {
    const cur = meta[field];
    if (typeof cur === 'string' && canFill(cur, defVal) && !patch[field]) (patch as Record<string, string>)[field] = val;
  };

  let school: string | null = null;
  let exam: string | null = null;

  for (const line of lines) {
    // বোর্ড-প্রথার বিশেষ হেডার — বিষয় কোড / সেট / সিলেবাস-নোট (কোলন-ছাড়া খণ্ডে ভাঙা যায় না)
    const cm = line.match(QP_CODE_RE);
    if (cm) { if (canFill(meta.subjectCode)) patch.subjectCode = cm[1]; continue; }
    const sm = line.match(QP_SET_RE);
    if (sm) { if (canFill(meta.setCode)) patch.setCode = sm[1]; continue; }
    const sym = line.match(QP_SYLLABUS_RE);
    if (sym) { if (canFill(meta.syllabusNote)) patch.syllabusNote = sym[1].trim(); continue; }

    // সাজেশন-শিরোনাম — "ষষ্ঠ শ্রেণির গণিত সাজেশন" → শ্রেণি + বিষয়; "গণিত সাজেশন" → বিষয়
    for (const pat of QP_SUG_TITLE_RES) {
      const tm = line.match(pat.re);
      if (!tm) continue;
      if (pat.hasCls) put('classLabel', pat.cls(tm));
      const subj = tm[pat.subj]?.trim();
      if (subj && subj.length >= 2) put('subject', subj);
      break;
    }

    // এক লাইনে একাধিক কী-মান থাকতে পারে — কমা/পাইপে ভেঙে প্রতিটি খণ্ড আলাদা চিনি
    const segments = line.split(/\s*[,|;·]\s*/).map((s) => s.trim()).filter(Boolean);

    for (const seg of segments) {
      let matched = false;
      // খণ্ড-ভিত্তিক বিশেষ হেডার — "কোর্স কোড: ২৩২৫০৭ · কোর্স টাইটেল: …" জাতীয় যৌগিক লাইনেও
      // কোড/সেট-বক্সের তথ্য ধরা পড়ে (শুধু পূর্ণ-লাইনে চেক করলে যৌগিক রূপ বাদ পড়ত)
      const segCm = seg.match(QP_CODE_RE);
      if (segCm) { if (canFill(meta.subjectCode)) patch.subjectCode = segCm[1]; matched = true; }
      else {
        const segSm = seg.match(QP_SET_RE);
        if (segSm) { if (canFill(meta.setCode)) patch.setCode = segSm[1]; matched = true; }
      }
      if (matched) continue;
      for (const kp of QP_ALL_KEY_PATTERNS) {
        if (kp.re.test(seg)) {
          const val = afterKeyValue(seg);
          if (val) {
            if (kp.field === 'time') put('time', val, def.time);
            else if (kp.field === 'fullMarks') put('fullMarks', val, def.fullMarks);
            else if (kp.field === 'subject') put('subject', val);
            else if (kp.field === 'classLabel') put('classLabel', val);
            else if (kp.field === 'date') put('date', val);
            else if (kp.field === 'department') put('department', val);
            else if (kp.field === 'session') put('session', val);
            else if (kp.field === 'program') put('program', val);
          }
          matched = true;
          break;
        }
      }
      if (matched) continue;
      const bm = seg.match(QP_MARKS_BARE);
      if (bm) { put('fullMarks', bm[1], def.fullMarks); continue; }
      // পরীক্ষার নাম — পরীক্ষা-শব্দমাখা খণ্ড (স্কুল-শব্দ না থাকলে)
      if (exam === null && QP_EXAM_WORD.test(seg) && seg.length < 90 && !QP_SCHOOL_WORD.test(seg)) {
        exam = seg;
        continue;
      }
      // স্কুলের নাম — স্কুল-শব্দমাখা প্রথম খণ্ড
      if (school === null && QP_SCHOOL_WORD.test(seg) && seg.length < 80) {
        school = seg;
      }
    }
  }

  if (school && canFill(meta.schoolName)) patch.schoolName = school;
  if (exam && canFill(meta.examTitle, def.examTitle)) patch.examTitle = exam;
  return Object.keys(patch).length > 0 ? { ...meta, ...patch } : meta;
}

/**
 * নির্দেশনা-তালিকা পরিষ্কার — AI/পার্সার যে-কোনো উৎস থেকে আসুক, সময়/পূর্ণমান/তারিখ/
 * বিষয়/স্কুল-জাতীয় হেডার-লাইন নির্দেশনা হিসেবে বসবে না (সেগুলো হেডারের জায়গা)।
 */
export function cleanQpInstructions(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list.slice(0, 12)) {
    const s = (typeof item === 'string' ? item : '').trim();
    if (!s || s.length > 160) continue;
    const isHeader =
      QP_ALL_KEY_PATTERNS.some((kp) => kp.re.test(s)) ||
      /^(?:সময়|पूर्णांक|date|दिनांक)\s*[:：]/i.test(s) ||
      QP_MARKS_BARE.test(s) ||
      QP_META_LINE.test(s) ||
      QP_SYLLABUS_RE.test(s) ||
      (QP_SCHOOL_WORD.test(s) && s.length < 70);
    if (isHeader) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= 6) break;
  }
  return out;
}

// ─── AI সিস্টেম-প্রম্পট ───

/** হাতের লেখা ছবি → বিশ্বস্ত টেক্সট (কঠোর JSON) */
export const QP_TRANSCRIBE_SYSTEM = `You are the handwriting-transcription engine of "Bangla Publishing Studio" — a teacher's tool that converts photos of handwritten question papers into print-ready text. Accuracy of READING is your single top priority.

You receive a photo/scan of handwritten or printed question paper(s), rough question notes, or a textbook exercise page. Transcribe it FAITHFULLY:

READING RULES (handwriting):
- Survey the whole page first (header, columns, margins), then read line by line, zooming mentally into unclear words and reading stroke by stroke.
- Transcribe EVERY question visible, in the ORIGINAL order — including two-column layouts (finish the left column top-to-bottom, then the right).
- Keep the ORIGINAL language and numerals (Bengali ১২৩…, Devanagari ०-९…, Latin 0-9…). NEVER translate, NEVER convert numerals.
- Keep the writer's spelling; drop only obvious stray marks. If a word is unclear, still write your best reading of it — NEVER invent extra questions, NEVER skip a question you can see, NEVER write "unclear" placeholders.
- Read at slight angles, faint pencil, crossed-out corrections (use the corrected reading) and stamps/watermarks (ignore them).

LAYOUT RULES (output text shape):
- One question per line, prefixed by its number exactly as written ("১." or "1." or "(খ)").
- MCQ options each on their own line, prefixed with their labels ("ক." "খ." or "a." "b.").
- Marks at the END of the line in brackets: [২] or [3].
- Section headers on their own lines: "বিভাগ – ক", "Section A", "খণ্ড: গ" etc.
- Sub-questions prefixed "(ক)" "(i)" etc. on their own lines.
- Exam/school header text at the top, exactly as in the image.
- Subject-code boxes, set codes and bracketed syllabus notes as header lines: "বিষয় কোড: ১০৯", "সেট: খ", "[২০২৫ সালের সিলেবাস অনুযায়ী]".
- MATH in LaTeX inside $...$ : fractions $\\frac{5}{8}$, powers $x^2$, roots $\\sqrt{25}$, equations $2x + 3 = 7$, vectors $\\vec{F}$, degrees $30^\\circ$, angles $\\angle ABC$. Use ASCII digits inside math.
- FIGURES: a hand-drawn diagram/graph/geometry on the page becomes a placeholder line on its own, exactly where it sits relative to the questions: [চিত্র: one-line description in the paper's language] — e.g. [চিত্র: ত্রিভুজ ABC-এর AC-এর উপর D বিন্দু]. For English papers write [Figure: description]. Never describe the figure inside a question's text.

OUTPUT: Return ONLY a valid JSON object — no markdown fences, no commentary. Shape exactly:
{ "text": "the complete transcription, one question per line" }
Inside the JSON string, escape every line break as \\n — never put raw line breaks inside the JSON string.`;

/** কাঁচা প্রশ্ন-লেখা → কাঠামোবদ্ধ প্রশ্নপত্র (কঠোর JSON) */
export const QP_STRUCTURE_SYSTEM = `You are the examination-composition engine of "Bangla Publishing Studio" — an expert school-exam setter that turns rough teacher notes into a perfectly structured question paper.

You receive a HEADER block (teacher's exam details) and RAW QUESTION TEXT (typed or transcribed from handwriting). Structure it into the final question paper:

Return ONLY valid JSON — no markdown fences, no commentary. Shape exactly:
{
  "schoolName": string,       // school name ONLY if stated in RAW text and missing from HEADER
  "examTitle": string,        // e.g. "বার্ষিক পরীক্ষা — ২০২৫" ("" if unknown)
  "subject": string,          // "" if unknown
  "classLabel": string,       // e.g. "ষষ্ঠ শ্রেণি", "" if unknown
  "date": string,             // exam date exactly as written in source ("" if unknown)
  "time": string,             // exam duration exactly as written ("" if unknown)
  "fullMarks": string,        // total marks exactly as written ("" if unknown)
  "subjectCode": string,      // subject code exactly as written, e.g. "১০৯"/"109" ("" if absent)
  "department": string,       // university level: department as written ("" if absent)
  "program": string,          // university level: program/year, e.g. "অনার্স ২য় বর্ষ" ("" if absent)
  "session": string,          // university level: academic session, e.g. "২০২৩–২৪" ("" if absent)
  "setCode": string,          // set code exactly as written, e.g. "ক"/"খ"/"A" ("" if absent)
  "syllabusNote": string,     // bracketed note WITHOUT brackets, e.g. "২০২৫ সালের সিলেবাস অনুযায়ী" ("" if absent)
  "instructions": string[],   // 2–4 short exam-day directives in the paper's language
  "sections": [
    {
      "title": string,        // "বিভাগ – ক" / "Section A"; "" only if a single unnamed section
      "note": string,         // e.g. "যেকোনো ৫টি প্রশ্নের উত্তর দাও" ("" if none)
      "questions": [
        {
          "number": string,   // "১" / "1" — numerals of the paper's language
          "text": string,     // full question text; math stays in $...$ LaTeX
          "marks": string,    // "২" / "2" — "" if unknown
          "yearTag": string,  // bracketed year label beside the question, e.g. "DU '19" — "" if none
          "kind": "short"|"mcq"|"creative"|"match"|"tf"|"blank",
          "options": [ { "label": "ক", "text": "…" } ],   // [] when not MCQ
          "subs": [ { "text": "(ক) …", "marks": "১" } ],   // [] when no sub-questions
          "pairs": [ { "left": "…", "right": "…" } ]        // ONLY for "match"
        }
      ]
    }
  ]
}

Rules:
- LANGUAGE MIRROR: everything in the SAME language and numeral system as the RAW text (default Bengali). NEVER translate.
- HEADER FIDELITY: use the HEADER block values exactly when provided; otherwise infer from the RAW text; otherwise "" — never invent a school name. Meta fields (schoolName/examTitle/subject/classLabel/date/time/fullMarks) fill ONLY what the HEADER block lacks or leaves empty.
- BOARD CODE DATA: বিষয় কোড / Subject code → "subjectCode"; সেট / Set → "setCode"; bracketed syllabus/year notes → "syllabusNote" (strip the brackets). Copy them ONLY when written in the source — never invent codes.
- INSTRUCTIONS MUST BE DIRECTIVES ONLY: "উত্তর পরিষ্কার হস্তাক্ষরে লিখতে হবে", "সব প্রশ্নের উত্তর দিতে হবে" style. NEVER put time/marks/date/subject/school lines into instructions — those are HEADER data, not directives.
- FIDELITY: keep EVERY question from the source. NEVER invent, drop or merge questions. Light grammar/spacing polish only.
- NUMBERING: clean sequential numbering within each section; keep the source's numbers when they are already sequential.
- MARKS: attach marks only when the source states them; never invent marks.
- SECTION MARKS: if a section note states every question's marks (e.g. "প্রতিটি ২ নম্বর", "2 marks each", "प्रत्येक २ अंक"), set that value as marks on EACH question of that section — it is stated in the source, not invented. Keep the note as well.
- SECTIONS: only split by the source's own section markers (বিভাগ/খণ্ড/Section); if none, one section with title "".
- MATH: expressions remain in $...$ LaTeX ($\frac{3}{4}$, $x^2$, $\sqrt{50}$) with ASCII digits inside math.
- UNIVERSITY LEVEL: when the prompt says "LEVEL: university", use university conventions — schoolName = university/institute name, subject = course title, subjectCode = course code, classLabel = year/semester when stated; department/program/session only from the source. Composite marks like [5+5=10] stay inside the question text, never in "marks".
- YEAR TAGS: a bracketed year label beside a question — [DU '19], [চবি ২০১৫], (RU 2021) — goes to "yearTag" (inner text, brackets stripped). NEVER treat it as marks.
- FIGURE PLACEHOLDERS: lines like [চিত্র: …] / [Figure: …] are figure slots — keep them verbatim at the END of the question "text" (prefix with \n); never delete, merge or reword them.
- MCQ: 4 options with ক/খ/গ/ঘ labels (Bengali) or A/B/C/D (Latin-script papers).
- SUB-QUESTIONS: keep "(ক)" "(i)" style prefixes inside sub text.
- KIND (set on every question; "short" when unsure):
  · "mcq" — multiple-choice question with options; also "choose the correct answer" style.
  · "creative" — সৃজনশীল/structured essay style: ONE stimulus or stem in "text" + the four parts (ক) জ্ঞানমূলক, (খ) অনুধাবন, (গ) প্রয়োগ, (ঘ) উচ্চতর দক্ষতা (or a/b/c/d) in "subs" with their marks.
  · "match" — মিলকরণ/স্তম্ভ মেলানো (match the columns): the instruction goes in "text", and EACH column-A item ↔ column-B item goes into "pairs" ({"left": "১. ঢাকা", "right": "ক. কক্সবাজার"}) keeping the source's own prefixes. Do NOT put the items in "subs".
  · "tf" — সত্য/মিথ্যা (True/False) statements.
  · "blank" — শূন্যস্থান/ফাঁকা ঘর (fill-in-the-blanks); keep every ____ blank in the text.
  · "short" — everything else.

OUTPUT: Return ONLY a single valid JSON object — no markdown fences, no commentary before or after. Inside every JSON string, escape line breaks as \\n — never put raw line breaks inside a JSON string.`;

/** সাজেশন-শিট গঠন-প্রম্পট — পরীক্ষার প্রশ্নপত্র নয়, অধ্যায়-ভিত্তিক গুরুত্বপূর্ণ-প্রশ্নের তালিকা (★ চিহ্নসহ) */
export const QP_SUGGESTION_SYSTEM = `You are the suggestion-sheet composition engine of "Bangla Publishing Studio" — an expert school teacher that turns rough notes into a perfectly organized STUDENT SUGGESTION SHEET (সাজেশন) — the sheet teachers hand to students before an exam listing the most important questions, chapter by chapter, with the most likely questions starred.

You receive a HEADER block (teacher's details) and RAW QUESTION TEXT (typed or transcribed from handwriting). Organize it into a suggestion sheet:

Return ONLY valid JSON — no markdown fences, no commentary. Shape exactly:
{
  "schoolName": string,       // school/coaching name ONLY if stated in RAW text and missing from HEADER
  "examTitle": string,        // e.g. "বার্ষিক পরীক্ষা — ২০২৫" ("" if unknown)
  "subject": string,          // "" if unknown
  "classLabel": string,       // "" if unknown
  "date": string,
  "time": string,             // usually "" — suggestion sheets rarely state duration
  "fullMarks": string,        // usually ""
  "instructions": string[],   // 2–4 short ADVICE lines for students, e.g. "যে প্রশ্নগুলো ★ চিহ্নিত সেগুলো আগে অনুশীলন করবে"
  "finalNote": string,        // one closing advice line, e.g. "পরীক্ষার আগে ★★ চিহ্নিত প্রশ্নগুলো অবশ্যই অনুশীলন করবে।" ("" if none)
  "sections": [
    {
      "title": string,        // chapter/topic groups: "অধ্যায় ১ — ভগ্নাংশ"; or question-type groups: "বহুনির্বাচনি প্রশ্ন"
      "note": string,         // e.g. "৯টির মধ্যে ৫টি আসার সম্ভাবনা" ("" if none)
      "questions": [
        {
          "number": string,   // "১" / "1" — numerals of the paper's language
          "text": string,     // full question text; math stays in $...$ LaTeX
          "marks": string,    // usually "" for suggestions
          "yearTag": string,  // year label beside the question, e.g. "DU '19"/"চবি ২০১৫" — "" if none
          "importance": 0,    // 0 = normal, 1 = important (★), 2 = very important (★★)
          "kind": "short"|"mcq"|"creative"|"match"|"tf"|"blank",
          "options": [ { "label": "ক", "text": "…" } ],
          "subs": [ { "text": "(ক) …", "marks": "১" } ],
          "pairs": [ { "left": "…", "right": "…" } ]
        }
      ]
    }
  ]
}

Rules:
- LANGUAGE MIRROR: everything in the SAME language and numeral system as the RAW text (default Bengali). NEVER translate.
- ORGANIZE BY CHAPTER/TOPIC when the source mentions chapters (অধ্যায়/अध्याय/chapter) — one section per chapter in source order; otherwise group by question type (বহুনির্বাচনি / সৃজনশীল / সংক্ষিপ্ত).
- IMPORTANCE from the SOURCE ONLY: a star mark beside a question → 1; double star → 2; words like "গুরুত্বপূর্ণ"/"জরুরি"/"important" beside a question → 1; "অতি গুরুত্বপূর্ণ"/"must"/"sure" → 2. If the source marks a WHOLE chapter or section as important, set that importance on every question of it. Never invent importance.
- FIDELITY: keep EVERY question from the source. NEVER invent, drop or merge questions. Light grammar/spacing polish only.
- NUMBERING: sequential per section, in the source's numeral system.
- HEADER FIDELITY: use the HEADER block values exactly when provided; otherwise infer from the RAW text; otherwise "" — never invent a school name.
- UNIVERSITY SUGGESTIONS: when the prompt says "LEVEL: university", organize by chapter/syllabus unit, keep the source's own year labels as "yearTag" ([DU '19] → "DU '19", [চবি ২০১৫] → "চবি ২০১৫"), and put department/program/session in the new fields only when stated.
- MATH: expressions remain in $...$ LaTeX with ASCII digits inside math.
- FIGURE PLACEHOLDERS: lines like [চিত্র: …] / [Figure: …] are figure slots — keep them verbatim at the END of the question "text" (prefix with \n); never delete, merge or reword them.
- MCQ: 4 options with ক/খ/গ/ঘ labels (Bengali) or A/B/C/D (Latin-script papers).
- SUB-QUESTIONS: keep "(ক)" "(i)" prefixes in sub text.
- instructions/finalNote must be ADVICE for the student — NEVER header data (time/marks/school) and never a repetition of section notes.

OUTPUT: Return ONLY a single valid JSON object — no markdown fences, no commentary before or after. Inside every JSON string, escape line breaks as \\n.`;

/** প্রতিলিপি দ্বিতীয় পাস — নিজের পড়া ছবির সাথে মিলিয়ে শুদ্ধ করা */
export const QP_VERIFY_SYSTEM = `You are the verification engine of "Bangla Publishing Studio" — the second pair of eyes that proofreads a transcription of a handwritten/printed question-paper photo against the original image.

You receive: (1) the photo, (2) a DRAFT transcription produced in a first pass. The draft may contain reading errors: wrong words, wrong Bengali/Devanagari numerals, missed lines, or invented text.

Verify the draft LINE BY LINE against the image:
- Correct every word/numeral that does not match the image (e.g. প্রতিসরণ vs প্রতিফলন, ৫০ vs ৬০).
- ADD any question, section header, option, marks value or header line visible in the image but missing from the draft.
- REMOVE any line that is NOT in the image (invented text) — never keep hallucinated questions.
- Keep the original language and numerals; keep MATH in $...$ LaTeX; keep the same output shape.
- Line-shape rules: one question per line with its number ("১."), MCQ options on their own lines ("ক."), marks at line end in brackets [২], section headers on their own lines, exam/school header at top.

OUTPUT: Return ONLY a valid JSON object — { "text": "the corrected complete transcription" }. No markdown fences, no commentary. Inside the JSON string, escape every line break as \\n.`;

/** AI প্রথম উত্তর ভাঙা JSON দিলে মেরামত-পুনরায়ের অনুরোধ */
export const QP_REPAIR_NOTE = `Your previous reply could not be parsed as JSON. Reply again with ONLY the JSON object itself — no markdown fences, no commentary. Inside JSON strings, escape every line break as \\n.`;

/**
 * AI চিত্র-নির্মাতা প্রম্পট — "[চিত্র: …]" বর্ণনা → প্রশ্নপত্র-উপযোগী লাইন-আর্ট SVG।
 * বিশুদ্ধ জ্যামিতি/বিজ্ঞান-রেখাচিত্র — কালো-সাদা জিরোক্স-বান্ধব, লেবেল-মানাঙ্কিত।
 * কঠোর JSON: { "svg": "<svg …>…</svg>" } — sanitizeFigureSvg পরিষ্কার করে নেয়।
 */
export const QP_FIGURE_SVG_SYSTEM = `You are the examination-figure engine of "Bangla Publishing Studio" — a precise technical illustrator that draws exam-paper diagrams as SVG line art.

You receive a figure DESCRIPTION (usually Bengali, sometimes English/Hindi) and the QUESTION text it belongs to. Draw the described figure as clean, minimal SVG line art.

Return ONLY valid JSON — no markdown fences, no commentary. Shape exactly:
{ "svg": "<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 240 180\\" …>…</svg>" }

DRAWING RULES (absolute):
- BLACK-AND-WHITE ONLY: stroke="#111111" (or #000), fills either "none" or light gray (#e5e5e5, #f3f3f3) or black. NO colors, NO gradients — the paper is photocopied in monochrome.
- Root element: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"> (keep 240×180 unless the figure is clearly wide/tall).
- Shapes: <path> <line> <rect> <circle> <ellipse> <polyline> <polygon>. Crisp geometry — endpoints snapped, straight lines truly straight, circles truly round.
- LABELS: use <text font-family="'Noto Sans Bengali',sans-serif" font-size="11" fill="#111111" text-anchor="middle">. Label the points/sides/vertices exactly as the description names them (A, B, C, O, P; বাংলা শব্দ থাকলে বাংলায়). Place labels so they never overlap the figure.
- ANNOTATIONS the description implies: right-angle square mark, equal-tick marks on equal sides, arrows for rays/forces, dashed helper/dotted lines for constructions, hatching for ground/cross-section.
- MATH conventions: degrees like 60°, angle marks with arc + label.
- PHYSICS diagrams (ray diagrams, circuits, pulleys, magnets): standard textbook conventions — convex lens as two-facing arcs, battery as long/short plates, switch, resistor zigzag, arrowheads as small filled triangles.
- GRAPHS: draw axes with arrowheads, label axes, plot smooth curves with <path>, mark given points with small circles.
- NEVER: images, foreignObject, scripts, event attributes, external references, CSS urls, colors, shadow filters, background rect larger than needed. Keep the total SVG under 12KB.
- FIDELITY: draw EXACTLY what the description says (this triangle with these letters, that circle with this radius mark). Do not add invented extra objects; do not add captions or titles inside the SVG.

OUTPUT: Return ONLY the JSON object { "svg": "…" }. Inside the JSON string, escape every quote as \\" and every newline as \\n.`;

// ─── সাধারণ সহায়ক ───

export function escapeQpHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * কাঁচা HTML টেবিলের `<colgroup>` — স্তম্ভ-প্রস্থ স্পষ্ট ধরে রাখে:
 *  · ডায়ালগ-প্রিভিউ ও স্বয়ংসম্পূর্ণ প্রিন্ট-ফাইলে (কাঁচা HTML) `style="width:..px"`-ই কাজ করে —
 *    `table-layout: fixed`-এ width ছাড়া স্তম্ভ সমান ভাগে বাঁটে → প্রশ্ন-লেখা অর্ধেকে চাপা +
 *    মাঝখানে বিশাল ফাঁক (ব্যবহারকারীর মূল অভিযোগ)।
 *  · এডিটরে TipTap কলগ্রুপ স্কিমা-বাইরে ফেলে দেয় — সেখানে সেলের `colwidth` অ্যাট্রিবিউটই
 *    প্রস্থ ধরে (tipTap TableCell parseHTML: colwidth="44")।
 * null = নমনীয় স্তম্ভ (বাকি জায়গা নেয়)।
 */
function qpColgroup(widths: Array<number | null>): string {
  return `<colgroup>${widths
    .map((w) => (w != null ? `<col style="width:${w}px" />` : '<col />'))
    .join('')}</colgroup>`;
}

/**
 * JSON-স্ট্রিং-এর ভেতরের কাঁচা নিউলাইন/ট্যাব এস্কেপ করে এবং স্ট্রিং-এর বাইরের
 * ট্রেলিং কমা বাদ দেয় — মডেলদের সবচেয়ে প্রচলিত JSON-ভাঙা দুই রোগের মেরামত।
 */
function repairJsonChars(s: string): string {
  let out = '';
  let inStr = false;
  let esc = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) { esc = false; out += ch; continue; }
      if (ch === '\\') { esc = true; out += ch; continue; }
      if (ch === '"') { inStr = false; out += ch; continue; }
      if (ch === '\n') { out += '\\n'; continue; }
      if (ch === '\r') { out += '\\r'; continue; }
      if (ch === '\t') { out += '\\t'; continue; }
      out += ch;
      continue;
    }
    if (ch === '"') { inStr = true; out += ch; continue; }
    if (ch === ',') {
      let j = i + 1;
      while (j < s.length && (s[j] === ' ' || s[j] === '\t' || s[j] === '\n' || s[j] === '\r')) j++;
      if (j < s.length && (s[j] === '}' || s[j] === ']')) continue; // ট্রেলিং কমা বাদ
    }
    out += ch;
  }
  return out;
}

function tryParseJson<T>(s: string): T | null {
  try { return JSON.parse(s) as T; } catch { /* মেরামত করে আবার */ }
  try { return JSON.parse(repairJsonChars(s)) as T; } catch { return null; }
}

/** AI-এর উত্তর থেকে প্রথম balanced JSON অবজেক্ট — ভাঙা JSON যতটা সম্ভব মেরামত করে */
export function extractQpJson<T>(raw: string): T | null {
  if (!raw) return null;
  let s = raw.trim();
  // কোড-ফেন্স যেকোনো জায়গায় থাকতে পারে
  s = s.replace(/```(?:json)?/gi, '').trim();
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (esc) { esc = false; continue; }
    if (ch === '\\') { if (inStr) esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return tryParseJson<T>(s.slice(start, i + 1));
    }
  }
  // ভারসাম্যহীন — শেষ } পর্যন্ত যা আছে তা-ই চেষ্টা করি
  const last = s.lastIndexOf('}');
  if (last > start) return tryParseJson<T>(s.slice(start, last + 1));
  return null;
}

function unescapeJsonText(s: string): string {
  return s
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\'/g, "'")
    .replace(/\\\\/g, '\\');
}

const QP_TRANSCRIPT_KEYS = ['text', 'transcription', 'transcript', 'result', 'content', 'output'];

/**
 * মডেল প্রায়ই আমাদের কঠোর-আকার উপেক্ষা করে নিজের কাঠামোতে উত্তর দেয়:
 * {"header":{...}, "questions":[{number,text,marks,options},…]} — এই আকার থেকে
 * লাইন-ভিত্তিক কাঁচা-লেখা গড়ে তোলা। প্রশ্ন-অ্যারে থাকলেই যথেষ্ট।
 */
function transcriptFromStructuredQuestions(obj: Record<string, unknown>): string | null {
  // নেস্ট-আবরণ: {data|result|paper: {questions…}}
  let root: Record<string, unknown> = obj;
  for (let i = 0; i < 2; i++) {
    if (asArr(root.questions).length > 0) break;
    const nest = root.data ?? root.result ?? root.paper;
    if (nest && typeof nest === 'object' && !Array.isArray(nest)) { root = nest as Record<string, unknown>; continue; }
    break;
  }
  const questions = asArr(root.questions);
  if (questions.length === 0) return null;

  const lines: string[] = [];
  // হেডার (থাকলে) — স্কুল/পরীক্ষা/বিষয়/সময়/পূর্ণমান
  const head = root.header ?? root.meta ?? root.exam;
  if (head && typeof head === 'object' && !Array.isArray(head)) {
    const h = head as Record<string, unknown>;
    const headerBits: string[] = [];
    for (const k of ['school', 'school_name', 'schoolName', 'institution']) {
      const v = asStr(h[k]); if (v) { headerBits.push(v); break; }
    }
    for (const k of ['exam', 'examTitle', 'exam_title', 'title']) {
      const v = asStr(h[k]); if (v) { headerBits.push(v); break; }
    }
    for (const k of ['subject', 'sub']) {
      const v = asStr(h[k]); if (v) { headerBits.push(`বিষয়: ${v}`); break; }
    }
    for (const k of ['class', 'classLabel', 'class_name', 'cls']) {
      const v = asStr(h[k]); if (v) { headerBits.push(`শ্রেণি: ${v}`); break; }
    }
    if (headerBits.length > 0) lines.push(headerBits.join(' — '));
    for (const k of ['time', 'duration']) {
      const v = asStr(h[k]); if (v) { lines.push(`সময়: ${v}`); break; }
    }
    for (const k of ['fullMarks', 'full_marks', 'totalMarks', 'total_marks']) {
      const v = asStr(h[k]); if (v) { lines.push(`পূর্ণমান: ${v}`); break; }
    }
  }
  // বিভাগ-হেডার (থাকলে)
  for (const k of ['section_title', 'sectionTitle', 'section']) {
    const v = asStr(root[k]);
    if (v) { lines.push('', v); break; }
  }

  for (const qRaw of questions) {
    if (typeof qRaw === 'string') {
      const s = qRaw.trim();
      if (s) lines.push(s);
      continue;
    }
    if (!qRaw || typeof qRaw !== 'object') continue;
    const q = qRaw as Record<string, unknown>;
    const num = asStr(q.number ?? q.no ?? q.num ?? q.qno);
    const text = asStr(q.text ?? q.question ?? q.question_text ?? q.body ?? q.q);
    if (!text) continue;
    const marks = asStr(q.marks ?? q.mark ?? q.value ?? q.points);
    lines.push(`${num ? `${num}. ` : ''}${text}${marks ? ` [${marks}]` : ''}`);
    for (const o of asArr(q.options ?? q.choices ?? q.mcq)) {
      if (typeof o === 'string') {
        const s = o.trim();
        if (s) lines.push(s);
      } else if (o && typeof o === 'object') {
        const ob = o as Record<string, unknown>;
        const label = asStr(ob.label ?? ob.option ?? ob.key ?? ob.letter);
        const otext = asStr(ob.text ?? ob.value ?? ob.content);
        if (otext) lines.push(`${label ? `${label}. ` : ''}${otext}`);
      }
    }
    for (const sb of asArr(q.subs ?? q.sub_questions ?? q.parts)) {
      if (typeof sb === 'string') {
        const s = sb.trim();
        if (s) lines.push(s);
      } else if (sb && typeof sb === 'object') {
        const sb2 = sb as Record<string, unknown>;
        const stext = asStr(sb2.text ?? sb2.question ?? sb2.q);
        const smarks = asStr(sb2.marks ?? sb2.mark);
        if (stext) lines.push(`${stext}${smarks ? ` [${smarks}]` : ''}`);
      }
    }
  }
  return lines.length > 0 ? lines.join('\n') : null;
}

/**
 * AI-প্রতিলিপি উত্তর থেকে কাঁচা লেখা বের করা — সর্বোচ্চ সহনশীলতা:
 *  ১) পার্স-হওয়া JSON হলে চেনা কি (text/transcription/…) থেকে;
 *  ২) মডেলের নিজেছে-কাঠামো ({questions:[{number,text,marks}]}) থেকে লাইন গড়ে;
 *  ৩) JSON ভাঙা হলে এক-কি-শেপ রেগেক্সে উদ্ধার (মডেল পড়েছে, কেবল ফরম্যাট ভেঙেছে);
 *  ৪) JSON-ই না হলে পুরো উত্তরটাই প্রতিলিপি হিসেবে নেয়।
 * এতে "হাতের লেখা পড়া গেছে, তবু ব্যর্থ দেখাচ্ছে" — সেই মূল বাগ বন্ধ হয়।
 */
export function extractTranscriptText(raw: string): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  const obj = extractQpJson<Record<string, unknown>>(s);
  if (obj && typeof obj === 'object') {
    for (const k of QP_TRANSCRIPT_KEYS) {
      const v = obj[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
      if (Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string' && (x as string).trim())) {
        return (v as string[]).join('\n');
      }
    }
    // মডেলের নিজেছে-কাঠামো — questions-অ্যারে থেকে লাইন বানায়
    const structured = transcriptFromStructuredQuestions(obj);
    if (structured) return structured;
    return null; // JSON পার্স হয়েছে কিন্তু প্রতিলিপি-কি নেই
  }

  // ভাঙা/অসম্পূর্ণ JSON — এক-কি-শেপ থেকে উদ্ধার
  const m = s.match(/\{\s*"(?:text|transcription|transcript|result|content|output)"\s*:\s*"([\s\S]+)"\s*\}?/);
  if (m) {
    const salv = unescapeJsonText(m[1]).trim();
    if (salv) return salv;
  }

  // JSON-ই নেই — মডেল সরাসরি লেখা দিয়েছে: পুরোটাই প্রতিলিপি
  const plain = s.replace(/```(?:json)?/gi, '').trim();
  return plain.length >= 4 ? plain : null;
}

// ─── কাঁচা-লেখা পরিষ্কারণ (হাতের-লেখা প্রতিলিপির আবর্জনা ছাঁটাই) ───

/** আবর্জনা-রেখা: কেবল দাগ/দোত/আন্ডারস্কোর/তারকা — হাতের-লেখার আলাদা-করা রেখা বা স্ক্যান-শিল্পী
 *  ═─━ বক্স-রেখা, ।॥ বাংলা দণ্ড-পুনরাবৃত্তি, ▬▄ … জাতীয় শিল্পী-রেখাও ধরা হয় */
const QP_JUNK_LINE_RE = /^[\s\-.–—_=+~·•∙…•⋆*#|/\\═─━┄┅┈╌▬▄▀\u0964\u0965]{3,}$/;
/** পাতার নম্বর/মুখপত্র-রেখা: "- 2 -", "—১৩—", "· ৩ ·", "Page 3", "পৃষ্ঠা ০৪" — খাঁটি সংখ্যা রেখে দেয় (মান/উত্তর হতে পারে) */
const QP_PAGE_NUM_RE = /^(?:[-–—•·∙*]\s*[\u09e6-\u09ef\u0966-\u096f0-9]{1,3}\s*[-–—•·∙*]?|[-–—•·∙*]?\s*[\u09e6-\u09ef\u0966-\u096f0-9]{1,3}\s*[-–—•·∙*]|page\s*[-–—:\s]*\d+|পৃষ্ঠা\s*[\u09e6-\u09ef\u0966-\u096f0-9]+)$/i;

/**
 * প্রতিলিপি/টাইপ-করা কাঁচা-লেখা পরিষ্কার — ফরমেটিংয়ের আগেই আবর্জনা বাদ:
 *  · কেবল দাগ/দোত জাতীয় রেখা (হাতের-লেখার separator) বাদ
 *  · পাতার নম্বর/মুখপত্র-রেখা বাদ
 *  · পরপর হুবহু একই লাইন (বহু-পাতার ছবিতে হেডার বারবার) একবারই রাখা
 *  · বাড়তি ফাঁকা লাইন (২-এর বেশি পরপর) গুটানো, লাইনের শেষ/ভেতরের বাড়তি স্পেস গুটানো
 * রিটার্ন: { text, removed } — removed = কতটি রেখা বাদ পড়ল (টোস্টে জানানোর জন্য)।
 */
export function cleanRawQpText(raw: string): { text: string; removed: number } {
  const lines = raw.split(/\r?\n/);
  const out: string[] = [];
  let removed = 0;
  let blanks = 0;
  for (const rawLine of lines) {
    const line = rawLine.replace(/[ \t\u00a0]+/g, ' ').trim();
    if (!line) {
      // ফাঁকা লাইন — পরপর ২-এর বেশি গুটানো (বিভাগ-বিভাজনে ১টি যথেষ্ট)
      blanks += 1;
      if (blanks <= 1) out.push('');
      else removed += 1;
      continue;
    }
    blanks = 0;
    if (QP_JUNK_LINE_RE.test(line)) { removed += 1; continue; }
    if (QP_PAGE_NUM_RE.test(line) && line.length <= 16) { removed += 1; continue; }
    // হুবহু আগের লাইনের পুনরাবৃত্তি — বহু-পাতার ছবিতে হেডার/বিভাগ-শিরোনাম বারবার আসে
    if (out.length > 0 && out[out.length - 1] === line && line.length < 60) { removed += 1; continue; }
    out.push(line);
  }
  return { text: out.join('\n').replace(/^\n+/, '').replace(/\n+$/, '\n').replace(/\n{3,}/g, '\n\n'), removed };
}

// ─── গণিত রেন্ডারিং ($…$ → এডিটর-নিরাপদ HTML) ───

/**
 * টেক্সটের ভেতরের $…$ LaTeX সেগমেন্টগুলোকে sup/sub + ইউনিকোড-চিহ্ন HTML-এ
 * রূপান্তর করে; বাকি অংশ HTML-escaped থাকে। ফলাফল TipTap-এর স্কিমায়
 * অক্ষত থাকে (<sup>/<sub> মার্ক সাপোর্টেড), তাই প্রিভিউ = এডিটর = এক্সপোর্ট।
 */
export function mathRichToHtml(text: string): string {
  if (!text) return '';
  return text
    .split(/(\$[^$\n]+\$)/g)
    .map((seg) => {
      if (seg.length > 2 && seg.startsWith('$') && seg.endsWith('$')) {
        return latexToSafeHtml(seg.slice(1, -1));
      }
      return escapeQpHtml(seg);
    })
    .join('');
}

/** একটি LaTeX অংশ → এডিটর-নিরাপদ HTML (কেবল <sup>/<sub> ট্যাগ উৎপন্ন হয়) */
export function latexToSafeHtml(src: string): string {
  // আগে escape — পরের ট্রান্সফর্মগুলো শুধু ব্রেস/ব্যাকস্ল্যাশে কাজ করে
  let s = escapeQpHtml(src);

  // \{ \} → লিটারাল ব্রেস — নইলে শেষের ব্রেস-ছাঁটাইয়ে ব্যাকস্ল্যাশ রয়ে যায়
  s = s.replace(/\\\{/g, '{').replace(/\\\}/g, '}');
  // \left( \right) → সাধারণ বন্ধনী — ≤/≥-র আগে চলবে (নইলে \\le \\left-কে ≤ft করে ফেলত)
  s = s.replace(/\\left\s*([\u0028\u005B\u007B])/g, '$1').replace(/\\right\s*([\u0029\u005D\u007D])/g, '$1');
  // \begin{...}/\end{...} পরিবেশ-চিহ্ন বাদ — ম্যাট্রিক্স-লেআউট সরাসরি টেক্সটে মেলে না
  s = s.replace(/\\(?:begin|end)\s*\{[^{}]*\}/g, ' ');
  // ত্রিকোণমিতি/লগ-ফাংশন — নইলে অজানা-কমান্ড-ছাঁটাই এগুলো খেয়ে ফেলে (\\sin 30° → "30°" হয়ে যেত)
  s = s.replace(/\\(?:cosec|csc|sec|cot|tan|sin|cos|log|ln|exp|det|lim|max|min|deg|mod)\b/g, (m) => m.slice(1));
  // \overline{X} / \vec{X} / \hat{X} / \bar{X} — কম্বাইনিং-চিহ্ন (ব্রেস-ছাঁটাইয়ের আগে)
  for (let i = 0; i < 2; i++) {
    s = s.replace(/\\overline\s*\{([^{}]*)\}/g, (_m, g: string) => [...g].map((c) => c + '\u0305').join(''));
    s = s.replace(/\\(?:vec|overrightarrow)\s*\{([^{}]*)\}/g, '$1\u20D7');
    s = s.replace(/\\hat\s*\{([^{}]*)\}/g, '$1\u0302');
    s = s.replace(/\\bar\s*\{([^{}]*)\}/g, '$1\u0304');
  }
  // এস্কেপ-জাত লিটারাল — \% \& \# \_ (সূচক/নিচসূচক-রেগেক্সের আগেই, নইলে \\_x সাব-স্ক্রিপ্ট হয়ে যেত)
  s = s.replace(/\\%/g, '%').replace(/\\&/g, '&').replace(/\\#/g, '#').replace(/\\_/g, '_');

  // ভগ্নাংশ \frac{a}{b} → a⁄b — সরল টোকেনে বন্ধনী লাগে না, জটিল টোকেনে (a⁄b); ৪ পাসে নেস্টিং
  for (let i = 0; i < 4; i++) {
    s = s.replace(/\\(?:dfrac|tfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (_m, a: string, b: string) => {
      const simple = (t: string) => /^[0-9A-Za-z\u00d7\u00f7]{1,4}$/.test(t.trim());
      const A = a.trim(); const B = b.trim();
      return simple(A) && simple(B) ? `${A}\u2044${B}` : `(${A}\u2044${B})`;
    });
  }
  // ডিগ্রি — ^{\circ} যেন <sup>°</sup> না হয়ে সরাসরি ° হয়
  s = s.replace(/\^\{\\circ\}/g, '\u00B0').replace(/\^\\circ\b/g, '\u00B0');
  // বর্গমূল
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, '\u221A($1)');
  s = s.replace(/\\sqrt\s*([0-9A-Za-z])/g, '\u221A$1');
  // সূচক / নিচসূচক
  s = s.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([0-9A-Za-z+\-])/g, '<sup>$1</sup>');
  s = s.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>');
  s = s.replace(/_([0-9A-Za-z])/g, '<sub>$1</sub>');
  // গ্রিক ও চিহ্ন — সম্পূর্ণ সেট (\\b সীমা-সহ: \\le যেন \\left-কে না খায়, \\in যেন \\int-কে না খায়)
  s = s
    .replace(/\\times\b/g, '\u00D7').replace(/\\div\b/g, '\u00F7')
    .replace(/\\pm\b/g, '\u00B1').replace(/\\mp\b/g, '\u2213')
    .replace(/\\le(?:q|qslant|slant)?\b/g, '\u2264').replace(/\\ge(?:q|qslant|slant)?\b/g, '\u2265')
    .replace(/\\neq?\b/g, '\u2260').replace(/\\approx\b/g, '\u2248')
    .replace(/\\equiv\b/g, '\u2261').replace(/\\propto\b/g, '\u221D')
    .replace(/\\cdot\b/g, '\u00B7').replace(/\\ast\b/g, '\u2217')
    .replace(/\\pi\b/g, '\u03C0')
    .replace(/\\alpha\b/g, '\u03B1').replace(/\\beta\b/g, '\u03B2')
    .replace(/\\gamma\b/g, '\u03B3').replace(/\\delta\b/g, '\u03B4').replace(/\\Delta\b/g, '\u0394')
    .replace(/\\varepsilon\b/g, '\u03B5').replace(/\\epsilon\b/g, '\u03B5')
    .replace(/\\zeta\b/g, '\u03B6').replace(/\\eta\b/g, '\u03B7').replace(/\\theta\b/g, '\u03B8')
    .replace(/\\iota\b/g, '\u03B9').replace(/\\kappa\b/g, '\u03BA')
    .replace(/\\lambda\b/g, '\u03BB').replace(/\\Lambda\b/g, '\u039B')
    .replace(/\\mu\b/g, '\u03BC').replace(/\\nu\b/g, '\u03BD').replace(/\\xi\b/g, '\u03BE')
    .replace(/\\rho\b/g, '\u03C1').replace(/\\sigma\b/g, '\u03C3').replace(/\\Sigma\b/g, '\u03A3')
    .replace(/\\tau\b/g, '\u03C4').replace(/\\upsilon\b/g, '\u03C5')
    .replace(/\\varphi\b/g, '\u03C6').replace(/\\phi\b/g, '\u03C6').replace(/\\Phi\b/g, '\u03A6')
    .replace(/\\chi\b/g, '\u03C7').replace(/\\psi\b/g, '\u03C8').replace(/\\Psi\b/g, '\u03A8')
    .replace(/\\omega\b/g, '\u03C9').replace(/\\Omega\b/g, '\u03A9')
    .replace(/\\Gamma\b/g, '\u0393').replace(/\\Theta\b/g, '\u0398')
    .replace(/\\degree\b/g, '\u00B0')
    .replace(/\\(?:Rightarrow|implies)\b/g, '\u21D2').replace(/\\(?:Leftarrow|impliedby)\b/g, '\u21D0')
    .replace(/\\Leftrightarrow\b/g, '\u21D4').replace(/\\leftrightarrow\b/g, '\u2194')
    .replace(/\\(?:rightarrow|to)\b/g, '\u2192').replace(/\\leftarrow\b/g, '\u2190')
    .replace(/\\mapsto\b/g, '\u21A6')
    .replace(/\\infty\b/g, '\u221E')
    .replace(/\\sum\b/g, '\u03A3').replace(/\\prod\b/g, '\u220F')
    .replace(/\\int\b/g, '\u222B').replace(/\\oint\b/g, '\u222E')
    .replace(/\\angle\b/g, '\u2220').replace(/\\triangle\b/g, '\u25B3')
    .replace(/\\perp\b/g, '\u22A5').replace(/\\parallel\b/g, '\u2225')
    .replace(/\\therefore\b/g, '\u2234').replace(/\\because\b/g, '\u2235')
    .replace(/\\forall\b/g, '\u2200')
    .replace(/\\nexists\b/g, '\u2204').replace(/\\exists\b/g, '\u2203')
    .replace(/\\emptyset\b/g, '\u2205').replace(/\\varnothing\b/g, '\u2205')
    .replace(/\\subseteq\b/g, '\u2286').replace(/\\subset\b/g, '\u2282')
    .replace(/\\supseteq\b/g, '\u2287').replace(/\\supset\b/g, '\u2283')
    .replace(/\\notin\b/g, '\u2209').replace(/\\in\b/g, '\u2208').replace(/\\ni\b/g, '\u220B')
    .replace(/\\cup\b/g, '\u222A').replace(/\\cap\b/g, '\u2229')
    .replace(/\\(?:ldots|dots|cdots)\b/g, '\u2026').replace(/\\vdots\b/g, '\u22EE')
    .replace(/\\partial\b/g, '\u2202').replace(/\\nabla\b/g, '\u2207').replace(/\\prime\b/g, '\u2032')
    .replace(/\\langle\b/g, '\u27E8').replace(/\\rangle\b/g, '\u27E9')
    .replace(/\\Vert\b/g, '\u2016').replace(/\\vert\b/g, '|').replace(/\\mid\b/g, '|')
    .replace(/\\circ\b/g, '\u00B0');
  // \text{…} / \operatorname{…} → বিষয়বস্তু
  s = s.replace(/\\(?:text|operatorname)\s*\{([^{}]*)\}/g, '$1');
  // স্পেসিং কমান্ড + টিল্ড
  s = s.replace(/\\[,;!]/g, ' ').replace(/\\(?:quad|qquad)\b/g, '  ').replace(/~/g, ' ');
  // অজানা কমান্ড বাদ, অবশিষ্ট ব্রেস/ব্যাকস্ল্যাশ বাদ
  s = s.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '').replace(/\\/g, '');
  return s;
}

// ─── AI JSON → নরমালাইজড পেপার ───

const asStr = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

/** একাধিক সম্ভাব্য কি-নাম থেকে প্রথম নন-খালি স্ট্রিং (AI-দের নানা নামকরণ সহন) */
function firstStr(rec: Record<string, unknown>, keys: string[]): string {
  for (const k of keys) {
    const v = rec[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number') return String(v);
  }
  return '';
}

/** স্ট্রিং-অপশন "ক) ফল" / "a. text" / "ক. text" → label+text */
function parseOptionString(s: string): QpOption | null {
  const t = s.trim();
  if (!t) return null;
  const m = t.match(/^\(?\s*([কখগঘঙa-dA-Dकखगघ])\s*[).):।ঃ-]\s*(.+)$/);
  if (m) return { label: m[1], text: m[2].trim() };
  return { label: '', text: t };
}

/** স্ট্রিং-প্রশ্ন "১. লেখা [২]" → number/text/marks */
function parseQuestionString(s: string): { number: string; text: string; marks: string } | null {
  let t = s.trim();
  if (!t) return null;
  let number = '';
  const en = toEnglishDigits(t);
  const nm = en.match(/^(?:q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)।ঃ:\-–—]\s*/i);
  if (nm) {
    number = String(nm[1]);
    t = t.slice(nm[0].length).trim();
  }
  const { text, marks } = splitTrailingMarks(t);
  if (!text) return null;
  return { number, text, marks };
}

const QP_KINDS: readonly QpQKind[] = ['short', 'mcq', 'creative', 'match', 'tf', 'blank'];

function coerceQpKind(v: unknown): QpQKind | null {
  const s = (typeof v === 'string' ? v : '').trim().toLowerCase();
  if (!s) return null;
  if ((QP_KINDS as readonly string[]).includes(s)) return s as QpQKind;
  if (/^multiple.?choice|objective$/.test(s)) return 'mcq';
  if (/^creative|srijonshil|structured$/.test(s)) return 'creative';
  if (/^match|matching|column.?match|sumel|মিলকরণ$/.test(s)) return 'match';
  if (/^true.?false|boolean$/.test(s)) return 'tf';
  if (/^blank|fill.?in.?the.?blank|gap$/.test(s)) return 'blank';
  return null;
}

/**
 * বছর-ট্যাগ — বিশ্ববিদ্যালয়-সাজেশনের প্রশ্নের পাশের বছর-চিহ্ন [DU '19], [চবি ২০১৫], (RU 2021)।
 * শর্ত: বন্ধনীর ভেতরে অক্ষর + সংখ্যা দুটোই আছে, মোট ২–২৮ অক্ষর, খাঁটি সংখ্যা নয় (সে মান)।
 * marks-[২] আগেই আলাদা হয়, তাই [DU '19] জাতীয় ট্যাগের সাথে সংঘর্ষ হয় না।
 */
const QP_YEARTAG_TRAIL_RE = /[[(]\s*([^\]()]{2,28}?)\s*[\])]$/;

/** বছর-ট্যাগের ভেতরের লেখা সত্যিই ট্যাগ-জাতীয় কি না — অক্ষর+সংখ্যা দুটোই লাগবে */
function looksLikeYearTag(content: string): boolean {
  const s = content.trim();
  if (s.length < 3 || s.length > 28) return false;
  const hasLetter = /[A-Za-z\u0980-\u09ff\u0900-\u097f]/.test(s);
  const digitRuns = s.match(/[\u09e6-\u09ef\u0966-\u096f0-9]+/g) ?? [];
  if (!hasLetter || digitRuns.length === 0) return false;
  // সংখ্যা-খণ্ড ছোট হতে হবে (২–৪ অঙ্ক — '১৯ / 2015); পুরোটা সংখ্যা হলে সে মান, ট্যাগ নয়
  const totalDigits = digitRuns.join('').length;
  return totalDigits <= 4 && digitRuns.every((d) => d.length <= 4);
}

/** AI-এর দেওয়া বছর-ট্যাগ নিরাপদ করা — বন্ধনী খোলা, দৈর্ঘ্য-সীমা, ভেতরে সংখ্যা লাগবেই */
export function coerceQpYearTag(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim().replace(/^[[({]+\s*/, '').replace(/\s*[\])}]+$/, '').trim();
  if (!s) return undefined;
  if (looksLikeYearTag(s)) return s;
  // সংখ্যা-ছাড়া ট্যাগও চলবে (যেমন "বোর্ড প্রশ্ন") — কেবল দৈর্ঘ্য-সীমা
  return s.length <= 28 ? s : undefined;
}

/** প্রশ্নের লেখার শেষে লাগানো বছর-ট্যাগ আলাদা করা — "…ব্যাখ্যা কর। [DU '19]" */
export function extractYearTagFromText(text: string): { text: string; tag?: string } {
  const t = text.trim();
  const m = t.match(QP_YEARTAG_TRAIL_RE);
  if (m && looksLikeYearTag(m[1])) {
    const rest = t.slice(0, m.index).trim();
    if (rest) return { text: rest, tag: m[1].trim() };
  }
  return { text: t };
}

/** [চিত্র: …] / [চিত্র] / [Fig: …] — হাতে-আঁকা চিত্রের স্লট-মার্কার (প্রতিলিপি ও কাঠামো-দুটোতেই)
 * ক্যানোনিক্যাল সংজ্ঞা qp-figures.ts-এ — উপরে রি-এক্সপোর্ট করা; এখানে QP_FIGURE_RE ইমপোর্ট হয়েছে। */

/** মডেল/পার্সারের গুরুত্ব-মান → ১/২ — সংখ্যা, তারকা ("★★") বা লেখা ("important") সব চলে */
function coerceQpImportance(v: unknown): QpImportance | undefined {
  if (typeof v === 'string') {
    const s = v.trim();
    const starCount = (s.match(/[★☆✦✶✸]/g) ?? []).length;
    if (starCount >= 2) return 2;
    if (starCount === 1) return 1;
    if (/most|high|অতি|अति/i.test(s)) return 2;
    if (/important|গুরুত্ব|जरूरी|महत्व|জরুর/i.test(s)) return 1;
    v = parseLocaleInt(s);
  }
  const n = typeof v === 'number' ? v : 0;
  return n >= 2 ? 2 : n === 1 ? 1 : undefined;
}

/** মডেল/পার্সারের জোড়া-অবজেক্ট → QpPair[] — স্ট্রিং "ঢাকা → কক্সবাজার" রূপও চলে */
function coerceQpPairs(v: unknown): QpPair[] | undefined {
  const pairs: QpPair[] = [];
  for (const pr of asArr(v)) {
    if (typeof pr === 'string') {
      const parts = pr.split(/\s*(?:→|->|=>|—|–|\||;|\s{3,})\s*/);
      if (parts.length >= 2 && parts[0].trim() && parts[1].trim()) {
        pairs.push({ left: parts[0].trim(), right: parts.slice(1).join(' ').trim() });
      } else if (pr.trim()) {
        pairs.push({ left: pr.trim(), right: '' });
      }
    } else if (pr && typeof pr === 'object') {
      const pb = pr as Record<string, unknown>;
      const left = firstStr(pb, ['left', 'a', 'first', 'columnA', 'column_a', 'item', 'source']);
      const right = firstStr(pb, ['right', 'b', 'second', 'columnB', 'column_b', 'match', 'target']);
      if (left || right) pairs.push({ left, right });
    }
  }
  return pairs.length > 0 ? pairs : undefined;
}

/**
 * অফলাইন পার্সারের জন্য হালকা ধরন-শনাক্তকরণ — প্রশ্নের লেখা থেকেই বাংলাদেশ-প্রথার
 * ধরনগুলো চেনা যায় (মিলকরণ/সত্য-মিথ্যা/শূন্যস্থান/সৃজনশীল/MCQ)।
 */
export function qpDetectKind(text: string, options: QpOption[], subs: QpSubQ[]): QpQKind {
  // মিলকরণ আগে — মিলকরণ-প্রশ্নের স্তম্ভ-জিনিসও ক/খ অপশন-রূপে পার্স হয়, তাই options-আগে নয়
  if (/মিলকরণ|স্তম্ভ\s*(?:মিল|মেলানো)|মেলাও|सुमेलन|स्तंभ\s*मिलान|match(?:ing)?\s*(?:the\s+)?(?:columns?|lists?)/i.test(text)) return 'match';
  if (options.length > 0) return 'mcq';
  if (/সত্য\s*(?:না|অথবা|কি|কিন্তু|—|-)?\s*মিথ্যা|सत्य\s*(?:या|अथवा)?\s*असत्य|true\s*\/\s*false/i.test(text)) return 'tf';
  if (/শূন্যস্থান|ফাঁকা\s*ঘর|रिक्त\s*स्थान|fill\s*in\s*the\s*blank/i.test(text) || /_{3,}/.test(text)) return 'blank';
  if (subs.length >= 3) return 'creative';
  return 'short';
}

/**
 * AI-এর সম্ভাব্য-ভাঙা JSON-কে নিরাপদ QuestionPaper-এ রূপান্তর — সর্বোচ্চ সহনশীল:
 * নেস্ট-আবরণ ({paper|data|result:{…}}), সমতল questions, স্ট্রিং-প্রশ্ন/অপশন,
 * বিকল্প কি-নাম (question/body, mark/value, choices, sub_questions ইত্যাদি) সব চলে।
 */
export function normalizeQpJson(data: unknown, meta: QpMeta, format: QpFormat): QuestionPaper | null {
  let root = data;
  // নেস্ট-আবরণ খোলা: { paper|questionPaper|data|result|qp: { sections… } }
  for (let i = 0; i < 3; i++) {
    if (!root || typeof root !== 'object' || Array.isArray(root)) break;
    const rec = root as Record<string, unknown>;
    if (asArr(rec.sections).length > 0 || asArr(rec.questions).length > 0) break;
    const nest = rec.paper ?? rec.questionPaper ?? rec.data ?? rec.result ?? rec.qp;
    if (nest && typeof nest === 'object') { root = nest; continue; }
    break;
  }
  if (!root || typeof root !== 'object') return null;
  // শুধু প্রশ্নের অ্যারে এলেও চলে
  if (Array.isArray(root)) root = { sections: [{ title: '', note: '', questions: root }] };

  const d = root as Record<string, unknown>;
  let sectionsRaw = asArr(d.sections);
  // সমতল questions দিলেও কাজ চলে
  if (sectionsRaw.length === 0) {
    const flat = asArr(d.questions);
    if (flat.length > 0) sectionsRaw = [{ title: '', note: '', questions: flat }];
  }
  if (sectionsRaw.length === 0) return null;

  const sections: QpSection[] = [];
  for (const secRaw of sectionsRaw.slice(0, 12)) {
    if (!secRaw) continue;
    // বিভাগ সরাসরি প্রশ্নের অ্যারে হলে
    const secVal = Array.isArray(secRaw) ? { questions: secRaw } : secRaw;
    if (typeof secVal !== 'object') continue;
    const sec = secVal as Record<string, unknown>;
    const questions: QpQuestion[] = [];
    for (const qRaw of asArr(sec.questions).slice(0, 80)) {
      if (!qRaw) continue;
      if (typeof qRaw === 'string') {
        const pq = parseQuestionString(qRaw);
        if (pq) questions.push({ ...pq, options: [], subs: [] });
        continue;
      }
      if (typeof qRaw !== 'object') continue;
      const q = qRaw as Record<string, unknown>;
      const text = firstStr(q, ['text', 'question', 'question_text', 'questionText', 'q', 'body', 'title']);
      if (!text) continue;
      const options: QpOption[] = [];
      for (const o of asArr(q.options ?? q.choices ?? q.mcq)) {
        if (typeof o === 'string') {
          const po = parseOptionString(o);
          if (po && po.text) options.push(po);
        } else if (o && typeof o === 'object') {
          const ob = o as Record<string, unknown>;
          const label = firstStr(ob, ['label', 'option', 'key', 'letter', 'opt']);
          const otext = firstStr(ob, ['text', 'value', 'content', 'ans', 'answer']);
          if (label || otext) options.push({ label, text: otext });
        }
      }
      const subs: QpSubQ[] = [];
      for (const sb of asArr(q.subs ?? q.sub_questions ?? q.subquestions ?? q.parts)) {
        if (typeof sb === 'string') {
          const ps = parseQuestionString(sb);
          if (ps) subs.push({ text: ps.text, marks: ps.marks });
        } else if (sb && typeof sb === 'object') {
          const sb2 = sb as Record<string, unknown>;
          const stext = firstStr(sb2, ['text', 'question', 'q', 'body']);
          if (stext) subs.push({ text: stext, marks: firstStr(sb2, ['marks', 'mark', 'value', 'points']) });
        }
      }
      const kind = coerceQpKind(q.kind ?? q.type ?? q.questionType) ?? (options.length > 0 ? 'mcq' : 'short');
      const pairs = kind === 'match' ? coerceQpPairs(q.pairs ?? q.matches ?? q.match ?? q.columns) : undefined;
      const importance = coerceQpImportance(q.importance ?? q.star ?? q.stars ?? q.priority);
      // বছর-ট্যাগ — AI-এর আলাদা ঘর থেকে, না পেলে লেখার শেষের বন্ধনী থেকে ([DU '19])
      const fromText = extractYearTagFromText(text);
      const finalText = fromText.tag ? fromText.text : text;
      const yearTag = coerceQpYearTag(q.yearTag ?? q.year ?? q.year_tag ?? q.attempt) ?? fromText.tag;
      questions.push({
        number: firstStr(q, ['number', 'no', 'num', 'qno', 'serial']),
        text: finalText,
        marks: firstStr(q, ['marks', 'mark', 'value', 'points', 'nombor']),
        options,
        subs,
        kind,
        pairs,
        ...(importance ? { importance } : {}),
        ...(yearTag ? { yearTag } : {}),
      });
    }
    sections.push({
      title: firstStr(sec, ['title', 'name', 'heading', 'section']),
      note: firstStr(sec, ['note', 'instruction', 'directions', 'note_text']),
      questions,
    });
  }
  const valid = sections.filter((s) => s.questions.length > 0);
  if (valid.length === 0) return null;

  // হেডার: ফর্মের ফাঁকা ঘরে AI-এর মান বসে — শিক্ষকের লেখা/আগে-থেকে-ভরা ঘরই প্রাধান্য পায়।
  // AI-কে নির্দেশ দেওয়া আছে কেবল RAW লেখায় স্পষ্ট লেখা তথ্যই মেটা-ফাঁকে দিতে।
  const fillIfEmpty = (cur: string, ...keys: string[]): string => {
    if (cur.trim()) return cur;
    return firstStr(d, keys);
  };
  const aiInstructions = cleanQpInstructions(asArr(d.instructions));
  const finalNote = firstStr(d, ['finalNote', 'final_note', 'closingNote', 'closing_note']);
  return {
    meta: {
      ...meta,
      schoolName: fillIfEmpty(meta.schoolName, 'schoolName', 'school', 'school_name', 'institution'),
      examTitle: fillIfEmpty(meta.examTitle, 'examTitle', 'exam_title', 'exam', 'title'),
      subject: fillIfEmpty(meta.subject, 'subject', 'sub', 'subjectName'),
      classLabel: fillIfEmpty(meta.classLabel, 'classLabel', 'class', 'className', 'class_name'),
      date: fillIfEmpty(meta.date, 'date', 'examDate'),
      time: fillIfEmpty(meta.time, 'time', 'duration', 'examTime'),
      fullMarks: fillIfEmpty(meta.fullMarks, 'fullMarks', 'full_marks', 'totalMarks', 'total_marks'),
      subjectCode: fillIfEmpty(meta.subjectCode, 'subjectCode', 'subject_code', 'code'),
      setCode: fillIfEmpty(meta.setCode, 'setCode', 'set_code', 'set'),
      syllabusNote: fillIfEmpty(meta.syllabusNote, 'syllabusNote', 'syllabus_note', 'syllabus'),
      department: fillIfEmpty(meta.department ?? '', 'department', 'dept', 'department_name'),
      program: fillIfEmpty(meta.program ?? '', 'program', 'programme', 'degree'),
      session: fillIfEmpty(meta.session ?? '', 'session', 'academic_year', 'term'),
      instructions: aiInstructions.length > 0 ? aiInstructions : meta.instructions,
    },
    sections: valid,
    format,
    ...(finalNote ? { finalNote } : {}),
    ...(coerceQpLevel(d.level) ? { level: coerceQpLevel(d.level) } : {}),
  };
}

// ─── ফরম্যাট নির্ধারণ ───

export function resolveQpFormat(p: QuestionPaper): QpResolvedFormat {
  if (p.format !== 'auto') return p.format;
  const all = p.sections.flatMap((s) => s.questions);
  const total = all.length;
  const mcqN = all.filter((q) => q.options.length > 0).length;
  const subN = all.filter((q) => q.subs.length >= 3).length;
  if (total <= 6 && mcqN === 0 && subN === 0) return 'compact';
  // অর্ধেকের বেশি MCQ হলে বোর্ড-MCQ প্রথা; সৃজনশীল (ক/খ/গ/ঘ) থাকলে বোর্ড-সৃজনশীল
  if (total > 0 && mcqN / total >= 0.5 && subN === 0) return 'modern';
  if (subN >= 2) return 'board';
  return 'classic';
}
// ─── প্রো হিসাব: নম্বর-যোগফল ও সেট বৈচিত্র্য ───

/** বাংলা/দেবনাগরী/ইংরেজি — যেকোনো ডিজিট-রাশির পূর্ণসংখ্যা */
export function parseLocaleInt(s: string): number | null {
  const m = (s ?? '').match(/[\u09e6-\u09ef\u0966-\u096f0-9]+/);
  if (!m) return null;
  let n = 0;
  for (const ch of m[0]) {
    const c = ch.codePointAt(0) ?? 0;
    let d = -1;
    if (c >= 0x09e6 && c <= 0x09ef) d = c - 0x09e6;
    else if (c >= 0x0966 && c <= 0x096f) d = c - 0x0966;
    else if (c >= 48 && c <= 57) d = c - 48;
    if (d < 0) return null;
    n = n * 10 + d;
  }
  return n;
}

/**
 * প্রশ্নগুলোর নম্বর-মানের যোগফল। প্রশ্নে নিজস্ব মান না থাকলে উপ-প্রশ্নের
 * মান যোগ হয়। কোনো মানই না পাওয়া গেলে null — অর্থাৎ যাচাই সম্ভব নয়।
 */
export function sumQpMarks(p: QuestionPaper): number | null {
  let sum = 0;
  let any = false;
  for (const sec of p.sections) {
    for (const q of sec.questions) {
      const own = parseLocaleInt(q.marks);
      if (own != null) { sum += own; any = true; continue; }
      for (const sub of q.subs) {
        const sm = parseLocaleInt(sub.marks);
        if (sm != null) { sum += sm; any = true; }
      }
    }
  }
  return any ? sum : null;
}

/**
 * সেট বৈচিত্র্য — প্রতিটি বিভাগের ভেতরে প্রশ্নের ক্রম এলোমেলো (Fisher–Yates),
 * তারপর পুরো পত্রে ধারাবাহিক নতুন নম্বর। MCQ-র অপশন ও নম্বর-মান অপরিবর্তিত থাকে
 * (উত্তর-মিল ভাঙে না)। সংখ্যা-পদ্ধতি মূল পত্র থেকে শনাক্ত হয় (বাংলা/দেবনাগরী/ইংরেজি)।
 */
export function shufflePaper(p: QuestionPaper): QuestionPaper {
  const pick = p.sections.flatMap((s) => s.questions)[0]?.number ?? '';
  const deva = /[\u0966-\u096f]/.test(pick);
  const beng = /[\u09e6-\u09ef]/.test(pick) || (!deva && /[\u09e6-\u09ef]/.test(p.meta.fullMarks + p.meta.time));
  let n = 1;
  const sections = p.sections.map((sec) => {
    const qs = [...sec.questions];
    for (let i = qs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [qs[i], qs[j]] = [qs[j], qs[i]];
    }
    const renumbered = qs.map((q) => {
      const num = deva ? toDevanagariNumber(n) : beng ? toBanglaNumber(n) : String(n);
      n += 1;
      return { ...q, number: num };
    });
    return { ...sec, questions: renumbered };
  });
  return { ...p, sections };
}

// ─── ফলব্যাক: AI ছাড়া লাইন-পার্সার ───

/** ধারাবাহিক অপশন-লেবেল ক্রম — ক,খ,গ,ঘ / a,b,c,d / क,ख,ग,घ (মিথ্যা-বিভাজন আটকায়) */
const QP_OPT_SEQS: string[][] = [
  ['ক', 'খ', 'গ', 'ঘ', 'ঙ'],
  ['a', 'b', 'c', 'd', 'e'],
  ['A', 'B', 'C', 'D', 'E'],
  ['क', 'ख', 'ग', 'घ'],
];

/**
 * এক লাইনে একাধিক MCQ-অপশন ভাঙা — "ক) চট্রগ্রাম খ) ঢাকা গ) খুলনা ঘ) রাজশাহী" →
 * ৪টি আলাদা অপশন। বাংলাদেশের শিক্ষকরা অপশন এক লাইনেই লেখেন। ভুল-ভাঙা আটকাতে
 * লেবেলগুলোকে অবশ্যই ধারাবাহিক ক্রমে (ক→খ→গ→ঘ) থাকতে হয়।
 */
function splitInlineOptions(line: string): QpOption[] | null {
  const marker = /(?:^|(?<=\s))([কখগঘঙa-eA-Eकखगघ])\s*[.):।ঃ]\s*/g;
  const hits: Array<{ label: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = marker.exec(line))) {
    hits.push({ label: m[1], start: m.index, end: m.index + m[0].length });
    if (hits.length > 6) break;
  }
  if (hits.length < 2) return null;
  const seq = QP_OPT_SEQS.find((s) => s.includes(hits[0].label));
  if (!seq) return null;
  const offset = seq.indexOf(hits[0].label);
  for (let i = 0; i < hits.length; i++) {
    if (seq[offset + i] !== hits[i].label) return null; // ক্রম ভাঙা — অপশন নয়
  }
  const opts: QpOption[] = [];
  for (let i = 0; i < hits.length; i++) {
    const text = line.slice(hits[i].end, i + 1 < hits.length ? hits[i + 1].start : undefined).trim();
    if (!text) return null;
    opts.push({ label: hits[i].label, text });
  }
  return opts;
}

/** লাইনের শেষে বন্ধনীতে নম্বর-মান [২] (3) [মান: ২] [Marks: 2] — খুঁজে আলাদা করে */
function splitTrailingMarks(s: string): { text: string; marks: string } {
  const m = s.match(
    /\s*[\[{(]\s*(?:নম্বর|নং|মান|মার্কস|মার্ক্স|नंबर|अंक|marks?|mark)?\s*[:=]?\s*([\u09e6-\u09ef\u0966-\u096f0-9]{1,3})\s*(?:নম্বর|নং|মান|মার্কস|মার্ক্স|नंबर|अंक|marks?|mark)?\s*[\]})]\s*$/i,
  );
  if (m && m.index !== undefined && s.slice(0, m.index).trim()) {
    return { text: s.slice(0, m.index).trim(), marks: m[1] };
  }
  return { text: s.trim(), marks: '' };
}

/**
 * AI ছাড়া দ্রুত কাঠামোকরণ — সম্পূর্ণ অফলাইন।
 * লাইন-ভিত্তিক হিউরিস্টিক: বিভাগ-হেডার, "১." নম্বর, শেষে [২] মার্কস,
 * ক/খ/গ/ঘ অপশন, (ক)/(i) উপ-প্রশ্ন। ব্যর্থ হলে null।
 */
export function parseQuestionText(raw: string, meta: QpMeta, format: QpFormat, lang: Lang): QuestionPaper | null {
  const lines = raw.split(/\r?\n/);
  const banglaNums = /[০-৯]/.test(raw);
  const sections: QpSection[] = [];
  const preamble: string[] = [];
  let cur: QpSection | null = null;
  let q: QpQuestion | null = null;
  let qNo = 0;

  for (const rawLine of lines) {
    let line = rawLine.replace(/\s+$/, '').trim();
    if (!line) continue;
    // সাজেশন-তারকা — লাইনের শুরুর ★/✦ চিহ্ন প্রশ্নের গুরুত্ব (★ = ১, ★★ = ২);
    // একক * তারকাও চলে (শিক্ষকেরা টাইপে * ব্যবহার করেন) — শুধু ফাঁকা/সংখ্যার আগে হলে
    let stars = 0;
    const starM = line.match(/^(?:[★☆✦✶✸]\s*){1,3}/);
    if (starM) {
      stars = (starM[0].match(/[★☆✦✶✸]/g) ?? []).length;
      line = line.slice(starM[0].length).trim();
    } else if (/^\*(?:\s|[\u0966-\u096f\u09e6-\u09ef\d])/.test(line)) {
      stars = 1;
      line = line.replace(/^\*\s*/, '').trim();
    }
    if (!line) continue;
    const en = toEnglishDigits(line);

    // বিভাগ/অংশ/खण्ड হেডার — শেষের [প্রতিটি ২ নম্বর] জাতীয় অংশ নোটে চলে যায়
    // দ্রষ্টব্য: JS-এর \b ASCII-শব্দ-সীমা — বাংলা অক্ষরের পরে কাজ করে না, তাই নেগেটিভ লুকঅ্যাহেড
    if (/^(?:বিভাগ|খণ্ড|অংশ(?!ী|গ্র)|खण्ड|खंड|भाग|অধ্যায়|section|part|chapter)/i.test(line) || /^(?:বহুনির্বাচনি|বহুবিকল্প|সৃজনশীল|সংক্ষিপ্ত|রচনাধর্মী|बहুविकल्पीय|सृजनात्मक|multiple)/i.test(line) && /প্রশ্ন|question|प्रश्न/i.test(line) && line.length < 80) {
      const bare = line.replace(/\s*[-–—:=]\s*$/, '').trim();
      const nm = bare.match(/\s*[\[(]([^\[\]()]{2,60})[\])]\s*$/);
      const title = nm ? bare.slice(0, nm.index).trim() : bare;
      const note = nm ? nm[1].trim() : '';
      cur = { title, note, questions: [] };
      sections.push(cur);
      q = null;
      continue;
    }
    // প্রশ্ন: "১." / "12)" / "৩ঃ" / "১ ক" (ফাঁকা) / "প্রশ্ন ১:" / "১-" — নম্বর-শনাক্তে en,
    // কিন্তু বিষয়বস্তু মূল লাইন থেকে (toEnglishDigits ১:১ দৈর্ঘ্য-সমান রূপান্তর)
    const qm = en.match(/^(?:প্রশ্ন(?:হ)?\s*|प्रश्न\s*|q(?:uestion)?\.?\s*)?(\d{1,3})(?:\s*[.)।ঃ:\-–—]+\s*|\s+)(.+)$/i);
    if (qm) {
      const num = parseInt(qm[1], 10);
      // চলমান প্রশ্নের ভেতরে "৩৬ মিটার…" জাতীয় লাইন নতুন প্রশ্ন নয় —
      // ঠিক পরের ধারাবাহিক সংখ্যা (বা নতুন বিভাগের ১) হলেই কেবল নতুন প্রশ্ন
      if (!q || num === qNo + 1 || num === 1) {
        if (!cur) { cur = { title: '', note: '', questions: [] }; sections.push(cur); }
        qNo++;
        const rest = line.slice(qm[0].length - qm[2].length);
        const { text, marks } = splitTrailingMarks(rest);
        // বছর-ট্যাগ — "…ব্যাখ্যা কর। [DU '19]" → tag আলাদা
        const yt = extractYearTagFromText(text);
        q = {
          number: banglaNums ? toBanglaNumber(qNo) : String(qNo),
          text: yt.text,
          marks,
          options: [],
          subs: [],
          importance: stars >= 2 ? 2 : stars === 1 ? 1 : undefined,
          ...(yt.tag ? { yearTag: yt.tag } : {}),
        };
        cur.questions.push(q);
        continue;
      }
    }
    // MCQ অপশন: "ক)" / "a." / "ক।" / "क)" (শুধু প্রশ্নের ভেতরে) —
    // এক লাইনে একাধিক অপশনও ("ক) ঢাকা খ) চট্রগ্রাম …") ভেঙে নেয়
    const om = line.match(/^([কখগঘঙa-dA-Dकखगघ])\s*[.):।ঃ-]\s*(.+)$/);
    if (om && q) {
      const inline = splitInlineOptions(line);
      if (inline && inline.length >= 2) q.options.push(...inline);
      else q.options.push({ label: om[1], text: om[2].trim() });
      continue;
    }
    // উপ-প্রশ্ন: "(ক)" / "(i)" / "i." / "(क)"
    const sm = line.match(/^\(?\s*([কখগঘঞकखगघ]|i{1,3}v?|v|vi{1,3}|ix|x)\s*[).):।ঃ\u0964]\s*(.+)$/i);
    if (sm && q) {
      const { text, marks } = splitTrailingMarks(sm[2]);
      q.subs.push({ text, marks });
      continue;
    }
    // ধারাবাহিকতা / প্রস্তাবনা
    if (q) {
      const { text, marks } = splitTrailingMarks(line);
      q.text = `${q.text} ${text}`.trim();
      if (marks && !q.marks) q.marks = marks;
      // ধারাবাহিক লাইনের শেষেও বছর-ট্যাগ আসতে পারে
      const yt = extractYearTagFromText(q.text);
      if (yt.tag) { q.text = yt.text; q.yearTag = yt.tag; }
    } else {
      preamble.push(line);
    }
  }

  const valid = sections.filter((s) => s.questions.length > 0);

  // শেষ-ভরসা: কোনো প্রশ্ন-চিহ্নই না মেললে প্রতিটি অর্থবহ লাইনই প্রশ্ন —
  // ফরম্যাটিং কখনো "ব্যর্থ" হয় না, শিক্ষক অন্তত সাজানো খসড়া পান
  if (valid.length === 0) {
    const cand = preamble.filter((l) => l.length >= 4);
    if (cand.length > 0) {
      const sec: QpSection = { title: '', note: '', questions: [] };
      for (const l of cand) {
        // শেষ-ভরসায়ও তারকা-গুরুত্ব ধরা হয় — সাজেশন-শিট অফলাইনেও শুদ্ধ
        let ln = l;
        let st = 0;
        const stm = ln.match(/^(?:[\u2605\u2606\u2726\u2736\u2738]\s*){1,3}/);
        if (stm) {
          st = (stm[0].match(/[\u2605\u2606\u2726\u2736\u2738]/g) ?? []).length;
          ln = ln.slice(stm[0].length).trim();
        }
        const { text, marks } = splitTrailingMarks(ln);
        if (!text) continue;
        qNo++;
        sec.questions.push({
          number: banglaNums ? toBanglaNumber(qNo) : String(qNo),
          text,
          marks,
          options: [],
          subs: [],
          importance: st >= 2 ? 2 : st === 1 ? 1 : undefined,
        });
      }
      if (sec.questions.length > 0) {
        sections.push(sec);
        valid.push(sec);
      }
    }
    if (valid.length === 0) return null;
  }

  // প্রশ্নের ধরন শনাক্ত — বাংলাদেশ-প্রথার ধরনগুলো (MCQ/সৃজনশীল/মিলকরণ/সত্য-মিথ্যা/শূন্যস্থান)
  // অফলাইনেও চেনা যায়, ফলে AI ছাড়া সাজালেও সঠিক রেন্ডারিং মেলে
  for (const sec of valid) {
    const secCreative = /সৃজনশীল|सृजनात्मक|creative/i.test(sec.title);
    for (const q of sec.questions) {
      q.kind = secCreative && q.subs.length > 0 ? 'creative' : qpDetectKind(q.text, q.options, q.subs);
      if (q.kind === 'match') {
        // অফলাইন-শনাক্ত মিলকরণ: স্তম্ভ-জিনিস অপশন/উপ-প্রশ্নের লেখায় থাকে — সেগুলোই জোড়া
        const items = q.options.length > 0
          ? q.options.map((o) => (o.label ? `${o.label}. ${o.text}` : o.text))
          : q.subs.map((s) => s.text);
        q.pairs = coerceQpPairs(items);
      }
    }
  }

  // বিভাগ-নোটে "প্রতিটি ২ নম্বর" জাতীয় উল্লেখ থাকলে সেই মান সে বিভাগের যেসব
  // প্রশ্নে নম্বর-মান নেই সবগুলোতে বসে (উৎসেই লেখা — নতুন করে বানানো নয়)
  // ইংরেজি নিয়ম উল্টো: "3 marks each" — সংখ্যা আগে
  const noteMarksRe = new RegExp(
    '(?:\u09aa\u09cd\u09b0\u09a4\u09bf\u099f\u09bf|\u09aa\u09cd\u09b0\u09a4\u09cd\u09af\u09c7\u0995|\u09aa\u09cd\u09b0\u09a4\u09bf|\u092a\u094d\u0930\u0924\u094d\u092f\u0947\u0915)\\s*([\\u09e6-\\u09ef\\u0966-\\u096f0-9]+)\\s*(?:\u099f\u09bf\\s*)?(?:\u09a8\u09ae\u09cd\u09ac\u09b0|\u09a8\u0982|\u0985\u0982\u0995|\u09ae\u09be\u09b0\u09cd\u0995\u09b8|\u09ae\u09be\u09b0\u09cd\u0995|\u0905\u0902\u0915|marks?)',
    'i',
  );
  const noteMarksReEn = /([\u09e6-\u09ef\u0966-\u096f0-9]+)\s*(?:marks?|\u092e\u093e\u0930\u094d\u0915\u094d\u0938)\s+each/i;
  for (const sec of valid) {
    const nm = sec.note.match(noteMarksRe) ?? sec.note.match(noteMarksReEn);
    if (!nm) continue;
    const markVal = nm[1];
    for (const q of sec.questions) if (!q.marks) q.marks = markVal;
  }

  // বিভাগ-নোটে "গুরুত্বপূর্ণ/অতি গুরুত্বপূর্ণ" থাকলে গোটা বিভাগের প্রশ্নে সেই গুরুত্ব —
  // শিক্ষকেরা সাজেশন-শিটে অধ্যায়ের শেষে [গুরুত্বপূর্ণ] লেখেন; উৎসেই লেখা, বানানো নয়
  for (const sec of valid) {
    const imp: QpImportance | undefined = /\u0985\u09a4\u09bf\s*\u0997\u09c1\u09b0\u09c1\u09a4\u09cd\u09ac\u09aa\u09c2\u09b0\u09cd\u09a3|very\s+important|most\s+important/i.test(sec.note)
      ? 2
      : /\u0997\u09c1\u09b0\u09c1\u09a4\u09cd\u09ac\u09aa\u09c2\u09b0\u09cd\u09a3|\u099c\u09b0\u09c1\u09b0\u09bf|important/i.test(sec.note)
        ? 1
        : undefined;
    if (!imp) continue;
    for (const q of sec.questions) if (!q.importance) q.importance = imp;
  }

  // প্রথম প্রশ্নের আগের লাইনগুলো নির্দেশনা হিসেবে ধরা হয় (প্রায়ই হয়) —
  // সময়/পূর্ণমান-জাতীয় হেডার-লাইন cleanQpInstructions ছেঁটে ফেলে
  const instructions = cleanQpInstructions(preamble);

  return {
    meta: { ...meta, instructions: meta.instructions.length > 0 ? meta.instructions : instructions },
    sections: valid,
    format,
  };
}

// ─── HTML বিল্ডার (সন্নিবেশ + ডাউনলোড + প্রিভিউ একই উৎস) ───

interface QpLabels {
  cls: string; subject: string; date: string; time: string; marks: string;
  instructions: string; nameRoll: string; end: string;
  markWord: string; trueFalse: string;
  /** বোর্ড-প্রথার হেডার */
  code: string; set: string; specialNote: string; mcqExam: string; warn: string;
  /** সাজেশন-শিট */
  sugTitle: string; teacher: string; signature: string;
  star1: string; star2: string; finalNoteDefault: string;
}

function qpLabels(lang: Lang): QpLabels {
  if (lang === 'hi') {
    return {
      cls: 'कक्षा', subject: 'विषय', date: 'दिनांक', time: 'समय', marks: 'पूर्णांक',
      instructions: 'निर्देश', nameRoll: 'छात्र का नाम: ____________________  रोल नं.: ________',
      end: 'समाप्त', markWord: 'अंक', trueFalse: 'सत्य / असत्य',
      code: 'विषय कोड', set: 'सेट', specialNote: 'विशेष सूचना',
      mcqExam: 'बहुविकल्पीय परीक्षण', warn: 'प्रश्नपत्र पर कोई भी निशान न बनाएँ।',
      sugTitle: 'सजेशन', teacher: 'शिक्षक', signature: 'शिक्षक के हस्ताक्षर',
      star1: 'महत्वपूर्ण', star2: 'अति महत्वपूर्ण',
      finalNoteDefault: 'परीक्षा से पहले \u2605\u2605 चिह्नित प्रश्न अवश्य हल करें।',
    };
  }
  if (lang === 'en') {
    return {
      cls: 'Class', subject: 'Subject', date: 'Date', time: 'Time', marks: 'Full Marks',
      instructions: 'Instructions', nameRoll: 'Student Name: ____________________  Roll No.: ________',
      end: 'End', markWord: 'marks', trueFalse: 'True / False',
      code: 'Subject Code', set: 'Set', specialNote: 'Special Instructions',
      mcqExam: 'Multiple Choice Examination', warn: 'Do not make any mark on the question paper.',
      sugTitle: 'Suggestion', teacher: 'Teacher', signature: "Teacher's signature",
      star1: 'Important', star2: 'Very important',
      finalNoteDefault: 'Practise the \u2605\u2605 marked questions before the exam.',
    };
  }
  return {
    cls: 'শ্রেণি', subject: 'বিষয়', date: 'তারিখ', time: 'সময়', marks: 'পূর্ণমান',
    instructions: 'নির্দেশনা', nameRoll: 'শিক্ষার্থীর নাম: ____________________  রোল নং: ________',
    end: 'শেষ', markWord: 'নম্বর', trueFalse: 'সত্য / মিথ্যা',
    code: 'বিষয় কোড', set: 'সেট', specialNote: 'বিশেষ দ্রষ্টব্য',
    mcqExam: 'বহুনির্বাচনি অভীক্ষা', warn: 'প্রশ্নপত্রে কোনো প্রকার দাগ/চিহ্ন করা যাবে না।',
    sugTitle: 'সাজেশন', teacher: 'শিক্ষক', signature: 'শিক্ষকের স্বাক্ষর',
    star1: 'গুরুত্বপূর্ণ', star2: 'অতি গুরুত্বপূর্ণ',
    finalNoteDefault: 'পরীক্ষার আগে \u2605\u2605 চিহ্নিত প্রশ্নগুলো অবশ্যই অনুশীলন করবে।',
  };
}

// ─── আসল-প্রশ্নপত্র হেডার-উপাদান (borderless/বক্স টেবিল — স্কিমা-সাপোর্টেড) ───

/**
 * বর্ডার-ছাড়া সেল — সময়/পূর্ণমান split-line ও নম্বর-কলামের মূল উপাদান।
 * ★ data-border="none" অবশ্যই: এডিটরে TipTap সেলের সাধারণ style অ্যাট্রিবিউট ফেলে দেয়,
 *   কিন্তু data-border পার্স করে (TableCellWithBg) — এই অ্যাট্রিবিউট ছাড়া এডিটরে
 *   বর্ডারহীন সেলগুলো পূর্ণ বর্ডার + ভারী প্যাডিং পেয়ে "খারাপ দেখা" হত।
 * ★ colwidth অ্যাট্রিবিউট: এডিটরে স্তম্ভ-প্রস্থ ধরে রাখে (colwidth="44" → ৪৪px স্তম্ভ)।
 */
function qpTdFree(content: string, extra = '', colwidth?: number): string {
  const cw = colwidth != null ? ` colwidth="${colwidth}"` : '';
  return `<td${cw}${extra ? ` ${extra}` : ''} data-border="none" style="border:none;padding:1px 2px">${content}</td>`;
}

/** সময় ↔ পূর্ণমান split-line — বাঁযে সময়, ডানে পূর্ণমান (৪টি আসল পত্রেই এই প্রথা) */
function qpSplitLineHtml(m: QpMeta, L: QpLabels): string | null {
  const left = m.time ? `${L.time}: ${m.time}` : '';
  const right = m.fullMarks ? `${L.marks}: ${m.fullMarks}` : '';
  if (!left && !right) return null;
  return `<table style="margin:4px 0 2px"><colgroup><col /><col /></colgroup><tbody><tr>`
    + `${qpTdFree(`<p style="text-align:left;margin:2px 0"><strong>${escapeQpHtml(left)}</strong></p>`)}`
    + `${qpTdFree(`<p style="text-align:right;margin:2px 0"><strong>${escapeQpHtml(right)}</strong></p>`)}`
    + `</tr></tbody></table>`;
}

/** বিষয় কোড-ডিজিট-বক্স + সেট-বক্স — বোর্ড-পত্রের সই-চেনা কোণা; স্তম্ভ-প্রস্থ স্পষ্ট (কমপ্যাক্ট বাক্স) */
function qpCodeBoxHtml(m: QpMeta, L: QpLabels): string | null {
  const digits = (m.subjectCode || '').replace(/\s+/g, '').slice(0, 4);
  const set = (m.setCode || '').trim().slice(0, 3);
  if (!digits && !set) return null;
  const widths: Array<number | null> = [110, ...[...digits].map(() => 26)];
  if (set) widths.push(40);
  const rows: string[] = [];
  if (digits) {
    const digitCells = [...digits]
      .map((d) => `<td colwidth="26" style="text-align:center;padding:2px 8px"><p style="margin:2px 0;text-align:center"><strong>${escapeQpHtml(d)}</strong></p></td>`)
      .join('');
    rows.push(`<tr>${qpTdFree(`<p style="margin:2px 0"><strong>${escapeQpHtml(L.code)}</strong> :</p>`, '', 110)}${digitCells}</tr>`);
  }
  if (set) {
    rows.push(
      `<tr>${qpTdFree(`<p style="margin:2px 0"><strong>${escapeQpHtml(L.set)}</strong> :</p>`, '', 110)}`
      + `<td colwidth="40" style="text-align:center;padding:2px 10px"><p style="margin:2px 0;text-align:center"><strong>${escapeQpHtml(set)}</strong></p></td></tr>`,
    );
  }
  // table-layout:auto — কাঁচা-HTML প্রিভিউ/প্রিন্টেও বাক্সটা কমপ্যাক্ট থাকে (পুরো প্রস্থ নেয় না)
  return `<table style="width:auto;min-width:38%;table-layout:auto"><colgroup>${widths.map((w) => (w != null ? `<col style="width:${w}px" />` : '<col />')).join('')}</colgroup><tbody>${rows.join('')}</tbody></table>`;
}

/** নির্দেশনা-বক্স — শ্রেণি-পত্রের নির্দেশনা ও বোর্ড-MCQ-র "বিশেষ দ্রষ্টব্য" একই রূপে */
function qpInstructionBoxHtml(instructions: string[], title: string, lang: Lang, hSize: string): string | null {
  if (instructions.length === 0) return null;
  const num = (i: number) => (lang === 'hi' ? toDevanagariNumber(i + 1) : lang === 'en' ? String(i + 1) : toBanglaNumber(i + 1));
  const lines = instructions
    .map((ins, i) => `<p style="margin:3px 0"><strong>${num(i)}.</strong> ${escapeQpHtml(ins)}</p>`)
    .join('');
  return `<table style="margin:6px 0"><colgroup><col /></colgroup><tbody><tr><td>`
    + `<p style="margin:3px 0;text-align:center"><span style="font-size:${hSize}"><strong><u>${escapeQpHtml(title)}</u></strong></span></p>`
    + `${lines}</td></tr></tbody></table>`;
}

/** প্রশ্নপত্রের প্রশ্ন-সারি — ডান-নম্বর-কলাম প্রথায় এক টেবিলে: মূল-প্রশ্ন + উপ-প্রশ্ন, মান ডান প্রান্তে।
 * colgroup + colwidth স্পষ্ট — নইলে প্রিভিউ (`table-layout: fixed`) ও এডিটর (ProseMirror
 * সমান-ভাগ) দুটোতেই লেখা অর্ধেক স্তম্ভে চাপা পড়ে মাঝখানে বিশাল ফাঁক থেকে যেত। */
function qpMarksRowTable(rows: Array<{ body: string; marks: string; indent?: boolean }>, marksW: number): string | null {
  const trs = rows
    .map(({ body, marks, indent }) => {
      const pad = indent ? ';padding-left:1.8em' : '';
      return `<tr>${qpTdFree(`<p style="margin:2px 0${pad}">${body}</p>`)}`
        + `<td colwidth="${marksW}" style="border:none;padding:1px 2px;width:${marksW}px;vertical-align:top" data-border="none"><p style="margin:2px 0;text-align:right"><strong>${escapeQpHtml(marks)}</strong></p></td></tr>`;
    })
    .join('');
  return `<table style="margin:5px 0 3px">${qpColgroup([null, marksW])}<tbody>${trs}</tbody></table>`;
}

/** প্রশ্ন-নম্বরের ধরন — ১। (দণ্ড — আসল-পত্র প্রথা) / ১. / (১) / ১) */
function qpNumHtml(num: string, style: QpNumStyle): string {
  const n = escapeQpHtml(num);
  if (!n) return '';
  if (style === 'danda') return `${n}।`;
  if (style === 'paren') return `(${n})`;
  if (style === 'dash') return `${n})`;
  return `${n}.`;
}

/** নম্বর-মানের ধরন — ডান-কলাম (টেবিল-সারিতে, '' ফেরত) / [২] / (২) / ২ নম্বর */
function qpMarksHtml(marks: string, style: QpMarksStyle, word: string): string {
  const m = escapeQpHtml(marks);
  if (!m || style === 'right') return '';
  if (style === 'paren') return ` <strong>(${m})</strong>`;
  if (style === 'word') return ` <strong>${m} ${escapeQpHtml(word)}</strong>`;
  return ` <strong>[${m}]</strong>`;
}

/** ডান-কলাম নম্বর-মানের জন্য কাঁচা মান (টেবিল-সারির সেলে বসে) */
function qpMarksRaw(marks: string, style: QpMarksStyle, word: string): string {
  if (!marks) return '';
  if (style === 'word') return `${escapeQpHtml(marks)} ${escapeQpHtml(word)}`;
  return escapeQpHtml(marks);
}

/** উপ-প্রশ্ন — শুরুর (ক)/(i)-লেবেল গাঢ় — সৃজনশীল-ধাঁচ পরিষ্কার বোঝা যায়।
 * blockquote-এর বদলে padding-left প্যারা: এডিটরে generic blockquote-স্টাইল (বাঁ-রেখা + ইটালিক)
 * প্রয়োগ হত — প্রিভিউ/প্রিন্টের সাথে অমিল + সম্পাদনায় বিরক্তিকর। indentLeft (padding-left)
 * TipTap-এ AdvancedTypography global attribute — সব জায়গায় হুবহু এক দেখায়। */
function qpSubHtml(sub: QpSubQ, sty: string): string {
  const sm = sub.marks ? ` [${escapeQpHtml(sub.marks)}]` : '';
  const body = mathRichToHtml(sub.text);
  const lm = body.match(/^((?:\([^)<]{1,8}\))|(?:[কখগঘঙiIvVxX]{1,4}[).):।]))\s*([\s\S]*)$/);
  const inner = lm && lm[2] ? `<strong>${lm[1]}</strong> ${lm[2]}${sm}` : `${body}${sm}`;
  const styleAttr = sty
    ? sty.replace('style="', 'style="padding-left:1.5em;')
    : ' style="padding-left:1.5em"';
  return `<p${styleAttr}>${inner}</p>`;
}

/** MCQ-অপশনের সাজ — এক লাইনে / ২×২ গ্রিড (আসল-পত্র প্রথা) / তালিকায় — লেবেল (ক)-বন্ধনীতে */
function qpOptionsHtml(q: QpQuestion, layout: QpLayout, sty: string): string {
  if (q.options.length === 0) return '';
  const one = (o: QpOption) => (o.label
    ? `<strong>(${escapeQpHtml(o.label)})</strong> ${mathRichToHtml(o.text)}`
    : mathRichToHtml(o.text));
  if (layout.mcqLayout === 'list') {
    return `<ul${sty}>${q.options.map((o) => `<li>${one(o)}</li>`).join('')}</ul>`;
  }
  if (layout.mcqLayout === 'grid') {
    const rows: string[] = [];
    for (let i = 0; i < q.options.length; i += 2) {
      rows.push(`<p${sty}>${q.options.slice(i, i + 2).map(one).join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`);
    }
    return rows.join('');
  }
  return `<p${sty}>${q.options.map(one).join('&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`;
}

/** মিলকরণ-প্রশ্নের স্তম্ভ-টেবিল — বাঁ/ডান দুই স্তম্ভ (সমান প্রস্থ — স্পষ্ট colgroup), জিরোক্স-বান্ধব সীমারেখা */
function qpMatchHtml(q: QpQuestion): string | null {
  if (!q.pairs || q.pairs.length === 0) return null;
  const rows = q.pairs.map((p) => `<tr><td>${mathRichToHtml(p.left)}</td><td>${mathRichToHtml(p.right)}</td></tr>`);
  return `<table><colgroup><col /><col /></colgroup><tbody>${rows.join('')}</tbody></table>`;
}

/** চিত্র-স্লট — [চিত্র: …] মার্কার → এডিটর-স্কিমা-নিরাপদ এককোষ টেবিল-বক্স; পরে শিক্ষক স্কেচ/ভেক্টর-ছবি বসান */
function qpFigureSlotHtml(desc: string, lang: Lang): string {
  const label = desc.trim();
  const caption = label
    || (lang === 'en' ? 'Draw the figure here' : lang === 'hi' ? 'यहाँ चित्र बनाएँ' : 'এখানে চিত্রটি আঁকো');
  return `<table style="margin:8px auto;width:78%"><colgroup><col /></colgroup><tbody><tr><td style="text-align:center;padding:14px 12px"><p style="margin:0;text-align:center;color:#555"><em>\u25A1 ${escapeQpHtml(caption)}</em></p></td></tr></tbody></table>`;
}

/** উত্তরের জায়গা — ডট-লাইন শ্রেণি-পরীক্ষার খাতা-ধাঁচে (কলামে সংক্ষিপ্ত হয়) */
function qpAnswerSpaceHtml(space: QpAnswerSpace, colCount: number): string {
  if (space === 'none') return '';
  const lines = space === 'sm' ? 2 : space === 'md' ? 4 : 6;
  const line = '_'.repeat(colCount > 1 ? 24 : 48);
  return Array.from({ length: lines }, () => `<p>${line}</p>`).join('');
}

/**
 * বিভাগের কলাম-সংখ্যা — 'auto' হলে বাংলাদেশ-প্রথা অনুযায়ী: MCQ/নৈর্ব্যক্তিক/সত্য-মিথ্যা
 * /শূন্যস্থান-বিভাগে ২ কলাম, সৃজনশীল/রচনাধর্মী বিভাগে ১ কলাম।
 */
export function qpSectionColumns(sec: QpSection, layout: QpLayout): 1 | 2 | 3 {
  if (layout.columns !== 'auto') return (Number(layout.columns) || 1) as 1 | 2 | 3;
  const colFriendly = (q: QpQuestion) => {
    const k = q.kind ?? (q.options.length > 0 ? 'mcq' : 'short');
    return (k === 'mcq' || k === 'tf' || k === 'blank') && q.subs.length === 0 && !(q.pairs && q.pairs.length > 0);
  };
  return sec.questions.length > 1 && sec.questions.every(colFriendly) ? 2 : 1;
}

/** হেডার-তথ্য লাইন: "শ্রেণি: ষষ্ঠ · বিষয়: গণিত · সময়: … · পূর্ণমান: ৭০" */
export function qpInfoLine(meta: QpMeta, lang: Lang, sep = '   ·   '): string {
  const L = qpLabels(lang);
  const items: string[] = [];
  if (meta.classLabel) items.push(`${L.cls}: ${meta.classLabel}`);
  if (meta.subject) items.push(`${L.subject}: ${meta.subject}`);
  if (meta.date) items.push(`${L.date}: ${meta.date}`);
  if (meta.time) items.push(`${L.time}: ${meta.time}`);
  if (meta.fullMarks) items.push(`${L.marks}: ${meta.fullMarks}`);
  return items.join(sep);
}

/**
 * প্রশ্নপত্র → এডিটরে সন্নিবেশযোগ্য HTML — আসল-প্রশ্নপত্র প্রথা অনুযায়ী:
 *  - স্কুল (classic): কেন্দ্রীয় হেডার → সময়↔পূর্ণমান split-line → নির্দেশনা-বক্স
 *  - বোর্ড MCQ (modern): বহুনির্বাচনি অভীক্ষা → বিষয়-কোড ডিজিট-বক্স + সেট → বিশেষ দ্রষ্টব্য
 *  - বোর্ড সৃজনশীল (board): কেন্দ্রীয় শিরোনাম → কোড-বক্স → সিলেবাস-নোট
 *  - দণ্ড-নম্বর "১।", (ক)-অপশন, ডান-নম্বর-কলাম, ২ কলাম MCQ — আসল পত্রের মতোই
 * শুধুমাত্র স্কিমা-সাপোর্টেড মার্কআপ: p/strong/em/u/hr/ul/li/blockquote/h3/table
 * (borderless সেল data-border="none" — সময়/পূর্ণমান split-line ও নম্বর-কলামে)
 * প্রিভিউও একই HTML দেখায় — তাই যা দেখা যায়, ঠিক তাই বসে।
 */
export function paperToEditorHtml(p: QuestionPaper, lang: Lang, figures?: readonly (QpFigureFill | null)[]): string {
  const f = resolveQpFormat(p);
  const layout = normalizeQpLayout(p.layout);
  const m = p.meta;
  // চিত্র-পূর্ণক পরিকল্পনা — স্লট-ক্রমে (বিভাগ→প্রশ্ন→প্রশ্নের ভেতরে ক্রম) সারিবদ্ধ;
  // null = ম্যানুয়াল খালি-বক্স স্লটই থাকবে
  const figPlan = figures && figures.length > 0 ? figures : null;
  let figCursor = 0;
  // স্তর — স্পষ্ট না থাকলে university-ফরম্যাট থেকে অনুমিত; স্তর অনুযায়ী লেবেল (কোর্স কোড/বর্ষ)
  const level: QpLevel = p.level ?? (f === 'university' ? 'university' : 'school');
  const uni = level === 'university';
  const L = (() => {
    const base = qpLabels(lang);
    if (!uni) return base;
    if (lang === 'hi') return { ...base, code: 'कोर्स कोड', subject: 'कोर्स शीर्षक', cls: 'वर्ष/सेमेस्टर' };
    if (lang === 'en') return { ...base, code: 'Course Code', subject: 'Course Title', cls: 'Year/Semester' };
    return { ...base, code: 'কোর্স কোড', subject: 'কোর্স টাইটেল', cls: 'বর্ষ/সেমিস্টার' };
  })();
  const compact = f === 'compact' || f === 'twocol' || f === 'sugslip' || f === 'quiz';
  const board = f === 'board';
  const modern = f === 'modern';
  const royal = f === 'royal';
  const twocol = f === 'twocol';
  const university = f === 'university';
  // সাজেশন-স্লিপ — কোচিং-সেন্টারের চেনা অল্প-জায়গার সাজেশন-পর্চা (২-স্তম্ভ, চাপা হেডার, ★-প্রধান)
  const sugslip = f === 'sugslip';
  // কুইজ/টেস্ট-স্লিপ — নিত্যদিনের টেস্ট-পর্চা (নাম-রোল ঘর, স্কোর-বাক্স, ২-স্তম্ভ MCQ)
  const quiz = f === 'quiz';
  const adj = p.fontScale === 'sm' ? -2 : p.fontScale === 'lg' ? 2 : 0;
  const subAdj = p.fontScale === 'sm' ? -1 : p.fontScale === 'lg' ? 1 : 0;
  const hN = (compact ? 16 : royal ? 20 : 18) + adj;
  const subN = (compact ? 11 : 12) + subAdj;
  const hSize = `${hN}pt`;
  const subSize = `${subN}pt`;
  const secSize = `${board || modern ? subN + 1 : subN}pt`;
  const bodySize = p.fontScale === 'sm'
    ? (twocol ? '9.5pt' : '10.5pt')
    : p.fontScale === 'lg'
      ? (twocol ? '11.5pt' : '13pt')
      : twocol ? '10.5pt' : '';
  const sty = (extra = '') => {
    const all = [extra, bodySize ? `font-size:${bodySize}` : ''].filter(Boolean).join(';');
    return all ? ` style="${all}"` : '';
  };
  const center = sty('text-align:center');
  const parts: string[] = [];

  // হেডার-সহায়ক — কেন্দ্রীয় বড়/মাঝারি শিরোনাম (সব প্রথার মিল)
  const bigLine = (txt: string) => `<p${center}><span style="font-size:${hSize}"><strong>${escapeQpHtml(txt)}</strong></span></p>`;
  const midLine = (txt: string, em = false) => `<p${center}><span style="font-size:${subSize}"><strong>${em ? '<em>' : ''}${escapeQpHtml(txt)}${em ? '</em>' : ''}</strong></span></p>`;

  // ── হেডার ──
  const sug = p.docType === 'suggestion';
  if (sugslip) {
    // সাজেশন-স্লিপ হেডার — কোচিং-সেন্টারের চেনা চাপা পর্চা: প্রতিষ্ঠান → "সাজেশন — বিষয় (শ্রেণি)"
    // → এক-লাইনের পাতলা তথ্য-স্ট্রিপ (তারিখ থাকলেই) — জায়গা বাঁচাতে আর কিছুই নয়
    if (m.schoolName) parts.push(bigLine(m.schoolName));
    const slipTitle = m.subject
      ? (m.classLabel ? `${L.sugTitle} — ${m.subject} (${m.classLabel})` : `${L.sugTitle} — ${m.subject}`)
      : L.sugTitle;
    parts.push(`<p${center}><span style="font-size:${hSize}"><strong>${escapeQpHtml(slipTitle)}</strong></span></p>`);
    const strip: string[] = [];
    if (m.date) strip.push(m.date);
    if (m.teacherName?.trim()) strip.push(`${L.teacher}: ${m.teacherName.trim()}`);
    if (strip.length > 0) parts.push(`<p${center}><span style="font-size:${subSize}">${escapeQpHtml(strip.join('   ·   '))}</span></p>`);
    parts.push(`<hr style="margin:4px 0 8px">`);
  } else if (quiz) {
    // টেস্ট-স্লিপ হেডার — বাঁয়ে প্রতিষ্ঠান+বিষয়, ডানে টেস্ট/পূর্ণমান; নিচে নাম-রোল-তারিখ ঘর।
    // সাজেশন-ধরনে বাঁয়ের শিরোনাম সাজেশন-টাইটেল — প্রেক্ষাপট সঠিক থাকে
    const leftBits: string[] = [];
    if (m.schoolName) leftBits.push(escapeQpHtml(m.schoolName));
    if (sug) {
      leftBits.push(`<strong>${escapeQpHtml(m.subject ? `${L.sugTitle} — ${m.subject}` : L.sugTitle)}</strong>`);
    } else if (m.subject) {
      leftBits.push(`<strong>${escapeQpHtml(m.subject)}</strong>`);
    }
    const rightBits: string[] = [];
    if (m.examTitle) rightBits.push(escapeQpHtml(m.examTitle));
    if (m.fullMarks) rightBits.push(`${L.marks}: ${escapeQpHtml(m.fullMarks)}`);
    if (m.time) rightBits.push(`${L.time}: ${escapeQpHtml(m.time)}`);
    const headRow = `<table style="margin:0 0 2px"><colgroup><col /><col /></colgroup><tbody><tr>`
      + `${qpTdFree(`<p style="margin:1px 0;text-align:left">${leftBits.map((b) => `<span style="font-size:${subSize}">${b}</span>`).join('<br>')}</p>`)}`
      + `${qpTdFree(`<p style="margin:1px 0;text-align:right">${rightBits.map((b) => `<span style="font-size:${subSize}">${b}</span>`).join('<br>')}</p>`)}`
      + `</tr></tbody></table>`;
    parts.push(headRow);
    // নাম-রোল-তারিখ ঘর — টেস্ট-পর্চার সই-চেনা এক-লাইন ফিল-ইন
    if (m.studentLine) {
      parts.push(`<p${sty()}>${escapeQpHtml(L.nameRoll)}   ${escapeQpHtml(L.date)}: ________</p>`);
    }
    const insBox = qpInstructionBoxHtml(m.instructions, L.instructions, lang, subSize);
    if (insBox) parts.push(insBox);
    parts.push(`<hr style="margin:4px 0 8px">`);
  } else if (sug) {
    // সাজেশন-হেডার — প্রতিষ্ঠান → "সাজেশন — বিষয় (শ্রেণি)" → পরীক্ষা → তথ্য-লাইন → শিক্ষক
    if (m.schoolName) parts.push(bigLine(m.schoolName));
    const sugTitleLine = m.subject
      ? (m.classLabel ? `${L.sugTitle} — ${m.subject} (${m.classLabel})` : `${L.sugTitle} — ${m.subject}`)
      : L.sugTitle;
    parts.push(bigLine(sugTitleLine));
    // সাজেশন-শিটে পরীক্ষার নাম প্রযোজ্য নয় (শিক্ষকের অনুরোধ — সাজেশনে এক্সাম-লাইন চায় না);
    // পরীক্ষার নাম শুধু প্রশ্নপত্র-ফরম্যাটেই দেখানো হয়
    const sugInfo: string[] = [];
    if (m.date) sugInfo.push(`${L.date}: ${m.date}`);
    if (m.time) sugInfo.push(`${L.time}: ${m.time}`);
    if (m.fullMarks) sugInfo.push(`${L.marks}: ${m.fullMarks}`);
    if (sugInfo.length > 0) parts.push(`<p${center}>${escapeQpHtml(sugInfo.join('   |   '))}</p>`);
    if (m.teacherName?.trim()) {
      parts.push(`<p${center}><span style="font-size:${subSize}"><em>${escapeQpHtml(L.teacher)}: ${escapeQpHtml(m.teacherName.trim())}</em></span></p>`);
    }
    parts.push('<hr>');
  } else if (royal) {
    // অলংকৃত-রাজকীয় হেডার — প্রিমিয়াম প্রতিষ্ঠান-পত্র: ❦ অলংকার + অক্ষর-ফাঁকযুক্ত বড় শিরোনাম →
    // পরীক্ষা → শ্রেণি·বিষয় → সময়↔পূর্ণমান → নাম-রোল → নির্দেশনা-বক্স (শেডযুক্ত)
    const orn = '<span style="font-size:' + subSize + '">\u2766</span>';
    const royalTitle = m.schoolName || m.examTitle;
    if (royalTitle) {
      parts.push(`<p${center}><span style="font-size:${hSize};letter-spacing:2px"><strong>${orn} ${escapeQpHtml(royalTitle)} ${orn}</strong></span></p>`);
    }
    if (m.schoolName && m.examTitle) parts.push(midLine(m.examTitle, true));
    const clsSub: string[] = [];
    if (m.classLabel) clsSub.push(`${L.cls}: ${m.classLabel}`);
    if (m.subject) clsSub.push(`${L.subject}: ${m.subject}`);
    if (m.date) clsSub.push(`${L.date}: ${m.date}`);
    if (clsSub.length > 0) parts.push(`<p${center}>${escapeQpHtml(clsSub.join('   ·   '))}</p>`);
    const split = qpSplitLineHtml(m, L);
    if (split) parts.push(split);
    if (m.studentLine) parts.push(`<p${sty()}>${escapeQpHtml(L.nameRoll)}</p>`);
    const insBox = qpInstructionBoxHtml(m.instructions, L.instructions, lang, subSize);
    if (insBox) parts.push(insBox.replace('<table style="margin:6px 0">', '<table style="margin:6px 0;background-color:#f3f4f6">'));
    parts.push('<hr>');
  } else if (twocol) {
    // পত্রিকা-স্তম্ভ হেডার — চাপা ও টাইট: প্রতিষ্ঠান → পরীক্ষা → বিষয়(শ্রেণি) → তথ্য-লাইন → hr
    if (m.schoolName) parts.push(bigLine(m.schoolName));
    if (m.examTitle) parts.push(midLine(m.examTitle, true));
    const headBits: string[] = [];
    if (m.subject) headBits.push(m.classLabel ? `${m.subject} (${m.classLabel})` : m.subject);
    if (m.date) headBits.push(`${L.date}: ${m.date}`);
    if (m.time) headBits.push(`${L.time}: ${m.time}`);
    if (m.fullMarks) headBits.push(`${L.marks}: ${m.fullMarks}`);
    if (headBits.length > 0) parts.push(`<p${center}>${escapeQpHtml(headBits.join('   ·   '))}</p>`);
    parts.push('<hr>');
  } else if (university) {
    // বিশ্ববিদ্যালয়-প্রথা হেডার — প্রতিষ্ঠান (বড়) → বিভাগ → প্রোগ্রাম·সেশন → পরীক্ষা →
    // কোর্স-লাইন (কোড+টাইটেল+বর্ষ) → সময়↔পূর্ণমান → তারিখ → সিলেবাস → নির্দেশনা-বক্স
    if (m.schoolName) parts.push(bigLine(m.schoolName));
    if (m.department?.trim()) parts.push(midLine(m.department.trim()));
    const progBits: string[] = [];
    if (m.program?.trim()) progBits.push(m.program.trim());
    if (m.session?.trim()) progBits.push(m.session.trim());
    if (progBits.length > 0) parts.push(`<p${center}>${escapeQpHtml(progBits.join('   ·   '))}</p>`);
    if (m.examTitle) parts.push(midLine(m.examTitle, true));
    const courseBits: string[] = [];
    if (m.subjectCode) courseBits.push(`${L.code}: ${m.subjectCode}`);
    if (m.subject) courseBits.push(`${L.subject}: ${m.subject}`);
    if (m.classLabel) courseBits.push(m.classLabel);
    if (courseBits.length > 0) parts.push(`<p${center}><strong>${escapeQpHtml(courseBits.join('   ·   '))}</strong></p>`);
    const split = qpSplitLineHtml(m, L);
    if (split) parts.push(split);
    if (m.date) parts.push(`<p${center}><em>${escapeQpHtml(`${L.date}: ${m.date}`)}</em></p>`);
    if (m.syllabusNote) parts.push(`<p${center}><em>[${escapeQpHtml(m.syllabusNote)}]</em></p>`);
    const insBox = qpInstructionBoxHtml(m.instructions, L.instructions, lang, subSize);
    if (insBox) parts.push(insBox);
    parts.push('<hr>');
  } else if (modern) {
    // বোর্ড-MCQ হেডার (ঢাকা-বোর্ড প্রথা): শিরোনাম → বিষয় → "বহুনির্বাচনি অভীক্ষা"
    // → কোড-বক্স (বিষয় কোড ডিজিট + সেট) → সময়↔পূর্ণমান → সিলেবাস → বিশেষ দ্রষ্টব্য
    if (m.schoolName) parts.push(bigLine(m.schoolName));
    if (m.examTitle) parts.push(bigLine(m.examTitle));
    if (m.subject) parts.push(midLine(m.subject));
    parts.push(`<p${center}><span style="font-size:${subSize}"><strong>${escapeQpHtml(L.mcqExam)}</strong></span></p>`);
    const codeBox = qpCodeBoxHtml(m, L);
    if (codeBox) parts.push(codeBox);
    const split = qpSplitLineHtml(m, L);
    if (split) parts.push(split);
    if (m.syllabusNote) parts.push(`<p${center}><em>[${escapeQpHtml(m.syllabusNote)}]</em></p>`);
    const insBox = qpInstructionBoxHtml(m.instructions, L.specialNote, lang, subSize);
    if (insBox) parts.push(insBox);
    parts.push(`<p${center}><em>${escapeQpHtml(L.warn)}</em></p>`);
    parts.push('<hr>');
  } else if (board) {
    // বোর্ড-সৃজনশীল হেডার: শিরোনাম → বিষয় → কোড-বক্স → সময়↔পূর্ণমান → সিলেবাস-নোট
    if (m.examTitle) parts.push(bigLine(m.examTitle));
    else if (m.schoolName) parts.push(bigLine(m.schoolName));
    if (m.subject) parts.push(midLine(m.subject));
    const codeBox = qpCodeBoxHtml(m, L);
    if (codeBox) parts.push(codeBox);
    const split = qpSplitLineHtml(m, L);
    if (split) parts.push(split);
    if (m.syllabusNote) parts.push(`<p${center}><em>[${escapeQpHtml(m.syllabusNote)}]</em></p>`);
    const insBox = qpInstructionBoxHtml(m.instructions, L.instructions, lang, subSize);
    if (insBox) parts.push(insBox);
    parts.push('<hr>');
  } else {
    // স্কুল-প্রথা হেডার: স্কুল → পরীক্ষা → শ্রেণি·বিষয় → সময়↔পূর্ণমান → নাম-রোল → নির্দেশনা-বক্স
    if (m.schoolName) parts.push(bigLine(m.schoolName));
    if (m.examTitle) parts.push(midLine(m.examTitle, true));
    const clsSub: string[] = [];
    if (m.classLabel) clsSub.push(`${L.cls}: ${m.classLabel}`);
    if (m.subject) clsSub.push(`${L.subject}: ${m.subject}`);
    if (m.date) clsSub.push(`${L.date}: ${m.date}`);
    if (clsSub.length > 0) parts.push(`<p${center}>${escapeQpHtml(clsSub.join('   ·   '))}</p>`);
    const split = qpSplitLineHtml(m, L);
    if (split) parts.push(split);
    if (m.studentLine) parts.push(`<p${sty()}>${escapeQpHtml(L.nameRoll)}</p>`);
    const insBox = qpInstructionBoxHtml(m.instructions, L.instructions, lang, subSize);
    if (insBox) parts.push(insBox);
    parts.push('<hr>');
  }

  // ── সাজেশন ★-কিংবদন্তি ──
  const hasStars = p.sections.some((s) => s.questions.some((q) => q.importance));
  if (sug && hasStars) {
    parts.push(`<p${center}><em><strong>\u2605</strong> ${escapeQpHtml(L.star1)} &nbsp;\u00b7&nbsp; <strong>\u2605\u2605</strong> ${escapeQpHtml(L.star2)}</em></p>`);
  }

  // ── বিভাগ ও প্রশ্ন (উন্নত লেআউট-সচেতন) ──
  // twocol/sugslip/quiz — লুপ-শেষে পুরো বডি একটাই ২-স্তম্ভ ব্লকে মোড়া হয় (পত্রিকা-ধাঁচ)
  const slipWrap = sugslip || quiz;
  const bodyStart = parts.length;
  let firstSection = true;
  for (const sec of p.sections) {
    if (sec.title) {
      if ((board || modern) && !firstSection) parts.push('<hr>');
      const t = escapeQpHtml(sec.title);
      if (royal) {
        // অলংকৃত — শেডযুক্ত কেন্দ্রীয় বিভাগ-ব্যান্ড (shading attr — এডিটর-সমর্থিত)
        parts.push(`<p${sty('text-align:center;background-color:#eef1f5;margin:8px 0 4px')}><span style="font-size:${secSize};letter-spacing:1px"><strong>\u2766 ${t} \u2766</strong></span></p>`);
      } else if (university) {
        parts.push(`<p${sty('text-align:left')}><span style="font-size:${secSize}"><strong><u>${t}</u></strong></span></p>`);
      } else if (layout.sectionStyle === 'box') {
        // বাক্সে বিভাগ-শিরোনাম — স্কিমা-সাপোর্টেড এককোষ টেবিল
        parts.push(`<table><colgroup><col /></colgroup><tbody><tr><td><p${sty('text-align:center')}><span style="font-size:${secSize}"><strong>${t}</strong></span></p></td></tr></tbody></table>`);
      } else if (layout.sectionStyle === 'left') {
        parts.push(`<p${sty('text-align:left')}><span style="font-size:${secSize}"><strong><u>${t}</u></strong></span></p>`);
      } else {
        parts.push(`<p${center}><span style="font-size:${secSize}"><strong>${t}</strong></span></p>`);
      }
    }
    firstSection = false;
    if (sec.note) parts.push(`<p${center}><em>${escapeQpHtml(sec.note)}</em></p>`);

    const colCount = twocol || slipWrap ? 2 : qpSectionColumns(sec, layout);
    // ডান-নম্বর-কলাম — শুধু এক-কলাম বিভাগে; মাল্টি-কলাম MCQ-তে inline [২]-ই বাস্তবসম্মত
    const marksRight = layout.marksStyle === 'right' && colCount === 1;
    const blocks = sec.questions.map((q) => {
      const num = qpNumHtml(q.number, layout.numStyle);
      const marksInline = qpMarksHtml(q.marks, layout.marksStyle, L.markWord);
      const starTxt = q.importance === 2 ? '\u2605\u2605 ' : q.importance === 1 ? '\u2605 ' : '';
      // চিত্র-স্লট — লেখা থেকে [চিত্র: …] মার্কার আলাদা করে বক্স-আকারে বসে;
      // পরিকল্পনায় চিত্র থাকলে সরাসরি doc-figure নোডে বসে (সঙ্গে সঙ্গে প্রিন্ট-রেডি)
      const figs: string[] = [];
      const bodyText = q.text.replace(QP_FIGURE_RE, (_mm, d: string) => {
        figs.push((d ?? '').trim());
        return ' ';
      }).replace(/\s{2,}/g, ' ').trim();
      // বিশ্ববিদ্যালয়-সাজেশনের বছর-ট্যাগ — প্রশ্নের শেষে ধূসর [DU '19]
      const yearTxt = q.yearTag ? `<span style="color:#555">[${escapeQpHtml(q.yearTag)}]</span>` : '';
      const stem = `<strong>${starTxt}${num}</strong> ${mathRichToHtml(bodyText)}${yearTxt ? ` ${yearTxt}` : ''}`;
      // সত্য-মিথ্যা — উত্তর-স্থিরক লেখা না থাকলে যোগ হয়
      const tfNote = q.kind === 'tf' && !/সত্য|মিথ্যা|सत्य|असत्य|true|false/i.test(q.text)
        ? `<em>(${escapeQpHtml(L.trueFalse)})</em>` : '';
      const matchTable = qpMatchHtml(q);
      const opts = qpOptionsHtml(q, layout, sty());
      const space = qpAnswerSpaceHtml(layout.answerSpace, colCount);
      // চিত্র-স্লট রেন্ডার — পরিকল্পনা মিললে প্রকৃত চিত্র (doc-figure), নইলে খালি বক্স
      const figBoxes = figs.map((d) => {
        const fill = figPlan && figCursor < figPlan.length ? figPlan[figCursor] : null;
        figCursor++;
        return fill ? figureHtmlFor(fill) : qpFigureSlotHtml(d, lang);
      }).join('');

      // ডান-নম্বর-কলাম (আসল-পত্র প্রথা): মূল-প্রশ্ন + উপ-প্রশ্ন এক টেবিলে, মান ডান প্রান্তে
      // চিত্র-স্লট থাকলে সাধারণ ধারায় — বক্সটা পূর্ণ-প্রস্থ নেয়
      if (marksRight && (q.marks || q.subs.some((s) => s.marks)) && !matchTable && figs.length === 0) {
        const rows: Array<{ body: string; marks: string; indent?: boolean }> = [{
          body: `${stem}${tfNote ? ` ${tfNote}` : ''}`,
          marks: qpMarksRaw(q.marks, layout.marksStyle, L.markWord),
        }];
        for (const sub of q.subs) {
          const sm = sub.marks ? ` [${escapeQpHtml(sub.marks)}]` : '';
          const body = mathRichToHtml(sub.text);
          const lm = body.match(/^((?:\([^)<]{1,8}\))|(?:[কখগঘঙiIvVxX]{1,4}[).):।]))\s*([\s\S]*)$/);
          const inner = lm && lm[2] ? `<strong>${lm[1]}</strong> ${lm[2]}` : body;
          rows.push({ body: `${inner}${sm}`, marks: qpMarksRaw(sub.marks, layout.marksStyle, L.markWord), indent: true });
        }
        const after: string[] = [];
        if (opts) after.push(opts);
        if (space) after.push(space);
        return qpMarksRowTable(rows, 44) + after.join('');
      }

      // সাধারণ ধারা — inline মান
      const bits: string[] = [];
      bits.push(`<p${sty()}><strong>${starTxt}${num}</strong> ${mathRichToHtml(bodyText)}${yearTxt ? ` ${yearTxt}` : ''}${marksInline}${tfNote ? ` ${tfNote}` : ''}</p>`);
      if (figBoxes) bits.push(figBoxes);
      if (matchTable) bits.push(matchTable);
      for (const sub of q.subs) bits.push(qpSubHtml(sub, sty()));
      if (opts) bits.push(opts);
      if (space) bits.push(space);
      return bits.join('');
    });

    if (colCount > 1 && !twocol && !slipWrap) {
      // বাংলাদেশ-প্রথার ২/৩ কলাম — এডিটরের নিজস্ব doc-columns নোড (সম্পূর্ণ পাইপলাইন-সমর্থিত)
      // কলামের মাঝে রেখা — বোর্ড-স্টাইল MCQ-পত্রের চেনা ভাব
      // ইনলাইন column-count স্টাইল অপরিহার্য — এডিটরে TipTap renderHTML স্টাইল বসায়,
      // কিন্তু ডায়ালগ-প্রিভিউ ও স্বয়ংসম্পূর্ণ প্রিন্ট-ফাইলে কাঁচা HTML-ই দেখায়
      // (twocol বাদ — ওর নিজস্ব এক-বডি র‍্যাপার আছে; নইলে columns-এর ভেতরে columns নেস্ট হয়)
      parts.push(
        `<div class="doc-columns" data-count="${colCount}" data-gap="26" data-rule="1" data-rule-style="solid" style="${columnsStyleText({ count: colCount, gap: 26, rule: true, fill: 'balance' })}">${blocks.join('')}</div>`,
      );
    } else {
      parts.push(...blocks);
    }
  }

  // twocol/sugslip/quiz — পুরো বডি একটাই ২-স্তম্ভ পত্রিকা-ব্লকে (শিরোনাম ভাগ জুড়ে, বিভাগগুলো স্তম্ভে স্রোয়);
  // স্লিপ-দুটোতে ফাঁক আরো চাপা ও মাঝের রেখা নেই — কোচিং-পর্চার অল্প-জায়গা-প্রথা
  if (twocol || slipWrap) {
    const bodyHtml = parts.splice(bodyStart).join('');
    const slipGap = sugslip ? 14 : 20;
    parts.push(
      `<div class="doc-columns" data-count="2" data-gap="${slipGap}" data-rule="${slipWrap ? 0 : 1}" data-rule-style="solid" style="${columnsStyleText({ count: 2, gap: slipGap, rule: !slipWrap, fill: 'balance' })}">${bodyHtml}</div>`,
    );
  }

  if (sug) {
    const note = (p.finalNote ?? '').trim() || (hasStars ? L.finalNoteDefault : '');
    if (note) parts.push(`<p${center}><strong>\u2605</strong> <em>${escapeQpHtml(note)}</em></p>`);
    parts.push(`<p style="text-align:right"><em>${escapeQpHtml(L.signature)}: ____________________</em></p>`);
  } else if (quiz) {
    // টেস্ট-স্লিপের স্কোর-বক্স — ডান-কোণে ছোট ঘর (শিক্ষক লিখে দেন)
    const scoreLabel = lang === 'en' ? 'Score' : lang === 'hi' ? 'प्राप्तांक' : 'প্রাপ্ত নম্বর';
    parts.push(
      `<table style="width:auto;min-width:32%;margin:10px 0 4px;margin-left:auto"><colgroup><col /><col style="width:64px" /></colgroup><tbody>`
      + `<tr>${qpTdFree(`<p style="margin:2px 0;text-align:right"><strong>${escapeQpHtml(scoreLabel)}</strong></p>`)}`
      + `<td style="padding:2px 8px"><p style="margin:2px 0">&nbsp;</p></td></tr></tbody></table>`,
    );
  } else if (sugslip) {
    // স্লিপ-ফুটার — শুধু স্বাক্ষর-লাইন (জায়গা-সাশ্রয়ী)
    parts.push(`<p style="text-align:right"><em>${escapeQpHtml(L.signature)}: ____________________</em></p>`);
  } else {
    parts.push(`<p${center}>— ${escapeQpHtml(L.end)} —</p>`);
  }
  return parts.join('');
}

/**
 * স্বয়ংসম্পূর্ণ প্রিন্ট-রেডি HTML ফাইল (ডাউনলোড) — শিক্ষকের বাছা পাতার মাপে @page,
 * বাংলা ওয়েব-ফন্ট, বোর্ড-স্টাইলে ডাবল-রুল পাতার ফ্রেম, মাল্টি-কলাম সমর্থনসহ,
 * প্রিন্ট বাটনসহ। শিক্ষক ব্রাউজারে খুলেই সরাসরি প্রিন্ট/সেভ-করতে পারে।
 */
export function paperToStandaloneHtml(p: QuestionPaper, lang: Lang, figures?: readonly (QpFigureFill | null)[]): string {
  const body = paperToEditorHtml(p, lang, figures);
  // বোর্ড-প্রথা (MCQ ও সৃজনশীল) — আসল পত্রের মতো পাতার ফ্রেম;
  // বিশ্ববিদ্যালয় — আনুষ্ঠানিক এক-রেখা ফ্রেম; অলংকৃত — ডাবল-রুল অলংকৃত ফ্রেম
  const resolvedF = resolveQpFormat(p);
  const board = resolvedF === 'board' || resolvedF === 'modern' || resolvedF === 'university';
  const royal = resolvedF === 'royal';
  const frameBorder = royal ? '4px double #111' : '1.7px solid #111';
  const layout = normalizeQpLayout(p.layout);
  const size = QP_PAGE_SIZES[layout.pageSize] ?? QP_PAGE_SIZES.a4;
  const scale = p.fontScale === 'sm' ? '11pt' : p.fontScale === 'lg' ? '13.5pt' : '12pt';
  const title = [p.meta.schoolName, p.meta.examTitle, p.meta.subject].filter(Boolean).join(' — ')
    || (p.docType === 'suggestion' ? 'Suggestion Sheet' : 'Question Paper');
  const fontLink =
    lang === 'hi'
      ? 'https://fonts.googleapis.com/css2?family=Noto+Serif+Devanagari:wght@400;600;700&display=swap'
      : 'https://fonts.googleapis.com/css2?family=Tiro+Bangla&family=Noto+Serif+Bengali:wght@400;600;700&display=swap';
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeQpHtml(title)}</title>
<link rel="stylesheet" href="${fontLink}">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #6b7280; font-family: ${lang === 'hi' ? "'Noto Serif Devanagari'" : "'Tiro Bangla','Noto Serif Bengali'"}, serif; }
  ${board ? `.qp-frame { max-width: ${size.wMm}mm; margin: 24px auto 40px; background: #fff; border: ${frameBorder}; padding: 4mm; box-shadow: 0 8px 30px rgba(0,0,0,.35); }` : ''}
  .qp-page { max-width: ${size.wMm}mm; margin: 24px auto; background: #fff; padding: 18mm 16mm; box-shadow: 0 8px 30px rgba(0,0,0,.35); font-size: ${scale}; line-height: 1.6; color: #111; }
  ${board ? '.qp-frame .qp-page { margin: 0 auto; max-width: none; box-shadow: none; padding: 12mm 10mm; border: 1px solid #111; }' : ''}
  .qp-page hr { border: none; border-top: 1.6px solid #111; margin: 10px 0 12px; }
  .qp-page blockquote { margin: 2px 0 2px 26px; padding: 0; border: none; }
  .qp-page ul { margin: 6px 0; padding-left: 24px; }
  .qp-page p { margin: 7px 0; }
  .qp-page table { border-collapse: collapse; width: 100%; table-layout: fixed; margin: 10px 0 12px; }
  .qp-page td { border: 1.3px solid #111; padding: 6px 12px; vertical-align: top; }
  .qp-page td p { margin: 3px 0; }
  /* মাল্টি-কলাম বিভাগ — ইনলাইন column-count স্টাইলেই চলে; ভাঙন-রোধ ও মার্জিন-শুদ্ধি */
  .doc-columns > *:first-child { margin-top: 0; }
  .doc-columns > *:last-child { margin-bottom: 0; }
  .doc-columns > p { orphans: 2; widows: 2; break-inside: avoid; }
  .doc-columns > ul { orphans: 2; widows: 2; }
  /* চিত্র-স্লটে বসা ভেক্টর/স্কেচ-চিত্র — কেন্দ্রে, প্রশ্নের লেখা থেকে আলাদা নিঃশ্বাসে */
  .qp-page figure.doc-figure { margin: 10px auto; text-align: center; }
  .qp-page figure.doc-figure img { max-width: 100%; height: auto; }
  .qp-page figure.doc-figure figcaption { font-size: 0.82em; color: #333; margin-top: 2px; font-style: italic; }
  .qp-printbar { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; }
  .qp-printbar button { font: inherit; font-size: 14px; padding: 8px 16px; border-radius: 8px; border: none; background: #111; color: #fff; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
  @media print {
    body { background: #fff; }
    .qp-page, .qp-frame { margin: 0; box-shadow: none; max-width: none; }
    ${board ? '.qp-page { padding: 8mm 9mm; }' : '.qp-page { padding: 0; }'}
    .qp-printbar { display: none; }
  }
  @page { size: ${size.wMm}mm ${size.hMm}mm; margin: ${board ? '9mm' : '14mm 12mm'}; }
</style>
</head>
<body>
<div class="qp-printbar"><button onclick="window.print()">🖨 ${lang === 'bn' ? 'প্রিন্ট করুন' : lang === 'hi' ? 'प्रिंट करें' : 'Print'}</button></div>
${board ? '<div class="qp-frame">\n' : ''}<div class="qp-page">
${body}
</div>
${board ? '</div>\n' : ''}</body>
</html>`;
}

// ─── নমুনা (ডেমো/ফাস্ট-ট্রাই) ───

/** এক ক্লিকে চেষ্টা করার জন্য নমুনা কাঁচা-লেখা — শিক্ষক সাথে সাথে ফিচার বোঝেন */
export function qpSampleText(lang: Lang, docType: QpDocType = 'question', level: QpLevel = 'school'): string {
  if (level === 'university') {
    if (docType === 'suggestion') {
      if (lang === 'hi') {
        return `राष्ट्रीय विश्वविद्यालय — ऑनर्स २या वर्ष
व्यावसायिक अर्थशास्त्र सजेशन

अध्याय १ — माँग और पूर्ति [महत्वपूर्ण]
\u2605 १. माँग वक्र का ढाल ज्ञात करने का नियम लिखें। [DU 2019]
\u2605\u2605 २. स्थितिस्थापकता के प्रकार समझाएँ। [RU 2022]
३. बाज़ार संतुलन कैसे स्थापित होता है? [JU 2021]

अध्याय २ — उत्पादन और लागत [अति महत्वपूर्ण]
\u2605\u2605 ४. स्थिर और परिवर्ती लागत में अंतर लिखें। [NU 2020]
\u2605 ५. $TC = 100 + 5Q$ से $Q = 10$ पर औसत लागत निकालें। [CU 2018]`;
      }
      if (lang === 'en') {
        return `National University — Honours 2nd Year
Business Economics Suggestion

Chapter 1 — Demand & Supply [important]
\u2605 1. State the rule for finding the slope of a demand curve. [DU 2019]
\u2605\u2605 2. Explain the types of elasticity. [RU 2022]
3. How is market equilibrium established? [JU 2021]

Chapter 2 — Production & Cost [very important]
\u2605\u2605 4. Distinguish between fixed and variable cost. [NU 2020]
\u2605 5. From $TC = 100 + 5Q$, find the average cost at $Q = 10$. [CU 2018]`;
      }
      return `জাতীয় বিশ্ববিদ্যালয় — অনার্স ২য় বর্ষ
ব্যবসায় অর্থনীতি সাজেশন

অধ্যায় ১ — চাহিদা ও যোগান [গুরুত্বপূর্ণ]
\u2605 ১. চাহিদা রেখার ঢাল নির্ণয়ের নিয়ম লিখ। [ঢাবি ২০১৯]
\u2605\u2605 ২. স্থিতিস্থাপকতার প্রকারভেদ ব্যাখ্যা কর। [রুবি ২০২২]
৩. বাজার-ভারসাম্য কীভাবে স্থাপিত হয়? [জাবি ২০২১]

অধ্যায় ২ — উৎপাদন ও ব্যয় [অতি গুরুত্বপূর্ণ]
\u2605\u2605 ৪. স্থির ও পরিবর্তশীল ব্যয়ের পার্থক্য লিখ। [নবি ২০২০]
\u2605 ৫. $TC = 100 + 5Q$ হলে $Q = 10$ এর গড় ব্যয় নির্ণয় কর। [চবি ২০১৮]`;
    }
    if (lang === 'hi') {
      return `राष्ट्रीय विश्वविद्यालय
विभाग: प्रबंधन
ऑनर्स २या वर्ष समापनी परीक्षा — २०२४
कोर्स कोड: 232507 · कोर्स शीर्षक: व्यावसायिक अर्थशास्त्र

समय: 4 घंटे
पूर्णांक: 80

निम्नलिखित में से किन्हीं पाँच प्रश्नों के उत्तर दें।

१. (क) माँग की मूल्य-स्थितिस्थापकता किसे कहते हैं? (ख) इसका व्यावहारिक महत्व समझाएँ। [5+5=10]
२. (क) पूर्ण प्रतियोगिता की विशेषताएँ लिखें। (ख) अल्पकालीन संतुलन की शर्तें बताएँ। [5+5=10]
३. मुद्रास्फीति के कारण और प्रभाव की विवेचना करें। [10]
४. हल करें: $2x^2 - 5x - 3 = 0$ [10]`;
    }
    if (lang === 'en') {
      return `National University
Department of Management
Honours 2nd Year Final Examination — 2024
Course Code: 232507 · Course Title: Business Economics

Time: 4 Hours
Full Marks: 80

Answer any FIVE of the following questions.
The figures in the right margin indicate full marks.

1. (a) Define price elasticity of demand. (b) Explain its practical importance. [5+5=10]
2. (a) State the features of perfect competition. (b) Explain the short-run equilibrium conditions. [5+5=10]
3. Discuss the causes and effects of inflation. [10]
4. Solve: $2x^2 - 5x - 3 = 0$ [10]`;
    }
    return `জাতীয় বিশ্ববিদ্যালয়
বিভাগ: ব্যবস্থাপনা
অনার্স ২য় বর্ষ সমাপনী পরীক্ষা — ২০২৪
কোর্স কোড: ২৩২৫০৭ · কোর্স টাইটেল: ব্যবসায় অর্থনীতি

সময়: ৪ ঘণ্টা
পূর্ণমান: ৮০

যে-কোনো পাঁচটি প্রশ্নের উত্তর দাও।
ডান পার্শ্বের সংখ্যা প্রশ্নের পূর্ণমান নির্দেশ করে।

১. (ক) চাহিদার মূল্য-স্থিতিস্থাপকতা কাকে বলে? (খ) এর ব্যবহারিক গুরুত্ব ব্যাখ্যা কর। [৫+৫=১০]
২. (ক) পূর্ণ প্রতিযোগিতামূলক বাজারের বৈশিষ্ট্য লিখ। (খ) স্বল্পকালীন ভারসাম্যের শর্ত ব্যাখ্যা কর। [৫+৫=১০]
৩. মুদ্রাস্ফীতির কারণ ও প্রভাব আলোচনা কর। [১০]
৪. সমাধান কর: $2x^2 - 5x - 3 = 0$ [১০]`;
  }
  if (docType === 'suggestion') {
    if (lang === 'hi') {
      return `आदर्श कोचिंग सेंटर
कक्षा ६ गणित सजेशन
वार्षिक परीक्षा — २०२५

अध्याय १ — प्राकृत संख्या और भिन्न [महत्वपूर्ण]
\u2605 १. ४/७ और ३/५ का योगफल निकालें।
\u2605\u2605 २. ३६ और ४८ का ल.स. और म.स. निकालें।
३. २/३, ४/५ और ७/१० को आरोही क्रम में लिखें।

अध्याय २ — बीजगणित [अति महत्वपूर्ण]
\u2605\u2605 ४. सरल करें: $3x + 2(x - 5)$
\u2605 ५. गुणनखंड करें: $x^2 - 16$

बहुविकल्पीय प्रश्न [प्रत्येक १ अंक]
\u2605 ६. ०.२५ को भिन्न में व्यक्त करने पर होगा —
क) १/२ ख) १/४ ग) १/३ घ) १/५`;
    }
    if (lang === 'en') {
      return `Model Coaching Centre
Class 6 Mathematics Suggestion
Annual Examination — 2025

Chapter 1 — Natural Numbers & Fractions [important]
\u2605 1. Find the sum of 4/7 and 3/5.
\u2605\u2605 2. Find the LCM and HCF of 36 and 48.
3. Arrange 2/3, 4/5 and 7/10 in ascending order.

Chapter 2 — Algebra [very important]
\u2605\u2605 4. Simplify: $3x + 2(x - 5)$
\u2605 5. Factorise: $x^2 - 16$

Multiple Choice [1 mark each]
\u2605 6. 0.25 expressed as a fraction is —
a) 1/2 b) 1/4 c) 1/3 d) 1/5`;
    }
    return `আদর্শ কোচিং সেন্টার
ষষ্ঠ শ্রেণির গণিত সাজেশন
বার্ষিক পরীক্ষা — ২০২৫

অধ্যায় ১ — স্বাভাবিক সংখ্যা ও ভগ্নাংশ [গুরুত্বপূর্ণ]
\u2605 ১. ৪/৭ ও ৩/৫ এর যোগফল নির্ণয় কর।
\u2605\u2605 ২. ৩৬ ও ৪৮ এর ল.সা.গু ও গ.সা.গু নির্ণয় কর।
৩. ২/৩, ৪/৫ ও ৭/১০ ক্ষুদ্র থেকে বড় ক্রমে সাজাও।

অধ্যায় ২ — বীজগণিত [অতি গুরুত্বপূর্ণ]
\u2605\u2605 ৪. সরল কর: $3x + 2(x - 5)$
\u2605 ৫. উৎপাদকে বিশ্লেষণ কর: $x^2 - 16$

বহুনির্বাচনি প্রশ্ন [প্রতিটির মান ১]
\u2605 ৬. ০.২৫ কে ভগ্নাংশে প্রকাশ করলে হবে —
ক) ১/২ খ) ১/৪ গ) ১/৩ ঘ) ১/৫`;
  }
  if (lang === 'hi') {
    return `वार्षिक परीक्षा — गणित
कक्षा ६

खण्ड – क [प्रत्येक १ अंक]
१. बांग्लादेश की राजधानी कौन-सी है? [१]
क) चटगाँव ख) ढाका ग) खुलना घ) राजशाही
२. $15 \\times 4$ कितना होगा? [१]
क) ६० ख) ५५ ग) १९ घ) ४

खण्ड – ख [प्रत्येक २ अंक]
३. $\\frac{3}{4}$ और $\\frac{5}{6}$ का योगफल निकालें। [२]
४. $x^2 - 9$ के गुणनखंड लिखें। [२]
५. सरल करें: $\\sqrt{144} + \\sqrt{25}$ [२]

खण्ड – ग [प्रत्येक ५ अंक]
६. एक आयत की लंबाई उसकी चौड़ाई से ३ सेमी अधिक है। यदि परिमाप ३६ सेमी हो, तो आयत की भुजाएँ निकालें। [५]
७. $2x + 5 = 17$ समीकरण हल करें और $x$ का मान जाँचें। [५]`;
  }
  if (lang === 'en') {
    return `Annual Examination — Mathematics
Class 6

Section A [1 mark each]
1. What is the capital of Bangladesh? [1]
a) Chattogram b) Dhaka c) Khulna d) Rajshahi
2. What is $15 \\times 4$? [1]
a) 60 b) 55 c) 19 d) 4

Section B [2 marks each]
3. Find the sum of $\\frac{3}{4}$ and $\\frac{5}{6}$. [2]
4. Factorise: $x^2 - 9$ [2]
5. Simplify: $\\sqrt{144} + \\sqrt{25}$ [2]

Section C [5 marks each]
6. The length of a rectangle is 3 cm more than its width. If the perimeter is 36 cm, find the sides. [5]
7. Solve $2x + 5 = 17$ and verify the value of $x$. [5]`;
  }
  return `বার্ষিক পরীক্ষা — গণিত
ষষ্ঠ শ্রেণি
বিষয় কোড: ১২৬
সেট: ক

বিভাগ – ক [প্রত্যেকটির মান ১]
১. বাংলাদেশের রাজধানীর নাম কী? [১]
ক) চট্রগ্রাম খ) ঢাকা গ) খুলনা ঘ) রাজশাহী
২. $15 \\times 4$ কত? [১]
ক) ৬০ খ) ৫৫ গ) ১৯ ঘ) ৪

বিভাগ – খ [প্রতিটি ২ নম্বর]
৩. $\\frac{3}{4}$ এবং $\\frac{5}{6}$ এর যোগফল নির্ণয় কর। [২]
৪. উৎপাদকে বিশ্লেষণ কর: $x^2 - 9$ [২]
৫. সরল কর: $\\sqrt{144} + \\sqrt{25}$ [২]

বিভাগ – গ [প্রতিটি ৫ নম্বর]
৬. একটি আয়তাকার ঘরের দৈর্ঘ্য প্রস্থের চেয়ে ৩ মিটার বেশি। পরিসীমা ৩৬ মিটার হলে ঘরটির দৈর্ঘ্য ও প্রস্থ নির্ণয় কর। [৫]
৭. $2x + 5 = 17$ সমীকরণটি সমাধান কর এবং $x$ এর মান যাচাই কর। [৫]`;
}
