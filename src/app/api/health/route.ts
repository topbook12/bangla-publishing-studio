/**
 * GET /api/health — প্রোডাকশন হেলথ প্রোব — ফেজ-৬ (দিন ৫১–৬০)
 *
 * মনিটরিং (UptimeRobot/Better Stack/Vercel check) এই এন্ডপয়েন্ট পিং করবে।
 * রেসপন্স:
 *  {
 *    status: 'healthy' | 'degraded',   // degraded = ক্লাউড DB প্রোব ব্যর্থ
 *    version, uptimeSeconds, timestamp,
 *    db: { mode: 'turso'|'local-sqlite', ok, latencyMs? },
 *    memory: { rssMb, heapMb }
 *  }
 *
 * HTTP সবসময় ২০০ (প্রসেস জীবিত থাকলে) — কম্পোনেন্ট স্টেটাস বডিতে;
 * কারণ এই অ্যাপ local-first: ক্লাউড DB নিচে গেলেও এডিটর অফলাইনে চলে।
 */

import { NextResponse } from 'next/server';
import { db, dbMode } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const startedAt = Date.now();

async function probeDb(): Promise<{ ok: boolean; latencyMs?: number }> {
  const t0 = Date.now();
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - t0 };
  } catch {
    return { ok: false };
  }
}

export async function GET() {
  const mem = process.memoryUsage();
  const dbProbe = await probeDb();

  return NextResponse.json(
    {
      status: dbProbe.ok ? 'healthy' : 'degraded',
      service: 'bangla-publishing-studio',
      version: process.env.npm_package_version ?? '0.2.1',
      uptimeSeconds: Math.round((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
      db: {
        mode: dbMode,
        ok: dbProbe.ok,
        ...(dbProbe.latencyMs !== undefined
          ? { latencyMs: dbProbe.latencyMs }
          : {}),
      },
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapMb: Math.round(mem.heapUsed / 1024 / 1024),
      },
    },
    {
      headers: { 'cache-control': 'no-store' },
    },
  );
}
