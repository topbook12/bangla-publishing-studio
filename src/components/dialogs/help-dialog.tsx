/**
 * সহায়িকা (Help) — ব্যবহার নির্দেশিকা ও কীবোর্ড শর্টকাট
 *
 * নতুন ব্যবহারকারী প্রথমে যেসব জিনিস খোঁজেন সেগুলোই এখানে ধাপে ধাপে:
 * লেখা, হেডার/ফুটার, আকৃতি/আইকন, লিংক, ছবি, ফরমা ছাপা, সেভ/ব্যাকআপ।
 */

'use client';

import { CircleHelp, Keyboard } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useUiStore } from '@/lib/ui-store';

const SHORTCUTS: Array<[string, string]> = [
  ['Ctrl+B / I / U', 'বোল্ড / ইটালিক / আন্ডারলাইন'],
  ['Ctrl+F / Ctrl+H', 'খোঁজ ও প্রতিস্থাপন (সব পাতায়)'],
  ['Ctrl+Z / Ctrl+Y', 'আনডু / রিডু'],
  ['Ctrl+Enter', 'কার্সর থেকে নতুন পাতা'],
  ['Ctrl+S', 'সেভ (অটোসেভ সবসময় চালু)'],
  ['Ctrl+P', 'প্রিন্ট / PDF'],
  ['স্ক্রল + Ctrl', 'জুম ইন/আউট (কাগজের উপর)'],
];

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-lg border bg-card open:bg-muted/30">
      <summary className="flex cursor-pointer select-none items-center gap-2 px-3 py-2.5 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span className="text-primary transition-transform group-open:rotate-90" aria-hidden="true">▸</span>
        {title}
      </summary>
      <div className="px-4 pb-3 pt-0 text-[13px] leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}

