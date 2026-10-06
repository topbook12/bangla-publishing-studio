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
 * বডি: { prompt, system?, imageDataUrl?, config?: { baseUrl, apiKey, model, provider? } }
 * উত্তর: { ok: true, text } | { ok: false, error, hintKey? }
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

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

function jsonError(error: string, hintKey?: string, status = 200) {
  return NextResponse.json({ ok: false, error, hintKey }, { status });
}

/** OpenAI-সামঞ্জস্য কনটেন্ট অংশ (টেক্সট/ছবি) */
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

function normalizeBase(baseUrl: string): string {
  let s = baseUrl.trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  // /chat/completions দিয়ে শেষ হলে সরিয়ে দিই — আমরাই যোগ করব
  s = s.replace(/\/chat\/completions\/?$/i, '');
  if (!s.endsWith('/')) s += '/';
  return s;
}

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
  let body: ChatBody;
  try {
    body = (await req.json()) as ChatBody;
  } catch {
    return jsonError('Invalid request body');
  }

  const prompt = (body.prompt ?? '').trim();
  if (!prompt) return jsonError('Empty prompt');
  if (body.imageDataUrl && !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(body.imageDataUrl)) {
    return jsonError('Unsupported image format');
  }

  const c = body.config;
  const hasKey = !!(c?.apiKey?.trim() && c?.baseUrl?.trim() && c?.model?.trim());

  try {
    if (hasKey) {
      const { text } = await callOpenAiCompatible(c as AiProxyConfig, body);
      return NextResponse.json({ ok: true, text });
    }
    // কি নেই → সীমিত ডেমো
    const { text } = await callDemo(body);
    return NextResponse.json({ ok: true, text, demo: true });
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
