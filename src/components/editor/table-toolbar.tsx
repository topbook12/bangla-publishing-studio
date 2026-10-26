/**
 * ভাসমান টেবিল টুলবার — কার্সর টেবিলের ভিতরে থাকলে টেবিলের ঠিক উপরে
 * একটি কমপ্যাক্ট pill টুলবার দেখায় (Word স্টাইল)।
 *
 * দিন ১২ — প্রো-সম্প্রসারণ:
 *  - +সারি (উপরে/নিচে), +কলাম (বামে/ডানে) ড্রপডাউন
 *  - সিলেক্ট ড্রপডাউন (সারি/কলাম সিলেক্ট → CellSelection তৈরি হয়, মার্জ সহজ)
 *  - মুছুন (সারি-কলাম-টেবিল dropdown) / মার্জ / স্প্লিট
 *  - ভার্টিক্যাল অ্যালাইন (উপরে/মাঝ/নিচে — data-v-align attr)
 *  - হেডার সারি + হেডার কলাম toggle
 *  - বর্ডার dropdown (বর্ডারহীন সেল / বর্ডার ফেরত — data-border attr)
 *  - সেল ব্যাকগ্রাউন্ড রং
 *  - position: getBoundingClientRect + fixed (rAF sync — scroll/zoom-safe)
 *  - selection টেবিলের বাইরে গেলে লুকিয়ে যায়; প্রিন্টে আসে না (no-print)
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { CellSelection } from '@tiptap/pm/tables';
import type { Editor } from '@tiptap/react';
import {
  AlignCenterVertical, AlignEndVertical, AlignStartVertical, BetweenHorizontalEnd, BetweenHorizontalStart,
  BetweenVerticalEnd, BetweenVerticalStart, ChevronDown, Grid2x2, Grid2x2X, Merge, Paintbrush, PanelLeft,
  PanelTop, SquareDashedMousePointer, Split, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import { useT } from '@/lib/i18n';
import { CELL_BG_COLORS } from './table-cell-bg';
import { cn } from '@/lib/utils';
import './media-edit.css';

interface ToolbarInfo {
  editor: Editor;
  tableEl: HTMLElement;
  cellBg: string | null;
  isHeaderActive: boolean;
  canMerge: boolean;
  vAlign: string | null;
  borderless: boolean;
}

function cellAttrsOf(ed: Editor): { bg: string | null; vAlign: string | null; borderless: boolean } {
  const $head = ed.state.selection.$head;
  for (let d = $head.depth; d > 0; d--) {
    const node = $head.node(d);
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      return {
        bg: (node.attrs.backgroundColor as string | null) ?? null,
        vAlign: (node.attrs.verticalAlign as string | null) ?? null,
        borderless: node.attrs.borderless === true || node.attrs.borderless === 'true',
      };
    }
  }
  return { bg: null, vAlign: null, borderless: false };
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

  const attrs = cellAttrsOf(ed);
  return {
    editor: ed,
    tableEl: dom,
    cellBg: attrs.bg,
    isHeaderActive: ed.isActive('tableHeader'),
    canMerge: selection instanceof CellSelection,
    vAlign: attrs.vAlign,
    borderless: attrs.borderless,
  };
}

/** দিন ১২ — কারেন্ট সেলের সারি/কলাম ইনডেক্স + টেবিল জ্যামিতি (পুরো সারি/কলাম সিলেকশনের জন্য) */
function tableGeometryOf(ed: Editor): { tableDepth: number; cellDepth: number; row: number; col: number; rows: number } | null {
  const $head = ed.state.selection.$head;
  let tableDepth = -1;
  let cellDepth = -1;
  for (let d = $head.depth; d > 0; d--) {
    const n = $head.node(d);
    if ((n.type.name === 'tableCell' || n.type.name === 'tableHeader') && cellDepth < 0) cellDepth = d;
    if (n.type.name === 'table') {
      tableDepth = d;
      break;
    }
  }
  if (tableDepth < 0 || cellDepth < 0) return null;
  return {
    tableDepth,
    cellDepth,
    row: $head.index(cellDepth - 1),
    col: $head.index(cellDepth),
    rows: $head.node(tableDepth).childCount,
  };
}

