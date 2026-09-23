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

/** জোড় (even) পৃষ্ঠা কি না — বইয়ের বাঁ পাতা */
export function isEvenPage(index: number): boolean {
  return index % 2 === 1; // index 0 = ১ম পৃষ্ঠা (অজর)
}

/** gutter মার্জিন কোন পাশে যোগ হবে */
export function gutterSide(index: number, oddEven: boolean): 'left' | 'right' {
  if (oddEven && isEvenPage(index)) return 'right';
  return 'left';
}
