/**
 * AI সহকারী ইঞ্জিন — সিলেকশন ট্রান্সফর্ম + প্রফেশনাল চ্যাট
 * ─────────────────────────────────────────────────────────
 *  - SELECTION_MODES: সিলেক্ট করা লেখায় এক-ট্যাপ AI কাজ (উন্নত, ব্যাকরণ,
 *    অনুবাদ, টেবিল, ব্যাখ্যা…)
 *  - runSelectionAi / runChatAi: /api/ai/chat প্রক্সি কল (BYOK — নিজের কি)
 *  - markdownToHtml: AI-র মার্কডাউন → সুরক্ষিত এডিটর HTML। ইনপুট আগে
 *    escape হয়, তারপর শুধু নির্দিষ্ট সিনট্যাক্স ট্যাগে রূপ নেয় — XSS-নিরাপদ।
 */

import { useAiStore, providerPreset } from './ai-store';
import type { AiBubbleMode } from './ai-bubble-store';
import type { Editor } from '@tiptap/react';
import type { Node as PMNode } from 'prosemirror-model';

// ─── সিস্টেম প্রম্পট ───

export const AI_EDIT_SYSTEM = `You are the AI editing engine of "Bangla Publishing Studio" — a precise book-composition assistant for Bengali, Hindi and English books.
The user selects a piece of their book and asks for a transformation. Rewrite/transform EXACTLY as asked.
Return ONLY the finished content as clean Markdown — no preamble, no explanations, no code fences.
Preserve the original language unless a translation is requested. Keep proper nouns, numbers, units and citations intact.
Use Markdown structure when it improves the content: ## headings, lists, | tables |, **bold**, > quotes.`;

export const AI_CHAT_SYSTEM = `You are the professional AI co-author of "Bangla Publishing Studio" — an MS-Word-like book typesetting platform for Bengali, Hindi and English publishers.
You help authors plan, write, translate, summarize, structure and fix book content.
Style: warm, professional, concise; reply in the user's language (default Bengali).
Use clean Markdown in every reply — ## headings, bullet/numbered lists, | tables |, **bold** — because the user can insert your replies straight into their book.
When the user pastes or describes part of their book, treat it as the working context and edit/extend it exactly as instructed.
If a request is unclear, ask ONE short clarifying question, then still offer a best-effort draft.`;

// ─── মোড সংজ্ঞা ───

export interface SelectionModeDef {
  id: AiBubbleMode;
  labelKey: string;
  tipKey: string;
  /** replace = সিলেকশন বদলে বসবে; insert = সিলেকশনের পরে যোগ হবে */
  kind: 'replace' | 'insert';
  buildPrompt: (selection: string, custom?: string) => string;
}

