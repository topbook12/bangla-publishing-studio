/**
 * কেন্দ্রীয় অ্যাপ স্টেট (Zustand) + অটোসেভ ইঞ্জিন
 */

'use client';

import { create } from 'zustand';
import {
  db, newId, saveProject, listProjects, deleteProject, getProject, LAST_PROJECT_KEY,
} from './dexie';
import { createDefaultSettings, createSamplePages, createEmptyPage } from './sample';
import type {
  BookProject, CoverData, DocumentSettings, PageData, PageKind, RibbonTab, SaveState,
} from './types';
import type { BookTheme } from './types';

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
}

export type EditorStore = EditorState & EditorActions;

// ─── অটোসেভ ───

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(get: () => EditorStore) {
  const { projectId, title, settings, pages } = get();
  if (!projectId) return;
  if (saveTimer) clearTimeout(saveTimer);
  get().setSaveState({ status: 'saving', at: Date.now() });
  saveTimer = setTimeout(async () => {
    const s = get();
    const pid = s.projectId;
    if (!pid) return;
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
    pages[idx] = { ...pages[idx], html: keptHtml || '<p></p>' };
    const newPage: PageData = {
      id: newId('pg'),
      kind: 'normal',
      html: overflowHtml || '<p></p>',
      noChrome: false,
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
    const nextIdx = idx + 1;
    if (nextIdx < pages.length) {
      pages[nextIdx] = { ...pages[nextIdx], html: overflowHtml + pages[nextIdx].html };
    } else {
      pages.push({
        id: newId('pg'),
        kind: 'normal',
        html: overflowHtml || '<p></p>',
        noChrome: false,
      });
    }
    set({ pages });
    touch(get);
  },

  // ── UI ──

  setActivePage: (pageId) => set({ activePageId: pageId }),
  setRibbonTab: (tab) => set({ activeRibbonTab: tab }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.35, zoom)) }),
  setSaveState: (saveState) => set({ saveState }),
  bumpSelection: () => set({ selectionVersion: get().selectionVersion + 1 }),
}));

/** কাজের স্টেট পরিষ্কার করে আগের প্রজেক্ট সেভ নিশ্চিত করা */
export function flushSave() {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
    const s = useEditorStore.getState();
    if (s.projectId) {
      void saveProject({
        id: s.projectId,
        title: s.title,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        settings: s.settings,
        pages: s.pages,
      }).catch(() => undefined);
    }
  }
}
