/**
 * আকৃতি ফ্রেম ক্যাটালগ — অলংকৃত ব্যানার/ফ্রেম/ব্যাজ (ভিতরে লেখা যায়)।
 *
 * ব্যবহারকারী: design-ext.tsx (TipTap NodeView + renderHTML), static-content.tsx,
 * insert-tab.tsx (গ্যালারি), export-docx.ts — সবাই এই ক্যাটালগ থেকেই আঁকে।
 *
 * স্টোরেজ কনট্রাক্ট:
 *  <div class="doc-shape" data-shape data-fill data-orn data-tcolor style="[shell inline]">
 *    <span data-shape-orn="..." style="[inline]"> [inline svg] </span> ...
 *    <div class="doc-shape-content" style="[inline]"> [editable blocks] </div>
 *  </div>
 *
 * সব স্টাইল inline — এডিটর, প্রিন্ট, HTML এক্সপোর্ট সবখানে একই রকম দেখায়।
 * SVG অলংকার stroke="currentColor" — রঙ wrapper span-এর color থেকে আসে।
 */

export type ShapeCat = 'banner' | 'frame' | 'badge';

export interface ShapeFrameAttrs {
  shape: string;
  /** মূল রং — ব্যানারের পটভূমি / ফ্রেমের বর্ডার / ব্যাজের ভরাট */
  fill: string;
  /** অলংকারের রং */
  orn: string;
  /** লেখার রং — '' মানে ডকুমেন্টের রংই */
  tcolor: string;
}

export interface ShapeOrn {
  key: string;
  /** wrapper span-এর inline CSS টেক্সট */
  style: string;
  /** SVG মার্কআপ */
  svg: string;
}

export interface ShapeDef {
  id: string;
  label: string;
  /** সার্চ কীওয়ার্ড */
  kw: string;
  cat: ShapeCat;
  defaults: { fill: string; orn: string; tcolor: string };
  /** বাইরের div-এর ইনলাইন স্টাইল (camelCase) — position:relative স্বয়ংক্রিয়ভাবে যোগ হয় */
  shell: (a: ShapeFrameAttrs) => Record<string, string>;
  /** অলংকার সমূহ */
  orns: (a: ShapeFrameAttrs) => ShapeOrn[];
  /** লেখার কনটেইনারের ইনলাইন স্টাইল (camelCase) */
  content: (a: ShapeFrameAttrs) => Record<string, string>;
}

// ═══════════════════ SVG অলংকার লাইব্রেরি ═══════════════════

/** ডাবল-স্পাইরাল স্ক্রল কারুকাজ (স্ক্রিনশটের মতো ফ্লাওয়ারিশ) — 150×52 */
const ORN_CURL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 150 52" width="100%" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M148 26 H58"/>` +
  `<path d="M58 26 C46 26 40 14 30 12 C20 10 11 17 13 25 C15 33 26 33 26 25 C26 19 19 17 15 21"/>` +
  `<path d="M58 26 C48 26 44 38 34 40 C24 42 15 35 17 27 C19 19 30 20 30 27 C30 33 23 35 20 30"/>` +
  `<path d="M58 26 C52 18 54 8 62 7 C68 6 71 12 67 15 C64 18 59 15 61 11"/>` +
  `<circle cx="138" cy="26" r="3" fill="currentColor" stroke="none"/>` +
  `<circle cx="128" cy="17" r="1.8" fill="currentColor" stroke="none"/>` +
  `<circle cx="128" cy="35" r="1.8" fill="currentColor" stroke="none"/>` +
  `</svg>`;

/** L-আকৃতির কোণার কারুকাজ (ডাবল রেখা + কার্ল) — 64×64 */
const ORN_CORNER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M62 3 H16 C8 3 3 8 3 16 V62"/>` +
  `<path d="M62 12 H21 C15 12 12 15 12 21 V62"/>` +
  `<path d="M34 32 C41 32 43 37 38 40 C34 42 30 38 32 34"/>` +
  `<circle cx="25" cy="25" r="2.4" fill="currentColor" stroke="none"/>` +
  `</svg>`;

