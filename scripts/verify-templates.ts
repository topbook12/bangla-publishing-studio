/**
 * টেমপ্লেট যাচাই-ইঞ্জিন — সব প্রশ্নপত্র-ফরম্যাট × ডকুমেন্ট-ধরন × স্তর × টাইপোগ্রাফি
 * × লেআউট-সংমিশ্রণ রেন্ডার করে গঠন-সঠিকতা প্রমাণ করে (প্লাস বই-ব্লুপ্রিন্ট ও পেজ-টেমপ্লেট)।
 *
 * চালানো: bun scripts/verify-templates.ts
 */
import {
  parseQuestionText,
  normalizeQpJson,
  paperToEditorHtml,
  paperToStandaloneHtml,
  resolveQpFormat,
  sumQpMarks,
  qpSectionColumns,
  mathRichToHtml,
  qpSampleText,
  defaultQpMeta,
  qpPreambleMeta,
  QP_DEFAULT_LAYOUT,
} from '../src/lib/question-paper';
import type { QpFormat, QpDocType, QpLevel, QpFontScale, QpLayout, QuestionPaper, QpSection } from '../src/lib/question-paper';
import { BOOK_BLUEPRINTS, blueprintToPageData } from '../src/lib/book-templates';
import { PAGE_TEMPLATES } from '../src/lib/page-templates';
import { VECTOR_DEFS } from '../src/lib/vector-catalog';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function check(name: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    process.stdout.write(`  ✓ ${name}\n`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    process.stdout.write(`  ✗ ${name}${detail ? ` — ${detail}` : ''}\n`);
  }
}

function section(label: string) {
  process.stdout.write(`\n━━━ ${label} ━━━\n`);
}

// ─── HTML গঠন-যাচাইকারী ───
const VOID_TAGS = new Set(['col', 'hr', 'br', 'img', 'link', 'meta', 'input', 'wbr']);
function tagBalance(html: string): string | null {
  const stack: string[] = [];
  const re = /<(\/)?([a-zA-Z][a-zA-Z0-9]*)((?:"[^"]*"|'[^']*'|[^>])*?)(\/?)>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    const selfClose = m[4] === '/';
    if (VOID_TAGS.has(tag) || selfClose) continue;
    if (closing) {
      const top = stack.pop();
      if (top !== tag) return `</${tag}> but expected </${top ?? 'EOF'}> (stack: ${stack.slice(-3).join(',')})`;
    } else {
      stack.push(tag);
    }
  }
  return stack.length === 0 ? null : `unclosed: ${stack.join(',')}`;
}

function countTag(html: string, tag: string): number {
  return (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) ?? []).length;
}

// নমুনা কাঁচা-লেখা — সব ধরনের উপাদান একসাথে (MCQ, সৃজনশীল, মিলকরণ, সত্য-মিথ্যা, শূন্যস্থান, চিত্র, গণিত)
const RAW_FULL = `আদর্শ উচ্চ বিদ্যালয়
বার্ষিক পরীক্ষা — ২০২৫
শ্রেণি: ষষ্ঠ · বিষয়: গণিত
সময়: ২ ঘণ্টা ৩০ মিনিট
পূর্ণমান: ৭০
বিষয় কোড: ১২৬
সেট: ক
[২০২৫ সালের সিলেবাস অনুযায়ী]

বিভাগ – ক [প্রত্যেকটির মান ১]
১. বাংলাদেশের রাজধানীর নাম কী? [১]
ক) চট্রগ্রাম খ) ঢাকা গ) খুলনা ঘ) রাজশাহী
২. $15 \\times 4$ কত? [১]
ক) ৬০ খ) ৫৫ গ) ১৯ ঘ) ৪
৩. নিচের কোনটি মৌলিক সংখ্যা?
ক) ৯ খ) ১৫ গ) ১৭ ঘ) ২১

বিভাগ – খ [প্রতিটি ২ নম্বর]
৪. $\\frac{3}{4}$ এবং $\\frac{5}{6}$ এর যোগফল নির্ণয় কর। [২]
৫. সত্য হলে স এবং মিথ্যা হলে মি লিখ।
৬. স্তম্ভ মেলাও:
ক. ঢাকা ১. সমুদ্র-সৈকত
খ. কক্সবাজার ২. পতঙ্গ
গ. ঘুড়ি ৩. রাজধানী
৭. শূন্যস্থান পূরণ কর: ৭ × ____ = ৪২ [২]
৮. একটি আয়তাকার ঘরের দৈর্ঘ্য প্রস্থের চেয়ে ৩ মিটার বেশি। [চিত্র: আয়তক্ষেত্র ABCD] পরিসীমা ৩৬ মিটার হলে ঘরটির দৈর্ঘ্য ও প্রস্থ নির্ণয় কর। [৫]`;

