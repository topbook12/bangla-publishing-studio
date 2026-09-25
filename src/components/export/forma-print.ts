/**
 * ফরমা (Imposition) প্রিন্ট ফ্লো —
 *  ১) লাইভ পেজ DOM ক্লোন করে প্রেস-শীটে ভাঁজ-সঠিক ক্রমে বসানো
 *  ২) @page সাময়িকভাবে শীট-সাইজে সেট করা
 *  ৩) window.print() → afterprint-এ পরিচ্ছন্ন
 *
 * নির্ভরযোগ্যতা (গুরুত্বপূর্ণ):
 *  - <html>-এ `bwp-forma-printing` ক্লাস যোগ হয় — প্রিন্ট CSS শুধু এই
 *    মোডে অ্যাপ লুকিয়ে শীট দেখায় (globals.css-এর সাথে সংঘর্ষ-মুক্ত)।
 *  - `#bwp-print-page` স্টাইল এলিমেন্ট না থাকলে নিজেই তৈরি করে —
 *    সেশনে প্রথমবারই ফরমা প্রিন্ট করলেও @page ঠিক থাকবে।
 *  - ডায়ালগ সম্পূর্ণ বন্ধ + ফন্ট/ছবি লোড + লেআউট স্থির হওয়ার পরেই
 *    window.print() — নইলে ডায়ালগ/অর্ধেক-রেন্ডার প্রিন্টে ঢুকে যায়।
 *  - লাইভ পেজ DOM না পাওয়া গেলে ফাঁকা শীট ছাপার বদলে এরর দেখায়।
 *
 * গণিত: src/lib/imposition.ts (স্বাধীন ভ্যালিডেশনে প্রমাণিত)
 */

import { toast } from 'sonner';
import { useEditorStore } from '@/lib/store';
import { getPageDimensionsMm } from '@/lib/paper';
import {
  computeImposition,
  formaDuplexFor,
  formaSheetSizeMm,
  formaFoldOffsetsMm,
  type FormaSize,
} from '@/lib/imposition';
import { ensurePrintStyle, getOrCreatePrintStyleEl } from '@/lib/export-json';

export interface FormaPrintOptions {
  formaSize: FormaSize;
  /** interleaved: A,B,A,B… | fronts-first: সব সামনের পাশ, তারপর সব পেছনের */
  sideOrder: 'interleaved' | 'fronts-first';
  foldMarks: boolean;
}

const ROOT_ID = 'forma-print-root';
const MODE_CLASS = 'bwp-forma-printing';
let pageStyleBackup: string | null = null;

/* ─── ছোট হেল্পার ─── */

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
const raf2 = () =>
  new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));

/**
 * সব open Radix ডায়ালগ (exit-animation সহ) DOM থেকে সরে যাওয়া পর্যন্ত অপেক্ষা।
 * প্রিন্ট চলাকালীন ডায়ালগ দেখালে সেটি fixed-position হওয়ায় প্রতিটি প্রিন্টেড
 * পেজে রিপিট হয় — তাই প্রিন্টের আগে এটি বাধ্যতামূলক।
 */
export async function waitForDialogsClosed(timeoutMs = 1500): Promise<void> {
  const start = Date.now();
  while (document.querySelector('[role="dialog"], [role="alertdialog"]')) {
    if (Date.now() - start > timeoutMs) break;
    await sleep(40);
  }
  await raf2();
}

/** ক্লোন-রুটের ছবিগুলো লোড হওয়া পর্যন্ত অপেক্ষা (সর্বোচ্চ cap) */
async function waitForImages(root: HTMLElement, capMs = 800): Promise<void> {
  const start = Date.now();
  for (;;) {
    const imgs = Array.from(root.querySelectorAll('img'));
    const pending = imgs.filter((im) => !im.complete);
    if (pending.length === 0 || Date.now() - start > capMs) return;
    await sleep(50);
  }
}

