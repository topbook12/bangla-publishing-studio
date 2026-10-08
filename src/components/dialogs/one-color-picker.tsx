/**
 * এক-রঙের বই — কালি-বাছাই মেনু (Design ট্যাব ও টেমপ্লেট স্টোর — দুই জায়গাতেই ব্যবহৃত)।
 *
 * যেকোনো কালি বাছলে: আগে স্বয়ংক্রিয় স্ন্যাপশট → পুরো বইয়ের রঙ ওই কালির ছায়ায়
 * (one-color.ts applyOneColorToBook)। আসল রঙে ফেরা = স্ন্যাপশট পুনরুদ্ধার।
 */

'use client';

import { useState } from 'react';
import { Loader2, Palette, Undo2 } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useEditorStore } from '@/lib/store';
import { useUiStore } from '@/lib/ui-store';
import { applyOneColorToBook, INK_PRESETS } from '@/lib/one-color';
import { tFmt, useT, useFmtNum } from '@/lib/i18n';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function OneColorDropdown({
  children,
  align = 'start',
  contentClassName,
}: {
  /** ট্রিগার (RibbonButton বা ছোট চিপ) */
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  contentClassName?: string;
}) {
  const tt = useT();
  const nf = useFmtNum();
  const openDialog = useUiStore((s) => s.open);
  const ink = useEditorStore((s) => s.settings.singleColor ?? null);
  const [pending, setPending] = useState<string | null>(null);
  const [confirmInk, setConfirmInk] = useState<string | null>(null);

  const doApply = async (hex: string) => {
    setPending(hex);
    setConfirmInk(null);
    try {
      const res = await applyOneColorToBook(hex);
      toast.success(tFmt('dsn.ink.toastDone', { n: res.pagesTouched }), {
        description: res.snapshotTaken ? tt('dsn.ink.toastSnapshot') : undefined,
      });
    } catch {
      toast.error(tt('dsn.ink.toastFail'));
    } finally {
      setPending(null);
    }
  };

  const activePreset = INK_PRESETS.find((p) => p.hex.toLowerCase() === (ink ?? '').toLowerCase());

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
        <DropdownMenuContent align={align} className={cn('w-72 p-3', contentClassName)}>
          <p className="text-xs font-semibold">{tt('dsn.ink.title')}</p>
          <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tt('dsn.ink.desc')}</p>

          <div className="mt-2.5 flex flex-wrap gap-2" role="listbox" aria-label={tt('dsn.ink.title')}>
            {INK_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                role="option"
                aria-selected={ink === p.hex}
                title={tt(p.labelKey)}
                disabled={pending !== null}
                onClick={() => setConfirmInk(p.hex)}
                style={{ backgroundColor: p.hex }}
                className={cn('ink-swatch', ink === p.hex && 'ink-swatch-active')}
              >
                {pending === p.hex ? (
                  <Loader2 size={14} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-white" aria-hidden="true" />
                ) : null}
              </button>
            ))}
          </div>
          <p className="mt-1.5 text-[10px] text-muted-foreground" aria-hidden="true">
            {confirmInk ? tt(INK_PRESETS.find((p) => p.hex === confirmInk)?.labelKey ?? 'dsn.ink.title') : activePreset ? `${tt('dsn.ink.active')}: ${tt(activePreset.labelKey)}` : tt('dsn.ink.pickHint')}
          </p>

          {ink && (
            <div className="mt-2 border-t pt-2">
              <DropdownMenuItem
                className="gap-2 text-[11px] text-muted-foreground"
                onClick={() => openDialog('snapshots')}
              >
                <Undo2 size={13} aria-hidden="true" />
                {tt('dsn.ink.restore')}
              </DropdownMenuItem>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* প্রয়োগের আগে নিশ্চিতকরণ — বই-ব্যাপী পরিবর্তন বলে */}
      <AlertDialog open={confirmInk !== null} onOpenChange={(v) => { if (!v) setConfirmInk(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="inline-block h-4 w-4 rounded-full" style={{ backgroundColor: confirmInk ?? '#000' }} aria-hidden="true" />
              {tt('dsn.ink.confirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tt('dsn.ink.confirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tt('hdr.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmInk) void doApply(confirmInk); }}>
              <Palette size={14} aria-hidden="true" />
              {tt('dsn.ink.confirmYes')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
