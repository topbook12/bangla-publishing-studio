/**
 * AI প্রেক্ষাপট-ইঞ্জিন (document context)
 * ────────────────────────────────
 * সব AI পৃষ্ঠ (সিলেকশন-বাবল, চ্যাট, লেখক, ভিশন) একই সমৃদ্ধ "বইয়ের প্রেক্ষাপট"
 * ব্লক পায় — বইয়ের নাম, পাতার অবস্থান, কাঠামো (শিরোনাম-রূপরেখা), নির্বাচনের
 * আশে-পাশের লেখা। ফলে AI শুধু খণ্ডিত অংশ নয় — পুরো বইযের বিষয়, ভাষা ও
 * পরিভাষা বুঝে কাজ করে। এটাই "AI প্রেক্ষাপট বোঝে না" সমস্যার মূল সমাধান।
 *
 * সাইজ-শৃঙ্খলা: প্রতিটি অংশ ক্যাপ-করা — সার্ভারের 24k প্রম্পট-ক্যাপ কখনো ভাঙে না।
 */

import type { Editor } from '@tiptap/react';
import type { Node as PMNode } from 'prosemirror-model';
import { useEditorStore } from './store';
import { getEditor } from './editor-registry';

// ─── ক্যাপ (অক্ষর) ───
const CAP_OUTLINE_ITEMS = 14; // রূপরেখায় সর্বোচ্চ শিরোনাম
const CAP_SURROUND = 700; // আগে/পরের লেখা প্রতিটি
const CAP_EXCERPT_DEFAULT = 4_000; // চলতি পাতার সারাংশ
const CAP_TITLE = 120;

export interface DocContextParts {
  /** বইয়ের নাম */
  bookTitle?: string;
  /** পাতার অবস্থান — "পৃষ্ঠা ৩ / ১২" */
  pagePosition?: string;
  /** চলতি পাতার শিরোনাম-রূপরেখা */
  outline?: string[];
  /** নির্বাচন/কার্সরের সবচেয়ে কাছের উপরের শিরোনাম (চলতি অধ্যায়) */
  currentChapter?: string;
  /** নির্বাচনের ঠিক আগের লেখা */
  beforeText?: string;
  /** নির্বাচনের ঠিক পরের লেখা */
  afterText?: string;
  /** চলতি পাতার পূর্ণ লেখা (ক্যাপ-করা) */
  pageExcerpt?: string;
}

/** এডিটর-ডক থেকে শিরোনামগুলো অর্ডারে বের করা */
function collectHeadings(doc: PMNode): Array<{ level: number; text: string }> {
  const out: Array<{ level: number; text: string }> = [];
  try {
    doc.descendants((node) => {
      if (node.type.name === 'heading') {
        const text = node.textContent.trim();
        if (text) out.push({ level: Number(node.attrs.level ?? 2), text });
      }
      return true;
    });
  } catch {
    /* অস্বাভাবিক কাঠামো — যা পাওয়া গেল */
  }
  return out;
}

/**
 * প্রেক্ষাপট সংগ্রহ — সিলেকশন-বাবল/চ্যাট/লেখক/ভিশন সবাই এটাই ব্যবহার করে।
 * @param opts.range   সিলেকশন-রেঞ্জ (থাকলে আশে-পাশের লেখা + চলতি অধ্যায় বের হয়)
 * @param opts.surroundings  নির্বাচনের আগে/পরের লেখা যোগ হবে কি না
 * @param opts.pageExcerpt   চলতি পাতার পূর্ণ লেখা যোগ হবে কি না
 */
