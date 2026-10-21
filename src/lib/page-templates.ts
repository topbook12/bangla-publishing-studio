/**
 * বইয়ের বিশেষ পাতার টেমপ্লেট — প্রিমিয়াম পাবলিশিং-হাউস ডিজাইন সংগ্রহ।
 *
 * ক্যাটাগরি: শিরোনাম পাতা, প্রারম্ভিক পাতা (হাফ টাইটেল/কপিরাইট/উৎসর্গ/উদ্ধৃতি/ভূমিকা/
 * কৃতজ্ঞতা/সনদ/ঘোষণা), সূচিপত্র, লেখক পরিচিতি, অধ্যায় সূচনা ও বিশেষ পাতা।
 *
 * ডিজাইন ভাষা (প্রিমিয়াম প্রকাশনী ধাঁচ):
 *  - প্যালেট: রয়্যাল মেরুন+গোল্ড (#7f1d1d/#9f1239 + #a16207/#b45309), প্লাম+গোল্ড (#701a75),
 *    গাঢ় টিল+গোল্ড (#134e4a), ফরেস্ট গ্রিন (#14532d), ক্লাসিক সেপিয়া (#5d4037/#7c2d12),
 *    এলিগেন্ট স্টোন (#292524/#57534e/#a8a29e) — ব্লু/ইন্ডিগো প্রাইমারি নয়।
 *  - টাইপোগ্রাফিক অলংকরণ: ❦ ❧ ❖ ✦ ✧ ━ ═ · — (কোনো ছবি/svg নয়)।
 *  - লেয়ারড ফ্রেম: buildDesignBoxHtml-এর ভেতরে buildDesignBoxHtml (নেস্টিং সমর্থিত)।
 *  - লেটার-স্পেসড ছোট ক্যাপশন (8–10pt + letter-spacing) × বড় ডিসপ্লে শিরোনাম (24–34pt)।
 *  - sp(n) দিয়ে উদার উল্লম্ব শ্বাস-প্রশ্বাস, শেডেড ব্যান্ড/রিবন হেডার।
 *
 * প্রতিটি টেমপ্লেটের HTML শুধুমাত্র এডিটর স্কিমা-বৈধ নোড ব্যবহার করে
 * (paragraph/heading + inline style, fancyDivider, callout-box, doc-textbox, toc-block, table) —
 * তাই এডিটর, প্রিন্ট, ফরমা, HTML/DOCX এক্সপোর্ট সব জায়গায় একই চেহারা ধরে রাখে।
 */

import { buildCalloutHtml, buildColumnsHtml, buildDesignBoxHtml, buildTocHtml } from './nodes-html';

export type TemplateCategory = 'title' | 'front' | 'toc' | 'author' | 'chapter' | 'special';

/** ত্রিভাষিক লেবেল (bn/hi/en) — টেমপ্লেট-গ্যালারি বিশ্বজনীন */
export interface TplT3 { bn: string; hi: string; en: string }
export const tplL3 = (bn: string, hi: string, en: string): TplT3 => ({ bn, hi, en });
type T3 = TplT3;
const L3 = tplL3;

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, T3> = {
  title: L3('শিরোনাম পাতা', 'शीर्षक पृष्ठ', 'Title Pages'),
  front: L3('প্রারম্ভিক পাতা', 'प्रारंभिक पृष्ठ', 'Front Matter'),
  toc: L3('সূচিপত্র', 'विषय-सूची', 'Table of Contents'),
  author: L3('লেখক পরিচিতি', 'लेखक परिचय', 'Author Bio'),
  chapter: L3('অধ্যায় সূচনা', 'अध्याय प्रारंभ', 'Chapter Openers'),
  special: L3('বিশেষ পাতা', 'विशेष पृष्ठ', 'Special Pages'),
};

export const TEMPLATE_CATEGORY_ORDER: TemplateCategory[] = ['title', 'front', 'toc', 'author', 'chapter', 'special'];

export interface PageTemplate {
  id: string;
  name: T3;
  desc: T3;
  /** কার্ড প্রিভিউয়ের অ্যাকসেন্ট রং */
  accent: string;
  category: TemplateCategory;
  /** পুরনো প্রিভিউ ফলব্যাকের ধরন */
  kind: 'title' | 'toc' | 'bio' | 'dedication' | 'copyright' | 'chapter' | 'preface' | 'half';
  html: string;
}

const TIP_NOTE =
  '<p class="tpl-hint" style="text-align:center"><span style="font-size:9pt; color:#94a3b8">প্লেসহোল্ডার লেখাগুলো মুছে নিজের তথ্য লিখুন</span></p>';

