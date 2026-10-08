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
  'dsn.group.ink': { bn: 'এক রঙের বই', hi: 'एक रंग की किताब', en: 'Single-Ink Book' },

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
  'dsn.btn.templates': { bn: 'টেমপ্লেট স্টোর', hi: 'टेम्पलेट स्टोर', en: 'Template Store' },
  'dsn.btn.templatesTip': { bn: 'সম্পূর্ণ বই-ডিজাইন (উপন্যাস, পাঠ্যবই, কবিতা…) ও প্রো পাতার টেমপ্লেট — সব এডিটেবল', hi: 'पूर्ण पुस्तक-डिज़ाइन (उपन्यास, पाठ्यपुस्तक, कविता…) और प्रो पृष्ठ टेम्पलेट — सब संपादनीय', en: 'Complete book designs (novel, textbook, poetry…) and pro page templates — all editable' },
  'dsn.btn.updateToc': { bn: 'সূচিপত্র হালনাগাদ করুন', hi: 'विषय-सूची अद्यतन करें', en: 'Update Table of Contents' },
  'dsn.btn.borderColor': { bn: 'বর্ডারের রং', hi: 'बॉर्डर रंग', en: 'Border Color' },
  'dsn.prompt.borderColor': { bn: 'পাতার বর্ডারের রং (hex, যেমন #7f1d1d):', hi: 'पृष्ठ बॉर्डर रंग (hex, जैसे #7f1d1d):', en: 'Page border color (hex, e.g. #7f1d1d):' },
  'dsn.toc.title': { bn: 'সূচিপত্র', hi: 'विषय-सूची', en: 'Table of Contents' },

  // ─── এক-রঙের বই (Single-Ink) ───
  'dsn.ink.title': { bn: 'এক রঙের বই', hi: 'एक रंग की किताब', en: 'Single-Ink Book' },
  'dsn.ink.desc': { bn: 'একটি কালি বেছে নিন — পুরো বইয়ের শিরোনাম, বর্ডার, বক্স ও অলংকরণ ওই কালির ছায়ায় নামবে (এক রঙে ছাপার মতো)।', hi: 'एक स्याही चुनें — पूरी किताब के शीर्षक, बॉर्डर, बॉक्स और अलंकरण उसी स्याही की छाया में आ जाएँगे (एक रंग में छपाई जैसा)।', en: 'Pick one ink — every heading, border, box and ornament in the book shifts to shades of it (like single-colour printing).' },
  'dsn.ink.pickHint': { bn: 'কালি বাছুন — প্রয়োগের আগে নিশ্চিত করতে বলা হবে', hi: 'स्याही चुनें — लागू करने से पहले पुष्टि माँगी जाएगी', en: 'Pick an ink — you will be asked to confirm first' },
  'dsn.ink.active': { bn: 'চালু', hi: 'सक्रिय', en: 'Active' },
  'dsn.ink.restore': { bn: 'আসল রঙে ফেরুন — স্ন্যাপশট পুনরুদ্ধার', hi: 'मूल रंग में लौटें — स्नैपशॉट पुनर्स्थापन', en: 'Back to original colours — restore a snapshot' },
  'dsn.ink.confirmTitle': { bn: 'পুরো বই কি এক রঙে রূপান্তর করবেন?', hi: 'पूरी किताब एक रंग में बदलें?', en: 'Convert the whole book to one colour?' },
  'dsn.ink.confirmDesc': { bn: 'সব পাতার রং নির্বাচিত কালির ছায়ায় নামবে। প্রয়োগের আগে স্বয়ংক্রিয় স্ন্যাপশট নেওয়া হবে — স্ন্যাপশট তালিকা থেকে যেকোনো সময় আসল রঙে ফেরা যাবে।', hi: 'सभी पृष्ठों के रंग चुनी गई स्याही की छाया में आ जाएँगे। लागू करने से पहले स्वतः स्नैपशॉट लिया जाएगा — स्नैपशॉट सूची से कभी भी मूल रंग लौटाया जा सकता है।', en: 'Colours on every page shift to shades of the chosen ink. An automatic snapshot is taken first — you can restore the original colours any time from the snapshot list.' },
  'dsn.ink.confirmYes': { bn: 'হ্যাঁ, এক রঙে করুন', hi: 'हाँ, एक रंग में करें', en: 'Yes, make it single-ink' },
  'dsn.ink.toastDone': { bn: 'বইটি এক রঙে রূপান্তরিত — {n}টি পাতা হালনাগাদ হয়েছে', hi: 'किताब एक रंग में बदल गई — {n} पृष्ठ अपडेट हुए', en: 'Book converted to single ink — {n} pages updated' },
  'dsn.ink.toastSnapshot': { bn: 'আসল রঙের স্ন্যাপশট সংরক্ষিত — স্ন্যাপশট ডায়ালগ থেকে ফেরানো যাবে', hi: 'मूल रंगों का स्नैपशॉट सहेजा गया — स्नैपशॉट डायलॉग से लौटाएँ', en: 'A snapshot of the original colours was saved — restore it any time from the snapshots dialog' },
  'dsn.ink.toastFail': { bn: 'রূপান্তর করা যায়নি — আবার চেষ্টা করুন', hi: 'रूपांतरण नहीं हो सका — फिर कोशिश करें', en: 'Conversion failed — please try again' },

  // কালির প্যালেট
  'dsn.ink.black': { bn: 'কালো কালি', hi: 'काली स्याही', en: 'Black ink' },
  'dsn.ink.sepia': { bn: 'সেপিয়া বাদামি', hi: 'सेपिया भूरा', en: 'Sepia brown' },
  'dsn.ink.maroon': { bn: 'মেরুন', hi: 'मैरून', en: 'Maroon' },
  'dsn.ink.teal': { bn: 'টিল', hi: 'टील', en: 'Teal' },
  'dsn.ink.forest': { bn: 'গাঢ় সবুজ', hi: 'गहरा हरा', en: 'Forest green' },
  'dsn.ink.plum': { bn: 'প্লাম', hi: 'प्लम', en: 'Plum' },
  'dsn.ink.rust': { bn: 'মাটি-লাল', hi: 'मिट्टी-लाल', en: 'Rust' },
  'dsn.ink.navy': { bn: 'নেভি', hi: 'नेवी', en: 'Navy' },
  'dsn.ink.olive': { bn: 'জলপাই', hi: 'जैतून', en: 'Olive' },
  'dsn.ink.slate': { bn: 'ছাই-ধূসর', hi: 'स्लेट-धूसर', en: 'Slate grey' },

  // ─── টোস্ট ───
  'dsn.toast.noeditor': { bn: 'কোনো পাতার এডিটর খোলা নেই', hi: 'कोई पृष्ठ एडिटर खुला नहीं है', en: 'No page editor is open' },
  'dsn.toast.noheadings': { bn: 'কোনো শিরোনাম পাওয়া যায়নি — ডকুমেন্টে H1/H2/H3 ব্যবহার করুন', hi: 'कोई शीर्षक नहीं मिला — दस्तावेज़ में H1/H2/H3 का उपयोग करें', en: 'No headings found — use H1/H2/H3 in your document' },
  'dsn.toast.tocUpdated': { bn: 'সূচিপত্র হালনাগাদ হয়েছে — {n}টি শিরোনাম', hi: 'विषय-सूची अद्यतित हो गई — {n} शीर्षक', en: 'Table of contents updated with {n} headings' },
  'dsn.toast.themeApplied': { bn: '“{name}” থিম প্রয়োগ করা হয়েছে', hi: '“{name}” थीम लागू हो गई', en: 'Theme "{name}" applied' },
};
