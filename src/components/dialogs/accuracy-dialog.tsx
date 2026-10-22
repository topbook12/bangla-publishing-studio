/**
 * নির্ভুলতা কেন্দ্র (Accuracy Center) — ডায়ালগ
 * ────────────────────────────────────────────
 * লেখা/প্রশ্নের নির্ভুলতা যাচাই: লোকাল নির্ণায়ক যাচাই (গণিত, টাইপোগ্রাফি,
 * MCQ-কাঠামো, অফলাইন বানান — তাৎক্ষণিক) + AI গভীর যাচাই (বানান, ব্যাকরণ,
 * তথ্য, প্রশ্ন-গঠন)। প্রতিটি সমস্যার কার্ডে মূল → সংশোধন diff, কারণ ও
 * এক-ক্লিক প্রয়োগ। ক্যাটাগরি-ফিল্টার চিপ, নিশ্চয়তা-ব্যাজ, বাতিলযোগ্য রান।
 * বিস্তারিত ইঞ্জিন: src/lib/ai-verify.ts
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle, BadgeCheck, Ban, BookPlus, CheckCheck, CircleAlert, Crosshair, Info,
  Loader2, PenLine, RotateCcw, ShieldCheck, Sparkles,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PHero } from '@/components/premium';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { useUiStore } from '@/lib/ui-store';
import { useAiStore, aiConfiguredSelector } from '@/lib/ai-store';
import { useEditorStore } from '@/lib/store';
import { addToCustomDict } from '@/lib/proofing';
import {
  applyVerifyIssue, applyVerifyIssues, accuracyScore, collectScope, revealVerifyIssue,
  runAiVerify, runLocalChecks,
  type VerifyCategory, type VerifyIssue, type VerifyScope,
} from '@/lib/ai-verify';
import { tFmt, useT, useFmtNum } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type IssueStatus = 'open' | 'applied' | 'dismissed';
type UiIssue = VerifyIssue & { status: IssueStatus };
type Phase = 'setup' | 'running' | 'results';
type SevFilter = 'all' | 'error' | 'warning' | 'note';
type CatFilter = 'all' | VerifyCategory;

const SEV_ORDER: Record<string, number> = { error: 0, warning: 1, note: 2 };

const SEV_STYLE: Record<string, string> = {
  error: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  note: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
};

/** ক্যাটাগরি-চিপের ধ্রুব ক্রম (U1) */
const ALL_CATEGORIES: VerifyCategory[] = ['math', 'fact', 'spelling', 'grammar', 'punctuation', 'question', 'consistency'];

/** নিশ্চয়তা-ব্যাজ — সবসময় দৃশ্যমান; থিম-টোকেন রঙ (≥৯০ সবুজাভ, ≥৭০ অ্যাম্বার, নইলে নিরবে) */
const CONF_STYLE = {
  high: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
  mid: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
  low: 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300',
};
const confStyleOf = (n: number) => (n >= 90 ? CONF_STYLE.high : n >= 70 ? CONF_STYLE.mid : CONF_STYLE.low);

