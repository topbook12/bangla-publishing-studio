/**
 * টেমপ্লেট প্যাক — কমিউনিটি ভাগাভাগি (Template packs — community sharing)
 * ────────────────────────────────────────────────────────────────────────
 * ডকুমেন্ট স্টুডিওর ৫৫ নকশার যেকোনোটির "ফরম-পূরণ করা রেসিপি" JSON প্যাক হিসেবে
 * এক্সপোর্ট/ইমপোর্ট করা যায় — স্কুল, কোচিং, অফিস নিজেদের সেট প্রতিষ্ঠানে ভাগ করে
 * নেয়। ১০০% local-first: ফাইল-ভিত্তিক বিনিময় (ক্লাউড ছাড়াই কাজ করে), ইনস্টল
 * হলে localStorage-এ থাকে, উইজার্ড ধাপ-১-এ "কমিউনিটি প্যাক" সেকশনে দেখা যায়।
 *
 * প্যাক-স্কিমা (v1):
 *   { v: 1, name, desc?, author?, entries: [{ tplId, values, styleId? }] }
 * — tplId অবশ্যই DS_TEMPLATES-এ থাকতে হবে; values শুধু ওই টেমপ্লেটের বৈধ
 *   ফিল্ড-id রাখবে (অজানা ফিল্ড পরিষ্কার হয়ে যাবে); styleId অবৈধ হলে
 *   টেমপ্লেটের defaultStyle-এ ফিরে যাবে। যাচাই ব্যর্থ হলে null — কখনো
 *   exception নয় (import-পথে ব্যবহারকারী-বান্ধব বার্তা)।
 */

import { DS_TEMPLATES, type DsValues } from '@/lib/document-studio';

export interface PackEntry {
  tplId: string;
  values: Record<string, string>;
  styleId?: string;
}

export interface TemplatePack {
  v: 1;
  name: string;
  desc?: string;
  author?: string;
  entries: PackEntry[];
}

export interface InstalledPack extends TemplatePack {
  packId: string;
  installedAt: number;
}

const LS_KEY = 'bps.packs.v1';
const MAX_ENTRIES = 24;
const MAX_VALUE_LEN = 4000;
const MAX_PACK_JSON = 256 * 1024; // প্যাক-ফাইল সাইজ-সীমা

/** id-নিরাপদ নাম → ফাইল-নামের জন্য */
function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF\u0900-\u097F]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return base || 'pack';
}

/** এক টেমপ্লেটের মান-সেট যাচাই — অজানা ফিল্ড ফেলে দেয়, মান-সীমা মানে */
function sanitizeEntry(rawEntry: unknown): PackEntry | null {
  if (!rawEntry || typeof rawEntry !== 'object') return null;
  const e = rawEntry as Record<string, unknown>;
  const tplId = typeof e.tplId === 'string' ? e.tplId : '';
  const tpl = DS_TEMPLATES.find((t) => t.id === tplId);
  if (!tpl) return null;

  const validIds = new Set(tpl.fields.map((f) => f.id));
  const rawValues = e.values;
  const values: Record<string, string> = {};
  if (rawValues && typeof rawValues === 'object') {
    for (const [k, val] of Object.entries(rawValues as Record<string, unknown>)) {
      // প্রোটো-কী কখনো নয়; অজানা ফিল্ড-ও নয়
      if (k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      if (!validIds.has(k)) continue;
      if (typeof val !== 'string') continue;
      const v = val.slice(0, MAX_VALUE_LEN);
      if (v.trim()) values[k] = v;
    }
  }

  const styleId = typeof e.styleId === 'string' && tpl.styles.includes(e.styleId) ? e.styleId : undefined;
  return { tplId: tpl.id, values, ...(styleId ? { styleId } : {}) };
}

/**
 * অজানা ডাটা → যাচাই-করা TemplatePack। ব্যর্থ হলে null (কখনো throw নয়)।
 * সম্পূর্ণ নতুন অবজেক্ট বিল্ড করে — আসল ইনপুটের রেফারেন্স রাখে না।
 */
export function validatePack(raw: unknown): TemplatePack | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (p.v !== 1) return null;
  const name = typeof p.name === 'string' ? p.name.trim().slice(0, 80) : '';
  if (!name) return null;
  const desc = typeof p.desc === 'string' ? p.desc.trim().slice(0, 220) : undefined;
  const author = typeof p.author === 'string' ? p.author.trim().slice(0, 60) : undefined;

  if (!Array.isArray(p.entries) || p.entries.length === 0) return null;
  const entries: PackEntry[] = [];
  const seen = new Set<string>();
  for (const rawEntry of p.entries.slice(0, MAX_ENTRIES)) {
    const entry = sanitizeEntry(rawEntry);
    if (!entry) continue;
    // এক প্যাকে এক টেমপ্লেট একবারই — পুরোনোটা রাখে
    if (seen.has(entry.tplId)) continue;
    seen.add(entry.tplId);
    entries.push(entry);
  }
  if (entries.length === 0) return null;

  return { v: 1, name, ...(desc ? { desc } : {}), ...(author ? { author } : {}), entries };
}

