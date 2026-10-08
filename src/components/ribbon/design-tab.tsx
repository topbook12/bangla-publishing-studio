/**
 * Design tab — book themes, header/footer master, page numbers, cover & TOC
 */

'use client';

import { Crown, LayoutTemplate, PaintBucket, Palette, RefreshCw, Settings2, Store } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RibbonButton, RibbonDivider, RibbonGroup } from './ribbon-shell';
import { BOOK_THEMES } from '@/lib/paper';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { scanTocEntries, updateTocNodes } from '@/lib/toc';
import { getAllEditors, getEditor } from '@/lib/editor-registry';
import { ensurePageEditorMounted } from '@/components/editor/page-ops';
import { formatPageNumber } from '@/lib/bangla';
import { tFmt, useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { OneColorDropdown } from '@/components/dialogs/one-color-picker';
import type { PageNumberFormat } from '@/lib/types';

/** পজিশন id → অভিধান-কী — ট্রিগার ও মেনু আইটেমে একই কী ব্যবহৃত হয় */
const POSITION_LABELS: Record<string, string> = {
  'bottom-center': 'dsn.pos.bottom-center',
  'bottom-right': 'dsn.pos.bottom-right',
  'bottom-left': 'dsn.pos.bottom-left',
  'top-center': 'dsn.pos.top-center',
  'top-right': 'dsn.pos.top-right',
  'top-left': 'dsn.pos.top-left',
};

export function DesignTab() {
  const tt = useT();
  const settings = useEditorStore((s) => s.settings);
  const update = useEditorStore((s) => s.updateSettings);
  const applyTheme = useEditorStore((s) => s.applyTheme);
  const openDialog = useUiStore((s) => s.open);

  const refreshToc = async () => {
    const s = useEditorStore.getState();
    const entries = scanTocEntries(s.pages, s.settings);
    let editors = getAllEditors();
    // TOC-ব্লক কোনো পাতার HTML-এ আছে কিন্তু মাউন্ট করা কোনো এডিটরে নেই →
    // TOC পাতাটি এখনো ভিউপোর্টে আসেনি। মাউন্ট না করলে updateTocNodes
    // নীরবে কিছুই লিখত না — ভুল পেজ-নম্বরসহ সূচিপত্র প্রিন্ট/এক্সপোর্ট হতো।
    if (entries.length > 0 && editors.length > 0) {
      const mountedHasToc = s.pages.some((p) => {
        const ed = getEditor(p.id);
        return Boolean(ed && !ed.isDestroyed && ed.getHTML().includes('toc-block'));
      });
      if (!mountedHasToc) {
        const tocPage = s.pages.find((p) => p.html.includes('toc-block'));
        if (tocPage && (await ensurePageEditorMounted(tocPage.id))) {
          editors = getAllEditors();
        }
      }
    }
    if (editors.length === 0) {
      toast.error(tt('dsn.toast.noeditor'));
      return;
    }
    updateTocNodes(editors, entries, tt('dsn.toc.title'));
    if (entries.length === 0) {
      toast.info(tt('dsn.toast.noheadings'));
    } else {
      toast.success(tFmt('dsn.toast.tocUpdated', { n: formatPageNumber(entries.length, 'bangla') }));
    }
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label={tt('dsn.group.themes')} accent="book themes">
        <div className="flex gap-1.5">
          {BOOK_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              title={theme.description}
              onClick={() => { applyTheme(theme); toast.success(tFmt('dsn.toast.themeApplied', { name: theme.name })); }}
              className="theme-card"
            >
              <span
                className="theme-card-preview"
                style={{ backgroundColor: theme.paperColor === 'dark' ? '#1e293b' : theme.paperColor === 'cream' ? '#f7edd8' : '#fff' }}
              >
                <span className="theme-card-line" style={{ backgroundColor: theme.accentColor }} />
                <span className="theme-card-line theme-card-line-short" style={{ backgroundColor: theme.accentColor, opacity: 0.45 }} />
                <span className="theme-card-line theme-card-line-shorter" style={{ backgroundColor: theme.accentColor, opacity: 0.25 }} />
              </span>
              <span className="theme-card-name">{theme.name}</span>
            </button>
          ))}
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('dsn.group.hf')} accent="header & footer">
        <div className="flex flex-col gap-1">
          <RibbonButton icon={Settings2} label={tt('dsn.hf.master')} onClick={() => openDialog('headerFooter')} />
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-40">
                  {settings.header.style === 'parallel' ? tt('dsn.hstyle.parallel') : settings.header.style === 'royal' ? tt('dsn.hstyle.royal') : settings.header.style === 'academic' ? tt('dsn.hstyle.academic') : settings.header.style === 'plain' ? tt('dsn.hstyle.plain') : tt('dsn.hstyle.none')} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'parallel' }, footer: { ...settings.footer, style: 'plain' } })}>
                  {tt('dsn.hstyle.parallelText')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'royal' }, footer: { ...settings.footer, style: 'royal' } })}>
                  {tt('dsn.hstyle.royalClassic')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'academic' }, footer: { ...settings.footer, style: 'academic' } })}>
                  {tt('dsn.hstyle.academicMinimal')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'plain' }, footer: { ...settings.footer, style: 'plain' } })}>
                  {tt('dsn.hstyle.plain')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, enabled: false } })}>
                  {tt('dsn.hstyle.headerOff')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('dsn.group.pagenum')} accent="page numbers">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              type="button"
              className={cn('ribbon-toggle', settings.pageNumber.enabled && 'ribbon-toggle-active')}
              onClick={() => update({ pageNumber: { ...settings.pageNumber, enabled: !settings.pageNumber.enabled } })}
            >
              {settings.pageNumber.enabled ? tt('dsn.pn.on') : tt('dsn.pn.off')}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-36">
                  {settings.pageNumber.format === 'bangla' ? tt('dsn.pnfmt.sample.bangla') : settings.pageNumber.format === 'hindi' ? tt('dsn.pnfmt.sample.hindi') : settings.pageNumber.format === 'roman' ? tt('dsn.pnfmt.sample.roman') : tt('dsn.pnfmt.sample.english')} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {/* 'hindi' = দেবনাগরী সংখ্যা (०१२३) — নতুন ফরম্যাট */}
                {(['bangla', 'hindi', 'english', 'roman'] as PageNumberFormat[]).map((f) => (
                  <DropdownMenuItem key={f} onClick={() => update({ pageNumber: { ...settings.pageNumber, format: f } })}>
                    {f === 'bangla' ? tt('dsn.pnfmt.bangla') : f === 'hindi' ? tt('dsn.pnfmt.hindi') : f === 'english' ? tt('dsn.pnfmt.english') : tt('dsn.pnfmt.roman')}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-32">
                  {tt(POSITION_LABELS[settings.pageNumber.position] ?? 'dsn.pos.fallback')} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'bottom-center' } })}>{tt('dsn.pos.bottom-center')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'bottom-right' } })}>{tt('dsn.pos.bottom-right')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'bottom-left' } })}>{tt('dsn.pos.bottom-left')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'top-center' } })}>{tt('dsn.pos.top-center')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'top-right' } })}>{tt('dsn.pos.top-right')}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'top-left' } })}>{tt('dsn.pos.top-left')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className={cn('ribbon-toggle', settings.pageNumber.differentFirst && 'ribbon-toggle-active')}
              onClick={() => update({ pageNumber: { ...settings.pageNumber, differentFirst: !settings.pageNumber.differentFirst } })}
              title={tt('dsn.pn.firstPageTip')}
            >
              {settings.pageNumber.differentFirst ? '✓ ' : ''}{tt('dsn.pn.firstPage')}
            </button>
            <button
              type="button"
              className={cn('ribbon-toggle', settings.pageNumber.oddEven && 'ribbon-toggle-active')}
              onClick={() => update({ pageNumber: { ...settings.pageNumber, oddEven: !settings.pageNumber.oddEven } })}
              title={tt('dsn.pn.oddEvenTip')}
            >
              {settings.pageNumber.oddEven ? '✓ ' : ''}{tt('dsn.pn.oddEven')}
            </button>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('dsn.group.covtoc')} accent="cover & toc">
        <div className="flex gap-1">
          <RibbonButton icon={Crown} label={tt('dsn.btn.cover')} onClick={() => openDialog('cover')} />
          <RibbonButton icon={LayoutTemplate} label={tt('dsn.btn.templates')} title={tt('dsn.btn.templatesTip')} onClick={() => openDialog('templates')} />
          <RibbonButton icon={Store} label={tt('ins.store.btn')} title={tt('ins.store.btnTip')} onClick={() => openDialog('assetStore')} />
          <RibbonButton icon={RefreshCw} label={tt('dsn.btn.updateToc')} onClick={refreshToc} />
          <RibbonButton icon={Palette} label={tt('dsn.btn.borderColor')} onClick={() => {
            const c = window.prompt(tt('dsn.prompt.borderColor'), settings.pageBorderColor);
            if (c) update({ pageBorderColor: c });
          }} />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('dsn.group.ink')} accent="single ink">
        {/* RibbonButton ref ফরওয়ার্ড করে না — Radix asChild-এর জন্য একই চেহারার সাধারণ বোতাম */}
        <OneColorDropdown align="start">
          <button
            type="button"
            className="ribbon-btn"
            aria-label={tt('dsn.ink.title')}
            title={tt('dsn.ink.desc')}
          >
            <PaintBucket size={16} aria-hidden="true" />
            <span className="ribbon-btn-label">{tt('dsn.ink.title')}</span>
          </button>
        </OneColorDropdown>
      </RibbonGroup>
    </div>
  );
}
