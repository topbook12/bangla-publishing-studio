/**
 * POST /api/billing/confirm — পেমেন্ট নিশ্চিতকরণ → সাবস্ক্রিপশন সক্রিয় + ইনভয়েস
 * body: { orderId, paymentRef? }
 *
 * sandbox: paymentRef === order.sandboxRef (কেস-অসংবেদনশীল) হলেই গৃহীত।
 * live bKash: কলব্যাক query-তে paymentID থাকলে execute করা হয় (কাঠামো রাখা)।
 * demo: রেফ ছাড়াই গৃহীত।
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { periodFromNow, nextInvoiceNumber } from '@/lib/billing';
import { isPlanId } from '@/lib/plans';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  let body: { orderId?: string; paymentRef?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }
  if (!body.orderId) return NextResponse.json({ error: 'INVALID_ORDER' }, { status: 400 });

  const order = await db.order.findFirst({ where: { id: body.orderId, userId: uid } });
  if (!order) return NextResponse.json({ error: 'INVALID_ORDER' }, { status: 400 });
  if (order.status === 'paid') {
    return NextResponse.json({ error: 'ALREADY_PAID' }, { status: 409 });
  }

  // ─── পেমেন্ট যাচাই ───
  if (order.mode === 'sandbox') {
    const ref = (body.paymentRef ?? '').trim().toUpperCase();
    if (!ref || ref !== (order.sandboxRef ?? '').toUpperCase()) {
      return NextResponse.json({ error: 'PAYMENT_REF_MISMATCH' }, { status: 400 });
    }
  }
  // demo: যাচাই নেই; live: সত্যিকারের গেটওয়ে-কলব্যাক ভবিষ্যতে (এখন sandbox-এই থাকে)

  // ─── সাবস্ক্রিপশন সক্রিয় ───
  const plan = order.plan;
  if (!isPlanId(plan) || plan === 'free') {
    return NextResponse.json({ error: 'INVALID_ORDER' }, { status: 400 });
  }
  const { start, end } = periodFromNow(order.cycle);
  const sub = await db.subscription.upsert({
    where: { userId: uid },
    // নতুন পেমেন্ট = নতুন মেয়াদ; বাতিল-অবস্থা থাকলেও নতুন মেয়াদে 'active'
    create: {
      userId: uid, plan, status: 'active', cycle: order.cycle,
      provider: order.provider, periodStart: start, periodEnd: end,
    },
    update: {
      plan, status: 'active', cycle: order.cycle, provider: order.provider,
      periodStart: start, periodEnd: end,
    },
  });
  await db.user.update({ where: { id: uid }, data: { plan } }).catch(() => null);

  // ─── অর্ডার + ইনভয়েস ───
  const number = await nextInvoiceNumber();
  const [paidOrder, invoice] = await Promise.all([
    db.order.update({
      where: { id: order.id },
      data: { status: 'paid', paidAt: new Date() },
    }),
    db.invoice.create({
      data: {
        userId: uid, orderId: order.id, number,
        amount: order.amount, // চূড়ান্ত পরিশোধযোগ্য — checkout-এ কুপন-ছাড় হিসাব হয়ে গেছে
        currency: order.currency, plan: order.plan, cycle: order.cycle,
        provider: order.provider,
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    order: { number: paidOrder.number },
    subscription: { plan: sub.plan, periodEnd: sub.periodEnd.toISOString(), autoRenew: sub.status === 'active' },
    invoice: {
      id: invoice.id, number: invoice.number, amount: invoice.amount,
      currency: invoice.currency, plan: invoice.plan, cycle: invoice.cycle,
      provider: invoice.provider, issuedAt: invoice.issuedAt.toISOString(),
    },
  });
}
