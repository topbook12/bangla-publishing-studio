/**
 * Status bar — page/word stats, page jump navigation, autosave indicator, zoom controls
 */

'use client';

import { useState } from 'react';
import { Check, ChevronUp, Database, FileText, ListOrdered, Maximize2, Minus, Plus, Ruler, Target, Type } from 'lucide-react';
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
import { toEnglishDigits } from '@/lib/bangla';
import { useT, useFmtNum, tplNodes } from '@/lib/i18n';
import { getPageDimensionsMm, getPaperPreset } from '@/lib/paper';
import { cn } from '@/lib/utils';

/** পাতার ভিউপোর্টে স্ক্রল + অ্যাকটিভ সেট */
function jumpToPage(index: number, pageId: string): void {
  const el = document.querySelector(`.paper-page[data-page-index="${index}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  useEditorStore.getState().setActivePage(pageId);
}

function PageJumper() {
  const tt = useT();
  const f = useFmtNum();
  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const activeIndex = pages.findIndex((p) => p.id === activePageId);

  const label = (p: (typeof pages)[number], i: number): string => {
    if (p.kind === 'cover') return tt('st.page.cover');
    if (p.noChrome) return tt('st.page.nochrome').split('{n}').join(f(i + 1));
    return `${tt('st.page')} ${f(i + 1)}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="status-pill cursor-pointer hover:bg-accent/60 transition-colors"
          title={tt('st.page.jump')}
          aria-label={tt('st.page.goto')}
        >
          <FileText size={12} aria-hidden="true" />
          {tt('st.page')} <b>{f(activeIndex >= 0 ? activeIndex + 1 : 1)}</b>
          <span className="opacity-70">/ {f(pages.length)}</span>
          <ListOrdered size={11} className="ml-0.5 opacity-60" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-52 overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('st.page.goto')}</DropdownMenuLabel>
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
  const tt = useT();
  const f = useFmtNum();
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
          aria-label={tt('st.goal.title')}
          title={tt('st.goal.title')}
        >
          <Target size={12} aria-hidden="true" />
          {goal ? (
            <><b>{f(Math.round(progressPct))}%</b><span className="opacity-70">{tt('st.goal.reached')}</span></>
          ) : (
            <span>{tt('st.goal.set')}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        {/* লক্ষ্য প্রোগ্রেস */}
        {goal ? (
          <div className="space-y-1.5">
            <Progress value={progressPct} className="h-2" aria-label={tt('st.goal.progress')} />
            <p className="text-[11px] text-muted-foreground">
              {goal.type === 'words'
                ? tplNodes(tt('st.goal.ofWords'), {
                    a: <b className="text-foreground">{f(words)}</b>,
                    b: f(goal.target),
                  })
                : tplNodes(tt('st.goal.ofPages'), {
                    a: <b className="text-foreground">{f(pagesCount)}</b>,
                    b: f(goal.target),
                  })}
            </p>
          </div>
        ) : (
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            {tt('st.goal.hint')}
          </p>
        )}

        {/* সেশন-হিসাব মিনি-কার্ড */}
        <div className="session-stats-card mt-3" role="status">
          <p className="text-[11px] leading-relaxed text-foreground/90">
            {tt('st.session.label')}: <b className="text-primary">+{f(sessionWords)}</b> {tt('st.goal.type.words')} ·{' '}
            {f(Math.round(wpm))} {tt('st.session.wpm')} · {f(Math.floor(sessionMinutes))} {tt('st.session.min')}
          </p>
        </div>

        {/* লক্ষ্য এডিটর */}
        <div className="mt-3 space-y-2">
          <div className="flex overflow-hidden rounded-md border" role="group" aria-label={tt('st.goal.set')}>
            <button
              type="button"
              aria-pressed={type === 'words'}
              onClick={() => setType('words')}
              className={cn(
                'flex-1 px-2 py-1.5 text-xs font-medium transition-colors',
                type === 'words' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent/60',
              )}
            >
              {tt('st.goal.type.words')}
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
              {tt('st.goal.type.pages')}
            </button>
          </div>
          <Input
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') saveGoal();
            }}
            placeholder={type === 'words' ? tt('st.goal.ph.words') : tt('st.goal.ph.pages')}
            aria-label={tt('st.goal.count')}
            className="h-8 text-[12px]"
          />
          <div className="flex gap-2">
            <Button size="sm" className="h-8 flex-1 text-xs" disabled={!target.trim()} onClick={saveGoal}>
              {tt('hdr.save')}
            </Button>
            {goal ? (
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={clearGoal}>
                {tt('st.clear')}
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
  const tt = useT();
  const f = useFmtNum();
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
          <b>{f(Math.round(widthMm))}×{f(Math.round(heightMm))}</b>
          <span className="opacity-70">{tt('st.mm')}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-56 text-center">
        <p className="font-semibold">{preset.name}</p>
        <p className="text-[10px] opacity-80">{preset.note}</p>
      </TooltipContent>
    </Tooltip>
  );
}

/** জুম প্রিসেট (%) — Word-এর স্ট্যান্ডার্ড মান */
const ZOOM_PRESETS = [50, 75, 90, 100, 110, 125, 150, 175, 200];

function ZoomPresets() {
  const tt = useT();
  const f = useFmtNum();
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const pct = Math.round(zoom * 100);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="status-pill cursor-pointer transition-colors hover:bg-accent/60"
          title={tt('st.zoom.tip')}
          aria-label={tt('st.zoom.presets')}
        >
          <b>{f(pct)}%</b>
          <span className="sr-only">{tt('st.zoom.presets')}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-72 w-36 overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('st.zoom.presets')}</DropdownMenuLabel>
        {ZOOM_PRESETS.map((z) => (
          <DropdownMenuItem
            key={z}
            onClick={() => setZoom(z / 100)}
            className={cn(Math.abs(pct - z) < 1 && 'bg-primary/10')}
            aria-pressed={Math.abs(pct - z) < 1}
          >
            <span className="flex-1 tabular-nums">{f(z)}%</span>
            {Math.abs(pct - z) < 1 ? <Check size={13} className="text-emerald-600" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StatusBar() {
  const tt = useT();
  const f = useFmtNum();
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
          title={tt('st.prev')}
          aria-label={tt('st.prev')}
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
          title={tt('st.next')}
          aria-label={tt('st.next')}
          disabled={activeIndex < 0 || activeIndex >= pages.length - 1}
          onClick={() => {
            if (activeIndex < pages.length - 1) jumpToPage(activeIndex + 1, pages[activeIndex + 1].id);
          }}
        >
          ↓
        </button>
        <span className="status-pill max-md:hidden">
          <Type size={12} aria-hidden="true" />
          <b>{f(words)}</b> {tt('st.words')}
        </span>
        <GoalPill />
        <span className="status-pill max-lg:hidden">
          <Database size={12} aria-hidden="true" />
          {tt('st.autosave')}
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
              aria-label={tt('st.zoom.out')}
              title={tt('st.zoom.out')}
              onClick={() => setZoom(zoom - 0.1)}
            >
              <Minus size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{tt('st.zoom.out')}</TooltipContent>
        </Tooltip>
        <ZoomPresets />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 max-md:h-11 max-md:w-11"
              aria-label={tt('st.zoom.in')}
              title={tt('st.zoom.in')}
              onClick={() => setZoom(zoom + 0.1)}
            >
              <Plus size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{tt('st.zoom.in')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 max-md:h-11 max-md:w-11"
              aria-label={tt('st.zoom.reset')}
              title={tt('st.zoom.reset')}
              onClick={() => setZoom(1)}
            >
              <Maximize2 size={13} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{tt('st.zoom.reset')}</TooltipContent>
        </Tooltip>
      </div>
    </footer>
  );
}
