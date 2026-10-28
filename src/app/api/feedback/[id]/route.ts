/**
 * PATCH /api/feedback/[id] — ফিডব্যাক স্টেটাস আপডেট (লুপ-বন্ধকরণ)
 * body: { status: 'new' | 'triaged' | 'done' }
 * সাইন-ইন বাধ্যতামূলক (?stats=1 ড্যাশবোর্ড থেকে ব্যবহৃত)।
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

const STATUSES = new Set(['new', 'triaged', 'done']);

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const { id } = await ctx.params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }
  if (!STATUSES.has(body.status ?? '')) {
    return NextResponse.json({ error: 'INVALID_STATUS' }, { status: 400 });
  }

  try {
    const updated = await db.feedback.update({
      where: { id },
      data: { status: body.status! },
      select: { id: true, status: true },
    });
    return NextResponse.json({ ok: true, feedback: updated });
  } catch {
    return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  }
}
