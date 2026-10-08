/**
 * ডিজাইন স্টোর — প্রফেশনাল ডিজাইন-সফটওয়্যারের মতো এক-জায়গায় সব সাজসজ্জা।
 *
 * যা যা আছে (সব একই জায়গায়, সার্চসহ):
 *   • ইমোজি (৩৫০+) — বাংলা ক্যাটাগরি ও কীওয়ার্ডে খোঁজা যায়
 *   • স্টিকার (রঙিন SVG বাংলা মোটিফ + বই-সামগ্রী)
 *   • অলংকার চিহ্ন (ফ্লোরিশ, তারা, ফুল…)
 *   • আইকন (Lucide লাইন-আইকন লাইব্রেরি)
 *   • আমার আপলোড (নিজের স্টিকার/ছবি — IndexedDB-তে সেভ, অফলাইনেও থাকে)
 *
 * স্টোরেজ:
 *   • প্রিয় (❤) + সম্প্রতি ব্যবহৃত — localStorage (asset-store.ts)
 *   • ক্লিক = তাৎক্ষণিক ঢোকান (সাইজ/রং নিয়ন্ত্রণ প্রযোজ্য)
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  DraftingCompass, Heart, ImagePlus, Loader2, Search, Store, Trash2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { runCommand, refocusActiveEditor } from '@/components/ribbon/ribbon-shell';
import {
  EMOJI_CATEGORIES, EMOJI_COUNT, searchEmojis,
} from '@/lib/emoji-catalog';
import {
  STICKER_DEFS, getSticker, searchStickers,
} from '@/lib/sticker-catalog';
import {
  ICON_CATEGORIES, ORNAMENTS, searchIcons,
} from '@/lib/icon-catalog';
import {
  addCustomAsset, assetKey, getAssetFavs, getAssetRecents, listCustomAssets,
  pushAssetRecent, removeCustomAsset, toggleAssetFav,
  type AssetKind,
} from '@/lib/asset-store';
import type { CustomAssetRecord } from '@/lib/dexie';
import { useUiStore } from '@/lib/ui-store';
import { tFmt, tplNodes, useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type StoreTab = 'all' | 'fav' | 'recent' | 'sticker' | 'emoji' | 'orn' | 'icon' | 'custom';

const TABS: Array<[StoreTab, string]> = [
  ['all', 'ins.store.tab.all'],
  ['fav', 'ins.store.tab.fav'],
  ['recent', 'ins.store.tab.recent'],
  ['sticker', 'ins.store.tab.sticker'],
  ['emoji', 'ins.store.tab.emoji'],
  ['orn', 'ins.store.tab.orn'],
  ['icon', 'ins.store.tab.icon'],
  ['custom', 'ins.store.tab.custom'],
];

/** 'সব' ভিউতে আইকন ক্যাটাগরিতে সর্বোচ্চ কতটা দেখানো হবে (পুরোটা আইকন-ট্যাবে) */
const ALL_VIEW_ICON_CAP = 18;
/** 'সব' ভিউতে ইমোজি ক্যাটাগরিতে সর্বোচ্চ কতটা */
const ALL_VIEW_EMOJI_CAP = 20;

