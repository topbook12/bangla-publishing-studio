/**
 * কাগজের সাইজ, মার্জিন প্রিসেট, ফন্ট তালিকা ও বুক থিম
 */

import type {
  BookTheme, DocumentSettings, Margins, PageBorderStyle, PageBorderWidth, PaperSizeId,
} from './types';

export interface PaperPreset {
  id: PaperSizeId;
  name: string;
  /** mm এককে পোর্ট্রেট ডাইমেনশন */
  widthMm: number;
  heightMm: number;
  note: string;
}

export const PAPER_PRESETS: PaperPreset[] = [
  { id: 'a4', name: 'A4', widthMm: 210, heightMm: 297, note: 'General documents & notices' },
  { id: 'letter', name: 'Letter', widthMm: 216, heightMm: 279, note: 'American standard' },
  { id: 'crown-octavo', name: 'Crown Octavo', widthMm: 184, heightMm: 241, note: 'Popular trim size for coaching books' },
  { id: 'demy-octavo', name: 'Demy Octavo', widthMm: 138, heightMm: 216, note: 'Novels & literature books' },
  { id: 'a5', name: 'A5', widthMm: 148, heightMm: 210, note: 'Handbooks & notebooks' },
  { id: 'custom', name: 'Custom', widthMm: 210, heightMm: 297, note: 'Set your own dimensions' },
];

export function getPaperPreset(id: PaperSizeId): PaperPreset {
  return PAPER_PRESETS.find((p) => p.id === id) ?? PAPER_PRESETS[0];
}

/** প্রকৃত পৃষ্ঠা ডাইমেনশন (mm) — অরিয়েন্টেশনসহ */
export function getPageDimensionsMm(
  paperSize: PaperSizeId,
  orientation: 'portrait' | 'landscape',
  custom: { widthMm: number; heightMm: number },
): { widthMm: number; heightMm: number } {
  const preset = getPaperPreset(paperSize);
  const base =
    paperSize === 'custom'
      ? { widthMm: custom.widthMm, heightMm: custom.heightMm }
      : { widthMm: preset.widthMm, heightMm: preset.heightMm };
  return orientation === 'landscape'
    ? { widthMm: base.heightMm, heightMm: base.widthMm }
    : base;
}

export const MM_PER_INCH = 25.4;
export const PT_PER_MM = 2.834645;

/** ইঞ্চি → px (96dpi) */
export const inchToPx = (inch: number): number => inch * 96;
/** mm → px (96dpi) */
export const mmToPx = (mm: number): number => (mm / MM_PER_INCH) * 96;
/** px → mm */
export const pxToMm = (px: number): number => (px * MM_PER_INCH) / 96;

export const MARGIN_PRESETS: Array<{ id: string; name: string; margins: Omit<Margins, 'gutter'> }> = [
  { id: 'normal', name: 'Normal (1 inch)', margins: { top: 1, bottom: 1, left: 1, right: 1 } },
  { id: 'narrow', name: 'Narrow (0.5 inch)', margins: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 } },
  { id: 'wide', name: 'Wide (1.25 inch)', margins: { top: 1.25, bottom: 1.25, left: 1.25, right: 1.25 } },
  { id: 'book', name: 'Book (top 0.75, side 1)', margins: { top: 0.75, bottom: 0.9, left: 1, right: 0.9 } },
];

// ─── পেজ বর্ডার ───

/** প্রস্থ প্রিসেট → px */
export const PAGE_BORDER_WIDTH_PX: Record<PageBorderWidth, number> = { thin: 1, medium: 2, thick: 4 };

/** কার্যকর বর্ডার লাইন স্টাইল — পুরনো ডকুমেন্টে pageBorderStyle না থাকলে pageBorder কাইন্ড থেকে ডেরাইভ */
export function effectivePageBorderStyle(s: DocumentSettings): PageBorderStyle {
  return s.pageBorderStyle ?? (s.pageBorder === 'double' ? 'double' : 'solid');
}

/** কার্যকর বর্ডার প্রস্থ — পুরনো ডকুমেন্টে pageBorderWidth না থাকলে pageBorder কাইন্ড থেকে ডেরাইভ */
export function effectivePageBorderWidth(s: DocumentSettings): PageBorderWidth {
  return s.pageBorderWidth ?? (s.pageBorder === 'double' ? 'thick' : 'thin');
}

/**
 * পেজ কনটেন্ট বক্সের বর্ডার CSS — স্ক্রিন ও প্রিন্ট একই ইনলাইন স্টাইল ব্যবহার করে,
 * তাই কনফিগার করা রং/স্টাইল/প্রস্থ প্রিন্টেও ঠিকভাবে আসে।
 */
export function pageBorderVisual(s: DocumentSettings): { border?: string; boxShadow?: string } {
  if (s.pageBorder === 'none') return {};
  const color = s.pageBorderColor || '#1e293b';
  if (s.pageBorder === 'ornamental') {
    return { border: `2px solid ${color}`, boxShadow: `inset 0 0 0 3px #fff, inset 0 0 0 4px ${color}` };
  }
  return {
    border: `${PAGE_BORDER_WIDTH_PX[effectivePageBorderWidth(s)]}px ${effectivePageBorderStyle(s)} ${color}`,
  };
}

