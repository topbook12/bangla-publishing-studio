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

export function buildDividerHtml(style: 'single' | 'double' | 'dotted' | 'flourish'): string {
  return `<hr class="fancy-divider" data-style="${style}" />`;
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
