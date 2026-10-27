/**
 * বিলিং কেন্দ্র — ফেজ-৪ মনিটাইজেশন (দিন ৩১–৪০)
 *
 * তিন ধাপ: overview (বর্তমান প্ল্যান, মিটার, প্ল্যান তুলনা, ইনভয়েস)
 * → checkout (সাইকেল, কুপন, পেমেন্ট মাধ্যম, sandbox নিশ্চিতকরণ) → success (রশিদ প্রিন্ট)।
 * সাইন-আউট অবস্থায় বন্ধুসুলভ সাইন-ইন প্যানেল — এডিটর তো সবসময়ই ফ্রি ও অফলাইন-সক্ষম।
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowLeft, BadgeCheck, Check, Copy, CreditCard, Crown, Loader2, Printer,
  Receipt, Smartphone, Sparkles, Wallet, XCircle, Zap,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useT, useFmtNum, useFmtDate } from '@/lib/i18n';
import { useUiStore } from '@/lib/ui-store';
import { track } from '@/lib/analytics';
import {
  cancelSubscription, confirmPayment, fetchPlans, fetchSubscription, printInvoice,
  startCheckout, validateCoupon,
  type Invoice, type OrderInfo, type PaymentProvider, type PlanPublic, type SubscriptionInfo,
} from '@/lib/billing-client';

type Step = 'overview' | 'checkout' | 'success';
type SelPlan = 'pro' | 'publisher';
type Cycle = 'monthly' | 'yearly';

/** পেমেন্ট মাধ্যমের আইকন */
const PAY_ICONS: Record<PaymentProvider['id'], typeof CreditCard> = {
  bkash: Wallet,
  nagad: Smartphone,
  sslcommerz: CreditCard,
  demo: Zap,
};

/** প্রোভাইডার মোড-ব্যাজের রং — live এমারেল্ড, sandbox অ্যাম্বার, demo স্টোন */
const MODE_BADGE: Record<PaymentProvider['mode'], string> = {
  live: 'border-emerald-700/30 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300',
  sandbox: 'border-amber-500/40 bg-amber-500/10 text-amber-700',
  demo: 'border-stone-300 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300',
};

/** মাসিক/বার্ষিক পিল বোতামের ধাঁচ */
const pillCls = (active: boolean) =>
  `flex min-h-9 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? 'bg-emerald-700 text-white'
      : 'border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800'
  }`;

