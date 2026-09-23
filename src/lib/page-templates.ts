/**
 * বইয়ের বিশেষ পাতার টেমপ্লেট — শিরোনাম পাতা, হাফ টাইটেল, কপিরাইট, উৎসর্গ,
 * সূচিপত্র, লেখকের পরিচিতি, ভূমিকা ও অধ্যায় সূচনা।
 *
 * প্রতিটি টেমপ্লেটের HTML শুধুমাত্র এডিটর স্কিমা-বৈধ নোড ব্যবহার করে
 * (paragraph/heading + inline style, fancyDivider, callout-box, doc-textbox,
 * toc-block) — তাই এডিটর, প্রিন্ট, ফরমা, HTML/DOCX এক্সপোর্ট সব জায়গায় একই
 * চেহারা ধরে রাখে।
 */

import { buildCalloutHtml, buildDesignBoxHtml, buildDividerHtml, buildTocHtml } from './nodes-html';

export interface PageTemplate {
  id: string;
  name: string;
  desc: string;
  /** কার্ড প্রিভিউয়ের অ্যাকসেন্ট রং */
  accent: string;
  /** কার্ড প্রিভিউয়ের ধরন */
  kind: 'title' | 'toc' | 'bio' | 'dedication' | 'copyright' | 'chapter' | 'preface' | 'half';
  html: string;
}

