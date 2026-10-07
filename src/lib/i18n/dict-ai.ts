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
  // চিপ প্রম্পট — ক্লিকে ইনপুট বক্সে যা বসে (লেবেল-কি-এর ".prompt" সংস্করণ)
  'ai.chip.transcribe.prompt': {
    bn: 'ছবির সব লেখা হুবহু তুলে বইয়ের উপযোগী করে সাজিয়ে দাও।',
    hi: 'छवि का सारा लेख यथावत उतारकर पुस्तक-उपयोगी रूप में सजा दो।',
    en: 'Transcribe all visible text exactly and format it book-ready.',
  },
  'ai.chip.table.prompt': {
    bn: 'ছবির টেবিল/ডেটাগুলো সুন্দর টেবিল আকারে দাও।',
    hi: 'छवि की तालिका/डेटा को सुंदर तालिका रूप में दो।',
    en: 'Turn the tables/data in the image into a clean table.',
  },
  'ai.chip.bullets.prompt': {
    bn: 'মূল বিষয়গুলো বুলেট পয়েন্টে গুছিয়ে লেখো।',
    hi: 'मुख्य बिंदुओं को बुलेट पॉइंट में व्यवस्थित करो।',
    en: 'Organize the key points as bullet points.',
  },
  'ai.chip.steps.prompt': {
    bn: 'ডায়াগ্রাম/ফ্লোচার্টটি ধাপে ধাপে নম্বর দিয়ে লেখো।',
    hi: 'डायग्राम/फ़्लोचार्ट को चरण-दर-चरण क्रमांक सहित लिखो।',
    en: 'Rewrite the diagram/flowchart as numbered steps.',
  },
  'ai.chip.explain.prompt': {
    bn: 'ছবিটি সহজ ভাষায় বিস্তারিত ব্যাখ্যা করে বইয়ের প্যারাগ্রাফ লেখো।',
    hi: 'छवि को सरल भाषा में विस्तार से समझाकर पुस्तक के पैराग्राफ लिखो।',
    en: 'Explain the image in simple detail as book paragraphs.',
  },
  'ai.chip.qa.prompt': {
    bn: 'ছবির বিষয়বস্তু থেকে ৫টি প্রশ্ন-উত্তর তৈরি করো।',
    hi: 'छवि की सामग्री से ५ प्रश्न-उत्तर बनाओ।',
    en: 'Create 5 Q&A pairs from the image content.',
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
  'ai.set.models.load': {
    bn: 'মডেল তালিকা',
    hi: 'मॉडल सूची',
    en: 'Load models',
  },
  'ai.set.models.hint': {
    bn: '"মডেল তালিকা" চাপলে প্রোভাইডারের কাছ থেকে সঠিক মডেলের তালিকা এসে যাবে — তালিকা থেকে বাছলে 404 হবে না।',
    hi: '"मॉडल सूची" दबाने पर प्रोवाइडर से सही मॉडलों की सूची आएगी — सूची से चुनने पर 404 नहीं होगा।',
    en: '"Load models" fetches the exact model names from your provider — picking from the list avoids 404 errors.',
  },
  'ai.set.models.filterPh': {
    bn: 'মডেল খুঁজুন… (যেমন flash, glm)',
    hi: 'मॉडल खोजें… (जैसे flash, glm)',
    en: 'Search models… (e.g. flash, glm)',
  },
  'ai.set.models.loaded': {
    bn: 'টি মডেল পাওয়া গেছে — একটি বাছুন',
    hi: 'मॉडल मिले — एक चुनें',
    en: 'models found — pick one',
  },
  'ai.set.models.none': {
    bn: 'এই খোঁজে কোনো মডেল মেলেনি।',
    hi: 'इस खोज में कोई मॉडल नहीं मिला।',
    en: 'No models match this search.',
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
    bn: 'মডেল/URL পাওয়া যায়নি (404) — সেটিংসে “মডেল তালিকা” চেপে সঠিক মডেল বাছুন, Base URL মিলিয়ে নিন।',
    hi: 'मॉडल/URL नहीं मिला (404) — सेटिंग्स में “मॉडल सूची” दबाकर सही मॉडल चुनें, Base URL जाँचें।',
    en: 'Model/URL not found (404) — in settings press "Load models" and pick the exact model; also verify the Base URL.',
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
  // মডেল ব্যস্ত (503/529 high demand) — স্বয়ং-পুনরায় শেষ হলেও ব্যর্থ হলে
  'ai.err.busy': {
    bn: 'মডেলটি এই মুহূর্তে অতিরিক্ত ব্যস্ত (high demand) — স্বয়ংক্রিয়ভাবে কয়েকবার চেষ্টা করা হয়েছে। কয়েক সেকেন্ড পর আবার চাপুন, বা Settings-এ হালকা মডেল (যেমন Flash-Lite) বাছুন।',
    hi: 'मॉडल इस समय अत्यधिक व्यस्त है (high demand) — स्वतः कई बार प्रयास किया गया। कुछ सेकंड बाद फिर दबाएँ, या Settings में हल्का मॉडल (जैसे Flash-Lite) चुनें।',
    en: 'The model is very busy right now (high demand) — auto-retried several times. Try again in a few seconds, or pick a lighter model (e.g. Flash-Lite) in Settings.',
  },
  // ব্যস্ত মডেলের বদলে হালকা বিকল্প মডেল থেকে উত্তর এসেছে (নোটিশ-টোস্ট)
  'ai.err.busyFallback': {
    bn: 'মডেল ব্যস্ত থাকায় উত্তর এসেছে হালকা বিকল্প মডেল থেকে:',
    hi: 'मॉडल व्यस्त होने से उत्तर हल्के वैकल्पिक मॉडल से आया:',
    en: 'The model was busy — answered via a lighter fallback model:',
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
  'ai.err.size': {
    bn: 'অনুরোধ খুব বড় — ছবি/লেখা ছোট করুন।',
    hi: 'अनुरोध बहुत बड़ा है — छवि/लेख छोटा करें।',
    en: 'Request too large — shrink the image/text.',
  },
  'ai.err.badUrl': {
    bn: 'এই Base URL অনুমোদিত নয় — পাবলিক https ঠিকানা ব্যবহার করুন।',
    hi: 'यह Base URL अनुमत नहीं — सार्वजनिक https पता उपयोग करें।',
    en: 'This Base URL is not allowed — use a public https address.',
  },
  'ai.err.rateLimit': {
    bn: 'এক মিনিটে অনেক বেশি কল — একটু থেমে চেষ্টা করুন।',
    hi: 'एक मिनट में बहुत अधिक कॉल — थोड़ा रुककर प्रयास करें।',
    en: 'Too many calls in a minute — pause and retry.',
  },
  'ai.err.demoRate': {
    bn: 'ফ্রি ডেমোর সীমা শেষ — নিজের API Key দিলে সীমাহীন AI।',
    hi: 'फ्री डेमो सीमा समाप्त — अपनी API Key देने पर असीमित AI।',
    en: 'Free demo limit reached — add your own API key for unlimited AI.',
  },
  'ai.err.demoUnavailable': {
    bn: 'ডেমো মোড এখন অপরিবর্তনীয় — নিজের API Key যোগ করুন (সেটিংসে)।',
    hi: 'डेमो मोड अभी अनुपलब्ध — अपनी API Key जोड़ें (सेटिंग्स में)।',
    en: 'Demo mode is unavailable right now — add your own API key (in settings).',
  },
  // প্রোভাইডারের raw ত্রুটি-বার্তা (রোগ-নির্ণয়) ও স্বয়ংক্রিয় মডেল-সংশোধন নোটিশ
  'ai.err.raw': {
    bn: 'প্রোভাইডারের উত্তর:',
    hi: 'प्रदाता की प्रतिक्रिया:',
    en: 'Provider said:',
  },
  'ai.err.fixedModel': {
    bn: 'প্রোভাইডারের পরামর্শমতো মডেল বদলে সেভ করা হয়েছে:',
    hi: 'प्रदाता की सलाह अनुसार मॉडल बदलकर सेव किया गया:',
    en: 'Model auto-switched & saved as the provider suggested:',
  },
  'ai.err.instruction': {
    bn: 'আগে নির্দেশ লিখুন — AI কী করবে বুঝতে নির্দেশ দরকার।',
    hi: 'पहले निर्देश लिखें — AI क्या करे, यह बताना ज़रूरी है।',
    en: 'Write an instruction first — tell the AI what to do.',
  },
  'ai.err.nothing': {
    bn: 'যোগ করার মতো কিছু নেই — অন্তত একটি ব্লক বাছুন।',
    hi: 'जोड़ने जैसा कुछ नहीं — कम से कम एक ब्लॉक चुनें।',
    en: 'Nothing to insert — select at least one block.',
  },
  'ai.page.truncatedTip': {
    bn: 'পেজটি অনেক বড় — AI প্রথম অংশটুকুই দেখেছে; পুরো পেজ বদলানো বন্ধ (শেষাংশ মুছে যেত)। ফলাফল পরের অংশে বসাতে "পরে যোগ করো" ব্যবহার করুন।',
    hi: 'पेज बहुत बड़ा है — AI ने केवल पहला भाग देखा; पूरा पेज बदलना बंद है (शेष मिट जाता)। आगे जोड़ने के लिए "बाद में जोड़ें" इस्तेमाल करें।',
    en: 'This page is large — the AI only saw the first part; full-page replace is disabled (it would drop the tail). Use "Insert after" instead.',
  },
  'ai.err.badRequest': {
    bn: 'প্রোভাইডার অনুরোধটি গ্রহণ করেনি — নিচের বার্তা মিলিয়ে কি/মডেল/Base URL যাচাই করুন।',
    hi: 'प्रदाता ने अनुरोध अस्वीकार किया — नीचे संदेश से की/मॉडल/Base URL जाँचें।',
    en: 'The provider rejected the request — use the message below to check key/model/Base URL.',
  },
  'ai.err.blocked': {
    bn: 'প্রোভাইডার নিরাপত্তা-নীতিতে উত্তরটি আটকে দিয়েছে — ভিন্ন ভঙ্গিতে চেষ্টা করুন।',
    hi: 'प्रदाता ने सुरक्षा-नीति में उत्तर रोक दिया — अलग ढंग से प्रयास करें।',
    en: 'The provider blocked the reply under its safety policy — try rephrasing.',
  },

  // ─── প্রথমবার কি-সেটআপ গাইড (টোস্ট) ───
  'ai.onboard.title': {
    bn: 'AI চালু হয়েছে! এবার কিভাবে ব্যবহার করবেন —',
    hi: 'AI चालू हो गया! अब कैसे उपयोग करें —',
    en: 'AI is live! Here is how to use it —',
  },
  'ai.onboard.desc': {
    bn: '১) পেজের লেখা সিলেক্ট করুন বা ডাবল-ক্লিক করুন — ✦ AI টুল ফুটে উঠবে; নির্দেশ দিন, ছবি দিন, টেবিল বানান — AI সেই জায়গায়ই লিখে দেবে। ২) “পুরো পেজ” বাছলে AI সম্পূর্ণ পেজ পড়ে/লিখে ফেলে। ৩) হেডারের 💬 বাটনে AI চ্যাট।',
    hi: '१) पेज का लेख चुनें या डबल-क्लिक करें — ✦ AI टूल उभरेगा; निर्देश दें, छवि दें, टेबल बनाएँ — AI ठीक उसी जगह लिख देगा। २) “पूरा पेज” चुनने पर AI पूरा पेज पढ़ता/लिखता है। ३) हेडर के 💬 बटन पर AI चैट।',
    en: '1) Select text on a page or double-click — the ✦ AI tool pops up; give a prompt, attach an image, make tables — AI writes right there. 2) Pick "Whole page" to let AI read/rewrite the entire page. 3) The 💬 header button opens AI chat.',
  },

  // ─── হেডার AI চ্যাট বাটন ───
  'hdr.chat.tip': {
    bn: 'AI চ্যাট — বই-নির্মাতার সহ-লেখক (কথোপকথন)',
    hi: 'AI चैट — बुक-निर्माता का सह-लेखक (बातचीत)',
    en: 'AI chat — your co-author conversation',
  },

  // ─── AI চ্যাট প্যানেল ───
  'ai.chat.open': {
    bn: 'AI চ্যাট',
    hi: 'AI चैट',
    en: 'AI chat',
  },
  'ai.chat.openShort': {
    bn: 'চ্যাট',
    hi: 'चैट',
    en: 'Chat',
  },
  'ai.chat.tip': {
    bn: 'প্রফেশনাল AI কথোপকথন — পরিকল্পনা, লেখা, টেবিল, সারাংশ; উত্তর এক ক্লিকে বইয়ে',
    hi: 'प्रोफेशनल AI बातचीत — योजना, लेखन, टेबल, सारांश; उत्तर एक क्लिक में बुक में',
    en: 'Professional AI conversation — plan, write, tables, summaries; insert replies into the book',
  },
  'ai.chat.title': {
    bn: 'AI সহ-লেখক',
    hi: 'AI सह-लेखक',
    en: 'AI Co-author',
  },
  'ai.chat.demoSub': {
    bn: 'ডেমো মোড — নিজের কি দিলে আরও শক্তিশালী',
    hi: 'डेमो मोड — अपनी की देने पर और शक्तिशाली',
    en: 'Demo mode — stronger with your own key',
  },
  'ai.chat.clear': {
    bn: 'কথোপকথন মুছুন',
    hi: 'बातचीत मिटाएँ',
    en: 'Clear conversation',
  },
  'ai.chat.emptyTitle': {
    bn: 'আপনার বইয়ের AI সহ-লেখক প্রস্তুত',
    hi: 'आपकी बुक का AI सह-लेखक तैयार',
    en: 'Your book\u2019s AI co-author is ready',
  },
  'ai.chat.step1': {
    bn: 'বইয়ে লেখা সিলেক্ট করলেই পাশে ✦ AI বাটন — উন্নত/অনুবাদ/টেবিল এক ট্যাপে',
    hi: 'बुक में लेख चुनते ही ✦ AI बटन — सुधार/अनुवाद/टेबल एक टैप में',
    en: 'Select text in your book — a ✦ AI button appears for one-tap fixes',
  },
  'ai.chat.step2': {
    bn: 'নিচের 🖼 বাটনে ছবি/ডায়াগ্রাম দিন — AI দেখে বুঝে বর্ণনা লিখবে',
    hi: 'नीचे 🖼 बटन पर छवि/डायग्राम दें — AI देखकर समझकर वर्णन लिखेगा',
    en: 'Attach an image/diagram below — AI studies it and writes it up',
  },
  'ai.chat.step3': {
    bn: 'টেবিল, সারাংশ, আউটলাইন — যা চান বলুন; উত্তরের নিচে “বইয়ে যোগ করো”',
    hi: 'टेबल, सारांश, आउटलाइन — जो चाहें कहें; उत्तर के नीचे “बुक में जोड़ो”',
    en: 'Tables, summaries, outlines — just ask; every reply has "Insert into book"',
  },
  'ai.chat.quick': {
    bn: 'দ্রুত শুরু',
    hi: 'तेज़ शुरुआत',
    en: 'Quick starts',
  },
  'ai.chat.emptyNote': {
    bn: 'এখন সীমিত ডেমো চলছে — AI সেটিংসে নিজের ফ্রি/নিজের API Key দিলে সীমাহীন।',
    hi: 'अभी सीमित डेमो चल रहा है — AI सेटिंग्स में अपनी API Key दें, असीमित होगा।',
    en: 'Running on the limited demo — add your own API key in AI settings for unlimited use.',
  },
  'ai.chat.chip.outline': {
    bn: 'আউটলাইন বানাও',
    hi: 'आउटलाइन बनाओ',
    en: 'Make an outline',
  },
  'ai.chat.chip.summary': {
    bn: 'সারাংশ লেখো',
    hi: 'सारांश लिखो',
    en: 'Summarize',
  },
  'ai.chat.chip.table': {
    bn: 'টেবিল বানাও',
    hi: 'टेबल बनाओ',
    en: 'Make a table',
  },
  'ai.chat.chip.intro': {
    bn: 'ভূমিকা লেখো',
    hi: 'भूमिका लिखो',
    en: 'Write an intro',
  },
  // চ্যাট-চিপ প্রম্পট — ক্লিকে ইনপুটে বসে (তিন ভাষাতেই)
  'ai.chat.chip.outline.prompt': {
    bn: 'আমার বইয়ের জন্য একটি অধ্যায়ের আউটলাইন তৈরি করো।',
    hi: 'मेरी पुस्तक के लिए एक अध्याय की रूपरेखा बनाओ।',
    en: 'Create an outline for a chapter of my book.',
  },
  'ai.chat.chip.summary.prompt': {
    bn: 'নিচের লেখাটির সারাংশ লেখো: ',
    hi: 'नीचे दिए लेख का सारांश लिखो: ',
    en: 'Summarize the following text: ',
  },
  'ai.chat.chip.table.prompt': {
    bn: 'নিচের তথ্যগুলো দিয়ে একটি টেবিল বানাও: ',
    hi: 'नीचे दिए आँकड़ों से एक तालिका बनाओ: ',
    en: 'Make a table from the following data: ',
  },
  'ai.chat.chip.intro.prompt': {
    bn: 'একটি বইয়ের ভূমিকা অধ্যায়ের জন্য আকর্ষণীয় প্যারাগ্রাফ লেখো।',
    hi: 'एक पुस्तक के भूमिका अध्याय के लिए आकर्षक पैराग्राफ लिखो।',
    en: 'Write an engaging paragraph for a book introduction chapter.',
  },
  'ai.chat.noSelection': {
    bn: 'আগে বইয়ে কিছু লেখা সিলেক্ট করুন',
    hi: 'पहले बुक में कुछ लेख चुनें',
    en: 'Select some text in the book first',
  },
  'ai.chat.imageMsg': {
    bn: '(ছবি সংযুক্ত — এটি দেখে ব্যাখ্যা করো)',
    hi: '(छवि संलग्न — इसे देखकर व्याख्या करो)',
    en: '(image attached — please analyze it)',
  },
  'ai.chat.copied': {
    bn: 'উত্তর কপি হয়েছে',
    hi: 'उत्तर कॉपी हो गया',
    en: 'Reply copied',
  },
  'ai.chat.copyFail': {
    bn: 'কপি করা যায়নি',
    hi: 'कॉपी नहीं हो सका',
    en: 'Could not copy',
  },
  'ai.chat.insert': {
    bn: 'বইয়ে যোগ',
    hi: 'बुक में जोड़ें',
    en: 'Insert',
  },
  'ai.chat.copy': {
    bn: 'কপি',
    hi: 'कॉपी',
    en: 'Copy',
  },
  'ai.chat.thinking': {
    bn: 'AI ভাবছে…',
    hi: 'AI सोच रहा है…',
    en: 'AI is thinking…',
  },
  'ai.chat.attach': {
    bn: 'ছবি সংযুক্ত করুন (ড্র্যাগ/Ctrl+V-ও চলে)',
    hi: 'छवि संलग्न करें (ड्रैग/Ctrl+V भी चलता है)',
    en: 'Attach an image (drag / Ctrl+V also work)',
  },
  'ai.chat.ph': {
    bn: 'AI-কে লিখুন… (Enter=পাঠাও, Shift+Enter=নতুন লাইন)',
    hi: 'AI को लिखें… (Enter=भेजें, Shift+Enter=नई पंक्ति)',
    en: 'Ask the AI… (Enter to send, Shift+Enter for a new line)',
  },
  'ai.chat.quoteSel': {
    bn: 'সিলেকশন উদ্ধৃত করো',
    hi: 'चयन उद्धृत करें',
    en: 'Quote selection',
  },
  'ai.chat.secure': {
    bn: 'কি শুধু আপনার ব্রাউজারে',
    hi: 'की केवल आपके ब्राउज़र में',
    en: 'Your key stays in your browser',
  },
  'ai.chat.send': {
    bn: 'পাঠাও',
    hi: 'भेजें',
    en: 'Send',
  },

  // ─── AI বাবল (সিলেকশন টুল) ───
  'ai.bubble.open': {
    bn: 'AI টুল খুলুন — সিলেক্ট করা অংশে কাজ করবে',
    hi: 'AI टूल खोलें — चयनित अंश पर काम करेगा',
    en: 'Open AI tools — works on the selected text',
  },
  'ai.bubble.title': {
    bn: 'AI টুল',
    hi: 'AI टूल',
    en: 'AI tools',
  },
  'ai.bubble.subReady': {
    bn: 'সিলেক্ট করা অংশে কাজ করবে',
    hi: 'चयनित अंश पर काम करेगा',
    en: 'Works on your selection',
  },
  'ai.bubble.subDemo': {
    bn: 'ডেমো মোড (সীমিত)',
    hi: 'डेमो मोड (सीमित)',
    en: 'Demo mode (limited)',
  },
  'ai.bubble.close': {
    bn: 'বন্ধ করুন',
    hi: 'बंद करें',
    en: 'Close',
  },
  'ai.bubble.setupLine': {
    bn: 'নিজের API Key দিলে এই টুলগুলো সীমাহীন ও দ্রুত হবে —',
    hi: 'अपनी API Key देने पर ये टूल असीमित व तेज़ होंगे —',
    en: 'Add your own API key to make these tools unlimited and fast —',
  },
  'ai.bubble.quick': {
    bn: 'দ্রুত কাজ',
    hi: 'तेज़ काम',
    en: 'Quick actions',
  },
  'ai.bubble.imageTip': {
    bn: 'ছবি আপলোড — AI দেখে এখানে লিখে দেবে',
    hi: 'छवि अपलोड — AI देखकर यहाँ लिख देगा',
    en: 'Upload an image — AI reads it and writes here',
  },
  'ai.bubble.image': {
    bn: 'ছবি',
    hi: 'छवि',
    en: 'Image',
  },
  'ai.bubble.imageDrop': {
    bn: 'ছবি বাছুন / ফেলুন / Ctrl+V',
    hi: 'छवि चुनें / गिराएँ / Ctrl+V',
    en: 'Pick / drop an image / Ctrl+V',
  },
  'ai.bubble.imageOn': {
    bn: 'ছবি সংযুক্ত — AI দেখে লিখবে',
    hi: 'छवि संलग्न — AI देखकर लिखेगा',
    en: 'Image attached — AI will read it',
  },
  'ai.bubble.needImage': {
    bn: 'আগে একটি ছবি সংযুক্ত করুন',
    hi: 'पहले एक छवि संलग्न करें',
    en: 'Attach an image first',
  },
  'ai.bubble.customPh': {
    bn: 'নিজের নির্দেশ লিখুন — যেমন: “এই অংশ ছাত্রদের জন্য সহজ করে লেখো”…',
    hi: 'अपना निर्देश लिखें — जैसे: "यह अंश छात्रों के लिए सरल करके लिखो"…',
    en: 'Your instruction — e.g. "simplify this passage for students"…',
  },

  // ─── সিলেকশন মোড লেবেল ───
  'ai.sel.improve': {
    bn: 'উন্নত করো',
    hi: 'सुधारो',
    en: 'Improve',
  },
  'ai.sel.improve.tip': {
    bn: 'লেখা আরও প্রাঞ্জল ও প্রফেশনাল করে পুনর্লিখন',
    hi: 'लेख को और प्रवाहमयी व प्रोफेशनल बनाएँ',
    en: 'Rewrite more fluent & professional',
  },
  'ai.sel.grammar': {
    bn: 'বানান/ব্যাকরণ',
    hi: 'वर्तनी/व्याकरण',
    en: 'Spelling/grammar',
  },
  'ai.sel.grammar.tip': {
    bn: 'শুধু ভুল ঠিক — লেখকের ভঙ্গি অটুট',
    hi: 'केवल त्रुटियाँ ठीक — शैली अक्षुण्ण',
    en: 'Fix mistakes only — keeps your voice',
  },
  'ai.sel.trEn': {
    bn: '→ ইংরেজি',
    hi: '→ अंग्रेज़ी',
    en: '→ English',
  },
  'ai.sel.trEn.tip': {
    bn: 'প্রকাশনা-মানের ইংরেজি অনুবাদ',
    hi: 'प्रकाशन-स्तरीय अंग्रेज़ी अनुवाद',
    en: 'Publication-quality English translation',
  },
  'ai.sel.trBn': {
    bn: '→ বাংলা',
    hi: '→ बांग्ला',
    en: '→ Bangla',
  },
  'ai.sel.trBn.tip': {
    bn: 'সাবলীল বাংলা অনুবাদ',
    hi: 'सरल बांग्ला अनुवाद',
    en: ' fluent Bangla translation',
  },
  'ai.sel.trHi': {
    bn: '→ হিন্দি',
    hi: '→ हिन्दी',
    en: '→ Hindi',
  },
  'ai.sel.trHi.tip': {
    bn: 'সাবলীল হিন্দি অনুবাদ',
    hi: 'सरल हिन्दी अनुवाद',
    en: 'Fluent Hindi translation',
  },
  'ai.sel.shorten': {
    bn: 'সংক্ষিপ্ত',
    hi: 'संक्षिप्त',
    en: 'Shorten',
  },
  'ai.sel.shorten.tip': {
    bn: 'অর্থ ঠিক রেখে অর্ধেক দৈর্ঘ্যে',
    hi: 'अर्थ रखते हुए आधी लंबाई',
    en: 'Halve the length, keep the meaning',
  },
  'ai.sel.expand': {
    bn: 'বিস্তারিত',
    hi: 'विस्तार',
    en: 'Expand',
  },
  'ai.sel.expand.tip': {
    bn: 'উদাহরণ ও ব্যাখ্যা যোগ করে দ্বিগুণ',
    hi: 'उदाहरण व व्याख्या जोड़कर दोगुना',
    en: 'Double with examples & explanation',
  },
  'ai.sel.simplify': {
    bn: 'সহজ ভাষা',
    hi: 'सरल भाषा',
    en: 'Simplify',
  },
  'ai.sel.simplify.tip': {
    bn: 'সাধারণ পাঠকের জন্য সহজ করে',
    hi: 'सामान्य पाठक के लिए सरल करें',
    en: 'Make it easy for any reader',
  },
  'ai.sel.formal': {
    bn: 'আনুষ্ঠানিক',
    hi: 'औपचारिक',
    en: 'Formal',
  },
  'ai.sel.formal.tip': {
    bn: 'গ্রন্থ-মানের আনুষ্ঠানিক ভঙ্গি',
    hi: 'ग्रंथ-स्तरीय औपचारिक शैली',
    en: 'Formal, book-grade tone',
  },
  'ai.sel.bullets': {
    bn: 'বুলেটে গুছাও',
    hi: 'बुलेट में सजाओ',
    en: 'Bulletize',
  },
  'ai.sel.bullets.tip': {
    bn: 'মূল বিষয়গুলো বুলেট তালিকায়',
    hi: 'मुख्य बिंदु बुलेट सूची में',
    en: 'Key points as a bullet list',
  },
  'ai.sel.makeTable': {
    bn: 'টেবিল বানাও',
    hi: 'टेबल बनाओ',
    en: 'Make a table',
  },
  'ai.sel.makeTable.tip': {
    bn: 'তথ্যগুলো সুন্দর টেবিলে সাজানো',
    hi: 'जानकारी को टेबल में सजाना',
    en: 'Arrange the data into a table',
  },
  'ai.sel.explain': {
    bn: 'ব্যাখ্যা যোগ',
    hi: 'व्याख्या जोड़ें',
    en: 'Explain',
  },
  'ai.sel.explain.tip': {
    bn: 'সিলেক্ট করা অংশের সহজ ব্যাখ্যা পাশে বসবে',
    hi: 'चयनित अंश की सरल व्याख्या पास बैठेगी',
    en: 'A simple explanation added next to the selection',
  },
  'ai.sel.custom': {
    bn: 'নিজের নির্দেশ',
    hi: 'अपना निर्देश',
    en: 'Custom instruction',
  },
  'ai.sel.custom.tip': {
    bn: 'যা চান লিখে দিন — AI সেই অনুযায়ী কাজ করবে',
    hi: 'जो चाहें लिख दें — AI उसी अनुसार काम करेगा',
    en: 'Write anything — AI will follow it',
  },
  'ai.sel.tableEdit': {
    bn: 'AI টেবিল বদল',
    hi: 'AI टेबल बदल',
    en: 'AI table edit',
  },
  'ai.sel.tableEdit.tip': {
    bn: 'পুরো টেবিল নির্দেশ অনুযায়ী নতুন করে সাজানো',
    hi: 'पूरी टेबल निर्देश अनुसार नई तरह सजाना',
    en: 'Rebuild the whole table per your instruction',
  },
  'ai.sel.imageExplain': {
    bn: 'AI ছবি ব্যাখ্যা',
    hi: 'AI छवि व्याख्या',
    en: 'AI image write-up',
  },
  'ai.sel.imageExplain.tip': {
    bn: 'ছবি/ডায়াগ্রাম দেখে বইয়ের বর্ণনা লেখা',
    hi: 'छवि/डायग्राम देखकर बुक-वर्णन लिखना',
    en: 'Study the image and write book-ready text',
  },
  'ai.sel.verify': {
    bn: 'সঠিকতা যাচাই',
    hi: 'सटीकता जाँच',
    en: 'Verify',
  },
  'ai.sel.verify.tip': {
    bn: 'বানান, ব্যাকরণ ও তথ্যের ভুল খুঁজে সংশোধন-তালিকা দেয়',
    hi: 'वर्तनी, व्याकरण व तथ्य की गलतियाँ खोजकर सुधार-सूची देता है',
    en: 'Finds spelling, grammar & factual errors with fixes',
  },
  'ai.sel.continue': {
    bn: 'লিখে দাও',
    hi: 'आगे लिखो',
    en: 'Continue writing',
  },
  'ai.sel.continue.tip': {
    bn: 'সিলেকশন/পেজের ধারা অব্যাহত রেখে নতুন অংশ লেখা',
    hi: 'चयन/पेज की धारा जारी रखते हुए नया अंश लिखना',
    en: 'Continues from the selection/page in the same voice',
  },
  'ai.sel.run': {
    bn: 'AI চালাও',
    hi: 'AI चलाओ',
    en: 'Run AI',
  },
  'ai.sel.working': {
    bn: 'AI কাজ করছে…',
    hi: 'AI काम कर रहा है…',
    en: 'AI is working…',
  },
  'ai.sel.replace': {
    bn: 'প্রতিস্থাপন',
    hi: 'प्रतिस्थापन',
    en: 'Replace',
  },
  'ai.sel.insertAfter': {
    bn: 'পরে যোগ করো',
    hi: 'बाद में जोड़ो',
    en: 'Insert after',
  },

  // ─── কনটেক্সট-মেনু AI সেকশন ───
  'ws.ctx.hAi': {
    bn: 'AI',
    hi: 'AI',
    en: 'AI',
  },
  'ai.ctx.improve': {
    bn: 'AI দিয়ে উন্নত করো',
    hi: 'AI से सुधारो',
    en: 'Improve with AI',
  },
  'ai.ctx.grammar': {
    bn: 'বানান ও ব্যাকরণ ঠিক করো',
    hi: 'वर्तनी व व्याकरण ठीक करो',
    en: 'Fix spelling & grammar',
  },
  'ai.ctx.trEn': {
    bn: 'ইংরেজিতে অনুবাদ করো',
    hi: 'अंग्रेज़ी में अनुवाद करो',
    en: 'Translate to English',
  },
  'ai.ctx.makeTable': {
    bn: 'তথ্যগুলো টেবিলে সাজাও',
    hi: 'जानकारी टेबल में सजाओ',
    en: 'Turn the data into a table',
  },
  'ai.ctx.explain': {
    bn: 'এই অংশের ব্যাখ্যা যোগ করো',
    hi: 'इस अंश की व्याख्या जोड़ो',
    en: 'Add an explanation',
  },
  'ai.ctx.custom': {
    bn: 'AI নির্দেশ দাও…',
    hi: 'AI निर्देश दो…',
    en: 'Instruct AI…',
  },
  'ai.ctx.imgExplain': {
    bn: 'AI দেখে ব্যাখ্যা লিখে দিক…',
    hi: 'AI देखकर व्याख्या लिख दे…',
    en: 'Let AI study & write it up…',
  },
  'ai.ctx.tblEdit': {
    bn: 'AI দিয়ে টেবিল বদলাও…',
    hi: 'AI से टेबल बदलें…',
    en: 'Edit this table with AI…',
  },
  'ai.ctx.tblNew': {
    bn: 'এই জায়গায় AI দিয়ে নতুন টেবিল…',
    hi: 'यहाँ AI से नई टेबल…',
    en: 'New AI table here…',
  },
  'ai.ctx.noTable': {
    bn: 'টেবিল শনাক্ত হয়নি',
    hi: 'टेबल नहीं मिली',
    en: 'No table detected',
  },

  // ─── AI বাবল — প্রেক্ষাপট (সিলেকশন / পুরো পেজ) ───
  'ai.scope.label': {
    bn: 'AI কাজ করবে —',
    hi: 'AI काम करेगा —',
    en: 'AI works on —',
  },
  'ai.scope.sel': {
    bn: 'নির্বাচিত অংশ',
    hi: 'चयनित अंश',
    en: 'Selected text',
  },
  'ai.scope.page': {
    bn: 'পুরো পেজ',
    hi: 'पूरा पेज',
    en: 'Whole page',
  },
  'ai.scope.selTip': {
    bn: 'AI শুধু নির্বাচিত লেখাটি পড়বে ও বদলাবে',
    hi: 'AI केवल चयनित लेख पढ़ेगा और बदलेगा',
    en: 'AI reads and rewrites only the selected text',
  },
  'ai.scope.pageTip': {
    bn: 'AI পুরো পেজ পড়বে — “পুরো পেজ বদলে দাও” দিলে পেজ নতুন করে লেখা হবে',
    hi: 'AI पूरा पेज पढ़ता है — “पूरा पेज बदलें” देने पर पेज नया लिखा जाएगा',
    en: 'AI reads the entire page — "Replace whole page" rewrites it',
  },
  'ai.page.replace': {
    bn: 'পুরো পেজ বদলে দাও',
    hi: 'पूरा पेज बदलें',
    en: 'Replace whole page',
  },
};
