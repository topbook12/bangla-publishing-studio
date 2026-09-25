/**
 * Export tab — print/PDF portal (Normal vs Forma), DOCX, HTML, JSON backup
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import { BookText, FileCode2, FileDown, FileText, FileType2, Printer, Upload } from 'lucide-react';
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
import { getPageDimensionsMm } from '@/lib/paper';
import { printForma, waitForDialogsClosed } from '@/components/export/forma-print';

type PrintMode = 'normal' | 'forma';
type SideOrder = 'interleaved' | 'fronts-first';

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const bn = (n: number | string) => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

export function ExportTab() {
  const title = useEditorStore((s) => s.title);
  const pageCount = useEditorStore((s) => s.pages.length);
  const settings = useEditorStore((s) => s.settings);
  const importRef = useRef<HTMLInputElement>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [mode, setMode] = useState<PrintMode>('normal');
  const [formaSize, setFormaSize] = useState<FormaSize>(16);
  const [sideOrder, setSideOrder] = useState<SideOrder>('interleaved');
  const [foldMarks, setFoldMarks] = useState(true);
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

  // ফরমা হিসাব — প্রিভিউ ও তথ্যের জন্য (প্রিন্টের সাথে হুবহু একই duplex-অক্ষ)
  const formaInfo = useMemo(() => {
    const { widthMm, heightMm } = getPageDimensionsMm(
      settings.paperSize,
      settings.orientation,
      settings.customPaper,
    );
    const duplex = formaDuplexFor(widthMm, heightMm, formaSize);
    const imposition = computeImposition(pageCount, formaSize, duplex);
    const sheet = formaSheetSizeMm(widthMm, heightMm, formaSize);
    return { imposition, sheet };
  }, [pageCount, formaSize, settings.paperSize, settings.orientation, settings.customPaper]);

  // ডায়ালগ সম্পূর্ণ বন্ধ (exit-animation সহ) হওয়ার পরেই প্রিন্ট —
  // নইলে fixed-position ডায়ালগ প্রতিটি প্রিন্টেড পেজে রিপিট হতো
  const runNormalPrint = () => {
    setPrintOpen(false);
    window.setTimeout(() => {
      void waitForDialogsClosed().then(() => printDocument());
    }, 40);
  };

  const runFormaPrint = () => {
    setPrintOpen(false);
    window.setTimeout(() => {
      void waitForDialogsClosed().then(() => printForma({ formaSize, sideOrder, foldMarks }));
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
            onClick={() => {
              const project = currentProjectJson();
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
                  প্রতি শীটে একটি পৃষ্ঠা, সঠিক কাগজের সাইজে — প্রিন্টার বা ডিজিটাল কপির জন্য।
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

              <div className="flex items-center justify-between">
                <Label htmlFor="fold-marks" className="text-xs text-muted-foreground">
                  ভাঁজ/কাট মার্ক দেখান
                </Label>
                <Switch id="fold-marks" checked={foldMarks} onCheckedChange={setFoldMarks} />
              </div>

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
              </div>

              {/* প্রিভিউ — প্রথম ২টি শীট */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  প্রিভিউ — পৃষ্ঠা বিন্যাস (↻ = ১৮০° ঘুরিয়ে ছাপা হবে):
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
                    এই মাপের কাগজ না মিললে ছোট ফরমা (৪ বা ৮ পৃষ্ঠা) বেছে নিন। ছাপাখানায়
                    A3/ডেমি/ক্রাউন শীটে এক-একটি ফরমা ছাপা হয়।
                  </li>
                  <li>
                    <b>ভাঁজ ও কাটা:</b> ছাপানোর পর ভাঁজ-রেখার দাগ ধরে ভাঁজ করুন, তারপর
                    খাড়া কাটা দিন — পৃষ্ঠা ১, ২, ৩… স্বয়ংক্রিয়ভাবে সঠিক ক্রমে পড়বে।
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
              <Button onClick={runFormaPrint}>
                <Printer size={15} className="mr-1" /> ফরমা প্রিন্ট করুন
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
