/**
 * পৃষ্ঠা অপারেশন ইঞ্জিন — কনটেন্ট স্প্লিট (Ctrl+Enter), অটো-ফ্লো ও পেজ মার্জ।
 * ProseMirror Node.cut দিয়ে নিরাপদে ডকুমেন্ট দুই ভাগে ভাগ করা হয়।
 */

'use client';

import { DOMSerializer } from '@tiptap/pm/model';
import type { Editor } from '@tiptap/react';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';

/** PM Node → HTML (কনটেন্ট ফ্র্যাগমেন্ট) */
export function nodeContentToHtml(doc: import('@tiptap/pm/model').Node, schema: import('@tiptap/pm/model').Schema): string {
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(doc.content);
  const div = document.createElement('div');
  div.appendChild(fragment);
  return div.innerHTML;
}

/** কার্সরের অবস্থানে পৃষ্ঠা ভাগ করা (Ctrl+Enter / Insert > পেজ ব্রেক) */
export function pageBreakOnEditor(editor: Editor, pageId: string): void {
  const { doc, selection } = editor.state;
  const head = selection.empty ? selection.from : selection.to;

  // কার্সর ডকুমেন্টের একদম শেষে → সরাসরি নতুন ফাঁকা পৃষ্ঠা
  if (head >= doc.content.size) {
    const newId = useEditorStore.getState().addPage(pageId);
    useEditorStore.getState().setActivePage(newId);
    window.setTimeout(() => {
      const nextEditor = getEditor(newId);
      nextEditor?.commands.focus('start');
    }, 60);
    return;
  }

  const keptDoc = doc.cut(0, head);
  const overflowDoc = doc.cut(head, doc.content.size);
  const keptHtml = nodeContentToHtml(keptDoc, editor.schema);
  const overflowHtml = nodeContentToHtml(overflowDoc, editor.schema);

  useEditorStore.getState().splitPageAt(pageId, keptHtml, overflowHtml);
  useEditorStore.getState().setActivePage(pageId);

  // বর্তমান এডিটরে কাটা অংশ বসান ও কার্সর শেষে নিন
  editor.commands.setContent(keptHtml || '<p></p>', false);
  window.setTimeout(() => {
    editor.commands.focus('end');
  }, 30);
}

/** অটো-ফ্লো: পৃষ্ঠা উপচে পড়লে শেষ ব্লকগুলো পরের পৃষ্ঠায় সরানো */
export function flowIfOverflow(editor: Editor, pageId: string, availableHeight: number): boolean {
  if (editor.isDestroyed) return false;
  const s = useEditorStore.getState();
  if (!s.settings.autoFlow) return false;
  if (editor.view.composing) return false;

  const pmEl = editor.view.dom as HTMLElement;
  if (!pmEl) return false;
  const used = pmEl.scrollHeight;
  if (used <= availableHeight + 4) return false;

  const children = Array.from(pmEl.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
  // নোডভিউ র‍্যাপার ইত্যাদি বাদ দিয়ে আসল ব্লকগুলো
  if (children.length <= 1) return false;

  const pmTop = pmEl.getBoundingClientRect().top;
  let fitCount = 0;
  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const bottom = rect.bottom - pmTop;
    if (bottom <= availableHeight - 4) fitCount = i + 1;
    else break;
  }
  if (fitCount < 1 || fitCount >= children.length) return false;

  // doc-এ fitCount-তম নোডের শুরু অবস্থান
  const doc = editor.state.doc;
  let pos = 0;
  let counted = 0;
  let guard = 0;
  doc.forEach((child) => {
    if (counted < fitCount) {
      pos += child.nodeSize;
      counted += 1;
    }
    guard += 1;
  });
  void guard;

  const selection = editor.state.selection;
  const cursorMoved = selection.from >= pos;

  const keptDoc = doc.cut(0, pos);
  const overflowDoc = doc.cut(pos, doc.content.size);
  const keptHtml = nodeContentToHtml(keptDoc, editor.schema) || '<p></p>';
  const overflowHtml = nodeContentToHtml(overflowDoc, editor.schema) || '<p></p>';

  s.flowOverflow(pageId, keptHtml, overflowHtml);

  // নিজের এডিটরে রাখা অংশ সেট করা
  editor.commands.setContent(keptHtml, false);

  if (cursorMoved) {
    // কার্সর সরে যাওয়া অংশে ছিল → পরের পৃষ্ঠার এডিটরে স্থানান্তর
    const pages = useEditorStore.getState().pages;
    const idx = pages.findIndex((p) => p.id === pageId);
    const nextPageId = idx >= 0 && idx + 1 < pages.length ? pages[idx + 1].id : null;
    if (nextPageId) {
      useEditorStore.getState().setActivePage(nextPageId);
      window.setTimeout(() => {
        const nextEditor = getEditor(nextPageId);
        if (nextEditor && !nextEditor.isDestroyed) {
          const target = Math.max(0, Math.min(selection.from - pos, nextEditor.state.doc.content.size - 1));
          nextEditor.commands.setTextSelection(Math.max(1, target));
          nextEditor.commands.focus();
        }
      }, 80);
    }
  } else {
    window.setTimeout(() => {
      const target = Math.max(1, Math.min(selection.from, editor.state.doc.content.size - 1));
      editor.commands.setTextSelection(target);
    }, 30);
  }
  return true;
}

