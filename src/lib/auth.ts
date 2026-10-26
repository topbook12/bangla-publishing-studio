/**
 * NextAuth কনফিগারেশন — ফেজ-৩ (দিন ২১–৩০)
 *
 * কৌশল: JWT সেশন (অ্যাডাপ্টার-মুক্ত) — ডেমো ইমেইল লগইন ও Google OAuth দুটোই
 * একসাথে চলে। সাইন-ইনের সময় ব্যবহারকারীকে Prisma User টেবিলে upsert করা হয়,
 * তাই ক্লাউড-সিঙ্ক API সরাসরি session.user.id দিয়ে কাজ করতে পারে।
 *
 * Google OAuth: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET এনভারনমেন্ট ভ্যারিয়েবল
 * সেট থাকলে স্বয়ংক্রিয়ভাবে চালু হয় (Vercel-এ সেট করা যায়)। না থাকলে সেই
 * প্রোভাইডার রেন্ডারই হয় না — ডেমো ইমেইল লগইন সবসময় খোলা থাকে।
 */

import type { NextAuthOptions } from 'next-auth';
import type { Provider } from 'next-auth/providers';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { db } from './db';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Google এনভার থাকলেই সক্রিয় — ক্লায়েন্ট /api/auth/providers দিয়ে এটা আবিষ্কার করে */
export const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

const providers: Provider[] = [];

if (googleEnabled) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  );
}

providers.push(
  CredentialsProvider({
    // ডেমো/গেস্ট লগইন — ইমেইল + নাম, পাসওয়ার্ডহীন (স্যান্ডবক্স ও প্রথম-ব্যবহারের জন্য)
    id: 'demo',
    name: 'Email',
    credentials: {
      email: { label: 'Email', type: 'email' },
      name: { label: 'Name', type: 'text' },
    },
    async authorize(credentials) {
      const email = credentials?.email?.trim().toLowerCase();
      if (!email || !EMAIL_RE.test(email)) return null;
      const name = credentials?.name?.trim() || email.split('@')[0];
      const user = await db.user.upsert({
        where: { email },
        update: { name },
        create: { email, name },
      });
      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
);

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  providers,
  pages: { signIn: '/' }, // নিজস্ব সাইন-ইন ডায়ালগ ব্যবহার করি — NextAuth ডিফল্ট পেজ নয়
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // ডেমো লগইন — authorize থেকেই DB id পাওয়া যায়
      if (user?.id && account?.provider === 'demo') {
        token.uid = user.id;
        return token;
      }
      // Google (বা ভবিষ্যৎ OAuth) — ইমেইল দিয়ে DB ইউজার upsert করে uid বসাই
      if (account && account.provider !== 'demo' && (profile?.email ?? user?.email)) {
        const email = (profile?.email ?? user?.email)!.toLowerCase();
        try {
          const dbUser = await db.user.upsert({
            where: { email },
            update: { name: user?.name ?? undefined, image: user?.image ?? undefined },
            create: { email, name: user?.name ?? email.split('@')[0], image: user?.image },
          });
          token.uid = dbUser.id;
        } catch {
          // DB ডাউন থাকলেও সেশন ভাঙবে না — uid ছাড়া চলবে (ক্লাউড API 401 দেবে)
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) (session.user as { id?: string }).id = token.uid;
      return session;
    },
  },
};
