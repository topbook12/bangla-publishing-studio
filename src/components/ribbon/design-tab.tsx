/**
 * Design tab — book themes, header/footer master, page numbers, cover & TOC
 */

'use client';

import { Crown, Palette, RefreshCw, Settings2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RibbonButton, RibbonDivider, RibbonGroup } from './ribbon-shell';
import { BOOK_THEMES } from '@/lib/paper';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { scanTocEntries, updateTocNodes } from '@/lib/toc';
import { getAllEditors } from '@/lib/editor-registry';
import { formatPageNumber } from '@/lib/bangla';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { PageNumberFormat } from '@/lib/types';

export function DesignTab() {
  const settings = useEditorStore((s) => s.settings);
  const update = useEditorStore((s) => s.updateSettings);
  const applyTheme = useEditorStore((s) => s.applyTheme);
  const pages = useEditorStore((s) => s.pages);
  const openDialog = useUiStore((s) => s.open);
  void pages;

  const refreshToc = () => {
    const s = useEditorStore.getState();
    const entries = scanTocEntries(s.pages, s.settings);
    const editors = getAllEditors();
    if (editors.length === 0) {
      toast.error('No page editor is open');
      return;
    }
    updateTocNodes(editors, entries, 'সূচিপত্র');
    if (entries.length === 0) {
      toast.info('No headings found — use H1/H2/H3 in your document');
    } else {
      toast.success(`Table of contents updated with ${formatPageNumber(entries.length, 'bangla')} headings`);
    }
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label="Book Themes">
        <div className="flex gap-1.5">
          {BOOK_THEMES.map((theme) => (
            <button
              key={theme.id}
              type="button"
              title={theme.description}
              onClick={() => { applyTheme(theme); toast.success(`Theme "${theme.name}" applied`); }}
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
      <RibbonGroup label="Header & Footer">
        <div className="flex flex-col gap-1">
          <RibbonButton icon={Settings2} label="Header & Footer Master" onClick={() => openDialog('headerFooter')} />
          <div className="flex gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-40">
                  {settings.header.style === 'parallel' ? 'Parallel (Glow)' : settings.header.style === 'royal' ? 'Royal Flourish' : settings.header.style === 'academic' ? 'Academic' : settings.header.style === 'plain' ? 'Plain' : 'None'} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'parallel' }, footer: { ...settings.footer, style: 'plain' } })}>
                  Parallel TEXT (Glow)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'royal' }, footer: { ...settings.footer, style: 'royal' } })}>
                  Classic Royal Flourish
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'academic' }, footer: { ...settings.footer, style: 'academic' } })}>
                  Academic Minimal
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, style: 'plain' }, footer: { ...settings.footer, style: 'plain' } })}>
                  Plain
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ header: { ...settings.header, enabled: false } })}>
                  Header Off
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Page Numbers">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              type="button"
              className={cn('ribbon-toggle', settings.pageNumber.enabled && 'ribbon-toggle-active')}
              onClick={() => update({ pageNumber: { ...settings.pageNumber, enabled: !settings.pageNumber.enabled } })}
            >
              {settings.pageNumber.enabled ? '✓ Numbers On' : 'Numbers Off'}
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-36">
                  {settings.pageNumber.format === 'bangla' ? '১, ২, ৩…' : settings.pageNumber.format === 'roman' ? 'I, II, III…' : '1, 2, 3…'} <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(['bangla', 'english', 'roman'] as PageNumberFormat[]).map((f) => (
                  <DropdownMenuItem key={f} onClick={() => update({ pageNumber: { ...settings.pageNumber, format: f } })}>
                    {f === 'bangla' ? 'Bengali (১, ২, ৩)' : f === 'english' ? 'English (1, 2, 3)' : 'Roman (I, II, III)'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="ribbon-select w-32">
                  Position <span aria-hidden="true">▾</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'bottom-center' } })}>Bottom Center</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'bottom-right' } })}>Bottom Right</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'bottom-left' } })}>Bottom Left</DropdownMenuItem>
                <DropdownMenuItem onClick={() => update({ pageNumber: { ...settings.pageNumber, position: 'top-center' } })}>Top Center</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className={cn('ribbon-toggle', settings.pageNumber.differentFirst && 'ribbon-toggle-active')}
              onClick={() => update({ pageNumber: { ...settings.pageNumber, differentFirst: !settings.pageNumber.differentFirst } })}
              title="Hide header & footer on the first (cover) page"
            >
              {settings.pageNumber.differentFirst ? '✓ ' : ''}Different First Page
            </button>
            <button
              type="button"
              className={cn('ribbon-toggle', settings.pageNumber.oddEven && 'ribbon-toggle-active')}
              onClick={() => update({ pageNumber: { ...settings.pageNumber, oddEven: !settings.pageNumber.oddEven } })}
              title="Mirror alignment on odd/even pages, like a book"
            >
              {settings.pageNumber.oddEven ? '✓ ' : ''}Odd/Even Pages
            </button>
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Cover & TOC">
        <div className="flex gap-1">
          <RibbonButton icon={Crown} label="Cover Page" onClick={() => openDialog('cover')} />
          <RibbonButton icon={RefreshCw} label="Update Table of Contents" onClick={refreshToc} />
          <RibbonButton icon={Palette} label="Border Color" onClick={() => {
            const c = window.prompt('Page border color (hex, e.g. #7f1d1d):', settings.pageBorderColor);
            if (c) update({ pageBorderColor: c });
          }} />
        </div>
      </RibbonGroup>
    </div>
  );
}
