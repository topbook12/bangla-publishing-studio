/**
 * হাতে-আঁকা চিত্র স্টুডিও (Sketch Pad) — হাতে এঁকে সরাসরি পাতায় বসানো
 * ──────────────────────────────────────────────────────────────────────
 * কেউ কেউ চিত্র হাতে এঁকে সুন্দর পান — কোথাও ছবি না পাওয়া গেলে নিজের
 * আইডিয়া হাতে এঁকে প্রকাশ করা যায়। ক্যানভাসে কলম/মুছ/রেখা/তীর/আয়ত/
 * বৃত্ত এঁকে "বসান" চাপলেই ছবিটা ডকুমেন্টে চলে আসে — পরে সাইজ/অবস্থান
 * সব নিয়ন্ত্রণ করা যায় (আসল ছবি-নোড, প্রিন্ট/PDF/DOCX সব পাইপলাইনে চলে)।
 *
 * সাথে "AI চিত্র" — বর্ণনা লিখলে পরীক্ষা/বই-উপযোগী লাইন-আর্ট ছবি বানিয়ে
 * দেয় (ব্যাকএন্ড /api/ai/image রুট — প্ল্যাটফর্মের বিল্ট-ইন SDK)।
 *
 * অফলাইন-প্রথম: ক্যানভাস-আঁকা সম্পূর্ণ লোকাল; কেবল AI চিত্রে নেট লাগে।
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Circle, Eraser, Loader2, Minus, MousePointer2, Pencil, Redo2, Sparkles,
  Square, Undo2, ArrowRight, Wand2, ImagePlus, Trash2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUiStore } from '@/lib/ui-store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { runCommand } from '@/components/ribbon/ribbon-shell';
import { toast } from 'sonner';

/** ক্যানভাসের লজিক্যাল মাপ — CSS-এ অনুপাত ধরে রেখে ১০০% প্রস্থে দেখানো হয় */
const CW = 1000;
const CH = 640;
/** সন্নিবেশ-সীমা — এডিটরের ছবি-সীমার সাথে মিলিয়ে ৪MB */
const MAX_INSERT_CHARS = 4 * 1024 * 1024;

type SketchTool = 'pen' | 'eraser' | 'line' | 'arrow' | 'rect' | 'ellipse';
type SketchColor = '#111111' | '#6b7280' | '#b91c1c';

const TOOLS: Array<{ id: SketchTool; key: string; icon: typeof Pencil }> = [
  { id: 'pen', key: 'sketch.tool.pen', icon: Pencil },
  { id: 'eraser', key: 'sketch.tool.eraser', icon: Eraser },
  { id: 'line', key: 'sketch.tool.line', icon: Minus },
  { id: 'arrow', key: 'sketch.tool.arrow', icon: ArrowRight },
  { id: 'rect', key: 'sketch.tool.rect', icon: Square },
  { id: 'ellipse', key: 'sketch.tool.ellipse', icon: Circle },
];

const COLORS: Array<{ id: SketchColor; label: string }> = [
  { id: '#111111', label: 'কালো' },
  { id: '#6b7280', label: 'ধূসর' },
  { id: '#b91c1c', label: 'লাল' },
];

const WIDTHS = [2, 4, 8];

const AI_SIZES: Array<{ id: string; key: string }> = [
  { id: '1024x1024', key: 'sketch.ai.size.square' },
  { id: '1344x768', key: 'sketch.ai.size.landscape' },
  { id: '768x1344', key: 'sketch.ai.size.portrait' },
];

