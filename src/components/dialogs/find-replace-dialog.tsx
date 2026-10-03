/**
 * খোঁজ ও প্রতিস্থাপন ডায়ালগ — সম্পূর্ণ বই জুড়ে (সব পাতায়)।
 *
 *  - Ctrl+F / Ctrl+H → খোলে (সিলেকশন থাকলে সেটিই ডিফল্ট কোয়েরি)
 *  - Enter → পরবর্তী মিল; Shift+Enter → আগের মিল
 *  - মাউন্ট করা পাতায় মিল সিলেক্ট হয়ে ভিউপোর্টে আসে; না থাকলে পাতা স্ক্রল হয়
 *  - Replace-all: মাউন্ট করা পাতায় ProseMirror দিয়ে (মার্ক সংরক্ষিত),
 *    বাকিতে স্টোর HTML-এ — অটোসেভ স্বয়ংক্রিয়
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, CaseSensitive, Replace, ReplaceAll, Search } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import {
  findAllMatches, replaceAll, replaceMatch, revealMatch, selectionQueryOfActiveEditor,
  type FindMatch,
} from '@/lib/find-replace';
import { useT, useFmtNum } from '@/lib/i18n';

export function FindReplaceDialog() {
  const open = useUiStore((s) => s.openDialog === 'findReplace');
  const close = useUiStore((s) => s.close);
  const tt = useT();
  const ff = useFmtNum();

  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [matches, setMatches] = useState<FindMatch[]>([]);
  const [cursor, setCursor] = useState(0);
  const [status, setStatus] = useState('');
  const queryRef = useRef<HTMLInputElement>(null);

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

  /** কোয়েরি/কেস বদলালে মিল গণনা (হালকা ডিবাউন্স) */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const found = findAllMatches(query, matchCase);
      setMatches(found);
      setCursor((c) => (found.length ? c % found.length : 0));
    }, 180);
    return () => window.clearTimeout(t);
  }, [open, query, matchCase]);

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
    const ok = replaceMatch(m, query, replacement, matchCase);
    if (ok) {
      useEditorStore.getState().bumpSelection();
      // প্রতিস্থাপনের পরে মিল-তালিকা নতুন করে; কার্সর একই অবস্থানে (পরের মিলে)
      window.setTimeout(() => {
        const found = findAllMatches(query, matchCase);
        setMatches(found);
        setCursor((c) => (found.length ? c % found.length : 0));
      }, 120);
      setStatus(tt('dlg2.find.replaced'));
    } else {
      setStatus(tt('dlg2.find.replaceFail'));
    }
  };

  const doReplaceAll = () => {
    const n = replaceAll(query, replacement, matchCase);
    useEditorStore.getState().bumpSelection();
    window.setTimeout(() => {
      const found = findAllMatches(query, matchCase);
      setMatches(found);
      setCursor(0);
    }, 160);
    setStatus(n ? tt('dlg2.find.replacedN').split('{n}').join(ff(n)) : tt('dlg2.find.noMatch'));
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md" data-testid="find-replace-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search size={16} className="text-primary" aria-hidden="true" />
            {tt('dlg2.find.title')}
          </DialogTitle>
          <DialogDescription>
            {tt('dlg2.find.desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
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
                title={matchCase ? tt('dlg2.find.caseOn') : tt('dlg2.find.caseOff')}
                aria-label={tt('dlg2.find.caseAria')}
                aria-pressed={matchCase}
                onClick={() => setMatchCase((v) => !v)}
              >
                <CaseSensitive size={16} />
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

          {matches.length ? (
            <p className="truncate rounded-md bg-muted/60 px-2.5 py-1.5 text-[11px] text-muted-foreground" title={matches[cursor]?.snippet}>
              {matches[cursor]?.snippet}
            </p>
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
        // হেডার/ফুটার ইনলাইন এডিট ছাড়া অন্য ইনপুটে ব্রাউজারের ফাইন্ড সবসময় বেছে নেয়
        if (inEditable && !inEditable.classList.contains('chrome-editing')) return;
        e.preventDefault();
        useUiStore.getState().open('findReplace');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
