/**
 * Image drag-resize overlay (Word-style).
 *
 * When the active page editor has a NodeSelection on an image, a fixed-position
 * box (portal) is drawn over the img with 4 corner + 4 edge handles:
 *  - corner drag  → keep aspect ratio
 *  - edge drag    → free width / height
 *  - live preview while dragging (direct style on the img), single
 *    updateAttributes commit on pointerup → one undo step
 *  - minimum 24px, maximum = page content width (no overflow beyond the column)
 *
 * Works with the per-page TipTap instances via editor-registry + the global
 * selection bump (useEditorStore.selectionVersion). Never prints.
 */

'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NodeSelection } from '@tiptap/pm/state';
import type { Editor } from '@tiptap/react';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import './media-edit.css';

type Dir = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLES: Dir[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
const MIN_PX = 24;

interface ResizeTarget {
  editor: Editor;
  pos: number;
  img: HTMLImageElement;
}

function resolveTarget(): ResizeTarget | null {
  const { activePageId } = useEditorStore.getState();
  const ed = activePageId ? getEditor(activePageId) : undefined;
  if (!ed || ed.isDestroyed) return null;
  const { selection } = ed.state;
  if (!(selection instanceof NodeSelection) || selection.node.type.name !== 'image') return null;
  const pos = selection.from;
  const dom = ed.view.nodeDOM(pos);
  const img =
    dom instanceof HTMLImageElement
      ? dom
      : dom instanceof HTMLElement
        ? dom.querySelector('img')
        : null;
  if (!img || !img.isConnected) return null;
  return { editor: ed, pos, img };
}

export function ImageResizeHost({ suppressed = false }: { suppressed?: boolean }) {
  const selectionVersion = useEditorStore((s) => s.selectionVersion);
  const activePageId = useEditorStore((s) => s.activePageId);
  // Render-phase derivation — recomputed only when selection/page/suppression changes
  const target = useMemo(
    () => (suppressed ? null : resolveTarget()),
    [selectionVersion, activePageId, suppressed],
  );
  const boxRef = useRef<HTMLDivElement>(null);
  const pendingRef = useRef<{ w: number; h: number } | null>(null);

  // Store natural size once (fallback — the image-ext onload plugin is primary)
  useEffect(() => {
    if (!target) return;
    const { editor, pos, img } = target;
    if (!img.complete || !img.naturalWidth) return;
    const node = editor.state.doc.nodeAt(pos);
    if (!node || node.attrs.naturalWidth) return;
    try {
      const tr = editor.state.tr.setNodeMarkup(pos, undefined, {
        ...node.attrs,
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
      });
      tr.setMeta('addToHistory', false);
      editor.view.dispatch(tr);
    } catch {
      /* ignore */
    }
  }, [target]);

  // Keep the overlay glued to the img (scroll / zoom / drag preview) — rAF loop
  useEffect(() => {
    if (!target) return;
    let raf = 0;
    const sync = () => {
      const el = boxRef.current;
      if (el) {
        const r = target.img.getBoundingClientRect();
        el.style.left = `${r.left}px`;
        el.style.top = `${r.top}px`;
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
      }
      raf = requestAnimationFrame(sync);
    };
    raf = requestAnimationFrame(sync);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  const onHandlePointerDown = useCallback(
    (e: React.PointerEvent, dir: Dir) => {
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();

      const { editor, pos, img } = target;
      const rect = img.getBoundingClientRect();
      const layoutW = img.offsetWidth || rect.width;
      const scale = rect.width > 0 && layoutW > 0 ? rect.width / layoutW : 1; // zoom factor
      const startW = layoutW || MIN_PX;
      const startH = img.offsetHeight || rect.height || MIN_PX;
      const pm = editor.view.dom as HTMLElement;
      const maxW = Math.max(MIN_PX + 1, Math.round(pm.clientWidth)); // content width cap
      const ratio = startW > 0 ? startH / startW : 1;
      const startX = e.clientX;
      const startY = e.clientY;
      pendingRef.current = null;
      document.body.classList.add('bwp-img-dragging');

      const move = (ev: PointerEvent) => {
        const dx = (ev.clientX - startX) / scale;
        const dy = (ev.clientY - startY) / scale;
        const corner = dir.length === 2;
        let w = startW;
        let h = startH;
        if (dir.includes('e')) w = startW + dx;
        if (dir.includes('w')) w = startW - dx;
        if (dir.includes('s')) h = startH + dy;
        if (dir.includes('n')) h = startH - dy;
        w = Math.round(Math.min(Math.max(w, MIN_PX), maxW));
        if (corner) h = w * ratio; // corner = lock aspect
        h = Math.round(Math.min(Math.max(h, MIN_PX), maxW * 12));
        img.style.width = `${w}px`;
        img.style.height = `${h}px`;
        pendingRef.current = { w, h };
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        document.body.classList.remove('bwp-img-dragging');
        const pending = pendingRef.current;
        pendingRef.current = null;
        // hand the visuals back to the attribute-driven inline style
        img.style.width = '';
        img.style.height = '';
        if (!pending) return;
        try {
          if (editor.isDestroyed) return;
          const node = editor.state.doc.nodeAt(pos);
          if (!node || node.type.name !== 'image') return;
          editor
            .chain()
            .setNodeSelection(pos)
            .updateAttributes('image', { width: pending.w, height: pending.h })
            .run();
        } catch {
          /* ignore */
        }
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    },
    [target],
  );

  if (!target) return null;

  return createPortal(
    <div ref={boxRef} className="bwp-img-resize-box no-print" aria-hidden="true">
      {HANDLES.map((dir) => (
        <button
          key={dir}
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          data-dir={dir}
          className="bwp-img-handle"
          onPointerDown={(e) => onHandlePointerDown(e, dir)}
        />
      ))}
    </div>,
    document.body,
  );
}
