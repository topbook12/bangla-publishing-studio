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
