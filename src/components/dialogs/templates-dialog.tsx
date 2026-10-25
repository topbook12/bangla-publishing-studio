/**
 * টেমপ্লেট স্টোর — বইয়ের সম্পূর্ণ ডিজাইন (ব্লুপ্রিন্ট) + পাতার টেমপ্লেট — এক জায়গায়।
 *
 * ট্যাব ১ — "বইয়ের ডিজাইন": ধাঁচ-ভিত্তিক (genre) সম্পূর্ণ বই-ব্লুপ্রিন্ট (উপন্যাস, কবিতা,
 *   পাঠ্যবই, বিজ্ঞান, শিশু, রান্না… মোট ১২টি)। প্রয়োগ = কাগজ+ফন্ট+হেডার-সেটিংসসহ
 *   প্রি-ডিজাইন পাতার সেট — সব পাতা সম্পূর্ণ এডিটেবল। দুই মোড:
 *     • "এই ডিজাইনে বই শুরু করুন" — স্ন্যাপশট-সুরক্ষিত পুরো-বই প্রয়োগ
 *     • "পাতাগুলো যোগ করুন" — বর্তমান লেখা অক্ষত রেখে ডিজাইন-পাতাগুলো পরে বসানো
 * ট্যাব ২ — "পাতার টেমপ্লেট": প্রো-লেভেল পৃষ্ঠা-নকশা (শিরোনাম পাতা, সূচিপত্র, সনদ… ) —
 *   ক্লিক = নতুন পাতা, "এই পাতায়" = বর্তমান পাতার লেখা বদল।
 *
 * প্রিভিউ: প্রতিটি কার্ডে টেমপ্লেটের আসল HTML স্কেল-ডাউন প্রিভিউ (উপরের অংশ ক্রপ) —
 * যা দেখা যায়, বইয়ে ঠিক তেমনই বসে।
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, Award, Baby, Bookmark, BookMarked, BookOpen, Briefcase, Building2, Feather,
  FileStack, FileText, FlaskConical, GraduationCap, HeartPulse, Landmark, LayoutTemplate, List,
  Megaphone, Moon, Newspaper, Palette, PartyPopper, PenLine, Receipt, Replace, Scale, Search,
  Sparkles, UtensilsCrossed, type LucideIcon,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PHero, PPill, PSection, PTile, type PTone } from '@/components/premium';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import {
  PAGE_TEMPLATES, TEMPLATE_CATEGORY_LABELS, TEMPLATE_CATEGORY_ORDER,
  templatePreviewRows, type PageTemplate, type TemplateCategory,
} from '@/lib/page-templates';
import {
  BOOK_BLUEPRINTS, BLUEPRINT_GENRE_META, blueprintToPageData,
  type BlueprintGenre, type BookBlueprint,
} from '@/lib/book-templates';
import { getPaperPreset, fontStackOf } from '@/lib/paper';
import { blueprintMarginsForPaper } from '@/lib/page-layout';
import { DS_CATEGORY_LABELS, DS_CATEGORY_ORDER, DS_TEMPLATES, type DsCategory } from '@/lib/document-studio';
import { newId } from '@/lib/dexie';
import { ensurePageEditorMounted, fitTemplatePage, htmlIsEmpty } from '@/components/editor/page-ops';
import { primeTocEntriesInHtml } from '@/lib/toc';
import { StaticContent } from '@/components/editor/static-content';
import type { DocumentSettings, HeaderFooterSettings, PageData } from '@/lib/types';
import { useT, useFmtNum, useLangStore, getLang } from '@/lib/i18n';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OneColorDropdown } from './one-color-picker';

/** প্রিভিউ শিটের ভার্চুয়াল প্রস্থ (px) — কার্ডের প্রস্থ অনুযায়ী স্কেল হয় */
const SHEET_WIDTH = 620;

/**
 * ধাঁচ (genre) → lucide আইকন — book-templates-এর ইমোজি-চিপের প্রিমিয়াম বিকল্প।
 * আইকন বর্তমান টেক্সটের রংই ধার করে (চিপ active হলে primary-foreground)।
 * নতুন ধাঁচ যোগ হলে ফলব্যাক BookOpen।
 */
const GENRE_ICONS: Record<BlueprintGenre, LucideIcon> = {
  literature: BookOpen,
  poetry: Feather,
  textbook: GraduationCap,
  science: FlaskConical,
  children: Baby,
  cooking: UtensilsCrossed,
  history: Landmark,
  coaching: PenLine,
  journal: BookMarked,
  report: Briefcase,
  magazine: Newspaper,
  islamic: Moon,
};

