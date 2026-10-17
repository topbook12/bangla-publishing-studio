/**
 * AI নির্ভুলতা কেন্দ্র (Accuracy Center) — ইঞ্জিন
 * ─────────────────────────────────────────────
 * যেকোনো লেখা (বই-পৃষ্ঠা, প্রশ্নপত্র, সাজেশন, টেবিল) যাচাই করে ভুল খুঁজে বের
 * করে ও এক-ক্লিকে সংশোধন করে। দুই স্তরের যাচাই:
 *
 *  ১) লোকাল নির্ণায়ক যাচাই (runLocalChecks) — ইন্টারনেট/AI ছাড়াই, তাৎক্ষণিক:
 *     • গাণিতিক সমতা যাচাই: "১২ × ৫ = ৬৫" জাতীয় ভুল ফলাফল ধরা
 *       (বাংলা/দেবনাগরী/আরবি সংখ্যা, + − × ÷, বন্ধনী, শতকরা)
 *     • টাইপোগ্রাফি: ডাবল-স্পেস, দাঁড়ির আগে/পরে স্পেস, ।।, পুনরাবৃত্ত শব্দ,
 *       অসম বন্ধনী, $…$ গণিত খোলা, মিশ্র সংখ্যা-পদ্ধতি
 *     • প্রশ্ন-কাঠামো: MCQ-র ডুপ্লিকেট অপশন, অপশন-ক্রম ভাঙা, উত্তর-চাবি
 *       অবৈধ, প্রশ্ন-নম্বরের লাফ/ডুপ্লিকেট
 *  ২) AI গভীর যাচাই (runAiVerify) — কঠোর JSON চুক্তিতে গণিত-পুনঃগণনা, তথ্য,
 *     বানান, ব্যাকরণ, প্রশ্ন-কাঠামো, সামঞ্জস্য; বড় লেখা চাংক করে যাচাই।
 *
 * প্রয়োগ (fix) find-replace ইঞ্জিনের উপর দাঁড়িয়ে — মার্ক/অলংকার সংরক্ষিত।
 */

import { toArabicIndicNumber, toBanglaNumber, toDevanagariNumber, toEnglishDigits } from './bangla';
import { findAllMatches, replaceMatch, revealMatch, type FindMatch } from './find-replace';
import { useEditorStore } from './store';
import { getEditor } from './editor-registry';
import { callAi } from './ai-client';
import { scanText } from './proofing';
import { fmtNum, tFmt } from './i18n';
import type { Editor } from '@tiptap/react';

// ─── টাইপ ───

export type VerifyCategory =
  | 'math'
  | 'fact'
  | 'spelling'
  | 'grammar'
  | 'punctuation'
  | 'question'
  | 'consistency';

export type VerifySeverity = 'error' | 'warning' | 'note';

export interface VerifyIssue {
  id: string;
  source: 'local' | 'ai';
  category: VerifyCategory;
  severity: VerifySeverity;
  /** ডকুমেন্টে হুবহু যে অংশটি ভুল (সন্ধানযোগ্য সাবস্ট্রিং) */
  original: string;
  /** প্রতিস্থাপন — খালি = পরামর্শমূলক (অটো-ফিক্স অসম্ভব) */
  suggestion: string;
  /** এক বাক্যে কেন ভুল */
  why: string;
  /** ০–১০০ */
  confidence: number;
  pageId?: string;
  pageIndex?: number;
}

export type VerifyScope = 'selection' | 'page' | 'document';

export interface ScopePage {
  pageId: string;
  pageIndex: number;
  text: string;
}

export interface ScopeData {
  scope: VerifyScope;
  pages: ScopePage[];
  text: string;
}

export interface VerifyReport {
  issues: VerifyIssue[];
  summary: string;
  /** AI-চাংক যাচাই ব্যর্থ হলে কয়টি */
  failedChunks: number;
  /** মোট লেখার কত অংশ AI-যাচাই হলো (০–১) */
  coverage: number;
}

// ─── স্কোপ সংগ্রহ ───

const BLOCK_TAGS = 'p,h1,h2,h3,h4,h5,h6,li,td,th,blockquote,pre,div';

