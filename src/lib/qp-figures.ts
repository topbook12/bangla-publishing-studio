/**
 * প্রশ্নপত্র-চিত্র বুদ্ধিমত্তা (Question-paper figure intelligence)
 * ──────────────────────────────────────────────────────────────────
 * শিক্ষকের লেখা "[চিত্র: …]" স্লট-বর্ণনা থেকে:
 *  ১. স্লট-সংগ্রহ — কোন প্রশ্নে কয়টি চিত্র, বর্ণনা কী (collectQpFigureSlots)
 *  ২. ক্যাটালগ-ম্যাচ — ১২১টি ভেক্টর-অ্যাসেটের সাথে বর্ণনা মিলিয়ে সেরা চিত্র (matchFigureVector)
 *  ৩. AI-SVG পরিষ্কারক — AI-র বানানো SVG নিরাপদ ও স্কিমা-উপযোগী করা (sanitizeFigureSvg)
 *  ৪. সন্নিবেশ-HTML — চিত্র → এডিটরের doc-figure নোড (figureHtmlFor)
 *
 * সম্পূর্ণ পরীক্ষণযোগ্য (UI-মুক্ত বিশুদ্ধ ফাংশন) — scripts/verify-templates.ts-এ যাচাই হয়।
 */

import { VECTOR_DEFS, tightenVectorSvg } from './vector-catalog';
import type { VectorDef } from './vector-types';

// ─── চিত্র-মার্কার (ক্যানোনিক্যাল) ───

/** "[চিত্র: …]" / "[Figure: …]" মার্কার — প্রশ্নের লেখায় চিত্র-স্লট; question-paper.ts রি-এক্সপোর্ট করে */
export const QP_FIGURE_RE = /[[(]\s*(?:চিত্র|ছবি|চিত্রপট|চিত্র|figure|fig\.?|diagram)\s*[:：\-]?\s*([^\]()]*)[\])]/gi;

// ─── স্লট-সংগ্রহ ───

/** একটি চিত্র-স্লট — কোন প্রশ্নে (secIdx/qIdx), ক্রমে (ord), কী বর্ণনা */
export interface QpFigureSlot {
  /** "s0-q2-f1" — বিভাগ ০, প্রশ্ন ২, ওই প্রশ্নের ১ম চিত্র */
  key: string;
  secIdx: number;
  qIdx: number;
  ord: number;
  /** [চিত্র: …] এর ভেতরের বর্ণনা — খালি হতে পারে */
  desc: string;
}

/** গোটা প্রশ্নপত্রের সব চিত্র-স্লট — বিভাগ/প্রশ্ন ক্রমে */
export function collectQpFigureSlots(sections: Array<{ questions: Array<{ text: string }> }>): QpFigureSlot[] {
  const slots: QpFigureSlot[] = [];
  for (let s = 0; s < sections.length; s++) {
    const qs = sections[s]?.questions ?? [];
    for (let q = 0; q < qs.length; q++) {
      const text = qs[q]?.text ?? '';
      let ord = 0;
      for (const m of text.matchAll(QP_FIGURE_RE)) {
        slots.push({ key: `s${s}-q${q}-f${ord}`, secIdx: s, qIdx: q, ord, desc: (m[1] ?? '').trim() });
        ord++;
      }
    }
  }
  return slots;
}

// ─── ক্যাটালগ-ম্যাচ ───

