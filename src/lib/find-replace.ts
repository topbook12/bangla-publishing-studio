/**
 * সম্পূর্ণ বই-ব্যাপী খোঁজ ও প্রতিস্থাপন (Find & Replace) ইঞ্জিন।
 *
 * ডেটার দুই উৎস:
 *  ১) মাউন্ট করা পাতা → ProseMirror doc থেকে টেক্সট + পজিশন ম্যাপ
 *     (replace = insertContentAt — মার্ক/অলংকার সংরক্ষিত)
 *  ২) মাউন্ট করা নেই এমন পাতা → স্টোর HTML (DOMParser + টেক্সট-নোড ওয়াক);
 *     replace = নতুন পার্সে N-তম মিল প্রতিস্থাপন (occurrence ইনডেক্স দিয়ে)
 *
 * মিল ব্লক-বাউন্ডারি পার হয় না ('\n' separator), কিন্তু একই ব্লকে
 * বোল্ড/ইটালিক ভাগ করা একাধিক টেক্সট-নোড জুড়ে মিলতে পারে।
 */

import type { Node as PMNode } from '@tiptap/pm/model';
import { useEditorStore } from './store';
import { getEditor } from './editor-registry';

export interface FindMatch {
  pageId: string;
  pageIndex: number;
  /** ProseMirror পজিশন (মাউন্ট করা পাতায়) */
  from?: number;
  to?: number;
  /** মাউন্ট করা না থাকলে — পাতার ভেতরে কত-তম মিল (0-based) */
  occurrence?: number;
  /** প্রদর্শনীর জন্য প্রসঙ্গ-স্নিপেট */
  snippet: string;
}

interface TextSeg {
  /** কনক্যাটেনেটেড স্ট্রিং-এ শুরু/শেষ ইনডেক্স */
  start: number;
  end: number;
  /** PM পাত */
  pmNode?: PMNode;
  pmPos?: number;
  /** DOM পাত */
  domNode?: Text;
}

const BLOCK_TAGS = 'p,h1,h2,h3,h4,li,td,th,blockquote,pre';
const SKIP_SELECTOR = '.doc-shape-orn,.doc-icon-tools,.doc-textbox-tools,.doc-shape-tools,.no-print,.callout-head,.mcq-head,.toc-head';

