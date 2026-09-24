/**
 * বইয়ের বিশেষ পাতার টেমপ্লেট — প্রো-লেভেল ডিজাইন সংগ্রহ।
 *
 * ক্যাটাগরি: শিরোনাম পাতা, প্রারম্ভিক পাতা (হাফ টাইটেল/কপিরাইট/উৎসর্গ/উদ্ধৃতি/ভূমিকা/কৃতজ্ঞতা),
 * সূচিপত্র, লেখক পরিচিতি, অধ্যায় সূচনা ও বিশেষ পাতা (ব্যবহারবিধি/পরিশিষ্ট/শেষ পাতা)।
 *
 * প্রতিটি টেমপ্লেটের HTML শুধুমাত্র এডিটর স্কিমা-বৈধ নোড ব্যবহার করে
 * (paragraph/heading + inline style, fancyDivider, callout-box, doc-textbox, toc-block) —
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
  '<p style="text-align:center"><span style="font-size:9pt; color:#94a3b8">প্লেসহোল্ডার লেখাগুলো মুছে নিজের তথ্য লিখুন</span></p>';

/** উল্লম্ব স্পেসার — পাতার মাঝবরাবর নামানোর জন্য */
const sp = (n: number) => Array.from({ length: n }, () => '<p style="text-align:center"></p>').join('\n');

