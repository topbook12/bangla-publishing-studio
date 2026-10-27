/**
 * POST /api/billing/cancel — মেয়াদ-শেষে বাতিল (auto-renew বন্ধ)
 * প্ল্যান periodEnd পর্যন্ত চলবে, তারপর getEffectivePlan স্বয়ংক্রিয়ভাবে free-তে নামাবে।
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function POST() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const sub = await db.subscription.findUnique({ where: { userId: uid } });
  if (!sub || sub.status === 'expired' || sub.plan === 'free') {
    return NextResponse.json({ error: 'NO_SUBSCRIPTION' }, { status: 400 });
  }
  await db.subscription.update({
    where: { id: sub.id },
    data: { status: 'canceled_at_period_end' },
  });
  return NextResponse.json({ ok: true, cancelAt: sub.periodEnd.toISOString() });
}
