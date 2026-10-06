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