const RAW_SUG = `আদর্শ কোচিং সেন্টার
ষষ্ঠ শ্রেণির গণিত সাজেশন

অধ্যায় ১ — স্বাভাবিক সংখ্যা ও ভগ্নাংশ [গুরুত্বপূর্ণ]
★ ১. ৪/৭ ও ৩/৫ এর যোগফল নির্ণয় কর।
★★ ২. ৩৬ ও ৪৮ এর ল.সা.গু ও গ.সা.গু নির্ণয় কর।
৩. ২/৩, ৪/৫ ও ৭/১০ ক্ষুদ্র থেকে বড় ক্রমে সাজাও।

অধ্যায় ২ — বীজগণিত [অতি গুরুত্বপূর্ণ]
★★ ৪. সরল কর: $3x + 2(x - 5)$
★ ৫. উৎপাদকে বিশ্লেষণ কর: $x^2 - 16$`;

const RAW_UNI = `জাতীয় বিশ্ববিদ্যালয়
বিভাগ: ব্যবস্থাপনা
অনার্স ২য় বর্ষ সমাপনী পরীক্ষা — ২০২৪
কোর্স কোড: ২৩২৫০৭ · কোর্স টাইটেল: ব্যবসায় অর্থনীতি

সময়: ৪ ঘণ্টা
পূর্ণমান: ৮০

যে-কোনো পাঁচটি প্রশ্নের উত্তর দাও।

১. (ক) চাহিদার মূল্য-স্থিতিস্থাপকতা কাকে বলে? (খ) এর ব্যবহারিক গুরুত্ব ব্যাখ্যা কর। [৫+৫=১০]
২. পূর্ণ প্রতিযোগিতামূলক বাজারের বৈশিষ্ট্য লিখ। [১০]
৩. মুদ্রাস্ফীতির কারণ ও প্রভাব আলোচনা কর। [১০]`;

// ডিফল্ট পরীক্ষা-নাম স্ট্রিং — সাজেশন-রেন্ডারে কোনোটাই কোথাও থাকতে পারে না
// (তিন ভাষার ডিফল্ট examTitle; নমুনা-লেখায় আর পরীক্ষা-লাইন নেই, তাই পুরো HTML-এই নিষেধ)
const EXAM_TITLE_STRINGS = ['বার্ষিক পরীক্ষা', 'वार्षिक परीक्षा', 'Annual Examination'];

// ─── ১. সব প্রশ্নপত্র-ফরম্যাট ───
section('প্রশ্নপত্র-ফরম্যাট × ধরন × স্তর — রেন্ডার-যাচাই');

const FORMATS: QpFormat[] = ['classic', 'modern', 'compact', 'board', 'royal', 'twocol', 'university', 'sugslip', 'quiz'];
const SCALES: QpFontScale[] = ['sm', 'md', 'lg'];

