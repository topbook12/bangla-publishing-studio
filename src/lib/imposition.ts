/**
 * ফরমা (Imposition) — ছাপাখানার বড় শীটে পৃষ্ঠা ভাঁজ-সঠিক ক্রমে সাজানোর গণিত।
 *
 * মডেল (একক ফিজিক্যাল কনভেনশন — স্বাধীন রি-ফোল্ড টেস্টে প্রমাণিত):
 *  - শীটের A পাশ (প্রথমে উপরে) C×R ঘর; প্রতিটি ঘর = একটি ফিজিক্যাল প্যানেলের A ফেস।
 *  - ভাঁজ সিমুলেশন: প্রতিটি ভাঁজে mover অর্ধেক still অর্ধেকের উপরে পড়ে, faceFlips ও
 *    hFlips (অনুভূমিক-অক্ষ ভাঁজে মাথা উল্টানো) ট্র্যাক হয়।
 *  - শেষ স্ট্যাক (নিচ→উপর): উপরের প্যানেল = বইয়ের কভার। লেয়ার L (উপর→নিচ):
 *    up ফেস = পৃষ্ঠা 2L-1, down ফেস = পৃষ্ঠা 2L।
 *  - খাড়াতা (upright): প্রতিটি প্যানেলের ছাপা রোটেশন = hFlips parity — তখন ভাঁজের
 *    পর সব পৃষ্ঠা খাড়া থাকে (কোনো "phase" শর্ত নেই)।
 *  - B পাশ (ব্যাক ভিউ): শীট উল্লম্ব অক্ষে উল্টালে back-view (r,c) = physical (r, C-1-c);
 *    উপর/নিচ অপরিবর্তিত তাই রোটেশন ফ্ল্যাগ অপরিবর্তিত।
 *
 * ভ্যালিডেশন (scratch স্ক্রিপ্টে স্বাধীনভাবে প্রমাণিত — সব সাইজে):
 *  ১) ভাঁজ করা শীট আবার ভাঁজ করলে পড়ার ক্রম ঠিক 1..N
 *  ২) প্রতিটি পৃষ্ঠা খাড়া (কোনোটিই উল্টো নয়)
 *  ৩) আউটার ফর্মের পেজ-সেট প্রকাশিত স্ট্যান্ডার্ডের সাথে মেলে:
 *     4pp {1,4}; 8pp {1,4,5,8}; 16pp {1,4,5,8,9,12,13,16};
 *     32pp {1,4,5,8,9,12,13,16,17,20,21,24,25,28,29,32}
 */

export type FormaSize = 4 | 8 | 16 | 32;

export const FORMA_SIZES: FormaSize[] = [4, 8, 16, 32];

/** একটি ফরমা-ঘর (শীটের এক পাশের এক সেল) */
export interface FormaPanel {
  /** পৃষ্ঠা নম্বর (গ্লোবাল, 1-based); 0 = খালি (blank) প্যানেল */
  pageNumber: number;
  /** ভাঁজের পর খাড়া দেখাতে ১৮০° ঘুরিয়ে ছাপাতে হবে কি না */
  rotate180: boolean;
  /** শীট-গ্রিডে অবস্থান (0-based, বাঁ থেকে col / উপর থেকে row) */
  col: number;
  row: number;
}

export interface FormaSheet {
  front: FormaPanel[];
  back: FormaPanel[];
}

export interface ImpositionResult {
  /** প্রতি পাশের গ্রিড */
  grid: { cols: number; rows: number };
  sheets: FormaSheet[];
  /** ফরমা পূরণ করতে যোগ করা খালি পৃষ্ঠা */
  blankPagesAdded: number;
}

/** প্রতি পাশের গ্রিড (cols × rows = N/2 প্যানেল) */
export const FORMA_GRIDS: Record<FormaSize, { cols: number; rows: number }> = {
  4: { cols: 2, rows: 1 },
  8: { cols: 2, rows: 2 },
  16: { cols: 4, rows: 2 },
  32: { cols: 4, rows: 4 },
};

/** ভাঁজের ক্রম — V: উল্লম্ব অক্ষে ভাঁজ, H: অনুভূমিক অক্ষে ভাঁজ */
export const FORMA_FOLD_SEQUENCE: Record<FormaSize, Array<'V' | 'H'>> = {
  4: ['V'],
  8: ['V', 'H'],
  16: ['V', 'H', 'V'],
  32: ['V', 'H', 'V', 'H'],
};

