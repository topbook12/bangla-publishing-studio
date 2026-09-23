/**
 * বাংলা পাবলিশিং স্টুডিও — মূল ক্লায়েন্ট অ্যাপ
 * (SSR এড়াতে dynamic import, ssr: false)
 */

'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-100 dark:bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">বাংলা পাবলিশিং স্টুডিও চালু হচ্ছে…</p>
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
