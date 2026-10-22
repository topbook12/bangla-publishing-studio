/**
 * থিসিস স্টুডিও ইঞ্জিন — প্রফেশনাল থিসিস/গবেষণাপত্র নির্মাণ (Thesis Engine)
 * ─────────────────────────────────────────────────────────────────────────────
 * শিক্ষক/শিক্ষার্থী থিসিস লেখার সময় গোছানো শুরু পান না — প্রতিষ্ঠানভেদে দাবি:
 *   শিরোনাম পাতা → ঘোষণাপত্র → সনদপত্র → কৃতজ্ঞতা → সারসংক্ষেপ → সূচিপত্র →
 *   চিত্র/টেবিল তালিকা → সংক্ষেপ-তালিকা → অধ্যায়সমূহ (নম্বরযুক্ত সেকশন) →
 *   তথ্যসূত্র → পরিশিষ্ট। এই ইঞ্জিন এক ক্লিকে পুরো কাঠামো এডিটেবল পাতা হিসেবে
 *   বানিয়ে দেয় + স্ট্যান্ডার্ড পৃষ্ঠা-নম্বর স্কিম (প্রারম্ভিক = রোমান, মূল লেখা = ১ থেকে)।
 *
 * সাথে সূত্র-ইঞ্জিন: APA 7 / MLA 9 / Harvard / Chicago (author-date) / IEEE —
 * বই, জার্নাল, ওয়েবসাইট, থিসিস, পত্রিকা, রিপোর্ট — বাংলা ও ইংরেজি দুটোতেই।
 */

import { tocInsertHtml } from './toc';
import { toBanglaNumber } from './bangla';

/** বাংলা থিসিসে সংখ্যাও বাংলা (১, ১.১) — ইংরেজিতে 1, 1.1 */
function num(n: number | string, lang: ThesisLang): string {
  return lang === 'en' ? String(n) : toBanglaNumber(n);
}

// ─── ধরন ───

export type ThesisLang = 'bn' | 'en';
export type ThesisLevel = 'honours' | 'masters' | 'mphil' | 'phd';
export type ThesisDiscipline = 'science' | 'arts' | 'business';

export interface ThesisMeta {
  lang: ThesisLang;
  level: ThesisLevel;
  discipline: ThesisDiscipline;
  title: string;
  university: string;
  department: string;
  author: string;
  roll: string;
  session: string;
  supervisor: string;
  degreeName: string;
  /** জমার তারিখ — শিরোনাম পাতার নিচে (যেমন: মার্চ ২০২৫ / March 2025) */
  date: string;
  /** উৎসর্গপত্রের লেখা (খালি হলে স্ট্যান্ডার্ড স্থানধারক) */
  dedicationText: string;
}

export interface ThesisOptions {
  dedication: boolean;
  declaration: boolean;
  certificate: boolean;
  acknowledgment: boolean;
  abstract: boolean;
  toc: boolean;
  lists: boolean;
  abbreviations: boolean;
  references: boolean;
  appendix: boolean;
  /** স্ট্যান্ডার্ড থিসিস ফরম্যাট প্রয়োগ (মার্জিন/ফন্ট/স্পেসিং) */
  applyFormat: boolean;
}

export const DEFAULT_THESIS_OPTIONS: ThesisOptions = {
  dedication: false,
  declaration: true,
  certificate: true,
  acknowledgment: true,
  abstract: true,
  toc: true,
  lists: true,
  abbreviations: true,
  references: true,
  appendix: true,
  applyFormat: true,
};

/** একটি জেনারেট-হওয়া পাতা */
export interface ThesisPage {
  html: string;
  noChrome: boolean;
  /** পৃষ্ঠা-নম্বর এখান থেকে নতুন সেকশন (from, format) */
  numberRestart?: { from: number; format: 'roman' | 'bangla' | 'english' | 'hindi' };
}

// ─── ভাষা-নির্ভর লেবেল ───

interface L10n {
  thesisOf: string; // শিরোনাম পাতার ডকুমেন্ট-ধরন
  submitted: string;
  by: string;
  under: string;
  supervisorLabel: string;
  rollLabel: string;
  sessionLabel: string;
  deptLabel: string;
  declaration: string;
  declarationBody: string[];
  declSign: string;
  declDate: string;
  certificate: string;
  certificateBody: string[];
  certSign: string;
  acknowledgment: string;
  ackBody: string[];
  abstract: string;
  abstractBody: string;
  keywords: string;
  toc: string;
  figures: string;
  tables: string;
  listsNote: string;
  abbreviations: string;
  abbrHead: string[];
  abbrRows: string[][];
  chapter: string; // "অধ্যায়" / "Chapter"
  references: string;
  referencesNote: string;
  referenceSample: string;
  appendix: string;
  appendixNote: string;
  figLabel: string; // "চিত্র" / "Figure"
  tblLabel: string; // "টেবিল" / "Table"
  writeHere: string;
  dedication: string;
  dedicationDefault: string;
  dateLabel: string;
  sourceLabel: string;
}

const BN: L10n = {
  thesisOf: 'থিসিস',
  submitted: 'এই থিসিসটি নিম্নলিখিত ডিগ্রির আংশিক সন্তুষ্টির জন্য পেশ করা হলো',
  by: 'জমা দিয়েছেন',
  under: 'তত্ত্বাবধানে',
  supervisorLabel: 'সুপারভাইজার',
  rollLabel: 'রোল নং',
  sessionLabel: 'শিক্ষাবর্ষ',
  deptLabel: 'বিভাগ',
  declaration: 'ঘোষণাপত্র',
  declarationBody: [
    'আমি এই মর্মে ঘোষণা করছি যে এই থিসিসে বর্ণিত কাজটি আমি নিজে সম্পন্ন করেছি এবং এটি আমার নিজস্ব গবেষণার ফল। এই থিসিসের কোনো অংশই অন্য কোনো ডিগ্রি বা প্রশংসাপত্র লাভের উদ্দেশ্যে এই বিশ্ববিদ্যালয় বা অন্য কোনো প্রতিষ্ঠানে আগে পেশ করা হয়নি।',
    'এই থিসিসে উদ্ধৃত সকল তথ্যসূত্রের যথাযথ স্বীকৃতি দেওয়া হয়েছে। যেকোনো ভুলত্রুটি বা বেমানানতা সম্পূর্ণভাবে আমার নিজের।',
  ],
  declSign: 'গবেষকের স্বাক্ষর',
  declDate: 'তারিখ',
  certificate: 'সনদপত্র',
  certificateBody: [
    'এই মর্মে প্রত্যয়িত করা যাচ্ছে যে, এই থিসিসের শিরোনামে বর্ণিত গবেষণা কার্যটি আমার তত্ত্বাবধানে সম্পন্ন হয়েছে এবং এটি সংশ্লিষ্ট ডিগ্রির শর্তসমূহ পূরণ করেছে বলে আমি মনে করি। এই থিসিসের কোনো অংশ অন্য কোনো ডিগ্রির জন্য পূর্বে পেশ করা হয়নি।',
  ],
  certSign: 'সুপারভাইজারের স্বাক্ষর',
  acknowledgment: 'কৃতজ্ঞতা স্বীকার',
  ackBody: [
    'প্রথমেই মহান সৃষ্টিকর্তার অসীম অনুগ্রহের জন্য কৃতজ্ঞতা জানাই, যাঁর রহমতেই এই গবেষণা সম্পন্ন করতে আমি সক্ষম হয়েছি।',
    'প্রাণঢালা কৃতজ্ঞতা ও ধন্যবাদ জানাই আমার সম্মানিত সুপারভাইজার মহোদয়কে, যাঁর মূল্যবান পরামর্শ, নিরলস তত্ত্বাবধান ও সহযোগিতা ছাড়া এই গবেষণাটি সম্পন্ন হতো না।',
    'এছাড়াও গবেষণার বিভিন্ন পর্যায়ে সরাসরি ও পরোক্ষভাবে সহযোগিতাকারী বিভাগের শিক্ষকবৃন্দ, সহপাঠী ও পরিবারের সদস্যদের আন্তরিক ধন্যবাদ জানাই।',
  ],
  abstract: 'সারসংক্ষেপ',
  abstractBody: 'এখানে গবেষণার সংক্ষিপ্ত বিবরণ লিখুন — গবেষণার উদ্দেশ্য, পদ্ধতি, প্রধান ফলাফল ও উপসংহার একসাথে (২৫০–৩০০ শব্দের মধ্যে)। সারসংক্ষেপ থিসিসের সবচেয়ে বেশি পঠিত অংশ — প্রতিটি বাক্যে যত্ন নিন।',
  keywords: 'কীওয়ার্ড',
  toc: 'সূচিপত্র',
  figures: 'চিত্রের তালিকা',
  tables: 'টেবিলের তালিকা',
  listsNote: 'থিসিস লেখার সময় প্রতিটি চিত্র/টেবিল যোগ করলে এই তালিকায় একটি করে লাইন যোগ করুন — ক্রম, শিরোনাম ও পৃষ্ঠা-নম্বরসহ।',
  abbreviations: 'সংক্ষেপ ও প্রতীকের তালিকা',
  abbrHead: ['সংক্ষেপ', 'পূর্ণরূপ'],
  abbrRows: [
    ['ইউজিসি', 'বিশ্ববিদ্যালয় মঞ্জুরি কমিশন'],
    ['এসডিজি', 'টেকসই উন্নয়ন লক্ষ্যমাত্রা'],
    ['', ''],
    ['', ''],
  ],
  chapter: 'অধ্যায়',
  references: 'তথ্যসূত্র',
  referencesNote: 'এক স্টাইলে (APA/MLA/Harvard/Chicago/IEEE) সব সূত্র — বর্ণানুক্রমে সাজান। উপরের "সূত্র" ট্যাবে তথ্য দিলে ঝামেলাহীনভাবে সঠিক ফরম্যাটের এন্ট্রি তৈরি হয়ে এখানে বসাতে পারবেন।',
  referenceSample: 'রহমান, আ. (২০২১)। গবেষণা পদ্ধতি: নীতি ও প্রয়োগ। ঢাকা: প্রকাশনা সংস্থা।',
  appendix: 'পরিশিষ্ট ক',
  appendixNote: 'পরিশিষ্টে রাখুন — প্রশ্নপত্র (প্রশ্নাবলী), সাক্ষাৎকারের নমুনা, বিস্তারিত উপাত্ত টেবিল, কোড, অনুমতিপত্র। মূল লেখায় উল্লেখ করুন: (পরিশিষ্ট ক দেখুন)।',
  figLabel: 'চিত্র',
  tblLabel: 'টেবিল',
  writeHere: 'এখানে লিখুন…',
  dedication: 'উৎসর্গপত্র',
  dedicationDefault: 'যাঁদের ভালোবাসা, ত্যাগ ও দোয়ায় আমি আজকের পথ পেয়েছি —\nমা-বাবাকে',
  dateLabel: 'জমার তারিখ',
  sourceLabel: 'উৎস',
};

