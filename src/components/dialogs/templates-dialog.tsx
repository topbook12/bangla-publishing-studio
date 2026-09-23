/**
 * বইয়ের পেজ টেমপ্লেট গ্যালারি — সূচিপত্র, শিরোনাম পাতা, লেখকের পরিচিতি ইত্যাদি
 * ডিজাইন-রেডি পাতা এক ক্লিকে তৈরি। নতুন পাতাটি বর্তমান পাতার ঠিক পরে বসে।
 */

'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { PAGE_TEMPLATES, templatePreviewRows, type PageTemplate } from '@/lib/page-templates';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function TemplateCard({ tpl, onPick }: { tpl: PageTemplate; onPick: (t: PageTemplate) => void }) {
  const rows = templatePreviewRows(tpl.kind);
  return (
    <button
      type="button"
      onClick={() => onPick(tpl)}
      className="group flex flex-col gap-2 rounded-xl border border-border bg-card p-3 text-left transition hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring"
      aria-label={`${tpl.name} টেমপ্লেট যোগ করুন`}
    >
      <div className="flex h-28 flex-col justify-center gap-1.5 rounded-lg border border-dashed border-border bg-muted/40 p-3">
        {rows.map((r, i) => (
          <span
            key={i}
            className={cn('block rounded-sm opacity-80 transition group-hover:opacity-100')}
            style={{
              width: r.w,
              height: r.h,
              backgroundColor: tpl.accent,
              opacity: r.short ? 0.35 : undefined,
              alignSelf: r.center ? 'center' : undefined,
              borderRadius: r.center && r.h > 10 ? 8 : undefined,
            }}
          />
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold leading-tight">{tpl.name}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tpl.desc}</p>
      </div>
    </button>
  );
}

export function TemplatesDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'templates';

  const pick = (tpl: PageTemplate) => {
    const s = useEditorStore.getState();
    const afterId = s.activePageId ?? s.pages[s.pages.length - 1]?.id ?? null;
    const newId = s.addPage(afterId, tpl.html);
    s.setActivePage(newId);
    toast.success(`“${tpl.name}” টেমপ্লেট নতুন পাতায় যোগ হয়েছে`);
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[88vh] max-w-3xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>বইয়ের পেজ টেমপ্লেট</DialogTitle>
          <DialogDescription>
            এক ক্লিকে ডিজাইন-রেডি পাতা যোগ করুন — পাতাটি বর্তমান পাতার ঠিক পরে বসবে, তারপর নিজের মতো এডিট করুন।
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[58vh] pr-2">
          <div className="grid grid-cols-2 gap-3 pb-2 sm:grid-cols-3">
            {PAGE_TEMPLATES.map((tpl) => (
              <TemplateCard key={tpl.id} tpl={tpl} onPick={pick} />
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
