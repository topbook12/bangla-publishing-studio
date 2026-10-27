/**
 * পৃষ্ঠা-থাম্বনেইল প্যানেল — PDF রিডার-ধাঁচের কমপ্যাক্ট পাতার সাইডবার
 *
 * প্রতিটি থাম্বনেইল আসল পাতার ১:১ স্ট্যাটিক রেন্ডার (PageHeader + StaticContent +
 * PageFooter, প্রচ্ছদে CoverView) — তারপর CSS transform দিয়ে ছোট করা। তাই
 * কাগজের রং, বর্ডার, ফন্ট, ওয়াটারমার্ক, single-color মোড — সবই ছাপার মতোই দেখায়।
 *
 * পারফরম্যান্স:
 *  - প্রতি থাম্বনেইল memo — এক পাতা সম্পাদনালে শুধু সেই থাম্বনেইল রি-রেন্ডার হয়
 *    (PaperPage-এর memo কৌশলই, কারণ updatePageHtml শুধু সম্পাদিত পাতার এন্ট্রি ক্লোন করে)
 *  - content-visibility: auto — ভিউপোর্টের বাইরের থাম্বনেইল ব্রাউজার আঁকেই না
 *  - pointer-events নেই + aria-hidden — ভেতরের স্ট্যাটিক কনটেন্ট কখনো ফোকাস/ক্লিক নেয় না
 */

'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, ListEnd, ListStart, Trash2, type LucideIcon } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { getPageDimensionsMm, mmToPx, pageBorderVisual } from '@/lib/paper';
import { effectivePageSize, effectivePageStyle, effectivePageTypography } from '@/lib/page-layout';
import { useT, useFmtNum } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import type { DocumentSettings, PageData } from '@/lib/types';
import { PageFooter, PageHeader, PageWatermark, pageFontStyle, pagePaddingStyle } from '../editor/page-chrome';
import { CoverView } from '../editor/cover-view';
import { StaticContent } from '../editor/static-content';

/** থাম্বনেইলের প্রস্থ (px) — প্যানেলের ২৬৪px-এ আরামদায়ক এক-কলাম */
const THUMB_W = 196;
/** লম্বা/কাস্টম কাগজে উচ্চতার সিলিং — প্যানেল চওড়া না হয়ে স্কেল কমে */
const THUMB_MAX_H = 336;

/** থাম্বনেইল DOM রেজিস্ট্রি — অ্যাকটিভ পাতা বদলালে scrollIntoView-র জন্য */
const thumbRegistry = new Map<string, HTMLButtonElement>();