const EN: L10n = {
  thesisOf: 'Thesis',
  submitted: 'A thesis submitted in partial fulfillment of the requirements for the degree of',
  by: 'Submitted by',
  under: 'Under the supervision of',
  supervisorLabel: 'Supervisor',
  rollLabel: 'Roll No.',
  sessionLabel: 'Session',
  deptLabel: 'Department of',
  declaration: 'Declaration',
  declarationBody: [
    'I hereby declare that the work presented in this thesis is my own, carried out under the stated supervision, and has not been submitted previously for any degree or diploma at this university or any other institution.',
    'All sources of information used in this thesis have been duly acknowledged. Any errors or omissions are entirely my own responsibility.',
  ],
  declSign: "Researcher's signature",
  declDate: 'Date',
  certificate: 'Certificate',
  certificateBody: [
    'This is to certify that the research work entitled in this thesis has been carried out under my supervision and guidance, and in my opinion it fulfils the requirements for the award of the degree mentioned on the title page. No part of this thesis has been submitted elsewhere for any other degree.',
  ],
  certSign: "Supervisor's signature",
  acknowledgment: 'Acknowledgements',
  ackBody: [
    'All praise is due to the Almighty for granting me the strength and perseverance to complete this research.',
    'I would like to express my deepest gratitude to my honourable supervisor for the invaluable guidance, continuous support and encouragement throughout this research.',
    'I am also grateful to the faculty members of the department, my fellow researchers and my family for their direct and indirect support at every stage of this work.',
  ],
  abstract: 'Abstract',
  abstractBody: 'Write a concise overview of your research here — purpose, methodology, key findings and conclusion within 250–300 words. The abstract is the most-read part of a thesis; craft every sentence carefully.',
  keywords: 'Keywords',
  toc: 'Table of Contents',
  figures: 'List of Figures',
  tables: 'List of Tables',
  listsNote: 'As you add figures/tables while writing, add one line here for each — with number, caption and page.',
  abbreviations: 'List of Abbreviations',
  abbrHead: ['Abbreviation', 'Full form'],
  abbrRows: [
    ['UGC', 'University Grants Commission'],
    ['SDG', 'Sustainable Development Goal'],
    ['', ''],
    ['', ''],
  ],
  chapter: 'Chapter',
  references: 'References',
  referencesNote: 'Use ONE style (APA/MLA/Harvard/Chicago/IEEE) consistently, sorted alphabetically. The Citations tab above generates correctly formatted entries for you.',
  referenceSample: 'Rahman, A. (2021). Research methodology: Principles and practice. Dhaka: Prakashana.',
  appendix: 'Appendix A',
  appendixNote: 'Put in the appendix — questionnaire, interview schedule, detailed data tables, code, permissions. Refer to it in the text as: (see Appendix A).',
  figLabel: 'Figure',
  tblLabel: 'Table',
  writeHere: 'Write here…',
  dedication: 'Dedication',
  dedicationDefault: 'To my parents —\nwhose love, sacrifice and prayers lit every step of this journey',
  dateLabel: 'Date of submission',
  sourceLabel: 'Source',
};

const L = (lang: ThesisLang): L10n => (lang === 'en' ? EN : BN);

// ─── অধ্যায়-কাঠামো (শৃঙ্খলাভেদে) ───

export interface ThesisChapter {
  num: number;
  title: string;
  sections: Array<{ title: string; hint: string }>;
}

