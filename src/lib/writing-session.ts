/**
 * লেখা-সেশন ও লেখার লক্ষ্য (Writing goal + session stats)
 *
 * মডিউল-সিঙ্গেলটন: অ্যাপের জীবনকালজুড়ে একটাই সেশন। প্রথম `recordWords` কলে
 * বেসলাইন শব্দসংখ্যা ধরা হয়, এরপর ১০ সেকেন্ড পরপর মোট শব্দ রেকর্ড হতে থাকে —
 * সেশনে নতুন লেখা শব্দ ও গড় গতি (শব্দ/মিনিট) এর থেকেই বের হয়।
 * লক্ষ্য (words/pages টার্গেট) localStorage-এ `bwp-writing-goal` কী-তে থাকে।
 *
 * শব্দসংখ্যা নিজে কম্পিউট করে না — শেয়ার্ড `useDocStats` (৪৫০ms ডিবাউন্স-ক্যাশ)
 * ব্যবহার করে, যেন টাইপিং বার্স্টে পুরো বই বারবার পার্স না হয়।
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import { useEditorStore } from './store';
import { useDocStats } from './doc-stats';

export interface WritingGoal {
  type: 'words' | 'pages';
  target: number;
}

/** localStorage কী */
const GOAL_KEY = 'bwp-writing-goal';
/** রেকর্ডিং ইন্টারভাল (ms) */
const TICK_MS = 10_000;

// ─── মডিউল-সিঙ্গেলটন সেশন স্টেট ───

/** সেশনের শুরু (মডিউল লোড = অ্যাপ খোলা) */
const sessionStart = Date.now();
/** প্রথম রেকর্ডের মোট শব্দ — এখান থেকেই সেশন-বৃদ্ধি হিসাব হয়; null = এখনো রেকর্ড হয়নি */
let sessionStartWords: number | null = null;
/** শেষ দেখা মোট শব্দ — এই টিকে টাইপিং ঘটেছে কি না বোঝার জন্য */
let lastSeenWords: number | null = null;
/** সেশনে নতুন লেখা শব্দ */
let sessionWords = 0;
/** সেশনের সর্বশেষ হিসাবকৃত গতি (শব্দ/মিনিট) — টাইপিং ঘটলেই হালনাগাদ হয় */
let sessionWpm = 0;

/**
 * ১০ সেকেন্ড পরপর interval থেকে ডাকা হয় — বইয়ের বর্তমান মোট শব্দ দিয়ে
 * সেশন-হিসাব হালনাগাদ করে। প্রথম কলে শুধু বেসলাইন ধরা হয়।
 */
export function recordWords(totalWords: number): void {
  if (!Number.isFinite(totalWords)) return;
  if (sessionStartWords === null) {
    // প্রথম রেকর্ড — বেসলাইন; এখান থেকে সেশনের হিসাব শুরু
    sessionStartWords = totalWords;
    lastSeenWords = totalWords;
    return;
  }
  // লেখা মুছলে ঋণাত্মক না দেখাতে ০-তে ক্ল্যাম্প
  sessionWords = Math.max(0, totalWords - sessionStartWords);
  // এই টিকে টাইপিং ঘটেছে (মোট শব্দ বদলেছে) → সেশন-গড় গতি হালনাগাদ
  if (lastSeenWords !== null && totalWords !== lastSeenWords && sessionWords > 0) {
    const minutes = (Date.now() - sessionStart) / 60000;
    sessionWpm = sessionWords / Math.max(minutes, 0.5);
  }
  lastSeenWords = totalWords;
}

/** সংরক্ষিত লক্ষ্য পড়া — পার্স-ব্যর্থ/অবৈধ হলে null (ছোট ক্যাশসহ) */
let goalCache: WritingGoal | null | undefined; // undefined = এখনো পড়া হয়নি

export function getGoal(): WritingGoal | null {
  if (goalCache !== undefined) return goalCache;
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(GOAL_KEY);
    if (!raw) {
      goalCache = null;
      return goalCache;
    }
    const parsed = JSON.parse(raw) as Partial<WritingGoal>;
    const valid =
      (parsed.type === 'words' || parsed.type === 'pages') &&
      typeof parsed.target === 'number' &&
      Number.isFinite(parsed.target) &&
      parsed.target > 0;
    goalCache = valid ? { type: parsed.type as 'words' | 'pages', target: parsed.target as number } : null;
    return goalCache;
  } catch {
    goalCache = null;
    return goalCache;
  }
}

/** লক্ষ্য সংরক্ষণ/মুছে ফেলা */
export function setGoal(goal: WritingGoal | null): void {
  goalCache = goal;
  try {
    if (typeof window === 'undefined') return;
    if (goal) window.localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
    else window.localStorage.removeItem(GOAL_KEY);
  } catch {
    // স্টোরেজ ব্যর্থ — ক্যাশে থাকা লক্ষ্যই এই সেশনে কাজ করবে
  }
}

export interface WritingSessionInfo {
  /** এই সেশনে নতুন লেখা শব্দ */
  sessionWords: number;
  /** সেশনের সর্বশেষ হিসাবকৃত গতি (শব্দ/মিনিট) */
  wpm: number;
  /** সেশনের দৈর্ঘ্য (মিনিট, ভগ্নাংশসহ) */
  sessionMinutes: number;
  /** সংরক্ষিত লক্ষ্য (না থাকলে null) */
  goal: WritingGoal | null;
  /** লক্ষ্য পূর্ণতার শতকরা (০–১০০, ক্ল্যাম্পড) */
  progressPct: number;
}

/**
 * লেখা-সেশন হুক — ১০ সেকেন্ড পরপর `recordWords` চালিয়ে নিজেকে রি-রেন্ডার করায়,
 * তাই পপওভার/পিল খোলা থাকলে হিসাবও জীবন্ত থাকে। শব্দসংখ্যা শেয়ার্ড
 * `useDocStats` থেকে, পৃষ্ঠাসংখ্যা এডিটর-স্টোর থেকে।
 */
export function useWritingSession(): WritingSessionInfo {
  const pagesCount = useEditorStore((s) => s.pages.length);
  const { words } = useDocStats();
  const [, setTick] = useState(0);

  // interval কলব্যাক বাসি (stale) শব্দসংখ্যা না পড়ে যেন — সর্বশেষ মান রেফে রাখা
  const wordsRef = useRef(words);
  useEffect(() => {
    wordsRef.current = words;
  }, [words]);

  // সেশন-টিক — রেকর্ড + জোর করে রি-রেন্ডার (মিনিট/গতি জীবন্ত রাখতে)
  useEffect(() => {
    const id = setInterval(() => {
      recordWords(wordsRef.current);
      setTick((t) => (t + 1) % Number.MAX_SAFE_INTEGER);
    }, TICK_MS);
    return () => clearInterval(id);
  }, []);

  const goal = getGoal();
  const sessionMinutes = (Date.now() - sessionStart) / 60000;
  const progressPct = goal
    ? Math.max(0, Math.min(100, ((goal.type === 'words' ? words : pagesCount) / goal.target) * 100))
    : 0;

  return { sessionWords, wpm: sessionWpm, sessionMinutes, goal, progressPct };
}