export const PAGE_TEMPLATES: PageTemplate[] = [
  // ═══════════════════════ শিরোনাম পাতা ═══════════════════════
  {
    id: 'title-classic',
    name: 'ক্লাসিক অলংকৃত',
    desc: 'ঐতিহ্যবাহী প্রকাশনীর শিরোনাম পাতা — অলংকরণ, বড় শিরোনাম ও প্রকাশনী লাইন',
    accent: '#7f1d1d',
    category: 'title',
    kind: 'title',
    html: `
${sp(3)}
<p style="text-align:center"><span style="font-size:13pt; color:#b45309; letter-spacing:1px">❦ ───────── ❖ ───────── ❦</span></p>
<p style="text-align:center"></p>
<h1 style="text-align:center; color:#7f1d1d; line-height:1.3"><span style="font-size:30pt">বইয়ের নাম লিখুন</span></h1>
<p style="text-align:center"><span style="font-size:14pt; color:#475569">— উপশিরোনাম এখানে —</span></p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:13pt; color:#334155">লেখকের নাম</span></p>
<hr class="fancy-divider" data-style="flourish" />
<p style="text-align:center"><span style="font-size:11pt; color:#64748b">প্রকাশনীর নাম · প্রকাশকাল</span></p>
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'title-modern',
    name: 'মডার্ন মিনিমাল',
    desc: 'সমসাময়িক ডিজাইন — প্রতিষ্ঠান উপরে, বড় বোল্ড শিরোনাম, নিচে লেখক',
    accent: '#0f766e',
    category: 'title',
    kind: 'title',
    html: `
<p style="text-align:center"><span style="font-size:10pt; color:#0f766e; letter-spacing:3px">প্রতিষ্ঠানের নাম</span></p>
<hr class="fancy-divider" data-style="single" />
${sp(5)}
<h1 style="text-align:center; color:#134e4a; line-height:1.35"><span style="font-size:32pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:12pt; color:#0d9488; letter-spacing:2px">উপশিরোনাম এখানে</span></p>
${sp(5)}
<hr class="fancy-divider" data-style="single" />
<p style="text-align:center"><span style="font-size:13pt; color:#334155">লেখকের নাম</span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#94a3b8">সংস্করণ · প্রকাশকাল</span></p>
`.trim(),
  },
  {
    id: 'title-academic',
    name: 'একাডেমিক সহায়িকা',
    desc: 'কোচিং/শিক্ষা প্রতিষ্ঠানের বইয়ের জন্য — কোর্স, শ্রেণি ও সেশন তথ্যসহ',
    accent: '#4f46e5',
    category: 'title',
    kind: 'title',
    html: `
<p style="text-align:center"><span style="font-size:14pt; color:#312e81; font-weight:bold">প্রতিষ্ঠানের পূর্ণ নাম</span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#64748b">ঠিকানা · মোবাইল · ওয়েবসাইট</span></p>
${sp(2)}
<hr class="fancy-divider" data-style="double" />
${sp(1)}
<h1 style="text-align:center; color:#4f46e5"><span style="font-size:26pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:13pt; color:#475569">(বিষয় / শ্রেণি — যেমন: পদার্থবিজ্ঞান, একাদশ-দ্বাদশ)</span></p>
${sp(1)}
${buildCalloutHtml('note', 'সংক্ষিপ্ত পরিচিতি', '<p>এই বইয়ের বিশেষত্ব এক-দুই লাইনে লিখুন — যেমন: অধ্যায়ভিত্তিক নোট, MCQ, সৃজনশীল প্রশ্ন ও বোর্ড প্রশ্নব্যাংক।</p>')}
${sp(1)}
<p style="text-align:center"><span style="font-size:12pt; color:#334155"><strong>সম্পাদনা:</strong> লেখকের নাম</span></p>
<p style="text-align:center"><span style="font-size:11pt; color:#64748b">শিক্ষাবর্ষ ২০২৫–২৬</span></p>
`.trim(),
  },
  {
    id: 'title-royal-frame',
    name: 'রাজকীয় ফ্রেম',
    desc: 'ডাবল-বর্ডার অলংকৃত ফ্রেমে বাঁধা রাজকীয় শিরোনাম পাতা',
    accent: '#9f1239',
    category: 'title',
    kind: 'title',
    html: `
${sp(1)}
${buildDesignBoxHtml(
  { variant: 'double', border: '#9f1239', fill: 'transparent', bstyle: 'double', bwidth: 4 },
  `${sp(1)}
<p style="text-align:center"><span style="font-size:12pt; color:#9f1239; letter-spacing:2px">❖ ❖ ❖</span></p>
<h1 style="text-align:center; color:#7f1d1d; line-height:1.35"><span style="font-size:28pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:13pt; color:#475569">উপশিরোনাম</span></p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:12pt; color:#334155">লেখকের নাম</span></p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:10pt; color:#9f1239">─ ✦ ─</span></p>
<p style="text-align:center"><span style="font-size:11pt; color:#64748b">প্রকাশনীর নাম</span></p>
${sp(1)}`,
)}
${sp(1)}
`.trim(),
  },

  // ═══════════════════════ প্রারম্ভিক পাতা ═══════════════════════
  {
    id: 'half-title',
    name: 'হাফ টাইটেল',
    desc: 'শুধু বইয়ের নাম — মার্জিত ও নীরব প্রথম পাতা',
    accent: '#475569',
    category: 'front',
    kind: 'half',
    html: `
${sp(6)}
<h1 style="text-align:center"><span style="font-size:26pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:12pt; color:#94a3b8">❦</span></p>
${sp(2)}
`.trim(),
  },
  {
    id: 'copyright',
    name: 'কপিরাইট / কলোফোন',
    desc: 'স্বত্ব সংরক্ষণ, সংস্করণ, মুদ্রণ ও মূল্য তথ্যের আদর্শ পাতা',
    accent: '#0f766e',
    category: 'front',
    kind: 'copyright',
    html: `
${sp(2)}
<p style="text-align:center"><span style="font-size:12pt; color:#334155"><strong>বইয়ের নাম</strong></span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#475569">লেখকের নাম</span></p>
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'স্বত্ব ও প্রকাশনা তথ্য', '<p>সমস্ত স্বত্ব সংরক্ষিত © লেখক/প্রকাশনী, সাল</p><p>প্রথম সংস্করণ: সাল · দ্বিতীয় সংস্করণ: সাল</p><p>ISBN: ৯৭৮-……</p>')}
${buildCalloutHtml('note', 'মুদ্রণ তথ্য', '<p>মুদ্রণ: মুদ্রণালয়ের নাম, ঠিকানা</p><p>বাঁধাই: বাঁধাই প্রতিষ্ঠানের নাম</p><p>মূল্য: টাকা</p>')}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'dedication',
    name: 'উৎসর্গ পাতা',
    desc: 'মাঝবরাবর ছোট করে লেখা উৎসর্গ — বইয়ের আবেগঘন প্রথম পৃষ্ঠা',
    accent: '#be185d',
    category: 'front',
    kind: 'dedication',
    html: `
${sp(6)}
<p style="text-align:center"><span style="font-size:15pt; color:#be185d"><em>উৎসর্গের লেখা এখানে লিখুন — যেমন: মা-বাবার ভালোবাসার জন্য</em></span></p>
<p style="text-align:center"><span style="font-size:12pt; color:#b45309">❦</span></p>
${sp(2)}
`.trim(),
  },
  {
    id: 'epigraph',
    name: 'উদ্ধৃতি পাতা',
    desc: 'বইয়ের শুরুর অনুপ্রেরণামূলক উক্তি — কবিতা বা বাণীর জন্য একান্ত পাতা',
    accent: '#7c3aed',
    category: 'front',
    kind: 'dedication',
    html: `
${sp(5)}
${buildDesignBoxHtml(
  { variant: 'shaded', border: '#7c3aed', fill: 'rgba(124,58,237,0.05)', bstyle: 'solid', bwidth: 1 },
  `<p style="text-align:center"><span style="font-size:14pt; color:#4c1d95"><em>“উদ্ধৃতির লেখা এখানে — কবিতা, বাণী বা অনুপ্রেরণামূলক উক্তি।”</em></span></p>
<p style="text-align:center"><span style="font-size:11pt; color:#6d28d9">— বক্তার নাম</span></p>`,
)}
${sp(3)}
`.trim(),
  },
  {
    id: 'preface',
    name: 'ভূমিকা / প্রস্তাবনা',
    desc: 'বইয়ের উদ্দেশ্য ও পাঠকের উদ্দেশ্যে লেখকের বক্তব্য',
    accent: '#b45309',
    category: 'front',
    kind: 'preface',
    html: `
${sp(1)}
<h1 style="text-align:center; color:#b45309">ভূমিকা</h1>
<hr class="fancy-divider" data-style="double" />
<p>এই বইটি লেখার উদ্দেশ্য ও পাঠক কী কী পাবেন — সংক্ষেপে লিখুন।</p>
<p>দ্বিতীয় অনুচ্ছেদে বিষয়বস্তুর বিবরণ বা ব্যবহারবিধি লিখুন।</p>
<p style="text-align:center"></p>
<p style="text-align:right"><em><span style="font-size:11pt; color:#334155">লেখক</span></em></p>
<p style="text-align:right"><em><span style="font-size:11pt; color:#64748b">তারিখ ও স্থান</span></em></p>
`.trim(),
  },
  {
    id: 'acknowledgment',
    name: 'কৃতজ্ঞতা স্বীকার',
    desc: 'সহযোগী, পরামর্শদাতা ও প্রিয়জনদের স্মরণ করে লেখকের ধন্যবাদ পাতা',
    accent: '#166534',
    category: 'front',
    kind: 'preface',
    html: `
${sp(1)}
<h1 style="text-align:center; color:#166534">কৃতজ্ঞতা স্বীকার</h1>
<hr class="fancy-divider" data-style="flourish" />
<p>বইটি লেখার প্রেরণা ও সহায়তার জন্য প্রথমেই কৃতজ্ঞতা জানাই — নাম লিখুন।</p>
<p>পরামর্শ ও সমালোচনায় যাঁরা অবদান রেখেছেন, তাঁদের নাম ও পরিচয় লিখুন।</p>
<p>পরিবার ও বন্ধুবান্ধবদের ধন্যবাদ — ধৈর্য ও ভালোবাসার জন্য।</p>
<p style="text-align:center"></p>
<p style="text-align:right"><em><span style="font-size:11pt; color:#334155">লেখক</span></em></p>
`.trim(),
  },

  // ═══════════════════════ সূচিপত্র ═══════════════════════
  {
    id: 'toc-classic',
    name: 'ক্লাসিক সূচিপত্র',
    desc: 'ডাবল-লাইন শিরোনামসহ ঐতিহ্যবাহী সূচিপত্র — ডিজাইন ট্যাব থেকে স্বয়ংক্রিয় হালনাগাদ',
    accent: '#4f46e5',
    category: 'toc',
    kind: 'toc',
    html: `
${sp(1)}
<h1 style="text-align:center; color:#4f46e5">সূচিপত্র</h1>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', '')}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'toc-modern',
    name: 'মডার্ন রঙিন সূচিপত্র',
    desc: 'রঙিন ব্যাজ ও ছায়া-বক্সে আধুনিক সূচিপত্র ডিজাইন',
    accent: '#0d9488',
    category: 'toc',
    kind: 'toc',
    html: `
${buildDesignBoxHtml(
  { variant: 'pill', border: '#0d9488', fill: 'rgba(13,148,136,0.08)', bstyle: 'solid', bwidth: 2 },
  '<h1 style="text-align:center; color:#0f766e"><span style="font-size:20pt">সূচিপত্র</span></h1><p style="text-align:center"><span style="font-size:10pt; color:#0d9488; letter-spacing:2px">বিষয়সূচি ও পৃষ্ঠা নম্বর</span></p>',
)}
<p style="text-align:center"></p>
${buildTocHtml('[]', '')}
${TIP_NOTE}
`.trim(),
  },
  {
    id: 'toc-detailed',
    name: 'বিস্তারিত দুই-স্তর সূচিপত্র',
    desc: 'অধ্যায় ও উপ-অধ্যায় দেখানোর বিস্তারিত সূচিপত্র — গাইড/সহায়িকার জন্য',
    accent: '#b45309',
    category: 'toc',
    kind: 'toc',
    html: `
<h1 style="text-align:center; color:#b45309">বিস্তারিত সূচিপত্র</h1>
<p style="text-align:center"><span style="font-size:10pt; color:#94a3b8">অধ্যায় ও উপ-বিষয়সমূহ</span></p>
<hr class="fancy-divider" data-style="flourish" />
${buildTocHtml('[]', '')}
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'নোট', '<p>H1 = অধ্যায়, H2/H3 = উপ-বিষয় — হেডিং দিলেই সূচিতে ঢুকে যাবে। Design → Update Table of Contents চাপুন।</p>')}
`.trim(),
  },

  // ═══════════════════════ লেখক পরিচিতি ═══════════════════════
  {
    id: 'author-bio',
    name: 'ছবি-সহ পরিচিতি',
    desc: 'ফ্রেম-করা ছবির ঘর, নাম, পদবি ও সংক্ষিপ্ত জীবনীসহ সম্পূর্ণ লেখক পাতা',
    accent: '#0d9488',
    category: 'author',
    kind: 'bio',
    html: `
