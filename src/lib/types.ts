/**
 * বাংলা পাবলিশিং স্টুডিও — কোর টাইপ ডেফিনিশন
 * পুরো অ্যাপের ডেটা মডেল এখান থেকে আসে।
 */

import type { PageNumberFormat } from './bangla';

export type { PageNumberFormat };

// ─── কাগজ ও মার্জিন ───

export type PaperSizeId = 'a4' | 'a5' | 'letter' | 'crown-octavo' | 'demy-octavo' | 'crown-16mo' | 'custom';
export type Orientation = 'portrait' | 'landscape';
export type PaperColor = 'white' | 'cream' | 'dark';

/** পেজ বর্ডার লাইন স্টাইল */
export type PageBorderStyle = 'solid' | 'double' | 'dashed';
/** পেজ বর্ডার লাইনের প্রস্থ */
export type PageBorderWidth = 'thin' | 'medium' | 'thick';

export interface Margins {
  /** ইঞ্চি এককে */
  top: number;
  bottom: number;
  left: number;
  right: number;
  /** বাঁইডিংয়ের জন্য অতিরিক্ত স্পাইন মার্জিন (ইঞ্চি) */
  gutter: number;
}

// ─── হেডার/ফুটার ───

export type HeaderFooterStyle = 'none' | 'parallel' | 'royal' | 'academic' | 'plain';

export interface HeaderFooterSettings {
  enabled: boolean;
  style: HeaderFooterStyle;
  /** বাম টেক্সট (যেমন অধ্যায়/টপিক ট্যাগ) */
  leftText: string;
  /** মাঝের টেক্সট (যেমন বইয়ের নাম) */
  centerText: string;
  /** ডানের টেক্সট (যেমন প্রতিষ্ঠানের নাম) */
  rightText: string;
  /** হেডার/ফুটারের দাগের রং (hex) */
  accentColor: string;
  /** ফন্ট সাইজ (pt) */
  fontSize: number;
}

// ─── পৃষ্ঠা নম্বর ইঞ্জিন ───

export type PageNumberPosition = 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';

export interface PageNumberSettings {
  enabled: boolean;
  format: PageNumberFormat;
  position: PageNumberPosition;
  /** প্রথম কনটেন্ট পৃষ্ঠার প্রদর্শিত নম্বর */
  startAt: number;
  /** প্রথম পৃষ্ঠায় (কভার) হেডার/ফুটার/নম্বর লুকানো */
  differentFirst: boolean;
  /** বইয়ের মতো অজর/জোড় পৃষ্ঠায় বিপরীত অ্যালাইনমেন্ট */
  oddEven: boolean;
  /** নম্বরের সাথে বাড়তি টেক্সট, যেমন "পৃষ্ঠা ৩" */
  prefix: string;
}

// ─── পানির ছাপ (Watermark) ───

/** পাতার পেছনের হালকা ঘূর্ণিত লেখা — খসড়া/নমুনা/গোপনীয় কপি শনাক্ত করতে */
export interface WatermarkSettings {
  enabled: boolean;
  /** ছাপের লেখা — যেমন 'খসড়া' */
  text: string;
  /** 0.04–0.35 — হালকা থেকে গাঢ় */
  opacity: number;
  /** ডিগ্রিতে ঘূর্ণন (-90 … 90) */
  angle: number;
  /** লেখার সাইজ (pt) */
  fontSize: number;
  /** hex রং */
  color: string;
}

// ─── ডকুমেন্ট সেটিংস ───

