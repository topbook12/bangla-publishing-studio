/**
 * মডেল তালিকা প্রক্সি — POST /api/ai/models
 * ────────────────────────────────────────
 * BYOK: ব্যবহারকারীর নিজের কি দিয়ে প্রোভাইডারের `GET {base}models`
 * এন্ডপয়েন্ট থেকে উপলব্ধ মডেলের তালিকা এনে দেয় — ফলে মডেলের নাম
 * আন্দাজে টাইপ করে 404 খাওয়ার দরকারই পড়ে না; তালিকা থেকে বাছলেই হলো।
 *
 * নিরাপত্তা: /api/ai/chat-এর সাথে একই শেয়ার্ড SSRF গার্ড (ai-proxy-guard);
 * কি শুধু এই রিকোয়েস্টে পাস-থ্রু হয় — লগ/স্টোর কিছুই হয় না।
 * রেট-লিমিট: ২০ কল/মিনিট প্রতি IP (তালিকা-লোড হালকা কল, তবু সীমিত)।
 *
 * বডি: { baseUrl, apiKey, provider? }
 * উত্তর: { ok: true, models: string[] } | { ok: false, error, hintKey?, detail? }
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  allowRate, assertSafeBase, clientIp, extractModelIds, isGeminiHost, originIsLocalHost,
} from '@/lib/ai-proxy-guard';

export const runtime = 'nodejs';
export const maxDuration = 60;

const TIMEOUT_MS = 30_000;
const MAX_MODELS = 400;

interface ModelsBody {
  baseUrl?: string;
  apiKey?: string;
  provider?: string;
}

function jsonError(error: string, hintKey?: string, detail?: string) {
  return NextResponse.json({ ok: false, error, hintKey, detail }, { status: 200 });
}

/** প্রোভাইডারের ত্রুটি-বার্তা (raw) — রোগ-নির্ণয়ের জন্য */
async function upstreamDetail(res: Response): Promise<string> {
  try {
    let errJson = (await res.json()) as unknown;
    // Google-ধাঁচের অ্যারে-মোড়ানো ত্রুটি: [{"error":{...}}]
    if (Array.isArray(errJson)) errJson = errJson[0];
    const obj = (errJson ?? {}) as Record<string, unknown>;
    const err = obj?.error as Record<string, unknown> | string | undefined;
    if (typeof err === 'string') return err.slice(0, 300);
    return ((err?.message as string) ?? (obj?.message as string) ?? '').slice(0, 300);
  } catch {
    return (await res.text().catch(() => '')).slice(0, 300);
  }
}

export async function POST(req: NextRequest) {
  const originIsLocal = originIsLocalHost(req.headers.get('host'));

  let body: ModelsBody;
  try {
    body = (await req.json()) as ModelsBody;
  } catch {
    return jsonError('Invalid request body');
  }

  const baseUrl = (body.baseUrl ?? '').trim();
  const apiKey = (body.apiKey ?? '').trim();
  if (!baseUrl || !apiKey) {
    return jsonError('MISSING_CONFIG', 'ai.err.config');
  }

  const ip = clientIp(req);
  if (!allowRate(`${ip}:models`, 20)) {
    return jsonError('Rate limit reached', 'ai.err.rateLimit');
  }

  // SSRF গার্ড — /api/ai/chat-এর সাথে একই নিয়ম
  const safeBase = assertSafeBase(baseUrl, originIsLocal);
  if (!safeBase) {
    return jsonError('Base URL not allowed', 'ai.err.badUrl');
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
  if (body.provider === 'claude') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  try {
    const res = await fetch(`${safeBase}models`, {
      method: 'GET',
      headers,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      // Gemini-তে compat /models ব্যর্থ হলে native তালিকা — সেটাই সবচেয়ে নির্ভরযোগ্য
      if (isGeminiHost(safeBase)) {
        const nres = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
          method: 'GET',
          headers: { 'x-goog-api-key': apiKey },
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!nres.ok) {
          const detail = await upstreamDetail(nres);
          const e = new Error(`${nres.status}${detail ? `: ${detail}` : ''}`) as Error & { status?: number };
          e.status = nres.status;
          throw e;
        }
        const models = extractModelIds(await nres.json());
        if (models.length === 0) return jsonError('NO_MODELS', 'ai.err.model', `${safeBase}models`);
        return NextResponse.json({ ok: true, models });
      }
      const detail = await upstreamDetail(res);
      const e = new Error(`${res.status}${detail ? `: ${detail}` : ''}`) as Error & { status?: number };
      e.status = res.status;
      throw e;
    }

    const data: unknown = await res.json();
    const models = extractModelIds(data);
    if (models.length === 0) {
      return jsonError('NO_MODELS', 'ai.err.model', `${safeBase}models`);
    }
    return NextResponse.json({ ok: true, models });
  } catch (err) {
    const e = err as Error & { status?: number };
    const msg = e?.message ?? 'Model list fetch failed';
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
      return jsonError(msg, 'ai.err.timeout');
    }
    if (e?.status === 401 || e?.status === 403) {
      return jsonError(msg, 'ai.err.auth');
    }
    if (e?.status === 404) {
      // এই হোস্টে /models নেই — ম্যানুয়াল ইনপুটেই মডেল দিতে হবে
      return jsonError(msg, 'ai.err.model', `${safeBase}models`);
    }
    if (e?.status === 429) {
      return jsonError(msg, 'ai.err.rate');
    }
    return jsonError(msg, 'ai.err.network');
  }
}
