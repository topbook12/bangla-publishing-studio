/**
 * দিন ৬৪ — কমেন্ট/রিভিউ-থ্রেড অভিধান (margin-note ধাঁচ + @উল্লেখ) — bn/hi/en ত্রিভাষিক।
 */

import type { Dict } from './core';

export const dictComments: Dict = {
  // ─── রিভিউ-ট্যাব গ্রুপ/বাটন ───
  'cm.group': { bn: 'সহযোগিতা', hi: 'सहयोग', en: 'Collaboration' },
  'cm.new': { bn: 'নতুন মন্তব্য', hi: 'नई टिप्पणी', en: 'New comment' },
  'cm.newTip': {
    bn: 'নির্বাচিত লেখায় মন্তব্য-থ্রেড খুলুন (মার্জিনে বুদবুদ)',
    hi: 'चयनित टेक्स्ट पर टिप्पणी-थ्रेड खोलें (मार्जिन में बबल)',
    en: 'Start a comment thread on the selection (margin bubble)',
  },
  'cm.fallbackAuthor': { bn: 'অতিথি', hi: 'अतिथि', en: 'Guest' },

  // ─── কম্পোজার ───
  'cm.composer.title': { bn: 'নতুন মন্তব্য', hi: 'नई टिप्पणी', en: 'New comment' },
  'cm.composer.ph': {
    bn: 'মন্তব্য লিখুন… @দিয়ে কাউকে উল্লেখ করুন',
    hi: 'टिप्पणी लिखें… @से किसी का उल्लेख करें',
    en: 'Write a comment… @mention someone',
  },
  'cm.composer.submit': { bn: 'মন্তব্য', hi: 'टिप्पणी', en: 'Comment' },
  'cm.composer.cancel': { bn: 'বাতিল', hi: 'रद्द करें', en: 'Cancel' },
  'cm.composer.mentions': { bn: 'উল্লেখ-প্রার্থী', hi: 'उल्लेख-प्रार्थी', en: 'Mention suggestions' },
  'cm.noSelection': {
    bn: 'মন্তব্যের জন্য আগে কিছু লেখা নির্বাচন করুন',
    hi: 'टिप्पणी के लिए पहले कुछ टेक्स्ट चुनें',
    en: 'Select some text first to comment on',
  },
  'cm.noPage': {
    bn: 'মন্তব্যের জন্য একটি পাতায় কার্সর রাখুন',
    hi: 'टिप्पणी के लिए किसी पृष्ठ पर कर्सर रखें',
    en: 'Place the cursor on a page first',
  },

  // ─── থ্রেড-কার্ড ───
  'cm.thread.you': { bn: 'আপনি', hi: 'आप', en: 'You' },
  'cm.reply.ph': { bn: 'উত্তর দিন…', hi: 'उत्तर दें…', en: 'Reply…' },
  'cm.reply.btn': { bn: 'উত্তর', hi: 'उत्तर', en: 'Reply' },
  'cm.resolve': { bn: 'সমাধান হিসেবে চিহ্নিত', hi: 'हल चिह्नित करें', en: 'Mark resolved' },
  'cm.reopen': { bn: 'আবার খুলুন', hi: 'फिर खोलें', en: 'Reopen' },
  'cm.resolvedLabel': { bn: 'সমাধান', hi: 'हल', en: 'Resolved' },
  'cm.delete': { bn: 'থ্রেড মুছুন', hi: 'थ्रेड हटाएँ', en: 'Delete thread' },
  'cm.showReplies': { bn: '{n}টি উত্তর দেখান', hi: '{n} उत्तर दिखाएँ', en: 'Show {n} replies' },
  'cm.hideReplies': { bn: 'উত্তর লুকান', hi: 'उत्तर छिपाएँ', en: 'Hide replies' },
  'cm.jump': {
    bn: 'লেখায় যান',
    hi: 'टेक्स्ट पर जाएँ',
    en: 'Jump to text',
  },
  'cm.emptyHint': {
    bn: 'লেখা নির্বাচন করে "নতুন মন্তব্য" (Ctrl+Alt+M) — মার্জিনে বুদবুদ আসবে',
    hi: 'टेक्स्ट चुनकर "नई टिप्पणी" (Ctrl+Alt+M) — मार्जिन में बबल आएगा',
    en: 'Select text and press New comment (Ctrl+Alt+M) — a margin bubble appears',
  },

  // ─── হেল্প-গাইড শর্টকাট গ্রিড ───
  'cm.keys.comment': { bn: 'Ctrl+Alt+M', hi: 'Ctrl+Alt+M', en: 'Ctrl+Alt+M' },
  'cm.sc.comment': {
    bn: 'নতুন মন্তব্য (নির্বাচিত লেখায়)',
    hi: 'नई टिप्पणी (चयनित टेक्स्ट पर)',
    en: 'New comment (on selection)',
  },
};
