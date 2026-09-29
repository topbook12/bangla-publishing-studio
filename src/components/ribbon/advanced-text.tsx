/**
 * Advanced Text — Word-এর Paragraph ডায়ালগ + Font → Advanced-এর সমতুল্য টুলসেট:
 *  - Word Gap (শব্দের ফাঁক)   — word-spacing
 *  - Char Gap (অক্ষরের ফাঁক)  — letter-spacing (প্যারা জুড়ে + নির্বাচিত লেখায়)
 *  - Para Gap (প্যারার আগে/পরে ফাঁক) — margin-top/bottom প্রিসেট
 *  - Indent/Outdent — বাম ইনডেন্ট ±০.৫em
 *  - First Line (প্রথম-লাইন ইনডেন্ট) — বাংলা বইয়ের চিরচেনা প্যারা-শুরুর ফাঁক
 *  - Special Characters — দাঁড়ি, ডবল দাঁড়ি, ড্যাশ, NBSP, ZWJ/ZWNJ ইত্যাদি
 *  - Spacing popover — সব নিয়ন্ত্রণ এক জায়গায় + প্যারা পটভূমি (shading) + প্রিভিউ
 */

'use client';

import { useState, type CSSProperties } from 'react';
import {
  AlignVerticalSpaceAround, ArrowRightToLine, IndentDecrease, IndentIncrease,
  MoveHorizontal, Omega, SlidersHorizontal, Type,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RibbonButton, RibbonGroup, refocusActiveEditor, runCommand, useActiveEditor } from './ribbon-shell';
import { COLOR_SWATCHES, fontStackOf } from '@/lib/paper';
import { toBanglaNumber } from '@/lib/bangla';
import { useEditorStore } from '@/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ─────────────────────── সহায়ক ───────────────────────

type BlockAttrs = {
  wordSpacing?: string | null;
  letterSpacing?: string | null;
  spaceBefore?: string | null;
  spaceAfter?: string | null;
  firstLineIndent?: string | null;
  indentLeft?: string | null;
  indentRight?: string | null;
  shading?: string | null;
};

/** বর্তমান ব্লকের (paragraph/heading) উন্নত-টাইপোগ্রাফি অ্যাট্রিবিউট পড়ে —
 *  onTransaction প্রতি ট্রানজ্যাকশনে রি-রেন্ডার দেয়, তাই সবসময় তাজা ভ্যালু */
function useBlockAttrs(): BlockAttrs {
  const ed = useActiveEditor();
  if (!ed || ed.isDestroyed) return {};
  try {
    const parent = ed.state.selection.$from.parent;
    const name = parent.type.name;
    if (name === 'heading' || name === 'paragraph') return parent.attrs as BlockAttrs;
    return {};
  } catch {
    return {};
  }
}

function numOf(v: string | null | undefined): number | null {
  if (!v) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function unitOf(v: string | null | undefined): 'px' | 'em' | 'pt' {
  if (!v) return 'px';
  if (v.endsWith('em')) return 'em';
  if (v.endsWith('pt')) return 'pt';
  return 'px';
}

/** ছোট সংখ্যা ইনপুট — টাইপ করার সাথে সাথেই এডিটরে কমিট হয় */
function MiniNum({ value, onCommit, min = 0, max = 20, step = 1, w = 'w-14', ariaLabel }: {
  value: number | null;
  onCommit: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  w?: string;
  ariaLabel: string;
}) {
  return (
    <input
      type="number"
      className={cn('ribbon-number', w)}
      value={value ?? 0}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
      onChange={(e) => {
        const v = Number(e.target.value);
        if (Number.isFinite(v)) onCommit(Math.min(max, Math.max(min, v)));
      }}
    />
  );
}

function PopField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex items-center justify-between gap-2 text-xs">
      <span className="whitespace-nowrap text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">{children}</span>
    </label>
  );
}