<h2 style="text-align:center; color:#0d9488">লেখকের পরিচিতি</h2>
<hr class="fancy-divider" data-style="flourish" />
${buildDesignBoxHtml(
  { variant: 'shaded', border: '#94a3b8', fill: 'rgba(100,116,139,0.08)', bstyle: 'solid', bwidth: 1 },
  '<p style="text-align:center"><span style="font-size:11pt; color:#64748b">📷 এখানে লেখকের ছবি বসান (Insert → Image) — বক্সের ভেতরে ক্লিক করে লিখও যাবে</span></p>',
)}
<h3 style="text-align:center">লেখকের নাম</h3>
<p style="text-align:center"><em><span style="font-size:11pt; color:#475569">পদবি / পরিচয় — যেমন: সহকারী অধ্যাপক, পদার্থবিজ্ঞান</span></em></p>
<p>লেখকের সংক্ষিপ্ত পরিচয় এখানে লিখুন — শিক্ষাগত যোগ্যতা, পেশা, অর্জন ও অন্যান্য প্রকাশিত বইয়ের তথ্য। প্রয়োজনে অনুচ্ছেদ যোগ করুন।</p>
<p>দ্বিতীয় অনুচ্ছেদ — লেখকের বিশেষ কৃতিত্ব বা পাঠকদের উদ্দেশ্যে বক্তব্য।</p>
`.trim(),
  },
  {
    id: 'author-bio-simple',
    name: 'সংক্ষিপ্ত পরিচিতি',
    desc: 'ছবি ছাড়া — নাম, পরিচয় ও দুই অনুচ্ছেদের অথৈ মার্জিত পরিচিতি পাতা',
    accent: '#334155',
    category: 'author',
    kind: 'bio',
    html: `
