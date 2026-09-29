/**
 * টেক্সট ট্রান্সফর্ম + ড্রপ ক্যাপ — এডিটর পাওয়ার-টুল।
 *
 * - transformSelection: সিলেকশনের টেক্সট-নোডগুলোর ওপর সরাসরি ProseMirror
 *   ট্রানজ্যাকশন চালায় — মার্ক (বোল্ড/রং/ড্রপ-ক্যাপ ইত্যাদি) অক্ষত থাকে।
 * - toUpper/toLower/toTitle: কেস রূপান্তর (বাংলা অক্ষরে কেস নেই — no-op, নিরাপদ)।
 * - banglaToEnglishDigits / englishToBanglaDigits: ০-৯ ↔ 0-9।
 * - DropCapMark + toggleDropCap: প্যারাগ্রাফের প্রথম গ্রাফিম ক্লাস্টারে ড্রপ-ক্যাপ
 *   মার্ক (বাংলা যুক্তবর্ণ যেমন "ক্ষ" এক অক্ষর হিসেবে গণিত হয় — Intl.Segmenter)।
 */

import { Mark, mergeAttributes } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import type { Node as PMNode } from '@tiptap/pm/model';
import { toBanglaNumber, toEnglishDigits } from '@/lib/bangla';

/** টেক্সট-রূপান্তরকারী ফাংশনের শেপ */
export type TextTransform = (text: string) => string;

/** UPPERCASE — ল্যাটিনে প্রযোজ্য, বাংলা অক্ষত */
export const toUpper: TextTransform = (s) => s.toUpperCase();

/** lowercase */
export const toLower: TextTransform = (s) => s.toLowerCase();

/** Title Case — প্রতিটি ল্যাটিন শব্দের প্রথম অক্ষর বড়, বাকিগুলো ছোট; বাংলা no-op */
export const toTitle: TextTransform = (s) =>
  s.replace(/([A-Za-z])([A-Za-z]*)/g, (_m, first: string, rest: string) => first.toUpperCase() + rest.toLowerCase());

/** বাংলা সংখ্যা → ইংরেজি (১২৩ → 123) — bangla.ts-এর শেয়ার্ড ম্যাপ পুনঃব্যবহার */
export const banglaToEnglishDigits: TextTransform = (s) => toEnglishDigits(s);

/** ইংরেজি সংখ্যা → বাংলা (123 → ১২৩) */
export const englishToBanglaDigits: TextTransform = (s) => toBanglaNumber(s);

/**
 * সিলেকশনের প্রতিটি টেক্সট-নোডে fn প্রয়োগ — একটিই ট্রানজ্যাকশনে (এক ধাপের Ctrl+Z)।
 * অবস্থান অক্ষত রাখতে উল্টো দিক (শেষ নোড → প্রথম নোড) থেকে প্রতিস্থাপন করা হয়।
 * সিলেকশন খালি হলে false (কলার টোস্ট দেখায়); কিছু বদলাতে না হলে নীরবে true।
 */
export function transformSelection(editor: Editor, fn: TextTransform): boolean {
  const { state, view } = editor;
  const { from, to, empty } = state.selection;
  if (empty) return false;

  // রেঞ্জের ভিতরের টেক্সট-নোডগুলো সংগ্রহ (টেক্সট স্ট্রিংসহ — PMNode.text ঐচ্ছিক টাইপ)
  const targets: Array<{ node: PMNode; pos: number; text: string }> = [];
  state.doc.nodesBetween(from, to, (node, pos) => {
    if (node.isText && node.text) targets.push({ node, pos, text: node.text });
    return true;
  });

  const tr = state.tr;
  let changed = false;
  for (let i = targets.length - 1; i >= 0; i -= 1) {
    const target = targets[i];
    if (!target) continue;
    const next = fn(target.text);
    if (next === target.text) continue;
    // মার্কসহ নতুন টেক্সট-নোড — অলংকার হারায় না
    tr.replaceWith(target.pos, target.pos + target.node.nodeSize, state.schema.text(next, target.node.marks));
    changed = true;
  }

  if (!changed) return true;
  view.dispatch(tr);
  return true;
}

