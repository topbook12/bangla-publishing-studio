/**
 * প্রুফিং প্যানেল — বানান পরীক্ষক (অফলাইন ডিকশনারি) + যুক্তবর্ণ সহায়িকা
 */

'use client';

import { useMemo, useState } from 'react';
import { BookPlus, Search, X } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { addToCustomDict, isWordKnown, scanText, getCustomDict, removeFromCustomDict } from '@/lib/proofing';
import { CONJUNCTS } from '@/lib/bangla';
import { formatPageNumber } from '@/lib/bangla';

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

  const filteredHits = hits.filter((h) => h.word.includes(filter));

  const customWords = useMemo(() => Array.from(getCustomDict()).slice(0, 60), [scanned, dictVersion]);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { close(); setScanned(false); } }}>
      <DialogContent className="max-h-[88vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>বানান ও প্রুফিং সহায়ক</DialogTitle>
          <DialogDescription>
            অফলাইন ডিকশনারিতে না-থাকা শব্দগুলো দেখানো হচ্ছে — ভুল নয়, “যাচাই করার মতো”
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="spell">
          <TabsList className="w-full">
            <TabsTrigger value="spell" className="flex-1 gap-1"><Search size={13} /> বানান পরীক্ষক</TabsTrigger>
            <TabsTrigger value="dict" className="flex-1 gap-1"><BookPlus size={13} /> আমার অভিধান</TabsTrigger>
            <TabsTrigger value="conjunct" className="flex-1 gap-1">যুক্তবর্ণ সহায়িকা</TabsTrigger>
          </TabsList>

          <TabsContent value="spell" className="space-y-3 pt-2">
            {!scanned ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <p className="text-sm text-muted-foreground">পুরো বই স্ক্যান করে সন্দেহজনক শব্দ খুঁজি?</p>
                <Button onClick={() => setScanned(true)}>
                  <Search size={15} /> স্ক্যান শুরু করুন
                </Button>
              </div>
            ) : (
              <>
                <Input placeholder="শব্দ ফিল্টার…" value={filter} onChange={(e) => setFilter(e.target.value)} />
                {filteredHits.length === 0 ? (
                  <p className="py-6 text-center text-sm text-emerald-700">🎉 সব শব্দ অভিধানে পাওয়া গেছে — চমৎকার!</p>
                ) : (
                  <div className="max-h-72 space-y-1.5 overflow-y-auto pr-1">
                    {filteredHits.map((h) => (
                      <div key={h.word} className="flex items-center gap-2 rounded-lg border p-2 text-sm">
                        <span className="font-semibold">{h.word}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatPageNumber(h.count, 'bangla')}× • পৃ. {h.pages.map((p) => formatPageNumber(p, 'bangla')).join(', ')}
                        </span>
                        <span className="flex-1" />
                        {!isWordKnown(h.word) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                            onClick={() => { addToCustomDict(h.word); setDictVersion((v) => v + 1); }}
                          >
                            <BookPlus size={12} /> অভিধানে যোগ
                          </Button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  মোট {formatPageNumber(hits.length, 'bangla')}টি অনন্য শব্দ। সঠিক বানানের নতুন শব্দ “অভিধানে যোগ” করে রাখুন — পরে আর দেখাবে না।
                </p>
              </>
            )}
          </TabsContent>

          <TabsContent value="dict" className="pt-2">
            {customWords.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                আপনার কাস্টম অভিধান খালি। বানান পরীক্ষক থেকে শব্দ যোগ করুন।
              </p>
            ) : (
              <div className="flex max-h-72 flex-wrap gap-1.5 overflow-y-auto">
                {customWords.map((w) => (
                  <span key={w} className="flex items-center gap-1 rounded-md bg-accent px-2 py-1 text-sm">
                    {w}
                    <button
                      type="button"
                      aria-label={`${w} মুছুন`}
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
            <p className="mb-2 text-xs text-muted-foreground">
              প্রচলিত {formatPageNumber(CONJUNCTS.length, 'bangla')}টি যুক্তবর্ণ ও গঠন — রিভিউ ট্যাবের প্যালেট থেকে সরাসরি লেখায় বসানো যায়।
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
