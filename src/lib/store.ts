/**
 * কেন্দ্রীয় অ্যাপ স্টেট (Zustand) + অটোসেভ ইঞ্জিন
 */

'use client';

import { create } from 'zustand';
import {
  db, newId, saveProject, listProjects, deleteProject, getProject, LAST_PROJECT_KEY,
} from './dexie';
import type { SnapshotRecord } from './dexie';
import { createDefaultSettings, createSamplePages, createEmptyPage } from './sample';
import type {
  BookProject, CoverData, DocumentSettings, PageData, PageKind, RibbonTab, SaveState,
} from './types';
import type { BookTheme } from './types';

export type { SnapshotRecord } from './dexie';

interface ProjectMeta {
  id: string;
  title: string;
  updatedAt: number;
}

interface EditorState {
  loaded: boolean;
  projects: ProjectMeta[];
  projectId: string | null;
  title: string;
  settings: DocumentSettings;
  pages: PageData[];

  activeRibbonTab: RibbonTab;
  activePageId: string | null;
  zoom: number;
  saveState: SaveState;
  /** রিবনে প্রদর্শনী স্টেট রিফ্রেশের জন্য সংস্করণ কাউন্টার */
  selectionVersion: number;
}

interface EditorActions {
  init: () => Promise<void>;
  refreshProjects: () => Promise<void>;
  createProject: (title: string, withSample?: boolean) => Promise<void>;
  openProject: (id: string) => Promise<void>;
  duplicateProject: (id: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  renameProject: (title: string) => void;

  updateSettings: (patch: Partial<DocumentSettings>) => void;
  applyTheme: (theme: BookTheme) => void;

  addPage: (afterPageId: string | null, html?: string) => string;
  addCoverPage: (cover: CoverData) => void;
  updateCover: (pageId: string, cover: CoverData) => void;
  deletePage: (pageId: string) => void;
  duplicatePage: (pageId: string) => void;
  movePage: (pageId: string, direction: -1 | 1) => void;
  updatePageHtml: (pageId: string, html: string) => void;
  updatePage: (pageId: string, patch: Partial<PageData>) => void;
  replacePageHtml: (pageId: string, html: string) => void;
  splitPageAt: (pageId: string, keptHtml: string, overflowHtml: string) => void;
  flowOverflow: (pageId: string, keptHtml: string, overflowHtml: string) => void;

  setActivePage: (pageId: string | null) => void;
  setRibbonTab: (tab: RibbonTab) => void;
  setZoom: (zoom: number) => void;
  bumpSelection: () => void;
  setSaveState: (s: SaveState) => void;

  // ── স্ন্যাপশট (ভার্সন ব্যাকআপ) ──
  /** বর্তমান অবস্থার স্ন্যাপশট নেয় + পুরনোগুলো প্রুন (প্রতি প্রজেক্টে সর্বোচ্চ ১৫টি) */
  takeSnapshot: (kind: 'auto' | 'manual') => Promise<void>;
  /** স্ন্যাপশট তালিকা (নতুন আগে); projectId না দিলে চালু বইয়ের */
  listSnapshots: (projectId?: string) => Promise<SnapshotRecord[]>;
  /** পুনরুদ্ধার — আগে বর্তমান অবস্থার নিরাপত্তা-স্ন্যাপশট, তারপর স্ন্যাপশটের অবস্থা লোড */
  restoreSnapshot: (id: string) => Promise<void>;
  deleteSnapshot: (id: string) => Promise<void>;
}

export type EditorStore = EditorState & EditorActions;

// ─── অটোসেভ ───

let saveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * শেষ সফল সেভের স্ন্যাপশট (রেফারেন্স, ক্লোন নয়) — ডার্টি-চেকের জন্য।
 * title/settings/pages তিনটার রেফারেন্সই অপরিবর্তিত থাকলে স্টেট বদলায়নি —
 * একই অবস্থা আবার IndexedDB-তে লেখার খরচ (সিরিয়ালাইজ + I/O) এড়ানো যায়।
 */
let lastSaved: { title: string; settings: DocumentSettings; pages: PageData[] } | null = null;

// ─── স্ন্যাপশট (ভার্সন ব্যাকআপ) ───

/** প্রতি প্রজেক্টে সর্বোচ্চ রাখা স্ন্যাপশট সংখ্যা */
const SNAPSHOT_KEEP = 15;
/** স্বয়ংক্রিয় স্ন্যাপশটের ব্যবধান — ৫ মিনিট */
const AUTO_SNAPSHOT_MS = 5 * 60 * 1000;

let snapshotTimer: ReturnType<typeof setInterval> | null = null;
/** শেষ স্ন্যাপশটের pages রেফারেন্স — একই রেফারেন্স মানে কোনো পরিবর্তন নেই (স্কিপ) */
let lastSnapshottedPages: PageData[] | null = null;

/**
 * অটো-স্ন্যাপশট লুপ — init() প্রথম ডাকেই (লেজি) চালু হয়, অ্যাপের জীবনজুড়ে একটাই।
 * ৫ মিনিট পরপর: বই খোলা আছে এবং শেষ স্ন্যাপশটের পর pages বদলে থাকলে (রেফারেন্স-চেক —
 * স্টোর প্রতিবার নতুন অ্যারে বানায়) নীরবে 'auto' স্ন্যাপশট নেয়।
 */
function ensureAutoSnapshotLoop(get: () => EditorStore): void {
  if (snapshotTimer || typeof window === 'undefined') return;
  snapshotTimer = setInterval(() => {
    const s = get();
    if (!s.projectId) return;
    if (s.pages === lastSnapshottedPages) return;
    void s.takeSnapshot('auto');
  }, AUTO_SNAPSHOT_MS);
}

function scheduleSave(get: () => EditorStore) {
  const { projectId, title, settings, pages } = get();
  if (!projectId) return;
  if (saveTimer) clearTimeout(saveTimer);
  get().setSaveState({ status: 'saving', at: Date.now() });
  saveTimer = setTimeout(async () => {
    const s = get();
    const pid = s.projectId;
    if (!pid) return;
    // ডার্টি-চেক: শেষ সেভের পর কিছুই বদলায়নি → লেখা সম্পূর্ণ এড়িয়ে যাই।
    // saveState স্পর্শ করা হয় না — অপরিবর্তিত স্টেটের জন্য সেভ-ইঙ্গিত অর্থহীন।
    if (
      lastSaved &&
      s.title === lastSaved.title &&
      s.settings === lastSaved.settings &&
      s.pages === lastSaved.pages
    ) {
      return;
    }
    try {
      const record: BookProject = {
        id: pid,
        title: s.title,
        createdAt: Date.now(), // createdAt নিচে সংরক্ষিত মানে মার্জ হবে
        updatedAt: Date.now(),
        settings: s.settings,
        pages: s.pages,
      };
      const existing = await getProject(pid);
      if (existing) record.createdAt = existing.createdAt;
      await saveProject(record);
      // সফল লেখার পর স্ন্যাপশট — পরের টাইমার এই রেফারেন্সগুলোর সাথে মিলিয়ে দেখবে
      lastSaved = { title: s.title, settings: s.settings, pages: s.pages };
      if (get().saveState.status === 'saving') {
        get().setSaveState({ status: 'saved', at: Date.now() });
      }
    } catch {
      get().setSaveState({ status: 'error', at: Date.now() });
    }
  }, 800);
}

function touch(get: () => EditorStore) {
  scheduleSave(get);
}

// ─── গভীর মার্জ (settings-এর জন্য) ───

function mergeSettings(current: DocumentSettings, patch: Partial<DocumentSettings>): DocumentSettings {
  const out: DocumentSettings = { ...current };
  const target = out as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    const k = key as keyof DocumentSettings;
    if (value === undefined) continue;
    const cur = current[k];
    if (
      cur && value && typeof cur === 'object' && typeof value === 'object' &&
      !Array.isArray(cur) && !Array.isArray(value)
    ) {
      // নেস্টেড অবজেক্ট (margins/header/footer/pageNumber/customPaper)
      target[k] = {
        ...(cur as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    } else {
      target[k] = value;
    }
  }
  return out;
}

const initialSettings = createDefaultSettings();

export const useEditorStore = create<EditorStore>((set, get) => ({
  loaded: false,
  projects: [],
  projectId: null,
  title: 'শিরোনামহীন বই',
  settings: initialSettings,
  pages: [createEmptyPage()],

  activeRibbonTab: 'home',
  activePageId: null,
  zoom: 1,
  saveState: { status: 'idle', at: null },
  selectionVersion: 0,

  // ── প্রজেক্ট লাইফসাইকেল ──

  init: async () => {
    // অটো-স্ন্যাপশট লুপ — প্রথম init-এই লেজি-স্টার্ট (অ্যাপজুড়ে একটাই টাইমার)
    ensureAutoSnapshotLoop(get);
    try {
      await db.open();
      const lastId = typeof window !== 'undefined' ? window.localStorage.getItem(LAST_PROJECT_KEY) : null;
      if (lastId) {
        const existing = await getProject(lastId);
        if (existing) {
          set({
            projectId: existing.id,
            title: existing.title,
            settings: existing.settings,
            pages: existing.pages.length ? existing.pages : [createEmptyPage()],
            activePageId: existing.pages[0]?.id ?? null,
            loaded: true,
          });
          await get().refreshProjects();
          return;
        }
      }
      await get().createProject('আমার প্রথম বই', true);
    } catch {
      // IndexedDB না চললেও ইন-মেমরি মোডে চলবে
      set({ loaded: true });
    }
  },

  refreshProjects: async () => {
    try {
      set({ projects: await listProjects() });
    } catch {
      set({ projects: [] });
    }
  },

  createProject: async (title, withSample = false) => {
    // আগের বইয়ের অপেক্ষমাণ সেভ আগে ডিস্কে
    await flushSave();
    const id = newId('bk');
    const now = Date.now();
    const project: BookProject = {
      id,
      title: title || 'শিরোনামহীন বই',
      createdAt: now,
      updatedAt: now,
      settings: createDefaultSettings(),
      pages: withSample ? createSamplePages() : [createEmptyPage()],
    };
    try {
      await saveProject(project);
    } catch { /* ইন-মেমরি */ }
    if (typeof window !== 'undefined') window.localStorage.setItem(LAST_PROJECT_KEY, id);
    set({
      projectId: id,
      title: project.title,
      settings: project.settings,
      pages: project.pages,
      activePageId: project.pages[0]?.id ?? null,
      loaded: true,
      saveState: { status: 'saved', at: now },
    });
    await get().refreshProjects();
  },

  openProject: async (id) => {
    try {
      // আগের বইয়ের অপেক্ষমাণ সেভ ডিস্কে লেখা — না হলে শেষ ≤৮০০ms-এর টাইপিং
      // নতুন বইয়ের স্টেট দিয়ে প্রতিস্থাপিত হয়ে চিরতরে হারিয়ে যেত
      await flushSave();
      const project = await getProject(id);
      if (!project) return;
      if (typeof window !== 'undefined') window.localStorage.setItem(LAST_PROJECT_KEY, id);
      set({
        projectId: project.id,
        title: project.title,
        settings: project.settings,
        pages: project.pages.length ? project.pages : [createEmptyPage()],
        activePageId: project.pages[0]?.id ?? null,
        saveState: { status: 'saved', at: Date.now() },
      });
    } catch { /* উপেক্ষা */ }
  },

  duplicateProject: async (id) => {
    try {
      // কপি নেওয়ার আগে সোর্স বইয়ের অপেক্ষমাণ সেভ ডিস্কে — নইলে পুরনো অবস্থার কপি হয়
      await flushSave();
      const src = await getProject(id);
      if (!src) return;
      const copy: BookProject = {
        ...src,
        id: newId('bk'),
        title: `${src.title} (কপি)`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      await saveProject(copy);
      await get().refreshProjects();
    } catch { /* উপেক্ষা */ }
  },

  removeProject: async (id) => {
    try {
      // ডিলিটের আগে পেন্ডিং টাইমার বাতিল (সেভ নয়) — নইলে await-এর ফাঁকে
      // টাইমার চলে মুছে-ফেলা রেকর্ডটি আবার IndexedDB-তে লিখে ফেলে (পুনরুত্থান)
      cancelPendingSave();
      await deleteProject(id);
      await get().refreshProjects();
      if (get().projectId === id) {
        const remaining = get().projects;
        if (remaining.length > 0) {
          await get().openProject(remaining[0].id);
        } else {
          await get().createProject('শিরোনামহীন বই', true);
        }
      }
    } catch { /* উপেক্ষা */ }
  },

  renameProject: (title) => {
    set({ title });
    touch(get);
  },

  // ── সেটিংস ──

  updateSettings: (patch) => {
    set({ settings: mergeSettings(get().settings, patch) });
    touch(get);
  },

  applyTheme: (theme) => {
    const s = get().settings;
    set({
      settings: {
        ...s,
        paperColor: theme.paperColor,
        header: { ...s.header, style: theme.headerStyle, accentColor: theme.accentColor },
        footer: { ...s.footer, style: theme.headerStyle === 'parallel' ? 'plain' : theme.headerStyle, accentColor: theme.accentColor },
        pageNumber: { ...s.pageNumber, format: 'bangla' },
        defaultFont: theme.defaultFont,
        defaultFontSize: theme.defaultFontSize,
        lineHeight: theme.lineHeight,
        pageBorder: theme.pageBorder,
        pageBorderColor: theme.accentColor,
      },
    });
    touch(get);
  },

  // ── পৃষ্ঠা অপারেশন ──

  addPage: (afterPageId, html) => {
    const pages = [...get().pages];
    const page: PageData = {
      id: newId('pg'),
      kind: 'normal',
      html: html ?? '<p></p>',
      noChrome: false,
    };
    if (afterPageId === null) {
      pages.push(page);
    } else {
      const idx = pages.findIndex((p) => p.id === afterPageId);
      pages.splice(idx >= 0 ? idx + 1 : pages.length, 0, page);
    }
    set({ pages });
    touch(get);
    return page.id;
  },

  addCoverPage: (cover) => {
    const pages = [...get().pages];
    const existingCoverIdx = pages.findIndex((p) => p.kind === 'cover');
    const page: PageData = {
      id: newId('pg'),
      kind: 'cover',
      html: '',
      noChrome: true,
      coverData: cover,
    };
    if (existingCoverIdx >= 0) {
      pages[existingCoverIdx] = page;
    } else {
      pages.unshift(page);
    }
    set({ pages });
    touch(get);
  },

  updateCover: (pageId, cover) => {
    const pages = get().pages.map((p) => (p.id === pageId ? { ...p, coverData: cover } : p));
    set({ pages });
    touch(get);
  },

  deletePage: (pageId) => {
    const pages = get().pages;
    if (pages.length <= 1) return;
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const next = pages.filter((p) => p.id !== pageId);
    const newActive = next[Math.min(idx, next.length - 1)].id;
    set({ pages: next, activePageId: get().activePageId === pageId ? newActive : get().activePageId });
    touch(get);
  },

  duplicatePage: (pageId) => {
    const pages = [...get().pages];
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const copy: PageData = { ...pages[idx], id: newId('pg') };
    pages.splice(idx + 1, 0, copy);
    set({ pages });
    touch(get);
  },

  movePage: (pageId, direction) => {
    const pages = [...get().pages];
    const idx = pages.findIndex((p) => p.id === pageId);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= pages.length) return;
    const [removed] = pages.splice(idx, 1);
    pages.splice(target, 0, removed);
    set({ pages });
    touch(get);
  },

  updatePageHtml: (pageId, html) => {
    const pages = get().pages;
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0 || pages[idx].html === html) return;
    const next = [...pages];
    next[idx] = { ...next[idx], html };
    set({ pages: next });
    touch(get);
  },

  updatePage: (pageId, patch) => {
    const pages = get().pages.map((p) => (p.id === pageId ? { ...p, ...patch } : p));
    set({ pages });
    touch(get);
  },

  replacePageHtml: (pageId, html) => {
    // অটো-ফ্লো থেকে আসা আপডেট — এডিটর নিজেই জানে, শুধু স্টোর সিঙ্ক
    const pages = get().pages;
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const next = [...pages];
    next[idx] = { ...next[idx], html };
    set({ pages: next });
    touch(get);
  },

  splitPageAt: (pageId, keptHtml, overflowHtml) => {
    const pages = [...get().pages];
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    const src = pages[idx];
    pages[idx] = { ...src, html: keptHtml || '<p></p>' };
    // স্প্লিট থেকে সৃষ্ট ধারাবাহিক পাতা — সোর্স পাতার chrome সেটিং বহাল থাকে
    // (না হলে অধ্যায়ের শুরুর noChrome পাতা ভাঙলে হঠাৎ হেডার/ফুটার চলে আসে)
    const newPage: PageData = {
      id: newId('pg'),
      kind: 'normal',
      html: overflowHtml || '<p></p>',
      noChrome: src?.noChrome ?? false,
      headerOverride: src?.headerOverride ?? null,
      footerOverride: src?.footerOverride ?? null,
    };
    pages.splice(idx + 1, 0, newPage);
    set({ pages });
    touch(get);
  },

  flowOverflow: (pageId, keptHtml, overflowHtml) => {
    const pages = [...get().pages];
    const idx = pages.findIndex((p) => p.id === pageId);
    if (idx < 0) return;
    pages[idx] = { ...pages[idx], html: keptHtml || '<p></p>' };
    // কভার পাতায় (kind !== 'normal') কনটেন্ট ঢালা যাবে না — কভারের html
    // কখনোই রেন্ডার হয় না, ওখানে লিখলে লেখা চিরতরে হারিয়ে যেত।
    // সঙ্গে সঙ্গের পাতা normal না হলে বর্তমান পাতার পরেই নতুন normal পাতা ঢোকানো হয়।
    const nextIdx = idx + 1;
    if (nextIdx < pages.length && pages[nextIdx].kind === 'normal') {
      pages[nextIdx] = { ...pages[nextIdx], html: overflowHtml + pages[nextIdx].html };
    } else {
      // নতুন ধারাবাহিক পাতা — সোর্সের chrome সেটিং উত্তরাধিকারসূত্রে পায়
      const src = pages[idx];
      const newPage: PageData = {
        id: newId('pg'),
        kind: 'normal',
        html: overflowHtml || '<p></p>',
        noChrome: src?.noChrome ?? false,
        headerOverride: src?.headerOverride ?? null,
        footerOverride: src?.footerOverride ?? null,
      };
      pages.splice(nextIdx, 0, newPage);
    }
    set({ pages });
    touch(get);
  },

  // ── স্ন্যাপশট (ভার্সন ব্যাকআপ) ──

  takeSnapshot: async (kind) => {
    const s = get();
    if (!s.projectId) return;
    try {
      // pages/settings রেফারেন্স-ই — লেখার সময় IndexedDB নিজেই ক্লোন করে
      const record: SnapshotRecord = {
        id: newId('snap'),
        projectId: s.projectId,
        title: s.title,
        createdAt: Date.now(),
        kind,
        pages: s.pages,
        settings: s.settings,
      };
      await db.snapshots.put(record);
      // প্রুন — এই প্রজেক্টের নতুন SNAPSHOT_KEEP-টি রাখা, পুরনোগুলো মুছা
      const all = await db.snapshots.where('projectId').equals(s.projectId).sortBy('createdAt');
      const stale = all.slice(0, Math.max(0, all.length - SNAPSHOT_KEEP));
      if (stale.length) await db.snapshots.bulkDelete(stale.map((r) => r.id));
      lastSnapshottedPages = s.pages;
    } catch { /* ইন-মেমরি মোড / IndexedDB অনুপলব্ধ */ }
  },

  listSnapshots: async (projectId) => {
    const pid = projectId ?? get().projectId;
    if (!pid) return [];
    try {
      const rows = await db.snapshots.where('projectId').equals(pid).sortBy('createdAt');
      return rows.reverse(); // নতুন আগে
    } catch {
      return [];
    }
  },

  restoreSnapshot: async (id) => {
    try {
      // পেন্ডিং ডিবাউন্সড সেভ আগে বাতিল — নইলে অপেক্ষমাণ পুরনো অবস্থা পরে ফেরত লিখতে পারে
      // (বর্তমান অবস্থা ঠিক পরের লাইনের নিরাপত্তা-স্ন্যাপশটে সংরক্ষিত হচ্ছে)
      cancelPendingSave();
      // নিরাপত্তা-জাল: পুনরুদ্ধারের আগে বর্তমান অবস্থার স্ন্যাপশট — ভুল পুনরুদ্ধারও ফেরানো যায়
      await get().takeSnapshot('auto');
      const rec = await db.snapshots.get(id);
      if (!rec) return;
      const pid = get().projectId;
      if (!pid || rec.projectId !== pid) return; // অন্য বইয়ের স্ন্যাপশট — অগ্রাহ্য
      // পুরো বই লোড + সরাসরি সম্পূর্ণ সেভ (মূল createdAt সংরক্ষণ — flushSave প্যাটার্ন)
      const existing = await getProject(pid);
      await saveProject({
        id: pid,
        title: rec.title,
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        settings: rec.settings,
        pages: rec.pages,
      });
      lastSaved = { title: rec.title, settings: rec.settings, pages: rec.pages };
      lastSnapshottedPages = rec.pages;
      // সক্রিয় পাতা পুনরুদ্ধার-করা পাতার তালিকায় থাকলে ধরে রাখা (UX), নইলে প্রথম পাতা
      const curActive = get().activePageId;
      const nextActive = rec.pages.some((p) => p.id === curActive) ? curActive : (rec.pages[0]?.id ?? null);
      set({
        title: rec.title,
        settings: rec.settings,
        pages: rec.pages,
        activePageId: nextActive,
        saveState: { status: 'saved', at: Date.now() },
      });
    } catch { /* ইন-মেমরি মোড */ }
  },

  deleteSnapshot: async (id) => {
    try {
      await db.snapshots.delete(id);
    } catch { /* ইন-মেমরি মোড */ }
  },

  // ── UI ──

  setActivePage: (pageId) => set({ activePageId: pageId }),
  setRibbonTab: (tab) => set({ activeRibbonTab: tab }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.35, zoom)) }),
  setSaveState: (saveState) => set({ saveState }),
  bumpSelection: () => set({ selectionVersion: get().selectionVersion + 1 }),
}));

