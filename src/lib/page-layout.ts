/**
 * পাতার কার্যকর layout-মান (কার্যকর মার্জিন ও টাইপোগ্রাফি)
 *
 * স্ক্রিন (paper-page), থাম্বনেইল, রুলার, Layout ট্যাব ও সব এক্সপোর্ট (HTML/DOCX)
 * এই এক বেইজ থেকেই পড়ে — ফলে পাতার নিজস্ব override সব জায়গায় হুবহু এক থাকে।
 *
 * React-মুক্ত পিওর মডিউল — lib (এক্সপোর্ট) ও কম্পোনেন্ট দুই দিক থেকেই নিরাপদে
 * আমদানি করা যায়। page-chrome.tsx এগুলো রি-এক্সপোর্ট করে।
 */

import type { DocumentSettings, Margins, PageData, PageTypographyOverride } from './types';

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
