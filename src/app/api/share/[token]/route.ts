/**
 * পাবলিক শেয়ার রিড API — GET /api/share/[token]
 * কোনো সেশন লাগে না; শুধু isPublic ডকুমেন্টই দেখা যায় (রিড-অনলি)।
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  if (!token || token.length < 8) {
    return NextResponse.json({ error: 'BAD_TOKEN' }, { status: 400 });
  }

  const doc = await db.document.findFirst({
    where: { shareToken: token, isPublic: true },
    select: {
      title: true,
      data: true,
      updatedAt: true,
      owner: { select: { name: true } },
    },
  });
  if (!doc) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  return NextResponse.json({
    document: {
      title: doc.title,
      data: doc.data,
      updatedAt: doc.updatedAt,
      ownerName: doc.owner?.name ?? null,
    },
  });
}
