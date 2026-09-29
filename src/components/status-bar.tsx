/**
 * Status bar — page/word stats, page jump navigation, autosave indicator, zoom controls
 */

'use client';

import { useState } from 'react';
import { ChevronUp, Database, FileText, ListOrdered, Maximize2, Minus, Plus, Ruler, Target, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { useDocStats } from '@/lib/doc-stats';
import { getGoal, setGoal, useWritingSession } from '@/lib/writing-session';
import type { WritingGoal } from '@/lib/writing-session';
import { toBanglaNumber, toEnglishDigits } from '@/lib/bangla';
import { getPageDimensionsMm, getPaperPreset } from '@/lib/paper';
import { cn } from '@/lib/utils';

/** পাতার ভিউপোর্টে স্ক্রল + অ্যাকটিভ সেট */
function jumpToPage(index: number, pageId: string): void {
  const el = document.querySelector(`.paper-page[data-page-index="${index}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  useEditorStore.getState().setActivePage(pageId);
}

function PageJumper() {
  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const activeIndex = pages.findIndex((p) => p.id === activePageId);

  const label = (p: (typeof pages)[number], i: number): string => {
    if (p.kind === 'cover') return 'প্রচ্ছদ';
    if (p.noChrome) return `পৃষ্ঠা ${toBanglaNumber(i + 1)} (হেডার ছাড়া)`;
    return `পৃষ্ঠা ${toBanglaNumber(i + 1)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="status-pill cursor-pointer hover:bg-accent/60 transition-colors"
          title="যেকোনো পাতায় যান"
          aria-label="Page navigation"
        >
          <FileText size={12} aria-hidden="true" />
          Page <b>{toBanglaNumber(activeIndex >= 0 ? activeIndex + 1 : 1)}</b>
          <span className="opacity-70">/ {toBanglaNumber(pages.length)}</span>
          <ListOrdered size={11} className="ml-0.5 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">পাতায় যান</DropdownMenuLabel>
        {pages.map((p, i) => (
          <DropdownMenuItem
            key={p.id}
            onClick={() => jumpToPage(i, p.id)}
            className={cn(p.id === activePageId && 'bg-primary/10')}
          >
            <span className="flex-1 truncate">{label(p, i)}</span>
            {p.id === activePageId ? <ChevronUp size={12} className="rotate-180 opacity-50" aria-hidden="true" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** লেখার লক্ষ্য ও সেশন-হিসাব পিল — পপওভারে প্রোগ্রেস + লক্ষ্য এডিটর */
function GoalPill() {
  const { sessionWords, wpm, sessionMinutes, progressPct } = useWritingSession();
  const goal = getGoal();
  const words = useDocStats().words;
  const pagesCount = useEditorStore((s) => s.pages.length);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<WritingGoal['type']>('words');
  const [target, setTarget] = useState('');

  // পপওভার খুললে এডিটর-ফর্মে চলতি লক্ষ্য বসানো
  const handleOpenChange = (v: boolean): void => {
    if (v) {
      const g = getGoal();
      setType(g?.type ?? 'words');
      setTarget(g ? String(g.target) : '');
    }
    setOpen(v);
  };

  const saveGoal = (): void => {
    // বাংলা ডিজিটেও লেখা যায় (৫০০০ → 5000)
    const n = Math.floor(Number(toEnglishDigits(target.trim())));
    if (!Number.isFinite(n) || n <= 0) return;
    setGoal({ type, target: n });
    setOpen(false);
  };

  const clearGoal = (): void => {
    setGoal(null);
    setTarget('');
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="status-pill max-lg:hidden cursor-pointer transition-colors hover:bg-accent/60"
          aria-label="Writing goal and session stats"
          title="লেখার লক্ষ্য ও সেশন"
        >
          <Target size={12} aria-hidden="true" />
          {goal ? (
            <><b>{toBanglaNumber(Math.round(progressPct))}%</b><span className="opacity-70">লক্ষ্য পূর্ণ</span></>
          ) : (
            <span>লক্ষ্য নির্ধারণ</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        {/* লক্ষ্য প্রোগ্রেস */}
        {goal ? (
          <div className="space-y-1.5">
            <Progress value={progressPct} className="h-2" aria-label="লক্ষ্য অগ্রগতি" />
            <p className="text-[11px] text-muted-foreground">
              {goal.type === 'words'
                ? <>মোট <b className="text-foreground">{toBanglaNumber(words)}</b> শব্দ · লক্ষ্য {toBanglaNumber(goal.target)} শব্দ</>
                : <>মোট <b className="text-foreground">{toBanglaNumber(pagesCount)}</b> পৃষ্ঠা · লক্ষ্য {toBanglaNumber(goal.target)} পৃষ্ঠা</>}
            </p>
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            প্রতিদিন/প্রতি সেশনে কত লিখবেন — লক্ষ্য ঠিক করে নিন, অগ্রগতি এখানেই দেখা যাবে।
          </p>
        )}

        {/* সেশন-হিসাব মিনি-কার্ড */}
        <div className="session-stats-card mt-3" role="status">
          <p className="text-[11px] leading-relaxed text-foreground/90">
            এই সেশন: <b className="text-primary">+{toBanglaNumber(sessionWords)}</b> শব্দ ·{' '}
            {toBanglaNumber(Math.round(wpm))} শব্দ/মিনিট · {toBanglaNumber(Math.floor(sessionMinutes))} মিনিট
          </p>
        </div>

        {/* লক্ষ্য এডিটর */}
        <div className="mt-3 space-y-2">
          <div className="flex overflow-hidden rounded-md border" role="group" aria-label="লক্ষ্যের ধরন">
            <button
              type="button"
              aria-pressed={type === 'words'}
              onClick={() => setType('words')}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs font-medium transition-colors',
                type === 'words' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60',
              )}
            >
              শব্দ
            </button>
            <button
              type="button"
              aria-pressed={type === 'pages'}
              onClick={() => setType('pages')}
              className={cn(
                'flex-1 border-l px-2 py-1.5 text-xs font-medium transition-colors',
                type === 'pages' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60',
              )}
            >
              পৃষ্ঠা
            </button>
          </div>
          <Input
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveGoal();
            }}
            placeholder={type === 'words' ? 'যেমন: ৫০০০ শব্দ' : 'যেমন: ৫০ পৃষ্ঠা'}
            aria-label="লক্ষ্যের সংখ্যা"
            className="h-8 text-[12px]"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 flex-1 text-xs" disabled={!target.trim()} onClick={saveGoal}>
              সেভ
            </Button>
            {goal ? (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={clearGoal}>
                মুছুন
              </Button>
            ) : null}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** বর্তমান ট্রিম-সাইজ (ছাপাখানার কাগজের মাপ) — প্রো প্রেস রেফারেন্স */
function TrimSizePill() {
  const settings = useEditorStore((s) => s.settings);
  const preset = getPaperPreset(settings.paperSize);
  const { widthMm, heightMm } = getPageDimensionsMm(
    settings.paperSize,
    settings.orientation,
    settings.customPaper,
  );
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="status-pill max-xl:hidden" title={`${preset.name} — ${preset.note}`}>
          <Ruler size={12} aria-hidden="true" />
          <b>{toBanglaNumber(Math.round(widthMm))}×{toBanglaNumber(Math.round(heightMm))}</b>
          <span className="opacity-70">মিমি</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-center">
        <p className="font-semibold">{preset.name}</p>
        <p className="text-[10px] opacity-80">{preset.note}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function StatusBar() {
  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const { words } = useDocStats();

  const activeIndex = pages.findIndex((p) => p.id === activePageId);

  return (
    <footer className="status-bar no-print" role="contentinfo">
      <div className="flex min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <PageJumper />
        <button
          type="button"
          className="status-pill cursor-pointer transition-colors hover:bg-accent/60 max-sm:hidden"
          title="আগের পাতা"
          aria-label="Previous page"
          disabled={activeIndex <= 0}
          onClick={() => {
            if (activeIndex > 0) jumpToPage(activeIndex - 1, pages[activeIndex - 1].id);
          }}
        >
          ↑
        </button>
        <button
          type="button"
          className="status-pill cursor-pointer transition-colors hover:bg-accent/60 max-sm:hidden"
          title="পরের পাতা"
          aria-label="Next page"
          disabled={activeIndex < 0 || activeIndex >= pages.length - 1}
          onClick={() => {
            if (activeIndex < pages.length - 1) jumpToPage(activeIndex + 1, pages[activeIndex + 1].id);
          }}
        >
          ↓
        </button>
        <span className="status-pill max-md:hidden">
          <Type size={12} aria-hidden="true" />
          <b>{toBanglaNumber(words)}</b> Words
        </span>
        <GoalPill />
        <span className="status-pill max-lg:hidden">
          <Database size={12} aria-hidden="true" />
          AutoSave · IndexedDB
          <span className="status-dot" aria-hidden="true" />
        </span>
        <TrimSizePill />
      </div>
      <div className="flex shrink-0 items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 max-md:h-11 max-md:w-11"
              aria-label="Zoom out"
              title="Zoom out"
              onClick={() => setZoom(zoom - 0.1)}
            >
              <Minus size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Zoom Out</TooltipContent>
        </Tooltip>
        <span className="w-12 text-center text-[11px] font-medium tabular-nums">
          {toBanglaNumber(Math.round(zoom * 100))}%
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 max-md:h-11 max-md:w-11"
              aria-label="Zoom in"
              title="Zoom in"
              onClick={() => setZoom(zoom + 0.1)}
            >
              <Plus size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Zoom In</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 max-md:h-11 max-md:w-11"
              aria-label="Reset zoom to 100%"
              title="Reset zoom to 100%"
              onClick={() => setZoom(1)}
            >
              <Maximize2 size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">Reset to 100%</TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
}
