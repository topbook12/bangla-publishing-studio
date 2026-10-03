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
