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
  { id: 'crown-octavo', name: 'Crown Quarto (ক্রাউন ১/৪)', widthMm: 184, heightMm: 241, note: 'Coaching books & textbooks — most common press size (7.25"×9.5")' },
  { id: 'demy-octavo', name: 'Demy Octavo (ডেমি ১/৮)', widthMm: 138, heightMm: 216, note: 'Novels & literature books (5.5"×8.5")' },
  { id: 'crown-16mo', name: 'Crown Octavo (ক্রাউন ১/৮)', widthMm: 127, heightMm: 190, note: 'Pocket novels, poetry & story books (5"×7.5")' },
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
  /** ফন্ট ড্রপডাউনে গ্রুপ শিরোনাম (বাংলা / দেবনাগরী / হিন্দি লিগ্যাসি) */
  group?: 'bangla' | 'devanagari' | 'hindi-legacy';
  /** লিগ্যাসি (নন-ইউনিকোড) ফন্ট — Remington Gail লেআউটে টাইপ করতে হয় */
  legacy?: boolean;
  /** ড্রপডাউনে নামের পাশে ছোট নোট (যেমন "Standard", "Windows") */
  note?: { bn: string; hi: string; en: string };
}

/**
 * ফন্ট তালিকা — বাংলা + দেবনাগরী (হিন্দি)। বান্ডেল করা (fontsource, অফলাইন) + CDN (Kalpurush ইত্যাদি)
 */
