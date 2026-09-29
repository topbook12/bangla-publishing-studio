/**
 * আউটলাইন নেভিগেটর — বইয়ের h1/h2/h3 শিরোনামের সাইডবার তালিকা
 *
 * toc.ts-এর মতোই DOMParser দিয়ে পৃষ্ঠার HTML স্ক্যান করে (মাউন্ট-স্বাধীন —
 * রিসাইক্লিং-এ আনমাউন্ট হওয়া দূরের পাতার শিরোনামও তালিকায় থাকে)।
 * স্ক্যান ৪০০ms ডিবাউন্সে — প্রতি কীস্ট্রোকে পুরো বই পার্স হয় না।
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { ListTree, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { getEditor } from '@/lib/editor-registry';
import { toBanglaNumber } from '@/lib/bangla';
import { cn } from '@/lib/utils';
import type { PageData } from '@/lib/types';

export interface OutlineEntry {
  pageIndex: number;
  pageId: string;
  text: string;
  /** 1 = h1 (অধ্যায়), 2 = h2, 3 = h3 */
  level: number;
}

/** সব পৃষ্ঠার HTML থেকে h1-h3 শিরোনাম সংগ্রহ (প্রচ্ছদ ও ফাঁকা টেক্সট বাদ) */
export function scanOutline(pages: PageData[]): OutlineEntry[] {
  const entries: OutlineEntry[] = [];
  const parser = new DOMParser();
  pages.forEach((page, index) => {
    if (page.kind === 'cover' || !page.html) return;
    const doc = parser.parseFromString(`<div>${page.html}</div>`, 'text/html');
    doc.querySelectorAll('h1, h2, h3').forEach((h) => {
      const text = (h.textContent ?? '').trim();
      if (!text) return;
      const level = Number(h.tagName.substring(1));
      entries.push({ pageIndex: index, pageId: page.id, text, level });
    });
  });
  return entries;
}

export function NavigatorPanel() {
  const pages = useEditorStore((s) => s.pages);
  const activePageId = useEditorStore((s) => s.activePageId);
  const setActivePage = useEditorStore((s) => s.setActivePage);
  const toggleNavigator = useUiStore((s) => s.toggleNavigator);

  const [filter, setFilter] = useState('');
  const [outline, setOutline] = useState<OutlineEntry[]>([]);

  // ডিবাউন্সড স্ক্যান — pages রেফারেন্স বদলালে ৪০০ms পরে একবারই পার্স
  useEffect(() => {
    const timer = setTimeout(() => {
      setOutline(scanOutline(pages));
    }, 400);
    return () => clearTimeout(timer);
  }, [pages]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return outline;
    return outline.filter((e) => e.text.toLowerCase().includes(q));
  }, [outline, filter]);

  const chapterCount = useMemo(() => outline.filter((e) => e.level === 1).length, [outline]);

  // বর্তমান অবস্থানের শিরোনাম — অ্যাকটিভ পাতার আগে/মধ্যে শেষ এন্ট্রি
  const activePageIndex = pages.findIndex((p) => p.id === activePageId);
  const activeEntryKey = useMemo(() => {
    if (activePageIndex < 0) return -1;
    let last = -1;
    outline.forEach((e, i) => {
      if (e.pageIndex <= activePageIndex) last = i;
    });
    return last;
  }, [outline, activePageIndex]);

  /** এন্ট্রিতে যাওয়া — পাতায় স্ক্রল + মাউন্ট থাকলে শিরোনাম নোডে ক্যারেট */
  const goToEntry = (entry: OutlineEntry): void => {
    setActivePage(entry.pageId);
    document
      .querySelector(`.paper-page[data-page-index="${entry.pageIndex}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const editor = getEditor(entry.pageId);
    if (editor && !editor.isDestroyed) {
      try {
        let targetPos = -1;
        editor.state.doc.descendants((node, pos) => {
          if (node.type.name === 'heading' && node.textContent.trim() === entry.text) {
            targetPos = pos;
            return false; // এই সাবট্রি আর দরকার নেই
          }
          return true;
        });
        if (targetPos >= 0) {
          editor.chain().setTextSelection(targetPos + 1).scrollIntoView().run();
        }
      } catch {
        // ফ্লো/রিসাইক্লিং-অপের মাঝে এডিটর ধ্বংস হলে পাতার স্ক্রলই যথেষ্ট
      }
    }
  };

  return (
    <nav
      className="flex h-full w-[264px] shrink-0 flex-col border-r bg-background/95 no-print"
      role="complementary"
      aria-label="বইয়ের আউটলাইন"
    >
      {/* হেডার */}
      <div className="flex shrink-0 items-center gap-2 border-b px-3 py-2.5">
        <ListTree size={15} className="shrink-0 text-primary/80" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-[13px] font-semibold leading-tight">আউটলাইন</span>
          <span className="text-[10px] leading-tight text-muted-foreground">
            {toBanglaNumber(chapterCount)}টি অধ্যায় · {toBanglaNumber(outline.length)}টি শিরোনাম
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="নেভিগেটর বন্ধ করুন"
          title="নেভিগেটর বন্ধ করুন"
          onClick={toggleNavigator}
        >
          <X size={14} />
        </Button>
      </div>

      {/* ফিল্টার */}
      <div className="relative shrink-0 px-3 py-2">
        <Search
          size={13}
          className="pointer-events-none absolute left-[22px] top-1/2 z-10 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="শিরোনাম খুঁজুন…"
          aria-label="আউটলাইন ফিল্টার"
          className="h-8 pl-8 text-[12px]"
        />
      </div>

      {/* এন্ট্রি তালিকা */}
      <div className="nav-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2.5 px-4 py-10 text-center">
            <ListTree size={22} className="text-muted-foreground/50" aria-hidden="true" />
            <p className="text-[12px] leading-relaxed text-muted-foreground">
              কোনো শিরোনাম নেই — লেখায় H1/H2/H3 স্টাইল ব্যবহার করুন
            </p>
          </div>
        ) : (
          filtered.map((entry, i) => {
            const isActive = i === activeEntryKey;
            return (
              <button
                key={`${entry.pageIndex}-${entry.text}-${i}`}
                type="button"
                onClick={() => goToEntry(entry)}
                title={entry.text}
                className={cn(
                  'flex min-h-9 w-full items-center gap-2 rounded-md px-2 text-left text-[13px] transition-colors',
                  entry.level === 1 && 'font-semibold',
                  entry.level === 2 && 'pl-3 font-normal',
                  entry.level === 3 && 'pl-6 font-normal',
                  isActive
                    ? 'nav-row-active bg-primary/10 text-foreground'
                    : 'text-foreground/85 hover:bg-accent/60 hover:text-foreground',
                )}
              >
                <span className="min-w-0 flex-1 truncate">{entry.text}</span>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-1.5 py-px text-[10px] font-medium tabular-nums',
                    isActive
                      ? 'border-primary/30 bg-primary/15 text-primary'
                      : 'border-border bg-muted/60 text-muted-foreground',
                  )}
                >
                  {toBanglaNumber(entry.pageIndex + 1)}
                </span>
              </button>
            );
          })
        )}
      </div>
    </nav>
  );
}