/**
 * কাজের স্টেট পরিষ্কার করে আগের প্রজেক্ট সেভ নিশ্চিত করা।
 * প্রজেক্ট সুইচ/ইম্পোর্ট/ডুপ্লিকেটের আগে await করে ডাকা হয় — শেষ মুহূর্তের
 * সম্পাদনা হারানো ও পুরনো অবস্থার কপি হওয়া ঠেকাতে।
 */
export function flushSave(): Promise<void> {
  if (!saveTimer) return Promise.resolve();
  clearTimeout(saveTimer);
  saveTimer = null;
  const s = useEditorStore.getState();
  const pid = s.projectId;
  if (!pid) return Promise.resolve();
  return (async () => {
    try {
      const existing = await getProject(pid);
      await saveProject({
        id: pid,
        title: s.title,
        // মূল createdAt সংরক্ষণ — Date.now() লিখলে বইয়ের সৃষ্টি-তারিখ রিসেট হয়ে যেত
        createdAt: existing?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        settings: s.settings,
        pages: s.pages,
      });
      // ফ্লাশ-সেভও সফল হলে স্ন্যাপশট হালনাগাদ করে — নইলে পরের ডিবাউন্সড সেভ
      // একই অবস্থা আবার লিখে ফেলত
      lastSaved = { title: s.title, settings: s.settings, pages: s.pages };
    } catch { /* ইন-মেমরি মোড */ }
  })();
}

/** অপেক্ষমাণ টাইমার শুধু বাতিল — রেকর্ড ডিলিটের আগে (পুনরুত্থান ঠেকাতে) */
export function cancelPendingSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
}
