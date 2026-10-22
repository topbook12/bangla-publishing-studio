/**
 * কাস্টম TipTap নোডগুলোর HTML সিরিয়ালাইজেশন কনট্রাক্ট
 * স্টোরেজ, এক্সপোর্ট (DOCX/HTML) ও প্রিন্ট — সবাই এই কাঠামো ব্যবহার করে।
 */

export function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export type CalloutVariant = 'concept' | 'warning' | 'formula' | 'note';

export const CALLOUT_LABELS: Record<CalloutVariant, string> = {
  concept: 'মূল ধারণা',
  warning: 'সতর্কতা',
  formula: 'সূত্র',
  note: 'নোট',
};

export interface McqData {
  question: string;
  options: [string, string, string, string];
  /** 0-3, -1 = চিহ্নিত নয় */
  answer: number;
  explanation: string;
}

export function buildCalloutHtml(variant: CalloutVariant, title: string, contentHtml: string): string {
  // টাইটেল শুধু data-title attribute-এ থাকে (NodeView/CSS সেটা দেখায়) — কনটেন্টে ডুপ্লিকেট নয়
  return `<div class="callout-box" data-variant="${variant}" data-title="${escapeAttr(title)}">` +
    `${contentHtml || '<p></p>'}</div>`;
}

export function buildMcqHtml(data: McqData): string {
  return `<div class="mcq-block" data-question="${escapeAttr(data.question)}"` +
    ` data-options="${escapeAttr(JSON.stringify(data.options))}"` +
    ` data-answer="${data.answer}"` +
    ` data-explanation="${escapeAttr(data.explanation)}"></div>`;
}

export function buildDividerHtml(style: DividerStyle): string {
  return `<hr class="fancy-divider" data-style="${style}" />`;
}

/** ডিভাইডার স্টাইলসমূহ */
export type DividerStyle = 'single' | 'double' | 'dotted' | 'flourish' | 'stars' | 'cut';

// ─────────────────────── ডিজাইন বক্স (Text Box) ───────────────────────

export type DocBoxVariant = 'box' | 'rounded' | 'pill' | 'dashed' | 'double' | 'shaded' | 'circle';

export interface DocBoxAttrs {
  variant: DocBoxVariant;
  /** বর্ডারের রং (CSS color) */
  border: string;
  /** ভেতরের রং — CSS color বা 'transparent' */
  fill: string;
  bstyle: 'solid' | 'dashed' | 'dotted' | 'double';
  bwidth: number;
}

/** প্রতিটি ভ্যারিয়েন্টের ডিফল্ট চেহারা */
export const DOC_BOX_PRESETS: Record<DocBoxVariant, Omit<DocBoxAttrs, 'variant'>> = {
  box: { border: '#78716c', fill: 'transparent', bstyle: 'solid', bwidth: 2 },
  rounded: { border: '#7f1d1d', fill: 'rgba(127,29,29,0.05)', bstyle: 'solid', bwidth: 2 },
  pill: { border: '#0d9488', fill: 'rgba(13,148,136,0.07)', bstyle: 'solid', bwidth: 2 },
  dashed: { border: '#d97706', fill: 'transparent', bstyle: 'dashed', bwidth: 2 },
  double: { border: '#b91c1c', fill: 'transparent', bstyle: 'double', bwidth: 4 },
  shaded: { border: '#a8a29e', fill: 'rgba(120,113,108,0.10)', bstyle: 'solid', bwidth: 1 },
  circle: { border: '#c026d3', fill: 'rgba(192,38,211,0.05)', bstyle: 'solid', bwidth: 2 },
};

/** বাংলা লেবেল (ইনসার্ট মেনু ও বক্স-টুলবার) */
export const DOC_BOX_LABELS: Record<DocBoxVariant, string> = {
  box: 'সাধারণ বক্স',
  rounded: 'গোলাকার কোণা',
  pill: 'ক্যাপসুল',
  dashed: 'ড্যাশ বর্ডার',
  double: 'ডাবল বর্ডার',
  shaded: 'রঙিন ছায়া',
  circle: 'বৃত্ত',
};

/** বর্ডার স্টাইল অপশন (টুলবার সিলেক্ট) */
export const DOC_BOX_STYLES: Array<{ value: DocBoxAttrs['bstyle']; label: string }> = [
  { value: 'solid', label: 'একক রেখা' },
  { value: 'dashed', label: 'ড্যাশ' },
  { value: 'dotted', label: 'বিন্দু' },
  { value: 'double', label: 'ডাবল' },
];

export function docBoxRadius(variant: DocBoxVariant): string {
  switch (variant) {
    case 'box': return '0px';
    case 'rounded':
    case 'dashed':
    case 'shaded':
      return '12px';
    case 'double': return '6px';
    case 'pill': return '999px';
    case 'circle': return '50%';
  }
}