export function AssetStoreDialog() {
  const tt = useT();
  const open = useUiStore((s) => s.openDialog === 'assetStore');
  const close = useUiStore((s) => s.close);
  const openDialog = useUiStore((s) => s.open);
  const [tab, setTab] = useState<StoreTab>('all');
  const [query, setQuery] = useState('');
  const [size, setSize] = useState(36);
  const [color, setColor] = useState('');
  const [favs, setFavs] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);
  const [customs, setCustoms] = useState<CustomAssetRecord[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const refreshMeta = useCallback(() => {
    setFavs(getAssetFavs());
    setRecents(getAssetRecents());
  }, []);

  const refreshCustoms = useCallback(async () => {
    setCustoms(await listCustomAssets());
  }, []);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    void (async () => {
      const customList = await listCustomAssets();
      if (!alive) return;
      setFavs(getAssetFavs());
      setRecents(getAssetRecents());
      setCustoms(customList);
    })();
    return () => { alive = false; };
  }, [open]);

  const searching = query.trim().length > 0;
  const favSet = useMemo(() => new Set(favs), [favs]);
  const isFav = useCallback((key: string) => favSet.has(key), [favSet]);

  // ─── সার্চ ফলাফল ───
  const emojiRes = useMemo(() => searchEmojis(query), [query]);
  const stickerRes = useMemo(() => searchStickers(query), [query]);
  const iconRes = useMemo(() => searchIcons(query), [query]);
  const customRes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customs;
    return customs.filter((c) => c.name.toLowerCase().includes(q));
  }, [customs, query]);
  const ornRes = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ORNAMENTS;
    return ORNAMENTS.filter((o) => o.label.toLowerCase().includes(q));
  }, [query]);
  const searchTotal = searching
    ? emojiRes.total + stickerRes.length + iconRes.total + customRes.length + ornRes.length
    : 0;
  const iconTotal = useMemo(
    () => ICON_CATEGORIES.reduce((n, c) => n + c.icons.length, 0),
    [],
  );

  const onFav = (key: string) => {
    const now = toggleAssetFav(key);
    refreshMeta();
    toast.success(now ? tt('ins.store.toast.favAdd') : tt('ins.store.toast.favRemove'));
  };

  // ─── ঢোকানো ───
  const insertByKind = (kind: AssetKind, id: string) => {
    let ok = false;
    if (kind === 'emoji' || kind === 'orn') {
      const style = `color:${color || 'inherit'};font-size:${size}px;line-height:1;`;
      ok = runCommand((ed) => ed.chain().focus().insertContent(`<span style="${style}">${id}</span>`).run());
    } else if (kind === 'sticker') {
      ok = runCommand((ed) => ed.chain().focus().insertDocSticker({ sid: id, size: Math.max(size, 32), color }).run());
    } else if (kind === 'icon') {
      ok = runCommand((ed) => ed.chain().focus().insertDocIcon({ name: id, size, color }).run());
    } else if (kind === 'custom') {
      const rec = customs.find((c) => c.id === id);
      if (!rec) return;
      ok = runCommand((ed) => ed.chain().focus().insertDocSticker({ src: rec.dataUrl, size: Math.max(size, 32), color }).run());
    }
    if (!ok) return;
    pushAssetRecent(assetKey(kind, id));
    setRecents(getAssetRecents());
    refocusActiveEditor();
    close();
  };

  // ─── আপলোড ───
  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let added = 0;
    for (const f of Array.from(files).slice(0, 12)) {
      const rec = await addCustomAsset(f);
      if (rec) added += 1;
      else toast.error(tFmt('ins.store.toast.uploadFail', { name: f.name.slice(0, 30) }));
    }
    setUploading(false);
    await refreshCustoms();
    if (added > 0) toast.success(tFmt('ins.store.toast.uploaded', { n: added }));
  };

  const deleteCustom = async (id: string) => {
    await removeCustomAsset(id);
    await refreshCustoms();
    toast.success(tt('ins.store.toast.deleted'));
  };

  /** 'সব' ভিউ + সার্চে সোর্স-সেকশন দেখাবে কি */
  const showSources = tab === 'all' || searching;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent
        className="flex h-[84vh] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DialogHeader className="border-b px-5 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <Store size={17} className="text-primary" /> {tt('ins.store.title')}
          </DialogTitle>
          <DialogDescription>
            {tt('ins.store.desc')}
          </DialogDescription>
        </DialogHeader>

        {/* সার্চ + নিয়ন্ত্রণ */}
        <div className="space-y-2 border-b px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-40 flex-1">
              <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={tt('ins.store.searchPh')}
                className="h-9 pl-8"
                aria-label={tt('ins.store.searchAria')}
              />
            </div>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {tt('ins.iconlib.size')}
              <input
                type="range"
                min={16}
                max={96}
                step={4}
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-20 accent-primary"
                aria-label={tt('ins.store.sizeAria')}
              />
            </label>
            <input
              type="color"
              value={color || '#3d3229'}
              onChange={(e) => setColor(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border border-input bg-transparent p-0"
              title={tt('ins.store.colorTitle')}
              aria-label={tt('ins.store.colorTitle')}
            />
            <button
              type="button"
              className={cn('chip', color === '' && 'chip-active')}
              onClick={() => setColor('')}
              title={tt('ins.store.autoColorTitle')}
            >
              {tt('ins.store.autoColor')}
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={13} aria-hidden="true" />}
              {tt('ins.store.upload')}
            </button>
            <button
              type="button"
              className="chip"
              onClick={() => { close(); openDialog('vectorLib'); }}
              title={tt('ins.vector.btnTip')}
            >
              <DraftingCompass size={13} aria-hidden="true" />
              {tt('ins.store.vectorLink')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { void onFiles(e.target.files); e.currentTarget.value = ''; }}
            />
          </div>
          {/* ট্যাব */}
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {TABS.map(([id, key]) => (
              <button
                key={id}
                type="button"
                className={cn('chip whitespace-nowrap', tab === id && !searching && 'chip-active')}
                onClick={() => { setTab(id); setQuery(''); }}
              >
                {id === 'fav' && favs.length > 0 ? `${tt(key)} (${favs.length})` : tt(key)}
              </button>
            ))}
          </div>
        </div>

        {/* গ্রিড */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {searching && searchTotal === 0 && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {tplNodes(tt('ins.store.noresult', 'No results for “{q}” — try another word.'), { q: query })}
            </p>
          )}

          {/* ─── প্রিয় / সম্প্রতি (নিজস্ব ট্যাব) ─── */}
          {(tab === 'fav' || tab === 'recent') && !searching && (
            (tab === 'fav' ? favs : recents).length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-14 text-sm text-muted-foreground">
                <Heart size={28} className="opacity-40" aria-hidden="true" />
                {tab === 'fav' ? tt('ins.store.favEmpty') : tt('ins.store.recentEmpty')}
              </div>
            ) : (
              <Section title={tab === 'fav' ? `${tt('ins.store.tab.fav')} (${favs.length})` : tt('ins.store.tab.recent')}>
                <MixedGrid
                  keys={(tab === 'fav' ? favs : recents)}
                  hearts={tab === 'fav'}
                  isFav={isFav}
                  onFav={onFav}
                  insert={insertByKind}
                  customs={customs}
                  onDeleteCustom={deleteCustom}
                />
              </Section>
            )
          )}

          {/* ─── সব-ভিউ: প্রিয় সারি ─── */}
          {tab === 'all' && !searching && favs.length > 0 && (
            <Section title={`${tt('ins.store.tab.fav')} (${favs.length})`}>
              <MixedGrid keys={favs.slice(0, 24)} hearts isFav={isFav} onFav={onFav} insert={insertByKind} customs={customs} onDeleteCustom={deleteCustom} />
            </Section>
          )}

          {/* ─── সব-ভিউ: সম্প্রতি সারি ─── */}
          {tab === 'all' && !searching && recents.length > 0 && (
            <Section title={tt('ins.store.tab.recent')}>
              <MixedGrid keys={recents.slice(0, 24)} hearts={false} isFav={isFav} onFav={onFav} insert={insertByKind} customs={customs} onDeleteCustom={deleteCustom} />
            </Section>
          )}

          {/* ─── স্টিকার ─── */}
          {(showSources || tab === 'sticker') && (searching ? stickerRes.length > 0 : true) && (
            <Section
              title={searching
                ? `${tt('ins.store.tab.sticker')} — ${stickerRes.length}`
                : `${tt('ins.store.tab.sticker')} (${STICKER_DEFS.length})`}
            >
              {(searching ? stickerRes : STICKER_DEFS).map((s) => (
                <StickerCell
                  key={s.id} sid={s.id}
                  fav={isFav(assetKey('sticker', s.id))}
                  onFav={() => onFav(assetKey('sticker', s.id))}
                  onClick={() => insertByKind('sticker', s.id)}
                  insertTip={tt('ins.store.insertTip')}
                  favAria={tt('ins.store.favAria')}
                />
              ))}
            </Section>
          )}

          {/* ─── ইমোজি ─── */}
          {(showSources || tab === 'emoji') && emojiRes.total > 0 && (
            <Section
              title={searching
                ? `${tt('ins.store.tab.emoji')} — ${emojiRes.total}`
                : `${tt('ins.store.tab.emoji')} (${EMOJI_COUNT})`}
            >
              {(searching ? emojiRes.categories : EMOJI_CATEGORIES).map((c) => (
                <div key={c.id} className="mb-3">
                  {!searching && tab === 'emoji' && (
                    <h4 className="mb-1.5 text-[11px] font-medium text-muted-foreground">{c.label}</h4>
                  )}
                  <div className="icon-grid">
                    {(tab === 'all' && !searching ? c.emojis.slice(0, ALL_VIEW_EMOJI_CAP) : c.emojis).map((e) => {
                      const key = assetKey('emoji', e.char);
                      return (
                        <button
                          key={`${c.id}-${e.char}`}
                          type="button"
                          className="icon-cell relative text-xl leading-none"
                          onClick={() => insertByKind('emoji', e.char)}
                          title={e.name}
                          aria-label={`${e.name} — ${tt('ins.store.insertTip')}`}
                        >
                          {e.char}
                          <HeartBtn active={isFav(key)} onClick={() => onFav(key)} label={tt('ins.store.favAria')} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* ─── অলংকার ─── */}
          {(showSources || tab === 'orn') && (searching ? ornRes.length > 0 : true) && (
            <Section title={searching ? `${tt('ins.store.tab.orn')} — ${ornRes.length}` : `${tt('ins.store.tab.orn')} (${ORNAMENTS.length})`}>
              <div className="icon-grid">
                {ornRes.map((o) => {
                  const key = assetKey('orn', o.char);
                  return (
                    <button
                      key={`orn-${o.char}`}
                      type="button"
                      className="icon-cell relative text-lg leading-none"
                      onClick={() => insertByKind('orn', o.char)}
                      title={o.label}
                      aria-label={`${o.label} — ${tt('ins.store.insertTip')}`}
                    >
                      {o.char}
                      <HeartBtn active={isFav(key)} onClick={() => onFav(key)} label={tt('ins.store.favAria')} />
                    </button>
                  );
                })}
              </div>
            </Section>
          )}

          {/* ─── আইকন ─── */}
          {(showSources || tab === 'icon') && (searching ? iconRes.total > 0 : true) && (
            <Section
              title={searching
                ? `${tt('ins.store.tab.icon')} — ${iconRes.total}`
                : `${tt('ins.store.tab.icon')} (${iconTotal})`}
            >
              {(searching ? iconRes.categories : ICON_CATEGORIES).map((c) => (
                <div key={c.id} className="mb-3">
                  {!searching && tab === 'icon' && (
                    <h4 className="mb-1.5 text-[11px] font-medium text-muted-foreground">{c.label}</h4>
                  )}
                  <div className="icon-grid">
                    {(tab === 'all' && !searching ? c.icons.slice(0, ALL_VIEW_ICON_CAP) : c.icons).map((ic) => {
                      const key = assetKey('icon', ic.name);
                      const IconC = ic.Icon;
                      return (
                        <button
                          key={`${c.id}-${ic.name}`}
                          type="button"
                          className="icon-cell relative"
                          onClick={() => insertByKind('icon', ic.name)}
                          title={`${ic.name} — ${ic.kw}`}
                          aria-label={`${ic.name} — ${tt('ins.store.insertTip')}`}
                        >
                          <IconC size={19} strokeWidth={1.8} />
                          <HeartBtn active={isFav(key)} onClick={() => onFav(key)} label={tt('ins.store.favAria')} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </Section>
          )}

          {/* ─── আমার আপলোড ─── */}
          {(showSources || tab === 'custom') && (
            <Section
              title={`${tt('ins.store.tab.custom')}${searching ? ` — ${customRes.length}` : customs.length > 0 ? ` (${customs.length})` : ''}`}
            >
              {customRes.length === 0 ? (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex h-24 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-sm text-muted-foreground transition-colors hover:bg-muted/50"
                >
                  {uploading ? <Loader2 size={20} className="animate-spin" aria-hidden="true" /> : <ImagePlus size={20} aria-hidden="true" />}
                  {tt('ins.store.uploadHint')}
                </button>
              ) : (
                <div className="icon-grid">
                  {customRes.map((c) => {
                    const key = assetKey('custom', c.id);
                    return (
                      <div
                        key={c.id}
                        className="icon-cell group relative cursor-pointer"
                        role="button"
                        tabIndex={0}
                        onClick={() => insertByKind('custom', c.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') insertByKind('custom', c.id); }}
                        title={c.name}
                        aria-label={`${c.name} — ${tt('ins.store.insertTip')}`}
                      >
                        <img src={c.dataUrl} alt={c.name} className="h-11 w-11 object-contain" draggable={false} />
                        <HeartBtn active={isFav(key)} onClick={() => onFav(key)} label={tt('ins.store.favAria')} />
                        <button
                          type="button"
                          className="absolute bottom-0.5 right-0.5 hidden rounded bg-destructive/90 p-0.5 text-white group-hover:block"
                          onClick={(e) => { e.stopPropagation(); void deleteCustom(c.id); }}
                          title={tt('ins.store.deleteUpload')}
                          aria-label={tt('ins.store.deleteUpload')}
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Section>
          )}
        </div>

        {/* ফুটার হেল্প */}
        <div className="border-t px-5 py-2 text-[11px] text-muted-foreground">
          {tt('ins.store.footer')}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─────────────── সহায়ক ছোট উপাদান ───────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5">
      <h3 className="mb-2 text-xs font-semibold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function HeartBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <span
      role="button"
      tabIndex={0}
      aria-label={label}
      title={label}
      className="absolute right-0.5 top-0.5 z-10 cursor-pointer rounded p-0.5 text-muted-foreground/40 transition-colors hover:text-destructive"
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); } }}
    >
      <Heart size={11} className={cn(active && 'fill-destructive text-destructive')} aria-hidden="true" />
    </span>
  );
}

function StickerCell({ sid, fav, onFav, onClick, insertTip, favAria }: {
  sid: string;
  fav: boolean;
  onFav: () => void;
  onClick: () => void;
  insertTip: string;
  favAria: string;
}) {
  const def = getSticker(sid);
  if (!def) return null;
  return (
    <button
      type="button"
      className="icon-cell relative"
      onClick={onClick}
      title={def.label}
      aria-label={`${def.label} — ${insertTip}`}
    >
      <span
        className="flex h-11 w-11 items-center justify-center"
        style={{ color: 'inherit' }}
        dangerouslySetInnerHTML={{ __html: def.svg.replace('<svg ', '<svg width="100%" height="100%" ') }}
        aria-hidden="true"
      />
      <HeartBtn active={fav} onClick={onFav} label={favAria} />
    </button>
  );
}

/** প্রিয়/সম্প্রতি গ্রিড — মিশ্র অ্যাসেট-কী থেকে সেল রেন্ডার */
function MixedGrid({ keys, hearts, isFav, onFav, insert, customs, onDeleteCustom }: {
  keys: string[];
  hearts: boolean;
  isFav: (k: string) => boolean;
  onFav: (k: string) => void;
  insert: (kind: AssetKind, id: string) => void;
  customs: CustomAssetRecord[];
  onDeleteCustom: (id: string) => void;
}) {
  return (
    <div className="icon-grid">
      {keys.map((key) => {
        const i = key.indexOf(':');
        if (i <= 0) return null;
        const kind = key.slice(0, i) as AssetKind;
        const id = key.slice(i + 1);
        const heart = hearts
          ? <HeartBtn active={isFav(key)} onClick={() => onFav(key)} label="প্রিয় সরান" />
          : null;
        if (kind === 'emoji' || kind === 'orn') {
          return (
            <button
              key={key} type="button" className="icon-cell relative text-xl leading-none"
              onClick={() => insert(kind, id)} title={id}
            >
              {id}
              {heart}
            </button>
          );
        }
        if (kind === 'sticker') {
          const def = getSticker(id);
          if (!def) return null;
          return (
            <button key={key} type="button" className="icon-cell relative" onClick={() => insert(kind, id)} title={def.label}>
              <span
                className="flex h-11 w-11 items-center justify-center"
                dangerouslySetInnerHTML={{ __html: def.svg.replace('<svg ', '<svg width="100%" height="100%" ') }}
                aria-hidden="true"
              />
              {heart}
            </button>
          );
        }
        if (kind === 'icon') {
          const entry = ICON_CATEGORIES.flatMap((c) => c.icons).find((x) => x.name === id);
          if (!entry) return null;
          const IconC = entry.Icon;
          return (
            <button key={key} type="button" className="icon-cell relative" onClick={() => insert(kind, id)} title={id}>
              <IconC size={19} strokeWidth={1.8} />
              {heart}
            </button>
          );
        }
        if (kind === 'custom') {
          const rec = customs.find((c) => c.id === id);
          if (!rec) return null;
          return (
            <button key={key} type="button" className="icon-cell relative" onClick={() => insert(kind, id)} title={rec.name}>
              <img src={rec.dataUrl} alt={rec.name} className="h-11 w-11 object-contain" draggable={false} />
              {heart}
            </button>
          );
        }
        return null;
      })}
    </div>
  );
}
