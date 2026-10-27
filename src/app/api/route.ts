/**
 * GET /api — সার্ভিস ডিরেক্টরি (প্রোডাকশন হেলথ প্রোব আলাদা: /api/health)
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    service: 'bangla-publishing-studio',
    version: process.env.npm_package_version ?? '0.2.1',
    health: '/api/health',
    endpoints: [
      '/api/health',
      '/api/auth/*',
      '/api/billing/{plans,checkout,confirm,cancel,coupon,subscription}',
      '/api/documents',
      '/api/share',
      '/api/analytics',
      '/api/ai/*',
    ],
  });
}