export const FONT_OPTIONS: FontOption[] = [
  { family: 'Noto Serif Bengali', name: 'Noto Serif Bengali', stack: "'Noto Serif Bengali', serif", group: 'bangla' },
  { family: 'Noto Sans Bengali', name: 'Noto Sans Bengali', stack: "'Noto Sans Bengali', sans-serif", group: 'bangla' },
  { family: 'Hind Siliguri', name: 'Hind Siliguri', stack: "'Hind Siliguri', sans-serif", group: 'bangla' },
  { family: 'Kalpurush', name: 'Kalpurush', stack: "'Kalpurush', 'Noto Sans Bengali', sans-serif", group: 'bangla' },
  { family: 'SolaimanLipi', name: 'SolaimanLipi', stack: "'SolaimanLipi', 'Noto Sans Bengali', sans-serif", group: 'bangla' },
  { family: 'Siyam Rupali', name: 'Siyam Rupali', stack: "'Siyam Rupali', 'Noto Sans Bengali', serif", group: 'bangla' },
  { family: 'Tiro Bangla', name: 'Tiro Bangla', stack: "'Tiro Bangla', serif", group: 'bangla' },
  { family: 'Baloo Da 2', name: 'Baloo Da 2', stack: "'Baloo Da 2', cursive", group: 'bangla' },
  { family: 'Anek Bangla', name: 'Anek Bangla', stack: "'Anek Bangla', sans-serif", group: 'bangla' },
  { family: 'Atma', name: 'Atma', stack: "'Atma', cursive", group: 'bangla' },
  { family: 'Mina', name: 'Mina', stack: "'Mina', sans-serif", group: 'bangla' },
  { family: 'Galada', name: 'Galada', stack: "'Galada', cursive", group: 'bangla' },
  // দেবনাগরী (হিন্দি) — ইউনিকোড: ইন্ডাস্ট্রি স্ট্যান্ডার্ড (বান্ডেল) + Google ফন্ট (বান্ডেল), অফলাইনেও চলে
  { family: 'Mangal', name: 'Mangal', stack: "'Mangal', 'Noto Sans Devanagari', sans-serif", group: 'devanagari', note: { bn: 'উইন্ডোজ স্ট্যান্ডার্ড', hi: 'विंडोज़ मानक', en: 'Windows standard' } },
  { family: 'Aparajita', name: 'Aparajita', stack: "'Aparajita', 'Noto Sans Devanagari', sans-serif", group: 'devanagari', note: { bn: 'উইন্ডোজ', hi: 'विंडोज़', en: 'Windows' } },
  { family: 'Kokila', name: 'Kokila', stack: "'Kokila', 'Noto Sans Devanagari', sans-serif", group: 'devanagari', note: { bn: 'উইন্ডোজ', hi: 'विंडोज़', en: 'Windows' } },
  { family: 'Utsaah', name: 'Utsaah', stack: "'Utsaah', 'Noto Sans Devanagari', sans-serif", group: 'devanagari', note: { bn: 'উইন্ডোজ', hi: 'विंडोज़', en: 'Windows' } },
  { family: 'Sanskrit Text', name: 'Sanskrit Text', stack: "'Sanskrit Text', 'Noto Serif Devanagari', serif", group: 'devanagari', note: { bn: 'উইন্ডোজ', hi: 'विंडोज़', en: 'Windows' } },
  { family: 'Nirmala UI', name: 'Nirmala UI', stack: "'Nirmala UI', 'Noto Sans Devanagari', sans-serif", group: 'devanagari', note: { bn: 'আধুনিক উইন্ডোজ', hi: 'आधुनिक विंडोज़', en: 'Modern Windows' } },
  { family: 'Sahadeva', name: 'Sahadeva', stack: "'Sahadeva', 'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Noto Serif Devanagari', name: 'Noto Serif Devanagari', stack: "'Noto Serif Devanagari', serif", group: 'devanagari' },
  { family: 'Noto Sans Devanagari', name: 'Noto Sans Devanagari', stack: "'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Anek Devanagari', name: 'Anek Devanagari', stack: "'Anek Devanagari', 'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Hind', name: 'Hind (Hindi)', stack: "'Hind', 'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Tiro Devanagari Hindi', name: 'Tiro Devanagari Hindi', stack: "'Tiro Devanagari Hindi', serif", group: 'devanagari' },
  { family: 'Sahitya', name: 'Sahitya', stack: "'Sahitya', 'Noto Serif Devanagari', serif", group: 'devanagari' },
  { family: 'Halant', name: 'Halant', stack: "'Halant', 'Noto Serif Devanagari', serif", group: 'devanagari' },
  { family: 'Martel', name: 'Martel', stack: "'Martel', serif", group: 'devanagari' },
  { family: 'Mukta', name: 'Mukta', stack: "'Mukta', sans-serif", group: 'devanagari' },
  { family: 'Khula', name: 'Khula', stack: "'Khula', 'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Karma', name: 'Karma', stack: "'Karma', 'Noto Serif Devanagari', serif", group: 'devanagari' },
  { family: 'Laila', name: 'Laila', stack: "'Laila', 'Noto Serif Devanagari', serif", group: 'devanagari' },
  { family: 'Rajdhani', name: 'Rajdhani', stack: "'Rajdhani', 'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Yantramanav', name: 'Yantramanav', stack: "'Yantramanav', 'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Teko', name: 'Teko', stack: "'Teko', 'Noto Sans Devanagari', sans-serif", group: 'devanagari' },
  { family: 'Rozha One', name: 'Rozha One', stack: "'Rozha One', serif", group: 'devanagari' },
  { family: 'Baloo 2', name: 'Baloo 2 (Hindi)', stack: "'Baloo 2', cursive", group: 'devanagari' },
  { family: 'Yatra One', name: 'Yatra One', stack: "'Yatra One', cursive", group: 'devanagari' },
  { family: 'Kalam', name: 'Kalam', stack: "'Kalam', cursive", group: 'devanagari' },
  // হিন্দি লিগ্যাসি — Kruti Dev সিরিজ, DevLys 010, Chanakya (ভারতীয় ছাপাখানার DTP স্ট্যান্ডার্ড)।
  // নন-ইউনিকোড: Remington Gail কীবোর্ড লেআউটে টাইপ করলেই দেবনাগরী গ্লিফ দেখায় (MS Word-এর মতোই)।
  { family: 'Kruti Dev 010', name: 'Kruti Dev 010', stack: "'Kruti Dev 010', sans-serif", group: 'hindi-legacy', legacy: true, note: { bn: 'স্ট্যান্ডার্ড', hi: 'मानक', en: 'Standard' } },
  { family: 'Kruti Dev 011', name: 'Kruti Dev 011', stack: "'Kruti Dev 011', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 012', name: 'Kruti Dev 012', stack: "'Kruti Dev 012', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 014', name: 'Kruti Dev 014', stack: "'Kruti Dev 014', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 016', name: 'Kruti Dev 016', stack: "'Kruti Dev 016', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 021', name: 'Kruti Dev 021', stack: "'Kruti Dev 021', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 025', name: 'Kruti Dev 025', stack: "'Kruti Dev 025', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 030', name: 'Kruti Dev 030', stack: "'Kruti Dev 030', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 041', name: 'Kruti Dev 041', stack: "'Kruti Dev 041', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 050', name: 'Kruti Dev 050', stack: "'Kruti Dev 050', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 060', name: 'Kruti Dev 060', stack: "'Kruti Dev 060', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Kruti Dev 070', name: 'Kruti Dev 070', stack: "'Kruti Dev 070', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'DevLys 010', name: 'DevLys 010', stack: "'DevLys 010', sans-serif", group: 'hindi-legacy', legacy: true },
  { family: 'Chanakya', name: 'Chanakya', stack: "'Chanakya', sans-serif", group: 'hindi-legacy', legacy: true },
];

export function fontStackOf(family: string): string {
  // মার্কে থাকা ভ্যালু কোটেড হতে পারে (multi-word ফন্ট CSSOM-এ টিকতে কোট লাগে) — খুলে নিয়ে লুকআপ
  const bare = bareFontFamily(family);
  return FONT_OPTIONS.find((f) => f.family === bare)?.stack ?? `'${bare}', 'Noto Sans Bengali', sans-serif`;
}

/**
 * CSS font-family ভ্যালুতে ফন্টের নাম কোট করা — বাধ্যতামূলক!
 * "Kruti Dev 010", "Hind Siliguri", "Noto Sans Bengali"-র মতো multi-word নাম
 * বিনা কোটে দিলে Chromium-এর CSSOM ডিক্লারেশনটাই ফেলে দেয় (font-family: Kruti Dev 010
 * → invalid → style ফাঁকা) — ফন্ট নীরবে হারিয়ে যায়। কোট করলে ('Kruti Dev 010') টিকে যায়।
 */
export function quoteFontFamily(family: string): string {
  const bare = bareFontFamily(family);
  return /^[A-Za-z0-9-]+$/.test(bare) ? bare : `'${bare.replace(/'/g, "\\'")}'`;
}

/** মার্ক/স্টাইলের fontFamily ভ্যালু থেকে কোট খুলে প্রথম ফন্টের নাম */
export function bareFontFamily(family: string): string {
  const first = (family || '').split(',')[0] ?? '';
  return first.trim().replace(/^['"]+|['"]+$/g, '').replace(/\\'/g, "'");
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
