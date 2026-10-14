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

// ─── টাইপ ───

export type QpFormat = 'auto' | 'classic' | 'modern' | 'compact' | 'board';
export type QpResolvedFormat = 'classic' | 'modern' | 'compact' | 'board';
/** টাইপোগ্রাফি স্কেল — ছোট / মাঝারি / বড় */
export type QpFontScale = 'sm' | 'md' | 'lg';

// ─── উন্নত লেআউট-সিস্টেম (শিক্ষকের সাজানোর পূর্ণ নিয়ন্ত্রণ) ───

/** কলাম — স্বয়ংক্রিয় (MCQ-বিভাগে ২) বা নির্দিষ্ট ১/২/৩; বাংলাদেশে নৈর্ব্যক্তিকে ২-৩ কলাম প্রথা */
export type QpColumns = 'auto' | '1' | '2' | '3';
/** পাতার মাপ — A4 / Letter / Legal / A5 (শ্রেণি-পরীক্ষা) */
export type QpPageSize = 'a4' | 'letter' | 'legal' | 'a5';
/** প্রশ্ন-নম্বরের ধরন — ১. / (১) / ১) */
export type QpNumStyle = 'dot' | 'paren' | 'dash';
/** নম্বর-মানের ধরন — [২] / (২) / ২ নম্বর */
export type QpMarksStyle = 'bracket' | 'paren' | 'word';
/** বিভাগ-শিরোনামের ধরন — মাঝে / বাক্সে / বাঁয়ে-রেখাযুক্ত */
export type QpSectionStyle = 'center' | 'box' | 'left';
/** MCQ-অপশনের সাজ — এক লাইনে / ২ সারিতে / তালিকায় */
export type QpMcqLayout = 'inline' | 'grid' | 'list';
/** উত্তরের জায়গা — প্রশ্নের নিচে ডট-লাইন (শ্রেণি-পরীক্ষার খাতা-ধাঁচ) */
export type QpAnswerSpace = 'none' | 'sm' | 'md' | 'lg';
/** প্রশ্নের ধরন — সংক্ষিপ্ত / MCQ / সৃজনশীল / মিলকরণ / সত্য-মিথ্যা / শূন্যস্থান */
export type QpQKind = 'short' | 'mcq' | 'creative' | 'match' | 'tf' | 'blank';

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
  numStyle: 'dot',
  marksStyle: 'bracket',
  sectionStyle: 'center',
  mcqLayout: 'inline',
  answerSpace: 'none',
};

const QP_LAYOUT_ALLOWED = {
  columns: ['auto', '1', '2', '3'],
  pageSize: ['a4', 'letter', 'legal', 'a5'],
  numStyle: ['dot', 'paren', 'dash'],
  marksStyle: ['bracket', 'paren', 'word'],
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
  /** শিক্ষার্থীর নাম/রোল ঘর থাকবে কি না */
  studentLine: boolean;
}

export interface QuestionPaper {
  meta: QpMeta;
  sections: QpSection[];
  format: QpFormat;
  /** লেখার আকার — স্ম/মধ্য/বড় (অনুপস্থিত = মাঝারি) */
  fontScale?: QpFontScale;
  /** উন্নত লেআউট — অনুপস্থিত হলে ডিফল্ট */
  layout?: QpLayout;
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
    studentLine: true,
  };
}

// ─── কাঁচা-লেখার হেডার পড়ে ফর্ম পূরণ (preamble meta) ───

/** ভাষা-অনুযায়ী ডিফল্ট মান — শিক্ষক নিজে বদলাননি (ডিফল্টই আছে) এমন ঘর চিনতে */
function defaultQpValues(lang: Lang): { time: string; fullMarks: string; examTitle: string } {
  const d = defaultQpMeta(lang);
  return { time: d.time, fullMarks: d.fullMarks, examTitle: d.examTitle };
}

