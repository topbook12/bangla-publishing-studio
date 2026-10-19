/**
 * অভিধান — insert-tab (সন্নিবেশ ট্যাব)
 * কী-প্রিফিক্স: ins.
 */

import type { Dict } from './core';

export const dictInsert: Dict = {
  // ─── রিবন গ্রুপ ───
  'ins.group.tablesMedia': { bn: 'টেবিল ও মিডিয়া', hi: 'तालिका और मीडिया', en: 'Tables & Media' },
  'ins.group.tableTools': { bn: 'টেবিল টুলস', hi: 'तालिका उपकरण', en: 'Table Tools' },
  'ins.group.iconsDesign': { bn: 'আইকন ও ডিজাইন', hi: 'आइकन और डिज़ाइन', en: 'Icons & Design' },
  'ins.group.academic': { bn: 'একাডেমিক ব্লক', hi: 'शैक्षणिक ब्लॉक', en: 'Academic Blocks' },
  'ins.group.pageDecor': { bn: 'পাতা ও সাজসজ্জা', hi: 'पृष्ठ और सजावट', en: 'Page & Decor' },

  // ─── টেবিল ───
  'ins.table': { bn: 'টেবিল', hi: 'तालिका', en: 'Table' },
  'ins.table.grid': { bn: 'সারি × কলাম নির্বাচন করুন', hi: 'पंक्तियाँ × कॉलम चुनें', en: 'Select rows × columns' },
  'ins.table.cell': { bn: 'সারি {r} · কলাম {c}', hi: 'पंक्ति {r} · कॉलम {c}', en: 'Row {r} · Column {c}' },
  'ins.t.addRow': { bn: 'সারি যোগ', hi: 'पंक्ति जोड़ें', en: 'Add Row' },
  'ins.t.addCol': { bn: 'কলাম যোগ', hi: 'कॉलम जोड़ें', en: 'Add Column' },
  'ins.t.delRow': { bn: 'সারি মুছুন', hi: 'पंक्ति मिटाएँ', en: 'Delete Row' },
  'ins.t.delCol': { bn: 'কলাম মুছুন', hi: 'कॉलम मिटाएँ', en: 'Delete Column' },
  'ins.t.delTable': { bn: 'টেবিল মুছুন', hi: 'तालिका मिटाएँ', en: 'Delete Table' },

  // ─── ছবি ───
  'ins.image': { bn: 'ছবি', hi: 'चित्र', en: 'Image' },
  'ins.toast.imageBig': { bn: 'ছবিটি ৪ MB-এর বড় — ছোট ছবি ব্যবহার করুন', hi: 'चित्र ४ MB से बड़ा है — कृपया छोटा चित्र उपयोग करें', en: 'Image is larger than 4 MB — please use a smaller image' },

  // ─── বিভাজক ───
  'ins.divider': { bn: 'বিভাজক', hi: 'विभाजक', en: 'Divider' },
  'ins.divider.title': { bn: 'অলংকারমূলক বিভাজক', hi: 'अलंकृत विभाजक', en: 'Decorative Divider' },
  'ins.div.single': { bn: '─── একক রেখা', hi: '─── एकल रेखा', en: '─── Single Line' },
  'ins.div.double': { bn: '═══ দ্বৈত রেখা', hi: '═══ दोहरी रेखा', en: '═══ Double Line' },
  'ins.div.dotted': { bn: '┄┄┄ বিন্দুযুক্ত রেখা', hi: '┄┄┄ बिंदुदार रेखा', en: '┄┄┄ Dotted Line' },
  'ins.div.flourish': { bn: '❦ ─── ❖ ─── ❦ অলংকৃত নকশা', hi: '❦ ─── ❖ ─── ❦ अलंकृत नक्शा', en: '❦ ─── ❖ ─── ❦ Flourish' },
  'ins.div.stars': { bn: '✦ ─── ✦ ─── ✦ তারকা', hi: '✦ ─── ✦ ─── ✦ तारे', en: '✦ ─── ✦ ─── ✦ Stars' },
  'ins.div.cut': { bn: '✂ ─ ─ ─ Cut Line (ফরমা কাটা)', hi: '✂ ─ ─ ─ कट लाइन (फ़रमा कट)', en: '✂ ─ ─ ─ Cut Line (die cut)' },

  // ─── সূচিপত্র ───
  'ins.toc': { bn: 'সূচিপত্র', hi: 'विषय-सूची', en: 'Table of Contents' },
  'ins.toc.title': { bn: 'এখানে স্বয়ংক্রিয়ভাবে তৈরি সূচিপত্র বসান', hi: 'यहाँ स्वतः-निर्मित विषय-सूची डालें', en: 'Insert an auto-generated table of contents here' },
  'ins.toast.tocEmpty': { bn: 'কোনো শিরোনাম (H1/H2/H3) পাওয়া যায়নি — খালি সূচিপত্র বসানো হয়েছে। পরে "Update" চাপুন।', hi: 'अभी कोई शीर्षक (H1/H2/H3) नहीं मिला — खाली विषय-सूची डाल दी गई है। बाद में "Update" दबाएँ।', en: 'No headings (H1/H2/H3) found yet — an empty TOC was inserted. Press "Update" later.' },

  // ─── আইকন লাইব্রেরি ডায়ালগ ───
  'ins.iconlib': { bn: 'আইকন লাইব্রেরি', hi: 'आइकन लाइब्रेरी', en: 'Icon Library' },
  'ins.iconlib.tip': { bn: '৩০০+ আইকন ও অলংকার চিহ্ন — সার্চ করে যোগ করুন', hi: '३००+ आइकन और अलंकरण चिह्न — खोजकर जोड़ें', en: '300+ icons & ornaments — search and insert' },
  'ins.iconlib.desc': { bn: '{a}+ আইকন ও {b}টি অলংকার চিহ্ন — বাংলা বা ইংরেজিতে খুঁজুন, সাইজ ও রং ঠিক করে যোগ করুন।', hi: '{a}+ आइकन और {b} अलंकरण चिह्न — बांग्ला या अंग्रेज़ी नाम से खोजें, आकार और रंग चुनकर जोड़ें।', en: '{a}+ icons and {b} ornaments — search in Bangla or English, then set size & color and insert.' },
  'ins.iconlib.searchPh': { bn: 'খুঁজুন… (যেমন: তারা, বই, heart, arrow, ফুল)', hi: 'खोजें… (जैसे: star, book, heart, arrow)', en: 'Search… (e.g. star, book, heart, flower)' },
  'ins.iconlib.searchAria': { bn: 'আইকন খুঁজুন', hi: 'आइकन खोजें', en: 'Search icons' },
  'ins.all': { bn: 'সব', hi: 'सभी', en: 'All' },
  'ins.iconlib.noresult': { bn: '“{q}” এর জন্য কোনো আইকন পাওয়া যায়নি — অন্য শব্দ চেষ্টা করুন।', hi: '“{q}” के लिए कोई आइकन नहीं मिला — कोई दूसरा शब्द आज़माएँ।', en: 'No icons found for “{q}” — try another word.' },
  'ins.iconlib.recent': { bn: 'সাম্প্রতিক ব্যবহৃত', hi: 'हाल में उपयोग किए गए', en: 'Recently used' },
  'ins.iconlib.count': { bn: '— {n}টি', hi: '— {n} आइकन', en: '— {n} icons' },
  'ins.iconlib.ornaments': { bn: 'অলংকার চিহ্ন', hi: 'अलंकरण चिह्न', en: 'Ornaments' },
  'ins.iconlib.ornamentsHint': { bn: '— ক্লিক করলেই বসে যাবে', hi: '— क्लिक करते ही टिक जाएगा', en: '— click to insert' },
  'ins.iconlib.size': { bn: 'সাইজ', hi: 'आकार', en: 'Size' },
  'ins.iconlib.sizeAria': { bn: 'আইকনের সাইজ', hi: 'आइकन का आकार', en: 'Icon size' },
  'ins.iconlib.color': { bn: 'রং', hi: 'रंग', en: 'Color' },
  'ins.iconlib.customColor': { bn: 'নিজের রং', hi: 'अपना रंग', en: 'Custom color' },
  'ins.iconlib.clickSel': { bn: 'এক ক্লিকে নির্বাচন', hi: 'एक क्लिक में चयन', en: 'Click to select' },
  'ins.iconlib.dclickIns': { bn: 'ডাবল ক্লিকে সরাসরি বসবে', hi: 'डबल क्लिक में सीधे टिक जाएगा', en: 'Double-click to insert' },
  'ins.iconlib.insert': { bn: 'যোগ করুন', hi: 'जोड़ें', en: 'Insert' },

  // ─── আইকনের রং ───
  'ins.color.auto': { bn: 'স্বয়ংক্রিয় (লেখার রং)', hi: 'स्वतः (लेखन का रंग)', en: 'Auto (text color)' },
  'ins.color.ash': { bn: 'ছাই', hi: 'राख', en: 'Ash' },
  'ins.color.red': { bn: 'লাল', hi: 'लाल', en: 'Red' },
  'ins.color.orange': { bn: 'কমলা', hi: 'नारंगी', en: 'Orange' },
  'ins.color.mustard': { bn: 'সরিষা', hi: 'सरसों', en: 'Mustard' },
  'ins.color.green': { bn: 'সবুজ', hi: 'हरा', en: 'Green' },
  'ins.color.teal': { bn: 'টিল', hi: 'टील', en: 'Teal' },
  'ins.color.blue': { bn: 'নীল', hi: 'नीला', en: 'Blue' },
  'ins.color.purple': { bn: 'বেগুনি', hi: 'बैंगनी', en: 'Purple' },
  'ins.color.pink': { bn: 'গোলাপি', hi: 'गुलाबी', en: 'Pink' },
  'ins.color.brown': { bn: 'বাদামি', hi: 'भूरा', en: 'Brown' },

  // ─── টেক্সট বক্স ───
  'ins.textbox': { bn: 'টেক্সট বক্স', hi: 'टेक्स्ट बॉक्स', en: 'Text Box' },
  'ins.textbox.title': { bn: 'Bordered Box — ভিতরে লেখা যায়', hi: 'बॉर्डर वाला बॉक्स — अंदर लिखा जा सकता है', en: 'Bordered box — write inside' },
  'ins.textbox.hint': { bn: 'বক্স বসানোর পর ভিতরে ক্লিক করে লিখুন। বক্সে মাউস রাখলে রং/আকৃতি বদলানোর টুল দেখা যাবে।', hi: 'बॉक्स लगाने के बाद अंदर क्लिक करके लिखें। बॉक्स पर माउस ले जाने पर रंग/आकृति बदलने का टूल दिखेगा।', en: 'Click inside the box to write. Hover a box for color/shape tools.' },

  // ─── ডিজাইন শেপ ───
  'ins.shapes': { bn: 'ডিজাইন শেপ', hi: 'डिज़ाइन आकृतियाँ', en: 'Design Shapes' },
  'ins.shapes.tipTitle': { bn: 'অলংকৃত ব্যানার/ফ্রেম/ব্যাজ — ভিতরে লেখা যায়', hi: 'अलंकृत बैनर/फ़्रेम/बैज — अंदर लिखा जा सकता है', en: 'Ornate banners/frames/badges — write inside' },
  'ins.shapes.title': { bn: 'ডিজাইন শেপ লাইব্রেরি', hi: 'डिज़ाइन आकृति लाइब्रेरी', en: 'Design Shape Library' },
  'ins.shapes.desc': { bn: 'অলংকৃত ব্যানার, ফ্রেম ও ব্যাজ — {n}টি শেপ। বসানোর পর ভিতরে ক্লিক করে সরাসরি লিখুন; শেপে মাউস রাখলে আকৃতি ও রং বদলানোর টুল দেখা যাবে।', hi: 'अलंकृत बैनर, फ़्रेम और बैज — {n} आकृतियाँ। लगाने के बाद अंदर क्लिक करके सीधे लिखें; आकृति पर माउस रखने पर आकार और रंग बदलने का टूल दिखेगा।', en: 'Ornate banners, frames and badges — {n} shapes. Click inside to write after inserting; hover a shape for shape & color tools.' },
  'ins.shapes.cardTip': { bn: '{s} — ক্লিক করে বসান', hi: '{s} — क्लिक करके लगाएँ', en: '{s} — click to insert' },
  'ins.shapes.tip': { bn: 'টিপস: একই শেপ বারবার লাগলে বসিয়ে কপি (Ctrl+C / Ctrl+V) করুন — সব অলংকারসহ থাকবে।', hi: 'टिप: एक ही आकृति बार-बार लगानी हो तो लगाकर कॉपी (Ctrl+C / Ctrl+V) करें — सभी अलंकरण सहित रहेगी।', en: 'Tip: to reuse the same shape, insert it once and copy (Ctrl+C / Ctrl+V) — ornaments included.' },
'ins.shape.sample': { bn: 'শিরোনাম', hi: 'शीर्षक', en: 'Title' },

  // ─── একাডেমিক ব্লক ───
  'ins.conceptBox': { bn: 'ধারণা বক্স', hi: 'विचार बॉक्स', en: 'Concept Box' },
  'ins.callout.concept': { bn: 'মূল ধারণা', hi: 'मुख्य विचार', en: 'Key Concept' },
  'ins.warningBox': { bn: 'সতর্কতা বক্স', hi: 'चेतावनी बॉक्स', en: 'Warning Box' },
  'ins.callout.warning': { bn: 'সতর্কতা', hi: 'चेतावनी', en: 'Warning' },
  'ins.formulaBox': { bn: 'সূত্র বক্স', hi: 'सूत्र बॉक्स', en: 'Formula Box' },
  'ins.callout.formula': { bn: 'সূত্র', hi: 'सूत्र', en: 'Formula' },
  'ins.noteBox': { bn: 'নোট বক্স', hi: 'नोट बॉक्स', en: 'Note Box' },
  'ins.callout.note': { bn: 'নোট', hi: 'नोट', en: 'Note' },
  'ins.mcq': { bn: 'বহুনির্বাচনি', hi: 'बहुविकल्पीय', en: 'MCQ' },
  'ins.footnote': { bn: 'ফুটনোট', hi: 'फुटनोट', en: 'Footnote' },
  'ins.toast.footnote': { bn: 'ফুটনোট যোগ হয়েছে — ▾ চিহ্নে ক্লিক করে এর লেখা লিখুন', hi: 'फुटनोट जोड़ा गया — ▾ चिह्न पर क्लिक करके उसका टेक्स्ट लिखें', en: 'Footnote added — click the ▾ marker to write its text' },

  // ─── পাতা ও সাজসজ্জা ───
  'ins.pageBreak': { bn: 'পেজ ব্রেক', hi: 'पेज ब्रेक', en: 'Page Break' },
  'ins.toast.breakCover': { bn: 'কভার পাতায় পেজ ব্রেক প্রযোজ্য নয়', hi: 'कवर पृष्ठ पर पेज ब्रेक लागू नहीं होता', en: 'Page break is not applicable on the cover page' },
  'ins.todayDate': { bn: 'আজকের তারিখ', hi: 'आज की तारिख', en: "Today's Date" },
  'ins.todayDate.title': { bn: 'বাংলা তারিখ ও সময় বসান', hi: 'बांग्ला तारीख और समय डालें', en: 'Insert Bangla date & time' },
  'ins.link': { bn: 'লিংক', hi: 'लिंक', en: 'Link' },
  'ins.link.edit': { bn: 'লিংক সম্পাদনা', hi: 'लिंक संपादित करें', en: 'Edit Link' },
  'ins.link.title': { bn: 'লেখা বা ছবিতে ক্লিকযোগ্য লিংক — PDF এক্সপোর্টেও কাজ করে', hi: 'लेख या चित्र पर क्लिक करने योग्य लिंक — PDF एक्सपोर्ट में भी काम करता है', en: 'Clickable link on text or image — also works in PDF export' },
  'ins.link.remove': { bn: 'লিংক সরান', hi: 'लिंक हटाएँ', en: 'Remove Link' },
  'ins.link.removeTitle': { bn: 'সিলেকশন থেকে লিংক সরান', hi: 'चयन से लिंक हटाएँ', en: 'Remove the link from the selection' },
  'ins.toast.linkFirst': { bn: 'আগে কোনো পাতায় ক্লিক করুন, তারপর লিংক যোগ করুন', hi: 'पहले किसी पृष्ठ पर क्लिक करें, फिर लिंक जोड़ें', en: 'Click on a page first, then add the link' },
  'ins.toast.unlinkFirst': { bn: 'আগে কোনো পাতায় ক্লিক করুন, তারপর লিংক সরান', hi: 'पहले किसी पृष्ठ पर क्लिक करें, फिर लिंक हटाएँ', en: 'Click on a page first, then remove the link' },
};

