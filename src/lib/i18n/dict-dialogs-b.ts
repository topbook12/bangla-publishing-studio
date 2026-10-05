/**
 * অভিধান — dialogs: review, find-replace, snapshots, help + dialogs.tsx
 * কী-প্রিফিক্স: dlg2. (dlg2.review.* / dlg2.find.* / dlg2.snap.* / dlg2.help.*)
 *
 * নিয়ম: মূল স্ট্রিং বাংলা হলে bn হুবহু রাখা হয়েছে; গতিশীল মান {n}/{a} ইত্যাদি
 * প্লেসহোল্ডারে, বোল্ড অংশ tplNodes-এ যায়। UI-নাম যেমন "Header & Footer Master",
 * "Scale 100%" — বৈশিষ্ট্যের নাম হিসেবে সব ভাষায় রাখা হয়েছে (bn হুবহু রাখার শর্তে)।
 */

import type { Dict } from './core';

export const dictDialogsB: Dict = {
  // ─── প্রুফিং ডায়ালগ (review-dialog) ───
  'dlg2.review.title': { bn: 'বানান ও প্রুফিং সহায়ক', hi: 'वर्तनी और प्रूफ़िंग सहायक', en: 'Spelling & Proofing Assistant' },
  'dlg2.review.desc': { bn: 'অফলাইন ডিকশনারিতে না-থাকা শব্দগুলো দেখানো হচ্ছে — ভুল নয়, “যাচাই করার মতো”', hi: 'ऑफ़लाइन शब्दकोश में न मिलने वाले शब्द दिखाए जा रहे हैं — ग़लती नहीं, केवल “जाँचने योग्य”', en: 'Showing words missing from the offline dictionary — not mistakes, just “worth checking”' },
  'dlg2.review.tab.spell': { bn: 'বানান পরীক্ষক', hi: 'वर्तनी जाँच', en: 'Spelling Check' },
  'dlg2.review.tab.dict': { bn: 'আমার অভিধান', hi: 'मेरा शब्दकोश', en: 'My Dictionary' },
  'dlg2.review.tab.conjunct': { bn: 'যুক্তবর্ণ সহায়িকা', hi: 'संयुक्ताक्षर गाइड', en: 'Conjunct Guide' },
  'dlg2.review.scanAsk': { bn: 'পুরো বই স্ক্যান করে সন্দেহজনক শব্দ খুঁজি?', hi: 'पूरी पुस्तक स्कैन करके संदिग्ध शब्द खोजें?', en: 'Scan the whole book for suspicious words?' },
  'dlg2.review.scanStart': { bn: 'স্ক্যান শুরু করুন', hi: 'स्कैन शुरू करें', en: 'Start Scan' },
  'dlg2.review.filterPh': { bn: 'শব্দ ফিল্টার…', hi: 'शब्द फ़िल्टर…', en: 'Filter words…' },
  'dlg2.review.allClean': { bn: '🎉 সব শব্দ অভিধানে পাওয়া গেছে — চমৎকার!', hi: '🎉 सभी शब्द शब्दकोश में मिल गए — बहुत बढ़िया!', en: '🎉 All words found in the dictionary — excellent!' },
  'dlg2.review.hitMeta': { bn: '{n}× • পৃ. {p}', hi: '{n}× • पृ. {p}', en: '{n}× • pp. {p}' },
  'dlg2.review.addWord': { bn: 'অভিধানে যোগ', hi: 'शब्दकोश में जोड़ें', en: 'Add to Dictionary' },
  'dlg2.review.totalNote': { bn: 'মোট {n}টি অনন্য শব্দ। সঠিক বানানের নতুন শব্দ “{a}” করে রাখুন — পরে আর দেখাবে না।', hi: 'कुल {n} भिन्न शब्द। सही वर्तनी वाले नए शब्द “{a}” करके सहेज लें — वे दोबारा नहीं दिखेंगे।', en: '{n} unique words in total. Save correctly-spelled new words with “{a}” — they won’t show up again.' },
  'dlg2.review.dictEmpty': { bn: 'আপনার কাস্টম অভিধান খালি। বানান পরীক্ষক থেকে শব্দ যোগ করুন।', hi: 'आपका कस्टम शब्दकोश खाली है। वर्तनी जाँच से शब्द जोड़ें।', en: 'Your custom dictionary is empty. Add words from the spelling check.' },
  'dlg2.review.removeWordAria': { bn: '{w} মুছুন', hi: '{w} मिटाएँ', en: 'Remove {w}' },
  'dlg2.review.conjunctNote': { bn: 'প্রচলিত {n}টি যুক্তবর্ণ ও গঠন — রিভিউ ট্যাবের প্যালেট থেকে সরাসরি লেখায় বসানো যায়।', hi: 'प्रचलित {n} संयुक्ताक्षर और उनके गठन — रिव्यू टैब की पैलेट से सीधे लेख में जोड़े जा सकते हैं।', en: '{n} common conjuncts and their forms — insert them straight into text from the Review tab palette.' },

  // ─── খোঁজ ও প্রতিস্থাপন ডায়ালগ (find-replace-dialog) ───
  'dlg2.find.title': { bn: 'খোঁজ ও প্রতিস্থাপন', hi: 'खोजें और बदलें', en: 'Find & Replace' },
  'dlg2.find.desc': { bn: 'সম্পূর্ণ বইয়ের সব পাতায় একসাথে খোঁজা ও বদলানো যায়।', hi: 'पूरी पुस्तक के सभी पृष्ठों में एक साथ खोजा और बदला जा सकता है।', en: 'Search and replace across every page of the whole book.' },
  'dlg2.find.what': { bn: 'যা খুঁজবেন', hi: 'क्या खोजें', en: 'Find what' },
  'dlg2.find.queryPh': { bn: 'লেখার টুকুনো লিখুন…', hi: 'लेख का कोई अंश लिखें…', en: 'Type a snippet of text…' },
  'dlg2.find.caseOn': { bn: 'বড়-ছোট হরফ মিলবে', hi: 'बड़े-छोटे अक्षर मिलेंगे', en: 'Match letter case' },
  'dlg2.find.caseOff': { bn: 'বড়-ছোট হরফ উপেক্ষা', hi: 'बड़े-छोटे अक्षर नज़रअंदाज़ करें', en: 'Ignore letter case' },
  'dlg2.find.caseAria': { bn: 'বড়-ছোট হরফ মেলান', hi: 'बड़े-छोटे अक्षर मिलाएँ', en: 'Match case' },
  'dlg2.find.with': { bn: 'যা বসাবেন', hi: 'किससे बदलें', en: 'Replace with' },
  'dlg2.find.replacePh': { bn: 'নতুন লেখা (খালি রাখলে মুছে যাবে)', hi: 'नया लेख (खाली छोड़ने पर मिट जाएगा)', en: 'New text (leave empty to delete)' },
  'dlg2.find.replaced': { bn: 'প্রতিস্থাপন হয়েছে', hi: 'बदल दिया गया', en: 'Replaced' },
  'dlg2.find.replaceFail': { bn: 'প্রতিস্থাপন করা যায়নি — আবার চেষ্টা করুন', hi: 'बदला नहीं जा सका — फिर से कोशिश करें', en: 'Could not replace — please try again' },
  'dlg2.find.replacedN': { bn: '{n}টি প্রতিস্থাপন হয়েছে', hi: '{n} जगह बदल दिया गया', en: '{n} replaced' },
  'dlg2.find.noMatch': { bn: 'কোনো মিল পাওয়া যায়নি', hi: 'कोई मिलान नहीं मिला', en: 'No matches found' },
  'dlg2.find.matchCount': { bn: 'মিল পাওয়া গেছে: {n}টি — বর্তমান {c}', hi: 'मिलान मिले: {n} — वर्तमान {c}', en: 'Matches found: {n} — current {c}' },
  'dlg2.find.typeToFind': { bn: 'খুঁজতে যা চান তা লিখুন', hi: 'जो खोजना चाहें वह लिखें', en: 'Type what you want to find' },
  'dlg2.find.prev': { bn: 'আগের', hi: 'पिछला', en: 'Previous' },
  'dlg2.find.next': { bn: 'পরের', hi: 'अगला', en: 'Next' },
  'dlg2.find.replace': { bn: 'প্রতিস্থাপন', hi: 'बदलें', en: 'Replace' },
  'dlg2.find.replaceAll': { bn: 'সব প্রতিস্থাপন', hi: 'सभी बदलें', en: 'Replace All' },
  'dlg2.find.tip': { bn: 'টিপ: পাতায় লেখার একটি অংশ সিলেক্ট করে Ctrl+F চাপলে সেটিই আগে থেকে লেখা থাকবে।', hi: 'टिप: पृष्ठ पर लेख का कोई अंश चुनकर Ctrl+F दबाएँ — वही अंश पहले से लिखा मिलेगा।', en: 'Tip: select a piece of text on the page and press Ctrl+F — it will be pre-filled in the search box.' },

  // ─── স্ন্যাপশট ডায়ালগ (snapshots-dialog) ───
  'dlg2.snap.toastSaved': { bn: 'ব্যাকআপ নেওয়া হয়েছে', hi: 'बैकअप ले लिया गया', en: 'Backup taken' },
  'dlg2.snap.toastRestored': { bn: 'স্ন্যাপশট পুনরুদ্ধার হয়েছে', hi: 'स्नैपशॉट पुनर्स्थापित हो गया', en: 'Snapshot restored' },
  'dlg2.snap.toastDeleted': { bn: 'স্ন্যাপশট মুছে ফেলা হয়েছে', hi: 'स्नैपशॉट मिटा दिया गया', en: 'Snapshot deleted' },
  'dlg2.snap.title': { bn: 'স্ন্যাপশট ইতিহাস', hi: 'स्नैपशॉट इतिहास', en: 'Snapshot History' },
  'dlg2.snap.desc': { bn: 'বইয়ের সংরক্ষিত অবস্থাসমূহ — পুরনো যেকোনো মুহূর্তে ফেরত যেতে পারবেন।', hi: 'पुस्तक की सहेजी गई अवस्थाएँ — किसी भी पुराने क्षण पर लौट सकते हैं।', en: 'Saved states of the book — you can return to any earlier moment.' },
  'dlg2.snap.takeNow': { bn: 'এখন ব্যাকআপ নিন', hi: 'अभी बैकअप लें', en: 'Back Up Now' },
  'dlg2.snap.empty': { bn: 'এখনো কোনো স্ন্যাপশট নেই — প্রতি ৫ মিনিটে স্বয়ংক্রিয় ব্যাকআপ হয়।', hi: 'अभी कोई स्नैपशॉट नहीं — हर ५ मिनट में स्वतः बैकअप होता है।', en: 'No snapshots yet — an automatic backup runs every 5 minutes.' },
  'dlg2.snap.kind.manual': { bn: 'ম্যানুয়াল', hi: 'मैनुअल', en: 'Manual' },
  'dlg2.snap.kind.auto': { bn: 'স্বয়ংক্রিয়', hi: 'स्वतः', en: 'Auto' },
  'dlg2.snap.pages': { bn: '{n}টি পৃষ্ঠা', hi: '{n} पृष्ठ', en: '{n} pages' },
  'dlg2.snap.restore': { bn: 'পুনরুদ্ধার', hi: 'पुनर्स्थापित करें', en: 'Restore' },
  'dlg2.snap.confirmDelete': { bn: 'নিশ্চিত?', hi: 'सुनिश्चित?', en: 'Sure?' },
  'dlg2.snap.delete': { bn: 'মুছুন', hi: 'मिटाएँ', en: 'Delete' },
  'dlg2.snap.deleteAria': { bn: 'মুছুন — {t}', hi: 'मिटाएँ — {t}', en: 'Delete — {t}' },
  'dlg2.snap.restoreTitle': { bn: 'এই স্ন্যাপশটে ফেরত যাবেন?', hi: 'इस स्नैपशॉट पर वापस जाएँ?', en: 'Go back to this snapshot?' },
  'dlg2.snap.restoreDesc': { bn: '“{title}” স্ন্যাপশটের অবস্থায় পুরো বই ফিরে যাবে — এরপরের সব সম্পাদনা মিলে যাবে। চিন্তা নেই: পুনরুদ্ধারের ঠিক আগে বর্তমান অবস্থার একটি স্বয়ংক্রিয় ব্যাকআপ নেওয়া হবে — সেটি থেকেও ফেরা যাবে।', hi: '“{title}” स्नैपशॉट की अवस्था पर पूरी पुस्तक लौट जाएगी — उसके बाद के सभी संपादन मिट जाएँगे। चिंता न करें: पुनर्स्थापन के ठीक पहले वर्तमान अवस्था का एक स्वतः बैकअप ले लिया जाएगा — उससे भी वापस आया जा सकता है।', en: 'The whole book will return to the state of the “{title}” snapshot — all later edits will be lost. Don’t worry: right before restoring, an automatic backup of the current state is taken — you can come back from that too.' },
  'dlg2.snap.restoreYes': { bn: 'হ্যাঁ, পুনরুদ্ধার করুন', hi: 'हाँ, पुनर्स्थापित करें', en: 'Yes, restore' },

  // ─── সহায়িকা (help-dialog) ───
  'dlg2.help.title': { bn: 'ব্যবহার নির্দেশিকা', hi: 'उपयोग निर्देशिका', en: 'User Guide' },
  'dlg2.help.desc': { bn: 'ছোট ছোট প্রশ্নে ক্লিক করে উত্তর দেখুন — সবকিছু বাংলায়।', hi: 'छोटे-छोटे प्रश्नों पर क्लिक करके उत्तर देखें — सब कुछ आपकी भाषा में।', en: 'Click a question to see the answer — everything in your own language.' },

  // ─── অ্যাবাউট কার্ড (help-dialog-এর প্রিমিয়াম ব্র্যান্ড প্যানেল) ───
  'dlg2.about.brand': { bn: 'বাংলা পাবলিশিং স্টুডিও', hi: 'बांग्ला पब्लिशिंग स्टूडियो', en: 'Bangla Publishing Studio' },
  'dlg2.about.edition': { bn: 'প্রিমিয়াম সংস্করণ ২.০ — পেশাদার বই টাইপসেটিং স্টুডিও', hi: 'प्रीमियम संस्करण २.० — पेशेवर पुस्तक टाइपसेटिंग स्टूडियो', en: 'Premium Edition 2.0 — professional book typesetting studio' },
  'dlg2.about.f1': { bn: 'তিন ভাষার ইন্টারফেস — বাংলা · हिन्दी · English', hi: 'तीन भाषाओं का इंटरफ़ेस — बांग्ला · हिन्दी · English', en: 'Trilingual interface — Bangla · हिन्दी · English' },
  'dlg2.about.f2': { bn: 'হিন্দি ফন্ট লাইব্রেরি — Kruti Dev, DevLys, Mangal ও আরও', hi: 'हिंदी फ़ॉन्ट लाइब्रेरी — Kruti Dev, DevLys, Mangal और भी', en: 'Hindi font library — Kruti Dev, DevLys, Mangal & more' },
  'dlg2.about.f3': { bn: 'প্রেস-রেডি ফরমা ছাপা — Demy · Crown · A4 স্বীকৃত ইমপোজিশন', hi: 'प्रेस-रेडी फ़रमा छपाई — Demy · Crown · A4 मानक इम्पोज़िशन', en: 'Press-ready Farma imposition — Demy · Crown · A4' },
  'dlg2.about.f4': { bn: 'ট্রু পেজিনেশন, পেজ টেমপ্লেট ও প্রতি-পাতার হেডার', hi: 'ट्रू पेजिनेशन, पेज टेम्पलेट और प्रति-पृष्ठ हेडर', en: 'True pagination, page templates & per-page headers' },
  'dlg2.about.f5': { bn: 'অফলাইন PWA — অটোসেভ, স্ন্যাপশট ও ভার্সন ব্যাকআপ', hi: 'ऑफ़लाइन PWA — ऑटोसेव, स्नैपशॉट और संस्करण बैकअप', en: 'Offline PWA — autosave, snapshots & version backup' },
  'dlg2.about.f6': { bn: 'এক্সপোর্ট — PDF · DOCX · EPUB · HTML · Markdown', hi: 'एक्सपोर्ट — PDF · DOCX · EPUB · HTML · Markdown', en: 'Export — PDF · DOCX · EPUB · HTML · Markdown' },

  // ধাপ ১ — লেখা শুরু
  'dlg2.help.s1.title': { bn: '✍️ লেখা শুরু ও অক্ষর বিন্যাস', hi: '✍️ लिखना शुरू करें और अक्षर प्रारूप', en: '✍️ Getting started & text formatting' },
  'dlg2.help.s1.i1': { bn: 'সাদা কাগজে সরাসরি ক্লিক করে লিখুন — ঠিক Word-এর মতোই।', hi: 'सफ़ेद कागज़ पर सीधे क्लिक करके लिखें — बिल्कुल Word की तरह।', en: 'Click straight onto the white paper and type — just like Word.' },
  'dlg2.help.s1.i2': { bn: 'Home ট্যাবে ফন্ট, সাইজ, রং, বোল্ড/ইটালিক, লাইন-স্পেসিং সব আছে।', hi: 'Home टैब में फ़ॉन्ट, साइज़, रंग, बोल्ड/इटैलिक, लाइन-स्पेसिंग सब कुछ है।', en: 'The Home tab has fonts, sizes, colors, bold/italic and line spacing.' },
  'dlg2.help.s1.i3': { bn: 'বাংলা যুক্তাক্ষর খুঁজতে Review → Conjuncts ব্যবহার করুন।', hi: 'बांग्ला संयुक्ताक्षर खोजने के लिए Review → Conjuncts इस्तेमाल करें।', en: 'Use Review → Conjuncts to find Bangla conjunct letters.' },

  // ধাপ ২ — হেডার/ফুটার
  'dlg2.help.s2.title': { bn: '📐 প্রতি পাতার হেডার/ফুটার আলাদা করে বদলানো', hi: '📐 हर पृष्ठ का हेडर/फ़ुटर अलग-अलग बदलें', en: '📐 Changing header/footer per page' },
  'dlg2.help.s2.i1': { bn: '{a} হেডার বদলাতে — সেই পাতার হেডারের লেখায় {b} করুন; শুধু ওই পাতাই বদলাবে, অন্য পাতা অক্ষত থাকবে।', hi: '{a} हेडर बदलने के लिए — उस पृष्ठ के हेडर के लेख पर {b} करें; केवल वही पृष्ठ बदलेगा, बाकी पृष्ठ अछूते रहेंगे।', en: 'To change the header of {a}, {b} on that page’s header text; only that page changes — all other pages stay untouched.' },
  'dlg2.help.s2.i1.a': { bn: 'এক পাতার', hi: 'एक पृष्ठ का', en: 'a single page' },
  'dlg2.help.s2.i1.b': { bn: 'ডাবল-ক্লিক', hi: 'डबल-क्लिक', en: 'double-click' },
  'dlg2.help.s2.i2': { bn: '{a} বদলাতে — Design → “Header & Footer Master” ব্যবহার করুন।', hi: '{a} बदलने के लिए — Design → “Header & Footer Master” इस्तेमाल करें।', en: 'To change {a} — use Design → “Header & Footer Master”.' },
  'dlg2.help.s2.i2.a': { bn: 'সব পাতা একসাথে', hi: 'सभी पृष्ठ एक साथ', en: 'all pages at once' },
  'dlg2.help.s2.i3': { bn: 'কোনো পাতার হেডার/ফুটার/নম্বর লুকাতে — পাতার উপরের “পৃষ্ঠা মেনু” → “হেডার/ফুটার লুকান” চাপুন (অধ্যায়ের শুরুর পাতায় কাজে লাগে)।', hi: 'किसी पृष्ठ का हेडर/फ़ुटर/नंबर छिपाने के लिए — पृष्ठ के ऊपर वाले “पेज मेनू” → “हेडर/फ़ुटर छिपाएँ” दबाएँ (अध्याय के पहले पृष्ठ पर काम आता है)।', en: 'To hide a page’s header/footer/number — use the “Page menu” at the top of the page → “Hide header/footer” (handy on chapter-opening pages).' },

  // ধাপ ৩ — আকৃতি/আইকন
  'dlg2.help.s3.title': { bn: '🧩 আকৃতি, ব্যানার, ফ্রেম ও আইকন (ভিতরে লেখা যায়)', hi: '🧩 आकृति, बैनर, फ़्रेम और आइकन (अंदर लिखा जा सकता है)', en: '🧩 Shapes, banners, frames & icons (you can write inside)' },
  'dlg2.help.s3.i1': { bn: 'Insert → {a} — ১২টি অলংকৃত ব্যানার/ফ্রেম/ব্যাজ; ক্লিক করলেই কাগজে বসে যায় এবং কার্সর ভিতরেই থাকে — সরাসরি লিখুন।', hi: 'Insert → {a} — १२ अलंकृत बैनर/फ़्रेम/बैज; क्लिक करते ही कागज़ पर टिक जाता है और कर्सर अंदर ही रहता है — सीधे लिखें।', en: 'Insert → {a} — 12 ornate banners/frames/badges; one click places it on the paper with the cursor inside — just type.' },
  'dlg2.help.s3.i1.a': { bn: 'Design Shapes', hi: 'डिज़ाइन आकृतियाँ', en: 'Design Shapes' },
  'dlg2.help.s3.i2': { bn: 'শেপের উপর মাউস রাখলে টুল বার ওঠে — আকৃতি বদল, মূল রং, অলংকারের রং, লেখার রং, মুছে ফেলা।', hi: 'आकृति पर माउस रखने पर टूल बार खुलता है — आकृति बदलना, मुख्य रंग, अलंकरण का रंग, लेख का रंग, मिटाना।', en: 'Hover a shape to open its toolbar — change shape, main color, ornament color, text color, delete.' },
  'dlg2.help.s3.i3': { bn: 'Insert → {a} — সাধারণ বর্ডার-বক্স; {b} — হাজারো আইকন।', hi: 'Insert → {a} — साधारण बॉर्डर-बॉक्स; {b} — हज़ारों आइकन।', en: 'Insert → {a} — a simple bordered box; {b} — thousands of icons.' },
  'dlg2.help.s3.i3.a': { bn: 'Text Box', hi: 'टेक्स्ट बॉक्स', en: 'Text Box' },
  'dlg2.help.s3.i3.b': { bn: 'Icon Library', hi: 'आइकन लाइब्रेरी', en: 'Icon Library' },

  // ধাপ ৪ — লিংক
  'dlg2.help.s4.title': { bn: '🔗 লেখা বা ছবিতে ওয়েবসাইট লিংক', hi: '🔗 लेख या चित्र में वेबसाइट लिंक', en: '🔗 Website links on text or images' },
  'dlg2.help.s4.i1': { bn: 'লেখার একটি অংশ সিলেক্ট করে Insert → {a} — লেখাটি ক্লিকযোগ্য হয়ে যাবে।', hi: 'लेख का कोई अंश चुनकर Insert → {a} — लेख क्लिक करने योग्य हो जाएगा।', en: 'Select a piece of text, then Insert → {a} — the text becomes clickable.' },
  'dlg2.help.s4.i1.a': { bn: 'Link', hi: 'लिंक', en: 'Link' },
  'dlg2.help.s4.i2': { bn: 'ছবিতে লিংক — ছবিতে ক্লিক করে “Add Link” চাপুন।', hi: 'चित्र पर लिंक — चित्र पर क्लिक करके “Add Link” दबाएँ।', en: 'Link on an image — click the image and press “Add Link”.' },
  'dlg2.help.s4.i3': { bn: 'Export → Print / Save as PDF করলে PDF-এও লিংক ক্লিকযোগ্য থাকে।', hi: 'Export → Print / Save as PDF करने पर PDF में भी लिंक क्लिक करने योग्य रहते हैं।', en: 'With Export → Print / Save as PDF, links stay clickable in the PDF too.' },

  // ধাপ ৫ — খোঁজ/বদল
  'dlg2.help.s5.title': { bn: '🔍 সম্পূর্ণ বইয়ে কিছু খোঁজা / বদলানো', hi: '🔍 पूरी पुस्तक में कुछ खोजना / बदलना', en: '🔍 Find / replace across the whole book' },
  'dlg2.help.s5.i1': { bn: 'Ctrl+F চাপুন বা Review → Find & Replace খুলুন।', hi: 'Ctrl+F दबाएँ या Review → Find & Replace खोलें।', en: 'Press Ctrl+F or open Review → Find & Replace.' },
  'dlg2.help.s5.i2': { bn: '“{a}” চাপলে সব পাতার সব মিল একসাথে বদলে যাবে।', hi: '“{a}” दबाने पर सभी पृष्ठों के सभी मिलान एक साथ बदल जाएँगे।', en: 'Pressing “{a}” replaces every match on every page at once.' },

  // ধাপ ৬ — ছবি
  'dlg2.help.s6.title': { bn: '🖼️ ছবি — সাইজ, ঘের ও লেখা পাশে রাখা', hi: '🖼️ चित्र — आकार, घेरा और लेख को पास में रखना', en: '🖼️ Images — size, frame & text wrap' },
  'dlg2.help.s6.i1': { bn: 'Insert → Image দিয়ে ছবি বসান; ছবি সিলেক্ট করলে কোণায় হাতল টেনে সাইজ বদলান।', hi: 'Insert → Image से चित्र लगाएँ; चित्र चुनने पर कोने का हैंडल खींचकर आकार बदलें।', en: 'Insert an image via Insert → Image; select it and drag the corner handles to resize.' },
  'dlg2.help.s6.i2': { bn: 'ছবির টুল থেকে Float Left/Right দিলে লেখা ছবির দুপাশে জড়িয়ে আসে (text wrap)।', hi: 'चित्र के टूल से Float Left/Right देने पर लेख चित्र के दोनों ओर लिपट जाता है (text wrap)।', en: 'Choose Float Left/Right from the image tools and text wraps around both sides of the image (text wrap).' },
  'dlg2.help.s6.i3': { bn: 'ছবি ড্র্যাগ করে ধরে সরানো যায়; ব্লকের বাঁ-পাশের হাতলে ধরে উপর-নিচও সরানো যায়।', hi: 'चित्र को ड्रैग करके खिसकाया जा सकता है; ब्लॉक के बाएँ हैंडल से पकड़कर ऊपर-नीचे भी सरकाया जा सकता है।', en: 'Drag an image to move it; grab the handle on the block’s left side to move it up and down too.' },

  // ধাপ ৭ — ফরমা ছাপা
  'dlg2.help.s7.title': { bn: '🖨️ ফরমা ছাপা (ছাপাখানার নিয়ম)', hi: '🖨️ फ़ार्मा छपाई (छपाईघर के नियम)', en: '🖨️ Imposition printing (print-shop rules)' },
  'dlg2.help.s7.i1': { bn: 'Export → Print / Save as PDF খুলুন → “ফরমা PDF” বাছুন।', hi: 'Export → Print / Save as PDF खोलें → “फ़ार्मा PDF” चुनें।', en: 'Open Export → Print / Save as PDF → choose “Imposition PDF”.' },
  'dlg2.help.s7.i2': { bn: 'ফরমা সাইজ (৪/৮/১৬/৩২ পৃষ্ঠা) ও সাইড বিন্যাস বাছুন।', hi: 'फ़ार्मा आकार (४/८/१६/३२ पृष्ठ) और साइड विन्यास चुनें।', en: 'Choose the imposition size (4/8/16/32 pages) and the side layout.' },
  'dlg2.help.s7.i3': { bn: 'প্রিন্ট ডায়ালগে {a} ও ডুপ্লেক্সে {b} রাখুন।', hi: 'प्रिंट डायलॉग में {a} और डुप्लेक्स में {b} रखें।', en: 'In the print dialog keep {a} and, for duplex, {b}.' },
  'dlg2.help.s7.i3.a': { bn: 'Scale 100%', hi: 'Scale 100%', en: 'Scale 100%' },
  'dlg2.help.s7.i3.b': { bn: 'Long-edge flip', hi: 'Long-edge flip', en: 'Long-edge flip' },
  'dlg2.help.s7.i4': { bn: 'শীট মাপ দেখে সেই মাপের কাগজ নিন; ভাঁজ-দাগ ধরে ভাঁজ করলেই পৃষ্ঠা ক্রম ঠিক।', hi: 'शीट का माप देखकर उसी माप का कागज़ लें; मोड़-रेखा के अनुदिश मोड़ते ही पृष्ठ-क्रम सही रहेगा।', en: 'Check the sheet size and take paper of that size; folding along the fold marks keeps the page order right.' },

  // ধাপ ৮ — সেভ/ব্যাকআপ
  'dlg2.help.s8.title': { bn: '💾 সেভ, ব্যাকআপ ও ক্রিয়েটিভ এক্সপোর্ট', hi: '💾 सेव, बैकअप और क्रिएटिव एक्सपोर्ट', en: '💾 Save, backup & creative export' },
  'dlg2.help.s8.i1': { bn: 'লিখলেই {a} হয় (ব্রাউজারে IndexedDB-তে) — ইন্টারনেট ছাড়াও চলে।', hi: 'लिखते ही {a} हो जाता है (ब्राउज़र में IndexedDB में) — इंटरनेट के बिना भी चलता है।', en: 'As you type, everything is {a} (stored in the browser via IndexedDB) — works without internet too.' },
  'dlg2.help.s8.i1.a': { bn: 'অটোসেভ', hi: 'ऑटोसेव', en: 'auto-saved' },
  'dlg2.help.s8.i2': { bn: 'নিয়মিত {a} নামিয়ে রাখুন — অন্য কম্পিউটারে “Open Backup” দিয়ে ফেরত আসে।', hi: 'नियमित रूप से {a} डाउनलोड करके रखें — किसी और कंप्यूटर पर “Open Backup” से वापस आता है।', en: 'Regularly download a {a} — on another computer, “Open Backup” brings it back.' },
  'dlg2.help.s8.i2.a': { bn: 'Backup (JSON)', hi: 'Backup (JSON)', en: 'Backup (JSON)' },
  'dlg2.help.s8.i3': { bn: 'ক্রিয়েটিভ আউটপুট: Export → {a}, Markdown, Plain Text।', hi: 'क्रिएटिव आउटपुट: Export → {a}, Markdown, Plain Text।', en: 'Creative output: Export → {a}, Markdown, Plain Text.' },
  'dlg2.help.s8.i3.a': { bn: 'EPUB (ই-বুক)', hi: 'EPUB (ई-बुक)', en: 'EPUB (e-book)' },

  'dlg2.help.s9.title': { bn: '🇮🇳 হিন্দি ফন্ট (Kruti Dev, DevLys, Mangal…)', hi: '🇮🇳 हिन्दी फ़ॉन्ट (Kruti Dev, DevLys, Mangal…)', en: '🇮🇳 Hindi fonts (Kruti Dev, DevLys, Mangal…)' },
  'dlg2.help.s9.i1': {
    bn: 'হোম ট্যাবের ফন্ট তালিকায় ৩টি গ্রুপ — ইউনিকোড দেবনাগরী ({a}, Aparajita, Kokila…), হিন্দি লিগ্যাসি ({b} সিরিজ, DevLys 010, Chanakya) ও বাংলা।',
    hi: 'होम टैब की फ़ॉन्ट सूची में 3 समूह — यूनिकोड देवनागरी ({a}, Aparajita, Kokila…), हिन्दी लीगेसी ({b} सीरीज़, DevLys 010, Chanakya) और बांग्ला।',
    en: 'The Home tab font list has 3 groups — Unicode Devanagari ({a}, Aparajita, Kokila…), Hindi legacy ({b} series, DevLys 010, Chanakya) and Bangla.',
  },
  'dlg2.help.s9.i1.a': { bn: 'Mangal', hi: 'Mangal', en: 'Mangal' },
  'dlg2.help.s9.i1.b': { bn: 'Kruti Dev', hi: 'Kruti Dev', en: 'Kruti Dev' },
  'dlg2.help.s9.i2': {
    bn: 'লিগ্যাসি ফন্ট নন-ইউনিকোড — {a} কীবোর্ড লেআউটে টাইপ করতে হয় (Word-এ Kruti Dev-এর মতো)। সব ফন্ট অ্যাপের ভেতরেই বান্ডেল, অফলাইনেও চলে।',
    hi: 'लीगेसी फ़ॉन्ट नॉन-यूनिकोड हैं — {a} कीबोर्ड लेआउट से टाइप करना होता है (Word में Kruti Dev जैसा)। सभी फ़ॉन्ट ऐप में बंडल हैं, ऑफ़लाइन भी चलते हैं।',
    en: 'Legacy fonts are non-Unicode — type using the {a} keyboard layout (same as Kruti Dev in Word). All fonts are bundled inside the app and work offline.',
  },
  'dlg2.help.s9.i2.a': { bn: 'Remington Gail', hi: 'Remington Gail', en: 'Remington Gail' },
  'dlg2.help.s9.i3': {
    bn: 'প্রিন্ট/PDF-এ ফন্ট হুবহু এমবেড হয়; DOCX এক্সপোর্টে ফন্টের নাম থাকে — যে কম্পিউটারে খুলবেন সেখানে ফন্ট ইনস্টল থাকলে একই রকম দেখাবে।',
    hi: 'प्रिंट/PDF में फ़ॉन्ट पूरी तरह एम्बेड होता है; DOCX एक्सपोर्ट में फ़ॉन्ट का नाम रहता है — जिस कंप्यूटर पर खोलेंगे वहाँ फ़ॉन्ट इंस्टॉल होने पर वैसा ही दिखेगा।',
    en: 'Print/PDF embeds fonts exactly; DOCX export carries the font name — it looks the same wherever the font is installed.',
  },

  // কীবোর্ড শর্টকাট
  'dlg2.help.shortcuts': { bn: 'কীবোর্ড শর্টকাট', hi: 'कीबोर्ड शॉर्टकट', en: 'Keyboard Shortcuts' },
  'dlg2.help.keys.bold': { bn: 'Ctrl+B / I / U', hi: 'Ctrl+B / I / U', en: 'Ctrl+B / I / U' },
  'dlg2.help.keys.find': { bn: 'Ctrl+F / Ctrl+H', hi: 'Ctrl+F / Ctrl+H', en: 'Ctrl+F / Ctrl+H' },
  'dlg2.help.keys.undo': { bn: 'Ctrl+Z / Ctrl+Y', hi: 'Ctrl+Z / Ctrl+Y', en: 'Ctrl+Z / Ctrl+Y' },
  'dlg2.help.keys.newpage': { bn: 'Ctrl+Enter', hi: 'Ctrl+Enter', en: 'Ctrl+Enter' },
  'dlg2.help.keys.save': { bn: 'Ctrl+S', hi: 'Ctrl+S', en: 'Ctrl+S' },
  'dlg2.help.keys.print': { bn: 'Ctrl+P', hi: 'Ctrl+P', en: 'Ctrl+P' },
  'dlg2.help.keys.zoom': { bn: 'স্ক্রল + Ctrl', hi: 'स्क्रॉल + Ctrl', en: 'Scroll + Ctrl' },
  'dlg2.help.sc.bold': { bn: 'বোল্ড / ইটালিক / আন্ডারলাইন', hi: 'बोल्ड / इटैलिक / अंडरलाइन', en: 'Bold / Italic / Underline' },
  'dlg2.help.sc.find': { bn: 'খোঁজ ও প্রতিস্থাপন (সব পাতায়)', hi: 'खोजें और बदलें (सभी पृष्ठों में)', en: 'Find & Replace (all pages)' },
  'dlg2.help.sc.undo': { bn: 'আনডু / রিডু', hi: 'अनडू / रीडू', en: 'Undo / Redo' },
  'dlg2.help.sc.newpage': { bn: 'কার্সর থেকে নতুন পাতা', hi: 'कर्सर से नया पृष्ठ', en: 'New page from cursor' },
  'dlg2.help.sc.save': { bn: 'সেভ (অটোসেভ সবসময় চালু)', hi: 'सेव (ऑटोसेव हमेशा चालू)', en: 'Save (autosave is always on)' },
  'dlg2.help.sc.print': { bn: 'প্রিন্ট / PDF', hi: 'प्रिंट / PDF', en: 'Print / PDF' },
  'dlg2.help.sc.zoom': { bn: 'জুম ইন/আউট (কাগজের উপর)', hi: 'ज़ूम इन/आउट (कागज़ पर)', en: 'Zoom in/out (on the paper)' },

  // ফুটার নোট
  'dlg2.help.foot': { bn: 'আরও কিছু দরকার হলে অ্যাপের ভেতরে কোনো টুলের উপর মাউস রাখুন — প্রতিটি টুলেই টুল-টিপ আছে।', hi: 'और कुछ चाहिए तो ऐप में किसी भी टूल पर माउस रखें — हर टूल पर टूल-टिप मौजूद है।', en: 'Need more? Hover any tool inside the app — every tool has a tooltip.' },
};
