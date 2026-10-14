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

import { memo, useEffect, useRef } from 'react';
import { useEditorStore } from '@/lib/store';
import { getPageDimensionsMm, mmToPx, pageBorderVisual } from '@/lib/paper';
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
  }: {
    page: PageData;
    index: number;
    settings: DocumentSettings;
    active: boolean;
    onClick: () => void;
  }) {
    const tt = useT();
    const fn = useFmtNum();

    const { widthMm, heightMm } = getPageDimensionsMm(settings.paperSize, settings.orientation, settings.customPaper);
    const pageW = mmToPx(widthMm);
    const pageH = mmToPx(heightMm);
    const scale = Math.min(THUMB_W / pageW, THUMB_MAX_H / pageH);
    const viewW = Math.round(pageW * scale);
    const viewH = Math.round(pageH * scale);

    const isCover = page.kind === 'cover';
    const paperClass =
      settings.paperColor === 'cream'
        ? 'paper-cream'
        : settings.paperColor === 'dark'
          ? 'paper-dark'
          : 'paper-white';

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
      >
        {/* আসল মাপে রেন্ডার → transform scale — ছাপার মতো হুবহু মিনিএচার */}
        <span className="page-thumb-clip" style={{ width: viewW, height: viewH }} aria-hidden="true">
          <span
            className={cn('page-thumb-paper', paperClass)}
            style={{ width: pageW, height: pageH, transform: `scale(${scale})` }}
          >
            <span className="paper-inner" style={{ padding: pagePaddingStyle(page, index, settings) }}>
              <PageWatermark settings={settings} />
              <PageHeader
                index={index}
                settings={settings}
                pageKind={page.kind}
                noChrome={page.noChrome}
                pageId={page.id}
                headerOverride={page.headerOverride}
              />
              <span className="page-content" style={pageBorderVisual(settings)}>
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

  // অ্যাকটিভ পাতা বদলালে (অন্য কোথাও ক্লিক/কীবোর্ডে) সংশ্লিষ্ট থাম্বনেইল দৃশ্যমানে আনা
  useEffect(() => {
    if (!activePageId) return;
    const el = thumbRegistry.get(activePageId);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activePageId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <p className="px-3 pb-1.5 pt-0.5 text-[10px] leading-tight text-muted-foreground" role="status">
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
          <div key={page.id} role="listitem" className="flex justify-center">
            <PageThumb
              page={page}
              index={index}
              settings={settings}
              active={page.id === activePageId}
              onClick={() => jumpTo(page.id, index)}
            />
          </div>
        ))}
      </div>
      {/* স্ক্রিন রিডারের জন্য অর্থবহ এক লাইনের সারসংক্ষেপ */}
      <p className="sr-only">{tt('ws.thumbs.count', '{n} pages').split('{n}').join(fn(pages.length))}</p>
    </div>
  );
}
