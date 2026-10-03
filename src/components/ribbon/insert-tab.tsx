/**
 * Insert tab — table, image, academic blocks, icons & design boxes, page break, footnote, divider, TOC
 */

'use client';

import { useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  AlertTriangle, BookOpen, CalendarDays, ChevronDown, Frame, Hash, Image as ImageIcon,
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
import {
  SHAPE_CATEGORIES, SHAPE_DEFS, cssTextToStyle, fullShapeAttrs, getShape,
} from '@/lib/shape-catalog';
import { banglaDateToday, banglaTimeNow } from '@/lib/bangla';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import { cn } from '@/lib/utils';
import { t, tFmt, tplNodes, useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { EMPTY_LINK_DIALOG, LinkDialog, type LinkDialogState } from '@/components/editor/link-dialog';
import { Link2Off } from 'lucide-react';

/**
 * Radix মেনু বন্ধের পর নিজে থেকেই ট্রিগার বাটনে ফোকাস ফেরত নেয় (নিজের
 * অভ্যন্তরীণ হ্যান্ডলারে — প্রতিরোধ করা যায় না)। তাই দুই ধাপে এডিটরে
 * ফোকাস ফিরিয়ে আনি: একবার সাথে সাথে, আরেকবার Radix-এর ফোকাস-ফেরতের পরে —
 * যাতে বক্স/আইকন বসানোর পর সরাসরি টাইপ করা যায়।
 * সরাসরি রেজিস্ট্রি থেকে ফোকাস করে — runCommand ব্যবহার না করলে ভুল
 * পাতা/কভার পাতায় বারবার toast ঝরত (এক ক্লিকে ৩টি বার্তা)।
 */
function refocusEditor(): void {
  const tryFocus = () => {
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (ed && !ed.isDestroyed) {
      try { ed.commands.focus(); } catch { /* ধ্বংসপ্রাপ্ত এডিটর */ }
    }
  };
  window.setTimeout(tryFocus, 60);
  window.setTimeout(tryFocus, 320);
}

function TableInsert() {
  const tt = useT();
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
            <button type="button" className="ribbon-btn" aria-label={tt('ins.table')}>
              <TableIcon size={16} />
              <span className="ribbon-btn-label">{tt('ins.table')}</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('ins.table')}</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-auto p-3" align="start">
        <p className="mb-2 text-center text-xs text-muted-foreground">{tt('ins.table.grid')}</p>
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
                aria-label={tFmt('ins.table.cell', { r, c }, 'Row {r} · Column {c}')}
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
  const tt = useT();
  const inTable = ed ? ed.isActive('table') : false;
  if (!inTable) return null;
  return (
    <>
      <RibbonDivider />
      <RibbonGroup label={tt('ins.group.tableTools')} accent="table tools">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={TableIcon} label={tt('ins.t.addRow')} onClick={() => runCommand((e) => e.chain().focus().addRowAfter().run())} />
            <RibbonButton icon={TableIcon} label={tt('ins.t.addCol')} onClick={() => runCommand((e) => e.chain().focus().addColumnAfter().run())} />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={Minus} label={tt('ins.t.delRow')} danger onClick={() => runCommand((e) => e.chain().focus().deleteRow().run())} />
            <RibbonButton icon={Minus} label={tt('ins.t.delCol')} danger onClick={() => runCommand((e) => e.chain().focus().deleteColumn().run())} />
            <RibbonButton icon={Minus} label={tt('ins.t.delTable')} danger onClick={() => runCommand((e) => e.chain().focus().deleteTable().run())} />
          </div>
        </div>
      </RibbonGroup>
    </>
  );
}

function ImageInsert() {
  const tt = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const onPick = (file: File | undefined) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error(t('ins.toast.imageBig', 'Image is larger than 4 MB — please use a smaller image'));
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
      <RibbonButton icon={ImageIcon} label={tt('ins.image')} onClick={() => inputRef.current?.click()} />
    </>
  );
}

