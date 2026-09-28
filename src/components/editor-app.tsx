/**
 * বাংলা পাবলিশিং স্টুডিও — মূল ক্লায়েন্ট অ্যাপ
 * (SSR এড়াতে dynamic import, ssr: false)
 */

'use client';

import { useEffect } from 'react';
import { BookOpenCheck, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { Ribbon } from '@/components/ribbon/ribbon-shell';
import { Workspace } from '@/components/editor/workspace';
import { StatusBar } from '@/components/status-bar';
import { Dialogs } from '@/components/dialogs/dialogs';
import { useEditorStore } from '@/lib/store';

export default function EditorApp() {
  const loaded = useEditorStore((s) => s.loaded);
  const init = useEditorStore((s) => s.init);

  useEffect(() => {
    void init();
  }, [init]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-100 dark:bg-slate-950">
        <div className="app-splash-mark" aria-hidden="true">
          <BookOpenCheck size={36} />
        </div>
        <div className="space-y-1 text-center">
          <p className="app-splash-title">বাংলা পাবলিশিং স্টুডিও</p>
          <p className="text-sm text-muted-foreground">স্টুডিও প্রস্তুত হচ্ছে…</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-primary/70" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="app-root flex h-screen flex-col overflow-hidden">
      <AppHeader />
      <Ribbon />
      <Workspace />
      <StatusBar />
      <Dialogs />
    </div>
  );
}
