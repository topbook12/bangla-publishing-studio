/**
 * ফিজিক্যাল কাগজের পাতা — হেডার + কনটেন্ট + ফুটার ও পেপার স্টাইল
 */

'use client';

import type { ReactNode } from 'react';
import type { DocumentSettings, PageData } from '@/lib/types';
import { getPageDimensionsMm, mmToPx, pageBorderVisual } from '@/lib/paper';
import { PageFooter, PageHeader, pageFontStyle, pagePaddingStyle } from './page-chrome';
import { CoverView } from './cover-view';
import { cn } from '@/lib/utils';

interface PaperPageProps {
  page: PageData;
  index: number;
  settings: DocumentSettings;
  children: ReactNode;
  active: boolean;
  onPageClick?: () => void;
}

export function PaperPage({ page, index, settings, children, active, onPageClick }: PaperPageProps) {
  const { widthMm, heightMm } = getPageDimensionsMm(
    settings.paperSize,
    settings.orientation,
    settings.customPaper,
  );
  const width = mmToPx(widthMm);
  const height = mmToPx(heightMm);

  const isCover = page.kind === 'cover';
  const paperClass =
    settings.paperColor === 'cream'
      ? 'paper-cream'
      : settings.paperColor === 'dark'
        ? 'paper-dark'
        : 'paper-white';

  // বর্ডার রং/স্টাইল/প্রস্থ সেটিংস থেকে আসে — একই ইনলাইন স্টাইল প্রিন্টেও প্রযোজ্য হয়
  const borderStyle = pageBorderVisual(settings);

  return (
    <div
      className={cn('paper-page', paperClass, active && 'paper-active')}
      style={{ width, height }}
      role="article"
      aria-label={`পৃষ্ঠা ${index + 1}`}
      onClick={onPageClick}
      data-page-index={index}
    >
      <div className="paper-inner" style={{ padding: pagePaddingStyle(index, settings) }}>
        <PageHeader
          index={index}
          settings={settings}
          pageKind={page.kind}
          noChrome={page.noChrome}
          pageId={page.id}
          headerOverride={page.headerOverride}
        />
        <div className="page-content" style={borderStyle}>
          {isCover && page.coverData ? (
            <CoverView cover={page.coverData} />
          ) : (
            <div className="page-content-text" style={pageFontStyle(settings)}>
              {children}
            </div>
          )}
        </div>
        <PageFooter
          index={index}
          settings={settings}
          pageKind={page.kind}
          noChrome={page.noChrome}
          pageId={page.id}
          footerOverride={page.footerOverride}
        />
      </div>
    </div>
  );
}
