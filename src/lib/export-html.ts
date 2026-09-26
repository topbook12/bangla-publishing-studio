/**
 * স্ট্যানডঅ্যালোন HTML এক্সপোর্ট — একটি সেলফ-কনটেইনড HTML ফাইল
 * (কাস্টম নোড এক্সপ্যান্ড + প্রিন্ট CSS সহ)
 *
 * WYSIWYG চুক্তি (অ্যাপের page-chrome.tsx / cover-view.tsx / globals.css-এর সাথে
 * হুবহু মিল রাখা হয়েছে):
 *  - হেডার/ফুটার: parallel/royal/academic/plain স্টাইল, অজর-জোড় মিররিং,
 *    centerFallback, per-page override, ফন্ট সাইজ
 *  - পৃষ্ঠা নম্বর: position (top/bottom × left/center/right), prefix, বাংলা/রোমান ফরম্যাট,
 *    differentFirst, noChrome, কভার পাতায় লুকানো
 *  - কভার: classic/modern/coaching তিন ডিজাইনই অ্যাপের মতো
 *  - কাগজের রং/বর্ডার/মার্জিন/gutter: অ্যাপের সাথে ১:১
 *  - ফুটনোট: ▾ গ্লিফ + স্বয়ংক্রিয় নম্বর (CSS counter — প্রিন্টে গ্লিফ লুকানো)
 *  - প্রিন্টে রং হুবহু থাকে (print-color-adjust: exact)
 */

import type { DocumentSettings, HeaderFooterSettings, PageData, PageNumberSettings } from './types';
import { getPaperPreset, pageBorderVisual } from './paper';
import { parseMcqData, docBoxStyleText, type DocBoxAttrs, type DocBoxVariant } from './nodes-html';
import { formatPageNumber } from './bangla';

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

  // ডিজাইন বক্স — data attrs থেকে ইনলাইন স্টাইল
  root.querySelectorAll('div.doc-textbox').forEach((el) => {
    const attrs: Partial<DocBoxAttrs> & { variant: DocBoxVariant } = {
      variant: ((el.getAttribute('data-variant') ?? 'rounded') as DocBoxVariant),
      border: el.getAttribute('data-border') ?? undefined,
      fill: el.getAttribute('data-fill') ?? undefined,
      bstyle: (el.getAttribute('data-bstyle') ?? undefined) as DocBoxAttrs['bstyle'],
      bwidth: el.getAttribute('data-bwidth') ? Number(el.getAttribute('data-bwidth')) : undefined,
    };
    const css = docBoxStyleText(attrs);
    el.setAttribute('style', css);
  });

  // ফুটনোট — অ্যাপের মতোই: CSS কাউন্টারে নম্বর দেখায়, title-এ পূর্ণ লেখা
  root.querySelectorAll('sup.footnote').forEach((el) => {
    const note = el.getAttribute('data-note') ?? '';
    el.setAttribute('title', note);
  });

  return root.innerHTML;
}

