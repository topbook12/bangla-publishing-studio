/**
 * AI চিত্র তৈরি — POST /api/ai/image
 * ────────────────────────────────────
 * হাতে-আঁকা চিত্র-স্টুডিওর "AI চিত্র" বাটনের পেছনের রুট — বর্ণনা থেকে
 * পরীক্ষা/বই-উপযোগী ছবি বানিয়ে দেয় (মূলত লাইন-আর্ট/স্কেচ ধাঁচ)।
 *
 * ব্যবহারকারীর নিজের ছবি-API নেই — প্ল্যাটফর্মের বিল্ট-ইন SDK
 * (z-ai-web-dev-sdk) সবসময় উপলব্ধ, তাই এই রুট সবসময় ডেমো-SDK ব্যবহার করে।
 * প্রম্পট ছোট রাখা হয়, রেট-লিমিট কড়া (IP-প্রতি) — প্ল্যাটফর্ম-খরচ সুরক্ষিত।
 *
 * বডি: { prompt: string, size?: '1024x1024' | '1344x768' | '768x1344' | '1152x864' }
 * উত্তর: { ok: true, dataUrl: 'data:image/png;base64,…' } | { ok: false, error, hintKey? }
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 120;

/** অনুমোদিত মাপ — শিক্ষক-নথিতে বেশিরভাগই ল্যান্ডস্কেপ/স্কয়ার চিত্র */
const SIZES = new Set(['1024x1024', '1344x768', '768x1344', '1152x864']);
const MAX_PROMPT_CHARS = 1200;
/** IP-প্রতি মিনিটে সর্বোচ্চ চিত্র — প্ল্যাটফর্ম-ক্রেডেনশিয়াল সুরক্ষা */
const RATE_PER_MIN = 6;

/** ইন-মেমোরি রেট-লিমিটার (একক-ইনস্ট্যান্স; প্রক্সি-প্রথা অনুযায়ী যথেষ্ট) */
const hits = new Map<string, number[]>();
function allowRate(key: string, limit: number): boolean {
  const now = Date.now();
  const windowStart = now - 60_000;
  const list = (hits.get(key) ?? []).filter((t) => t > windowStart);
  if (list.length >= limit) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 5000) {
    // পুরনো এন্ট্রি ঝাড়াই — মেমোরি-নিরাপত্তা
    for (const [k, v] of hits) {
      if (v.every((t) => t <= windowStart)) hits.delete(k);
    }
  }
  return true;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  return (fwd ? fwd.split(',')[0] : '') || req.headers.get('x-real-ip') || 'local';
}

/** পরীক্ষা/বই-উপযোগী চিত্র — সিস্টেম-ধাঁচ প্রম্পটে মোড়া */
function composePrompt(userPrompt: string): string {
  return [
    userPrompt.trim(),
    'Clean black-and-white line-art illustration for an exam paper or textbook,',
    'white background, thin crisp black strokes, simple educational diagram style,',
    'clear outlines, print-friendly, high contrast, no watermark, no signature.',
  ].join(' ');
}

export async function POST(req: NextRequest) {
  let body: { prompt?: unknown; size?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) {
    return NextResponse.json({ ok: false, error: 'Prompt required', hintKey: 'sketch.err.noPrompt' }, { status: 400 });
  }
  if (prompt.length > MAX_PROMPT_CHARS) {
    return NextResponse.json({ ok: false, error: 'Prompt too long', hintKey: 'sketch.err.tooLong' }, { status: 413 });
  }
  const size = (typeof body.size === 'string' && SIZES.has(body.size) ? body.size : '1024x1024') as string;

  if (!allowRate(clientIp(req), RATE_PER_MIN)) {
    return NextResponse.json({ ok: false, error: 'Rate limit reached', hintKey: 'sketch.err.rate' }, { status: 429 });
  }

  try {
    const { default: ZAI } = await import('z-ai-web-dev-sdk');
    const zai = await ZAI.create();
    const res = await zai.images.generations.create({
      prompt: composePrompt(prompt),
      size: size as '1024x1024',
    });
    const base64 = res?.data?.[0]?.base64;
    if (!base64) throw new Error('EMPTY_RESPONSE');
    return NextResponse.json({ ok: true, dataUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'IMAGE_FAILED';
    return NextResponse.json(
      { ok: false, error: msg, hintKey: msg === 'EMPTY_RESPONSE' ? 'sketch.err.empty' : 'sketch.err.fail' },
      { status: 502 },
    );
  }
}
