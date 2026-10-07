/**
 * AI চ্যাট প্যানেল — প্রফেশনাল কথোপকথন (Copilot-ধাঁচ)
 * ─────────────────────────────────────────────────
 *  - বই-নির্মাতার সহ-লেখক: পরিকল্পনা, লেখা, অনুবাদ, সারাংশ, টেবিল — সব চ্যাটে
 *  - উত্তর Markdown-এ রেন্ডার (নিরাপদ) → এক ক্লিকে বইয়ে সন্নিবেশ
 *  - ছবি সংযুক্ত করলে ভিশন মডেল দেখে বোঝে
 *  - সিলেকশন উদ্ধৃত করে প্রেক্ষাপট দেওয়া যায়
 *  - BYOK: কি ব্রাউজারে; কথোপকথন শুধু মেমোরিতে (গোপনীয়তা)
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookPlus, CircleAlert, Copy, Eraser, Image as ImageIcon, ImagePlus, Loader2,
  MessageSquare, Send, ShieldCheck, Sparkles, Table2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import { useAiStore, aiConfiguredSelector, providerPreset } from '@/lib/ai-store';
import { useAiChatStore } from '@/lib/ai-chat-store';
import { runChatAi, markdownToHtml, rawProviderLine } from '@/lib/ai-assistant';
import { prepareImageFile } from '@/lib/ai-client';
import type { PreparedImage } from '@/lib/ai-client';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** দ্রুত শুরুর চিপস — নির্দেশ-প্রম্পট তিন ভাষাতেই (label = বাটন, prompt = ইনপুটে বসে) */
const CHAT_CHIPS: Array<{ key: string; promptKey: string }> = [
  { key: 'ai.chat.chip.outline', promptKey: 'ai.chat.chip.outline.prompt' },
  { key: 'ai.chat.chip.summary', promptKey: 'ai.chat.chip.summary.prompt' },
  { key: 'ai.chat.chip.table', promptKey: 'ai.chat.chip.table.prompt' },
  { key: 'ai.chat.chip.intro', promptKey: 'ai.chat.chip.intro.prompt' },
];

