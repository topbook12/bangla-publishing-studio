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
import {
  allowRate, assertSafeBase, bestModelMatch, clientIp, extractModelIds,
  extractSuggestedModel, isGeminiHost, isModelRetiredMessage, normalizeBase,
  originIsLocalHost, sanitizeModelId,
} from '@/lib/ai-proxy-guard';

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
// 8192 — thinking মডেল (gemini-2.5-flash ইত্যাদি) চিন্তা-টোকেনও এর মধ্যে খায়;
// 4096 রাখলে উত্তর খালি আসত (finish_reason=length) — "খালি উত্তর" বাগ
const MAX_TOKENS = 8192;

// ─── সাইজ ক্যাপ ───
const MAX_BODY_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_PROMPT_CHARS = 24_000;
const MAX_SYSTEM_CHARS = 8_000;
const MAX_IMAGE_CHARS = 6_800_000; // ≈5MB বাইনারি (base64 বাড়তি ৩৪%)

// ─── রেট-লিমিট (মেমোরি, ইনস্ট্যান্স-স্কোপ) ───
const RATE_BYOK = 30; // প্রতি মিনিটে
const RATE_DEMO = 6;

function jsonError(error: string, hintKey?: string, status = 200, detail?: string) {
  return NextResponse.json({ ok: false, error, hintKey, detail }, { status });
}

// ─── OpenAI-সামঞ্জস্য কল ───

/** OpenAI-সামঞ্জস্য কনটেন্ট অংশ (টেক্সট/ছবি) */
type ContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

/** প্রোভাইডারের ত্রুটি-বার্তা (raw) বের করা — রোগ-নির্ণয়ের মূল পথ */
async function providerErrorDetail(res: Response): Promise<string> {
  try {
    let errJson = (await res.json()) as unknown;
    // Google-ধাঁচের কিছু এন্ডপয়েন্ট অ্যারে-মোড়ানো ত্রুটি দেয়: [{"error":{...}}]
    if (Array.isArray(errJson)) errJson = errJson[0];
    const obj = (errJson ?? {}) as Record<string, unknown>;
    const err = obj?.error as Record<string, unknown> | string | undefined;
    if (typeof err === 'string') return err;
    return (err?.message as string) ?? (obj?.message as string) ?? '';
  } catch {
    return (await res.text().catch(() => '')).slice(0, 300);
  }
}

async function throwUpstream(res: Response): Promise<never> {
  const detail = (await providerErrorDetail(res)).slice(0, 800);
  const e = new Error(`${res.status}${detail ? `: ${detail}` : ''}`) as Error & {
    status?: number;
    /** প্রোভাইডারের raw বার্তা — self-heal এর পরামর্শ-পার্সারের উৎস */
    providerDetail?: string;
  };
  e.status = res.status;
  e.providerDetail = detail;
  throw e;
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

  if (!res.ok) await throwUpstream(res);

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

// ─── Gemini native ফলব্যাক (OpenAI-সামঞ্জস্য স্তর 404 দিলে) ───

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

/** OpenAI-ধাঁচের বডি → Gemini native generateContent বডি */
function geminiPayload(body: ChatBody): Record<string, unknown> {
  const parts: GeminiPart[] = [{ text: body.prompt ?? '' }];
  if (body.imageDataUrl) {
    const m = body.imageDataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (m) parts.push({ inline_data: { mime_type: m[1].toLowerCase(), data: m[2] } });
  }
  const payload: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.4, maxOutputTokens: MAX_TOKENS },
  };
  if (body.system) payload.systemInstruction = { parts: [{ text: body.system }] };
  return payload;
}

/** Gemini native এন্ডপয়েন্ট — সর্বাপেক্ষ নির্ভরযোগ্য পথ (compat স্তর বাদ) */
async function callGeminiNative(apiKey: string, model: string, body: ChatBody): Promise<{ text: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(geminiPayload(body)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) await throwUpstream(res);

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> }; finishReason?: string }>;
    promptFeedback?: { blockReason?: string };
  };
  const cand = data.candidates?.[0];
  const text = (cand?.content?.parts ?? []).map((p) => p?.text ?? '').join('');
  if (!text.trim()) {
    const why = data.promptFeedback?.blockReason ?? cand?.finishReason;
    throw new Error(why && why !== 'STOP' ? `EMPTY_RESPONSE:${why}` : 'EMPTY_RESPONSE');
  }
  return { text };
}

/** প্রোভাইডার থেকে উপলব্ধ মডেল-তালিকা (Gemini-তে compat ব্যর্থ হলে native) */
async function fetchUpstreamModelIds(base: string, apiKey: string, provider?: string): Promise<string[]> {
  const headers: Record<string, string> = { Authorization: `Bearer ${apiKey}` };
  if (provider === 'claude') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }
  const res = await fetch(`${base}models`, {
    method: 'GET',
    headers,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    if (isGeminiHost(base)) {
      // native তালিকা — x-goog-api-key দিয়ে
      const nres = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        method: 'GET',
        headers: { 'x-goog-api-key': apiKey },
        signal: AbortSignal.timeout(30_000),
      });
      if (!nres.ok) await throwUpstream(res); // আসল (compat) ত্রুটিটাই বেশি অর্থবহ
      return extractModelIds(await nres.json());
    }
    await throwUpstream(res);
  }
  return extractModelIds(await res.json());
}

