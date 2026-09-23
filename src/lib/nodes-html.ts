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
  box: { border: '#475569', fill: 'transparent', bstyle: 'solid', bwidth: 2 },
  rounded: { border: '#4f46e5', fill: 'rgba(79,70,229,0.05)', bstyle: 'solid', bwidth: 2 },
  pill: { border: '#0d9488', fill: 'rgba(13,148,136,0.07)', bstyle: 'solid', bwidth: 2 },
  dashed: { border: '#d97706', fill: 'transparent', bstyle: 'dashed', bwidth: 2 },
  double: { border: '#b91c1c', fill: 'transparent', bstyle: 'double', bwidth: 4 },
  shaded: { border: '#64748b', fill: 'rgba(100,116,139,0.10)', bstyle: 'solid', bwidth: 1 },
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

export function buildTocHtml(entriesJson: string, title = 'সূচিপত্র'): string {
  return `<div class="toc-block" data-title="${escapeAttr(title)}" data-entries="${escapeAttr(entriesJson)}"></div>`;
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
