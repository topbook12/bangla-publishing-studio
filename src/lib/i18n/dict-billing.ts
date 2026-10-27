/**
 * অভিধান — ফেজ-৪ মনিটাইজেশন (দিন ৩১–৪০)
 * কী-প্রিফিক্স: bill. (বিলিং কেন্দ্র/পেমেন্ট/কোটা) / land.pricing.* (ল্যান্ডিং প্রাইসিং)
 */

import type { Dict } from './core';

export const dictBilling: Dict = {
  // ─── বিলিং কেন্দ্র ───
  'bill.menu': { bn: 'প্ল্যান ও বিলিং', hi: 'प्लान और बिलिंग', en: 'Plan & billing' },
  'bill.title': { bn: 'প্ল্যান ও বিলিং', hi: 'प्लान और बिलिंग', en: 'Plan & billing' },
  'bill.desc': {
    bn: 'চলতি প্ল্যান, ব্যবহারের সীমা ও ইনভয়েস — সব এক জায়গায়। সম্পাদক আগের মতোই ফ্রি।',
    hi: 'वर्तमान प्लान, उपयोग-सीमा और इनवॉइस — सब एक जगह। एडिटर पहले की तरह मुफ़्त।',
    en: 'Your current plan, usage limits and invoices — all in one place. The editor stays free.',
  },
  'bill.signin.title': { bn: 'বিলিংয়ের জন্য সাইন ইন করুন', hi: 'बिलिंग के लिए साइन इन करें', en: 'Sign in for billing' },
  'bill.signin.desc': {
    bn: 'প্ল্যান, পেমেন্ট ও ইনভয়েস দেখতে একটা ফ্রি অ্যাকাউন্টই যথেষ্ট। সম্পাদক নিজে থেকেই ফ্রি ও অফলাইন-সক্ষম — সাইন ইন ছাড়াও।',
    hi: 'प्लान, भुगतान और इनवॉइस देखने के लिए एक मुफ़्त अकाउंट ही काफ़ी है। एडिटर खुद मुफ़्त और ऑफ़लाइन-सक्षम है — बिना साइन इन भी।',
    en: 'Plans, payments and invoices need just a free account. The editor itself stays free and offline-capable — no sign-in required.',
  },
  'bill.signin.cta': { bn: 'সাইন ইন করুন', hi: 'साइन इन करें', en: 'Sign in' },

  // ─── প্ল্যান নাম ও ট্যাগলাইন ───
  'bill.plan.free': { bn: 'ফ্রি', hi: 'फ्री', en: 'Free' },
  'bill.plan.pro': { bn: 'প্রো', hi: 'प्रो', en: 'Pro' },
  'bill.plan.publisher': { bn: 'পাবলিশার', hi: 'पब्लिशर', en: 'Publisher' },
  'bill.plan.free.tag': { bn: 'শুরু করার জন্য — একেবারে ফ্রি', hi: 'शुरुआत के लिए — बिल्कुल मुफ़्त', en: 'To get started — totally free' },
  'bill.plan.pro.tag': { bn: 'নিয়মিত লেখক ও শিক্ষকদের জন্য', hi: 'नियमित लेखकों और शिक्षकों के लिए', en: 'For regular writers & teachers' },
  'bill.plan.publisher.tag': { bn: 'প্রকাশনা প্রতিষ্ঠান ও কোচিং সেন্টারের জন্য', hi: 'प्रकाशन संस्थान और कोचिंग सेंटर के लिए', en: 'For publishers & coaching centres' },
  'bill.plan.free.cta': { bn: 'ফ্রি ব্যবহার করুন', hi: 'मुफ़्त में उपयोग करें', en: 'Use free' },
  'bill.plan.current': { bn: 'বর্তমান প্ল্যান', hi: 'वर्तमान प्लान', en: 'Current plan' },

  // ─── স্ট্যাটাস ও নবায়ন ───
  'bill.status.active': { bn: 'সক্রিয়', hi: 'सक्रिय', en: 'Active' },
  'bill.status.canceled': { bn: 'বাতিল করা হয়েছে', hi: 'रद्द कर दिया गया', en: 'Canceled' },
  'bill.status.free': { bn: 'ফ্রি', hi: 'मुफ़्त', en: 'Free' },
  'bill.status.expired': { bn: 'মেয়াদ শেষ', hi: 'समाप्त', en: 'Expired' },
  'bill.renews': { bn: 'নবায়ন হবে', hi: 'नवीनीकरण होगा', en: 'Renews' },
  'bill.ends': { bn: 'চলবে', hi: 'चलेगा', en: 'Runs until' },
  'bill.renew.off': { bn: 'অটো-নবায়ন বন্ধ', hi: 'ऑटो-नवीनीकरण बंद', en: 'Auto-renew off' },

  // ─── ব্যবহারের মিটার ───
  'bill.usage.docs': { bn: 'ক্লাউড ডকুমেন্ট', hi: 'क्लाउड दस्तावेज़', en: 'Cloud documents' },
  'bill.usage.shares': { bn: 'চালু শেয়ার লিংক', hi: 'सक्रिय शेयर लिंक', en: 'Active share links' },
  'bill.usage.ai': { bn: 'AI ক্রেডিট (এই মাস)', hi: 'AI क्रेडिट (इस महीने)', en: 'AI credits (this month)' },
  'bill.unlimited': { bn: 'আনলিমিটেড', hi: 'असीमित', en: 'Unlimited' },
  'bill.upgrade': { bn: 'আপগ্রেড করুন', hi: 'अपग्रेड करें', en: 'Upgrade' },

  // ─── বাতিলকরণ ───
  'bill.cancel': { bn: 'সাবস্ক্রিপশন বাতিল করুন', hi: 'सब्सक्रिप्शन रद्द करें', en: 'Cancel subscription' },
  'bill.cancel.confirm.title': { bn: 'সাবস্ক্রিপশন বাতিল করবেন?', hi: 'सब्सक्रिप्शन रद्द करें?', en: 'Cancel subscription?' },
  'bill.cancel.confirm.desc': {
    bn: 'মেয়াদ শেষ হওয়া পর্যন্ত সব সুবিধা থাকবে; এরপর প্ল্যান নিজে থেকেই ফ্রিতে ফিরে যাবে।',
    hi: 'अवधि समाप्त होने तक सभी सुविधाएँ बनी रहेंगी; उसके बाद प्लान अपने आप फ्री हो जाएगा।',
    en: 'You keep every benefit till period end; afterwards the plan reverts to Free.',
  },
  'bill.cancel.confirm.yes': { bn: 'হ্যাঁ, বাতিল করুন', hi: 'हाँ, रद्द करें', en: 'Yes, cancel' },
  'bill.cancel.keep': { bn: 'না, থাক', hi: 'नहीं, रहने दें', en: 'No, keep it' },
  'bill.cancel.done': { bn: 'সাবস্ক্রিপশন বাতিল হয়েছে — মেয়াদ শেষ পর্যন্ত চলবে', hi: 'सब्सक्रिप्शन रद्द हो गया — अवधि समाप्ति तक चलेगा', en: 'Subscription canceled — runs till period end' },

  // ─── প্ল্যান বাছাই / সাইকেল / দাম ───
  'bill.choose': { bn: 'বেছে নিন', hi: 'चुनें', en: 'Choose' },
  'bill.permonth': { bn: '/মাস', hi: '/माह', en: '/month' },
  'bill.peryear': { bn: '/বছর', hi: '/वर्ष', en: '/year' },
  'bill.yearly.save': { bn: '২ মাস ফ্রি', hi: '२ महीने मुफ़्त', en: '2 months free' },
  'bill.size': { bn: 'সাইজ সীমা', hi: 'साइज़ सीमा', en: 'Size limit' },

  // ─── ইনভয়েস ───
  'bill.invoices.title': { bn: 'ইনভয়েস', hi: 'इनवॉइस', en: 'Invoices' },
  'bill.invoices.empty': { bn: 'এখনো কোনো ইনভয়েস নেই।', hi: 'अभी कोई इनवॉइस नहीं।', en: 'No invoices yet.' },
  'bill.print': { bn: 'প্রিন্ট', hi: 'प्रिंट', en: 'Print' },

  // ─── চেকআউট: সাইকেল, কুপন, মোট ───
  'bill.cycle.monthly': { bn: 'মাসিক', hi: 'मासिक', en: 'Monthly' },
  'bill.cycle.yearly': { bn: 'বার্ষিক', hi: 'वार्षिक', en: 'Yearly' },
  'bill.coupon.placeholder': { bn: 'কুপন কোড', hi: 'कूपन कोड', en: 'Coupon code' },
  'bill.coupon.apply': { bn: 'প্রয়োগ করুন', hi: 'लागू करें', en: 'Apply' },
  'bill.coupon.applied': { bn: 'কুপন প্রয়োগ হয়েছে', hi: 'कूपन लागू हो गया', en: 'Coupon applied' },
  'bill.coupon.invalid': { bn: 'কুপন সঠিক নয়', hi: 'कूपन मान्य नहीं', en: 'Invalid coupon' },
  'bill.coupon.expired': { bn: 'কুপনের মেয়াদ শেষ', hi: 'कूपन की अवधि समाप्त', en: 'Coupon expired' },
  'bill.coupon.usage_limit': { bn: 'কুপনের ব্যবহার সীমা শেষ', hi: 'कूपन की उपयोग सीमा समाप्त', en: 'Coupon usage limit reached' },
  'bill.copied': { bn: 'কপি হয়েছে', hi: 'कॉपी हो गया', en: 'Copied' },
  'bill.total': { bn: 'মোট', hi: 'कुल', en: 'Total' },

  // ─── পেমেন্ট মাধ্যম ও নিশ্চিতকরণ ───
  'bill.pay.now': { bn: 'পরিশোধ করুন', hi: 'भुगतान करें', en: 'Pay now' },
  'bill.pay.bkash': { bn: 'বিকাশ', hi: 'bKash', en: 'bKash' },
  'bill.pay.nagad': { bn: 'নগদ', hi: 'Nagad', en: 'Nagad' },
  'bill.pay.sslcommerz': { bn: 'SSLCommerz', hi: 'SSLCommerz', en: 'SSLCommerz' },
  'bill.pay.demo': { bn: 'ডেমো — তাৎক্ষণিক সক্রিয়', hi: 'डेमो — तुरंत सक्रिय', en: 'Demo — instant activation' },
  'bill.pay.reflabel': { bn: 'ট্রানজেকশন আইডি', hi: 'ट्रांज़ैक्शन आईडी', en: 'Transaction ID' },
  'bill.pay.confirm': { bn: 'পেমেন্ট নিশ্চিত করুন', hi: 'भुगतान की पुष्टि करें', en: 'Confirm payment' },
  'bill.pay.mismatch': { bn: 'ট্রানজেকশন আইডি মেলেনি — আবার দেখুন', hi: 'ट्रांज़ैक्शन आईडी मेल नहीं खाती — दोबारा जाँचें', en: 'Transaction ID mismatch — please check again' },
  'bill.pay.already': { bn: 'এই অর্ডার আগেই পরিশোধ হয়েছে — সাবস্ক্রিপশন সক্রিয় আছে', hi: 'यह ऑर्डर पहले ही भुगतान हो चुका है — सब्सक्रिप्शन सक्रिय है', en: 'This order was already paid — the subscription is active' },
  'bill.mode.live': { bn: 'লাইভ', hi: 'लाइव', en: 'Live' },
  'bill.mode.sandbox': { bn: 'স্যান্ডবক্স', hi: 'सैंडबॉक्स', en: 'Sandbox' },
  'bill.mode.demo': { bn: 'ডেমো', hi: 'डेमो', en: 'Demo' },
  'bill.instructions': { bn: 'পেমেন্টের ধাপ', hi: 'भुगतान के चरण', en: 'Payment steps' },

  // ─── সফল পেমেন্ট ───
  'bill.success.title': { bn: 'পেমেন্ট সফল — প্ল্যান সক্রিয়!', hi: 'भुगतान सफल — प्लान सक्रिय!', en: 'Payment successful — plan active!' },
  'bill.success.until': { bn: 'সক্রিয় থাকবে', hi: 'सक्रिय रहेगा', en: 'active until' },
  'bill.success.invoice': { bn: 'ইনভয়েস দেখুন/প্রিন্ট', hi: 'इनवॉइस देखें/प्रिंट करें', en: 'View/print invoice' },
  'bill.success.done': { bn: 'ঠিক আছে', hi: 'ठीक है', en: 'Done' },

  // ─── পেওয়াল / ত্রুটি / ফিচার-লাইন ───
  'bill.paywall.title': { bn: 'সীমা শেষ!', hi: 'सीमा समाप्त!', en: 'Limit reached!' },
  'bill.paywall.desc': {
    bn: 'ফ্রি প্ল্যানের কোটা শেষ — আপগ্রেড করলেই বেশি ডকুমেন্ট, শেয়ার লিংক ও AI ক্রেডিট মিলবে।',
    hi: 'फ्री प्लान का कोटा खत्म — अपग्रेड करें और ज़्यादा दस्तावेज़, शेयर लिंक व AI क्रेडिट पाएँ।',
    en: 'Free plan quota is used up — upgrade for more documents, share links and AI credits.',
  },
  'bill.paywall.cta': { bn: 'আপগ্রেড করুন', hi: 'अपग्रेड करें', en: 'Upgrade' },
  'bill.error': { bn: 'কিছু একটা ভুল হলো — আবার চেষ্টা করুন', hi: 'कुछ गड़बड़ हो गया — फिर कोशिश करें', en: 'Something went wrong — please try again' },
  'bill.feat.docs': { bn: 'ক্লাউড ডকুমেন্ট: {n}', hi: 'क्लाउड दस्तावेज़: {n}', en: 'Cloud documents: {n}' },
  'bill.feat.shares': { bn: 'শেয়ার লিংক: {n}', hi: 'शेयर लिंक: {n}', en: 'Share links: {n}' },
  'bill.feat.ai': { bn: 'AI ক্রেডিট/মাস: {n}', hi: 'AI क्रेडिट/माह: {n}', en: 'AI credits/month: {n}' },
  'bill.feat.size': { bn: 'প্রতি ডকুমেন্ট: {n} MB', hi: 'प्रति दस्तावेज़: {n} MB', en: 'Per document: {n} MB' },
  'bill.feat.unlimited': { bn: 'আনলিমিটেড', hi: 'असीमित', en: 'Unlimited' },

  // ─── ল্যান্ডিং প্রাইসিং সেকশন ───
  'land.pricing.title': { bn: 'সহজ প্রাইসিং — দায়িত্ব নিয়ে', hi: 'सरल प्राइसिंग — ज़िम्मेदारी के साथ', en: 'Simple pricing — with responsibility' },
  'land.pricing.sub': {
    bn: 'সম্পাদক চিরকালই ফ্রি। ক্লাউড, শেয়ার ও AI-এর বড় সীমা দরকার হলেই আপগ্রেড — যেকোনো সময় বাতিল করুন।',
    hi: 'एडिटर हमेशा मुफ़्त। क्लाउड, शेयर और AI की बड़ी सीमा चाहिए तो अपग्रेड करें — कभी भी रद्द करें।',
    en: 'The editor stays free forever. Upgrade only when you need bigger cloud, share & AI limits — cancel anytime.',
  },
  'land.pricing.free.cta': { bn: 'ফ্রিতে শুরু করুন', hi: 'मुफ़्त में शुरू करें', en: 'Start free' },
  'land.pricing.upgrade': { bn: 'আপগ্রেড করুন', hi: 'अपग्रेड करें', en: 'Upgrade' },
  'bill.popular': { bn: 'সবচেয়ে জনপ্রিয়', hi: 'सबसे लोकप्रिय', en: 'Most popular' },
  'bill.loading': { bn: 'লোড হচ্ছে…', hi: 'लोड हो रहा है…', en: 'Loading…' },

  // ─── কোটা-ত্রুটি (cloud-dialog-এ ব্যবহৃত হবে) ───
  'bill.quota.docs': { bn: 'ফ্রি প্ল্যানে {n}টি ক্লাউড ডকুমেন্ট — আর নেই', hi: 'फ्री प्लान में {n} क्लाउड दस्तावेज़ — कोटा खत्म', en: 'Free plan allows {n} cloud documents — none left' },
  'bill.quota.shares': { bn: 'ফ্রি প্ল্যানে {n}টি শেয়ার লিংক — আর নেই', hi: 'फ्री प्लान में {n} शेयर लिंक — कोटा खत्म', en: 'Free plan allows {n} share links — none left' },
  'bill.quota.ai': { bn: 'এই মাসের AI ক্রেডিট শেষ ({n})', hi: 'इस महीने के AI क्रेडिट खत्म ({n})', en: "This month's AI credits are used up ({n})" },
  'bill.quota.cta': { bn: 'আপগ্রেড করুন', hi: 'अपग्रेड करें', en: 'Upgrade' },
  'bill.quota.size': { bn: 'ডকুমেন্ট এই প্ল্যানের সাইজ-সীমা ({n} MB) ছাড়িয়েছে', hi: 'दस्तावेज़ इस प्लान की आकार-सीमा ({n} MB) पार कर गया', en: 'Document exceeds this plan\u2019s size limit ({n} MB)' },
  'ai.err.quota': { bn: 'এই মাসের AI ক্রেডিট শেষ — প্ল্যান আপগ্রেড করুন বা নিজের API Key দিন', hi: 'इस महीने के AI क्रेडिट खत्म — प्लान अपग्रेड करें या अपनी API Key दें', en: 'Monthly AI credits used up — upgrade your plan or bring your own API key' },
};
