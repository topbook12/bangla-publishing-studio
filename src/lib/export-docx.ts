/**
 * MS Word (.docx) এক্সপোর্টার — docx.js দিয়ে ব্রাউজারেই বিল্ড হয়।
 * প্রতিটি পৃষ্ঠার HTML পার্স করে Word প্যারাগ্রাফ/টেবিলে রূপান্তর করে।
 */

import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, Footer, Header, HeadingLevel, ImageRun,
  LevelFormat, PageBorderDisplay, PageBorderOffsetFrom, PageBorderZOrder,
  Packer, Paragraph, ShadingType, Table, TableCell,
  TableRow, TabStopType, TextRun, WidthType,
} from 'docx';
import type { DocumentSettings, HeaderFooterSettings, PageData } from './types';
import { effectivePageBorderStyle, effectivePageBorderWidth, getPaperPreset, PAGE_BORDER_WIDTH_PX } from './paper';
import { parseMcqData, docBoxInlineStyle, type DocBoxAttrs, type DocBoxVariant } from './nodes-html';
import { SHAPE_BY_ID, SHAPE_DEFS, readShapeAttrs } from './shape-catalog';
import { displayPageNumber } from './pagenum';

const MM_TO_TWIP = 56.6929;
const INCH_TO_TWIP = 1440;

interface Ctx {
  align?: (typeof AlignmentType)[keyof typeof AlignmentType];
  color?: string;
  bg?: string;
  bold?: boolean;
  italics?: boolean;
}

function hexNoHash(c: string | undefined): string | undefined {
  if (!c) return undefined;
  const h = c.trim().replace('#', '');
  return /^[0-9a-fA-F]{6}$/.test(h) ? h.toUpperCase() : undefined;
}

function parseInlineStyle(el: Element): Record<string, string> {
  const style = el.getAttribute('style') ?? '';
  const out: Record<string, string> = {};
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx > 0) {
      out[decl.slice(0, idx).trim().toLowerCase()] = decl.slice(idx + 1).trim();
    }
  }
  return out;
}

function alignmentOf(el: Element, ctx: Ctx): Ctx['align'] {
  const ta = parseInlineStyle(el)['text-align'] ?? el.getAttribute('data-align') ?? '';
  if (ta === 'center') return AlignmentType.CENTER;
  if (ta === 'right') return AlignmentType.RIGHT;
  if (ta === 'justify') return AlignmentType.JUSTIFIED;
  if (ta === 'left') return AlignmentType.LEFT;
  return ctx.align;
}

/** Word-এ আসল ক্লিকযোগ্য হাইপারলিংক (Hyperlink স্টাইল) */
function hyperlinkRun(href: string, text: string): ExternalHyperlink {
  return new ExternalHyperlink({
    link: href || '#',
    children: [new TextRun({ text, style: 'Hyperlink' })],
  });
}