function chaptersFor(meta: ThesisMeta): ThesisChapter[] {
  const Lx = L(meta.lang);
  const en = meta.lang === 'en';
  if (meta.discipline === 'science') {
    return [
      {
        num: 1,
        title: en ? 'Introduction' : 'ভূমিকা',
        sections: en
          ? [
              { title: 'Background of the Study', hint: 'Introduce the broad field, then narrow to your topic. End with why it matters now.' },
              { title: 'Statement of the Problem', hint: 'State the exact research problem and the gap in existing knowledge.' },
              { title: 'Objectives of the Study', hint: 'General objective first, then 3–5 specific, measurable objectives.' },
              { title: 'Research Questions / Hypotheses', hint: 'List questions; state null/alternative hypotheses if quantitative.' },
              { title: 'Scope and Limitations', hint: 'What the study covers, and what it deliberately does not.' },
              { title: 'Operational Definitions', hint: 'Define key terms as used in THIS study.' },
            ]
          : [
              { title: 'গবেষণার পটভূমি', hint: 'ব্যাপক ক্ষেত্র থেকে শুরু করে আপনার বিষয়ে এসে থামুন; শেষে বলুন কেন এটি এখন গুরুত্বপূর্ণ।' },
              { title: 'সমস্যা নির্ধারণ', hint: 'নির্দিষ্ট গবেষণা-সমস্যা ও বিদ্যমান জ্ঞানের ঘাটতি স্পষ্ট করে লিখুন।' },
              { title: 'গবেষণার উদ্দেশ্য', hint: 'আগে সাধারণ উদ্দেশ্য, এরপর ৩–৫টি নির্দিষ্ট, মাপযোগ্য উদ্দেশ্য।' },
              { title: 'গবেষণা প্রশ্ন / অনুমান', hint: 'প্রশ্নগুলোর তালিকা দিন; পরিমাণগত গবেষণা হলে শূন্য/বিকল্প অনুমান লিখুন।' },
              { title: 'পরিসর ও সীমাবদ্ধতা', hint: 'গবেষণা কী কভার করে এবং ইচ্ছাকৃতভাবে কী করে না — দুটোই লিখুন।' },
              { title: 'সংজ্ঞা', hint: 'এই গবেষণায় ব্যবহৃত মূল শব্দগুলোর কার্যকর সংজ্ঞা দিন।' },
            ],
      },
      {
        num: 2,
        title: en ? 'Literature Review' : 'সাহিত্য পর্যালোচনা',
        sections: en
          ? [
              { title: 'Theoretical Framework', hint: 'The theories your study rests on, with citations.' },
              { title: 'Review of Related Studies', hint: 'Theme-wise (not list-wise) synthesis: what is known, what is contested, what is missing.' },
              { title: 'Research Gap', hint: 'Explicitly state the gap your study fills.' },
            ]
          : [
              { title: 'তাত্ত্বিক কাঠামো', hint: 'আপনার গবেষণার ভিত্তি তত্ত্বগুলো — সূত্র-উদ্ধৃতিসহ।' },
              { title: 'সংশ্লিষ্ট গবেষণার পর্যালোচনা', hint: 'তালিকা নয়, থিম-ভিত্তিক সংশ্লেষণ লিখুন: কী জানা, কী বিতর্কিত, কী অজানা।' },
              { title: 'গবেষণার ঘাটতি', hint: 'আপনার গবেষণা যে ঘাটতি পূরণ করছে তা স্পষ্টভাবে বলুন।' },
            ],
      },
      {
        num: 3,
        title: en ? 'Materials and Methods' : 'উপকরণ ও পদ্ধতি',
        sections: en
          ? [
              { title: 'Research Design', hint: 'Experimental/observational design and why it suits the question.' },
              { title: 'Materials / Population and Sample', hint: 'Sampling technique, size calculation, inclusion/exclusion criteria.' },
              { title: 'Data Collection Procedures', hint: 'Instruments, protocols, quality control.' },
              { title: 'Data Analysis', hint: 'Statistical tests/software with justification; significance level.' },
              { title: 'Ethical Considerations', hint: 'Consent, approval committee reference, data protection.' },
            ]
          : [
              { title: 'গবেষণা নকশা', hint: 'পরীক্ষণ/পর্যবেক্ষণ নকশা এবং প্রশ্নের সাথে কেন উপযুক্ত।' },
              { title: 'উপকরণ / জনসংখ্যা ও নমুনা', hint: 'নমুনায়ন কৌশল, আকার-গণনা, অন্তর্ভুক্তি/বর্জন মানদণ্ড।' },
              { title: 'উপাত্ত সংগ্রহ পদ্ধতি', hint: 'যন্ত্র/প্রোটোকল, মান-নিয়ন্ত্রণ।' },
              { title: 'উপাত্ত বিশ্লেষণ', hint: 'কোন পরিসংখ্যান-পরীক্ষা/সফটওয়্যার ও কেন; তাৎপর্য-স্তর।' },
              { title: 'নৈতিক বিবেচনা', hint: 'সম্মতিপত্র, অনুমোদন-কমিটির রেফারেন্স, উপাত্ত-সুরক্ষা।' },
            ],
      },
      {
        num: 4,
        title: en ? 'Results and Discussion' : 'ফলাফল ও আলোচনা',
        sections: en
          ? [
              { title: 'Presentation of Results', hint: 'Tables/figures first, then the trend in words — no interpretation yet.' },
              { title: 'Discussion of Findings', hint: 'Compare each finding with the literature from Chapter 2.' },
              { title: 'Summary of Findings', hint: 'The 3–5 headline findings in one place.' },
            ]
          : [
              { title: 'ফলাফল উপস্থাপনা', hint: 'আগে টেবিল/চিত্র, পরে শব্দে ধারা বর্ণনা — ব্যাখ্যা এখনো নয়।' },
              { title: 'ফলাফলের আলোচনা', hint: 'প্রতিটি ফলাফল অধ্যায় ২-এর সাহিত্যের সাথে মিলিয়ে আলোচনা করুন।' },
              { title: 'ফলাফলের সারসংক্ষেপ', hint: '৩–৫টি প্রধান ফলাফল এক জায়গায়।' },
            ],
      },
      {
        num: 5,
        title: en ? 'Conclusion and Recommendations' : 'উপসংহার ও সুপারিশ',
        sections: en
          ? [
              { title: 'Conclusion', hint: 'Answer the research questions directly — no new data here.' },
              { title: 'Recommendations', hint: 'Practical recommendations flowing from the findings.' },
              { title: 'Future Research', hint: 'What remains open; how the next study should differ.' },
            ]
          : [
              { title: 'উপসংহার', hint: 'গবেষণা-প্রশ্নগুলোর সরাসরি উত্তর দিন — নতুন উপাত্ত নয়।' },
              { title: 'সুপারিশ', hint: 'ফলাফল থেকে আসা ব্যবহারিক সুপারিশ।' },
              { title: 'ভবিষ্যৎ গবেষণা', hint: 'কী খোলা রইল; পরের গবেষণা কীভাবে ভিন্ন হবে।' },
            ],
      },
    ];
  }
  if (meta.discipline === 'business') {
    return [
      chaptersFor({ ...meta, discipline: 'science' })[0],
      chaptersFor({ ...meta, discipline: 'science' })[1],
      {
        num: 3,
        title: en ? 'Research Methodology' : 'গবেষণা পদ্ধতি',
        sections: en
          ? [
              { title: 'Research Design', hint: 'Descriptive / causal / mixed — and justification.' },
              { title: 'Population, Sample and Sampling', hint: 'Frame, technique, size, response rate plan.' },
              { title: 'Instrumentation', hint: 'Questionnaire design, scales (Likert etc.), validity & reliability (Cronbach\'s α).' },
              { title: 'Data Analysis Plan', hint: 'Software (SPSS/Stata/R), tests (regression, ANOVA…), model specification.' },
            ]
          : [
              { title: 'গবেষণা নকশা', hint: 'বর্ণনামূলক / কারণ-নির্ণয় / মিশ্র — এবং যুক্তি।' },
              { title: 'জনসংখ্যা, নমুনা ও নমুনায়ন', hint: 'ফ্রেম, কৌশল, আকার, সাড়া-হার পরিকল্পনা।' },
              { title: 'যন্ত্রপাতি', hint: 'প্রশ্নাবলী নকশা, স্কেল (লিকার্ট ইত্যাদি), বৈধতা ও নির্ভরযোগ্যতা (ক্রনবাখ-আলফা)।' },
              { title: 'উপাত্ত বিশ্লেষণ পরিকল্পনা', hint: 'সফটওয়্যার (SPSS/Stata/R), পরীক্ষা (রিগ্রেশন, ANOVA…), মডেল-স্পেসিফিকেশন।' },
            ],
      },
      {
        num: 4,
        title: en ? 'Analysis and Findings' : 'বিশ্লেষণ ও ফলাফল',
        sections: en
          ? [
              { title: 'Descriptive Statistics', hint: 'Demographics and variable summaries with tables.' },
              { title: 'Hypothesis Testing / Model Results', hint: 'Each hypothesis: decision + evidence.' },
              { title: 'Discussion', hint: 'Link findings to theory and prior studies.' },
            ]
          : [
              { title: 'বর্ণনামূলক পরিসংখ্যান', hint: 'জনমিতি ও চলক-সারসংক্ষেপ — টেবিলসহ।' },
              { title: 'অনুমান পরীক্ষা / মডেল-ফলাফল', hint: 'প্রতিটি অনুমান: সিদ্ধান্ত + প্রমাণ।' },
              { title: 'আলোচনা', hint: 'ফলাফলকে তত্ত্ব ও পূর্ববর্তী গবেষণার সাথে যুক্ত করুন।' },
            ],
      },
      {
        num: 5,
        title: en ? 'Conclusions and Recommendations' : 'উপসংহার ও সুপারিশ',
        sections: en
          ? [
              { title: 'Conclusions', hint: 'Concise answers to the objectives.' },
              { title: 'Managerial / Policy Recommendations', hint: 'Who should do what, based on which finding.' },
              { title: 'Limitations and Future Research', hint: 'Honest limits; next-study design.' },
            ]
          : [
              { title: 'উপসংহার', hint: 'উদ্দেশ্যগুলোর সংক্ষিপ্ত উত্তর।' },
              { title: 'ব্যবস্থাপনা / নীতি-সুপারিশ', hint: 'কোন ফলাফলের ভিত্তিতে কে কী করবে।' },
              { title: 'সীমাবদ্ধতা ও ভবিষ্যৎ গবেষণা', hint: 'সৎ সীমাবদ্ধতা; পরের গবেষণার নকশা।' },
            ],
      },
    ];
  }
  // কলা / মানবিক — বিশ্লেষণ-ভিত্তিক
  return [
    chaptersFor({ ...meta, discipline: 'science' })[0],
    chaptersFor({ ...meta, discipline: 'science' })[1],
    {
      num: 3,
      title: en ? 'Textual / Field Analysis' : 'পাঠ ও ক্ষেত্র-বিশ্লেষণ',
      sections: en
        ? [
            { title: 'Primary Material', hint: 'Introduce the texts/field/context you analyse.' },
            { title: 'Analysis I', hint: 'First analytical strand with evidence.' },
            { title: 'Analysis II', hint: 'Second strand; use subsections as needed.' },
          ]
        : [
            { title: 'প্রাথমিক উপাত্ত', hint: 'যে পাঠ/ক্ষেত্র/প্রেক্ষাপট বিশ্লেষণ করছেন তা পরিচিত করুন।' },
            { title: 'বিশ্লেষণ ১', hint: 'প্রথম বিশ্লেষণ-ধারা — প্রমাণসহ।' },
            { title: 'বিশ্লেষণ ২', hint: 'দ্বিতীয় ধারা; প্রয়োজনে উপ-বিভাগ যোগ করুন।' },
          ],
    },
    {
      num: 4,
      title: en ? 'Discussion' : 'আলোচনা',
      sections: en
        ? [
            { title: 'Synthesis of Findings', hint: 'Bring the strands together into one argument.' },
            { title: 'Dialogue with the Literature', hint: 'Where your reading agrees/differs with scholars.' },
          ]
        : [
            { title: 'ফলাফলের সমন্বয়', hint: 'ধারাগুলো একত্র করে একটি যুক্তিতে আনুন।' },
            { title: 'সাহিত্যের সাথে সংলাপ', hint: 'কোথায় আপনার পাঠ পণ্ডিতদের সাথে মিলে/বেমেল।' },
          ],
    },
    chaptersFor({ ...meta, discipline: 'science' })[4],
  ];
}

