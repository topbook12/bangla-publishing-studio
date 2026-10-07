/**
 * AI প্রক্সি শেয়ার্ড সুরক্ষা-মডিউল
 * ─────────────────────────────
 * /api/ai/chat ও /api/ai/models — দুই রুটই একই কঠোর গার্ড ব্যবহার করে:
 *  - SSRF গার্ড: টার্গেট https-বাধ্য (লোকাল ডেভ-সার্ভারে লোকাল http ছাড়),
 *    প্রাইভেট/রিজার্ভড IP, localhost, *.internal/*.local, ক্লাউড-মেটাডেটা ব্লকড
 *  - পরিচিত প্রোভাইডার হোস্টে Base URL স্বয়ংসম্পূর্ণ (404 প্রতিরোধ)
 *  - রেট-লিমিট (মেমোরি, ইনস্ট্যান্স-স্কোপ)
 */

// ─── Base URL নরমালাইজেশন ───

export function normalizeBase(baseUrl: string): string {
  let s = baseUrl.trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  // /chat/completions (বা /models) দিয়ে শেষ হলে সরিয়ে দিই — আমরাই যোগ করব
  s = s.replace(/\/(chat\/completions|models)\/?$/i, '');
  if (!s.endsWith('/')) s += '/';
  return s;
}

/**
 * পরিচিত প্রোভাইডার হোস্টের জন্য Base URL স্বয়ংসম্পূর্ণ —
 * ইউজারের ছোট ভুল (পাথ বাদ পড়া) থেকে 404 হওয়াই বন্ধ করে।
 * যেমন: "https://api.openai.com" → "https://api.openai.com/v1/",
 *      "https://generativelanguage.googleapis.com" → ".../v1beta/openai/"
 */
export function autoCompleteKnownHosts(base: string): string {
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return base;
  }
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, ''); // trailing slashes বাদ

  const wants = (prefix: string) => !path.toLowerCase().startsWith(prefix);
  const finish = (requiredPath: string) => {
    const next = `https://${host}${requiredPath}`;
    return next.endsWith('/') ? next : `${next}/`;
  };

  switch (host) {
    case 'api.openai.com':
      return wants('/v1') ? finish('/v1') : base;
    case 'generativelanguage.googleapis.com':
      return wants('/v1beta/openai') ? finish('/v1beta/openai') : base;
    case 'api.anthropic.com':
      return wants('/v1') ? finish('/v1') : base;
    case 'openrouter.ai':
      return wants('/api/v1') ? finish('/api/v1') : base;
    case 'api.groq.com':
      return wants('/openai/v1') ? finish('/openai/v1') : base;
    case 'api.z.ai':
      return wants('/api/paas/v4') ? finish('/api/paas/v4') : base;
    case 'open.bigmodel.cn':
      return wants('/api/paas/v4') ? finish('/api/paas/v4') : base;
    case 'api.deepseek.com':
      return wants('/v1') ? finish('/v1') : base;
    case 'api.mistral.ai':
      return wants('/v1') ? finish('/v1') : base;
    case 'api.together.xyz':
    case 'api.together.ai':
      return wants('/v1') ? finish('/v1') : base;
    default:
      return base;
  }
}

// ─── মডেল-আইডি পরিচ্ছন্নতা ও স্বয়ংক্রিয় মিলন (404 নির্মূল) ───

/**
 * কপি-পেস্টে আসা অদৃশ্য অক্ষর (zero-width, bidi, soft-hyphen, control) ও
 * ফাঁকা সরিয়ে মডেল-আইডি পরিচ্ছন্ন করে। বাংলা টেক্সট/চ্যাট থেকে কপি করা
 * মডেল-নামে এই জাদু-অক্ষর লুকিয়ে থাকলে প্রোভাইডার 404 "model not found"
 * দেয় — চোখে দুটি একই দেখায়। এটাই সবচেয়ে সাধারণ 404-এর মূল কারণ।
 */
