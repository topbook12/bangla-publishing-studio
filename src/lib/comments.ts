/**
 * দিন ৬৪ — কমেন্ট/রিভিউ-থ্রেড স্টোর (margin-note ধাঁচ)
 *
 * নীতি (local-first অক্ষত):
 *  - অ্যাঙ্কর (`<span data-comment-id>`) পাতার HTML-এর ভিতরেই থাকে — দলিলের
 *    সাথেই সেভ/লোড/শেয়ার/স্ন্যাপশট হয়, আলাদা কিছু পাঠাতে হয় না।
 *  - থ্রেড-মেটাডেটা (লেখা/উত্তর/সমাধান) Dexie `comments` টেবিলে — docId =
 *    BookProject.id। IndexedDB না চললে ইন-মেমরি মোডে চলে (সেশন-স্কোপ)।
 *  - অ্যাঙ্কর হারানো থ্রেড (লেখা মুছে ফেলা/পাতা মোছা) প্রকল্প খোলার সময় ও
 *    পাতা-অপারেশনের পরে পরিষ্কার হয় — ভূত-বুদবুদ জমে না।
 *  - @উল্লেখ: প্রেজেন্স পরিচয় (দিন ৬৩) থেকে নাম-তালিকা; লেখায় সাদামাটা
 *    টেক্সট `@নাম` হিসেবেই থাকে — রেন্ডারে হাইলাইট।
 */

'use client';

import { create } from 'zustand';
import { db, newId } from './dexie';
import type { CommentMessage, CommentThread } from './types';
import { useEditorStore } from './store';
import { PRESENCE_COLORS, usePresenceStore } from './presence';
import { t } from './i18n';
import { toast } from 'sonner';

const QUOTE_MAX = 200;
const BODY_MAX = 2000;
export const COMMENT_BODY_MAX = BODY_MAX;

/** @উল্লেখ অটোকমপ্লিটের জন্য প্রার্থী (আমি + উপস্থিত সহযোগী) */
export interface MentionCandidate {
  id: string;
  name: string;
  color: string;
}

function clampText(s: string, max: number): string {
  return s.length > max ? s.slice(0, max) : s;
}

/** বর্তমান ব্যবহারকারীর পরিচয় (প্রেজেন্স স্টোর থেকে; অনুপস্থিত হলে ফলব্যাক) */
function selfIdentity(): { id: string; name: string; color: string } {
  try {
    const raw = localStorage.getItem('bps.presence.identity.v1');
    if (raw) {
      const p = JSON.parse(raw) as { id?: string; name?: string; color?: string };
      if (p.id && p.name) {
        return {
          id: p.id,
          name: p.name,
          color: typeof p.color === 'string' ? p.color : PRESENCE_COLORS[0],
        };
      }
    }
  } catch { /* localStorage অচল — ফলব্যাকে চলুক */ }
  return { id: 'anon', name: t('cm.fallbackAuthor', 'অতিথি'), color: PRESENCE_COLORS[0] };
}

interface CommentsState {
  threads: CommentThread[];
  activeCommentId: string | null;
  /** কম্পোজার খোলা আছে কি না (অ্যাঙ্কর সেট হয়ে গেছে, লেখা এখনো সেভ হয়নি) */
  composer: { pageId: string; anchorId: string; quote: string } | null;
  replyTo: string | null;
  docId: string | null;

  /** প্রকল্প বদলালে/লোডে ডকুমেন্টের থ্রেড আনা (+অ্যাঙ্কর-ছাড়া থ্রেড পরিষ্কার) */
  syncDoc: () => Promise<void>;
  /** কম্পোজার জমা — থ্রেড পার্মানেন্ট */
  submitComposer: (body: string) => Promise<void>;
  /** কম্পোজার বাতিল — কলার অ্যাঙ্কর-মার্কও সরায় (comment-anchor.ts) */
  cancelComposer: () => void;
  setActive: (id: string | null) => void;
  openReply: (threadId: string | null) => void;
  addReply: (threadId: string, body: string) => Promise<void>;
  toggleResolved: (threadId: string) => Promise<void>;
  removeThread: (threadId: string) => Promise<void>;
  /** অ্যাঙ্কর-হারানো থ্রেড পরিষ্কার — সব পাতার HTML-এ data-comment-id স্ক্যান */
  cleanupOrphans: () => Promise<void>;
}

