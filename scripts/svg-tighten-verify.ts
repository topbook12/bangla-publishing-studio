/**
 * টাইটেন-ভেরিফায়ার — tightenVectorSvg() সব ১২১ অ্যাসেটে চালিয়ে দেখা:
 * কতগুলো সাঁটা গেল, কনটেন্ট কাটা পড়ল কি না (বাউন্ডিং বক্স নতুন ভিউবক্সের ভেতরে আছে কি না)।
 */
import { VECTOR_DEFS } from '../src/lib/vector-catalog';

// tightenVectorSvg ইমপোর্ট করতে হবে — কিন্তু ওটা catalog-এ internal। export করা আছে।
import { tightenVectorSvg } from '../src/lib/vector-catalog';

const ATTR = (tag: string, s: string, a: string, dflt: number) => {
  const m = s.match(new RegExp(`${a}\\s*=\\s*"([^"]*)"`));
  return m ? parseFloat(m[1]) : dflt;
};

function analyzeSvg(svg: string): { vb: number[]; bbox: { x0: number; y0: number; x1: number; y1: number } | null; hasText: boolean; maxStroke: number } {
  const vbM = svg.match(/viewBox\s*=\s*"([^"]*)"/);
  const vb = (vbM?.[1] ?? '').split(/[\s,]+/).map(Number);
  let bbox: { x0: number; y0: number; x1: number; y1: number } | null = null;
  let hasText = false;
  let maxStroke = 0;
  const push = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (!bbox) bbox = { x0: x, y0: y, x1: x, y1: y };
    else { bbox.x0 = Math.min(bbox.x0, x); bbox.y0 = Math.min(bbox.y0, y); bbox.x1 = Math.max(bbox.x1, x); bbox.y1 = Math.max(bbox.y1, y); }
  };
  const elRe = /<(circle|ellipse|rect|line|polyline|polygon|path|text)\b([^>]*?)(?:\/>|>([\s\S]*?)<\/\1>)/g;
  let m: RegExpExecArray | null;
  while ((m = elRe.exec(svg)) !== null) {
    const tag = m[1], attrs = m[2], inner = m[3] ?? '';
    let tf: (x: number, y: number) => [number, number] = (x, y) => [x, y];
    const tr = attrs.match(/transform\s*=\s*"([^"]*)"/);
    if (tr) {
      const parts = tr[1].match(/(translate|scale|rotate)\(([^)]*)\)/g) ?? [];
      for (const p of parts) {
        const args = (p.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number);
        if (p.startsWith('translate')) { const [tx, ty] = args; const prev = tf; tf = (x, y) => prev(x + (tx || 0), y + (ty || 0)); }
        else if (p.startsWith('scale')) { const [sx, sy] = args; const prev = tf; tf = (x, y) => prev(x * (sx ?? 1), y * (sy ?? sx ?? 1)); }
        else if (p.startsWith('rotate')) {
          const a = ((args[0] || 0) * Math.PI) / 180, cx = args[1] || 0, cy = args[2] || 0;
          const cos = Math.cos(a), sin = Math.sin(a); const prev = tf;
          tf = (x, y) => { const dx = x - cx, dy = y - cy; return prev(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos); };
        }
      }
    }
    const A = (a: string, d = 0) => ATTR(tag, attrs, a, d);
    if (A('stroke-width') > maxStroke) maxStroke = A('stroke-width');
    if (tag === 'text') {
      hasText = true;
      const x = A('x'), y = A('y'), fs = A('font-size', 12);
      const anchor = attrs.match(/text-anchor\s*=\s*"([^"]*)"/)?.[1] ?? 'start';
      const txt = (inner ?? '').replace(/<[^>]*>/g, '').trim();
      const w = Math.max(1, txt.length) * fs * 0.74;
      let x0 = x, x1 = x + w;
      if (anchor === 'middle') { x0 = x - w / 2; x1 = x + w / 2; }
      else if (anchor === 'end') { x0 = x - w; x1 = x; }
      push(...tf(x0, y - fs * 1.32)); push(...tf(x1, y + fs * 0.32));
    } else if (tag === 'circle') { const cx = A('cx'), cy = A('cy'), r = A('r'); push(...tf(cx - r, cy - r)); push(...tf(cx + r, cy + r)); }
    else if (tag === 'ellipse') { const cx = A('cx'), cy = A('cy'), rx = A('rx'), ry = A('ry'); push(...tf(cx - rx, cy - ry)); push(...tf(cx + rx, cy + ry)); }
    else if (tag === 'rect') { push(...tf(A('x'), A('y'))); push(...tf(A('x') + A('width'), A('y') + A('height'))); }
    else if (tag === 'line') { push(...tf(A('x1'), A('y1'))); push(...tf(A('x2'), A('y2'))); }
    else if (tag === 'polyline' || tag === 'polygon') {
      const pts = (attrs.match(/points\s*=\s*"([^"]*)"/)?.[1] ?? '').match(/-?\d*\.?\d+/g) ?? [];
      for (let k = 0; k + 1 < pts.length; k += 2) push(...tf(parseFloat(pts[k]), parseFloat(pts[k + 1])));
    } else if (tag === 'path') {
      const dAttr = attrs.match(/d\s*=\s*"([^"]*)"/)?.[1] ?? '';
      // coarse sampling for bbox check
      const toks = dAttr.match(/[a-zA-Z]|-?\d*\.?\d+(?:e-?\d+)?/g) ?? [];
      let i = 0, cmd = '', cx = 0, cy = 0, sx = 0, sy = 0;
      const num = () => parseFloat(toks[i++] ?? '0');
      while (i < toks.length) {
        if (/^[a-zA-Z]$/.test(toks[i])) { cmd = toks[i++]; if (cmd === 'Z' || cmd === 'z') { push(...tf(sx, sy)); continue; } }
        switch (cmd) {
          case 'M': case 'm': { const dx = num(), dy = num(); cx = cmd === 'M' ? dx : cx + dx; cy = cmd === 'M' ? dy : cy + dy; sx = cx; sy = cy; push(...tf(cx, cy)); cmd = cmd === 'M' ? 'L' : 'l'; break; }
          case 'L': case 'l': case 'T': case 't': { const dx = num(), dy = num(); cx = cmd === 'l' || cmd === 't' ? cx + dx : dx; cy = cmd === 'l' || cmd === 't' ? cy + dy : dy; push(...tf(cx, cy)); break; }
          case 'H': case 'h': { const dx = num(); cx = cmd === 'h' ? cx + dx : dx; push(...tf(cx, cy)); break; }
          case 'V': case 'v': { const dy = num(); cy = cmd === 'v' ? cy + dy : dy; push(...tf(cx, cy)); break; }
          case 'C': case 'c': { const rel = cmd === 'c';
            const x1 = rel ? cx + num() : num(), y1 = rel ? cy + num() : num();
            const x2 = rel ? cx + num() : num(), y2 = rel ? cy + num() : num();
            const x = rel ? cx + num() : num(), y = rel ? cy + num() : num();
            for (let t = 0; t <= 1.0001; t += 0.1) { const mt = 1 - t; push(...tf(mt*mt*mt*cx + 3*mt*mt*t*x1 + 3*mt*t*t*x2 + t*t*t*x, mt*mt*mt*cy + 3*mt*mt*t*y1 + 3*mt*t*t*y2 + t*t*t*y)); }
            cx = x; cy = y; break; }
          case 'S': case 's': case 'Q': case 'q': { const rel = cmd === 's' || cmd === 'q';
            const x1 = rel ? cx + num() : num(), y1 = rel ? cy + num() : num();
            const x = rel ? cx + num() : num(), y = rel ? cy + num() : num();
            for (let t = 0; t <= 1.0001; t += 0.1) { const mt = 1 - t; push(...tf(mt*mt*cx + 2*mt*t*x1 + t*t*x, mt*mt*cy + 2*mt*t*y1 + t*t*y)); }
            cx = x; cy = y; break; }
          case 'A': case 'a': { num(); num(); num(); num(); num(); const x = num(), y = num(); cx = cmd === 'a' ? cx + x : x; cy = cmd === 'a' ? cy + y : y; push(...tf(cx, cy)); break; }
          default: i++;
        }
      }
    }
  }
  return { vb, bbox, hasText, maxStroke };
}

