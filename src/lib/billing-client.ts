/**
 * বিলিং API ক্লায়েন্ট — ফেজ-৪ মনিটাইজেশন (দিন ৩১–৪০)
 *
 * সব কল try/catch-এ মোড়া — নেটওয়ার্ক/সার্ভার ব্যর্থ হলে null/false ছাড়া কিছুই ছোড়ে না,
 * তাই UI কখনো ক্র্যাশ করবে না (শুধু খালি অবস্থা দেখাবে)। সব এন্ডপয়েন্ট JSON।
 *
 * চুক্তি (parent ব্যাকএন্ড একই শেপ বানাচ্ছে):
 *   GET  /api/billing/plans        → { plans, providers }        (সাইন-আউটেও চলে)
 *   GET  /api/billing/subscription → SubscriptionInfo            (401 → null)
 *   POST /api/billing/checkout     → { order } | 400 { error }
 *   POST /api/billing/confirm      → { ok, subscription, invoice } | 400/409 { error }
 *   POST /api/billing/coupon       → { ok, coupon, amount, discount, currency } | 400 { error, reason }
 *   POST /api/billing/cancel       → { ok, cancelAt }
 */

import { t } from '@/lib/i18n';
import { formatDateLong, getLang, localizeNumber } from '@/lib/i18n/core';

// ─── টাইপ (API চুক্তির সাথে হুবহু) ───

export type PlanId = 'free' | 'pro' | 'publisher';
export type Cycle = 'monthly' | 'yearly';
export type ProviderId = 'demo' | 'bkash' | 'nagad' | 'sslcommerz';

export interface PlanPublic {
  id: PlanId;
  monthlyPrice: number;
  yearlyPrice: number;
  /** -1 = আনলিমিটেড */
  limits: { cloudDocs: number; shareLinks: number; aiCredits: number; docBytes: number };
  /** pro => true — কার্ড হাইলাইট */
  highlight: boolean;
}

export interface PaymentProvider {
  id: ProviderId;
  mode: 'live' | 'sandbox' | 'demo';
}

export interface BillingUsage {
  used: number;
  /** -1 = আনলিমিটেড */
  limit: number;
}

export interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  plan: string;
  cycle: string;
  provider: string;
  issuedAt: string;
}

export interface SubscriptionInfo {
  plan: PlanId;
  planSource: 'free' | 'subscription';
  status: 'none' | 'active' | 'canceled_at_period_end' | 'expired';
  periodEnd: string | null;
  cancelAt: string | null;
  autoRenew: boolean;
  usage: { cloudDocs: BillingUsage; activeShares: BillingUsage; aiCredits: BillingUsage };
  invoices: Invoice[];
  user: { name: string | null; email: string | null };
}

export interface OrderInfo {
  id: string;
  plan: PlanId;
  cycle: Cycle;
  provider: string;
  mode: 'live' | 'sandbox' | 'demo';
  amount: number;
  discount: number;
  currency: string;
  sandboxRef?: string | null;
  instructions?: string[];
}

export interface CouponInfo {
  code: string;
  percentOff: number;
}

export interface CheckoutBody {
  planId: 'pro' | 'publisher';
  cycle: Cycle;
  provider: ProviderId;
  couponCode?: string;
}

// ─── ভেতরের সাহায্যকারী ───

const JSON_HEADERS = { 'Content-Type': 'application/json' };

/** সাধারণ GET — ব্যর্থ (নেটওয়ার্ক/401/5xx) হলে null */
async function getJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** POST + এরর-বডি পড়া — সফল: { ok: true, data }, ব্যর্থ: { ok: false, error, reason? } */
async function postJson<T>(
  url: string,
  body?: unknown,
): Promise<{ ok: true; data: T } | { ok: false; error: string; reason?: string }> {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify(body ?? {}),
    });
    const data = (await res.json().catch(() => null)) as (T & { error?: string; reason?: string }) | null;
    if (!res.ok || !data || data.error) {
      return { ok: false, error: data?.error ?? 'UNKNOWN', reason: data?.reason };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, error: 'NETWORK' };
  }
}

// ─── API ফাংশন ───

export async function fetchPlans(): Promise<{ plans: PlanPublic[]; providers: PaymentProvider[] } | null> {
  return getJson('/api/billing/plans');
}

/** সাইন-আউট থাকলে 401 → null */
export async function fetchSubscription(): Promise<SubscriptionInfo | null> {
  return getJson('/api/billing/subscription');
}

export async function startCheckout(
  body: CheckoutBody,
): Promise<{ ok: true; order: OrderInfo } | { ok: false; error: string; reason?: string }> {
  const res = await postJson<{ order: OrderInfo }>('/api/billing/checkout', body);
  return res.ok ? { ok: true, order: res.data.order } : { ok: false, error: res.error, reason: res.reason };
}

export async function confirmPayment(
  orderId: string,
  paymentRef?: string,
): Promise<
  | { ok: true; subscription: { plan: PlanId; periodEnd: string; autoRenew: boolean }; invoice: Invoice }
  | { ok: false; error: string }
> {
  const res = await postJson<{
    ok: true;
    subscription: { plan: PlanId; periodEnd: string; autoRenew: boolean };
    invoice: Invoice;
  }>('/api/billing/confirm', { orderId, paymentRef });
  return res.ok
    ? { ok: true, subscription: res.data.subscription, invoice: res.data.invoice }
    : { ok: false, error: res.error };
}

export async function validateCoupon(
  code: string,
  planId: PlanId,
  cycle: Cycle,
): Promise<
  | { ok: true; coupon: CouponInfo; amount: number; discount: number; currency: string }
  | { ok: false; error: string; reason?: string }
