/**
 * দিন ৬৯ — টাইপোগ্রাফি প্যাক — মাদ্রাসা/সংস্কৃত/হিন্দি প্রকাশনা-প্রথার ফন্ট-জোড় +
 * সংখ্যা-প্রথা।
 *
 *  - ফন্ট-জোড়: শিরোনাম + গদ্যের জন্য পরীক্ষিত জুটি (paper.ts-এর ক্যাটালগ থেকে) —
 *    এক ক্লিকে ডকুমেন্টের ডিফল্ট ফন্ট বদল।
 *  - সংখ্যা-প্রথা: পুরো ডকুমেন্টের অঙ্ক নির্দিষ্ট প্রথায় ঢালাই (ল্যাটিন/বাংলা/আরবি-ইন্দিক/
 *    দেবনাগরী) — কেবল টেক্সট-নোড বদলায়, মার্কআপ/অ্যাট্রিবিউট অক্ষত; guardSnapshot-সুরক্ষিত।
 */

import type { Lang } from './i18n';

interface T3 { bn: string; hi: string; en: string }

export type NumeralSystem = 'latin' | 'bangla' | 'arabic-indic' | 'devanagari';

export interface TypographyPack {
  id: 'madrasa' | 'sanskrit' | 'hindi';
  name: T3;
  desc: T3;
  /** শিরোনামের ফন্ট (paper.ts ক্যাটালগের family) */
  headingFont: string;
  /** গদ্যের ফন্ট — ডকুমেন্টের defaultFont হবে */
  bodyFont: string;
  numerals: NumeralSystem;
  /** নমুনা-লাইন (কার্ডে প্রিভিউ) */
  sample: T3;
}

export const TYPOGRAPHY_PACKS: TypographyPack[] = [
  {
    id: 'madrasa',
    name: { bn: 'মাদ্রাসা', hi: 'मदरसा', en: 'Madrasa' },
    desc: {
      bn: 'ধর্মীয় শিক্ষা-প্রতিষ্ঠানের হিসাব-নোটিশ-সনদ — ধ্রুপদি বাংলা সেরিফ জোড় ও আরবি-ইন্দিক অঙ্কপ্রথা।',
      hi: 'धार्मिक शिक्षा संस्थान के दस्तावेज़ — क्लासिक बंगला सेरिफ जोड़ी व अरबी-हिंदी अंक प्रथा।',
      en: 'Madrasa documents — classic Bangla serif pair with Arabic-Indic numerals.',
    },
    headingFont: 'Siyam Rupali',
    bodyFont: 'Tiro Bangla',
    numerals: 'arabic-indic',
    sample: { bn: 'নমুনা: ১২৩ → ١٢٣', hi: 'नमूना: १२३ → ١٢٣', en: 'Sample: 123 → ١٢٣' },
  },
  {
    id: 'sanskrit',
    name: { bn: 'সংস্কৃত', hi: 'संस्कृत', en: 'Sanskrit' },
    desc: {
      bn: 'শ্লোক-পাঠ-পরীক্ষার সংস্কৃত নথি — সেরিফ দেবনাগরী জোড় ও দেবনাগরী অঙ্কপ্রথা।',
      hi: 'श्लोक-पाठ-परीक्षा संस्कृत दस्तावेज़ — सेरिफ देवनागरी जोड़ी व देवनागरी अंक।',
      en: 'Sanskrit documents — serif Devanagari pair with Devanagari numerals.',
    },
    headingFont: 'Tiro Devanagari Hindi',
    bodyFont: 'Noto Serif Devanagari',
    numerals: 'devanagari',
    sample: { bn: 'নমুনা: ১২৩ → १२३', hi: 'नमूना: १२३ → १२३', en: 'Sample: 123 → १२३' },
  },
  {
    id: 'hindi',
    name: { bn: 'হিন্দি', hi: 'हिन्दी', en: 'Hindi' },
    desc: {
      bn: 'আধুনিক হিন্দি প্রকাশনা — পরিচ্ছন্ন স্যানস জোড় ও দেবনাগরী অঙ্কপ্রথা।',
      hi: 'आधुनिक हिंदी प्रकाशन — स्वच्छ सैंस जोड़ी व देवनागरी अंक।',
      en: 'Modern Hindi publishing — clean sans pair with Devanagari numerals.',
    },
    headingFont: 'Anek Devanagari',
    bodyFont: 'Hind',
    numerals: 'devanagari',
    sample: { bn: 'নমুনা: ১২৩ → १२३', hi: 'नमूना: १२३ → १२३', en: 'Sample: 123 → १२३' },
  },
];

// ─── অঙ্ক-প্রথা ───

/** প্রতিটি প্রথার ০-৯ চরসারি */
const DIGIT_SETS: Record<NumeralSystem, string[]> = {
  latin: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  bangla: ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'],
  'arabic-indic': ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'],
  devanagari: ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'],
};

/** সব প্রথা চেনার রেঞ্জ — ল্যাটিন/বাংলা/আরবি-ইন্দিক/দেবনাগরী অঙ্ক */
const SOURCE_RE = /[0-9\u09E6-\u09EF\u0660-\u0669\u0966-\u096F]/g;
const SOURCE_TEST_RE = /[0-9\u09E6-\u09EF\u0660-\u0669\u0966-\u096F]/;

function digitIndex(ch: string): number | null {
  const code = ch.codePointAt(0) ?? 0;
  if (code >= 0x30 && code <= 0x39) return code - 0x30;        // latin
  if (code >= 0x09e6 && code <= 0x09ef) return code - 0x09e6;  // bangla
  if (code >= 0x0660 && code <= 0x0669) return code - 0x0660;  // arabic-indic
  if (code >= 0x0966 && code <= 0x096f) return code - 0x0966;  // devanagari
  return null;
}

/** যেকোনো চেনা প্রথা → টার্গেট প্রথা (টেক্সট-ফ্র্যাগমেন্টে) */
export function convertDigits(text: string, to: NumeralSystem): string {
  const target = DIGIT_SETS[to];
  return text.replace(SOURCE_RE, (ch) => {
    const i = digitIndex(ch);
    return i === null ? ch : target[i];
  });
}

/**
 * পাতার HTML-এর কেবল টেক্সট-নোডে অঙ্ক বদল — মার্কআপ/অ্যাট্রিবিউট/data-* (কাগজ-মাপ,
 * বর্ডার-রং ইত্যাদি) অক্ষত থাকে। SSR-নিরাপদ (ব্রাউজারে ডাকা হয়)।
 */
export function convertDigitsInHtml(html: string, to: NumeralSystem): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') return html;
  try {
    const doc = new DOMParser().parseFromString(html || '', 'text/html');
    const walker = doc.createTreeWalker(doc.body, window.NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        const parent = (node as Text).parentElement;
        if (!parent) return 2; // REJECT
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE') return 2;
        return SOURCE_TEST_RE.test(node.nodeValue ?? '') ? 1 : 2; // ACCEPT / REJECT
      },
    });
    let changed = false;
    let node = walker.nextNode();
    while (node) {
      const next = convertDigits(node.nodeValue ?? '', to);
      if (next !== node.nodeValue) {
        node.nodeValue = next;
        changed = true;
      }
      node = walker.nextNode();
    }
    if (!changed) return html;
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

/** প্যাক-কার্ডের নমুনা-সারি (বর্তমান ভাষায়) */
export function packSampleLine(pack: TypographyPack, lang: Lang): string {
  const m = pack.sample;
  return lang === 'bn' ? m.bn : lang === 'hi' ? m.hi : m.en;
}
