/**
 * Layout tab — paper size, margins, paper color, page border, multi-column layout,
 * default typography, content flow (ফাঁকা জায়গা পূরণ / স্মার্ট ফ্লো / ফাঁকা পাতা পরিষ্কার)
 */

'use client';

import { Fragment, useState } from 'react';
import {
  ArrowUpToLine, Ban, Check, Columns2, Columns3, Droplet, Eraser, MoveDown, SlidersHorizontal, SwatchBook, Wand2,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  RibbonButton, RibbonDivider, RibbonGroup, refocusActiveEditor, runCommand, useActiveEditor,
} from './ribbon-shell';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import {
  availableHeightOfEditor, fillFromNextPage, removeEmptyPages, smartFlowWholeBook,
} from '@/components/editor/page-ops';
import { toast } from 'sonner';
import {
  effectivePageBorderStyle, effectivePageBorderWidth, FONT_OPTIONS, fontStackOf, MARGIN_PRESETS,
  PAGE_BORDER_WIDTH_PX, PAPER_PRESETS,
} from '@/lib/paper';
import {
  COLUMNS_GAP_PRESETS,
  COLUMNS_RULE_WIDTH,
  type ColumnsAttrs,
  type ColumnsFill,
  type ColumnsRuleStyle,
} from '@/lib/nodes-html';
import { tFmt, useFmtNum, useLangStore, useT } from '@/lib/i18n';
import type { DocumentSettings, Margins, PageBorderStyle, PageBorderWidth, PaperColor, WatermarkSettings } from '@/lib/types';
import { cn } from '@/lib/utils';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center gap-1.5 text-xs">
      <span className="whitespace-nowrap text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberInput({ value, onChange, step = 0.1, min = 0, max = 4 }: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      className="ribbon-number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
      }}
    />
  );
}

// k = অভিধান-কী, name = ইংরেজি ফলব্যাক
const PAPER_COLORS: Array<{ id: PaperColor; k: string; name: string; bg: string }> = [
  { id: 'white', k: 'lay.color.white', name: 'White', bg: '#ffffff' },
  { id: 'cream', k: 'lay.color.cream', name: 'Cream (Book Paper)', bg: '#f7edd8' },
  { id: 'dark', k: 'lay.color.dark', name: 'Dark Mode', bg: '#1e293b' },
];

/** বর্ডার লাইনের প্রিসেট রং — প্রথমটি (Black) ডিফল্ট লুক */
const BORDER_LINE_COLORS: Array<{ hex: string; k: string; name: string }> = [
  { hex: '#1e293b', k: 'lay.lcolor.black', name: 'Black' },
  { hex: '#64748b', k: 'lay.lcolor.slate', name: 'Slate' },
  { hex: '#9f1239', k: 'lay.lcolor.maroon', name: 'Maroon' },
  { hex: '#4f46e5', k: 'lay.lcolor.indigo', name: 'Indigo' },
  { hex: '#059669', k: 'lay.lcolor.emerald', name: 'Emerald' },
  { hex: '#d97706', k: 'lay.lcolor.amber', name: 'Amber' },
  { hex: '#e11d48', k: 'lay.lcolor.rose', name: 'Rose' },
  { hex: '#ca8a04', k: 'lay.lcolor.gold', name: 'Gold' },
];

// মান = অভিধান-কী (dict-layout)
const BORDER_STYLE_LABELS: Record<PageBorderStyle, string> = { solid: 'lay.bstyle.solid', double: 'lay.bstyle.double', dashed: 'lay.bstyle.dashed' };
const BORDER_WIDTH_LABELS: Record<PageBorderWidth, string> = { thin: 'lay.bwidth.thin', medium: 'lay.bwidth.medium', thick: 'lay.bwidth.thick' };

// ─── পানির ছাপ (Watermark) ───

/** এক-ক্লিক প্রিসেট — লেখা + চালু করে দেয় (বাকি স্টাইল অপরিবর্তিত)। lk/nk = অভিধান-কী, label/note = ফলব্যাক */
const WATERMARK_PRESETS: Array<{ text: string; lk: string; label: string; nk: string; note: string }> = [
  { text: 'খসড়া', lk: 'lay.wm.p1.label', label: 'খসড়া (Draft)', nk: 'lay.wm.p1.note', note: 'লেখা চলাকালীন প্রিন্ট-প্রুফ শনাক্ত করতে' },
  { text: 'নমুনা', lk: 'lay.wm.p2.label', label: 'নমুনা (Sample)', nk: 'lay.wm.p2.note', note: 'রিভিউ/প্রুফ কপির জন্য' },
  { text: 'গোপনীয়', lk: 'lay.wm.p3.label', label: 'গোপনীয় (Confidential)', nk: 'lay.wm.p3.note', note: 'সংবেদনশীল ডকুমেন্টে' },
  { text: 'COPY', lk: 'lay.wm.p4.label', label: 'COPY', nk: 'lay.wm.p4.note', note: 'অননুমোদিত কপি চিহ্নিত করতে' },
];

