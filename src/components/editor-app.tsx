/**
 * বাংলা পাবলিশিং স্টুডিও — মূল ক্লায়েন্ট অ্যাপ
 * (SSR এড়াতে dynamic import, ssr: false)
 */

'use client';

import { useEffect } from 'react';
import { Minimize2 } from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { AppHeader } from '@/components/app-header';
import { Ribbon } from '@/components/ribbon/ribbon-shell';
import { Workspace } from '@/components/editor/workspace';
import { NavigatorPanel } from '@/components/navigator/navigator-panel';
import { StatusBar } from '@/components/status-bar';
import { Dialogs } from '@/components/dialogs/dialogs';
import { AiChatPanel } from '@/components/editor/ai-chat-panel';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { useAutoToc } from '@/lib/toc';
import { useT, useLangStore } from '@/lib/i18n';
import { cn } from '@/lib/utils';

export default function EditorApp() {
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const loaded = useEditorStore((s) => s.loaded);
  const init = useEditorStore((s) => s.init);
  const navigatorOpen = useUiStore((s) => s.navigatorOpen);
  const focusMode = useUiStore((s) => s.focusMode);
  const setFocusMode = useUiStore((s) => s.setFocusMode);
  const toggleFocusMode = useUiStore((s) => s.toggleFocusMode);

  useEffect(() => {
    void init();
  }, [init]);

  // <html lang> ভাষা অনুযায়ী সিঙ্ক — স্ক্রিন রিডার ও সঠিক অক্ষর-রূপায়ণের জন্য
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // অটো-সূচিপত্র — শিরোনাম বদলালে TOC ব্লক নিজে থেকেই হালনাগাদ হয় (ডিবাউন্সড)
  useAutoToc();

  // ফোকাস-মোড কীবোর্ড শর্টকাট — Ctrl+Shift+F টগল, Esc বেরিয়ে যাওয়া
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && (e.key === 'f' || e.key === 'F')) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      if (e.key === 'Escape' && useUiStore.getState().focusMode) {
        // রাডিক্স ডায়ালগ খোলা থাকলে Esc সেটাকেই বন্ধ করুক — হাইজ্যাক নয়
        if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return;
        e.preventDefault();
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setFocusMode, toggleFocusMode]);

  if (!loaded) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-stone-100 dark:bg-stone-950">
        <div className="app-splash-mark" aria-hidden="true">
          <BrandMark size={36} />
        </div>
        <div className="space-y-2 text-center">
          <p className="flex items-center justify-center gap-2">
            <span className="app-splash-title">{tt('app.brand')}</span>
            <span className="pro-badge pro-badge-lg" title={tt('app.pro.tip')}>PRO</span>
          </p>
          <p className="text-sm text-muted-foreground">{tt('app.preparing')}</p>
          <div className="splash-bar mx-auto" role="progressbar" aria-label={tt('app.preparing')}>
            <span />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('app-root flex h-screen flex-col overflow-hidden', focusMode && 'focus-mode')}>
      <AppHeader />
      <Ribbon />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {navigatorOpen ? <NavigatorPanel /> : null}
        <Workspace />
      </div>
      <StatusBar />
      <Dialogs />
      {/* AI চ্যাট — ডান পাশের প্রফেশনাল কথোপকথন প্যানেল */}
      <AiChatPanel />
      {focusMode ? (
        <button
          type="button"
          className="focus-exit-pill no-print"
          onClick={() => setFocusMode(false)}
          aria-label={tt('app.focusExit')}
          title={tt('app.focusExit')}
        >
          <Minimize2 size={12} aria-hidden="true" />
          <span>{tt('app.focusMode')}</span>
          <span aria-hidden="true" className="opacity-50">·</span>
          <kbd>Esc</kbd>
        </button>
      ) : null}
    </div>
  );
}