/** ধাঁচ → Aurora টোন — কার্ড-টাইলের গ্রেডিয়েন্ট (প্রিভিউ-ওভারলে চিপ টেমপ্লেটের নিজস্ব accent ধরে রাখে) */
const GENRE_TONES: Record<BlueprintGenre, PTone> = {
  literature: 'violet', poetry: 'pink', textbook: 'cyan', science: 'teal', children: 'lime',
  cooking: 'orange', history: 'amber', coaching: 'emerald', journal: 'purple', report: 'slate',
  magazine: 'rose', islamic: 'emerald',
};

/** পাতার টেমপ্লেট ক্যাটাগরি → Aurora টোন ও আইকন — কার্ডের রঙিন টাইল */
const TPL_CAT_TONES: Record<TemplateCategory, PTone> = {
  title: 'violet', front: 'cyan', toc: 'teal', author: 'orange', chapter: 'emerald', special: 'fuchsia',
};
const TPL_CAT_ICONS: Record<TemplateCategory, LucideIcon> = {
  title: FileText, front: BookMarked, toc: List, author: PenLine, chapter: Bookmark, special: Award,
};

/** ডকুমেন্ট-স্টুডিও ক্যাটাগরি → Aurora টোন ও আইকন */
const DS_CAT_TONES: Record<DsCategory, PTone> = {
  career: 'teal', office: 'slate', finance: 'emerald', legal: 'cyan', cert: 'amber',
  edu: 'violet', event: 'fuchsia', med: 'rose', promo: 'orange', regional: 'lime',
};
const DS_CAT_ICONS: Record<DsCategory, LucideIcon> = {
  career: Briefcase, office: Building2, finance: Receipt, legal: Scale, cert: Award,
  edu: GraduationCap, event: PartyPopper, med: HeartPulse, promo: Megaphone, regional: Landmark,
};

function GenreIcon({ genre, size = 11, className }: { genre: BlueprintGenre; size?: number; className?: string }) {
  const Icon = GENRE_ICONS[genre] ?? BookOpen;
  return <Icon size={size} className={className} aria-hidden="true" />;
}

/**
 * প্রয়োগ-ব্যর্থতার জেনেরিক বার্তা — dict-এ টেমপ্লেট-প্রয়োগের জেনেরিক error-কী নেই,
 * তাই ভাষা-অনুযায়ী ফলব্যাক (bn/hi/en — অর্কেস্ট্রেটর-অনুমোদিত হার্ডকোড)।
 */
/** ত্রিভাষিক লেবেল-পাঠ — বর্তমান ভাষায় (bn/hi/en) */
function tx3(v: { bn: string; hi: string; en: string } | undefined, lang: 'bn' | 'hi' | 'en'): string {
  if (!v) return '';
  return v[lang] || v.bn;
}

function applyFailMsg(): string {
  const lang = getLang();
  if (lang === 'en') return 'Could not apply — please try again';
  if (lang === 'hi') return 'लागू नहीं हो सका — फिर से कोशिश करें';
  return 'প্রয়োগ করা যায়নি — আবার চেষ্টা করুন';
}

/** প্রিভিউয়ের জন্য খালি স্পেসার প্যারাগ্রাফগুলো বাদ দিয়ে ডিজাইনটি কমপ্যাক্টভাবে দেখানো */
function compactForPreview(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
    const root = doc.getElementById('r');
    if (!root) return html;
    root.querySelectorAll('p').forEach((el) => {
      const isEmpty = !(el.textContent ?? '').trim() && !el.querySelector('img,svg,hr,.doc-textbox,.callout-box,.mcq-block,.toc-block');
      if (isEmpty) el.remove();
    });
    return root.innerHTML;
  } catch {
    return html;
  }
}

