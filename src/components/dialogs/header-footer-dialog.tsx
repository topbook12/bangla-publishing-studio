/**
 * হেডার/ফুটার মাস্টার — স্টাইল, টেক্সট, রং, ফন্ট সাইজ, পেজ নম্বর সেটিংস
 */

'use client';

import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { COLOR_SWATCHES } from '@/lib/paper';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import type { HeaderFooterStyle } from '@/lib/types';
import { cn } from '@/lib/utils';

const STYLES: Array<{ id: HeaderFooterStyle; name: string; desc: string }> = [
  { id: 'parallel', name: 'প্যারালাল TEXT (উদ্ভাস স্টাইল)', desc: 'ডাবল দাগ, বামে টপিক ট্যাগ, ডানে বইয়ের নাম' },
  { id: 'royal', name: 'ক্লাসিক বুক (রয়্যাল ফ্লোরিশ)', desc: 'সেন্টারে অলংকৃত ফ্লোরিশ ও শিরোনাম' },
  { id: 'academic', name: 'একাডেমিক মিনিমাল', desc: 'স্লিম বর্ডার ও বাম-ডান টেক্সট' },
  { id: 'plain', name: 'সাধারণ', desc: 'শুধু টেক্সট, দাগ নেই' },
  { id: 'none', name: 'নেই', desc: 'হেডার/ফুটার বন্ধ' },
];

function StylePreview({ style, accent }: { style: HeaderFooterStyle; accent: string }) {
  if (style === 'parallel') {
    return (
      <div className="rounded border border-border p-1.5 text-[10px]">
        <div className="border-t-[3px]" style={{ borderColor: accent, borderTopStyle: 'double' }} />
        <div className="flex justify-between px-1 py-0.5" style={{ color: accent }}>
          <span>অধ্যায় ১ — টপিক</span><span>বইয়ের নাম</span>
        </div>
        <div className="border-t-[3px]" style={{ borderColor: accent, borderTopStyle: 'double' }} />
      </div>
    );
  }
  if (style === 'royal') {
    return (
      <div className="rounded border border-border p-1.5 text-center text-[10px]" style={{ color: accent }}>
        <div>❦ বইয়ের নাম ❦</div>
        <div className="mt-0.5 border-t" style={{ borderColor: accent }} />
      </div>
    );
  }
  if (style === 'academic') {
    return (
      <div className="flex justify-between rounded border border-border px-1.5 py-1 text-[10px]" style={{ borderBottomColor: accent }}>
        <span style={{ color: accent }}>অধ্যায়ের নাম</span><span>প্রতিষ্ঠান</span>
      </div>
    );
  }
  if (style === 'plain') {
    return <div className="rounded border border-border p-1.5 text-center text-[10px]">বইয়ের নাম</div>;
  }
  return <div className="rounded border border-border p-1.5 text-center text-[10px] text-muted-foreground">(বন্ধ)</div>;
}

