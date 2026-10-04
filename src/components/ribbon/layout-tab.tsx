/**
 * Layout tab — paper size, margins, paper color, page border, default typography,
 * content flow (ফাঁকা জায়গা পূরণ / স্মার্ট ফ্লো / ফাঁকা পাতা পরিষ্কার)
 */

'use client';

import { Fragment } from 'react';
import { ArrowUpToLine, Droplet, Eraser, SlidersHorizontal, SwatchBook, Wand2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { RibbonButton, RibbonDivider, RibbonGroup } from './ribbon-shell';
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

export function LayoutTab() {
  const settings = useEditorStore((s) => s.settings);
  const update = useEditorStore((s) => s.updateSettings);
  const tt = useT();
  const fnum = useFmtNum();
  const lang = useLangStore((s) => s.lang);

  const setMargins = (patch: Partial<Margins>) => update({ margins: { ...settings.margins, ...patch } });

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
