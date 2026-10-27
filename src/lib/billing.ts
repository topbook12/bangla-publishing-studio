/**
 * বিলিং সার্ভার-হেল্পার — ফেজ-৪ (দিন ৩১–৪০)
 *
 * সব বিলিং-এর কেন্দ্র: কার্যকর প্ল্যান (lazy downgrade সহ), কোটা হিসাব,
 * AI ক্রেডিট মিটার, কুপন যাচাই ও ইনভয়েস নম্বর। কোনো বিলিং-ত্রুটি কখনো
 * এডিটরকে আটকাবে না — ব্যর্থতায় fail-open (অফলাইন-ফার্স্ট অক্ষুণ্ণ)।
 */

import { db } from './db';
import { PLANS, type PlanId } from './plans';

export type EffectivePlan = {
  plan: PlanId;
  /** চালু সাবস্ক্রিপশন (থাকলে) — মেয়াদ শেষ হলে null */
  subscription: {
    plan: PlanId;
    status: 'active' | 'canceled_at_period_end';
    cycle: string;
    provider: string;
    periodStart: Date;
    periodEnd: Date;
  } | null;
};

/**
 * কার্যকর প্ল্যান — Subscription-ই সত্য-উৎস; User.plan শুধু দ্রুত পড়ার ক্যাশ।
 * মেয়াদ শেষ হলে lazy downgrade: subscription 'expired', user.plan 'free'।
 */
export async function getEffectivePlan(userId: string): Promise<EffectivePlan> {
  const sub = await db.subscription.findUnique({ where: { userId } });
  if (!sub || sub.plan === 'free') return { plan: 'free', subscription: null };

  if (sub.periodEnd.getTime() <= Date.now()) {
    // lazy downgrade — পরের পড়ায় আর এই পথে আসবে না
    await Promise.all([
      db.subscription.update({ where: { id: sub.id }, data: { status: 'expired' } }).catch(() => null),
      db.user.update({ where: { id: userId }, data: { plan: 'free' } }).catch(() => null),
    ]);
    return { plan: 'free', subscription: null };
  }

  const plan = (sub.plan === 'pro' || sub.plan === 'publisher' ? sub.plan : 'free') as PlanId;
  return {
    plan,
    subscription: {
      plan,
      status: sub.status === 'canceled_at_period_end' ? 'canceled_at_period_end' : 'active',
      cycle: sub.cycle,
      provider: sub.provider,
      periodStart: sub.periodStart,
      periodEnd: sub.periodEnd,
    },
  };
}

/** কোটা সীমা — কার্যকর প্ল্যান থেকে */
export function limitOf(plan: PlanId, what: 'cloudDocs' | 'shareLinks' | 'aiCredits'): number {
  return PLANS[plan]?.limits[what] ?? PLANS.free.limits[what];
}

export interface QuotaCheck {
  allowed: boolean;
  used: number;
  limit: number; // -1 = আনলিমিটেড
}

/** ক্লাউড ডকুমেন্ট কোটা */
export async function checkDocQuota(userId: string, plan: PlanId): Promise<QuotaCheck> {
  const limit = limitOf(plan, 'cloudDocs');
  if (limit < 0) return { allowed: true, used: 0, limit: -1 };
  const used = await db.document.count({ where: { ownerId: userId } });
  return { allowed: used < limit, used, limit };
}

/** চালু শেয়ার লিংক কোটা (এই ডকটি আগে থেকেই পাবলিক থাকলে সেটা গোনে না) */
export async function checkShareQuota(userId: string, plan: PlanId, alreadyPublic: boolean): Promise<QuotaCheck> {
  const limit = limitOf(plan, 'shareLinks');
  if (limit < 0 || alreadyPublic) return { allowed: true, used: 0, limit };
  const used = await db.document.count({ where: { ownerId: userId, isPublic: true } });
  return { allowed: used < limit, used, limit };
}

function currentMonth(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/**
 * AI ক্রেডিট — যাচাই + বৃদ্ধি (এক কলে)। BYOK ব্যবহারকারীর জন্য ডাকা হয় না।
 * যেকোনো ত্রুটিতে fail-open: AI কখনো বিলিং-এর কারণে ভাঙবে না।
 */
export async function consumeAiCredit(userId: string): Promise<
  { allowed: true } | { allowed: false; used: number; limit: number }
> {
  try {
    const eff = await getEffectivePlan(userId);
    const limit = limitOf(eff.plan, 'aiCredits');
    if (limit < 0) return { allowed: true };
    const month = currentMonth();
    const row = await db.usageCounter.upsert({
      where: { userId_month: { userId, month } },
      create: { userId, month, aiCredits: 1 },
      update: { aiCredits: { increment: 1 } },
    });
    if (row.aiCredits > limit) return { allowed: false, used: row.aiCredits, limit };
    return { allowed: true };
  } catch {
    return { allowed: true }; // বিলিং ডাউন → AI চলবে (fail-open)
  }
}

// ─── কুপন ───

export const SEED_COUPONS = [
  { code: 'BANGLA10', percentOff: 10, maxUses: 0, expiresAt: null as Date | null },
  { code: 'SHURJO20', percentOff: 20, maxUses: 100, expiresAt: null as Date | null },
];

/** সিড কুপন নিশ্চিত — idempotent (coupon যাচাইয়ের আগে ডাকা হয়) */
export async function ensureCoupons(): Promise<void> {
  try {
    for (const c of SEED_COUPONS) {
      await db.coupon.upsert({
        where: { code: c.code },
        create: c,
        update: {}, // ব্যবহার-গণনা ওভাররাইট করব না
      });
    }
  } catch { /* ignore */ }
}

export type CouponCheck =
  | { ok: true; code: string; percentOff: number }
  | { ok: false; reason: 'not_found' | 'expired' | 'usage_limit' };

export async function validateCouponCode(raw: string): Promise<CouponCheck> {
  const code = raw.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'not_found' };
  const c = await db.coupon.findUnique({ where: { code } });
  if (!c || !c.active) return { ok: false, reason: 'not_found' };
  if (c.expiresAt && c.expiresAt.getTime() < Date.now()) return { ok: false, reason: 'expired' };
  if (c.maxUses > 0 && c.uses >= c.maxUses) return { ok: false, reason: 'usage_limit' };
  return { ok: true, code: c.code, percentOff: c.percentOff };
}

// ─── ইনভয়েস নম্বর — INV-YYYYMM-NNN (মাসভিত্তিক ধারাবাহিক) ───

export async function nextInvoiceNumber(): Promise<string> {
  const d = new Date();
  const ym = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  const count = await db.invoice.count();
  const seq = String(count + 1).padStart(3, '0');
  return `INV-${ym}-${seq}`;
}

/** পরিশোধিত অর্ডার থেকে সাবস্ক্রিপশন-মেয়াদ গণনা */
export function periodFromNow(cycle: string): { start: Date; end: Date } {
  const start = new Date();
  const end = new Date(start);
  if (cycle === 'yearly') end.setUTCFullYear(end.getUTCFullYear() + 1);
  else end.setUTCMonth(end.getUTCMonth() + 1);
  return { start, end };
}
