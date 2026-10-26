/**
 * অ্যানালিটিক্স ড্যাশবোর্ড (?stats=1) — সাইন-ইন ছাড়া দেখা যায় না।
 * প্রাইভেসি-ফ্রেন্ডলি: শুধু ইভেন্ট-গণনা, কুকি/IP/ব্যক্তিগত তথ্য নেই।
 */

'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { AuthDialog } from '@/components/auth/auth-dialog';
import { useT } from '@/lib/i18n';
import { useViewStore } from '@/lib/view-store';

interface Stats {
  totals: Record<string, number>;
  last7: Record<string, number>;
  last30: Record<string, number>;
  daily: Array<{ day: string; event: string; count: number }>;
}

const EVENTS = ['landing_view', 'studio_open', 'cloud_doc_save', 'share_created', 'share_viewed', 'tour_completed'] as const;
const DAILY_EVENTS = ['landing_view', 'studio_open', 'cloud_doc_save', 'share_viewed'] as const;

const DAILY_COLORS: Record<string, string> = {
  landing_view: 'bg-emerald-500',
  studio_open: 'bg-emerald-700',
  cloud_doc_save: 'bg-amber-500',
  share_viewed: 'bg-rose-400',
};

export function StatsDashboard() {
  const tt = useT();
  const { data: session } = useSession();
  const goStudio = useViewStore((s) => s.goStudio);
  const [stats, setStats] = useState<Stats | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  // loading ডেরাইভড — সাইন-ইন থাকলে ডেটা না আসা পর্যন্ত লোডিং
  const loading = Boolean(session) && stats === null;

  useEffect(() => {
    let alive = true;
    if (!session) return;
    void (async () => {
      try {
        const res = await fetch('/api/analytics');
        if (res.ok) {
          const body = (await res.json()) as Stats;
          if (alive) setStats(body);
        }
      } catch { /* ignore */ }
      // ব্যর্থ হলেও স্পিনার আটকে থাকবে না — খালি স্ট্যাট
      if (alive) setStats((s) => s ?? { totals: {}, last7: {}, last30: {}, daily: [] });
    })();
    return () => { alive = false; };
  }, [session]);

  const maxDaily = stats
    ? Math.max(1, ...stats.daily.map((d) => d.count))
    : 1;

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 dark:bg-stone-950">
      <header className="border-b border-stone-200 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
        <div className="mx-auto flex w-full max-w-4xl items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5" onClick={goStudio}>
            <ArrowLeft size={14} /> {tt('stats.back')}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
        <h1 className="text-xl font-extrabold sm:text-2xl">{tt('stats.title')}</h1>
        <p className="mt-1 text-xs text-muted-foreground">{tt('stats.desc')}</p>

        {!session ? (
          <div className="mt-8 rounded-2xl border border-dashed border-emerald-700/40 bg-emerald-700/5 p-8 text-center">
            <p className="text-sm font-semibold">{tt('stats.needsignin')}</p>
            <Button onClick={() => setAuthOpen(true)} className="mt-4 bg-emerald-700 hover:bg-emerald-800">
              {tt('auth.signin')}
            </Button>
          </div>
        ) : loading ? (
          <div className="flex h-48 items-center justify-center text-muted-foreground" role="status">
            <Loader2 className="animate-spin" size={22} />
          </div>
        ) : stats ? (
          <div className="mt-6 space-y-8">
            {/* ইভেন্ট-কার্ড */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EVENTS.map((ev) => (
                <div key={ev} className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                  <p className="text-xs font-semibold text-muted-foreground">{tt(`stats.ev.${ev}`)}</p>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-extrabold tabular-nums">{stats.totals[ev] ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">{tt('stats.total')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{stats.last7[ev] ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">{tt('stats.last7')}</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold tabular-nums">{stats.last30[ev] ?? 0}</p>
                      <p className="text-[10px] text-muted-foreground">{tt('stats.last30')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ১৪ দিনের ধারা — pure CSS bar chart */}
            <section aria-labelledby="daily-h">
              <h2 id="daily-h" className="mb-3 text-sm font-bold">{tt('stats.daily.title')}</h2>
              <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                <div className="flex items-end gap-2 overflow-x-auto pb-2" style={{ height: 160 }}>
                  {buildDailyBuckets(stats.daily).map((b) => (
                    <div key={b.day} className="flex min-w-9 flex-1 flex-col items-center gap-1">
                      <div className="flex h-32 w-full items-end justify-center gap-0.5">
                        {DAILY_EVENTS.map((ev) => {
                          const v = b.events[ev] ?? 0;
                          return v > 0 ? (
                            <div
                              key={ev}
                              className={`w-2 rounded-t ${DAILY_COLORS[ev]}`}
                              style={{ height: `${Math.max(4, (v / maxDaily) * 100)}%` }}
                              title={`${tt(`stats.ev.${ev}`)}: ${v}`}
                            />
                          ) : null;
                        })}
                        {DAILY_EVENTS.every((ev) => !b.events[ev]) ? (
                          <div className="h-1 w-2 rounded-t bg-stone-200 dark:bg-stone-800" />
                        ) : null}
                      </div>
                      <span className="text-[9px] text-muted-foreground">{b.day.slice(5)}</span>
                    </div>
                  ))}
                  {buildDailyBuckets(stats.daily).length === 0 ? (
                    <p className="text-xs text-muted-foreground">—</p>
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                  {DAILY_EVENTS.map((ev) => (
                    <span key={ev} className="flex items-center gap-1">
                      <span className={`inline-block h-2 w-2 rounded-sm ${DAILY_COLORS[ev]}`} aria-hidden="true" />
                      {tt(`stats.ev.${ev}`)}
                    </span>
                  ))}
                </div>
              </div>
            </section>
          </div>
        ) : null}
      </main>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

/** দৈনিক ইভেন্ট → শেষ ১৪ দিনের বাকেট (খালি দিনসহ) */
function buildDailyBuckets(daily: Stats['daily']): Array<{ day: string; events: Record<string, number> }> {
  const byDay = new Map<string, Record<string, number>>();
  for (const d of daily) {
    const cur = byDay.get(d.day) ?? {};
    cur[d.event] = (cur[d.event] ?? 0) + d.count;
    byDay.set(d.day, cur);
  }
  const out: Array<{ day: string; events: Record<string, number> }> = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10);
    out.push({ day, events: byDay.get(day) ?? {} });
  }
  return out;
}
