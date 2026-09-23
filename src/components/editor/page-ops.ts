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

/** Delete-এ ডকুমেন্টের শেষে: পরের পৃষ্ঠার কনটেন্ট টেনে আনা */
export function pullFromNextPage(editor: Editor, pageId: string): void {
  const s = useEditorStore.getState();
  const idx = s.pages.findIndex((p) => p.id === pageId);
  if (idx < 0 || idx >= s.pages.length - 1) return;
  const next = s.pages[idx + 1];
  if (next.kind === 'cover' || !next.html) return;
  const mergedHtml = `${editor.getHTML()}${next.html}`;
  s.updatePageHtml(pageId, mergedHtml);
  s.deletePage(next.id);
}
