/**
 * বইয়ের পেজ টেমপ্লেট গ্যালারি — প্রো-লেভেল ডিজাইন-রেডি পাতা।
 *
 * প্রতিটি টেমপ্লেটের **আসল HTML প্রিভিউ** দেখানো হয় (স্কেল-ডাউন করে) —
 * তাই কার্ডে যে ডিজাইন দেখা যায়, বইয়ে ঠিক তেমনই বসে।
 * ক্লিক = নতুন পাতা হিসেবে বর্তমান পাতার ঠিক পরে বসবে;
 * ছোট বোতাম = বর্তমান পাতার লেখা বদলে সেখানে ডিজাইনটি বসবে।
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import {
  PAGE_TEMPLATES, TEMPLATE_CATEGORY_LABELS, TEMPLATE_CATEGORY_ORDER,
  templatePreviewRows, type PageTemplate, type TemplateCategory,
} from '@/lib/page-templates';
import { StaticContent } from '@/components/editor/static-content';
import { fontStackOf } from '@/lib/paper';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ArrowDownToLine, Replace } from 'lucide-react';

/** প্রিভিউ শিটের ভার্চুয়াল প্রস্থ (px) — কার্ডের প্রস্থ অনুযায়ী স্কেল হয় */
const SHEET_WIDTH = 620;

/** প্রিভিউয়ের জন্য খালি স্পেসার প্যারাগ্রাফগুলো বাদ দিয়ে ডিজাইনটি কমপ্যাক্টভাবে দেখানো */
function compactForPreview(html: string): string {
  try {
    const doc = new DOMParser().parseFromString(`<div id="r">${html}</div>`, 'text/html');
    const root = doc.getElementById('r');
    if (!root) return html;
    root.querySelectorAll('p').forEach((el) => {
      const isEmpty = !(el.textContent ?? '').trim() && !el.querySelector('img,svg,hr,.doc-textbox,.callout-box,.mcq-block,.toc-block');
      if (isEmpty) el.remove();
    });
    return root.innerHTML;
  } catch {
    return html;
  }
}

/** টেমপ্লেটের আসল HTML-এর স্কেল-ডাউন প্রিভিউ */
function TemplatePreview({ tpl }: { tpl: PageTemplate }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / SHEET_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const settings = useEditorStore((s) => s.settings);

  return (
    <div
      ref={wrapRef}
      className="relative h-40 overflow-hidden rounded-lg border border-border bg-white"
      aria-hidden="true"
    >
      <div
        className="bwp-static pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{
          width: SHEET_WIDTH,
          transform: `scale(${scale})`,
          fontFamily: fontStackOf(settings.defaultFont),
          fontSize: `${settings.defaultFontSize}pt`,
          lineHeight: settings.lineHeight,
          ['--page-paragraph-gap' as string]: '8px',
          padding: '14px 26px 0',
        }}
      >
        <StaticContent html={compactForPreview(tpl.html)} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

function TemplateCard({ tpl, onPick, onReplace, canReplace }: {
  tpl: PageTemplate;
  onPick: (t: PageTemplate) => void;
  onReplace: (t: PageTemplate) => void;
  canReplace: boolean;
}) {
  const rows = templatePreviewRows(tpl.kind);
  return (
    <div className="group relative flex flex-col gap-2 rounded-xl border border-border bg-card p-3 transition hover:border-primary hover:shadow-md">
      <button
        type="button"
        onClick={() => onPick(tpl)}
        className="flex flex-col gap-2 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-ring"
        aria-label={`${tpl.name} টেমপ্লেট নতুন পাতায় যোগ করুন`}
      >
        <TemplatePreview tpl={tpl} />
        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold leading-tight">
            <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: tpl.accent }} />
            {tpl.name}
          </p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tpl.desc}</p>
        </div>
      </button>
      <TooltipProvider delayDuration={250}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => onReplace(tpl)}
              disabled={!canReplace}
              className={cn(
                'absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-white/95 px-1.5 py-1 text-[10px] font-medium text-slate-600 shadow-sm transition',
                canReplace ? 'hover:border-primary hover:text-primary' : 'cursor-not-allowed opacity-40',
              )}
              aria-label={`বর্তমান পাতার লেখা বদলে “${tpl.name}” বসান`}
            >
              <Replace size={11} /> এই পাতায়
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">
            {canReplace ? 'বর্তমান পাতার লেখা মুছে এই ডিজাইন বসান' : 'কভার পাতায় প্রয়োগ করা যাবে না'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {/* ফলব্যাক প্রিভিউ ডেটা (স্ক্রিন-রিডারের জন্য বর্ণনা সংরক্ষণ) */}
      <span className="sr-only">{rows.length} উপাদানের প্রিভিউ</span>
    </div>
  );
}

