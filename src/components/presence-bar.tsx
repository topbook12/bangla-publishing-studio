/**
 * দিন ৬৩ — প্রেজেন্স-বার (হেডারের ডান ক্লাস্টারে)
 *
 * - অ্যাভাটার-স্ট্যাক: নিজে + একই ডকুমেন্টে থাকা অন্যরা (সর্বোচ্চ ৩টি দৃশ্যমান +N)
 * - কে-কী-লিখছে ব্যাজ: "{name} লিখছেন…" — aria-live সহ, অ্যানিমেটেড তিন-বিন্দু
 * - পপওভার: সংযোগ-অবস্থা + উপস্থিতির তালিকা + নিজের নাম/রং সম্পাদনা
 * - পরিচয় local-first (localStorage) — কনটেন্ট কখনো বেরোয় না, শুধু উপস্থিতির সংকেত
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, PenLine, Plug, PlugZap, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '@/lib/store';
import {
  initialOf,
  leavePresence,
  PRESENCE_COLORS,
  usePresenceStore,
  type PresencePeer,
} from '@/lib/presence';
import { useT, useFmtNum, tFmt, fmtNum } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const VISIBLE_MAX = 3;

function Avatar({ name, color, self, size = 26 }: { name: string; color: string; self?: boolean; size?: number }) {
  return (
    <span
      className="presence-avatar"
      style={{ backgroundColor: color, width: size, height: size, fontSize: Math.round(size * 0.46) }}
      aria-hidden={self ? undefined : true}
    >
      {initialOf(name)}
    </span>
  );
}

/** কে-কী-লিখছে ব্যাজ — একজনের নাম, একাধিক হলে প্রথমজন + গণনা */
function TypingBadge({ peers }: { peers: PresencePeer[] }) {
  const tt = useT();
  const typing = peers.filter((p) => p.typing);
  if (typing.length === 0) return null;
  const text =
    typing.length === 1
      ? tFmt('pr.typing', { name: typing[0].name })
      : `${typing[0].name} +${fmtNum(typing.length - 1)} …`;
  return (
    <span className="presence-typing" role="status" aria-live="polite">
      <span className="presence-typing-dots" aria-hidden="true">
        <i /><i /><i />
      </span>
      <span className="presence-typing-text">{text}</span>
      <PenLine size={11} aria-hidden="true" className="shrink-0 opacity-70" />
    </span>
  );
}