// ─── লেভেল-নির্ভর ডিগ্রি-লাইন ───

function degreeLine(meta: ThesisMeta): string {
  const en = meta.lang === 'en';
  const deg = meta.degreeName.trim();
  if (deg) return deg;
  const map: Record<ThesisLevel, [string, string]> = {
    honours: ['সম্মান (অনার্স) ডিগ্রি', 'Bachelor (Honours) degree'],
    masters: ['মাস্টার্স ডিগ্রি', 'Master\u2019s degree'],
    mphil: ['এমফিল ডিগ্রি', 'MPhil degree'],
    phd: ['পিএইচডি ডিগ্রি', 'PhD degree'],
  };
  return map[meta.level][en ? 1 : 0];
}

function docKind(meta: ThesisMeta): string {
  const Lx = L(meta.lang);
  if (meta.level === 'phd' || meta.level === 'mphil') {
    return meta.lang === 'en' ? 'Thesis / Dissertation' : 'থিসিস / গবেষণা প্রবন্ধ';
  }
  return Lx.thesisOf;
}

// ─── HTML সহায়ক ───

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * থিসিস-ডিজাইন টোকেন — রয়্যাল মেরুন + পুরনো সোনা (ক্রিম-কাগজের fancy-divider
 * ফ্লারিশের মেরুন-রক্তের সাথে হুবহু এক; বিশ্ববিদ্যালয়-ক্রেস্টের ক্লাসিক রং)।
 * সব রং span-মার্কে বসে — এডিটর পার্সার p/h1-এর ইনলাইন color ফেলে দেয়,
 * span-style টিকে থাকে; তাই প্রতিটি রঙিন লেখা span-এ মোড়ানো।
 */
export const THESIS_ACCENT = '#7f1d1d';
export const THESIS_GOLD = '#a16207';
const THESIS_SOFT = '#78716c';

const spanAcc = (inner: string) => `<span style="color:${THESIS_ACCENT};">${inner}</span>`;
const spanGold = (inner: string) => `<span style="color:${THESIS_GOLD};">${inner}</span>`;
const spanSoft = (inner: string) => `<span style="color:${THESIS_SOFT};">${inner}</span>`;

/** কেন্দ্রীভূত প্যারা — সরাসরি ইনপুট কেবল অভ্যন্তরীণ/esc-কৃত স্ট্রিং (esc আবার চালায় না) */
const C = (s: string, extra = '') => `<p style="text-align:center;${extra}">${s}</p>`;

/** আলংকারিক রুল — এডিটরের fancy-divider নোড (single/double/flourish রেন্ডার হয়) */
const rule = (style: 'single' | 'double' | 'flourish' = 'double') =>
  `<hr class="fancy-divider" data-style="${style}">`;

/** সামনের-অংশের শিরোনাম — বর্ণ-ফাঁকসহ কেন্দ্র-শিরোনাম + নিচে সরু রুল (প্রিমিয়াম ফ্রন্ট-ম্যাটার) */
function fmHeading(title: string): string {
  return [
    `<h1 style="text-align:center; letter-spacing:2.5px; margin-bottom:0.15em;">${spanAcc(`<strong>${esc(title)}</strong>`)}</h1>`,
    rule('single'),
  ].join('');
}

/** সুপারিশ/নোট-ধাঁচের নরম তির্যক পঙক্তি — span-রং (p-রং এডিটরে পড়ে যায়) */
function softItalic(text: string): string {
  return `<p style="margin:0.4em 0;"><em>${spanSoft(esc(text))}</em></p>`;
}

function hintPara(hint: string): string {
  return `<p style="text-align:center; margin:0.1em 0 0.9em;"><em>${spanSoft(`— ${esc(hint)} —`)}</em></p>`;
}

function sectionHeading(num_: number, secNum: number, title: string, lang: ThesisLang): string {
  return `<h2 style="margin-top:0.7em;"><span style="color:${THESIS_ACCENT};">${esc(num(num_, lang) + '.' + num(secNum, lang))}</span> ${esc(title)}</h2>`;
}

// ─── পাতা-নির্মাতা ───

/**
 * শিরোনাম-পাতার দুই-স্তম্ভ মেটা-টেবিল (বাঁ: গবেষক, ডান: সুপারভাইজার)।
 * এডিটর-চুক্তি: সেলের style-padding পার্সার ফেলে দেয়, তাই মাঝে ফাঁকা
 * স্পেসার-সেল (১০%) — colwidth অ্যাট্রিবিউটই স্তম্ভ-প্রস্থের প্রকৃত বাহক।
 */
function titleMetaTable(left: string[], right: string[]): string {
  const cell = (rows: string[]) =>
    `<td colwidth="270" data-border="none" style="border:none; width:45%; vertical-align:top">` +
    rows.map((r) => `<p style="text-align:center; margin:0.1em 0; font-size:1.05em;">${r}</p>`).join('') +
    `</td>`;
  const gap = `<td colwidth="60" data-border="none" style="border:none; width:10%"></td>`;
  return `<table style="width:100%; margin-top:0.6em;"><tr>${cell(left)}${gap}${cell(right)}</tr></table>`;
}

