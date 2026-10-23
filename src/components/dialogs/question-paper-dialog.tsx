/**
 * প্রশ্নপত্র স্টুডিও — ৪ ধাপের উইজার্ড (Question Paper Studio wizard)
 * ──────────────────────────────────────────────────────────────────
 *  ধাপ ১ ইনপুট: হাতে-লেখা ছবি (AI পড়ে নেয়) বা টাইপ/পেস্ট — দুটোই এক
 *    কাঁচা-লেখা বক্সে মেলে।
 *  ধাপ ২ বিস্তারিত: স্কুল, পরীক্ষা, শ্রেণি, বিষয়, সময়, পূর্ণমান, নির্দেশনা।
 *  ধাপ ৩ নকশা: স্বয়ংক্রিয় / ক্লাসিক / মডার্ন / কমপ্যাক্ট — সব মনোক্রোম
 *    প্রিন্ট-ফার্স্ট। AI ছাড়া অফলাইন দ্রুত-সাজানোও আছে।
 *  ধাপ ৪ প্রিভিউ: সাদা A4 শীটে প্রস্তুত প্রশ্নপত্র → এক ক্লিকে শীটে বসানো
 *    (আসল পেজিনেশন/প্রিন্ট/PDF সব চলে) বা স্বয়ংসম্পূর্ণ প্রিন্ট-ফাইল।
 *
 * BYOK: নিজের API Key থাকলে সেটাই; না থাকলে বিল্ট-ইন ডেমো SDK — শিক্ষককে
 * কিছু কনফিগার করতে হয় না।
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookPlus, CalendarDays, Camera, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleAlert, Eraser,
  Download, FileQuestion, GraduationCap, History, Landmark, LayoutTemplate, Loader2, PenLine, Printer, RefreshCw,
  Shapes, SlidersHorizontal, Sparkles, Star, Trash2, Type, Wand2, X, Zap, ZoomIn, ZoomOut, Image as ImageIcon,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PHero, PPill, PSection, PTile } from '@/components/premium';
import { useUiStore } from '@/lib/ui-store';
import { useAiStore, aiConfiguredSelector } from '@/lib/ai-store';
import { callAi, prepareImageFile } from '@/lib/ai-client';
import type { PreparedImage } from '@/lib/ai-client';
import { useEditorStore } from '@/lib/store';
import {
  QP_SCHOOL_KEY, QP_REPAIR_NOTE, QP_FIGURE_SVG_SYSTEM, QP_STRUCTURE_SYSTEM, QP_SUGGESTION_SYSTEM, QP_TRANSCRIBE_SYSTEM, QP_VERIFY_SYSTEM,
  QP_DEFAULT_LAYOUT, cleanRawQpText, coerceQpLevel, defaultQpMeta, extractQpJson, extractTranscriptText, isDefaultQpInstructions,
  loadQpHistory, normalizeQpJson, normalizeQpLayout, paperToEditorHtml, paperToStandaloneHtml, parseLocaleInt,
  parseQuestionText, pushQpHistory, qpPageSizePx, qpPreambleMeta, qpSampleText, qpUniversityInstructions,
  removeQpHistoryItem, resolveQpFormat, shufflePaper, sumQpMarks,
} from '@/lib/question-paper';
import type { QpDocType, QpFontScale, QpFormat, QpHistoryItem, QpLayout, QpLevel, QpMeta, QuestionPaper } from '@/lib/question-paper';
import {
  collectQpFigureSlots, matchFigureVector, fillFromMatch, fillFromSvg,
  type QpFigureFill,
} from '@/lib/qp-figures';
import { htmlIsEmpty, paginateInsertedReader } from '@/components/editor/page-ops';
import { tFmt, useLangStore, useT, useFmtNum } from '@/lib/i18n';
import { formatDateLong } from '@/lib/i18n/core';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4;
type Phase = 'idle' | 'transcribing' | 'verifying' | 'generating' | 'done' | 'error';
type QpError = { hintKey: string; detail?: string };

const STEPS: Array<{ id: Step; key: string }> = [
  { id: 1, key: 'qp.step.input' },
  { id: 2, key: 'qp.step.details' },
  { id: 3, key: 'qp.step.format' },
  { id: 4, key: 'qp.step.preview' },
];

/** ডকুমেন্ট-ধরন — শিক্ষক বাছেন: পরীক্ষার প্রশ্নপত্র নাকি ছাত্রদের সাজেশন শিট */
const DOC_TYPES: Array<{ id: QpDocType; label: string; desc: string }> = [
  { id: 'question', label: 'qp.docType.question', desc: 'qp.docType.question.desc' },
  { id: 'suggestion', label: 'qp.docType.suggestion', desc: 'qp.docType.suggestion.desc' },
];

/** শিক্ষার স্তর — স্কুল/মাদ্রাসা প্রথা নাকি বিশ্ববিদ্যালয় প্রথা (কোর্স-কোড, বিভাগ, বর্ষ-সেশন) */
const LEVELS: Array<{ id: QpLevel; label: string; desc: string }> = [
  { id: 'school', label: 'qp.level.school', desc: 'qp.level.school.desc' },
  { id: 'university', label: 'qp.level.university', desc: 'qp.level.university.desc' },
];

const FORMATS: Array<{ id: QpFormat; label: string; desc: string }> = [
  { id: 'auto', label: 'qp.format.auto', desc: 'qp.format.auto.desc' },
  { id: 'board', label: 'qp.format.board', desc: 'qp.format.board.desc' },
  { id: 'classic', label: 'qp.format.classic', desc: 'qp.format.classic.desc' },
  { id: 'modern', label: 'qp.format.modern', desc: 'qp.format.modern.desc' },
  { id: 'compact', label: 'qp.format.compact', desc: 'qp.format.compact.desc' },
  { id: 'royal', label: 'qp.format.royal', desc: 'qp.format.royal.desc' },
  { id: 'twocol', label: 'qp.format.twocol', desc: 'qp.format.twocol.desc' },
  { id: 'university', label: 'qp.format.university', desc: 'qp.format.university.desc' },
  { id: 'sugslip', label: 'qp.format.sugslip', desc: 'qp.format.sugslip.desc' },
  { id: 'quiz', label: 'qp.format.quiz', desc: 'qp.format.quiz.desc' },
];

/**
 * ফরম্যাট-তালিকা ডকুমেন্ট-ধরন অনুযায়ী — sugslip সাজেশন-পর্চার ফরম্যাট, তাই
 * প্রশ্নপত্র-ধরনের তালিকা থেকে বাদ (পুরনো হিস্ট্রি/আমদানিতে এলে রেন্ডারার
 * প্রশ্নপত্র-হেডারই দেয় — ফাইলে ভাঙা নেই, শুধু বাছাই-তালিকা থেকে সরানো)।
 */
function formatsForDocType(dt: QpDocType): typeof FORMATS {
  return dt === 'question' ? FORMATS.filter((f) => f.id !== 'sugslip') : FORMATS;
}

const FONT_SCALES: Array<{ id: QpFontScale; key: string }> = [
  { id: 'sm', key: 'qp.typo.sm' },
  { id: 'md', key: 'qp.typo.md' },
  { id: 'lg', key: 'qp.typo.lg' },
];

/** উন্নত সাজের অপশন-গ্রুপ — বাংলাদেশ-প্রথা অনুযায়ী কলাম, পাতার মাপ, নম্বর/মান-শৈলী */
const ADV_GROUPS: Array<{ id: keyof QpLayout; label: string; opts: Array<{ v: string; key: string }> }> = [
  {
    id: 'columns', label: 'qp.layout.cols',
    opts: [
      { v: 'auto', key: 'qp.cols.auto' }, { v: '1', key: 'qp.cols.one' },
      { v: '2', key: 'qp.cols.two' }, { v: '3', key: 'qp.cols.three' },
    ],
  },
  {
    id: 'pageSize', label: 'qp.layout.page',
    opts: [
      { v: 'a4', key: 'qp.page.a4' }, { v: 'letter', key: 'qp.page.letter' },
      { v: 'legal', key: 'qp.page.legal' }, { v: 'a5', key: 'qp.page.a5' },
    ],
  },
  {
    id: 'numStyle', label: 'qp.layout.num',
    opts: [
      { v: 'danda', key: 'qp.num.danda' }, { v: 'dot', key: 'qp.num.dot' },
      { v: 'paren', key: 'qp.num.paren' }, { v: 'dash', key: 'qp.num.dash' },
    ],
  },
  {
    id: 'marksStyle', label: 'qp.layout.marks',
    opts: [
      { v: 'right', key: 'qp.marks.right' }, { v: 'bracket', key: 'qp.marks.bracket' },
      { v: 'paren', key: 'qp.marks.paren' }, { v: 'word', key: 'qp.marks.word' },
    ],
  },
  {
    id: 'sectionStyle', label: 'qp.layout.sec',
    opts: [
      { v: 'center', key: 'qp.sec.center' }, { v: 'box', key: 'qp.sec.box' }, { v: 'left', key: 'qp.sec.left' },
    ],
  },
  {
    id: 'mcqLayout', label: 'qp.layout.mcq',
    opts: [
      { v: 'grid', key: 'qp.mcq.grid' }, { v: 'inline', key: 'qp.mcq.inline' }, { v: 'list', key: 'qp.mcq.list' },
    ],
  },
  {
    id: 'answerSpace', label: 'qp.layout.space',
    opts: [
      { v: 'none', key: 'qp.space.none' }, { v: 'sm', key: 'qp.space.sm' },
      { v: 'md', key: 'qp.space.md' }, { v: 'lg', key: 'qp.space.lg' },
    ],
  },
];

/** ডকুমেন্ট-ধরন কার্ডের ভেতরের মিনি-প্রিভিউ — প্রশ্নপত্র হেডার নাকি ★-চিহ্নিত তালিকা */
function DocTypeVis({ id }: { id: QpDocType }) {
  const bar = (w: string, center = false) => (
    <span
      className="qp-vis-bar"
      style={{ width: w, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }}
    />
  );
  if (id === 'suggestion') {
    return (
      <>
        {bar('58%', true)}{bar('44%', true)}
        <span className="qp-vis-rule" />
        <span className="qp-vis-row"><span className="qp-vis-star">★</span><span className="qp-vis-bar" style={{ width: '70%' }} /></span>
        <span className="qp-vis-row"><span className="qp-vis-star">★★</span><span className="qp-vis-bar" style={{ width: '58%' }} /></span>
        <span className="qp-vis-row"><span className="qp-vis-bar" style={{ width: '64%', marginLeft: 'auto' }} /></span>
      </>
    );
  }
  return <>{bar('44%', true)}{bar('58%', true)}<span className="qp-vis-rule" />{bar('72%')}{bar('64%')}{bar('70%')}</>;
}