/** একটি পাতার স্কেলড স্ট্যাটিক প্রিভিউ */
const PageThumb = memo(
  function PageThumb({
    page,
    index,
    settings,
    active,
    onClick,
    onContextMenu,
  }: {
    page: PageData;
    index: number;
    settings: DocumentSettings;
    active: boolean;
    onClick: () => void;
    onContextMenu?: (e: React.MouseEvent) => void;
  }) {
    const tt = useT();
    const fn = useFmtNum();

    // পাতার কার্যকর কাগজের মাপ — per-page paperSizeOverride সচেতন (মিশ্র-মাপ
    // ডকুমেন্টে প্রশ্নপত্রের Legal/A5 পাতাও নিজের মাপেই থাম্বনেইল দেখায়)
    const { widthMm, heightMm } = getPageDimensionsMm(effectivePageSize(page, settings), settings.orientation, settings.customPaper);
    const pageW = mmToPx(widthMm);
    const pageH = mmToPx(heightMm);
    const scale = Math.min(THUMB_W / pageW, THUMB_MAX_H / pageH);
    const viewW = Math.round(pageW * scale);
    const viewH = Math.round(pageH * scale);

    const isCover = page.kind === 'cover';
    // পাতার কার্যকর রূপ — পাতার নিজস্ব styleOverride-সচেতন (স্ক্রিনের সাথে হুবহু মিল)
    const st = effectivePageStyle(page, settings);
    const paperClass =
      st.paperColor === 'cream'
        ? 'paper-cream'
        : st.paperColor === 'dark'
          ? 'paper-dark'
          : 'paper-white';
    const typoFont = effectivePageTypography(page, settings).defaultFont;

    return (
      <button
        type="button"
        ref={(el) => {
          // অ্যাকটিভ পরিবর্তনে প্যানেল নিজেই থাম্বনেইল স্ক্রল করায় (PageThumbsPanel)
          if (el) thumbRegistry.set(page.id, el);
          else thumbRegistry.delete(page.id);
        }}
        className={cn('page-thumb no-print', active && 'is-active')}
        style={{ ['--pt-w' as string]: `${viewW}px`, ['--pt-h' as string]: `${viewH}px` }}
        aria-label={
          isCover
            ? tt('ws.thumbs.goCover', 'Go to the cover page')
            : tt('ws.thumbs.goto', 'Go to page {n}').split('{n}').join(fn(index + 1))
        }
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        onContextMenu={onContextMenu}
        // দিন ১৯ — ড্র্যাগ-রিঅর্ডার: থাম্বনেইল টেনে পাতার ক্রম বদলানো
        draggable
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = 'move';
          try { e.dataTransfer.setData('text/plain', page.id); } catch { /* নীরব */ }
        }}
      >
        {/* আসল মাপে রেন্ডার → transform scale — ছাপার মতো হুবহু মিনিএচার */}
        <span className="page-thumb-clip" style={{ width: viewW, height: viewH }} aria-hidden="true">
          <span
            className={cn('page-thumb-paper', paperClass)}
            style={{ width: pageW, height: pageH, transform: `scale(${scale})` }}
          >
            <span className="paper-inner" style={{ padding: pagePaddingStyle(page, index, settings) }}>
              <PageWatermark wm={st.watermark} font={typoFont} />
              <PageHeader
                index={index}
                settings={settings}
                pageKind={page.kind}
                noChrome={page.noChrome}
                pageId={page.id}
                headerOverride={page.headerOverride}
              />
              <span className="page-content" style={pageBorderVisual(st)}>
                {isCover && page.coverData ? (
                  <CoverView cover={page.coverData} />
                ) : (
                  <span className="page-content-text" style={pageFontStyle(page, settings)}>
                    <StaticContent html={page.html} />
                  </span>
                )}
              </span>
              <PageFooter
                index={index}
                settings={settings}
                pageKind={page.kind}
                noChrome={page.noChrome}
                pageId={page.id}
                footerOverride={page.footerOverride}
              />
            </span>
          </span>
        </span>
        <span className="page-thumb-num" aria-hidden="true">
          {isCover ? tt('ws.thumbs.cover', 'Cover') : fn(index + 1)}
        </span>
      </button>
    );
  },
  (prev, next) =>
    prev.page === next.page &&
    prev.index === next.index &&
    prev.settings === next.settings &&
    prev.active === next.active,
);