/** একটি ক্লোন করা পেজ নোড থেকে id/সিলেকশন অবশেষ সরানো */
function sanitizeClone(clone: HTMLElement): void {
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
  clone.querySelectorAll('[contenteditable]').forEach((el) => el.removeAttribute('contenteditable'));
  clone
    .querySelectorAll('.no-print, .page-toolbar, .mcq-edit, .callout-delete, .footnote-pop, .bwp-img-handle, .bwp-table-toolbar')
    .forEach((el) => el.remove());
  clone.classList.remove('paper-active');
}

/** প্রিন্ট-রুট DOM তৈরি (টেস্ট/ডিবাগের জন্যও এক্সপোর্টেড) */
export function buildFormaRoot(opts: FormaPrintOptions): HTMLElement {
  const { settings, pages } = useEditorStore.getState();
  const { widthMm, heightMm } = getPageDimensionsMm(
    settings.paperSize,
    settings.orientation,
    settings.customPaper,
  );
  const sheet = formaSheetSizeMm(widthMm, heightMm, opts.formaSize);
  // শীট অভিমুখ অনুযায়ী ডুপ্লেক্স-অক্ষ — প্রিন্টারের ডিফল্ট long-edge flip-এ পেছনের পাশ মেলে
  const duplex = formaDuplexFor(widthMm, heightMm, opts.formaSize);
  const imposition = computeImposition(pages.length, opts.formaSize, duplex);

  const pageEls = Array.from(
    document.querySelectorAll<HTMLElement>('.workspace .page-slot .paper-page'),
  );

  const root = document.createElement('div');
  root.id = ROOT_ID;

  // প্রিন্ট ক্রম — সাইড বিন্যাস অনুযায়ী
  const sides: Array<{ panels: typeof imposition.sheets[0]['front']; label: string }> = [];
  imposition.sheets.forEach((sh, i) => {
    sides.push({ panels: sh.front, label: `শীট ${i + 1} — পাশ A` });
    sides.push({ panels: sh.back, label: `শীট ${i + 1} — পাশ B` });
  });
  const ordered =
    opts.sideOrder === 'interleaved'
      ? sides
      : [...sides.filter((_, i) => i % 2 === 0), ...sides.filter((_, i) => i % 2 === 1)];

  ordered.forEach(({ panels }) => {
    const sheetEl = document.createElement('div');
    sheetEl.className = 'forma-sheet';
    sheetEl.style.width = `${sheet.widthMm}mm`;
    sheetEl.style.height = `${sheet.heightMm}mm`;

    // ভাঁজ মার্ক — প্রান্তে ছোট টিক (z: 2), পেজ সেলের নিচে ড্যাশড গাইড (z: 0)
    if (opts.foldMarks) {
      const folds = formaFoldOffsetsMm(widthMm, heightMm, opts.formaSize);
      folds.verticalXmm.forEach((x) => {
        for (const edge of ['top', 'bottom'] as const) {
          const tick = document.createElement('div');
          tick.className = 'forma-tick';
          tick.style.left = `${x}mm`;
          tick.style[edge] = '0';
          sheetEl.appendChild(tick);
        }
        const guide = document.createElement('div');
        guide.className = 'forma-guide-v';
        guide.style.left = `${x}mm`;
        sheetEl.appendChild(guide);
      });
      folds.horizontalYmm.forEach((y) => {
        for (const edge of ['left', 'right'] as const) {
          const tick = document.createElement('div');
          tick.className = 'forma-tick-h';
          tick.style.top = `${y}mm`;
          tick.style[edge] = '0';
          sheetEl.appendChild(tick);
        }
        const guide = document.createElement('div');
        guide.className = 'forma-guide-h';
        guide.style.top = `${y}mm`;
        sheetEl.appendChild(guide);
      });
    }

    panels.forEach((panel) => {
      const cellEl = document.createElement('div');
      cellEl.className = 'forma-cell';
      cellEl.style.left = `${panel.col * widthMm}mm`;
      cellEl.style.top = `${panel.row * heightMm}mm`;
      cellEl.style.width = `${widthMm}mm`;
      cellEl.style.height = `${heightMm}mm`;

      if (panel.pageNumber > 0) {
        const src = pageEls[panel.pageNumber - 1];
        if (src) {
          const inner = document.createElement('div');
          inner.className = 'forma-page-holder';
          if (panel.rotate180) inner.classList.add('forma-rot180');
          const clone = src.cloneNode(true) as HTMLElement;
          sanitizeClone(clone);
          inner.appendChild(clone);
          cellEl.appendChild(inner);
        }
      }
      sheetEl.appendChild(cellEl);
    });

    root.appendChild(sheetEl);
  });

  return root;
}

