/**
 * পাতার কার্যকর layout-মান (কার্যকর মার্জিন ও টাইপোগ্রাফি)
 *
 * স্ক্রিন (paper-page), থাম্বনেইল, রুলার, Layout ট্যাব ও সব এক্সপোর্ট (HTML/DOCX)
 * এই এক বেইজ থেকেই পড়ে — ফলে পাতার নিজস্ব override সব জায়গায় হুবহু এক থাকে।
 *
 * React-মুক্ত পিওর মডিউল — lib (এক্সপোর্ট) ও কম্পোনেন্ট দুই দিক থেকেই নিরাপদে
 * আমদানি করা যায়। page-chrome.tsx এগুলো রি-এক্সপোর্ট করে।
 */

import type { DocumentSettings, Margins, PageData, PageStyleOverride, PageTypographyOverride, PaperSizeId } from './types';
import { getPageDimensionsMm, getPaperPreset, MM_PER_INCH } from './paper';

/**
 * পাতার কার্যকর কাগজের মাপ — পাতার নিজস্ব paperSizeOverride থাকলে সেটাই,
 * নইলে গ্লোবাল settings.paperSize। স্ক্রিন (paper-page), রুলার, থাম্বনেইল ও
 * সব এক্সপোর্ট (HTML/প্রিন্ট/DOCX) এই এক বেইজ থেকেই পড়ে — মিশ্র-মাপ ডকুমেন্টেও
 * (A4 বই + Legal প্রশ্নপত্র) প্রতিটি স্তরে হুবহু এক মাপ।
 */
export function effectivePageSize(page: PageData | null | undefined, settings: DocumentSettings): PaperSizeId {
  return page?.paperSizeOverride ?? settings.paperSize;
}

/**
 * পাতার কার্যকর মার্জিন — পাতার নিজস্ব override থাকলে সেটাই, নইলে গ্লোবাল।
 * Layout ট্যাবে "এই পাতায়" স্কোপে বা রুলার-হাতল টেনে মার্জিন বদলালে কেবল ওই
 * পাতার marginsOverride লেখা হয় — বাকি পাতা গ্লোবাল ডিফল্ট মানে চলে।
 */
export function effectivePageMargins(page: PageData | null | undefined, settings: DocumentSettings): Margins {
  return page?.marginsOverride ?? settings.margins;
}

/**
 * পাতার কার্যকর টাইপোগ্রাফি — পাতার আংশিক override গ্লোবাল ডিফল্টের উপরে মার্জ হয়
 * (শুধু ব্যবহারকারী যে ফিল্ড বদলেছেন সেটাই বদলায়, বাকিগুলো গ্লোবাল অনুসরণ করে)।
 */
export function effectivePageTypography(page: PageData | null | undefined, settings: DocumentSettings): Required<PageTypographyOverride> {
  const o = page?.typeOverride;
  return {
    defaultFont: o?.defaultFont ?? settings.defaultFont,
    defaultFontSize: o?.defaultFontSize ?? settings.defaultFontSize,
    lineHeight: o?.lineHeight ?? settings.lineHeight,
    paragraphSpacing: o?.paragraphSpacing ?? settings.paragraphSpacing,
  };
}

/**
 * পাতার টাইপোগ্রাফি override-সহ সেটিংস ক্লোন — DOCX এক্সপোর্টে blockToDocx-এ
 * পাঠানো হয়, ফলে প্যারা-স্পেসিং/লাইন-হাইট/ফন্ট-সাইজ পাতার নিজস্ব মান অনুসরণ করে।
 */
export function settingsWithPageTypography(page: PageData | null | undefined, settings: DocumentSettings): DocumentSettings {
  const t = effectivePageTypography(page, settings);
  return {
    ...settings,
    defaultFont: t.defaultFont,
    defaultFontSize: t.defaultFontSize,
    lineHeight: t.lineHeight,
    paragraphSpacing: t.paragraphSpacing,
  };
}

