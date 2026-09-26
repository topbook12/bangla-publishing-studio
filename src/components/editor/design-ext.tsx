/**
 * ডিজাইন এক্সটেনশন — ডকুমেন্ট আইকন (ইনলাইন SVG) ও ডিজাইন বক্স (ভিতরে লেখা যায়)।
 *
 * স্টোরেজ কনট্রাক্ট (src/lib/nodes-html.ts এর সাথে মিলিয়ে দেখুন):
 *  - docIcon:   <span class="doc-icon" data-icon data-size data-color style> [inline svg] </span>
 *  - designBox: <div class="doc-textbox" data-variant data-border data-fill data-bstyle data-bwidth> [content] </div>
 */

'use client';

import { Node, mergeAttributes, type CommandProps } from '@tiptap/core';
import type { DOMOutputSpec } from 'prosemirror-model';
import { TextSelection, Selection } from 'prosemirror-state';
import { ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent, type NodeViewProps } from '@tiptap/react';
import type { CSSProperties } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ICON_BY_NAME,
  getIconSvgMarkup,
} from '@/lib/icon-catalog';
import {
  docBoxInlineStyle,
  DOC_BOX_LABELS,
  DOC_BOX_STYLES,
  type DocBoxAttrs,
  type DocBoxVariant,
} from '@/lib/nodes-html';
import {
  SHAPE_BY_ID,
  SHAPE_DEFS,
  SHAPE_CATEGORIES,
  cssTextToStyle,
  fullShapeAttrs,
  shapeStyleText,
  type ShapeFrameAttrs,
} from '@/lib/shape-catalog';

// ─────────────────────────── আইকন ───────────────────────────

/** SVG মার্কআপ → ProseMirror DOMOutputSpec (রিকার্সিভ) */
function svgToSpec(el: Element): DOMOutputSpec | null {
  const attrs: Record<string, string> = {};
  for (const a of Array.from(el.attributes)) {
    // width/height CSS দিয়ে নিয়ন্ত্রিত হয়
    if (a.name === 'width' || a.name === 'height') attrs[a.name] = '100%';
    else attrs[a.name] = a.value;
  }
  const kids = Array.from(el.children).map((c) => svgToSpec(c)).filter(Boolean) as DOMOutputSpec[];
  return kids.length ? [el.tagName.toLowerCase(), attrs, ...kids] : [el.tagName.toLowerCase(), attrs];
}

function iconSpec(name: string): DOMOutputSpec | null {
  try {
    const markup = getIconSvgMarkup(name);
    const dom = new DOMParser().parseFromString(`<div id="w">${markup}</div>`, 'text/html');
    const svg = dom.querySelector('#w svg');
    if (!svg) return null;
    return svgToSpec(svg);
  } catch {
    return null;
  }
}

function docIconStyle(size: number, color: string): string {
  return [
    'display:inline-flex',
    'line-height:0',
    `width:${size}px`,
    `height:${size}px`,
    color ? `color:${color}` : 'color:inherit',
    'vertical-align:-0.16em',
  ].join(';');
}

function DocIconNodeView({ node, updateAttributes, deleteNode, selected }: NodeViewProps) {
  const name = (node.attrs.name as string) ?? 'Star';
  const size = Number(node.attrs.size ?? 22);
  const color = (node.attrs.color as string) ?? '';
  const entry = ICON_BY_NAME.get(name);
  const Icon = entry?.Icon;

  const clampSize = (n: number) => Math.max(10, Math.min(120, n));

  return (
    <NodeViewWrapper
      as="span"
      className={cn('doc-icon-wrap', selected && 'doc-icon-selected')}
      data-icon={name}
    >
      {Icon ? (
        <Icon size={size} color={color || undefined} strokeWidth={2} aria-label={name} role="img" />
      ) : (
        <span
          className="doc-icon"
          style={{ width: size, height: size, color: color || 'inherit', display: 'inline-flex', lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: getIconSvgMarkup(name) }}
        />
      )}
      {selected ? (
        <span className="doc-icon-tools no-print" contentEditable={false}>
          <button
            type="button"
            className="doc-tool-btn"
            onClick={() => updateAttributes({ size: clampSize(size - 4) })}
            aria-label="ছোট করুন"
            title="ছোট করুন"
          >
            <Minus size={12} />
          </button>
          <span className="doc-tool-size">{size}px</span>
          <button
            type="button"
            className="doc-tool-btn"
            onClick={() => updateAttributes({ size: clampSize(size + 4) })}
            aria-label="বড় করুন"
            title="বড় করুন"
          >
            <Plus size={12} />
          </button>
          <input
            type="color"
            className="doc-tool-color"
            value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#334155'}
            onChange={(e) => updateAttributes({ color: e.target.value })}
            title="আইকনের রং"
            aria-label="আইকনের রং"
          />
          <button
            type="button"
            className="doc-tool-btn doc-tool-danger"
            onClick={deleteNode}
            aria-label="আইকন মুছুন"
            title="আইকন মুছুন"
          >
            <Trash2 size={12} />
          </button>
        </span>
      ) : null}
    </NodeViewWrapper>
  );
}