const EXPORT_CSS = `
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; background: #e2e8f0; font-family: 'Hind Siliguri', 'Noto Sans Bengali', sans-serif; }
.book { padding: 24px 0 60px; display: flex; flex-direction: column; align-items: center; gap: 24px; }
.page { background: #fff; box-shadow: 0 2px 14px rgba(0,0,0,.14); overflow: hidden; position: relative; }
.paper-white { background: #ffffff; color: #0f172a; }
.paper-cream { background: #faf3e0; color: #33261a; }
.paper-dark { background: #1c2a3f; color: #e2e8f0; }
.paper-inner { display: flex; flex-direction: column; height: 100%; }
/* অ্যাপের .page-content-এর সাথে হুবহু এক প্যাডিং — নইলে লাইন-র‍্যাপ বদলে যায় */
.page-content { flex: 1; min-height: 0; padding: 10px 14px; overflow: hidden; border-radius: 2px; }
.page-content-text { height: 100%; counter-reset: bwp-footnote; }
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
.fancy-divider { border: none; text-align: center; margin: 14px auto; height: 24px; position: relative; }
.fancy-divider[data-style="single"]::after { content: "———"; letter-spacing: 4px; color: #94a3b8; }
.fancy-divider[data-style="double"] { border-top: 3px double #94a3b8; }
.fancy-divider[data-style="dotted"] { border-top: 2px dotted #94a3b8; }
.fancy-divider[data-style="flourish"]::after { content: "❦ ─── ❖ ─── ❦"; color: #94a3b8; }
.fancy-divider[data-style="stars"]::after { content: "✦ ─── ✦ ─── ✦"; color: #94a3b8; }
.fancy-divider[data-style="cut"]::after { content: "✂ ─ ─ ─ ─ ─ ─ ─"; color: #94a3b8; letter-spacing: 2px; }
.callout-box { border-radius: 10px; padding: 12px 16px; margin: 12px 0; }
.callout-concept { background: rgba(79,70,229,.08); border-left: 4px solid #4f46e5; }
.callout-warning { background: rgba(220,38,38,.07); border-left: 4px solid #dc2626; }
.callout-formula { background: rgba(22,163,74,.08); border-left: 4px solid #16a34a; }
.callout-note { background: rgba(100,116,139,.08); border-left: 4px solid #64748b; }
.callout-head { margin-bottom: 4px; font-weight: 700; }
.doc-icon { display: inline-flex; line-height: 0; vertical-align: -0.16em; }
.doc-icon svg, span.doc-icon svg { width: 100%; height: 100%; }
.doc-textbox { position: relative; }
.doc-textbox p { margin: 0.1em 0; }
.mcq-block { border: 1.5px solid rgba(100,116,139,.4); border-radius: 12px; padding: 12px 16px; margin: 12px 0; }
.mcq-tag { background: #4f46e5; color: #fff; font-size: .78em; padding: 2px 10px; border-radius: 999px; font-weight: 700; }
.mcq-options { display: flex; flex-wrap: wrap; gap: 4px 28px; margin-top: 6px; }
.mcq-answer { background: rgba(22,163,74,.14); padding: 0 6px; border-radius: 6px; }
.toc-list { list-style: none; padding: 0; }
.toc-entry { display: flex; gap: 8px; align-items: baseline; margin: 6px 0; }
.toc-level-2 { padding-left: 20px; } .toc-level-3 { padding-left: 40px; }
.toc-dots { flex: 1; border-bottom: 2px dotted #94a3b8; }

/* ─── ফুটনোট — অ্যাপের মতো CSS কাউন্টার (globals.css ১১৬৮-১১৭৭) ─── */
sup.footnote { counter-increment: bwp-footnote; font-size: .72em; line-height: 0; }
sup.footnote::before { content: counter(bwp-footnote); font-weight: 700; }
sup.footnote > span { display: none; }

/* ─── হেডার/ফুটার — page-chrome.tsx-এর রেন্ডারের সাথে ১:১ ─── */
.page-header { flex-shrink: 0; }
.page-footer { flex-shrink: 0; }
.hdr-parallel { font-size: 1em; }
.hdr-parallel-line { border-top-width: 3px; border-top-style: double; }
.hdr-parallel-row { display: flex; justify-content: space-between; align-items: center; padding: 2px 2px; gap: 10px; }
.hdr-parallel-left { font-weight: 700; }
.hdr-parallel-right { font-weight: 600; text-align: right; }
.hdr-royal { text-align: center; }
.hdr-royal-row { display: flex; align-items: center; justify-content: center; gap: 10px; padding-bottom: 2px; }
.hdr-royal-flourish { font-size: 0.9em; }
.hdr-royal-title { font-weight: 700; letter-spacing: 0.02em; }
.hdr-royal-line { border-top: 1px solid; }
.hdr-academic { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1.5px solid; padding-bottom: 2px; }
.hdr-academic-left { font-weight: 700; }
.hdr-academic-right { font-size: 0.92em; opacity: 0.85; }
.hdr-plain { text-align: center; font-weight: 600; }
.page-number { font-weight: 700; white-space: nowrap; }
.page-number-prefix { font-weight: 500; opacity: 0.8; }
.page-number-overlay { text-align: center; font-size: 0.85em; padding-top: 2px; }
.ftr-parallel { display: flex; justify-content: space-between; border-top: 1px solid; padding-top: 2px; gap: 10px; }
.ftr-royal { text-align: center; }
.ftr-royal-row { display: flex; align-items: center; justify-content: center; gap: 12px; padding-top: 3px; }
.ftr-academic { display: flex; justify-content: space-between; align-items: baseline; border-top: 1.5px solid; padding-top: 2px; }
.ftr-plain { display: flex; justify-content: center; align-items: baseline; gap: 8px; }

/* ─── কভার — cover-view.tsx + globals.css-এর সাথে ১:১ ─── */
.cover { flex: 1; min-height: 0; display: flex; flex-direction: column; text-align: center; }
.cover-title { font-size: 2.3em; font-weight: 800; line-height: 1.3; margin: 0.25em 0; }
.cover-subtitle { font-size: 1.1em; opacity: 0.85; margin: 0.2em 0 0.6em; }
.cover-org { font-size: 1em; font-weight: 700; opacity: 0.9; margin: 0.3em 0; }
.cover-course { font-size: 0.95em; margin: 0.4em 0; }
.cover-footer { padding-top: 10px; display: flex; flex-direction: column; gap: 2px; }
.cover-author { font-weight: 700; font-size: 1em; }
.cover-year { font-size: 0.85em; opacity: 0.7; }
.cover-classic { justify-content: center; gap: 12px; }
.cover-classic-inner { border: 3px double var(--cover-accent, #4f46e5); border-radius: 6px; padding: 28px 18px; display: flex; flex-direction: column; gap: 6px; align-items: center; }
.cover-classic-ornament { font-size: 0.9em; letter-spacing: 2px; }
.cover-classic-divider { width: 120px; height: 2px; }
.cover-modern { background: var(--cover-accent, #4f46e5); color: #fff; }
.cover-modern-band { height: 14px; background: rgba(255,255,255,0.25); }
.cover-modern-body { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 8px; padding: 20px; }
.cover-modern .cover-org { text-transform: uppercase; letter-spacing: 0.14em; font-size: 0.85em; }
.cover-modern .cover-title { font-size: 2.5em; }
.cover-modern-rule { width: 90px; height: 4px; border-radius: 2px; background: rgba(255,255,255,0.6); }
.cover-modern .cover-course { opacity: 0.9; }
.cover-modern .cover-footer { background: rgba(255,255,255,0.12); padding: 14px; }
.cover-coaching { justify-content: center; gap: 14px; }
.cover-coaching-frame { border: 3px solid; border-radius: 14px; padding: 26px 18px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.cover-org-badge { color: #fff; font-weight: 800; padding: 5px 18px; border-radius: 999px; font-size: 0.9em; }
.cover-coaching .cover-course { font-weight: 800; font-size: 1.05em; }
.cover-coaching-deco { letter-spacing: 6px; }

/* প্রিন্টে কনটেন্ট ভেঙে যাওয়া রোধ */
table { page-break-inside: auto; break-inside: auto; }
tr, thead, tbody { page-break-inside: avoid; break-inside: avoid; }
th, td { word-break: break-word; overflow-wrap: anywhere; }
.callout-box, .mcq-block, .toc-block, .doc-textbox { page-break-inside: avoid; break-inside: avoid; }
.doc-shape { page-break-inside: avoid; break-inside: avoid; position: relative; }
.doc-shape-content p { margin: 0.15em 0; }
.doc-shape-orn { pointer-events: none; }
img { page-break-inside: avoid; break-inside: avoid; }
h1, h2, h3, h4 { page-break-after: avoid; break-after: avoid; }
@media print {
  body { background: #fff; }
  .book { padding: 0; gap: 0; }
  .page { box-shadow: none; page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  sup.footnote > span { display: none !important; }
}
`;