/** ইনলাইন উপাদান থেকে TextRun তৈরি */
function inlineRuns(el: Element, ctx: Ctx): Array<TextRun | ExternalHyperlink> {
  const runs: Array<TextRun | ExternalHyperlink> = [];
  el.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text) {
        runs.push(new TextRun({
          text,
          bold: ctx.bold,
          italics: ctx.italics,
          color: ctx.color,
          shading: ctx.bg ? { type: ShadingType.CLEAR, fill: ctx.bg } : undefined,
        }));
      }
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const c = child as Element;
    const style = parseInlineStyle(c);
    const childCtx: Ctx = {
      ...ctx,
      color: hexNoHash(style['color']) ?? ctx.color,
      bg: hexNoHash(style['background-color'] ?? style['background']) ?? ctx.bg,
      bold: ctx.bold || c.tagName === 'B' || c.tagName === 'STRONG',
      italics: ctx.italics || c.tagName === 'I' || c.tagName === 'EM',
      align: ctx.align,
    };

    switch (c.tagName) {
      case 'B': case 'STRONG':
        runs.push(...inlineRuns(c, { ...childCtx, bold: true }));
        break;
      case 'I': case 'EM':
        runs.push(...inlineRuns(c, { ...childCtx, italics: true }));
        break;
      case 'U':
        c.childNodes.forEach((gc) => {
          if (gc.nodeType === Node.TEXT_NODE && gc.textContent) {
            runs.push(new TextRun({ text: gc.textContent, bold: childCtx.bold, italics: childCtx.italics, color: childCtx.color, underline: {} }));
          }
        });
        break;
      case 'S': case 'STRIKE': case 'DEL':
        c.childNodes.forEach((gc) => {
          if (gc.nodeType === Node.TEXT_NODE && gc.textContent) {
            runs.push(new TextRun({ text: gc.textContent, strike: true, color: childCtx.color }));
          }
        });
        break;
      case 'BR':
        runs.push(new TextRun({ break: 1 }));
        break;
      case 'SUP': {
        if (c.classList.contains('footnote')) {
          const idx = footnoteIndexOf(c);
          runs.push(new TextRun({ text: String(idx), superScript: true, bold: true, color: childCtx.color }));
        } else {
          const text = c.textContent ?? '';
          if (text) runs.push(new TextRun({ text, superScript: true, color: childCtx.color }));
        }
        break;
      }
      case 'SUB': {
        const text = c.textContent ?? '';
        if (text) runs.push(new TextRun({ text, subScript: true, color: childCtx.color }));
        break;
      }
      case 'A': {
        const href = c.getAttribute('href') ?? '';
        const text = c.textContent ?? href;
        if (text) runs.push(hyperlinkRun(href, text));
        break;
      }
      case 'IMG': {
        const img = imageRunOf(c);
        if (img) {
          // ছবির লিংক — <a href><img></a> আকারে থাকলে Word-এ ক্লিকযোগ্য ছবি
          const anchor = c.closest('a[href]');
          if (anchor) {
            runs.push(new ExternalHyperlink({
              link: anchor.getAttribute('href') || '#',
              children: [img],
            }));
          } else {
            runs.push(img);
          }
        }
        break;
      }
      default: {
        // SPAN, MARK ইত্যাদি
        if (c.tagName === 'IMG') { const img = imageRunOf(c); if (img) runs.push(img); break; }
        runs.push(...inlineRuns(c, childCtx));
      }
    }
  });
  return runs;
}

// ফুটনোট নম্বর ম্যাপিং — পেজ প্রসেসের সময় পূরণ হয়
let currentFootnotes: string[] = [];
function footnoteIndexOf(sup: Element): number {
  const note = sup.getAttribute('data-note') ?? '';
  const existing = currentFootnotes.indexOf(note);
  // আগের বাগ: প্রথমবার ঠিক ছিল (push → length = 1-based), কিন্তু একই নোট
  // দ্বিতীয়বার রেফারেন্স হলে indexOf (0-based) ফেরত দিত → "০" ছাপাত
  if (existing !== -1) return existing + 1;
  currentFootnotes.push(note);
  return currentFootnotes.length;
}

function imageRunOf(img: Element): ImageRun | null {
  const src = img.getAttribute('src') ?? '';
  if (!src.startsWith('data:')) return null;
  try {
    const mime = (src.slice(5, src.indexOf(';')) || 'image/png').toLowerCase();
    let type: 'png' | 'jpg' | 'gif' | 'bmp' = 'png';
    if (mime.includes('jpeg') || mime.includes('jpg')) type = 'jpg';
    else if (mime.includes('gif')) type = 'gif';
    else if (mime.includes('bmp')) type = 'bmp';
    const base64 = src.split(',')[1] ?? '';
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const width = Number(img.getAttribute('data-w') ?? img.getAttribute('width') ?? 420);
    const height = Number(img.getAttribute('data-h') ?? img.getAttribute('height') ?? 280);
    return new ImageRun({ data: bytes, type, transformation: { width, height } });
  } catch {
    return null;
  }
}

const CALLOUT_DOCX: Record<string, { fill: string; label: string }> = {
  concept: { fill: 'EEF2FF', label: 'মূল ধারণা' },
  warning: { fill: 'FEF2F2', label: 'সতর্কতা' },
  formula: { fill: 'F0FDF4', label: 'সূত্র' },
  note: { fill: 'F8FAFC', label: 'নোট' },
};

type DocxBlock = Paragraph | Table;