// ═══ ডিজাইন স্টোর (asset-store-dialog) ═══
dictInsert['ins.store.btn'] = { bn: 'স্টোর', hi: 'स्टोर', en: 'Store' };
dictInsert['ins.store.btnTip'] = { bn: 'ডিজাইন স্টোর — ইমোজি, স্টিকার, অলংকার, আইকন সব এক জায়গায়', hi: 'डिज़ाइन स्टोर — इमोजी, स्टिकर, अलंकरण, आइकन सब एक जगह', en: 'Design Store — emojis, stickers, ornaments & icons in one place' };
dictInsert['ins.store.title'] = { bn: 'ডিজাইন স্টোর', hi: 'डिज़ाइन स्टोर', en: 'Design Store' };
dictInsert['ins.store.desc'] = { bn: 'ইমোজি, স্টিকার, অলংকার, আইকন ও নিজের আপলোড — সব এক জায়গায়। ক্লিক করলেই কার্সরে বসে যাবে; ❤ দিয়ে প্রিয়ে রাখুন।', hi: 'इमोजी, स्टिकर, अलंकरण, आइकन और अपने अपलोड — सब एक जगह। क्लिक करते ही कर्सर पर बैठ जाएगा; ❤ से पसंदीदा में रखें।', en: 'Emojis, stickers, ornaments, icons & your uploads — all in one place. Click to insert at the cursor; ❤ to favorite.' };
dictInsert['ins.store.searchPh'] = { bn: 'সব খুঁজুন… (যেমন: পাখি, আলপনা, boat, হৃদয়)', hi: 'सब खोजें… (जैसे: पक्षी, boat, हृदय)', en: 'Search everything… (e.g. bird, alpana, boat, heart)' };
dictInsert['ins.store.searchAria'] = { bn: 'স্টোর সার্চ', hi: 'स्टोर खोज', en: 'Store search' };
dictInsert['ins.store.sizeAria'] = { bn: 'সাজসজ্জার সাইজ', hi: 'सजावट का आकार', en: 'Decoration size' };
dictInsert['ins.store.colorTitle'] = { bn: 'রং বাছুন', hi: 'रंग चुनें', en: 'Pick a color' };
dictInsert['ins.store.autoColor'] = { bn: 'স্বয়ং রং', hi: 'स्वतः रंग', en: 'Auto' };
dictInsert['ins.store.autoColorTitle'] = { bn: 'লেখার রংই অনুসরণ করবে', hi: 'लेख का रंग अपनाएगा', en: 'Follow the text color' };
dictInsert['ins.store.upload'] = { bn: 'আপলোড', hi: 'अपलोड', en: 'Upload' };
dictInsert['ins.store.tab.all'] = { bn: 'সব', hi: 'सभी', en: 'All' };
dictInsert['ins.store.tab.fav'] = { bn: 'প্রিয়', hi: 'पसंदीदा', en: 'Favorites' };
dictInsert['ins.store.tab.recent'] = { bn: 'সম্প্রতি', hi: 'हाल के', en: 'Recent' };
dictInsert['ins.store.tab.sticker'] = { bn: 'স্টিকার', hi: 'स्टिकर', en: 'Stickers' };
dictInsert['ins.store.tab.emoji'] = { bn: 'ইমোজি', hi: 'इमोजी', en: 'Emojis' };
dictInsert['ins.store.tab.orn'] = { bn: 'অলংকার', hi: 'अलंकरण', en: 'Ornaments' };
dictInsert['ins.store.tab.icon'] = { bn: 'আইকন', hi: 'आइकन', en: 'Icons' };
dictInsert['ins.store.tab.custom'] = { bn: 'আমার আপলোড', hi: 'मेरे अपलोड', en: 'My uploads' };
dictInsert['ins.store.noresult'] = { bn: '“{q}” এর জন্য কিছু পাওয়া যায়নি — অন্য শব্দ চেষ্টা করুন।', hi: '“{q}” के लिए कुछ नहीं मिला — दूसरा शब्द आज़माएँ।', en: 'No results for “{q}” — try another word.' };
dictInsert['ins.store.insertTip'] = { bn: 'ক্লিক করলে বসে যাবে', hi: 'क्लिक करने पर बैठ जाएगा', en: 'Click to insert' };
dictInsert['ins.store.favAria'] = { bn: 'প্রিয়ে রাখুন', hi: 'पसंदीदा में रखें', en: 'Add to favorites' };
dictInsert['ins.store.favEmpty'] = { bn: 'এখনো কোনো প্রিয় নেই — যেকোনো সাজসজ্জার ❤ চেপে এখানে জমা করুন।', hi: 'अभी कोई पसंदीदा नहीं — किसी सजावट के ❤ दबाकर यहाँ जमा करें।', en: 'No favorites yet — tap ❤ on any decoration to save it here.' };
dictInsert['ins.store.recentEmpty'] = { bn: 'সম্প্রতি ব্যবহৃত সাজসজ্জা এখানে জমা হবে।', hi: 'हाल में उपयोग की गई सजावट यहाँ जमा होगी।', en: 'Recently used decorations will appear here.' };
dictInsert['ins.store.uploadHint'] = { bn: 'নিজের স্টিকার/ছবি আপলোড করুন — এখানেই সেভ থাকবে (PNG, JPG, SVG, WebP)', hi: 'अपना स्टिकर/चित्र अपलोड करें — यहीं सेव रहेगा (PNG, JPG, SVG, WebP)', en: 'Upload your own stickers/images — saved right here (PNG, JPG, SVG, WebP)' };
dictInsert['ins.store.deleteUpload'] = { bn: 'আপলোড মুছুন', hi: 'अपलोड मिटाएँ', en: 'Delete upload' };
dictInsert['ins.store.footer'] = { bn: 'ক্লিক = তাৎক্ষণিক ঢোকান · ❤ = প্রিয়ে রাখুন · সাইজ-রং উপরের নিয়ন্ত্রণ থেকে · প্রিয়/আপলোড ব্রাউজারেই সেভ থাকে', hi: 'क्लिक = तुरंत जोड़ें · ❤ = पसंदीदा · आकार-रंग ऊपर से · पसंदीदा/अपलोड ब्राउज़र में सेव', en: 'Click = insert instantly · ❤ = favorite · size & color from the controls above · favorites & uploads are saved in your browser' };
dictInsert['ins.store.toast.favAdd'] = { bn: 'প্রিয়ে যোগ হয়েছে', hi: 'पसंदीदा में जोड़ा गया', en: 'Added to favorites' };
dictInsert['ins.store.toast.favRemove'] = { bn: 'প্রিয় থেকে সরানো হয়েছে', hi: 'पसंदीदा से हटाया गया', en: 'Removed from favorites' };
dictInsert['ins.store.toast.deleted'] = { bn: 'আপলোড মুছে ফেলা হয়েছে', hi: 'अपलोड मिटा दिया गया', en: 'Upload deleted' };
dictInsert['ins.store.toast.uploaded'] = { bn: '{n}টি ছবি স্টোরে জোড় হয়েছে', hi: '{n} चित्र स्टोर में जुड़े', en: '{n} image(s) added to the store' };
dictInsert['ins.store.toast.uploadFail'] = { bn: '{name} — ছবি নয় বা পড়া গেল না', hi: '{name} — चित्र नहीं है या पढ़ा नहीं जा सका', en: '{name} — not an image or unreadable' };

