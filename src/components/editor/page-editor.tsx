/**
 * পৃষ্ঠা-ভিত্তিক TipTap এডিটর
 * - প্রতিটি ফিজিক্যাল পৃষ্ঠার নিজস্ব এডিটর
 * - Ctrl+Enter: কার্সর থেকে নতুন পৃষ্ঠা
 * - অটো-ফ্লো: পৃষ্ঠা ভরে গেলে শেষ ব্লকগুলো পরের পাতায়
 * - ভিউপোর্টের বাইরে স্ট্যাটিক প্রিভিউ (পারফরম্যান্স)
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import FontFamily from '@tiptap/extension-font-family';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import { FramedImage } from './image-ext';
import { TableCellWithBg, TableHeaderWithBg } from './table-cell-bg';
import Placeholder from '@tiptap/extension-placeholder';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Extension } from '@tiptap/core';
import { useEditorStore } from '@/lib/store';
import { registerEditor, unregisterEditor } from '@/lib/editor-registry';
import { customExtensions } from './extensions';
import { designExtensions } from './design-ext';
import { BlockMover } from './block-mover';
import { flowIfOverflow, mergeWithPreviousPage, pageBreakOnEditor, pullFromNextPage } from './page-ops';
import { StaticContent } from './static-content';
import type { PageData } from '@/lib/types';
import { fontStackOf } from '@/lib/paper';

/** ডকুমেন্টের প্রথম টেক্সটব্লকে কার্সর নেওয়ার অবস্থান */
function firstTextblockPos(editor: Editor): number | null {
  let found: number | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found !== null) return false;
    if (node.isTextblock && !node.isAtom) {
      found = pos + 1;
      return false;
    }
    return true;
  });
  return found;
}

/** NodeSelection (অ্যাটম নোডে) শুরুতে আটকে থাকলে টেক্সটে সরিয়ে নেওয়া */
function normalizeInitialSelection(editor: Editor): void {
  const { selection, doc } = editor.state;
  const isNodeSelection = selection.from !== selection.to || (selection.from === selection.to && doc.resolve(selection.from).nodeAfter?.isAtom);
  if (!isNodeSelection) return;
  const pos = firstTextblockPos(editor);
  if (pos !== null) {
    try {
      editor.commands.setTextSelection(Math.min(pos, Math.max(1, doc.content.size)));
    } catch { /* উপেক্ষা */ }
  }
}

interface PageEditorProps {
  page: PageData;
  index: number;
  isFirstPage: boolean;
}

