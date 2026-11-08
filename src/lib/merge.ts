/**
 * দিন ৭১–৭২ — সংঘর্ষ-নিরাপদ মার্জ (conflict-safe 3-way merge) — শূন্য-নির্ভরতা।
 *
 * সহযোগিতা-হার্ডেনিং ধাপ-১: একই ডকুমেন্টের দুই অবস্থা (আমার লোকাল সম্পাদনা vs
 * ক্লাউড/প্রতিপক্ষ সংস্করণ) একটি তৃতীয় ভিত্তি-অবস্থার (শেষ স্ন্যাপশট — বা null)
 * উপর ৩-পথে মেশানো। ফলে "পুল = লোকাল সম্পাদনা নীরবে মুছে যাওয়া" ঘটনা আর নেই।
 *
 * নীতি:
 *  - পাতা id-ভিত্তিক (প্রতি-পাতা আইসোলেশন রুল): যে-পাতা কেবল এক পাশে বদলেছে সেটি
 *    সে-পাশ থেকে; দুই পাশেই আলাদাভাবে বদলে থাকলে আমার সংস্করণ বসে + প্রতিপক্ষ
 *    সংস্করণ সংযুক্তি-পাতা হিসেবে শেষে যোগ (id-প্রত্যয় '-m2') — কিছুই নীরবে হারায় না।
 *  - এক-পাশে বদল + অন্য-পাশে মুছা → সংঘর্ষ: বদল-যাওয়া পাতাই থাকে (মুছে-ফেলার
 *    সিদ্ধান্ত ব্যবহারকারীর — নীরব মুছে-ফেলা নয়)।
 *  - settings: ফিল্ড-ধারে ৩-পথ (JSON তুলনা); দুই-পাশ আলাদা বদলে আমারটি জেতে
 *    (last-writer-wins, গণনা settingsConflicts-এ রিপোর্ট হয়)।
 */

import type { DocumentSettings, PageData } from './types';

export interface MergeInput {
  pages: PageData[];
  settings: DocumentSettings;
}

export interface PageConflict {
  pageId: string;
  /** কী ধরনের সংঘর্ষ — 'both-changed' | 'edit-vs-delete' */
  kind: 'both-changed' | 'edit-vs-delete';
}

export interface MergeOutcome {
  pages: PageData[];
  settings: DocumentSettings;
  /** সংঘর্ষ-পাতার তালিকা (মূল id ধরে) */
  conflicts: PageConflict[];
  /** settings-ফিল্ডে দ্বিপাক্ষিক বদল (আমারটি জেতে) এমন কী-সংখ্যা */
  settingsConflicts: number;
  /** প্রতিপক্ষ থেকে আসা নতুন পাতার সংখ্যা */
  addedFromTheirs: number;
  /** প্রতিপক্ষে মুছে-ফেলা পাতার সংখ্যা (আমার সংস্করণেও মুছে গেছে) */
  droppedFromTheirs: number;
}