export function SketchPadDialog() {
  const open = useUiStore((s) => s.openDialog === 'sketchPad');
  const close = useUiStore((s) => s.close);
  const tt = useT();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [tool, setTool] = useState<SketchTool>('pen');
  const [color, setColor] = useState<SketchColor>('#111111');
  const [width, setWidth] = useState(4);

  /** আঁকা-অবস্থা — রি-রেন্ডার ছাড়াই ref-এ বহন */
  const drawingRef = useRef(false);
  const startRef = useRef({ x: 0, y: 0 });
  const lastRef = useRef({ x: 0, y: 0 });
  /** আকৃতি-টুলের ঝলকানি-প্রিভিউ — স্ট্রোক-শুরুর স্ন্যাপশট ফেরত এঁকে দেখানো হয় */
  const snapRef = useRef<ImageData | null>(null);

  /** আনডু/রিডু — dataURL স্ন্যাপশটের স্তূপ (সর্বোচ্চ ৩০) */
  const undoRef = useRef<string[]>([]);
  const redoRef = useRef<string[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // AI চিত্র
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiSize, setAiSize] = useState('1024x1024');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiImg, setAiImg] = useState<string | null>(null);

  const syncFlags = useCallback(() => {
    setCanUndo(undoRef.current.length > 0);
    setCanRedo(redoRef.current.length > 0);
  }, []);

  /** ক্যানভাস সাদা করে নতুন শীট */
  const resetCanvas = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, CW, CH);
    undoRef.current = [];
    redoRef.current = [];
    syncFlags();
  }, [syncFlags]);

  // ডায়ালগ খুললেই ফ্রেশ শীট; AI-প্রিভিউও পরিষ্কার
  // রাডিক্স ডায়ালগ-কনটেন্ট এক ফ্রেম পরে মাউন্ট হতে পারে — ক্যানভাস না পেলে পরের ফ্রেমে আবার
  useEffect(() => {
    if (!open) return;
    setAiImg(null);
    setAiBusy(false);
    let tries = 0;
    let raf = 0;
    const tryReset = () => {
      if (canvasRef.current) {
        resetCanvas();
        return;
      }
      if (tries++ < 10) raf = window.requestAnimationFrame(tryReset);
    };
    tryReset();
    return () => window.cancelAnimationFrame(raf);
  }, [open, resetCanvas]);

  const pushUndo = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    try {
      undoRef.current.push(cv.toDataURL('image/png'));
      if (undoRef.current.length > 30) undoRef.current.shift();
      redoRef.current = [];
      syncFlags();
    } catch { /* কোটা */ }
  }, [syncFlags]);

  const applySnapshot = useCallback((dataUrl: string) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, CW, CH);
      ctx.drawImage(img, 0, 0, CW, CH);
    };
    img.src = dataUrl;
  }, []);

  const undo = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || undoRef.current.length === 0) return;
    const cur = cv.toDataURL('image/png');
    const prev = undoRef.current.pop() as string;
    redoRef.current.push(cur);
    applySnapshot(prev);
    syncFlags();
  }, [applySnapshot, syncFlags]);

  const redo = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv || redoRef.current.length === 0) return;
    const cur = cv.toDataURL('image/png');
    const next = redoRef.current.pop() as string;
    undoRef.current.push(cur);
    applySnapshot(next);
    syncFlags();
  }, [applySnapshot, syncFlags]);

  /** পয়েন্টার-অবস্থান → ক্যানভাস-স্থানাঙ্ক (CSS-স্কেল সামলে) */
  const canvasPos = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } => {
    const cv = canvasRef.current as HTMLCanvasElement;
    const rect = cv.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(CW, ((e.clientX - rect.left) / rect.width) * CW)),
      y: Math.max(0, Math.min(CH, ((e.clientY - rect.top) / rect.height) * CH)),
    };
  };

  const strokeStyleSetup = (ctx: CanvasRenderingContext2D) => {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = tool === 'eraser' ? width * 3.5 : width;
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    const head = Math.max(10, width * 3.5);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
    ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
    ctx.closePath();
    ctx.fillStyle = ctx.strokeStyle as string;
    ctx.fill();
  };

  const drawShape = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    strokeStyleSetup(ctx);
    if (tool === 'line') {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (tool === 'arrow') {
      drawArrow(ctx, x1, y1, x2, y2);
    } else if (tool === 'rect') {
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    } else if (tool === 'ellipse') {
      ctx.beginPath();
      ctx.ellipse((x1 + x2) / 2, (y1 + y2) / 2, Math.abs(x2 - x1) / 2, Math.abs(y2 - y1) / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    cv.setPointerCapture(e.pointerId);
    const p = canvasPos(e);
    pushUndo();
    drawingRef.current = true;
    startRef.current = p;
    lastRef.current = p;
    strokeStyleSetup(ctx);
    if (tool === 'pen' || tool === 'eraser') {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      // এক-ট্যাপেও দাগ বসে
      ctx.lineTo(p.x + 0.1, p.y + 0.1);
      ctx.stroke();
    } else {
      snapRef.current = ctx.getImageData(0, 0, CW, CH);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    const cv = canvasRef.current;
    const ctx = cv?.getContext('2d');
    if (!cv || !ctx) return;
    const p = canvasPos(e);
    if (tool === 'pen' || tool === 'eraser') {
      strokeStyleSetup(ctx);
      ctx.beginPath();
      ctx.moveTo(lastRef.current.x, lastRef.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      lastRef.current = p;
      return;
    }
    // আকৃতি-টুল — স্ন্যাপশট ফেরত এঁকে নতুন প্রিভিউ
    if (snapRef.current) ctx.putImageData(snapRef.current, 0, 0);
    drawShape(ctx, startRef.current.x, startRef.current.y, p.x, p.y);
  };

  const endDrawing = () => {
    drawingRef.current = false;
    snapRef.current = null;
  };

  /** ক্যানভাসের ছবি সরাসরি কারেন্ট-অবস্থানে বসানো */
  const insertCanvasImage = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const dataUrl = cv.toDataURL('image/png');
    insertDataUrl(dataUrl);
  };

  const insertDataUrl = (dataUrl: string) => {
    if (dataUrl.length > MAX_INSERT_CHARS) {
      toast.error(tt('sketch.toast.big'));
      return;
    }
    const ok = runCommand((ed) => ed.chain().focus().setImage({ src: dataUrl, alt: 'sketch' }).run());
    if (ok) {
      toast.success(tt('sketch.toast.inserted'));
      close();
    }
  };

  /** AI চিত্র — বর্ণনা → লাইন-আর্ট ছবি (ব্যাকএন্ড রুট) */
  const generateAi = async () => {
    if (aiBusy) return;
    const p = aiPrompt.trim();
    if (!p) {
      toast.info(tt('sketch.err.noPrompt'));
      return;
    }
    setAiBusy(true);
    setAiImg(null);
    try {
      const res = await fetch('/api/ai/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: p, size: aiSize }),
      });
      const data = (await res.json()) as { ok?: boolean; dataUrl?: string; error?: string; hintKey?: string };
      if (res.ok && data.ok && data.dataUrl) {
        setAiImg(data.dataUrl);
        toast.success(tt('sketch.ai.done'));
      } else {
        toast.error(tt(data.hintKey ?? 'sketch.err.fail'));
      }
    } catch {
      toast.error(tt('sketch.err.net'));
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sketch-dialog max-h-[94dvh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader className="ai-set-head">
          <DialogTitle className="flex items-center gap-2">
            <span className="ai-head-tile" aria-hidden="true"><Pencil size={16} /></span>
            {tt('sketch.title')}
          </DialogTitle>
          <DialogDescription>{tt('sketch.desc')}</DialogDescription>
        </DialogHeader>

        {/* টুলবার */}
        <div className="flex flex-wrap items-center gap-2" role="toolbar" aria-label={tt('sketch.title')}>
          <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={tt('sketch.tools')}>
            {TOOLS.map((t) => (
              <button
                key={t.id} type="button" role="radio" aria-checked={tool === t.id}
                title={tt(t.key)}
                className={cn(
                  'inline-flex h-9 items-center gap-1.5 rounded-md border px-2.5 text-xs transition-colors',
                  tool === t.id ? 'border-primary bg-primary/10 font-medium' : 'bg-background hover:bg-muted',
                )}
                onClick={() => setTool(t.id)}
              >
                <t.icon size={14} aria-hidden="true" />
                <span className="hidden sm:inline">{tt(t.key)}</span>
              </button>
            ))}
          </div>
          <span className="h-6 w-px bg-border" aria-hidden="true" />
          {/* রং — প্রিন্ট-ফার্স্ট: কালো/ধূসর/লাল */}
          <div className="flex gap-1" role="radiogroup" aria-label={tt('sketch.colors')}>
            {COLORS.map((c) => (
              <button
                key={c.id} type="button" role="radio" aria-checked={color === c.id}
                title={c.label} aria-label={c.label}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-transform',
                  color === c.id ? 'scale-110 border-foreground' : 'border-transparent hover:scale-105',
                )}
                style={{ backgroundColor: c.id }}
                onClick={() => setColor(c.id)}
              />
            ))}
          </div>
          <span className="h-6 w-px bg-border" aria-hidden="true" />
          {/* মোটা/চিকন */}
          <div className="flex gap-1" role="radiogroup" aria-label={tt('sketch.widths')}>
            {WIDTHS.map((w) => (
              <button
                key={w} type="button" role="radio" aria-checked={width === w}
                className={cn(
                  'inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors',
                  width === w ? 'border-primary bg-primary/10' : 'bg-background hover:bg-muted',
                )}
                onClick={() => setWidth(w)}
              >
                <span
                  aria-hidden="true"
                  className="rounded-full bg-foreground"
                  style={{ width: Math.min(w + 2, 12), height: Math.min(w + 2, 12) }}
                />
              </button>
            ))}
          </div>
          <span className="h-6 w-px bg-border" aria-hidden="true" />
          <Button size="sm" variant="outline" onClick={undo} disabled={!canUndo} title={tt('sketch.undo')}>
            <Undo2 size={14} aria-hidden="true" /> {tt('sketch.undo')}
          </Button>
          <Button size="sm" variant="outline" onClick={redo} disabled={!canRedo} title={tt('sketch.redo')}>
            <Redo2 size={14} aria-hidden="true" />
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={resetCanvas} title={tt('sketch.clear')}>
            <Trash2 size={14} aria-hidden="true" /> {tt('sketch.clear')}
          </Button>
        </div>

        {/* ক্যানভাস */}
        <div className="rounded-lg border bg-white">
          <canvas
            ref={canvasRef}
            width={CW}
            height={CH}
            className={cn('block w-full touch-none rounded-lg', tool === 'pen' || tool === 'eraser' ? 'cursor-crosshair' : 'cursor-crosshair')}
            aria-label={tt('sketch.canvas')}
            role="img"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrawing}
            onPointerLeave={endDrawing}
            onPointerCancel={endDrawing}
          />
        </div>

        {/* বসানো */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="qp-hint">{tt('sketch.hint')}</p>
          <Button onClick={insertCanvasImage}>
            <ImagePlus size={14} aria-hidden="true" /> {tt('sketch.insert')}
          </Button>
        </div>

        {/* AI চিত্র */}
        <div className="rounded-lg border bg-muted/30 p-3">
          <p className="ai-field-label mb-2 flex items-center gap-1.5">
            <Sparkles size={13} aria-hidden="true" /> {tt('sketch.ai.title')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder={tt('sketch.ai.ph')}
              disabled={aiBusy}
              onKeyDown={(e) => { if (e.key === 'Enter') void generateAi(); }}
              className="flex-1"
            />
            <div className="flex gap-1" role="radiogroup" aria-label={tt('sketch.ai.size')}>
              {AI_SIZES.map((s) => (
                <button
                  key={s.id} type="button" role="radio" aria-checked={aiSize === s.id}
                  className={cn(
                    'inline-flex h-9 items-center rounded-md border px-2.5 text-xs transition-colors',
                    aiSize === s.id ? 'border-primary bg-primary/10 font-medium' : 'bg-background hover:bg-muted',
                  )}
                  onClick={() => setAiSize(s.id)}
                  disabled={aiBusy}
                >
                  {tt(s.key)}
                </button>
              ))}
            </div>
            <Button onClick={() => void generateAi()} disabled={aiBusy}>
              {aiBusy
                ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> {tt('sketch.ai.generating')}</>
                : <><Wand2 size={14} aria-hidden="true" /> {tt('sketch.ai.btn')}</>}
            </Button>
          </div>
          <p className="qp-hint mt-2">{tt('sketch.ai.hint')}</p>
          {aiImg ? (
            <div className="mt-3 flex flex-col gap-2 rounded-lg border bg-background p-3 sm:flex-row sm:items-center">
              <img src={aiImg} alt={tt('sketch.ai.preview')} className="h-40 w-auto rounded-md border object-contain" />
              <div className="flex flex-col gap-2">
                <Button size="sm" onClick={() => insertDataUrl(aiImg)}>
                  <ImagePlus size={13} aria-hidden="true" /> {tt('sketch.ai.insert')}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAiImg(null)}>
                  <MousePointer2 size={13} aria-hidden="true" /> {tt('sketch.ai.dismiss')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
