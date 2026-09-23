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
import { CoverView } from '@/components/editor/cover-view';
import type { CoverData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACCENTS = ['#4f46e5', '#7f1d1d', '#0f766e', '#b45309', '#be185d', '#0f172a'];

const STYLES: Array<{ id: CoverData['style']; name: string }> = [
  { id: 'classic', name: 'ক্লাসিক (সাহিত্য)' },
  { id: 'modern', name: 'আধুনিক' },
  { id: 'coaching', name: 'কোচিং/একাডেমি' },
];

export function CoverDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'cover';
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
          <DialogTitle>{existing ? 'কভার পেজ সম্পাদনা' : 'কভার পেজ জেনারেটর'}</DialogTitle>
          <DialogDescription>
            তথ্য দিন — প্রথম পৃষ্ঠায় সুন্দর প্রচ্ছদ তৈরি হবে (হেডার/ফুটার ছাড়া)
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">বইয়ের নাম *</Label>
              <Input value={data.title} onChange={(e) => set({ title: e.target.value })} placeholder="যেমন: মাধ্যমিক গণিত সম্পূর্ণ গাইড" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">সাবটাইটেল</Label>
              <Input value={data.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="যেমন: অধ্যায় ১-১০ সমাধানসহ" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">প্রতিষ্ঠান</Label>
              <Input value={data.organization} onChange={(e) => set({ organization: e.target.value })} placeholder="যেমন: উজ্জ্বল একাডেমি" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">শ্রেণি/কোর্স</Label>
              <Input value={data.course} onChange={(e) => set({ course: e.target.value })} placeholder="যেমন: নবম-দশম শ্রেণি" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">লেখক/সংকলক</Label>
              <Input value={data.author} onChange={(e) => set({ author: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">সাল/সংস্করণ</Label>
              <Input value={data.year} onChange={(e) => set({ year: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">স্টাইল</Label>
              <div className="flex gap-1.5">
                {STYLES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={cn('rounded-md border px-2 py-1 text-xs', data.style === s.id && 'border-primary bg-accent')}
                    onClick={() => set({ style: s.id })}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">অ্যাকসেন্ট রং</Label>
              <div className="flex gap-1.5">
                {ACCENTS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`রং ${c}`}
                    className={cn('h-6 w-6 rounded-full border-2', data.accentColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                    style={{ backgroundColor: c }}
                    onClick={() => set({ accentColor: c })}
                  />
                ))}
                <input type="color" aria-label="কাস্টম রং" className="h-6 w-9 cursor-pointer" value={data.accentColor} onChange={(e) => set({ accentColor: e.target.value })} />
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
          <Button variant="outline" onClick={close}>বাতিল</Button>
          <Button
            onClick={() => {
              addCoverPage({ ...data, title: data.title || title });
              toast.success(existing ? 'কভার হালনাগাদ হয়েছে' : 'কভার পেজ প্রথম পৃষ্ঠায় যোগ হয়েছে');
              close();
            }}
          >
            {existing ? 'হালনাগাদ করুন' : 'কভার তৈরি করুন'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
