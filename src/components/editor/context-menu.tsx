/**
 * MS Word-style context menus — right-click (and double-click) on page content.
 *
 * Self-contained host:
 *  - listens for contextmenu/dblclick (capture) on the pages container
 *  - detects what was clicked (image / table cell / text) and resolves the
 *    per-page TipTap editor via editor-registry (data-page-id on .ProseMirror)
 *  - renders a fixed-position portal menu at the cursor with viewport flipping
 *  - closes on click-outside, Escape, scroll (capture) and resize
 *
 * Menus:
 *  - IMAGE  : size %, align (margin auto), border frame, copy, delete
 *  - TABLE  : rows/cols, header toggles, merge/split, cell background, align, deletes
 *  - TEXT   : clipboard, character formats (active state), color/highlight, paragraph
 */

'use client';

import {
  Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState,
  type ReactNode, type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import type { Content, Editor } from '@tiptap/react';
import { CellSelection } from '@tiptap/pm/tables';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, AlignCenterVertical,
  AlignEndVertical, AlignStartVertical, ArrowDownToLine, ArrowLeftToLine,
  ArrowRightToLine, ArrowUpToLine, Bold, Check, ChevronsDown, ChevronsUp,
  ClipboardPaste, Copy, Eraser, Expand, ExternalLink, Frame, Highlighter, Italic, Link2, Link2Off, List,
  ListOrdered, Maximize2, Merge, Minimize2, Paintbrush,
  Palette, PanelLeft, PanelTop, RotateCcw, Ruler, Scissors, Shrink, SquareDashed, Split,
  Strikethrough, Subscript as SubIcon, Superscript as SupIcon, TextCursorInput, Trash2,
  Underline as UnderlineIcon, UnfoldVertical, WrapText, type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getEditor } from '@/lib/editor-registry';
import { COLOR_SWATCHES, HIGHLIGHT_SWATCHES } from '@/lib/paper';
import { CELL_BG_COLORS } from './table-cell-bg';
import { ImageResizeHost } from './image-resizer';
import { ImageSizeDialog, type ImageDialogState } from './image-size-dialog';
import { TableToolbarHost } from './table-toolbar';
import { EMPTY_LINK_DIALOG, LinkDialog, type LinkDialogState } from './link-dialog';

// ─────────────────────────── types & constants ───────────────────────────

type MenuKind = 'image' | 'table' | 'text';

interface MenuState {
  kind: MenuKind;
  x: number;
  y: number;
  editor: Editor;
  /** Position of the clicked image node (null for non-image menus) */
  imagePos: number | null;
  /** Snapshot of the clicked image node attrs */
  imageAttrs: Record<string, unknown>;
  /** True when the editor selection is a CellSelection (Merge Cells enabled) */
  canMergeCells: boolean;
}

interface CtxItem {
  id: string;
  label?: string;
  icon?: LucideIcon;
  shortcut?: string;
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  /** Custom row (e.g. swatch strip) rendered instead of a plain button */
  render?: () => ReactNode;
}

interface CtxSection {
  header?: string;
  items: CtxItem[];
}

const TEXT_COLORS = COLOR_SWATCHES.slice(0, 8);
const HIGHLIGHT_COLORS = HIGHLIGHT_SWATCHES.slice(0, 8);

// ─────────────────────────── helpers ───────────────────────────

/** Find the image node whose DOM element was clicked. */
function findImageNode(
  editor: Editor,
  domImg: Element,
): { pos: number; attrs: Record<string, unknown> } | null {
  let found: { pos: number; attrs: Record<string, unknown> } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name === 'image') {
      const dom = editor.view.nodeDOM(pos);
      if (dom === domImg || (dom instanceof HTMLElement && dom.contains(domImg))) {
        found = { pos, attrs: { ...node.attrs } };
        return false;
      }
    }
    return true;
  });
  return found;
}

/** Plain text of the current selection (for clipboard commands). */
function selectionText(editor: Editor): string {
  const { from, to, empty } = editor.state.selection;
  if (empty) return '';
  return editor.state.doc.textBetween(from, to, '\n', ' ');
}