/** প্যারা-সেটিংস প্রিভিউ — বর্তমান অ্যাট্রিবিউট দিয়েই নমুনা লাইন আঁকি */
function ParaPreview({ a }: { a: BlockAttrs }) {
  const font = useEditorStore((s) => s.settings.defaultFont);
  const style: CSSProperties = {
    fontFamily: fontStackOf(font),
    wordSpacing: a.wordSpacing ?? undefined,
    letterSpacing: a.letterSpacing ?? undefined,
    textIndent: a.firstLineIndent ?? undefined,
    paddingLeft: a.indentLeft ?? undefined,
    paddingRight: a.indentRight ?? undefined,
    backgroundColor: a.shading ?? undefined,
  };
  return (
    <div className="rounded-md border border-border bg-background p-2">
      <p className="text-xs leading-relaxed" style={style}>
        আমার সোনার বাংলা — এই নমুনা লাইনে আপনার সব ফাঁক ও ইনডেন্ট যেভাবে দেখাবে, বইয়ে ঠিক তেমনই ছাপা হবে।
      </p>
    </div>
  );
}

// ─────────────────────── Word Gap (শব্দের ফাঁক) ───────────────────────

const WORD_GAP_PRESETS: Array<{ v: string | null; label: string }> = [
  { v: null, label: 'সাধারণ (ডিফল্ট)' },
  { v: '-1px', label: 'সংকুচিত (−১px)' },
  { v: '1px', label: `১px ফাঁক` },
  { v: '2px', label: `২px ফাঁক` },
  { v: '3px', label: `৩px ফাঁক` },
  { v: '5px', label: `৫px ফাঁক` },
  { v: '8px', label: `৮px ফাঁক (ঢিলা)` },
  { v: '0.12em', label: 'বই-জাস্টিফাইড (০.১২em)' },
  { v: '0.25em', label: 'বই-জাস্টিফাইড বড় (০.২৫em)' },
];

