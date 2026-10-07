/**
 * স্টিকার ক্যাটালগ — রঙিন SVG অলংকরণ (বাংলা মোটিফ + বই-ডিজাইন সামগ্রী)।
 *
 * - প্রতিটি স্টিকার = স্বয়ংসম্পূর্ণ inline SVG (viewBox 0 0 64 64)
 * - মূল আকৃতি currentColor — ডায়ালগের রং-পিকার কাজ করে
 * - গৌণ রং নির্দিষ্ট প্যালেট (উষ্ণ এডিটরিয়াল টোন) — রং না বদলালেও সুন্দর
 * - স্টোরেজ কনট্রাক্ট: <span class="doc-sticker" data-sid data-size data-color style> [svg] </span>
 *   নিজের আপলোড: data-src (dataURL) সহ একই স্প্যান, ভিতরে <img>
 *
 * ব্যবহারকারী: design-ext.tsx (DocSticker নোড), asset-store-dialog.tsx, static-content.tsx,
 * export-docx.ts — সবাই এই ক্যাটালগ থেকেই আঁকে।
 */

export type StickerCat = 'motif' | 'utility' | 'nature' | 'fun';

export interface StickerDef {
  id: string;
  label: string;
  /** সার্চ কীওয়ার্ড */
  kw: string;
  cat: StickerCat;
  svg: string;
}

export const STICKER_CAT_LABELS: Record<StickerCat, string> = {
  motif: 'বাংলা মোটিফ',
  nature: 'প্রকৃতি',
  utility: 'বই-সামগ্রী',
  fun: 'মজার স্টিকার',
};

/** সাধারণ অ্যাকসেন্ট প্যালেট — উষ্ণ, ছাপায় নির্ভরযোগ্য */
const P = {
  gold: '#c8a24a',
  terracotta: '#b3593b',
  leaf: '#5d7a4e',
  deep: '#8a3b3b',
  cream: '#f4ead2',
  ink: '#3d3229',
  sky: '#5f7d95',
} as const;

