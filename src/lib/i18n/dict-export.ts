/**
 * অভিধান — export-tab (প্রিন্ট/PDF, ফরমা ইমপোজিশন, DOCX/HTML, ক্রিয়েটিভ, ব্যাকআপ)
 * কী-প্রিফিক্স: exp.
 *
 * 'ফরমা' = বাংলাদেশের ছাপাখানার বই-সই (book signature) ইমপোজিশন —
 *   en: Farma (book signature imposition), hi: फ़रमा (बुक सिग्नेचर इम्पोज़िशन)।
 * PDF/DOCX/HTML/JSON/EPUB/Markdown — ফরম্যাট-নাম অনুবাদ হয় না।
 */

import type { Dict } from './core';

export const dictExport: Dict = {
  // ─── রিবন গ্রুপ ───
  'exp.group.press': { bn: 'প্রেস-রেডি আউটপুট', hi: 'प्रेस-रेडी आउटपुट', en: 'Press-Ready Output' },
  'exp.group.file': { bn: 'ফাইল এক্সপোর্ট', hi: 'फ़ाइल एक्सपोर्ट', en: 'Export File' },
  'exp.group.creative': { bn: 'ক্রিয়েটিভ ফরম্যাট', hi: 'क्रिएटिव फ़ॉर्मैट', en: 'Creative Formats' },
  'exp.group.backup': { bn: 'ব্যাকআপ', hi: 'बैकअप', en: 'Backup' },

  // ─── প্রিন্ট / সেভ অ্যাজ পিডিএফ ───
  'exp.print.btn': { bn: 'প্রিন্ট / PDF হিসেবে সেভ', hi: 'प्रिंट / PDF के रूप में सेव', en: 'Print / Save as PDF' },
  'exp.print.hint': { bn: 'সাধারণ বা ফরমা (প্রেস ইমপোজিশন) — ফন্ট ও মার্জিন ১০০% নির্ভুল থাকে', hi: 'सामान्य या फ़रमा (प्रेस इम्पोज़िशन) — फ़ॉन्ट और मार्जिन १००% सटीक रहते हैं', en: 'Normal or Farma (press imposition) — fonts & margins stay 100% accurate' },

  // ─── ফাইল এক্সপোর্ট ───
  'exp.file.word': { bn: 'Word (.docx)', hi: 'Word (.docx)', en: 'Word (.docx)' },
  'exp.file.html.tip': { bn: 'স্বয়ংসম্পূর্ণ HTML ফাইল (অফলাইনে পড়া যায়)', hi: 'स्वयंसम्पूर्ण HTML फ़ाइल (ऑफ़लाइन पढ़ने योग्य)', en: 'Self-contained HTML file (readable offline)' },
  'exp.file.epub': { bn: 'EPUB (ই-বুক)', hi: 'EPUB (ई-बुक)', en: 'EPUB (e-book)' },
  'exp.file.epub.tip': { bn: 'ই-বুক রিডার/মোবাইলে পড়ার জন্য — ছবিসহ এমবেড হয়', hi: 'ई-बुक रीडर/मोबाइल पर पढ़ने के लिए — चित्र सहित एम्बेड होता है', en: 'For reading on e-book readers/phones — images are embedded' },
  'exp.file.md': { bn: 'Markdown (.md)', hi: 'Markdown (.md)', en: 'Markdown (.md)' },
  'exp.file.md.tip': { bn: 'ব্লগ/নোট অ্যাপে ব্যবহারের জন্য', hi: 'ब्लॉग/नोट्स ऐप में उपयोग के लिए', en: 'For use in blogs/note apps' },
  'exp.file.txt': { bn: 'সাদামাটা টেক্সট (.txt)', hi: 'सादा टेक्स्ट (.txt)', en: 'Plain Text (.txt)' },
  'exp.file.txt.tip': { bn: 'ট্যাগমুক্ত লেখা — যেকোনো জায়গায়', hi: 'टैग-मुक्त लेख — कहीं भी उपयोग करें', en: 'Tag-free text — use anywhere' },

  // ─── ব্যাকআপ ───
  'exp.backup.btn': { bn: 'ব্যাকআপ (JSON)', hi: 'बैकअप (JSON)', en: 'Backup (JSON)' },
  'exp.backup.tip': { bn: 'সম্পূর্ণ প্রজেক্টটি একটি ফাইলে সেভ করুন', hi: 'पूरा प्रोजेक्ट एक फ़ाइल के रूप में सेव करें', en: 'Save the entire project as a file' },
  'exp.backup.open': { bn: 'ব্যাকআপ খুলুন', hi: 'बैकअप खोलें', en: 'Open Backup' },

  // ─── টোস্ট ───
  'exp.toast.docx.building': { bn: 'Word ফাইল তৈরি হচ্ছে…', hi: 'Word फ़ाइल बनाई जा रही है…', en: 'Building Word file…' },
  'exp.toast.docx.done': { bn: 'DOCX ডাউনলোড হয়েছে', hi: 'DOCX डाउनलोड हो गया', en: 'DOCX downloaded' },
  'exp.toast.docx.fail': { bn: 'DOCX তৈরি করা যায়নি', hi: 'DOCX बनाने में विफल', en: 'Failed to generate DOCX' },
  'exp.toast.epub.building': { bn: 'EPUB তৈরি হচ্ছে…', hi: 'EPUB तैयार हो रहा है…', en: 'Building EPUB…' },
  'exp.toast.epub.done': { bn: 'EPUB ডাউনলোড হয়েছে — যেকোনো ই-বুক রিডারে খুলুন', hi: 'EPUB डाउनलोड हो गया — किसी भी ई-बुक रीडर में खोलें', en: 'EPUB downloaded — open in any e-book reader' },
  'exp.toast.epub.fail': { bn: 'EPUB তৈরি করা যায়নি', hi: 'EPUB बनाने में विफल', en: 'Failed to generate EPUB' },
  'exp.toast.md.done': { bn: 'Markdown ডাউনলোড হয়েছে', hi: 'Markdown डाउनलोड हो गया', en: 'Markdown downloaded' },
  'exp.toast.md.fail': { bn: 'Markdown তৈরি করা যায়নি', hi: 'Markdown बनाने में विफल', en: 'Failed to generate Markdown' },
  'exp.toast.txt.done': { bn: 'টেক্সট ফাইল ডাউনলোড হয়েছে', hi: 'टेक्स्ट फ़ाइल डाउनलोड हो गई', en: 'Text file downloaded' },
  'exp.toast.txt.fail': { bn: 'টেক্সট ফাইল তৈরি করা যায়নি', hi: 'टेक्स्ट फ़ाइल बनाने में विफल', en: 'Failed to generate text file' },
  'exp.toast.html.done': { bn: 'HTML ডাউনলোড হয়েছে', hi: 'HTML डाउनलोड हो गया', en: 'HTML downloaded' },
  'exp.toast.backup.done': { bn: 'ব্যাকআপ ডাউনলোড হয়েছে', hi: 'बैकअप डाउनलोड हो गया', en: 'Backup downloaded' },
  'exp.toast.restore.ok': { bn: 'ব্যাকআপ থেকে প্রজেক্ট পুনরুদ্ধার হয়েছে', hi: 'बैकअप से प्रोजेक्ट पुनर्स्थापित हो गया', en: 'Project restored from backup' },
  'exp.toast.restore.bad': { bn: 'এটি বৈধ ব্যাকআপ ফাইল নয়', hi: 'यह मान्य बैकअप फ़ाइल नहीं है', en: 'Not a valid backup file' },
  'exp.toast.nopage': { bn: 'কোনো পাতা সক্রিয় নেই — আগে একটি পাতায় ক্লিক করুন।', hi: 'कोई पृष्ठ सक्रिय नहीं है — पहले किसी पृष्ठ पर क्लिक करें।', en: 'No active page — click on a page first.' },
  'exp.toast.badrange': { bn: 'পরিসর ঠিক নেই — শুরু ও শেষ পৃষ্ঠা সঠিকভাবে লিখুন (শুরু ≤ শেষ)।', hi: 'श्रेणी सही नहीं है — शुरुआत और अंत का पृष्ठ सही ढंग से लिखें (शुरुआत ≤ अंत)।', en: 'Invalid range — enter start and end pages correctly (start ≤ end).' },
  'exp.toast.rangeover': { bn: 'এই বইয়ে মোট {total}টি পৃষ্ঠা — শুরু {from} এর বাইরে।', hi: 'इस पुस्तक में कुल {total} पृष्ठ हैं — शुरुआत {from} सीमा से बाहर है।', en: 'This book has {total} pages — start {from} is out of range.' },
  'exp.toast.formafail': { bn: 'ফরমা যাচাইয়ে সমস্যা — ছাপা আটকানো হয়েছে: {p}', hi: 'फ़रमा सत्यापन में समस्या — छपाई रोक दी गई: {p}', en: 'Farma check failed — printing blocked: {p}' },

  // ─── প্রিন্ট-মোড ডায়ালগ ───
  'exp.dlg.title': { bn: 'প্রিন্ট মোড নির্বাচন', hi: 'प्रिंट मोड चुनें', en: 'Choose print mode' },
  'exp.dlg.desc': { bn: 'বইটি কীভাবে ছাপানো হবে তা অনুযায়ী মোড বেছে নিন — প্রিন্ট ডায়ালগে “Save as PDF” বেছে নিলে ফন্ট ও মার্জিন হুবহু থাকবে।', hi: 'पुस्तक कैसे छपेगी, उसी के अनुसार मोड चुनें — प्रिंट डायलॉग में “Save as PDF” चुनने पर फ़ॉन्ट और मार्जिन यथावत रहेंगे।', en: 'Pick the mode according to how the book will be printed — choosing “Save as PDF” in the print dialog keeps fonts and margins exactly intact.' },
  'exp.mode.normal': { bn: 'সাধারণ PDF', hi: 'सामान्य PDF', en: 'Normal PDF' },
  'exp.mode.normal.desc': { bn: 'প্রতি শীটে একটি পৃষ্ঠা, সঠিক কাগজের সাইজে — প্রিন্টার, ডিজিটাল কপি বা কভার ছাপার জন্য।', hi: 'प्रति शीट एक पृष्ठ, सही कागज़ आकार में — प्रिंटर, डिजिटल कॉपी या कवर छापने के लिए।', en: 'One page per sheet at the exact paper size — for printers, digital copies or printing the cover.' },
  'exp.mode.forma': { bn: 'ফরমা PDF (ছাপাখানা)', hi: 'फ़रमा PDF (बुक सिग्नेचर इम्पोज़िशन)', en: 'Farma PDF (book signature imposition)' },
  'exp.mode.forma.desc': { bn: 'এক বড় শীটে একাধিক পৃষ্ঠা ভাঁজ-সঠিক ক্রমে — ফরমা অনুযায়ী বই ছাপার জন্য।', hi: 'एक बड़ी शीट पर कई पृष्ठ, तह के सही क्रम में — फ़रमा अनुसार पुस्तक छापने के लिए।', en: 'Multiple pages on one large sheet in fold-correct order — for printing the book by Farma imposition.' },
  'exp.dlg.print': { bn: 'প্রিন্ট করুন', hi: 'प्रिंट करें', en: 'Print' },
  'exp.dlg.printforma': { bn: 'ফরমা প্রিন্ট করুন', hi: 'फ़रमा प्रिंट करें', en: 'Print Farma' },

  // ─── মুদ্রণ পরিসর ───
  'exp.range.label': { bn: 'মুদ্রণ পরিসর', hi: 'मुद्रण श्रेणी', en: 'Print range' },
  'exp.range.formanote': { bn: 'ফরমা সবসময় পুরো বইয়ের উপর গণনা হয়', hi: 'फ़रमा की गणना सदैव पूरी पुस्तक पर होती है', en: 'Farma is always computed over the entire book' },
  'exp.range.all': { bn: 'সম্পূর্ণ বই', hi: 'संपूर्ण पुस्तक', en: 'Entire book' },
  'exp.range.custom': { bn: 'নির্দিষ্ট পরিসর', hi: 'निर्दिष्ट श्रेणी', en: 'Custom range' },
  'exp.range.from': { bn: 'শুরু (পৃষ্ঠা)', hi: 'शुरुआत (पृष्ठ)', en: 'From (page)' },
  'exp.range.to': { bn: 'শেষ (পৃষ্ঠা)', hi: 'अंत (पृष्ठ)', en: 'To (page)' },
  'exp.range.current': { bn: 'শুধু এই পাতা', hi: 'केवल यह पृष्ठ', en: 'Only this page' },
  'exp.range.current.n': { bn: '(পৃষ্ঠা {n})', hi: '(पृष्ठ {n})', en: '(page {n})' },
  'exp.range.note': { bn: 'বাইরের পাতাগুলো প্রিন্টে স্বয়ংক্রিয়ভাবে বাদ যাবে — ব্রাউজারের প্রিন্ট ডায়ালগে পেজ-রেঞ্জ “All”-ই রাখুন। বাংলা বা ইংরেজি সংখ্যা দুটোই লেখা যায়।', hi: 'बाहरी पृष्ठ छपाई में स्वतः छोड़ दिए जाएँगे — ब्राउज़र के प्रिंट डायलॉग में पेज-रेंज “All” ही रखें। बांग्ला या अंग्रेज़ी अंक दोनों लिखे जा सकते हैं।', en: 'Outer pages are dropped from the print automatically — keep the page range as “All” in the browser print dialog. Both Bangla and English digits are accepted.' },

  // ─── ফরমা সেটিংস ───
  'exp.forma.size': { bn: 'ফরমা সাইজ', hi: 'फ़रमा आकार', en: 'Farma size' },
  'exp.forma.pagespersheet': { bn: '{n} পৃষ্ঠা / ফরমা', hi: '{n} पृष्ठ / फ़रमा', en: '{n} pages / Farma' },
  'exp.forma.sideorder': { bn: 'সাইড বিন্যাস', hi: 'साइड क्रम', en: 'Side order' },
  'exp.forma.side.interleaved': { bn: 'পাশাপাশি (A, B, A, B…)', hi: 'बारी-बारी से (A, B, A, B…)', en: 'Interleaved (A, B, A, B…)' },
  'exp.forma.side.frontsfirst': { bn: 'আগে সব সামনে, পরে সব পেছনে', hi: 'पहले सभी अगले, फिर सभी पिछले', en: 'All fronts first, then all backs' },
  'exp.forma.includecover': { bn: 'কভার ফরমায় রাখুন', hi: 'कवर फ़रमा में रखें', en: 'Include cover in Farma' },
  'exp.forma.includecover.note': { bn: 'বাঁদিকে রাখলে কভার ফরমার প্রথম পৃষ্ঠা হিসেবে ছাপাবে। আসল বইয়ের মতো কভার আলাদা মোটা কাগজে ছাপাতে চাইলে বন্ধ করুন — তখন কভার “সাধারণ PDF” দিয়ে আলাদা ছাপাবেন, ভেতরের ব্লক ফরমায় ছাপা হবে।', hi: 'चालू रखने पर कवर फ़रमा के पहले पृष्ठ के रूप में छपेगा। असली पुस्तक की तरह कवर अलग मोटे कागज़ पर छापना चाहें तो इसे बंद करें — तब कवर “सामान्य PDF” से अलग छापें; भीतरी ब्लॉक फ़रमा से छपेगा।', en: 'When on, the cover prints as the first page of the Farma. Turn off to print the cover on separate thick stock like a real book — then print the cover separately as “Normal PDF” and the inner block goes to the Farma.' },
  'exp.forma.pressslip': { bn: 'প্রেস-স্লিপ (শীট নম্বর/পাশ)', hi: 'प्रेस-स्लिप (शीट नंबर/पक्ष)', en: 'Press slip (sheet no./side)' },
  'exp.forma.foldmarks': { bn: 'ভাঁজ/কাট মার্ক দেখান', hi: 'तह/कट चिह्न दिखाएँ', en: 'Show fold/cut marks' },
  'exp.forma.gridswap': { bn: 'শীট গ্রিড ঘোরান ({a}×{b})', hi: 'शीट ग्रिड घुमाएँ ({a}×{b})', en: 'Rotate sheet grid ({a}×{b})' },
  'exp.forma.gridswap.note': { bn: 'ছাপাখানার কাগজের গ্রেন-দিক বা স্টক-সাইজে লম্বা গ্রিড দরকার হলে এটি চালু করুন — দুই অভিমুখেই ভাঁজ সঠিক থাকে (যাচাইকৃত)।', hi: 'छापाखाने के कागज़ की ग्रेन-दिशा या स्टॉक-आकार में लंबा ग्रिड चाहिए हो तो यह चालू करें — दोनों दिशाओं में तह सही रहती है (सत्यापित)।', en: 'Turn this on when the press paper’s grain direction or stock size needs a longer grid — folding stays correct in both orientations (verified).' },
  'exp.forma.bindingwarn.head': { bn: 'বাঁধাই সতর্কতা:', hi: 'जिल्दबंदी चेतावनी:', en: 'Binding warning:' },
  'exp.forma.bindingwarn.body': { bn: 'ভেতরের (বাঁধাই) মার্জিন মাত্র {n} মিমি — ভাঁজ/বাঁধাইয়ের সময় লেখা মেরুদণ্ডের ভেতরে ঢুকে যেতে পারে। Layout → Margins থেকে Gutter বাড়িয়ে মোট {a}–{b} মিমি করুন (আসল বইয়ের নিয়ম)।', hi: 'भीतरी (बाइंडिंग) मार्जिन मात्र {n} मिमी है — तह/जिल्दबंदी के समय लेख स्पाइन के भीतर चला जा सकता है। Layout → Margins से Gutter बढ़ाकर कुल {a}–{b} मिमी करें (असली पुस्तक का नियम)।', en: 'The inner (binding) margin is only {n} mm — text may run into the spine when folding/binding. Increase Gutter via Layout → Margins to a total of {a}–{b} mm (real-book rule).' },

  // ─── ফরমা সেলফ-চেক ───
  'exp.check.ok': { bn: 'ফরমা যাচাই সম্পন্ন — পৃষ্ঠা ক্রম, ঘর ও আউটার ফরমা স্ট্যান্ডার্ড মেলেছে ✓', hi: 'फ़रमा सत्यापन पूर्ण — पृष्ठ क्रम, सेल और आउटर फ़रमा मानक सब मेल खाते हैं ✓', en: 'Farma check passed — page order, cells and outer-Farma standard all match ✓' },
  'exp.check.fail': { bn: 'ফরমা যাচাইয়ে সমস্যা — ছাপা আটকানো হয়েছে:', hi: 'फ़रमा सत्यापन में समस्या — छपाई रोक दी गई:', en: 'Farma check failed — printing blocked:' },
  'exp.check.unknown': { bn: 'অজানা', hi: 'अज्ञात', en: 'Unknown' },

  // ─── প্রেস-রেডি গোল্ড সিল ───
  'exp.seal.pressready': { bn: 'প্রেস-রেডি সার্টিফাইড', hi: 'प्रेस-रेडी प्रमाणित', en: 'Press-Ready Certified' },
  'exp.seal.tip': { bn: 'ফরমা-গণিত স্বাধীন ভাঁজ-সিমুলেশনে যাচাইকৃত — ছাপাখানায় পাঠানোর জন্য প্রস্তুত', hi: 'फ़रमा-गणित स्वतंत्र फ़ोल्ड-सिमुलेशन में सत्यापित — छापाखाने भेजने के लिए तैयार', en: 'Imposition verified by independent fold-simulation — ready for the press' },

  // ─── তথ্য ব্যাজ ───
  'exp.badge.pages': { bn: 'মোট পৃষ্ঠা: {n}', hi: 'कुल पृष्ठ: {n}', en: 'Total pages: {n}' },
  'exp.badge.sheets': { bn: 'প্রেস শীট: {n}টি', hi: 'प्रेस शीट: {n}', en: 'Press sheets: {n}' },
  'exp.badge.blanks': { bn: 'শেষ ফরমায় {n}টি খালি পৃষ্ঠা যোগ হবে', hi: 'अंतिम फ़रमा में {n} रिक्त पृष्ठ जोड़े जाएँगे', en: '{n} blank pages will be added to the last Farma' },
  'exp.badge.sheetmm': { bn: 'শীট মাপ: {a}×{b} মিমি', hi: 'शीट माप: {a}×{b} मिमी', en: 'Sheet size: {a}×{b} mm' },
  'exp.badge.duplex': { bn: 'ডুপ্লেক্স প্রিন্টে: Long-edge flip রাখুন', hi: 'डुप्लेक्स प्रिंट में: Long-edge flip रखें', en: 'For duplex: keep Long-edge flip' },
  'exp.badge.nocover': { bn: 'কভার বাদ — ফরমায় {n}টি পৃষ্ঠা', hi: 'कवर छोड़ा गया — फ़रमा में {n} पृष्ठ', en: 'Cover excluded — {n} pages in the Farma' },

  // ─── লাইভ প্রিভিউ ───
  'exp.preview.live': { bn: 'লাইভ প্রিভিউ — প্রথম প্রেস-শীট (আসল পৃষ্ঠা দিয়ে গড়া; ছাপা হবে ঠিক এটিই):', hi: 'लाइव प्रीव्यू — पहली प्रेस-शीट (असली पृष्ठों से बनी; छपेगा ठीक यही):', en: 'Live preview — first press sheet (built from real pages; printed exactly as shown):' },
  'exp.preview.refresh': { bn: 'রিফ্রেশ', hi: 'रीफ़्रेश', en: 'Refresh' },
  'exp.preview.aria': { bn: 'ফরমা প্রিভিউ', hi: 'फ़रमा प्रीव्यू', en: 'Farma preview' },
  'exp.preview.note': { bn: 'সাইড বিন্যাস অনুযায়ী প্রিন্টে শীট-পর শীট (A, B, A, B…) আসবে — এই প্রিভিউতে প্রথম শীটের দুই পাশ পাশাপাশি দেখানো হয়েছে।', hi: 'साइड क्रम के अनुसार छपाई में शीट-दर-शीट (A, B, A, B…) आएँगी — इस प्रीव्यू में पहली शीट के दोनों पक्ष बगल में दिखाए गए हैं।', en: 'Per the side order, printing outputs sheet after sheet (A, B, A, B…) — this preview shows both sides of the first sheet side by side.' },

  // ─── স্কিমাটিক প্রিভিউ ───
  'exp.schem.title': { bn: 'পৃষ্ঠা বিন্যাস (↻ = ১৮০° ঘুরিয়ে ছাপা হবে):', hi: 'पृष्ठ विन्यास (↻ = १८०° घुमाकर छपेगा):', en: 'Page layout (↻ = printed rotated 180°):' },
  'exp.schem.sheet': { bn: 'শীট {n} — পাশ {s}', hi: 'शीट {n} — पक्ष {s}', en: 'Sheet {n} — side {s}' },
  'exp.schem.coverhere': { bn: 'কভার এই পাশে (বাইরের ফরমা)', hi: 'कवर इस पक्ष पर (बाहरी फ़रमा)', en: 'Cover on this side (outer Farma)' },
  'exp.schem.blank': { bn: 'খালি', hi: 'रिक्त', en: 'Blank' },
  'exp.schem.more': { bn: '+{n}টি আরও শীট…', hi: '+{n} और शीट…', en: '+{n} more sheets…' },
  'exp.schem.foldnote': { bn: 'ভাঁজ পদ্ধতি: ডান-অর্ধেক উপরে → নিচ-অর্ধেক উপরে → পুনরাবৃত্তি (right-angle fold)। শেষ অসম্পূর্ণ ফরমা খালি পৃষ্ঠা দিয়ে পূরণ হয়।', hi: 'तह विधि: दायाँ-आधा ऊपर → निचला-आधा ऊपर → दोहराएँ (right-angle fold)। अंतिम अधूरा फ़रमा रिक्त पृष्ठों से भरा जाता है।', en: 'Folding method: right half up → bottom half up → repeat (right-angle fold). The last incomplete Farma is padded with blank pages.' },

  // ─── ছাপাখানা গাইড (ধাপে ধাপে) ───
  'exp.guide.title': { bn: 'ফরমা ছাপার নিয়ম (ধাপে ধাপে):', hi: 'फ़रमा छपाई के नियम (चरण-दर-चरण):', en: 'Farma printing rules (step by step):' },
  'exp.guide.s1.head': { bn: 'সব পৃষ্ঠা ছাপুন:', hi: 'सभी पृष्ठ छापें:', en: 'Print all pages:' },
  'exp.guide.s1.body': { bn: 'প্রিন্ট ডায়ালগে পেজ-রেঞ্জ {a} রাখতে হবে — কোনো শীট বাদ গেলে সই-এ পৃষ্ঠা মিলবে না।', hi: 'प्रिंट डायलॉग में पेज-रेंज {a} रखना होगा — कोई शीट छूट गई तो सिग्नेचर में पृष्ठ मेल नहीं खाएँगे।', en: 'The page range in the print dialog must stay {a} — if any sheet is skipped, pages will not match within the signature.' },
  'exp.guide.s2.head': { bn: 'সাইড বিন্যাস:', hi: 'साइड क्रम:', en: 'Side order:' },
  'exp.guide.s2.body': { bn: 'ডুপ্লেক্স (উভয় পাশ একসাথে ছাপার) প্রিন্টার থাকলে “পাশাপাশি” রাখুন — প্রতিটি শীটের A ও B পাশ পরপর ছাপাবে। সাধারণ (এক পাশ) প্রিন্টারে আগে সব A পাশ ছাপিয়ে কাগজ উল্টে সব B পাশ ছাপাতে “আগে সব সামনে” বেছে নিন।', hi: 'डुप्लेक्स (दोनों पक्ष एक साथ छापने वाले) प्रिंटर पर “बारी-बारी से” रखें — हर शीट का A और B पक्ष क्रमशः छपेगा। सामान्य (एक पक्ष) प्रिंटर पर पहले सभी A पक्ष छपवाकर कागज़ पलटकर सभी B पक्ष छापने के लिए “पहले सभी अगले” चुनें।', en: 'With a duplex (both-sides) printer keep “Interleaved” — each sheet’s A and B sides print one after another. On a simplex (one-side) printer choose “All fronts first” to print all A sides, flip the paper, then print all B sides.' },
  'exp.guide.s3.head': { bn: 'ডুপ্লেক্স সেটিং:', hi: 'डुप्लेक्स सेटिंग:', en: 'Duplex setting:' },
  'exp.guide.s3.body': { bn: 'প্রিন্ট ডায়ালগে {a} অবশ্যই রাখতে হবে — Short Edge দিলে পেছনের পৃষ্ঠাগুলো ভুল ঘরে পড়ে ভাঁজ ভুল হয়।', hi: 'प्रिंट डायलॉग में {a} अवश्य रखें — Short Edge चुनने पर पिछले पृष्ठ गलत सेल में चले जाते हैं और तह गलत हो जाती है।', en: 'The print dialog must be set to {a} — with Short Edge, back pages land in the wrong cells and the fold goes wrong.' },
  'exp.guide.s4.head': { bn: 'স্কেল ১০০% (Actual size)', hi: 'स्केल १००% (Actual size)', en: 'Scale 100% (Actual size)' },
  'exp.guide.s4.body': { bn: 'রাখুন — “Fit to page” দিলে মাপ বদলে ভাঁজ মেলবে না।', hi: 'रखें — “Fit to page” चुनने पर माप बदल जाता है और तह मेल नहीं खाएगी।', en: 'should be kept — with “Fit to page” the size changes and folds will not line up.' },
  'exp.guide.s5.head': { bn: 'কাগজের মাপ:', hi: 'कागज़ का माप:', en: 'Paper size:' },
  'exp.guide.s5.body': { bn: 'প্রেস শীট {a}×{b} মিমি — এই মাপের কাগজ না মিললে ছোট ফরমা (৪ বা ৮ পৃষ্ঠা) বা গ্রিড ঘোরানো বেছে নিন। ছাপাখানায় A3/ডেমি/ক্রাউন শীটে এক-একটি ফরমা ছাপা হয়।', hi: 'प्रेस शीट {a}×{b} मिमी — इस माप का कागज़ न मिले तो छोटा फ़रमा (४ या ८ पृष्ठ) या घुमाया ग्रिड चुनें। छापाखाने में A3/डेमी/क्राउन शीट पर एक-एक फ़रमा छपता है।', en: 'Press sheet {a}×{b} mm — if that stock is unavailable, choose a smaller Farma (4 or 8 pages) or a rotated grid. Presses print one Farma per A3/demy/crown sheet.' },
  'exp.guide.s6.head': { bn: 'কভার:', hi: 'कवर:', en: 'Cover:' },
  'exp.guide.s6.body': { bn: 'আসল বইয়ে কভার আলাদা মোটা কাগজে (ইলাস্ট্রেশন কার্ড ২৫০–৩০০ গ্রাম) ছাপানো হয় — “কভার ফরমায় রাখুন” বন্ধ রেখে কভারটি সাধারণ PDF দিয়ে আলাদা ছাপান, ভেতরের ব্লক ফরমায় যাবে।', hi: 'असली पुस्तक में कवर अलग मोटे कागज़ (इलस्ट्रेशन कार्ड २५०–३०० ग्राम) पर छपाया जाता है — “कवर फ़रमा में रखें” बंद रखकर कवर को सामान्य PDF से अलग छापें; भीतरी ब्लॉक फ़रमा से छपेगा।', en: 'In a real book the cover is printed on separate thick stock (illustration card 250–300 gsm) — turn “Include cover in Farma” off and print the cover separately as Normal PDF; the inner block goes to the Farma.' },
  'exp.guide.s7.head': { bn: 'ভাঁজ ও কাটা:', hi: 'तह और कटाई:', en: 'Folding & trimming:' },
  'exp.guide.s7.body': { bn: 'ছাপানোর পর ভাঁজ-রেখার দাগ ধরে ভাঁজ করুন (ডান-অর্ধেক উপরে → নিচ-অর্ধেক উপরে → পুনরাবৃত্তি), তারপর খাড়া কাটা দিন — কোণার ট্রিম-মার্ক ধরে কাটলে পৃষ্ঠা ১, ২, ৩… স্বয়ংক্রিয়ভাবে সঠিক ক্রমে পড়বে।', hi: 'छपाई के बाद तह-रेखा के निशान पर तह करें (दायाँ-आधा ऊपर → निचला-आधा ऊपर → दोहराएँ), फिर सीधी कटाई करें — कोनों के ट्रिम-मार्क पर काटने पर पृष्ठ १, २, ३… स्वतः सही क्रम में आ जाएँगे।', en: 'After printing, fold along the fold lines (right half up → bottom half up → repeat), then trim — cutting on the corner trim marks puts pages 1, 2, 3… in the correct order automatically.' },
  'exp.guide.s8.head': { bn: 'প্রেসে দেওয়ার আগে:', hi: 'प्रेस को देने से पहले:', en: 'Before sending to press:' },
  'exp.guide.s8.body': { bn: 'প্রতিটি শীটের কোণে ছাপা প্রেস-স্লিপ (শীট {a}/{b} — পাশ A) দেখে ক্রম মিলিয়ে নিন; প্রথম শীটের বাইরের পাশে {c}, {d}, {e}… জাতীয় পৃষ্ঠা-সেট থাকলেই বাইরের ফরমা ঠিক আছে।', hi: 'हर शीट के कोने पर छपी प्रेस-स्लिप (शीट {a}/{b} — पक्ष A) देखकर क्रम मिलाएँ; पहली शीट के बाहरी पक्ष पर {c}, {d}, {e}… जैसा पृष्ठ-सेट हो तो बाहरी फ़रमा ठीक है।', en: 'Check the order on the press slip printed in each sheet’s corner (sheet {a}/{b} — side A); if the outer side of the first sheet carries a page set like {c}, {d}, {e}…, the outer Farma is correct.' },
};
