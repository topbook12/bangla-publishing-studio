/**
 * Template correctness sweep — runs every DS template build() for all
 * declared styles × all 3 UI languages with demo values, and sanity-checks
 * the output HTML. Also exercises thesis page builders.
 * Run: bunx tsx scripts/template-sweep.ts   (or bun run)
 */
import { DS_TEMPLATES, DS_STYLES, dsDemoValues } from '../src/lib/document-studio';
import { buildThesisPages, exampleMeta, DEFAULT_THESIS_OPTIONS, formatReference, EMPTY_CITE } from '../src/lib/thesis';

const styleById = (id: string, fallback = 'classic') =>
  DS_STYLES.find((s) => s.id === id) ?? DS_STYLES.find((s) => s.id === fallback)!;

let errors = 0;
let warnings = 0;
const langs: Array<'bn' | 'hi' | 'en'> = ['bn', 'hi', 'en'];

console.log(`Sweeping ${DS_TEMPLATES.length} DS templates × ${DS_STYLES.length} styles × ${langs.length} langs…`);

for (const tpl of DS_TEMPLATES) {
  // 1. template must declare at least one style that exists
  if (!tpl.styles || tpl.styles.length === 0) {
    console.error(`✗ ${tpl.id}: declares no styles`);
    errors++;
  }
  for (const sid of tpl.styles) {
    if (!DS_STYLES.find((s) => s.id === sid)) {
      console.error(`✗ ${tpl.id}: unknown style id "${sid}"`);
      errors++;
    }
  }
  if (tpl.defaultStyle && !tpl.styles.includes(tpl.defaultStyle)) {
    console.error(`✗ ${tpl.id}: defaultStyle "${tpl.defaultStyle}" not in styles [${tpl.styles.join(',')}]`);
    errors++;
  }

  for (const lang of langs) {
    let values: Record<string, string>;
    try {
      values = dsDemoValues(tpl, lang);
    } catch (e) {
      console.error(`✗ ${tpl.id} [${lang}]: dsDemoValues threw: ${e}`);
      errors++;
      continue;
    }
    // fill ALL fields with demo-ish fallback so no field is empty (empty-safe check too)
    for (const f of tpl.fields) {
      if (values[f.id] === undefined) values[f.id] = f.kind === 'textarea' ? '' : '';
    }

    // 2. build with every declared style
    for (const sid of tpl.styles) {
      const style = styleById(sid, tpl.defaultStyle);
      try {
        const html = tpl.build(values, lang, style.P);
        if (typeof html !== 'string' || html.trim().length < 40) {
          console.error(`✗ ${tpl.id} [${lang}/${sid}]: output too short (${html?.length ?? 'null'})`);
          errors++;
        }
        // unbalanced tags sanity
        const open = (html.match(/<p[ >]/g) || []).length;
        const close = (html.match(/<\/p>/g) || []).length;
        if (open !== close) {
          console.error(`✗ ${tpl.id} [${lang}/${sid}]: unbalanced <p> tags open=${open} close=${close}`);
          errors++;
        }
        const tblOpen = (html.match(/<table[ >]/g) || []).length;
        const tblClose = (html.match(/<\/table>/g) || []).length;
        if (tblOpen !== tblClose) {
          console.error(`✗ ${tpl.id} [${lang}/${sid}]: unbalanced <table> tags`);
          errors++;
        }
        // stray "undefined"/"NaN"/"[object" in output
        if (/undefined|NaN|\[object Object\]/.test(html)) {
          console.error(`✗ ${tpl.id} [${lang}/${sid}]: output contains undefined/NaN/[object Object]`);
          errors++;
        }
        // literal '<b>' unclosed
        const bOpen = (html.match(/<b>/g) || []).length;
        const bClose = (html.match(/<\/b>/g) || []).length;
        if (bOpen !== bClose) {
          console.error(`✗ ${tpl.id} [${lang}/${sid}]: unbalanced <b> tags`);
          errors++;
        }
      } catch (e) {
        console.error(`✗ ${tpl.id} [${lang}/${sid}]: build threw: ${e}`);
        errors++;
      }
    }

    // 3. build with default style + empty values (fresh-form state must not crash)
    const emptyVals: Record<string, string> = {};
    for (const f of tpl.fields) emptyVals[f.id] = '';
    try {
      const style = styleById(tpl.defaultStyle || 'classic');
      const html = tpl.build(emptyVals, lang, style.P);
      if (/undefined|NaN|\[object Object\]/.test(html)) {
        console.error(`✗ ${tpl.id} [${lang}]: EMPTY-form output contains undefined/NaN`);
        errors++;
      }
    } catch (e) {
      console.error(`✗ ${tpl.id} [${lang}]: build with EMPTY values threw: ${e}`);
      errors++;
    }
  }
}

