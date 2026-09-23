/**
 * ফরমা (Imposition) প্রিন্ট ফ্লো —
 *  ১) লাইভ পেজ DOM ক্লোন করে প্রেস-শীটে ভাঁজ-সঠিক ক্রমে বসানো
 *  ২) @page সাময়িকভাবে শীট-সাইজে সেট করা
 *  ৩) window.print() → afterprint-এ পরিচ্ছন্ন
 *
 * গণিত: src/lib/imposition.ts (স্বাধীন ভ্যালিডেশনে প্রমাণিত)
 */

import { useEditorStore } from '@/lib/store';
import { getPageDimensionsMm } from '@/lib/paper';
import {
  computeImposition,
  formaSheetSizeMm,
  formaFoldOffsetsMm,
  type FormaSize,
} from '@/lib/imposition';

export interface FormaPrintOptions {
  formaSize: FormaSize;
  /** interleaved: A,B,A,B… | fronts-first: সব সামনের পাশ, তারপর সব পেছনের */
  sideOrder: 'interleaved' | 'fronts-first';
  foldMarks: boolean;
}

const ROOT_ID = 'forma-print-root';
let pageStyleBackup: string | null = null;

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
  const imposition = computeImposition(pages.length, opts.formaSize);

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

/** ফরমা প্রিন্ট — DOM গঠন → @page শীট-সাইজ → window.print() → ক্লিনআপ */
export function printForma(opts: FormaPrintOptions): void {
  if (typeof window === 'undefined') return;

  const { settings } = useEditorStore.getState();
  const { widthMm, heightMm } = getPageDimensionsMm(
    settings.paperSize,
    settings.orientation,
    settings.customPaper,
  );
  const sheet = formaSheetSizeMm(widthMm, heightMm, opts.formaSize);

  // পুরনো রুট থাকলে সরাও
  document.getElementById(ROOT_ID)?.remove();

  const root = buildFormaRoot(opts);
  document.body.appendChild(root);

  // @page → শীট সাইজ (পরে রিস্টোরের জন্য ব্যাকআপ)
  const styleEl = document.getElementById('bwp-print-page') as HTMLStyleElement | null;
  pageStyleBackup = styleEl?.textContent ?? null;
  if (styleEl) {
    styleEl.textContent = `@page { size: ${sheet.widthMm}mm ${sheet.heightMm}mm; margin: 0; }`;
  }

  const cleanup = () => {
    document.getElementById(ROOT_ID)?.remove();
    if (styleEl && pageStyleBackup !== null) styleEl.textContent = pageStyleBackup;
    pageStyleBackup = null;
    window.removeEventListener('afterprint', cleanup);
  };
  window.addEventListener('afterprint', cleanup);

  // ক্লোন-রেন্ডার স্থির হতে ছোট বিলম্ব
  window.setTimeout(() => window.print(), 80);
}
