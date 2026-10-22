/**
 * Template quality audit — Task 7 (premium templates + color combos)
 * Runs under bun. Validates:
 *  1. Every template builds without throwing (demo values, empty values, XSS values)
 *  2. Output is editor-schema-valid (allowed top-level blocks only, balanced tags)
 *  3. User values are escaped (XSS injection test)
 *  4. WCAG contrast audit of every palette (head/ink/soft/border on white + band)
 */
import {
  DS_TEMPLATES, DS_STYLES, buildDsHtml, dsDemoValues, dsDefaultValues,
  type DsTemplate,
} from '../src/lib/document-studio';
import { PAGE_TEMPLATES } from '../src/lib/page-templates';
import { BOOK_BLUEPRINTS } from '../src/lib/book-templates';
import { buildThesisPages, DEFAULT_THESIS_OPTIONS } from '../src/lib/thesis';
import type { Lang } from '../src/lib/i18n/core';

// ─── HTML structural validation ───
const ALLOWED_TOP = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'table', 'hr', 'ul', 'ol', 'div', 'blockquote', 'pre']);
const VOID = new Set(['hr', 'br', 'img']);

function checkHtml(html: string, label: string, problems: string[]): void {
  // balance check
  const stack: string[] = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*?)?)\/?>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const [full, tag] = m;
    const t = tag.toLowerCase();
    if (VOID.has(t)) continue;
    if (full.startsWith('</')) {
      const top = stack.pop();
      if (top !== t) {
        problems.push(`${label}: unbalanced </${t}> (expected </${top ?? 'EOF'}) near "${html.slice(Math.max(0, m.index - 30), m.index + 20)}"`);
        if (stack.length > 6) break;
      }
    } else if (!full.endsWith('/>')) {
      stack.push(t);
    }
  }
  if (stack.length > 0) problems.push(`${label}: unclosed tags remain: ${[...new Set(stack)].join(',')}`);

  // top-level block check
  const topRe = /<([a-zA-Z][a-zA-Z0-9-]*)[^>]*>/g;
  let depth = 0;
  let top: string[] = [];
  const scanRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*?(\/?)>/g;
  let sm: RegExpExecArray | null;
  while ((sm = scanRe.exec(html)) !== null) {
    const t = sm[1].toLowerCase();
    const closing = sm[0].startsWith('</');
    const selfClose = sm[2] === '/';
    if (VOID.has(t) || selfClose) {
      if (depth === 0) top.push(t);
      continue;
    }
    if (closing) {
      depth = Math.max(0, depth - 1);
    } else {
      if (depth === 0) top.push(t);
      depth += 1;
    }
  }
  for (const t of top) {
    if (!ALLOWED_TOP.has(t)) problems.push(`${label}: top-level <${t}> not in editor schema`);
  }
  // raw dangerous content
  if (/<script|<iframe|onerror=/i.test(html)) problems.push(`${label}: raw script/iframe/onerror survived`);
}

