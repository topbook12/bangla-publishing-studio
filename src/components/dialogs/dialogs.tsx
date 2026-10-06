/**
 * ডায়ালগ কনটেইনার — UI স্টোর অনুযায়ী ডায়ালগ মাউন্ট
 */

'use client';

import { HeaderFooterDialog } from './header-footer-dialog';
import { CoverDialog } from './cover-dialog';
import { ProjectsDialog } from './projects-dialog';
import { ReviewDialog } from './review-dialog';
import { PageChromeDialog } from './page-chrome-dialog';
import { TemplatesDialog } from './templates-dialog';
import { FindReplaceDialog, useFindReplaceShortcuts } from './find-replace-dialog';
import { SnapshotsDialog } from './snapshots-dialog';
import { HelpDialog } from './help-dialog';
import { KrutiConverterDialog } from './kruti-converter-dialog';
import { AiVisionDialog } from './ai-vision-dialog';
import { AiSettingsDialog } from './ai-settings-dialog';

export function Dialogs() {
  useFindReplaceShortcuts();
  return (
    <>
      <HeaderFooterDialog />
      <CoverDialog />
      <ProjectsDialog />
      <ReviewDialog />
      <PageChromeDialog />
      <TemplatesDialog />
      <FindReplaceDialog />
      <SnapshotsDialog />
      <KrutiConverterDialog />
      <AiVisionDialog />
      <AiSettingsDialog />
      <HelpDialog />
    </>
  );
}
