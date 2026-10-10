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
 * বডি: { prompt, system?, imageDataUrl?, stream?, config?: { baseUrl, apiKey, model, provider? } }
 * উত্তর: { ok: true, text, fixedModel?, busyFallback? } | { ok: false, error, hintKey?, detail? }
 * স্ট্রিম উত্তর (stream:true): text/event-stream — প্রতি ঘটনা `data: {"delta":"…"}`,
 * শেষে `data: {"done":true, ok, fixedModel?, busyFallback?, demo?, error?, hintKey?}`।
 * স্ট্রিমিং ব্যর্থ হলে স্বয়ংক্রিয়ভাবে non-streaming কলে পড়ে — ফলাফল একই, শুধু প্রথম
 * টোকেন-পর্যন্ত অপেক্ষা (প্রম্পট-প্রসেসিং + পুরো উত্তর) ইউজারকে অনুভব করতে হয় না।
 *
 * গতি (thinking-budget): Gemini 2.5/3-ফ্যামিলির ফ্ল্যাশ মডেল ডিফল্টে "চিন্তা" করে —
 * ৫–২০ সে খরচ, বই-সম্পাদনার ট্রান্সফর্মে অপ্রয়োজনীয়। thinkingBudget:0 দিলে
 * উত্তর প্রায় ৩–১০× দ্রুত আসে (pro মডেলে প্রযোজ্য নয়, সেখানে স্কিপ)।
 *
 * ব্যস্ত-প্রতিরোধ (busy-resilience): 503 "high demand" জাতীয় অস্থায়ী ত্রুটিতে
 * Retry-After সম্মান করে ব্যাকঅফে ৩ বার পুনরায়; তবু থাকলে একই পরিবারের হালকা
 * মডেলে (flash → flash-lite) শেষ চেষ্টা — busyFallback জানিয়ে উত্তর ফেরত।
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  allowRate, assertSafeBase, backoffDelayMs, bestModelMatch, clientIp,
  extractModelIds, extractSuggestedModel, isGeminiHost, isInvalidKeyMessage,
  isModelRetiredMessage, isTransientStatus, liteAlternativeModels, normalizeBase,
  originIsLocalHost, parseRetryAfterMs, sanitizeModelId,
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
  /** SSE স্ট্রিমিং চাইলে true — উত্তর text/event-stream হয় */
  stream?: boolean;
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
    /** Retry-After হেডার (থাকলে) — ব্যস্ত-রিট্রাইয়ের বিলম্ব-নির্ধারণ */
    retryAfterMs?: number;
  };
  e.status = res.status;
  e.providerDetail = detail;
  e.retryAfterMs = parseRetryAfterMs(res.headers.get('retry-after'));
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
    // SSRF গার্ড শুধু প্রাথমিক ঠিকানা যাচাই করে — রিডাইরেক্ট ফলো করলে প্রাইভেট/
    // মেটাডেটা-ঠিকানায় চুপিচুপি যাওয়া যেত; তাই রিডাইরেক্ট কঠোরভাবে নিষিদ্ধ
    redirect: 'error',
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
function geminiPayload(body: ChatBody, model?: string): Record<string, unknown> {
  const parts: GeminiPart[] = [{ text: body.prompt ?? '' }];
  if (body.imageDataUrl) {
    const m = body.imageDataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i);
    if (m) parts.push({ inline_data: { mime_type: m[1].toLowerCase(), data: m[2] } });
  }
  const payload: Record<string, unknown> = {
    contents: [{ role: 'user', parts }],
    generationConfig: { temperature: 0.4, maxOutputTokens: MAX_TOKENS },
  };
  // গতি — চিন্তা-বাজেট ০: ফ্ল্যাশ-পরিবারের মডেল ডিফল্টে অন্তর্নিহিত চিন্তা করে;
  // বই-সম্পাদনার নির্ধারিত ট্রান্সফর্মে সেটা সময়-নষ্ট। pro মডেলে ০ অনুমোদিত নয়।
  if (model && geminiFastThinkingModel(model)) {
    (payload.generationConfig as Record<string, unknown>).thinkingConfig = { thinkingBudget: 0 };
  }
  if (body.system) payload.systemInstruction = { parts: [{ text: body.system }] };
  return payload;
}

