/**
 * স্ট্যান্ডঅ্যালোন HTML এক্সপোর্ট — একটি সেলফ-কনটেইনড HTML ফাইল
 * (কাস্টম নোড এক্সপ্যান্ড + প্রিন্ট CSS সহ)
 */

import type { DocumentSettings, PageData } from './types';
import { getPaperPreset, pageBorderVisual } from './paper';
import { parseMcqData } from './nodes-html';

const OPTION_LABELS = ['ক', 'খ', 'গ', 'ঘ'];

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** স্টোরেজ HTML → প্রদর্শনযোগ্য HTML (MCQ/TOC/ফুটনোট এক্সপ্যান্ড) */
function expandHtml(html: string): string {
  const dom = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
  const root = dom.getElementById('r');
  if (!root) return html;

  root.querySelectorAll('div.mcq-block').forEach((el) => {
    const data = parseMcqData(el as HTMLElement);
    const opts = data.options
      .map((opt, i) => `<span class="mcq-option${data.answer === i ? ' mcq-answer' : ''}"><b>(${OPTION_LABELS[i]})</b> ${escapeHtml(opt) || '—'}</span>`)
      .join('');
    const inner = `<div class="mcq-head"><span class="mcq-tag">প্রশ্ন</span></div>` +
      `<p class="mcq-question">${escapeHtml(data.question)}</p>` +
      `<div class="mcq-options">${opts}</div>` +
      (data.explanation ? `<p class="mcq-expl">💡 ${escapeHtml(data.explanation)}</p>` : '');
    el.innerHTML = inner;
  });

  root.querySelectorAll('div.toc-block').forEach((el) => {
    let entries: Array<{ text: string; level: number; pageNumber: string }> = [];
    try {
      const parsed: unknown = JSON.parse(el.getAttribute('data-entries') ?? '[]');
      if (Array.isArray(parsed)) entries = parsed as typeof entries;
    } catch { /* উপেক্ষা */ }
    const list = entries
      .map((e) => `<li class="toc-entry toc-level-${e.level}"><span class="toc-text">${escapeHtml(e.text)}</span><span class="toc-dots"></span><span class="toc-page">${e.pageNumber}</span></li>`)
      .join('');
    el.innerHTML = `<div class="toc-head"><span class="toc-title">${escapeHtml(el.getAttribute('data-title') ?? 'সূচিপত্র')}</span></div><ol class="toc-list">${list}</ol>`;
  });

  root.querySelectorAll('sup.footnote').forEach((el) => {
    const note = el.getAttribute('data-note') ?? '';
    el.setAttribute('title', note);
    el.textContent = '▾';
  });

  return root.innerHTML;
}

