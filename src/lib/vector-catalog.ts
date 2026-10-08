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
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tightenVectorSvg(def.svg))}`;
}

// ───────────────── ভিউবক্স অটো-টাইটেন (অভ্যন্তরীণ ফাঁকা জায়গা দূর) ─────────────────
//
// অনেক অ্যাসেটের viewBox আঁকা কনটেন্টের চেয়ে অনেক বড় — ঢোকানোর পর ছবির চারপাশে
// বিশাল মৃত-স্পেস থাকে, আসল ছবি ছোট দেখায়। এই পার্সার প্রতিটি SVG-র আসল বাউন্ডিং-
// বক্স মেপে viewBox-কে কনটেন্টে সাঁটায় — একবারই (মেমোইজড), সব কনজিউমারে একই ফল।

interface TightBox { x0: number; y0: number; x1: number; y1: number }

/** পাথ d-স্ট্রিং স্যাম্পল করে পয়েন্ট বের করা (M/L/H/V/C/S/Q/T/A/Z) */
function samplePathPoints(d: string, push: (x: number, y: number) => void): void {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
  let i = 0;
  let cmd = '';
  let cx = 0, cy = 0, sx = 0, sy = 0;
  const num = () => parseFloat(tokens[i++] ?? '0');
  while (i < tokens.length) {
    if (/^[a-zA-Z]$/.test(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === 'Z' || cmd === 'z') { push(sx, sy); continue; }
    }
    switch (cmd) {
      case 'M': case 'm': {
        const dx = num(), dy = num();
        cx = cmd === 'M' ? dx : cx + dx; cy = cmd === 'M' ? dy : cy + dy;
        sx = cx; sy = cy; push(cx, cy);
        cmd = cmd === 'M' ? 'L' : 'l';
        break;
      }
      case 'L': case 'l': case 'T': case 't': {
        const dx = num(), dy = num();
        cx = cmd === 'l' || cmd === 't' ? cx + dx : dx;
        cy = cmd === 'l' || cmd === 't' ? cy + dy : dy;
        push(cx, cy);
        break;
      }
      case 'H': case 'h': { const dx = num(); cx = cmd === 'h' ? cx + dx : dx; push(cx, cy); break; }
      case 'V': case 'v': { const dy = num(); cy = cmd === 'v' ? cy + dy : dy; push(cx, cy); break; }
      case 'C': case 'c': {
        const rel = cmd === 'c';
        const x1 = rel ? cx + num() : num(), y1 = rel ? cy + num() : num();
        const x2 = rel ? cx + num() : num(), y2 = rel ? cy + num() : num();
        const x = rel ? cx + num() : num(), y = rel ? cy + num() : num();
        for (let t = 0; t <= 1.0001; t += 0.1) {
          const mt = 1 - t;
          push(mt*mt*mt*cx + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x, mt*mt*mt*cy + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*y);
        }
        cx = x; cy = y;
        break;
      }
      case 'S': case 's': case 'Q': case 'q': {
        const rel = cmd === 's' || cmd === 'q';
        const x1 = rel ? cx + num() : num(), y1 = rel ? cy + num() : num();
        const x = rel ? cx + num() : num(), y = rel ? cy + num() : num();
        for (let t = 0; t <= 1.0001; t += 0.1) {
          const mt = 1 - t;
          push(mt*mt*cx + 2*mt*t*x1 + t*t*x, mt*mt*cy + 2*mt*t*y1 + t*t*y);
        }
        cx = x; cy = y;
        break;
      }
      case 'A': case 'a': {
        num(); num(); num(); num(); num();
        const x = num(), y = num();
        cx = cmd === 'a' ? cx + x : x; cy = cmd === 'a' ? cy + y : y;
        push(cx, cy);
        break;
      }
      default: i++;
    }
  }
}

type TightTf = (x: number, y: number) => [number, number];
const IDENTITY_TF: TightTf = (x, y) => [x, y];

/** transform অ্যাট্রিবিউট → পূর্ববর্তী ট্রান্সফর্মের সাথে যুক্ত ফাংশন */
function composeTf(prev: TightTf, transform: string): TightTf {
  const parts = transform.match(/(translate|scale|rotate)\(([^)]*)\)/g);
  if (!parts || parts.length === 0) return prev;
  let tf = prev;
  for (const part of parts) {
    const args = (part.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
    if (part.startsWith('translate')) {
      const [tx, ty] = args;
      const next = tf; tf = (x, y) => next(x + (tx || 0), y + (ty || 0));
    } else if (part.startsWith('scale')) {
      const [sx, sy] = args;
      const next = tf; tf = (x, y) => next(x * (sx ?? 1), y * (sy ?? sx ?? 1));
    } else if (part.startsWith('rotate')) {
      const a = ((args[0] || 0) * Math.PI) / 180;
      const cx = args[1] ?? 0, cy = args[2] ?? 0;
      const cos = Math.cos(a), sin = Math.sin(a);
      const next = tf;
      tf = (x, y) => {
        const dx = x - cx, dy = y - cy;
        return next(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
      };
    }
  }
  return tf;
}

const NUM_ATTR = (attrs: string, name: string, dflt: number): number => {
  // শব্দ-সীমাসহ — নইলে 'x' প্যাটার্ন 'cx='/'rx='-এর ভেতরের x-এ মিলে যায়
  const m = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*"\\s*(-?\\d*\\.?\\d+(?:e-?\\d+)?)\\s*"`));
  return m ? parseFloat(m[1]) : dflt;
};

