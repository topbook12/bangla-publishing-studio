/**
 * অস্থায়ী ত্রুটিতে ক্লায়েন্ট-সাইড সৌজন্য পুনরায়-চেষ্টা
 * ─────────────────────────────────────────────────────
 * সার্ভার (/api/ai/chat) নিজেই ব্যাকঅফ দিয়ে ৩ বার চেষ্টা করে — তবু 503/529
 * "high demand" বা সার্ভার-বিভ্রাট থাকলে ক্লায়েন্ট আরও ২ বার (৫ সে ও ১২ সে পরে)
 * চুপচাপ চেষ্টা করে। মোট সুযোগ ~৮ বার, ~৩০ সে-র সময়-জানালা — Gemini-র
 * "Spikes in demand are usually temporary" বার্তার জন্যই এই নকশা।
 * ব্যবহারকারী কিছু না করেও বেশিরভাগ busy-কেস সেরে যায়; ব্যর্থ হলে স্পষ্ট বার্তা।
 */

/** সার্ভারের hintKey যেগুলো অস্থায়ী — এগুলোতেই পুনরায় চেষ্টা সার্থক (আমাদের নিজের rateLimit বাদ) */
const TRANSIENT_HINTS = new Set(['ai.err.busy', 'ai.err.server', 'ai.err.rate']);

interface RetryableResult {
  ok: boolean;
  hintKey?: string;
}

/** fn-কে চালায়; অস্থায়ী ব্যর্থতায় ৫ সে ও ১২ সে পরে আরও ২ বার — সফল/চূড়ান্ত ফলাফল ফেরত */
export async function withTransientRetry<T extends RetryableResult>(fn: () => Promise<T>): Promise<T> {
  let out = await fn();
  const delays = [5000, 12_000];
  for (let i = 0; i < delays.length; i++) {
    if (out.ok || !out.hintKey || !TRANSIENT_HINTS.has(out.hintKey)) return out;
    await new Promise((r) => setTimeout(r, delays[i]));
    out = await fn();
  }
  return out;
}
