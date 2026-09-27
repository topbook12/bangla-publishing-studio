/**
 * স্বয়ংক্রিয় সূচিপত্র (Table of Contents) স্ক্যান ও আপডেট
 */

import type { Editor } from '@tiptap/react';
import { displayPageNumber } from './pagenum';
import { buildTocHtml } from './nodes-html';
import type { DocumentSettings, PageData, TocEntry } from './types';

/** সব পৃষ্ঠার HTML থেকে h1-h3 শিরোনাম সংগ্রহ করে TOC এন্ট্রি বানায় */
export function scanTocEntries(pages: PageData[], settings: DocumentSettings): TocEntry[] {
  const entries: TocEntry[] = [];
  const parser = new DOMParser();
  pages.forEach((page, index) => {
    if (page.kind === 'cover' || !page.html) return;
    const doc = parser.parseFromString(`<div>${page.html}</div>`, 'text/html');
    const headings = doc.querySelectorAll('h1, h2, h3');
    headings.forEach((h) => {
      const text = (h.textContent ?? '').trim();
      if (!text) return;
      const level = Number(h.tagName.substring(1));
      entries.push({
        text,
        level,
        pageNumber: displayPageNumber(index, settings.pageNumber) || `${settings.pageNumber.startAt + index}`,
      });
    });
  });
  return entries;
}

/** সব মাউন্ট করা এডিটরের ভেতরের tocBlock নোডের attrs আপডেট করে */
export function updateTocNodes(editors: Editor[], entries: TocEntry[], title: string): void {
  for (const editor of editors) {
    // ফ্লো/ফিল অপে এডিটর অ্যাসিনক্রোনাসভাবে ধ্বংস হতে পারে — ডিসপ্যাচের আগে গার্ড
    // (নইলে view.dispatch থ্রো করে বাকি পাতার TOC আপডেটই বন্ধ হয়ে যেত)
    if (editor.isDestroyed) continue;
    const { state, view } = editor;
    if (!state.doc.descendants) continue;
    const tr = state.tr;
    let found = false;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'tocBlock') {
        tr.setNodeMarkup(pos, undefined, { entries, title });
        found = true;
      }
      return true;
    });
    if (found) {
      // ইঞ্জিন-আপডেট — আন্ডু-হিস্টরিতে নয় (নইলে একটি Ctrl+Z পুরনো পৃষ্ঠা-নম্বরে ফিরিয়ে দিত)
      tr.setMeta('addToHistory', false);
      view.dispatch(tr);
    }
  }
}

/** TOC ব্লক HTML বানায় (ইনসার্টের জন্য) */
export function tocInsertHtml(entries: TocEntry[], title = 'সূচিপত্র'): string {
  return buildTocHtml(JSON.stringify(entries), title);
}
