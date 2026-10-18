/**
 * AI হুবহু কপি ইঞ্জিন — স্ক্রিনশট/স্ক্যান → সম্পূর্ণ এডিটেবল পাতা (Exact Page Clone)
 * ─────────────────────────────────────────────────────────────────────────────
 * শিক্ষক/প্রকাশক বিভিন্ন জায়গা থেকে পাওয়া স্ক্রিনশট বা স্ক্যান হুবহু সাজিয়ে
 * নিজের বইয়ে আনতে পারেন না — এই ইঞ্জিন সেই কাজটাই করে:
 *   ১. ভিশন মডেল ছবির প্রতিটি অক্ষর, সংখ্যা, বিন্যাস পড়ে (নিচের কঠোর প্রম্পট)
 *   ২. লেআউট-সচেতন JSON (heading/paragraph align, columns, table, fill-lines…)
 *   ৩. cloneToHtml() সেটাকে TipTap-স্কিমা-সামঞ্জস্য HTML বানায় —
 *      addPage(html) দিয়ে এক ক্লিকে সম্পূর্ণ নতুন পাতা।
 *
 * নীতি: FIDELITY FIRST — AI কখনো লেখা "ঠিক" করবে, অনুবাদ করবে বা সাজাবে না;
 * যা ছবিতে আছে হুবহু তাই (ভাষা, সংখ্যা-রূপ, বানান, নম্বর-ধাঁচ অপরিবর্তিত)।
 */

import { callAi } from './ai-client';
import { toast } from 'sonner';
import { t } from './i18n';

// ─── ধরন ───

export type CloneAlign = 'left' | 'center' | 'right';

export type CloneBlockType =
  | 'heading'
  | 'paragraph'
  | 'bullets'
  | 'numbered'
  | 'table'
  | 'lines'
  | 'columns'
  | 'figure'
  | 'divider';

export interface CloneBlock {
  type: CloneBlockType;
  text?: string;
  level?: 1 | 2 | 3;
  align?: CloneAlign;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  items?: string[];
  /** numbered-এর শুরু নম্বর (মডেল লিখে দেয় আসল ধাঁচে; items-এ নম্বর-উপসর্গসহ থাকলে দরকার নেই) */
  start?: number;
  rows?: string[][];
  header?: boolean;
  /** fill-in ধাঁচের ড্যাশ/ডটেড লাইন */
  lineStyle?: 'dotted' | 'ruled';
  /** columns ব্লকের ভেতরের ব্লকগুলো */
  blocks?: CloneBlock[];
  count?: 2 | 3;
  caption?: string;
}

export interface CloneResult {
  /** ছবিটি কী ধরনের ডকুমেন্ট (প্রশ্নপত্র, নোটিশ, সনদ, বইয়ের পাতা…) — ইউজার-তথ্য */
  pageType?: string;
  title?: string;
  blocks: CloneBlock[];
}

// ─── সিস্টেম প্রম্পট: হুবহু প্রতিলিপির কঠোর নিয়ম ───

