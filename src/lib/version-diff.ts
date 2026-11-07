/**
 * দিন ৬৫ — ভার্সন-তুলনা (diff-view) ইঞ্জিন — শূন্য-নির্ভরতা (কোনো নতুন প্যাকেজ নেই)।
 *
 * স্ন্যাপশট ↔ বর্তমান বই তুলনা:
 *  - পাতা-সারিবদ্ধ অ্যালাইনমেন্ট (id-ভিত্তিক, ক্রম বদলালেও সামলানো) →
 *    identical / changed / added / removed স্টেটাস।
 *  - changed পাতায় শব্দ-লেভেল LCS diff (বাংলা ইউনিকোড-নিরাপদ — টোকেন ভাগ
 *    হয় whitespace-এ, ক্লাস্টার ভাঙে না)।
 *  - settings-লেভেল পার্থক্য আলাদা চিপে।
 *
 * সব ফাংশন pure — কোনো স্টোর নির্ভরতা নেই; DOMParser শুধু ব্রাউজারে।
 */

import type { PageData, DocumentSettings } from './types';

export type DiffOpType = 'same' | 'del' | 'ins';

export interface DiffOp {
  type: DiffOpType;
  text: string;
}

export type PageDiffStatus = 'identical' | 'changed' | 'added' | 'removed';

export interface PageDiffRow {
  status: PageDiffStatus;
  /** বর্তমান বইয়ে পাতার অবস্থান (1-ভিত্তিক; স্ন্যাপশট-ওনলি হলে null) */
  curIndex: number | null;
  /** স্ন্যাপশটে পাতার অবস্থান (1-ভিত্তিক; বর্তমান-ওনলি হলে null) */
  snapIndex: number | null;
  curPage?: PageData;
  snapPage?: PageData;
  /** status === 'changed' হলে শব্দ-লেভেল diff অপ (স্ন্যাপশট → বর্তমান) */
  ops?: DiffOp[];
}

export interface VersionCompare {
  rows: PageDiffRow[];
  counts: { identical: number; changed: number; added: number; removed: number };
  /** যেসব settings-ফিল্ডে পার্থক্য (কী-নাম) */
  settingsKeys: string[];
}

// ─── HTML → প্লেইন টেক্সট (ব্লক-লাইন সংরক্ষণ) ───

const BLOCK_SEL = 'p,h1,h2,h3,h4,h5,h6,li,blockquote,pre,td,th,figcaption,dt,dd,div';

export function htmlToText(html: string): string {
  const fallback = (html || '').replace(/<[^>]*>/g, ' ');
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return fallback;
  try {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const blocks = Array.from(doc.body.querySelectorAll(BLOCK_SEL));
    if (blocks.length === 0) return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim();
    const lines: string[] = [];
    for (const el of blocks) {
      // নেস্টেড কন্টেইনার (li-এর ভিতরে p ইত্যাদি) বাদ — ভিতরের লিফ-ব্লকই যথেষ্ট
      if (el.querySelector(BLOCK_SEL)) continue;
      const t = (el.textContent ?? '').replace(/\s+/g, ' ').trim();
      if (t) lines.push(t);
    }
    return lines.join('\n');
  } catch {
    return fallback;
  }
}

/** পাতার তুলনা-যোগ্য ফিঙ্গারপ্রিন্ট — টেক্সট + কাঠামো-নাড়ি (kind/cover/chrome) */
function pageFingerprint(p: PageData): string {
  const text = htmlToText(p.html).replace(/\s+/g, ' ').trim();
  const cover = p.coverData ? JSON.stringify(p.coverData) : '';
  return `${p.kind}|${p.noChrome ? 'nc' : 'c'}|${cover}|${text}`;
}

// ─── শব্দ-লেভেল LCS diff ───

/** LCS টেবিল ক্যাপ — পাতার টেক্সট সাধারণত ≪; ব্যতিক্রমে প্রথম অংশ তুলনা হয় */
const MAX_TOKENS = 900;

function tokenize(text: string): string[] {
  // শব্দ + পেছনের whitespace একসাথে — রেন্ডারে স্পেসিং অক্ষত থাকে
  return text.match(/\S+\s*|\s+/g) ?? [];
}

/**
 * শব্দ-লেভেল diff: a (পুরনো/স্ন্যাপশট) → b (নতুন/বর্তমান)।
 * del = স্ন্যাপশটে ছিল এখন নেই, ins = নতুন যোগ হয়েছে।
 */
