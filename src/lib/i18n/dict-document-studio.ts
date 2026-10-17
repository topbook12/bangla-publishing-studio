/**
 * ডকুমেন্ট স্টুডিও (Document Studio) — UI অভিধান
 * প্রশ্নপত্র/সাজেশনের পাশাপাশি ২৯ ধরনের প্রথাসিদ্ধ বাংলাদেশি ডকুমেন্ট-নকশা।
 */

export const dictDocumentStudio = {
  // ── Insert ট্যাবে এন্ট্রি ──
  'ds.entry': { bn: 'ডকুমেন্ট', hi: 'दस्तावेज़', en: 'Document' },
  'ds.entry.tip': {
    bn: 'ডকুমেন্ট স্টুডিও — সনদ, দরখাস্ত, দলিল, ইনভয়েস, রুটিন, পোস্টারসহ ২৯ ফরম্যাট',
    hi: 'दस्तावेज़ स्टूडियो — 29 प्रारूप',
    en: 'Document Studio — 29 ready formats: certificates, applications, deeds, invoices…',
  },

  // ── ডায়ালগ শিরোনাম ──
  'ds.title': { bn: 'ডকুমেন্ট স্টুডিও', hi: 'दस्तावेज़ स्टूडियो', en: 'Document Studio' },
  'ds.desc': {
    bn: 'প্রশ্নপত্র-সাজেশনের পাশাপাশি সনদ, দরখাস্ত, দলিল, অফিস-পত্র, ব্যবসা, শিক্ষা, অনুষ্ঠান, চিকিৎসা ও প্রচার — ৯ ক্যাটাগরিতে ২৯টি বাংলাদেশ-প্রথার প্রস্তুত নকশা। ফরম পূরণ করুন, প্রিভিউ দেখুন, পাতায় বসান।',
    hi: '29 प्रारूप — प्रमाणपत्र, आवेदन, दस्तावेज़, कार्यालय, व्यापार, शिक्षा, अनुष्ठान, चिकित्सा व प्रचार।',
    en: '29 ready-made Bangladesh-format documents across 9 categories — fill the form, preview, insert.',
  },

  // ── ধাপ ──
  'ds.step.pick': { bn: 'নকশা বাছাই', hi: 'डिज़ाइन चुनें', en: 'Pick design' },
  'ds.step.fill': { bn: 'তথ্য দিন', hi: 'जानकारी भरें', en: 'Fill details' },
  'ds.step.preview': { bn: 'প্রিভিউ ও বসানো', hi: 'प्रीव्यू व लगाना', en: 'Preview & insert' },

  // ── ক্যাটাগরি (fallback — DS_CATEGORY_LABELS আসল উৎস) ──
  'ds.cat.cert': { bn: 'সনদপত্র', hi: 'प्रमाणपत्र', en: 'Certificates' },
  'ds.cat.apply': { bn: 'হলফনামা ও দরখাস্ত', hi: 'शपथ व आवेदन', en: 'Affidavits & Applications' },
  'ds.cat.land': { bn: 'জমি-দলিল', hi: 'भूमि-दस्तावेज', en: 'Land Deeds' },
  'ds.cat.office': { bn: 'অফিস-প্রশাসন', hi: 'कार्यालय-प्रशासन', en: 'Office & Administration' },
  'ds.cat.biz': { bn: 'ব্যবসা', hi: 'व्यापार', en: 'Business' },
  'ds.cat.edu': { bn: 'শিক্ষা-প্রতিষ্ঠান', hi: 'शिक्षा-संस्था', en: 'Institutions' },
  'ds.cat.event': { bn: 'অনুষ্ঠান', hi: 'अनुष्ठान', en: 'Events' },
  'ds.cat.med': { bn: 'চিকিৎসা', hi: 'चिकित्सा', en: 'Medical' },
  'ds.cat.promo': { bn: 'প্রচার-মাধ্যম', hi: 'प्रचार-माध्यम', en: 'Promotion' },

  // ── ধাপ ১: বাছাই ──
  'ds.pick.search': { bn: 'নকশা খুঁজুন…', hi: 'डिज़ाइन खोजें…', en: 'Search designs…' },
  'ds.pick.count': { bn: '{n}টি নকশা', hi: '{n} डिज़ाइन', en: '{n} designs' },
  'ds.pick.all': { bn: 'সব ক্যাটাগরি', hi: 'सभी श्रेणियाँ', en: 'All categories' },
  'ds.pick.next': { bn: 'তথ্য দিন →', hi: 'जानकारी भरें →', en: 'Fill details →' },
  'ds.pick.tip': { bn: 'নকশায় ক্লিক করে চালু করুন', hi: 'डिज़ाइन पर क्लिक करें', en: 'Click a design to select' },

  // ── ধাপ ২: তথ্য ──
  'ds.fill.style': { bn: 'সাজ', hi: 'शैली', en: 'Style' },
  'ds.fill.styleTip': { bn: 'রং ও ধাঁচ — প্রিন্ট-প্রথা অনুযায়ী কালি-প্যালেট', hi: 'रंग व ढंग', en: 'Ink palette per print tradition' },
  'ds.fill.hintText': { bn: 'লিখুন…', hi: 'लिखें…', en: 'Type…' },
  'ds.fill.hintTable': { bn: 'প্রতি সারিতে একটি — ঘর আলাদা করতে |', hi: 'प्रति पंक्ति एक — कॉलम के लिए |', en: 'One per row — use | for columns' },
  'ds.fill.ai': { bn: 'AI দিয়ে পূরণ', hi: 'AI से भरें', en: 'AI fill' },
  'ds.fill.ai.tip': { bn: 'সংক্ষেপে বলুন কী দরকার — AI ফরমের ঘরগুলো পূরণ করে দেবে', hi: 'AI फॉर्म भरेगा', en: 'Describe briefly — AI fills the form' },
  'ds.fill.ai.ph': {
    bn: 'যেমন: করিম উদ্দিনের ছেলে রাকিব হাসানের স্থায়ী নিবাসী সনদ লাগবে, গ্রাম চরপাড়া…',
    hi: 'उदा.: राकिब हसन का स्थायी निवास प्रमाणपत्र…',
    en: 'e.g. Permanent residence certificate for Rakib Hasan…',
  },
  'ds.fill.ai.go': { bn: 'পূরণ করুন', hi: 'भरें', en: 'Fill' },
  'ds.fill.reset': { bn: 'তারিখ রিসেট', hi: 'तारीख रीसेट', en: 'Reset dates' },
  'ds.fill.back': { bn: '← নকশা বদল', hi: '← डिज़ाइन बदलें', en: '← Change design' },
  'ds.fill.preview': { bn: 'প্রিভিউ →', hi: 'प्रीव्यू →', en: 'Preview →' },
  'ds.toast.aiFilled': { bn: 'AI ফরম পূরণ করেছে — একবার দেখে নিন', hi: 'AI ने फॉर्म भर दिया', en: 'AI filled the form — please review' },
  'ds.err.aiFail': { bn: 'AI পূরণ করতে পারেনি — হাতে লিখে দিন', hi: 'AI भरने में विफल', en: 'AI fill failed — type manually' },
  'ds.toast.datesReset': { bn: 'তারিখ-ঘরগুলো আজকের তারিখে রিসেট হয়েছে', hi: 'तारीखें रीसेट', en: 'Date fields reset to today' },

  // ── ধাপ ৩: প্রিভিউ ──
  'ds.prev.insertNew': { bn: 'নতুন পাতায় বসান', hi: 'नए पृष्ठ पर लगाएँ', en: 'Insert as new page' },
  'ds.prev.insertHere': { bn: 'এই পাতায় বসান', hi: 'इस पृष्ठ पर लगाएँ', en: 'Put on this page' },
  'ds.prev.insertTip': { bn: 'শীটের একদম শেষে নতুন পাতা হিসেবে বসে — পেজিনেশন/প্রিন্ট সব চলে', hi: 'नए पृष्ठ के रूप में जोड़ा जाएगा', en: 'Added as a new page — full pagination/print support' },
  'ds.prev.replaceTip': { bn: 'বর্তমান পাতার সব লেখা মুছে এই নকশা বসবে', hi: 'वर्तमान पृष्ठ बदल जाएगा', en: 'Replaces the current page content' },
  'ds.prev.back': { bn: '← তথ্য বদল', hi: '← जानकारी बदलें', en: '← Edit details' },
  'ds.prev.pageHint': { bn: 'A4 প্রতিরূপ — আসল পাতায় হুবহু এমনই বসবে', hi: 'A4 प्रतिरूप', en: 'A4 replica — looks exactly like this on the page' },

  // ── টেমপ্লেট-স্টোরের "ডকুমেন্ট" ট্যাব ──
  'store.tab.doc': { bn: 'ডকুমেন্ট নকশা', hi: 'दस्तावेज़ डिज़ाइन', en: 'Document designs' },
  'store.doc.title': {
    bn: 'ডকুমেন্ট স্টুডিও — প্রথাসিদ্ধ ডকুমেন্ট-নকশা',
    hi: 'दस्तावेज़ स्टूडियो — प्रथासिद्ध डिज़ाइन',
    en: 'Document Studio — format-accurate designs',
  },
  'store.doc.desc': {
    bn: 'প্রশ্নপত্র-সাজেশনের পাশাপাশি সনদপত্র, দরখাস্ত, জমি-দলিল, অফিস-পত্র, ব্যবসা, শিক্ষা-প্রতিষ্ঠান, অনুষ্ঠান, চিকিৎসা ও প্রচার — ৯ ক্যাটাগরিতে ২৯টি বাংলাদেশ-প্রথার প্রস্তুত নকশা। ফরম পূরণ → AI সহায়তা → প্রিভিউ → পাতায় বসানো।',
    hi: 'प्रमाणपत्र, आवेदन, भूमि-दस्तावेज़, कार्यालय, व्यापार, शिक्षा, अनुष्ठान, चिकित्सा व प्रचार — 9 श्रेणियों में 29 तैयार डिज़ाइन।',
    en: 'Certificates, applications, land deeds, office letters, business, institutions, events, medical & promo — 29 ready designs in 9 categories. Fill form → AI assist → preview → insert.',
  },
  'store.doc.cta': { bn: 'ডকুমেন্ট স্টুডিও খুলুন', hi: 'दस्तावेज़ स्टूडियो खोलें', en: 'Open Document Studio' },

  // ── টোস্ট/নিশ্চয়তা ──
  'ds.toast.inserted': { bn: 'ডকুমেন্ট নতুন পাতায় বসেছে — কাগজ এবং সাজ এখনও বদলানো যায়', hi: 'दस्तावेज़ जोड़ा गया', en: 'Document inserted as a new page' },
  'ds.toast.replaced': { bn: 'এই পাতার লেখা বদলে ডকুমেন্ট বসেছে', hi: 'पृष्ठ बदल गया', en: 'Page replaced with the document' },
  'ds.confirm.replaceTitle': { bn: 'এই পাতার লেখা বদলান?', hi: 'पृष्ठ बदलें?', en: 'Replace this page?' },
  'ds.confirm.replaceBody': { bn: 'বর্তমান পাতার সব লেখা মুছে গিয়ে এই ডকুমেন্ট বসবে। আগের লেখা ফেরাতে চাইলে আগে স্ন্যাপশট নিন।', hi: 'वर्तमान सामग्री हट जाएगी।', en: 'Current content will be replaced. Take a snapshot first if needed.' },
  'ds.confirm.replaceGo': { bn: 'বদলে দিন', hi: 'बदलें', en: 'Replace' },
  'ds.confirm.replaceCancel': { bn: 'না, নতুন পাতায়', hi: 'नहीं, नया पृष्ठ', en: 'No, new page' },
  'ds.err.apply': { bn: 'বসানো যায়নি — আবার চেষ্টা করুন', hi: 'लगाने में विफल', en: 'Could not insert — please try again' },
};
