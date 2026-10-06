/**
 * AI কনটেন্ট ইঞ্জিন — মডেলের JSON উত্তর থেকে এডিটর HTML নির্মাণ
 * ─────────────────────────────────────────────────────────────
 * মডেল কঠোর JSON স্কিমায় উত্তর দেয় (system প্রম্পটে বাধ্য করা হয়):
 *   { title, caption, blocks: [{ type, text?, level?, items?, rows?, variant? }] }
 * extractJson() ফেন্স/অতিরিক্ত টেক্সট সহ্য করে; blocksToHtml() এডিটরের
 * স্টোরেজ কনট্রাক্ট মেনে (callout-box → data-variant, FramedImage →
 * data-align/data-framed) insertContent-এর উপযোগী HTML বানায়।
 */

export type AiBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullets'
  | 'numbered'
  | 'table'
  | 'callout'
  | 'quote'
  | 'code';

export interface AiBlock {
  type: AiBlockType;
  text?: string;
  level?: number;
  items?: string[];
  rows?: string[][];
  variant?: string;
}

export interface AiResult {
  title?: string;
  caption?: string;
  blocks: AiBlock[];
}

// ─── JSON উদ্ধার ───

/** মডেলের উত্তর থেকে JSON অবজেক্ট বের করা — ```ফেন্স, আগে-পরের টেক্সট সহ্য করে */
export function extractJson(raw: string): AiResult | null {
  if (!raw) return null;
  let s = raw.trim();
  // ```json … ``` ফেন্স খোলা
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  // প্রথম balanced { … } খোঁজা
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === '\\') esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        const candidate = s.slice(start, i + 1);
        try {
          const obj = JSON.parse(candidate) as Partial<AiResult>;
          if (obj && Array.isArray(obj.blocks)) return normalizeResult(obj);
        } catch {
          // পরের বন্ধনীতে আবার চেষ্টা হবে
        }
        // balanced কিন্তু parse ব্যর্থ → নতুন করে গভীরতা শুরু করা যায় না; থামি
        return null;
      }
    }
  }
  return null;
}

function asText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asTextArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => asText(x)).filter(Boolean);
}

function asRows(v: unknown): string[][] {
  if (!Array.isArray(v)) return [];
  const rows = v
    .map((r) => (Array.isArray(r) ? r.map((c) => asText(c)) : typeof r === 'string' ? [asText(r)] : []))
    .filter((r) => r.some((c) => c.length > 0));
  return rows;
}

/** মডেলের ঢিলাঢিলা উত্তরও যেন কাজ করে — ব্লকগুলো স্বাভাবিকীকরণ */
function normalizeResult(obj: Partial<AiResult>): AiResult {
  const blocks: AiBlock[] = [];
  for (const b of obj.blocks ?? []) {
    if (!b || typeof b !== 'object') continue;
    const type = String(b.type ?? 'paragraph').toLowerCase() as AiBlockType;
    const text = asText(b.text);
    const items = asTextArray(b.items);
    const rows = asRows(b.rows);
    if (type === 'heading' || type === 'paragraph' || type === 'callout' || type === 'quote' || type === 'code') {
      if (text) blocks.push({ type, text, level: type === 'heading' ? (b.level === 3 ? 3 : 2) : undefined, variant: b.variant });
    } else if (type === 'bullets' || type === 'numbered') {
      if (items.length) blocks.push({ type, items });
      else if (text) blocks.push({ type: 'paragraph', text });
    } else if (type === 'table') {
      if (rows.length) blocks.push({ type: 'table', rows });
      else if (text) blocks.push({ type: 'paragraph', text });
    } else {
      // অজানা টাইপ → প্যারাগ্রাফ
      if (text || items.length) {
        blocks.push(items.length ? { type: 'bullets', items } : { type: 'paragraph', text });
      }
    }
  }
  return { title: asText(obj.title) || undefined, caption: asText(obj.caption) || undefined, blocks };
}

// ─── HTML নির্মাণ ───

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** মাল্টি-লাইন টেক্সট → <p> স্তূপ (খালি লাইন = প্যারা বিরতি) */
function paragraphs(text: string): string {
  return text
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join('');
}

const CALLOUT_VARIANTS = new Set(['concept', 'warning', 'formula', 'note']);

export interface BlocksToHtmlOptions {
  /** মূল ছবিটিও বইয়ে বসানো হবে কি না */
  includeImage?: boolean;
  /** ছবির dataURL (includeImage সক্রিয় হলে) */
  imageDataUrl?: string | null;
  /** ছবির ক্যাপশন */
  caption?: string | null;
  /** প্রথমে শিরোনাম (AI দেওয়া title) বসবে কি না */
  includeTitle?: boolean;
}

/** AI ব্লকগুলো → TipTap insertContent-উপযোগী HTML */
export function blocksToHtml(result: AiResult, opts: BlocksToHtmlOptions = {}): string {
  const parts: string[] = [];
  const { includeImage, imageDataUrl, caption, includeTitle = true } = opts;

  if (includeImage && imageDataUrl) {
    parts.push(
      `<img src="${imageDataUrl}" alt="${escapeHtml(caption || result.title || 'AI image')}" data-align="center" data-framed="true">`,
    );
    const cap = (caption || result.caption || '').trim();
    if (cap) parts.push(`<p style="text-align:center"><em>${escapeHtml(cap)}</em></p>`);
  } else if (includeImage && caption) {
    // ছবি ছাড়াও ক্যাপশন চাইলে রাখি
  }

  if (includeTitle && result.title?.trim()) {
    parts.push(`<h2>${escapeHtml(result.title.trim())}</h2>`);
  }

  for (const b of result.blocks) {
    switch (b.type) {
      case 'heading': {
        const level = b.level === 3 ? 'h3' : 'h2';
        parts.push(`<${level}>${escapeHtml(b.text ?? '')}</${level}>`);
        break;
      }
      case 'paragraph':
        parts.push(paragraphs(b.text ?? ''));
        break;
      case 'bullets':
        parts.push(`<ul>${(b.items ?? []).map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`);
        break;
      case 'numbered':
        parts.push(`<ol>${(b.items ?? []).map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ol>`);
        break;
      case 'table': {
        const rows = b.rows ?? [];
        if (!rows.length) break;
        const [head, ...body] = rows;
        const th = head.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
        const trs = body
          .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
          .join('');
        parts.push(`<table><tbody><tr>${th}</tr>${trs}</tbody></table>`);
        break;
      }
      case 'callout': {
        const variant = CALLOUT_VARIANTS.has(b.variant ?? '') ? b.variant! : 'concept';
        parts.push(
          `<div class="callout-box" data-variant="${variant}">${paragraphs(b.text ?? '')}</div>`,
        );
        break;
      }
      case 'quote':
        parts.push(`<blockquote><p>${escapeHtml(b.text ?? '')}</p></blockquote>`);
        break;
      case 'code':
        parts.push(`<pre><code>${escapeHtml(b.text ?? '')}</code></pre>`);
        break;
    }
  }

  return parts.filter(Boolean).join('');
}
