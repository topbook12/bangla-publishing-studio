/**
 * JSON ব্যাকআপ (ডাউনলোড/ইমপোর্ট) ও প্রিন্ট পোর্টাল
 */

import type { BookProject } from './types';
import { saveProject } from './dexie';
import { useEditorStore } from './store';
import type { DocumentSettings } from './types';
import { getPaperPreset } from './paper';

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
    const id = `bk-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    await saveProject({
      id,
      title: obj.title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      settings: obj.settings as DocumentSettings,
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

/** @page রুল ডাইনামিক সেট — কাগজের সাইজ অনুযায়ী */
export function ensurePrintStyle(settings: DocumentSettings): void {
  const preset = getPaperPreset(settings.paperSize);
  const size = settings.paperSize === 'custom'
    ? { w: settings.customPaper.widthMm, h: settings.customPaper.heightMm }
    : { w: preset.widthMm, h: preset.heightMm };
  const portrait = settings.orientation === 'portrait';
  const w = portrait ? size.w : size.h;
  const h = portrait ? size.h : size.w;

  if (typeof document === 'undefined') return;
  if (!printStyleEl) {
    printStyleEl = document.createElement('style');
    printStyleEl.id = 'bwp-print-page';
    document.head.appendChild(printStyleEl);
  }
  printStyleEl.textContent = `@page { size: ${w}mm ${h}mm; margin: 0; }`;
}

export function printDocument(): void {
  const settings = useEditorStore.getState().settings;
  ensurePrintStyle(settings);
  window.setTimeout(() => window.print(), 60);
}
