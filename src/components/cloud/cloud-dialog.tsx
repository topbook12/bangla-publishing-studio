/**
 * ক্লাউড-সিঙ্ক ডায়ালগ — ক্লাউডে সেভ, তালিকা, পুল, ডিলিট ও শেয়ার লিংক।
 * local-first: ডায়ালগ শুধু মিরর — ব্যর্থ হলেও ডিভাইসের ডকুমেন্ট অক্ষত।
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Cloud, CloudUpload, Download, Globe, Link2, Loader2, RefreshCw, Trash2, Unlink,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useT, useFmtDate } from '@/lib/i18n';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import {
  deleteCloudDoc, getCloudIdFor, listCloudDocs, pullCloudDoc, pushCurrentDoc,
  setShare, shareUrl, type CloudDocMeta,
} from '@/lib/cloud-sync';

export function CloudDialog() {
  const tt = useT();
  const ff = useFmtDate();
  const open = useUiStore((s) => s.openDialog === 'cloud');
  const close = useUiStore((s) => s.close);
  const { data: session } = useSession();

  const [docs, setDocs] = useState<CloudDocMeta[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [autosync, setAutosync] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setDocs(await listCloudDocs());
  }, []);

  const projectId = useEditorStore((s) => s.projectId);
  const [currentCloudId, setCurrentCloudId] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) setCurrentCloudId(getCloudIdFor(projectId));
  }, [projectId, docs]);

  useEffect(() => {
    if (open) {
      setDocs(session ? (undefined as unknown as CloudDocMeta[]) : null);
      if (session) void refresh();
      try { setAutosync(localStorage.getItem('bwp-autosync') === '1'); } catch { /* ignore */ }
    }
  }, [open, session, refresh]);

  if (!open) return null;

  const doPush = async () => {
    setBusy(true);
    try {
      const res = await pushCurrentDoc();
      if (res.status === 'saved') {
        toast.success(tt('cloud.push.done'));
        await refresh();
      } else if (res.status === 'signin') {
        toast.warning(tt('cloud.needsignin'));
      } else if (res.status === 'conflict') {
        toast.warning(tt('cloud.conflict'), { duration: 8000 });
        await refresh();
      } else if (res.status === 'offline') {
        toast.info(tt('cloud.offline'));
      } else {
        toast.error(tt('auth.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const doPull = async (cloudId: string) => {
    if (!window.confirm(tt('cloud.pull.warn'))) return;
    setBusy(true);
    try {
      const ok = await pullCloudDoc(cloudId);
      if (ok) {
        toast.success(tt('cloud.pull.done'));
        close();
      } else {
        toast.error(tt('auth.error'));
      }
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (cloudId: string) => {
    if (!window.confirm(tt('cloud.delete.confirm'))) return;
    setBusy(true);
    try {
      const ok = await deleteCloudDoc(cloudId);
      if (ok) {
        toast.success(tt('cloud.deleted'));
        await refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const doShare = async (doc: CloudDocMeta, enabled: boolean, rotate = false) => {
    setBusy(true);
    try {
      const res = await setShare(doc.id, enabled, rotate);
      if (res.status === 'ok') {
        if (!enabled) toast.info(tt('share.disabled'));
        await refresh();
      } else if (res.status === 'signin') {
        toast.warning(tt('cloud.needsignin'));
      }
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async (token: string, id: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl(token));
      toast.success(tt('share.copied'));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1600);
    } catch { /* clipboard blocked */ }
  };

  const currentCloudIdFinal = currentCloudId;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cloud size={17} className="text-emerald-700" aria-hidden="true" /> {tt('cloud.title')}
          </DialogTitle>
          <DialogDescription>{tt('cloud.desc')}</DialogDescription>
        </DialogHeader>

        {!session ? (
          <div className="rounded-xl border border-dashed border-emerald-700/40 bg-emerald-700/5 p-6 text-center">
            <Cloud size={26} className="mx-auto mb-2 text-emerald-700/70" aria-hidden="true" />
            <p className="text-sm font-semibold">{tt('cloud.needsignin')}</p>
            <p className="mt-1 text-xs text-muted-foreground">{tt('auth.desc')}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => void doPush()} disabled={busy} className="gap-2 bg-emerald-700 hover:bg-emerald-800">
                {busy ? <Loader2 size={14} className="animate-spin" /> : <CloudUpload size={14} />}
                {tt('cloud.push')}
              </Button>
              <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs font-medium text-muted-foreground">
                <Switch
                  checked={autosync}
                  onCheckedChange={(v) => {
                    setAutosync(v);
                    try { localStorage.setItem('bwp-autosync', v ? '1' : '0'); } catch { /* ignore */ }
                  }}
                  aria-label={tt('cloud.autosync')}
                />
                {tt('cloud.autosync')}
              </label>
            </div>

            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{tt('cloud.list.title')}</h3>
              <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => void refresh()} disabled={busy}>
                <RefreshCw size={12} /> Refresh
              </Button>
            </div>

            <div className="min-h-40 flex-1 space-y-2 overflow-y-auto pr-1" style={{ maxHeight: '45vh' }}>
              {docs === undefined ? (
                <div className="flex h-32 items-center justify-center text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                </div>
              ) : docs === null ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{tt('cloud.needsignin')}</p>
              ) : docs.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{tt('cloud.list.empty')}</p>
              ) : (
                docs.map((doc) => (
                  <CloudDocRow
                    key={doc.id}
                    doc={doc}
                    isCurrent={doc.id === currentCloudIdFinal}
                    copied={copiedId === doc.id}
                    busy={busy}
                    ff={ff}
                    tt={tt}
                    onPull={() => void doPull(doc.id)}
                    onDelete={() => void doDelete(doc.id)}
                    onShare={(en, rot) => void doShare(doc, en, rot)}
                    onCopy={() => doc.shareToken && void copyLink(doc.shareToken, doc.id)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** এক ক্লাউড ডক-এর সারি — খোলা / শেয়ার / মুছুন */
function CloudDocRow(props: {
  doc: CloudDocMeta;
  isCurrent: boolean;
  copied: boolean;
  busy: boolean;
  ff: (d: Date) => string;
  tt: (k: string, f?: string) => string;
  onPull: () => void;
  onDelete: () => void;
  onShare: (enabled: boolean, rotate?: boolean) => void;
  onCopy: () => void;
}) {
  const { doc, copied, busy, ff, tt } = props;
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{doc.title}</p>
          <p className="text-[11px] text-muted-foreground">
            {tt('cloud.updated')}: {ff(new Date(doc.updatedAt))} · {tt('cloud.version')} {doc.version}
          </p>
        </div>
        <Button variant="outline" size="sm" className="h-7 gap-1 text-xs" onClick={props.onPull} disabled={busy}>
          <Download size={12} /> {tt('cloud.open')}
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-600" onClick={props.onDelete} disabled={busy} aria-label={tt('cloud.delete')}>
          <Trash2 size={13} />
        </Button>
      </div>

      {/* শেয়ার সেকশন */}
      <div className="mt-2.5 rounded-lg bg-muted/60 p-2.5">
        <div className="flex items-center gap-2">
          <Globe size={13} className="text-emerald-700" aria-hidden="true" />
          <span className="flex-1 text-xs font-semibold">{tt('share.title')}</span>
          <Switch
            checked={doc.isPublic}
            onCheckedChange={(v) => props.onShare(v)}
            aria-label={tt('share.enable')}
            disabled={busy}
          />
        </div>
        {doc.isPublic && doc.shareToken ? (
          <div className="mt-2 flex items-center gap-1.5">
            <Input readOnly value={shareUrl(doc.shareToken)} className="h-8 flex-1 bg-background text-[11px]" onFocus={(e) => e.currentTarget.select()} />
            <Button variant="outline" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={props.onCopy} aria-label={tt('share.copy')}>
              <Link2 size={13} />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 shrink-0 p-0" onClick={() => props.onShare(true, true)} disabled={busy} aria-label={tt('share.rotate')} title={tt('share.rotate')}>
              <Unlink size={13} />
            </Button>
          </div>
        ) : null}
        {doc.isPublic && doc.shareToken && copied ? (
          <p className="mt-1 text-[11px] font-medium text-emerald-700">✓ {tt('share.copied')}</p>
        ) : null}
      </div>
    </div>
  );
}