/** আসল HTML-এর স্কেল-ডাউন ক্রপ-প্রিভিউ (উপরের নকশা-অংশ বড় করে দেখায়) */
function SheetPreview({ html, className }: { html: string; className?: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SHEET_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const settings = useEditorStore((s) => s.settings);

  return (
    <div
      ref={wrapRef}
      className={cn('relative overflow-hidden rounded-lg border border-border bg-white', className)}
      aria-hidden="true"
    >
      <div
        className="bwp-static pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{
          width: SHEET_WIDTH,
          transform: `scale(${scale})`,
          fontFamily: fontStackOf(settings.defaultFont),
          fontSize: `${settings.defaultFontSize}pt`,
          lineHeight: settings.lineHeight,
          ['--page-paragraph-gap' as string]: '8px',
          padding: '14px 26px 0',
        }}
      >
        <StaticContent html={compactForPreview(html)} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

// ═════════════════════════ বই-ব্লুপ্রিন্ট কার্ড ═════════════════════════

/** ব্লুপ্রিন্টের প্রিভিউ-পাতা — শিরোনাম-ধাঁচের (h1-যুক্ত) পাতা পেলে সেটাই, নইলে প্রথমটি */
function blueprintPreviewHtml(bp: BookBlueprint): string {
  const titlePage = bp.pages.find((p) => p.html.includes('<h1'));
  return (titlePage ?? bp.pages[0])?.html ?? '<p></p>';
}

function blueprintSettingsPatch(bp: BookBlueprint): Partial<DocumentSettings> {
  const b = bp.settings;
  const patch: Partial<DocumentSettings> = {};
  if (b.paperSize) {
    patch.paperSize = b.paperSize;
    // জনর-ভিত্তিক মার্জিন — ব্লুপ্রিন্ট পুরো বইয়ের মালিকানা নেয় (replace), তাই গ্লোবাল
    // মার্জিনে বসে; Demy উপন্যাসে ১″ ডিফল্টে ৩.৪″ টেক্সট-কলামের বিপর্যয় আর হয় না।
    if (b.margins) {
      patch.margins = blueprintMarginsForPaper(b.margins, b.paperSize, b.paperSize, 'portrait', { widthMm: 210, heightMm: 297 });
    }
  }
  if (b.paperColor) patch.paperColor = b.paperColor;
  if (b.defaultFont) patch.defaultFont = b.defaultFont;
  if (b.defaultFontSize) patch.defaultFontSize = b.defaultFontSize;
  if (b.lineHeight) patch.lineHeight = b.lineHeight;
  if (b.paragraphSpacing) patch.paragraphSpacing = b.paragraphSpacing;
  if (b.pageBorder) patch.pageBorder = b.pageBorder;
  if (b.accentColor) patch.pageBorderColor = b.accentColor;
  if (b.headerStyle) {
    const mk = (style: HeaderFooterSettings['style']): HeaderFooterSettings => ({
      enabled: true,
      style,
      leftText: b.headerLeft ?? '',
      centerText: b.headerCenter ?? '',
      rightText: b.headerRight ?? '',
      accentColor: b.accentColor ?? '#7f1d1d',
      fontSize: 9,
    });
    patch.header = mk(b.headerStyle);
    patch.footer = mk(b.headerStyle === 'parallel' ? 'plain' : b.headerStyle);
  }
  return patch;
}

function BlueprintCard({ bp, onStart, onInsert }: {
  bp: BookBlueprint;
  onStart: (bp: BookBlueprint) => void;
  onInsert: (bp: BookBlueprint) => void;
}) {
  const tt = useT();
  const nf = useFmtNum();
  const lang = useLangStore((s) => s.lang);
  const genre = BLUEPRINT_GENRE_META[bp.genre];
  const paper = bp.settings.paperSize ? getPaperPreset(bp.settings.paperSize) : null;

  return (
    <div className="group relative flex flex-col gap-2.5 rounded-xl border border-border bg-card p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
      {/* স্তূপ-প্রিভিউ: পেছনে দুটি সরে যাওয়া পাতা, সামনে আসল HTML প্রিভিউ */}
      <div className="bp-preview-stack h-48">
        <div className="bp-preview-page left-2.5 top-1.5" style={{ transform: 'rotate(-2.4deg)' }} />
        <div className="bp-preview-page left-1 top-1" style={{ transform: 'rotate(1.6deg)' }} />
        <SheetPreview html={blueprintPreviewHtml(bp)} className="h-48" />
        <span
          className="absolute left-2 top-2 z-10 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm"
          style={{ backgroundColor: bp.accent }}
        >
          <GenreIcon genre={bp.genre} size={11} />
          {tx3(genre.label, lang)}
        </span>
        <span className="absolute right-2 top-2 z-10 rounded-full border border-border bg-background/95 px-2 py-0.5 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm">
          {tt('store.bp.pageCount').split('{n}').join(nf(bp.pages.length))}
        </span>
      </div>

      <div className="flex items-start gap-2">
        <PTile tone={GENRE_TONES[bp.genre]} icon={GENRE_ICONS[bp.genre]} size="sm" className="mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{tx3(bp.name, lang)}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tx3(bp.desc, lang)}</p>
        </div>
      </div>

      {/* সেটআপ-চিপ: কাগজ · ফন্ট · সাইজ · মার্জিন */}
      <div className="flex flex-wrap gap-1">
        {paper && <span className="chip text-[10px]">{tt('store.bp.paper')}: {paper.name}</span>}
        {bp.settings.defaultFont && <span className="chip text-[10px]">{bp.settings.defaultFont}</span>}
        {bp.settings.defaultFontSize && <span className="chip text-[10px]">{nf(bp.settings.defaultFontSize)}pt</span>}
        {bp.settings.margins && (
          <span className="chip text-[10px]" title={tt('store.bp.marginsTip')}>
            {tt('store.bp.margins')}: {nf(bp.settings.margins.left)}″
          </span>
        )}
      </div>

      <p className="text-[10px] leading-snug text-muted-foreground/80">
        <Sparkles size={10} className="mr-1 inline-block" aria-hidden="true" />
        {bp.tags.map((tg) => tx3(tg, lang)).join(' · ')}
      </p>

      <div className="mt-auto flex gap-1.5">
        <button
          type="button"
          onClick={() => onStart(bp)}
          className="flex-1 rounded-md bg-primary px-2 py-1.5 text-[11px] font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring"
        >
          {tt('store.bp.start')}
        </button>
        <button
          type="button"
          onClick={() => onInsert(bp)}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-[11px] font-medium text-foreground transition hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
          title={tt('store.bp.insertTip')}
        >
          {tt('store.bp.insert')}
        </button>
      </div>
    </div>
  );
}

// ═════════════════════════ পাতার টেমপ্লেট কার্ড ═════════════════════════

function TemplateCard({ tpl, onPick, onReplace, canReplace }: {
  tpl: PageTemplate;
  onPick: (t: PageTemplate) => void;
  onReplace: (t: PageTemplate) => void;
  canReplace: boolean;
}) {
  const tt = useT();
  const nf = useFmtNum();
  const lang = useLangStore((s) => s.lang);
  const rows = templatePreviewRows(tpl.kind);
  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-lg hover:shadow-primary/10">
      <button
        type="button"
        onClick={() => onPick(tpl)}
        className="flex flex-col gap-2 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={tt('dlg1.tpl.ariaAdd').split('{name}').join(tx3(tpl.name, lang))}
      >
        <SheetPreview html={tpl.html} className="h-48" />
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
            <PTile tone={TPL_CAT_TONES[tpl.category]} icon={TPL_CAT_ICONS[tpl.category]} size="sm" className="shrink-0" />
            {tx3(tpl.name, lang)}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tx3(tpl.desc, lang)}</p>
        </div>
      </button>
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onReplace(tpl)}
              disabled={!canReplace}
              className={cn(
                'absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-background/95 px-1.5 py-1 text-[10px] font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition',
                canReplace ? 'hover:border-primary hover:text-primary' : 'cursor-not-allowed opacity-40',
              )}
              aria-label={tt('dlg1.tpl.ariaReplace').split('{name}').join(tx3(tpl.name, lang))}
            >
              <Replace size={11} /> {tt('dlg1.tpl.thisPage')}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {canReplace ? tt('dlg1.tpl.replaceTip') : tt('dlg1.tpl.replaceNo')}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* ফলব্যাক প্রিভিউ ডেটা (স্ক্রিন-রিডারের জন্য বর্ণনা সংরক্ষণ) */}
      <span className="sr-only">{tt('dlg1.tpl.previewRows').split('{n}').join(nf(rows.length))}</span>
    </div>
  );
}