/** ফুল-রোজেট — 44×44 */
const ORN_FLOWER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 44" width="100%" fill="currentColor">` +
  `<circle cx="22" cy="22" r="4.2"/>` +
  `<ellipse cx="22" cy="9.5" rx="4" ry="6.5"/>` +
  `<ellipse cx="22" cy="34.5" rx="4" ry="6.5"/>` +
  `<ellipse cx="9.5" cy="22" rx="6.5" ry="4"/>` +
  `<ellipse cx="34.5" cy="22" rx="6.5" ry="4"/>` +
  `<ellipse cx="13.5" cy="13.5" rx="4.6" ry="3.1" transform="rotate(-45 13.5 13.5)"/>` +
  `<ellipse cx="30.5" cy="13.5" rx="4.6" ry="3.1" transform="rotate(45 30.5 13.5)"/>` +
  `<ellipse cx="13.5" cy="30.5" rx="4.6" ry="3.1" transform="rotate(45 13.5 30.5)"/>` +
  `<ellipse cx="30.5" cy="30.5" rx="4.6" ry="3.1" transform="rotate(-45 30.5 30.5)"/>` +
  `</svg>`;

/** রেখা + ডায়মন্ড + রেখা (নামফলক) — 170×24 */
const ORN_LINEDIAMOND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 170 24" width="100%" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">` +
  `<path d="M0 12 H60"/>` +
  `<path d="M110 12 H170"/>` +
  `<path d="M85 3 L96 12 L85 21 L74 12 Z" fill="currentColor" stroke="none"/>` +
  `<circle cx="65" cy="12" r="2.2" fill="currentColor" stroke="none"/>` +
  `<circle cx="105" cy="12" r="2.2" fill="currentColor" stroke="none"/>` +
  `</svg>`;

/** রিবনের ভাঁজ লেজ — 42×64 */
const ORN_RIBBONTAIL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 42 64" width="100%" fill="currentColor">` +
  `<path d="M42 0 H9 L1 6 V58 L9 64 H42 L28 32 Z"/>` +
  `</svg>`;

/** ছোট ডায়মন্ড — 24×24 */
const ORN_DIAMOND = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="100%" fill="currentColor">` +
  `<path d="M12 2 L19 12 L12 22 L5 12 Z"/>` +
  `</svg>`;

/** পাতা-লতা স্প্রিগ — 70×36 */
const ORN_LEAF = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 36" width="100%" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M68 18 H22"/>` +
  `<path d="M22 18 C16 18 10 12 4 13 C8 18 14 20 22 18 Z" fill="currentColor" stroke="none"/>` +
  `<path d="M40 18 C36 12 30 8 24 10 C28 15 34 18 40 18 Z" fill="currentColor" stroke="none"/>` +
  `<path d="M40 18 C36 24 30 28 24 26 C28 21 34 18 40 18 Z" fill="currentColor" stroke="none"/>` +
  `<circle cx="60" cy="18" r="2" fill="currentColor" stroke="none"/>` +
  `</svg>`;

// ═══════════════════ হেল্পার ═══════════════════

/** অলংকার wrapper-এর বেস স্টাইল */
function ornStyle(extra: string, color: string): string {
  return `position:absolute;line-height:0;color:${color || 'inherit'};${extra}`;
}