export function PresenceBar() {
  const tt = useT();
  const f = useFmtNum();
  const projectId = useEditorStore((s) => s.projectId);
  const identity = usePresenceStore((s) => s.identity);
  const peers = usePresenceStore((s) => s.peers);
  const status = usePresenceStore((s) => s.status);
  const hydrate = usePresenceStore((s) => s.hydrate);
  const join = usePresenceStore((s) => s.join);
  const setIdentity = usePresenceStore((s) => s.setIdentity);

  const [open, setOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savedFlash, setSavedFlash] = useState(false);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // পপওভার খোলার সময় ড্রাফ্ট সিঙ্ক (effect-এ setState এড়িয়ে onOpenChange-এ)
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next && identity) setNameDraft(identity.name);
  };

  // studio-ভিউ লাইফসাইকেল: ঢুকলে hydrate+join, বেরোলে স্পষ্ট বিচ্ছিন্ন
  useEffect(() => {
    hydrate();
    return () => leavePresence();
  }, [hydrate]);

  useEffect(() => {
    join(projectId ? `project:${projectId}` : null);
  }, [projectId, join]);

  useEffect(() => () => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
  }, []);

  const visible = useMemo(() => peers.slice(0, VISIBLE_MAX), [peers]);
  const hiddenCount = peers.length - visible.length;
  const anyTyping = peers.some((p) => p.typing);

  if (!identity || !projectId) return null;

  const statusDot =
    status === 'online' ? 'presence-dot-online' : status === 'connecting' ? 'presence-dot-connecting' : 'presence-dot-offline';
  const statusText =
    status === 'online'
      ? tt('pr.st.online')
      : status === 'connecting'
        ? tt('pr.st.connecting')
        : status === 'full'
          ? tt('pr.full')
          : tt('pr.st.offline');

  const saveName = () => {
    setIdentity({ name: nameDraft });
    setSavedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setSavedFlash(false), 1600);
  };

  return (
    <div className="presence-wrap" data-testid="presence-bar">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="presence-trigger"
            aria-label={`${tt('pr.title')} — ${statusText}`}
            title={`${tt('pr.title')} — ${statusText}`}
          >
            {peers.length === 0 ? (
              <span className="presence-self">
                <Avatar name={identity.name} color={identity.color} self />
                <span className="hidden sm:inline presence-self-name">{tt('pr.you')}</span>
              </span>
            ) : (
              <span className="presence-stack">
                <Avatar name={identity.name} color={identity.color} self />
                {visible.map((p) => (
                  <Avatar key={p.id} name={p.name} color={p.color} />
                ))}
                {hiddenCount > 0 ? <span className="presence-avatar presence-avatar-more">+{f(hiddenCount)}</span> : null}
              </span>
            )}
            <span className={cn('presence-status-dot', statusDot)} aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80 p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-sm font-semibold">
                <Users size={14} aria-hidden="true" className="text-primary" />
                {tt('pr.pop.title')}
              </p>
              <span className={cn('presence-state', `presence-state-${status}`)} role="status">
                <span className={cn('presence-status-dot', statusDot)} aria-hidden="true" />
                {statusText}
              </span>
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">{tt('pr.pop.desc')}</p>

            <div className="rounded-lg border bg-accent/30 p-2.5">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground">{tt('pr.pop.list')}</p>
              <ul className="space-y-1" aria-label={tt('pr.pop.list')}>
                <li className="flex items-center gap-2 text-sm">
                  <Avatar name={identity.name} color={identity.color} self size={20} />
                  <span className="flex-1 truncate">{identity.name}</span>
                  <span className="text-xs text-muted-foreground">({tt('pr.you')})</span>
                </li>
                {peers.map((p) => (
                  <li key={p.id} className="flex items-center gap-2 text-sm">
                    <Avatar name={p.name} color={p.color} size={20} />
                    <span className="flex-1 truncate">{p.name}</span>
                    {p.typing ? (
                      <span className="text-xs text-primary">
                        <PenLine size={11} className="mr-0.5 inline" aria-hidden="true" />
                        {tFmt('pr.typing', { name: '' }).trim()}
                      </span>
                    ) : null}
                  </li>
                ))}
                {peers.length === 0 ? (
                  <li className="text-xs italic text-muted-foreground">{tt('pr.only')}</li>
                ) : null}
              </ul>
            </div>

            <div className="space-y-2">
              <label htmlFor="pr-name" className="block text-xs font-medium text-muted-foreground">
                {tt('pr.pop.name')}
              </label>
              <div className="flex gap-1.5">
                <Input
                  id="pr-name"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveName();
                    }
                  }}
                  placeholder={tt('pr.pop.name.ph')}
                  maxLength={40}
                  className="h-8 text-sm"
                />
                <Button type="button" size="sm" className="h-8 px-3" onClick={saveName}>
                  {savedFlash ? <Check size={13} aria-hidden="true" /> : null}
                  {tt('pr.pop.save')}
                </Button>
              </div>
              <p className="text-xs font-medium text-muted-foreground">{tt('pr.pop.color')}</p>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={tt('pr.pop.color')}>
                {PRESENCE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={identity.color === c}
                    aria-label={`${tt('pr.pop.color')} ${c}`}
                    onClick={() => setIdentity({ color: c })}
                    className={cn('presence-swatch', identity.color === c && 'presence-swatch-active')}
                    style={{ backgroundColor: c }}
                  >
                    {identity.color === c ? <Check size={12} className="text-white" aria-hidden="true" /> : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {status === 'online' && !anyTyping && peers.length > 0 ? (
        <span className="presence-count hidden lg:inline" aria-label={tFmt('pr.count', { n: peers.length })}>
          <PlugZap size={11} aria-hidden="true" />
          {tFmt('pr.count', { n: f(peers.length) })}
        </span>
      ) : null}
      {status !== 'online' ? (
        <span className="presence-count presence-count-off hidden lg:inline" title={tt('pr.st.offline')}>
          <Plug size={11} aria-hidden="true" />
        </span>
      ) : null}

      <TypingBadge peers={peers} />
    </div>
  );
}