export function BillingDialog() {
  const tt = useT();
  const fn = useFmtNum();
  const fd = useFmtDate();
  const open = useUiStore((s) => s.openDialog === 'billing');
  const close = useUiStore((s) => s.close);
  const { data: session } = useSession();

  const [step, setStep] = useState<Step>('overview');
  const [plans, setPlans] = useState<PlanPublic[] | null>(null);
  const [providers, setProviders] = useState<PaymentProvider[]>([]);
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // চেকআউট অবস্থা
  const [selPlan, setSelPlan] = useState<SelPlan>('pro');
  const [cycle, setCycle] = useState<Cycle>('monthly');
  const [provider, setProvider] = useState<PaymentProvider['id'] | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponErr, setCouponErr] = useState<string | null>(null);
  const [couponBusy, setCouponBusy] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [payRef, setPayRef] = useState('');
  const [paying, setPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [successData, setSuccessData] = useState<{
    subscription: { plan: string; periodEnd: string; autoRenew: boolean };
    invoice: Invoice;
  } | null>(null);

  // ল্যান্ডিং প্রাইসিং CTA — স্টুডিওতে ঢুকেই বিলিং খোলা
  useEffect(() => {
    try {
      if (sessionStorage.getItem('bwp-open-billing') === '1') {
        sessionStorage.removeItem('bwp-open-billing');
        useUiStore.getState().open('billing');
      }
    } catch { /* ignore */ }
  }, []);

  // প্রথম খোলায় একবারই pricing_view
  const trackedOpen = useRef(false);
  useEffect(() => {
    if (open && !trackedOpen.current) {
      trackedOpen.current = true;
      track('pricing_view');
    }
  }, [open]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const res = await fetchPlans();
    setPlans(res?.plans ?? null);
    setProviders(res?.providers ?? []);
    setSub(session ? await fetchSubscription() : null);
    setLoading(false);
  }, [session]);

  // ডায়ালগ খুললেই ধাপ রিসেট + ডেটা লোড
  useEffect(() => {
    if (!open) return;
    setStep('overview');
    setOrder(null);
    setCoupon(null);
    setCouponInput('');
    setCouponErr(null);
    setPayRef('');
    setCancelConfirm(false);
    setSuccessData(null);
    void loadData();
  }, [open, loadData]);

  // কোনো মিটার ১০০% ছুঁলে প্রতি খোলায় একবার paywall_hit
  const paywallTracked = useRef(false);
  useEffect(() => {
    if (!open) { paywallTracked.current = false; return; }
    if (paywallTracked.current || !sub) return;
    const { cloudDocs, activeShares, aiCredits } = sub.usage;
    if ([cloudDocs, activeShares, aiCredits].some((m) => m.limit > 0 && m.used >= m.limit)) {
      paywallTracked.current = true;
      track('paywall_hit', { dedup: false });
    }
  }, [open, sub]);

  if (!open) return null;

  // ─── হিসাব ───
  const signedIn = Boolean(session);
  const paidActive = Boolean(
    sub && sub.planSource === 'subscription' && (sub.status === 'active' || sub.status === 'canceled_at_period_end'),
  );
  const paywallHit = Boolean(
    sub &&
      [sub.usage.cloudDocs, sub.usage.activeShares, sub.usage.aiCredits].some(
        (m) => m.limit > 0 && m.used >= m.limit,
      ),
  );
  const selPlanObj = plans?.find((p) => p.id === selPlan) ?? null;
  const base = selPlanObj ? (cycle === 'monthly' ? selPlanObj.monthlyPrice : selPlanObj.yearlyPrice) : 0;
  const total = Math.max(0, base - (coupon?.discount ?? 0));

  // ─── অ্যাকশন ───

  const choosePlan = (id: SelPlan) => {
    setSelPlan(id);
    setCycle('monthly');
    const prov = providers.find((p) => p.id === 'bkash') ?? providers[0];
    setProvider(prov?.id ?? 'demo');
    setOrder(null);
    setCoupon(null);
    setCouponInput('');
    setCouponErr(null);
    setPayRef('');
    setStep('checkout');
  };

  const openAuth = () => {
    try { window.dispatchEvent(new CustomEvent('bwp-open-auth')); } catch { /* ignore */ }
    close();
  };

  const changeCycle = (c: Cycle) => {
    setCycle(c);
    setCoupon(null);
    setCouponErr(null);
  };

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;
    setCouponBusy(true);
    setCouponErr(null);
    try {
      const res = await validateCoupon(code, selPlan, cycle);
      if (res.ok) {
        setCoupon({ code: res.coupon.code, discount: res.discount });
      } else {
        setCoupon(null);
        setCouponErr(res.reason ?? 'invalid');
      }
    } finally {
      setCouponBusy(false);
    }
  };

  const doConfirm = async (orderId: string) => {
    setConfirming(true);
    try {
      const res = await confirmPayment(orderId, payRef.trim() || undefined);
      if (res.ok) {
        track('payment_success', { dedup: false });
        track('plan_upgraded', { dedup: false });
        setSuccessData({ subscription: res.subscription, invoice: res.invoice });
        setStep('success');
      } else if (res.error === 'PAYMENT_REF_MISMATCH') {
        toast.error(tt('bill.pay.mismatch'));
      } else if (res.error === 'ALREADY_PAID') {
        // অর্ডারটা আগেই পরিশোধ হয়েছে — তাজা সাবস্ক্রিপশন দেখিয়ে ওভারভিউতে ফেরা
        toast.info(tt('bill.pay.already'));
        setOrder(null);
        setSub(await fetchSubscription());
        setStep('overview');
      } else {
        toast.error(tt('bill.error'));
      }
    } finally {
      setConfirming(false);
    }
  };

  const pay = async () => {
    if (!provider || providers.length === 0) return;
    setPaying(true);
    try {
      const res = await startCheckout({
        planId: selPlan,
        cycle,
        provider,
        couponCode: coupon?.code || undefined,
      });
      if (!res.ok) {
        toast.error(res.error === 'INVALID_COUPON' ? tt('bill.coupon.invalid') : tt('bill.error'));
        return;
      }
      track('checkout_started', { dedup: false });
      if (res.order.mode === 'demo') {
        // ডেমো — তাৎক্ষণিক নিশ্চিতকরণ
        await doConfirm(res.order.id);
      } else {
        setOrder(res.order);
      }
    } finally {
      setPaying(false);
    }
  };

  const copyRef = async () => {
    if (!order?.sandboxRef) return;
    try {
      await navigator.clipboard.writeText(order.sandboxRef);
      toast.success(tt('bill.copied'));
    } catch { /* clipboard blocked */ }
  };

  const doCancel = async () => {
    setCancelBusy(true);
    try {
      const ok = await cancelSubscription();
      if (ok) {
        toast.success(tt('bill.cancel.done'));
        setCancelConfirm(false);
        setSub(await fetchSubscription());
      } else {
        toast.error(tt('bill.error'));
      }
    } finally {
      setCancelBusy(false);
    }
  };

  const doneSuccess = async () => {
    setSub(await fetchSubscription());
    setOrder(null);
    setCoupon(null);
    setCouponInput('');
    setCouponErr(null);
    setPayRef('');
    setStep('overview');
  };

  // ─── ছোট রেন্ডার-সাহায্যকারী ───

  const statusBadge = (s: SubscriptionInfo) => {
    if (s.planSource === 'free' || s.status === 'none') {
      return (
        <Badge className="border-stone-300 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300">
          {tt('bill.status.free')}
        </Badge>
      );
    }
    if (s.status === 'active') {
      return (
        <Badge className="gap-1 border-emerald-700/30 bg-emerald-700/10 text-emerald-800 dark:text-emerald-300">
          <BadgeCheck size={12} aria-hidden="true" /> {tt('bill.status.active')}
        </Badge>
      );
    }
    if (s.status === 'canceled_at_period_end') {
      return (
        <Badge className="gap-1 border-amber-500/40 bg-amber-500/10 text-amber-700">
          <XCircle size={12} aria-hidden="true" /> {tt('bill.status.canceled')}
        </Badge>
      );
    }
    return (
      <Badge className="gap-1 border-red-500/40 bg-red-500/10 text-red-700">
        <XCircle size={12} aria-hidden="true" /> {tt('bill.status.expired')}
      </Badge>
    );
  };

  const renewLine = (s: SubscriptionInfo): string => {
    if (s.planSource === 'free' || s.status === 'none') return '';
    if (s.periodEnd) {
      const ds = fd(new Date(s.periodEnd));
      return s.status === 'canceled_at_period_end' ? `${tt('bill.ends')} ${ds}` : `${tt('bill.renews')} ${ds}`;
    }
    return s.autoRenew ? '' : tt('bill.renew.off');
  };

  /** {n} → সংখ্যা/আনলিমিটেড — ফিচার-লাইনের জন্য */
  const limitText = (tpl: string, lim: number): string =>
    tpl.split('{n}').join(lim === -1 ? tt('bill.feat.unlimited') : fn(lim));
  const sizeText = (bytes: number): string =>
    bytes === -1 ? '∞' : tt('bill.feat.size').split('{n}').join(fn(Math.round(bytes / 1048576)));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {!signedIn ? (
          // ─── সাইন-আউট: বন্ধুসুলভ প্যানেল ───
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown size={17} className="text-emerald-700" aria-hidden="true" /> {tt('bill.signin.title')}
              </DialogTitle>
              <DialogDescription>{tt('bill.signin.desc')}</DialogDescription>
            </DialogHeader>
            <div className="rounded-xl border border-dashed border-emerald-700/40 bg-emerald-700/5 p-6 text-center">
              <Crown size={26} className="mx-auto mb-3 text-emerald-700/70" aria-hidden="true" />
              <Button
                onClick={openAuth}
                className="min-w-40 gap-2 bg-emerald-700 font-semibold text-white hover:bg-emerald-800 max-sm:h-11"
              >
                {tt('bill.signin.cta')}
              </Button>
            </div>
          </>
        ) : step === 'overview' ? (
          // ─── ধাপ ১: ওভারভিউ ───
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown size={17} className="text-emerald-700" aria-hidden="true" /> {tt('bill.title')}
              </DialogTitle>
              <DialogDescription>{tt('bill.desc')}</DialogDescription>
            </DialogHeader>

            {loading && !sub ? (
              <div className="flex h-32 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={18} className="animate-spin" aria-hidden="true" /> {tt('bill.loading')}
              </div>
            ) : !sub ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{tt('bill.error')}</p>
            ) : (
              <div className="space-y-4">
                {/* বর্তমান প্ল্যান */}
                <div className="rounded-xl border border-emerald-700/30 bg-emerald-700/5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold">{tt(`bill.plan.${sub.plan}`)}</span>
                    {statusBadge(sub)}
                    <span className="ms-auto text-[11px] text-muted-foreground">{tt('bill.plan.current')}</span>
                  </div>
                  {renewLine(sub) ? (
                    <p className="mt-1.5 text-xs text-muted-foreground">{renewLine(sub)}</p>
                  ) : null}
                </div>

                {/* ব্যবহারের মিটার */}
                <div className="space-y-3 rounded-xl border border-border p-4">
                  <UsageMeter label={tt('bill.usage.docs')} used={sub.usage.cloudDocs.used} limit={sub.usage.cloudDocs.limit} tt={tt} fn={fn} />
                  <UsageMeter label={tt('bill.usage.shares')} used={sub.usage.activeShares.used} limit={sub.usage.activeShares.limit} tt={tt} fn={fn} />
                  <UsageMeter label={tt('bill.usage.ai')} used={sub.usage.aiCredits.used} limit={sub.usage.aiCredits.limit} tt={tt} fn={fn} />
                </div>

                {/* পেওয়াল ব্যানার */}
                {paywallHit ? (
                  <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{tt('bill.paywall.title')}</p>
                    <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/80">{tt('bill.paywall.desc')}</p>
                    <Button
                      size="sm"
                      onClick={() => choosePlan('pro')}
                      className="mt-2.5 gap-1.5 bg-emerald-700 font-semibold text-white hover:bg-emerald-800 max-sm:h-11"
                    >
                      <Sparkles size={13} aria-hidden="true" /> {tt('bill.paywall.cta')}
                    </Button>
                  </div>
                ) : null}

                {/* অ্যাকশন */}
                {paidActive ? (
                  cancelConfirm ? (
                    <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">{tt('bill.cancel.confirm.title')}</p>
                      <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/80">{tt('bill.cancel.confirm.desc')}</p>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="max-sm:h-11" onClick={() => setCancelConfirm(false)}>
                          {tt('bill.cancel.keep')}
                        </Button>
                        <Button
                          size="sm"
                          className="bg-red-700 font-semibold text-white hover:bg-red-800 max-sm:h-11"
                          onClick={() => void doCancel()}
                          disabled={cancelBusy}
                        >
                          {cancelBusy ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : null}
                          {tt('bill.cancel.confirm.yes')}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full max-sm:h-11" onClick={() => setCancelConfirm(true)}>
                      {tt('bill.cancel')}
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={() => choosePlan('pro')}
                    className="w-full gap-2 bg-emerald-700 font-semibold text-white hover:bg-emerald-800 max-sm:h-11"
                  >
                    <Sparkles size={15} aria-hidden="true" /> {tt('bill.upgrade')}
                  </Button>
                )}

                {/* প্ল্যান তুলনা */}
                <div className="grid gap-3 sm:grid-cols-3">
                  {!plans ? (
                    <p className="text-xs text-muted-foreground sm:col-span-3">{tt('bill.error')}</p>
                  ) : (
                    plans.map((p) => {
                      const lim = p.limits;
                      const feats = [
                        limitText(tt('bill.feat.docs'), lim.cloudDocs),
                        limitText(tt('bill.feat.shares'), lim.shareLinks),
                        limitText(tt('bill.feat.ai'), lim.aiCredits),
                        sizeText(lim.docBytes),
                      ];
                      const isCurrentFree = sub.plan === 'free' && p.id === 'free';
                      const isCurrentPaid = paidActive && sub.plan === p.id && p.id !== 'free';
                      return (
                        <article
                          key={p.id}
                          className={`rounded-xl border p-3.5 ${p.highlight ? 'border-emerald-700 bg-emerald-700/5' : 'border-border'}`}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <h4 className="text-sm font-bold">{tt(`bill.plan.${p.id}`)}</h4>
                            {p.highlight ? <Sparkles size={13} className="text-emerald-700" aria-hidden="true" /> : null}
                          </div>
                          <p className="mt-1 text-base font-extrabold">
                            ৳{fn(p.monthlyPrice)}
                            <span className="text-[11px] font-medium text-muted-foreground">{tt('bill.permonth')}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            ৳{fn(p.yearlyPrice)}{tt('bill.peryear')}
                          </p>
                          <ul className="mt-2.5 space-y-1">
                            {feats.map((f, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-[11px] text-stone-600 dark:text-stone-300">
                                <Check size={12} className="mt-0.5 shrink-0 text-emerald-700" aria-hidden="true" /> {f}
                              </li>
                            ))}
                          </ul>
                          {p.id === 'free' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3 w-full max-sm:h-11"
                              disabled={isCurrentFree}
                              onClick={() => { if (paidActive) setCancelConfirm(true); }}
                            >
                              {tt('bill.plan.free.cta')}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant={p.highlight ? 'default' : 'outline'}
                              className={`mt-3 w-full max-sm:h-11 ${p.highlight ? 'bg-emerald-700 font-semibold text-white hover:bg-emerald-800' : ''}`}
                              disabled={isCurrentPaid}
                              onClick={() => choosePlan(p.id as SelPlan)}
                            >
                              {tt('bill.choose')}
                            </Button>
                          )}
                        </article>
                      );
                    })
                  )}
                </div>

                {/* ইনভয়েস */}
                <div>
                  <h3 className="mb-2 text-sm font-bold">{tt('bill.invoices.title')}</h3>
                  {!sub.invoices.length ? (
                    <p className="text-xs text-muted-foreground">{tt('bill.invoices.empty')}</p>
                  ) : (
                    <ul className="max-h-40 space-y-1.5 overflow-y-auto pe-1">
                      {sub.invoices.map((inv) => (
                        <li key={inv.id} className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5">
                          <Receipt size={14} className="shrink-0 text-emerald-700" aria-hidden="true" />
                          <span className="text-xs font-semibold">{inv.number}</span>
                          <span className="hidden text-[11px] text-muted-foreground sm:inline">{fd(new Date(inv.issuedAt))}</span>
                          <span className="ms-auto text-xs font-bold">৳{fn(inv.amount)}</span>
                          <span className="hidden rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600 sm:inline dark:bg-stone-800 dark:text-stone-300">
                            {tt(`bill.plan.${inv.plan}`)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 max-sm:h-11 max-sm:w-11"
                            onClick={() => printInvoice(inv, sub.user)}
                            aria-label={tt('bill.print')}
                            title={tt('bill.print')}
                          >
                            <Printer size={14} />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </>
        ) : step === 'checkout' ? (
          // ─── ধাপ ২: চেকআউট ───
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 max-sm:h-11 max-sm:w-11"
                  onClick={() => { setOrder(null); setStep('overview'); }}
                  aria-label={tt('tour.back')}
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                </Button>
                <Crown size={17} className="text-emerald-700" aria-hidden="true" /> {tt('bill.title')}
              </DialogTitle>
              <DialogDescription>
                {tt(`bill.plan.${selPlan}`)} — {tt(cycle === 'monthly' ? 'bill.cycle.monthly' : 'bill.cycle.yearly')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* সারসংক্ষেপ: সাইকেল + কুপন + মোট */}
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={`${tt('bill.cycle.monthly')} / ${tt('bill.cycle.yearly')}`}>
                  <button type="button" onClick={() => changeCycle('monthly')} aria-pressed={cycle === 'monthly'} className={pillCls(cycle === 'monthly')}>
                    {tt('bill.cycle.monthly')}
                  </button>
                  <button type="button" onClick={() => changeCycle('yearly')} aria-pressed={cycle === 'yearly'} className={pillCls(cycle === 'yearly')}>
                    {tt('bill.cycle.yearly')}
                    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cycle === 'yearly' ? 'bg-white/20 text-white' : 'bg-amber-500/15 text-amber-700'}`}>
                      {tt('bill.yearly.save')}
                    </span>
                  </button>
                  <span className="ms-auto text-lg font-extrabold">
                    ৳{fn(base)}
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {tt(cycle === 'monthly' ? 'bill.permonth' : 'bill.peryear')}
                    </span>
                  </span>
                </div>

                {/* কুপন */}
                <div className="mt-3 flex gap-1.5">
                  <Input
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    placeholder={tt('bill.coupon.placeholder')}
                    aria-label={tt('bill.coupon.placeholder')}
                    className="h-9 flex-1 uppercase max-sm:h-11"
                  />
                  <Button variant="outline" className="max-sm:h-11" onClick={() => void applyCoupon()} disabled={couponBusy || !couponInput.trim()}>
                    {couponBusy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : null}
                    {tt('bill.coupon.apply')}
                  </Button>
                </div>
                {coupon ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    ✓ {tt('bill.coupon.applied')} ({coupon.code}) · −৳{fn(coupon.discount)}
                  </p>
                ) : couponErr ? (
                  <p className="mt-2 text-xs font-semibold text-red-600">
                    ✕ {tt('bill.coupon.invalid')}
                    {couponErr === 'expired' ? ` — ${tt('bill.coupon.expired')}` : ''}
                    {couponErr === 'usage_limit' ? ` — ${tt('bill.coupon.usage_limit')}` : ''}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
                  <span className="text-sm font-bold">{tt('bill.total')}</span>
                  <span className="text-base font-extrabold">৳{fn(total)}</span>
                </div>
              </div>

              {/* পেমেন্ট মাধ্যম */}
              <div className="grid gap-2 sm:grid-cols-2">
                {providers.map((p) => {
                  const Icon = PAY_ICONS[p.id];
                  const sel = provider === p.id;
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setProvider(p.id)}
                      aria-pressed={sel}
                      className={`flex min-h-11 items-center gap-2.5 rounded-xl border p-3 text-start transition-colors ${
                        sel ? 'border-emerald-700 bg-emerald-700/5 ring-1 ring-emerald-700' : 'border-border hover:border-emerald-700/40'
                      }`}
                    >
                      <Icon size={18} className={sel ? 'text-emerald-700' : 'text-stone-500 dark:text-stone-400'} aria-hidden="true" />
                      <span className="flex-1 text-sm font-semibold">{tt(`bill.pay.${p.id}`)}</span>
                      <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-bold ${MODE_BADGE[p.mode]}`}>
                        {tt(`bill.mode.${p.mode}`)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* অর্ডার নির্দেশনা (sandbox/live) */}
              {order && order.mode !== 'demo' ? (
                <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4">
                  <h3 className="text-sm font-bold">{tt('bill.instructions')}</h3>
                  <ol className="mt-1.5 list-decimal space-y-1 ps-5 text-xs text-muted-foreground">
                    {(order.instructions ?? []).map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ol>
                  {order.sandboxRef ? (
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <code className="min-w-0 flex-1 truncate rounded bg-stone-100 px-2 py-1.5 text-xs dark:bg-stone-800">{order.sandboxRef}</code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 shrink-0 max-sm:h-11 max-sm:w-11"
                        onClick={() => void copyRef()}
                        aria-label={tt('bill.copied')}
                        title={tt('bill.copied')}
                      >
                        <Copy size={14} />
                      </Button>
                    </div>
                  ) : null}
                  {order.mode === 'sandbox' ? (
                    <div className="mt-2.5 flex flex-col gap-1.5 sm:flex-row">
                      <Input
                        value={payRef}
                        onChange={(e) => setPayRef(e.target.value)}
                        placeholder={tt('bill.pay.reflabel')}
                        aria-label={tt('bill.pay.reflabel')}
                        className="h-9 flex-1 max-sm:h-11"
                      />
                      <Button
                        className="bg-emerald-700 font-semibold text-white hover:bg-emerald-800 max-sm:h-11"
                        onClick={() => void doConfirm(order.id)}
                        disabled={confirming}
                      >
                        {confirming ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <BadgeCheck size={14} aria-hidden="true" />}
                        {tt('bill.pay.confirm')}
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {/* পরিশোধ বোতাম */}
              {!order ? (
                <Button
                  className="h-11 w-full gap-2 bg-emerald-700 text-base font-bold text-white hover:bg-emerald-800"
                  onClick={() => void pay()}
                  disabled={paying || !provider || providers.length === 0}
                >
                  {paying ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Wallet size={16} aria-hidden="true" />}
                  {tt('bill.pay.now')} — ৳{fn(total)}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          // ─── ধাপ ৩: সফল পেমেন্ট ───
          <div className="py-4 text-center">
            <BadgeCheck size={52} className="mx-auto text-emerald-700" aria-hidden="true" />
            <DialogHeader className="mt-3 items-center text-center">
              <DialogTitle className="text-xl font-extrabold">{tt('bill.success.title')}</DialogTitle>
              <DialogDescription>
                {successData
                  ? `${tt(`bill.plan.${successData.subscription.plan}`)} — ${tt('bill.success.until')} ${fd(new Date(successData.subscription.periodEnd))}`
                  : ''}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="gap-2 max-sm:h-11"
                disabled={!successData}
                onClick={() => successData && printInvoice(successData.invoice, sub?.user ?? { name: null, email: null })}
              >
                <Printer size={15} aria-hidden="true" /> {tt('bill.success.invoice')}
              </Button>
              <Button className="bg-emerald-700 font-semibold text-white hover:bg-emerald-800 max-sm:h-11" onClick={() => void doneSuccess()}>
                {tt('bill.success.done')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** এক ব্যবহার-মিটার — লেবেল + used/limit + প্রগ্রেস বার (৮৫%+ অ্যাম্বার, ১০০%+ লাল) */
function UsageMeter(props: {
  label: string;
  used: number;
  limit: number;
  tt: (k: string, f?: string) => string;
  fn: (n: number | string) => string;
}) {
  const { label, used, limit, tt, fn } = props;
  const unlimited = limit === -1;
  const pct = limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
  const over = !unlimited && used > limit;
  const warn = !unlimited && !over && used / limit >= 0.85;
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-medium text-stone-700 dark:text-stone-200">{label}</span>
        <span className={`font-semibold ${over ? 'text-red-600' : warn ? 'text-amber-600' : 'text-muted-foreground'}`}>
          {unlimited ? tt('bill.unlimited') : `${fn(used)} / ${fn(limit)}`}
        </span>
      </div>
      <Progress
        value={pct}
        aria-label={label}
        className={`mt-1.5 h-2 ${
          over
            ? '[&_[data-slot=progress-indicator]]:bg-red-600'
            : warn
              ? '[&_[data-slot=progress-indicator]]:bg-amber-500'
              : ''
        }`}
      />
    </div>
  );
}