/** localStorage → ইনস্টল করা প্যাকগুলো (ভাঙা ডাটা হলে নীরবে খালি) */
export function loadInstalledPacks(): InstalledPack[] {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const arr: unknown = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const out: InstalledPack[] = [];
    for (const item of arr) {
      if (!item || typeof item !== 'object') continue;
      const rec = item as Record<string, unknown>;
      const packId = typeof rec.packId === 'string' ? rec.packId : '';
      const installedAt = typeof rec.installedAt === 'number' ? rec.installedAt : 0;
      if (!packId || !installedAt) continue;
      const pack = validatePack(item);
      if (pack) out.push({ ...pack, packId, installedAt });
    }
    return out;
  } catch {
    return [];
  }
}

function saveInstalledPacks(packs: InstalledPack[]): void {
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(packs));
  } catch {
    // প্রাইভেট-মোড/কোটা-ভর্তি — নীরবে থাকে (local-first: এই সেশনেই কাজ চলবে)
  }
}

/** প্যাক ইনস্টল — ইউনিক packId দিয়ে তালিকার শুরুতে ঢোকে; একই নামের আগের প্যাক বদলে যায় (রি-ইনস্টল=আপডেট) */
export function installPack(pack: TemplatePack): InstalledPack {
  const installed: InstalledPack = {
    ...pack,
    packId: `pk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    installedAt: Date.now(),
  };
  const prev = loadInstalledPacks().filter((p) => p.name !== pack.name);
  saveInstalledPacks([installed, ...prev]);
  return installed;
}

/** packId দিয়ে আনইনস্টল — বাকিগুলো ফেরত */
export function uninstallPack(packId: string): InstalledPack[] {
  const next = loadInstalledPacks().filter((p) => p.packId !== packId);
  saveInstalledPacks(next);
  return next;
}

/** নাম-মিলিয়ে ইনস্টল আছে কি না (স্টার্টার-প্যাকের ইনস্টল-বোতামের অবস্থা) */
export function isPackInstalled(name: string): boolean {
  return loadInstalledPacks().some((p) => p.name === name);
}

/**
 * বর্তমান উইজার্ড-অবস্থা (টেমপ্লেট+মান+সাজ) → এক-এন্ট্রি প্যাক —
 * ধাপ-৩-এর "প্যাক হিসেবে সেভ" বোতামে ব্যবহৃত।
 */
export function makePackFromCurrent(tplId: string, values: DsValues, styleId: string, name: string, author?: string): TemplatePack {
  const tpl = DS_TEMPLATES.find((t) => t.id === tplId);
  if (!tpl) throw new Error('unknown-template');
  const clean: Record<string, string> = {};
  for (const f of tpl.fields) {
    const v = values[f.id];
    if (typeof v === 'string' && v.trim()) clean[f.id] = v.slice(0, MAX_VALUE_LEN);
  }
  const pack = validatePack({
    v: 1,
    name: name.trim().slice(0, 80) || tpl.name.en,
    author,
    entries: [{ tplId: tpl.id, values: clean, styleId: tpl.styles.includes(styleId) ? styleId : tpl.defaultStyle }],
  });
  if (!pack) throw new Error('pack-build-failed');
  return pack;
}

/** প্যাক → .bpspack.json ডাউনলোড */
export function downloadPackFile(pack: TemplatePack): void {
  const json = JSON.stringify(pack, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slugify(pack.name)}.bpspack.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** প্যাক-ফাইল পড়ে যাচাই-করা প্যাক ফেরত — ভাঙা হলে throw (কলার টোস্ট দেয়) */
export async function readPackFile(file: File): Promise<TemplatePack> {
  if (file.size > MAX_PACK_JSON) throw new Error('too-large');
  const text = await file.text();
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('not-json');
  }
  const pack = validatePack(raw);
  if (!pack) throw new Error('invalid');
  return pack;
}

/** বান্ডেল-করা স্টার্টার প্যাক (public/packs/ থেকে fetch) */
export const STARTER_PACKS: Array<{ file: string; name: string }> = [
  { file: '/packs/school-pack.bpspack.json', name: 'স্কুল অফিস প্যাক' },
  { file: '/packs/office-pack.bpspack.json', name: 'ছোট অফিস প্যাক' },
];

export async function fetchStarterPack(file: string): Promise<TemplatePack> {
  const res = await fetch(file);
  if (!res.ok) throw new Error('fetch-failed');
  const raw: unknown = await res.json();
  const pack = validatePack(raw);
  if (!pack) throw new Error('invalid');
  return pack;
}