${sp(2)}
<h2 style="text-align:center; color:#334155">লেখক পরিচিতি</h2>
<hr class="fancy-divider" data-style="single" />
<p style="text-align:center"><span style="font-size:16pt; color:#1e293b"><strong>লেখকের নাম</strong></span></p>
<p style="text-align:center"><em><span style="font-size:11pt; color:#64748b">পদবি, প্রতিষ্ঠান</span></em></p>
<p style="text-align:center"></p>
<p style="text-align:center; padding:0 1.2em"><span style="font-size:11pt; color:#475569">লেখকের সংক্ষিপ্ত পরিচয় এখানে — শিক্ষা, পেশা, অর্জন ও প্রকাশিত বই। দুই-তিন লাইনেই পাঠকের সামনে লেখককে তুলে ধরুন।</span></p>
${sp(2)}
`.trim(),
  },

  // ═══════════════════════ অধ্যায় সূচনা ═══════════════════════
  {
    id: 'chapter-opener',
    name: 'অধ্যায় সূচনা + শেখার তালিকা',
    desc: 'বড় অধ্যায় নম্বর, শিরোনাম ও “এ অধ্যায়ে শিখবে” বক্স — গাইড বইয়ের জন্য',
    accent: '#7f1d1d',
    category: 'chapter',
    kind: 'chapter',
    html: `