/** উল্লম্ব স্পেসার — শিরোনাম-পাতার বিষয়বস্তু পুরো A4-উচ্চতায় ছড়িয়ে দিতে */
const vsp = (n: number) => Array.from({ length: n }, () => '<p style="text-align:center"></p>').join('');

function titlePage(meta: ThesisMeta): ThesisPage {
  const Lx = L(meta.lang);
  const en = meta.lang === 'en';
  const parts: string[] = [];
  // শীর্ষ সোনালি আলংকার — ক্রেস্ট-শৈলীর উদ্বোধন
  parts.push(C(`<span style="color:${THESIS_GOLD}; letter-spacing:5px; font-size:0.95em;">❦ ✦ ❦</span>`, 'margin:0.35em 0 0.3em;'));
  if (meta.university.trim()) {
    parts.push(
      `<h1 style="text-align:center; letter-spacing:1px; margin:0.2em 0 0.1em;">` +
      spanAcc(esc(meta.university.trim())) + `</h1>`,
    );
  }
  if (meta.department.trim()) {
    parts.push(C(`<span style="font-size:1.02em; letter-spacing:0.5px;">${esc(Lx.deptLabel)} ${esc(meta.department.trim())}</span>`, 'margin:0.1em 0;'));
  }
  parts.push(rule('flourish'));
  // ডকুমেন্ট-ধরন — বর্ণ-ফাঁকসহ ছোট সোনালি লেবেল
  parts.push(
    C(`<span style="letter-spacing:2.5px; font-size:0.85em; color:${THESIS_GOLD};"><strong>${esc(en ? docKind(meta).toUpperCase() : docKind(meta))}</strong></span>`, 'margin:0.8em 0 0.2em;'),
  );
  // মূল শিরোনাম
  parts.push(
    `<h1 style="text-align:center; line-height:1.5; margin:0.15em 0.6em 0.3em;">` +
    `<strong>${esc(meta.title || (en ? 'Thesis Title Goes Here' : 'থিসিসের শিরোনাম এখানে'))}</strong></h1>`,
  );
  parts.push(C(`<em>${spanSoft(esc(Lx.submitted))}</em>`, 'margin:0.4em 0 0.1em;'));
  parts.push(C(`<strong><span style="color:${THESIS_ACCENT}; font-size:1.08em;">${esc(degreeLine(meta))}</span></strong>`, 'margin:0.1em 0;'));
  parts.push(rule('double'));
  // গবেষক ও সুপারভাইজার — দুই-স্তম্ভ ভারসাম্য
  const leftCol: string[] = [];
  if (meta.author.trim()) leftCol.push(`<strong>${esc(meta.author.trim())}</strong>`);
  if (meta.roll.trim()) leftCol.push(spanSoft(esc(`${Lx.rollLabel}: ${meta.roll.trim()}`)));
  const rightCol: string[] = [];
  if (meta.supervisor.trim()) rightCol.push(`<strong>${esc(meta.supervisor.trim())}</strong>`);
  if (meta.session.trim()) rightCol.push(spanSoft(esc(`${Lx.sessionLabel}: ${meta.session.trim()}`)));
  parts.push(vsp(2));
  if (leftCol.length || rightCol.length) {
    parts.push(
      titleMetaTable(
        leftCol.length ? leftCol : ['&nbsp;'],
        rightCol.length ? rightCol : ['&nbsp;'],
      ),
    );
  }
  // নিচের ব্লক — প্রতিষ্ঠান ও তারিখ পাতার একদম নিচে (উদার শ্বাস-প্রশ্বাস)
  const bottom: string[] = [];
  if (meta.university.trim()) bottom.push(C(`<strong>${esc(meta.university.trim())}</strong>`, 'margin:0.9em 0 0.05em;'));
  if (meta.date.trim()) bottom.push(C(spanGold(esc(meta.date.trim())), 'margin:0.05em 0;'));
  if (bottom.length) parts.push(vsp(5), rule('single'), ...bottom);
  return { html: parts.join(''), noChrome: true, numberRestart: { from: 1, format: 'roman' } };
}

function singleDocPage(title: string, bodyParas: string[], extra?: string): ThesisPage {
  return {
    html: [
      fmHeading(title),
      ...bodyParas.map((p) => `<p style="text-align:justify; margin:0.55em 0;">${p}</p>`),
      ...(extra ? [extra] : []),
    ].join(''),
    noChrome: false,
  };
}

function signRow(label: string, dateLabel: string): string {
  return [
    `<p style="text-align:right; margin-top:2.4em;"><span style="color:${THESIS_SOFT};">______________________</span></p>`,
    `<p style="text-align:right; margin:0;"><strong>${esc(label)}</strong></p>`,
    `<p style="text-align:right; margin:0;"><em>${spanSoft(`${esc(dateLabel)}: ………………`)}</em></p>`,
  ].join('');
}

function tocPage(lang: ThesisLang): ThesisPage {
  return { html: tocInsertHtml([], L(lang).toc), noChrome: false };
}

function dedicationPage(meta: ThesisMeta): ThesisPage {
  const Lx = L(meta.lang);
  const text = meta.dedicationText.trim() || Lx.dedicationDefault;
  const lines = text.split('\n').map((ln) => C(`<em>${esc(ln)}</em>`, 'margin:0.35em 0;')).join('');
  return {
    html: [
      `<p style="text-align:center; margin:2.2em 0 0.1em; letter-spacing:2px;">${spanAcc(`<strong><span style="font-size:0.9em;">${esc(Lx.dedication)}</span></strong>`)}</p>`,
      rule('flourish'),
      // এডিটর-চুক্তি: খালি <div> স্কিমা-বাইরে ফেলে যায় — <p> স্পেসারই বাহক
      vsp(2),
      lines,
    ].join(''),
    noChrome: false,
  };
}

/** চিত্র/টেবিল ক্যাপশন — "চিত্র ৩.১: বিবরণ (উৎস)" কেন্দ্রীভূত */
export function captionHtml(kind: 'figure' | 'table', chapter: number, serial: number, caption: string, lang: ThesisLang, source?: string): string {
  const Lx = L(lang);
  const label = kind === 'figure' ? Lx.figLabel : Lx.tblLabel;
  const cap = caption.trim() || (lang === 'en' ? 'Caption text…' : 'ক্যাপশনের লেখা…');
  const src = source?.trim();
  return `<p style="text-align:center; margin-top:0.5em;"><strong><span style="color:${THESIS_ACCENT};">${esc(label)} ${num(chapter, lang)}.${num(serial, lang)}:</span></strong> ${esc(cap)}${src ? ` <em>${spanSoft(`(${esc(Lx.sourceLabel)}: ${esc(src)})`)}</em>` : ''}</p>`;
}

function listsPage(lang: ThesisLang): ThesisPage {
  const Lx = L(lang);
  const pw = lang === 'en' ? 'p.' : 'পৃষ্ঠা';
  // সারি — নম্বর (মেরুন) + ডট-লিডার + পৃষ্ঠা-ঘর
  const li = (label: string, n: number) =>
    `<p style="margin:0.5em 0;"><strong>${spanAcc(`${esc(label)} ${num(n, lang)}`)}</strong>${spanSoft(':')} ` +
    `<span style="color:${THESIS_SOFT}; letter-spacing:1px;">………………</span>` +
    `<span style="color:${THESIS_SOFT};"> (${esc(pw)} …)</span></p>`;
  return {
    html: [
      fmHeading(Lx.figures),
      softItalic(Lx.listsNote),
      li(Lx.figLabel, 1),
      li(Lx.figLabel, 2),
      C(`<span style="color:${THESIS_GOLD}; letter-spacing:4px; font-size:0.85em;">✦ ✦ ✦</span>`, 'margin:0.9em 0;'),
      fmHeading(Lx.tables),
      softItalic(Lx.listsNote),
      li(Lx.tblLabel, 1),
      li(Lx.tblLabel, 2),
    ].join(''),
    noChrome: false,
  };
}

