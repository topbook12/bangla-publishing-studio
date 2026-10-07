/**
 * AI বাবল — সিলেকশনে ভাসমান ✦ AI টুল (Notion AI / Word Copilot-ধাঁচ)
 * ─────────────────────────────────────────────────────────────────
 *  - লেখা সিলেক্ট করলেই সিলেকশনের উপরে গোল্ডেন ✦ AI পিল ফুটে ওঠে
 *  - পিলে ক্লিক → অ্যাকশন প্যানেল: উন্নত/ব্যাকরণ/অনুবাদ/টেবিল/ব্যাখ্যা +
 *    নিজের নির্দেশ + ছবি আপলোড (ভিশন) → ফলাফল প্রিভিউ → প্রতিস্থাপন/সন্নিবেশ
 *  - কনটেক্সট-মেনু থেকেও একই প্যানেল খোলে (ai-bubble-store রিকোয়েস্ট)
 *  - Escape / বাইরে ক্লিক / স্ক্রলে বন্ধ — কনটেক্সট-মেনুর মতোই আচরণ
 */

'use client';

import {
  useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import {
  BookPlus, CircleAlert, FileText, GraduationCap, Image as ImageIcon, ImagePlus, Languages,
  Lightbulb, List, ListChecks, Loader2, Maximize2, MessageSquare, Minimize2, PenLine,
  RefreshCw, Replace, ScanEye, Sparkles, SpellCheck, Table2, TextCursorInput, Wand2, X, type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getEditor } from '@/lib/editor-registry';
import { useUiStore } from '@/lib/ui-store';
import { useAiStore, aiConfiguredSelector } from '@/lib/ai-store';
import { useAiBubbleStore, openAiBubble } from '@/lib/ai-bubble-store';
import type { AiBubbleRequest } from '@/lib/ai-bubble-store';
import {
  SELECTION_MODES, runSelectionAi, markdownToHtml, pageToMarkdown, tableRowsToMarkdown, rawProviderLine,
} from '@/lib/ai-assistant';
import { PAGE_MD_CAP } from '@/lib/ai-assistant';
import type { SelectionModeDef } from '@/lib/ai-assistant';
import { prepareImageFile } from '@/lib/ai-client';
import type { PreparedImage } from '@/lib/ai-client';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

type Phase = 'idle' | 'working' | 'done' | 'error';

interface Captured {
  editor: Editor;
  /** সিলেকশন রেঞ্জ (null হলে কার্সারে সন্নিবেশ) */
  from: number | null;
  to: number | null;
}

/** মোড → আইকন */
const MODE_ICON: Record<string, LucideIcon> = {
  improve: Wand2,
  grammar: SpellCheck,
  'translate-en': Languages,
  'translate-bn': Languages,
  'translate-hi': Languages,
  shorten: Minimize2,
  expand: Maximize2,
  simplify: Lightbulb,
  formal: GraduationCap,
  bullets: List,
  'make-table': Table2,
  explain: MessageSquare,
  verify: ListChecks,
  continue: PenLine,
  custom: Sparkles,
  'image-explain': ScanEye,
  'table-edit': Table2,
};

/** টেবিল-এডিট মোডের সিন্থেটিক ডেফ — সিলেকশনের বদলে টেবিল প্রেক্ষাপট ব্যবহার হয় */
const TABLE_EDIT_DEF: SelectionModeDef = {
  id: 'table-edit',
  labelKey: 'ai.sel.tableEdit',
  tipKey: 'ai.sel.tableEdit.tip',
  kind: 'replace',
  buildPrompt: (_s, custom) => custom || '',
};

const IMAGE_EXPLAIN_DEF: SelectionModeDef = {
  id: 'image-explain',
  labelKey: 'ai.sel.imageExplain',
  tipKey: 'ai.sel.imageExplain.tip',
  kind: 'insert',
  buildPrompt: (_s, custom) =>
    custom || 'এই ছবিটি মনোযোগ দিয়ে দেখে বইয়ের পাঠকের উপযোগী করে বর্ণনা/ব্যাখ্যা লেখো (ছবির সব লেখা ও কাঠামো বিশ্লেষণ করে)।',
};

// ─────────────────────────── মূল হোস্ট ───────────────────────────

export function AiBubbleHost() {
  const tt = useT();
  // সম্পূর্ণ ব্যবহারযোগ্য কনফিগই "প্রস্তুত" — শুধু কি থাকলে যথেষ্ট নয়
  const configured = useAiStore(aiConfiguredSelector);

  // ভাসমান পিল (অটো-সিলেকশন)
  const [pill, setPill] = useState<{ x: number; y: number; editor: Editor } | null>(null);
  // প্যানেল — স্টোরের রিকোয়েস্টই (পিল/কনটেক্সট-মেনু দুই পথেই একই দরজা)
  const panel = useAiBubbleStore((s) => s.req);
  const closePanel = useAiBubbleStore((s) => s.close);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  // ── সিলেকশন ট্র্যাকিং (একবারই রেজিস্টার; প্যানেল/ডায়ালগ অবস্থা টাইমারে পড়ি) ──
  useEffect(() => {
    let timer = 0;
    const hide = () => setPill(null);
    const update = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        // AI প্যানেল/কোনো ডায়ালগ খোলা থাকলে পিল নয়
        if (useAiBubbleStore.getState().req || useUiStore.getState().openDialog) {
          hide();
          return;
        }
        const sel = document.getSelection();
        if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
          hide();
          return;
        }
        const anchor = sel.anchorNode;
        if (!(anchor instanceof Node)) {
          hide();
          return;
        }
        const pmEl = anchor.nodeType === 1
          ? (anchor as Element).closest?.('.ProseMirror')
          : anchor.parentElement?.closest('.ProseMirror');
        if (!(pmEl instanceof HTMLElement)) {
          hide();
          return;
        }
        const editor = getEditor(pmEl.getAttribute('data-page-id'));
        if (!editor || editor.isDestroyed) {
          hide();
          return;
        }
        const { from, to, empty } = editor.state.selection;
        if (empty || to <= from) {
          hide();
          return;
        }
        const text = editor.state.doc.textBetween(from, to, '\n', ' ').trim();
        if (!text) {
          hide();
          return;
        }
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        if (!rect || (rect.width === 0 && rect.height === 0)) {
          hide();
          return;
        }
        setPill({
          x: Math.min(Math.max(rect.left + rect.width / 2, 60), window.innerWidth - 60),
          y: rect.top,
          editor,
        });
      }, 160);
    };
    document.addEventListener('selectionchange', update);
    update();
    return () => {
      document.removeEventListener('selectionchange', update);
      window.clearTimeout(timer);
    };
  }, []);

  // ── Escape / বাইরে ক্লিক / স্ক্রল / রিসাইজ ──
  useEffect(() => {
    if (!panel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closePanel();
      }
    };
    const onDown = (e: PointerEvent) => {
      const el = panelRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      closePanel();
    };
    const onScroll = (e: Event) => {
      const el = panelRef.current;
      if (el && e.target instanceof Node && el.contains(e.target)) return;
      closePanel();
    };
    // উচ্চতা-মাত্র রিসাইজ (মোবাইল কীবোর্ড) প্যানেল বন্ধ করে না — শুধু প্রস্থ বদলালে
    let lastW = window.innerWidth;
    const onResize = () => {
      if (window.innerWidth !== lastW) {
        lastW = window.innerWidth;
        closePanel();
      }
    };
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [panel, closePanel]);

  // ── প্যানেল পজিশন (ভিউপোর্টে ফ্লিপ + ক্ল্যাম্প) ──
  const panelRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    if (!panel) return;
    const el = panelRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let x = panel.x;
    let y = panel.y + 12;
    if (x + rect.width > window.innerWidth - margin) x = window.innerWidth - rect.width - margin;
    if (y + rect.height > window.innerHeight - margin) {
      // উপরে ফ্লিপ — সিলেকশনের উপরে
      y = Math.max(margin, panel.y - rect.height - 12);
    }
    x = Math.max(margin, Math.min(x, window.innerWidth - rect.width - margin));
    y = Math.max(margin, Math.min(y, window.innerHeight - rect.height - margin));
    setPos({ x, y });
  }, [panel]);

  const openFromPill = () => {
    if (!pill) return;
    openAiBubble({ editor: pill.editor, x: pill.x, y: pill.y + 8 });
    setPill(null);
  };

  if (!panel && !pill) return null;

  return createPortal(
    <>
      {pill && !panel ? (
        <button
          type="button"
          className="ai-bubble-pill no-print"
          style={{ left: pill.x, top: Math.max(8, pill.y - 42) }}
          onClick={openFromPill}
          aria-label={tt('ai.bubble.open')}
          title={tt('ai.bubble.open')}
        >
          <Sparkles size={13} aria-hidden="true" />
          <span>AI</span>
        </button>
      ) : null}
      {panel ? (
        <AiBubblePanel
          ref={panelRef}
          req={panel}
          style={{ left: pos.x, top: pos.y }}
          onClose={closePanel}
          configured={configured}
        />
      ) : null}
    </>,
    document.body,
  );
}