// ═════════════════════════ পাতা মাউন্ট-ফিট-রিভিল ═════════════════════════

/** নতুন টেমপ্লেট-পাতা মাউন্ট করিয়ে কাগজে আঁটানো ও ভিউপোর্টে এনে দেখানো */
async function mountFitAndReveal(pageId: string): Promise<void> {
  // ডায়ালগ-বন্ধের ফোকাস-রিস্টোর/রি-রেন্ডার থিতু হোক
  await new Promise((r) => window.setTimeout(r, 220));
  // দূরের পাতাও ভিউপোর্টে এনে তবেই এডিটর মাউন্ট হয় — তাই আগে স্ক্রল,
  // পরে মাউন্ট-অপেক্ষা; মাউন্ট না হলে আবার স্ক্রল করে চেষ্টা (রিট্রাই)
  for (let attempt = 0; attempt < 3; attempt++) {
    const idx = useEditorStore.getState().pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
    if (await ensurePageEditorMounted(pageId)) break;
  }
  // ছোট কাগজেও নকশা যেন ভাঙা না লাগে — ফাঁকা স্পেসারগুলো মুছে আঁটানো
  fitTemplatePage(pageId);
  const idx = useEditorStore.getState().pages.findIndex((p) => p.id === pageId);
  if (idx >= 0) {
    document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
  }
}

