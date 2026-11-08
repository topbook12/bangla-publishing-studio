/**
 * দিন ৬৬ — প্রশ্ন-ভান্ডার ডায়ালগ — গ্লোবাল প্রশ্ন-সংগ্রহ (Dexie v5, local-first)।
 *
 *  - ছাঁকনি: শ্রেণি/বিষয়/জটিলতা/ধরন + ফ্রি-টেক্সট (প্রশ্ন/উত্তর/ট্যাগ)
 *  - ইনলাইন ফর্ম: ধরন-ভিত্তিক ফিল্ড (mcq → অপশন, creative → উপপ্রশ্ন)
 *  - "প্রশ্নপত্রে টানুন": নির্বাচিত প্রশ্ন → QpSection → QuestionPaper →
 *    QP-স্টুডিওর পুরো রেন্ডার/পেইনেশন-পাইপলাইন (৯ ফরম্যাট প্রস্তুত) — শেষ পাতায় বসে
 *  - নমুনা প্রশ্ন (স্টার্টার) — প্যাক-ইকোসিস্টেমের স্টার্টার-প্যাক প্যাটার্ন
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BookMarked, Loader2, Pencil, Plus, RotateCcw, Sparkles, Trash2,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { PHero } from '@/components/premium';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useEditorStore } from '@/lib/store';
import type { PageData, PaperSizeId } from '@/lib/types';
import { useUiStore } from '@/lib/ui-store';
import { useT, useFmtNum, useLangStore } from '@/lib/i18n';
import {
  bankFacets, bankPaperToEditorHtml, buildPaperFromBank, deleteBankQuestion,
  listBankQuestions, saveBankQuestion, seedStarterQuestionsOnce,
  type BankDifficulty, type BankType, type QuestionBankRecord,
} from '@/lib/question-bank';
import { normalizeQpLayout } from '@/lib/question-paper';
import { qpMarginsForPaper } from '@/lib/page-layout';
import { htmlIsEmpty, paginateInsertedReader } from '@/components/editor/page-ops';
import { toast } from 'sonner';

const TYPES: BankType[] = ['short', 'mcq', 'creative', 'tf', 'blank', 'match'];
const DIFFS: BankDifficulty[] = ['easy', 'medium', 'hard'];

interface FormState {
  id?: string;
  type: BankType;
  text: string;
  answer: string;
  marks: number;
  className: string;
  subject: string;
  tags: string;
  difficulty: BankDifficulty;
  /** mcq-অপশন (প্রতি লাইনে একটি) */
  options: string;
  /** creative-উপপ্রশ্ন (প্রতি লাইনে: লেখা | নম্বর) */
  subs: string;
}

const EMPTY_FORM: FormState = {
  type: 'short',
  text: '',
  answer: '',
  marks: 1,
  className: '',
  subject: '',
  tags: '',
  difficulty: 'medium',
  options: '',
  subs: '',
};

function DiffRow({ q }: { q: QuestionBankRecord }) {
  const tt = useT();
  const diffLabel = tt(`qbank.diff.${q.difficulty}`);
  const diffCls = q.difficulty === 'easy'
    ? 'border-primary/30 bg-primary/10 text-primary'
    : q.difficulty === 'medium'
      ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400'
      : 'border-red-500/35 bg-red-500/10 text-red-600 dark:text-red-400';
  return (
    <Badge variant="outline" className={`shrink-0 ${diffCls}`}>{diffLabel}</Badge>
  );
}

