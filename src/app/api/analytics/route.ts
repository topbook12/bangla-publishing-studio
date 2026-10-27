/**
 * প্রাইভেসি-ফ্রেন্ডলি অ্যানালিটিক্স API
 *
 * POST — ইভেন্ট রেকর্ড (হোয়াইটলিস্টবাধ্য; কুকি নেই, IP রাখা হয় না, ব্যক্তিগত
 * তথ্য নেই — শুধু ইভেন্ট নাম, পাথ ও রেফারার)।
 * GET — এগ্রিগেট স্ট্যাট (সাইন-ইন ছাড়া নয়) — ?stats=1 ড্যাশবোর্ড এটা পড়ে।
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const ALLOWED_EVENTS = new Set([
  'landing_view',
  'studio_open',
  'cloud_doc_save',
  'share_created',
  'share_viewed',
  'tour_completed',
]);

export async function POST(req: NextRequest) {
  // ইভেন্ট-ফালা গার্ড — অ্যানালিটিক্স টেবিল ফ্লাড আটকায়
  const limited = enforceRateLimit(req, { bucket: 'analytics:post', limit: 60 });
  if (limited) return limited;

  let body: { event?: string; path?: string; referrer?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }

  const event = body.event ?? '';
  if (!ALLOWED_EVENTS.has(event)) {
    return NextResponse.json({ error: 'UNKNOWN_EVENT' }, { status: 400 });
  }
  const path = (body.path ?? '/').slice(0, 200);
  const referrer = (body.referrer ?? '').slice(0, 200) || null;

  await db.analyticsEvent.create({ data: { event, path, referrer } });
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const since7 = new Date(Date.now() - 7 * 86400_000);
  const since30 = new Date(Date.now() - 30 * 86400_000);

  const [all, last7, last30, daily] = await Promise.all([
    db.analyticsEvent.groupBy({ by: ['event'], _count: { event: true } }),
    db.analyticsEvent.groupBy({ by: ['event'], where: { createdAt: { gte: since7 } }, _count: { event: true } }),
    db.analyticsEvent.groupBy({ by: ['event'], where: { createdAt: { gte: since30 } }, _count: { event: true } }),
    db.analyticsEvent.groupBy({
      by: ['event'],
      where: { event: { in: ['landing_view', 'studio_open', 'cloud_doc_save', 'share_viewed'] } },
      // দিন-ভিত্তিক গোনা SQLite-এ substr দিয়ে — createdAt(UTC) 'YYYY-MM-DD ...'
      _count: { event: true },
    }),
  ]);

  // শেষ ১৪ দিনের দৈনিক সিরিজ — র-এ সাধারণ কুয়েরি দিয়ে
  const raw = await db.$queryRawUnsafe<Array<{ day: string; event: string; n: number }>>(
    `SELECT substr(createdAt, 1, 10) AS day, event, COUNT(*) AS n
     FROM AnalyticsEvent
     WHERE createdAt >= ? AND event IN ('landing_view','studio_open','cloud_doc_save','share_viewed')
     GROUP BY day, event ORDER BY day ASC`,
    // দিন-প্রিফিক্স তুলনা — Prisma SQLite DateTime ফরম্যাট (space/T সেপারেটর) উভয়েই ঠিক
    new Date(Date.now() - 14 * 86400_000).toISOString().slice(0, 10),
  );

  const toMap = (rows: { event: string; _count: { event: number } }[]) =>
    Object.fromEntries(rows.map((r) => [r.event, r._count.event]));

  return NextResponse.json({
    totals: toMap(all),
    last7: toMap(last7),
    last30: toMap(last30),
    daily: raw.map((r) => ({ day: r.day, event: r.event, count: Number(r.n) })),
  });
}