const SETTINGS_KEYS: Array<keyof DocumentSettings> = [
  'paperSize', 'customPaper', 'orientation', 'margins', 'paperColor',
  'header', 'footer', 'pageNumber', 'defaultFont', 'defaultFontSize',
  'lineHeight', 'paragraphSpacing', 'autoFlow', 'pageBorder',
  'pageBorderColor', 'pageBorderStyle', 'pageBorderWidth', 'watermark', 'singleColor',
];

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function mergeProjects(
  base: MergeInput | null,
  mine: MergeInput,
  theirs: MergeInput,
): MergeOutcome {
  const bPages = new Map(base?.pages.map((p) => [p.id, p]) ?? []);
  const mPages = new Map(mine.pages.map((p) => [p.id, p]));
  const tPages = new Map(theirs.pages.map((p) => [p.id, p]));

  const allIds = new Set<string>([
    ...bPages.keys(),
    ...mine.pages.map((p) => p.id),
    ...theirs.pages.map((p) => p.id),
  ]);

  const conflicts: PageConflict[] = [];
  const appended: PageData[] = []; // theirs-additions + both-changed duplicates, শেষে যোগ হয়
  let addedFromTheirs = 0;
  let droppedFromTheirs = 0;

  const merged: PageData[] = [];

  // আমার ক্রম ধরে চলি — যে-পাতা আমার তালিকায় আছে সেগুলোই এখানে বসে
  for (const id of allIds) {
    if (!mPages.has(id)) continue;
    const m = mPages.get(id)!;
    const t = tPages.get(id);
    const b = bPages.get(id);

    if (!t) {
      if (!b) {
        // আমার নতুন পাতা — রাখা
        merged.push(m);
      } else if (!same(b.html, m.html) || b.kind !== m.kind) {
        // প্রতিপক্ষ মুছেছে, আমি বদলেছি → সংঘর্ষ: আমার সংস্করণ থাকে
        conflicts.push({ pageId: id, kind: 'edit-vs-delete' });
        merged.push(m);
      } else {
        // আমি ছুঁইনি, প্রতিপক্ষ মুছেছে → মুছে যায় (আসল ৩-পথ সিদ্ধান্ত)
        // গণনায় রাখা হয় — ব্যবহারকারী জানবেন একটি পাতা মুছে গেছে
        droppedFromTheirs += 1;
      }
      continue;
    }

    // m ও t দুটোই আছে
    if (!b) {
      // ভিত্তিতে নেই — দুই পাশেই স্বতন্ত্রভাবে যোগ? আমারটি বসে, প্রতিপক্ষেরটি যোগ হয় না
      // (একই id দুই পাশে আলাদাভাবে তৈরি হওয়া বিরল — আমার সংস্করণ অগ্রাধ্যাক্ষ্য)
      if (same(m.html, t.html)) merged.push(m);
      else {
        merged.push(m);
        conflicts.push({ pageId: id, kind: 'both-changed' });
        appended.push({ ...t, id: `${t.id}-m2` });
        addedFromTheirs += 1;
      }
      continue;
    }

    const mineChanged = !same(b.html, m.html) || b.kind !== m.kind;
    const theirsChanged = !same(b.html, t.html) || b.kind !== t.kind;

    if (!mineChanged) merged.push(t);          // আমি ছুঁইনি → প্রতিপক্ষেরটি
    else if (!theirsChanged) merged.push(m);   // প্রতিপক্ষ ছুঁইনি → আমারটি
    else if (same(m.html, t.html)) merged.push(m); // দুজনে একই লিখেছি
    else {
      // দুই পাশেই আলাদাভাবে বদল → আমারটি বসে + প্রতিপক্ষ সংস্করণ যোগ হয়
      conflicts.push({ pageId: id, kind: 'both-changed' });
      merged.push(m);
      appended.push({ ...t, id: `${t.id}-m2` });
      addedFromTheirs += 1;
    }
  }

  // প্রতিপক্ষের নতুন পাতা (আমার তালিকায় নেই) — theirs-ক্রমে শেষে
  for (const t of theirs.pages) {
    if (!mPages.has(t.id) && !merged.some((p) => p.id === t.id) && !appended.some((p) => p.id === t.id)) {
      if (bPages.has(t.id) && !tPages.has(t.id)) continue; // unreachable-প্রতিরক্ষা
      appended.push(t);
      addedFromTheirs += 1;
    }
  }

  // ─── settings ৩-পথ ───
  const mergedSettings: DocumentSettings = { ...mine.settings };
  let settingsConflicts = 0;
  if (base && theirs.settings) {
    for (const key of SETTINGS_KEYS) {
      const b = (base.settings as unknown as Record<string, unknown>)[key as string];
      const m = (mine.settings as unknown as Record<string, unknown>)[key as string];
      const t = (theirs.settings as unknown as Record<string, unknown>)[key as string];
      if (t === undefined) continue;
      const mineChangedS = !same(b, m);
      const theirsChangedS = !same(b, t);
      if (!mineChangedS && theirsChangedS) {
        (mergedSettings as unknown as Record<string, unknown>)[key as string] = t;
      } else if (mineChangedS && theirsChangedS && !same(m, t)) {
        settingsConflicts += 1; // আমারটি জেতে (last-writer-wins) — গণনায় রিপোর্ট
      }
    }
  }

  return {
    pages: [...merged, ...appended],
    settings: mergedSettings,
    conflicts,
    settingsConflicts,
    addedFromTheirs,
    droppedFromTheirs,
  };
}
