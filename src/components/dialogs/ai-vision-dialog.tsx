/**
 * AI সহায়ক ডায়ালগ — প্রিমিয়াম ফিচার
 * ──────────────────────────────────
 *  ট্যাব ১ "ছবি → কনটেন্ট": ডায়াগ্রাম/স্ক্রিনশট/স্ক্যান আপলোড (ক্লিক,
 *    ড্র্যাগ-ড্রপ বা Ctrl+V পেস্ট) → AI ছবি দেখে বোঝে → লেখকের নির্দেশ
 *    অনুযায়ী বইয়ের কনটেন্ট (শিরোনাম/প্যারা/তালিকা/টেবিল/কলআউট) →
 *    প্রিভিউ → এক ক্লিকে বইয়ে সন্নিবেশ।
 *  ট্যাব ২ "AI লেখক": নির্দেশ দিলে AI বইয়ের উপযোগী লেখা তৈরি করে।
 *
 * BYOK: নিজের API Key (localStorage) — না থাকলে সেটআপ প্যানেল + সীমিত ডেমো।
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck, BookPlus, CircleAlert, Image as ImageIcon, ListChecks,
  Loader2, PenLine, ScanEye, Sparkles, Trash2, Type, Wand2, X,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import type { AiVisionTab } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import { useAiStore, aiConfiguredSelector } from '@/lib/ai-store';
import { analyzeImage, generateBookText, prepareImageFile, AI_VISION_SYSTEM } from '@/lib/ai-client';
import type { PreparedImage } from '@/lib/ai-client';
import { blocksToHtml } from '@/lib/ai-content';
import type { AiBlock, AiResult } from '@/lib/ai-content';
import { rawProviderLine } from '@/lib/ai-assistant';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Phase = 'idle' | 'working' | 'done' | 'error';
type ErrorState = { hintKey: string; detail?: string; raw?: string };

/** ব্লক প্রিভিউ আইকন */
const BLOCK_ICON: Record<AiBlock['type'], typeof Type> = {
  heading: Type,
  paragraph: Type,
  bullets: ListChecks,
  numbered: ListChecks,
  table: ListChecks,
  callout: Sparkles,
  quote: Type,
  code: Type,
};

/** ব্লক প্রিভিউ লেবেল কি */
const BLOCK_LABEL: Record<AiBlock['type'], string> = {
  heading: 'ai.block.heading',
  paragraph: 'ai.block.paragraph',
  bullets: 'ai.block.bullets',
  numbered: 'ai.block.numbered',
  table: 'ai.block.table',
  callout: 'ai.block.callout',
  quote: 'ai.block.quote',
  code: 'ai.block.code',
};

/** এক-ট্যাপ নির্দেশ চিপস — নির্দেশ-প্রম্পট তিন ভাষাতেই (label = বাটন, prompt = ইনপুটে বসে) */
const INSTRUCTION_CHIPS: Array<{ key: string; promptKey: string }> = [
  { key: 'ai.chip.transcribe', promptKey: 'ai.chip.transcribe.prompt' },
  { key: 'ai.chip.table', promptKey: 'ai.chip.table.prompt' },
  { key: 'ai.chip.bullets', promptKey: 'ai.chip.bullets.prompt' },
  { key: 'ai.chip.steps', promptKey: 'ai.chip.steps.prompt' },
  { key: 'ai.chip.explain', promptKey: 'ai.chip.explain.prompt' },
  { key: 'ai.chip.qa', promptKey: 'ai.chip.qa.prompt' },
];

