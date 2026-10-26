/**
 * শেয়ার ভিউ — রিড-অনলি পাবলিক ডকুমেন্ট (?share=<token>)
 *
 * আসল এডিটরের PaperPage + StaticContent রেন্ডারার পুনর্ব্যবহার করে — তাই
 * মার্জিন, কাগজের মাপ, হেডার-ফুটার, কভার, কাস্টম নোড সব হুবহু এডিটরের মতোই
 * দেখায়। কোনো সম্পাদনা সম্ভব নয়।
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { PaperPage } from '@/components/editor/paper-page';
import { StaticContent } from '@/components/editor/static-content';
import { useT, useLangStore } from '@/lib/i18n';
import { useViewStore } from '@/lib/view-store';
import { track } from '@/lib/analytics';
import { getPageDimensionsMm, mmToPx } from '@/lib/paper';
import type { DocumentSettings, PageData } from '@/lib/types';

interface SharedDoc {
  title: string;
  data: string;
  updatedAt: string;
  ownerName: string | null;
}

export function ShareViewer({ token }: { token: string }) {
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const goStudio = useViewStore((s) => s.goStudio);
  const [doc, setDoc] = useState<SharedDoc | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'notfound'>('loading');
  const [vw, setVw] = useState(1024);

  useEffect(() => {
    track('share_viewed');
    let alive = true;
    void (async () => {
      try {
        const res = await fetch(`/api/share/${encodeURIComponent(token)}`);
        if (!res.ok) {
          if (alive) setState('notfound');
          return;
        }
        const body = (await res.json()) as { document: SharedDoc };
        if (alive) {
          setDoc(body.document);
          setState('ok');
        }
      } catch {
        if (alive) setState('notfound');
      }
    })();
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    const onResize = () => setVw(window.innerWidth);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const parsed = useMemo(() => {
    if (!doc) return null;
    try {
      const body = JSON.parse(doc.data) as { settings?: DocumentSettings; pages?: PageData[] };
      if (!body.pages?.length) return null;
      return { settings: body.settings as DocumentSettings, pages: body.pages };
    } catch {
      return null;
    }
  }, [doc]);

  // ভিউপোর্টে ফিট করার স্কেল — মোবাইলে ছোট হয়, ডেস্কটপে ১:১
  const { scale, baseW } = useMemo(() => {
    if (!parsed) return { scale: 1, baseW: 794 };
    const first = parsed.pages[0];
    const s = parsed.settings;
    let widthMm = 210;
    try {
      const pSize = first?.paperSizeOverride ?? s?.paperSize ?? 'a4';
      const dims = getPageDimensionsMm(
        pSize,
        s?.orientation ?? 'portrait',
        s?.customPaper ?? { widthMm: 210, heightMm: 297 },
      );
      widthMm = dims.widthMm;
    } catch { /* ডিফল্ট A4 */ }
    const pageW = mmToPx(widthMm);
    return {
      scale: Math.min(1, Math.max(0.3, (vw - 48) / pageW)),
      baseW: pageW,
    };
  }, [parsed, vw]);

  return (
    <div className="flex min-h-screen flex-col bg-stone-200/70 dark:bg-stone-900">
      {/* ব্যানার */}
      <header className="no-print sticky top-0 z-40 border-b border-stone-300/60 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-stone-700 dark:bg-stone-950/90">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <BrandMark size={18} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{doc?.title ?? '…'}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {tt('share.view.banner')}
              {doc?.ownerName ? ` · ${tt('share.view.by')} ${doc.ownerName}` : ''}
            </p>
          </div>
          <Button
            size="sm"
            className="shrink-0 gap-1.5 rounded-full bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800"
            onClick={goStudio}
          >
            {tt('share.view.make')}
          </Button>
        </div>
      </header>

      <main className="flex flex-1 justify-center px-3 py-6">
        {state === 'loading' ? (
          <div className="flex h-64 items-center text-muted-foreground" role="status">
            <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" aria-label="Loading" />
          </div>
        ) : state === 'notfound' || !parsed ? (
          <div className="mt-20 max-w-md rounded-2xl border border-stone-300 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-950">
            <p className="text-sm font-semibold">{tt('share.view.notfound')}</p>
            <Button onClick={goStudio} className="mt-4 bg-emerald-700 hover:bg-emerald-800">
              {tt('share.view.make')}
            </Button>
          </div>
        ) : (
          <div
            className="share-pages"
            style={{
              width: baseW * scale,
            }}
          >
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'top left', width: baseW }}>
              <div className="flex flex-col items-center gap-6">
                {parsed.pages.map((page, i) => (
                  <PaperPage key={page.id} page={page} index={i} settings={parsed.settings} active={false}>
                    {page.kind === 'normal' ? <StaticContent html={page.html} /> : null}
                  </PaperPage>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="no-print mt-auto border-t border-stone-300/60 bg-white py-4 text-center text-xs text-muted-foreground dark:border-stone-700 dark:bg-stone-950">
        {tt('app.brand')} · {tt('land.footer.tag')}
        <span className="mx-1.5" aria-hidden="true">·</span>
        <span suppressHydrationWarning>{lang === 'en' ? 'Read-only shared document' : 'রিড-অনলি শেয়ার করা ডকুমেন্ট'}</span>
      </footer>
    </div>
  );
}
