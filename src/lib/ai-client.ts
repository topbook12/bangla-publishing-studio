/**
 * AI ক্লায়েন্ট হেল্পার (ব্রাউজার সাইড)
 * ────────────────────────────────────
 *  - ছবি ফাইল/পেস্ট/ড্র্যাগ → ক্যানভাসে ডাউনস্কেল (≤1568px) → dataURL
 *    (বড় স্ক্রিনশটেও দ্রুত আপলোড — প্রিমিয়াম গতি)
 *  - /api/ai/chat-এ কল — BYOK কনফিগ সহ (কি localStorage থেকে শুধু
 *    রিকোয়েস্টে যায়, কোথাও জমা হয় না)
 *  - কঠোর JSON সিস্টেম প্রম্পট (ai-content.ts-এর স্কিমার সাথে মিলিয়ে)
 */

import { useAiStore, providerPreset } from './ai-store';
import type { AiResult } from './ai-content';
import { extractJson } from './ai-content';
import { withTransientRetry } from './ai-retry';
import { t } from './i18n';
import { toast } from 'sonner';

// ─── সিস্টেম প্রম্পট (কঠোর JSON) ───

const JSON_SCHEMA_RULES = `Return ONLY valid JSON — no markdown fences, no commentary before or after. Shape exactly:
{
  "title": string,
  "caption": string,
  "blocks": [
    { "type": "heading",   "text": string, "level": 2 or 3 },
    { "type": "paragraph", "text": string },
    { "type": "bullets",   "items": string[] },
    { "type": "numbered",  "items": string[] },
    { "type": "table",     "rows": string[][] },
    { "type": "callout",   "text": string, "variant": "concept" | "warning" | "formula" | "note" },
    { "type": "quote",     "text": string },
    { "type": "code",      "text": string }
  ]
}
Rules:
- "title" = short heading for the content; "caption" = one-line figure caption (empty string if none).
- Write the content in the SAME language the user's instruction uses (default: Bengali).
- Transcribe ALL visible text faithfully; keep numbers, units, formulas exactly.
- Convert flowcharts/diagrams into numbered steps or bullets as requested.
- Tables -> rows arrays, first row = header row. 6–14 blocks typical. No empty blocks.`;

export const AI_VISION_SYSTEM = `You are the AI publishing engine of "Bangla Publishing Studio" — an expert book-composition assistant for Bengali, Hindi and English books. The user uploads an image (book diagram, screenshot, scanned page, table, figure, handwritten notes) and gives an instruction. Study the image carefully and turn it into book-ready structured content following the instruction. ${JSON_SCHEMA_RULES}`;

export const AI_TEXT_SYSTEM = `You are the AI writing assistant of "Bangla Publishing Studio" — an expert book writer for Bengali, Hindi and English books. Write book-ready, well-structured content for the user's request. ${JSON_SCHEMA_RULES}`;

// ─── ছবি প্রি-প্রসেসিং ───

export interface PreparedImage {
  dataUrl: string;
  width: number;
  height: number;
  name: string;
  bytes: number;
}

const MAX_DIM = 1568; // বড় ভিশন মডেলগুলোর সুইট-স্পট
const MAX_FILE_BYTES = 4_500_000; // সার্ভারের ~5MB ক্যাপের আগেই ধরি (বেস৬৪ বাড়তি ৩৪%)

/** ফাইল → প্রয়োজনে ডাউনস্কেল করা dataURL (PNG হলে PNG, নইলে JPEG) */
export async function prepareImageFile(file: File): Promise<PreparedImage> {
  if (file.size > MAX_FILE_BYTES) throw new Error('IMAGE_TOO_LARGE');
  const rawUrl = await readAsDataUrl(file);
  const img = await loadImage(rawUrl);
  // GIF ক্যানভাসে গেলে অ্যানিমেশন ও স্বচ্ছতা ভাঙে — সরাসরি মূল dataURL-ই সেরা
  if (/image\/gif/i.test(file.type)) {
    const bytes = Math.round((rawUrl.length - rawUrl.indexOf(',') - 1) * 0.75);
    return { dataUrl: rawUrl, width: img.naturalWidth, height: img.naturalHeight, name: file.name || 'image', bytes };
  }
  const scale = Math.min(1, MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dataUrl: rawUrl, width: img.naturalWidth, height: img.naturalHeight, name: file.name, bytes: file.size };
  ctx.drawImage(img, 0, 0, w, h);

  const isPng = /image\/png/i.test(file.type);
  const mime = isPng ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mime, isPng ? undefined : 0.9);
  const bytes = Math.round((dataUrl.length - dataUrl.indexOf(',') - 1) * 0.75);
  return { dataUrl, width: w, height: h, name: file.name || 'image', bytes };
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(new Error('READ_FAIL'));
    fr.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('IMAGE_DECODE_FAIL'));
    img.src = src;
  });
}

