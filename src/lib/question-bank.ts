/**
 * দিন ৬৬ — প্রশ্ন-ভান্ডার (Question Bank) — গ্লোবাল, প্রজেক্ট-নিরপেক্ষ প্রশ্ন-সংগ্রহ।
 *
 * নীতি:
 *  - local-first: Dexie (IndexedDB, bwp-studio v5) — ইন্টারনেট ছাড়াই সম্পূর্ণ; সার্ভিস বন্ধ থাকলে
 *    ইন-মেমরি ফলব্যাক (সেশন-স্কোপ)।
 *  - ট্যাগ/শ্রেণি/বিষয়/জটিলতা/ধরন ইনডেক্সে ছাঁকনি → প্রশ্নপত্রে টানা (দিন ৬৬), সেট-A/B মিক্স
 *    (দিন ৬৭)।
 *  - প্রশ্নপত্রে টানা = BankQuestion[] → QpSection → QuestionPaper — QP-স্টুডিওর পুরো
 *    রেন্ডার-পাইপলাইন (৯ ফরম্যাট, চিত্র-ইঞ্জিন, পেইনেশন) অক্ষত পুনঃব্যবহার।
 */

import { db, newId } from './dexie';
import { toBanglaNumber } from './bangla';
import {
  paperToEditorHtml,
  type QpMeta,
  type QuestionPaper,
  type QpOption,
  type QpQKind,
  type QpQuestion,
  type QpSubQ,
  type QpPair,
} from './question-paper';
import type { Lang } from './i18n';

// ─── ডেটা-মডেল ───

export type BankDifficulty = 'easy' | 'medium' | 'hard';
export type BankType = QpQKind; // 'short' | 'mcq' | 'creative' | 'match' | 'tf' | 'blank'

/**
 * একটি ব্যাংক-প্রশ্ন — QpQuestion-এর সুপার-সেট নয়, বরং প্রজেক্ট-নিরপেক্ষ সহ-ভাই।
 * options/subs/pairs ধরন-অনুযায়ী বসে (mcq → options, creative → subs, match → pairs)।
 */
export interface QuestionBankRecord {
  id: string;
  type: BankType;
  text: string;
  /** mcq-অপশন ('ক'/'খ'… লেবেল নিজে থেকে বসে) */
  options?: Array<{ text: string }>;
  /** creative-উপপ্রশ্ন (জ্ঞানমূলক/অনুধাবন/… নোটসহ) */
  subs?: Array<{ text: string; marks: string }>;
  /** match-জোড়া */
  pairs?: QpPair[];
  /** উত্তর (উত্তরপত্র/মিক্স-জেনারেটরের জন্য; প্রশ্নপত্রে ছাপা হয় না) */
  answer?: string;
  /** নম্বর (ডিফল্ট ১) */
  marks: number;
  /** শ্রেণি — যেকোনো লেবেল ('নবম-দশম', 'Class 8', 'অনার্স' …) */
  className: string;
  /** বিষয় — যেকোনো লেবেল ('গণিত', 'বিজ্ঞান' …) */
  subject: string;
  tags: string[];
  difficulty: BankDifficulty;
  createdAt: number;
  updatedAt: number;
}

export interface BankFilter {
  className?: string;
  subject?: string;
  difficulty?: BankDifficulty | 'all';
  type?: BankType | 'all';
  /** অবশ্য-থাকা ট্যাগ (যেকোনো একটি মিললেই যথেষ্ট) */
  tags?: string[];
  /** ফ্রি-টেক্সট খোঁজা (text/answer/ট্যাগ) */
  q?: string;
}

// ─── ইন-মেমরি ফলব্যাক (IndexedDB অনুপলব্ধ — প্রাইভেট মোড ইত্যাদি) ───

let memoryBank: QuestionBankRecord[] = [];

async function memoryList(): Promise<QuestionBankRecord[]> {
  return [...memoryBank].sort((a, b) => b.updatedAt - a.updatedAt);
}

// ─── CRUD + ছাঁকনি ───