const QP_KEY_PATTERNS: Array<{ field: 'subject' | 'classLabel' | 'date' | 'time' | 'fullMarks'; re: RegExp }> = [
  { field: 'subject', re: /^(?:বিষয়|subject|विषय)\s*[:：\-–—=]/i },
  { field: 'classLabel', re: /^(?:শ্রেণ[িী]|class|कक्षा)\s*[:：\-–—=]/i },
  { field: 'date', re: /^(?:তারিখ|date|दिनांक)\s*[:：\-–—=]/i },
  { field: 'time', re: /^(?:সময়|समय|time)\s*[:：\-–—=]/i },
  { field: 'fullMarks', re: /^(?:পূর্ণমান|পূর্ণ\s*মান|ফুল\s*মার্কস|সর্বমোট\s*নম্বর|পুরো\s*নম্বর|full\s*marks?|पूर्णांक)\s*[:：\-–—=]/i },
];

const QP_SCHOOL_WORD = /(?:বিদ্যালয়|বিদ্যাপীঠ|স্কুল|মাদ্রাসা|কলেজ|academy|school|college|vidyalaya|विद्यालय|स्कूल|महाविद्यालय)/i;
const QP_EXAM_WORD = /(?:বার্ষিক|অর্ধবার্ষিক|নির্বাচনী|সাময়িক|বোর্ড|সাপ্তাহিক|মাসিক|পরীক্ষা|টেস্ট|annual|half.?yearly|terminal|exam|test|परीक्षा)/i;