// ═══ ভেক্টর লাইব্রেরি (vector-library-dialog) ═══
dictInsert['ins.vector.btn'] = { bn: 'ভেক্টর ছবি', hi: 'वेक्टर चित्र', en: 'Vector images' };
dictInsert['ins.vector.btnTip'] = { bn: 'বিল্ট-ইন ভেক্টর ও ইলাস্ট্রেশন লাইব্রেরি — পদার্থবিজ্ঞান, গণিত, রসায়ন, জীববিজ্ঞান, ভূগোলের ১২১টি SVG চিত্র', hi: 'बिल्ट-इन वेक्टर व इलस्ट्रेशन लाइब्रेरी — 121 SVG चित्र', en: 'Built-in vector & illustration library — 121 SVG figures' };
dictInsert['ins.vector.title'] = { bn: 'ভেক্টর লাইব্রেরি', hi: 'वेक्टर लाइब्रेरी', en: 'Vector Library' };
dictInsert['ins.vector.desc'] = { bn: 'বইয়ের জন্য বিল্ট-ইন শিক্ষামূলক ভেক্টর চিত্র — ক্যাটাগরি অনুযায়ী সাজানো, কপিরাইট-মুক্ত। ক্লিক করলে কার্সরে বসবে, টেনে বইয়ের যেকোনো জায়গায় ছাড়া যাবে। সব SVG: জুম/ছাপায় ফাটে না।', hi: 'किताबों के लिए बिल्ट-इन शैक्षिक वेक्टर चित्र — श्रेणीबद्ध, कॉपीराइट-मुक्त। क्लिक करें या ड्रैग करें। सब SVG: ज़ूम/प्रिंट में शार्प।', en: 'Built-in educational vector figures for books — categorized, copyright-free. Click to insert at the cursor, or drag anywhere in the book. All SVG: stays sharp when zoomed or printed.' };
dictInsert['ins.vector.searchPh'] = { bn: 'খুঁজুন — যেমন: লেন্স, নৌকা, গ্রাফ, তীর, circuit…', hi: 'खोजें — जैसे: लेंस, नाव, ग्राफ, तीर, circuit…', en: 'Search — e.g. lens, boat, graph, arrow, circuit…' };
dictInsert['ins.vector.searchAria'] = { bn: 'ভেক্টর চিত্র খুঁজুন', hi: 'वेक्टर चित्र खोजें', en: 'Search vector figures' };
dictInsert['ins.vector.tab.all'] = { bn: 'সব', hi: 'सभी', en: 'All' };
dictInsert['ins.vector.cat.physics'] = { bn: 'পদার্থবিজ্ঞান', hi: 'भौतिकी', en: 'Physics' };
dictInsert['ins.vector.cat.math'] = { bn: 'গণিত ও জ্যামিতি', hi: 'गणित व ज्यामिति', en: 'Math & Geometry' };
dictInsert['ins.vector.cat.chem'] = { bn: 'রসায়ন ও ল্যাব', hi: 'रसायन व लैब', en: 'Chemistry & Lab' };
dictInsert['ins.vector.cat.bio'] = { bn: 'জীববিজ্ঞান', hi: 'जीवविज्ञान', en: 'Biology' };
dictInsert['ins.vector.cat.geo'] = { bn: 'ভূগোল ও বাংলাদেশ', hi: 'भूगोल व बांग्लादेश', en: 'Geography & Bangladesh' };
dictInsert['ins.vector.cat.chart'] = { bn: 'চার্ট ও লেখচিত্র', hi: 'चार्ट व ग्राफ', en: 'Charts & Graphs' };
dictInsert['ins.vector.cat.common'] = { bn: 'কমন এলিমেন্ট', hi: 'कॉमन एलिमेंट', en: 'Common Elements' };
dictInsert['ins.vector.insertTip'] = { bn: 'ক্লিক করলে কার্সরে বসবে', hi: 'क्लिक करने पर कर्सर पर बैठ जाएगा', en: 'Click to insert at cursor' };
dictInsert['ins.vector.dragTip'] = { bn: 'ক্লিক = কার্সরে বসবে · টেনে বইয়ের যেকোনো জায়গায় ছাড়া যাবে · SVG ভেক্টর — যত বড় করবেন, তত শার্প · প্রিয়/সম্প্রতি ব্রাউজারেই সেভ', hi: 'क्लिक = कर्सर पर बैठेगा · ड्रैग करके कहीं भी छोड़ें · SVG वेक्टर — जितना बड़ा, उतना शार्प · पसंदीदा/हाल के ब्राउज़र में सेव', en: 'Click = insert at cursor · drag & drop anywhere in the book · SVG vectors — the bigger, the sharper · favorites & recents saved in your browser' };
dictInsert['ins.vector.favEmpty'] = { bn: 'প্রিয় ভেক্টর এখনো নেই — যেকোনো চিত্রের ❤ চেপে এখানে জমা করুন।', hi: 'अभी कोई पसंदीदा वेक्टर नहीं — किसी चित्र के ❤ दबाकर यहाँ जमा करें।', en: 'No favorite vectors yet — tap ❤ on any figure to save it here.' };
dictInsert['ins.vector.recentEmpty'] = { bn: 'সম্প্রতি ব্যবহৃত ভেক্টর এখানে জমা হবে।', hi: 'हाल में उपयोग किए वेक्टर यहाँ जमा होंगे।', en: 'Recently used vectors will appear here.' };
dictInsert['ins.vector.noresult'] = { bn: '"{q}" — কিছু পাওয়া যায়নি, অন্য শব্দে খুঁজুন।', hi: '"{q}" — कुछ नहीं मिला, दूसरा शब्द खोजें।', en: '"{q}" — nothing found, try another word.' };
dictInsert['ins.vector.count'] = { bn: '{n}টি ভেক্টর চিত্র', hi: '{n} वेक्टर चित्र', en: '{n} vector figures' };
dictInsert['ins.store.vectorLink'] = { bn: 'ভেক্টর ছবি', hi: 'वेक्टर चित्र', en: 'Vector images' };

