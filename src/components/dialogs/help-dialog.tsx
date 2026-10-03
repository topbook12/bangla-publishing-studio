/**
 * সহায়িকা (Help) — ব্যবহার নির্দেশিকা ও কীবোর্ড শর্টকাট
 *
 * নতুন ব্যবহারকারী প্রথমে যেসব জিনিস খোঁজেন সেগুলোই এখানে ধাপে ধাপে:
 * লেখা, হেডার/ফুটার, আকৃতি/আইকন, লিংক, ছবি, ফরমা ছাপা, সেভ/ব্যাকআপ।
 *
 * i18n: সব প্রোজ ডিকশনারি-কী — মডিউল-স্কোপে ভাষা ফ্রিজ হয় না,
 * রেন্ডারের সময় tt() দিয়ে মেলে; বোল্ড অংশ tplNodes() দিয়ে বসে।
 */

'use client';

import { CircleHelp, Keyboard } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useUiStore } from '@/lib/ui-store';
import { useT, tplNodes } from '@/lib/i18n';

/** [কী-কম্বো এন্ট্রি, বর্ণনা এন্ট্রি] — দুটোই dict-dialogs-b.ts-এর কী */
const SHORTCUTS: Array<[string, string]> = [
  ['dlg2.help.keys.bold', 'dlg2.help.sc.bold'],
  ['dlg2.help.keys.find', 'dlg2.help.sc.find'],
  ['dlg2.help.keys.undo', 'dlg2.help.sc.undo'],
  ['dlg2.help.keys.newpage', 'dlg2.help.sc.newpage'],
  ['dlg2.help.keys.save', 'dlg2.help.sc.save'],
  ['dlg2.help.keys.print', 'dlg2.help.sc.print'],
  ['dlg2.help.keys.zoom', 'dlg2.help.sc.zoom'],
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
  const tt = useT();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl" data-testid="help-dialog">
        <DialogHeader className="border-b px-5 pb-3 pt-4">
          <DialogTitle className="flex items-center gap-2">
            <CircleHelp size={17} className="text-primary" aria-hidden="true" />
            {tt('dlg2.help.title')}
          </DialogTitle>
          <DialogDescription>
            {tt('dlg2.help.desc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-2 overflow-y-auto px-5 py-4">
          <Step title={tt('dlg2.help.s1.title')}>
            <ul className="list-disc space-y-1 pl-4">
              <li>{tt('dlg2.help.s1.i1')}</li>
              <li>{tt('dlg2.help.s1.i2')}</li>
              <li>{tt('dlg2.help.s1.i3')}</li>
            </ul>
          </Step>

          <Step title={tt('dlg2.help.s2.title')}>
            <ul className="list-disc space-y-1 pl-4">
              <li>{tplNodes(tt('dlg2.help.s2.i1'), { a: <b>{tt('dlg2.help.s2.i1.a')}</b>, b: <b>{tt('dlg2.help.s2.i1.b')}</b> })}</li>
              <li>{tplNodes(tt('dlg2.help.s2.i2'), { a: <b>{tt('dlg2.help.s2.i2.a')}</b> })}</li>
              <li>{tt('dlg2.help.s2.i3')}</li>
            </ul>
          </Step>

          <Step title={tt('dlg2.help.s3.title')}>
            <ul className="list-disc space-y-1 pl-4">
              <li>{tplNodes(tt('dlg2.help.s3.i1'), { a: <b>{tt('dlg2.help.s3.i1.a')}</b> })}</li>
              <li>{tt('dlg2.help.s3.i2')}</li>
              <li>{tplNodes(tt('dlg2.help.s3.i3'), { a: <b>{tt('dlg2.help.s3.i3.a')}</b>, b: <b>{tt('dlg2.help.s3.i3.b')}</b> })}</li>
            </ul>
          </Step>

          <Step title={tt('dlg2.help.s4.title')}>
            <ul className="list-disc space-y-1 pl-4">
              <li>{tplNodes(tt('dlg2.help.s4.i1'), { a: <b>{tt('dlg2.help.s4.i1.a')}</b> })}</li>
              <li>{tt('dlg2.help.s4.i2')}</li>
              <li>{tt('dlg2.help.s4.i3')}</li>
            </ul>
          </Step>

          <Step title={tt('dlg2.help.s5.title')}>
            <ul className="list-disc space-y-1 pl-4">
              <li>{tt('dlg2.help.s5.i1')}</li>
              <li>{tplNodes(tt('dlg2.help.s5.i2'), { a: tt('dlg2.find.replaceAll') })}</li>
            </ul>
          </Step>

          <Step title={tt('dlg2.help.s6.title')}>
            <ul className="list-disc space-y-1 pl-4">
              <li>{tt('dlg2.help.s6.i1')}</li>
              <li>{tt('dlg2.help.s6.i2')}</li>
              <li>{tt('dlg2.help.s6.i3')}</li>
            </ul>
          </Step>

          <Step title={tt('dlg2.help.s7.title')}>
            <ol className="list-decimal space-y-1 pl-4">
              <li>{tt('dlg2.help.s7.i1')}</li>
              <li>{tt('dlg2.help.s7.i2')}</li>
              <li>{tplNodes(tt('dlg2.help.s7.i3'), { a: <b>{tt('dlg2.help.s7.i3.a')}</b>, b: <b>{tt('dlg2.help.s7.i3.b')}</b> })}</li>
              <li>{tt('dlg2.help.s7.i4')}</li>
            </ol>
          </Step>

          <Step title={tt('dlg2.help.s8.title')}>
            <ul className="list-disc space-y-1 pl-4">
              <li>{tplNodes(tt('dlg2.help.s8.i1'), { a: <b>{tt('dlg2.help.s8.i1.a')}</b> })}</li>
              <li>{tplNodes(tt('dlg2.help.s8.i2'), { a: <b>{tt('dlg2.help.s8.i2.a')}</b> })}</li>
              <li>{tplNodes(tt('dlg2.help.s8.i3'), { a: <b>{tt('dlg2.help.s8.i3.a')}</b> })}</li>
            </ul>
          </Step>

          <div className="rounded-lg border bg-muted/30 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Keyboard size={15} aria-hidden="true" /> {tt('dlg2.help.shortcuts')}
            </p>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {SHORTCUTS.map(([keys, desc]) => (
                <div key={keys} className="flex items-center justify-between gap-2 rounded-md bg-background px-2 py-1.5 text-xs">
                  <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">{tt(keys)}</kbd>
                  <span className="text-right text-muted-foreground">{tt(desc)}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="pt-1 text-center text-[11px] text-muted-foreground">
            {tt('dlg2.help.foot')}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