/** Gemini ফ্ল্যাশ-পরিবারের চিন্তা-সক্ষম মডেল — thinkingBudget:0 বহন করতে পারে (pro বাদ) */
function geminiFastThinkingModel(model: string): boolean {
  const m = model.toLowerCase();
  return /gemini-(2\.5|3)/.test(m) && /flash/.test(m) && !/pro/.test(m);
}

/** thinkingConfig-জনিত 400 — মডেল বাজেট-০ না মানলে কনফিগ ছাড়া একবার পুনরায় */
function isThinkingConfigError(msg: string): boolean {
  return /thinking/i.test(msg);
}

/** Gemini native এন্ডপয়েন্ট — সর্বাপেক্ষ নির্ভরযোগ্য পথ (compat স্তর বাদ) */
async function callGeminiNative(apiKey: string, model: string, body: ChatBody): Promise<{ text: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(geminiPayload(body, model)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'error', // SSRF — রিডাইরেক্টে গার্ড-বাইপাস বন্ধ
  });
  // thinkingConfig অসমর্থিত মডেল হলে 400 — বাজেট-লাইন ছাড়া একবার পুনরায় (সঠিকতা > গতি)
  if (res.status === 400 && geminiFastThinkingModel(model)) {
    const detail = await providerErrorDetail(res);
    if (isThinkingConfigError(detail)) {
      const fallback = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(geminiPayload(body)),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'error',
      });
      if (!fallback.ok) await throwUpstream(fallback);
      return { text: await geminiTextFromResponse(fallback) };
    }
  }
  if (!res.ok) await throwUpstream(res);

  return { text: await geminiTextFromResponse(res) };
}

/** Gemini উত্তর-JSON থেকে লেখা বের করা (native ও streaming native দুই পথেই ব্যবহৃত) */
async function geminiTextFromResponse(res: Response): Promise<string> {
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
  return text;
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
    redirect: 'error', // SSRF — রিডাইরেক্টে গার্ড-বাইপাস বন্ধ
  });
  if (!res.ok) {
    if (isGeminiHost(base)) {
      // native তালিকা — x-goog-api-key দিয়ে (হার্ডকোডেড https Google, রিডাইরেক্ট নেই)
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

/**
 * ব্যস্ত-প্রতিরোধী (busy-resilient) কল — 503 "high demand" / 429 / 5xx জাতীয়
 * অস্থায়ী ত্রুটিতে ব্যাকঅফ দিয়ে ৩ বার পুনরায় (Retry-After সম্মান করে);
 * তবু 503/529 থাকলে একই পরিবারের হালকা বিকল্প মডেলে শেষ চেষ্টা —
 * সফল হলে busyFallback হিসেবে জানানো হয় (ইউজারের পছন্দ ওভাররাইট হয় না)।
 */
async function callWithBusyRetry(
  config: AiProxyConfig,
  body: ChatBody,
): Promise<{ text: string; fixedModel?: string; busyFallback?: string }> {
  let lastErr: (Error & { status?: number; retryAfterMs?: number }) | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await callWithSelfHeal(config, body);
    } catch (err) {
      lastErr = err as Error & { status?: number; retryAfterMs?: number };
      if (!isTransientStatus(lastErr?.status)) throw err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, backoffDelayMs(attempt, lastErr?.retryAfterMs)));
      }
    }
  }

  // সব পুনরায় ব্যর্থ — overload (503/529) হলে হালকা বিকল্পে শেষ চেষ্টা
  const status = lastErr?.status;
  if (status === 503 || status === 529) {
    for (const model of liteAlternativeModels(config.model)) {
      try {
        const r = await callOpenAiCompatible({ ...config, model }, body);
        return { ...r, busyFallback: model };
      } catch {
        if (isGeminiHost(config.baseUrl)) {
          try {
            const r = await callGeminiNative(config.apiKey, model, body);
            return { ...r, busyFallback: model };
          } catch { /* পরের প্রার্থী */ }
        }
      }
    }
  }
  throw lastErr ?? new Error('AI request failed');
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

// ─── স্ট্রিমিং (SSE) ───

/** উৎস-SSE লাইন থেকে delta-লেখা বের করা — OpenAI (choices[0].delta.content) ও
 *  Gemini (candidates[0].content.parts[].text) দুই শৈলীই ধরে */
