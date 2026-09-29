/**
 * Layout tab — paper size, margins, paper color, page border, default typography,
 * content flow (ফাঁকা জায়গা পূরণ / স্মার্ট ফ্লো / ফাঁকা পাতা পরিষ্কার)
 */

'use client';

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
import { toBanglaNumber } from '@/lib/bangla';
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

const PAPER_COLORS: Array<{ id: PaperColor; name: string; bg: string }> = [
  { id: 'white', name: 'White', bg: '#ffffff' },
  { id: 'cream', name: 'Cream (Book Paper)', bg: '#f7edd8' },
  { id: 'dark', name: 'Dark Mode', bg: '#1e293b' },
];

/** বর্ডার লাইনের প্রিসেট রং — প্রথমটি (Black) ডিফল্ট লুক */
const BORDER_LINE_COLORS: Array<{ hex: string; name: string }> = [
  { hex: '#1e293b', name: 'Black' },
  { hex: '#64748b', name: 'Slate' },
  { hex: '#9f1239', name: 'Maroon' },
  { hex: '#4f46e5', name: 'Indigo' },
  { hex: '#059669', name: 'Emerald' },
  { hex: '#d97706', name: 'Amber' },
  { hex: '#e11d48', name: 'Rose' },
  { hex: '#ca8a04', name: 'Gold' },
];

const BORDER_STYLE_LABELS: Record<PageBorderStyle, string> = { solid: 'Solid', double: 'Double', dashed: 'Dashed' };
const BORDER_WIDTH_LABELS: Record<PageBorderWidth, string> = { thin: 'Thin', medium: 'Medium', thick: 'Thick' };

// ─── পানির ছাপ (Watermark) ───

