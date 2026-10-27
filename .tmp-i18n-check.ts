/**
 * Temp audit script (Pass 2): i18n completeness
 * 1. Every key in every dict-*.ts must have bn, hi, en
 * 2. Every tt('...') / t('...') literal used in src must exist in some dict
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const DICT_DIR = 'src/lib/i18n';
const SRC_DIRS = ['src/app', 'src/components', 'src/lib', 'src/hooks'];

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(f)) out.push(p);
  }
  return out;
}

let problems = 0;

// ── 1. dict files: each key must have bn/hi/en ──
for (const file of readdirSync(DICT_DIR).filter((f) => f.startsWith('dict-'))) {
  const src = readFileSync(join(DICT_DIR, file), 'utf8');
  // crude but effective: find all keys 'xxx.yyy': { bn: "...", hi: "...", en: "..." }
  const keyRe = /['"]([a-z0-9]+(?:\.[a-zA-Z0-9]+)+)['"]\s*:\s*\{/g;
  let m: RegExpExecArray | null;
  const keys: string[] = [];
  while ((m = keyRe.exec(src))) keys.push(m[1]);
  for (const k of keys) {
    // find the object body for this key (rough: up to next key or end)
    const idx = src.indexOf(`'${k}'`) >= 0 ? src.indexOf(`'${k}'`) : src.indexOf(`"${k}"`);
    if (idx < 0) continue;
    const chunk = src.slice(idx, idx + 1200);
    for (const lang of ['bn', 'hi', 'en']) {
      if (!new RegExp(`\\b${lang}\\s*:`, 'm').test(chunk.slice(0, 800))) {
        console.log(`❌ ${file}: key '${k}' missing '${lang}'`);
        problems++;
      }
    }
  }
  console.log(`✓ ${file}: ${keys.length} keys checked`);
}

// ── 2. collect all keys defined across dicts ──
const allDefined = new Set<string>();
for (const file of readdirSync(DICT_DIR).filter((f) => f.startsWith('dict-'))) {
  const src = readFileSync(join(DICT_DIR, file), 'utf8');
  const keyRe = /['"]([a-z0-9]+(?:\.[a-zA-Z0-9]+)+)['"]\s*:\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = keyRe.exec(src))) allDefined.add(m[1]);
  // bracket-assignment style: dictX['key'] = { bn: ..., ... }
  const brRe = /\[['"]([a-z0-9]+(?:\.[a-zA-Z0-9]+)+)['"]\]\s*=/g;
  while ((m = brRe.exec(src))) allDefined.add(m[1]);
}
// also index.ts may define keys
for (const f of ['index.ts', 'core.ts']) {
  try {
    const src = readFileSync(join(DICT_DIR, f), 'utf8');
    const keyRe = /['"]([a-z0-9]+(?:\.[a-zA-Z0-9]+)+)['"]\s*:\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(src))) allDefined.add(m[1]);
    const brRe = /\[['"]([a-z0-9]+(?:\.[a-zA-Z0-9]+)+)['"]\]\s*=/g;
    while ((m = brRe.exec(src))) allDefined.add(m[1]);
  } catch { /* skip */ }
}

// ── 3. every literal tt('...') used in src must be defined ──
const files = SRC_DIRS.flatMap((d) => walk(d));
let checked = 0;
for (const f of files) {
  if (f.includes('/i18n/')) continue;
  const src = readFileSync(f, 'utf8');
  const useRe = /\b(?:tt|t)\(\s*['"]([a-z0-9]+(?:\.[a-zA-Z0-9]+)+)['"]/g;
  let m: RegExpExecArray | null;
  while ((m = useRe.exec(src))) {
    checked++;
    if (!allDefined.has(m[1])) {
      console.log(`❌ MISSING KEY: '${m[1]}' used in ${f}`);
      problems++;
    }
  }
}
console.log(`\n✓ ${checked} tt()/t() literal usages checked against ${allDefined.size} defined keys`);
console.log(problems === 0 ? '✅ i18n PASS' : `❌ ${problems} problems`);
process.exit(problems === 0 ? 0 : 1);
