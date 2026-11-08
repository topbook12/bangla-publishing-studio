/**
 * দিন ৬৯ — টাইপোগ্রাফি প্যাক ডায়ালগ — মাদ্রাসা/সংস্কৃত/হিন্দি প্রকাশনা-প্রথার
 * ফন্ট-জোড় প্রয়োগ + পুরো ডকুমেন্টে সংখ্যা-প্রথা রূপান্তর (snapshot-সুরক্ষিত)।
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { Hash, Loader2, Palette, Type } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PHero } from '@/components/premium';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { useT, useFmtNum, useLangStore } from '@/lib/i18n';
import {
  TYPOGRAPHY_PACKS, convertDigitsInHtml, packSampleLine, type TypographyPack,
} from '@/lib/typography-packs';
import { toast } from 'sonner';

export function TypographyPackDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'typography';
  const tt = useT();
  const ff = useFmtNum();
  const lang = useLangStore((s) => s.lang);

  const [busy, setBusy] = useState<string | null>(null);

  const applyFont = useCallback(async (pack: TypographyPack) => {
    setBusy(`font-${pack.id}`);
    try {
      useEditorStore.getState().updateSettings({ defaultFont: pack.bodyFont });
      toast.success(tt('tp.toast.font').split('{f}').join(pack.bodyFont));
    } finally {
      setBusy(null);
    }
  }, [tt]);

  const applyDigits = useCallback(async (pack: TypographyPack) => {
    setBusy(`digits-${pack.id}`);
    try {
      const st = useEditorStore.getState();
      if (!st.projectId) return;
      // নিরাপত্তা-জাল — গঠনগত ব্যাপক বদল
      await st.guardSnapshot('সংখ্যা-রূপান্তরের আগে / Before numeral conversion');
      let touched = 0;
      for (const p of st.pages) {
        if (p.kind !== 'normal') continue; // কভার-পাতা নিজস্ব রেন্ডারারে আঁকা — স্কিপ
        const next = convertDigitsInHtml(p.html, pack.numerals);
        if (next !== p.html) {
          st.updatePage(p.id, { html: next });
          touched += 1;
        }
      }
      if (touched > 0) {
        st.setSaveState({ status: 'saving', at: Date.now() });
        toast.success(tt('tp.toast.digits').split('{n}').join(ff(touched)));
      } else {
        toast.info(tt('tp.toast.digitsNone'));
      }
    } finally {
      setBusy(null);
    }
  }, [tt, ff]);

  useEffect(() => {
    if (open) setBusy(null);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('tp.title')}</DialogTitle>
          <DialogDescription>{tt('tp.desc')}</DialogDescription>
        </DialogHeader>
        <PHero tone="violet" icon={Palette} title={tt('tp.title')} desc={tt('tp.desc')} />

        <div className="nav-scroll max-h-80 space-y-2 overflow-y-auto pr-1">
          {TYPOGRAPHY_PACKS.map((pack) => (
            <div key={pack.id} className="rounded-lg border p-3 transition hover:border-primary/50">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold">{pack.name[lang]}</p>
                <Badge variant="outline" className="shrink-0 gap-1 text-muted-foreground">
                  <Hash size={10} aria-hidden="true" /> {packSampleLine(pack, lang)}
                </Badge>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{pack.desc[lang]}</p>
              <p className="mt-1.5 flex flex-wrap items-center gap-1 text-[11px] text-muted-foreground">
                <Type size={11} aria-hidden="true" className="text-primary" />
                <span className="font-medium">{pack.headingFont}</span> +{' '}
                <span className="font-medium">{pack.bodyFont}</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  disabled={busy !== null}
                  onClick={() => void applyFont(pack)}
                >
                  {busy === `font-${pack.id}` ? <Loader2 size={13} className="animate-spin" /> : <Type size={13} />}
                  {tt('tp.applyFont')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
                  disabled={busy !== null}
                  title={tt('tp.applyDigitsTip')}
                  onClick={() => void applyDigits(pack)}
                >
                  {busy === `digits-${pack.id}` ? <Loader2 size={13} className="animate-spin" /> : <Hash size={13} />}
                  {tt('tp.applyDigits')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
