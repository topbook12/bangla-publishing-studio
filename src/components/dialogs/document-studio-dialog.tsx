/**
 * ডকুমেন্ট স্টুডিও — ৩ ধাপের উইজার্ড (Document Studio wizard)
 * ──────────────────────────────────────────────────────────────────
 *  ধাপ ১ নকশা: ১০ ক্যাটাগরিতে ৫৫টি বিশ্বমানের ডকুমেন্ট — রেজিউমে-ক্যারিয়ার,
 *    অফিস-পত্র, ইনভয়েস, চুক্তি, সনদ, শিক্ষা, আমন্ত্রণ, চিকিৎসা, প্রচার +
 *    বাংলাদেশ-ভারত আঞ্চলিক সংগ্রহ (সনদ, দলিল, দরখাস্ত)।
 *  ধাপ ২ তথ্য: টেমপ্লেট-ভিত্তিক ডাইনামিক ফরম + AI দিয়ে-পূরণ (সংক্ষিপ্ত
 *    বর্ণনা থেকে ঘরগুলো পূরণ) + সাজ-বিকল্প (কালি-প্যালেট)।
 *  ধাপ ৩ প্রিভিউ: প্রকৃত কাগজের মাপে (A4/Legal/Demy…) জীবন্ত প্রিভিউ — নতুন পাতায়
 *    বসানো বা বর্তমান পাতায় বদলে বসানো। মার্জিনও কাগজ-আনুপাতিক।
 *
 * প্রিভিউ একই HTML (buildDsHtml) দিয়ে StaticContent-এ রেন্ডার — তাই যা
 * প্রিভিউয়ে দেখা যায়, এডিটর/প্রিন্ট/এক্সপোর্টে হুবহু তা-ই আসে।
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award, Briefcase, Check, ChevronLeft, ChevronRight, FileText, FileUser,
  GraduationCap, Globe, Loader2, Megaphone, Package, PackageOpen, PackagePlus,
  PartyPopper, ReceiptText, Replace, Scale, Search, SearchX, Sparkles,
  Stethoscope, Trash2, Wand2, ZoomIn, ZoomOut, type LucideIcon,
} from 'lucide-react';
import { PHero, PPill, PSection, PTile, type PTone } from '@/components/premium';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import {
  buildDsHtml, dsDefaultValues, dsDemoValues, dsPreviewInline, DS_CATEGORY_LABELS, DS_CATEGORY_ORDER,
  DS_STYLES, DS_TEMPLATES, dsTemplateById,
  type DsCategory, type DsTemplate, type DsValues,
} from '@/lib/document-studio';
import { callAi } from '@/lib/ai-client';
import { extractJson } from '@/lib/ai-content';
import {
  downloadPackFile, fetchStarterPack, installPack, loadInstalledPacks,
  makePackFromCurrent, readPackFile, STARTER_PACKS, uninstallPack,
  type InstalledPack, type PackEntry,
} from '@/lib/template-pack';
import { ensurePageEditorMounted, fitTemplatePage } from '@/components/editor/page-ops';
import { dsMarginsForPaper, effectivePageSize } from '@/lib/page-layout';
import { getPageDimensionsMm, getPaperPreset, mmToPx } from '@/lib/paper';
import { useLangStore, useT, useFmtNum } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/** প্রিভিউ-শীটের প্যাডিং px মার্জিনে রূপান্তর (96dpi — .ds-sheet-এর একক) */
const inToPx = (inch: number): number => Math.round(inch * 96 * 100) / 100;

type Step = 1 | 2 | 3;

const STEPS: Array<{ id: Step; key: string }> = [
  { id: 1, key: 'ds.step.pick' },
  { id: 2, key: 'ds.step.fill' },
  { id: 3, key: 'ds.step.preview' },
];

/** জনপ্রিয় নকশা — গ্যালারির শীর্ষে ফিচার্ড-স্ট্রিপ (ওয়ার্ড/ক্যানভা-প্রথা) */
const POPULAR_IDS = ['resume-modern', 'invoice', 'official-letter', 'award', 'letterhead', 'calendar-month', 'invitation', 'press-release'] as const;
const POPULAR_SET = new Set<string>(POPULAR_IDS);

