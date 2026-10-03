/**
 * অভিধান — home-tab + advanced-text
 * কী-প্রিফিক্স: home. (home-tab.tsx) / adv. (advanced-text.tsx)
 *
 * নিয়ম: মূল স্ট্রিং বাংলা হলে bn হুবহু রাখা হয়েছে; ইংরেজি হলে en রাখা হয়েছে।
 * টেকনিক্যাল টার্ম: Undo/Redo/MS Word/PDF ইত্যাদি ধরা হয়েছে ধার হিসেবে।
 */

import type { Dict } from './core';

export const dictHome: Dict = {
  // ─── ফন্ট গ্রুপ ───
  'home.group.font': { bn: 'ফন্ট', hi: 'फ़ॉन्ट', en: 'Font' },
  'home.font': { bn: 'ফন্ট', hi: 'फ़ॉन्ट', en: 'Font' },
  'home.fontsize': { bn: 'ফন্ট সাইজ', hi: 'फ़ॉन्ट साइज़', en: 'Font Size' },
  'home.size': { bn: 'সাইজ', hi: 'साइज़', en: 'Size' },
  'home.fontgroup.bangla': { bn: 'বাংলা ফন্ট', hi: 'बांग्ला फ़ॉन्ट', en: 'Bengali fonts' },
  'home.fontgroup.devanagari': { bn: 'দেবনাগরী (হিন্দি) ফন্ট', hi: 'देवनागरी (हिंदी) फ़ॉन्ट', en: 'Devanagari (Hindi) fonts' },

  'home.bold': { bn: 'বোল্ড', hi: 'बोल्ड', en: 'Bold' },
  'home.italic': { bn: 'ইটালিক', hi: 'इटैलिक', en: 'Italic' },
  'home.underline': { bn: 'আন্ডারলাইন', hi: 'अंडरलाइन', en: 'Underline' },
  'home.strike': { bn: 'স্ট্রাইকথ্রু', hi: 'स्ट्राइकथ्रू', en: 'Strikethrough' },
  'home.sup': { bn: 'সুপারস্ক্রিপ্ট', hi: 'सुपरस्क्रिप्ट', en: 'Superscript' },
  'home.sub': { bn: 'সাবস্ক্রিপ্ট', hi: 'सबस्क्रिप्ट', en: 'Subscript' },

  'home.color': { bn: 'রং', hi: 'रंग', en: 'Color' },
  'home.color.tip': { bn: 'রং ও হাইলাইট', hi: 'रंग और हाइलाइट', en: 'Color & Highlight' },
  'home.color.text': { bn: 'লেখার রং', hi: 'पाठ का रंग', en: 'Text Color' },
  'home.color.clear': { bn: 'রং ও হাইলাইট মুছুন', hi: 'रंग और हाइलाइट मिटाएँ', en: 'Clear color & highlight' },
  'home.highlighter': { bn: 'হাইলাইটার', hi: 'हाइलाइटर', en: 'Highlighter' },
  'home.highlight': { bn: 'হাইলাইট', hi: 'हाइलाइट', en: 'Highlight' },
  'home.clearformat': { bn: 'ফরম্যাট মুছুন', hi: 'फ़ॉर्मैट हटाएँ', en: 'Clear Formatting' },

  'home.formatpainter': { bn: 'ফরম্যাট পেইন্টার', hi: 'फ़ॉर्मैट पेंटर', en: 'Format Painter' },
  'home.formatpainter.tip': { bn: 'ফরম্যাট কপি/পেস্ট', hi: 'फ़ॉर्मैट कॉपी/पेस्ट', en: 'Copy/paste formatting' },
  'home.formatpainter.copied': { bn: 'ফরম্যাট কপি হয়েছে — যে লেখায় বসাতে চান সেটি সিলেক্ট করুন', hi: 'फ़ॉर्मैट कॉपी हो गया — जिस पाठ पर लगाना चाहते हैं उसे चुनें', en: 'Formatting copied — select the text you want to apply it to' },

  // ─── প্যারাগ্রাফ গ্রুপ ───
  'home.group.paragraph': { bn: 'প্যারাগ্রাফ', hi: 'पैराग्राफ़', en: 'Paragraph' },
  'home.lineheight': { bn: 'লাইন হাইট', hi: 'पंक्ति ऊँचाई', en: 'Line Height' },
  'home.lineheight.default': { bn: 'ডিফল্ট', hi: 'डिफ़ॉल्ट', en: 'Default' },
  'home.alignleft': { bn: 'বাঁ দিকে সারিবদ্ধ', hi: 'बाएँ संरेखित करें', en: 'Align Left' },
  'home.center': { bn: 'কেন্দ্রে', hi: 'केंद्र में', en: 'Center' },
  'home.alignright': { bn: 'ডান দিকে সারিবদ্ধ', hi: 'दाएँ संरेखित करें', en: 'Align Right' },
  'home.justify': { bn: 'জাস্টিফাই', hi: 'जस्टिफ़ाई', en: 'Justify' },
  'home.bullets': { bn: 'বুলেট', hi: 'बुलेट', en: 'Bullets' },
  'home.numbering': { bn: 'নম্বরিং', hi: 'नंबरिंग', en: 'Numbering' },
  'home.quote': { bn: 'উদ্ধৃতি', hi: 'उद्धरण', en: 'Quote' },
  'home.moveup': { bn: 'উপরে সরান', hi: 'ऊपर ले जाएँ', en: 'Move Up' },
  'home.moveup.tip': { bn: 'টেবিল/বক্স/ছবি সহ পুরো ব্লক উপরে সরান', hi: 'तालिका/बॉक्स/चित्र सहित पूरा ब्लॉक ऊपर ले जाएँ', en: 'Move the whole block (table/box/image) up' },
  'home.movedown': { bn: 'নিচে সরান', hi: 'नीचे ले जाएँ', en: 'Move Down' },
  'home.movedown.tip': { bn: 'টেবিল/বক্স/ছবি সহ পুরো ব্লক নিচে সরান', hi: 'तालिका/बॉक्स/चित्र सहित पूरा ब्लॉक नीचे ले जाएँ', en: 'Move the whole block (table/box/image) down' },

  'home.texttools': { bn: 'টেক্সট টুলস', hi: 'टेक्स्ट टूल्स', en: 'Text Tools' },
  'home.texttools.tip': { bn: 'Text Tools — কেস/সংখ্যা রূপান্তর', hi: 'टेक्स्ट टूल्स — केस/अंक रूपांतरण', en: 'Text Tools — case/number conversion' },
  'home.texttools.bn2en': { bn: 'বাংলা সংখ্যা → ইংরেজি (১২৩ → 123)', hi: 'बांग्ला अंक → अंग्रेज़ी (१२३ → 123)', en: 'Bangla digits → English (১২৩ → 123)' },
  'home.texttools.en2bn': { bn: 'ইংরেজি → বাংলা সংখ্যা (123 → ১২৩)', hi: 'अंग्रेज़ी → बांग्ला अंक (123 → १२३)', en: 'English → Bangla digits (123 → ১২৩)' },
  'home.texttools.upper': { bn: 'আপারকেস', hi: 'अपरकेस', en: 'UPPERCASE' },
  'home.texttools.lower': { bn: 'লোয়ারকেস', hi: 'लोअरकेस', en: 'lowercase' },
  'home.texttools.titlecase': { bn: 'টাইটেল কেস', hi: 'टाइटल केस', en: 'Title Case' },
  'home.texttools.dropcap': { bn: 'ড্রপ ক্যাপ টগল (প্রথম অক্ষর বড়)', hi: 'ड्रॉप कैप टॉगल (पहला अक्षर बड़ा)', en: 'Toggle drop cap (enlarge first letter)' },
  'home.texttools.noselection': { bn: 'আগে কিছু লেখা সিলেক্ট করুন', hi: 'पहले कुछ पाठ चुनें', en: 'Select some text first' },
  'home.texttools.dropcap.need': { bn: 'ড্রপ ক্যাপ প্রয়োগের জন্য প্যারাগ্রাফে কার্সর রাখুন', hi: 'ड्रॉप कैप लगाने के लिए पैराग्राफ़ में कर्सर रखें', en: 'Place the cursor in a paragraph to apply a drop cap' },

  // ─── স্টাইল গ্রুপ ───
  'home.group.styles': { bn: 'স্টাইল', hi: 'शैलियाँ', en: 'Styles' },
  'home.h1': { bn: 'শিরোনাম ১', hi: 'शीर्षक १', en: 'Heading 1' },
  'home.h2': { bn: 'শিরোনাম ২', hi: 'शीर्षक २', en: 'Heading 2' },
  'home.h3': { bn: 'শিরোনাম ৩', hi: 'शीर्षक ३', en: 'Heading 3' },
  'home.normal': { bn: 'সাধারণ লেখা', hi: 'सामान्य पाठ', en: 'Normal Text' },

  // ─── Advanced Text গ্রুপ ───
  'adv.group.title': { bn: 'অ্যাডভান্সড টেক্সট', hi: 'उन्नत टेक्स्ट', en: 'Advanced Text' },
  'adv.preview.sample': { bn: 'আমার সোনার বাংলা — এই নমুনা লাইনে আপনার সব ফাঁক ও ইনডেন্ট যেভাবে দেখাবে, বইয়ে ঠিক তেমনই ছাপা হবে।', hi: 'यह नमूना पंक्ति है — इसमें आपके सभी फ़ाइले और इंडेंट जिस तरह दिखेंगे, पुस्तक में ठीक उसी तरह छपेंगे।', en: 'A sample line — your gaps and indents appear here exactly as they will print in the book.' },

  // ─── Word Gap ───
  'adv.wordgap': { bn: 'শব্দের ফাঁক', hi: 'शब्द अंतराल', en: 'Word Gap' },
  'adv.wordgap.label': { bn: 'শব্দের মাঝের ফাঁক', hi: 'शब्दों के बीच का फ़ाइला', en: 'Space between words' },
  'adv.preset.default': { bn: 'সাধারণ (ডিফল্ট)', hi: 'सामान्य (डिफ़ॉल्ट)', en: 'Normal (default)' },
  'adv.wordgap.tight': { bn: 'সংকুচিত (−১px)', hi: 'संकुचित (−१px)', en: 'Condensed (−1px)' },
  'adv.wordgap.1': { bn: '১px ফাঁক', hi: '१px फ़ाइला', en: '1px gap' },
  'adv.wordgap.2': { bn: '২px ফাঁক', hi: '२px फ़ाइला', en: '2px gap' },
  'adv.wordgap.3': { bn: '৩px ফাঁক', hi: '३px फ़ाइला', en: '3px gap' },
  'adv.wordgap.5': { bn: '৫px ফাঁক', hi: '५px फ़ाइला', en: '5px gap' },
  'adv.wordgap.8': { bn: '৮px ফাঁক (ঢিলা)', hi: '८px फ़ाइला (खुला)', en: '8px gap (loose)' },
  'adv.wordgap.book': { bn: 'বই-জাস্টিফাইড (০.১২em)', hi: 'पुस्तक-जस्टिफ़ाई (०.१२em)', en: 'Book-justified (0.12em)' },
  'adv.wordgap.booklg': { bn: 'বই-জাস্টিফাইড বড় (০.২৫em)', hi: 'पुस्तक-जस्टिफ़ाई बड़ा (०.२५em)', en: 'Book-justified large (0.25em)' },

  // ─── Char Gap ───
  'adv.chargap': { bn: 'অক্ষরের ফাঁক', hi: 'अक्षर अंतराल', en: 'Char Gap' },
  'adv.chargap.para': { bn: 'প্যারাগ্রাফ জুড়ে (শিরোনামে দারুণ মানায়)', hi: 'पूरे पैराग्राफ़ पर (शीर्षकों के लिए बहुत उपयुक्त)', en: 'Across the paragraph (great for headings)' },
  'adv.normal': { bn: 'সাধারণ', hi: 'सामान्य', en: 'Normal' },
  'adv.chargap.tight': { bn: 'সংকুচিত (−০.৫px)', hi: 'संकुचित (−०.५px)', en: 'Condensed (−0.5px)' },
  'adv.chargap.wide': { bn: 'প্রশস্ত (০.৫px)', hi: 'प्रशस्त (०.५px)', en: 'Expanded (0.5px)' },
  'adv.chargap.1': { bn: '১px', hi: '१px', en: '1px' },
  'adv.chargap.2': { bn: '২px', hi: '२px', en: '2px' },
  'adv.chargap.sel': { bn: 'শুধু সিলেক্ট করা লেখায়', hi: 'केवल चुने हुए पाठ पर', en: 'Only the selected text' },

  // ─── Para Gap ───
  'adv.paragap': { bn: 'প্যারা গ্যাপ', hi: 'पैरा अंतराल', en: 'Para Gap' },
  'adv.paragap.label': { bn: 'প্যারার আগে/পরে ফাঁক', hi: 'पैराग्राफ़ के पहले/बाद का फ़ाइला', en: 'Space before/after paragraphs' },
  'adv.paragap.tight': { bn: 'টাইট — ৩pt', hi: 'टाइट — ३pt', en: 'Tight — 3pt' },
  'adv.paragap.medium': { bn: 'মাঝারি — ৬pt', hi: 'मध्यम — ६pt', en: 'Medium — 6pt' },
  'adv.paragap.loose': { bn: 'ঢিলা — ১২pt', hi: 'खुला — १२pt', en: 'Loose — 12pt' },
  'adv.paragap.chapter': { bn: 'অধ্যায়-বিরতি — আগে ২৪pt', hi: 'अध्याय-विराम — पहले २४pt', en: 'Chapter break — 24pt before' },

  // ─── Indent / First Line ───
  'adv.indent': { bn: 'ইনডেন্ট', hi: 'इंडेंट', en: 'Indent' },
  'adv.indent.tip': { bn: 'বামে ইনডেন্ট বাড়ান (+০.৫em)', hi: 'बाएँ इंडेंट बढ़ाएँ (+०.५em)', en: 'Increase left indent (+0.5em)' },
  'adv.outdent': { bn: 'আউটডেন্ট', hi: 'आउटडेंट', en: 'Outdent' },
  'adv.outdent.tip': { bn: 'ইনডেন্ট কমান (−০.৫em)', hi: 'इंडेंट घटाएँ (−०.५em)', en: 'Decrease indent (−0.5em)' },
  'adv.none': { bn: 'নেই', hi: 'कोई नहीं', en: 'None' },
  'adv.firstline': { bn: 'প্রথম লাইন ইনডেন্ট', hi: 'पहली पंक्ति इंडेंट', en: 'First line indent' },
  'adv.firstline.tip': { bn: 'প্রথম লাইন ইনডেন্ট — প্যারা শুরুর ফাঁক (বাংলা বইয়ের রীতি)', hi: 'पहली पंक्ति इंडेंट — पैराग्राफ़ की शुरुआत का फ़ाइला (बांग्ला पुस्तकों की परंपरा)', en: 'First line indent — paragraph-opening gap (Bengali book convention)' },
  'adv.firstline.short': { bn: '১ম লাইন', hi: 'पहली पंक्ति', en: '1st line' },
  'adv.firstline.05': { bn: '০.৫em', hi: '०.५em', en: '0.5em' },
  'adv.firstline.1': { bn: '১em (চার্টার্ড)', hi: '१em (चार्टर्ड)', en: '1em (one em)' },
  'adv.firstline.125': { bn: '১.২৫em', hi: '१.२५em', en: '1.25em' },
  'adv.firstline.15': { bn: '১.৫em', hi: '१.५em', en: '1.5em' },
  'adv.firstline.2': { bn: '২em', hi: '२em', en: '2em' },

  // ─── বিশেষ চিহ্ন ───
  'adv.specialchars': { bn: 'বিশেষ চিহ্ন', hi: 'विशेष चिह्न', en: 'Special characters' },
  'adv.symbols': { bn: 'প্রতীক', hi: 'प्रतीक', en: 'Symbols' },
  'adv.char.inserted': { bn: '{c} বসানো হয়েছে — অদৃশ্য চিহ্ন, লেখায় প্রভাব ফেলে', hi: '{c} डाल दिया गया — अदृश्य चिह्न, पाठ पर असर पड़ता है', en: '{c} inserted — an invisible character that affects the text' },
  'adv.chargroup.bangla': { bn: 'বাংলা', hi: 'बांग्ला', en: 'Bangla' },
  'adv.char.dari': { bn: 'দাঁড়ি', hi: 'दाँड़ी (पूर्ण विराम)', en: 'Daṛi (Bengali full stop)' },
  'adv.char.daridari': { bn: 'ডবল দাঁড়ি', hi: 'दोहरा दाँड़ी', en: 'Double daṛi (॥)' },
  'adv.char.taka': { bn: 'টাকা চিহ্ন', hi: 'टाका चिह्न', en: 'Taka sign (৳)' },
  'adv.char.avagraha': { bn: 'অবগ্রহ', hi: 'अवग्रह', en: 'Avagraha (ঽ)' },
  'adv.chargroup.dashes': { bn: 'ড্যাশ ও উদ্ধৃতি', hi: 'डैश और उद्धरण चिह्न', en: 'Dashes & quotes' },
  'adv.char.hyphen': { bn: 'হাইফেন', hi: 'हाइफ़न', en: 'Hyphen' },
  'adv.char.endash': { bn: 'এন ড্যাশ', hi: 'एन डैश', en: 'En dash' },
  'adv.char.emdash': { bn: 'এম ড্যাশ', hi: 'एम डैश', en: 'Em dash' },
  'adv.char.ellipsis': { bn: 'ইলিপসিস', hi: 'इलिप्सिस', en: 'Ellipsis' },
  'adv.char.quotel': { bn: 'কোট বাম', hi: 'बायाँ उद्धरण चिह्न', en: 'Left single quote' },
  'adv.char.quoter': { bn: 'কোট ডান', hi: 'दायाँ उद्धरण चिह्न', en: 'Right single quote' },
  'adv.char.dquotel': { bn: 'ডাবল কোট বাম', hi: 'बायाँ डबल उद्धरण चिह्न', en: 'Left double quote' },
  'adv.char.dquoter': { bn: 'ডাবল কোট ডান', hi: 'दायाँ डबल उद्धरण चिह्न', en: 'Right double quote' },
  'adv.chargroup.spaces': { bn: 'স্পেস ও যুক্তবর্ণ নিয়ন্ত্রণ', hi: 'स्पेस और संयुक्ताक्षर नियंत्रण', en: 'Spaces & conjunct controls' },
  'adv.char.nbsp': { bn: 'নন-ব্রেকিং স্পেস', hi: 'नॉन-ब्रेकिंग स्पेस', en: 'Non-breaking space' },
  'adv.char.zwsp': { bn: 'জিরো-উইডথ স্পেস', hi: 'ज़ीरो-विड्थ स्पेस', en: 'Zero-width space' },
  'adv.char.zwnj': { bn: 'ZWNJ — যুক্তবর্ণ ভাঙুন', hi: 'ZWNJ — संयुक्ताक्षर तोड़ें', en: 'ZWNJ — break a conjunct' },
  'adv.char.zwj': { bn: 'ZWJ — যুক্তবর্ণ জোড়া রাখুন', hi: 'ZWJ — संयुक्ताक्षर जोड़े रखें', en: 'ZWJ — keep a conjunct joined' },
  'adv.char.shy': { bn: 'সফট হাইফেন', hi: 'सॉफ़्ट हाइफ़न', en: 'Soft hyphen' },
  'adv.chargroup.other': { bn: 'অন্যান্য', hi: 'अन्य', en: 'Other' },
  'adv.char.bullet': { bn: 'বুলেট', hi: 'बुलेट', en: 'Bullet' },
  'adv.char.times': { bn: 'গুণ', hi: 'गुणन चिह्न', en: 'Multiplication sign' },
  'adv.char.divide': { bn: 'ভাগ', hi: 'विभाजन चिह्न', en: 'Division sign' },
  'adv.char.plusminus': { bn: 'প্লাস-মাইনাস', hi: 'प्लस-माइनस', en: 'Plus-minus sign' },
  'adv.char.degree': { bn: 'ডিগ্রি', hi: 'डिग्री', en: 'Degree sign' },
  'adv.char.copyright': { bn: 'কপিরাইট', hi: 'कॉपीराइट', en: 'Copyright sign' },
  'adv.char.registered': { bn: 'রেজিস্টার্ড', hi: 'रजिस्टर्ड', en: 'Registered sign' },
  'adv.char.trademark': { bn: 'ট্রেডমার্ক', hi: 'ट्रेडमार्क', en: 'Trademark sign' },

  // ─── Spacing পপওভার ───
  'adv.spacing': { bn: 'স্পেসিং', hi: 'स्पेसिंग', en: 'Spacing' },
  'adv.spacing.aria': { bn: 'ফাঁক ও ইনডেন্ট', hi: 'फ़ाइला और इंडेंट', en: 'Spacing and indent' },
  'adv.spacing.tip': { bn: 'Spacing & Indent — সব ফাঁক ও ইনডেন্ট এক জায়গায়', hi: 'स्पेसिंग और इंडेंट — सभी फ़ाइले और इंडेंट एक जगह पर', en: 'Spacing & Indent — all gaps and indents in one place' },
  'adv.pop.wordgap': { bn: 'শব্দের ফাঁক', hi: 'शब्द फ़ाइला', en: 'Word gap' },
  'adv.pop.chargap': { bn: 'অক্ষরের ফাঁক', hi: 'अक्षर फ़ाइला', en: 'Char gap' },
  'adv.pop.before': { bn: 'প্যারার আগে ফাঁক (pt)', hi: 'पैराग्राफ़ से पहले का फ़ाइला (pt)', en: 'Space before (pt)' },
  'adv.pop.after': { bn: 'প্যারার পরে ফাঁক (pt)', hi: 'पैराग्राफ़ के बाद का फ़ाइला (pt)', en: 'Space after (pt)' },
  'adv.pop.firstline': { bn: '১ম লাইন ইনডেন্ট (em)', hi: 'पहली पंक्ति इंडेंट (em)', en: 'First line indent (em)' },
  'adv.pop.left': { bn: 'বাম ইনডেন্ট (em)', hi: 'बायाँ इंडेंट (em)', en: 'Left indent (em)' },
  'adv.pop.right': { bn: 'ডান ইনডেন্ট (em)', hi: 'दायाँ इंडेंट (em)', en: 'Right indent (em)' },
  'adv.pop.shading': { bn: 'প্যারা পটভূমি (Shading)', hi: 'पैराग्राफ़ पृष्ठभूमि (शेडिंग)', en: 'Paragraph background (shading)' },
  'adv.pop.shading.swatch': { bn: 'প্যারা পটভূমি', hi: 'पैराग्राफ़ पृष्ठभूमि', en: 'Paragraph background' },
  'adv.pop.shading.custom': { bn: 'কাস্টম প্যারা পটভূমি রং', hi: 'कस्टम पैराग्राफ़ पृष्ठभूमि रंग', en: 'Custom paragraph background color' },
  'adv.pop.colorcustom': { bn: 'কাস্টম রং', hi: 'कस्टम रंग', en: 'Custom color' },
  'adv.pop.reset': { bn: 'সব রিসেট করুন (ফাঁক + ইনডেন্ট + পটভূমি)', hi: 'सब कुछ रीसेट करें (फ़ाइला + इंडेंट + पृष्ठभूमि)', en: 'Reset all (gaps + indents + background)' },
  'adv.pop.reset.toast': { bn: 'প্যারার উন্নত ফরম্যাট রিসেট হয়েছে', hi: 'पैराग्राफ़ की उन्नत फ़ॉर्मैटिंग रीसेट हो गई', en: 'Advanced paragraph formatting has been reset' },
};