/**
 * স্বয়ং-নিরাময়ী (self-healing) AI কল — 404 মানে মডেল/URL চেনা যায়নি,
 * কিন্তু কারণ ও সমাধান দুটোই প্রায়ই আমাদের হাতেই আছে:
 *  ধাপ ১ — প্রোভাইডারের ত্রুটি-বার্তাতেই প্রতিস্থাপন-মডেলের নাম লেখা থাকলে
 *          ("…use models/gemini-3.8-flash…") সেটাতেই সরাসরি পুনরায় — সবচেয়ে নির্ভরযোগ্য
 *  ধাপ ২ — Gemini হলে native :generateContent এন্ডপয়েন্টে চেষ্টা (compat স্তরের সমস্যা এড়ায়)
 *  ধাপ ৩ — প্রোভাইডারের মডেল-তালিকা এনে নিকটতম সঠিক মডেল দিয়ে একবার পুনরায় চেষ্টা
 *          (অবসর-ঘোষিত মডেল তালিকায় থাকলেও বাদ — সেটাতে ফিরে গেলে আবারই 404)
 *  সব ব্যর্থ হলে আসল 404 — প্রোভাইডারের raw বার্তাসহ (নিচে throw হয়)
 */
async function callWithSelfHeal(
  config: AiProxyConfig,
  body: ChatBody,
): Promise<{ text: string; fixedModel?: string }> {
  const gemini = isGeminiHost(config.baseUrl);
  const tryCompat = (model: string) => callOpenAiCompatible({ ...config, model }, body);
  const tryNative = (model: string) => callGeminiNative(config.apiKey, model, body);

  try {
    return await tryCompat(config.model);
  } catch (err) {
    const e = err as Error & { status?: number; providerDetail?: string };
    if (e.status !== 404) throw err;

    const detail = e.providerDetail ?? e.message ?? '';
    const retired = isModelRetiredMessage(detail);
    const suggested = extractSuggestedModel(detail, config.model);

    // ধাপ ১: প্রোভাইডারের নিজের সুপারিশ করা মডেল
    if (suggested) {
      try {
        return { ...(await tryCompat(suggested)), fixedModel: suggested };
      } catch { /* নিচের ধাপে */ }
      if (gemini) {
        try {
          return { ...(await tryNative(suggested)), fixedModel: suggested };
        } catch { /* নিচের ধাপে */ }
      }
    }

    // ধাপ ২: Gemini native ফলব্যাক — চাওয়া মডেলেই
    if (gemini) {
      try {
        return await tryNative(config.model);
      } catch (err2) {
        const e2 = err2 as Error & { status?: number };
        // native-ও 404 → মডেলই নেই, ধাপ ৩-এ যাই; অন্য ত্রুটি হলে সেটাই আসল কারণ
        if (e2.status !== 404) throw err2;
      }
    }

    // ধাপ ৩: মডেল-তালিকা থেকে নিকটতম মিল দিয়ে একবার পুনরায়
    try {
      const ids = await fetchUpstreamModelIds(normalizeBase(config.baseUrl), config.apiKey, config.provider);
      // অবসর-ঘোষিত মডেল তালিকায় "এখনও থাকে" — সেটাতেই মিললে আবার 404-ই হবে, তাই বাদ
      const usable = retired ? ids.filter((m) => m.toLowerCase() !== config.model.toLowerCase()) : ids;
      const fixed = bestModelMatch(config.model, usable);
      if (fixed && fixed.toLowerCase() !== config.model.toLowerCase()) {
        return { ...(await tryCompat(fixed)), fixedModel: fixed };
      }
    } catch {
      /* তালিকা/পুনরায় ব্যর্থ — নিচে আসল 404-ই ফেরত যাবে */
    }
    throw err;
  }
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
  const originIsLocal = originIsLocalHost(req.headers.get('host'));

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
    // মডেল-আইডি পরিচ্ছন্ন — অদৃশ্য অক্ষর/ফাঁকা থাকলেই প্রোভাইডার 404 দেয়
    const cfg: AiProxyConfig = {
      baseUrl: safeBase,
      apiKey: c!.apiKey.trim(),
      model: sanitizeModelId(c!.model),
      provider: c!.provider,
    };
    if (!cfg.model) return jsonError('MODEL_EMPTY', 'ai.err.config');

    try {
      const { text, fixedModel } = await callWithSelfHeal(cfg, body);
      return NextResponse.json({ ok: true, text, ...(fixedModel ? { fixedModel } : {}) });
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
      if (msg.startsWith('EMPTY_RESPONSE:')) {
        // নিরাপত্তা-নীতি/অন্য কারণে আটকে খালি উত্তর — কারণটি raw-তেই দেখা যাবে
        const why = msg.slice('EMPTY_RESPONSE:'.length);
        return jsonError(msg, why === 'LENGTH' ? 'ai.err.empty' : 'ai.err.blocked');
      }
      if (msg === 'TIMEOUT_ERROR' || e?.name === 'TimeoutError' || e?.name === 'AbortError') {
        return jsonError(msg, 'ai.err.timeout');
      }
      if (status === 401 || status === 403 || status === 402) {
        return jsonError(msg, 'ai.err.auth');
      }
      if (status === 400) {
        // Gemini অবৈধ কিকেও 400 দেয় ("Please pass a valid API key") — raw বার্তা দেখুন
        return jsonError(msg, 'ai.err.badRequest');
      }
      if (status === 404) {
        // কোন ঠিকানায় গিয়েছিলাম + প্রোভাইডার ঠিক কী বলেছিল — ইউজার নিজেই মিলিয়ে নিতে পারে
        const triedUrl = `${safeBase}chat/completions (মডেল: ${cfg.model})`;
        return jsonError(msg, 'ai.err.model', 200, triedUrl);
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
