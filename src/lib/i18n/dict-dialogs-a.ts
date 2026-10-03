/**
 * অভিধান — dialogs group A: header-footer, page-chrome, cover, templates, projects
 * কী-প্রিফিক্স: dlg1.
 *
 * বিদ্যমান বাংলা স্ট্রিং bn-এ হুবহু রাখা হয়েছে; hi হলো প্রমিত দেবনাগরী হিন্দি,
 * en হলো পরিমার্জিত ইংরেজি। ডায়নামিক মান {n}/{c}/{name}/{d} প্লেসহোল্ডারে।
 */

import type { Dict } from './core';

export const dictDialogsA: Dict = {
  // ─── শেয়ারড — রং পিকার (hf / chrome / cover) ───
  'dlg1.color.named': { bn: 'রং {c}', hi: 'रंग {c}', en: 'Color {c}' },
  'dlg1.color.custom': { bn: 'কাস্টম রং', hi: 'कस्टम रंग', en: 'Custom color' },

  // ─── হেডার/ফুটার ও পেজ নম্বর মাস্টার (header-footer-dialog) ───
  'dlg1.hf.title': { bn: 'হেডার, ফুটার ও পেজ নম্বর মাস্টার', hi: 'हेडर, फुटर और पेज नंबर मास्टर', en: 'Header, Footer & Page Number Master' },
  'dlg1.hf.desc': { bn: 'একবার সেট করলে সব পাতায় স্বয়ংক্রিয়ভাবে প্রযোজ্য হবে (Lock Across Pages)', hi: 'एक बार सेट करने पर सभी पृष्ठों पर स्वतः लागू हो जाएगा (Lock Across Pages)', en: 'Set once — applies automatically to all pages (Lock Across Pages)' },
  'dlg1.hf.header': { bn: 'হেডার', hi: 'हेडर', en: 'Header' },
  'dlg1.hf.footer': { bn: 'ফুটার', hi: 'फुटर', en: 'Footer' },
  'dlg1.hf.pagenum': { bn: 'পেজ নম্বর', hi: 'पेज नंबर', en: 'Page Number' },
  'dlg1.hf.on': { bn: 'চালু', hi: 'चालू', en: 'On' },
  'dlg1.hf.left': { bn: 'বাম টেক্সট', hi: 'बायाँ टेक्स्ट', en: 'Left text' },
  'dlg1.hf.center': { bn: 'মাঝের টেক্সট', hi: 'मध्य टेक्स्ट', en: 'Center text' },
  'dlg1.hf.right': { bn: 'ডান টেক্সট', hi: 'दायाँ टेक्स्ट', en: 'Right text' },
  'dlg1.hf.leftTopic': { bn: 'বাম টেক্সট (টপিক/অধ্যায়)', hi: 'बायाँ टेक्स्ट (विषय/अध्याय)', en: 'Left text (topic/chapter)' },
  'dlg1.hf.rightBook': { bn: 'ডান টেক্সট (বইয়ের নাম)', hi: 'दायाँ टेक्स्ट (पुस्तक का नाम)', en: 'Right text (book name)' },
  'dlg1.hf.lineColor': { bn: 'দাগের রং:', hi: 'रेखा का रंग:', en: 'Rule color:' },
  'dlg1.hf.fontSize': { bn: 'ফন্ট সাইজ (pt):', hi: 'फ़ॉन्ट आकार (pt):', en: 'Font size (pt):' },
  'dlg1.hf.format': { bn: 'ফরম্যাট', hi: 'फ़ॉर्मैट', en: 'Format' },
  'dlg1.hf.position': { bn: 'অবস্থান', hi: 'स्थिति', en: 'Position' },
  'dlg1.hf.startAt': { bn: 'প্রথম নম্বর', hi: 'पहला नंबर', en: 'First number' },
  'dlg1.hf.prefix': { bn: 'প্রিফিক্স', hi: 'प्रीफ़िक्स', en: 'Prefix' },
  'dlg1.hf.prefixPh': { bn: 'যেমন: পৃষ্ঠা ', hi: 'जैसे: पृष्ठ ', en: 'e.g. Page ' },
  'dlg1.hf.diffFirst': { bn: 'ভিন্ন প্রথম পৃষ্ঠা (কভারে লুকান)', hi: 'भिन्न प्रथम पृष्ठ (कवर पर छिपाएँ)', en: 'Different first page (hide on cover)' },
  'dlg1.hf.oddEven': { bn: 'অজর/জোড় পাতায় বিপরীত অ্যালাইনমেন্ট', hi: 'विषम/सम पृष्ठों पर विपरीत संरेखण', en: 'Mirrored alignment on odd/even pages' },
  'dlg1.hf.tip': { bn: 'টিপ: নির্দিষ্ট পৃষ্ঠার “পৃষ্ঠা মেনু” থেকে সেই পাতার হেডার/ফুটার আলাদাভাবে লুকানো যায় (অধ্যায়ের শুরুর পাতার জন্য)।', hi: 'टिप: किसी विशेष पृष्ठ का हेडर/फुटर “पृष्ठ मेनू” से अलग से छिपाया जा सकता है (अध्याय के प्रारंभ पृष्ठ के लिए)।', en: 'Tip: a specific page’s header/footer can be hidden separately via its “Page menu” (for chapter-opening pages).' },
  'dlg1.hf.palette': { bn: 'রং প্যালেট: {n}টি প্রিসেট রঙ লেখার রং হিসেবে হোম ট্যাবে পাওয়া যায়।', hi: 'रंग पैलेट: {n} प्रीसेट रंग लेखन रंग के रूप में होम टैब में उपलब्ध हैं।', en: 'Color palette: {n} preset colors are available as text colors in the Home tab.' },

  // স্টাইল কার্ড (হেডার/ফুটার মাস্টার)
  'dlg1.hf.style.parallel': { bn: 'প্যারালাল TEXT (উদ্ভাস স্টাইল)', hi: 'समानांतर TEXT (उद्भास शैली)', en: 'Parallel TEXT (glow style)' },
  'dlg1.hf.styleDesc.parallel': { bn: 'ডাবল দাগ, বামে টপিক ট্যাগ, ডানে বইয়ের নাম', hi: 'डबल रेखा, बाएँ विषय-टैग, दाएँ पुस्तक का नाम', en: 'Double rule, topic tag on the left, book name on the right' },
  'dlg1.hf.style.royal': { bn: 'ক্লাসিক বুক (রয়্যাল ফ্লোরিশ)', hi: 'क्लासिक पुस्तक (रॉयल फ्लोरिश)', en: 'Classic book (royal flourish)' },
  'dlg1.hf.styleDesc.royal': { bn: 'সেন্টারে অলংকৃত ফ্লোরিশ ও শিরোনাম', hi: 'मध्य में अलंकृत फ्लोरिश और शीर्षक', en: 'Ornate flourish and title centered' },
  'dlg1.hf.style.academic': { bn: 'একাডেমিক মিনিমাল', hi: 'अकादमिक मिनिमल', en: 'Academic minimal' },
  'dlg1.hf.styleDesc.academic': { bn: 'স্লিম বর্ডার ও বাম-ডান টেক্সট', hi: 'पतली बॉर्डर और बाएँ-दाएँ टेक्स्ट', en: 'Slim border with left-right text' },
  'dlg1.hf.style.plain': { bn: 'সাধারণ', hi: 'सादा', en: 'Plain' },
  'dlg1.hf.styleDesc.plain': { bn: 'শুধু টেক্সট, দাগ নেই', hi: 'केवल टेक्स्ट, कोई रेखा नहीं', en: 'Text only, no rule' },
  'dlg1.hf.style.none': { bn: 'নেই', hi: 'कोई नहीं', en: 'None' },
  'dlg1.hf.styleDesc.none': { bn: 'হেডার/ফুটার বন্ধ', hi: 'हेडर/फुटर बंद', en: 'Header/footer off' },

  // স্টাইল প্রিভিউ-র নমুনা লেখা
  'dlg1.hf.prev.chapterTopic': { bn: 'অধ্যায় ১ — টপিক', hi: 'अध्याय १ — विषय', en: 'Chapter 1 — Topic' },
  'dlg1.hf.prev.bookName': { bn: 'বইয়ের নাম', hi: 'पुस्तक का नाम', en: 'Book name' },
  'dlg1.hf.prev.bookOrnament': { bn: '❦ বইয়ের নাম ❦', hi: '❦ पुस्तक का नाम ❦', en: '❦ Book name ❦' },
  'dlg1.hf.prev.chapterName': { bn: 'অধ্যায়ের নাম', hi: 'अध्याय का नाम', en: 'Chapter name' },
  'dlg1.hf.prev.org': { bn: 'প্রতিষ্ঠান', hi: 'संस्थान', en: 'Institution' },
  'dlg1.hf.prev.off': { bn: '(বন্ধ)', hi: '(बंद)', en: '(Off)' },

  // পেজ নম্বর ফরম্যাট ('hindi' = দেবনাগরী সংখ্যা — নতুন)
  'dlg1.pnfmt.bangla': { bn: 'বাংলা (১, ২, ৩)', hi: 'बांग्ला (१, २, ३)', en: 'Bengali (১, ২, ৩)' },
  'dlg1.pnfmt.hindi': { bn: 'হিন্দি (০১২৩)', hi: 'हिन्दी (०१२३)', en: 'Hindi (०१२३)' },
  'dlg1.pnfmt.english': { bn: 'ইংরেজি (1, 2, 3)', hi: 'अंग्रेज़ी (१, २, ३)', en: 'English (1, 2, 3)' },
  'dlg1.pnfmt.roman': { bn: 'রোমান (I, II, III)', hi: 'रोमन (I, II, III)', en: 'Roman (I, II, III)' },

  // পেজ নম্বরের অবস্থান
  'dlg1.pos.bottom-center': { bn: 'নিচে-মাঝে', hi: 'नीचे-मध्य', en: 'Bottom center' },
  'dlg1.pos.bottom-right': { bn: 'নিচে-ডানে', hi: 'नीचे-दाएँ', en: 'Bottom right' },
  'dlg1.pos.bottom-left': { bn: 'নিচে-বাঁয়ে', hi: 'नीचे-बाएँ', en: 'Bottom left' },
  'dlg1.pos.top-center': { bn: 'উপরে-মাঝে', hi: 'ऊपर-मध्य', en: 'Top center' },
  'dlg1.pos.top-right': { bn: 'উপরে-ডানে', hi: 'ऊपर-दाएँ', en: 'Top right' },
  'dlg1.pos.top-left': { bn: 'উপরে-বাঁয়ে', hi: 'ऊपर-बाएँ', en: 'Top left' },

  // ─── পৃষ্ঠা-নির্দিষ্ট কাস্টম হেডার/ফুটার (page-chrome-dialog) ───
  'dlg1.chrome.style.parallel': { bn: 'প্যারালাল (ডাবল দাগ)', hi: 'समानांतर (डबल रेखा)', en: 'Parallel (double rule)' },
  'dlg1.chrome.style.royal': { bn: 'রয়্যাল ফ্লোরিশ', hi: 'रॉयल फ्लोरिश', en: 'Royal flourish' },
  'dlg1.chrome.style.academic': { bn: 'একাডেমিক', hi: 'अकादमिक', en: 'Academic' },
  'dlg1.chrome.style.plain': { bn: 'সাধারণ', hi: 'सादा', en: 'Plain' },
  'dlg1.chrome.style.none': { bn: 'নেই (বন্ধ)', hi: 'कोई नहीं (बंद)', en: 'None (off)' },
  'dlg1.chrome.resetGlobal': { bn: 'গ্লোবালে ফিরুন', hi: 'ग्लोबल पर वापस लाएँ', en: 'Back to global' },
  'dlg1.chrome.color': { bn: 'রং:', hi: 'रंग:', en: 'Color:' },
  'dlg1.chrome.globalLine': { bn: 'গ্লোবাল {a}: {b} · {c}', hi: 'ग्लोबल {a}: {b} · {c}', en: 'Global {a}: {b} · {c}' },
  'dlg1.chrome.empty': { bn: '(খালি)', hi: '(खाली)', en: '(empty)' },
  'dlg1.chrome.title': { bn: 'পৃষ্ঠা {n} — কাস্টম হেডার ও ফুটার', hi: 'पृष्ठ {n} — कस्टम हेडर और फुटर', en: 'Page {n} — Custom Header & Footer' },
  'dlg1.chrome.desc': { bn: 'সাধারণভাবে সব পাতায় একই হেডার/ফুটার চলে। শুধু এই পাতায় ভিন্ন হেডার/ফুটার চাইলে নিচে সেট করুন — বাকি পাতাগুলো গ্লোবাল মাস্টার মেনেই চলবে।', hi: 'सामान्यतः सभी पृष्ठों पर एक ही हेडर/फुटर चलता है। केवल इस पृष्ठ पर भिन्न हेडर/फुटर चाहिए तो नीचे सेट करें — बाकी पृष्ठ ग्लोबल मास्टर के अनुसार ही चलेंगे।', en: 'By default all pages share the same header/footer. To use a different one on this page only, set it below — the other pages keep following the global master.' },
  'dlg1.chrome.customHeader': { bn: 'কাস্টম হেডার (শুধু এই পাতায়)', hi: 'कस्टम हेडर (केवल इस पृष्ठ पर)', en: 'Custom header (this page only)' },
  'dlg1.chrome.customFooter': { bn: 'কাস্টম ফুটার (শুধু এই পাতায়)', hi: 'कस्टम फुटर (केवल इस पृष्ठ पर)', en: 'Custom footer (this page only)' },
  'dlg1.chrome.headerOn': { bn: 'চালু — এই পাতায় নিচের হেডার প্রযোজ্য', hi: 'चालू — इस पृष्ठ पर नीचे दिया गया हेडर लागू होगा', en: 'On — the header below applies to this page' },
  'dlg1.chrome.headerOff': { bn: 'বন্ধ — গ্লোবাল হেডার ব্যবহৃত হচ্ছে', hi: 'बंद — ग्लोबल हेडर उपयोग में है', en: 'Off — the global header is in use' },
  'dlg1.chrome.footerOn': { bn: 'চালু — এই পাতায় নিচের ফুটার প্রযোজ্য', hi: 'चालू — इस पृष्ठ पर नीचे दिया गया फुटर लागू होगा', en: 'On — the footer below applies to this page' },
  'dlg1.chrome.footerOff': { bn: 'বন্ধ — গ্লোবাল ফুটার ব্যবহৃত হচ্ছে', hi: 'बंद — ग्लोबल फुटर उपयोग में है', en: 'Off — the global footer is in use' },
  'dlg1.chrome.headerToggle': { bn: 'কাস্টম হেডার চালু/বন্ধ', hi: 'कस्टम हेडर चालू/बंद', en: 'Toggle custom header' },
  'dlg1.chrome.footerToggle': { bn: 'কাস্টম ফুটার চালু/বন্ধ', hi: 'कस्टम फुटर चालू/बंद', en: 'Toggle custom footer' },
  'dlg1.chrome.tip': { bn: 'টিপ: পেজ নম্বর এখনো গ্লোবাল সেটিংস মেনে চলে (ডিজাইন ট্যাবে পরিবর্তন করা যায়)। কোনো পাতায় সব লুকাতে চাইলে “পৃষ্ঠা মেনু → হেডার/ফুটার লুকান” ব্যবহার করুন।', hi: 'टिप: पेज नंबर अभी भी ग्लोबल सेटिंग के अनुसार चलता है (डिज़ाइन टैब में बदला जा सकता है)। किसी पृष्ठ पर सब कुछ छिपाने के लिए “पृष्ठ मेनू → हेडर/फुटर छिपाएँ” का उपयोग करें।', en: 'Tip: page numbers still follow the global settings (change them in the Design tab). To hide everything on a page, use “Page menu → Hide header/footer”.' },

  // ─── কভার পেজ জেনারেটর (cover-dialog) ───
  'dlg1.cover.style.classic': { bn: 'ক্লাসিক (সাহিত্য)', hi: 'क्लासिक (साहित्य)', en: 'Classic (literature)' },
  'dlg1.cover.style.modern': { bn: 'আধুনিক', hi: 'आधुनिक', en: 'Modern' },
  'dlg1.cover.style.coaching': { bn: 'কোচিং/একাডেমি', hi: 'कोचिंग/अकादमी', en: 'Coaching/Academy' },
  'dlg1.cover.edit': { bn: 'কভার পেজ সম্পাদনা', hi: 'कवर पृष्ठ संपादन', en: 'Edit Cover Page' },
  'dlg1.cover.new': { bn: 'কভার পেজ জেনারেটর', hi: 'कवर पृष्ठ जेनरेटर', en: 'Cover Page Generator' },
  'dlg1.cover.desc': { bn: 'তথ্য দিন — প্রথম পৃষ্ঠায় সুন্দর প্রচ্ছদ তৈরি হবে (হেডার/ফুটার ছাড়া)', hi: 'जानकारी भरें — पहले पृष्ठ पर सुंदर प्रच्छद बनेगा (हेडर/फुटर रहित)', en: 'Fill in the details — a beautiful cover will be generated on the first page (no header/footer)' },
  'dlg1.cover.bookTitle': { bn: 'বইয়ের নাম *', hi: 'पुस्तक का नाम *', en: 'Book name *' },
  'dlg1.cover.phTitle': { bn: 'যেমন: মাধ্যমিক গণিত সম্পূর্ণ গাইড', hi: 'जैसे: माध्यमिक गणित सम्पूर्ण गाइड', en: 'e.g. Secondary Mathematics Complete Guide' },
  'dlg1.cover.subtitle': { bn: 'সাবটাইটেল', hi: 'सबटाइटल', en: 'Subtitle' },
  'dlg1.cover.phSubtitle': { bn: 'যেমন: অধ্যায় ১-১০ সমাধানসহ', hi: 'जैसे: अध्याय १-१० समाधान सहित', en: 'e.g. with chapter 1-10 solutions' },
  'dlg1.cover.org': { bn: 'প্রতিষ্ঠান', hi: 'प्रतिष्ठान', en: 'Institution' },
  'dlg1.cover.phOrg': { bn: 'যেমন: উজ্জ্বল একাডেমি', hi: 'जैसे: उज्ज्वल अकादमी', en: 'e.g. Ujjwal Academy' },
  'dlg1.cover.course': { bn: 'শ্রেণি/কোর্স', hi: 'कक्षा/कोर्स', en: 'Class/Course' },
  'dlg1.cover.phCourse': { bn: 'যেমন: নবম-দশম শ্রেণি', hi: 'जैसे: नौवीं-दसवीं कक्षा', en: 'e.g. Class 9-10' },
  'dlg1.cover.author': { bn: 'লেখক/সংকলক', hi: 'लेखक/संकलक', en: 'Author/Compiler' },
  'dlg1.cover.year': { bn: 'সাল/সংস্করণ', hi: 'वर्ष/संस्करण', en: 'Year/Edition' },
  'dlg1.cover.styleLabel': { bn: 'স্টাইল', hi: 'स्टाइल', en: 'Style' },
  'dlg1.cover.accent': { bn: 'অ্যাকসেন্ট রং', hi: 'एक्सेंट रंग', en: 'Accent color' },
  'dlg1.cover.toastUpdated': { bn: 'কভার হালনাগাদ হয়েছে', hi: 'कवर अपडेट हो गया', en: 'Cover updated' },
  'dlg1.cover.toastAdded': { bn: 'কভার পেজ প্রথম পৃষ্ঠায় যোগ হয়েছে', hi: 'कवर पृष्ठ पहले पृष्ठ पर जोड़ा गया', en: 'Cover page added as the first page' },
  'dlg1.cover.update': { bn: 'হালনাগাদ করুন', hi: 'अपडेट करें', en: 'Update' },
  'dlg1.cover.create': { bn: 'কভার তৈরি করুন', hi: 'कवर बनाएँ', en: 'Create Cover' },

  // ─── পেজ টেমপ্লেট গ্যালারি (templates-dialog) ───
  'dlg1.tpl.title': { bn: '📚 বইয়ের পেজ টেমপ্লেট', hi: '📚 पुस्तक पृष्ठ टेम्पलेट', en: '📚 Book Page Templates' },
  'dlg1.tpl.badge': { bn: '{n}টি প্রো ডিজাইন', hi: '{n} प्रो डिज़ाइन', en: '{n} pro designs' },
  'dlg1.tpl.desc': { bn: 'কার্ডে যে ডিজাইন দেখছেন — ক্লিক করলে ঠিক সেটিই নতুন পাতা বসবে (বর্তমান পাতার পরে)।', hi: 'कार्ड पर जो डिज़ाइन देख रहे हैं — क्लिक करने पर ठीक वैसा ही नया पृष्ठ जुड़ेगा (वर्तमान पृष्ठ के बाद)।', en: 'The design you see on each card is exactly what you get — click to insert it as a new page (after the current page).' },
  'dlg1.tpl.descMore': { bn: ' “এই পাতায়” বোতামে বর্তমান পাতার লেখা বদলে ডিজাইনটি বসে।', hi: ' “इस पृष्ठ पर” बटन से वर्तमान पृष्ठ का लेख बदलकर डिज़ाइन लग जाता है।', en: ' The “On this page” button replaces the current page’s content with the design.' },
  'dlg1.tpl.catAria': { bn: 'টেমপ্লেট ক্যাটাগরি', hi: 'टेम्पलेट श्रेणी', en: 'Template categories' },
  'dlg1.tpl.all': { bn: 'সবগুলো', hi: 'सभी', en: 'All' },
  'dlg1.tpl.tip': { bn: 'টিপস: প্লেসহোল্ডার লেখাগুলো মুছে নিজের তথ্য বসান — ছবি, আইকন ও বক্স সবই পরে বদলানো যায়।', hi: 'टिप्स: प्लेसहोल्डर लेख हटाकर अपनी जानकारी भरें — चित्र, आइकन और बॉक्स सब बाद में बदले जा सकते हैं।', en: 'Tips: clear the placeholder text and add your own — images, icons and boxes can all be changed later.' },
  'dlg1.tpl.ariaAdd': { bn: '{name} টেমপ্লেট নতুন পাতায় যোগ করুন', hi: '{name} टेम्पलेट नए पृष्ठ के रूप में जोड़ें', en: 'Add the {name} template as a new page' },
  'dlg1.tpl.ariaReplace': { bn: 'বর্তমান পাতার লেখা বদলে “{name}” বসান', hi: 'वर्तमान पृष्ठ का लेख बदलकर “{name}” लगाएँ', en: 'Replace the current page content with “{name}”' },
  'dlg1.tpl.thisPage': { bn: 'এই পাতায়', hi: 'इस पृष्ठ पर', en: 'On this page' },
  'dlg1.tpl.replaceTip': { bn: 'বর্তমান পাতার লেখা মুছে এই ডিজাইন বসান', hi: 'वर्तमान पृष्ठ का लेख मिटाकर यह डिज़ाइन लगाएँ', en: 'Clear the current page content and apply this design' },
  'dlg1.tpl.replaceNo': { bn: 'কভার পাতায় প্রয়োগ করা যাবে না', hi: 'कवर पृष्ठ पर लागू नहीं किया जा सकता', en: 'Cannot be applied to the cover page' },
  'dlg1.tpl.previewRows': { bn: '{n} উপাদানের প্রিভিউ', hi: '{n} तत्वों का प्रीव्यू', en: 'Preview with {n} elements' },
  'dlg1.tpl.toastAdded': { bn: '“{name}” নতুন পাতায় যোগ হয়েছে', hi: '“{name}” नए पृष्ठ के रूप में जुड़ गया', en: '“{name}” added as a new page' },
  'dlg1.tpl.toastAddedDesc': { bn: 'পাতাটি বর্তমান পাতার ঠিক পরে বসেছে — এখন নিজের মতো এডিট করুন।', hi: 'पृष्ठ वर्तमान पृष्ठ के ठीक बाद जोड़ा गया है — अब अपने अनुसार संपादित करें।', en: 'The page was inserted right after the current page — edit it to your liking now.' },
  'dlg1.tpl.toastReplaced': { bn: 'বর্তমান পাতায় “{name}” বসানো হয়েছে', hi: 'वर्तमान पृष्ठ पर “{name}” लगा दिया गया', en: '“{name}” applied to the current page' },
  'dlg1.tpl.confirmTitle': { bn: 'বর্তমান পাতার লেখা বদলে বসান?', hi: 'वर्तमान पृष्ठ का लेख बदलकर लगाएँ?', en: 'Replace the current page content?' },
  'dlg1.tpl.confirmDesc': { bn: 'এই পাতার এখনকার সব লেখা মুছে “{name}” ডিজাইনটি বসবে। এটি ফেরানো যাবে না — গুরুত্বপূর্ণ লেখা থাকলে আগে নতুন পাতা হিসেবে যোগ করুন।', hi: 'इस पृष्ठ का मौजूदा सारा लेख मिटकर “{name}” डिज़ाइन लग जाएगा। यह वापस नहीं आएगा — महत्वपूर्ण लेख हो तो पहले उसे नए पृष्ठ के रूप में जोड़ लें।', en: 'All current text on this page will be cleared and the “{name}” design will take its place. This cannot be undone — if the content matters, add it as a new page first.' },
  'dlg1.tpl.confirmYes': { bn: 'হ্যাঁ, বদলে বসান', hi: 'हाँ, बदलकर लगाएँ', en: 'Yes, replace it' },

  // ─── প্রজেক্ট ম্যানেজার (projects-dialog) ───
  'dlg1.projects.title': { bn: 'আমার বইসমূহ', hi: 'मेरी पुस्तकें', en: 'My Books' },
  'dlg1.projects.desc': { bn: 'সব বই এই ব্রাউজারের IndexedDB-তে অফলাইনে সংরক্ষিত — {n}টি বই পাওয়া গেছে', hi: 'सभी पुस्तकें इस ब्राउज़र के IndexedDB में ऑफ़लाइन सहेजी गई हैं — {n} पुस्तक मिलीं', en: 'All books are stored offline in this browser’s IndexedDB — {n} book(s) found' },
  'dlg1.projects.empty': { bn: 'কোনো বই নেই — নতুন বই তৈরি করুন', hi: 'कोई पुस्तक नहीं — नई पुस्तक बनाएँ', en: 'No books yet — create a new book' },
  'dlg1.projects.lastEdit': { bn: 'শেষ সম্পাদনা: {d}', hi: 'अंतिम संपादन: {d}', en: 'Last edited: {d}' },
  'dlg1.projects.openBadge': { bn: 'খোলা আছে', hi: 'खुली है', en: 'Open' },
  'dlg1.projects.open': { bn: 'খুলুন', hi: 'खोलें', en: 'Open' },
  'dlg1.projects.copy': { bn: 'কপি', hi: 'कॉपी', en: 'Duplicate' },
  'dlg1.projects.delete': { bn: 'মুছুন', hi: 'मिटाएँ', en: 'Delete' },
  'dlg1.projects.confirmDelete': { bn: 'নিশ্চিত?', hi: 'निश्चित?', en: 'Sure?' },
  'dlg1.projects.toastDeleted': { bn: 'বইটি মুছে ফেলা হয়েছে', hi: 'पुस्तक मिटा दी गई', en: 'Book deleted' },
  'dlg1.projects.new': { bn: 'নতুন বই তৈরি করুন', hi: 'नई पुस्तक बनाएँ', en: 'Create New Book' },
};
