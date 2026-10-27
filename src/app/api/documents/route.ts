/**
 * ক্লাউড ডকুমেন্ট API — তালিকা (GET) ও সেভ/আপসার্ট (POST)
 *
 * local-first নীতি: ব্রাউজারের Dexie (IndexedDB) সবসময় প্রাথমিক স্টোর।
 * এই API শুধু সাইন-ইন করা ব্যবহারকারীর অপশনাল ক্লাউড মিরর — অফলাইনে অ্যাপ
 * পুরোপুরি কাজ করে।
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { checkDocQuota, getEffectivePlan } from '@/lib/billing';
import { docByteLimit, type PlanId } from '@/lib/plans';

export const runtime = 'nodejs';

/** ফলব্যাক সাইজ-ক্যাপ — প্ল্যান-সীমা সাইন-আউট/বিলিং-ডাউন অবস্থায়ও রক্ষা করে */
const MAX_DATA_BYTES_FALLBACK = 8 * 1024 * 1024;

function unauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

/** GET /api/documents — সাইন-ইন ব্যবহারকারীর ক্লাউড ডকুমেন্ট তালিকা */
export async function GET() {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return unauthorized();

  const docs = await db.document.findMany({
    where: { ownerId: uid },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      version: true,
      isPublic: true,
      shareToken: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return NextResponse.json({ documents: docs });
}

/**
 * POST /api/documents — ক্লাউডে সেভ (আপসার্ট)
 * body: { id?, title, data(JSON string), baseVersion? }
 * baseVersion মিললে হালনাগাদ হবে (version+1); না মিললে 409 VERSION_CONFLICT
 * (অর্থাৎ অন্য ডিভাইস মাঝপথে সেভ করেছে) — ক্লায়েন্ট তখন সিদ্ধান্ত নেয়।
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return unauthorized();

  let body: { id?: string; title?: string; data?: string; baseVersion?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }

  const title = (body.title ?? '').trim().slice(0, 300) || 'শিরোনামহীন';
  const data = body.data ?? '';
  if (typeof data !== 'string' || data.length === 0) {
    return NextResponse.json({ error: 'EMPTY_DATA' }, { status: 400 });
  }

  // ফেজ-৪ — সাইজ-ক্যাপ প্ল্যান অনুযায়ী (বিলিং ব্যর্থ হলে ফলব্যাক ক্যাপ — fail-open)
  let plan: PlanId = 'free';
  try {
    plan = (await getEffectivePlan(uid)).plan;
  } catch { /* fallback plan = free */ }
  const cap = docByteLimit(plan) || MAX_DATA_BYTES_FALLBACK;
  if (data.length > cap) {
    return NextResponse.json({ error: 'DATA_TOO_LARGE', plan, limitBytes: cap }, { status: 413 });
  }

  // ফেজ-৪ — ক্লাউড-ডক কোটা: শুধু নতুন ডকুমেন্টে প্রযোজ্য; আপডেট সবসময় খোলা
  // (লোকাল-ফার্স্ট অক্ষুণ্ণ — ব্যর্থতায় fail-open, কখনো সেভ আটকাবে না)
  if (!body.id) {
    try {
      const q = await checkDocQuota(uid, plan);
      if (!q.allowed) {
        return NextResponse.json(
          { error: 'QUOTA_DOCS', plan, limit: q.limit, used: q.used },
          { status: 402 },
        );
      }
    } catch { /* fail-open */ }
  }

  if (body.id) {
    const existing = await db.document.findFirst({
      where: { id: body.id, ownerId: uid },
      select: { id: true, version: true, shareToken: true, isPublic: true },
    });
    if (!existing) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

    if (typeof body.baseVersion === 'number' && body.baseVersion !== existing.version) {
      return NextResponse.json(
        { error: 'VERSION_CONFLICT', current: existing },
        { status: 409 },
      );
    }

    const doc = await db.document.update({
      where: { id: existing.id },
      data: { title, data, version: { increment: 1 } },
      select: {
        id: true, title: true, version: true, isPublic: true, shareToken: true, updatedAt: true,
      },
    });
    return NextResponse.json({ document: doc });
  }

  const doc = await db.document.create({
    data: { ownerId: uid, title, data },
    select: {
      id: true, title: true, version: true, isPublic: true, shareToken: true, updatedAt: true,
    },
  });
  return NextResponse.json({ document: doc }, { status: 201 });
}