// ═══════════ থিসিস স্টুডিও (Thesis Studio) ═══════════

dictInsert['ins.thesis'] = { bn: 'থিসিস স্টুডিও', hi: 'थीसिस स्टूडियो', en: 'Thesis Studio' };
dictInsert['ins.thesis.tip'] = { bn: 'প্রফেশনাল থিসিস/গবেষণাপত্র নির্মাণ — পুরো কাঠামো (শিরোনাম পাতা, ঘোষণা, সনদ, সারসংক্ষেপ, সূচিপত্র, অধ্যায়, তথ্যসূত্র) এক ক্লিকে + সূত্র-ইঞ্জিন (APA/MLA/Harvard/Chicago/IEEE)', hi: 'प्रोफेशनल थीसिस निर्माण — पूरी संरचना एक क्लिक में + संदर्भ-इंजन', en: 'Professional thesis builder — full skeleton in one click + citation engine (APA/MLA/Harvard/Chicago/IEEE)' };
dictInsert['thesis.title'] = { bn: 'থিসিস স্টুডিও — প্রফেশনাল গবেষণাপত্র', hi: 'थीसिस स्टूडियो — प्रोफेशनल शोध-पत्र', en: 'Thesis Studio — Professional Research Writing' };
dictInsert['thesis.desc'] = { bn: 'তথ্য দিন — বিশ্ববিদ্যালয়-স্ট্যান্ডার্ড সম্পূর্ণ কাঠামো এডিটেবল পাতা হিসেবে তৈরি হয়ে যাবে: শিরোনাম পাতা → ঘোষণাপত্র → সনদ → কৃতজ্ঞতা → সারসংক্ষেপ → সূচিপত্র → অধ্যায়সমূহ → তথ্যসূত্র → পরিশিষ্ট। পৃষ্ঠা-নম্বরও স্ট্যান্ডার্ড: প্রারম্ভিক পাতা রোমান (i, ii), অধ্যায় থেকে ১, ২, ৩।', hi: 'जानकारी दें — विश्वविद्यालय-मानक पूरी संरचना संपादन-योग्य पेजों के रूप में बन जाएगी। पृष्ठ-संख्या भी मानक: प्रारंभिक पेज रोमन (i, ii), अध्याय से 1, 2, 3।', en: 'Fill in the details — a university-standard full skeleton is generated as editable pages: title page → declaration → certificate → acknowledgements → abstract → TOC → chapters → references → appendix. Page numbers follow the standard: front matter in roman (i, ii), body restarts at 1.' };
dictInsert['thesis.tab.build'] = { bn: 'নির্মাণ', hi: 'निर्माण', en: 'Build' };
dictInsert['thesis.tab.cite'] = { bn: 'সূত্র', hi: 'संदर्भ', en: 'Citations' };
dictInsert['thesis.tab.guide'] = { bn: 'গাইড', hi: 'गाइड', en: 'Guide' };
dictInsert['thesis.lang'] = { bn: 'থিসিসের ভাষা', hi: 'थीसिस की भाषा', en: 'Thesis language' };
dictInsert['thesis.level'] = { bn: 'স্তর', hi: 'स्तर', en: 'Level' };
dictInsert['thesis.level.honours'] = { bn: 'অনার্স', hi: 'ऑनर्स', en: 'Honours' };
dictInsert['thesis.level.masters'] = { bn: 'মাস্টার্স', hi: 'मास्टर्स', en: 'Masters' };
dictInsert['thesis.level.mphil'] = { bn: 'এমফিল', hi: 'एम.फिल', en: 'MPhil' };
dictInsert['thesis.level.phd'] = { bn: 'পিএইচডি', hi: 'पीएचडी', en: 'PhD' };
dictInsert['thesis.discipline'] = { bn: 'শৃঙ্খলা (অধ্যায়-কাঠামো এর উপর নির্ভর করে)', hi: 'अनुशासन (अध्याय-संरचना इस पर निर्भर)', en: 'Discipline (drives chapter structure)' };
dictInsert['thesis.discipline.science'] = { bn: 'বিজ্ঞান / প্রকৌশল', hi: 'विज्ञान / इंजीनियरिंग', en: 'Science / Engineering' };
dictInsert['thesis.discipline.arts'] = { bn: 'কলা / মানবিক', hi: 'कला / मानविकी', en: 'Arts / Humanities' };
dictInsert['thesis.discipline.business'] = { bn: 'ব্যবসায় / ব্যবস্থাপনা', hi: 'व्यवसाय / प्रबंधन', en: 'Business / Management' };
dictInsert['thesis.fTitle'] = { bn: 'থিসিসের শিরোনাম', hi: 'थीसिस का शीर्षक', en: 'Thesis title' };
dictInsert['thesis.fTitle.ph'] = { bn: 'যেমন: পদ্মা নদীর পানির গুণমান ও মাছের বৈচিত্র্য', hi: 'जैसे: पद्मा नदी के जल की गुणवत्ता…', en: 'e.g. Water quality and fish diversity of the Padma River' };
dictInsert['thesis.fUniv'] = { bn: 'বিশ্ববিদ্যালয়', hi: 'विश्वविद्यालय', en: 'University' };
dictInsert['thesis.fDept'] = { bn: 'বিভাগ', hi: 'विभाग', en: 'Department' };
dictInsert['thesis.fAuthor'] = { bn: 'গবেষকের নাম', hi: 'शोधकर्ता का नाम', en: "Researcher's name" };
dictInsert['thesis.fRoll'] = { bn: 'রোল / রেজিস্ট্রেশন', hi: 'रोल / रजिस्ट्रेशन', en: 'Roll / Registration' };
dictInsert['thesis.fSession'] = { bn: 'শিক্ষাবর্ষ', hi: 'सत्र', en: 'Session' };
dictInsert['thesis.fSupervisor'] = { bn: 'সুপারভাইজারের নাম', hi: 'सुपरवाइज़र का नाम', en: "Supervisor's name" };
dictInsert['thesis.fDegree'] = { bn: 'ডিগ্রির নাম (খালি রাখলে স্তর অনুযায়ী বসবে)', hi: 'डिग्री का नाम (खाली छोड़ें = स्तर अनुसार)', en: 'Degree name (blank = per level)' };
dictInsert['thesis.structure'] = { bn: 'কাঠামো — যা যা চান বেছে নিন', hi: 'संरचना — जो चाहें चुनें', en: 'Structure — pick what you need' };
dictInsert['thesis.opt.declaration'] = { bn: 'ঘোষণাপত্র', hi: 'घोषणापत्र', en: 'Declaration' };
dictInsert['thesis.opt.certificate'] = { bn: 'সনদপত্র (সুপারভাইজার)', hi: 'प्रमाणपत्र (सुपरवाइज़र)', en: 'Certificate (Supervisor)' };
dictInsert['thesis.opt.acknowledgment'] = { bn: 'কৃতজ্ঞতা স্বীকার', hi: 'आभार स्वीकार', en: 'Acknowledgements' };
dictInsert['thesis.opt.abstract'] = { bn: 'সারসংক্ষেপ + কীওয়ার্ড', hi: 'सारांश + कीवर्ड', en: 'Abstract + keywords' };
dictInsert['thesis.opt.toc'] = { bn: 'সূচিপত্র (স্বয়ংক্রিয়)', hi: 'विषय-सूची (स्वतः)', en: 'Table of contents (auto)' };
dictInsert['thesis.opt.lists'] = { bn: 'চিত্র ও টেবিলের তালিকা', hi: 'चित्र व तालिका सूची', en: 'List of figures & tables' };
dictInsert['thesis.opt.abbreviations'] = { bn: 'সংক্ষেপের তালিকা', hi: 'संक्षेप सूची', en: 'List of abbreviations' };
dictInsert['thesis.opt.references'] = { bn: 'তথ্যসূত্র পাতা', hi: 'संदर्भ पेज', en: 'References page' };
dictInsert['thesis.opt.appendix'] = { bn: 'পরিশিষ্ট', hi: 'परिशिष्ट', en: 'Appendix' };
dictInsert['thesis.opt.applyFormat'] = { bn: 'স্ট্যান্ডার্ড থিসিস ফরম্যাট প্রয়োগ — মার্জিন (বাম ১.৫"), ফন্ট (Times New Roman ১২pt / সলিমানলিপি ১৪pt), লাইন-স্পেসিং ১.৫', hi: 'मानक थीसिस फ़ॉर्मेट — मार्जिन (बाएँ 1.5"), फ़ॉन्ट, लाइन-स्पेसिंग 1.5', en: 'Apply standard thesis format — margins (left 1.5"), font (Times New Roman 12pt / SolaimanLipi 14pt), 1.5 line spacing' };
dictInsert['thesis.generate'] = { bn: 'সম্পূর্ণ থিসিস কাঠামো তৈরি করুন', hi: 'पूरी थीसिस संरचना बनाएँ', en: 'Generate full thesis structure' };
dictInsert['thesis.toast.built'] = { bn: 'থিসিস কাঠামো তৈরি — {n}টি পাতা যোগ হয়েছে। পাতায় লিখলেই সূচিপত্র ও পৃষ্ঠা-নম্বর স্বয়ংক্রিয় হবে।', hi: 'थीसिस संरचना तैयार — {n} पेज जुड़े। लिखने पर सूची व पृष्ठ-संख्या स्वतः अपडेट होगी।', en: 'Thesis skeleton built — {n} pages added. TOC and page numbers update automatically as you write.' };
dictInsert['thesis.err.noTitle'] = { bn: 'থিসিসের শিরোনাম দিন — শিরোনাম পাতায় বসবে', hi: 'थीसिस शीर्षक दें — शीर्षक पेज पर जाएगा', en: 'Enter the thesis title — it goes on the title page' };

