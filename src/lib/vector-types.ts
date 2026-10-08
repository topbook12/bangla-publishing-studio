/**
 * ভেক্টর লাইব্রেরি — শেয়ার্ড টাইপ ও প্যালেট (অ্যাসেট ফাইলগুলোর কনট্র্যাক্ট)।
 *
 * বিল্ট-ইন ভেক্টর ও ইলাস্ট্রেশন লাইব্রেরি: বই-লেখকের জন্য শিক্ষামূলক
 * হাতে-আঁকা SVG চিত্র — পদার্থবিজ্ঞান, গণিত, রসায়ন, জীববিজ্ঞান, ভূগোল,
 * চার্ট ও কমন এলিমেন্ট। সব SVG = স্বয়ংসম্পূর্ণ, ভেক্টর (জুমে ফাটে না,
 * ছাপায় ৩০০dpi-র মতো শার্প), কপিরাইট-মুক্ত।
 *
 * কনটেন্ট ফাইলসমূহ: vector-physics.ts, vector-math.ts, vector-science.ts,
 * vector-misc.ts — এগ্রিগেটর: vector-catalog.ts
 * ব্যবহারকারী: design-ext.tsx (DocFigure নোড), vector-library-dialog.tsx, export-docx.ts
 */

export type VectorCat =
  | 'physics'
  | 'math'
  | 'chem'
  | 'bio'
  | 'geo'
  | 'chart'
  | 'common';

export interface VectorDef {
  /** ইউনিক আইডি — প্রিফিক্স: phy- / math- / chem- / bio- / geo- / chart- / com- */
  id: string;
  cat: VectorCat;
  /** বাংলা নাম (স্টোরে দেখাবে) */
  label: string;
  /** সার্চ কীওয়ার্ড — ইংরেজি + বাংলা, স্পেস-আলাদা, ছোট হাতের */
  kw: string;
  /** প্রস্তাবিত ঢোকানোর প্রস্থ (px) — সাধারণত 90 / 300 / 360 */
  w: number;
  /** সম্পূর্ণ inline SVG স্ট্রিং (viewBox আবশ্যক) */
  svg: string;
}

/** উষ্ণ এডিটরিয়াল প্যালেট — sticker-catalog-এর সাথে মিলিয়ে; ছাপায় নির্ভরযোগ্য */
export const VP = {
  ink: '#3d3229',
  gold: '#c8a24a',
  terracotta: '#b3593b',
  leaf: '#5d7a4e',
  deep: '#8a3b3b',
  cream: '#f4ead2',
  sky: '#5f7d95',
  slate: '#7a8ba0',
  amber: '#d9a441',
} as const;

/** লেবেল/টেক্সটের জন্য SVG font-family — <img> আইসোলেশনেও কাজ করে */
export const VFONT = `'Noto Sans Bengali','Nirmala UI','Bangla MN','Segoe UI',sans-serif`;
