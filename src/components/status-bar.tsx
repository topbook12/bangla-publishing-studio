/**
 * Status bar — page/word stats, autosave indicator, zoom controls
 */

'use client';

import { Database, FileText, Maximize2, Minus, Plus, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { useDocStats } from '@/components/ribbon/review-tab';
import { toBanglaNumber } from '@/lib/bangla';

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
        <span className="status-pill">
          <FileText size={12} aria-hidden="true" />
          Page <b>{toBanglaNumber(activeIndex >= 0 ? activeIndex + 1 : 1)}</b>
          <span className="opacity-70">/ {toBanglaNumber(pages.length)}</span>
        </span>
        <span className="status-pill max-sm:hidden">
          <Type size={12} aria-hidden="true" />
          <b>{toBanglaNumber(words)}</b> Words
        </span>
        <span className="status-pill max-md:hidden">
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
