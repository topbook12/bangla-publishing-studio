/**
 * পৃষ্ঠা নম্বর হিসাব ও প্রদর্শন সহায়ক
 */

import { formatPageNumber } from './bangla';
import type { PageData, PageNumberSettings } from './types';

/**
 * প্রদর্শিত পৃষ্ঠা নম্বর (খালি স্ট্রিং = নম্বর দেখানো হবে না)।
 * নিয়ম: differentFirst হলে ১ম পৃষ্ঠায় নম্বর লুকানো, কিন্তু গণনা চলতে থাকে।
 */
export function displayPageNumber(index: number, pn: PageNumberSettings): string {
  if (!pn.enabled) return '';
  if (pn.differentFirst && index === 0) return '';
  return formatPageNumber(pn.startAt + index, pn.format);
}

/** এই পৃষ্ঠায় হেডার/ফুটার দেখানো হবে কি না */
export function showHeader(index: number, page: PageData, pn: PageNumberSettings): boolean {
  if (page.kind === 'cover' || page.noChrome) return false;
  if (!pn.enabled) return true; // নম্বর বন্ধ থাকলেও হেডার সেটিংস প্রযোজ্য
  if (pn.differentFirst && index === 0) return false;
  return true;
}

export function showFooter(index: number, page: PageData, pn: PageNumberSettings): boolean {
  return showHeader(index, page, pn);
}

/** জোড় (even) পৃষ্ঠা কি না — বইয়ের বাঁ পাতা। প্যারিটি প্রদর্শিত ফোলিও
 * (startAt + index) অনুযায়ী — startAt জোড় হলে (অন্য খণ্ড থেকে চলমান বই)
 * প্রতিটি পাতার অজর/জোড় অবস্থান উল্টে যায় (আগে কাঁচা index ব্যবহার হতো)। */
export function isEvenPage(index: number, startAt = 1): boolean {
  return (startAt + index) % 2 === 0;
}

/** gutter মার্জিন কোন পাশে যোগ হবে */
export function gutterSide(index: number, oddEven: boolean, startAt = 1): 'left' | 'right' {
  if (oddEven && isEvenPage(index, startAt)) return 'right';
  return 'left';
}
