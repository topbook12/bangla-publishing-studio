/**
 * দিন ১৪ — কমান্ড প্যালেট (Ctrl+K) — সব টুল এক জায়গায় খোঁজা ও চালানো।
 *
 *  - cmdk (shadcn Command) — ফাজি সার্চ, গ্রুপ-হেডার, কীবোর্ড-নেভিগেশন ফ্রি
 *  - গ্রুপ: টুলস (ডায়ালগ) · ফরম্যাট · পৃষ্ঠা · দেখুন · এক্সপোর্ট
 *  - প্রতিটি আইটেমে শর্টকাট-হিন্ট (যেগুলোর আসল হ্যান্ডলার আছে সেগুলো এখানেও চালায়)
 *  - সার্চ বাংলা/ইংরেজি কীওয়ার্ড দুটোতেই মেলে
 *  - Grand Ink টোকেন — ডায়ালগ শৈলী প্রচলিত ডায়ালগের সাথে মিলবে
 */

'use client';

import { useEffect, useMemo } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, BookOpen, Bookmark, Bot, Camera, Copy,
  Download, Eraser, FileDown, FilePlus2, FileText, FileImage, GraduationCap, Heading1, Heading2, Heading3,
  HelpCircle, Highlighter, History, Image as ImageIcon, Italic, Languages, LayoutTemplate, List, ListOrdered,
  ListTree, MessageSquareText, Moon, MoveVertical, PenTool, Printer, Quote, Redo2, Ruler, Save,
  Search, Settings2, Shapes, Sparkles, SpellCheck, SquareSplitVertical, Strikethrough, Subscript as SubIcon,
  Superscript as SupIcon, Sun, Trash2, Type, Underline as UnderlineIcon, Undo2, Wand2, ZoomIn, ZoomOut,
  type LucideIcon,
} from 'lucide-react';
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
  CommandSeparator, CommandShortcut,
} from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useEditorStore, flushSave } from '@/lib/store';
import { useUiStore, type DialogName } from '@/lib/ui-store';
import { t } from '@/lib/i18n';
import { runCommand } from '@/components/ribbon/ribbon-shell';
import { pageBreakOnEditor } from '@/components/editor/page-ops';
import { downloadHtmlBackup } from '@/lib/export-html';
import { exportProjectToDocx } from '@/lib/export-docx';
import { printDocument } from '@/lib/export-json';
import { toast } from 'sonner';

interface PaletteCommand {
  id: string;
  group: string;
  icon: LucideIcon;
  shortcut?: string;
  /** i18n কী + fallback */
  k: string;
  fb: string;
  /** ইংরেজি সার্চ-কীওয়ার্ড */
  kw: string;
  run: () => void;
}