/** ফরমা প্রিন্ট সম্পূর্ণ পরিচ্ছন্ন — রুট, মোড-ক্লাস, @page রিস্টোর */
function cleanupForma(styleEl: HTMLStyleElement): void {
  document.getElementById(ROOT_ID)?.remove();
  document.documentElement.classList.remove(MODE_CLASS);
  if (pageStyleBackup !== null) {
    styleEl.textContent = pageStyleBackup;
    pageStyleBackup = null;
  } else {
    // আমরাই স্টাইল-এলিমেন্ট তৈরি করেছিলাম — স্বাভাবিক কাগজের সাইজে ফেরত
    ensurePrintStyle(useEditorStore.getState().settings);
  }
}

// ───────────── ফরমা সেলফ-চেক (গুরুত্বপূর্ণ: ছাপার আগে যাচাই) ─────────────

export interface FormaSelfCheckResult {
  ok: boolean;
  formaSize: FormaSize;
  totalPages: number;
  sheetCount: number;
  /** প্রতিটি শীটের A/B পাশে সঠিক সংখ্যক ঘর আছে কি না */
  gridOk: boolean;
  /** কোনো পৃষ্ঠা একাধিক ঘরে বা বাদ পড়েনি কি না (১..totalPages ঠিক ১ বার) */
  pageMappingOk: boolean;
  /** ভাঁজ-সঠিক স্ট্যান্ডার্ড ক্রমের সাথে প্রথম ফরমার আউটার ফরমা মেলে কি না */
  outerFormaOk: boolean;
  sheetMm: { widthMm: number; heightMm: number };
  duplex: 'vertical' | 'horizontal';
  problems: string[];
}

/**
 * ফরমা ইঞ্জিনের পূর্ণ স্বাস্থ্য পরীক্ষা — window.__bwpFormaSelfCheck(formaSize)
 * দিয়ে ব্রাউজার কনসোল থেকেও চালানো যায়। ছাপার আগে নিশ্চিত হওয়ার জন্য:
 *  ১) প্রতি পাশে সঠিক সংখ্যক ঘর
 *  ২) পৃষ্ঠা ১..N ঠিক একবার করে আসে (কোনোটা ডুপ্লিকেট/বাদ নেই)
 *  ৩) প্রথম শীটের আউটার ফরমা প্রকাশিত স্ট্যান্ডার্ডের সাথে মেলে
 */