dictInsert['thesis.cite.desc'] = { bn: 'সূত্রের তথ্য দিন — নির্বাচিত স্টাইলে নিখুঁত এন্ট্রি তৈরি হবে। তালিকা-এন্ট্রি তথ্যসূত্র পাতায়, পাঠ্য-উদ্ধৃতি লেখার ভেতরে বসান।', hi: 'संदर्भ की जानकारी दें — चुनी गई शैली में सटीक प्रविष्टि बनेगी।', en: 'Enter the source details — a precise entry is generated in the chosen style. Insert the list entry into your References page, the in-text citation into your prose.' };
dictInsert['thesis.cite.style'] = { bn: 'স্টাইল', hi: 'शैली', en: 'Style' };
dictInsert['thesis.cite.type'] = { bn: 'সূত্রের ধরন', hi: 'स्रोत का प्रकार', en: 'Source type' };
dictInsert['thesis.cite.fAuthors'] = { bn: 'লেখক(গণ)', hi: 'लेखक(गण)', en: 'Author(s)' };
dictInsert['thesis.cite.fAuthors.ph'] = { bn: 'রহমান, আ. ও করিম, এ.', hi: 'रहमान, ए. एवं करीम, बी.', en: 'Rahman, A. & Karim, B.' };
dictInsert['thesis.cite.fYear'] = { bn: 'বছর', hi: 'वर्ष', en: 'Year' };
dictInsert['thesis.cite.fTitle'] = { bn: 'শিরোনাম', hi: 'शीर्षक', en: 'Title' };
dictInsert['thesis.cite.fContainer'] = { bn: 'জার্নাল/সাইটের নাম', hi: 'जर्नल/साइट का नाम', en: 'Journal / site name' };
dictInsert['thesis.cite.fPublisher'] = { bn: 'প্রকাশক', hi: 'प्रकाशक', en: 'Publisher' };
dictInsert['thesis.cite.fPlace'] = { bn: 'প্রকাশনা-স্থান', hi: 'प्रकाशन-स्थान', en: 'Place of publication' };
dictInsert['thesis.cite.fVolume'] = { bn: 'খণ্ড (Volume)', hi: 'खंड (Volume)', en: 'Volume' };
dictInsert['thesis.cite.fIssue'] = { bn: 'সংখ্যা (Issue)', hi: 'अंक (Issue)', en: 'Issue' };
dictInsert['thesis.cite.fPages'] = { bn: 'পৃষ্ঠা', hi: 'पृष्ठ', en: 'Pages' };
dictInsert['thesis.cite.fUrl'] = { bn: 'URL', hi: 'URL', en: 'URL' };
dictInsert['thesis.cite.fAccessed'] = { bn: 'অ্যাক্সেস-তারিখ', hi: 'एक्सेस-तिथि', en: 'Accessed date' };
dictInsert['thesis.cite.fDoi'] = { bn: 'DOI', hi: 'DOI', en: 'DOI' };
dictInsert['thesis.cite.fEdition'] = { bn: 'সংস্করণ', hi: 'संस्करण', en: 'Edition' };
dictInsert['thesis.cite.output'] = { bn: 'তালিকা-এন্ট্রি (তথ্যসূত্র পাতায় যাবে)', hi: 'सूची-प्रविष्टि (संदर्भ पेज के लिए)', en: 'List entry (for the References page)' };
dictInsert['thesis.cite.intext'] = { bn: 'পাঠ্যের ভেতরে (in-text)', hi: 'पाठ के भीतर (in-text)', en: 'In-text' };
dictInsert['thesis.cite.insert'] = { bn: 'কার্সরে বসান', hi: 'कर्सर पर डालें', en: 'Insert at cursor' };
dictInsert['thesis.cite.copy'] = { bn: 'কপি', hi: 'कॉपी', en: 'Copy' };
dictInsert['thesis.cite.copied'] = { bn: 'কপি হয়েছে', hi: 'कॉपी हो गया', en: 'Copied' };
dictInsert['thesis.cite.needTitle'] = { bn: 'অন্তত শিরোনাম ও বছর দিন', hi: 'कम से कम शीर्षक व वर्ष दें', en: 'Enter at least the title and year' };

