/**
 * Insert tab — table, image, academic blocks, icons & design boxes, page break, footnote, divider, TOC
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, BookOpen, CalendarDays, ChevronDown, Hash, Image as ImageIcon,
  Lightbulb, Link2, ListTree, Minus, Pin, Shapes, Square, Table as TableIcon, FilePlus2, HelpCircle,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RibbonButton, RibbonDivider, RibbonGroup, runCommand, useActiveEditor } from './ribbon-shell';
import { pageBreakOnEditor } from '@/components/editor/page-ops';
import { scanTocEntries, tocInsertHtml } from '@/lib/toc';
import { buildDividerHtml, DOC_BOX_LABELS, type DocBoxVariant, type DividerStyle } from '@/lib/nodes-html';
import {
  ICON_CATEGORIES, ORNAMENTS, getRecentIcons, pushRecentIcon, searchIcons,
} from '@/lib/icon-catalog';
import { banglaDateToday, banglaTimeNow } from '@/lib/bangla';
import { useEditorStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/**
 * Radix মেনু বন্ধের পর নিজে থেকেই ট্রিগার বাটনে ফোকাস ফেরত নেয় (নিজের
 * অভ্যন্তরীণ হ্যান্ডলারে — প্রতিরোধ করা যায় না)। তাই দুই ধাপে এডিটরে
 * ফোকাস ফিরিয়ে আনি: একবার সাথে সাথে, আরেকবার Radix-এর ফোকাস-ফেরতের পরে —
 * যাতে বক্স/আইকন বসানোর পর সরাসরি টাইপ করা যায়।
 */
function refocusEditor(): void {
  window.setTimeout(() => runCommand((ed) => ed.commands.focus()), 60);
  window.setTimeout(() => runCommand((ed) => ed.commands.focus()), 320);
}

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
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('stars')).run())}>
          ✦ ─── ✦ ─── ✦ Stars
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('cut')).run())}>
          ✂ ─ ─ ─ Cut Line (ফরমা কাটা)
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

// ═══════════════════ আইকন লাইব্রেরি ডায়ালগ ═══════════════════

const ICON_SIZES = [12, 14, 16, 18, 20, 22, 26, 32, 40, 48, 56, 64];

const ICON_COLORS: Array<{ value: string; title: string }> = [
  { value: '', title: 'স্বয়ংক্রিয় (লেখার রং)' },
  { value: '#334155', title: 'ছাই' },
  { value: '#dc2626', title: 'লাল' },
  { value: '#ea580c', title: 'কমলা' },
  { value: '#d97706', title: 'সরিষা' },
  { value: '#16a34a', title: 'সবুজ' },
  { value: '#0d9488', title: 'টিল' },
  { value: '#0284c7', title: 'নীল' },
  { value: '#7c3aed', title: 'বেগুনি' },
  { value: '#db2777', title: 'গোলাপি' },
  { value: '#78350f', title: 'বাদামি' },
];

function IconLibraryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // খোলা হলে ভিতরের কম্পোনেন্ট নতুন করে মাউন্ট হয় — স্টেট সবসময় পরিষ্কার
  if (!open) return null;
  return <IconLibraryDialogInner onOpenChange={onOpenChange} />;
}