export function HelpDialog() {
  const open = useUiStore((s) => s.openDialog === 'help');
  const close = useUiStore((s) => s.close);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl" data-testid="help-dialog">
        <DialogHeader className="border-b px-5 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <CircleHelp size={17} className="text-primary" aria-hidden="true" />
            ব্যবহার নির্দেশিকা
          </DialogTitle>
          <DialogDescription>
            ছোট ছোট প্রশ্নে ক্লিক করে উত্তর দেখুন — সবকিছু বাংলায়।
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          <Step title="✍️ লেখা শুরু ও অক্ষর বিন্যাস">
            <ul className="list-disc space-y-1 pl-4">
              <li>সাদা কাগজে সরাসরি ক্লিক করে লিখুন — ঠিক Word-এর মতোই।</li>
              <li>Home ট্যাবে ফন্ট, সাইজ, রং, বোল্ড/ইটালিক, লাইন-স্পেসিং সব আছে।</li>
              <li>বাংলা যুক্তাক্ষর খুঁজতে Review → Conjuncts ব্যবহার করুন।</li>
            </ul>
          </Step>

          <Step title="📐 প্রতি পাতার হেডার/ফুটার আলাদা করে বদলানো">
            <ul className="list-disc space-y-1 pl-4">
              <li><b>এক পাতার</b> হেডার বদলাতে — সেই পাতার হেডারের লেখায় <b>ডাবল-ক্লিক</b> করুন; শুধু ওই পাতাই বদলাবে, অন্য পাতা অক্ষত থাকবে।</li>
              <li><b>সব পাতা একসাথে</b> বদলাতে — Design → “Header & Footer Master” ব্যবহার করুন।</li>
              <li>কোনো পাতার হেডার/ফুটার/নম্বর লুকাতে — Layout-এ পাতার ডান পাশে “No Chrome” চালু করুন (অধ্যায়ের শুরুর পাতায় কাজে লাগে)।</li>
            </ul>
          </Step>

          <Step title="🧩 আকৃতি, ব্যানার, ফ্রেম ও আইকন (ভিতরে লেখা যায়)">
            <ul className="list-disc space-y-1 pl-4">
              <li>Insert → <b>Design Shapes</b> — ১২টি অলংকৃত ব্যানার/ফ্রেম/ব্যাজ; ক্লিক করলেই কাগজে বসে যায় এবং কার্সর ভিতরেই থাকে — সরাসরি লিখুন।</li>
              <li>শেপের উপর মাউস রাখলে টুল বার ওঠে — আকৃতি বদল, মূল রং, অলংকারের রং, লেখার রং, মুছে ফেলা।</li>
              <li>Insert → <b>Text Box</b> — সাধারণ বর্ডার-বক্স; <b>Icon Library</b> — হাজারো আইকন।</li>
            </ul>
          </Step>

          <Step title="🔗 লেখা বা ছবিতে ওয়েবসাইট লিংক">
            <ul className="list-disc space-y-1 pl-4">
              <li>লেখার একটি অংশ সিলেক্ট করে Insert → <b>Link</b> — লেখাটি ক্লিকযোগ্য হয়ে যাবে।</li>
              <li>ছবিতে লিংক — ছবিতে ক্লিক করে “Add Link” চাপুন।</li>
              <li>Export → Print / Save as PDF করলে PDF-এও লিংক ক্লিকযোগ্য থাকে।</li>
            </ul>
          </Step>

          <Step title="🔍 সম্পূর্ণ বইয়ে কিছু খোঁজা / বদলানো">
            <ul className="list-disc space-y-1 pl-4">
              <li>Ctrl+F চাপুন বা Review → Find &amp; Replace খুলুন।</li>
              <li>“সব প্রতিস্থাপন” চাপলে সব পাতার সব মিল একসাথে বদলে যাবে।</li>
            </ul>
          </Step>

          <Step title="🖼️ ছবি — সাইজ, ঘের ও লেখা পাশে রাখা">
            <ul className="list-disc space-y-1 pl-4">
              <li>Insert → Image দিয়ে ছবি বসান; ছবি সিলেক্ট করলে কোণায় হাতল টেনে সাইজ বদলান।</li>
              <li>ছবির টুল থেকে Float Left/Right দিলে লেখা ছবির দুপাশে জড়িয়ে আসে (text wrap)।</li>
              <li>ছবি ড্র্যাগ করে ধরে সরানো যায়; ব্লকের বাঁ-পাশের হাতলে ধরে উপর-নিচও সরানো যায়।</li>
            </ul>
          </Step>

          <Step title="🖨️ ফরমা ছাপা (ছাপাখানার নিয়ম)">
            <ol className="list-decimal space-y-1 pl-4">
              <li>Export → Print / Save as PDF খুলুন → “ফরমা PDF” বাছুন।</li>
              <li>ফরমা সাইজ (৪/৮/১৬/৩২ পৃষ্ঠা) ও সাইড বিন্যাস বাছুন।</li>
              <li>প্রিন্ট ডায়ালগে <b>Scale 100%</b> ও ডুপ্লেক্সে <b>Long-edge flip</b> রাখুন।</li>
              <li>শীট মাপ দেখে সেই মাপের কাগজ নিন; ভাঁজ-দাগ ধরে ভাঁজ করলেই পৃষ্ঠা ক্রম ঠিক।</li>
            </ol>
          </Step>

          <Step title="💾 সেভ, ব্যাকআপ ও ক্রিয়েটিভ এক্সপোর্ট">
            <ul className="list-disc space-y-1 pl-4">
              <li>লিখলেই <b>অটোসেভ</b> হয় (ব্রাউজারে IndexedDB-তে) — ইন্টারনেট ছাড়াও চলে।</li>
              <li>নিয়মিত <b>Backup (JSON)</b> নামিয়ে রাখুন — অন্য কম্পিউটারে “Open Backup” দিয়ে ফেরত আসে।</li>
              <li>ক্রিয়েটিভ আউটপুট: Export → <b>EPUB (ই-বুক)</b>, Markdown, Plain Text।</li>
            </ul>
          </Step>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Keyboard size={15} aria-hidden="true" /> কীবোর্ড শর্টকাট
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {SHORTCUTS.map(([keys, desc]) => (
                <div key={keys} className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 text-xs">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">{keys}</kbd>
                  <span className="text-right text-muted-foreground">{desc}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            আরও কিছু দরকার হলে অ্যাপের ভেতরে কোনো টুলের উপর মাউস রাখুন — প্রতিটি টুলেই টুল-টিপ আছে।
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
