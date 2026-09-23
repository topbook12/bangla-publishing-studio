/**
 * কভার পেজ রেন্ডারার — তিন ধরনের ডিজাইন: classic, modern, coaching
 */

'use client';

import type { CoverData } from '@/lib/types';
import { fontStackOf } from '@/lib/paper';

export function CoverView({ cover }: { cover: CoverData }) {
  const style = {
    fontFamily: fontStackOf('Noto Serif Bengali'),
    ['--cover-accent' as string]: cover.accentColor,
  } as React.CSSProperties;

  if (cover.style === 'modern') {
    return (
      <div className="cover cover-modern" style={style}>
        <div className="cover-modern-band" style={{ backgroundColor: cover.accentColor }} />
        <div className="cover-modern-body">
          <p className="cover-org">{cover.organization}</p>
          <h1 className="cover-title">{cover.title || 'বইয়ের নাম'}</h1>
          {cover.subtitle ? <p className="cover-subtitle">{cover.subtitle}</p> : null}
          <div className="cover-modern-rule" style={{ backgroundColor: cover.accentColor }} />
          <p className="cover-course">{cover.course}</p>
        </div>
        <div className="cover-footer">
          <p className="cover-author">{cover.author ? `সংকলন: ${cover.author}` : ''}</p>
          <p className="cover-year">{cover.year}</p>
        </div>
      </div>
    );
  }

  if (cover.style === 'coaching') {
    return (
      <div className="cover cover-coaching" style={style}>
        <div className="cover-coaching-frame" style={{ borderColor: cover.accentColor }}>
          <p className="cover-org-badge" style={{ backgroundColor: cover.accentColor }}>{cover.organization}</p>
          <h1 className="cover-title">{cover.title || 'গাইড'}</h1>
          {cover.subtitle ? <p className="cover-subtitle">{cover.subtitle}</p> : null}
          <p className="cover-course" style={{ color: cover.accentColor }}>{cover.course}</p>
          <div className="cover-coaching-deco" style={{ color: cover.accentColor }}>✦ ❖ ✦</div>
        </div>
        <div className="cover-footer">
          <p className="cover-author">{cover.author ? `লিখেছেন: ${cover.author}` : ''}</p>
          <p className="cover-year">{cover.year}</p>
        </div>
      </div>
    );
  }

  // classic
  return (
    <div className="cover cover-classic" style={style}>
      <div className="cover-classic-inner">
        <div className="cover-classic-ornament" style={{ color: cover.accentColor }}>❦ ─── ❖ ─── ❦</div>
        <p className="cover-org">{cover.organization}</p>
        <h1 className="cover-title" style={{ color: cover.accentColor }}>{cover.title || 'বইয়ের নাম'}</h1>
        {cover.subtitle ? <p className="cover-subtitle">{cover.subtitle}</p> : null}
        <div className="cover-classic-divider" style={{ backgroundColor: cover.accentColor }} />
        <p className="cover-course">{cover.course}</p>
        <div className="cover-classic-ornament" style={{ color: cover.accentColor }}>❧ ─── ❖ ─── ❧</div>
      </div>
      <div className="cover-footer">
        <p className="cover-author">{cover.author}</p>
        <p className="cover-year">{cover.year}</p>
      </div>
    </div>
  );
}