function DividerMenu() {
  const tt = useT();
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label={tt('ins.divider')}>
              <Minus size={16} />
              <span className="ribbon-btn-label">{tt('ins.divider')}</span>
              <ChevronDown size={11} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('ins.divider.title')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('single')).run())}>
          {tt('ins.div.single')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('double')).run())}>
          {tt('ins.div.double')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('dotted')).run())}>
          {tt('ins.div.dotted')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('flourish')).run())}>
          {tt('ins.div.flourish')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('stars')).run())}>
          {tt('ins.div.stars')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().insertContent(buildDividerHtml('cut')).run())}>
          {tt('ins.div.cut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InsertToc() {
  const tt = useT();
  return (
    <RibbonButton
      icon={ListTree}
      label={tt('ins.toc')}
      title={tt('ins.toc.title')}
      onClick={() => {
        const { pages, settings } = useEditorStore.getState();
        const entries = scanTocEntries(pages, settings);
        if (entries.length === 0) {
          toast.info(t('ins.toast.tocEmpty', 'No headings (H1/H2/H3) found yet — an empty TOC was inserted. Press "Update" later.'));
        }
        runCommand((ed) => ed.chain().focus().insertContent(tocInsertHtml(entries)).run());
      }}
    />
  );
}

// ═══════════════════ আইকন লাইব্রেরি ডায়ালগ ═══════════════════

const ICON_SIZES = [12, 14, 16, 18, 20, 22, 26, 32, 40, 48, 56, 64];

// রং-এর title অভিধান-কী — রেন্ডারের সময় ভাষা অনুযায়ী দেখানো হয়
const ICON_COLORS: Array<{ value: string; title: string }> = [
  { value: '', title: 'ins.color.auto' },
  { value: '#334155', title: 'ins.color.ash' },
  { value: '#dc2626', title: 'ins.color.red' },
  { value: '#ea580c', title: 'ins.color.orange' },
  { value: '#d97706', title: 'ins.color.mustard' },
  { value: '#16a34a', title: 'ins.color.green' },
  { value: '#0d9488', title: 'ins.color.teal' },
  { value: '#0284c7', title: 'ins.color.blue' },
  { value: '#7c3aed', title: 'ins.color.purple' },
  { value: '#db2777', title: 'ins.color.pink' },
  { value: '#78350f', title: 'ins.color.brown' },
];

function IconLibraryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  // খোলা হলে ভিতরের কম্পোনেন্ট নতুন করে মাউন্ট হয় — স্টেট সবসময় পরিষ্কার
  if (!open) return null;
  return <IconLibraryDialogInner onOpenChange={onOpenChange} />;
}

