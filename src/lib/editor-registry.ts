/**
 * পরিবেশে মাউন্ট করা সব পৃষ্ঠা-এডিটরের রেজিস্ট্রি।
 * রিবন কমান্ড ও অটো-ফ্লো ইঞ্জিন এর মাধ্যমে এডিটর খুঁজে নেয়।
 * (Zustand স্টোরে এডিটর অবজেক্ট রাখা হয় না — রি-রেন্ডার এড়াতে।)
 */

import type { Editor } from '@tiptap/react';

const editors = new Map<string, Editor>();

export function registerEditor(pageId: string, editor: Editor): void {
  editors.set(pageId, editor);
}

export function unregisterEditor(pageId: string): void {
  editors.delete(pageId);
}

export function getEditor(pageId: string | null | undefined): Editor | undefined {
  if (!pageId) return undefined;
  return editors.get(pageId);
}

export function getAllEditors(): Editor[] {
  return Array.from(editors.values());
}

/**
 * ব্লক-স্তরের HTML (প্যারাগ্রাফ/শিরোনাম/তালিকা) কার্সরে বসানো — Word-অনুরূপ আচরণ।
 *
 * কার্সর ডকুমেন্টের প্রথম ব্লকের একদম শুরুতে থাকলে (ইউজার কখনো ক্লিক করেননি —
 * ডিফল্ট সিলেকশন, বা ইচ্ছাকৃতভাবে শুরুতে) ব্লক-বিভাজন করা হয় না; HTML-টি
 * প্রথম ব্লকের *আগে* বসে। নইলে insertContent প্রথম H1-কে ভেঙে উপরে একটি
 * ফাঁকা H1 রেখে দেয় (প্রতিটি সন্নিবেশে একটি করে ফাঁকা শিরোনাম জমত)।
 */
export function insertBlocksAtCursor(ed: Editor, html: string): boolean {
  try {
    const { selection, doc } = ed.state;
    const $from = selection.$from;
    const atFirstBlockStart =
      selection.empty &&
      $from.pos === 1 &&
      $from.parentOffset === 0 &&
      // প্রথম ব্লক ফাঁকা হলেও একই আচরণ — আগে বসানোই নিরাপদ
      doc.firstChild;
    if (atFirstBlockStart) {
      ed.chain().focus().insertContentAt(0, html).run();
      return true;
    }
    ed.chain().focus().insertContent(html).run();
    return true;
  } catch {
    try {
      ed.chain().focus().insertContentAt(ed.state.doc.content.size, html).run();
      return true;
    } catch {
      return false;
    }
  }
}
