/**
 * Insert tab — table, image, academic blocks, page break, footnote, divider, TOC
 */

'use client';

import { useRef, useState } from 'react';
import {
  AlertTriangle, BookOpen, CalendarDays, ChevronDown, Hash, Image as ImageIcon,
  Lightbulb, Link2, ListTree, Minus, Pin, Table as TableIcon, FilePlus2, HelpCircle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RibbonButton, RibbonDivider, RibbonGroup, runCommand, useActiveEditor } from './ribbon-shell';
import { pageBreakOnEditor } from '@/components/editor/page-ops';
import { scanTocEntries, tocInsertHtml } from '@/lib/toc';
import { buildDividerHtml } from '@/lib/nodes-html';
import { banglaDateToday, banglaTimeNow } from '@/lib/bangla';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function TableInsert() {
  const [grid, setGrid] = useState<{ r: number; c: number } | null>(null);

  const insert = (rows: number, cols: number) => {
    runCommand((ed) => {
      const headerRow = {
        type: 'tableRow',
        content: Array.from({ length: cols }, () => ({
          type: 'tableHeader',
          content: [{ type: 'paragraph' }],
        })),
      };
      const bodyRows = Array.from({ length: rows - 1 }, () => ({
        type: 'tableRow',
        content: Array.from({ length: cols }, () => ({
          type: 'tableCell',
          content: [{ type: 'paragraph' }],
        })),
      }));
      ed.chain().focus().insertContent({ type: 'table', content: [headerRow, ...bodyRows] }).run();
    });
  };

  const maxR = 6, maxC = 6;
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label="Table">
              <TableIcon size={16} />
              <span className="ribbon-btn-label">Table</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Table</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-3" align="start">
        <p className="mb-2 text-center text-xs text-muted-foreground">Select rows × columns</p>
        <div
          className="grid gap-1"
          style={{ gridTemplateColumns: `repeat(${maxC}, 22px)` }}
          onMouseLeave={() => setGrid(null)}
        >
          {Array.from({ length: maxR * maxC }, (_, i) => {
            const r = Math.floor(i / maxC) + 1;
            const c = (i % maxC) + 1;
            const active = grid && r <= grid.r && c <= grid.c;
            return (
              <button
                key={i}
                type="button"
                aria-label={`Row ${r} · Column ${c}`}
                className={cn('h-5 w-5 rounded-sm border', active ? 'border-primary bg-primary/70' : 'border-border bg-muted/60')}
                onMouseEnter={() => setGrid({ r, c })}
                onClick={() => insert(r, c)}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TableOps() {
  const ed = useActiveEditor();
  const inTable = ed ? ed.isActive('table') : false;
  if (!inTable) return null;
  return (
    <>
      <RibbonDivider />
      <RibbonGroup label="Table Tools">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={TableIcon} label="Add Row" onClick={() => runCommand((e) => e.chain().focus().addRowAfter().run())} />
            <RibbonButton icon={TableIcon} label="Add Column" onClick={() => runCommand((e) => e.chain().focus().addColumnAfter().run())} />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={Minus} label="Delete Row" danger onClick={() => runCommand((e) => e.chain().focus().deleteRow().run())} />
            <RibbonButton icon={Minus} label="Delete Column" danger onClick={() => runCommand((e) => e.chain().focus().deleteColumn().run())} />
            <RibbonButton icon={Minus} label="Delete Table" danger onClick={() => runCommand((e) => e.chain().focus().deleteTable().run())} />
          </div>
        </div>
      </RibbonGroup>
    </>
  );
}

function ImageInsert() {
  const inputRef = useRef<HTMLInputElement>(null);
  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error('Image is larger than 4 MB — please use a smaller image');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? '');
      runCommand((ed) => ed.chain().focus().setImage({ src: dataUrl, alt: file.name }).run());
    };
    reader.readAsDataURL(file);
  };
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { onPick(e.target.files?.[0]); e.currentTarget.value = ''; }}
      />
      <RibbonButton icon={ImageIcon} label="Image" onClick={() => inputRef.current?.click()} />
    </>
  );
}

function DividerMenu() {
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label="Divider">
              <Minus size={16} />
              <span className="ribbon-btn-label">Divider</span>
              <ChevronDown size={11} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Decorative Divider</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('single')).run())}>
          ─── Single Line
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('double')).run())}>
          ═══ Double Line
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('dotted')).run())}>
          ┄┄┄ Dotted Line
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('flourish')).run())}>
          ❦ ─── ❖ ─── ❦ Flourish
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InsertToc() {
  return (
    <RibbonButton
      icon={ListTree}
      label="Table of Contents"
      title="Insert an auto-generated table of contents here"
      onClick={() => {
        const { pages, settings } = useEditorStore.getState();
        const entries = scanTocEntries(pages, settings);
        if (entries.length === 0) {
          toast.info('No headings (H1/H2/H3) found yet — an empty TOC was inserted. Press "Update" later.');
        }
        runCommand((ed) => ed.chain().focus().insertContent(tocInsertHtml(entries)).run());
      }}
    />
  );
}

export function InsertTab() {
  const ed = useActiveEditor();
  void ed;

  const breakPage = () => {
    const { activePageId } = useEditorStore.getState();
    const editor = ed ?? undefined;
    if (!editor) return;
    if (activePageId) pageBreakOnEditor(editor, activePageId);
  };

  const insertRaw = (html: string) => runCommand((ed2) => ed2.chain().focus().insertContent(html).run());

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label="Tables & Media">
        <div className="flex gap-1">
          <TableInsert />
          <ImageInsert />
        </div>
      </RibbonGroup>
      <TableOps />
      <RibbonDivider />
      <RibbonGroup label="Academic Blocks">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={Lightbulb} label="Concept Box" onClick={() => runCommand((e) => e.commands.insertCallout('concept', 'মূল ধারণা'))} />
            <RibbonButton icon={AlertTriangle} label="Warning Box" onClick={() => runCommand((e) => e.commands.insertCallout('warning', 'সতর্কতা'))} />
            <RibbonButton icon={BookOpen} label="Formula Box" onClick={() => runCommand((e) => e.commands.insertCallout('formula', 'সূত্র'))} />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={Pin} label="Note Box" onClick={() => runCommand((e) => e.commands.insertCallout('note', 'নোট'))} />
            <RibbonButton icon={HelpCircle} label="MCQ" onClick={() => runCommand((e) => e.commands.insertMcq())} />
            <RibbonButton
              icon={Hash}
              label="Footnote"
              onClick={() => {
                runCommand((e) => e.commands.insertFootnote(''));
                toast.info('Footnote added — click the ▾ marker to write its text');
              }}
            />
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Page & Decor">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={FilePlus2} label="Page Break" shortcut="Ctrl+Enter" onClick={breakPage} />
            <DividerMenu />
            <InsertToc />
          </div>
          <div className="flex gap-1">
            <RibbonButton
              icon={CalendarDays}
              label="Today's Date"
              title="Insert Bangla date & time"
              onClick={() => insertRaw(`<p>${banglaDateToday()} — ${banglaTimeNow()}</p>`)}
            />
            <RibbonButton
              icon={Link2}
              label="Link"
              onClick={() => {
                const url = window.prompt('Enter the link URL:');
                if (!url) return;
                runCommand((e) => e.chain().focus().setLink({ href: url }).run());
              }}
            />
          </div>
        </div>
      </RibbonGroup>
    </div>
  );
}
