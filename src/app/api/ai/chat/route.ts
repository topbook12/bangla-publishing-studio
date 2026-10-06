/**
 * AI প্রক্সি — POST /api/ai/chat
 * ─────────────────────────────
 * BYOK (Bring Your Own Key): ব্যবহারকারীর নিজের API Key দিয়ে নির্বাচিত
 * OpenAI-সামঞ্জস্য প্রোভাইডারে কল পাস-থ্রু করে। কি শুধু এই রিকোয়েস্টে
 * ব্যবহৃত হয় — লগ/স্টোর কিছুই হয় না, কোম্পানির কোনো AI খরচ হয় না।
 *
 * কি দেওয়া না থাকলে সীমিত ডেমো মোড: প্ল্যাটফর্মের বিল্ট-ইন SDK
 * (z-ai-web-dev-sdk) — প্রোডাকশনে ক্রেডেনশিয়াল না থাকলে স্পষ্ট বার্তায়
 * BYOK-র দিকে নির্দেশ করে।
 *
 * নিরাপত্তা (হার্ডেন্ড):
 *  - SSRF গার্ড: টার্গেট https-বাধ্য (লোকাল ডেভ-সার্ভারে লোকাল http ছাড়),
 *    প্রাইভেট/রিজার্ভড IP, localhost, *.internal/*.local, ক্লাউড-মেটাডেটা ব্লকড
 *  - সাইজ ক্যাপ: বডি ≤ 8MB, প্রম্পট ≤ 24k ক্যারেক্টার, সিস্টেম ≤ 8k, ছবি ≤ 5MB
 *  - রেট-লিমিট: BYOK ৩০/মিনিট, ডেমো ৬/মিনিট প্রতি IP (প্ল্যাটফর্ম ক্রেডেনশিয়াল সুরক্ষা)
 *  - কি কখনো লগ/স্টোর হয় না; ত্রুটি-বার্তায়ও কি ফাঁস হয় না
 *
 * বডি: { prompt, system?, imageDataUrl?, config?: { baseUrl, apiKey, model, provider? } }
 * উত্তর: { ok: true, text } | { ok: false, error, hintKey? }
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 180;

interface AiProxyConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
  provider?: string;
}

interface ChatBody {
  prompt?: string;
  system?: string;
  imageDataUrl?: string | null;
  config?: AiProxyConfig | null;
}

const TIMEOUT_MS = 180_000;
const MAX_TOKENS = 4096;

// ─── সাইজ ক্যাপ ───
const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_PROMPT_CHARS = 24_000;
const MAX_SYSTEM_CHARS = 8_000;
const MAX_IMAGE_CHARS = 6_800_000; // ≈5MB বাইনারি (base64 বাড়তি ৩৪%)

// ─── রেট-লিমিট (মেমোরি, ইনস্ট্যান্স-স্কোপ) ───
const RATE_BYOK = 30; // প্রতি মিনিটে
const RATE_DEMO = 6;
const RATE_WINDOW_MS = 60_000;

const rateBuckets = new Map<string, { count: number; reset: number }>();

function allowRate(key: string, limit: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.reset) {
    // পুরনো এন্ট্রি মাঝেমধ্যে ঝাড়া — মেমোরি ফাঁদ এড়াতে
    if (rateBuckets.size > 10_000) {
      for (const [k, v] of rateBuckets) if (v.reset < now) rateBuckets.delete(k);
    }
    rateBuckets.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim() || 'anon';
  return req.headers.get('x-real-ip')?.trim() || 'anon';
}

function jsonError(error: string, hintKey?: string, status = 200) {
  return NextResponse.json({ ok: false, error, hintKey }, { status });
}

// ─── SSRF গার্ড ───

function normalizeBase(baseUrl: string): string {
  let s = baseUrl.trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  // /chat/completions দিয়ে শেষ হলে সরিয়ে দিই — আমরাই যোগ করব
  s = s.replace(/\/chat\/completions\/?$/i, '');
  if (!s.endsWith('/')) s += '/';
  return s;
}

/** ব্লক করা হোস্টনেম (SSRF) */
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return true;
  // IPv6 লিটারাল — নামে কখনো ':' থাকে না
  if (h.includes(':')) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === 'metadata.google.internal' || h.endsWith('.cloud.internal')) return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const oct = ipv4.slice(1).map(Number);
    if (oct.some((n) => n > 255)) return true;
    const [a, b] = oct;
    if (a === 0 || a === 10 || a === 127) return true; // loopback/প্রাইভেট
    if (a === 169 && b === 254) return true; // link-local (169.254.169.254 = ক্লাউড মেটাডেটা)
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  return false;
}