const EXPORT_CSS = `
* { box-sizing: border-box; }
body { margin: 0; background: #e2e8f0; font-family: 'Noto Sans Bengali', sans-serif; }
.book { padding: 24px 0 60px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
.page { background: #fff; box-shadow: 0 2px 14px rgba(0,0,0,.14); overflow: hidden; position: relative; }
.paper-white { background: #fff; color: #0f172a; }
.paper-cream { background: #fbf4e2; color: #33261a; }
.paper-dark { background: #16233a; color: #e2e8f0; }
.paper-inner { display: flex; flex-direction: column; height: 100%; }
.page-content { flex: 1; min-height: 0; padding: 14px 18px; overflow: hidden; }
.page-content-text { height: 100%; overflow: hidden; }
h1 { font-size: 1.7em; margin: .5em 0 .4em; }
h2 { font-size: 1.35em; margin: .9em 0 .4em; }
h3 { font-size: 1.12em; margin: .8em 0 .35em; }
p { margin: 0 0 var(--p-gap, 8px); }
table { border-collapse: collapse; width: 100%; margin: 10px 0; }
th, td { border: 1px solid #94a3b8; padding: 6px 10px; text-align: left; vertical-align: top; }
th { background: rgba(100,116,139,.14); }
blockquote { border-left: 3px solid #94a3b8; margin: 8px 0; padding: 2px 14px; color: #475569; font-style: italic; }
img { max-width: 100%; }
ul, ol { margin: 0 0 var(--p-gap, 8px); padding-left: 26px; }
.header, .footer { text-align: center; font-size: 10pt; }
.fancy-divider { border: none; text-align: center; margin: 14px auto; height: 24px; position: relative; }
.fancy-divider[data-style="single"]::after { content: "———"; letter-spacing: 4px; color: #94a3b8; }
.fancy-divider[data-style="double"] { border-top: 3px double #94a3b8; }
.fancy-divider[data-style="dotted"] { border-top: 2px dotted #94a3b8; }
.fancy-divider[data-style="flourish"]::after { content: "❦ ─── ❖ ─── ❦"; color: #94a3b8; }
.callout-box { border-radius: 10px; padding: 12px 16px; margin: 12px 0; }
.callout-concept { background: rgba(79,70,229,.08); border-left: 4px solid #4f46e5; }
.callout-warning { background: rgba(220,38,38,.07); border-left: 4px solid #dc2626; }
.callout-formula { background: rgba(22,163,74,.08); border-left: 4px solid #16a34a; }
.callout-note { background: rgba(100,116,139,.08); border-left: 4px solid #64748b; }
.callout-head { margin-bottom: 4px; font-weight: 700; }
.mcq-block { border: 1.5px solid rgba(100,116,139,.4); border-radius: 12px; padding: 12px 16px; margin: 12px 0; }
.mcq-tag { background: #4f46e5; color: #fff; font-size: .78em; padding: 2px 10px; border-radius: 999px; font-weight: 700; }
.mcq-options { display: flex; flex-wrap: wrap; gap: 4px 28px; margin-top: 6px; }
.mcq-answer { background: rgba(22,163,74,.14); padding: 0 6px; border-radius: 6px; }
.toc-list { list-style: none; padding: 0; }
.toc-entry { display: flex; gap: 8px; align-items: baseline; margin: 6px 0; }
.toc-level-2 { padding-left: 20px; } .toc-level-3 { padding-left: 40px; }
.toc-dots { flex: 1; border-bottom: 2px dotted #94a3b8; }
@media print {
  body { background: #fff; }
  .book { padding: 0; gap: 0; }
  .page { box-shadow: none; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
}
`;

