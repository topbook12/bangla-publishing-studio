/**
 * Kruti Dev ↔ Unicode কনভার্টার ডায়ালগ
 * ─────────────────────────────────────
 * হিন্দি DTP ইন্ডাস্ট্রির legacy ফরম্যাট (Kruti Dev 010/DevLys — Remington Gail টাইপিং)
 * ইউনিকোডে আনে ও ফেরত যায়। রূপান্তর ইঞ্জিন: src/lib/kruti.ts (২৬ টেস্ট-ভেরিফাইড)।
 *
 * প্রিমিয়াম টাচ: ইনপুট বক্সটি আসল Kruti Dev 010 ফন্টেই রেন্ডার হয় — ব্যবহারকারী
 * নিজের চোখে ASCII-টেক্সট থেকে দেবনাগরী রূপান্তর যাচাই করতে পারেন।
 */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeftRight, ClipboardCopy, Eraser, FileInput, Replace } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useUiStore } from '@/lib/ui-store';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import { convertKruti, KRUTI_SAMPLE, type KrutiDirection } from '@/lib/kruti';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const KRUTI_FONT = "'Kruti Dev 010', 'DevLys 010', monospace";
const UNICODE_FONT = "'Noto Sans Devanagari', 'Mangal', sans-serif";

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function KrutiConverterDialog() {
  const open = useUiStore((s) => s.openDialog === 'krutiConverter');
  const close = useUiStore((s) => s.close);
  const tt = useT();

  const [dir, setDir] = useState<KrutiDirection>('kruti2uni');
  const [input, setInput] = useState('');
  const lastFocusRef = useRef<HTMLTextAreaElement | null>(null);

  // খোলার সময় ইনপুট ফোকাস (টাইমারে ডিফার — cascading render এড়াতে)
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => lastFocusRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  // লাইভ রূপান্তর — ইঞ্জিন যথেষ্ট দ্রুত (২৪১-রুল পাস), ডিবাউন্সের দরকার নেই
  const output = useMemo(() => (input.trim() ? convertKruti(input, dir) : ''), [input, dir]);

  const isK2U = dir === 'kruti2uni';
  const inputFont = isK2U ? KRUTI_FONT : UNICODE_FONT;
  const outputFont = isK2U ? UNICODE_FONT : KRUTI_FONT;

  const loadSample = () => {
    setDir('kruti2uni');
    setInput(KRUTI_SAMPLE);
  };

  const copyOut = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      toast.success(tt('kruti.copied'));
    } catch {
      // প্রাইভেট মোড — পুরনো execCommand fallback
      lastFocusRef.current?.blur();
      const ta = document.createElement('textarea');
      ta.value = output;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      toast.success(tt('kruti.copied'));
    }
  };

  const insertOut = () => {
    if (!output) return;
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (!ed || ed.isDestroyed) {
      toast.error(tt('kruti.noEditor'));
      return;
    }
    const html = output
      .split('\n')
      .map((line) => `<p>${escapeHtml(line) || '<br>'}</p>`)
      .join('');
    ed.chain().focus().insertContent(html).run();
    toast.success(tt('kruti.inserted'));
    close();
  };

  const dirButton = (d: KrutiDirection, label: string) => (
    <button
      key={d}
      type="button"
      aria-pressed={dir === d}
      onClick={() => setDir(d)}
      className={cn(
        'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
        dir === d ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
      )}
    >
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="kruti-dialog max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Replace size={17} className="text-primary" />
            {tt('kruti.title')}
          </DialogTitle>
          <DialogDescription>{tt('kruti.desc')}</DialogDescription>
        </DialogHeader>

        {/* দিক নির্বাচক — segmented control */}
        <div className="flex items-center gap-2">
          <div className="grid flex-1 grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="group" aria-label={tt('kruti.title')}>
            {dirButton('kruti2uni', tt('kruti.dir.k2u'))}
            {dirButton('uni2kruti', tt('kruti.dir.u2k'))}
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={loadSample}>
            <FileInput size={14} /> {tt('kruti.sample')}
          </Button>
        </div>

        {/* দুই প্যান — মোবাইলে স্তূপ */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="kruti-input" className="text-xs font-medium text-muted-foreground">
              {isK2U ? tt('kruti.input') : tt('kruti.inputUni')}
            </label>
            <textarea
              id="kruti-input"
              ref={lastFocusRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              className="kruti-box h-44 w-full resize-y rounded-lg border border-input bg-background p-3 text-[15px] leading-relaxed outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/30 md:h-52"
              style={{ fontFamily: inputFont }}
              placeholder={isK2U ? KRUTI_SAMPLE : 'हिन्दी में लिखें…'}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <label htmlFor="kruti-output" className="text-xs font-medium text-muted-foreground">
              {isK2U ? tt('kruti.output') : tt('kruti.outputKruti')}
            </label>
            <textarea
              id="kruti-output"
              readOnly
              value={output}
              spellCheck={false}
              className="kruti-box h-44 w-full cursor-text resize-y rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-[15px] leading-relaxed outline-none md:h-52"
              style={{ fontFamily: outputFont }}
              placeholder={tt('kruti.emptyOut')}
            />
          </div>
        </div>

        {/* অ্যাকশন বার */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => { setInput(''); }}>
            <Eraser size={14} /> {tt('kruti.clear')}
          </Button>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" disabled={!output} onClick={() => void copyOut()}>
              <ClipboardCopy size={14} /> {tt('kruti.copy')}
            </Button>
            <Button size="sm" className="gap-1.5" disabled={!output} onClick={insertOut}>
              <ArrowLeftRight size={14} /> {tt('kruti.insert')}
            </Button>
          </div>
        </div>

        <p className="rounded-lg bg-muted/60 p-3 text-xs leading-relaxed text-muted-foreground">
          {tt('kruti.help')}
        </p>
      </DialogContent>
    </Dialog>
  );
}
