/**
 * প্রশ্নপত্র স্টুডিও — ৪ ধাপের উইজার্ড (Question Paper Studio wizard)
 * ──────────────────────────────────────────────────────────────────
 *  ধাপ ১ ইনপুট: হাতে-লেখা ছবি (AI পড়ে নেয়) বা টাইপ/পেস্ট — দুটোই এক
 *    কাঁচা-লেখা বক্সে মেলে।
 *  ধাপ ২ বিস্তারিত: স্কুল, পরীক্ষা, শ্রেণি, বিষয়, সময়, পূর্ণমান, নির্দেশনা।
 *  ধাপ ৩ নকশা: স্বয়ংক্রিয় / ক্লাসিক / মডার্ন / কমপ্যাক্ট — সব মনোক্রোম
 *    প্রিন্ট-ফার্স্ট। AI ছাড়া অফলাইন দ্রুত-সাজানোও আছে।
 *  ধাপ ৪ প্রিভিউ: সাদা A4 শীটে প্রস্তুত প্রশ্নপত্র → এক ক্লিকে শীটে বসানো
 *    (আসল পেজিনেশন/প্রিন্ট/PDF সব চলে) বা স্বয়ংসম্পূর্ণ প্রিন্ট-ফাইল।
 *
 * BYOK: নিজের API Key থাকলে সেটাই; না থাকলে বিল্ট-ইন ডেমো SDK — শিক্ষককে
 * কিছু কনফিগার করতে হয় না।
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookPlus, CalendarDays, Camera, Check, ChevronLeft, ChevronRight, CircleAlert,
  Download, FileQuestion, Loader2, PenLine, RefreshCw, Sparkles, Trash2, Wand2,
  Zap, ZoomIn, ZoomOut, Image as ImageIcon,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import { useAiStore, aiConfiguredSelector } from '@/lib/ai-store';
import { callAi, prepareImageFile } from '@/lib/ai-client';
import type { PreparedImage } from '@/lib/ai-client';
import { useEditorStore } from '@/lib/store';
import {
  QP_SCHOOL_KEY, QP_STRUCTURE_SYSTEM, QP_TRANSCRIBE_SYSTEM, defaultQpMeta,
  extractQpJson, normalizeQpJson, paperToEditorHtml,
  paperToStandaloneHtml, parseQuestionText, qpSampleText, resolveQpFormat,
} from '@/lib/question-paper';
import type { QpFormat, QpMeta, QuestionPaper } from '@/lib/question-paper';
import { runCommand } from '@/components/ribbon/ribbon-shell';
import { useLangStore, useT, useFmtNum } from '@/lib/i18n';
import { formatDateLong } from '@/lib/i18n/core';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Step = 1 | 2 | 3 | 4;
type Phase = 'idle' | 'transcribing' | 'generating' | 'done' | 'error';
type QpError = { hintKey: string; detail?: string };

const STEPS: Array<{ id: Step; key: string }> = [
  { id: 1, key: 'qp.step.input' },
  { id: 2, key: 'qp.step.details' },
  { id: 3, key: 'qp.step.format' },
  { id: 4, key: 'qp.step.preview' },
];

const FORMATS: Array<{ id: QpFormat; label: string; desc: string }> = [
  { id: 'auto', label: 'qp.format.auto', desc: 'qp.format.auto.desc' },
  { id: 'classic', label: 'qp.format.classic', desc: 'qp.format.classic.desc' },
  { id: 'modern', label: 'qp.format.modern', desc: 'qp.format.modern.desc' },
  { id: 'compact', label: 'qp.format.compact', desc: 'qp.format.compact.desc' },
];

/** নকশা-কার্ডের ভেতরের মিনি-প্রিভিউ (গ্রে বার) */
function FormatVis({ id }: { id: QpFormat }) {
  const bar = (w: string, center = false) => (
    <span
      className="qp-vis-bar"
      style={{ width: w, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }}
    />
  );
  if (id === 'auto') {
    return <>{bar('34%', true)}{bar('52%', true)}{bar('70%')}{bar('62%')}</>;
  }
  if (id === 'classic') {
    return <>{bar('44%', true)}{bar('58%', true)}<span className="qp-vis-rule" />{bar('72%')}{bar('64%')}</>;
  }
  if (id === 'modern') {
    return <>{bar('38%')}<span className="qp-vis-rule" />{bar('70%')}{bar('58%')}</>;
  }
  return <>{bar('26%')}{bar('78%')}{bar('78%')}{bar('70%')}{bar('78%')}{bar('52%')}</>;
}

