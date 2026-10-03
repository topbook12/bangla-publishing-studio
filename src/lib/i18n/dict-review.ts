/**
 * অভিধান — রিভিউ ট্যাব (review-tab.tsx)
 * কী-প্রিফিক্স: rev.
 */

import type { Dict } from './core';

export const dictReview: Dict = {
  // ─── গ্রুপ লেবেল ───
  'rev.group.stats': { bn: 'পরিসংখ্যান', hi: 'आंकड़े', en: 'Statistics' },
  'rev.group.proofing': { bn: 'বানান ও প্রুফিং', hi: 'वर्तनी और प्रूफिंग', en: 'Spelling & Proofing' },
  'rev.group.conjunct': { bn: 'যুক্তাক্ষর টুলকিট', hi: 'संयुक्ताक्षर टूलकिट', en: 'Conjunct Toolkit' },
  'rev.group.settings': { bn: 'সেটিংস', hi: 'सेटिंग्स', en: 'Settings' },
  'rev.group.readaloud': { bn: 'পড়ে শোনান', hi: 'पढ़कर सुनाएँ', en: 'Read Aloud' },

  // ─── পরিসংখ্যান চিপ ───
  'rev.words': { bn: '{n} শব্দ', hi: '{n} शब्द', en: '{n} Words' },
  'rev.chars': { bn: '{n} অক্ষর', hi: '{n} अक्षर', en: '{n} Characters' },
  'rev.pages': { bn: '{n} পৃষ্ঠা', hi: '{n} पृष्ठ', en: '{n} Pages' },

  // ─── বানান ও প্রুফিং ───
  'rev.spelling': { bn: 'বানান', hi: 'वर्तनी', en: 'Spelling' },
  'rev.findReplace': { bn: 'খোঁজ ও প্রতিস্থাপন', hi: 'खोजें और बदलें', en: 'Find & Replace' },
  'rev.findReplaceTip': { bn: 'সম্পূর্ণ বই জুড়ে খোঁজ ও প্রতিস্থাপন (Ctrl+F)', hi: 'पूरी पुस्तक में खोजें और बदलें (Ctrl+F)', en: 'Find & replace across the whole book (Ctrl+F)' },

  // ─── যুক্তাক্ষর প্যালেট ───
  'rev.conjuncts': { bn: 'যুক্তাক্ষর', hi: 'संयुक्ताक्षर', en: 'Conjuncts' },
  'rev.conjunctPalette': { bn: 'যুক্তাক্ষর প্যালেট', hi: 'संयुक्ताक्षर पैलेट', en: 'Conjunct Palette' },
  'rev.searchPh': { bn: 'খুঁজুন… (যেমন ক্ষ)', hi: 'खोजें… (जैसे क्ष)', en: 'Search… (e.g. ক্ষ)' },
  'rev.conjunctTotal': { bn: 'কার্সরের জায়গায় বসবে • মোট {n}', hi: 'कर्सर की जगह पर डाला जाएगा • कुल {n}', en: 'Inserted at the cursor • {n} total' },

  // ─── যুক্তাক্ষর শব্দ খোঁজা ───
  'rev.conjunctWords': { bn: 'যুক্তাক্ষর শব্দ', hi: 'संयुक्ताक्षर शब्द', en: 'Conjunct Words' },
  'rev.conjunctWordsTip': { bn: 'ডকুমেন্টের মধ্যেকার যুক্তাক্ষর শব্দ', hi: 'दस्तावेज़ में मौजूद संयुक्ताक्षर शब्द', en: 'Conjunct words in the document' },
  'rev.conjunctWordsCount': { bn: 'যুক্তাক্ষর শব্দ ({n})', hi: 'संयुक्ताक्षर शब्द ({n})', en: 'Conjunct Words ({n})' },
  'rev.noConjuncts': { bn: 'এখনও কোনো যুক্তাক্ষর শব্দ পাওয়া যায়নি।', hi: 'अभी कोई संयुक्ताक्षर शब्द नहीं मिला।', en: 'No conjunct words found yet.' },
  'rev.conjunctHint': { bn: 'যুক্তাক্ষরের বানান প্রুফ করতে কাজে লাগে।', hi: 'संयुक्ताक्षर की वर्तनी प्रूफ़ करने में उपयोगी।', en: 'Handy for proofreading conjunct spellings.' },

  // ─── সেটিংস ───
  'rev.autoflow': { bn: 'অটো-ফ্লো', hi: 'ऑटो-फ़्लो', en: 'Auto-flow' },
  'rev.autoflow.on': { bn: 'অটো-ফ্লো চালু — পাতা ভরে গেলে লেখা পরের পাতায় চলে যাবে', hi: 'ऑटो-फ़्लो चालू — पृष्ठ भर जाने पर लेख अगले पृष्ठ पर बह जाएगा', en: 'Auto-flow on — text flows to the next page when one fills up' },
  'rev.autoflow.off': { bn: 'অটো-ফ্লো বন্ধ', hi: 'ऑटो-फ़्लो बंद', en: 'Auto-flow off' },

  // ─── পড়ে শোনান ───
  'rev.ra.label': { bn: 'পড়ে শোনান', hi: 'पढ़कर सुनाएँ', en: 'Read Aloud' },
  'rev.ra.resume': { bn: 'আবার পড়া শুরু করুন', hi: 'फिर से पढ़ना शुरू करें', en: 'Resume reading' },
  'rev.ra.pause': { bn: 'থামিয়ে রাখুন (Pause)', hi: 'रोककर रखें (Pause)', en: 'Pause' },
  'rev.ra.tip': { bn: 'সিলেকশন বা পুরো পাতা পড়ে শোনান', hi: 'चयन या पूरा पृष्ठ पढ़कर सुनाएँ', en: 'Read the selection or the whole page aloud' },
  'rev.ra.stop': { bn: 'থামুন', hi: 'रोकें', en: 'Stop' },
  'rev.ra.stopTip': { bn: 'পড়া বন্ধ করুন', hi: 'पढ़ना बंद करें', en: 'Stop reading' },
  'rev.ra.speedTip': { bn: 'পড়ার গতি (Speed)', hi: 'पढ़ने की गति (Speed)', en: 'Reading speed' },
  'rev.ra.unsupported': { bn: 'এই ব্রাউজারে পড়া সুবিধা নেই', hi: 'इस ब्राउज़र में पढ़कर सुनाने की सुविधा नहीं है', en: 'Read-aloud is not supported in this browser' },
  'rev.ra.empty': { bn: 'পড়ার মতো লেখা নেই', hi: 'पढ़ने को कुछ नहीं है', en: 'No text to read aloud' },
};