/** Backspace-এ ডকুমেন্টের শুরুতে: বর্তমান পৃষ্ঠা আগের পৃষ্ঠার সাথে মিশে যাবে */
export function mergeWithPreviousPage(editor: Editor, pageId: string): void {
  const s = useEditorStore.getState();
  const idx = s.pages.findIndex((p) => p.id === pageId);
  if (idx <= 0) return;
  const prev = s.pages[idx - 1];
  if (prev.kind === 'cover') return;
  const currentHtml = editor.getHTML();
  const mergedHtml = `${prev.html}${currentHtml}`;
  s.updatePageHtml(prev.id, mergedHtml);
  s.deletePage(pageId);
  s.setActivePage(prev.id);
  window.setTimeout(() => {
    const prevEditor = getEditor(prev.id);
    if (prevEditor && !prevEditor.isDestroyed) {
      prevEditor.commands.focus('end');
    }
  }, 80);
}

// ═══════════════════ ফাঁকা জায়গা পূরণ ইঞ্জিন (Content Flow Up) ═══════════════════

/** ফিল অপারেশনের ফলাফল */
export type FillResult = {
  status: 'moved' | 'absorbed' | 'none' | 'blocked';
  /** কতটি ব্লক (প্যারাগ্রাফ/ছবি/টেবিল) উপরে উঠল */
  blocks: number;
};

/** পাতার HTML একদম ফাঁকা কি না (শুধু খালি প্যারাগ্রাফ) */
export function htmlIsEmpty(html: string): boolean {
  if (!html) return true;
  const div = document.createElement('div');
  div.innerHTML = html;
  if ((div.textContent ?? '').trim()) return false;
  return !div.querySelector('img, table, hr, .doc-textbox, .callout-box, .mcq-block, .toc-block, svg, .doc-icon');
}

/** কোনো পাতার এডিটরের লভ্য উচ্চতা (page-editor-inner) — DOM থেকে */
export function availableHeightOfEditor(pageId: string): number {
  const s = useEditorStore.getState();
  const idx = s.pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return 0;
  const el = document.querySelector<HTMLElement>(`[data-page-index="${idx}"] .page-editor-inner`);
  return el?.clientHeight ?? 0;
}

/** কার্সর নিরাপদে আগের কাছাকাছি জায়গায় ফেরানো */
function restoreCursor(editor: Editor, from: number): void {
  try {
    const size = editor.state.doc.content.size;
    editor.commands.setTextSelection(Math.max(1, Math.min(from, size - 1)));
  } catch { /* উপেক্ষা */ }
}

/** ছবিগুলো লোড হওয়া পর্যন্ত সংক্ষিপ্ত অপেক্ষা — না হলে উচ্চতা ভুল মাপা হয় */
async function waitForImages(editor: Editor, timeoutMs = 250): Promise<void> {
  const pmEl = editor.view.dom as HTMLElement | null;
  if (!pmEl) return;
  const pending = Array.from(pmEl.querySelectorAll('img')).filter((img) => !img.complete);
  if (pending.length === 0) return;
  await Promise.race([
    Promise.all(pending.map((img) => new Promise<void>((res) => {
      img.addEventListener('load', () => res(), { once: true });
      img.addEventListener('error', () => res(), { once: true });
    }))),
    new Promise<void>((res) => window.setTimeout(res, timeoutMs)),
  ]);
}