export interface DocumentSettings {
  paperSize: PaperSizeId;
  /** custom সাইজ হলে mm এককে */
  customPaper: { widthMm: number; heightMm: number };
  orientation: Orientation;
  margins: Margins;
  paperColor: PaperColor;
  header: HeaderFooterSettings;
  footer: HeaderFooterSettings;
  pageNumber: PageNumberSettings;
  /** নতুন লেখার ডিফল্ট ফন্ট (CSS font-family প্রথম নাম) */
  defaultFont: string;
  /** pt এককে */
  defaultFontSize: number;
  /** লাইন হাইট (মাল্টিপ্লায়ার) */
  lineHeight: number;
  /** প্যারাগ্রাফের নিচে স্পেসিং (px) */
  paragraphSpacing: number;
  /** এডিটিংয়ের সময় অতিরিক্ত কনটেন্ট স্বয়ংক্রিয়ভাবে পরের পৃষ্ঠায় যাবে কি না */
  autoFlow: boolean;
  /** প্রতিটি পৃষ্ঠায় সীমানা বক্স (বইয়ের অলংকরণ) */
  pageBorder: 'none' | 'thin' | 'double' | 'ornamental';
  pageBorderColor: string;
  /** বর্ডার লাইন স্টাইল — পুরনো ডকুমেন্টে অনুপস্থিত হলে pageBorder থেকে ডেরাইভ হয় */
  pageBorderStyle?: PageBorderStyle;
  /** বর্ডার লাইনের প্রস্থ — পুরনো ডকুমেন্টে অনুপস্থিত হলে pageBorder থেকে ডেরাইভ হয় */
  pageBorderWidth?: PageBorderWidth;
  /** প্রতিটি পাতার পেছনের পানির ছাপ — পুরনো ডকুমেন্টে অনুপস্থিত থাকলে ডিফল্ট ধরে নেওয়া হয় */
  watermark: WatermarkSettings;
}

// ─── পৃষ্ঠা ও প্রজেক্ট ───

export type PageKind = 'normal' | 'cover';

export interface CoverData {
  title: string;
  subtitle: string;
  author: string;
  organization: string;
  course: string;
  year: string;
  accentColor: string;
  style: 'classic' | 'modern' | 'coaching';
}

export interface PageData {
  id: string;
  kind: PageKind;
  /** TipTap editor-এর HTML আউটপুট (স্টোরেজ ফরম্যাট) */
  html: string;
  /** এই পৃষ্ঠায় হেডার/ফুটার/নম্বর লুকানো (অধ্যায়ের শুরুর পাতায় দরকার হয়) */
  noChrome: boolean;
  coverData?: CoverData;
  /** এই পাতার জন্য কাস্টম হেডার — null/অনুপস্থিত হলে গ্লোবাল settings.header */
  headerOverride?: HeaderFooterSettings | null;
  /** এই পাতার জন্য কাস্টম ফুটার — null/অনুপস্থিত হলে গ্লোবাল settings.footer */
  footerOverride?: HeaderFooterSettings | null;
  /**
   * টেমপ্লেট-ডিজাইন লক — অটো-ফ্লো এই পাতাকে ভাঙবে/উপরে টানবে না (কভারের মতোই
   * পূর্ণ-পাতার নকশা)। ব্যবহারকারী প্রথম নিজে কিছু সম্পাদনা করলেই লক খুলে যায়।
   */
  flowLock?: boolean;
}

export interface BookProject {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  settings: DocumentSettings;
  pages: PageData[];
}

// ─── TOC ───

export interface TocEntry {
  text: string;
  level: number;
  /** প্রদর্শিত পৃষ্ঠা নম্বর (সেটিংস ফরম্যাটে) */
  pageNumber: string;
}

// ─── UI স্টেট ───

export type RibbonTab = 'home' | 'insert' | 'layout' | 'design' | 'review' | 'export' | 'ai';

export interface SaveState {
  status: 'idle' | 'saving' | 'saved' | 'error';
  at: number | null;
}

// ─── বুক থিম ───

export interface BookTheme {
  id: string;
  name: string;
  description: string;
  paperColor: PaperColor;
  accentColor: string;
  headerStyle: HeaderFooterStyle;
  defaultFont: string;
  defaultFontSize: number;
  lineHeight: number;
  pageBorder: DocumentSettings['pageBorder'];
}
