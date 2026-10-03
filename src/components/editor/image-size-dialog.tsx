/**
 * ছবির সাইজ ও পজিশন ডায়ালগ — Word স্টাইলের precise image size/position control.
 *
 *  - প্রস্থ/উচ্চতা: px (canonical) ⇄ সেমি / মিমি / % (কনটেন্ট প্রস্থ) / পিক্সেল লাইভ কনভার্সন
 *  - অনুপাত লক (aspect lock) — ডিফল্ট চালু
 *  - অ্যালাইনমেন্ট (block margin) + টেক্সট র‍্যাপিং (float)
 *  - রিসেট: মূল সাইজ (natural) / কনটেন্টের প্রস্থে ফিট
 *  - Apply = একটি updateAttributes ট্রানজেকশন → এক ধাপের undo
 */

'use client';

import { useMemo, useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignCenter, AlignLeft, AlignRight, RotateCcw, Ruler,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useT, useFmtNum } from '@/lib/i18n';
import { imageLayoutStyle, type ImageAlign, type ImageFloat } from './image-ext';

export interface ImageDialogState {
  editor: Editor;
  pos: number;
  attrs: Record<string, unknown>;
}

type Unit = 'px' | 'cm' | 'mm' | '%';

// একক লেবেল — মডিউল-স্কোপে ডিকশনারি কী, রেন্ডারের সময় tt() দিয়ে রেজল্ভ হয়
const UNITS: Array<{ id: Unit; k: string; fb: string }> = [
  { id: 'cm', k: 'ws.imgunit.cm', fb: 'সেমি (cm)' },
  { id: 'mm', k: 'ws.imgunit.mm', fb: 'মিমি (mm)' },
  { id: '%', k: 'ws.imgunit.pct', fb: '% (কনটেন্ট প্রস্থ)' },
  { id: 'px', k: 'ws.imgunit.px', fb: 'পিক্সেল (px)' },
];

const PX_PER_CM = 96 / 2.54;
const PX_PER_MM = 96 / 25.4;
const DEFAULT_UNIT: Unit = 'px';

function toPx(v: number, unit: Unit, contentWidth: number): number {
  switch (unit) {
    case 'cm': return v * PX_PER_CM;
    case 'mm': return v * PX_PER_MM;
    case '%': return (v / 100) * contentWidth;
    default: return v;
  }
}

function fromPx(px: number, unit: Unit, contentWidth: number): number {
  switch (unit) {
    case 'cm': return px / PX_PER_CM;
    case 'mm': return px / PX_PER_MM;
    case '%': return contentWidth > 0 ? (px / contentWidth) * 100 : 0;
    default: return px;
  }
}

function attrToPx(v: unknown, contentWidth: number): number | null {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return v;
  if (typeof v === 'string' && v.trim()) {
    const t = v.trim();
    const num = Number.parseFloat(t);
    if (!Number.isFinite(num)) return null;
    if (t.endsWith('%')) return (num / 100) * contentWidth;
    if (t.endsWith('cm')) return num * PX_PER_CM;
    if (t.endsWith('mm')) return num * PX_PER_MM;
    return num;
  }
  return null;
}

function fmt(px: number | null, unit: Unit, contentWidth: number): string {
  if (px === null) return '';
  const v = fromPx(px, unit, contentWidth);
  return String(Math.round(v * 100) / 100);
}

const WRAP_OPTIONS: Array<{ id: ImageFloat; k: string; fb: string; hk: string; hfb: string }> = [
  { id: 'none', k: 'ws.wrap.inline', fb: 'লেখার সাথে ইনলাইন', hk: 'ws.wrap.inlineHint', hfb: 'ছবি নিজস্ব লাইনে থাকবে — টেক্সট মোড়াবে না' },
  { id: 'left', k: 'ws.wrap.left', fb: 'বামে ভাসমান (টেক্সট মোড়ে)', hk: 'ws.wrap.leftHint', hfb: 'ছবি বাঁ দিকে ভেসে থাকবে, লেখা পাশ দিয়ে মোড়াবে' },
  { id: 'right', k: 'ws.wrap.right', fb: 'ডানে ভাসমান', hk: 'ws.wrap.rightHint', hfb: 'ছবি ডান দিকে ভেসে থাকবে, লেখা পাশ দিয়ে মোড়াবে' },
];

