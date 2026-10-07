/**
 * অফলাইন স্টোরেজ — Dexie.js (IndexedDB)
 * সম্পূর্ণ ইন্টারনেট-বিহীন পরিবেশেও প্রজেক্ট সেভ থাকে।
 */

import Dexie, { type EntityTable } from 'dexie';
import type { BookProject, DocumentSettings, PageData } from './types';

/**
 * প্রজেক্টের HTML কনটেন্ট বড় হতে পারে, তাই প্রতিটি পৃষ্ঠা আলাদা রেকর্ড নয় —
 * একটি প্রজেক্ট = একটি রেকর্ড (সাধারণত < ১০ MB, IndexedDB-র জন্য ঠিক)।
 */
export type ProjectRecord = BookProject;

/**
 * স্ন্যাপশট (ভার্সন ব্যাকআপ) — পুরো বইয়ের এক মুহূর্তের অবস্থা।
 * kind: 'auto' = প্রতি ৫ মিনিটে/পুনরুদ্ধারের আগে স্বয়ংক্রিয়, 'manual' = ব্যবহারকারীর নেওয়া।
 * pages/settings রেফারেন্স হিসেবেই রাখা হয় — IndexedDB লেখার সময়
 * structured-clone হয়ে যায়, তাই পরের সম্পাদনায় স্ন্যাপশট নষ্ট হয় না।
 */
export interface SnapshotRecord {
  id: string;
  projectId: string;
  title: string;
  createdAt: number;
  kind: 'auto' | 'manual';
  pages: PageData[];
  settings: DocumentSettings;
}

/**
 * ডিজাইন স্টোরের নিজের আপলোড (ব্যবহারকারীর স্টিকার/ছবি) — dataURL হিসেবে থাকে
 * (ছোট অলংকার-ছবির জন্য ঠিক; ক্যাপ ~1.5 MB/আইটেম আপলোডের সময়ই ধোয়া হয়)।
 */
export interface CustomAssetRecord {
  id: string;
  name: string;
  /** image/* dataURL */
  dataUrl: string;
  createdAt: number;
}

const db = new Dexie('bwp-studio') as Dexie & {
  projects: EntityTable<ProjectRecord, 'id'>;
  snapshots: EntityTable<SnapshotRecord, 'id'>;
  assets: EntityTable<CustomAssetRecord, 'id'>;
};

db.version(1).stores({
  projects: 'id, title, updatedAt',
});

// সংস্করণ ২ — শুধু নতুন `snapshots` টেবিল যোগ (অ্যাডিটিভ স্কিমা-বৃদ্ধি;
// উল্লেখ-না-করা টেবিল আগের স্কিমায় অক্ষত থাকে — পুরনো ডেটা/আপগ্রেড নিরাপদ)
db.version(2).stores({
  snapshots: 'id, projectId, createdAt',
});

// সংস্করণ ৩ — ডিজাইন স্টোরের নিজের আপলোড (অ্যাডিটিভ)
db.version(3).stores({
  assets: 'id, name, createdAt',
});

export { db };

/** নতুন id তৈরি (crypto.randomUUID ব্যবহারযোগ্য হলে) */
export function newId(prefix = 'pg'): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 13)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function listProjects(): Promise<Array<Pick<BookProject, 'id' | 'title' | 'updatedAt'>>> {
  return db.projects.orderBy('updatedAt').reverse().toArray().then((rows) =>
    rows.map((r) => ({ id: r.id, title: r.title, updatedAt: r.updatedAt })),
  );
}

export async function getProject(id: string): Promise<ProjectRecord | undefined> {
  return db.projects.get(id);
}

export async function saveProject(project: BookProject): Promise<void> {
  await db.projects.put(project);
}

export async function deleteProject(id: string): Promise<void> {
  await db.projects.delete(id);
}

export const LAST_PROJECT_KEY = 'bwp-last-project';
