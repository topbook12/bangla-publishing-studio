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
import { cn } from '@/lib/utils';
import { buildFormaSheets, formaSelfCheck, printForma, waitForDialogsClosed, type FormaPrintOptions } from '@/components/export/forma-print';

type PrintMode = 'normal' | 'forma';
type SideOrder = 'interleaved' | 'fronts-first';
/** মুদ্রণ পরিসর — সম্পূর্ণ বই / নির্দিষ্ট পরিসর / শুধু সক্রিয় পাতা */
type PrintRangeMode = 'all' | 'custom' | 'current';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const bn = (n: number | string) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export function ExportTab() {
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
    toast.loading('Building Word file…', { id: 'docx' });
    try {
      await exportProjectToDocx({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success('DOCX downloaded', { id: 'docx' });
    } catch {
      toast.error('Failed to generate DOCX', { id: 'docx' });
    }
  };

  // ── ক্রিয়েটিভ এক্সপোর্ট (EPUB/Markdown/TXT) ──
  const doEpub = async () => {
    const s = useEditorStore.getState();
    toast.loading('Building EPUB…', { id: 'epub' });
    try {
      await exportProjectToEpub({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success('EPUB downloaded — যেকোনো ই-বুক রিডারে খুলুন', { id: 'epub' });
    } catch {
      toast.error('Failed to generate EPUB', { id: 'epub' });
    }
  };

  const doMarkdown = () => {
    const s = useEditorStore.getState();
    try {
      exportProjectToMarkdown({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success('Markdown downloaded');
    } catch {
      toast.error('Failed to generate Markdown');
    }
  };

  const doText = () => {
    const s = useEditorStore.getState();
    try {
      exportProjectToText({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success('Text file downloaded');
    } catch {
      toast.error('Failed to generate text file');
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
        toast.error('কোনো পাতা সক্রিয় নেই — আগে একটি পাতায় ক্লিক করুন।');
        return;
      }
      range = { from: activePageIndex + 1, to: activePageIndex + 1 };
    } else if (rangeMode === 'custom') {
      const from = Number(toEnglishDigits(rangeFrom.trim()));
      const to = Number(toEnglishDigits(rangeTo.trim()));
      if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < 1 || from > to) {
        toast.error('পরিসর ঠিক নেই — শুরু ও শেষ পৃষ্ঠা সঠিকভাবে লিখুন (শুরু ≤ শেষ)।');
        return;
      }
      if (from > pageCount) {
        toast.error(`এই বইয়ে মোট ${bn(pageCount)}টি পৃষ্ঠা — শুরু ${bn(from)} এর বাইরে।`);
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
      toast.error(`ফরমা যাচাইয়ে সমস্যা — ছাপা আটকানো হয়েছে: ${selfCheck.problems[0] ?? 'অজানা'}`);
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
      <RibbonGroup label="Press-Ready Output">
        <div className="flex flex-col items-center justify-center gap-1 px-2">
          <Button className="gap-2" onClick={() => setPrintOpen(true)}>
            <Printer size={16} /> Print / Save as PDF
          </Button>
          <p className="max-w-56 text-center text-[10px] leading-tight text-muted-foreground">
            Normal or Forma (press imposition) — fonts &amp; margins stay 100% accurate
          </p>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Export File">
        <div className="flex gap-1">
          <RibbonButton icon={FileText} label="Word (.docx)" onClick={doDocx} />
          <RibbonButton
            icon={FileCode2}
            label="HTML"
            title="Self-contained HTML file (readable offline)"
            onClick={() => {
              const s = useEditorStore.getState();
              downloadHtmlBackup(s.title, s.settings, s.pages);
              toast.success('HTML downloaded');
            }}
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Creative Formats">
        <div className="flex gap-1">
          <RibbonButton
            icon={BookText}
            label="EPUB (e-book)"
            title="ই-বুক রিডার/মোবাইলে পড়ার জন্য — ছবিসহ এমবেড হয়"
            onClick={() => void doEpub()}
          />
          <RibbonButton
            icon={FileType2}
            label="Markdown (.md)"
            title="ব্লগ/নোট অ্যাপে ব্যবহারের জন্য"
            onClick={doMarkdown}
          />
          <RibbonButton
            icon={FileText}
            label="Plain Text (.txt)"
            title="ট্যাগমুক্ত লেখা — যেকোনো জায়গায়"
            onClick={doText}
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Backup">
        <div className="flex gap-1">
          <RibbonButton
            icon={FileDown}
            label="Backup (JSON)"
            title="Save the entire project as a file"
            onClick={async () => {
              const project = await currentProjectJson();
              if (!project) return;
              downloadJsonBackup(project);
              toast.success('Backup downloaded');
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
              if (result === 'ok') toast.success('Project restored from backup');
              else toast.error('Not a valid backup file');
            }}
          />
          <RibbonButton icon={Upload} label="Open Backup" onClick={() => importRef.current?.click()} />
        </div>
      </RibbonGroup>

      {/* ═══ প্রিন্ট মোড ডায়ালগ ═══ */}
      <Dialog open={printOpen} onOpenChange={setPrintOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>প্রিন্ট মোড নির্বাচন</DialogTitle>
            <DialogDescription>
              বইটি কীভাবে ছাপানো হবে তা অনুযায়ী মোড বেছে নিন — প্রিন্ট ডায়ালগে
              &ldquo;Save as PDF&rdquo; বেছে নিলে ফন্ট ও মার্জিন হুবহু থাকবে।
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
                <p className="text-sm font-semibold leading-none">সাধারণ PDF</p>
                <p className="text-xs text-muted-foreground">
                  প্রতি শীটে একটি পৃষ্ঠা, সঠিক কাগজের সাইজে — প্রিন্টার, ডিজিটাল কপি বা কভার ছাপার জন্য।
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
                <p className="text-sm font-semibold leading-none">ফরমা PDF (ছাপাখানা)</p>
                <p className="text-xs text-muted-foreground">
                  এক বড় শীটে একাধিক পৃষ্ঠা ভাঁজ-সঠিক ক্রমে — ফরমা অনুযায়ী বই ছাপার জন্য।
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
              <Label className="text-xs font-medium text-muted-foreground">মুদ্রণ পরিসর</Label>
              {mode === 'forma' && (
                <span className="text-[10px] text-muted-foreground">ফরমা সবসময় পুরো বইয়ের উপর গণনা হয়</span>
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
                <span>সম্পূর্ণ বই</span>
              </Label>
              <Label
                htmlFor="range-custom"
                className={`flex min-h-9 cursor-pointer items-center gap-3 rounded-md border p-2 text-sm transition ${
                  rangeMode === 'custom' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="custom" id="range-custom" />
                <span>নির্দিষ্ট পরিসর</span>
              </Label>
              {rangeMode === 'custom' && (
                <div className="grid grid-cols-2 gap-2 pb-1 pl-7">
                  <div className="space-y-1">
                    <Label htmlFor="range-from" className="text-[10px] text-muted-foreground">
                      শুরু (পৃষ্ঠা)
                    </Label>
                    <Input
                      id="range-from"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-9"
                      value={rangeFrom}
                      onChange={(e) => setRangeFrom(e.target.value)}
                      placeholder={bn(1)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="range-to" className="text-[10px] text-muted-foreground">
                      শেষ (পৃষ্ঠা)
                    </Label>
                    <Input
                      id="range-to"
                      inputMode="numeric"
                      autoComplete="off"
                      className="h-9"
                      value={rangeTo}
                      onChange={(e) => setRangeTo(e.target.value)}
                      placeholder={bn(pageCount)}
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
                  শুধু এই পাতা{activePageIndex >= 0 ? ` (পৃষ্ঠা ${bn(activePageIndex + 1)})` : ''}
                </span>
              </Label>
            </RadioGroup>
            <p className="text-[10px] leading-tight text-muted-foreground">
              বাইরের পাতাগুলো প্রিন্টে স্বয়ংক্রিয়ভাবে বাদ যাবে — ব্রাউজারের প্রিন্ট ডায়ালগে
              পেজ-রেঞ্জ &ldquo;All&rdquo;-ই রাখুন। বাংলা বা ইংরেজি সংখ্যা দুটোই লেখা যায়।
            </p>
          </div>

          {mode === 'forma' && (
            <div className="space-y-3 rounded-lg border bg-muted/30 p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">ফরমা সাইজ</Label>
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
                          {bn(s)} পৃষ্ঠা / ফরমা
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">সাইড বিন্যাস</Label>
                  <Select value={sideOrder} onValueChange={(v) => setSideOrder(v as SideOrder)}>
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interleaved">পাশাপাশি (A, B, A, B…)</SelectItem>
                      <SelectItem value="fronts-first">আগে সব সামনে, পরে সব পেছনে</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2 rounded-md border bg-background/60 p-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="include-cover" className="text-xs text-muted-foreground">
                    কভার ফরমায় রাখুন
                  </Label>
                  <Switch id="include-cover" checked={includeCover} onCheckedChange={setIncludeCover} />
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  বাঁদিকে রাখলে কভার ফরমার প্রথম পৃষ্ঠা হিসেবে ছাপাবে। আসল বইয়ের মতো কভার
                  আলাদা মোটা কাগজে ছাপাতে চাইলে বন্ধ করুন — তখন কভার &ldquo;সাধারণ
                  PDF&rdquo; দিয়ে আলাদা ছাপাবেন, ভেতরের ব্লক ফরমায় ছাপা হবে।
                </p>
                <div className="flex items-center justify-between">
                  <Label htmlFor="press-slip" className="text-xs text-muted-foreground">
                    প্রেস-স্লিপ (শীট নম্বর/পাশ)
                  </Label>
                  <Switch id="press-slip" checked={pressSlip} onCheckedChange={setPressSlip} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="fold-marks" className="text-xs text-muted-foreground">
                    ভাঁজ/কাট মার্ক দেখান
                  </Label>
                  <Switch id="fold-marks" checked={foldMarks} onCheckedChange={setFoldMarks} />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid-swap" className="text-xs text-muted-foreground">
                    শীট গ্রিড ঘোরান ({bn(formaInfo.imposition.grid.rows)}×{bn(formaInfo.imposition.grid.cols)})
                  </Label>
                  <Switch id="grid-swap" checked={swapGrid} onCheckedChange={setSwapGrid} />
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  ছাপাখানার কাগজের গ্রেন-দিক বা স্টক-সাইজে লম্বা গ্রিড দরকার হলে এটি চালু
                  করুন — দুই অভিমুখেই ভাঁজ সঠিক থাকে (যাচাইকৃত)।
                </p>
                {binding.tight && (
                  <div className="flex items-start gap-2 rounded-md border border-amber-300/70 bg-amber-50/80 px-2.5 py-2 text-[10px] leading-snug text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
                    <TriangleAlert size={13} className="mt-px shrink-0" />
                    <span>
                      <b>বাঁধাই সতর্কতা:</b> ভেতরের (বাঁধাই) মার্জিন মাত্র {bn(binding.bindMm)} মিমি —
                      ভাঁজ/বাঁধাইয়ের সময় লেখা মেরুদণ্ডের ভেতরে ঢুকে যেতে পারে। Layout → Margins
                      থেকে Gutter বাড়িয়ে মোট {bn(19)}–{bn(25)} মিমি করুন (আসল বইয়ের নিয়ম)।
                    </span>
                  </div>
                )}
              </div>

              {/* ফরমা সেলফ-চেক ব্যাজ */}
              {selfCheck.ok ? (
                <div className="flex items-center gap-2 rounded-md border border-emerald-300/70 bg-emerald-50/80 px-3 py-2 text-xs font-medium text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <BadgeCheck size={15} className="shrink-0" />
                  ফরমা যাচাই সম্পন্ন — পৃষ্ঠা ক্রম, ঘর ও আউটার ফরমা স্ট্যান্ডার্ড মেলেছে ✓
                </div>
              ) : (
                <div className="rounded-md border border-red-300/70 bg-red-50/80 px-3 py-2 text-xs font-medium text-red-800 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300">
                  ফরমা যাচাইয়ে সমস্যা — ছাপা আটকানো হয়েছে:
                  <ul className="mt-1 list-disc pl-4 font-normal">
                    {selfCheck.problems.slice(0, 3).map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* তথ্য ব্যাজ */}
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">মোট পৃষ্ঠা: {bn(pageCount)}</Badge>
                <Badge variant="secondary">প্রেস শীট: {bn(formaInfo.imposition.sheets.length)}টি</Badge>
                {formaInfo.imposition.blankPagesAdded > 0 && (
                  <Badge variant="outline">
                    শেষ ফরমায় {bn(formaInfo.imposition.blankPagesAdded)}টি খালি পৃষ্ঠা যোগ হবে
                  </Badge>
                )}
                <Badge variant="outline">
                  শীট মাপ: {bn(Math.round(formaInfo.sheet.widthMm))}×{bn(Math.round(formaInfo.sheet.heightMm))} মিমি
                </Badge>
                <Badge variant="outline">ডুপ্লেক্স প্রিন্টে: Long-edge flip রাখুন</Badge>
                {!includeCover && pageCount > 0 && (
                  <Badge variant="outline">কভার বাদ — ফরমায় {bn(effectiveCount)}টি পৃষ্ঠা</Badge>
                )}
              </div>

              {/* লাইভ প্রিভিউ — আসল পৃষ্ঠা দিয়ে গড়া প্রথম প্রেস-শীট */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">
                    লাইভ প্রিভিউ — প্রথম প্রেস-শীট (আসল পৃষ্ঠা দিয়ে গড়া; ছাপা হবে ঠিক এটিই):
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 text-[11px]"
                    onClick={() => setPreviewTick((t) => t + 1)}
                    disabled={previewBuilding}
                  >
                    {previewBuilding ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    রিফ্রেশ
                  </Button>
                </div>
                <div
                  ref={previewHostRef}
                  className="forma-preview-host flex justify-center overflow-hidden rounded border bg-white p-1"
                  aria-label="ফরমা প্রিভিউ"
                />
                <p className="text-[10px] leading-tight text-muted-foreground">
                  সাইড বিন্যাস অনুযায়ী প্রিন্টে শীট-পর শীট (A, B, A, B…) আসবে — এই প্রিভিউতে
                  প্রথম শীটের দুই পাশ পাশাপাশি দেখানো হয়েছে।
                </p>
              </div>

              {/* স্কিমাটিক প্রিভিউ — প্রথম ২টি শীটের পৃষ্ঠা-বিন্যাস */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  পৃষ্ঠা বিন্যাস (↻ = ১৮০° ঘুরিয়ে ছাপা হবে):
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {formaInfo.imposition.sheets.slice(0, 2).map((sh, i) => (
                    <div key={i} className="space-y-1">
                      {([sh.front, sh.back] as const).map((panels, side) => (
                        <div key={side} className="space-y-0.5">
                          <p className="text-[10px] text-muted-foreground">
                            শীট {bn(i + 1)} — পাশ {side === 0 ? 'A' : 'B'}
                            {panels.some((p) => p.pageNumber === 1) ? (
                              <span className="ml-1 rounded bg-amber-500/15 px-1 py-px text-[9px] font-semibold text-amber-700 dark:text-amber-300">
                                কভার এই পাশে (বাইরের ফরমা)
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
                                    {bn(p.pageNumber)}
                                    {p.rotate180 ? '↻' : ''}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground/40">খালি</span>
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
                      +{bn(formaInfo.imposition.sheets.length - 2)}টি আরও শীট…
                    </div>
                  )}
                </div>
                <p className="text-[10px] leading-tight text-muted-foreground">
                  ভাঁজ পদ্ধতি: ডান-অর্ধেক উপরে → নিচ-অর্ধেক উপরে → পুনরাবৃত্তি (right-angle fold)।
                  শেষ অসম্পূর্ণ ফরমা খালি পৃষ্ঠা দিয়ে পূরণ হয়।
                </p>
              </div>

              {/* বাংলাদেশের ছাপাখানা গাইড — ধাপে ধাপে */}
              <div className="rounded-lg border border-amber-300/60 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                <p className="mb-1.5 font-bold">ফরমা ছাপার নিয়ম (ধাপে ধাপে):</p>
                <ol className="list-decimal space-y-1 pl-4">
                  <li>
                    <b>সব পৃষ্ঠা ছাপুন:</b> প্রিন্ট ডায়ালগে পেজ-রেঞ্জ <b>All</b> রাখতে হবে —
                    কোনো শীট বাদ গেলে সই-এ পৃষ্ঠা মিলবে না।
                  </li>
                  <li>
                    <b>সাইড বিন্যাস:</b> ডুপ্লেক্স (উভয় পাশ একসাথে ছাপার) প্রিন্টার থাকলে
                    &ldquo;পাশাপাশি&rdquo; রাখুন — প্রতিটি শীটের A ও B পাশ পরপর ছাপাবে।
                    সাধারণ (এক পাশ) প্রিন্টারে আগে সব A পাশ ছাপিয়ে কাগজ উল্টে সব B পাশ ছাপাতে
                    &ldquo;আগে সব সামনে&rdquo; বেছে নিন।
                  </li>
                  <li>
                    <b>ডুপ্লেক্স সেটিং:</b> প্রিন্ট ডায়ালগে <b>Flip on Long Edge</b>
                    অবশ্যই রাখতে হবে — Short Edge দিলে পেছনের পৃষ্ঠাগুলো ভুল ঘরে পড়ে ভাঁজ ভুল হয়।
                  </li>
                  <li>
                    <b>স্কেল ১০০% (Actual size)</b> রাখুন — &ldquo;Fit to page&rdquo; দিলে
                    মাপ বদলে ভাঁজ মেলবে না।
                  </li>
                  <li>
                    <b>কাগজের মাপ:</b> প্রেস শীট {bn(Math.round(formaInfo.sheet.widthMm))}×{bn(Math.round(formaInfo.sheet.heightMm))} মিমি —
                    এই মাপের কাগজ না মিললে ছোট ফরমা (৪ বা ৮ পৃষ্ঠা) বা গ্রিড ঘোরানো বেছে নিন। ছাপাখানায়
                    A3/ডেমি/ক্রাউন শীটে এক-একটি ফরমা ছাপা হয়।
                  </li>
                  <li>
                    <b>কভার:</b> আসল বইয়ে কভার আলাদা মোটা কাগজে (ইলাস্ট্রেশন কার্ড ২৫০–৩০০ গ্রাম)
                    ছাপানো হয় — &ldquo;কভার ফরমায় রাখুন&rdquo; বন্ধ রেখে কভারটি সাধারণ PDF দিয়ে
                    আলাদা ছাপান, ভেতরের ব্লক ফরমায় যাবে।
                  </li>
                  <li>
                    <b>ভাঁজ ও কাটা:</b> ছাপানোর পর ভাঁজ-রেখার দাগ ধরে ভাঁজ করুন (ডান-অর্ধেক
                    উপরে → নিচ-অর্ধেক উপরে → পুনরাবৃত্তি), তারপর খাড়া কাটা দিন — কোণার
                    ট্রিম-মার্ক ধরে কাটলে পৃষ্ঠা ১, ২, ৩… স্বয়ংক্রিয়ভাবে সঠিক ক্রমে পড়বে।
                  </li>
                  <li>
                    <b>প্রেসে দেওয়ার আগে:</b> প্রতিটি শীটের কোণে ছাপা প্রেস-স্লিপ (শীট ১/৪ — পাশ A)
                    দেখে ক্রম মিলিয়ে নিন; প্রথম শীটের বাইরের পাশে {bn(1)}, {bn(4)}, {bn(5)}… জাতীয়
                    পৃষ্ঠা-সেট থাকলেই বাইরের ফরমা ঠিক আছে।
                  </li>
                </ol>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPrintOpen(false)}>
              বাতিল
            </Button>
            {mode === 'normal' ? (
              <Button onClick={runNormalPrint}>
                <Printer size={15} className="mr-1" /> প্রিন্ট করুন
              </Button>
            ) : (
              <Button onClick={runFormaPrint} disabled={!formaPrintable}>
                <Printer size={15} className="mr-1" /> ফরমা প্রিন্ট করুন
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
