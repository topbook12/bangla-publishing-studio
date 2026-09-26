/**
 * JSON ব্যাকআপ (ডাউনলোড/ইমপোর্ট) ও প্রিন্ট পোর্টাল
 */

import type { BookProject } from './types';
import { saveProject } from './dexie';
import { useEditorStore } from './store';
import type { DocumentSettings } from './types';
import { getPaperPreset } from './paper';
import { createDefaultSettings } from './sample';

export function downloadJsonBackup(project: BookProject): void {
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.title.replace(/[\\/:*?"<>|]/g, '_')}-${new Date().toISOString().slice(0, 10)}.bwp.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function currentProjectJson(): BookProject | null {
  const s = useEditorStore.getState();
  if (!s.projectId) return null;
  return {
    id: s.projectId,
    title: s.title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    settings: s.settings,
    pages: s.pages,
  };
}

export async function importJsonBackup(file: File): Promise<'ok' | 'invalid'> {
  try {
    const text = await file.text();
    const parsed: unknown = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object') return 'invalid';
    const obj = parsed as Partial<BookProject>;
    if (!Array.isArray(obj.pages) || typeof obj.title !== 'string') return 'invalid';
    // পুরনো/আংশিক ব্যাকআপে settings-এর অংশ না থাকলে অ্যাপ ক্র্যাশ করত —
    // ডিফল্টের সাথে ডিপ-মার্জ করে সম্পূর্ণ DocumentSettings নিশ্চিত করা হয়
    const raw = (obj.settings && typeof obj.settings === 'object' ? obj.settings : {}) as Partial<DocumentSettings>;
    const base = createDefaultSettings();
    const settings = createDefaultSettings({
      ...(raw as DocumentSettings),
      customPaper: { ...base.customPaper, ...(raw.customPaper ?? {}) },
      margins: { ...base.margins, ...(raw.margins ?? {}) },
      header: { ...base.header, ...(raw.header ?? {}) },
      footer: { ...base.footer, ...(raw.footer ?? {}) },
      pageNumber: { ...base.pageNumber, ...(raw.pageNumber ?? {}) },
    });
    const id = `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await saveProject({
      id,
      title: obj.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings,
      pages: obj.pages,
    });
    await useEditorStore.getState().openProject(id);
    await useEditorStore.getState().refreshProjects();
    return 'ok';
  } catch {
    return 'invalid';
  }
}

// ─── প্রিন্ট পোর্টাল ───

let printStyleEl: HTMLStyleElement | null = null;

/**
 * @page স্টাইল-এলিমেন্ট — থাকলে সেটাই, না থাকলে তৈরি করে দিই।
 * ফরমা প্রিন্টও এটি ব্যবহার করে — সেশনে প্রথমবারই ফরমা প্রিন্ট করলেও
 * @page সঠিক থাকবে (আগে: সাধারণ প্রিন্ট না চালালে এলিমেন্টই ছিল না)।
 */
export function getOrCreatePrintStyleEl(): HTMLStyleElement {
  if (typeof document === 'undefined') throw new Error('no document');
  if (!printStyleEl || !printStyleEl.isConnected) {
    printStyleEl =
      (document.getElementById('bwp-print-page') as HTMLStyleElement | null) ??
      document.createElement('style');
    if (!printStyleEl.id) printStyleEl.id = 'bwp-print-page';
    if (!printStyleEl.isConnected) document.head.appendChild(printStyleEl);
  }
  return printStyleEl;
}

/** @page রুল ডাইনামিক সেট — কাগজের সাইজ অনুযায়ী */
export function ensurePrintStyle(settings: DocumentSettings): void {
  const preset = getPaperPreset(settings.paperSize);
  const size = settings.paperSize === 'custom'
    ? { w: settings.customPaper.widthMm, h: settings.customPaper.heightMm }
    : { w: preset.widthMm, h: preset.heightMm };
  const portrait = settings.orientation === 'portrait';
  const w = portrait ? size.w : size.h;
  const h = portrait ? size.h : size.w;

  getOrCreatePrintStyleEl().textContent = `@page { size: ${w}mm ${h}mm; margin: 0; }`;
}

/**
 * সাধারণ প্রিন্ট — @page সেট করার পরে ফন্ট ও ছবি লোড হওয়া পর্যন্ত অপেক্ষা করে
 * window.print() ধরা হয়। আগে মাত্র ৬০ms অপেক্ষা করত — ধীর ফন্ট/ছবিতে প্রিন্টে
 * ফলব্যাক ফন্ট বা ফাঁকা ছবি-বাক্স আসত (ফরমা প্রিন্টের মতোই রেন্ডার-রেডি নিশ্চিত)।
 */
export async function printDocument(): Promise<void> {
  const settings = useEditorStore.getState().settings;
  ensurePrintStyle(settings);
  // ফন্ট রেডি (সর্বোচ্চ ৬০০ms)
  try {
    await Promise.race([document.fonts.ready, new Promise<void>((r) => setTimeout(r, 600))]);
  } catch { /* ফন্ট API না থাকলে এগিয়ে যাও */ }
  // ছবি লোড (সর্বোচ্চ ৮০০ms)
  const pending = Array.from(document.images).filter((im) => !im.complete);
  if (pending.length) {
    await Promise.race([
      Promise.all(pending.map((im) => new Promise<void>((res) => {
        im.addEventListener('load', () => res(), { once: true });
        im.addEventListener('error', () => res(), { once: true });
      }))),
      new Promise<void>((r) => setTimeout(r, 800)),
    ]);
  }
  window.print();
}
