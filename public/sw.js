// বাংলা পাবলিশিং স্টুডিও — Service Worker (bwp-v1)
// সহজ ও নিরাপদ কৌশল:
//  - install: শুধু "/" প্রিক্যাশ (offline fallback)
//  - activate: পুরনো ক্যাশ মুছে ফেলা + clients.claim()
//  - fetch: শুধুমাত্র GET
//    * navigation → network-first, ব্যর্থ হলে ক্যাশ থেকে "/" fallback
//    * অন্য GET (Next.js immutable static assets) → cache-first, না পেলে
//      fetch করে সফল হলে runtime cache-এ সংরক্ষণ
//  - POST/অন্য মেথড কখনোই ইন্টারসেপ্ট হয় না

const CACHE = 'bwp-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add('/')).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // শুধুমাত্র GET — POST/PUT/DELETE ইত্যাদি স্পর্শ করা হয় না
  if (request.method !== 'GET') return;

  // chrome-extension ও নন-http(s) স্কিম বাদ
  const url = new URL(request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (url.protocol.startsWith('chrome-extension')) return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    // Navigation: network-first, ব্যর্থ হলে ক্যাশ থেকে "/" fallback
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (err) {
          const cache = await caches.open(CACHE);
          return (await cache.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  // অন্যান্য GET (static assets): cache-first — Next.js ইমিউটেবল অ্যাসেটের জন্য নিরাপদ
  event.respondWith(
    (async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch (err) {
        return Response.error();
      }
    })()
  );
});
