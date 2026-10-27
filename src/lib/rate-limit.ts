/**
 * In-memory sliding-window rate limiter — Phase-6 (দিন ৫১–৬০)
 *
 * উদ্দেশ্য: পাবলিক API-গুলো (বিলিং, অ্যানালিটিক্স, ক্লাউড সিঙ্ক) অ্যাবিউজ —
 * স্ক্রিপ্টেড ফালা, কুপন-ব্রুটফোর্স, সিঙ্ক-ফ্লাড — থেকে হালকা প্রোডাকশন গার্ড।
 *
 * নকশা-সিদ্ধান্ত:
 *  - কোনো বাহ্যিক নির্ভরতা নেই (Redis ইত্যাদি নয়) — সিঙ্গেল-ইনস্ট্যান্স
 *    ডিপ্লয়মেন্ট (Vercel ফাংশন প্রতি মেমরি) যথেষ্ট; fail-open নীতি —
 *    লিমিটার নিজেই ভাঙলে রিকোয়েস্ট যাবে (এডিটর local-first, আটকায় না)।
 *  - Sliding window: প্রতি বাকেটে টাইমস্ট্যাম্প লিস্ট, পুরনোগুলো ঝাড়াই।
 *  - globalThis সিঙ্গেলটন — dev HMR-এ ম্যাপ হারায় না।
 *  - বাকেট key: `${bucket}:${ip}` — IP ছাড়া রিকোয়েস্টে "anon"।
 */

export interface RateLimitResult {
  ok: boolean;
  /** বাকি কলের সংখ্যা এই উইন্ডোতে */
  remaining: number;
  /** ok=false হলে কত সেকেন্ড পরে আবার চেষ্টা করা যাবে */
  retryAfter: number;
  limit: number;
}

interface Bucket {
  hits: number[];
}

const WINDOW_MS_DEFAULT = 60_000;

const globalForLimiter = globalThis as unknown as {
  __bwpRateBuckets?: Map<string, Bucket>;
};

const buckets: Map<string, Bucket> =
  globalForLimiter.__bwpRateBuckets ?? new Map<string, Bucket>();
globalForLimiter.__bwpRateBuckets = buckets;

/** ম্যাপ অসীম বড় হতে দেওয়া যাবে না — মাঝে মাঝে মৃত বাকেট ঝাড়াই */
function sweep(): void {
  if (buckets.size < 5_000) return;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    const alive = bucket.hits.some((t) => now - t < WINDOW_MS_DEFAULT * 6);
    if (!alive) buckets.delete(key);
  }
}

/**
 * কোর চেক — সফল হলে এই কলটিও উইন্ডোতে রেকর্ড হয়।
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number = WINDOW_MS_DEFAULT,
): RateLimitResult {
  const now = Date.now();
  sweep();

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { hits: [] };
    buckets.set(key, bucket);
  }

  // উইন্ডোর বাইরের পুরনো হিট বাদ
  bucket.hits = bucket.hits.filter((t) => now - t < windowMs);

  if (bucket.hits.length >= limit) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfter = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { ok: false, remaining: 0, retryAfter, limit };
  }

  bucket.hits.push(now);
  return {
    ok: true,
    remaining: limit - bucket.hits.length,
    retryAfter: 0,
    limit,
  };
}

/**
 * NextRequest থেকে ক্লায়েন্ট IP — Vercel/প্রক্সি হেডার সচেতন।
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  return req.headers.get('x-real-ip')?.trim() || 'anon';
}

export interface RateLimitOptions {
  /** বাকেট নাম — রুট-ভিত্তিক, যেমন 'billing:checkout' */
  bucket: string;
  /** উইন্ডোতে সর্বোচ্চ কল */
  limit: number;
  /** উইন্ডো দৈর্ঘ্য ms (ডিফল্ট ৬০ সেকেন্ড) */
  windowMs?: number;
}

/**
 * রুট-হ্যান্ডলারে এক-লাইন ব্যবহার:
 *   const limited = enforceRateLimit(req, { bucket: 'billing:checkout', limit: 10 });
 *   if (limited) return limited;
 */
export function enforceRateLimit(
  req: Request,
  { bucket, limit, windowMs = WINDOW_MS_DEFAULT }: RateLimitOptions,
): Response | null {
  try {
    const result = rateLimit(`${bucket}:${clientIp(req)}`, limit, windowMs);
    if (result.ok) return null;
    return new Response(
      JSON.stringify({
        error: 'RATE_LIMITED',
        retryAfter: result.retryAfter,
        limit: result.limit,
      }),
      {
        status: 429,
        headers: {
          'content-type': 'application/json',
          'retry-after': String(result.retryAfter),
          'x-ratelimit-limit': String(result.limit),
          'x-ratelimit-remaining': '0',
        },
      },
    );
  } catch {
    // fail-open — লিমিটারের নিজস্ব ব্যর্থতা ট্রাফিক আটকাবে না
    return null;
  }
}
