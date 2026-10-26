/**
 * খোঁজ ও প্রতিস্থাপন ডায়ালগ — সম্পূর্ণ বই জুড়ে (সব পাতায়)।
 *
 * দিন ১৬ — আপগ্রেড:
 *  - পরিসর-নির্বাচন: সম্পূর্ণ বই / শুধু চলতি পাতা
 *  - পুরো-শব্দ মিল (ইউনিকোড-সচেতন — বাংলাতেও সঠিক)
 *  - ফলাফল-তালিকা: পাতা-নম্বর + স্নিপেট — ক্লিকে সরাসরি জাম্প
 *  - হাইলাইট-সব: মাউন্ট করা পাতার ক্যানভাসে সব মিল হলুদ ব্যান্ড (decoration)
 *
 * আগে থেকে:
 *  - Ctrl+F / Ctrl+H → খোলে (সিলেকশন থাকলে সেটিই ডিফল্ট কোয়েরি)
 *  - Enter → পরবর্তী মিল; Shift+Enter → আগের মিল
 *  - Replace-all: মাউন্ট করা পাতায় ProseMirror দিয়ে (মার্ক সংরক্ষিত),
 *    বাকিতে স্টোর HTML-এ — অটোসেভ স্বয়ংক্রিয়
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, BookOpen, CaseSensitive, Replace, ReplaceAll, WholeWord } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PHero } from '@/components/premium';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import {
  findAllMatches, replaceAll, replaceMatch, revealMatch, selectionQueryOfActiveEditor,
  type FindMatch, type FindOptions,
} from '@/lib/find-replace';
import { setFindHighlights, clearAllFindHighlights } from '@/lib/find-highlight';
import { useT, useFmtNum } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const RESULTS_MAX = 120;

export function FindReplaceDialog() {
  const open = useUiStore((s) => s.openDialog === 'findReplace');
  const close = useUiStore((s) => s.close);
  const tt = useT();
  const ff = useFmtNum();

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [scope, setScope] = useState<'book' | 'page'>('book');
  const [matches, setMatches] = useState<FindMatch[]>([]);
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState('');
  const queryRef = useRef<HTMLInputElement>(null);

  const opts = useMemo<FindOptions>(
    () => ({ wholeWord, scope: scope === 'page' ? { kind: 'page', pageId: useEditorStore.getState().activePageId ?? undefined } : undefined }),
    [wholeWord, scope],
  );

  // খোলার সময় সিলেকশন থেকে ডিফল্ট কোয়েরি — টাইমারে ডেফার (cascading render এড়াতে)
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const sel = selectionQueryOfActiveEditor();
      if (sel) setQuery(sel);
      queryRef.current?.select();
    }, 60);
    return () => window.clearTimeout(t);
  }, [open]);

  /** কোয়েরি/কেস/পরিসর বদলালে মিল গণনা (হালকা ডিবাউন্স) + হাইলাইট-সব */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const found = findAllMatches(query, matchCase, opts);
      setMatches(found);
      setCursor((c) => (found.length ? c % found.length : 0));
      // হাইলাইট-সব — শুধু মাউন্ট করা পাতায় (decoration, প্রিন্টে যায় না)।
      // প্রতিটি মাউন্ট করা এডিটরেই সেট করি — মিল না থাকলে খালি সেট (পুরনো
      // হাইলাইট রয়ে যাওয়ার বাগ বন্ধ)
      const byPage = new Map<string, Array<{ from: number; to: number }>>();
      for (const m of found) {
        if (m.from === undefined || m.to === undefined) continue;
        const list = byPage.get(m.pageId) ?? [];
        list.push({ from: m.from, to: m.to });
        byPage.set(m.pageId, list);
      }
      for (const pg of useEditorStore.getState().pages) {
        const ed = getEditor(pg.id);
        if (!ed || ed.isDestroyed) continue;
        setFindHighlights(ed, byPage.get(pg.id) ?? []);
      }
    }, 180);
    return () => window.clearTimeout(t);
  }, [open, query, matchCase, opts]);

  // ডায়ালগ বন্ধ → সব হাইলাইট মুছুন
  useEffect(() => {
    if (!open) clearAllFindHighlights();
  }, [open]);

  const goTo = useCallback((idx: number) => {
    if (!matches.length) return;
    const next = ((idx % matches.length) + matches.length) % matches.length;
    setCursor(next);
    revealMatch(matches[next]);
  }, [matches]);

  const findNext = useCallback(() => goTo(cursor + 1), [cursor, goTo]);
  const findPrev = useCallback(() => goTo(cursor - 1), [cursor, goTo]);

  const doReplace = () => {
    if (!matches.length) return;
    const m = matches[cursor];
    const ok = replaceMatch(m, query, replacement, matchCase, wholeWord);
    if (ok) {
      useEditorStore.getState().bumpSelection();
      // প্রতিস্থাপনের পরে মিল-তালিকা নতুন করে; কার্সর একই অবস্থানে (পরের মিলে)
      window.setTimeout(() => {
        const found = findAllMatches(query, matchCase, opts);
        setMatches(found);
        setCursor((c) => (found.length ? c % found.length : 0));
      }, 120);
      setStatus(tt('dlg2.find.replaced'));
    } else {
      setStatus(tt('dlg2.find.replaceFail'));
    }
  };

  const doReplaceAll = () => {
    const n = replaceAll(query, replacement, matchCase, opts);
    useEditorStore.getState().bumpSelection();
    window.setTimeout(() => {
      const found = findAllMatches(query, matchCase, opts);
      setMatches(found);
      setCursor(0);
    }, 160);
    setStatus(n ? tt('dlg2.find.replacedN').split('{n}').join(ff(n)) : tt('dlg2.find.noMatch'));
  };

  // ফলাফল-তালিকা (প্রদর্শন-সীমা)
  const visibleMatches = matches.slice(0, RESULTS_MAX);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md" data-testid="find-replace-dialog">
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('dlg2.find.title')}</DialogTitle>
          <DialogDescription>
            {tt('dlg2.find.desc')}
          </DialogDescription>
        </DialogHeader>
        <PHero tone="teal" icon={Replace} title={tt('dlg2.find.title')} desc={tt('dlg2.find.desc')} />

        <div className="space-y-3">
          {/* ── দিন ১৬ — পরিসর নির্বাচন ── */}
          <div className="flex items-center gap-1.5" role="radiogroup" aria-label={tt('dlg2.find.scopeAria')}>
            <button
              type="button"
              role="radio"
              aria-checked={scope === 'book'}
              onClick={() => setScope('book')}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition',
                scope === 'book' ? 'border-primary bg-primary/10 font-medium text-foreground' : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              <BookOpen size={13} aria-hidden="true" /> {tt('dlg2.find.scopeBook', 'পুরো বই')}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={scope === 'page'}
              onClick={() => setScope('page')}
              className={cn(
                'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition',
                scope === 'page' ? 'border-primary bg-primary/10 font-medium text-foreground' : 'border-border text-muted-foreground hover:border-primary/50',
              )}
            >
              {tt('dlg2.find.scopePage', 'শুধু এই পাতা')}
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="find-query" className="text-xs">{tt('dlg2.find.what')}</Label>
            <div className="flex gap-2">
              <Input
                id="find-query"
                ref={queryRef}
                autoFocus
                value={query}
                onChange={(e) => { setQuery(e.target.value); setStatus(''); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) findPrev(); else findNext();
                  }
                }}
                placeholder={tt('dlg2.find.queryPh')}
              />
              <Button
                variant="outline"
                size="icon"
                className={`shrink-0 gap-0 ${matchCase ? 'border-primary text-primary' : ''}`}
                title={tt('dlg2.find.caseAria')}
                aria-label={tt('dlg2.find.caseAria')}
                aria-pressed={matchCase}
                onClick={() => setMatchCase((v) => !v)}
              >
                <CaseSensitive size={16} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className={`shrink-0 gap-0 ${wholeWord ? 'border-primary text-primary' : ''}`}
                title={tt('dlg2.find.wholeWord', 'পুরো শব্দ মিলান')}
                aria-label={tt('dlg2.find.wholeWord', 'পুরো শব্দ মিলান')}
                aria-pressed={wholeWord}
                onClick={() => setWholeWord((v) => !v)}
              >
                <WholeWord size={16} />
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="find-replacement" className="text-xs">{tt('dlg2.find.with')}</Label>
            <Input
              id="find-replacement"
              value={replacement}
              onChange={(e) => { setReplacement(e.target.value); setStatus(''); }}
              placeholder={tt('dlg2.find.replacePh')}
            />
          </div>

          <div className="flex min-h-[22px] items-center justify-between gap-2 text-xs">
            <span className={matches.length ? 'text-foreground' : 'text-muted-foreground'} role="status">
              {query.trim()
                ? matches.length
                  ? tt('dlg2.find.matchCount').split('{n}').join(ff(matches.length)).split('{c}').join(ff(cursor + 1))
                  : tt('dlg2.find.noMatch')
                : tt('dlg2.find.typeToFind')}
            </span>
            {status ? <span className="text-emerald-600 dark:text-emerald-400">{status}</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={findPrev} disabled={!matches.length}>
              <ArrowUp size={14} aria-hidden="true" /> {tt('dlg2.find.prev')}
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={findNext} disabled={!matches.length}>
              <ArrowDown size={14} aria-hidden="true" /> {tt('dlg2.find.next')} <kbd className="ml-0.5 rounded bg-muted px-1 text-[10px]">↵</kbd>
            </Button>
            <Button variant="secondary" size="sm" className="gap-1.5" onClick={doReplace} disabled={!matches.length}>
              <Replace size={14} aria-hidden="true" /> {tt('dlg2.find.replace')}
            </Button>
            <Button size="sm" className="gap-1.5" onClick={doReplaceAll} disabled={!matches.length}>
              <ReplaceAll size={14} aria-hidden="true" /> {tt('dlg2.find.replaceAll')}
            </Button>
          </div>

          {/* ── দিন ১৬ — ফলাফল-তালিকা: ক্লিকে জাম্প ── */}
          {matches.length ? (
            <div
              className="bwp-scroll max-h-40 overflow-y-auto rounded-md border border-border/60"
              role="listbox"
              aria-label={tt('dlg2.find.resultsAria', 'মিলের তালিকা')}
            >
              {visibleMatches.map((m, i) => (
                <button
                  key={`${m.pageId}-${i}`}
                  type="button"
                  role="option"
                  aria-selected={i === cursor}
                  className={cn(
                    'flex w-full items-start gap-2 px-2.5 py-1.5 text-left text-[11px] leading-snug transition-colors',
                    i === cursor ? 'bg-primary/10' : 'hover:bg-accent',
                  )}
                  onClick={() => goTo(i)}
                >
                  <span className="mt-px shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {tt('ws.page.n', 'পৃষ্ঠা {n}').split('{n}').join(ff(m.pageIndex + 1))}
                  </span>
                  <span className="truncate text-foreground/90">{m.snippet}</span>
                </button>
              ))}
              {matches.length > RESULTS_MAX ? (
                <p className="px-2.5 py-1.5 text-[10px] text-muted-foreground">
                  {tt('dlg2.find.moreResults', '…আরও {n} টি মিল — পরের বোতাম দিয়ে দেখুন').split('{n}').join(ff(matches.length - RESULTS_MAX))}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-[11px] leading-snug text-muted-foreground">
            {tt('dlg2.find.tip')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** গ্লোবাল শর্টকাট — Ctrl+F / Ctrl+H খোলে, Esc বন্ধ করে */
export function useFindReplaceShortcuts(): void {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'f' || e.key === 'h')) {
        // ডায়ালগ আগে থেকেই খোলা থাকলে ব্রাউজারের ফাইন্ড না খুলে সার্চ-বক্সে
        // ফোকাস নেয় (আগে ইনপুটের ভিতরে Ctrl+F চাপলে ব্রাউজার-ফাইন্ড পালাত)
        if (useUiStore.getState().openDialog === 'findReplace') {
          if (e.key === 'f') {
            e.preventDefault();
            document.querySelector<HTMLInputElement>('#find-query')?.focus();
          }
          return;
        }
        const target = e.target as HTMLElement | null;
        const inEditable = target?.closest('input, textarea, select, [contenteditable="true"]');
        const inProseMirror = target?.closest('.ProseMirror');
        // দিন ১৬ — ডকুমেন্ট (ProseMirror) এডিটরের ভিতরে Ctrl+F চাপলেও অ্যাপের
        // খুঁজুন-বদলানই খুলবে (Word-অভিজ্ঞতা); সাধারণ ইনপুট/টেক্সটএরিয়ায় ব্রাউজারের
        // ফাইন্ডই থাকে (আগের আচরণ অক্ষুণ্ণ)
        if (inEditable && !inEditable.classList.contains('chrome-editing') && !inProseMirror) return;
        e.preventDefault();
        useUiStore.getState().open('findReplace');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