let comboCount = 0;
for (const fmt of FORMATS) {
  for (const docType of ['question', 'suggestion'] as QpDocType[]) {
    for (const level of ['school', 'university'] as QpLevel[]) {
      for (const scale of SCALES) {
        const raw = level === 'university' ? (docType === 'suggestion' ? RAW_SUG : RAW_UNI) : (docType === 'suggestion' ? RAW_SUG : RAW_FULL);
        // ডায়ালগ-প্রথা: আগে preamble-meta (কাঁচা-লেখার হেডার ফর্মে বসে) — তারপর পার্স
        // docType সচেতন — সাজেশনে কাঁচা-লেখার পরীক্ষা-লাইন examTitle ভরে না
        const baseMeta = { ...defaultQpMeta('bn'), schoolName: 'আদর্শ উচ্চ বিদ্যালয়', subject: 'গণিত', classLabel: 'ষষ্ঠ শ্রেণি' };
        const meta = level === 'university' ? qpPreambleMeta(raw, baseMeta, 'bn', docType) : baseMeta;
        const p = parseQuestionText(raw, meta, fmt, 'bn');
        const tag = `${fmt}/${docType}/${level}/${scale}`;
        if (!p) {
          check(tag, false, 'parseQuestionText → null');
          continue;
        }
        comboCount++;
        p.docType = docType;
        p.level = level;
        p.fontScale = scale;
        p.layout = { ...QP_DEFAULT_LAYOUT };

        const html = paperToEditorHtml(p, 'bn');
        const bal = tagBalance(html);
        check(tag, bal === null, bal ?? undefined);

        // ফরম্যাট-নির্দিষ্ট প্রত্যাশা
        const f = resolveQpFormat(p);
        if (f === 'twocol') {
          check(`${tag}: twocol বডি ২-স্তম্ভ মোড়ক`, /<div class="doc-columns" data-count="2"/.test(html), 'no wrapper');
        }
        if (f === 'sugslip') {
          check(`${tag}: স্লিপ ২-স্তম্ভ (রেখা নেই)`, /<div class="doc-columns" data-count="2" data-gap="14" data-rule="0"/.test(html), 'no tight wrapper');
          check(`${tag}: স্লিপ-স্বাক্ষর`, html.includes('স্বাক্ষর'), 'no signature');
        }
        if (f === 'quiz') {
          check(`${tag}: টেস্ট-স্লিপ ২-স্তম্ভ`, /<div class="doc-columns" data-count="2" data-gap="20" data-rule="0"/.test(html), 'no wrapper');
          // স্কোর-বক্স শুধু প্রশ্নপত্র-ধরনে (সাজেশন-ধরনে স্বাক্ষর-ফুটারই বাস্তবসম্মত)
          if (docType === 'question') {
            check(`${tag}: স্কোর-বক্স`, html.includes('প্রাপ্ত নম্বর'), 'no score box');
          }
          check(`${tag}: নাম-রোল ঘর`, html.includes('রোল'), 'no name/roll line');
        }
        if (f === 'university' && level === 'university' && docType === 'question') {
          check(`${tag}: বিশ্ববিদ্যালয় হেডার (কোর্স কোড)`, html.includes('কোর্স কোড'), 'missing course-code line');
        }
        if (f === 'modern' && docType === 'question') {
          check(`${tag}: MCQ-শিরোনাম`, html.includes('বহুনির্বাচনি'), 'missing mcq header');
        }
        if (docType === 'suggestion') {
          check(`${tag}: সাজেশন-শিরোনাম`, html.includes('সাজেশন'), 'missing sug title');
          // সাজেশনে পরীক্ষার নাম একেবারেই থাকবে না — হেডার/কুইজ-ঘর/স্লিপ যে-কোনো জায়গায়
          // (পুরো HTML স্ক্যান — span/টেবিল-ঘরেও লিক ধরবে; পুরনো split('সাজেশন') হিউরিস্টিক বাদ)
          const examLeak = EXAM_TITLE_STRINGS.find((t) => html.includes(t));
          check(`${tag}: সাজেশনে পরীক্ষার নাম নেই`, !examLeak, examLeak ? `found "${examLeak}"` : undefined);
        }
        if (docType === 'question' && f === 'sugslip') {
          // রিভার্স-লিক — প্রশ্নপত্রে sugslip এলে "সাজেশন —" শিরোনাম নয়,
          // পরীক্ষার নাম হেডারে থাকে (অন্য প্রশ্নপত্র-ফরম্যাটের মতোই)
          check(`${tag}: sugslip-এ সাজেশন-শিরোনাম নেই`, !html.includes('সাজেশন —'), 'suggestion header leaked');
          check(`${tag}: sugslip-এ পরীক্ষার নাম আছে`, !!meta.examTitle && html.includes(meta.examTitle), 'exam title missing');
        }
        // চিত্র-স্লট — RAW_FULL-এ একটা আছে (চিহ্নিতকারী-শব্দ নিজে রেন্ডারে থাকে না — কেবল □-বক্স)
        if (raw === RAW_FULL) {
          check(`${tag}: চিত্র-স্লট বক্স`, html.includes('\u25A1'), 'missing figure slot');
        }
        // স্ট্যান্ডঅ্যালোন-ফাইলও ভাঙে না কি না
        const std = paperToStandaloneHtml(p, 'bn');
        check(`${tag}: standalone HTML`, std.includes('</html>') && std.includes('</body>') && tagBalance(std) === null);
        // সাজেশনের স্ট্যান্ডঅ্যালোন <title>-ও পরীক্ষার নাম বহন করে না
        if (docType === 'suggestion') {
          const stdLeak = EXAM_TITLE_STRINGS.find((t) => std.includes(t));
          check(`${tag}: standalone-এ পরীক্ষার নাম নেই`, !stdLeak, stdLeak ? `found "${stdLeak}"` : undefined);
        }
      }
    }
  }
}
check(`মোট ${comboCount} সংমিশ্রণ পার্স হয়েছে`, comboCount === FORMATS.length * 2 * 2 * 3);