/** অজর-জোড় মিররিং — page-chrome.tsx mirrorIfEven-এর সাথে মিল রেখে (startAt-সচেতন) */
function mirrorIfEven(index: number, oddEven: boolean, startAt: number): boolean {
  return oddEven && (startAt + index) % 2 === 0;
}

/** centerFallback — plain/royal-এর কেন্দ্রীয় টেক্সট (page-chrome.tsx-এর সাথে মিল রেখে) */
function centerFallback(hf: HeaderFooterSettings, mirrored: boolean): string {
  if (hf.centerText) return hf.centerText;
  if (mirrored) return hf.rightText || hf.leftText;
  return hf.leftText || hf.rightText;
}

/** প্রদর্শিত পৃষ্ঠা নম্বর — pagenum.ts displayPageNumber-এর সাথে মিল রেখে */
function displayNumber(index: number, pn: PageNumberSettings): string {
  if (!pn.enabled) return '';
  if (pn.differentFirst && index === 0) return '';
  return formatPageNumber(pn.startAt + index, pn.format);
}

function numberSpan(num: string, pn: PageNumberSettings, accent: string): string {
  if (!num) return '';
  const prefix = pn.prefix ? `<span class="page-number-prefix">${escapeHtml(pn.prefix)}</span>` : '';
  return `<span class="page-number" style="color:${accent}">${prefix}${num}</span>`;
}