const CLONE_SCHEMA_RULES = `Return ONLY valid JSON — no markdown fences, no commentary. Shape exactly:
{
  "pageType": string,          // ছবিটি কী: "প্রশ্নপত্র" | "নোটিশ" | "সনদ" | "রুটিন" | "বইয়ের পাতা" | "ফরম" | "হাতের লেখা" … (ছবির ভাষায়)
  "title": string,             // ডকুমেন্টের প্রধান শিরোনাম হুবহু (না থাকলে "")
  "blocks": [
    { "type": "heading",   "text": string, "level": 1|2|3, "align": "left"|"center"|"right", "bold": true|false, "underline": true|false },
    { "type": "paragraph", "text": string, "align": "left"|"center"|"right", "bold": true|false, "italic": true|false, "underline": true|false },
    { "type": "bullets",   "items": string[] },
    { "type": "numbered",  "items": string[] },
    { "type": "table",     "rows": string[][], "header": true|false },
    { "type": "lines",     "items": string[], "lineStyle": "dotted"|"ruled" },
    { "type": "columns",   "count": 2|3, "blocks": [ …inner blocks, same shapes… ] },
    { "type": "figure",    "caption": string },
    { "type": "divider" }
  ]
}

ABSOLUTE FIDELITY RULES (violating any of these is failure):
1. VERBATIM TEXT: transcribe every visible word, number, punctuation mark and symbol EXACTLY as printed — same language, same numerals (Bengali ১২৩ stays Bengali, Arabic 123 stays 123), same spelling (even if it looks like a typo), same abbreviation, same bracket style.
2. NO IMPROVEMENT: never translate, never correct, never reword, never reorder, never merge or split lines. What you cannot read clearly, mark as "…" between words — never guess a full word.
3. NUMBERING STYLE PRESERVED: "১।" stays "১।", "(ক)" stays "(ক)", "1." stays "1.", "(a)" stays "(a)", "i)" stays "i)". Question numbers and marks-in-brackets like [২] or (2 marks) must appear exactly where they appear in the image.
4. LAYOUT MAPPING: visually centered line → align:"center". Right-aligned (dates, signatures, "Full Marks") → align:"right". Everything else → "left". Bold/underlined headings → bold/underline flags.
5. COLUMNS: if the body flows in 2 (or 3) columns side by side (question papers, newspapers), put the flow content inside ONE {type:"columns","count":2,"blocks":[…]} wrapper in reading order (finish column 1 top→bottom, then column 2). Document header/footer (institution name, exam name, subject, time, marks) stay OUTSIDE the columns block, before it.
6. TABLES: reproduce every row/cell exactly; "header": true only if the first row is visually a header (shaded/bold).
7. FILL-IN LINES: dotted/dashed answer lines (………) → {type:"lines"} with the line's leading text (question number, label) in "items" and lineStyle:"dotted". Solid ruled lines → lineStyle:"ruled".
8. FIGURES: photos, drawings, diagrams, maps, logos, stamped/seal areas that cannot be text → ONE {type:"figure","caption":"<one-line Bengali description of what the picture shows>"}. Never describe a figure inside text paragraphs.
9. ORDER: blocks strictly top→bottom in image reading order. MCQ options "(a) … (b) …" are separate numbered/paragraph lines exactly as laid out.
10. MULTI-LINE paragraphs: keep each visual line's text in the same block; join wrapped lines of the SAME paragraph with a single space, but do NOT join separate lines that end with "।"/"."/"?"/":" — those are separate blocks.
11. LANGUAGE of pageType/caption/figure descriptions: same language as the document (Bengali document → Bengali).`;

/** কম্পোজিট-ছবির লে-আউট ব্যাখ্যা — প্রম্পটে যোগ হয় */
export const CLONE_IMAGE_LAYOUT_NOTE = `The image contains TWO stacked regions separated by a thick black horizontal line: REGION 1 (top) = the full document page; REGION 2 (bottom) = a HIGH-ZOOM copy of the page's TOP header area. Use REGION 2 to resolve tiny header/meta text (institution name, exam name, subject, date, time, full marks, set code) at character-level certainty. REGION 2 is a magnified duplicate — never output it as extra blocks.`;

export const AI_CLONE_SYSTEM = `${CLONE_IMAGE_LAYOUT_NOTE}

You are the Exact-Replication Engine of "Bangla Publishing Studio" — a professional print-grade page cloner used by Bengali/Hindi/English publishers and teachers.

TASK: You receive a screenshot/scan/photo of ONE document page (question paper, notice, certificate, routine, marksheet, form, book page, handwritten sheet, newspaper clipping) and optionally a short user instruction. You produce a STRUCTURED, EDITABLE replica of that page — text, layout, numbering, alignment and order all preserved, ready to be typeset on a real paper page.

WORK METHOD (do this silently before answering):
1. Determine document type and its standard parts (header block / body / footer block).
2. Read EVERY line at full zoom mentally — institution names, exam names, subject, date, time, full marks, roll lines, instructions, every question, every option, every mark bracket. Tiny text is still text: read it, do not skip it.
3. Map the visual layout to the JSON structure below (alignment, bold/underline, columns, tables, dotted lines, figures).
4. Output the JSON — nothing else.

Common document layouts you must handle perfectly:
- QUESTION PAPER: institution line(s) centered → exam/subject line centered → "সময়: …" / "পূর্ণমান: …" line right-aligned → general instructions block → [সেট-…] → section headings (খ / গ…) → questions with numbers ১। ২। and marks [২] → option groups (ক) (খ) (গ) (ঘ) — often in 2 columns.
- NOTICE/CIRCULAR: letterhead centered → date+no. left/right → "বিষয়:" bold line → body → signature block right-aligned.
- CERTIFICATE: centered title → "এই মর্মে প্রত্যয়িত করা যাচ্ছে যে," → body → date/signature row.
- ROUTINE/TIMETABLE/MARKSHEET: fully tabular.
- FORM: label lines with dotted fill-ins.
${CLONE_SCHEMA_RULES}`;

