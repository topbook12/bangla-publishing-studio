/**
 * থিসিস স্টুডিও ডায়ালগ — প্রফেশনাল গবেষণাপত্র নির্মাণ (Thesis Studio)
 * ─────────────────────────────────────────────────────────────────────
 * ট্যাব ১ "নির্মাণ": ভাষা/স্তর/শৃঙ্খলা + মেটা-তথ্য (বিশ্ববিদ্যালয় দ্রুত-পূরণ,
 *   উদাহরণ-ফিল) → বিশ্ববিদ্যালয়-স্ট্যান্ডার্ড সম্পূর্ণ কাঠামো (শিরোনাম পাতা →
 *   উৎসর্গ → … → পরিশিষ্ট) এডিটেবল পাতা হিসেবে — পৃষ্ঠা-নম্বর স্কিমসহ
 *   (প্রারম্ভিক রোমান i, ii → অধ্যায় থেকে ১, ২, ৩)। নিচে চিত্র/টেবিল
 *   ক্যাপশন-টুল (চিত্র ৩.১ স্টাইল)।
 * ট্যাব ২ "সূত্র": APA 7 / MLA 9 / Harvard / Chicago / IEEE — ফরম্যাট-নির্ভুল
 *   এন্ট্রি + in-text উদ্ধৃতি + সূত্র-লাইব্রেরি (জমা রাখা এন্ট্রি শেষে
 *   বর্ণানুক্রমে সাজানো তালিকা হিসেবে একবারে বসানো)।
 * ট্যাব ৩ "AI খসড়া": সেকশন-ধরন (সারসংক্ষেপ/ভূমিকা/সাহিত্য…) + বিষয় + পয়েন্ট
 *   → AI একাডেমিক খসড়া লিখে দেয় — সম্পাদনা করে কার্সরে বসানো যায়।
 * ট্যাব ৪ "গাইড": মার্জিন-ফন্ট-নম্বর-স্টাইলের স্ট্যান্ডার্ড নিয়মাবলি।
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck, BookMarked, Check, Copy, Eraser, GraduationCap, Loader2, PenLine,
  Plus, ScrollText, Sparkles, Tag, Trash2, Wand2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import { getEditor, insertBlocksAtCursor } from '@/lib/editor-registry';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { PTile, PHero, PSection, type PTone } from '@/components/premium';
import { callAi } from '@/lib/ai-client';
import {
  buildThesisPages, thesisFormatPreset, THESIS_MARGINS, THESIS_ACCENT,
  DEFAULT_THESIS_OPTIONS, formatReference, formatInText, formatReferenceLibrary, citeLibMixed,
  EMPTY_CITE, CITE_STYLE_NAMES, CITE_TYPE_NAMES, BD_UNIVERSITIES, exampleMeta, captionHtml,
} from '@/lib/thesis';
import { refreshTocsNow } from '@/lib/toc';
import type {
  ThesisLang, ThesisLevel, ThesisDiscipline, ThesisOptions, CiteEntry, CiteStyle, CiteType,
} from '@/lib/thesis';
import { ensurePageEditorMounted } from '@/components/editor/page-ops';

type Tab = 'build' | 'cite' | 'draft' | 'guide';
type DraftSection = 'abstract' | 'intro' | 'literature' | 'method' | 'results' | 'conclusion';
type DraftLen = 'short' | 'medium' | 'long';

const LIB_KEY = 'tps.thesis.citeLib.v1';

const STRUCTURE: Array<{ id: keyof ThesisOptions; key: string }> = [
  { id: 'dedication', key: 'thesis.opt.dedication' },
  { id: 'declaration', key: 'thesis.opt.declaration' },
  { id: 'certificate', key: 'thesis.opt.certificate' },
  { id: 'acknowledgment', key: 'thesis.opt.acknowledgment' },
  { id: 'abstract', key: 'thesis.opt.abstract' },
  { id: 'toc', key: 'thesis.opt.toc' },
  { id: 'lists', key: 'thesis.opt.lists' },
  { id: 'abbreviations', key: 'thesis.opt.abbreviations' },
  { id: 'references', key: 'thesis.opt.references' },
  { id: 'appendix', key: 'thesis.opt.appendix' },
];

/** সূত্র-ফিল্ড — types দেওয়া থাকলে শুধু সেই ধরনের ফরমেই দেখায় (Website-এ Edition নয়) */
const CITE_FIELDS: Array<{ id: keyof CiteEntry; key: string; ph?: string; types?: CiteType[] }> = [
  { id: 'authors', key: 'thesis.cite.fAuthors', ph: 'thesis.cite.fAuthors.ph' },
  { id: 'year', key: 'thesis.cite.fYear' },
  { id: 'title', key: 'thesis.cite.fTitle' },
  { id: 'container', key: 'thesis.cite.fContainer', types: ['journal', 'website', 'newspaper'] },
  { id: 'publisher', key: 'thesis.cite.fPublisher', types: ['book', 'thesis', 'report'] },
  { id: 'place', key: 'thesis.cite.fPlace', types: ['book', 'thesis', 'report'] },
  { id: 'volume', key: 'thesis.cite.fVolume', types: ['journal'] },
  { id: 'issue', key: 'thesis.cite.fIssue', types: ['journal'] },
  { id: 'pages', key: 'thesis.cite.fPages', types: ['book', 'journal', 'newspaper'] },
  { id: 'edition', key: 'thesis.cite.fEdition', types: ['book'] },
  { id: 'doi', key: 'thesis.cite.fDoi', types: ['journal', 'report'] },
  { id: 'url', key: 'thesis.cite.fUrl', types: ['journal', 'website', 'newspaper', 'report'] },
  { id: 'accessed', key: 'thesis.cite.fAccessed', types: ['website'] },
];

const citeFieldsFor = (t: CiteType) => CITE_FIELDS.filter((f) => !f.types || f.types.includes(t));