export function TemplatesDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'templates';
  const [cat, setCat] = useState<TemplateCategory | 'all'>('all');
  const [replaceTarget, setReplaceTarget] = useState<PageTemplate | null>(null);

  const pick = (tpl: PageTemplate) => {
    const s = useEditorStore.getState();
    const afterId = s.activePageId ?? s.pages[s.pages.length - 1]?.id ?? null;
    const newId = s.addPage(afterId, tpl.html);
    s.setActivePage(newId);
    toast.success(`“${tpl.name}” নতুন পাতায় যোগ হয়েছে`, {
      description: 'পাতাটি বর্তমান পাতার ঠিক পরে বসেছে — এখন নিজের মতো এডিট করুন।',
    });
    close();
  };

  const activePage = useEditorStore((s) => s.pages.find((p) => p.id === s.activePageId) ?? null);
  const canReplace = Boolean(activePage && activePage.kind === 'normal');

  const confirmReplace = () => {
    if (!replaceTarget) return;
    const s = useEditorStore.getState();
    const pageId = s.activePageId;
    if (!pageId) return;
    s.replacePageHtml(pageId, replaceTarget.html);
    s.setActivePage(pageId);
    toast.success(`বর্তমান পাতায় “${replaceTarget.name}” বসানো হয়েছে`);
    setReplaceTarget(null);
    close();
  };

  const filtered = cat === 'all' ? PAGE_TEMPLATES : PAGE_TEMPLATES.filter((t) => t.category === cat);

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && close()}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              📚 বইয়ের পেজ টেমপ্লেট
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                {PAGE_TEMPLATES.length}টি প্রো ডিজাইন
              </span>
            </DialogTitle>
            <DialogDescription>
              কার্ডে যে ডিজাইন দেখছেন — ক্লিক করলে ঠিক সেটিই নতুন পাতা বসবে (বর্তমান পাতার পরে)।
              <span className="hidden sm:inline"> “এই পাতায়” বোতামে বর্তমান পাতার লেখা বদলে ডিজাইনটি বসে।</span>
            </DialogDescription>
          </DialogHeader>

          {/* ক্যাটাগরি ফিল্টার */}
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="টেমপ্লেট ক্যাটাগরি">
            {(['all', ...TEMPLATE_CATEGORY_ORDER] as const).map((c) => {
              const count = c === 'all' ? PAGE_TEMPLATES.length : PAGE_TEMPLATES.filter((t) => t.category === c).length;
              return (
                <button
                  key={c}
                  type="button"
                  role="tab"
                  aria-selected={cat === c}
                  onClick={() => setCat(c)}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition',
                    cat === c
                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  {c === 'all' ? 'সবগুলো' : TEMPLATE_CATEGORY_LABELS[c as TemplateCategory]}
                  <span className={cn('ml-1 opacity-70')}>({count})</span>
                </button>
              );
            })}
          </div>

          <ScrollArea className="h-[56vh] pr-2">
            <div className="grid grid-cols-1 gap-3 pb-2 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((tpl) => (
                <TemplateCard
                  key={tpl.id}
                  tpl={tpl}
                  onPick={pick}
                  onReplace={() => setReplaceTarget(tpl)}
                  canReplace={canReplace}
                />
              ))}
            </div>
            <p className="flex items-center justify-center gap-1.5 pb-3 text-center text-[11px] text-muted-foreground">
              <ArrowDownToLine size={12} />
              টিপস: প্লেসহোল্ডার লেখাগুলো মুছে নিজের তথ্য বসান — ছবি, আইকন ও বক্স সবই পরে বদলানো যায়।
            </p>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* বর্তমান পাতার লেখা বদলানোর নিশ্চিতকরণ */}
      <AlertDialog open={replaceTarget !== null} onOpenChange={(v) => !v && setReplaceTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>বর্তমান পাতার লেখা বদলে বসান?</AlertDialogTitle>
            <AlertDialogDescription>
              এই পাতার এখনকার সব লেখা মুছে “{replaceTarget?.name}” ডিজাইনটি বসবে। এটি ফেরানো যাবে না —
              গুরুত্বপূর্ণ লেখা থাকলে আগে নতুন পাতা হিসেবে যোগ করুন।
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>বাতিল</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReplace}>হ্যাঁ, বদলে বসান</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
