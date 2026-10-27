/**
 * প্রুফিং প্যানেল — বানান পরীক্ষক (অফলাইন ডিকশনারি) + যুক্তবর্ণ সহায়িকা
 */

'use client';

import { useMemo, useState } from 'react';
import { BarChart3, BookPlus, PenLine, Search, Sparkles, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PHero } from '@/components/premium';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { addToCustomDict, isWordKnown, scanText, getCustomDict, removeFromCustomDict, suggestCorrections, tokenizeBangla } from '@/lib/proofing';
import { replaceAll } from '@/lib/find-replace';
import { CONJUNCTS } from '@/lib/bangla';
import { useT, useFmtNum } from '@/lib/i18n';
import { toast } from 'sonner';

interface PageWordHit {
  word: string;
  count: number;
  pages: number[];
}

export function ReviewDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'review';
  const pages = useEditorStore((s) => s.pages);
  const tt = useT();
  const ff = useFmtNum();

  const [scanned, setScanned] = useState(false);
  const [filter, setFilter] = useState('');
  const [dictVersion, setDictVersion] = useState(0);
  void dictVersion;

  const hits: PageWordHit[] = useMemo(() => {
    if (!scanned || !open) return [];
    const merged = new Map<string, PageWordHit>();
    pages.forEach((page, idx) => {
      if (page.kind !== 'normal' || !page.html) return;
      const text = page.html.replace(/<[^>]*>/g, ' ');
      for (const item of scanText(text, { maxResults: 400 })) {
        const prev = merged.get(item.word);
        if (prev) {
          prev.count += item.count;
          if (!prev.pages.includes(idx + 1)) prev.pages.push(idx + 1);
        } else {
          merged.set(item.word, { word: item.word, count: item.count, pages: [idx + 1] });
        }
      }
    });
    const list = Array.from(merged.values());
    list.sort((a, b) => b.count - a.count);
    return list;
  }, [scanned, open, pages]);

  // dictVersion-নির্ভর — "অভিধানে যোগ" করলেই সেই শব্দের সারি সঙ্গে সঙ্গে তালিকা থেকে বাদ যায়
  // (আগে বোতাম শুধু গায়েব হতো, সারি পড়ে থাকত + মোট গণনা বদলাত না)
  const filteredHits = useMemo(
    () => hits.filter((h) => h.word.includes(filter) && !isWordKnown(h.word)),
    [hits, filter, dictVersion],
  );

  const customWords = useMemo(() => Array.from(getCustomDict()).slice(0, 60), [scanned, dictVersion]);

  // দিন ১৮ — এক-ক্লিকে সব ঘটনা বদলানো (find-replace ইঞ্জিন পুনঃব্যবহার — পুরো-শব্দ মিল)
  const applySuggestion = (word: string, suggestion: string) => {
    const n = replaceAll(word, suggestion, false, { wholeWord: true });
    if (n > 0) {
      useEditorStore.getState().bumpSelection();
      toast.success(tt('dlg2.review.fixedAll').split('{n}').join(String(n)).split('{w}').join(word).split('{s}').join(suggestion));
      setDictVersion((v) => v + 1); // তালিকা রি-ফিল্টার
    } else {
      toast.info(tt('dlg2.review.fixNone'));
    }
  };

  // দিন ১৮ — যুক্তাক্ষর-বিশ্লেষণ: বইয়ের শব্দ-সংখ্যা, যুক্তাক্ষর-শব্দ, ঘনত্ব, শীর্ষ যুক্তাক্ষর
  const conjunctStats = useMemo(() => {
    if (!open) return null;
    let totalWords = 0;
    let conjunctWords = 0;
    const charHits = new Map<string, number>();
    const conjunctChars = CONJUNCTS.map((c) => c.char);
    for (const page of pages) {
      if (page.kind !== 'normal' || !page.html) continue;
      const text = page.html.replace(/<[^>]*>/g, ' ');
      for (const token of tokenizeBangla(text)) {
        if (!/^[\u0980-\u09FF]+$/.test(token)) continue;
        totalWords++;
        let hasConjunct = false;
        for (const ch of conjunctChars) {
          if (token.includes(ch)) {
            hasConjunct = true;
            charHits.set(ch, (charHits.get(ch) ?? 0) + 1);
          }
        }
        if (hasConjunct) conjunctWords++;
      }
    }
    const topChars = Array.from(charHits.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      totalWords,
      conjunctWords,
      density: totalWords > 0 ? Math.round((conjunctWords / totalWords) * 100) : 0,
      topChars,
    };
  }, [open, pages]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { close(); setScanned(false); } }}>
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('dlg2.review.title')}</DialogTitle>
          <DialogDescription>
            {tt('dlg2.review.desc')}
          </DialogDescription>
        </DialogHeader>
        <PHero tone="rose" icon={PenLine} title={tt('dlg2.review.title')} desc={tt('dlg2.review.desc')} />

        <Tabs defaultValue="spell">
          <TabsList className="w-full">
            <TabsTrigger value="spell" className="min-w-0 flex-1 gap-1 whitespace-normal leading-snug"><Search size={13} /> {tt('dlg2.review.tab.spell')}</TabsTrigger>
            <TabsTrigger value="dict" className="min-w-0 flex-1 gap-1 whitespace-normal leading-snug"><BookPlus size={13} /> {tt('dlg2.review.tab.dict')}</TabsTrigger>
            <TabsTrigger value="conjunct" className="min-w-0 flex-1 gap-1 whitespace-normal leading-snug">{tt('dlg2.review.tab.conjunct')}</TabsTrigger>
          </TabsList>

          <TabsContent value="spell" className="space-y-3 pt-2">
            {!scanned ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-sm text-muted-foreground">{tt('dlg2.review.scanAsk')}</p>
                <Button onClick={() => setScanned(true)}>
                  <Search size={15} /> {tt('dlg2.review.scanStart')}
                </Button>
              </div>
            ) : (
              <>
                <Input placeholder={tt('dlg2.review.filterPh')} value={filter} onChange={(e) => setFilter(e.target.value)} />
                {filteredHits.length === 0 ? (
                  <p className="py-6 text-center text-sm text-emerald-700">{tt('dlg2.review.allClean')}</p>
                ) : (
                  <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {filteredHits.map((h) => (
                  <div key={h.word} className="rounded-lg border p-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{h.word}</span>
                      <span className="text-xs text-muted-foreground">
                        {tt('dlg2.review.hitMeta').split('{n}').join(ff(h.count)).split('{p}').join(h.pages.map((p) => ff(p)).join(', '))}
                      </span>
                      <span className="flex-1" />
                      {!isWordKnown(h.word) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => { addToCustomDict(h.word); setDictVersion((v) => v + 1); }}
                        >
                          <BookPlus size={12} /> {tt('dlg2.review.addWord')}
                        </Button>
                      ) : null}
                    </div>
                    {/* দিন ১৮ — অফলাইন সাজেশন চিপ: ক্লিকে সব ঘটনা বদলায় */}
                    {(() => {
                      const sugg = suggestCorrections(h.word, 4);
                      if (!sugg.length) return null;
                      return (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1">
                          <Sparkles size={11} aria-hidden="true" className="text-primary" />
                          <span className="text-[10px] text-muted-foreground">{tt('dlg2.review.suggestLabel')}</span>
                          {sugg.map((s) => (
                            <button
                              key={s}
                              type="button"
                              className="rounded-full border border-primary/40 bg-primary/5 px-2 py-0.5 text-[11px] font-medium text-primary transition hover:bg-primary/15"
                              onClick={() => applySuggestion(h.word, s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {tt('dlg2.review.totalNote').split('{n}').join(ff(hits.length)).split('{a}').join(tt('dlg2.review.addWord'))}
                </p>
              </>
            )}
          </TabsContent>

          <TabsContent value="dict" className="pt-2">
            {customWords.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                {tt('dlg2.review.dictEmpty')}
              </p>
            ) : (
              <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
                {customWords.map((w) => (
                  <span key={w} className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-sm">
                    {w}
                    <button
                      type="button"
                      aria-label={tt('dlg2.review.removeWordAria').split('{w}').join(w)}
                      className="text-muted-foreground hover:text-red-500"
                      onClick={() => { removeFromCustomDict(w); setDictVersion((v) => v + 1); }}
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="conjunct" className="pt-2">
            {/* দিন ১৮ — যুক্তাক্ষর-বিশ্লেষণ (বই-ব্যাপী) */}
            {conjunctStats && conjunctStats.totalWords > 0 ? (
              <div className="mb-3 rounded-lg border p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold">
                  <BarChart3 size={13} aria-hidden="true" className="text-primary" /> {tt('dlg2.review.conjunctStatsTitle')}
                </p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted/60 p-2">
                    <p className="text-base font-bold">{ff(conjunctStats.totalWords)}</p>
                    <p className="text-[10px] text-muted-foreground">{tt('dlg2.review.statWords')}</p>
                  </div>
                  <div className="rounded-md bg-muted/60 p-2">
                    <p className="text-base font-bold">{ff(conjunctStats.conjunctWords)}</p>
                    <p className="text-[10px] text-muted-foreground">{tt('dlg2.review.statConjunctWords')}</p>
                  </div>
                  <div className="rounded-md bg-primary/10 p-2">
                    <p className="text-base font-bold text-primary">{ff(conjunctStats.density)}%</p>
                    <p className="text-[10px] text-muted-foreground">{tt('dlg2.review.statDensity')}</p>
                  </div>
                </div>
                {conjunctStats.topChars.length ? (
                  <p className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{tt('dlg2.review.statTop')}:</span>
                    {conjunctStats.topChars.map(([ch, n]) => (
                      <span key={ch} className="rounded bg-muted px-1.5 py-0.5 text-sm text-foreground">
                        {ch} <span className="text-[10px] text-muted-foreground">×{ff(n)}</span>
                      </span>
                    ))}
                  </p>
                ) : null}
              </div>
            ) : null}
            <p className="mb-2 text-xs text-muted-foreground">
              {tt('dlg2.review.conjunctNote').split('{n}').join(ff(CONJUNCTS.length))}
            </p>
            <div className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-5">
              {CONJUNCTS.map((c) => (
                <div key={c.char} className="rounded-md border p-1.5 text-center">
                  <div className="text-lg">{c.char}</div>
                  <div className="text-[9px] text-muted-foreground">{c.name}</div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