/**
 * একটি SVG-র আসল কনটেন্ট-বাউন্ডিং-বক্স মাপা (স্ট্রোক + টেক্সট-আনুমানিকসহ)।
 * রিটার্ন null = মাপা গেল না (অজানা কাঠামো) — কলার আসল SVG রাখবে।
 */
function measureSvgBBox(svg: string): TightBox | null {
  // হোল্ডার-অবজেক্ট — ক্লোজার-অ্যাসাইনমেন্টে TS-এর never-ন্যারোয়িং ফাঁকি দিতে
  const held: { box: TightBox | null } = { box: null };
  let maxStroke = 0;
  const push = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!held.box) held.box = { x0: x, y0: y, x1: x, y1: y };
    else {
      held.box.x0 = Math.min(held.box.x0, x); held.box.y0 = Math.min(held.box.y0, y);
      held.box.x1 = Math.max(held.box.x1, x); held.box.y1 = Math.max(held.box.y1, y);
    }
  };

  // সাধারণ XML ওয়াকার — নেস্টেড <g transform> স্ট্যাকসহ
  const tagRe = /<(\/)?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|[^>])*?)(\/?)>/g;
  const stack: TightTf[] = [];
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(svg)) !== null) {
    const closing = m[1] === '/', tag = m[2].toLowerCase(), attrs = m[3] ?? '', selfClose = m[4] === '/';

    if (closing) { stack.pop(); continue; }

    const tf = composeTf(stack[stack.length - 1] ?? IDENTITY_TF, attrs.match(/transform\s*=\s*"([^"]*)"/)?.[1] ?? '');

    const sw = NUM_ATTR(attrs, 'stroke-width', 0);
    if (sw > maxStroke) maxStroke = sw;

    if (tag === 'g' && !selfClose) { stack.push(tf); continue; }
    if (tag === 'text' && !selfClose) {
      // <text> লেবেল — বন্ধ-ট্যাগ পর্যন্ত লেখা তুলে আনুমানিক বক্স (বাংলা গ্লিফ চওড়া — সেফটি ফ্যাক্টরসহ)
      stack.push(tf);
      const closeIdx = svg.indexOf('</text>', tagRe.lastIndex);
      const label = (closeIdx >= 0 ? svg.slice(tagRe.lastIndex, closeIdx) : '').replace(/<[^>]*>/g, '').trim();
      if (label) {
        const x = NUM_ATTR(attrs, 'x', 0), y = NUM_ATTR(attrs, 'y', 0);
        const fs = NUM_ATTR(attrs, 'font-size', 12);
        const anchor = attrs.match(/text-anchor\s*=\s*"([^"]*)"/)?.[1] ?? 'start';
        const w = Math.max(1, label.length) * fs * 0.74;
        let x0 = x, x1 = x + w;
        if (anchor === 'middle') { x0 = x - w / 2; x1 = x + w / 2; }
        else if (anchor === 'end') { x0 = x - w; x1 = x; }
        push(...tf(x0, y - fs * 1.32));
        push(...tf(x1, y + fs * 0.32));
      }
      continue;
    }

    const A = (n: string, d = 0) => NUM_ATTR(attrs, n, d);
    if (tag === 'circle') {
      const cx = A('cx'), cy = A('cy'), r = A('r');
      push(...tf(cx - r, cy - r)); push(...tf(cx + r, cy + r));
    } else if (tag === 'ellipse') {
      const cx = A('cx'), cy = A('cy'), rx = A('rx'), ry = A('ry');
      push(...tf(cx - rx, cy - ry)); push(...tf(cx + rx, cy + ry));
    } else if (tag === 'rect') {
      const x = A('x'), y = A('y'), w = A('width'), h = A('height');
      push(...tf(x, y)); push(...tf(x + w, y + h));
    } else if (tag === 'line') {
      push(...tf(A('x1'), A('y1'))); push(...tf(A('x2'), A('y2')));
    } else if (tag === 'polyline' || tag === 'polygon') {
      const pts = (attrs.match(/points\s*=\s*"([^"]*)"/)?.[1] ?? '').match(/-?\d*\.?\d+/g) ?? [];
      for (let k = 0; k + 1 < pts.length; k += 2) push(...tf(parseFloat(pts[k]), parseFloat(pts[k + 1])));
    } else if (tag === 'path') {
      const dAttr = attrs.match(/d\s*=\s*"([^"]*)"/)?.[1] ?? '';
      if (dAttr) samplePathPoints(dAttr, (x, y) => { const [tx, ty] = tf(x, y); push(tx, ty); });
    }
  }
  const box = held.box
    ? { x0: held.box.x0, y0: held.box.y0, x1: held.box.x1, y1: held.box.y1 }
    : null;
  if (maxStroke > 0 && box) {
    const p = maxStroke / 2;
    box.x0 -= p; box.y0 -= p; box.x1 += p; box.y1 += p;
  }
  return box;
}

