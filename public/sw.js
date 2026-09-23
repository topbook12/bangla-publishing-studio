// বাংলা পাবলিশিং স্টুডিও — Service Worker (bwp-v2)
// কৌশল:
//  - install: শুধু "/" প্রিক্যাশ (offline fallback)
//  - activate: পুরনো ক্যাশ মুছে ফেলা + clients.claim()
//  - fetch: শুধুমাত্র GET
//    * navigation → network-first, ব্যর্থ হলে ক্যাশ থেকে "/" fallback
//    * immutable অ্যাসেট (content-hashed /_next/static, CDN ফন্ট) → cache-first
//    * বাকি সব (এপি/ডেভ চাংক সহ) → network-first, ব্যর্থ হলে ক্যাশ
//      (আগের সংস্করণে সব কিছু cache-first ছিল — আপডেটের পরেও পুরনো
//       CSS/JS চলতে পারত; তাই v2 থেকে শুধু হ্যাশ-যুক্ত ফাইলই ক্যাশ-ফার্স্ট)
//  - POST/অন্য মেথড কখনোই ইন্টারসেপ্ট হয় না

const CACHE = 'bwp-v2';

/** content-hashed/immutable অ্যাসেট কি না — এগুলোই কেবল cache-first হবে */
function isImmutable(url) {
  // Next.js বিল্ড আউটপুট (হ্যাশ-যুক্ত ফাইলনাম)
  if (url.pathname.startsWith('/_next/static/')) return true;
  // ফন্ট CDN — অপরিবর্তনশীল
  if (url.hostname === 'fonts.maateen.me') return true;
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') return true;
  return false;
}

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
  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  if (request.mode === 'navigate' || request.destination === 'document') {
    // Navigation: network-first, ব্যর্থ হলে ক্যাশ থেকে "/" fallback
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          const cache = await caches.open(CACHE);
          return (await cache.match('/')) || Response.error();
        }
      })()
    );
    return;
  }

  if (isImmutable(url)) {
    // immutable অ্যাসেট: cache-first, না পেলে fetch করে রাখা
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
        } catch {
          return Response.error();
        }
      })()
    );
    return;
  }

  // বাকি সব GET: network-first — নতুন কনটেন্ট সবসময় আগে, অফলাইনে ক্যাশ
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok && url.origin === self.location.origin) {
          const cache = await caches.open(CACHE);
          cache.put(request, response.clone());
        }
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        return Response.error();
      }
    })()
  );
});
