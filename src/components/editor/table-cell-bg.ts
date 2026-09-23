/**
 * Table cell / header extensions with a backgroundColor attribute —
 * used by the context menu's "Cell Background" swatches.
 *
 * Storage contract: data-bg="#fef3c7" + style="background-color: #fef3c7"
 */

import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';

function withBackgroundColor(node: typeof TableCell | typeof TableHeader) {
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
      };
    },
  });
}

export const TableCellWithBg = withBackgroundColor(TableCell);
export const TableHeaderWithBg = withBackgroundColor(TableHeader);