export function ImageSizeDialog({ state, onClose }: { state: ImageDialogState; onClose: () => void }) {
  const tt = useT();
  const fn = useFmtNum();
  const { editor, pos, attrs } = state;

  // কনটেন্ট কলামের প্রস্থ (% একক ও "ফিট করুন"-এর ভিত্তি)
  const contentWidth = useMemo(() => {
    try {
      const pm = editor.view.dom as HTMLElement;
      return Math.max(1, Math.round(pm.clientWidth));
    } catch {
      return 600;
    }
  }, [editor]);

  const naturalW = typeof attrs.naturalWidth === 'number' ? attrs.naturalWidth : null;
  const naturalH = typeof attrs.naturalHeight === 'number' ? attrs.naturalHeight : null;

  const initialW = attrToPx(attrs.width, contentWidth) ?? naturalW ?? contentWidth;
  const initialH =
    attrToPx(attrs.height, contentWidth) ??
    (initialW > 0 && naturalW && naturalH ? Math.round((naturalH / naturalW) * initialW) : Math.round(initialW * 0.66));

  const ratio = initialW > 0 ? initialH / initialW : 1;

  const [unit, setUnit] = useState<Unit>(DEFAULT_UNIT);
  const [wPx, setWPx] = useState<number | null>(initialW);
  const [hPx, setHPx] = useState<number | null>(initialH);
  const [lock, setLock] = useState(true);
  const [align, setAlign] = useState<ImageAlign>(
    attrs.textAlign === 'center' || attrs.textAlign === 'right' || attrs.textAlign === 'left'
      ? attrs.textAlign
      : 'left',
  );
  const [float, setFloat] = useState<ImageFloat>(
    attrs.float === 'left' || attrs.float === 'right' ? attrs.float : 'none',
  );

  const setWidthFromInput = (raw: string) => {
    const v = Number.parseFloat(raw);
    if (!Number.isFinite(v) || v <= 0) {
      setWPx(null);
      return;
    }
    const px = toPx(v, unit, contentWidth);
    setWPx(px);
    if (lock) setHPx(px / ratio);
  };

  const setHeightFromInput = (raw: string) => {
    const v = Number.parseFloat(raw);
    if (!Number.isFinite(v) || v <= 0) {
      setHPx(null);
      return;
    }
    const px = toPx(v, unit, contentWidth);
    setHPx(px);
    if (lock) setWPx(px * (ratio !== 0 ? 1 / ratio : 1));
  };

  // px ক্যানোনিকাল মান অপরিবর্তিত থাকে — শুধু প্রদর্শিত একক বদলায় (লাইভ কনভার্সন)
  const chooseUnit = (u: Unit) => setUnit(u);

  const resetNatural = () => {
    if (!naturalW || !naturalH) return;
    setWPx(naturalW);
    setHPx(naturalH);
  };

  const fitContent = () => {
    setWPx(contentWidth);
    if (lock) setHPx(contentWidth * ratio);
  };

  const pickAlign = (a: ImageAlign) => {
    setAlign(a);
    setFloat('none');
  };

  const apply = () => {
    const patch: Record<string, unknown> = {
      textAlign: align,
      float,
      width: wPx !== null ? Math.round(wPx) : null,
      height: hPx !== null ? Math.round(hPx) : null,
    };
    try {
      editor
        .chain()
        .focus()
        .setNodeSelection(pos)
        .updateAttributes('image', patch)
        .run();
    } catch {
      /* ignore */
    }
    onClose();
  };

  const previewStyle = imageLayoutStyle({
    width: wPx !== null ? Math.round(wPx) : null,
    height: hPx !== null ? Math.round(hPx) : null,
    textAlign: align,
    float,
  });

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler size={16} aria-hidden="true" /> {tt('ws.img.title', 'Image size & position')}
          </DialogTitle>
          <DialogDescription>
            {tt('ws.img.desc', 'Set width/height, alignment and text wrapping. It prints at exactly the same size.')}
          </DialogDescription>
        </DialogHeader>

        {/* ── সাইজ ── */}
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1fr_150px] items-end gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="img-w" className="text-xs">{tt('ws.img.width', 'Width')}</Label>
              <Input
                id="img-w"
                type="number"
                min={0}
                step="any"
                value={fmt(wPx, unit, contentWidth)}
                onChange={(e) => setWidthFromInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="img-h" className="text-xs">{tt('ws.img.height', 'Height')}</Label>
              <Input
                id="img-h"
                type="number"
                min={0}
                step="any"
                value={fmt(hPx, unit, contentWidth)}
                onChange={(e) => setHeightFromInput(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{tt('ws.img.unit', 'Unit')}</Label>
              <Select value={unit} onValueChange={(v) => chooseUnit(v as Unit)}>
                <SelectTrigger aria-label={tt('ws.img.unit', 'Unit')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u.id} value={u.id}>{tt(u.k, u.fb)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Switch id="img-lock" checked={lock} onCheckedChange={setLock} />
              <Label htmlFor="img-lock" className="text-xs">{tt('ws.img.lock', 'Lock aspect ratio (width and height linked)')}</Label>
            </div>
            <span className="text-[11px] text-muted-foreground">
              {wPx !== null ? `≈ ${fn(Math.round(wPx))} px` : '—'}
              {unit !== 'px' && contentWidth ? ` ${tt('ws.img.contentWidth', '· content width {n} px').split('{n}').join(fn(contentWidth))}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={resetNatural} disabled={!naturalW}>
              <RotateCcw size={12} aria-hidden="true" /> {tt('ws.img.resetNatural', 'Reset to original size')}{naturalW ? ` (${fn(naturalW)}×${fn(naturalH ?? 0)})` : ''}
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={fitContent}>
              {tt('ws.img.fitContent', 'Fit to content width')}
            </Button>
          </div>
        </div>

        {/* ── পজিশন / অ্যালাইনমেন্ট ── */}
        <div className="space-y-2">
          <Label className="text-xs">{tt('ws.img.posLabel', 'Position / alignment')}{float !== 'none' ? ` ${tt('ws.img.posFloatNote', '(not applicable while floating)')}` : ''}</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { id: 'left', k: 'ws.align.left', fb: 'বামে', Icon: AlignLeft },
                { id: 'center', k: 'ws.align.center', fb: 'মাঝখানে', Icon: AlignCenter },
                { id: 'right', k: 'ws.align.right', fb: 'ডানে', Icon: AlignRight },
              ] as const
            ).map(({ id, k, fb, Icon }) => (
              <button
                key={id}
                type="button"
                disabled={float !== 'none'}
                onClick={() => pickAlign(id)}
                className={cn(
                  'flex items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-xs transition',
                  align === id && float === 'none'
                    ? 'border-primary bg-primary/10 font-medium text-foreground'
                    : 'border-border hover:border-primary/50',
                  float !== 'none' && 'opacity-40',
                )}
              >
                <Icon size={13} aria-hidden="true" /> {tt(k, fb)}
              </button>
            ))}
          </div>
        </div>

        {/* ── টেক্সট র‍্যাপিং ── */}
        <div className="space-y-2">
          <Label className="text-xs">{tt('ws.img.wrapLabel', 'Text wrapping')}</Label>
          <div className="space-y-1.5">
            {WRAP_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setFloat(opt.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition',
                  float === opt.id
                    ? 'border-primary bg-primary/10 font-medium text-foreground'
                    : 'border-border hover:border-primary/50',
                )}
              >
                <span
                  className={cn(
                    'inline-block h-3 w-3 shrink-0 rounded-full border',
                    float === opt.id ? 'border-primary bg-primary' : 'border-muted-foreground/50',
                  )}
                  aria-hidden="true"
                />
                {tt(opt.k, opt.fb)}
                <span className="ml-auto text-[10px] text-muted-foreground">{tt(opt.hk, opt.hfb)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* লাইভ প্রিভিউ (স্টাইল স্ট্রিং) */}
        <p className="truncate rounded bg-muted/60 px-2 py-1 font-mono text-[10px] text-muted-foreground" title={previewStyle}>
          style: {previewStyle || tt('ws.img.styleDefault', 'default')}
        </p>

        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>{tt('hdr.cancel', 'Cancel')}</Button>
          <Button type="button" size="sm" onClick={apply}>{tt('ws.img.save', 'Save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