/**
 * ★ নিচের পাতার কনটেন্ট (লেখা/ছবি/টেবিল/চার্ট — যা-ই হোক) এই পাতার ফাঁকা জায়গায় তোলা।
 *
 * পদ্ধতি: পরের পাতার সব ব্লক সাময়িকভাবে মার্জ করা হয় → এডিটর DOM-এ মেপে দেখা হয়
 * কতগুলো ব্লক ফাঁকা উচ্চতায় আঁটে → যতটা আঁটে ততটা এই পাতায় থাকে, বাকিটা পরের
 * পাতায় ফেরত যায়। পুরো পাতা উঠে এলে পরের পাতাটি মুছে যায়।
 */
export async function fillFromNextPage(editor: Editor, pageId: string, availableHeight: number): Promise<FillResult> {
  if (editor.isDestroyed || availableHeight <= 0) return { status: 'blocked', blocks: 0 };

  const s = useEditorStore.getState();
  const idx = s.pages.findIndex((p) => p.id === pageId);
  if (idx < 0 || idx >= s.pages.length - 1) return { status: 'blocked', blocks: 0 };

  const next = s.pages[idx + 1];
  if (next.kind !== 'normal') return { status: 'blocked', blocks: 0 };
  if (htmlIsEmpty(next.html)) return { status: 'none', blocks: 0 };
  if (editor.view.composing) return { status: 'blocked', blocks: 0 };

  const currentHtml = editor.getHTML();
  const cursorBefore = editor.state.selection.from;
  const originalCount = editor.state.doc.childCount;

  // ১) পরের পাতার কনটেন্ট সাময়িকভাবে মার্জ
  editor.commands.setContent(currentHtml + next.html, false);
  await waitForImages(editor);
  if (editor.isDestroyed) return { status: 'blocked', blocks: 0 };

  // ২) কোন ব্লকগুলো ফাঁকা জায়গায় আঁটে মাপা
  const pmEl = editor.view.dom as HTMLElement;
  const children = Array.from(pmEl.children).filter((c): c is HTMLElement => c instanceof HTMLElement);
  const pmTop = pmEl.getBoundingClientRect().top;
  let fitCount = 0;
  for (let i = 0; i < children.length; i++) {
    const bottom = children[i].getBoundingClientRect().bottom - pmTop;
    if (bottom <= availableHeight - 4) fitCount = i + 1;
    else break;
  }

  // ৩) পুরো পরের পাতাই উঠে এসেছে → পরের পাতা মুছে দেওয়া
  if (fitCount >= children.length && children.length > originalCount) {
    s.replacePageHtml(pageId, currentHtml + next.html);
    s.deletePage(next.id);
    restoreCursor(editor, cursorBefore);
    return { status: 'absorbed', blocks: children.length - originalCount };
  }

  // ৪) একটিও ব্লক উঠতে পারেনি → আগের অবস্থায় ফেরত
  if (fitCount <= originalCount) {
    editor.commands.setContent(currentHtml, false);
    restoreCursor(editor, cursorBefore);
    return { status: 'none', blocks: 0 };
  }

  // ৫) আঁটা অংশ এই পাতায়, বাকিটা পরের পাতায় ফেরত
  const doc = editor.state.doc;
  let pos = 0;
  let counted = 0;
  doc.forEach((child) => {
    if (counted < fitCount) {
      pos += child.nodeSize;
      counted += 1;
    }
  });
  const keptHtml = nodeContentToHtml(doc.cut(0, pos), editor.schema) || '<p></p>';
  const overflowHtml = nodeContentToHtml(doc.cut(pos, doc.content.size), editor.schema) || '<p></p>';

  s.replacePageHtml(pageId, keptHtml);
  s.updatePageHtml(next.id, overflowHtml);
  editor.commands.setContent(keptHtml, false);
  restoreCursor(editor, cursorBefore);
  return { status: 'moved', blocks: fitCount - originalCount };
}

// ───────────────── স্মার্ট ফ্লো — পুরো বইয়ের ফাঁকা জায়গা এক ক্লিকে পূরণ ─────────────────

export interface SmartFlowStats {
  /** যতগুলো পাতায় নিচ থেকে কনটেন্ট তোলা হলো */
  pagesFilled: number;
  /** মোট যতটি ব্লক উপরে উঠল */
  blocksMoved: number;
  /** পুরোপুরি শেষ হয়ে যাওয়ায় যতগুলো পাতা মুছে গেল */
  pagesDeleted: number;
}

