/**
 * থিসিস স্টুডিও ডায়ালগ — প্রফেশনাল গবেষণাপত্র নির্মাণ (Thesis Studio)
 * ─────────────────────────────────────────────────────────────────────
 * ট্যাব ১ "নির্মাণ": ভাষা/স্তর/শৃঙ্খলা + মেটা-তথ্য → বিশ্ববিদ্যালয়-স্ট্যান্ডার্ড
 *   সম্পূর্ণ কাঠামো (শিরোনাম পাতা → … → পরিশিষ্ট) এডিটেবল পাতা হিসেবে —
 *   পৃষ্ঠা-নম্বর স্কিমসহ (প্রারম্ভিক রোমান i, ii → অধ্যায় থেকে ১, ২, ৩)।
 * ট্যাব ২ "সূত্র": APA 7 / MLA 9 / Harvard / Chicago / IEEE — বই/জার্নাল/ওয়েব…
 *   ফরম্যাট-নির্ভুল তালিকা-এন্ট্রি + in-text উদ্ধৃতি → কার্সরে বসানো/কপি।
 * ট্যাব ৩ "গাইড": মার্জিন-ফন্ট-নম্বর-স্টাইলের স্ট্যান্ডার্ড নিয়মাবলি।
 */

'use client';

import { useMemo, useState } from 'react';
import {
  BadgeCheck, BookMarked, Check, Copy, GraduationCap, Loader2, ScrollText, Sparkles,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import { toast } from 'sonner';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import {
  buildThesisPages, thesisFormatPreset, THESIS_MARGINS,
  DEFAULT_THESIS_OPTIONS, formatReference, formatInText, EMPTY_CITE,
  CITE_STYLE_NAMES, CITE_TYPE_NAMES,
} from '@/lib/thesis';
import type { ThesisLang, ThesisLevel, ThesisDiscipline, ThesisOptions, CiteEntry, CiteStyle, CiteType } from '@/lib/thesis';
import { ensurePageEditorMounted } from '@/components/editor/page-ops';

type Tab = 'build' | 'cite' | 'guide';

const STRUCTURE: Array<{ id: keyof ThesisOptions; key: string }> = [
  { id: 'declaration', key: 'thesis.opt.declaration' },
  { id: 'certificate', key: 'thesis.opt.certificate' },
  { id: 'acknowledgment', key: 'thesis.opt.acknowledgment' },
  { id: 'abstract', key: 'thesis.opt.abstract' },
  { id: 'toc', key: 'thesis.opt.toc' },
  { id: 'lists', key: 'thesis.opt.lists' },
  { id: 'abbreviations', key: 'thesis.opt.abbreviations' },
  { id: 'references', key: 'thesis.opt.references' },
  { id: 'appendix', key: 'thesis.opt.appendix' },
];

const CITE_FIELDS: Array<{ id: keyof CiteEntry; key: string; ph?: string }> = [
  { id: 'authors', key: 'thesis.cite.fAuthors', ph: 'thesis.cite.fAuthors.ph' },
  { id: 'year', key: 'thesis.cite.fYear' },
  { id: 'title', key: 'thesis.cite.fTitle' },
  { id: 'container', key: 'thesis.cite.fContainer' },
  { id: 'publisher', key: 'thesis.cite.fPublisher' },
  { id: 'place', key: 'thesis.cite.fPlace' },
  { id: 'volume', key: 'thesis.cite.fVolume' },
  { id: 'issue', key: 'thesis.cite.fIssue' },
  { id: 'pages', key: 'thesis.cite.fPages' },
  { id: 'edition', key: 'thesis.cite.fEdition' },
  { id: 'doi', key: 'thesis.cite.fDoi' },
  { id: 'url', key: 'thesis.cite.fUrl' },
  { id: 'accessed', key: 'thesis.cite.fAccessed' },
];

const GUIDE_ITEMS: Array<{ icon: typeof Check; key: string }> = [
  { icon: ScrollText, key: 'thesis.guide.margins' },
  { icon: BookMarked, key: 'thesis.guide.typo' },
  { icon: ScrollText, key: 'thesis.guide.numbering' },
  { icon: BookMarked, key: 'thesis.guide.chapters' },
  { icon: ScrollText, key: 'thesis.guide.toc' },
  { icon: BookMarked, key: 'thesis.guide.cite' },
  { icon: ScrollText, key: 'thesis.guide.figs' },
  { icon: Check, key: 'thesis.guide.check' },
];

export function ThesisDialog() {
  const open = useUiStore((s) => s.openDialog === 'thesis');
  const close = useUiStore((s) => s.close);
  const tt = useT();

  // ── নির্মাণ-স্টেট ──
  const [tab, setTab] = useState<Tab>('build');
  const [lang, setLang] = useState<ThesisLang>('bn');
  const [level, setLevel] = useState<ThesisLevel>('masters');
  const [discipline, setDiscipline] = useState<ThesisDiscipline>('science');
  const [title, setTitle] = useState('');
  const [university, setUniversity] = useState('');
  const [department, setDepartment] = useState('');
  const [author, setAuthor] = useState('');
  const [roll, setRoll] = useState('');
  const [session, setSession] = useState('');
  const [supervisor, setSupervisor] = useState('');
  const [degreeName, setDegreeName] = useState('');
  const [opts, setOpts] = useState<ThesisOptions>({ ...DEFAULT_THESIS_OPTIONS });
  const [busy, setBusy] = useState(false);

  // ── সূত্র-স্টেট ──
  const [cite, setCite] = useState<CiteEntry>({ ...EMPTY_CITE });

  const citeValid = cite.title.trim().length > 0 && cite.year.trim().length > 0;
  const refHtml = useMemo(() => (citeValid ? formatReference(cite) : ''), [cite, citeValid]);
  const inText = useMemo(() => (citeValid ? formatInText(cite) : ''), [cite, citeValid]);

  const patchCite = (id: keyof CiteEntry, v: string) => setCite((prev) => ({ ...prev, [id]: v }));

  const insertAtCursor = (html: string) => {
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (!ed || ed.isDestroyed) {
      toast.error(tt('ai.noEditor'));
      return false;
    }
    try {
      ed.chain().focus().insertContent(html).run();
      return true;
    } catch {
      try {
        ed.chain().focus().insertContentAt(ed.state.doc.content.size, html).run();
        return true;
      } catch {
        return false;
      }
    }
  };

  // ── থিসিস কাঠামো নির্মাণ ──
  const generate = async () => {
    if (!title.trim()) {
      toast.info(tt('thesis.err.noTitle'));
      return;
    }
    setBusy(true);
    try {
      const meta = {
        lang, level, discipline,
        title: title.trim(),
        university: university.trim(),
        department: department.trim(),
        author: author.trim(),
        roll: roll.trim(),
        session: session.trim(),
        supervisor: supervisor.trim(),
        degreeName: degreeName.trim(),
      };
      const pages = buildThesisPages(meta, opts);

      const s = useEditorStore.getState();
      let after = s.activePageId ?? s.pages[s.pages.length - 1]?.id ?? null;
      const firstId = (() => {
        const id = s.addPage(after, pages[0].html);
        s.updatePage(id, { noChrome: pages[0].noChrome, numberRestart: pages[0].numberRestart ?? null });
        return id;
      })();
      after = firstId;
      for (let i = 1; i < pages.length; i++) {
        const id = s.addPage(after, pages[i].html);
        s.updatePage(id, { noChrome: pages[i].noChrome, numberRestart: pages[i].numberRestart ?? null });
        after = id;
      }

      // স্ট্যান্ডার্ড থিসিস ফরম্যাট (মার্জিন/ফন্ট/স্পেসিং) — চাইলে
      if (opts.applyFormat) {
        const preset = thesisFormatPreset(lang);
        useEditorStore.getState().updateSettings({ ...preset, margins: { ...THESIS_MARGINS } });
      }

      toast.success(tt('thesis.toast.built').replace('{n}', String(pages.length)));
      close();

      // প্রথম নতুন পাতায় নেভিগেট + এডিটর মাউন্ট নিশ্চিত
      const s2 = useEditorStore.getState();
      const idx = s2.pages.findIndex((p) => p.id === firstId);
      if (idx >= 0) {
        document.querySelector(`[data-page-index="${idx}"]`)?.scrollIntoView({ block: 'start' });
        void ensurePageEditorMounted(firstId);
      }
    } finally {
      setBusy(false);
    }
  };

  const copyText = (text: string, plainHtml: string) => {
    // ক্লিপবোর্ডে ফরম্যাট-সহ HTML + প্লেইন উভয়ই
    try {
      void navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([plainHtml], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ]);
    } catch {
      void navigator.clipboard.writeText(text);
    }
    toast.success(tt('thesis.cite.copied'));
  };

  const chipCls = (on: boolean) => cn('thesis-chip', on && 'thesis-chip-on');

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="thesis-dialog max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="ai-set-head">
          <DialogTitle className="flex items-center gap-2">
            <span className="ai-head-tile" aria-hidden="true"><GraduationCap size={16} /></span>
            {tt('thesis.title')}
          </DialogTitle>
          <DialogDescription>{tt('thesis.desc')}</DialogDescription>
        </DialogHeader>

        {/* ট্যাব-বার */}
        <div className="ai-tabs" role="tablist" aria-label={tt('thesis.title')}>
          {([
            { id: 'build' as Tab, icon: GraduationCap, label: tt('thesis.tab.build') },
            { id: 'cite' as Tab, icon: BookMarked, label: tt('thesis.tab.cite') },
            { id: 'guide' as Tab, icon: ScrollText, label: tt('thesis.tab.guide') },
          ]).map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={cn('ai-tab', tab === t.id && 'ai-tab-on')}
              onClick={() => setTab(t.id)}
            >
              <t.icon size={14} aria-hidden="true" /> {t.label}
            </button>
          ))}
        </div>

        {/* ─── ট্যাব: নির্মাণ ─── */}
        {tab === 'build' ? (
          <section aria-label={tt('thesis.tab.build')} className="flex flex-col gap-3">
            {/* ভাষা */}
            <div>
              <p className="ai-field-label mb-1.5">{tt('thesis.lang')}</p>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.lang')}>
                {([
                  { id: 'bn' as ThesisLang, label: 'বাংলা' },
                  { id: 'en' as ThesisLang, label: 'English' },
                ]).map((o) => (
                  <button key={o.id} type="button" className={chipCls(lang === o.id)} onClick={() => setLang(o.id)} disabled={busy}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* স্তর + শৃঙ্খলা */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.level')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.level')}>
                  {([
                    { id: 'honours' as ThesisLevel, key: 'thesis.level.honours' },
                    { id: 'masters' as ThesisLevel, key: 'thesis.level.masters' },
                    { id: 'mphil' as ThesisLevel, key: 'thesis.level.mphil' },
                    { id: 'phd' as ThesisLevel, key: 'thesis.level.phd' },
                  ]).map((o) => (
                    <button key={o.id} type="button" className={chipCls(level === o.id)} onClick={() => setLevel(o.id)} disabled={busy}>
                      {tt(o.key)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.discipline')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.discipline')}>
                  {([
                    { id: 'science' as ThesisDiscipline, key: 'thesis.discipline.science' },
                    { id: 'arts' as ThesisDiscipline, key: 'thesis.discipline.arts' },
                    { id: 'business' as ThesisDiscipline, key: 'thesis.discipline.business' },
                  ]).map((o) => (
                    <button key={o.id} type="button" className={chipCls(discipline === o.id)} onClick={() => setDiscipline(o.id)} disabled={busy}>
                      {tt(o.key)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* মেটা তথ্য */}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="ai-field-label mb-1 block" htmlFor="th-title">{tt('thesis.fTitle')}</label>
                <Textarea id="th-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={tt('thesis.fTitle.ph')} className="min-h-[52px]" disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-univ">{tt('thesis.fUniv')}</label>
                <Input id="th-univ" value={university} onChange={(e) => setUniversity(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-dept">{tt('thesis.fDept')}</label>
                <Input id="th-dept" value={department} onChange={(e) => setDepartment(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-author">{tt('thesis.fAuthor')}</label>
                <Input id="th-author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-roll">{tt('thesis.fRoll')}</label>
                <Input id="th-roll" value={roll} onChange={(e) => setRoll(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-session">{tt('thesis.fSession')}</label>
                <Input id="th-session" value={session} onChange={(e) => setSession(e.target.value)} disabled={busy} />
              </div>
              <div>
                <label className="ai-field-label mb-1 block" htmlFor="th-sup">{tt('thesis.fSupervisor')}</label>
                <Input id="th-sup" value={supervisor} onChange={(e) => setSupervisor(e.target.value)} disabled={busy} />
              </div>
              <div className="sm:col-span-2">
                <label className="ai-field-label mb-1 block" htmlFor="th-degree">{tt('thesis.fDegree')}</label>
                <Input id="th-degree" value={degreeName} onChange={(e) => setDegreeName(e.target.value)} disabled={busy} />
              </div>
            </div>

            {/* কাঠামো-অপশন */}
            <div>
              <p className="ai-field-label mb-1.5">{tt('thesis.structure')}</p>
              <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2">
                {STRUCTURE.map((o) => (
                  <label key={o.id} className="ai-check">
                    <input
                      type="checkbox"
                      checked={opts[o.id] as boolean}
                      onChange={(e) => setOpts((prev) => ({ ...prev, [o.id]: e.target.checked }))}
                      disabled={busy}
                    />
                    {tt(o.key)}
                  </label>
                ))}
              </div>
              <label className="ai-check mt-2">
                <input
                  type="checkbox"
                  checked={opts.applyFormat}
                  onChange={(e) => setOpts((prev) => ({ ...prev, applyFormat: e.target.checked }))}
                  disabled={busy}
                />
                {tt('thesis.opt.applyFormat')}
              </label>
            </div>

            <div className="flex justify-end">
              <Button onClick={() => void generate()} disabled={busy} className="ai-insert-btn">
                {busy ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <Sparkles size={14} aria-hidden="true" />}
                {tt('thesis.generate')}
              </Button>
            </div>
          </section>
        ) : null}

        {/* ─── ট্যাব: সূত্র ─── */}
        {tab === 'cite' ? (
          <section aria-label={tt('thesis.tab.cite')} className="flex flex-col gap-3">
            <p className="ai-setup-desc">{tt('thesis.cite.desc')}</p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.cite.style')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.cite.style')}>
                  {(Object.keys(CITE_STYLE_NAMES) as CiteStyle[]).map((st) => (
                    <button key={st} type="button" className={chipCls(cite.style === st)} onClick={() => patchCite('style', st)} title={CITE_STYLE_NAMES[st].en}>
                      {CITE_STYLE_NAMES[st][lang === 'en' ? 'en' : 'bn']}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="ai-field-label mb-1.5">{tt('thesis.cite.type')}</p>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label={tt('thesis.cite.type')}>
                  {(Object.keys(CITE_TYPE_NAMES) as CiteType[]).map((ct) => (
                    <button key={ct} type="button" className={chipCls(cite.type === ct)} onClick={() => patchCite('type', ct)} title={CITE_TYPE_NAMES[ct].en}>
                      {CITE_TYPE_NAMES[ct][lang === 'en' ? 'en' : 'bn']}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {CITE_FIELDS.map((f) => (
                <div key={f.id}>
                  <label className="ai-field-label mb-1 block" htmlFor={`cite-${f.id}`}>{tt(f.key)}</label>
                  <Input id={`cite-${f.id}`} value={String(cite[f.id] ?? '')} onChange={(e) => patchCite(f.id, e.target.value)} placeholder={f.ph ? tt(f.ph) : undefined} />
                </div>
              ))}
            </div>

            {/* আউটপুট */}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <div className="thesis-out">
                <p className="thesis-out-label">{tt('thesis.cite.output')}</p>
                <p className="thesis-out-body" dangerouslySetInnerHTML={{ __html: refHtml || '—' }} />
              </div>
              <div className="thesis-out thesis-out-sm">
                <p className="thesis-out-label">{tt('thesis.cite.intext')}</p>
                <p className="thesis-out-body">{inText || '—'}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <Button variant="outline" size="sm" disabled={!citeValid} onClick={() => copyText(refHtml.replace(/<[^>]+>/g, ''), refHtml)}>
                <Copy size={13} aria-hidden="true" /> {tt('thesis.cite.copy')}
              </Button>
              <Button
                disabled={!citeValid}
                className="ai-insert-btn"
                onClick={() => {
                  if (!refHtml) return;
                  if (insertAtCursor(`<p>${refHtml}</p>`)) {
                    toast.success(tt('thesis.cite.insert'));
                    close();
                  }
                }}
              >
                <BadgeCheck size={14} aria-hidden="true" /> {tt('thesis.cite.insert')}
              </Button>
            </div>
          </section>
        ) : null}

        {/* ─── ট্যাব: গাইড ─── */}
        {tab === 'guide' ? (
          <section aria-label={tt('thesis.tab.guide')} className="flex flex-col gap-2">
            <p className="ai-result-title">
              <GraduationCap size={14} className="text-emerald-600" aria-hidden="true" />
              {tt('thesis.guide.title')}
            </p>
            <ul className="thesis-guide max-h-96 list-none space-y-2 overflow-y-auto pr-1">
              {GUIDE_ITEMS.map((g) => (
                <li key={g.key} className="thesis-guide-item">
                  <g.icon size={14} className="mt-0.5 shrink-0 opacity-70" aria-hidden="true" />
                  <span>{tt(g.key)}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
