/**
 * Prisma ক্লায়েন্ট সিঙ্গলটন — সার্ভার-সাইড (API রুট) ব্যবহারের জন্য।
 * dev হট-রিলোডে একাধিক কানেকশন এড়াতে globalThis-এ ক্যাশ করা হয়।
 */

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