/** অদৃশ্য পাতার এডিটর মাউন্ট করতে পাতাটি ভিউপোর্টে এনে অপেক্ষা */
async function ensurePageEditorMounted(pageId: string): Promise<boolean> {
  const idx = useEditorStore.getState().pages.findIndex((p) => p.id === pageId);
  if (idx < 0) return false;
  const el = document.querySelector(`[data-page-index="${idx}"]`);
  el?.scrollIntoView({ block: 'center' });
  for (let i = 0; i < 22; i++) {
    await new Promise((r) => window.setTimeout(r, 90));
    if (getEditor(pageId)) return true;
    if (!useEditorStore.getState().pages.some((p) => p.id === pageId)) return false;
  }
  return Boolean(getEditor(pageId));
}

/**
 * ★ স্মার্ট ফ্লো: শুরু থেকে শেষ পাতা পর্যন্ত স্ক্যান করে প্রতিটি পাতার ফাঁকা জায়গায়
 * পরের পাতার কনটেন্ট টেনে তোলা হয় — ফলে মাঝখানে আর অর্ধেক-ফাঁকা পাতা থাকে না।
 * কভার পাতা ও বিশেষ পাতা (cover) এড়িয়ে যাওয়া হয়।
 */
export async function smartFlowWholeBook(): Promise<SmartFlowStats> {
  const stats: SmartFlowStats = { pagesFilled: 0, blocksMoved: 0, pagesDeleted: 0 };
  const visited = new Set<string>();
  const wasActive = useEditorStore.getState().activePageId;

  for (let guard = 0; guard < 1000; guard++) {
    const s = useEditorStore.getState();
    // এমন প্রথম normal পাতা যেটাতে এখনো টানা হয়নি এবং পরের পাতায় লেখা আছে
    const targetIdx = s.pages.findIndex((p, i) => {
      if (p.kind !== 'normal' || visited.has(p.id)) return false;
      const nx = s.pages[i + 1];
      return Boolean(nx && nx.kind === 'normal' && !htmlIsEmpty(nx.html));
    });
    if (targetIdx < 0) break;

    const target = s.pages[targetIdx];
    visited.add(target.id);

    let editor = getEditor(target.id);
    if (!editor || editor.isDestroyed) {
      const mounted = await ensurePageEditorMounted(target.id);
      if (!mounted) continue;
      editor = getEditor(target.id);
      if (!editor || editor.isDestroyed) continue;
    }

    const available = availableHeightOfEditor(target.id);
    if (available <= 0) continue;

    let movedAny = false;

    // এই পাতায় বারবার টানা হবে — পরের পাতা খালি/মুছে গেলে তার পরেরটি থেকে টানা হয়
    for (let inner = 0; inner < 50; inner++) {
      const s2 = useEditorStore.getState();
      const i2 = s2.pages.findIndex((p) => p.id === target.id);
      if (i2 < 0) break;
      const nx2 = s2.pages[i2 + 1];
      if (!nx2 || nx2.kind !== 'normal' || htmlIsEmpty(nx2.html)) break;
      const ed = getEditor(target.id);
      if (!ed || ed.isDestroyed) break;

      const res = await fillFromNextPage(ed, target.id, available);
      if (res.status === 'moved' || res.status === 'absorbed') {
        movedAny = true;
        stats.blocksMoved += res.blocks;
        if (res.status === 'absorbed') stats.pagesDeleted += 1;
      } else {
        break;
      }
    }

    if (movedAny) stats.pagesFilled += 1;
  }

  // যে পাতায় কাজ শুরু করেছিল সেখানেই ফেরা (দৃশ্যমান হলে)
  if (wasActive && useEditorStore.getState().pages.some((p) => p.id === wasActive)) {
    useEditorStore.getState().setActivePage(wasActive);
    document.querySelector(`[data-page-index="${useEditorStore.getState().pages.findIndex((p) => p.id === wasActive)}"]`)
      ?.scrollIntoView({ block: 'start' });
  }
  return stats;
}

// ───────────────── ফাঁকা পাতা পরিষ্কার ─────────────────

/**
 * শুধু খালি প্যারাগ্রাফওয়ালা পাতাগুলো মুছে দেয় (অন্তত ১টি পাতা রাখা হয়)।
 * রিটার্ন: কতগুলো পাতা মুছে গেল।
 */
export function removeEmptyPages(): number {
  const s = useEditorStore.getState();
  const emptyIds = s.pages.filter((p) => p.kind === 'normal' && htmlIsEmpty(p.html)).map((p) => p.id);
  const maxRemovable = Math.max(0, s.pages.length - 1);
  const removable = emptyIds.slice(0, maxRemovable);
  for (const id of removable) {
    useEditorStore.getState().deletePage(id);
  }
  return removable.length;
}