// কোর্স-কোড প্রিয়াবল-পার্সিং — বিশ্ববিদ্যালয়-স্তরের যৌগিক হেডার-লাইনও ধরে
{
  const m = qpPreambleMeta('কোর্স কোড: ২৩২৫০৭ · কোর্স টাইটেল: ব্যবসায় অর্থনীতি', defaultQpMeta('bn'), 'bn');
  check('preamble: কোর্স কোড (যৌগিক লাইন)', m.subjectCode === '২৩২৫০৭', `got ${m.subjectCode}`);
  check('preamble: কোর্স টাইটেল → বিষয়', m.subject === 'ব্যবসায় অর্থনীতি', `got ${m.subject}`);
  const m2 = qpPreambleMeta('বিষয় কোড: ১০৯', defaultQpMeta('bn'), 'bn');
  check('preamble: বিষয় কোড', m2.subjectCode === '১০৯', `got ${m2.subjectCode}`);
  const m3 = qpPreambleMeta('সেট: খ', defaultQpMeta('bn'), 'bn');
  check('preamble: সেট', m3.setCode === 'খ', `got ${m3.setCode}`);
}

// ─── ১b. সাজেশন exam-name রিগ্রেশন — সব পথে লিক বন্ধ + রিভার্স-লিক ───
section('সাজেশন exam-name রিগ্রেশন');
{
  // (docType='suggestion', format='quiz') — কুইজ-হেডারের ডান ঘরে পরীক্ষার নাম আসে না;
  // (docType='suggestion', format='auto') — auto-রেজল্ভ হয়েও লিক নেই।
  // meta.examTitle ডিফল্ট-মানেই রাখা হয় (ভাষা-ডিফল্ট ফর্মে থাকতেই পারে) — রেন্ডারারই চাপবে।
  for (const fmt of ['quiz', 'auto'] as QpFormat[]) {
    const sugMeta = { ...defaultQpMeta('bn'), schoolName: 'আদর্শ কোচিং সেন্টার', subject: 'গণিত', classLabel: 'ষষ্ঠ শ্রেণি' };
    const p = parseQuestionText(RAW_SUG, sugMeta, fmt, 'bn');
    if (!p) { check(`suggestion/${fmt}: পার্স`, false, 'parseQuestionText → null'); continue; }
    p.docType = 'suggestion';
    const html = paperToEditorHtml(p, 'bn');
    const leak = EXAM_TITLE_STRINGS.find((t) => html.includes(t));
    check(`suggestion/${fmt}: পরীক্ষার নাম নেই`, !leak, leak ? `found "${leak}"` : undefined);
    check(`suggestion/${fmt}: সাজেশন-শিরোনাম আছে`, html.includes('সাজেশন'));
    const std = paperToStandaloneHtml(p, 'bn');
    const stdLeak = EXAM_TITLE_STRINGS.find((t) => std.includes(t));
    check(`suggestion/${fmt}: standalone-এ পরীক্ষার নাম নেই`, !stdLeak && tagBalance(std) === null, stdLeak ? `found "${stdLeak}"` : undefined);
  }
  // (docType='question', format='sugslip') — "সাজেশন —" শিরোনাম নয়, পরীক্ষার নাম হেডারে
  {
    const qMeta = { ...defaultQpMeta('bn'), schoolName: 'আদর্শ উচ্চ বিদ্যালয়', subject: 'গণিত', classLabel: 'ষষ্ঠ শ্রেণি' };
    const p = parseQuestionText(RAW_FULL, qMeta, 'sugslip', 'bn');
    if (p) {
      p.docType = 'question';
      const html = paperToEditorHtml(p, 'bn');
      check('question/sugslip: "সাজেশন —" শিরোনাম নেই', !html.includes('সাজেশন —'), 'suggestion header leaked');
      check('question/sugslip: পরীক্ষার নাম আছে', html.includes('বার্ষিক পরীক্ষা'), 'exam title missing');
      check('question/sugslip: HTML গঠন', tagBalance(html) === null);
    } else check('question/sugslip: পার্স', false, 'parseQuestionText → null');
  }
  // normalizeQpJson — সাজেশনে AI-এর পাঠানো examTitle জোর করে ফাঁকা; প্রশ্নপত্রে বসে
  {
    const data = { examTitle: 'বার্ষিক পরীক্ষা — ২০২৫', sections: [{ title: 'অধ্যায় ১', questions: [{ number: '১', text: '২ + ২ কত?' }] }] };
    const blank = { ...defaultQpMeta('bn'), examTitle: '' };
    const np = normalizeQpJson(data, blank, 'classic', 'suggestion');
    check('normalizeQpJson: সাজেশনে examTitle জোর-ফাঁকা', !!np && np.meta.examTitle === '', np?.meta.examTitle);
    const nq = normalizeQpJson(data, { ...defaultQpMeta('bn'), examTitle: '' }, 'classic');
    check('normalizeQpJson: প্রশ্নপত্রে examTitle বসে', !!nq && nq.meta.examTitle === 'বার্ষিক পরীক্ষা — ২০২৫', nq?.meta.examTitle);
    check('normalizeQpJson: সাজেশনে প্রশ্ন-কাঠামো অক্ষত', !!np && np.sections.length === 1 && np.sections[0].questions.length === 1);
  }
  // qpPreambleMeta — সাজেশনে কাঁচা-লেখার পরীক্ষা-লাইন examTitle ভরে না; প্রশ্নপত্রে ভরে
  {
    const raw = 'আদর্শ কোচিং সেন্টার\nবার্ষিক পরীক্ষা — ২০২৫\nষষ্ঠ শ্রেণির গণিত সাজেশন';
    const mSug = qpPreambleMeta(raw, defaultQpMeta('bn'), 'bn', 'suggestion');
    check('preamble: সাজেশনে পরীক্ষা-লাইন ভরে না', mSug.examTitle === 'বার্ষিক পরীক্ষা', `got ${mSug.examTitle}`);
    const mQ = qpPreambleMeta(raw, defaultQpMeta('bn'), 'bn', 'question');
    check('preamble: প্রশ্নপত্রে পরীক্ষা-লাইন ভরে', mQ.examTitle === 'বার্ষিক পরীক্ষা — ২০২৫', `got ${mQ.examTitle}`);
    check('preamble: সাজেশনে সাজেশন-টাইটেল পার্স হয়', mSug.subject === 'গণিত' && mSug.classLabel === 'ষষ্ঠ শ্রেণি', `got ${mSug.subject}/${mSug.classLabel}`);
  }
}