/** দিন ১২ — (r,c) সেলের doc-position; merged সেল থাকলে শেষ সেলে ক্ল্যাম্প */
function cellPosAt(ed: Editor, geo: { tableDepth: number; row: number; rows: number }, r: number, c: number): number | null {
  const $head = ed.state.selection.$head;
  const tableNode = $head.node(geo.tableDepth);
  const tableStart = $head.before(geo.tableDepth);
  const ri = Math.min(Math.max(r, 0), geo.rows - 1);
  let pos = tableStart + 1;
  for (let i = 0; i < ri; i++) pos += tableNode.child(i).nodeSize;
  const row = tableNode.child(ri);
  const ci = Math.min(Math.max(c, 0), row.childCount - 1);
  let cellOffset = 0;
  for (let i = 0; i < ci; i++) cellOffset += row.child(i).nodeSize;
  return pos + cellOffset + 1;
}

export function TableToolbarHost({ suppressed = false }: { suppressed?: boolean }) {
  const tt = useT();
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

  // দিন ১২ — পুরো সারি/কলাম CellSelection (মার্জ/ব্যাকগ্রাউন্ড এক টানে প্রয়োগের সুবিধা)।
  // prosemirror-tables-এর selectRow/selectColumn এই বিল্ডে এক্সপোর্ট নেই — CellSelection.create দিয়ে হাতে।
  const selectEntire = (axis: 'row' | 'col') => {
    run((ed) => {
      const geo = tableGeometryOf(ed);
      if (!geo) return;
      const anchor = axis === 'row'
        ? cellPosAt(ed, geo, geo.row, 0)
        : cellPosAt(ed, geo, 0, geo.col);
      const head = axis === 'row'
        ? cellPosAt(ed, geo, geo.row, Number.MAX_SAFE_INTEGER)
        : cellPosAt(ed, geo, geo.rows - 1, geo.col);
      if (anchor === null || head === null) return;
      const sel = CellSelection.create(ed.state.doc, anchor, head);
      ed.view.dispatch(ed.state.tr.setSelection(sel));
    });
  };

  return createPortal(
    <div
      ref={barRef}
      className="bwp-table-toolbar no-print flex items-center gap-0.5 rounded-full border border-border bg-popover/95 px-1.5 py-1 shadow-lg backdrop-blur"
      role="toolbar"
      aria-label={tt('ws.tblbar.aria', 'Table toolbar')}
    >
      {/* +সারি — উপরে/নিচে */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label={tt('ws.tbl.rowAbove', 'Add row above')}>
                <BetweenHorizontalStart size={15} aria-hidden="true" />
                <ChevronDown size={10} aria-hidden="true" className="-ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('ws.tblbar.addRow', 'Add row — above / below')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().addRowBefore().run())}>
            {tt('ws.tbl.rowAbove', 'Add row above')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().addRowAfter().run())}>
            {tt('ws.tbl.rowBelow', 'Add row below')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* +কলাম — বামে/ডানে */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label={tt('ws.tbl.colLeft', 'Column left')}>
                <BetweenVerticalStart size={15} aria-hidden="true" />
                <ChevronDown size={10} aria-hidden="true" className="-ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('ws.tblbar.addCol', 'Add column — left / right')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().addColumnBefore().run())}>
            {tt('ws.tbl.colLeft', 'Column left')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().addColumnAfter().run())}>
            {tt('ws.tbl.colRight', 'Column right')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* সিলেক্ট — পুরো সারি/কলাম (CellSelection → মার্জ/রং এক টানে) */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" aria-label={tt('ws.tblbar.select', 'Select')}>
                <SquareDashedMousePointer size={15} aria-hidden="true" />
                <ChevronDown size={10} aria-hidden="true" className="-ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('ws.tblbar.selectTip', 'Select entire row / column')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => selectEntire('row')}>
            {tt('ws.tbl.selectRow', 'Select entire row')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => selectEntire('col')}>
            {tt('ws.tbl.selectCol', 'Select entire column')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* মুছুন — সারি / কলাম / টেবিল */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 rounded-full text-red-600"
                aria-label={tt('ws.ctx.hDelete', 'Delete')}
              >
                <Trash2 size={15} aria-hidden="true" />
                <ChevronDown size={10} aria-hidden="true" className="-ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('ws.tblbar.deleteTip', 'Delete row / column / table')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().deleteRow().run())}>
            {tt('ws.tbl.delRow', 'Delete row')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().deleteColumn().run())}>
            {tt('ws.tbl.delCol', 'Delete column')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => run((ed) => ed.chain().focus().deleteTable().run())}
          >
            {tt('ws.tbl.delTable', 'Delete table')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="mx-0.5 h-4 w-px bg-border" aria-hidden="true" />

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-full"
            aria-label={tt('ws.tbl.merge', 'Merge cells')}
            disabled={!info.canMerge}
            onClick={() => run((ed) => ed.chain().focus().mergeCells().run())}
          >
            <Merge size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('ws.tblbar.mergeTip', 'Merge cells (select multiple cells)')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-full"
            aria-label={tt('ws.tbl.split', 'Split cell')}
            onClick={() => run((ed) => ed.chain().focus().splitCell().run())}
          >
            <Split size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('ws.tbl.split', 'Split cell')}</TooltipContent>
      </Tooltip>

      {/* ভার্টিক্যাল অ্যালাইন — উপরে/মাঝ/নিচে */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className={cn('h-7 w-7 rounded-full', info.vAlign && 'bg-primary/15 text-primary')}
                aria-label={tt('ws.tblbar.vAlign', 'Vertical align')}
              >
                <AlignCenterVertical size={15} aria-hidden="true" />
                <ChevronDown size={10} aria-hidden="true" className="-ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('ws.tblbar.vAlign', 'Vertical align')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().setCellAttribute('verticalAlign', 'top').run())}>
            <AlignStartVertical size={14} /> {tt('ws.tbl.vTop', 'Cell vertical align — top')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().setCellAttribute('verticalAlign', 'middle').run())}>
            <AlignCenterVertical size={14} /> {tt('ws.tbl.vMiddle', 'Cell vertical align — middle')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().setCellAttribute('verticalAlign', 'bottom').run())}>
            <AlignEndVertical size={14} /> {tt('ws.tbl.vBottom', 'Cell vertical align — bottom')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className={cn('h-7 w-7 rounded-full', info.isHeaderActive && 'bg-primary/15 text-primary')}
            aria-label={tt('ws.tbl.headerRowToggle', 'Toggle header row')}
            aria-pressed={info.isHeaderActive}
            onClick={() => run((ed) => ed.chain().focus().toggleHeaderRow().run())}
          >
            <PanelTop size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('ws.tbl.headerRowToggle', 'Toggle header row')}</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost" size="icon"
            className="h-7 w-7 rounded-full"
            aria-label={tt('ws.tbl.headerColToggle', 'Toggle header column')}
            onClick={() => run((ed) => ed.chain().focus().toggleHeaderColumn().run())}
          >
            <PanelLeft size={15} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('ws.tbl.headerColToggle', 'Toggle header column')}</TooltipContent>
      </Tooltip>

      {/* বর্ডার — সেল বর্ডার সরান / ফেরত আনুন */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className={cn('h-7 w-7 rounded-full', info.borderless && 'bg-primary/15 text-primary')}
                aria-label={tt('ws.tblbar.borders', 'Cell borders')}
              >
                <Grid2x2X size={15} aria-hidden="true" />
                <ChevronDown size={10} aria-hidden="true" className="-ml-1" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('ws.tblbar.bordersTip', 'Remove or restore cell borders')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center">
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().setCellAttribute('borderless', true).run())}>
            <Grid2x2X size={14} /> {tt('ws.tbl.borderless', 'Remove cell borders')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => run((ed) => ed.chain().focus().setCellAttribute('borderless', null).run())}>
            <Grid2x2 size={14} /> {tt('ws.tbl.bordersRestore', 'Restore cell borders')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* সেল ব্যাকগ্রাউন্ড */}
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost" size="icon"
                className="h-7 w-7 rounded-full"
                aria-label={tt('ws.tblbar.cellBg', 'Cell background color')}
              >
                <Paintbrush size={15} aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('ws.tblbar.cellBg', 'Cell background color')}</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="center" className="w-auto">
          <div className="grid grid-cols-4 gap-1 p-1">
            {CELL_BG_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                aria-label={color === 'transparent' ? tt('ws.tblbar.noColor', 'No color') : color}
                title={color === 'transparent' ? tt('ws.tblbar.noColor', 'No color') : color}
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
