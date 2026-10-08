/**
 * ভেক্টর লাইব্রেরি ক্যাটালগ — সব শিক্ষামূলক SVG ইলাস্ট্রেশন এক জায়গায়।
 *
 * কনটেন্ট ফাইল: vector-physics.ts (৩০), vector-math.ts (৩২), vector-science.ts (২৫),
 * vector-misc.ts (৩৪) — মোট ১২১টি।
 *
 * ব্যবহারকারী: design-ext.tsx (DocFigure নোড — data-vid দিয়ে আবার বের করা যায়),
 * vector-library-dialog.tsx (স্টোর UI), export-docx.ts (DOCX-এ র‍্যাস্টারাইজ)।
 */

import type { VectorCat, VectorDef } from './vector-types';
import { escapeAttr } from './nodes-html';
import { VECTOR_PHYSICS } from './vector-physics';
import { VECTOR_MATH } from './vector-math';
import { VECTOR_SCIENCE } from './vector-science';
import { VECTOR_MISC } from './vector-misc';

export type { VectorCat, VectorDef } from './vector-types';

/** সব ভেক্টর অ্যাসেট (১২১+) */
export const VECTOR_DEFS: VectorDef[] = [
  ...VECTOR_PHYSICS,
  ...VECTOR_MATH,
  ...VECTOR_SCIENCE,
  ...VECTOR_MISC,
];

/** সাইডবার ক্রম */
export const VECTOR_CAT_ORDER: VectorCat[] = ['physics', 'math', 'chem', 'bio', 'geo', 'chart', 'common'];

/** ক্যাটাগরি লেবেল (বাংলা-প্রথম — ক্যাটালগ হিসেবে এখানে অনুবাদ দরকার নেই) */
export const VECTOR_CAT_LABELS: Record<VectorCat, string> = {
  physics: 'পদার্থবিজ্ঞান',
  math: 'গণিত ও জ্যামিতি',
  chem: 'রসায়ন ও ল্যাব',
  bio: 'জীববিজ্ঞান',
  geo: 'ভূগোল ও বাংলাদেশ',
  chart: 'চার্ট ও লেখচিত্র',
  common: 'কমন এলিমেন্ট',
};

const VECTOR_BY_ID = new Map<string, VectorDef>(VECTOR_DEFS.map((d) => [d.id, d]));

export function getVector(id: string): VectorDef | undefined {
  return VECTOR_BY_ID.get(id);
}

export function vectorsByCat(cat: VectorCat): VectorDef[] {
  return VECTOR_DEFS.filter((d) => d.cat === cat);
}

/** লেবেল + কীওয়ার্ডে খোঁজা (ছোট-হাতের, সব-সাবস্ট্রিং) */
export function searchVectors(query: string): VectorDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return VECTOR_DEFS;
  const words = q.split(/\s+/);
  return VECTOR_DEFS.filter((d) => {
    const hay = `${d.label} ${d.kw} ${VECTOR_CAT_LABELS[d.cat]}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** SVG স্ট্রিং → data URI (<img src>-এ যায়, ভেক্টর বজায় থাকে) */
export function vectorDataUri(def: VectorDef): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(def.svg)}`;
}

/**
 * ড্র্যাগ-অ্যান্ড-ড্রপ পেলোডের figure HTML —
 * TipTap-এর drop-পার্সার এটাকে সরাসরি docFigure নোডে রূপান্তর করে (parseHTML: figure.doc-figure)।
 */
export function figureHtmlOf(def: VectorDef, w = def.w): string {
  const src = vectorDataUri(def);
  return `<figure class="doc-figure" data-vid="${escapeAttr(def.id)}" data-src="${escapeAttr(src)}" data-w="${w}" data-cap="">`
    + `<img src="${escapeAttr(src)}" alt="${escapeAttr(def.label)}" draggable="false"></figure>`;
}
