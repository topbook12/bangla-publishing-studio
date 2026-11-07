/**
 * স্ন্যাপশট ইতিহাস (ভার্সন ব্যাকআপ) — স্বয়ংক্রিয়/ম্যানুয়াল ব্যাকআপের তালিকা,
 * পুনরুদ্ধার (AlertDialog নিশ্চিতকরণ) ও মুছে ফেলা।
 * প্রতি ৫ মিনিটে নীরব অটো-ব্যাকআপ হয় (store.ts-এর লুপ) — এখানে সেগুলোই দেখানো হয়।
 *
 * দিন ৬৫ — ভার্সন-তুলনা (diff-view): যেকোনো স্ন্যাপশটকে বর্তমান বইয়ের সাথে
 * পাতা-ধরে তুলনা (identical/changed/added/removed), শব্দ-লেভেল diff,
 * সেটিংস-পার্থক্য চিপ, আর changed/removed পাতার এক-ক্লিক পেজ-লেভেল রোলব্যাক।
 * তুলনা-ভিউ রিঅ্যাকটিভ — পাতা ফেরত এলেই সারি তৎক্ষণাৎ identical-এ বদলে যায়।
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore, ArrowLeft, GitCompare, History, Loader2, RotateCcw,
  Settings2, ShieldCheck, Trash2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PHero } from '@/components/premium';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEditorStore, type SnapshotRecord } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { banglaDateToday, banglaTimeNow } from '@/lib/bangla';
import { useT, useFmtNum } from '@/lib/i18n';
import {
  compareVersions, htmlToText,
  type DiffOp, type PageDiffRow, type PageDiffStatus,
} from '@/lib/version-diff';
import { toast } from 'sonner';

/** স্টেটাস-ব্যাজের রং (সবুজ-ব্র্যান্ড + লাল/অ্যাম্বার — নীল/ইন্ডিগো নয়) */
const STATUS_BADGE: Record<PageDiffStatus, string> = {
  identical: 'border-muted-foreground/25 text-muted-foreground',
  changed: 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  added: 'border-primary/30 bg-primary/10 text-primary',
  removed: 'border-red-500/35 bg-red-500/10 text-red-600 dark:text-red-400',
};

/** শব্দ-লেভেল diff অপ রেন্ডার — সেমান্টিক <del>/<ins> (স্ক্রিন-রিডার ঘোষণা করে) */
function DiffOps({ ops }: { ops: DiffOp[] }) {
  return (
    <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed text-foreground/90">
      {ops.map((op, k) =>
        op.type === 'same' ? (
          <span key={k}>{op.text}</span>
        ) : op.type === 'del' ? (
          <del key={k} className="vd-del">{op.text}</del>
        ) : (
          <ins key={k} className="vd-ins">{op.text}</ins>
        ),
      )}
    </p>
  );
}

function DiffRow({
  row, confirmKey, onAskRestore, onRestore, busy,
}: {
  row: PageDiffRow;
  confirmKey: string | null;
  onAskRestore: (key: string | null) => void;
  onRestore: (snapPageId: string) => void;
  busy: boolean;
}) {
  const tt = useT();
  const ff = useFmtNum();
  const num = row.curIndex ?? row.snapIndex ?? 0;
  const label = tt(`dlg2.snap.diff.${row.status}`);
  const canRestore = row.status !== 'identical' && row.status !== 'added' && !!row.snapPage;
  const key = row.snapPage?.id ?? `${row.status}-${num}`;
  const preview = htmlToText((row.curPage ?? row.snapPage)?.html ?? '');

  return (
    <div className="rounded-lg border p-3 transition hover:border-primary/40">
      <div className="flex items-start gap-2">
        <Badge variant="outline" className={`shrink-0 ${STATUS_BADGE[row.status]}`}>
          {label}
        </Badge>
        <p className="shrink-0 pt-0.5 text-xs font-semibold text-muted-foreground">
          {tt('dlg2.snap.diff.pageN').split('{n}').join(ff(num))}
        </p>
        <div className="min-w-0 flex-1" />
        {canRestore && (
          confirmKey === key ? (
            <Button
              size="sm"
              variant="destructive"
              className="h-8 shrink-0"
              disabled={busy}
              onClick={() => onRestore(row.snapPage!.id)}
            >
              {busy ? <Loader2 size={13} className="animate-spin" /> : null}
              {tt('dlg2.snap.restorePageYes')}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="h-8 shrink-0 gap-1"
              onClick={() => onAskRestore(key)}
            >
              <RotateCcw size={12} /> {tt('dlg2.snap.restorePage')}
            </Button>
          )
        )}
      </div>

      <div className="mt-2 vd-body">
        {row.status === 'identical' ? (
          <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{preview}</p>
        ) : row.status === 'changed' ? (
          <DiffOps ops={row.ops ?? []} />
        ) : row.status === 'added' ? (
          <p className="line-clamp-4 rounded-md border border-primary/25 bg-primary/5 p-2 text-[13px] leading-relaxed">
            {preview}
          </p>
        ) : (
          <p className="line-clamp-4 rounded-md border border-red-500/25 bg-red-500/5 p-2 text-[13px] leading-relaxed text-muted-foreground">
            {preview}
          </p>
        )}
      </div>
    </div>
  );
}