function WordGapMenu() {
  const a = useBlockAttrs();
  const cur = a.wordSpacing ?? null;
  const triggerLabel = cur ? `Word Gap · ${toBanglaNumber(numOf(cur) ?? 0)}` : 'Word Gap';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('ribbon-btn', cur && 'ribbon-btn-active')} aria-label="Word spacing">
          <MoveHorizontal size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{triggerLabel}</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">শব্দের মাঝের ফাঁক</DropdownMenuLabel>
        {WORD_GAP_PRESETS.map((p) => (
          <DropdownMenuItem
            key={p.label}
            className={cn((p.v ?? null) === cur && 'bg-accent')}
            onClick={() => runCommand((ed) => {
              if (p.v === null) ed.chain().focus().unsetWordSpacing().run();
              else ed.chain().focus().setWordSpacing(p.v).run();
            })}
          >
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────── Char Gap (অক্ষরের ফাঁক) ───────────────────────

function CharGapMenu() {
  const a = useBlockAttrs();
  const ed = useActiveEditor();
  const cur = a.letterSpacing ?? null;
  const selCur = (() => {
    if (!ed || ed.isDestroyed) return null;
    try { return (ed.getAttributes('textStyle').charSpacing as string | undefined) ?? null; } catch { return null; }
  })();

  const setPara = (v: string | null) => runCommand((ed2) => {
    if (v === null) ed2.chain().focus().unsetLetterSpacing().run();
    else ed2.chain().focus().setLetterSpacing(v).run();
  });
  const setSel = (v: string | null) => runCommand((ed2) => {
    if (v === null) ed2.chain().focus().unsetCharSpacing().run();
    else ed2.chain().focus().setCharSpacing(v).run();
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('ribbon-btn', (cur || selCur) && 'ribbon-btn-active')} aria-label="Character spacing">
          <Type size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{cur ? `Char Gap · ${toBanglaNumber(numOf(cur) ?? 0)}` : 'Char Gap'}</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">প্যারাগ্রাফ জুড়ে (শিরোনামে দারুণ মানায়)</DropdownMenuLabel>
        {[
          { v: null, label: 'সাধারণ' },
          { v: '-0.5px', label: 'সংকুচিত (−০.৫px)' },
          { v: '0.5px', label: 'প্রশস্ত (০.৫px)' },
          { v: '1px', label: '১px' },
          { v: '2px', label: '২px' },
        ].map((p) => (
          <DropdownMenuItem key={`p-${p.label}`} className={cn((p.v ?? null) === cur && 'bg-accent')} onClick={() => setPara(p.v)}>
            {p.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">শুধু সিলেক্ট করা লেখায়</DropdownMenuLabel>
        {[
          { v: null, label: 'সাধারণ' },
          { v: '-0.5px', label: 'সংকুচিত (−০.৫px)' },
          { v: '0.5px', label: 'প্রশস্ত (০.৫px)' },
          { v: '1px', label: '১px' },
          { v: '2px', label: '২px' },
        ].map((p) => (
          <DropdownMenuItem key={`s-${p.label}`} className={cn((p.v ?? null) === selCur && 'bg-accent')} onClick={() => setSel(p.v)}>
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────── Para Gap (প্যারার আগে/পরে ফাঁক) ───────────────────────

function ParaSpaceMenu() {
  const a = useBlockAttrs();
  const active = a.spaceBefore != null || a.spaceAfter != null;

  const presets = [
    { label: 'সাধারণ (ডিফল্ট)', before: null as string | null, after: null as string | null },
    { label: 'টাইট — ৩pt', before: '3pt', after: '3pt' },
    { label: 'মাঝারি — ৬pt', before: '6pt', after: '6pt' },
    { label: 'ঢিলা — ১২pt', before: '12pt', after: '12pt' },
    { label: 'অধ্যায়-বিরতি — আগে ২৪pt', before: '24pt', after: null },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('ribbon-btn', active && 'ribbon-btn-active')} aria-label="Paragraph spacing">
          <AlignVerticalSpaceAround size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{active ? 'Para Gap ✓' : 'Para Gap'}</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">প্যারার আগে/পরে ফাঁক</DropdownMenuLabel>
        {presets.map((p) => (
          <DropdownMenuItem
            key={p.label}
            onClick={() => runCommand((ed) => {
              const ch = ed.chain().focus();
              if (p.before === null) ch.unsetSpaceBefore(); else ch.setSpaceBefore(p.before);
              if (p.after === null) ch.unsetSpaceAfter(); else ch.setSpaceAfter(p.after);
              ch.run();
            })}
          >
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────── Indent / First Line ───────────────────────

function IndentButtons() {
  return (
    <>
      <RibbonButton
        icon={IndentIncrease}
        label="Indent"
        title="বামে ইনডেন্ট বাড়ান (+০.৫em)"
        onClick={() => runCommand((ed) => ed.chain().focus().adjustIndent('indentLeft', 0.5).run())}
      />
      <RibbonButton
        icon={IndentDecrease}
        label="Outdent"
        title="ইনডেন্ট কমান (−০.৫em)"
        onClick={() => runCommand((ed) => ed.chain().focus().adjustIndent('indentLeft', -0.5).run())}
      />
    </>
  );
}

function FirstLineMenu() {
  const a = useBlockAttrs();
  const cur = a.firstLineIndent ?? null;
  const presets = [
    { v: null, label: 'নেই' },
    { v: '0.5em', label: '০.৫em' },
    { v: '1em', label: '১em (চার্টার্ড)' },
    { v: '1.25em', label: '১.২৫em' },
    { v: '1.5em', label: '১.৫em' },
    { v: '2em', label: '২em' },
  ];

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn('ribbon-select w-24 justify-center', cur && 'ring-1 ring-primary')} title="প্রথম লাইন ইনডেন্ট">
              {cur ? `১ম লাইন ${toBanglaNumber(numOf(cur) ?? 0)}` : '১ম লাইন'} <span aria-hidden="true">▾</span>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">প্রথম লাইন ইনডেন্ট — প্যারা শুরুর ফাঁক (বাংলা বইয়ের রীতি)</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        {presets.map((p) => (
          <DropdownMenuItem
            key={p.label}
            className={cn((p.v ?? null) === cur && 'bg-accent')}
            onClick={() => runCommand((ed) => {
              if (p.v === null) ed.chain().focus().unsetFirstLineIndent().run();
              else ed.chain().focus().setFirstLineIndent(p.v).run();
            })}
          >
            {p.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────── Special Characters (বিশেষ চিহ্ন) ───────────────────────

const CHAR_GROUPS: Array<{ label: string; chars: Array<{ ch: string; label: string }> }> = [
  {
    label: 'বাংলা',
    chars: [
      { ch: '।', label: 'দাঁড়ি' },
      { ch: '॥', label: 'ডবল দাঁড়ি' },
      { ch: '৳', label: 'টাকা চিহ্ন' },
      { ch: 'ঽ', label: 'অবগ্রহ' },
    ],
  },
  {
    label: 'ড্যাশ ও উদ্ধৃতি',
    chars: [
      { ch: '-', label: 'হাইফেন' },
      { ch: '–', label: 'এন ড্যাশ' },
      { ch: '—', label: 'এম ড্যাশ' },
      { ch: '…', label: 'ইলিপসিস' },
      { ch: '‘', label: 'কোট বাম' },
      { ch: '’', label: 'কোট ডান' },
      { ch: '“', label: 'ডাবল কোট বাম' },
      { ch: '”', label: 'ডাবল কোট ডান' },
    ],
  },
  {
    label: 'স্পেস ও যুক্তবর্ণ নিয়ন্ত্রণ',
    chars: [
      { ch: '\u00A0', label: 'নন-ব্রেকিং স্পেস' },
      { ch: '\u200B', label: 'জিরো-উইডথ স্পেস' },
      { ch: '\u200C', label: 'ZWNJ — যুক্তবর্ণ ভাঙুন' },
      { ch: '\u200D', label: 'ZWJ — যুক্তবর্ণ জোড়া রাখুন' },
      { ch: '\u00AD', label: 'সফট হাইফেন' },
    ],
  },
  {
    label: 'অন্যান্য',
    chars: [
      { ch: '•', label: 'বুলেট' },
      { ch: '×', label: 'গুণ' },
      { ch: '÷', label: 'ভাগ' },
      { ch: '±', label: 'প্লাস-মাইনাস' },
      { ch: '°', label: 'ডিগ্রি' },
      { ch: '©', label: 'কপিরাইট' },
      { ch: '®', label: 'রেজিস্টার্ড' },
      { ch: '™', label: 'ট্রেডমার্ক' },
    ],
  },
];

function SpecialCharsMenu() {
  const insert = (ch: string, label: string) => runCommand((ed) => {
    ed.chain().focus().insertContent(ch).run();
    if (/^[\u200B-\u200D\u00AD\u00A0]$/.test(ch)) {
      toast.info(`${label} বসানো হয়েছে — অদৃশ্য চিহ্ন, লেখায় প্রভাব ফেলে`);
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-btn" aria-label="Special characters">
          <Omega size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">Symbols</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        {CHAR_GROUPS.map((g, gi) => (
          <div key={g.label}>
            {gi > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{g.label}</DropdownMenuLabel>
            <div className="grid grid-cols-4 gap-1 px-1 pb-1">
              {g.chars.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  title={c.label}
                  aria-label={c.label}
                  onClick={() => insert(c.ch, c.label)}
                  className="flex h-8 items-center justify-center rounded-md border border-border text-base transition hover:bg-accent hover:scale-105"
                >
                  {/^[\u200B-\u200D\u00AD]$/.test(c.ch) ? <span className="text-[9px] text-muted-foreground">{c.ch === '\u200C' ? 'ZWNJ' : c.ch === '\u200D' ? 'ZWJ' : c.ch === '\u00AD' ? 'H-' : '␣'}</span> : c.ch}
                </button>
              ))}
            </div>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─────────────────────── Spacing & Indent পপওভার (পূর্ণ নিয়ন্ত্রণ) ───────────────────────

function AdvancedSpacingPopover() {
  const a = useBlockAttrs();
  const [open, setOpen] = useState(false);

  const num = (key: keyof BlockAttrs): number | null => numOf(a[key]);
  const unit = (key: keyof BlockAttrs): 'px' | 'em' => unitOf(a[key]) === 'pt' ? 'px' : (unitOf(a[key]) as 'px' | 'em');

  const setLen = (key: 'wordSpacing' | 'letterSpacing' | 'firstLineIndent' | 'indentLeft' | 'indentRight', n: number | null) => {
    if (n === null) return;
    const u = key === 'wordSpacing' || key === 'letterSpacing' ? unit(key) : 'em';
    const val = `${n}${u}`;
    runCommand((ed) => ed.chain().focus()[key === 'wordSpacing' ? 'setWordSpacing' : key === 'letterSpacing' ? 'setLetterSpacing' : key === 'firstLineIndent' ? 'setFirstLineIndent' : key === 'indentLeft' ? 'setIndentLeft' : 'setIndentRight'](val).run());
  };

  const setPt = (key: 'spaceBefore' | 'spaceAfter', n: number) => {
    const val = n > 0 ? `${n}pt` : null;
    runCommand((ed) => ed.chain().focus()[key === 'spaceBefore' ? (val ? 'setSpaceBefore' : 'unsetSpaceBefore') : (val ? 'setSpaceAfter' : 'unsetSpaceAfter')](val as string).run());
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label="Spacing and indent">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <span className="ribbon-btn-label">Spacing</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Spacing & Indent — সব ফাঁক ও ইনডেন্ট এক জায়গায়</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="max-h-[70vh] w-80 space-y-2.5 overflow-y-auto p-3"
        align="start"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <ParaPreview a={a} />

        <PopField label="শব্দের ফাঁক">
          <MiniNum
            value={num('wordSpacing')}
            min={-5}
            max={30}
            ariaLabel="শব্দের ফাঁক"
            onCommit={(v) => setLen('wordSpacing', v)}
          />
          <span className="text-[10px] text-muted-foreground">{unit('wordSpacing')}</span>
        </PopField>

        <PopField label="অক্ষরের ফাঁক">
          <MiniNum
            value={num('letterSpacing')}
            min={-3}
            max={20}
            step={0.5}
            ariaLabel="অক্ষরের ফাঁক"
            onCommit={(v) => setLen('letterSpacing', v)}
          />
          <span className="text-[10px] text-muted-foreground">px</span>
        </PopField>

        <PopField label="প্যারার আগে ফাঁক (pt)">
          <MiniNum value={num('spaceBefore')} max={72} ariaLabel="প্যারার আগে ফাঁক" onCommit={(v) => setPt('spaceBefore', v)} />
        </PopField>

        <PopField label="প্যারার পরে ফাঁক (pt)">
          <MiniNum value={num('spaceAfter')} max={72} ariaLabel="প্যারার পরে ফাঁক" onCommit={(v) => setPt('spaceAfter', v)} />
        </PopField>

        <PopField label="১ম লাইন ইনডেন্ট (em)">
          <MiniNum value={num('firstLineIndent')} max={5} step={0.25} ariaLabel="প্রথম লাইন ইনডেন্ট" onCommit={(v) => setLen('firstLineIndent', v)} />
        </PopField>

        <PopField label="বাম ইনডেন্ট (em)">
          <MiniNum value={num('indentLeft')} max={8} step={0.25} ariaLabel="বাম ইনডেন্ট" onCommit={(v) => setLen('indentLeft', v)} />
        </PopField>

        <PopField label="ডান ইনডেন্ট (em)">
          <MiniNum value={num('indentRight')} max={8} step={0.25} ariaLabel="ডান ইনডেন্ট" onCommit={(v) => setLen('indentRight', v)} />
        </PopField>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">প্যারা পটভূমি (Shading)</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`প্যারা পটভূমি ${c}`}
                className={cn(
                  'h-5 w-5 rounded border border-black/10 transition hover:scale-110',
                  a.shading?.toLowerCase() === c.toLowerCase() && 'ring-2 ring-primary ring-offset-1',
                )}
                style={{ backgroundColor: c }}
                onClick={() => runCommand((ed) => ed.chain().focus().setParagraphShading(c).run())}
              />
            ))}
            <input
              type="color"
              aria-label="কাস্টম প্যারা পটভূমি রং"
              title="কাস্টম রং"
              className="h-5 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
              onChange={(e) => runCommand((ed) => ed.chain().focus().setParagraphShading(e.target.value).run())}
            />
            <button
              type="button"
              className="text-[10px] text-muted-foreground underline hover:text-foreground"
              onClick={() => runCommand((ed) => ed.chain().focus().unsetParagraphShading().run())}
            >
              নেই
            </button>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-md border border-border py-1.5 text-xs text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => {
            runCommand((ed) => ed.chain().focus().resetParagraphFormatting().run());
            toast.info('প্যারার উন্নত ফরম্যাট রিসেট হয়েছে');
          }}
        >
          সব রিসেট করুন (ফাঁক + ইনডেন্ট + পটভূমি)
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────── রিবন গ্রুপ ───────────────────────

export function AdvancedTextGroup() {
  return (
    <RibbonGroup label="Advanced Text">
      <div className="flex flex-col gap-1">
        <div className="flex gap-1">
          <WordGapMenu />
          <CharGapMenu />
          <ParaSpaceMenu />
        </div>
        <div className="flex gap-1">
          <IndentButtons />
          <FirstLineMenu />
          <SpecialCharsMenu />
          <AdvancedSpacingPopover />
        </div>
      </div>
    </RibbonGroup>
  );
}