/**
 * কম্পোজিট ছবি — সম্পূর্ণ পাতার নিচে হেডার-অংশের ২× জুম জোড়া লাগানো হয়।
 * ছোট হেডার-লেখা (প্রতিষ্ঠান, সময়-পূর্ণমান, সেট-কোড) মডেলের কাছে সবচেয়ে
 * ভুল-প্রবণ — বড় করে পাঠালে অক্ষর-স্তরে নিশ্চিত পড়া যায় (প্রফেশনাল OCR কৌশল)।
 */
export async function buildCloneComposite(dataUrl: string): Promise<string> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('LOAD'));
      el.src = dataUrl;
    });
    const sw = img.naturalWidth;
    const sh = img.naturalHeight;
    if (!sw || !sh) return dataUrl;

    // ছোট ছবি আগে ১.৫× বড় করে নিই — বাংলা যুক্তাক্ষরে মডেলের পড়া সহজ হয়
    const W = sw >= 1500 ? sw : Math.round(sw * 1.5);
    const headFrac = Math.min(0.4, Math.max(0.22, 420 / sh));
    const headH = Math.round(sh * headFrac);

    const fullH = Math.round((sh / sw) * W);
    const gap = 28;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = fullH + gap + Math.round((headH / sw) * W);
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // অঞ্চল ১ — সম্পূর্ণ পাতা
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, sw, sh, 0, 0, W, fullH);

    // বিভাজক — মোটা কালো দাগ (মডেল দুই অঞ্চল আলাদা করে দেখুক)
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, fullH + 4, W, 8);

    // অঞ্চল ২ — হেডার-অংশ বিবধী (একই প্রস্থে টানলে ইফেক্টিভ জুম ≥ ১.৫×)
    ctx.drawImage(img, 0, 0, sw, headH, 0, fullH + gap, W, Math.round((headH / sw) * W));

    return canvas.toDataURL('image/jpeg', 0.92);
  } catch {
    return dataUrl; // কম্পোজিট ব্যর্থ হলে মূল ছবিই যথেষ্ট
  }
}