export function wordDiff(aText: string, bText: string): DiffOp[] {
  const a = tokenize(aText).slice(0, MAX_TOKENS);
  const b = tokenize(bText).slice(0, MAX_TOKENS);
  const n = a.length;
  const m = b.length;
  if (n === 0 && m === 0) return [];
  if (n === 0) return [{ type: 'ins', text: b.join('') }];
  if (m === 0) return [{ type: 'del', text: a.join('') }];

  // LCS DP (পিছন-সামনে) — 900×900 পর্যন্ত নিরাপদ (~৩ MB ট্রানজিয়েন্ট)
  const w = m + 1;
  const dp = new Uint32Array((n + 1) * w);
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i * w + j] =
        a[i] === b[j]
          ? dp[(i + 1) * w + (j + 1)] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)]);
    }
  }

  const ops: DiffOp[] = [];
  const push = (type: DiffOpType, text: string) => {
    if (!text) return;
    const last = ops[ops.length - 1];
    if (last && last.type === type) last.text += text;
    else ops.push({ type, text });
  };

  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) {
      push('del', a[i]);
      i++;
    } else {
      push('ins', b[j]);
      j++;
    }
  }
  while (i < n) push('del', a[i++]);
  while (j < m) push('ins', b[j++]);
  return ops;
}

// ─── settings-লেভেল তুলনা ───

const SETTINGS_KEYS: Array<keyof DocumentSettings> = [
  'paperSize',
  'customPaper',
  'orientation',
  'margins',
  'paperColor',
  'header',
  'footer',
  'pageNumber',
  'defaultFont',
  'defaultFontSize',
  'lineHeight',
  'paragraphSpacing',
  'autoFlow',
  'pageBorder',
  'pageBorderColor',
  'pageBorderStyle',
  'pageBorderWidth',
  'watermark',
  'singleColor',
];

// ─── মূল তুলনা ───

export function compareVersions(
  cur: PageData[],
  snap: PageData[],
  curSettings?: DocumentSettings,
  snapSettings?: DocumentSettings,
): VersionCompare {
  const rows: PageDiffRow[] = [];
  const counts = { identical: 0, changed: 0, added: 0, removed: 0 };
  const snapIds = new Set(snap.map((p) => p.id));
  const curIds = new Set(cur.map((p) => p.id));

  const rowFor = (c: PageData | undefined, s: PageData | undefined, ci: number | null, si: number | null): void => {
    if (c && s) {
      const same = pageFingerprint(c) === pageFingerprint(s);
      if (same) {
        rows.push({ status: 'identical', curIndex: ci, snapIndex: si, curPage: c, snapPage: s });
        counts.identical += 1;
      } else {
        rows.push({
          status: 'changed',
          curIndex: ci,
          snapIndex: si,
          curPage: c,
          snapPage: s,
          ops: wordDiff(htmlToText(s.html), htmlToText(c.html)),
        });
        counts.changed += 1;
      }
    } else if (c) {
      rows.push({ status: 'added', curIndex: ci, snapIndex: null, curPage: c });
      counts.added += 1;
    } else if (s) {
      rows.push({ status: 'removed', curIndex: null, snapIndex: si, snapPage: s });
      counts.removed += 1;
    }
  };

  let i = 0;
  let j = 0;
  while (i < cur.length || j < snap.length) {
    const c = cur[i];
    const s = snap[j];
    if (c && s && c.id === s.id) {
      rowFor(c, s, i + 1, j + 1);
      i++;
      j++;
    } else if (c && !snapIds.has(c.id)) {
      rowFor(c, undefined, i + 1, null);
      i++;
    } else if (s && !curIds.has(s.id)) {
      rowFor(undefined, s, null, j + 1);
      j++;
    } else {
      // উভয় পাতাই অন্য তালিকায় আছে শুধু ক্রম বদলেছে — জোড়া ধরে তুলনা
      if (c && s) {
        rowFor(c, s, i + 1, j + 1);
        i++;
        j++;
      } else if (c) {
        rowFor(c, undefined, i + 1, null);
        i++;
      } else if (s) {
        rowFor(undefined, s, null, j + 1);
        j++;
      } else {
        break; // unreachable-প্রতিরক্ষা
      }
    }
  }

  const settingsKeys: string[] = [];
  if (curSettings && snapSettings) {
    for (const key of SETTINGS_KEYS) {
      const a = (curSettings as unknown as Record<string, unknown>)[key as string];
      const b = (snapSettings as unknown as Record<string, unknown>)[key as string];
      if (JSON.stringify(a) !== JSON.stringify(b)) settingsKeys.push(key as string);
    }
  }

  return { rows, counts, settingsKeys };
}
