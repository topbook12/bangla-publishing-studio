/**
 * পেমেন্ট গেটওয়ে অ্যাবস্ট্রাকশন — ফেজ-৪ (দিন ৩১–৪০)
 *
 * বাংলাদেশ-ফার্স্ট: bKash / Nagad / SSLCommerz + সর্বদা-খোলা ডেমো মোড।
 *
 * ক্রেডেনশিয়াল সেট থাকলে 'live' — সেট না থাকলে প্রতিটি গেটওয়ে 'sandbox' মোডে
 * চলে: ক্লায়েন্টকে নমুনা ট্রানজেকশন-আইডি (sandboxRef) দেখিয়ে সেটি যাচাই করা
 * হয়। এতে পুরো চেকআউট-ফ্লো (অর্ডার → পেমেন্ট → নিশ্চিতকরণ → ইনভয়েস) ক্রেডেনশিয়াল
 * ছাড়াই শেষ-থেকে-শেষ পরীক্ষা করা যায়, আর Vercel-ে env বসালেই লাইভ হয়ে যায়।
 */

import type { PlanId, Cycle } from './plans';
import { planPrice } from './plans';

export type ProviderId = 'demo' | 'bkash' | 'nagad' | 'sslcommerz';
export type ProviderMode = 'live' | 'sandbox' | 'demo';

export interface ProviderInfo {
  id: ProviderId;
  mode: ProviderMode;
}

/** env ক্রেডেনশিয়াল অনুযায়ী গেটওয়ে উপলব্ধতা */
export function listProviders(): ProviderInfo[] {
  const out: ProviderInfo[] = [];
  if (bkashLive()) out.push({ id: 'bkash', mode: 'live' });
  else out.push({ id: 'bkash', mode: 'sandbox' });
  if (nagadLive()) out.push({ id: 'nagad', mode: 'live' });
  else out.push({ id: 'nagad', mode: 'sandbox' });
  if (sslLive()) out.push({ id: 'sslcommerz', mode: 'live' });
  else out.push({ id: 'sslcommerz', mode: 'sandbox' });
  out.push({ id: 'demo', mode: 'demo' });
  return out;
}

export function isValidProvider(v: unknown): v is ProviderId {
  return v === 'demo' || v === 'bkash' || v === 'nagad' || v === 'sslcommerz';
}

function bkashLive(): boolean {
  return Boolean(
    process.env.BKASH_APP_KEY &&
    process.env.BKASH_APP_SECRET &&
    process.env.BKASH_USERNAME &&
    process.env.BKASH_PASSWORD,
  );
}

function nagadLive(): boolean {
  return Boolean(process.env.NAGAD_MERCHANT_ID && process.env.NAGAD_PRIVATE_KEY);
}

function sslLive(): boolean {
  return Boolean(process.env.SSLCOMMERZ_STORE_ID && process.env.SSLCOMMERZ_STORE_PASSWORD);
}

export function providerMode(p: ProviderId): ProviderMode {
  if (p === 'demo') return 'demo';
  if (p === 'bkash') return bkashLive() ? 'live' : 'sandbox';
  if (p === 'nagad') return nagadLive() ? 'live' : 'sandbox';
  return sslLive() ? 'live' : 'sandbox';
}

/**
 * স্যান্ডবক্স ট্রানজেকশন-আইডি — গেটওয়ে-ধাঁচের (BKS…/NGD…/SSL… + ৮ অক্ষর)।
 * ক্লায়েন্ট এটাকে "রিসিভড TrxID" হিসেবে দেখে, confirm-এ জমা দিলে মিলিয়ে নেয়।
 */
export function makeSandboxRef(provider: ProviderId): string {
  const prefix = provider === 'bkash' ? 'BKS' : provider === 'nagad' ? 'NGD' : 'SSL';
  const rand = crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 8);
  return `${prefix}${rand}`;
}

/** অর্ডার নম্বর — ORD-YYYYMMDD-XXXX */
export function makeOrderNumber(): string {
  const d = new Date();
  const ymd = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const rand = crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 4);
  return `ORD-${ymd}-${rand}`;
}

