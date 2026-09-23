/**
 * অফলাইন স্টোরেজ — Dexie.js (IndexedDB)
 * সম্পূর্ণ ইন্টারনেট-বিহীন পরিবেশেও প্রজেক্ট সেভ থাকে।
 */

import Dexie, { type EntityTable } from 'dexie';
import type { BookProject } from './types';

/**
 * প্রজেক্টের HTML কনটেন্ট বড় হতে পারে, তাই প্রতিটি পৃষ্ঠা আলাদা রেকর্ড নয় —
 * একটি প্রজেক্ট = একটি রেকর্ড (সাধারণত < ১০ MB, IndexedDB-র জন্য ঠিক)।
 */
export type ProjectRecord = BookProject;

const db = new Dexie('bwp-studio') as Dexie & {
  projects: EntityTable<ProjectRecord, 'id'>;
};

db.version(1).stores({
  projects: 'id, title, updatedAt',
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
