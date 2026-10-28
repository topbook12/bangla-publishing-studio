/**
 * অ্যানালিটিক্স ড্যাশবোর্ড (?stats=1) — সাইন-ইন ছাড়া দেখা যায় না।
 * প্রাইভেসি-ফ্রেন্ডলি: শুধু ইভেন্ট-গণনা, কুকি/IP/ব্যক্তিগত তথ্য নেই।
 */

'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, MessageSquareHeart } from 'lucide-react';
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

/** সাইকেল-১ — ফিডব্যাক এগ্রিগেট (GET /api/feedback) */
interface FeedbackData {
  total: number;
  avg: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byRating: Record<string, number>;
  recent: Array<{
    id: string;
    rating: number;
    category: string;
    message: string;
    page: string;
    status: string;
    createdAt: string;
  }>;
}

const FB_CATEGORIES = ['bug', 'idea', 'praise', 'question', 'other'] as const;
const CAT_LABEL_KEY: Record<string, string> = {
  bug: 'fb.cat.bug', idea: 'fb.cat.idea', praise: 'fb.cat.praise', question: 'fb.cat.question', other: 'fb.cat.other',
};
const CAT_CHIP_CLASS: Record<string, string> = {
  bug: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  idea: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  praise: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  question: 'bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300',
  other: 'bg-stone-100 text-stone-700 dark:bg-stone-900 dark:text-stone-300',
};
const STATUS_ORDER = ['new', 'triaged', 'done'] as const;
const STATUS_CHIP: Record<string, string> = {
  new: 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
  triaged: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  done: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
};

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
  const [fb, setFb] = useState<FeedbackData | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  // loading ডেরাইভড — সাইন-ইন থাকলে ডেটা না আসা পর্যন্ত লোডিং
  const loading = Boolean(session) && stats === null;

  useEffect(() => {
    let alive = true;
    if (!session) return;
    void (async () => {
      try {
        const [res, fbRes] = await Promise.all([fetch('/api/analytics'), fetch('/api/feedback')]);
        if (res.ok) {
          const body = (await res.json()) as Stats;
          if (alive) setStats(body);
        }
        if (fbRes.ok) {
          const body = (await fbRes.json()) as FeedbackData;
          if (alive) setFb(body);
        }
      } catch { /* ignore */ }
      // ব্যর্থ হলেও স্পিনার আটকে থাকবে না — খালি স্ট্যাট
      if (alive) setStats((s) => s ?? { totals: {}, last7: {}, last30: {}, daily: [] });
    })();
    return () => { alive = false; };
  }, [session]);

  /** লুপ-বন্ধকরণ — স্টেটাস এক ধাপ এগিয়ে (new → triaged → done) */
  const advanceStatus = async (id: string) => {
    const item = fb?.recent.find((r) => r.id === id);
    if (!item) return;
    const next = STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(item.status as 'new') + 1, 2)];
    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok && fb) {
        const byStatus = { ...fb.byStatus };
        byStatus[item.status] = Math.max(0, (byStatus[item.status] ?? 1) - 1);
        byStatus[next] = (byStatus[next] ?? 0) + 1;
        setFb({
          ...fb,
          byStatus,
          recent: fb.recent.map((r) => (r.id === id ? { ...r, status: next } : r)),
        });
      }
    } catch { /* নীরব — পরে আবার চেষ্টা করা যাবে */ }
  };

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

            {/* সাইকেল-১ — মতামত সেকশন: ব্যবহারকারীর কণ্ঠস্বর */}
            <section aria-labelledby="fb-h">
              <h2 id="fb-h" className="mb-3 flex items-center gap-1.5 text-sm font-bold">
                <MessageSquareHeart size={15} className="text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                {tt('fb.dash.title')}
              </h2>
              <p className="-mt-2 mb-3 text-xs text-muted-foreground">{tt('fb.dash.desc')}</p>

              {!fb || fb.total === 0 ? (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-6 text-center text-xs text-muted-foreground dark:border-stone-700 dark:bg-stone-900">
                  {tt('fb.dash.empty')}
                </div>
              ) : (
                <div className="space-y-3">
                  {/* গড় + মোট + রেটিং-বণ্টন */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                      <div className="grid grid-cols-2 gap-3 text-center">
                        <div>
                          <p className="text-2xl font-extrabold tabular-nums text-amber-500">{fb.avg}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground">{tt('fb.dash.avg')} / 5</p>
                        </div>
                        <div>
                          <p className="text-2xl font-extrabold tabular-nums">{fb.total}</p>
                          <p className="text-[10px] font-semibold text-muted-foreground">{tt('fb.dash.total')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
                      <p className="mb-2 text-[10px] font-semibold text-muted-foreground">{tt('fb.dash.byRating')}</p>
                      <div className="space-y-1">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = fb.byRating[String(star)] ?? 0;
                          const pct = Math.round((count / Math.max(1, fb.total)) * 100);
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="w-3 text-right text-[10px] font-bold tabular-nums text-muted-foreground">{star}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                                <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
                              </div>
                              <span className="w-6 text-[10px] tabular-nums text-muted-foreground">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* বিভাগ চিপ */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground">{tt('fb.dash.byCategory')}:</span>
                    {FB_CATEGORIES.map((c) => (
                      <span
                        key={c}
                        className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-semibold ${CAT_CHIP_CLASS[c]}`}
                      >
                        {tt(CAT_LABEL_KEY[c])} · {fb.byCategory[c] ?? 0}
                      </span>
                    ))}
                  </div>

                  {/* সাম্প্রতিক তালিকা + স্টেটাস অ্যাডভান্স */}
                  <div className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                    <p className="mb-2 text-[10px] font-semibold text-muted-foreground">{tt('fb.dash.recent')}</p>
                    <ul className="max-h-80 space-y-2 overflow-y-auto">
                      {fb.recent.map((r) => (
                        <li key={r.id} className="rounded-xl border border-stone-100 p-3 dark:border-stone-800">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-bold tabular-nums text-amber-500" aria-label={`rating ${r.rating}/5`}>
                              {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                            </span>
                            <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${CAT_CHIP_CLASS[r.category] ?? CAT_CHIP_CLASS.other}`}>
                              {tt(CAT_LABEL_KEY[r.category] ?? 'fb.cat.other')}
                            </span>
                            <span className={`inline-flex h-5 items-center rounded-full px-2 text-[10px] font-semibold ${STATUS_CHIP[r.status] ?? STATUS_CHIP.new}`}>
                              {tt(`fb.dash.status.${r.status}` as 'fb.dash.status.new')}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{r.page}</span>
                            {r.status !== 'done' && (
                              <button
                                type="button"
                                onClick={() => void advanceStatus(r.id)}
                                title={tt('fb.dash.nextStatus')}
                                className="ml-auto inline-flex h-6 items-center rounded-md border px-2 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                              >
                                → {tt(`fb.dash.status.${STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(r.status as 'new') + 1, 2)]}` as 'fb.dash.status.new')}
                              </button>
                            )}
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed">{r.message}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
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
