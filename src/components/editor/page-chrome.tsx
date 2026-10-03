/**
 * হেডার/ফুটার মাস্টার রেন্ডারার
 * স্টাইলসমূহ: parallel (উদ্ভাস-স্টাইল ডাবল দাগ), royal (ফ্লোরিশ), academic (মিনিমাল), plain
 * টেক্সট জোনগুলোতে ডাবল-ক্লিক করে সরাসরি এডিট করা যায়।
 *
 * ★ কমিট নিয়ম (গুরুত্বপূর্ণ):
 *  - পাতার উপর ডাবল-ক্লিক করে সম্পাদনা = শুধু সেই পাতার override আপডেট/তৈরি হয় —
 *    অন্য পাতার হেডার/ফুটার অপরিবর্তিত থাকে।
 *  - সব পাতা একসাথে বদলাতে হলে Design → “Header & Footer Master” ডায়ালগ ব্যবহার করতে হবে।
 */

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { DocumentSettings, HeaderFooterSettings } from '@/lib/types';
import { displayPageNumber, gutterSide, isEvenPage } from '@/lib/pagenum';
import { fontStackOf } from '@/lib/paper';
import { useEditorStore } from '@/lib/store';
import { useT } from '@/lib/i18n';
import { cn } from '@/lib/utils';

interface ChromeProps {
  index: number;
  settings: DocumentSettings;
  pageKind: 'normal' | 'cover';
  noChrome: boolean;
  /** এই পাতার কাস্টম হেডার/ফুটার (থাকলে গ্লোবাল সেটিংসের বদলে প্রযোজ্য) */
  pageId?: string;
  headerOverride?: HeaderFooterSettings | null;
  footerOverride?: HeaderFooterSettings | null;
}

function mirrorIfEven(index: number, oddEven: boolean, startAt: number): boolean {
  return oddEven && isEvenPage(index, startAt);
}

// ─── ইনলাইন এডিটেবল টেক্সট জোন ───

type ChromeTextField = 'leftText' | 'centerText' | 'rightText';
type ChromeSection = 'header' | 'footer';

/**
 * ডাবল-ক্লিকে এডিটেবল হয়ে ওঠা হেডার/ফুটার টেক্সট জোন।
 * কমিট (blur বা Enter) onCommit কলব্যাকে যায় — গ্লোবাল সেটিংস অথবা
 * নির্দিষ্ট পাতার override — যেখানেই এই জোনটির উৎস।
 * IndexedDB অটোসেভ আগের মতোই কাজ করে। Escape এডিট বাতিল করে।
 */