/** camelCase স্টাইল অবজেক্ট → CSS টেক্সট (renderHTML সিরিয়ালাইজেশনের জন্য) */
export function shapeStyleText(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)}:${v}`)
    .join(';');
}

/** CSS টেক্সট → camelCase স্টাইল অবজেক্ট (React NodeView-র জন্য) */
export function cssTextToStyle(css: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i <= 0) continue;
    const prop = decl.slice(0, i).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[prop] = decl.slice(i + 1).trim();
  }
  return out;
}

/** বাঁ-ডান জোড়া কার্ল অলংকার */
function curlPair(color: string, widthPx: number, insetPx: number): ShapeOrn[] {
  const st = `top:50%;transform:translateY(-50%);width:${widthPx}px;`;
  return [
    { key: 'curl-l', style: ornStyle(`left:${insetPx}px;${st}`, color), svg: ORN_CURL },
    { key: 'curl-r', style: ornStyle(`right:${insetPx}px;transform:translateY(-50%) scaleX(-1);width:${widthPx}px;`, color), svg: ORN_CURL },
  ];
}

/** চার কোণার কারুকাজ */
function cornerQuad(color: string, sizePx: number, insetPx: number): ShapeOrn[] {
  const s = `width:${sizePx}px;height:${sizePx}px;`;
  return [
    { key: 'c-tl', style: ornStyle(`top:${insetPx}px;left:${insetPx}px;${s}`, color), svg: ORN_CORNER },
    { key: 'c-tr', style: ornStyle(`top:${insetPx}px;right:${insetPx}px;transform:rotate(90deg);${s}`, color), svg: ORN_CORNER },
    { key: 'c-br', style: ornStyle(`bottom:${insetPx}px;right:${insetPx}px;transform:rotate(180deg);${s}`, color), svg: ORN_CORNER },
    { key: 'c-bl', style: ornStyle(`bottom:${insetPx}px;left:${insetPx}px;transform:rotate(270deg);${s}`, color), svg: ORN_CORNER },
  ];
}

// ═══════════════════ ক্যাটালগ ═══════════════════

export const SHAPE_CATEGORIES: Array<{ id: ShapeCat; label: string }> = [
  { id: 'banner', label: 'ব্যানার' },
  { id: 'frame', label: 'ফ্রেম' },
  { id: 'badge', label: 'ব্যাজ ও প্লেট' },
];

export const SHAPE_DEFS: ShapeDef[] = [
  // ───────────── ব্যানার ─────────────
  {
    id: 'banner-dark',
    label: 'কালো কারুকাজ ব্যানার',
    kw: 'কালো ব্যানার কারুকাজ dark ornament banner পরিচিতি শিরোনাম',
    cat: 'banner',
    defaults: { fill: '#171a21', orn: '#d8dce3', tcolor: '#ffffff' },
    shell: (a) => ({
      background: a.fill,
      borderRadius: '3px',
      padding: '18px 96px',
      minHeight: '54px',
      margin: '0.6em 0',
      textAlign: 'center',
      boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
    }),
    orns: (a) => curlPair(a.orn, 72, 10),
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '700',
      fontSize: '1.2em',
      letterSpacing: '0.02em',
    }),
  },
  {
    id: 'banner-gold',
    label: 'সোনালি অলংকৃত ব্যানার',
    kw: 'সোনালি গোল্ড ব্যানার gold banner অলংকার',
    cat: 'banner',
    defaults: { fill: '#b08a2e', orn: '#5c430e', tcolor: '#fff8e1' },
    shell: (a) => ({
      background: `linear-gradient(180deg, ${a.fill}, ${a.fill} 55%, rgba(0,0,0,0.18))`,
      backgroundColor: a.fill,
      borderRadius: '4px',
      padding: '18px 96px',
      minHeight: '54px',
      margin: '0.6em 0',
      textAlign: 'center',
      boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
    }),
    orns: (a) => curlPair(a.orn, 72, 10),
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '700',
      fontSize: '1.2em',
      letterSpacing: '0.03em',
      textShadow: '0 1px 2px rgba(0,0,0,0.35)',
    }),
  },
  {
    id: 'banner-ribbon',
    label: 'রিবন ব্যানার',
    kw: 'রিবন ব্যানার ribbon লাল বক্স ফিতা',
    cat: 'banner',
    defaults: { fill: '#9f1239', orn: '#6d0f28', tcolor: '#ffffff' },
    shell: (a) => ({
      background: a.fill,
      borderRadius: '2px',
      padding: '16px 56px',
      minHeight: '52px',
      margin: '0.9em 28px',
      textAlign: 'center',
      boxShadow: '0 3px 7px rgba(0,0,0,0.3)',
    }),
    orns: (a) => [
      { key: 'tail-l', style: ornStyle('left:-22px;top:50%;transform:translateY(-50%);width:38px;', a.orn), svg: ORN_RIBBONTAIL },
      { key: 'tail-r', style: ornStyle('right:-22px;top:50%;transform:translateY(-50%) scaleX(-1);width:38px;', a.orn), svg: ORN_RIBBONTAIL },
    ],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '700',
      fontSize: '1.15em',
      letterSpacing: '0.04em',
    }),
  },
  {
    id: 'banner-classic',
    label: 'ক্লাসিক ফুল প্লেট',
    kw: 'ক্লাসিক ফুল প্লেট cream তুলো classic flower',
    cat: 'banner',
    defaults: { fill: '#f7efdc', orn: '#9a3412', tcolor: '#7c2d12' },
    shell: (a) => ({
      background: a.fill,
      border: '1.5px solid #d3ba8a',
      borderRadius: '6px',
      padding: '14px 72px',
      minHeight: '50px',
      margin: '0.6em 0',
      textAlign: 'center',
    }),
    orns: (a) => [
      { key: 'fl-l', style: ornStyle('left:16px;top:50%;transform:translateY(-50%);width:30px;', a.orn), svg: ORN_FLOWER },
      { key: 'fl-r', style: ornStyle('right:16px;top:50%;transform:translateY(-50%);width:30px;', a.orn), svg: ORN_FLOWER },
    ],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '600',
      fontSize: '1.12em',
    }),
  },
  {
    id: 'banner-modern',
    label: 'মডার্ন গ্র্যাডিয়েন্ট প্লেট',
    kw: 'মডার্ন গ্র্যাডিয়েন্ট প্লেট modern gradient স্লেট',
    cat: 'banner',
    defaults: { fill: '#1e293b', orn: '#cbd5e1', tcolor: '#f8fafc' },
    shell: (a) => ({
      background: `linear-gradient(135deg, ${a.fill}, ${a.fill}dd 60%, ${a.fill}99)`,
      backgroundColor: a.fill,
      borderRadius: '10px',
      padding: '16px 110px',
      minHeight: '50px',
      margin: '0.6em 0',
      textAlign: 'center',
      boxShadow: '0 2px 10px rgba(15,23,42,0.35)',
    }),
    orns: (a) => [
      { key: 'ld-l', style: ornStyle('left:18px;top:50%;transform:translateY(-50%);width:80px;', a.orn), svg: ORN_LINEDIAMOND },
      { key: 'ld-r', style: ornStyle('right:18px;top:50%;transform:translateY(-50%) scaleX(-1);width:80px;', a.orn), svg: ORN_LINEDIAMOND },
    ],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '700',
      fontSize: '1.12em',
      letterSpacing: '0.06em',
    }),
  },

  // ───────────── ফ্রেম ─────────────
  {
    id: 'frame-double',
    label: 'ডাবল রেখা ফ্রেম',
    kw: 'ডাবল রেখা ফ্রেম double frame বর্ডার ঘর',
    cat: 'frame',
    defaults: { fill: '#9f1239', orn: '#9f1239', tcolor: '' },
    shell: (a) => ({
      border: `4px double ${a.fill}`,
      borderRadius: '10px',
      padding: '16px 22px',
      minHeight: '56px',
      margin: '0.6em 0',
      textAlign: 'center',
      background: 'transparent',
    }),
    orns: () => [],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '600',
    }),
  },
  {
    id: 'frame-corner',
    label: 'কোণায় কারুকাজ ফ্রেম',
    kw: 'কোণা কারুকাজ ফ্রেম corner ornament frame সোনালি',
    cat: 'frame',
    defaults: { fill: '#a16207', orn: '#b08a2e', tcolor: '' },
    shell: (a) => ({
      border: `1.5px solid ${a.fill}`,
      borderRadius: '2px',
      padding: '20px 26px',
      minHeight: '60px',
      margin: '0.6em 0',
      textAlign: 'center',
      background: 'transparent',
    }),
    orns: (a) => cornerQuad(a.orn, 34, 7),
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '600',
    }),
  },
  {
    id: 'frame-oval',
    label: 'ডিম্বাকৃতি ফ্রেম',
    kw: 'ডিম্বাকৃতি ফ্রেম ডিম oval ellipse গোল বৃত্ত',
    cat: 'frame',
    defaults: { fill: '#b91c1c', orn: '#b91c1c', tcolor: '' },
    shell: (a) => ({
      border: `3px double ${a.fill}`,
      borderRadius: '50%',
      padding: '30px 44px',
      minHeight: '130px',
      margin: '0.7em auto',
      maxWidth: '420px',
      textAlign: 'center',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }),
    orns: (a) => [
      { key: 'dm-top', style: ornStyle('top:-9px;left:50%;transform:translateX(-50%);width:16px;', a.orn), svg: ORN_DIAMOND },
      { key: 'dm-bot', style: ornStyle('bottom:-9px;left:50%;transform:translateX(-50%);width:16px;', a.orn), svg: ORN_DIAMOND },
    ],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '600',
    }),
  },
  {
    id: 'frame-arch',
    label: 'মেহরাব ফ্রেম',
    kw: 'মেহরাব ফ্রেম arch ইসলামি মসজিদ গম্বুজ',
    cat: 'frame',
    defaults: { fill: '#065f46', orn: '#d4a437', tcolor: '' },
    shell: (a) => ({
      border: `2.5px solid ${a.fill}`,
      borderRadius: '220px 220px 10px 10px',
      padding: '36px 24px 18px',
      minHeight: '110px',
      margin: '0.7em 24px',
      textAlign: 'center',
      background: 'transparent',
    }),
    orns: (a) => [
      { key: 'dm-top', style: ornStyle('top:-11px;left:50%;transform:translateX(-50%);width:18px;', a.orn), svg: ORN_DIAMOND },
      { key: 'dm-bot', style: ornStyle('bottom:-10px;left:50%;transform:translateX(-50%);width:14px;', a.orn), svg: ORN_DIAMOND },
    ],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '600',
    }),
  },
  {
    id: 'frame-vintage',
    label: 'ভিনটেজ স্ক্রল ফ্রেম',
    kw: 'ভিনটেজ স্ক্রল ফ্রেম vintage scroll পুরনো কারুকাজ',
    cat: 'frame',
    defaults: { fill: '#5d4037', orn: '#8d6e63', tcolor: '' },
    shell: (a) => ({
      border: `1.5px solid ${a.fill}`,
      borderRadius: '8px',
      padding: '18px 88px',
      minHeight: '58px',
      margin: '0.6em 0',
      textAlign: 'center',
      background: 'transparent',
    }),
    orns: (a) => curlPair(a.orn, 64, 12),
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '600',
    }),
  },

  // ───────────── ব্যাজ ও প্লেট ─────────────
  {
    id: 'badge-circle',
    label: 'গোল ব্যাজ',
    kw: 'গোল ব্যাজ badge circle পদক মেডেল',
    cat: 'badge',
    defaults: { fill: '#9f1239', orn: '#fecdd3', tcolor: '#ffffff' },
    shell: (a) => ({
      background: a.fill,
      borderRadius: '50%',
      padding: '34px 40px',
      minHeight: '140px',
      minWidth: '170px',
      maxWidth: '300px',
      margin: '0.7em auto',
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 3px 9px rgba(0,0,0,0.28)',
    }),
    orns: (a) => [
      { key: 'dm-top', style: ornStyle('top:14px;left:50%;transform:translateX(-50%);width:12px;', a.orn), svg: ORN_DIAMOND },
      { key: 'dm-bot', style: ornStyle('bottom:14px;left:50%;transform:translateX(-50%);width:12px;', a.orn), svg: ORN_DIAMOND },
    ],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '700',
      fontSize: '1.1em',
    }),
  },
  {
    id: 'plate-line',
    label: 'নামফলক (রেখা-ডায়মন্ড)',
    kw: 'নামফলক প্লেট plate রেখা ডায়মন্ড line লেবেল',
    cat: 'badge',
    defaults: { fill: 'transparent', orn: '#475569', tcolor: '' },
    shell: () => ({
      padding: '12px 120px',
      minHeight: '44px',
      margin: '0.5em 0',
      textAlign: 'center',
      background: 'transparent',
    }),
    orns: (a) => [
      { key: 'ld-l', style: ornStyle('left:0;top:50%;transform:translateY(-50%);width:112px;', a.orn), svg: ORN_LINEDIAMOND },
      { key: 'ld-r', style: ornStyle('right:0;top:50%;transform:translateY(-50%) scaleX(-1);width:112px;', a.orn), svg: ORN_LINEDIAMOND },
    ],
    content: (a) => ({
      color: a.tcolor || 'inherit',
      fontWeight: '600',
      fontSize: '1.08em',
      letterSpacing: '0.04em',
    }),
  },
];

/** নাম → ডেফ ম্যাপ */
export const SHAPE_BY_ID = new Map<string, ShapeDef>(SHAPE_DEFS.map((d) => [d.id, d]));

export function getShape(id: string): ShapeDef | undefined {
  return SHAPE_BY_ID.get(id);
}

/** ডিফল্ট অ্যাট্রসহ সম্পূর্ণ অ্যাট্র — undefined ওভাররাইড উপেক্ষা হয় */
export function fullShapeAttrs(shapeId: string, overrides?: Partial<ShapeFrameAttrs>): ShapeFrameAttrs {
  const def = SHAPE_BY_ID.get(shapeId) ?? SHAPE_DEFS[0];
  const base: ShapeFrameAttrs = {
    shape: def.id,
    fill: def.defaults.fill,
    orn: def.defaults.orn,
    tcolor: def.defaults.tcolor,
  };
  if (!overrides) return base;
  for (const [k, v] of Object.entries(overrides)) {
    if (v !== undefined && v !== '') {
      (base as unknown as Record<string, string>)[k] = v;
    }
  }
  return base;
}

/** DOM element থেকে অ্যাট্র পড়া (static-content / এক্সপোর্ট) */
export function readShapeAttrs(el: Element): ShapeFrameAttrs {
  return fullShapeAttrs(
    el.getAttribute('data-shape') ?? 'banner-dark',
    {
      fill: el.getAttribute('data-fill') || undefined,
      orn: el.getAttribute('data-orn') || undefined,
      tcolor: el.getAttribute('data-tcolor') || undefined,
    },
  );
}

/** কনটেন্ট div খুঁজে বের করা (storage HTML থেকে) */
export function findShapeContentEl(el: Element): Element {
  const kid = el.querySelector(':scope > div.doc-shape-content');
  return kid ?? el;
}

/** ডকুমেন্টে ব্যবহৃত অন্যান্য রঙের প্রিসেট (গ্যালারি টুলবার) */
export const SHAPE_COLOR_PRESETS: string[] = [
  '#171a21', '#334155', '#9f1239', '#b91c1c', '#b08a2e', '#a16207',
  '#0d9488', '#065f46', '#5d4037', '#f7efdc', '#e2e8f0', '#ffffff',
];
