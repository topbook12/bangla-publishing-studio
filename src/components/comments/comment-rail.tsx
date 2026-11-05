/**
 * দিন ৬৪ — কমেন্ট-রেল (margin-note ধাঁচ) — প্রতি পাতার ডান মার্জিনে থ্রেড-বুদবুদ
 *
 * স্থাপন: .page-slot-এর ভিতরে absolute (ws-ruler-v-এর দর্পণ — left: 100%+gap)।
 * প্রস্থ-সংকীর্ণ স্ক্রিনে (<1100px) রেল পাতার নিচে static ব্লকে নামে (ওভারফ্লো নেই)।
 *
 * ইন্টারঅ্যাকশন:
 *  - কার্ড ক্লিক → অ্যাঙ্করে স্ক্রল + ফ্ল্যাশ (.cm-flash)
 *  - পাঠ্যে অ্যাঙ্কর ক্লিক → কার্ড হাইলাইট (activeCommentId)
 *  - উত্তর / সমাধান / পুনঃখোল / মুছে ফেলা — কার্ডেই
 *  - @উল্লেখ: textarea-য় `@`-উপসর্গে প্রার্থী-পপআপ (আমি + প্রেজেন্স peers)
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckCheck, CornerDownLeft, MessageSquareText, RotateCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCommentsStore, mentionCandidates, COMMENT_BODY_MAX, abortCommentComposer, removeAnchorEverywhere, type MentionCandidate } from '@/lib/comments';
import { queryAnchorEl } from '@/lib/comment-anchor';
import { useEditorStore } from '@/lib/store';
import { t, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

/** মন্তব্য-লেখায় @উল্লেখ হাইলাইট-রেন্ডার (সাদামাটা টেক্সট ডেটা, দৃশ্যমান হাইলাইট) */
function BodyText({ text }: { text: string }) {
  const tokens = useMemo(() => text.split(/(@[^\s@।,]+)/gu), [text]);
  return (
    <p className="cm-body">
      {tokens.map((tk, i) =>
        tk.startsWith('@') && tk.length > 1 ? (
          <mark key={i} className="cm-mention">{tk}</mark>
        ) : (
          <span key={i}>{tk}</span>
        ),
      )}
    </p>
  );
}

/** @-অটোকমপ্লিট — textarea-র কেয়ারটের আগে @প্রিফিক্স থাকলে প্রার্থী-তালিকা */
function useMentionAutocomplete(
  value: string,
  setCaretValue: (v: string, caret: number) => void,
): { candidates: MentionCandidate[]; pick: (name: string) => void } {
  // ডেরাইভড স্টেট — শেষ টোকেন @ দিয়ে শুরু হলে সক্রিয় (effect/setState-ক্যাসকেড নয়)
  const trigger = useMemo(() => {
    const m = /(?:^|\s)@([^\s@]*)$/.exec(value);
    return m ? value.length - m[1].length - 1 : null;
  }, [value]);

  const candidates = useMemo(() => {
    if (trigger === null) return [];
    const q = value.slice(trigger + 1).toLowerCase();
    return mentionCandidates().filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6);
  }, [trigger, value]);

  const pick = useCallback((name: string) => {
    if (trigger === null) return;
    // নামের পরে স্পেস — টোকেন শেষ, পপআপ নিজেই বন্ধ (ট্রিগার ডেরাইভড)
    const next = `${value.slice(0, trigger)}@${name} `;
    setCaretValue(next, trigger + name.length + 2);
  }, [trigger, value, setCaretValue]);

  return { candidates, pick };
}

