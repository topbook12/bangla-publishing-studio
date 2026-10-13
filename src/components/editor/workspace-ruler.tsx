/**
 * ওয়ার্কস্পেস স্কেল/রুলার — MS Word-ধাঁচের মাপের কাঠি
 *
 * - অনুভূমিক রুলার (WorkspaceHRule): ওয়ার্কস্পেসের একদম উপরে sticky — কাগজের
 *   প্রস্থ অনুযায়ী সেন্টিমিটার/ইঞ্চি টিক, মার্জিন-অঞ্চলের ছায়া এবং টেনে
 *   বাঁ/ডান মার্জিন বদলানোর হাতল।
 * - উল্লম্ব রুলার (PageVRule): প্রতি পাতার বাঁ পাশে — কাগজের উচ্চতা অনুযায়ী টিক
 *   এবং টেনে উপর/নিচের মার্জিন বদলানোর হাতল। স্ক্রিনে কাগজের বাঁ দিকে যথেষ্ট
 *   জায়গা থাকলেই দেখানো হয় (Workspace ResizeObserver-এ মাপা)।
 *
 * প্রিমিয়াম প্রযুক্তি-নোট:
 *  - রুলার zoomed `.workspace-inner`-এর ভেতরে থাকে — CSS zoom-ই টিক/লেবেল স্কেল
 *    করে, তাই মার্জিন-রেখা কাগজের সাথে পিক্সেল-পারফেক্ট বসে (কোনো আলাদা
 *    জ্যামিতি-হিসাব লাগে না)।
 *  - টিকগুলো repeating-linear-gradient (CSS mm ইউনিট = 96dpi px, আমাদের
 *    mmToPx-এর সমান) — টিক প্রতি DOM নোড শূন্য, শত-পাতার বইয়েও হালকা।
 *  - টানলে pointer capture ব্যবহার হয় — কার্সর রুলার ছেড়ে গেলেও টান চলতে থাকে।
 *  - `.no-print` + paper-page-এর বাইরে — প্রিন্ট/Farma ক্লোনে রুলার আসে না।
 */

'use client';