// ─────────────────────────── প্যানেল ───────────────────────────

interface PanelProps {
  req: AiBubbleRequest;
  style: React.CSSProperties;
  onClose: () => void;
  configured: boolean;
  /** React 19 — বাইরের পজিশন-মাপার ref */
  ref?: React.Ref<HTMLDivElement>;
}

function AiBubblePanel({ req, style, onClose, configured, ref }: PanelProps) {
  const tt = useT();
  const ed = req.editor;
  const openSettings = useUiStore((s) => s.open);
  const toggleChat = useUiStore((s) => s.toggleAiChat);

  // ধরা সিলেকশন — প্যানেল খোলার মুহূর্তেই ফ্রিজ
  const [captured] = useState<Captured>(() => {
    try {
      const { from, to, empty } = ed.state.selection;
      const valid = !empty && to > from && to <= ed.state.doc.content.size;
      return valid ? { editor: ed, from, to } : { editor: ed, from: null, to: null };
    } catch {
      return { editor: ed, from: null, to: null };
    }
  });

  const hasSelection = captured.from !== null && captured.to !== null;

  /** AI কোন প্রেক্ষাপটে কাজ করবে — নির্বাচিত অংশ বা পুরো পেজ */
  const [scope, setScope] = useState<'selection' | 'page'>(hasSelection ? 'selection' : 'page');
  const [mode, setMode] = useState<SelectionModeDef | null>(() => {
    if (req.mode === 'table-edit') return TABLE_EDIT_DEF;
    if (req.mode === 'image-explain') return IMAGE_EXPLAIN_DEF;
    if (req.mode) return SELECTION_MODES.find((m) => m.id === req.mode) ?? null;
    return null;
  });
  const [instruction, setInstruction] = useState(req.instruction ?? '');
  const [image, setImage] = useState<PreparedImage | null>(
    req.imageDataUrl
      ? { dataUrl: req.imageDataUrl, width: 0, height: 0, name: 'image', bytes: 0 }
      : null,
  );
  const [imgPicker, setImgPicker] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<string | null>(null);
  const [resultDemo, setResultDemo] = useState(false);
  const [fixedModel, setFixedModel] = useState<string | null>(null);
  const [error, setError] = useState<{ hintKey: string; detail?: string; raw?: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const busy = phase === 'working';
  const tableRows = req.tableContext ?? null;
  const pageScope = scope === 'page';

  const selectionText = useMemo(() => {
    const { from, to } = captured;
    if (from === null || to === null) return '';
    try {
      return captured.editor.state.doc.textBetween(from, to, '\n', ' ').trim();
    } catch {
      return '';
    }
  }, [captured]);

  /** কার্যকর প্রেক্ষাপট — সিলেকশন বা সম্পূর্ণ পেজ (Markdown) */
  const contextText = useMemo(
    () => (scope === 'page' ? pageToMarkdown(ed) : selectionText),
    [scope, selectionText, ed],
  );

  // মোডে ক্লিক → সরাসরি চালাও (এক-ট্যাপ অভিজ্ঞতা)
  const run = useCallback(async (m: SelectionModeDef) => {
    if (busy) return;
    if (m.id === 'image-explain' && !image) {
      setImgPicker(true);
      toast.info(tt('ai.bubble.needImage'));
      return;
    }
    setMode(m);
    setPhase('working');
    setError(null);
    setResult(null);
    setFixedModel(null);

    const isTable = m.id === 'table-edit';
    const res = await runSelectionAi({
      mode: m,
      selection: isTable ? '' : contextText,
      custom: instruction.trim() || undefined,
      imageDataUrl: m.id === 'image-explain' ? (image?.dataUrl ?? null) : null,
      tableContext: isTable ? tableRowsToMarkdown(tableRows ?? []) : undefined,
      pageScope: scope === 'page',
    });

    if (res.ok && res.markdown) {
      setResult(res.markdown);
      setResultDemo(!!res.demo);
      setFixedModel(res.fixedModel ?? null);
      setPhase('done');
    } else {
      setError({ hintKey: res.hintKey ?? 'ai.err.title', detail: res.detail, raw: res.error });
      setPhase('error');
    }
  }, [busy, image, instruction, contextText, scope, tableRows, tt]);

  const acceptFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const prepared = await prepareImageFile(file);
      setImage(prepared);
      setImgPicker(false);
      setMode(IMAGE_EXPLAIN_DEF);
    } catch (err) {
      toast.error(tt((err as Error)?.message === 'IMAGE_TOO_LARGE' ? 'ai.err.size' : 'ai.err.read'));
    }
  };

  // ছবি-পেস্ট (Ctrl+V) প্যানেল খোলা অবস্থায়
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      void acceptFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [acceptFile]);

  /** রেঞ্জ বৈধ কি না (ডকুমেন্ট বদলে গেলে fallback) */
  const rangeValid = (r: Captured): boolean => {
    if (r.from === null || r.to === null) return false;
    try {
      const size = r.editor.state.doc.content.size;
      return r.from >= 0 && r.to <= size && r.to > r.from;
    } catch {
      return false;
    }
  };

  const apply = (how: 'replace' | 'insert-after') => {
    if (!result || busy) return;
    const editor = captured.editor;
    if (!editor || editor.isDestroyed) {
      toast.error(tt('ai.noEditor'));
      return;
    }
    const html = markdownToHtml(result);
    if (!html.trim()) {
      toast.error(tt('ai.err.parse'));
      return;
    }
    try {
      if (how === 'replace' && pageScope && !req.tableRange) {
        // পুরো পেজ নতুন কনটেন্টে বদল — এক ট্রানজেকশনে (আন্ডু-সম্ভব)
        editor
          .chain()
          .focus()
          .insertContentAt({ from: 0, to: editor.state.doc.content.size }, html)
          .run();
      } else if (how === 'replace' && req.tableRange) {
        // পুরো টেবিল নতুন টেবিলে বদল
        editor.chain().focus().insertContentAt({ from: req.tableRange.from, to: req.tableRange.to }, html).run();
      } else if (how === 'replace' && rangeValid(captured)) {
        editor.chain().focus().insertContentAt({ from: captured.from!, to: captured.to! }, html).run();
      } else if (how === 'insert-after' && req.insertAfterPos !== undefined) {
        editor.chain().focus().insertContentAt(req.insertAfterPos, html).run();
      } else if (how === 'insert-after' && captured.from !== null) {
        // সিলেকশন নেই (কার্সার) বা পেজ-স্কোপ — ধরা অবস্থানেই বসাও
        editor.chain().focus().insertContentAt(Math.min(captured.from, editor.state.doc.content.size), html).run();
      } else if (how === 'insert-after') {
        // কোনো ধরা অবস্থান নেই — পেজের শেষে যোগ
        editor.chain().focus().insertContentAt(editor.state.doc.content.size, html).run();
      } else {
        editor.chain().focus().insertContent(html).run();
      }
      toast.success(tt('ai.inserted'));
      onClose();
    } catch {
      toast.error(tt('ai.err.parse'));
    }
  };

  const previewHtml = useMemo(() => (result ? markdownToHtml(result) : ''), [result]);

  const quickModes = SELECTION_MODES.filter((m) => m.id !== 'custom');
  const hasReplaceable = req.tableRange !== undefined || pageScope || rangeValid(captured);
  // পুরো পেজের প্রেক্ষাপট ১২k-তে কাটা পড়ে থাকলে AI পেজের শেষাংশ দেখেনি —
  // তবু পুরো পেজ প্রতিস্থাপন করলে শেষাংশটা নীরবে মুছে যেত; তাই রোধ
  const pageTruncated = pageScope && !req.tableRange && contextText.length >= PAGE_MD_CAP;

  return (
    <div
      ref={ref}
      className="ai-bubble-panel no-print"
      role="dialog"
      aria-label={tt('ai.bubble.title')}
      style={style}
    >
      {/* হেডার */}
      <div className="ai-bubble-head">
        <span className="ai-bubble-tile" aria-hidden="true"><Sparkles size={13} /></span>
        <div className="ai-bubble-head-text">
          <p className="ai-bubble-title">{tt('ai.bubble.title')}</p>
          <p className="ai-bubble-sub">
            {resultDemo ? tt('ai.demo.badge') : configured ? tt('ai.bubble.subReady') : tt('ai.bubble.subDemo')}
          </p>
        </div>
        <button type="button" className="ai-bubble-x" onClick={onClose} aria-label={tt('ai.bubble.close')}>
          <X size={14} />
        </button>
      </div>

      {/* কি নেই → সেটআপ স্ট্রিপ */}
      {!configured && !result ? (
        <div className="ai-bubble-setup">
          <p>{tt('ai.bubble.setupLine')}</p>
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 px-2.5 text-xs ai-save-btn" onClick={() => openSettings('aiSettings')}>
              {tt('ai.btn.addKey')}
            </Button>
          </div>
        </div>
      ) : null}

      {/* প্রেক্ষাপট বাছাই — নির্বাচিত অংশ / পুরো পেজ */}
      {!req.tableRange ? (
        <div className="ai-bubble-scope" role="group" aria-label={tt('ai.scope.label')}>
          <span className="ai-bubble-scope-label">{tt('ai.scope.label')}</span>
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              className={cn('ai-scope-chip', !pageScope && 'ai-scope-chip-on')}
              disabled={!hasSelection || busy}
              onClick={() => setScope('selection')}
              title={tt('ai.scope.selTip')}
            >
              <TextCursorInput size={11} aria-hidden="true" />
              {tt('ai.scope.sel')}
            </button>
            <button
              type="button"
              className={cn('ai-scope-chip', pageScope && 'ai-scope-chip-on')}
              disabled={busy}
              onClick={() => setScope('page')}
              title={tt('ai.scope.pageTip')}
            >
              <FileText size={11} aria-hidden="true" />
              {tt('ai.scope.page')}
            </button>
          </div>
          <p className="ai-bubble-hint">{pageScope ? tt('ai.scope.pageTip') : tt('ai.scope.selTip')}</p>
        </div>
      ) : null}

      {/* কুইক অ্যাকশন গ্রিড */}
      <div className="ai-bubble-grid" role="group" aria-label={tt('ai.bubble.quick')}>
        {quickModes.map((m) => {
          const Icon = MODE_ICON[m.id] ?? Sparkles;
          return (
            <button
              key={m.id}
              type="button"
              className={cn('ai-bubble-act', mode?.id === m.id && 'ai-bubble-act-on')}
              title={tt(m.tipKey)}
              disabled={busy}
              onClick={() => void run(m)}
            >
              <Icon size={13} aria-hidden="true" />
              <span>{tt(m.labelKey)}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={cn('ai-bubble-act', imgPicker && 'ai-bubble-act-on')}
          title={tt('ai.bubble.imageTip')}
          disabled={busy}
          onClick={() => setImgPicker((v) => !v)}
        >
          <ImagePlus size={13} aria-hidden="true" />
          <span>{tt('ai.bubble.image')}</span>
        </button>
        <button
          type="button"
          className="ai-bubble-act"
          title={tt('ai.chat.tip')}
          disabled={busy}
          onClick={() => { onClose(); toggleChat(); }}
        >
          <MessageSquare size={13} aria-hidden="true" />
          <span>{tt('ai.chat.openShort')}</span>
        </button>
      </div>

      {/* ছবি আপলোড স্ট্রিপ */}
      {imgPicker ? (
        <div
          className="ai-bubble-imgdrop"
          role="button"
          tabIndex={0}
          onClick={() => fileRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
        >
          <ImageIcon size={16} aria-hidden="true" />
          <span>{image ? tt('ai.drop.change') : tt('ai.bubble.imageDrop')}</span>
        </div>
      ) : null}
      {image && !imgPicker ? (
        <div className="ai-bubble-imgrow">
          <img src={image.dataUrl} alt={image.name} className="ai-bubble-imgthumb" />
          <span className="ai-bubble-imgname">{tt('ai.bubble.imageOn')}</span>
          <button type="button" className="ai-bubble-x" onClick={() => setImage(null)} aria-label={tt('ai.drop.remove')}>
            <X size={12} />
          </button>
        </div>
      ) : null}
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void acceptFile(file);
          e.target.value = '';
        }}
      />

      {/* নিজের নির্দেশ */}
      <div className="ai-bubble-custom">
        <Textarea
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder={tt('ai.bubble.customPh')}
          className="ai-bubble-input"
          rows={2}
          disabled={busy}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              // রান-বাটনের গার্ডের সমান — খালি প্রেক্ষাপটে কীবোর্ড-পথেও অর্থহীন কল নয়
              if (!instruction.trim() && !image && !contextText && !tableRows) return;
              e.preventDefault();
              void run(mode ?? SELECTION_MODES[0]);
            }
          }}
        />
        <Button
          size="sm"
          className="ai-bubble-run"
          disabled={busy || (!instruction.trim() && !image && !contextText && !tableRows)}
          onClick={() => void run(mode ?? SELECTION_MODES[0])}
        >
          {busy ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Sparkles size={13} aria-hidden="true" />}
          {busy ? tt('ai.sel.working') : tt('ai.sel.run')}
        </Button>
      </div>

      {/* কাজ চলছে */}
      {busy ? (
        <div className="ai-bubble-working" role="status">
          <span className="ai-shimmer-bar" />
          <span className="text-xs text-muted-foreground">{tt('ai.sel.working')}</span>
        </div>
      ) : null}

      {/* ত্রুটি — বন্ধুত্বপূর্ণ ইঙ্গিত + প্রোভাইডারের raw বার্তা (রোগ-নির্ণয়) */}
      {phase === 'error' && error ? (
        <div className="ai-bubble-error" role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          <div className="min-w-0">
            <p>{tt(error.hintKey)}</p>
            {error.detail ? <p className="ai-error-detail">{error.detail}</p> : null}
            {error.raw ? <p className="ai-error-detail">{rawProviderLine(error.raw, tt('ai.err.raw'))}</p> : null}
          </div>
          <Button size="sm" variant="outline" className="h-7 shrink-0 px-2 text-xs" onClick={() => openSettings('aiSettings')}>
            {tt('ai.setup.open')}
          </Button>
        </div>
      ) : null}

      {/* ফলাফল */}
      {phase === 'done' && result ? (
        <div className="ai-bubble-result">
          {fixedModel ? (
            <p className="mb-1 px-1 text-[11px] leading-snug text-muted-foreground" role="status">
              <Wand2 size={11} className="mr-1 inline" aria-hidden="true" />
              {tt('ai.err.fixedModel')} <code className="rounded bg-muted px-1 py-0.5">{fixedModel}</code>
            </p>
          ) : null}
          <div className="ai-bubble-preview" aria-label={tt('ai.result.title')}>
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
          <div className="ai-bubble-apply">
            {hasReplaceable && !pageTruncated ? (
              <Button size="sm" className="flex-1 gap-1.5 ai-save-btn" onClick={() => apply('replace')}>
                <Replace size={12} aria-hidden="true" />
                {pageScope && !req.tableRange ? tt('ai.page.replace') : tt('ai.sel.replace')}
              </Button>
            ) : null}
            <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => apply('insert-after')}>
              <BookPlus size={12} aria-hidden="true" /> {tt('ai.sel.insertAfter')}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2"
              onClick={() => void run(mode ?? SELECTION_MODES[0])}
              aria-label={tt('ai.reanalyze')}
              title={tt('ai.reanalyze')}
            >
              <RefreshCw size={12} aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** রেজিস্ট্রি-ভিত্তিক টেবিল শনাক্তকারী — context-menu থেকে ব্যবহৃত */
export function findEnclosingTable(editor: Editor): { from: number; to: number; rows: string[][] } | null {
  const $from = editor.state.selection.$from;
  let found: { from: number; to: number; rows: string[][] } | null = null;
  editor.state.doc.descendants((node, pos) => {
    if (found) return false;
    if (node.type.name === 'table') {
      const start = pos;
      const end = pos + node.nodeSize;
      if ($from.pos >= start && $from.pos <= end) {
        const rows: string[][] = [];
        node.forEach((row) => {
          const cells: string[] = [];
          row.forEach((cell) => cells.push(cell.textContent.trim()));
          rows.push(cells);
        });
        found = { from: start, to: end, rows };
        return false;
      }
    }
    return true;
  });
  return found;
}

export { openAiBubble };