/** ব্লক উপাদান → Paragraph/Table অ্যারে */
function blockToDocx(el: Element, ctx: Ctx, settings: DocumentSettings): DocxBlock[] {
  const out: DocxBlock[] = [];
  const spacingAfter = Math.round(settings.paragraphSpacing * 0.75 * 20); // px → pt → twip
  const lineTwip = Math.round(settings.lineHeight * 240);

  switch (el.tagName) {
    case 'H1': case 'H2': case 'H3': case 'H4': {
      const level = el.tagName === 'H1' ? HeadingLevel.HEADING_1 : el.tagName === 'H2' ? HeadingLevel.HEADING_2 : el.tagName === 'H3' ? HeadingLevel.HEADING_3 : HeadingLevel.HEADING_4;
      out.push(new Paragraph({
        children: inlineRuns(el, { color: settings.header.accentColor.replace('#', '').toUpperCase() }),
        heading: level,
        alignment: alignmentOf(el, ctx),
        spacing: { after: 120, line: 300 },
      }));
      return out;
    }
    case 'P': {
      const runs = inlineRuns(el, { ...ctx, align: alignmentOf(el, ctx) });
      out.push(new Paragraph({
        children: runs.length ? runs : [new TextRun('')],
        alignment: alignmentOf(el, ctx),
        spacing: { after: spacingAfter, line: lineTwip },
      }));
      return out;
    }
    case 'UL': case 'OL': {
      Array.from(el.children).forEach((li) => {
        if (li.tagName !== 'LI') return;
        out.push(new Paragraph({
          children: inlineRuns(li, ctx),
          bullet: el.tagName === 'UL' ? { level: 0 } : undefined,
          numbering: el.tagName === 'OL' ? { reference: 'bwp-ordered', level: 0 } : undefined,
          spacing: { after: 60, line: lineTwip },
        }));
      });
      return out;
    }
    case 'BLOCKQUOTE':
      Array.from(el.children).forEach((inner) => {
        out.push(new Paragraph({
          children: inlineRuns(inner, { ...ctx, italics: true }),
          indent: { left: 480 },
          spacing: { after: 100 },
        }));
      });
      return out;
    case 'TABLE': {
      const rows: TableRow[] = [];
      Array.from(el.querySelectorAll('tr')).forEach((tr) => {
        const cells: TableCell[] = [];
        Array.from(tr.children).forEach((cell) => {
          const isHeader = cell.tagName === 'TH';
          const cellParas: Paragraph[] = blockToDocx(cell, { color: undefined }, settings).filter((b): b is Paragraph => b instanceof Paragraph);
          cells.push(new TableCell({
            children: cellParas.length ? cellParas : [new Paragraph('')],
            shading: isHeader ? { type: ShadingType.CLEAR, fill: 'F1F5F9' } : undefined,
            columnSpan: Number(cell.getAttribute('colspan') ?? 1) || 1,
            rowSpan: Number(cell.getAttribute('rowspan') ?? 1) || 1,
          }));
        });
        if (cells.length) rows.push(new TableRow({ children: cells }));
      });
      if (rows.length) {
        out.push(new Table({
          rows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
        out.push(new Paragraph({ text: '', spacing: { after: 100 } }));
      }
      return out;
    }
    case 'DIV': {
      if (el.classList.contains('callout-box')) {
        const variant = el.getAttribute('data-variant') ?? 'concept';
        const meta = CALLOUT_DOCX[variant] ?? CALLOUT_DOCX.concept;
        const title = el.getAttribute('data-title') || meta.label;
        const accent = hexNoHash(settings.pageBorderColor) ?? '4F46E5';
        const innerParas: Paragraph[] = [
          new Paragraph({ children: [new TextRun({ text: title, bold: true, color: accent })], spacing: { after: 60 } }),
          ...(el.children.length
            ? blockToDocxChildren(el, ctx, settings).filter((b): b is Paragraph => b instanceof Paragraph)
            : [new Paragraph('')]),
        ];
        out.push(new Table({
          rows: [new TableRow({
            children: [new TableCell({
              children: innerParas,
              shading: { type: ShadingType.CLEAR, fill: meta.fill },
              borders: {
                left: { style: BorderStyle.SINGLE, size: 24, color: accent },
                top: { style: BorderStyle.SINGLE, size: 4, color: accent },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: accent },
                right: { style: BorderStyle.SINGLE, size: 4, color: accent },
              },
            })],
          })],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
        out.push(new Paragraph({ text: '', spacing: { after: 100 } }));
        return out;
      }
      if (el.classList.contains('mcq-block')) {
        const data = parseMcqData(el as HTMLElement);
        const labels = ['ক', 'খ', 'গ', 'ঘ'];
        out.push(new Paragraph({
          children: [new TextRun({ text: `প্রশ্ন। ${data.question}`, bold: true })],
          spacing: { after: 60 },
        }));
        const optRuns: TextRun[] = [];
        data.options.forEach((opt, i) => {
          if (i === 2) optRuns.push(new TextRun({ break: 1 }));
          optRuns.push(new TextRun({
            text: `(${labels[i]}) ${opt}${data.answer === i ? ' ✓' : ''}    `,
          }));
        });
        out.push(new Paragraph({ children: optRuns, spacing: { after: 60 } }));
        if (data.explanation) {
          out.push(new Paragraph({
            children: [new TextRun({ text: `ব্যাখ্যা: ${data.explanation}`, italics: true, color: '475569' })],
            spacing: { after: 80 },
          }));
        }
        return out;
      }
      if (el.classList.contains('doc-shape')) {
        // আকৃতি ফ্রেম — Word-এ SVG অলংকার যায় না; ক্যাটালগের শেল স্টাইল থেকে
        // রঙিন বর্ডার + শেডিং-এর টেবিল দিয়ে আসন্ন রূপ দেওয়া হয়
        const attrs = readShapeAttrs(el);
        const def = SHAPE_BY_ID.get(attrs.shape) ?? SHAPE_DEFS[0];
        const shell = def.shell(attrs);
        const contentEl = el.querySelector(':scope > div.doc-shape-content') ?? el;

        // লেখার রং (hex হলে) ctx-এ দিয়ে পাঠাই — ভিতরের সব রানে প্রয়োগ হয়
        const tColorHex = hexNoHash(def.content(attrs).color);
        const innerCtx: Ctx = tColorHex ? { ...ctx, color: tColorHex } : ctx;

        const innerParas: Paragraph[] = contentEl.children.length
          ? blockToDocxChildren(contentEl, innerCtx, settings).filter((b): b is Paragraph => b instanceof Paragraph)
          : [new Paragraph('')];

        // background — গ্র্যাডিয়েন্ট হলে প্রথম hex নিই
        const bgRaw = shell.background ?? '';
        const bgHex = hexNoHash(bgRaw) ?? hexNoHash(/#[0-9a-fA-F]{6}/.exec(bgRaw)?.[0]);

        // border — "4px double #9f1239" ফরম্যাট পার্স
        const bm = /^([\d.]+)px\s+([a-z]+)\s+(.+)$/.exec(shell.border ?? '');
        const borderStyleMap: Record<string, (typeof BorderStyle)[keyof typeof BorderStyle]> = {
          solid: BorderStyle.SINGLE,
          dashed: BorderStyle.DASHED,
          dotted: BorderStyle.DOTTED,
          double: BorderStyle.DOUBLE,
        };
        const bs = bm ? (borderStyleMap[bm[2]] ?? BorderStyle.SINGLE) : undefined;
        const bc = bm ? hexNoHash(bm[3]) : undefined;
        const bw = bm ? Math.max(4, Math.round(parseFloat(bm[1]) * 0.75) * 4) : 0;

        out.push(new Table({
          rows: [new TableRow({
            children: [new TableCell({
              children: innerParas,
              shading: bgHex ? { type: ShadingType.CLEAR, fill: bgHex } : undefined,
              borders: bs && bc ? {
                top: { style: bs, size: bw, color: bc },
                bottom: { style: bs, size: bw, color: bc },
                left: { style: bs, size: bw, color: bc },
                right: { style: bs, size: bw, color: bc },
              } : undefined,
            })],
          })],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
        out.push(new Paragraph({ text: '', spacing: { after: 100 } }));
        return out;
      }
      if (el.classList.contains('doc-textbox')) {
        const attrs: Partial<DocBoxAttrs> & { variant: DocBoxVariant } = {
          variant: ((el.getAttribute('data-variant') ?? 'rounded') as DocBoxVariant),
          border: el.getAttribute('data-border') ?? undefined,
          fill: el.getAttribute('data-fill') ?? undefined,
          bstyle: (el.getAttribute('data-bstyle') ?? undefined) as DocBoxAttrs['bstyle'],
          bwidth: el.getAttribute('data-bwidth') ? Number(el.getAttribute('data-bwidth')) : undefined,
        };
        const css = docBoxInlineStyle(attrs);
        const borderHex = hexNoHash(css.borderColor) ?? '475569';
        const fillHex = hexNoHash(css.background);
        const borderStyleMap: Record<string, (typeof BorderStyle)[keyof typeof BorderStyle]> = {
          solid: BorderStyle.SINGLE,
          dashed: BorderStyle.DASHED,
          dotted: BorderStyle.DOTTED,
          double: BorderStyle.DOUBLE,
        };
        const bs = borderStyleMap[css.borderStyle] ?? BorderStyle.SINGLE;
        const bw = Math.max(4, Math.round(parseFloat(css.borderWidth) * 0.75) * 4);
        const innerParas: Paragraph[] = el.children.length
          ? blockToDocxChildren(el, ctx, settings).filter((b): b is Paragraph => b instanceof Paragraph)
          : [new Paragraph('')];
        out.push(new Table({
          rows: [new TableRow({
            children: [new TableCell({
              children: innerParas,
              shading: fillHex ? { type: ShadingType.CLEAR, fill: fillHex } : undefined,
              borders: {
                top: { style: bs, size: bw, color: borderHex },
                bottom: { style: bs, size: bw, color: borderHex },
                left: { style: bs, size: bw, color: borderHex },
                right: { style: bs, size: bw, color: borderHex },
              },
            })],
          })],
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
        out.push(new Paragraph({ text: '', spacing: { after: 100 } }));
        return out;
      }
      if (el.classList.contains('toc-block')) {
        let entries: Array<{ text: string; level: number; pageNumber: string }> = [];
        try {
          const parsed: unknown = JSON.parse(el.getAttribute('data-entries') ?? '[]');
          if (Array.isArray(parsed)) entries = parsed as typeof entries;
        } catch { /* উপেক্ষা */ }
        out.push(new Paragraph({ children: [new TextRun({ text: el.getAttribute('data-title') ?? 'সূচিপত্র', bold: true, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 160 } }));
        entries.forEach((e) => {
          out.push(new Paragraph({
            children: [
              new TextRun({ text: `${'　'.repeat(Math.max(0, e.level - 1))}${e.text}` }),
              new TextRun({ text: ` — ${e.pageNumber}`, bold: true }),
            ],
            spacing: { after: 40 },
          }));
        });
        return out;
      }
      // জেনেরিক ডিভ
      out.push(...blockToDocxChildren(el, ctx, settings));
      return out;
    }
    case 'HR':
      out.push(new Paragraph({ text: '─────────', alignment: AlignmentType.CENTER, spacing: { after: 100 } }));
      return out;
    default:
      out.push(...blockToDocxChildren(el, ctx, settings));
      return out;
  }
}

function blockToDocxChildren(el: Element, ctx: Ctx, settings: DocumentSettings): DocxBlock[] {
  const out: DocxBlock[] = [];
  Array.from(el.children).forEach((c) => out.push(...blockToDocx(c, ctx, settings)));
  // সরাসরি টেক্সট থাকলে
  if (!el.children.length && el.textContent?.trim()) {
    out.push(new Paragraph({ children: inlineRuns(el, ctx) }));
  }
  return out;
}

/**
 * এক পাতার হেডার/ফুটার — page-chrome.tsx-এর রেন্ডারের সমতুল্য।
 * আগে: পুরো ডকুমেন্টে একটাই section-level হেডার/ফুটার — per-page override,
 * কভার (differentFirst), পৃষ্ঠা নম্বরের ফরম্যাট (বাংলা/রোমান) ও position সব চুপচাপ
 * হারিয়ে যেত। এখন প্রতি পাতা আলাদা Word-section, তাই সবগুলোই হুবহু মেলে।
 */
function headerFooterParas(
  hfH: HeaderFooterSettings,
  hfF: HeaderFooterSettings,
  settings: DocumentSettings,
  pageIndex: number,
  showChrome: boolean,
): { header: Header; footer: Footer } {
  const accent = hexNoHash(hfH.accentColor) ?? '4F46E5';
  const pn = settings.pageNumber;
  const num = showChrome ? displayPageNumber(pageIndex, pn) : '';
  const numAlign = pn.position.endsWith('left')
    ? AlignmentType.LEFT
    : pn.position.endsWith('right') ? AlignmentType.RIGHT : AlignmentType.CENTER;
  const numberRuns = (): TextRun[] => [
    ...(pn.prefix ? [new TextRun({ text: pn.prefix, color: accent })] : []),
    new TextRun({ text: num, bold: true, color: accent }),
  ];

  const headerChildren: Paragraph[] = [];
  if (showChrome && hfH.enabled && hfH.style !== 'none') {
    // startAt-সচেতন প্যারিটি — pagenum.ts isEvenPage-এর সাথে মিল রেখে
    const mirrored = pn.oddEven && (pn.startAt + pageIndex) % 2 === 0;
    const L = mirrored ? hfH.rightText : hfH.leftText;
    const R = mirrored ? hfH.leftText : hfH.rightText;
    if (hfH.style === 'parallel') {
      headerChildren.push(new Paragraph({
        children: [
          new TextRun({ text: L, bold: true, color: accent }),
          new TextRun({ text: `        ${R}`, color: accent }),
        ],
        border: { top: { style: BorderStyle.DOUBLE, size: 6, color: accent }, bottom: { style: BorderStyle.DOUBLE, size: 6, color: accent } },
      }));
    } else if (hfH.style === 'royal') {
      const center = hfH.centerText || (mirrored ? hfH.rightText || hfH.leftText : hfH.leftText || hfH.rightText);
      headerChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: `❦ ${center} ❦`, color: accent })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: accent } },
      }));
    } else if (hfH.style === 'academic') {
      headerChildren.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
        children: [
          new TextRun({ text: L, bold: true, color: accent }),
          ...(R ? [new TextRun({ text: `\t${R}`, color: accent, size: 20 })] : []),
        ],
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: accent } },
      }));
    } else if (hfH.style === 'plain') {
      const center = hfH.centerText || (mirrored ? hfH.rightText || hfH.leftText : hfH.leftText || hfH.rightText);
      if (center) {
        headerChildren.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: center, bold: true, color: accent })],
        }));
      }
    }
  }
  // হেডারে নম্বর (top পজিশন) — অ্যাপের PageHeader-এর মতো: হেডার বন্ধ/নেই হলে
  // top-নম্বরও দেখায় না (আগে DOCX-এ ফুটন্তর নম্বর দেখাত — স্ক্রিনের সাথে অমিল)
  if (num && pn.position.startsWith('top') && showChrome && hfH.enabled && hfH.style !== 'none') {
    headerChildren.push(new Paragraph({
      alignment: numAlign === AlignmentType.CENTER ? AlignmentType.CENTER : numAlign,
      children: numberRuns(),
    }));
  }

  const footerChildren: Paragraph[] = [];
  if (showChrome && hfF.enabled && hfF.style !== 'none') {
    const accentF = hexNoHash(hfF.accentColor) ?? accent;
    const mirrored = pn.oddEven && (pn.startAt + pageIndex) % 2 === 0;
    const L = mirrored ? hfF.rightText : hfF.leftText;
    const R = mirrored ? hfF.leftText : hfF.rightText;
    if (hfF.style === 'royal') {
      footerChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: '❧ ', color: accentF }),
          ...(num && pn.position.startsWith('bottom') ? numberRuns() : []),
          new TextRun({ text: ' ❧', color: accentF }),
        ],
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: accentF } },
      }));
    } else if (hfF.style === 'academic') {
      footerChildren.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
        children: [
          new TextRun({ text: L, color: accentF }),
          ...(num && pn.position.startsWith('bottom') ? [new TextRun({ text: '\t', color: accentF }), ...numberRuns()] : []),
          ...(R ? [new TextRun({ text: R, color: accentF, size: 20 })] : []),
        ],
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: accentF } },
      }));
    } else if (hfF.style === 'parallel') {
      footerChildren.push(new Paragraph({
        tabStops: [{ type: TabStopType.RIGHT, position: 9360 }],
        children: [
          new TextRun({ text: L, color: accentF }),
          ...(num && pn.position.startsWith('bottom') ? [new TextRun({ text: '\t', color: accentF }), ...numberRuns()] : []),
          ...(R ? [new TextRun({ text: `\t${R}`, color: accentF })] : []),
        ],
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: accentF } },
      }));
    } else if (hfF.style === 'plain') {
      const center = hfF.centerText || (mirrored ? hfF.rightText || hfF.leftText : hfF.leftText || hfF.rightText);
      footerChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          ...(center ? [new TextRun({ text: `${center}   `, color: accentF })] : []),
          ...(num && pn.position.startsWith('bottom') ? numberRuns() : []),
        ],
      }));
    }
  } else if (num && pn.position.startsWith('bottom')) {
    // ফুটার বন্ধ কিন্তু নম্বর bottom-এ চাই
    footerChildren.push(new Paragraph({ alignment: numAlign, children: numberRuns() }));
  }

  return {
    header: new Header({ children: headerChildren.length ? headerChildren : [new Paragraph('')] }),
    footer: new Footer({ children: footerChildren.length ? footerChildren : [new Paragraph('')] }),
  };
}