import { memo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { useEditorStore } from '@/lib/store';
import { getPageDimensionsMm, inchToPx, mmToPx, MM_PER_INCH } from '@/lib/paper';
import { useT, useFmtNum } from '@/lib/i18n';
import { useUiStore } from '@/lib/ui-store';

type HDragSide = 'left' | 'right';
type VDragSide = 'top' | 'bottom';

/** মার্জিনের ন্যূনতম মান ও কনটেন্ট-বক্সের ন্যূনতম প্রস্থ (ইঞ্চি) — Word-এর মতো সেফটি ক্ল্যাম্প */
const MIN_MARGIN_IN = 0.2;
const MIN_CONTENT_IN = 0.5;
/** টানলে ১/২০ ইঞ্চি ধাপে স্ন্যাপ — মসৃণ আর নির্ভুল দুটোই */
const SNAP_IN = 0.05;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** ইঞ্চি → চলতি এককের প্রদর্শন-মান (সেমি: দশমিক ১ ঘর, ইঞ্চি: ২ ঘর) */
function displayValue(inch: number, unit: 'cm' | 'in'): number {
  return unit === 'cm' ? Math.round(inch * 2.54 * 10) / 10 : Math.round(inch * 100) / 100;
}

/** এককের ছোট লেবেল */
function UnitChip() {
  const tt = useT();
  const unit = useUiStore((s) => s.rulerUnit);
  const setRulerUnit = useUiStore((s) => s.setRulerUnit);
  return (
    <button
      type="button"
      className="ws-ruler-unit"
      title={tt('ws.ruler.unit')}
      aria-label={tt('ws.ruler.unit')}
      onClick={() => setRulerUnit(unit === 'cm' ? 'in' : 'cm')}
    >
      {tt(unit === 'cm' ? 'ws.ruler.cm' : 'ws.ruler.inch')}
    </button>
  );
}

// ─── অনুভূমিক রুলার (sticky) ───────────────────────────────────────────

export function WorkspaceHRule() {
  const settings = useEditorStore((s) => s.settings);
  const unit = useUiStore((s) => s.rulerUnit);
  const tt = useT();
  const f = useFmtNum();
  const rulerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<HDragSide | null>(null);

  const { widthMm } = getPageDimensionsMm(settings.paperSize, settings.orientation, settings.customPaper);
  const widthIn = widthMm / MM_PER_INCH;
  const widthPx = mmToPx(widthMm);

  const m = settings.margins;
  const leftPx = m.left * 96;
  const rightPx = m.right * 96;

  // টিক-লেবেল — কাগজের প্রস্থে যতটা আঁটে (শেষ ২ মিমি/৬px বাদ; ডান প্রান্তে একক-চিপ বসে)
  const labels: Array<{ pos: number; n: number }> = [];
  if (unit === 'cm') {
    for (let mm = 10; mm <= widthMm - 2; mm += 10) labels.push({ pos: mmToPx(mm), n: mm / 10 });
  } else {
    for (let i = 1; inchToPx(i) <= widthPx - 6; i++) labels.push({ pos: inchToPx(i), n: i });
  }

  const startDrag = (side: HDragSide) => (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    rulerRef.current?.setPointerCapture(e.pointerId);
    setDrag(side);
  };

  const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const el = rulerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const inch = ((e.clientX - rect.left) / rect.width) * widthIn;
    const raw = Math.round(inch / SNAP_IN) * SNAP_IN;
    const cur = useEditorStore.getState().settings.margins;
    if (drag === 'left') {
      const hi = widthIn - cur.right - MIN_CONTENT_IN;
      if (hi <= MIN_MARGIN_IN) return;
      useEditorStore.getState().updateSettings({ margins: { ...cur, left: clamp(raw, MIN_MARGIN_IN, hi) } });
    } else {
      const hi = widthIn - cur.left - MIN_CONTENT_IN;
      if (hi <= MIN_MARGIN_IN) return;
      useEditorStore.getState().updateSettings({ margins: { ...cur, right: clamp(raw, MIN_MARGIN_IN, hi) } });
    }
  };

  const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    try {
      rulerRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // ক্যাপচার আগেই ছেড়ে গেলে চুপচাপ এগোনো
    }
    setDrag(null);
  };

  const handle = (side: HDragSide) => {
    const valueInch = side === 'left' ? m.left : m.right;
    return (
      <div
        className="ws-ruler-handle"
        role="separator"
        aria-orientation="vertical"
        aria-label={tt(side === 'left' ? 'ws.ruler.left' : 'ws.ruler.right')}
        title={`${tt(side === 'left' ? 'ws.ruler.left' : 'ws.ruler.right')} — ${tt('ws.ruler.dragTip')}`}
        style={side === 'left' ? { left: leftPx } : { right: rightPx }}
        onPointerDown={startDrag(side)}
      >
        {drag === side ? (
          <span className="ws-ruler-badge" aria-live="polite">
            {f(displayValue(valueInch, unit))} {tt(unit === 'cm' ? 'ws.ruler.cm' : 'ws.ruler.inch')}
          </span>
        ) : null}
      </div>
    );
  };

  return (
    <div
      ref={rulerRef}
      className="ws-ruler-h no-print"
      data-unit={unit}
      data-hdrag={drag ?? undefined}
      style={{ width: widthPx }}
      role="group"
      aria-label={tt('ws.ruler.aria')}
      onPointerMove={onDragMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="ws-ruler-ticks" aria-hidden="true" />
      <div className="ws-ruler-zone" data-side="left" aria-hidden="true" style={{ left: 0, width: leftPx }} />
      <div className="ws-ruler-zone" data-side="right" aria-hidden="true" style={{ right: 0, width: rightPx }} />
      {labels.map((l) => (
        <span key={`${l.n}`} className="ws-ruler-label" aria-hidden="true" style={{ left: l.pos }}>
          {f(l.n)}
        </span>
      ))}
      {handle('left')}
      {handle('right')}
      <UnitChip />
    </div>
  );
}

// ─── উল্লম্ব রুলার (প্রতি পাতায়) ───────────────────────────────────────

interface PageVRuleProps {
  index: number;
  visible: boolean;
}

/**
 * memo — settings স্টোর-সাবস্ক্রিপশন থেকে আসে, তাই comparator-এ শুধু props;
 * পাতার HTML বদলালেও (pages অ্যারে ক্লোন) রুলার রি-রেন্ডার হয় না।
 */
