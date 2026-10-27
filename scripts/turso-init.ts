/**
 * Turso ইনিশিয়ালাইজার — রিমোট libSQL ডাটাবেসে Prisma স্কিমা পুশ করে।
 *
 * ব্যবহার (prisma CLI সরাসরি libsql:// বোঝে না, তাই এই স্ক্রিপ্ট):
 *   bun scripts/turso-init.ts
 * (TURSO_DATABASE_URL ও TURSO_AUTH_TOKEN .env থেকে লোড হয়)
 *
 * কাজ: ১) সব টেবিল ড্রপ (ফ্রেশ স্টার্ট) ২) migrate diff দেওয়া DDL চালায়
 *      ৩) টেবিল তালিকা + কাউন্ট দিয়ে যাচাই
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@libsql/client';

// .env ম্যানুয়াল লোড (bun --env-file ছাড়া চলার জন্য)
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

const ddl = readFileSync('/tmp/turso-init.sql', 'utf8');
const client = createClient({ url, authToken });

console.log('📡 সংযোগ হচ্ছে:', url);

// ১) ফ্রেশ স্টার্ট — পুরনো টেবিল থাকলে ড্রপ
const dropSql = [
  'DROP TABLE IF EXISTS "UsageCounter"',
  'DROP TABLE IF EXISTS "Coupon"',
  'DROP TABLE IF EXISTS "Invoice"',
  'DROP TABLE IF EXISTS "Order"',
  'DROP TABLE IF EXISTS "Subscription"',
  'DROP TABLE IF EXISTS "AnalyticsEvent"',
  'DROP TABLE IF EXISTS "Document"',
  'DROP TABLE IF EXISTS "VerificationToken"',
  'DROP TABLE IF EXISTS "Session"',
  'DROP TABLE IF EXISTS "Account"',
  'DROP TABLE IF EXISTS "User"',
].join(';\n');
await client.executeMultiple(dropSql + ';');
console.log('🧹 পুরনো টেবিল ড্রপ সম্পন্ন');

// ২) Prisma-জেনারেটেড DDL
await client.executeMultiple(ddl);
console.log('🏗️  স্কিমা তৈরি সম্পন্ন');

// ৩) যাচাই
const tables = await client.execute(
  "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE '_prisma%' ORDER BY name",
);
console.log('📋 টেবিল:', tables.rows.map((r) => r.name).join(', '));

const u = await client.execute('SELECT COUNT(*) AS n FROM "User"');
const d = await client.execute('SELECT COUNT(*) AS n FROM "Document"');
console.log(`✅ যাচাই সম্পন্ন — User: ${u.rows[0].n}, Document: ${d.rows[0].n}`);