function abbreviationsPage(lang: ThesisLang): ThesisPage {
  const Lx = L(lang);
  const rows = Lx.abbrRows
    .map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`)
    .join('');
  return {
    html: [
      fmHeading(Lx.abbreviations),
      `<table style="width:100%"><tbody><tr><th data-bg="rgba(127,29,29,0.07)">${esc(Lx.abbrHead[0])}</th><th data-bg="rgba(127,29,29,0.07)">${esc(Lx.abbrHead[1])}</th></tr>${rows}</tbody></table>`,
    ].join(''),
    noChrome: false,
  };
}

function chapterPage(meta: ThesisMeta, ch: ThesisChapter): ThesisPage {
  const Lx = L(meta.lang);
  const parts: string[] = [
    // অধ্যায়-ওপেনার — সোনালি বর্ণ-ফাঁকসহ ছোট লেবেল + বড় শিরোনাম + ডাবল রুল
    C(`<span style="letter-spacing:3px; font-size:0.88em; color:${THESIS_GOLD};"><strong>${esc(Lx.chapter)} ${num(ch.num, meta.lang)}</strong></span>`, 'margin:1em 0 0.1em;'),
    `<h1 style="text-align:center; margin:0.1em 0 0.2em;">${esc(ch.title)}</h1>`,
    rule('double'),
  ];
  ch.sections.forEach((s, i) => {
    parts.push(sectionHeading(ch.num, i + 1, s.title, meta.lang));
    parts.push(hintPara(s.hint));
  });
  return { html: parts.join(''), noChrome: false };
}

function referencesPage(lang: ThesisLang): ThesisPage {
  const Lx = L(lang);
  return {
    html: [
      fmHeading(Lx.references),
      softItalic(Lx.referencesNote),
      `<p style="padding-left:2.5em; text-indent:-2.5em; margin:0.6em 0;">${esc(Lx.referenceSample)}</p>`,
    ].join(''),
    noChrome: false,
  };
}

function appendixPage(lang: ThesisLang): ThesisPage {
  const Lx = L(lang);
  return {
    html: [fmHeading(Lx.appendix), softItalic(Lx.appendixNote)].join(''),
    noChrome: false,
  };
}

/** থিসিস কাঠামোর সব পাতা (ক্রমানুসারে) তৈরি করে */
export function buildThesisPages(meta: ThesisMeta, opts: ThesisOptions): ThesisPage[] {
  const Lx = L(meta.lang);
  const pages: ThesisPage[] = [];

  pages.push(titlePage(meta));

  if (opts.dedication) pages.push(dedicationPage(meta));
  if (opts.declaration) pages.push(singleDocPage(Lx.declaration, Lx.declarationBody, signRow(Lx.declSign, Lx.declDate)));
  if (opts.certificate) pages.push(singleDocPage(Lx.certificate, Lx.certificateBody, signRow(`${Lx.supervisorLabel}: ${meta.supervisor || '…'}`, Lx.declDate)));
  if (opts.acknowledgment) pages.push(singleDocPage(Lx.acknowledgment, Lx.ackBody));
  if (opts.abstract) {
    pages.push({
      html: [
        fmHeading(Lx.abstract),
        softItalic(Lx.abstractBody),
        `<p style="margin:0.7em 0;"><strong>${esc(Lx.keywords)}:</strong> ${esc(meta.lang === 'en' ? 'keyword 1; keyword 2; keyword 3' : 'কীওয়ার্ড ১; কীওয়ার্ড ২; কীওয়ার্ড ৩')}</p>`,
      ].join(''),
      noChrome: false,
    });
  }
  if (opts.toc) pages.push(tocPage(meta.lang));
  if (opts.lists) pages.push(listsPage(meta.lang));
  if (opts.abbreviations) pages.push(abbreviationsPage(meta.lang));

  // মূল লেখা — প্রথম অধ্যায় থেকে নম্বর ১ থেকে আরম্ভ (থিসিস স্ট্যান্ডার্ড)
  const chapters = chaptersFor(meta);
  chapters.forEach((ch, i) => {
    const page = chapterPage(meta, ch);
    if (i === 0) page.numberRestart = { from: 1, format: meta.lang === 'en' ? 'english' : 'bangla' };
    pages.push(page);
  });

  if (opts.references) pages.push(referencesPage(meta.lang));
  if (opts.appendix) pages.push(appendixPage(meta.lang));

  return pages;
}

// ─── সূত্র-ইঞ্জিন (Citations) ───

export type CiteStyle = 'apa' | 'mla' | 'harvard' | 'chicago' | 'ieee';
export type CiteType = 'book' | 'journal' | 'website' | 'thesis' | 'newspaper' | 'report';

export interface CiteEntry {
  type: CiteType;
  style: CiteStyle;
  authors: string;      // "রহমান, আ. ও করিম, এ." / "Rahman, A. & Karim, B."
  year: string;
  title: string;
  container: string;    // জার্নাল/ওয়েবসাইট/সংবাদপত্রের নাম
  publisher: string;
  place: string;
  volume: string;
  issue: string;
  pages: string;
  url: string;
  accessed: string;     // অ্যাক্সেস-তারিখ (ওয়েবসাইট)
  doi: string;
  edition: string;
}

export const EMPTY_CITE: CiteEntry = {
  type: 'book', style: 'apa', authors: '', year: '', title: '', container: '',
  publisher: '', place: '', volume: '', issue: '', pages: '', url: '', accessed: '', doi: '', edition: '',
};

const J = (s: string) => s.trim(); // join helper

/** p./pp. — এক-পৃষ্ঠা হলে p., ব্যাপ্তি/বহু-পৃষ্ঠা হলে pp. (APA/MLA-রীতি) */
const ppFmt = (pg: string) =>
  /[-–—,]/.test(pg) ? `pp. ${pg}` : `p. ${pg}`;

/**
 * IEEE-লেখক — "Rahman, Aziz" → "A. Rahman" (initials-first, IEEE-স্ট্যান্ডার্ড)।
 * লেখক-বিভাজক: & / ও / এবং / and / ; — কমা লেখক-বিভাজক নয়, "নাম, নাম" জোটের
 * অংশ (নইলে "রহমান, আ." ভেঙে "রহমান" + "আ." হয়ে যেত)।
 */
function ieeeAuthors(a: string): string {
  const clean = a
    .replace(/\s*&\s*/g, ' and ')
    .replace(/\s+ও\s+/g, ' and ')
    .replace(/\s+এবং\s+/g, ' and ')
    .replace(/\s+एवं\s+/g, ' and ');
  return clean
    .split(/\s*(?:and|;)\s*/)
    .map((one) => {
      const seg = one.trim();
      if (!seg) return seg;
      const m = seg.match(/^(.{2,}?),\s*(.+)$/); // "Last, First[.]"
      if (m) {
        const last = m[1].trim();
        const first = m[2].trim().replace(/\.$/, '');
        const initials = first.split(/\s+/).filter(Boolean).map((w) => `${w[0].toUpperCase()}.`).join(' ');
        return initials ? `${initials} ${last}` : last;
      }
      return seg;
    })
    .filter(Boolean)
    .join(', ');
}

/**
 * পূর্ণ তালিকা-এন্ট্রি (Reference list entry) ফরম্যাট করে।
 * সব ফিল্ড পূর্ণ না থাকলেও যথাসম্ভব সঠিক আউটপুট দেয়।
 */
export function formatReference(e: CiteEntry): string {
  // ফিল্ডগুলো আগেই esc — শেষ HTML-এ <i>/<b> কেবল আমাদের নিজের বসানো
  const esc2 = (s: string) => esc(s.trim());
  const a = esc2(e.authors);
  const y = esc2(e.year);
  const t = esc2(e.title);
  const c = esc2(e.container);
  const p = esc2(e.publisher);
  const pl = esc2(e.place);
  const v = esc2(e.volume);
  const i = esc2(e.issue);
  const pg = esc2(e.pages);
  const u = esc2(e.url);
  const d = esc2(e.doi);
  const ed = esc2(e.edition);
  const pubPlace = pl && p ? `${pl}: ${p}` : p || pl;
  const link = d ? `https://doi.org/${d}` : u;
  /** ফরম্যাট-নির্ভুলতা — শেষে ব্যবহারকারীর বসানো দাঁড়ি বাদ (প্রতিটি স্টাইল নিজের দাঁড়ি নিজেই বসায়, নইলে "এ.." যুগল-দাঁড়ি হয়) */
  const nd = (s: string) => s.trim().replace(/\.+$/, '');

  switch (e.style) {
    case 'apa': {
      // APA 7 — বই: Author. (Year). Title (ed.). Publisher. (স্থান বাদ — APA 7 রীতি)
      // জার্নাল: Author. (Year). Title. Journal, Vol(Issue), pages. doi — ভলিউম ইটালিক
      const parts: string[] = [];
      if (a) parts.push(`${a} `);
      parts.push(`(${y || 'n.d.'}). `);
      if (e.type === 'journal') {
        parts.push(`${nd(t)}. `);
        if (c) parts.push(`<i>${nd(c)}${v ? `, ${v}` : ''}</i>${i ? `(${i})` : ''}${pg ? `, ${pg}` : ''}. `);
      } else if (e.type === 'newspaper') {
        parts.push(`${nd(t)}. `);
        if (c) parts.push(`<i>${nd(c)}</i>${pg ? `, ${ppFmt(pg)}. ` : '. '}`);
      } else {
        parts.push(`<i>${nd(t)}</i>${ed ? ` (${ed} ed.)` : ''}. `);
        if (p) parts.push(`${p}. `);
      }
      if (link) parts.push(link);
      return parts.join('').trim();
    }
    case 'mla': {
      // MLA 9 — বই: Author. Title. Publisher, Year. (স্থান বাদ — MLA 8+ রীতি)
      // জার্নাল: Author. "Title." Journal, vol. V, no. I, Year, pp.
      const parts: string[] = [];
      if (a) parts.push(`${nd(a)}. `);
      if (e.type === 'journal' || e.type === 'newspaper') {
        parts.push(`"${nd(t)}." `);
        if (c) parts.push(`<i>${nd(c)}</i>, `);
        if (v) parts.push(`vol. ${v}, `);
        if (i) parts.push(`no. ${i}, `);
        if (y) parts.push(`${y}, `);
        if (pg) parts.push(`${ppFmt(pg)}. `);
      } else {
        parts.push(`<i>${nd(t)}</i>. `);
        if (ed) parts.push(`${ed} ed., `);
        if (p) parts.push(`${p}, `);
        if (y) parts.push(`${y}. `);
      }
      if (link && e.type === 'website') parts.push(`${link}${e.accessed ? `, accessed ${e.accessed}` : ''}.`);
      return parts.join('').trim().replace(/\s{2,}/g, ' ');
    }
    case 'harvard': {
      // Harvard — বই: Author (Year) Title. Edition. Place: Publisher.
      const parts: string[] = [];
      if (a) parts.push(`${a} `);
      parts.push(`(${y || 'n.d.'}) `);
      if (e.type === 'journal' || e.type === 'newspaper') {
        parts.push(`'${nd(t)}', `);
        if (c) parts.push(`<i>${nd(c)}</i>`);
        if (v) parts.push(`, vol. ${v}`);
        if (i) parts.push(`, no. ${i}`);
        if (pg) parts.push(`, pp. ${pg}`);
        parts.push('. ');
      } else {
        parts.push(`<i>${nd(t)}</i>. `);
        if (ed) parts.push(`${ed} ed. `);
        if (pubPlace) parts.push(`${pubPlace}. `);
      }
      if (link) parts.push(`${link}${e.accessed ? ` (Accessed ${e.accessed})` : ''}`);
      return parts.join('').trim().replace(/\s{2,}/g, ' ');
    }
    case 'chicago': {
      // author-date: Author. Year. Title. Place: Publisher.
      const parts: string[] = [];
      if (a) parts.push(`${nd(a)}. `);
      if (y) parts.push(`${y}. `);
      if (e.type === 'journal' || e.type === 'newspaper') {
        parts.push(`"${nd(t)}." `);
        if (c) parts.push(`<i>${nd(c)}</i> `);
        if (v) parts.push(`${v}`);
        if (i) parts.push(`, no. ${i}`);
        if (pg) parts.push(`: ${pg}`);
        parts.push('. ');
      } else {
        parts.push(`<i>${nd(t)}</i>. `);
        if (pubPlace) parts.push(`${pubPlace}. `);
      }
      if (link) parts.push(link);
      return parts.join('').trim().replace(/\s{2,}/g, ' ');
    }
    case 'ieee': {
      // [1] A. Rahman, Title, ed. Place: Publisher, Year. — লেখক initials-first
      const parts: string[] = [];
      const ia = a ? ieeeAuthors(a) : '';
      if (ia) parts.push(`${ia}, `);
      if (e.type === 'journal' || e.type === 'newspaper') {
        parts.push(`"${nd(t)}," `);
        if (c) parts.push(`<i>${nd(c)}</i>`);
        if (v) parts.push(`, vol. ${v}`);
        if (i) parts.push(`, no. ${i}`);
        if (pg) parts.push(`, pp. ${pg}`);
        if (y) parts.push(`, ${y}`);
        parts.push('. ');
      } else {
        parts.push(`<i>${nd(t)}</i>${ed ? `, ${ed}` : ''}. `);
        if (pubPlace) parts.push(`${pubPlace}, `);
        if (y) parts.push(`${y}. `);
      }
      if (link) {
        // আগের অংশের শেষ-চিহ্ন বিচার করে একটাই বিভাজক — যুগল-স্পেস/দাঁড়ি নয়
        const tail = parts.join('').trimEnd();
        const sep = /[.]$/.test(tail) ? ' ' : '. ';
        parts.push(`${sep}[Online]. Available: ${link}`);
      }
      return parts.join('').trim().replace(/\s{2,}/g, ' ');
    }
  }
}

