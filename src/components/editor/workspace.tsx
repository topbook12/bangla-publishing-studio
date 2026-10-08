/**
 * ওয়ার্কস্পেস — পৃষ্ঠার তালিকা, জুম, পৃষ্ঠা মেনু ও নতুন পৃষ্ঠা বোতাম
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  ArrowDown, ArrowUp, ArrowUpToLine, ChevronDown, Copy, Eye, EyeOff, FilePlus2, RotateCcw, Settings2, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditorStore, flushSave } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { getEditor } from '@/lib/editor-registry';
import { t, useT, useFmtNum } from '@/lib/i18n';
import { availableHeightOfEditor, fillFromNextPage } from './page-ops';
import { getPageDimensionsMm, mmToPx } from '@/lib/paper';
import { PaperPage } from './paper-page';
import { PageEditor } from './page-editor';
import { ContextMenuHost } from './context-menu';
import { AiBubbleHost } from './ai-bubble';

function PageMenu({ pageId, index }: { pageId: string; index: number }) {
  const addPage = useEditorStore((s) => s.addPage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);
  const movePage = useEditorStore((s) => s.movePage);
  const updatePage = useEditorStore((s) => s.updatePage);
  const totalPages = useEditorStore((s) => s.pages.length);
  const tt = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="page-menu-btn no-print" aria-label={tt('ws.page.menu', 'Page menu')}>
          {tt('ws.page.menu', 'Page menu')} <ChevronDown size={13} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="no-print">
        <DropdownMenuItem onClick={() => { const id = addPage(pageId); useEditorStore.getState().setActivePage(id); }}>
          <FilePlus2 size={14} /> {tt('ws.page.newAfter', 'New page after this one')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicatePage(pageId)}>
          <Copy size={14} /> {tt('ws.page.duplicate', 'Duplicate page')}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={index >= useEditorStore.getState().pages.length - 1}
          onClick={() => {
            const editor = getEditor(pageId);
            if (!editor || editor.isDestroyed) {
              toast.info(tt('ws.toast.pullOpen', "That page isn't open yet — click on it and try again"));
              return;
            }
            void fillFromNextPage(editor, pageId, availableHeightOfEditor(pageId)).then((res) => {
              if (res.status === 'moved') {
                toast.success(tt('ws.toast.pullMoved', 'Text was pulled up from the next page to fill the empty space'));
              } else if (res.status === 'absorbed') {
                toast.success(tt('ws.toast.pullAbsorbed', 'All the text from the next page moved onto this page — the empty page was deleted'));
              } else if (res.status === 'none') {
                toast.info(tt('ws.toast.pullNoFit', "The next page's first block doesn't fit in the empty space"));
              } else {
                toast.info(tt('ws.toast.pullNone', 'There is no content after this page to pull'));
              }
            });
          }}
        >
          <ArrowUpToLine size={14} /> {tt('ws.page.pullUp', 'Pull text from the next page onto this page')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => movePage(pageId, -1)} disabled={index === 0}>
          <ArrowUp size={14} /> {tt('ws.page.moveUp', 'Move up')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => movePage(pageId, 1)} disabled={index >= totalPages - 1}>
          <ArrowDown size={14} /> {tt('ws.page.moveDown', 'Move down')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => updatePage(pageId, { noChrome: !useEditorStore.getState().pages.find((p) => p.id === pageId)?.noChrome })}>
          {useEditorStore.getState().pages.find((p) => p.id === pageId)?.noChrome
            ? <><Eye size={14} /> {tt('ws.page.showChrome', 'Show header/footer')}</>
            : <><EyeOff size={14} /> {tt('ws.page.hideChrome', 'Hide header/footer')}</>}
        </DropdownMenuItem>
        {(() => {
          const pg = useEditorStore.getState().pages.find((p) => p.id === pageId);
          const hasCustom = Boolean(pg?.headerOverride || pg?.footerOverride);
          return (
            <>
              <DropdownMenuItem onClick={() => useUiStore.getState().openPageChrome(pageId)}>
                <Settings2 size={14} /> {hasCustom ? tt('ws.page.editCustom', 'Edit this page’s custom header/footer…') : tt('ws.page.customizeChrome', 'Customize this page’s header/footer…')}
              </DropdownMenuItem>
              {hasCustom ? (
                <DropdownMenuItem
                  onClick={() => {
                    updatePage(pageId, { headerOverride: null, footerOverride: null });
                    toast.info(tt('ws.toast.chromeReset', "This page's header/footer has been reset to the global master"));
                  }}
                >
                  <RotateCcw size={14} /> {tt('ws.page.resetChrome', 'Revert to the global header/footer')}
                </DropdownMenuItem>
              ) : null}
            </>
          );
        })()}
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => deletePage(pageId)}
          disabled={useEditorStore.getState().pages.length <= 1}
        >
          <Trash2 size={14} /> {tt('ws.page.delete', 'Delete page')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Workspace() {
  const pages = useEditorStore((s) => s.pages);
  const settings = useEditorStore((s) => s.settings);
  const zoom = useEditorStore((s) => s.zoom);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const tt = useT();
  const fn = useFmtNum();
  const scrollRef = useRef<HTMLDivElement>(null);

  // অটোসেভ ফ্লাশ — ট্যাব বন্ধের আগে
  useEffect(() => {
    const handler = () => flushSave();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  // Ctrl+S — হেল্প-গাইডে "সেভ" হিসেবে ডকুমেন্টেড; হ্যান্ডলার না থাকলে
  // ব্রাউজারের "Save page as…" ডায়ালগ খুলে বিভ্রান্তি হত
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        void flushSave().then(() => {
          const cur = useEditorStore.getState();
          if (cur.saveState.status !== 'error') {
            cur.setSaveState({ status: 'saved', at: Date.now() });
          }
          // এফেক্ট একবারই রেজিস্টার হয় — চলতি ভাষার টোস্টের জন্য t() (tt নয়)
          toast.success(t('ws.toast.saved', 'Saved — autosave is always on'));
        });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ছোট স্ক্রিনে পৃষ্ঠা স্ক্রিনের প্রস্থে ফিট করা
  useEffect(() => {
    const fit = () => {
      const el = scrollRef.current;
      if (!el) return;
      const s = useEditorStore.getState();
      const dims = getPageDimensionsMm(s.settings.paperSize, s.settings.orientation, s.settings.customPaper);
      const pagePx = mmToPx(dims.widthMm) + 44;
      if (el.clientWidth < pagePx) {
        s.setZoom(el.clientWidth / pagePx);
      }
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [settings.paperSize, settings.orientation, settings.customPaper.widthMm, settings.customPaper.heightMm]);

  // Ctrl/⌘ + মাউস-হুইল জুম — MS Word-এর মতো প্রিমিয়াম অভিজ্ঞতা।
  // সাধারণ স্ক্রল (Ctrl ছাড়া) সম্পূর্ণ অক্ষত থাকে; ক্ল্যাম্প store-এর setZoom-এই (০.৩৫–২)।
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      e.preventDefault();
      const { zoom, setZoom } = useEditorStore.getState();
      setZoom(zoom - e.deltaY * 0.0018);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  return (
    <main
      ref={scrollRef}
      className="workspace flex-1 overflow-auto bg-slate-200/70 dark:bg-slate-900 print:!bg-white print:!overflow-visible"
      aria-label={tt('ws.pages.aria', 'Book pages')}
    >
      <div
        className="workspace-inner"
        style={{ zoom, ...(settings.singleColor ? { ['--book-ink' as string]: settings.singleColor } : {}) }}
        {...(settings.singleColor ? { 'data-one-color': settings.singleColor } : {})}
      >
        {pages.map((page, index) => (
          <section key={page.id} className="page-slot relative" aria-label={tt('ws.page.n', 'Page {n}').split('{n}').join(fn(index + 1))}>
            <div className="page-toolbar no-print" aria-hidden="true">
              <span className="page-slot-index">{fn(index + 1)}</span>
              <PageMenu pageId={page.id} index={index} />
            </div>
            <PaperPage
              page={page}
              index={index}
              settings={settings}
              active={activePageId === page.id}
              onPageClick={() => setActivePage(page.id)}
            >
              {page.kind === 'normal' ? (
                <PageEditor page={page} index={index} isFirstPage={index === 0} />
              ) : null}
            </PaperPage>
          </section>
        ))}

        <div className="flex justify-center pb-16 pt-2 no-print">
          <Button
            variant="outline"
            className="gap-2 bg-white/80"
            onClick={() => {
              const id = useEditorStore.getState().addPage(null);
              useEditorStore.getState().setActivePage(id);
            }}
          >
            <FilePlus2 size={15} /> {tt('ws.page.addNew', 'Add a new page')}
          </Button>
        </div>
      </div>

      {/* MS Word-style right-click / double-click menus (portal — fixed position) */}
      <ContextMenuHost containerRef={scrollRef} />
      {/* সিলেকশনে ভাসমান ✦ AI পিল + অ্যাকশন প্যানেল (portal) */}
      <AiBubbleHost />
    </main>
  );
}
