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

import { buildCalloutHtml, buildDesignBoxHtml, buildTocHtml } from './nodes-html';

export type TemplateCategory = 'title' | 'front' | 'toc' | 'author' | 'chapter' | 'special';

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  title: 'শিরোনাম পাতা',
  front: 'প্রারম্ভিক পাতা',
  toc: 'সূচিপত্র',
  author: 'লেখক পরিচিতি',
  chapter: 'অধ্যায় সূচনা',
  special: 'বিশেষ পাতা',
};

export const TEMPLATE_CATEGORY_ORDER: TemplateCategory[] = ['title', 'front', 'toc', 'author', 'chapter', 'special'];

export interface PageTemplate {
  id: string;
  name: string;
  desc: string;
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
    name: 'ক্লাসিক অলংকৃত',
    desc: 'রয়্যাল মেরুন-গোল্ড প্রামাণ্য শিরোনাম পাতা — অলংকরণ সারি, বড় শিরোনাম ও প্রকাশনী লাইন',
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
    name: 'মডার্ন মিনিমাল',
    desc: 'সমসাময়িক ডিজাইন — গাঢ় টিল রেখা, বিশাল শিরোনাম ও নিঃশব্দ ব্যবধানে লেখক পরিচয়',
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
    name: 'একাডেমিক সহায়িকা',
    desc: 'কোচিং/শিক্ষা প্রতিষ্ঠানের বইয়ের জন্য — প্রাতিষ্ঠানিক ব্যান্ড, কোর্স ও শ্রেণি তথ্যসহ',
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
    name: 'রাজকীয় ফ্রেম',
    desc: 'দ্বি-স্তর অলংকৃত ফ্রেমে বাঁধা রাজকীয় শিরোনাম — স্মারকগ্রন্থ ও উপহার সংস্করণের জন্য',
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
    name: 'হাফ টাইটেল',
    desc: 'শুধু বইয়ের নাম — প্রকাশনী-শৈলী নীরব, মার্জিত প্রথম পাতা',
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
    name: 'কপিরাইট / কলোফোন',
    desc: 'স্বত্ব সংরক্ষণ, সংস্করণ, মুদ্রণ ও মূল্য তথ্যের সেপিয়া-ধাঁচের প্রমিত কলোফোন পাতা',
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
    name: 'উৎসর্গ পাতা',
    desc: 'প্লাম-গোল্ড আবেগী উৎসর্গ — মাঝবরাবর ছোট, ইটালিক লেখা ও অলংকরণ দিয়ে ঘেরা',
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
    name: 'উদ্ধৃতি পাতা',
    desc: 'বইয়ের শুরুর অনুপ্রেরণামূলক উক্তি — গাঢ় টিল ছায়া-বক্সে কবিতা বা বাণীর একান্ত পাতা',
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
    name: 'ভূমিকা / প্রস্তাবনা',
    desc: 'ফরেস্ট-গ্রিন শিরোনাম, ইনডেন্ট-ধাঁচের পাঠ্য ও স্বাক্ষরব্লকসহ ভূমিকা পাতা',
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
    name: 'কৃতজ্ঞতা স্বীকার',
    desc: 'সেপিয়া শৈলীর কৃতজ্ঞতা পাতা — সহযোগী, পরামর্শদাতা ও প্রিয়জনদের আন্তরিক স্মরণ',
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
    name: 'সনদপত্র',
    desc: 'দ্বি-স্তর রাজকীয় ফ্রেমে অলংকৃত সনদ — প্রশংসাপত্র, কোর্স সম্পন্নকরণ বা অর্জনের প্রত্যয়নপত্র',
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
    name: 'ঘোষণাপত্র',
    desc: 'গাঢ় ব্যান্ড-শিরোনামে লেখকের আনুষ্ঠানিক ঘোষণা — মৌলিকতা স্বীকার, স্বত্ব দাবি ও স্বাক্ষর',
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
    name: 'ক্লাসিক সূচিপত্র',
    desc: 'অলংকরণ সারি ও ডাবল-লাইন শিরোনামসহ ঐতিহ্যবাহী সূচিপত্র — হেডিং থেকে স্বয়ংক্রিয় হালনাগাদ',
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
    name: 'মডার্ন ব্যান্ড সূচিপত্র',
    desc: 'গাঢ় টিল ব্যান্ড-হেডারে আধুনিক সূচিপত্র — ছায়া-পিল শিরোনাম ও প্রশস্ত ফাঁকা জায়গা',
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
    name: 'বিস্তারিত দুই-স্তর সূচিপত্র',
    desc: 'অধ্যায় ও উপ-অধ্যায় দেখানোর গোল্ড-সেপিয়া বিস্তারিত সূচিপত্র — গাইড/সহায়িকার জন্য',
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
    name: 'ছবি-সহ পরিচিতি',
    desc: 'সোনালি ফ্রেমে ছবির ঘর, নাম-পদবি ও ইনডেন্ট-ধাঁচের জীবনীসহ পূর্ণাঙ্গ লেখক পাতা',
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
    name: 'সংক্ষিপ্ত পরিচিতি',
    desc: 'ছবি ছাড়া নীরব মার্জিত পরিচিতি — কেন্দ্রীয় নাম, পদবি ও অথৈ দুই-তিন লাইনের জীবনী',
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
    name: 'অধ্যায় সূচনা + শেখার তালিকা',
    desc: 'বড় বাংলা সংখ্যা, অলংকরণ রেখা ও “এ অধ্যায়ে শিখবে” বক্স — গাইড বইয়ের জন্য',
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
    name: 'নিরীক্ষা অধ্যায় সূচনা',
    desc: 'বিশাল হালকা সংখ্যা ও নীরব শিরোনাম — উপন্যাস/সাহিত্যের অধ্যায় পাতা',
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
    name: 'এই বইয়ের ভেতরে',
    desc: 'ফরেস্ট-গ্রিন ব্যবহারবিধি পাতা — বইয়ের বৈশিষ্ট্য, আইকন ব্যাখ্যা ও পাঠ পরিকল্পনা',
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
    name: 'পরিশিষ্ট',
    desc: 'ছায়া-বক্সে সাজানো সংযুক্তি সেকশন — টেবিল, চার্ট বা ফর্মুলা রাখার পরিশিষ্ট পাতা',
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
    name: 'শেষ পাতা (বই সম্পর্কে)',
    desc: 'অলংকৃত বিদায়ী পাতা — আরও বইয়ের তালিকা ও প্রকাশনীর যোগাযোগ তথ্য',
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