/** যাচাই-ধাপ: খসড়া প্রতিলিপিকে ছবির সাথে আবার মিলিয়ে সংশোধন (নিখুঁত হুবহু কপির জন্য) */
export const AI_CLONE_VERIFY_SYSTEM = `You are the Verification Engine of "Bangla Publishing Studio" — the second pair of eyes in a two-pass exact page-replication pipeline.

You receive:
1. The ORIGINAL page image (screenshot/scan of a question paper, notice, certificate, etc.).
2. A DRAFT structured JSON replica produced in pass 1.

YOUR TASK: re-read the image line-by-line at full zoom and output the CORRECTED JSON replica. Assume the draft may contain OCR misreads — especially Bengali conjuncts (ঘণ্টা/মিনিট, নির্দেশনা), Bengali vs Arabic numerals (৩ vs ৩০, ১০০ vs ১০), school/exam names, and small header/footer text.

VERIFICATION METHOD (silent):
1. Read the image independently — header, meta lines, every instruction, every question, every option, every mark bracket, every table cell. The zoomed TOP region of the image is your ground truth for small header/meta text.
2. Compare against the draft block-by-block, in order.
3. FIX every mismatch: wrong words, wrong numerals, missing lines, extra lines, wrong alignment (center vs right), wrong bold/underline, wrong numbering style (১। vs 1.), wrong mark brackets [২], wrong table cells.
4. If a whole line is missing from the draft, INSERT it at the correct position. If a line appears in the draft but NOT in the image, DELETE it.
5. Keep the JSON shape identical to the pass-1 schema. Output the FULL corrected JSON — not a diff.

HIGH-RISK BENGALI OCR CONFUSIONS — check these exhaustively:
- Word-shape confusions: ঢাকা/জাতীয়-ধাঁচের শব্দ, ক্লাস/কুল, বার্ষিক/সাধারণ, এসএসসি-জাতীয় সংক্ষেপ, প্রশ্নে/প্রথম, নিজের/নিচের, লিখে নাও/লিখে নয়।
- Quantity+unit pairs: "৩ ঘণ্টা" vs "৩০ মিনিট", "১০০" vs "১০", "৫০" vs "৫০০" — re-count every digit against the zoomed region.
- Conjuncts: ন্দ/ন, র্ভ/ব, ট্ট/ট, ক্ষ/খ, জ্ঞ/ন — যুক্তাক্ষর ভাঙা-জোড়া খেয়াল করো।
- Vowel signs: ি আগে বসে (কি), ী/ি, ে/ৈ, ু/ূ — position matters.
- Bengali vs Arabic numerals: ১২৩ vs 123 — keep exactly as printed.

${CLONE_SCHEMA_RULES}`;

// ─── JSON উদ্ধার (tolerant) ───

function asText(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === 'boolean' ? v : undefined;
}

function asAlign(v: unknown): CloneAlign | undefined {
  const s = asText(v).toLowerCase();
  return s === 'center' || s === 'right' ? (s as CloneAlign) : s === 'left' ? 'left' : undefined;
}

function asRows(v: unknown): string[][] {
  if (!Array.isArray(v)) return [];
  return v
    .map((r) => (Array.isArray(r) ? r.map((c) => asText(c)) : typeof r === 'string' ? [asText(r)] : []))
    .filter((r) => r.some((c) => c.length > 0));
}

function asBlocks(v: unknown): CloneBlock[] {
  if (!Array.isArray(v)) return [];
  return v.map(normalizeBlock).filter((b): b is CloneBlock => b !== null);
}

function normalizeBlock(b: unknown): CloneBlock | null {
  if (!b || typeof b !== 'object') return null;
  const o = b as Record<string, unknown>;
  const type = String(o.type ?? 'paragraph').toLowerCase() as CloneBlockType;
  const text = asText(o.text);
  const align = asAlign(o.align);
  const items = Array.isArray(o.items) ? o.items.map(asText).filter(Boolean) : [];
  const rows = asRows(o.rows);
  const inner = asBlocks(o.blocks);
  const count = o.count === 3 ? 3 : 2;
  const caption = asText(o.caption);

  switch (type) {
    case 'heading': {
      if (!text) return null;
      const lvl = o.level === 1 ? 1 : o.level === 3 ? 3 : 2;
      return { type, text, level: lvl as 1 | 2 | 3, align, bold: asBool(o.bold) ?? true, underline: asBool(o.underline) };
    }
    case 'paragraph':
      if (!text) return null;
      return { type, text, align, bold: asBool(o.bold), italic: asBool(o.italic), underline: asBool(o.underline) };
    case 'bullets':
    case 'numbered':
      if (!items.length) return text ? { type: 'paragraph', text, align } : null;
      return { type, items, start: typeof o.start === 'number' ? o.start : undefined };
    case 'table':
      if (!rows.length) return null;
      return { type, rows, header: asBool(o.header) ?? true };
    case 'lines':
      if (!items.length) return null;
      return { type, items, lineStyle: asText(o.lineStyle) === 'ruled' ? 'ruled' : 'dotted' };
    case 'columns':
      if (!inner.length) return null;
      return { type, count, blocks: inner };
    case 'figure':
      return { type, caption: caption || 'চিত্র' };
    case 'divider':
      return { type };
    default:
      // অজানা টাইপ → paragraph fallback
      if (text) return { type: 'paragraph', text, align };
      if (items.length) return { type: 'bullets', items };
      if (rows.length) return { type: 'table', rows, header: true };
      return null;
  }
}