// ─── API কল ───

export interface AiCallResult {
  ok: boolean;
  text?: string;
  demo?: boolean;
  error?: string;
  hintKey?: string;
  /** সার্ভারের বাড়তি ব্যাখ্যা (যেমন 404-এ চেষ্টা করা ঠিকানা) */
  detail?: string;
  /** সার্ভার নিকটতম সঠিক মডেলে স্বয়ংক্রিয় সংশোধন করলে — কোনটিতে */
  fixedModel?: string;
  /** মডেল ব্যস্ত থাকায় একই পরিবারের হালকা বিকল্পে উত্তর এসেছে — কোনটিতে */
  busyFallback?: string;
}

/** সেভ করা BYOK কনফিগ (থাকলে) সহ /api/ai/chat কল — অস্থায়ী ত্রুটিতে স্বয়ং-পুনরায় সহ */
export async function callAi(opts: {
  prompt: string;
  system: string;
  imageDataUrl?: string | null;
  /** কি বাদ দিয়ে বিল্ট-ইন ডেমো SDK ব্যবহার */
  demo?: boolean;
}): Promise<AiCallResult> {
  const attempt = async (): Promise<AiCallResult> => {
    const config = useAiStore.getState().config;
    const preset = providerPreset(config.provider);
    // সম্পূর্ণ ব্যবহারযোগ্য কনফিগই BYOK — কি থাকলেও baseUrl/মডেল ফাঁকা হলে
    // কি অব্যবহৃত থেকে নিঃশব্দ ডেমোতে চলে যেত; সেটাই আসল বিভ্রান্তি
    const baseUrl = (config.baseUrl || preset.baseUrl).trim();
    const model = (config.model || preset.visionModel || preset.model).trim();
    const useOwnKey = !opts.demo && !!(config.apiKey.trim() && baseUrl && model);

    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(200_000), // সার্ভার hard-cap ১৮০সে + self-heal + busy-retry — ক্লায়েন্টে ঢিলেঢালা সীমা
      body: JSON.stringify({
        prompt: opts.prompt,
        system: opts.system,
        imageDataUrl: opts.imageDataUrl ?? null,
        config: useOwnKey
          ? {
              baseUrl,
              apiKey: config.apiKey.trim(),
              model,
              provider: config.provider,
            }
          : null,
      }),
    });
    const data = (await res.json()) as AiCallResult;
    // স্বয়ং-নিরাময়: প্রোভাইডারের পরামর্শমতো সঠিক মডেলে চলে গেলে সেটাই সেভ করে
    // রাখি — পরের প্রতিটি কল সরাসরি সঠিক মডেলে যায়, আর 404 দেখা যায় না
    if (data.ok && data.fixedModel) {
      useAiStore.getState().setConfig({ model: data.fixedModel });
    }
    // মডেল ব্যস্ত ছিল — হালকা বিকল্প থেকে উত্তর এসেছে; ইউজারের পছন্দ বদলাই নি, শুধু জানাই
    if (data.ok && data.busyFallback) {
      toast.info(`${t('ai.err.busyFallback')} ${data.busyFallback}`);
    }
    return data;
  };

  try {
    // ব্যস্ত/সার্ভার-সমস্যায় ক্লায়েন্টেও ২ পর্যন্ত চুপচাপ পুনরায় (৫ সে ও ১২ সে পরে)
    return await withTransientRetry(attempt);
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      return { ok: false, error: 'TIMEOUT_ERROR', hintKey: 'ai.err.timeout' };
    }
    return { ok: false, error: 'NETWORK', hintKey: 'ai.err.network' };
  }
}

