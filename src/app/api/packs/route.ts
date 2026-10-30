/**
 * প্যাক-গ্যালারি API — দিন ৬২ (কমিউনিটি টেমপ্লেট-প্যাক পাবলিশ/তালিকা)
 *
 * GET  /api/packs          → সাম্প্রতিক ২৪টি প্যাক (data ছাড়া — হালকা তালিকা)
 * POST /api/packs          → প্যাক পাবলিশ (validatePack-পাস হলে; বেনামি-অনুমোদিত,
 *                             ৩/ঘণ্টা রেট-লিমিট — কমিউনিটি ভাইরাল-লুপ ফ্রিন্ডলি)
 *
 * ক্লাউড-ঐচ্ছিক: ব্যর্থতা হলে UI লোকাল-পথে ফিরে যায় (ফাইল-ডাউনলোড /
 * URL-শেয়ার) — প্যাক-ব্যবস্থা পুরোপুরি অফলাইনেও চলে।
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validatePack } from '@/lib/template-pack';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const MAX_PACK_JSON = 256 * 1024; // প্যাক-ফাইল-সীমার সাথে মিল
const GALLERY_LIMIT = 24;

function makeToken(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 22);
}

/** GET — গ্যালারি-তালিকা (সর্বশেষ ২৪টি; পেলোড ছোট রাখতে data বাদ) */
export async function GET() {
  try {
    const rows = await db.packShare.findMany({
      orderBy: { createdAt: 'desc' },
      take: GALLERY_LIMIT,
      select: {
        token: true, name: true, desc: true, author: true,
        entries: true, downloads: true, createdAt: true,
      },
    });
    return NextResponse.json({ packs: rows }, { headers: { 'cache-control': 'no-store' } });
  } catch {
    // ক্লাউড-ডাউন/লোকাল-মোড — গ্যালারি খালি হিসেবে ধরা হয় (UI লোকাল-পথে ফিরে যায়)
    return NextResponse.json({ packs: [] }, { headers: { 'cache-control': 'no-store' } });
  }
}

/** POST — প্যাক পাবলিশ { name, desc?, author?, entries: [...] } (v1) */
export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { bucket: 'packs:publish', limit: 3, windowMs: 60 * 60 * 1000 });
  if (limited) return limited;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }

  const text = JSON.stringify(raw ?? {});
  if (text.length > MAX_PACK_JSON) {
    return NextResponse.json({ error: 'TOO_LARGE' }, { status: 413 });
  }

  const pack = validatePack(raw);
  if (!pack) {
    return NextResponse.json({ error: 'INVALID_PACK' }, { status: 400 });
  }

  try {
    const row = await db.packShare.create({
      data: {
        token: makeToken(),
        name: pack.name,
        ...(pack.desc ? { desc: pack.desc } : {}),
        ...(pack.author ? { author: pack.author } : {}),
        data: JSON.stringify(pack),
        entries: pack.entries.length,
      },
      select: { token: true, name: true, createdAt: true },
    });
    return NextResponse.json({ pack: row }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'STORE_FAILED' }, { status: 503 });
  }
}