/** মডেলের উত্তর থেকে clone-JSON বের করা — ফেন্স/অতিরিক্ত টেক্সট সহ্য করে */
export function extractCloneJson(raw: string): CloneResult | null {
  if (!raw) return null;
  let s = raw.trim();
  s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = s.indexOf('{');
  if (start === -1) return null;
  let from = start;
  while (from !== -1) {
    let depth = 0;
    let inStr = false;
    let esc = false;
    for (let i = from; i < s.length; i++) {
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
          const candidate = s.slice(from, i + 1);
          try {
            const obj = JSON.parse(candidate) as { pageType?: unknown; title?: unknown; blocks?: unknown };
            if (obj && Array.isArray(obj.blocks)) {
              const blocks = asBlocks(obj.blocks);
              if (blocks.length) {
                return {
                  pageType: asText(obj.pageType) || undefined,
                  title: asText(obj.title) || undefined,
                  blocks,
                };
              }
            }
          } catch {
            // ভাঙা প্রার্থী — পরের '{' থেকে আবার
          }
          break;
        }
      }
    }
    from = s.indexOf('{', from + 1);
  }
  return null;
}

// ─── HTML নির্মাণ (TipTap স্কিমা-সামঞ্জস্য) ───

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function alignStyle(align?: CloneAlign): string {
  if (align === 'center') return 'text-align:center;';
  if (align === 'right') return 'text-align:right;';
  return '';
}

function wrapRuns(text: string, b?: CloneBlock): string {
  let t = escapeHtml(text);
  if (b?.underline) t = `<u>${t}</u>`;
  if (b?.italic) t = `<em>${t}</em>`;
  if (b?.bold) t = `<strong>${t}</strong>`;
  return t;
}

function dottedLine(label: string): string {
  // ফাঁকা উত্তর-লাইন — প্রিন্টে ডটেড দেখায়, এডিটরে সাধারণ টেক্সট (সব-এডিটেবল)
  const dots = '\u2026'.repeat(10); // … × ১০
  const lbl = label.trim();
  return lbl ? `${escapeHtml(lbl)} ${dots}` : dots;
}