// ─── ২. উন্নত লেআউট-অপশন (কলাম/নম্বর/মান/বিভাগ/MCQ/উত্তর-জায়গা) ───
section('উন্নত লেআউট-অপশন');

const layoutMatrix: Array<{ name: string; layout: Partial<QpLayout>; expect: (html: string) => boolean; why: string }> = [
  { name: 'columns=2', layout: { columns: '2' }, expect: (h) => /<div class="doc-columns" data-count="2"/.test(h), why: 'doc-columns wrapper missing' },
  { name: 'columns=3', layout: { columns: '3' }, expect: (h) => /data-count="3"/.test(h), why: '3-col wrapper missing' },
  { name: 'numStyle=dot', layout: { numStyle: 'dot' }, expect: (h) => h.includes('<strong>১.</strong>'), why: 'dot number style missing' },
  { name: 'numStyle=paren', layout: { numStyle: 'paren' }, expect: (h) => h.includes('<strong>(১)</strong>'), why: 'paren number missing' },
  { name: 'marksStyle=bracket', layout: { marksStyle: 'bracket' }, expect: (h) => h.includes('<strong>[২]</strong>') || h.includes('<strong>[১]</strong>'), why: 'bracket marks missing' },
  { name: 'marksStyle=word', layout: { marksStyle: 'word' }, expect: (h) => h.includes('নম্বর'), why: 'word marks missing' },
  { name: 'sectionStyle=box', layout: { sectionStyle: 'box' }, expect: (h) => h.includes('<u>বিভাগ') === false && h.includes('বিভাগ'), why: 'boxed section missing' },
  { name: 'sectionStyle=left', layout: { sectionStyle: 'left' }, expect: (h) => h.includes('<strong><u>বিভাগ'), why: 'left-underline section missing' },
  { name: 'mcqLayout=list', layout: { mcqLayout: 'list' }, expect: (h) => h.includes('<ul'), why: 'list mcq missing' },
  { name: 'answerSpace=md', layout: { answerSpace: 'md' }, expect: (h) => (h.match(/_{24}/g) ?? []).length >= 4, why: 'answer dotted lines missing' },
];
for (const { name, layout, expect, why } of layoutMatrix) {
  const meta = { ...defaultQpMeta('bn') };
  const p = parseQuestionText(RAW_FULL, meta, 'classic', 'bn');
  if (!p) { check(name, false, 'parse failed'); continue; }
  p.layout = { ...QP_DEFAULT_LAYOUT, ...layout };
  const html = paperToEditorHtml(p, 'bn');
  check(`${name}: ${why}`, expect(html));
}