/** হেডার/ফুটার HTML — অ্যাপের PageHeader/PageFooter-এর হুবহু সমতুল্য */
function chromeHtml(
  page: PageData,
  index: number,
  settings: DocumentSettings,
): { headerHtml: string; footerHtml: string } {
  const pn = settings.pageNumber;
  // কভার/নো-ক্রোম/প্রথম পৃষ্ঠা (differentFirst) — কিছুই দেখানো হয় না
  if (page.kind === 'cover' || page.noChrome || (pn.differentFirst && index === 0)) {
    return { headerHtml: '', footerHtml: '' };
  }

  const mirrored = mirrorIfEven(index, pn.oddEven, pn.startAt);
  const hfH = page.headerOverride ?? settings.header;
  const hfF = page.footerOverride ?? settings.footer;
  const num = displayNumber(index, pn);
  const numAlign = pn.position.endsWith('left') ? 'left' : pn.position.endsWith('right') ? 'right' : 'center';
  const numInHeader = pn.enabled && pn.position.startsWith('top');
  const numInFooter = pn.enabled && pn.position.startsWith('bottom');

  // ─── হেডার ───
  // অ্যাপের PageHeader-এর মতো: style 'none' বা বন্ধ হলে হেডার সম্পূর্ণ বাদ
  // (আগে বন্ধ হলেও top-নম্বর এক্সপোর্টে দেখাত — স্ক্রিনের সাথে অমিল)
  const headerOff = !hfH.enabled || hfH.style === 'none';
  let headerHtml = '';
  if (!headerOff) {
    const accent = hfH.accentColor;
    const L = mirrored ? hfH.rightText : hfH.leftText;
    const R = mirrored ? hfH.leftText : hfH.rightText;
    switch (hfH.style) {
      case 'parallel':
        headerHtml = `<div class="hdr-parallel" style="color:${accent};font-size:${hfH.fontSize}pt">` +
          `<div class="hdr-parallel-line" style="border-color:${accent}"></div>` +
          `<div class="hdr-parallel-row"><span class="hdr-parallel-left">${escapeHtml(L)}</span><span class="hdr-parallel-right">${escapeHtml(R)}</span></div>` +
          `<div class="hdr-parallel-line" style="border-color:${accent}"></div></div>`;
        break;
      case 'royal': {
        const title = centerFallback(hfH, mirrored);
        headerHtml = `<div class="hdr-royal" style="color:${accent};font-size:${hfH.fontSize}pt">` +
          `<div class="hdr-royal-row"><span class="hdr-royal-flourish" style="color:${accent}">❦</span>` +
          `<span class="hdr-royal-title">${escapeHtml(title)}</span>` +
          `<span class="hdr-royal-flourish" style="color:${accent}">❦</span></div>` +
          `<div class="hdr-royal-line" style="border-color:${accent}"></div></div>`;
        break;
      }
      case 'academic':
        headerHtml = `<div class="hdr-academic" style="border-color:${accent};font-size:${hfH.fontSize}pt">` +
          `<span class="hdr-academic-left">${escapeHtml(L)}</span><span class="hdr-academic-right">${escapeHtml(R)}</span></div>`;
        break;
      case 'plain': {
        const center = centerFallback(hfH, mirrored);
        if (center) {
          headerHtml = `<div class="hdr-plain" style="font-size:${hfH.fontSize}pt">${escapeHtml(center)}</div>`;
        }
        break;
      }
      default:
        break;
    }
  }
  // হেডারে নম্বর (top পজিশন) — plain হলে নম্বর হেডারের সাথেই;
  // হেডার বন্ধ/নেই হলে অ্যাপের PageHeader পুরোপুরি null দেয় — এক্সপোর্টও তাই
  if (numInHeader && num && !headerOff) {
    const nHtml = numberSpan(num, pn, hfH.accentColor);
    if (hfH.style === 'plain') {
      headerHtml = `<div class="page-header" style="text-align:${numAlign}">${headerHtml}<div style="font-size:${hfH.fontSize}pt">${nHtml}</div></div>`;
    } else {
      headerHtml = `<div class="page-header" style="font-size:${hfH.fontSize}pt">${headerHtml}<div class="page-number-overlay" style="text-align:${numAlign}">${nHtml}</div></div>`;
    }
  } else if (headerHtml) {
    headerHtml = `<div class="page-header" style="font-size:${hfH.fontSize}pt">${headerHtml}</div>`;
  }

  // ─── ফুটার ───
  let footerInner = '';
  // অ্যাপের PageFooter-এর মতো: style 'none' হলে ফুটার-বার বন্ধ,
  // শুধু bottom-নম্বর (চালু থাকলে) দেখায়
  const footerOff = !hfF.enabled || hfF.style === 'none';
  if (!footerOff) {
    const accent = hfF.accentColor;
    const L = mirrored ? hfF.rightText : hfF.leftText;
    const R = mirrored ? hfF.leftText : hfF.rightText;
    const nHtml = numberSpan(num, pn, accent);
    switch (hfF.style) {
      case 'royal':
        footerInner = `<div class="ftr-royal" style="color:${accent}">` +
          `<div class="hdr-royal-line" style="border-color:${accent}"></div>` +
          `<div class="ftr-royal-row"><span class="hdr-royal-flourish" style="color:${accent}">❧</span>${nHtml}<span class="hdr-royal-flourish" style="color:${accent}">❧</span></div></div>`;
        break;
      case 'academic': {
        const cells = numInFooter && nHtml
          ? (numAlign === 'left' ? [nHtml, escapeHtml(L), escapeHtml(R)]
            : numAlign === 'right' ? [escapeHtml(L), escapeHtml(R), nHtml]
              : [escapeHtml(L), nHtml, escapeHtml(R)])
          : [escapeHtml(L), escapeHtml(R)];
        footerInner = `<div class="ftr-academic" style="border-color:${accent}">` +
          (numInFooter && numAlign === 'center'
            ? `<span>${cells[0]}</span><span class="page-number-cell" style="flex:1;text-align:center">${cells[1]}</span><span>${cells[2]}</span>`
            : cells.join('')) + `</div>`;
        break;
      }
      case 'parallel': {
        const cells = numInFooter && nHtml
          ? (numAlign === 'left' ? [nHtml, escapeHtml(L), escapeHtml(R)]
            : numAlign === 'right' ? [escapeHtml(L), escapeHtml(R), nHtml]
              : [escapeHtml(L), nHtml, escapeHtml(R)])
          : [escapeHtml(L), escapeHtml(R)];
        footerInner = `<div class="ftr-parallel" style="border-color:${accent}">` +
          (numInFooter && numAlign === 'center'
            ? `<span>${cells[0]}</span><span style="flex:1;text-align:center">${cells[1]}</span><span>${cells[2]}</span>`
            : cells.join('')) + `</div>`;
        break;
      }
      case 'plain': {
        const center = centerFallback(hfF, mirrored);
        const justify = !center ? (numAlign === 'left' ? 'flex-start' : numAlign === 'right' ? 'flex-end' : 'center') : 'center';
        footerInner = `<div class="ftr-plain" style="justify-content:${justify}">${center ? `<span>${escapeHtml(center)}</span>` : ''}${numInFooter ? nHtml : ''}</div>`;
        break;
      }
      default:
        break;
    }
  }
  if (!footerInner && numInFooter && num) {
    // ফুটার বন্ধ/নেই কিন্তু নম্বর bottom-এ চাই — অ্যাপের PageFooter-এর ফলব্যাকের মতোই
    const justify = numAlign === 'left' ? 'flex-start' : numAlign === 'right' ? 'flex-end' : 'center';
    footerInner = `<div class="ftr-plain" style="justify-content:${justify}">${numberSpan(num, pn, hfF.accentColor)}</div>`;
  }
  const footerHtml = footerInner
    ? `<div class="page-footer" style="font-size:${hfF.fontSize}pt">${footerInner}</div>`
    : '';

  return { headerHtml, footerHtml };
}

