/**
 * i18n এন্ট্রি পয়েন্ট — সব অভিধান একত্রিত করে t()/useT()/fmtNum() দেয়।
 *
 * ব্যবহার:
 *   import { t, useT, fmtNum, useFmtNum } from '@/lib/i18n';
 *   const tt = useT();          // কম্পোনেন্টে (ভাষা বদলালে রি-রেন্ডার হয়)
 *   tt('hdr.menu.new', 'New Book')
 *   t('rb.toast.cover')         // কম্পোনেন্টের বাইরে (টোস্ট ইত্যাদি)
 *   tFmt('st.page.nochrome', { n: '৩' })
 */

'use client';

import { Fragment, createElement, useCallback } from 'react';
import { useLangStore, getLang, localizeNumber, formatDateLong } from './core';
import type { Dict, Lang } from './core';
import { dictHeader } from './dict-header';
import { dictHome } from './dict-home';
import { dictInsert } from './dict-insert';
import { dictLayout } from './dict-layout';
import { dictDesign } from './dict-design';
import { dictReview } from './dict-review';
import { dictExport } from './dict-export';
import { dictDialogsA } from './dict-dialogs-a';
import { dictDialogsB } from './dict-dialogs-b';
import { dictWorkspace } from './dict-workspace';
import { dictKruti } from './dict-kruti';

export const ALL_DICTS: Dict = Object.assign(
  {},
  dictHeader,
  dictHome,
  dictInsert,
  dictLayout,
  dictDesign,
  dictReview,
  dictExport,
  dictDialogsA,
  dictDialogsB,
  dictWorkspace,
  dictKruti,
);

function lookup(key: string, lang: Lang, fallback?: string): string {
  const e = ALL_DICTS[key];
  if (!e) return fallback ?? key;
  return e[lang] || e.en || fallback || key;
}

/** কম্পোনেন্টের ভেতরে — ভাষা বদলালে রি-রেন্ডার সহ t() */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return useCallback(
    (key: string, fallback?: string) => lookup(key, lang, fallback),
    [lang],
  );
}

/** কম্পোনেন্টের বাইরে (টোস্ট/সার্ভিস) — চলতি ভাষার t() */
export function t(key: string, fallback?: string): string {
  return lookup(key, getLang(), fallback);
}

/** {name} প্লেসহোল্ডারসহ t() — tFmt('st.page.nochrome', { n: '৩' }) */
export function tFmt(key: string, vars: Record<string, string | number>, fallback?: string): string {
  let s = lookup(key, getLang(), fallback);
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}

/**
 * অনুবাদ-স্ট্রিং-এর {name} প্লেসহোল্ডারে ReactNode বসায় (bold/রঙিন অংশের জন্য)।
 * উদাহরণ: tplNodes(tt('st.goal.ofWords'), { a: <b>…</b>, b: 500 })
 * প্রতিটি অংশ key-যুক্ত Fragment — React-এর array-children key-ওয়ার্নিং এড়াতে।
 */
export function tplNodes(s: string, vars: Record<string, React.ReactNode>): React.ReactNode[] {
  const parts = s.split(/\{(\w+)\}/);
  return parts.map((p, i) =>
    createElement(Fragment, { key: i }, i % 2 === 1 ? (vars[p] ?? p) : p),
  );
}

/** চলতি ভাষা অনুযায়ী সংখ্যা (কম্পোনেন্টের বাইরে) */
export function fmtNum(n: number | string): string {
  return localizeNumber(n, getLang());
}

/** চলতি ভাষা অনুযায়ী সংখ্যা (কম্পোনেন্টে — ভাষা বদলালে রি-রেন্ডার) */
export function useFmtNum() {
  const lang = useLangStore((s) => s.lang);
  return useCallback((n: number | string) => localizeNumber(n, lang), [lang]);
}

/** চলতি ভাষা অনুযায়ী দীর্ঘ তারিখ */
export function useFmtDate() {
  const lang = useLangStore((s) => s.lang);
  return useCallback((d: Date) => formatDateLong(d, lang), [lang]);
}

// কোর থেকে রি-এক্সপোর্ট — এক জায়গা থেকেই সব আমদানি
export { useLangStore, getLang, LANGUAGES } from './core';
export type { Lang } from './core';
