import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./forma-print.css";
import { Toaster } from "@/components/ui/toaster";
import PwaRegister from "@/components/pwa-register";
import { SonnerToaster } from "@/components/sonner-toaster";

// বাংলা ফন্ট — বান্ডেল (অফলাইনেও কাজ করে)
import "@fontsource/noto-serif-bengali/400.css";
import "@fontsource/noto-serif-bengali/600.css";
import "@fontsource/noto-serif-bengali/700.css";
import "@fontsource/noto-sans-bengali/400.css";
import "@fontsource/noto-sans-bengali/600.css";
import "@fontsource/noto-sans-bengali/700.css";
import "@fontsource/hind-siliguri/400.css";
import "@fontsource/hind-siliguri/600.css";
import "@fontsource/hind-siliguri/700.css";
import "@fontsource/tiro-bangla/400.css";
import "@fontsource/baloo-da-2/400.css";
import "@fontsource/baloo-da-2/600.css";
import "@fontsource/atma/400.css";
import "@fontsource/atma/600.css";
import "@fontsource/mina/400.css";
import "@fontsource/galada/400.css";
import "@fontsource/anek-bangla/400.css";
import "@fontsource/anek-bangla/600.css";

const APP_NAME = "বাংলা পাবলিশিং স্টুডিও";
const APP_DESCRIPTION =
  "বাংলা বই, কোচিং ম্যাটেরিয়াল ও প্রকাশনার জন্য অফলাইন-ফার্স্ট WYSIWYG ওয়ার্ড প্রসেসর";

export const metadata: Metadata = {
  // Vercel-এ স্বয়ংক্রিয় সঠিক ডোমেইন; লোকালে localhost fallback
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: `${APP_NAME} — বাংলা ওয়ার্ড প্রসেসর ও বুক ডিজাইনার`,
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      {/* suppressHydrationWarning: কিছু ব্রাউজার এক্সটেনশন (পপআপ ব্লকার ইত্যাদি) hydration-এর
          আগে <head>-এর শুরুতে নিজের <script>/<link> ঢুকিয়ে দেয়, ফলে React আমাদের ট্যাগের
          অ্যাট্রিবিউট মিসম্যাচ হিসেবে ভুল কনসোল এরর দেখায়। এটি নিরীহ — তাই দমন করা হলো। */}
      <head suppressHydrationWarning>
        {/* সেভ করা থিম আগে প্রয়োগ (ফ্ল্যাশ এড়াতে) */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: "try{var t=localStorage.getItem('bwp-theme');document.documentElement.classList.toggle('dark',t==='dark')}catch(e){}",
          }}
        />
        {/* CDN ফন্ট — Kalpurush, SolaimanLipi, Siyam Rupali (নেট থাকলে লোড হবে) */}
        <link suppressHydrationWarning rel="preconnect" href="https://fonts.maateen.me" />
        <link suppressHydrationWarning rel="stylesheet" href="https://fonts.maateen.me/kalpurush/font.css" />
        <link suppressHydrationWarning rel="stylesheet" href="https://fonts.maateen.me/solaimanlipi/font.css" />
        <link suppressHydrationWarning rel="stylesheet" href="https://fonts.maateen.me/siyam-rupali/font.css" />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
        <SonnerToaster />
        <PwaRegister />
      </body>
    </html>
  );
}