/** উত্তর/নতুন-লেখার ইনপুট (মেনশন-সচেতন) */
function CommentInput({
  onSubmit,
  onCancel,
  autoFocus,
  placeholder,
  submitLabel,
  compact,
}: {
  onSubmit: (text: string) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
  placeholder: string;
  submitLabel: string;
  compact?: boolean;
}) {
  const [value, setValue] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);

  const setCaretValue = useCallback((v: string) => {
    setValue(v);
    // কেয়ারট শেষে — মেনশন-পিকের পরে স্বাভাবিক টাইপিং চলে
    requestAnimationFrame(() => {
      const el = ref.current;
      if (el) el.setSelectionRange(v.length, v.length);
      el?.focus();
    });
  }, []);

  const { candidates, pick } = useMentionAutocomplete(value, setCaretValue);

  useEffect(() => {
    setMentionOpen(candidates.length > 0);
  }, [candidates]);

  const submit = () => {
    const text = value.trim();
    if (!text) return;
    onSubmit(text.slice(0, COMMENT_BODY_MAX));
    setValue('');
  };

  return (
    <div className={cn('cm-input-wrap', compact && 'cm-input-compact')}>
      {mentionOpen ? (
        <ul className="cm-mention-pop" role="listbox" aria-label={t('cm.composer.mentions', 'উল্লেখ-প্রার্থী')}>
          {candidates.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => pick(c.name)}
                className="cm-mention-item"
              >
                <span className="cm-avatar" style={{ background: c.color }} aria-hidden="true">
                  {c.name.slice(0, 1)}
                </span>
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        ref={ref}
        className="cm-input"
        rows={compact ? 2 : 3}
        value={value}
        placeholder={placeholder}
        autoFocus={autoFocus}
        aria-label={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === 'Escape' && onCancel) {
            e.preventDefault();
            onCancel();
          }
        }}
      />
      <div className="cm-input-actions">
        {onCancel ? (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onCancel}>
            {t('cm.composer.cancel', 'বাতিল')}
          </Button>
        ) : null}
        <Button size="sm" className="h-7 gap-1 px-2.5 text-xs" disabled={!value.trim()} onClick={submit}>
          <CornerDownLeft size={12} aria-hidden="true" /> {submitLabel}
        </Button>
      </div>
    </div>
  );
}

