/**
 * Kruti Dev ↔ Unicode কনভার্টার — অভিধান (bn / hi / en)
 */

import type { Dict } from './core';

export const dictKruti: Dict = {
  // Review ট্যাব এন্ট্রি
  'rev.kruti': {
    bn: 'Kruti কনভার্টার',
    hi: 'Kruti कनवर्टर',
    en: 'Kruti Converter',
  },
  'rev.krutiTip': {
    bn: 'Kruti Dev/DevLys (legacy) টেক্সট ↔ ইউনিকোড হিন্দি রূপান্তর',
    hi: 'Kruti Dev/DevLys (लेगेसी) टेक्स्ट ↔ यूनिकोड हिन्दी रूपांतरण',
    en: 'Convert Kruti Dev/DevLys (legacy) text ↔ Unicode Hindi',
  },
  'rev.group.kruti': {
    bn: 'Kruti Dev টুলস',
    hi: 'Kruti Dev टूल्स',
    en: 'Kruti Dev tools',
  },

  'kruti.title': {
    bn: 'Kruti Dev ↔ Unicode কনভার্টার',
    hi: 'Kruti Dev ↔ Unicode कनवर्टर',
    en: 'Kruti Dev ↔ Unicode Converter',
  },
  'kruti.desc': {
    bn: 'ছাপাখানার legacy ফন্টে টাইপ করা টেক্সট ইউনিকোডে আনুন, বা ইউনিকোড হিন্দিকে Kruti Dev/DevLys ফন্টে ছাপার জন্য এনকোড করুন।',
    hi: 'छपाई के लेगेसी फ़ॉन्ट में टाइप टेक्स्ट को यूनिकोड में लाएँ, या यूनिकोड हिन्दी को Kruti Dev/DevLys फ़ॉन्ट में छापने के लिए एनकोड करें।',
    en: 'Bring press-legacy font text into Unicode, or encode Unicode Hindi for printing in Kruti Dev/DevLys fonts.',
  },
  'kruti.dir.k2u': {
    bn: 'Kruti → Unicode',
    hi: 'Kruti → Unicode',
    en: 'Kruti → Unicode',
  },
  'kruti.dir.u2k': {
    bn: 'Unicode → Kruti',
    hi: 'Unicode → Kruti',
    en: 'Unicode → Kruti',
  },
  'kruti.input': {
    bn: 'লিগ্যাসি টেক্সট (Remington Gail টাইপিং)',
    hi: 'लेगेसी टेक्स्ट (Remington Gail टाइपिंग)',
    en: 'Legacy text (Remington Gail typing)',
  },
  'kruti.inputUni': {
    bn: 'ইউনিকোড হিন্দি',
    hi: 'यूनिकोड हिन्दी',
    en: 'Unicode Hindi',
  },
  'kruti.output': {
    bn: 'ইউনিকোড হিন্দি — রূপান্তরিত',
    hi: 'यूनिकोड हिन्दी — रूपांतरित',
    en: 'Unicode Hindi — converted',
  },
  'kruti.outputKruti': {
    bn: 'Kruti-এনকোড — Kruti Dev ফন্টে দেখাবে',
    hi: 'Kruti-एनकोड — Kruti Dev फ़ॉन्ट में दिखेगा',
    en: 'Kruti-encoded — renders in Kruti Dev font',
  },
  'kruti.sample': {
    bn: 'নমুনা',
    hi: 'नमूना',
    en: 'Sample',
  },
  'kruti.clear': {
    bn: 'মুছুন',
    hi: 'साफ़ करें',
    en: 'Clear',
  },
  'kruti.copy': {
    bn: 'কপি',
    hi: 'कॉपी',
    en: 'Copy',
  },
  'kruti.insert': {
    bn: 'ডকুমেন্টে বসান',
    hi: 'दस्तावेज़ में डालें',
    en: 'Insert into document',
  },
  'kruti.inserted': {
    bn: 'রূপান্তরিত টেক্সট কার্সরের জায়গায় বসানো হয়েছে',
    hi: 'रूपांतरित टेक्स्ट कर्सर स्थान पर डाला गया',
    en: 'Converted text inserted at the cursor',
  },
  'kruti.copied': {
    bn: 'আউটপুট কপি হয়েছে',
    hi: 'आउटपुट कॉपी हो गया',
    en: 'Output copied',
  },
  'kruti.noEditor': {
    bn: 'আগে একটি পাতায় ক্লিক করুন — তারপর বসান',
    hi: 'पहले किसी पृष्ठ पर क्लिक करें — फिर डालें',
    en: 'Click inside a page first, then insert',
  },
  'kruti.emptyOut': {
    bn: 'বাঁ দিকে লিখলেই রূপান্তর এখানে দেখা যাবে…',
    hi: 'बाईं ओर टाइप करते ही रूपांतर यहाँ दिखेगा…',
    en: 'Start typing on the left and the conversion appears here…',
  },
  'kruti.help': {
    bn: 'Kruti Dev/DevLys ফন্টে টাইপ করা পুরনো ফাইল ASCII-আকারে সংরক্ষিত থাকে — ফন্ট ছাড়া পড়লে ইংরেজি অক্ষরের স্তূপ। সেই টেক্সট এখানে পেস্ট করলেই ইউনিকোড হিন্দি পাবেন, যেকোনো আধুনিক ফন্টে সাজানো যায়। উল্টো দিকে ইউনিকোড টেক্সট Kruti-এনকোডে গিয়ে Kruti Dev/DevLys ফন্টে (যেমন অফসেট ছাপাখানা) ছাপা যায়। বাঁ পাশের বক্স Kruti ফন্টেই দেখানো হয় — নিজের চোখে মিলিয়ে নিন।',
    hi: 'Kruti Dev/DevLys फ़ॉन्ट में टाइप पुरानी फ़ाइलें ASCII रूप में सहेजी जाती हैं — बिना फ़ॉन्ट पढ़ें तो अंग्रेज़ी अक्षरों का ढेर। वह टेक्स्ट यहाँ पेस्ट करें और यूनिकोड हिन्दी पाएँ, किसी भी आधुनिक फ़ॉन्ट में सजा सकते हैं। उलटी दिशा में यूनिकोड टेक्स्ट Kruti-एनकोडिंग में जाकर Kruti Dev/DevLys फ़ॉन्ट (जैसे ऑफ़सेट छपाई) में छपता है। बायाँ बॉक्स Kruti फ़ॉन्ट में ही दिखता है — अपनी आँखों से मिलाएँ।',
    en: 'Old files typed in Kruti Dev/DevLys fonts are stored as ASCII — without the font they look like a pile of Latin letters. Paste that text here to get Unicode Hindi that styles with any modern font. In the reverse direction, Unicode text becomes Kruti-encoded for printing in Kruti Dev/DevLys fonts (e.g. offset press). The left box renders in the Kruti font itself — verify with your own eyes.',
  },
};