export const SELECTION_MODES: SelectionModeDef[] = [
  {
    id: 'improve',
    labelKey: 'ai.sel.improve',
    tipKey: 'ai.sel.improve.tip',
    kind: 'replace',
    buildPrompt: (s) =>
      `নিচের বইয়ের অংশটি আরও প্রাঞ্জল, স্পষ্ট ও প্রফেশনাল করে পুনর্লিখন করো। অর্থ, তথ্য ও ভাষা অপরিবর্তিত রাখো; দৈর্ঘ্য আনুমানিক একই রাখো:\n\n---\n${s}\n---`,
  },
  {
    id: 'grammar',
    labelKey: 'ai.sel.grammar',
    tipKey: 'ai.sel.grammar.tip',
    kind: 'replace',
    buildPrompt: (s) =>
      `নিচের লেখার শুধু বানান, ব্যাকরণ ও বিরামচিহ্নের ভুল ঠিক করো। শব্দচয়ন ও বাক্যগঠন নিজে থেকে বদলাবে না; লেখকের ভঙ্গি অটুট রাখো:\n\n---\n${s}\n---`,
  },
  {
    id: 'translate-en',
    labelKey: 'ai.sel.trEn',
    tipKey: 'ai.sel.trEn.tip',
    kind: 'replace',
    buildPrompt: (s) => `Translate the following book excerpt into natural, publication-quality English. Keep formatting:\n\n---\n${s}\n---`,
  },
  {
    id: 'translate-bn',
    labelKey: 'ai.sel.trBn',
    tipKey: 'ai.sel.trBn.tip',
    kind: 'replace',
    buildPrompt: (s) => `নিচের অংশটি সাবলীল, প্রকাশনা-মানের বাংলায় অনুবাদ করো। ফরম্যাট রাখো:\n\n---\n${s}\n---`,
  },
  {
    id: 'translate-hi',
    labelKey: 'ai.sel.trHi',
    tipKey: 'ai.sel.trHi.tip',
    kind: 'replace',
    buildPrompt: (s) => `निम्नलिखित अंश का प्रकाशन-स्तरीय, सरल हिन्दी में अनुवाद करें। फ़ॉर्मेटिंग बनाए रखें:\n\n---\n${s}\n---`,
  },
  {
    id: 'shorten',
    labelKey: 'ai.sel.shorten',
    tipKey: 'ai.sel.shorten.tip',
    kind: 'replace',
    buildPrompt: (s) =>
      `নিচের অংশটি অর্থ ঠিক রেখে প্রায় অর্ধেক দৈর্ঘ্যে সংক্ষিপ্ত করো। মূল তথ্য কোনোটিই বাদ দেবে না:\n\n---\n${s}\n---`,
  },
  {
    id: 'expand',
    labelKey: 'ai.sel.expand',
    tipKey: 'ai.sel.expand.tip',
    kind: 'replace',
    buildPrompt: (s) =>
      `নিচের অংশটি প্রায় দ্বিগুণ দৈর্ঘ্যে বিস্তারিত করো — উদাহরণ, কারণ ও স্পষ্টীকরণ যোগ করো। নতুন ভুল তথ্য বানাবে না:\n\n---\n${s}\n---`,
  },
  {
    id: 'simplify',
    labelKey: 'ai.sel.simplify',
    tipKey: 'ai.sel.simplify.tip',
    kind: 'replace',
    buildPrompt: (s) =>
      `নিচের অংশটি সহজ, সরল ভাষায় লেখো যেন সাধারণ পাঠকও সহজে বোঝে। তথ্য অপরিবর্তিত থাকবে:\n\n---\n${s}\n---`,
  },
  {
    id: 'formal',
    labelKey: 'ai.sel.formal',
    tipKey: 'ai.sel.formal.tip',
    kind: 'replace',
    buildPrompt: (s) =>
      `নিচের অংশটি আনুষ্ঠানিক, গ্রন্থ-মানের প্রকাশনা ভঙ্গিতে লেখো (formal academic tone):\n\n---\n${s}\n---`,
  },
  {
    id: 'bullets',
    labelKey: 'ai.sel.bullets',
    tipKey: 'ai.sel.bullets.tip',
    kind: 'replace',
    buildPrompt: (s) =>
      `নিচের অংশের মূল বিষয়গুলো সুশৃঙ্খল বুলেট তালিকায় গুছিয়ে লেখো (প্রতিটি পয়েন্ট সংক্ষিপ্ত):\n\n---\n${s}\n---`,
  },
  {
    id: 'make-table',
    labelKey: 'ai.sel.makeTable',
    tipKey: 'ai.sel.makeTable.tip',
    kind: 'replace',
    buildPrompt: (s, custom) =>
      `নিচের অংশের তথ্যগুলো সুন্দর একটি Markdown টেবিলে সাজাও (প্রথম সারি হেডার)। টেবিলের বাইরে কিছু লিখবে না।${custom?.trim() ? `\nলেখকের নির্দেশ: ${custom.trim()}` : ''}\n\n---\n${s}\n---`,
  },
  {
    id: 'explain',
    labelKey: 'ai.sel.explain',
    tipKey: 'ai.sel.explain.tip',
    kind: 'insert',
    buildPrompt: (s) =>
      `নিচের বইয়ের অংশটি পাঠকের জন্য সহজ ভাষায় বিস্তারিত ব্যাখ্যা করো (মূল লেখাটি নতুন করে লিখবে না, শুধু ব্যাখ্যা দেবে):\n\n---\n${s}\n---`,
  },
  {
    id: 'verify',
    labelKey: 'ai.sel.verify',
    tipKey: 'ai.sel.verify.tip',
    kind: 'insert',
    buildPrompt: (s) =>
      `নিচের বইয়ের অংশটির সঠিকতা যাচাই করো — বানান, ব্যাকরণ, তথ্য-অসংগতি, সংখ্যা/এককের ভুল ও কাঠামোগত সমস্যা খুঁজে বের করো। প্রতিটি সমস্যা নম্বর-তালিকায় দাও: কী ভুল, কোথায় (মূল অংশের উদ্ধৃতি দিয়ে), কীভাবে ঠিক করা যায়। কোনো ভুল না পেলে স্পষ্ট লেখো যে সব ঠিক আছে:\n\n---\n${s}\n---`,
  },
  {
    id: 'continue',
    labelKey: 'ai.sel.continue',
    tipKey: 'ai.sel.continue.tip',
    kind: 'insert',
    buildPrompt: (s, custom) =>
      `${custom?.trim() ? `লেখকের নির্দেশ: ${custom.trim()}\n\n` : ''}নিচের বইয়ের অংশটির ধারা অব্যাহত রেখে পরের অংশটি লিখে দাও — একই ভাষা, একই বিষয়, একই বলিষ্ঠা; আগের লেখা পুনরাবৃত্তি করবে না (৩–৫ প্যারাগ্রাফ):\n\n---\n${s}\n---`,
  },
  {
    id: 'custom',
    labelKey: 'ai.sel.custom',
    tipKey: 'ai.sel.custom.tip',
    kind: 'replace',
    buildPrompt: (s, custom) =>
      `${custom ?? ''}\n\nবইয়ের অংশ:\n---\n${s}\n---`,
  },
];

