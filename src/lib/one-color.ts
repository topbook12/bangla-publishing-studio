/**
 * এক-রঙের বই ইঞ্জিন (Single-Ink Book) — পুরো বইকে একটিই কালির রঙে রূপান্তর।
 *
 * মুদ্রণ-শিল্পের "এক রঙে ছাপা" হুবহু এটাই: সব হেডিং, বর্ডার, অলংকরণ, বক্স, আইকন —
 * সবকিছু নির্বাচিত কালির ছায়ায় (গাঢ় → কালি, মাঝারি → ৬৫%, হালকা → ৩০-৪৫% টিন্ট)।
 * মূল ডিজাইনের আলো-অন্ধকারের বৈষম্য (relative luminance) ঠিক রেখে শুধু রঙের স্বর
 * বদলায় — তাই পড়তে ও ছাপাতে একই ভারসাম্য থাকে।
 *
 * নিরাপত্তা: প্রয়োগের আগে স্বয়ংক্রিয় স্ন্যাপশট নেওয়া হয় — স্ন্যাপশট ডায়ালগ থেকে
 * যেকোনো সময় আসল রঙে ফেরা যায়। আবার অন্য কালি বেছে নিলে আগের কালি-ম্যাপিং থেকেই
 * নতুন কালিতে রূপান্তর হয় (লুমিন্যান্স-ভিত্তিক ম্যাপিং পুনঃপ্রয়োগযোগ্য)।
 */

'use client';

import type { DocumentSettings, PageData } from './types';
import { useEditorStore } from './store';

// ─────────────────────────── কালির প্যালেট ───────────────────────────

export interface InkPreset {
  id: string;
  hex: string;
  labelKey: string;
  /** প্যালেট সোয়াচের নাম (ক্যাপশনে দেখানোর জন্য ছোট বাংলা নাম) */
  bn: string;
}

/** মুদ্রণ-মানের এক-রঙের কালি — যেকোনো বইয়ের ধাঁচে মানানসই */
export const INK_PRESETS: InkPreset[] = [
  { id: 'black', hex: '#1a1a1a', labelKey: 'dsn.ink.black', bn: 'কালো' },
  { id: 'sepia', hex: '#5d4037', labelKey: 'dsn.ink.sepia', bn: 'সেপিয়া বাদামি' },
  { id: 'maroon', hex: '#7f1d1d', labelKey: 'dsn.ink.maroon', bn: 'মেরুন' },
  { id: 'teal', hex: '#0f766e', labelKey: 'dsn.ink.teal', bn: 'টিল' },
  { id: 'forest', hex: '#166534', labelKey: 'dsn.ink.forest', bn: 'গাঢ় সবুজ' },
  { id: 'plum', hex: '#701a75', labelKey: 'dsn.ink.plum', bn: 'প্লাম' },
  { id: 'rust', hex: '#9a3412', labelKey: 'dsn.ink.rust', bn: 'মাটি-লাল' },
  { id: 'navy', hex: '#1e3a5f', labelKey: 'dsn.ink.navy', bn: 'নেভি' },
  { id: 'olive', hex: '#4d4d29', labelKey: 'dsn.ink.olive', bn: 'জলপাই' },
  { id: 'slate', hex: '#334155', labelKey: 'dsn.ink.slate', bn: 'ছাই-ধূসর' },
];

// ─────────────────────────── রঙ পার্সিং ───────────────────────────

interface Rgb {
  r: number;
  g: number;
  b: number;
  a: number;
}

const NAMED: Record<string, string> = {
  white: '#ffffff',
  black: '#000000',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  gray: '#808080',
  grey: '#808080',
  currentcolor: '',
};

export function parseColor(input: string): Rgb | null {
  const s = (input ?? '').trim().toLowerCase();
  if (!s || s === 'transparent' || s === 'none') return null;
  let hex = NAMED[s] ?? (NAMED[s] === '' ? '' : s);
  if (s === 'currentcolor') return null;
  if (!hex) return null;

  // rgb()/rgba()
  const fn = /^rgba?\(([^)]+)\)$/.exec(hex);
  if (fn) {
    const parts = fn[1].split(/[,\s/]+/).filter(Boolean).map((p) => (p.endsWith('%') ? (Number.parseFloat(p) / 100) * 255 : Number.parseFloat(p)));
    if (parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n))) {
      return { r: parts[0], g: parts[1], b: parts[2], a: Number.isFinite(parts[3]) ? Math.min(1, Math.max(0, parts[3])) : 1 };
    }
    return null;
  }

  // #rgb / #rrggbb / #rrggbbaa
  const m = /^#([0-9a-f]{3,8})$/.exec(hex);
  if (!m) return null;
  const h = m[1];
  if (h.length === 3) {
    return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: 1 };
  }
  if (h.length === 6 || h.length === 8) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  return null;
}

