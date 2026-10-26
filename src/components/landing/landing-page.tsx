/**
 * পাবলিক ল্যান্ডিং পেজ — ফেজ-৩ (দিন ২১–৩০)
 *
 * প্রথম-সাক্ষাতের পেজ: hero + ফিচার + ধাপ + ব্যবহারকারীর কথা + FAQ + ফুটার।
 * পুরোটাই ব্র্যান্ড-সবুজ, কোনো বাইরের ছবি নেই (A4 মকআপ pure CSS) — অফলাইনেও নিখুঁত।
 */

'use client';

import { useEffect } from 'react';
import {
  BookOpen, Braces, Check, Cloud, FileText, GraduationCap,
  Languages, Printer, Sparkles, WifiOff,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { BrandMark } from '@/components/brand-mark';
import { useT, useLangStore } from '@/lib/i18n';
import { useViewStore } from '@/lib/view-store';
import { track } from '@/lib/analytics';

const LANGS: Array<{ id: 'bn' | 'hi' | 'en'; label: string }> = [
  { id: 'bn', label: 'বাং' },
  { id: 'hi', label: 'हिं' },
  { id: 'en', label: 'EN' },
];

/** CSS দিয়ে বানানো ছাপা-হওয়া A4 পাতার মকআপ — ছবি ছাড়াই প্রোডাক্টের ভাব */
function PaperMock() {
  return (
    <div className="relative mx-auto w-full max-w-sm" aria-hidden="true">
      <div className="paper-mock rotate-2 rounded-md bg-white p-5 shadow-xl ring-1 ring-black/5">
        <div className="mb-3 flex items-center justify-between border-b-2 border-emerald-700/70 pb-2">
          <div className="h-2.5 w-20 rounded bg-emerald-800/80" />
          <div className="h-2 w-10 rounded bg-stone-300" />
        </div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-2/3 rounded bg-stone-700/85" />
          <div className="h-2 w-full rounded bg-stone-300" />
          <div className="h-2 w-full rounded bg-stone-300" />
          <div className="h-2 w-11/12 rounded bg-stone-300" />
          <div className="mt-3 h-2.5 w-1/3 rounded bg-emerald-700/70" />
          <div className="h-2 w-full rounded bg-stone-300" />
          <div className="h-2 w-5/6 rounded bg-stone-300" />
          <div className="h-2 w-full rounded bg-stone-300" />
          <div className="h-2 w-4/5 rounded bg-stone-300" />
          <div className="mt-3 h-2.5 w-1/4 rounded bg-emerald-700/70" />
          <div className="h-2 w-full rounded bg-stone-300" />
          <div className="h-2 w-2/3 rounded bg-stone-300" />
        </div>
        <div className="mt-4 flex items-end justify-between border-t border-stone-200 pt-2">
          <div className="h-1.5 w-14 rounded bg-stone-300" />
          <div className="h-1.5 w-6 rounded bg-emerald-700/60" />
        </div>
      </div>
      <div className="paper-mock absolute -bottom-5 -left-4 -z-10 -rotate-6 rounded-md bg-white/90 p-4 shadow-lg ring-1 ring-black/5 sm:-left-8">
        <div className="space-y-1.5">
          <div className="h-2.5 w-16 rounded bg-red-800/70" />
          <div className="h-1.5 w-24 rounded bg-stone-300" />
          <div className="h-1.5 w-20 rounded bg-stone-300" />
          <div className="mt-1.5 h-1.5 w-24 rounded bg-stone-300" />
          <div className="h-1.5 w-16 rounded bg-stone-300" />
        </div>
      </div>
      <div className="absolute -right-3 -top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[10px] font-bold text-white shadow-md sm:-right-6">
        A4
      </div>
    </div>
  );
}

export function LandingPage() {
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const setLang = useLangStore((s) => s.setLang);
  const goStudio = useViewStore((s) => s.goStudio);

  useEffect(() => {
    track('landing_view');
  }, []);

  const openCta = tt('land.cta.primary').split('—')[0].trim();

  const features = [
    { icon: BookOpen, t: tt('land.f1.title'), d: tt('land.f1.desc') },
    { icon: FileText, t: tt('land.f2.title'), d: tt('land.f2.desc') },
    { icon: Braces, t: tt('land.f3.title'), d: tt('land.f3.desc') },
    { icon: Cloud, t: tt('land.f4.title'), d: tt('land.f4.desc') },
    { icon: Sparkles, t: tt('land.f5.title'), d: tt('land.f5.desc') },
    { icon: WifiOff, t: tt('land.f6.title'), d: tt('land.f6.desc') },
  ];

  const steps = [
    { t: tt('land.how1.t'), d: tt('land.how1.d') },
    { t: tt('land.how2.t'), d: tt('land.how2.d') },
    { t: tt('land.how3.t'), d: tt('land.how3.d') },
  ];

  const quotes = [tt('land.quote1'), tt('land.quote2'), tt('land.quote3')];

  const faqs = [
    { q: tt('land.faq1.q'), a: tt('land.faq1.a') },
    { q: tt('land.faq2.q'), a: tt('land.faq2.a') },
    { q: tt('land.faq3.q'), a: tt('land.faq3.a') },
    { q: tt('land.faq4.q'), a: tt('land.faq4.a') },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100">
      {/* ─── হেডার ─── */}
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-stone-50/85 backdrop-blur dark:border-stone-800 dark:bg-stone-950/85">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <button
            type="button"
            onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex items-center gap-2 rounded-md px-1 py-1 focus-visible:outline-2 focus-visible:outline-emerald-700"
            aria-label={tt('app.brand')}
          >
            <BrandMark size={22} />
            <span className="max-w-32 truncate text-base font-bold tracking-tight sm:max-w-none">{tt('app.brand')}</span>
          </button>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center rounded-full border border-stone-300 p-0.5 dark:border-stone-700" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLang(l.id)}
                  aria-pressed={lang === l.id}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                    lang === l.id
                      ? 'bg-emerald-700 text-white'
                      : 'text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <Button
              onClick={goStudio}
              className="gap-1.5 rounded-full bg-emerald-700 px-4 font-semibold text-white hover:bg-emerald-800"
            >
              {openCta}
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ─── হিরো ─── */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(28,107,76,0.10),transparent)]" aria-hidden="true" />
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
            <div className="text-center md:text-start">
              <p className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-700/25 bg-emerald-700/10 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                <Check size={13} aria-hidden="true" /> {tt('land.badge')}
              </p>
              <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-[2.7rem]">
                {tt('land.hero.title')}
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-stone-600 dark:text-stone-300 md:mx-0">
                {tt('land.hero.sub')}
              </p>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row sm:justify-center md:justify-start">
                <Button
                  onClick={goStudio}
                  className="h-12 gap-2 rounded-full bg-emerald-700 px-7 text-base font-bold text-white shadow-lg shadow-emerald-700/20 hover:bg-emerald-800"
                >
                  <BookOpen size={18} aria-hidden="true" /> {tt('land.cta.primary')}
                </Button>
                <a
                  href="#how"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-stone-300 px-6 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-100 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  {tt('land.cta.secondary')}
                </a>
              </div>
              <p className="mt-5 text-xs text-stone-500 dark:text-stone-400">
                {tt('land.footer.made')} · <Languages size={11} className="inline align-[-1px]" aria-hidden="true" /> বাংলা · हिन्दी · English
              </p>
            </div>
            <div className="pb-6 md:pb-0">
              <PaperMock />
            </div>
          </div>
        </section>

        {/* ─── ফিচার ─── */}
        <section className="border-y border-stone-200 bg-white py-14 dark:border-stone-800 dark:bg-stone-900/40" aria-labelledby="features-h">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 id="features-h" className="sr-only">{tt('land.how.title')}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f) => (
                <article
                  key={f.t}
                  className="group rounded-2xl border border-stone-200 bg-stone-50 p-5 transition-all hover:-translate-y-0.5 hover:border-emerald-700/40 hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
                >
                  <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700/10 text-emerald-700 dark:text-emerald-300">
                    <f.icon size={20} aria-hidden="true" />
                  </span>
                  <h3 className="mb-1.5 text-base font-bold">{f.t}</h3>
                  <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{f.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ─── কীভাবে কাজ করে ─── */}
        <section id="how" className="py-14" aria-labelledby="how-h">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 id="how-h" className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">{tt('land.how.title')}</h2>
            <ol className="grid gap-5 md:grid-cols-3">
              {steps.map((s, i) => (
                <li key={s.t} className="relative rounded-2xl border border-stone-200 bg-white p-6 dark:border-stone-800 dark:bg-stone-900/60">
                  <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <h3 className="mb-1.5 text-base font-bold">{s.t}</h3>
                  <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ─── ব্যবহারকারীর কথা ─── */}
        <section className="border-y border-stone-200 bg-white py-14 dark:border-stone-800 dark:bg-stone-900/40" aria-labelledby="quote-h">
          <div className="mx-auto w-full max-w-6xl px-4">
            <h2 id="quote-h" className="mb-8 text-center text-2xl font-extrabold sm:text-3xl">{tt('land.quote.title')}</h2>
            <div className="grid gap-5 md:grid-cols-3">
              {quotes.map((q, i) => (
                <figure key={i} className="rounded-2xl bg-stone-50 p-6 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
                  <blockquote className="text-sm leading-relaxed text-stone-700 dark:text-stone-200">{q}</blockquote>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="py-14" aria-labelledby="faq-h">
          <div className="mx-auto w-full max-w-3xl px-4">
            <h2 id="faq-h" className="mb-6 text-center text-2xl font-extrabold sm:text-3xl">{tt('land.faq.title')}</h2>
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-start text-sm font-bold sm:text-base">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* ─── শেষ CTA ─── */}
        <section className="pb-16">
          <div className="mx-auto w-full max-w-4xl px-4">
            <div className="rounded-3xl bg-emerald-800 px-6 py-10 text-center text-white shadow-xl sm:px-10">
              <Printer size={28} className="mx-auto mb-3 opacity-90" aria-hidden="true" />
              <h2 className="text-balance text-2xl font-extrabold sm:text-3xl">{tt('land.hero.title')}</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-emerald-100/90">{tt('land.hero.sub')}</p>
              <Button
                onClick={goStudio}
                className="mt-6 h-12 gap-2 rounded-full bg-white px-7 text-base font-bold text-emerald-800 hover:bg-emerald-50"
              >
                <GraduationCap size={18} aria-hidden="true" /> {tt('land.cta.primary')}
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* ─── ফুটার (sticky bottom — mt-auto) ─── */}
      <footer className="mt-auto border-t border-stone-200 bg-white py-6 dark:border-stone-800 dark:bg-stone-950">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 px-4 text-xs text-stone-500 dark:text-stone-400 sm:flex-row">
          <p className="flex items-center gap-1.5">
            <BrandMark size={14} /> {tt('land.footer.tag')}
          </p>
          <nav aria-label="Footer" className="flex items-center gap-4">
            <button type="button" onClick={goStudio} className="hover:text-emerald-700 hover:underline">
              {openCta}
            </button>
            <button
              type="button"
              onClick={() => useViewStore.getState().goStats()}
              className="hover:text-emerald-700 hover:underline"
            >
              {tt('stats.title').split('—')[0].trim()}
            </button>
          </nav>
          <p>© {new Date().getFullYear()} {tt('app.brand')} — {tt('land.footer.made')}</p>
        </div>
      </footer>
    </div>
  );
}
