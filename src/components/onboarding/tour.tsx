/**
 * অনবোর্ডিং ট্যুর — প্রথমবার স্টুডিওতে ঢোকা ব্যবহারকারীর জন্য ৬ ধাপের
 * স্পটলাইট গাইড (localStorage 'bwp-tour-done' না থাকলে একবার চলে)।
 *
 * প্রযুক্তি: টার্গেট এলিমেন্টের rect-এ fixed কাটআউট (box-shadow 9999px),
 * টুলটিপ কার্ড স্ক্রিনের ভেতরে clamp করা। এলিমেন্ট না পেলে সেন্টার-কার্ড ফলব্যাক।
 */

'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useT } from '@/lib/i18n';
import { track } from '@/lib/analytics';

const TOUR_KEY = 'bwp-tour-done';

interface TourStep {
  /** টার্গেট CSS সিলেক্টর — null হলে সেন্টার-কার্ড */
  sel: string | null;
  titleKey: string;
  descKey: string;
}

const STEPS: TourStep[] = [
  { sel: null, titleKey: 'tour.s1.t', descKey: 'tour.s1.d' },
  { sel: '[data-tour="ribbon"]', titleKey: 'tour.s2.t', descKey: 'tour.s2.d' },
  { sel: '[data-tour="canvas"]', titleKey: 'tour.s3.t', descKey: 'tour.s3.d' },
  { sel: '[data-tour="navigator"]', titleKey: 'tour.s4.t', descKey: 'tour.s4.d' },
  { sel: '[data-tour="templates"]', titleKey: 'tour.s5.t', descKey: 'tour.s5.d' },
  { sel: '[data-tour="account"]', titleKey: 'tour.s6.t', descKey: 'tour.s6.d' },
];

interface Rect { top: number; left: number; width: number; height: number }

export function OnboardingTour() {
  const tt = useT();
  const [step, setStep] = useState(0);
  const [active, setActive] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  const current = STEPS[step];

  useEffect(() => {
    try {
      if (localStorage.getItem(TOUR_KEY) === '1') return;
    } catch { return; }
    // এডিটর লোড/রেন্ডার শেষ হওয়া পর্যন্ত একটু অপেক্ষা
    const t = setTimeout(() => setActive(true), 1200);
    return () => clearTimeout(t);
  }, []);

  const measure = useCallback(() => {
    if (!current?.sel) { setRect(null); return; }
    const el = document.querySelector(current.sel);
    if (!el) { setRect(null); return; }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [current]);

  useLayoutEffect(() => {
    if (!active) return;
    // রিফ্লো শেষে মাপা — setState সিঙ্ক্রোনাস ইফেক্ট-বডিতে নয় (cascading render এড়াতে)
    let raf = requestAnimationFrame(measure);
    const remeasure = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', remeasure);
    window.addEventListener('scroll', remeasure, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', remeasure);
      window.removeEventListener('scroll', remeasure, true);
    };
  }, [active, measure]);

  const finish = useCallback(() => {
    setActive(false);
    try { localStorage.setItem(TOUR_KEY, '1'); } catch { /* ignore */ }
    track('tour_completed');
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); finish(); }
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        e.preventDefault();
        setStep((s) => (s < STEPS.length - 1 ? s + 1 : (finish(), s)));
      }
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active, finish]);

  if (!active) return null;

  const pad = 8;
  const hasRect = rect !== null && rect.width > 0;

  // টুলটিপ অবস্থান — টার্গেটের নিচে (জায়গা না থাকলে উপরে); সেন্টার-কার্ড ফলব্যাক
  const tipW = Math.min(360, (rect ? rect.left : window.innerWidth) + (rect ? window.innerWidth - rect.left - rect.width : 0) || 360);
  const tipStyle: React.CSSProperties = hasRect
    ? {
        top: Math.min(
          window.innerHeight - 200,
          Math.max(12, rect!.top + rect!.height + pad + 8),
        ),
        left: Math.max(12, Math.min(window.innerWidth - Math.min(tipW, 360) - 12, rect!.left)),
        width: Math.min(tipW, 360),
      }
    : {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(92vw, 380px)',
      };

  return (
    <div className="no-print" role="dialog" aria-modal="true" aria-label={tt(current.titleKey)}>
      {/* কাটআউট স্পটলাইট */}
      {hasRect ? (
        <div
          className="pointer-events-none fixed z-[90] rounded-xl ring-2 ring-emerald-500/90 transition-all duration-300"
          style={{
            top: rect!.top - pad,
            left: rect!.left - pad,
            width: rect!.width + pad * 2,
            height: rect!.height + pad * 2,
            boxShadow: '0 0 0 9999px rgba(15, 15, 15, 0.55)',
          }}
          aria-hidden="true"
        />
      ) : (
        <div className="pointer-events-none fixed inset-0 z-[90] bg-black/55" aria-hidden="true" />
      )}

      {/* টুলটিপ কার্ড */}
      <div
        className="fixed z-[100] rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl dark:border-stone-700 dark:bg-stone-900"
        style={tipStyle}
      >
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
          {tt('tour.step')} {step + 1} {tt('tour.of')} {STEPS.length}
        </p>
        <h3 className="mb-1.5 text-base font-extrabold">{tt(current.titleKey)}</h3>
        <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-300">{tt(current.descKey)}</p>

        <div className="mt-4 flex items-center gap-2">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? 'w-5 bg-emerald-700' : 'w-1.5 bg-stone-300 dark:bg-stone-700'}`}
              />
            ))}
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={finish}>
            {tt('tour.skip')}
          </Button>
          {step > 0 ? (
            <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => setStep(step - 1)}>
              {tt('tour.back')}
            </Button>
          ) : null}
          <Button
            size="sm"
            className="h-8 gap-1 bg-emerald-700 text-xs text-white hover:bg-emerald-800"
            onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : finish())}
          >
            {step < STEPS.length - 1 ? tt('tour.next') : tt('tour.finish')}
          </Button>
        </div>
      </div>
    </div>
  );
}
