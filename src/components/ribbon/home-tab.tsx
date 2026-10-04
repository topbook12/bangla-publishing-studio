/**
 * Home tab — font, paragraph, style controls
 */

'use client';

import { Fragment, useEffect, useState } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, CaseSensitive, ChevronsDown, ChevronsUp, Eraser,
  Highlighter, Info, Italic, List, ListOrdered, Paintbrush, Palette, Quote, Strikethrough,
  Subscript as SubIcon, Superscript as SupIcon, Underline as UnderlineIcon,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RibbonButton, RibbonDivider, RibbonGroup, refocusActiveEditor, reapplyFontMark, runCommand, useActiveEditor } from './ribbon-shell';
import { AdvancedTextGroup } from './advanced-text';
import { FONT_OPTIONS, FONT_SIZE_OPTIONS, COLOR_SWATCHES, HIGHLIGHT_SWATCHES, bareFontFamily, fontStackOf, quoteFontFamily } from '@/lib/paper';
import { useFmtNum, useLangStore, useT } from '@/lib/i18n';
import {
  captureFormat, disarmPainter, isPainterArmed, subscribePainter,
} from '@/lib/format-painter';
import {
  banglaToEnglishDigits, englishToBanglaDigits, toLower, toTitle, toUpper,
  toggleDropCap, transformSelection,
} from '@/lib/text-transform';
import { useEditorStore } from '@/lib/store';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function FontFamilySelect() {
  const ed = useActiveEditor();
  const tt = useT();
  const lang = useLangStore((s) => s.lang);
  const attrs = ed?.getAttributes('textStyle');
  const current = attrs?.fontFamily ? bareFontFamily(attrs.fontFamily as string) : '';
  const [open, setOpen] = useState(false);
  const groupKeys: Record<string, string> = {
    bangla: 'home.fontgroup.bangla',
    devanagari: 'home.fontgroup.devanagari',
    'hindi-legacy': 'home.fontgroup.hindilegacy',
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-select w-44" title={tt('home.font')} style={{ fontFamily: current ? fontStackOf(current) : undefined }}>
          <span className="truncate">{current || tt('home.font')}</span>
          <span aria-hidden="true">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-[24rem] w-72 overflow-y-auto"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        {/* বাংলা → দেবনাগরী (ইউনিকোড) → হিন্দি লিগ্যাসি ক্রমে গ্রুপ-শিরোনাম */}
        {FONT_OPTIONS.map((f, i) => {
          const prev = FONT_OPTIONS[i - 1];
          const showGroup = Boolean(f.group && f.group !== prev?.group);
          return (
            <Fragment key={f.family}>
              {showGroup && f.group ? (
                <div
                  className="flex items-center gap-1 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-1"
                  role="presentation"
                  title={f.group === 'hindi-legacy' ? tt('home.legacy.tip') : undefined}
                >
                  <span className="truncate">{tt(groupKeys[f.group])}</span>
                  {f.group === 'hindi-legacy' ? <Info className="h-3 w-3 shrink-0 opacity-60" aria-hidden="true" /> : null}
                </div>
              ) : null}
              <DropdownMenuItem
                style={{ fontFamily: f.stack }}
                className={cn('gap-2', current === f.family && 'bg-accent')}
                title={f.legacy ? tt('home.legacy.tip') : undefined}
                onClick={() => {
                  const val = quoteFontFamily(f.family);
                  runCommand((ed2) => ed2.chain().focus().setFontFamily(val).run());
                  // TipTap-এর async focus storedMarks মুছে দিতে পারে — ফোকাস স্থির হওয়ার পর আবার বসাই
                  reapplyFontMark(val);
                }}
              >
                <span className="truncate">{f.name}</span>
                {f.note ? (
                  <span className="ml-auto shrink-0 text-[10px] font-normal text-muted-foreground/70">
                    {f.note[lang]}
                  </span>
                ) : null}
              </DropdownMenuItem>
            </Fragment>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FontSizeSelect() {
  const ed = useActiveEditor();
  const tt = useT();
  const fmtN = useFmtNum();
  const attrs = ed?.getAttributes('textStyle');
  const sizeStr = attrs?.fontSize as string | undefined;
  const current = sizeStr ? Math.round(parseFloat(sizeStr)) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-select w-20 justify-center" title={tt('home.fontsize')}>
          {current ? fmtN(current) : tt('home.size')} <span aria-hidden="true">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="max-h-80 overflow-y-auto"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        {FONT_SIZE_OPTIONS.map((size) => (
          <DropdownMenuItem
            key={size}
            className={cn(current === size && 'bg-accent')}
            onClick={() => runCommand((ed2) => ed2.chain().focus().setFontSize(`${size}pt`).run())}
          >
            {fmtN(size)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColorPicker() {
  const tt = useT();
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label={tt('home.color.tip')}>
              <Palette size={16} />
              <span className="ribbon-btn-label">{tt('home.color')}</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('home.color.tip')}</TooltipContent>
      </Tooltip>
      <PopoverContent
        className="w-60 p-3"
        align="start"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <p className="mb-2 text-xs font-semibold text-muted-foreground">{tt('home.color.text')}</p>
        <div className="grid grid-cols-7 gap-1.5">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`${tt('home.color')} ${c}`}
              className="h-6 w-6 rounded-md border border-black/10 transition hover:scale-110"
              style={{ backgroundColor: c }}
              onClick={() => { runCommand((ed) => ed.chain().focus().setColor(c).run()); setOpen(false); }}
            />
          ))}
        </div>
        <p className="mb-2 mt-3 text-xs font-semibold text-muted-foreground">{tt('home.highlighter')}</p>
        <div className="grid grid-cols-5 gap-1.5">
          {HIGHLIGHT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`${tt('home.highlight')} ${c}`}
              className="h-6 w-6 rounded-md border border-black/10 transition hover:scale-110"
              style={{ backgroundColor: c }}
              onClick={() => { runCommand((ed) => ed.chain().focus().setHighlight({ color: c }).run()); setOpen(false); }}
            />
          ))}
        </div>
        <button
          type="button"
          className="mt-3 text-xs text-red-600 hover:underline"
          onClick={() => { runCommand((ed) => ed.chain().focus().unsetColor().unsetHighlight().run()); setOpen(false); }}
        >
          {tt('home.color.clear')}
        </button>
      </PopoverContent>
    </Popover>
  );
}

function LineHeightSelect() {
  const ed = useActiveEditor();
  const tt = useT();
  const fmtN = useFmtNum();
  const defaultLineHeight = useEditorStore((s) => s.settings.lineHeight);
  const options = ['1', '1.15', '1.3', '1.5', '1.75', '2', '2.5'];
  // ট্রিগারে সিলেকশনের বর্তমান লাইন-হাইট দেখাই — হেডিংয়ের ভিতরে থাকলে heading-এর
  // অ্যাট্রিবিউট থেকে (আগে শুধু paragraph পড়ত, তাই হেডিংয়ে সবসময় ডিফল্ট দেখাত)
  const current = (() => {
    if (!ed || ed.isDestroyed) return null;
    try {
      const inHeading = ed.state.selection.$from.parent.type.name === 'heading';
      const lh = ed.getAttributes(inHeading ? 'heading' : 'paragraph').lineHeight as string | number | undefined;
      return lh !== undefined && lh !== null ? String(lh) : null;
    } catch { return null; }
  })();
  const shown = current ?? String(defaultLineHeight);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-select w-16 justify-center" title={tt('home.lineheight')}>
          {fmtN(shown)}▾
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        {options.map((v) => (
          <DropdownMenuItem key={v} onClick={() => runCommand((ed2) => ed2.chain().focus().setLineHeight(v).run())}>
            {fmtN(v)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => runCommand((ed2) => ed2.chain().focus().unsetLineHeight().run())}>
          {tt('home.lineheight.default')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * ফরম্যাট পেইন্টার — MS Word-এর মতো ফরম্যাট কপি → সিলেকশনে পেস্ট।
 * অ্যাম/ডিসআর্ম মডিউল-স্টেট (কীবোর্ড শর্টকাট Ctrl+Alt+C থেকেও হয়) —
 * subscribePainter দিয়ে বাটনের active স্টেট রি-রেন্ডার করাই।
 */
function FormatPainterButton() {
  const tt = useT();
  const [, bump] = useState(0);
  useEffect(() => subscribePainter(() => bump((v) => v + 1)), []);

  return (
    <RibbonButton
      icon={Paintbrush}
      label={tt('home.formatpainter')}
      shortcut="Ctrl+Alt+C"
      title={tt('home.formatpainter.tip')}
      active={isPainterArmed()}
      onClick={() => {
        if (isPainterArmed()) {
          disarmPainter();
          return;
        }
        runCommand((ed) => {
          captureFormat(ed);
          toast.info(tt('home.formatpainter.copied'));
        });
      }}
    />
  );
}

/**
 * Text Tools ড্রপডাউন — কেস রূপান্তর, বাংলা↔ইংরেজি সংখ্যা, ড্রপ ক্যাপ।
 * সব রূপান্তর মার্ক সংরক্ষণ করে (transformSelection)।
 */
function TextToolsMenu() {
  const ed = useActiveEditor();
  const tt = useT();
  const runTransform = (fn: (s: string) => string) => {
    runCommand((ed2) => {
      if (!transformSelection(ed2, fn)) toast.info(tt('home.texttools.noselection'));
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-btn" aria-label={tt('home.texttools')} title={tt('home.texttools.tip')}>
          <CaseSensitive size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{tt('home.texttools')}</span>
          <span aria-hidden="true" className="text-[10px] opacity-60">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-72"
        onCloseAutoFocus={(e) => { e.preventDefault(); refocusActiveEditor(); }}
      >
        <DropdownMenuItem onClick={() => runTransform(banglaToEnglishDigits)}>
          {tt('home.texttools.bn2en')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => runTransform(englishToBanglaDigits)}>
          {tt('home.texttools.en2bn')}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => runTransform(toUpper)}>{tt('home.texttools.upper')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => runTransform(toLower)}>{tt('home.texttools.lower')}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => runTransform(toTitle)}>{tt('home.texttools.titlecase')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className={cn(Boolean(ed && !ed.isDestroyed && ed.isActive('dropCap')) && 'bg-accent')}
          onClick={() => runCommand((ed2) => {
            if (!toggleDropCap(ed2)) toast.info(tt('home.texttools.dropcap.need'));
          })}
        >
          {tt('home.texttools.dropcap')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HomeTab() {
  const ed = useActiveEditor();
  const tt = useT();

  const cmd = (fn: (editor: NonNullable<typeof ed>) => unknown) => runCommand(fn);
  const isActive = (fn: (editor: NonNullable<typeof ed>) => boolean): boolean => {
    if (!ed || ed.isDestroyed) return false;
    try { return Boolean(fn(ed)); } catch { return false; }
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label={tt('home.group.font')} accent="font">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <FontFamilySelect />
            <FontSizeSelect />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={Bold} label={tt('home.bold')} shortcut="Ctrl+B" active={isActive((e) => e.isActive('bold'))} onClick={() => cmd((e) => e.chain().focus().toggleBold().run())} />
            <RibbonButton icon={Italic} label={tt('home.italic')} shortcut="Ctrl+I" active={isActive((e) => e.isActive('italic'))} onClick={() => cmd((e) => e.chain().focus().toggleItalic().run())} />
            <RibbonButton icon={UnderlineIcon} label={tt('home.underline')} shortcut="Ctrl+U" active={isActive((e) => e.isActive('underline'))} onClick={() => cmd((e) => e.chain().focus().toggleUnderline().run())} />
            <RibbonButton icon={Strikethrough} label={tt('home.strike')} shortcut="Ctrl+Shift+X" active={isActive((e) => e.isActive('strike'))} onClick={() => cmd((e) => e.chain().focus().toggleStrike().run())} />
            <RibbonButton icon={SupIcon} label={tt('home.sup')} shortcut="Ctrl+." active={isActive((e) => e.isActive('superscript'))} onClick={() => cmd((e) => e.chain().focus().toggleSuperscript().run())} />
            <RibbonButton icon={SubIcon} label={tt('home.sub')} shortcut="Ctrl+," active={isActive((e) => e.isActive('subscript'))} onClick={() => cmd((e) => e.chain().focus().toggleSubscript().run())} />
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          <ColorPicker />
          <RibbonButton icon={Highlighter} label={tt('home.highlight')} shortcut="Ctrl+Shift+H" active={isActive((e) => e.isActive('highlight'))} onClick={() => cmd((e) => e.chain().focus().toggleHighlight({ color: '#fef08a' }).run())} />
          <RibbonButton icon={Eraser} label={tt('home.clearformat')} onClick={() => cmd((e) => e.chain().focus().unsetAllMarks().clearNodes().run())} />
          <FormatPainterButton />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label={tt('home.group.paragraph')} accent="paragraph">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={AlignLeft} label={tt('home.alignleft')} active={isActive((e) => e.isActive({ textAlign: 'left' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('left').run())} />
            <RibbonButton icon={AlignCenter} label={tt('home.center')} active={isActive((e) => e.isActive({ textAlign: 'center' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('center').run())} />
            <RibbonButton icon={AlignRight} label={tt('home.alignright')} active={isActive((e) => e.isActive({ textAlign: 'right' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('right').run())} />
            <RibbonButton icon={AlignJustify} label={tt('home.justify')} active={isActive((e) => e.isActive({ textAlign: 'justify' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('justify').run())} />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={List} label={tt('home.bullets')} active={isActive((e) => e.isActive('bulletList'))} onClick={() => cmd((e) => e.chain().focus().toggleBulletList().run())} />
            <RibbonButton icon={ListOrdered} label={tt('home.numbering')} active={isActive((e) => e.isActive('orderedList'))} onClick={() => cmd((e) => e.chain().focus().toggleOrderedList().run())} />
            <RibbonButton icon={Quote} label={tt('home.quote')} active={isActive((e) => e.isActive('blockquote'))} onClick={() => cmd((e) => e.chain().focus().toggleBlockquote().run())} />
            <LineHeightSelect />
            <RibbonButton icon={ChevronsUp} label={tt('home.moveup')} title={tt('home.moveup.tip')} shortcut="Alt+↑" onClick={() => cmd((e) => e.chain().focus().moveBlockUp().run())} />
            <RibbonButton icon={ChevronsDown} label={tt('home.movedown')} title={tt('home.movedown.tip')} shortcut="Alt+↓" onClick={() => cmd((e) => e.chain().focus().moveBlockDown().run())} />
            <TextToolsMenu />
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <AdvancedTextGroup />
      <RibbonDivider />
      <RibbonGroup label={tt('home.group.styles')} accent="styles">
        <div className="flex flex-col gap-1">
          <button type="button" className={cn('ribbon-heading ribbon-heading-h1', isActive((e) => e.isActive('heading', { level: 1 })) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().toggleHeading({ level: 1 }).run())}>{tt('home.h1')}</button>
          <div className="flex gap-1">
            <button type="button" className={cn('ribbon-heading ribbon-heading-h2', isActive((e) => e.isActive('heading', { level: 2 })) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().toggleHeading({ level: 2 }).run())}>{tt('home.h2')}</button>
            <button type="button" className={cn('ribbon-heading ribbon-heading-h3', isActive((e) => e.isActive('heading', { level: 3 })) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().toggleHeading({ level: 3 }).run())}>{tt('home.h3')}</button>
            <button type="button" className={cn('ribbon-heading', isActive((e) => e.isActive('paragraph')) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().setParagraph().run())}>{tt('home.normal')}</button>
          </div>
        </div>
      </RibbonGroup>
    </div>
  );
}
