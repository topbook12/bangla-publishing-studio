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
  allowRate, assertSafeBase, clientIp, originIsLocalHost,
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

/** OpenAI-সামঞ্জস্য /models উত্তর থেকে মডেল-আইডি বের করা */
function extractModelIds(data: unknown): string[] {
  // OpenAI/compat: { data: [{ id }] } · Gemini-compat আইডি "models/xxx" আকারে আসতে পারে
  const ids: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) ids.push(v.trim());
  };
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') push(item);
      else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        push(typeof obj.id === 'string' ? obj.id : (obj.name as string | undefined));
      }
    }
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.models)) return extractModelIds(obj.models); // Gemini native shape
    if (Array.isArray(obj.data)) return extractModelIds(obj.data);
  }
  // "models/gemini-2.5-flash" → "gemini-2.5-flash" (compat-এ প্রিফিক্স দরকার হয় না)
  return Array.from(new Set(ids.map((id) => id.replace(/^models\//i, ''))))
    .filter((id) => id.length > 0 && id.length <= 120)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, MAX_MODELS);
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
      let detail = '';
      try {
        const errJson = (await res.json()) as Record<string, unknown>;
        const err = errJson?.error as Record<string, unknown> | string | undefined;
        detail = typeof err === 'string' ? err : ((err?.message as string) ?? (errJson?.message as string) ?? '');
      } catch {
        detail = await res.text().catch(() => '');
      }
      detail = detail.slice(0, 300);
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