export function formaSelfCheck(formaSize: FormaSize = 16): FormaSelfCheckResult {
  const { pages } = useEditorStore.getState();
  const totalPages = Math.max(1, pages.length);
  const { widthMm, heightMm } = getPageDimensionsMm(
    useEditorStore.getState().settings.paperSize,
    useEditorStore.getState().settings.orientation,
    useEditorStore.getState().settings.customPaper,
  );
  const duplex = formaDuplexFor(widthMm, heightMm, formaSize);
  const imposition = computeImposition(totalPages, formaSize, duplex);
  const problems: string[] = [];

  const { cols, rows } = imposition.grid;
  const perSide = cols * rows;
  const gridOk = imposition.sheets.every(
    (sh) => sh.front.length === perSide && sh.back.length === perSide,
  );
  if (!gridOk) problems.push('ঘরের সংখ্যা ভুল');

  const seen = new Map<number, number>();
  imposition.sheets.forEach((sh) => {
    [...sh.front, ...sh.back].forEach((p) => {
      if (p.pageNumber > 0) seen.set(p.pageNumber, (seen.get(p.pageNumber) ?? 0) + 1);
    });
  });
  let pageMappingOk = true;
  for (let i = 1; i <= totalPages; i++) {
    if (seen.get(i) !== 1) {
      pageMappingOk = false;
      problems.push(`পৃষ্ঠা ${i} ${seen.get(i) ?? 0} বার এসেছে (হবে ১)`);
    }
  }
  // স্ট্যান্ডার্ড ফরমা সেট — প্রথম শীটে:
  //  বাইরের ফরমা (কভারের পাশ): {1,4,5,8,…} — ভাঁজের পর যে পাশ বাইরে থাকে
  //  ভেতরের ফরমা: {2,3,6,7,…}
  // শর্ত: পৃষ্ঠা ১ যে পাশে থাকবে, সেই পাশের পেজ-সেট = বাইরের ফরমার স্ট্যান্ডার্ড সেট
  const STANDARD_OUTER: Record<FormaSize, number[]> = {
    4: [1, 4],
    8: [1, 4, 5, 8],
    16: [1, 4, 5, 8, 9, 12, 13, 16],
    32: [1, 4, 5, 8, 9, 12, 13, 16, 17, 20, 21, 24, 25, 28, 29, 32],
  };
  const first = imposition.sheets[0];
  const frontSet = first.front.map((p) => p.pageNumber).filter((n) => n > 0).sort((a, b) => a - b);
  const backSet = first.back.map((p) => p.pageNumber).filter((n) => n > 0).sort((a, b) => a - b);
  // কভার (পৃষ্ঠা ১) কোন পাশে?
  const outerIsFront = frontSet.includes(1) || !backSet.includes(1);
  const outerActual = outerIsFront ? frontSet : backSet;
  const innerActual = outerIsFront ? backSet : frontSet;
  // শীট ১-এর পৃষ্ঠা-রেঞ্জ: ১..min(formaSize, totalPages) — বাকি পৃষ্ঠা পরের শীটগুলোতে
  const sheetOneMax = Math.min(totalPages, formaSize);
  const expectedOuter = STANDARD_OUTER[formaSize].filter((n) => n <= sheetOneMax);
  // ভেতরের ফরমার স্ট্যান্ডার্ড সেট — প্রতি জোড়ায় (4k+1,4k+2,4k+3,4k+4) থেকে (4k+2, 4k+3) ভেতরে যায়
  const innerStd: number[] = [];
  for (let n = 1; n <= sheetOneMax; n++) {
    const mod = (n - 1) % 4;
    if (mod === 1 || mod === 2) innerStd.push(n);
  }
  const expectedInnerSet = innerStd;
  const outerFormaOk =
    outerActual.length === expectedOuter.length && outerActual.every((n, i) => n === expectedOuter[i]);
  const innerFormaOk =
    innerActual.length === expectedInnerSet.length && innerActual.every((n, i) => n === expectedInnerSet[i]);
  if (!outerFormaOk) {
    problems.push(
      `বাইরের ফরমা মেলেনি: পাওয়া গেছে [${outerActual.join(', ')}], প্রত্যাশিত [${expectedOuter.join(', ')}]`,
    );
  }
  if (!innerFormaOk) {
    problems.push(
      `ভেতরের ফরমা মেলেনি: পাওয়া গেছে [${innerActual.join(', ')}], প্রত্যাশিত [${expectedInnerSet.join(', ')}]`,
    );
  }

  return {
    ok: problems.length === 0,
    formaSize,
    totalPages,
    sheetCount: imposition.sheets.length,
    gridOk,
    pageMappingOk,
    outerFormaOk: outerFormaOk && innerFormaOk,
    sheetMm: formaSheetSizeMm(widthMm, heightMm, formaSize),
    duplex,
    problems,
  };
}