/** নকশা-কার্ডের ভেতরের মিনি-প্রিভিউ (গ্রে বার) — আসল-পত্র প্রথার চেহারা */
function FormatVis({ id }: { id: QpFormat }) {
  const bar = (w: string, center = false) => (
    <span
      className="qp-vis-bar"
      style={{ width: w, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }}
    />
  );
  if (id === 'auto') {
    return <>{bar('34%', true)}{bar('52%', true)}{bar('70%')}{bar('62%')}</>;
  }
  if (id === 'classic') {
    // স্কুল প্রশ্নপত্র — কেন্দ্রীয় হেডার + সময়↔পূর্ণমান + নির্দেশনা-বক্স + ডান মান
    return (
      <>
        {bar('46%', true)}{bar('34%', true)}
        <span className="qp-vis-rule" />
        <span className="qp-vis-box"><span className="qp-vis-row">{bar('82%')}</span><span className="qp-vis-row">{bar('74%')}</span></span>
        <span className="qp-vis-row">{bar('62%')}<span className="qp-vis-bar" style={{ width: '12%', marginLeft: 'auto' }} /></span>
        <span className="qp-vis-row">{bar('70%')}<span className="qp-vis-bar" style={{ width: '12%', marginLeft: 'auto' }} /></span>
      </>
    );
  }
  if (id === 'modern') {
    // বোর্ড MCQ — ৩-অঞ্চল হেডার + কোড-বক্স + দুই কলাম ২×২ অপশন
    return (
      <>
        <span className="qp-vis-row">
          {bar('30%')}
          {bar('18%', true)}
          <span className="qp-vis-code"><span /><span /><span /></span>
        </span>
        <span className="qp-vis-rule" />
        <span className="qp-vis-row">{bar('42%')}<span style={{ width: '10%' }} />{bar('42%')}</span>
        <span className="qp-vis-row">{bar('38%')}<span style={{ width: '14%' }} />{bar('38%')}</span>
        <span className="qp-vis-row">{bar('40%')}<span style={{ width: '10%' }} />{bar('40%')}</span>
      </>
    );
  }
  if (id === 'board') {
    // বোর্ড সৃজনশীল — কেন্দ্রীয় শিরোনাম + কোড-বক্স + দুই কলাম সৃজনশীল
    return (
      <>
        {bar('40%', true)}{bar('28%', true)}
        <span className="qp-vis-code"><span /><span /><span /></span>
        <span className="qp-vis-rule" />
        <span className="qp-vis-row">{bar('44%')}<span style={{ width: '10%' }} />{bar('44%')}</span>
        <span className="qp-vis-row">{bar('40%')}<span style={{ width: '14%' }} />{bar('42%')}</span>
      </>
    );
  }
  if (id === 'royal') {
    // অলংকৃত রাজকীয় — ❦-অলংকৃত শিরোনাম + শেডযুক্ত বিভাগ-ব্যান্ড + নির্দেশনা-বক্স
    return (
      <>
        <span className="qp-vis-row" style={{ justifyContent: 'center', gap: 2 }}>
          <span className="qp-vis-orn">❦</span>{bar('44%')}<span className="qp-vis-orn">❦</span>
        </span>
        {bar('30%', true)}
        <span className="qp-vis-rule" />
        <span className="qp-vis-band">{bar('52%', true)}</span>
        <span className="qp-vis-row">{bar('66%')}<span className="qp-vis-bar" style={{ width: '10%', marginLeft: 'auto' }} /></span>
        <span className="qp-vis-row">{bar('58%')}<span className="qp-vis-bar" style={{ width: '10%', marginLeft: 'auto' }} /></span>
      </>
    );
  }
  if (id === 'twocol') {
    // পত্রিকা স্তম্ভ — চাপা শিরোনাম + মাঝে রেখা দুই স্তম্ভ লেখা
    return (
      <>
        {bar('40%', true)}{bar('56%', true)}
        <span className="qp-vis-rule" />
        <span className="qp-vis-row">{bar('44%')}<span style={{ width: '8%' }} />{bar('44%')}</span>
        <span className="qp-vis-row">{bar('40%')}<span style={{ width: '12%' }} />{bar('40%')}</span>
        <span className="qp-vis-row">{bar('42%')}<span style={{ width: '10%' }} />{bar('42%')}</span>
      </>
    );
  }
  if (id === 'university') {
    // বিশ্ববিদ্যালয় — বড় শিরোনাম + তথ্য-টেবিল (৪ ঘর) + বাঁ-সারিত বিভাগ
    return (
      <>
        {bar('52%', true)}
        <span className="qp-vis-grid">
          <span className="qp-vis-cell" style={{ width: '22%' }} /><span className="qp-vis-cell" style={{ width: '28%' }} />
          <span className="qp-vis-cell" style={{ width: '22%' }} /><span className="qp-vis-cell" style={{ width: '28%' }} />
        </span>
        <span className="qp-vis-row">{bar('34%')}<span style={{ flex: 1 }} /></span>
        {bar('70%')}{bar('62%')}
      </>
    );
  }
  if (id === 'sugslip') {
    // সাজেশন-স্লিপ — চাপা শিরোনাম + ★-প্রধান চাপা ২-স্তম্ভ (মাঝে রেখা নেই)
    return (
      <>
        {bar('42%', true)}{bar('54%', true)}
        <span className="qp-vis-rule" />
        <span className="qp-vis-row"><span className="qp-vis-star">★</span>{bar('44%')}<span style={{ width: '6%' }} />{bar('40%')}</span>
        <span className="qp-vis-row"><span className="qp-vis-star">★★</span>{bar('38%')}<span style={{ width: '8%' }} />{bar('44%')}</span>
        <span className="qp-vis-row">{bar('46%')}<span style={{ width: '8%' }} />{bar('34%')}</span>
        {bar('30%', true)}
      </>
    );
  }
  if (id === 'quiz') {
    // টেস্ট-স্লিপ — দুই-কোণ হেডার + নাম-ঘর + ২-স্তম্ভ + স্কোর-বক্স
    return (
      <>
        <span className="qp-vis-row">{bar('40%')}<span style={{ flex: 1 }} />{bar('28%')}</span>
        <span className="qp-vis-row">{bar('66%')}</span>
        <span className="qp-vis-rule" />
        <span className="qp-vis-row">{bar('42%')}<span style={{ width: '8%' }} />{bar('40%')}</span>
        <span className="qp-vis-row">{bar('38%')}<span style={{ width: '10%' }} />{bar('42%')}</span>
        <span className="qp-vis-scorebox">{bar('20%')}</span>
      </>
    );
  }
  return <>{bar('26%')}{bar('78%')}{bar('78%')}{bar('70%')}{bar('78%')}{bar('52%')}</>;
}

