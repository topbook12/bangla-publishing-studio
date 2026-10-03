/**
 * অভিধান — design-tab (ডিজাইন ট্যাব: বুক থিম, হেডার/ফুটার, পৃষ্ঠা নম্বর, কভার ও সূচিপত্র)
 * কী-প্রিফিক্স: dsn.
 */

import type { Dict } from './core';

export const dictDesign: Dict = {
  // ─── রিবন গ্রুপ ───
  'dsn.group.themes': { bn: 'বইয়ের থিম', hi: 'पुस्तक थीम', en: 'Book Themes' },
  'dsn.group.hf': { bn: 'হেডার ও ফুটার', hi: 'हेडर और फुटर', en: 'Header & Footer' },
  'dsn.group.pagenum': { bn: 'পৃষ্ঠা নম্বর', hi: 'पृष्ठ संख्या', en: 'Page Numbers' },
  'dsn.group.covtoc': { bn: 'কভার ও সূচিপত্র', hi: 'कवर और विषय-सूची', en: 'Cover & TOC' },

  // ─── হেডার ও ফুটার ───
  'dsn.hf.master': { bn: 'হেডার-ফুটার মাস্টার', hi: 'हेडर-फुटर मास्टर', en: 'Header & Footer Master' },
  'dsn.hstyle.parallel': { bn: 'প্যারালাল (গ্লো)', hi: 'पैरेलल (ग्लो)', en: 'Parallel (Glow)' },
  'dsn.hstyle.royal': { bn: 'রয়্যাল ফ্লারিশ', hi: 'रॉयल फ्लोरिश', en: 'Royal Flourish' },
  'dsn.hstyle.academic': { bn: 'অ্যাকাডেমিক', hi: 'अकादमिक', en: 'Academic' },
  'dsn.hstyle.plain': { bn: 'সাদামাটা', hi: 'सादा', en: 'Plain' },
  'dsn.hstyle.none': { bn: 'নেই', hi: 'कोई नहीं', en: 'None' },
  'dsn.hstyle.parallelText': { bn: 'প্যারালাল টেক্সট (গ্লো)', hi: 'पैरेलल टेक्स्ट (ग्लो)', en: 'Parallel TEXT (Glow)' },
  'dsn.hstyle.royalClassic': { bn: 'ক্লাসিক রয়্যাল ফ্লারিশ', hi: 'क्लासिक रॉयल फ्लोरिश', en: 'Classic Royal Flourish' },
  'dsn.hstyle.academicMinimal': { bn: 'অ্যাকাডেমিক মিনিমাল', hi: 'अकादमिक मिनिमल', en: 'Academic Minimal' },
  'dsn.hstyle.headerOff': { bn: 'হেডার বন্ধ', hi: 'हेडर बंद', en: 'Header Off' },

  // ─── পৃষ্ঠা নম্বর ───
  'dsn.pn.on': { bn: '✓ নম্বর চালু', hi: '✓ संख्या चालू', en: '✓ Numbers On' },
  'dsn.pn.off': { bn: 'নম্বর বন্ধ', hi: 'संख्या बंद', en: 'Numbers Off' },

  // ফরম্যাট নির্বাচকের বন্ধ অবস্থার নমুনা — প্রকৃত আউটপুট গ্লিফ, সব ভাষায় এক
  'dsn.pnfmt.sample.bangla': { bn: '১, ২, ৩…', hi: '১, ২, ৩…', en: '১, ২, ৩…' },
  'dsn.pnfmt.sample.hindi': { bn: '०, १, २…', hi: '०, १, २…', en: '०, १, २…' },
  'dsn.pnfmt.sample.english': { bn: '1, 2, 3…', hi: '1, 2, 3…', en: '1, 2, 3…' },
  'dsn.pnfmt.sample.roman': { bn: 'I, II, III…', hi: 'I, II, III…', en: 'I, II, III…' },

  // মেনু লেবেল — সংখ্যা-নমুনা চলতি ভাষার সংখ্যায় (bn 'হিন্দি (০১২৩)' স্পেক অনুযায়ী)
  'dsn.pnfmt.bangla': { bn: 'বাংলা (১, ২, ৩)', hi: 'बांग्ला (१, २, ३)', en: 'Bengali (১, ২, ৩)' },
  'dsn.pnfmt.hindi': { bn: 'হিন্দি (০১২৩)', hi: 'हिन्दी (०१२३)', en: 'Hindi (०१२३)' },
  'dsn.pnfmt.english': { bn: 'ইংরেজি (১, ২, ৩)', hi: 'अंग्रेज़ी (१, २, ३)', en: 'English (1, 2, 3)' },
  'dsn.pnfmt.roman': { bn: 'রোমান (I, II, III)', hi: 'रोमन (I, II, III)', en: 'Roman (I, II, III)' },

  // অবস্থান
  'dsn.pos.fallback': { bn: 'অবস্থান', hi: 'स्थिति', en: 'Position' },
  'dsn.pos.bottom-center': { bn: 'নিচে মাঝে', hi: 'नीचे केंद्र', en: 'Bottom Center' },
  'dsn.pos.bottom-right': { bn: 'নিচে ডানে', hi: 'नीचे दाएँ', en: 'Bottom Right' },
  'dsn.pos.bottom-left': { bn: 'নিচে বামে', hi: 'नीचे बाएँ', en: 'Bottom Left' },
  'dsn.pos.top-center': { bn: 'ওপরে মাঝে', hi: 'ऊपर केंद्र', en: 'Top Center' },
  'dsn.pos.top-right': { bn: 'ওপরে ডানে', hi: 'ऊपर दाएँ', en: 'Top Right' },
  'dsn.pos.top-left': { bn: 'ওপরে বামে', hi: 'ऊपर बाएँ', en: 'Top Left' },

  // টগল
  'dsn.pn.firstPage': { bn: 'প্রথম পাতা ভিন্ন', hi: 'पहला पृष्ठ अलग', en: 'Different First Page' },
  'dsn.pn.firstPageTip': { bn: 'প্রথম (কভার) পাতায় হেডার ও ফুটার লুকান', hi: 'पहले (कवर) पृष्ठ पर हेडर और फुटर छिपाएँ', en: 'Hide header & footer on the first (cover) page' },
  'dsn.pn.oddEven': { bn: 'অজর/জোড় পাতা', hi: 'विषम/सम पृष्ठ', en: 'Odd/Even Pages' },
  'dsn.pn.oddEvenTip': { bn: 'বইয়ের মতো অজর/জোড় পাতায় বিপরীত অ্যালাইনমেন্ট', hi: 'किताब की तरह विषम/सम पृष्ठों पर दर्पण संरेखण', en: 'Mirror alignment on odd/even pages, like a book' },

  // ─── কভার ও সূচিপত্র ───
  'dsn.btn.cover': { bn: 'কভার পাতা', hi: 'कवर पृष्ठ', en: 'Cover Page' },
  'dsn.btn.templates': { bn: 'পাতার টেমপ্লেট', hi: 'पृष्ठ टेम्पलेट', en: 'Page Templates' },
  'dsn.btn.templatesTip': { bn: 'সূচিপত্র, শিরোনাম পাতা, লেখকের পরিচিতি ইত্যাদি ডিজাইন-রেডি পাতা', hi: 'सूचीपत्र, शीर्षक पृष्ठ, लेखक परिचय आदि डिज़ाइन-तैयार पृष्ठ', en: 'TOC, title page, author bio and other design-ready pages' },
  'dsn.btn.updateToc': { bn: 'সূচিপত্র হালনাগাদ করুন', hi: 'विषय-सूची अद्यतन करें', en: 'Update Table of Contents' },
  'dsn.btn.borderColor': { bn: 'বর্ডারের রং', hi: 'बॉर्डर रंग', en: 'Border Color' },
  'dsn.prompt.borderColor': { bn: 'পাতার বর্ডারের রং (hex, যেমন #7f1d1d):', hi: 'पृष्ठ बॉर्डर रंग (hex, जैसे #7f1d1d):', en: 'Page border color (hex, e.g. #7f1d1d):' },
  'dsn.toc.title': { bn: 'সূচিপত্র', hi: 'विषय-सूची', en: 'Table of Contents' },

  // ─── টোস্ট ───
  'dsn.toast.noeditor': { bn: 'কোনো পাতার এডিটর খোলা নেই', hi: 'कोई पृष्ठ एडिटर खुला नहीं है', en: 'No page editor is open' },
  'dsn.toast.noheadings': { bn: 'কোনো শিরোনাম পাওয়া যায়নি — ডকুমেন্টে H1/H2/H3 ব্যবহার করুন', hi: 'कोई शीर्षक नहीं मिला — दस्तावेज़ में H1/H2/H3 का उपयोग करें', en: 'No headings found — use H1/H2/H3 in your document' },
  'dsn.toast.tocUpdated': { bn: 'সূচিপত্র হালনাগাদ হয়েছে — {n}টি শিরোনাম', hi: 'विषय-सूची अद्यतित हो गई — {n} शीर्षक', en: 'Table of contents updated with {n} headings' },
  'dsn.toast.themeApplied': { bn: '“{name}” থিম প্রয়োগ করা হয়েছে', hi: '“{name}” थीम लागू हो गई', en: 'Theme "{name}" applied' },
};