dictInsert['thesis.guide.title'] = { bn: 'প্রফেশনাল থিসিস — স্ট্যান্ডার্ড নিয়মাবলি', hi: 'प्रोफेशनल थीसिस — मानक नियम', en: 'Professional thesis — the standards' };
dictInsert['thesis.guide.margins'] = { bn: 'মার্জিন: বাম ১.৫" (বাঁধাইয়ের জন্য), ডান/উপর/নিচ ১"। কাগজ: A4, এক পাশে ছাপ।', hi: 'मार्जिन: बाएँ 1.5" (बाइंडिंग), बाकी 1"। कागज़: A4, एकतरफा छपाई।', en: 'Margins: left 1.5" (for binding), right/top/bottom 1". Paper: A4, single-sided.' };
dictInsert['thesis.guide.typo'] = { bn: 'ফন্ট: ইংরেজি — Times New Roman ১২pt (শিরোনামে ১৪–১৬pt bold); বাংলা — সলিমানলিপি/কালপুরুষ ১৪pt। লাইন-স্পেসিং ১.৫, জাস্টিফাইড টেক্সট।', hi: 'फ़ॉन्ट: अंग्रेज़ी — Times New Roman 12pt; हिंदी — मंगल 14pt। लाइन-स्पेसिंग 1.5, जस्टिफाइड।', en: 'Font: English — Times New Roman 12pt (headings 14–16pt bold); Bangla — SolaimanLipi/Kalpurush 14pt. Line spacing 1.5, justified text.' };
dictInsert['thesis.guide.numbering'] = { bn: 'পৃষ্ঠা-নম্বর: শিরোনাম পাতা গণনায় i কিন্তু দেখানো হয় না; ঘোষণা→সংক্ষেপ রোমান (ii, iii…); অধ্যায় ১ থেকে ১, ২, ৩ পুনরারম্ভ — ফুটার-কেন্দ্রে। এই স্টুডিও কাঠামো বানালে সেটআপ স্বয়ংক্রিয়।', hi: 'पृष्ठ-संख्या: शीर्षक पेज i (छिपा); प्रारंभिक पेज रोमन; अध्याय 1 से पुनः आरंभ — फुटर-केंद्र।', en: 'Page numbers: title page counts as i but is not shown; front matter continues in roman (ii, iii…); body restarts at 1 from Chapter 1 — footer-centre. Generating the skeleton here sets this up automatically.' };
dictInsert['thesis.guide.chapters'] = { bn: 'অধ্যায়-লক্ষ্য (আনুমানিক): ভূমিকা ১৫%, সাহিত্য-পর্যালোচনা ২০%, পদ্ধতি ১৫%, ফলাফল-আলোচনা ৩০%, উপসংহার ১০%, বাকি সূত্র-পরিশিষ্ট। মাস্টার্স ১৫–২০ হাজার শব্দ, পিএইচডি ৪০–৮০ হাজার — নিজ বিশ্ববিদ্যালয়ের গাইডলাইন আগে দেখুন।', hi: 'अध्याय-लक्ष्य: भूमिका 15%, साहित्य 20%, पद्धति 15%, परिणाम 30%, निष्कर्ष 10%।', en: 'Chapter targets (approx.): Introduction 15%, literature review 20%, methodology 15%, results & discussion 30%, conclusion 10%. Masters 15–20k words, PhD 40–80k — always check your university guideline first.' };
dictInsert['thesis.guide.toc'] = { bn: 'সূচিপত্র: H1–H3 শিরোনাম নিজে থেকেই সূচিতে ঢোকে। রিভিউ ট্যাবের "সূচিপত্র হালনাগাদ" চাপলে পৃষ্ঠা-নম্বরসহ মিলে যায়।', hi: 'विषय-सूची: H1–H3 शीर्षक स्वतः जुड़ते हैं। "अपडेट" से पृष्ठ-संख्या मिलती है।', en: 'TOC: H1–H3 headings flow into the table of contents automatically. Press "Update TOC" in the Review tab to refresh page numbers.' };
dictInsert['thesis.guide.cite'] = { bn: 'সূত্র: পুরো থিসিসে একটাই স্টাইল (APA/MLA/Harvard/Chicago/IEEE)। প্রতিটি দাবির পাশে in-text উদ্ধৃতি, শেষ পাতায় বর্ণানুক্রমিক তালিকা। "সূত্র" ট্যাব ফরম্যাট-ভুল মুছে দেয়।', hi: 'संदर्भ: पूरी थीसिस में एक ही शैली। हर दावे के साथ in-text, अंत में वर्णानुक्रमिक सूची।', en: 'Citations: ONE style throughout (APA/MLA/Harvard/Chicago/IEEE). Every claim gets an in-text citation; the final list is alphabetical. The Citations tab removes formatting mistakes.' };
dictInsert['thesis.guide.figs'] = { bn: 'চিত্র/টেবিল: ক্রমাযুক্ত — "চিত্র ৩.২: শিরোনাম" (অধ্যায়.ক্রম)। উৎস নিচে; মূল লেখায় আগে উল্লেখ করে তবেই আনুন।', hi: 'चित्र/तालिका: क्रमांकित — "चित्र 3.2: शीर्षक"। स्रोत नीचे।', en: 'Figures/tables: numbered — "Figure 3.2: Caption" (chapter.serial). Source below; always mention in the text before it appears.' };
dictInsert['thesis.guide.check'] = { bn: 'জমার আগে: স্বতঃস্ফূর্ত কপি-চেক (plagiarism) → সুপারভাইজারের চূড়ান্ত স্বাক্ষর → রিভিউ ট্যাবের বানান-প্রুফিং → DOCX/পিডিএফ এক্সপোর্টে মার্জিন-নম্বর যাচাই।', hi: 'जमा करने से पहले: प्लेजियरिज़्म चेक → सुपरवाइज़र हस्ताक्षर → वर्तनी-प्रूफिंग → DOCX/PDF निर्यात जाँच।', en: 'Before submission: plagiarism check → supervisor sign-off → spell-proofing in the Review tab → verify margins & numbering in the DOCX/PDF export.' };

