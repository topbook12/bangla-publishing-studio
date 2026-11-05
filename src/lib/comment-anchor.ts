/**
 * দিন ৬৪ — কমেন্ট-অ্যাঙ্কর মার্ক (margin-note ধাঁচের রিভিউ-থ্রেড)
 *
 * `<span class="cm-anchor" data-comment-id="cm-…">` — মার্ক পাতার HTML-এরই অংশ,
 * তাই দলিলের সাথেই সেভ/লোড/স্ন্যাপশট/শেয়ার হয় (local-first: আলাদা সিঙ্ক নেই)।
 *
 * নকশা-নোট:
 *  - inclusive: false — অ্যাঙ্করের ধারে টাইপ করা নতুন অক্ষর মন্তব্যে ঢুকবে না।
 *  - excludes-মুক্ত — হাইলাইট/বোল্ড ইত্যাদির সাথে সহাবস্থান করে।
 *  - print: globals.css-এ .cm-anchor ব্যাকগ্রাউন্ড বাদ — কাগজে মন্তব্য-দাগ ছাপে না।
 */

import { Mark, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/react';

export const COMMENT_ANCHOR_NAME = 'commentAnchor';

export const CommentAnchorMark = Mark.create({
  name: COMMENT_ANCHOR_NAME,
  inclusive: false,

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-comment-id'),
        renderHTML: (attrs) => (attrs.commentId ? { 'data-comment-id': attrs.commentId } : {}),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    // aria-label দেওয়া হয় না — ভিতরের আসল লেখাই স্ক্রিন-রিডারে পড়ে
    // (label দিলে a11y-ট্রি-তে লেখা 'comment'-এ বদলে যায়)
    return ['span', mergeAttributes(HTMLAttributes, { class: 'cm-anchor' }), 0];
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }];
  },
});

/** সিলেকশনে নতুন মন্তব্য-অ্যাঙ্কর বসানো (রিভিউ-ট্যাব "নতুন মন্তব্য") */
export function setCommentAnchor(editor: Editor, commentId: string): boolean {
  return editor
    .chain()
    .focus()
    .setMark(COMMENT_ANCHOR_NAME, { commentId })
    .run();
}

/**
 * নির্দিষ্ট মন্তব্যের অ্যাঙ্কর-মার্ক ডক থেকে সরানো (বাতিল/মুছে ফেলা)।
 * unsetMark সব অ্যাঙ্কর মুছে ফেলত — তাই ডক স্ক্যান করে এই id-র রেঞ্জেই removeMark।
 */
export function removeCommentAnchor(editor: Editor, commentId: string): void {
  const { tr, doc } = editor.state;
  const markType = editor.schema.marks[COMMENT_ANCHOR_NAME];
  if (!markType) return;
  const ranges: Array<{ from: number; to: number }> = [];
  doc.descendants((node, pos) => {
    node.marks.forEach((m) => {
      if (m.type === markType && m.attrs.commentId === commentId) {
        ranges.push({ from: pos, to: pos + node.nodeSize });
      }
    });
    return true;
  });
  if (!ranges.length) return;
  ranges.reverse().forEach((r) => tr.removeMark(r.from, r.to, markType));
  editor.view.dispatch(tr);
}

/** কারেন্ট সিলেকশনের অ্যাঙ্কর-id (ক্লিক-ডিটেকশনে) — না থাকলে null */
export function anchorIdAtSelection(editor: Editor): string | null {
  const { from } = editor.state.selection;
  const marks = editor.state.doc.resolve(Math.min(from, editor.state.doc.content.size)).marks();
  const m = marks.find((x) => x.type.name === COMMENT_ANCHOR_NAME);
  return (m?.attrs.commentId as string | undefined) ?? null;
}

/**
 * নির্দিষ্ট মন্তব্যের অ্যাঙ্কর DOM-এ খোঁজা (রেল-কার্ড ক্লিকে স্ক্রল+ফ্ল্যাশ)।
 * পাতা-স্কোপড রেজিস্ট্রির বদলে গ্লোবাল কোয়েরি — অ্যাঙ্কর id স্বতন্ত্র।
 */
export function queryAnchorEl(commentId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-comment-id="${CSS.escape(commentId)}"]`);
}
