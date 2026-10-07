/**
 * Ribbon toolbar shell — MS Word-style tabs + group primitives
 */

'use client';

import { memo, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, MotionConfig } from 'framer-motion';
import { ChevronDown, Redo2, Undo2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import type { RibbonTab } from '@/lib/types';
import { t, useT } from '@/lib/i18n';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HomeTab } from './home-tab';
import { InsertTab } from './insert-tab';
import { LayoutTab } from './layout-tab';
import { DesignTab } from './design-tab';
import { ReviewTab } from './review-tab';
import { ExportTab } from './export-tab';
import { AiTab } from './ai-tab';

/**
 * Decorative accent hue per ribbon group (consumed by globals.css for icon/label tints).
 * Purely presentational — mapped from the existing group label, no API change.
 */
const GROUP_ACCENTS: Record<string, string> = {
  history: 'amber',
  font: 'violet',
  paragraph: 'emerald',
  'advanced text': 'amber',
  styles: 'rose',
  'table tools': 'cyan',
  'tables & media': 'cyan',
  'icons & design': 'rose',
  'academic blocks': 'blue',
  'page & decor': 'fuchsia',
  'paper size': 'blue',
  'content flow': 'amber',
  'margins (in)': 'teal',
  'paper & border': 'emerald',
  'default typography': 'violet',
  'book themes': 'fuchsia',
  'header & footer': 'sky',
  'page numbers': 'teal',
  'cover & toc': 'amber',
  'page templates': 'rose',
  statistics: 'cyan',
  'spelling & proofing': 'sky',
  'conjunct toolkit': 'teal',
  settings: 'slate',
  'press-ready output': 'amber',
  'export file': 'emerald',
  'creative formats': 'violet',
  backup: 'slate',
  'ai vision': 'fuchsia',
  'ai writer': 'amber',
  'ai config': 'emerald',
};

const accentOf = (label: string): string => GROUP_ACCENTS[label.trim().toLowerCase()] ?? 'indigo';

/** Active editor instance that re-renders on selection/format changes */
export function useActiveEditor() {
  const selectionVersion = useEditorStore((s) => s.selectionVersion);
  const activePageId = useEditorStore((s) => s.activePageId);
  void selectionVersion;
  return getEditor(activePageId);
}

export const RIBBON_TABS: Array<{ id: RibbonTab; i18nKey: string; fallback: string }> = [
  { id: 'home', i18nKey: 'rb.tab.home', fallback: 'Home' },
  { id: 'insert', i18nKey: 'rb.tab.insert', fallback: 'Insert' },
  { id: 'layout', i18nKey: 'rb.tab.layout', fallback: 'Layout' },
  { id: 'design', i18nKey: 'rb.tab.design', fallback: 'Design' },
  { id: 'review', i18nKey: 'rb.tab.review', fallback: 'Review' },
  { id: 'ai', i18nKey: 'rb.tab.ai', fallback: 'AI' },
  { id: 'export', i18nKey: 'rb.tab.export', fallback: 'Export' },
];

/**
 * Ribbon group — label is translated by the caller; `accent` preserves the
 * decorative tint (GROUP_ACCENTS is keyed by the original English label).
 */
export function RibbonGroup({ label, accent, children, className }: { label: string; accent?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('ribbon-group no-print', className)} data-accent={accentOf(accent ?? label)}>
      <div className="ribbon-group-body">{children}</div>
      <div className="ribbon-group-label">{label}</div>
    </div>
  );
}

export function RibbonDivider() {
  return <div className="ribbon-divider" aria-hidden="true" />;
}

interface RibbonButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  /** Tooltip text (defaults to the label) */
  title?: string;
  /** Keyboard shortcut appended to the tooltip, e.g. "Ctrl+B" */
  shortcut?: string;
  danger?: boolean;
}

