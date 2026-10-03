/**
 * প্রজেক্ট ম্যানেজার — সব বইয়ের তালিকা, খোলা, নাম পরিবর্তন, কপি, মুছা
 */

'use client';

import { useEffect, useState } from 'react';
import { Copy, FilePlus2, FolderOpen, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { useT, useFmtNum, useFmtDate } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function ProjectsDialog() {
  const tt = useT();
  const nf = useFmtNum();
  const fd = useFmtDate();
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'projects';
  const projects = useEditorStore((s) => s.projects);
  const projectId = useEditorStore((s) => s.projectId);
  const refreshProjects = useEditorStore((s) => s.refreshProjects);
  const openProject = useEditorStore((s) => s.openProject);
  const duplicateProject = useEditorStore((s) => s.duplicateProject);
  const removeProject = useEditorStore((s) => s.removeProject);
  const createProject = useEditorStore((s) => s.createProject);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    if (open) void refreshProjects();
  }, [open, refreshProjects]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{tt('dlg1.projects.title')}</DialogTitle>
          <DialogDescription>
            {tt('dlg1.projects.desc').split('{n}').join(nf(projects.length))}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
          {projects.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{tt('dlg1.projects.empty')}</p>
          ) : null}
          {projects.map((p) => (
            <div
              key={p.id}
              className={cn(
                'flex items-center gap-2 rounded-lg border p-3 transition',
                p.id === projectId ? 'border-primary bg-accent/50' : 'hover:border-primary/50',
              )}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {tt('dlg1.projects.lastEdit').split('{d}').join(fd(new Date(p.updatedAt)))}
                </p>
              </div>
              {p.id === projectId ? (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">{tt('dlg1.projects.openBadge')}</span>
              ) : (
                <Button size="sm" variant="outline" className="gap-1" onClick={() => { void openProject(p.id); close(); }}>
                  <FolderOpen size={13} /> {tt('dlg1.projects.open')}
                </Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7" title={tt('dlg1.projects.copy')} aria-label={tt('dlg1.projects.copy')} onClick={() => void duplicateProject(p.id)}>
                <Copy size={13} />
              </Button>
              {confirmDelete === p.id ? (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await removeProject(p.id);
                    setConfirmDelete(null);
                    toast.success(tt('dlg1.projects.toastDeleted'));
                  }}
                >
                  {tt('dlg1.projects.confirmDelete')}
                </Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" title={tt('dlg1.projects.delete')} aria-label={tt('dlg1.projects.delete')} onClick={() => setConfirmDelete(p.id)}>
                  <Trash2 size={13} />
                </Button>
              )}
            </div>
          ))}
        </div>

        <Button
          className="w-full gap-2"
          variant="secondary"
          onClick={() => {
            void createProject(tt('hdr.book.untitled'), false);
            close();
          }}
        >
          <FilePlus2 size={15} /> {tt('dlg1.projects.new')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