/**
 * ডিজাইন বক্সের ইনলাইন স্টাইল — NodeView, স্ট্যাটিক প্রিভিউ,
 * HTML এক্সপোর্ট ও DOCX — সবাই একই হেল্পার ব্যবহার করে।
 * কী সমূহ camelCase (React style প্রপ-বান্ধব); CSS স্ট্রিংয়ের জন্য docBoxStyleText()।
 */
export function docBoxInlineStyle(a: Partial<DocBoxAttrs>): Record<string, string> {
  const variant = (a.variant ?? 'rounded') as DocBoxVariant;
  const preset = DOC_BOX_PRESETS[variant] ?? DOC_BOX_PRESETS.rounded;
  const bstyle = a.bstyle || preset.bstyle;
  const bwidth = a.bwidth == null || !Number.isFinite(a.bwidth) ? preset.bwidth : a.bwidth;
  const border = a.border || preset.border;
  const fill = a.fill || preset.fill;
  return {
    borderStyle: bstyle,
    borderWidth: `${bwidth}px`,
    borderColor: border,
    background: fill,
    borderRadius: docBoxRadius(variant),
    padding: '10px 16px',
    margin: '0.55em 0',
    minWidth: '48px',
  };
}

/** camelCase স্টাইল অবজেক্ট → CSS টেক্সট (export-html এর জন্য) */
export function docBoxStyleText(a: Partial<DocBoxAttrs>): string {
  return Object.entries(docBoxInlineStyle(a))
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(';');
}

/** ডিজাইন বক্স HTML নির্মাণ (সরাসরি insertContent-এর জন্য) */
export function buildDesignBoxHtml(attrs: Partial<DocBoxAttrs> & { variant: DocBoxVariant }, contentHtml = '<p></p>'): string {
  const v = attrs.variant;
  const preset = DOC_BOX_PRESETS[v] ?? DOC_BOX_PRESETS.rounded;
  const border = attrs.border ?? preset.border;
  const fill = attrs.fill ?? preset.fill;
  const bstyle = attrs.bstyle ?? preset.bstyle;
  const bwidth = attrs.bwidth ?? preset.bwidth;
  return `<div class="doc-textbox" data-variant="${v}" data-border="${escapeAttr(border)}"` +
    ` data-fill="${escapeAttr(fill)}" data-bstyle="${bstyle}" data-bwidth="${bwidth}">${contentHtml || '<p></p>'}</div>`;
}

export function buildFootnoteHtml(note: string): string {
  return `<sup class="footnote" data-note="${escapeAttr(note)}"></sup>`;
}

// ─────────────────────── মাল্টি-কলাম লেআউট (প্রশ্নপত্র/সংবাদপত্র) ───────────────────────

export const COLUMNS_COUNT_DEFAULT = 2;
export const COLUMNS_GAP_DEFAULT = 24;
/** গ্যাপ প্রিসেট — সরু / মাঝারি / চওড়া (px) */
export const COLUMNS_GAP_PRESETS = { narrow: 16, medium: 24, wide: 40 } as const;
export type ColumnsGapPreset = keyof typeof COLUMNS_GAP_PRESETS;

export type ColumnsRuleStyle = 'solid' | 'double' | 'dashed' | 'dotted';
export type ColumnsFill = 'balance' | 'start';

/** রেখার ধরন অনুযায়ী CSS width — double রেখা ছোট হলে চেনা যায় না, তাই 3px */
export const COLUMNS_RULE_WIDTH: Record<ColumnsRuleStyle, number> = { solid: 1, double: 3, dashed: 1, dotted: 1 };

/** রেখা-স্টাইলের CSS অংশ (currentColor — one-color ink মোডে কালির রঙ পায়) */
export function columnsRuleCss(style: ColumnsRuleStyle): string {
  const width = COLUMNS_RULE_WIDTH[style] ?? 1;
  return `${width}px ${style} currentColor`;
}

export interface ColumnsAttrs {
  /** ১–৪ (১ = সাধারণ এক কলাম — মোড়ক তুলে দেওয়া) */
  count: number;
  /** কলামের মাঝের ফাঁক (px) */
  gap: number;
  /** কলামের মাঝের উল্লম্ব রেখা */
  rule: boolean;
  /** রেখার ধরন (rule=true হলে প্রযোজ্য) */
  ruleStyle: ColumnsRuleStyle;
  /** ভারসাম্য (balance — সব কলাম সমান উচ্চতায়) বা ক্রমিক (start — একটার পর একটা ভরে যায়) */
  fill: ColumnsFill;
  /** প্রথম ব্লক সব কলাম জুড়ে বসে (সাময়িকী-ধাঁচের শিরোনাম) */
  firstSpan: boolean;
}