/** পাতার HTML → ব্লক-সীমানায় \n-সহ প্লেইন টেক্সট (find-replace-এর নিয়মের সাথে মিলিয়ে) */
function textFromHtml(html: string): string {
  try {
    const dom = new DOMParser().parseFromString(html || '<p></p>', 'text/html');
    let out = '';
    let lastBlock: Element | null = null;
    const walker = document.createTreeWalker(dom.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const parent = (n as Text).parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (parent.closest('.doc-shape-orn,.doc-icon-tools,.doc-textbox-tools,.doc-shape-tools,.no-print,.callout-head,.mcq-head,.toc-head')) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let cur = walker.nextNode() as Text | null;
    while (cur) {
      const blockEl = cur.parentElement?.closest(BLOCK_TAGS) ?? null;
      if (blockEl && blockEl !== lastBlock) {
        if (out.length && !out.endsWith('\n')) out += '\n';
        lastBlock = blockEl;
      }
      out += cur.data;
      cur = walker.nextNode() as Text | null;
    }
    return out;
  } catch {
    return (html || '').replace(/<[^>]*>/g, ' ');
  }
}

/** এডিটর → টেক্সট (ব্লক \n সেপারেটর) */
function textFromEditor(editor: Editor): string {
  try {
    return editor.getText({ blockSeparator: '\n' });
  } catch {
    return textFromHtml(editor.getHTML());
  }
}

/** স্কোপ অনুযায়ী যাচাইয়ের লেখা সংগ্রহ */
export function collectScope(scope: VerifyScope): ScopeData {
  const { pages, activePageId } = useEditorStore.getState();

  if (scope === 'selection') {
    const editor = getEditor(activePageId);
    let text = '';
    if (editor && !editor.isDestroyed) {
      const { from, to, empty } = editor.state.selection;
      if (!empty && to > from) {
        try {
          text = editor.state.doc.textBetween(from, to, '\n');
        } catch {
          text = '';
        }
      }
    }
    const pageIndex = pages.findIndex((p) => p.id === activePageId);
    const pageList: ScopePage[] = text.trim() && pageIndex >= 0
      ? [{ pageId: activePageId!, pageIndex, text }]
      : [];
    return { scope, pages: pageList, text: pageList[0]?.text ?? '' };
  }

  if (scope === 'page') {
    const editor = getEditor(activePageId);
    const page = pages.find((p) => p.id === activePageId);
    if (page && page.kind !== 'cover') {
      const text = editor && !editor.isDestroyed ? textFromEditor(editor) : textFromHtml(page.html);
      return { scope, pages: [{ pageId: page.id, pageIndex: pages.indexOf(page), text }], text };
    }
    return { scope, pages: [], text: '' };
  }

  // document — কভার বাদ, পাতার ক্রমে
  const pageList: ScopePage[] = [];
  pages.forEach((page, pageIndex) => {
    if (page.kind === 'cover') return;
    const editor = getEditor(page.id);
    const text = editor && !editor.isDestroyed ? textFromEditor(editor) : textFromHtml(page.html);
    if (text.trim()) pageList.push({ pageId: page.id, pageIndex, text });
  });
  return { scope, pages: pageList, text: pageList.map((p) => p.text).join('\n') };
}

// ─── নিরাপদ গাণিতিক মূল্যায়ন ───

/** ASCII গাণিতিক রাশি মূল্যায়ন (+ − * / ও বন্ধনী) — ব্যর্থ হলে null */
export function evalArithmetic(expr: string): number | null {
  const s = expr.replace(/\s+/g, '');
  if (!s || !/^[-+*/().0-9]+$/.test(s)) return null;
  let i = 0;
  const peek = () => s[i];

  function parseExpr(): number | null {
    let v = parseTerm();
    if (v === null) return null;
    while (peek() === '+' || peek() === '-') {
      const op = s[i++];
      const r = parseTerm();
      if (r === null) return null;
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  function parseTerm(): number | null {
    let v = parseFactor();
    if (v === null) return null;
    while (peek() === '*' || peek() === '/') {
      const op = s[i++];
      const r = parseFactor();
      if (r === null) return null;
      if (op === '/' && Math.abs(r) < 1e-12) return null;
      v = op === '*' ? v * r : v / r;
    }
    return v;
  }
  function parseFactor(): number | null {
    if (peek() === '+') { i++; return parseFactor(); }
    if (peek() === '-') { i++; const v = parseFactor(); return v === null ? null : -v; }
    if (peek() === '(') {
      i++;
      const v = parseExpr();
      if (v === null || peek() !== ')') return null;
      i++;
      return v;
    }
    const m = /^\d+(?:\.\d+)?/.exec(s.slice(i));
    if (!m) return null;
    i += m[0].length;
    return parseFloat(m[0]);
  }

  const v = parseExpr();
  if (v === null || i !== s.length) return null;
  if (!Number.isFinite(v)) return null;
  return v;
}

/** বাংলা/দেবনাগরী/আরবি সংখ্যা → ASCII (দৈর্ঘ্য অপরিবর্তিত — ইনডেক্স ম্যাপ নিরাপদ) */
function normalizeDigitsKeepLength(text: string): string {
  let out = '';
  for (const ch of text) {
    const en = toEnglishDigits(ch);
    out += /[0-9]/.test(en) ? en : ch;
  }
  return out;
}

/** লোকাল যাচাইয়ের ব্যাখ্যা — চলতি ভাষায় (অভিধান: dict-accuracy.ts → acc.why.*) */
function localWhy(key: string, vars?: Record<string, string | number>): string {
  return tFmt('acc.why.' + key, vars ?? {});
}

type DigitStyle = 'bn' | 'dev' | 'ar' | 'ascii';

/** লেখাটির অংশে কোন সংখ্যা-পদ্ধতি ব্যবহৃত — সংশোধনও সেই পদ্ধতিতেই হবে */
function digitStyleOf(s: string): DigitStyle {
  if (/[০-৯]/.test(s)) return 'bn';
  if (/[\u06F0-\u06F9]/.test(s)) return 'ar'; // মাদ্রাসা/ফার্সি-ধাঁচ (۰-۹)
  if (/[\u0660-\u0669]/.test(s)) return 'ar'; // আরবি-ইন্ডিক (٠-٩)
  if (/[०-९]/.test(s)) return 'dev';
  return 'ascii';
}

function fmtNumOut(n: number, style: DigitStyle = 'ascii'): string {
  const rounded = Math.round(n * 1e6) / 1e6;
  if (style === 'bn') return toBanglaNumber(rounded);
  if (style === 'dev') return toDevanagariNumber(rounded);
  if (style === 'ar') return toArabicIndicNumber(rounded);
  return String(rounded);
}

/**
 * গাণিতিক সমতা যাচাই — "A op B = C" প্যাটার্ন খুঁজে LHS মূল্যায়ন করে
 * ডান-পাশের লিখিত মানের সাথে মেলায়। ভুল হলে issue ফেরত।
 */
function checkArithmetic(text: string): VerifyIssue[] {
  const issues: VerifyIssue[] = [];
  const norm = normalizeDigitsKeepLength(text);
  // "x" শুধু দুই সংখ্যার মাঝে গুণ-চিহ্ন হিসেবে গ্রহণযোগ্য
  const MATH_CHARS = /[0-9+\-*/().\sxX]|×|÷|✕/;

  for (let i = 0; i < norm.length; i++) {
    if (norm[i] !== '=') continue;
    // RHS — সরাসরি সংখ্যা
    const rhsM = /^\s*(-?\d+(?:\.\d+)?)/.exec(norm.slice(i + 1));
    if (!rhsM) continue;
    const afterRhs = i + 1 + rhsM[0].length;
    const nextCh = norm[afterRhs] ?? '';
    if (/[0-9.]/.test(nextCh)) continue; // দশমিক কাটা পড়া এড়াতে

    // LHS — সমান-চিহ্ন থেকে বামে গাণিতিক অক্ষর হাঁটা
    let start = i;
    while (start > 0) {
      const ch = norm[start - 1];
      // "x"/"X"/"×"/"✕" সংখ্যার মাঝে গুণ-চিহ্ন — অক্ষর হলেও এতে হাঁটা থামে না।
      // (আগে যেকোনো অক্ষরে থেমে যেত, তাই "৫ x ৩ = ১৫" কখনোই ধরা পড়ত না।)
      const isMulX = ch === 'x' || ch === 'X' || ch === '×' || ch === '✕';
      if (isMulX || MATH_CHARS.test(ch)) {
        if (!isMulX && /[a-zA-Z\u0980-\u09FF\u0900-\u097F]/.test(ch)) break; // আসল অক্ষর/চলক এলে থামুন
        start--;
      } else break;
    }
    let lhs = norm.slice(start, i).trim();
    if (!lhs || !/\d/.test(lhs)) continue;
    if (!/[+\-*/×÷xX✕]/.test(lhs)) continue; // অন্তত এক অপারেটর
    if (/[a-zA-Z\u0980-\u09FF\u0900-\u097F]/.test(lhs)) {
      // চলক জাতীয় — শুধু স্বতন্ত্র "x" (গুণ) অনুমোদিত
      const withX = lhs.replace(/(?<=\d)\s*[xX✕×]\s*(?=\d)/g, '*');
      if (/[a-zA-Z\u0980-\u09FF\u0900-\u097F]/.test(withX)) continue;
      lhs = withX;
    }
    lhs = lhs.replace(/×|✕/g, '*').replace(/÷/g, '/');
    const value = evalArithmetic(lhs);
    if (value === null) continue;

    const written = parseFloat(rhsM[1]);
    if (Math.abs(value - written) > 1e-9) {
      // বাম-পাশের আঁকড়ে থাকা স্পেস বাদ — original/suggestion উভয়ে শব্দ থেকে শুরু হয়
      let origStart = start;
      while (origStart < i && (text[origStart] === ' ' || text[origStart] === '\t')) origStart++;
      const origEnd = afterRhs;
      const original = text.slice(origStart, origEnd);
      if (original.length > 220 || /\n/.test(original)) continue;
      const correctedLhs = text.slice(origStart, i).replace(/[ \t]+$/, '');
      // লিখিত ফলাফলের সংখ্যা-পদ্ধতিতেই সংশোধন দেখাই (বাংলা ডকুমেন্টে বাংলা অঙ্ক)
      const style = digitStyleOf(text.slice(i + 1, afterRhs));
      const suggestion = `${correctedLhs} = ${fmtNumOut(value, style)}`;
      issues.push({
        id: `local-math-${issues.length}`,
        source: 'local',
        category: 'math',
        severity: 'error',
        original,
        suggestion,
        why: localWhy('arithmetic', { a: fmtNumOut(value, style), b: fmtNumOut(written, style) }),
        confidence: 100,
      });
    }
    i = afterRhs;
  }

  // শতকরা: "২০% এর ৫০ = ৮" জাতীয়
  const pctRe = /(\d+(?:\.\d+)?)\s*%\s*(?:এর|of)\s*(\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/gi;
  const normText = normalizeDigitsKeepLength(text);
  let m: RegExpExecArray | null;
  while ((m = pctRe.exec(normText)) !== null) {
    const expect = (parseFloat(m[1]) / 100) * parseFloat(m[2]);
    const written = parseFloat(m[3]);
    if (Math.abs(expect - written) > 1e-9) {
      const original = text.slice(m.index, m.index + m[0].length);
      if (/\n/.test(original)) continue;
      // লিখিত ফলাফলটি মূল টেক্সট থেকেই বদলাই (সংখ্যা-পদ্ধতি যা-ই হোক)
      const tailLen = m[3].length;
      const style = digitStyleOf(original.slice(original.length - tailLen));
      const suggestion = original.slice(0, original.length - tailLen) + fmtNumOut(expect, style);
      issues.push({
        id: `local-pct-${issues.length}`,
        source: 'local',
        category: 'math',
        severity: 'error',
        original,
        suggestion,
        why: localWhy('percent', { a: fmtNum(m[1]), b: fmtNum(m[2]), c: fmtNumOut(expect, style) }),
        confidence: 100,
      });
    }
  }
  return issues;
}

// ─── টাইপোগ্রাফি যাচাই ───

/** বাংলা পুনরাবৃত্তি-শব্দ (আস্তে আস্তে) — ভুল নয় */
const REDUPLICATION_OK = new Set([
  'আস্তে', 'ধীরে', 'ভালো', 'ভাল', 'আলাদা', 'ছোট', 'ছোট্ট', 'বড়', 'নতুন', 'পুরনো',
  'এক', 'দুই', 'তিন', 'বার', 'ধাপে', 'ক্রমে', 'আবার', 'সারি', 'ধারে', 'পাশে', 'মাঝে',
  'ভিতরে', 'বাইরে', 'উপরে', 'নিচে', 'আগে', 'পরে', 'সাথে', 'সঙ্গে', 'হাতে', 'চোখে',
  'কানে', 'মনে', 'রোজ', 'দিন', 'রাত', 'ঘুম', 'বেশ', 'আলগা', 'শক্ত', 'নরম', 'কদম',
  'টুকু', 'খানি', 'রকম', 'মতো', 'দিকে', 'জায়গায়', 'ক্ষেত্রে', 'অংশে', 'কোণে',
]);

function checkTypography(text: string): VerifyIssue[] {
  const issues: VerifyIssue[] = [];
  const push = (issue: Omit<VerifyIssue, 'id' | 'source'>) => {
    issues.push({ ...issue, id: `local-ty-${issues.length}`, source: 'local' });
  };

  // ডাবল স্পেস (শব্দের মাঝে)
  {
    const re = /(\S)[ \t]{2,}(\S)/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(text)) !== null && n < 40) {
      const original = text.slice(m.index, m.index + m[0].length);
      push({
        category: 'punctuation', severity: 'note', original,
        suggestion: `${m[1]} ${m[2]}`,
        why: localWhy('doubleSpace'),
        confidence: 95,
      });
      n++;
    }
  }

  // দাঁড়ির আগে স্পেস
  {
    const re = /(\S)[ \t]+।/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(text)) !== null && n < 40) {
      const original = text.slice(m.index, m.index + m[0].length);
      push({
        category: 'punctuation', severity: 'note', original,
        suggestion: `${m[1]}।`,
        why: localWhy('spaceBeforeDanda'),
        confidence: 98,
      });
      n++;
    }
  }

  // দাঁড়ির পরে স্পেস নেই
  {
    const re = /।(?=[\u0980-\u09FFA-Za-z(])/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(text)) !== null && n < 40) {
      const original = `।${text[m.index + 1]}`;
      push({
        category: 'punctuation', severity: 'note', original,
        suggestion: `। ${text[m.index + 1]}`,
        why: localWhy('spaceAfterDanda'),
        confidence: 90,
      });
      n++;
    }
  }

  // ডাবল দাঁড়ি
  {
    const re = /।।+/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(text)) !== null && n < 20) {
      push({
        category: 'punctuation', severity: 'note', original: m[0],
        suggestion: '।',
        why: localWhy('doubleDanda'),
        confidence: 92,
      });
      n++;
    }
  }

  // কমার আগে স্পেস
  {
    const re = /(\S)[ \t]+,/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(text)) !== null && n < 30) {
      const original = text.slice(m.index, m.index + m[0].length);
      push({
        category: 'punctuation', severity: 'note', original,
        suggestion: `${m[1]},`,
        why: localWhy('spaceBeforeComma'),
        confidence: 96,
      });
      n++;
    }
  }

  // পুনরাবৃত্ত শব্দ ("এবং এবং")
  {
    const re = /([\u0980-\u09FF]{2,})(\s+)\1(?=\s|$|[।,;:!?()])/g;
    let m: RegExpExecArray | null;
    let n = 0;
    while ((m = re.exec(text)) !== null && n < 20) {
      if (REDUPLICATION_OK.has(m[1])) continue;
      push({
        category: 'grammar', severity: 'note', original: m[0],
        suggestion: m[1],
        why: localWhy('repeatedWord', { w: m[1] }),
        confidence: 70,
      });
      n++;
    }
  }

  // অসম বন্ধনী (তথ্যমূলক)
  {
    const pairs: Array<[string, string]> = [['(', ')'], ['[', ']']];
    for (const [open, close] of pairs) {
      const a = (text.match(new RegExp(`\\${open}`, 'g')) ?? []).length;
      const b = (text.match(new RegExp(`\\${close}`, 'g')) ?? []).length;
      if (a !== b && Math.max(a, b) <= 60) {
        push({
          category: 'punctuation', severity: 'note', original: '',
          suggestion: '',
          why: localWhy('brackets', { o: open, c: close, a: fmtNum(a), b: fmtNum(b) }),
          confidence: 85,
        });
      }
    }
  }

  // $…$ গণিত ডিলিমিটার অসম
  {
    const dollars = (text.match(/\$/g) ?? []).length;
    if (dollars % 2 === 1) {
      push({
        category: 'punctuation', severity: 'warning', original: '',
        suggestion: '',
        why: localWhy('dollar'),
        confidence: 95,
      });
    }
  }

  // মিশ্র সংখ্যা-পদ্ধতি (একই লাইনে বাংলা ও ইংরেজি অঙ্ক) — তথ্যমূলক
  {
    const lines = text.split('\n');
    let flagged = 0;
    for (const line of lines) {
      if (flagged >= 6) break;
      if (/[০-৯]/.test(line) && /[0-9]/.test(line)) {
        push({
          category: 'consistency', severity: 'note', original: '',
          suggestion: '',
          why: localWhy('mixedDigits'),
          confidence: 75,
        });
        flagged++;
      }
    }
  }

  return issues;
}