/** উল্লম্ব স্পেসার — পাতার মাঝবরাবর নামানোর জন্য */
const sp = (n: number) => Array.from({ length: n }, () => '<p style="text-align:center"></p>').join('\n');

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ═══════════════════════ শিরোনাম পাতা ═══════════════════════
  {
    id: 'title-classic',
    name: L3('ক্লাসিক অলংকৃত', 'क्लासिक अलंकृत', 'Classic Ornate'),
    desc: L3('রয়্যাল মেরুন-গোল্ড প্রামাণ্য শিরোনাম পাতা — অলংকরণ সারি, বড় শিরোনাম ও প্রকাশনী লাইন', 'रॉयल मरून-गोल्ड प्रमाणिक शीर्षक पृष्ठ — सजावटी पंक्ति, बड़ा शीर्षक और प्रकाशक लाइन', 'Royal Maroon-Gold Authentic Title Page — Ornament row, large title, and publisher line'),
    accent: '#7f1d1d',
    category: 'title',
    kind: 'title',
    html: `
${sp(3)}
<p style="text-align:center"><span style="font-size:12pt; color:#a16207; letter-spacing:2px">❦ ────────── ❖ ────────── ❦</span></p>
${sp(2)}
<h1 style="text-align:center; color:#7f1d1d; line-height:1.35"><span style="font-size:32pt">বইয়ের নাম লিখুন</span></h1>
<p style="text-align:center; padding:0 2em"><em><span style="font-size:13pt; color:#57534e; line-height:1.8">— উপশিরোনাম এখানে লিখুন —</span></em></p>
<p style="text-align:center"><span style="font-size:10pt; color:#b45309; letter-spacing:4px">✦ ✧ ✦</span></p>
${sp(2)}
<p style="text-align:center"><span style="font-size:15pt; color:#44403c; letter-spacing:1px"><strong>লেখকের নাম</strong></span></p>
<p style="text-align:center"><em><span style="font-size:10pt; color:#78716c">অনুবাদ বা সম্পাদনা থাকলে এখানে লিখুন</span></em></p>
${sp(3)}
<hr class="fancy-divider" data-style="flourish" />
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:3px">প্রকাশনীর নাম · প্রকাশকাল</span></p>
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'title-modern',
    name: L3('মডার্ন মিনিমাল', 'मॉडर्न मिनिमल', 'Modern Minimal'),
    desc: L3('সমসাময়িক ডিজাইন — গাঢ় টিল রেখা, বিশাল শিরোনাম ও নিঃশব্দ ব্যবধানে লেখক পরিচয়', 'समकालीन डिज़ाइन — गहरी टिल लाइन, विशाल शीर्षक और शांत अंतराल में लेखक परिचय', 'Contemporary Design — Bold Tilt Lines, Massive Title and Silent Spacing for Author Bio'),
    accent: '#134e4a',
    category: 'title',
    kind: 'title',
    html: `
<p style="text-align:center"><span style="font-size:9pt; color:#0f766e; letter-spacing:5px">প্রতিষ্ঠানের নাম</span></p>
<hr class="fancy-divider" data-style="single" />
${sp(6)}
<h1 style="text-align:center; color:#134e4a; line-height:1.3"><span style="font-size:34pt">বইয়ের নাম</span></h1>
<p style="text-align:center; padding:0 2em"><em><span style="font-size:12pt; color:#57534e; line-height:1.9">উপশিরোনাম এখানে লিখুন — এক লাইনে বইয়ের প্রতিশ্রুতি</span></em></p>
${sp(6)}
<p style="text-align:center"><span style="font-size:9pt; color:#0f766e; letter-spacing:5px">লিখেছেন</span></p>
<p style="text-align:center"><span style="font-size:15pt; color:#292524; letter-spacing:1px"><strong>লেখকের নাম</strong></span></p>
${sp(3)}
<hr class="fancy-divider" data-style="single" />
<p style="text-align:center"><span style="font-size:9pt; color:#78716c; letter-spacing:3px">সংস্করণ · প্রকাশকাল</span></p>
`.trim(),
  },
  {
    id: 'title-academic',
    name: L3('একাডেমিক সহায়িকা', 'एकाडेमिक सहायिका', 'Academic Handbook'),
    desc: L3('কোচিং/শিক্ষা প্রতিষ্ঠানের বইয়ের জন্য — প্রাতিষ্ঠানিক ব্যান্ড, কোর্স ও শ্রেণি তথ্যসহ', 'कोचिंग/शिक्षा प्रतिष्ठान के लिए — प्रातिष्ठानिक बैंड, कोर्स और कक्षा जानकारी के साथ', 'For Coaching/Educational Institution Books — With Institutional Band, Course and Class Information'),
    accent: '#14532d',
    category: 'title',
    kind: 'title',
    html: `
${buildDesignBoxHtml(
  { variant: 'shaded', border: '#14532d', fill: 'rgba(20,83,45,0.05)', bstyle: 'solid', bwidth: 1 },
  `<p style="text-align:center"><span style="font-size:14pt; color:#14532d; letter-spacing:1px"><strong>প্রতিষ্ঠানের পূর্ণ নাম</strong></span></p>
<p style="text-align:center"><span style="font-size:9pt; color:#57534e; letter-spacing:1px">ঠিকানা · মোবাইল · ওয়েবসাইট</span></p>`,
)}
${sp(1)}
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">সহায়িকা · গাইড · অনুশীলনী</span></p>
<h1 style="text-align:center; color:#14532d; line-height:1.35"><span style="font-size:27pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:12pt; color:#44403c">(বিষয় / শ্রেণি — যেমন: পদার্থবিজ্ঞান, একাদশ-দ্বাদশ)</span></p>
<hr class="fancy-divider" data-style="double" />
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'বইয়ের বিশেষত্ব', '<p>এক-দুই লাইনে লিখুন — যেমন: অধ্যায়ভিত্তিক নোট, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্নব্যাংকসহ পূর্ণাঙ্গ প্রস্তুতি।</p>')}
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:12pt; color:#292524"><strong>সম্পাদনা:</strong> লেখকের নাম</span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:2px">শিক্ষাবর্ষ ২০২৫–২৬</span></p>
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'title-royal-frame',
    name: L3('রাজকীয় ফ্রেম', 'राजकीय फ़्रेम', 'Royal Frame'),
    desc: L3('দ্বি-স্তর অলংকৃত ফ্রেমে বাঁধা রাজকীয় শিরোনাম — স্মারকগ্রন্থ ও উপহার সংস্করণের জন্য', 'दो-स्तरीय सजावटी फ्रेम में बंधा शाही शीर्षक — स्मारक पुस्तक और उपहार संस्करण के लिए', 'Royal Title in Two-Tier Ornate Frame — For Memorial Books and Gift Editions'),
    accent: '#9f1239',
    category: 'title',
    kind: 'title',
    html: `
${sp(1)}
${buildDesignBoxHtml(
  { variant: 'double', border: '#9f1239', fill: 'transparent', bstyle: 'double', bwidth: 5 },
  `${sp(1)}