/** পাঠ্যের ভেতরের উদ্ধৃতি (in-text citation) — প্লেইন-টেক্সট আউটপুট (esc-কৃত)
 *  IEEE-তে refNumber দিলে [n] সেটাই বসে (লাইব্রেরি-ক্রম); না দিলে [1]। */
export function formatInText(e: CiteEntry, refNumber?: number): string {
  const a = J(e.authors);
  const y = J(e.year);
  const pg = J(e.pages);
  // শব্দ-সীমাসহ বিভাজক — "Orlando"-র ভেতরের "and" বা "ওয়াহিদ"-এর "ও" কাটবে না
  const firstAuthor = a.split(/\s*[,;]\s*|\s+ও\s+|\s*&\s*|\s+and\s+/i)[0]?.trim() || a;
  const shortPg = pg.split(/[-–—,]/)[0]?.trim() || '';
  const built = (() => {
    switch (e.style) {
      case 'apa':
        return `(${firstAuthor}${y ? `, ${y}` : ''}${shortPg ? `, p. ${shortPg}` : ''})`;
      case 'mla':
        // MLA-তে পাতা না থাকলে কেবল লেখক — বছর in-text-এ বসে না (MLA 9-রীতি)
        return `(${firstAuthor}${shortPg ? ` ${shortPg}` : ''})`;
      case 'harvard':
        return `(${firstAuthor}${y ? `, ${y}` : ''}${shortPg ? `, p. ${shortPg}` : ''})`;
      case 'chicago':
        return `(${firstAuthor}${y ? ` ${y}` : ''}${shortPg ? `, ${shortPg}` : ''})`;
      case 'ieee': {
        // IEEE পাঠ্যে সংখ্যা-রেফারেন্স — লাইব্রেরি-ক্রম অনুযায়ী [n]
        return `[${refNumber ?? 1}]`;
      }
    }
  })();
  return esc(built);
}

