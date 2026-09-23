/**
 * ভাসমান টেবিল টুলবার — কার্সর টেবিলের ভিতরে থাকলে টেবিলের ঠিক উপরে
 * একটি কমপ্যাক্ট pill টুলবার দেখায় (Word স্টাইল)।
 *
 *  - +সারি / +কলাম / মুছুন (সারি-কলাম-টেবিল dropdown) / মার্জ / স্প্লিট /
 *    হেডার toggle / সেল ব্যাকগ্রাউন্ড রং
 *  - position: getBoundingClientRect + fixed (rAF sync — scroll/zoom-safe)
 *  - selection টেবিলের বাইরে গেলে লুকিয়ে যায়; প্রিন্টে আসে না (no-print)
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CellSelection } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';
import {
  BetweenHorizontalEnd, BetweenVerticalEnd, ChevronDown, Merge, Paintbrush, PanelTop,
  Split, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import { CELL_BG_COLORS } from './table-cell-bg';
import { cn } from '@/lib/utils';
import './media-edit.css';

interface ToolbarInfo {
  editor: Editor;
  tableEl: HTMLElement;
  cellBg: string | null;
  isHeaderActive: boolean;
  canMerge: boolean;
}

function cellBackgroundOf(ed: Editor): string | null {
  const $head = ed.state.selection.$head;
  for (let d = $head.depth; d > 0; d--) {
    const node = $head.node(d);
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      return (node.attrs.backgroundColor as string | null) ?? null;
    }
  }
  return null;
}

function resolveInfo(): ToolbarInfo | null {
  const { activePageId } = useEditorStore.getState();
  const ed = activePageId ? getEditor(activePageId) : undefined;
  if (!ed || ed.isDestroyed) return null;
  const { selection } = ed.state;

  // selection থেকে টেবিল নোড খোঁজা
  const $from = selection.$from;
  let tablePos: number | null = null;
  for (let d = $from.depth; d > 0; d--) {
    if ($from.node(d).type.name === 'table') {
      tablePos = $from.before(d);
      break;
    }
  }
  if (tablePos === null) return null;
  const dom = ed.view.nodeDOM(tablePos);
  if (!(dom instanceof HTMLElement)) return null;

  return {
    editor: ed,
    tableEl: dom,
    cellBg: cellBackgroundOf(ed),
    isHeaderActive: ed.isActive('tableHeader'),
    canMerge: selection instanceof CellSelection,
  };
}

export function TableToolbarHost({ suppressed = false }: { suppressed?: boolean }) {
  const selectionVersion = useEditorStore((s) => s.selectionVersion);
  const activePageId = useEditorStore((s) => s.activePageId);
  // Render-phase derivation — recomputed only when selection/page/suppression changes
  const info = useMemo(
    () => (suppressed ? null : resolveInfo()),
    [selectionVersion, activePageId, suppressed],
  );
  const barRef = useRef<HTMLDivElement>(null);

  // টেবিলের উপরে সেন্টারে আটকে রাখা (scroll/resize ডিবাউন্স — rAF + change detection)
  useEffect(() => {
    if (!info) return;
    let raf = 0;
    let lastKey = '';
    const sync = () => {
      const el = barRef.current;
      if (el) {
        const r = info.tableEl.getBoundingClientRect();
        if (r.width > 0 && r.height > 0 && info.tableEl.isConnected) {
          const barH = el.offsetHeight || 36;
          let top = r.top - barH - 6;
          if (top < 8) top = r.bottom + 6; // উপরে জায়গা নেই → নিচে
          const left = Math.max(60, Math.min(r.left + r.width / 2, window.innerWidth - 60));
          const key = `${Math.round(top)}|${Math.round(left)}`;
          if (key !== lastKey) {
            lastKey = key;
            el.style.top = `${top}px`;
            el.style.left = `${left}px`;
          }
        }
      }
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(raf);
  }, [info]);

  if (!info || !info.editor || info.editor.isDestroyed) return null;

  const run = (fn: (ed: Editor) => void) => {
    const ed = info.editor;
    if (ed.isDestroyed) return;
    try {
      fn(ed);
    } catch {
      /* ignore */
    }
  };

  return createPortal(
    <div
      ref={barRef}
      className="bwp-table-toolbar no-print flex items-center gap-0.5 rounded-full border border-border bg-popover/95 px-1.5 py-1 shadow-lg backdrop-blur"
      role="toolbar"
      aria-label="টেবিল টুলবার"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-full"
            aria-label="নিচে সারি যোগ করুন"
            onClick={() => run((ed) => ed.chain().focus().addRowAfter().run())}
          >
            <BetweenHorizontalEnd size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">নিচে সারি যোগ করুন</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-full"
            aria-label="ডানে কলাম যোগ করুন"
            onClick={() => run((ed) => ed.chain().focus().addColumnAfter().run())}
          >
            <BetweenVerticalEnd size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">ডানে কলাম যোগ করুন</TooltipContent>
      </Tooltip>

      {/* মুছুন — সারি / কলাম / টেবিল */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 rounded-full text-red-600"
                aria-label="মুছুন"
              >
                <Trash2 size={15} aria-hidden="true" />
                <ChevronDown size={10} aria-hidden="true" className="-ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">সারি / কলাম / টেবিল মুছুন</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().deleteRow().run())}>
            সারি মুছুন
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().deleteColumn().run())}>
            কলাম মুছুন
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => run((ed) => ed.chain().focus().deleteTable().run())}
          >
            টেবিল মুছুন
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-full"
            aria-label="সেল মার্জ"
            disabled={!info.canMerge}
            onClick={() => run((ed) => ed.chain().focus().mergeCells().run())}
          >
            <Merge size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">সেল মার্জ (একাধিক সেল সিলেক্ট করুন)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-full"
            aria-label="সেল স্প্লিট"
            onClick={() => run((ed) => ed.chain().focus().splitCell().run())}
          >
            <Split size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">সেল স্প্লিট</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className={cn('h-7 w-7 rounded-full', info.isHeaderActive && 'bg-primary/15 text-primary')}
            aria-label="হেডার সারি চালু/বন্ধ"
            aria-pressed={info.isHeaderActive}
            onClick={() => run((ed) => ed.chain().focus().toggleHeaderRow().run())}
          >
            <PanelTop size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">হেডার সারি চালু/বন্ধ</TooltipContent>
      </Tooltip>

      {/* সেল ব্যাকগ্রাউন্ড */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 rounded-full"
                aria-label="সেলের ব্যাকগ্রাউন্ড রং"
              >
                <Paintbrush size={15} aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">সেলের ব্যাকগ্রাউন্ড রং</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center" className="w-auto">
          <div className="grid grid-cols-4 gap-1 p-1">
            {CELL_BG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color === 'transparent' ? 'রং ছাড়ান' : color}
                title={color === 'transparent' ? 'রং ছাড়ান' : color}
                className={cn(
                  'h-5 w-5 rounded border border-black/20 transition hover:scale-110',
                  info.cellBg === color && 'ring-2 ring-primary ring-offset-1',
                )}
                style={
                  color === 'transparent'
                    ? { background: 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px' }
                    : { backgroundColor: color }
                }
                onClick={() =>
                  run((ed) =>
                    ed
                      .chain()
                      .focus()
                      .setCellAttribute('backgroundColor', color === 'transparent' ? null : color)
                      .run(),
                  )
                }
              />
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>,
    document.body,
  );
}
