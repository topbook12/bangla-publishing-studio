/**
 * ফরম্যাট পেইন্টার (Format Painter) — MS Word-এর মতো ফরম্যাট কপি → পেস্ট।
 *
 * ধাপ:
 *  ১) captureFormat(editor) — কার্সর/সিলেকশনের বর্তমান মার্ক-সেটের স্ন্যাপশট নিয়ে অ্যাম (arm) করে
 *  ২) ব্যবহারকারী নতুন লেখা সিলেক্ট করলে FormatPainterPlugin-এর onTransaction স্ন্যাপশটটি প্রয়োগ করে
 *     (খালি সিলেকশনে প্রয়োগ হয় না — কার্সর নাড়ালেই বাতিল হয় না, Word-এর মতোই)
 *  ৩) একবার প্রয়োগের পর অ্যাম বন্ধ (একবারই বসে; আবার চাইলে আবার কপি)
 */

import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/react';

/** কপি করা ফরম্যাটের স্ন্যাপশট — false/undefined মানে ওই বৈশিষ্ট্যটি "অনুপস্থিত" */
export interface FormatSnapshot {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  superscript: boolean;
  subscript: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: string;
  highlight?: string;
  /** paragraph/heading-এর স্পষ্ট textAlign (থাকলে) */
  align?: string;
}

// ── মডিউল-স্টেট: একবারে একটাই কপি করা ফরম্যাট (রিবন ট্যাব বদলালেও টিকে থাকে) ──
let armed: FormatSnapshot | null = null;

/** অ্যাম/ডিসআর্ম হলে জানানোর লিসেনার (রিবন বাটনের active স্টেট রি-রেন্ডারের জন্য) */
const painterListeners = new Set<() => void>();

function notifyPainter(): void {
  for (const fn of painterListeners) {
    try {
      fn();
    } catch {
      /* লিসেনার ব্যর্থ হলেও মূল কাজ আটকাবে না */
    }
  }
}

/** armed অবস্থা বদলালে UI জানতে পারে — সাবস্ক্রাইব, আনসাবস্ক্রাইব ফাংশন ফেরত */
export function subscribePainter(fn: () => void): () => void {
  painterListeners.add(fn);
  return () => {
    painterListeners.delete(fn);
  };
}

/** ফরম্যাট কপি অ্যাম করা আছে কি না */
export function isPainterArmed(): boolean {
  return armed !== null;
}

/** অ্যাম বাতিল (Esc/আবার ক্লিকে) */
export function disarmPainter(): void {
  if (armed === null) return;
  armed = null;
  notifyPainter();
}

/**
 * সক্রিয় সিলেকশন/কার্সর-অবস্থান থেকে ফরম্যাট স্ন্যাপশট নিয়ে অ্যাম করে।
 * খালি সিলেকশনেও কার্সর যে লেখার ভিতরে সেই মার্কগুলো isActive রিপোর্ট করে।
 */
export function captureFormat(editor: Editor): FormatSnapshot {
  const safeActive = (name: string | Record<string, unknown>): boolean => {
    try {
      return editor.isActive(name);
    } catch {
      return false;
    }
  };
  const safeAttrs = (name: string): Record<string, unknown> => {
    try {
      return editor.getAttributes(name);
    } catch {
      return {};
    }
  };

  const styleAttrs = safeAttrs('textStyle');
  const hlAttrs = safeAttrs('highlight');
  const paraAttrs = safeAttrs('paragraph');

  const snap: FormatSnapshot = {
    bold: safeActive('bold'),
    italic: safeActive('italic'),
    underline: safeActive('underline'),
    strike: safeActive('strike'),
    superscript: safeActive('superscript'),
    subscript: safeActive('subscript'),
  };

  if (typeof styleAttrs.color === 'string' && styleAttrs.color) snap.color = styleAttrs.color;
  if (typeof styleAttrs.fontFamily === 'string' && styleAttrs.fontFamily) snap.fontFamily = styleAttrs.fontFamily;
  if (typeof styleAttrs.fontSize === 'string' && styleAttrs.fontSize) snap.fontSize = styleAttrs.fontSize;
  if (safeActive('highlight')) {
    // multicolor কনফিগ — রং অ্যাট্রিবিউট থাকে; না থাকলে রিবনের ডিফল্ট হাইলাইট রং
    snap.highlight = typeof hlAttrs.color === 'string' && hlAttrs.color ? hlAttrs.color : '#fef08a';
  }
  if (typeof paraAttrs.textAlign === 'string' && paraAttrs.textAlign) snap.align = paraAttrs.textAlign;

  armed = snap;
  notifyPainter();
  return snap;
}