// ─── ফন্ট ───

export interface FontOption {
  /** CSS font-family-র প্রথম নাম */
  family: string;
  name: string;
  stack: string;
}

/**
 * বাংলা ফন্ট তালিকা — বান্ডেল করা (fontsource, অফলাইন) + CDN (Kalpurush ইত্যাদি)
 */
export const FONT_OPTIONS: FontOption[] = [
  { family: 'Noto Serif Bengali', name: 'Noto Serif Bengali', stack: "'Noto Serif Bengali', serif" },
  { family: 'Noto Sans Bengali', name: 'Noto Sans Bengali', stack: "'Noto Sans Bengali', sans-serif" },
  { family: 'Hind Siliguri', name: 'Hind Siliguri', stack: "'Hind Siliguri', sans-serif" },
  { family: 'Kalpurush', name: 'Kalpurush', stack: "'Kalpurush', 'Noto Sans Bengali', sans-serif" },
  { family: 'SolaimanLipi', name: 'SolaimanLipi', stack: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif" },
  { family: 'Siyam Rupali', name: 'Siyam Rupali', stack: "'Siyam Rupali', 'Noto Sans Bengali', serif" },
  { family: 'Tiro Bangla', name: 'Tiro Bangla', stack: "'Tiro Bangla', serif" },
  { family: 'Baloo Da 2', name: 'Baloo Da 2', stack: "'Baloo Da 2', cursive" },
  { family: 'Anek Bangla', name: 'Anek Bangla', stack: "'Anek Bangla', sans-serif" },
  { family: 'Atma', name: 'Atma', stack: "'Atma', cursive" },
  { family: 'Mina', name: 'Mina', stack: "'Mina', sans-serif" },
  { family: 'Galada', name: 'Galada', stack: "'Galada', cursive" },
];

export function fontStackOf(family: string): string {
  return FONT_OPTIONS.find((f) => f.family === family)?.stack ?? `'${family}', 'Noto Sans Bengali', sans-serif`;
}

// ─── থিম ───

export const BOOK_THEMES: BookTheme[] = [
  {
    id: 'coaching-pro',
    name: 'Coaching Pro',
    description: 'Magazine-style parallel header with a modern academic look',
    paperColor: 'white',
    accentColor: '#4f46e5',
    headerStyle: 'parallel',
    defaultFont: 'Hind Siliguri',
    defaultFontSize: 13,
    lineHeight: 1.55,
    pageBorder: 'none',
  },
  {
    id: 'classic-royal',
    name: 'Classic Royal',
    description: 'Cream paper, royal flourish header — classic publishing house style',
    paperColor: 'cream',
    accentColor: '#7f1d1d',
    headerStyle: 'royal',
    defaultFont: 'Noto Serif Bengali',
    defaultFontSize: 14,
    lineHeight: 1.7,
    pageBorder: 'double',
  },
  {
    id: 'modern-academic',
    name: 'Modern Academic',
    description: 'Slim minimal header, clean typography',
    paperColor: 'white',
    accentColor: '#0f766e',
    headerStyle: 'academic',
    defaultFont: 'Noto Sans Bengali',
    defaultFontSize: 13,
    lineHeight: 1.6,
    pageBorder: 'none',
  },
  {
    id: 'literature',
    name: 'Literature Collection',
    description: 'Tiro Bangla, cream paper — for novels & poetry',
    paperColor: 'cream',
    accentColor: '#166534',
    headerStyle: 'royal',
    defaultFont: 'Tiro Bangla',
    defaultFontSize: 15,
    lineHeight: 1.85,
    pageBorder: 'thin',
  },
  {
    id: 'midnight',
    name: 'Midnight (Dark)',
    description: 'Dark paper, amber accent — easy on the eyes for screen reading',
    paperColor: 'dark',
    accentColor: '#d97706',
    headerStyle: 'plain',
    defaultFont: 'Noto Sans Bengali',
    defaultFontSize: 13,
    lineHeight: 1.6,
    pageBorder: 'none',
  },
];

// ─── সম্পাদক সাইজ অপশন ───

export const FONT_SIZE_OPTIONS = [9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 36, 42, 48, 56, 64];

export const COLOR_SWATCHES = [
  '#0f172a', '#334155', '#64748b', '#94a3b8', '#dc2626', '#ea580c',
  '#d97706', '#ca8a04', '#16a34a', '#059669', '#0d9488', '#0891b2',
  '#7c3aed', '#9333ea', '#c026d3', '#db2777', '#e11d48', '#7f1d1d',
  '#166534', '#1d4ed8', '#ffffff',
];

export const HIGHLIGHT_SWATCHES = [
  '#fef08a', '#fde68a', '#bbf7d0', '#a7f3d0', '#bfdbfe', '#ddd6fe',
  '#fbcfe8', '#fecaca', '#e5e7eb', '#f3e8ff',
];