${sp(2)}
<p style="text-align:center"><span style="font-size:15pt; color:#b45309; letter-spacing:2px">অধ্যায় ১</span></p>
<h1 style="text-align:center; color:#7f1d1d"><span style="font-size:24pt">অধ্যায়ের শিরোনাম</span></h1>
<hr class="fancy-divider" data-style="stars" />
${buildCalloutHtml('concept', 'এ অধ্যায়ে শিখবে', '<ul><li>প্রথম শেখার বিষয়</li><li>দ্বিতীয় শেখার বিষয়</li><li>তৃতীয় শেখার বিষয়</li></ul>')}
<p>অধ্যায়ের মূল লেখা এখানে শুরু হবে…</p>
`.trim(),
  },
  {
    id: 'chapter-minimal',
    name: 'নিরীক্ষা অধ্যায় সূচনা',
    desc: 'শুধু বড় নম্বর ও শিরোনাম — উপন্যাস/সাহিত্যের নীরব অধ্যায় পাতা',
    accent: '#1e293b',
    category: 'chapter',
    kind: 'chapter',
    html: `
${sp(6)}
<p style="text-align:center"><span style="font-size:40pt; color:#cbd5e1"><strong>১</strong></span></p>
<h1 style="text-align:center; color:#1e293b"><span style="font-size:22pt">অধ্যায়ের শিরোনাম</span></h1>
<hr class="fancy-divider" data-style="single" />
${sp(2)}
`.trim(),
  },

  // ═══════════════════════ বিশেষ পাতা ═══════════════════════
  {
    id: 'about-book',
    name: 'এই বইয়ের ভেতরে',
    desc: 'ব্যবহারবিধি পাতা — বইয়ের বৈশিষ্ট্য, আইকন ব্যাখ্যা ও পাঠ পরিকল্পনা',
    accent: '#0284c7',
    category: 'special',
    kind: 'preface',
    html: `
<h1 style="text-align:center; color:#0284c7">এই বইয়ের ভেতরে</h1>
<hr class="fancy-divider" data-style="double" />
${buildCalloutHtml('concept', 'বৈশিষ্ট্য', '<ul><li>অধ্যায়ভিত্তিক সহজ ব্যাখ্যা</li><li>পরীক্ষায় আসা গুরুত্বপূর্ণ প্রশ্ন</li><li>অনুশীলনী ও উত্তরপত্র</li></ul>')}
${buildCalloutHtml('warning', 'আইকন পরিচিতি', '<p>💡 টিপস · ⚠ সতর্কতা · 📝 নোট · ❓ চিন্তা করার বিষয়</p>')}
<p style="text-align:center"></p>
<p>পাঠ পরিকল্পনা: প্রতিদিন কতটুকু পড়বেন, কীভাবে অনুশীলনী করবেন — সংক্ষেপে লিখুন।</p>
`.trim(),
  },
  {
    id: 'appendix',
    name: 'পরিশিষ্ট',
    desc: 'অতিরিক্ত তথ্য, টেবিল বা ফর্মুলা সংযুক্তির পরিশিষ্ট পাতা',
    accent: '#475569',
    category: 'special',
    kind: 'chapter',
    html: `
<h1 style="text-align:center; color:#475569">পরিশিষ্ট</h1>
<hr class="fancy-divider" data-style="dotted" />
<p style="text-align:center"><span style="font-size:11pt; color:#64748b">পরিশিষ্ট ক — শিরোনাম</span></p>
<p>এখানে অতিরিক্ত তথ্য, টেবিল, চার্ট বা ফর্মুলা যোগ করুন…</p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:11pt; color:#64748b">পরিশিষ্ট খ — শিরোনাম</span></p>
<p>দ্বিতীয় সংযুক্তি…</p>
`.trim(),
  },
  {
    id: 'back-colophon',
    name: 'শেষ পাতা (বই সম্পর্কে)',
    desc: 'বইয়ের শেষে প্রকাশনী পরিচিতি, অন্যান্য বই ও যোগাযোগ তথ্য',
    accent: '#7f1d1d',
    category: 'special',
    kind: 'copyright',
    html: `
${sp(3)}
<p style="text-align:center"><span style="font-size:12pt; color:#b45309">❦ ─── ❖ ─── ❦</span></p>
<p style="text-align:center"><span style="font-size:11pt; color:#475569">আপনি সদ্য শেষ করলেন —</span></p>
<h2 style="text-align:center; color:#7f1d1d"><span style="font-size:20pt">বইয়ের নাম</span></h2>
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'এই বই থেকে আরও', '<ul><li>একই লেখকের অন্য বই</li><li>পরবর্তী সংস্করণ / সিরিজ</li></ul>')}
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:11pt; color:#334155"><strong>প্রকাশনীর নাম</strong></span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#64748b">ঠিকানা · ফোন · ওয়েবসাইট · ইমেইল</span></p>
${sp(1)}
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
