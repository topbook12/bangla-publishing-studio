/**
 * প্রশ্নপত্র স্টুডিও (Question Paper Studio) — UI অভিধান
 * শিক্ষক হাতে-লেখা ছবি/কাঁচা লেখা দেয় → AI প্রিন্ট-রেডি প্রশ্নপত্র বানায়।
 */

export const dictQuestionPaper = {
  // ── Insert ট্যাবে এন্ট্রি ──
  'ins.qpstudio': {
    bn: 'প্রশ্নপত্র',
    hi: 'प्रश्नपत्र',
    en: 'Question Paper',
  },
  'ins.qpstudio.tip': {
    bn: 'প্রশ্নপত্র স্টুডিও — হাতের লেখা বা কাঁচা লেখা থেকে প্রিন্ট-রেডি প্রশ্নপত্র',
    hi: 'प्रश्नपत्र स्टूडियो — हस्तलिखित या कच्चे टेक्स्ट से प्रिंट-रेडी प्रश्नपत्र',
    en: 'Question Paper Studio — print-ready paper from handwriting or raw text',
  },

  // ── হেডার ও ধাপ ──
  'qp.title': {
    bn: 'প্রশ্নপত্র স্টুডিও',
    hi: 'प्रश्नपत्र स्टूडियो',
    en: 'Question Paper Studio',
  },
  'qp.desc': {
    bn: 'হাতের লেখা ছবি বা কাঁচা লেখা দিন — AI বিশ্লেষণ করে পূর্ণ প্রিন্ট-রেডি প্রশ্নপত্র বানিয়ে দেবে।',
    hi: 'हस्तलिखित फ़ोटो या कच्चा टेक्स्ट दें — AI विश्लेषण कर पूरा प्रिंट-रेडी प्रश्नपत्र बना देगा।',
    en: 'Give a handwritten photo or raw text — AI analyzes it and builds a full print-ready question paper.',
  },
  'qp.step.input': { bn: 'ইনপুট', hi: 'इनपुट', en: 'Input' },
  'qp.step.details': { bn: 'বিস্তারিত', hi: 'विवरण', en: 'Details' },
  'qp.step.format': { bn: 'নকশা', hi: 'डिज़ाइन', en: 'Design' },
  'qp.step.preview': { bn: 'প্রিভিউ', hi: 'प्रीव्यू', en: 'Preview' },

  // ── ধাপ ১: ইনপুট ──
  'qp.mode.photo': { bn: 'হাতের লেখা (ছবি)', hi: 'हस्तलेख (फ़ोटो)', en: 'Handwriting (Photo)' },
  'qp.mode.photo.desc': {
    bn: 'হাতে লেখা প্রশ্নের ছবি তুলে দিন — AI নিজে পড়ে নেবে',
    hi: 'हाथ से लिखे प्रश्नों की फ़ोटो दें — AI खुद पढ़ लेगा',
    en: 'Photograph handwritten questions — AI reads them for you',
  },
  'qp.mode.text': { bn: 'লেখা (টাইপ/পেস্ট)', hi: 'टेक्स्ट (टाइप/पेस्ट)', en: 'Text (Type/Paste)' },
  'qp.mode.text.desc': {
    bn: 'প্রশ্নগুলো টাইপ করুন বা কোথাও থেকে পেস্ট করুন',
    hi: 'प्रश्न टाइप करें या कहीं से पेस्ट करें',
    en: 'Type the questions or paste them from anywhere',
  },
  'qp.drop.title': { bn: 'ছবি এখানে ফেলুন বা ক্লিক করুন', hi: 'फ़ोटो यहाँ डालें या क्लिक करें', en: 'Drop a photo here or click' },
  'qp.drop.hint': { bn: 'ফোনে তোলা হাতের লেখাও চলবে · Ctrl+V পেস্ট', hi: 'फ़ोन से ली गई हस्तलेख फ़ोटो भी चलेगी · Ctrl+V पेस्ट', en: 'Phone photos of handwriting work · Ctrl+V paste' },
  'qp.drop.tips': {
    bn: 'টিপস: সোজা হয়ে স্পষ্ট আলোয় তুলুন, পুরো পাতা ফ্রেমে রাখুন, ছায়া পড়ুক না — স্পষ্ট ছবি = নির্ভুল পড়া।',
    hi: 'सुझाव: सीधा रखकर साफ़ रोशनी में लें, पूरा पेज फ्रेम में रखें, छाया न पड़े — साफ़ फ़ोटो = सही पढ़ाई।',
    en: 'Tips: shoot straight in good light, keep the whole page in frame, avoid shadows — a clear photo means accurate reading.',
  },
  'qp.transcribe': { bn: 'লেখা তুলে আনুন', hi: 'लेखा निकालें', en: 'Extract Writing' },
  'qp.transcribing': { bn: 'হাতের লেখা পড়া হচ্ছে…', hi: 'हस्तलेख पढ़ा जा रहा है…', en: 'Reading the handwriting…' },
  'qp.transcribe.done': {
    bn: 'লেখা তুলে আনা হয়েছে — দরকারলে ঠিক করে নিন',
    hi: 'लेखा निकाला गया — आवश्यक हो तो संशोधित करें',
    en: 'Text extracted — fix it if needed',
  },
  'qp.raw.label': { bn: 'প্রশ্নের কাঁচা লেখা', hi: 'प्रश्नों का कच्चा टेक्स्ट', en: 'Raw question text' },
  'qp.raw.hint': {
    bn: 'প্রতি লাইনে একটি প্রশ্ন — নম্বর (১.), বিভাগ (বিভাগ – ক), নম্বর-মান [২], ক/খ/গ/ঘ অপশন বুঝে নেবে',
    hi: 'प्रति पंक्ति एक प्रश्न — नंबर (१.), खण्ड, अंक [२], क/ख/ग/घ विकल्प समझ लेगा',
    en: 'One question per line — numbers (1.), sections, marks [2], ক/খ/গ/ঘ options are understood',
  },
  'qp.raw.check': {
    bn: 'ছবির সাথে মিলিয়ে দেখুন — কোনো শব্দ/সংখ্যা ভুল পড়া হয়ে থাকলে উপরের ঘরে ঠিক করে নিন, তারপর পরের ধাপে যান।',
    hi: 'फ़ोटो से मिलाकर जाँचें — कोई शब्द/अंक ग़लत पढ़ा गया हो तो ऊपर ठीक करें, फिर अगले चरण पर जाएँ।',
    en: 'Check against the photo — if any word/number was misread, correct it above before continuing to the next step.',
  },
  'qp.raw.ph': {
    bn: 'উদাহরণ:\n১. গোলকের আয়তনের সূত্র লেখো। [২]\n২. $\\frac{3}{4}$ + $\\frac{1}{4}$ = ?\nবিভাগ – খ\n৩. …',
    hi: 'उदाहरण:\n१. गोले का आयतन सूत्र लिखें। [२]\n२. $\\frac{3}{4}$ + $\\frac{1}{4}$ = ?\nखण्ड – क\n३. …',
    en: 'Example:\n1. Write the volume formula of a sphere. [2]\n2. $\\frac{3}{4}$ + $\\frac{1}{4}$ = ?\nSection B\n3. …',
  },
  'qp.sample': { bn: 'নমুনা', hi: 'नमूना', en: 'Sample' },
  'qp.clear': { bn: 'মুছুন', hi: 'मिटाएँ', en: 'Clear' },
  'qp.next': { bn: 'পরবর্তী', hi: 'आगे', en: 'Next' },
  'qp.back': { bn: 'পূর্ববর্তী', hi: 'पीछे', en: 'Back' },

  // ── ধাপ ২: বিস্তারিত ──
  'qp.meta.school': { bn: 'স্কুল/প্রতিষ্ঠানের নাম', hi: 'स्कूल/संस्था का नाम', en: 'School / institution name' },
  'qp.meta.school.ph': { bn: 'যেমন: আদর্শ উচ্চ বিদ্যালয়', hi: 'जैसे: आदर्श उच्च विद्यालय', en: 'e.g. Model High School' },
  'qp.meta.exam': { bn: 'পরীক্ষার নাম', hi: 'परीक्षा का नाम', en: 'Examination title' },
  'qp.meta.subject': { bn: 'বিষয়', hi: 'विषय', en: 'Subject' },
  'qp.meta.class': { bn: 'শ্রেণি', hi: 'कक्षा', en: 'Class' },
  'qp.meta.date': { bn: 'তারিখ', hi: 'दिनांक', en: 'Date' },
  'qp.meta.time': { bn: 'সময়', hi: 'समय', en: 'Time' },
  'qp.meta.marks': { bn: 'পূর্ণমান', hi: 'पूर्णांक', en: 'Full marks' },
  'qp.meta.instructions': { bn: 'সাধারণ নির্দেশনা — প্রতি লাইনে একটি', hi: 'सामान्य निर्देश — प्रति पंक्ति एक', en: 'General instructions — one per line' },
  'qp.meta.studentLine': { bn: 'শিক্ষার্থীর নাম-রোল ঘর রাখুন', hi: 'छात्र के नाम-रोल का घर रखें', en: 'Include student name-roll fields' },
  'qp.meta.today': { bn: 'আজ', hi: 'आज', en: 'Today' },

  // ── ধাপ ৩: নকশা ──
  'qp.format.title': { bn: 'নকশা বাছুন', hi: 'डिज़ाइन चुनें', en: 'Choose a design' },
  'qp.format.auto': { bn: 'স্বয়ংক্রিয়', hi: 'स्वतः', en: 'Automatic' },
  'qp.format.auto.desc': { bn: 'প্রশ্ন দেখে সেরা নকশা বাছবে', hi: 'प्रश्न देखकर सर्वोत्तम डिज़ाइन चुनेगा', en: 'Picks the best design for the questions' },
  'qp.format.classic': { bn: 'ক্লাসিক', hi: 'क्लासिक', en: 'Classic' },
  'qp.format.classic.desc': { bn: 'মাঝে হেডার — ঐতিহ্যবাহী পরীক্ষার ছাঁদ', hi: 'केंद्र में हेडर — पारंपरिक परीक्षा शैली', en: 'Centered header — traditional exam layout' },
  'qp.format.modern': { bn: 'মডার্ন', hi: 'मॉडर्न', en: 'Modern' },
  'qp.format.modern.desc': { bn: 'বাঁ-সারিত হেডার — পরিষ্কার আধুনিক ভাব', hi: 'बाईं-संरेखित हेडर — साफ़ आधुनिक रूप', en: 'Left-aligned header — clean modern look' },
  'qp.format.compact': { bn: 'কমপ্যাক্ট', hi: 'कॉम्पैक्ट', en: 'Compact' },
  'qp.format.compact.desc': { bn: 'ছোট হেডার — অল্প জায়গায় বেশি প্রশ্ন', hi: 'छोटा हेडर — कम जगह में अधिक प्रश्न', en: 'Small header — more questions per page' },
  'qp.generate': { bn: 'প্রশ্নপত্র বানান', hi: 'प्रश्नपत्र बनाएँ', en: 'Generate Paper' },
  'qp.generating': { bn: 'বানানো হচ্ছে…', hi: 'बनाया जा रहा है…', en: 'Generating…' },
  'qp.noai': { bn: 'AI ছাড়া দ্রুত সাজান', hi: 'AI के बिना तेज़ी से सजाएँ', en: 'Quick arrange without AI' },
  'qp.noai.tip': {
    bn: 'অফলাইনেও কাজ করে — নম্বর, বিভাগ, [মান] ও অপশন লাইন থেকে শনাক্ত হয়',
    hi: 'ऑफ़लाइन भी काम करता है — नंबर, खण्ड, [अंक] व विकल्प पंक्ति से पहचाने जाते हैं',
    en: 'Works offline — numbers, sections, [marks] and options detected from lines',
  },

  // ── তৈরির সময় ──
  'qp.busy.read': { bn: 'হাতের লেখা পড়া হচ্ছে…', hi: 'हस्तलेख पढ़ा जा रहा है…', en: 'Reading handwriting…' },
  'qp.busy.analyze': { bn: 'প্রশ্ন বিশ্লেষণ ও সাজানো হচ্ছে…', hi: 'प्रश्न विश्लेषण व सजाया जा रहा है…', en: 'Analyzing and arranging questions…' },
  'qp.busy.wait': { bn: 'কিছুক্ষণ সময় লাগতে পারে…', hi: 'कुछ क्षण लग सकते हैं…', en: 'This may take a moment…' },

  // ── ধাপ ৪: প্রিভিউ ──
  'qp.preview.title': { bn: 'প্রস্তুত প্রশ্নপত্র', hi: 'तैयार प्रश्नपत्र', en: 'Ready paper' },
  'qp.preview.pages': { bn: '{n} পাতা (আন্দাজ)', hi: '{n} पृष्ठ (अनुमानित)', en: '{n} page(s) (est.)' },
  'qp.preview.hint': {
    bn: 'বইয়ে বসার পর আসল পাতা-ভাগ, হেডার-ফুটার ও প্রিন্ট যা যা আছে সব কাজ করবে',
    hi: 'बुक में जाने के बाद असली पृष्ठ-विभाजन, हेडर-फ़ुटर व प्रिंट सब काम करेगा',
    en: 'After inserting into the book, real pagination, headers/footers and print all apply',
  },
  'qp.insert': { bn: 'শীটে বসান', hi: 'शीट में डालें', en: 'Insert into Sheet' },
  'qp.insert.tip': {
    bn: 'সরাসরি বইয়ের পাতায় — তারপর আসল পেজিনেশন, প্রিন্ট, PDF, DOCX সব চলে',
    hi: 'सीधे बुक के पृष्ठ में — फिर असली पेजिनेशन, प्रिंट, PDF, DOCX सब चलता है',
    en: 'Straight into the book page — then real pagination, print, PDF, DOCX all work',
  },
  'qp.download': { bn: 'প্রিন্ট-ফাইল নামান', hi: 'प्रिंट-फ़ाइल डाउनलोड करें', en: 'Download print file' },
  'qp.regen': { bn: 'আবার বানান', hi: 'फिर बनाएँ', en: 'Regenerate' },
  'qp.editback': { bn: 'লেখা বদলান', hi: 'टेक्स्ट बदलें', en: 'Edit text' },

  // ── গণনা/স্ট্যাট ──
  'qp.count.q': { bn: 'প্রশ্ন', hi: 'प्रश्न', en: 'questions' },
  'qp.count.sec': { bn: 'বিভাগ', hi: 'खण्ड', en: 'sections' },
  'qp.count.mcq': { bn: 'MCQ', hi: 'MCQ', en: 'MCQ' },

  // ── টোস্ট ও ত্রুটি ──
  'qp.toast.inserted': {
    bn: 'প্রশ্নপত্র পাতায় বসেছে — দরকারলে সাজিয়ে প্রিন্ট করুন',
    hi: 'प्रश्नपत्र पृष्ठ पर आ गया — चाहें तो सजाकर प्रिंट करें',
    en: 'Question paper inserted — format and print as needed',
  },
  'qp.toast.download': {
    bn: 'প্রিন্ট-ফাইল নামে গেছে — খুলে সরাসরি প্রিন্ট করুন',
    hi: 'प्रिंट-फ़ाइल डाउनलोड हो गई — खोलकर सीधे प्रिंट करें',
    en: 'Print file downloaded — open it and print directly',
  },
  'qp.toast.parseFail': {
    bn: 'কাঠামো শনাক্ত হয়নি — প্রতিটি প্রশ্ন আলাদা লাইনে দিন (১. ২. ৩. …)',
    hi: 'संरचना पहचानी नहीं गई — हर प्रश्न अलग पंक्ति में दें (१. २. ३. …)',
    en: 'Could not detect structure — put each question on its own line (1. 2. 3. …)',
  },
  'qp.toast.noText': { bn: 'আগে প্রশ্নের লেখা দিন', hi: 'पहले प्रश्नों का टेक्स्ट दें', en: 'Add the question text first' },
  'qp.err.title': { bn: 'প্রশ্নপত্র বানানো যায়নি', hi: 'प्रश्नपत्र नहीं बन सका', en: 'Could not generate the paper' },
  'qp.err.empty': { bn: 'AI কোনো প্রশ্ন খুঁজে পায়নি — লেখা পরীক্ষা করে আবার চেষ্টা করুন', hi: 'AI को कोई प्रश्न नहीं मिला — टेक्स्ट जाँचकर पुनः प्रयास करें', en: 'AI found no questions — check the text and retry' },
  'qp.setup.note': {
    bn: 'API Key ছাড়াও বিল্ট-ইন ডেমো মোডে কাজ করবে — নিজের কি দিলে আরও শক্তিশালী',
    hi: 'API Key के बिना भी बिल्ट-इन डेमो मोड में चलेगा — अपनी की दें तो और बेहतर',
    en: 'Works without an API key in built-in demo mode — add your own key for more power',
  },
  'qp.demo.badge': { bn: 'ডেমো', hi: 'डेमो', en: 'Demo' },
  'qp.progress.tag': { bn: 'AI কাজ করছে', hi: 'AI काम कर रहा है', en: 'AI working' },

  // ── প্রো আপগ্রেড: বোর্ড ফরম্যাট, টাইপোগ্রাফি, সেট বৈচিত্র্য ──
  'qp.format.board': {
    bn: 'বোর্ড স্টাইল',
    hi: 'बोर्ड शैली',
    en: 'Board Style',
  },
  'qp.format.board.desc': {
    bn: 'বক্স-হেডারসহ বোর্ড পরীক্ষার চিরচেনা ছাঁদ',
    hi: 'बॉक्स-हेडर वाली बोर्ड परीक्षा की जानी-पहचानी शैली',
    en: 'Classic board-exam layout with a boxed header',
  },
  'qp.typo.title': { bn: 'লেখার আকার', hi: 'टेक्स्ट आकार', en: 'Text size' },
  'qp.typo.sm': { bn: 'ছোট', hi: 'छोटा', en: 'Small' },
  'qp.typo.md': { bn: 'মাঝারি', hi: 'मध्यम', en: 'Medium' },
  'qp.typo.lg': { bn: 'বড়', hi: 'बड़ा', en: 'Large' },
  'qp.shuffle': { bn: 'সেট বৈচিত্র্য', hi: 'सेट विविधता', en: 'Set variation' },
  'qp.shuffle.desc': {
    bn: 'প্রশ্নের ক্রম এলোমেলো হবে — প্রতিবার নতুন সেট (অপশন ও নম্বর-মান অপরিবর্তিত)',
    hi: 'प्रश्नों का क्रम बदलेगा — हर बार नया सेट (विकल्प व अंक अपरिवर्तित)',
    en: 'Shuffles question order — a fresh set every time (options and marks untouched)',
  },

  // ── সাম্প্রতিক প্রশ্নপত্র ──
  'qp.hist.title': { bn: 'সাম্প্রতিক', hi: 'हाल के', en: 'Recent' },
  'qp.hist.load': { bn: 'আবার খুলুন', hi: 'फिर खोलें', en: 'Open again' },
  'qp.hist.del': { bn: 'তালিকা থেকে মুছুন', hi: 'सूची से हटाएँ', en: 'Remove from list' },

  // ── প্রিভিউ প্রো: মোট নম্বর, পৃষ্ঠা-নির্দেশক, সরাসরি প্রিন্ট ──
  'qp.stat.total': { bn: 'মোট নম্বর', hi: 'कुल अंक', en: 'total marks' },
  'qp.stat.mismatch': {
    bn: 'প্রশ্নগুলোর মোট নম্বর পূর্ণমানের সঙ্গে মিলছে না',
    hi: 'प्रश्नों के कुल अंक पूर्णांक से मेल नहीं खा रहे',
    en: "Question marks don't add up to the full marks",
  },
  'qp.guide.page': { bn: 'পৃষ্ঠা', hi: 'पृष्ठ', en: 'Page' },
  'qp.print': { bn: 'সরাসরি প্রিন্ট', hi: 'सीधे प्रिंट', en: 'Print now' },
  'qp.toast.print': {
    bn: 'প্রিন্ট উইন্ডো খুলছে — সেখান থেকেই প্রিন্ট বা PDF সেভ করুন',
    hi: 'प्रिंट विंडो खुल रही है — वहीं से प्रिंट या PDF सेव करें',
    en: 'Print window opening — print or save as PDF from there',
  },
  'qp.toast.popup': {
    bn: 'পপ-আপ ব্লক হয়েছে — প্রিন্ট-ফাইল নামিয়ে নিন',
    hi: 'पॉप-अप ब्लॉक हो गया — प्रिंट-फ़ाइल डाउनलोड करें',
    en: 'Popup blocked — the print file downloaded instead',
  },

  // ── নতুন: দুই-পাস প্রতিলিপি + হেডার স্বয়ংক্রিয়-ভরাট ──
  'qp.busy.verify': {
    bn: 'পড়া ঠিক আছে কি না ছবির সাথে মিলিয়ে দেখা হচ্ছে…',
    hi: 'पढ़ाई सही है या नहीं, फ़ोटो से मिलाया जा रहा है…',
    en: 'Double-checking the reading against the photo…',
  },
  'qp.photo.byokNote': {
    bn: 'সবচেয়ে নির্ভুল পড়ার জন্য AI সেটিংসে নিজের Gemini/OpenAI কি যোগ করুন — ডেমো মোডে হস্তলিপি-পড়া সীমিত।',
    hi: 'सबसे सही पढ़ाई के लिए AI सेटिंग्स में अपनी Gemini/OpenAI की जोड़ें — डेमो मोड में हस्तलेख-पढ़ाई सीमित है।',
    en: 'For the most accurate reading, add your own Gemini/OpenAI key in AI Settings — demo-mode handwriting reading is limited.',
  },

  // ── উন্নত সাজ-অপশন (pro layout system) ──
  'qp.layout.adv': {
    bn: 'আরও সাজ-অপশন — কলাম, পাতা, শৈলী',
    hi: 'और लेआउट विकल्प — कॉलम, पेज, शैली',
    en: 'More layout options — columns, page, styles',
  },
  'qp.layout.hide': {
    bn: 'সাজ-অপশন লুকান',
    hi: 'विकल्प छिपाएँ',
    en: 'Hide layout options',
  },
  'qp.layout.cols': { bn: 'কলাম', hi: 'कॉलम', en: 'Columns' },
  'qp.cols.auto': { bn: 'স্বয়ংক্রিয়', hi: 'स्वतः', en: 'Auto' },
  'qp.cols.one': { bn: 'এক কলাম', hi: 'एक कॉलम', en: 'One column' },
  'qp.cols.two': { bn: 'দুই কলাম', hi: 'दो कॉलम', en: 'Two columns' },
  'qp.cols.three': { bn: 'তিন কলাম', hi: 'तीन कॉलम', en: 'Three columns' },
  'qp.layout.page': { bn: 'পাতার মাপ', hi: 'पेज आकार', en: 'Page size' },
  'qp.page.a4': { bn: 'A4', hi: 'A4', en: 'A4' },
  'qp.page.letter': { bn: 'Letter', hi: 'Letter', en: 'Letter' },
  'qp.page.legal': { bn: 'Legal', hi: 'Legal', en: 'Legal' },
  'qp.page.a5': { bn: 'A5', hi: 'A5', en: 'A5' },
  'qp.layout.num': { bn: 'প্রশ্ন-নম্বরের ধরন', hi: 'प्रश्न-संख्या शैली', en: 'Question number style' },
  'qp.num.dot': { bn: '১.', hi: '१.', en: '1.' },
  'qp.num.paren': { bn: '(১)', hi: '(१)', en: '(1)' },
  'qp.num.dash': { bn: '১)', hi: '१)', en: '1)' },
  'qp.layout.marks': { bn: 'নম্বর-মানের ধরন', hi: 'अंक शैली', en: 'Marks style' },
  'qp.marks.bracket': { bn: '[২]', hi: '[२]', en: '[2]' },
  'qp.marks.paren': { bn: '(২)', hi: '(२)', en: '(2)' },
  'qp.marks.word': { bn: '২ নম্বর', hi: '२ अंक', en: '2 marks' },
  'qp.layout.sec': { bn: 'বিভাগ-শিরোনাম', hi: 'खण्ड शीर्षक', en: 'Section titles' },
  'qp.sec.center': { bn: 'মাঝে', hi: 'केंद्र में', en: 'Centered' },
  'qp.sec.box': { bn: 'বাক্সে', hi: 'बॉक्स में', en: 'Boxed' },
  'qp.sec.left': { bn: 'বাঁয়ে রেখা', hi: 'बाएँ रेखा', en: 'Left, ruled' },
  'qp.layout.mcq': { bn: 'MCQ অপশনের সাজ', hi: 'MCQ विकल्प सज्जा', en: 'MCQ options layout' },
  'qp.mcq.inline': { bn: 'এক লাইনে', hi: 'एक पंक्ति में', en: 'One line' },
  'qp.mcq.grid': { bn: '২ সারিতে', hi: '२ पंक्ति में', en: 'Two per row' },
  'qp.mcq.list': { bn: 'নিচে তালিকায়', hi: 'नीचे सूची में', en: 'Listed below' },
  'qp.layout.space': { bn: 'উত্তরের জায়গা', hi: 'उत्तर का स्थान', en: 'Answer space' },
  'qp.space.none': { bn: 'লাগবে না', hi: 'नहीं चाहिए', en: 'None' },
  'qp.space.sm': { bn: 'ছোট', hi: 'छोटा', en: 'Small' },
  'qp.space.md': { bn: 'মাঝারি', hi: 'मध्यम', en: 'Medium' },
  'qp.space.lg': { bn: 'বড়', hi: 'बड़ा', en: 'Large' },

  // ── ডকুমেন্ট-ধরন — প্রশ্নপত্র নাকি সাজেশন শিট ──
  'qp.docType.title': {
    bn: 'কী বানাতে চান?',
    hi: 'ক্যা বনানা চাহতে হ্যাঁ?',
    en: 'What would you like to create?',
  },
  'qp.docType.question': { bn: 'প্রশ্নপত্র', hi: 'প্রশ্নপত্র', en: 'Question Paper' },
  'qp.docType.question.desc': {
    bn: 'পরীক্ষার পূর্ণ প্রশ্নপত্র — হেডার, বিভাগ, নম্বর-মানসহ',
    hi: 'পरীক্ষা কা পূরা প্রশ্নপত্র — হেডার, খণ্ড, অঙ্ক সহিত',
    en: 'Full exam paper — with header, sections and marks',
  },
  'qp.docType.suggestion': { bn: 'সাজেশন শিট', hi: 'সজেশন শীট', en: 'Suggestion Sheet' },
  'qp.docType.suggestion.desc': {
    bn: 'পরীক্ষার আগের গুরুত্বপূর্ণ প্রশ্ন — অধ্যায়-ভিত্তিক, ★ চিহ্নসহ',
    hi: 'পরীক্ষা সে পহলে কে মহত্বপূর্ণ প্রশ্ন — অধ্যায়-আধারিত, ★ চিহ্ন সহিত',
    en: 'Exam-important questions — chapter-wise, with ★ marks',
  },
  'qp.raw.label.sug': { bn: 'সাজেশনের কাঁচা লেখা', hi: 'সজেশন কা কচ্চা টেক্সট', en: 'Raw suggestion text' },
  'qp.raw.hint.sug': {
    bn: 'প্রতি লাইনে একটি প্রশ্ন — অধ্যায় (অধ্যায় ১), নম্বর, ★/★★ গুরুত্ব, MCQ অপশন বুঝে নেবে',
    hi: 'প্রতি পংক্তি এক প্রশ্ন — অধ্যায়, নম্বর, ★/★★ মহত্ব, MCQ বিকল্প সমঝ লেগা',
    en: 'One question per line — chapters, numbers, ★/★★ importance and MCQ options are understood',
  },
  'qp.raw.ph.sug': {
    bn: 'উদাহরণ:\nঅধ্যায় ১ — ভগ্নাংশ [গুরুত্বপূর্ণ]\n★ ১. প্রশ্ন…\n★★ ২. প্রশ্ন…',
    hi: 'উদাহরণ:\nঅধ্যায় ১ — ভিন্ন [মহত্বপূর্ণ]\n★ ১. প্রশ্ন…\n★★ ২. প্রশ্ন…',
    en: 'Example:\nChapter 1 — Fractions [important]\n★ 1. Question…\n★★ 2. Question…',
  },
  'qp.meta.teacher': { bn: 'শিক্ষকের নাম (ঐচ্ছিক)', hi: 'শিক্ষক কা নাম (বৈকল্পিক)', en: 'Teacher name (optional)' },
  'qp.generate.sug': { bn: 'সাজেশন বানান', hi: 'সজেশন বনাএঁ', en: 'Generate Suggestion' },
  'qp.busy.analyze.sug': {
    bn: 'সাজেশন বিশ্লেষণ ও সাজানো হচ্ছে…',
    hi: 'সজেশন বিশ্লেষণ ব সজায়া জা রহা হ্যাঁ…',
    en: 'Analyzing and arranging the suggestion…',
  },
  'qp.preview.title.sug': { bn: 'প্রস্তুত সাজেশন শিট', hi: 'তৈয়ার সজেশন শীট', en: 'Ready suggestion sheet' },
  'qp.toast.inserted.sug': {
    bn: 'সাজেশন শিট পাতায় বসেছে — দরকারলে সাজিয়ে প্রিন্ট করুন',
    hi: 'সজেশন শীট পৃষ্ঠে পর আ গেসে — চাহেঁ তো সাজাকর প্রিন্ট করেঁ',
    en: 'Suggestion sheet inserted — format and print as needed',
  },
  'qp.count.star': { bn: '★ চিহ্নিত', hi: '★ চিহ্নিত', en: '★ marked' },

} as const;
