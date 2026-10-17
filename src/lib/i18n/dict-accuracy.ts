/**
 * অভিধান — নির্ভুলতা কেন্দ্র (accuracy-dialog.tsx + ai-verify.ts)
 * কী-প্রিফিক্স: acc.
 */

import type { Dict } from './core';

export const dictAccuracy: Dict = {
  // ─── ডায়ালগ হেডার ───
  'acc.title': { bn: 'নির্ভুলতা কেন্দ্র', hi: 'सटीकता केंद्र', en: 'Accuracy Center' },
  'acc.desc': {
    bn: 'লেখা, প্রশ্ন বা যেকোনো কনটেন্টের বানান, ব্যাকরণ, গণিত, তথ্য ও প্রশ্ন-কাঠামো যাচাই — প্রিন্টের আগে প্রতিটি ভুল ধরুন।',
    hi: 'लेख, प्रश्न या किसी भी कंटेंट की वर्तनी, व्याकरण, गणित, तथ्य और प्रश्न-संरचना की जाँच — प्रिंट से पहले हर त्रुटि पकड़ें।',
    en: 'Check spelling, grammar, math, facts and question structure of any text — catch every error before printing.',
  },

  // ─── স্কোপ ───
  'acc.scope': { bn: 'যাচাইয়ের পরিধি', hi: 'जाँच का दायरा', en: 'Check scope' },
  'acc.scope.selection': { bn: 'নির্বাচিত অংশ', hi: 'चयनित अंश', en: 'Selection' },
  'acc.scope.page': { bn: 'এই পাতা', hi: 'यह पृष्ठ', en: 'This page' },
  'acc.scope.document': { bn: 'পুরো ডকুমেন্ট', hi: 'पूरा दस्तावेज़', en: 'Whole document' },
  'acc.scope.selection.empty': {
    bn: 'কিছু নির্বাচন করা নেই — লেখা সিলেক্ট করে আবার চেষ্টা করুন।',
    hi: 'कुछ चयनित नहीं है — टेक्स्ट चुनकर फिर कोशिश करें।',
    en: 'Nothing selected — select some text and try again.',
  },
  'acc.scope.page.empty': {
    bn: 'এই পাতায় যাচাইয়ের মতো লেখা নেই।',
    hi: 'इस पृष्ठ पर जाँच के लिए कुछ नहीं है।',
    en: 'No text to check on this page.',
  },
  'acc.scope.document.empty': {
    bn: 'ডকুমেন্ট খালি।',
    hi: 'दस्तावेज़ खाली है।',
    en: 'The document is empty.',
  },

  // ─── চালানো ───
  'acc.deep': { bn: 'গভীর যাচাই', hi: 'गहन जाँच', en: 'Deep check' },
  'acc.deepTip': {
    bn: 'গণিত-পুনঃগণনা ও জটিল তথ্যের জন্য মডেলের “চিন্তা” চালু — ধীর কিন্তু বেশি নির্ভুল',
    hi: 'गणित-पुनर्गणना और जटिल तथ्यों के लिए मॉडल की "सोच" चालू — धीमा पर अधिक सटीक',
    en: 'Turns on model "thinking" for math re-computation and subtle facts — slower but more accurate',
  },
  'acc.run': { bn: 'যাচাই চালান', hi: 'जाँच चलाएँ', en: 'Run check' },
  'acc.rerun': { bn: 'আবার যাচাই', hi: 'फिर जाँचें', en: 'Re-check' },
  'acc.running.local': { bn: 'লোকাল যাচাই চলছে…', hi: 'स्थानीय जाँच चल रही है…', en: 'Running local checks…' },
  'acc.running.ai': { bn: 'AI গভীর যাচাই চলছে… অংশ {done}/{total}', hi: 'AI गहन जाँच चल रही है… भाग {done}/{total}', en: 'AI deep check running… part {done}/{total}' },
  'acc.cancel': { bn: 'বাতিল', hi: 'रद्द करें', en: 'Cancel' },
  'acc.partialCoverage': {
    bn: 'লেখা অনেক বড় — প্রথম {n} অংশ AI-যাচাই হলো ({p}% কভারেজ)। লোকাল যাচাই পুরোটায় চলেছে।',
    hi: 'टेक्स्ट बहुत लंबा है — पहले {n} भाग AI-जाँच हुए ({p}% कवरेज)। स्थानीय जाँच पूरा हुआ।',
    en: 'Text is very long — first {n} parts AI-checked ({p}% coverage). Local checks ran on everything.',
  },

  // ─── ফলাফল ───
  'acc.clean': { bn: 'দুর্দান্ত! কোনো সমস্যা পাওয়া যায়নি।', hi: 'बहुत बढ़िया! कोई समस्या नहीं मिली।', en: 'Great! No issues found.' },
  'acc.cleanLocal': {
    bn: 'লোকাল যাচাইয়ে কিছু পাওয়া যায়নি — AI গভীর যাচাই চালালে আরও নিশ্চিত হবেন।',
    hi: 'स्थानीय जाँच में कुछ नहीं मिला — AI गहन जाँच से और निश्चित होंगे।',
    en: 'Local checks found nothing — run the AI deep check to be extra sure.',
  },
  'acc.score': { bn: 'নির্ভুলতা স্কোর', hi: 'सटीकता स्कोर', en: 'Accuracy score' },
  'acc.issues': { bn: 'সমস্যা', hi: 'समस्याएँ', en: 'issues' },
  'acc.found': { bn: '{n}টি সমস্যা পাওয়া গেছে', hi: '{n} समस्याएँ मिलीं', en: '{n} issues found' },
  'acc.filterAll': { bn: 'সব', hi: 'सब', en: 'All' },
  'acc.pageLabel': { bn: 'পৃষ্ঠা {n}', hi: 'पृष्ठ {n}', en: 'Page {n}' },
  'acc.summary': { bn: 'সারসংক্ষেপ', hi: 'सारांश', en: 'Summary' },
  'acc.aiFailed': {
    bn: '{n}টি অংশ যাচাই ব্যর্থ (নেটওয়ার্ক/কোটা) — বাকিগুলোর ফলাফল নিচে।',
    hi: '{n} भाग की जाँच विफल (नेटवर्क/कोटा) — बाकी के परिणाम नीचे।',
    en: '{n} parts failed to check (network/quota) — results for the rest below.',
  },
  'acc.aiError': {
    bn: 'AI যাচাই ব্যর্থ — সেটিংসে API কি যাচাই করুন বা পরে চেষ্টা করুন। লোকাল যাচাইয়ের ফলাফল নিচে।',
    hi: 'AI जाँच विफल — सेटिंग्स में API कुंजी जाँचें या बाद में कोशिश करें। स्थानीय जाँच के परिणाम नीचे।',
    en: 'AI check failed — verify your API key in settings or try later. Local check results below.',
  },
  'acc.runError': {
    bn: 'যাচাই চলাকালীন অপ্রত্যাশিত সমস্যা হয়েছে — আবার চেষ্টা করুন।',
    hi: 'जाँच के दौरान अप्रत्याशित समस्या हुई — कृपया फिर कोशिश करें।',
    en: 'Something went wrong during the check — please try again.',
  },

  // ─── ক্যাটাগরি ───
  'acc.cat.math': { bn: 'গণিত', hi: 'गणित', en: 'Math' },
  'acc.cat.fact': { bn: 'তথ্য', hi: 'तथ्य', en: 'Fact' },
  'acc.cat.spelling': { bn: 'বানান', hi: 'वर्तनी', en: 'Spelling' },
  'acc.cat.grammar': { bn: 'ব্যাকরণ', hi: 'व्याकरण', en: 'Grammar' },
  'acc.cat.punctuation': { bn: 'যতিচিহ্ন', hi: 'विराम चिह्न', en: 'Punctuation' },
  'acc.cat.question': { bn: 'প্রশ্ন-কাঠামো', hi: 'प्रश्न-संरचना', en: 'Question structure' },
  'acc.cat.consistency': { bn: 'সামঞ্জস্য', hi: 'संगति', en: 'Consistency' },
  'acc.cat.local': { bn: 'লোকাল', hi: 'स्थानीय', en: 'Local' },
  'acc.cat.ai': { bn: 'AI', hi: 'AI', en: 'AI' },

  // ─── তীব্রতা ───
  'acc.sev.error': { bn: 'ভুল', hi: 'त्रुटि', en: 'Error' },
  'acc.sev.warning': { bn: 'সন্দেহজনক', hi: 'संदिग्ध', en: 'Likely wrong' },
  'acc.sev.note': { bn: 'পরিমার্জন', hi: 'सुधार', en: 'Polish' },

  // ─── issue কার্ড ───
  'acc.apply': { bn: 'প্রয়োগ', hi: 'लागू करें', en: 'Fix' },
  'acc.applied': { bn: 'প্রয়োগ হয়েছে', hi: 'लागू हुआ', en: 'Fixed' },
  'acc.dismiss': { bn: 'উপেক্ষা', hi: 'छोड़ें', en: 'Ignore' },
  'acc.dismissed': { bn: 'উপেক্ষিত', hi: 'छोड़ा', en: 'Ignored' },
  'acc.locate': { bn: 'অবস্থান', hi: 'स्थान', en: 'Locate' },
  'acc.locateTip': { bn: 'লেখার ওই জায়গায় নিয়ে যান', hi: 'वहाँ टेक्स्ट पर ले जाएँ', en: 'Jump to that spot in the text' },
  'acc.confidence': { bn: 'নিশ্চয়তা {n}%', hi: 'विश्वास {n}%', en: 'Confidence {n}%' },
  'acc.confidenceShort': { bn: '{n}%', hi: '{n}%', en: '{n}%' },
  'acc.lowConfidence': { bn: 'নিশ্চিত নন? যাচাই করে নিন।', hi: 'पक्का नहीं? जाँच लें।', en: 'Not sure? Please double-check.' },
  'acc.advisory': { bn: 'পরামর্শ — স্বয়ংক্রিয় সংশোধন সম্ভব নয়, নিজে দেখে ঠিক করুন।', hi: 'सुझाव — स्वतः सुधार संभव नहीं, स्वयं देखकर ठीक करें।', en: 'Advisory — cannot auto-fix; please review manually.' },
  'acc.cannotApply': { bn: 'লেখাটি এখন আর পাওয়া যাচ্ছে না (সম্ভবত এমতাবস্থায় বদলেছে)।', hi: 'यह टेक्स्ट अब मिल नहीं रहा (शायद बदल गया)।', en: 'This text can no longer be found (perhaps it changed).' },

  // ─── বানান (অফলাইন অভিধান) ───
  'acc.spell.addDict': { bn: 'অভিধানে যোগ করুন', hi: 'शब्दकोश में जोड़ें', en: 'Add to dictionary' },
  'acc.spell.addDictTip': {
    bn: 'শব্দটি আপনার অভিধানে জুড়ে দিন — পরের যাচাইয়ে আর দেখাবে না।',
    hi: 'शब्द को अपने शब्दकोश में जोड़ें — अगली जाँच में नहीं दिखेगा।',
    en: 'Add the word to your dictionary — it will not be flagged again.',
  },
  'acc.spell.addedToast': {
    bn: '“{w}” আপনার অভিধানে যোগ হয়েছে।',
    hi: '"{w}" आपके शब्दकोश में जोड़ा गया।',
    en: '"{w}" added to your dictionary.',
  },

  // ─── ফিল্টার ───
  'acc.filterBy': { bn: 'ক্যাটাগরি', hi: 'श्रेणी', en: 'Category' },
  'acc.filterEmpty': {
    bn: 'এই ফিল্টারে কোনো সমস্যা নেই।',
    hi: 'इस फ़िल्टर में कोई समस्या नहीं है।',
    en: 'No issues match this filter.',
  },

  // ─── ব্যাচ অ্যাকশন ───
  'acc.applySafe': { bn: 'নিরাপদ সব প্রয়োগ', hi: 'सभी सुरक्षित लागू करें', en: 'Apply all safe fixes' },
  'acc.applySafeTip': {
    bn: 'সব ভুল-স্তরের সংশোধন এবং ৯০%+ নিশ্চয়তার সংশোধন একসাথে প্রয়োগ করে',
    hi: 'हर "त्रुटि"-स्तर का सुधार और ९०%+ विश्वास वाले सुधार एक साथ लागू करता है',
    en: 'Applies every "error"-level fix and every fix with 90%+ confidence at once',
  },
  'acc.applyAll': { bn: 'সব প্রয়োগ', hi: 'सभी लागू करें', en: 'Apply all' },
  'acc.dismissAll': { bn: 'সব উপেক্ষা', hi: 'सभी छोड़ें', en: 'Ignore all' },
  'acc.appliedToast': { bn: '{n}টি সংশোধন প্রয়োগ হয়েছে', hi: '{n} सुधार लागू हुए', en: '{n} fixes applied' },
  'acc.appliedFailToast': { bn: '{n}টি প্রয়োগ হয়েছে, {m}টি হয়নি (লেখা বদলে গেছে)', hi: '{n} लागू हुए, {m} नहीं (टेक्स्ट बदल गया)', en: '{n} applied, {m} failed (text changed)' },
  'acc.fixFailToast': { bn: 'সংশোধন প্রয়োগ করা গেল না — লেখাটি বদলে গেছে।', hi: 'सुधार लागू नहीं हो सका — टेक्स्ट बदल गया।', en: 'Could not apply the fix — the text has changed.' },

  // ─── স্কোপ স্ট্যাটস ───
  'acc.chars': { bn: '{n} অক্ষর যাচাইয়ের পরিধিতে', hi: '{n} अक्षर जाँच के दायरे में', en: '{n} characters in scope' },

  // ─── লোকাল যাচাইয়ের ব্যাখ্যা (ai-verify.ts localWhy) ───
  'acc.why.arithmetic': {
    bn: 'গণনা করলে {a} হয় — লেখা আছে {b}।',
    hi: 'गणना करने पर {a} होना चाहिए — लिखा है {b}।',
    en: 'It computes to {a} — but the text says {b}.',
  },
  'acc.why.percent': {
    bn: '{a}% × {b} = {c} হওয়ার কথা।',
    hi: '{a}% × {b} = {c} होना चाहिए।',
    en: '{a}% of {b} should be {c}.',
  },
  'acc.why.doubleSpace': {
    bn: 'শব্দদুটির মাঝে ডাবল স্পেস — একটি স্পেসই যথেষ্ট।',
    hi: 'दो शब्दों के बीच डबल स्पेस — एक स्पेस पर्याप्त है।',
    en: 'Double space between words — a single space is enough.',
  },
  'acc.why.spaceBeforeDanda': {
    bn: 'দাঁড়ির আগে স্পেস হয় না — দাঁড়ি শব্দের সাথে লেগে থাকে।',
    hi: 'दंड से पहले स्पेस नहीं होता — दंड शब्द से जुड़ा रहता है।',
    en: 'No space before a danda — it stays attached to the word.',
  },
  'acc.why.spaceAfterDanda': {
    bn: 'দাঁড়ির পরে স্পেস দরকার।',
    hi: 'दंड के बाद स्पेस चाहिए।',
    en: 'A space is needed after the danda.',
  },
  'acc.why.doubleDanda': {
    bn: 'পরপর দুটি দাঁড়ি — একটিই যথেষ্ট।',
    hi: 'लगातार दो दंड — एक ही पर्याप्त है।',
    en: 'Two dandas in a row — one is enough.',
  },
  'acc.why.spaceBeforeComma': {
    bn: 'কমার আগে স্পেস হয় না।',
    hi: 'कॉमा से पहले स्पेस नहीं होता।',
    en: 'No space before a comma.',
  },
  'acc.why.repeatedWord': {
    bn: '“{w}” পরপর দুবার এসেছে — ইচ্ছাকৃত পুনরাবৃত্তি কি না দেখুন।',
    hi: '"{w}" लगातार दो बार आया — जानबूझकर दोहराव है या नहीं देखें।',
    en: '"{w}" appears twice in a row — check if the repetition is intentional.',
  },
  'acc.why.brackets': {
    bn: '{o}{c} বন্ধনী সমান নয় ({a}টি {o} বনাম {b}টি {c}) — কোথাও বন্ধনী খোলা রয়ে গেছে।',
    hi: '{o}{c} कोष्ठक संतुलित नहीं ({a} {o} बनाम {b} {c}) — कहीं कोष्ठक खुला छूट गया है।',
    en: 'Unbalanced {o}{c} brackets ({a} {o} vs {b} {c}) — a bracket was left open.',
  },
  'acc.why.dollar': {
    bn: '$…$ গণিত-চিহ্ন জোড়া মেলেনি — একটি $ খোলা আছে, গণিতটি ঠিকমতো দেখাবে না।',
    hi: '$…$ गणित-चिह्न का जोड़ा नहीं मिला — एक $ खुला है, गणित ठीक से नहीं दिखेगा।',
    en: 'Unmatched $…$ math delimiters — one $ is left open; the math will not render correctly.',
  },
  'acc.why.mixedDigits': {
    bn: 'একই লাইনে দুই ধরনের অঙ্ক (দেশি ও ইংরেজি) আছে — এক পদ্ধতিতে আনুন।',
    hi: 'एक ही पंक्ति में दो तरह के अंक (देशी और अंग्रेज़ी) हैं — एक पद्धति अपनाएँ।',
    en: 'Two digit styles (native and English) on one line — unify the digit style.',
  },
  'acc.why.duplicateOption': {
    bn: 'MCQ-র “{a}” ও “{b}” অপশন হুবহু এক — দুটি আলাদা অপশন দরকার।',
    hi: 'MCQ के "{a}" और "{b}" विकल्प बिल्कुल एक हैं — दो अलग विकल्प चाहिए।',
    en: 'MCQ options "{a}" and "{b}" are identical — two distinct options are needed.',
  },
  'acc.why.optionOrder': {
    bn: 'অপশন-ক্রম “{a}” — স্বাভাবিক ক্রম হওয়া উচিত “{b}”।',
    hi: 'विकल्प-क्रम "{a}" — सामान्य क्रम "{b}" होना चाहिए।',
    en: 'Option order is "{a}" — the natural order would be "{b}".',
  },
  'acc.why.answerKey': {
    bn: 'উত্তর “{a}” দেওয়া হয়েছে, কিন্তু এই MCQ-তে অপশনগুলো: {b}।',
    hi: 'उत्तर "{a}" दिया गया है, लेकिन इस MCQ के विकल्प: {b}।',
    en: 'Answer "{a}" is given, but this MCQ has options: {b}.',
  },
  'acc.why.numberingDup': {
    bn: 'প্রশ্ন-নম্বর {a} একাধিকবার এসেছে।',
    hi: 'प्रश्न-संख्या {a} एकाधिक बार आई है।',
    en: 'Question number {a} appears more than once.',
  },
  'acc.why.numberingSkip': {
    bn: 'প্রশ্ন-নম্বরে লাফ: {a}-এর পরে {b} — নম্বর-ক্রম যাচাই করুন।',
    hi: 'प्रश्न-संख्या में छलांग: {a} के बाद {b} — क्रम जाँचें।',
    en: 'Question numbering jumps: {b} after {a} — please verify the sequence.',
  },
  'acc.why.spelling': {
    bn: 'শব্দটি অভিধানে নেই — বানান ঠিক আছে কি না দেখুন।',
    hi: 'यह शब्द शब्दकोश में नहीं है — कृपया वर्तनी जाँचें।',
    en: 'Word not in the dictionary — please check the spelling.',
  },
  'acc.why.spellingTimes': {
    bn: '“{w}” শব্দটি {n} বার এসেছে কিন্তু অভিধানে নেই — বানান দেখুন।',
    hi: '"{w}" शब्द {n} बार आया है पर शब्दकोश में नहीं है — वर्तनी जाँचें।',
    en: '"{w}" appears {n} times but is not in the dictionary — check the spelling.',
  },
  'acc.demoNote': {
    bn: 'ডেমো মোড: নিজের API কি দিলে দ্রুত ও সীমাহীন যাচাই পাবেন।',
    hi: 'डेमो मोड: अपनी API कुंजी देने पर तेज़ और असीमित जाँच मिलेगी।',
    en: 'Demo mode: add your own API key for faster, unlimited checks.',
  },
};
