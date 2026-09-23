/**
 * ব্লক মুভার — টেবিল, ডিজাইন বক্স, MCQ, ডিভাইডার, ছবি ইত্যাদি বড় ব্লকগুলোকে
 * টেক্সটের মতো সহজে সরানো:
 *  - Alt+↑ / Alt+↓ : কার্সর যে টপ-লেভেল ব্লকে (বা ভেতরে), পুরো ব্লকটি পাশের
 *    ব্লকের সাথে অদল-বদল হয়ে উপরে/নিচে সরে যায়
 *  - insertLineAbove / insertLineAfter : ব্লকের ঠিক উপরে/নিচে ফাঁকা লাইন বসিয়ে
 *    কার্সর সেখানে রাখে — তারপর টাইপ করলে টেক্সটের মতোই ব্লকটি নিচে/উপরে ঠেলে যায়
 *
 * NodeSelection (ছবি/টেবিল/টেক্সটবক্স সিলেক্টেড), টেবিল সেলের ভেতরে কার্সর,
 * বক্সের ভেতরে টাইপিং — সব অবস্থাতেই পুরো টপ-লেভেল ব্লকটি সরে।
 */

import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import type { CommandProps } from '@tiptap/core';

interface TopLevelRef {
  /** doc-এর সন্তান হিসেবে ইনডেক্স */
  index: number;
  /** ব্লকের শুরু পজিশন */
  from: number;
  /** ব্লকের শেষ পজিশন */
  to: number;
}

/**
 * বর্তমান সিলেকশন থেকে টপ-লেভেল ব্লকের অবস্থান বের করা।
 * মাল্টি-ব্লক সিলেকশন হলে null (সরানো হবে না)।
 */
function topLevelBlock(state: CommandProps['state']): TopLevelRef | null {
  const { doc, selection } = state;
  const { from, to } = selection;
  const $from = doc.resolve(from);
  const $to = doc.resolve(to);

  // NodeSelection / GapCursor — টপ-লেভেলে দাঁড়িয়ে থাকলে
  if ($from.depth === 0) {
    const index = $from.index(0);
    const node = doc.child(index);
    if (!node) return null;
    return { index, from: $from.pos, to: $from.pos + node.nodeSize };
  }

  const start = $from.before(1);
  const end = $from.after(1);
  // সিলেকশন একাধিক টপ-লেভেল ব্লক জুড়ে থাকলে সরানো যাবে না
  if ($to.before(1) !== start || $to.after(1) !== end) return null;
  return { index: $from.index(0), from: start, to: end };
}

/** সরানো ব্লকের ভেতরে (বা পাশে) কার্সর বসানো — নিরাপদ ফলব্যাকসহ */
function placeCursor(tr: CommandProps['state']['tr'], insidePos: number, bias: -1 | 1): void {
  try {
    const clamped = Math.max(0, Math.min(insidePos, tr.doc.content.size));
    tr.setSelection(TextSelection.near(tr.doc.resolve(clamped), bias));
  } catch {
    /* কার্সর বসানো ব্যর্থ হলেও মুভ কার্যকর থাকবে */
  }
}

function moveBlock(dir: -1 | 1) {
  return ({ state, dispatch }: CommandProps): boolean => {
    const ref = topLevelBlock(state);
    if (!ref) return false;
    const { index, from, to } = ref;
    const otherIndex = index + dir;
    if (otherIndex < 0 || otherIndex >= state.doc.childCount) return false;

    const moved = state.doc.child(index);
    const other = state.doc.child(otherIndex);
    if (!moved || !other) return false;

    if (dispatch) {
      const tr = state.tr;
      tr.delete(from, to);
      // ডিলিটের পরে `other` এর অবস্থান: dir=-1 হলে [from - other.nodeSize, from)
      // dir=+1 হলে [from, from + other.nodeSize) — তার ওপাশে বসালেই অদল-বদল
      const insertAt = dir === -1 ? from - other.nodeSize : from + other.nodeSize;
      tr.insert(insertAt, moved);
      placeCursor(tr, insertAt + 1, dir === -1 ? -1 : 1);
      dispatch(tr);
    }
    return true;
  };
}

/** ব্লকের উপরে/নিচে ফাঁকা প্যারাগ্রাফ যোগ করে কার্সর সেখানে বসায় */
function insertLine(before: boolean) {
  return ({ state, dispatch }: CommandProps): boolean => {
    const ref = topLevelBlock(state);
    if (!ref) return false;
    if (dispatch) {
      const para = state.schema.nodes.paragraph?.create();
      if (!para) return false;
      const tr = state.tr;
      const at = before ? ref.from : ref.to;
      tr.insert(at, para);
      placeCursor(tr, at + 1, before ? -1 : 1);
      dispatch(tr);
    }
    return true;
  };
}

export const BlockMover = Extension.create({
  name: 'blockMover',

  addCommands() {
    return {
      moveBlockUp: () => moveBlock(-1),
      moveBlockDown: () => moveBlock(1),
      insertLineAbove: () => insertLine(true),
      insertLineAfter: () => insertLine(false),
    };
  },

  addKeyboardShortcuts() {
    return {
      'Alt-ArrowUp': () => this.editor.commands.moveBlockUp(),
      'Alt-ArrowDown': () => this.editor.commands.moveBlockDown(),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    blockMover: {
      moveBlockUp: () => ReturnType;
      moveBlockDown: () => ReturnType;
      insertLineAbove: () => ReturnType;
      insertLineAfter: () => ReturnType;
    };
  }
}