export const modeById = (id: string): SelectionModeDef | undefined =>
  SELECTION_MODES.find((m) => m.id === id);

// ─── API কল ───

/** সার্ভারের সেন্টিনেল কোড — এগুলো raw "প্রোভাইডারের উত্তর" হিসেবে দেখানো হয় না */
const RAW_SKIP = new Set([
  'NETWORK', 'TIMEOUT_ERROR', 'EMPTY_RESPONSE', 'BASE_URL_EMPTY', 'MODEL_EMPTY', 'PARSE',
  'READ_FAIL', 'IMAGE_DECODE_FAIL', 'IMAGE_TOO_LARGE', 'INVALID_REQUEST_BODY', 'PAYLOAD_TOO_LARGE',
  'INCOMPLETE_CONFIG',
]);

/**
 * প্রোভাইডারের raw ত্রুটি-বার্তা দেখানোর লাইন — "404: models/…" জাতীয় আসল
 * নির্ণয়-তথ্য; সেন্টিনেল কোড হলে খালি স্ট্রিং (দেখানোর কিছু নেই)।
 */
export function rawProviderLine(error: string | undefined, label: string): string {
  if (!error || RAW_SKIP.has(error)) return '';
  return `${label} ${error}`;
}

export interface AiTextResult {
  ok: boolean;
  markdown?: string;
  /** সার্ভারের কাঁচা টেক্সট ফিল্ড */
  text?: string;
  demo?: boolean;
  error?: string;
  hintKey?: string;
  /** সার্ভারের বাড়তি ব্যাখ্যা (যেমন 404-এ চেষ্টা করা ঠিকানা) */
  detail?: string;
  /** সার্ভার নিকটতম সঠিক মডেলে স্বয়ংক্রিয় সংশোধন করলে — কোনটিতে */
  fixedModel?: string;
}