export const COLUMNS_ATTRS_DEFAULT: ColumnsAttrs = {
  count: COLUMNS_COUNT_DEFAULT,
  gap: COLUMNS_GAP_DEFAULT,
  rule: false,
  ruleStyle: 'solid',
  fill: 'balance',
  firstSpan: false,
};

/** data-attrs → ColumnsAttrs (স্টোরেজ/এক্সপোর্ট/স্ট্যাটিক প্রিভিউ — পুরনো ডকুমেন্টে ফলব্যাকসহ) */
export function parseColumnsAttrs(el: {
  getAttribute(name: string): string | null;
}): ColumnsAttrs {
  const count = Math.min(4, Math.max(1, Math.round(Number(el.getAttribute('data-count')) || COLUMNS_COUNT_DEFAULT)));
  const gap = Math.max(8, Math.min(80, Math.round(Number(el.getAttribute('data-gap')) || COLUMNS_GAP_DEFAULT)));
  const rule = el.getAttribute('data-rule') === '1';
  const ruleStyleRaw = el.getAttribute('data-rule-style');
  const ruleStyle: ColumnsRuleStyle =
    ruleStyleRaw === 'double' || ruleStyleRaw === 'dashed' || ruleStyleRaw === 'dotted' ? ruleStyleRaw : 'solid';
  const fill: ColumnsFill = el.getAttribute('data-fill') === 'start' ? 'start' : 'balance';
  const firstSpan = el.getAttribute('data-first-span') === '1';
  return { count, gap, rule, ruleStyle, fill, firstSpan };
}

/** কলাম ব্লকের ইনলাইন CSS — এডিটর রেন্ডার, স্ট্যাটিক প্রিভিউ, HTML/ফরমা এক্সপোর্ট সবাই এক হেল্পার */
export function columnsStyleText(a: Partial<ColumnsAttrs>): string {
  const count = Math.min(4, Math.max(1, Math.round(Number(a.count) || COLUMNS_COUNT_DEFAULT)));
  const gap = Math.max(8, Math.min(80, Math.round(Number(a.gap) || COLUMNS_GAP_DEFAULT)));
  const ruleStyle: ColumnsRuleStyle =
    a.ruleStyle === 'double' || a.ruleStyle === 'dashed' || a.ruleStyle === 'dotted' ? a.ruleStyle : 'solid';
  const rule = a.rule === true ? `column-rule:${columnsRuleCss(ruleStyle)};` : '';
  const fill = a.fill === 'start' ? 'auto' : 'balance';
  return `column-count:${count};column-gap:${gap}px;column-fill:${fill};${rule}`;
}

/** কলাম ব্লক HTML নির্মাণ (টেমপ্লেট/AI/insertContent-এর জন্য) */
export function buildColumnsHtml(attrs: Partial<ColumnsAttrs>, contentHtml = '<p></p>'): string {
  const merged = { ...COLUMNS_ATTRS_DEFAULT, ...attrs };
  const count = Math.min(4, Math.max(1, Math.round(Number(merged.count) || COLUMNS_COUNT_DEFAULT)));
  const gap = Math.max(8, Math.min(80, Math.round(Number(merged.gap) || COLUMNS_GAP_DEFAULT)));
  const rule = merged.rule ? ` data-rule="1" data-rule-style="${merged.ruleStyle}"` : '';
  const fill = merged.fill === 'start' ? ' data-fill="start"' : '';
  const firstSpan = merged.firstSpan ? ' data-first-span="1"' : '';
  return `<div class="doc-columns" data-count="${count}" data-gap="${gap}"${rule}${fill}${firstSpan}>${contentHtml || '<p></p>'}</div>`;
}

/**
 * TOC ব্লক HTML — manual=true হলে data-manual="true" যুক্ত হয়:
 * ম্যানুয়াল সূচি স্বয়ংক্রিয় স্ক্যান-ইঞ্জিন (useAutoToc) আর কখনো ওভাররাইট করবে না।
 */
export function buildTocHtml(entriesJson: string, title = 'সূচিপত্র', manual = false): string {
  return `<div class="toc-block" data-title="${escapeAttr(title)}" data-entries="${escapeAttr(entriesJson)}"${manual ? ' data-manual="true"' : ''}></div>`;
}

/** MCQ ডেটা পার্স (attribute থেকে) */
export function parseMcqData(el: HTMLElement): McqData {
  let options: string[] = [];
  try {
    const raw = el.getAttribute('data-options') ?? '[]';
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) options = parsed.map(String);
  } catch {
    options = [];
  }
  while (options.length < 4) options.push('');
  const answer = Number(el.getAttribute('data-answer') ?? '-1');
  return {
    question: el.getAttribute('data-question') ?? '',
    options: [options[0] ?? '', options[1] ?? '', options[2] ?? '', options[3] ?? ''] as [string, string, string, string],
    answer: Number.isFinite(answer) ? answer : -1,
    explanation: el.getAttribute('data-explanation') ?? '',
  };
}