/** ছাপের রং — ধূসর/নীল/লাল প্রিসেট + কাস্টম পিকার */
const WATERMARK_COLORS: string[] = ['#64748b', '#94a3b8', '#334155', '#1d4ed8', '#0284c7', '#dc2626', '#991b1b', '#e11d48'];

/** ডিফল্ট ছাপ — পুরনো ডকুমেন্টে (Dexie-তে সেভ হওয়া) watermark ফিল্ড অনুপস্থিত হলে ফলব্যাক */
const WATERMARK_DEFAULTS: WatermarkSettings = {
  enabled: false, text: 'খসড়া', opacity: 0.12, angle: -30, fontSize: 64, color: '#64748b',
};

// ─── মাল্টি-কলাম: প্রিমিয়াম পপওভারের মিনি-প্রিভিউ ও প্রিসেট ───

/** এক-ঝলকে কলাম-স্টাইল বোঝাতে ছোট পাতার প্রিভিউ — n কলাম, ফাঁক, রেখা, জুড়ে-বসা প্রথম ব্লক */
function ColMini({ n, gap = 6, rule = false, ruleStyle = 'solid', spanFirst = false, bars = 3 }: {
  n: number; gap?: number; rule?: boolean; ruleStyle?: ColumnsRuleStyle; spanFirst?: boolean; bars?: number;
}) {
  const safeN = Math.min(4, Math.max(1, Math.round(n) || 1));
  const halfGap = Math.max(1.5, Math.min(6, gap / 4));
  const ruleBorder = rule ? `${COLUMNS_RULE_WIDTH[ruleStyle] ?? 1}px ${ruleStyle} color-mix(in srgb, currentColor 55%, transparent)` : undefined;
  return (
    <div className="flex h-9 w-full flex-col overflow-hidden rounded-[3px] border border-border/80 bg-background p-1" aria-hidden="true">
      {spanFirst && <span className="mb-[3px] h-[3px] w-[88%] shrink-0 rounded-full bg-foreground/25" />}
      <div className="flex min-h-0 flex-1">
        {Array.from({ length: safeN }, (_, i) => (
          <div
            key={i}
            className="flex min-w-0 flex-1 flex-col gap-[2.5px] overflow-hidden"
            style={{
              marginLeft: i === 0 ? 0 : halfGap,
              marginRight: i === safeN - 1 ? 0 : halfGap,
              borderLeft: i > 0 && rule ? ruleBorder : undefined,
              paddingLeft: i > 0 && rule ? Math.max(2, halfGap) : undefined,
            }}
          >
            {[0, 1, 2].slice(0, bars).map((r) => (
              <span key={r} className="shrink-0 rounded-full bg-foreground/20" style={{ height: 2.5, width: `${[92, 72, 84][r]}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** রেখার ধরন বাছাই-চিপের নমুনা রেখা */
function RuleSample({ style }: { style: ColumnsRuleStyle | 'none' }) {
  if (style === 'none') return <Ban size={13} aria-hidden="true" className="text-muted-foreground" />;
  const w = COLUMNS_RULE_WIDTH[style] ?? 1;
  return <span aria-hidden="true" className="block h-0 w-5" style={{ borderTop: `${w}px ${style} currentColor` }} />;
}

/** ওয়ান-ক্লিক প্রিসেট — প্রশ্নপত্র / সংবাদপত্র / সাময়িকী / তালিকা */
const COLUMN_PRESETS: Array<{ id: string; attrs: ColumnsAttrs }> = [
  { id: 'qpaper', attrs: { count: 2, gap: 16, rule: true, ruleStyle: 'solid', fill: 'balance', firstSpan: false } },
  { id: 'news', attrs: { count: 3, gap: 24, rule: true, ruleStyle: 'solid', fill: 'balance', firstSpan: false } },
  { id: 'mag', attrs: { count: 3, gap: 40, rule: false, ruleStyle: 'solid', fill: 'balance', firstSpan: true } },
  { id: 'dict', attrs: { count: 2, gap: 16, rule: false, ruleStyle: 'solid', fill: 'balance', firstSpan: false } },
];

const COLUMN_RULE_STYLES: ColumnsRuleStyle[] = ['solid', 'double', 'dashed', 'dotted'];

export function LayoutTab() {
  const settings = useEditorStore((s) => s.settings);
  const update = useEditorStore((s) => s.updateSettings);
  const tt = useT();
  const fnum = useFmtNum();
  const lang = useLangStore((s) => s.lang);

  const setMargins = (patch: Partial<Margins>) => update({ margins: { ...settings.margins, ...patch } });

  // ── মাল্টি-কলাম লেআউট (প্রশ্নপত্র/সংবাদপত্র) — কার্সর কলামের ভেতরে থাকলে
  // বদল সেখানেই বসে, নইলে কার্সরের অনুচ্ছেদ নতুন কলাম-ব্লকে মুড়ে যায় ──
  const ed = useActiveEditor();
  const inColumns = (() => {
    if (!ed || ed.isDestroyed) return false;
    try { return ed.isActive('columns'); } catch { return false; }
  })();
  const colAttrs = (inColumns ? ed?.getAttributes('columns') : null) as Partial<ColumnsAttrs> | null | undefined;
  const colCount = Math.max(1, Math.min(4, Math.round(Number(colAttrs?.count)) || 2));
  const colGap = Math.round(Number(colAttrs?.gap)) || 24;
  const colRule = colAttrs?.rule === true;
  const colRuleStyle = ((): ColumnsRuleStyle => {
    const raw = colAttrs?.ruleStyle;
    return raw === 'double' || raw === 'dashed' || raw === 'dotted' ? raw : 'solid';
  })();
  const colFill: ColumnsFill = colAttrs?.fill === 'start' ? 'start' : 'balance';
  const colFirstSpan = colAttrs?.firstSpan === true;

  const applyColumns = (patch: Partial<ColumnsAttrs>) => {
    runCommand((e) => e.chain().focus().setColumns(patch).run());
  };
  const removeColumns = () => {
    if (!inColumns) {
      toast.info(tt('lay.columns.off.none'));
      return;
    }
    runCommand((e) => e.chain().focus().unsetColumns().run());
    toast.success(tt('lay.columns.off'));
  };
  const insertColBreak = () => {
    if (!inColumns) {
      toast.info(tt('lay.columns.break.outside'));
      return;
    }
    runCommand((e) => e.chain().focus().insertColumnBreak().run());
    toast.success(tt('lay.columns.break.toast'));
  };

  // গ্যাপ স্লাইডার — টেনে আনার সময় শুধু দেখায়, ছাড়ার সময় (commit) আসল বদল বসে
  const [gapDraft, setGapDraft] = useState<number | null>(null);
  const gapShown = gapDraft ?? colGap;

  // পুরনো ডকুমেন্টে pageBorderStyle/pageBorderWidth না থাকলে pageBorder কাইন্ড থেকে ডেরাইভ
  const borderStyle = effectivePageBorderStyle(settings);
  const borderWidth = effectivePageBorderWidth(settings);

  // ── কনটেন্ট ফ্লো: নিচের পাতার লেখা/ছবি ফাঁকা জায়গায় তোলা ──
  const fillFromNext = () => {
    const s = useEditorStore.getState();
    const pageId = s.activePageId ?? s.pages[0]?.id ?? null;
    if (!pageId) return;
    const editor = getEditor(pageId);
    if (!editor || editor.isDestroyed) {
      toast.error(tt('lay.toast.pageNotOpen'));
      return;
    }
    void fillFromNextPage(editor, pageId, availableHeightOfEditor(pageId)).then((res) => {
      if (res.status === 'moved') {
        toast.success(tFmt('lay.toast.moved', { n: fnum(res.blocks) }));
      } else if (res.status === 'absorbed') {
        toast.success(tt('lay.toast.absorbed'));
      } else if (res.status === 'none') {
        toast.info(tt('lay.toast.nofit'));
      } else {
        toast.info(tt('lay.toast.nothing'));
      }
    });
  };

  const smartFlow = () => {
    toast.promise(smartFlowWholeBook(), {
      loading: tt('lay.toast.smartLoading'),
      success: (st) => st.blocksMoved > 0
        ? tFmt('lay.toast.smartMoved', { a: fnum(st.blocksMoved), b: fnum(st.pagesFilled) })
          + (st.pagesDeleted > 0 ? ` · ${tFmt('lay.toast.smartDeleted', { n: fnum(st.pagesDeleted) })}` : '')
        : tt('lay.toast.smartClean'),
      error: tt('lay.toast.smartError'),
    });
  };

  const removeEmpty = () => {
    const n = removeEmptyPages();
    if (n > 0) toast.success(tFmt('lay.toast.removed', { n: fnum(n) }));
    else toast.info(tt('lay.toast.noneFound'));
  };

  // ── পানির ছাপ: পুরনো ডকুমেন্টে settings.watermark অনুপস্থিত হতে পারে — ডিফল্ট ধরে নেই ──
  const wm: WatermarkSettings = settings.watermark ?? WATERMARK_DEFAULTS;
  // mergeSettings নেস্টেড অবজেক্ট ডিপ-মার্জ করে, তবু পুরো অবজেক্ট লিখি —
  // ফলে পুরনো ডকুমেন্টে প্রথম বদলের সাথেই সম্পূর্ণ watermark ফিল্ড তৈরি হয়ে যায়
  const setWm = (patch: Partial<WatermarkSettings>) => update({ watermark: { ...wm, ...patch } });
  const toggleWatermark = () => {
    if (wm.enabled) {
      setWm({ enabled: false });
      return;
    }
    // ফাঁকা লেখায় চালু করলে ডিফল্ট 'খসড়া' বসাই — নইলে চালু হয়েও দেখা যেত না
    setWm({ enabled: true, ...(wm.text.trim() ? {} : { text: 'খসড়া' }) });
  };
  const applyWatermarkPreset = (text: string) => setWm({ enabled: true, text });

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label={tt('lay.group.paper')} accent="paper size">
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ribbon-select w-44">
                {PAPER_PRESETS.find((p) => p.id === settings.paperSize)?.name ?? 'A4'} <span aria-hidden="true">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {PAPER_PRESETS.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => update({ paperSize: p.id })}>
                  <span className="flex flex-col">
                    <span className={cn(settings.paperSize === p.id && 'font-bold')}>{p.name}</span>
                    <span className="text-[10px] text-muted-foreground">{p.note} — {fnum(p.widthMm)}×{fnum(p.heightMm)} {tt('lay.mm')}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-1">
            <button
              type="button"
              className={cn('ribbon-toggle', settings.orientation === 'portrait' && 'ribbon-toggle-active')}
              onClick={() => update({ orientation: 'portrait' })}
              title={tt('lay.orient.portrait')}
            >
              ▯ {tt('lay.orient.portrait')}
            </button>
            <button
              type="button"
              className={cn('ribbon-toggle', settings.orientation === 'landscape' && 'ribbon-toggle-active')}
              onClick={() => update({ orientation: 'landscape' })}
              title={tt('lay.orient.landscape')}
            >
              ▭ {tt('lay.orient.landscape')}
            </button>
          </div>
          {settings.paperSize === 'custom' ? (
            <div className="flex gap-2">
              <Field label={tt('lay.paper.width')}>
                <input
                  type="number"
                  className="ribbon-number w-16"
                  value={settings.customPaper.widthMm}
                  min={80}
                  max={600}
                  onChange={(e) => update({ customPaper: { ...settings.customPaper, widthMm: Math.max(80, Math.min(600, Number(e.target.value) || 210)) } })}
                />
              </Field>
              <Field label={tt('lay.paper.height')}>
                <input
                  type="number"
                  className="ribbon-number w-16"
                  value={settings.customPaper.heightMm}
                  min={80}
                  max={900}
                  onChange={(e) => update({ customPaper: { ...settings.customPaper, heightMm: Math.max(80, Math.min(900, Number(e.target.value) || 297)) } })}
                />
              </Field>
            </div>
          ) : null}
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('lay.group.margins')} accent="margins (in)">
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ribbon-select w-44">
                {tt('lay.margins.preset')} <span aria-hidden="true">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {MARGIN_PRESETS.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => update({ margins: { ...p.margins, gutter: 0 } })}>
                  {p.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Field label={tt('lay.margin.top')}>
              <NumberInput value={settings.margins.top} onChange={(v) => setMargins({ top: v })} />
            </Field>
            <Field label={tt('lay.margin.bottom')}>
              <NumberInput value={settings.margins.bottom} onChange={(v) => setMargins({ bottom: v })} />
            </Field>
            <Field label={tt('lay.margin.left')}>
              <NumberInput value={settings.margins.left} onChange={(v) => setMargins({ left: v })} />
            </Field>
            <Field label={tt('lay.margin.right')}>
              <NumberInput value={settings.margins.right} onChange={(v) => setMargins({ right: v })} />
            </Field>
            <Field label={tt('lay.margin.gutter')}>
              <NumberInput value={settings.margins.gutter} onChange={(v) => setMargins({ gutter: v })} max={1.5} />
            </Field>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('lay.group.paperBorder')} accent="paper & border">
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            {PAPER_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={tt(c.k, c.name)}
                aria-label={tt(c.k, c.name)}
                onClick={() => update({ paperColor: c.id })}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition',
                  settings.paperColor === c.id ? 'border-primary scale-110' : 'border-border',
                )}
                style={{ backgroundColor: c.bg }}
              />
            ))}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ribbon-select w-40">
                <SwatchBook size={13} /> {tt('lay.border.label')} {
                  settings.pageBorder === 'none' ? tt('lay.border.none') : settings.pageBorder === 'thin' ? tt('lay.border.thin') : settings.pageBorder === 'double' ? tt('lay.border.double') : tt('lay.border.ornamental')
                } <span aria-hidden="true">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => update({ pageBorder: 'none' })}>{tt('lay.border.none')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => update({ pageBorder: 'thin', pageBorderStyle: 'solid', pageBorderWidth: 'thin' })}>{tt('lay.border.thinline')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => update({ pageBorder: 'double', pageBorderStyle: 'double', pageBorderWidth: 'thick' })}>{tt('lay.border.doublebook')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => update({ pageBorder: 'ornamental' })}>{tt('lay.border.ornframe')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-28" title={tt('lay.border.styleTip')}>
                  {tt('lay.border.stylePrefix')} {tt(BORDER_STYLE_LABELS[borderStyle])} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(['solid', 'double', 'dashed'] as PageBorderStyle[]).map((st) => (
                  <DropdownMenuItem key={st} onClick={() => update({ pageBorderStyle: st })}>
                    <span className={cn(borderStyle === st && 'font-bold')}>{tt(BORDER_STYLE_LABELS[st])}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-28" title={tt('lay.border.widthTip')}>
                  {tt('lay.border.widthPrefix')} {tt(BORDER_WIDTH_LABELS[borderWidth])} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(['thin', 'medium', 'thick'] as PageBorderWidth[]).map((w) => (
                  <DropdownMenuItem key={w} onClick={() => update({ pageBorderWidth: w })}>
                    <span className={cn(borderWidth === w && 'font-bold')}>{tt(BORDER_WIDTH_LABELS[w])} — {fnum(PAGE_BORDER_WIDTH_PX[w])}px</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-xs text-muted-foreground">{tt('lay.line.color')}</span>
            {BORDER_LINE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={`${tt(c.k, c.name)} (${c.hex})`}
                aria-label={tt('lay.line.colorAria').split('{name}').join(tt(c.k, c.name))}
                onClick={() => update({ pageBorderColor: c.hex })}
                className={cn(
                  'h-5 w-5 rounded-full border-2 transition',
                  settings.pageBorderColor === c.hex ? 'border-foreground scale-110' : 'border-transparent',
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
            <input
              type="color"
              aria-label={tt('lay.color.customBorderAria')}
              title={tt('lay.color.custom')}
              className="h-5 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
              value={/^#[0-9a-fA-F]{6}$/.test(settings.pageBorderColor) ? settings.pageBorderColor : '#1e293b'}
              onChange={(e) => update({ pageBorderColor: e.target.value })}
            />
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('lay.group.columns')} accent="columns layout">
        <div className="flex flex-col gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="ribbon-select w-48" title={tt('lay.columns.tip')}>
                {inColumns ? <Columns3 size={13} /> : <Columns2 size={13} />}{' '}
                {inColumns ? tFmt('lay.columns.countN', { n: fnum(colCount) }) : tt('lay.columns.label')}
                <span aria-hidden="true">▾</span>
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              collisionPadding={8}
              className="max-h-[calc(100vh-9rem)] w-[324px] space-y-3 overflow-y-auto p-3"
              // কন্ট্রোল চাপলে runCommand এডিটরে ফোকাস ফেরত পাঠায় — সেটায় পপওভার বন্ধ
              // হয়ে যেত; প্রিমিয়াম অভিজ্ঞতায় প্যানেল খোলা থেকে যায়, বাইরে ক্লিক/Escape-এই বন্ধ
              onFocusOutside={(e) => e.preventDefault()}
              onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
            >
              {/* ওয়ান-ক্লিক প্রিসেট */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tt('lay.columns.presets')}</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {COLUMN_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      title={tt(`lay.columns.preset.${p.id}`)}
                      aria-label={tt(`lay.columns.preset.${p.id}`)}
                      className="group flex flex-col items-center gap-1 rounded-md border border-border bg-background p-1.5 transition-all hover:-translate-y-px hover:border-primary hover:shadow-sm"
                      onClick={() => applyColumns(p.attrs)}
                    >
                      <ColMini n={p.attrs.count} gap={p.attrs.gap} rule={p.attrs.rule} ruleStyle={p.attrs.ruleStyle} spanFirst={p.attrs.firstSpan} bars={2} />
                      <span className="w-full truncate text-center text-[10px] leading-none">{tt(`lay.columns.preset.${p.id}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* কলাম সংখ্যা */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tt('lay.columns.layoutLabel')}</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {[2, 3, 4].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-pressed={inColumns && colCount === n}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-md border p-1.5 transition-all hover:-translate-y-px hover:shadow-sm',
                        inColumns && colCount === n
                          ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                          : 'border-border bg-background hover:border-primary',
                      )}
                      onClick={() => applyColumns({ count: n })}
                    >
                      <ColMini n={n} gap={gapShown} rule={colRule} ruleStyle={colRuleStyle} spanFirst={colFirstSpan} />
                      <span className="flex items-center gap-1 text-[10px] leading-none">
                        {tFmt('lay.columns.countN', { n: fnum(n) })}
                        {inColumns && colCount === n && <Check size={10} className="text-primary" aria-hidden="true" />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* কলামের ফাঁক — প্রিসেট + সূক্ষ্ম স্লাইডার */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tt('lay.columns.gapLabel')}</p>
                  <span className="tabular-nums text-[10px] text-muted-foreground">{fnum(gapShown)}px</span>
                </div>
                <div className="mb-2 grid grid-cols-3 gap-1.5">
                  {(Object.entries(COLUMNS_GAP_PRESETS) as Array<[string, number]>).map(([id, px]) => (
                    <button
                      key={id}
                      type="button"
                      aria-pressed={colGap === px}
                      className={cn(
                        'rounded-md border px-1 py-1 text-[11px] transition-colors',
                        colGap === px ? 'border-primary bg-primary/5 font-semibold text-primary' : 'border-border bg-background hover:border-primary',
                      )}
                      onClick={() => { setGapDraft(null); applyColumns({ gap: px }); }}
                    >
                      {tt(`lay.columns.gap.${id}`)}
                    </button>
                  ))}
                </div>
                <Slider
                  value={[gapShown]}
                  min={8}
                  max={64}
                  step={2}
                  aria-label={tt('lay.columns.gapLabel')}
                  onValueChange={(v) => setGapDraft(v[0] ?? gapShown)}
                  onValueCommit={(v) => { setGapDraft(null); if (v[0] != null && v[0] !== colGap) applyColumns({ gap: v[0] }); }}
                />
              </div>

              {/* মাঝের রেখা — ধরনসহ */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tt('lay.columns.ruleStyleLabel')}</p>
                <div className="grid grid-cols-5 gap-1.5">
                  <button
                    type="button"
                    aria-pressed={!colRule}
                    title={tt('lay.columns.ruleStyle.none')}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors',
                      !colRule ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:border-primary',
                    )}
                    onClick={() => applyColumns({ rule: false })}
                  >
                    <RuleSample style="none" />
                    <span className="text-[10px] leading-none">{tt('lay.columns.ruleStyle.none')}</span>
                  </button>
                  {COLUMN_RULE_STYLES.map((st) => (
                    <button
                      key={st}
                      type="button"
                      aria-pressed={colRule && colRuleStyle === st}
                      title={tt(`lay.columns.ruleStyle.${st}`)}
                      className={cn(
                        'flex flex-col items-center gap-1 rounded-md border px-1 py-1.5 transition-colors',
                        colRule && colRuleStyle === st ? 'border-primary bg-primary/5 text-primary' : 'border-border bg-background hover:border-primary',
                      )}
                      onClick={() => applyColumns({ rule: true, ruleStyle: st })}
                    >
                      <RuleSample style={st} />
                      <span className="text-[10px] leading-none">{tt(`lay.columns.ruleStyle.${st}`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ভরাট ধরন */}
              <div>
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{tt('lay.columns.fillLabel')}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['balance', 'start'] as ColumnsFill[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      aria-pressed={colFill === f}
                      className={cn(
                        'rounded-md border px-2 py-1.5 text-left transition-colors',
                        colFill === f ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary',
                      )}
                      onClick={() => applyColumns({ fill: f })}
                    >
                      <span className="block text-[11px] font-semibold leading-tight">{tt(`lay.columns.fill.${f}`)}</span>
                      <span className="block text-[10px] leading-snug text-muted-foreground">{tt(`lay.columns.fill.${f}.desc`)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* প্রথম ব্লক সব কলাম জুড়ে */}
              <label className="flex items-start gap-2.5 rounded-md border border-border bg-background p-2">
                <Switch
                  checked={colFirstSpan}
                  onCheckedChange={(v) => applyColumns({ firstSpan: v })}
                  aria-label={tt('lay.columns.firstSpan')}
                  className="mt-0.5"
                />
                <span className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold leading-tight">{tt('lay.columns.firstSpan')}</span>
                  <span className="text-[10px] leading-snug text-muted-foreground">{tt('lay.columns.firstSpan.desc')}</span>
                </span>
              </label>

              {/* কলাম ব্রেক + সরান */}
              <div className="flex items-center gap-1.5 border-t border-border pt-2.5">
                <Button type="button" variant="secondary" size="sm" className="h-7 flex-1 text-[11px]" title={tt('lay.columns.breakTip')} onClick={insertColBreak}>
                  <MoveDown size={12} aria-hidden="true" />
                  {tt('lay.columns.breakBtn')}
                  <kbd className="ml-1 rounded border border-border bg-muted px-1 font-sans text-[9px] text-muted-foreground">Ctrl+⇧+↵</kbd>
                </Button>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px] text-destructive hover:text-destructive" onClick={removeColumns}>
                  {tt('lay.columns.remove')}
                </Button>
              </div>
              <p className="text-[10px] leading-snug text-muted-foreground">{tt('lay.columns.hint')}</p>
            </PopoverContent>
          </Popover>
          <p className="px-1 text-[10px] leading-snug text-muted-foreground">{tt('lay.columns.tipShort')}</p>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('lay.group.watermark')} accent="indigo">
        <div className="flex flex-col gap-1">
          <RibbonButton
            icon={Droplet}
            label={tt('lay.wm.label')}
            title={tt('lay.wm.tip')}
            active={wm.enabled}
            onClick={toggleWatermark}
          />
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-28" title={tt('lay.wm.preset')}>
                  <span className="truncate">{wm.text.trim() || tt('lay.wm.presetShort')}</span> <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {WATERMARK_PRESETS.map((p) => (
                  <DropdownMenuItem key={p.text} onClick={() => applyWatermarkPreset(p.text)}>
                    <span className="flex flex-col">
                      <span className={cn(wm.text === p.text && 'font-bold')}>{tt(p.lk, p.label)}</span>
                      <span className="text-[10px] text-muted-foreground">{tt(p.nk, p.note)}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="ribbon-select w-36" title={tt('lay.wm.customizeTitle')}>
                  <SlidersHorizontal size={13} /> {tt('lay.wm.customizeBtn')} <span aria-hidden="true">▾</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">{tt('lay.wm.text')}</p>
                <Input
                  value={wm.text}
                  onChange={(e) => setWm({ text: e.target.value })}
                  placeholder={tt('lay.wm.ph')}
                  className="h-8 text-sm"
                />
                <p className="mb-1 mt-2.5 text-xs font-semibold text-muted-foreground">{tt('lay.wm.preview')}</p>
                <div className="flex h-14 items-center justify-center overflow-hidden rounded-md border border-border bg-background">
                  <span
                    aria-hidden="true"
                    className="whitespace-nowrap font-bold"
                    style={{
                      transform: `rotate(${wm.angle}deg)`,
                      color: wm.color,
                      opacity: wm.opacity,
                      fontSize: `${Math.min(wm.fontSize, 28)}pt`,
                      fontFamily: fontStackOf(settings.defaultFont),
                    }}
                  >
                    {wm.text.trim() || tt('lay.wm.ph')}
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{tt('lay.wm.opacity')}</span>
                      <span className="tabular-nums">{fnum(Math.round(wm.opacity * 100))}%</span>
                    </div>
                    <Slider value={[wm.opacity]} min={0.04} max={0.35} step={0.01} onValueChange={(v) => setWm({ opacity: v[0] ?? wm.opacity })} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{tt('lay.wm.angle')}</span>
                      <span className="tabular-nums">{fnum(wm.angle)}°</span>
                    </div>
                    <Slider value={[wm.angle]} min={-90} max={90} step={5} onValueChange={(v) => setWm({ angle: v[0] ?? wm.angle })} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{tt('lay.wm.fontSize')}</span>
                      <span className="tabular-nums">{fnum(wm.fontSize)}</span>
                    </div>
                    <Slider value={[wm.fontSize]} min={24} max={120} step={4} onValueChange={(v) => setWm({ fontSize: v[0] ?? wm.fontSize })} />
                  </div>
                </div>
                <p className="mb-1 mt-3 text-xs font-semibold text-muted-foreground">{tt('lay.wm.color')}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {WATERMARK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={tt('lay.wm.colorAria').split('{name}').join(c)}
                      title={c}
                      onClick={() => setWm({ color: c })}
                      className={cn(
                        'h-6 w-6 rounded-md border border-black/10 transition hover:scale-110',
                        wm.color.toLowerCase() === c && 'ring-2 ring-primary ring-offset-1',
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    aria-label={tt('lay.wm.customWmAria')}
                    title={tt('lay.color.custom')}
                    className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
                    value={/^#[0-9a-fA-F]{6}$/.test(wm.color) ? wm.color : '#64748b'}
                    onChange={(e) => setWm({ color: e.target.value })}
                  />
                </div>
                <p className="mt-2.5 text-[10px] leading-snug text-muted-foreground">
                  {tt('lay.wm.warn')}
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('lay.group.flow')} accent="content flow">
        <div className="flex flex-col gap-1">
          <RibbonButton
            icon={ArrowUpToLine}
            label={tt('lay.flow.fill')}
            title={tt('lay.flow.fill.tip')}
            onClick={fillFromNext}
          />
          <RibbonButton
            icon={Wand2}
            label={tt('lay.flow.smart')}
            title={tt('lay.flow.smart.tip')}
            onClick={smartFlow}
          />
          <RibbonButton
            icon={Eraser}
            label={tt('lay.flow.remove')}
            title={tt('lay.flow.remove.tip')}
            onClick={removeEmpty}
            danger
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('lay.group.typo')} accent="default typography">
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ribbon-select w-40" style={{ fontFamily: `'${settings.defaultFont}', sans-serif` }}>
                {settings.defaultFont} <span aria-hidden="true">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-[24rem] w-72 overflow-y-auto">
              {FONT_OPTIONS.map((f, i) => {
                const prev = FONT_OPTIONS[i - 1];
                const showGroup = Boolean(f.group && f.group !== prev?.group);
                return (
                  <Fragment key={f.family}>
                    {showGroup && f.group ? (
                      <div
                        className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-1"
                        role="presentation"
                        title={f.group === 'hindi-legacy' ? tt('home.legacy.tip') : undefined}
                      >
                        {f.group === 'devanagari' ? tt('home.fontgroup.devanagari')
                          : f.group === 'hindi-legacy' ? tt('home.fontgroup.hindilegacy')
                          : tt('home.fontgroup.bangla')}
                      </div>
                    ) : null}
                    <DropdownMenuItem
                      style={{ fontFamily: f.stack }}
                      className={cn(settings.defaultFont === f.family && 'bg-accent')}
                      title={f.legacy ? tt('home.legacy.tip') : undefined}
                      onClick={() => update({ defaultFont: f.family })}
                    >
                      <span className="truncate">{f.name}</span>
                      {f.note ? <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/70">{f.note[lang]}</span> : null}
                    </DropdownMenuItem>
                  </Fragment>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Field label={tt('lay.typo.size')}>
              <NumberInput value={settings.defaultFontSize} onChange={(v) => update({ defaultFontSize: v })} step={0.5} min={8} max={28} />
            </Field>
            <Field label={tt('lay.typo.lineHeight')}>
              <NumberInput value={settings.lineHeight} onChange={(v) => update({ lineHeight: v })} step={0.05} min={1} max={3} />
            </Field>
            <Field label={tt('lay.typo.paraGap')}>
              <NumberInput value={settings.paragraphSpacing} onChange={(v) => update({ paragraphSpacing: v })} step={1} min={0} max={28} />
            </Field>
          </div>
        </div>
      </RibbonGroup>
    </div>
  );
}