/**
 * ড্রপ ক্যাপ মার্ক — প্রথম অক্ষরকে বড় করে বাঁয়ে ভাসানো স্প্যান (স্টাইল: editor-tools.css)।
 * plain span বলে প্রিন্ট/এক্সপোর্ট HTML-এ স্বাভাবিকভাবেই যায়।
 */
export const DropCapMark = Mark.create({
  name: 'dropCap',
  // মার্কের পরে টাইপ করা অক্ষরে ছড়াবে না — কেবল প্রথম অক্ষরই ড্রপ-ক্যাপ
  inclusive: false,

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { class: 'drop-cap' }), 0];
  },

  parseHTML() {
    return [{ tag: 'span.drop-cap' }];
  },
});

/** প্যারাগ্রাফের প্রথম টেক্সট-নোড ও তার কনটেন্ট-অফসেট */
function firstTextNodeOf(parent: PMNode): { node: PMNode; offset: number } | null {
  let offset = 0;
  for (let i = 0; i < parent.childCount; i += 1) {
    const child = parent.child(i);
    if (child.isText && child.text) return { node: child, offset };
    offset += child.nodeSize;
  }
  return null;
}

/** প্রথম গ্রাফিম ক্লাস্টার — বাংলা যুক্তবর্ণ/ভাঙা-না-হওয়া অক্ষরজোড়া এক অক্ষর ধরা হয় */
function firstGrapheme(text: string): string {
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    try {
      const segmenter = new Intl.Segmenter('bn', { granularity: 'grapheme' });
      const first = segmenter.segment(text).containing(0);
      if (first?.segment) return first.segment;
    } catch {
      /* সেগমেন্টার ব্যর্থ হলে নিচের ফলব্যাক */
    }
  }
  // ফলব্যাক: প্রথম ইউনিকোড কোড পয়েন্ট
  return Array.from(text)[0] ?? '';
}

/**
 * কার্সরের প্যারাগ্রাফে ড্রপ ক্যাপ টগল:
 * - প্রথম গ্রাফিমে ইতিমধ্যে মার্ক থাকলে সরিয়ে দেয় (অফ)
 * - নইলে প্যারাগ্রাফের পুরনো ড্রপ-ক্যাপ (থাকলে) সরিয়ে প্রথম গ্রাফিমে বসায় (অন)
 * খালি প্যারাগ্রাফ/টেক্সটব্লক না হলে false — কলার টোস্ট দেখায়।
 */
export function toggleDropCap(editor: Editor): boolean {
  const { state, view } = editor;
  const parent = state.selection.$from.parent;
  // প্যারাগ্রাফ/হেডিং-জাতীয় টেক্সটব্লকেই প্রযোজ্য
  if (!parent.isTextblock || parent.isAtom) return false;

  const first = firstTextNodeOf(parent);
  if (!first || !first.node.text) return false;

  const markType = state.schema.marks.dropCap;
  if (!markType) return false;

  const parentStart = state.selection.$from.start();
  const text = first.node.text;
  const grapheme = firstGrapheme(text);
  if (!grapheme) return false;

  const gFrom = parentStart + first.offset;
  const gTo = Math.min(gFrom + grapheme.length, gFrom + text.length);

  const hadDropCap = first.node.marks.some((m) => m.type === markType);
  const tr = state.tr;
  // আগে পুরো প্যারাগ্রাফ থেকে পুরনো ড্রপ-ক্যাপ পরিষ্কার (এক প্যারাগ্রাফে একটিই থাকবে)
  tr.removeMark(parentStart, parentStart + parent.content.size, markType);
  if (!hadDropCap) tr.addMark(gFrom, gTo, markType.create());
  tr.scrollIntoView();
  view.dispatch(tr);
  return true;
}
