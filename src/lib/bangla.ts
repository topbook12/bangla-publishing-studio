/**
 * বাংলা ভাষা সহায়ক ইউটিলিটি (Bangla Language Utilities)
 * বাংলা ডিজিট, রোমান সংখ্যা, তারিখ-সময় ও যুক্তবর্ণ সংক্রান্ত সব ফাংশন এখানে।
 * কোনো এক্সটার্নাল ডিপেন্ডেন্সি নেই — সম্পূর্ণ অফলাইনে চলে।
 */

/** বাংলা সংখ্যা অক্ষরমালা (০-৯) */
export const BANGLA_DIGITS: readonly string[] = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

/** সংখ্যা বা স্ট্রিং-এর ভেতরের সব ইংরেজি ডিজিট বাংলায় রূপান্তর করে (অন্য ক্যারেক্টার অক্ষত থাকে) */
export function toBanglaNumber(n: number | string): string {
  const s = typeof n === 'number' ? String(n) : n;
  return s.replace(/[0-9]/g, (d) => BANGLA_DIGITS[Number(d)]);
}

/** বাংলা ডিজিটযুক্ত স্ট্রিং থেকে ইংরেজি ডিজিটে রূপান্তর */
export function toEnglishDigits(s: string): string {
  return s.replace(/[০-৯]/g, (d) => String(BANGLA_DIGITS.indexOf(d)));
}

/** সংখ্যাকে রোমান সংখ্যায় রূপান্তর (১-৩৯৯৯); অবৈধ ইনপুটে খালি স্ট্রিং */
export function toRomanNumber(n: number): string {
  if (!Number.isFinite(n) || n <= 0 || n > 3999) return '';
  const map: Array<[number, string]> = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let num = Math.floor(n);
  let out = '';
  for (const [value, symbol] of map) {
    while (num >= value) {
      out += symbol;
      num -= value;
    }
  }
  return out;
}

export type PageNumberFormat = 'bangla' | 'english' | 'roman';

/** পৃষ্ঠা নম্বর নির্দিষ্ট ফরম্যাটে (বাংলা/ইংরেজি/রোমান) প্রদর্শন */
export function formatPageNumber(n: number, format: PageNumberFormat): string {
  switch (format) {
    case 'bangla':
      return toBanglaNumber(n);
    case 'roman':
      return toRomanNumber(n) || toBanglaNumber(n);
    case 'english':
    default:
      return String(n);
  }
}

/** গ্রেগরিয়ান মাসের বাংলা নাম */
export const BN_MONTH_NAMES = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
] as const;

/** সপ্তাহের দিনের বাংলা নাম (রবিবার থেকে শুরু) */
export const BN_DAY_NAMES = [
  'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার',
] as const;

/** আজকের তারিখ বাংলায়, যেমন: "শুক্রবার, ১২ জানুয়ারি ২০২৫" */
export function banglaDateToday(d?: Date): string {
  const date = d ?? new Date();
  const day = BN_DAY_NAMES[date.getDay()] ?? '';
  const month = BN_MONTH_NAMES[date.getMonth()] ?? '';
  return `${day}, ${toBanglaNumber(date.getDate())} ${month} ${toBanglaNumber(date.getFullYear())}`;
}