export async function listBankQuestions(filter: BankFilter = {}): Promise<QuestionBankRecord[]> {
  let rows: QuestionBankRecord[];
  try {
    rows = await db.questions.orderBy('updatedAt').reverse().toArray();
  } catch {
    rows = await memoryList();
  }
  const q = filter.q?.trim().toLowerCase();
  return rows.filter((r) => {
    if (filter.className && r.className !== filter.className) return false;
    if (filter.subject && r.subject !== filter.subject) return false;
    if (filter.difficulty && filter.difficulty !== 'all' && r.difficulty !== filter.difficulty) return false;
    if (filter.type && filter.type !== 'all' && r.type !== filter.type) return false;
    if (filter.tags?.length && !filter.tags.some((t) => r.tags.includes(t))) return false;
    if (q) {
      const hay = `${r.text} ${r.answer ?? ''} ${r.tags.join(' ')} ${r.className} ${r.subject}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export async function saveBankQuestion(
  input: Omit<QuestionBankRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Promise<QuestionBankRecord> {
  const now = Date.now();
  const existing = input.id
    ? (await db.questions.get(input.id).catch(() => undefined)) ?? memoryBank.find((r) => r.id === input.id)
    : undefined;
  const rec: QuestionBankRecord = {
    ...input,
    id: existing?.id ?? newId('q'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  try {
    await db.questions.put(rec);
  } catch {
    memoryBank = [...memoryBank.filter((r) => r.id !== rec.id), rec];
  }
  return rec;
}

export async function deleteBankQuestion(id: string): Promise<void> {
  try {
    await db.questions.delete(id);
  } catch {
    memoryBank = memoryBank.filter((r) => r.id !== id);
  }
}

export async function deleteBankQuestions(ids: string[]): Promise<void> {
  try {
    await db.questions.bulkDelete(ids);
  } catch {
    memoryBank = memoryBank.filter((r) => !ids.includes(r.id));
  }
}

/** ছাঁকনি-অনুযায়ী চালু মানগুলো (শ্রেণি/বিষয় ড্রপডাউন ভরাট) */
export async function bankFacets(): Promise<{ classNames: string[]; subjects: string[]; tags: string[] }> {
  let rows: QuestionBankRecord[];
  try {
    rows = await db.questions.toArray();
  } catch {
    rows = await memoryBank;
  }
  const uniq = (arr: string[]) => [...new Set(arr.filter(Boolean))].sort();
  return {
    classNames: uniq(rows.map((r) => r.className)),
    subjects: uniq(rows.map((r) => r.subject)),
    tags: uniq(rows.flatMap((r) => r.tags)),
  };
}

// ─── স্টার্টার প্রশ্ন (নমুনা — প্যাক-ইকোসিস্টেমের স্টার্টার-প্যাক প্যাটার্ন) ───

export const BANK_SEED_KEY = 'bps.qbank.seeded.v1';

export async function seedStarterQuestionsOnce(): Promise<number> {
  try {
    if (window.localStorage.getItem(BANK_SEED_KEY) === '1') return 0;
  } catch { /* প্রাইভেট মোড */ }
  const samples: Array<Omit<QuestionBankRecord, 'id' | 'createdAt' | 'updatedAt'>> = [
    {
      type: 'mcq',
      text: 'বাংলা বর্ণমালায় স্বরবর্ণ কয়টি?',
      options: [{ text: '১০টি' }, { text: '১১টি' }, { text: '১২টি' }, { text: '১৩টি' }],
      answer: '১১টি',
      marks: 1,
      className: 'নবম-দশম',
      subject: 'বাংলা',
      tags: ['ব্যাকরণ'],
      difficulty: 'easy',
    },
    {
      type: 'short',
      text: 'বৃত্তের ক্ষেত্রফলের সূত্র লেখো এবং প্রতীকগুলোর অর্থ ব্যাখ্যা করো।',
      answer: 'ক্ষেত্রফল = πr²; π ধ্রুবক, r ব্যাসার্ধ।',
      marks: 2,
      className: 'নবম-দশম',
      subject: 'গণিত',
      tags: ['জ্যামিতি'],
      difficulty: 'medium',
    },
    {
      type: 'creative',
      text: 'বিদ্যুৎ সাশ্রয়ের উপায় ব্যাখ্যা করো।',
      subs: [
        { text: 'জ্ঞানমূলক: বিদ্যুৎ উৎপাদনের মূল উৎস কী?', marks: '১' },
        { text: 'অনুধাবন: LED বাতি কেন কম বিদ্যুৎ খরচ করে?', marks: '২' },
        { text: 'প্রয়োগ: তোমার বাড়িতে কীভাবে বিল কমাবে?', marks: '৩' },
      ],
      marks: 5,
      className: 'নবম-দশম',
      subject: 'বিজ্ঞান',
      tags: ['পদার্থবিজ্ঞান'],
      difficulty: 'hard',
    },
    {
      type: 'blank',
      text: 'পানির রাসায়নিক সংকেত ______।',
      answer: 'H₂O',
      marks: 1,
      className: 'ষষ্ঠ-অষ্টম',
      subject: 'বিজ্ঞান',
      tags: ['রসায়ন'],
      difficulty: 'easy',
    },
  ];
  let added = 0;
  for (const s of samples) {
    await saveBankQuestion(s);
    added += 1;
  }
  try { window.localStorage.setItem(BANK_SEED_KEY, '1'); } catch { /* প্রাইভেট */ }
  return added;
}

// ─── ব্যাংক → প্রশ্নপত্র (QP পাইপলাইন পুনঃব্যবহার) ───

const MCQ_LABELS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

/** ব্যাংক-প্রশ্ন → QpQuestion (নম্বর বাংলা অঙ্কে; ধরন-ভিত্তিক ফিল্ড) */
export function bankToQpQuestion(q: QuestionBankRecord, no: number): QpQuestion {
  const num = toBanglaNumber(no);
  const base: QpQuestion = { number: num, text: q.text, marks: String(q.marks), options: [], subs: [] };
  if (q.type === 'mcq' && q.options?.length) {
    base.options = q.options.slice(0, MCQ_LABELS.length).map((o, i): QpOption => ({ label: MCQ_LABELS[i], text: o.text }));
    base.kind = 'mcq';
  } else if (q.type === 'creative' && q.subs?.length) {
    base.subs = q.subs.map((s): QpSubQ => ({ text: s.text, marks: String(s.marks) }));
    base.kind = 'creative';
  } else if (q.type === 'match' && q.pairs?.length) {
    base.pairs = q.pairs;
    base.kind = 'match';
  } else {
    base.kind = q.type === 'tf' || q.type === 'blank' ? q.type : 'short';
  }
  return base;
}

/**
 * নির্বাচিত ব্যাংক-প্রশ্ন → সম্পূর্ণ QuestionPaper (একটি অংশে সাজানো)।
 * metaOverrides থেকে স্কুল/পরীক্ষা/বিষয়/শ্রেণি আসে — খালি হলে নিরপেক্ষ ডিফল্ট।
 */
export function buildPaperFromBank(
  questions: QuestionBankRecord[],
  metaOverrides: Partial<QpMeta> = {},
): QuestionPaper {
  const sorted = [...questions].sort((a, b) => a.updatedAt - b.updatedAt);
  const totalMarks = sorted.reduce((sum, q) => sum + (Number(q.marks) || 0), 0);
  return {
    meta: {
      schoolName: metaOverrides.schoolName ?? '',
      examTitle: metaOverrides.examTitle ?? 'প্রশ্ন-ভান্ডার থেকে নির্বাচিত প্রশ্ন',
      subject: metaOverrides.subject ?? '',
      classLabel: metaOverrides.classLabel ?? '',
      date: '',
      time: metaOverrides.time ?? '',
      fullMarks: metaOverrides.fullMarks ?? (totalMarks ? String(totalMarks) : ''),
      instructions: metaOverrides.instructions ?? [],
      subjectCode: '',
      setCode: metaOverrides.setCode ?? '',
      syllabusNote: '',
      studentLine: metaOverrides.studentLine ?? false,
    },
    sections: sorted.length
      ? [{ title: '', note: '', questions: sorted.map((q, i) => bankToQpQuestion(q, i + 1)) }]
      : [],
    format: 'classic',
  };
}

/** প্রশ্নপত্র-এইচটিএমএল (এডিটর-বসানো চুক্তি) — QP-স্টুডিওর paperToEditorHtml-এর সরাসরি পুনঃব্যবহার */
export function bankPaperToEditorHtml(paper: QuestionPaper, lang: Lang): string {
  return paperToEditorHtml(paper, lang);
}
