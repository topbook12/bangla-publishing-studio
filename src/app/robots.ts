/**
 * robots.txt — ফেজ-৬ (দিন ৫১–৬০)
 * share-ভিউ (?share=) ও ?stats=1 ড্যাশবোর্ড noindex; sitemap নির্দেশ সহ।
 */

import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/?share=', '/?stats=1', '/api/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
