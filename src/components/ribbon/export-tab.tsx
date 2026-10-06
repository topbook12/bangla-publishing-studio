/**
 * Export tab — print/PDF portal (Normal vs Forma), DOCX, HTML, JSON backup
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeCheck, BookText, FileCode2, FileDown, FileText, FileType2, Loader2, Printer, RefreshCw, TriangleAlert, Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RibbonButton, RibbonDivider, RibbonGroup } from './ribbon-shell';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useEditorStore } from '@/lib/store';
import { currentProjectJson, downloadJsonBackup, importJsonBackup, printDocument } from '@/lib/export-json';
import { downloadHtmlBackup } from '@/lib/export-html';
import { exportProjectToDocx } from '@/lib/export-docx';
import { exportProjectToEpub, exportProjectToMarkdown, exportProjectToText } from '@/lib/export-creative';
import { toast } from 'sonner';
import {
  computeImposition,
  formaDuplexFor,
  formaSheetSizeMm,
  FORMA_SIZES,
  type FormaSize,
} from '@/lib/imposition';
import { getPageDimensionsMm, mmToPx } from '@/lib/paper';
import { toEnglishDigits } from '@/lib/bangla';
import { tFmt, tplNodes, useFmtNum, useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { buildFormaSheets, formaSelfCheck, printForma, waitForDialogsClosed, type FormaPrintOptions } from '@/components/export/forma-print';

type PrintMode = 'normal' | 'forma';
type SideOrder = 'interleaved' | 'fronts-first';
/** মুদ্রণ পরিসর — সম্পূর্ণ বই / নির্দিষ্ট পরিসর / শুধু সক্রিয় পাতা */
type PrintRangeMode = 'all' | 'custom' | 'current';

// সংখ্যা এখন UI-ভাষা অনুযায়ী রেন্ডার হয় — useFmtNum() (আগের হার্ডকোডেড বাংলা bn() সহায়কের বদলে)

