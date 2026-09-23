/**
 * Extended TipTap Image node — precise size/position control.
 *
 * Storage contract (works with plain HTML storage + DOCX/HTML exporters):
 *  - width:       px number OR raw CSS string ("30%") → data-width + style width
 *                 (px values additionally render the HTML width attribute so
 *                 export-docx.ts picks the exact size up automatically)
 *  - height:      px number OR raw CSS string          → data-height + style height
 *  - textAlign:   'left' | 'center' | 'right'          → data-align + block margins
 *  - float:       'none' | 'left' | 'right'            → data-float + float + wrap margins
 *  - naturalWidth / naturalHeight: px numbers captured once from img.onload
 *                 → data-natural-w / data-natural-h (reset-to-natural support)
 *  - framed:      data-framed="true" → inline border style
 *
 * All visual layout styles are built in ONE place (imageLayoutStyle) by the
 * node's renderHTML so style precedence (float > align > size) is deterministic.
 */

import Image from '@tiptap/extension-image';
import { Plugin } from '@tiptap/pm/state';
import { mergeAttributes } from '@tiptap/core';

export type ImageAlign = 'left' | 'center' | 'right';
export type ImageFloat = 'none' | 'left' | 'right';
/** px number (precise) or raw CSS value string (legacy "30%" etc.) */
export type ImageSizeAttr = number | string | null;

interface ImageLayoutAttrs {
  width?: ImageSizeAttr;
  height?: ImageSizeAttr;
  textAlign?: ImageAlign | null;
  float?: ImageFloat | null;
  framed?: boolean;
}

function sizeCss(name: 'width' | 'height', v: ImageSizeAttr): string | null {
  if (v === null || v === undefined || v === '') return null;
  return typeof v === 'number' ? `${name}: ${v}px` : `${name}: ${v}`;
}

/** Single source of truth for the img inline style (screen = print = export). */
export function imageLayoutStyle(attrs: ImageLayoutAttrs): string {
  const parts: string[] = [];
  const w = sizeCss('width', attrs.width ?? null);
  if (w) parts.push(w);
  const h = sizeCss('height', attrs.height ?? null);
  if (h) parts.push(h);

  if (attrs.float === 'left') {
    parts.push('float: left', 'margin: 6px 14px 6px 0');
  } else if (attrs.float === 'right') {
    parts.push('float: right', 'margin: 6px 0 6px 14px');
  } else if (attrs.textAlign === 'center') {
    parts.push('margin-left: auto', 'margin-right: auto');
  } else if (attrs.textAlign === 'right') {
    parts.push('margin-left: auto', 'margin-right: 0');
  } else if (attrs.textAlign === 'left') {
    parts.push('margin-left: 0', 'margin-right: auto');
  }

  if (attrs.framed) {
    parts.push('border: 3px solid #94a3b8', 'padding: 3px', 'border-radius: 6px', 'box-sizing: border-box');
  }
  return parts.join('; ');
}

function parseSizeAttr(raw: string | null): ImageSizeAttr {
  if (!raw || !raw.trim()) return null;
  const t = raw.trim();
  if (/^\d+(\.\d+)?$/.test(t)) return Number(t);
  return t;
}

function parseStyleSize(el: HTMLElement, prop: 'width' | 'height'): ImageSizeAttr {
  const s = el.style?.[prop];
  if (!s || !s.trim()) return null;
  const px = Number.parseFloat(s);
  if (/px$/.test(s.trim()) && Number.isFinite(px)) return Math.round(px);
  return s.trim();
}