// auto-কলাম — MCQ বিভাগে ২, সৃজনশীলে ১
{
  const meta = { ...defaultQpMeta('bn') };
  const p = parseQuestionText(RAW_FULL, meta, 'classic', 'bn');
  if (p) {
    p.layout = { ...QP_DEFAULT_LAYOUT };
    const mcqSec: QpSection | undefined = p.sections[0];
    const creative = p.sections[p.sections.length - 1];
    if (mcqSec) check('auto-কলাম: MCQ বিভাগে ২', qpSectionColumns(mcqSec, p.layout!) === 2);
    if (creative) check('auto-কলাম: শেষ বিভাগে (সৃজনশীল/সংক্ষিপ্ত মিশ্র) যুক্তিসঙ্গত', [1, 2].includes(qpSectionColumns(creative, p.layout!)));
  }
}

// ─── ৩. গণিত-রেন্ডারিং ───
section('গণিত (LaTeX → HTML)');
{
  const cases: Array<[string, RegExp]> = [
    ['$\\frac{3}{4}$', /\u00BE|<sup>|\u2044/], // ¾ বা sup-ভিত্তিক বা ফ্র্যাকশন-স্ল্যাশ
    ['$x^2 - 9$', /<sup>2<\/sup>/],
    ['$\\sqrt{144}$', /√/],
    ['$2x + 3 = 7$', /2x\s*\+\s*3\s*=\s*7/],
    ['$30^\\circ$', /°/],
    ['$\\times$', /×/],
    ['$\\div$', /÷/],
    ['$\\pi$', /π/],
    ['মিশ্র $x^2$ ও সাধারণ লেখা', /<sup>2<\/sup>/],
  ];
  for (const [src, re] of cases) {
    check(`${src}`, re.test(mathRichToHtml(src)), mathRichToHtml(src).slice(0, 80));
  }
}

// ─── ৪. মান-যোগফল ───
section('মান-হিসাব');
{
  const meta = { ...defaultQpMeta('bn'), fullMarks: '' };
  const p = parseQuestionText(RAW_FULL, meta, 'classic', 'bn');
  if (p) {
    const got = sumQpMarks(p);
    // ১+১+১ (বিভাগ ক) + ২+২+২+২+৫ (বিভাগ খ: ৪=২,৫=?,৬=?,৭=২,৮=৫)
    check('মোট মান সংখ্যা-হিসেব', got !== null && got > 0, `got=${got}`);
  }
}

// ─── ৫. ইংরেজি ও হিন্দি নমুনা-লেখা ───
section('ভাষা-ভিত্তিক নমুনা-লেখা (প্রতিটি ভাষায় পার্স হয়)');
for (const lang of ['bn', 'hi', 'en'] as const) {
  for (const docType of ['question', 'suggestion'] as QpDocType[]) {
    for (const level of ['school', 'university'] as QpLevel[]) {
      const raw = qpSampleText(lang, docType, level);
      const p = parseQuestionText(raw, defaultQpMeta(lang), 'classic', lang);
      check(`${lang}/${docType}/${level}`, p !== null && (p?.sections.length ?? 0) > 0, 'no sections');
      if (p) {
        const html = paperToEditorHtml(p, lang);
        check(`${lang}/${docType}/${level}: HTML`, tagBalance(html) === null);
      }
    }
  }
}

// ─── ৬. বই-ব্লুপ্রিন্ট ───
section('বই-ব্লুপ্রিন্ট (১২টি)');
let bpCount = 0;
for (const bp of BOOK_BLUEPRINTS) {
  let ok = true;
  let why = '';
  if (!bp.id || !bp.name || !bp.genre) { ok = false; why = 'missing id/name/genre'; }
  if (bp.pages.length === 0) { ok = false; why = 'no pages'; }
  for (const pg of bp.pages) {
    const bal = tagBalance(pg.html);
    if (bal) { ok = false; why = `page tag imbalance: ${bal.slice(0, 80)}`; break; }
  }
  const data = blueprintToPageData(bp, () => `t-${Math.random().toString(36).slice(2)}`);
  if (data.length !== bp.pages.length) { ok = false; why = 'pageData count mismatch'; }
  if (ok) bpCount++;
  check(`${bp.id} (${bp.pages.length} পাতা)`, ok, why);
}
check(`ব্লুপ্রিন্ট মোট = যাচাইকৃত`, bpCount === BOOK_BLUEPRINTS.length);
// id-অনন্যতা — ডুপ্লিকেট id-তে ব্লুপ্রিন্ট একে অপরকে পা কাটে (নির্বাচন/প্রয়োগ ভাঙে)
{
  const ids = new Set<string>();
  let dup = 0;
  for (const bp of BOOK_BLUEPRINTS) { if (ids.has(bp.id)) dup++; ids.add(bp.id); }
  check(`ব্লুপ্রিন্ট id-অনন্যতা (ডুপ্লিকেট ${dup})`, dup === 0);
}

