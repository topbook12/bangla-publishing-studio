/**
 * POST /api/billing/coupon — কুপন যাচাই (দাম কত হবে দেখার জন্য)
 * body: { code, planId, cycle }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { isCycle, isPlanId } from '@/lib/plans';
import { finalAmount } from '@/lib/payments';
import { ensureCoupons, validateCouponCode } from '@/lib/billing';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let body: { code?: string; planId?: string; cycle?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }
  if (!isPlanId(body.planId) || body.planId === 'free' || !isCycle(body.cycle)) {
    return NextResponse.json({ error: 'INVALID_PLAN' }, { status: 400 });
  }

  await ensureCoupons();
  const c = await validateCouponCode(body.code ?? '');
  if (!c.ok) {
    return NextResponse.json({ error: 'INVALID_COUPON', reason: c.reason }, { status: 400 });
  }

  const { total: amount, discount } = finalAmount(body.planId, body.cycle, c.percentOff);
  return NextResponse.json({
    ok: true,
    coupon: { code: c.code, percentOff: c.percentOff },
    amount,
    discount,
    currency: 'BDT',
  });
}
