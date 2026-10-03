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
import { t, tFmt, useT } from '@/lib/i18n';
import { parseMcqData, type DividerStyle, type McqData } from '@/lib/nodes-html';

// ─────────────────────────── কলআউট বক্স ───────────────────────────

const CALLOUT_META: Record<string, { labelKey: string; Icon: typeof Lightbulb; className: string }> = {
  concept: { labelKey: 'ins.callout.concept', Icon: Lightbulb, className: 'callout-concept' },
  warning: { labelKey: 'ins.callout.warning', Icon: AlertTriangle, className: 'callout-warning' },
  formula: { labelKey: 'ins.callout.formula', Icon: BookOpen, className: 'callout-formula' },
  note: { labelKey: 'ins.callout.note', Icon: Pin, className: 'callout-note' },
};

function CalloutNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const tt = useT();
  const variant = (node.attrs.variant as string) ?? 'concept';
  const title = (node.attrs.title as string) ?? '';
  const meta = CALLOUT_META[variant] ?? CALLOUT_META.concept;
  const Icon = meta.Icon;
  const label = tt(meta.labelKey);

  return (
    <NodeViewWrapper as="div" className={cn('callout-box', meta.className)} data-variant={variant} data-title={title}>
      <div className="callout-head" contentEditable={false}>
        <span className="callout-badge">
          <Icon size={14} aria-hidden="true" />
          <input
            className="callout-title-input"
            value={title || label}
            placeholder={label}
            onChange={(e) => updateAttributes({ title: e.target.value })}
            aria-label={tt('ws.callout.titleAria')}
          />
        </span>
        <button
          type="button"
          className="callout-delete"
          onClick={deleteNode}
          title={tt('ws.callout.delete')}
          aria-label={tt('ws.callout.delete')}
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

/** ৪টির বেশি অপশন হলে (পেস্ট/ইমপোর্ট) পরের লেবেল সংখ্যা দিয়ে — undefined রেন্ডার রোধে */
function mcqLabel(i: number): string {
  return OPTION_LABELS[i] ?? String(i + 1);
}

function McqNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const tt = useT();
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
        <span className="mcq-tag">{tt('ws.static.mcqTag')}</span>
        <button type="button" className="callout-delete" onClick={() => setManuallyEditing((v) => !v)} title={tt('ws.mcq.edit')}>
          {editing ? '✕' : '✎'}
        </button>
        <button type="button" className="callout-delete" onClick={deleteNode} title={tt('ws.delete')} aria-label={tt('ws.mcq.deleteAria')}>
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      {!editing ? (
        <div className="mcq-view" contentEditable={false}>
          <p className="mcq-question">{question || tt('ws.mcq.qEmpty')}</p>
          <div className="mcq-options">
            {options.map((opt, i) => (
              <span key={i} className={cn('mcq-option', answer === i && 'mcq-answer')}>
                <b>({mcqLabel(i)})</b> {opt || '—'}
              </span>
            ))}
          </div>
          {explanation ? <p className="mcq-expl">💡 {explanation}</p> : null}
        </div>
      ) : (
        <div className="mcq-edit" contentEditable={false}>
          <Input value={question} onChange={(e) => update({ question: e.target.value })} placeholder={tt('ws.mcq.qPlaceholder')} className="mcq-input" />
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                className={cn('mcq-answer-btn', answer === i && 'mcq-answer-btn-active')}
                onClick={() => update({ answer: i })}
                title={tt('ws.mcq.answerTitle')}
              >
                ({mcqLabel(i)})
              </button>
              <Input
                value={opt}
                onChange={(e) => {
                  const next = [...options];
                  next[i] = e.target.value;
                  update({ options: next as McqData['options'] });
                }}
                placeholder={tFmt('ws.mcq.optPlaceholder', { n: mcqLabel(i) })}
                className="mcq-input"
              />
            </div>
          ))}
          <Input value={explanation} onChange={(e) => update({ explanation: e.target.value })} placeholder={tt('ws.mcq.explPlaceholder')} className="mcq-input" />
          <Button size="sm" variant="secondary" className="h-7" onClick={() => setManuallyEditing(false)}>{tt('ws.mcq.done')}</Button>
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
  const tt = useT();
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
            placeholder={tt('ws.fn.placeholder')}
            onChange={(e) => updateAttributes({ note: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Escape') setManuallyOpen(false); }}
            className="footnote-input"
          />
          <button type="button" className="callout-delete" onClick={deleteNode} title={tt('ws.fn.delete')} aria-label={tt('ws.fn.delete')}>
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

export type { DividerStyle };

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
    return [
      { tag: 'hr.fancy-divider' },
      // সাধারণ <hr> (বাইরের HTML পেস্ট/ইমপোর্ট) — আগে কোনো রুল না মিলতে
      // পেস্টে চুপচাপ হারিয়ে যেত; এখন single-স্টাইল ডিভাইডার হিসেবে ঢোকে
      { tag: 'hr' },
    ];
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
  const tt = useT();
  let entries: TocEntryAttr[] = [];
  try {
    const raw = node.attrs.entries;
    if (Array.isArray(raw)) entries = raw as TocEntryAttr[];
  } catch { /* উপেক্ষা */ }
  const title = (node.attrs.title as string) || tt('dsn.toc.title');

  return (
    <NodeViewWrapper as="div" className="toc-block">
      <div className="toc-head" contentEditable={false}>
        <span className="toc-title">{title}</span>
        <button type="button" className="callout-delete" onClick={deleteNode} title={tt('ws.toc.delete')} aria-label={tt('ws.toc.delete')}>
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="toc-empty">{tt('ws.toc.empty').split('{btn}').join(tt('dsn.btn.updateToc'))}</p>
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
        ({ commands, state }: CommandProps) => {
          // কার্সর যে ব্লকে আছে সেই টাইপকে টার্গেট করি — আগে শুধু 'paragraph'
          // আপডেট হত, তাই হেডিংয়ের ভিতরে কমান্ডটা নীরব নো-অপ ছিল
          const target = state.selection.$from.parent.type.name === 'heading' ? 'heading' : 'paragraph';
          return commands.updateAttributes(target, { lineHeight: value });
        },
      unsetLineHeight:
        () =>
        ({ commands, state }: CommandProps) => {
          const target = state.selection.$from.parent.type.name === 'heading' ? 'heading' : 'paragraph';
          return commands.updateAttributes(target, { lineHeight: null });
        },
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
          // setMark — প্লেইন টেক্সটে (textStyle মার্ক ছাড়া) সাইজ এখন সত্যিই বসে;
          // আগের updateAttributes মার্ক ছাড়া লেখায় নীরব নো-অপ ছিল
          commands.setMark('textStyle', { fontSize: value }),
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

// ─────────────────────────── অ্যাডভান্সড টাইপোগ্রাফি ───────────────────────────

/**
 * উন্নত টেক্সট টুল (MS Word-এর Paragraph ডায়ালগ + Font → Advanced-এর সমতুল্য):
 *  - শব্দের ফাঁক (word-spacing)
 *  - অক্ষরের ফাঁক (letter-spacing) — প্যারা জুড়ে + নির্বাচিত লেখায় (textStyle)
 *  - প্যারার আগে/পরে ফাঁক (margin-top/bottom)
 *  - প্রথম-লাইন ইনডেন্ট (text-indent) + বাম/ডান ইনডেন্ট (padding-left/right)
 *  - প্যারা পটভূমি রং (shading → background-color)
 *
 * সবগুলো paragraph/heading-এ গ্লোবাল অ্যাট্রিবিউট → ইনলাইন স্টাইল হিসেবে সেভ হয়,
 * তাই HTML/DOCX/প্রিন্ট/ফরমা — সব আউটপুটে স্বয়ংক্রিয়ভাবে একই চেহারা আসে।
 * একাধিক অ্যাট্রিবিউটের style আউটপুট TipTap-এর mergeAttributes জুড়ে দেয়।
 */

/** কার্সর/সিলেকশনের সব paragraph + heading ব্লকে একসাথে অ্যাট্রিবিউট বসাই */
function updateBothBlocks(commands: CommandProps['commands'], attrs: Record<string, unknown>): boolean {
  commands.updateAttributes('paragraph', attrs);
  commands.updateAttributes('heading', attrs);
  return true;
}

/** CSS দৈর্ঘ্য স্ট্রিং থেকে সংখ্যা (px/em/pt) — না বোঝা গেলে null */
function cssLen(raw: unknown): number | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const v = parseFloat(raw);
  return Number.isFinite(v) ? v : null;
}

/** ইনডেন্ট em-ভ্যালু স্ট্রিং হিসেবে — ০ বা নেগেটিভ হলে null (অ্যাট্রিবিউট মুছে যায়) */
function indentVal(em: number): string | null {
  const rounded = Math.round(em * 100) / 100;
  return rounded > 0 ? `${rounded}em` : null;
}

export const AdvancedTypography = Extension.create({
  name: 'advancedTypography',

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          wordSpacing: {
            default: null,
            parseHTML: (el) => el.style.wordSpacing || null,
            renderHTML: (attrs) => {
              const v = (attrs as { wordSpacing?: string | null }).wordSpacing;
              return v ? { style: `word-spacing: ${v}` } : {};
            },
          },
          letterSpacing: {
            default: null,
            parseHTML: (el) => el.style.letterSpacing || null,
            renderHTML: (attrs) => {
              const v = (attrs as { letterSpacing?: string | null }).letterSpacing;
              return v ? { style: `letter-spacing: ${v}` } : {};
            },
          },
          spaceBefore: {
            default: null,
            parseHTML: (el) => el.style.marginTop || null,
            renderHTML: (attrs) => {
              const v = (attrs as { spaceBefore?: string | null }).spaceBefore;
              return v ? { style: `margin-top: ${v}` } : {};
            },
          },
          spaceAfter: {
            default: null,
            parseHTML: (el) => el.style.marginBottom || null,
            renderHTML: (attrs) => {
              const v = (attrs as { spaceAfter?: string | null }).spaceAfter;
              return v ? { style: `margin-bottom: ${v}` } : {};
            },
          },
          firstLineIndent: {
            default: null,
            parseHTML: (el) => el.style.textIndent || null,
            renderHTML: (attrs) => {
              const v = (attrs as { firstLineIndent?: string | null }).firstLineIndent;
              return v ? { style: `text-indent: ${v}` } : {};
            },
          },
          indentLeft: {
            default: null,
            parseHTML: (el) => el.style.paddingLeft || null,
            renderHTML: (attrs) => {
              const v = (attrs as { indentLeft?: string | null }).indentLeft;
              return v ? { style: `padding-left: ${v}` } : {};
            },
          },
          indentRight: {
            default: null,
            parseHTML: (el) => el.style.paddingRight || null,
            renderHTML: (attrs) => {
              const v = (attrs as { indentRight?: string | null }).indentRight;
              return v ? { style: `padding-right: ${v}` } : {};
            },
          },
          shading: {
            default: null,
            parseHTML: (el) => el.style.backgroundColor || null,
            renderHTML: (attrs) => {
              const v = (attrs as { shading?: string | null }).shading;
              return v ? { style: `background-color: ${v}` } : {};
            },
          },
        },
      },
      {
        // নির্বাচিত লেখার অক্ষর-ফাঁক — FontSize-এর মতো textStyle মার্ক অ্যাট্রিবিউট
        types: ['textStyle'],
        attributes: {
          charSpacing: {
            default: null,
            parseHTML: (el) => el.style.letterSpacing || null,
            renderHTML: (attrs) => {
              const v = (attrs as { charSpacing?: string | null }).charSpacing;
              return v ? { style: `letter-spacing: ${v}` } : {};
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setWordSpacing: (value: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { wordSpacing: value }),
      unsetWordSpacing: () => ({ commands }: CommandProps) => updateBothBlocks(commands, { wordSpacing: null }),
      setLetterSpacing: (value: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { letterSpacing: value }),
      unsetLetterSpacing: () => ({ commands }: CommandProps) => updateBothBlocks(commands, { letterSpacing: null }),
      setSpaceBefore: (value: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { spaceBefore: value }),
      unsetSpaceBefore: () => ({ commands }: CommandProps) => updateBothBlocks(commands, { spaceBefore: null }),
      setSpaceAfter: (value: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { spaceAfter: value }),
      unsetSpaceAfter: () => ({ commands }: CommandProps) => updateBothBlocks(commands, { spaceAfter: null }),
      setFirstLineIndent: (value: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { firstLineIndent: value }),
      unsetFirstLineIndent: () => ({ commands }: CommandProps) => updateBothBlocks(commands, { firstLineIndent: null }),
      setIndentLeft: (value: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { indentLeft: value }),
      setIndentRight: (value: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { indentRight: value }),
      unsetIndents: () => ({ commands }: CommandProps) => updateBothBlocks(commands, { indentLeft: null, indentRight: null, firstLineIndent: null }),

      /** ইনডেন্ট বাড়ানো/কমানো — Word-এর Indent বাটনের মতো ০.৫em ধাপে, ০–৮em সীমায় */
      adjustIndent:
        (which: 'indentLeft' | 'indentRight', deltaEm: number) =>
        ({ commands, state }: CommandProps) => {
          const cur = cssLen(state.selection.$from.parent.attrs[which]) ?? 0;
          const next = Math.min(8, Math.max(0, cur + deltaEm));
          return updateBothBlocks(commands, { [which]: indentVal(next) });
        },

      setParagraphShading: (color: string) => ({ commands }: CommandProps) => updateBothBlocks(commands, { shading: color }),
      unsetParagraphShading: () => ({ commands }: CommandProps) => updateBothBlocks(commands, { shading: null }),

      /** প্যারার সব উন্নত ফরম্যাট একসাথে মুছুন (লাইন-হাইট/অ্যালাইন/টেক্সট অপরিবর্তিত) */
      resetParagraphFormatting: () => ({ commands }: CommandProps) => {
        const cleared = {
          wordSpacing: null, letterSpacing: null, spaceBefore: null, spaceAfter: null,
          firstLineIndent: null, indentLeft: null, indentRight: null, shading: null,
        };
        commands.updateAttributes('paragraph', cleared);
        commands.updateAttributes('heading', cleared);
        commands.resetAttributes('textStyle', 'charSpacing');
        return true;
      },

      // নির্বাচিত লেখার অক্ষর-ফাঁক (textStyle মার্ক)
      // setMark ব্যবহার — updateAttributes দিয়ে করলে টেক্সটে আগে থেকে textStyle
      // মার্ক না থাকলে নীরব নো-অপ হত (FontSize-এর লুকানো বাগের মূল কারণ)।
      // setMark মার্ক না থাকলে তৈরি করে, থাকলে অ্যাট্রিবিউট মার্জ করে।
      setCharSpacing: (value: string) => ({ commands }: CommandProps) => commands.setMark('textStyle', { charSpacing: value }),
      unsetCharSpacing: () => ({ commands }: CommandProps) => commands.updateAttributes('textStyle', { charSpacing: null }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    advancedTypography: {
      setWordSpacing: (value: string) => ReturnType;
      unsetWordSpacing: () => ReturnType;
      setLetterSpacing: (value: string) => ReturnType;
      unsetLetterSpacing: () => ReturnType;
      setSpaceBefore: (value: string) => ReturnType;
      unsetSpaceBefore: () => ReturnType;
      setSpaceAfter: (value: string) => ReturnType;
      unsetSpaceAfter: () => ReturnType;
      setFirstLineIndent: (value: string) => ReturnType;
      unsetFirstLineIndent: () => ReturnType;
      setIndentLeft: (value: string) => ReturnType;
      setIndentRight: (value: string) => ReturnType;
      unsetIndents: () => ReturnType;
      adjustIndent: (which: 'indentLeft' | 'indentRight', deltaEm: number) => ReturnType;
      setParagraphShading: (color: string) => ReturnType;
      unsetParagraphShading: () => ReturnType;
      resetParagraphFormatting: () => ReturnType;
      setCharSpacing: (value: string) => ReturnType;
      unsetCharSpacing: () => ReturnType;
    };
  }
}

// ─────────────────────────── সব একসাথে ───────────────────────────

export const customExtensions = [CalloutBox, McqBlock, Footnote, FancyDivider, TocBlock, LineHeight, FontSize, AdvancedTypography];