export function PageThumbsPanel() {
  const pages = useEditorStore((s) => s.pages);
  const settings = useEditorStore((s) => s.settings);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const tt = useT();
  const fn = useFmtNum();
  const listRef = useRef<HTMLDivElement>(null);

  const jumpTo = (pageId: string, index: number): void => {
    setActivePage(pageId);
    document
      .querySelector(`.paper-page[data-page-index="${index}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // দিন ১৯ — ড্র্যাগ-রিঅর্ডার: ড্রপ টার্গেট হাইলাইট + movePageTo
  const [dropTarget, setDropTarget] = useState<string | null>(null);

  // দিন ১৯ — থাম্বনেইল রাইট-ক্লিক পেজ-অপস মেনু
  const [thumbMenu, setThumbMenu] = useState<{ x: number; y: number; pageId: string; index: number } | null>(null);
  useEffect(() => {
    if (!thumbMenu) return;
    const close = () => setThumbMenu(null);
    window.addEventListener('pointerdown', close, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('pointerdown', close, true);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [thumbMenu]);

  const moveBy = (pageId: string, dir: -1 | 1) => useEditorStore.getState().movePage(pageId, dir);

  // অ্যাকটিভ পাতা বদলালে (অন্য কোথাও ক্লিক/কীবোর্ডে) সংশ্লিষ্ট থাম্বনেইল দৃশ্যমানে আনা
  useEffect(() => {
    if (!activePageId) return;
    const el = thumbRegistry.get(activePageId);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activePageId]);

  const handleDrop = (draggedRaw: string | null, targetPageId: string, targetIndex: number) => {
    const dragged = draggedRaw?.startsWith('pg-') ? draggedRaw : null;
    setDropTarget(null);
    if (!dragged || dragged === targetPageId) return;
    const from = useEditorStore.getState().pages.findIndex((p) => p.id === dragged);
    if (from < 0) return;
    // ড্রপ-অন = টার্গেটের জায়গা নেওয়া: মুছে-ফেলার পরে টার্গেট-ইনডেক্সেই বসে
    // (দুই দিকেই সঠিক — উপরে টানলে শুরুতে, নিচে টানলে শেষে ঢোকে)
    useEditorStore.getState().movePageTo(dragged, targetIndex);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="px-3 pb-1.5 pt-0.5 text-[10px] leading-snug text-muted-foreground" role="status">
        {tt('ws.thumbs.count', '{n} pages').split('{n}').join(fn(pages.length))}
      </p>
      <div
        ref={listRef}
        className="page-thumb-list nav-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3"
        role="list"
        aria-label={tt('ws.thumbs.aria', 'Page thumbnails')}
        style={
          settings.singleColor
            ? { ['--book-ink' as string]: settings.singleColor }
            : undefined
        }
        {...(settings.singleColor ? { 'data-one-color': settings.singleColor } : {})}
      >
        {pages.map((page, index) => (
          <div
            key={page.id}
            role="listitem"
            className={cn('flex justify-center rounded-md', dropTarget === page.id && 'page-thumb-drop')}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              setDropTarget(page.id);
            }}
            onDragLeave={() => setDropTarget((cur) => (cur === page.id ? null : cur))}
            onDrop={(e) => {
              e.preventDefault();
              handleDrop(e.dataTransfer.getData('text/plain') || null, page.id, index);
            }}
          >
            <PageThumb
              page={page}
              index={index}
              settings={settings}
              active={page.id === activePageId}
              onClick={() => jumpTo(page.id, index)}
              onContextMenu={(e) => {
                e.preventDefault();
                setThumbMenu({ x: e.clientX, y: e.clientY, pageId: page.id, index });
              }}
            />
          </div>
        ))}
      </div>
      {/* স্ক্রিন রিডারের জন্য অর্থবহ এক লাইনের সারসংক্ষেপ */}
      <p className="sr-only">{tt('ws.thumbs.count', '{n} pages').split('{n}').join(fn(pages.length))}</p>

      {/* দিন ১৯ — থাম্বনেইল রাইট-ক্লিক মেনু: পেজ-অপস সরাসরি নেভিগেটর থেকে */}
      {thumbMenu && typeof document !== 'undefined'
        ? createPortal(
            <div
              role="menu"
              aria-label={tt('ws.page.menu', 'Page menu')}
              className="fixed z-[80] min-w-[190px] rounded-lg border border-border bg-popover/95 p-1 shadow-xl backdrop-blur"
              style={{
                left: Math.min(thumbMenu.x, window.innerWidth - 210),
                top: Math.min(thumbMenu.y, window.innerHeight - 220),
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              {(
                [
                  { icon: Copy, label: tt('ws.page.duplicate', 'Duplicate page'), run: () => useEditorStore.getState().duplicatePage(thumbMenu.pageId) },
                  { icon: ListStart, label: tt('ws.page.moveUp', 'Move up'), disabled: thumbMenu.index === 0, run: () => moveBy(thumbMenu.pageId, -1) },
                  { icon: ListEnd, label: tt('ws.page.moveDown', 'Move down'), disabled: thumbMenu.index >= pages.length - 1, run: () => moveBy(thumbMenu.pageId, 1) },
                  { icon: ListStart, label: tt('ws.page.moveToFirst', 'Move to very beginning'), disabled: thumbMenu.index === 0, run: () => useEditorStore.getState().movePageTo(thumbMenu.pageId, 0) },
                  { icon: ListEnd, label: tt('ws.page.moveToEnd', 'Move to very end'), disabled: thumbMenu.index >= pages.length - 1, run: () => useEditorStore.getState().movePageTo(thumbMenu.pageId, pages.length - 1) },
                ] as Array<{ icon: LucideIcon; label: string; disabled?: boolean; run: () => void }>
              ).map((it) => (
                <button
                  key={it.label}
                  type="button"
                  role="menuitem"
                  disabled={it.disabled ?? false}
                  className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-[13px] outline-none transition-colors hover:bg-accent focus:bg-accent disabled:pointer-events-none disabled:opacity-40"
                  onClick={() => { setThumbMenu(null); it.run(); }}
                >
                  <it.icon size={14} aria-hidden="true" />
                  {it.label}
                </button>
              ))}
              <div className="my-1 h-px bg-border" aria-hidden="true" />
              <button
                type="button"
                role="menuitem"
                disabled={pages.length <= 1}
                className="flex w-full items-center gap-2.5 rounded-md px-3 py-1.5 text-left text-[13px] text-red-600 outline-none transition-colors hover:bg-red-500/10 focus:bg-red-500/10 disabled:pointer-events-none disabled:opacity-40"
                onClick={() => { setThumbMenu(null); useEditorStore.getState().deletePage(thumbMenu.pageId); }}
              >
                <Trash2 size={14} aria-hidden="true" /> {tt('ws.page.delete', 'Delete page')}
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
