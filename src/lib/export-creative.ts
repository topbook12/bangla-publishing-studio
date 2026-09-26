/**
 * ক্রিয়েটিভ এক্সপোর্ট — EPUB (ই-বুক), Markdown (.md) ও Plain Text (.txt)
 *
 *  - EPUB: ব্রাউজারেই JSZip দিয়ে বিল্ড — প্রতিটি পাতা একটি XHTML অধ্যায়,
 *    ছবিগুলো (base64) EPUB-এর ভেতরে এমবেড হয়; EPUB3 nav + NCX দুটোই থাকে।
 *  - Markdown: HTML → MD সহজ কনভার্টার (হেডিং/লিস্ট/টেবিল/লিংক/ছবি)।
 *  - Text: ট্যাগমুক্ত প্লেইন টেক্সট — যেকোনো এডিটরে খোলা যায়।
 */

import JSZip from 'jszip';
import type { DocumentSettings, PageData } from './types';
import { saveAs } from './download';

// ─────────────────────────── সাধারণ হেল্পার ───────────────────────────

function safeName(title: string): string {
  return (title || 'বই').replace(/[\\/:*?"<>|]/g, '_');
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** XHTML-এর জন্য void ট্যাগ সেলফ-ক্লোজ করা */
function xhtmlify(html: string): string {
  return html
    .replace(/<img([^>]*?)\s*\/?>/gi, '<img$1 />')
    .replace(/<br\s*\/?>/gi, '<br />')
    .replace(/<hr([^>]*?)\s*\/?>/gi, '<hr$1 />');
}

function decodeDataUrl(dataUrl: string): { bytes: Uint8Array; ext: string; mime: string } | null {
  const m = /^data:([^;,]+)(?:;charset=[^;,]+)?;base64,([\s\S]*)$/.exec(dataUrl.trim());
  if (!m) return null;
  const mime = m[1].toLowerCase();
  const bin = atob(m[2]);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = mime.includes('jpeg') ? 'jpg' : mime.includes('png') ? 'png' : mime.includes('gif') ? 'gif' : mime.includes('webp') ? 'webp' : 'png';
  return { bytes, ext, mime };
}

// ─────────────────────────── EPUB ───────────────────────────

interface EpubChapter {
  id: string;
  title: string;
  xhtml: string;
}

const XHTML_SKEL = (title: string, body: string, css: string) => `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="bn" lang="bn">
<head>
<meta charset="utf-8" />
<title>${escapeXml(title)}</title>
<link rel="stylesheet" type="text/css" href="style.css" />
${css ? '' : ''}
</head>
<body>
${body}
</body>
</html>`;

const EPUB_CSS = `body { font-family: serif; line-height: 1.6; margin: 1em; }
h1, h2, h3, h4 { line-height: 1.3; }
p { margin: 0 0 .6em; text-align: justify; }
img { max-width: 100%; height: auto; }
table { border-collapse: collapse; width: 100%; }
td, th { border: 1px solid #999; padding: 4px 8px; }
blockquote { border-left: 3px solid #999; margin: .8em 0; padding: .2em 1em; color: #555; font-style: italic; }
`;

/** স্টোরেজ HTML → EPUB XHTML (ছবি আলাদা ফাইলে গিয়ে src রিপ্লেস হয়) */
function pageToEpubXhtml(
  page: PageData,
  index: number,
  bookTitle: string,
  images: Array<{ id: string; filename: string; mime: string; bytes: Uint8Array }>,
): string {
  if (page.kind === 'cover' && page.coverData) {
    const c = page.coverData;
    const body = `
<section epub:type="titlepage" style="text-align:center; margin-top:18%">
  <p style="color:#64748b">${escapeXml(c.organization)}</p>
  <h1 style="font-size:2em">${escapeXml(c.title || bookTitle)}</h1>
  ${c.subtitle ? `<p style="font-size:1.2em">${escapeXml(c.subtitle)}</p>` : ''}
  ${c.course ? `<p>${escapeXml(c.course)}</p>` : ''}
  <hr />
  <p><b>${escapeXml(c.author)}</b></p>
  <p>${escapeXml(c.year)}</p>
</section>`;
    return XHTML_SKEL(c.title || bookTitle, body, '');
  }

  const dom = new DOMParser().parseFromString(`<div id="r">${page.html || '<p></p>'}</div>`, 'text/html');
  const root = dom.getElementById('r');
  if (!root) return XHTML_SKEL(`পৃষ্ঠা ${index + 1}`, '<p></p>', '');

  // ছবিগুলো বের করে EPUB ফাইলে যোগ + src রিপ্লেস
  root.querySelectorAll('img').forEach((img, i) => {
    const src = img.getAttribute('src') ?? '';
    if (!src.startsWith('data:')) return;
    const decoded = decodeDataUrl(src);
    if (!decoded) return;
    const id = `img-${index + 1}-${i + 1}`;
    const filename = `images/${id}.${decoded.ext}`;
    images.push({ id, filename, mime: decoded.mime, bytes: decoded.bytes });
    img.setAttribute('src', filename);
    img.setAttribute('alt', img.getAttribute('alt') || '');
  });

  // MCQ/TOC/কলআউট/টেক্সটবক্স/ফুটনোট — এক্সপোর্ট-বান্ধব সরল রূপ
  root.querySelectorAll('div.mcq-block').forEach((el) => {
    const q = el.getAttribute('data-question') ?? '';
    let opts = '';
    try {
      const arr: unknown = JSON.parse(el.getAttribute('data-options') ?? '[]');
      if (Array.isArray(arr)) {
        const labels = ['ক', 'খ', 'গ', 'ঘ'];
        opts = (arr as string[])
          .map((o, i) => `<p><b>(${labels[i] ?? i + 1})</b> ${escapeXml(String(o))}</p>`)
          .join('');
      }
    } catch { /* উপেক্ষা */ }
    el.innerHTML = `<p><b>প্রশ্ন:</b> ${escapeXml(q)}</p>${opts}`;
  });

  root.querySelectorAll('sup.footnote').forEach((el) => {
    const note = el.getAttribute('data-note') ?? '';
    el.innerHTML = note ? ` <span style="font-size:.8em">[${escapeXml(note)}]</span>` : '';
  });

  root.querySelectorAll('div.doc-shape').forEach((el) => {
    // আকৃতি ফ্রেম — EPUB/XHTML-এ SVG যায় না; কেন্দ্রীয় blockquote হিসেবে লেখাটুকু রাখি
    const contentEl = el.querySelector(':scope > div.doc-shape-content');
    const wrap = dom.createElement('blockquote');
    wrap.setAttribute('style', 'text-align:center');
    wrap.innerHTML = contentEl ? contentEl.innerHTML : el.innerHTML;
    el.replaceWith(wrap);
  });

  root.querySelectorAll('div.doc-textbox').forEach((el) => {
    const wrap = dom.createElement('blockquote');
    wrap.innerHTML = el.innerHTML;
    el.replaceWith(wrap);
  });

  const body = xhtmlify(root.innerHTML)
    // div/callout → section রাখলেও EPUB রিডার সহজে নেয়; শুধু epub:type বৈধতা
    .replace(/contenteditable="[^"]*"/gi, '');

  return XHTML_SKEL(`পৃষ্ঠা ${index + 1}`, body, '');
}

export interface CreativeExportInput {
  title: string;
  settings: DocumentSettings;
  pages: PageData[];
}

export async function exportProjectToEpub(input: CreativeExportInput): Promise<void> {
  const { title, pages } = input;
  const bookTitle = title || 'বই';
  const uuid = `urn:uuid:${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

  const zip = new JSZip();
  // mimetype অবশ্যই প্রথম এন্ট্রি, STORED (কমপ্রেশন ছাড়া)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  const images: Array<{ id: string; filename: string; mime: string; bytes: Uint8Array }> = [];
  const chapters: EpubChapter[] = pages.map((page, i) => ({
    id: `chap-${i + 1}`,
    title: page.kind === 'cover' && page.coverData ? page.coverData.title || bookTitle : `পৃষ্ঠা ${i + 1}`,
    xhtml: pageToEpubXhtml(page, i, bookTitle, images),
  }));

  zip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" />
  </rootfiles>
</container>`);

  zip.file('OEBPS/style.css', EPUB_CSS);

  chapters.forEach((ch) => {
    zip.file(`OEBPS/${ch.id}.xhtml`, ch.xhtml);
  });

  images.forEach((im) => {
    zip.file(`OEBPS/${im.filename}`, im.bytes, { binary: true });
  });

  // nav.xhtml (EPUB3) + toc.ncx (EPUB2 সামঞ্জস্য)
  const navItems = chapters
    .map((ch) => `    <li><a href="${ch.id}.xhtml">${escapeXml(ch.title)}</a></li>`)
    .join('\n');
  zip.file('OEBPS/nav.xhtml', XHTML_SKEL(
    'সূচিপত্র',
    `<nav epub:type="toc" id="toc">\n  <h1>সূচিপত্র</h1>\n  <ol>\n${navItems}\n  </ol>\n</nav>`,
    '',
  ));

  const navPoints = chapters
    .map((ch, i) => `    <navPoint id="np-${i + 1}" playOrder="${i + 1}">\n      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>\n      <content src="${ch.id}.xhtml" />\n    </navPoint>`)
    .join('\n');
  zip.file('OEBPS/toc.ncx', `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${uuid}" />
    <meta name="dtb:depth" content="1" />
  </head>
  <docTitle><text>${escapeXml(bookTitle)}</text></docTitle>
  <navMap>
${navPoints}
  </navMap>
</ncx>`);

  const manifestItems = [
    ...chapters.map((ch) => `    <item id="${ch.id}" href="${ch.id}.xhtml" media-type="application/xhtml+xml" />`),
    '    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
    '    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />',
    '    <item id="css" href="style.css" media-type="text/css" />',
    ...images.map((im) => `    <item id="${im.id}" href="${im.filename}" media-type="${im.mime}" />`),
  ].join('\n');
  const spineItems = chapters
    .map((ch) => `    <itemref idref="${ch.id}" />`)
    .join('\n');

  zip.file('OEBPS/content.opf', `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="bn">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">${uuid}</dc:identifier>
    <dc:title>${escapeXml(bookTitle)}</dc:title>
    <dc:language>bn</dc:language>
    <dc:creator>${escapeXml('বাংলা পাবলিশিং স্টুডিও')}</dc:creator>
    <meta property="dcterms:modified">${now}</meta>
  </metadata>
  <manifest>
${manifestItems}
  </manifest>
  <spine toc="ncx">
${spineItems}
    <itemref idref="nav" linear="no" />
  </spine>
</package>`);

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
  saveAs(blob, `${safeName(bookTitle)}.epub`);
}

// ─────────────────────────── Markdown ───────────────────────────

function htmlToMarkdown(html: string): string {
  const dom = new DOMParser().parseFromString(`<div id="r">${html || '<p></p>'}</div>`, 'text/html');
  const root = dom.getElementById('r');
  if (!root) return '';

  const inline = (el: Element): string => {
    let out = '';
    el.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        out += (child.textContent ?? '').replace(/\s+/g, ' ');
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;
      const c = child as Element;
      switch (c.tagName) {
        case 'B': case 'STRONG': out += `**${inline(c).trim()}**`; break;
        case 'I': case 'EM': out += `*${inline(c).trim()}*`; break;
        case 'U': out += inline(c); break;
        case 'S': case 'DEL': out += `~~${inline(c).trim()}~~`; break;
        case 'CODE': out += `\`${c.textContent ?? ''}\``; break;
        case 'A': out += `[${(c.textContent ?? '').trim()}](${c.getAttribute('href') ?? ''})`; break;
        case 'IMG': {
          const src = c.getAttribute('src') ?? '';
          out += src.startsWith('data:') ? `![ছবি](data-image)` : `![${c.getAttribute('alt') ?? ''}](${src})`;
          break;
        }
        case 'BR': out += '  \n'; break;
        case 'SUP': out += `^(${c.textContent ?? ''})`; break;
        case 'SUB': out += `~(${c.textContent ?? ''})`; break;
        default: out += inline(c);
      }
    });
    return out;
  };

  const block = (el: Element, depth = 0): string => {
    switch (el.tagName) {
      case 'H1': case 'H2': case 'H3': case 'H4': {
        const level = Number(el.tagName[1]);
        return `${'#'.repeat(level)} ${inline(el).trim()}`;
      }
      case 'P':
        return inline(el).trim();
      case 'UL': case 'OL': {
        const items = Array.from(el.children).filter((c) => c.tagName === 'LI');
        return items
          .map((li, i) => `${'  '.repeat(depth)}${el.tagName === 'UL' ? '-' : `${i + 1}.`} ${inline(li).trim()}`)
          .join('\n');
      }
      case 'BLOCKQUOTE':
        return Array.from(el.children)
          .map((c) => `> ${block(c, depth).replace(/\n/g, '\n> ')}`)
          .join('\n');
      case 'TABLE': {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length === 0) return '';
        const cellsOf = (tr: Element) =>
          Array.from(tr.children).map((td) => inline(td).trim().replace(/\|/g, '\\|'));
        const head = cellsOf(rows[0]);
        const lines = [
          `| ${head.join(' | ')} |`,
          `| ${head.map(() => '---').join(' | ')} |`,
          ...rows.slice(1).map((tr) => `| ${cellsOf(tr).join(' | ')} |`),
        ];
        return lines.join('\n');
      }
      case 'HR':
        return '---';
      case 'DIV': {
        // callout/টেক্সটবক্স/MCQ → ইনডেন্টেড ব্লক
        const inner = Array.from(el.children).map((c) => block(c, depth)).filter(Boolean);
        if (inner.length === 0) {
          const text = (el.textContent ?? '').trim();
          return text ? text : '';
        }
        return inner.join('\n\n');
      }
      default:
        return Array.from(el.children).map((c) => block(c, depth)).filter(Boolean).join('\n\n');
    }
  };

  return Array.from(root.children)
    .map((c) => block(c))
    .filter(Boolean)
    .join('\n\n');
}

