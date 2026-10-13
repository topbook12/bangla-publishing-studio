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

import { toBanglaNumber, toEnglishDigits } from './bangla';
import type { Lang } from './i18n/core';

// ─── টাইপ ───

export type QpFormat = 'auto' | 'classic' | 'modern' | 'compact';
export type QpResolvedFormat = 'classic' | 'modern' | 'compact';

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

// ─── AI সিস্টেম-প্রম্পট ───

/** হাতের লেখা ছবি → বিশ্বস্ত টেক্সট (কঠোর JSON) */
export const QP_TRANSCRIBE_SYSTEM = `You are the handwriting-transcription engine of "Bangla Publishing Studio", built for teachers converting handwritten question papers into print-ready documents.

You will receive a photo/scan of handwritten or printed question paper(s), rough question notes, or a textbook exercise page. Transcribe it FAITHFULLY:
- Keep the ORIGINAL language and numerals (Bengali ১২৩…, Devanagari ०-९…, Latin 0-9…). Never translate.
- One question per line, prefixed by its number exactly as written ("১." or "1." or "(খ)").
- MCQ options on their own lines, prefixed with their labels ("ক." "খ." or "a." "b.").
- Marks at the END of the line inside brackets: [২] or [3].
- Section headers on their own lines: "বিভাগ – ক", "Section A", "খণ্ড: গ" etc.
- Sub-questions prefixed "(ক)" "(i)" etc. on their own lines.
- MATH in LaTeX inside $...$ : fractions $\frac{5}{8}$, powers $x^2$, roots $\sqrt{25}$, equations $2x + 3 = 7$. Use ASCII digits inside math.
- If handwriting is unclear, transcribe your best reading — NEVER invent extra questions, NEVER skip a question you can see.
- Output the exam/school header text too if present in the image.

Return ONLY valid JSON — no markdown fences, no commentary. Shape exactly:
{ "text": "the complete transcription, one question per line" }`;

/** কাঁচা প্রশ্ন-লেখা → কাঠামোবদ্ধ প্রশ্নপত্র (কঠোর JSON) */
export const QP_STRUCTURE_SYSTEM = `You are the examination-composition engine of "Bangla Publishing Studio" — an expert school-exam setter that turns rough teacher notes into a perfectly structured question paper.

You receive a HEADER block (teacher's exam details) and RAW QUESTION TEXT (typed or transcribed from handwriting). Structure it into the final question paper:

Return ONLY valid JSON — no markdown fences, no commentary. Shape exactly:
{
  "examTitle": string,        // e.g. "বার্ষিক পরীক্ষা — ২০২৫" ("" if unknown)
  "subject": string,          // "" if unknown
  "classLabel": string,       // e.g. "ষষ্ঠ শ্রেণি", "" if unknown
  "instructions": string[],   // 2–4 short exam instructions in the paper's language
  "sections": [
    {
      "title": string,        // "বিভাগ – ক" / "Section A"; "" only if a single unnamed section
      "note": string,         // e.g. "যেকোনো ৫টি প্রশ্নের উত্তর দাও" ("" if none)
      "questions": [
        {
          "number": string,   // "১" / "1" — numerals of the paper's language
          "text": string,     // full question text; math stays in $...$ LaTeX
          "marks": string,    // "২" / "2" — "" if unknown
          "options": [ { "label": "ক", "text": "…" } ],   // [] when not MCQ
          "subs": [ { "text": "(ক) …", "marks": "১" } ]   // [] when no sub-questions
        }
      ]
    }
  ]
}

Rules:
- LANGUAGE MIRROR: everything in the SAME language and numeral system as the RAW text (default Bengali). NEVER translate.
- HEADER FIDELITY: use the HEADER block values exactly when provided; otherwise infer from the RAW text; otherwise "" — never invent a school name.
- FIDELITY: keep EVERY question from the source. NEVER invent, drop or merge questions. Light grammar/spacing polish only.
- NUMBERING: clean sequential numbering within each section; keep the source's numbers when they are already sequential.
- MARKS: attach marks only when the source states them; never invent marks.
- SECTIONS: only split by the source's own section markers (বিভাগ/খণ্ড/Section); if none, one section with title "".
- MATH: expressions remain in $...$ LaTeX ($\frac{3}{4}$, $x^2$, $\sqrt{50}$) with ASCII digits inside math.
- MCQ: 4 options with ক/খ/গ/ঘ labels (Bengali) or A/B/C/D (Latin-script papers).
- SUB-QUESTIONS: keep "(ক)" "(i)" style prefixes inside sub text.`;

// ─── সাধারণ সহায়ক ───

