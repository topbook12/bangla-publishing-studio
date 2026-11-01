/**
 * প্রেজেন্স অভিধান — দিন ৬৩ (প্রেজেন্স-অনলি সহযোগিতা, Yjs-ফলব্যাক)
 * হেডার অ্যাভাটার-স্ট্যাক + কে-কী-লিখছে ব্যাজ + আমি-পরিচয় পপওভার — bn/hi/en ত্রিভাষিক।
 */

import type { Dict } from './core';

export const dictPresence: Dict = {
  // ─── অ্যাভাটার-স্ট্যাক ও ব্যাজ ───
  'pr.title': {
    bn: 'এখানে কে আছে',
    hi: 'यहाँ कौन है',
    en: "Who's here",
  },
  'pr.you': { bn: 'আপনি', hi: 'आप', en: 'You' },
  'pr.only': {
    bn: 'এই ডকুমেন্টে এখন শুধু আপনি',
    hi: 'इस दस्तावेज़ में अभी सिर्फ़ आप',
    en: 'Just you in this document now',
  },
  'pr.count': {
    bn: '{n} জন সম্পাদনা করছে',
    hi: '{n} लोग संपादित कर रहे हैं',
    en: '{n} editing',
  },
  'pr.typing': {
    bn: '{name} লিখছেন…',
    hi: '{name} लिख रहे हैं…',
    en: '{name} is typing…',
  },
  'pr.more': { bn: '+{n} আরও', hi: '+{n} और', en: '+{n} more' },

  // ─── সংযোগ-অবস্থা ───
  'pr.st.online': { bn: 'লাইভ', hi: 'लाइव', en: 'Live' },
  'pr.st.connecting': { bn: 'সংযোগ হচ্ছে…', hi: 'कनेक्ट हो रहा है…', en: 'Connecting…' },
  'pr.st.offline': {
    bn: 'প্রেজেন্স বন্ধ — স্থানীয়ভাবেই সব কাজ চলছে',
    hi: 'प्रेज़ेंस बंद — सब काम स्थानीय रूप से चल रहा है',
    en: 'Presence off — everything still works locally',
  },
  'pr.full': {
    bn: 'এই ডকুমেন্টে আসন পূর্ণ (সর্বোচ্চ ৫০)',
    hi: 'इस दस्तावेज़ में सीटें भरी हैं (अधिकतम 50)',
    en: 'This document is full (max 50)',
  },

  // ─── আমি-পরিচয় পপওভার ───
  'pr.pop.title': {
    bn: 'আপনার পরিচয়',
    hi: 'आपकी पहचान',
    en: 'Your identity',
  },
  'pr.pop.desc': {
    bn: 'একই ডকুমেন্ট খোলা অন্যরা এই নাম ও রং দেখবে। কনটেন্ট কোথাও যায় না — শুধু উপস্থিতির সংকেত।',
    hi: 'वही दस्तावेज़ खोलने वाले अन्य लोग यह नाम और रंग देखेंगे। कोई सामग्री कहीं नहीं जाती — केवल उपस्थिति संकेत।',
    en: 'Others with this document open will see this name and color. No content ever leaves — presence signals only.',
  },
  'pr.pop.list': {
    bn: 'এই ডকুমেন্টে এখন',
    hi: 'इस दस्तावेज़ में अभी',
    en: 'In this document now',
  },
  'pr.pop.name': { bn: 'নাম', hi: 'नाम', en: 'Name' },
  'pr.pop.name.ph': { bn: 'আপনার নাম', hi: 'आपका नाम', en: 'Your name' },
  'pr.pop.color': { bn: 'রং', hi: 'रंग', en: 'Color' },
  'pr.pop.save': { bn: 'সংরক্ষণ', hi: 'सहेजें', en: 'Save' },
  'pr.pop.saved': { bn: 'পরিচয় সংরক্ষিত', hi: 'पहचान सहेजी गई', en: 'Identity saved' },
  'pr.anon': { bn: 'অতিথি', hi: 'अतिथि', en: 'Guest' },
};