export function exportProjectToMarkdown(input: CreativeExportInput): void {
  const { title, pages } = input;
  const out: string[] = [`# ${title || 'বই'}`, ''];
  pages.forEach((page, i) => {
    if (page.kind === 'cover' && page.coverData) {
      const c = page.coverData;
      out.push(`---`, '', `# ${c.title || title}`, '');
      if (c.subtitle) out.push(`*${c.subtitle}*`, '');
      if (c.author) out.push(`**${c.author}**`, '');
      if (c.organization) out.push(c.organization, '');
      if (c.year) out.push(c.year, '');
      return;
    }
    const md = htmlToMarkdown(page.html);
    if (md.trim()) {
      out.push(`<!-- পৃষ্ঠা ${i + 1} -->`, '', md, '');
    }
  });
  const blob = new Blob([out.join('\n')], { type: 'text/markdown;charset=utf-8' });
  saveAs(blob, `${safeName(title)}.md`);
}

// ─────────────────────────── Plain Text ───────────────────────────

export function exportProjectToText(input: CreativeExportInput): void {
  const { title, pages } = input;
  const out: string[] = [`${title || 'বই'}`, '='.repeat(Math.max(4, (title || 'বই').length)), ''];
  pages.forEach((page, i) => {
    if (page.kind === 'cover' && page.coverData) {
      const c = page.coverData;
      const coverLines = [
        '',
        '────────────',
        '',
        c.title || title,
        c.subtitle || '',
        c.author ? `লেখক: ${c.author}` : '',
        c.organization || '',
        c.year || '',
        '',
      ].filter((l) => l !== '');
      out.push(...coverLines);
      return;
    }
    const dom = new DOMParser().parseFromString(page.html || '', 'text/html');
    const text = (dom.body.textContent ?? '').replace(/\n{3,}/g, '\n\n').trim();
    if (text) out.push(`[ পৃষ্ঠা ${i + 1} ]`, '', text, '');
  });
  const blob = new Blob([out.join('\n')], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${safeName(title)}.txt`);
}
