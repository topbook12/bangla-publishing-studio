/**
 * AI প্রিমিয়াম স্যুট — অভিধান (bn / hi / en)
 * ─────────────────────────────────────────
 * AI ভিশন (ছবি → বইয়ের কনটেন্ট), AI লেখক, BYOK সেটিংস — সব স্ট্রিং এখানে।
 */

import type { Dict } from './core';

export const dictAi: Dict = {
  // ─── রিবন ট্যাব ও হেডার ───
  'rb.tab.ai': {
    bn: 'AI',
    hi: 'AI',
    en: 'AI',
  },
  'hdr.ai.tip': {
    bn: 'AI কনফিগারেশন — নিজের API Key',
    hi: 'AI कॉन्फ़िगरेशन — अपनी API Key',
    en: 'AI configuration — your own API key',
  },

  // ─── রিবন AI ট্যাব ───
  'ai.group.vision': {
    bn: 'AI ভিশন',
    hi: 'AI विज़न',
    en: 'AI Vision',
  },
  'ai.btn.vision': {
    bn: 'ছবি থেকে কনটেন্ট',
    hi: 'छवि से कंटेंट',
    en: 'Image → Content',
  },
  'ai.btn.vision.tip': {
    bn: 'ডায়াগ্রাম/স্ক্রিনশট আপলোড করুন — AI দেখে বুঝে বইয়ে লিখে দেবে',
    hi: 'डायग्राम/स्क्रीनशॉट अपलोड करें — AI देखकर समझकर बुक में लिख देगा',
    en: 'Upload a diagram/screenshot — AI reads it and writes it into your book',
  },
  'ai.group.writer': {
    bn: 'AI লেখক',
    hi: 'AI लेखक',
    en: 'AI Writer',
  },
  'ai.btn.write': {
    bn: 'নতুন লেখা',
    hi: 'नई लेख',
    en: 'Write new',
  },
  'ai.btn.write.tip': {
    bn: 'নির্দেশ দিন — AI বইয়ের উপযোগী লেখা তৈরি করবে',
    hi: 'निर्देश दें — AI बुक-रेडी लेख बनाएगा',
    en: 'Give an instruction — AI writes book-ready content',
  },
  'ai.group.config': {
    bn: 'কনফিগারেশন',
    hi: 'कॉन्फ़िगरेशन',
    en: 'Configuration',
  },
  'ai.btn.settings': {
    bn: 'AI সেটিংস',
    hi: 'AI सेटिंग्स',
    en: 'AI settings',
  },
  'ai.btn.addKey': {
    bn: 'API Key যোগ করুন',
    hi: 'API Key जोड़ें',
    en: 'Add API key',
  },
  'ai.btn.settings.tip': {
    bn: 'নিজের API Key — আপনার খরচ, আপনার নিয়ন্ত্রণ; আমাদের কোনো বাধ্যবাধকতা নেই',
    hi: 'अपनी API Key — आपका खर्च, आपका नियंत्रण; हमारा कोई खर्च नहीं',
    en: 'Your own API key — your cost, your control; zero cost for us',
  },
  'ai.status.on': {
    bn: 'চালু',
    hi: 'चालू',
    en: 'Active',
  },
  'ai.status.off': {
    bn: 'কি নেই',
    hi: 'की नहीं',
    en: 'No key',
  },

  // ─── AI ভিশন ডায়ালগ ───
  'ai.vision.title': {
    bn: 'AI সহায়ক',
    hi: 'AI सहायक',
    en: 'AI Assistant',
  },
  'ai.vision.desc': {
    bn: 'ছবি দেখে বুঝে, আপনার নির্দেশ অনুযায়ী বইয়ের কনটেন্ট তৈরি হবে — তারপর এক ক্লিকে বইয়ে বসে যাবে।',
    hi: 'छवि देखकर समझकर, आपके निर्देश अनुसार बुक कंटेंट बनेगा — फिर एक क्लिक में बुक में बैठ जाएगा।',
    en: 'AI studies your image, follows your instruction, and drops book-ready content into your book in one click.',
  },
  'ai.tab.vision': {
    bn: 'ছবি → কনটেন্ট',
    hi: 'छवि → कंटेंट',
    en: 'Image → Content',
  },
  'ai.tab.text': {
    bn: 'AI লেখক',
    hi: 'AI लेखक',
    en: 'AI Writer',
  },

  'ai.drop.title': {
    bn: 'ছবি এখানে ফেলুন বা ক্লিক করে বাছুন',
    hi: 'छवि यहाँ गिराएँ या क्लिक करके चुनें',
    en: 'Drop an image here or click to browse',
  },
  'ai.drop.hint': {
    bn: 'PNG · JPG · WebP — স্ক্রিনশট হলে সরাসরি Ctrl+V চাপুন',
    hi: 'PNG · JPG · WebP — स्क्रीनशॉट हो तो सीधे Ctrl+V दबाएँ',
    en: 'PNG · JPG · WebP — for screenshots just press Ctrl+V',
  },
  'ai.drop.browse': {
    bn: 'ফাইল বাছুন',
    hi: 'फ़ाइल चुनें',
    en: 'Browse file',
  },
  'ai.drop.remove': {
    bn: 'ছবি সরান',
    hi: 'छवि हटाएँ',
    en: 'Remove image',
  },
  'ai.drop.change': {
    bn: 'বদলান',
    hi: 'बदलें',
    en: 'Replace',
  },

  'ai.instruction.label': {
    bn: 'লেখকের নির্দেশ',
    hi: 'लेखक का निर्देश',
    en: "Author's instruction",
  },
  'ai.instruction.ph': {
    bn: 'যেমন: এই ডায়াগ্রামটা ধাপে ধাপে লিখে দাও… (খালি রাখলে AI নিজেই সেরা ব্যবস্থা নেবে)',
    hi: 'जैसे: यह डायग्राम चरण-दर-चरण लिख दो… (खाली छोड़ने पर AI स्वयं सर्वोत्तम विकल्प लेगा)',
    en: 'e.g. Turn this diagram into numbered steps… (leave blank and AI decides best)',
  },
  'ai.chip.transcribe': {
    bn: 'সব লেখা তুলে দাও',
    hi: 'सारा लेख उतारो',
    en: 'Transcribe all text',
  },
  'ai.chip.table': {
    bn: 'টেবিল বানাও',
    hi: 'टेबल बनाओ',
    en: 'Make a table',
  },
  'ai.chip.bullets': {
    bn: 'বুলেট পয়েন্টে',
    hi: 'बुलेट पॉइंट में',
    en: 'As bullet points',
  },
  'ai.chip.steps': {
    bn: 'ধাপে ধাপে লেখো',
    hi: 'चरण-दर-चरण लिखो',
    en: 'Numbered steps',
  },
  'ai.chip.explain': {
    bn: 'সহজ ভাষায় ব্যাখ্যা',
    hi: 'सरल भाषा में व्याख्या',
    en: 'Explain simply',
  },
  'ai.chip.qa': {
    bn: 'প্রশ্ন-উত্তর বানাও',
    hi: 'प्रश्न-उत्तर बनाओ',
    en: 'Make Q&A',
  },

  'ai.analyze': {
    bn: 'AI দিয়ে বিশ্লেষণ',
    hi: 'AI से विश्लेषण',
    en: 'Analyze with AI',
  },
  'ai.analyzing': {
    bn: 'AI ছবিটি পড়ছে…',
    hi: 'AI छवि पढ़ रहा है…',
    en: 'AI is reading the image…',
  },
  'ai.generate': {
    bn: 'AI দিয়ে লেখো',
    hi: 'AI से लिखो',
    en: 'Write with AI',
  },
  'ai.generating': {
    bn: 'AI লিখছে…',
    hi: 'AI लिख रहा है…',
    en: 'AI is writing…',
  },

  'ai.result.title': {
    bn: 'AI-তৈরি কনটেন্ট',
    hi: 'AI-निर्मित कंटेंट',
    en: 'AI-generated content',
  },
  'ai.result.blocks': {
    bn: 'ব্লক',
    hi: 'ब्लॉक',
    en: 'blocks',
  },
  'ai.include.image': {
    bn: 'মূল ছবিটিও বসাও',
    hi: 'मूल छवि भी लगाओ',
    en: 'Also insert the original image',
  },
  'ai.include.title': {
    bn: 'শিরোনাম বসাও',
    hi: 'शीर्षक लगाओ',
    en: 'Insert the title heading',
  },
  'ai.insert': {
    bn: 'বইয়ে যোগ করো',
    hi: 'बुक में जोड़ो',
    en: 'Insert into book',
  },
  'ai.inserted': {
    bn: 'বইয়ে যোগ হয়েছে ✓',
    hi: 'बुक में जोड़ा गया ✓',
    en: 'Inserted into the book ✓',
  },
  'ai.noEditor': {
    bn: 'আগে একটি সাধারণ পাতা খুলুন (কভার পাতায় বসানো যায় না)',
    hi: 'पहले एक सामान्य पृष्ठ खोलें (कवर पृष्ठ पर नहीं)',
    en: 'Open a normal page first (cannot insert on the cover)',
  },
  'ai.reanalyze': {
    bn: 'আবার বিশ্লেষণ',
    hi: 'फिर विश्लेषण',
    en: 'Analyze again',
  },

  // ─── সেটআপ প্যানেল (কি নেই) ───
  'ai.setup.title': {
    bn: 'নিজের AI Key যোগ করুন — সম্পূর্ণ আপনার নিয়ন্ত্রণে',
    hi: 'अपनी AI Key जोड़ें — पूरी तरह आपके नियंत्रण में',
    en: 'Add your own AI key — fully under your control',
  },
  'ai.setup.desc': {
    bn: 'Z.AI, OpenAI, Gemini, Claude, OpenRouter, Groq — যেকোনো একটার ফ্রি/নিজের কি বসালেই সীমাহীন AI। কি শুধু আপনার ব্রাউজারেই থাকে, আমাদের কোনো খরচ বা ঝুঁকি নেই।',
    hi: 'Z.AI, OpenAI, Gemini, Claude, OpenRouter, Groq — किसी भी एक की फ्री/अपनी की लगाते ही असीमित AI। की केवल आपके ब्राउज़र में रहती है, हमारा कोई खर्च या जोखिम नहीं।',
    en: 'Z.AI, OpenAI, Gemini, Claude, OpenRouter, Groq — plug any free or personal key for unlimited AI. The key stays in your browser only; zero cost or risk for us.',
  },
  'ai.setup.open': {
    bn: 'AI সেটিংস খুলুন',
    hi: 'AI सेटिंग्स खोलें',
    en: 'Open AI settings',
  },
  'ai.setup.demo': {
    bn: 'ফ্রি ডেমো দেখুন (সীমিত)',
    hi: 'फ्री डेमो देखें (सीमित)',
    en: 'Try free demo (limited)',
  },
  'ai.demo.badge': {
    bn: 'ডেমো মোড',
    hi: 'डेमो मोड',
    en: 'Demo mode',
  },
  'ai.demo.note': {
    bn: 'ডেমো সীমিত ও ধীর হতে পারে — সেরা ফলের জন্য নিজের কি দিন।',
    hi: 'डेमो सीमित और धीमा हो सकता है — सर्वोत्तम परिणाम के लिए अपनी की दें।',
    en: 'Demo is limited and may be slow — add your own key for best results.',
  },

  // ─── AI সেটিংস ডায়ালগ ───
  'ai.set.title': {
    bn: 'AI কনফিগারেশন',
    hi: 'AI कॉन्फ़िगरेशन',
    en: 'AI Configuration',
  },
  'ai.set.desc': {
    bn: 'নিজের API Key ব্যবহার করুন — যত খুশি কল, কোম্পানির কোনো খরচ নেই। কি শুধু আপনার ব্রাউজারে (localStorage) সংরক্ষিত হয়।',
    hi: 'अपनी API Key उपयोग करें — जितने चाहें कॉल, कंपनी का कोई खर्च नहीं। की केवल आपके ब्राउज़र (localStorage) में सुरक्षित रहती है।',
    en: 'Use your own API key — unlimited calls, zero cost for us. The key is stored only in your browser (localStorage).',
  },
  'ai.set.provider': {
    bn: 'প্রোভাইডার',
    hi: 'प्रोवाइडर',
    en: 'Provider',
  },
  'ai.set.baseurl': {
    bn: 'Base URL',
    hi: 'Base URL',
    en: 'Base URL',
  },
  'ai.set.model': {
    bn: 'মডেল (ছবি বুঝতে পারে এমন)',
    hi: 'मॉडल (छवि समझने योग्य)',
    en: 'Model (vision-capable)',
  },
  'ai.set.key': {
    bn: 'API Key',
    hi: 'API Key',
    en: 'API Key',
  },
  'ai.set.key.ph': {
    bn: 'আপনার গোপন কি এখানে পেস্ট করুন',
    hi: 'अपनी गुप्त की यहाँ पेस्ट करें',
    en: 'Paste your secret key here',
  },
  'ai.set.show': {
    bn: 'কি দেখুন',
    hi: 'की देखें',
    en: 'Show key',
  },
  'ai.set.hide': {
    bn: 'কি লুকান',
    hi: 'की छिपाएँ',
    en: 'Hide key',
  },
  'ai.set.test': {
    bn: 'সংযোগ পরীক্ষা',
    hi: 'कनेक्शन जाँच',
    en: 'Test connection',
  },
  'ai.set.testing': {
    bn: 'পরীক্ষা চলছে…',
    hi: 'जाँच चल रही है…',
    en: 'Testing…',
  },
  'ai.set.test.ok': {
    bn: 'সংযোগ সফল ✓',
    hi: 'कनेक्शन सफल ✓',
    en: 'Connection OK ✓',
  },
  'ai.set.test.fail': {
    bn: 'সংযোগ ব্যর্থ',
    hi: 'कनेक्शन विफल',
    en: 'Connection failed',
  },
  'ai.set.save': {
    bn: 'সংরক্ষণ করুন',
    hi: 'सहेजें',
    en: 'Save',
  },
  'ai.set.saved': {
    bn: 'AI কনফিগারেশন সংরক্ষিত ✓',
    hi: 'AI कॉन्फ़िगरेशन सहेजा गया ✓',
    en: 'AI configuration saved ✓',
  },
  'ai.set.clear': {
    bn: 'কি মুছুন',
    hi: 'की मिटाएँ',
    en: 'Remove key',
  },
  'ai.set.cleared': {
    bn: 'কি মুছে ফেলা হয়েছে',
    hi: 'की मिटा दी गई',
    en: 'Key removed',
  },
  'ai.set.state.on': {
    bn: 'কি সেট আছে',
    hi: 'की सेट है',
    en: 'Key is set',
  },
  'ai.set.state.off': {
    bn: 'কি দেওয়া হয়নি',
    hi: 'की नहीं दी गई',
    en: 'No key yet',
  },
  'ai.set.help.title': {
    bn: 'API Key কোথায় পাব?',
    hi: 'API Key कहाँ मिलेगी?',
    en: 'Where do I get an API key?',
  },
  'ai.set.help.step1': {
    bn: 'নিচের লিংকে গিয়ে প্রোভাইডারের অ্যাকাউন্টে সাইন-আপ করুন',
    hi: 'नीचे लिंक पर जाकर प्रोवाइडर के खाते में साइन-अप करें',
    en: 'Open the link below and sign up with the provider',
  },
  'ai.set.help.step2': {
    bn: '“API Keys” / “Create key” অংশে গিয়ে নতুন কি তৈরি করুন',
    hi: '"API Keys" / "Create key" सेक्शन में जाकर नई की बनाएँ',
    en: 'Go to "API Keys" / "Create key" and generate a new key',
  },
  'ai.set.help.step3': {
    bn: 'কি কপি করে উপরের বক্সে পেস্ট করুন → সংরক্ষণ করুন',
    hi: 'की कॉपी करके ऊपर बॉक्स में पेस्ट करें → सहेजें',
    en: 'Copy the key, paste it in the box above → Save',
  },
  'ai.set.help.link': {
    bn: 'কি-পেজ খুলুন',
    hi: 'की-पेज खोलें',
    en: 'Open key page',
  },
  'ai.set.video': {
    bn: 'ভিডিও টিউটোরিয়াল — শীঘ্রই আসছে',
    hi: 'वीडियो ट्यूटोरियल — जल्द आ रहा है',
    en: 'Video tutorial — coming soon',
  },
  'ai.set.security': {
    bn: 'নিরাপত্তা: কি আপনার ব্রাউজার ছাড়া কোথাও যায় না; AI কলের সময় শুধু আপনার নির্বাচিত প্রোভাইডারে পৌঁছায়। আমরা কখনো সংরক্ষণ বা ব্যবহার করি না।',
    hi: 'सुरक्षा: की आपके ब्राउज़र से बाहर कहीं नहीं जाती; AI कॉल के समय केवल आपके चुने प्रोवाइडर तक पहुँचती है। हम कभी संग्रहित या उपयोग नहीं करते।',
    en: 'Security: your key never leaves your browser; during AI calls it goes only to the provider you chose. We never store or use it.',
  },
  'ai.set.customNote': {
    bn: 'যেকোনো OpenAI-সামঞ্জস্য সার্ভার (Ollama, LM Studio, vLLM, Together…) — Base URL ও মডেল লিখুন।',
    hi: 'कोई भी OpenAI-संगत सर्वर (Ollama, LM Studio, vLLM, Together…) — Base URL और मॉडल लिखें।',
    en: 'Any OpenAI-compatible server (Ollama, LM Studio, vLLM, Together…) — enter Base URL and model.',
  },

  // ─── প্রোভাইডার বিবরণ ───
  'ai.prov.zai.desc': {
    bn: 'GLM — বাংলা+হিন্দিতে দুর্দান্ত',
    hi: 'GLM — बांग्ला+हिन्दी में उत्कृष्ट',
    en: 'GLM — excellent for Bangla + Hindi',
  },
  'ai.prov.openai.desc': {
    bn: 'GPT-4o — সর্বাধিক জনপ্রিয়',
    hi: 'GPT-4o — सबसे लोकप्रिय',
    en: 'GPT-4o — most popular',
  },
  'ai.prov.gemini.desc': {
    bn: 'Gemini — ফ্রি কোটাসহ',
    hi: 'Gemini — फ्री कोटा सहित',
    en: 'Gemini — with a free tier',
  },
  'ai.prov.claude.desc': {
    bn: 'Claude — লেখায় স্বচ্ছন্দ',
    hi: 'Claude — लेखन में सहज',
    en: 'Claude — great prose',
  },
  'ai.prov.openrouter.desc': {
    bn: 'শত মডেল, এক কি',
    hi: 'सैकड़ों मॉडल, एक की',
    en: 'Hundreds of models, one key',
  },
  'ai.prov.groq.desc': {
    bn: 'বিদ্যুৎগতির উত্তর',
    hi: 'बिजली-गति उत्तर',
    en: 'Lightning-fast replies',
  },
  'ai.prov.custom.desc': {
    bn: 'নিজের সার্ভার/এন্ডপয়েন্ট',
    hi: 'अपना सर्वर/एंडपॉइंट',
    en: 'Your own server/endpoint',
  },

  // ─── ব্লক প্রিভিউ লেবেল ───
  'ai.block.heading': {
    bn: 'শিরোনাম',
    hi: 'शीर्षक',
    en: 'Heading',
  },
  'ai.block.paragraph': {
    bn: 'প্যারাগ্রাফ',
    hi: 'पैराग्राफ',
    en: 'Paragraph',
  },
  'ai.block.bullets': {
    bn: 'বুলেট তালিকা',
    hi: 'बुलेट सूची',
    en: 'Bullet list',
  },
  'ai.block.numbered': {
    bn: 'নম্বর তালিকা',
    hi: 'क्रमांकित सूची',
    en: 'Numbered list',
  },
  'ai.block.table': {
    bn: 'টেবিল',
    hi: 'टेबल',
    en: 'Table',
  },
  'ai.block.callout': {
    bn: 'কলআউট বক্স',
    hi: 'कॉलआउट बॉक्स',
    en: 'Callout box',
  },
  'ai.block.quote': {
    bn: 'উদ্ধৃতি',
    hi: 'उद्धरण',
    en: 'Quote',
  },
  'ai.block.code': {
    bn: 'কোড/সূত্র',
    hi: 'कोड/सूत्र',
    en: 'Code/formula',
  },

  // ─── ত্রুটি-বার্তা (hintKey) ───
  'ai.err.network': {
    bn: 'নেটওয়ার্ক সমস্যা — ইন্টারনেট সংযোগ ও Base URL যাচাই করুন।',
    hi: 'नेटवर्क समस्या — इंटरनेट कनेक्शन और Base URL जाँचें।',
    en: 'Network problem — check your internet connection and Base URL.',
  },
  'ai.err.auth': {
    bn: 'API Key সঠিক নয় বা মেয়াদ শেষ — সেটিংসে নতুন কি দিন।',
    hi: 'API Key गलत या समाप्त — सेटिंग्स में नई की दें।',
    en: 'API key is invalid or expired — add a fresh key in settings.',
  },
  'ai.err.model': {
    bn: 'মডেল/URL পাওয়া যায়নি — মডেলের নাম ও Base URL মিলিয়ে নিন।',
    hi: 'मॉडल/URL नहीं मिला — मॉडल नाम और Base URL जाँचें।',
    en: 'Model/URL not found — verify the model name and Base URL.',
  },
  'ai.err.rate': {
    bn: 'রেট-লিমিট/কোটা শেষ — একটু পরে চেষ্টা করুন বা কোটা বাড়ান।',
    hi: 'रेट-लिमिट/कोटा समाप्त — बाद में प्रयास करें या कोटा बढ़ाएँ।',
    en: 'Rate limit / quota reached — retry shortly or raise your quota.',
  },
  'ai.err.server': {
    bn: 'প্রোভাইডারের সার্ভারে সমস্যা — একটু পরে চেষ্টা করুন।',
    hi: 'प्रोवाइडर सर्वर में समस्या — बाद में प्रयास करें।',
    en: 'Provider server trouble — try again shortly.',
  },
  'ai.err.config': {
    bn: 'সেটিংসে Base URL ও মডেল পূরণ করুন।',
    hi: 'सेटिंग्स में Base URL और मॉडल भरें।',
    en: 'Fill in Base URL and model in settings.',
  },
  'ai.err.timeout': {
    bn: 'সময় শেষ — ছবি ছোট করুন বা দ্রুত মডেল বাছুন।',
    hi: 'समय समाप्त — छवि छोटी करें या तेज़ मॉडल चुनें।',
    en: 'Timed out — shrink the image or pick a faster model.',
  },
  'ai.err.parse': {
    bn: 'AI-এর উত্তর পড়া যায়নি — আবার চেষ্টা করুন বা নির্দেশ সংক্ষিপ্ত করুন।',
    hi: 'AI का उत्तर पढ़ा नहीं जा सका — फिर प्रयास करें या निर्देश छोटा करें।',
    en: "Could not parse the AI's reply — retry or simplify the instruction.",
  },
  'ai.err.empty': {
    bn: 'খালি উত্তর এসেছে — আবার চেষ্টা করুন।',
    hi: 'खाली उत्तर आया — फिर प्रयास करें।',
    en: 'Empty response — please try again.',
  },
  'ai.err.read': {
    bn: 'ছবি পড়া যায়নি — অন্য ফাইল দিন।',
    hi: 'छवि पढ़ी नहीं जा सकी — दूसरी फ़ाइल दें।',
    en: 'Could not read the image — try another file.',
  },
  'ai.err.title': {
    bn: 'AI কল ব্যর্থ হয়েছে',
    hi: 'AI कॉल विफल हुई',
    en: 'AI call failed',
  },
};
