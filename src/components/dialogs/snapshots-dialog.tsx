/**
 * স্ন্যাপশট ইতিহাস (ভার্সন ব্যাকআপ) — স্বয়ংক্রিয়/ম্যানুয়াল ব্যাকআপের তালিকা,
 * পুনরুদ্ধার (AlertDialog নিশ্চিতকরণ) ও মুছে ফেলা।
 * প্রতি ৫ মিনিটে নীরব অটো-ব্যাকআপ হয় (store.ts-এর লুপ) — এখানে সেগুলোই দেখানো হয়।
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArchiveRestore, History, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
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
import { toast } from 'sonner';

export function SnapshotsDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'snapshots';
  const projectId = useEditorStore((s) => s.projectId);
  const listSnapshots = useEditorStore((s) => s.listSnapshots);
  const takeSnapshot = useEditorStore((s) => s.takeSnapshot);
  const restoreSnapshot = useEditorStore((s) => s.restoreSnapshot);
  const deleteSnapshot = useEditorStore((s) => s.deleteSnapshot);
  const tt = useT();
  const ff = useFmtNum();

  const [snapshots, setSnapshots] = useState<SnapshotRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  /** পুনরুদ্ধারের AlertDialog যে স্ন্যাপশটের জন্য খোলা */
  const [restoreTarget, setRestoreTarget] = useState<SnapshotRecord | null>(null);
  /** ইনলাইন "নিশ্চিত?" মুছে-ফেলা স্ন্যাপশটের id */
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setSnapshots(await listSnapshots());
    } finally {
      setLoading(false);
    }
  }, [listSnapshots]);

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

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

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History size={16} aria-hidden="true" /> {tt('dlg2.snap.title')}
            </DialogTitle>
            <DialogDescription>
              {tt('dlg2.snap.desc')}
            </DialogDescription>
          </DialogHeader>

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
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {banglaDateToday(new Date(snap.createdAt))} · {banglaTimeNow(new Date(snap.createdAt))} ·{' '}
                      {tt('dlg2.snap.pages').split('{n}').join(ff(snap.pages.length))}
                    </p>
                  </div>
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