export const STICKER_DEFS: StickerDef[] = [
  // ───────────── বাংলা মোটিফ ─────────────
  {
    id: 'alpana',
    label: 'আলপনা',
    kw: 'alpana আলপনা নকশা লতা মোটিফ অলংকার',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 6c-4 8-14 10-20 8 4 6 3 12-4 16 8 2 10 8 8 16 6-4 12-2 16 4 4-6 10-8 16-4-2-8 0-14 8-16-7-4-8-10-4-16-6 2-16 0-20-8z" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="32" cy="30" r="6" fill="currentColor" opacity=".85"/><circle cx="32" cy="30" r="10" stroke="${P.gold}" stroke-width="1.6" stroke-dasharray="3 3"/><path d="M32 52c-3 0-5 2-5 4h10c0-2-2-4-5-4z" fill="currentColor" opacity=".6"/></svg>`,
  },
  {
    id: 'boat',
    label: 'নৌকা',
    kw: 'boat নৌকা বৈঠা নদী গ্রাম বাংলা',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M8 40h48l-6 10H14L8 40z" fill="currentColor" opacity=".9"/><path d="M32 8v32" stroke="currentColor" stroke-width="2.6"/><path d="M32 10c10 4 14 10 14 16H32V10z" fill="${P.terracotta}"/><path d="M30 12c-8 4-12 9-12 14h12V12z" fill="${P.gold}"/><path d="M4 54c4 0 4 3 8 3s4-3 8-3 4 3 8 3 4-3 8-3 4 3 8 3 4-3 8-3 4 3 8 3" stroke="${P.sky}" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'fish',
    label: 'মাছ',
    kw: 'fish মাছ ইলিশ নদী',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M8 32c8-10 18-14 28-12 6 1 12 6 16 12-4 6-10 11-16 12-10 2-20-2-28-12z" fill="currentColor" opacity=".92"/><path d="M52 32l8-8v16l-8-8z" fill="${P.gold}"/><circle cx="18" cy="29" r="2.4" fill="${P.cream}"/><path d="M30 22c-2 6-2 14 0 20M40 24c-2 5-2 11 0 16" stroke="${P.cream}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'bird',
    label: 'পাখি (দোয়েল)',
    kw: 'bird পাখি দোয়েল শালিক',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M14 40c2-10 10-18 20-18 6 0 10 4 10 9 0 3-2 5-4 6l6 12H36l-4-8c-8 2-15 1-18-1z" fill="currentColor" opacity=".92"/><circle cx="40" cy="27" r="2" fill="${P.cream}"/><path d="M18 30c-4-2-8-6-8-10 4 0 8 2 10 5" stroke="${P.deep}" stroke-width="2" stroke-linecap="round"/><path d="M44 22l8-6-2 8" fill="${P.gold}"/><path d="M22 49h20M26 49v4M38 49v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'lotus',
    label: 'পদ্ম',
    kw: 'lotus পদ্ম শাপলা ফুল জল',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 12c4 6 5 12 0 20-5-8-4-14 0-20z" fill="currentColor"/><path d="M18 18c6 2 10 7 12 16-8-1-12-7-12-16z" fill="currentColor" opacity=".75"/><path d="M46 18c-6 2-10 7-12 16 8-1 12-7 12-16z" fill="currentColor" opacity=".75"/><path d="M8 34c6 6 14 8 24 8s18-2 24-8c-4 12-13 18-24 18S12 46 8 34z" fill="currentColor" opacity=".55"/><path d="M10 52c6 2 14 3 22 3s16-1 22-3" stroke="${P.sky}" stroke-width="2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'sunface',
    label: 'সূর্যমুখ',
    kw: 'sun সূর্য রোদ মুখ মোটিফ',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="12" fill="currentColor" opacity=".9"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; const x1 = 32 + Math.cos(a) * 16, y1 = 32 + Math.sin(a) * 16, x2 = 32 + Math.cos(a) * 22, y2 = 32 + Math.sin(a) * 22; return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"/>`; }).join('')}</g><circle cx="28" cy="30" r="1.8" fill="${P.ink}"/><circle cx="36" cy="30" r="1.8" fill="${P.ink}"/><path d="M27 36c3 2.6 7 2.6 10 0" stroke="${P.ink}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'moonstar',
    label: 'চাঁদ-তারা',
    kw: 'moon star চাঁদ তারা রাত ঈদ',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M40 8a24 24 0 100 48 20 20 0 110-48z" fill="currentColor" opacity=".92"/><path d="M46 26l2.2 4.8L53 33l-4.8 2.2L46 40l-2.2-4.8L39 33l4.8-2.2L46 26z" fill="${P.gold}"/><circle cx="18" cy="18" r="1.6" fill="${P.gold}"/><circle cx="14" cy="34" r="1.3" fill="${P.gold}"/></svg>`,
  },
  {
    id: 'naksifor',
    label: 'নকশা-কোণ',
    kw: 'corner নকশা কোণ বর্ডার ফ্রেম অলংকার',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M8 8h10v4H12v6H8V8z" fill="currentColor"/><path d="M8 26v-8h4v8H8zM26 8h-8v4h8V8z" fill="currentColor" opacity=".7"/><path d="M14 14c8 0 12 4 12 12" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="30" cy="30" r="3" fill="${P.gold}"/><path d="M14 22c5 1 8 4 9 9M22 14c1 5 4 8 9 9" stroke="${P.gold}" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'kantha',
    label: 'নকশি দাগ',
    kw: 'kantha stitch নকশি কাঁথা সেলাই দাগ বর্ডার',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M6 32h52" stroke="currentColor" stroke-width="2.4" stroke-dasharray="7 4" stroke-linecap="round"/><path d="M12 24l6-6 6 6M40 40l6-6 6 6" stroke="${P.terracotta}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="32" cy="32" r="4" stroke="${P.leaf}" stroke-width="2"/><path d="M6 44h52" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 5" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'rangoli',
    label: 'রঙ্গোলি বৃত্ত',
    kw: 'rangoli রঙ্গোলি বৃত্ত নকশা বৃত্তাকার',
    cat: 'motif',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="32" r="24" stroke="currentColor" stroke-width="2.4"/><circle cx="32" cy="32" r="16" stroke="currentColor" stroke-width="1.6" stroke-dasharray="4 3"/><circle cx="32" cy="32" r="7" fill="currentColor" opacity=".85"/>${Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; const cx = 32 + Math.cos(a) * 20, cy = 32 + Math.sin(a) * 20; return `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="${P.gold}"/>`; }).join('')}</svg>`,
  },
  // ───────────── প্রকৃতি ─────────────
  {
    id: 'butterfly',
    label: 'প্রজাপতি',
    kw: 'butterfly প্রজাপতি রঙ',
    cat: 'nature',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 30C28 18 16 12 10 16c-4 3-2 12 4 16-4 2-4 10 2 12 6 2 12-4 16-14z" fill="currentColor" opacity=".9"/><path d="M32 30c4-12 16-18 22-14 4 3 2 12-4 16 4 2 4 10-2 12-6 2-12-4-16-14z" fill="currentColor" opacity=".7"/><rect x="30.4" y="24" width="3.2" height="24" rx="1.6" fill="${P.ink}"/><path d="M32 24c-2-4-4-6-7-8M32 24c2-4 4-6 7-8" stroke="${P.ink}" stroke-width="1.8" stroke-linecap="round"/><circle cx="20" cy="24" r="2.4" fill="${P.gold}"/><circle cx="44" cy="24" r="2.4" fill="${P.gold}"/></svg>`,
  },
  {
    id: 'tree',
    label: 'গাছ',
    kw: 'tree গাছ বৃক্ষ প্রকৃতি সবুজ',
    cat: 'nature',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="22" r="14" fill="currentColor" opacity=".9"/><circle cx="18" cy="30" r="9" fill="currentColor" opacity=".7"/><circle cx="46" cy="30" r="9" fill="currentColor" opacity=".7"/><path d="M32 36v18M32 44l-7-6M32 48l8-7" stroke="${P.terracotta}" stroke-width="2.6" stroke-linecap="round"/><path d="M20 56h24" stroke="${P.terracotta}" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'flowerpot',
    label: 'ফুলদানি',
    kw: 'flower pot ফুলদানি হাঁড়ি গাছ',
    cat: 'nature',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M22 34h20l-3 16H25l-3-16z" fill="${P.terracotta}"/><path d="M20 30h24v4H20v-4z" fill="${P.terracotta}" opacity=".85"/><path d="M32 30V16" stroke="${P.leaf}" stroke-width="2.4" stroke-linecap="round"/><circle cx="32" cy="12" r="5" fill="currentColor"/><circle cx="24" cy="18" r="4" fill="currentColor" opacity=".8"/><circle cx="40" cy="18" r="4" fill="currentColor" opacity=".8"/><path d="M32 24c-3-2-5-4-6-6M32 26c3-2 5-4 6-6" stroke="${P.leaf}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'kite',
    label: 'ঘুড়ি',
    kw: 'kite ঘুড়ি উড়া শাকরাইন',
    cat: 'nature',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 6l16 16-16 22L16 22 32 6z" fill="currentColor" opacity=".9"/><path d="M16 22h32M32 6v38" stroke="${P.cream}" stroke-width="1.8"/><path d="M32 44c-2 4-6 6-4 10s-4 6-6 4" stroke="${P.sky}" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="4 3"/><path d="M44 40l4-4 4 4-4 4-4-4z" fill="${P.gold}"/></svg>`,
  },
  // ───────────── বই-সামগ্রী ─────────────
  {
    id: 'bookstack',
    label: 'বইয়ের স্তূপ',
    kw: 'books stack বই স্তূপ পড়া লাইব্রেরি',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect x="12" y="42" width="40" height="9" rx="2" fill="currentColor" opacity=".9"/><rect x="16" y="32" width="34" height="9" rx="2" fill="${P.terracotta}"/><rect x="14" y="22" width="36" height="9" rx="2" fill="${P.leaf}"/><path d="M20 46h6M22 36h6M20 26h6" stroke="${P.cream}" stroke-width="1.6" stroke-linecap="round"/><path d="M52 16c-8 0-14 2-20 8 6 6 12 8 20 8V16z" fill="${P.gold}"/><circle cx="46" cy="24" r="2.6" fill="${P.cream}"/></svg>`,
  },
  {
    id: 'pennib',
    label: 'কলমের ফলা',
    kw: 'pen nib কলম ফলা লেখা লেখক',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 6l14 14-8 26h-12l-8-26L32 6z" fill="currentColor" opacity=".9"/><circle cx="32" cy="30" r="4" fill="${P.cream}"/><path d="M32 34v12" stroke="${P.cream}" stroke-width="2"/><path d="M32 6v10" stroke="${P.gold}" stroke-width="2.4" stroke-linecap="round"/><path d="M40 52c0 4-4 6-8 6s-8-2-8-6" stroke="${P.gold}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'ribbonbadge',
    label: 'রিবন ব্যাজ',
    kw: 'ribbon badge award রিবন ব্যাজ পুরস্কার',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><circle cx="32" cy="26" r="16" fill="currentColor" opacity=".92"/><circle cx="32" cy="26" r="10.5" fill="${P.cream}"/><path d="M32 21l1.8 3.6 4 .6-2.9 2.8.7 4-3.6-1.9-3.6 1.9.7-4-2.9-2.8 4-.6L32 21z" fill="${P.gold}"/><path d="M24 40l-4 18 12-7 12 7-4-18" fill="${P.deep}"/></svg>`,
  },
  {
    id: 'bookmark',
    label: 'বুকমার্ক রিবন',
    kw: 'bookmark ribbon বুকমার্ক দাগি পাতা',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M20 8h24v48l-12-9-12 9V8z" fill="currentColor" opacity=".92"/><path d="M20 8h24v6H20V8z" fill="${P.gold}"/><circle cx="32" cy="26" r="5" fill="${P.cream}"/></svg>`,
  },
  {
    id: 'quillink',
    label: 'কালির কুয়াশা কলম',
    kw: 'quill ink কলম কালি লেখক কবি',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M14 8c14 0 26 4 32 14 4 7 2 16-4 22-2-8-6-14-12-18 4 6 6 12 6 18-8-2-16-8-20-16-4-7-4-14-2-20z" fill="currentColor" opacity=".88"/><path d="M20 54c6-10 14-18 24-22" stroke="${P.gold}" stroke-width="2.2" stroke-linecap="round"/><rect x="18" y="52" width="22" height="6" rx="3" fill="${P.ink}"/></svg>`,
  },
  {
    id: 'stamp',
    label: 'ডাক স্ট্যাম্প',
    kw: 'stamp postal স্ট্যাম্প ডাক চিঠি',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M10 14h44v36H10V14z" fill="${P.cream}"/><path d="M10 14c0 3-3 3-3 6s3 3 3 6-3 3-3 6 3 3 3 6-3 3-3 6 3 3 3 6h44c0-3 3-3 3-6s-3-3-3-6 3-3 3-6-3-3-3-6 3-3 3-6-3-3-3-6H10z" stroke="currentColor" stroke-width="2" fill="none"/><rect x="18" y="22" width="28" height="20" fill="currentColor" opacity=".85"/><circle cx="32" cy="32" r="6" fill="${P.cream}"/><path d="M26 26h12" stroke="${P.cream}" stroke-width="1.6"/></svg>`,
  },
  {
    id: 'washtape',
    label: 'ওয়াশি টেপ',
    kw: 'washi tape টেপ সাজ ডেকোর',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M6 24l52-8v16L6 40V24z" fill="currentColor" opacity=".85"/><path d="M12 24v16M20 23v16M28 22v16M36 21v16M44 20v16M52 20v16" stroke="${P.cream}" stroke-width="2" stroke-dasharray="4 4"/></svg>`,
  },
  {
    id: 'seal',
    label: 'মোহর',
    kw: 'seal wax মোহর সীল অনুমোদন',
    cat: 'utility',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 8l5 6 8-2 2 8 8 3-3 7 3 7-8 3-2 8-8-2-5 6-5-6-8 2-2-8-8-3 3-7-3-7 8-3 2-8 8 2 5-6z" fill="currentColor" opacity=".9"/><circle cx="32" cy="30" r="10" fill="${P.cream}"/><path d="M27 30l3 3 7-7" stroke="${P.leaf}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  },
  // ───────────── মজার স্টিকার ─────────────
  {
    id: 'burst',
    label: 'পটকা-তারা',
    kw: 'burst star পটকা বিস্ফোরণ জোর আনন্দ',
    cat: 'fun',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 4l6 12 12-6-4 13 14 2-11 8 8 10-14 1 2 14-11-8-9 11-4-13-13 3 7-12L4 26l13-3-2-14 12 8z" fill="currentColor" opacity=".92"/><circle cx="32" cy="28" r="8" fill="${P.gold}"/><path d="M26 27h12M32 21v12" stroke="${P.cream}" stroke-width="1.8" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'bunting',
    label: 'ঝালর-পতাকা',
    kw: 'bunting garland ঝালর পতাকা উৎসব সাজ',
    cat: 'fun',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M4 14c10 6 46 6 56 0" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M12 18v12l8-9M24 20v12l8-9M36 20v12l8-9M48 18v12l8-9" fill="${P.gold}"/><path d="M12 18v12l8-9M24 20v12l8-9M36 20v12l8-9M48 18v12l8-9" stroke="currentColor" stroke-width="1.6"/></svg>`,
  },
  {
    id: 'speech',
    label: 'কথার বেলুন',
    kw: 'speech bubble কথা বেলুন উক্তি ডায়ালগ',
    cat: 'fun',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M10 12h44a4 4 0 014 4v22a4 4 0 01-4 4H28l-10 10v-10h-8a4 4 0 01-4-4V16a4 4 0 014-4z" fill="currentColor" opacity=".92"/><path d="M18 22h28M18 30h20" stroke="${P.cream}" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'heartflower',
    label: 'হৃদয়-ফুল',
    kw: 'heart flower ভালোবাসা ফুল হৃদয়',
    cat: 'fun',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 14c3-5 9-6 13-3 5 4 5 11 0 16l-13 12-13-12c-5-5-5-12 0-16 4-3 10-2 13 3z" fill="currentColor" opacity=".9"/><path d="M32 39v14M32 48c-4 0-7-2-8-5M32 44c3 0 6-2 7-4" stroke="${P.leaf}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'confetti',
    label: 'কনফেটি ঝলক',
    kw: 'confetti celebration কনফেটি উদযাপন আনন্দ',
    cat: 'fun',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M28 40L14 54" stroke="${P.terracotta}" stroke-width="2.4" stroke-linecap="round"/><rect x="34" y="34" width="8" height="8" rx="1.5" transform="rotate(18 38 38)" fill="currentColor"/><circle cx="20" cy="30" r="3" fill="${P.gold}"/><path d="M44 22l6-6M46 30h8M40 14v-8" stroke="${P.leaf}" stroke-width="2.4" stroke-linecap="round"/><circle cx="54" cy="14" r="3" fill="${P.sky}"/><rect x="10" y="12" width="6" height="6" rx="1.5" transform="rotate(-14 13 15)" fill="${P.deep}"/><path d="M30 8l4 4" stroke="${P.gold}" stroke-width="2.4" stroke-linecap="round"/></svg>`,
  },
  {
    id: 'smileblob',
    label: 'হাসি-বুদবুদ',
    kw: 'smile blob happy হাসি মুখ খুশি',
    cat: 'fun',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><path d="M32 10c13 0 22 8 22 18 0 11-10 18-22 18-3 0-6-.5-8.6-1.4L14 50l2.6-9C12.5 37.8 10 33.2 10 28c0-10 9-18 22-18z" fill="currentColor" opacity=".92"/><circle cx="25" cy="27" r="2.6" fill="${P.ink}"/><circle cx="39" cy="27" r="2.6" fill="${P.ink}"/><path d="M24 34c4 4.5 12 4.5 16 0" stroke="${P.ink}" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  },
];

export const STICKER_COUNT = STICKER_DEFS.length;

const STICKER_BY_ID = new Map<string, StickerDef>(STICKER_DEFS.map((s) => [s.id, s]));

export function getSticker(id: string): StickerDef | undefined {
  return STICKER_BY_ID.get(id);
}

export function searchStickers(query: string): StickerDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return STICKER_DEFS;
  return STICKER_DEFS.filter((s) => s.label.toLowerCase().includes(q) || s.kw.toLowerCase().includes(q) || s.cat.includes(q));
}

/** স্টিকার স্প্যানের inline style (এডিটর/স্ট্যাটিক/এক্সপোর্ট সবখানে একই) */
export function stickerSpanStyle(size: number, color: string): string {
  return `display:inline-flex;line-height:0;width:${size}px;height:${size}px;vertical-align:-0.18em;color:${color || 'inherit'};`;
}