async function callTextApi(opts: {
  prompt: string;
  system: string;
  imageDataUrl?: string | null;
}): Promise<AiTextResult> {
  const config = useAiStore.getState().config;
  const preset = providerPreset(config.provider);
  // সম্পূর্ণ ব্যবহারযোগ্য কনফিগই BYOK — অসম্পূর্ণ হলে কি অব্যবহৃত থেকে ডেমোতে চলে যেত
  const baseUrl = (config.baseUrl || preset.baseUrl).trim();
  const model = (config.model || preset.model || preset.visionModel).trim();
  const hasKey = !!(config.apiKey.trim() && baseUrl && model);
  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(200_000), // সার্ভার hard-cap ১৮০সে — ক্লায়েন্টে ঢিলেঢালা সীমা
      body: JSON.stringify({
        prompt: opts.prompt,
        system: opts.system,
        imageDataUrl: opts.imageDataUrl ?? null,
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
    const data = (await res.json()) as AiTextResult;
    // স্বয়ং-নিরাময়: প্রোভাইডারের পরামর্শমতো সঠিক মডেলে চলে গেলে সেটাই সেভ —
    // পরের কলগুলো সরাসরি সঠিক মডেলে যায় (404 আর দেখা যায় না)
    if (data.ok && data.fixedModel) {
      useAiStore.getState().setConfig({ model: data.fixedModel });
    }
    return data;
  } catch (err) {
    const name = (err as Error)?.name;
    if (name === 'TimeoutError' || name === 'AbortError') {
      return { ok: false, error: 'TIMEOUT_ERROR', hintKey: 'ai.err.timeout' };
    }
    return { ok: false, error: 'NETWORK', hintKey: 'ai.err.network' };
  }
}

export interface SelectionAiOptions {
  mode: SelectionModeDef;
  selection: string;
  custom?: string;
  imageDataUrl?: string | null;
  tableContext?: string;
  /** প্রেক্ষাপট পুরো পেজ কি না (প্রম্পটে স্পষ্ট বলা হয়) */
  pageScope?: boolean;
}

/** সিলেকশন-ট্রান্সফর্ম চালানো → Markdown উত্তর */
export async function runSelectionAi(opts: SelectionAiOptions): Promise<AiTextResult> {
  // সার্ভার ২৪k ক্যাপ — সিস্টেম/মোড়ানো-প্রম্পটের জায়গা রেখে সিলেকশন ২০k-তে সীমিত
  // (সার্ভারের "Prompt too long" এড়িয়ে যা আছে সেটাই কাজ করে)
  const sel = opts.selection.length > 20_000 ? `${opts.selection.slice(0, 20_000)}…` : opts.selection;
  const base = opts.mode.buildPrompt(sel, opts.custom);
  const scopeLine = opts.pageScope
    ? 'নিচে বইয়ের একটি সম্পূর্ণ পেজের কনটেন্ট দেওয়া হলো (মার্কডাউন আকারে) — পুরো পেজটির প্রেক্ষাপট মাথায় রেখে কাজ করো।'
    : 'নিচে বইয়ের নির্বাচিত অংশটি দেওয়া হলো।';
  // image-explain মোড সিলেকশন/পেজ-প্রেক্ষাপট ব্যবহারই করে না — ভুয়া scopeLine মিথ্যা বলত
  const usesContext = opts.mode.id !== 'image-explain';
  const prompt = opts.tableContext
    ? `এটি বইয়ের একটি টেবিল (Markdown সারি):\n---\n${opts.tableContext}\n---\n\n${base}\n\nউত্তরে পুরো টেবিলটি Markdown পাইপ-টেবিল হিসেবে ফেরত দাও।`
    : usesContext
      ? `${scopeLine}\n\n${base}\n\nউত্তর শুধু চূড়ান্ত Markdown কনটেন্ট হবে।`
      : `${base}\n\nউত্তর শুধু চূড়ান্ত Markdown কনটেন্ট হবে।`;
  const res = await callTextApi({
    prompt,
    system: AI_EDIT_SYSTEM,
    imageDataUrl: opts.imageDataUrl ?? null,
  });
  if (!res.ok) return res;
  const md = (res.markdown ?? res.text ?? '').trim();
  if (!md) return { ok: false, error: 'EMPTY_RESPONSE', hintKey: 'ai.err.empty' };
  return { ok: true, markdown: md, demo: res.demo, fixedModel: res.fixedModel };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/** চ্যাট বার্তা পাঠানো (সম্পূর্ণ কথোপকথন প্রেক্ষাপটসহ) */
export async function runChatAi(opts: {
  messages: ChatMessage[];
  imageDataUrl?: string | null;
}): Promise<AiTextResult> {
  const transcript = opts.messages
    .slice(-12) // শেষ ১২ বার্তা — টোকেন সাশ্রয় ও দ্রুত উত্তর
    .map((m) => `${m.role === 'user' ? 'লেখক' : 'আপনি (AI)'}: ${m.content}`)
    .join('\n\n---\n\n');
  const prompt = `কথোপকথন এখন পর্যন্ত:\n\n${transcript}\n\n---\n\nশেষ "লেখক"-বার্তার উত্তর দাও (চলতি কথোপকথনের ধারাবাহিকতায়)।`;
  return callTextApi({
    prompt,
    system: AI_CHAT_SYSTEM,
    imageDataUrl: opts.imageDataUrl ?? null,
  });
}

// ─── নিরাপদ Markdown → HTML ───

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** ইনলাইন সিনট্যাক্স (প্রি-escaped টেক্সটে): **bold** *em* `code` [link](url) */
function inline(md: string): string {
  let s = md;
  // লিংক — শুধু http(s) অনুমোদিত, নইলে সাদামাটা টেক্সট
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) => {
    const safe = /^(https?:\/\/)/i.test(href)
      ? href.replace(/"/g, '%22')
      : null;
    return safe ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

/**
 * Markdown → এডিটর-উপযোগী HTML (নিরাপদ)।
 * সমর্থিত: h2/h3/h4, p, ul/ol, পাইপ-টেবিল, blockquote, hr, ফেন্সড কোড, ইনলাইন।
 */
export function markdownToHtml(mdRaw: string): string {
  const md = (mdRaw ?? '').replace(/\r\n/g, '\n').trim();
  if (!md) return '';

  // ফেন্সড কোড আগে আলাদা করা
  const codeBlocks: string[] = [];
  const withPlaceholders = md.replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, code: string) => {
    codeBlocks.push(code);
    return `\u0000CODE${codeBlocks.length - 1}\u0000`;
  });

  const lines = withPlaceholders.split('\n');
  const out: string[] = [];
  let para: string[] = [];
  let list: { type: 'ul' | 'ol'; items: string[] } | null = null;
  let table: string[][] | null = null;

  const flushPara = () => {
    if (para.length) {
      out.push(`<p>${inline(escapeHtml(para.join(' ')))}</p>`);
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      out.push(`<${list.type}>${list.items.map((it) => `<li>${inline(escapeHtml(it))}</li>`).join('')}</${list.type}>`);
      list = null;
    }
  };
  const flushTable = () => {
    if (table && table.length) {
      const [head, ...body] = table;
      const th = head.map((c) => `<th>${inline(escapeHtml(c))}</th>`).join('');
      const trs = body
        .filter((r) => !r.every((c) => /^[-: ]*$/.test(c) && c.length > 0))
        .map((r) => `<tr>${r.map((c) => `<td>${inline(escapeHtml(c))}</td>`).join('')}</tr>`)
        .join('');
      out.push(`<table><tbody><tr>${th}</tr>${trs}</tbody></table>`);
    }
    table = null;
  };
  const flushAll = () => {
    flushPara();
    flushList();
    flushTable();
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // কোড প্লেসহোল্ডার
    const codeMatch = line.match(/^\u0000CODE(\d+)\u0000$/);
    if (codeMatch) {
      flushAll();
      out.push(`<pre><code>${escapeHtml(codeBlocks[Number(codeMatch[1])] ?? '')}</code></pre>`);
      continue;
    }

    // টেবিল সারি
    if (/^\s*\|.*\|\s*$/.test(line)) {
      flushPara();
      flushList();
      const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
      if (!table) table = [cells];
      else table.push(cells);
      continue;
    }
    flushTable();

    if (!line.trim()) {
      flushAll();
      continue;
    }

    // হেডিং
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      flushAll();
      const level = Math.min(h[1].length + 1, 4); // # → h2, ## → h3 …
      out.push(`<h${level}>${inline(escapeHtml(h[2]))}</h${level}>`);
      continue;
    }

    // hr
    if (/^(\s*[-*_]\s*){3,}$/.test(line)) {
      flushAll();
      out.push('<hr>');
      continue;
    }

    // blockquote
    const bq = line.match(/^>\s?(.*)$/);
    if (bq) {
      flushAll();
      out.push(`<blockquote><p>${inline(escapeHtml(bq[1]))}</p></blockquote>`);
      continue;
    }

    // তালিকা
    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul) {
      flushPara();
      flushTable();
      if (!list || list.type !== 'ul') {
        flushList();
        list = { type: 'ul', items: [] };
      }
      list.items.push(ul[1]);
      continue;
    }
    if (ol) {
      flushPara();
      flushTable();
      if (!list || list.type !== 'ol') {
        flushList();
        list = { type: 'ol', items: [] };
      }
      list.items.push(ol[1]);
      continue;
    }

    flushList();
    para.push(line.trim());
  }
  flushAll();

  // সারি বিভাজন যেখানে আলাদা প্যারা দরকার — প্যারা ফ্লাশ সামলে নিয়েছে
  return out.join('');
}