function deltaFromSsePayload(payload: string): string {
  try {
    const obj = JSON.parse(payload) as {
      choices?: Array<{ delta?: { content?: unknown }; message?: { content?: unknown } }>;
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const c0 = obj.choices?.[0];
    const d = c0?.delta?.content ?? c0?.message?.content ?? '';
    if (typeof d === 'string') return d;
    if (Array.isArray(d)) return d.map((p) => (typeof p === 'string' ? p : (p as { text?: string })?.text ?? '')).join('');
    const g = obj.candidates?.[0]?.content?.parts ?? [];
    return g.map((p) => p?.text ?? '').join('');
  } catch {
    return '';
  }
}

/** OpenAI-সামঞ্জস্য স্ট্রিম কল — upstream SSE পড়ে delta-লেখা onDelta-তে দেয় */
async function streamOpenAiCompatible(config: AiProxyConfig, body: ChatBody, onDelta: (t: string) => void): Promise<string> {
  const base = normalizeBase(config.baseUrl);
  if (!base) throw new Error('BASE_URL_EMPTY');
  if (!config.model?.trim()) throw new Error('MODEL_EMPTY');

  const messages: Array<Record<string, unknown>> = [];
  if (body.system) messages.push({ role: 'system', content: body.system });
  messages.push({ role: 'user', content: body.prompt ?? '' });

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${config.apiKey}`,
    Accept: 'text/event-stream',
  };
  if (config.provider === 'claude') {
    headers['x-api-key'] = config.apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }
  if (config.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://bangla-publishing-studio.app';
    headers['X-Title'] = 'Bangla Publishing Studio';
  }

  const res = await fetch(`${base}chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: config.model.trim(), messages, temperature: 0.4, max_tokens: MAX_TOKENS, stream: true }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'error',
  });
  if (!res.ok) await throwUpstream(res);
  if (!res.body) throw new Error('EMPTY_RESPONSE');

  const text = await pumpSse(res.body, onDelta);
  if (!text.trim()) throw new Error('EMPTY_RESPONSE');
  return text;
}

/** Gemini native স্ট্রিম কল — :streamGenerateContent?alt=sse */
async function streamGeminiNative(apiKey: string, model: string, body: ChatBody, onDelta: (t: string) => void): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(geminiPayload(body, model)),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: 'error',
  });
  // thinkingConfig-অসমর্থিত হলে বাজেট-লাইন ছাড়া পুনরায়
  if (res.status === 400 && geminiFastThinkingModel(model)) {
    const detail = await providerErrorDetail(res);
    if (isThinkingConfigError(detail)) {
      const fb = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(geminiPayload(body)),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'error',
      });
      if (!fb.ok) await throwUpstream(fb);
      if (!fb.body) throw new Error('EMPTY_RESPONSE');
      const text = await pumpSse(fb.body, onDelta);
      if (!text.trim()) throw new Error('EMPTY_RESPONSE');
      return text;
    }
  }
  if (!res.ok) await throwUpstream(res);
  if (!res.body) throw new Error('EMPTY_RESPONSE');

  const text = await pumpSse(res.body, onDelta);
  if (!text.trim()) throw new Error('EMPTY_RESPONSE');
  return text;
}

