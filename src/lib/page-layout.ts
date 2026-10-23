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
