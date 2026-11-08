/**
 * দিন ৭৩–৭৪ — প্রেজেন্স-কার্সর লেয়ার — দূরবর্তী পিয়ারদের কার্সর কাগজের উপর ছোট
 * ত্রিভুজ-নিশান + নাম-পতাকা হিসেবে।
 *
 * নীতি (local-first অক্ষুণ্ণ):
 *  - সংকেত কনটেন্ট-নিরপেক্ষ: {pageId, fx, fy} — পাতা-সাপেক্ষ ভগ্রাংশ-স্থানাঙ্ক,
 *    তাই zoom/scroll/কাগজ-মাপ যা-ই হোক, নিশান সঠিক জায়গায় বসে।
 *  - প্রেরণ ১২০ms থ্রটল (presence.ts-এ); সার্ভিস বন্ধ থাকলে status ≠ online —
 *    লেয়ার নিজেই নিভে যায়, সম্পাদনা পুরোদমে স্থানীয়।
 *  - রেন্ডার রিঅ্যাকটিভ: কার্সর/পিয়ার/পাতা বদল + স্ক্রল/রিসাইজে পুনঃগণনা।
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useEditorStore } from '@/lib/store';
import { usePresenceStore } from '@/lib/presence';

/** স্ক্রল/রিসাইজ/কার্সর-বদলে পুনঃগণনা — সস্তা version-counter */
function useLayoutVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const bump = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setV((x) => x + 1));
    };
    window.addEventListener('scroll', bump, { capture: true, passive: true });
    window.addEventListener('resize', bump, { passive: true });
    const t = setInterval(bump, 400);
    return () => {
      window.removeEventListener('scroll', bump, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', bump);
      clearInterval(t);
      cancelAnimationFrame(raf);
    };
  }, []);
  return v;
}

/** fixed-layer-এর অভ্যন্তরীণ হোস্ট — scroller-এর ভিতরে থাকলে clip হয়, তাই body-তে portal */
function useBodyLayerHost(): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const el = document.createElement('div');
    el.className = 'pc-layer';
    document.body.appendChild(el);
    // setState effect-বডিতে সরাসরি নয় (cascading-render নিয়ম) — rAF-এ সেট
    const raf = requestAnimationFrame(() => setHost(el));
    return () => {
      cancelAnimationFrame(raf);
      el.remove();
    };
  }, []);
  return host;
}

export function PresenceCursorLayer() {
  const cursors = usePresenceStore((s) => s.cursors);
  const peers = usePresenceStore((s) => s.peers);
  const pages = useEditorStore((s) => s.pages);
  const version = useLayoutVersion();
  const host = useBodyLayerHost();

  // লোকাল পয়েন্টার → পাতা-সাপেক্ষ fx/fy → থ্রটলড এমিট (কেবল online-এ)
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = (e.target as HTMLElement | null)?.closest?.('.paper-page') as HTMLElement | null;
      if (!el) return;
      const idx = Number(el.dataset.pageIndex);
      const page = useEditorStore.getState().pages[idx];
      if (!page) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      usePresenceStore.getState().pushLocalCursor(
        page.id,
        Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)),
      );
    };
    document.addEventListener('pointermove', onMove, { capture: true, passive: true });
    return () => document.removeEventListener('pointermove', onMove, { capture: true } as EventListenerOptions);
  }, []);

  const positions = useMemo<Array<{
    key: string; left: number; top: number; name: string; color: string;
  }>>(() => {
    void version; // স্ক্রল/রিসাইজে পুনঃগণনা
    // কেবল peers>0-তেই রেন্ডার — status='connecting' মাইক্রো-রিকানেক্টেও নিশান নেড়ে না;
    // peers তালিকা আসেই কেবল রুম-স্টেট ব্রডকাস্ট থেকে (সংযোগের প্রমাণ)
    if (peers.length === 0) return [];
    const peerById = new Map(peers.map((p) => [p.id, p]));
    const out: Array<{ key: string; left: number; top: number; name: string; color: string }> = [];
    for (const c of cursors) {
      const peer = peerById.get(c.userId);
      if (!peer) continue; // পরিচিতি-বিহীন কার্সর — নাম/রং নেই, আঁকা হয় না
      const idx = pages.findIndex((p) => p.id === c.pageId);
      if (idx < 0) continue; // পাতা আর নেই (মুছে ফেলা) — বাদ
      const el = document.querySelector<HTMLElement>(`.paper-page[data-page-index="${idx}"]`);
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      // পাতার দৃশ্যমান অংশের বাইরে হলে ছাঁটা (overflow-এ নিশান ঝুলবে না)
      const left = r.left + Math.min(r.width, Math.max(0, c.fx * r.width));
      const top = r.top + Math.min(r.height, Math.max(0, c.fy * r.height));
      out.push({ key: c.userId, left, top, name: peer.name, color: peer.color });
    }
    return out;
  }, [cursors, peers, pages, version]);

  if (positions.length === 0 || !host) return null;

  return createPortal(
    <div aria-hidden="true">
      {positions.map((p) => (
        <div key={p.key} className="pc-cursor" style={{ left: p.left, top: p.top }}>
          <svg className="pc-cursor-arrow" width="14" height="17" viewBox="0 0 14 17">
            <path d="M1 1 L1 14.5 L4.6 11.2 L6.8 16 L9.4 14.9 L7.2 10.2 L12.4 10 Z" fill={p.color} stroke="white" strokeWidth="1" />
          </svg>
          <span className="pc-cursor-flag" style={{ backgroundColor: p.color }}>{p.name}</span>
        </div>
      ))}
    </div>,
    host,
  );
}