export function escapeQpHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** AI-এর উত্তর থেকে প্রথম balanced JSON অবজেক্ট */
export function extractQpJson<T>(raw: string): T | null {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
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
      if (depth === 0) {
        try { return JSON.parse(s.slice(start, i + 1)) as T; } catch { return null; }
      }
    }
  }
  return null;
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

/** AI-এর সম্ভাব্য-ভাঙা JSON-কে নিরাপদ QuestionPaper-এ রূপান্তর */
export function normalizeQpJson(data: unknown, meta: QpMeta, format: QpFormat): QuestionPaper | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const sections: QpSection[] = [];
  for (const secRaw of asArr(d.sections)) {
    if (!secRaw || typeof secRaw !== 'object') continue;
    const sec = secRaw as Record<string, unknown>;
    const questions: QpQuestion[] = [];
    for (const qRaw of asArr(sec.questions)) {
      if (!qRaw || typeof qRaw !== 'object') continue;
      const q = qRaw as Record<string, unknown>;
      const text = asStr(q.text);
      if (!text) continue;
      const options = asArr(q.options)
        .map((o) => {
          const ob = (o ?? {}) as Record<string, unknown>;
          return { label: asStr(ob.label), text: asStr(ob.text) };
        })
        .filter((o) => o.label || o.text);
      const subs = asArr(q.subs)
        .map((sb) => {
          const sb2 = (sb ?? {}) as Record<string, unknown>;
          return { text: asStr(sb2.text), marks: asStr(sb2.marks) };
        })
        .filter((sb) => sb.text);
      questions.push({
        number: asStr(q.number),
        text,
        marks: asStr(q.marks),
        options,
        subs,
      });
    }
    sections.push({ title: asStr(sec.title), note: asStr(sec.note), questions });
  }
  const valid = sections.filter((s) => s.questions.length > 0);
  if (valid.length === 0) return null;

  // হেডার: AI-এর মান দিয়ে ফর্মের ফাঁকা ঘর পূরণ — শিক্ষকের লেখাই প্রাধান্য পায়
  const aiInstructions = asArr(d.instructions).map(asStr).filter(Boolean);
  return {
    meta: {
      ...meta,
      schoolName: meta.schoolName || '',
      examTitle: meta.examTitle || asStr(d.examTitle),
      subject: meta.subject || asStr(d.subject),
      classLabel: meta.classLabel || asStr(d.classLabel),
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

// ─── ফলব্যাক: AI ছাড়া লাইন-পার্সার ───

/** লাইনের শেষে বন্ধনীতে নম্বর-মান [২] (3) — খুঁজে আলাদা করে */
function splitTrailingMarks(s: string): { text: string; marks: string } {
  const m = s.match(/\s*[\[{(]\s*([০-৯0-9]{1,3})\s*(?:নম্বর|মার্কস|মার্ক্স|marks?|নং)?\s*[\]})]\s*$/);
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

    // বিভাগ/অংশ হেডার — শেষের [প্রতিটি ২ নম্বর] জাতীয় অংশ নোটে চলে যায়
    // দ্রষ্টব্য: JS-এর \b ASCII-শব্দ-সীমা — বাংলা অক্ষরের পরে কাজ করে না, তাই নেগেটিভ লুকঅ্যাহেড
    if (/^(?:বিভাগ|খণ্ড|অংশ(?!ী|গ্র)|section|part)/i.test(line) && line.length < 80) {
      const bare = line.replace(/\s*[-–—:=]\s*$/, '').trim();
      const nm = bare.match(/\s*[\[(]([^\[\]()]{2,60})[\])]\s*$/);
      const title = nm ? bare.slice(0, nm.index).trim() : bare;
      const note = nm ? nm[1].trim() : '';
      cur = { title, note, questions: [] };
      sections.push(cur);
      q = null;
      continue;
    }
    // প্রশ্ন: "১." / "12)" / "৩ঃ" — নম্বর-শনাক্তে en, কিন্তু বিষয়বস্তু মূল লাইন থেকে
    // (toEnglishDigits ১:১ দৈর্ঘ্য-সমান রূপান্তর — নইলে লেখার ভেতরের বাংলা ডিজিট
    //  নীরবে ইংরেজি হয়ে যেত; prefix দৈর্ঘ্য = পূর্ণ ম্যাচ − শেষ গ্রুপ)
    const qm = en.match(/^(\d{1,3})\s*[.)।ঃ:]\s*(.+)$/);
    if (qm) {
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
    // MCQ অপশন: "ক)" / "a." (শুধু প্রশ্নের ভেতরে)
    const om = line.match(/^([কখগঘঙa-dA-D])\s*[.):]\s*(.+)$/);
    if (om && q) {
      q.options.push({ label: om[1], text: om[2].trim() });
      continue;
    }
    // উপ-প্রশ্ন: "(ক)" / "(i)" / "i."
    const sm = line.match(/^\(?\s*([কখগঘঞ]|i{1,3}v?|v)\s*[).):\u0964]\s+(.+)$/i);
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
  if (valid.length === 0) return null;

  // প্রথম প্রশ্নের আগের লাইনগুলো নির্দেশনা হিসেবে ধরা হয় (প্রায়ই হয়)
  const instructions = preamble
    .filter((l) => !/^(?:সময়|পূর্ণমান|ফুল মার্কস|time|marks)/i.test(l) || l.length > 80)
    .slice(0, 6);

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
}