// ─── ৭. পেজ-টেমপ্লেট ───
section('পেজ-টেমপ্লেট');
let ptCount = 0;
for (const tpl of PAGE_TEMPLATES) {
  const bal = tagBalance(tpl.html);
  const ok = bal === null;
  if (ok) ptCount++;
  check(`${tpl.id} (${tpl.category})`, ok, bal ?? undefined);
}
check(`পেজ-টেমপ্লেট মোট = যাচাইকৃত`, ptCount === PAGE_TEMPLATES.length);
// id-অনন্যতা — ডুপ্লিকেট id-তে টেমপ্লেট একে অপরকে পা কাটে
{
  const ids = new Set<string>();
  let dup = 0;
  for (const tpl of PAGE_TEMPLATES) { if (ids.has(tpl.id)) dup++; ids.add(tpl.id); }
  check(`পেজ-টেমপ্লেট id-অনন্যতা (ডুপ্লিকেট ${dup})`, dup === 0);
}

// ─── ৮. ভেক্টর-ক্যাটালগ ───
section('ভেক্টর-ক্যাটালগ (চিত্র-লাইব্রেরি)');
{
  let svgOk = 0;
  for (const v of VECTOR_DEFS) {
    if (v.svg.includes('<svg') && v.svg.includes('</svg>') && v.id && v.label) svgOk++;
  }
  check(`সব SVG গঠন-সঠিক (${svgOk}/${VECTOR_DEFS.length})`, svgOk === VECTOR_DEFS.length);
  const ids = new Set<string>();
  let dup = 0;
  for (const v of VECTOR_DEFS) {
    if (ids.has(v.id)) dup++;
    ids.add(v.id);
  }
  check(`id-অনন্যতা (ডুপ্লিকেট ${dup})`, dup === 0);
}

