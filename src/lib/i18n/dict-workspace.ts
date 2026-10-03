/**
 * অভিধান — navigator-panel, workspace, page-editor, context-menu, cover-view,
 * page-chrome, link-dialog, image-size-dialog, table-toolbar, static-content
 * কী-প্রিফিক্স: ws.
 */

import type { Dict } from './core';

export const dictWorkspace: Dict = {
  // ─── নেভিগেটর ───
  'ws.nav.aria': { bn: 'বইয়ের আউটলাইন', hi: 'पुस्तक की रूपरेखा', en: 'Book outline' },
  'ws.nav.title': { bn: 'আউটলাইন', hi: 'आउटलाइन', en: 'Outline' },
  'ws.nav.counts': { bn: '{a}টি অধ্যায় · {b}টি শিরোনাম', hi: '{a} अध्याय · {b} शीर्षक', en: '{a} chapters · {b} headings' },
  'ws.nav.close': { bn: 'নেভিগেটর বন্ধ করুন', hi: 'नेविगेटर बंद करें', en: 'Close navigator' },
  'ws.nav.searchPh': { bn: 'শিরোনাম খুঁজুন…', hi: 'शीर्षक खोजें…', en: 'Search headings…' },
  'ws.nav.filterAria': { bn: 'আউটলাইন ফিল্টার', hi: 'आउटलाइन फ़िल्टर', en: 'Outline filter' },
  'ws.nav.empty': { bn: 'কোনো শিরোনাম নেই — লেখায় H1/H2/H3 স্টাইল ব্যবহার করুন', hi: 'कोई शीर्षक नहीं — लेखन में H1/H2/H3 शैली का उपयोग करें', en: 'No headings yet — use the H1/H2/H3 styles in your text' },

  // ─── ওয়ার্কস্পেস / পৃষ্ঠা মেনু ───
  'ws.pages.aria': { bn: 'বইয়ের পৃষ্ঠাসমূহ', hi: 'पुस्तक के पृष्ठ', en: 'Book pages' },
  'ws.page.menu': { bn: 'পৃষ্ঠা মেনু', hi: 'पृष्ठ मेनू', en: 'Page menu' },
  'ws.page.n': { bn: 'পৃষ্ঠা {n}', hi: 'पृष्ठ {n}', en: 'Page {n}' },
  'ws.page.newAfter': { bn: 'এই পৃষ্ঠার পরে নতুন', hi: 'इस पृष्ठ के बाद नया', en: 'New page after this one' },
  'ws.page.duplicate': { bn: 'পৃষ্ঠা ডুপ্লিকেট', hi: 'पृष्ठ की प्रतिलिपि', en: 'Duplicate page' },
  'ws.page.pullUp': { bn: 'নিচের পাতার লেখা এই পাতায় তুলুন', hi: 'नीचे के पृष्ठ का लेख इस पृष्ठ पर लाएँ', en: 'Pull text from the next page onto this page' },
  'ws.page.moveUp': { bn: 'উপরে সরান', hi: 'ऊपर ले जाएँ', en: 'Move up' },
  'ws.page.moveDown': { bn: 'নিচে সরান', hi: 'नीचे লे जाएँ', en: 'Move down' },
  'ws.page.showChrome': { bn: 'হেডার/ফুটার দেখান', hi: 'हेडर/फ़ूटर दिखाएँ', en: 'Show header/footer' },
  'ws.page.hideChrome': { bn: 'হেডার/ফুটার লুকান', hi: 'हेडर/फ़ूटर छिपाएँ', en: 'Hide header/footer' },
  'ws.page.editCustom': { bn: 'এই পাতার কাস্টম হেডার/ফুটার সম্পাদনা…', hi: 'इस पृष्ठ का कस्टम हेडर/फ़ूटर संपादित करें…', en: 'Edit this page’s custom header/footer…' },
  'ws.page.customizeChrome': { bn: 'এই পাতার হেডার/ফুটার কাস্টমাইজ…', hi: 'इस पृष्ठ का हेडर/फ़ूटर अनुकूलित करें…', en: 'Customize this page’s header/footer…' },
  'ws.page.resetChrome': { bn: 'গ্লোবাল হেডার/ফুটারে ফিরুন', hi: 'ग्लोबल हेडर/फ़ूटर पर वापस जाएँ', en: 'Revert to the global header/footer' },
  'ws.page.delete': { bn: 'পৃষ্ঠা মুছুন', hi: 'পृষ्ठ मिटाएँ', en: 'Delete page' },
  'ws.page.addNew': { bn: 'নতুন পৃষ্ঠা যোগ করুন', hi: 'नया पृष्ठ जोड़ें', en: 'Add a new page' },
  'ws.toast.pullOpen': { bn: 'পাতাটি এখনো খোলেনি — পাতাটিতে ক্লিক করে আবার চেষ্টা করুন', hi: 'पृष्ठ अभी खुला नहीं है — उस पर क्लिक करके फिर से प्रयास करें', en: 'That page isn’t open yet — click on it and try again' },
  'ws.toast.pullMoved': { bn: 'নিচের পাতা থেকে ফাঁকা জায়গামতো লেখা উঠে এসেছে', hi: 'नीचे के पृष्ठ से खाली जगह के अनुसार लेख ऊपर आ गया', en: 'Text was pulled up from the next page to fill the empty space' },
  'ws.toast.pullAbsorbed': { bn: 'পরের পাতার সব লেখা এই পাতায় উঠে এসেছে — খালি পাতাটি মুছে গেছে', hi: 'अगले पृष्ठ का पूरा लेख इस पृष्ठ पर आ गया — खाली पृष्ठ मिटा दिया गया', en: 'All the text from the next page moved onto this page — the empty page was deleted' },
  'ws.toast.pullNoFit': { bn: 'পরের পাতার প্রথম ব্লকটি ফাঁকা জায়গায় আঁটে না', hi: 'अगले पृष्ठ का पहला ब्लॉक खाली जगह में फ़िट नहीं होता', en: 'The next page’s first block doesn’t fit in the empty space' },
  'ws.toast.pullNone': { bn: 'এই পাতার পরে টানার মতো কনটেন্ট নেই', hi: 'इस पृष्ठ के बाद खींचने लायक कोई सामग्री नहीं', en: 'There is no content after this page to pull' },
  'ws.toast.chromeReset': { bn: 'এই পাতার হেডার/ফুটার গ্লোবাল মাস্টার অনুযায়ী হালনাগাদ হয়েছে', hi: 'इस पृष्ठ का हेडर/फ़ूटर ग्लोबल मास्टर के अनुसार अद्यतन हो गया', en: 'This page’s header/footer has been reset to the global master' },
  'ws.toast.saved': { bn: 'সংরক্ষিত হয়েছে — অটোসেভ সবসময় চালু আছে', hi: 'सेव हो गया — ऑटोसेव हमेशा चालू रहता है', en: 'Saved — autosave is always on' },

  // ─── পেজ এডিটর ───
  'ws.placeholder': { bn: 'লিখতে শুরু করুন…', hi: 'लिखना शुरू करें…', en: 'Start writing…' },

  // ─── কভার ───
  'ws.cover.untitled': { bn: 'বইয়ের নাম', hi: 'पुस्तक का नाम', en: 'Book title' },
  'ws.cover.guide': { bn: 'গাইড', hi: 'गाइड', en: 'Guide' },
  'ws.cover.compiledBy': { bn: 'সংকলন: {a}', hi: 'संकलन: {a}', en: 'Compiled by {a}' },
  'ws.cover.writtenBy': { bn: 'লিখেছেন: {a}', hi: 'लेखक: {a}', en: 'Written by {a}' },

  // ─── হেডার/ফুটার ক্রোম ───
  'ws.chrome.editHint': { bn: 'সম্পাদনা করতে ডাবল-ক্লিক করুন', hi: 'संपादित करने के लिए डबल-क्लिक करें', en: 'Double-click to edit' },
  'ws.chrome.autoHint': { bn: 'স্বয়ংক্রিয় কনটেন্ট — Header & Footer থেকে সম্পাদনা করুন', hi: 'स्वतः सामग्री — Header & Footer से संपादित करें', en: 'Automatic content — edit via Header & Footer' },
  'ws.chrome.zoneAria': { bn: 'হেডার/ফুটার লেখা', hi: 'हेडर/फ़ूटर पाठ', en: 'Header/footer text' },

  // ─── লিংক ডায়ালগ ───
  'ws.link.editTitle': { bn: 'লিংক সম্পাদনা', hi: 'लिंक संपादित करें', en: 'Edit link' },
  'ws.link.addImageTitle': { bn: 'ছবিতে লিংক যোগ করুন', hi: 'चित्र में लिंक जोड़ें', en: 'Add link to image' },
  'ws.link.addTitle': { bn: 'লিংক যোগ করুন', hi: 'लिंक जोड़ें', en: 'Add link' },
  'ws.link.descImage': { bn: 'ছবিতে ক্লিক করলে এই ওয়েবসাইটে যাবে — PDF ও HTML এক্সপোর্টেও কাজ করে।', hi: 'चित्र पर क्लिक करने पर यह वेबसाइट खुलेगी — PDF और HTML एक्सपोर्ट में भी काम करता है।', en: 'Clicking the image will open this website — it also works in PDF & HTML export.' },
  'ws.link.descText': { bn: 'লেখায় ক্লিকযোগ্য লিংক বসবে — PDF প্রিন্টেও ক্লিকযোগ্য থাকে।', hi: 'लेखन में क्लिक-योग्य लिंक लगेगा — PDF प्रिंट में भी क्लिक-योग्य रहता है।', en: 'A clickable link will be set in the text — it stays clickable in printed PDF too.' },
  'ws.link.urlLabel': { bn: 'ওয়েবসাইটের লিংক (URL)', hi: 'वेबसाइट का लिंक (URL)', en: 'Website link (URL)' },
  'ws.link.urlPh': { bn: 'যেমন: www.example.com বা https://example.com/book', hi: 'जैसे: www.example.com या https://example.com/book', en: 'e.g. www.example.com or https://example.com/book' },
  'ws.link.textLabel': { bn: 'প্রদর্শিত লেখা', hi: 'दिखाने का पाठ', en: 'Text to display' },
  'ws.link.textHint': { bn: '(সিলেকশন খালি হলে)', hi: '(चयन खाली होने पर)', en: '(when the selection is empty)' },
  'ws.link.textPh': { bn: 'যেমন: আমাদের ওয়েবসাইট', hi: 'जैसे: हमारी वेबसाइट', en: 'e.g. Our website' },
  'ws.link.newTab': { bn: 'নতুন ট্যাবে খুলুন', hi: 'नए टैब में खोलें', en: 'Open in new tab' },
  'ws.link.tip': { bn: 'টিপ: PDF বানাতে Export → Print / Save as PDF ব্যবহার করুন — Chrome-এর “Save as PDF”-এ লিংকগুলো ক্লিকযোগ্য থাকে।', hi: 'टिप: PDF बनाने के लिए Export → Print / Save as PDF का उपयोग करें — Chrome के “Save as PDF” में लिंक क्लिक-योग्य रहते हैं।', en: 'Tip: to build a PDF use Export → Print / Save as PDF — links stay clickable in Chrome’s “Save as PDF”.' },
  'ws.link.remove': { bn: 'লিংক মুছুন', hi: 'लिंक मिटाएँ', en: 'Remove link' },
  'ws.link.update': { bn: 'হালনাগাদ', hi: 'अद्यतन करें', en: 'Update' },
  'ws.link.apply': { bn: 'লিংক বসান', hi: 'लिंक लगाएँ', en: 'Set link' },
  'ws.link.open': { bn: 'লিংক খুলুন', hi: 'लिंक खोलें', en: 'Open link' },
  'ws.link.copyAddr': { bn: 'লিংক ঠিকানা কপি', hi: 'लिंक पता कॉपी करें', en: 'Copy link address' },

  // ─── ছবির সাইজ ডায়ালগ ───
  'ws.img.title': { bn: 'ছবির সাইজ ও পজিশন', hi: 'चित्र का आकार और स्थिति', en: 'Image size & position' },
  'ws.img.desc': { bn: 'প্রস্থ-উচ্চতা, অ্যালাইনমেন্ট ও টেক্সট র‍্যাপিং নির্দিষ্ট করুন। প্রিন্টে হুবহু একই সাইজ আসবে।', hi: 'चौड़ाई-ऊँचाई, संरेखण और टेक्स्ट रैपिंग निर्दिष्ट करें। प्रिंट में हूबहू वही आकार आएगा।', en: 'Set width/height, alignment and text wrapping. It prints at exactly the same size.' },
  'ws.img.width': { bn: 'প্রস্থ', hi: 'चौड़ाई', en: 'Width' },
  'ws.img.height': { bn: 'উচ্চতা', hi: 'ऊँचाई', en: 'Height' },
  'ws.img.unit': { bn: 'একক', hi: 'इकाई', en: 'Unit' },
  'ws.img.lock': { bn: 'অনুপাত লক করুন (প্রস্থ-উচ্চতা যুক্ত)', hi: 'अनुपात लॉक करें (चौड़ाई-ऊँचाई आपस में जुड़ी)', en: 'Lock aspect ratio (width and height linked)' },
  'ws.img.contentWidth': { bn: '· কনটেন্ট প্রস্থ {n} px', hi: '· सामग्री चौड़ाई {n} px', en: '· content width {n} px' },
  'ws.img.resetNatural': { bn: 'মূল সাইজে ফিরুন', hi: 'मूल आकार पर लौटाएँ', en: 'Reset to original size' },
  'ws.img.fitContent': { bn: 'কনটেন্টের প্রস্থে ফিট করুন', hi: 'सामग्री की चौड़ाई में फ़िट करें', en: 'Fit to content width' },
  'ws.img.posLabel': { bn: 'পজিশন / অ্যালাইনমেন্ট', hi: 'स्थिति / संरेखण', en: 'Position / alignment' },
  'ws.img.posFloatNote': { bn: '(ভাসমান অবস্থায় প্রযোজ্য নয়)', hi: '(तैरते समय लागू नहीं)', en: '(not applicable while floating)' },
  'ws.img.wrapLabel': { bn: 'টেক্সট র‍্যাপিং', hi: 'टेक्स्ट रैपिंग', en: 'Text wrapping' },
  'ws.img.styleDefault': { bn: 'ডিফল্ট', hi: 'डिफ़ॉल्ट', en: 'default' },
  'ws.img.save': { bn: 'সংরক্ষণ করুন', hi: 'सेव करें', en: 'Save' },
  'ws.imgunit.cm': { bn: 'সেমি (cm)', hi: 'सेमी (cm)', en: 'Centimeters (cm)' },
  'ws.imgunit.mm': { bn: 'মিমি (mm)', hi: 'मिमी (mm)', en: 'Millimeters (mm)' },
  'ws.imgunit.pct': { bn: '% (কনটেন্ট প্রস্থ)', hi: '% (सामग्री चौड़ाई)', en: '% (content width)' },
  'ws.imgunit.px': { bn: 'পিক্সেল (px)', hi: 'পিক্সेल (px)', en: 'Pixels (px)' },
  'ws.wrap.inline': { bn: 'লেখার সাথে ইনলাইন', hi: 'लेखन के साथ इनलাইन', en: 'Inline with text' },
  'ws.wrap.inlineHint': { bn: 'ছবি নিজস্ব লাইনে থাকবে — টেক্সট মোড়াবে না', hi: 'चित्र अपनी लाइन पर रहेगा — टेक्स्ट लिपटेगा नहीं', en: 'The image sits on its own line — text will not wrap' },
  'ws.wrap.left': { bn: 'বামে ভাসমান (টেক্সট মোড়ে)', hi: 'बाएँ तैरता (टेक्स्ट लिपटेगा)', en: 'Float left (text wraps)' },
  'ws.wrap.leftHint': { bn: 'ছবি বাঁ দিকে ভেসে থাকবে, লেখা পাশ দিয়ে মোড়াবে', hi: 'चित्र बाईं ओर तैरा रहेगा, लेखन बगल से लिपटेगा', en: 'The image floats to the left and the text wraps beside it' },
  'ws.wrap.right': { bn: 'ডানে ভাসমান', hi: 'दाएँ तैरता', en: 'Float right' },
  'ws.wrap.rightHint': { bn: 'ছবি ডান দিকে ভেসে থাকবে, লেখা পাশ দিয়ে মোড়াবে', hi: 'चित्र दाईं ओर तैरा रहेगा, लेखन बगल से लिपटेगा', en: 'The image floats to the right and the text wraps beside it' },

  // ─── অ্যালাইন (কনটেক্সট-মেনু + ডায়ালগ শেয়ার্ড) ───
  'ws.align.left': { bn: 'বামে', hi: 'बाएँ', en: 'Left' },
  'ws.align.center': { bn: 'মাঝখানে', hi: 'मध्य में', en: 'Center' },
  'ws.align.right': { bn: 'ডানে', hi: 'दाएँ', en: 'Right' },

  // ─── কনটেক্সট-মেনু: ছবি ───
  'ws.img.sizeDialog': { bn: 'ছবির সাইজ ও পজিশন…', hi: 'चित्र का आकार और स्थिति…', en: 'Image size & position…' },
  'ws.img.small': { bn: 'ছোট — ৩০%', hi: 'छोटा — ३०%', en: 'Small — 30%' },
  'ws.img.medium': { bn: 'মাঝারি — ৫৫%', hi: 'मध्यम — ५५%', en: 'Medium — 55%' },
  'ws.img.large': { bn: 'বড় — ৮০%', hi: 'बड़ा — ८०%', en: 'Large — 80%' },
  'ws.img.full': { bn: 'পূর্ণ প্রস্থ — ১০০%', hi: 'पूर्ण चौड़ाई — १००%', en: 'Full width — 100%' },
  'ws.img.floatLeft': { bn: 'ছবি বাঁয়ে — লেখা ডান পাশে', hi: 'चित्र बाएँ — लेखन दाईं ओर', en: 'Image left — text on the right' },
  'ws.img.floatRight': { bn: 'ছবি ডানে — লেখা বাঁ পাশে', hi: 'चित्र दाएँ — लेखन बाईं ओर', en: 'Image right — text on the left' },
  'ws.img.noWrap': { bn: 'র‍্যাপ বন্ধ (নিজস্ব লাইনে)', hi: 'रैप बंद (अपनी लाइन पर)', en: 'No wrap (its own line)' },
  'ws.img.removeBorder': { bn: 'বর্ডার সরান', hi: 'बॉर्डर हटाएँ', en: 'Remove border' },
  'ws.img.addBorder': { bn: 'বর্ডার যোগ করুন', hi: 'बॉर्डर जोड़ें', en: 'Add border' },
  'ws.img.linkEdit': { bn: 'লিংক সম্পাদনা…', hi: 'लिंक संपादित करें…', en: 'Edit link…' },
  'ws.img.linkAdd': { bn: 'ছবিতে লিংক যোগ করুন…', hi: 'चित्र में लिंक जोड़ें…', en: 'Add link to image…' },
  'ws.img.copy': { bn: 'ছবি কপি করুন', hi: 'चित्र कॉपी करें', en: 'Copy image' },
  'ws.img.delete': { bn: 'ছবি মুছুন', hi: 'चित्र मिटाएँ', en: 'Delete image' },
  'ws.toast.imgCopyFail': { bn: 'ছবি কপি করা যায়নি', hi: 'चित्र कॉपी नहीं हो सका', en: 'Could not copy the image' },

  // ─── কনটেক্সট-মেনু: সেকশন হেডার ───
  'ws.ctx.hSize': { bn: 'সাইজ', hi: 'आकार', en: 'Size' },
  'ws.ctx.hAlign': { bn: 'অ্যালাইন', hi: 'संरेखण', en: 'Align' },
  'ws.ctx.hWrap': { bn: 'টেক্সট র‍্যাপ', hi: 'टेक्स्ट रैप', en: 'Text wrap' },
  'ws.ctx.hFrame': { bn: 'ফ্রেম', hi: 'फ़्रेम', en: 'Frame' },
  'ws.ctx.hLink': { bn: 'লিংক', hi: 'लिंक', en: 'Link' },
  'ws.ctx.hAdd': { bn: 'যোগ করুন', hi: 'जोड़ें', en: 'Insert' },
  'ws.ctx.hHeader': { bn: 'হেডার', hi: 'हेडर', en: 'Header' },
  'ws.ctx.hCell': { bn: 'সেল', hi: 'सेल', en: 'Cell' },
  'ws.ctx.hMove': { bn: 'সরান', hi: 'स्थानांतरित करें', en: 'Move' },
  'ws.ctx.hDelete': { bn: 'মুছুন', hi: 'मिटाएँ', en: 'Delete' },
  'ws.ctx.hClipboard': { bn: 'ক্লিপবোর্ড', hi: 'क्लिपबोर्ड', en: 'Clipboard' },
  'ws.ctx.hFormat': { bn: 'ফরম্যাট', hi: 'फ़ॉर्मैट', en: 'Format' },
  'ws.ctx.hColor': { bn: 'রং', hi: 'रंग', en: 'Color' },
  'ws.ctx.hParagraph': { bn: 'প্যারাগ্রাফ', hi: 'पैराग्राफ', en: 'Paragraph' },
  'ws.ctx.hBlock': { bn: 'ব্লক', hi: 'ब्लॉक', en: 'Block' },

  // ─── কনটেক্সট-মেনু: টেক্সট আইটেম ───
  'ws.ctx.cut': { bn: 'কাট করুন', hi: 'कट करें', en: 'Cut' },
  'ws.ctx.copy': { bn: 'কপি করুন', hi: 'कॉपी करें', en: 'Copy' },
  'ws.ctx.paste': { bn: 'পেস্ট করুন', hi: 'पेस्ट करें', en: 'Paste' },
  'ws.ctx.selectAll': { bn: 'সব নির্বাচন করুন', hi: 'सबका चयन करें', en: 'Select All' },
  'ws.ctx.bold': { bn: 'বোল্ড', hi: 'बोल्ड', en: 'Bold' },
  'ws.ctx.italic': { bn: 'ইটালিক', hi: 'इटैलिक', en: 'Italic' },
  'ws.ctx.underline': { bn: 'আন্ডারলাইন', hi: 'अंडरलाइन', en: 'Underline' },
  'ws.ctx.strike': { bn: 'স্ট্রাইকথ্রু', hi: 'स्ट्राइकथ्रू', en: 'Strikethrough' },
  'ws.ctx.superscript': { bn: 'সুপারস্ক্রিপ্ট', hi: 'सुपरस्क्रिप्ट', en: 'Superscript' },
  'ws.ctx.subscript': { bn: 'সাবস্ক্রিপ্ট', hi: 'सबस्क्रिप्ट', en: 'Subscript' },
  'ws.ctx.textColor': { bn: 'লেখা', hi: 'पाठ', en: 'Text' },
  'ws.ctx.highlight': { bn: 'হাইলাইট', hi: 'हाइलाइट', en: 'Highlight' },
  'ws.ctx.default': { bn: 'ডিফল্ট', hi: 'डिफ़ॉल्ट', en: 'Default' },
  'ws.ctx.alignLeft': { bn: 'বামে সারান', hi: 'बाएँ संरेखित करें', en: 'Align Left' },
  'ws.ctx.alignCenter': { bn: 'মাঝে সারান', hi: 'मध्य में संरेखित करें', en: 'Align Center' },
  'ws.ctx.alignRight': { bn: 'ডানে সারান', hi: 'दाएँ संरेखित कরें', en: 'Align Right' },
  'ws.ctx.justify': { bn: 'জাস্টিফাই', hi: 'जस्टिफ़ाई', en: 'Justify' },
  'ws.ctx.bullets': { bn: 'বুলেট', hi: 'बुलेट', en: 'Bullets' },
  'ws.ctx.numbering': { bn: 'নম্বর তালিকা', hi: 'क्रमांकित सूची', en: 'Numbering' },
  'ws.ctx.clearFormat': { bn: 'ফরম্যাট মুছুন', hi: 'फ़ॉर्मैट हटाएँ', en: 'Clear Formatting' },
  'ws.ctx.blkUp': { bn: 'ব্লক উপরে সরান', hi: 'ब्लॉक ऊपर ले जाएँ', en: 'Move block up' },
  'ws.ctx.blkDown': { bn: 'ব্লক নিচে সরান', hi: 'ब्लॉक नीचে লे জाएँ', en: 'Move block down' },
  'ws.ctx.menuAria': { bn: 'কনটেন্ট মেনু', hi: 'कंटेंट मेनू', en: 'Content menu' },
  'ws.toast.pasteNoRead': { bn: 'এই ব্রাউজার ক্লিপবোর্ড পড়তে দেয় না — Ctrl+V চাপুন', hi: 'यह ब्राउज़र क्लिपबोर्ड पढ़ने नहीं देता — Ctrl+V दबाएँ', en: 'This browser doesn’t allow reading the clipboard — press Ctrl+V' },
  'ws.toast.pasteFail': { bn: 'ক্লিপবোর্ড পড়া গেল না — Ctrl+V চাপুন', hi: 'क्लिपबोर्ड पढ़ा नहीं जा सका — Ctrl+V दबाएँ', en: 'Could not read the clipboard — press Ctrl+V' },
  'ws.toast.linkCopied': { bn: 'লিংক কপি হয়েছে', hi: 'लिंक कॉपी हो गया', en: 'Link copied' },
  'ws.swatch.none': { bn: 'নেই', hi: 'कोई नहीं', en: 'None' },

  // ─── কনটেক্সট-মেনু: টেবিল ───
  'ws.tbl.rowAbove': { bn: 'উপরে সারি যোগ', hi: 'ऊपर पंक्ति जोड़ें', en: 'Add row above' },
  'ws.tbl.rowBelow': { bn: 'নিচে সারি যোগ', hi: 'नीचे पंक्ति জोड़ें', en: 'Add row below' },
  'ws.tbl.colLeft': { bn: 'বামে কলাম', hi: 'बाएँ कॉलम', en: 'Column left' },
  'ws.tbl.colRight': { bn: 'ডানে কলাম', hi: 'दाएँ कॉलम', en: 'Column right' },
  'ws.tbl.headerRowToggle': { bn: 'হেডার সারি চালু/বন্ধ', hi: 'हेडर पंक्ति चालू/बंद', en: 'Toggle header row' },
  'ws.tbl.headerColToggle': { bn: 'হেডার কলাম চালু/বন্ধ', hi: 'हेडर कॉलम चालू/बंद', en: 'Toggle header column' },
  'ws.tbl.merge': { bn: 'সেল মার্জ', hi: 'सेल मर्ज करें', en: 'Merge cells' },
  'ws.tbl.split': { bn: 'সেল স্প্লিট', hi: 'सेल विभाजित करें', en: 'Split cell' },
  'ws.tbl.vTop': { bn: 'সেল ভার্টিক্যাল অ্যালাইন — উপরে', hi: 'सेल लंबवत संरेखण — ऊपर', en: 'Cell vertical align — top' },
  'ws.tbl.vMiddle': { bn: 'সেল ভার্টিক্যাল অ্যালাইন — মাঝখানে', hi: 'सेल लंबवत संरेखण — मध्य में', en: 'Cell vertical align — middle' },
  'ws.tbl.vBottom': { bn: 'সেল ভার্টিক্যাল অ্যালাইন — নিচে', hi: 'सेल लंबवत संरेखण — नीचे', en: 'Cell vertical align — bottom' },
  'ws.tbl.resetWidth': { bn: 'সেলের প্রস্থ রিসেট', hi: 'सेल की चौड़ाई रीसेट करें', en: 'Reset cell width' },
  'ws.tbl.cellColor': { bn: 'সেলের রং', hi: 'सेल का रंग', en: 'Cell color' },
  'ws.tbl.moveUp': { bn: 'টেবিল উপরে সরান', hi: 'टेबल ऊपर ले जाएँ', en: 'Move table up' },
  'ws.tbl.moveDown': { bn: 'টেবিল নিচে সরান', hi: 'टेबल नीचे ले जाएँ', en: 'Move table down' },
  'ws.tbl.lineAbove': { bn: 'উপরে ফাঁকা লাইন', hi: 'ऊपर खाली लाइन', en: 'Empty line above' },
  'ws.tbl.lineBelow': { bn: 'নিচে ফাঁকা লাইন', hi: 'नीचे খाली লाइन', en: 'Empty line below' },
  'ws.tbl.delRow': { bn: 'সারি মুছুন', hi: 'पंक्ति मिटाएँ', en: 'Delete row' },
  'ws.tbl.delCol': { bn: 'কলাম মুছুন', hi: 'कॉलम मिटाएँ', en: 'Delete column' },
  'ws.tbl.delTable': { bn: 'টেবিল মুছুন', hi: 'टेबल मिटाएँ', en: 'Delete table' },

  // ─── ভাসমান টেবিল টুলবার ───
  'ws.tblbar.aria': { bn: 'টেবিল টুলবার', hi: 'टेबल टूलबार', en: 'Table toolbar' },
  'ws.tblbar.addRowBelow': { bn: 'নিচে সারি যোগ করুন', hi: 'नीचे पंक्ति जोड़ें', en: 'Add row below' },
  'ws.tblbar.addColRight': { bn: 'ডানে কলাম যোগ করুন', hi: 'दाएँ कॉलम जोड़ें', en: 'Add column right' },
  'ws.tblbar.deleteTip': { bn: 'সারি / কলাম / টেবিল মুছুন', hi: 'पंक्ति / कॉलम / टेबल मिटाएँ', en: 'Delete row / column / table' },
  'ws.tblbar.mergeTip': { bn: 'সেল মার্জ (একাধিক সেল সিলেক্ট করুন)', hi: 'सेल मर्ज करें (एकाधिक सेल चुनें)', en: 'Merge cells (select multiple cells)' },
  'ws.tblbar.cellBg': { bn: 'সেলের ব্যাকগ্রাউন্ড রং', hi: 'सेल का बैकग्राउंड रंग', en: 'Cell background color' },
  'ws.tblbar.noColor': { bn: 'রং ছাড়ান', hi: 'रंग हटाएँ', en: 'No color' },

  // ─── স্ট্যাটিক প্রিভিউ ───
  'ws.static.imgAlt': { bn: 'ছবি', hi: 'चित्र', en: 'Image' },
  'ws.static.mcqTag': { bn: 'প্রশ্ন', hi: 'प्रश्न', en: 'Question' },
};