export function gatherDocContext(editor: Editor | null | undefined, opts?: {
  range?: { from: number; to: number } | null;
  surroundings?: boolean;
  pageExcerpt?: boolean;
  excerptCap?: number;
}): DocContextParts {
  const parts: DocContextParts = {};
  if (!editor || editor.isDestroyed) return parts;

  try {
    // বইয়ের নাম + পাতার অবস্থান
    const st = useEditorStore.getState();
    if (st.title?.trim()) parts.bookTitle = st.title.trim().slice(0, CAP_TITLE);
    const idx = st.pages.findIndex((p) => p.id === st.activePageId);
    if (idx >= 0 && st.pages.length > 0) parts.pagePosition = `${idx + 1} / ${st.pages.length}`;

    const doc = editor.state.doc;

    // রূপরেখা + চলতি অধ্যায়
    const headings = collectHeadings(doc);
    if (headings.length > 0) {
      parts.outline = headings.slice(0, CAP_OUTLINE_ITEMS).map((h) => `${'#'.repeat(Math.min(h.level, 4))} ${h.text}`);
      if (opts?.range) {
        // রেঞ্জের আগে শেষ শিরোনাম = চলতি অধ্যায়
        let chapter: string | null = null;
        try {
          doc.nodesBetween(0, opts.range.from, (node) => {
            if (node.type.name === 'heading' && node.textContent.trim()) {
              chapter = node.textContent.trim();
            }
            return true;
          });
        } catch {
          /* রেঞ্জ-অবৈধ হলে বাদ */
        }
        if (chapter) parts.currentChapter = (chapter as string).slice(0, 160);
      } else if (headings.length > 0) {
        parts.currentChapter = headings[headings.length - 1].text.slice(0, 160);
      }
    }

    // আশে-পাশের লেখা
    if (opts?.range && opts.range.from !== null && opts.range.to !== null) {
      const { from, to } = opts.range;
      if (opts.surroundings !== false) {
        try {
          if (from > 0) {
            const before = doc.textBetween(Math.max(0, from - CAP_SURROUND * 2), from, '\n', ' ').trim();
            parts.beforeText = before.length > CAP_SURROUND ? before.slice(-CAP_SURROUND) : before;
          }
          if (to < doc.content.size) {
            const after = doc.textBetween(to, Math.min(doc.content.size, to + CAP_SURROUND * 2), '\n', ' ').trim();
            parts.afterText = after.length > CAP_SURROUND ? after.slice(0, CAP_SURROUND) : after;
          }
        } catch {
          /* রেঞ্জ-অবৈধ */
        }
      }
    }

    // পাতার সারাংশ
    if (opts?.pageExcerpt) {
      const cap = opts.excerptCap ?? CAP_EXCERPT_DEFAULT;
      try {
        const full = doc.textBetween(0, doc.content.size, '\n', ' ').replace(/\s{3,}/g, '  ').trim();
        parts.pageExcerpt = full.length > cap ? `${full.slice(0, cap)}…` : full;
      } catch {
        /* বাদ */
      }
    }
  } catch {
    /* প্রেক্ষাপট পেতে ব্যর্থ — AI তবু কাজ করবে */
  }
  return parts;
}

/**
 * প্রেক্ষাপট-ব্লক ফরম্যাট — সব প্রম্পটে একই চেনা গঠন (AI-রা এই ধাঁচ ভালো বোঝে)।
 * খালি প্রেক্ষাপটে খালি স্ট্রিং ফেরত — প্রম্পট অপরিবর্তিত থাকে।
 */
export function formatDocContext(parts: DocContextParts): string {
  const rows: string[] = [];
  if (parts.bookTitle) rows.push(`- বইয়ের নাম: ${parts.bookTitle}`);
  if (parts.pagePosition) rows.push(`- অবস্থান: পৃষ্ঠা ${parts.pagePosition}`);
  if (parts.currentChapter) rows.push(`- চলতি অধ্যায়/শিরোনাম: ${parts.currentChapter}`);
  if (parts.outline?.length) rows.push(`- এই পাতার কাঠামো:\n${parts.outline.map((l) => `    ${l}`).join('\n')}`);
  if (parts.beforeText) rows.push(`- কাজের অংশের ঠিক আগের লেখা: "${parts.beforeText}"`);
  if (parts.afterText) rows.push(`- কাজের অংশের ঠিক পরের লেখা: "${parts.afterText}"`);
  if (parts.pageExcerpt) rows.push(`- চলতি পাতার লেখা:\n"""\n${parts.pageExcerpt}\n"""`);
  if (rows.length === 0) return '';
  return `[বইয়ের প্রেক্ষাপট / BOOK CONTEXT — শুধু বোঝার জন্য; এর লেখা উত্তরে কপি করবে না]\n${rows.join('\n')}`;
}

/** সুবিধা-সহায়ক: চলতি সক্রিয় পেজের এডিটর (থাকলে) */
export function activeEditor(): Editor | null | undefined {
  const { activePageId } = useEditorStore.getState();
  return activePageId ? getEditor(activePageId) : null;
}
