/**
 * শেয়ার্ড ডকুমেন্ট-স্ট্যাটস হুক (Review ট্যাব + স্টেটাস বারের জন্য)
 *
 * আগে useDocStats দুই জায়গায় আলাদা ইনস্ট্যান্সে চলত — প্রতিটি কীস্ট্রোকে
 * পুরো বইয়ের HTML দুইবার পার্স হতো। এখন একটি মডিউল-লেভেল ক্যাশ (pages অ্যারের
 * রেফারেন্স দিয়ে কী-ড) শেয়ার করে: একই pages রেফারেন্সে একবারই হিসাব হয়,
 * সব কনজিউমার একই রেজাল্ট-অবজেক্ট পায়। ভারী পার্স ট্রেইলিং-ডিবাউন্সে (৪৫০ms)
 * পিছিয়ে দেওয়া হয় — টাইপিং বার্স্টে শেষ অবস্থাটাই একবার গোনা হয়।
 */

'use client';

import { useEffect, useState } from 'react';
import { useEditorStore } from './store';
import { countCharacters, countWords } from './bangla';
import type { PageData } from './types';

export interface DocStats {
  words: number;
  chars: number;
  pages: number;
}

/** ডিবাউন্স উইন্ডো (ms) — টাইপিং থামার পর হিসাব */
const DEBOUNCE_MS = 450;

// ─── মডিউল-লেভেল শেয়ার্ড ক্যাশ (সব কনজিউমারের মধ্যে একটাই) ───

/** শেষ যে pages অ্যারের জন্য হিসাব হয়েছে তার রেফারেন্স */
let lastPagesRef: PageData[] | null = null;
/** lastPagesRef-এর জন্য গোনা ফল — একই অবজেক্ট সবাইকে দেওয়া হয় */
let lastResult: DocStats = { words: 0, chars: 0, pages: 0 };
/** শেয়ার্ড ট্রেইলিং-ডিবাউন্স টাইমার */
let sharedTimer: ReturnType<typeof setTimeout> | null = null;
/** ফল প্রকাশের সময় যাদের জানানো হবে */
const listeners = new Set<(s: DocStats) => void>();

/**
 * ওয়ার্ড/ক্যারেক্টার গণনা — আগের review-tab হুকের হুবহু একই লজিক
 * (regex-দিয়ে ট্যাগ/এনটিটি স্ট্রিপ, তারপর bangla হেল্পারে গ্রাফিম-সচেতন গণনা)।
 * ফল আগের মতোই থাকে এটা নিশ্চিত করতে এখানে কিছু বদলানো যাবে না।
 */
function computeStats(pages: PageData[]): DocStats {
  let words = 0;
  let chars = 0;
  for (const page of pages) {
    if (page.kind !== 'normal' || !page.html) continue;
    const text = page.html.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
    words += countWords(text);
    chars += countCharacters(text.replace(/\s+/g, ' ').trim(), false);
  }
  return { words, chars, pages: pages.length };
}

/**
 * পুরো বইয়ের { শব্দ, অক্ষর, পৃষ্ঠা } — একাধিক কনজিউমার (Review ট্যাব, স্টেটাস বার)
 * একই ডিবাউন্স-উইন্ডোতে একবারের হিসাব ভাগ করে নেয়।
 */
export function useDocStats(): DocStats {
  const pages = useEditorStore((s) => s.pages);
  // শেষ প্রকাশিত ফল — pages বদলালেও পরের হিসাব পর্যন্ত পুরনো সংখ্যাই দেখায়
  // (০-তে ফ্ল্যাশ নয়); নতুন কনজিউমার মাউন্টে ক্যাশ চলতি থাকলে সঙ্গে সঙ্গে সঠিক মান
  const [published, setPublished] = useState<DocStats | null>(null);

  // সাবস্ক্রাইবার রেজিস্ট্রেশন — কম্পোনেন্টের সারা জীবনে একবার।
  // টাইমার শেয়ার্ড তাই কোনো কনজিউমার আনমাউন্ট হলেও বাকিরা আপডেট পেতে থাকে।
  useEffect(() => {
    const listener = (s: DocStats) => setPublished(s);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    // এই pages রেফারেন্সের হিসাব আগেই হয়ে গেলে নতুন করে পার্স নয় — রেন্ডারে
    // ক্যাশ থেকে ফল পড়া হয়; এখানে শুধু নতুন রেফারেন্সের জন্য টাইমার বসে
    if (pages === lastPagesRef) return;
    // ট্রেইলিং ডিবাউন্স — বার্স্টের শেষ অবস্থার জন্য একবারই টাইমার থাকে
    if (sharedTimer) clearTimeout(sharedTimer);
    sharedTimer = setTimeout(() => {
      sharedTimer = null;
      lastPagesRef = pages;
      lastResult = computeStats(pages);
      for (const listener of listeners) listener(lastResult);
    }, DEBOUNCE_MS);
  }, [pages]);

  // ক্যাশ চলতি (এই pages-এর হিসাব আগেই হয়েছে) → সবাই একই অবজেক্ট পায় —
  // একই রেফারেন্স ফেরত দিলে React-ও অপ্রয়োজনীয় রি-রেন্ডার বাদ দেয়
  if (pages === lastPagesRef) return lastResult;
  return published ?? { words: 0, chars: 0, pages: pages.length };
}