const GUIDE_ITEMS: Array<{ icon: typeof Check; key: string }> = [
  { icon: ScrollText, key: 'thesis.guide.margins' },
  { icon: BookMarked, key: 'thesis.guide.typo' },
  { icon: ScrollText, key: 'thesis.guide.numbering' },
  { icon: BookMarked, key: 'thesis.guide.chapters' },
  { icon: ScrollText, key: 'thesis.guide.toc' },
  { icon: BookMarked, key: 'thesis.guide.cite' },
  { icon: ScrollText, key: 'thesis.guide.figs' },
  { icon: Wand2, key: 'thesis.guide.tools' },
  { icon: Check, key: 'thesis.guide.check' },
];

/** গাইড-আইটেমের টাইল-টোন — চক্রাকারে বর্ণাঢ্য (violet→amber→fuchsia→teal→emerald) */
const GUIDE_TONES: PTone[] = ['violet', 'amber', 'fuchsia', 'teal', 'emerald'];

const CITE_STYLES = new Set(Object.keys(CITE_STYLE_NAMES));
const CITE_TYPES = new Set(Object.keys(CITE_TYPE_NAMES));

/** সব ফিল্ডই টেক্সট — keyof-সূচিত লেখায় type/style (লিটারাল-ইউনিয়ন) বাদ রাখতে এই তালিকা */
const CITE_TEXT_KEYS = [
  'authors', 'year', 'title', 'container', 'publisher', 'place',
  'volume', 'issue', 'pages', 'url', 'accessed', 'doi', 'edition',
] as const;

/**
 * localStorage-আসা লাইব্রেরি-এন্ট্রির স্বাভাবিকীকরণ — পুরনো/ভাঙা স্কিমা থাকলে
 * formatReference-এর e.authors.replace() ক্র্যাশ করত এবং IEEE-নম্বর এদিক-ওদিক হত।
 * ইঞ্জিনের নিয়মেই অসম্পূর্ণ এন্ট্রি (শিরোনাম/বছর নেই) বাদ।
 */
function sanitizeLibEntry(e: unknown): CiteEntry | null {
  if (!e || typeof e !== 'object') return null;
  const rec = e as Record<string, unknown>;
  const out = { ...EMPTY_CITE };
  CITE_TEXT_KEYS.forEach((k) => {
    if (typeof rec[k] === 'string') out[k] = rec[k];
  });
  if (!CITE_STYLES.has(out.style)) out.style = 'apa';
  if (!CITE_TYPES.has(out.type)) out.type = 'book';
  if (!out.title.trim() || !out.year.trim()) return null;
  return out;
}

const DRAFT_SECTIONS: Array<{ id: DraftSection; key: string }> = [
  { id: 'abstract', key: 'thesis.draft.sec.abstract' },
  { id: 'intro', key: 'thesis.draft.sec.intro' },
  { id: 'literature', key: 'thesis.draft.sec.literature' },
  { id: 'method', key: 'thesis.draft.sec.method' },
  { id: 'results', key: 'thesis.draft.sec.results' },
  { id: 'conclusion', key: 'thesis.draft.sec.conclusion' },
];

