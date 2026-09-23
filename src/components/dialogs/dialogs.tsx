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

export function Dialogs() {
  return (
    <>
      <HeaderFooterDialog />
      <CoverDialog />
      <ProjectsDialog />
      <ReviewDialog />
      <PageChromeDialog />
      <TemplatesDialog />
    </>
  );
}
