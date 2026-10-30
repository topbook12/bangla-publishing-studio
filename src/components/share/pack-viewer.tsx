/**
 * প্যাক-ভিউয়ার — লিংক দিয়ে প্যাক বিতরণ (?pack=<payload>) — দিন ৬২
 * ────────────────────────────────────────────────────────────────
 * ১০০% local-first: প্যাক JSON URL-এই বাহি থাকে (deflate+base64url), কোনো
 * সার্ভার-কল নেই। প্রাপক লিংক খুললে প্যাক-প্রিভিউ কার্ড (নাম/লেখক/নকশা-চিপ) →
 * "ইনস্টল" এক-ক্লিকে localStorage (bps.packs.v1) → স্টুডিওর DS উইজার্ড
 * ধাপ-১-এ "কমিউনিটি প্যাক" তালিকায় বসে যায়।
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Check, FolderOpen, Package, PackageOpen, PackagePlus, Sparkles, TriangleAlert,
} from 'lucide-react';
import { BrandMark } from '@/components/brand-mark';
import { Button } from '@/components/ui/button';
import { PPill, PTile } from '@/components/premium';
import { useT, useLangStore, useFmtNum } from '@/lib/i18n';
import { useViewStore } from '@/lib/view-store';
import { useUiStore } from '@/lib/ui-store';
import { track } from '@/lib/analytics';
import { decodePackUrl, packApproxKb } from '@/lib/pack-share';
import { installPack, type TemplatePack } from '@/lib/template-pack';
import { dsTemplateById } from '@/lib/document-studio';

type Phase = 'decoding' | 'ready' | 'bad' | 'installed';

export function PackViewer({ payload }: { payload: string }) {
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const nf = useFmtNum();
  const goStudio = useViewStore((s) => s.goStudio);
  const openDs = useUiStore((s) => s.open);

  const [phase, setPhase] = useState<Phase>('decoding');
  const [pack, setPack] = useState<TemplatePack | null>(null);

  useEffect(() => {
    track('pack_url_open');
    let alive = true;
    void (async () => {
      const decoded = await decodePackUrl(payload);
      if (!alive) return;
      if (decoded) {
        setPack(decoded);
        setPhase('ready');
      } else {
        setPhase('bad');
      }
    })();
    return () => { alive = false; };
  }, [payload]);

  const install = () => {
    if (!pack) return;
    try {
      installPack(pack);
      track('pack_url_installed');
      setPhase('installed');
    } catch {
      // localStorage-বাধা (প্রাইভেট-মোড) — প্যাক-তথ্য তবু দেখা যাবে
      setPhase('installed');
    }
  };

  const goWizard = () => {
    goStudio();
    window.setTimeout(() => openDs('documentStudio'), 400);
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-200/70 dark:bg-stone-900">
      {/* ব্যানার */}
      <header className="no-print sticky top-0 z-40 border-b border-stone-300/60 bg-white/90 px-4 py-2.5 backdrop-blur dark:border-stone-700 dark:bg-stone-950/90">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <BrandMark size={18} />
          <p className="min-w-0 flex-1 truncate text-sm font-bold">{tt('pkv.banner')}</p>
          <PPill tone="new">{tt('pkv.pill')}</PPill>
        </div>
      </header>

      <main className="flex flex-1 items-start justify-center px-3 py-8">
        <div className="w-full max-w-3xl">
          {phase === 'decoding' ? (
            <div className="flex h-52 items-center justify-center" role="status">
              <span className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-stone-300 border-t-stone-600" aria-label="Loading" />
            </div>
          ) : phase === 'bad' ? (
            <div className="rounded-2xl border border-stone-300 bg-white p-8 text-center dark:border-stone-700 dark:bg-stone-950">
              <TriangleAlert size={30} className="mx-auto text-amber-600" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold">{tt('pkv.bad')}</p>
              <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-muted-foreground">{tt('pkv.badHint')}</p>
              <Button onClick={goStudio} className="mt-4 bg-emerald-700 hover:bg-emerald-800">
                <Sparkles size={13} aria-hidden="true" /> {tt('pkv.goStudio')}
              </Button>
            </div>
          ) : pack ? (
            <div className="rounded-2xl border border-stone-300 bg-white p-5 shadow-sm sm:p-6 dark:border-stone-700 dark:bg-stone-950">
              {/* হেড */}
              <div className="flex flex-wrap items-center gap-2.5">
                <PTile size="md" tone="emerald" icon={phase === 'installed' ? PackageOpen : Package} />
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-base font-bold leading-snug sm:text-lg">{pack.name}</h1>
                  <p className="truncate text-[11.5px] text-muted-foreground">
                    {pack.author ? `${tt('pkv.by')} ${pack.author} · ` : ''}
                    {tt('pkv.kb').replace('{kb}', nf(packApproxKb(pack)))}
                  </p>
                </div>
                {phase === 'installed' ? <PPill tone="new">{tt('pkv.donePill')}</PPill> : null}
              </div>

              {pack.desc ? (
                <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">{pack.desc}</p>
              ) : null}

              {/* নকশা-চিপ */}
              <div className="mt-4">
                <p className="ai-field-label mb-1.5">
                  {tt('pkv.entries').replace('{n}', nf(pack.entries.length))}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {pack.entries.map((e) => {
                    const t = dsTemplateById(e.tplId);
                    const label = t ? (t.name[lang] || t.name.en) : e.tplId;
                    const sub = t ? (t.desc[lang] || t.desc.en) : '';
                    return (
                      <span
                        key={e.tplId}
                        className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-[11.5px] font-medium"
                        title={sub || label}
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" aria-hidden="true" />
                        <span className="truncate">{label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* অ্যাকশন */}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                {phase === 'installed' ? (
                  <>
                    <Button onClick={goWizard} className="gap-1.5 bg-emerald-700 font-semibold text-white hover:bg-emerald-800">
                      <FolderOpen size={14} aria-hidden="true" /> {tt('pkv.goWizard')}
                    </Button>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Check size={13} className="text-emerald-700" aria-hidden="true" /> {tt('pkv.doneHint')}
                    </p>
                  </>
                ) : (
                  <>
                    <Button onClick={install} className="gap-1.5 bg-emerald-700 font-semibold text-white hover:bg-emerald-800">
                      <PackagePlus size={14} aria-hidden="true" /> {tt('pkv.install')}
                    </Button>
                    <Button variant="outline" onClick={goStudio}>{tt('pkv.goStudio')}</Button>
                  </>
                )}
              </div>

              <p className="mt-4 border-t border-border pt-3 text-[10.5px] leading-snug text-muted-foreground">
                {tt('pkv.localNote')}
              </p>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="no-print mt-auto border-t border-stone-300/60 bg-white py-4 text-center text-xs text-muted-foreground dark:border-stone-700 dark:bg-stone-950">
        {tt('app.brand')} · {tt('land.footer.tag')}
        <span className="mx-1.5" aria-hidden="true">·</span>
        <span suppressHydrationWarning>
          {lang === 'en' ? 'Pack link — installs on your device only' : lang === 'hi' ? 'पैक लिंक — केवल आपके डिवाइस पर इंस्टॉल होता है' : 'প্যাক-লিংক — শুধু আপনার যন্ত্রেই ইনস্টল হয়'}
        </span>
      </footer>
    </div>
  );
}