/** ক্যাটাগরি → lucide আইকন + Aurora হিউ (গ্রিড-টাইল ও চিপ-বিন্দু) */
const CAT_META: Record<DsCategory, { icon: LucideIcon; tone: PTone; dot: string }> = {
  career:   { icon: FileUser,      tone: 'rose',    dot: 'bg-rose-500' },
  office:   { icon: Briefcase,     tone: 'sky',     dot: 'bg-sky-500' },
  finance:  { icon: ReceiptText,   tone: 'emerald', dot: 'bg-emerald-500' },
  legal:    { icon: Scale,         tone: 'slate',   dot: 'bg-slate-500' },
  cert:     { icon: Award,         tone: 'amber',   dot: 'bg-amber-500' },
  edu:      { icon: GraduationCap, tone: 'teal',    dot: 'bg-teal-500' },
  event:    { icon: PartyPopper,   tone: 'rose',    dot: 'bg-rose-500' },
  med:      { icon: Stethoscope,   tone: 'cyan',    dot: 'bg-cyan-500' },
  promo:    { icon: Megaphone,     tone: 'orange',  dot: 'bg-orange-500' },
  regional: { icon: Globe,         tone: 'lime',    dot: 'bg-lime-600' },
};

/** তথ্য-ফরমের এক ঘর */
function FieldControl({ field, values, onChange, disabled }: {
  field: DsTemplate['fields'][number];
  values: DsValues;
  onChange: (id: string, v: string) => void;
  disabled: boolean;
}) {
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const label = field.label[lang] || field.label.en || field.label.bn;
  const ph = field.ph ? (field.ph[lang] || field.ph.en || field.ph.bn) : undefined;
  const common = 'w-full';
  return (
    <label className={cn('qp-field', field.wide && 'qp-field-full', field.kind === 'textarea' && 'qp-field-full')}>
      <span>{label}</span>
      {field.kind === 'textarea' ? (
        <Textarea
          className={common}
          rows={field.rows ?? 3}
          value={values[field.id] ?? ''}
          placeholder={ph ?? tt('ds.fill.hintText')}
          onChange={(e) => onChange(field.id, e.target.value)}
          disabled={disabled}
        />
      ) : field.kind === 'table' ? (
        <Textarea
          className={cn(common, 'font-mono text-[12.5px]')}
          rows={field.rows ?? 5}
          value={values[field.id] ?? ''}
          placeholder={ph ?? tt('ds.fill.hintTable')}
          onChange={(e) => onChange(field.id, e.target.value)}
          disabled={disabled}
        />
      ) : field.kind === 'date' ? (
        <Input className={common} value={values[field.id] ?? ''} onChange={(e) => onChange(field.id, e.target.value)} disabled={disabled} />
      ) : (
        <Input className={common} value={values[field.id] ?? ''} placeholder={ph} onChange={(e) => onChange(field.id, e.target.value)} disabled={disabled} />
      )}
      {field.kind === 'table' ? (
        <span className="qp-hint text-[10px] mt-0.5 block opacity-70">
          {(field.cols ?? []).map((c) => (c[lang] || c.en || c.bn)).join(' | ')}
        </span>
      ) : null}
    </label>
  );
}