export function QuestionBankDialog() {
  const openDialog = useUiStore((s) => s.openDialog);
  const close = useUiStore((s) => s.close);
  const open = openDialog === 'questionBank';
  const tt = useT();
  const ff = useFmtNum();
  const lang = useLangStore((s) => s.lang);

  const [items, setItems] = useState<QuestionBankRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pulling, setPulling] = useState(false);

  // ছাঁকনি
  const [fq, setFq] = useState('');
  const [fClass, setFClass] = useState('all');
  const [fSubject, setFSubject] = useState('all');
  const [fDiff, setFDiff] = useState<'all' | BankDifficulty>('all');
  const [fType, setFType] = useState<'all' | BankType>('all');
  const [facets, setFacets] = useState<{ classNames: string[]; subjects: string[] }>({ classNames: [], subjects: [] });

  // ইনলাইন ফর্ম
  const [form, setForm] = useState<FormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listBankQuestions({
        className: fClass !== 'all' ? fClass : undefined,
        subject: fSubject !== 'all' ? fSubject : undefined,
        difficulty: fDiff,
        type: fType,
        q: fq || undefined,
      });
      setItems(rows);
      setFacets(await bankFacets());
    } finally {
      setLoading(false);
    }
  }, [fClass, fSubject, fDiff, fType, fq]);

  useEffect(() => {
    if (open) {
      void refresh();
      setForm(null);
      setConfirmDelete(null);
      setSelected(new Set());
    }
  }, [open, refresh]);

  const toggleSel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (!form) return;
    const text = form.text.trim();
    if (!text) {
      toast.error(tt('qbank.err.text'));
      return;
    }
    setSaving(true);
    try {
      const options = form.type === 'mcq'
        ? form.options.split('\n').map((s) => s.trim()).filter(Boolean).map((text2) => ({ text: text2 }))
        : undefined;
      const subs = form.type === 'creative'
        ? form.subs.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
            const [t2, m2] = line.split('|').map((s) => s.trim());
            return { text: t2 ?? line, marks: m2 ?? '১' };
          })
        : undefined;
      await saveBankQuestion({
        id: form.id,
        type: form.type,
        text,
        answer: form.answer.trim() || undefined,
        marks: Math.max(1, Math.min(100, Math.round(form.marks) || 1)),
        className: form.className.trim(),
        subject: form.subject.trim(),
        tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
        difficulty: form.difficulty,
        ...(options ? { options } : {}),
        ...(subs ? { subs } : {}),
      });
      toast.success(tt('qbank.toast.saved'));
      setForm(null);
      await refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDelete(null);
    await deleteBankQuestion(id);
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    toast.success(tt('qbank.toast.deleted'));
    await refresh();
  };

  const handleSeed = async () => {
    await seedStarterQuestionsOnce();
    toast.success(tt('qbank.toast.seeded'));
    await refresh();
  };

  /** নির্বাচিত প্রশ্ন → QuestionPaper → QP-পাইপলাইনে শেষ পাতায় বসানো (QP-স্টুডিওর চুক্তি) */
  const handlePull = () => {
    const chosen = items.filter((q) => selected.has(q.id));
    if (chosen.length === 0) {
      toast.error(tt('qbank.pull.needSelection'));
      return;
    }
    const st = useEditorStore.getState();
    if (!st.projectId) {
      toast.error(tt('qbank.pull.needSelection'));
      return;
    }
    setPulling(true);
    try {
      const first = chosen[0];
      const paper = buildPaperFromBank(chosen, {
        subject: fSubject !== 'all' ? fSubject : first.subject,
        classLabel: fClass !== 'all' ? fClass : first.className,
      });
      const html = bankPaperToEditorHtml(paper, lang);
      const qpPs = normalizeQpLayout(paper.layout).pageSize as PaperSizeId;
      const globalPs = st.settings.paperSize;
      const qpMargins = qpMarginsForPaper(qpPs);
      const sizePatch: Partial<PageData> = {
        paperSizeOverride: qpPs !== globalPs ? qpPs : null,
        marginsOverride: { ...qpMargins, gutter: st.settings.margins.gutter },
        noChrome: true,
      };
      const last = st.pages[st.pages.length - 1];
      const lastUsable = !!last && last.kind === 'normal' && !last.flowLock && htmlIsEmpty(last.html);
      let targetId: string;
      if (lastUsable) {
        st.replacePageHtml(last.id, html);
        st.updatePage(last.id, sizePatch);
        targetId = last.id;
      } else {
        targetId = st.addPage(last?.id ?? null, html, sizePatch);
      }
      st.setActivePage(targetId);
      close();
      toast.success(tt('qbank.toast.pulled'));
      void paginateInsertedReader(targetId).then(() => {
        const idx = useEditorStore.getState().pages.findIndex((p) => p.id === targetId);
        if (idx >= 0) document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
      });
    } finally {
      setPulling(false);
    }
  };

  const selectedCount = useMemo(
    () => items.filter((q) => selected.has(q.id)).length,
    [items, selected],
  );

  const diffOptions: Array<{ v: 'all' | BankDifficulty; label: string }> = [
    { v: 'all', label: tt('qbank.filter.all') },
    ...DIFFS.map((d) => ({ v: d, label: tt(`qbank.diff.${d}`) })),
  ];
  const typeOptions: Array<{ v: 'all' | BankType; label: string }> = [
    { v: 'all', label: tt('qbank.filter.all') },
    ...TYPES.map((t2) => ({ v: t2, label: tt(`qbank.type.${t2}`) })),
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{tt('qbank.title')}</DialogTitle>
          <DialogDescription>{tt('qbank.desc')}</DialogDescription>
        </DialogHeader>
        <PHero tone="emerald" icon={BookMarked} title={tt('qbank.title')} desc={tt('qbank.desc')} />

        {form ? (
          <>
            {/* ইনলাইন ফর্ম */}
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-type">{tt('qbank.fields.type')}</label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm({ ...form, type: v as BankType })}
                  >
                    <SelectTrigger id="qbank-type" className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t2) => (
                        <SelectItem key={t2} value={t2}>{tt(`qbank.type.${t2}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-diff">{tt('qbank.fields.difficulty')}</label>
                  <Select
                    value={form.difficulty}
                    onValueChange={(v) => setForm({ ...form, difficulty: v as BankDifficulty })}
                  >
                    <SelectTrigger id="qbank-diff" className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DIFFS.map((d) => (
                        <SelectItem key={d} value={d}>{tt(`qbank.diff.${d}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-marks">{tt('qbank.fields.marks')}</label>
                  <Input
                    id="qbank-marks" type="number" min={1} max={100} className="h-9"
                    value={form.marks}
                    onChange={(e) => setForm({ ...form, marks: Number(e.target.value) || 1 })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-class">{tt('qbank.fields.className')}</label>
                  <Input
                    id="qbank-class" className="h-9" list="qbank-class-list"
                    value={form.className}
                    onChange={(e) => setForm({ ...form, className: e.target.value })}
                  />
                  <datalist id="qbank-class-list">
                    {facets.classNames.map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-text">{tt('qbank.fields.text')}</label>
                <Textarea
                  id="qbank-text" rows={2} className="resize-none"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                />
              </div>

              {form.type === 'mcq' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-options">{tt('qbank.fields.options')}</label>
                  <Textarea
                    id="qbank-options" rows={4} className="resize-none font-[inherit]"
                    value={form.options}
                    onChange={(e) => setForm({ ...form, options: e.target.value })}
                  />
                </div>
              )}
              {form.type === 'creative' && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-subs">{tt('qbank.fields.subs')}</label>
                  <Textarea
                    id="qbank-subs" rows={4} className="resize-none"
                    value={form.subs}
                    onChange={(e) => setForm({ ...form, subs: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-subject">{tt('qbank.fields.subject')}</label>
                  <Input
                    id="qbank-subject" className="h-9" list="qbank-subject-list"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  />
                  <datalist id="qbank-subject-list">
                    {facets.subjects.map((s) => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-tags">{tt('qbank.fields.tags')}</label>
                  <Input
                    id="qbank-tags" className="h-9"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="qbank-answer">{tt('qbank.fields.answer')}</label>
                <Input
                  id="qbank-answer" className="h-9"
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                />
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" disabled={saving} onClick={() => void handleSave()}>
                  {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
                  {tt('qbank.save')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setForm(null)}>
                  {tt('hdr.cancel')}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* ছাঁকনি-সারি */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Input
                className="col-span-2 h-9 sm:col-span-2"
                placeholder={tt('qbank.filter.search')}
                aria-label={tt('qbank.filter.search')}
                value={fq}
                onChange={(e) => setFq(e.target.value)}
              />
              <Select value={fDiff} onValueChange={(v) => setFDiff(v as 'all' | BankDifficulty)}>
                <SelectTrigger className="h-9" aria-label={tt('qbank.fields.difficulty')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {diffOptions.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fType} onValueChange={(v) => setFType(v as 'all' | BankType)}>
                <SelectTrigger className="h-9" aria-label={tt('qbank.fields.type')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {typeOptions.map((o) => <SelectItem key={o.v} value={o.v}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fClass} onValueChange={setFClass}>
                <SelectTrigger className="h-9" aria-label={tt('qbank.filter.className')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tt('qbank.filter.all')}</SelectItem>
                  {facets.classNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={fSubject} onValueChange={setFSubject}>
                <SelectTrigger className="h-9" aria-label={tt('qbank.filter.subject')}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tt('qbank.filter.all')}</SelectItem>
                  {facets.subjects.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* অ্যাকশন-সারি */}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-9 gap-1.5" onClick={() => setForm({ ...EMPTY_FORM })}>
                <Plus size={14} /> {tt('qbank.add')}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1.5"
                disabled={selectedCount === 0 || pulling}
                title={tt('qbank.pull.tip')}
                onClick={handlePull}
              >
                {pulling ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} className="scale-x-[-1]" />}
                {tt('qbank.pull')}
              </Button>
              {selectedCount > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {tt('qbank.selected').split('{n}').join(ff(selectedCount))}
                </Badge>
              )}
              <span className="ml-auto text-xs text-muted-foreground" role="status">
                {tt('qbank.count').split('{n}').join(ff(items.length))}
              </span>
            </div>

            {/* তালিকা */}
            <div className="nav-scroll max-h-72 space-y-2 overflow-y-auto pr-1">
              {loading ? (
                <p className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 size={15} className="animate-spin" /> {tt('app.loading')}
                </p>
              ) : items.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">{tt('qbank.empty')}</p>
                  <Button size="sm" variant="outline" className="mt-3 gap-1.5" onClick={() => void handleSeed()}>
                    <Sparkles size={13} /> {tt('qbank.seed')}
                  </Button>
                </div>
              ) : (
                items.map((q) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-2 rounded-lg border p-3 transition hover:border-primary/50"
                  >
                    <Checkbox
                      className="mt-0.5"
                      checked={selected.has(q.id)}
                      onCheckedChange={() => toggleSel(q.id)}
                      aria-label={q.text.slice(0, 60)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <DiffRow q={q} />
                        <Badge variant="secondary" className="shrink-0">{tt(`qbank.type.${q.type}`)}</Badge>
                        <Badge variant="outline" className="shrink-0 text-muted-foreground">
                          {ff(q.marks)} {tt('qbank.fields.marks')}
                        </Badge>
                        {q.className && (
                          <span className="text-[11px] text-muted-foreground">{q.className}</span>
                        )}
                        {q.subject && (
                          <span className="text-[11px] text-muted-foreground">· {q.subject}</span>
                        )}
                        {q.tags.length > 0 && (
                          <span className="text-[11px] text-primary/80">#{q.tags.join(' #')}</span>
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed">{q.text}</p>
                      {q.answer && (
                        <p className="mt-0.5 text-[11px] font-medium text-primary/80">
                          {tt('qbank.answerChip').split('{a}').join(q.answer)}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title={tt('qbank.edit')}
                        aria-label={tt('qbank.edit')}
                        onClick={() => setForm({
                          id: q.id,
                          type: q.type,
                          text: q.text,
                          answer: q.answer ?? '',
                          marks: q.marks,
                          className: q.className,
                          subject: q.subject,
                          tags: q.tags.join(', '),
                          difficulty: q.difficulty,
                          options: (q.options ?? []).map((o) => o.text).join('\n'),
                          subs: (q.subs ?? []).map((s) => `${s.text} | ${s.marks}`).join('\n'),
                        })}
                      >
                        <Pencil size={13} />
                      </Button>
                      {confirmDelete === q.id ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 px-1.5 text-[11px]"
                          onClick={() => void handleDelete(q.id)}
                        >
                          {tt('qbank.confirmDelete')}
                        </Button>
                      ) : (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-500"
                          title={tt('qbank.delete')}
                          aria-label={tt('qbank.deleteAria').split('{t}').join(q.text.slice(0, 30))}
                          onClick={() => setConfirmDelete(q.id)}
                        >
                          <Trash2 size={13} />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