export function AiVisionDialog() {
  const open = useUiStore((s) => s.openDialog === 'aiVision');
  const close = useUiStore((s) => s.close);
  const tab = useUiStore((s) => s.aiVisionTab);
  const openAi = useUiStore((s) => s.openAi);
  const openSettings = useUiStore((s) => s.open);
  const tt = useT();

  const configured = useAiStore(aiConfiguredSelector);

  const [image, setImage] = useState<PreparedImage | null>(null);
  const [instruction, setInstruction] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<ErrorState | null>(null);
  const [result, setResult] = useState<AiResult | null>(null);
  const [resultDemo, setResultDemo] = useState(false);
  const [excluded, setExcluded] = useState<Set<number>>(new Set());
  const [includeImage, setIncludeImage] = useState(true);
  const [includeTitle, setIncludeTitle] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const busy = phase === 'working';

  // ডায়ালগ বদল/বন্ধে স্টেট রিসেট নয় — শুধু ট্যাব বদলালে রেজাল্ট রাখি;
  // নতুন করে খুললে পুরনো রেজাল্ট দেখানো থাকে (ইউজার চাইলে রিসেট করবে)
  const resetAll = useCallback(() => {
    setImage(null);
    setPhase('idle');
    setError(null);
    setResult(null);
    setResultDemo(false);
    setExcluded(new Set());
  }, []);

  const acceptFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const prepared = await prepareImageFile(file);
      resetAll();
      setImage(prepared);
    } catch (err) {
      toast.error(tt((err as Error)?.message === 'IMAGE_TOO_LARGE' ? 'ai.err.size' : 'ai.err.read'));
    }
  }, [resetAll, tt]);

  // Ctrl+V পেস্ট — ডায়ালগ খোলা থাকলে স্ক্রিনশট সরাসরি বসে
  useEffect(() => {
    if (!open || tab !== 'vision') return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      void acceptFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, tab, acceptFile]);

  const run = async (demo: boolean) => {
    if (busy) return;
    if (tab === 'vision' && !image) return;
    if (!instruction.trim() && tab === 'text') {
      // লেখা ট্যাবে নির্দেশ আবশ্যক — নীরব ফেরত নয়, বোঝাই
      toast.info(tt('ai.err.instruction'));
      return;
    }
    setPhase('working');
    setError(null);
    setResultDemo(false);
    setExcluded(new Set());

    const res = tab === 'vision' && image
      ? await analyzeImage({ imageDataUrl: image.dataUrl, instruction, demo })
      : await generateBookText({ instruction, demo });

    if (res.ok) {
      setResult(res.result);
      setResultDemo(!!res.demo);
      setPhase('done');
    } else {
      // সেন্টিনেল কোড raw হিসেবে নয়; প্রোভাইডারের আসল বার্তা আলাদা লাইনে
      setError({
        hintKey: res.hintKey ?? 'ai.err.title',
        detail: res.detail,
        raw: rawProviderLine(res.error, tt('ai.err.raw')) || undefined,
      });
      setPhase('error');
    }
  };

  const insertIntoBook = () => {
    if (!result) return;
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (!ed || ed.isDestroyed) {
      toast.error(tt('ai.noEditor'));
      return;
    }
    const blocks = result.blocks.filter((_, i) => !excluded.has(i));
    const html = blocksToHtml(
      { ...result, blocks },
      {
        includeImage: tab === 'vision' && includeImage,
        imageDataUrl: image?.dataUrl ?? null,
        caption: result.caption ?? null,
        includeTitle,
      },
    );
    if (!html.trim()) {
      toast.info(tt('ai.err.nothing'));
      return;
    }
    ed.chain().focus().insertContent(html).run();
    toast.success(tt('ai.inserted'));
    close();
  };

  const toggleBlock = (i: number) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const previewHtml = useMemo(() => {
    if (!result) return '';
    const blocks = result.blocks.filter((_, i) => !excluded.has(i));
    return blocksToHtml(
      { ...result, blocks },
      {
        includeImage: tab === 'vision' && includeImage,
        imageDataUrl: image?.dataUrl ?? null,
        caption: result.caption ?? null,
        includeTitle,
      },
    );
  }, [result, excluded, includeImage, includeTitle, tab, image]);

  const chipRow = (
    <div className="ai-chips" role="group" aria-label={tt('ai.instruction.label')}>
      {INSTRUCTION_CHIPS.map((chip) => (
        <button
          key={chip.key}
          type="button"
          className="ai-chip"
          onClick={() => setInstruction(tt(chip.promptKey))}
          disabled={busy}
        >
          {tt(chip.key)}
        </button>
      ))}
    </div>
  );

  const tabBar = (
    <div className="ai-tabs" role="tablist" aria-label={tt('ai.vision.title')}>
      {([
        { id: 'vision' as AiVisionTab, icon: ScanEye, label: tt('ai.tab.vision') },
        { id: 'text' as AiVisionTab, icon: PenLine, label: tt('ai.tab.text') },
      ]).map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          aria-selected={tab === t.id}
          className={cn('ai-tab', tab === t.id && 'ai-tab-on')}
          onClick={() => openAi(t.id)}
        >
          <t.icon size={14} aria-hidden="true" /> {t.label}
        </button>
      ))}
    </div>
  );

  const setupPanel = (
    <div className="ai-setup" role="note">
      <p className="ai-setup-title"><Sparkles size={14} aria-hidden="true" /> {tt('ai.setup.title')}</p>
      <p className="ai-setup-desc">{tt('ai.setup.desc')}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="ai-save-btn" onClick={() => openSettings('aiSettings')}>
          {tt('ai.setup.open')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => void run(true)} disabled={busy}>
          {busy ? tt('ai.generating') : tt('ai.setup.demo')}
        </Button>
      </div>
      {resultDemo ? <p className="ai-demo-note">{tt('ai.demo.note')}</p> : null}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="ai-dialog max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="ai-set-head">
          <DialogTitle className="flex items-center gap-2">
            <span className="ai-head-tile" aria-hidden="true"><Wand2 size={16} /></span>
            {tt('ai.vision.title')}
            {resultDemo ? <span className="ai-demo-badge">{tt('ai.demo.badge')}</span> : null}
          </DialogTitle>
          <DialogDescription>{tt('ai.vision.desc')}</DialogDescription>
        </DialogHeader>

        {tabBar}

        {/* ─── ট্যাব: ছবি → কনটেন্ট ─── */}
        {tab === 'vision' ? (
          <section aria-label={tt('ai.tab.vision')}>
            {!image ? (
              <div
                className={cn('ai-drop', dragOver && 'ai-drop-over')}
                role="button"
                tabIndex={0}
                aria-label={tt('ai.drop.title')}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void acceptFile(file);
                }}
              >
                <ImageIcon size={26} aria-hidden="true" className="ai-drop-icon" />
                <p className="ai-drop-title">{tt('ai.drop.title')}</p>
                <p className="ai-drop-hint">{tt('ai.drop.hint')}</p>
              </div>
            ) : (
              <div className="ai-thumb-row">
                <img src={image.dataUrl} alt={image.name} className="ai-thumb" />
                <div className="ai-thumb-meta">
                  <p className="ai-thumb-name">{image.name}</p>
                  <p className="ai-thumb-dim">{image.width} × {image.height}</p>
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>{tt('ai.drop.change')}</Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700" onClick={resetAll} aria-label={tt('ai.drop.remove')}>
                      <Trash2 size={14} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void acceptFile(file);
                e.target.value = '';
              }}
            />
          </section>
        ) : null}

        {/* নির্দেশ — দুই ট্যাবেই */}
        <section aria-label={tt('ai.instruction.label')}>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="ai-field-label">{tt('ai.instruction.label')}</span>
            {result ? (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={resetAll}>
                <X size={12} aria-hidden="true" /> {tt('ai.reanalyze')}
              </Button>
            ) : null}
          </div>
          <Textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={tt('ai.instruction.ph')}
            className="ai-instruction min-h-[72px]"
            disabled={busy}
          />
          {chipRow}
        </section>

        {/* অ্যাকশন */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="ai-analyze-btn"
            disabled={busy || (tab === 'vision' ? !image : !instruction.trim())}
            onClick={() => void run(false)}
          >
            {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
            {busy
              ? (tab === 'vision' ? tt('ai.analyzing') : tt('ai.generating'))
              : (tab === 'vision' ? tt('ai.analyze') : tt('ai.generate'))}
          </Button>
          {busy ? <span className="ai-progress" role="status"><span /></span> : null}
          {!configured && !result ? <span className="ai-keyless-hint">{tt('ai.btn.addKey')} →</span> : null}
        </div>

        {/* ত্রুটি */}
        {phase === 'error' && error ? (
          <div className="ai-error" role="alert">
            <CircleAlert size={15} aria-hidden="true" />
            <div>
              <p className="ai-error-title">{tt('ai.err.title')}</p>
              <p>{tt(error.hintKey)}</p>
              {error.detail ? <p className="ai-error-detail">{error.detail}</p> : null}
              {error.raw ? <p className="ai-error-detail">{error.raw}</p> : null}
            </div>
            <Button size="sm" variant="outline" onClick={() => openSettings('aiSettings')}>{tt('ai.setup.open')}</Button>
          </div>
        ) : null}

        {/* সেটআপ প্যানেল (কি নেই + রেজাল্ট নেই) */}
        {!configured && phase !== 'error' && !result ? setupPanel : null}

        {/* রেজাল্ট প্রিভিউ */}
        {result ? (
          <section className="ai-result" aria-label={tt('ai.result.title')}>
            <div className="mb-2 flex items-center justify-between">
              <p className="ai-result-title">
                <BadgeCheck size={14} className="text-emerald-600" aria-hidden="true" />
                {tt('ai.result.title')}
                <span className="ai-result-count">{result.blocks.length} {tt('ai.result.blocks')}</span>
              </p>
              <label className="ai-check">
                <input type="checkbox" checked={includeTitle} onChange={(e) => setIncludeTitle(e.target.checked)} />
                {tt('ai.include.title')}
              </label>
            </div>

            <div className="ai-block-list max-h-72 overflow-y-auto">
              {result.blocks.map((b, i) => {
                const Icon = BLOCK_ICON[b.type] ?? Type;
                const off = excluded.has(i);
                return (
                  <label key={i} className={cn('ai-block', off && 'ai-block-off')}>
                    <input
                      type="checkbox"
                      checked={!off}
                      onChange={() => toggleBlock(i)}
                      aria-label={`${tt(BLOCK_LABEL[b.type])}: ${(b.text ?? b.items?.join(', ') ?? b.rows?.[0]?.join(', ') ?? '').slice(0, 60)}`}
                    />
                    <Icon size={13} aria-hidden="true" className="ai-block-icon" />
                    <span className="ai-block-body">
                      <span className="ai-block-kind">{tt(BLOCK_LABEL[b.type])}</span>
                      <span className="ai-block-text">
                        {b.type === 'table'
                          ? (b.rows ?? []).map((r) => r.join(' · ')).join(' / ').slice(0, 140)
                          : (b.text ?? b.items?.join(' • ') ?? '')}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>

            {tab === 'vision' && image ? (
              <label className="ai-check ai-check-img">
                <input type="checkbox" checked={includeImage} onChange={(e) => setIncludeImage(e.target.checked)} />
                {tt('ai.include.image')}
              </label>
            ) : null}

            {/* লাইভ HTML প্রিভিউ — বইয়ে যা বসবে */}
            <div className="ai-live-preview" aria-hidden="true">
              <p className="ai-live-preview-label">Preview</p>
              <div className="ai-live-preview-body" dangerouslySetInnerHTML={{ __html: previewHtml }} />
            </div>

            <div className="flex justify-end">
              <Button className="ai-insert-btn" onClick={insertIntoBook}>
                <BookPlus size={14} aria-hidden="true" /> {tt('ai.insert')}
              </Button>
            </div>
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
