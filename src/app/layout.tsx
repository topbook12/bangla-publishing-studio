import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./hindi-fonts.css";
import "./forma-print.css";
import PwaRegister from "@/components/pwa-register";
import PwaInstall from "@/components/pwa-install";
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

// দেবনাগরী (হিন্দি) ফন্ট — বান্ডেল (অফলাইনেও কাজ করে)
import "@fontsource/noto-sans-devanagari/400.css";
import "@fontsource/noto-sans-devanagari/600.css";
import "@fontsource/noto-sans-devanagari/700.css";
import "@fontsource/noto-serif-devanagari/400.css";
import "@fontsource/noto-serif-devanagari/600.css";
import "@fontsource/noto-serif-devanagari/700.css";
import "@fontsource/tiro-devanagari-hindi/400.css";
import "@fontsource/hind/400.css";
import "@fontsource/hind/600.css";
import "@fontsource/hind/700.css";
import "@fontsource/martel/400.css";
import "@fontsource/martel/700.css";
import "@fontsource/mukta/400.css";
import "@fontsource/mukta/600.css";
import "@fontsource/rozha-one/400.css";
import "@fontsource/baloo-2/400.css";
import "@fontsource/baloo-2/600.css";
import "@fontsource/kalam/400.css";
import "@fontsource/anek-devanagari/400.css";
import "@fontsource/anek-devanagari/600.css";
import "@fontsource/anek-devanagari/700.css";
import "@fontsource/rajdhani/400.css";
import "@fontsource/rajdhani/600.css";
import "@fontsource/rajdhani/700.css";
import "@fontsource/teko/400.css";
import "@fontsource/teko/600.css";
import "@fontsource/sahitya/400.css";
import "@fontsource/halant/400.css";
import "@fontsource/halant/600.css";
import "@fontsource/karma/400.css";
import "@fontsource/karma/700.css";
import "@fontsource/laila/400.css";
import "@fontsource/laila/600.css";
import "@fontsource/khula/400.css";
import "@fontsource/khula/700.css";
import "@fontsource/yantramanav/400.css";
import "@fontsource/yantramanav/700.css";
import "@fontsource/yatra-one/400.css";
// English academic fonts — thesis writing (bundled = offline-safe)
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/600.css";
import "@fontsource/eb-garamond/700.css";
import "@fontsource/libre-baskerville/400.css";
import "@fontsource/libre-baskerville/700.css";
import "@fontsource/crimson-text/400.css";
import "@fontsource/crimson-text/600.css";
import "@fontsource/crimson-text/700.css";
import "@fontsource/lora/400.css";
import "@fontsource/lora/600.css";
import "@fontsource/lora/700.css";
import "@fontsource/merriweather/400.css";
import "@fontsource/merriweather/700.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/700.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "@fontsource/source-serif-4/700.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/source-code-pro/400.css";
import "@fontsource/source-code-pro/600.css";

const APP_NAME = "বাংলা পাবলিশিং স্টুডিও";
const APP_DESCRIPTION =
  "বাংলা ও হিন্দি বই, কোচিং ম্যাটেরিয়াল ও প্রকাশনার জন্য অফলাইন-ফার্স্ট WYSIWYG ওয়ার্ড প্রসেসর — Bangla & Hindi book typesetting studio";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
).replace(/\/+$/, "");

export const metadata: Metadata = {
  // Vercel-এ স্বয়ংক্রিয় সঠিক ডোমেইন; লোকালে localhost fallback
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${APP_NAME} — বাংলা ও হিন্দি ওয়ার্ড প্রসেসর ও বুক ডিজাইনার`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  applicationName: APP_NAME,
  manifest: "/manifest.webmanifest",
  keywords: [
    "বাংলা টাইপসেটিং", "বাংলা বই ডিজাইন", "bangla word processor",
    "bangla book typesetting", "question paper maker", "প্রশ্নপত্র বানানো",
    "farma print", "ফরমা প্রিন্ট", "hindi typesetting", "offline word processor",
  ],
  authors: [{ name: APP_NAME }],
  // ফেজ-৩ SEO — প্রথম পাতা = ল্যান্ডিং; সার্চ-ইঞ্জিন নির্দেশনা
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — মুদ্রকের মতোই নিখুঁত বাংলা বই ও প্রশ্নপত্র`,
    description: APP_DESCRIPTION,
    url: "/",
    locale: "bn_BD",
    alternateLocale: ["hi_IN", "en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — বাংলা বই ও প্রশ্নপত্রের WYSIWYG স্টুডিও`,
    description: APP_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
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
  themeColor: "#1c6b4c",
  width: "device-width",
  initialScale: 1,
  // maximumScale: 1 সরানো হলো — এটা অ্যান্ড্রয়েডে পিঞ্চ-জুম বন্ধ করে দিত
  // (বই-পড়া/সম্পাদনা অ্যাপে জুম অ্যাক্সেসিবিলিটি বেসলাইন; iOS আগেই এডিট করত না)
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
        {/* SEO — JSON-LD structured data (SoftwareApplication) */}
        <script
          suppressHydrationWarning
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: APP_NAME,
              url: SITE_URL,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description: APP_DESCRIPTION,
              inLanguage: ["bn", "hi", "en"],
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            }),
          }}
        />
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
        {/* টোস্ট সিস্টেম Sonner — পুরনো shadcn Toaster (use-toast) এমিটার-শূন্য ছিল, বাদ */}
        <SonnerToaster />
        <PwaRegister />
        <PwaInstall />
      </body>
    </html>
  );
}
