/**
 * প্যাক-গ্যালারি এক-প্যাক API — GET /api/packs/[token]
 *
 * টোকেন দিয়ে পুরো প্যাক (data সহ) ফেরত + ডাউনলোড-কাউন্টার বাড়ে
 * (ফায়ার-অ্যান্ড-ফরগেট — কাউন্টার ব্যর্থ হলেও প্যাক দেওয়া চলবে)।
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

  let row;
  try {
    row = await db.packShare.findUnique({
      where: { token },
      select: { name: true, desc: true, author: true, data: true, entries: true, downloads: true, createdAt: true },
    });
  } catch {
    return NextResponse.json({ error: 'STORE_FAILED' }, { status: 503 });
  }
  if (!row) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  let data: unknown;
  try {
    data = JSON.parse(row.data);
  } catch {
    return NextResponse.json({ error: 'CORRUPT' }, { status: 500 });
  }

  // কাউন্টার — শুধু পরিসংখ্যান; ব্যর্থ হলে চুপচাপ বাদ
  void db.packShare.update({ where: { token }, data: { downloads: { increment: 1 } } }).catch(() => undefined);

  return NextResponse.json(
    {
      pack: {
        name: row.name,
        desc: row.desc,
        author: row.author,
        entries: row.entries,
        downloads: row.downloads,
        createdAt: row.createdAt,
        data,
      },
    },
    { headers: { 'cache-control': 'no-store' } },
  );
}
