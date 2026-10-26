/**
 * ক্লায়েন্ট অ্যানালিটিক্স ট্র্যাকার — প্রাইভেসি-ফ্রেন্ডলি
 * (কুকি নেই, ডিভাইস-আইডি নেই, IP রাখা হয় না; শুধু ইভেন্ট-নাম + পাথ)
 *
 * fetch fire-and-forget — ব্যর্থ হলে চুপচাপ বাদ (অ্যাপের কাজে কোনো প্রভাব নেই)।
 */

'use client';

export type AnalyticsEventName =
  | 'landing_view'
  | 'studio_open'
  | 'cloud_doc_save'
  | 'share_created'
  | 'share_viewed'
  | 'tour_completed';

/** এক সেশনে একই ইভেন্ট একবারই — স্প্যাম এড়াতে */
const sent = new Set<string>();

export function track(event: AnalyticsEventName): void {
  try {
    const key = `${event}:${window.location.pathname}`;
    if (sent.has(key)) return;
    sent.add(key);
    void fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        path: window.location.pathname || '/',
        referrer: document.referrer || '',
      }),
      // ট্র্যাকিং কখনো অ্যাপকে আটকাবে না
      keepalive: true,
    }).catch(() => { /* ignore */ });
  } catch {
    /* ignore */
  }
}