/** নকশা-কার্ডের মিনি-থাম্ব — আসল HTML-এর স্কেল-ডাউন ক্রপ (নমুনা-মানে ভরা) */
function DesignThumb({ html }: { html: string }) {
  const inner = useMemo(() => dsPreviewInline(html), [html]);
  return (
    <div className="relative h-32 overflow-hidden rounded-md border border-border bg-white" aria-hidden="true">
      <div
        className="ds-sheet pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{ width: 560, transform: 'scale(0.42)', padding: '10px 20px 0', minHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

/** সাজ-প্যালেটের রঙ-বিন্দু (কার্ড-ফুটার) */
function StyleDots({ tpl }: { tpl: DsTemplate }) {
  const dots = DS_STYLES.filter((s) => tpl.styles.includes(s.id)).slice(0, 5);
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {dots.map((s) => (
        <span key={s.id} className="h-2 w-2 rounded-full border border-black/10" style={{ background: s.P.border }} />
      ))}
    </span>
  );
}

export function DocumentStudioDialog() {
  const open = useUiStore((s) => s.openDialog === 'documentStudio');
  const close = useUiStore((s) => s.close);
  const lang = useLangStore((s) => s.lang);
  const tt = useT();
  const nf = useFmtNum();
  const settings = useEditorStore((s) => s.settings);

  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<DsCategory | 'all'>('all');
  const [tplId, setTplId] = useState<string | null>(null);
  const [values, setValues] = useState<DsValues>({});
  const [styleId, setStyleId] = useState<string>('classic');
  const [aiBrief, setAiBrief] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [packs, setPacks] = useState<InstalledPack[]>([]);
  const packFileRef = useRef<HTMLInputElement | null>(null);

  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(0.62);

  const tpl = tplId ? dsTemplateById(tplId) ?? null : null;

  // ── প্রকৃত-কাগজ প্রিভিউ: নতুন পাতা যে মাপ পায় (গ্লোবাল সেটিংস) সেই মাপেই শীট —
  //    px-মাপ @96dpi + কাগজ-আনুপাতিক DS মার্জিন (dsMarginsForPaper) — ফলে যা
  //    প্রিভিউয়ে দেখা যায়, বসানো পাতায় হুবহু তা-ই (WYSIWYG)।
  const sheet = useMemo(() => {
    const { widthMm, heightMm } = getPageDimensionsMm(settings.paperSize, settings.orientation, settings.customPaper);
    return {
      widthMm, heightMm,
      w: mmToPx(widthMm),
      h: mmToPx(heightMm),
      margins: dsMarginsForPaper(settings.paperSize, settings.orientation, settings.customPaper),
      label: getPaperPreset(settings.paperSize).name,
    };
  }, [settings.paperSize, settings.orientation, settings.customPaper]);

  // প্রিভিউ কনটেইনারের প্রস্থ → ফিট-স্কেল
  useEffect(() => {
    if (step !== 3 || !previewWrapRef.current) return;
    const el = previewWrapRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 24;
      setFitScale(Math.max(0.28, Math.min(1, w / sheet.w)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [step, sheet.w]);

  const setValue = useCallback((id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  const pickTemplate = (t: DsTemplate) => {
    setTplId(t.id);
    setStyleId(t.defaultStyle);
    const init = dsDefaultValues(t, lang);
    setValues(init);
    setAiBrief('');
    setStep(2);
  };

  // ── কমিউনিটি প্যাক — ডায়ালগ খুললেই তালিকা রিফ্রেশ (local-first: localStorage) ──
  useEffect(() => {
    if (open) setPacks(loadInstalledPacks());
  }, [open]);

  /** প্যাক-এন্ট্রি → ধাপ-২ (মান-পূর্ণ ফরম) — তারিখ-ঘর আজকের রেখে প্যাক-মান বসে */
  const applyPackEntry = (entry: PackEntry) => {
    const t = dsTemplateById(entry.tplId);
    if (!t) return;
    setTplId(t.id);
    setStyleId(entry.styleId && t.styles.includes(entry.styleId) ? entry.styleId : t.defaultStyle);
    setValues({ ...dsDefaultValues(t, lang), ...entry.values });
    setAiBrief('');
    setStep(2);
  };

  const importPackFile = async (file: File) => {
    try {
      const pack = await readPackFile(file);
      installPack(pack);
      setPacks(loadInstalledPacks());
      toast.success(tt('ds.toast.packInstalled'));
    } catch {
      toast.error(tt('ds.err.packRead'));
    }
  };

  const installStarter = async (file: string) => {
    try {
      const pack = await fetchStarterPack(file);
      installPack(pack);
      setPacks(loadInstalledPacks());
      toast.success(tt('ds.toast.packInstalled'));
    } catch {
      toast.error(tt('ds.err.packRead'));
    }
  };

  const removePack = (packId: string) => {
    uninstallPack(packId);
    setPacks(loadInstalledPacks());
    toast.success(tt('ds.toast.packRemoved'));
  };

  /** ধাপ-৩: বর্তমান নকশা+তথ্য+সাজ → .bpspack.json ডাউনলোড */
  const exportCurrentPack = () => {
    if (!tpl) return;
    try {
      const pack = makePackFromCurrent(tpl.id, values, styleId, tpl.name[lang] || tpl.name.en);
      if (!pack) throw new Error('invalid');
      downloadPackFile(pack);
      toast.success(tt('ds.toast.packExported'));
    } catch {
      toast.error(tt('ds.err.apply'));
    }
  };

  const filtered = useMemo(() => {
    // NFC-স্বাভাবিকীকরণ — বাংলা/হিন্দি কিবোর্ডের ভাঙা-জোড়া অক্ষরও মেলে
    const norm = (s: string) => s.normalize('NFC').toLowerCase();
    const q = norm(query.trim());
    return DS_TEMPLATES.filter((t) => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (!q) return true;
      return (
        norm(t.name.bn).includes(q)
        || norm(t.name.en).includes(q)
        || norm(t.name.hi).includes(q)
        || norm(t.desc.bn).includes(q)
        || norm(t.desc.en).includes(q)
      );
    });
  }, [query, cat]);

  const previewHtml = useMemo(
    () => (tpl ? buildDsHtml(tpl, values, lang, styleId) : ''),
    [tpl, values, lang, styleId],
  );

  /** থাম্বনেইল-HTML ক্যাশ — নমুনা-মানে ভরা প্রিভিউ (ভাষা বদলালে নতুন করে) */
  const thumbCache = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of DS_TEMPLATES) {
      map.set(t.id, buildDsHtml(t, dsDemoValues(t, lang), lang, t.defaultStyle));
    }
    return map;
  }, [lang]);

  const popular = useMemo(
    () => POPULAR_IDS.map((id) => dsTemplateById(id)).filter((t): t is DsTemplate => Boolean(t)),
    [],
  );

  /** নকশা-কার্ড — ভরা-থাম্বনেইল + জনপ্রিয়-ব্যাজ + সাজ-বিন্দু (ক্যানভা-প্রথা) */
  const renderCard = (t: DsTemplate) => (
    <button
      key={t.id} type="button"
      className={cn(
        'group relative flex h-full flex-col gap-1.5 rounded-lg border border-border bg-card p-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring',
        tplId === t.id && 'border-primary ring-1 ring-ring',
      )}
      onClick={() => pickTemplate(t)}
      aria-label={t.name[lang] || t.name.en}
    >
      {POPULAR_SET.has(t.id) ? (
        <PPill tone="hot" className="absolute -top-1.5 right-1.5 z-10">{tt('ds.pick.badgePopular')}</PPill>
      ) : null}
      <DesignThumb html={thumbCache.get(t.id) ?? ''} />
      <span className="text-[12.5px] font-semibold leading-snug">{t.name[lang] || t.name.en}</span>
      <span className="line-clamp-2 text-[10.5px] leading-snug text-muted-foreground">{t.desc[lang] || t.desc.en}</span>
      <span className="flex items-center justify-between pt-0.5">
        <StyleDots tpl={t} />
        <span className="text-[9px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-80" aria-hidden="true">{tt('ds.pick.next')}</span>
      </span>
    </button>
  );

  const effScale = fitScale * zoom;
  const byCat = useMemo(() => {
    const map = new Map<DsCategory, DsTemplate[]>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [filtered]);

  // ── AI ফিল — সংক্ষিপ্ত বর্ণনা থেকে ফরম-ঘর পূরণ ──
  const aiFill = async () => {
    if (!tpl || !aiBrief.trim() || aiBusy) return;
    setAiBusy(true);
    const fieldSpec = tpl.fields
      .map((f) => `- "${f.id}" (${f.kind === 'date' ? 'date in Bangla long format' : f.kind === 'table' ? 'multi-line rows, cells separated by |' : f.kind === 'textarea' ? 'paragraph text' : 'short text'}): ${f.label.bn}${f.kind === 'table' && f.cols ? ` [columns: ${f.cols.map((c) => c.bn).join(' | ')}]` : ''}`)
      .join('\n');
    const res = await callAi({
      prompt: [
        `DOCUMENT TEMPLATE: ${tpl.name.bn} (${tpl.name.en}) — ${tpl.desc.bn}`,
        '',
        'FIELDS TO FILL:',
        fieldSpec,
        '',
        'USER BRIEF (what the user needs — extract names, addresses, dates, amounts and every detail):',
        aiBrief.trim(),
        '',
        'Fill every field you can from the brief. For fields not mentioned, write a realistic, useful value fitting the document in the template\u2019s language (sample-style), EXCEPT amounts/ID numbers/reference numbers — leave those as "" if unknown. Keep table values as "cell | cell" rows, one row per line.',
        'Return ONLY JSON: {"values": {"fieldId": "value"}}',
      ].join('\n'),
      system: 'You are the document-fill assistant of Bangla Publishing Studio — expert in worldwide professional documents (resumes, cover letters, business letters, invoices, quotations, purchase orders, contracts, agreements, NDAs, certificates, meeting minutes, project proposals, calendars, lesson plans, brochures, newsletters, business cards) and in Bangladeshi/Indian regional documents (সনদ, দরখাস্ত, দলিল, রসিদ). You fill forms precisely in correct formal language matching each document\'s conventions (Bangla for Bangla templates, English for global templates). Return ONLY valid JSON — no markdown fences, no commentary.',
    });
    setAiBusy(false);
    if (!(res.ok && res.text)) {
      toast.error(tt('ds.err.aiFail'));
      return;
    }
    const parsed = extractJson(res.text) as { values?: Record<string, unknown> } | null;
    const incoming = parsed && typeof parsed.values === 'object' && parsed.values ? parsed.values : null;
    if (!incoming) {
      toast.error(tt('ds.err.aiFail'));
      return;
    }
    setValues((prev) => {
      const next = { ...prev };
      for (const f of tpl.fields) {
        const val = incoming[f.id];
        if (typeof val === 'string' && val.trim()) next[f.id] = val;
      }
      // তারিখ AI-এর হাতে না থাকলে আজকেরই থাকে
      for (const f of tpl.fields) {
        if (f.kind === 'date' && !String(next[f.id] ?? '').trim()) next[f.id] = dsDefaultValues(tpl, lang)[f.id] ?? '';
      }
      return next;
    });
    toast.success(tt('ds.toast.aiFilled'));
  };

  // ── পাতায় বসানো ──
  const mountFitReveal = async (pageId: string) => {
    await new Promise((r) => window.setTimeout(r, 220));
    for (let attempt = 0; attempt < 3; attempt++) {
      const idx = useEditorStore.getState().pages.findIndex((p) => p.id === pageId);
      if (idx < 0) return;
      document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
      if (await ensurePageEditorMounted(pageId)) break;
    }
    fitTemplatePage(pageId);
    const idx = useEditorStore.getState().pages.findIndex((p) => p.id === pageId);
    if (idx >= 0) {
      document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
    }
  };

  const insertNewPage = () => {
    if (!tpl) return;
    try {
      const s = useEditorStore.getState();
      const after = s.activePageId ?? s.pages[s.pages.length - 1]?.id ?? null;
      const id = s.addPage(after, previewHtml);
      // প্রিভিউ-শীটের মার্জিনই এই পাতায়ও বসে — উভয়ই dsMarginsForPaper(কাগজ-মাপ)
      // থেকে (কাগজ-আনুপাতিক), তাই যা প্রিভিউে দেখা যায় হুবহু তাই-ই পাতায় ঢোকে
      // (WYSIWYG) — ছোট বই-কাগজে (Demy/Crown) মার্জিনও ছোট, Legal-এ আনুপাতিক বড়।
      // flowLock — অটো-ফ্লো নকশা ভাঙবে না; প্রথম সম্পাদনাতেই লক খুলে যায়।
      s.updatePage(id, {
        noChrome: true,
        flowLock: true,
        marginsOverride: { ...sheet.margins, gutter: s.settings.margins.gutter },
      });
      toast.success(tt('ds.toast.inserted'));
      close();
      void mountFitReveal(id);
    } catch {
      toast.error(tt('ds.err.apply'));
    }
  };

  const replaceCurrentPage = () => {
    if (!tpl) return;
    try {
      const s = useEditorStore.getState();
      const target = s.activePageId ?? s.pages[0]?.id;
      if (!target) {
        insertNewPage();
        return;
      }
      s.replacePageHtml(target, previewHtml);
      // ঢোকানোর মতোই — কিন্তু লক্ষ্য-পাতার কার্যকর কাগজ-মাপ থেকে (পাতার নিজস্ব
      // paperSizeOverride থাকলে সেটাই — দিন ২-এর মিক্সড-মাপ স্ট্যাক) আনুপাতিক মার্জিন,
      // যাতে যে কাগজে বসছে সেই কাগজেই প্রিভিউের মতো দেখায় (WYSIWYG) + নকশা-লক
      const targetPage = s.pages.find((p) => p.id === target) ?? null;
      const targetMargins = dsMarginsForPaper(
        effectivePageSize(targetPage, s.settings), s.settings.orientation, s.settings.customPaper,
      );
      s.updatePage(target, {
        noChrome: true,
        flowLock: true,
        marginsOverride: { ...targetMargins, gutter: s.settings.margins.gutter },
      });
      toast.success(tt('ds.toast.replaced'));
      setConfirmReplace(false);
      close();
      void mountFitReveal(target);
    } catch {
      toast.error(tt('ds.err.apply'));
    }
  };

  const resetDates = () => {
    if (!tpl) return;
    setValues((prev) => ({ ...prev, ...dsDefaultValues(tpl, lang) }));
    toast.info(tt('ds.toast.datesReset'));
  };

  /** নমুনা-মানে ফরম পূরণ — ব্যবহারকারী সম্পাদনা করে নিজের তথ্য বসাবে */
  const loadSample = () => {
    if (!tpl) return;
    setValues(dsDemoValues(tpl, lang));
    toast.success(tt('ds.toast.sampleLoaded'));
  };

  const styleOpts = tpl ? DS_STYLES.filter((s) => tpl.styles.includes(s.id)) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="qp-dialog max-h-[94dvh] overflow-y-auto sm:max-w-3xl">
        {/* অ্যাক্সেসিবল শিরোনাম — স্ক্রিন-রিডারের জন্য, দৃশ্যমান হিরো নিচে */}
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('ds.title')}</DialogTitle>
          <DialogDescription>{tt('ds.desc')}</DialogDescription>
        </DialogHeader>
        <PHero tone="emerald" icon={FileText} title={tt('ds.title')} desc={tt('ds.desc')} />

        {/* ধাপ-নির্দেশক */}
        <div className="qp-steps" role="list" aria-label={tt('ds.title')}>
          {STEPS.map((s, i) => (
            <button
              key={s.id} type="button" role="listitem"
              className={cn('qp-step', step === s.id && 'qp-step-on', step > s.id && 'qp-step-done')}
              onClick={() => {
                if (s.id === 1) setStep(1);
                else if (s.id === 2 && tpl) setStep(2);
                else if (s.id === 3 && tpl) setStep(3);
              }}
              aria-current={step === s.id ? 'step' : undefined}
            >
              <span className="qp-step-dot">{step > s.id ? <Check size={11} aria-hidden="true" /> : nf(s.id)}</span>
              <span className="qp-step-label">{tt(s.key)}</span>
              {i < STEPS.length - 1 ? <span className="qp-step-line" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>

        {/* ── ধাপ ১: নকশা বাছাই ── */}
        {step === 1 ? (
          <section aria-label={tt('ds.step.pick')} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px] flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tt('ds.pick.search')} className="pl-8" aria-label={tt('ds.pick.search')} />
              </div>
              <div className="qp-scale flex-wrap" role="group" aria-label={tt('ds.pick.all')}>
                <button
                  type="button" aria-pressed={cat === 'all'}
                  className={cn('qp-scale-btn inline-flex items-center gap-1.5', cat === 'all' && 'qp-scale-on')}
                  onClick={() => setCat('all')}
                >
                  <span className="h-2 w-2 rounded-full bg-emerald-600" aria-hidden="true" />
                  {tt('ds.pick.all')} ({nf(DS_TEMPLATES.length)})
                </button>
                {DS_CATEGORY_ORDER.map((c) => (
                  <button
                    key={c} type="button" aria-pressed={cat === c}
                    className={cn('qp-scale-btn inline-flex items-center gap-1.5', cat === c && 'qp-scale-on')}
                    onClick={() => setCat(c)}
                  >
                    <span className={cn('h-2 w-2 rounded-full', CAT_META[c].dot)} aria-hidden="true" />
                    {DS_CATEGORY_LABELS[c][lang] || DS_CATEGORY_LABELS[c].en}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[54dvh] overflow-y-auto pr-1">
              {/* ফিচার্ড-স্ট্রিপ — জনপ্রিয় নকশা (ওয়ার্ড/ক্যানভা-প্রথা) */}
              {cat === 'all' && !query.trim() ? (
                <div className="mb-4">
                  <PSection tone="amber" icon={Sparkles} title={tt('ds.pick.popular')} className="mb-1.5" />
                  <div className="flex gap-2 overflow-x-auto pb-1.5">
                    {popular.map((t) => (
                      <div key={t.id} className="w-40 shrink-0">{renderCard(t)}</div>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* কমিউনিটি প্যাক — ভাগাভাগি-করা নমুনা-সেট (local-first: ফাইল ইমপোর্ট/এক্সপোর্ট) */}
              {cat === 'all' && !query.trim() ? (
                <div className="mb-4">
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1.5">
                    <PSection tone="emerald" icon={Package} title={tt('ds.pack.title')} className="mb-0" />
                    <Button variant="outline" size="sm" className="h-7" onClick={() => packFileRef.current?.click()} title={tt('ds.pack.importTip')} aria-label={tt('ds.pack.import')}>
                      <PackageOpen size={13} aria-hidden="true" /> {tt('ds.pack.import')}
                    </Button>
                  </div>

                  {packs.length ? (
                    <div className="flex flex-col gap-1.5">
                      {packs.map((p) => (
                        <div key={p.packId} className="rounded-lg border border-border bg-card p-2.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <PTile size="sm" tone="emerald" icon={Package} />
                            <span className="text-[12.5px] font-semibold">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {tt('ds.pack.entries').replace('{n}', nf(p.entries.length))}{p.author ? ` · ${p.author}` : ''}
                            </span>
                            <span className="ms-auto">
                              <Button variant="ghost" size="sm" className="h-7 px-2 text-muted-foreground hover:text-destructive" onClick={() => removePack(p.packId)} aria-label={tt('ds.pack.remove')} title={tt('ds.pack.remove')}>
                                <Trash2 size={13} aria-hidden="true" />
                              </Button>
                            </span>
                          </div>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {p.entries.map((e) => {
                              const t = dsTemplateById(e.tplId);
                              if (!t) return null;
                              return (
                                <button
                                  key={e.tplId} type="button"
                                  className="rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium transition-colors hover:border-primary hover:text-primary focus-visible:outline-2 focus-visible:outline-ring"
                                  onClick={() => applyPackEntry(e)}
                                  title={tt('ds.pick.next')}
                                >
                                  {t.name[lang] || t.name.en}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {STARTER_PACKS.filter((sp) => !packs.some((p) => p.name === sp.name)).length ? (
                    <div className="mt-1.5 rounded-lg border border-dashed border-border p-2.5">
                      <p className="ai-field-label mb-1.5">{tt('ds.pack.starter')}</p>
                      <div className="flex flex-col gap-1.5">
                        {STARTER_PACKS.filter((sp) => !packs.some((p) => p.name === sp.name)).map((sp) => (
                          <div key={sp.file} className="flex flex-wrap items-center gap-2">
                            <PTile size="sm" tone="lime" icon={PackagePlus} />
                            <span className="text-[12.5px] font-semibold">{sp.name}</span>
                            <span className="ms-auto">
                              <Button variant="outline" size="sm" className="h-7" onClick={() => void installStarter(sp.file)}>
                                <PackagePlus size={13} aria-hidden="true" /> {tt('ds.pack.install')}
                              </Button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-1.5 text-[10.5px] leading-snug text-muted-foreground">{tt('ds.pack.desc')}</p>
                </div>
              ) : null}

              {[...byCat.entries()].map(([category, tpls]) => (
                <div key={category} className="mb-4">
                  <p className="ai-field-label mb-1.5 flex items-center gap-1.5">
                    <PTile size="sm" tone={CAT_META[category].tone} icon={CAT_META[category].icon} />
                    {DS_CATEGORY_LABELS[category][lang] || DS_CATEGORY_LABELS[category].en}
                    <span className="text-[10px] font-normal opacity-60">{tt('ds.pick.count').replace('{n}', nf(tpls.length))}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {tpls.map((t) => renderCard(t))}
                  </div>
                </div>
              ))}
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <SearchX size={26} className="text-muted-foreground/60" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">{tt('ds.pick.empty')}</p>
                  <Button variant="outline" size="sm" onClick={() => { setQuery(''); setCat('all'); }}>
                    {tt('ds.pick.showAll')}
                  </Button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── ধাপ ২: তথ্য দিন ── */}
        {step === 2 && tpl ? (
          <section aria-label={tt('ds.step.fill')} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <PTile size="sm" tone="emerald" icon={FileText} />
                <p className="text-sm font-semibold">{tpl.name[lang] || tpl.name.en}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="ai-field-label" title={tt('ds.fill.styleTip')}>{tt('ds.fill.style')}:</span>
                <div className="qp-scale" role="group" aria-label={tt('ds.fill.style')}>
                  {styleOpts.map((s) => (
                    <button
                      key={s.id} type="button" aria-pressed={styleId === s.id}
                      className={cn('qp-scale-btn', styleId === s.id && 'qp-scale-on')}
                      onClick={() => setStyleId(s.id)}
                    >
                      <span className="inline-block h-2 w-2 rounded-full border border-black/10" style={{ background: s.P.border }} aria-hidden="true" />
                      {s.name[lang] || s.name.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI দিয়ে পূরণ */}
            <div className="rounded-lg border border-border bg-muted/30 p-2.5">
              <PSection tone="teal" icon={Wand2} title={tt('ds.fill.ai.tip')} className="mb-1.5" />
              <div className="flex flex-col gap-1.5 sm:flex-row">
                <Input
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  placeholder={tt('ds.fill.ai.ph')}
                  aria-label={tt('ds.fill.ai.tip')}
                  className="flex-1"
                  disabled={aiBusy}
                  onKeyDown={(e) => { if (e.key === 'Enter') void aiFill(); }}
                />
                <Button size="sm" onClick={() => void aiFill()} disabled={aiBusy || !aiBrief.trim()} className="shrink-0">
                  {aiBusy
                    ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> …</>
                    : <><Sparkles size={13} aria-hidden="true" /> {tt('ds.fill.ai.go')}</>}
                </Button>
              </div>
            </div>

            <div className="qp-form max-h-[46dvh] overflow-y-auto pr-1">
              {tpl.fields.map((f) => (
                <FieldControl key={f.id} field={f} values={values} onChange={setValue} disabled={aiBusy} />
              ))}
            </div>

            <div className="qp-nav-row">
              <Button variant="outline" onClick={() => setStep(1)} disabled={aiBusy}>
                <ChevronLeft size={14} aria-hidden="true" /> {tt('ds.fill.back')}
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={resetDates} disabled={aiBusy} title={tt('ds.fill.reset')}>
                  <Sparkles size={13} aria-hidden="true" /> {tt('ds.fill.reset')}
                </Button>
                <Button variant="ghost" onClick={loadSample} disabled={aiBusy} title={tt('ds.fill.sampleTip')}>
                  <Wand2 size={13} aria-hidden="true" /> {tt('ds.fill.loadSample')}
                </Button>
                <Button onClick={() => setStep(3)} disabled={aiBusy}>
                  {tt('ds.fill.preview')} <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── ধাপ ৩: প্রিভিউ ও বসানো ── */}
        {step === 3 && tpl ? (
          <section aria-label={tt('ds.step.preview')} className="flex flex-col gap-2">
            <div className="qp-stats" role="status">
              <span className="qp-stat"><strong>{tpl.name[lang] || tpl.name.en}</strong></span>
              <span className="qp-stat qp-stat-page">{tt('ds.prev.paper')}: {sheet.label} · {nf(Math.round(sheet.widthMm))}×{nf(Math.round(sheet.heightMm))}mm</span>
              <span className="qp-stat-zoom">
                <button type="button" aria-label="-" onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}><ZoomOut size={13} aria-hidden="true" /></button>
                <span>{nf(Math.round(effScale * 100))}%</span>
                <button type="button" aria-label="+" onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}><ZoomIn size={13} aria-hidden="true" /></button>
              </span>
            </div>

            <div ref={previewWrapRef} className="qp-preview">
              <div
                className="qp-preview-spacer"
                style={{ width: sheet.w * effScale, height: sheet.h * effScale, maxWidth: '100%' }}
              >
                <div
                  className="ds-sheet ds-sheet-live"
                  style={{
                    transform: `scale(${effScale})`,
                    transformOrigin: 'top left',
                    width: sheet.w,
                    minHeight: sheet.h,
                    // প্যাডিং = বসানো পাতার মার্জিন (dsMarginsForPaper) — প্রিভিউ = পাতা
                    padding: `${inToPx(sheet.margins.top)}px ${inToPx(sheet.margins.right)}px ${inToPx(sheet.margins.bottom)}px ${inToPx(sheet.margins.left)}px`,
                  }}
                  dangerouslySetInnerHTML={{ __html: dsPreviewInline(previewHtml) }}
                />
              </div>
            </div>

            <div className="qp-nav-row">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft size={14} aria-hidden="true" /> {tt('ds.prev.back')}
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={exportCurrentPack} title={tt('ds.pack.exportTip')} aria-label={tt('ds.pack.export')}>
                  <PackageOpen size={14} aria-hidden="true" /> {tt('ds.pack.export')}
                </Button>
                <Button variant="outline" onClick={() => setConfirmReplace(true)} title={tt('ds.prev.replaceTip')}>
                  <Replace size={14} aria-hidden="true" /> {tt('ds.prev.insertHere')}
                </Button>
                <Button onClick={insertNewPage} title={tt('ds.prev.insertTip')}>
                  <Check size={14} aria-hidden="true" /> {tt('ds.prev.insertNew')}
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* প্যাক-ফাইল ইমপোর্ট — লুকানো ফাইল-ইনপুট */}
        <input
          ref={packFileRef} type="file" accept=".json,.bpspack,application/json" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void importPackFile(f); e.target.value = ''; }}
          aria-hidden="true" tabIndex={-1}
        />

        {/* বর্তমান পাতা-বদলের নিশ্চয়তা */}
        <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tt('ds.confirm.replaceTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{tt('ds.confirm.replaceBody')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmReplace(false)}>{tt('ds.confirm.replaceCancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={replaceCurrentPage}>{tt('ds.confirm.replaceGo')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* AI ওভারলে */}
        {aiBusy ? (
          <div className="qp-progress" role="status" aria-live="polite">
            <div className="qp-progress-card">
              <Loader2 size={22} className="qp-progress-spin" aria-hidden="true" />
              <p className="qp-progress-title">{tt('ds.fill.ai.tip')}</p>
              <p className="qp-progress-wait">{tt('ds.fill.ai.ph')}</p>
              <span className="ai-progress" aria-hidden="true"><span /></span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
