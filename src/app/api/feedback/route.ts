/**
 * ফিডব্যাক API — সাইকেল-১ (ইউজার-ফিডব্যাক-চালিত উন্নয়ন চক্র)
 *
 * POST /api/feedback — মতামত জমা (অ্যানোনিমাস অনুমোদিত; সাইন-ইন থাকলে লিংক)
 *   body: { rating: 1-5, category, message, page?, website? (হানিপট — বট ট্র্যাপ) }
 * GET /api/feedback — সাইন-ইন বাধ্যতামূলক; এগ্রিগেট + সাম্প্রতিক তালিকা
 *   (?stats=1 ড্যাশবোর্ড এটা পড়ে)
 *
 * প্রাইভেসি: ইমেইল/IP জমা হয় না; সাইন-ইন ইউজারের ক্ষেত্রে শুধু userId লিংক।
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const CATEGORIES = new Set(['bug', 'idea', 'praise', 'question', 'other']);
const MAX_MESSAGE = 2000;

export async function POST(req: NextRequest) {
  // মতামত-ফালা/বট গার্ড
  const limited = enforceRateLimit(req, { bucket: 'feedback:post', limit: 5 });
  if (limited) return limited;

  let body: {
    rating?: number;
    category?: string;
    message?: string;
    page?: string;
    website?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }

  // হানিপট — অদৃশ্য ফিল্ডে লেখা মানে বট; নীরবে "সফল" ফেরত (বট বোঝে না)
  if (body.website && body.website.trim() !== '') {
    return NextResponse.json({ ok: true });
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'INVALID_RATING' }, { status: 400 });
  }
  if (!CATEGORIES.has(body.category ?? '')) {
    return NextResponse.json({ error: 'INVALID_CATEGORY' }, { status: 400 });
  }
  const message = (body.message ?? '').trim().slice(0, MAX_MESSAGE);
  if (message.length < 3) {
    return NextResponse.json({ error: 'MESSAGE_TOO_SHORT' }, { status: 400 });
  }
  const page = (body.page ?? 'studio').slice(0, 40);

  const session = await getServerSession(authOptions);
  const uid = session?.user?.id ?? null;

  const fb = await db.feedback.create({
    data: { rating, category: body.category!, message, page, userId: uid },
  });

  return NextResponse.json({ ok: true, id: fb.id });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const [total, aggCat, aggStatus, aggRating, recent] = await Promise.all([
    db.feedback.count(),
    db.feedback.groupBy({ by: ['category'], _count: { _all: true } }),
    db.feedback.groupBy({ by: ['status'], _count: { _all: true } }),
    db.feedback.groupBy({ by: ['rating'], _count: { _all: true } }),
    db.feedback.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        rating: true,
        category: true,
        message: true,
        page: true,
        status: true,
        createdAt: true,
      },
    }),
  ]);

  const avg =
    aggRating.reduce((sum, r) => sum + r.rating * r._count._all, 0) /
    Math.max(1, total);

  return NextResponse.json({
    total,
    avg: Math.round(avg * 10) / 10,
    byCategory: Object.fromEntries(aggCat.map((r) => [r.category, r._count._all])),
    byStatus: Object.fromEntries(aggStatus.map((r) => [r.status, r._count._all])),
    byRating: Object.fromEntries(aggRating.map((r) => [r.rating, r._count._all])),
    recent,
  });
}
