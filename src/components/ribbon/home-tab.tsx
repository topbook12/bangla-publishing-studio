/**
 * Home tab — font, paragraph, style controls
 */

'use client';

import { useState } from 'react';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, Bold, ChevronsDown, ChevronsUp, Eraser,
  Highlighter, Italic, List, ListOrdered, Palette, Quote, Strikethrough,
  Subscript as SubIcon, Superscript as SupIcon, Underline as UnderlineIcon,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { RibbonButton, RibbonDivider, RibbonGroup, runCommand, useActiveEditor } from './ribbon-shell';
import { FONT_OPTIONS, FONT_SIZE_OPTIONS, COLOR_SWATCHES, HIGHLIGHT_SWATCHES, fontStackOf } from '@/lib/paper';
import { toBanglaNumber } from '@/lib/bangla';
import { cn } from '@/lib/utils';

function FontFamilySelect() {
  const ed = useActiveEditor();
  const attrs = ed?.getAttributes('textStyle');
  const current = (attrs?.fontFamily as string | undefined)?.split(',')[0]?.replace(/'/g, '') ?? '';
  const [open, setOpen] = useState(false);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-select w-40" title="Font" style={{ fontFamily: current ? fontStackOf(current) : undefined }}>
          <span className="truncate">{current || 'Font'}</span>
          <span aria-hidden="true">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-56 overflow-y-auto">
        {FONT_OPTIONS.map((f) => (
          <DropdownMenuItem
            key={f.family}
            style={{ fontFamily: f.stack }}
            className={cn(current === f.family && 'bg-accent')}
            onClick={() => runCommand((ed2) => ed2.chain().focus().setFontFamily(f.family).run())}
          >
            {f.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FontSizeSelect() {
  const ed = useActiveEditor();
  const attrs = ed?.getAttributes('textStyle');
  const sizeStr = attrs?.fontSize as string | undefined;
  const current = sizeStr ? Math.round(parseFloat(sizeStr)) : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-select w-20 justify-center" title="Font Size">
          {current ? toBanglaNumber(current) : 'Size'} <span aria-hidden="true">▾</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 overflow-y-auto">
        {FONT_SIZE_OPTIONS.map((size) => (
          <DropdownMenuItem
            key={size}
            className={cn(current === size && 'bg-accent')}
            onClick={() => runCommand((ed2) => ed2.chain().focus().setFontSize(`${size}pt`).run())}
          >
            {toBanglaNumber(size)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ColorPicker() {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button type="button" className="ribbon-btn" aria-label="Color & Highlight">
              <Palette size={16} />
              <span className="ribbon-btn-label">Color</span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Color & Highlight</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-60 p-3" align="start">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Text Color</p>
        <div className="grid grid-cols-7 gap-1.5">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              className="h-6 w-6 rounded-md border border-black/10 transition hover:scale-110"
              style={{ backgroundColor: c }}
              onClick={() => { runCommand((ed) => ed.chain().focus().setColor(c).run()); setOpen(false); }}
            />
          ))}
        </div>
        <p className="mb-2 mt-3 text-xs font-semibold text-muted-foreground">Highlighter</p>
        <div className="grid grid-cols-5 gap-1.5">
          {HIGHLIGHT_SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Highlight ${c}`}
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
          Clear color & highlight
        </button>
      </PopoverContent>
    </Popover>
  );
}

function LineHeightSelect() {
  const options = ['1', '1.15', '1.3', '1.5', '1.75', '2', '2.5'];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="ribbon-select w-16 justify-center" title="Line Height">
          1.0▾
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((v) => (
          <DropdownMenuItem key={v} onClick={() => runCommand((ed) => ed.chain().focus().setLineHeight(v).run())}>
            {toBanglaNumber(v)}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => runCommand((ed) => ed.chain().focus().unsetLineHeight().run())}>
          Default
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HomeTab() {
  const ed = useActiveEditor();

  const cmd = (fn: (editor: NonNullable<typeof ed>) => unknown) => runCommand(fn);
  const isActive = (fn: (editor: NonNullable<typeof ed>) => boolean): boolean => {
    if (!ed || ed.isDestroyed) return false;
    try { return Boolean(fn(ed)); } catch { return false; }
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label="Font">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <FontFamilySelect />
            <FontSizeSelect />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={Bold} label="Bold" shortcut="Ctrl+B" active={isActive((e) => e.isActive('bold'))} onClick={() => cmd((e) => e.chain().focus().toggleBold().run())} />
            <RibbonButton icon={Italic} label="Italic" shortcut="Ctrl+I" active={isActive((e) => e.isActive('italic'))} onClick={() => cmd((e) => e.chain().focus().toggleItalic().run())} />
            <RibbonButton icon={UnderlineIcon} label="Underline" shortcut="Ctrl+U" active={isActive((e) => e.isActive('underline'))} onClick={() => cmd((e) => e.chain().focus().toggleUnderline().run())} />
            <RibbonButton icon={Strikethrough} label="Strikethrough" shortcut="Ctrl+Shift+X" active={isActive((e) => e.isActive('strike'))} onClick={() => cmd((e) => e.chain().focus().toggleStrike().run())} />
            <RibbonButton icon={SupIcon} label="Superscript" shortcut="Ctrl+." active={isActive((e) => e.isActive('superscript'))} onClick={() => cmd((e) => e.chain().focus().toggleSuperscript().run())} />
            <RibbonButton icon={SubIcon} label="Subscript" shortcut="Ctrl+," active={isActive((e) => e.isActive('subscript'))} onClick={() => cmd((e) => e.chain().focus().toggleSubscript().run())} />
          </div>
        </div>
        <div className="mt-1 flex gap-1">
          <ColorPicker />
          <RibbonButton icon={Highlighter} label="Highlight" shortcut="Ctrl+Shift+H" active={isActive((e) => e.isActive('highlight'))} onClick={() => cmd((e) => e.chain().focus().toggleHighlight({ color: '#fef08a' }).run())} />
          <RibbonButton icon={Eraser} label="Clear Formatting" onClick={() => cmd((e) => e.chain().focus().unsetAllMarks().clearNodes().run())} />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Paragraph">
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <RibbonButton icon={AlignLeft} label="Align Left" active={isActive((e) => e.isActive({ textAlign: 'left' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('left').run())} />
            <RibbonButton icon={AlignCenter} label="Center" active={isActive((e) => e.isActive({ textAlign: 'center' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('center').run())} />
            <RibbonButton icon={AlignRight} label="Align Right" active={isActive((e) => e.isActive({ textAlign: 'right' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('right').run())} />
            <RibbonButton icon={AlignJustify} label="Justify" active={isActive((e) => e.isActive({ textAlign: 'justify' }))} onClick={() => cmd((e) => e.chain().focus().setTextAlign('justify').run())} />
          </div>
          <div className="flex gap-1">
            <RibbonButton icon={List} label="Bullets" active={isActive((e) => e.isActive('bulletList'))} onClick={() => cmd((e) => e.chain().focus().toggleBulletList().run())} />
            <RibbonButton icon={ListOrdered} label="Numbering" active={isActive((e) => e.isActive('orderedList'))} onClick={() => cmd((e) => e.chain().focus().toggleOrderedList().run())} />
            <RibbonButton icon={Quote} label="Quote" active={isActive((e) => e.isActive('blockquote'))} onClick={() => cmd((e) => e.chain().focus().toggleBlockquote().run())} />
            <LineHeightSelect />
            <RibbonButton icon={ChevronsUp} label="Move Up" title="টেবিল/বক্স/ছবি সহ পুরো ব্লক উপরে সরান" shortcut="Alt+↑" onClick={() => cmd((e) => e.chain().focus().moveBlockUp().run())} />
            <RibbonButton icon={ChevronsDown} label="Move Down" title="টেবিল/বক্স/ছবি সহ পুরো ব্লক নিচে সরান" shortcut="Alt+↓" onClick={() => cmd((e) => e.chain().focus().moveBlockDown().run())} />
          </div>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Styles">
        <div className="flex flex-col gap-1">
          <button type="button" className={cn('ribbon-heading ribbon-heading-h1', isActive((e) => e.isActive('heading', { level: 1 })) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().toggleHeading({ level: 1 }).run())}>Heading 1</button>
          <div className="flex gap-1">
            <button type="button" className={cn('ribbon-heading ribbon-heading-h2', isActive((e) => e.isActive('heading', { level: 2 })) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().toggleHeading({ level: 2 }).run())}>Heading 2</button>
            <button type="button" className={cn('ribbon-heading ribbon-heading-h3', isActive((e) => e.isActive('heading', { level: 3 })) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().toggleHeading({ level: 3 }).run())}>Heading 3</button>
            <button type="button" className={cn('ribbon-heading', isActive((e) => e.isActive('paragraph')) && 'ribbon-btn-active')} onClick={() => runCommand((e2) => e2.chain().focus().setParagraph().run())}>Normal Text</button>
          </div>
        </div>
      </RibbonGroup>
    </div>
  );
}