// ─── প্রশ্ন-কাঠামো যাচাই ───

const OPT_LETTERS_BN = ['ক', 'খ', 'গ', 'ঘ', 'ঙ'];
const OPT_RE = /^\s*[([]?(ক|খ|গ|ঘ|ঙ|[A-Da-d])[).\]:\s]\s*/;

interface McqGroup {
  startLine: number;
  endLine: number;
  options: Array<{ letter: string; text: string; line: number }>;
}

function checkQuestionStructure(text: string): VerifyIssue[] {
  const issues: VerifyIssue[] = [];
  const lines = text.split('\n');
  const push = (issue: Omit<VerifyIssue, 'id' | 'source'>) => {
    issues.push({ ...issue, id: `local-q-${issues.length}`, source: 'local' });
  };

  // MCQ গ্রুপ সনাক্তকরণ — পরপর অপশন-লাইন
  const groups: McqGroup[] = [];
  let cur: McqGroup | null = null;
  lines.forEach((line, li) => {
    const m = OPT_RE.exec(line);
    if (m) {
      const body = line.slice(m[0].length).trim();
      if (!cur || li - cur.endLine > 2) {
        cur = { startLine: li, endLine: li, options: [] };
        groups.push(cur);
      }
      cur.endLine = li;
      cur.options.push({ letter: m[1], text: body, line: li });
    } else if (cur && line.trim() && !/^\s*[([]?(ক|খ|গ|ঘ|ঙ|[A-Da-d])[).\]:]/.test(line)) {
      // অপশন-বহির্ভূত লাইন এলে গ্রুপ শেষ — তবে উত্তর-লাইনে গ্রুপ টিক থাকে
      if (!/^\s*(?:উত্তর|সঠিক উত্তর|Answer)/i.test(line)) cur = null;
    }
  });

  for (const g of groups) {
    if (g.options.length < 2) continue;

    // ডুপ্লিকেট অপশন
    const seen = new Map<string, string>();
    for (const opt of g.options) {
      const key = opt.text.replace(/\s+/g, ' ').trim().toLowerCase();
      if (!key) continue;
      if (seen.has(key)) {
        push({
          category: 'question', severity: 'warning', original: '',
          suggestion: '',
          why: localWhy('duplicateOption', { a: opt.letter, b: seen.get(key) ?? '' }),
          confidence: 90,
        });
      } else seen.set(key, opt.letter);
    }

    // অপশন-ক্রম ভাঙা (ক খ ঘ → ক ঘ)
    const bnLetters = g.options
      .map((o) => o.letter)
      .filter((l) => OPT_LETTERS_BN.includes(l));
    if (bnLetters.length >= 3) {
      const expected = OPT_LETTERS_BN.slice(0, bnLetters.length).join('');
      const got = bnLetters.join('');
      if (got !== expected) {
        push({
          category: 'question', severity: 'note', original: '',
          suggestion: '',
          why: localWhy('optionOrder', { a: got, b: expected }),
          confidence: 80,
        });
      }
    }

    // উত্তর-চাবি যাচাই — গ্রুপের পরের উত্তর-লাইন
    for (let li = g.endLine + 1; li <= Math.min(g.endLine + 2, lines.length - 1); li++) {
      const ansM = /^\s*(?:উত্তর|সঠিক উত্তর|Answer)\s*[:=—-]?\s*[([]?(ক|খ|গ|ঘ|ঙ|[A-Da-d])[).\]]?/i.exec(lines[li]);
      if (ansM) {
        const have = new Set(g.options.map((o) => o.letter));
        if (!have.has(ansM[1])) {
          const original = lines[li].trim().slice(0, 120);
          push({
            category: 'question', severity: 'error', original,
            suggestion: '',
            why: localWhy('answerKey', { a: ansM[1], b: Array.from(have).join(', ') }),
            confidence: 88,
          });
        }
        break;
      }
    }
  }

  // প্রশ্ন-নম্বরের ক্রম (১. ২. ৪. / ২. দুবার)
  const numRe = /^\s*([০-৯0-9]+)[.)।]\s+\S/;
  const runs: Array<{ n: number; line: number }> = [];
  const flushRuns = () => {
    if (runs.length >= 3) {
      const nums = runs.map((r) => r.n);
      const dup = nums.filter((n, i) => nums.indexOf(n) !== i);
      if (dup.length) {
        push({
          category: 'question', severity: 'note', original: '',
          suggestion: '',
          why: localWhy('numberingDup', { a: dup.map((d) => fmtNum(d)).join(', ') }),
          confidence: 82,
        });
      } else {
        for (let i = 1; i < nums.length; i++) {
          if (nums[i] !== nums[i - 1] + 1) {
            push({
              category: 'question', severity: 'note', original: '',
              suggestion: '',
              why: localWhy('numberingSkip', { a: fmtNum(nums[i - 1]), b: fmtNum(nums[i]) }),
              confidence: 78,
            });
            break;
          }
        }
      }
    }
    runs.length = 0;
  };
  lines.forEach((line, li) => {
    const m = numRe.exec(line);
    if (m) {
      const n = parseInt(toEnglishDigits(m[1]), 10);
      if (runs.length && li - runs[runs.length - 1].line > 4) flushRuns();
      runs.push({ n, line: li });
    } else if (line.trim() === '' && runs.length && li - runs[runs.length - 1].line > 3) {
      flushRuns();
    }
  });
  flushRuns();

  return issues;
}