export function sanitizeModelId(raw: string): string {
  return (raw ?? '')
    // zero-width ও bidi নিয়ন্ত্রণ অক্ষর
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF\u00AD]/g, '')
    // ASCII control অক্ষর (newline, tab, NUL…)
    .replace(/[\u0000-\u001F\u007F]/g, '')
    // Gemini native তালিকা "models/xxx" আকারে দেয় — প্রিফিক্স বাদ
    .replace(/^models\//i, '')
    // উদ্ধৃতি-চিহ্ন ও সব ফাঁকা
    .replace(/[\s`'"“”‘’«»]+/g, '')
    // শেষে লেগে থাকা যতিচিহ্ন
    .replace(/[.,;:!?|]+$/, '')
    .trim();
}

/**
 * চাওয়া মডেল-আইডির সাথে সবচেয়ে ভালো মেলা উপলব্ধ মডেল — 404-এ
 * স্বয়ংক্রিয় সংশোধনের জন্য (প্রোভাইডারের তালিকা থেকে)।
 * রিটার্ন null = নিশ্চিত মিল পাওয়া যায়নি।
 */
export function bestModelMatch(requested: string, available: string[]): string | null {
  const want = sanitizeModelId(requested).toLowerCase();
  if (!want || available.length === 0) return null;
  const norm = Array.from(new Set(available.map((m) => sanitizeModelId(m)))).filter(Boolean);

  // ১) হুবহু মিল (কেস-অসংবেদনশীল)
  const exact = norm.find((m) => m.toLowerCase() === want);
  if (exact) return exact;

  // ২) প্রিফিক্স-মিল — ব্যবহারকারীর লেখার সাথে সবচেয়ে নিখুঁত মিল:
  //    প্রথমে "ইউজার সম্পূর্ণ নাম + বাড়তি লিখেছে" (যেমন বন্ধ হওয়া ভ্যারিয়েন্ট
  //    gpt-4o-mini-pro → gpt-4o-mini): দীর্ঘতম = সবচেয়ে নির্দিষ্ট
  const extended = norm
    .filter((m) => want.startsWith(m.toLowerCase()))
    .sort((a, b) => b.length - a.length);
  if (extended[0]) return extended[0];
  //    তারপর "ইউজার নামের শুরুটাই লিখেছে" (যেমন gemini-2.5-fla → gemini-2.5-flash):
  //    সংক্ষিপ্ততম = সবচেয়ে ক্যানোনিকাল
  const truncated = norm
    .filter((m) => m.toLowerCase().startsWith(want))
    .sort((a, b) => a.length - b.length);
  if (truncated[0]) return truncated[0];

  // ৩) টোকেন-মিল — যেমন "gemini-2.5-flash-turbo" (নেই) চাইলে "gemini-2.5-flash" (আছে)
  const tokens = want.split(/[-_./:]/).filter(Boolean);
  let best: string | null = null;
  let bestScore = 0;
  for (const m of norm) {
    const mt = m.toLowerCase().split(/[-_./:]/).filter(Boolean);
    const shared = mt.filter((t) => tokens.includes(t)).length;
    const score = shared / Math.max(tokens.length, mt.length);
    if (score > bestScore || (score === bestScore && best && m.length < best.length)) {
      bestScore = score;
      best = m;
    }
  }
  return bestScore >= 0.6 ? best : null;
}

/** OpenAI-সামঞ্জস্য /models উত্তর থেকে মডেল-আইডি বের করা (উভয় রুট শেয়ার করে) */
export function extractModelIds(data: unknown): string[] {
  const ids: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === 'string' && v.trim()) ids.push(v.trim());
  };
  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') push(item);
      else if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>;
        push(typeof obj.id === 'string' ? obj.id : (obj.name as string | undefined));
      }
    }
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (Array.isArray(obj.models)) return extractModelIds(obj.models); // Gemini native shape
    if (Array.isArray(obj.data)) return extractModelIds(obj.data);
  }
  // "models/gemini-2.5-flash" → "gemini-2.5-flash" (compat-এ প্রিফিক্স দরকার হয় না)
  return Array.from(new Set(ids.map((id) => sanitizeModelId(id))))
    .filter((id) => id.length > 0 && id.length <= 120)
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 400);
}

/** Gemini-এর নিজস্ব হোস্ট কি না (native :generateContent ফলব্যাকের শর্ত) */
export function isGeminiHost(base: string): boolean {
  try {
    return /(^|\.)generativelanguage\.googleapis\.com$/i.test(new URL(base).hostname);
  } catch {
    return false;
  }
}

// ─── SSRF গার্ড ───

/** ব্লক করা হোস্টনেম (SSRF) */
export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (!h) return true;
  // IPv6 লিটারাল — নামে কখনো ':' থাকে না
  if (h.includes(':')) return true;
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal')) return true;
  if (h === 'metadata.google.internal' || h.endsWith('.cloud.internal')) return true;
  const ipv4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const oct = ipv4.slice(1).map(Number);
    if (oct.some((n) => n > 255)) return true;
    const [a, b] = oct;
    if (a === 0 || a === 10 || a === 127) return true; // loopback/প্রাইভেট
    if (a === 169 && b === 254) return true; // link-local (169.254.169.254 = ক্লাউড মেটাডেটা)
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a >= 224) return true; // multicast/reserved
    return false;
  }
  return false;
}

/**
 * টার্গেট বেস-URL নিরাপদ কি না — নিরাপদ হলে চূড়ান্ত (অটো-সম্পূর্ণ) বেস ফেরত।
 * প্রোডাকশনে https-বাধ্য + পাবলিক হোস্ট; লোকাল ডেভ-সার্ভারে (নিজের মেশিনে
 * অ্যাপ চালানো) নিজের লোকাল সার্ভার (Ollama/LM Studio) টেস্ট করতে http অনুমোদিত।
 */
export function assertSafeBase(rawBase: string, originIsLocal: boolean): string | null {
  // পরিচিত হোস্টে পাথ অটো-সম্পূর্ণ → ছোট ভুলে 404 হয় না
  const base = autoCompleteKnownHosts(normalizeBase(rawBase));
  if (!base) return null;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  const host = url.hostname;
  const isLocalTarget = host === 'localhost' || host === '127.0.0.1' || host === '::1' || host === '[::1]';
  if (url.protocol === 'https:') {
    if (isPrivateHost(host)) return null;
    return base;
  }
  if (url.protocol === 'http:') {
    // http শুধু তখনই, যখন সার্ভার নিজেই ইউজারের মেশিনে আর টার্গেটও লোকাল
    if (originIsLocal && isLocalTarget) return base;
    return null;
  }
  return null;
}

// ─── রেট-লিমিট (মেমোরি, ইনস্ট্যান্স-স্কোপ) ───

const RATE_WINDOW_MS = 60_000;
const rateBuckets = new Map<string, { count: number; reset: number }>();

export function allowRate(key: string, limit: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.reset) {
    // পুরনো এন্ট্রি মাঝেমধ্যে ঝাড়া — মেমোরি ফাঁদ এড়াতে
    if (rateBuckets.size > 10_000) {
      for (const [k, v] of rateBuckets) if (v.reset < now) rateBuckets.delete(k);
    }
    rateBuckets.set(key, { count: 1, reset: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim() || 'anon';
  return req.headers.get('x-real-ip')?.trim() || 'anon';
}

/** সার্ভার নিজে লোকাল মেশিনে চলছে কি না (http-লোকাল অনুমতির শর্ত) */
export function originIsLocalHost(hostHeader: string | null): boolean {
  const originHost = (hostHeader ?? '').toLowerCase().split(':')[0];
  return originHost === 'localhost' || originHost === '127.0.0.1' || originHost === '0.0.0.0' || originHost === '::1';
}