/** সূত্র-স্টাইলের প্রদর্শন-নাম */
export const CITE_STYLE_NAMES: Record<CiteStyle, { bn: string; en: string }> = {
  apa: { bn: 'APA ৭', en: 'APA 7' },
  mla: { bn: 'MLA ৯', en: 'MLA 9' },
  harvard: { bn: 'হার্ভার্ড', en: 'Harvard' },
  chicago: { bn: 'শিকাগো', en: 'Chicago' },
  ieee: { bn: 'IEEE', en: 'IEEE' },
};

export const CITE_TYPE_NAMES: Record<CiteType, { bn: string; en: string }> = {
  book: { bn: 'বই', en: 'Book' },
  journal: { bn: 'জার্নাল নিবন্ধ', en: 'Journal article' },
  website: { bn: 'ওয়েবসাইট', en: 'Website' },
  thesis: { bn: 'থিসিস', en: 'Thesis' },
  newspaper: { bn: 'সংবাদপত্র', en: 'Newspaper' },
  report: { bn: 'রিপোর্ট', en: 'Report' },
};

// ─── থিসিস ফরম্যাট প্রিসেট (গবেষণা-স্ট্যান্ডার্ড) ───

/** বিশ্ববিদ্যালয়-স্ট্যান্ডার্ড থিসিস টাইপোগ্রাফি (updateSettings-এ পাঠানোর জন্য) */
export function thesisFormatPreset(lang: ThesisLang): {
  defaultFont: string;
  defaultFontSize: number;
  lineHeight: number;
  paragraphSpacing: number;
} {
  return lang === 'en'
    ? { defaultFont: 'Times New Roman', defaultFontSize: 12, lineHeight: 1.5, paragraphSpacing: 8 }
    : { defaultFont: 'SolaimanLipi', defaultFontSize: 14, lineHeight: 1.5, paragraphSpacing: 8 };
}

/** বাঁধাই-স্ট্যান্ডার্ড মার্জিন (বাম ১.৫", বাকি ১") — ইঞ্চি এককে */
export const THESIS_MARGINS = { top: 1, bottom: 1, left: 1.5, right: 1, gutter: 0 };

// ─── সূত্র-লাইব্রেরি (Citation Library) ───

/**
 * লাইব্রেরির সব এন্ট্রি থিসিস-স্ট্যান্ডার্ড ক্রমে সাজিয়ে তালিকা-HTML প্যারার অ্যারে দেয়।
 *  - APA/MLA/Harvard/Chicago: লেখকের নাম অনুযায়ী বর্ণানুক্রম (বাংলা-সচেতন locale)
 *  - IEEE: উদ্ধৃতি-ক্রম (তালিকার ক্রম) — [1], [2]… নম্বর-উপসর্গ (IEEE-স্ট্যান্ডার্ড)
 *  - মিশ্র-স্টাইল লাইব্রেরিতে প্রতিটি এন্ট্রি নিজের স্টাইলেই ফরম্যাট হয় (এক স্টাইলের
 *    গ্যারান্টি UI-সতর্কতার দায়িত্ব — ইঞ্জিন ডেটা নষ্ট করবে না)।
 */
export function formatReferenceLibrary(entries: CiteEntry[]): string[] {
  const valid = entries.filter((e) => e.title.trim() && e.year.trim());
  if (valid.length === 0) return [];
  const styles = new Set(valid.map((e) => e.style));
  if (styles.size === 1 && valid[0].style === 'ieee') {
    return valid.map((e, i) => `<p style="padding-left:2.5em;text-indent:-2.5em;">[${i + 1}] ${formatReference(e)}</p>`);
  }
  if (styles.size > 1) {
    let n = 0;
    return valid.map((e) =>
      e.style === 'ieee'
        ? `<p style="padding-left:2.5em;text-indent:-2.5em;">[${++n}] ${formatReference(e)}</p>`
        : `<p style="padding-left:2.5em;text-indent:-2.5em;">${formatReference(e)}</p>`,
    );
  }
  const sorted = [...valid].sort((x, y) => x.authors.trim().localeCompare(y.authors.trim(), 'bn'));
  return sorted.map((e) => `<p style="padding-left:2.5em;text-indent:-2.5em;">${formatReference(e)}</p>`);
}

/** লাইব্রেরিতে একাধিক স্টাইল মিশে আছে কি? (UI-সতর্কতার জন্য) */
export function citeLibMixed(entries: CiteEntry[]): boolean {
  const valid = entries.filter((e) => e.title.trim() && e.year.trim());
  return new Set(valid.map((e) => e.style)).size > 1;
}

// ─── বিশ্ববিদ্যালয় দ্রুত-পূরণ (প্রিসেট) ───

export const BD_UNIVERSITIES: Array<{ id: string; name: string; bn: string }> = [
  { id: 'du', name: 'University of Dhaka', bn: 'ঢাকা বিশ্ববিদ্যালয়' },
  { id: 'nu', name: 'National University, Bangladesh', bn: 'জাতীয় বিশ্ববিদ্যালয়' },
  { id: 'ru', name: 'University of Rajshahi', bn: 'রাজশাহী বিশ্ববিদ্যালয়' },
  { id: 'cu', name: 'University of Chittagong', bn: 'চট্টগ্রাম বিশ্ববিদ্যালয়' },
  { id: 'ju', name: 'Jahangirnagar University', bn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়' },
  { id: 'bu', name: 'Bangladesh Agricultural University', bn: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়' },
  { id: 'buet', name: 'Bangladesh University of Engineering and Technology', bn: 'বাংলাদেশ প্রকৌশল বিশ্ববিদ্যালয় (বুয়েট)' },
  { id: 'bsmrmu', name: 'Bangabandhu Sheikh Mujibur Rahman Maritime University', bn: 'বঙ্গবন্ধু শেখ মুজিবুর রহমান মেরিটাইম বিশ্ববিদ্যালয়' },
];

// ─── উদাহরণ-মেটা (এক ক্লিকে ফিল্ড পূরণ — ট্রাই করার জন্য) ───

export function exampleMeta(lang: ThesisLang, discipline: ThesisDiscipline): ThesisMeta {
  return lang === 'en'
    ? {
        lang, level: 'masters',
        discipline,
        title: discipline === 'business'
          ? 'Impact of Mobile Banking on Rural Financial Inclusion: Evidence from Bangladesh'
          : discipline === 'arts'
            ? 'Folk Songs of the Padma Basin: A Study of Continuity and Change'
            : 'Water Quality and Fish Diversity of the Padma River: A Seasonal Assessment',
        university: 'University of Dhaka',
        department: discipline === 'business' ? 'Management' : discipline === 'arts' ? 'Bangla' : 'Zoology',
        author: 'Md. Rahim Uddin', roll: '2023-MZ-045', session: '2022–23',
        supervisor: 'Prof. Dr. Salma Khatun', degreeName: '',
        date: 'March 2026',
        dedicationText: 'To my parents —\nwhose love and sacrifice lit every step of this journey',
      }
    : {
        lang, level: 'masters',
        discipline,
        title: discipline === 'business'
          ? 'মোবাইল ব্যাংকিং ও পল্লি আর্থিক অন্তর্ভুক্তি: বাংলাদেশের প্রেক্ষাপট'
          : discipline === 'arts'
            ? 'পদ্মা অববাহিকার লোকগান: ধারাবাহিকতা ও পরিবর্তনের একটি পাঠ'
            : 'পদ্মা নদীর পানির গুণমান ও মাছের বৈচিত্র্য: একটি মৌসুমি মূল্যায়ন',
        university: 'ঢাকা বিশ্ববিদ্যালয়',
        department: discipline === 'business' ? 'ব্যবস্থাপনা' : discipline === 'arts' ? 'বাংলা' : 'প্রাণিবিদ্যা',
        author: 'মো. রহিম উদ্দিন', roll: '২০২৩-প্রা-০৪৫', session: '২০২২–২৩',
        supervisor: 'প্রফেসর ড. সালমা খাতুন', degreeName: '',
        date: 'মার্চ ২০২৬',
        dedicationText: 'মা-বাবাকে —\nযাঁর ভালোবাসা, ত্যাগ ও দোয়ায় আমি আজকের পথ পেয়েছি',
      };
}