/** অফলাইন বানান-সন্দেহ (proofing.scanText) — পরামর্শ-স্তর; প্রতি রানে সর্বোচ্চ ১২টি */
const SPELLING_MAX = 12;

function checkSpelling(text: string): VerifyIssue[] {
  // কোড/ম্যাথ-অংশের শব্দ অভিধানে না থাকলেও বাদ (সস্তা নিয়ম: $…$ ও inline-code বাদ)
  const clean = text.replace(/\$[^$\n]*\$/g, ' ').replace(/`[^`\n]*`/g, ' ');
  const unknown = scanText(clean, { maxResults: SPELLING_MAX });
  return unknown.map((sw, idx) => ({
    id: 'local-sp-' + idx,
    source: 'local',
    category: 'spelling',
    severity: 'warning',
    original: sw.word,
    suggestion: '',
    why: sw.count > 1
      ? localWhy('spellingTimes', { w: sw.word, n: fmtNum(sw.count) })
      : localWhy('spelling'),
    confidence: 60,
  }));
}

/** সব লোকাল (নির্ণায়ক) যাচাই একসাথে — গণিত, টাইপোগ্রাফি, প্রশ্ন-কাঠামো, বানান */
export function runLocalChecks(text: string): VerifyIssue[] {
  if (!text.trim()) return [];
  return [...checkArithmetic(text), ...checkTypography(text), ...checkQuestionStructure(text), ...checkSpelling(text)];
}

// ─── AI যাচাই ───

export const ACCURACY_SYSTEM = `You are the accuracy-verification engine of "Bangla Publishing Studio" — a professional proofreading system for Bengali, Hindi and English books, exam papers and suggestion sheets. Publishers rely on you to catch every genuine error before printing.

TASK
You receive one chunk of CONTENT. Report every genuine error as ONE issue object.

WHAT TO CHECK (priority order)
1. MATH: re-compute every arithmetic result, fraction, percentage, unit conversion, sign and formula step. Wrong numbers are top-priority errors.
2. FACTS: dates, years, names, places, capitals, scientific/historical facts — flag ONLY when you are certain.
3. SPELLING: wrong spellings (Bengali: শ/ষ/স, ন/ণ, জ/য confusions, wrong conjuncts; Hindi matras; English), including inconsistency of the same word's spelling.
4. GRAMMAR: case endings (বিভক্তি), verb agreement, gender/number, wrong word forms, broken sentences.
5. PUNCTUATION & TYPOGRAPHY: danda usage, spacing, quote marks, stray symbols.
6. QUESTION/EXAM STRUCTURE: duplicate or impossible MCQ options, wrong/missing answer keys, marks that do not add up, broken numbering, ambiguous question wording.
7. CONSISTENCY: terminology, units, digit style, numbering, cross-references.

OUTPUT CONTRACT (STRICT)
Return ONLY valid JSON — no markdown fences, no commentary. Shape:
{"issues":[{"category":"math|fact|spelling|grammar|punctuation|question|consistency","severity":"error|warning|note","original":"…","suggestion":"…","why":"…","confidence":95}],"summary":"…"}
- "original": the EXACT text as it appears in the CONTENT, copied character-for-character (10–160 chars, one line, include a little surrounding context so it is unique). NEVER paraphrase or normalize spaces. NEVER join two separate lines into one original — if the error spans lines, set "suggestion" to "" and explain in "why".
- "suggestion": the corrected replacement for exactly that span. If it cannot be fixed by text replacement (advisory, e.g. structural), use "" and explain in "why".
- "why": ONE short sentence in the SAME language as the CONTENT (Bengali content → Bengali "why").
- "confidence": 0–100 (95+ = certain).
- "severity": "error" = wrong fact/math/spelling; "warning" = probably wrong; "note" = polish/consistency.
- NEVER report deliberate quotes, titles, intended formulas or stylistic choices. No false positives. Each error ONCE. Max 25 issues, most important first.
- Clean chunk → {"issues":[],"summary":"…"}. "summary": one short sentence about overall quality, in the CONTENT's language.`;

interface RawAiIssue {
  category?: unknown;
  severity?: unknown;
  original?: unknown;
  suggestion?: unknown;
  why?: unknown;
  confidence?: unknown;
}

const CATEGORIES = new Set<VerifyCategory>(['math', 'fact', 'spelling', 'grammar', 'punctuation', 'question', 'consistency']);
const SEVERITIES = new Set<VerifySeverity>(['error', 'warning', 'note']);

/** AI উত্তর থেকে { issues, summary } উদ্ধার — ফেন্স/অতিরিক্ত টেক্সট সহ্য করে */
function parseVerifyJson(raw: string): { issues: RawAiIssue[]; summary?: string } | null {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  let from = s.indexOf('{');
  while (from !== -1) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = from; i < s.length; i++) {
      const ch = s[i];
      if (inStr) {
        if (esc) esc = false;
        else if (ch === '\\') esc = true;
        else if (ch === '"') inStr = false;
        continue;
      }
      if (ch === '"') inStr = true;
      else if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try {
            const obj = JSON.parse(s.slice(from, i + 1)) as { issues?: unknown; summary?: unknown };
            if (obj && Array.isArray(obj.issues)) {
              return {
                issues: obj.issues.filter((x): x is RawAiIssue => !!x && typeof x === 'object'),
                summary: typeof obj.summary === 'string' ? obj.summary : undefined,
              };
            }
          } catch {
            // ভাঙা প্রার্থী — পরের '{'
          }
          break;
        }
      }
    }
    from = s.indexOf('{', from + 1);
  }
  return null;
}