// ─── ৯. চিত্র-স্মার্ট-সিস্টেম (স্লট-ম্যাচ + AI-SVG নিরাপদকরণ + পূর্ণক) ───
section('চিত্র-স্মার্ট-সিস্টেম');
{
  const figs = await import('../src/lib/qp-figures');

  // স্লট-সংগ্রহ
  const sections = [
    { questions: [{ text: 'আয়ত [চিত্র: আয়তক্ষেত্র ABCD] পরিসীমা' }, { text: 'সাধারণ প্রশ্ন' }] },
    { questions: [{ text: 'বৃত্ত [চিত্র: বৃত্তের কেন্দ্র O] ও [চিত্র: স্পর্শক] দুটি' }] },
  ];
  const slots = figs.collectQpFigureSlots(sections);
  check('স্লট-সংগ্রহ (৩টি)', slots.length === 3, JSON.stringify(slots.map((s) => s.key)));
  check('স্লট-বর্ণনা', slots[0].desc === 'আয়তক্ষেত্র ABCD' && slots[2].desc === 'স্পর্শক');

  // ম্যাচ-মানের যোগ্যতা
  const m1 = figs.matchFigureVector('সমবাহু ত্রিভুজ ABC');
  check('ম্যাচ: ত্রিভুজ → ক্যাটালগ', m1 !== null && m1.def.cat === 'math', m1?.def.id);
  const m2 = figs.matchFigureVector('দূরত্ব-সময় লেখচিত্র', 'গতি বেগ');
  check('ম্যাচ: লেখচিত্র → পদার্থ', m2 !== null && m2.def.id === 'phy-motion-dt', m2?.def.id);
  const m3 = figs.matchFigureVector('অস্পষ্ট চিত্র');
  check('ম্যাচ: অস্পষ্ট বর্ণনা → null', m3 === null, m3?.def.id);
  const m4 = figs.matchFigureVector('');
  check('ম্যাচ: খালি বর্ণনা → null', m4 === null);

  // AI-SVG নিরাপদকরণ
  const good = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180"><line x1="10" y1="10" x2="100" y2="100" stroke="#111"/></svg>';
  check('SVG: ভালো ইনপুট অক্ষত', figs.sanitizeFigureSvg(good)?.includes('viewBox="0 0 240 180"') === true);
  const fenced = '```svg\n<svg viewBox="0 0 100 80"><rect x="5" y="5" width="90" height="70"/></svg>\n```';
  const cleanF = figs.sanitizeFigureSvg(fenced);
  check('SVG: কোড-ফেন্স ছাঁটা', cleanF !== null && cleanF.startsWith('<svg'), cleanF?.slice(0, 40));
  const evil = `<svg viewBox="0 0 100 80" onload="alert(1)"><script>alert(2)</script><circle cx="50" cy="40" r="20" fill="none" stroke="#000"/><a xlink:href="javascript:alert(3)"><text x="10" y="20">x</text></a></svg>`;
  const cleanE = figs.sanitizeFigureSvg(evil);
  check('SVG: স্ক্রিপ্ট/ইভেন্ট/বাহ্যিক-রেফ বাদ', cleanE !== null && !cleanE.includes('<script') && !cleanE.includes('onload') && !cleanE.includes('javascript:'));
  const noViewBox = '<svg><circle cx="60" cy="40" r="20"/></svg>';
  check('SVG: viewBox স্বয়ংক্রিয়', figs.sanitizeFigureSvg(noViewBox)?.includes('viewBox') === true);
  const noxmlns = '<svg viewBox="0 0 100 80"><rect x="1" y="1" width="9" height="7"/></svg>';
  check('SVG: xmlns স্বয়ংক্রিয়', figs.sanitizeFigureSvg(noxmlns)?.includes('xmlns') === true);
  check('SVG: ফাঁকা → null', figs.sanitizeFigureSvg('') === null);
  check('SVG: টেক্সট-অনলি → null', figs.sanitizeFigureSvg('আমি কোনো svg নই') === null);

  // পূর্ণক HTML
  if (m1) {
    const fill = figs.fillFromMatch(m1, 'সমবাহু ত্রিভুজ ABC');
    const fhtml = figs.figureHtmlFor(fill);
    check('fill HTML: doc-figure নোড', fhtml.startsWith('<figure class="doc-figure"') && fhtml.includes('data-src="data:image/svg+xml'));
    check('fill HTML: vid বহন', fhtml.includes(`data-vid="${m1.def.id}"`));
    check('fill HTML: data-URI-তে কাঁচা উদ্ধৃতি-চিহ্ন নেই', !fill.src.includes('"'));
  }
  const aiFill = figs.fillFromSvg(fenced, 'বর্গ');
  check('AI fill: sanitize হয়েই ঢোকে', aiFill !== null && aiFill.src.startsWith('data:image/svg+xml'));

  // paperToEditorHtml-এ পরিকল্পনা-সমন্বয়
  const meta = { ...defaultQpMeta('bn') };
  const p = parseQuestionText(RAW_FULL, meta, 'classic', 'bn');
  if (p) {
    const slots2 = figs.collectQpFigureSlots(p.sections);
    check('RAW_FULL-এ ১টি স্লট', slots2.length === 1, String(slots2.length));
    const plan = slots2.map((s) => {
      const mm = figs.matchFigureVector(s.desc, p.sections[s.secIdx].questions[s.qIdx].text);
      return mm ? figs.fillFromMatch(mm, s.desc) : null;
    });
    const htmlWith = paperToEditorHtml(p, 'bn', plan);
    check('পরিকল্পনায় চিত্র বসে (doc-figure)', htmlWith.includes('doc-figure'));
    check('মার্কার-লেখা প্রশ্ন-লেখা থেকে মুছে গেছে', !htmlWith.includes('[চিত্র'));
    const htmlWithout = paperToEditorHtml(p, 'bn');
    check('পরিকল্পনা ছাড়া খালি-বক্স', !htmlWithout.includes('doc-figure') && htmlWithout.includes('\u25A1'));
    // null-পূর্ণকও খালি-বক্সই দেয়
    const htmlNull = paperToEditorHtml(p, 'bn', [null]);
    check('null-পূর্ণক → খালি-বক্স', htmlNull.includes('\u25A1') && !htmlNull.includes('doc-figure'));
  }
}

// ─── ফলাফল ───
process.stdout.write(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nফলাফল: ✓ ${pass}   ✗ ${fail}\n`);
if (failures.length > 0) {
  process.stdout.write('\nব্যর্থ যাচাই:\n');
  for (const f of failures) process.stdout.write(`  • ${f}\n`);
  process.exit(1);
}
process.exit(0);