/** এডিটর টেবিল → Markdown পাইপ-রো (AI প্রেক্ষাপটের জন্য) */
export function tableRowsToMarkdown(rows: string[][]): string {
  return rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
}

// ─── পুরো পেজ → Markdown (AI-কে সম্পূর্ণ পেজ-প্রেক্ষাপট দিতে) ───

export const PAGE_MD_CAP = 12_000;

/** এডিটরের পুরো পেজ কনটেন্ট পাঠযোগ্য Markdown-এ রূপ দেওয়া (AI প্রেক্ষাপট) */
export function pageToMarkdown(editor: Editor, cap = PAGE_MD_CAP): string {
  const lines: string[] = [];

  const tableToMd = (table: PMNode) => {
    const rows: string[][] = [];
    table.forEach((row) => {
      const cells: string[] = [];
      row.forEach((cell) => cells.push(cell.textContent.trim().replace(/\|/g, '।')));
      rows.push(cells);
    });
    if (!rows.length) return;
    const width = Math.max(...rows.map((r) => r.length));
    const norm = rows.map((r) => {
      const c = [...r];
      while (c.length < width) c.push('');
      return c;
    });
    const [head, ...body] = norm;
    lines.push(`| ${head.join(' | ')} |`);
    lines.push(`| ${head.map(() => '---').join(' | ')} |`);
    for (const r of body) lines.push(`| ${r.join(' | ')} |`);
    lines.push('');
  };

  const walk = (node: PMNode): void => {
    switch (node.type.name) {
      case 'heading': {
        const level = Math.min(Math.max(Number(node.attrs.level ?? 2), 1), 6);
        lines.push(`${'#'.repeat(level)} ${node.textContent.trim()}`, '');
        break;
      }
      case 'paragraph':
        if (node.textContent.trim()) lines.push(node.textContent.trim(), '');
        break;
      case 'bulletList':
        node.forEach((li) => {
          const t = li.textContent.trim();
          if (t) lines.push(`- ${t}`);
        });
        lines.push('');
        break;
      case 'orderedList': {
        let i = 1;
        node.forEach((li) => {
          const t = li.textContent.trim();
          if (t) lines.push(`${i++}. ${t}`);
        });
        lines.push('');
        break;
      }
      case 'blockquote':
        node.forEach((p) => {
          if (p.textContent.trim()) lines.push(`> ${p.textContent.trim()}`);
        });
        lines.push('');
        break;
      case 'codeBlock':
        lines.push('```', node.textContent, '```', '');
        break;
      case 'table':
        tableToMd(node);
        break;
      default: {
        // ধারক নোড (doc, callout, designBox…) — সন্তানদের হাঁটা
        node.forEach((child) => walk(child));
      }
    }
  };

  try {
    walk(editor.state.doc as unknown as PMNode);
  } catch {
    // যেকোনো অপ্রত্যাশিত নোড-কাঠামোয় সাধ্যমতো লেখা ফেরত
    try {
      return editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n', ' ').slice(0, cap);
    } catch {
      return '';
    }
  }
  const md = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  return md.length > cap ? `${md.slice(0, cap)}…` : md;
}
