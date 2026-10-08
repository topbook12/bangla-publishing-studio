/**
 * ডিজাইন স্টোরের স্টোরেজ-স্তর — প্রিয় (favorites), সম্প্রতি ব্যবহৃত (recents),
 * নিজের আপলোড (custom assets)।
 *
 * - প্রিয়/সম্প্রতি: localStorage — হালকা, সিঙ্ক্রোনাস, সব ট্যাবে একই
 * - নিজের আপলোড: Dexie/IndexedDB (ছবি dataURL বড় হতে পারে)
 *
 * অ্যাসেট-কী ফরম্যাট:
 *   emoji:<char>   স্টিকার:<id>   অলংকার:<char>   আইকন:<name>   custom:<recordId>   vector:<id>
 */

import { db, newId, type CustomAssetRecord } from './dexie';

export type AssetKind = 'emoji' | 'sticker' | 'orn' | 'icon' | 'custom' | 'vector';

export interface AssetKey {
  kind: AssetKind;
  id: string;
}

export function assetKey(kind: AssetKind, id: string): string {
  return `${kind}:${id}`;
}

export function parseAssetKey(key: string): AssetKey | null {
  const i = key.indexOf(':');
  if (i <= 0) return null;
  const kind = key.slice(0, i);
  if (kind !== 'emoji' && kind !== 'sticker' && kind !== 'orn' && kind !== 'icon' && kind !== 'custom' && kind !== 'vector') return null;
  return { kind, id: key.slice(i + 1) };
}

// ───────────── প্রিয় ─────────────

const FAV_KEY = 'bwp-asset-favs-v1';

export function getAssetFavs(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(FAV_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

export function isAssetFav(key: string): boolean {
  return getAssetFavs().includes(key);
}

export function toggleAssetFav(key: string): boolean {
  const next = isAssetFav(key)
    ? getAssetFavs().filter((k) => k !== key)
    : [...getAssetFavs(), key];
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(next.slice(0, 300)));
  } catch { /* উপেক্ষা */ }
  return next.includes(key);
}

// ───────────── সম্প্রতি ব্যবহৃত ─────────────

const RECENT_KEY = 'bwp-asset-recents-v1';
const RECENT_MAX = 24;

export function getAssetRecents(): string[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    const arr: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((k): k is string => typeof k === 'string').slice(0, RECENT_MAX) : [];
  } catch {
    return [];
  }
}

export function pushAssetRecent(key: string): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const next = [key, ...getAssetRecents().filter((k) => k !== key)].slice(0, RECENT_MAX);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* উপেক্ষা */ }
}

// ───────────── নিজের আপলোড (IndexedDB) ─────────────

/** আপলোড ক্যাপ — বড় ছবি ক্যানভাসে ছোট করা হয় (দীর্ঘ সাইড এই px) */
export const CUSTOM_ASSET_MAX_EDGE = 512;
/** এর নিচের ফাইল ক্যানভাস-পুনঃকোড ছাড়াই থাকে */
const RAW_KEEP_BYTES = 180 * 1024;

export async function listCustomAssets(): Promise<CustomAssetRecord[]> {
  try {
    return await db.assets.orderBy('createdAt').reverse().toArray();
  } catch {
    return [];
  }
}

/**
 * ফাইল → ছোট dataURL (ক্যানভাসে 512px-এ স্কেল) → Dexie-তে সেভ।
 * ফেরত দেয় সেভ-হওয়া রেকর্ড; অ-ছবি ফাইল হলে null।
 */
export async function addCustomAsset(file: File): Promise<CustomAssetRecord | null> {
  if (!file.type.startsWith('image/')) return null;
  const dataUrl = await fileToCompactDataUrl(file);
  if (!dataUrl) return null;
  const rec: CustomAssetRecord = {
    id: newId('as'),
    name: file.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 60) || 'স্টিকার',
    dataUrl,
    createdAt: Date.now(),
  };
  try {
    await db.assets.put(rec);
    return rec;
  } catch {
    return null;
  }
}

export async function removeCustomAsset(id: string): Promise<void> {
  try {
    await db.assets.delete(id);
  } catch { /* উপেক্ষা */ }
}

async function fileToCompactDataUrl(file: File): Promise<string | null> {
  const raw = await new Promise<string | null>((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(typeof fr.result === 'string' ? fr.result : null);
    fr.onerror = () => resolve(null);
    fr.readAsDataURL(file);
  });
  if (!raw) return null;
  // ছোট হলে যেমন আছে তেমনই — মান নষ্ট হয় না
  if (raw.length < RAW_KEEP_BYTES) return raw;

  // বড় হলে ক্যানভাসে 512px-এ স্কেল + PNG/JPEG রিএনকোড
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = raw;
    });
    const scale = Math.min(1, CUSTOM_ASSET_MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return raw;
    ctx.drawImage(img, 0, 0, w, h);
    // স্বচ্ছ পটভূমি ধরে রাখতে PNG; তবু বড় হলে JPEG ফলব্যাক
    const png = canvas.toDataURL('image/png');
    if (png.length <= RAW_KEEP_BYTES * 4) return png;
    return canvas.toDataURL('image/jpeg', 0.82);
  } catch {
    return raw;
  }
}
export type { CustomAssetRecord } from './dexie';