// ─── থিসিস স্টুডিও ২ — নতুন ট্যাব/টুল (AI খসড়া, লাইব্রেরি, ক্যাপশন, প্রিসেট) ───

dictInsert['thesis.tab.draft'] = { bn: 'AI খসড়া', hi: 'AI ड्राफ्ट', en: 'AI Draft' };
dictInsert['thesis.draft.desc'] = { bn: 'যে অংশটি লিখবেন বেছে নিন, গবেষণার বিষয় ও মূল পয়েন্ট দিন — AI একাডেমিক রীতিতে খসড়া লিখে দেবে। খসড়াটি সম্পাদনা করে কার্সরে বসান। বানিয়ে সূত্র দেয় না — (সূত্র) স্থানধারক নিজের সূত্র দিয়ে বদলাবেন।', hi: 'जो भाग लिखना है चुनें, विषय व मुख्य बिंदु दें — AI शैक्षणिक शैली में ड्राफ्ट लिखेगा। संपादित करके कर्सर पर डालें।', en: 'Pick the section, give your research topic and key points — AI writes an academic draft. Edit it, then insert at the cursor. It never invents citations — replace the (citation) placeholders with your own sources.' };
dictInsert['thesis.draft.section'] = { bn: 'কোন অংশ লিখবেন', hi: 'कौन-सा भाग', en: 'Which section' };
dictInsert['thesis.draft.sec.abstract'] = { bn: 'সারসংক্ষেপ (Abstract)', hi: 'सारांश (Abstract)', en: 'Abstract' };
dictInsert['thesis.draft.sec.intro'] = { bn: 'ভূমিকা (অধ্যায় ১)', hi: 'परिचय (अध्याय 1)', en: 'Introduction (Ch. 1)' };
dictInsert['thesis.draft.sec.literature'] = { bn: 'সাহিত্য-পর্যালোচনা', hi: 'साहित्य-समीक्षा', en: 'Literature review' };
dictInsert['thesis.draft.sec.method'] = { bn: 'গবেষণা পদ্ধতি', hi: 'शोध पद्धति', en: 'Methodology' };
dictInsert['thesis.draft.sec.results'] = { bn: 'ফলাফল ও আলোচনা', hi: 'परिणाम व चर्चा', en: 'Results & discussion' };
dictInsert['thesis.draft.sec.conclusion'] = { bn: 'উপসংহার', hi: 'निष्कर्ष', en: 'Conclusion' };
dictInsert['thesis.draft.topic'] = { bn: 'গবেষণার বিষয় (খালি রাখলে থিসিসের শিরোনাম)', hi: 'शोध विषय (खाली = थीसिस शीर्षक)', en: 'Research topic (blank = thesis title)' };
dictInsert['thesis.draft.topic.ph'] = { bn: 'যেমন: পদ্মা নদীর পানির গুণমান…', hi: 'जैसे: पद्मा नदी के जल की गुणवत्ता…', en: 'e.g. Water quality of the Padma River…' };
dictInsert['thesis.draft.points'] = { bn: 'মূল পয়েন্ট (প্রতি লাইনে একটি — ঐচ্ছিক)', hi: 'मुख्य बिंदु (प्रति पंक्ति एक — वैकल्पिक)', en: 'Key points (one per line — optional)' };
dictInsert['thesis.draft.points.ph'] = { bn: 'যেমন:\nশুষ্ক মৌসুমে দূষণ বেশি\nমাছের প্রজাতি ৩৮টি থেকে ২৯টি', hi: 'जैसे:\nशुष्क मौसम में अधिक प्रदूषण\nमछली की प्रजातियाँ 38 से 29', en: 'e.g.\nPollution peaks in dry season\nFish species fell from 38 to 29' };
dictInsert['thesis.draft.length'] = { bn: 'দৈর্ঘ্য', hi: 'लंबाई', en: 'Length' };
dictInsert['thesis.draft.len.short'] = { bn: 'ছোট (~১৫০ শব্দ)', hi: 'छोटा (~150 शब्द)', en: 'Short (~150 words)' };
dictInsert['thesis.draft.len.medium'] = { bn: 'মাঝারি (~৩০০ শব্দ)', hi: 'मध्यम (~300 शब्द)', en: 'Medium (~300 words)' };
dictInsert['thesis.draft.len.long'] = { bn: 'বড় (~৬০০ শব্দ)', hi: 'बड़ा (~600 शब्द)', en: 'Long (~600 words)' };
dictInsert['thesis.draft.generate'] = { bn: 'খসড়া লিখুন', hi: 'ड्राफ्ट लिखें', en: 'Write draft' };
dictInsert['thesis.draft.result'] = { bn: 'খসড়া — দরকারমতো সম্পাদনা করুন', hi: 'ड्राफ्ट — आवश्यकतानुसार संपादित करें', en: 'Draft — edit as needed' };
dictInsert['thesis.draft.insert'] = { bn: 'কার্সরে বসান', hi: 'कर्सर पर डालें', en: 'Insert at cursor' };
dictInsert['thesis.draft.done'] = { bn: 'খসড়া তৈরি — পড়ে সম্পাদনা করে বসান', hi: 'ड्राफ्ट तैयार — पढ़कर संपादित करें', en: 'Draft ready — review, edit, then insert' };
dictInsert['thesis.draft.inserted'] = { bn: 'খসড়া কার্সরে বসানো হয়েছে', hi: 'ड्राफ्ट कर्सर पर डाला गया', en: 'Draft inserted at cursor' };
dictInsert['thesis.draft.err.noTopic'] = { bn: 'গবেষণার বিষয় দিন — কী নিয়ে লিখবে?', hi: 'शोध विषय दें — किस पर लिखें?', en: 'Give the research topic first' };
dictInsert['thesis.draft.err.empty'] = { bn: 'AI খালি উত্তর দিয়েছে — আবার চেষ্টা করুন', hi: 'AI ने खाली उत्तर दिया — फिर कोशिश करें', en: 'AI returned an empty answer — try again' };
dictInsert['thesis.draft.notice'] = { bn: 'মনে রাখুন: AI-লিখিত অংশ পড়ে-মিলিয়ে নিজের ভাষায় সম্পাদনা করুন; (সূত্র) স্থানধারক বদলে আসল তথ্যসূত্র দিন। AI বানিয়ে সূত্র দেয় না — তবু যাচাই আপনার দায়িত্ব।', hi: 'ध्यान दें: AI-लिखित भाग पढ़कर संपादित करें; (संदर्भ) प्लेसहोल्डर बदलें।', en: 'Remember: review and rewrite AI drafts in your own voice; replace every (citation) placeholder with real sources. AI does not invent references — but verifying is your responsibility.' };

