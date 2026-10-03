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
import { tFmt, useFmtNum, useT } from '@/lib/i18n';
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
  const tt = useT();
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
        {tt('adv.preview.sample')}
      </p>
    </div>
  );
}

// ─────────────────────── Word Gap (শব্দের ফাঁক) ───────────────────────

const WORD_GAP_PRESETS: Array<{ v: string | null; key: string }> = [
  { v: null, key: 'adv.preset.default' },
  { v: '-1px', key: 'adv.wordgap.tight' },
  { v: '1px', key: 'adv.wordgap.1' },
  { v: '2px', key: 'adv.wordgap.2' },
  { v: '3px', key: 'adv.wordgap.3' },
  { v: '5px', key: 'adv.wordgap.5' },
  { v: '8px', key: 'adv.wordgap.8' },
  { v: '0.12em', key: 'adv.wordgap.book' },
  { v: '0.25em', key: 'adv.wordgap.booklg' },
];

function WordGapMenu() {
  const a = useBlockAttrs();
  const tt = useT();
  const fmtN = useFmtNum();
  const cur = a.wordSpacing ?? null;
  const triggerLabel = cur ? `${tt('adv.wordgap')} · ${fmtN(numOf(cur) ?? 0)}` : tt('adv.wordgap');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('ribbon-btn', cur && 'ribbon-btn-active')} aria-label={tt('adv.wordgap')}>
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
        <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('adv.wordgap.label')}</DropdownMenuLabel>
        {WORD_GAP_PRESETS.map((p) => (
          <DropdownMenuItem
            key={p.key}
            className={cn((p.v ?? null) === cur && 'bg-accent')}
            onClick={() => runCommand((ed) => {
              if (p.v === null) ed.chain().focus().unsetWordSpacing().run();
              else ed.chain().focus().setWordSpacing(p.v).run();
            })}
          >
            {tt(p.key)}
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
  const tt = useT();
  const fmtN = useFmtNum();
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
        <button type="button" className={cn('ribbon-btn', (cur || selCur) && 'ribbon-btn-active')} aria-label={tt('adv.chargap')}>
          <Type size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{cur ? `${tt('adv.chargap')} · ${fmtN(numOf(cur) ?? 0)}` : tt('adv.chargap')}</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('adv.chargap.para')}</DropdownMenuLabel>
        {[
          { v: null, label: tt('adv.normal') },
          { v: '-0.5px', label: tt('adv.chargap.tight') },
          { v: '0.5px', label: tt('adv.chargap.wide') },
          { v: '1px', label: tt('adv.chargap.1') },
          { v: '2px', label: tt('adv.chargap.2') },
        ].map((p) => (
          <DropdownMenuItem key={`p-${p.label}`} className={cn((p.v ?? null) === cur && 'bg-accent')} onClick={() => setPara(p.v)}>
            {p.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('adv.chargap.sel')}</DropdownMenuLabel>
        {[
          { v: null, label: tt('adv.normal') },
          { v: '-0.5px', label: tt('adv.chargap.tight') },
          { v: '0.5px', label: tt('adv.chargap.wide') },
          { v: '1px', label: tt('adv.chargap.1') },
          { v: '2px', label: tt('adv.chargap.2') },
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
  const tt = useT();
  const active = a.spaceBefore != null || a.spaceAfter != null;

  const presets = [
    { label: tt('adv.preset.default'), before: null as string | null, after: null as string | null },
    { label: tt('adv.paragap.tight'), before: '3pt', after: '3pt' },
    { label: tt('adv.paragap.medium'), before: '6pt', after: '6pt' },
    { label: tt('adv.paragap.loose'), before: '12pt', after: '12pt' },
    { label: tt('adv.paragap.chapter'), before: '24pt', after: null },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={cn('ribbon-btn', active && 'ribbon-btn-active')} aria-label={tt('adv.paragap')}>
          <AlignVerticalSpaceAround size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{active ? `${tt('adv.paragap')} ✓` : tt('adv.paragap')}</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-60"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('adv.paragap.label')}</DropdownMenuLabel>
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
  const tt = useT();
  return (
    <>
      <RibbonButton
        icon={IndentIncrease}
        label={tt('adv.indent')}
        title={tt('adv.indent.tip')}
        onClick={() => runCommand((ed) => ed.chain().focus().adjustIndent('indentLeft', 0.5).run())}
      />
      <RibbonButton
        icon={IndentDecrease}
        label={tt('adv.outdent')}
        title={tt('adv.outdent.tip')}
        onClick={() => runCommand((ed) => ed.chain().focus().adjustIndent('indentLeft', -0.5).run())}
      />
    </>
  );
}

function FirstLineMenu() {
  const a = useBlockAttrs();
  const tt = useT();
  const fmtN = useFmtNum();
  const cur = a.firstLineIndent ?? null;
  const presets = [
    { v: null, label: tt('adv.none') },
    { v: '0.5em', label: tt('adv.firstline.05') },
    { v: '1em', label: tt('adv.firstline.1') },
    { v: '1.25em', label: tt('adv.firstline.125') },
    { v: '1.5em', label: tt('adv.firstline.15') },
    { v: '2em', label: tt('adv.firstline.2') },
  ];

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn('ribbon-select w-24 justify-center', cur && 'ring-1 ring-primary')} title={tt('adv.firstline')}>
              {cur ? `${tt('adv.firstline.short')} ${fmtN(numOf(cur) ?? 0)}` : tt('adv.firstline.short')} <span aria-hidden="true">▾</span>
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('adv.firstline.tip')}</TooltipContent>
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

const CHAR_GROUPS: Array<{ key: string; chars: Array<{ ch: string; key: string }> }> = [
  {
    key: 'adv.chargroup.bangla',
    chars: [
      { ch: '।', key: 'adv.char.dari' },
      { ch: '॥', key: 'adv.char.daridari' },
      { ch: '৳', key: 'adv.char.taka' },
      { ch: 'ঽ', key: 'adv.char.avagraha' },
    ],
  },
  {
    key: 'adv.chargroup.dashes',
    chars: [
      { ch: '-', key: 'adv.char.hyphen' },
      { ch: '–', key: 'adv.char.endash' },
      { ch: '—', key: 'adv.char.emdash' },
      { ch: '…', key: 'adv.char.ellipsis' },
      { ch: '‘', key: 'adv.char.quotel' },
      { ch: '’', key: 'adv.char.quoter' },
      { ch: '“', key: 'adv.char.dquotel' },
      { ch: '”', key: 'adv.char.dquoter' },
    ],
  },
  {
    key: 'adv.chargroup.spaces',
    chars: [
      { ch: '\u00A0', key: 'adv.char.nbsp' },
      { ch: '\u200B', key: 'adv.char.zwsp' },
      { ch: '\u200C', key: 'adv.char.zwnj' },
      { ch: '\u200D', key: 'adv.char.zwj' },
      { ch: '\u00AD', key: 'adv.char.shy' },
    ],
  },
  {
    key: 'adv.chargroup.other',
    chars: [
      { ch: '•', key: 'adv.char.bullet' },
      { ch: '×', key: 'adv.char.times' },
      { ch: '÷', key: 'adv.char.divide' },
      { ch: '±', key: 'adv.char.plusminus' },
      { ch: '°', key: 'adv.char.degree' },
      { ch: '©', key: 'adv.char.copyright' },
      { ch: '®', key: 'adv.char.registered' },
      { ch: '™', key: 'adv.char.trademark' },
    ],
  },
];

function SpecialCharsMenu() {
  const tt = useT();
  const insert = (ch: string, label: string) => runCommand((ed) => {
    ed.chain().focus().insertContent(ch).run();
    if (/^[\u200B-\u200D\u00AD\u00A0]$/.test(ch)) {
      toast.info(tFmt('adv.char.inserted', { c: label }));
    }
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-btn" aria-label={tt('adv.specialchars')}>
          <Omega size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{tt('adv.symbols')}</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-64"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        {CHAR_GROUPS.map((g, gi) => (
          <div key={g.key}>
            {gi > 0 ? <DropdownMenuSeparator /> : null}
            <DropdownMenuLabel className="text-xs text-muted-foreground">{tt(g.key)}</DropdownMenuLabel>
            <div className="grid grid-cols-4 gap-1 px-1 pb-1">
              {g.chars.map((c) => {
                const label = tt(c.key);
                return (
                  <button
                    key={c.key}
                    type="button"
                    title={label}
                    aria-label={label}
                    onClick={() => insert(c.ch, label)}
                    className="flex h-8 items-center justify-center rounded-md border border-border text-base transition hover:bg-accent hover:scale-105"
                  >
                    {/^[\u200B-\u200D\u00AD]$/.test(c.ch) ? <span className="text-[9px] text-muted-foreground">{c.ch === '\u200C' ? 'ZWNJ' : c.ch === '\u200D' ? 'ZWJ' : c.ch === '\u00AD' ? 'H-' : '␣'}</span> : c.ch}
                  </button>
                );
              })}
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
  const tt = useT();
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
            <button type="button" className="ribbon-btn" aria-label={tt('adv.spacing.aria')}>
              <SlidersHorizontal size={16} aria-hidden="true" />
              <span className="ribbon-btn-label">{tt('adv.spacing')}</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('adv.spacing.tip')}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="max-h-[70vh] w-80 space-y-2.5 overflow-y-auto p-3"
        align="start"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <ParaPreview a={a} />

        <PopField label={tt('adv.pop.wordgap')}>
          <MiniNum
            value={num('wordSpacing')}
            min={-5}
            max={30}
            ariaLabel={tt('adv.pop.wordgap')}
            onCommit={(v) => setLen('wordSpacing', v)}
          />
          <span className="text-[10px] text-muted-foreground">{unit('wordSpacing')}</span>
        </PopField>

        <PopField label={tt('adv.pop.chargap')}>
          <MiniNum
            value={num('letterSpacing')}
            min={-3}
            max={20}
            step={0.5}
            ariaLabel={tt('adv.pop.chargap')}
            onCommit={(v) => setLen('letterSpacing', v)}
          />
          <span className="text-[10px] text-muted-foreground">px</span>
        </PopField>

        <PopField label={tt('adv.pop.before')}>
          <MiniNum value={num('spaceBefore')} max={72} ariaLabel={tt('adv.pop.before')} onCommit={(v) => setPt('spaceBefore', v)} />
        </PopField>

        <PopField label={tt('adv.pop.after')}>
          <MiniNum value={num('spaceAfter')} max={72} ariaLabel={tt('adv.pop.after')} onCommit={(v) => setPt('spaceAfter', v)} />
        </PopField>

        <PopField label={tt('adv.pop.firstline')}>
          <MiniNum value={num('firstLineIndent')} max={5} step={0.25} ariaLabel={tt('adv.firstline')} onCommit={(v) => setLen('firstLineIndent', v)} />
        </PopField>

        <PopField label={tt('adv.pop.left')}>
          <MiniNum value={num('indentLeft')} max={8} step={0.25} ariaLabel={tt('adv.pop.left')} onCommit={(v) => setLen('indentLeft', v)} />
        </PopField>

        <PopField label={tt('adv.pop.right')}>
          <MiniNum value={num('indentRight')} max={8} step={0.25} ariaLabel={tt('adv.pop.right')} onCommit={(v) => setLen('indentRight', v)} />
        </PopField>

        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">{tt('adv.pop.shading')}</p>
          <div className="flex flex-wrap items-center gap-1.5">
            {COLOR_SWATCHES.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`${tt('adv.pop.shading.swatch')} ${c}`}
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
              aria-label={tt('adv.pop.shading.custom')}
              title={tt('adv.pop.colorcustom')}
              className="h-5 w-7 cursor-pointer rounded border border-border bg-transparent p-0"
              onChange={(e) => runCommand((ed) => ed.chain().focus().setParagraphShading(e.target.value).run())}
            />
            <button
              type="button"
              className="text-[10px] text-muted-foreground underline hover:text-foreground"
              onClick={() => runCommand((ed) => ed.chain().focus().unsetParagraphShading().run())}
            >
              {tt('adv.none')}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="w-full rounded-md border border-border py-1.5 text-xs text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950"
          onClick={() => {
            runCommand((ed) => ed.chain().focus().resetParagraphFormatting().run());
            toast.info(tt('adv.pop.reset.toast'));
          }}
        >
          {tt('adv.pop.reset')}
        </button>
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────── রিবন গ্রুপ ───────────────────────

export function AdvancedTextGroup() {
  const tt = useT();
  return (
    <RibbonGroup label={tt('adv.group.title')} accent="advanced text">
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
