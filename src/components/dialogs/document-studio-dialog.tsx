/**
 * ডকুমেন্ট স্টুডিও — ৩ ধাপের উইজার্ড (Document Studio wizard)
 * ──────────────────────────────────────────────────────────────────
 *  ধাপ ১ নকশা: ৯ ক্যাটাগরিতে ২৯টি বাংলাদেশ-প্রথার ডকুমেন্ট — সনদ, দরখাস্ত,
 *    দলিল, অফিস-পত্র, ইনভয়েস, রুটিন, আমন্ত্রণ, পর্চা, পোস্টার…
 *  ধাপ ২ তথ্য: টেমপ্লেট-ভিত্তিক ডাইনামিক ফরম + AI দিয়ে-পূরণ (সংক্ষিপ্ত
 *    বর্ণনা থেকে ঘরগুলো পূরণ) + সাজ-বিকল্প (কালি-প্যালেট)।
 *  ধাপ ৩ প্রিভিউ: সাদা A4-প্রতিরূপে জীবন্ত প্রিভিউ — নতুন পাতায় বসানো বা
 *    বর্তমান পাতায় বদলে বসানো।
 *
 * প্রিভিউ একই HTML (buildDsHtml) দিয়ে StaticContent-এ রেন্ডার — তাই যা
 * প্রিভিউয়ে দেখা যায়, এডিটর/প্রিন্ট/এক্সপোর্টে হুবহু তা-ই আসে।
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check, ChevronLeft, ChevronRight, CircleAlert, FileText, Loader2, Replace,
  Search, Sparkles, Wand2, ZoomIn, ZoomOut,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import {
  buildDsHtml, dsDefaultValues, dsPreviewInline, DS_CATEGORY_LABELS, DS_CATEGORY_ORDER,
  DS_STYLES, DS_TEMPLATES, dsTemplateById,
  type DsCategory, type DsTemplate, type DsValues,
} from '@/lib/document-studio';
import { callAi } from '@/lib/ai-client';
import { extractJson } from '@/lib/ai-content';
import { ensurePageEditorMounted, fitTemplatePage } from '@/components/editor/page-ops';
import { useLangStore, useT, useFmtNum } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type Step = 1 | 2 | 3;

const STEPS: Array<{ id: Step; key: string }> = [
  { id: 1, key: 'ds.step.pick' },
  { id: 2, key: 'ds.step.fill' },
  { id: 3, key: 'ds.step.preview' },
];

/** প্রিভিউ-শীটের ভার্চুয়াল প্রস্থ (px) — A4-প্রতিরূপ */
const SHEET_W = 794;
const SHEET_H = 1123;

/** ক্যাটাগরি → lucide আইকন (গ্রিড কার্ডের বাঁ-চিহ্ন) */
const CAT_ICONS: Record<DsCategory, string> = {
  cert: '🏅',
  apply: '✍️',
  land: '🗺️',
  office: '🏛️',
  biz: '🧾',
  edu: '🎓',
  event: '🎉',
  med: '🩺',
  promo: '📣',
};

/** তথ্য-ফরমের এক ঘর */
function FieldControl({ field, values, onChange, disabled }: {
  field: DsTemplate['fields'][number];
  values: DsValues;
  onChange: (id: string, v: string) => void;
  disabled: boolean;
}) {
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const label = field.label[lang] || field.label.en || field.label.bn;
  const ph = field.ph ? (field.ph[lang] || field.ph.en || field.ph.bn) : undefined;
  const common = 'w-full';
  return (
    <label className={cn('qp-field', field.wide && 'qp-field-full', field.kind === 'textarea' && 'qp-field-full')}>
      <span>{label}</span>
      {field.kind === 'textarea' ? (
        <Textarea
          className={common}
          rows={field.rows ?? 3}
          value={values[field.id] ?? ''}
          placeholder={ph ?? tt('ds.fill.hintText')}
          onChange={(e) => onChange(field.id, e.target.value)}
          disabled={disabled}
        />
      ) : field.kind === 'table' ? (
        <Textarea
          className={cn(common, 'font-mono text-[12.5px]')}
          rows={field.rows ?? 5}
          value={values[field.id] ?? ''}
          placeholder={ph ?? tt('ds.fill.hintTable')}
          onChange={(e) => onChange(field.id, e.target.value)}
          disabled={disabled}
        />
      ) : field.kind === 'date' ? (
        <Input className={common} value={values[field.id] ?? ''} onChange={(e) => onChange(field.id, e.target.value)} disabled={disabled} />
      ) : (
        <Input className={common} value={values[field.id] ?? ''} placeholder={ph} onChange={(e) => onChange(field.id, e.target.value)} disabled={disabled} />
      )}
      {field.kind === 'table' ? (
        <span className="qp-hint text-[10px] mt-0.5 block opacity-70">
          {(field.cols ?? []).map((c) => (c[lang] || c.en || c.bn)).join(' | ')}
        </span>
      ) : null}
    </label>
  );
}

