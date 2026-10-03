/**
 * কভার পেজ জেনারেটর — বইয়ের প্রচ্ছদ তৈরি
 */

'use client';

import { useState } from 'react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { useT } from '@/lib/i18n';
import { CoverView } from '@/components/editor/cover-view';
import type { CoverData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACCENTS = ['#4f46e5', '#7f1d1d', '#0f766e', '#b45309', '#be185d', '#0f172a'];

/** স্টাইলের নাম অভিধান-কী হিসেবে — রেন্ডারের সময় ভাষা অনুযায়ী সমাধান */
const STYLES: Array<{ id: CoverData['style']; nameKey: string }> = [
  { id: 'classic', nameKey: 'dlg1.cover.style.classic' },
  { id: 'modern', nameKey: 'dlg1.cover.style.modern' },
  { id: 'coaching', nameKey: 'dlg1.cover.style.coaching' },
];

export function CoverDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const open = openDialog === 'cover';
  // key-remount প্যাটার্ন (app-header RenameDialog-এর মতোই) — খোলা/বন্ধ টগলে
  // ভেতরের কম্পোনেন্ট নতুন করে মাউন্ট হয়, ফলে useState প্রতিবার বর্তমান
  // প্রজেক্টের কভার-ডেটা দিয়ে শুরু হয়। আগে কম্পোনেন্ট সবসময় মাউন্টেড থেকে
  // প্রথম রেন্ডারের ভ্যালুতে আটকে থাকত — বই পরিবর্তনের পর "হালনাগাদ করুন"
  // চাপলে পুরনো/অন্য বইয়ের ডেটা দিয়ে বর্তমান কভার মুছে ফেলত।
  return <CoverDialogBody key={open ? 'open' : 'closed'} open={open} />;
}

function CoverDialogBody({ open }: { open: boolean }) {
  const tt = useT();
  const close = useUiStore((s) => s.close);
  const title = useEditorStore((s) => s.title);
  const addCoverPage = useEditorStore((s) => s.addCoverPage);
  const pages = useEditorStore((s) => s.pages);
  const existing = pages.find((p) => p.kind === 'cover')?.coverData;

  const [data, setData] = useState<CoverData>(existing ?? {
    title,
    subtitle: '',
    author: '',
    organization: '',
    course: '',
    year: new Date().getFullYear().toString(),
    accentColor: '#4f46e5',
    style: 'coaching',
  });

  const set = (patch: Partial<CoverData>) => setData((d) => ({ ...d, ...patch }));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? tt('dlg1.cover.edit') : tt('dlg1.cover.new')}</DialogTitle>
          <DialogDescription>
            {tt('dlg1.cover.desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.bookTitle')}</Label>
              <Input value={data.title} onChange={(e) => set({ title: e.target.value })} placeholder={tt('dlg1.cover.phTitle')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.subtitle')}</Label>
              <Input value={data.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder={tt('dlg1.cover.phSubtitle')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.org')}</Label>
              <Input value={data.organization} onChange={(e) => set({ organization: e.target.value })} placeholder={tt('dlg1.cover.phOrg')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.course')}</Label>
              <Input value={data.course} onChange={(e) => set({ course: e.target.value })} placeholder={tt('dlg1.cover.phCourse')} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.author')}</Label>
              <Input value={data.author} onChange={(e) => set({ author: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.year')}</Label>
              <Input value={data.year} onChange={(e) => set({ year: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.styleLabel')}</Label>
              <div className="flex gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn('rounded-md border px-2 py-1 text-xs', data.style === s.id && 'border-primary bg-accent')}
                    onClick={() => set({ style: s.id })}
                  >
                    {tt(s.nameKey)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{tt('dlg1.cover.accent')}</Label>
              <div className="flex gap-1.5">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={tt('dlg1.color.named').split('{c}').join(c)}
                    className={cn('h-6 w-6 rounded-full border-2', data.accentColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    onClick={() => set({ accentColor: c })}
                  />
                ))}
                <input type="color" aria-label={tt('dlg1.color.custom')} className="h-6 w-9 cursor-pointer" value={data.accentColor} onChange={(e) => set({ accentColor: e.target.value })} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center overflow-hidden rounded-lg border border-dashed p-3">
            <div className="relative" style={{ width: 240, height: 340 }}>
              <div
                style={{
                  width: '210mm',
                  height: '297mm',
                  transform: 'scale(0.295)',
                  transformOrigin: 'top left',
                  boxShadow: '0 2px 12px rgba(0,0,0,.25)',
                }}
              >
                <CoverView cover={data} />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={close}>{tt('hdr.cancel')}</Button>
          <Button
            onClick={() => {
              addCoverPage({ ...data, title: data.title || title });
              toast.success(existing ? tt('dlg1.cover.toastUpdated') : tt('dlg1.cover.toastAdded'));
              close();
            }}
          >
            {existing ? tt('dlg1.cover.update') : tt('dlg1.cover.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