/**
 * পাতার কার্যকর রূপ — কাগজের রং, বর্ডার (কাইন্ড/স্টাইল/প্রস্থ/রং) ও পানির ছাপ।
 * পাতার নিজস্ব styleOverride গ্লোবাল ডিফল্টের উপরে মার্জ হয় — স্ক্রিন, থাম্বনেইল,
 * রুলার ও সব এক্সপোর্ট এই এক বেইজ থেকেই পড়ে, তাই পাতাভেদে আলাদা রূপও সবখানে হুবহু এক।
 * (pageBorderStyle/pageBorderWidth পুরনো ডকুমেন্টে অনুপস্থিত হতে পারে — pageBorder কাইন্ড
 * থেকে paper.ts-এর effectivePageBorderStyle/Width ডেরাইভ করে।)
 */
export function effectivePageStyle(page: PageData | null | undefined, settings: DocumentSettings): PageStyleOverride {
  const o = page?.styleOverride;
  return {
    paperColor: o?.paperColor ?? settings.paperColor,
    pageBorder: o?.pageBorder ?? settings.pageBorder,
    pageBorderStyle: o?.pageBorderStyle ?? settings.pageBorderStyle,
    pageBorderWidth: o?.pageBorderWidth ?? settings.pageBorderWidth,
    pageBorderColor: o?.pageBorderColor ?? settings.pageBorderColor,
    watermark: o?.watermark ?? settings.watermark,
  };
}

/**
 * পাতার রূপ-override-সহ সেটিংস ক্লোন — pageBorderVisual()-এর মতো সেটিংস-আকৃতির
 * ভোক্তাদের কাছে পাতার নিজস্ব রূপ পাঠাতে (এক্সপোর্ট/প্রিন্ট)।
 */
export function settingsWithPageStyle(page: PageData | null | undefined, settings: DocumentSettings): DocumentSettings {
  const st = effectivePageStyle(page, settings);
  // কার্যকর রূপের প্রতিটি ফিল্ডই গ্লোবাল-ডিফল্ট ফলব্যাকসহ আসে — রানটাইমে অনুপস্থিত হয় না;
  // টাইপ-দিকে শুধু DocumentSettings-এর প্রয়োজনীয়তা মেলাতে cast
  return {
    ...settings,
    paperColor: st.paperColor,
    pageBorder: st.pageBorder,
    pageBorderStyle: st.pageBorderStyle,
    pageBorderWidth: st.pageBorderWidth,
    pageBorderColor: st.pageBorderColor,
    watermark: st.watermark,
  } as DocumentSettings;
}

// ─── ডকুমেন্ট স্টুডিও-নকশার প্রতি-কাগজ মার্জিন ───

/**
 * DS-নকশার A4-রেফারেন্স মার্জিন (ইঞ্চি) — প্রিভিউ-শীটের .ds-sheet প্যাডিং
 * (46px/54px @96dpi) ঠিক এই মানই — তাই A4-তে প্রিভিউ = বসানো পাতা হুবহু (WYSIWYG)।
 */
export const DS_REF_MARGIN = { top: 0.48, bottom: 0.48, left: 0.5625, right: 0.5625 } as const;

/** ছাপাখানার নিরাপত্তা-মেঝে (ইঞ্চি) — কনটেন্ট কাগজের ধারে কাটা পড়বে না */
const DS_MARGIN_FLOOR = { top: 0.3, side: 0.35 } as const;

const clampNum = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;

/**
 * প্রদত্ত কাগজ-মাপে DS-নকশার কার্যকর মার্জিন — **A4-আনুপাতিক**।
 *
 * A4-রেফারেন্স মার্জিন কাগজের প্রস্থ/উচ্চতা-অনুপাতে স্কেল হয় (ক্ল্যাম্প ০.৫৫–১.২৫,
 * ছাপাখানার নিরাপত্তা-মেঝেসহ) — ফলে Demy/Crown-এর মতো ছোট বইয়ে 0.5625″ বিশাল
 * মার্জিনে নকশা চড়া-চড়া ভাবে না, Legal-এ আনুপাতিক বড় হয়। প্রিভিউ-শীটও এই এক
 * ফাংশনের মানই প্যাডিং হিসেবে পায় — স্ক্রিন/প্রিভিউ/সন্নিবেশ সবখানে হুবহু এক।
 */
