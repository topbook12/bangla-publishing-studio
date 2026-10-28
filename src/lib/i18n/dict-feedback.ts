/**
 * ফিডব্যাক ইঞ্জিন অভিধান — সাইকেল-১ (ইউজার-ফিডব্যাক-চালিত উন্নয়ন চক্র)
 * উইজেট + ড্যাশবোর্ড সেকশন — bn/hi/en ত্রিভাষিক।
 */

import type { Dict } from './core';

export const dictFeedback: Dict = {
  // ─── উইজেট ───
  'fb.action': { bn: 'মতামত', hi: 'प्रतिक्रिया', en: 'Feedback' },
  'fb.title': { bn: 'আপনার মতামত দিন', hi: 'अपनी प्रतिक्रिया दें', en: 'Share your feedback' },
  'fb.desc': {
    bn: 'কী ভালো লাগল, কী বাধা দিল — সরাসরি ডেভেলপারের কাছে পৌঁছায়। অ্যানোনিমাস পাঠানো যায়।',
    hi: 'क्या अच्छा लगा, क्या बाधा दी — सीधे डेवलपर तक पहुँचता है। गुमनाम भेजा जा सकता है।',
    en: 'What worked, what blocked — goes straight to the developer. Anonymous sending allowed.',
  },
  'fb.rating': { bn: 'সামগ্রিক অভিজ্ঞতা', hi: 'समग्र अनुभव', en: 'Overall experience' },
  'fb.star.1': { bn: 'খুব খারাপ', hi: 'बहुत खराब', en: 'Very poor' },
  'fb.star.2': { bn: 'খারাপ', hi: 'खराब', en: 'Poor' },
  'fb.star.3': { bn: 'ঠিক আছে', hi: 'ठीक है', en: 'Okay' },
  'fb.star.4': { bn: 'ভালো', hi: 'अच्छा', en: 'Good' },
  'fb.star.5': { bn: 'দুর্দান্ত', hi: 'शानदार', en: 'Excellent' },
  'fb.category': { bn: 'বিভাগ', hi: 'श्रेणी', en: 'Category' },
  'fb.cat.bug': { bn: 'বাগ', hi: 'बग', en: 'Bug' },
  'fb.cat.idea': { bn: 'আইডিয়া', hi: 'आइडिया', en: 'Idea' },
  'fb.cat.praise': { bn: 'প্রশংসা', hi: 'प्रशंसा', en: 'Praise' },
  'fb.cat.question': { bn: 'প্রশ্ন', hi: 'प्रश्न', en: 'Question' },
  'fb.cat.other': { bn: 'অন্যান্য', hi: 'अन्य', en: 'Other' },
  'fb.message': { bn: 'মতামত লিখুন', hi: 'प्रतिक्रिया लिखें', en: 'Write your feedback' },
  'fb.message.ph': {
    bn: 'যেমন: ফন্ট তালিকায় খোঁজা চাই / প্রিন্টে মার্জিন স্থির থাকুক…',
    hi: 'जैसे: फ़ॉन्ट सूची में खोज चाहिए / प्रिंट में मार्जिन स्थिर रहे…',
    en: 'e.g. Search in font list / Keep print margins fixed…',
  },
  'fb.send': { bn: 'পাঠান', hi: 'भेजें', en: 'Send' },
  'fb.sending': { bn: 'পাঠানো হচ্ছে…', hi: 'भेजा जा रहा है…', en: 'Sending…' },
  'fb.thanks': { bn: 'ধন্যবাদ! আপনার মতামত পৌঁছেছে।', hi: 'धन्यवाद! आपकी प्रतिक्रिया पहुँच गई।', en: 'Thanks! Your feedback has arrived.' },
  'fb.error': { bn: 'পাঠানো যায়নি — আবার চেষ্টা করুন।', hi: 'भेजा नहीं जा सका — फिर कोशिश करें।', en: 'Could not send — please try again.' },
  'fb.chars': { bn: 'অক্ষর', hi: 'अक्षर', en: 'chars' },

  // ─── ড্যাশবোর্ড সেকশন ───
  'fb.dash.title': { bn: 'মতামত — ব্যবহারকারীর কণ্ঠস্বর', hi: 'प्रतिक्रिया — उपयोगकर्ता की आवाज़', en: 'Feedback — user voice' },
  'fb.dash.desc': {
    bn: 'উইজেট থেকে আসা মতামত; স্টেটাস বদলে লুপ বন্ধ করুন (নতুন → বাছাই → সম্পন্ন)।',
    hi: 'विजेट से आई प्रतिक्रिया; स्टेटस बदलकर लूप बंद करें (नया → छँटाई → पूर्ण)।',
    en: 'Feedback from the widget; cycle the status to close the loop (new → triaged → done).',
  },
  'fb.dash.avg': { bn: 'গড় রেটিং', hi: 'औसत रेटिंग', en: 'Average rating' },
  'fb.dash.total': { bn: 'মোট মতামত', hi: 'कुल प्रतिक्रिया', en: 'Total feedback' },
  'fb.dash.byCategory': { bn: 'বিভাগ ভিত্তিক', hi: 'श्रेणी अनुसार', en: 'By category' },
  'fb.dash.byRating': { bn: 'রেটিং বণ্টন', hi: 'रेटिंग वितरण', en: 'Rating distribution' },
  'fb.dash.recent': { bn: 'সাম্প্রতিক মতামত', hi: 'हाल की प्रतिक्रिया', en: 'Recent feedback' },
  'fb.dash.empty': { bn: 'এখনো কোনো মতামত আসেনি — প্রথমটা আপনিই দিতে পারেন!', hi: 'अभी कोई प्रतिक्रिया नहीं — पहली आप दे सकते हैं!', en: 'No feedback yet — you could be the first!' },
  'fb.dash.status.new': { bn: 'নতুন', hi: 'नया', en: 'New' },
  'fb.dash.status.triaged': { bn: 'বাছাই', hi: 'छँटाई', en: 'Triaged' },
  'fb.dash.status.done': { bn: 'সম্পন্ন', hi: 'पूर्ण', en: 'Done' },
  'fb.dash.nextStatus': { bn: 'স্টেটাস বদলান', hi: 'स्टेटस बदलें', en: 'Advance status' },
};
