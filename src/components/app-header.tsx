/**
 * App header — brand mark, document title, save state, project menu, language switcher, theme toggle
 */

'use client';

import { useState } from 'react';
import {
  BookOpenCheck, Check, CircleHelp, CloudOff, FilePlus2, Focus, FolderOpen, History, ListTree, Loader2, Moon, PenLine,
  Save, Sun, Trash2, Copy, Pencil, Menu, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { useT, useLangStore, useFmtDate, LANGUAGES } from '@/lib/i18n';
import { cn } from '@/lib/utils';

function SaveIndicator() {
  const saveState = useEditorStore((s) => s.saveState);
  const tt = useT();
  return (
    <span className={`save-indicator save-indicator-${saveState.status}`} role="status">
      {saveState.status === 'saving' ? (
        <><span className="save-pulse" aria-hidden="true" /><Loader2 size={13} className="animate-spin" /> {tt('hdr.save.saving')}</>
      ) : saveState.status === 'saved' ? (
        <><Check size={13} className="text-emerald-500" /> {tt('hdr.save.saved')}</>
      ) : saveState.status === 'error' ? (
        <><CloudOff size={13} className="text-red-500" /> {tt('hdr.save.failed')}</>
      ) : (
        <><Save size={13} className="text-muted-foreground" /> {tt('hdr.save.offline')}</>
      )}
    </span>
  );
}

function ThemeToggle() {
  const tt = useT();
  // Toggle straight from the DOM — most reliable in this client-only app
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="header-action max-sm:h-11 max-sm:w-11"
          aria-label={tt('hdr.theme.tip')}
          title={tt('hdr.theme.tip')}
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
      <TooltipContent side="bottom">{tt('hdr.theme.tip')}</TooltipContent>
    </Tooltip>
  );
}

/** ভাষা সুইচার — বাংলা / हिन्दी / English */
function LanguageSwitcher() {
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="header-action lang-btn gap-1.5 max-sm:h-11 max-sm:w-11 max-sm:px-0"
              aria-label={tt('lang.tip')}
              title={tt('lang.tip')}
            >
              <Globe size={15} />
              <span className="lang-btn-native hidden sm:inline">{LANGUAGES.find((l) => l.id === lang)?.native}</span>
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('lang.tip')}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('lang.label')}</DropdownMenuLabel>
        {LANGUAGES.map((l) => (
          <DropdownMenuItem
            key={l.id}
            onClick={() => setLang(l.id)}
            className={cn('gap-2', l.id === lang && 'bg-primary/10')}
            aria-pressed={l.id === lang}
          >
            <span className="flex-1">
              <span className="font-medium">{l.native}</span>
              <span className="ml-1.5 text-[11px] text-muted-foreground">{l.english}</span>
            </span>
            {l.id === lang ? <Check size={13} className="text-emerald-600" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavigatorToggle() {
  const tt = useT();
  const navigatorOpen = useUiStore((s) => s.navigatorOpen);
  const toggleNavigator = useUiStore((s) => s.toggleNavigator);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('header-action max-sm:h-11 max-sm:w-11', navigatorOpen && 'bg-accent text-accent-foreground')}
          aria-label={tt('hdr.navigator')}
          aria-pressed={navigatorOpen}
          title={tt('hdr.navigator.tip')}
          onClick={toggleNavigator}
        >
          <ListTree size={17} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tt('hdr.navigator')}</TooltipContent>
    </Tooltip>
  );
}

function FocusModeToggle() {
  const tt = useT();
  const focusMode = useUiStore((s) => s.focusMode);
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode);
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('header-action max-sm:h-11 max-sm:w-11', focusMode && 'bg-accent text-accent-foreground')}
          aria-label={tt('app.focusMode')}
          aria-pressed={focusMode}
          title={tt('hdr.focus.tip')}
          onClick={toggleFocusMode}
        >
          <Focus size={17} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tt('hdr.focus.tip')}</TooltipContent>
    </Tooltip>
  );
}

function RenameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const tt = useT();
  const title = useEditorStore((s) => s.title);
  const rename = useEditorStore((s) => s.renameProject);
  const [value, setValue] = useState(title);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{tt('hdr.rename.title')}</DialogTitle>
        </DialogHeader>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={tt('hdr.rename.placeholder')} />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>{tt('hdr.cancel')}</Button>
          <Button onClick={() => { rename(value || tt('hdr.book.untitled')); onClose(); }}>{tt('hdr.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AppHeader() {
  const tt = useT();
  const ff = useFmtDate();
  const title = useEditorStore((s) => s.title);
  const projects = useEditorStore((s) => s.projects);
  const projectId = useEditorStore((s) => s.projectId);
  const createProject = useEditorStore((s) => s.createProject);
  const openProject = useEditorStore((s) => s.openProject);
  const duplicateProject = useEditorStore((s) => s.duplicateProject);
  const removeProject = useEditorStore((s) => s.removeProject);
  const openDialog = useUiStore((s) => s.open);

  const [renameOpen, setRenameOpen] = useState(false);
  // পুরো বই ডিলিট = সবচেয়ে বিপজ্জনক অ্যাকশন — এক ক্লিকে চুপচাপ নয়, নিশ্চিতকরণ নিই
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  // সম্পূর্ণ স্থানীয় তারিখ — ভাষা অনুযায়ী (বাংলা/हिन्दी/English)
  const now = ff(new Date());

  return (
    <header className="app-header no-print">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="app-logo" aria-hidden="true">
          <BookOpenCheck size={19} />
        </span>
        <div className="flex min-w-0 flex-col">
          <h1 className="app-title">{title}</h1>
          <span className="app-subtitle">{tt('app.tagline')}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <SaveIndicator />
        <span className="hidden text-xs text-muted-foreground md:inline">{now}</span>
        <LanguageSwitcher />
        <NavigatorToggle />
        <FocusModeToggle />
        <ThemeToggle />
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="header-action gap-1.5 max-sm:h-11 max-sm:w-11 max-sm:px-0"
                  aria-label={tt('hdr.menu.projects')}
                >
                  <Menu size={15} />
                  <span className="hidden sm:inline">{tt('hdr.menu.projects')}</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom">{tt('hdr.menu.projects')}</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuItem onClick={() => void createProject(tt('hdr.book.untitled'), false)}>
              <FilePlus2 size={14} /> {tt('hdr.menu.new')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenameOpen(true)}>
              <Pencil size={14} /> {tt('hdr.rename.btn')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => projectId && void duplicateProject(projectId)}>
              <Copy size={14} /> {tt('hdr.menu.duplicate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">{tt('hdr.menu.saved')}</DropdownMenuLabel>
            {projects.length === 0 ? (
              <DropdownMenuItem disabled>{tt('hdr.menu.none')}</DropdownMenuItem>
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
              <FolderOpen size={14} /> {tt('hdr.menu.all')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openDialog('snapshots')}>
              <History size={14} /> {tt('hdr.menu.snapshots')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              disabled={!projectId}
              onSelect={(e) => {
                e.preventDefault(); // মেনু বন্ধ হওয়ার পরে ডায়ালগ খুলবে
                setDeleteConfirm(true);
              }}
            >
              <Trash2 size={14} /> {tt('hdr.menu.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="header-action max-sm:h-11 max-sm:w-11"
              aria-label={tt('hdr.help')}
              title={tt('hdr.help')}
              onClick={() => openDialog('help')}
            >
              <CircleHelp size={17} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('hdr.help')}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="secondary"
              size="sm"
              className="header-action header-action-accent gap-1.5 max-sm:h-11 max-sm:w-11 max-sm:px-0"
              aria-label={tt('hdr.proofing')}
              onClick={() => openDialog('review')}
            >
              <PenLine size={14} />
              <span className="hidden sm:inline">{tt('hdr.proofing')}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{tt('hdr.proofing')}</TooltipContent>
        </Tooltip>
      </div>

      <RenameDialog key={renameOpen ? 'open' : 'closed'} open={renameOpen} onClose={() => setRenameOpen(false)} />

      <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tt('hdr.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tt('hdr.delete.desc').split('{title}').join(title)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt('hdr.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600"
              onClick={() => {
                if (projectId) void removeProject(projectId);
              }}
            >
              {tt('hdr.delete.yes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </header>
  );
}
