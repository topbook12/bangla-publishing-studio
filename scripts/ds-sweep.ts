/**
 * DS 全模板单元级回归 — 55 模板 × (默认值+示例值) × 全 styles
 * 检查：空 HTML / undefined|NaN 字样 / 标签不平衡 / 双重单位 bug（mmmm/inin）
 * 运行：bun scripts/ds-sweep.ts
 */
import { DS_TEMPLATES, dsDefaultValues, dsDemoValues, buildDsHtml, DS_CATEGORY_ORDER } from '../src/lib/document-studio';
import type { Lang } from '../src/lib/i18n/core';

const LANGS: Lang[] = ['bn', 'hi', 'en'];

interface Issue { tpl: string; style: string; lang: Lang; set: string; problem: string; }
const issues: Issue[] = [];

const tagBalance = (html: string): string | null => {
  for (const tag of ['div', 'table', 'tr', 'td', 'th', 'p', 'span', 'ul', 'ol', 'li', 'tbody', 'thead']) {
    const open = (html.match(new RegExp(`<${tag}(\\s|>)`, 'g')) ?? []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) ?? []).length;
    if (open !== close) return `${tag}: ${open} open vs ${close} close`;
  }
  return null;
};

const badString = (html: string): string | null => {
  if (/undefined/i.test(html)) return 'contains "undefined"';
  if (/\bNaN\b/.test(html)) return 'contains "NaN"';
  if (/mmmm/i.test(html)) return 'double-mm unit';
  if (/inin\b/i.test(html)) return 'double-in unit';
  if (/ptpt/i.test(html)) return 'double-pt unit';
  if (/style="[^"]*"[^>]*style="/i.test(html)) return 'duplicate style attr';
  return null;
};

let buildCount = 0;
for (const tpl of DS_TEMPLATES) {
  for (const lang of LANGS) {
    const sets: Array<[string, Record<string, string>]> = [
      ['default', dsDefaultValues(tpl, lang)],
      ['demo', dsDemoValues(tpl, lang)],
    ];
    for (const [setName, values] of sets) {
      for (const styleId of tpl.styles) {
        let html = '';
        try {
          html = buildDsHtml(tpl, values, lang, styleId);
        } catch (e) {
          issues.push({ tpl: tpl.id, style: styleId, lang, set: setName, problem: `THROW: ${e instanceof Error ? e.message.slice(0, 120) : String(e)}` });
          continue;
        }
        buildCount += 1;
        if (!html || html.trim().length < 20) {
          issues.push({ tpl: tpl.id, style: styleId, lang, set: setName, problem: `empty/too-short (${html.length} chars)` });
          continue;
        }
        const bad = badString(html);
        if (bad) issues.push({ tpl: tpl.id, style: styleId, lang, set: setName, problem: bad });
        const bal = tagBalance(html);
        if (bal) issues.push({ tpl: tpl.id, style: styleId, lang, set: setName, problem: `unbalanced ${bal}` });
      }
    }
  }
}

// 分类计数 sanity
const byCat: Record<string, number> = {};
for (const t of DS_TEMPLATES) byCat[t.category] = (byCat[t.category] ?? 0) + 1;
const catSummary = DS_CATEGORY_ORDER.map((c) => `${c}:${byCat[c] ?? 0}`).join(' ');

console.log(`templates: ${DS_TEMPLATES.length} | builds: ${buildCount} | styles per tpl: min=${Math.min(...DS_TEMPLATES.map(t => t.styles.length))} max=${Math.max(...DS_TEMPLATES.map(t => t.styles.length))}`);
console.log(`categories: ${catSummary}`);
if (issues.length === 0) {
  console.log('SWEEP CLEAN — 0 issues');
} else {
  console.log(`ISSUES: ${issues.length}`);
  for (const i of issues.slice(0, 60)) console.log(`  [${i.tpl}] style=${i.style} lang=${i.lang} set=${i.set} → ${i.problem}`);
  process.exit(1);
}
