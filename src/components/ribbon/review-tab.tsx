/**
 * Review tab — word count, spelling checker, conjunct palette, auto-flow
 */

'use client';

import { useMemo, useState } from 'react';
import { ArrowLeftRight, Grid3x3, Pause, Search, Sigma, SpellCheck2, Square, Type, Volume2, ScanEye } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RibbonButton, RibbonDivider, RibbonGroup, refocusActiveEditor, runCommand, useActiveEditor } from './ribbon-shell';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { getEditor } from '@/lib/editor-registry';
import { openAiBubble } from '@/lib/ai-bubble-store';
import { useDocStats } from '@/lib/doc-stats';
import { CONJUNCTS, findConjunctWords, toBanglaNumber } from '@/lib/bangla';
import { useReadAloud } from '@/lib/read-aloud';
import { t, useT, useFmtNum, tplNodes } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function ConjunctPalette() {
  const tt = useT();
  const f = useFmtNum();
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
            <button type="button" className="ribbon-btn" aria-label={tt('rev.conjuncts')}>
              <Grid3x3 size={16} />
              <span className="ribbon-btn-label">{tt('rev.conjuncts')}</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('rev.conjunctPalette')}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-96 p-3"
        align="start"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <p className="mb-2 text-sm font-semibold">{tt('rev.conjunctPalette')}</p>
        <input
          className="mb-2 w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
          placeholder={tt('rev.searchPh')}
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
        <p className="mt-2 text-xs text-muted-foreground">{tt('rev.conjunctTotal').split('{n}').join(f(CONJUNCTS.length))}</p>
      </PopoverContent>
    </Popover>
  );
}

function ConjunctWordFinder() {
  const tt = useT();
  const f = useFmtNum();
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
            <button type="button" className="ribbon-btn" aria-label={tt('rev.conjunctWords')}>
              <Sigma size={16} />
              <span className="ribbon-btn-label">{tt('rev.conjunctWords')}</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('rev.conjunctWordsTip')}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-3" align="start">
        <p className="mb-2 text-sm font-semibold">{tt('rev.conjunctWordsCount').split('{n}').join(f(words.length))}</p>
        {words.length === 0 ? (
          <p className="text-xs text-muted-foreground">{tt('rev.noConjuncts')}</p>
        ) : (
          <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
            {words.map((w) => (
              <span key={w} className="rounded-md bg-accent px-2 py-0.5 text-sm">{w}</span>
            ))}
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">{tt('rev.conjunctHint')}</p>
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
  const tt = useT();
  const ed = useActiveEditor();
  const ra = useReadAloud();
  const noEditor = !ed || ed.isDestroyed;

  const handleToggle = () => {
    if (!ed) return;
    const result = ra.toggle(ed);
    if (result === 'unsupported') toast.error(t('rev.ra.unsupported', 'Read-aloud is not supported in this browser'));
    else if (result === 'empty') toast.info(t('rev.ra.empty', 'No text to read aloud'));
  };

  return (
    <div className="flex gap-1">
      <RibbonButton
        icon={ra.speaking && !ra.paused ? Pause : Volume2}
        label={tt('rev.ra.label')}
        active={ra.speaking}
        disabled={noEditor}
        title={ra.speaking ? (ra.paused ? tt('rev.ra.resume') : tt('rev.ra.pause')) : tt('rev.ra.tip')}
        onClick={handleToggle}
      />
      <RibbonButton
        icon={Square}
        label={tt('rev.ra.stop')}
        disabled={noEditor || !ra.speaking}
        title={tt('rev.ra.stopTip')}
        onClick={() => ra.stop()}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={noEditor}>
          <button type="button" className="ribbon-select w-16 justify-center" title={tt('rev.ra.speedTip')}>
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
  const tt = useT();
  const f = useFmtNum();
  const { words, chars, pages } = useDocStats();
  const autoFlow = useEditorStore((s) => s.settings.autoFlow);
  const update = useEditorStore((s) => s.updateSettings);
  const openDialog = useUiStore((s) => s.open);

  /** AI যাচাই — পুরো পেজ প্রেক্ষাপটে যাচাই-মোডসহ AI বাবল খোলা */
  const openAiPageCheck = () => {
    const { activePageId } = useEditorStore.getState();
    const ed = activePageId ? getEditor(activePageId) : null;
    if (!ed || ed.isDestroyed) {
      toast.error(t('ai.noEditor', 'No active editor'));
      return;
    }
    openAiBubble({
      editor: ed,
      x: Math.max(16, Math.round((window.innerWidth - 392) / 2)),
      y: 132,
      mode: 'verify',
      scope: 'page',
    });
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label={tt('rev.group.stats')} accent="statistics">
        <div className="flex items-center gap-3 px-1">
          <div className="stat-chip">
            <Type size={14} />
            <span>{tplNodes(tt('rev.words'), { n: <b>{f(words)}</b> })}</span>
          </div>
          <div className="stat-chip">
            <span>{tplNodes(tt('rev.chars'), { n: <b>{f(chars)}</b> })}</span>
          </div>
          <div className="stat-chip">
            <span>{tplNodes(tt('rev.pages'), { n: <b>{f(pages)}</b> })}</span>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('rev.group.proofing')} accent="spelling & proofing">
        <div className="flex gap-1">
          <RibbonButton icon={SpellCheck2} label={tt('rev.spelling')} onClick={() => openDialog('review')} />
          <RibbonButton
            icon={Search}
            label={tt('rev.findReplace')}
            title={tt('rev.findReplaceTip')}
            shortcut="Ctrl+F"
            onClick={() => openDialog('findReplace')}
          />
          <RibbonButton
            icon={ScanEye}
            label={tt('rev.aiCheck')}
            title={tt('rev.aiCheckTip')}
            onClick={openAiPageCheck}
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('rev.group.kruti')} accent="kruti dev tools">
        <RibbonButton
          icon={ArrowLeftRight}
          label={tt('rev.kruti')}
          title={tt('rev.krutiTip')}
          onClick={() => openDialog('krutiConverter')}
        />
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('rev.group.conjunct')} accent="conjunct toolkit">
        <div className="flex gap-1">
          <ConjunctPalette />
          <ConjunctWordFinder />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('rev.group.settings')} accent="settings">
        <div className="flex items-center gap-2 px-2">
          <Switch
            checked={autoFlow}
            onCheckedChange={(v) => {
              update({ autoFlow: v });
              toast.success(v ? t('rev.autoflow.on', 'Auto-flow on — text flows to the next page when one fills up') : t('rev.autoflow.off', 'Auto-flow off'));
            }}
            aria-label={tt('rev.autoflow')}
          />
          <span className="text-xs">{tt('rev.autoflow')}</span>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('rev.group.readaloud')} accent="read aloud">
        <ReadAloudControls />
      </RibbonGroup>
    </div>
  );
}
