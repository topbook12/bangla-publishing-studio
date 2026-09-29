/**
 * Review tab — word count, spelling checker, conjunct palette, auto-flow
 */

'use client';

import { useMemo, useState } from 'react';
import { Grid3x3, Pause, Search, Sigma, SpellCheck2, Square, Type, Volume2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RibbonButton, RibbonDivider, RibbonGroup, refocusActiveEditor, runCommand, useActiveEditor } from './ribbon-shell';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { useDocStats } from '@/lib/doc-stats';
import { CONJUNCTS, findConjunctWords, toBanglaNumber } from '@/lib/bangla';
import { useReadAloud } from '@/lib/read-aloud';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ConjunctPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => CONJUNCTS.filter((c) => c.char.includes(query) || c.name.includes(query)),
    [query],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label="Conjuncts">
              <Grid3x3 size={16} />
              <span className="ribbon-btn-label">Conjuncts</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Conjunct Palette</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-96 p-3"
        align="start"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <p className="mb-2 text-sm font-semibold">Conjunct Palette</p>
        <input
          className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          placeholder="Search… (e.g. ক্ষ)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="grid max-h-64 grid-cols-6 gap-1.5 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.char}
              type="button"
              title={c.name}
              className="flex h-10 items-center justify-center rounded-md border border-border bg-background text-lg transition hover:bg-accent"
              onClick={() => {
                runCommand((ed) => ed.chain().focus().insertContent(c.char).run());
              }}
            >
              {c.char}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Inserted at the cursor • {CONJUNCTS.length} total</p>
      </PopoverContent>
    </Popover>
  );
}

function ConjunctWordFinder() {
  const pages = useEditorStore((s) => s.pages);
  const [open, setOpen] = useState(false);

  const words = useMemo(() => {
    const all = new Set<string>();
    for (const page of pages) {
      if (page.kind !== 'normal' || !page.html) continue;
      const text = page.html.replace(/<[^>]*>/g, ' ');
      for (const w of findConjunctWords(text)) all.add(w);
    }
    return Array.from(all).slice(0, 200);
  }, [pages]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label="Conjunct Words">
              <Sigma size={16} />
              <span className="ribbon-btn-label">Conjunct Words</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Conjunct words in the document</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-3" align="start">
        <p className="mb-2 text-sm font-semibold">Conjunct Words ({words.length})</p>
        {words.length === 0 ? (
          <p className="text-xs text-muted-foreground">No conjunct words found yet.</p>
        ) : (
          <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
            {words.map((w) => (
              <span key={w} className="rounded-md bg-accent px-2 py-0.5 text-sm">{w}</span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">Handy for proofreading conjunct spellings.</p>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Read Aloud (পড়ে শোনানো) — প্রুফরিডিং সহায়ক: সিলেকশন বা সক্রিয় পাতার পুরো লেখা
 * ব্রাউজারের speechSynthesis দিয়ে পড়ে শোনায়। বিস্তারিত: src/lib/read-aloud.ts
 */
const READ_RATES = [0.5, 0.75, 1, 1.25, 1.5] as const;

function ReadAloudControls() {
  const ed = useActiveEditor();
  const ra = useReadAloud();
  const noEditor = !ed || ed.isDestroyed;

  const handleToggle = () => {
    if (!ed) return;
    const result = ra.toggle(ed);
    if (result === 'unsupported') toast.error('এই ব্রাউজারে পড়া সুবিধা নেই');
    else if (result === 'empty') toast.info('পড়ার মতো লেখা নেই');
  };

  return (
    <div className="flex gap-1">
      <RibbonButton
        icon={ra.speaking && !ra.paused ? Pause : Volume2}
        label="Read Aloud"
        active={ra.speaking}
        disabled={noEditor}
        title={ra.speaking ? (ra.paused ? 'আবার পড়া শুরু করুন' : 'থামিয়ে রাখুন (Pause)') : 'সিলেকশন বা পুরো পাতা পড়ে শোনান'}
        onClick={handleToggle}
      />
      <RibbonButton
        icon={Square}
        label="Stop"
        disabled={noEditor || !ra.speaking}
        title="পড়া বন্ধ করুন"
        onClick={() => ra.stop()}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={noEditor}>
          <button type="button" className="ribbon-select w-16 justify-center" title="পড়ার গতি (Speed)">
            {toBanglaNumber(ra.rate)}× <span aria-hidden="true">▾</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
        >
          {READ_RATES.map((r) => (
            <DropdownMenuItem
              key={r}
              className={cn(Math.abs(ra.rate - r) < 0.001 && 'bg-accent')}
              onClick={() => ra.setRate(r)}
            >
              {toBanglaNumber(r)}×
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ReviewTab() {
  // শেয়ার্ড ডক-স্ট্যাটস (src/lib/doc-stats) — স্টেটাস বারের সাথে একই ডিবাউন্সড
  // হিসাব ভাগ করে; প্রতি কীস্ট্রোকে দুইবার পুরো বই পার্স হত না
  const { words, chars, pages } = useDocStats();
  const autoFlow = useEditorStore((s) => s.settings.autoFlow);
  const update = useEditorStore((s) => s.updateSettings);
  const openDialog = useUiStore((s) => s.open);

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label="Statistics">
        <div className="flex items-center gap-3 px-1">
          <div className="stat-chip">
            <Type size={14} />
            <span><b>{words}</b> Words</span>
          </div>
          <div className="stat-chip">
            <span><b>{chars}</b> Characters</span>
          </div>
          <div className="stat-chip">
            <span><b>{pages}</b> Pages</span>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Spelling & Proofing">
        <div className="flex gap-1">
          <RibbonButton icon={SpellCheck2} label="Spelling" onClick={() => openDialog('review')} />
          <RibbonButton
            icon={Search}
            label="Find & Replace"
            title="সম্পূর্ণ বই জুড়ে খোঁজ ও প্রতিস্থাপন (Ctrl+F)"
            shortcut="Ctrl+F"
            onClick={() => openDialog('findReplace')}
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Conjunct Toolkit">
        <div className="flex gap-1">
          <ConjunctPalette />
          <ConjunctWordFinder />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Settings">
        <div className="flex items-center gap-2 px-2">
          <Switch
            checked={autoFlow}
            onCheckedChange={(v) => {
              update({ autoFlow: v });
              toast.success(v ? 'Auto-flow on — text flows to the next page when one fills up' : 'Auto-flow off');
            }}
            aria-label="Auto-flow"
          />
          <span className="text-xs">Auto-flow</span>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Read Aloud">
        <ReadAloudControls />
      </RibbonGroup>
    </div>
  );
}
