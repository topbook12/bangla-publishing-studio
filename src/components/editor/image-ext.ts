/**
 * Extended TipTap Image node — adds width (%), alignment (margin auto) and a
 * framed (border) attribute used by the MS Word-style context menu.
 *
 * Storage contract:
 *  - width:     data-width="30%" + style="width: 30%"
 *  - textAlign: data-align="center|right" + margin auto styles (left = default)
 *  - framed:    data-framed="true" + inline border style
 */

import Image from '@tiptap/extension-image';

export type ImageWidth = '30%' | '55%' | '80%' | '100%';

export const FramedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),

      width: {
        default: null as string | null,
        parseHTML: (el) => {
          const attr = el.getAttribute('data-width');
          if (attr) return attr;
          const style = (el as HTMLElement).style?.width;
          return style || null;
        },
        renderHTML: (attrs) => {
          const width = attrs.width as string | null;
          if (!width) return {};
          return { 'data-width': width, style: `width: ${width}` };
        },
      },

      textAlign: {
        default: null as string | null,
        parseHTML: (el) => {
          const attr = el.getAttribute('data-align');
          return attr === 'center' || attr === 'right' ? attr : null;
        },
        renderHTML: (attrs) => {
          const align = attrs.textAlign as string | null;
          if (align === 'center') {
            return { 'data-align': 'center', style: 'margin-left: auto; margin-right: auto' };
          }
          if (align === 'right') {
            return { 'data-align': 'right', style: 'margin-left: auto' };
          }
          return {};
        },
      },

      framed: {
        default: false,
        parseHTML: (el) => el.getAttribute('data-framed') === 'true',
        renderHTML: (attrs) => {
          if (!attrs.framed) return {};
          return {
            'data-framed': 'true',
            style: 'border: 3px solid #94a3b8; padding: 3px; border-radius: 6px; box-sizing: border-box',
          };
        },
      },
    };
  },
});
