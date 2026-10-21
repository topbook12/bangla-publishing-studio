/**
 * ডকুমেন্ট স্টুডিও (Document Studio) — UI অভিধান
 * প্রশ্নপত্র/সাজেশনের পাশাপাশি ৫২ ধরনের বিশ্বমানের ডকুমেন্ট-নকশা
 * (৯ বৈশ্বিক ক্যাটাগরি + বাংলাদেশ-ভারত আঞ্চলিক সংগ্রহ)।
 */

export const dictDocumentStudio = {
  // ── Insert ট্যাবে এন্ট্রি ──
  'ds.entry': { bn: 'ডকুমেন্ট', hi: 'दस्तावेज़', en: 'Document' },
  'ds.entry.tip': {
    bn: 'ডকুমেন্ট স্টুডিও — রেজিউমে, চিঠি, ইনভয়েস, চুক্তি, সনদ, রুটিন, পোস্টারসহ ৫২ ফরম্যাট',
    hi: 'दस्तावेज़ स्टूडियो — 52 प्रारूप',
    en: 'Document Studio — 52 ready formats: resumes, letters, invoices, contracts, certificates…',
  },

  // ── ডায়ালগ শিরোনাম ──
  'ds.title': { bn: 'ডকুমেন্ট স্টুডিও', hi: 'दस्तावेज़ स्टूडियो', en: 'Document Studio' },
  'ds.desc': {
    bn: 'রেজিউমে-ক্যারিয়ার, ব্যবসা-অফিস, ইনভয়েস, আইনি-চুক্তি, সনদ-পুরস্কার, শিক্ষা, অনুষ্ঠান, চিকিৎসা ও মার্কেটিং — ৯ বৈশ্বিক ক্যাটাগরি + বাংলাদেশ-ভারত আঞ্চলিক সংগ্রহ, মোট ৫২টি প্রস্তুত নকশা। ফরম পূরণ করুন, প্রিভিউ দেখুন, পাতায় বসান।',
    hi: '52 प्रारूप — रिज़्यूमे, कार्यालय, इनवॉइस, अनुबंध, प्रमाणपत्र, शिक्षा, अनुष्ठान, चिकित्सा, मार्केटिंग + क्षेत्रीय संग्रह।',
    en: '52 ready-made professional documents across 9 global categories + a Bangladesh & India regional collection — fill the form, preview, insert.',
  },

  // ── ধাপ ──
  'ds.step.pick': { bn: 'নকশা বাছাই', hi: 'डिज़ाइन चुनें', en: 'Pick design' },
  'ds.step.fill': { bn: 'তথ্য দিন', hi: 'जानकारी भरें', en: 'Fill details' },
  'ds.step.preview': { bn: 'প্রিভিউ ও বসানো', hi: 'प्रीव्यू व लगाना', en: 'Preview & insert' },

  // ── ক্যাটাগরি (fallback — DS_CATEGORY_LABELS আসল উৎস) ──
  'ds.cat.career': { bn: 'চাকরি ও ক্যারিয়ার', hi: 'करियर', en: 'Resume & Career' },
  'ds.cat.office': { bn: 'ব্যবসা ও অফিস', hi: 'व्यापार व कार्यालय', en: 'Business & Office' },
  'ds.cat.finance': { bn: 'ইনভয়েস ও আর্থিক', hi: 'इनवॉइस व वित्त', en: 'Invoices & Finance' },
  'ds.cat.legal': { bn: 'আইনি ও চুক্তি', hi: 'कानूनी व अनुबंध', en: 'Legal & Contracts' },
  'ds.cat.cert': { bn: 'সনদ ও পুরস্কার', hi: 'प्रमाणपत्र व पुरस्कार', en: 'Certificates & Awards' },
  'ds.cat.edu': { bn: 'শিক্ষা ও একাডেমিক', hi: 'शिक्षा', en: 'Education & Academic' },
  'ds.cat.event': { bn: 'অনুষ্ঠান ও আমন্ত্রণ', hi: 'अनुष्ठान व निमंत्रण', en: 'Events & Invitations' },
  'ds.cat.med': { bn: 'চিকিৎসা ও স্বাস্থ্য', hi: 'चिकित्सा व स्वास्थ्य', en: 'Health & Medical' },
  'ds.cat.promo': { bn: 'মার্কেটিং ও প্রচার', hi: 'मार्केटिंग', en: 'Marketing & Media' },
  'ds.cat.regional': { bn: 'বাংলাদেশ ও ভারত', hi: 'बांग्लাদेश व भारत', en: 'Bangladesh & India' },

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
    bn: 'ডকুমেন্ট স্টুডিও — বিশ্বমানের ডকুমেন্ট-নকশা',
    hi: 'दस्तावेज़ स्टूडियो — पेशेवर डिज़ाइन',
    en: 'Document Studio — professional document designs',
  },
  'store.doc.desc': {
    bn: 'রেজিউমে-ক্যারিয়ার, ব্যবসা-অফিস, ইনভয়েস-আর্থিক, আইনি-চুক্তি, সনদ-পুরস্কার, শিক্ষা, অনুষ্ঠান, চিকিৎসা ও মার্কেটিং — ৯ বৈশ্বিক ক্যাটাগরি + বাংলাদেশ-ভারত আঞ্চলিক সংগ্রহ, মোট ৫২টি প্রস্তুত নকশা। ফরম পূরণ → AI সহায়তা → প্রিভিউ → পাতায় বসানো।',
    hi: 'रिज़्यूमे, कार्यालय, इनवॉइस, अनुबंध, प्रमाणपत्र, शिक्षा, अनुष्ठान, चिकित्सा, मार्केटिंग — 9 वैश्विक श्रेणियाँ + क्षेत्रीय संग्रह, कुल 52 डिज़ाइन।',
    en: 'Resume & career, business & office, invoices, legal & contracts, certificates, education, events, medical & marketing — 9 global categories + a Bangladesh & India regional collection, 52 ready designs. Fill form → AI assist → preview → insert.',
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