export function SnapshotsDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'snapshots';
  const projectId = useEditorStore((s) => s.projectId);
  const pages = useEditorStore((s) => s.pages);
  const settings = useEditorStore((s) => s.settings);
  const listSnapshots = useEditorStore((s) => s.listSnapshots);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);
  const restoreSnapshot = useEditorStore((s) => s.restoreSnapshot);
  const deleteSnapshot = useEditorStore((s) => s.deleteSnapshot);
  const restorePageFromSnapshot = useEditorStore((s) => s.restorePageFromSnapshot);
  const tt = useT();
  const ff = useFmtNum();

  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  /** পুনরুদ্ধারের AlertDialog যে স্ন্যাপশটের জন্য খোলা */
  const [restoreTarget, setRestoreTarget] = useState<SnapshotRecord | null>(null);
  /** ইনলাইন "নিশ্চিত?" মুছে-ফেলা স্ন্যাপশটের id */
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  /** দিন ৬৫ — তুলনা-মোডে থাকা স্ন্যাপশট (null = তালিকা-ভিউ) */
  const [compare, setCompare] = useState<SnapshotRecord | null>(null);
  /** ইনলাইন "নিশ্চিত?" পাতা-ফেরত আনার কী (snapPageId) */
  const [confirmPage, setConfirmPage] = useState<string | null>(null);
  const [pageBusy, setPageBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshots(await listSnapshots());
    } finally {
      setLoading(false);
    }
  }, [listSnapshots]);

  useEffect(() => {
    if (open) {
      void refresh();
      setCompare(null);
      setConfirmPage(null);
    }
  }, [open, refresh]);

  // দিন ৬৫ — রিঅ্যাকটিভ তুলনা: pages/settings বদলালেই সারি আপডেট হয়
  const cmp = useMemo(
    () => (compare ? compareVersions(pages, compare.pages, settings, compare.settings) : null),
    [pages, settings, compare],
  );

  const handleManual = async () => {
    setBusy(true);
    try {
      await takeSnapshot('manual');
      toast.success(tt('dlg2.snap.toastSaved'));
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    const id = restoreTarget.id;
    setRestoreTarget(null);
    // পুরো বই বদলে যায় — ডায়ালগ সরিয়ে পুনরুদ্ধার-করা বইটাই দেখাই
    close();
    await restoreSnapshot(id);
    toast.success(tt('dlg2.snap.toastRestored'));
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    await deleteSnapshot(id);
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
    toast.success(tt('dlg2.snap.toastDeleted'));
  };

  const handlePageRestore = async (snapPageId: string) => {
    if (!compare) return;
    setConfirmPage(null);
    setPageBusy(true);
    try {
      const ok = await restorePageFromSnapshot(compare.id, snapPageId);
      if (ok) toast.success(tt('dlg2.snap.toastPageRestored'));
      else toast.error(tt('dlg2.snap.toastPageRestoreFail'));
    } finally {
      setPageBusy(false);
    }
  };

  const counts = cmp?.counts;
  const isEmpty = !!cmp && cmp.rows.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent className={compare ? 'sm:max-w-2xl' : 'max-w-xl'}>
          <DialogHeader className="sr-only">
            <DialogTitle>{tt('dlg2.snap.title')}</DialogTitle>
            <DialogDescription>
              {tt('dlg2.snap.desc')}
            </DialogDescription>
          </DialogHeader>

          {compare ? (
            <>
              {/* তুলনা-ভিউ হেডার */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0"
                  aria-label={tt('dlg2.snap.back')}
                  title={tt('dlg2.snap.back')}
                  onClick={() => { setCompare(null); setConfirmPage(null); }}
                >
                  <ArrowLeft size={16} />
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{tt('dlg2.snap.compareTitle')}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {compare.title} · {banglaDateToday(new Date(compare.createdAt))}{' '}
                    {banglaTimeNow(new Date(compare.createdAt))}
                  </p>
                </div>
              </div>

              {/* সারাংশ-ব্যাজ */}
              {counts && !isEmpty && (
                <div className="flex flex-wrap items-center gap-1.5" role="status">
                  <Badge variant="outline" className={STATUS_BADGE.identical}>
                    {ff(counts.identical)} {tt('dlg2.snap.diff.identical')}
                  </Badge>
                  <Badge variant="outline" className={STATUS_BADGE.changed}>
                    {ff(counts.changed)} {tt('dlg2.snap.diff.changed')}
                  </Badge>
                  <Badge variant="outline" className={STATUS_BADGE.added}>
                    {ff(counts.added)} {tt('dlg2.snap.diff.added')}
                  </Badge>
                  <Badge variant="outline" className={STATUS_BADGE.removed}>
                    {ff(counts.removed)} {tt('dlg2.snap.diff.removed')}
                  </Badge>
                  {cmp && cmp.settingsKeys.length > 0 && (
                    <Badge
                      variant="outline"
                      className="gap-1 border-primary/30 bg-primary/5 text-primary"
                      title={cmp.settingsKeys.join(', ')}
                    >
                      <Settings2 size={11} aria-hidden="true" /> {tt('dlg2.snap.diff.settingsChanged')}
                    </Badge>
                  )}
                </div>
              )}

              {/* তুলনা-সারি */}
              <div className="nav-scroll max-h-[24rem] space-y-2 overflow-y-auto pr-1">
                {isEmpty ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {tt('dlg2.snap.diff.empty')}
                  </p>
                ) : (
                  cmp?.rows.map((row, k) => (
                    <DiffRow
                      key={`${row.status}-${row.snapPage?.id ?? row.curPage?.id ?? k}`}
                      row={row}
                      confirmKey={confirmPage}
                      onAskRestore={setConfirmPage}
                      onRestore={(id) => void handlePageRestore(id)}
                      busy={pageBusy}
                    />
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <PHero tone="cyan" icon={History} title={tt('dlg2.snap.title')} desc={tt('dlg2.snap.desc')} />

              <Button className="w-full gap-2" onClick={() => void handleManual()} disabled={busy || !projectId}>
                {busy ? <Loader2 size={15} className="animate-spin" /> : <ArchiveRestore size={15} />}
                {tt('dlg2.snap.takeNow')}
              </Button>

              <div className="nav-scroll max-h-96 space-y-2 overflow-y-auto pr-1">
                {loading ? (
                  <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                    <Loader2 size={15} className="animate-spin" /> {tt('app.loading')}
                  </p>
                ) : snapshots.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    {tt('dlg2.snap.empty')}
                  </p>
                ) : (
                  snapshots.map((snap) => (
                    <div
                      key={snap.id}
                      className="flex items-center gap-2 rounded-lg border p-3 transition hover:border-primary/50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-semibold">{snap.title}</p>
                          <Badge variant={snap.kind === 'manual' ? 'default' : 'secondary'} className="shrink-0">
                            {snap.kind === 'manual' ? tt('dlg2.snap.kind.manual') : tt('dlg2.snap.kind.auto')}
                          </Badge>
                        </div>
                        {/* দিন ১৭ — কাঠামোগত অপের আগের নিরাপত্তা-স্ন্যাপশটের লেবেল */}
                        {snap.label ? (
                          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-primary">
                            <ShieldCheck size={12} aria-hidden="true" /> {snap.label}
                          </p>
                        ) : null}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {banglaDateToday(new Date(snap.createdAt))} · {banglaTimeNow(new Date(snap.createdAt))} ·{' '}
                          {tt('dlg2.snap.pages').split('{n}').join(ff(snap.pages.length))}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9 shrink-0 text-primary"
                        title={tt('dlg2.snap.compare')}
                        aria-label={tt('dlg2.snap.compareAria').split('{t}').join(snap.title)}
                        onClick={() => { setCompare(snap); setConfirmPage(null); }}
                      >
                        <GitCompare size={15} />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-9 shrink-0 gap-1"
                        onClick={() => setRestoreTarget(snap)}
                      >
                        <RotateCcw size={13} /> {tt('dlg2.snap.restore')}
                      </Button>
                      {confirmDelete === snap.id ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-9 shrink-0"
                          onClick={() => void handleDelete(snap.id)}
                        >
                          {tt('dlg2.snap.confirmDelete')}
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-9 w-9 shrink-0 text-red-500"
                          title={tt('dlg2.snap.delete')}
                          aria-label={tt('dlg2.snap.deleteAria').split('{t}').join(snap.title)}
                          onClick={() => setConfirmDelete(snap.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* পুনরুদ্ধার নিশ্চিতকরণ — বর্তমান অবস্থা আগে স্বয়ংক্রিয়ভাবে ব্যাকআপ হয় (নিরাপত্তা-জাল) */}
      <AlertDialog open={restoreTarget !== null} onOpenChange={(v) => !v && setRestoreTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt('dlg2.snap.restoreTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt('dlg2.snap.restoreDesc').split('{title}').join(restoreTarget?.title ?? '')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt('hdr.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRestore()}>
              {tt('dlg2.snap.restoreYes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