function toHex({ r, g, b }: { r: number; g: number; b: number }): string {
  const c = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function rgbaString({ r, g, b, a }: Rgb): string {
  const v = toHex({ r, g, b });
  return a >= 0.999 ? v : `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`;
}

/** WCAG relative luminance (0 = কালো, 1 = সাদা) */
export function relLuminance({ r, g, b }: { r: number; g: number; b: number }): number {
  const f = (v: number) => {
    const x = v / 255;
    return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** কালির সাথে কাগজের রং (সাদা) মিশিয়ে টিন্ট — t=0 কালি, t=1 সাদা */
function inkTint(ink: Rgb, t: number): Rgb {
  const mix = (c: number) => c + (255 - c) * t;
  return { r: mix(ink.r), g: mix(ink.g), b: mix(ink.b), a: ink.a };
}

// ─────────────────────────── মূল ম্যাপিং ───────────────────────────

/**
 * উৎস-রঙের আলো (লুমিন্যান্স) অনুযায়ী কালির ছায়ায় রূপান্তর।
 * গাঢ় উৎস → পূর্ণ কালি, মাঝারি → ৭০%, হালকা → ৪৫%, খুব হালকা → ২৮% টিন্ট।
 */
export function mapToInk(source: string, inkHex: string): string | null {
  const src = parseColor(source);
  if (!src) return null;
  const ink = parseColor(inkHex);
  if (!ink) return null;
  const l = relLuminance(src);
  let t: number;
  if (l < 0.16) t = 0;
  else if (l < 0.34) t = 0.3;
  else if (l < 0.55) t = 0.55;
  else if (l < 0.78) t = 0.72;
  else t = 0.86;
  return rgbaString({ ...inkTint(ink, t), a: src.a });
}



// ─────────────────────────── HTML রূপান্তর ───────────────────────────

const STYLE_COLOR_PROPS = ['color', 'background-color', 'background', 'border-color', 'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color'];
const DATA_COLOR_ATTRS = ['data-border', 'data-fill', 'data-color', 'data-bg'];
const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'svg']);

/** একটি style attribute-এর ভেতরের রঙগুলো কালিতে ম্যাপ করা */
function tintStyleText(styleText: string, inkHex: string): string | null {
  if (!styleText || !styleText.includes(':')) return null;
  let changed = false;
  const out = styleText.replace(/([-a-zA-Z]+)\s*:\s*([^;]+)/g, (full, propRaw: string, valRaw: string) => {
    const prop = propRaw.trim().toLowerCase();
    const val = valRaw.trim();
    // shorthand border: 1px solid #abc — রঙের অংশটুকু ম্যাপ
    if (/^border(-top|-right|-bottom|-left)?$/.test(prop)) {
      const m = /^(.*?)(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|\b[a-zA-Z]+\b)(?![-a-zA-Z])\s*$/.exec(val);
      if (m) {
        const mapped = mapToInk(m[2], inkHex);
        if (mapped) {
          changed = true;
          return `${propRaw}:${m[1]}${mapped}`;
        }
      }
      return full;
    }
    if (!STYLE_COLOR_PROPS.includes(prop)) return full;
    // multi-layer background (gradient ইত্যাদি) — শুধু সলিড রঙ ম্যাপ
    const mapped = mapToInk(val, inkHex);
    if (!mapped) return full;
    changed = true;
    return `${propRaw}:${mapped}`;
  });
  return changed ? out : null;
}

/**
 * একটি পাতার HTML-এর সব রঙ এক কালিতে রূপান্তর।
 * ইনলাইন style + doc-textbox/doc-icon/doc-sticker-এর data-attr — দুটোই ধরা হয়।
 */
export function tintPageHtml(html: string, inkHex: string): string {
  if (!html || typeof document === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
    const root = doc.getElementById('r');
    if (!root) return html;
    const inkRgb = parseColor(inkHex);
    if (!inkRgb) return html;

    const walker = doc.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode() as Element | null;
    while (node) {
      const tag = node.tagName;
      if (!SKIP_TAGS.has(tag)) {
        // data-attr (ডিজাইন বক্স/আইকন/স্টিকার)
        for (const attr of DATA_COLOR_ATTRS) {
          const val = node.getAttribute(attr);
          if (!val || val === 'transparent') continue;
          const mapped = mapToInk(val, inkHex);
          if (mapped) node.setAttribute(attr, mapped);
        }
        // ইনলাইন style
        const style = node.getAttribute('style');
        if (style) {
          const mapped = tintStyleText(style, inkHex);
          if (mapped) node.setAttribute('style', mapped);
        }
        // ফন্ট-কালার মার্ক (highlight) — mark tag-এর data-color
        if (tag === 'MARK') {
          const val = node.getAttribute('data-color');
          if (val) {
            const mapped = mapToInk(val, inkHex);
            if (mapped) node.setAttribute('data-color', mapped);
          }
        }
      }
      node = walker.nextNode() as Element | null;
    }
    return root.innerHTML;
  } catch {
    return html;
  }
}

// ─────────────────────────── সেটিংস-স্তরের সহায়ক ───────────────────────────

/** সেটিংসের অ্যাকসেন্টগুলোও কালিতে নামানো */
export function tintSettings(settings: DocumentSettings, inkHex: string): Partial<DocumentSettings> {
  const pageBorderColor = mapToInk(settings.pageBorderColor, inkHex) ?? settings.pageBorderColor;
  return {
    header: { ...settings.header, accentColor: inkHex },
    footer: { ...settings.footer, accentColor: inkHex },
    pageBorderColor,
    singleColor: inkHex,
  };
}

/** পুরো বইয়ের পাতা এক কালিতে — নতুন pages অ্যারে ফেরত (আসল অপরিবর্তিত) */
export function tintPages(pages: PageData[], inkHex: string): PageData[] {
  return pages.map((p) => {
    if (p.kind !== 'normal' || !p.html) return p;
    return { ...p, html: tintPageHtml(p.html, inkHex) };
  });
}

/** কভারের অ্যাকসেন্ট কালিতে */
export function tintCoverData(cover: NonNullable<PageData['coverData']> | undefined, inkHex: string): NonNullable<PageData['coverData']> | undefined {
  if (!cover) return cover;
  return { ...cover, accentColor: inkHex };
}

// ─────────────────────────── বই-স্তরের প্রয়োগ ───────────────────────────

/**
 * ★ পুরো বই এক কালিতে — নিরাপত্তা-স্ন্যাপশট নিয়ে থেকে সব পাতা, কভার ও সেটিংস-অ্যাকসেন্ট
 * এক কালির ছায়ায় রূপান্তর। ফেরত: স্ন্যাপশট নেওয়া গেছে কি না (UX-বার্তার জন্য)।
 */
export async function applyOneColorToBook(inkHex: string): Promise<{ snapshotTaken: boolean; pagesTouched: number }> {
  const s = useEditorStore.getState();
  let snapshotTaken = false;
  try {
    await s.takeSnapshot('manual');
    snapshotTaken = true;
  } catch { /* স্ন্যাপশট ব্যর্থ — তবু প্রয়োগ চলবে */ }

  const pages = tintPages(s.pages, inkHex).map((p) =>
    p.kind === 'cover' && p.coverData ? { ...p, coverData: tintCoverData(p.coverData, inkHex) } : p,
  );
  s.replaceBook(pages, tintSettings(s.settings, inkHex));
  return { snapshotTaken, pagesTouched: pages.filter((p) => p.kind === 'normal').length };
}

/** এক-রঙ মোড বন্ধ — সেটিংস ফ্ল্যাগ মাত্র মুছে দেয় (রঙ ফেরাতে স্ন্যাপশট পুনরুদ্ধার) */
export function clearOneColorMode(): void {
  useEditorStore.getState().updateSettings({ singleColor: null });
}

/**
 * এক্সপোর্ট (HTML)-এর জন্য এক-রঙ ওভাররাইড CSS — ক্লাস-ভিত্তিক রঙগুলোও
 * (কলআউট, MCQ, TOC, টেবিল) কালির ছায়ায় নামায়। ইনলাইন রঙ আগেই HTML-এ রূপান্তরিত।
 */
export function oneColorExportCss(inkHex: string): string {
  return `
.book { --book-ink: ${inkHex}; }
.callout-concept { background: color-mix(in srgb, ${inkHex} 7%, transparent); border: 1px solid color-mix(in srgb, ${inkHex} 30%, transparent); border-left: 4px solid ${inkHex}; }
.callout-warning { background: color-mix(in srgb, ${inkHex} 6%, transparent); border: 1px solid color-mix(in srgb, ${inkHex} 28%, transparent); border-left: 4px solid color-mix(in srgb, ${inkHex} 85%, white); }
.callout-formula { background: color-mix(in srgb, ${inkHex} 7%, transparent); border: 1px solid color-mix(in srgb, ${inkHex} 30%, transparent); border-left: 4px solid color-mix(in srgb, ${inkHex} 78%, white); }
.callout-note { background: color-mix(in srgb, ${inkHex} 6%, transparent); border: 1px solid color-mix(in srgb, ${inkHex} 26%, transparent); border-left: 4px solid color-mix(in srgb, ${inkHex} 55%, white); }
.callout-badge { color: color-mix(in srgb, ${inkHex} 82%, black); }
.callout-concept .callout-badge, .callout-warning .callout-badge, .callout-formula .callout-badge, .callout-note .callout-badge { color: color-mix(in srgb, ${inkHex} 82%, black); }
.mcq-block { border-color: color-mix(in srgb, ${inkHex} 45%, white); }
.mcq-tag { background: ${inkHex}; }
.mcq-answer { background: color-mix(in srgb, ${inkHex} 12%, white); }
.toc-dots { border-bottom-color: color-mix(in srgb, ${inkHex} 55%, white); }
th { background: color-mix(in srgb, ${inkHex} 10%, white); }
th, td { border-color: color-mix(in srgb, ${inkHex} 45%, white); }
blockquote { border-left-color: color-mix(in srgb, ${inkHex} 55%, white); }
.fancy-divider { color: color-mix(in srgb, ${inkHex} 65%, white); }
a, a * { color: ${inkHex}; }
`;
}