type FoldDirection = 'R2L' | 'L2R' | 'B2T' | 'T2B';

/**
 * প্রতি ভাঁজে কোন অর্ধেক নড়ে (mover) — স্ট্যান্ডার্ড স্কিম:
 * R2L (ডান অর্ধেক বাঁয়ের উপরে) → B2T (নিচের অর্ধেক উপরে) → পুনরাবৃত্তি।
 * এই স্কিমেই প্রকাশিত স্ট্যান্ডার্ড ফরমা-লেআউট মেলে এবং কভার প্যানেলের hFlips জোড় থাকে
 * (ফলে পৃষ্ঠা ১ ফ্রন্ট-ভিউতে খাড়া ছাপা হয়)।
 */
const CANONICAL_DIRS: FoldDirection[] = ['R2L', 'B2T', 'R2L', 'B2T'];

interface SimPanel {
  /** প্রাথমিক শীট-সেল ইনডেক্স (row-major: r*C + c) */
  cell: number;
  /** ভাঁজে কতবার উল্টেছে — parity ঠিক করে কোন ফেসে বিজোড়/জোড় পৃষ্ঠা বসবে */
  faceFlips: number;
  /** অনুভূমিক-অক্ষ ভাঁজে mover হওয়ার সংখ্যা — parity = ছাপার রোটেশন ফ্ল্যাগ */
  hFlips: number;
}

interface CellInfo {
  pageA: number; // A ফেসের পৃষ্ঠা (ফিজিক্যাল সেলের সামনের পাশ)
  pageB: number; // B ফেসের পৃষ্ঠা
  rotate180: boolean; // দুই ফেসের ছাপা রোটেশন (hFlips parity)
}

/**
 * ভাঁজ সিমুলেশন — স্ট্যাক গঠন করে প্রতি ফিজিক্যাল সেলের A/B ফেসে পৃষ্ঠা নির্ণয়।
 */
export function foldSimulate(
  size: FormaSize,
  dirs: FoldDirection[] = CANONICAL_DIRS,
): CellInfo[] {
  const { cols: C, rows: R } = FORMA_GRIDS[size];
  const cellCount = C * R; // = N/2

  type Stack = SimPanel[];
  let stacks: Stack[] = [];
  for (let i = 0; i < cellCount; i++) stacks.push([{ cell: i, faceFlips: 0, hFlips: 0 }]);
  let cw = C;
  let ch = R;

  const flips = (p: SimPanel, horizontal: boolean): SimPanel => ({
    cell: p.cell,
    faceFlips: p.faceFlips + 1,
    hFlips: p.hFlips + (horizontal ? 1 : 0),
  });

  const folds = FORMA_FOLD_SEQUENCE[size];
  for (let f = 0; f < folds.length; f++) {
    const kind = folds[f];
    const dir = dirs[f] ?? dirs[dirs.length - 1];
    const next: Stack[] = [];
    if (kind === 'V') {
      const half = cw / 2;
      for (let r = 0; r < ch; r++) {
        for (let nc = 0; nc < half; nc++) {
          const stillCol = dir === 'R2L' ? nc : nc + half;
          const moveCol = cw - 1 - stillCol;
          const still = stacks[r * cw + stillCol];
          const mover = stacks[r * cw + moveCol].slice().reverse().map((p) => flips(p, false));
          next[r * half + nc] = [...still, ...mover];
        }
      }
      cw = half;
    } else {
      const half = ch / 2;
      for (let nr = 0; nr < half; nr++) {
        for (let c = 0; c < cw; c++) {
          const stillRow = dir === 'B2T' ? nr : nr + half;
          const moveRow = ch - 1 - stillRow;
          const still = stacks[stillRow * cw + c];
          const mover = stacks[moveRow * cw + c].slice().reverse().map((p) => flips(p, true));
          next[nr * cw + c] = [...still, ...mover];
        }
      }
      ch = half;
    }
    stacks = next;
  }

  // একক ঘরের স্ট্যাক (নিচ→উপর)। উপরের প্যানেল = কভার।
  const N = cellCount;
  const result: CellInfo[] = new Array(cellCount);
  const stack = stacks[0];
  for (let i = 0; i < N; i++) {
    const panel = stack[i]; // নিচ থেকে 0-based
    const layer = N - i; // উপর থেকে 1-based (উপরের প্যানেল = লেয়ার ১)
    const upPage = 2 * layer - 1;
    const downPage = 2 * layer;
    const aFaceUp = panel.faceFlips % 2 === 0; // শুরুতে A উপরে ছিল
    const pageA = aFaceUp ? upPage : downPage;
    const pageB = aFaceUp ? downPage : upPage;
    result[panel.cell] = {
      pageA,
      pageB,
      rotate180: panel.hFlips % 2 === 1, // খাড়া রাখতে hFlips parity-ই ছাপার রোটেশন
    };
  }
  return result;
}