export function buildStandaloneHtml(title: string, settings: DocumentSettings, pages: PageData[]): string {
  const preset = getPaperPreset(settings.paperSize);
  const size = settings.paperSize === 'custom'
    ? { w: settings.customPaper.widthMm, h: settings.customPaper.heightMm }
    : { w: preset.widthMm, h: preset.heightMm };
  const portrait = settings.orientation === 'portrait';
  const w = portrait ? size.w : size.h;
  const h = portrait ? size.h : size.w;
  const m = settings.margins;
  const gutter = m.gutter;

  const pageHtmls = pages.map((page, index) => {
    const side = settings.pageNumber.oddEven && index % 2 === 1 ? 'right' : 'left';
    const leftM = side === 'left' ? m.left + gutter : m.left;
    const rightM = side === 'right' ? m.right + gutter : m.right;
    const padding = `${m.top}in ${rightM}in ${m.bottom}in ${leftM}in`;

    if (page.kind === 'cover' && page.coverData) {
      const c = page.coverData;
      return `<div class="page paper-${settings.paperColor}" style="width:${w}mm;height:${h}mm">
        <div class="paper-inner" style="padding:${padding}">
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:10px;border:4px double ${c.accentColor}">
            <div style="font-size:22pt;color:${c.accentColor}">❦ ─── ❖ ─── ❦</div>
            <p style="font-size:14pt">${escapeHtml(c.organization)}</p>
            <h1 style="font-size:34pt;color:${c.accentColor};margin:6px 0">${escapeHtml(c.title)}</h1>
            ${c.subtitle ? `<p style="font-size:16pt">${escapeHtml(c.subtitle)}</p>` : ''}
            <p style="font-size:13pt">${escapeHtml(c.course)}</p>
            <div style="font-size:22pt;color:${c.accentColor}">❧ ─── ❖ ─── ❧</div>
          </div>
          <div style="text-align:center"><p>${escapeHtml(c.author)}</p><p>${escapeHtml(c.year)}</p></div>
        </div>
      </div>`;
    }

    let footerHtml = '';
    const pn = settings.pageNumber;
    if (pn.enabled && !(pn.differentFirst && index === 0) && !page.noChrome) {
      const num = pn.startAt + index;
      const text = pn.format === 'bangla' ? toBn(num) : pn.format === 'roman' ? romanize(num) : String(num);
      footerHtml = `<div class="footer" style="color:${settings.footer.accentColor}">${pn.prefix ? escapeHtml(pn.prefix) : ''}${text}</div>`;
    }
    let headerHtml = '';
    if (settings.header.enabled && settings.header.style !== 'none' && !(pn.differentFirst && index === 0) && !page.noChrome) {
      const hh = settings.header;
      if (hh.style === 'parallel') {
        headerHtml = `<div class="header" style="color:${hh.accentColor};border-top:3px double ${hh.accentColor};border-bottom:3px double ${hh.accentColor};padding:2px 0;display:flex;justify-content:space-between"><span>${escapeHtml(hh.leftText)}</span><span>${escapeHtml(hh.rightText)}</span></div>`;
      } else if (hh.style === 'royal') {
        headerHtml = `<div class="header" style="color:${hh.accentColor}"><div>❦ ${escapeHtml(hh.centerText || hh.leftText)} ❦</div><div style="border-bottom:1px solid ${hh.accentColor}"></div></div>`;
      } else {
        headerHtml = `<div class="header" style="color:${hh.accentColor};border-bottom:1px solid ${hh.accentColor};display:flex;justify-content:space-between"><span>${escapeHtml(hh.leftText)}</span><span>${escapeHtml(hh.rightText)}</span></div>`;
      }
    }

    // পেজ বর্ডার — অ্যাপের মতো একই কনফিগ (রং/স্টাইল/প্রস্থ) pageBorderVisual থেকে
    const bv = pageBorderVisual(settings);
    const borderCss = `${bv.border ? `border:${bv.border};` : ''}${bv.boxShadow ? `box-shadow:${bv.boxShadow};` : ''}`;

    return `<div class="page paper-${settings.paperColor}" style="width:${w}mm;height:${h}mm">
      <div class="paper-inner" style="padding:${padding}">
        ${headerHtml}
        <div class="page-content" style="${borderCss}">
          <div class="page-content-text" style="font-family:'${settings.defaultFont}';font-size:${settings.defaultFontSize}pt;line-height:${settings.lineHeight}">${expandHtml(page.html)}</div>
        </div>
        ${footerHtml}
      </div>
    </div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&family=Noto+Sans+Bengali:wght@400;600;700&family=Hind+Siliguri:wght@400;600;700&family=Tiro+Bangla&family=Baloo+Da+2&family=Atma&family=Mina&display=swap" rel="stylesheet">
<link href="https://fonts.maateen.me/kalpurush/font.css" rel="stylesheet">
<link href="https://fonts.maateen.me/solaimanlipi/font.css" rel="stylesheet">
<style>${EXPORT_CSS}</style>
<style>
  :root { --p-gap: ${settings.paragraphSpacing}px; }
  @page { size: ${w}mm ${h}mm; margin: 0; }
</style>
</head>
<body>
<div class="book">
${pageHtmls}
</div>
</body>
</html>`;
}

function toBn(n: number): string {
  return String(n).replace(/[0-9]/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);
}

function romanize(n: number): string {
  const map: Array<[number, string]> = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let num = n; let out = '';
  for (const [v, s] of map) { while (num >= v) { out += s; num -= v; } }
  return out;
}

export function downloadHtmlBackup(title: string, settings: DocumentSettings, pages: PageData[]): void {
  const html = buildStandaloneHtml(title, settings, pages);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[\\/:*?"<>|]/g, '_')}.html`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
