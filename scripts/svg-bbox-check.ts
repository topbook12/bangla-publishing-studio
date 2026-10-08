/**
 * SVG bbox analyzer (regex-based, bun চলবে) — প্রতিটি ভেক্টর অ্যাসেটের আঁকা
 * কনটেন্টের আসল বাউন্ডিং বক্স viewBox-এর সাথে তুলনা করে।
 */
import { VECTOR_DEFS } from '../src/lib/vector-catalog';

interface BBox { x0: number; y0: number; x1: number; y1: number }
type Tf = (x: number, y: number) => [number, number];

function parsePathSampling(d: string, push: (x: number, y: number) => void) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  let i = 0;
  let cmd = '';
  let cx = 0, cy = 0, sx = 0, sy = 0;
  const num = () => parseFloat(tokens[i++] ?? '0');
  const isCmd = (t: string) => /^[a-zA-Z]$/.test(t);
  while (i < tokens.length) {
    if (isCmd(tokens[i])) { cmd = tokens[i++]; if (cmd === 'Z' || cmd === 'z') { push(sx, sy); continue; } }
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

const ATTR = (tag: string, s: string, a: string, dflt: number) => {
  const m = s.match(new RegExp(`${a}\\s*=\\s*"([^"]*)"`));
  return m ? parseFloat(m[1]) : dflt;
};
const HAS = (s: string, a: string) => new RegExp(`${a}\\s*=`).test(s);

function analyzeSvg(svg: string): { vb: number[]; bbox: BBox | null; hasText: boolean; maxStroke: number } {
  const vbM = svg.match(/viewBox\s*=\s*"([^"]*)"/);
  const vb = (vbM?.[1] ?? '').split(/[\s,]+/).map(Number);
  let bbox: BBox | null = null;
  let hasText = false;
  let maxStroke = 0;
  const push = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!bbox) bbox = { x0: x, y0: y, x1: x, y1: y };
    else { bbox.x0 = Math.min(bbox.x0, x); bbox.y0 = Math.min(bbox.y0, y); bbox.x1 = Math.max(bbox.x1, x); bbox.y1 = Math.max(bbox.y1, y); }
  };

  // element chunks: <tag ... /> or <tag ...>...</tag> (text)
  const elRe = /<(circle|ellipse|rect|line|polyline|polygon|path|text|g)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  let m: RegExpExecArray | null;
  while ((m = elRe.exec(svg)) !== null) {
    const tag = m[1], attrs = m[2], inner = m[3] ?? '';
    // compose transform chain (single-level translate/scale/rotate is enough here)
    let tf: Tf = (x, y) => [x, y];
    const tr = attrs.match(/transform\s*=\s*"([^"]*)"/);
    if (tr) {
      const trStr = tr[1];
      const parts = trStr.match(/(translate|scale|rotate)\(([^)]*)\)/g) ?? [];
      for (const p of parts) {
        const args = (p.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
        if (p.startsWith('translate')) { const [tx, ty] = args; const prev = tf; tf = (x, y) => prev(x + tx, y + (ty ?? 0)); }
        else if (p.startsWith('scale')) { const [sx, sy] = args; const prev = tf; tf = (x, y) => prev(x * sx, y * (sy ?? sx)); }
        else if (p.startsWith('rotate')) { const a = ((args[0] ?? 0) * Math.PI) / 180; const prev = tf; tf = (x, y) => prev(x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)); }
      }
    }
    const A = (a: string, d = 0) => ATTR(tag, attrs, a, d);
    const sw = A('stroke-width');
    if (sw > maxStroke) maxStroke = sw;
    if (tag === 'text') {
      hasText = true;
      const x = A('x'), y = A('y'), fs = A('font-size', 12);
      const anchorM = attrs.match(/text-anchor\s*=\s*"([^"]*)"/);
      const anchor = anchorM?.[1] ?? 'start';
      const txt = (inner ?? '').replace(/<[^>]*>/g, '');
      const w = Math.max(2, txt.length) * fs * 0.62, h = fs * 1.35;
      let x0 = x, x1 = x + w;
      if (anchor === 'middle') { x0 = x - w / 2; x1 = x + w / 2; }
      else if (anchor === 'end') { x0 = x - w; x1 = x; }
      push(...tf(x0, y - h)); push(...tf(x1, y + 4));
    } else if (tag === 'circle') {
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
      if (!HAS(attrs, 'transform')) parsePathSampling(dAttr, push);
      else parsePathSampling(dAttr, (x, y) => push(...tf(x, y)));
    } else if (tag === 'g') {
      // nested content handled because regex captures only one level — nested children get their own matches
    }
  }
  return { vb, bbox, hasText, maxStroke };
}

const rows: string[] = [];
const bad: string[] = [];
for (const d of VECTOR_DEFS) {
  const { vb, bbox, maxStroke } = analyzeSvg(d.svg);
  if (!bbox || vb.length !== 4) { rows.push(`${d.id} | PARSE-FAIL vb=${vb}`); bad.push(d.id); continue; }
  const pad = maxStroke / 2 + 1.5;
  const bx0 = bbox.x0 - pad, by0 = bbox.y0 - pad, bx1 = bbox.x1 + pad, by1 = bbox.y1 + pad;
  const vw = vb[2], vh = vb[3];
  const usedW = ((bx1 - bx0) / vw) * 100;
  const usedH = ((by1 - by0) / vh) * 100;
  const offL = bx0, offT = by0, offR = vw - bx1, offB = vh - by1;
  const maxOff = Math.max(offL, offR, offT, offB);
  const padded = usedW < 80 || usedH < 72 || maxOff > vw * 0.1;
  if (padded) bad.push(d.id);
  rows.push(`${padded ? 'PAD' : '   '} ${d.id.padEnd(22)} vb=${String(vw).padStart(3)}x${String(vh).padStart(3)} bbox=[${bx0.toFixed(0)},${by0.toFixed(0)}→${bx1.toFixed(0)},${by1.toFixed(0)}] W${usedW.toFixed(0).padStart(3)}% H${usedH.toFixed(0).padStart(3)}% offL${offL.toFixed(0).padStart(3)} offT${offT.toFixed(0).padStart(3)} offR${offR.toFixed(0).padStart(3)} offB${offB.toFixed(0).padStart(3)}`);
}
console.log(rows.join('\n'));
console.log(`\n>>> ${bad.length}/${VECTOR_DEFS.length} flagged: ${bad.join(', ')}`);