/** Insert clipboard text — multi-line input becomes paragraphs. */
function insertPlainText(editor: Editor, text: string): void {
  if (!text) return;
  const content: Content = text.includes('\n')
    ? text.split('\n').map((line) => ({
        type: 'paragraph',
        content: line ? [{ type: 'text', text: line }] : [],
      }))
    : text;
  editor.chain().focus().insertContent(content).run();
}

// ─────────────────────────── presentational pieces ───────────────────────────

function MenuItemButton({ item }: { item: CtxItem }) {
  const Icon = item.icon;
  return (
    <button
      type="button"
      role="menuitem"
      data-menu-item
      disabled={item.disabled}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-[13px] leading-5 outline-none transition-colors',
        'focus:bg-accent hover:bg-accent',
        item.danger && !item.disabled
          ? 'text-red-600 hover:bg-red-500/10 focus:bg-red-500/10'
          : 'text-foreground',
        item.disabled && 'pointer-events-none opacity-40',
      )}
      onClick={item.onSelect}
    >
      {Icon ? (
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      ) : (
        <span className="inline-block h-4 w-4 shrink-0" aria-hidden="true" />
      )}
      <span className="flex-1 truncate">{item.label}</span>
      {item.active ? (
        <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      ) : item.shortcut ? (
        <span className="shrink-0 text-[11px] text-muted-foreground">{item.shortcut}</span>
      ) : (
        <span className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      )}
    </button>
  );
}

function SwatchRow({
  icon: Icon,
  label,
  colors,
  current,
  onPick,
}: {
  icon: LucideIcon;
  label: string;
  colors: string[];
  current?: string | null;
  onPick: (color: string) => void;
}) {
  return (
    <div
      role="menuitem"
      data-menu-item
      tabIndex={-1}
      className="flex w-full items-center gap-2.5 px-3 py-1.5 text-[13px] outline-none transition-colors focus:bg-accent hover:bg-accent"
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="shrink-0">{label}</span>
      <span className="ml-auto flex items-center gap-1">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={color === 'transparent' ? 'None' : color}
            title={color === 'transparent' ? 'None' : color}
            className={cn(
              'h-4 w-4 shrink-0 rounded border border-black/20 transition hover:scale-110',
              current === color && 'ring-2 ring-primary ring-offset-1',
            )}
            style={
              color === 'transparent'
                ? { background: 'repeating-conic-gradient(#cbd5e1 0% 25%, #ffffff 0% 50%) 0 0 / 8px 8px' }
                : { backgroundColor: color }
            }
            onClick={() => onPick(color)}
          />
        ))}
      </span>
    </div>
  );
}

// ─────────────────────────── host controller ───────────────────────────