async function putSafe(thread: CommentThread): Promise<void> {
  try { await db.comments.put(thread); } catch { /* ইন-মেমরি মোড */ }
}

export const useCommentsStore = create<CommentsState>((set, get) => ({
  threads: [],
  activeCommentId: null,
  composer: null,
  replyTo: null,
  docId: null,

  syncDoc: async () => {
    const docId = useEditorStore.getState().projectId;
    if (!docId || get().docId === docId) return;
    set({ docId });
    let rows: CommentThread[] = [];
    try {
      rows = await db.comments.where('docId').equals(docId).toArray();
    } catch { /* ইন-মেমরি মোড */ }
    rows.sort((a, b) => a.body.createdAt - b.body.createdAt);
    set({ threads: rows, activeCommentId: null, composer: null, replyTo: null });
    // লোডের পরে অ্যাঙ্কর-স্ক্যান (পাতা HTML তখনই স্টোরে)
    void get().cleanupOrphans();
  },

  submitComposer: async (body) => {
    const c = get().composer;
    const docId = useEditorStore.getState().projectId;
    if (!c || !docId) return;
    const me = selfIdentity();
    const msg: CommentMessage = {
      id: newId('msg'),
      authorId: me.id,
      authorName: me.name,
      authorColor: me.color,
      body: clampText(body.trim(), BODY_MAX),
      createdAt: Date.now(),
    };
    if (!msg.body) { get().cancelComposer(); return; }
    const thread: CommentThread = {
      id: c.anchorId,
      docId,
      pageId: c.pageId,
      quote: clampText(c.quote, QUOTE_MAX),
      body: msg,
      replies: [],
      resolved: false,
      resolvedAt: null,
    };
    await putSafe(thread);
    set((s) => ({
      threads: [...s.threads, thread],
      composer: null,
      activeCommentId: thread.id,
    }));
  },

  cancelComposer: () => set({ composer: null }),

  setActive: (id) => set({ activeCommentId: id }),

  openReply: (threadId) => set({ replyTo: threadId }),

  addReply: async (threadId, body) => {
    const text = clampText(body.trim(), BODY_MAX);
    if (!text) return;
    const me = selfIdentity();
    const msg: CommentMessage = {
      id: newId('msg'),
      authorId: me.id,
      authorName: me.name,
      authorColor: me.color,
      body: text,
      createdAt: Date.now(),
    };
    const thread = get().threads.find((t) => t.id === threadId);
    if (!thread) return;
    const next = { ...thread, replies: [...thread.replies, msg] };
    await putSafe(next);
    set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? next : t)), replyTo: null }));
  },

  toggleResolved: async (threadId) => {
    const thread = get().threads.find((t) => t.id === threadId);
    if (!thread) return;
    const next: CommentThread = {
      ...thread,
      resolved: !thread.resolved,
      resolvedAt: thread.resolved ? null : Date.now(),
    };
    await putSafe(next);
    set((s) => ({ threads: s.threads.map((t) => (t.id === threadId ? next : t)) }));
  },

  removeThread: async (threadId) => {
    try { await db.comments.delete(threadId); } catch { /* ইন-মেমরি মোড */ }
    set((s) => ({
      threads: s.threads.filter((t) => t.id !== threadId),
      activeCommentId: s.activeCommentId === threadId ? null : s.activeCommentId,
      replyTo: s.replyTo === threadId ? null : s.replyTo,
    }));
  },

  cleanupOrphans: async () => {
    const docId = get().docId;
    if (!docId) return;
    const pages = useEditorStore.getState().pages;
    const haystack = pages.map((p) => p.html ?? '').join('\n');
    const dead = get().threads.filter((t) => !haystack.includes(`data-comment-id="${t.id}"`));
    if (!dead.length) return;
    try { await db.comments.bulkDelete(dead.map((t) => t.id)); } catch { /* ইন-মেমরি */ }
    set((s) => ({
      threads: s.threads.filter((t) => !dead.some((d) => d.id === t.id)),
      activeCommentId: dead.some((d) => d.id === s.activeCommentId) ? null : s.activeCommentId,
    }));
  },
}));

