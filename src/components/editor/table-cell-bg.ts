/**
 * Table cell / header extensions with a backgroundColor + verticalAlign +
 * borderless attribute — used by the context menu, the floating table toolbar
 * and the প্রশ্নপত্র স্টুডিও authentic-paper generator.
 *
 * Storage contract:
 *  - backgroundColor: data-bg="#fef3c7" + style="background-color: #fef3c7"
 *  - verticalAlign:   data-v-align="middle|bottom" + style="vertical-align: …"
 *                     (top is the default → no attr rendered)
 *  - borderless:      data-border="none" + style="border: none"
 *                     (bordered is the default → no attr rendered)
 *                     আসল প্রশ্নপত্রের সময়/পূর্ণমান split-line ও ডান-নম্বর-কলাম
 *                     borderless সেলেই বসে — বক্স ছাড়া, কিন্তু টেবিল-স্কিমায়।
 */

import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

/** Shared palette for the context menu + floating table toolbar cell-bg pickers */
export const CELL_BG_COLORS = [
  'transparent', '#ffffff', '#fef3c7', '#dcfce7',
  '#dbeafe', '#ede9fe', '#fee2e2', '#f1f5f9',
];

const V_ALIGN_VALUES = new Set(['top', 'middle', 'bottom']);

function withCellAttributes(node: typeof TableCell | typeof TableHeader) {
  return node.extend({
    addAttributes() {
      return {
        ...this.parent?.(),

        backgroundColor: {
          default: null as string | null,
          parseHTML: (el) => {
            const attr = el.getAttribute('data-bg');
            if (attr) return attr;
            const style = (el as HTMLElement).style?.backgroundColor;
            return style || null;
          },
          renderHTML: (attrs) => {
            const color = attrs.backgroundColor as string | null;
            if (!color) return {};
            return { 'data-bg': color, style: `background-color: ${color}` };
          },
        },

        verticalAlign: {
          default: null as string | null,
          parseHTML: (el) => {
            const attr = el.getAttribute('data-v-align');
            if (attr && V_ALIGN_VALUES.has(attr)) return attr;
            const style = (el as HTMLElement).style?.verticalAlign;
            return style && V_ALIGN_VALUES.has(style) ? style : null;
          },
          renderHTML: (attrs) => {
            const v = attrs.verticalAlign as string | null;
            if (!v || v === 'top') return {};
            return { 'data-v-align': v, style: `vertical-align: ${v}` };
          },
        },

        borderless: {
          default: null as boolean | null,
          parseHTML: (el) => {
            if (el.getAttribute('data-border') === 'none') return true;
            const st = (el as HTMLElement).style;
            const none = st.borderTopStyle === 'none' && st.borderRightStyle === 'none'
              && st.borderBottomStyle === 'none' && st.borderLeftStyle === 'none';
            return none ? true : null;
          },
          renderHTML: (attrs) => {
            if (!attrs.borderless) return {};
            return { 'data-border': 'none', style: 'border: none' };
          },
        },
      };
    },
  });
}

export const TableCellWithBg = withCellAttributes(TableCell);
export const TableHeaderWithBg = withCellAttributes(TableHeader);
