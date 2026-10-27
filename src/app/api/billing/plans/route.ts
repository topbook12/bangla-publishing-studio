/**
 * GET /api/billing/plans — প্ল্যান ক্যাটালগ ও পেমেন্ট-প্রোভাইডার
 * সাইন-ইন ছাড়াই কাজ করে (ল্যান্ডিং প্রাইসিং-এর জন্য)।
 */

import { NextResponse } from 'next/server';
import { PLANS, PLAN_IDS } from '@/lib/plans';
import { listProviders } from '@/lib/payments';

export const runtime = 'nodejs';

export async function GET() {
  const plans = PLAN_IDS.map((id) => {
    const p = PLANS[id];
    return {
      id: p.id,
      monthlyPrice: p.monthlyPrice,
      yearlyPrice: p.yearlyPrice,
      limits: p.limits,
      highlight: p.highlight,
    };
  });
  return NextResponse.json({ plans, providers: listProviders() });
}