const PLACEHOLDER_NOTE =
  '<p style="text-align:center"><span style="font-size:10pt; color:#94a3b8">(জায়গামতো লিখুন — প্লেসহোল্ডার লেখাগুলো মুছে ফেলুন)</span></p>';

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    id: 'title-page',
    name: 'শিরোনাম পাতা',
    desc: 'বইয়ের নাম, উপশিরোনাম, লেখক ও প্রকাশনী — অলংকৃত ক্লাসিক শিরোনাম পাতা',
    accent: '#7f1d1d',
    kind: 'title',
    html: `
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:13pt; color:#b45309">❦ ─── ❖ ─── ❦</span></p>
<p style="text-align:center"></p>
<h1 style="text-align:center; color:#7f1d1d"><span style="font-size:28pt">বইয়ের নাম লিখুন</span></h1>
<p style="text-align:center"><span style="font-size:14pt; color:#475569">— উপশিরোনাম এখানে —</span></p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:13pt; color:#334155">লেখকের নাম</span></p>
<hr class="fancy-divider" data-style="flourish" />
<p style="text-align:center"><span style="font-size:11pt; color:#64748b">প্রকাশনীর নাম · প্রকাশকাল</span></p>
`.trim(),
  },
  {
    id: 'half-title',
    name: 'হাফ টাইটেল',
    desc: 'শুধু বইয়ের নাম — মার্জিত ও নীরব প্রথম পাতা',
    accent: '#475569',
    kind: 'half',
    html: `
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<h1 style="text-align:center"><span style="font-size:26pt">বইয়ের নাম</span></h1>
<p style="text-align:center"><span style="font-size:12pt; color:#94a3b8">❦</span></p>
<p style="text-align:center"></p>
`.trim(),
  },
  {
    id: 'copyright',
    name: 'কপিরাইট পাতা',
    desc: 'স্বত্ব সংরক্ষণ, সংস্করণ ও মুদ্রণ তথ্যের আদর্শ পাতা',
    accent: '#0f766e',
    kind: 'copyright',
    html: `
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:12pt; color:#334155">বইয়ের নাম</span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#475569">সমস্ত স্বত্ব সংরক্ষিত © লেখক/প্রকাশনী, সাল</span></p>
<p style="text-align:center"><span style="font-size:10pt; color:#475569">প্রথম সংস্করণ: সাল · দ্বিতীয় সংস্করণ: সাল</span></p>
<p style="text-align:center"></p>
${buildCalloutHtml('note', 'মুদ্রণ তথ্য', '<p>মুদ্রণ: মুদ্রণালয়ের নাম, ঠিকানা</p><p>বাঁধাই: বাঁধাই প্রতিষ্ঠানের নাম</p><p>মূল্য: টাকা</p>')}
${PLACEHOLDER_NOTE}
`.trim(),
  },
  {
    id: 'dedication',
    name: 'উৎসর্গ পাতা',
    desc: 'মাঝবরাবর ছোট করে লেখা উৎসর্গ — বইয়ের আবেগঘন প্রথম পৃষ্ঠা',
    accent: '#be185d',
    kind: 'dedication',
    html: `
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:15pt; color:#be185d"><em>উৎসর্গের লেখা এখানে লিখুন — যেমন: মা-বাবার ভালোবাসার জন্য</em></span></p>
<p style="text-align:center"><span style="font-size:12pt; color:#b45309">❦</span></p>
<p style="text-align:center"></p>
`.trim(),
  },
  {
    id: 'toc-page',
    name: 'সূচিপত্র পাতা',
    desc: 'ডিজাইন করা সূচিপত্র — ডিজাইন ট্যাব থেকে স্বয়ংক্রিয়ভাবে হালনাগাদ হয়',
    accent: '#4f46e5',
    kind: 'toc',
    html: `
<h1 style="text-align:center; color:#4f46e5">সূচিপত্র</h1>
<hr class="fancy-divider" data-style="double" />
${buildTocHtml('[]', '')}
${PLACEHOLDER_NOTE}
`.trim(),
  },
  {
    id: 'author-bio',
    name: 'লেখকের পরিচিতি',
    desc: 'ছবির ফ্রেম, নাম, পরিচয় ও সংক্ষিপ্ত জীবনীসহ লেখক পরিচিতি পাতা',
    accent: '#0d9488',
    kind: 'bio',
    html: `
<h2 style="text-align:center; color:#0d9488">লেখকের পরিচিতি</h2>
<hr class="fancy-divider" data-style="flourish" />
${buildDesignBoxHtml({ variant: 'shaded', border: '#94a3b8', fill: 'rgba(100,116,139,0.08)', bstyle: 'solid', bwidth: 1 }, '<p style="text-align:center"><span style="font-size:11pt; color:#64748b">📷 এখানে লেখকের ছবি বসান (Insert → Image) — বক্সের ভেতরে ক্লিক করে লিখও যাবে</span></p>')}
<h3 style="text-align:center">লেখকের নাম</h3>
<p style="text-align:center"><em><span style="font-size:11pt; color:#475569">পদবি / পরিচয় — যেমন: সহকারী অধ্যাপক, পদার্থবিজ্ঞান</span></em></p>
<p>লেখকের সংক্ষিপ্ত পরিচয় এখানে লিখুন — শিক্ষাগত যোগ্যতা, পেশা, অর্জন ও অন্যান্য প্রকাশিত বইয়ের তথ্য। প্রয়োজনে অনুচ্ছেদ যোগ করুন।</p>
<p>দ্বিতীয় অনুচ্ছেদ — লেখকের বিশেষ কৃতিত্ব বা পাঠকদের উদ্দেশ্যে বক্তব্য।</p>
`.trim(),
  },
  {
    id: 'preface',
    name: 'ভূমিকা / প্রস্তাবনা',
    desc: 'বইয়ের উদ্দেশ্য ও পাঠকের উদ্দেশ্যে লেখকের বক্তব্য',
    accent: '#b45309',
    kind: 'preface',
    html: `
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
    id: 'chapter-opener',
    name: 'অধ্যায় সূচনা পাতা',
    desc: 'বড় অধ্যায় নম্বর, শিরোনাম ও “এ অধ্যায়ে শিখবে” বক্স',
    accent: '#7f1d1d',
    kind: 'chapter',
    html: `
<p style="text-align:center"></p>
<p style="text-align:center"><span style="font-size:15pt; color:#b45309; letter-spacing:2px">অধ্যায় ১</span></p>
<h1 style="text-align:center; color:#7f1d1d"><span style="font-size:24pt">অধ্যায়ের শিরোনাম</span></h1>
<hr class="fancy-divider" data-style="stars" />
${buildCalloutHtml('concept', 'এ অধ্যায়ে শিখবে', '<ul><li>প্রথম শেখার বিষয়</li><li>দ্বিতীয় শেখার বিষয়</li><li>তৃতীয় শেখার বিষয়</li></ul>')}
<p>অধ্যায়ের মূল লেখা এখানে শুরু হবে…</p>
`.trim(),
  },
];

/** কার্ড প্রিভিউয়ের মিনি-লাইনগুলো (ডেকোরেটিভ) */
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