/** নকশা-কার্ডের মিনি-থাম্ব — আসল HTML-এর স্কেল-ডাউন ক্রপ (কাঁচা-রেন্ডার — p-স্টাইলসহ) */
function DesignThumb({ html }: { html: string }) {
  const inner = useMemo(() => dsPreviewInline(html), [html]);
  return (
    <div className="relative h-28 overflow-hidden rounded-md border border-border bg-white" aria-hidden="true">
      <div
        className="ds-sheet pointer-events-none absolute left-0 top-0 origin-top-left select-none"
        style={{ width: 560, transform: 'scale(0.42)', padding: '10px 20px 0', minHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: inner }}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}

export function DocumentStudioDialog() {
  const open = useUiStore((s) => s.openDialog === 'documentStudio');
  const close = useUiStore((s) => s.close);
  const lang = useLangStore((s) => s.lang);
  const tt = useT();
  const nf = useFmtNum();

  const [step, setStep] = useState<Step>(1);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState<DsCategory | 'all'>('all');
  const [tplId, setTplId] = useState<string | null>(null);
  const [values, setValues] = useState<DsValues>({});
  const [styleId, setStyleId] = useState<string>('classic');
  const [aiBrief, setAiBrief] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [confirmReplace, setConfirmReplace] = useState(false);

  const previewWrapRef = useRef<HTMLDivElement | null>(null);
  const [fitScale, setFitScale] = useState(0.62);

  const tpl = tplId ? dsTemplateById(tplId) ?? null : null;

  // প্রিভিউ কনটেইনারের প্রস্থ → ফিট-স্কেল
  useEffect(() => {
    if (step !== 3 || !previewWrapRef.current) return;
    const el = previewWrapRef.current;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth - 24;
      setFitScale(Math.max(0.28, Math.min(1, w / SHEET_W)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [step]);

  const setValue = useCallback((id: string, v: string) => {
    setValues((prev) => ({ ...prev, [id]: v }));
  }, []);

  const pickTemplate = (t: DsTemplate) => {
    setTplId(t.id);
    setStyleId(t.defaultStyle);
    const init = dsDefaultValues(t, lang);
    setValues(init);
    setAiBrief('');
    setStep(2);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DS_TEMPLATES.filter((t) => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (!q) return true;
      return (
        t.name.bn.toLowerCase().includes(q)
        || t.name.en.toLowerCase().includes(q)
        || t.name.hi.toLowerCase().includes(q)
        || t.desc.bn.toLowerCase().includes(q)
        || t.desc.en.toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  const previewHtml = useMemo(
    () => (tpl ? buildDsHtml(tpl, values, lang, styleId) : ''),
    [tpl, values, lang, styleId],
  );

  const effScale = fitScale * zoom;
  const byCat = useMemo(() => {
    const map = new Map<DsCategory, DsTemplate[]>();
    for (const t of filtered) {
      const arr = map.get(t.category) ?? [];
      arr.push(t);
      map.set(t.category, arr);
    }
    return map;
  }, [filtered]);

  // ── AI ফিল — সংক্ষিপ্ত বর্ণনা থেকে ফরম-ঘর পূরণ ──
  const aiFill = async () => {
    if (!tpl || !aiBrief.trim() || aiBusy) return;
    setAiBusy(true);
    const fieldSpec = tpl.fields
      .map((f) => `- "${f.id}" (${f.kind === 'date' ? 'date in Bangla long format' : f.kind === 'table' ? 'multi-line rows, cells separated by |' : f.kind === 'textarea' ? 'paragraph text' : 'short text'}): ${f.label.bn}${f.kind === 'table' && f.cols ? ` [columns: ${f.cols.map((c) => c.bn).join(' | ')}]` : ''}`)
      .join('\n');
    const res = await callAi({
      prompt: [
        `DOCUMENT TEMPLATE: ${tpl.name.bn} (${tpl.name.en}) — ${tpl.desc.bn}`,
        '',
        'FIELDS TO FILL:',
        fieldSpec,
        '',
        'USER BRIEF (what the user needs — extract names, addresses, dates, amounts and every detail):',
        aiBrief.trim(),
        '',
        'Fill every field you can from the brief. For fields not mentioned, write a realistic, useful Bangla value fitting the document (sample-style), EXCEPT amounts/ID numbers/reference numbers — leave those as "" if unknown. Keep table values as "cell | cell" rows, one row per line.',
        'Return ONLY JSON: {"values": {"fieldId": "value"}}',
      ].join('\n'),
      system: 'You are the document-fill assistant of Bangla Publishing Studio, expert in Bangladeshi official documents (সনদ, দরখাস্ত, দলিল, ইনভয়েস). You fill forms precisely in correct formal Bangla, matching Bangladesh office/land/business document conventions. Return ONLY valid JSON — no markdown fences, no commentary.',
    });
    setAiBusy(false);
    if (!(res.ok && res.text)) {
      toast.error(tt('ds.err.aiFail'));
      return;
    }
    const parsed = extractJson(res.text) as { values?: Record<string, unknown> } | null;
    const incoming = parsed && typeof parsed.values === 'object' && parsed.values ? parsed.values : null;
    if (!incoming) {
      toast.error(tt('ds.err.aiFail'));
      return;
    }
    setValues((prev) => {
      const next = { ...prev };
      for (const f of tpl.fields) {
        const val = incoming[f.id];
        if (typeof val === 'string' && val.trim()) next[f.id] = val;
      }
      // তারিখ AI-এর হাতে না থাকলে আজকেরই থাকে
      for (const f of tpl.fields) {
        if (f.kind === 'date' && !String(next[f.id] ?? '').trim()) next[f.id] = dsDefaultValues(tpl, lang)[f.id] ?? '';
      }
      return next;
    });
    toast.success(tt('ds.toast.aiFilled'));
  };

  // ── পাতায় বসানো ──
  const mountFitReveal = async (pageId: string) => {
    await new Promise((r) => window.setTimeout(r, 220));
    for (let attempt = 0; attempt < 3; attempt++) {
      const idx = useEditorStore.getState().pages.findIndex((p) => p.id === pageId);
      if (idx < 0) return;
      document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
      if (await ensurePageEditorMounted(pageId)) break;
    }
    fitTemplatePage(pageId);
    const idx = useEditorStore.getState().pages.findIndex((p) => p.id === pageId);
    if (idx >= 0) {
      document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
    }
  };

  const insertNewPage = () => {
    if (!tpl) return;
    try {
      const s = useEditorStore.getState();
      const after = s.activePageId ?? s.pages[s.pages.length - 1]?.id ?? null;
      const id = s.addPage(after, previewHtml);
      s.updatePage(id, { noChrome: true });
      toast.success(tt('ds.toast.inserted'));
      close();
      void mountFitReveal(id);
    } catch {
      toast.error(tt('ds.err.apply'));
    }
  };

  const replaceCurrentPage = () => {
    if (!tpl) return;
    try {
      const s = useEditorStore.getState();
      const target = s.activePageId ?? s.pages[0]?.id;
      if (!target) {
        insertNewPage();
        return;
      }
      s.replacePageHtml(target, previewHtml);
      s.updatePage(target, { noChrome: true });
      toast.success(tt('ds.toast.replaced'));
      setConfirmReplace(false);
      close();
      void mountFitReveal(target);
    } catch {
      toast.error(tt('ds.err.apply'));
    }
  };

  const resetDates = () => {
    if (!tpl) return;
    setValues((prev) => ({ ...prev, ...dsDefaultValues(tpl, lang) }));
    toast.info(tt('ds.toast.datesReset'));
  };

  const styleOpts = tpl ? DS_STYLES.filter((s) => tpl.styles.includes(s.id)) : [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="qp-dialog max-h-[94dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="ai-set-head">
          <DialogTitle className="flex items-center gap-2">
            <span className="ai-head-tile" aria-hidden="true"><FileText size={16} /></span>
            {tt('ds.title')}
          </DialogTitle>
          <DialogDescription>{tt('ds.desc')}</DialogDescription>
        </DialogHeader>

        {/* ধাপ-নির্দেশক */}
        <div className="qp-steps" role="list" aria-label={tt('ds.title')}>
          {STEPS.map((s, i) => (
            <button
              key={s.id} type="button" role="listitem"
              className={cn('qp-step', step === s.id && 'qp-step-on', step > s.id && 'qp-step-done')}
              onClick={() => {
                if (s.id === 1) setStep(1);
                else if (s.id === 2 && tpl) setStep(2);
                else if (s.id === 3 && tpl) setStep(3);
              }}
              aria-current={step === s.id ? 'step' : undefined}
            >
              <span className="qp-step-dot">{step > s.id ? <Check size={11} aria-hidden="true" /> : nf(s.id)}</span>
              <span className="qp-step-label">{tt(s.key)}</span>
              {i < STEPS.length - 1 ? <span className="qp-step-line" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>

        {/* ── ধাপ ১: নকশা বাছাই ── */}
        {step === 1 ? (
          <section aria-label={tt('ds.step.pick')} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[180px] flex-1">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tt('ds.pick.search')} className="pl-8" aria-label={tt('ds.pick.search')} />
              </div>
              <div className="qp-scale flex-wrap" role="group" aria-label={tt('ds.pick.all')}>
                <button
                  type="button" aria-pressed={cat === 'all'}
                  className={cn('qp-scale-btn', cat === 'all' && 'qp-scale-on')}
                  onClick={() => setCat('all')}
                >
                  {tt('ds.pick.all')} ({nf(DS_TEMPLATES.length)})
                </button>
                {DS_CATEGORY_ORDER.map((c) => (
                  <button
                    key={c} type="button" aria-pressed={cat === c}
                    className={cn('qp-scale-btn', cat === c && 'qp-scale-on')}
                    onClick={() => setCat(c)}
                  >
                    {CAT_ICONS[c]} {DS_CATEGORY_LABELS[c][lang] || DS_CATEGORY_LABELS[c].en}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[54dvh] overflow-y-auto pr-1">
              {[...byCat.entries()].map(([category, tpls]) => (
                <div key={category} className="mb-4">
                  <p className="ai-field-label mb-1.5 flex items-center gap-1.5">
                    <span aria-hidden="true">{CAT_ICONS[category]}</span>
                    {DS_CATEGORY_LABELS[category][lang] || DS_CATEGORY_LABELS[category].en}
                    <span className="text-[10px] font-normal opacity-60">{tt('ds.pick.count').replace('{n}', nf(tpls.length))}</span>
                  </p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {tpls.map((t) => {
                      const sample = buildDsHtml(t, {}, lang, t.defaultStyle);
                      return (
                        <button
                          key={t.id} type="button"
                          className={cn(
                            'group flex flex-col gap-1.5 rounded-lg border border-border bg-card p-2 text-left transition hover:border-primary hover:shadow-md focus-visible:outline-2 focus-visible:outline-ring',
                            tplId === t.id && 'border-primary ring-1 ring-ring',
                          )}
                          onClick={() => pickTemplate(t)}
                          aria-label={t.name[lang] || t.name.en}
                        >
                          <DesignThumb html={sample} />
                          <span className="text-[12.5px] font-semibold leading-tight">{t.name[lang] || t.name.en}</span>
                          <span className="line-clamp-2 text-[10.5px] leading-snug text-muted-foreground">{t.desc[lang] || t.desc.en}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {filtered.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{tt('ds.pick.search')}</p>
              ) : null}
            </div>
          </section>
        ) : null}

        {/* ── ধাপ ২: তথ্য দিন ── */}
        {step === 2 && tpl ? (
          <section aria-label={tt('ds.step.fill')} className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">{tpl.name[lang] || tpl.name.en}</p>
              <div className="flex items-center gap-1.5">
                <span className="ai-field-label" title={tt('ds.fill.styleTip')}>{tt('ds.fill.style')}:</span>
                <div className="qp-scale" role="group" aria-label={tt('ds.fill.style')}>
                  {styleOpts.map((s) => (
                    <button
                      key={s.id} type="button" aria-pressed={styleId === s.id}
                      className={cn('qp-scale-btn', styleId === s.id && 'qp-scale-on')}
                      onClick={() => setStyleId(s.id)}
                    >
                      {s.name[lang] || s.name.en}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* AI দিয়ে পূরণ */}
            <div className="rounded-lg border border-border bg-muted/30 p-2.5">
              <p className="ai-field-label mb-1.5 flex items-center gap-1.5">
                <Wand2 size={13} aria-hidden="true" /> {tt('ds.fill.ai.tip')}
              </p>
              <div className="flex flex-col gap-1.5 sm:flex-row">
                <Input
                  value={aiBrief}
                  onChange={(e) => setAiBrief(e.target.value)}
                  placeholder={tt('ds.fill.ai.ph')}
                  aria-label={tt('ds.fill.ai.tip')}
                  className="flex-1"
                  disabled={aiBusy}
                  onKeyDown={(e) => { if (e.key === 'Enter') void aiFill(); }}
                />
                <Button size="sm" onClick={() => void aiFill()} disabled={aiBusy || !aiBrief.trim()} className="shrink-0">
                  {aiBusy
                    ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> …</>
                    : <><Sparkles size={13} aria-hidden="true" /> {tt('ds.fill.ai.go')}</>}
                </Button>
              </div>
            </div>

            <div className="qp-form max-h-[46dvh] overflow-y-auto pr-1">
              {tpl.fields.map((f) => (
                <FieldControl key={f.id} field={f} values={values} onChange={setValue} disabled={aiBusy} />
              ))}
            </div>

            <div className="qp-nav-row">
              <Button variant="outline" onClick={() => setStep(1)} disabled={aiBusy}>
                <ChevronLeft size={14} aria-hidden="true" /> {tt('ds.fill.back')}
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="ghost" onClick={resetDates} disabled={aiBusy} title={tt('ds.fill.reset')}>
                  <Sparkles size={13} aria-hidden="true" /> {tt('ds.fill.reset')}
                </Button>
                <Button onClick={() => setStep(3)} disabled={aiBusy}>
                  {tt('ds.fill.preview')} <ChevronRight size={14} aria-hidden="true" />
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* ── ধাপ ৩: প্রিভিউ ও বসানো ── */}
        {step === 3 && tpl ? (
          <section aria-label={tt('ds.step.preview')} className="flex flex-col gap-2">
            <div className="qp-stats" role="status">
              <span className="qp-stat"><strong>{tpl.name[lang] || tpl.name.en}</strong></span>
              <span className="qp-stat qp-stat-page">{tt('ds.prev.pageHint')}</span>
              <span className="qp-stat-zoom">
                <button type="button" aria-label="-" onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}><ZoomOut size={13} aria-hidden="true" /></button>
                <span>{nf(Math.round(effScale * 100))}%</span>
                <button type="button" aria-label="+" onClick={() => setZoom((z) => Math.min(1.6, Math.round((z + 0.1) * 10) / 10))}><ZoomIn size={13} aria-hidden="true" /></button>
              </span>
            </div>

            <div ref={previewWrapRef} className="qp-preview">
              <div
                className="qp-preview-spacer"
                style={{ width: SHEET_W * effScale, height: SHEET_H * effScale, maxWidth: '100%' }}
              >
                <div
                  className="ds-sheet"
                  style={{ transform: `scale(${effScale})`, transformOrigin: 'top left', width: SHEET_W, minHeight: SHEET_H }}
                  dangerouslySetInnerHTML={{ __html: dsPreviewInline(previewHtml) }}
                />
              </div>
            </div>

            <div className="qp-nav-row">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ChevronLeft size={14} aria-hidden="true" /> {tt('ds.prev.back')}
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={() => setConfirmReplace(true)} title={tt('ds.prev.replaceTip')}>
                  <Replace size={14} aria-hidden="true" /> {tt('ds.prev.insertHere')}
                </Button>
                <Button onClick={insertNewPage} title={tt('ds.prev.insertTip')}>
                  <Check size={14} aria-hidden="true" /> {tt('ds.prev.insertNew')}
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {/* বর্তমান পাতা-বদলের নিশ্চয়তা */}
        <AlertDialog open={confirmReplace} onOpenChange={setConfirmReplace}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{tt('ds.confirm.replaceTitle')}</AlertDialogTitle>
              <AlertDialogDescription>{tt('ds.confirm.replaceBody')}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setConfirmReplace(false)}>{tt('ds.confirm.replaceCancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={replaceCurrentPage}>{tt('ds.confirm.replaceGo')}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* AI ওভারলে */}
        {aiBusy ? (
          <div className="qp-progress" role="status" aria-live="polite">
            <div className="qp-progress-card">
              <Loader2 size={22} className="qp-progress-spin" aria-hidden="true" />
              <p className="qp-progress-title">{tt('ds.fill.ai.tip')}</p>
              <p className="qp-progress-wait">{tt('ds.fill.ai.ph')}</p>
              <span className="ai-progress" aria-hidden="true"><span /></span>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
