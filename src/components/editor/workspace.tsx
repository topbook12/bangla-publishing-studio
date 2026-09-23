/**
 * ওয়ার্কস্পেস — পৃষ্ঠার তালিকা, জুম, পৃষ্ঠা মেনু ও নতুন পৃষ্ঠা বোতাম
 */

'use client';

import { useEffect, useRef } from 'react';
import {
  ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, FilePlus2, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditorStore, flushSave } from '@/lib/store';
import { getPageDimensionsMm, mmToPx } from '@/lib/paper';
import { PaperPage } from './paper-page';
import { PageEditor } from './page-editor';
import { ContextMenuHost } from './context-menu';

function PageMenu({ pageId, index }: { pageId: string; index: number }) {
  const addPage = useEditorStore((s) => s.addPage);
  const deletePage = useEditorStore((s) => s.deletePage);
  const duplicatePage = useEditorStore((s) => s.duplicatePage);
  const movePage = useEditorStore((s) => s.movePage);
  const updatePage = useEditorStore((s) => s.updatePage);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className="page-menu-btn no-print" aria-label="পৃষ্ঠা মেনু">
          পৃষ্ঠা মেনু <ChevronDown size={13} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="no-print">
        <DropdownMenuItem onClick={() => { const id = addPage(pageId); useEditorStore.getState().setActivePage(id); }}>
          <FilePlus2 size={14} /> এই পৃষ্ঠার পরে নতুন
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicatePage(pageId)}>
          <Copy size={14} /> পৃষ্ঠা ডুপ্লিকেট
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => movePage(pageId, -1)} disabled={index === 0}>
          <ArrowUp size={14} /> উপরে সরান
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => movePage(pageId, 1)}>
          <ArrowDown size={14} /> নিচে সরান
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => updatePage(pageId, { noChrome: !useEditorStore.getState().pages.find((p) => p.id === pageId)?.noChrome })}>
          {useEditorStore.getState().pages.find((p) => p.id === pageId)?.noChrome
            ? <><Eye size={14} /> হেডার/ফুটার দেখান</>
            : <><EyeOff size={14} /> হেডার/ফুটার লুকান</>}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => deletePage(pageId)}
          disabled={useEditorStore.getState().pages.length <= 1}
        >
          <Trash2 size={14} /> পৃষ্ঠা মুছুন
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // অটোসেভ ফ্লাশ — ট্যাব বন্ধের আগে
  useEffect(() => {
    const handler = () => flushSave();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
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

  return (
    <main
      ref={scrollRef}
      className="workspace flex-1 overflow-auto bg-slate-200/70 dark:bg-slate-900 print:!bg-white print:!overflow-visible"
      aria-label="বইয়ের পৃষ্ঠাসমূহ"
    >
      <div className="workspace-inner" style={{ zoom }}>
        {pages.map((page, index) => (
          <section key={page.id} className="page-slot relative" aria-label={`পৃষ্ঠা ${index + 1}`}>
            <div className="page-toolbar no-print" aria-hidden="true">
              <span className="page-slot-index">{index + 1}</span>
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
            <FilePlus2 size={15} /> নতুন পৃষ্ঠা যোগ করুন
          </Button>
        </div>
      </div>

      {/* MS Word-style right-click / double-click menus (portal — fixed position) */}
      <ContextMenuHost containerRef={scrollRef} />
    </main>
  );
}