function IconLibraryDialogInner({ onOpenChange }: { onOpenChange: (v: boolean) => void }) {
  const tt = useT();
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
    // ব্যর্থ হলে (কভার/অমাউন্ট পাতা) ডায়ালগ খোলা রাখি — ব্যবহারকারী runCommand-
    // এর একটিমাত্র বার্তাই দেখে, ডায়ালগ বন্ধ হয়ে গিয়ে আবার খুলতে হয় না
    const ok = runCommand((ed) => ed.chain().focus().insertDocIcon({ name, size, color }).run());
    if (!ok) return;
    pushRecentIcon(name);
    onOpenChange(false);
  };

  const insertOrnament = (char: string) => {
    const style = `color:${color || 'inherit'};font-size:${size}px;`;
    const ok = runCommand((ed) => ed.chain().focus().insertContent(`<span style="${style}">${char}</span>`).run());
    if (!ok) return;
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
            <Shapes size={17} className="text-primary" /> {tt('ins.iconlib')}
          </DialogTitle>
          <DialogDescription>
            {tFmt('ins.iconlib.desc', { a: ICON_CATEGORIES.reduce((n, c) => n + c.icons.length, 0), b: ORNAMENTS.length }, '{a}+ icons and {b} ornaments — search in Bangla or English, then set size & color and insert.')}
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
            placeholder={tt('ins.iconlib.searchPh')}
            className="h-9"
            aria-label={tt('ins.iconlib.searchAria')}
          />
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {!searching && (
              <button
                type="button"
                className={cn('chip', cat === 'all' && 'chip-active')}
                onClick={() => setCat('all')}
              >
                {tt('ins.all')}
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
              {tplNodes(tt('ins.iconlib.noresult', 'No icons found for “{q}” — try another word.'), { q: query })}
            </p>
          )}

          {!searching && recents.length > 0 && (
            <section className="mb-4">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{tt('ins.iconlib.recent')}</h3>
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
                {searching ? <span className="ml-1 font-normal">{tplNodes(tt('ins.iconlib.count', '— {n} icons'), { n: c.icons.length })}</span> : null}
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
                {tt('ins.iconlib.ornaments')} <span className="font-normal">{tt('ins.iconlib.ornamentsHint')}</span>
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
            <label className="text-[10px] text-muted-foreground">{tt('ins.iconlib.size')}</label>
            <select
              className="h-7 rounded-md border bg-background px-1 text-xs"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              aria-label={tt('ins.iconlib.sizeAria')}
            >
              {ICON_SIZES.map((s) => (
                <option key={s} value={s}>{s}px</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground">{tt('ins.iconlib.color')}</span>
            <div className="flex items-center gap-1">
              {ICON_COLORS.map((c) => (
                <button
                  key={c.value || 'auto'}
                  type="button"
                  className={cn('color-dot', !c.value && 'color-dot-auto', color === c.value && 'color-dot-active')}
                  style={c.value ? { background: c.value } : undefined}
                  onClick={() => setColor(c.value)}
                  title={tt(c.title)}
                  aria-label={tt(c.title)}
                />
              ))}
              <input
                type="color"
                className="doc-tool-color ml-0.5"
                value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#334155'}
                onChange={(e) => setColor(e.target.value)}
                title={tt('ins.iconlib.customColor')}
                aria-label={tt('ins.iconlib.customColor')}
              />
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <p className="hidden text-right text-[11px] leading-tight text-muted-foreground sm:block">
              {tt('ins.iconlib.clickSel')}<br />{tt('ins.iconlib.dclickIns')}
            </p>
            <button
              type="button"
              className="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              onClick={() => insertIcon(sel)}
            >
              {tt('ins.iconlib.insert')}
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
  const tt = useT();
  const insert = (variant: DocBoxVariant) => {
    runCommand((ed) => ed.chain().focus().insertDesignBox(variant).run());
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label={tt('ins.textbox')}>
              <Square size={16} />
              <span className="ribbon-btn-label">{tt('ins.textbox')}</span>
              <ChevronDown size={11} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('ins.textbox.title')}</TooltipContent>
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
          {tt('ins.textbox.hint')}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ═══════════════════ ডিজাইন শেপ গ্যালারি ═══════════════════

/** শেপ প্রিভিউ — ক্যাটালগ ডেফ থেকে সরাসরি রেন্ডার (এডিটরের মতোই দেখায়) */
export function ShapePreview({ shapeId, sample }: { shapeId: string; sample?: string }) {
  const tt = useT();
  const def = getShape(shapeId);
  if (!def) return null;
  const eff = fullShapeAttrs(shapeId);
  const shellStyle = {
    position: 'relative' as const,
    ...def.shell(eff),
    margin: '0',
    boxShadow: 'none',
  } as CSSProperties;
  return (
    <span className="doc-shape shape-preview" data-shape={shapeId} style={shellStyle} aria-hidden="true">
      {def.orns(eff).map((o) => (
        <span
          key={o.key}
          style={cssTextToStyle(o.style) as CSSProperties}
          dangerouslySetInnerHTML={{ __html: o.svg }}
        />
      ))}
      <span className="doc-shape-content" style={def.content(eff) as CSSProperties}>
        {sample ?? tt('ins.shape.sample', 'Title')}
      </span>
    </span>
  );
}

function ShapeGalleryDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  if (!open) return null;
  return <ShapeGalleryDialogInner onOpenChange={onOpenChange} />;
}

function ShapeGalleryDialogInner({ onOpenChange }: { onOpenChange: (v: boolean) => void }) {
  const tt = useT();
  const [cat, setCat] = useState<string>('all');

  const defs = cat === 'all' ? SHAPE_DEFS : SHAPE_DEFS.filter((d) => d.cat === cat);

  const insert = (id: string) => {
    const ok = runCommand((ed) => ed.chain().focus().insertShapeFrame(id).run());
    if (!ok) return;
    onOpenChange(false);
    refocusEditor();
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent
        className="flex h-[80vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusEditor(); }}
      >
        <DialogHeader className="border-b px-5 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <Frame size={17} className="text-primary" /> {tt('ins.shapes.title')}
          </DialogTitle>
          <DialogDescription>
            {tFmt('ins.shapes.desc', { n: SHAPE_DEFS.length }, 'Ornate banners, frames and badges — {n} shapes. Click inside to write after inserting; hover a shape for shape & color tools.')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5 overflow-x-auto border-b px-5 py-3">
          <button
            type="button"
            className={cn('chip', cat === 'all' && 'chip-active')}
            onClick={() => setCat('all')}
          >
            {tt('ins.all')} <span className="text-[10px] opacity-60">({SHAPE_DEFS.length})</span>
          </button>
          {SHAPE_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              className={cn('chip', cat === c.id && 'chip-active')}
              onClick={() => setCat(c.id)}
            >
              {c.label} <span className="text-[10px] opacity-60">({SHAPE_DEFS.filter((d) => d.cat === c.id).length})</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="shape-gallery">
            {defs.map((d) => (
              <button
                key={d.id}
                type="button"
                className="shape-card"
                onClick={() => insert(d.id)}
                title={tFmt('ins.shapes.cardTip', { s: d.label }, '{s} — click to insert')}
                aria-label={d.label}
              >
                <span className="shape-card-preview">
                  <ShapePreview shapeId={d.id} />
                </span>
                <span className="shape-card-label">{d.label}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] leading-snug text-muted-foreground">
            {tt('ins.shapes.tip')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════ Insert Tab ═══════════════════

export function InsertTab() {
  const ed = useActiveEditor();
  void ed;
  const tt = useT();
  const [iconOpen, setIconOpen] = useState(false);
  const [shapeOpen, setShapeOpen] = useState(false);
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>(EMPTY_LINK_DIALOG);

  const breakPage = () => {
    const { activePageId, pages } = useEditorStore.getState();
    const editor = ed ?? undefined;
    if (!editor || !activePageId) {
      // কভার/অমাউন্ট পাতায় নীরব no-op নয় — স্পষ্ট বার্তা
      const pg = pages.find((p) => p.id === activePageId);
      if (pg && pg.kind !== 'normal') toast.info(t('ins.toast.breakCover'));
      else toast.info(t('rb.toast.notopen'));
      return;
    }
    pageBreakOnEditor(editor, activePageId);
  };

  const insertRaw = (html: string) => runCommand((ed2) => ed2.chain().focus().insertContent(html).run());

  /** সিলেকশনে/কার্সরে লিংক বসানোর ডায়ালগ */
  const openLinkDialog = () => {
    const editor = getActiveEditorForLink();
    if (!editor) {
      toast.error(t('ins.toast.linkFirst'));
      return;
    }
    const linkAttrs = editor.getAttributes('link');
    const activeLink = (linkAttrs.href as string | undefined) ?? '';
    const { empty } = editor.state.selection;
    setLinkDialog({
      open: true,
      mode: 'text',
      editor,
      imagePos: null,
      initialHref: activeLink,
      // বিদ্যমান লিংকের আসল target থেকে শুরু — আগে সবসময় true ছিল, তাই
      // এডিট করতে গিয়ে সেম-ট্যাব লিংকও নীরবে _blank হয়ে যেত
      initialNewTab: ((linkAttrs.target as string | null | undefined) ?? null) === '_blank',
      initialText: empty ? '' : '—', // '—' মানে সিলেকশনে আছে — টেক্সট ইনপুট লাগবে না
    });
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label={tt('ins.group.tablesMedia')} accent="tables & media">
        <div className="flex gap-1">
          <TableInsert />
          <ImageInsert />
        </div>
      </RibbonGroup>
      <TableOps />
      <RibbonDivider />
      <RibbonGroup label={tt('ins.group.iconsDesign')} accent="icons & design">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton
              icon={Shapes}
              label={tt('ins.iconlib')}
              title={tt('ins.iconlib.tip')}
              onClick={() => setIconOpen(true)}
            />
            <RibbonButton
              icon={Frame}
              label={tt('ins.shapes')}
              title={tt('ins.shapes.tipTitle')}
              onClick={() => setShapeOpen(true)}
            />
          </div>
          <div className="flex gap-1">
            <TextBoxMenu />
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('ins.group.academic')} accent="academic blocks">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={Lightbulb} label={tt('ins.conceptBox')} onClick={() => runCommand((e) => e.commands.insertCallout('concept', t('ins.callout.concept')))} />
            <RibbonButton icon={AlertTriangle} label={tt('ins.warningBox')} onClick={() => runCommand((e) => e.commands.insertCallout('warning', t('ins.callout.warning')))} />
            <RibbonButton icon={BookOpen} label={tt('ins.formulaBox')} onClick={() => runCommand((e) => e.commands.insertCallout('formula', t('ins.callout.formula')))} />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={Pin} label={tt('ins.noteBox')} onClick={() => runCommand((e) => e.commands.insertCallout('note', t('ins.callout.note')))} />
            <RibbonButton icon={HelpCircle} label={tt('ins.mcq')} onClick={() => runCommand((e) => e.commands.insertMcq())} />
            <RibbonButton
              icon={Hash}
              label={tt('ins.footnote')}
              onClick={() => {
                runCommand((e) => e.commands.insertFootnote(''));
                toast.info(t('ins.toast.footnote'));
              }}
            />
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('ins.group.pageDecor')} accent="page & decor">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={FilePlus2} label={tt('ins.pageBreak')} shortcut="Ctrl+Enter" onClick={breakPage} />
            <DividerMenu />
            <InsertToc />
          </div>
          <div className="flex gap-1">
            <RibbonButton
              icon={CalendarDays}
              label={tt('ins.todayDate')}
              title={tt('ins.todayDate.title')}
              onClick={() => insertRaw(`<p>${banglaDateToday()} — ${banglaTimeNow()}</p>`)}
            />
            <RibbonButton
              icon={Link2}
              label={ed?.isActive('link') ? tt('ins.link.edit') : tt('ins.link')}
              title={tt('ins.link.title')}
              onClick={openLinkDialog}
            />
            <RibbonButton
              icon={Link2Off}
              label={tt('ins.link.remove')}
              title={tt('ins.link.removeTitle')}
              onClick={() => {
                const editor = getActiveEditorForLink();
                if (!editor) {
                  toast.error(t('ins.toast.unlinkFirst'));
                  return;
                }
                editor.chain().focus().extendMarkRange('link').unsetLink().run();
              }}
            />
          </div>
        </div>
      </RibbonGroup>

      <IconLibraryDialog open={iconOpen} onOpenChange={setIconOpen} />
      <ShapeGalleryDialog open={shapeOpen} onOpenChange={setShapeOpen} />
      <LinkDialog state={linkDialog} onClose={() => setLinkDialog(EMPTY_LINK_DIALOG)} />
    </div>
  );
}

/**
 * লিংক কমান্ডের জন্য সক্রিয় এডিটর — শুধুই সক্রিয় পাতার এডিটর।
 * আগে সক্রিয় এডিটর না পেলে যেকোনো মাউন্ট করা এডিটরে ফলব্যাক করত — ফলে
 * দূরে স্ক্রল করা অবস্থায় লিংক ভুল পাতার পুরনো কার্সরে বসে যেত।
 */
function getActiveEditorForLink(): ReturnType<typeof getEditor> {
  const { activePageId } = useEditorStore.getState();
  const editor = getEditor(activePageId);
  return editor && !editor.isDestroyed ? editor : undefined;
}
