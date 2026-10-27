/**
 * সিকিউরিটি হেডার মিডলওয়্যার — ফেজ-৬ (দিন ৫১–৬০)
 *
 * হালকা ও নিরাপদ সেট: CSP ইচ্ছাকৃতভাবে বাদ (TipTap/inline-style ভারী অ্যাপে
 * ভাঙার ঝুঁকি; পরে nonce-সহ যোগ করা যাবে)। HSTS শুধু https-এ।
 */

import { NextResponse, type NextRequest } from 'next/server';

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();

  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  // share-viewer iframe-এ এমবেড হলেও সাইট নিজে ক্লিকজ্যাকিং-নিরাপদ
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (_req.nextUrl.protocol === 'https:') {
    res.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }
  return res;
}

export const config = {
  // স্ট্যাটিক অ্যাসেট ও SW বাদ — শুধু পেজ ও API
  matcher: ['/((?!_next/static|_next/image|sw.js|manifest.webmanifest|fonts|icons|favicon).*)'],
};
