/**
 * নির্দিষ্ট ক্লাউড ডকুমেন্ট API — GET (ডাউনলোড/পুল), DELETE
 * PUT-এর দরকার নেই: সেভ POST /api/documents-এই হয় (আপসার্ট)।
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

type Ctx = { params: Promise<{ id: string }> };

function unauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

/** GET /api/documents/[id] — পুরো ডকুমেন্ট (পুল করার জন্য) */
export async function GET(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return unauthorized();

  const { id } = await ctx.params;
  const doc = await db.document.findFirst({
    where: { id, ownerId: uid },
  });
  if (!doc) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  return NextResponse.json({ document: doc });
}

/** DELETE /api/documents/[id] — শুধু মালিকই মুছতে পারে */
export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return unauthorized();

  const { id } = await ctx.params;
  const existing = await db.document.findFirst({
    where: { id, ownerId: uid },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });
  await db.document.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