/** উৎস-বডি পড়ে SSE ঘটনা ভেঙে delta-জমা দেওয়া; পূর্ণ লেখা ফেরত */
async function pumpSse(src: ReadableStream<Uint8Array>, onDelta: (t: string) => void): Promise<string> {
  const reader = src.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let full = '';
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      // SSE ঘটনা খালি লাইনে শেষ হয় — "data: …" লাইনগুলো এক ঘটনা
      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        const delta = deltaFromSsePayload(payload);
        if (delta) {
          full += delta;
          onDelta(delta);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  return full;
}

/**
 * স্ট্রিমিং-সচেতন ব্যস্ত-প্রতিরোধী কল — non-streaming callWithBusyRetry-র স্ট্রিম-সংস্করণ।
 * ৪০৪-এ self-heal (সুপারিশ-মডেল → native → তালিকা-মিল), অস্থায়ী ত্রুটিতে ব্যাকঅফ-পুনরায়।
 */
async function streamWithSelfHeal(config: AiProxyConfig, body: ChatBody, onDelta: (t: string) => void): Promise<{ text: string; fixedModel?: string; busyFallback?: string }> {
  const gemini = isGeminiHost(config.baseUrl);
  const tryCompatStream = (model: string) => streamOpenAiCompatible({ ...config, model }, body, onDelta);
  const tryNativeStream = (model: string) => streamGeminiNative(config.apiKey, model, body, onDelta);

  const runOnce = async (): Promise<{ text: string; fixedModel?: string }> => {
    try {
      return { text: await tryCompatStream(config.model) };
    } catch (err) {
      const e = err as Error & { status?: number; providerDetail?: string };
      if (e.status !== 404) throw err;
      const detail = e.providerDetail ?? e.message ?? '';
      const retired = isModelRetiredMessage(detail);
      const suggested = extractSuggestedModel(detail, config.model);
      if (suggested) {
        try { return { text: await tryCompatStream(suggested), fixedModel: suggested }; } catch { /* নিচে */ }
        if (gemini) {
          try { return { text: await tryNativeStream(suggested), fixedModel: suggested }; } catch { /* নিচে */ }
        }
      }
      if (gemini) {
        try { return { text: await tryNativeStream(config.model) }; } catch (err2) {
          const e2 = err2 as Error & { status?: number };
          if (e2.status !== 404) throw err2;
        }
      }
      try {
        const ids = await fetchUpstreamModelIds(normalizeBase(config.baseUrl), config.apiKey, config.provider);
        const usable = retired ? ids.filter((m) => m.toLowerCase() !== config.model.toLowerCase()) : ids;
        const fixed = bestModelMatch(config.model, usable);
        if (fixed && fixed.toLowerCase() !== config.model.toLowerCase()) {
          return { text: await tryCompatStream(fixed), fixedModel: fixed };
        }
      } catch { /* আসল 404-ই ফেরত */ }
      throw err;
    }
  };

  let lastErr: (Error & { status?: number; retryAfterMs?: number }) | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await runOnce();
    } catch (err) {
      lastErr = err as Error & { status?: number; retryAfterMs?: number };
      if (!isTransientStatus(lastErr?.status)) throw err;
      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, backoffDelayMs(attempt, lastErr?.retryAfterMs)));
      }
    }
  }
  const status = lastErr?.status;
  if (status === 503 || status === 529) {
    for (const model of liteAlternativeModels(config.model)) {
      try {
        return { text: await tryCompatStream(model), busyFallback: model };
      } catch {
        if (isGeminiHost(config.baseUrl)) {
          try { return { text: await tryNativeStream(model), busyFallback: model }; } catch { /* পরের */ }
        }
      }
    }
  }
  throw lastErr ?? new Error('AI request failed');
}