// ─── লাইভ নোডভিউ ফলব্যাক (extensions.tsx — কলআউট/MCQ/ফুটনোট/সূচিপত্র) ───
dictWorkspace['ws.callout.titleAria'] = { bn: 'বক্সের শিরোনাম', hi: 'बॉक्स का शीर्षक', en: 'Box title' };
dictWorkspace['ws.callout.delete'] = { bn: 'বক্স মুছুন', hi: 'बॉक्स मिटाएँ', en: 'Delete box' };
dictWorkspace['ws.mcq.edit'] = { bn: 'সম্পাদনা', hi: 'संपादित करें', en: 'Edit' };
dictWorkspace['ws.delete'] = { bn: 'মুছুন', hi: 'मिटाएँ', en: 'Delete' };
dictWorkspace['ws.mcq.deleteAria'] = { bn: 'প্রশ্ন মুছুন', hi: 'प्रश्न मिटाएँ', en: 'Delete question' };
dictWorkspace['ws.mcq.qEmpty'] = { bn: 'প্রশ্ন লিখুন (✎ চাপুন)', hi: 'प्रश्न लिखें (✎ दबाएँ)', en: 'Write the question (press ✎)' };
dictWorkspace['ws.mcq.qPlaceholder'] = { bn: 'প্রশ্ন লিখুন', hi: 'प्रश्न लिखें', en: 'Write the question' };
dictWorkspace['ws.mcq.answerTitle'] = { bn: 'সঠিক উত্তর চিহ্নিত করুন', hi: 'सही उत्तर चिह्नित करें', en: 'Mark the correct answer' };
dictWorkspace['ws.mcq.optPlaceholder'] = { bn: 'অপশন ({n})', hi: 'विकल्प ({n})', en: 'Option ({n})' };
dictWorkspace['ws.mcq.explPlaceholder'] = { bn: 'ব্যাখ্যা (ঐচ্ছিক)', hi: 'व्याख्या (वैकल्पिक)', en: 'Explanation (optional)' };
dictWorkspace['ws.mcq.done'] = { bn: 'সম্পন্ন', hi: 'पूर्ण', en: 'Done' };
dictWorkspace['ws.fn.placeholder'] = { bn: 'ফুটনোটের লেখা…', hi: 'फुटनोट का टेक्स्ट…', en: 'Footnote text…' };
dictWorkspace['ws.fn.delete'] = { bn: 'ফুটনোট মুছুন', hi: 'फुटनोट मिटाएँ', en: 'Delete footnote' };
dictWorkspace['ws.toc.delete'] = { bn: 'সূচিপত্র মুছুন', hi: 'विषय-सूची मिटाएँ', en: 'Delete table of contents' };
dictWorkspace['ws.toc.empty'] = { bn: 'এখনো কোনো শিরোনাম নেই — H1/H2/H3 লিখে ডিজাইন ট্যাব থেকে “{btn}” চাপুন।', hi: 'अभी कोई शीर्षक नहीं है — H1/H2/H3 लिखें और डिज़ाइन टैब से “{btn}” दबाएँ।', en: 'No headings yet — write H1/H2/H3 and press “{btn}” from the Design tab.' };