/** চাংক-ভাগ — প্যারাগ্রাফ-সীমায়, প্রতিটি চাংকে pageId ট্যাগ */
function buildChunks(scope: ScopeData): Array<{ text: string; pageId?: string; pageIndex?: number }> {
  const LIMITS: Record<VerifyScope, { chunk: number; max: number }> = {
    selection: { chunk: 3400, max: 4 },
    page: { chunk: 4200, max: 8 },
    document: { chunk: 4200, max: 14 },
  };
  const { chunk: chunkSize, max: maxChunks } = LIMITS[scope.scope];
  const out: Array<{ text: string; pageId?: string; pageIndex?: number }> = [];

  for (const page of scope.pages) {
    const paras = page.text.split('\n');
    let buf = '';
    const flush = () => {
      const t = buf.trim();
      if (t) out.push({ text: t, pageId: page.pageId, pageIndex: page.pageIndex });
      buf = '';
    };
    for (const p of paras) {
      if (buf.length + p.length + 1 > chunkSize) {
        flush();
        // একটি প্যারাই-ই সীমা ছাড়িয়ে গেলে কাটা
        if (p.length > chunkSize) {
          for (let i = 0; i < p.length; i += chunkSize) {
            const t = p.slice(i, i + chunkSize).trim();
            if (t) out.push({ text: t, pageId: page.pageId, pageIndex: page.pageIndex });
          }
          continue;
        }
      }
      buf += (buf ? '\n' : '') + p;
    }
    flush();
  }
  return out.slice(0, maxChunks);
}