// ── Thesis sweep ──
console.log('Sweeping thesis builders…');
for (const lang of ['bn', 'en'] as const) {
  for (const discipline of ['science', 'arts', 'business'] as const) {
    for (const level of ['honours', 'masters', 'mphil', 'phd'] as const) {
      try {
        const meta = exampleMeta(lang, discipline);
        meta.level = level;
        const pages = buildThesisPages(meta, DEFAULT_THESIS_OPTIONS);
        if (pages.length < 10) {
          console.error(`✗ thesis [${lang}/${discipline}/${level}]: only ${pages.length} pages`);
          errors++;
        }
        for (const p of pages) {
          if (/undefined|NaN|\[object Object\]/.test(p.html)) {
            console.error(`✗ thesis [${lang}/${discipline}/${level}]: page contains undefined/NaN`);
            errors++;
          }
        }
      } catch (e) {
        console.error(`✗ thesis [${lang}/${discipline}/${level}]: threw: ${e}`);
        errors++;
      }
    }
  }
}

// ── Citation engine sweep ──
for (const style of ['apa', 'mla', 'harvard', 'chicago', 'ieee'] as const) {
  for (const type of ['book', 'journal', 'website', 'thesis', 'newspaper', 'report'] as const) {
    try {
      const e = { ...EMPTY_CITE, style, type, authors: 'Rahman, A.', year: '2021', title: 'Test Title', container: 'Journal X', publisher: 'Pub', place: 'Dhaka', volume: '5', issue: '2', pages: '10-20', url: 'https://x.com', doi: '10.1/x', edition: '2nd' };
      const ref = formatReference(e);
      if (!ref || ref.length < 10) { console.error(`✗ cite ${style}/${type}: too short`); errors++; }
      // empty-fields robustness
      const empty = formatReference({ ...EMPTY_CITE, style, type });
      if (/undefined|NaN/.test(empty)) { console.error(`✗ cite ${style}/${type} empty: undefined/NaN`); errors++; }
    } catch (err) {
      console.error(`✗ cite ${style}/${type}: threw ${err}`);
      errors++;
    }
  }
}

// ── wordsTaka unit sweep (0 — 1,23,45,67,890 + tricky ranges) ──
import { wordsTaka } from '../src/lib/document-studio';
const checks: Array<[number, string]> = [
  [18500, 'eighteen thousand five hundred'],
  [29500, 'twenty-nine thousand five hundred'],
  [30450, 'thirty thousand four hundred fifty'],
  [100, 'one hundred'],
  [999, 'nine hundred ninety-nine'],
  [100000, 'one lakh'],
  [1000000, 'ten lakh'],
  [10000000, 'one crore'],
  [123456789, 'twelve crore thirty-four lakh fifty-six thousand seven hundred eighty-nine'],
];
for (const [n, expect] of checks) {
  const out = wordsTaka(n, 'en');
  if (!out.startsWith(expect)) { console.error(`✗ wordsTaka(${n}, en) = "${out}" — expected "${expect}…"`); errors++; }
  if (/undefined|NaN/.test(out)) { console.error(`✗ wordsTaka(${n}, en) contains undefined/NaN`); errors++; }
}
for (let n = 0; n <= 1000; n++) {
  for (const lang of ['bn', 'en', 'hi'] as const) {
    const out = wordsTaka(n, lang);
    if (/undefined|NaN/.test(out)) { console.error(`✗ wordsTaka(${n}, ${lang}) = "${out}"`); errors++; }
  }
}
for (let n = 11000; n <= 11500; n += 7) {
  const out = wordsTaka(n, 'bn');
  if (/undefined|NaN|১১|১৪/.test(out)) { console.error(`✗ wordsTaka(${n}, bn) = "${out}"`); errors++; }
}

console.log('─────────────────────────');
if (errors === 0 && warnings === 0) {
  console.log('✓ ALL CHECKS PASSED');
} else {
  console.log(`✗ ${errors} errors, ${warnings} warnings`);
  process.exit(1);
}