// ─── প্রকল্প-সুইচ সাবস্ক্রিপশন — মডিউল-লোডে একবারই (ক্লায়েন্ট-সাইড) ───
if (typeof window !== 'undefined') {
  useEditorStore.subscribe((state, prev) => {
    if (state.projectId !== prev.projectId) void useCommentsStore.getState().syncDoc();
  });
}

/** রিভিউ-ট্যাব "নতুন মন্তব্য" ও কম্পোজার-অটোকমপ্লিটের নাম-তালিকা (আমি + peers) */
export function mentionCandidates(): MentionCandidate[] {
  const me = selfIdentity();
  const list: MentionCandidate[] = [{ id: me.id, name: me.name, color: me.color }];
  try {
    // প্রেজেন্স স্টোর (দিন ৬৩) — সার্ভিস বন্ধ থাকলে peers খালি, শুধু আমি
    const { peers } = usePresenceStore.getState();
    for (const p of peers) {
      if (p?.id && p?.name && !list.some((x) => x.id === p.id)) {
        list.push({ id: p.id, name: p.name, color: p.color || PRESENCE_COLORS[1] });
      }
    }
  } catch { /* উপেক্ষা */ }
  return list;
}

/**
 * সব লাইভ এডিটর থেকে নির্দিষ্ট মন্তব্যের অ্যাঙ্কর-মার্ক সরানো (থ্রেড-মোছা/বাতিল)।
 * অ্যাঙ্কর id স্বতন্ত্র — যে পাতার এডিটরে আছে সেখানেই মরে; static পাতার মার্ক
 * HTML-এ থাকলে সেটা লোড-সময়ের cleanupOrphans পরিষ্কার করে।
 */
export function removeAnchorEverywhere(commentId: string): void {
  void (async () => {
    const [{ getEditor }, { removeCommentAnchor }] = await Promise.all([
      import('./editor-registry'),
      import('./comment-anchor'),
    ]);
    for (const p of useEditorStore.getState().pages) {
      const ed = getEditor(p.id);
      if (ed && !ed.isDestroyed) removeCommentAnchor(ed, commentId);
    }
  })();
}

/** কম্পোজার বাতিল — অ্যাঙ্কর-মার্কও পাতা থেকে সরে (ভূত-অ্যাঙ্কর থাকে না) */
export function abortCommentComposer(): void {
  const c = useCommentsStore.getState().composer;
  if (c) removeAnchorEverywhere(c.anchorId);
  useCommentsStore.setState({ composer: null });
}

/**
 * রিভিউ-ট্যাব "নতুন মন্তব্য" (Ctrl+Alt+M) — সক্রিয় পাতার সিলেকশনে অ্যাঙ্কর বসিয়ে
 * মার্জিন-কম্পোজার খোলে। সিলেকশন/এডিটর না থাকলে টোস্ট-নির্দেশ, false রিটার্ন।
 */
export function startCommentFromSelection(): boolean {
  const st = useEditorStore.getState();
  const pageId = st.activePageId;
  if (!pageId) {
    toast.info(t('cm.noPage', 'মন্তব্যের জন্য একটি পাতায় কার্সর রাখুন'));
    return false;
  }
  void (async () => {
    const { getEditor } = await import('./editor-registry');
    const { setCommentAnchor } = await import('./comment-anchor');
    const ed = getEditor(pageId);
    if (!ed || ed.isDestroyed) {
      toast.info(t('cm.noPage', 'মন্তব্যের জন্য একটি পাতায় কার্সর রাখুন'));
      return;
    }
    const { from, to, empty } = ed.state.selection;
    if (empty) {
      toast.info(t('cm.noSelection', 'মন্তব্যের জন্য আগে কিছু লেখা নির্বাচন করুন'));
      return;
    }
    const quote = ed.state.doc.textBetween(from, to, ' ').trim().slice(0, QUOTE_MAX);
    if (!quote) {
      toast.info(t('cm.noSelection', 'মন্তব্যের জন্য আগে কিছু লেখা নির্বাচন করুন'));
      return;
    }
    const anchorId = newId('cm');
    if (!setCommentAnchor(ed, anchorId)) return;
    useCommentsStore.setState({ composer: { pageId, anchorId, quote } });
  })();
  return true;
}
