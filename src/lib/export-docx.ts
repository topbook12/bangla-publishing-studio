/**
 * MS Word (.docx) এক্সপোর্টার — docx.js দিয়ে ব্রাউজারেই বিল্ড হয়।
 * প্রতিটি পৃষ্ঠার HTML পার্স করে Word প্যারাগ্রাফ/টেবিলে রূপান্তর করে।
 */

import {
  AlignmentType, BorderStyle, Document, ExternalHyperlink, Footer, Header, HeadingLevel, ImageRun,
  LevelFormat, PageBreak, PageBorderDisplay, PageBorderOffsetFrom, PageBorderZOrder,
  PageNumber, Packer, Paragraph, ShadingType, Table, TableCell,
  TableRow, TextRun, WidthType,
} from 'docx';
import type { DocumentSettings, PageData } from './types';
import { effectivePageBorderStyle, effectivePageBorderWidth, getPaperPreset, PAGE_BORDER_WIDTH_PX } from './paper';
import { parseMcqData, docBoxInlineStyle, type DocBoxAttrs, type DocBoxVariant } from './nodes-html';

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
  let idx = currentFootnotes.indexOf(note);
  if (idx === -1) {
    currentFootnotes.push(note);
    idx = currentFootnotes.length;
  }
  return idx;
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

function headerFooterParas(settings: DocumentSettings, accent: string): { header: Header; footer: Footer } {
  const h = settings.header;
  const headerChildren: Paragraph[] = [];
  if (h.enabled && h.style !== 'none') {
    if (h.style === 'parallel') {
      headerChildren.push(new Paragraph({
        children: [
          new TextRun({ text: h.leftText, bold: true, color: accent }),
          new TextRun({ text: `        ${h.rightText}`, color: accent }),
        ],
        border: { top: { style: BorderStyle.DOUBLE, size: 6, color: accent }, bottom: { style: BorderStyle.DOUBLE, size: 6, color: accent } },
      }));
    } else {
      headerChildren.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h.centerText || h.leftText || h.rightText, color: accent })],
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: accent } },
      }));
    }
  }
  const f = settings.footer;
  const pnPrefix = settings.pageNumber.prefix;
  const footerChildren: Paragraph[] = [];
  if (f.enabled && f.style !== 'none') {
    footerChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        ...(pnPrefix ? [new TextRun({ text: pnPrefix })] : []),
        new TextRun({ children: [PageNumber.CURRENT] }),
      ],
      border: f.style === 'academic' ? { top: { style: BorderStyle.SINGLE, size: 4, color: accent } } : undefined,
    }));
  } else if (settings.pageNumber.enabled) {
    footerChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        ...(pnPrefix ? [new TextRun({ text: pnPrefix })] : []),
        new TextRun({ children: [PageNumber.CURRENT] }),
      ],
    }));
  }
  return { header: new Header({ children: headerChildren.length ? headerChildren : [new Paragraph('')] }), footer: new Footer({ children: footerChildren.length ? footerChildren : [new Paragraph('')] }) };
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
  const { header, footer } = headerFooterParas(settings, accent);

  const children: Array<Paragraph | Table> = [];

  pages.forEach((page, pageIdx) => {
    currentFootnotes = [];
    if (pageIdx > 0) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
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
      push(c.organization, { size: 26, color: accent });
      push('');
      push(c.title || title, { size: 56, bold: true, color: accent });
      if (c.subtitle) push(c.subtitle, { size: 30 });
      push('');
      push(c.course, { size: 26 });
      push('');
      push(c.author, { size: 26 });
      push(c.year, { size: 22, color: '64748B' });
      return;
    }

    const parser = new DOMParser();
    const dom = parser.parseFromString(page.html || '<p></p>', 'text/html');
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
  });

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
    sections: [{
      properties: {
        page: {
          size: { width: pageWidthTwip, height: pageHeightTwip },
          margin: {
            top: Math.round(m.top * INCH_TO_TWIP),
            bottom: Math.round(m.bottom * INCH_TO_TWIP),
            left: Math.round(m.left * INCH_TO_TWIP),
            right: Math.round(m.right * INCH_TO_TWIP),
            gutter: Math.round(m.gutter * INCH_TO_TWIP),
          },
          // পেজ বর্ডার — অ্যাপের কনফিগ (রং/স্টাইল/প্রস্থ) অনুযায়ী (docx border size = ১/৮ pt)
          ...(settings.pageBorder !== 'none'
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
            : {}),
        },
      },
      headers: { default: header },
      footers: { default: footer },
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  const safeName = (title || 'বই').replace(/[\\/:*?"<>|]/g, '_');
  downloadBlob(blob, `${safeName}.docx`);
}