/** বাংলা↔ইংরেজি প্রতিশব্দ — প্রশ্নের ভাষা যা-ই হোক ক্যাটালগ-কীওয়ার্ডে মিলবে */
const FIG_SYNONYMS: Record<string, string> = {
  // জ্যামিতি
  'ত্রিভুজ': 'triangle', 'সমবাহু': 'equilateral', 'সমদ্বিবাহু': 'isosceles',
  'চতুর্ভুজ': 'quadrilateral', 'আয়ত': 'rectangle', 'আয়তক্ষেত্র': 'rectangle', 'ঘর': 'rectangle',
  'বর্গ': 'square', 'সামান্তরিক': 'parallelogram', 'ট্রাপিজিয়াম': 'trapezoid', 'রম্বস': 'rhombus',
  'ঘুড়ি': 'kite', 'পঞ্চভুজ': 'pentagon', 'ষড়ভুজ': 'hexagon', 'অষ্টভুজ': 'octagon',
  'বৃত্ত': 'circle', 'ব্যাস': 'diameter', 'ব্যাসার্ধ': 'radius', 'কেন্দ্র': 'center radius', 'স্পর্শক': 'tangent',
  'কোণ': 'angle', 'সমকোণ': 'right angle', 'সূক্ষ্মকোণ': 'acute angle', 'স্থূলকোণ': 'obtuse angle',
  'ঘনক': 'cube', 'ঘন': 'cube', 'চোঙ': 'cylinder', 'সিলিন্ডার': 'cylinder', 'শঙ্কু': 'cone',
  'গোলক': 'sphere', 'গোলাক': 'sphere', 'উচ্চতা': 'height', 'ভূমি': 'base',
  // লেখচিত্র/সমন্বয়
  'লেখচিত্র': 'graph axes', 'গ্রাফ': 'graph axes', 'অক্ষ': 'axes', 'স্থানাঙ্ক': 'axes coordinate',
  'প্যারাবোলা': 'parabola', 'সাইন': 'sine', 'জ্যা': 'sine', 'কোসাইন': 'sine curve', 'বক্ররেখা': 'curve',
  'ভেন': 'venn', 'সেট': 'venn set',
  // বিজ্ঞান-যন্ত্র ('অঙ্কন' = আঁকা-শব্দ, যন্ত্র নয় — STOPWORDS-এ)
  'প্রটেক্টর': 'protractor', 'ফার্মুলার': 'protractor', 'কম্পাস': 'compass',
  // যৌগিক জ্যামিতি-নাম আগে রাখা — দীর্ঘতম-চাবি-প্রথায় ছোট চাবির ('ক্ষেত্র') ফাঁদ এড়াতে
  'বর্গক্ষেত্র': 'square', 'চৌম্বকক্ষেত্র': 'field magnet', 'বলরেখা': 'field magnet lines',
  'স্কেল': 'ruler', 'রুলার': 'ruler', 'মাপকাঠি': 'ruler',
  // পদার্থ
  'প্রিজম': 'prism', 'প্রিজমে': 'prism', 'লেন্স': 'lens', 'আয়না': 'mirror', 'প্রতিফলন': 'reflection mirror',
  'প্রতিসরণ': 'refraction prism', 'আলো': 'light ray', 'রশ্মি': 'ray light', 'পুলি': 'pulley',
  'স্প্রিং': 'spring', 'মানদণ্ড': 'ruler', 'কম্পন': 'wave', 'তরঙ্গ': 'wave', 'সার্কিট': 'circuit',
  // 'ক্ষেত্র' একা চাবি কাটা — 'বর্গক্ষেত্র/আয়তক্ষেত্র/ক্ষেত্রফল' যৌগিকে 'field magnet'-কাণ্ড হতো;
  // 'চুম্বক/চৌম্বক' দুই বানানই (ক্যাটালগে 'চুম্বক', প্রশ্নে দুই-ই লেখে)
  'ব্যাটারি': 'battery', 'চুম্বক': 'magnet', 'চৌম্বক': 'magnet', 'ম্যাগনেট': 'magnet', 'ডায়নামো': 'dynamo',
  'ভোল্টমিটার': 'voltmeter', 'অ্যামিটার': 'ammeter', 'মাইক্রোমিটার': 'micrometer', 'ভারী': 'weight',
  // রসায়ন/জীব
  'পরীক্ষণ': 'test tube', 'টিউব': 'test tube', 'বিকারক': 'beaker', 'কলাম': 'column',
  'কোষ': 'cell', 'উদ্ভিদ': 'plant', 'কনক': 'flower flower-structure', 'ফুল': 'flower flower-structure',
  'পাতা': 'leaf', 'শিকড়': 'root', 'হৃদ': 'heart', 'হৃদয়': 'heart', 'ফুসফুস': 'lungs', 'চোখ': 'eye',
  'মস্তিষ্ক': 'brain', 'পরিপাক': 'digestive', 'কঙ্কাল': 'skeleton', 'অমীমাংস': 'amoeba',
  'ব্যাকটেরিয়া': 'bacteria', 'ভাইরাস': 'virus', 'মৌমাছি': 'bee', 'মাছ': 'fish', 'মেন্ডেল': 'mendel genetics',
  // ভূগোল
  'মানচিত্র': 'map globe', 'গ্লোব': 'globe', 'পৃথিবী': 'earth globe', 'আগ্নেয়গিরি': 'volcano',
  'জলচক্র': 'water cycle', 'বৃষ্টি': 'rain water', 'পর্বত': 'mountain', 'নদী': 'river delta',
  'দ্বীপ': 'island', 'গ্রীষ্মমণ্ডল': 'tropical', 'কম্পাস-রোজ': 'compass rose',
  // চার্ট
  'বার': 'bar chart', 'বার-চার্ট': 'bar chart', 'পাই': 'pie chart', 'পাই-চার্ট': 'pie chart',
  'লাইন-চার্ট': 'line chart', 'দণ্ড': 'bar chart', 'শতকরা': 'pie chart',
};