/** কভার পাতার HTML — cover-view.tsx-এর তিন ডিজাইনের হুবহু সমতুল্য */
function coverHtml(coverData: NonNullable<PageData['coverData']>, settings: DocumentSettings): string {
  const c = coverData;
  const accent = c.accentColor;
  const fontOpen = `font-family:'Noto Serif Bengali',serif;--cover-accent:${accent}`;
  if (c.style === 'modern') {
    return `<div class="cover cover-modern" style="${fontOpen}">
      <div class="cover-modern-band" style="background-color:${accent}"></div>
      <div class="cover-modern-body">
        <p class="cover-org">${escapeHtml(c.organization)}</p>
        <h1 class="cover-title">${escapeHtml(c.title || 'বইয়ের নাম')}</h1>
        ${c.subtitle ? `<p class="cover-subtitle">${escapeHtml(c.subtitle)}</p>` : ''}
        <div class="cover-modern-rule" style="background-color:${accent}"></div>
        <p class="cover-course">${escapeHtml(c.course)}</p>
      </div>
      <div class="cover-footer">
        <p class="cover-author">${c.author ? `সংকলন: ${escapeHtml(c.author)}` : ''}</p>
        <p class="cover-year">${escapeHtml(c.year)}</p>
      </div>
    </div>`;
  }
  if (c.style === 'coaching') {
    return `<div class="cover cover-coaching" style="${fontOpen}">
      <div class="cover-coaching-frame" style="border-color:${accent}">
        <p class="cover-org-badge" style="background-color:${accent}">${escapeHtml(c.organization)}</p>
        <h1 class="cover-title">${escapeHtml(c.title || 'গাইড')}</h1>
        ${c.subtitle ? `<p class="cover-subtitle">${escapeHtml(c.subtitle)}</p>` : ''}
        <p class="cover-course" style="color:${accent}">${escapeHtml(c.course)}</p>
        <div class="cover-coaching-deco" style="color:${accent}">✦ ❖ ✦</div>
      </div>
      <div class="cover-footer">
        <p class="cover-author">${c.author ? `লিখেছেন: ${escapeHtml(c.author)}` : ''}</p>
        <p class="cover-year">${escapeHtml(c.year)}</p>
      </div>
    </div>`;
  }
  // classic
  return `<div class="cover cover-classic" style="${fontOpen}">
    <div class="cover-classic-inner">
      <div class="cover-classic-ornament" style="color:${accent}">❦ ─── ❖ ─── ❦</div>
      <p class="cover-org">${escapeHtml(c.organization)}</p>
      <h1 class="cover-title" style="color:${accent}">${escapeHtml(c.title || 'বইয়ের নাম')}</h1>
      ${c.subtitle ? `<p class="cover-subtitle">${escapeHtml(c.subtitle)}</p>` : ''}
      <div class="cover-classic-divider" style="background-color:${accent}"></div>
      <p class="cover-course">${escapeHtml(c.course)}</p>
      <div class="cover-classic-ornament" style="color:${accent}">❧ ─── ❖ ─── ❧</div>
    </div>
    <div class="cover-footer">
      <p class="cover-author">${escapeHtml(c.author)}</p>
      <p class="cover-year">${escapeHtml(c.year)}</p>
    </div>
  </div>`;
}

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
    // gutter side — pagenum.ts gutterSide-এর সাথে মিল রেখে (startAt-সচেতন প্যারিটি)
    const startAt = settings.pageNumber.startAt;
    const side = settings.pageNumber.oddEven && (startAt + index) % 2 === 0 ? 'right' : 'left';
    const leftM = side === 'left' ? m.left + gutter : m.left;
    const rightM = side === 'right' ? m.right + gutter : m.right;
    const padding = `${m.top}in ${rightM}in ${m.bottom}in ${leftM}in`;

    // পেজ বর্ডার — অ্যাপের মতো একই কনফিগ (রং/স্টাইল/প্রস্থ) pageBorderVisual থেকে
    const bv = pageBorderVisual(settings);
    const borderCss = `${bv.border ? `border:${bv.border};` : ''}${bv.boxShadow ? `box-shadow:${bv.boxShadow};` : ''}`;

    const { headerHtml, footerHtml } = chromeHtml(page, index, settings);

    const contentInner = page.kind === 'cover' && page.coverData
      ? coverHtml(page.coverData, settings)
      : `<div class="page-content-text" style="font-family:'${settings.defaultFont}',sans-serif;font-size:${settings.defaultFontSize}pt;line-height:${settings.lineHeight};--p-gap:${settings.paragraphSpacing}px">${expandHtml(page.html)}</div>`;

    return `<div class="page paper-${settings.paperColor}" style="width:${w}mm;height:${h}mm">
      <div class="paper-inner" style="padding:${padding}">
        ${headerHtml}
        <div class="page-content" style="${borderCss}">${contentInner}</div>
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
<link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;600;700&family=Noto+Serif+Bengali:wght@400;600;700&family=Noto+Sans+Bengali:wght@400;600;700&family=Tiro+Bangla:ital@0;1&family=Baloo+Da+2:wght@400..800&family=Atma:wght@300..700&family=Anek+Bangla:wght@100..800&family=Galada&family=Mina&display=swap" rel="stylesheet">
<link href="https://fonts.maateen.me/kalpurush/font.css" rel="stylesheet">
<link href="https://fonts.maateen.me/solaimanlipi/font.css" rel="stylesheet">
<link href="https://fonts.maateen.me/siyam-rupali/font.css" rel="stylesheet">
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
