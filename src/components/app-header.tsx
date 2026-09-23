/**
 * App header — brand mark, document title, save state, project menu, theme toggle
 */

'use client';

import { useState } from 'react';
import {
  BookOpenCheck, Check, CloudOff, FilePlus2, FolderOpen, Loader2, Moon, PenLine,
  Save, Sun, Trash2, Copy, Pencil, Menu,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { formatPageNumber } from '@/lib/bangla';

function SaveIndicator() {
  const saveState = useEditorStore((s) => s.saveState);
  return (
    <span className="save-indicator" role="status">
      {saveState.status === 'saving' ? (
        <><Loader2 size={13} className="animate-spin" /> Saving…</>
      ) : saveState.status === 'saved' ? (
        <><Check size={13} className="text-emerald-500" /> Saved</>
      ) : saveState.status === 'error' ? (
        <><CloudOff size={13} className="text-red-500" /> Save failed</>
      ) : (
        <><Save size={13} className="text-muted-foreground" /> Offline ready</>
      )}
    </span>
  );
}

function ThemeToggle() {
  // Toggle straight from the DOM — most reliable in this client-only app
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="max-sm:h-11 max-sm:w-11"
          aria-label="Toggle Theme"
          title="Light / dark mode"
          onClick={() => {
            const el = document.documentElement;
            const dark = el.classList.toggle('dark');
            try { localStorage.setItem('bwp-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
          }}
        >
          <Sun className="theme-icon-sun" size={17} />
          <Moon className="theme-icon-moon" size={17} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Toggle Theme</TooltipContent>
    </Tooltip>
  );
}

function RenameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const title = useEditorStore((s) => s.title);
  const rename = useEditorStore((s) => s.renameProject);
  const [value, setValue] = useState(title);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rename Book</DialogTitle>
        </DialogHeader>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Book name" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { rename(value || 'শিরোনামহীন বই'); onClose(); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppHeader() {
  const title = useEditorStore((s) => s.title);
  const projects = useEditorStore((s) => s.projects);
  const projectId = useEditorStore((s) => s.projectId);
  const createProject = useEditorStore((s) => s.createProject);
  const openProject = useEditorStore((s) => s.openProject);
  const duplicateProject = useEditorStore((s) => s.duplicateProject);
  const removeProject = useEditorStore((s) => s.removeProject);
  const openDialog = useUiStore((s) => s.open);

  const [renameOpen, setRenameOpen] = useState(false);
  const now = formatPageNumber(new Date().getDate(), 'bangla');

  return (
    <header className="app-header no-print">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="app-logo" aria-hidden="true">
          <BookOpenCheck size={19} />
        </span>
        <div className="flex min-w-0 flex-col">
          <h1 className="app-title">{title}</h1>
          <span className="app-subtitle">বাংলা পাবলিশিং স্টুডিও</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <SaveIndicator />
        <span className="hidden text-xs text-muted-foreground md:inline">{now}</span>
        <ThemeToggle />
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 max-sm:h-11 max-sm:w-11 max-sm:px-0"
                  aria-label="Projects"
                >
                  <Menu size={15} />
                  <span className="hidden sm:inline">Projects</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">Projects</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={() => void createProject('শিরোনামহীন বই', false)}>
              <FilePlus2 size={14} /> New Book
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil size={14} /> Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => projectId && void duplicateProject(projectId)}>
              <Copy size={14} /> Duplicate This Book
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Saved Books</DropdownMenuLabel>
            {projects.length === 0 ? (
              <DropdownMenuItem disabled>No books yet</DropdownMenuItem>
            ) : (
              projects.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => void openProject(p.id)}>
                  <FolderOpen size={14} />
                  <span className="flex-1 truncate">{p.title}</span>
                  {p.id === projectId ? <Check size={13} className="text-emerald-600" /> : null}
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuItem onClick={() => openDialog('projects')}>
              <FolderOpen size={14} /> All Books (Manager)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onClick={() => projectId && void removeProject(projectId)}
            >
              <Trash2 size={14} /> Delete This Book
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="gap-1.5 max-sm:h-11 max-sm:w-11 max-sm:px-0"
              aria-label="Proofing"
              onClick={() => openDialog('review')}
            >
              <PenLine size={14} />
              <span className="hidden sm:inline">Proofing</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Proofing</TooltipContent>
        </Tooltip>
      </div>

      <RenameDialog key={renameOpen ? 'open' : 'closed'} open={renameOpen} onClose={() => setRenameOpen(false)} />
    </header>
  );
}