function qpLabels(lang: Lang): QpLabels {
  if (lang === 'hi') {
    return {
      cls: 'कक्षा', subject: 'विषय', date: 'दिनांक', time: 'समय', marks: 'पूर्णांक',
      instructions: 'निर्देश', nameRoll: 'छात्र का नाम: ____________________  रोल नं.: ________',
      end: 'समाप्त',
    };
  }
  if (lang === 'en') {
    return {
      cls: 'Class', subject: 'Subject', date: 'Date', time: 'Time', marks: 'Full Marks',
      instructions: 'Instructions', nameRoll: 'Student Name: ____________________  Roll No.: ________',
      end: 'End',
    };
  }
  return {
    cls: 'শ্রেণি', subject: 'বিষয়', date: 'তারিখ', time: 'সময়', marks: 'পূর্ণমান',
    instructions: 'নির্দেশনা', nameRoll: 'শিক্ষার্থীর নাম: ____________________  রোল নং: ________',
    end: 'শেষ',
  };
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
 * প্রশ্নপত্র → এডিটরে সন্নিবেশযোগ্য HTML।
 * শুধুমাত্র স্কিমা-সাপোর্টেড মার্কআপ: p/strong/em/u/hr/ul/li/blockquote/h3 +
 * text-align/font-size ইনলাইন স্টাইল + <sup>/<sub>। প্রিভিউও একই HTML দেখায় —
 * তাই যা দেখা যায়, ঠিক তাই বসে।
 */
export function paperToEditorHtml(p: QuestionPaper, lang: Lang): string {
  const f = resolveQpFormat(p);
  const m = p.meta;
  const L = qpLabels(lang);
  const center = ' style="text-align:center"';
  const compact = f === 'compact';
  const hSize = compact ? '16pt' : '18pt';
  const subSize = compact ? '11pt' : '12pt';
  const parts: string[] = [];

  // ── হেডার ──
  if (m.schoolName) {
    parts.push(`<p${center}><span style="font-size:${hSize}"><strong>${escapeQpHtml(m.schoolName)}</strong></span></p>`);
  }
  if (m.examTitle) {
    parts.push(`<p${center}><span style="font-size:${subSize}"><strong><em>${escapeQpHtml(m.examTitle)}</em></strong></span></p>`);
  }
  const info = qpInfoLine(m, lang, '   |   ');
  if (info) parts.push(`<p${center}>${escapeQpHtml(info)}</p>`);
  parts.push('<hr>');

  // ── শিক্ষার্থী ঘর + নির্দেশনা ──
  if (m.studentLine) parts.push(`<p>${escapeQpHtml(L.nameRoll)}</p>`);
  if (m.instructions.length > 0) {
    parts.push(
      `<p><strong>${escapeQpHtml(L.instructions)}:</strong></p>` +
      `<ul>${m.instructions.map((i) => `<li>${escapeQpHtml(i)}</li>`).join('')}</ul>`,
    );
  }

  // ── বিভাগ ও প্রশ্ন ──
  for (const sec of p.sections) {
    if (sec.title) {
      parts.push(`<p${center}><span style="font-size:${subSize}"><strong>${escapeQpHtml(sec.title)}</strong></span></p>`);
    }
    if (sec.note) parts.push(`<p${center}><em>${escapeQpHtml(sec.note)}</em></p>`);
    for (const q of sec.questions) {
      const marks = q.marks ? ` <strong>[${escapeQpHtml(q.marks)}]</strong>` : '';
      parts.push(`<p><strong>${escapeQpHtml(q.number)}.</strong> ${mathRichToHtml(q.text)}${marks}</p>`);
      for (const sub of q.subs) {
        const sm = sub.marks ? ` [${escapeQpHtml(sub.marks)}]` : '';
        parts.push(`<blockquote><p>${mathRichToHtml(sub.text)}${sm}</p></blockquote>`);
      }
      if (q.options.length > 0) {
        parts.push(
          `<p>${q.options
            .map((o) => `<strong>${escapeQpHtml(o.label)})</strong> ${mathRichToHtml(o.text)}`)
            .join('&nbsp;&nbsp;&nbsp;&nbsp;')}</p>`,
        );
      }
    }
  }

  parts.push(`<p${center}>— ${escapeQpHtml(L.end)} —</p>`);
  return parts.join('');
}

