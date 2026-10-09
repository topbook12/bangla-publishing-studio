/**
 * অভিধান — layout-tab (পাতার মাপ, মার্জিন, কাগজ ও বর্ডার, পানির ছাপ, কনটেন্ট ফ্লো, ডিফল্ট টাইপোগ্রাফি)
 * কী-প্রিফিক্স: lay.
 */

import type { Dict } from './core';

export const dictLayout: Dict = {
  // ─── রিবন গ্রুপ ───
  'lay.group.paper': { bn: 'কাগজের মাপ', hi: 'कागज़ आकार', en: 'Paper Size' },
  'lay.group.margins': { bn: 'মার্জিন (ইঞ্চি)', hi: 'मार्जिन (इंच)', en: 'Margins (in)' },
  'lay.group.paperBorder': { bn: 'কাগজ ও বর্ডার', hi: 'कागज़ और बॉर्डर', en: 'Paper & Border' },
  'lay.group.watermark': { bn: 'পানির ছাপ', hi: 'वॉटरमार्क', en: 'Watermark' },
  'lay.group.flow': { bn: 'কনটেন্ট ফ্লো', hi: 'कंटेंट फ़्लो', en: 'Content Flow' },
  'lay.group.typo': { bn: 'ডিফল্ট টাইপোগ্রাফি', hi: 'डिफ़ॉल्ट टाइपोग्राफ़ी', en: 'Default Typography' },

  // ─── কাগজের মাপ ───
  'lay.orient.portrait': { bn: 'পোর্ট্রেট', hi: 'पोर्ट्रेट', en: 'Portrait' },
  'lay.orient.landscape': { bn: 'ল্যান্ডস্কেপ', hi: 'लैंडस्केप', en: 'Landscape' },
  'lay.paper.width': { bn: 'প্রস্থ (মিমি)', hi: 'चौड़ाई (मिमी)', en: 'Width (mm)' },
  'lay.paper.height': { bn: 'উচ্চতা (মিমি)', hi: 'ऊँचाई (मिमी)', en: 'Height (mm)' },
  'lay.mm': { bn: 'মিমি', hi: 'मिमी', en: 'mm' },

  // ─── মার্জিন ───
  'lay.margins.preset': { bn: 'প্রিসেট মার্জিন', hi: 'प्रीसेट मार्जिन', en: 'Preset Margins' },
  'lay.margin.top': { bn: 'উপর', hi: 'ऊपर', en: 'Top' },
  'lay.margin.bottom': { bn: 'নিচ', hi: 'नीचे', en: 'Bottom' },
  'lay.margin.left': { bn: 'বাম', hi: 'बाएँ', en: 'Left' },
  'lay.margin.right': { bn: 'ডান', hi: 'दाएँ', en: 'Right' },
  'lay.margin.gutter': { bn: 'গাটার', hi: 'गटर', en: 'Gutter' },

  // ─── কাগজের রং ───
  'lay.color.white': { bn: 'সাদা', hi: 'सफ़ेद', en: 'White' },
  'lay.color.cream': { bn: 'ক্রিম (বইয়ের কাগজ)', hi: 'क्रीम (पुस्तक कागज़)', en: 'Cream (Book Paper)' },
  'lay.color.dark': { bn: 'ডার্ক মোড', hi: 'डार्क मोड', en: 'Dark Mode' },

  // ─── পাতার বর্ডার ───
  'lay.border.label': { bn: 'পাতার বর্ডার:', hi: 'पृष्ठ बॉर्डर:', en: 'Page Border:' },
  'lay.border.none': { bn: 'নেই', hi: 'कोई नहीं', en: 'None' },
  'lay.border.thin': { bn: 'সরু', hi: 'पतला', en: 'Thin' },
  'lay.border.double': { bn: 'ডাবল', hi: 'डबल', en: 'Double' },
  'lay.border.ornamental': { bn: 'অলংকৃত', hi: 'अलंकृत', en: 'Ornamental' },
  'lay.border.thinline': { bn: 'সরু রেখা', hi: 'पतली रेखा', en: 'Thin Line' },
  'lay.border.doublebook': { bn: 'ডাবল রেখা (বই)', hi: 'डबल रेखा (पुस्तक)', en: 'Double Line (Book)' },
  'lay.border.ornframe': { bn: 'অলংকৃত ফ্রেম', hi: 'अलंकृत फ़्रेम', en: 'Ornamental Frame' },
  'lay.border.styleTip': { bn: 'বর্ডার রেখার ধাঁচ', hi: 'बॉर्डर रेखा की शैली', en: 'Border line style' },
  'lay.border.stylePrefix': { bn: 'ধাঁচ:', hi: 'शैली:', en: 'Style:' },
  'lay.border.widthTip': { bn: 'বর্ডার রেখার প্রস্থ', hi: 'बॉर्डर रेखा की चौड़ाई', en: 'Border line width' },
  'lay.border.widthPrefix': { bn: 'প্রস্থ:', hi: 'चौड़ाई:', en: 'Width:' },
  'lay.bstyle.solid': { bn: 'অবিচ্ছিন্ন', hi: 'ठोस', en: 'Solid' },
  'lay.bstyle.double': { bn: 'ডাবল', hi: 'डबल', en: 'Double' },
  'lay.bstyle.dashed': { bn: 'ড্যাশড', hi: 'डैश्ड', en: 'Dashed' },
  'lay.bwidth.thin': { bn: 'সরু', hi: 'पतला', en: 'Thin' },
  'lay.bwidth.medium': { bn: 'মাঝারি', hi: 'मध्यम', en: 'Medium' },
  'lay.bwidth.thick': { bn: 'মোটা', hi: 'मोटा', en: 'Thick' },
  'lay.line.color': { bn: 'রেখার রং', hi: 'रेखा का रंग', en: 'Line Color' },
  'lay.line.colorAria': { bn: 'বর্ডার রেখার রং {name}', hi: 'बॉर्डर रेखा रंग {name}', en: 'Border line color {name}' },

  // ─── বর্ডার লাইনের রং ───
  'lay.lcolor.black': { bn: 'কালো', hi: 'काला', en: 'Black' },
  'lay.lcolor.slate': { bn: 'স্লেট', hi: 'स्लेट', en: 'Slate' },
  'lay.lcolor.maroon': { bn: 'মেরুন', hi: 'मैरून', en: 'Maroon' },
  'lay.lcolor.indigo': { bn: 'ইন্ডিগো', hi: 'इंडिगो', en: 'Indigo' },
  'lay.lcolor.emerald': { bn: 'এমারেল্ড', hi: 'एमराल्ड', en: 'Emerald' },
  'lay.lcolor.amber': { bn: 'অ্যাম্বার', hi: 'एम्बर', en: 'Amber' },
  'lay.lcolor.rose': { bn: 'রোজ', hi: 'रोज़', en: 'Rose' },
  'lay.lcolor.gold': { bn: 'সোনালি', hi: 'सुनहरा', en: 'Gold' },

  // ─── কাস্টম রং ───
  'lay.color.custom': { bn: 'কাস্টম রং', hi: 'कस्टम रंग', en: 'Custom color' },
  'lay.color.customBorderAria': { bn: 'কাস্টম বর্ডার রং', hi: 'कस्टम बॉर्डर रंग', en: 'Custom border color' },
  'lay.wm.customWmAria': { bn: 'কাস্টম পানির ছাপের রং', hi: 'कस्टम वॉटरमार्क रंग', en: 'Custom watermark color' },

  // ─── পানির ছাপ ───
  'lay.wm.label': { bn: 'পানির ছাপ', hi: 'वॉटरमार्क', en: 'Watermark' },
  'lay.wm.tip': { bn: 'প্রতিটি পাতায় হালকা ঘূর্ণিত পানির ছাপ — প্রিন্ট ও ফরমার খসড়া কপিতেও ছাপা হয়', hi: 'प्रत्येक पृष्ठ पर हल्का घूर्णित वॉटरमार्क — प्रिंट और फ़रमा ड्राफ़्ट कॉपी में भी छपता है', en: 'Light rotated watermark on every page — printed on press printouts and Farma draft copies too' },
  'lay.wm.preset': { bn: 'পানির ছাপের প্রিসেট', hi: 'वॉटरमार्क प्रीसेट', en: 'Watermark preset' },
  'lay.wm.presetShort': { bn: 'প্রিসেট', hi: 'प्रीसेट', en: 'Preset' },
  'lay.wm.p1.label': { bn: 'খসড়া (Draft)', hi: 'ड्राफ़्ट', en: 'Draft' },
  'lay.wm.p1.note': { bn: 'লেখা চলাকালীন প্রিন্ট-প্রুফ শনাক্ত করতে', hi: 'लेखन के दौरान प्रिंट-प्रूफ़ पहचानने के लिए', en: 'Identify print proofs while writing' },
  'lay.wm.p2.label': { bn: 'নমুনা (Sample)', hi: 'नमूना', en: 'Sample' },
  'lay.wm.p2.note': { bn: 'রিভিউ/প্রুফ কপির জন্য', hi: 'समीक्षा/प्रूफ़ कॉपी के लिए', en: 'For review/proof copies' },
  'lay.wm.p3.label': { bn: 'গোপনীয় (Confidential)', hi: 'गोपनीय', en: 'Confidential' },
  'lay.wm.p3.note': { bn: 'সংবেদনশীল ডকুমেন্টে', hi: 'संवेदनशील दस्तावेज़ों के लिए', en: 'For sensitive documents' },
  'lay.wm.p4.label': { bn: 'কপি (COPY)', hi: 'कॉपी (COPY)', en: 'COPY' },
  'lay.wm.p4.note': { bn: 'অননুমোদিত কপি চিহ্নিত করতে', hi: 'अनधिकृत प्रतिलिपि चिह्नित करने के लिए', en: 'Mark unauthorized copies' },
  'lay.wm.customizeTitle': { bn: 'পানির ছাপ কাস্টমাইজ করুন', hi: 'वॉटरमार्क कस्टमाइज़ करें', en: 'Watermark customization' },
  'lay.wm.customizeBtn': { bn: 'কাস্টমাইজ…', hi: 'कस्टमाइज़…', en: 'Customize…' },
  'lay.wm.text': { bn: 'পানির ছাপের লেখা', hi: 'वॉटरमार्क टेक्स्ट', en: 'Watermark Text' },
  'lay.wm.ph': { bn: 'খসড়া', hi: 'ड्राफ़्ट', en: 'Draft' },
  'lay.wm.preview': { bn: 'প্রিভিউ', hi: 'प्रीव्यू', en: 'Preview' },
  'lay.wm.opacity': { bn: 'অস্বচ্ছতা', hi: 'अपारदर्शिता', en: 'Opacity' },
  'lay.wm.angle': { bn: 'কোণ', hi: 'कोण', en: 'Angle' },
  'lay.wm.fontSize': { bn: 'ফন্টের আকার (pt)', hi: 'फ़ॉन्ट आकार (pt)', en: 'Font Size (pt)' },
  'lay.wm.color': { bn: 'রং', hi: 'रंग', en: 'Color' },
  'lay.wm.colorAria': { bn: 'পানির ছাপের রং {name}', hi: 'वॉटरमार्क रंग {name}', en: 'Watermark color {name}' },
  'lay.wm.warn': { bn: 'ছাপটি প্রিন্ট ও ফরমা PDF-এও আসে — চূড়ান্ত PDF বানানোর আগে Watermark টগল বন্ধ করে নিন।', hi: 'छाप प्रिंट और फ़रमा PDF में भी आती है — अंतिम PDF बनाने से पहले वॉटरमार्क टॉगल बंद कर लें।', en: 'The watermark also appears in print and Farma PDFs — turn the Watermark toggle off before producing the final PDF.' },

  // ─── কনটেন্ট ফ্লো ───
  'lay.flow.fill': { bn: 'ফাঁকা জায়গা পূরণ', hi: 'खाली जगह भरें', en: 'Fill Empty Space' },
  'lay.flow.fill.tip': { bn: 'নিচের পাতার লেখা/ছবি/টেবিল এই পাতার ফাঁকা জায়গায় তুলুন', hi: 'नीचे वाले पृष्ठ का टेक्स्ट/चित्र/तालिका इस पृष्ठ के खाली स्थान में उठा लें', en: 'Lift text/images/tables from the next page into empty space on this page' },
  'lay.flow.smart': { bn: 'স্মার্ট ফ্লো — পুরো বই', hi: 'स्मार्ट फ़्लो — पूरी पुस्तक', en: 'Smart Flow — Whole Book' },
  'lay.flow.smart.tip': { bn: 'পুরো বই স্ক্যান করে প্রতিটি পাতার ফাঁকা জায়গা নিচের পাতার কনটেন্ট দিয়ে ভরাবে', hi: 'पूरी पुस्तक स्कैन करके हर पृष्ठ का खाली स्थान अगले पृष्ठ की सामग्री से भर देगा', en: 'Scans the whole book and fills empty space on each page with content from the next page' },
  'lay.flow.remove': { bn: 'ফাঁকা পাতা সরান', hi: 'खाली पृष्ठ हटाएँ', en: 'Remove Empty Pages' },
  'lay.flow.remove.tip': { bn: 'শুধু খালি পাতাগুলো মুছে ফেলুন', hi: 'केवल खाली पृष्ठ मिटाएँ', en: 'Delete just the blank pages' },

  // ─── টোস্ট ───
  'lay.toast.pageNotOpen': { bn: 'পাতাটি এখনো খোলেনি — পাতাটিতে একবার ক্লিক করে আবার চাপুন', hi: 'पृष्ठ अभी खुला नहीं है — पृष्ठ पर एक बार क्लिक करके दोबारा दबाएँ', en: 'That page has not opened yet — click the page once and try again' },
  'lay.toast.moved': { bn: '{n}টি ব্লক নিচের পাতা থেকে উঠে এসেছে', hi: '{n} ब्लॉक नीचे वाले पृष्ठ से ऊपर आ गए', en: '{n} block(s) lifted from the next page' },
  'lay.toast.absorbed': { bn: 'পরের পাতার সব লেখা এই পাতায় উঠে এসেছে — খালি পাতাটি মুছে গেছে', hi: 'अगले पृष्ठ का सारा टेक्स्ट इस पृष्ठ पर आ गया — खाली पृष्ठ मिट गया', en: 'All text from the next page moved onto this page — the empty page was removed' },
  'lay.toast.nofit': { bn: 'পরের পাতার প্রথম ব্লকটি ফাঁকা জায়গায় আঁটে না — আর তোলা যায়নি', hi: 'अगले पृष्ठ का पहला ब्लॉक खाली स्थान में फ़िट नहीं होता — और ऊपर नहीं उठाया जा सका', en: 'The first block of the next page does not fit in the empty space — nothing more could be lifted' },
  'lay.toast.nothing': { bn: 'এই পাতার পরে টানার মতো কনটেন্ট নেই', hi: 'इस पृष्ठ के बाद खींचने योग्य कोई सामग्री नहीं', en: 'There is no content after this page to pull up' },
  'lay.toast.smartLoading': { bn: 'স্মার্ট ফ্লো চলছে — ফাঁকা পাতাগুলো পূরণ করতে স্বয়ংক্রিয়ভাবে স্ক্রল হচ্ছে…', hi: 'स्मार्ट फ़्लो चल रहा है — खाली पृष्ठों को भरने के लिए स्वतः स्क्रॉल हो रहा है…', en: 'Smart Flow is running — auto-scrolling to fill empty pages…' },
  'lay.toast.smartMoved': { bn: '{a}টি ব্লক {b}টি পাতায় উঠে গেছে', hi: '{a} ब्लॉक {b} पृष्ठों पर चले गए', en: '{a} blocks moved onto {b} pages' },
  'lay.toast.smartDeleted': { bn: '{n}টি পাতা মুছে গেছে', hi: '{n} पृष्ठ मिटा दिए गए', en: '{n} pages deleted' },
  'lay.toast.smartClean': { bn: 'সব পাতা আগে থেকেই সুন্দরভাবে সাজানো — কিছু করার নেই', hi: 'सभी पृष्ठ पहले से सुंदर ढंग से व्यवस्थित हैं — कुछ करने की आवश्यकता नहीं', en: 'All pages were already laid out nicely — nothing to do' },
  'lay.toast.smartError': { bn: 'স্মার্ট ফ্লো চালাতে সমস্যা হয়েছে', hi: 'स्मार्ट फ़्लो चलाने में समस्या हुई', en: 'A problem occurred while running Smart Flow' },
  'lay.toast.removed': { bn: '{n}টি ফাঁকা পাতা মুছে ফেলা হয়েছে', hi: '{n} खाली पृष्ठ मिटा दिए गए', en: '{n} empty page(s) deleted' },
  'lay.toast.noneFound': { bn: 'কোনো ফাঁকা পাতা পাওয়া যায়নি', hi: 'कोई खाली पृष्ठ नहीं मिला', en: 'No empty pages found' },

  // ─── ডিফল্ট টাইপোগ্রাফি ───
  'lay.typo.size': { bn: 'আকার (pt)', hi: 'आकार (pt)', en: 'Size (pt)' },
  'lay.typo.lineHeight': { bn: 'লাইনের উচ্চতা', hi: 'लाइन ऊँचाई', en: 'Line Height' },
  'lay.typo.paraGap': { bn: 'অনুচ্ছেদের ফাঁক (px)', hi: 'अनुच्छेद अंतराल (px)', en: 'Paragraph Gap (px)' },
};