// React.memo — প্যারেন্ট ট্যাব রি-রেন্ডার হলেও props (icon/label/active/disabled)
// অপরিবর্তিত থাকলে বাটনের ভেতরের Tooltip ট্রি রি-রেন্ডার বাদ যায়
export const RibbonButton = memo(function RibbonButton({ icon: Icon, label, onClick, active, disabled, title, shortcut, danger }: RibbonButtonProps) {
  const tip = [title ?? label, shortcut].filter(Boolean).join(' · ');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'ribbon-btn',
            active && 'ribbon-btn-active',
            danger && 'ribbon-btn-danger',
          )}
        >
          <Icon size={16} aria-hidden="true" />
          <span className="ribbon-btn-label">{label}</span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tip}</TooltipContent>
    </Tooltip>
  );
});

/** Helper to run a command on the active editor — সফল হলে true, ব্যর্থ হলে false */
export function runCommand(fn: (editor: NonNullable<ReturnType<typeof getEditor>>) => void): boolean {
  const { activePageId, pages } = useEditorStore.getState();
  const editor = getEditor(activePageId);
  if (!editor || editor.isDestroyed) {
    const activePage = pages.find((p) => p.id === activePageId);
    if (activePage && activePage.kind !== 'normal') {
      // কভার পাতায় এডিটর নেই — নীরবে প্রথম মাউন্ট করা পাতায় ফরম্যাট চাপার বদলে স্পষ্ট বার্তা
      toast.info(t('rb.toast.cover'));
      return false;
    }
    // সক্রিয় পাতার এডিটর মাউন্ট নেই (দূরের পাতা) — ভুল পাতায় ফরম্যাট গেলে
    // ব্যবহারকারী বুঝতই না; স্পষ্ট বার্তা দেখাই
    toast.info(t('rb.toast.notopen'));
    return false;
  }
  editor.commands.focus();
  fn(editor);
  return true;
}

/**
 * Radix মেনু/পপওভার বন্ধ হলে নিজে থেকেই ট্রিগার বাটনে ফোকাস ফেরত যায় —
 * দুই ধাপে এডিটরে ফোকাস ফিরিয়ে আনি (insert-tab-এর refocusEditor-এর শেয়ার্ড
 * সংস্করণ)। নইলে ফন্ট/সাইজ/রং বাছাইয়ের পর টাইপ করা যায় না — ফোকাস রিবনে আটকে থাকে।
 */
export function refocusActiveEditor(): void {
  const tryFocus = () => {
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (ed && !ed.isDestroyed) {
      try { ed.commands.focus(); } catch { /* ধ্বংসপ্রাপ্ত এডিটর */ }
    }
  };
  window.setTimeout(tryFocus, 60);
  window.setTimeout(tryFocus, 320);
}

/**
 * ফন্ট-ফ্যামিলি মার্ক পুনঃপ্রয়োগ — TipTap-এর focus() অ্যাসিঙ্কভাবে view.focus() করে
 * (requestAnimationFrame), আর PM-এর DOM-ফোকাস সিঙ্ক ফোকাস-রিস্টোরের সময় storedMarks
 * রিসেট করে ফেলতে পারে। ফলে মেনু থেকে ফন্ট বাছাই করে সরাসরি টাইপ করলে ফন্ট প্রয়োগ
 * হতো না (হিন্দি Kruti Dev/DevLys ও বাংলা ফন্ট — সব ক্ষেত্রেই)। refocusActiveEditor-
 * এর ফোকাস-টাইমারগুলো শেষ হওয়ার পর আরেকবার মার্ক বসিয়ে দেই — MS Word-এর মতোই
 * "ফন্ট বাছাই → টাইপ" এখন কাজ করবে।
 */
export function reapplyFontMark(family: string): void {
  const apply = () => {
    const { activePageId } = useEditorStore.getState();
    const ed = getEditor(activePageId);
    if (ed && !ed.isDestroyed) {
      try { ed.commands.setFontFamily(family); } catch { /* ধ্বংসপ্রাপ্ত এডিটর */ }
    }
  };
  window.setTimeout(apply, 90);
  window.setTimeout(apply, 400);
}

