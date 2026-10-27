/**
 * Prisma ক্লায়েন্ট সিঙ্গলটন — সার্ভার-সাইড (API রুট) ব্যবহারের জন্য।
 * dev হট-রিলোডে একাধিক কানেকশন এড়াতে globalThis-এ ক্যাশ করা হয়।
 *
 * ── ডাটাবেস নির্বাচন (প্রায়োরিটি ক্রমে) ──
 * ১. TURSO_DATABASE_URL সেট থাকলে → Turso (libSQL) ড্রাইভার-অ্যাডাপ্টার দিয়ে
 *    রিমোট এজ-ডাটাবেস (প্রোডাকশন/Vercel-এর জন্য; SQLite-এরই ক্লাউড রূপ)।
 * ২. না থাকলে → লোকাল SQLite ফাইল (DATABASE_URL=file:...) — শূন্য-কনফিগ,
 *    স্যান্ডবক্স/অফলাইন-ফার্স্ট পথ অক্ষত থাকে।
 *
 * নোট: NEXTAUTH_SECRET-এর সাথে এর কোনো সম্পর্ক নেই — সেটা সেশন-টোকেন
 * সাইন/এনক্রিপ্ট করার ক্রিপ্টো-কী, আর এটা ডাটা রাখার জায়গা।
 */

import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  __bwpTursoUrl?: string;
};

function createDb(): PrismaClient {
  const tursoUrl = process.env.TURSO_DATABASE_URL?.trim();

  if (tursoUrl) {
    const adapter = new PrismaLibSQL({
      url: tursoUrl,
      authToken: process.env.TURSO_AUTH_TOKEN?.trim() || undefined,
    });
    return new PrismaClient({ adapter, log: ['error', 'warn'] });
  }

  return new PrismaClient({ log: ['error', 'warn'] });
}

/** কোন মোডে চলছে (পর্যবেক্ষণ/ডিবাগে কাজে লাগে) */
export const dbMode: 'turso' | 'local-sqlite' = process.env.TURSO_DATABASE_URL?.trim()
  ? 'turso'
  : 'local-sqlite';

export const db = globalForPrisma.prisma ?? createDb();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