/** HTML-escape — AI খসড়া প্যারায় বসানোর আগে */
const escHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** AI-এর প্লেইন-টেক্সট উত্তর → প্যারাগ্রাফ-HTML (markdown-চিহ্ন পরিষ্কার) */
function draftToHtml(text: string): string {
  const cleaned = text.replace(/^#{1,6}\s*/gm, '').replace(/\*\*/g, '').replace(/\*/g, '');
  const paras = cleaned.split(/\n\s*\n/).map((p) => p.replace(/\n/g, ' ').trim()).filter(Boolean);
  if (paras.length === 0) return '';
  return paras.map((p) => `<p>${escHtml(p)}</p>`).join('');
}

// ─── AI খসড়া-প্রম্পট (সেকশন-ধরন অনুযায়ী নির্দেশনা) ───

function draftInstruction(section: DraftSection, lang: ThesisLang): string {
  const bn: Record<DraftSection, string> = {
    abstract: '"সারসংক্ষেপ (Abstract)" অংশটি লিখুন — গবেষণার উদ্দেশ্য, পদ্ধতি, প্রধান ফলাফল ও উপসংহার একসাথে, এক প্রবাহমান অনুচ্ছেদে।',
    intro: '"ভূমিকা" অধ্যায়ের খসড়া লিখুন — ব্যাপক পটভূমি থেকে শুরু করে সমস্যা নির্ধারণ, উদ্দেশ্য ও পরিসর পর্যন্ত প্রবাহমান অনুচ্ছেদে।',
    literature: '"সাহিত্য-পর্যালোচনা" অংশের খসড়া লিখুন — তালিকা নয়, থিম-ভিত্তিক সংশ্লেষণ; শেষে গবেষণার ঘাটতি স্পষ্ট করুন।',
    method: '"গবেষণা পদ্ধতি" অংশের খসড়া লিখুন — গবেষণা নকশা, নমুনা, উপাত্ত-সংগ্রহ ও বিশ্লেষণ পদ্ধতি ধারাবাহিকভাবে।',
    results: '"ফলাফল ও আলোচনা" অংশের খসড়া লিখুন — ফলাফল উপস্থাপনা ও পূর্ববর্তী গবেষণার সাথে তুলনামূলক আলোচনা।',
    conclusion: '"উপসংহার" অংশের খসড়া লিখুন — মূল ফলাফলের সার, তাৎপর্য ও ব্যবহারিক সুপারিশ।',
  };
  const en: Record<DraftSection, string> = {
    abstract: 'Write the "Abstract" section — purpose, methodology, key findings and conclusion together, in one flowing paragraph.',
    intro: 'Write a draft of the "Introduction" chapter — from the broad background through the problem statement, objectives and scope, in flowing paragraphs.',
    literature: 'Write a draft of the "Literature Review" section — a theme-based synthesis (not a list of studies), ending with the research gap.',
    method: 'Write a draft of the "Research Methodology" section — design, sample, data collection and analysis, in sequence.',
    results: 'Write a draft of the "Results and Discussion" section — presentation of findings and comparative discussion with prior studies.',
    conclusion: 'Write a draft of the "Conclusion" section — summary of key findings, significance and practical recommendations.',
  };
  return lang === 'en' ? en[section] : bn[section];
}

function draftSystem(lang: ThesisLang): string {
  return lang === 'en'
    ? [
        'You are an academic thesis-writing assistant for university students and teachers.',
        'Write in formal academic English, third person, in coherent paragraphs.',
        'NEVER fabricate citations, statistics, data or references. Where a source is needed, write the placeholder (citation) instead of inventing one.',
        'Output plain text paragraphs separated by blank lines. No markdown, no headings, no bullet lists.',
        'Respect the requested length within ±20%.',
      ].join(' ')
    : [
        'আপনি বিশ্ববিদ্যালয়ের শিক্ষার্থী ও শিক্ষকদের জন্য একজন একাডেমিক থিসিস-লেখা সহকারী।',
        'প্রমিত বাংলায় একাডেমিক রীতিতে, তৃতীয় পুরুষে, সুগঠিত অনুচ্ছেদে লিখুন।',
        'কখনো বানিয়ে সূত্র, পরিসংখ্যান বা তথ্যসূত্র দেবেন না। সূত্র দরকার হলে শুধু (সূত্র) লিখুন — বানিয়ে নয়।',
        'উত্তর সাদামাটা টেক্সট অনুচ্ছেদে দিন, অনুচ্ছেদের মাঝে ফাঁকা লাইন। কোনো markdown, শিরোনাম-চিহ্ন বা বুলেট নয়।',
        'চাওয়া দৈর্ঘ্য ±২০%-এর মধ্যে রাখুন।',
      ].join(' ');
}

const LEN_WORD: Record<DraftLen, { bn: string; en: string }> = {
  short: { bn: '১৫০ শব্দের কাছাকাছি রাখুন।', en: 'Keep it close to 150 words.' },
  medium: { bn: '৩০০ শব্দের কাছাকাছি রাখুন।', en: 'Keep it close to 300 words.' },
  long: { bn: '৬০০ শব্দের কাছাকাছি রাখুন।', en: 'Keep it close to 600 words.' },
};

export function ThesisDialog() {
  const open = useUiStore((s) => s.openDialog === 'thesis');
  const close = useUiStore((s) => s.close);
  const tt = useT();

  // ── নির্মাণ-স্টেট ──
  const [tab, setTab] = useState<Tab>('build');
  const [lang, setLang] = useState<ThesisLang>('bn');
  const [level, setLevel] = useState<ThesisLevel>('masters');
  const [discipline, setDiscipline] = useState<ThesisDiscipline>('science');
  const [title, setTitle] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [author, setAuthor] = useState('');
  const [roll, setRoll] = useState('');
  const [session, setSession] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [date, setDate] = useState('');
  const [dedicationText, setDedicationText] = useState('');
  const [opts, setOpts] = useState<ThesisOptions>({ ...DEFAULT_THESIS_OPTIONS });
  const [busy, setBusy] = useState(false);
  const [libClearArmed, setLibClearArmed] = useState(false);

  // ── সূত্র-স্টেট + লাইব্রেরি (localStorage-এ টেকে) ──
  const [cite, setCite] = useState<CiteEntry>({ ...EMPTY_CITE });
  const [lib, setLib] = useState<CiteEntry[]>([]);

  useEffect(() => {
    if (!open) {
      setLibClearArmed(false);
      return;
    }
    // নতুন সেশন — ক্ষণস্থায়ী অবস্থা রিসেট (মেটা-ফিল্ড টিকে থাকে — সুবিধা)
    setCapSerial('1');
    setCapText('');
    setCapSource('');
    setDraftOut('');
    try {
      const raw = localStorage.getItem(LIB_KEY);
      if (raw) {
        const arr: unknown = JSON.parse(raw);
        if (Array.isArray(arr)) {
          // পুরনো/ভাঙা স্কিমা-সুরক্ষা — ভাঙা এন্ট্রি ক্র্যাশ বা ভুল IEEE-নম্বর দেবে না;
          // অসম্পূর্ণ এন্ট্রি ইঞ্জিনের (formatReferenceLibrary) মতোই বাদ
          setLib(arr.map(sanitizeLibEntry).filter((e): e is CiteEntry => e !== null));
        }
      }
    } catch { /* করাপ্ট লাইব্রেরি — খালি থাকুক */ }
  }, [open]);

  const persistLib = (next: CiteEntry[]) => {
    setLib(next);
    try {
      localStorage.setItem(LIB_KEY, JSON.stringify(next));
    } catch { /* স্টোরেজ পূর্ণ/ব্লকড — মেমোরিতেই থাকুক */ }
  };

  const citeValid = cite.title.trim().length > 0 && cite.year.trim().length > 0;
  const refHtml = useMemo(() => (citeValid ? formatReference(cite) : ''), [cite, citeValid]);
  // ইঞ্জিন (formatReferenceLibrary) যেমন করে তেমন শুধু সম্পূর্ণ এন্ট্রির উপর সূচি —
  // নইলে অসম্পূর্ণ এন্ট্রি আগে থাকলে IEEE in-text নম্বর ও বসানো তালিকা আলাদা হয়ে যেত
  const libValid = useMemo(() => lib.filter((e) => e.title.trim() && e.year.trim()), [lib]);
  const libHasCite = useMemo(
    () => libValid.findIndex((e) => e.style === cite.style && e.title.trim() === cite.title.trim() && e.year.trim() === cite.year.trim()),
    [libValid, cite],
  );
  // IEEE in-text — লাইব্রেরিতে থাকলে সেই ক্রম-নম্বর, নইলে পরের নম্বর-প্রিভিউ।
  // নম্বর = IEEE-এন্ট্রিগুলোর মধ্যে ক্রম — formatReferenceLibrary-এর ++n-এর সাথে হুবহু
  // মিল (আগে সব এন্ট্রি গণনা হত, মিশ্র-স্টাইল লাইব্রেরিতে APA-এন্ট্রি নম্বর সরিয়ে দিত)
  const inText = useMemo(() => {
    if (!citeValid) return '';
    if (cite.style !== 'ieee') return formatInText(cite);
    let n: number;
    if (libHasCite >= 0) {
      n = 0;
      for (let i = 0; i <= libHasCite; i++) if (libValid[i].style === 'ieee') n++;
    } else {
      n = libValid.filter((e) => e.style === 'ieee').length + 1;
    }
    return formatInText(cite, n);
  }, [cite, citeValid, libValid, libHasCite]);
  const libHtml = useMemo(() => formatReferenceLibrary(lib), [lib]);
  const libMixed = useMemo(() => citeLibMixed(lib), [lib]);

  const patchCite = (id: keyof CiteEntry, v: string) => setCite((prev) => ({ ...prev, [id]: v }));
  // ধরন বদলে নতুন ধরনের অপ্রাসঙ্গিক ফিল্ড ফাঁকা — নইলে লুকানো পুরনো মান (যেমন
  // জার্নালের DOI/খণ্ড) বই/থিসিস-এন্ট্রির ফরম্যাট-আউটপুটে নিঃশব্দে ঢুকে যেত
  const setCiteType = (ct: CiteType) => {
    const allowed = new Set(citeFieldsFor(ct).map((f) => f.id));
    setCite((prev) => {
      const next: CiteEntry = { ...prev, type: ct };
      CITE_TEXT_KEYS.forEach((k) => {
        if (!allowed.has(k)) next[k] = '';
      });
      return next;
    });
  };

  // ── ক্যাপশন-স্টেট ──
  const [capKind, setCapKind] = useState<'figure' | 'table'>('figure');
  const [capChapter, setCapChapter] = useState('1');
  const [capSerial, setCapSerial] = useState('1');
  const [capText, setCapText] = useState('');
  const [capSource, setCapSource] = useState('');

  // ── AI খসড়া-স্টেট ──
  const [draftSection, setDraftSection] = useState<DraftSection>('abstract');
  const [draftTopic, setDraftTopic] = useState('');
  const [draftPoints, setDraftPoints] = useState('');
  const [draftLen, setDraftLen] = useState<DraftLen>('medium');
  const [draftBusy, setDraftBusy] = useState(false);
  const [draftOut, setDraftOut] = useState('');

  const insertAtCursor = (html: string) => {
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (!ed || ed.isDestroyed) {
      toast.error(tt('ai.noEditor'));
      return false;
    }
    // Word-অনুরূপ: প্রথম ব্লকের শুরুতে বসালে ফাঁকা শিরোনাম না রেখে ব্লকের আগে বসে
    return insertBlocksAtCursor(ed, html);
  };

  // ── থিসিস কাঠামো নির্মাণ ──
  const generate = async () => {
    if (!title.trim()) {
      toast.info(tt('thesis.err.noTitle'));
      return;
    }
    setBusy(true);
    try {
      const meta = {
        lang, level, discipline,
        title: title.trim(),
        university: university.trim(),
        department: department.trim(),
        author: author.trim(),
        roll: roll.trim(),
        session: session.trim(),
        supervisor: supervisor.trim(),
        degreeName: degreeName.trim(),
        date: date.trim(),
        dedicationText,
      };
      const pages = buildThesisPages(meta, opts);

      const s = useEditorStore.getState();

      // প্রথম-ব্যবহারের অতিথি-পাতা (স্বাগতম-নির্দেশনা বা ফাঁকা প্রথম পাতা) এখনো
      // অস্পৃশ্য থাকলে সরিয়ে ফেলুন — থিসিসটি যেন পুরো ডকুমেন্ট হয়; নইলে অটো-সূচিপত্র
      // স্বাগতম-পাতার শিরোনামও তুলে নেয় এবং রানিং-হেডার/পৃষ্ঠা-স্কিম মিশে যায়।
      // (কাঠামো ঢোকানোর পরে ডকুমেন্টে ১৫+ পাতা থাকে — তাই deletePage আটকাবে না।)
      const firstPage = s.pages[0];
      const firstUntouched = firstPage
        && (firstPage.html.includes('বাংলা পাবলিশিং স্টুডিওতে স্বাগতম')
          || firstPage.html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '');
      const welcomePageId = firstPage && firstUntouched ? firstPage.id : null;

      // ডকুমেন্ট-স্তরের অ্যাকশন — সম্পূর্ণ কাঠামো সম্পূর্ণ ডকুমেন্টের শেষে যোগ হয়।
      // activePageId-এর পরে বসালে মাঝ-ডকুমেন্টে কাঠামো ঢুকে চলমান লেখা দু-ভাগ হয়ে
      // যায় (যেমন: রেফারেন্স ও পরিশিষ্টের মাঝে) — তাই শেষ পাতার পরেই বসানো নিরাপদ।
      let after = s.pages[s.pages.length - 1]?.id ?? null;
      const firstId = (() => {
        const id = s.addPage(after, pages[0].html);
        s.updatePage(id, { noChrome: pages[0].noChrome, numberRestart: pages[0].numberRestart ?? null });
        return id;
      })();
      after = firstId;
      for (let i = 1; i < pages.length; i++) {
        const id = s.addPage(after, pages[i].html);
        s.updatePage(id, { noChrome: pages[i].noChrome, numberRestart: pages[i].numberRestart ?? null });
        after = id;
      }

      // স্ট্যান্ডার্ড থিসিস ফরম্যাট (মার্জিন/ফন্ট/স্পেসিং) — চাইলে
      if (opts.applyFormat) {
        const preset = thesisFormatPreset(lang);
        useEditorStore.getState().updateSettings({ ...preset, margins: { ...THESIS_MARGINS } });
      }

      // অতিথি-স্বাগতম পাতা এখন সরানো নিরাপদ (ডকুমেন্টে থিসিসের ১৫+ পাতা আছে)
      if (welcomePageId) s.deletePage(welcomePageId);

      // রানিং-হেডার থিসিস-রীতিতে — বাঁয়ে ফাঁকা, ডানে থিসিসের শিরোনাম (পুরনো
      // "অধ্যায় ১ — ভূমিকা"-জাতীয় বাসি হেডার প্রতিটি পাতায় দেখাত না)
      const st = useEditorStore.getState();
      if (st.settings.header.enabled) {
        const shortTitle = meta.title.length > 68 ? `${meta.title.slice(0, 66).trimEnd()}…` : meta.title;
        st.updateSettings({
          header: { ...st.settings.header, leftText: '', centerText: '', rightText: shortTitle, accentColor: THESIS_ACCENT },
        });
      }

      // সূচিপত্র সঙ্গে সঙ্গে ভরাট — ডিবাউন্স-অপেক্ষা নয়; কাঠামো ঢোকার পরেই
      // নির্ধারিত এক-রান (নইলে খালি-সূচির ফ্ল্যাশ দেখা যায়)
      refreshTocsNow();

      toast.success(tt('thesis.toast.built').replace('{n}', String(pages.length)));
      close();

      // প্রথম নতুন পাতায় নেভিগেট + এডিটর মাউন্ট নিশ্চিত
      const s2 = useEditorStore.getState();
      const idx = s2.pages.findIndex((p) => p.id === firstId);
      if (idx >= 0) {
        document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
        void ensurePageEditorMounted(firstId);
      }
    } catch (err) {
      // অর্ধনির্মিত কাঠামো + নীরব ব্যর্থতা নয় — ব্যবহারকারী জানুক, লগ থাকুক
      console.error('[thesis] generate failed:', err);
      toast.error(tt('thesis.err.generate'));
    } finally {
      setBusy(false);
    }
  };

  const copyText = (text: string, plainHtml: string) => {
    // ক্লিপবোর্ডে ফরম্যাট-সহ HTML + প্লেইন উভয়ই — প্রমিশ রিজেক্ট হলে প্লেইন-ফলব্যাক;
    // "কপি হয়েছে" টোস্ট কেবল সত্যিই কপি হলে (আগে ব্যর্থতাতেও সফল-টোস্ট দেখাত)
    const copied = () => toast.success(tt('thesis.cite.copied'));
    const writePlain = () => {
      navigator.clipboard.writeText(text).then(copied, () => { /* ব্যবহারকারী নাকচ করেছেন */ });
    };
    try {
      navigator.clipboard
        .write([
          new ClipboardItem({
            'text/html': new Blob([plainHtml], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' }),
          }),
        ])
        .then(copied, writePlain);
    } catch {
      // ClipboardItem নেই (পুরনো Firefox) — সিঙ্ক্রোনাস প্লেইন-ফলব্যাক
      writePlain();
    }
  };

  const fillExample = () => {
    const ex = exampleMeta(lang, discipline);
    setTitle(ex.title);
    setUniversity(ex.university);
    setDepartment(ex.department);
    setAuthor(ex.author);
    setRoll(ex.roll);
    setSession(ex.session);
    setSupervisor(ex.supervisor);
    setDegreeName('');
    setDate(ex.date);
    setDedicationText(ex.dedicationText);
    toast.success(tt('thesis.example.filled'));
  };

  const addLibEntry = () => {
    if (!citeValid) {
      toast.info(tt('thesis.cite.needTitle'));
      return;
    }
    const entry: CiteEntry = { ...cite };
    persistLib([...lib, entry]);
    toast.success(tt('thesis.cite.libSaved').replace('{n}', String(lib.length + 1)));
  };

  const insertAllLib = () => {
    if (libHtml.length === 0) return;
    if (insertAtCursor(libHtml.join(''))) {
      // গণনা ফিল্টার-পরবর্তী সত্যিকারের সংখ্যা — lib.length নয় (অসম্পূর্ণ এন্ট্রি বাদ যায়)
      toast.success(tt('thesis.cite.libInserted').replace('{n}', String(libHtml.length)));
      close();
    }
  };

  // ── AI খসড়া তৈরি ──
  // সেকশন বদলালে পুরনো খসড়া পর্দায় থেকে গেলে ভুল অংশ ঢোকার ঝুঁকি — পরিষ্কার করুন
  useEffect(() => {
    setDraftOut('');
  }, [draftSection, draftLen]);
  const generateDraft = async () => {
    const topic = (draftTopic.trim() || title.trim());
    if (!topic) {
      toast.info(tt('thesis.draft.err.noTopic'));
      return;
    }
    setDraftBusy(true);
    setDraftOut('');
    try {
      const points = draftPoints.trim()
        ? (lang === 'en' ? 'Key points:\n' : 'মূল পয়েন্ট:\n') + draftPoints.trim()
        : '';
      const prompt = [
        (lang === 'en' ? 'Research topic: ' : 'গবেষণার বিষয়: ') + topic,
        points,
        draftInstruction(draftSection, lang),
        LEN_WORD[draftLen][lang === 'en' ? 'en' : 'bn'],
      ].filter(Boolean).join('\n\n');

      const res = await callAi({ prompt, system: draftSystem(lang) });
      if (res.ok && res.text && res.text.trim()) {
        setDraftOut(res.text.trim());
        toast.success(tt('thesis.draft.done'));
      } else {
        toast.error(res.hintKey ? tt(res.hintKey) : (res.error || tt('thesis.draft.err.empty')));
      }
    } finally {
      setDraftBusy(false);
    }
  };

  const insertDraft = () => {
    const html = draftToHtml(draftOut);
    if (!html) return;
    if (insertAtCursor(html)) toast.success(tt('thesis.draft.inserted'));
  };

  const chipCls = (on: boolean) => cn('thesis-chip', on && 'thesis-chip-on');
  const univName = (u: { name: string; bn: string }) => (lang === 'en' ? u.name : u.bn);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="thesis-dialog max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        {/* অ্যাক্সেসিবল শিরোনাম — স্ক্রিন-রিডারের জন্য; দৃশ্যমান হিরো নিচে */}
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('thesis.title')}</DialogTitle>
          <DialogDescription>{tt('thesis.desc')}</DialogDescription>
        </DialogHeader>
        <PHero tone="purple" icon={GraduationCap} title={tt('thesis.title')} desc={tt('thesis.desc')} />

        {/* ট্যাব-বার */}
        <div className="ai-tabs" role="tablist" aria-label={tt('thesis.title')}>
          {([
            { id: 'build' as Tab, icon: GraduationCap, tone: 'violet' as PTone, label: tt('thesis.tab.build') },
            { id: 'cite' as Tab, icon: BookMarked, tone: 'amber' as PTone, label: tt('thesis.tab.cite') },
            { id: 'draft' as Tab, icon: PenLine, tone: 'fuchsia' as PTone, label: tt('thesis.tab.draft') },
            { id: 'guide' as Tab, icon: ScrollText, tone: 'teal' as PTone, label: tt('thesis.tab.guide') },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={cn('ai-tab', tab === t.id && 'ai-tab-on')}
              onClick={() => setTab(t.id)}
            >
              <PTile size="sm" tone={t.tone} icon={t.icon} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ─── ট্যাব: নির্মাণ ─── */}
        {tab === 'build' ? (
          <section role="tabpanel" aria-label={tt('thesis.tab.build')} className="flex flex-col gap-3">
            {/* ভাষা */}
            <div>
              <p className="ai-field-label mb-1.5">{tt('thesis.lang')}</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.lang')}>
                {([
                  { id: 'bn' as ThesisLang, label: 'বাংলা' },
                  { id: 'en' as ThesisLang, label: 'English' },
                ]).map((o) => (
                  <button key={o.id} type="button" className={chipCls(lang === o.id)} onClick={() => setLang(o.id)} disabled={busy}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* স্তর + শৃঙ্খলা */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.level')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.level')}>
                  {([
                    { id: 'honours' as ThesisLevel, key: 'thesis.level.honours' },
                    { id: 'masters' as ThesisLevel, key: 'thesis.level.masters' },
                    { id: 'mphil' as ThesisLevel, key: 'thesis.level.mphil' },
                    { id: 'phd' as ThesisLevel, key: 'thesis.level.phd' },
                  ]).map((o) => (
                    <button key={o.id} type="button" className={chipCls(level === o.id)} onClick={() => setLevel(o.id)} disabled={busy}>
                      {tt(o.key)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.discipline')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.discipline')}>
                  {([
                    { id: 'science' as ThesisDiscipline, key: 'thesis.discipline.science' },
                    { id: 'arts' as ThesisDiscipline, key: 'thesis.discipline.arts' },
                    { id: 'business' as ThesisDiscipline, key: 'thesis.discipline.business' },
                  ]).map((o) => (
                    <button key={o.id} type="button" className={chipCls(discipline === o.id)} onClick={() => setDiscipline(o.id)} disabled={busy}>
                      {tt(o.key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* মেটা তথ্য */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="ai-field-label" htmlFor="th-title">{tt('thesis.fTitle')}</label>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-xs opacity-80 transition hover:opacity-100"
                    onClick={fillExample}
                    disabled={busy}
                    title={tt('thesis.example')}
                  >
                    <Sparkles size={12} aria-hidden="true" /> {tt('thesis.example')}
                  </button>
                </div>
                <Textarea id="th-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tt('thesis.fTitle.ph')} className="min-h-[52px]" disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-univ">{tt('thesis.fUniv')}</label>
                <Input id="th-univ" value={university} onChange={(e) => setUniversity(e.target.value)} disabled={busy} />
                <div className="mt-1.5 flex flex-wrap gap-1" role="group" aria-label={tt('thesis.univ.quick')}>
                  {BD_UNIVERSITIES.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      className={cn('thesis-chip thesis-chip-mini', (university === u.name || university === u.bn) && 'thesis-chip-on')}
                      onClick={() => setUniversity(univName(u))}
                      disabled={busy}
                      title={u.name}
                    >
                      {univName(u)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-dept">{tt('thesis.fDept')}</label>
                <Input id="th-dept" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-author">{tt('thesis.fAuthor')}</label>
                <Input id="th-author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-roll">{tt('thesis.fRoll')}</label>
                <Input id="th-roll" value={roll} onChange={(e) => setRoll(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-session">{tt('thesis.fSession')}</label>
                <Input id="th-session" value={session} onChange={(e) => setSession(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-sup">{tt('thesis.fSupervisor')}</label>
                <Input id="th-sup" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-degree">{tt('thesis.fDegree')}</label>
                <Input id="th-degree" value={degreeName} onChange={(e) => setDegreeName(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-date">{tt('thesis.fDate')}</label>
                <Input id="th-date" value={date} onChange={(e) => setDate(e.target.value)} placeholder={tt('thesis.fDate.ph')} disabled={busy} />
              </div>
            </div>

            {/* কাঠামো-অপশন */}
            <div>
              <p className="ai-field-label mb-1.5">{tt('thesis.structure')}</p>
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                {STRUCTURE.map((o) => (
                  <label key={o.id} className="ai-check">
                    <input
                      type="checkbox"
                      checked={opts[o.id] as boolean}
                      onChange={(e) => setOpts((prev) => ({ ...prev, [o.id]: e.target.checked }))}
                      disabled={busy}
                    />
                    {tt(o.key)}
                  </label>
                ))}
              </div>
              <label className="ai-check mt-2">
                <input
                  type="checkbox"
                  checked={opts.applyFormat}
                  onChange={(e) => setOpts((prev) => ({ ...prev, applyFormat: e.target.checked }))}
                  disabled={busy}
                />
                {tt('thesis.opt.applyFormat')}
              </label>
              {opts.dedication ? (
                <div className="mt-2">
                  <label className="ai-field-label mb-1 block" htmlFor="th-dedic">{tt('thesis.fDedication')}</label>
                  <Textarea id="th-dedic" value={dedicationText} onChange={(e) => setDedicationText(e.target.value)} placeholder={tt('thesis.fDedication.ph')} className="min-h-[44px]" disabled={busy} />
                </div>
              ) : null}
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void generate()} disabled={busy} className="ai-insert-btn">
                {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
                {tt('thesis.generate')}
              </Button>
            </div>

            {/* ── দ্রুত সরঞ্জাম: চিত্র/টেবিল ক্যাপশন ── */}
            <div className="thesis-toolbox">
              <PSection tone="teal" icon={Tag} title={tt('thesis.capt.title')} />
              <p className="ai-setup-desc">{tt('thesis.capt.desc')}</p>
              <div className="grid gap-2 sm:grid-cols-[auto_auto_1fr]">
                <div>
                  <p className="ai-field-label mb-1">{tt('thesis.capt.kind')}</p>
                  <div className="flex gap-1.5" role="group" aria-label={tt('thesis.capt.kind')}>
                    {([
                      { id: 'figure' as const, label: tt('thesis.capt.figure') },
                      { id: 'table' as const, label: tt('thesis.capt.table') },
                    ]).map((o) => (
                      <button key={o.id} type="button" className={chipCls(capKind === o.id)} onClick={() => setCapKind(o.id)}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="ai-field-label mb-1 block" htmlFor="cap-ch">{tt('thesis.capt.chapter')}</label>
                    <Input id="cap-ch" type="number" min={1} step={1} value={capChapter} onChange={(e) => setCapChapter(e.target.value)} className="w-20" />
                  </div>
                  <div>
                    <label className="ai-field-label mb-1 block" htmlFor="cap-serial">{tt('thesis.capt.serial')}</label>
                    <Input id="cap-serial" type="number" min={1} step={1} value={capSerial} onChange={(e) => setCapSerial(e.target.value)} className="w-20" />
                  </div>
                </div>
                <div className="grid gap-2">
                  <div>
                    <label className="ai-field-label mb-1 block" htmlFor="cap-text">{tt('thesis.capt.text')}</label>
                    <Input id="cap-text" value={capText} onChange={(e) => setCapText(e.target.value)} placeholder={tt('thesis.capt.text.ph')} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="grow">
                      <label className="ai-field-label mb-1 block" htmlFor="cap-src">{tt('thesis.capt.source')}</label>
                      <Input id="cap-src" value={capSource} onChange={(e) => setCapSource(e.target.value)} placeholder={tt('thesis.capt.source.ph')} />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={busy}
                      onClick={() => {
                        // ভগ্নাংশ/অকার্যকর ইনপুটেও পূর্ণসংখ্যা নম্বর — "চিত্র ২.৫" নয়
                        const capCh = Math.max(1, Math.floor(Number(capChapter) || 1));
                        const capNo = Math.max(1, Math.floor(Number(capSerial) || 1));
                        const html = captionHtml(capKind, capCh, capNo, capText, lang, capSource);
                        if (insertAtCursor(html)) {
                          toast.success(tt('thesis.capt.inserted'));
                          setCapSerial(String(capNo + 1));
                        }
                      }}
                    >
                      <Plus size={13} aria-hidden="true" /> {tt('thesis.capt.insert')}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* ─── ট্যাব: সূত্র ─── */}
        {tab === 'cite' ? (
          <section role="tabpanel" aria-label={tt('thesis.tab.cite')} className="flex flex-col gap-3">
            <p className="ai-setup-desc">{tt('thesis.cite.desc')}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.cite.style')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.cite.style')}>
                  {(Object.keys(CITE_STYLE_NAMES) as CiteStyle[]).map((st) => (
                    <button key={st} type="button" className={chipCls(cite.style === st)} onClick={() => patchCite('style', st)} title={CITE_STYLE_NAMES[st].en}>
                      {CITE_STYLE_NAMES[st][lang === 'en' ? 'en' : 'bn']}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.cite.type')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.cite.type')}>
                  {(Object.keys(CITE_TYPE_NAMES) as CiteType[]).map((ct) => (
                    <button key={ct} type="button" className={chipCls(cite.type === ct)} onClick={() => setCiteType(ct)} title={CITE_TYPE_NAMES[ct].en}>
                      {CITE_TYPE_NAMES[ct][lang === 'en' ? 'en' : 'bn']}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {citeFieldsFor(cite.type).map((f) => (
                <div key={f.id}>
                  <label className="ai-field-label mb-1 block" htmlFor={`cite-${f.id}`}>{tt(f.key)}</label>
                  <Input id={`cite-${f.id}`} value={String(cite[f.id] ?? '')} onChange={(e) => patchCite(f.id, e.target.value)} placeholder={f.ph ? tt(f.ph) : undefined} />
                </div>
              ))}
            </div>

            {/* আউটপুট */}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="thesis-out">
                <p className="thesis-out-label">{tt('thesis.cite.output')}</p>
                <p className="thesis-out-body" dangerouslySetInnerHTML={{ __html: refHtml || '—' }} />
              </div>
              <div className="thesis-out thesis-out-sm">
                <p className="thesis-out-label">{tt('thesis.cite.intext')}</p>
                <p className="thesis-out-body">{inText || '—'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={!citeValid} onClick={() => copyText(refHtml.replace(/<[^>]+>/g, ''), refHtml)}>
                <Copy size={13} aria-hidden="true" /> {tt('thesis.cite.copy')}
              </Button>
              <Button variant="outline" size="sm" disabled={!citeValid} onClick={addLibEntry}>
                <Plus size={13} aria-hidden="true" /> {tt('thesis.cite.addLib')}
              </Button>
              <Button
                disabled={!citeValid}
                className="ai-insert-btn"
                onClick={() => {
                  if (!refHtml) return;
                  if (insertAtCursor(`<p>${refHtml}</p>`)) {
                    toast.success(tt('thesis.cite.insert'));
                    close();
                  }
                }}
              >
                <BadgeCheck size={14} aria-hidden="true" /> {tt('thesis.cite.insert')}
              </Button>
            </div>

            {/* ── সূত্র-লাইব্রেরি ── */}
            <div className="thesis-toolbox">
              <PSection
                tone="amber"
                icon={BookMarked}
                title={tt('thesis.cite.library')}
                count={lib.length > 0 ? String(lib.length) : undefined}
              />
              <p className="ai-setup-desc">{tt('thesis.cite.libDesc')}</p>
              {libMixed ? (
                <p className="thesis-mixed-warn">⚠ {tt('thesis.cite.libMixed')}</p>
              ) : null}
              {lib.length === 0 ? (
                <p className="thesis-lib-empty">{tt('thesis.cite.libEmpty')}</p>
              ) : (
                <ul className="thesis-lib-list max-h-44 overflow-y-auto" aria-label={tt('thesis.cite.library')}>
                  {lib.map((e, i) => (
                    <li key={`${i}-${e.title.slice(0, 12)}`} className="thesis-lib-item">
                      <span className="thesis-lib-body" dangerouslySetInnerHTML={{ __html: formatReference(e) }} />
                      <button
                        type="button"
                        className="thesis-lib-del"
                        onClick={() => persistLib(lib.filter((_, j) => j !== i))}
                        aria-label={tt('thesis.cite.libRemove')}
                        title={tt('thesis.cite.libRemove')}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {lib.length > 0 ? (
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(libClearArmed && 'text-red-700 dark:text-red-400')}
                    onClick={() => {
                      if (!libClearArmed) {
                        setLibClearArmed(true);
                        window.setTimeout(() => setLibClearArmed(false), 3000);
                        return;
                      }
                      setLibClearArmed(false);
                      persistLib([]);
                    }}
                  >
                    <Eraser size={13} aria-hidden="true" /> {libClearArmed ? tt('thesis.cite.libClearConfirm') : tt('thesis.cite.libClear')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyText(libHtml.join('').replace(/<[^>]+>/g, '\n').trim(), libHtml.join(''))}>
                    <Copy size={13} aria-hidden="true" /> {tt('thesis.cite.libCopyAll')}
                  </Button>
                  <Button size="sm" className="ai-insert-btn" onClick={insertAllLib} disabled={libHtml.length === 0}>
                    <BadgeCheck size={13} aria-hidden="true" /> {tt('thesis.cite.libInsertAll').replace('{n}', String(lib.length))}
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ─── ট্যাব: AI খসড়া ─── */}
        {tab === 'draft' ? (
          <section role="tabpanel" aria-label={tt('thesis.tab.draft')} className="flex flex-col gap-3">
            <p className="ai-setup-desc">{tt('thesis.draft.desc')}</p>

            <div>
              <p className="ai-field-label mb-1.5">{tt('thesis.draft.section')}</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.draft.section')}>
                {DRAFT_SECTIONS.map((o) => (
                  <button key={o.id} type="button" className={chipCls(draftSection === o.id)} onClick={() => setDraftSection(o.id)} disabled={draftBusy}>
                    {tt(o.key)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="draft-topic">{tt('thesis.draft.topic')}</label>
                <Input id="draft-topic" value={draftTopic} onChange={(e) => setDraftTopic(e.target.value)} placeholder={title || tt('thesis.draft.topic.ph')} disabled={draftBusy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="draft-points">{tt('thesis.draft.points')}</label>
                <Textarea id="draft-points" value={draftPoints} onChange={(e) => setDraftPoints(e.target.value)} placeholder={tt('thesis.draft.points.ph')} className="min-h-[60px]" disabled={draftBusy} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.draft.length')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.draft.length')}>
                  {([
                    { id: 'short' as DraftLen, key: 'thesis.draft.len.short' },
                    { id: 'medium' as DraftLen, key: 'thesis.draft.len.medium' },
                    { id: 'long' as DraftLen, key: 'thesis.draft.len.long' },
                  ]).map((o) => (
                    <button key={o.id} type="button" className={chipCls(draftLen === o.id)} onClick={() => setDraftLen(o.id)} disabled={draftBusy}>
                      {tt(o.key)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end justify-end">
                <Button onClick={() => void generateDraft()} disabled={draftBusy} className="ai-insert-btn">
                  {draftBusy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <PenLine size={14} aria-hidden="true" />}
                  {tt('thesis.draft.generate')}
                </Button>
              </div>
            </div>

            {draftOut ? (
              <div className="grid gap-2">
                <PSection tone="fuchsia" icon={PenLine} title={tt('thesis.draft.result')} />
                <Textarea
                  value={draftOut}
                  onChange={(e) => setDraftOut(e.target.value)}
                  className="min-h-[180px] max-h-72 overflow-y-auto font-normal"
                  aria-label={tt('thesis.draft.result')}
                />
                <p className="thesis-draft-notice">{tt('thesis.draft.notice')}</p>
                <div className="flex flex-wrap items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyText(draftOut, draftToHtml(draftOut))}>
                    <Copy size={13} aria-hidden="true" /> {tt('thesis.cite.copy')}
                  </Button>
                  <Button size="sm" className="ai-insert-btn" onClick={insertDraft}>
                    <BadgeCheck size={13} aria-hidden="true" /> {tt('thesis.draft.insert')}
                  </Button>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        {/* ─── ট্যাব: গাইড ─── */}
        {tab === 'guide' ? (
          <section role="tabpanel" aria-label={tt('thesis.tab.guide')} className="flex flex-col gap-2">
            <PSection tone="teal" icon={GraduationCap} title={tt('thesis.guide.title')} />
            <ul className="thesis-guide max-h-96 list-none space-y-2 overflow-y-auto pr-1">
              {GUIDE_ITEMS.map((g, i) => (
                <li key={g.key} className="thesis-guide-item">
                  <PTile size="sm" tone={GUIDE_TONES[i % GUIDE_TONES.length]} icon={g.icon} className="mt-0.5" />
                  <span>{tt(g.key)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
