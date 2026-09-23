/**
 * TipTap কাস্টম এক্সটেনশন — একাডেমিক কলআউট বক্স, MCQ ব্লক, ফুটনোট,
 * আলংকারিক ডিভাইডার, সূচিপত্র ব্লক ও লাইন-হাইট।
 *
 * স্টোরেজ কনট্রাক্ট (src/lib/nodes-html.ts এর সাথে মিলিয়ে দেখুন):
 *  - calloutBox:  <div class="callout-box" data-variant data-title> [content] </div>
 *  - mcqBlock:    <div class="mcq-block" data-question data-options data-answer data-explanation></div>
 *  - footnote:    <sup class="footnote" data-note></sup>
 *  - fancyDivider:<hr class="fancy-divider" data-style />
 *  - tocBlock:    <div class="toc-block" data-title data-entries></div>
 */

'use client';

import { Node, Extension, mergeAttributes, type CommandProps } from '@tiptap/core';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import { useState } from 'react';
import { AlertTriangle, BookOpen, Lightbulb, Pin, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { parseMcqData, type McqData } from '@/lib/nodes-html';

// ─────────────────────────── কলআউট বক্স ───────────────────────────

const CALLOUT_META: Record<string, { label: string; Icon: typeof Lightbulb; className: string }> = {
  concept: { label: 'মূল ধারণা', Icon: Lightbulb, className: 'callout-concept' },
  warning: { label: 'সতর্কতা', Icon: AlertTriangle, className: 'callout-warning' },
  formula: { label: 'সূত্র', Icon: BookOpen, className: 'callout-formula' },
  note: { label: 'নোট', Icon: Pin, className: 'callout-note' },
};

function CalloutNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const variant = (node.attrs.variant as string) ?? 'concept';
  const title = (node.attrs.title as string) ?? '';
  const meta = CALLOUT_META[variant] ?? CALLOUT_META.concept;
  const Icon = meta.Icon;

  return (
    <NodeViewWrapper as="div" className={cn('callout-box', meta.className)} data-variant={variant} data-title={title}>
      <div className="callout-head" contentEditable={false}>
        <span className="callout-badge">
          <Icon size={14} aria-hidden="true" />
          <input
            className="callout-title-input"
            value={title || meta.label}
            placeholder={meta.label}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            aria-label="বক্সের শিরোনাম"
          />
        </span>
        <button
          type="button"
          className="callout-delete"
          onClick={deleteNode}
          title="বক্স মুছুন"
          aria-label="বক্স মুছুন"
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      <NodeViewContent className="callout-content" />
    </NodeViewWrapper>
  );
}

export const CalloutBox = Node.create({
  name: 'calloutBox',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'concept',
        parseHTML: (el) => el.getAttribute('data-variant') ?? 'concept',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant }),
      },
      title: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-title') ?? '',
        renderHTML: (attrs) => ({ 'data-title': attrs.title ?? '' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.callout-box' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'callout-box' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(CalloutNodeView);
  },

  addCommands() {
    return {
      insertCallout:
        (variant: string, title: string) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: { variant, title },
            content: [{ type: 'paragraph' }],
          }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    calloutBox: {
      insertCallout: (variant: string, title: string) => ReturnType;
    };
  }
}

// ─────────────────────────── MCQ ব্লক ───────────────────────────

const OPTION_LABELS = ['ক', 'খ', 'গ', 'ঘ'] as const;

function McqNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  // attrs থেকে সরাসরি পড়া (parseMcqData ফলব্যাক)
  const fallback = parseMcqData(document.createElement('div'));
  const question = (node.attrs.question as string) ?? fallback.question;
  const options = ((node.attrs.options as string[]) ?? fallback.options) as string[];
  const answer = (node.attrs.answer as number) ?? fallback.answer;
  const explanation = (node.attrs.explanation as string) ?? fallback.explanation;
  const [manuallyEditing, setManuallyEditing] = useState(false);
  const editing = manuallyEditing || selected;

  const update = (patch: Partial<McqData>) => {
    updateAttributes({
      question: patch.question ?? question,
      options: patch.options ?? options,
      answer: patch.answer ?? answer,
      explanation: patch.explanation ?? explanation,
    });
  };

  return (
    <NodeViewWrapper as="div" className={cn('mcq-block', selected && 'mcq-selected')} data-question={question}>
      <div className="mcq-head" contentEditable={false}>
        <span className="mcq-tag">প্রশ্ন</span>
        <button type="button" className="callout-delete" onClick={() => setManuallyEditing((v) => !v)} title="সম্পাদনা">
          {editing ? '✕' : '✎'}
        </button>
        <button type="button" className="callout-delete" onClick={deleteNode} title="মুছুন" aria-label="প্রশ্ন মুছুন">
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      {!editing ? (
        <div className="mcq-view" contentEditable={false}>
          <p className="mcq-question">{question || 'প্রশ্ন লিখুন (✎ চাপুন)'}</p>
          <div className="mcq-options">
            {options.map((opt, i) => (
              <span key={i} className={cn('mcq-option', answer === i && 'mcq-answer')}>
                <b>({OPTION_LABELS[i]})</b> {opt || '—'}
              </span>
            ))}
          </div>
          {explanation ? <p className="mcq-expl">💡 {explanation}</p> : null}
        </div>
      ) : (
        <div className="mcq-edit" contentEditable={false}>
          <Input value={question} onChange={(e) => update({ question: e.target.value })} placeholder="প্রশ্ন লিখুন" className="mcq-input" />
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                className={cn('mcq-answer-btn', answer === i && 'mcq-answer-btn-active')}
                onClick={() => update({ answer: i })}
                title="সঠিক উত্তর চিহ্নিত করুন"
              >
                ({OPTION_LABELS[i]})
              </button>
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  update({ options: next as McqData['options'] });
                }}
                placeholder={`অপশন (${OPTION_LABELS[i]})`}
                className="mcq-input"
              />
            </div>
          ))}
          <Input value={explanation} onChange={(e) => update({ explanation: e.target.value })} placeholder="ব্যাখ্যা (ঐচ্ছিক)" className="mcq-input" />
          <Button size="sm" variant="secondary" className="h-7" onClick={() => setManuallyEditing(false)}>সম্পন্ন</Button>
        </div>
      )}
    </NodeViewWrapper>
  );
}

