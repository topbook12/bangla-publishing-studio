/**
 * প্ল্যান ক্যাটালগ ও সীমা — ফেজ-৪ (দিন ৩১–৪০)
 *
 * সার্ভার-সাইড সত্য-উৎস: প্রতিটি প্ল্যানের দাম (BDT) ও কোটা। ক্লায়েন্ট শুধু
 * /api/billing/plans থেকে এটা পড়ে — UI-তে নাম/বর্ণনা i18n দিয়ে আসে (bn/hi/en)।
 *
 * নীতি: local-first অক্ষুণ্ণ — সীমা শুধু ক্লাউড-মিরর (ডকুমেন্ট সেভ/শেয়ার) ও
 * প্ল্যাটফর্ম-ডেমো AI ক্রেডিটে প্রযোজ্য। অফলাইন এডিটর, এক্সপোর্ট, টেমপ্লেট —
 * কখনোই কোটায় আটকায় না।
 */

export type PlanId = 'free' | 'pro' | 'publisher';
export type Cycle = 'monthly' | 'yearly';

export interface PlanLimits {
  /** ক্লাউডে সর্বোচ্চ ডকুমেন্ট — -1 = আনলিমিটেড */
  cloudDocs: number;
  /** একসাথে চালু পাবলিক শেয়ার লিংক — -1 = আনলিমিটেড */
  shareLinks: number;
  /** প্ল্যাটফর্ম-ডেমো AI কল/মাস (BYOK ব্যবহারকারীর জন্য প্রযোজ্য নয়) */
  aiCredits: number;
  /** প্রতি ডকুমেন্টের সর্বোচ্চ JSON বাইট */
  docBytes: number;
}

export interface PlanDef {
  id: PlanId;
  monthlyPrice: number; // BDT
  yearlyPrice: number; // BDT (২ মাস ফ্রি — ১০ মাসের দাম)
  limits: PlanLimits;
  highlight: boolean;
}

const MB = 1024 * 1024;

export const PLANS: Record<PlanId, PlanDef> = {
  free: {
    id: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    limits: { cloudDocs: 3, shareLinks: 3, aiCredits: 25, docBytes: 2 * MB },
    highlight: false,
  },
  pro: {
    id: 'pro',
    monthlyPrice: 299,
    yearlyPrice: 2990,
    limits: { cloudDocs: 100, shareLinks: -1, aiCredits: 600, docBytes: 4 * MB },
    highlight: true,
  },
  publisher: {
    id: 'publisher',
    monthlyPrice: 899,
    yearlyPrice: 8990,
    limits: { cloudDocs: -1, shareLinks: -1, aiCredits: 2500, docBytes: 8 * MB },
    highlight: false,
  },
};

export const PLAN_IDS: PlanId[] = ['free', 'pro', 'publisher'];

export function isPlanId(v: unknown): v is PlanId {
  return v === 'free' || v === 'pro' || v === 'publisher';
}

export function isCycle(v: unknown): v is Cycle {
  return v === 'monthly' || v === 'yearly';
}

/** প্ল্যান + সাইকেলের দাম (টাকা) */
export function planPrice(plan: PlanId, cycle: Cycle): number {
  return cycle === 'yearly' ? PLANS[plan].yearlyPrice : PLANS[plan].monthlyPrice;
}

/** নিরাপদে docBytes — অজানা প্ল্যান হলে ফ্রি-রটা */
export function docByteLimit(plan: PlanId): number {
  return PLANS[plan]?.limits.docBytes ?? PLANS.free.limits.docBytes;
}