function EditableZone({
  section, hf, field, value, className, onCommit,
}: {
  section: ChromeSection;
  hf: HeaderFooterSettings;
  field: ChromeTextField;
  /** প্রদর্শিত টেক্সট (ফলব্যাক সহ) — না দিলে hf[field] */
  value?: string;
  className?: string;
  /** কমিট করার টার্গেট (গ্লোবাল অথবা পেজ override) */
  onCommit: (next: HeaderFooterSettings) => void;
}) {
  const tt = useT();
  const shown = value ?? hf[field];
  const [editing, setEditing] = useState(false);
  const cancelRef = useRef(false);
  const spanRef = useRef<HTMLSpanElement>(null);

  // এডিটিং শুরু হলে বর্তমান টেক্সট বসিয়ে ফোকাস + পুরোটা সিলেক্ট
  // (contentEditable-এর ভেতরে টাইপের সময় React রি-রেন্ডার হয় না — কার্সর লাফায় না)
  useEffect(() => {
    if (!editing) return;
    const el = spanRef.current;
    if (!el) return;
    el.textContent = shown;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [editing, shown]);

  const commit = () => {
    if (cancelRef.current) return;
    const text = (spanRef.current?.textContent ?? '').trim();
    cancelRef.current = true; // Enter-কমিটের পরে আসা blur যেন দ্বিগুণ লেখে না
    setEditing(false);
    if (text !== shown) {
      onCommit({ ...hf, [field]: text });
    }
  };

  const cancel = () => {
    cancelRef.current = true;
    setEditing(false);
  };

  if (editing) {
    return (
      <span
        ref={spanRef}
        className={cn('chrome-editing', className)}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        aria-label={tt('ws.chrome.zoneAria', 'Header/footer text')}
        onBlur={commit}
        onKeyDown={(e) => {
          // অ্যাপ-লেভেল শর্টকাট যেন ট্রিগার না হয়
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
        onPaste={(e) => {
          // প্লেইন টেক্সট হিসেবেই পেস্ট — হেডারে বিদেশি HTML ঢুকবে না
          e.preventDefault();
          document.execCommand('insertText', false, e.clipboardData.getData('text/plain'));
        }}
        onDoubleClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <span
      className={cn('chrome-editable', className)}
      title={tt('ws.chrome.editHint', 'Double-click to edit')}
      onDoubleClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        cancelRef.current = false;
        setEditing(true);
      }}
    >
      {shown}
    </span>
  );
}

/** royal/plain-এর কেন্দ্রীয় টেক্সট ফলব্যাক: centerText → বাম প্রদর্শিত → ডান প্রদর্শিত */
function centerFallback(hf: HeaderFooterSettings, mirrored: boolean): { field: ChromeTextField; value: string } {
  if (hf.centerText) return { field: 'centerText', value: hf.centerText };
  if (mirrored) {
    if (hf.rightText) return { field: 'rightText', value: hf.rightText };
    return { field: 'leftText', value: hf.leftText };
  }
  if (hf.leftText) return { field: 'leftText', value: hf.leftText };
  return { field: 'rightText', value: hf.rightText };
}

function HeaderBar({ hf, mirrored, onCommit }: { hf: HeaderFooterSettings; mirrored: boolean; onCommit: (next: HeaderFooterSettings) => void }) {
  const tt = useT();
  const left = mirrored ? hf.rightText : hf.leftText;
  const right = mirrored ? hf.leftText : hf.rightText;
  const accent = hf.accentColor;

  if (hf.style === 'parallel') {
    return (
      <div className="hdr-parallel" style={{ color: accent }}>
        <div className="hdr-parallel-line" style={{ borderColor: accent }} />
        <div className="hdr-parallel-row">
          <EditableZone section="header" hf={hf} field={mirrored ? 'rightText' : 'leftText'} value={left} className="hdr-parallel-left" onCommit={onCommit} />
          <EditableZone section="header" hf={hf} field={mirrored ? 'leftText' : 'rightText'} value={right} className="hdr-parallel-right" onCommit={onCommit} />
        </div>
        <div className="hdr-parallel-line" style={{ borderColor: accent }} />
      </div>
    );
  }
  if (hf.style === 'royal') {
    const title = centerFallback(hf, mirrored);
    return (
      <div className="hdr-royal" style={{ color: accent }}>
        <div className="hdr-royal-row">
          <span className="hdr-royal-flourish" style={{ color: accent }} title={tt('ws.chrome.autoHint', 'Automatic content — edit via Header & Footer')}>❦</span>
          <EditableZone section="header" hf={hf} field={title.field} value={title.value} className="hdr-royal-title" onCommit={onCommit} />
          <span className="hdr-royal-flourish" style={{ color: accent }} title={tt('ws.chrome.autoHint', 'Automatic content — edit via Header & Footer')}>❦</span>
        </div>
        <div className="hdr-royal-line" style={{ borderColor: accent }} />
      </div>
    );
  }
  if (hf.style === 'academic') {
    return (
      <div className="hdr-academic" style={{ borderColor: accent }}>
        <EditableZone section="header" hf={hf} field={mirrored ? 'rightText' : 'leftText'} value={left} className="hdr-academic-left" onCommit={onCommit} />
        <EditableZone section="header" hf={hf} field={mirrored ? 'leftText' : 'rightText'} value={right} className="hdr-academic-right" onCommit={onCommit} />
      </div>
    );
  }
  // plain
  const center = centerFallback(hf, mirrored);
  if (!center.value) return null;
  return <div className="hdr-plain"><EditableZone section="header" hf={hf} field={center.field} value={center.value} onCommit={onCommit} /></div>;
}

function FooterBar({
  hf, mirrored, numberHtml, numPos, onCommit,
}: {
  hf: HeaderFooterSettings;
  mirrored: boolean;
  numberHtml: ReactNode;
  /** পৃষ্ঠা নম্বরের অ্যালাইনমেন্ট (settings.pageNumber.position থেকে) */
  numPos: 'left' | 'center' | 'right';
  onCommit: (next: HeaderFooterSettings) => void;
}) {
  const tt = useT();
  const left = mirrored ? hf.rightText : hf.leftText;
  const right = mirrored ? hf.leftText : hf.rightText;
  const accent = hf.accentColor;

  if (hf.style === 'royal') {
    return (
      <div className="ftr-royal" style={{ color: accent }}>
        <div className="hdr-royal-line" style={{ borderColor: accent }} />
        <div className="ftr-royal-row" style={{ justifyContent: numPos === 'left' ? 'flex-start' : numPos === 'right' ? 'flex-end' : 'center' }}>
          <span className="hdr-royal-flourish" style={{ color: accent }} title={tt('ws.chrome.autoHint', 'Automatic content — edit via Header & Footer')}>❧</span>
          {numberHtml}
          <span className="hdr-royal-flourish" style={{ color: accent }} title={tt('ws.chrome.autoHint', 'Automatic content — edit via Header & Footer')}>❧</span>
        </div>
      </div>
    );
  }
  if (hf.style === 'academic') {
    const leftZone = <EditableZone section="footer" hf={hf} field={mirrored ? 'rightText' : 'leftText'} value={left} onCommit={onCommit} />;
    const rightZone = <EditableZone section="footer" hf={hf} field={mirrored ? 'leftText' : 'rightText'} value={right} onCommit={onCommit} />;
    // নম্বরের পজিশন অনুযায়ী সেল ক্রম — মাঝে হলে সত্যিকারের কেন্দ্রে (flex:1)
    if (numPos === 'left') return <div className="ftr-academic" style={{ borderColor: accent }}>{numberHtml}{leftZone}{rightZone}</div>;
    if (numPos === 'right') return <div className="ftr-academic" style={{ borderColor: accent }}>{leftZone}{rightZone}{numberHtml}</div>;
    return (
      <div className="ftr-academic" style={{ borderColor: accent }}>
        {leftZone}
        <span style={{ flex: 1, textAlign: 'center' }}>{numberHtml}</span>
        {rightZone}
      </div>
    );
  }
  if (hf.style === 'parallel') {
    const leftZone = <EditableZone section="footer" hf={hf} field={mirrored ? 'rightText' : 'leftText'} value={left} onCommit={onCommit} />;
    const rightZone = <EditableZone section="footer" hf={hf} field={mirrored ? 'leftText' : 'rightText'} value={right} onCommit={onCommit} />;
    if (numPos === 'left') return <div className="ftr-parallel" style={{ borderColor: accent }}>{numberHtml}{leftZone}{rightZone}</div>;
    if (numPos === 'right') return <div className="ftr-parallel" style={{ borderColor: accent }}>{leftZone}{rightZone}{numberHtml}</div>;
    return (
      <div className="ftr-parallel" style={{ borderColor: accent }}>
        {leftZone}
        <span style={{ flex: 1, textAlign: 'center' }}>{numberHtml}</span>
        {rightZone}
      </div>
    );
  }
  // plain
  const center = centerFallback(hf, mirrored);
  const justify = !center.value ? (numPos === 'left' ? 'flex-start' : numPos === 'right' ? 'flex-end' : 'center') : 'center';
  return (
    <div className="ftr-plain" style={{ justifyContent: justify }}>
      <EditableZone section="footer" hf={hf} field={center.field} value={center.value} onCommit={onCommit} />
      {numberHtml}
    </div>
  );
}

export function PageHeader({ index, settings, pageKind, noChrome, pageId, headerOverride }: ChromeProps): ReactNode {
  const tt = useT();
  const { pageNumber } = settings;
  const header = headerOverride ?? settings.header;
  if (pageKind === 'cover' || noChrome) return null;
  if (pageNumber.differentFirst && index === 0) return null;
  const mirrored = mirrorIfEven(index, pageNumber.oddEven, pageNumber.startAt);
  const numberInHeader = pageNumber.enabled && pageNumber.position.startsWith('top');
  const num = displayPageNumber(index, pageNumber);
  // হেডার বন্ধ বা 'none' — ফুটারের মতোই: হেডার-বার বন্ধ, কিন্তু top-নম্বর
  // (চালু থাকলে) নম্বর-ওনলি আকারে দেখাই। আগে পুরোপুরি null দিত, ফলে
  // "হেডার নেই + উপরে নম্বর" কনফিগে নম্বরই হারিয়ে যেত।
  const headerOff = !header.enabled || header.style === 'none';

  /**
   * কমিট টার্গেট — সবসময় এই পাতার override (থাকলে আপডেট, না থাকলে গ্লোবালের কপি দিয়ে তৈরি)।
   * আগের বাগ: override না থাকলে গ্লোবাল সেটিংসে লিখে দিত, ফলে এক পাতার হেডার বদলালে
   * সব পাতার হেডার বদলে যেত। এখন ডাবল-ক্লিক সম্পাদনা কেবল সেই পাতায় সীমাবদ্ধ।
   */
  const commitHeader = (next: HeaderFooterSettings) => {
    if (!pageId) {
      useEditorStore.getState().updateSettings({ header: next });
      return;
    }
    const base = headerOverride ?? settings.header;
    useEditorStore.getState().updatePage(pageId, { headerOverride: { ...base, ...next } });
  };

  const numberHtml = numberInHeader && num ? (
    <span className="page-number" style={{ color: header.accentColor }} title={tt('ws.chrome.autoHint', 'Automatic content — edit via Header & Footer')}>
      {pageNumber.prefix ? <span className="page-number-prefix">{pageNumber.prefix}</span> : null}
      {num}
    </span>
  ) : null;

  // নম্বরের অ্যালাইনমেন্ট — position-এর শেষ অংশ (left/center/right)
  const numAlign = pageNumber.position.endsWith('left') ? 'left' as const : pageNumber.position.endsWith('right') ? 'right' as const : 'center' as const;

  if (headerOff) {
    if (!numberHtml) return null;
    return (
      <header className="page-header" style={{ fontSize: `${header.fontSize}pt` }}>
        <div className="ftr-plain" style={{ justifyContent: numAlign === 'left' ? 'flex-start' : numAlign === 'right' ? 'flex-end' : 'center' }}>{numberHtml}</div>
      </header>
    );
  }

  // হেডার স্টাইল আর নম্বর একসাথে: plain হলে নম্বর হেডারে যোগ হয়
  return (
    <header className="page-header" style={{ fontSize: `${header.fontSize}pt` }}>
      <HeaderBar hf={header} mirrored={mirrored} onCommit={commitHeader} />
      {numberInHeader && numberHtml && header.style !== 'plain' ? (
        <div className="page-number-overlay" style={{ textAlign: numAlign }}>{numberHtml}</div>
      ) : null}
      {numberInHeader && header.style === 'plain' && num ? (
        <div style={{ textAlign: numAlign }}>{numberHtml}</div>
      ) : null}
    </header>
  );
}

export function PageFooter({ index, settings, pageKind, noChrome, pageId, footerOverride }: ChromeProps): ReactNode {
  const tt = useT();
  const { pageNumber } = settings;
  const footer = footerOverride ?? settings.footer;
  if (pageKind === 'cover' || noChrome) return null;
  if (pageNumber.differentFirst && index === 0) return null;
  const mirrored = mirrorIfEven(index, pageNumber.oddEven, pageNumber.startAt);
  // style 'none' হলে ফুটার-বার বন্ধ, শুধু পৃষ্ঠা নম্বর (চালু থাকলে) দেখায় —
  // footer.enabled=false-এর সাথে একই আচরণ
  const footerOff = !footer.enabled || footer.style === 'none';
  const numberInFooter = pageNumber.enabled && pageNumber.position.startsWith('bottom');
  const num = displayPageNumber(index, pageNumber);

  /** commitHeader-এর মতোই — ফুটার সম্পাদনাও কেবল এই পাতায় সীমাবদ্ধ */
  const commitFooter = (next: HeaderFooterSettings) => {
    if (!pageId) {
      useEditorStore.getState().updateSettings({ footer: next });
      return;
    }
    const base = footerOverride ?? settings.footer;
    useEditorStore.getState().updatePage(pageId, { footerOverride: { ...base, ...next } });
  };

  const numberHtml = numberInFooter && num ? (
    <span className="page-number" style={{ color: footer.accentColor }} title={tt('ws.chrome.autoHint', 'Automatic content — edit via Header & Footer')}>
      {pageNumber.prefix ? <span className="page-number-prefix">{pageNumber.prefix}</span> : null}
      {num}
    </span>
  ) : null;

  const numAlign: 'left' | 'center' | 'right' = pageNumber.position.endsWith('left')
    ? 'left'
    : pageNumber.position.endsWith('right') ? 'right' : 'center';

  const hasFooterContent =
    !footerOff && (footer.style !== 'plain' || footer.centerText || footer.leftText || footer.rightText);

  if (!hasFooterContent && !numberHtml) return null;

  return (
    <footer className="page-footer" style={{ fontSize: `${footer.fontSize}pt` }}>
      {!footerOff ? <FooterBar hf={footer} mirrored={mirrored} numberHtml={numberHtml} numPos={numAlign} onCommit={commitFooter} /> : numberHtml ? (
        <div className="ftr-plain" style={{ justifyContent: numAlign === 'left' ? 'flex-start' : numAlign === 'right' ? 'flex-end' : 'center' }}>{numberHtml}</div>
      ) : null}
    </footer>
  );
}

/** পৃষ্ঠার মার্জিন স্টাইল (gutter সহ) */
export function pagePaddingStyle(index: number, settings: DocumentSettings): string {
  const m = settings.margins;
  const side = gutterSide(index, settings.pageNumber.oddEven, settings.pageNumber.startAt);
  const left = side === 'left' ? m.left + m.gutter : m.left;
  const right = side === 'right' ? m.right + m.gutter : m.right;
  return `${m.top}in ${right}in ${m.bottom}in ${left}in`;
}

export function pageFontStyle(settings: DocumentSettings): React.CSSProperties {
  return {
    fontFamily: fontStackOf(settings.defaultFont),
    fontSize: `${settings.defaultFontSize}pt`,
    lineHeight: settings.lineHeight,
    '--page-paragraph-gap': `${settings.paragraphSpacing}px`,
  } as React.CSSProperties;
}

// ─── পানির ছাপ (Watermark) ───

/**
 * প্রতিটি পাতার পেছনে হালকা ঘূর্ণিত লেখা (খসড়া/গোপনীয়…) — খসড়া কপি শনাক্ত করতে।
 *
 * ★ ইন্টিগ্রেশন: paper-page.tsx-এর `<div class="paper-inner">`-এর প্রথম সন্তান হিসেবে বসে
 *   (globals.css-এ .paper-inner-কে positioning context করা হয়েছে)। স্তরটি absolute +
 *   pointer-events:none — লেখা সিলেকশন/ক্লিকে বাধা দেয় না। প্রিন্ট ও ফরমা ক্লোনেও
 *   ছাপা হয় (print-color-adjust: exact ইনলাইনে দেওয়া; কোনো .no-print রুল এটিকে লুকায় না)।
 *
 * পুরনো ডকুমেন্টে settings.watermark অনুপস্থিত থাকতে পারে — তাই `?.` গার্ড বাধ্যতামূলক।
 */
export function PageWatermark({ settings }: { settings: DocumentSettings }): ReactNode {
  const wm = settings.watermark;
  if (!wm?.enabled) return null;
  const text = (wm.text ?? '').trim();
  if (!text) return null;
  // সেটিংস কোথাও ভেঙে গেলেও চিত্র বিগড়াবে না — নিরাপদ সীমায় বাঁধা
  const opacity = Math.min(0.35, Math.max(0.04, wm.opacity));
  const angle = Math.min(90, Math.max(-90, wm.angle));
  const fontSize = Math.min(120, Math.max(24, wm.fontSize));
  return (
    <div
      className="page-watermark"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        // ঘূর্ণন + রং + হালকা অস্বচ্ছতা — খসড়া ছাপের ক্লাসিক চেহারা
        transform: `rotate(${angle}deg)`,
        color: wm.color,
        opacity,
        lineHeight: 1.2,
        fontSize: `${fontSize}pt`,
        // পাতার ডিফল্ট ফন্টেই ছাপ — বইয়ের টাইপোগ্রাফির সাথে সামঞ্জস্য
        fontFamily: fontStackOf(settings.defaultFont),
        fontWeight: 700,
        // খসড়া কপিতেও ছাপ হওয়া বাধ্যতামূলক — ব্রাউজার রঙ বাদ দিলে স্বচ্ছ হয়ে যেত
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      } as React.CSSProperties}
    >
      {/* দীর্ঘ লেখা মাঝবরাবর মুড়ে যায় (max-width 90%); aria-hidden — স্ক্রিন-রিডারে বাড়তি শব্দ নয় */}
      <span
        aria-hidden="true"
        style={{ maxWidth: '90%', whiteSpace: 'normal', textAlign: 'center', overflowWrap: 'break-word' }}
      >
        {text}
      </span>
    </div>
  );
}