export const McqBlock = Node.create({
  name: 'mcqBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      question: { default: '', parseHTML: (el) => el.getAttribute('data-question') ?? '', renderHTML: (a) => ({ 'data-question': a.question ?? '' }) },
      options: {
        default: ['', '', '', ''],
        parseHTML: (el) => {
          try {
            const arr: unknown = JSON.parse(el.getAttribute('data-options') ?? '[]');
            if (Array.isArray(arr)) return arr.map(String);
          } catch { /* উপেক্ষা */ }
          return ['', '', '', ''];
        },
        renderHTML: (a) => ({ 'data-options': JSON.stringify(a.options ?? ['', '', '', '']) }),
      },
      answer: { default: -1, parseHTML: (el) => Number(el.getAttribute('data-answer') ?? -1), renderHTML: (a) => ({ 'data-answer': a.answer ?? -1 }) },
      explanation: { default: '', parseHTML: (el) => el.getAttribute('data-explanation') ?? '', renderHTML: (a) => ({ 'data-explanation': a.explanation ?? '' }) },
    };
  },

  parseHTML() {
    return [{ tag: 'div.mcq-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'mcq-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(McqNodeView);
  },

  addCommands() {
    return {
      insertMcq:
        () =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name, attrs: { question: '', options: ['', '', '', ''], answer: -1, explanation: '' } }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mcqBlock: {
      insertMcq: () => ReturnType;
    };
  }
}

// ─────────────────────────── ফুটনোট ───────────────────────────

function FootnoteNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const note = (node.attrs.note as string) ?? '';
  const [manuallyOpen, setManuallyOpen] = useState(false);
  const open = manuallyOpen || selected;

  return (
    <NodeViewWrapper as="span" className="footnote-wrap">
      <sup
        className="footnote-ref"
        role="button"
        tabIndex={0}
        title={note}
        onClick={() => setManuallyOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === 'Enter') setManuallyOpen((v) => !v); }}
      >
        <span aria-hidden="true">▾</span>
      </sup>
      {open ? (
        <span className="footnote-pop" contentEditable={false}>
          <Input
            value={note}
            autoFocus
            placeholder="ফুটনোটের লেখা…"
            onChange={(e) => updateAttributes({ note: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Escape') setManuallyOpen(false); }}
            className="footnote-input"
          />
          <button type="button" className="callout-delete" onClick={deleteNode} title="ফুটনোট মুছুন" aria-label="ফুটনোট মুছুন">
            <Trash2 size={12} aria-hidden="true" />
          </button>
        </span>
      ) : null}
    </NodeViewWrapper>
  );
}

export const Footnote = Node.create({
  name: 'footnote',
  group: 'inline',
  inline: true,
  atom: true,

  addAttributes() {
    return {
      note: { default: '', parseHTML: (el) => el.getAttribute('data-note') ?? '', renderHTML: (a) => ({ 'data-note': a.note ?? '' }) },
    };
  },

  parseHTML() {
    return [{ tag: 'sup.footnote' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['sup', mergeAttributes(HTMLAttributes, { class: 'footnote' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FootnoteNodeView);
  },

  addCommands() {
    return {
      insertFootnote:
        (note: string) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name, attrs: { note } }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    footnote: {
      insertFootnote: (note: string) => ReturnType;
    };
  }
}

// ─────────────────────────── আলংকারিক ডিভাইডার ───────────────────────────

export type DividerStyle = 'single' | 'double' | 'dotted' | 'flourish';

export const FancyDivider = Node.create({
  name: 'fancyDivider',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      style: {
        default: 'single',
        parseHTML: (el) => el.getAttribute('data-style') ?? 'single',
        renderHTML: (a) => ({ 'data-style': a.style ?? 'single' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'hr.fancy-divider' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['hr', mergeAttributes(HTMLAttributes, { class: 'fancy-divider' })];
  },

  addCommands() {
    return {
      insertDivider:
        (style: DividerStyle) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name, attrs: { style } }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fancyDivider: {
      insertDivider: (style: DividerStyle) => ReturnType;
    };
  }
}

// ─────────────────────────── সূচিপত্র ব্লক ───────────────────────────

interface TocEntryAttr {
  text: string;
  level: number;
  pageNumber: string;
}

function TocNodeView({ node, deleteNode }: NodeViewProps) {
  let entries: TocEntryAttr[] = [];
  try {
    const raw = node.attrs.entries;
    if (Array.isArray(raw)) entries = raw as TocEntryAttr[];
  } catch { /* উপেক্ষা */ }
  const title = (node.attrs.title as string) ?? 'সূচিপত্র';

  return (
    <NodeViewWrapper as="div" className="toc-block">
      <div className="toc-head" contentEditable={false}>
        <span className="toc-title">{title}</span>
        <button type="button" className="callout-delete" onClick={deleteNode} title="সূচিপত্র মুছুন" aria-label="সূচিপত্র মুছুন">
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="toc-empty">এখনো কোনো শিরোনাম নেই — H1/H2/H3 লিখে ডিজাইন ট্যাব থেকে “সূচিপত্র হালনাগাদ” চাপুন।</p>
      ) : (
        <ol className="toc-list">
          {entries.map((e, i) => (
            <li key={i} className={cn('toc-entry', `toc-level-${e.level}`)}>
              <span className="toc-text">{e.text}</span>
              <span className="toc-dots" aria-hidden="true" />
              <span className="toc-page">{e.pageNumber}</span>
            </li>
          ))}
        </ol>
      )}
    </NodeViewWrapper>
  );
}

export const TocBlock = Node.create({
  name: 'tocBlock',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: { default: 'সূচিপত্র', parseHTML: (el) => el.getAttribute('data-title') ?? 'সূচিপত্র', renderHTML: (a) => ({ 'data-title': a.title ?? 'সূচিপত্র' }) },
      entries: {
        default: [],
        parseHTML: (el) => {
          try {
            const parsed: unknown = JSON.parse(el.getAttribute('data-entries') ?? '[]');
            if (Array.isArray(parsed)) return parsed;
          } catch { /* উপেক্ষা */ }
          return [];
        },
        renderHTML: (a) => ({ 'data-entries': JSON.stringify(a.entries ?? []) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.toc-block' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'toc-block' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(TocNodeView);
  },

  addCommands() {
    return {
      insertToc:
        (entries: TocEntryAttr[], title?: string) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({ type: this.name, attrs: { entries, title: title ?? 'সূচিপত্র' } }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tocBlock: {
      insertToc: (entries: TocEntryAttr[], title?: string) => ReturnType;
    };
  }
}

// ─────────────────────────── লাইন-হাইট ───────────────────────────

export const LineHeight = Extension.create({
  name: 'lineHeight',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          lineHeight: {
            default: null,
            parseHTML: (el) => el.style.lineHeight || null,
            renderHTML: (attrs) => {
              const lh = (attrs as { lineHeight?: string | null }).lineHeight;
              return lh ? { style: `line-height: ${lh}` } : {};
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setLineHeight:
        (value: string) =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes('paragraph', { lineHeight: value }),
      unsetLineHeight:
        () =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes('paragraph', { lineHeight: null }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    lineHeight: {
      setLineHeight: (value: string) => ReturnType;
      unsetLineHeight: () => ReturnType;
    };
  }
}

// ─────────────────────────── ফন্ট সাইজ ───────────────────────────

export const FontSize = Extension.create({
  name: 'fontSize',

  addGlobalAttributes() {
    return [
      {
        types: ['textStyle'],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el) => el.style.fontSize || null,
            renderHTML: (attrs) => {
              const size = (attrs as { fontSize?: string | null }).fontSize;
              return size ? { style: `font-size: ${size}` } : {};
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (value: string) =>
        ({ commands }: CommandProps) =>
          commands.updateAttributes('textStyle', { fontSize: value }),
      unsetFontSize:
        () =>
        ({ commands }: CommandProps) =>
          commands.resetAttributes('textStyle', 'fontSize'),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (value: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

// ─────────────────────────── সব একসাথে ───────────────────────────

export const customExtensions = [CalloutBox, McqBlock, Footnote, FancyDivider, TocBlock, LineHeight, FontSize];