export function ContextMenuHost({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [sizeDialog, setSizeDialog] = useState<ImageDialogState | null>(null);
  const [linkDialog, setLinkDialog] = useState<LinkDialogState>(EMPTY_LINK_DIALOG);
  const menuRef = useRef<HTMLDivElement | null>(null);

  /** Decide what was clicked and open the matching menu (or let the native menu through). */
  const handleOpen = useCallback(
    (e: MouseEvent) => {
      const container = containerRef.current;
      const target = e.target as HTMLElement | null;
      if (!container || !target) return;
      if (!container.contains(target)) return;

      // Only live (mounted) TipTap editors — static previews / chrome areas get nothing.
      const pmEl = target.closest('.ProseMirror');
      if (!(pmEl instanceof HTMLElement) || !container.contains(pmEl)) return;

      const editor = getEditor(pmEl.getAttribute('data-page-id'));
      if (!editor || editor.isDestroyed) return;

      // IMAGE — highest priority
      const domImg = target.closest('img');
      if (domImg) {
        const info = findImageNode(editor, domImg);
        if (info) {
          e.preventDefault();
          setPos({ x: e.clientX, y: e.clientY });
          setMenu({
            kind: 'image',
            x: e.clientX,
            y: e.clientY,
            editor,
            imagePos: info.pos,
            imageAttrs: info.attrs,
            canMergeCells: false,
          });
        }
        return;
      }

      // Move the editor caret to the clicked point unless the click landed
      // inside an existing selection (e.g. a multi-cell CellSelection).
      const coords = editor.view.posAtCoords({ left: e.clientX, top: e.clientY });
      const clickedPos = coords?.pos ?? null;
      const sel = editor.state.selection;
      if (clickedPos !== null && (clickedPos < sel.from || clickedPos > sel.to)) {
        try {
          editor.commands.setTextSelection(clickedPos);
        } catch {
          /* ignore invalid positions */
        }
      }

      // TABLE
      if (target.closest('td,th')) {
        e.preventDefault();
        setPos({ x: e.clientX, y: e.clientY });
        setMenu({
          kind: 'table',
          x: e.clientX,
          y: e.clientY,
          editor,
          imagePos: null,
          imageAttrs: {},
          canMergeCells: editor.state.selection instanceof CellSelection,
        });
        return;
      }

      // TEXT — anything else inside a live editor
      e.preventDefault();
      setPos({ x: e.clientX, y: e.clientY });
      setMenu({
        kind: 'text',
        x: e.clientX,
        y: e.clientY,
        editor,
        imagePos: null,
        imageAttrs: {},
        canMergeCells: false,
      });
    },
    [containerRef],
  );

  // contextmenu + dblclick listeners on the pages container (capture)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onOpen = (e: Event) => handleOpen(e as MouseEvent);
    container.addEventListener('contextmenu', onOpen, true);
    container.addEventListener('dblclick', onOpen, true);
    return () => {
      container.removeEventListener('contextmenu', onOpen, true);
      container.removeEventListener('dblclick', onOpen, true);
    };
  }, [containerRef, handleOpen]);

  // close on click-outside / Escape / scroll (capture) / resize
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        close();
      }
    };
    const onScroll = (e: Event) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      close();
    };
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && e.target instanceof Node && menuRef.current.contains(e.target)) return;
      close();
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('pointerdown', onPointerDown, true);
      window.removeEventListener('resize', close);
    };
  }, [menu]);

  // viewport flipping (before paint) + initial focus
  useLayoutEffect(() => {
    if (!menu) return;
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let x = menu.x;
    let y = menu.y;
    if (x + rect.width > window.innerWidth - margin) x = menu.x - rect.width;
    if (y + rect.height > window.innerHeight - margin) y = menu.y - rect.height;
    x = Math.max(margin, Math.min(x, window.innerWidth - rect.width - margin));
    y = Math.max(margin, Math.min(y, window.innerHeight - rect.height - margin));
    setPos({ x, y });
    el.querySelector<HTMLElement>('[data-menu-item]:not([disabled])')?.focus();
  }, [menu]);

  /** Arrow/Home/End navigation between menu items (Enter activates via the focused button). */
  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const el = menuRef.current;
    if (!el) return;
    const list = Array.from(el.querySelectorAll<HTMLElement>('[data-menu-item]:not([disabled])'));
    if (list.length === 0) return;
    const idx = list.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      (idx === -1 ? list[0] : list[(idx + 1) % list.length]).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      (idx === -1 ? list[list.length - 1] : list[(idx - 1 + list.length) % list.length]).focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      list[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      list[list.length - 1].focus();
    }
  };

  if (!menu) {
    return (
      <>
        <ImageResizeHost suppressed={sizeDialog !== null} />
        <TableToolbarHost suppressed={sizeDialog !== null} />
        {sizeDialog ? <ImageSizeDialog state={sizeDialog} onClose={() => setSizeDialog(null)} /> : null}
        {/* মেনু বন্ধের পরেও লিংক-ডায়ালগ খোলা থাকতে পারে */}
        <LinkDialog state={linkDialog} onClose={() => setLinkDialog(EMPTY_LINK_DIALOG)} />
      </>
    );
  }

  const ed = menu.editor;

  /** Close the menu, then run the command against the resolved editor (deferred). */
  const closeAndRun = (fn: (editor: Editor) => void) => {
    setMenu(null);
    window.setTimeout(() => {
      try {
        if (!ed.isDestroyed) fn(ed);
      } catch {
        /* ignore command failures */
      }
    }, 0);
  };

  // ── image state ──
  const imgWidth = typeof menu.imageAttrs.width === 'string' ? menu.imageAttrs.width : null;
  const imgAlign = typeof menu.imageAttrs.textAlign === 'string' ? menu.imageAttrs.textAlign : null;
  const imgFloat =
    menu.imageAttrs.float === 'left' || menu.imageAttrs.float === 'right'
      ? (menu.imageAttrs.float as 'left' | 'right')
      : 'none';
  const imgFramed = menu.imageAttrs.framed === true;
  const imgLinkHref = typeof menu.imageAttrs.linkHref === 'string' ? menu.imageAttrs.linkHref : '';
  const imgLinkTarget = menu.imageAttrs.linkTarget === null ? false : true; // default _blank
  const setImage = (patch: Record<string, unknown>) =>
    closeAndRun((editor) => {
      if (menu.imagePos === null) return;
      editor.chain().focus().setNodeSelection(menu.imagePos).updateAttributes('image', patch).run();
    });

  // ── table state ──
  let cellAlign: string | null = null;
  let cellBg: string | null = null;
  let cellVAlign: string | null = null;
  const $head = ed.state.selection.$head;
  for (let d = $head.depth; d > 0; d--) {
    const node = $head.node(d);
    if (node.type.name === 'tableCell' || node.type.name === 'tableHeader') {
      cellAlign = (node.childCount > 0 ? (node.child(0).attrs.textAlign as string | undefined) : null) ?? null;
      cellBg = (node.attrs.backgroundColor as string | null) ?? null;
      cellVAlign = (node.attrs.verticalAlign as string | null) ?? null;
      break;
    }
  }

  // ── text state ──
  const currentColor = (ed.getAttributes('textStyle').color as string | undefined) ?? null;
  const currentHighlight = (ed.getAttributes('highlight').color as string | undefined) ?? null;
  const activeLink = (ed.getAttributes('link').href as string | undefined) ?? '';

  const imageSections: CtxSection[] = [
    {
      header: 'সাইজ',
      items: [
        {
          id: 'img-size-dialog',
          label: 'ছবির সাইজ ও পজিশন…',
          icon: Ruler,
          onSelect: () => {
            if (menu.imagePos === null) return;
            setSizeDialog({ editor: ed, pos: menu.imagePos, attrs: { ...menu.imageAttrs } });
            setMenu(null);
          },
        },
        { id: 'img-w30', label: 'ছোট — ৩০%', icon: Minimize2, active: imgWidth === '30%', onSelect: () => setImage({ width: '30%' }) },
        { id: 'img-w55', label: 'মাঝারি — ৫৫%', icon: SquareDashed, active: imgWidth === '55%', onSelect: () => setImage({ width: '55%' }) },
        { id: 'img-w80', label: 'বড় — ৮০%', icon: Maximize2, active: imgWidth === '80%', onSelect: () => setImage({ width: '80%' }) },
        { id: 'img-w100', label: 'পূর্ণ প্রস্থ — ১০০%', icon: Expand, active: imgWidth === '100%', onSelect: () => setImage({ width: '100%' }) },
      ],
    },
    {
      header: 'অ্যালাইন',
      items: [
        { id: 'img-left', label: 'বামে', icon: AlignLeft, active: imgAlign === 'left', onSelect: () => setImage({ textAlign: 'left', float: 'none' }) },
        { id: 'img-center', label: 'মাঝখানে', icon: AlignCenter, active: imgAlign === 'center', onSelect: () => setImage({ textAlign: 'center', float: 'none' }) },
        { id: 'img-right', label: 'ডানে', icon: AlignRight, active: imgAlign === 'right', onSelect: () => setImage({ textAlign: 'right', float: 'none' }) },
      ],
    },
    {
      header: 'টেক্সট র‍্যাপ',
      items: [
        { id: 'img-float-left', label: 'ছবি বাঁয়ে — লেখা ডান পাশে', icon: WrapText, active: imgFloat === 'left', onSelect: () => setImage({ float: 'left' }) },
        { id: 'img-float-right', label: 'ছবি ডানে — লেখা বাঁ পাশে', icon: WrapText, active: imgFloat === 'right', onSelect: () => setImage({ float: 'right' }) },
        { id: 'img-float-none', label: 'র‍্যাপ বন্ধ (নিজস্ব লাইনে)', icon: UnfoldVertical, active: imgFloat === 'none', onSelect: () => setImage({ float: 'none' }) },
      ],
    },
    {
      header: 'ফ্রেম',
      items: [
        {
          id: 'img-frame',
          label: imgFramed ? 'বর্ডার সরান' : 'বর্ডার যোগ করুন',
          icon: Frame,
          active: imgFramed,
          onSelect: () => setImage({ framed: !imgFramed }),
        },
      ],
    },
    {
      header: 'লিংক',
      items: [
        {
          id: 'img-link-add',
          label: imgLinkHref ? 'লিংক সম্পাদনা…' : 'ছবিতে লিংক যোগ করুন…',
          icon: Link2,
          active: Boolean(imgLinkHref),
          onSelect: () => {
            setMenu(null);
            setLinkDialog({
              open: true,
              mode: 'image',
              editor: ed,
              imagePos: menu.imagePos,
              initialHref: imgLinkHref,
              initialNewTab: imgLinkTarget,
              initialText: '',
            });
          },
        },
        ...(imgLinkHref
          ? [
              {
                id: 'img-link-open' as const,
                label: 'লিংক খুলুন',
                icon: ExternalLink,
                onSelect: () => {
                  setMenu(null);
                  window.open(imgLinkHref, '_blank', 'noopener,noreferrer');
                },
              },
              {
                id: 'img-link-remove' as const,
                label: 'লিংক মুছুন',
                icon: Link2Off,
                onSelect: () => setImage({ linkHref: null, linkTarget: null }),
              },
            ]
          : []),
      ],
    },
    {
      items: [
        {
          id: 'img-copy',
          label: 'ছবি কপি করুন',
          icon: Copy,
          onSelect: () => {
            const src = typeof menu.imageAttrs.src === 'string' ? menu.imageAttrs.src : '';
            setMenu(null);
            if (!src) return;
            const fallback = () => {
              navigator.clipboard?.writeText(src).catch(() => toast.error('ছবি কপি করা যায়নি'));
            };
            try {
              fetch(src)
                .then((res) => res.blob())
                .then((blob) => {
                  if (typeof ClipboardItem === 'undefined' || !navigator.clipboard?.write) {
                    throw new Error('clipboard unsupported');
                  }
                  return navigator.clipboard.write([new ClipboardItem({ [blob.type || 'image/png']: blob })]);
                })
                .catch(() => fallback());
            } catch {
              fallback();
            }
          },
        },
        {
          id: 'img-delete',
          label: 'ছবি মুছুন',
          icon: Trash2,
          danger: true,
          onSelect: () =>
            closeAndRun((editor) => {
              if (menu.imagePos === null) return;
              editor.chain().focus().setNodeSelection(menu.imagePos).deleteSelection().run();
            }),
        },
      ],
    },
  ];

  const tableSections: CtxSection[] = [
    {
      header: 'যোগ করুন',
      items: [
        { id: 'row-above', label: 'উপরে সারি যোগ', icon: ArrowUpToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().addRowBefore().run(); }) },
        { id: 'row-below', label: 'নিচে সারি যোগ', icon: ArrowDownToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().addRowAfter().run(); }) },
        { id: 'col-left', label: 'বামে কলাম', icon: ArrowLeftToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().addColumnBefore().run(); }) },
        { id: 'col-right', label: 'ডানে কলাম', icon: ArrowRightToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().addColumnAfter().run(); }) },
      ],
    },
    {
      header: 'হেডার',
      items: [
        { id: 'header-row', label: 'হেডার সারি চালু/বন্ধ', icon: PanelTop, onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleHeaderRow().run(); }) },
        { id: 'header-col', label: 'হেডার কলাম চালু/বন্ধ', icon: PanelLeft, onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleHeaderColumn().run(); }) },
      ],
    },
    {
      header: 'সেল',
      items: [
        {
          id: 'merge-cells',
          label: 'সেল মার্জ',
          icon: Merge,
          disabled: !menu.canMergeCells,
          onSelect: () => closeAndRun((editor) => { editor.chain().focus().mergeCells().run(); }),
        },
        { id: 'split-cell', label: 'সেল স্প্লিট', icon: Split, onSelect: () => closeAndRun((editor) => { editor.chain().focus().splitCell().run(); }) },
        { id: 'v-align-top', label: 'সেল ভার্টিক্যাল অ্যালাইন — উপরে', icon: AlignStartVertical, active: !cellVAlign || cellVAlign === 'top', onSelect: () => closeAndRun((editor) => { editor.chain().focus().setCellAttribute('verticalAlign', 'top').run(); }) },
        { id: 'v-align-middle', label: 'সেল ভার্টিক্যাল অ্যালাইন — মাঝখানে', icon: AlignCenterVertical, active: cellVAlign === 'middle', onSelect: () => closeAndRun((editor) => { editor.chain().focus().setCellAttribute('verticalAlign', 'middle').run(); }) },
        { id: 'v-align-bottom', label: 'সেল ভার্টিক্যাল অ্যালাইন — নিচে', icon: AlignEndVertical, active: cellVAlign === 'bottom', onSelect: () => closeAndRun((editor) => { editor.chain().focus().setCellAttribute('verticalAlign', 'bottom').run(); }) },
        {
          id: 'reset-colwidth',
          label: 'সেলের প্রস্থ রিসেট',
          icon: RotateCcw,
          onSelect: () => closeAndRun((editor) => { editor.chain().focus().setCellAttribute('colwidth', null).run(); }),
        },
        {
          id: 'cell-bg',
          render: () => (
            <SwatchRow
              icon={Paintbrush}
              label="সেলের রং"
              colors={CELL_BG_COLORS}
              current={cellBg}
              onPick={(color) =>
                closeAndRun((editor) => {
                  editor.chain().focus().setCellAttribute('backgroundColor', color === 'transparent' ? null : color).run();
                })
              }
            />
          ),
        },
      ],
    },
    {
      header: 'অ্যালাইন',
      items: [
        { id: 'cell-left', label: 'বামে', icon: AlignLeft, active: cellAlign === 'left', onSelect: () => closeAndRun((editor) => { editor.chain().focus().setTextAlign('left').run(); }) },
        { id: 'cell-center', label: 'মাঝখানে', icon: AlignCenter, active: cellAlign === 'center', onSelect: () => closeAndRun((editor) => { editor.chain().focus().setTextAlign('center').run(); }) },
        { id: 'cell-right', label: 'ডানে', icon: AlignRight, active: cellAlign === 'right', onSelect: () => closeAndRun((editor) => { editor.chain().focus().setTextAlign('right').run(); }) },
      ],
    },
    {
      header: 'সরান',
      items: [
        { id: 'tbl-move-up', label: 'টেবিল উপরে সরান', icon: ChevronsUp, shortcut: 'Alt+↑', onSelect: () => closeAndRun((editor) => { editor.chain().focus().moveBlockUp().run(); }) },
        { id: 'tbl-move-down', label: 'টেবিল নিচে সরান', icon: ChevronsDown, shortcut: 'Alt+↓', onSelect: () => closeAndRun((editor) => { editor.chain().focus().moveBlockDown().run(); }) },
        { id: 'tbl-line-above', label: 'উপরে ফাঁকা লাইন', icon: ArrowUpToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().insertLineAbove().run(); }) },
        { id: 'tbl-line-below', label: 'নিচে ফাঁকা লাইন', icon: ArrowDownToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().insertLineAfter().run(); }) },
      ],
    },
    {
      header: 'মুছুন',
      items: [
        { id: 'del-row', label: 'সারি মুছুন', icon: Trash2, danger: true, onSelect: () => closeAndRun((editor) => { editor.chain().focus().deleteRow().run(); }) },
        { id: 'del-col', label: 'কলাম মুছুন', icon: Trash2, danger: true, onSelect: () => closeAndRun((editor) => { editor.chain().focus().deleteColumn().run(); }) },
        { id: 'del-table', label: 'টেবিল মুছুন', icon: Trash2, danger: true, onSelect: () => closeAndRun((editor) => { editor.chain().focus().deleteTable().run(); }) },
      ],
    },
  ];

  const textSections: CtxSection[] = [
    {
      header: 'Clipboard',
      items: [
        {
          id: 'cut',
          label: 'Cut',
          icon: Scissors,
          shortcut: 'Ctrl+X',
          onSelect: () =>
            closeAndRun((editor) => {
              const text = selectionText(editor);
              if (text) navigator.clipboard?.writeText(text).catch(() => {});
              editor.chain().focus().deleteSelection().run();
            }),
        },
        {
          id: 'copy',
          label: 'Copy',
          icon: Copy,
          shortcut: 'Ctrl+C',
          onSelect: () =>
            closeAndRun((editor) => {
              const text = selectionText(editor);
              if (text) navigator.clipboard?.writeText(text).catch(() => {});
              editor.commands.focus();
            }),
        },
        {
          id: 'paste',
          label: 'Paste',
          icon: ClipboardPaste,
          shortcut: 'Ctrl+V',
          onSelect: () =>
            closeAndRun((editor) => {
              const clipboard = navigator.clipboard;
              if (!clipboard?.readText) {
                toast.error('Press Ctrl+V to paste');
                return;
              }
              clipboard
                .readText()
                .then((text) => insertPlainText(editor, text))
                .catch(() => toast.error('Press Ctrl+V to paste'));
            }),
        },
        { id: 'select-all', label: 'Select All', icon: TextCursorInput, shortcut: 'Ctrl+A', onSelect: () => closeAndRun((editor) => { editor.chain().focus().selectAll().run(); }) },
      ],
    },
    {
      header: 'Format',
      items: [
        { id: 'bold', label: 'Bold', icon: Bold, shortcut: 'Ctrl+B', active: ed.isActive('bold'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleBold().run(); }) },
        { id: 'italic', label: 'Italic', icon: Italic, shortcut: 'Ctrl+I', active: ed.isActive('italic'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleItalic().run(); }) },
        { id: 'underline', label: 'Underline', icon: UnderlineIcon, shortcut: 'Ctrl+U', active: ed.isActive('underline'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleUnderline().run(); }) },
        { id: 'strike', label: 'Strikethrough', icon: Strikethrough, active: ed.isActive('strike'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleStrike().run(); }) },
        { id: 'superscript', label: 'Superscript', icon: SupIcon, active: ed.isActive('superscript'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleSuperscript().run(); }) },
        { id: 'subscript', label: 'Subscript', icon: SubIcon, active: ed.isActive('subscript'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleSubscript().run(); }) },
      ],
    },
    {
      header: 'Color',
      items: [
        {
          id: 'text-color-row',
          render: () => (
            <SwatchRow
              icon={Palette}
              label="Text"
              colors={TEXT_COLORS}
              current={currentColor}
              onPick={(color) => closeAndRun((editor) => { editor.chain().focus().setColor(color).run(); })}
            />
          ),
        },
        {
          id: 'highlight-row',
          render: () => (
            <SwatchRow
              icon={Highlighter}
              label="Highlight"
              colors={HIGHLIGHT_COLORS}
              current={currentHighlight}
              onPick={(color) => closeAndRun((editor) => { editor.chain().focus().setHighlight({ color }).run(); })}
            />
          ),
        },
        { id: 'color-default', label: 'Default', icon: Eraser, onSelect: () => closeAndRun((editor) => { editor.chain().focus().unsetColor().unsetHighlight().run(); }) },
      ],
    },
    {
      header: 'Link',
      items: [
        {
          id: 'tx-link-add',
          label: activeLink ? 'লিংক সম্পাদনা…' : 'লিংক যোগ করুন…',
          icon: Link2,
          active: Boolean(activeLink),
          onSelect: () => {
            const text = selectionText(ed);
            setMenu(null);
            setLinkDialog({
              open: true,
              mode: 'text',
              editor: ed,
              imagePos: null,
              initialHref: activeLink,
              initialNewTab: true,
              initialText: text,
            });
          },
        },
        ...(activeLink
          ? [
              {
                id: 'tx-link-open' as const,
                label: 'লিংক খুলুন',
                icon: ExternalLink,
                onSelect: () => {
                  setMenu(null);
                  window.open(activeLink, '_blank', 'noopener,noreferrer');
                },
              },
              {
                id: 'tx-link-copy' as const,
                label: 'লিংক ঠিকানা কপি',
                icon: Copy,
                onSelect: () => {
                  setMenu(null);
                  navigator.clipboard?.writeText(activeLink).catch(() => {});
                  toast.success('লিংক কপি হয়েছে');
                },
              },
              {
                id: 'tx-link-remove' as const,
                label: 'লিংক মুছুন',
                icon: Link2Off,
                onSelect: () => closeAndRun((editor) => { editor.chain().focus().extendMarkRange('link').unsetLink().run(); }),
              },
            ]
          : []),
      ],
    },
    {
      header: 'Paragraph',
      items: [
        { id: 'align-left', label: 'Align Left', icon: AlignLeft, active: ed.isActive({ textAlign: 'left' }), onSelect: () => closeAndRun((editor) => { editor.chain().focus().setTextAlign('left').run(); }) },
        { id: 'align-center', label: 'Align Center', icon: AlignCenter, active: ed.isActive({ textAlign: 'center' }), onSelect: () => closeAndRun((editor) => { editor.chain().focus().setTextAlign('center').run(); }) },
        { id: 'align-right', label: 'Align Right', icon: AlignRight, active: ed.isActive({ textAlign: 'right' }), onSelect: () => closeAndRun((editor) => { editor.chain().focus().setTextAlign('right').run(); }) },
        { id: 'align-justify', label: 'Justify', icon: AlignJustify, active: ed.isActive({ textAlign: 'justify' }), onSelect: () => closeAndRun((editor) => { editor.chain().focus().setTextAlign('justify').run(); }) },
        { id: 'bullets', label: 'Bullets', icon: List, active: ed.isActive('bulletList'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleBulletList().run(); }) },
        { id: 'numbering', label: 'Numbering', icon: ListOrdered, active: ed.isActive('orderedList'), onSelect: () => closeAndRun((editor) => { editor.chain().focus().toggleOrderedList().run(); }) },
        { id: 'clear-format', label: 'Clear Formatting', icon: Eraser, onSelect: () => closeAndRun((editor) => { editor.chain().focus().unsetAllMarks().clearNodes().run(); }) },
      ],
    },
    {
      header: 'Block',
      items: [
        { id: 'blk-move-up', label: 'ব্লক উপরে সরান', icon: ChevronsUp, shortcut: 'Alt+↑', onSelect: () => closeAndRun((editor) => { editor.chain().focus().moveBlockUp().run(); }) },
        { id: 'blk-move-down', label: 'ব্লক নিচে সরান', icon: ChevronsDown, shortcut: 'Alt+↓', onSelect: () => closeAndRun((editor) => { editor.chain().focus().moveBlockDown().run(); }) },
        { id: 'blk-line-above', label: 'উপরে ফাঁকা লাইন', icon: ArrowUpToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().insertLineAbove().run(); }) },
        { id: 'blk-line-below', label: 'নিচে ফাঁকা লাইন', icon: ArrowDownToLine, onSelect: () => closeAndRun((editor) => { editor.chain().focus().insertLineAfter().run(); }) },
      ],
    },
  ];

  const sections =
    menu.kind === 'image' ? imageSections : menu.kind === 'table' ? tableSections : textSections;

  const mediaHosts = (
    <>
      <ImageResizeHost suppressed={sizeDialog !== null} />
      <TableToolbarHost suppressed={sizeDialog !== null} />
      {sizeDialog ? <ImageSizeDialog state={sizeDialog} onClose={() => setSizeDialog(null)} /> : null}
    </>
  );

  return (
    <>
      {createPortal(
        <div
          ref={menuRef}
          role="menu"
          aria-label="Content menu"
          tabIndex={-1}
          className="fixed z-[1000] max-h-[70vh] min-w-[230px] overflow-y-auto rounded-xl border border-border bg-popover py-1.5 text-popover-foreground shadow-lg focus:outline-none"
          style={{ left: pos.x, top: pos.y }}
          onKeyDown={onMenuKeyDown}
        >
          {sections.map((section, si) => (
            <Fragment key={`${section.header ?? 'section'}-${si}`}>
              {si > 0 ? <div className="mx-2 my-1 h-px bg-border" role="separator" /> : null}
              {section.header ? (
                <div className="px-3 pb-0.5 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {section.header}
                </div>
              ) : null}
              {section.items.map((item) =>
                item.render ? (
                  <Fragment key={item.id}>{item.render()}</Fragment>
                ) : (
                  <MenuItemButton key={item.id} item={item} />
                ),
              )}
            </Fragment>
          ))}
        </div>,
        document.body,
      )}
      {mediaHosts}
      <LinkDialog state={linkDialog} onClose={() => setLinkDialog(EMPTY_LINK_DIALOG)} />
    </>
  );
}