export function QuestionPaperDialog() {
  const open = useUiStore((s) => s.openDialog === 'questionPaper');
  const close = useUiStore((s) => s.close);
  const openDialog = useUiStore((s) => s.open);
  const configured = useAiStore(aiConfiguredSelector);
  const lang = useLangStore((s) => s.lang);
  const tt = useT();
  const fmtNum = useFmtNum();

  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<'photo' | 'text'>('text');
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [rawText, setRawText] = useState('');
  // ভাষা-অনুযায়ী ডিফল্ট মেটা + মনে-রাখা স্কুলের নাম — প্রথম রেন্ডারেই (lazy init)
  const [meta, setMeta] = useState<QpMeta | null>(() => {
    if (typeof window === 'undefined') return null;
    const l = useLangStore.getState().lang;
    const d = defaultQpMeta(l);
    try {
      d.schoolName = window.localStorage.getItem(QP_SCHOOL_KEY) ?? '';
      d.date = formatDateLong(new Date(), l);
    } catch { /* প্রাইভেট মোড */ }
    return d;
  });
  const [format, setFormat] = useState<QpFormat>('auto');
  const [phase, setPhase] = useState<Phase>('idle');
  const [paper, setPaper] = useState<QuestionPaper | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState<QpError | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [zoomMult, setZoomMult] = useState(1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [sheetH, setSheetH] = useState(0);
  const [fitScale, setFitScale] = useState(0.62);

  const busy = phase === 'transcribing' || phase === 'generating';

  // স্কুলের নাম পরের বারের জন্য মনে রাখা
  useEffect(() => {
    if (!meta?.schoolName) return;
    try { window.localStorage.setItem(QP_SCHOOL_KEY, meta.schoolName); } catch { /* কোটা */ }
  }, [meta?.schoolName]);

  // শীটের উচ্চতা → পাতার আন্দাজ (A4 পূর্ণ উচ্চতা 1123px-এ ভাগ — প্যাডিংসহ প্রথম পাতা)
  useEffect(() => {
    if (!paper || step !== 4 || !sheetRef.current) return;
    const el = sheetRef.current;
    const ro = new ResizeObserver(() => setSheetH(el.scrollHeight));
    ro.observe(el);
    setSheetH(el.scrollHeight);
    return () => ro.disconnect();
  }, [paper, step]);

  // প্রিভিউ কনটেইনারের প্রস্থ → ফিট-স্কেল
  useEffect(() => {
    if (step !== 4 || !previewWrapRef.current) return;
    const el = previewWrapRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 32;
      setFitScale(Math.max(0.3, Math.min(1, w / 794)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  const acceptFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      const prepared = await prepareImageFile(file);
      setImage(prepared);
      setMode('photo');
      setError(null);
    } catch (err) {
      toast.error(tt((err as Error)?.message === 'IMAGE_TOO_LARGE' ? 'ai.err.size' : 'ai.err.read'));
    }
  }, [tt]);

  // হাতের লেখা ছবি → টেক্সট (AI / ডেমো SDK)
  const transcribe = async () => {
    if (!image || busy) return;
    setPhase('transcribing');
    setError(null);
    const res = await callAi({
      prompt: 'এই ছবির সব প্রশ্ন ও হেডার সম্পূর্ণ উদ্ধার করে উপরের JSON ফরম্যাটে দাও।',
      system: QP_TRANSCRIBE_SYSTEM,
      imageDataUrl: image.dataUrl,
    });
    if (res.ok && res.text) {
      const data = extractQpJson<{ text?: string }>(res.text);
      const text = data?.text?.trim() ?? '';
      if (text) {
        setRawText((prev) => (prev.trim() ? `${prev}\n${text}` : text));
        setIsDemo(!!res.demo);
        setPhase('idle');
        toast.success(tt('qp.transcribe.done'));
        return;
      }
      setError({ hintKey: 'qp.err.empty' });
      setPhase('error');
      return;
    }
    setError({ hintKey: res.hintKey ?? 'ai.err.title', detail: res.detail });
    setPhase('error');
  };

  // Ctrl+V পেস্ট — ইনপুট ধাপে ছবি সরাসরি বসে
  useEffect(() => {
    if (!open || step !== 1 || mode !== 'photo') return;
    const onPaste = (e: ClipboardEvent) => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (!file) return;
      e.preventDefault();
      void acceptFile(file);
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [open, step, mode, acceptFile]);

  // প্রশ্নপত্র বানানো — AI পথ ব্যর্থ হলে অফলাইন পার্সারে নেমে যায় (গ্রেসফুল)
  const generate = async (useAi: boolean): Promise<void> => {
    if (busy) return;
    if (!meta) return;
    if (!rawText.trim()) {
      toast.info(tt('qp.toast.noText'));
      return;
    }
    setPhase('generating');
    setError(null);

    const finish = (result: QuestionPaper, demo: boolean) => {
      setPaper(result);
      setIsDemo(demo);
      setPhase('done');
      setStep(4);
    };

    if (useAi) {
      const header = [
        meta.schoolName && `school_name: ${meta.schoolName}`,
        meta.examTitle && `exam_title: ${meta.examTitle}`,
        meta.subject && `subject: ${meta.subject}`,
        meta.classLabel && `class: ${meta.classLabel}`,
        meta.date && `date: ${meta.date}`,
        meta.time && `time: ${meta.time}`,
        meta.fullMarks && `full_marks: ${meta.fullMarks}`,
      ].filter(Boolean).join('\n');
      const prompt = [
        'HEADER:',
        header || '(none provided)',
        '',
        'RAW QUESTION TEXT:',
        rawText.trim(),
        '',
        'Structure this into the final question paper JSON now.',
      ].join('\n');

      const res = await callAi({ prompt, system: QP_STRUCTURE_SYSTEM });
      if (res.ok && res.text) {
        const data = extractQpJson<unknown>(res.text);
        const result = data ? normalizeQpJson(data, meta, format) : null;
        if (result) {
          finish(result, !!res.demo);
          return;
        }
        setError({ hintKey: 'qp.err.empty' });
        setPhase('error');
        return;
      }
      // AI সাড়া দিল না — অফলাইন পার্সার ফলব্যাক
      const local = parseQuestionText(rawText, meta, format, lang);
      if (local) {
        finish(local, false);
        toast.info(tt('qp.noai'));
        return;
      }
      setError({ hintKey: res.hintKey ?? 'ai.err.title', detail: res.detail });
      setPhase('error');
      return;
    }

    // সরাসরি অফলাইন পার্সার
    const local = parseQuestionText(rawText, meta, format, lang);
    if (!local) {
      setError({ hintKey: 'qp.toast.parseFail' });
      setPhase('error');
      return;
    }
    finish(local, false);
  };

  const insertIntoSheet = () => {
    if (!paper) return;
    const html = paperToEditorHtml(paper, lang);
    const ok = runCommand((ed) => {
      ed.chain().focus().insertContent(html).run();
    });
    if (ok) {
      toast.success(tt('qp.toast.inserted'));
      close();
    }
  };

  const downloadPaper = () => {
    if (!paper) return;
    const html = paperToStandaloneHtml(paper, lang);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const a = document.createElement('a');
    const name = (paper.meta.schoolName || paper.meta.examTitle || 'question-paper')
      .replace(/[\\/:*?"<>|]+/g, ' ')
      .trim()
      .slice(0, 48) || 'question-paper';
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.html`;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(a.href), 4_000);
    toast.success(tt('qp.toast.download'));
  };

  const goStep = (s: Step) => {
    if (busy) return;
    if (s > 1 && !rawText.trim()) {
      toast.info(tt('qp.toast.noText'));
      return;
    }
    if (s === 4 && !paper) return;
    setStep(s);
  };

  const gotoNextFromInput = () => {
    if (!rawText.trim()) {
      toast.info(tt('qp.toast.noText'));
      return;
    }
    setStep(2);
  };

  const previewHtml = useMemo(() => (paper ? paperToEditorHtml(paper, lang) : ''), [paper, lang]);
  const resolved = useMemo(() => (paper ? resolveQpFormat(paper) : 'classic'), [paper]);
  const stats = useMemo(() => {
    if (!paper) return { q: 0, sec: 0, mcq: 0 };
    let q = 0, mcq = 0;
    for (const s of paper.sections) {
      q += s.questions.length;
      mcq += s.questions.filter((x) => x.options.length > 0).length;
    }
    return { q, sec: paper.sections.length, mcq };
  }, [paper]);

  const pages = Math.max(1, Math.ceil((sheetH || 1123) / 1123));
  const effScale = Math.max(0.25, Math.min(1.4, fitScale * zoomMult));

  const patchMeta = (patch: Partial<QpMeta>) => setMeta((prev) => (prev ? { ...prev, ...patch } : prev));

  // ── ধাপ ১: ইনপুট ──
  const stepInput = (
    <section aria-label={tt('qp.step.input')} className="flex flex-col gap-3">
      <div className="qp-modes" role="radiogroup" aria-label={tt('qp.step.input')}>
        <button
          type="button" role="radio" aria-checked={mode === 'photo'}
          className={cn('qp-mode', mode === 'photo' && 'qp-mode-on')}
          onClick={() => setMode('photo')}
        >
          <Camera size={18} aria-hidden="true" />
          <span className="qp-mode-name">{tt('qp.mode.photo')}</span>
          <span className="qp-mode-desc">{tt('qp.mode.photo.desc')}</span>
        </button>
        <button
          type="button" role="radio" aria-checked={mode === 'text'}
          className={cn('qp-mode', mode === 'text' && 'qp-mode-on')}
          onClick={() => setMode('text')}
        >
          <PenLine size={18} aria-hidden="true" />
          <span className="qp-mode-name">{tt('qp.mode.text')}</span>
          <span className="qp-mode-desc">{tt('qp.mode.text.desc')}</span>
        </button>
      </div>

      {mode === 'photo' ? (
        <>
          {!image ? (
            <div
              className={cn('ai-drop', dragOver && 'ai-drop-over')}
              role="button" tabIndex={0} aria-label={tt('qp.drop.title')}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click(); }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) void acceptFile(file);
              }}
            >
              <ImageIcon size={24} aria-hidden="true" className="ai-drop-icon" />
              <p className="ai-drop-title">{tt('qp.drop.title')}</p>
              <p className="ai-drop-hint">{tt('qp.drop.hint')}</p>
            </div>
          ) : (
            <div className="ai-thumb-row">
              <img src={image.dataUrl} alt={image.name} className="ai-thumb" />
              <div className="ai-thumb-meta">
                <p className="ai-thumb-name">{image.name}</p>
                <p className="ai-thumb-dim">{image.width} × {image.height}</p>
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" onClick={() => void transcribe()} disabled={busy}>
                    {phase === 'transcribing'
                      ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> {tt('qp.transcribing')}</>
                      : <><Sparkles size={13} aria-hidden="true" /> {tt('qp.transcribe')}</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()}>{tt('ai.drop.change')}</Button>
                </div>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef} type="file"
            accept="image/png,image/jpeg,image/webp" className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void acceptFile(file);
              e.target.value = '';
            }}
          />
        </>
      ) : null}

      <div>
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="ai-field-label">{tt('qp.raw.label')}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={() => setRawText(qpSampleText(lang))}>
              <Sparkles size={12} aria-hidden="true" /> {tt('qp.sample')}
            </Button>
            {rawText ? (
              <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs text-red-600 hover:text-red-700" onClick={() => { setRawText(''); setImage(null); }}>
                <Trash2 size={12} aria-hidden="true" /> {tt('qp.clear')}
              </Button>
            ) : null}
          </div>
        </div>
        <Textarea
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
          placeholder={tt('qp.raw.ph')}
          className="qp-raw min-h-[150px]"
          disabled={busy}
        />
        <p className="qp-hint">{tt('qp.raw.hint')}</p>
      </div>

      <div className="flex justify-end">
        <Button onClick={gotoNextFromInput} disabled={busy || !rawText.trim()}>
          {tt('qp.next')} <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </section>
  );

  // ── ধাপ ২: বিস্তারিত ──
  const stepDetails = meta ? (
    <section aria-label={tt('qp.step.details')} className="qp-form">
      <label className="qp-field qp-field-full">
        <span>{tt('qp.meta.school')}</span>
        <Input
          value={meta.schoolName}
          onChange={(e) => patchMeta({ schoolName: e.target.value })}
          placeholder={tt('qp.meta.school.ph')}
          disabled={busy}
        />
      </label>
      <label className="qp-field">
        <span>{tt('qp.meta.exam')}</span>
        <Input value={meta.examTitle} onChange={(e) => patchMeta({ examTitle: e.target.value })} disabled={busy} />
      </label>
      <label className="qp-field">
        <span>{tt('qp.meta.subject')}</span>
        <Input value={meta.subject} onChange={(e) => patchMeta({ subject: e.target.value })} disabled={busy} />
      </label>
      <label className="qp-field">
        <span>{tt('qp.meta.class')}</span>
        <Input value={meta.classLabel} onChange={(e) => patchMeta({ classLabel: e.target.value })} disabled={busy} />
      </label>
      <label className="qp-field">
        <span>{tt('qp.meta.date')}</span>
        <div className="flex gap-1.5">
          <Input value={meta.date} onChange={(e) => patchMeta({ date: e.target.value })} disabled={busy} />
          <Button size="sm" variant="outline" className="shrink-0" onClick={() => patchMeta({ date: formatDateLong(new Date(), lang) })} disabled={busy}>
            <CalendarDays size={14} aria-hidden="true" /> {tt('qp.meta.today')}
          </Button>
        </div>
      </label>
      <label className="qp-field">
        <span>{tt('qp.meta.time')}</span>
        <Input value={meta.time} onChange={(e) => patchMeta({ time: e.target.value })} disabled={busy} />
      </label>
      <label className="qp-field">
        <span>{tt('qp.meta.marks')}</span>
        <Input value={meta.fullMarks} onChange={(e) => patchMeta({ fullMarks: e.target.value })} disabled={busy} />
      </label>
      <label className="qp-field qp-field-full">
        <span>{tt('qp.meta.instructions')}</span>
        <Textarea
          value={meta.instructions.join('\n')}
          onChange={(e) => patchMeta({ instructions: e.target.value.split('\n').filter((l) => l.trim()) })}
          className="min-h-[70px]"
          disabled={busy}
        />
      </label>
      <div className="qp-field qp-field-full qp-switch-row">
        <span>{tt('qp.meta.studentLine')}</span>
        <Switch checked={meta.studentLine} onCheckedChange={(v) => patchMeta({ studentLine: v })} disabled={busy} />
      </div>
      <div className="qp-nav-row">
        <Button variant="outline" onClick={() => setStep(1)} disabled={busy}>
          <ChevronLeft size={14} aria-hidden="true" /> {tt('qp.back')}
        </Button>
        <Button onClick={() => setStep(3)} disabled={busy}>
          {tt('qp.next')} <ChevronRight size={14} aria-hidden="true" />
        </Button>
      </div>
    </section>
  ) : null;

  // ── ধাপ ৩: নকশা ──
  const stepFormat = (
    <section aria-label={tt('qp.step.format')} className="flex flex-col gap-3">
      <p className="ai-field-label">{tt('qp.format.title')}</p>
      <div className="qp-formats" role="radiogroup" aria-label={tt('qp.format.title')}>
        {FORMATS.map((f) => (
          <button
            key={f.id} type="button" role="radio" aria-checked={format === f.id}
            className={cn('qp-format', format === f.id && 'qp-format-on')}
            onClick={() => setFormat(f.id)}
            disabled={busy}
          >
            <span className="qp-format-vis"><FormatVis id={f.id} /></span>
            <strong>{tt(f.label)}</strong>
            <span className="qp-format-desc">{tt(f.desc)}</span>
          </button>
        ))}
      </div>

      {!configured ? (
        <div className="ai-setup" role="note">
          <p className="ai-setup-title"><Sparkles size={14} aria-hidden="true" /> {tt('ai.setup.title')}</p>
          <p className="ai-setup-desc">{tt('qp.setup.note')}</p>
          <Button size="sm" variant="outline" className="ai-save-btn" onClick={() => openDialog('aiSettings')}>
            {tt('ai.setup.open')}
          </Button>
        </div>
      ) : null}

      <div className="qp-nav-row">
        <Button variant="outline" onClick={() => setStep(2)} disabled={busy}>
          <ChevronLeft size={14} aria-hidden="true" /> {tt('qp.back')}
        </Button>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="ghost" title={tt('qp.noai.tip')} onClick={() => void generate(false)} disabled={busy}>
            <Zap size={14} aria-hidden="true" /> {tt('qp.noai')}
          </Button>
          <Button onClick={() => void generate(true)} disabled={busy}>
            {phase === 'generating'
              ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> {tt('qp.generating')}</>
              : <><Wand2 size={14} aria-hidden="true" /> {tt('qp.generate')}</>}
          </Button>
        </div>
      </div>
    </section>
  );

  // ── ধাপ ৪: প্রিভিউ ──
  const stepPreview = paper ? (
    <section aria-label={tt('qp.preview.title')} className="flex flex-col gap-2">
      <div className="qp-stats" role="status">
        <span className="qp-stat"><strong>{fmtNum(stats.sec)}</strong> {tt('qp.count.sec')}</span>
        <span className="qp-stat"><strong>{fmtNum(stats.q)}</strong> {tt('qp.count.q')}</span>
        {stats.mcq > 0 ? <span className="qp-stat"><strong>{fmtNum(stats.mcq)}</strong> {tt('qp.count.mcq')}</span> : null}
        <span className="qp-stat qp-stat-page">{tt('qp.preview.pages').replace('{n}', fmtNum(pages))}</span>
        {isDemo ? <span className="ai-demo-badge">{tt('qp.demo.badge')}</span> : null}
        <span className="qp-stat-zoom">
          <button type="button" aria-label="Zoom out" onClick={() => setZoomMult((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))} disabled={busy}><ZoomOut size={13} aria-hidden="true" /></button>
          <span>{fmtNum(Math.round(effScale * 100))}%</span>
          <button type="button" aria-label="Zoom in" onClick={() => setZoomMult((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))} disabled={busy}><ZoomIn size={13} aria-hidden="true" /></button>
        </span>
      </div>

      <div ref={previewWrapRef} className="qp-preview">
        <div
          className="qp-preview-spacer"
          style={{
            height: sheetH ? sheetH * effScale : undefined,
            width: 794 * effScale,
            maxWidth: '100%',
          }}
        >
          <div
            ref={sheetRef}
            className="qp-sheet"
            style={{ transform: `scale(${effScale})`, transformOrigin: 'top left' }}
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </div>
      </div>
      <p className="qp-hint">{tt('qp.preview.hint')}</p>

      <div className="qp-nav-row">
        <Button variant="outline" onClick={() => setStep(3)} disabled={busy}>
          <ChevronLeft size={14} aria-hidden="true" /> {tt('qp.editback')}
        </Button>
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => void generate(true)} disabled={busy}>
            <RefreshCw size={14} aria-hidden="true" /> {tt('qp.regen')}
          </Button>
          <Button variant="outline" onClick={downloadPaper} disabled={busy}>
            <Download size={14} aria-hidden="true" /> {tt('qp.download')}
          </Button>
          <Button onClick={insertIntoSheet} disabled={busy} title={tt('qp.insert.tip')}>
            <BookPlus size={14} aria-hidden="true" /> {tt('qp.insert')}
          </Button>
        </div>
      </div>
    </section>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="qp-dialog max-h-[94dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="ai-set-head">
          <DialogTitle className="flex items-center gap-2">
            <span className="ai-head-tile" aria-hidden="true"><FileQuestion size={16} /></span>
            {tt('qp.title')}
            {isDemo && paper ? <span className="ai-demo-badge">{tt('qp.demo.badge')}</span> : null}
          </DialogTitle>
          <DialogDescription>{tt('qp.desc')}</DialogDescription>
        </DialogHeader>

        {/* ধাপ-নির্দেশক */}
        <div className="qp-steps" role="list" aria-label={tt('qp.title')}>
          {STEPS.map((s, i) => (
            <button
              key={s.id} type="button" role="listitem"
              className={cn('qp-step', step === s.id && 'qp-step-on', step > s.id && 'qp-step-done')}
              onClick={() => goStep(s.id)}
              disabled={busy}
              aria-current={step === s.id ? 'step' : undefined}
            >
              <span className="qp-step-dot">{step > s.id ? <Check size={11} aria-hidden="true" /> : fmtNum(s.id)}</span>
              <span className="qp-step-label">{tt(s.key)}</span>
              {i < STEPS.length - 1 ? <span className="qp-step-line" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>

        {step === 1 ? stepInput : null}
        {step === 2 ? stepDetails : null}
        {step === 3 ? stepFormat : null}
        {step === 4 ? stepPreview : null}

        {/* ত্রুটি */}
        {phase === 'error' && error ? (
          <div className="ai-error" role="alert">
            <CircleAlert size={15} aria-hidden="true" />
            <div>
              <p className="ai-error-title">{tt('qp.err.title')}</p>
              <p>{tt(error.hintKey)}</p>
              {error.detail ? <p className="ai-error-detail">{error.detail}</p> : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="outline" onClick={() => {
                setPhase('idle');
                setError(null);
                if (image && !rawText.trim()) void transcribe();
                else void generate(true);
              }}>
                <RefreshCw size={13} aria-hidden="true" /> {tt('qp.regen')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openDialog('aiSettings')}>{tt('ai.setup.open')}</Button>
            </div>
          </div>
        ) : null}

        {/* AI কাজের ওভারলে */}
        {busy ? (
          <div className="qp-progress" role="status" aria-live="polite">
            <div className="qp-progress-card">
              <Loader2 size={22} className="qp-progress-spin" aria-hidden="true" />
              <p className="qp-progress-title">
                {phase === 'transcribing' ? tt('qp.busy.read') : tt('qp.busy.analyze')}
              </p>
              <p className="qp-progress-wait">{tt('qp.busy.wait')}</p>
              <span className="ai-progress" aria-hidden="true"><span /></span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
