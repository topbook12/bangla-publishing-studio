/**
 * Table cell / header extensions with a backgroundColor + verticalAlign
 * attribute — used by the context menu and the floating table toolbar.
 *
 * Storage contract:
 *  - backgroundColor: data-bg="#fef3c7" + style="background-color: #fef3c7"
 *  - verticalAlign:   data-v-align="middle|bottom" + style="vertical-align: …"
 *                     (top is the default → no attr rendered)
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
      };
    },
  });
}

export const TableCellWithBg = withCellAttributes(TableCell);
export const TableHeaderWithBg = withCellAttributes(TableHeader);
