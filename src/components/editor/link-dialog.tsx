/**
 * হাইপারলিংক ডায়ালগ — টেক্সট লিংক ও ছবির ক্লিকযোগ্য লিংক, দুটোরই এক ইন্টারফেস।
 *
 *  - টেক্সট লিংক: সিলেকশনে setLink (মার্ক) — PDF প্রিন্টে ক্লিকযোগ্য থাকে
 *  - ছবির লিংক: FramedImage নোডের linkHref/linkTarget অ্যাট্রিবিউট
 *
 * উভয়ই স্টোরেজ HTML-এ <a href> হিসেবে সেভ হয় — তাই প্রিন্ট-PDF (Chrome
 * "Save as PDF"), স্ট্যান্ডঅ্যালোন HTML ও DOCX এক্সপোর্টে লিংক জীবন্ত থাকে।
 */

'use client';

import { useEffect, useState } from 'react';
import { Link2, Trash2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { Editor } from '@tiptap/react';

export interface LinkDialogState {
  open: boolean;
  /** 'text' = সিলেকশনে মার্ক বসবে; 'image' = imagePos নোডে অ্যাট্রিবিউট বসবে */
  mode: 'text' | 'image';
  /** টার্গেট এডিটর (মেনু বন্ধ হওয়ার পরেও রেফারেন্স দরকার) */
  editor: Editor | null;
  /** image মোডে নোডের ProseMirror position */
  imagePos: number | null;
  /** আগে থেকে লিংক থাকলে সেটি (এডিট মোড) */
  initialHref: string;
  initialNewTab: boolean;
  initialText: string;
}

export const EMPTY_LINK_DIALOG: LinkDialogState = {
  open: false,
  mode: 'text',
  editor: null,
  imagePos: null,
  initialHref: '',
  initialNewTab: true,
  initialText: '',
};

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  // স্কিম না থাকলে https:// ধরে নেওয়া (তবে mailto:/tel:/#/relative ছাড়ুন)
  if (/^(https?:|mailto:|tel:|ftp:)/i.test(t) || t.startsWith('#') || t.startsWith('/')) return t;
  return `https://${t}`;
}

export function LinkDialog({ state, onClose }: {
  state: LinkDialogState;
  onClose: () => void;
}) {
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [newTab, setNewTab] = useState(true);
  const editor = state.editor;
  const isEdit = state.initialHref !== '';

  useEffect(() => {
    if (!state.open) return;
    setUrl(state.initialHref);
    setText(state.initialText);
    setNewTab(state.initialNewTab);
  }, [state.open, state.initialHref, state.initialNewTab, state.initialText]);

  const apply = () => {
    const href = normalizeUrl(url);
    if (!editor || editor.isDestroyed || !href) return;

    if (state.mode === 'image' && state.imagePos !== null) {
      const pos = state.imagePos;
      try {
        const node = editor.state.doc.nodeAt(pos);
        if (!node) throw new Error('node gone');
        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                linkHref: href,
                linkTarget: newTab ? '_blank' : null,
              });
            }
            return true;
          })
          .run();
      } catch {
        /* নোড মধ্যেই সরে গেলে নীরবে উপেক্ষা */
      }
      onClose();
      return;
    }

    // ── টেক্সট মোড ──
    const { empty, from, to } = editor.state.selection;
    const chain = editor.chain().focus();
    // সিলেকশন খালি + নতুন টেক্সট দেওয়া হলে → লেখাটা ঢুকিয়ে তার উপরে লিংক
    if (empty && text.trim()) {
      chain
        .insertContent(`<a href="${href.replace(/"/g, '&quot;')}"${newTab ? ' target="_blank" rel="noopener noreferrer"' : ''}>${text.replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] ?? c))}</a>`)
        .run();
      onClose();
      return;
    }
    chain.extendMarkRange('link').setLink({ href, target: newTab ? '_blank' : null }).run();
    void from; void to;
    onClose();
  };

  const removeLink = () => {
    if (!editor || editor.isDestroyed) return;
    if (state.mode === 'image' && state.imagePos !== null) {
      const pos = state.imagePos;
      try {
        const node = editor.state.doc.nodeAt(pos);
        if (!node) throw new Error('node gone');
        editor
          .chain()
          .focus()
          .command(({ tr, dispatch }) => {
            if (dispatch) {
              tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                linkHref: null,
                linkTarget: null,
              });
            }
            return true;
          })
          .run();
      } catch { /* উপেক্ষা */ }
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    onClose();
  };

  return (
    <Dialog open={state.open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 size={16} className="text-primary" aria-hidden="true" />
            {isEdit ? 'লিংক সম্পাদনা' : state.mode === 'image' ? 'ছবিতে লিংক যোগ করুন' : 'লিংক যোগ করুন'}
          </DialogTitle>
          <DialogDescription>
            {state.mode === 'image'
              ? 'ছবিতে ক্লিক করলে এই ওয়েবসাইটে যাবে — PDF ও HTML এক্সপোর্টেও কাজ করে।'
              : 'লেখায় ক্লিকযোগ্য লিংক বসবে — PDF প্রিন্টেও ক্লিকযোগ্য থাকে।'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="link-url" className="text-xs">ওয়েবসাইটের লিংক (URL)</Label>
            <Input
              id="link-url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); apply(); } }}
              placeholder="যেমন: www.example.com বা https://example.com/book"
              inputMode="url"
            />
          </div>

          {state.mode === 'text' && state.initialText === '' ? (
            <div className="space-y-1.5">
              <Label htmlFor="link-text" className="text-xs">
                প্রদর্শিত লেখা <span className="text-muted-foreground">(সিলেকশন খালি হলে)</span>
              </Label>
              <Input
                id="link-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="যেমন: আমাদের ওয়েবসাইট"
              />
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Switch id="link-newtab" checked={newTab} onCheckedChange={setNewTab} />
            <Label htmlFor="link-newtab" className="text-xs">নতুন ট্যাবে খুলুন</Label>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            টিপ: PDF বানাতে Export → Print / Save as PDF ব্যবহার করুন — Chrome-এর
            &ldquo;Save as PDF&rdquo;-এ লিংকগুলো ক্লিকযোগ্য থাকে।
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {isEdit ? (
            <Button variant="ghost" className="mr-auto gap-1.5 text-red-600 hover:text-red-600" onClick={removeLink}>
              <Trash2 size={14} aria-hidden="true" /> লিংক মুছুন
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>বাতিল</Button>
          <Button onClick={apply} disabled={!url.trim()}>
            {isEdit ? 'হালনাগাদ' : 'লিংক বসান'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
