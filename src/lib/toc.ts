/**
 * স্বয়ংক্রিয় সূচিপত্র (Table of Contents) স্ক্যান ও আপডেট
 */

'use client';

import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { displayPageNumber } from './pagenum';
import { buildTocHtml } from './nodes-html';
import { getAllEditors, getEditor } from './editor-registry';
import { useEditorStore } from './store';
import type { DocumentSettings, PageData, TocEntry } from './types';

/** সব পৃষ্ঠার HTML থেকে h1-h3 শিরোনাম সংগ্রহ করে TOC এন্ট্রি বানায় */
export function scanTocEntries(pages: PageData[], settings: DocumentSettings): TocEntry[] {
  const entries: TocEntry[] = [];
  const parser = new DOMParser();
  pages.forEach((page, index) => {
    if (page.kind === 'cover' || !page.html) return;
    // সূচিপত্র-পাতা নিজে তালিকায় আসবে না (নইলে "সূচিপত্র" শিরোনামটাই সূচিতে ঢুকে যেত)
    if (page.html.includes('toc-block')) return;
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
        // ম্যানুয়াল সূচি — ব্যবহারকারীর লেখা এন্ট্রি স্বয়ংক্রিয় ইঞ্জিন কখনো বদলাবে না
        if (node.attrs.manual !== true) {
          tr.setNodeMarkup(pos, undefined, { entries, title });
          found = true;
        }
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

// ─────────────────────── অটো-রিফ্রেশ ইঞ্জিন (Task 10-d) ───────────────────────

/**
 * স্টোর করা HTML-এর ভেতরের tocBlock-এর data-entries আপডেট করে (ডম-পার্সারে)।
 * মাউন্ট না-থাকা (রিসাইকেলড) পাতার সূচিপত্র এভাবেই সিঙ্ক হয় — data-title অক্ষত থাকে।
 * toc-block না থাকলে HTML অপরিবর্তিত ফেরত যায় (কোনো নরমালাইজেশন-ঝুঁকিই নেই)।
 */
export function updateTocInHtml(html: string, entries: TocEntry[]): string {
  if (!html.includes('toc-block')) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const block = doc.querySelector('.toc-block');
  if (!block) return html;
  // ম্যানুয়াল সূচি — HTML-স্তরেও অক্ষত থাকে
  if (block.getAttribute('data-manual') === 'true') return html;
  block.setAttribute('data-entries', JSON.stringify(entries));
  return doc.body.innerHTML;
}

/** কোনো পাতার HTML-এ toc-block আছে কি না — দ্রুত স্ট্রিং-চেক (পার্সিং ছাড়া) */
export function hasTocBlock(pages: PageData[]): boolean {
  return pages.some((p) => p.html.includes('toc-block'));
}

/** প্রথম toc-block-বিশিষ্ট পাতার HTML থেকে data-title বের করা (না পেলে ডিফল্ট) */
function extractTocTitle(pages: PageData[]): string {
  const page = pages.find((p) => p.html.includes('toc-block'));
  if (!page) return 'সূচিপত্র';
  try {
    const doc = new DOMParser().parseFromString(page.html, 'text/html');
    return doc.querySelector('.toc-block')?.getAttribute('data-title') || 'সূচিপত্র';
  } catch {
    return 'সূচিপত্র';
  }
}

/**
 * অটো-সূচিপত্র — EditorApp-এ একবার মাউন্ট করলেই চলে।
 *
 * স্টোরের pages/settings বদলালে ১২০০ms ডিবাউন্সে স্ক্যান করে সিগনেচার মিলিয়ে
 * দেখে; বদলে থাকলে (ক) মাউন্ট করা এডিটরগুলোর tocBlock নোড আপডেট (updateTocNodes
 * → onUpdate → syncHtml), (খ) মাউন্ট নেই এমন পাতার HTML সরাসরি লেখা
 * (replacePageHtml — ইঞ্জিন-আপডেট, অটোসেভ স্বয়ংক্রিয়ভাবে হয়)।
 *
 * পারফরম্যান্স: সাবস্ক্রিপশন zustand-এর ভ্যানিলা subscribe() দিয়ে — কম্পোনেন্ট
 * রি-রেন্ডার হয় না (useEditorStore selector দিয়ে pages নিলে EditorApp প্রতি
 * কীস্ট্রোকে রি-রেন্ডার হত — Task 10-b-র হট-পাথ কাটার পরিপন্থী হত)।
 *
 * নিরাপত্তা: ফ্লো-অপে এডিটর অ্যাসিনক্রোনাসভাবে ধ্বংস হতে পারে — updateTocNodes
 * নিজেই isDestroyed গার্ড করে, এখানেও try/catch-এ মোড়ানো; মাউন্ট-করা পাতার HTML
 * কখনো হাতে লেখা হয় না (এডিটরই syncHtml করে)।
 */
export function useAutoToc(): void {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    // শেষ পরিচিত সিগনেচার — একই এন্ট্রি হলে কোনো লেখাই হয় না (লুপ ও অটোসেভ-চাপ এড়াতে)
    let lastSignature = '';

    const run = () => {
      timer = null;
      const { pages, settings } = useEditorStore.getState();
      // সূচিপত্র-ব্লক নেই → কিছুই করার নেই (সবচেয়ে সস্তা আগাম-গার্ড)
      if (!hasTocBlock(pages)) return;
      let entries: TocEntry[];
      try {
        entries = scanTocEntries(pages, settings);
      } catch {
        return;
      }
      const signature = `${entries.length}:${JSON.stringify(entries)}`;
      if (signature === lastSignature) return;

      const title = extractTocTitle(pages);
      // (ক) মাউন্ট করা এডিটরগুলোর tocBlock নোড আপডেট — ধ্বংসপ্রাপ্ত এডিটর গার্ডসহ
      try {
        updateTocNodes(getAllEditors().filter((ed) => !ed.isDestroyed), entries, title);
      } catch { /* ফ্লো-অপের মাঝে নিরীক্ষিত ব্যর্থতা — পরের ডিবাউন্সে আবার চেষ্টা হবে */ }

      // (খ) মাউন্ট নেই এমন toc-পাতার HTML সরাসরি সিঙ্ক
      for (const page of pages) {
        if (!page.html.includes('toc-block')) continue;
        const ed = getEditor(page.id);
        if (ed && !ed.isDestroyed) continue; // মাউন্ট করা → updateTocNodes-ই সামলেছে
        const newHtml = updateTocInHtml(page.html, entries);
        if (newHtml !== page.html) {
          useEditorStore.getState().replacePageHtml(page.id, newHtml);
        }
      }
      lastSignature = signature;
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(run, 1200);
    };

    // zustand ভ্যানিলা-সাবস্ক্রিপশন — (state, prevState) পায়, রি-রেন্ডার নেই
    const unsubscribe = useEditorStore.subscribe((state, prev) => {
      if (state.pages === prev.pages && state.settings === prev.settings) return;
      schedule();
    });
    // ওপেন-এ পুরনো বইয়ের বাসি সূচিপত্রও একবার মিলিয়ে নেওয়া
    timer = setTimeout(run, 1200);

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
