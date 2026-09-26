/**
 * Status bar — page/word stats, page jump navigation, autosave indicator, zoom controls
 */

'use client';

import { ChevronUp, Database, FileText, ListOrdered, Maximize2, Minus, Plus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { useDocStats } from '@/components/ribbon/review-tab';
import { toBanglaNumber } from '@/lib/bangla';
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
        <span className="status-pill max-lg:hidden">
          <Database size={12} aria-hidden="true" />
          AutoSave · IndexedDB
          <span className="status-dot" aria-hidden="true" />
        </span>
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