/** ডুপ্লিকেট-চেনার কি — স্পেস-নিরপেক্ষ (AI ও লোকাল একই ভুল সামান্য ভিন্নভাবে লিখলেও এক হয়) */
const dedupeKeyOf = (original: string, suggestion: string) =>
  `${original.replace(/\s+/g, ' ').trim()}|${suggestion.replace(/\s+/g, ' ').trim()}`;

/** AI issue বৈধতা-যাচাই + পরিমার্জন; ডকুমেন্টে না-পাওয়া original বাদ */
function normalizeAiIssue(
  raw: RawAiIssue,
  chunkText: string,
  fullText: string,
  pageId?: string,
  pageIndex?: number,
): VerifyIssue | null {
  const original = typeof raw.original === 'string' ? raw.original.trim() : '';
  const category = String(raw.category ?? '').toLowerCase() as VerifyCategory;
  const severity = String(raw.severity ?? '').toLowerCase() as VerifySeverity;
  if (!original || original.length > 260 || /\n/.test(original)) return null;
  if (!CATEGORIES.has(category) || !SEVERITIES.has(severity)) return null;
  // হুবহু ডকুমেন্টে থাকতে হবে — নইলে প্রয়োগ করা যাবে না
  if (!fullText.includes(original) && !chunkText.includes(original)) {
    // স্পেস-নরমালাইজ করে আবার চেষ্টা
    const collapse = (x: string) => x.replace(/\s+/g, ' ');
    const found =
      collapse(fullText).includes(collapse(original)) ||
      collapse(chunkText).includes(collapse(original));
    if (!found) return null;
  }
  const conf = typeof raw.confidence === 'number' ? Math.max(0, Math.min(100, Math.round(raw.confidence))) : 70;
  // হুবহু মেলে না এমন original — প্রয়োগ নির্ভরযোগ্য নয়, তাই পরামর্শ-স্তরে নামাই
  // (মাল্টি-লাইন/স্পেস-ভিন্ন original প্রতিস্থাপনে লেখা নষ্ট হতে পারে)
  const exactInDoc = fullText.includes(original) || chunkText.includes(original);
  const suggestion = typeof raw.suggestion === 'string' ? raw.suggestion.trim() : '';
  // নো-অপ "সংশোধন" বাদ — মডেল মাঝে মাঝে হুবহু এক-ই লেখা original/suggestion দেয়।
  // (স্পেস-শুধু পার্থক্য আসল সংশোধন হতে পারে — যেমন ডাবল-স্পেস — তাই রাখা হয়।)
  if (suggestion && suggestion === original) return null;
  return {
    id: '',
    source: 'ai',
    category,
    severity,
    original,
    suggestion: exactInDoc ? suggestion : '',
    why: typeof raw.why === 'string' ? raw.why.trim().slice(0, 300) : '',
    confidence: conf,
    pageId,
    pageIndex,
  };
}