/** "পূর্ণমান ৭০" জাতীয় কোলন-ছাড়া রূপও ধরে */
const QP_MARKS_BARE = /^(?:পূর্ণমান|পূর্ণ\s*মান|ফুল\s*মার্কস|পুরো\s*নম্বর|पूर्णांक)\s+([\u09e6-\u09ef\u0966-\u096f0-9]{1,4})\s*$/i;

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
    // এক লাইনে একাধিক কী-মান থাকতে পারে — কমা/পাইপে ভেঙে প্রতিটি খণ্ড আলাদা চিনি
    const segments = line.split(/\s*[,|;·]\s*/).map((s) => s.trim()).filter(Boolean);

    for (const seg of segments) {
      let matched = false;
      for (const kp of QP_KEY_PATTERNS) {
        if (kp.re.test(seg)) {
          const val = afterKeyValue(seg);
          if (val) {
            if (kp.field === 'time') put('time', val, def.time);
            else if (kp.field === 'fullMarks') put('fullMarks', val, def.fullMarks);
            else if (kp.field === 'subject') put('subject', val);
            else if (kp.field === 'classLabel') put('classLabel', val);
            else if (kp.field === 'date') put('date', val);
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
      QP_KEY_PATTERNS.some((kp) => kp.re.test(s)) ||
      /^(?:সময়|पूर्णांक|date|दिनांक)\s*[:：]/i.test(s) ||
      QP_MARKS_BARE.test(s) ||
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
- MATH in LaTeX inside $...$ : fractions $\\frac{5}{8}$, powers $x^2$, roots $\\sqrt{25}$, equations $2x + 3 = 7$. Use ASCII digits inside math.

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
- INSTRUCTIONS MUST BE DIRECTIVES ONLY: "উত্তর পরিষ্কার হস্তাক্ষরে লিখতে হবে", "সব প্রশ্নের উত্তর দিতে হবে" style. NEVER put time/marks/date/subject/school lines into instructions — those are HEADER data, not directives.
- FIDELITY: keep EVERY question from the source. NEVER invent, drop or merge questions. Light grammar/spacing polish only.
- NUMBERING: clean sequential numbering within each section; keep the source's numbers when they are already sequential.
- MARKS: attach marks only when the source states them; never invent marks.
- SECTION MARKS: if a section note states every question's marks (e.g. "প্রতিটি ২ নম্বর", "2 marks each", "प्रत्येक २ अंक"), set that value as marks on EACH question of that section — it is stated in the source, not invented. Keep the note as well.
- SECTIONS: only split by the source's own section markers (বিভাগ/খণ্ড/Section); if none, one section with title "".
- MATH: expressions remain in $...$ LaTeX ($\frac{3}{4}$, $x^2$, $\sqrt{50}$) with ASCII digits inside math.
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

  // ভগ্নাংশ \frac{a}{b} → (a⁄b) — এক লেভেল গভীরতা, ৩ পাসে নেস্টিং সামলায়
  for (let i = 0; i < 3; i++) {
    s = s.replace(/\\(?:dfrac|tfrac|frac)\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1\u2044$2)');
  }
  // বর্গমূল
  s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, '\u221A($1)');
  s = s.replace(/\\sqrt\s*([0-9A-Za-z])/g, '\u221A$1');
  // সূচক / নিচসূচক
  s = s.replace(/\^\{([^{}]*)\}/g, '<sup>$1</sup>');
  s = s.replace(/\^([0-9A-Za-z+\-])/g, '<sup>$1</sup>');
  s = s.replace(/_\{([^{}]*)\}/g, '<sub>$1</sub>');
  s = s.replace(/_([0-9A-Za-z])/g, '<sub>$1</sub>');
  // গ্রিক ও চিহ্ন
  s = s
    .replace(/\\times/g, '\u00D7').replace(/\\div/g, '\u00F7')
    .replace(/\\pm/g, '\u00B1').replace(/\\mp/g, '\u2213')
    .replace(/\\leq?/g, '\u2264').replace(/\\geq?/g, '\u2265')
    .replace(/\\neq?/g, '\u2260').replace(/\\approx/g, '\u2248')
    .replace(/\\cdot/g, '\u00B7').replace(/\\pi\b/g, '\u03C0')
    .replace(/\\alpha/g, '\u03B1').replace(/\\beta/g, '\u03B2')
    .replace(/\\theta/g, '\u03B8').replace(/\\degree/g, '\u00B0')
    .replace(/\\(?:rightarrow|to\b)/g, '\u2192')
    .replace(/\\infty/g, '\u221E').replace(/\\sum/g, '\u03A3')
    .replace(/\\angle/g, '\u2220').replace(/\\triangle/g, '\u25B3')
    .replace(/\\perp/g, '\u22A5').replace(/\\parallel/g, '\u2225')
    .replace(/\\%/g, '%').replace(/\\circ/g, '\u00B0')
    .replace(/\\therefore/g, '\u2234').replace(/\\because/g, '\u2235');
  // \left( \right) → সাধারণ বন্ধনী
  s = s.replace(/\\left\s*([\u0028\u005B\u007B])/g, '$1').replace(/\\right\s*([\u0029\u005D\u007D])/g, '$1');
  // \text{…} → বিষয়বস্তু
  s = s.replace(/\\text\s*\{([^{}]*)\}/g, '$1');
  // স্পেসিং কমান্ড
  s = s.replace(/\\[,;!]/g, ' ');
  // অজানা কমান্ড বাদ, অবশিষ্ট ব্রেস বাদ
  s = s.replace(/\\[a-zA-Z]+/g, '').replace(/[{}]/g, '');
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
      questions.push({
        number: firstStr(q, ['number', 'no', 'num', 'qno', 'serial']),
        text,
        marks: firstStr(q, ['marks', 'mark', 'value', 'points', 'nombor']),
        options,
        subs,
        kind,
        pairs,
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
      instructions: aiInstructions.length > 0 ? aiInstructions : meta.instructions,
    },
    sections: valid,
    format,
  };
}

// ─── ফরম্যাট নির্ধারণ ───

export function resolveQpFormat(p: QuestionPaper): QpResolvedFormat {
  if (p.format !== 'auto') return p.format;
  const total = p.sections.reduce((n, s) => n + s.questions.length, 0);
  const hasSubs = p.sections.some((s) => s.questions.some((q) => q.subs.length > 0));
  const mcq = p.sections.some((s) => s.questions.some((q) => q.options.length > 0));
  if (total <= 6 && !hasSubs && !mcq) return 'compact';
  return mcq ? 'modern' : 'classic';
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
    const line = rawLine.replace(/\s+$/, '').trim();
    if (!line) continue;
    const en = toEnglishDigits(line);

    // বিভাগ/অংশ/खण्ड হেডার — শেষের [প্রতিটি ২ নম্বর] জাতীয় অংশ নোটে চলে যায়
    // দ্রষ্টব্য: JS-এর \b ASCII-শব্দ-সীমা — বাংলা অক্ষরের পরে কাজ করে না, তাই নেগেটিভ লুকঅ্যাহেড
    if (/^(?:বিভাগ|খণ্ড|অংশ(?!ী|গ্র)|खण्ड|खंड|भाग|section|part)/i.test(line) && line.length < 80) {
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
        q = {
          number: banglaNums ? toBanglaNumber(qNo) : String(qNo),
          text,
          marks,
          options: [],
          subs: [],
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
        const { text, marks } = splitTrailingMarks(l);
        if (!text) continue;
        qNo++;
        sec.questions.push({
          number: banglaNums ? toBanglaNumber(qNo) : String(qNo),
          text,
          marks,
          options: [],
          subs: [],
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
}

function qpLabels(lang: Lang): QpLabels {
  if (lang === 'hi') {
    return {
      cls: 'कक्षा', subject: 'विषय', date: 'दिनांक', time: 'समय', marks: 'पूर्णांक',
      instructions: 'निर्देश', nameRoll: 'छात्र का नाम: ____________________  रोल नं.: ________',
      end: 'समाप्त', markWord: 'अंक', trueFalse: 'सत्य / असत्य',
    };
  }
  if (lang === 'en') {
    return {
      cls: 'Class', subject: 'Subject', date: 'Date', time: 'Time', marks: 'Full Marks',
      instructions: 'Instructions', nameRoll: 'Student Name: ____________________  Roll No.: ________',
      end: 'End', markWord: 'marks', trueFalse: 'True / False',
    };
  }
  return {
    cls: 'শ্রেণি', subject: 'বিষয়', date: 'তারিখ', time: 'সময়', marks: 'পূর্ণমান',
    instructions: 'নির্দেশনা', nameRoll: 'শিক্ষার্থীর নাম: ____________________  রোল নং: ________',
    end: 'শেষ', markWord: 'নম্বর', trueFalse: 'সত্য / মিথ্যা',
  };
}

/** প্রশ্ন-নম্বরের ধরন — ১. / (১) / ১) */
function qpNumHtml(num: string, style: QpNumStyle): string {
  const n = escapeQpHtml(num);
  if (!n) return '';
  if (style === 'paren') return `(${n})`;
  if (style === 'dash') return `${n})`;
  return `${n}.`;
}

/** নম্বর-মানের ধরন — [২] / (২) / ২ নম্বর */
function qpMarksHtml(marks: string, style: QpMarksStyle, word: string): string {
  const m = escapeQpHtml(marks);
  if (!m) return '';
  if (style === 'paren') return ` <strong>(${m})</strong>`;
  if (style === 'word') return ` <strong>${m} ${escapeQpHtml(word)}</strong>`;
  return ` <strong>[${m}]</strong>`;
}

/** উপ-প্রশ্ন — শুরুর (ক)/(i)-লেবেল গাঢ় — সৃজনশীল-ধাঁচ পরিষ্কার বোঝা যায় */
function qpSubHtml(sub: QpSubQ, sty: string): string {
  const sm = sub.marks ? ` [${escapeQpHtml(sub.marks)}]` : '';
  const body = mathRichToHtml(sub.text);
  const lm = body.match(/^((?:\([^)<]{1,8}\))|(?:[কখগঘঙiIvVxX]{1,4}[).):।]))\s*([\s\S]*)$/);
  const inner = lm && lm[2] ? `<strong>${lm[1]}</strong> ${lm[2]}${sm}` : `${body}${sm}`;
  return `<blockquote${sty}><p>${inner}</p></blockquote>`;
}

/** MCQ-অপশনের সাজ — এক লাইনে / ২ সারিতে (২×২) / তালিকায় */
function qpOptionsHtml(q: QpQuestion, layout: QpLayout, sty: string): string {
  if (q.options.length === 0) return '';
  const one = (o: QpOption) => `<strong>${escapeQpHtml(o.label)})</strong> ${mathRichToHtml(o.text)}`;
  if (layout.mcqLayout === 'list') {
    return `<ul${sty}>${q.options.map((o) => `<li>${one(o)}</li>`).join('')}</ul>`;
  }
  if (layout.mcqLayout === 'grid') {
    const rows: string[] = [];
    for (let i = 0; i < q.options.length; i += 2) {
      rows.push(`<p${sty}>${q.options.slice(i, i + 2).map(one).join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`);
    }
    return rows.join('');
  }
  return `<p${sty}>${q.options.map(one).join('&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`;
}

/** মিলকরণ-প্রশ্নের স্তম্ভ-টেবিল — বাঁ/ডান দুই স্তম্ভ, জিরোক্স-বান্ধব সীমারেখা */
function qpMatchHtml(q: QpQuestion): string | null {
  if (!q.pairs || q.pairs.length === 0) return null;
  const rows = q.pairs.map((p) => `<tr><td>${mathRichToHtml(p.left)}</td><td>${mathRichToHtml(p.right)}</td></tr>`);
  return `<table><tbody>${rows.join('')}</tbody></table>`;
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
 * বোর্ড-বক্স হেডার — বর্ডারযুক্ত টেবিল (এডিটর স্কিমা-সাপোর্টেড):
 *  ┌───────────────────────────────┐
 *  │      স্কুলের নাম · পরীক্ষা        │
 *  ├──────────────────┬────────────┤
 *  │ বিষয় / শ্রেণি        │ পূর্ণমান / সময় │
 *  └──────────────────┴────────────┘
 * এডিটর/প্রিভিউ/প্রিন্ট পাইপলাইনে টেবিলের ডিফল্ট বর্ডারই বক্স-ভাব দেয়।
 */
function boardHeaderHtml(m: QpMeta, _lang: Lang, L: QpLabels, hSize: string, subSize: string): string | null {
  const left: string[] = [];
  const right: string[] = [];
  if (m.subject) left.push(`${L.subject}: ${m.subject}`);
  if (m.classLabel) left.push(`${L.cls}: ${m.classLabel}`);
  if (m.fullMarks) right.push(`${L.marks}: ${m.fullMarks}`);
  if (m.time) right.push(`${L.time}: ${m.time}`);
  if (m.date) right.push(`${L.date}: ${m.date}`);
  const top: string[] = [];
  if (m.schoolName) {
    top.push(`<p style="text-align:center"><span style="font-size:${hSize}"><strong>${escapeQpHtml(m.schoolName)}</strong></span></p>`);
  }
  if (m.examTitle) {
    top.push(`<p style="text-align:center"><span style="font-size:${subSize}"><strong><em>${escapeQpHtml(m.examTitle)}</em></strong></span></p>`);
  }
  if (top.length === 0 && left.length === 0 && right.length === 0) return null;
  const cell = (lines: string[], align: 'left' | 'right') =>
    `<td>${lines.map((l) => `<p style="text-align:${align}">${escapeQpHtml(l)}</p>`).join('')}</td>`;
  const topRow = top.length > 0 ? `<tr><td colspan="2">${top.join('')}</td></tr>` : '';
  const infoRow = left.length > 0 || right.length > 0
    ? `<tr>${cell(left, 'left')}${cell(right, 'right')}</tr>`
    : '';
  return `<table><tbody>${topRow}${infoRow}</tbody></table>`;
}

/**
 * প্রশ্নপত্র → এডিটরে সন্নিবেশযোগ্য HTML।
 * শুধুমাত্র স্কিমা-সাপোর্টেড মার্কআপ: p/strong/em/u/hr/ul/li/blockquote/h3/table
 * + text-align/font-size ইনলাইন স্টাইল + <sup>/<sub> + doc-columns মাল্টি-কলাম মোড়ক।
 * প্রিভিউও একই HTML দেখায় — তাই যা দেখা যায়, ঠিক তাই বসে।
 */
export function paperToEditorHtml(p: QuestionPaper, lang: Lang): string {
  const f = resolveQpFormat(p);
  const layout = normalizeQpLayout(p.layout);
  const m = p.meta;
  const L = qpLabels(lang);
  const compact = f === 'compact';
  const board = f === 'board';
  const adj = p.fontScale === 'sm' ? -2 : p.fontScale === 'lg' ? 2 : 0;
  const subAdj = p.fontScale === 'sm' ? -1 : p.fontScale === 'lg' ? 1 : 0;
  const hN = (compact ? 16 : 18) + adj;
  const subN = (compact ? 11 : 12) + subAdj;
  const hSize = `${hN}pt`;
  const subSize = `${subN}pt`;
  const secSize = `${board ? subN + 1 : subN}pt`;
  const bodySize = p.fontScale === 'sm' ? '10.5pt' : p.fontScale === 'lg' ? '13pt' : '';
  const sty = (extra = '') => {
    const all = [extra, bodySize ? `font-size:${bodySize}` : ''].filter(Boolean).join(';');
    return all ? ` style="${all}"` : '';
  };
  const center = sty('text-align:center');
  const parts: string[] = [];

  // ── হেডার ──
  if (board) {
    const box = boardHeaderHtml(m, lang, L, hSize, subSize);
    if (box) parts.push(box);
  } else {
    if (m.schoolName) {
      parts.push(`<p${center}><span style="font-size:${hSize}"><strong>${escapeQpHtml(m.schoolName)}</strong></span></p>`);
    }
    if (m.examTitle) {
      parts.push(`<p${center}><span style="font-size:${subSize}"><strong><em>${escapeQpHtml(m.examTitle)}</em></strong></span></p>`);
    }
    const info = qpInfoLine(m, lang, '   |   ');
    if (info) parts.push(`<p${center}>${escapeQpHtml(info)}</p>`);
    parts.push('<hr>');
  }

  // ── শিক্ষার্থী ঘর + নির্দেশনা ──
  if (m.studentLine) parts.push(`<p${sty()}>${escapeQpHtml(L.nameRoll)}</p>`);
  if (m.instructions.length > 0) {
    parts.push(
      `<p${sty()}><strong>${escapeQpHtml(L.instructions)}:</strong></p>` +
      `<ul>${m.instructions.map((i) => `<li>${escapeQpHtml(i)}</li>`).join('')}</ul>`,
    );
  }

  // ── বিভাগ ও প্রশ্ন (উন্নত লেআউট-সচেতন) ──
  let firstSection = true;
  for (const sec of p.sections) {
    if (sec.title) {
      if (board && !firstSection) parts.push('<hr>');
      const t = escapeQpHtml(sec.title);
      if (layout.sectionStyle === 'box') {
        // বাক্সে বিভাগ-শিরোনাম — স্কিমা-সাপোর্টেড এককোষ টেবিল
        parts.push(`<table><tbody><tr><td><p${sty('text-align:center')}><span style="font-size:${secSize}"><strong>${t}</strong></span></p></td></tr></tbody></table>`);
      } else if (layout.sectionStyle === 'left') {
        parts.push(`<p${sty('text-align:left')}><span style="font-size:${secSize}"><strong><u>${t}</u></strong></span></p>`);
      } else {
        parts.push(`<p${center}><span style="font-size:${secSize}"><strong>${t}</strong></span></p>`);
      }
    }
    firstSection = false;
    if (sec.note) parts.push(`<p${center}><em>${escapeQpHtml(sec.note)}</em></p>`);

    const colCount = qpSectionColumns(sec, layout);
    const blocks = sec.questions.map((q) => {
      const bits: string[] = [];
      const num = qpNumHtml(q.number, layout.numStyle);
      const marks = qpMarksHtml(q.marks, layout.marksStyle, L.markWord);
      bits.push(`<p${sty()}><strong>${num}</strong> ${mathRichToHtml(q.text)}${marks}</p>`);
      // সত্য-মিথ্যা — উত্তর-স্থিরক লেখা না থাকলে যোগ হয়
      if (q.kind === 'tf' && !/সত্য|মিথ্যা|सत्य|असत्य|true|false/i.test(q.text)) {
        bits.push(`<p${sty('text-align:left')}><em>(${escapeQpHtml(L.trueFalse)})</em></p>`);
      }
      const matchTable = qpMatchHtml(q);
      if (matchTable) bits.push(matchTable);
      for (const sub of q.subs) bits.push(qpSubHtml(sub, sty()));
      bits.push(qpOptionsHtml(q, layout, sty()));
      bits.push(qpAnswerSpaceHtml(layout.answerSpace, colCount));
      return bits.join('');
    });

    if (colCount > 1) {
      // বাংলাদেশ-প্রথার ২/৩ কলাম — এডিটরের নিজস্ব doc-columns নোড (সম্পূর্ণ পাইপলাইন-সমর্থিত)
      // কলামের মাঝে রেখা — বোর্ড-স্টাইল MCQ-পত্রের চেনা ভাব
      // ইনলাইন column-count স্টাইল অপরিহার্য — এডিটরে TipTap renderHTML স্টাইল বসায়,
      // কিন্তু ডায়ালগ-প্রিভিউ ও স্বয়ংসম্পূর্ণ প্রিন্ট-ফাইলে কাঁচা HTML-ই দেখায়
      parts.push(
        `<div class="doc-columns" data-count="${colCount}" data-gap="26" data-rule="1" data-rule-style="solid" style="${columnsStyleText({ count: colCount, gap: 26, rule: true, fill: 'balance' })}">${blocks.join('')}</div>`,
      );
    } else {
      parts.push(...blocks);
    }
  }

  parts.push(`<p${center}>— ${escapeQpHtml(L.end)} —</p>`);
  return parts.join('');
}

/**
 * স্বয়ংসম্পূর্ণ প্রিন্ট-রেডি HTML ফাইল (ডাউনলোড) — শিক্ষকের বাছা পাতার মাপে @page,
 * বাংলা ওয়েব-ফন্ট, বোর্ড-স্টাইলে ডাবল-রুল পাতার ফ্রেম, মাল্টি-কলাম সমর্থনসহ,
 * প্রিন্ট বাটনসহ। শিক্ষক ব্রাউজারে খুলেই সরাসরি প্রিন্ট/সেভ-করতে পারে।
 */
export function paperToStandaloneHtml(p: QuestionPaper, lang: Lang): string {
  const body = paperToEditorHtml(p, lang);
  const board = resolveQpFormat(p) === 'board';
  const layout = normalizeQpLayout(p.layout);
  const size = QP_PAGE_SIZES[layout.pageSize] ?? QP_PAGE_SIZES.a4;
  const scale = p.fontScale === 'sm' ? '11pt' : p.fontScale === 'lg' ? '13.5pt' : '12pt';
  const title = [p.meta.schoolName, p.meta.examTitle, p.meta.subject].filter(Boolean).join(' — ') || 'Question Paper';
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
  ${board ? `.qp-frame { max-width: ${size.wMm}mm; margin: 24px auto 40px; background: #fff; border: 1.7px solid #111; padding: 4mm; box-shadow: 0 8px 30px rgba(0,0,0,.35); }` : ''}
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
export function qpSampleText(lang: Lang): string {
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
