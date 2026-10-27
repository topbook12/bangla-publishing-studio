/**
 * GET /api/billing/subscription — বর্তমান প্ল্যান + ব্যবহার-মিটার + ইনভয়েস তালিকা
 * (বাতিল POST /api/billing/cancel-এ আলাদা রুট)
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { getEffectivePlan, limitOf } from '@/lib/billing';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return unauthorized();

  const eff = await getEffectivePlan(uid);

  const [docsUsed, sharesUsed, invoices, monthUsage] = await Promise.all([
    db.document.count({ where: { ownerId: uid } }),
    db.document.count({ where: { ownerId: uid, isPublic: true } }),
    db.invoice.findMany({
      where: { userId: uid },
      orderBy: { issuedAt: 'desc' },
      take: 30,
    }),
    // চলতি মাসের AI ব্যবহার
    db.usageCounter
      .findUnique({
        where: {
          userId_month: {
            userId: uid,
            month: `${new Date().getUTCFullYear()}-${String(new Date().getUTCMonth() + 1).padStart(2, '0')}`,
          },
        },
      })
      .catch(() => null),
  ]);

  const sub = eff.subscription;
  return NextResponse.json({
    plan: eff.plan,
    planSource: sub ? ('subscription' as const) : ('free' as const),
    status: sub ? sub.status : 'none',
    periodEnd: sub ? sub.periodEnd.toISOString() : null,
    cancelAt: sub && sub.status === 'canceled_at_period_end' ? sub.periodEnd.toISOString() : null,
    autoRenew: sub ? sub.status === 'active' : false,
    usage: {
      cloudDocs: { used: docsUsed, limit: limitOf(eff.plan, 'cloudDocs') },
      activeShares: { used: sharesUsed, limit: limitOf(eff.plan, 'shareLinks') },
      aiCredits: { used: monthUsage?.aiCredits ?? 0, limit: limitOf(eff.plan, 'aiCredits') },
    },
    invoices: invoices.map((i) => ({
      id: i.id,
      number: i.number,
      amount: i.amount,
      currency: i.currency,
      plan: i.plan,
      cycle: i.cycle,
      provider: i.provider,
      issuedAt: i.issuedAt.toISOString(),
    })),
    user: { name: session.user?.name ?? null, email: session.user?.email ?? null },
  });
}