export function QuestionPaperDialog() {
  const open = useUiStore((s) => s.openDialog === 'questionPaper');
  const close = useUiStore((s) => s.close);
  const openDialog = useUiStore((s) => s.open);
  const configured = useAiStore(aiConfiguredSelector);
  const lang = useLangStore((s) => s.lang);
  const tt = useT();
  const fmtNum = useFmtNum();

  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<'photo' | 'text'>('text');
  // দুই-পাস ভিশন-কল বাতিল — ডায়ালগ বন্ধে পেছনে মিনিট-লম্বা অপেক্ষা থাকবে না
  const qpAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!open) qpAbortRef.current?.abort();
  }, [open]);
  useEffect(() => () => qpAbortRef.current?.abort(), []);
  // ডকুমেন্ট-ধরন — প্রশ্নপত্র নাকি সাজেশন শিট (সাজেশনে আলাদা নকশা, ★-গুরুত্ব, শিক্ষক-স্বাক্ষর)
  const [docType, setDocType] = useState<QpDocType>('question');
  // শিক্ষার স্তর — স্কুল প্রথা বা বিশ্ববিদ্যালয় প্রথা (কোর্স-কোড/বিভাগ/বর্ষ-সেশন)
  const [level, setLevel] = useState<QpLevel>('school');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [rawText, setRawText] = useState('');
  // ভাষা-অনুযায়ী ডিফল্ট মেটা + মনে-রাখা স্কুলের নাম — প্রথম রেন্ডারেই (lazy init)
  const [meta, setMeta] = useState<QpMeta | null>(() => {
    if (typeof window === 'undefined') return null;
    const l = useLangStore.getState().lang;
    const d = defaultQpMeta(l);
    try {
      d.schoolName = window.localStorage.getItem(QP_SCHOOL_KEY) ?? '';
      d.date = formatDateLong(new Date(), l);
    } catch { /* প্রাইভেট মোড */ }
    return d;
  });
  const [format, setFormat] = useState<QpFormat>('auto');
  const [fontScale, setFontScale] = useState<QpFontScale>('md');
  const [shuffle, setShuffle] = useState(false);
  // উন্নত সাজ — কলাম/পাতার মাপ/নম্বর-মান-বিভাগ/MCQ-শৈলী/উত্তরের জায়গা
  const [layout, setLayout] = useState<QpLayout>(QP_DEFAULT_LAYOUT);
  const [showAdv, setShowAdv] = useState(false);
  // সাম্প্রতিক প্রশ্নপত্র — ডায়ালগ খোলা অবস্থায় localStorage থেকে derive;
  // তালিকা বদলালে (push/remove) histVersion বাড়ে → নতুন করে পড়ে
  const [histVersion, setHistVersion] = useState(0);
  const history = useMemo(() => (open ? loadQpHistory() : []), [open, histVersion]);
  const [phase, setPhase] = useState<Phase>('idle');
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<QpError | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [zoomMult, setZoomMult] = useState(1);

  // ── চিত্র-ব্যবস্থাপনা — [চিত্র: …] স্লটে ক্যাটালগ/AI চিত্র বসানো ──
  // স্লট-কী থেকে পূর্ণক-ম্যাপ; null/অনুপস্থিত = ম্যানুয়াল খালি-বক্স
  const [figFills, setFigFills] = useState<Record<string, QpFigureFill | null>>({});
  const [figBusy, setFigBusy] = useState<Record<string, boolean>>({});

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  /** পুনঃপ্রতিলিপিতে প্রতিস্থাপিত আগের লেখা — টোস্টের "আনডু"-তে ফেরত পাওয়া যায় */
  const prevRawRef = useRef<string>('');
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  /** কাঁচা-লেখা বাক্স — প্রতিলিপি শেষে সরাসরি এখানে ফোকাস যায় (সম্পাদনা-প্রথম অভিজ্ঞতা) */
  const rawRef = useRef<HTMLTextAreaElement | null>(null);
  const [sheetH, setSheetH] = useState(0);
  const [fitScale, setFitScale] = useState(0.62);

  const busy = phase === 'transcribing' || phase === 'verifying' || phase === 'generating';

  /**
   * ডিজাইন-বদল লাইভ প্রয়োগ — প্রস্তুত প্রশ্নপত্র থাকলে ফরম্যাট/টাইপো/লেআউট/ধরন সঙ্গে সঙ্গে
   * স্ন্যাপশটে বসে (নতুন AI-কল বা রি-পার্স ছাড়াই)। paperToEditorHtml বিশুদ্ধ ফাংশন —
   * তাই প্রিভিউ ও শীটে-বসানো দুটোই সঙ্গে সঙ্গে নতুন সাজ দেখায়।
   * (আগে স্ন্যাপশট ফ্রোজেন থাকত — ধাপ ৩-এ ২-কলাম বাছলেও প্রিভিউ/ইনসার্ট পুরনো সাজেই
   * এক-কলাম থেকে যেত — ব্যবহারকারীর মূল অভিযোগ।)
   */
  const patchLive = useCallback((patch: Partial<QuestionPaper>) => {
    setPaper((p) => (p ? { ...p, ...patch } : p));
  }, []);

  /**
   * নির্দেশনা-বাক্সের কাঁচা-ড্রাফট — নিয়ন্ত্রিত-ইনপুট-লস বাগ বন্ধ: আগে প্রতি কিস্ট্রোকে
   * filter() চলত, শেষের ফাঁকা লাইন সঙ্গে সঙ্গে মুছে কার্সর লাফাত (নতুন লাইন লেখাই যেত না)।
   * এখন কাঁচা-লেখা এখানেই থাকে; জেনারেটের সময় লাইনে ভেঙে পরিষ্কার করা হয়।
   */
  const [instrDraft, setInstrDraft] = useState<string | null>(null);

  // স্কুলের নাম পরের বারের জন্য মনে রাখা
  useEffect(() => {
    if (!meta?.schoolName) return;
    try { window.localStorage.setItem(QP_SCHOOL_KEY, meta.schoolName); } catch { /* কোটা */ }
  }, [meta?.schoolName]);

  // শীটের উচ্চতা → পাতার আন্দাজ (A4 পূর্ণ উচ্চতা 1123px-এ ভাগ — প্যাডিংসহ প্রথম পাতা)
  useEffect(() => {
    if (!paper || step !== 4 || !sheetRef.current) return;
    const el = sheetRef.current;
    const ro = new ResizeObserver(() => setSheetH(el.scrollHeight));
    ro.observe(el);
    setSheetH(el.scrollHeight);
    return () => ro.disconnect();
  }, [paper, step]);

  // প্রিভিউ কনটেইনারের প্রস্থ → ফিট-স্কেল (পাতার মাপ অনুযায়ী)
  const pageSize = normalizeQpLayout(paper?.layout).pageSize;
  const pageW = qpPageSizePx(pageSize).w;
  const pageH = qpPageSizePx(pageSize).h;
  useEffect(() => {
    if (step !== 4 || !previewWrapRef.current) return;
    const el = previewWrapRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 32;
      setFitScale(Math.max(0.3, Math.min(1, w / pageW)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [step, pageW]);

  const acceptFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      // হাতের-লেখার ছোট অক্ষর টিক রাখতে বেশি রেজোলিউশন (ভিশনের জন্য ২২০০px)
      const prepared = await prepareImageFile(file, { maxDim: 2200 });
      setImage(prepared);
      setMode('photo');
      setError(null);
    } catch (err) {
      toast.error(tt((err as Error)?.message === 'IMAGE_TOO_LARGE' ? 'ai.err.size' : 'ai.err.read'));
    }
  }, [tt]);

  // হাতের লেখা ছবি → টেক্সট (AI / ডেমো SDK) — দুই-পাস: পড়া → ছবির সাথে মিলিয়ে শুদ্ধ করা
  // এক-পাসে ভিশন-মডেল প্রায়ই শব্দ/সংখ্যা ভুল পড়ে বা বানিয়ে ফেলে — দ্বিতীয় পাসে নিজের
  // খসড়া ছবির সাথে লাইন-ধরে-লাইন মিলিয়ে ভুল শুদ্ধ হয়, ভুয়া প্রশ্ন বাদ যায়।
  const transcribe = async () => {
    if (!image || busy) return;
    setPhase('transcribing');
    setError(null);
    qpAbortRef.current?.abort();
    const ctrl = new AbortController();
    qpAbortRef.current = ctrl;
    const res = await callAi({
      prompt: 'এই ছবির সব প্রশ্ন, হেডার ও নম্বর-মান সম্পূর্ণ উদ্ধার করে উপরের JSON ফরম্যাটে দাও। অস্পষ্ট হাতের লেখাও যতটা পারো পড়ো — কোনো প্রশ্ন বাদ দেবে না।',
      system: QP_TRANSCRIBE_SYSTEM,
      imageDataUrl: image.dataUrl,
      thinking: true, // হস্তলিপি-পড়া নির্ভুলতা-জরুরি — ধীর হলেও শুদ্ধ
      signal: ctrl.signal,
    });
    if (ctrl.signal.aborted) return; // বাতিল — ত্রুটি-ব্যানার নয়
    if (!(res.ok && res.text)) {
      setError({ hintKey: res.hintKey ?? 'ai.err.title', detail: res.detail });
      setPhase('error');
      return;
    }
    const draft = extractTranscriptText(res.text) ?? '';
    if (!draft) {
      setError({ hintKey: 'qp.err.empty' });
      setPhase('error');
      return;
    }

    // দ্বিতীয় পাস — নিজের পড়া ছবির সাথে মিলিয়ে শুদ্ধ; ব্যর্থ হলে প্রথম পাসের খসড়াই থাকে
    setPhase('verifying');
    const ver = await callAi({
      prompt: [
        'DRAFT TRANSCRIPTION (first pass):',
        draft.slice(0, 8000),
        '',
        'Verify this draft line by line against the image and return the corrected complete transcription in the JSON shape.',
      ].join('\n'),
      system: QP_VERIFY_SYSTEM,
      imageDataUrl: image.dataUrl,
      thinking: true,
      signal: ctrl.signal,
    });
    if (ctrl.signal.aborted) return;
    const verified = ver.ok && ver.text ? extractTranscriptText(ver.text) : null;
    const text = verified && verified.trim().length >= 4 ? verified : draft;

    // প্রতিলিপিতে হাতের-লেখার separator/পাতার নম্বর জাতীয় আবর্জনা থাকে — বসানোর আগেই ছাঁটাই,
    // যেন ফরমেটিংয়ে মাঝখানে ফাঁক/আবর্জনা-রেখা না আসে (ব্যবহারকারীর মূল অভিযোগ)
    const cleaned = cleanRawQpText(text);
    const prevRaw = rawText;
    // পুনঃপ্রতিলিপি — আগে আগের-লেখার পেছনে জোড়া হত, ফলে ডুপ্লিকেট জমত ও সম্পাদনা কঠিন হত।
    // এখন প্রতিলিপি আগের-লেখা প্রতিস্থাপন করে; আগের লেখা টোস্টের "আনডু"-তে ফেরত পাওয়া যায়।
    setRawText(cleaned.text);
    setIsDemo(!!res.demo);
    setPhase('idle');
    if (prevRaw.trim() && prevRaw.trim() !== cleaned.text.trim()) {
      prevRawRef.current = prevRaw;
      toast.success(tt('qp.transcribe.done'), {
        action: { label: tt('qp.undo'), onClick: () => setRawText(prevRawRef.current) },
      });
    } else if (cleaned.removed > 0) {
      toast.success(tFmt('qp.clean.removed', { n: fmtNum(cleaned.removed) }));
    } else {
      toast.success(tt('qp.transcribe.done'));
    }
    // সম্পাদনার জন্য সরাসরি লেখা-বাক্সে ফোকাস — "পরবর্তীতে এডিট করব" স্বপ্নটা এখানেই পূরণ হয়
    window.setTimeout(() => {
      rawRef.current?.focus();
      rawRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 120);
  };

  /** "লেখা পরিষ্কার" বাটন — টাইপ/পেস্ট/প্রতিলিপি যা-ই হোক, আবর্জনা-রেখা এক ক্লিকে ছাঁটাই */
  const cleanText = () => {
    if (!rawText.trim()) return;
    const { text, removed } = cleanRawQpText(rawText);
    if (text === rawText) {
      toast.info(tt('qp.clean.done'));
      return;
    }
    setRawText(text);
    toast.success(removed > 0 ? tFmt('qp.clean.removed', { n: fmtNum(removed) }) : tt('qp.clean.done'));
  };

  // Ctrl+V পেস্ট — ইনপুট ধাপে ছবি সরাসরি বসে
  useEffect(() => {
    if (!open || step !== 1 || mode !== 'photo') return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      void acceptFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, step, mode, acceptFile]);

  // প্রশ্নপত্র বানানো — AI পথ ব্যর্থ হলে অফলাইন পার্সারে নেমে যায় (গ্রেসফুল)
  const generate = async (useAi: boolean): Promise<void> => {
    if (busy) return;
    if (!meta) return;
    if (!rawText.trim()) {
      toast.info(tt('qp.toast.noText'));
      return;
    }
    setPhase('generating');
    setError(null);

    // কাঁচা-লেখার হেডার (স্কুল/পরীক্ষা/বিষয়/শ্রেণি/সময়/পূর্ণমান) ফর্মে স্বয়ংক্রিয় বসানো —
    // শুধু ফাঁকা/ডিফল্ট ঘর ভরে, শিক্ষকের নিজের লেখা অক্ষত থাকে। ফর্মে দেখা যায়,
    // তাই হেডার যা-ই হোক — শিক্ষকের চোখের সামনেই সেটা।
    // নির্দেশনা — ড্রাফট-বাক্সের কাঁচা-লেখা লাইনে ভেঙে (ফাঁকা লাইন বাদ) ফর্ম-মানে বসে।
    // সাজেশন-ধরনে পরীক্ষা-লাইন examTitle-এ ভরে না (docType সচেতন preamble)।
    const instructions = instrText.split('\n').map((l) => l.trim()).filter(Boolean);
    const effMeta = qpPreambleMeta(rawText, { ...meta, instructions }, lang, docType);
    setMeta(effMeta);

    const finish = (result: QuestionPaper, demo: boolean) => {
      // সেট বৈচিত্র্য চালু থাকলে প্রশ্নের ক্রম এলোমেলো + নতুন ধারাবাহিক নম্বর
      const final = shuffle ? shufflePaper(result) : result;
      setPaper({ ...final, fontScale, layout, docType, level });
      setIsDemo(demo);
      setPhase('done');
      setStep(4);
      // চিত্র-স্লটে ক্যাটালগ-ম্যাচ স্বয়ংক্রিয় বসানো — শক্ত মিল থাকলেই (আত্মবিশ্বাস-থ্রেশহোল্ড
      // matchFigureVector-এই); দুর্বল বর্ণনা খালি থাকে — শিক্ষক AI/হাতে আঁকবেন
      const slots = collectQpFigureSlots(final.sections);
      const auto: Record<string, QpFigureFill | null> = {};
      for (const s of slots) {
        const qText = final.sections[s.secIdx]?.questions[s.qIdx]?.text ?? '';
        const m = s.desc ? matchFigureVector(s.desc, qText) : null;
        auto[s.key] = m ? fillFromMatch(m, s.desc) : null;
      }
      setFigFills(auto);
      // সাম্প্রতিক তালিকায় তুলে রাখা — পরের বার এক ক্লিকে ফেরত
      const got = sumQpMarks(final);
      pushQpHistory({
        ts: Date.now(),
        rawText: rawText.trim(),
        meta: effMeta,
        format,
        fontScale,
        layout,
        docType,
        level,
        counts: {
          sections: final.sections.length,
          questions: final.sections.reduce((n, s) => n + s.questions.length, 0),
          marks: got ?? 0,
        },
      });
      setHistVersion((v) => v + 1);
    };

    if (useAi) {
      const header = [
        effMeta.schoolName && `school_name: ${effMeta.schoolName}`,
        // সাজেশন-শিটে পরীক্ষার নাম পাঠানো হয় না — সেখানে এই ঘরই প্রযোজ্য নয়
        docType !== 'suggestion' && effMeta.examTitle && `exam_title: ${effMeta.examTitle}`,
        effMeta.subject && `subject: ${effMeta.subject}`,
        effMeta.classLabel && `class: ${effMeta.classLabel}`,
        effMeta.date && `date: ${effMeta.date}`,
        effMeta.time && `time: ${effMeta.time}`,
        effMeta.fullMarks && `full_marks: ${effMeta.fullMarks}`,
        // বিশ্ববিদ্যালয়-স্তর — বিভাগ/প্রোগ্রাম/সেশন/কোর্স-কোড
        level === 'university' && effMeta.department && `department: ${effMeta.department}`,
        level === 'university' && effMeta.program && `program: ${effMeta.program}`,
        level === 'university' && effMeta.session && `session: ${effMeta.session}`,
        level === 'university' && effMeta.subjectCode && `course_code: ${effMeta.subjectCode}`,
      ].filter(Boolean).join('\n');
      const prompt = [
        'HEADER:',
        header || '(none provided)',
        '',
        ...(level === 'university' ? ['LEVEL: university — university exam conventions apply.', ''] : []),
        'RAW QUESTION TEXT:',
        rawText.trim().slice(0, 20000),
        '',
        'Structure this into the final ' + (docType === 'suggestion' ? 'suggestion sheet' : 'question paper') + ' JSON now.',
      ].join('\n');

      const system = docType === 'suggestion' ? QP_SUGGESTION_SYSTEM : QP_STRUCTURE_SYSTEM;
      const res = await callAi({ prompt, system });
      // প্রথম উত্তর ভাঙা JSON হলে একবার মেরামত-পুনরায় — মডেল প্রায়ই দ্বিতীয়বার ঠিক করে
      let data = res.ok && res.text ? extractQpJson<unknown>(res.text) : null;
      if (res.ok && res.text && !data) {
        const retry = await callAi({ prompt: `${prompt}\n\n${QP_REPAIR_NOTE}`, system });
        if (retry.ok && retry.text) data = extractQpJson<unknown>(retry.text);
      }
      // সাজেশন-ধরনে AI-এর ফিরতি examTitle জোর করে ফাঁকা হয় (docType সচেতন নরমালাইজ)
      const result = data ? normalizeQpJson(data, effMeta, format, docType) : null;
      if (result) {
        finish(result, !!res.demo);
        return;
      }
      // AI সাড়া দেয়নি / বোধগম্য কাঠামো দেয়নি — অফলাইন পার্সার ফলব্যাক (গ্রেসফুল)
      const local = parseQuestionText(rawText, effMeta, format, lang);
      if (local) {
        finish(local, false);
        toast.info(tt('qp.noai'));
        return;
      }
      setError({ hintKey: res.ok ? 'qp.err.empty' : (res.hintKey ?? 'ai.err.title'), detail: res.detail });
      setPhase('error');
      return;
    }

    // সরাসরি অফলাইন পার্সার
    const local = parseQuestionText(rawText, effMeta, format, lang);
    if (!local) {
      setError({ hintKey: 'qp.toast.parseFail' });
      setPhase('error');
      return;
    }
    finish(local, false);
  };

  const insertIntoSheet = () => {
    if (!paper) return;
    const html = paperToEditorHtml(paper, lang, figPlan);
    // প্রশ্নপত্র = পূর্ণ-পাতা ডকুমেন্ট — সম্পূর্ণ ডকুমেন্টের একদম শেষে বসে
    // (থিসিস-স্টুডিওর মতো ডকুমেন্ট-স্তরের অ্যাকশন)। সক্রিয় পাতার পরে বসালে
    // বহু-পাতার প্রশ্নপত্র/অধ্যায়ের মাঝে ঢুকে ধারাবাহিকতা ভাঙত; আর কারেন্ট
    // পাতার শেষে জুড়লে উপচে পড়ত (অটো-ফ্লো ডিফল্টে বন্ধ — প্রতি-পাতা
    // সম্পাদনা-আইসোলেশন রুল — ফলে লেখা নীরবে কাটা পড়ত)।
    // শেষ পাতা ফাঁকা সাধারণ পাতা হলে সেটাই ব্যবহার — অহেতুক ফাঁকা পাতা জমে না।
    const st = useEditorStore.getState();
    const last = st.pages[st.pages.length - 1];
    const lastUsable = !!last && last.kind === 'normal' && !last.flowLock && htmlIsEmpty(last.html);
    const insertedToast = () => toast.success(tt(docType === 'suggestion' ? 'qp.toast.inserted.sug' : 'qp.toast.inserted'));
    const reveal = (id: string) => {
      const idx = useEditorStore.getState().pages.findIndex((p) => p.id === id);
      if (idx >= 0) document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
    };
    if (lastUsable) {
      // শেষ পাতা ফাঁকা — সেখানেই বসান (নতুন পাতা নয়)
      const targetId = last.id;
      st.replacePageHtml(targetId, html);
      st.setActivePage(targetId);
      insertedToast();
      close();
      window.setTimeout(() => {
        // এক-বারের পেজিনেশন — দীর্ঘ প্রশ্নপত্র যত পাতা লাগে ভাগ হয়
        // (অটো-ফ্লো চালু হয় না — পরে এক পাতায় সম্পাদনা অন্য পাতা নড়ায় না)
        void paginateInsertedReader(targetId);
        reveal(targetId);
      }, 320);
      return;
    }
    try {
      const newId = st.addPage(last?.id ?? null, html);
      st.setActivePage(newId);
      insertedToast();
      close();
      window.setTimeout(() => {
        void paginateInsertedReader(newId);
        reveal(newId);
      }, 320);
    } catch {
      toast.error(tt('qp.err.title'));
    }
  };

  const downloadPaper = () => {
    if (!paper) return;
    const html = paperToStandaloneHtml(paper, lang, figPlan);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    // ফাইল-নাম — সাজেশনে পরীক্ষার নাম নয়: বিষয়-ভিত্তিক নাম; প্রশ্নপত্রে আগের প্রথা
    const name = (paper.meta.schoolName
      || (paper.docType === 'suggestion' ? paper.meta.subject : paper.meta.examTitle)
      || (paper.docType === 'suggestion' ? 'suggestion-sheet' : 'question-paper'))
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .trim()
      .slice(0, 48) || (paper.docType === 'suggestion' ? 'suggestion-sheet' : 'question-paper');
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.html`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4_000);
    toast.success(tt('qp.toast.download'));
  };

  // সরাসরি প্রিন্ট — স্বয়ংসম্পূর্ণ প্রিন্ট-ফাইল নতুন উইন্ডোতে লিখে প্রিন্ট-ডায়ালগ
  const printPaper = () => {
    if (!paper) return;
    const w = window.open('', '_blank');
    if (!w) {
      // পপ-আপ ব্লক — ডাউনলোডে নেমে পড়ুন
      downloadPaper();
      toast.info(tt('qp.toast.popup'));
      return;
    }
    w.document.open();
    w.document.write(paperToStandaloneHtml(paper, lang, figPlan));
    w.document.close();
    toast.success(tt('qp.toast.print'));
    window.setTimeout(() => {
      try { w.focus(); w.print(); } catch { /* ব্লক/বন্ধ */ }
    }, 450);
  };

  // সাম্প্রতিক প্রশ্নপত্র — এক ক্লিকে উইজার্ডে ফেরত (পুরনো এন্ট্রিতে কোড/সেট-ঘর থাকতে পারে না)
  const loadHistory = (h: QpHistoryItem) => {
    if (busy) return;
    setRawText(h.rawText);
    setMeta((prev) => ({
      ...(prev ?? defaultQpMeta(lang)),
      ...h.meta,
      subjectCode: h.meta.subjectCode ?? '',
      setCode: h.meta.setCode ?? '',
      syllabusNote: h.meta.syllabusNote ?? '',
    }));
    setFormat(h.docType !== 'suggestion' && h.format === 'sugslip' ? 'auto' : h.format);
    setFontScale(h.fontScale);
    setLayout(normalizeQpLayout(h.layout));
    setDocType(h.docType ?? 'question');
    setLevel(coerceQpLevel(h.level) ?? (h.format === 'university' ? 'university' : 'school'));
    setInstrDraft((h.meta.instructions ?? []).join('\n'));
    setImage(null);
    setPhase('idle');
    setError(null);
    setStep(2);
  };

  const removeHistory = (ts: number) => {
    removeQpHistoryItem(ts);
    setHistVersion((v) => v + 1);
  };

  const goStep = (s: Step) => {
    if (busy) return;
    if (s > 1 && !rawText.trim()) {
      toast.info(tt('qp.toast.noText'));
      return;
    }
    if (s === 4 && !paper) return;
    // ধাপ ২-তে ঢুকলেই কাঁচা-লেখার হেডার (স্কুল/বিষয়/শ্রেণি/সময়/পূর্ণমান/কোড) ফর্মে বসে —
    // শুধু ফাঁকা/ডিফল্ট ঘর; শিক্ষকের নিজের লেখা কখনো বদলায় না। আগে জেনারেটের পরে বসত —
    // ততক্ষণে ফর্মে আগের প্রশ্নপত্রের পুরনো মান দেখিয়ে বিভ্রান্তি হত।
    if (s >= 2 && meta) setMeta(qpPreambleMeta(rawText, meta, lang, docType));
    setStep(s);
  };

  const gotoNextFromInput = () => {
    if (!rawText.trim()) {
      toast.info(tt('qp.toast.noText'));
      return;
    }
    if (meta) setMeta(qpPreambleMeta(rawText, meta, lang, docType));
    setStep(2);
  };

  // ── চিত্র-স্লট → পূর্ণক-পরিকল্পনা ──
  // স্লট-তালিকা (বিভাগ→প্রশ্ন→ক্রম), শিক্ষকের বসানো চিত্র-ম্যাপ, আর রেন্ডার-অর্ডারে সারিবদ্ধ পরিকল্পনা
  const figSlots = useMemo(() => (paper ? collectQpFigureSlots(paper.sections) : []), [paper]);
  const figPlan = useMemo(
    () => figSlots.map((s) => figFills[s.key] ?? null),
    [figSlots, figFills],
  );
  const previewHtml = useMemo(() => (paper ? paperToEditorHtml(paper, lang, figPlan) : ''), [paper, lang, figPlan]);
  const resolved = useMemo(() => (paper ? resolveQpFormat(paper) : 'classic'), [paper]);
  const stats = useMemo(() => {
    if (!paper) return { q: 0, sec: 0, mcq: 0, star: 0, tag: 0 };
    let q = 0, mcq = 0, star = 0, tag = 0;
    for (const s of paper.sections) {
      q += s.questions.length;
      mcq += s.questions.filter((x) => x.options.length > 0).length;
      star += s.questions.filter((x) => x.importance).length;
      tag += s.questions.filter((x) => x.yearTag).length;
    }
    return { q, sec: paper.sections.length, mcq, star, tag };
  }, [paper]);
  // প্রো-যাচাই: প্রশ্নের মোট নম্বর বনাম ফর্মের পূর্ণমান
  const totals = useMemo(() => {
    if (!paper) return null;
    const got = sumQpMarks(paper);
    if (got == null) return null;
    const want = parseLocaleInt(paper.meta.fullMarks);
    return { got, want };
  }, [paper]);
  const marksMismatch = totals?.want != null && totals.want !== totals.got;

  const pages = Math.max(1, Math.ceil((sheetH || pageH) / pageH));
  const effScale = Math.max(0.25, Math.min(1.4, fitScale * zoomMult));

  const patchMeta = (patch: Partial<QpMeta>) => {
    setMeta((prev) => (prev ? { ...prev, ...patch } : prev));
    // প্রস্তুত প্রশ্নপত্র থাকলে মেটা-বদলও লাইভ — ধাপ ২-এ স্কুল/বিষয়/সময় বদলালে প্রিভিউ
    // সঙ্গে সঙ্গে আপডেট হয় (আগে স্ন্যাপশটে পুরনো মেটাই থেকে যেত)
    setPaper((p) => (p ? { ...p, meta: { ...p.meta, ...patch } } : p));
  };

  // ── চিত্র-ব্যবস্থাপনা: অ্যাকশন ──

  /** স্লটে ক্যাটালগের সেরা-মিল চিত্র বসানো (শিক্ষকের হাতে "মেলাও" বাটন) */
  const autoMatchSlot = (key: string) => {
    const slot = figSlots.find((s) => s.key === key);
    if (!slot || !paper) return;
    const qText = paper.sections[slot.secIdx]?.questions[slot.qIdx]?.text ?? '';
    const m = matchFigureVector(slot.desc, qText);
    if (!m) {
      toast.info(tt('qp.fig.noMatch'));
      return;
    }
    setFigFills((prev) => ({ ...prev, [key]: fillFromMatch(m, slot.desc) }));
    toast.success(`${tt('qp.fig.matched')}: ${m.def.label}`);
  };

  /** সব স্লটে সেরা-মিল একসাথে */
  const autoMatchAll = () => {
    if (!paper) return;
    let hit = 0;
    setFigFills((prev) => {
      const next = { ...prev };
      for (const s of figSlots) {
        const qText = paper.sections[s.secIdx]?.questions[s.qIdx]?.text ?? '';
        const m = s.desc ? matchFigureVector(s.desc, qText) : null;
        if (m) { next[s.key] = fillFromMatch(m, s.desc); hit++; }
      }
      return next;
    });
    toast.success(tFmt('qp.fig.matchedMany', { n: fmtNum(hit), total: fmtNum(figSlots.length) }));
  };

  /**
   * AI দিয়ে চিত্র বানানো — বর্ণনা + প্রশ্নের প্রেক্ষাপট → লাইন-আর্ট SVG →
   * sanitizeFigureSvg দিয়ে নিরাপদ করে doc-figure হিসেবে বসানো। ব্যর্থ হলে স্লট খালিই থাকে।
   */
  const aiGenerateSlot = async (key: string): Promise<void> => {
    const slot = figSlots.find((s) => s.key === key);
    if (!slot || !paper || figBusy[key]) return;
    const qText = paper.sections[slot.secIdx]?.questions[slot.qIdx]?.text ?? '';
    setFigBusy((prev) => ({ ...prev, [key]: true }));
    try {
      const prompt = [
        `FIGURE DESCRIPTION: ${slot.desc || (lang === 'en' ? 'the diagram the question needs' : lang === 'hi' ? 'प्रश्न में जो चित्र चाहिए' : 'প্রশ্নে যে চিত্র দরকার')}`,
        `QUESTION: ${qText.slice(0, 400)}`,
        '',
        'Draw this figure as the JSON shape { "svg": "…" }.',
      ].join('\n');
      const res = await callAi({ prompt, system: QP_FIGURE_SVG_SYSTEM, thinking: false });
      if (!res.ok || !res.text) {
        toast.error(tt('qp.fig.aiFail'));
        return;
      }
      const parsed = extractQpJson<{ svg?: string }>(res.text);
      const svgRaw = typeof parsed?.svg === 'string' ? parsed.svg : '';
      const fill = svgRaw ? fillFromSvg(svgRaw, slot.desc) : null;
      if (!fill) {
        toast.error(tt('qp.fig.aiFail'));
        return;
      }
      setFigFills((prev) => ({ ...prev, [key]: fill }));
      if (res.demo) setIsDemo(true);
      toast.success(tt('qp.fig.aiDone'));
    } catch {
      toast.error(tt('qp.fig.aiFail'));
    } finally {
      setFigBusy((prev) => ({ ...prev, [key]: false }));
    }
  };

  /** সব মিলহীন স্লটে AI চিত্র — ধারাবাহিক (সার্ভার-বান্ধব); মাঝপথে ব্যর্থ হলে বাকিগুলো চলতেই থাকে */
  const aiGenerateAll = async (): Promise<void> => {
    const pending = figSlots.filter((s) => !figFills[s.key]);
    for (const s of pending) {
      await aiGenerateSlot(s.key);
    }
    if (pending.length > 0) toast.success(tt('qp.fig.aiAllDone'));
  };

  /** স্লটের চিত্র বাদ — ম্যানুয়াল খালি-বক্সে ফেরত */
  const clearSlotFill = (key: string) => {
    setFigFills((prev) => ({ ...prev, [key]: null }));
  };

  // নির্দেশনা-বাক্সের প্রদর্শিত লেখা — ড্রাফট না থাকলে ফর্ম-মান থেকে
  const instrText = instrDraft ?? (meta ? meta.instructions.join('\n') : '');

  // ধাপ ৩-এর লাইভ-ডিজাইন বদল — প্রস্তুত প্রশ্নপত্র সঙ্গে সঙ্গে নতুন সাজে রেন্ডার হয়
  const changeFormat = (f: QpFormat) => { setFormat(f); patchLive({ format: f }); };
  const changeTypo = (s: QpFontScale) => { setFontScale(s); patchLive({ fontScale: s }); };
  const changeLayout = (key: keyof QpLayout, v: string) => {
    const next = { ...layout, [key]: v } as QpLayout;
    setLayout(next);
    patchLive({ layout: next });
  };

  /**
   * ডকুমেন্ট-ধরন বদল — সাজেশন-শিটে সময়/পূর্ণমান প্রযোজ্য নয় (বোর্ড-প্রথায়
   * সাজেশনে সময়/নম্বর লেখা হয় না)। ভাষা-ডিফল্ট মান টানলে অদল-বদলে
   * পরিষ্কার/ফেরত বসে — শিক্ষকের নিজের লেখা মান কখনো বদলায় না।
   */
  const changeDocType = (next: QpDocType) => {
    if (next === docType || !meta) return;
    const d = defaultQpMeta(lang);
    const isDefTime = !meta.time.trim() || meta.time === d.time;
    const isDefMarks = !meta.fullMarks.trim() || meta.fullMarks === d.fullMarks;
    const isDefExam = !meta.examTitle.trim() || meta.examTitle === d.examTitle;
    let nextMeta: QpMeta;
    if (next === 'suggestion') {
      // সাজেশন-শিটে সময়/পূর্ণমান/পরীক্ষার নাম প্রযোজ্য নয় — ভাষা-ডিফল্ট মান ফাঁকা হয়;
      // শিক্ষকের নিজের লেখা মান অক্ষত থাকে (ফেরত গেলে হারায় না)
      nextMeta = {
        ...meta,
        ...(isDefTime ? { time: '' } : {}),
        ...(isDefMarks ? { fullMarks: '' } : {}),
        ...(isDefExam ? { examTitle: '' } : {}),
      };
    } else {
      // প্রশ্নপত্রে ফেরা — ডিফল্ট-মান ফাঁকা ঘরে ফেরত বসে
      nextMeta = {
        ...meta,
        ...(meta.time.trim() ? {} : { time: d.time }),
        ...(meta.fullMarks.trim() ? {} : { fullMarks: d.fullMarks }),
        ...(meta.examTitle.trim() ? {} : { examTitle: d.examTitle }),
      };
    }
    setMeta(nextMeta);
    setDocType(next);
    // ফরম্যাট-সামঞ্জস্য — sugslip সাজেশন-পর্চার ফরম্যাট; প্রশ্নপত্রে গেলে auto-তে ফেরত
    // (তালিকা থেকেও sugslip বাদ, তাই অবৈধ বাছাই ঝুলে থাকবে না)
    const nextFormat: QpFormat = next === 'question' && format === 'sugslip' ? 'auto' : format;
    if (nextFormat !== format) setFormat(nextFormat);
    // প্রস্তুত প্রশ্নপত্র থাকলে ধরন + মেটা দুটোই লাইভ — প্রিভিউ সঙ্গে সঙ্গে সাজেশন-সাজে
    // (আগে শুধু state বদলাত — স্ন্যাপশটে পুরনো সময়/মান/ধরনই থেকে যেত)
    patchLive({ docType: next, meta: nextMeta, ...(nextFormat !== format ? { format: nextFormat } : {}) });
  };

  /**
   * স্তর-বদল — বিশ্ববিদ্যালয়ে কোর্স-কোড/বিভাগ/বর্ষ-সেশন প্রথা + বিশ্ববিদ্যালয়-ফরম্যাট;
   * ডিফল্ট নির্দেশনাও স্তর-অনুযায়ী অদল-বদল হয় (শিক্ষকের নিজের লেখা নির্দেশনা কখনো বদলায় না)।
   */
  const changeLevel = (next: QpLevel) => {
    if (next === level || !meta) return;
    const nextFormat: QpFormat = next === 'university' ? 'university' : 'auto';
    const nextInstr = next === 'university'
      ? (isDefaultQpInstructions(meta.instructions, lang, 'school') ? qpUniversityInstructions(lang) : meta.instructions)
      : (isDefaultQpInstructions(meta.instructions, lang, 'university') ? defaultQpMeta(lang).instructions : meta.instructions);
    const nextMeta = { ...meta, instructions: nextInstr };
    setLevel(next);
    setFormat(nextFormat);
    setMeta(nextMeta);
    patchLive({ level: next, format: nextFormat, meta: nextMeta });
  };

  // ── ধাপ ১: ইনপুট ──
  const stepInput = (
    <section aria-label={tt('qp.step.input')} className="flex flex-col gap-3">
      <div>
        <PSection tone="emerald" icon={Shapes} title={tt('qp.docType.title')} className="mb-1.5" />
        <div className="qp-doctypes" role="radiogroup" aria-label={tt('qp.docType.title')}>
          {DOC_TYPES.map((dt) => (
            <button
              key={dt.id} type="button" role="radio" aria-checked={docType === dt.id}
              className={cn('qp-doctype', docType === dt.id && 'qp-doctype-on')}
              onClick={() => changeDocType(dt.id)}
              disabled={busy}
            >
              <span className="qp-doctype-vis" aria-hidden="true"><DocTypeVis id={dt.id} /></span>
              <span className="flex items-center gap-2">
                <PTile size="sm" tone={dt.id === 'question' ? 'emerald' : 'fuchsia'} icon={dt.id === 'question' ? FileQuestion : Star} />
                <strong>{tt(dt.label)}</strong>
              </span>
              <span className="qp-doctype-desc">{tt(dt.desc)}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <PSection tone="emerald" icon={GraduationCap} title={tt('qp.level.title')} className="mb-1.5" />
        <div className="qp-doctypes" role="radiogroup" aria-label={tt('qp.level.title')}>
          {LEVELS.map((lv) => (
            <button
              key={lv.id} type="button" role="radio" aria-checked={level === lv.id}
              className={cn('qp-doctype', level === lv.id && 'qp-doctype-on')}
              onClick={() => changeLevel(lv.id)}
              disabled={busy}
            >
              <span className="flex items-center gap-2">
                <PTile size="sm" tone={lv.id === 'school' ? 'amber' : 'purple'} icon={lv.id === 'school' ? GraduationCap : Landmark} />
                <strong>{tt(lv.label)}</strong>
              </span>
              <span className="qp-doctype-desc">{tt(lv.desc)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="qp-modes" role="radiogroup" aria-label={tt('qp.step.input')}>
        <button
          type="button" role="radio" aria-checked={mode === 'photo'}
          className={cn('qp-mode', mode === 'photo' && 'qp-mode-on')}
          onClick={() => setMode('photo')}
        >
          <PTile size="sm" tone="teal" icon={Camera} className="mb-1 [&>svg]:mb-0! [&>svg]:text-white!" />
          <span className="qp-mode-name">{tt('qp.mode.photo')}</span>
          <span className="qp-mode-desc">{tt('qp.mode.photo.desc')}</span>
        </button>
        <button
          type="button" role="radio" aria-checked={mode === 'text'}
          className={cn('qp-mode', mode === 'text' && 'qp-mode-on')}
          onClick={() => setMode('text')}
        >
          <PTile size="sm" tone="cyan" icon={PenLine} className="mb-1 [&>svg]:mb-0! [&>svg]:text-white!" />
          <span className="qp-mode-name">{tt('qp.mode.text')}</span>
          <span className="qp-mode-desc">{tt('qp.mode.text.desc')}</span>
        </button>
      </div>

      {mode === 'photo' ? (
        <>
          {!image ? (
            <div
              className={cn('ai-drop', dragOver && 'ai-drop-over')}
              role="button" tabIndex={0} aria-label={tt('qp.drop.title')}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInputRef.current?.click(); } }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void acceptFile(file);
              }}
            >
              <ImageIcon size={24} aria-hidden="true" className="ai-drop-icon" />
              <p className="ai-drop-title">{tt('qp.drop.title')}</p>
              <p className="ai-drop-hint">{tt('qp.drop.hint')}</p>
            </div>
          ) : (
            <div className="ai-thumb-row">
              <img src={image.dataUrl} alt={image.name} className="ai-thumb" />
              <div className="ai-thumb-meta">
                <p className="ai-thumb-name">{image.name}</p>
                <p className="ai-thumb-dim">{image.width} × {image.height}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" onClick={() => void transcribe()} disabled={busy}>
                    {phase === 'transcribing' || phase === 'verifying'
                      ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> {tt(phase === 'verifying' ? 'qp.busy.verify' : 'qp.transcribing')}</>
                      : <><Sparkles size={13} aria-hidden="true" /> {tt('qp.transcribe')}</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={busy}>{tt('ai.drop.change')}</Button>
                </div>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef} type="file"
            accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void acceptFile(file);
              e.target.value = '';
            }}
          />
          <p className="qp-hint qp-drop-tips">{tt('qp.drop.tips')}</p>
          {!configured ? (
            <p className="qp-hint qp-byok-note">
              {tt('qp.photo.byokNote')}{' '}
              <button type="button" className="qp-byok-link" onClick={() => openDialog('aiSettings')}>
                {tt('ai.setup.open')}
              </button>
            </p>
          ) : null}
        </>
      ) : null}

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="ai-field-label">{tt(docType === 'suggestion' ? 'qp.raw.label.sug' : 'qp.raw.label')}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setRawText(qpSampleText(lang, docType, level))}>
              <Sparkles size={12} aria-hidden="true" /> {tt('qp.sample')}
            </Button>
            {rawText ? (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={cleanText} title={tt('qp.clean')}>
                <Eraser size={12} aria-hidden="true" /> {tt('qp.clean')}
              </Button>
            ) : null}
            {rawText ? (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-red-600 hover:text-red-700" onClick={() => { setRawText(''); setImage(null); }}>
                <Trash2 size={12} aria-hidden="true" /> {tt('qp.clear')}
              </Button>
            ) : null}
          </div>
        </div>
        <Textarea
          ref={rawRef}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={tt(docType === 'suggestion' ? 'qp.raw.ph.sug' : 'qp.raw.ph')}
          className="qp-raw min-h-[150px]"
          disabled={busy}
        />
        <p className="qp-hint">{tt(docType === 'suggestion' ? 'qp.raw.hint.sug' : 'qp.raw.hint')}</p>
        {mode === 'photo' && image && rawText.trim() ? (
          <p className="qp-hint qp-check-hint">{tt('qp.transcribe.editHint')}</p>
        ) : null}
      </div>

      {history.length > 0 ? (
        <div className="qp-hist">
          <span className="qp-hist-title"><History size={11} aria-hidden="true" /> {tt('qp.hist.title')}</span>
          <div className="qp-hist-row">
            {history.map((h) => {
              // চিপ-লেবেল — সাজেশন-এন্ট্রিতে পরীক্ষার নাম নয়: বিষয় → "সাজেশন শিট" লেবেল
              const label = h.meta.schoolName
                || h.meta.subject
                || (h.docType === 'suggestion' ? tt('qp.docType.suggestion') : h.meta.examTitle)
                || tt('qp.title');
              const cnt = h.counts;
              return (
                <span key={h.ts} className="qp-hist-chip">
                  <button
                    type="button" className="qp-hist-open" title={tt('qp.hist.load')}
                    onClick={() => loadHistory(h)}
                  >
                    <span className="qp-hist-name">{label}</span>
                    {h.meta.subject ? <span className="qp-hist-sub">· {h.meta.subject}</span> : null}
                    {cnt && cnt.questions > 0 ? (
                      <span className="qp-hist-sub">· {fmtNum(cnt.questions)} {tt('qp.count.q')}</span>
                    ) : null}
                  </button>
                  <button
                    type="button" className="qp-hist-x" title={tt('qp.hist.del')}
                    aria-label={`${tt('qp.hist.del')}: ${label}`}
                    onClick={() => removeHistory(h.ts)}
                  >
                    <X size={10} aria-hidden="true" />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button onClick={gotoNextFromInput} disabled={busy || !rawText.trim()}>
          {tt('qp.next')} <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );

  // ── ধাপ ২: বিস্তারিত ──
  const stepDetails = meta ? (
    <section aria-label={tt('qp.step.details')} className="qp-form">
      <label className="qp-field qp-field-full">
        <span>{tt(level === 'university' ? 'qp.meta.uni.school' : 'qp.meta.school')}</span>
        <Input
          value={meta.schoolName}
          onChange={(e) => patchMeta({ schoolName: e.target.value })}
          placeholder={tt(level === 'university' ? 'qp.meta.uni.school.ph' : 'qp.meta.school.ph')}
          disabled={busy}
        />
      </label>
      {docType !== 'suggestion' ? (
        <label className="qp-field">
          <span>{tt('qp.meta.exam')}</span>
          <Input value={meta.examTitle} onChange={(e) => patchMeta({ examTitle: e.target.value })} disabled={busy} />
        </label>
      ) : null}
      <label className="qp-field">
        <span>{tt(level === 'university' ? 'qp.meta.uni.subject' : 'qp.meta.subject')}</span>
        <Input value={meta.subject} onChange={(e) => patchMeta({ subject: e.target.value })} disabled={busy} />
      </label>
      <label className="qp-field">
        <span>{tt(level === 'university' ? 'qp.meta.uni.class' : 'qp.meta.class')}</span>
        <Input
          value={meta.classLabel}
          onChange={(e) => patchMeta({ classLabel: e.target.value })}
          placeholder={level === 'university' ? tt('qp.meta.uni.class.ph') : undefined}
          disabled={busy}
        />
      </label>
      <label className="qp-field">
        <span>{tt('qp.meta.date')}</span>
        <div className="flex gap-1.5">
          <Input value={meta.date} onChange={(e) => patchMeta({ date: e.target.value })} disabled={busy} />
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => patchMeta({ date: formatDateLong(new Date(), lang) })} disabled={busy}>
            <CalendarDays size={14} aria-hidden="true" /> {tt('qp.meta.today')}
          </Button>
        </div>
      </label>
      {docType !== 'suggestion' ? (
        <label className="qp-field">
          <span>{tt('qp.meta.time')}</span>
          <Input value={meta.time} onChange={(e) => patchMeta({ time: e.target.value })} disabled={busy} />
        </label>
      ) : null}
      {docType !== 'suggestion' ? (
        <label className="qp-field">
          <span>{tt('qp.meta.marks')}</span>
          <Input value={meta.fullMarks} onChange={(e) => patchMeta({ fullMarks: e.target.value })} disabled={busy} />
        </label>
      ) : null}
      {docType !== 'suggestion' ? (
        <>
          <label className="qp-field">
            <span>{tt(level === 'university' ? 'qp.meta.uni.code' : 'qp.meta.code')}</span>
            <Input
              value={meta.subjectCode ?? ''}
              onChange={(e) => patchMeta({ subjectCode: e.target.value })}
              placeholder={tt(level === 'university' ? 'qp.meta.uni.code.ph' : 'qp.meta.code.ph')}
              disabled={busy}
            />
          </label>
          <label className="qp-field">
            <span>{tt('qp.meta.set')}</span>
            <Input
              value={meta.setCode ?? ''}
              onChange={(e) => patchMeta({ setCode: e.target.value })}
              placeholder={tt('qp.meta.set.ph')}
              disabled={busy}
            />
          </label>
          <label className="qp-field qp-field-full">
            <span>{tt('qp.meta.syllabus')}</span>
            <Input
              value={meta.syllabusNote ?? ''}
              onChange={(e) => patchMeta({ syllabusNote: e.target.value })}
              placeholder={tt('qp.meta.syllabus.ph')}
              disabled={busy}
            />
          </label>
          {level === 'university' ? (
            <>
              <label className="qp-field">
                <span>{tt('qp.meta.uni.dept')}</span>
                <Input
                  value={meta.department ?? ''}
                  onChange={(e) => patchMeta({ department: e.target.value })}
                  placeholder={tt('qp.meta.uni.dept.ph')}
                  disabled={busy}
                />
              </label>
              <label className="qp-field">
                <span>{tt('qp.meta.uni.program')}</span>
                <Input
                  value={meta.program ?? ''}
                  onChange={(e) => patchMeta({ program: e.target.value })}
                  placeholder={tt('qp.meta.uni.program.ph')}
                  disabled={busy}
                />
              </label>
              <label className="qp-field qp-field-full">
                <span>{tt('qp.meta.uni.session')}</span>
                <Input
                  value={meta.session ?? ''}
                  onChange={(e) => patchMeta({ session: e.target.value })}
                  placeholder={tt('qp.meta.uni.session.ph')}
                  disabled={busy}
                />
              </label>
            </>
          ) : null}
        </>
      ) : null}
      <label className="qp-field qp-field-full">
        <span>{tt('qp.meta.instructions')}</span>
        <Textarea
          value={instrText}
          onChange={(e) => setInstrDraft(e.target.value)}
          className="min-h-[70px]"
          disabled={busy}
        />
      </label>
      {docType === 'suggestion' ? (
        <label className="qp-field qp-field-full">
          <span>{tt('qp.meta.teacher')}</span>
          <Input
            value={meta.teacherName ?? ''}
            onChange={(e) => patchMeta({ teacherName: e.target.value })}
            disabled={busy}
          />
        </label>
      ) : null}
      {docType !== 'suggestion' ? (
        <div className="qp-field qp-field-full qp-switch-row">
          <span>{tt('qp.meta.studentLine')}</span>
          <Switch checked={meta.studentLine} onCheckedChange={(v) => patchMeta({ studentLine: v })} disabled={busy} aria-label={tt('qp.meta.studentLine')} />
        </div>
      ) : null}
      <div className="qp-nav-row">
        <Button variant="outline" onClick={() => setStep(1)} disabled={busy}>
          <ChevronLeft size={14} aria-hidden="true" /> {tt('qp.back')}
        </Button>
        <Button onClick={() => setStep(3)} disabled={busy}>
          {tt('qp.next')} <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </section>
  ) : null;

  // ── ধাপ ৩: নকশা ──
  const stepFormat = (
    <section aria-label={tt('qp.step.format')} className="flex flex-col gap-3">
      <PSection tone="purple" icon={LayoutTemplate} title={tt('qp.format.title')} />
      <div className="qp-formats" role="radiogroup" aria-label={tt('qp.format.title')}>
        {formatsForDocType(docType).map((f) => (
          <button
            key={f.id} type="button" role="radio" aria-checked={format === f.id}
            className={cn('qp-format', format === f.id && 'qp-format-on')}
            onClick={() => changeFormat(f.id)}
            disabled={busy}
          >
            <span className="qp-format-vis" aria-hidden="true"><FormatVis id={f.id} /></span>
            <strong>{tt(f.label)}</strong>
            <span className="qp-format-desc">{tt(f.desc)}</span>
          </button>
        ))}
      </div>

      <div className="qp-design-opts">
        <div className="qp-design-block">
          <PSection tone="amber" icon={Type} title={tt('qp.typo.title')} />
          <div className="qp-scale" role="radiogroup" aria-label={tt('qp.typo.title')}>
            {FONT_SCALES.map((s) => (
              <button
                key={s.id} type="button" role="radio" aria-checked={fontScale === s.id}
                className={cn('qp-scale-btn', fontScale === s.id && 'qp-scale-on')}
                onClick={() => changeTypo(s.id)}
                disabled={busy}
              >
                {tt(s.key)}
              </button>
            ))}
          </div>
        </div>
        <div className="qp-design-block qp-design-shuffle">
          <span className="qp-shuffle-label">
            <strong>{tt('qp.shuffle')}</strong>
            <span className="qp-shuffle-desc">{tt('qp.shuffle.desc')}</span>
          </span>
          <Switch checked={shuffle} onCheckedChange={(v) => setShuffle(v)} disabled={busy} aria-label={tt('qp.shuffle')} />
        </div>
      </div>

      {/* উন্নত সাজ-অপশন — বাংলাদেশ-প্রথা: ২/৩ কলাম, পাতার মাপ, নম্বর/মান/বিভাগ-শৈলী */}
      <button
        type="button" className="qp-adv-toggle" onClick={() => setShowAdv((v) => !v)}
        aria-expanded={showAdv}
      >
        <SlidersHorizontal size={14} aria-hidden="true" />
        <span>{tt(showAdv ? 'qp.layout.hide' : 'qp.layout.adv')}</span>
        {showAdv ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
      </button>
      {showAdv ? (
        <div className="qp-adv">
          {ADV_GROUPS.map((g) => (
            <div key={g.id} className="qp-adv-block">
              <span className="ai-field-label">{tt(g.label)}</span>
              <div className="qp-scale" role="group" aria-label={tt(g.label)}>
                {g.opts.map((o) => {
                  const on = String(layout[g.id]) === o.v;
                  return (
                    <button
                      key={o.v} type="button" aria-pressed={on}
                      className={cn('qp-scale-btn', on && 'qp-scale-on')}
                      onClick={() => changeLayout(g.id, o.v)}
                      disabled={busy}
                    >
                      {tt(o.key)}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!configured ? (
        <div className="ai-setup" role="note">
          <p className="ai-setup-title"><Sparkles size={14} aria-hidden="true" /> {tt('ai.setup.title')}</p>
          <p className="ai-setup-desc">{tt('qp.setup.note')}</p>
          <Button size="sm" variant="outline" className="ai-save-btn" onClick={() => openDialog('aiSettings')}>
            {tt('ai.setup.open')}
          </Button>
        </div>
      ) : null}

      <div className="qp-nav-row">
        <Button variant="outline" onClick={() => setStep(2)} disabled={busy}>
          <ChevronLeft size={14} aria-hidden="true" /> {tt('qp.back')}
        </Button>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" title={tt('qp.noai.tip')} onClick={() => void generate(false)} disabled={busy}>
            <Zap size={14} aria-hidden="true" /> {tt('qp.noai')}
          </Button>
          <Button onClick={() => void generate(true)} disabled={busy}>
            {phase === 'generating'
              ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> {tt('qp.generating')}</>
              : <><Wand2 size={14} aria-hidden="true" /> {tt(docType === 'suggestion' ? 'qp.generate.sug' : 'qp.generate')}</>}
          </Button>
        </div>
      </div>
    </section>
  );

  // ── ধাপ ৪: প্রিভিউ ──
  const stepPreview = paper ? (
    <section aria-label={tt(docType === 'suggestion' ? 'qp.preview.title.sug' : 'qp.preview.title')} className="flex flex-col gap-2">
      <div className="qp-stats" role="status">
        <span className="qp-stat"><strong>{fmtNum(stats.sec)}</strong> {tt('qp.count.sec')}</span>
        <span className="qp-stat"><strong>{fmtNum(stats.q)}</strong> {tt('qp.count.q')}</span>
        {stats.mcq > 0 ? <span className="qp-stat"><strong>{fmtNum(stats.mcq)}</strong> {tt('qp.count.mcq')}</span> : null}
        {stats.star > 0 ? <span className="qp-stat"><strong>{fmtNum(stats.star)}</strong> {tt('qp.count.star')}</span> : null}
        {stats.tag > 0 ? <span className="qp-stat"><strong>{fmtNum(stats.tag)}</strong> {tt('qp.count.tag')}</span> : null}
        {totals ? (
          <span
            className={cn('qp-stat', marksMismatch && 'qp-stat-warn')}
            title={marksMismatch ? tt('qp.stat.mismatch') : undefined}
          >
            <strong>{fmtNum(totals.got)}</strong> {tt('qp.stat.total')}
            {marksMismatch ? <CircleAlert size={11} aria-hidden="true" className="ml-1 inline" /> : null}
          </span>
        ) : null}
        {shuffle ? <span className="qp-stat qp-stat-set">{tt('qp.shuffle')}</span> : null}
        <span className="qp-stat qp-stat-page">{tt('qp.preview.pages').replace('{n}', fmtNum(pages))}</span>
        {isDemo ? <PPill tone="ai">{tt('qp.demo.badge')}</PPill> : null}
        <span className="qp-stat-zoom">
          <button type="button" aria-label={tt('qp.zoomOut')} onClick={() => setZoomMult((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} disabled={busy}><ZoomOut size={13} aria-hidden="true" /></button>
          <span>{fmtNum(Math.round(effScale * 100))}%</span>
          <button type="button" aria-label={tt('qp.zoomIn')} onClick={() => setZoomMult((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))} disabled={busy}><ZoomIn size={13} aria-hidden="true" /></button>
        </span>
      </div>

      {/* ── চিত্র-ব্যবস্থাপনা — [চিত্র: …] স্লট থাকলেই প্রিভিউ-বাক্সের উপরে ── */}
      {figSlots.length > 0 ? (
        <div className="qp-figman" role="group" aria-label={tt('qp.fig.title')}>
          <div className="qp-figman-head">
            <PSection tone="rose" icon={ImageIcon} title={tFmt('qp.fig.count', { n: fmtNum(figSlots.length) })} />
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" onClick={autoMatchAll} disabled={busy} title={tt('qp.fig.matchAllTip')}>
                <Sparkles size={13} aria-hidden="true" /> {tt('qp.fig.matchAll')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => void aiGenerateAll()} disabled={busy} title={tt('qp.fig.aiAllTip')}>
                {Object.values(figBusy).some(Boolean)
                  ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> {tt('qp.fig.aiWorking')}</>
                  : <><Wand2 size={13} aria-hidden="true" /> {tt('qp.fig.aiAll')}</>}
              </Button>
            </div>
          </div>
          <p className="qp-figman-hint">{tt('qp.fig.hint')}</p>
          <div className="qp-figman-list">
            {figSlots.map((s) => {
              const fill = figFills[s.key] ?? null;
              const slotBusy = !!figBusy[s.key];
              const qLabel = `${tt('qp.fig.qLabel')} ${paper?.sections[s.secIdx]?.questions[s.qIdx]?.number ?? ''}`;
              return (
                <div key={s.key} className={cn('qp-figman-row', fill && 'qp-figman-row-filled')}>
                  <span className="qp-figman-thumb" aria-hidden="true">
                    {fill ? (
                      <img src={fill.src} alt="" className="max-h-14 max-w-24 object-contain" draggable={false} />
                    ) : <span className="qp-figman-empty">□</span>}
                  </span>
                  <div className="qp-figman-meta">
                    <p className="qp-figman-desc" title={s.desc}>{s.desc || tt('qp.fig.noDesc')}</p>
                    <p className="qp-figman-where">{qLabel}</p>
                  </div>
                  <div className="qp-figman-actions">
                    {!fill ? (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => autoMatchSlot(s.key)} disabled={slotBusy} title={tt('qp.fig.matchTip')}>
                          <Sparkles size={13} aria-hidden="true" /> {tt('qp.fig.match')}
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => void aiGenerateSlot(s.key)} disabled={slotBusy} title={tt('qp.fig.aiTip')}>
                          {slotBusy
                            ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> {tt('qp.fig.aiWorking')}</>
                            : <><Wand2 size={13} aria-hidden="true" /> {tt('qp.fig.ai')}</>}
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => clearSlotFill(s.key)} disabled={slotBusy} title={tt('qp.fig.clearTip')}>
                        <X size={13} aria-hidden="true" /> {tt('qp.fig.clear')}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div ref={previewWrapRef} className="qp-preview">
        <div
          className="qp-preview-spacer"
          style={{
            height: sheetH ? sheetH * effScale : undefined,
            width: pageW * effScale,
            maxWidth: '100%',
          }}
        >
          <div
            ref={sheetRef}
            className="qp-sheet"
            style={{
              transform: `scale(${effScale})`,
              transformOrigin: 'top left',
              width: pageW,
              minHeight: pageH,
            }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
          {/* পাতা-বিভাজক নির্দেশক — কোথায় আসল পাতা ভাঙবে তার আন্দাজ */}
          {Array.from({ length: Math.max(0, pages - 1) }, (_, i) => (
            <span
              key={i}
              className="qp-page-guide"
              style={{ top: pageH * effScale * (i + 1) }}
              data-page={`${tt('qp.guide.page')} ${fmtNum(i + 2)}`}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
      <p className="qp-hint">{tt('qp.preview.hint')}</p>

      <div className="qp-nav-row">
        <Button variant="outline" onClick={() => setStep(3)} disabled={busy}>
          <ChevronLeft size={14} aria-hidden="true" /> {tt('qp.editback')}
        </Button>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void generate(true)} disabled={busy}>
            <RefreshCw size={14} aria-hidden="true" /> {tt('qp.regen')}
          </Button>
          <Button variant="outline" onClick={printPaper} disabled={busy} title={tt('qp.toast.print')}>
            <Printer size={14} aria-hidden="true" /> {tt('qp.print')}
          </Button>
          <Button variant="outline" onClick={downloadPaper} disabled={busy}>
            <Download size={14} aria-hidden="true" /> {tt('qp.download')}
          </Button>
          <Button onClick={insertIntoSheet} disabled={busy} title={tt('qp.insert.tip')}>
            <BookPlus size={14} aria-hidden="true" /> {tt('qp.insert')}
          </Button>
        </div>
      </div>
    </section>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="qp-dialog max-h-[94dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('qp.title')}</DialogTitle>
          <DialogDescription>{tt('qp.desc')}</DialogDescription>
        </DialogHeader>
        <PHero
          tone="emerald"
          icon={FileQuestion}
          title={tt('qp.title')}
          desc={tt('qp.desc')}
          badge={isDemo && paper ? <PPill tone="ai">{tt('qp.demo.badge')}</PPill> : undefined}
        />

        {/* ধাপ-নির্দেশক */}
        <div className="qp-steps" role="list" aria-label={tt('qp.title')}>
          {STEPS.map((s, i) => (
            <button
              key={s.id} type="button" role="listitem"
              className={cn('qp-step', step === s.id && 'qp-step-on', step > s.id && 'qp-step-done')}
              onClick={() => goStep(s.id)}
              disabled={busy}
              aria-current={step === s.id ? 'step' : undefined}
            >
              <span className="qp-step-dot">{step > s.id ? <Check size={11} aria-hidden="true" /> : fmtNum(s.id)}</span>
              <span className="qp-step-label">{tt(s.key)}</span>
              {i < STEPS.length - 1 ? <span className="qp-step-line" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>

        {step === 1 ? stepInput : null}
        {step === 2 ? stepDetails : null}
        {step === 3 ? stepFormat : null}
        {step === 4 ? stepPreview : null}

        {/* ত্রুটি */}
        {phase === 'error' && error ? (
          <div className="ai-error" role="alert">
            <CircleAlert size={15} aria-hidden="true" />
            <div>
              <p className="ai-error-title">{tt('qp.err.title')}</p>
              <p>{tt(error.hintKey)}</p>
              {error.detail ? <p className="ai-error-detail">{error.detail}</p> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="outline" onClick={() => {
                setPhase('idle');
                setError(null);
                if (image && !rawText.trim()) void transcribe();
                else void generate(true);
              }}>
                <RefreshCw size={13} aria-hidden="true" /> {tt('qp.regen')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openDialog('aiSettings')}>{tt('ai.setup.open')}</Button>
            </div>
          </div>
        ) : null}

        {/* AI কাজের ওভারলে */}
        {busy ? (
          <div className="qp-progress" role="status" aria-live="polite">
            <div className="qp-progress-card">
              <Loader2 size={22} className="qp-progress-spin" aria-hidden="true" />
              <p className="qp-progress-title">
                {phase === 'transcribing' ? tt('qp.busy.read') : phase === 'verifying' ? tt('qp.busy.verify') : tt(docType === 'suggestion' ? 'qp.busy.analyze.sug' : 'qp.busy.analyze')}
              </p>
              <p className="qp-progress-wait">{tt('qp.busy.wait')}</p>
              <span className="ai-progress" aria-hidden="true"><span /></span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