function IconLibraryDialogInner({ onOpenChange }: { onOpenChange: (v: boolean) => void }) {
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<string>('all');
  const [sel, setSel] = useState<string>('Star');
  const [size, setSize] = useState(22);
  const [color, setColor] = useState('');
  const [recents] = useState<string[]>(() => getRecentIcons());

  const searching = query.trim().length > 0;
  const results = useMemo(() => searchIcons(query), [query]);
  const cats = searching
    ? results.categories
    : cat === 'all'
      ? ICON_CATEGORIES
      : ICON_CATEGORIES.filter((c) => c.id === cat);

  const insertIcon = (name: string) => {
    runCommand((ed) => ed.chain().focus().insertDocIcon({ name, size, color }).run());
    pushRecentIcon(name);
    onOpenChange(false);
  };

  const insertOrnament = (char: string) => {
    const style = `color:${color || 'inherit'};font-size:${size}px;`;
    runCommand((ed) => ed.chain().focus().insertContent(`<span style="${style}">${char}</span>`).run());
    onOpenChange(false);
    refocusEditor();
  };

  const SelIcon = ICON_CATEGORIES.flatMap((c) => c.icons).find((i) => i.name === sel)?.Icon;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[82vh] max-w-2xl flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusEditor(); }}
      >
        <DialogHeader className="border-b px-5 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <Shapes size={17} className="text-primary" /> আইকন লাইব্রেরি
          </DialogTitle>
          <DialogDescription>
            {ICON_CATEGORIES.reduce((n, c) => n + c.icons.length, 0)}+ আইকন ও {ORNAMENTS.length}টি অলংকার চিহ্ন —
            বাংলা বা ইংরেজিতে খুঁজুন, সাইজ ও রং ঠিক করে যোগ করুন।
          </DialogDescription>
        </DialogHeader>

        {/* সার্চ + ক্যাটাগরি */}
        <div className="space-y-2 border-b px-5 py-3">
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') insertIcon(sel);
            }}
            placeholder="খুঁজুন… (যেমন: তারা, বই, heart, arrow, ফুল)"
            className="h-9"
            aria-label="আইকন খুঁজুন"
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {!searching && (
              <button
                type="button"
                className={cn('chip', cat === 'all' && 'chip-active')}
                onClick={() => setCat('all')}
              >
                সব
              </button>
            )}
            {ICON_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={cn('chip', !searching && cat === c.id && 'chip-active')}
                onClick={() => { setCat(c.id); setQuery(''); }}
              >
                {c.label} <span className="text-[10px] opacity-60">({c.icons.length})</span>
              </button>
            ))}
          </div>
        </div>

        {/* গ্রিড */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {searching && results.total === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              &ldquo;{query}&rdquo; এর জন্য কোনো আইকন পাওয়া যায়নি — অন্য শব্দ চেষ্টা করুন।
            </p>
          )}

          {!searching && recents.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">সাম্প্রতিক ব্যবহৃত</h3>
              <div className="icon-grid">
                {recents.map((name) => {
                  const entry = ICON_CATEGORIES.flatMap((c) => c.icons).find((i) => i.name === name);
                  if (!entry) return null;
                  const IconC = entry.Icon;
                  return (
                    <button
                      key={`r-${name}`}
                      type="button"
                      className={cn('icon-cell', sel === name && 'icon-cell-active')}
                      onClick={() => setSel(name)}
                      onDoubleClick={() => insertIcon(name)}
                      title={name}
                      aria-label={name}
                    >
                      <IconC size={19} strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {cats.map((c) => (
            <section key={c.id} className="mb-4">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                {c.label}
                {searching ? <span className="ml-1 font-normal">— {c.icons.length}টি</span> : null}
              </h3>
              <div className="icon-grid">
                {c.icons.map((entry) => {
                  const IconC = entry.Icon;
                  return (
                    <button
                      key={entry.name}
                      type="button"
                      className={cn('icon-cell', sel === entry.name && 'icon-cell-active')}
                      onClick={() => setSel(entry.name)}
                      onDoubleClick={() => insertIcon(entry.name)}
                      title={`${entry.name} — ${entry.kw}`}
                      aria-label={entry.name}
                    >
                      <IconC size={19} strokeWidth={1.8} />
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {/* অলংকার চিহ্ন — শুধু সার্চ ছাড়া দেখায় (টেক্সট অক্ষর) */}
          {!searching && (
            <section className="mb-2">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                অলংকার চিহ্ন <span className="font-normal">— ক্লিক করলেই বসে যাবে</span>
              </h3>
              <div className="icon-grid">
                {ORNAMENTS.map((o) => (
                  <button
                    key={o.char}
                    type="button"
                    className="icon-cell text-lg leading-none"
                    onClick={() => insertOrnament(o.char)}
                    title={o.label}
                    aria-label={o.label}
                  >
                    {o.char}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* নিচের বার — প্রিভিউ + সাইজ + রং + যোগ */}
        <div className="flex items-center gap-3 border-t bg-muted/30 px-5 py-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border bg-background"
            aria-hidden="true"
          >
            {SelIcon ? <SelIcon size={Math.min(size, 34)} color={color || undefined} strokeWidth={1.8} /> : '—'}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground">সাইজ</label>
            <select
              className="h-7 rounded-md border bg-background px-1 text-xs"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              aria-label="আইকনের সাইজ"
            >
              {ICON_SIZES.map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">রং</span>
            <div className="flex items-center gap-1">
              {ICON_COLORS.map((c) => (
                <button
                  key={c.value || 'auto'}
                  type="button"
                  className={cn('color-dot', !c.value && 'color-dot-auto', color === c.value && 'color-dot-active')}
                  style={c.value ? { background: c.value } : undefined}
                  onClick={() => setColor(c.value)}
                  title={c.title}
                  aria-label={c.title}
                />
              ))}
              <input
                type="color"
                className="doc-tool-color ml-0.5"
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#334155'}
                onChange={(e) => setColor(e.target.value)}
                title="নিজের রং"
                aria-label="নিজের রং"
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <p className="hidden text-right text-[11px] leading-tight text-muted-foreground sm:block">
              এক ক্লিকে নির্বাচন,<br />ডাবল ক্লিকে সরাসরি বসবে
            </p>
            <button
              type="button"
              className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              onClick={() => insertIcon(sel)}
            >
              যোগ করুন
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════ টেক্সট বক্স মেনু ═══════════════════

const BOX_VARIANTS = Object.keys(DOC_BOX_LABELS) as DocBoxVariant[];

function TextBoxMenu() {
  const insert = (variant: DocBoxVariant) => {
    runCommand((ed) => ed.chain().focus().insertDesignBox(variant).run());
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label="Text Box">
              <Square size={16} />
              <span className="ribbon-btn-label">Text Box</span>
              <ChevronDown size={11} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Bordered Box — ভিতরে লেখা যায়</TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="start"
        className="w-60"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusEditor(); }}
      >
        {BOX_VARIANTS.map((v) => (
          <DropdownMenuItem key={v} onClick={() => insert(v)}>
            <span className="docbox-preview" data-variant={v} aria-hidden="true" />
            {DOC_BOX_LABELS[v]}
          </DropdownMenuItem>
        ))}
        <div className="border-t px-2 pb-1.5 pt-2 text-[11px] leading-snug text-muted-foreground">
          বক্স বসানোর পর ভিতরে ক্লিক করে লিখুন। বক্সে মাউস রাখলে রং/আকৃতি বদলানোর টুল দেখা যাবে।
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ═══════════════════ Insert Tab ═══════════════════

export function InsertTab() {
  const ed = useActiveEditor();
  void ed;
  const [iconOpen, setIconOpen] = useState(false);

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
      <RibbonGroup label="Icons & Design">
        <div className="flex gap-1">
          <RibbonButton
            icon={Shapes}
            label="Icon Library"
            title="৩০০+ আইকন ও অলংকার চিহ্ন — সার্চ করে যোগ করুন"
            onClick={() => setIconOpen(true)}
          />
          <TextBoxMenu />
        </div>
      </RibbonGroup>
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

      <IconLibraryDialog open={iconOpen} onOpenChange={setIconOpen} />
    </div>
  );
}