/** ভিশন কল + JSON পার্স; ব্যর্থ হলে কারণসহ ফেরত */
export async function analyzeImage(opts: {
  imageDataUrl: string;
  instruction: string;
  demo?: boolean;
}): Promise<{ ok: true; result: AiResult; demo?: boolean } | { ok: false; error: string; hintKey?: string; detail?: string; parseFail?: boolean }> {
  const prompt = [
    opts.instruction.trim()
      ? `নির্দেশ (instruction): ${opts.instruction.trim()}`
      : 'নির্দেশ: ছবির সব লেখা ও কাঠামো বইয়ের উপযোগী করে সুন্দরভাবে সাজিয়ে দাও।',
    'ছবিটি মনোযোগ দিয়ে দেখে উপরের JSON ফরম্যাটে কনটেন্ট দাও।',
  ].join('\n');

  const res = await callAi({ prompt, system: AI_VISION_SYSTEM, imageDataUrl: opts.imageDataUrl, demo: opts.demo });
  if (!res.ok) return { ok: false, error: res.error ?? 'UNKNOWN', hintKey: res.hintKey, detail: res.detail };
  // ভিশন পথেও স্বয়ং-সংশোধন জানাই — বাবল/চ্যাটের মতোই (ডুপ্লিকেট নেই, এই পথ একা)
  if (res.fixedModel) toast.info(`${t('ai.err.fixedModel')} ${res.fixedModel}`);
  const result = extractJson(res.text ?? '');
  if (!result || result.blocks.length === 0) {
    return { ok: false, error: 'PARSE', hintKey: 'ai.err.parse', parseFail: true };
  }
  return { ok: true, result, demo: res.demo };
}

/** টেক্সট (AI লেখক) কল + JSON পার্স */
export async function generateBookText(opts: {
  instruction: string;
  demo?: boolean;
}): Promise<{ ok: true; result: AiResult; demo?: boolean } | { ok: false; error: string; hintKey?: string; detail?: string; parseFail?: boolean }> {
  const prompt = `নির্দেশ (instruction): ${opts.instruction.trim()}\n\nউপরের JSON ফরম্যাটে বইয়ের উপযোগী কনটেন্ট লেখো।`;
  const res = await callAi({ prompt, system: AI_TEXT_SYSTEM, demo: opts.demo });
  if (!res.ok) return { ok: false, error: res.error ?? 'UNKNOWN', hintKey: res.hintKey, detail: res.detail };
  if (res.fixedModel) toast.info(`${t('ai.err.fixedModel')} ${res.fixedModel}`);
  const result = extractJson(res.text ?? '');
  if (!result || result.blocks.length === 0) {
    return { ok: false, error: 'PARSE', hintKey: 'ai.err.parse', parseFail: true };
  }
  return { ok: true, result, demo: res.demo };
}

/** সংযোগ পরীক্ষা (সেটিংস ডায়ালগ) */
export async function testAiConnection(demo = false): Promise<AiCallResult> {
  return callAi({ prompt: 'Reply with exactly: OK', system: 'You are a connection tester.', demo });
}

/** প্রোভাইডার থেকে উপলব্ধ মডেলের তালিকা (সেটিংস ডায়ালগ — 404 এড়াতে তালিকা থেকে বাছাই) */
export async function fetchModelList(draftKey?: string): Promise<
  { ok: true; models: string[] } | { ok: false; error?: string; hintKey?: string; detail?: string }
> {
  const config = useAiStore.getState().config;
  const preset = providerPreset(config.provider);
  const apiKey = (draftKey ?? config.apiKey).trim();
  const baseUrl = (config.baseUrl || preset.baseUrl).trim();
  if (!apiKey || !baseUrl) return { ok: false, hintKey: 'ai.err.config' };
  try {
    const res = await fetch('/api/ai/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseUrl, apiKey, provider: config.provider }),
    });
    const data = (await res.json()) as { ok: boolean; models?: string[]; error?: string; hintKey?: string; detail?: string };
    if (data.ok && Array.isArray(data.models)) return { ok: true, models: data.models };
    return { ok: false, error: data.error, hintKey: data.hintKey, detail: data.detail };
  } catch {
    return { ok: false, hintKey: 'ai.err.network' };
  }
}
