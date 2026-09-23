/**
 * নির্দিষ্ট পাতার কাস্টম হেডার/ফুটার — গ্লোবাল মাস্টার সব পাতায় এক থাকে,
 * কিন্তু যেকোনো পাতায় এই ডায়ালগ থেকে আলাদা হেডার/ফুটার সেট করা যায়।
 * স্টোরেজ: PageData.headerOverride / footerOverride (null = গ্লোবাল ফলো করে)।
 */

'use client';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { RotateCcw } from 'lucide-react';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import type { HeaderFooterSettings, HeaderFooterStyle } from '@/lib/types';
import { cn } from '@/lib/utils';

const STYLE_OPTIONS: Array<{ id: HeaderFooterStyle; name: string }> = [
  { id: 'parallel', name: 'প্যারালাল (ডাবল দাগ)' },
  { id: 'royal', name: 'রয়্যাল ফ্লোরিশ' },
  { id: 'academic', name: 'একাডেমিক' },
  { id: 'plain', name: 'সাধারণ' },
  { id: 'none', name: 'নেই (বন্ধ)' },
];

const ACCENTS = ['#4f46e5', '#7f1d1d', '#0f766e', '#b45309', '#be185d', '#0f172a'];

function HfEditor({
  section, value, globalValue, onChange, onReset,
}: {
  section: 'header' | 'footer';
  value: HeaderFooterSettings;
  globalValue: HeaderFooterSettings;
  onChange: (next: HeaderFooterSettings) => void;
  onReset: () => void;
}) {
  const label = section === 'header' ? 'হেডার' : 'ফুটার';
  const set = (patch: Partial<HeaderFooterSettings>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold">{label}</h3>
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={onReset}>
            <RotateCcw size={12} aria-hidden="true" /> গ্লোবালে ফিরুন
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        {STYLE_OPTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => set({ style: s.id })}
            className={cn(
              'rounded-md border px-2 py-1.5 text-xs transition hover:border-primary',
              value.style === s.id && 'border-primary bg-primary/10 font-medium',
            )}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <div className="space-y-1">
          <Label className="text-xs">বাম টেক্সট</Label>
          <Input value={value.leftText} onChange={(e) => set({ leftText: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">মাঝের টেক্সট</Label>
          <Input value={value.centerText} onChange={(e) => set({ centerText: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">ডান টেক্সট</Label>
          <Input value={value.rightText} onChange={(e) => set({ rightText: e.target.value })} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">রং:</Label>
          {ACCENTS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`রং ${c}`}
              className={cn('h-5 w-5 rounded-full border-2', value.accentColor === c ? 'border-foreground scale-110' : 'border-transparent')}
              style={{ backgroundColor: c }}
              onClick={() => set({ accentColor: c })}
            />
          ))}
          <input
            type="color"
            aria-label="কাস্টম রং"
            className="h-5 w-8 cursor-pointer"
            value={value.accentColor}
            onChange={(e) => set({ accentColor: e.target.value })}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-xs">ফন্ট সাইজ (pt):</Label>
          <input
            type="number"
            className="ribbon-number w-14"
            value={value.fontSize}
            min={7}
            max={14}
            onChange={(e) => set({ fontSize: Math.max(7, Math.min(14, Number(e.target.value) || 10)) })}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <Switch id={`hf-enabled-${section}`} checked={value.enabled} onCheckedChange={(v) => set({ enabled: v })} />
          <Label htmlFor={`hf-enabled-${section}`} className="text-xs">চালু</Label>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        গ্লোবাল {label}: {STYLE_OPTIONS.find((s) => s.id === globalValue.style)?.name ?? globalValue.style}
        {' · '}{globalValue.leftText || globalValue.centerText || globalValue.rightText || '(খালি)'}
      </p>
    </div>
  );
}

export function PageChromeDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const pageChromeId = useUiStore((s) => s.pageChromeId);
  const pages = useEditorStore((s) => s.pages);
  const settings = useEditorStore((s) => s.settings);
  const updatePage = useEditorStore((s) => s.updatePage);

  const open = openDialog === 'pageChrome' && !!pageChromeId;
  const page = pages.find((p) => p.id === pageChromeId);
  const pageIndex = pages.findIndex((p) => p.id === pageChromeId);

  if (!open || !page) return null;

  const headerOverride = page.headerOverride ?? null;
  const footerOverride = page.footerOverride ?? null;

  const enableHeader = () => {
    // গ্লোবাল হেডারের কপি দিয়ে শুরু — ব্যবহারকারী সহজে ছোট পরিবর্তন করতে পারেন
    updatePage(page.id, { headerOverride: { ...settings.header } });
  };
  const enableFooter = () => {
    updatePage(page.id, { footerOverride: { ...settings.footer } });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>পৃষ্ঠা {pageIndex + 1} — কাস্টম হেডার ও ফুটার</DialogTitle>
          <DialogDescription>
            সাধারণভাবে সব পাতায় একই হেডার/ফুটার চলে। শুধু এই পাতায় ভিন্ন হেডার/ফুটার চাইলে নিচে সেট করুন —
            বাকি পাতাগুলো গ্লোবাল মাস্টার মেনেই চলবে।
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
            <div>
              <p className="text-sm font-semibold">কাস্টম হেডার (শুধু এই পাতায়)</p>
              <p className="text-[11px] text-muted-foreground">
                {headerOverride ? 'চালু — এই পাতায় নিচের হেডার প্রযোজ্য' : 'বন্ধ — গ্লোবাল হেডার ব্যবহৃত হচ্ছে'}
              </p>
            </div>
            <Switch
              checked={!!headerOverride}
              onCheckedChange={(v) => (v ? enableHeader() : updatePage(page.id, { headerOverride: null }))}
              aria-label="কাস্টম হেডার চালু/বন্ধ"
            />
          </div>
          {headerOverride ? (
            <HfEditor
              section="header"
              value={headerOverride}
              globalValue={settings.header}
              onChange={(next) => updatePage(page.id, { headerOverride: next })}
              onReset={() => updatePage(page.id, { headerOverride: null })}
            />
          ) : null}
        </section>

        <Separator />

        <section className="space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2">
            <div>
              <p className="text-sm font-semibold">কাস্টম ফুটার (শুধু এই পাতায়)</p>
              <p className="text-[11px] text-muted-foreground">
                {footerOverride ? 'চালু — এই পাতায় নিচের ফুটার প্রযোজ্য' : 'বন্ধ — গ্লোবাল ফুটার ব্যবহৃত হচ্ছে'}
              </p>
            </div>
            <Switch
              checked={!!footerOverride}
              onCheckedChange={(v) => (v ? enableFooter() : updatePage(page.id, { footerOverride: null }))}
              aria-label="কাস্টম ফুটার চালু/বন্ধ"
            />
          </div>
          {footerOverride ? (
            <HfEditor
              section="footer"
              value={footerOverride}
              globalValue={settings.footer}
              onChange={(next) => updatePage(page.id, { footerOverride: next })}
              onReset={() => updatePage(page.id, { footerOverride: null })}
            />
          ) : null}
        </section>

        <p className="text-[11px] text-muted-foreground">
          টিপ: পেজ নম্বর এখনো গ্লোবাল সেটিংস মেনে চলে (ডিজাইন ট্যাবে পরিবর্তন করা যায়)। কোনো পাতায় সব লুকাতে
          চাইলে “পৃষ্ঠা মেনু → হেডার/ফুটার লুকান” ব্যবহার করুন।
        </p>
      </DialogContent>
    </Dialog>
  );
}