export const FramedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      width: {
        default: null as ImageSizeAttr,
        parseHTML: (el) => {
          const direct = parseSizeAttr(el.getAttribute('data-width') ?? el.getAttribute('width'));
          if (direct !== null) return direct;
          return parseStyleSize(el as HTMLElement, 'width');
        },
        renderHTML: (attrs) => {
          const w = attrs.width as ImageSizeAttr;
          if (w === null || w === undefined || w === '') return {};
          return {
            'data-width': String(w),
            // px values also get the presentational width attr — export-docx reads it
            ...(typeof w === 'number' ? { width: String(w) } : {}),
          };
        },
      },

      height: {
        default: null as ImageSizeAttr,
        parseHTML: (el) => {
          const direct = parseSizeAttr(el.getAttribute('data-height') ?? el.getAttribute('height'));
          if (direct !== null) return direct;
          return parseStyleSize(el as HTMLElement, 'height');
        },
        renderHTML: (attrs) => {
          const h = attrs.height as ImageSizeAttr;
          if (h === null || h === undefined || h === '') return {};
          return {
            'data-height': String(h),
            ...(typeof h === 'number' ? { height: String(h) } : {}),
          };
        },
      },

      naturalWidth: {
        default: null as number | null,
        parseHTML: (el) => {
          const n = Number(el.getAttribute('data-natural-w'));
          return Number.isFinite(n) && n > 0 ? n : null;
        },
        renderHTML: (attrs) => {
          const n = attrs.naturalWidth as number | null;
          return n && n > 0 ? { 'data-natural-w': String(n) } : {};
        },
      },

      naturalHeight: {
        default: null as number | null,
        parseHTML: (el) => {
          const n = Number(el.getAttribute('data-natural-h'));
          return Number.isFinite(n) && n > 0 ? n : null;
        },
        renderHTML: (attrs) => {
          const n = attrs.naturalHeight as number | null;
          return n && n > 0 ? { 'data-natural-h': String(n) } : {};
        },
      },

      textAlign: {
        default: null as ImageAlign | null,
        parseHTML: (el) => {
          const a = el.getAttribute('data-align');
          return a === 'left' || a === 'center' || a === 'right' ? a : null;
        },
        renderHTML: (attrs) => {
          const a = attrs.textAlign as ImageAlign | null;
          return a ? { 'data-align': a } : {};
        },
      },

      float: {
        default: 'none' as ImageFloat,
        parseHTML: (el) => {
          const f = el.getAttribute('data-float');
          if (f === 'left' || f === 'right') return f;
          const styleFloat = (el as HTMLElement).style?.float;
          if (styleFloat === 'left' || styleFloat === 'right') return styleFloat;
          return 'none';
        },
        renderHTML: (attrs) => {
          const f = attrs.float as ImageFloat;
          return f === 'left' || f === 'right' ? { 'data-float': f } : {};
        },
      },

      framed: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-framed') === 'true',
        renderHTML: (attrs) => (attrs.framed ? { 'data-framed': 'true' } : {}),
      },
    };
  },

  renderHTML({ node, HTMLAttributes }) {
    const style = imageLayoutStyle(node.attrs as ImageLayoutAttrs);
    return ['img', mergeAttributes(HTMLAttributes, style ? { style } : {})];
  },

  /**
   * Capture natural size exactly once per image (img.onload) so
   * "মূল সাইজে ফিরুন" (reset to natural) works everywhere.
   */
  addProseMirrorPlugins() {
    const imageName = this.name;
    return [
      new Plugin({
        view(view) {
          const dom = view.dom as HTMLElement;

          const record = (img: HTMLImageElement) => {
            if (!img.naturalWidth || !img.naturalHeight) return;
            let target: { pos: number; attrs: Record<string, unknown> } | null = null;
            view.state.doc.descendants((node, pos) => {
              if (target) return false;
              if (node.type.name === imageName && !node.attrs.naturalWidth) {
                const nodeDom = view.nodeDOM(pos);
                if (nodeDom === img || (nodeDom instanceof HTMLElement && nodeDom.contains(img))) {
                  target = { pos, attrs: { ...node.attrs } };
                  return false;
                }
              }
              return true;
            });
            const found = target as { pos: number; attrs: Record<string, unknown> } | null;
            if (!found) return;
            try {
              const tr = view.state.tr.setNodeMarkup(found.pos, undefined, {
                ...found.attrs,
                naturalWidth: img.naturalWidth,
                naturalHeight: img.naturalHeight,
              });
              tr.setMeta('addToHistory', false);
              view.dispatch(tr);
            } catch {
              /* view busy — next load/selection will retry */
            }
          };

          const onLoad = (e: Event) => {
            const t = e.target;
            if (t instanceof HTMLImageElement) record(t);
          };
          // 'load' does not bubble — capture listener on the editor root catches it
          dom.addEventListener('load', onLoad, true);
          // images already complete before the plugin mounted
          const timer = window.setTimeout(() => {
            dom.querySelectorAll('img').forEach((img) => {
              if (img.complete) record(img);
            });
          }, 150);

          return {
            destroy() {
              window.clearTimeout(timer);
              dom.removeEventListener('load', onLoad, true);
            },
          };
        },
      }),
    ];
  },
});
