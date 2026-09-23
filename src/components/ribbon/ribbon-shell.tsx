/**
 * Ribbon toolbar shell — MS Word-style tabs + group primitives
 */

'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/lib/store';
import { getEditor } from '@/lib/editor-registry';
import type { RibbonTab } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { HomeTab } from './home-tab';
import { InsertTab } from './insert-tab';
import { LayoutTab } from './layout-tab';
import { DesignTab } from './design-tab';
import { ReviewTab } from './review-tab';
import { ExportTab } from './export-tab';

/** Active editor instance that re-renders on selection/format changes */
export function useActiveEditor() {
  const selectionVersion = useEditorStore((s) => s.selectionVersion);
  const activePageId = useEditorStore((s) => s.activePageId);
  void selectionVersion;
  return getEditor(activePageId);
}

export const RIBBON_TABS: Array<{ id: RibbonTab; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'insert', label: 'Insert' },
  { id: 'layout', label: 'Layout' },
  { id: 'design', label: 'Design' },
  { id: 'review', label: 'Review' },
  { id: 'export', label: 'Export' },
];

export function RibbonGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('ribbon-group no-print', className)}>
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

export function RibbonButton({ icon: Icon, label, onClick, active, disabled, title, shortcut, danger }: RibbonButtonProps) {
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
}

/** Helper to run a command on the active editor */
export function runCommand(fn: (editor: NonNullable<ReturnType<typeof getEditor>>) => void): void {
  const { activePageId } = useEditorStore.getState();
  const editor = getEditor(activePageId);
  if (!editor || editor.isDestroyed) {
    // No focused page — fall back to the first mounted editor
    const anyEditor = [...useEditorStore.getState().pages].map((p) => getEditor(p.id)).find(Boolean);
    if (anyEditor && !anyEditor.isDestroyed) fn(anyEditor);
    return;
  }
  editor.commands.focus();
  fn(editor);
}

export function Ribbon() {
  const activeTab = useEditorStore((s) => s.activeRibbonTab);
  const setTab = useEditorStore((s) => s.setRibbonTab);
  const [collapsed, setCollapsed] = useState(false);

  // Word-like behavior: picking a tab while the ribbon is collapsed expands it again
  const selectTab = (id: RibbonTab) => {
    setTab(id);
    if (collapsed) setCollapsed(false);
  };

  return (
    <div className="ribbon no-print" role="toolbar" aria-label="Ribbon toolbar">
      <div className="ribbon-tabstrip">
        <nav className="ribbon-tabs" role="tablist" aria-label="Ribbon tabs">
          {RIBBON_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={cn('ribbon-tab', activeTab === tab.id && 'ribbon-tab-active')}
              onClick={() => selectTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="ribbon-collapse-btn"
              aria-expanded={!collapsed}
              aria-label={collapsed ? 'Expand ribbon' : 'Collapse ribbon'}
              onClick={() => setCollapsed((v) => !v)}
            >
              <ChevronDown
                size={15}
                aria-hidden="true"
                className={cn('transition-transform duration-200', !collapsed && 'rotate-180')}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">{collapsed ? 'Expand Ribbon' : 'Collapse Ribbon'}</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('ribbon-collapse', collapsed && 'ribbon-collapse-closed')}>
        <div className="ribbon-body" role="tabpanel">
          {activeTab === 'home' ? <HomeTab /> : null}
          {activeTab === 'insert' ? <InsertTab /> : null}
          {activeTab === 'layout' ? <LayoutTab /> : null}
          {activeTab === 'design' ? <DesignTab /> : null}
          {activeTab === 'review' ? <ReviewTab /> : null}
          {activeTab === 'export' ? <ExportTab /> : null}
        </div>
      </div>
    </div>
  );
}
