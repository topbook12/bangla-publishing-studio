/**
 * লাইটওয়েট HTML রেন্ডারার — ভিউপোর্টের বাইরের পৃষ্ঠাগুলোর স্ট্যাটিক প্রিভিউ।
 * কাস্টম নোড (কলআউট, MCQ, TOC, ফুটনোট, ডিভাইডার) attributes থেকে রেন্ডার হয়।
 */

'use client';

import type { ReactNode } from 'react';
import { parseMcqData } from '@/lib/nodes-html';

const OPTION_LABELS = ['ক', 'খ', 'গ', 'ঘ'] as const;

function inlineNodes(node: Node, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  node.childNodes.forEach((child, i) => {
    const key = `${keyPrefix}-${i}`;
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text) out.push(text);
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as Element;
    switch (el.tagName) {
      case 'B': case 'STRONG':
        out.push(<strong key={key}>{inlineNodes(el, key)}</strong>);
        break;
      case 'I': case 'EM':
        out.push(<em key={key}>{inlineNodes(el, key)}</em>);
        break;
      case 'U':
        out.push(<u key={key}>{inlineNodes(el, key)}</u>);
        break;
      case 'S': case 'STRIKE': case 'DEL':
        out.push(<s key={key}>{inlineNodes(el, key)}</s>);
        break;
      case 'BR':
        out.push(<br key={key} />);
        break;
      case 'SUP':
        if (el.classList.contains('footnote') && el.getAttribute('data-note')) {
          out.push(
            <sup key={key} className="footnote" title={el.getAttribute('data-note') ?? ''}>
              <span aria-hidden="true">▾</span>
            </sup>,
          );
        } else {
          out.push(<sup key={key}>{inlineNodes(el, key)}</sup>);
        }
        break;
      case 'SUB':
        out.push(<sub key={key}>{inlineNodes(el, key)}</sub>);
        break;
      case 'A':
        out.push(<a key={key} href={el.getAttribute('href') ?? '#'}>{inlineNodes(el, key)}</a>);
        break;
      case 'IMG':
        out.push(<img key={key} src={el.getAttribute('src') ?? ''} alt={el.getAttribute('alt') ?? 'ছবি'} />);
        break;
      case 'SPAN': case 'MARK': case 'CODE': {
        const style = el.getAttribute('style') ?? '';
        const colorMatch = /color:\s*([^;]+)/.exec(style);
        const bgMatch = /background(?:-color)?:\s*([^;]+)/.exec(style);
        const css: React.CSSProperties = {};
        if (colorMatch) css.color = colorMatch[1].trim();
        if (bgMatch) css.backgroundColor = bgMatch[1].trim();
        out.push(
          <span key={key} style={css}>{inlineNodes(el, key)}</span>,
        );
        break;
      }
      default:
        out.push(<span key={key}>{inlineNodes(el, key)}</span>);
    }
  });
  return out;
}

function blockNodes(container: Element, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  Array.from(container.children).forEach((el, i) => {
    const key = `${keyPrefix}-b${i}`;
    switch (el.tagName) {
      case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6': {
        const Tag = el.tagName.toLowerCase() as 'h1';
        out.push(<Tag key={key}>{inlineNodes(el, key)}</Tag>);
        break;
      }
      case 'P':
        out.push(<p key={key}>{inlineNodes(el, key)}</p>);
        break;
      case 'UL':
        out.push(<ul key={key}>{blockNodes(el, key)}</ul>);
        break;
      case 'OL':
        out.push(<ol key={key}>{blockNodes(el, key)}</ol>);
        break;
      case 'LI':
        out.push(<li key={key}>{blockNodes(el, key)}</li>);
        break;
      case 'BLOCKQUOTE':
        out.push(<blockquote key={key}>{blockNodes(el, key)}</blockquote>);
        break;
      case 'TABLE':
        out.push(
          <table key={key}>
            <tbody>{blockNodes(el, key)}</tbody>
          </table>,
        );
        break;
      case 'TR': {
        const cells = Array.from(el.children).map((c, ci) =>
          c.tagName === 'TH'
            ? <th key={ci}>{blockNodes(c, `${key}-c${ci}`)}</th>
            : <td key={ci}>{blockNodes(c, `${key}-c${ci}`)}</td>,
        );
        out.push(<tr key={key}>{cells}</tr>);
        break;
      }
      case 'DIV': {
        if (el.classList.contains('callout-box')) {
          const variant = el.getAttribute('data-variant') ?? 'concept';
          const title = el.getAttribute('data-title') || '';
          out.push(
            <div key={key} className={`callout-box callout-${variant}`} data-variant={variant} data-title={title}>
              <div className="callout-head">
                <span className="callout-badge">{title || (variant === 'warning' ? 'সতর্কতা' : variant === 'formula' ? 'সূত্র' : variant === 'note' ? 'নোট' : 'মূল ধারণা')}</span>
              </div>
              <div className="callout-content">{blockNodes(el, key)}</div>
            </div>,
          );
        } else if (el.classList.contains('mcq-block')) {
          const data = parseMcqData(el as HTMLElement);
          out.push(
            <div key={key} className="mcq-block" data-question={data.question}>
              <div className="mcq-head"><span className="mcq-tag">প্রশ্ন</span></div>
              <div className="mcq-view">
                <p className="mcq-question">{data.question}</p>
                <div className="mcq-options">
                  {data.options.map((opt, oi) => (
                    <span key={oi} className={data.answer === oi ? 'mcq-option mcq-answer' : 'mcq-option'}>
                      <b>({OPTION_LABELS[oi]})</b> {opt || '—'}
                    </span>
                  ))}
                </div>
                {data.explanation ? <p className="mcq-expl">💡 {data.explanation}</p> : null}
              </div>
            </div>,
          );
        } else if (el.classList.contains('toc-block')) {
          let entries: Array<{ text: string; level: number; pageNumber: string }> = [];
          try {
            const parsed: unknown = JSON.parse(el.getAttribute('data-entries') ?? '[]');
            if (Array.isArray(parsed)) entries = parsed as typeof entries;
          } catch { /* উপেক্ষা */ }
          out.push(
            <div key={key} className="toc-block">
              <div className="toc-head"><span className="toc-title">{el.getAttribute('data-title') ?? 'সূচিপত্র'}</span></div>
              <ol className="toc-list">
                {entries.map((e, ei) => (
                  <li key={ei} className={`toc-entry toc-level-${e.level}`}>
                    <span className="toc-text">{e.text}</span>
                    <span className="toc-dots" />
                    <span className="toc-page">{e.pageNumber}</span>
                  </li>
                ))}
              </ol>
            </div>,
          );
        } else {
          out.push(<div key={key}>{blockNodes(el, key)}</div>);
        }
        break;
      }
      case 'HR':
        out.push(<hr key={key} className="fancy-divider" data-style={el.getAttribute('data-style') ?? 'single'} />);
        break;
      default:
        out.push(<div key={key}>{blockNodes(el, key)}</div>);
    }
  });
  return out;
}

export function StaticContent({ html }: { html: string }) {
  const doc = typeof DOMParser !== 'undefined'
    ? new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
    : null;
  if (!doc) return null;
  const root = doc.getElementById('root');
  if (!root) return null;
  return <div className="bwp-static">{blockNodes(root, 'sc')}</div>;
}