/**
 * স্বয়ংসম্পূর্ণ প্রিন্ট-রেডি HTML ফাইল (ডাউনলোড) — A4 @page, বাংলা ওয়েব-ফন্ট,
 * প্রিন্ট বাটনসহ। শিক্ষক ব্রাউজারে খুলেই সরাসরি প্রিন্ট/সেভ-করতে পারে।
 */
export function paperToStandaloneHtml(p: QuestionPaper, lang: Lang): string {
  const body = paperToEditorHtml(p, lang);
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
  .qp-page { max-width: 210mm; margin: 24px auto; background: #fff; padding: 18mm 16mm; box-shadow: 0 8px 30px rgba(0,0,0,.35); font-size: 12pt; line-height: 1.6; color: #111; }
  .qp-page hr { border: none; border-top: 1.6px solid #111; margin: 10px 0; }
  .qp-page blockquote { margin: 2px 0 2px 26px; padding: 0; border: none; }
  .qp-page ul { margin: 6px 0; padding-left: 24px; }
  .qp-page p { margin: 7px 0; }
  .qp-printbar { position: fixed; top: 12px; right: 12px; display: flex; gap: 8px; }
  .qp-printbar button { font: inherit; font-size: 14px; padding: 8px 16px; border-radius: 8px; border: none; background: #111; color: #fff; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,.3); }
  @media print {
    body { background: #fff; }
    .qp-page { margin: 0; box-shadow: none; max-width: none; padding: 0; }
    .qp-printbar { display: none; }
  }
  @page { size: A4; margin: 14mm 12mm; }
</style>
</head>
<body>
<div class="qp-printbar"><button onclick="window.print()">🖨 ${lang === 'bn' ? 'প্রিন্ট করুন' : lang === 'hi' ? 'प्रिंट करें' : 'Print'}</button></div>
<div class="qp-page">
${body}
</div>
</body>
</html>`;
}

// ─── নমুনা (ডেমো/ফাস্ট-ট্রাই) ───

/** এক ক্লিকে চেষ্টা করার জন্য নমুনা কাঁচা-লেখা — শিক্ষক সাথে সাথে ফিচার বোঝেন */
export function qpSampleText(lang: Lang): string {
  if (lang === 'hi') {
    return `वार्षिक परीक्षा — गणित
कक्षा ६

खण्ड – क [प्रत्येक २ अंक]
१. $\\frac{3}{4}$ और $\\frac{5}{6}$ का योगफल निकालें। [२]
२. $x^2 - 9$ के गुणनखंड लिखें। [२]
३. सरल करें: $\\sqrt{144} + \\sqrt{25}$ [२]

खण्ड – ख [प्रत्येक ५ अंक]
৪. एक आयत की लंबाई उसकी चौड़ाई से ३ सेमी अधिक है। यदि परिमाप ३६ सेमी हो, तो आयत की भुजाएँ निकालें। [५]
५. $2x + 5 = 17$ समीकरण हल करें और $x$ का मान जाँचें। [५]`;
  }
  if (lang === 'en') {
    return `Annual Examination — Mathematics
Class 6

Section A [2 marks each]
1. Find the sum of $\\frac{3}{4}$ and $\\frac{5}{6}$. [2]
2. Factorise: $x^2 - 9$ [2]
3. Simplify: $\\sqrt{144} + \\sqrt{25}$ [2]

Section B [5 marks each]
4. The length of a rectangle is 3 cm more than its width. If the perimeter is 36 cm, find the sides. [5]
5. Solve $2x + 5 = 17$ and verify the value of $x$. [5]`;
  }
  return `বার্ষিক পরীক্ষা — গণিত
ষষ্ঠ শ্রেণি

বিভাগ – ক [প্রতিটি ২ নম্বর]
১. $\\frac{3}{4}$ এবং $\\frac{5}{6}$ এর যোগফল নির্ণয় কর। [২]
২. উৎপাদকে বিশ্লেষণ কর: $x^2 - 9$ [২]
৩. সরল কর: $\\sqrt{144} + \\sqrt{25}$ [২]

বিভাগ – খ [প্রতিটি ৫ নম্বর]
৪. একটি আয়তাকার ঘরের দৈর্ঘ্য প্রস্থের চেয়ে ৩ মিটার বেশি। পরিসীমা ৩৬ মিটার হলে ঘরটির দৈর্ঘ্য ও প্রস্থ নির্ণয় কর। [৫]
৫. $2x + 5 = 17$ সমীকরণটি সমাধান কর এবং $x$ এর মান যাচাই কর। [৫]`;
}