/**
 * Quick Access Toolbar — Undo/Redo সব রিবন ট্যাবে সবসময় দৃশ্যমান
 * (ট্যাব কলাপ্সড থাকলেও)। MS Word-এর QAT-এর মতোই ট্যাবস্ট্রিপের বাঁয়ে বসে।
 */
function QuickAccess() {
  const tt = useT();
  const ed = useActiveEditor();
  const alive = !!ed && !ed.isDestroyed;
  const canUndo = alive && (() => { try { return ed.can().undo(); } catch { return false; } })();
  const canRedo = alive && (() => { try { return ed.can().redo(); } catch { return false; } })();

  const run = (fn: (editor: NonNullable<typeof ed>) => void) => {
    const { activePageId } = useEditorStore.getState();
    const editor = getEditor(activePageId) ?? ed;
    if (editor && !editor.isDestroyed) fn(editor);
  };

  return (
    <div className="ribbon-qat" role="toolbar" aria-label={tt('rb.qat')}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ribbon-qat-btn"
            aria-label={tt('rb.undo')}
            disabled={!canUndo}
            onClick={() => run((e) => e.chain().focus().undo().run())}
          >
            <Undo2 size={15} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('rb.undo')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="ribbon-qat-btn"
            aria-label={tt('rb.redo')}
            disabled={!canRedo}
            onClick={() => run((e) => e.chain().focus().redo().run())}
          >
            <Redo2 size={15} aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{tt('rb.redo')}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export function Ribbon() {
  const tt = useT();
  const activeTab = useEditorStore((s) => s.activeRibbonTab);
  const setTab = useEditorStore((s) => s.setRibbonTab);
  const [collapsed, setCollapsed] = useState(false);

  // Word-like behavior: picking a tab while the ribbon is collapsed expands it again
  const selectTab = (id: RibbonTab) => {
    setTab(id);
    if (collapsed) setCollapsed(false);
  };

  return (
    <div className="ribbon no-print" role="toolbar" aria-label={tt('rb.toolbar')}>
      <div className="ribbon-tabstrip">
        <QuickAccess />
        <nav className="ribbon-tabs" role="tablist" aria-label={tt('rb.tabs')}>
          <MotionConfig reducedMotion="user">
            {RIBBON_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={cn('ribbon-tab', activeTab === tab.id && 'ribbon-tab-active')}
                onClick={() => selectTab(tab.id)}
              >
                {activeTab === tab.id ? (
                  <motion.span
                    layoutId="ribbon-tab-indicator"
                    className="ribbon-tab-ind"
                    aria-hidden="true"
                    transition={{ type: 'spring', bounce: 0.21, duration: 0.5 }}
                  />
                ) : null}
                <span className="ribbon-tab-label">{tt(tab.i18nKey, tab.fallback)}</span>
              </button>
            ))}
          </MotionConfig>
        </nav>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="ribbon-collapse-btn"
              aria-expanded={!collapsed}
              aria-label={collapsed ? tt('rb.expand') : tt('rb.collapse')}
              onClick={() => setCollapsed((v) => !v)}
            >
              <ChevronDown
                size={15}
                aria-hidden="true"
                className={cn('transition-transform duration-200', !collapsed && 'rotate-180')}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{collapsed ? tt('rb.expand') : tt('rb.collapse')}</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('ribbon-collapse', collapsed && 'ribbon-collapse-closed')}>
        <div className="ribbon-body" role="tabpanel">
          {activeTab === 'home' ? <HomeTab /> : null}
          {activeTab === 'insert' ? <InsertTab /> : null}
          {activeTab === 'layout' ? <LayoutTab /> : null}
          {activeTab === 'design' ? <DesignTab /> : null}
          {activeTab === 'review' ? <ReviewTab /> : null}
          {activeTab === 'ai' ? <AiTab /> : null}
          {activeTab === 'export' ? <ExportTab /> : null}
        </div>
      </div>
    </div>
  );
}
