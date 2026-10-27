/**
 * sitemap.xml — ফেজ-৬ (দিন ৫১–৬০)
 * পাবলিক পেজ: ল্যান্ডিং (এক-পেজ মার্কেটিং), শেয়ার ভিউয়ার ডায়নামিক —
 * স্ট্যাটিক এন্ট্রিতে হোম-ই যথেষ্ট; শেয়ার লিংক noindex (robots)।
 */

import type { MetadataRoute } from 'next';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