/**
 * টার্গেট বেস-URL নিরাপদ কি না।
 * প্রোডাকশনে https-বাধ্য + পাবলিক হোস্ট; লোকাল ডেভ-সার্ভারে (নিজের মেশিনে
 * অ্যাপ চালানো) নিজের লোকাল সার্ভার (Ollama/LM Studio) টেস্ট করতে http অনুমোদিত।
 */
function assertSafeBase(rawBase: string, originIsLocal: boolean): string | null {
  const base = normalizeBase(rawBase);
  if (!base) return null;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  const host = url.hostname;
  const isLocalTarget = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  if (url.protocol === 'https:') {
    if (isPrivateHost(host)) return null;
    return base;
  }
  if (url.protocol === 'http:') {
    // http শুধু তখনই, যখন সার্ভার নিজেই ইউজারের মেশিনে আর টার্গেটও লোকাল
    if (originIsLocal && isLocalTarget) return base;
    return null;
  }
  return null;
}

// ─── OpenAI-সামঞ্জস্য কল ───

/** OpenAI-সামঞ্জস্য কনটেন্ট অংশ (টেক্সট/ছবি) */
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

async function callOpenAiCompatible(config: AiProxyConfig, body: ChatBody): Promise<{ text: string }> {
  const base = normalizeBase(config.baseUrl);
  if (!base) throw new Error('BASE_URL_EMPTY');
  if (!config.model?.trim()) throw new Error('MODEL_EMPTY');

  const url = `${base}chat/completions`;
  const userContent: string | ContentPart[] = body.imageDataUrl
    ? [
        { type: 'text', text: body.prompt ?? '' },
        { type: 'image_url', image_url: { url: body.imageDataUrl } },
      ]
    : (body.prompt ?? '');

  const messages: Array<Record<string, unknown>> = [];
  if (body.system) messages.push({ role: 'system', content: body.system });
  messages.push({ role: 'user', content: userContent });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
  };
  // Claude-এর OpenAI-সামঞ্জস্য স্তরও x-api-key গ্রহণ করে — দুটোই পাঠাই নিরাপদ
  if (config.provider === 'claude') {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }
  // OpenRouter অ্যাট্রিবিউশন (ঐচ্ছিক, ত্রুটি এড়াতে)
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://bangla-publishing-studio.app';
    headers['X-Title'] = 'Bangla Publishing Studio';
  }

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: config.model.trim(), messages, temperature: 0.4, max_tokens: MAX_TOKENS, stream: false }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const errJson = await res.json();
      detail = errJson?.error?.message ?? errJson?.message ?? '';
    } catch {
      detail = await res.text().catch(() => '');
    }
    detail = detail.slice(0, 400);
    const e = new Error(`${res.status}${detail ? `: ${detail}` : ''}`) as Error & { status?: number };
    e.status = res.status;
    throw e;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  let text = '';
  if (typeof content === 'string') text = content;
  else if (Array.isArray(content)) {
    text = content
      .map((p) => (typeof p === 'string' ? p : (p as { text?: string })?.text ?? ''))
      .join('');
  }
  if (!text.trim()) throw new Error('EMPTY_RESPONSE');
  return { text };
}