export function AiChatPanel() {
  const tt = useT();
  const open = useUiStore((s) => s.aiChatOpen);
  const toggle = useUiStore((s) => s.toggleAiChat);
  const configured = useAiStore(aiConfiguredSelector);
  const providerName = useAiStore((s) => providerPreset(s.config.provider).name);

  const messages = useAiChatStore((s) => s.messages);
  const sending = useAiChatStore((s) => s.sending);
  const draft = useAiChatStore((s) => s.draft);
  const setDraft = useAiChatStore((s) => s.setDraft);
  const addUser = useAiChatStore((s) => s.addUser);
  const addAssistant = useAiChatStore((s) => s.addAssistant);
  const setSending = useAiChatStore((s) => s.setSending);
  const clear = useAiChatStore((s) => s.clear);

  const [image, setImage] = useState<PreparedImage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const busy = sending;

  // প্যানেল খোলা হলে ইনপুটে ফোকাস + একটু পরে নিচে স্ক্রল
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      inputRef.current?.focus();
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, 120);
    return () => window.clearTimeout(t);
  }, [open]);

  // নতুন বার্তা → নিচে স্ক্রল
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sending]);

  // Escape → বন্ধ
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sending) {
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, sending, toggle]);

  const acceptFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const prepared = await prepareImageFile(file);
      setImage(prepared);
    } catch (err) {
      toast.error(tt((err as Error)?.message === 'IMAGE_TOO_LARGE' ? 'ai.err.size' : 'ai.err.read'));
    }
  }, [tt]);

  // ছবি পেস্ট
  useEffect(() => {
    if (!open) return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      void acceptFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, acceptFile]);

  /** এডিটরের চলতি সিলেকশন (উদ্ধৃত করতে) */
  const quoteSelection = () => {
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (!ed || ed.isDestroyed) {
      toast.info(tt('ai.noEditor'));
      return;
    }
    const { from, to, empty } = ed.state.selection;
    if (empty) {
      toast.info(tt('ai.chat.noSelection'));
      return;
    }
    const text = ed.state.doc.textBetween(from, to, '\n', ' ').trim();
    if (!text) return;
    const clipped = text.length > 1200 ? `${text.slice(0, 1200)}…` : text;
    setDraft((draft ? `${draft}\n\n` : '') + `"${clipped}"`);
    inputRef.current?.focus();
  };

  const send = async () => {
    const text = draft.trim();
    if ((!text && !image) || busy) return;
    // সার্ভার ২৪k ক্যাপ — বিশাল পেস্টে স্পষ্ট বার্তা, নীরব ব্যর্থতা নয়
    if (text.length > 18_000) {
      toast.error(tt('ai.err.size'));
      return;
    }
    setError(null);
    setDraft('');
    const img = image;
    setImage(null);
    addUser(text || (img ? tt('ai.chat.imageMsg') : ''));
    setSending(true);

    const history = useAiChatStore.getState().messages.map((m) => ({ role: m.role, content: m.content }));
    const res = await runChatAi({ messages: history, imageDataUrl: img?.dataUrl ?? null });

    setSending(false);
    if (res.ok && (res.markdown ?? res.text)) {
      addAssistant((res.markdown ?? res.text ?? '').trim(), res.demo);
      if (res.fixedModel) {
        toast.info(`${tt('ai.err.fixedModel')} ${res.fixedModel}`);
      }
    } else {
      // বন্ধুত্বপূর্ণ ইঙ্গিত + প্রোভাইডারের raw বার্তা — রোগ-নির্ণয় সহজ হয়
      const raw = rawProviderLine(res.error, tt('ai.err.raw'));
      setError([tt(res.hintKey ?? 'ai.err.title'), raw].filter(Boolean).join('\n'));
    }
  };

  const insertIntoBook = (content: string) => {
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (!ed || ed.isDestroyed) {
      toast.error(tt('ai.noEditor'));
      return;
    }
    const html = markdownToHtml(content);
    if (!html.trim()) {
      toast.error(tt('ai.err.parse'));
      return;
    }
    ed.chain().focus().insertContent(html).run();
    toast.success(tt('ai.inserted'));
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(tt('ai.chat.copied'));
    } catch {
      toast.error(tt('ai.chat.copyFail'));
    }
  };

  const chips = useMemo(
    () => CHAT_CHIPS.map((c) => ({ ...c, label: tt(c.key), prompt: tt(c.promptKey) })),
    [tt],
  );

  // Markdown → HTML প্রতি রেন্ডারে না চালিয়ে বার্তা-তালিকা বদলালেই একবার
  const renderedMsgs = useMemo(
    () => messages.map((m) => ({ ...m, html: m.role === 'assistant' ? markdownToHtml(m.content) : '' })),
    [messages],
  );

  if (!open) return null;

  return (
    <aside
      className={cn('ai-chat-panel no-print', dragOver && 'ai-chat-drag')}
      role="complementary"
      aria-label={tt('ai.chat.title')}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) void acceptFile(file);
      }}
    >
      {/* হেডার */}
      <header className="ai-chat-head">
        <span className="ai-chat-tile" aria-hidden="true"><Sparkles size={15} /></span>
        <div className="min-w-0 flex-1">
          <p className="ai-chat-title">{tt('ai.chat.title')}</p>
          <p className="ai-chat-sub">
            {configured ? providerName : tt('ai.chat.demoSub')}
          </p>
        </div>
        <button
          type="button"
          className="ai-bubble-x"
          onClick={clear}
          aria-label={tt('ai.chat.clear')}
          title={tt('ai.chat.clear')}
          disabled={messages.length === 0}
        >
          <Eraser size={14} />
        </button>
        <button type="button" className="ai-bubble-x" onClick={toggle} aria-label={tt('ai.bubble.close')}>
          <X size={15} />
        </button>
      </header>

      {/* বার্তা তালিকা */}
      <div className="ai-chat-body" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <span className="ai-chat-empty-icon" aria-hidden="true"><MessageSquare size={22} /></span>
            <p className="ai-chat-empty-title">{tt('ai.chat.emptyTitle')}</p>
            <ol className="ai-chat-empty-steps">
              <li><Sparkles size={12} aria-hidden="true" /> {tt('ai.chat.step1')}</li>
              <li><ImagePlus size={12} aria-hidden="true" /> {tt('ai.chat.step2')}</li>
              <li><Table2 size={12} aria-hidden="true" /> {tt('ai.chat.step3')}</li>
            </ol>
            <div className="ai-chat-chips" role="group" aria-label={tt('ai.chat.quick')}>
              {chips.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className="ai-chip"
                  onClick={() => { setDraft(c.prompt); inputRef.current?.focus(); }}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {!configured ? <p className="ai-chat-empty-note">{tt('ai.chat.emptyNote')}</p> : null}
          </div>
        ) : (
          <div className="ai-chat-msgs">
            {renderedMsgs.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="ai-chat-msg ai-chat-msg-user">
                  <div className="ai-chat-bubble-user">{m.content}</div>
                </div>
              ) : (
                <div key={m.id} className="ai-chat-msg ai-chat-msg-ai">
                  <div className="ai-chat-bubble-ai">
                    <div className="ai-chat-md" dangerouslySetInnerHTML={{ __html: m.html }} />
                    {m.demo ? <span className="ai-demo-badge">{tt('ai.demo.badge')}</span> : null}
                    <div className="ai-chat-msg-actions">
                      <button type="button" onClick={() => insertIntoBook(m.content)} title={tt('ai.insert')}>
                        <BookPlus size={13} aria-hidden="true" /> {tt('ai.chat.insert')}
                      </button>
                      <button type="button" onClick={() => void copyMessage(m.content)} title={tt('ai.chat.copy')}>
                        <Copy size={13} aria-hidden="true" /> {tt('ai.chat.copy')}
                      </button>
                    </div>
                  </div>
                </div>
              ),
            )}
            {sending ? (
              <div className="ai-chat-msg ai-chat-msg-ai" aria-live="polite">
                <div className="ai-chat-bubble-ai ai-chat-typing" role="status">
                  <span /><span /><span />
                  <span className="ml-2 text-xs text-muted-foreground">{tt('ai.chat.thinking')}</span>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ত্রুটি */}
      {error ? (
        <div className="ai-bubble-error mx-3" role="alert">
          <CircleAlert size={14} aria-hidden="true" />
          <p className="min-w-0 flex-1 whitespace-pre-line break-words">{error}</p>
          <button type="button" className="ai-bubble-x shrink-0" onClick={() => setError(null)} aria-label={tt('ai.bubble.close')}>
            <X size={12} />
          </button>
        </div>
      ) : null}

      {/* কম্পোজার */}
      <footer className="ai-chat-composer">
        {image ? (
          <div className="ai-bubble-imgrow mx-0">
            <img src={image.dataUrl} alt={image.name} className="ai-bubble-imgthumb" />
            <span className="ai-bubble-imgname">{image.name}</span>
            <button type="button" className="ai-bubble-x" onClick={() => setImage(null)} aria-label={tt('ai.drop.remove')}>
              <X size={12} />
            </button>
          </div>
        ) : null}
        <div className="ai-chat-inputrow">
          <button
            type="button"
            className="ai-chat-attach"
            onClick={() => fileRef.current?.click()}
            aria-label={tt('ai.chat.attach')}
            title={tt('ai.chat.attach')}
            disabled={busy}
          >
            <ImagePlus size={16} aria-hidden="true" />
          </button>
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
          <Textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={tt('ai.chat.ph')}
            className="ai-chat-input"
            rows={1}
            disabled={busy}
          />
          <button
            type="button"
            className="ai-chat-send"
            onClick={() => void send()}
            disabled={busy || (!draft.trim() && !image)}
            aria-label={tt('ai.chat.send')}
            title={tt('ai.chat.send')}
          >
            {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Send size={15} aria-hidden="true" />}
          </button>
        </div>
        <div className="ai-chat-foot">
          <button type="button" className="ai-chat-quote" onClick={quoteSelection} disabled={busy}>
            <MessageSquare size={11} aria-hidden="true" /> {tt('ai.chat.quoteSel')}
          </button>
          <span className="ai-chat-secure"><ShieldCheck size={11} aria-hidden="true" /> {tt('ai.chat.secure')}</span>
        </div>
      </footer>
    </aside>
  );
}