${buildDesignBoxHtml(
  { variant: 'box', border: 'rgba(159,18,57,0.35)', fill: 'rgba(159,18,57,0.03)', bstyle: 'solid', bwidth: 1 },
  `${sp(1)}
<p style="text-align:center"><span style="font-size:11pt; color:#a16207; letter-spacing:3px">❖ ─────── ❖ ─────── ❖</span></p>
<h1 style="text-align:center; color:#7f1d1d; line-height:1.35"><span style="font-size:28pt">বইয়ের নাম</span></h1>
<p style="text-align:center; padding:0 1.5em"><em><span style="font-size:12pt; color:#57534e">উপশিরোনাম এখানে লিখুন</span></em></p>
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:4px">✦ ✧ ✦</span></p>
<p style="text-align:center"><span style="font-size:13pt; color:#44403c; letter-spacing:1px"><strong>লেখকের নাম</strong></span></p>
${sp(1)}
<p style="text-align:center"><span style="font-size:10pt; color:#78716c; letter-spacing:2px">প্রকাশনীর নাম · প্রকাশকাল</span></p>
${sp(1)}`,
)}
${sp(1)}`,
)}
${TIP_NOTE}
`.trim(),
  },

  // ═══════════════════════ প্রারম্ভিক পাতা ═══════════════════════
  {
    id: 'half-title',
    name: L3('হাফ টাইটেল', 'आधा शीर्षक', 'Half Title'),
    desc: L3('শুধু বইয়ের নাম — প্রকাশনী-শৈলী নীরব, মার্জিত প্রথম পাতা', 'सिर्फ पुस्तक का नाम — प्रकाशक-शैली शांत, सुंदर पहला पृष्ठ', 'Just the Book Title — Publisher-style quiet, elegant first page'),
    accent: '#78716c',
    category: 'front',
    kind: 'half',
    html: `
${sp(7)}
<h1 style="text-align:center; color:#292524; line-height:1.4"><span style="font-size:25pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:11pt; color:#a8a29e; letter-spacing:3px">❦</span></p>
${sp(3)}
`.trim(),
  },
  {
    id: 'copyright',
    name: L3('কপিরাইট / কলোফোন', 'कॉपीराइट / कॉलोफोन', 'Copyright / Colophon'),
    desc: L3('স্বত্ব সংরক্ষণ, সংস্করণ, মুদ্রণ ও মূল্য তথ্যের সেপিয়া-ধাঁচের প্রমিত কলোফোন পাতা', 'कॉपीराइट, संस्करण, प्रिंटिंग और मूल्य जानकारी का सेपिया-शैली का मानक कॉलोफोन पृष्ठ', 'Standard Colophon Page in Sepia Style with Copyright, Edition, Printing and Price Information'),
    accent: '#5d4037',
    category: 'front',
    kind: 'copyright',
    html: `
${sp(2)}
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:2px">❖ ────── ❖ ────── ❖</span></p>
<h2 style="text-align:center; color:#5d4037; letter-spacing:1px"><span style="font-size:16pt">বইয়ের নাম</span></h2>
<p style="text-align:center"><span style="font-size:11pt; color:#57534e">লেখকের নাম</span></p>
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'স্বত্ব সংরক্ষণ', '<p>সমস্ত স্বত্ব সংরক্ষিত © লেখক/প্রকাশনী, সাল</p><p>প্রথম সংস্করণ: সাল · দ্বিতীয় সংস্করণ: সাল</p><p>ISBN: ৯৭৮-………… · সিরিজ (প্রযোজ্য হলে)</p>')}
${buildCalloutHtml('note', 'প্রকাশনা ও মুদ্রণ', '<p>প্রকাশনা: প্রকাশনীর নাম, ঠিকানা</p><p>মুদ্রণ: মুদ্রণালয়ের নাম · বাঁধাই: প্রতিষ্ঠানের নাম</p><p>মূল্য: টাকা</p>')}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'dedication',
    name: L3('উৎসর্গ পাতা', 'उत्सर्ग पृष्ठ', 'Dedication Page'),
    desc: L3('প্লাম-গোল্ড আবেগী উৎসর্গ — মাঝবরাবর ছোট, ইটালিক লেখা ও অলংকরণ দিয়ে ঘেরা', 'प्लम-गोल्ड भावुक समर्पण — मध्य में छोटा, इटैलिक लेखा और सजावट से��रा', 'Plum-Gold Emotional Dedication — Centered small, italic text and decorative border'),
    accent: '#701a75',
    category: 'front',
    kind: 'dedication',
    html: `
${sp(6)}
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:5px">উৎসর্গ</span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#86198f; letter-spacing:2px">✦ ────────── ✦ ────────── ✦</span></p>
<p style="text-align:center"></p>
<p style="text-align:center; padding:0 2.5em"><em><span style="font-size:15pt; color:#701a75; line-height:1.9">উৎসর্গের লেখা এখানে লিখুন — যেমন: মা-বাবার ভালোবাসার জন্য, বা স্মরণীয় কোনো মানুষের নামে।</span></em></p>
<p style="text-align:center"><span style="font-size:11pt; color:#a16207">❦</span></p>
${sp(3)}
`.trim(),
  },
  {
    id: 'epigraph',
    name: L3('উদ্ধৃতি পাতা', 'उद्धरण पृष्ठ', 'Quote Page'),
    desc: L3('বইয়ের শুরুর অনুপ্রেরণামূলক উক্তি — গাঢ় টিল ছায়া-বক্সে কবিতা বা বাণীর একান্ত পাতা', 'पुस्तक की शुरुआत का प्रेरणादायक उद्धरण — गहरे टीले छाया-बॉक्स में कविता या वाणी का एकांत पृष्ठ', 'Book\'s Inspirational Quote — Dark teal shadow box with poem or saying on a dedicated page'),
    accent: '#134e4a',
    category: 'front',
    kind: 'dedication',
    html: `
${sp(5)}
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">✦ ✦ ✦</span></p>
<p style="text-align:center"></p>
${buildDesignBoxHtml(
  { variant: 'shaded', border: '#134e4a', fill: 'rgba(19,78,74,0.04)', bstyle: 'solid', bwidth: 1 },
  `<p style="text-align:center; padding:0 1.5em; line-height:1.9"><em><span style="font-size:15pt; color:#134e4a">“উদ্ধৃতির লেখা এখানে লিখুন — কবিতা, বাণী বা অনুপ্রেরণামূলক উক্তি।”</span></em></p>
<p style="text-align:center"><span style="font-size:10pt; color:#0f766e; letter-spacing:3px">— বক্তার নাম</span></p>`,
)}
${sp(4)}
`.trim(),
  },
  {
    id: 'preface',
    name: L3('ভূমিকা / প্রস্তাবনা', 'परिचय / प्रस्तावना', 'Introduction / Preface'),
    desc: L3('ফরেস্ট-গ্রিন শিরোনাম, ইনডেন্ট-ধাঁচের পাঠ্য ও স্বাক্ষরব্লকসহ ভূমিকা পাতা', 'फॉरेस्ट-ग्रीन शीर्षक, इंडेंट-शैली का पाठ और हस्ताक्षर ब्लॉक के साथ परिचय पृष्ठ', 'Forest-Green Title, indented-style text and signature block with introduction page'),
    accent: '#14532d',
    category: 'front',
    kind: 'preface',
    html: `
${sp(1)}
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">লেখকের কলম থেকে</span></p>
<h1 style="text-align:center; color:#14532d; letter-spacing:2px">ভূমিকা</h1>
<hr class="fancy-divider" data-style="flourish" />
<p style="text-indent:2em">এই বইটি লেখার উদ্দেশ্য ও পাঠক কী কী পাবেন — সংক্ষেপে লিখুন। প্রথম অনুচ্ছেদে বইয়ের প্রেক্ষাপট ও প্রয়োজনীয়তা তুলে ধরুন।</p>
<p style="text-indent:2em">দ্বিতীয় অনুচ্ছেদে বিষয়বস্তুর বিবরণ, ব্যবহারবিধি বা পাঠ পরিকল্পনা লিখুন।</p>
<p style="text-indent:2em">তৃতীয় অনুচ্ছেদে পাঠকের প্রতি আন্তরিক অনুরোধ বা শুভেচ্ছা জানান।</p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:3px">❦</span></p>
<p style="text-align:right"><em><span style="font-size:12pt; color:#292524"><strong>লেখকের নাম</strong></span></em></p>
<p style="text-align:right"><em><span style="font-size:10pt; color:#78716c">তারিখ ও স্থান</span></em></p>
`.trim(),
  },
  {
    id: 'acknowledgment',
    name: L3('কৃতজ্ঞতা স্বীকার', 'कृतज्ञता स्वीकार', 'Acknowledgement'),
    desc: L3('সেপিয়া শৈলীর কৃতজ্ঞতা পাতা — সহযোগী, পরামর্শদাতা ও প্রিয়জনদের আন্তরিক স্মরণ', 'सेपिया स्टाइल कृतज्ञता पृष्ठ — सहयोगी, सलाहकार और प्रियजनों का ईमानदार स्मरण', 'Sepia-Style Acknowledgments Page — Heartfelt Remembrance of Associates, Advisors, and Loved Ones'),
    accent: '#7c2d12',
    category: 'front',
    kind: 'preface',
    html: `
${sp(1)}
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">কৃতজ্ঞতার স্বীকৃতি</span></p>
<h1 style="text-align:center; color:#7c2d12; letter-spacing:2px">কৃতজ্ঞতা স্বীকার</h1>
<hr class="fancy-divider" data-style="double" />
<p style="text-indent:2em">বইটি লেখার প্রেরণা ও সহায়তার জন্য প্রথমেই কৃতজ্ঞতা জানাই — নাম লিখুন।</p>
<p style="text-indent:2em">পরামর্শ ও সমালোচনায় যাঁরা অবদান রেখেছেন, তাঁদের নাম ও পরিচয় লিখুন।</p>
<p style="text-indent:2em">পরিবার ও বন্ধুবান্ধবদের ধন্যবাদ — ধৈর্য ও ভালোবাসার জন্য।</p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:3px">✦ ✦ ✦</span></p>
<p style="text-align:right"><em><span style="font-size:12pt; color:#292524"><strong>লেখকের নাম</strong></span></em></p>
`.trim(),
  },
  {
    id: 'certificate',
    name: L3('সনদপত্র', 'प्रमाण पत्र', 'Certificates'),
    desc: L3('দ্বি-স্তর রাজকীয় ফ্রেমে অলংকৃত সনদ — প্রশংসাপত্র, কোর্স সম্পন্নকরণ বা অর্জনের প্রত্যয়নপত্র', 'दो-स्तरीय शाही फ्रेम में सजावटी प्रमाण-पत्र — प्रशंसापत्र, कोर्स पूर्णता या प्राप्ति का प्रमाण-पत्र', 'Decorated Certificate in Two-Tier Royal Frame — For Certificates of Appreciation, Course Completion or Achievement'),
    accent: '#9f1239',
    category: 'front',
    kind: 'copyright',
    html: `
${sp(1)}
${buildDesignBoxHtml(
  { variant: 'double', border: '#9f1239', fill: 'transparent', bstyle: 'double', bwidth: 5 },
  `${sp(1)}
${buildDesignBoxHtml(
  { variant: 'box', border: 'rgba(159,18,57,0.30)', fill: 'rgba(159,18,57,0.02)', bstyle: 'solid', bwidth: 1 },
  `${sp(1)}
<p style="text-align:center"><span style="font-size:12pt; color:#a16207; letter-spacing:3px">❦ ────────── ❖ ────────── ❦</span></p>
<h1 style="text-align:center; color:#7f1d1d; letter-spacing:4px"><span style="font-size:26pt">সনদপত্র</span></h1>
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">প্রশংসাপত্র · অর্জন · স্বীকৃতি</span></p>
<p style="text-align:center"></p>
<p style="text-align:center; padding:0 2em"><span style="font-size:12pt; color:#57534e">এই মর্মে প্রত্যয়ন করা হচ্ছে যে,</span></p>
<h2 style="text-align:center; color:#292524; letter-spacing:1px"><span style="font-size:19pt">শিক্ষার্থীর পূর্ণ নাম</span></h2>
<p style="text-align:center; padding:0 2em; line-height:1.9"><span style="font-size:11pt; color:#44403c">উপরোক্ত শিক্ষার্থী … (কোর্স/বিষয়ের নাম) … সফলতার সাথে সম্পন্ন করেছে এবং পরীক্ষায় … (গ্রেড/ফলাফল) … অর্জন করেছে।</span></p>
<p style="text-align:center; padding:0 2em"><span style="font-size:10pt; color:#78716c">তাঁর মেধা, পরিশ্রম ও নিয়মিত উপস্থিতির স্বীকৃতিস্বরূপ এই সনদপত্র প্রদান করা হলো।</span></p>
${sp(1)}
<p style="text-align:center"><span style="font-size:10pt; color:#9f1239; letter-spacing:2px">✦ ────────── ✦ ────────── ✦</span></p>
<table style="width:100%; border-collapse:collapse"><tbody><tr><td style="width:50%; border:none; text-align:center; padding:4px"><p style="text-align:center"><span style="font-size:11pt; color:#44403c">তারিখ: …………………………</span></p></td><td style="width:50%; border:none; text-align:center; padding:4px"><p style="text-align:center"><span style="font-size:11pt; color:#44403c">স্বাক্ষর: …………………………</span></p></td></tr></tbody></table>
<p style="text-align:center"><span style="font-size:9pt; color:#78716c; letter-spacing:1px">(প্রদানকারী কর্তৃপক্ষের পদবি ও প্রতিষ্ঠানের নাম)</span></p>
${sp(1)}`,
)}
${sp(1)}`,
)}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'declaration',
    name: L3('ঘোষণাপত্র', 'घोषणापत्र', 'Announcement'),
    desc: L3('গাঢ় ব্যান্ড-শিরোনামে লেখকের আনুষ্ঠানিক ঘোষণা — মৌলিকতা স্বীকার, স্বত্ব দাবি ও স্বাক্ষর', 'गाढ़ा बैंड-शीर्षक में लेखक का औपचारिक घोषणा — मौलिकता स्वीकार, कॉपीराइट दावा और हस्ताक्षर', 'Author\'s Formal Declaration with Dark Band-Header — Acknowledgement of Originality, Copyright Claim and Signature'),
    accent: '#292524',
    category: 'front',
    kind: 'preface',
    html: `
${sp(2)}
${buildDesignBoxHtml(
  { variant: 'shaded', border: '#292524', fill: 'rgba(41,37,36,0.05)', bstyle: 'solid', bwidth: 2 },
  '<h1 style="text-align:center; color:#292524; letter-spacing:4px"><span style="font-size:20pt">ঘোষণাপত্র</span></h1><p style="text-align:center"><span style="font-size:9pt; color:#78716c; letter-spacing:3px">লেখকের আনুষ্ঠানিক স্বীকারোক্তি</span></p>',
)}
<p style="text-align:center"></p>
<p style="text-indent:2em">আমি, …………………… (লেখকের পূর্ণ নাম), এই মর্মে আনুষ্ঠানিকভাবে ঘোষণা করছি যে এই বইটি আমি নিজে রচনা করেছি — এর সব লেখা, ব্যাখ্যা ও উপস্থাপনার সম্পূর্ণ দায়িত্ব আমার।</p>
<p style="text-indent:2em">বইটি রচনায় অন্য কোনো রচনার অনুলিপি বা স্বত্বলঙ্ঘন করা হয়নি; প্রয়োজনীয় স্থানে উৎসের যথাযথ উল্লেখ রাখা হয়েছে।</p>
<p style="text-indent:2em">এই বইয়ের কোনো অংশ লেখকের লিখিত অনুমতি ছাড়া কোনো প্রকারে পুনঃপ্রকাশ বা বিতরণ করা যাবে না।</p>
<p style="text-indent:2em">ভুলত্রুটির জন্য ক্ষমাপ্রার্থী — পাঠকদের মূল্যবান পরামর্শ পরবর্তী সংস্করণে সংযোজিত হবে।</p>
<p style="text-align:center"></p>
<p style="text-align:right"><span style="font-size:11pt; color:#292524">স্বাক্ষর: …………………………</span></p>
<p style="text-align:right"><em><span style="font-size:11pt; color:#78716c">লেখকের নাম ও তারিখ: …………………………</span></em></p>
`.trim(),
  },

  // ═══════════════════════ সূচিপত্র ═══════════════════════
  {
    id: 'toc-classic',
    name: L3('ক্লাসিক সূচিপত্র', 'क्लासिक सूचीपत्र', 'Classic Table of Contents'),
    desc: L3('অলংকরণ সারি ও ডাবল-লাইন শিরোনামসহ ঐতিহ্যবাহী সূচিপত্র — হেডিং থেকে স্বয়ংক্রিয় হালনাগাদ', 'अलंकरण पंक्ति और डबल-लाइन शीर्षक के साथ पारंपरिक सूची — शीर्षक से स्वचालित अपडेट', 'Traditional Index with Ornament Row and Double-Line Headings — Auto-update from Headings'),
    accent: '#7f1d1d',
    category: 'toc',
    kind: 'toc',
    html: `
${sp(1)}
<p style="text-align:center"><span style="font-size:11pt; color:#a16207; letter-spacing:2px">❦ ────────── ❖ ────────── ❦</span></p>
<h1 style="text-align:center; color:#7f1d1d; letter-spacing:3px">সূচিপত্র</h1>
<p style="text-align:center"><span style="font-size:9pt; color:#78716c; letter-spacing:4px">অধ্যায় ও পৃষ্ঠা নম্বর</span></p>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', '')}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'toc-modern',
    name: L3('মডার্ন ব্যান্ড সূচিপত্র', 'मॉडर्न बैंड सूचीपत्र', 'Modern Band Index'),
    desc: L3('গাঢ় টিল ব্যান্ড-হেডারে আধুনিক সূচিপত্র — ছায়া-পিল শিরোনাম ও প্রশস্ত ফাঁকা জায়গা', 'गाढ़ा टील बैंड-हेडर में आधुनिक सूचीपत्र — छाया-पील शीर्षक और चौड़ी खाली जगह', 'Modern Table of Contents with Dark Teal Band-Header — Shadow-Peel Titles and Wide Empty Space'),
    accent: '#0f766e',
    category: 'toc',
    kind: 'toc',
    html: `
${buildDesignBoxHtml(
  { variant: 'pill', border: '#0f766e', fill: 'rgba(15,118,110,0.07)', bstyle: 'solid', bwidth: 2 },
  '<h1 style="text-align:center; color:#134e4a; letter-spacing:3px"><span style="font-size:22pt">সূচিপত্র</span></h1><p style="text-align:center"><span style="font-size:9pt; color:#0f766e; letter-spacing:4px">বিষয়সূচি ও পৃষ্ঠা নম্বর</span></p>',
)}
<p style="text-align:center"></p>
${buildTocHtml('[]', '')}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'toc-detailed',
    name: L3('বিস্তারিত দুই-স্তর সূচিপত্র', 'विस्तृत दो-स्तरीय सूची', 'Detailed Two-Level Index'),
    desc: L3('অধ্যায় ও উপ-অধ্যায় দেখানোর গোল্ড-সেপিয়া বিস্তারিত সূচিপত্র — গাইড/সহায়িকার জন্য', 'अध्याय और उप-अध्याय दिखाने के लिए गोल्ड-सेपिया विस्तृत सूची — गाइड/सहायिका के लिए', 'Gold-Sepia Detailed Index Showing Chapters and Subchapters — For Guide/Handbook'),
    accent: '#a16207',
    category: 'toc',
    kind: 'toc',
    html: `
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:4px">✦ ✦ ✦</span></p>
<h1 style="text-align:center; color:#92702c; letter-spacing:3px">বিস্তারিত সূচিপত্র</h1>
<p style="text-align:center"><span style="font-size:9pt; color:#78716c; letter-spacing:3px">অধ্যায়, উপ-অধ্যায় ও পৃষ্ঠা নম্বর</span></p>
<hr class="fancy-divider" data-style="flourish" />
${buildTocHtml('[]', '')}
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'স্বয়ংক্রিয় হালনাগাদ', '<p>H1 = অধ্যায়, H2/H3 = উপ-বিষয় — হেডিং দিলেই সূচিতে ঢুকে যাবে। Design → Update Table of Contents চাপুন।</p>')}
${TIP_NOTE}
`.trim(),
  },

  // ═══════════════════════ লেখক পরিচিতি ═══════════════════════
  {
    id: 'author-bio',
    name: L3('ছবি-সহ পরিচিতি', 'चित्र-सहित परिचय', 'Introduction with Photo'),
    desc: L3('সোনালি ফ্রেমে ছবির ঘর, নাম-পদবি ও ইনডেন্ট-ধাঁচের জীবনীসহ পূর্ণাঙ্গ লেখক পাতা', 'सोने के फ्रेम में फोटो घर, नाम-पदवी और इंडेंट-शैली की जीवनी वाला पूर्ण लेखक पृष्ठ', 'Complete Author Page with Photo Frame in Gold, Name-Title and Indent-Style Biography'),
    accent: '#0f766e',
    category: 'author',
    kind: 'bio',
    html: `
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">কলমের ঝুলি · পরিচিতি</span></p>
<h2 style="text-align:center; color:#134e4a; letter-spacing:2px">লেখকের পরিচিতি</h2>
<hr class="fancy-divider" data-style="flourish" />
${buildDesignBoxHtml(
  { variant: 'box', border: '#b45309', fill: 'transparent', bstyle: 'solid', bwidth: 1 },
  `${sp(1)}
${buildDesignBoxHtml(
  { variant: 'shaded', border: '#a8a29e', fill: 'rgba(120,113,108,0.08)', bstyle: 'dashed', bwidth: 1 },
  '<p style="text-align:center"><span style="font-size:11pt; color:#78716c">📷 এখানে লেখকের ছবি বসান (Insert → Image) — বক্সের ভেতরে ক্লিক করে লিখও যাবে</span></p>',
)}
${sp(1)}`,
)}
<p style="text-align:center"></p>
<h3 style="text-align:center; color:#292524; letter-spacing:1px"><span style="font-size:16pt">লেখকের নাম</span></h3>
<p style="text-align:center"><em><span style="font-size:10pt; color:#0f766e; letter-spacing:2px">পদবি / পরিচয় — যেমন: সহকারী অধ্যাপক, পদার্থবিজ্ঞান</span></em></p>
<p style="text-align:center"></p>
<p style="text-indent:2em">লেখকের সংক্ষিপ্ত পরিচয় এখানে লিখুন — শিক্ষাগত যোগ্যতা, পেশা, অর্জন ও অন্যান্য প্রকাশিত বইয়ের তথ্য। প্রয়োজনে অনুচ্ছেদ যোগ করুন।</p>
<p style="text-indent:2em">দ্বিতীয় অনুচ্ছেদ — লেখকের বিশেষ কৃতিত্ব বা পাঠকদের উদ্দেশ্যে বক্তব্য।</p>
`.trim(),
  },
  {
    id: 'author-bio-simple',
    name: L3('সংক্ষিপ্ত পরিচিতি', 'संक्षिप्त परिचय', 'Brief Introduction'),
    desc: L3('ছবি ছাড়া নীরব মার্জিত পরিচিতি — কেন্দ্রীয় নাম, পদবি ও অথৈ দুই-তিন লাইনের জীবনী', 'चित्र के बिना नीरब शान्त परिचय — केंद्रीय नाम, पदवी और अथै दो-तीन लाइन की जीवनी', 'Quiet Elegant Introduction Without Photo — Central Name, Title and a Quiet Two-Three Line Biography'),
    accent: '#44403c',
    category: 'author',
    kind: 'bio',
    html: `
${sp(3)}
<p style="text-align:center"><span style="font-size:10pt; color:#a8a29e; letter-spacing:3px">✦ ────── ✦ ────── ✦</span></p>
<p style="text-align:center"><span style="font-size:9pt; color:#78716c; letter-spacing:4px">লেখক পরিচিতি</span></p>
${sp(1)}
<p style="text-align:center"><span style="font-size:18pt; color:#292524; letter-spacing:1px"><strong>লেখকের নাম</strong></span></p>
<p style="text-align:center"><em><span style="font-size:11pt; color:#57534e">পদবি, প্রতিষ্ঠান</span></em></p>
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:2px">───── ❦ ─────</span></p>
<p style="text-align:center; padding:0 2em; line-height:1.9"><span style="font-size:11pt; color:#44403c">লেখকের সংক্ষিপ্ত পরিচয় এখানে — শিক্ষা, পেশা, অর্জন ও প্রকাশিত বই। দুই-তিন লাইনেই পাঠকের সামনে লেখককে তুলে ধরুন।</span></p>
${sp(3)}
`.trim(),
  },

  // ═══════════════════════ অধ্যায় সূচনা ═══════════════════════
  {
    id: 'chapter-opener',
    name: L3('অধ্যায় সূচনা + শেখার তালিকা', 'अध्याय शुरुआत + सीखने की सूची', 'Chapter Start + Learning List'),
    desc: L3('বড় বাংলা সংখ্যা, অলংকরণ রেখা ও “এ অধ্যায়ে শিখবে” বক্স — গাইড বইয়ের জন্য', 'बड़ा बंगाली अंक, सजावटी रेखा और \'इस अध्याय में सीखें\' बॉक्स — गाइड पुस्तक के लिए', 'Large Bengali numeral, decorative line and \'What You\'ll Learn\' box — For guide books'),
    accent: '#7f1d1d',
    category: 'chapter',
    kind: 'chapter',
    html: `
${sp(2)}
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:5px">অধ্যায়</span></p>
<p style="text-align:center"><span style="font-size:34pt; color:#7f1d1d"><strong>১</strong></span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#a16207; letter-spacing:2px">❦ ────────── ❖ ────────── ❦</span></p>
<h1 style="text-align:center; color:#7f1d1d; line-height:1.3"><span style="font-size:25pt">অধ্যায়ের শিরোনাম</span></h1>
<p style="text-align:center"></p>
${buildCalloutHtml('concept', 'এ অধ্যায়ে শিখবে', '<ul><li>প্রথম শেখার বিষয়</li><li>দ্বিতীয় শেখার বিষয়</li><li>তৃতীয় শেখার বিষয়</li></ul>')}
<p style="text-align:center"></p>
<p style="text-indent:2em">অধ্যায়ের মূল লেখা এখানে শুরু হবে…</p>
`.trim(),
  },
  {
    id: 'chapter-minimal',
    name: L3('নিরীক্ষা অধ্যায় সূচনা', 'निरीक्षा अध्याय शुरुआत', 'Inspection Chapter Start'),
    desc: L3('বিশাল হালকা সংখ্যা ও নীরব শিরোনাম — উপন্যাস/সাহিত্যের অধ্যায় পাতা', 'विशाल हल्का अंक और शांत शीर्षक — उपन्यास/साहित्य का अध्याय पृष्ठ', 'Large light numeral and quiet title — Novel/literature chapter page'),
    accent: '#292524',
    category: 'chapter',
    kind: 'chapter',
    html: `
${sp(6)}
<p style="text-align:center"><span style="font-size:44pt; color:#d6d3d1; letter-spacing:2px"><strong>১</strong></span></p>
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">অধ্যায়</span></p>
<h1 style="text-align:center; color:#292524; line-height:1.35"><span style="font-size:22pt">অধ্যায়ের শিরোনাম</span></h1>
<p style="text-align:center"><span style="font-size:10pt; color:#a8a29e; letter-spacing:2px">━━━━ ❦ ━━━━</span></p>
${sp(3)}
`.trim(),
  },

  // ═══════════════════════ বিশেষ পাতা ═══════════════════════
  {
    id: 'about-book',
    name: L3('এই বইয়ের ভেতরে', 'इस पुस्तक के अंदर', 'Inside This Book'),
    desc: L3('ফরেস্ট-গ্রিন ব্যবহারবিধি পাতা — বইয়ের বৈশিষ্ট্য, আইকন ব্যাখ্যা ও পাঠ পরিকল্পনা', 'फॉरेस्ट-ग्रीन उपयोग निर्देश पृष्ठ — पुस्तक की विशेषताएं, आइकन स्पष्टीकरण और पाठ योजना', 'Forest-Green Usage Page — Book features, icon explanations and lesson plan'),
    accent: '#14532d',
    category: 'special',
    kind: 'preface',
    html: `
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">পাঠকের জন্য</span></p>
<h1 style="text-align:center; color:#14532d; letter-spacing:2px">এই বইয়ের ভেতরে</h1>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('concept', 'বইয়ের বৈশিষ্ট্য', '<ul><li>অধ্যায়ভিত্তিক সহজ ব্যাখ্যা</li><li>পরীক্ষায় আসা গুরুত্বপূর্ণ প্রশ্ন</li><li>অনুশীলনী ও উত্তরপত্র</li></ul>')}
${buildCalloutHtml('warning', 'আইকন পরিচিতি', '<p>💡 টিপস · ⚠ সতর্কতা · 📝 নোট · ❓ চিন্তা করার বিষয়</p>')}
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:3px">❦ ────── ❖ ────── ❦</span></p>
<p style="text-indent:2em"><strong>পাঠ পরিকল্পনা:</strong> প্রতিদিন কতটুকু পড়বেন, কীভাবে অনুশীলনী করবেন — সংক্ষেপে লিখুন।</p>
`.trim(),
  },
  {
    id: 'appendix',
    name: L3('পরিশিষ্ট', 'परिशिष्ट', 'Appendix'),
    desc: L3('ছায়া-বক্সে সাজানো সংযুক্তি সেকশন — টেবিল, চার্ট বা ফর্মুলা রাখার পরিশিষ্ট পাতা', 'छाया-बॉक्स में व्यवस्थित संलग्न अनुभाग — तालिका, चार्ट या सूत्र के लिए परिशिष्ट पृष्ठ', 'Shadow-boxed Attachment Section — Appendix Page for Tables, Charts or Formulas'),
    accent: '#57534e',
    category: 'special',
    kind: 'chapter',
    html: `
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:4px">সংযুক্তি ও রেফারেন্স</span></p>
<h1 style="text-align:center; color:#44403c; letter-spacing:3px">পরিশিষ্ট</h1>
<hr class="fancy-divider" data-style="dotted" />
${buildDesignBoxHtml(
  { variant: 'box', border: '#a8a29e', fill: 'rgba(120,113,108,0.05)', bstyle: 'solid', bwidth: 1 },
  `<p style="text-align:center"><span style="font-size:11pt; color:#57534e; letter-spacing:2px"><strong>পরিশিষ্ট ক — শিরোনাম</strong></span></p>
<p style="text-indent:2em">এখানে অতিরিক্ত তথ্য, টেবিল, চার্ট বা ফর্মুলা যোগ করুন…</p>`,
)}
<p style="text-align:center"></p>
${buildDesignBoxHtml(
  { variant: 'box', border: '#a8a29e', fill: 'rgba(120,113,108,0.05)', bstyle: 'solid', bwidth: 1 },
  `<p style="text-align:center"><span style="font-size:11pt; color:#57534e; letter-spacing:2px"><strong>পরিশিষ্ট খ — শিরোনাম</strong></span></p>
<p style="text-indent:2em">দ্বিতীয় সংযুক্তি — প্রয়োজনীয় তথ্য বা সারণি এখানে দিন…</p>`,
)}
`.trim(),
  },
  {
    id: 'back-colophon',
    name: L3('শেষ পাতা (বই সম্পর্কে)', 'अंतिम पृष्ठ (किताब के बारे में)', 'About the Book'),
    desc: L3('অলংকৃত বিদায়ী পাতা — আরও বইয়ের তালিকা ও প্রকাশনীর যোগাযোগ তথ্য', 'अलंकृत विदाई पृष्ठ — अधिक किताबों की सूची और प्रकाशन की संपर्क जानकारी', 'Ornamented Back Page — More Books List and Publisher Contact Info'),
    accent: '#7f1d1d',
    category: 'special',
    kind: 'copyright',
    html: `
${sp(3)}
<p style="text-align:center"><span style="font-size:12pt; color:#a16207; letter-spacing:2px">❧ ────────── ❦ ────────── ❧</span></p>
<p style="text-align:center"><em><span style="font-size:11pt; color:#78716c">আপনি সদ্য শেষ করলেন —</span></em></p>
<h2 style="text-align:center; color:#7f1d1d; letter-spacing:1px"><span style="font-size:22pt">বইয়ের নাম</span></h2>
<p style="text-align:center"><span style="font-size:10pt; color:#a16207">✦</span></p>
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'এই বই থেকে আরও', '<ul><li>একই লেখকের অন্য বই</li><li>পরবর্তী সংস্করণ / সিরিজ</li></ul>')}
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:12pt; color:#292524; letter-spacing:3px"><strong>প্রকাশনীর নাম</strong></span></p>
<p style="text-align:center"><span style="font-size:9pt; color:#78716c; letter-spacing:1px">ঠিকানা · ফোন · ওয়েবসাইট · ইমেইল</span></p>
${sp(2)}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'exam-2col',
    name: L3('প্রশ্নপত্র (দুই কলাম)', 'प्रश्नपत्र (दो स्तंभ)', 'Question Paper (Two Columns)'),
    desc: L3('পরীক্ষার প্রশ্নপত্র ধাঁচ — শিরোনাম-ব্যানার সহ প্রশ্নগুলো দুই কলামে, মাঝে রেখা; লেখা স্বয়ংক্রিয়ভাবে কলামে বয়ে যায়', 'परीक्षा प्रश्नपत्र डिज़ाइन — शीर्षक-बैनर के साथ प्रश्न दो स्तंभों में, बीच में रेखा; लेखा स्वचालित रूप से स्तंभ में बहता है', 'Exam Paper Template — Title-banner with questions in two columns, with a line in between; text automatically flows between columns'),
    accent: '#334155',
    category: 'special',
    kind: 'preface',
    html: `
<p style="text-align:center"><span style="font-size:10pt; color:#475569; letter-spacing:1px">শিক্ষা প্রতিষ্ঠানের নাম · শাখা</span></p>
<h1 style="text-align:center; color:#1e293b; letter-spacing:1px"><span style="font-size:22pt">ষষ্ঠ শ্রেণি গণিত মিট</span></h1>
<p style="text-align:center"><span style="font-size:10pt; color:#64748b">সময়: ২ ঘণ্টা ৩০ মিনিট &nbsp;·&nbsp; পূর্ণমান: ১০০</span></p>
<p style="text-align:center; margin-top:6px"><span style="background:#334155; color:#ffffff; padding:4px 56px; font-size:12pt; letter-spacing:3px; border-radius:3px"><strong>অতিসংক্ষিপ্ত প্রশ্ন</strong></span></p>
${buildColumnsHtml({ count: 2, gap: 26, rule: true }, `
<p><strong>১.</strong> একটি বর্গাকার বাগানের ক্ষেত্রফল ২৫৬০০ বর্গমিটার।</p>
<p style="padding-left:1.5em">ক. প্রতিটি বাহের দৈর্ঘ্য কত?</p>
<p style="padding-left:1.5em">খ. বাগানের চারপাশে বেড়া দিতে কত মিটার বেড়া লাগবে?</p>
<p style="padding-left:1.5em">গ. প্রতি মিটার বেড়ার খরচ ৭৫ টাকা হলে মোট খরচ কত হবে?</p>
<p><strong>২.</strong> একটি আয়তাকার মাঠের দৈর্ঘ্য অপেক্ষা প্রস্থ ২০ মিটার কম এবং মাঠটির ক্ষেত্রফল ৩০০০০ বর্গমিটার।</p>
<p style="padding-left:1.5em">ক. মাঠটির প্রস্থ কত?</p>
<p style="padding-left:1.5em">খ. মাঠটির চার কোণে খুঁট দিতে কত মিটার তার লাগবে?</p>
<p><strong>৩.</strong> একটি বর্গাকার ঘরের মেঝে পাকা করতে ৪৮৪টি বর্গফুট কাঠের তক্তা লাগে। ঘরটির এক বাহের দৈর্ঘ্য কত ফুট?</p>
<p><strong>৪.</strong> ২.৪ শতাংশ ক্ষেত্রফলকে বর্গমিটারে প্রকাশ কর।</p>
<p><strong>৫.</strong> একটি ত্রিভুজাকৃতি পতাকার ভূমি ৫০ সে.মি. ও উচ্চতা ৪০ সে.মি.। পতাকাটির ক্ষেত্রফল কত?</p>
<p><strong>৬.</strong> কোনো বর্গক্ষেত্রের কর্ণের দৈর্ঘ্য দিয়ে ক্ষেত্রফল নির্ণয়ের নিয়ম লিখুন।</p>
<p><strong>৭.</strong> একটি সমবাহু ত্রিভুজের পরিসীমা ৩৬ সে.মি. হলে প্রতিটি বাহের দৈর্ঘ্য কত?</p>
<p><strong>৮.</strong> আয়তাকার একটি খেলার মাঠের চারপাশে দৌড়ে এক পাক দিতে ৪০০ মিটার। প্রস্থ ৬০ মিটার হলে দৈর্ঘ্য কত?</p>
`)}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'magazine-3col',
    name: L3('ম্যাগাজিন পাতা (তিন কলাম)', 'मैगज़ीन पृष्ठ (तीन स्तंभ)', 'Magazine Page (Three Columns)'),
    desc: L3('স্কুল-ম্যাগাজিন/সংবাদপত্র ধাঁচ — মাস্টহেড শিরোনাম ও তিন কলাম লেখা; নিউজলেটার, দেয়াল-পত্রিকায়ও ব্যবহারযোগ্য', 'स्कूल-मैगज़ीन/समाचार पत्र शैली — मास्टहेड शीर्षक और तीन कॉलम लेखन; न्यूज़लेटर, दीवार-पत्रिका में भी उपयोगी', 'School-Magazine/Newspaper Style — Masthead Title and Three-Column Writing; Also Suitable for Newsletters, Wall Newspapers'),
    accent: '#9f1239',
    category: 'special',
    kind: 'preface',
    html: `
<p style="text-align:center"><span style="font-size:9pt; color:#9f1239; letter-spacing:5px">বার্ষিক সংখ্যা · সংখ্যা ১</span></p>
<h1 style="text-align:center; color:#9f1239; letter-spacing:2px"><span style="font-size:26pt">স্কুল ম্যাগাজিন</span></h1>
<p style="text-align:center"><span style="font-size:9.5pt; color:#78716c; letter-spacing:2px">প্রকাশ: মাস · সাল — সম্পাদনা: শিক্ষার্থী প্রকাশনা দল</span></p>
<hr class="fancy-divider" data-style="double" />
<h2 style="color:#44403c">প্রধান প্রতিবেদনের শিরোনাম এখানে</h2>
${buildColumnsHtml({ count: 3, gap: 22, rule: true }, `
<p style="text-indent:1.5em"><em>প্রথম কলাম:</em> লেখার শুরু এখানে — প্রতিবেদনের ভূমিকা, ঘটনার সূত্রপাত। প্লেসহোল্ডার লেখা মুছে নিজের লেখা বসান; এক কলাম ভরে গেলে লেখা স্বয়ংক্রিয়ভাবে পরের কলামে বয়ে যাবে।</p>
<p style="text-indent:1.5em">দ্বিতীয় অনুচ্ছেদ — বিস্তারিত বর্ণনা, উদ্ধৃতি ও পরিসংখ্যান। কলামের প্রস্থ ছোট বলে বাক্য ছোট রাখলে পড়া সহজ হয়।</p>
<p style="text-indent:1.5em">তৃতীয় অনুচ্ছেদ — ঘটনার পরিণতি ও ভবিষ্যৎ পরিকল্পনা।</p>
<p style="text-indent:1.5em">শেষ অনুচ্ছেদ — লেখকের পরিচয়: শ্রেণি, রোল।</p>
`)}
<p style="text-align:center"><span style="font-size:9pt; color:#a16207; letter-spacing:3px">❦ ────── ❖ ────── ❦</span></p>
${TIP_NOTE}
`.trim(),
  },
];