/** সীমিত ডেমো মোড — প্ল্যাটফর্মের বিল্ট-ইন SDK */
async function callDemo(body: ChatBody): Promise<{ text: string }> {
  const { default: ZAI } = await import('z-ai-web-dev-sdk');
  const zai = await ZAI.create();

  if (body.imageDataUrl) {
    const res = await zai.chat.completions.createVision({
      model: 'glm-4.5v',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: `${body.system ? `${body.system}\n\n` : ''}${body.prompt ?? ''}` },
            { type: 'image_url', image_url: { url: body.imageDataUrl } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    });
    const text = res.choices[0]?.message?.content ?? '';
    if (!text.trim()) throw new Error('EMPTY_RESPONSE');
    return { text };
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
  if (body.system) messages.push({ role: 'system', content: body.system });
  messages.push({ role: 'user', content: body.prompt ?? '' });

  const res = await zai.chat.completions.create({ messages, thinking: { type: 'disabled' } });
  const text = res.choices[0]?.message?.content ?? '';
  if (!text.trim()) throw new Error('EMPTY_RESPONSE');
  return { text };
}

export async function POST(req: NextRequest) {
  const originHost = (req.headers.get('host') ?? '').toLowerCase().split(':')[0];
  const originIsLocal = originHost === 'localhost' || originHost === '127.0.0.1' || originHost === '0.0.0.0' || originHost === '::1';

  // বডি সাইজ গার্ড — পার্স করার আগেই বড় পেলোড ফেলা
  const contentLength = Number(req.headers.get('content-length') ?? '0');
  if (contentLength > MAX_BODY_BYTES) {
    return jsonError('Payload too large', 'ai.err.size');
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return jsonError('Invalid request body');
  }
  if (raw.length > MAX_BODY_BYTES) {
    return jsonError('Payload too large', 'ai.err.size');
  }

  let body: ChatBody;
  try {
    body = JSON.parse(raw) as ChatBody;
  } catch {
    return jsonError('Invalid request body');
  }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt) return jsonError('Empty prompt');
  if (prompt.length > MAX_PROMPT_CHARS) return jsonError('Prompt too long', 'ai.err.size');
  if (body.system && body.system.length > MAX_SYSTEM_CHARS) return jsonError('System prompt too long', 'ai.err.size');
  if (body.imageDataUrl) {
    if (!/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(body.imageDataUrl)) {
      return jsonError('Unsupported image format');
    }
    if (body.imageDataUrl.length > MAX_IMAGE_CHARS) return jsonError('Image too large', 'ai.err.size');
  }

  const c = body.config;
  const hasKey = !!(c?.apiKey?.trim() && c?.baseUrl?.trim() && c?.model?.trim());

  // রেট-লিমিট — ডেমো (আমাদের ক্রেডেনশিয়াল) কড়া, BYOK (ইউজারের নিজের) শিথিল
  const ip = clientIp(req);
  if (!allowRate(`${ip}:${hasKey ? 'byok' : 'demo'}`, hasKey ? RATE_BYOK : RATE_DEMO)) {
    return jsonError('Rate limit reached', hasKey ? 'ai.err.rateLimit' : 'ai.err.demoRate');
  }

  if (hasKey) {
    // SSRF গার্ড — টার্গেট যাচাই
    const safeBase = assertSafeBase(c!.baseUrl, originIsLocal);
    if (!safeBase) {
      return jsonError('Base URL not allowed', 'ai.err.badUrl');
    }
    try {
      const { text } = await callOpenAiCompatible({ ...c!, baseUrl: safeBase }, body);
      return NextResponse.json({ ok: true, text });
    } catch (err) {
      const e = err as Error & { status?: number; cause?: { code?: string } };
      const msg = e?.message ?? 'AI request failed';
      const status = e?.status;

      if (msg === 'BASE_URL_EMPTY' || msg === 'MODEL_EMPTY') {
        return jsonError(msg, 'ai.err.config');
      }
      if (msg === 'EMPTY_RESPONSE') {
        return jsonError(msg, 'ai.err.empty');
      }
      if (msg === 'TIMEOUT_ERROR' || e?.name === 'TimeoutError' || e?.name === 'AbortError') {
        return jsonError(msg, 'ai.err.timeout');
      }
      if (status === 401 || status === 403) {
        return jsonError(msg, 'ai.err.auth');
      }
      if (status === 404) {
        return jsonError(msg, 'ai.err.model');
      }
      if (status === 429) {
        return jsonError(msg, 'ai.err.rate');
      }
      if (status && status >= 500) {
        return jsonError(msg, 'ai.err.server');
      }
      // নেটওয়ার্ক/DNS ইত্যাদি
      return jsonError(msg, 'ai.err.network');
    }
  }

  // কি নেই → সীমিত ডেমো
  try {
    const { text } = await callDemo(body);
    return NextResponse.json({ ok: true, text, demo: true });
  } catch (err) {
    const e = err as Error & { status?: number };
    const msg = e?.message ?? 'AI request failed';
    if (msg === 'EMPTY_RESPONSE') {
      return jsonError(msg, 'ai.err.empty');
    }
    if (e?.name === 'TimeoutError' || e?.name === 'AbortError') {
      return jsonError(msg, 'ai.err.timeout');
    }
    // ডেমো SDK ক্রেডেনশিয়াল না থাকলে স্পষ্ট বার্তা — BYOK-র দিকে
    return jsonError('DEMO_UNAVAILABLE', 'ai.err.demoUnavailable');
  }
}
