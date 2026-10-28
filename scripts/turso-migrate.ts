/**
 * Turso অবিনাশকারী মাইগ্রেশন — সাইকেল-১ (ফিডব্যাক টেবিল)
 *
 * ⚠ turso-init.ts সব টেবিল ড্রপ করে (ফ্রেশ-স্টার্ট) — লাইভ ডেটা থাকা অবস্থায়
 *   চালানো যাবে না। এই স্ক্রিপ্ট শুধু অনুপস্থিত টেবিল/ইনডেক্স যোগ করে
 *   (IF NOT EXISTS) — ব্যবহারকারী, অর্ডার, ইনভয়েস অক্ষত থাকে।
 *
 * ব্যবহার: bun scripts/turso-migrate.ts
 * DDL-উৎস: `bunx prisma migrate diff --from-empty --to-schema-datamodel
 *           prisma/schema.prisma --script` (অথরিটেটিভ কলাম-টাইপ)
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@libsql/client';

const envFile = readFileSync(join(__dirname, '..', '.env'), 'utf8');
for (const line of envFile.split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
if (!url || !authToken) {
  console.error('❌ TURSO_DATABASE_URL / TURSO_AUTH_TOKEN সেট নেই (.env দেখুন)');
  process.exit(1);
}

const client = createClient({ url, authToken });
console.log('📡 সংযোগ হচ্ছে:', url);

const migrations: Array<{ name: string; sql: string }> = [
  {
    name: '2026-cycle1-feedback-table',
    sql: `
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "rating" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "page" TEXT NOT NULL DEFAULT 'studio',
    "status" TEXT NOT NULL DEFAULT 'new',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "Feedback_status_createdAt_idx" ON "Feedback" ("status", "createdAt");
CREATE INDEX IF NOT EXISTS "Feedback_category_idx" ON "Feedback" ("category");
`,
  },
];

for (const mig of migrations) {
  await client.executeMultiple(mig.sql);
  console.log('✅ প্রয়োগ হয়েছে:', mig.name);
}

// যাচাই — টেবিল ও কলাম তালিকা
const check = await client.execute(
  `SELECT name FROM sqlite_master WHERE type='table' AND name='Feedback'`,
);
if (check.rows.length === 0) {
  console.error('❌ Feedback টেবিল পাওয়া যায়নি!');
  process.exit(1);
}
const cols = await client.execute(`PRAGMA table_info("Feedback")`);
console.log(
  '📋 Feedback কলাম:',
  cols.rows.map((r) => String(r.name)).join(', '),
);
console.log('🎉 মাইগ্রেশন সম্পন্ন — লাইভ ডেটা অক্ষত');