export function HeaderFooterDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const settings = useEditorStore((s) => s.settings);
  const update = useEditorStore((s) => s.updateSettings);
  const open = openDialog === 'headerFooter';

  const header = settings.header;
  const footer = settings.footer;
  const pn = settings.pageNumber;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>হেডার, ফুটার ও পেজ নম্বর মাস্টার</DialogTitle>
          <DialogDescription>
            একবার সেট করলে সব পাতায় স্বয়ংক্রিয়ভাবে প্রযোজ্য হবে (Lock Across Pages)
          </DialogDescription>
        </DialogHeader>

        {/* হেডার */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">হেডার</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="hdr-on" className="text-xs">চালু</Label>
              <Switch id="hdr-on" checked={header.enabled} onCheckedChange={(v) => update({ header: { ...header, enabled: v } })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                title={s.desc}
                onClick={() => update({ header: { ...header, style: s.id } })}
                className={cn(
                  'rounded-lg border p-2 text-left transition hover:border-primary',
                  header.style === s.id && 'border-primary ring-1 ring-primary',
                )}
              >
                <StylePreview style={s.id} accent={header.accentColor} />
                <p className="mt-1.5 text-[11px] font-semibold leading-tight">{s.name}</p>
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">বাম টেক্সট (টপিক/অধ্যায়)</Label>
              <Input value={header.leftText} onChange={(e) => update({ header: { ...header, leftText: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">মাঝের টেক্সট</Label>
              <Input value={header.centerText} onChange={(e) => update({ header: { ...header, centerText: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ডান টেক্সট (বইয়ের নাম)</Label>
              <Input value={header.rightText} onChange={(e) => update({ header: { ...header, rightText: e.target.value } })} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">দাগের রং:</Label>
              {['#4f46e5', '#7f1d1d', '#0f766e', '#b45309', '#0f172a'].map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`রং ${c}`}
                  className={cn('h-5 w-5 rounded-full border-2', header.accentColor === c ? 'border-foreground' : 'border-transparent')}
                  style={{ backgroundColor: c }}
                  onClick={() => update({ header: { ...header, accentColor: c }, footer: { ...footer, accentColor: c } })}
                />
              ))}
              <input
                type="color"
                aria-label="কাস্টম রং"
                className="h-5 w-8 cursor-pointer"
                value={header.accentColor}
                onChange={(e) => update({ header: { ...header, accentColor: e.target.value }, footer: { ...footer, accentColor: e.target.value } })}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <Label className="text-xs">ফন্ট সাইজ (pt):</Label>
              <input
                type="number"
                className="ribbon-number w-14"
                value={header.fontSize}
                min={7}
                max={14}
                onChange={(e) => update({ header: { ...header, fontSize: Math.max(7, Math.min(14, Number(e.target.value) || 10)) } })}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* ফুটার */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">ফুটার</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="ftr-on" className="text-xs">চালু</Label>
              <Switch id="ftr-on" checked={footer.enabled} onCheckedChange={(v) => update({ footer: { ...footer, enabled: v } })} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs">বাম টেক্সট</Label>
              <Input value={footer.leftText} onChange={(e) => update({ footer: { ...footer, leftText: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">মাঝের টেক্সট</Label>
              <Input value={footer.centerText} onChange={(e) => update({ footer: { ...footer, centerText: e.target.value } })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">ডান টেক্সট</Label>
              <Input value={footer.rightText} onChange={(e) => update({ footer: { ...footer, rightText: e.target.value } })} />
            </div>
          </div>
        </section>

        <Separator />

        {/* পেজ নম্বর */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold">পেজ নম্বর</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="pn-on" className="text-xs">চালু</Label>
              <Switch id="pn-on" checked={pn.enabled} onCheckedChange={(v) => update({ pageNumber: { ...pn, enabled: v } })} />
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-4">
            <div className="space-y-1">
              <Label className="text-xs">ফরম্যাট</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                value={pn.format}
                onChange={(e) => update({ pageNumber: { ...pn, format: e.target.value as typeof pn.format } })}
              >
                <option value="bangla">বাংলা (১, ২, ৩)</option>
                <option value="english">ইংরেজি (1, 2, 3)</option>
                <option value="roman">রোমান (I, II, III)</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">অবস্থান</Label>
              <select
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                value={pn.position}
                onChange={(e) => update({ pageNumber: { ...pn, position: e.target.value as typeof pn.position } })}
              >
                <option value="bottom-center">নিচে-মাঝে</option>
                <option value="bottom-right">নিচে-ডানে</option>
                <option value="bottom-left">নিচে-বাঁয়ে</option>
                <option value="top-center">উপরে-মাঝে</option>
                <option value="top-right">উপরে-ডানে</option>
                <option value="top-left">উপরে-বাঁয়ে</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">প্রথম নম্বর</Label>
              <Input
                type="number"
                value={pn.startAt}
                min={0}
                max={999}
                onChange={(e) => update({ pageNumber: { ...pn, startAt: Math.max(0, Math.min(999, Number(e.target.value) || 1)) } })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">প্রিফিক্স</Label>
              <Input value={pn.prefix} placeholder="যেমন: পৃষ্ঠা " onChange={(e) => update({ pageNumber: { ...pn, prefix: e.target.value } })} />
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch id="df-first" checked={pn.differentFirst} onCheckedChange={(v) => update({ pageNumber: { ...pn, differentFirst: v } })} />
              <Label htmlFor="df-first" className="text-xs">ভিন্ন প্রথম পৃষ্ঠা (কভারে লুকান)</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="odd-even" checked={pn.oddEven} onCheckedChange={(v) => update({ pageNumber: { ...pn, oddEven: v } })} />
              <Label htmlFor="odd-even" className="text-xs">অজর/জোড় পাতায় বিপরীত অ্যালাইনমেন্ট</Label>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            টিপ: নির্দিষ্ট পৃষ্ঠার “পৃষ্ঠা মেনু” থেকে সেই পাতার হেডার/ফুটার আলাদাভাবে লুকানো যায় (অধ্যায়ের শুরুর পাতার জন্য)।
          </p>
        </section>

        <p className="text-[10px] text-muted-foreground">
          রং প্যালেট: {COLOR_SWATCHES.length}টি প্রিসেট রঙ লেখার রং হিসেবে হোম ট্যাবে পাওয়া যায়।
        </p>
      </DialogContent>
    </Dialog>
  );
}
