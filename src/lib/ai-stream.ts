/**
 * AI স্ট্রিমিং ক্লায়েন্ট (SSE) — প্রিমিয়াম গতি
 * ───────────────────────────────────────────
 * /api/ai/chat-এ stream:true দিয়ে কল করে উত্তর টোকেন-ধারায় পড়ে —
 * প্রথম টোকেন এলেই onDelta চালু হয়, ইউজার স্ক্রিনে লেখা ফোঁটায় দেখে
 * (Copilot/ChatGPT-অভিজ্ঞতা)। সার্ভার কোনো কারণে JSON-উত্তর দিলে
 * (পুরনো ক্যাশ/প্রক্সি/ত্রুটি) স্বয়ংক্রিয়ভাবে সেটাই পার্স হয় — ফলাফল একই।
 *
 * ত্রুটি-নিয়ম non-streaming পথের সাথে হুবহু এক — একই hintKey, একই
 * fixedModel/busyFallback স্বয়ং-নিরাময়।
 */

import { useAiStore, providerPreset } from './ai-store';
import type { AiTextResult } from './ai-assistant';
import { t } from './i18n';
import { toast } from 'sonner';

/** সার্ভারের সেন্টিনেল কোড — raw প্রোভাইডার-উত্তর হিসেবে দেখানো হয় না */
const RAW_SKIP = new Set([
  'NETWORK', 'TIMEOUT_ERROR', 'EMPTY_RESPONSE', 'BASE_URL_EMPTY', 'MODEL_EMPTY', 'PARSE',
  'READ_FAIL', 'IMAGE_DECODE_FAIL', 'IMAGE_TOO_LARGE', 'INVALID_REQUEST_BODY', 'PAYLOAD_TOO_LARGE',
  'INCOMPLETE_CONFIG', 'DEMO_UNAVAILABLE',
]);

export function rawProviderLineStream(error: string | undefined, label: string): string {
  if (!error || RAW_SKIP.has(error)) return '';
  return `${label} ${error}`;
}

interface StreamEvent {
  delta?: string;
  done?: boolean;
  ok?: boolean;
  text?: string;
  demo?: boolean;
  fixedModel?: string;
  busyFallback?: string;
  error?: string;
  hintKey?: string;
  detail?: string;
}

export interface StreamCallOptions {
  prompt: string;
  system: string;
  imageDataUrl?: string | null;
  /** প্রতি টোকেন-গুচ্ছে জমানো পূর্ণ লেখা দিয়ে ডাকা হয় (রিসেটে খালি স্ট্রিং) */
  onDelta?: (fullText: string) => void;
  /** বাতিল-সংকেত — তথাপি সার্ভার-কল চলতে থাকে, শুধু পড়া থামে */
  signal?: AbortSignal;
}

/**
 * স্ট্রিমিং AI কল — ফলাফল সম্পূর্ণ AiTextResult। সার্ভার JSON ফেরত দিলে
 * (স্ট্রিম অসমর্থিত/ত্রুটি) সেটাও স্বাভাবিকভাবে পার্স হয় — কলারের কোড একই থাকে।
 */
export async function callTextApiStream(opts: StreamCallOptions): Promise<AiTextResult> {
  const config = useAiStore.getState().config;
  const preset = providerPreset(config.provider);
  // সম্পূর্ণ ব্যবহাযোগ্য কনফিগই BYOK — নইলে ডেমো
  const baseUrl = (config.baseUrl || preset.baseUrl).trim();
  const model = (config.model || preset.model || preset.visionModel).trim();
  const hasKey = !!(config.apiKey.trim() && baseUrl && model);

  let res: Response;
  try {
    res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.any([AbortSignal.timeout(200_000), ...(opts.signal ? [opts.signal] : [])]),
      body: JSON.stringify({
        prompt: opts.prompt,
        system: opts.system,
        imageDataUrl: opts.imageDataUrl ?? null,
        stream: true,
        config: hasKey
          ? {
              baseUrl,
              apiKey: config.apiKey.trim(),
              model,
              provider: config.provider,
            }
          : null,
      }),
    });
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      return { ok: false, error: 'TIMEOUT_ERROR', hintKey: 'ai.err.timeout' };
    }
    return { ok: false, error: 'NETWORK', hintKey: 'ai.err.network' };
  }

  // সার্ভার JSON ফেরত দিলে (rate-limit জাতীয় ত্রুটি) — সরাসরি সেই ফলাফল
  const ctype = res.headers.get('content-type') ?? '';
  if (!ctype.includes('text/event-stream')) {
    try {
      const data = (await res.json()) as AiTextResult;
      return data;
    } catch {
      return { ok: false, error: 'NETWORK', hintKey: 'ai.err.network' };
    }
  }
  if (!res.body) return { ok: false, error: 'EMPTY_RESPONSE', hintKey: 'ai.err.empty' };

  // ─── SSE পাম্প ───
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let acc = '';
  let final: AiTextResult | null = null;
  opts.onDelta?.('');
  try {
    for (;;) {
      if (opts.signal?.aborted) {
        try { await reader.cancel(); } catch { /* বন্ধ */ }
        return { ok: false, error: 'CANCELLED', hintKey: 'ai.err.timeout' };
      }
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, idx).replace(/\r$/, '');
        buf = buf.slice(idx + 1);
        if (!line.startsWith('data:')) continue;
        const payload = line.slice(5).trim();
        if (!payload) continue;
        let ev: StreamEvent;
        try {
          ev = JSON.parse(payload) as StreamEvent;
        } catch {
          continue;
        }
        if (ev.delta) {
          acc += ev.delta;
          opts.onDelta?.(acc);
        }
        if (ev.done) {
          const text = ev.text ?? acc;
          final = ev.ok
            ? { ok: true, markdown: text, text, demo: ev.demo, fixedModel: ev.fixedModel, busyFallback: ev.busyFallback }
            : { ok: false, error: ev.error, hintKey: ev.hintKey, detail: ev.detail };
        }
      }
    }
  } catch {
    if (acc) {
      // অর্ধেক-স্ট্রিমে নেটওয়ার্ক ভাঙলে পর্যন্ত-পাওয়া অংশই মূল্যবান
      return { ok: true, markdown: acc, text: acc };
    }
    return { ok: false, error: 'NETWORK', hintKey: 'ai.err.network' };
  }

  if (!final) {
    if (acc.trim()) return { ok: true, markdown: acc, text: acc };
    return { ok: false, error: 'EMPTY_RESPONSE', hintKey: 'ai.err.empty' };
  }
  // স্বয়ং-নিরাময় — non-streaming পথের সাথে হুবহু এক আচরণ
  if (final.ok && final.fixedModel) {
    useAiStore.getState().setConfig({ model: final.fixedModel });
  }
  if (final.ok && final.busyFallback) {
    toast.info(`${t('ai.err.busyFallback')} ${final.busyFallback}`);
  }
  return final;
}