/** সব সদ্য-যোগ হওয়া টেমপ্লেট পাতা ফিট করা (ব্লুপ্রিন্ট-প্রয়োগের পরে) */
async function fitAllBlueprintPages(pageIds: string[]): Promise<void> {
  await new Promise((r) => window.setTimeout(r, 220));
  for (const id of pageIds) {
    const idx = useEditorStore.getState().pages.findIndex((p) => p.id === id);
    if (idx < 0) continue;
    document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
    if (await ensurePageEditorMounted(id)) {
      fitTemplatePage(id);
    }
  }
  const first = pageIds[0];
  if (first) {
    const idx = useEditorStore.getState().pages.findIndex((p) => p.id === first);
    if (idx >= 0) {
      document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
    }
  }
}

/**
 * ঢোকানো টেমপ্লেট পাতার খালি সূচিপত্র সঙ্গে সঙ্গে ভরে দেওয়া —
 * ইঞ্জিনের ১২০০ms অপেক্ষার খালি-সূচির ফ্ল্যাশ আর নেই (পরে ইঞ্জিন নিজেই সিঙ্ক রাখে)।
 */
function primeEmptyTocs(pageIds: string[]): void {
  const st = useEditorStore.getState();
  for (const id of pageIds) {
    const page = st.pages.find((p) => p.id === id);
    if (!page) continue;
    const html = primeTocEntriesInHtml(page.html, st.pages, st.settings);
    if (html !== page.html) st.replacePageHtml(id, html);
  }
}

// ═════════════════════════ মূল স্টোর-ডায়ালগ ═════════════════════════

type StoreTab = 'book' | 'page' | 'doc';
type GenreFilter = BlueprintGenre | 'all';