/**
 * দূরবর্তী (http/https) ছবিগুলো base64 ডেটা-URL-এ রূপান্তর — নইলে Word
 * এক্সপোর্টে সেগুলো চুপচাপ বাদ পড়ত। CORS-ব্লকড ছবি থাকলে যেমন আছে তেমন থাকে
 * (বাকি কনটেন্ট অক্ষত থাকে)।
 */
async function inlineRemoteImages(html: string, cache: Map<string, string>): Promise<string> {
  if (!html.includes('<img')) return html;
  const dom = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
  const root = dom.getElementById('r');
  if (!root) return html;
  const remote = Array.from(root.querySelectorAll('img[src^="http://"], img[src^="https://"]'));
  if (!remote.length) return html;
  await Promise.all(remote.map(async (img) => {
    const src = img.getAttribute('src') ?? '';
    if (!src) return;
    try {
      let dataUrl = cache.get(src);
      if (dataUrl === undefined) {
        const res = await fetch(src, { mode: 'cors' });
        if (!res.ok) throw new Error(String(res.status));
        const blob = await res.blob();
        dataUrl = await new Promise<string>((resolve, reject) => {
          const fr = new FileReader();
          fr.onload = () => resolve(String(fr.result));
          fr.onerror = () => reject(fr.error);
          fr.readAsDataURL(blob);
        });
        cache.set(src, dataUrl);
      }
      img.setAttribute('src', dataUrl);
    } catch { /* আনা না গেলে যেমন আছে তেমন থাকবে */ }
  }));
  return root.innerHTML;
}