/** DOM-এর টেক্সট সেগ সংগ্রহ (টুলবার/অলংকার জোন বাদ) */
function segmentsFromDom(root: Element): { text: string; segs: TextSeg[] } {
  let text = '';
  const segs: TextSeg[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      const parent = (n as Text).parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(SKIP_SELECTOR)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let lastBlockEl: Element | null = null;
  let cur = walker.nextNode() as Text | null;
  while (cur) {
    const t = cur;
    const blockEl = t.parentElement?.closest(BLOCK_TAGS) ?? null;
    if (blockEl && blockEl !== lastBlockEl) {
      if (text.length && !text.endsWith('\n')) text += '\n';
      lastBlockEl = blockEl;
    }
    const raw = t.data;
    if (raw.length) {
      segs.push({ start: text.length, end: text.length + raw.length, domNode: t });
      text += raw;
    }
    cur = walker.nextNode() as Text | null;
  }
  return { text, segs };
}

/** ProseMirror doc → টেক্সট + সেগ ম্যাপ */
function segmentsFromDoc(doc: PMNode): { text: string; segs: TextSeg[] } {
  let text = '';
  const segs: TextSeg[] = [];
  doc.descendants((node, pos) => {
    if (node.isTextblock) {
      if (text.length && !text.endsWith('\n')) text += '\n';
      return true;
    }
    if (node.isText && node.text) {
      segs.push({ start: text.length, end: text.length + node.text.length, pmNode: node, pmPos: pos });
      text += node.text;
    }
    return true;
  });
  return { text, segs };
}

function findRanges(text: string, query: string, matchCase: boolean): Array<{ start: number; end: number }> {
  const out: Array<{ start: number; end: number }> = [];
  const needle = matchCase ? query : query.toLowerCase();
  if (!needle) return out;
  const hay = matchCase ? text : text.toLowerCase();
  let i = hay.indexOf(needle);
  while (i >= 0) {
    out.push({ start: i, end: i + needle.length });
    i = hay.indexOf(needle, i + needle.length);
  }
  return out;
}

function snippetOf(text: string, start: number, end: number): string {
  const ctx = 22;
  const a = Math.max(0, start - ctx);
  const b = Math.min(text.length, end + ctx);
  return `${a > 0 ? '…' : ''}${text.slice(a, start)}【${text.slice(start, end)}】${text.slice(end, b)}${b < text.length ? '…' : ''}`;
}

/** কনক্যাটেনেটেড অবস্থান → ProseMirror পজিশন */
function pmPosAt(segs: TextSeg[], offset: number, isEnd: boolean): number | null {
  const seg =
    segs.find((s) => offset > s.start && offset < s.end) ??
    segs.find((s) => (isEnd ? offset === s.end : offset === s.start));
  if (!seg || !seg.pmNode || seg.pmPos === undefined) return null;
  return seg.pmPos + (offset - seg.start);
}

/** সম্পূর্ণ বইয়ে সব মিল খুঁজুন (পাতার ক্রমে) */
export function findAllMatches(query: string, matchCase: boolean): FindMatch[] {
  const q = query.trim();
  if (!q) return [];
  const { pages } = useEditorStore.getState();
  const out: FindMatch[] = [];

  pages.forEach((page, pageIndex) => {
    if (page.kind === 'cover') return;
    const editor = getEditor(page.id);
    if (editor && !editor.isDestroyed) {
      const { text, segs } = segmentsFromDoc(editor.state.doc);
      for (const m of findRanges(text, q, matchCase)) {
        const from = pmPosAt(segs, m.start, false);
        const to = pmPosAt(segs, m.end, true);
        if (from === null || to === null) continue;
        out.push({ pageId: page.id, pageIndex, from, to, snippet: snippetOf(text, m.start, m.end) });
      }
    } else {
      const dom = new DOMParser().parseFromString(page.html || '<p></p>', 'text/html');
      const { text } = segmentsFromDom(dom.body);
      findRanges(text, q, matchCase).forEach((m, occ) => {
        out.push({ pageId: page.id, pageIndex, occurrence: occ, snippet: snippetOf(text, m.start, m.end) });
      });
    }
  });
  return out;
}

// ─── প্রতিস্থাপন ───

/** একটি মিল প্রতিস্থাপন — সফল হলে true */
export function replaceMatch(m: FindMatch, query: string, replacement: string, matchCase: boolean): boolean {
  const editor = getEditor(m.pageId);
  if (editor && !editor.isDestroyed && m.from !== undefined && m.to !== undefined) {
    try {
      return editor.chain().insertContentAt({ from: m.from, to: m.to }, replacement).run();
    } catch {
      return false;
    }
  }
  if (m.occurrence !== undefined) {
    const { pages } = useEditorStore.getState();
    const page = pages.find((p) => p.id === m.pageId);
    if (!page) return false;
    const next = replaceNthInHtml(page.html || '<p></p>', query, m.occurrence, replacement, matchCase);
    if (next === null) return false;
    useEditorStore.getState().replacePageHtml(m.pageId, next);
    return true;
  }
  return false;
}

/**
 * HTML-এ n-তম মিল (0-based) প্রতিস্থাপন — নতুন HTML, মিল না পড়লে null।
 * ক্রস-নোড মিল: প্রথম নোডে head+replacement, মাঝেরগুলো খালি, শেষ নোডে tail।
 */
function replaceNthInHtml(html: string, query: string, n: number, replacement: string, matchCase: boolean): string | null {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const { text, segs } = segmentsFromDom(dom.body);
  const hits = findRanges(text, query, matchCase);
  if (n >= hits.length) return null;
  const m = hits[n];
  const first = segs.find((s) => m.start >= s.start && m.start < s.end);
  const last = segs.find((s) => m.end > s.start && m.end <= s.end) ?? first;
  if (!first?.domNode || !last?.domNode) return null;

  if (first.domNode === last.domNode) {
    const t = first.domNode;
    const ls = m.start - first.start;
    const le = m.end - first.start;
    t.data = t.data.slice(0, ls) + replacement + t.data.slice(le);
  } else {
    const ft = first.domNode;
    const lt = last.domNode;
    const head = ft.data.slice(0, m.start - first.start);
    const tail = lt.data.slice(m.end - last.start);
    ft.data = head + replacement;
    const walker = document.createTreeWalker(dom.body, NodeFilter.SHOW_TEXT);
    walker.currentNode = ft;
    const mid: Text[] = [];
    let nxt = walker.nextNode() as Text | null;
    while (nxt && nxt !== lt) {
      mid.push(nxt);
      nxt = walker.nextNode() as Text | null;
    }
    for (const t of mid) t.data = '';
    lt.data = tail;
  }
  return dom.body.innerHTML;
}

/** সব পাতায় replace-all — রিটার্ন: কতটি প্রতিস্থাপন হলো */
export function replaceAll(query: string, replacement: string, matchCase: boolean): number {
  const q = query.trim();
  if (!q) return 0;
  const matches = findAllMatches(q, matchCase);
  let count = 0;

  // পাতা অনুযায়ী গ্রুপ — এক পাতার রিপ্লেস অন্য পাতার অবস্থান নষ্ট করে না
  const byPage = new Map<string, FindMatch[]>();
  for (const m of matches) {
    const list = byPage.get(m.pageId) ?? [];
    list.push(m);
    byPage.set(m.pageId, list);
  }

  for (const [pageId, list] of byPage) {
    const editor = getEditor(pageId);
    if (editor && !editor.isDestroyed) {
      // শেষ মিল থেকে প্রথমের দিকে — পজিশন-শিফট এড়াতে
      const sorted = [...list].sort((a, b) => (b.to ?? 0) - (a.to ?? 0));
      for (const m of sorted) {
        if (m.from === undefined || m.to === undefined) continue;
        try {
          editor.chain().insertContentAt({ from: m.from, to: m.to }, replacement).run();
          count++;
        } catch { /* নীরব */ }
      }
    } else {
      const { pages } = useEditorStore.getState();
      const page = pages.find((p) => p.id === pageId);
      if (!page) continue;
      let html = page.html || '<p></p>';
      // প্রতিবার শেষ মিল থেকে প্রথমের দিকে — occurrence বড় থেকে ছোট
      let guard = 0;
      let changed = false;
      while (guard++ < 999) {
        const occ = countOccurrencesInHtml(html, q, matchCase);
        if (occ <= 0) break;
        const next = replaceNthInHtml(html, q, occ - 1, replacement, matchCase);
        if (next === null) break;
        html = next;
        changed = true;
        count++;
      }
      if (changed) useEditorStore.getState().replacePageHtml(pageId, html);
    }
  }
  return count;
}

function countOccurrencesInHtml(html: string, query: string, matchCase: boolean): number {
  const dom = new DOMParser().parseFromString(html, 'text/html');
  const { text } = segmentsFromDom(dom.body);
  return findRanges(text, query, matchCase).length;
}

// ─── নেভিগেশন ───

/** মিলটির পাতা ভিউপোর্টে আনা + (মাউন্ট থাকলে) সিলেক্ট */
export function revealMatch(m: FindMatch): void {
  const el = document.querySelector(`.paper-page[data-page-index="${m.pageIndex}"]`);
  el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const editor = getEditor(m.pageId);
  if (editor && !editor.isDestroyed && m.from !== undefined && m.to !== undefined) {
    try {
      editor.commands.setTextSelection({ from: m.from, to: m.to });
      window.setTimeout(() => {
        if (editor.isDestroyed) return;
        try {
          const domAt = editor.view.domAtPos(editor.view.state.selection.from);
          const target = domAt.node instanceof Element ? domAt.node : domAt.node.parentElement;
          target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } catch { /* উপেক্ষা */ }
      }, 80);
    } catch { /* উপেক্ষা */ }
  }
}

/** বর্তমান সিলেকশন থেকে ডিফল্ট কোয়েরি (সর্বোচ্চ ৮০ অক্ষর) */
export function selectionQueryOfActiveEditor(): string {
  const { activePageId } = useEditorStore.getState();
  const editor = getEditor(activePageId);
  if (!editor || editor.isDestroyed) return '';
  const { from, to, empty } = editor.state.selection;
  if (empty || to - from > 80) return '';
  try {
    return editor.state.doc.textBetween(from, to, '\n');
  } catch {
    return '';
  }
}