export interface AiVerifyOptions {
  scope: ScopeData;
  deep?: boolean;
  demo?: boolean;
  onProgress?: (done: number, total: number) => void;
  shouldAbort?: () => boolean;
  /** চলমান চাংক-কল বাতিল — ডায়ালগের Cancel/বন্ধে */
  signal?: AbortSignal;
}

/**
 * AI গভীর যাচাই — চাংক-ধরে কল, ফলাফল একত্রিত ও ডুপ্লিকেট-মুক্ত।
 * কোনো চাংক ব্যর্থ হলে বাদ দিয়ে বাকিগুলো চলে (failedChunks-এ গণনা)।
 */
export async function runAiVerify(opts: AiVerifyOptions): Promise<VerifyReport> {
  const chunks = buildChunks(opts.scope);
  const totalChars = opts.scope.text.length;
  const coveredChars = chunks.reduce((a, c) => a + c.text.length, 0);
  const issues: VerifyIssue[] = [];
  const seen = new Set<string>();
  let summary = '';
  let failedChunks = 0;
  let done = 0;

  for (const chunk of chunks) {
    if (opts.shouldAbort?.() || opts.signal?.aborted) break;
    const prompt = `CONTENT (verify ONLY this part):\n---\n${chunk.text}\n---\nVerify accuracy now. Reply with the JSON only.`;
    try {
      const res = await callAi({ prompt, system: ACCURACY_SYSTEM, demo: opts.demo, thinking: opts.deep, signal: opts.signal });
      if (opts.signal?.aborted) break; // বাতিল — আংশিক ফল ধরে রেখে থামুন
      if (res.ok && res.text) {
        const parsed = parseVerifyJson(res.text);
        if (parsed) {
          summary = parsed.summary || summary;
          for (const raw of parsed.issues) {
            const issue = normalizeAiIssue(raw, chunk.text, opts.scope.text, chunk.pageId, chunk.pageIndex);
            if (!issue) continue;
            const key = dedupeKeyOf(issue.original, issue.suggestion);
            if (seen.has(key)) continue;
            // লোকাল যাচাইয়ে থাকা হুবহু এক ভুল আর-একবার দেখাব না
            seen.add(key);
            issue.id = `ai-${issues.length}`;
            issues.push(issue);
          }
        } else {
          failedChunks++;
        }
      } else {
        failedChunks++;
      }
    } catch {
      failedChunks++;
    }
    done++;
    opts.onProgress?.(done, chunks.length);
  }

  // পৃষ্ঠা-অ্যাট্রিবিউশন: original কোন পাতায় আছে
  for (const issue of issues) {
    if (issue.pageIndex !== undefined) continue;
    const page = opts.scope.pages.find((p) => p.text.includes(issue.original));
    if (page) {
      issue.pageId = page.pageId;
      issue.pageIndex = page.pageIndex;
    }
  }

  // প্রয়োগযোগ্যতা-গেট: find-replace ইঞ্জিন হুবহু খুঁজে না পেলে সেটি অটো-ফিক্স
  // নয় — নিরাপদে পরামর্শ-স্তরে নামাই (প্রয়োগ-বাটনে ব্যর্থতা দেখাবে না)
  const scopeIds = new Set(opts.scope.pages.map((p) => p.pageId));
  // পারফ: প্রতি issue-তে পুরো-বই DOM পার্স নয়। প্রথমে রান-সময়ের ক্যাশ-করা
  // স্কোপ-টেক্সটে সস্তা includes-যাচাই; না মিললে তবেই লাইভ findAllMatches —
  // ইউনিক original-প্রতি একবার (ক্যাশ)। আচরণ একই: না-পাওয়া গেলে পরামর্শ-স্তরে।
  const liveCache = new Map<string, boolean>();
  const applicableInScope = (original: string): boolean => {
    const q = original.trim();
    if (!q) return false;
    if (opts.scope.pages.some((pg) => pg.text.includes(q))) return true;
    let live = liveCache.get(q);
    if (live === undefined) {
      live = findAllMatches(q, true).some((m) => scopeIds.has(m.pageId));
      liveCache.set(q, live);
    }
    return live;
  };
  for (const issue of issues) {
    if (!issue.suggestion) continue;
    if (!applicableInScope(issue.original)) issue.suggestion = '';
  }

  return { issues, summary, failedChunks, coverage: totalChars ? Math.min(1, coveredChars / totalChars) : 1 };
}