export interface DocxExportInput {
  title: string;
  settings: DocumentSettings;
  pages: PageData[];
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export async function exportProjectToDocx(input: DocxExportInput): Promise<void> {
  const { settings, pages, title } = input;
  const accent = hexNoHash(settings.header.accentColor) ?? '4F46E5';

  const preset = getPaperPreset(settings.paperSize);
  const size = settings.paperSize === 'custom'
    ? { w: settings.customPaper.widthMm, h: settings.customPaper.heightMm }
    : { w: preset.widthMm, h: preset.heightMm };
  const portrait = settings.orientation === 'portrait';
  const pageWidthTwip = Math.round((portrait ? size.w : size.h) * MM_TO_TWIP);
  const pageHeightTwip = Math.round((portrait ? size.h : size.w) * MM_TO_TWIP);
  const m = settings.margins;

  // পেজ বর্ডার — অ্যাপের কনফিগ (রং/স্টাইল/প্রস্থ) অনুযায়ী (docx border size = ১/৮ pt)
  const borderProps = settings.pageBorder !== 'none'
    ? (() => {
        const lineColor = hexNoHash(settings.pageBorderColor || '#1e293b') ?? '1E293B';
        const lineStyle = effectivePageBorderStyle(settings) === 'double'
          ? BorderStyle.DOUBLE
          : effectivePageBorderStyle(settings) === 'dashed'
            ? BorderStyle.DASHED
            : BorderStyle.SINGLE;
        const lineSize = PAGE_BORDER_WIDTH_PX[effectivePageBorderWidth(settings)] * 6;
        const edge = { style: lineStyle, size: lineSize, color: lineColor, space: 24 };
        return {
          borders: {
            pageBorders: {
              display: PageBorderDisplay.ALL_PAGES,
              offsetFrom: PageBorderOffsetFrom.TEXT,
              zOrder: PageBorderZOrder.FRONT,
            },
            pageBorderTop: edge,
            pageBorderRight: edge,
            pageBorderBottom: edge,
            pageBorderLeft: edge,
          },
        };
      })()
    : {};

  // দূরবর্তী ছবি একবারই আনা হয় (একই URL বারবার থাকলে ক্যাশ)
  const imgCache = new Map<string, string>();

  // ── প্রতি পাতা = একটি Word-section — তাই per-page হেডার/ফুটার override,
  //    কভারে কিছু না দেখানো ও বাংলা/রোমান পৃষ্ঠা নম্বর হুবহু মেলে ──
  // খেয়াল: currentFootnotes মডিউল-স্টেট প্রতি পাতায় রিসেট হয় — তাই
  // পাতাগুলো অবশ্যই পরপর (sequential) প্রসেস করতে হবে, Promise.all নয়।
  const sections: Array<{
    properties: object;
    headers: { default: Header };
    footers: { default: Footer };
    children: Array<Paragraph | Table>;
  }> = [];
  for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
    const page = pages[pageIdx];
    currentFootnotes = [];
    const showChrome = page.kind !== 'cover' && !page.noChrome;
    const effH = page.headerOverride ?? settings.header;
    const effF = page.footerOverride ?? settings.footer;
    const { header, footer } = headerFooterParas(effH, effF, settings, pageIdx, showChrome);

    const children: Array<Paragraph | Table> = [];

    if (page.kind === 'cover' && page.coverData) {
      const c = page.coverData;
      const push = (text: string, opts: { size?: number; bold?: boolean; color?: string; spacingAfter?: number } = {}) => {
        children.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children: text ? [new TextRun({ text, size: opts.size ?? 28, bold: opts.bold, color: opts.color })] : [new TextRun('')],
          spacing: { after: opts.spacingAfter ?? 200 },
        }));
      };
      push('');
      push(c.organization, { size: 26, color: hexNoHash(c.accentColor) ?? accent });
      push('');
      push(c.title || title, { size: 56, bold: true, color: hexNoHash(c.accentColor) ?? accent });
      if (c.subtitle) push(c.subtitle, { size: 30 });
      push('');
      push(c.course, { size: 26 });
      push('');
      push(c.author, { size: 26 });
      push(c.year, { size: 22, color: '64748B' });
    } else {
      const html = await inlineRemoteImages(page.html || '<p></p>', imgCache);
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, 'text/html');
      Array.from(dom.body.children).forEach((el) => {
        children.push(...blockToDocx(el, {}, settings));
      });

      // ফুটনোট তালিকা
      if (currentFootnotes.length) {
        children.push(new Paragraph({ text: '─────', alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 } }));
        currentFootnotes.forEach((note, i) => {
          children.push(new Paragraph({
            children: [new TextRun({ text: `${i + 1} `, superScript: true, bold: true }), new TextRun({ text: note, size: 18 })],
            spacing: { after: 40 },
          }));
        });
      }
    }

    // gutter — অ্যাপের gutterSide লজিকের মতো অজর/জোড় পাতায় বিপরীত পাশে
    // (startAt-সচেতন প্যারিটি — pagenum.ts isEvenPage-এর সাথে মিল রেখে)
    const pn = settings.pageNumber;
    const gutterLeft = !(pn.oddEven && (pn.startAt + pageIdx) % 2 === 0);
    const leftIn = gutterLeft ? m.left + m.gutter : m.left;
    const rightIn = gutterLeft ? m.right : m.right + m.gutter;

    sections.push({
      properties: {
        page: {
          size: { width: pageWidthTwip, height: pageHeightTwip },
          margin: {
            top: Math.round(m.top * INCH_TO_TWIP),
            bottom: Math.round(m.bottom * INCH_TO_TWIP),
            left: Math.round(leftIn * INCH_TO_TWIP),
            right: Math.round(rightIn * INCH_TO_TWIP),
          },
          ...borderProps,
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children,
    });
  }

  const doc = new Document({
    title,
    styles: {
      default: {
        document: {
          run: { font: settings.defaultFont, size: settings.defaultFontSize * 2 },
          paragraph: { spacing: { line: Math.round(settings.lineHeight * 240) } },
        },
      },
    },
    numbering: {
      config: [{
        reference: 'bwp-ordered',
        levels: [{
          level: 0,
          format: LevelFormat.DECIMAL,
          text: '%1.',
          alignment: AlignmentType.START,
        }],
      }],
    },
    sections,
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (title || 'বই').replace(/[\\/:*?"<>|]/g, '_');
  downloadBlob(blob, `${safeName}.docx`);
}
