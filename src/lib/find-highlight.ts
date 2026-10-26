/**
 * দিন ১৬ — Find-highlight decoration প্লাগিন: ডায়ালগ খোলা থাকা অবস্থায়
 * মাউন্ট করা পাতার সব মিল ক্যানভাসে হাইলাইট দেখায় (হলুদ ব্যান্ড)।
 *
 *  - Decoration-ভিত্তিক — ডক নয়, দৃশ্য-স্তরে: undo/redo ও স্টোরেজ অপরিবর্তিত
 *  - state আপডেট: setFindHighlights(editor, ranges) — tr meta দিয়ে
 *  - docChanged হলে পুরনো সেট নতুন doc-এ ম্যাপ হয় (এডিটের পরেও সঠিক)
 *  - প্রিন্টে হাইলাইট যায় না (globals.css @media print)
 */

import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import { Extension } from '@tiptap/core';
import type { Editor } from '@tiptap/react';
import { getAllEditors } from './editor-registry';

export const findHighlightKey = new PluginKey<DecorationSet>('bwp-find-highlight');

/** দিন ১৬ — টিপট্যাপ এক্সটেনশন-ফর্ম (useEditor-এর এক্সটেনশন-তালিকায় যায়) */
export function FindHighlightExtension() {
  return Extension.create({
    name: 'findHighlight',
    addProseMirrorPlugins() {
      return [findHighlightPlugin()];
    },
  });
}

export function findHighlightPlugin() {
  return new Plugin<DecorationSet>({
    key: findHighlightKey,
    state: {
      init: () => DecorationSet.empty,
      apply(tr, old) {
        const meta = tr.getMeta(findHighlightKey);
        if (meta !== undefined) return meta as DecorationSet;
        return tr.docChanged ? old.map(tr.mapping, tr.doc) : old;
      },
    },
    props: {
      decorations(state) {
        return findHighlightKey.getState(state);
      },
    },
  });
}

/** এক পাতার এডিটরে হাইলাইট-সেট বসানো (শূন্য রেঞ্জ = সব মুছুন) */
export function setFindHighlights(
  editor: Editor,
  ranges: Array<{ from: number; to: number }>,
): void {
  if (editor.isDestroyed) return;
  try {
    const decos = ranges.length
      ? DecorationSet.create(
          editor.state.doc,
          ranges
            .filter((r) => r.to > r.from)
            .map((r) => Decoration.inline(r.from, r.to, { class: 'find-hl' })),
        )
      : DecorationSet.empty;
    const tr = editor.state.tr.setMeta(findHighlightKey, decos);
    tr.setMeta('addToHistory', false);
    editor.view.dispatch(tr);
  } catch {
    /* ভিউ ব্যস্ত — পরবর্তী সার্চে আবার */
  }
}

/** এক পাতার হাইলাইট মুছুন */
export function clearFindHighlights(editor: Editor | undefined | null): void {
  if (!editor || editor.isDestroyed) return;
  setFindHighlights(editor, []);
}

/** সব মাউন্ট করা এডিটরের হাইলাইট মুছুন (ডায়ালগ বন্ধে) */
export function clearAllFindHighlights(): void {
  for (const ed of getAllEditors()) clearFindHighlights(ed);
}