export const PageVRule = memo(
  function PageVRule({ index, visible }: PageVRuleProps) {
    const settings = useEditorStore((s) => s.settings);
    const unit = useUiStore((s) => s.rulerUnit);
    const tt = useT();
    const f = useFmtNum();
    const rulerRef = useRef<HTMLDivElement>(null);
    const [drag, setDrag] = useState<VDragSide | null>(null);

    if (!visible) return null;

    const { heightMm } = getPageDimensionsMm(settings.paperSize, settings.orientation, settings.customPaper);
    const heightIn = heightMm / MM_PER_INCH;
    const heightPx = mmToPx(heightMm);

    const m = settings.margins;
    const topPx = m.top * 96;
    const bottomPx = m.bottom * 96;

    const labels: Array<{ pos: number; n: number }> = [];
    if (unit === 'cm') {
      for (let mm = 10; mm <= heightMm - 2; mm += 10) labels.push({ pos: mmToPx(mm), n: mm / 10 });
    } else {
      for (let i = 1; inchToPx(i) <= heightPx - 6; i++) labels.push({ pos: inchToPx(i), n: i });
    }

    const startDrag = (side: VDragSide) => (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      rulerRef.current?.setPointerCapture(e.pointerId);
      setDrag(side);
    };

    const onDragMove = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag) return;
      const el = rulerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const inch = ((e.clientY - rect.top) / rect.height) * heightIn;
      const raw = Math.round(inch / SNAP_IN) * SNAP_IN;
      const cur = useEditorStore.getState().settings.margins;
      if (drag === 'top') {
        const hi = heightIn - cur.bottom - MIN_CONTENT_IN;
        if (hi <= MIN_MARGIN_IN) return;
        useEditorStore.getState().updateSettings({ margins: { ...cur, top: clamp(raw, MIN_MARGIN_IN, hi) } });
      } else {
        const hi = heightIn - cur.top - MIN_CONTENT_IN;
        if (hi <= MIN_MARGIN_IN) return;
        useEditorStore.getState().updateSettings({ margins: { ...cur, bottom: clamp(raw, MIN_MARGIN_IN, hi) } });
      }
    };

    const endDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!drag) return;
      try {
        rulerRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // ক্যাপচার আগেই ছেড়ে গেলে চুপচাপ এগোনো
      }
      setDrag(null);
    };

    const handle = (side: VDragSide) => {
      const valueInch = side === 'top' ? m.top : m.bottom;
      return (
        <div
          className="ws-ruler-handle"
          role="separator"
          aria-orientation="horizontal"
          aria-label={tt(side === 'top' ? 'ws.ruler.top' : 'ws.ruler.bottom')}
          title={`${tt(side === 'top' ? 'ws.ruler.top' : 'ws.ruler.bottom')} — ${tt('ws.ruler.dragTip')}`}
          style={side === 'top' ? { top: topPx } : { bottom: bottomPx }}
          onPointerDown={startDrag(side)}
        >
          {drag === side ? (
            <span className="ws-ruler-badge" aria-live="polite">
              {f(displayValue(valueInch, unit))} {tt(unit === 'cm' ? 'ws.ruler.cm' : 'ws.ruler.inch')}
            </span>
          ) : null}
        </div>
      );
    };

    return (
      <div
        ref={rulerRef}
        className="ws-ruler-v no-print"
        data-page-vrule={index}
        data-unit={unit}
        data-vdrag={drag ?? undefined}
        style={{ height: heightPx }}
        role="group"
        aria-label={tt('ws.ruler.aria')}
        onPointerMove={onDragMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="ws-ruler-ticks" aria-hidden="true" />
        <div className="ws-ruler-zone" data-side="top" aria-hidden="true" style={{ top: 0, height: topPx }} />
        <div className="ws-ruler-zone" data-side="bottom" aria-hidden="true" style={{ bottom: 0, height: bottomPx }} />
        {labels.map((l) => (
          <span key={`${l.n}`} className="ws-ruler-label" aria-hidden="true" style={{ top: l.pos }}>
            {f(l.n)}
          </span>
        ))}
        {handle('top')}
        {handle('bottom')}
      </div>
    );
  },
  (prev, next) => prev.index === next.index && prev.visible === next.visible,
);