/** এক-ক্লিক প্রিসেট — লেখা + চালু করে দেয় (বাকি স্টাইল অপরিবর্তিত) */
const WATERMARK_PRESETS: Array<{ text: string; label: string; note: string }> = [
  { text: 'খসড়া', label: 'খসড়া (Draft)', note: 'লেখা চলাকালীন প্রিন্ট-প্রুফ শনাক্ত করতে' },
  { text: 'নমুনা', label: 'নমুনা (Sample)', note: 'রিভিউ/প্রুফ কপির জন্য' },
  { text: 'গোপনীয়', label: 'গোপনীয় (Confidential)', note: 'সংবেদনশীল ডকুমেন্টে' },
  { text: 'COPY', label: 'COPY', note: 'অননুমোদিত কপি চিহ্নিত করতে' },
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
      toast.error('পাতাটি এখনো খোলেনি — পাতাটিতে একবার ক্লিক করে আবার চাপুন');
      return;
    }
    void fillFromNextPage(editor, pageId, availableHeightOfEditor(pageId)).then((res) => {
      if (res.status === 'moved') {
        toast.success(`${toBanglaNumber(res.blocks)}টি ব্লক নিচের পাতা থেকে উঠে এসেছে`);
      } else if (res.status === 'absorbed') {
        toast.success('পরের পাতার সব লেখা এই পাতায় উঠে এসেছে — খালি পাতাটি মুছে গেছে');
      } else if (res.status === 'none') {
        toast.info('পরের পাতার প্রথম ব্লকটি ফাঁকা জায়গায় আঁটে না — আর তোলা যায়নি');
      } else {
        toast.info('এই পাতার পরে টানার মতো কনটেন্ট নেই');
      }
    });
  };

  const smartFlow = () => {
    toast.promise(smartFlowWholeBook(), {
      loading: 'স্মার্ট ফ্লো চলছে — ফাঁকা পাতাগুলো পূরণ করতে স্বয়ংক্রিয়ভাবে স্ক্রল হচ্ছে…',
      success: (st) => st.blocksMoved > 0
        ? `${toBanglaNumber(st.blocksMoved)}টি ব্লক ${toBanglaNumber(st.pagesFilled)}টি পাতায় উঠে গেছে${st.pagesDeleted > 0 ? ` · ${toBanglaNumber(st.pagesDeleted)}টি পাতা মুছে গেছে` : ''}`
        : 'সব পাতা আগে থেকেই সুন্দরভাবে সাজানো — কিছু করার নেই',
      error: 'স্মার্ট ফ্লো চালাতে সমস্যা হয়েছে',
    });
  };

  const removeEmpty = () => {
    const n = removeEmptyPages();
    if (n > 0) toast.success(`${toBanglaNumber(n)}টি ফাঁকা পাতা মুছে ফেলা হয়েছে`);
    else toast.info('কোনো ফাঁকা পাতা পাওয়া যায়নি');
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
      <RibbonGroup label="Paper Size">
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
                    <span className="text-[10px] text-muted-foreground">{p.note} — {toBanglaNumber(p.widthMm)}×{toBanglaNumber(p.heightMm)} mm</span>
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
              title="Portrait"
            >
              ▯ Portrait
            </button>
            <button
              type="button"
              className={cn('ribbon-toggle', settings.orientation === 'landscape' && 'ribbon-toggle-active')}
              onClick={() => update({ orientation: 'landscape' })}
              title="Landscape"
            >
              ▭ Landscape
            </button>
          </div>
          {settings.paperSize === 'custom' ? (
            <div className="flex gap-2">
              <Field label="Width (mm)">
                <input
                  type="number"
                  className="ribbon-number w-16"
                  value={settings.customPaper.widthMm}
                  min={80}
                  max={600}
                  onChange={(e) => update({ customPaper: { ...settings.customPaper, widthMm: Math.max(80, Math.min(600, Number(e.target.value) || 210)) } })}
                />
              </Field>
              <Field label="Height (mm)">
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
      <RibbonGroup label="Margins (in)">
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ribbon-select w-44">
                Preset Margins <span aria-hidden="true">▾</span>
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
            <Field label="Top">
              <NumberInput value={settings.margins.top} onChange={(v) => setMargins({ top: v })} />
            </Field>
            <Field label="Bottom">
              <NumberInput value={settings.margins.bottom} onChange={(v) => setMargins({ bottom: v })} />
            </Field>
            <Field label="Left">
              <NumberInput value={settings.margins.left} onChange={(v) => setMargins({ left: v })} />
            </Field>
            <Field label="Right">
              <NumberInput value={settings.margins.right} onChange={(v) => setMargins({ right: v })} />
            </Field>
            <Field label="Gutter">
              <NumberInput value={settings.margins.gutter} onChange={(v) => setMargins({ gutter: v })} max={1.5} />
            </Field>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Paper & Border">
        <div className="flex flex-col gap-1.5">
          <div className="flex gap-1">
            {PAPER_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={c.name}
                aria-label={c.name}
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
                <SwatchBook size={13} /> Page Border: {
                  settings.pageBorder === 'none' ? 'None' : settings.pageBorder === 'thin' ? 'Thin' : settings.pageBorder === 'double' ? 'Double' : 'Ornamental'
                } <span aria-hidden="true">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => update({ pageBorder: 'none' })}>None</DropdownMenuItem>
              <DropdownMenuItem onClick={() => update({ pageBorder: 'thin', pageBorderStyle: 'solid', pageBorderWidth: 'thin' })}>Thin Line</DropdownMenuItem>
              <DropdownMenuItem onClick={() => update({ pageBorder: 'double', pageBorderStyle: 'double', pageBorderWidth: 'thick' })}>Double Line (Book)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => update({ pageBorder: 'ornamental' })}>Ornamental Frame</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-28" title="Border line style">
                  Style: {BORDER_STYLE_LABELS[borderStyle]} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(['solid', 'double', 'dashed'] as PageBorderStyle[]).map((st) => (
                  <DropdownMenuItem key={st} onClick={() => update({ pageBorderStyle: st })}>
                    <span className={cn(borderStyle === st && 'font-bold')}>{BORDER_STYLE_LABELS[st]}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-28" title="Border line width">
                  Width: {BORDER_WIDTH_LABELS[borderWidth]} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(['thin', 'medium', 'thick'] as PageBorderWidth[]).map((w) => (
                  <DropdownMenuItem key={w} onClick={() => update({ pageBorderWidth: w })}>
                    <span className={cn(borderWidth === w && 'font-bold')}>{BORDER_WIDTH_LABELS[w]} — {PAGE_BORDER_WIDTH_PX[w]}px</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="whitespace-nowrap text-xs text-muted-foreground">Line Color</span>
            {BORDER_LINE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={`${c.name} (${c.hex})`}
                aria-label={`Border line color ${c.name}`}
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
              aria-label="Custom border color"
              title="Custom color"
              className="h-5 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
              value={/^#[0-9a-fA-F]{6}$/.test(settings.pageBorderColor) ? settings.pageBorderColor : '#1e293b'}
              onChange={(e) => update({ pageBorderColor: e.target.value })}
            />
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Watermark">
        <div className="flex flex-col gap-1">
          <RibbonButton
            icon={Droplet}
            label="Watermark"
            title="প্রতিটি পাতায় হালকা ঘূর্ণিত পানির ছাপ — প্রিন্ট ও ফরমার খসড়া কপিতেও ছাপা হয়"
            active={wm.enabled}
            onClick={toggleWatermark}
          />
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-28" title="Watermark preset">
                  <span className="truncate">{wm.text.trim() || 'Preset'}</span> <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {WATERMARK_PRESETS.map((p) => (
                  <DropdownMenuItem key={p.text} onClick={() => applyWatermarkPreset(p.text)}>
                    <span className="flex flex-col">
                      <span className={cn(wm.text === p.text && 'font-bold')}>{p.label}</span>
                      <span className="text-[10px] text-muted-foreground">{p.note}</span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="ribbon-select w-36" title="Watermark customization">
                  <SlidersHorizontal size={13} /> Customize… <span aria-hidden="true">▾</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3" align="start">
                <p className="mb-1 text-xs font-semibold text-muted-foreground">Watermark Text</p>
                <Input
                  value={wm.text}
                  onChange={(e) => setWm({ text: e.target.value })}
                  placeholder="খসড়া"
                  className="h-8 text-sm"
                />
                <p className="mb-1 mt-2.5 text-xs font-semibold text-muted-foreground">Preview</p>
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
                    {wm.text.trim() || 'খসড়া'}
                  </span>
                </div>
                <div className="mt-3 space-y-2.5">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Opacity</span>
                      <span className="tabular-nums">{Math.round(wm.opacity * 100)}%</span>
                    </div>
                    <Slider value={[wm.opacity]} min={0.04} max={0.35} step={0.01} onValueChange={(v) => setWm({ opacity: v[0] ?? wm.opacity })} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Angle</span>
                      <span className="tabular-nums">{wm.angle}°</span>
                    </div>
                    <Slider value={[wm.angle]} min={-90} max={90} step={5} onValueChange={(v) => setWm({ angle: v[0] ?? wm.angle })} />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Font Size (pt)</span>
                      <span className="tabular-nums">{wm.fontSize}</span>
                    </div>
                    <Slider value={[wm.fontSize]} min={24} max={120} step={4} onValueChange={(v) => setWm({ fontSize: v[0] ?? wm.fontSize })} />
                  </div>
                </div>
                <p className="mb-1 mt-3 text-xs font-semibold text-muted-foreground">Color</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  {WATERMARK_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Watermark color ${c}`}
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
                    aria-label="Custom watermark color"
                    title="Custom color"
                    className="h-6 w-8 cursor-pointer rounded border border-border bg-transparent p-0"
                    value={/^#[0-9a-fA-F]{6}$/.test(wm.color) ? wm.color : '#64748b'}
                    onChange={(e) => setWm({ color: e.target.value })}
                  />
                </div>
                <p className="mt-2.5 text-[10px] leading-snug text-muted-foreground">
                  ছাপটি প্রিন্ট ও ফরমা PDF-এও আসে — চূড়ান্ত PDF বানানোর আগে Watermark টগল বন্ধ করে নিন।
                </p>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Content Flow">
        <div className="flex flex-col gap-1">
          <RibbonButton
            icon={ArrowUpToLine}
            label="Fill Empty Space"
            title="নিচের পাতার লেখা/ছবি/টেবিল এই পাতার ফাঁকা জায়গায় তুলুন"
            onClick={fillFromNext}
          />
          <RibbonButton
            icon={Wand2}
            label="Smart Flow — Whole Book"
            title="পুরো বই স্ক্যান করে প্রতিটি পাতার ফাঁকা জায়গা নিচের পাতার কনটেন্ট দিয়ে ভরাবে"
            onClick={smartFlow}
          />
          <RibbonButton
            icon={Eraser}
            label="Remove Empty Pages"
            title="শুধু খালি পাতাগুলো মুছে ফেলুন"
            onClick={removeEmpty}
            danger
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Default Typography">
        <div className="flex flex-col gap-1">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button type="button" className="ribbon-select w-40" style={{ fontFamily: `'${settings.defaultFont}', sans-serif` }}>
                {settings.defaultFont} <span aria-hidden="true">▾</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-80 w-52 overflow-y-auto">
              {FONT_OPTIONS.map((f) => (
                <DropdownMenuItem key={f.family} style={{ fontFamily: f.stack }} onClick={() => update({ defaultFont: f.family })}>
                  {f.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex flex-wrap gap-x-3 gap-y-1">
            <Field label="Size (pt)">
              <NumberInput value={settings.defaultFontSize} onChange={(v) => update({ defaultFontSize: v })} step={0.5} min={8} max={28} />
            </Field>
            <Field label="Line Height">
              <NumberInput value={settings.lineHeight} onChange={(v) => update({ lineHeight: v })} step={0.05} min={1} max={3} />
            </Field>
            <Field label="Paragraph Gap (px)">
              <NumberInput value={settings.paragraphSpacing} onChange={(v) => update({ paragraphSpacing: v })} step={1} min={0} max={28} />
            </Field>
          </div>
        </div>
      </RibbonGroup>
    </div>
  );
}