const DIALOG_CMDS: Array<{ d: DialogName; icon: LucideIcon; k: string; fb: string; kw: string }> = [
  { d: 'questionPaper', icon: FileText, k: 'cp.qp', fb: 'প্রশ্নপত্র স্টুডিও…', kw: 'question paper exam' },
  { d: 'documentStudio', icon: LayoutTemplate, k: 'cp.ds', fb: 'ডকুমেন্ট স্টুডিও…', kw: 'document studio template design' },
  { d: 'thesis', icon: GraduationCap, k: 'cp.thesis', fb: 'থিসিস স্টুডিও…', kw: 'thesis dissertation' },
  { d: 'templates', icon: BookOpen, k: 'cp.bookTpl', fb: 'বই-টেমপ্লেট (ব্লুপ্রিন্ট)…', kw: 'book template blueprint' },
  { d: 'findReplace', icon: Search, k: 'cp.find', fb: 'খুঁজুন ও বদলান…', kw: 'find replace search', },
  { d: 'review', icon: SpellCheck, k: 'cp.spell', fb: 'বানান পরীক্ষা…', kw: 'spelling proofing bangla' },
  { d: 'accuracy', icon: Wand2, k: 'cp.accuracy', fb: 'AI নির্ভুলতা কেন্দ্র…', kw: 'accuracy ai verify' },
  { d: 'headerFooter', icon: Bookmark, k: 'cp.hf', fb: 'হেডার/ফুটার (মাস্টার)…', kw: 'header footer' },
  { d: 'cover', icon: FileImage, k: 'cp.cover', fb: 'কভার পেজ…', kw: 'cover page front' },
  { d: 'projects', icon: FilePlus2, k: 'cp.projects', fb: 'প্রজেক্টসমূহ…', kw: 'projects open' },
  { d: 'snapshots', icon: History, k: 'cp.snapshots', fb: 'সংস্করণ ইতিহাস…', kw: 'snapshots version history' },
  { d: 'assetStore', icon: ImageIcon, k: 'cp.assets', fb: 'অ্যাসেট স্টোর…', kw: 'asset store image library' },
  { d: 'vectorLib', icon: Shapes, k: 'cp.vectors', fb: 'ভেক্টর লাইব্রেরি…', kw: 'vector library svg science' },
  { d: 'sketchPad', icon: PenTool, k: 'cp.sketch', fb: 'স্কেচ প্যাড…', kw: 'sketch draw pad' },
  { d: 'aiVision', icon: Camera, k: 'cp.aiVision', fb: 'AI ভিশন…', kw: 'ai vision image ocr' },
  { d: 'aiSettings', icon: Settings2, k: 'cp.aiSettings', fb: 'AI সেটিংস (BYOK)…', kw: 'ai settings api key' },
  { d: 'krutiConverter', icon: Languages, k: 'cp.kruti', fb: 'কৃতি কনভার্টার…', kw: 'kruti dev unicode convert' },
  { d: 'help', icon: HelpCircle, k: 'cp.help', fb: 'সহায়িকা ও শর্টকাট…', kw: 'help guide shortcuts' },
];

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setOpen = useUiStore((s) => s.setPaletteOpen);
  const toggle = useUiStore((s) => s.togglePalette);

  // Ctrl+K — গ্লোবাল শর্টকাট (এডিটরের ভিতরেও কাজ করে — টিপট্যাপ এটি দখল করে না)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const runFormat = (fn: Parameters<typeof runCommand>[0]) => {
    setOpen(false);
    runCommand(fn);
  };

  const commands = useMemo<PaletteCommand[]>(() => {
    const st = () => useEditorStore.getState();
    const ui = () => useUiStore.getState();
    const doDocx = () => {
      const s = st();
      void exportProjectToDocx({ title: s.title, settings: s.settings, pages: s.pages })
        .then(() => toast.success(t('exp.toast.docx.done', 'DOCX ready')))
        .catch(() => toast.error(t('exp.toast.docx.fail', 'DOCX export failed')));
    };

    const list: PaletteCommand[] = [];

    // ── টুলস ──
    for (const c of DIALOG_CMDS) {
      list.push({
        id: `dialog-${c.d}`,
        group: 'cp.g.tools',
        icon: c.icon,
        k: c.k,
        fb: c.fb,
        kw: c.kw,
        shortcut: c.d === 'findReplace' ? 'Ctrl+F' : undefined,
        run: () => {
          setOpen(false);
          if (c.d === 'aiVision') ui().openAi('vision');
          else ui().open(c.d);
        },
      });
    }
    list.push({
      id: 'ai-chat',
      group: 'cp.g.tools',
      icon: MessageSquareText,
      k: 'cp.aiChat',
      fb: 'AI চ্যাট প্যানেল খুলুন',
      kw: 'ai chat assistant',
      run: () => { setOpen(false); ui().toggleAiChat(); },
    });

    // ── ফরম্যাট (active editor) ──
    const fmt = (
      id: string, icon: LucideIcon, k: string, fb: string, kw: string,
      fn: Parameters<typeof runCommand>[0], shortcut?: string,
    ) => list.push({ id, group: 'cp.g.format', icon, k, fb, kw, shortcut, run: () => runFormat(fn) });

    fmt('fmt-bold', Bold, 'cp.bold', 'বোল্ড', 'bold strong', (ed) => ed.chain().focus().toggleBold().run(), 'Ctrl+B');
    fmt('fmt-italic', Italic, 'cp.italic', 'ইটালিক', 'italic emphasize', (ed) => ed.chain().focus().toggleItalic().run(), 'Ctrl+I');
    fmt('fmt-underline', UnderlineIcon, 'cp.underline', 'আন্ডারলাইন', 'underline', (ed) => ed.chain().focus().toggleUnderline().run(), 'Ctrl+U');
    fmt('fmt-strike', Strikethrough, 'cp.strike', 'স্ট্রাইক', 'strike through', (ed) => ed.chain().focus().toggleStrike().run());
    fmt('fmt-sup', SupIcon, 'cp.sup', 'সুপারস্ক্রিপ্ট', 'superscript exponent', (ed) => ed.chain().focus().toggleSuperscript().run());
    fmt('fmt-sub', SubIcon, 'cp.sub', 'সাবস্ক্রিপ্ট', 'subscript', (ed) => ed.chain().focus().toggleSubscript().run());
    fmt('fmt-highlight', Highlighter, 'cp.hl', 'হাইলাইট', 'highlight marker', (ed) => ed.chain().focus().toggleHighlight().run());
    fmt('fmt-erase', Eraser, 'cp.clearFmt', 'ফরম্যাট মুছুন', 'clear format', (ed) => ed.chain().focus().unsetAllMarks().run());
    fmt('fmt-h1', Heading1, 'cp.h1', 'শিরোনাম ১', 'heading h1 title', (ed) => ed.chain().focus().toggleHeading({ level: 1 }).run());
    fmt('fmt-h2', Heading2, 'cp.h2', 'শিরোনাম ২', 'heading h2', (ed) => ed.chain().focus().toggleHeading({ level: 2 }).run());
    fmt('fmt-h3', Heading3, 'cp.h3', 'শিরোনাম ৩', 'heading h3', (ed) => ed.chain().focus().toggleHeading({ level: 3 }).run());
    fmt('fmt-left', AlignLeft, 'cp.alLeft', 'বামে সারিবদ্ধ', 'align left', (ed) => ed.chain().focus().setTextAlign('left').run());
    fmt('fmt-center', AlignCenter, 'cp.alCenter', 'মাঝে সারিবদ্ধ', 'align center', (ed) => ed.chain().focus().setTextAlign('center').run());
    fmt('fmt-right', AlignRight, 'cp.alRight', 'ডানে সারিবদ্ধ', 'align right', (ed) => ed.chain().focus().setTextAlign('right').run());
    fmt('fmt-justify', AlignJustify, 'cp.alJustify', 'দুই-পাশে সারিবদ্ধ', 'align justify', (ed) => ed.chain().focus().setTextAlign('justify').run());
    fmt('fmt-ul', List, 'cp.ul', 'বুলেট তালিকা', 'bullet list unordered', (ed) => ed.chain().focus().toggleBulletList().run());
    fmt('fmt-ol', ListOrdered, 'cp.ol', 'সংখ্যা তালিকা', 'number list ordered', (ed) => ed.chain().focus().toggleOrderedList().run());
    fmt('fmt-quote', Quote, 'cp.quote', 'উদ্ধৃতি', 'quote blockquote', (ed) => ed.chain().focus().toggleBlockquote().run());
    fmt('fmt-break', MoveVertical, 'cp.pgbreak', 'পেজ ব্রেক', 'page break split', (ed) => {
      const pid = useEditorStore.getState().activePageId;
      if (pid) pageBreakOnEditor(ed, pid);
    }, 'Ctrl+Enter');

    // ── পৃষ্ঠা ──
    const page = (id: string, icon: LucideIcon, k: string, fb: string, kw: string, run: () => void, shortcut?: string) =>
      list.push({ id, group: 'cp.g.page', icon, k, fb, kw, shortcut, run: () => { setOpen(false); run(); } });

    page('pg-new', FilePlus2, 'cp.pgNew', 'নতুন পাতা যোগ করুন', 'add new page', () => {
      const id2 = st().addPage(null);
      st().setActivePage(id2);
    });
    page('pg-dup', Copy, 'cp.pgDup', 'চলতি পাতা ডুপ্লিকেট', 'duplicate page', () => {
      const pid = st().activePageId;
      if (pid) st().duplicatePage(pid);
    });
    page('pg-del', Trash2, 'cp.pgDel', 'চলতি পাতা মুছুন', 'delete page', () => {
      const pid = st().activePageId;
      if (pid) st().deletePage(pid);
    });
    page('pg-up', Undo2, 'cp.pgUp', 'পাতা উপরে সরান', 'move page up', () => {
      const pid = st().activePageId;
      if (pid) st().movePage(pid, -1);
    }, 'Alt+↑');
    page('pg-down', Redo2, 'cp.pgDown', 'পাতা নিচে সরান', 'move page down', () => {
      const pid = st().activePageId;
      if (pid) st().movePage(pid, 1);
    }, 'Alt+↓');
    page('pg-flow', SquareSplitVertical, 'cp.smartFlow', 'স্মার্ট-ফ্লো (সব পাতা পুনর্বিন্যাস)', 'smart flow reflow', () => {
      void import('@/components/editor/page-ops').then((m) => m.smartFlowWholeBook());
    });
    page('pg-rmempty', Eraser, 'cp.rmEmpty', 'ফাঁকা পাতা সরান', 'remove empty pages', () => {
      void import('@/components/editor/page-ops').then((m) => m.removeEmptyPages());
    });

    // ── দেখুন ──
    page('view-zoom-in', ZoomIn, 'cp.zoomIn', 'জুম বাড়ান', 'zoom in', () => { st().setZoom(Math.min(2, st().zoom + 0.1)); }, 'Ctrl+Wheel');
    page('view-zoom-out', ZoomOut, 'cp.zoomOut', 'জুম কমান', 'zoom out', () => { st().setZoom(Math.max(0.35, st().zoom - 0.1)); }, 'Ctrl+Wheel');
    page('view-navigator', ListTree, 'cp.navigator', 'নেভিগেটর (আউটলাইন/পাতা) টগল', 'navigator outline thumbnails', () => ui().toggleNavigator());
    page('view-focus', Type, 'cp.focusMode', 'ফোকাস মোড টগল', 'focus mode distraction', () => ui().toggleFocusMode(), 'Ctrl+Shift+F');
    page('view-ruler', Ruler, 'cp.ruler', 'রুলার দেখান/লুকান', 'ruler', () => ui().toggleRuler());
    page('view-theme', Moon, 'cp.theme', 'ডার্ক/লাইট থিম বদলান', 'dark light theme', () => {
      const el = document.documentElement;
      const dark = el.classList.toggle('dark');
      try { window.localStorage.setItem('bwp-theme', dark ? 'dark' : 'light'); } catch { /* ignore */ }
    });

    // ── সংরক্ষণ ও এক্সপোর্ট ──
    page('exp-print', Printer, 'cp.print', 'প্রিন্ট / PDF হিসেবে সেভ', 'print pdf', () => {
      void printDocument(undefined, st().title);
    }, 'Ctrl+P');
    page('exp-docx', FileDown, 'cp.docx', 'DOCX ডাউনলোড', 'docx word download', doDocx);
    page('exp-html', FileDown, 'cp.html', 'স্বয়ংসম্পূর্ণ HTML ডাউনলোড', 'html download', () => {
      const s = st();
      downloadHtmlBackup(s.title, s.settings, s.pages);
    });
    page('exp-save', Save, 'cp.save', 'এখনই সংরক্ষণ করুন', 'save flush', () => {
      void flushSave().then(() => toast.success(t('ws.toast.saved', 'Saved')));
    }, 'Ctrl+S');

    return list;
  }, [setOpen]);

  // চলতি ভাষায় লেবেল — প্যালেট খোলা অবস্থায় ভাষা বদলালেও রি-রেন্ডার হয়
  const groups = useMemo(() => {
    const map = new Map<string, PaletteCommand[]>();
    for (const c of commands) {
      const arr = map.get(c.group) ?? [];
      arr.push(c);
      map.set(c.group, arr);
    }
    return map;
  }, [commands]);

  // ভাষা-নির্ভর লেবেল প্রতি খোলায় হিসাব
  const label = (c: PaletteCommand) => t(c.k, c.fb);
  const groupLabel = (g: string) =>
    t(g, g === 'cp.g.tools' ? 'টুলস' : g === 'cp.g.format' ? 'ফরম্যাট' : g === 'cp.g.page' ? 'পৃষ্ঠা' : g === 'cp.g.view' ? 'দেখুন' : 'সংরক্ষণ ও এক্সপোর্ট');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogHeader className="sr-only">
        <DialogTitle>{t('cp.title', 'কমান্ড প্যালেট')}</DialogTitle>
        <DialogDescription>{t('cp.desc', 'সব টুল ও কমান্ড এক জায়গায় — লিখে খুঁজুন')}</DialogDescription>
      </DialogHeader>
      <DialogContent className="overflow-hidden p-0 top-[18%] translate-y-0 sm:top-[18%]">
        <Command
          className="bg-popover text-popover-foreground flex h-full w-full flex-col overflow-hidden rounded-md"
          filter={(value, search) => {
            // সার্চে i18n লেবেল + ইংরেজি কীওয়ার্ড দুটোই ধরে — বাংলা/English দুটোতেই মেলে
            const c = commands.find((x) => x.id === value);
            if (!c) return 0;
            const hay = `${label(c)} ${c.kw} ${c.id}`.toLowerCase();
            const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
            return terms.every((term) => hay.includes(term)) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={t('cp.placeholder', 'কমান্ড খুঁজুন… (যেমন: টেবিল, প্রশ্নপত্র, প্রিন্ট)')} />
          <CommandList className="max-h-[420px]">
            <CommandEmpty>{t('cp.empty', 'কিছু মেলেনি — অন্য শব্দে খুঁজুন')}</CommandEmpty>
            {[...groups.entries()].map(([g, items], gi) => (
              <div key={g}>
                {gi > 0 ? <CommandSeparator /> : null}
                <CommandGroup heading={groupLabel(g)}>
                  {items.map((c) => {
                    const Icon = c.icon;
                    return (
                      <CommandItem
                        key={c.id}
                        value={c.id}
                        onSelect={() => c.run()}
                        className="gap-2.5"
                      >
                        <Icon size={15} aria-hidden="true" className="shrink-0 text-primary" />
                        <span className="flex-1 truncate">{label(c)}</span>
                        {c.shortcut ? <CommandShortcut>{c.shortcut}</CommandShortcut> : null}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </div>
            ))}
            <CommandSeparator />
            <div className="px-3 py-2 text-[11px] text-muted-foreground">
              {t('cp.hint', 'Ctrl+K — যেকোনো সময় খুলুন · ↑↓ নেভিগেট · Enter চালান')}
            </div>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