/**
 * স্ন্যাপশট বর্তমান সিলেকশনে প্রয়োগ — প্রতিটি মার্ক স্পষ্টভাবে set/unset
 * (টগল নয়; নইলে টার্গেটের আগের অবস্থার ওপর ফল নির্ভর করত)।
 */
export function applyFormat(editor: Editor, snapshot?: FormatSnapshot): boolean {
  const snap = snapshot ?? armed;
  if (!snap) return false;
  try {
    let chain = editor.chain().focus();
    chain = snap.bold ? chain.setBold() : chain.unsetBold();
    chain = snap.italic ? chain.setItalic() : chain.unsetItalic();
    chain = snap.underline ? chain.setUnderline() : chain.unsetUnderline();
    chain = snap.strike ? chain.setStrike() : chain.unsetStrike();
    chain = snap.superscript ? chain.setSuperscript() : chain.unsetSuperscript();
    chain = snap.subscript ? chain.setSubscript() : chain.unsetSubscript();
    chain = snap.color ? chain.setColor(snap.color) : chain.unsetColor();
    chain = snap.fontFamily ? chain.setFontFamily(snap.fontFamily) : chain.unsetFontFamily();
    chain = snap.fontSize ? chain.setFontSize(snap.fontSize) : chain.unsetFontSize();
    chain = snap.highlight ? chain.setHighlight({ color: snap.highlight }) : chain.unsetHighlight();
    // align শুধু সোর্সে স্পষ্টভাবে সেট থাকলে — নইলে টার্গেট প্যারাগ্রাফের নিজস্ব অ্যালাইনমেন্ট রাখি
    if (snap.align) chain = chain.setTextAlign(snap.align);
    chain.run();
    return true;
  } catch {
    // ধ্বংসপ্রাপ্ত এডিটর/অসামঞ্জস্যপূর্ণ স্কিমা — নীরবে ব্যর্থ
    return false;
  }
}

/**
 * ফরম্যাট পেইন্টার প্লাগইন — প্রতিটি এডিটরে নিবন্ধিত হয়।
 * - Ctrl+Alt+C: কার্সরের ফরম্যাট কপি (অ্যাম)
 * - অ্যাম অবস্থায় নন-এম্পটি সিলেকশনে প্রয়োগ করে একবারেই ডিসআর্ম
 */
export const FormatPainterPlugin = Extension.create({
  name: 'formatPainterPlugin',

  addKeyboardShortcuts() {
    return {
      // MS Word-এর Ctrl+Alt+C-র মতো ফরম্যাট কপি
      'Mod-Alt-c': () => {
        captureFormat(this.editor);
        return true;
      },
    };
  },

  onTransaction() {
    if (!armed) return;
    // পুনঃপ্রবেশ-রক্ষা: applyFormat-এর ডিসপ্যাচ নিজেই আরেকটি onTransaction জ্বালায় —
    // প্রয়োগ চলাকালীন অ্যাম ঝুলিয়ে রাখি, শেষে একবার ডিসআর্ম (নইলে অসীম লুপ)
    if (this.storage.applying) return;
    const { selection } = this.editor.state;
    if (selection.empty) return;
    const snapshot: FormatSnapshot = armed;
    this.storage.applying = true;
    try {
      applyFormat(this.editor, snapshot);
    } catch {
      /* প্রয়োগ ব্যর্থ হলেও ডিসআর্ম নিশ্চিত করি */
    } finally {
      this.storage.applying = false;
      disarmPainter();
    }
  },
});