let tightened = 0, kept = 0, clipped = 0;
const problems: string[] = [];
const improvements: Array<{ id: string; before: string; after: string; fillBefore: number; fillAfter: number }> = [];

for (const d of VECTOR_DEFS) {
  const out = tightenVectorSvg(d.svg);
  const changed = out !== d.svg;
  if (changed) tightened++; else kept++;

  const { bbox, maxStroke } = analyzeSvg(out);
  if (changed && bbox) {
    const vbM = out.match(/viewBox\s*=\s*"([^"]*)"/)?.[1]?.split(/[\s,]+/).map(Number);
    if (vbM && vbM.length === 4) {
      const pad = maxStroke / 2 + 1;
      const bx0 = bbox.x0 - pad, by0 = bbox.y0 - pad, bx1 = bbox.x1 + pad, by1 = bbox.y1 + pad;
      const inBox = bx0 >= vbM[0] - 0.6 && by0 >= vbM[1] - 0.6 && bx1 <= vbM[0] + vbM[2] + 0.6 && by1 <= vbM[1] + vbM[3] + 0.6;
      if (!inBox) { clipped++; problems.push(`${d.id}: content [${bx0.toFixed(1)},${by0.toFixed(1)}→${bx1.toFixed(1)},${by1.toFixed(1)}] vs vb [${vbM.join(' ')}]`); }
      const fill = ((bx1 - bx0) * (by1 - by0)) / (vbM[2] * vbM[3]);
      improvements.push({ id: d.id, before: '', after: vbM.join(' '), fillBefore: 0, fillAfter: fill });
    }
  }
}

console.log(`tightened: ${tightened}, kept-original: ${kept}, clipped: ${clipped}`);
if (problems.length) console.log('PROBLEMS:\n' + problems.join('\n'));
// sample of new viewBoxes
for (const im of improvements.slice(0, 12)) console.log(`${im.id}: vb → ${im.after} (fill ${Math.round(im.fillAfter * 100)}%)`);
