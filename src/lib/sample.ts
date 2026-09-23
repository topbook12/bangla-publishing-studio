/**
 * নমুনা ডকুমেন্ট — নতুন প্রজেক্ট তৈরির সময় প্রথম পৃষ্ঠায় স্বাগতম-নির্দেশনা
 */

import { buildCalloutHtml, buildDividerHtml, buildMcqHtml, escapeAttr } from './nodes-html';
import type { DocumentSettings, PageData } from './types';

export function createDefaultSettings(overrides?: Partial<DocumentSettings>): DocumentSettings {
  return {
    paperSize: 'a4',
    customPaper: { widthMm: 210, heightMm: 297 },
    orientation: 'portrait',
    margins: { top: 1, bottom: 1, left: 1, right: 1, gutter: 0 },
    paperColor: 'white',
    header: {
      enabled: true,
      style: 'parallel',
      leftText: 'অধ্যায় ১ — ভূমিকা',
      centerText: '',
      rightText: 'আমার প্রথম বই',
      accentColor: '#4f46e5',
      fontSize: 10,
    },
    footer: {
      enabled: true,
      style: 'plain',
      leftText: '',
      centerText: '',
      rightText: '',
      accentColor: '#4f46e5',
      fontSize: 10,
    },
    pageNumber: {
      enabled: true,
      format: 'bangla',
      position: 'bottom-center',
      startAt: 1,
      differentFirst: false,
      oddEven: false,
      prefix: 'পৃষ্ঠা ',
    },
    defaultFont: 'Hind Siliguri',
    defaultFontSize: 13,
    lineHeight: 1.6,
    paragraphSpacing: 8,
    autoFlow: true,
    pageBorder: 'none',
    pageBorderColor: '#4f46e5',
    ...overrides,
  };
}

const mcqHtml = buildMcqHtml({
  question: 'বাংলা ভাষায় স্বরবর্ণ কয়টি?',
  options: ['৭টি', '১০টি', '১১টি', '১৩টি'],
  answer: 1,
  explanation: 'বাংলা বর্ণমালায় ১১টি স্বরবর্ণ ও ৩৯টি ব্যঞ্জনবর্ণ আছে।',
});

const samplePage1: string = `
<h1>বাংলা পাবলিশিং স্টুডিওতে স্বাগতম</h1>
<p>এটি একটি <strong>সম্পূর্ণ WYSIWYG</strong> বাংলা ওয়ার্ড প্রসেসর — এখানে আপনি ঠিক <em>যেমন ছাপায় দেখবেন</em> তেমনই লিখবেন। প্রতিটি পাতা বাস্তব কাগজের মতো: <strong>হেডার, কনটেন্ট ও ফুটার</strong> আলাদা করে দেখা যায়।</p>
${buildCalloutHtml('concept', 'মূল ধারণা', '<p><strong>Ctrl + Enter</strong> চাপুন — কার্সরের পরের অংশ সরাসরি নতুন পৃষ্ঠায় চলে যাবে। পৃষ্ঠা ভরে গেলে বাক্যটি নিজে থেকেই পরের পাতায় চলে যায় (অটো-ফ্লো)।</p>')}
<h2>কীভাবে শুরু করবেন</h2>
<ul><li>উপরের <strong>হোম</strong> ট্যাবে ফন্ট, সাইজ, রং ও অ্যালাইনমেন্ট পাবেন</li><li><strong>ইনসার্ট</strong> ট্যাবে টেবিল, ছবি, কনসেপ্ট বক্স, MCQ ও ফুটনোট</li><li><strong>লেআউট</strong> ট্যাবে কাগজের সাইজ (A4, ক্রাউন অক্টাভো…) ও মার্জিন</li><li><strong>ডিজাইন</strong> ট্যাবে বুক থিম, কভার পেজ ও সূচিপত্র</li><li><strong>রিভিউ</strong> ট্যাবে বানান যাচাই, যুক্তবর্ণ প্যালেট ও শব্দ গণনা</li><li><strong>এক্সপোর্ট</strong> ট্যাব থেকে প্রেস-রেডি PDF বা Word ফাইল</li></ul>
<h2>নমুনা একাডেমিক কনটেন্ট</h2>
<p>নিচে কোচিং নোটের মতো সাজানো ব্লকগুলো দেখুন — <span style="background-color: #fef08a">হাইলাইটার</span>, রঙিন লেখা সবই কাজ করে।</p>
${buildCalloutHtml('formula', 'সূত্র', '<p>বৃত্তের ক্ষেত্রফল = πr², এখানে r হলো বৃত্তের ব্যাসার্ধ। আর পরিধি = ২πr।</p>')}
${mcqHtml}
<p>একটি টেবিলও দেখে নিন:</p>
<table><tbody><tr><th colspan="1" rowspan="1"><p>শ্রেণি</p></th><th colspan="1" rowspan="1"><p>বিষয়</p></th><th colspan="1" rowspan="1"><p>মানসিক দক্ষতা</p></th></tr><tr><td colspan="1" rowspan="1"><p>নবম-দশম</p></td><td colspan="1" rowspan="1"><p>গণিত</p></td><td colspan="1" rowspan="1"><p>সূচকীয় আবৃত্তি</p></td></tr><tr><td colspan="1" rowspan="1"><p>একাদশ-দ্বাদশ</p></td><td colspan="1" rowspan="1"><p>পদার্থবিজ্ঞান</p></td><td colspan="1" rowspan="1"><p>সমীকরণ সমাধান</p></td></tr></tbody></table>
${buildDividerHtml('flourish')}
${buildCalloutHtml('warning', 'সতর্কতা', '<p>পরীক্ষায় অনেকে "১১টি স্বরবর্ণ" না লিখে <strong>১০টি</strong> লিখে ফেলেন — খেয়াল রাখুন!</p>')}
<p>মুছে ফেলে নিজের মতো লিখুন — সব অটোসেভ হয় <strong>IndexedDB</strong>-তে, ইন্টারনেট ছাড়াই।<sup class="footnote" data-note="Dexie.js ভিত্তিক অফলাইন ডেটাবেজ"></sup></p>
`;

export function createSamplePages(): PageData[] {
  return [
    {
      id: `pg-${Date.now().toString(36)}-1`,
      kind: 'normal',
      html: samplePage1.trim(),
      noChrome: false,
    },
  ];
}

/** ফাঁকা ডকুমেন্ট */
export function emptyPageHtml(): string {
  return '<p></p>';
}

export function createEmptyPage(): PageData {
  return {
    id: `pg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    kind: 'normal',
    html: emptyPageHtml(),
    noChrome: false,
  };
}

export function escapeAttrExport(value: string): string {
  return escapeAttr(value);
}
