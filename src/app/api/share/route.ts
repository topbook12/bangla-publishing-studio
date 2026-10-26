/**
 * শেয়ার লিংক API — POST { documentId, enabled, rotate? }
 *
 * চালু করলে ডকুমেন্ট পাবলিক রিড-অনলি হয় (?share=<token> লিংকে);
 * rotate করলে পুরনো লিংক বাতিল হয়ে নতুন টোকেন আসে।
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
}

function makeToken() {
  // URL-নিরাপদ ২২-অক্ষরের টোকেন — crypto.randomUUID (Node 19+ গ্লোবাল)
  return crypto.randomUUID().replace(/-/g, '').slice(0, 22);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const uid = session?.user?.id;
  if (!uid) return unauthorized();

  let body: { documentId?: string; enabled?: boolean; rotate?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 });
  }
  if (!body.documentId) {
    return NextResponse.json({ error: 'NO_DOCUMENT_ID' }, { status: 400 });
  }

  const doc = await db.document.findFirst({
    where: { id: body.documentId, ownerId: uid },
    select: { id: true, isPublic: true, shareToken: true },
  });
  if (!doc) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 });

  const enabled = body.enabled !== false;
  const shareToken = enabled ? (body.rotate || !doc.shareToken ? makeToken() : doc.shareToken) : null;

  const updated = await db.document.update({
    where: { id: doc.id },
    data: { isPublic: enabled, shareToken },
    select: { id: true, isPublic: true, shareToken: true },
  });
  return NextResponse.json({ document: updated });
}
