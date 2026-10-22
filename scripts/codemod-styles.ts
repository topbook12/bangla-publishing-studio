/**
 * Task 7 codemod — document-studio.ts
 * 1. Every template gets the full 10-palette gallery (ALL_STYLES).
 * 2. Curated premium defaultStyle per template (genre-correct color combos).
 */
import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/lib/document-studio.ts';
let src = readFileSync(FILE, 'utf8');

// ── 1. add ALL_STYLES helper right after DS_STYLES definition ──
if (!src.includes('const ALL_STYLES')) {
  const anchor = "function styleById(id: string, fallback = 'classic'): DsStyleOpt {";
  const helper = `/** পুরো প্যালেট-গ্যালারি — প্রতিটি টেমপ্লেট দশটি কিউরেটেড রং-সংযোগ পায় */
const ALL_STYLES: string[] = DS_STYLES.map((s) => s.id);

`;
  src = src.replace(anchor, helper + anchor);
}

// ── 2. replace every styles array with ALL_STYLES ──
const before = (src.match(/styles: \[[^\]]*\],/g) ?? []).length;
src = src.replace(/styles: \[[^\]]*\],/g, 'styles: ALL_STYLES,');
console.log('styles arrays replaced:', before);

// ── 3. curated defaults ──
const DEFAULT_MAP: Record<string, string> = {
  // চাকরি ও ক্যারিয়ার
  'resume-modern': 'teal',
  'resume-classic': 'graphite',
  'resume-cover': 'espresso',
  'letter-recommendation': 'green',
  'letter-resignation': 'graphite',
  // ব্যবসা ও অফিস
  letterhead: 'royal',
  memo: 'graphite',
  'meeting-agenda': 'teal',
  'meeting-minutes': 'graphite',
  notice: 'royal',
  'office-order': 'green',
  'official-letter': 'royal',
  report: 'teal',
  'project-proposal': 'green',
  'calendar-month': 'royal',
  // ইনভয়েস ও আর্থিক
  invoice: 'teal',
  'money-receipt': 'royal',
  quotation: 'espresso',
  'purchase-order': 'green',
  // আইনি ও চুক্তি — আর্কাইভি সেপিয়া/গ্রাফাইট
  agreement: 'sepia',
  'rental-agreement': 'sepia',
  'employment-contract': 'graphite',
  nda: 'graphite',
  affidavit: 'sepia',
  // সনদ ও পুরস্কার
  award: 'royal',
  'certificate-appreciation': 'royal',
  'certificate-participation': 'wine',
  'certificate-training': 'green',
  // শিক্ষা
  'class-routine': 'green',
  'exam-routine': 'green',
  marksheet: 'teal',
  'report-card': 'royal',
  admission: 'royal',
  'lesson-plan': 'teal',
  // অনুষ্ঠান
  invitation: 'plum',
  'wedding-card': 'royal',
  program: 'wine',
  // চিকিৎসা
  prescription: 'green',
  'medical-certificate': 'teal',
  // মার্কেটিং
  poster: 'royal',
  flyer: 'teal',
  'brochure-trifold': 'teal',
  newsletter: 'royal',
  'press-release': 'graphite',
  'business-card': 'graphite',
  // আঞ্চলিক — সনদে রয়্যাল মেরুন (প্রথাসিদ্ধ), দরখাস্তে ক্লাসিক কালি, দলিলে সেপিয়া
  residence: 'royal',
  character: 'royal',
  unmarried: 'royal',
  income: 'royal',
  heir: 'royal',
  'general-app': 'classic',
  mutation: 'green',
  'gift-deed': 'sepia',
  partition: 'sepia',
  'sale-deed': 'sepia',
};

let changed = 0;
for (const [id, style] of Object.entries(DEFAULT_MAP)) {
  const re = new RegExp(`(id: '${id}',[\\s\\S]{0,700}?defaultStyle: ')([a-z]+)(')`);
  if (!re.test(src)) {
    console.error('NOT FOUND:', id);
    continue;
  }
  src = src.replace(re, (_m, a, oldV, c) => {
    if (oldV !== style) changed += 1;
    return `${a}${style}${c}`;
  });
}
console.log('defaultStyle changed:', changed);

writeFileSync(FILE, src);
console.log('done');