export function PageEditor({ page, index, isFirstPage }: PageEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastEmittedRef = useRef<string>(page.html);
  const flowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(index < 6);

  const settings = useEditorStore((s) => s.settings);

  // ভিউপোর্ট অবজারভার — কাছে এলে আসল এডিটর মাউন্ট হয়
  useEffect(() => {
    if (mounted || !wrapperRef.current) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            setMounted(true);
            io.disconnect();
          }
        }
      },
      { rootMargin: '700px 0px' },
    );
    io.observe(wrapperRef.current);
    return () => io.disconnect();
  }, [mounted]);

  const syncHtml = useCallback(
    (html: string) => {
      lastEmittedRef.current = html;
      useEditorStore.getState().updatePageHtml(page.id, html);
    },
    [page.id],
  );

  const scheduleFlow = useCallback(() => {
    if (flowTimerRef.current) clearTimeout(flowTimerRef.current);
    flowTimerRef.current = setTimeout(() => {
      const contentEl = contentRef.current;
      if (!contentEl || !editorRef.current) return;
      flowIfOverflow(editorRef.current, page.id, contentEl.clientHeight);
    }, 350);
  }, [page.id]);

  const shortcuts = Extension.create({
    name: `shortcuts-${page.id}`,
    addKeyboardShortcuts() {
      return {
        'Mod-Enter': () => {
          pageBreakOnEditor(this.editor, page.id);
          return true;
        },
        Backspace: () => {
          const { selection } = this.editor.state;
          if (selection.empty && selection.from === 0 && !isFirstPage) {
            mergeWithPreviousPage(this.editor, page.id);
            return true;
          }
          return false;
        },
        Delete: () => {
          const { selection } = this.editor.state;
          const atEnd = selection.empty && selection.from >= this.editor.state.doc.content.size;
          if (atEnd) {
            pullFromNextPage(this.editor, page.id);
            return true;
          }
          return false;
        },
      };
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
      FramedImage.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeaderWithBg,
      TableCellWithBg,
      Placeholder.configure({ placeholder: 'লিখতে শুরু করুন…' }),
      Subscript,
      Superscript,
      ...customExtensions,
      ...designExtensions,
      BlockMover,
      shortcuts,
    ],
    content: page.html || '<p></p>',
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'bwp-prosemirror',
        'data-page-id': page.id,
      },
    },
    onUpdate: ({ editor: ed }) => {
      syncHtml(ed.getHTML());
      scheduleFlow();
    },
    onSelectionUpdate: () => {
      useEditorStore.getState().bumpSelection();
    },
    onTransaction: () => {
      useEditorStore.getState().bumpSelection();
    },
    onFocus: () => {
      useEditorStore.getState().setActivePage(page.id);
    },
    onCreate: ({ editor: ed }) => {
      registerEditor(page.id, ed);
      // flushSync সতর্কতা এড়াতে লাইফসাইকেলের বাইরে ডেফার
      window.setTimeout(() => {
        if (!ed.isDestroyed) normalizeInitialSelection(ed);
      }, 0);
    },
    onDestroy: () => {
      unregisterEditor(page.id);
    },
  });

  const editorRef = useRef<typeof editor | null>(null);
  editorRef.current = editor;

  // এডিটর মাউন্ট/আপডেটে রেজিস্ট্রি সিঙ্ক
  useEffect(() => {
    if (editor) registerEditor(page.id, editor);
    return () => {
      if (editor && !editor.isDestroyed) unregisterEditor(page.id);
    };
  }, [editor, page.id]);

  // বাইরে থেকে HTML পরিবর্তন হলে (স্প্লিট/মার্জ/থিম) এডিটরে বসানো
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    if (page.html === lastEmittedRef.current) return;
    lastEmittedRef.current = page.html;
    const html = page.html || '<p></p>';
    const t = window.setTimeout(() => {
      if (editor.isDestroyed) return;
      editor.commands.setContent(html, false);
      normalizeInitialSelection(editor);
    }, 0);
    return () => window.clearTimeout(t);
  }, [editor, page.html]);

  // কাগজের সাইজ/মার্জিন/থিম পরিবর্তনে অটো-ফ্লো পুনঃমূল্যায়ন
  useEffect(() => {
    scheduleFlow();
  }, [scheduleFlow, settings.paperSize, settings.orientation, settings.margins, settings.header, settings.footer]);

  // ResizeObserver — টাইপিং, ছবি লোড, ফন্ট লোডে উচ্চতা পরিবর্তন ধরা
  useEffect(() => {
    if (!editor || !mounted) return;
    const pmEl = editor.view.dom as HTMLElement | null;
    if (!pmEl) return;
    const ro = new ResizeObserver(() => {
      scheduleFlow();
    });
    ro.observe(pmEl);
    return () => ro.disconnect();
  }, [editor, mounted, scheduleFlow]);

  useEffect(() => {
    return () => {
      if (flowTimerRef.current) clearTimeout(flowTimerRef.current);
    };
  }, []);

  if (!mounted) {
    return (
      <div ref={wrapperRef} className="page-editor-shell">
        <div
          className="bwp-static-wrap"
          style={{
            fontFamily: fontStackOf(settings.defaultFont),
            fontSize: `${settings.defaultFontSize}pt`,
            lineHeight: settings.lineHeight,
          }}
        >
          <StaticContent html={page.html} />
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="page-editor-shell">
      <div ref={contentRef} className="page-editor-inner">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
}