/** এক থ্রেডের বুদবুদ */
function ThreadCard({ threadId }: { threadId: string }) {
  const tt = useT();
  const thread = useCommentsStore((s) => s.threads.find((x) => x.id === threadId));
  const active = useCommentsStore((s) => s.activeCommentId === threadId);
  const replyOpen = useCommentsStore((s) => s.replyTo === threadId);
  const setActive = useCommentsStore((s) => s.setActive);
  const openReply = useCommentsStore((s) => s.openReply);
  const addReply = useCommentsStore((s) => s.addReply);
  const toggleResolved = useCommentsStore((s) => s.toggleResolved);
  const removeThread = useCommentsStore((s) => s.removeThread);
  const [showAll, setShowAll] = useState(false);

  if (!thread) return null;
  const me = (() => {
    try { return JSON.parse(localStorage.getItem('bps.presence.identity.v1') || 'null') as { id?: string } | null; }
    catch { return null; }
  })();
  const authorIsMe = thread.body.authorId === me?.id;
  const visibleReplies = showAll ? thread.replies : thread.replies.slice(-2);

  const jump = () => {
    setActive(thread.id);
    const el = queryAnchorEl(thread.id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.remove('cm-flash');
      void el.offsetWidth; // রিস্টার্ট অ্যানিমেশন
      el.classList.add('cm-flash');
      window.setTimeout(() => el.classList.remove('cm-flash'), 1600);
    } else {
      // অ্যাঙ্কর অন্য ভিউপোর্টে (static পাতা) — পাতায় যান
      const pageEl = document.querySelector(`[data-page-id="${CSS.escape(thread.pageId)}"]`);
      pageEl?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <article
      className={cn('cm-card', active && 'is-active', thread.resolved && 'is-resolved')}
      onClick={() => setActive(thread.id)}
      aria-label={`${thread.body.authorName}: ${thread.quote.slice(0, 40)}`}
    >
      <header className="cm-card-head">
        <span className="cm-avatar" style={{ background: thread.body.authorColor }} aria-hidden="true">
          {thread.body.authorName.slice(0, 1)}
        </span>
        <span className="cm-author">{thread.body.authorName}{authorIsMe ? ` · ${tt('cm.thread.you')}` : ''}</span>
        <time className="cm-time" dateTime={new Date(thread.body.createdAt).toISOString()}>
          {new Date(thread.body.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </time>
      </header>

      {thread.quote ? <blockquote className="cm-quote">{thread.quote}</blockquote> : null}
      <BodyText text={thread.body.body} />

      {visibleReplies.length ? (
        <div className="cm-replies">
          {visibleReplies.map((r) => (
            <div key={r.id} className="cm-reply">
              <span className="cm-avatar cm-avatar-sm" style={{ background: r.authorColor }} aria-hidden="true">{r.authorName.slice(0, 1)}</span>
              <div className="cm-reply-main">
                <span className="cm-author-sm">{r.authorName}</span>
                <BodyText text={r.body} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {thread.replies.length > 2 ? (
        showAll ? (
          <button type="button" className="cm-linklike" onClick={() => setShowAll(false)}>
            {tt('cm.hideReplies')}
          </button>
        ) : (
          <button type="button" className="cm-linklike" onClick={() => setShowAll(true)}>
            {tt('cm.showReplies').split('{n}').join(String(thread.replies.length))}
          </button>
        )
      ) : null}

      <footer className="cm-card-actions" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="cm-iconbtn" title={tt('cm.jump')} aria-label={tt('cm.jump')} onClick={jump}>
          <MessageSquareText size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="cm-iconbtn"
          title={thread.resolved ? tt('cm.reopen') : tt('cm.resolve')}
          aria-label={thread.resolved ? tt('cm.reopen') : tt('cm.resolve')}
          onClick={() => void toggleResolved(thread.id)}
        >
          {thread.resolved ? <RotateCcw size={13} aria-hidden="true" /> : <CheckCheck size={13} aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="cm-iconbtn cm-danger"
          title={tt('cm.delete')}
          aria-label={tt('cm.delete')}
          onClick={() => {
            void removeThread(thread.id);
            removeAnchorEverywhere(thread.id);
          }}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </footer>

      {replyOpen ? (
        <CommentInput
          compact
          autoFocus
          placeholder={tt('cm.reply.ph')}
          submitLabel={tt('cm.reply.btn')}
          onSubmit={(text) => void addReply(thread.id, text)}
          onCancel={() => openReply(null)}
        />
      ) : (
        <button type="button" className="cm-linklike cm-reply-trigger" onClick={() => openReply(thread.id)}>
          <CornerDownLeft size={11} aria-hidden="true" /> {tt('cm.reply.ph')}
        </button>
      )}
    </article>
  );
}

/**
 * অ্যাঙ্কর পাতা বদলে গেলে (স্প্লিট/ফ্লো) থ্রেড নতুন পাতার রেলে দেখায় —
 * DOM-এ অ্যাঙ্করের বর্তমান পাতা খুঁজে দেখা
 */
function threadAnchorsOnPage(thread: { id: string; pageId: string }, pageId: string): boolean {
  if (thread.pageId === pageId) return true;
  if (typeof document === 'undefined') return false;
  const el = document.querySelector(`[data-comment-id="${CSS.escape(thread.id)}"]`);
  if (!el) return false;
  const paper = el.closest('[data-page-id]');
  return paper?.getAttribute('data-page-id') === pageId;
}

/** প্রতি পাতার রেল — page-slot-এর ভিতরে মাউন্ট হয় */
export function CommentRail({ pageId }: { pageId: string }) {
  const tt = useT();
  const composer = useCommentsStore((s) => s.composer);
  const submitComposer = useCommentsStore((s) => s.submitComposer);
  const threads = useCommentsStore((s) => s.threads);

  const pageThreads = useMemo(
    () => threads.filter((t) => threadAnchorsOnPage(t, pageId)),
    [threads, pageId],
  );
  const resolved = pageThreads.filter((t) => t.resolved);
  const openThreads = pageThreads.filter((t) => !t.resolved);
  const show = pageThreads.length > 0 || composer?.pageId === pageId;
  if (!show) return null;

  return (
    <aside className="cm-rail no-print" aria-label={t('cm.group', 'সহযোগিতা')}>
      {openThreads.map((th) => <ThreadCard key={th.id} threadId={th.id} />)}
      {composer?.pageId === pageId ? (
        <div className="cm-card is-composing" aria-label={tt('cm.composer.title')}>
          {composer.quote ? <blockquote className="cm-quote">{composer.quote}</blockquote> : null}
          <CommentInput
            autoFocus
            placeholder={tt('cm.composer.ph')}
            submitLabel={tt('cm.composer.submit')}
            onSubmit={(text) => void submitComposer(text)}
            onCancel={() => abortCommentComposer()}
          />
        </div>
      ) : null}
      {resolved.length > 0 ? (
        <details className="cm-resolved-group">
          <summary>
            <CheckCheck size={12} aria-hidden="true" /> {tt('cm.resolvedLabel')} · {resolved.length}
          </summary>
          {resolved.map((th) => <ThreadCard key={th.id} threadId={th.id} />)}
        </details>
      ) : null}
    </aside>
  );
}