// ─── প্রয়োগ (fix) ───

/** স্কোপ-পাতায় সীমাবদ্ধ মিল-তালিকা */
function matchesInScope(issue: VerifyIssue, scopePageIds: Set<string>): FindMatch[] {
  if (!issue.original) return [];
  const all = findAllMatches(issue.original, true);
  return all.filter((m) => scopePageIds.has(m.pageId));
}

/** একটি issue ডকুমেন্টে প্রয়োগ — সফল হলে true */
export function applyVerifyIssue(issue: VerifyIssue, scopePageIds: string[]): boolean {
  if (!issue.suggestion || !issue.original) return false;
  const ids = new Set(scopePageIds);
  const matches = matchesInScope(issue, ids);
  if (!matches.length) return false;
  return replaceMatch(matches[0], issue.original, issue.suggestion, true);
}

/** issue-এর অবস্থান ভিউপোর্টে এনে সিলেক্ট করা */
export function revealVerifyIssue(issue: VerifyIssue, scopePageIds: string[]): boolean {
  const ids = new Set(scopePageIds);
  const matches = matchesInScope(issue, ids);
  if (!matches.length) return false;
  revealMatch(matches[0]);
  return true;
}

/** এক ব্যাচ প্রয়োগ — ফেরত: সফল/ব্যর্থ সংখ্যা (স্কোপ-পাতার ক্রমে, প্রথম মিলে) */
export function applyVerifyIssues(list: VerifyIssue[], scopePageIds: string[]): { ok: number; fail: number } {
  let ok = 0;
  let fail = 0;
  for (const issue of list) {
    if (!issue.suggestion) continue;
    if (applyVerifyIssue(issue, scopePageIds)) ok++;
    else fail++;
  }
  return { ok, fail };
}

/** নির্ভুলতা স্কোর (০–১০০) — খোলা issue গুলোর ভিত্তিতে */
export function accuracyScore(issues: Array<{ severity: VerifySeverity; status: string }>): number {
  let score = 100;
  for (const i of issues) {
    if (i.status !== 'open') continue;
    if (i.severity === 'error') score -= 8;
    else if (i.severity === 'warning') score -= 4;
    else score -= 1;
  }
  return Math.max(0, score);
}