/** দীর্ঘতম-চাবি-প্রথম ক্রমে সাজানো চাবি — expandQuery একবারই বাছে (মডিউল-লোডে একবার) */
const FIG_SYNONYM_KEYS: string[] = Object.keys(FIG_SYNONYMS).sort((a, b) => b.length - a.length);

/** বর্ণনা → অনুসন্ধান-শব্দ (প্রতিশব্দ-সম্প্রসারণসহ) */
const FIG_STOPWORDS = new Set([
  // সাধারণ "চিত্র আঁকো" শব্দ — প্রতিটি বর্ণনায় থাকে, মিল-স্কোরে শব্দ-শব্দ সমান ওজন দিলে
  // অসংলগ্ন অ্যাসেটও "মিলে যায়"; এগুলো বাদ দিলে আসল-অর্থের শব্দই সিদ্ধান্ত দেয়
  'চিত্র', 'ছবি', 'চিত্রপট', 'figure', 'fig', 'diagram', 'picture', 'image', 'draw', 'drawing',
  'আঁক', 'আঁকো', 'এঁকে', 'আঁকা', 'বানাও', 'বানান', 'দেখাও', 'দেখান', 'লেখ', 'নিচের', 'উপরের',
  'here', 'given', 'following', 'shown', 'below', 'দাও', 'করো', 'কর', 'এর', 'একটি', 'একটা', 'এই',
  // জ্যামিতি-গণনা শব্দ — গ্রাফ/চিত্র নয়; 'ক্ষেত্রফল' যেন 'field magnet'-ে যেন না টানে
  'অঙ্কন', 'অঙ্কনকরো', 'ক্ষেত্রফল', 'পরিসীমা', 'নির্ণয়', 'কত', 'হবে', 'লাগবে',
]);