export const DocIcon = Node.create({
  name: 'docIcon',
  group: 'inline',
  inline: true,
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      name: {
        default: 'Star',
        parseHTML: (el) => el.getAttribute('data-icon') ?? 'Star',
        renderHTML: (attrs) => ({ 'data-icon': attrs.name ?? 'Star' }),
      },
      size: {
        default: 22,
        parseHTML: (el) => Number(el.getAttribute('data-size') ?? 22) || 22,
        renderHTML: (attrs) => ({ 'data-size': String(attrs.size ?? 22) }),
      },
      color: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-color') ?? '',
        renderHTML: (attrs) => ({ 'data-color': attrs.color ?? '' }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span.doc-icon' }];
  },

  renderHTML({ node }) {
    const name = (node.attrs.name as string) ?? 'Star';
    const size = Number(node.attrs.size ?? 22) || 22;
    const color = (node.attrs.color as string) ?? '';
    const spec = iconSpec(name);
    const fallback: DOMOutputSpec = [
      'svg', { viewBox: '0 0 24 24', fill: 'currentColor', width: '100%', height: '100%' },
      ['circle', { cx: '12', cy: '12', r: '7' }],
    ];
    return [
      'span',
      mergeAttributes(
        {
          class: 'doc-icon',
          'data-icon': name,
          'data-size': String(size),
          'data-color': color,
          style: docIconStyle(size, color),
        },
      ),
      spec ?? fallback,
    ] as DOMOutputSpec;
  },

  addNodeView() {
    return ReactNodeViewRenderer(DocIconNodeView);
  },

  addCommands() {
    return {
      insertDocIcon:
        (attrs: { name: string; size?: number; color?: string }) =>
        ({ commands }: CommandProps) =>
          commands.insertContent({
            type: this.name,
            attrs: { name: attrs.name, size: attrs.size ?? 22, color: attrs.color ?? '' },
          }),
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    docIcon: {
      insertDocIcon: (attrs: { name: string; size?: number; color?: string }) => ReturnType;
    };
  }
}

// ─────────────────────────── ডিজাইন বক্স ───────────────────────────

function DesignBoxNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const attrs = node.attrs as unknown as DocBoxAttrs;
  const style = docBoxInlineStyle(attrs) as CSSProperties;
  const variant = attrs.variant ?? 'rounded';

  return (
    <NodeViewWrapper
      as="div"
      className="doc-textbox"
      style={style}
      data-variant={variant}
    >
      <div className="doc-textbox-tools no-print" contentEditable={false}>
        <select
          className="doc-tool-select"
          value={variant}
          onChange={(e) => updateAttributes({ variant: e.target.value as DocBoxVariant })}
          title="বক্সের আকৃতি"
          aria-label="বক্সের আকৃতি"
        >
          {(Object.keys(DOC_BOX_LABELS) as DocBoxVariant[]).map((v) => (
            <option key={v} value={v}>{DOC_BOX_LABELS[v]}</option>
          ))}
        </select>
        <select
          className="doc-tool-select"
          value={(attrs.bstyle ?? 'solid') as string}
          onChange={(e) => updateAttributes({ bstyle: e.target.value })}
          title="বর্ডারের ধরন"
          aria-label="বর্ডারের ধরন"
        >
          {DOC_BOX_STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        <input
          type="color"
          className="doc-tool-color"
          value={/^#[0-9a-fA-F]{6}$/.test(attrs.border ?? '') ? attrs.border : '#475569'}
          onChange={(e) => updateAttributes({ border: e.target.value })}
          title="বর্ডারের রং"
          aria-label="বর্ডারের রং"
        />
        <input
          type="color"
          className="doc-tool-color"
          value={/^#[0-9a-fA-F]{6}$/.test(attrs.fill ?? '') ? attrs.fill : '#f8fafc'}
          onChange={(e) => updateAttributes({ fill: e.target.value })}
          title="ভেতরের রং"
          aria-label="ভেতরের রং"
        />
        <button
          type="button"
          className="doc-tool-btn"
          onClick={() => updateAttributes({ fill: 'transparent' })}
          title="ভেতরের রং মুছুন"
          aria-label="ভেতরের রং মুছুন"
        >
          <Minus size={12} />
        </button>
        <button
          type="button"
          className="doc-tool-btn"
          onClick={() => updateAttributes({ bwidth: Math.max(1, Number(attrs.bwidth ?? 2) - 1) })}
          title="বর্ডার পাতলা"
          aria-label="বর্ডার পাতলা"
        >
          −
        </button>
        <span className="doc-tool-size">{Number(attrs.bwidth ?? 2)}</span>
        <button
          type="button"
          className="doc-tool-btn"
          onClick={() => updateAttributes({ bwidth: Math.min(12, Number(attrs.bwidth ?? 2) + 1) })}
          title="বর্ডার মোটা"
          aria-label="বর্ডার মোটা"
        >
          +
        </button>
        <button
          type="button"
          className="doc-tool-btn doc-tool-danger"
          onClick={deleteNode}
          title="বক্স মুছুন"
          aria-label="বক্স মুছুন"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <NodeViewContent className="doc-textbox-content" />
    </NodeViewWrapper>
  );
}

export const DesignBox = Node.create({
  name: 'designBox',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'rounded',
        parseHTML: (el) => el.getAttribute('data-variant') ?? 'rounded',
        renderHTML: (attrs) => ({ 'data-variant': attrs.variant ?? 'rounded' }),
      },
      border: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-border') ?? null,
        renderHTML: (attrs) => ({ 'data-border': attrs.border ?? '' }),
      },
      fill: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-fill') ?? null,
        renderHTML: (attrs) => ({ 'data-fill': attrs.fill ?? '' }),
      },
      bstyle: {
        default: null,
        parseHTML: (el) => el.getAttribute('data-bstyle') ?? null,
        renderHTML: (attrs) => ({ 'data-bstyle': attrs.bstyle ?? '' }),
      },
      bwidth: {
        default: null,
        parseHTML: (el) => Number(el.getAttribute('data-bwidth') ?? 0) || null,
        renderHTML: (attrs) => ({ 'data-bwidth': attrs.bwidth == null ? '' : String(attrs.bwidth) }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div.doc-textbox' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { class: 'doc-textbox' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(DesignBoxNodeView);
  },

  addCommands() {
    return {
      insertDesignBox:
        (variant: DocBoxVariant, overrides?: Partial<DocBoxAttrs>) =>
        ({ chain, state }: CommandProps) => {
          const pos = state.selection.from;
          return chain()
            .insertContentAt(pos, {
              type: this.name,
              attrs: { variant, ...(overrides ?? {}) },
              content: [{ type: 'paragraph' }],
            })
            .command(({ tr, dispatch }) => {
              // কার্সর বক্সের ভিতরের প্যারাগ্রাফে নিয়ে যাওয়া —
              // হেডিং/মাঝ-লেখার ভিতরে বসালেও যেন লেখা বক্সের ভিতরেই যায়।
              // নতুন বক্সটি pos-এর সবচেয়ে কাছে থাকে — সেটিই খুঁজি।
              if (dispatch) {
                let best = -1;
                tr.doc.descendants((node, p) => {
                  if (node.type.name === this.name) {
                    if (best === -1 || Math.abs(p - pos) < Math.abs(best - pos)) best = p;
                    return false;
                  }
                  return true;
                });
                if (best >= 0) {
                  tr.setSelection(TextSelection.create(tr.doc, best + 1));
                }
              }
              return true;
            })
            .run();
        },
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    designBox: {
      insertDesignBox: (variant: DocBoxVariant, overrides?: Partial<DocBoxAttrs>) => ReturnType;
    };
  }
}

// ─────────────────────────── আকৃতি ফ্রেম (Decorative Shapes) ───────────────────────────

/** SVG মার্কআপ → DOMOutputSpec[] (শুধু টপ-লেভেল svg এলিমেন্ট) */
function svgMarkupToSpecs(markup: string): DOMOutputSpec[] {
  try {
    const dom = new DOMParser().parseFromString(`<div id="w">${markup}</div>`, 'text/html');
    const out: DOMOutputSpec[] = [];
    for (const child of Array.from(dom.querySelector('#w')?.children ?? [])) {
      if (child.tagName.toLowerCase() === 'svg') {
        const spec = svgToSpec(child);
        if (spec) out.push(spec);
      }
    }
    return out;
  } catch {
    return [];
  }
}

function ShapeFrameNodeView({ node, updateAttributes, deleteNode }: NodeViewProps) {
  const a = node.attrs as unknown as ShapeFrameAttrs;
  const def = SHAPE_BY_ID.get(a.shape) ?? SHAPE_DEFS[0];
  const eff = fullShapeAttrs(def.id, a as Partial<ShapeFrameAttrs>);
  const shellStyle = { position: 'relative' as const, ...def.shell(eff) } as CSSProperties;
  const contentStyle = def.content(eff) as CSSProperties;

  return (
    <NodeViewWrapper
      as="div"
      className="doc-shape"
      style={shellStyle}
      data-shape={def.id}
    >
      {def.orns(eff).map((o) => (
        <span
          key={o.key}
          className="doc-shape-orn"
          contentEditable={false}
          style={cssTextToStyle(o.style) as CSSProperties}
          dangerouslySetInnerHTML={{ __html: o.svg }}
        />
      ))}
      <div className="doc-shape-tools no-print" contentEditable={false}>
        <select
          className="doc-tool-select"
          value={def.id}
          onChange={(e) => {
            const nextId = e.target.value;
            const nextDef = SHAPE_BY_ID.get(nextId);
            // ইউজার রং কাস্টমাইজ করেনি (পুরনো শেপের ডিফল্টই আছে) হলে
            // নতুন শেপের ডিফল্ট রংও নিয়ে নিই — প্রতিটি শেপ তার নিজের চেহারায় আসে
            if (nextDef) {
              const untouched =
                eff.fill === def.defaults.fill &&
                eff.orn === def.defaults.orn &&
                eff.tcolor === def.defaults.tcolor;
              if (untouched) {
                updateAttributes({
                  shape: nextId,
                  fill: nextDef.defaults.fill,
                  orn: nextDef.defaults.orn,
                  tcolor: nextDef.defaults.tcolor,
                });
                return;
              }
            }
            updateAttributes({ shape: nextId });
          }}
          title="আকৃতি বদলান"
          aria-label="আকৃতি বদলান"
        >
          {SHAPE_CATEGORIES.map((cat) => (
            <optgroup key={cat.id} label={cat.label}>
              {SHAPE_DEFS.filter((d) => d.cat === cat.id).map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <input
          type="color"
          className="doc-tool-color"
          value={/^#[0-9a-fA-F]{6}$/.test(eff.fill) ? eff.fill : '#334155'}
          onChange={(e) => updateAttributes({ fill: e.target.value })}
          title="মূল রং (পটভূমি/বর্ডার)"
          aria-label="মূল রং"
        />
        <input
          type="color"
          className="doc-tool-color"
          value={/^#[0-9a-fA-F]{6}$/.test(eff.orn) ? eff.orn : '#94a3b8'}
          onChange={(e) => updateAttributes({ orn: e.target.value })}
          title="অলংকারের রং"
          aria-label="অলংকারের রং"
        />
        <input
          type="color"
          className="doc-tool-color"
          value={/^#[0-9a-fA-F]{6}$/.test(eff.tcolor) ? eff.tcolor : '#0f172a'}
          onChange={(e) => updateAttributes({ tcolor: e.target.value })}
          title="লেখার রং"
          aria-label="লেখার রং"
        />
        <button
          type="button"
          className="doc-tool-btn doc-tool-danger"
          onClick={deleteNode}
          title="আকৃতি মুছুন"
          aria-label="আকৃতি মুছুন"
        >
          <Trash2 size={13} />
        </button>
      </div>
      <NodeViewContent className="doc-shape-content" style={contentStyle} />
    </NodeViewWrapper>
  );
}

export const ShapeFrame = Node.create({
  name: 'shapeFrame',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      shape: {
        default: 'banner-dark',
        parseHTML: (el) => el.getAttribute('data-shape') ?? 'banner-dark',
        renderHTML: (attrs) => ({ 'data-shape': attrs.shape ?? 'banner-dark' }),
      },
      fill: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-fill') ?? '',
        renderHTML: (attrs) => ({ 'data-fill': attrs.fill ?? '' }),
      },
      orn: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-orn') ?? '',
        renderHTML: (attrs) => ({ 'data-orn': attrs.orn ?? '' }),
      },
      tcolor: {
        default: '',
        parseHTML: (el) => el.getAttribute('data-tcolor') ?? '',
        renderHTML: (attrs) => ({ 'data-tcolor': attrs.tcolor ?? '' }),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'div.doc-shape' },
      // অলংকার span গুলো কনটেন্ট হিসেবে পার্স হওয়া থেকে আটকাও
      { tag: 'span[data-shape-orn]', ignore: true },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const a = node.attrs as unknown as ShapeFrameAttrs;
    const def = SHAPE_BY_ID.get(a.shape) ?? SHAPE_DEFS[0];
    const eff = fullShapeAttrs(def.id, a as Partial<ShapeFrameAttrs>);
    const shellAttrs = mergeAttributes(HTMLAttributes, {
      class: 'doc-shape',
      style: shapeStyleText({ position: 'relative', ...def.shell(eff) }),
    });
    const ornSpecs: DOMOutputSpec[] = def.orns(eff).map((o) => [
      'span',
      { 'data-shape-orn': o.key, style: o.style, contenteditable: 'false' },
      ...svgMarkupToSpecs(o.svg),
    ]);
    return [
      'div',
      shellAttrs,
      ...ornSpecs,
      ['div', { class: 'doc-shape-content', style: shapeStyleText(def.content(eff)) }, 0],
    ] as DOMOutputSpec;
  },

  addNodeView() {
    return ReactNodeViewRenderer(ShapeFrameNodeView);
  },

  addCommands() {
    return {
      insertShapeFrame:
        (shapeId: string, overrides?: Partial<ShapeFrameAttrs>) =>
        ({ chain, state }: CommandProps) => {
          const pos = state.selection.from;
          return chain()
            .insertContentAt(pos, {
              type: this.name,
              attrs: { ...fullShapeAttrs(shapeId, overrides) },
              content: [{ type: 'paragraph' }],
            })
            .command(({ tr, dispatch }) => {
              // কার্সর আকৃতির ভিতরের প্রথম প্যারাগ্রাফে — সরাসরি লেখা যায়
              if (dispatch) {
                let best = -1;
                tr.doc.descendants((n, p) => {
                  if (n.type.name === this.name) {
                    if (best === -1 || Math.abs(p - pos) < Math.abs(best - pos)) best = p;
                    return false;
                  }
                  return true;
                });
                if (best >= 0) {
                  tr.setSelection(Selection.near(tr.doc.resolve(best + 1), 1));
                }
              }
              return true;
            })
            .run();
        },
    };
  },
});

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    shapeFrame: {
      insertShapeFrame: (shapeId: string, overrides?: Partial<ShapeFrameAttrs>) => ReturnType;
    };
  }
}

// ─────────────────────────── সব একসাথে ───────────────────────────

export const designExtensions = [DocIcon, DesignBox, ShapeFrame];