export function AccuracyDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'accuracy';
  const configured = useAiStore(aiConfiguredSelector);
  const tt = useT();
  const f = useFmtNum();

  const [scope, setScope] = useState<VerifyScope>('page');
  const [deep, setDeep] = useState(false);
  const [phase, setPhase] = useState<Phase>('setup');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [issues, setIssues] = useState<UiIssue[]>([]);
  const [summary, setSummary] = useState('');
  const [coverage, setCoverage] = useState(1);
  const [failedChunks, setFailedChunks] = useState(0);
  const [aiError, setAiError] = useState(false);
  const [runError, setRunError] = useState(false);
  const [sevFilter, setSevFilter] = useState<SevFilter>('all');
  const [catFilter, setCatFilter] = useState<CatFilter>('all');
  const scopePageIdsRef = useRef<string[]>([]);
  const abortRef = useRef(false);
  const abortCtrlRef = useRef<AbortController | null>(null);
  const [aiRan, setAiRan] = useState(false);

  // ডায়ালগ খোলার সময় ফ্রেশ সেটআপ-অবস্থা — সিলেকশন থাকলে ডিফল্ট পরিধি = নির্বাচিত অংশ।
  // (onOpenChange(true) প্রোগ্রামেটিক ওপেনে ফায় হয় না — তাই রেন্ডার-সময়ে state-adjust।)
  const [seenOpen, setSeenOpen] = useState(false);
  if (open && !seenOpen) {
    setSeenOpen(true);
    const sel = collectScope('selection');
    setScope(sel.text.trim() ? 'selection' : 'page');
    setPhase('setup');
    setIssues([]);
    setSevFilter('all');
    setCatFilter('all');
    setRunError(false);
    setAiError(false);
  } else if (!open && seenOpen) {
    setSeenOpen(false);
  }

  // স্কোপ-টেক্সট একবারই সংগ্রহ — প্রতি রেন্ডারে collectScope নয় (ডকুমেন্ট-স্কোপে পুরো বই পার্স হয়)।
  // মডাল-অবস্থায় পেজ/সিলেকশন বদলাতে পারে না, তাই [open, scope, activePageId]-এই যথেষ্ট।
  const activePageId = useEditorStore((s) => s.activePageId);
  const scopeData = useMemo(() => (open ? collectScope(scope) : null), [open, scope, activePageId]);
  const scopeEmpty = !scopeData?.text.trim();

  const handleOpenChange = (v: boolean) => {
    if (!v) {
      abortRef.current = true;
      abortCtrlRef.current?.abort();
      close();
    }
  };

  // স্পেস-নিরপেক্ষ ডুপ্লিকেট-চেনা — AI ও লোকাল একই ভুল সামান্য ভিন্ন স্পেসে দিলেও এক হয়
  const dedupeKey = (i: { original: string; suggestion: string }) =>
    `${i.original.replace(/\s+/g, ' ').trim()}|${i.suggestion.replace(/\s+/g, ' ').trim()}`;

  const run = async () => {
    setRunError(false);
    try {
      const data = scopeData;
      if (!data || !data.text.trim()) {
        toast.error(tt(`acc.scope.${scope}.empty`));
        return;
      }
      scopePageIdsRef.current = data.pages.map((p) => p.pageId);
      // প্রতি রানে নিজের AbortController — Cancel/ডায়ালগ-বন্ধে চলমান চাংক-কলও থামে
      const ctrl = new AbortController();
      abortCtrlRef.current = ctrl;
      abortRef.current = false;
      setAiRan(true);
      setPhase('running');
      setProgress({ done: 0, total: 0 });
      setAiError(false);
      setFailedChunks(0);
      setSummary('');
      setCoverage(1);
      setSevFilter('all');
      setCatFilter('all');

      // ১) লোকাল নির্ণায়ক যাচাই — তাৎক্ষণিক
      await new Promise((r) => setTimeout(r, 30));
      const local = runLocalChecks(data.text).map<UiIssue>((i) => ({ ...i, status: 'open' }));
      setIssues(local);

      // ২) AI গভীর যাচাই — লোকাল-ইস্যু সিড করা হয়, ফলে AI একই ভুল দ্বিতীয়বার জানালেও আসে না
      let aiIssues: UiIssue[] = [];
      try {
        const report = await runAiVerify({
          scope: data,
          deep,
          demo: !configured,
          onProgress: (done, total) => setProgress({ done, total }),
          shouldAbort: () => abortRef.current,
          signal: ctrl.signal,
          localIssues: local,
        });
        const seen = new Set(local.map(dedupeKey));
        aiIssues = report.issues
          .filter((i) => !seen.has(dedupeKey(i)))
          .map((i) => ({ ...i, status: 'open' as IssueStatus }));
        setSummary(report.summary);
        setCoverage(report.coverage);
        setFailedChunks(report.failedChunks);
        if (report.failedChunks > 0 && report.issues.length === 0 && local.length === 0) setAiError(true);
      } catch {
        // বাতিল হলে ত্রুটি-ব্যানার নয় — আংশিক ফলই দেখাই
        if (!ctrl.signal.aborted && !abortRef.current) setAiError(true);
      }

      // তীব্রতা অনুযায়ী সাজানো — ভুল সবার আগে (বাতিল হলেও আংশিক ফল থাকে)
      const merged = [...local, ...aiIssues].sort(
        (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity],
      );
      setIssues(merged);
      setPhase('results');
    } catch (err) {
      // নীরব প্রত্যাখ্যান নয় — ব্যবহারকারীকে দেখাই
      if ((err as Error)?.name !== 'AbortError') setRunError(true);
      setPhase('setup');
    }
  };

  const updateIssue = (id: string, status: IssueStatus) => {
    setIssues((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const handleApply = async (issue: UiIssue) => {
    if (!issue.suggestion) return;
    const n = applyVerifyIssue(issue, scopePageIdsRef.current);
    if (n > 0) {
      updateIssue(issue.id, 'applied');
      // একই ভুল একাধিক জায়গায় থাকলে সবগুলো একসাথেই ঠিক হয় — ব্যবহারকারী জানুক
      if (n > 1) toast.success(tFmt('acc.appliedOccToast', { n: f(1), m: f(n) }));
    } else {
      toast.error(tt('acc.fixFailToast'));
    }
  };

  const handleLocate = (issue: UiIssue) => {
    const ids = scopePageIdsRef.current;
    // মডাল-পেছনে স্ক্রল অন্ধকারে হারায় — আগে ডায়ালগ বন্ধ, তারপর রিভিল।
    // revealMatch এডিটর-রেজিস্ট্রি থেকেই কাজ করে; DOM-স্থিরকরণে ১০০ms বিরতি।
    close();
    window.setTimeout(() => {
      const ok = revealVerifyIssue(issue, ids);
      if (!ok) toast.info(tt('acc.cannotApply'));
    }, 100);
  };

  const handleAddToDict = (issue: UiIssue) => {
    addToCustomDict(issue.original);
    updateIssue(issue.id, 'dismissed');
    toast.success(tFmt('acc.spell.addedToast', { w: issue.original }));
  };

  const handleApplyBatch = (list: UiIssue[]) => {
    const applyable = list.filter((i) => i.status === 'open' && i.suggestion);
    if (!applyable.length) {
      toast.info(tt('acc.clean'));
      return;
    }
    const { ok, fail, occurrences } = applyVerifyIssues(applyable, scopePageIdsRef.current);
    const ids = new Set(applyable.map((i) => i.id));
    setIssues((all) => all.map((i) => (ids.has(i.id) ? { ...i, status: 'applied' } : i)));
    if (fail > 0) toast.warning(tFmt('acc.appliedFailToast', { n: f(ok), m: f(fail) }));
    else if (occurrences > ok) toast.success(tFmt('acc.appliedOccToast', { n: f(ok), m: f(occurrences) }));
    else toast.success(tFmt('acc.appliedToast', { n: f(ok) }));
  };

  const handleDismissAll = () => {
    setIssues((list) => list.map((i) => (i.status === 'open' ? { ...i, status: 'dismissed' } : i)));
  };

  const counts = useMemo(() => {
    const c = { all: issues.length, error: 0, warning: 0, note: 0, open: 0 };
    const cats = { math: 0, fact: 0, spelling: 0, grammar: 0, punctuation: 0, question: 0, consistency: 0 } as Record<VerifyCategory, number>;
    for (const i of issues) {
      c[i.severity]++;
      if (i.status === 'open') c.open++;
      cats[i.category]++;
    }
    return { ...c, cats };
  }, [issues]);

  const score = useMemo(() => accuracyScore(issues), [issues]);

  const visible = useMemo(
    () => issues.filter(
      (i) => (sevFilter === 'all' || i.severity === sevFilter) && (catFilter === 'all' || i.category === catFilter),
    ),
    [issues, sevFilter, catFilter],
  );

  // "নিরাপদ সব প্রয়োগ" — টুলটিপের প্রতিশ্রুতির মতোই: সব ভুল-স্তরের সংশোধন + ৯০%+ নিশ্চয়তা
  const safeFixes = useMemo(
    () => issues.filter((i) => i.status === 'open' && i.suggestion && (i.severity === 'error' || i.confidence >= 90)),
    [issues],
  );

  const catChips = useMemo(
    () => ALL_CATEGORIES.filter((c) => counts.cats[c] > 0),
    [counts],
  );

  // স্ক্রিন-রিডারে অগ্রগতি ও প্রগতিশীল ফল-সংখ্যার ঘোষণা (aria-live)
  const liveMsg = phase === 'running'
    ? ((progress.total > 0
        ? tt('acc.running.ai').split('{done}').join(f(progress.done)).split('{total}').join(f(progress.total))
        : tt('acc.running.local'))
      + (issues.length > 0 ? ` — ${tFmt('acc.found', { n: f(issues.length) })}` : ''))
    : tFmt('acc.found', { n: f(issues.length) });

  const runningPct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 8;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto" role="dialog" aria-label={tt('acc.title')}>
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('acc.title')}</DialogTitle>
          <DialogDescription>{tt('acc.desc')}</DialogDescription>
        </DialogHeader>
        <PHero tone="emerald" icon={BadgeCheck} title={tt('acc.title')} desc={tt('acc.desc')} />

        {/* স্ক্রিন-রিডার ঘোষণা — প্রগতিশীল ফলে সমস্যা-সংখ্যা জানায় */}
        <div aria-live="polite" role="status" className="sr-only">{liveMsg}</div>

        {runError && (
          <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {tt('acc.runError')}
          </p>
        )}

        {/* ─── সেটআপ ─── */}
        {phase === 'setup' && (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-sm font-medium">{tt('acc.scope')}</p>
              <div className="grid grid-cols-3 gap-1 rounded-lg border p-1" role="radiogroup" aria-label={tt('acc.scope')}>
                {(['selection', 'page', 'document'] as VerifyScope[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={scope === s}
                    className={cn(
                      'rounded-md px-2 py-2 text-xs font-medium transition sm:text-sm',
                      scope === s
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )}
                    onClick={() => setScope(s)}
                  >
                    {tt(`acc.scope.${s}`)}
                  </button>
                ))}
              </div>
              {scopeEmpty && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-amber-600">
                  <Info size={12} /> {tt(`acc.scope.${scope}.empty`)}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Sparkles size={14} className="text-emerald-600" /> {tt('acc.deep')}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{tt('acc.deepTip')}</p>
              </div>
              <Switch checked={deep} onCheckedChange={setDeep} aria-label={tt('acc.deep')} />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted-foreground">
                {!configured ? tt('acc.demoNote') : tt('acc.chars').split('{n}').join(f(scopeData?.text.length ?? 0))}
              </p>
              <Button onClick={() => void run()} disabled={scopeEmpty} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                <ShieldCheck size={15} /> {tt('acc.run')}
              </Button>
            </div>
          </div>
        )}

        {/* ─── চলছে ─── */}
        {phase === 'running' && (
          <div className="space-y-4 py-6">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="animate-spin text-emerald-600" aria-hidden="true" />
              <p className="text-sm font-medium">
                {progress.total > 0
                  ? tt('acc.running.ai').split('{done}').join(f(progress.done)).split('{total}').join(f(progress.total))
                  : tt('acc.running.local')}
              </p>
            </div>
            <Progress value={runningPct} aria-label={tt('acc.run')} />
            {issues.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {tFmt('acc.found', { n: f(issues.length) })}
              </p>
            ) : (
              // প্রথম ফল আসার আগে — হালকা স্কেলিটন-শিমার
              <div className="space-y-2" aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="rounded-lg border p-3">
                    <div className="mb-2 flex gap-1.5">
                      <div className="h-4 w-16 animate-pulse rounded-full bg-accent" />
                      <div className="h-4 w-12 animate-pulse rounded-full bg-accent" style={{ animationDelay: `${i * 150}ms` }} />
                    </div>
                    <div className="h-9 animate-pulse rounded-md bg-accent" style={{ animationDelay: `${i * 150}ms` }} />
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => { abortRef.current = true; abortCtrlRef.current?.abort(); }}>
              {tt('acc.cancel')}
            </Button>
          </div>
        )}

        {/* ─── ফলাফল ─── */}
        {phase === 'results' && (
          <div className="space-y-4">
            {/* স্কোর হেডার — প্রিমিয়াম স্কোর-রিং (SVG প্রগতি-বৃত্ত) */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-accent/30 p-3">
              <div className="flex items-center gap-2.5" title={tt('acc.score')}>
                <span className="relative inline-flex h-12 w-12 items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 36 36" className="h-12 w-12 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-border" />
                    <circle
                      cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" strokeLinecap="round"
                      strokeDasharray={`${(score / 100) * 97.4} 97.4`}
                      className={score >= 90 ? 'text-emerald-500' : score >= 60 ? 'text-amber-500' : 'text-red-500'}
                      stroke="currentColor"
                    />
                  </svg>
                  <span className={cn(
                    'absolute text-[13px] font-bold tabular-nums',
                    score >= 90 ? 'text-emerald-600 dark:text-emerald-400' : score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400',
                  )}>{f(score)}</span>
                </span>
                <span className="text-xs leading-tight text-muted-foreground">{f(100)}<br />{tt('acc.score')}</span>
              </div>
              <span className="h-8 w-px bg-border" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {counts.open === 0
                    ? tt('acc.clean')
                    : tFmt('acc.found', { n: f(counts.open) })}
                </p>
                {summary && (
                  <div className="mt-0.5">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{tt('acc.summary')}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{summary}</p>
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void run()}>
                <RotateCcw size={13} /> {tt('acc.rerun')}
              </Button>
            </div>

            {coverage < 0.995 && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {tFmt('acc.partialCoverage', { n: f(progress.total), p: f(Math.round(coverage * 100)) })}
              </p>
            )}
            {failedChunks > 0 && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                {tFmt('acc.aiFailed', { n: f(failedChunks) })}
              </p>
            )}
            {aiError && (
              <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
                {tt('acc.aiError')}
              </p>
            )}

            {/* ফিল্টার — তীব্রতা */}
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={tt('acc.issues')}>
              {(['all', 'error', 'warning', 'note'] as SevFilter[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={sevFilter === s}
                  className={cn(
                    'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                    sevFilter === s ? 'border-transparent bg-foreground text-background' : 'text-muted-foreground hover:bg-accent',
                  )}
                  onClick={() => setSevFilter(s)}
                >
                  {s === 'all' ? tt('acc.filterAll') : tt(`acc.sev.${s}`)}
                  {s !== 'all' && <span className="ml-1 tabular-nums opacity-70">{f(counts[s])}</span>}
                </button>
              ))}
            </div>

            {/* ফিল্টার — ক্যাটাগরি (শুধু ফল-আছে ক্যাটাগরি; ক্লিকে টগল-ব্যাক = সব) */}
            {catChips.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={tt('acc.filterBy')}>
                {catChips.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={catFilter === c}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs font-medium transition',
                      catFilter === c
                        ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-500 dark:bg-emerald-500'
                        : 'text-muted-foreground hover:bg-accent',
                    )}
                    onClick={() => setCatFilter((cur) => (cur === c ? 'all' : c))}
                  >
                    {tt(`acc.cat.${c}`)}
                    <span className="ml-1 tabular-nums opacity-70">{f(counts.cats[c])}</span>
                  </button>
                ))}
              </div>
            )}

            {/* issue তালিকা */}
            {visible.length === 0 ? (
              issues.length === 0 ? (
                <p className="flex flex-col items-center gap-2 py-8 text-center">
                  <ShieldCheck size={28} className="text-emerald-500" aria-hidden="true" />
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">{tt('acc.clean')}</span>
                  {!aiRan && <span className="text-xs text-muted-foreground">{tt('acc.cleanLocal')}</span>}
                </p>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">{tt('acc.filterEmpty')}</p>
              )
            ) : (
              <div
                className="max-h-[42vh] space-y-2 overflow-y-auto pr-1 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border"
                role="list"
                aria-label={tt('acc.issues')}
              >
                {visible.map((issue) => (
                  <div
                    key={issue.id}
                    role="listitem"
                    className={cn(
                      'rounded-lg border p-3 transition',
                      issue.status === 'applied' && 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20',
                      issue.status === 'dismissed' && 'opacity-50',
                    )}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', SEV_STYLE[issue.severity])}>
                        {tt(`acc.sev.${issue.severity}`)}
                      </span>
                      <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-medium text-accent-foreground">
                        {tt(`acc.cat.${issue.category}`)}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {issue.source === 'local' ? tt('acc.cat.local') : tt('acc.cat.ai')}
                      </span>
                      {issue.pageIndex !== undefined && (
                        <span className="text-[11px] text-muted-foreground">
                          {tFmt('acc.pageLabel', { n: f(issue.pageIndex + 1) })}
                        </span>
                      )}
                      <span className="flex-1" />
                      {/* নিশ্চয়তা-ব্যাজ — সবসময় দৃশ্যমান */}
                      <span
                        className={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums', confStyleOf(issue.confidence))}
                        title={issue.confidence < 70 ? tt('acc.lowConfidence') : tFmt('acc.confidence', { n: f(issue.confidence) })}
                      >
                        {tFmt('acc.confidenceShort', { n: f(issue.confidence) })}
                      </span>
                    </div>

                    {issue.suggestion ? (
                      <div className="mb-2 rounded-md border bg-background px-2.5 py-2 text-sm leading-relaxed">
                        <span className="text-red-600 line-through decoration-red-400/70 dark:text-red-400">{issue.original}</span>
                        <span className="mx-1.5 text-muted-foreground" aria-hidden="true">→</span>
                        <span className="font-medium text-emerald-700 dark:text-emerald-300">{issue.suggestion}</span>
                      </div>
                    ) : issue.original ? (
                      <p className="mb-2 rounded-md border bg-background px-2.5 py-2 text-sm">{issue.original}</p>
                    ) : null}

                    {issue.why && (
                      <p className="mb-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                        {issue.severity === 'error'
                          ? <CircleAlert size={13} className="mt-0.5 shrink-0 text-red-500" aria-hidden="true" />
                          : <AlertTriangle size={13} className="mt-0.5 shrink-0 text-amber-500" aria-hidden="true" />}
                        <span>{issue.why}</span>
                      </p>
                    )}
                    {!issue.suggestion && <p className="mb-2 text-[11px] italic text-muted-foreground">{tt('acc.advisory')}</p>}

                    <div className="flex items-center gap-1.5">
                      {issue.status === 'open' && issue.suggestion && (
                        <Button size="sm" className="h-7 gap-1 bg-emerald-600 text-xs hover:bg-emerald-700" onClick={() => void handleApply(issue)}>
                          <CheckCheck size={12} /> {tt('acc.apply')}
                        </Button>
                      )}
                      {issue.status === 'applied' && (
                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <BadgeCheck size={13} /> {tt('acc.applied')}
                        </span>
                      )}
                      {issue.status === 'dismissed' && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Ban size={12} /> {tt('acc.dismissed')}
                        </span>
                      )}
                      {issue.status === 'open' && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => updateIssue(issue.id, 'dismissed')}>
                          <Ban size={12} /> {tt('acc.dismiss')}
                        </Button>
                      )}
                      {/* লোকাল বানান-সন্দেহ — এক ক্লিকে ব্যবহারকারীর অভিধানে */}
                      {issue.status === 'open' && issue.source === 'local' && issue.category === 'spelling' && issue.original && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" title={tt('acc.spell.addDictTip')} onClick={() => handleAddToDict(issue)}>
                          <BookPlus size={12} /> {tt('acc.spell.addDict')}
                        </Button>
                      )}
                      {issue.original && issue.status === 'open' && (
                        <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" title={tt('acc.locateTip')} onClick={() => handleLocate(issue)}>
                          <Crosshair size={12} /> {tt('acc.locate')}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ব্যাচ অ্যাকশন */}
            {counts.open > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t pt-3">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                  disabled={safeFixes.length === 0}
                  title={tt('acc.applySafeTip')}
                  onClick={() => handleApplyBatch(safeFixes)}
                >
                  <PenLine size={13} /> {tt('acc.applySafe')}
                  <span className="rounded-full bg-white/20 px-1.5 text-[10px] tabular-nums">{f(safeFixes.length)}</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={() => handleApplyBatch(issues)}
                >
                  <CheckCheck size={13} /> {tt('acc.applyAll')}
                </Button>
                <Button size="sm" variant="ghost" className="h-8 gap-1.5" onClick={handleDismissAll}>
                  <Ban size={13} /> {tt('acc.dismissAll')}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