/** সময়কে বাংলা প্রথায় (ভোর/সকাল/দুপুর/বিকাল/সন্ধ্যা/রাত) প্রকাশ, যেমন: "বিকাল ৪:৩০" */
export function banglaTimeNow(d?: Date): string {
  const date = d ?? new Date();
  const h24 = date.getHours();
  const m = date.getMinutes();
  const period =
    h24 >= 4 && h24 < 6 ? 'ভোর' :
    h24 >= 6 && h24 < 12 ? 'সকাল' :
    h24 >= 12 && h24 < 16 ? 'দুপুর' :
    h24 >= 16 && h24 < 18 ? 'বিকাল' :
    h24 >= 18 && h24 < 20 ? 'সন্ধ্যা' : 'রাত';
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${period} ${toBanglaNumber(h12)}:${toBanglaNumber(String(m).padStart(2, '0'))}`;
}

export interface ConjunctInfo {
  /** যুক্তবর্ণ ক্যারেক্টার, যেমন: "ক্ষ" */
  char: string;
  /** ছোট পরিচিতি, যেমন: "ক + ষ" */
  name: string;
}

/**
 * প্রচলিত বাংলা যুক্তবর্ণের তালিকা (যুক্তবর্ণ প্যালেট ও প্রুফিং টুলে ব্যবহৃত)
 */
export const CONJUNCTS: ConjunctInfo[] = [
  { char: 'ক্ক', name: 'ক + ক' },
  { char: 'ক্ত', name: 'ক + ত' },
  { char: 'ক্ট', name: 'ক + ট' },
  { char: 'ক্ণ', name: 'ক + ণ' },
  { char: 'ক্র', name: 'ক + র' },
  { char: 'ক্ল', name: 'ক + ল' },
  { char: 'ক্ষ', name: 'ক + ষ' },
  { char: 'গ্ধ', name: 'গ + ধ' },
  { char: 'গ্ন', name: 'গ + ন' },
  { char: 'গ্ম', name: 'গ + ম' },
  { char: 'গ্র', name: 'গ + র' },
  { char: 'গ্ল', name: 'গ + ল' },
  { char: 'ঘ্ন', name: 'ঘ + ন' },
  { char: 'ঙ্ক', name: 'ঙ + ক' },
  { char: 'ঙ্গ', name: 'ঙ + গ' },
  { char: 'চ্চ', name: 'চ + চ' },
  { char: 'চ্ছ', name: 'চ + ছ' },
  { char: 'চ্ন', name: 'চ + ন' },
  { char: 'চ্র', name: 'চ + র' },
  { char: 'জ্জ', name: 'জ + জ' },
  { char: 'জ্জ্ব', name: 'জ + জ + ব' },
  { char: 'জ্ঞ', name: 'জ + ঞ' },
  { char: 'জ্ব', name: 'জ + ব' },
  { char: 'জ্র', name: 'জ + র' },
  { char: 'ঞ্চ', name: 'ঞ + চ' },
  { char: 'ঞ্ছ', name: 'ঞ + ছ' },
  { char: 'ঞ্জ', name: 'ঞ + জ' },
  { char: 'ট্ট', name: 'ট + ট' },
  { char: 'ট্ঠ', name: 'ট + ঠ' },
  { char: 'ট্র', name: 'ট + র' },
  { char: 'ড্ড', name: 'ড + ড' },
  { char: 'ড্ট', name: 'ড + ট' },
  { char: 'ড্র', name: 'ড + র' },
  { char: 'ণ্ট', name: 'ণ + ট' },
  { char: 'ণ্ঠ', name: 'ণ + ঠ' },
  { char: 'ণ্ড', name: 'ণ + ড' },
  { char: 'ণ্ণ', name: 'ণ + ণ' },
  { char: 'ত্ত', name: 'ত + ত' },
  { char: 'ত্থ', name: 'ত + থ' },
  { char: 'ত্ন', name: 'ত + ন' },
  { char: 'ত্ম', name: 'ত + ম' },
  { char: 'ত্র', name: 'ত + র' },
  { char: 'ত্ল', name: 'ত + ল' },
  { char: 'থ্ন', name: 'থ + ন' },
  { char: 'থ্র', name: 'থ + র' },
  { char: 'দ্গ', name: 'দ + গ' },
  { char: 'দ্ঘ', name: 'দ + ঘ' },
  { char: 'দ্দ', name: 'দ + দ' },
  { char: 'দ্ধ', name: 'দ + ধ' },
  { char: 'দ্ব', name: 'দ + ব' },
  { char: 'দ্ভ', name: 'দ + ভ' },
  { char: 'দ্ম', name: 'দ + ম' },
  { char: 'দ্র', name: 'দ + র' },
  { char: 'ধ্ব', name: 'ধ + ব' },
  { char: 'ন্ক', name: 'ন + ক' },
  { char: 'ন্ট', name: 'ন + ট' },
  { char: 'ন্ঠ', name: 'ন + ঠ' },
  { char: 'ন্ড', name: 'ন + ড' },
  { char: 'ন্ত', name: 'ন + ত' },
  { char: 'ন্থ', name: 'ন + থ' },
  { char: 'ন্দ', name: 'ন + দ' },
  { char: 'ন্ধ', name: 'ন + ধ' },
  { char: 'ন্ন', name: 'ন + ন' },
  { char: 'ন্ম', name: 'ন + ম' },
  { char: 'ন্স', name: 'ন + স' },
  { char: 'প্ট', name: 'প + ট' },
  { char: 'প্ত', name: 'প + ত' },
  { char: 'প্ন', name: 'প + ন' },
  { char: 'প্প', name: 'প + প' },
  { char: 'প্র', name: 'প + র' },
  { char: 'প্ল', name: 'প + ল' },
  { char: 'প্স', name: 'প + স' },
  { char: 'ফ্ট', name: 'ফ + ট' },
  { char: 'ফ্র', name: 'ফ + র' },
  { char: 'ফ্ল', name: 'ফ + ল' },
  { char: 'ব্জ', name: 'ব + জ' },
  { char: 'ব্ট', name: 'ব + ট' },
  { char: 'ব্ড', name: 'ব + ড' },
  { char: 'ব্দ', name: 'ব + দ' },
  { char: 'ব্ধ', name: 'ব + ধ' },
  { char: 'ব্ন', name: 'ব + ন' },
  { char: 'ব্প', name: 'ব + প' },
  { char: 'ব্র', name: 'ব + র' },
  { char: 'ব্ল', name: 'ব + ল' },
  { char: 'ব্স', name: 'ব + স' },
  { char: 'ভ্ন', name: 'ভ + ন' },
  { char: 'ভ্র', name: 'ভ + র' },
  { char: 'ভ্ল', name: 'ভ + ল' },
  { char: 'ম্ন', name: 'ম + ন' },
  { char: 'ম্প', name: 'ম + প' },
  { char: 'ম্ফ', name: 'ম + ফ' },
  { char: 'ম্ব', name: 'ম + ব' },
  { char: 'ম্ভ', name: 'ম + ভ' },
  { char: 'ম্ম', name: 'ম + ম' },
  { char: 'ম্ল', name: 'ম + ল' },
  { char: 'য্ন', name: 'য + ন' },
  { char: 'য্ম', name: 'য + ম' },
  { char: 'য্র', name: 'য + র' },
  { char: 'র্ক', name: 'র + ক' },
  { char: 'র্ক্ক', name: 'র + ক + ক' },
  { char: 'র্গ', name: 'র + গ' },
  { char: 'র্ঘ', name: 'র + ঘ' },
  { char: 'র্চ', name: 'র + চ' },
  { char: 'র্ছ', name: 'র + ছ' },
  { char: 'র্জ', name: 'র + জ' },
  { char: 'র্ট', name: 'র + ট' },
  { char: 'র্ড', name: 'র + ড' },
  { char: 'র্ণ', name: 'র + ণ' },
  { char: 'র্ত', name: 'র + ত' },
  { char: 'র্থ', name: 'র + থ' },
  { char: 'র্দ', name: 'র + দ' },
  { char: 'র্ধ', name: 'র + ধ' },
  { char: 'র্ন', name: 'র + ন' },
  { char: 'র্প', name: 'র + প' },
  { char: 'র্ফ', name: 'র + ফ' },
  { char: 'র্ব', name: 'র + ব' },
  { char: 'র্ভ', name: 'র + ভ' },
  { char: 'র্ম', name: 'র + ম' },
  { char: 'র্য', name: 'র + য' },
  { char: 'র্ল', name: 'র + ল' },
  { char: 'র্স', name: 'র + স' },
  { char: 'র্হ', name: 'র + হ' },
  { char: 'ল্ক', name: 'ল + ক' },
  { char: 'ল্গ', name: 'ল + গ' },
  { char: 'ল্ট', name: 'ল + ট' },
  { char: 'ল্ড', name: 'ল + ড' },
  { char: 'ল্প', name: 'ল + প' },
  { char: 'ল্ফ', name: 'ল + ফ' },
  { char: 'ল্ব', name: 'ল + ব' },
  { char: 'ল্ভ', name: 'ল + ভ' },
  { char: 'ল্ম', name: 'ল + ম' },
  { char: 'ল্ল', name: 'ল + ল' },
  { char: 'শ্চ', name: 'শ + চ' },
  { char: 'শ্ছ', name: 'শ + ছ' },
  { char: 'শ্ন', name: 'শ + ন' },
  { char: 'শ্ম', name: 'শ + ম' },
  { char: 'শ্র', name: 'শ + র' },
  { char: 'ষ্ক', name: 'ষ + ক' },
  { char: 'ষ্ট', name: 'ষ + ট' },
  { char: 'ষ্ঠ', name: 'ষ + ঠ' },
  { char: 'ষ্ণ', name: 'ষ + ণ' },
  { char: 'ষ্প', name: 'ষ + প' },
  { char: 'ষ্ফ', name: 'ষ + ফ' },
  { char: 'ষ্ম', name: 'ষ + ম' },
  { char: 'স্ক', name: 'স + ক' },
  { char: 'স্খ', name: 'স + খ' },
  { char: 'স্ট', name: 'স + ট' },
  { char: 'স্ত', name: 'স + ত' },
  { char: 'স্থ', name: 'স + থ' },
  { char: 'স্ন', name: 'স + ন' },
  { char: 'স্প', name: 'স + প' },
  { char: 'স্ফ', name: 'স + ফ' },
  { char: 'স্ব', name: 'স + ব' },
  { char: 'স্ম', name: 'স + ম' },
  { char: 'স্র', name: 'স + র' },
  { char: 'স্ল', name: 'স + ল' },
  { char: 'হ্ণ', name: 'হ + ণ' },
  { char: 'হ্ন', name: 'হ + ন' },
  { char: 'হ্ম', name: 'হ + ম' },
  { char: 'হ্ল', name: 'হ + ল' },
  { char: 'হ্র', name: 'হ + র' },
];

/** হসন্ত (্) ধারণকারী সব যুক্তাক্ষর ধরার regex-সহায়ক: হসন্ত আছে কি না */
function containsHasanta(word: string): boolean {
  // হসন্ত (U+09CD) যদি শব্দের শেষ ক্যারেক্টার না হয় এবং পরের ক্যারেক্টার ব্যঞ্জনধ্বনি হয়,
  // তাহলে সেটি যুক্তবর্ণ/যুক্তাক্ষর
  const re = /\u09CD[\u0995-\u09B9\u09CE\u09DC-\u09DF]/;
  return re.test(word);
}

/** কোনো শব্দে যুক্তবর্ণ/যুক্তাক্ষর আছে কি না */
export function hasConjunct(word: string): boolean {
  return CONJUNCTS.some((c) => word.includes(c.char)) || containsHasanta(word);
}

/** বাংলা শব্দ টোকেন করার regex */
const BANGLA_WORD_RE = /[\u0980-\u09FF]+|[A-Za-z]+/g;

/**
 * টেক্সট থেকে যুক্তবর্ণযুক্ত ইউনিক শব্দগুলো (বর্ণানুক্রমে) বের করে
 */
export function findConjunctWords(text: string): string[] {
  const words = text.match(BANGLA_WORD_RE) ?? [];
  const set = new Set<string>();
  for (const w of words) {
    if (hasConjunct(w)) set.add(w);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'bn'));
}

/** টেক্সটের মোট শব্দ সংখ্যা (বাংলা + ল্যাটিন) */
export function countWords(text: string): number {
  const words = text.match(BANGLA_WORD_RE) ?? [];
  return words.length;
}

/** অক্ষর সংখ্যা; includeSpaces=false হলে স্পেস-নিউলাইন বাদ */
export function countCharacters(text: string, includeSpaces = true): number {
  return includeSpaces ? text.length : text.replace(/\s/g, '').length;
}

/**
 * অদৃশ্য জঞ্জাল ক্যারেক্টার পরিষ্কার করে (U+FEFF, U+00AD, U+2060 ইত্যাদি)।
 * সতর্কতা: ZWJ (U+200D) ও ZWNJ (U+200C) বাংলা যুক্তবর্ণে বৈধ, এগুলো রাখা হয়।
 * একাধিক ধারাবাহিক স্পেস → একটি স্পেস।
 */
export function cleanBanglaText(s: string): string {
  return s
    .replace(/[\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064\u200B\u200E\u200F\u202A-\u202E]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/** বাংলা শব্দ যাচাইয়ের আগে স্বাভাবিকীকরণ (NFC) */
export function normalizeBanglaWord(s: string): string {
  try {
    return s.normalize('NFC');
  } catch {
    return s;
  }
}
