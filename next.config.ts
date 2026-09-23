import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel-এ ডিফল্ট আউটপুটই ব্যবহার হয়; standalone শুধু self-hosting-এর জন্য।
  // (output: "standalone" সরানো হয়েছে — Vercel build-এর সাথে সবচেয়ে নিরাপদ কনফিগ)
  typescript: {
    // ডিপ্লয়মেন্ট কখনো শুধু টাইপ-এররের কারণে ব্যর্থ না হয় সেজন্য;
    // লোকালে `bunx tsc --noEmit` দিয়ে আলাদা চেক করা হয়।
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