/** SSE উত্তর-স্ট্রিম গড়া — ক্লায়েন্টে ai-stream.ts পার্স করে */
function sseResponse(): { stream: ReadableStream<Uint8Array>; send: (event: Record<string, unknown>) => void; close: () => void } {
  const enc = new TextEncoder();
  let send: (event: Record<string, unknown>) => void = () => undefined;
  let close: () => void = () => undefined;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      send = (event) => controller.enqueue(enc.encode(`data: ${JSON.stringify(event)}\n\n`));
      close = () => {
        try { controller.close(); } catch { /* দুইবার ক্লোজ নয় */ }
      };
    },
  });
  return { stream, send, close };
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
  const hasAnyKey = !!c?.apiKey?.trim();
  const hasKey = !!(c?.apiKey?.trim() && c?.baseUrl?.trim() && c?.model?.trim());

  // কি আছে কিন্তু Base URL/মডেল অসম্পূর্ণ — নিঃশব্দে ডেমোতে পাঠানো বিভ্রান্তিকর
  // (ইউজারের কি অব্যবহৃত থাকে, UI "প্রস্তুত" দেখায়); স্পষ্ট ত্রুটিই সঠিক পথ
  if (hasAnyKey && !hasKey) {
    return jsonError('INCOMPLETE_CONFIG', 'ai.err.config');
  }

  // রেট-লিমিট — ডেমো (আমাদের ক্রেডেনশিয়াল) কড়া, BYOK (ইউজারের নিজের) শিথিল
  const ip = clientIp(req);
  if (!allowRate(`${ip}:${hasKey ? 'byok' : 'demo'}`, hasKey ? RATE_BYOK : RATE_DEMO)) {
    return jsonError('Rate limit reached', hasKey ? 'ai.err.rateLimit' : 'ai.err.demoRate');
  }

  // ─── স্ট্রিম পথ — SSE: প্রথম টোকেনেই স্ক্রিনে লেখা (প্রিমিয়াম গতি) ───
  if (body.stream) {
    const { stream, send, close } = sseResponse();
    const sse = new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
    void (async () => {
      const push = (event: Record<string, unknown>) => {
        try { send(event); } catch { /* ক্লায়েন্ট চলে গেলে */ }
      };
      try {
        if (hasKey) {
          // SSRF গার্ড + মডেল-পরিচ্ছন্ন — non-streaming পথের সাথে একই নিয়ম
          const safeBase = assertSafeBase(c!.baseUrl, originIsLocal);
          if (!safeBase) {
            push({ done: true, ok: false, error: 'Base URL not allowed', hintKey: 'ai.err.badUrl' });
            return;
          }
          const cfg: AiProxyConfig = {
            baseUrl: safeBase,
            apiKey: c!.apiKey.trim(),
            model: sanitizeModelId(c!.model),
            provider: c!.provider,
          };
          if (!cfg.model) {
            push({ done: true, ok: false, error: 'MODEL_EMPTY', hintKey: 'ai.err.config' });
            return;
          }
          const { text, fixedModel, busyFallback } = await streamWithSelfHeal(cfg, body, (delta) => push({ delta }));
          // উৎস কোনো delta-ই না দিয়ে শেষ হলে (কিছু প্রোভাইডার) পূর্ণ লেখাটাই এক delta হিসেবে
          push({ done: true, ok: true, text, ...(fixedModel ? { fixedModel } : {}), ...(busyFallback ? { busyFallback } : {}) });
        } else {
          // ডেমো SDK স্ট্রিম অ্যাপিতে নেই — পূর্ণ উত্তর এক delta হিসেবে (ফলাফল একই)
          const { text } = await callDemo(body);
          push({ delta: text });
          push({ done: true, ok: true, text, demo: true });
        }
      } catch (err) {
        const e = err as Error & { status?: number };
        const msg = e?.message ?? 'AI request failed';
        const status = e?.status;
        // ত্রুটি-মানচিত্র — non-streaming পথের সাথে হুবহু একই নিয়ম
        let hintKey = 'ai.err.network';
        if (msg === 'BASE_URL_EMPTY' || msg === 'MODEL_EMPTY') hintKey = 'ai.err.config';
        else if (msg === 'EMPTY_RESPONSE' || msg.startsWith('EMPTY_RESPONSE:')) hintKey = 'ai.err.empty';
        else if (msg === 'TIMEOUT_ERROR' || e?.name === 'TimeoutError' || e?.name === 'AbortError') hintKey = 'ai.err.timeout';
        else if (status === 401 || status === 403 || status === 402) hintKey = 'ai.err.auth';
        else if (status === 400) hintKey = isInvalidKeyMessage(msg) ? 'ai.err.auth' : 'ai.err.badRequest';
        else if (status === 404) hintKey = 'ai.err.model';
        else if (status === 429) hintKey = 'ai.err.rate';
        else if (status === 503 || status === 529) hintKey = 'ai.err.busy';
        else if (status && status >= 500) hintKey = 'ai.err.server';
        push({ done: true, ok: false, error: msg, hintKey });
      } finally {
        close();
      }
    })();
    return sse;
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
      const { text, fixedModel, busyFallback } = await callWithBusyRetry(cfg, body);
      return NextResponse.json({ ok: true, text, ...(fixedModel ? { fixedModel } : {}), ...(busyFallback ? { busyFallback } : {}) });
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
        // সেন্টিনেল ফেরত — প্রোভাইডারের raw হিসেবে ভুল দেখানো এড়ায় (RAW_SKIP ফিল্টার করে)
        return jsonError('TIMEOUT_ERROR', 'ai.err.timeout');
      }
      if (status === 401 || status === 403 || status === 402) {
        return jsonError(msg, 'ai.err.auth');
      }
      if (status === 400) {
        // Gemini অবৈধ কিকেও 400 দেয় ("Please pass a valid API key") — সেক্ষেত্রে auth-ই সঠিক পরামর্শ
        if (isInvalidKeyMessage(msg)) return jsonError(msg, 'ai.err.auth');
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
      if (status === 503 || status === 529) {
        // overload/high-demand — স্বয়ং-পুনরায় ও হালকা-মডেল ফলব্যাক শেষ হলে এখানে আসে
        return jsonError(msg, 'ai.err.busy');
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
