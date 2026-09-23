/**
 * Export tab — print/PDF portal, DOCX, HTML, JSON backup
 */

'use client';

import { useRef } from 'react';
import { FileCode2, FileDown, FileText, Printer, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RibbonButton, RibbonDivider, RibbonGroup } from './ribbon-shell';
import { useEditorStore } from '@/lib/store';
import { currentProjectJson, downloadJsonBackup, importJsonBackup, printDocument } from '@/lib/export-json';
import { downloadHtmlBackup } from '@/lib/export-html';
import { exportProjectToDocx } from '@/lib/export-docx';
import { toast } from 'sonner';

export function ExportTab() {
  const title = useEditorStore((s) => s.title);
  const importRef = useRef<HTMLInputElement>(null);
  void title;

  const doDocx = async () => {
    const s = useEditorStore.getState();
    toast.loading('Building Word file…', { id: 'docx' });
    try {
      await exportProjectToDocx({ title: s.title, settings: s.settings, pages: s.pages });
      toast.success('DOCX downloaded', { id: 'docx' });
    } catch {
      toast.error('Failed to generate DOCX', { id: 'docx' });
    }
  };

  return (
    <div className="ribbon-scroll flex items-stretch gap-1">
      <RibbonGroup label="Press-Ready Output">
        <div className="flex flex-col items-center justify-center gap-1 px-2">
          <Button className="gap-2" onClick={printDocument}>
            <Printer size={16} /> Print / Save as PDF
          </Button>
          <p className="max-w-56 text-center text-[10px] leading-tight text-muted-foreground">
            Pick “Save as PDF” in the print dialog — fonts & margins stay 100% accurate
          </p>
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Export File">
        <div className="flex gap-1">
          <RibbonButton icon={FileText} label="Word (.docx)" onClick={doDocx} />
          <RibbonButton
            icon={FileCode2}
            label="HTML"
            title="Self-contained HTML file (readable offline)"
            onClick={() => {
              const s = useEditorStore.getState();
              downloadHtmlBackup(s.title, s.settings, s.pages);
              toast.success('HTML downloaded');
            }}
          />
        </div>
      </RibbonGroup>
      <RibbonDivider />
      <RibbonGroup label="Backup">
        <div className="flex gap-1">
          <RibbonButton
            icon={FileDown}
            label="Backup (JSON)"
            title="Save the entire project as a file"
            onClick={() => {
              const project = currentProjectJson();
              if (!project) return;
              downloadJsonBackup(project);
              toast.success('Backup downloaded');
            }}
          />
          <input
            ref={importRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.currentTarget.value = '';
              if (!file) return;
              const result = await importJsonBackup(file);
              if (result === 'ok') toast.success('Project restored from backup');
              else toast.error('Not a valid backup file');
            }}
          />
          <RibbonButton icon={Upload} label="Open Backup" onClick={() => importRef.current?.click()} />
        </div>
      </RibbonGroup>
    </div>
  );
}