const tightCache = new Map<string, string>();

/** SVG-র viewBox-কে আঁকা কনটেন্টে সাঁটায় (ছোট প্যাডিংসহ) — মেমোইজড */
export function tightenVectorSvg(svg: string): string {
  const cached = tightCache.get(svg);
  if (cached !== undefined) return cached;

  let out = svg;
  const vbM = svg.match(/viewBox\s*=\s*"\s*(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)[\s,]+(-?[\d.]+)\s*"/);
  const box = measureSvgBBox(svg);
  if (vbM && box) {
    const vwRaw = vbM[3], vhRaw = vbM[4];
    const vw = parseFloat(vwRaw), vh = parseFloat(vhRaw);
    if (vw > 0 && vh > 0) {
      const pad = Math.max(3, Math.round(Math.max(vw, vh) * 0.03));
      const nx0 = Math.floor(box.x0 - pad), ny0 = Math.floor(box.y0 - pad);
      const nx1 = Math.ceil(box.x1 + pad), ny1 = Math.ceil(box.y1 + pad);
      const nw = nx1 - nx0, nh = ny1 - ny0;
      // শুধু তখনই প্রয়োগ যখন সত্যিই সাঁটা যায় (কনটেন্ট ভিউবক্সের বাইরে গেলে আসলটাই থাক)
      if (nw > 0 && nh > 0 && nw <= vw && nh <= vh && (nw * nh) < (vw * vh) * 0.985) {
        out = svg.replace(vbM[0], `viewBox="${nx0} ${ny0} ${nw} ${nh}"`);
      }
    }
  }
  tightCache.set(svg, out);
  return out;
}

/**
 * পুরনো ডকুমেন্টে সংরক্ষিত প্যাডেড figure data-src ক্যাটালগ-ভিত্তিক টাইট ভার্সনে
 * বদলে দেয় (data-vid মিললে) — পুরনো বইয়ের চিত্রও এক্সপোর্টে টাইট হয়ে যায়।
 */
export function healFigureSrcs(html: string): string {
  if (!html.includes('doc-figure') || !html.includes('data-vid')) return html;
  return html.replace(/<figure\b[^>]*>/g, (tag) => {
    const vid = tag.match(/data-vid="([^"]*)"/)?.[1];
    if (!vid) return tag;
    const def = getVector(vid);
    if (!def) return tag;
    const tightUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(tightenVectorSvg(def.svg))}`;
    if (tag.includes(`data-src="${tightUri}"`)) return tag;
    if (!tag.includes('data-src=')) return tag;
    return tag.replace(/data-src="[^"]*"/, `data-src="${tightUri}"`);
  });
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