function expandQuery(desc: string, hint?: string): string[] {
  const words = new Set<string>();
  const add = (s: string) => {
    const t = s.trim().toLowerCase();
    if (t.length >= 2) words.add(t);
  };
  for (const w of desc.split(/[\s,;:·()\-–—/\\]+/)) add(w);
  if (hint) {
    // প্রশ্নের লেখা থেকে বিষয়-ইঙ্গিত — শুধু গুরুত্বপূর্ণ শব্দ
    for (const w of hint.split(/[\s,;:·()\-–—/\\।,.?!"']+/)) {
      const t = w.trim().toLowerCase();
      if (t.length >= 3) words.add(t);
    }
  }
  // প্রতিশব্দ-সম্প্রসারণ — বর্ণনা ও প্রশ্ন-লেখা দুটোতেই খোঁজা
  // দীর্ঘতম-চাবি-প্রথম: 'বর্গক্ষেত্র' যেন 'ক্ষেত্র'-চাবিতে (পুরনো কান্ড: ম্যাগনেট) না পড়ে —
  // সবচেয়ে দীর্ঘ মিল-চাবিই শুধু সম্প্রসারণ করে, তারপর চাবি-লুপ ভাঙা
  const expanded = new Set<string>();
  for (const w of words) {
    if (FIG_STOPWORDS.has(w)) continue;
    expanded.add(w);
    for (const bn of FIG_SYNONYM_KEYS) {
      if (w.includes(bn)) {
        for (const e of FIG_SYNONYMS[bn].split(' ')) expanded.add(e);
        break;
      }
    }
  }
  return [...expanded].filter((w) => w.length >= 2);
}

export interface FigureMatch {
  def: VectorDef;
  /** ০–১ আত্মবিশ্বাস — ≥০.৩ হলেই প্রস্তাব যুক্তিসঙ্গত */
  score: number;
}

/** ক্যাটালগে সেরা চিত্র — শব্দ-মিল-স্কোরিং; দুর্বল মিললে null (শিক্ষক AI/হাতে আঁকবেন) */
export function matchFigureVector(desc: string, questionHint?: string): FigureMatch | null {
  const q = desc.trim();
  if (!q) return null;
  const words = expandQuery(q, questionHint);
  if (words.length === 0) return null;

  let best: FigureMatch | null = null;
  for (const def of VECTOR_DEFS) {
    const label = def.label.toLowerCase();
    const kw = `${def.kw} ${VECTOR_CAT_HINT[def.cat] ?? ''}`.toLowerCase();
    let score = 0;
    let labelHits = 0;
    for (const w of words) {
      if (label === w || label.includes(w)) { score += w.length >= 4 ? 4 : 2; labelHits++; }
      else if (kw.includes(w)) { score += w.length >= 4 ? 2.4 : 1.2; }
    }
    // বর্ণনার দৈর্ঘ্য-শাস্তি — বিশাল বর্ণনায় সব অ্যাসেটই কিছু-না-কিছু মেলে; লেবেল-মিলই আসল
    if (labelHits === 0 && score < 3) continue;
    const norm = score / (score + 6); // 0–1 স্যাচুরেট
    if (!best || norm > best.score) best = { def, score: norm };
  }
  return best && best.score >= 0.34 ? best : null;
}

const VECTOR_CAT_HINT: Record<string, string> = {
  physics: 'physics ray circuit force motion',
  math: 'math geometry triangle circle angle graph axes',
  chem: 'chemistry lab test tube beaker apparatus',
  bio: 'biology cell plant heart organ',
  geo: 'geography map globe earth volcano',
  chart: 'chart bar pie line graph data',
  common: 'arrow box frame label pointer',
};

// ─── AI-SVG নিরাপদকরণ ───

/** AI-বানানো SVG থেকে বিপজ্জনক/অবাঞ্ছিত সব ছাঁটা + কাঠামো-নিশ্চিত; null = অগ্রহণযোগ্য */
export function sanitizeFigureSvg(raw: string): string | null {
  let s = (raw ?? '').trim();
  // কোড-ফেন্স/প্রোজ-প্রিফিক্স ছাঁটা — AI প্রায়ই ```svg …``` দেয়
  s = s.replace(/^```[a-zA-Z]*\s*/, '').replace(/```\s*$/, '');
  const start = s.indexOf('<svg');
  if (start < 0) return null;
  const end = s.lastIndexOf('</svg>');
  if (end < 0) return null;
  s = s.slice(start, end + 6);

  // সাইজ-সীমা — বিশাল উত্তর ফেলে দিই
  if (s.length > 80_000) return null;

  // মারাত্মক উপাদান
  s = s
    .replace(/<script[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<foreignObject[\s\S]*?<\/foreignObject\s*>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    // ইভেন্ট-হ্যান্ডলার — onload= … সব
    .replace(/\son[a-z-]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    // বাইরের রেফারেন্স — href/xlink:href যদি # দিয়ে শুরু না হয়
    .replace(/\s(?:xlink:href|href)\s*=\s*(?:"[^"#][^"]*"|'[^'#][^']*')/gi, '')
    .replace(/\sstyle\s*=\s*"[^"]*(?:url\(|javascript:)[^"]*"/gi, '');

  // xmlns নিশ্চিত — data-URI <img>-তে লাগে
  if (!/xmlns\s*=/.test(s)) {
    s = s.replace(/<svg/i, '<svg xmlns="http://www.w3.org/2000/svg"');
  }
  // viewBox নিশ্চিত — না থাকলে width/height থেকে; দুটোই না থাকলে ডিফল্ট
  if (!/viewBox\s*=/.test(s)) {
    const wm = s.match(/<svg[^>]*\swidth\s*=\s*"([\d.]+)/i);
    const hm = s.match(/<svg[^>]*\sheight\s*=\s*"([\d.]+)/i);
    const w = wm ? parseFloat(wm[1]) : 240;
    const h = hm ? parseFloat(hm[1]) : 180;
    s = s.replace(/<svg/i, `<svg viewBox="0 0 ${Math.round(w)} ${Math.round(h)}"`);
  }
  // ব্যাকগ্রাউন্ড-নিশ্চিত? না — স্বচ্ছই ভালো (প্রশ্নপত্রের সাদা পাতায় মেশে)

  // অন্তত একটা আঁকা-উপাদান থাকতে হবে — ফাঁকা svg বাদ
  if (!/<(?:path|line|rect|circle|ellipse|polyline|polygon|text)\b/i.test(s)) return null;
  return s;
}

/** SVG স্ট্রিং → এডিটর/প্রিন্ট-নিরাপদ data URI */
export function figureSvgDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

// ─── মনোক্রোম-প্রথা (প্রশ্নপত্র সাদা-কালো ছাপা হয়) ───

/** হালকা ক্রিম লেখা — গাঢ় ব্লকের ওপরে থাকে, কালা হলে পড়া যায় না — সাদাই থাকুক */
const FIG_LIGHT_HEX = /^#(?:f4ead2|ffffff|fff)$/i;

/**
 * SVG → মনোক্রোম — প্রশ্নপত্র-প্রথা সাদা-কালো ছাপা; রঙিন ভেক্টর-প্যালেট (VP.*)
 * ছাপার পাতায় ধূসর-ছায়া হয়ে খারাপ দেখায়। সব হেক্স-রঙ → কালি-কালা (#1a1a1a),
 * শুধু ক্রিম/সাদা লেখা (গাঢ় ব্লকের ভেতরের অক্ষর) সাদা থাকে — নইলে অদৃশ্য হয়ে যায়।
 * opacity রাখা হয় — কালা-ব্লকের N/S দুই খণ্ড হালকা-গাঢ় হয়ে আলাদা বোঝা যায়।
 */
export function toMonoSvg(svg: string): string {
  return svg
    .replace(/(fill|stroke)\s*=\s*"(#[0-9a-fA-F]{3,8})"/g, (_full, attr: string, hex: string) =>
      FIG_LIGHT_HEX.test(hex) ? `${attr}="#ffffff"` : `${attr}="#1a1a1a"`)
    .replace(/(fill|stroke)\s*=\s*"(?:rgb|hsl)\([^)]*\)"/gi, '$1="#1a1a1a"');
}

/** ক্যাটালগ-অ্যাসেট → মনোক্রোম data URI (টাইট-ভিউবক্স সহ) — ডক-ফিগার NodeView-ও ব্যবহার করে */
export function vectorMonoDataUri(def: VectorDef): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tightenVectorSvg(toMonoSvg(def.svg)))}`;
}

// ─── সন্নিবেশ-HTML ───

/** চিত্র-পূর্ণক পরিকল্পনা — স্লট-ক্রমে সারিবদ্ধ; null = ম্যানুয়াল স্লটই থাকবে */
export interface QpFigureFill {
  /** দেখানোর ছবি (data URI) */
  src: string;
  /** ক্যাটালগ-ভিত্তিক হলে অ্যাসেট-id — এডিটরে টাইট-ভিউবক্স হিলিং চালু থাকে */
  vid?: string;
  /** প্রস্তাবিত প্রস্থ px (৯০–৬৪০) */
  w: number;
  /** ক্যাপশন — শূন্য হলে বর্ণনাই বসে */
  cap: string;
}

/**
 * চিত্র → doc-figure HTML (এডিটর-স্কিমা-সমর্থিত figure.doc-figure) —
 * সন্নিবেশের পরেও শিক্ষক সাইজ/ক্যাপশন বদলাতে পারেন, প্রিন্ট/DOCX/EPUB সব পাইপলাইনে চলে।
 */
export function figureHtmlFor(fill: QpFigureFill): string {
  const w = Math.max(90, Math.min(640, Math.round(fill.w) || 300));
  const cap = (fill.cap || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').slice(0, 160);
  const src = fill.src.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const vid = fill.vid ? ` data-vid="${fill.vid.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"` : '';
  // data-mono="1" — প্রশ্নপত্র-চিত্র সাদা-কালো ছাপা হয়; এডিটর NodeView-ও এই পতাকায়
  // ক্যাটালগ-পুনঃরাস্তা করলে রঙিন URI-তে ফিরে যায় না (মনোক্রোম-প্রথা রক্ষা)
  const mono = ' data-mono="1"';
  return `<figure class="doc-figure"${vid}${mono} data-src="${src}" data-w="${w}" data-cap="${cap}">`
    + `<img src="${src}" alt="${cap || 'চিত্র'}" draggable="false" style="width:${w}px;max-width:100%;height:auto"></figure>`;
}

/** ক্যাটালগ-ম্যাচ → fill (মনোক্রোম data URI টাইট-ভিউবক্সে) */
export function fillFromMatch(m: FigureMatch, cap: string): QpFigureFill {
  return { src: vectorMonoDataUri(m.def), vid: m.def.id, w: m.def.w, cap };
}

/** AI-SVG → fill (মনোক্রোম) */
export function fillFromSvg(svg: string, cap: string): QpFigureFill | null {
  const clean = sanitizeFigureSvg(svg);
  if (!clean) return null;
  return { src: figureSvgDataUri(toMonoSvg(clean)), w: 300, cap };
}
