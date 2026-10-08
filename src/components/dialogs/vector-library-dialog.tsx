/**
 * ভেক্টর লাইব্রেরি — বিল্ট-ইন Vector & Illustration Library।
 *
 * প্রফেশনাল ডিজাইন-সফটওয়্যারের মতো এলিমেন্ট-স্টোর: বই-লেখকের জন্য ১২১টি
 * শিক্ষামূলক SVG চিত্র — পদার্থবিজ্ঞান (নদী-নৌকা, গতি-ত্বরণের লেখচিত্র, বর্তনী,
 * লেন্স), গণিত-জ্যামিতি, রসায়ন-ল্যাব, জীববিজ্ঞান, ভূগোল-বাংলাদেশ, চার্ট ও কমন
 * এলিমেন্ট (তীর, ল্যাব যন্ত্র, মানুষের অবয়ব)।
 *
 * • ক্যাটাগরি-অনুযায়ী স্টোরেজ + সার্চ + প্রিয়/সম্প্রতি (asset-store.ts)
 * • ক্লিক = কার্সরে বসবে; ড্র্যাগ = বইয়ের যেকোনো জায়গায় ছাড়া যায়
 * • সব SVG ভেক্টর — জুম/ছাপায় ফাটে না, কপিরাইট-মুক্ত
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { DraftingCompass, Heart, Search } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { runCommand, refocusActiveEditor } from '@/components/ribbon/ribbon-shell';
import {
  figureHtmlOf, searchVectors, vectorDataUri,
  VECTOR_CAT_LABELS, VECTOR_CAT_ORDER, VECTOR_DEFS,
  type VectorCat, type VectorDef,
} from '@/lib/vector-catalog';
import {
  assetKey, getAssetFavs, getAssetRecents, pushAssetRecent, toggleAssetFav,
} from '@/lib/asset-store';
import { useUiStore } from '@/lib/ui-store';
import { t, tFmt, useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type LibTab = 'all' | 'fav' | 'recent' | VectorCat;

/** প্রিভিউ বক্সে SVG-কে পাত্রে ফিট করানো */
function svgPreview(svg: string): string {
  return svg.replace('<svg ', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" ');
}

export function VectorLibraryDialog() {
  const tt = useT();
  const open = useUiStore((s) => s.openDialog === 'vectorLib');
  const close = useUiStore((s) => s.close);
  const [tab, setTab] = useState<LibTab>('all');
  const [query, setQuery] = useState('');
  const [favs, setFavs] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  const refreshMeta = useCallback(() => {
    setFavs(getAssetFavs());
    setRecents(getAssetRecents());
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void (async () => {
      await Promise.resolve(); // lint-বান্ধব: effect-বডিতে সরাসরি setState নয়
      if (alive) {
        setFavs(getAssetFavs());
        setRecents(getAssetRecents());
      }
    })();
    return () => { alive = false; };
  }, [open]);

  const searching = query.trim().length > 0;
  const favSet = useMemo(() => new Set(favs), [favs]);

  const results = useMemo(() => searchVectors(query), [query]);
  const catCount = useCallback(
    (c: VectorCat) => VECTOR_DEFS.reduce((n, d) => n + (d.cat === c ? 1 : 0), 0),
    [],
  );

  const onFav = (id: string) => {
    const now = toggleAssetFav(assetKey('vector', id));
    refreshMeta();
    toast.success(now ? t('ins.store.toast.favAdd') : t('ins.store.toast.favRemove'));
  };

  // ─── ঢোকানো: ক্লিক ───
  const insertVector = (def: VectorDef) => {
    const ok = runCommand((ed) => ed.chain().focus().insertDocFigure({
      vid: def.id,
      src: vectorDataUri(def),
      w: def.w,
      cap: '',
    }).run());
    if (!ok) return;
    pushAssetRecent(assetKey('vector', def.id));
    setRecents(getAssetRecents());
    refocusActiveEditor();
    close();
  };

  // ─── ড্র্যাগ: TipTap-এর drop-পার্সার figure HTML সরাসরি docFigure নোড করে ───
  const onDragStart = (e: React.DragEvent, def: VectorDef) => {
    e.dataTransfer.setData('application/x-bps-vector', def.id);
    e.dataTransfer.setData('text/html', figureHtmlOf(def));
    e.dataTransfer.setData('text/plain', def.label);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const favVectorDefs = useMemo(() => {
    return favs
      .map((k) => (k.startsWith('vector:') ? k.slice(7) : ''))
      .filter((id) => id.length > 0)
      .map((id) => VECTOR_DEFS.find((d) => d.id === id))
      .filter((d): d is VectorDef => Boolean(d));
  }, [favs]);

  const recentVectorDefs = useMemo(() => {
    return recents
      .map((k) => (k.startsWith('vector:') ? k.slice(7) : ''))
      .filter((id) => id.length > 0)
      .map((id) => VECTOR_DEFS.find((d) => d.id === id))
      .filter((d): d is VectorDef => Boolean(d));
  }, [recents]);

  const shownDefs: VectorDef[] = searching
    ? results
    : tab === 'all'
      ? VECTOR_DEFS
      : tab === 'fav'
        ? favVectorDefs
        : tab === 'recent'
          ? recentVectorDefs
          : VECTOR_DEFS.filter((d) => d.cat === tab);

  const shownLabel = searching
    ? `${tt('ins.vector.tab.all')} — ${results.length}`
    : tab === 'all'
      ? tFmt('ins.vector.count', { n: VECTOR_DEFS.length })
      : tab === 'fav'
        ? `${tt('ins.store.tab.fav')} (${favVectorDefs.length})`
        : tab === 'recent'
          ? tt('ins.store.tab.recent')
          : `${VECTOR_CAT_LABELS[tab]} (${catCount(tab)})`;

  const SIDEBAR_ITEMS: Array<{ id: LibTab; label: string; count: number }> = [
    { id: 'all', label: tt('ins.vector.tab.all'), count: VECTOR_DEFS.length },
    { id: 'fav', label: tt('ins.store.tab.fav'), count: favVectorDefs.length },
    { id: 'recent', label: tt('ins.store.tab.recent'), count: recentVectorDefs.length },
    ...VECTOR_CAT_ORDER.map((c) => ({ id: c as LibTab, label: tt(`ins.vector.cat.${c}`), count: catCount(c) })),
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent
        className="flex h-[86vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DialogHeader className="border-b px-5 pb-3 pt-4">
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <DraftingCompass size={17} className="text-primary" />
            {tt('ins.vector.title')}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {tFmt('ins.vector.count', { n: VECTOR_DEFS.length })}
            </span>
          </DialogTitle>
          <DialogDescription>{tt('ins.vector.desc')}</DialogDescription>
        </DialogHeader>

        {/* সার্চ */}
        <div className="border-b px-5 py-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tt('ins.vector.searchPh')}
              className="h-9 pl-8"
              aria-label={tt('ins.vector.searchAria')}
            />
          </div>
        </div>

        {/* বডি: ক্যাটাগরি সাইডবার + গ্রিড */}
        <div className="flex min-h-0 flex-1">
          {/* ক্যাটাগরি সাইডবার */}
          <nav className="w-36 shrink-0 space-y-0.5 overflow-y-auto border-r px-2 py-3 sm:w-44" aria-label={tt('ins.vector.title')}>
            {SIDEBAR_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left text-[13px] transition-colors',
                  tab === item.id && !searching
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-foreground/80 hover:bg-muted',
                )}
                onClick={() => { setTab(item.id); setQuery(''); }}
              >
                <span className="truncate">{item.label}</span>
                <span className="ml-1 shrink-0 text-[10px] tabular-nums text-muted-foreground">{item.count}</span>
              </button>
            ))}
          </nav>

          {/* গ্রিড */}
          <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4">
            <h3 className="mb-3 text-xs font-semibold text-muted-foreground">{shownLabel}</h3>
            {shownDefs.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-sm text-muted-foreground">
                <Heart size={28} className="opacity-40" aria-hidden="true" />
                {searching
                  ? tFmt('ins.vector.noresult', { q: query })
                  : tab === 'fav' ? tt('ins.vector.favEmpty') : tt('ins.vector.recentEmpty')}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {shownDefs.map((def) => {
                  const fav = favSet.has(assetKey('vector', def.id));
                  return (
                    <div
                      key={def.id}
                      role="button"
                      tabIndex={0}
                      draggable
                      onDragStart={(e) => onDragStart(e, def)}
                      onClick={() => insertVector(def)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); insertVector(def); } }}
                      className="group relative cursor-grab rounded-lg border bg-card p-2 transition-all hover:border-primary/60 hover:shadow-sm active:cursor-grabbing"
                      title={`${def.label} — ${tt('ins.vector.insertTip')}`}
                      aria-label={`${def.label} — ${tt('ins.vector.insertTip')}`}
                    >
                      <div className="flex h-24 items-center justify-center overflow-hidden rounded-md bg-[#faf7f0] dark:bg-muted/40">
                        <span
                          className="flex h-full w-full items-center justify-center p-1.5 [&_svg]:max-h-full [&_svg]:max-w-full"
                          dangerouslySetInnerHTML={{ __html: svgPreview(def.svg) }}
                          aria-hidden="true"
                        />
                      </div>
                      <div className="mt-1.5 truncate text-center text-[11px] text-foreground/85">{def.label}</div>
                      {!searching && tab !== 'fav' && tab !== 'recent' && (
                        <span className="absolute left-1.5 top-1.5 rounded bg-foreground/5 px-1 py-0.5 text-[9px] text-muted-foreground">
                          {VECTOR_CAT_LABELS[def.cat]}
                        </span>
                      )}
                      <span
                        role="button"
                        tabIndex={0}
                        aria-label={tt('ins.store.favAria')}
                        title={tt('ins.store.favAria')}
                        className="absolute right-1 top-1 z-10 cursor-pointer rounded bg-card/80 p-1 text-muted-foreground/40 transition-colors hover:text-destructive"
                        onClick={(e) => { e.stopPropagation(); onFav(def.id); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onFav(def.id); } }}
                      >
                        <Heart size={12} className={cn(fav && 'fill-destructive text-destructive')} aria-hidden="true" />
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ফুটার হেল্প */}
        <div className="border-t px-5 py-2 text-[11px] text-muted-foreground">
          {tt('ins.vector.dragTip')}
        </div>
      </DialogContent>
    </Dialog>
  );
}
