/**
 * প্যাক-শেয়ার URL কোডেক — প্যাক JSON ↔ ?pack=<payload> (দিন ৬২)
 * ─────────────────────────────────────────────────────────────
 * ১০০% local-first: প্যাক ছোট হলে (ডিফল্ট প্যাক ২–৮KB) পুরো JSON লিংকেই
 * বাহি হয় — ক্লাউড/অ্যাকাউন্ট/সার্ভার কিছুই লাগে না। লিংক পাওয়া মানেই
 * প্যাক পাওয়া; ইনস্টল localStorage-এ (bps.packs.v1)।
 *
 * এনকোডিং:
 *   JSON → UTF-8 বাইট → deflate-raw (CompressionStream থাকলে) → base64url
 *   প্রিফিক্স: 'z' = সংকুচিত, 'b' = কাঁচা base64 (পুরনো ব্রাউজার ফলব্যাক)
 *
 * সীমা: base64url-পেলোড MAX_URL_PAYLOAD অক্ষরের বেশি হলে null — সে-ক্ষেত্রে
 * UI ফাইল-ডাউনলোড (.bpspack.json) বা গ্যালারি-পাবলিশের পরামর্শ দেয়
 * (ব্রাউজার/চ্যাট-অ্যাপের URL-দৈর্ঘ্য বাস্তবসমতা)।
 */

import { validatePack, type TemplatePack } from './template-pack';

/** পেলোড-সীমা — ~২৪k অক্ষর (সাধারণ চ্যাট/ফরামের সহনশীল দৈর্ঘ্য) */
export const MAX_URL_PAYLOAD = 24_000;

function bytesToBase64url(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlToBytes(s: string): Uint8Array {
  const norm = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = norm.length % 4 ? '='.repeat(4 - (norm.length % 4)) : '';
  const bin = atob(norm + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** CompressionStream('deflate-raw') আছে কি না */
function hasDeflate(): boolean {
  try {
    return typeof CompressionStream === 'function';
  } catch {
    return false;
  }
}

async function streamBytes(bytes: Uint8Array, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const buf = bytes.slice().buffer as ArrayBuffer;
  const stream = new Blob([buf]).stream().pipeThrough(transform);
  const out = await new Response(stream).arrayBuffer();
  return new Uint8Array(out);
}

/**
 * প্যাক → শেয়ার-URL (?pack=…)। প্যাক-অবৈধ বা পেলোড-সীমা ছাড়িয়ে গেলে null।
 * baseUrl না দিলে বর্তমান origin ব্যবহার হয়।
 */
export async function encodePackUrl(pack: TemplatePack, baseUrl?: string): Promise<string | null> {
  const valid = validatePack(pack);
  if (!valid) return null;
  const json = JSON.stringify(valid);
  let payload: string;
  if (hasDeflate()) {
    try {
      const deflated = await streamBytes(
        new TextEncoder().encode(json),
        new CompressionStream('deflate-raw'),
      );
      payload = 'z' + bytesToBase64url(deflated);
    } catch {
      payload = '';
    }
  } else {
    payload = '';
  }
  if (!payload) {
    try {
      payload = 'b' + bytesToBase64url(new TextEncoder().encode(json));
    } catch {
      return null;
    }
  }
  if (payload.length > MAX_URL_PAYLOAD) return null;
  const base = baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) return null;
  return `${base}/?pack=${payload}`;
}

/**
 * ?pack= পেলোড → যাচাই-করা প্যাক। ভাঙা/বানোয়াট/সীমা-বহি হলে null
 * (কখনো throw নয় — ভিউয়ার সরাসরি "লিংক অবৈধ" দেখায়)।
 */
export async function decodePackUrl(payload: string): Promise<TemplatePack | null> {
  if (!payload || payload.length > MAX_URL_PAYLOAD) return null;
  try {
    let bytes: Uint8Array;
    if (payload.startsWith('z')) {
      if (typeof DecompressionStream !== 'function') return null;
      bytes = await streamBytes(base64urlToBytes(payload.slice(1)), new DecompressionStream('deflate-raw'));
    } else if (payload.startsWith('b')) {
      bytes = base64urlToBytes(payload.slice(1));
    } else {
      // প্রিফিক্স-বিহীন পুরনো লিংক — কাঁচা base64 ধরে নেয়
      bytes = base64urlToBytes(payload);
    }
    const json = new TextDecoder().decode(bytes);
    return validatePack(JSON.parse(json));
  } catch {
    return null;
  }
}

/** প্যাকের আনুমানিক সাইজ (KB টেক্সটে) — ভিউয়ারে দেখানোর জন্য */
export function packApproxKb(pack: TemplatePack): number {
  try {
    return Math.max(1, Math.round(JSON.stringify(pack).length / 102.4) / 10);
  } catch {
    return 0;
  }
}