// ব্রাউজার কনসোল থেকে যাচাইয়ের সুবিধা (প্রিন্টের উপর কোনো প্রভাব নেই)
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).__bwpFormaSelfCheck = formaSelfCheck;
}

/**
 * ফরমা প্রিন্ট — DOM গঠন → মোড-ক্লাস → @page শীট-সাইজ → রেন্ডার-রেডি অপেক্ষা
 * → window.print() → afterprint/ফলব্যাক-এ ক্লিনআপ
 */
export async function printForma(opts: FormaPrintOptions): Promise<void> {
  if (typeof window === 'undefined') return;

  const { settings, pages } = useEditorStore.getState();

  // ── গার্ড ১: খালি ডকুমেন্ট ──
  if (pages.length === 0) {
    toast.error('ডকুমেন্টে কোনো পৃষ্ঠা নেই — আগে কিছু লিখুন।');
    return;
  }

  // ── গার্ড ২: লাইভ পেজ DOM পাওয়া যাচ্ছে কি না (না পেলে ফাঁকা শীট ছাপা হত) ──
  const pageEls = document.querySelectorAll('.workspace .page-slot .paper-page');
  if (pageEls.length < pages.length) {
    toast.error('পৃষ্ঠাগুলো এখনো লোড হয়নি — এক সেকেন্ড পর আবার চেষ্টা করুন।');
    return;
  }

  const { widthMm, heightMm } = getPageDimensionsMm(
    settings.paperSize,
    settings.orientation,
    settings.customPaper,
  );
  const sheet = formaSheetSizeMm(widthMm, heightMm, opts.formaSize);

  // পুরনো রুট/মোড-অবশেষ থাকলে সরাও
  document.getElementById(ROOT_ID)?.remove();
  document.documentElement.classList.remove(MODE_CLASS);

  // ১) ফরমা-রুট গঠন ও যুক্ত করা
  const root = buildFormaRoot(opts);
  document.body.appendChild(root);

  // ২) ফরমা মোড চালু — প্রিন্ট CSS এখন শুধু শীট দেখাবে
  document.documentElement.classList.add(MODE_CLASS);

  // ৩) @page → শীট সাইজ। স্টাইল-এলিমেন্ট না থাকলে getOrCreate নিজেই তৈরি
  //    করে (সেশনে প্রথমবারই ফরমা প্রিন্ট করলেও সঠিক — আগের বাগ: সাধারণ
  //    প্রিন্ট না চালালে @page সেটই হতো না, শীট A4-এ কাটা পড়ত)।
  const styleEl = getOrCreatePrintStyleEl();
  pageStyleBackup = styleEl.textContent;
  styleEl.textContent = `@page { size: ${sheet.widthMm}mm ${sheet.heightMm}mm; margin: 0; }`;

  const cleanup = () => {
    cleanupForma(styleEl);
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);
  // ফলব্যাক: afterprint কোনো কারণে না এলে ১০ মিনিট পর পরিষ্কার
  const fallbackTimer = window.setTimeout(cleanup, 10 * 60 * 1000);
  window.addEventListener(
    'afterprint',
    () => window.clearTimeout(fallbackTimer),
    { once: true },
  );

  // ৪) রেন্ডার-রেডি অপেক্ষা: ফন্ট → ছবি → লেআউট স্থির
  try {
    await Promise.race([document.fonts.ready, sleep(600)]);
  } catch {
    /* ফন্ট API না থাকলে এগিয়ে যাও */
  }
  await waitForImages(root);
  await raf2();
  await sleep(60);

  // ৫) প্রিন্ট
  window.print();
}