> {
  const res = await postJson<{ ok: true; coupon: CouponInfo; amount: number; discount: number; currency: string }>(
    '/api/billing/coupon',
    { code, planId, cycle },
  );
  return res.ok
    ? { ok: true, coupon: res.data.coupon, amount: res.data.amount, discount: res.data.discount, currency: res.data.currency }
    : { ok: false, error: res.error, reason: res.reason };
}

export async function cancelSubscription(): Promise<boolean> {
  const res = await postJson<{ ok: true; cancelAt: string }>('/api/billing/cancel');
  return res.ok;
}

// ─── ইনভয়েস প্রিন্ট ───

/** ছোট HTML-escape — রশিদের সব স্ট্রিং নিরাপদ রাখতে */
function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * ইনভয়েস প্রিন্ট — নতুন উইন্ডোয় স্বয়ংসম্পূর্ণ A4 রশিদ (বাংলা-প্রথম লেবেল + ইংরেজি উপশিরোনাম,
 * এমারেল্ড অ্যাকসেন্ট) লিখে print() ডাকা হয়। SSR ও পপআপ-ব্লক সুরক্ষিত।
 */
export function printInvoice(invoice: Invoice, user: { name: string | null; email: string | null }): void {
  if (typeof window === 'undefined') return;
  const win = window.open('', '_blank');
  if (!win) return;

  const lang = getLang();
  const money = (n: number) => `৳${localizeNumber(n, lang)}`;
  const dateStr = esc(formatDateLong(new Date(invoice.issuedAt), lang));
  const planName = esc(t(`bill.plan.${invoice.plan}`, invoice.plan));
  const cycleName = esc(t(`bill.cycle.${invoice.cycle}`, invoice.cycle));
  const providerName = esc(t(`bill.pay.${invoice.provider}`, invoice.provider));
  const billedTo =
    [user.name, user.email]
      .filter(Boolean)
      .map((v) => esc(String(v)))
      .join(' · ') || '—';
  const invTitle = esc(t('bill.invoices.title', 'Invoice'));

  win.document.write(`<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(invoice.number)} — ইনভয়েস / Invoice</title>
<style>
  @page { size: A4; margin: 16mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Noto Sans Bengali','Hind Siliguri','SolaimanLipi',-apple-system,'Segoe UI',sans-serif; color: #1c1917; background: #fafaf9; padding: 24px 16px; }
  .sheet { max-width: 700px; margin: 0 auto; background: #fff; padding: 36px 40px; border: 1px solid #e7e5e4; border-radius: 10px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; border-bottom: 3px solid #047857; padding-bottom: 14px; }
  .brand { font-size: 21px; font-weight: 800; color: #065f46; }
  .brand small { display: block; font-size: 11px; font-weight: 500; color: #78716c; margin-top: 2px; letter-spacing: .04em; }
  .meta { text-align: right; font-size: 12.5px; color: #44403c; line-height: 1.7; }
  .meta b { color: #047857; }
  h1 { font-size: 17px; margin: 20px 0 2px; }
  h1 small { font-size: 12px; font-weight: 500; color: #78716c; }
  .to { font-size: 13px; color: #44403c; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13.5px; }
  th { background: #ecfdf5; color: #065f46; text-align: left; font-size: 11.5px; letter-spacing: .03em; padding: 8px 12px; border-bottom: 2px solid #047857; }
  td { padding: 10px 12px; border-bottom: 1px solid #e7e5e4; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  tr.total td { font-weight: 800; color: #065f46; border-top: 2px solid #047857; border-bottom: 0; font-size: 14.5px; background: #f0fdf4; }
  .paid { display: inline-block; margin-top: 18px; border: 2px solid #047857; color: #047857; border-radius: 999px; padding: 4px 16px; font-weight: 700; font-size: 12.5px; letter-spacing: .05em; }
  footer { margin-top: 30px; border-top: 1px solid #d6d3d1; padding-top: 12px; text-align: center; font-size: 11.5px; color: #78716c; }
</style>
</head>
<body>
<div class="sheet">
  <header>
    <div class="brand">বাংলা পাবলিশিং স্টুডিও<small>Bangla Publishing Studio</small></div>
    <div class="meta">
      <div><b>${invTitle}:</b> ${esc(invoice.number)}</div>
      <div>${dateStr}</div>
    </div>
  </header>
  <h1>ইনভয়েস <small>/ Invoice</small></h1>
  <p class="to">বিল প্রাপক / Billed to: <strong>${billedTo}</strong></p>
  <table>
    <thead><tr><th>বিবরণ / Description</th><th class="num">পরিমাণ / Amount</th></tr></thead>
    <tbody>
      <tr>
        <td>${planName} — ${cycleName}<br /><span style="color:#78716c;font-size:11.5px">${providerName} · ${dateStr}</span></td>
        <td class="num">${money(invoice.amount)}</td>
      </tr>
      <tr class="total"><td>মোট / Total</td><td class="num">${money(invoice.amount)}</td></tr>
    </tbody>
  </table>
  <div class="paid">✓ পরিশোধিত / PAID</div>
  <footer>বাংলা পাবলিশিং স্টুডিও — প্রদত্ত রশিদ / Paid receipt</footer>
</div>
</body>
</html>`);
  win.document.close();
  window.setTimeout(() => {
    try {
      win.print();
    } catch {
      /* প্রিন্ট ব্লকড — উইন্ডো খোলাই থাকবে */
    }
  }, 400);
}