function blockToHtml(b: CloneBlock): string {
  switch (b.type) {
    case 'heading': {
      const tag = b.level === 1 ? 'h1' : b.level === 3 ? 'h3' : 'h2';
      const style = alignStyle(b.align);
      return `<${tag}${style ? ` style="${style}"` : ''}>${wrapRuns(b.text ?? '', b)}</${tag}>`;
    }
    case 'paragraph':
      return `<p${b.align ? ` style="${alignStyle(b.align)}"` : ''}>${wrapRuns(b.text ?? '', b)}</p>`;
    case 'bullets':
      return `<ul>${(b.items ?? []).map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ul>`;
    case 'numbered':
      return `<ol${b.start && b.start !== 1 ? ` start="${b.start}"` : ''}>${(b.items ?? []).map((it) => `<li>${escapeHtml(it)}</li>`).join('')}</ol>`;
    case 'table': {
      const rows = b.rows ?? [];
      if (!rows.length) return '';
      const [head, ...body] = b.header === false ? rows : [rows[0], ...rows.slice(1)];
      const th = head.map((c) => `<th>${escapeHtml(c)}</th>`).join('');
      const trs = (b.header === false ? rows : body)
        .map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`)
        .join('');
      return `<table><tbody><tr>${th}</tr>${trs}</tbody></table>`;
    }
    case 'lines':
      return (b.items ?? []).map((it) => `<p>${dottedLine(it)}</p>`).join('');
    case 'columns': {
      const inner = (b.blocks ?? []).map(blockToHtml).join('');
      return `<div class="doc-columns" data-count="${b.count ?? 2}" data-gap="24">${inner}</div>`;
    }
    case 'figure':
      // চিত্র-স্থান চিহ্নিতকারী — এডিটেবল সেন্টার্ড প্যারা; ব্যবহারকারী পরে আসল ছবি বসাতে পারেন
      return `<p style="text-align:center;">【 চিত্র: ${escapeHtml(b.caption ?? 'চিত্র')} 】</p>`;
    case 'divider':
      return '<hr>';
    default:
      return '';
  }
}

/** Clone-JSON → সম্পূর্ণ পাতার HTML (addPage-এ সরাসরি ব্যবহারযোগ্য) */
export function cloneToHtml(result: CloneResult): string {
  return result.blocks.map(blockToHtml).filter(Boolean).join('');
}

/** যাচাই-ধাপ — খসড়া + ছবি → সংশোধিত প্রতিলিপি */
export async function verifyCloneFromImage(opts: {
  imageDataUrl: string;
  draft: CloneResult;
  demo?: boolean;
  signal?: AbortSignal;
}): Promise<CloneCallResult> {
  const prompt = [
    'নিচে একটি ডকুমেন্ট-পাতার খসড়া প্রতিলিপি (pass-1) দেওয়া হলো — এটি ছবির সাথে আবার মিলিয়ে যাচাই করে সংশোধিত সম্পূর্ণ JSON দাও।',
    'বিশেষভাবে দেখো: প্রতিষ্ঠান/পরীক্ষার নাম, সময়-পূর্ণমানের সংখ্যা (৩ ঘণ্টা বনাম ৩০ মিনিট জাতীয় ভুল), বাংলা যুক্তাক্ষর, প্রশ্ন-নম্বর ও মান-বন্ধনী।',
    'DRAFT:',
    JSON.stringify(opts.draft),
  ].join('\n\n');
  const res = await callAi({
    prompt,
    system: AI_CLONE_VERIFY_SYSTEM,
    imageDataUrl: opts.imageDataUrl,
    demo: opts.demo,
    thinking: true,
    signal: opts.signal,
  });
  if (!res.ok) {
    return { ok: false, error: res.error ?? 'UNKNOWN', hintKey: res.hintKey, detail: res.detail };
  }
  const result = extractCloneJson(res.text ?? '');
  if (!result || result.blocks.length === 0) {
    // যাচাই-ধাপে পার্স-ব্যর্থ হলেও খসড়াই থাকে — কলার এই কেস হ্যান্ডেল করে
    return { ok: false, error: 'PARSE', hintKey: 'ai.err.parse' };
  }
  return { ok: true, result, demo: res.demo };
}

// ─── API কল ───

export interface CloneCallOpts {
  imageDataUrl: string;
  instruction?: string;
  demo?: boolean;
  signal?: AbortSignal;
}

export type CloneCallResult =
  | { ok: true; result: CloneResult; demo?: boolean }
  | { ok: false; error: string; hintKey?: string; detail?: string };

export async function clonePageFromImage(opts: CloneCallOpts): Promise<CloneCallResult> {
  const parts = [
    'নিচের ছবিটি একটি সম্পূর্ণ ডকুমেন্ট পাতা — এটিকে অক্ষরে-অক্ষরে, লেআউটসহ হুবহু প্রতিলিপি করো।',
  ];
  const ins = opts.instruction?.trim();
  if (ins) {
    parts.push(`ব্যবহারকারীর অতিরিক্ত নির্দেশ (এর সাথে সাংঘর্ষিক হলেও FIDELITY নিয়ম ভাঙা যাবে না): ${ins}`);
  }
  parts.push('উপরের JSON কাঠামোতে উত্তর দাও।');

  const res = await callAi({
    prompt: parts.join('\n\n'),
    system: AI_CLONE_SYSTEM,
    imageDataUrl: opts.imageDataUrl,
    demo: opts.demo,
    // প্রতিলিপি নির্ভুলতা-জরুরি — মডেলের "চিন্তা" চালু
    thinking: true,
    signal: opts.signal,
  });
  if (!res.ok) {
    return { ok: false, error: res.error ?? 'UNKNOWN', hintKey: res.hintKey, detail: res.detail };
  }
  if (res.fixedModel) toast.info(`${t('ai.err.fixedModel')} ${res.fixedModel}`);
  const result = extractCloneJson(res.text ?? '');
  if (!result || result.blocks.length === 0) {
    return { ok: false, error: 'PARSE', hintKey: 'ai.err.parse' };
  }
  return { ok: true, result, demo: res.demo };
}