// ─── WCAG contrast ───
function parseColor(c: string): [number, number, number, number] {
  const s = c.trim();
  if (s.startsWith('#')) {
    const h = s.slice(1);
    const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
    return [parseInt(full.slice(0, 2), 16), parseInt(full.slice(2, 4), 16), parseInt(full.slice(4, 6), 16), 1];
  }
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) return [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10), m[4] ? parseFloat(m[4]) : 1];
  return [0, 0, 0, 1];
}
/** composite c over white */
function overWhite([r, g, b, a]: [number, number, number, number]): [number, number, number] {
  return [r * a + 255 * (1 - a), g * a + 255 * (1 - a), b * a + 255 * (1 - a)];
}
function lum(css: string): number {
  const [r, g, b] = overWhite(parseColor(css)).map((v) => {
    const c = Math.min(255, Math.max(0, v)) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg: string, bg: string): number {
  const l1 = lum(fg);
  const l2 = lum(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const problems: string[] = [];
const contrastReport: string[] = [];

// ─── 1. DS templates ───
const LANGS: Lang[] = ['bn', 'hi', 'en'];
const XSS = '<script>alert(1)</script>';

for (const tpl of DS_TEMPLATES) {
  for (const lang of LANGS) {
    // demo values
    try {
      const demo = dsDemoValues(tpl, lang);
      const html = buildDsHtml(tpl, demo, lang, tpl.defaultStyle);
      checkHtml(html, `ds:${tpl.id}:${lang}:demo`, problems);
    } catch (e) {
      problems.push(`ds:${tpl.id}:${lang}:demo THROWS: ${String(e)}`);
    }
    // default (empty) values
    try {
      const def = dsDefaultValues(tpl, lang);
      const html = buildDsHtml(tpl, def, lang, tpl.defaultStyle);
      checkHtml(html, `ds:${tpl.id}:${lang}:empty`, problems);
    } catch (e) {
      problems.push(`ds:${tpl.id}:${lang}:empty THROWS: ${String(e)}`);
    }
    // XSS injection into every text field
    try {
      const xssValues: Record<string, string> = {};
      for (const f of tpl.fields) xssValues[f.id] = XSS;
      const html = buildDsHtml(tpl, xssValues, lang, tpl.defaultStyle);
      if (html.includes('<script')) problems.push(`ds:${tpl.id}:${lang}: XSS NOT ESCAPED`);
      checkHtml(html, `ds:${tpl.id}:${lang}:xss`, problems);
    } catch (e) {
      problems.push(`ds:${tpl.id}:${lang}:xss THROWS: ${String(e)}`);
    }
    // every style × demo
    for (const st of tpl.styles) {
      try {
        const demo = dsDemoValues(tpl, lang);
        const html = buildDsHtml(tpl, demo, lang, st);
        if (!html || html.length < 80) problems.push(`ds:${tpl.id}:${lang}:${st}: output suspiciously short (${html.length})`);
      } catch (e) {
        problems.push(`ds:${tpl.id}:${lang}:${st} THROWS: ${String(e)}`);
      }
    }
  }
  // fields sanity: table fields must have ph or demo? (not mandatory)
}

// ─── 2. Page templates (static html — lang-independent) ───
for (const pt of PAGE_TEMPLATES) {
  checkHtml(pt.html, `pt:${pt.id}`, problems);
  if (pt.html.length < 100) problems.push(`pt:${pt.id}: html suspiciously short`);
}

// ─── 3. Book blueprints ───
for (const bp of BOOK_BLUEPRINTS) {
  try {
    for (const [i, pg] of bp.pages.entries()) {
      checkHtml(pg.html, `bp:${bp.id}:p${i}`, problems);
    }
  } catch (e) {
    problems.push(`bp:${bp.id} THROWS: ${String(e)}`);
  }
}

// ─── 4. Thesis pages (both langs, each discipline/level) ───
for (const lang of ['bn', 'en'] as const) {
  for (const disc of ['science', 'arts', 'business'] as const) {
    for (const level of ['honours', 'masters', 'mphil', 'phd'] as const) {
      try {
        const pages = buildThesisPages({
          lang, level, discipline: disc,
          title: XSS + ' টেস্ট', university: 'Test <Univ>', department: 'Dept', author: 'Author',
          roll: '12', session: '2024-25', supervisor: 'Sup', degreeName: '', date: 'March 2026',
          dedicationText: 'To mom',
        }, { ...DEFAULT_THESIS_OPTIONS });
        pages.forEach((p, i) => checkHtml(p.html, `thesis:${lang}:${disc}:${level}:p${i}`, problems));
        if (pages.some((p) => p.html.includes('<script'))) problems.push(`thesis:${lang}:${disc}:${level}: XSS NOT ESCAPED`);
      } catch (e) {
        problems.push(`thesis:${lang}:${disc}:${level} THROWS: ${String(e)}`);
      }
    }
  }
}

// ─── 5. Palette contrast audit ───
for (const st of DS_STYLES) {
  const P = st.P;
  const bandBg = P.band;
  const onWhiteHead = contrast(P.head, '#ffffff');
  const onWhiteInk = contrast(P.ink, '#ffffff');
  const onWhiteSoft = contrast(P.soft, '#ffffff');
  const onBandHead = contrast(P.head, bandBg);
  contrastReport.push(
    `${st.id.padEnd(9)} head/w=${onWhiteHead.toFixed(2)} ink/w=${onWhiteInk.toFixed(2)} soft/w=${onWhiteSoft.toFixed(2)} head/band=${onBandHead.toFixed(2)} band=${P.band}`,
  );
  if (onWhiteHead < 4.5) problems.push(`palette:${st.id}: head on white contrast ${onWhiteHead.toFixed(2)} < 4.5`);
  if (onWhiteInk < 4.5) problems.push(`palette:${st.id}: ink on white contrast ${onWhiteInk.toFixed(2)} < 4.5`);
  if (onWhiteSoft < 3) problems.push(`palette:${st.id}: soft on white contrast ${onWhiteSoft.toFixed(2)} < 3 (used for meta text)`);
  if (onBandHead < 4.5) problems.push(`palette:${st.id}: head on band contrast ${onBandHead.toFixed(2)} < 4.5`);
}

console.log('═══ CONTRAST REPORT ═══');
for (const l of contrastReport) console.log(l);
console.log('');
console.log(`═══ PROBLEMS (${problems.length}) ═══`);
for (const p of problems) console.log('•', p);
if (problems.length === 0) console.log('ALL CLEAN ✔');