export function dsMarginsForPaper(
  paperSize: PaperSizeId,
  orientation: 'portrait' | 'landscape',
  custom: { widthMm: number; heightMm: number },
): Pick<Margins, 'top' | 'bottom' | 'left' | 'right'> {
  const { widthMm, heightMm } = getPageDimensionsMm(paperSize, orientation, custom);
  const wIn = widthMm / MM_PER_INCH;
  const hIn = heightMm / MM_PER_INCH;
  const a4W = 210 / MM_PER_INCH;
  const a4H = 297 / MM_PER_INCH;
  const sw = clampNum(wIn / a4W, 0.55, 1.25);
  const sh = clampNum(hIn / a4H, 0.55, 1.25);
  return {
    top: Math.max(DS_MARGIN_FLOOR.top, round3(DS_REF_MARGIN.top * sh)),
    bottom: Math.max(DS_MARGIN_FLOOR.top, round3(DS_REF_MARGIN.bottom * sh)),
    left: Math.max(DS_MARGIN_FLOOR.side, round3(DS_REF_MARGIN.left * sw)),
    right: Math.max(DS_MARGIN_FLOOR.side, round3(DS_REF_MARGIN.right * sw)),
  };
}

// ─── বই-ব্লুপ্রিন্টের জনর-ভিত্তিক প্রতি-কাগজ মার্জিন ───

/** বই-ব্লুপ্রিন্টের নিরাপত্তা-মেঝে (ইঞ্চি) — বাঁধাই-নিরাপদ সর্বনিম্ন; এর নিচে নামলে ছাপায় কাটা পড়ে */
const BP_MARGIN_FLOOR = { v: 0.4, h: 0.42 } as const;

/**
 * বই-ব্লুপ্রিন্টের জনর-ভিত্তিক রেফারেন্স মার্জিন প্রদত্ত কাগজে নামানো।
 *
 * প্রতিটি ব্লুপ্রিন্ট নিজের ঘরানার মার্জিন জানে (উপন্যাস = ধীর-স্নিগ্ধ প্রশস্ত,
 * পাঠ্যবই/কোচিং = ঘন-সঘন, ম্যাগাজিন = কমপ্যাক্ট) — ব্লুপ্রিন্টের ঘোষিত কাগজে
 * টিউন করা রেফারেন্স মান। ভিন্ন কাগজে বসলে প্রস্থ/উচ্চতা-অনুপাতে আনুপাতিক স্কেল
 * হয় (ক্ল্যাম্প ০.৬–১.৪, নিরাপত্তা-মেঝেসহ)।
 *
 * এই ফাংশন ছাড়া ব্লুপ্রিন্ট ব্যবহারকারীর পুরনো গ্লোবাল মার্জিনে (সাধারণত ১″) আটকে
 * যেত — Demy উপন্যাসে (৫.৪৩″ প্রস্থ) দুই পাশে ১″ মানে মাত্র ৩.৪″ টেক্সট-কলাম —
 * পেশাদার বইয়ের ~৪.২″-এর তুলনায় বিপর্যয়। gutter সবসময় ০ (বাঁইডিং পরে Layout ট্যাবে)।
 */
export function blueprintMarginsForPaper(
  ref: Pick<Margins, 'top' | 'bottom' | 'left' | 'right'>,
  refPaper: PaperSizeId | undefined,
  targetPaper: PaperSizeId,
  orientation: 'portrait' | 'landscape',
  custom: { widthMm: number; heightMm: number },
): Margins {
  // রেফারেন্স-কাগজ অজানা বা টার্গেট-ই হলে স্কেল নেই — টিউন করা মানই চূড়ান্ত
  if (!refPaper || refPaper === targetPaper) return { ...ref, gutter: 0 };
  const rp = getPaperPreset(refPaper);
  const { widthMm, heightMm } = getPageDimensionsMm(targetPaper, orientation, custom);
  const sw = clampNum(widthMm / rp.widthMm, 0.6, 1.4);
  const sh = clampNum(heightMm / rp.heightMm, 0.6, 1.4);
  return {
    top: Math.max(BP_MARGIN_FLOOR.v, round3(ref.top * sh)),
    bottom: Math.max(BP_MARGIN_FLOOR.v, round3(ref.bottom * sh)),
    left: Math.max(BP_MARGIN_FLOOR.h, round3(ref.left * sw)),
    right: Math.max(BP_MARGIN_FLOOR.h, round3(ref.right * sw)),
    gutter: 0,
  };
}