/** কার্ড প্রিভিউয়ের মিনি-লাইনগুলো (ফলব্যাক — আসল HTML প্রিভিউ লোড না হলে) */
export function templatePreviewRows(kind: PageTemplate['kind']): Array<{ w: string; h: number; center?: boolean; short?: boolean }> {
  switch (kind) {
    case 'title':
    case 'half':
      return [
        { w: '40%', h: 4, center: true },
        { w: '70%', h: 8, center: true },
        { w: '45%', h: 4, center: true },
        { w: '30%', h: 3, center: true },
        { w: '50%', h: 2, center: true },
      ];
    case 'toc':
      return [
        { w: '50%', h: 6, center: true },
        { w: '80%', h: 2 },
        { w: '72%', h: 2 },
        { w: '78%', h: 2 },
        { w: '66%', h: 2 },
      ];
    case 'bio':
      return [
        { w: '36%', h: 16, center: true },
        { w: '50%', h: 4, center: true },
        { w: '84%', h: 2 },
        { w: '76%', h: 2 },
      ];
    case 'dedication':
      return [
        { w: '52%', h: 5, center: true },
        { w: '24%', h: 2, center: true },
      ];
    case 'copyright':
      return [
        { w: '44%', h: 3, center: true },
        { w: '60%', h: 2, center: true },
        { w: '70%', h: 10, center: true },
      ];
    case 'preface':
      return [
        { w: '38%', h: 7, center: true },
        { w: '88%', h: 2 },
        { w: '92%', h: 2 },
        { w: '80%', h: 2 },
        { w: '30%', h: 2, center: true },
      ];
    case 'chapter':
      return [
        { w: '30%', h: 3, center: true },
        { w: '64%', h: 8, center: true },
        { w: '56%', h: 10, center: true },
      ];
    default:
      return [{ w: '60%', h: 4, center: true }];
  }
}
