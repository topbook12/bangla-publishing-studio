/**
 * ভেক্টর লাইব্রেরি — গণিত ও জ্যামিতি (৩২টি অ্যাসেট)।
 * স্টাইল-গাইড: vector-types.ts হেডার কমেন্ট দেখুন।
 */
import type { VectorDef } from './vector-types';
import { VP, VFONT } from './vector-types';

export const VECTOR_MATH: VectorDef[] = [
  // ───────────── ত্রিভুজ ─────────────
  {
    id: 'math-tri-eq',
    cat: 'math',
    label: 'সমবাহু ত্রিভুজ',
    kw: 'triangle equilateral সমবাহু ত্রিভুজ geometry জ্যামিতি বাহু শিরোবিন্দু',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M120 36 60 140h120z" fill="${VP.terracotta}" opacity=".18"/><path d="M120 36 60 140h120z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M85 85 95 91M145 91 155 85M120 134v12" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><text x="120" y="27" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">A</text><text x="48" y="157" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">B</text><text x="192" y="157" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">C</text></svg>`,
  },
  {
    id: 'math-tri-iso',
    cat: 'math',
    label: 'সমদ্বিবাহু ত্রিভুজ',
    kw: 'triangle isosceles সমদ্বিবাহু ত্রিভুজ উচ্চতা height geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M120 38 55 142h130z" fill="${VP.sky}" opacity=".18"/><path d="M120 38 55 142h130z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M82.4 86.8 92.6 93.2M147.4 93.2 157.6 86.8" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M120 44v90" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M115.5 134 120 142 124.5 134" stroke="${VP.slate}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 134h8v8" stroke="${VP.ink}" stroke-width="1.4"/><text x="120" y="29" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">A</text><text x="46" y="158" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">B</text><text x="194" y="158" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">C</text></svg>`,
  },
  {
    id: 'math-tri-right',
    cat: 'math',
    label: 'সমকোণ ত্রিভুজ',
    kw: 'right triangle সমকোণ ত্রিভুজ 90 ডিগ্রি অতিভুজ hypotenuse লম্ব',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M60 50 60 140 190 140z" fill="${VP.leaf}" opacity=".2"/><path d="M60 50 60 140 190 140z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 128h12v12" stroke="${VP.ink}" stroke-width="1.6"/><text x="60" y="40" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">A</text><text x="46" y="158" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">B</text><text x="198" y="158" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">C</text></svg>`,
  },
  {
    id: 'math-tri-scalene',
    cat: 'math',
    label: 'বিষমবাহু ত্রিভুজ',
    kw: 'triangle scalene বিষমবাহু ত্রিভুজ ভিন্ন বাহু geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M85 38 40 145 200 120z" fill="${VP.gold}" opacity=".2"/><path d="M85 38 40 145 200 120z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M57 89.2 68 93.8" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M115.1 127.2 117 139.1M123 126 124.9 137.8" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M139 83.9 146 74.1M135 86.8 141.9 77M143.1 81 150 71.2" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><text x="85" y="29" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">A</text><text x="32" y="160" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">B</text><text x="208" y="124" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">C</text></svg>`,
  },

  // ───────────── চতুর্ভুজ ও বহুভুজ ─────────────
  {
    id: 'math-square',
    cat: 'math',
    label: 'বর্গ',
    kw: 'square বর্গ চার বাহু সমান right angle কর্ণ geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M22 22h76v76H22z" fill="${VP.amber}" opacity=".25"/><path d="M22 22h76v76H22z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 30h8V22M90 22v8h8M98 90h-8v8M30 98V90h-8" stroke="${VP.ink}" stroke-width="1.4"/><path d="M60 17v10M93 60h10M60 93v10M17 60h10" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><text x="60" y="114" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">a</text></svg>`,
  },
  {
    id: 'math-rectangle',
    cat: 'math',
    label: 'আয়তক্ষেত্র',
    kw: 'rectangle আয়তক্ষেত্র দৈর্ঘ্য প্রস্থ length width geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><rect x="45" y="44" width="150" height="74" fill="${VP.sky}" opacity=".18"/><rect x="45" y="44" width="150" height="74" stroke="${VP.ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M45 54h10V44M195 108h-10v10" stroke="${VP.ink}" stroke-width="1.4"/><path d="M45 124v20M195 124v20M199 44h16M199 118h16" stroke="${VP.slate}" stroke-width="1.4"/><path d="M45 140H195M211 44V118" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M53 136 45 140l8 4M187 136 195 140l-8 4M207 52 211 44l4 8M207 110 211 118l4-8" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text x="120" y="133" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">l</text><text x="223" y="85" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">w</text></svg>`,
  },
  {
    id: 'math-parallelogram',
    cat: 'math',
    label: 'সামান্তরিক',
    kw: 'parallelogram সামান্তরিক parallel সমান্তরাল বাহু geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M75 45H185L210 130H100z" fill="${VP.leaf}" opacity=".18"/><path d="M75 45H185L210 130H100z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M125 41 135 45 125 49M150 126 160 130 150 134" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M90.3 81 89 92.8 81.6 83.5M87.8 72.3 86.5 84.1 79.1 74.9M200.3 81 199 92.8 191.6 83.5M197.8 72.3 196.5 84.1 189.1 74.9" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text x="75" y="36" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">A</text><text x="185" y="36" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">B</text><text x="219" y="147" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">C</text><text x="92" y="147" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">D</text></svg>`,
  },
  {
    id: 'math-trapezoid',
    cat: 'math',
    label: 'ট্রাপিজিয়াম',
    kw: 'trapezoid ট্রাপিজিয়াম উচ্চতা সমান্তরাল বাহু geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M80 55H160L190 140H50z" fill="${VP.terracotta}" opacity=".18"/><path d="M80 55H160L190 140H50z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M115 51 125 55 115 59M115 136 125 140 115 144" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 61v71" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M115.5 132 120 140 124.5 132" stroke="${VP.slate}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 132h7v8" stroke="${VP.ink}" stroke-width="1.4"/><path d="M59.3 95.5 70.7 99.5M169.3 99.5 180.7 95.5" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><text x="120" y="44" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">a</text><text x="120" y="161" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">b</text></svg>`,
  },
  {
    id: 'math-rhombus',
    cat: 'math',
    label: 'রম্বস',
    kw: 'rhombus রম্বস সমান বাহু কর্ণ diagonal geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M60 14 102 60 60 106 18 60z" fill="${VP.gold}" opacity=".2"/><path d="M60 14 102 60 60 106 18 60z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 14V106M18 60H102" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M60 53h7v7" stroke="${VP.ink}" stroke-width="1.4"/><path d="M76.6 41 85.4 33M76.6 79 85.4 87M43.4 79 34.6 87M34.6 41 43.4 33" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'math-kite',
    cat: 'math',
    label: 'ঘুড়ি আকৃতি',
    kw: 'kite ঘুড়ি আকৃতি শীর্ষ কর্ড কর্ণ geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M60 10 95 50 60 110 25 50z" fill="${VP.terracotta}" opacity=".18"/><path d="M60 10 95 50 60 110 25 50z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 10V110M25 50H95" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M60 43h7v7" stroke="${VP.ink}" stroke-width="1.4"/><path d="M73 33.9 82 26.1M38 33.9 47 26.1" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M72.3 77 82.7 83M68.8 83 79.2 89M37.3 83 47.7 77M40.8 89 51.2 83" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'math-pentagon',
    cat: 'math',
    label: 'পঞ্চভুজ',
    kw: 'pentagon পঞ্চভুজ পাঁচ বাহু polygon বহুভুজ geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M60 17 103.7 48.8 87 100.2 33 100.2 16.3 48.8z" fill="${VP.leaf}" opacity=".2"/><path d="M60 17 103.7 48.8 87 100.2 33 100.2 16.3 48.8z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 63V17" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><circle cx="60" cy="63" r="2" fill="${VP.ink}"/></svg>`,
  },
  {
    id: 'math-hexagon',
    cat: 'math',
    label: 'ষড়ভুজ',
    kw: 'hexagon ষড়ভুজ ছয় বাহু polygon বহুভুজ geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M106 60 83 99.8 37 99.8 14 60 37 20.2 83 20.2z" fill="${VP.sky}" opacity=".2"/><path d="M106 60 83 99.8 37 99.8 14 60 37 20.2 83 20.2z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 60h92" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><circle cx="60" cy="60" r="2" fill="${VP.ink}"/></svg>`,
  },
  {
    id: 'math-octagon',
    cat: 'math',
    label: 'অষ্টভুজ',
    kw: 'octagon অষ্টভুজ আট বাহু polygon বহুভুজ geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M102.5 77.6 77.6 102.5 42.4 102.5 17.5 77.6 17.5 42.4 42.4 17.5 77.6 17.5 102.5 42.4z" fill="${VP.gold}" opacity=".2"/><path d="M102.5 77.6 77.6 102.5 42.4 102.5 17.5 77.6 17.5 42.4 42.4 17.5 77.6 17.5 102.5 42.4z" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="60" cy="60" r="2" fill="${VP.ink}"/></svg>`,
  },

  // ───────────── বৃত্ত ─────────────
  {
    id: 'math-circle',
    cat: 'math',
    label: 'বৃত্ত',
    kw: 'circle বৃত্ত গোলাকার বৃত্তরেখা geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="42" fill="${VP.terracotta}" opacity=".18"/><circle cx="60" cy="60" r="42" stroke="${VP.ink}" stroke-width="2.2"/><circle cx="60" cy="60" r="2" fill="${VP.ink}"/></svg>`,
  },
  {
    id: 'math-circle-radius',
    cat: 'math',
    label: 'ব্যাসার্ধসহ বৃত্ত',
    kw: 'circle radius ব্যাসার্ধ বৃত্ত কেন্দ্র center geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="42" fill="${VP.sky}" opacity=".15"/><circle cx="60" cy="60" r="42" stroke="${VP.ink}" stroke-width="2.2"/><path d="M60 60 92.2 33" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round"/><circle cx="60" cy="60" r="2.4" fill="${VP.ink}"/><text x="70" y="40" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">r</text><text x="48" y="77" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">O</text></svg>`,
  },
  {
    id: 'math-circle-diameter',
    cat: 'math',
    label: 'ব্যাসসহ বৃত্ত',
    kw: 'circle diameter ব্যাস বৃত্ত কেন্দ্র মধ্য দিয়ে geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="42" fill="${VP.gold}" opacity=".15"/><circle cx="60" cy="60" r="42" stroke="${VP.ink}" stroke-width="2.2"/><path d="M18 60h84" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round"/><path d="M18 55v10M102 55v10" stroke="${VP.ink}" stroke-width="1.4"/><circle cx="60" cy="60" r="2.4" fill="${VP.ink}"/><text x="60" y="50" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">d</text></svg>`,
  },
  {
    id: 'math-circle-tangent',
    cat: 'math',
    label: 'স্পর্শরেখা',
    kw: 'tangent স্পর্শরেখা বৃত্ত স্পর্শ বিন্দু circle geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><circle cx="85" cy="90" r="55" fill="${VP.sky}" opacity=".18"/><circle cx="85" cy="90" r="55" stroke="${VP.ink}" stroke-width="2.2"/><path d="M140 28v124" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M85 90h55" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M140 82h-8v8" stroke="${VP.ink}" stroke-width="1.4"/><circle cx="140" cy="90" r="3" fill="${VP.deep}"/><text x="73" y="84" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">O</text><text x="152" y="108" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">T</text></svg>`,
  },

  // ───────────── কোণ ─────────────
  {
    id: 'math-angle-acute',
    cat: 'math',
    label: 'সূক্ষ্মকোণ',
    kw: 'acute angle সূক্ষ্মকোণ 45 ডিগ্রি কোণ arc চাপ',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M30 95 56 95A26 26 0 0 0 48.4 76.6z" fill="${VP.amber}" opacity=".25"/><path d="M30 95h75M30 95 79.5 45.5" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M56 95A26 26 0 0 0 48.4 76.6" stroke="${VP.ink}" stroke-width="1.6"/><circle cx="30" cy="95" r="2.2" fill="${VP.ink}"/><text x="74" y="77" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">45°</text></svg>`,
  },
  {
    id: 'math-angle-right',
    cat: 'math',
    label: 'সমকোণ',
    kw: 'right angle সমকোণ 90 ডিগ্রি লম্ব কোণ বর্গ চিহ্ন',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M30 90h75M30 90V15" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M30 74h16v16h-16z" fill="${VP.sky}" opacity=".25" stroke="${VP.ink}" stroke-width="1.6" stroke-linejoin="round"/><circle cx="30" cy="90" r="2.2" fill="${VP.ink}"/><text x="58" y="64" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">90°</text></svg>`,
  },
  {
    id: 'math-angle-obtuse',
    cat: 'math',
    label: 'স্থূলকোণ',
    kw: 'obtuse angle স্থূলকোণ 120 ডিগ্রি কোণ arc চাপ',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M40 95 64 95A24 24 0 0 0 28 74.2z" fill="${VP.leaf}" opacity=".2"/><path d="M40 95h72M40 95 7.5 38.7" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M64 95A24 24 0 0 0 28 74.2" stroke="${VP.ink}" stroke-width="1.6"/><circle cx="40" cy="95" r="2.2" fill="${VP.ink}"/><text x="60" y="61" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">120°</text></svg>`,
  },

  // ───────────── স্থানাঙ্ক জ্যামিতি ─────────────
  {
    id: 'math-axes',
    cat: 'math',
    label: 'স্থানাঙ্ক অক্ষ',
    kw: 'coordinate axes স্থানাঙ্ক অক্ষ origin মূলবিন্দু x y graph লেখচিত্র',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M25 140H215" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M207 134 215 140l-8 6" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 155V25" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M114 33 120 25l6 8" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 136v8M180 136v8M116 100h8M116 56h8" stroke="${VP.slate}" stroke-width="1.4"/><circle cx="120" cy="140" r="2.4" fill="${VP.ink}"/><text x="111" y="158" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">O</text><text x="226" y="144" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">x</text><text x="131" y="30" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">y</text></svg>`,
  },
  {
    id: 'math-parabola',
    cat: 'math',
    label: 'অধিবৃত্ত',
    kw: 'parabola অধিবৃত্ত পরাবৃত্ত graph লেখচিত্র quadratic দ্বিঘাত y=ax2',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M20 145H220" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M212 139 220 145l-8 6" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M120 168V22" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M114 30 120 22l6 8" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 45Q120 245 180 45" stroke="${VP.terracotta}" stroke-width="2.4" stroke-linecap="round"/><circle cx="120" cy="145" r="2.4" fill="${VP.ink}"/><text x="186" y="62" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">y = ax²</text><text x="111" y="161" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">O</text><text x="229" y="151" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">x</text><text x="131" y="28" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">y</text></svg>`,
  },
  {
    id: 'math-sine-curve',
    cat: 'math',
    label: 'সাইন রেখা',
    kw: 'sine wave সাইন রেখা তরঙ্গ graph লেখচিত্র trigonometry ত্রিকোণমিতি',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M24 90H224" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M216 84 224 90l-8 6" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 152V40" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M54 48 60 40l6 8" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 90Q85 40 110 90T160 90T210 90" stroke="${VP.sky}" stroke-width="2.4" stroke-linecap="round"/><path d="M110 86v8M160 86v8M210 86v8" stroke="${VP.slate}" stroke-width="1.4"/><text x="170" y="42" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">y = sin x</text><text x="50" y="107" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">O</text><text x="229" y="107" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">x</text><text x="71" y="36" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">y</text></svg>`,
  },

  // ───────────── সেট ও ভেনচিত্র ─────────────
  {
    id: 'math-venn2',
    cat: 'math',
    label: 'ভেনচিত্র (২-সেট)',
    kw: 'venn diagram ভেনচিত্র সেট set union intersection দুটি বৃত্ত',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><rect x="22" y="18" width="196" height="148" stroke="${VP.slate}" stroke-width="1.6"/><circle cx="95" cy="92" r="54" fill="${VP.gold}" opacity=".22"/><circle cx="148" cy="92" r="54" fill="${VP.sky}" opacity=".22"/><circle cx="95" cy="92" r="54" stroke="${VP.ink}" stroke-width="2.2"/><circle cx="148" cy="92" r="54" stroke="${VP.ink}" stroke-width="2.2"/><text x="34" y="36" font-family="${VFONT}" fill="${VP.ink}" font-size="11">U</text><text x="72" y="66" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="13">A</text><text x="171" y="66" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="13">B</text></svg>`,
  },
  {
    id: 'math-venn3',
    cat: 'math',
    label: 'ভেনচিত্র (৩-সেট)',
    kw: 'venn diagram ভেনচিত্র সেট set union intersection তিনটি বৃত্ত',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><circle cx="94" cy="72" r="46" fill="${VP.gold}" opacity=".2"/><circle cx="146" cy="72" r="46" fill="${VP.sky}" opacity=".2"/><circle cx="120" cy="112" r="46" fill="${VP.leaf}" opacity=".2"/><circle cx="94" cy="72" r="46" stroke="${VP.ink}" stroke-width="2.2"/><circle cx="146" cy="72" r="46" stroke="${VP.ink}" stroke-width="2.2"/><circle cx="120" cy="112" r="46" stroke="${VP.ink}" stroke-width="2.2"/><text x="76" y="52" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="13">A</text><text x="164" y="52" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="13">B</text><text x="120" y="148" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="13">C</text></svg>`,
  },

  // ───────────── মাপার যন্ত্র ─────────────
  {
    id: 'math-protractor',
    cat: 'math',
    label: 'প্রোট্র্যাক্টর',
    kw: 'protractor প্রোট্র্যাক্টর কোণ মাপা অর্ধবৃত্ত ডিগ্রি যন্ত্র',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M35 150A85 85 0 0 1 205 150z" fill="${VP.cream}" opacity=".45"/><path d="M35 150A85 85 0 0 1 205 150" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M28 150H212" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M50 150A70 70 0 0 1 190 150" stroke="${VP.ink}" stroke-width="1.4"/><path d="M205 150H193M193.6 107.5 183.2 113.5M162.5 76.4 156.5 86.8M120 65v12M77.5 76.4 83.5 86.8M46.4 107.5 56.8 113.5M35 150h12" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round"/><path d="M202.1 128 197.3 129.3M180.1 89.9 176.6 93.4M142 67.9 140.7 72.8M98 67.9 99.3 72.8M59.9 89.9 63.4 93.4M37.9 128 42.7 129.3" stroke="${VP.ink}" stroke-width="1.4" stroke-linecap="round"/><path d="M120 150 150 98" stroke="${VP.ink}" stroke-width="1.8" stroke-linecap="round"/><circle cx="120" cy="150" r="2.4" fill="${VP.ink}"/></svg>`,
  },
  {
    id: 'math-compass-tool',
    cat: 'math',
    label: 'অঙ্কন কম্পাস',
    kw: 'compass drawing অঙ্কন কম্পাস বৃত্ত আঁকা জ্যামিতি যন্ত্র পেন্সিল',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><path d="M63.5 53.8A51 51 0 0 1 88.2 89.1" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round"/><path d="M60 26 38 98M60 26 84 90l5 11" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="60" cy="18" r="8" fill="${VP.gold}" opacity=".35" stroke="${VP.ink}" stroke-width="2"/><circle cx="60" cy="26" r="2.5" fill="${VP.ink}"/></svg>`,
  },
  {
    id: 'math-ruler',
    cat: 'math',
    label: 'স্কেল/রুলার',
    kw: 'ruler scale স্কেল রুলার মাপ সেন্টিমিটার যন্ত্র',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><rect x="25" y="60" width="190" height="60" rx="4" fill="${VP.amber}" opacity=".25"/><rect x="25" y="60" width="190" height="60" rx="4" stroke="${VP.ink}" stroke-width="2.2"/><path d="M45 60v18M75 60v18M105 60v18M135 60v18M165 60v18M195 60v18" stroke="${VP.ink}" stroke-width="1.6"/><path d="M60 60v12M90 60v12M120 60v12M150 60v12M180 60v12" stroke="${VP.ink}" stroke-width="1.4"/><path d="M37.5 60v7M52.5 60v7M67.5 60v7M82.5 60v7M97.5 60v7M112.5 60v7M127.5 60v7M142.5 60v7M157.5 60v7M172.5 60v7M187.5 60v7M202.5 60v7" stroke="${VP.ink}" stroke-width="1.4"/><text x="45" y="97" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">1</text><text x="75" y="97" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">2</text><text x="105" y="97" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">3</text><text x="135" y="97" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">4</text><text x="165" y="97" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">5</text><text x="195" y="97" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">6</text></svg>`,
  },

  // ───────────── ঘন জ্যামিতি (৩ডি) ─────────────
  {
    id: 'math-cube-3d',
    cat: 'math',
    label: 'ঘনক (৩ডি)',
    kw: 'cube ঘনক 3d ত্রিমাত্রিক ঘনফল solid isometric geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M70 70 105 40H185L150 70z" fill="${VP.sky}" opacity=".25"/><path d="M150 70 185 40V120L150 150z" fill="${VP.gold}" opacity=".22"/><path d="M70 70h80v80H70z" fill="${VP.terracotta}" opacity=".2"/><path d="M70 70h80v80H70zM105 40H185V120M70 70 105 40M150 70 185 40M150 150 185 120" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M70 150 105 120H185M105 120V40" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  {
    id: 'math-cylinder-3d',
    cat: 'math',
    label: 'সিলিন্ডার (৩ডি)',
    kw: 'cylinder সিলিন্ডার চোঙ 3d ত্রিমাত্রিক ঘনফল geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M65 55v85a55 18 0 0 0 110 0V55a55 18 0 0 1-110 0z" fill="${VP.sky}" opacity=".15"/><ellipse cx="120" cy="55" rx="55" ry="18" fill="${VP.sky}" opacity=".25" stroke="${VP.ink}" stroke-width="2.2"/><path d="M65 55v85M175 55v85" stroke="${VP.ink}" stroke-width="2.2"/><path d="M65 140a55 18 0 0 0 110 0" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M65 140a55 18 0 0 1 110 0" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M179 55h13M179 140h13" stroke="${VP.slate}" stroke-width="1.4"/><path d="M192 55v85" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M188 63 192 55l4 8M188 132 192 140l4-8" stroke="${VP.ink}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><text x="204" y="102" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="12">h</text></svg>`,
  },
  {
    id: 'math-cone-3d',
    cat: 'math',
    label: 'শঙ্কু (৩ডি)',
    kw: 'cone শঙ্কু 3d ত্রিমাত্রিক ঘনফল চূড়া geometry',
    w: 300,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 180" fill="none"><path d="M120 28 62 140a58 20 0 0 0 116 0z" fill="${VP.terracotta}" opacity=".18"/><path d="M120 28 62 140M120 28 178 140" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M62 140a58 20 0 0 0 116 0" stroke="${VP.ink}" stroke-width="2.2" stroke-linecap="round"/><path d="M62 140a58 20 0 0 1 116 0" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M120 28v104" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><path d="M120 132h7v8" stroke="${VP.ink}" stroke-width="1.4"/><path d="M120 140h58" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/><circle cx="120" cy="28" r="2.2" fill="${VP.ink}"/><text x="129" y="98" font-family="${VFONT}" fill="${VP.ink}" font-size="11">h</text><text x="149" y="133" text-anchor="middle" font-family="${VFONT}" fill="${VP.ink}" font-size="11">r</text></svg>`,
  },
  {
    id: 'math-sphere-3d',
    cat: 'math',
    label: 'গোলক (৩ডি)',
    kw: 'sphere গোলক 3d ত্রিমাত্রিক বৃত্ত equator নিরক্ষরেখা geometry',
    w: 90,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><circle cx="60" cy="60" r="46" fill="${VP.sky}" opacity=".18"/><circle cx="60" cy="60" r="46" stroke="${VP.ink}" stroke-width="2.2"/><ellipse cx="60" cy="64" rx="46" ry="13" stroke="${VP.slate}" stroke-width="1.6" stroke-dasharray="4 4"/></svg>`,
  },
];
