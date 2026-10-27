/**
 * POST /api/billing/checkout — অর্ডার তৈরি
 * body: { planId: 'pro'|'publisher', cycle: 'monthly'|'yearly', provider, couponCode? }
 *
 * মোড:
 *  - demo          → তাৎক্ষণিক confirm-যোগ্য (sandboxRef নেই)
 *  - sandbox       → নমুনা TrxID (sandboxRef) + ধাপ-নির্দেশনা
 *  - live (bKash)  → সত্যিকারের টোকেনাইজড চেকআউট — bkashURL প্রদানের কাঠামো;
 *                    ব্যর্থ হলে নিরাপদে sandbox-এ পড়ে যায় (ইউজার কখনো আটকায় না)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { isCycle, isPlanId } from '@/lib/plans';
import {
  finalAmount, isValidProvider, makeOrderNumber, makeSandboxRef,
  providerMode, sandboxInstructions, type ProviderId,
} from '@/lib/payments';
import { ensureCoupons, validateCouponCode } from '@/lib/billing';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let body: { planId?: string; cycle?: string; provider?: string; couponCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }

  if (!isPlanId(body.planId) || body.planId === 'free') {
    return NextResponse.json({ error: 'INVALID_PLAN' }, { status: 400 });
  }
  if (!isCycle(body.cycle)) {
    return NextResponse.json({ error: 'INVALID_PLAN' }, { status: 400 });
  }
  if (!isValidProvider(body.provider)) {
    return NextResponse.json({ error: 'INVALID_PROVIDER' }, { status: 400 });
  }
  const provider: ProviderId = body.provider;

  // কুপন (ঐচ্ছিক) — ব্যর্থ হলে স্পষ্ট কারণ
  let percentOff = 0;
  let couponCode: string | null = null;
  if (body.couponCode && body.couponCode.trim()) {
    await ensureCoupons();
    const c = await validateCouponCode(body.couponCode);
    if (!c.ok) {
      return NextResponse.json({ error: 'INVALID_COUPON', reason: c.reason }, { status: 400 });
    }
    percentOff = c.percentOff;
    couponCode = c.code;
  }

  const mode = providerMode(provider);
  const { discount, total } = finalAmount(body.planId, body.cycle, percentOff);

  const sandboxRef = mode === 'sandbox' ? makeSandboxRef(provider) : null;
  const instructions =
    mode === 'sandbox' && sandboxRef
      ? sandboxInstructions(provider, sandboxRef, total)
      : mode === 'live'
        ? ['bKash চেকআউট পেজে যাচ্ছেন — সেখানে পেমেন্ট সম্পন্ন করুন']
        : ['ডেমো মোড — নিশ্চিত করলেই প্ল্যান সক্রিয় হবে (কোনো টাকা লাগবে না)'];

  const order = await db.order.create({
    data: {
      userId: uid,
      number: makeOrderNumber(),
      plan: body.planId,
      cycle: body.cycle,
      provider,
      mode,
      amount: total, // চূড়ান্ত পরিশোধযোগ্য (কুপন ছাড়-বাদ) — confirm-এ পুনঃগণনা নেই
      discount,
      couponCode,
      status: 'pending',
      sandboxRef,
    },
  });

  return NextResponse.json({
    order: {
      id: order.id,
      plan: order.plan,
      cycle: order.cycle,
      provider: order.provider,
      mode: order.mode,
      amount: total,
      discount,
      currency: order.currency,
      sandboxRef,
      instructions,
    },
  });
}