dictInsert['thesis.cite.library'] = { bn: 'সূত্র-লাইব্রেরি', hi: 'संदर्भ-लाइब्रेरी', en: 'Citation library' };
dictInsert['thesis.cite.libDesc'] = { bn: 'এন্ট্রি জমা রাখুন — শেষে এক ক্লিকে পুরো তালিকা তথ্যসূত্র পাতায় বসে যাবে: APA/MLA/Harvard/Chicago-তে বর্ণানুক্রমে, IEEE-তে [1], [2] ক্রমে। এক থিসিসে এক স্টাইল রাখুন।', hi: 'प्रविष्टियाँ सहेजें — बाद में एक क्लिक में पूरी सूची डालें।', en: 'Keep entries here — then insert the whole list onto the References page in one click: alphabetical for APA/MLA/Harvard/Chicago, [1],[2] order for IEEE. Use ONE style per thesis.' };
dictInsert['thesis.cite.addLib'] = { bn: 'লাইব্রেরিতে যোগ', hi: 'लाइब्रेरी में जोड़ें', en: 'Add to library' };
dictInsert['thesis.cite.libEmpty'] = { bn: 'লাইব্রেরি খালি — উপরে এন্ট্রি বানিয়ে "লাইব্রেরিতে যোগ" চাপুন। লাইব্রেরি ব্রাউজারে জমা থাকে।', hi: 'लाइब्रेरी खाली है — ऊपर प्रविष्टि बनाकर जोड़ें।', en: 'Library is empty — build an entry above and press "Add to library". The library is saved in your browser.' };
dictInsert['thesis.cite.libSaved'] = { bn: 'লাইব্রেরিতে যোগ হয়েছে — এখন {n}টি', hi: 'लाइब्रेरी में जुड़ा — अब {n}', en: 'Added to library — {n} entries now' };
dictInsert['thesis.cite.libInserted'] = { bn: '{n}টি এন্ট্রি তালিকা হিসেবে বসানো হয়েছে', hi: '{n} प्रविष्टि सूची के रूप में डाली गई', en: '{n} entries inserted as a list' };
dictInsert['thesis.cite.libInsertAll'] = { bn: 'সব তালিকা হিসেবে বসান ({n})', hi: 'सब सूची के रूप में डालें ({n})', en: 'Insert all as list ({n})' };
dictInsert['thesis.cite.libCopyAll'] = { bn: 'সব কপি', hi: 'सब कॉपी', en: 'Copy all' };
dictInsert['thesis.cite.libClear'] = { bn: 'খালি করুন', hi: 'खाली करें', en: 'Clear' };
dictInsert['thesis.cite.libRemove'] = { bn: 'এই এন্ট্রি মুছুন', hi: 'यह प्रविष्टि हटाएँ', en: 'Remove this entry' };

dictInsert['thesis.capt.title'] = { bn: 'চিত্র/টেবিল ক্যাপশন যোগ করুন', hi: 'चित्र/तालिका कैप्शन जोड़ें', en: 'Add figure/table captions' };
dictInsert['thesis.capt.desc'] = { bn: 'কার্সরে স্ট্যান্ডার্ড নম্বরযুক্ত ক্যাপশন বসে — "চিত্র ৩.১: বিবরণ (উৎস)"। চিত্র/টেবিলের ঠিক নিচে কার্সর রেখে বসান; ক্রম নং স্বয়ংক্রিয় বাড়ে।', hi: 'कर्सर पर मानक क्रमांकित कैप्शन जुड़ता है — "चित्र 3.1: विवरण (स्रोत)"।', en: 'Inserts a standard numbered caption at the cursor — "Figure 3.1: Caption (Source)". Place the cursor right under the figure/table; the serial auto-increments.' };
dictInsert['thesis.capt.kind'] = { bn: 'ধরন', hi: 'प्रकार', en: 'Kind' };
dictInsert['thesis.capt.figure'] = { bn: 'চিত্র', hi: 'चित्र', en: 'Figure' };
dictInsert['thesis.capt.table'] = { bn: 'টেবিল', hi: 'तालिका', en: 'Table' };
dictInsert['thesis.capt.chapter'] = { bn: 'অধ্যায়', hi: 'अध्याय', en: 'Chapter' };
dictInsert['thesis.capt.serial'] = { bn: 'ক্রম', hi: 'क्रम', en: 'Serial' };
dictInsert['thesis.capt.text'] = { bn: 'ক্যাপশনের লেখা', hi: 'कैप्शन का टेक्स्ट', en: 'Caption text' };
dictInsert['thesis.capt.text.ph'] = { bn: 'যেমন: মৌসুমভেদে পানির pH-এর তুলনা', hi: 'जैसे: मौसम अनुसार pH तुलना', en: 'e.g. Seasonal comparison of water pH' };
dictInsert['thesis.capt.source'] = { bn: 'উৎস (ঐচ্ছিক)', hi: 'स्रोत (वैकल्पिक)', en: 'Source (optional)' };
dictInsert['thesis.capt.source.ph'] = { bn: 'যেমন: নিজস্ব পর্যবেক্ষণ, ২০২৫', hi: 'जैसे: स्वयं का अवलोकन, 2025', en: 'e.g. Field survey, 2026' };
dictInsert['thesis.capt.insert'] = { bn: 'ক্যাপশন বসান', hi: 'कैप्शन डालें', en: 'Insert caption' };
dictInsert['thesis.capt.inserted'] = { bn: 'ক্যাপশন বসানো হয়েছে — ক্রম নং বেড়েছে', hi: 'कैप्शन डाला गया — क्रम बढ़ा', en: 'Caption inserted — serial incremented' };

dictInsert['thesis.fDate'] = { bn: 'জমার তারিখ (শিরোনাম পাতায়)', hi: 'जमा तिथि (शीर्षक पेज पर)', en: 'Submission date (title page)' };
dictInsert['thesis.fDate.ph'] = { bn: 'যেমন: মার্চ ২০২৬ / March 2026', hi: 'जैसे: मार्च 2026', en: 'e.g. March 2026' };
dictInsert['thesis.fDedication'] = { bn: 'উৎসর্গের লেখা (খালি = স্থানধারক)', hi: 'समर्पण का टेक्स्ट (खाली = प्लेसहोल्डर)', en: 'Dedication text (blank = placeholder)' };
dictInsert['thesis.fDedication.ph'] = { bn: 'যেমন: মা-বাবাকে', hi: 'जैसे: माता-पिता को', en: 'e.g. To my parents' };
dictInsert['thesis.opt.dedication'] = { bn: 'উৎসর্গপত্র', hi: 'समर्पण-पत्र', en: 'Dedication' };
dictInsert['thesis.univ.quick'] = { bn: 'দ্রুত পূরণ — বিশ্ববিদ্যালয়', hi: 'त्वरित भरण — विश्वविद्यालय', en: 'Quick fill — universities' };
dictInsert['thesis.example'] = { bn: 'উদাহরণ দিয়ে পূরণ', hi: 'उदाहरण से भरें', en: 'Fill with example' };
dictInsert['thesis.example.filled'] = { bn: 'উদাহরণ-তথ্য বসানো হয়েছে — দেখে নিজের তথ্য বদলান', hi: 'उदाहरण जानकारी भरी गई — अपनी जानकारी दें', en: 'Example details filled — replace them with yours' };
dictInsert['thesis.guide.tools'] = { bn: 'স্টুডিওর টুল: "সূত্র" ট্যাবের লাইব্রেরিতে এন্ট্রি জমা রাখুন — শেষে এক ক্লিকে সাজানো তথ্যসূত্র-তালিকা; "AI খসড়া" ট্যাব একাডেমিক খসড়া লিখে দেয় (সম্পাদনা করে নিন); নির্মাণ-ট্যাবের ক্যাপশন-টুল "চিত্র ৩.১" নম্বর ঠিক রাখে।', hi: 'स्टूडियो टूल: लाइब्रेरी, AI ड्राफ्ट, कैप्शन-टूल।', en: 'Studio tools: the Citations library saves entries — one click gives you the sorted reference list; the AI Draft tab writes academic drafts you then edit; the caption tool keeps "Figure 3.1" numbering straight.' };