export function ExportTab() {
  const tt = useT();
  const ff = useFmtNum();
  const title = useEditorStore((s) => s.title);
  const pageCount = useEditorStore((s) => s.pages.length);
  const settings = useEditorStore((s) => s.settings);
  // সক্রিয় পাতার সূচি (0-ভিত্তিক) — “শুধু এই পাতা” পরিসরের জন্য; প্রিমিটিভ সিলেক্টর,
  // কেবল পাতা-পরিবর্তনে রি-রেন্ডার (প্রতি কীস্ট্রোকে নয়)
  const activePageIndex = useEditorStore((s) => s.pages.findIndex((p) => p.id === s.activePageId));
  const importRef = useRef<HTMLInputElement>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [mode, setMode] = useState<PrintMode>('normal');
  const [rangeMode, setRangeMode] = useState<PrintRangeMode>('all');
  const [rangeFrom, setRangeFrom] = useState('1');
  const [rangeTo, setRangeTo] = useState('1');
  const [formaSize, setFormaSize] = useState<FormaSize>(16);
  const [sideOrder, setSideOrder] = useState<SideOrder>('interleaved');
  const [foldMarks, setFoldMarks] = useState(true);
  const [includeCover, setIncludeCover] = useState(true);
  const [pressSlip, setPressSlip] = useState(true);
  const [swapGrid, setSwapGrid] = useState(false);
  const [previewTick, setPreviewTick] = useState(0);
  const [previewBuilding, setPreviewBuilding] = useState(false);
  const previewHostRef = useRef<HTMLDivElement>(null);
  void title;

  const doDocx = async () => {
    const s = useEditorStore.getState();
    toast.loading(tt('exp.toast.docx.building'), { id: 'docx' });
    try {
      await exportProjectToDocx({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success(tt('exp.toast.docx.done'), { id: 'docx' });
    } catch {
      toast.error(tt('exp.toast.docx.fail'), { id: 'docx' });
    }
  };

  // ── ক্রিয়েটিভ এক্সপোর্ট (EPUB/Markdown/TXT) ──
  const doEpub = async () => {
    const s = useEditorStore.getState();
    toast.loading(tt('exp.toast.epub.building'), { id: 'epub' });
    try {
      await exportProjectToEpub({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success(tt('exp.toast.epub.done'), { id: 'epub' });
    } catch {
      toast.error(tt('exp.toast.epub.fail'), { id: 'epub' });
    }
  };

  const doMarkdown = () => {
    const s = useEditorStore.getState();
    try {
      exportProjectToMarkdown({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success(tt('exp.toast.md.done'));
    } catch {
      toast.error(tt('exp.toast.md.fail'));
    }
  };

  const doText = () => {
    const s = useEditorStore.getState();
    try {
      exportProjectToText({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success(tt('exp.toast.txt.done'));
    } catch {
      toast.error(tt('exp.toast.txt.fail'));
    }
  };

  // কভার বাদ দিলে ফরমার পৃষ্ঠা-সংখ্যা
  const effectiveCount = Math.max(0, pageCount - (includeCover ? 0 : 1));

  // ফরমা হিসাব — প্রিভিউ ও তথ্যের জন্য (প্রিন্টের সাথে হুবহু একই duplex-অক্ষ)
  const formaInfo = useMemo(() => {
    const { widthMm, heightMm } = getPageDimensionsMm(
      settings.paperSize,
      settings.orientation,
      settings.customPaper,
    );
    const duplex = formaDuplexFor(widthMm, heightMm, formaSize, swapGrid);
    const imposition = computeImposition(Math.max(1, effectiveCount), formaSize, duplex, swapGrid);
    const sheet = formaSheetSizeMm(widthMm, heightMm, formaSize, swapGrid);
    return { imposition, sheet, duplex };
  }, [effectiveCount, formaSize, swapGrid, settings.paperSize, settings.orientation, settings.customPaper.widthMm, settings.customPaper.heightMm]);

  // ফরমা সেলফ-চেক — ডায়ালগেই সবুজ/লাল ব্যাজ (ছাপার আগে বাধ্যতামূলক যাচাই)
  const selfCheck = useMemo(
    () => formaSelfCheck(formaSize, swapGrid, Math.max(1, effectiveCount)),
    [formaSize, swapGrid, effectiveCount],
  );
  const formaPrintable = pageCount > 0 && effectiveCount >= 1 && selfCheck.ok;

  // বাঁধাই-মার্জিন প্রি-ফ্লাইট — আসল বইয়ে ভাঁজ/বাঁধাইয়ের ভেতরে লেখা ঢুকে যাওয়া রোধে
  // (ছাপাখানার নিয়ম: ভেতরের মার্জিন ≥ ১৬ মিমি নিরাপদ)
  const binding = useMemo(() => {
    const m = settings.margins;
    const oddEven = settings.pageNumber.oddEven;
    const bindIn = oddEven ? Math.min(m.left + m.gutter, m.right + m.gutter) : m.left + m.gutter;
    const bindMm = Math.round(bindIn * 25.4);
    return { bindMm, tight: bindMm < 16 };
  }, [settings.margins, settings.pageNumber.oddEven]);

  // ── লাইভ ফরমা প্রিভিউ — প্রথম শীটের দুই পাশ আসল পৃষ্ঠা-ক্লোন দিয়ে ──
  useEffect(() => {
    if (!printOpen || mode !== 'forma' || pageCount === 0) return;

    let cancelled = false;
    let timer = 0;
    setPreviewBuilding(true);

    // Radix ডায়ালগ কনটেন্ট পোর্টালে mount হতে এক-দুই পাস দেরি করতে পারে —
    // হোস্ট না পাওয়া পর্যন্ত সীমিত রিট্রাই (নইলে দ্বিতীয়বার খুললে প্রিভিউ ফাঁকা থাকত)
    let retries = 0;
    const tryBuild = () => {
      if (cancelled) return;
      const host = previewHostRef.current;
      if (!host) {
        if (retries++ < 15) timer = window.setTimeout(tryBuild, 100);
        else setPreviewBuilding(false);
        return;
      }
      host.textContent = '';
      try {
        const opts: FormaPrintOptions = { formaSize, sideOrder, foldMarks, includeCover, pressSlip, swapGrid };
        const built = buildFormaSheets(opts, 1);
        const root = built.root;
        root.removeAttribute('id'); // প্রিন্ট-রুটের id নয় — প্রিভিউ হোস্টেই দেখাই
        root.classList.add('forma-preview-root');
        const scale = Math.min(1, 460 / mmToPx(built.sheet.widthMm));
        root.style.width = `${mmToPx(built.sheet.widthMm)}px`;
        root.style.height = `${mmToPx(built.sheet.heightMm)}px`;
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = 'top left';
        const frame = document.createElement('div');
        frame.style.width = `${mmToPx(built.sheet.widthMm) * scale}px`;
        frame.style.height = `${mmToPx(built.sheet.heightMm) * scale}px`;
        frame.appendChild(root);
        host.appendChild(frame);
      } catch {
        /* প্রিভিউ ব্যর্থ হলে স্কিমাটিক প্রিভিউই থাকবে */
      } finally {
        if (!cancelled) setPreviewBuilding(false);
      }
    };
    timer = window.setTimeout(tryBuild, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      const host = previewHostRef.current;
      if (host) host.textContent = '';
    };
  }, [printOpen, mode, pageCount, formaSize, sideOrder, foldMarks, includeCover, pressSlip, swapGrid, previewTick]);

  // ডায়ালগ সম্পূর্ণ বন্ধ (exit-animation সহ) হওয়ার পরেই প্রিন্ট —
  // নইলে fixed-position ডায়ালগ প্রতিটি প্রিন্টেড পেজে রিপিট হতো
  const runNormalPrint = () => {
    // মুদ্রণ পরিসর যাচাই — বাংলা/ইংরেজি ডিজিট দুটোই চলে (toEnglishDigits),
    // ভুল হলে টোস্ট + বাতিল (নীরবে পুরো বই ছাপার দুর্ঘটনা নয়)
    let range: { from: number; to: number } | undefined;
    if (rangeMode === 'current') {
      if (activePageIndex < 0) {
        toast.error(tt('exp.toast.nopage'));
        return;
      }
      range = { from: activePageIndex + 1, to: activePageIndex + 1 };
    } else if (rangeMode === 'custom') {
      const from = Number(toEnglishDigits(rangeFrom.trim()));
      const to = Number(toEnglishDigits(rangeTo.trim()));
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1 || from > to) {
        toast.error(tt('exp.toast.badrange'));
        return;
      }
      if (from > pageCount) {
        toast.error(tFmt('exp.toast.rangeover', { total: ff(pageCount), from: ff(from) }));
        return;
      }
      range = { from, to: Math.min(to, pageCount) };
    }
    setPrintOpen(false);
    window.setTimeout(() => {
      void waitForDialogsClosed().then(() => printDocument(range));
    }, 40);
  };

  const runFormaPrint = () => {
    if (!formaPrintable) {
      toast.error(tFmt('exp.toast.formafail', { p: selfCheck.problems[0] ?? tt('exp.check.unknown') }));
      return;
    }
    setPrintOpen(false);
    window.setTimeout(() => {
      void waitForDialogsClosed().then(() =>
        printForma({ formaSize, sideOrder, foldMarks, includeCover, pressSlip, swapGrid }),
      );
    }, 40);
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label={tt('exp.group.press')} accent="press-ready output">
        <div className="flex flex-col items-center justify-center gap-1 px-2">
          <Button className="gap-2" onClick={() => setPrintOpen(true)}>
            <Printer size={16} /> {tt('exp.print.btn')}
          </Button>
          <p className="max-w-56 text-center text-[10px] leading-tight text-muted-foreground">
            {tt('exp.print.hint')}
          </p>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('exp.group.file')} accent="export file">
        <div className="flex gap-1">
          <RibbonButton icon={FileText} label={tt('exp.file.word')} onClick={doDocx} />
          <RibbonButton
            icon={FileCode2}
            label="HTML"
            title={tt('exp.file.html.tip')}
            onClick={() => {
              const s = useEditorStore.getState();
              downloadHtmlBackup(s.title, s.settings, s.pages);
              toast.success(tt('exp.toast.html.done'));
            }}
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('exp.group.creative')} accent="creative formats">
        <div className="flex gap-1">
          <RibbonButton
            icon={BookText}
            label={tt('exp.file.epub')}
            title={tt('exp.file.epub.tip')}
            onClick={() => void doEpub()}
          />
          <RibbonButton
            icon={FileType2}
            label={tt('exp.file.md')}
            title={tt('exp.file.md.tip')}
            onClick={doMarkdown}
          />
          <RibbonButton
            icon={FileText}
            label={tt('exp.file.txt')}
            title={tt('exp.file.txt.tip')}
            onClick={doText}
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('exp.group.backup')} accent="backup">
        <div className="flex gap-1">
          <RibbonButton
            icon={FileDown}
            label={tt('exp.backup.btn')}
            title={tt('exp.backup.tip')}
            onClick={async () => {
              const project = await currentProjectJson();
              if (!project) return;
              downloadJsonBackup(project);
              toast.success(tt('exp.toast.backup.done'));
            }}
          />
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = '';
              if (!file) return;
              const result = await importJsonBackup(file);
              if (result === 'ok') toast.success(tt('exp.toast.restore.ok'));
              else toast.error(tt('exp.toast.restore.bad'));
            }}
          />
          <RibbonButton icon={Upload} label={tt('exp.backup.open')} onClick={() => importRef.current?.click()} />
        </div>
      </RibbonGroup>

      {/* ═══ প্রিন্ট মোড ডায়ালগ ═══ */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{tt('exp.dlg.title')}</DialogTitle>
            <DialogDescription>
              {tt('exp.dlg.desc')}
            </DialogDescription>
          </DialogHeader>

          <RadioGroup value={mode} onValueChange={(v) => setMode(v as PrintMode)} className="gap-2">
            {/* সাধারণ */}
            <Label
              htmlFor="mode-normal"
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                mode === 'normal' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="normal" id="mode-normal" className="mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">{tt('exp.mode.normal')}</p>
                <p className="text-xs text-muted-foreground">
                  {tt('exp.mode.normal.desc')}
                </p>
              </div>
            </Label>

            {/* ফরমা */}
            <Label
              htmlFor="mode-forma"
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                mode === 'forma' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="forma" id="mode-forma" className="mt-0.5" />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold leading-none">{tt('exp.mode.forma')}</p>
                <p className="text-xs text-muted-foreground">
                  {tt('exp.mode.forma.desc')}
                </p>
              </div>
            </Label>
          </RadioGroup>

          {/* ═══ মুদ্রণ পরিসর — শুধু সাধারণ PDF-এ প্রযোজ্য; ফরমা পুরো বই নেয় ═══ */}
          <div
            className={cn(
              'space-y-2.5 rounded-lg border bg-muted/30 p-3',
              mode === 'forma' && 'pointer-events-none select-none opacity-55',
            )}
            aria-disabled={mode === 'forma'}
          >
            <div className="flex items-center justify-between gap-2">
              <Label className="text-xs font-medium text-muted-foreground">{tt('exp.range.label')}</Label>
              {mode === 'forma' && (
                <span className="text-[10px] text-muted-foreground">{tt('exp.range.formanote')}</span>
              )}
            </div>
            <RadioGroup
              value={rangeMode}
              onValueChange={(v) => setRangeMode(v as PrintRangeMode)}
              className="gap-1.5"
              disabled={mode === 'forma'}
            >
              <Label
                htmlFor="range-all"
                className={`flex min-h-9 cursor-pointer items-center gap-3 rounded-md border p-2 text-sm transition ${
                  rangeMode === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="all" id="range-all" />
                <span>{tt('exp.range.all')}</span>
              </Label>
              <Label
                htmlFor="range-custom"
                className={`flex min-h-9 cursor-pointer items-center gap-3 rounded-md border p-2 text-sm transition ${
                  rangeMode === 'custom' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="custom" id="range-custom" />
                <span>{tt('exp.range.custom')}</span>
              </Label>
              {rangeMode === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pb-1 pl-7">
                  <div className="space-y-1">
                    <Label htmlFor="range-from" className="text-[10px] text-muted-foreground">
                      {tt('exp.range.from')}
                    </Label>
                    <Input
                      id="range-from"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-9"
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(e.target.value)}
                      placeholder={ff(1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="range-to" className="text-[10px] text-muted-foreground">
                      {tt('exp.range.to')}
                    </Label>
                    <Input
                      id="range-to"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-9"
                      value={rangeTo}
                      onChange={(e) => setRangeTo(e.target.value)}
                      placeholder={ff(pageCount)}
                    />
                  </div>
                </div>
              )}
              <Label
                htmlFor="range-current"
                className={`flex min-h-9 cursor-pointer items-center gap-3 rounded-md border p-2 text-sm transition ${
                  rangeMode === 'current' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="current" id="range-current" />
                <span>
                  {tt('exp.range.current')}
                  {activePageIndex >= 0 ? ` ${tFmt('exp.range.current.n', { n: ff(activePageIndex + 1) })}` : ''}
                </span>
              </Label>
            </RadioGroup>
            <p className="text-[10px] leading-tight text-muted-foreground">
              {tt('exp.range.note')}
            </p>
          </div>

          {mode === 'forma' && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{tt('exp.forma.size')}</Label>
                  <Select
                    value={String(formaSize)}
                    onValueChange={(v) => setFormaSize(Number(v) as FormaSize)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMA_SIZES.map((s) => (
                        <SelectItem key={s} value={String(s)}>
                          {tFmt('exp.forma.pagespersheet', { n: ff(s) })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">{tt('exp.forma.sideorder')}</Label>
                  <Select value={sideOrder} onValueChange={(v) => setSideOrder(v as SideOrder)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interleaved">{tt('exp.forma.side.interleaved')}</SelectItem>
                      <SelectItem value="fronts-first">{tt('exp.forma.side.frontsfirst')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 rounded-md border bg-background/60 p-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-cover" className="text-xs text-muted-foreground">
                    {tt('exp.forma.includecover')}
                  </Label>
                  <Switch id="include-cover" checked={includeCover} onCheckedChange={setIncludeCover} />
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {tt('exp.forma.includecover.note')}
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="press-slip" className="text-xs text-muted-foreground">
                    {tt('exp.forma.pressslip')}
                  </Label>
                  <Switch id="press-slip" checked={pressSlip} onCheckedChange={setPressSlip} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="fold-marks" className="text-xs text-muted-foreground">
                    {tt('exp.forma.foldmarks')}
                  </Label>
                  <Switch id="fold-marks" checked={foldMarks} onCheckedChange={setFoldMarks} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid-swap" className="text-xs text-muted-foreground">
                    {tFmt('exp.forma.gridswap', { a: ff(formaInfo.imposition.grid.rows), b: ff(formaInfo.imposition.grid.cols) })}
                  </Label>
                  <Switch id="grid-swap" checked={swapGrid} onCheckedChange={setSwapGrid} />
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {tt('exp.forma.gridswap.note')}
                </p>
                {binding.tight && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300/70 bg-amber-50/80 px-2.5 py-2 text-[10px] leading-snug text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <TriangleAlert size={13} className="mt-px shrink-0" />
                    <span>
                      <b>{tt('exp.forma.bindingwarn.head')}</b>{' '}
                      {tFmt('exp.forma.bindingwarn.body', { n: ff(binding.bindMm), a: ff(19), b: ff(25) })}
                    </span>
                  </div>
                )}
              </div>

              {/* ফরমা সেলফ-চেক ব্যাজ */}
              {selfCheck.ok ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-300/70 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <BadgeCheck size={15} className="shrink-0" />
                  {tt('exp.check.ok')}
                </div>
              ) : (
                <div className="rounded-md border border-red-300/70 bg-red-50/80 px-3 py-2 text-xs font-medium text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                  {tt('exp.check.fail')}
                  <ul className="mt-1 list-disc pl-4 font-normal">
                    {selfCheck.problems.slice(0, 3).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* তথ্য ব্যাজ — যাচাই পাস করলে প্রথমেই গোল্ড প্রেস-রেডি সিল */}
              <div className="flex flex-wrap gap-1.5">
                {selfCheck.ok && (
                  <span className="pro-badge pro-badge-lg gap-1" title={tt('exp.seal.tip')}>
                    <BadgeCheck size={11} aria-hidden="true" />
                    {tt('exp.seal.pressready')}
                  </span>
                )}
                <Badge variant="secondary">{tFmt('exp.badge.pages', { n: ff(pageCount) })}</Badge>
                <Badge variant="secondary">{tFmt('exp.badge.sheets', { n: ff(formaInfo.imposition.sheets.length) })}</Badge>
                {formaInfo.imposition.blankPagesAdded > 0 && (
                  <Badge variant="outline">
                    {tFmt('exp.badge.blanks', { n: ff(formaInfo.imposition.blankPagesAdded) })}
                  </Badge>
                )}
                <Badge variant="outline">
                  {tFmt('exp.badge.sheetmm', { a: ff(Math.round(formaInfo.sheet.widthMm)), b: ff(Math.round(formaInfo.sheet.heightMm)) })}
                </Badge>
                <Badge variant="outline">{tt('exp.badge.duplex')}</Badge>
                {!includeCover && pageCount > 0 && (
                  <Badge variant="outline">{tFmt('exp.badge.nocover', { n: ff(effectiveCount) })}</Badge>
                )}
              </div>

              {/* লাইভ প্রিভিউ — আসল পৃষ্ঠা দিয়ে গড়া প্রথম প্রেস-শীট */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    {tt('exp.preview.live')}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-[11px]"
                    onClick={() => setPreviewTick((t) => t + 1)}
                    disabled={previewBuilding}
                  >
                    {previewBuilding ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    {tt('exp.preview.refresh')}
                  </Button>
                </div>
                <div
                  ref={previewHostRef}
                  className="forma-preview-host flex justify-center overflow-hidden rounded border bg-white p-1"
                  aria-label={tt('exp.preview.aria')}
                />
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {tt('exp.preview.note')}
                </p>
              </div>

              {/* স্কিমাটিক প্রিভিউ — প্রথম ২টি শীটের পৃষ্ঠা-বিন্যাস */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {tt('exp.schem.title')}
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {formaInfo.imposition.sheets.slice(0, 2).map((sh, i) => (
                    <div key={i} className="space-y-1">
                      {([sh.front, sh.back] as const).map((panels, side) => (
                        <div key={side} className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">
                            {tFmt('exp.schem.sheet', { n: ff(i + 1), s: side === 0 ? 'A' : 'B' })}
                            {panels.some((p) => p.pageNumber === 1) ? (
                              <span className="ml-1 rounded bg-amber-500/15 px-1 py-px text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                                {tt('exp.schem.coverhere')}
                              </span>
                            ) : null}
                          </p>
                          <div
                            className="grid gap-0.5 rounded border bg-white p-0.5"
                            style={{
                              gridTemplateColumns: `repeat(${formaInfo.imposition.grid.cols}, 1fr)`,
                              width: formaInfo.imposition.grid.cols > 2 ? 150 : 90,
                            }}
                          >
                            {panels.map((p, idx) => (
                              <div
                                key={idx}
                                className="flex aspect-[3/4] items-center justify-center rounded-sm border border-dashed text-[10px] leading-none"
                                style={{ transform: p.rotate180 ? 'rotate(180deg)' : undefined }}
                              >
                                {p.pageNumber > 0 ? (
                                  <span>
                                    {ff(p.pageNumber)}
                                    {p.rotate180 ? '↻' : ''}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/40">{tt('exp.schem.blank')}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {formaInfo.imposition.sheets.length > 2 && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      {tFmt('exp.schem.more', { n: ff(formaInfo.imposition.sheets.length - 2) })}
                    </div>
                  )}
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  {tt('exp.schem.foldnote')}
                </p>
              </div>

              {/* বাংলাদেশের ছাপাখানা গাইড — ধাপে ধাপে */}
              <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="mb-1.5 font-bold">{tt('exp.guide.title')}</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>
                    <b>{tt('exp.guide.s1.head')}</b>{' '}
                    {tplNodes(tt('exp.guide.s1.body'), { a: <b>All</b> })}
                  </li>
                  <li>
                    <b>{tt('exp.guide.s2.head')}</b> {tt('exp.guide.s2.body')}
                  </li>
                  <li>
                    <b>{tt('exp.guide.s3.head')}</b>{' '}
                    {tplNodes(tt('exp.guide.s3.body'), { a: <b>Flip on Long Edge</b> })}
                  </li>
                  <li>
                    <b>{tt('exp.guide.s4.head')}</b> {tt('exp.guide.s4.body')}
                  </li>
                  <li>
                    <b>{tt('exp.guide.s5.head')}</b>{' '}
                    {tFmt('exp.guide.s5.body', { a: ff(Math.round(formaInfo.sheet.widthMm)), b: ff(Math.round(formaInfo.sheet.heightMm)) })}
                  </li>
                  <li>
                    <b>{tt('exp.guide.s6.head')}</b> {tt('exp.guide.s6.body')}
                  </li>
                  <li>
                    <b>{tt('exp.guide.s7.head')}</b> {tt('exp.guide.s7.body')}
                  </li>
                  <li>
                    <b>{tt('exp.guide.s8.head')}</b>{' '}
                    {tFmt('exp.guide.s8.body', { a: ff(1), b: ff(4), c: ff(1), d: ff(4), e: ff(5) })}
                  </li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPrintOpen(false)}>
              {tt('hdr.cancel')}
            </Button>
            {mode === 'normal' ? (
              <Button onClick={runNormalPrint}>
                <Printer size={15} className="mr-1" /> {tt('exp.dlg.print')}
              </Button>
            ) : (
              <Button onClick={runFormaPrint} disabled={!formaPrintable}>
                <Printer size={15} className="mr-1" /> {tt('exp.dlg.printforma')}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