/**
 * প্রেস-শীটের দুই পাশের প্রিন্ট-লেআউট (VIEW ফ্রেমে)।
 *  - front: A পাশ সরাসরি দেখা (physical (r,c) → view (r,c))
 *  - back:  শীট উল্লম্ব অক্ষে উল্টে দেখা (physical (r,c) → view (r, C-1-c));
 *           অনুভূমিক-অক্ষ ফ্লিপ হলে view (R-1-r, c) এবং রোটেশন ফ্ল্যাগ উল্টে যায়।
 */
export function buildFormes(
  sim: CellInfo[],
  size: FormaSize,
  duplex: 'vertical' | 'horizontal' = 'vertical',
): { front: FormaPanel[]; back: FormaPanel[] } {
  const { cols: C, rows: R } = FORMA_GRIDS[size];
  const front: FormaPanel[] = [];
  const back: FormaPanel[] = [];
  sim.forEach((cell, i) => {
    const c = i % C;
    const r = Math.floor(i / C);
    front.push({ pageNumber: cell.pageA, rotate180: cell.rotate180, col: c, row: r });
    const vc = duplex === 'vertical' ? C - 1 - c : c;
    const vr = duplex === 'vertical' ? r : R - 1 - r;
    const rot = duplex === 'vertical' ? cell.rotate180 : !cell.rotate180;
    back.push({ pageNumber: cell.pageB, rotate180: rot, col: vc, row: vr });
  });
  const byPos = (arr: FormaPanel[]) => arr.slice().sort((a, b) => a.row - b.row || a.col - b.col);
  return { front: byPos(front), back: byPos(back) };
}

/** ফরমা গণনা — মোট পৃষ্ঠা থেকে সব শীটের সামনে/পেছনে লেআউট */
export function computeImposition(
  totalPages: number,
  formaSize: FormaSize,
  duplex: 'vertical' | 'horizontal' = 'vertical',
): ImpositionResult {
  const sim = foldSimulate(formaSize);
  const formes = buildFormes(sim, formaSize, duplex);
  const grid = FORMA_GRIDS[formaSize];
  const sheetCount = Math.max(1, Math.ceil(totalPages / formaSize));
  const blankPagesAdded = sheetCount * formaSize - Math.max(0, totalPages);

  const sheets: FormaSheet[] = [];
  for (let s = 0; s < sheetCount; s++) {
    const offset = s * formaSize;
    const mapPage = (local: number): number => {
      const g = offset + local;
      return g >= 1 && g <= totalPages ? g : 0;
    };
    sheets.push({
      front: formes.front.map((p) => ({ ...p, pageNumber: mapPage(p.pageNumber) })),
      back: formes.back.map((p) => ({ ...p, pageNumber: mapPage(p.pageNumber) })),
    });
  }
  return { grid, sheets, blankPagesAdded };
}

/** প্রেস শীটের মাপ (mm) — পৃষ্ঠার মাপ × গ্রিড */
export function formaSheetSizeMm(
  pageWidthMm: number,
  pageHeightMm: number,
  formaSize: FormaSize,
): { widthMm: number; heightMm: number } {
  const { cols, rows } = FORMA_GRIDS[formaSize];
  return { widthMm: pageWidthMm * cols, heightMm: pageHeightMm * rows };
}

/** ভাঁজ রেখার অবস্থান (mm) — টিক/গাটার লাইন আঁকতে */
export function formaFoldOffsetsMm(
  pageWidthMm: number,
  pageHeightMm: number,
  formaSize: FormaSize,
): { verticalXmm: number[]; horizontalYmm: number[] } {
  const { cols, rows } = FORMA_GRIDS[formaSize];
  return {
    verticalXmm: Array.from({ length: cols - 1 }, (_, i) => (i + 1) * pageWidthMm),
    horizontalYmm: Array.from({ length: rows - 1 }, (_, i) => (i + 1) * pageHeightMm),
  };
}