/** ইংরেজি অঙ্ক → বাংলা অঙ্ক (স্যান্ডবক্স-নির্দেশনা বাংলা-প্রথম, তাই বাংলা অঙ্কই স্বাভাবিক) */
const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
function toBn(n: number): string {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

/**
 * স্যান্ডবক্স পেমেন্টের ধাপ-নির্দেশনা (ক্লায়েন্টে দেখানো হয়)।
 * সব টেক্সট বাংলা-প্রথম — i18n এখানে প্রযোজ্য নয় (সার্ভার স্ট্যাটিক লিস্ট)।
 */
export function sandboxInstructions(provider: ProviderId, ref: string, amount: number): string[] {
  const taka = toBn(amount);
  if (provider === 'bkash') {
    return [
      'bKash অ্যাপ খুলুন → “Payment” নির্বাচন করুন',
      'মার্চেন্ট ওয়ালেট নম্বর: 01700-000000 (স্যান্ডবক্স)',
      `পরিমাণ: ৳${taka} — রেফারেন্সে অর্ডার নম্বর লিখুন`,
      `নমুনা ট্রানজেকশন আইডি (স্যান্ডবক্স): ${ref}`,
    ];
  }
  if (provider === 'nagad') {
    return [
      'Nagad অ্যাপ খুলুন → “Send Money” নির্বাচন করুন',
      'মার্চেন্ট নম্বর: 01800-000000 (স্যান্ডবক্স)',
      `পরিমাণ: ৳${taka}`,
      `নমুনা ট্রানজেকশন আইডি (স্যান্ডবক্স): ${ref}`,
    ];
  }
  return [
    'SSLCommerz চেকআউট পেজ খুলবে (স্যান্ডবক্স)',
    'যেকোনো কার্ড নম্বর গ্রহণ করা হবে — কোনো টাকা কাটবে না',
    `নমুনা ট্রানজেকশন আইডি (স্যান্ডবক্স): ${ref}`,
  ];
}

/**
 * ─── bKash Tokenized Checkout (live) ───
 * ক্রেডেনশিয়াল থাকলে সত্যিকারের টোকেন → create → execute কল করে।
 * এখানে শুধু create/execute-এর কাঠামো; রিডাইরেক্ট-ভিত্তিক পেমেন্টে ব্রাউজার
 * bkashURL-এ যায়, কলব্যাক আমাদের /api/billing/confirm-এ ফেরে।
 */

const BKASH_BASE = process.env.BKASH_BASE_URL ?? 'https://tokenized.sandbox.bka.sh/v1.2.0-beta';

interface BkashConfig {
  appKey: string; appSecret: string; username: string; password: string;
}

function bkashConfig(): BkashConfig | null {
  if (!bkashLive()) return null;
  return {
    appKey: process.env.BKASH_APP_KEY!,
    appSecret: process.env.BKASH_APP_SECRET!,
    username: process.env.BKASH_USERNAME!,
    password: process.env.BKASH_PASSWORD!,
  };
}

let bkashIdToken: { token: string; exp: number } | null = null;

/** bKash গ্র্যান্ট-টোকেন — ৫৮ মিনিট বৈধ, ১ ঘণ্টা ক্যাশ */
async function bkashToken(cfg: BkashConfig): Promise<string | null> {
  try {
    if (bkashIdToken && bkashIdToken.exp > Date.now()) return bkashIdToken.token;
    const res = await fetch(`${BKASH_BASE}/tokenized/checkout/token/grant`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        username: cfg.username,
        password: cfg.password,
      },
      body: JSON.stringify({ app_key: cfg.appKey, app_secret: cfg.appSecret }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { id_token?: string; expires_in?: number };
    if (!body.id_token) return null;
    const ttl = Math.min(body.expires_in ?? 3600, 3500) * 1000;
    bkashIdToken = { token: body.id_token, exp: Date.now() + ttl };
    return body.id_token;
  } catch {
    return null;
  }
}

/**
 * live bKash পেমেন্ট তৈরি — সফল হলে bkashURL ফেরে (ক্লায়েন্ট সেখানে রিডাইরেক্ট)।
 * ব্যর্থ হলে null — কলার sandbox-এ পড়ে যাবে (কখনো ইউজার আটকাবে না)।
 */
export async function bkashCreatePayment(
  order: { number: string; amount: number; plan: PlanId; cycle: Cycle },
  callbackBase: string,
): Promise<{ paymentID: string; bkashURL: string } | null> {
  const cfg = bkashConfig();
  if (!cfg) return null;
  const token = await bkashToken(cfg);
  if (!token) return null;
  try {
    const res = await fetch(`${BKASH_BASE}/tokenized/checkout/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: token, 'X-App-Key': cfg.appKey },
      body: JSON.stringify({
        mode: '0011',
        payerReference: order.number,
        callbackURL: `${callbackBase}?order=${encodeURIComponent(order.number)}`,
        amount: String(order.amount),
        currency: 'BDT',
        intent: 'sale',
        merchantInvoiceNumber: order.number,
      }),
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { paymentID?: string; bkashURL?: string };
    if (!body.paymentID || !body.bkashURL) return null;
    return { paymentID: body.paymentID, bkashURL: body.bkashURL };
  } catch {
    return null;
  }
}

/** কুপন-বাদে দাম — checkout ও confirm দুই জায়গায় একই নিয়ম */
export function finalAmount(plan: PlanId, cycle: Cycle, percentOff: number): { base: number; discount: number; total: number } {
  const base = planPrice(plan, cycle);
  const discount = Math.round((base * percentOff) / 100);
  return { base, discount, total: Math.max(0, base - discount) };
}