export function TemplatesDialog() {
  const tt = useT();
  const nf = useFmtNum();
  const openDialog = useUiStore((s) => s.openDialog);
  const openAny = useUiStore((s) => s.open);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'templates';
  const lang = useLangStore((s) => s.lang);
  const [tab, setTab] = useState<StoreTab>('book');
  const [query, setQuery] = useState('');
  const [genre, setGenre] = useState<GenreFilter>('all');
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all');
  const [replaceTarget, setReplaceTarget] = useState<PageTemplate | null>(null);
  const [startBp, setStartBp] = useState<BookBlueprint | null>(null);

  const searching = query.trim().length > 0;

  // ─── ব্লুপ্রিন্ট প্রয়োগ ───
  const applyStart = (bp: BookBlueprint) => {
    setStartBp(null);
    void (async () => {
      const s = useEditorStore.getState();
      try {
        // নিরাপত্তা-স্ন্যাপশট — পুরনো বই স্ন্যাপশট ডায়ালগ থেকে ফেরানো যায়
        try { await s.takeSnapshot('auto'); } catch { /* ইন-মেমরি মোড */ }
        const cover = s.pages.find((p) => p.kind === 'cover');
        const pages = blueprintToPageData(bp, newId);
        const finalPages = cover ? [cover, ...pages] : pages;
        s.replaceBook(finalPages, blueprintSettingsPatch(bp));
        primeEmptyTocs(finalPages.map((p) => p.id));
        toast.success(tt('store.bp.toastStarted').split('{name}').join(tx3(bp.name, lang)), {
          description: tt('store.bp.toastStartedDesc'),
        });
        close();
        // সব ডিজাইন-পাতা কাগজে আঁটানো — শুধু প্রথমটা নয়; বই-প্রতিরূপের পরের
        // পাতাগুলোও (কপিরাইট/সূচি/পরিশিষ্ট) মার্জিন-ব্যবধানে নকশা ভাঙা লাগত
        void fitAllBlueprintPages(finalPages.filter((p) => p.kind !== 'cover').map((p) => p.id));
      } catch (err) {
        // প্রয়োগ ব্যর্থ হলে ডায়ালগ ব্যবহারযোগ্য থাকে — ব্যস্ত অবস্থা নেই, শুধু জানানো হয়
        console.error('[templates] applyStart failed', err);
        toast.error(applyFailMsg());
      }
    })();
  };

  const applyInsert = (bp: BookBlueprint) => {
    try {
      const s = useEditorStore.getState();
      const globalPs = s.settings.paperSize;
      const bpPs = bp.settings.paperSize;
      const st = s.settings;
      // জনর-ভিত্তিক মার্জিন — ব্লুপ্রিন্টের কাগজ থেকে বর্তমান গ্লোবাল কাগজে স্কেল
      const bpMargins = bp.settings.margins
        ? blueprintMarginsForPaper(bp.settings.margins, bpPs, globalPs, st.orientation, st.customPaper)
        : null;
      // ফাঁকা ডকুমেন্টে সম্পূর্ণ বই বসছে — পুরো সেটআপ-প্যাচই গ্লোবালে (QP-সন্নিবেশের
      // fresh-doc শাখার মতোই); লেখা-আছে এমন ডকুমেন্টে কেবল নতুন পাতাগুলোতে per-page
      // override — বাকি পাতা অক্ষত (প্রতি-পাতা আইসোলেশন হার্ড-রুল)।
      const docFresh = s.pages.length > 0
        && s.pages.every((p) => p.kind === 'normal' && !p.flowLock && htmlIsEmpty(p.html));
      if (docFresh) s.updateSettings(blueprintSettingsPatch(bp));
      let after = s.activePageId ?? s.pages[s.pages.length - 1]?.id ?? null;
      const newIds: string[] = [];
      for (const p of bp.pages) {
        const id = s.addPage(after, p.html);
        const pagePatch: Partial<PageData> = { noChrome: Boolean(p.noChrome), flowLock: p.flowLock ?? true };
        if (!docFresh) {
          // ডিজাইন-নিষ্ঠা: ব্লুপ্রিন্টের মার্জিন পাতার নিজস্ব বলে থাকে; কাগজ ভিন্ন হলে
          // কাগজ-ওভাররাইডও (Day-2 QP-প্যাটার্ন) — মিশ্র-মাপ ডকুমেন্টেও নকশা হুবহু থাকে
          if (bpMargins) {
            // কাগজ-ওভাররাইড বসলে পাতা ব্লুপ্রিন্টের নিজের কাগজেই রেন্ডার হয় →
            // রেফারেন্স মার্জিনই সঠিক; গ্লোবাল কাগজে থাকলে স্কেল-করা মার্জিন
            pagePatch.marginsOverride = (bpPs && bpPs !== globalPs)
              ? { ...bp.settings.margins!, gutter: 0 }
              : bpMargins;
          }
          if (bpPs && bpPs !== globalPs) pagePatch.paperSizeOverride = bpPs;
        }
        s.updatePage(id, pagePatch);
        newIds.push(id);
        after = id;
      }
      primeEmptyTocs(newIds);
      toast.success(tt('store.bp.toastInserted').split('{name}').join(tx3(bp.name, lang)), {
        description: tt('store.bp.toastInsertedDesc'),
      });
      close();
      void fitAllBlueprintPages(newIds);
    } catch (err) {
      console.error('[templates] applyInsert failed', err);
      toast.error(applyFailMsg());
    }
  };

  // ─── পাতার টেমপ্লেট ───
  const pick = (tpl: PageTemplate) => {
    try {
      const s = useEditorStore.getState();
      const afterId = s.activePageId ?? s.pages[s.pages.length - 1]?.id ?? null;
      const newId2 = s.addPage(afterId, tpl.html);
      // টেমপ্লেট = পূর্ণ-পাতার নকশা — অটো-ফ্লো ভাঙবে না; ব্যবহারকারী লিখতে শুরু
      // করলেই লক নিজে থেকেই খুলে যায় (page-editor onUpdate)
      s.updatePage(newId2, { flowLock: true });
      s.setActivePage(newId2);
      primeEmptyTocs([newId2]);
      toast.success(tt('dlg1.tpl.toastAdded').split('{name}').join(tx3(tpl.name, lang)), {
        description: tt('dlg1.tpl.toastAddedDesc'),
      });
      close();
      void mountFitAndReveal(newId2);
    } catch (err) {
      console.error('[templates] pick failed', err);
      toast.error(applyFailMsg());
    }
  };

  const activePage = useEditorStore((s) => s.pages.find((p) => p.id === s.activePageId) ?? null);
  const canReplace = Boolean(activePage && activePage.kind === 'normal');

  const confirmReplace = () => {
    if (!replaceTarget) return;
    const s = useEditorStore.getState();
    const pageId = s.activePageId;
    if (!pageId) return;
    try {
      s.replacePageHtml(pageId, replaceTarget.html);
      s.updatePage(pageId, { flowLock: true });
      s.setActivePage(pageId);
      primeEmptyTocs([pageId]);
      toast.success(tt('dlg1.tpl.toastReplaced').split('{name}').join(tx3(replaceTarget.name, lang)));
      setReplaceTarget(null);
      close();
      void mountFitAndReveal(pageId);
    } catch (err) {
      // ব্যর্থ হলে নিশ্চিতকরণ-অ্যালার্ট বন্ধ করে ডায়ালগ ব্যবহারযোগ্য রাখা হয়
      console.error('[templates] confirmReplace failed', err);
      setReplaceTarget(null);
      toast.error(applyFailMsg());
    }
  };

  // ─── ফিল্টার ───
  const genreMeta = BLUEPRINT_GENRE_META;
  const genreList = Object.keys(genreMeta) as BlueprintGenre[];
  const filteredBps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BOOK_BLUEPRINTS.filter((bp) => {
      if (!searching && genre !== 'all' && bp.genre !== genre) return false;
      if (!q) return true;
      const hay = `${tx3(bp.name, lang)} ${tx3(bp.desc, lang)} ${bp.tags.map((tg) => tx3(tg, lang)).join(' ')} ${tx3(genreMeta[bp.genre].label, lang)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, genre, searching, genreMeta, lang]);

  const filteredTpls = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PAGE_TEMPLATES.filter((t) => {
      if (!searching && cat !== 'all' && t.category !== cat) return false;
      if (!q) return true;
      const hay = `${tx3(t.name, lang)} ${tx3(t.desc, lang)} ${tx3(TEMPLATE_CATEGORY_LABELS[t.category], lang)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, cat, searching, lang]);

  const totalCount = BOOK_BLUEPRINTS.length + PAGE_TEMPLATES.length;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col overflow-hidden p-0 sm:max-w-5xl">
          {/* অ্যাক্সেসিবল নাম/বিবরণ sr-only-তে — দৃশ্যমান শিরোনাম এখন প্রিমিয়াম হিরো-প্যানেল */}
          <DialogHeader className="sr-only">
            <DialogTitle>{tt('store.title')}</DialogTitle>
            <DialogDescription>{tt('store.desc')}</DialogDescription>
          </DialogHeader>
          <div className="px-5 pt-4">
            <PHero
              tone="fuchsia"
              icon={LayoutTemplate}
              title={tt('store.title')}
              desc={tt('store.desc')}
              badge={(
                <PPill tone="info">
                  {tt('store.badge').split('{n}').join(nf(totalCount))}
                </PPill>
              )}
            />
          </div>

          {/* ট্যাব + সার্চ */}
          <div className="space-y-2 border-b px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex gap-1" role="tablist" aria-label={tt('store.tabAria')}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'book'}
                  onClick={() => setTab('book')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    tab === 'book'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  <BookOpen size={13} aria-hidden="true" />
                  {tt('store.tab.book')}
                  <span className="opacity-70">({nf(BOOK_BLUEPRINTS.length)})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'page'}
                  onClick={() => setTab('page')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    tab === 'page'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  <FileStack size={13} aria-hidden="true" />
                  {tt('store.tab.page')}
                  <span className="opacity-70">({nf(PAGE_TEMPLATES.length)})</span>
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === 'doc'}
                  onClick={() => setTab('doc')}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition',
                    tab === 'doc'
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  <FileText size={13} aria-hidden="true" />
                  {tt('store.tab.doc')}
                  <span className="opacity-70">({nf(DS_TEMPLATES.length)})</span>
                </button>
              </div>
              <div className="relative min-w-36 flex-1 sm:max-w-64">
                <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={tt('store.searchPh')}
                  className="h-8 pl-8 text-xs"
                  aria-label={tt('store.searchPh')}
                />
              </div>
            </div>

            {/* ক্যাটাগরি চিপ — ট্যাব অনুযায়ী */}
            {tab === 'book' && (
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={tt('store.genreAria')}>
                {(['all', ...genreList] as GenreFilter[]).map((g) => {
                  const count = g === 'all' ? BOOK_BLUEPRINTS.length : BOOK_BLUEPRINTS.filter((b) => b.genre === g).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={g}
                      type="button"
                      role="tab"
                      aria-selected={genre === g}
                      onClick={() => setGenre(g)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                        genre === g
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      {g === 'all' ? (
                        tt('dlg1.tpl.all')
                      ) : (
                        <>
                          <GenreIcon genre={g} size={11} className="mr-0.5 inline-block align-[-1px] opacity-80" />
                          {tx3(genreMeta[g].label, lang)}
                        </>
                      )}
                      <span className="ml-1 opacity-70">({nf(count)})</span>
                    </button>
                  );
                })}
              </div>
            )}
            {tab === 'page' && (
              <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={tt('dlg1.tpl.catAria')}>
                {(['all', ...TEMPLATE_CATEGORY_ORDER] as const).map((c) => {
                  const count = c === 'all' ? PAGE_TEMPLATES.length : PAGE_TEMPLATES.filter((t) => t.category === c).length;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="tab"
                      aria-selected={cat === c}
                      onClick={() => setCat(c)}
                      className={cn(
                        'rounded-full border px-2.5 py-1 text-[11px] font-medium transition',
                        cat === c
                          ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                          : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                      )}
                    >
                      {c === 'all' ? tt('dlg1.tpl.all') : tx3(TEMPLATE_CATEGORY_LABELS[c as TemplateCategory], lang)}
                      <span className="ml-1 opacity-70">({nf(count)})</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* গ্রিড */}
          <div className="min-h-0 flex-1 overflow-y-auto px-5">
            {tab === 'doc' ? (
              /* ডকুমেন্ট স্টুডিও — প্রথাসিদ্ধ ডকুমেন্ট-নকশার ক্যাটালগ */
              <div className="flex flex-col gap-3 pb-3">
                <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <PSection
                    tone="purple"
                    icon={FileText}
                    title={tt('store.doc.title')}
                    count={`(${nf(DS_TEMPLATES.length)})`}
                  />
                  <p className="text-[12px] leading-relaxed text-muted-foreground">{tt('store.doc.desc')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DS_CATEGORY_ORDER.map((c) => (
                      <span key={c} className="rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-foreground">
                        {DS_CATEGORY_LABELS[c][lang] ?? DS_CATEGORY_LABELS[c].bn}
                        <span className="ml-1 opacity-70">({nf(DS_TEMPLATES.filter((t) => t.category === c).length)})</span>
                      </span>
                    ))}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        close();
                        openAny('documentStudio');
                      }}
                      className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-ring"
                    >
                      <Sparkles size={13} aria-hidden="true" />
                      {tt('store.doc.cta')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {DS_TEMPLATES.map((t) => (
                    <div key={t.id} className="flex items-start gap-2 rounded-lg border border-border bg-card p-2.5">
                      <PTile tone={DS_CAT_TONES[t.category]} icon={DS_CAT_ICONS[t.category]} size="sm" className="mt-0.5" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="text-[12.5px] font-semibold leading-tight">{t.name[lang] ?? t.name.bn}</p>
                        <p className="text-[10.5px] leading-snug text-muted-foreground">{t.desc[lang] ?? t.desc.bn}</p>
                        <p className="mt-auto text-[9.5px] uppercase tracking-wide text-muted-foreground/70">
                          {DS_CATEGORY_LABELS[t.category][lang] ?? DS_CATEGORY_LABELS[t.category].bn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : tab === 'book' ? (
              filteredBps.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">{tt('store.noresult')}</p>
              ) : (
                <div className="flex flex-col gap-2.5 pb-3 pt-3">
                  <PSection tone="amber" icon={BookOpen} title={tt('store.tab.book')} count={`(${nf(filteredBps.length)})`} />
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredBps.map((bp) => (
                      <BlueprintCard key={bp.id} bp={bp} onStart={setStartBp} onInsert={applyInsert} />
                    ))}
                  </div>
                </div>
              )
            ) : (
              <>
                {filteredTpls.length === 0 ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">{tt('store.noresult')}</p>
                ) : (
                  <div className="flex flex-col gap-2.5 pb-1 pt-3">
                    <PSection tone="teal" icon={FileStack} title={tt('store.tab.page')} count={`(${nf(filteredTpls.length)})`} />
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {filteredTpls.map((tpl) => (
                        <TemplateCard
                          key={tpl.id}
                          tpl={tpl}
                          onPick={pick}
                          onReplace={() => setReplaceTarget(tpl)}
                          canReplace={canReplace}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <p className="flex items-center justify-center gap-1.5 pb-3 text-center text-[11px] text-muted-foreground">
                  <ArrowDownToLine size={12} />
                  {tt('dlg1.tpl.tip')}
                </p>
              </>
            )}
          </div>

          {/* এক-রঙের বই — স্টোরের ফুটার প্রমো */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-2.5">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Palette size={13} aria-hidden="true" />
              {tt('store.oneColorPromo')}
            </p>
            <OneColorDropdown align="end">
              <button
                type="button"
                className="rounded-md border border-border bg-background px-2.5 py-1 text-[11px] font-semibold text-foreground transition hover:border-primary/50 hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
              >
                <Palette size={12} className="mr-1 inline-block" aria-hidden="true" />
                {tt('dsn.ink.title')}
              </button>
            </OneColorDropdown>
          </div>
        </DialogContent>
      </Dialog>

      {/* ব্লুপ্রিন্ট প্রয়োগের নিশ্চিতকরণ (পুরো বই বদলাবে) */}
      <AlertDialog open={startBp !== null} onOpenChange={(v) => { if (!v) setStartBp(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt('store.bp.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt('store.bp.confirmDesc').split('{name}').join(startBp ? tx3(startBp.name, lang) : '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt('hdr.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (startBp) applyStart(startBp); }}>
              {tt('store.bp.confirmYes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* বর্তমান পাতার লেখা বদলানোর নিশ্চিতকরণ */}
      <AlertDialog open={replaceTarget !== null} onOpenChange={(v) => !v && setReplaceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt('dlg1.tpl.confirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt('dlg1.tpl.confirmDesc').split('{name}').join(replaceTarget ? tx3(replaceTarget.name, lang) : '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt('hdr.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>{tt('dlg1.tpl.confirmYes')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
