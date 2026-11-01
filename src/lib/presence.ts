/**
 * দিন ৬৩ — প্রেজেন্স-অনলি সহযোগিতা (Yjs-ফলব্যাক ধাপ-১) — ক্লায়েন্ট লাইব্রেরি
 *
 * নীতি (local-first অক্ষত):
 *  - এই লাইব্রেরি কেবল উপস্থিতির সংকেত আদান-প্রদান করে (নাম + রং + টাইপিং) —
 *    ডকুমেন্টের একটি অক্ষরও কোথাও যায় না।
 *  - সার্ভিস বন্ধ থাকলে status='offline' — সম্পাদনা পুরোদমে স্থানীয়; ব্যাজ চুপচাপ নিজেকে লুকায়।
 *  - সংযোগ: `io("/?XTransformPort=3004")` — গেটওয়ে Caddy reverse-proxy (WS আপগ্রেডসহ)।
 *
 * পরিচয়: localStorage `bps.presence.identity.v1` — {id, name, color};
 * ডিফল্ট নাম ত্রিভাষিক 'অতিথি ৭৪২'-ধাঁচে, ব্যবহারকারী যেকোনো সময় বদলাতে পারেন।
 */

'use client';

import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import { t } from '@/lib/i18n';

// ─── ধ্রুবক ───
const SOCKET_URI = '/?XTransformPort=3004';
const LS_KEY = 'bps.presence.identity.v1';
const HEARTBEAT_MS = 8_000;
const TYPING_STOP_MS = 2_500; // শেষ কিস্ট্রোর এত পরে টাইপিং বন্ধ
const TYPING_KEEPALIVE_MS = 1_500; // চলমান টাইপিং জীবিত রাখার পুনঃ-এমিট

/** সবুজ-ব্র্যান্ড-প্রথম প্যালেট — ৮ স্বতন্ত্র হিউ (নীল/ইন্ডিগো নীতিগতভাবে বাদ) */
export const PRESENCE_COLORS = [
  '#059669', // emerald-600 (ব্র্যান্ড)
  '#0d9488', // teal-600
  '#65a30d', // lime-600
  '#d97706', // amber-600
  '#e11d48', // rose-600
  '#7c3aed', // violet-600
  '#0e7490', // cyan-700
  '#ea580c', // orange-600
] as const;

// ─── টাইপ ───
export type PresenceStatus = 'connecting' | 'online' | 'offline' | 'full';
export interface PresencePeer {
  id: string;
  name: string;
  color: string;
  typing: boolean;
}
export interface PresenceIdentity {
  id: string;
  name: string;
  color: string;
}

interface PresenceState {
  status: PresenceStatus;
  /** নিজেকে বাদে, user.id-দিয়ে dedup করা তালিকা */
  peers: PresencePeer[];
  /** SSR-নিরাপদ: hydrate() না হওয়া পর্যন্ত null */
  identity: PresenceIdentity | null;
  docId: string | null;
  hydrate: () => void;
  join: (docId: string | null) => void;
  setIdentity: (patch: Partial<Pick<PresenceIdentity, 'name' | 'color'>>) => void;
}

// ─── পরিচয় ───
const randomSuffix = (): string => String(100 + Math.floor(Math.random() * 900));

function loadIdentity(): PresenceIdentity {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PresenceIdentity>;
      if (p && typeof p.id === 'string' && p.id && typeof p.name === 'string' && p.name) {
        return {
          id: p.id.slice(0, 64),
          name: p.name.slice(0, 40),
          color:
            typeof p.color === 'string' && PRESENCE_COLORS.includes(p.color as (typeof PRESENCE_COLORS)[number])
              ? p.color
              : PRESENCE_COLORS[0],
        };
      }
    }
  } catch {
    /* দূষিত স্টোরেজ — নতুন করে তৈরি */
  }
  const fresh: PresenceIdentity = {
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    name: `${t('pr.anon')} ${randomSuffix()}`,
    color: PRESENCE_COLORS[Math.floor(Math.random() * PRESENCE_COLORS.length)],
  };
  saveIdentity(fresh);
  return fresh;
}

function saveIdentity(id: PresenceIdentity): void {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(id));
  } catch {
    /* প্রাইভেট-মোড — মেমরিতেই থাক */
  }
}

/** অ্যাভাটারের প্রথম অক্ষর — যুক্তাক্ষর-সচেতন (Intl.Segmenter) */
export function initialOf(name: string): string {
  const clean = (name || '?').trim();
  if (!clean) return '?';
  const SegCtor = (
    Intl as unknown as {
      Segmenter?: new (
        locale: string,
        opts: { granularity: 'grapheme' },
      ) => { segment(s: string): Iterable<{ segment: string }> };
    }
  ).Segmenter;
  if (SegCtor) {
    const seg = new SegCtor('bn', { granularity: 'grapheme' });
    const first = seg.segment(clean)[Symbol.iterator]().next();
    if (!first.done) return first.value.segment;
  }
  return Array.from(clean)[0];
}

// ─── সকেট সিঙ্গলটন ───
let socket: Socket | null = null;

function getSocket(): Socket {
  if (socket) return socket;
  socket = io(SOCKET_URI, {
    // XTransformPort দ্বিগুণ-ঢাকা: URI-কোয়েরি + opts.query — পার্সার-পথ যা-ই হোক, গেটওয়ে পাবে
    query: { XTransformPort: '3004' },
    reconnectionDelay: 600,
    reconnectionDelayMax: 5_000,
    timeout: 6_000,
  });

  socket.on('connect', () => {
    usePresenceStore.setState({ status: 'online' });
    helloNow();
  });
  socket.on('connect_error', () => {
    usePresenceStore.setState({ status: 'offline' });
  });
  socket.on('disconnect', (reason) => {
    usePresenceStore.setState({ status: reason === 'io server disconnect' ? 'offline' : 'connecting' });
  });
  socket.on('room-full', () => {
    usePresenceStore.setState({ status: 'full' });
  });
  socket.on('state', (payload: { v?: number; users?: PresencePeer[] }) => {
    const st = usePresenceStore.getState();
    if (!payload || !Array.isArray(payload.users)) return;
    const me = st.identity;
    const byId = new Map<string, PresencePeer>();
    for (const u of payload.users) {
      if (!u || typeof u.id !== 'string' || !u.id) continue;
      if (me && u.id === me.id) continue; // নিজেকে বাদ
      const prev = byId.get(u.id);
      if (prev) {
        // একই ব্যবহারকারীর অন্য ট্যাব — একটাই চিপ; টাইপিং-নিশ্চিত যে-কোনো সংযোগ থেকে মিলিয়ে নেওয়া
        byId.set(u.id, { ...prev, typing: prev.typing || u.typing === true });
      } else {
        byId.set(u.id, { id: u.id, name: String(u.name ?? '—'), color: String(u.color ?? '#059669'), typing: u.typing === true });
      }
    }
    usePresenceStore.setState({
      peers: Array.from(byId.values()),
      // room-full থেকে ফেরা — সার্ভার আবার state পাঠালে স্বাভাবিক
      status: st.status === 'full' ? 'online' : st.status,
    });
  });
  return socket;
}

/** বর্তমান identity + docId দিয়ে hello — সংযোগ ও রুম-পরিবর্তন দুই ক্ষেত্রেই */
function helloNow(): void {
  const s = usePresenceStore.getState();
  if (!s.identity || !s.docId || !socket?.connected) return;
  socket.emit('hello', { docId: s.docId, user: s.identity });
}

// ─── টাইপিং-সংকেত (মডিউল-লেভেল থ্রটল) ───
let typingActive = false;
let lastTypingEmit = 0;
let typingStopTimer: ReturnType<typeof setTimeout> | null = null;

function emitTyping(on: boolean): void {
  if (socket?.connected) socket.emit('typing', on);
}

/** সম্পাদনা-সংকেত: প্রথম কিস্ট্রোতে সঙ্গে সঙ্গে true, চলমান হলে ১.৫ সে-প্রতি কিপ-অ্যালাইভ, ২.৫ সে নীরবতায় false */
export function notifyTyping(): void {
  const s = usePresenceStore.getState();
  if (s.status !== 'online' || !s.docId) return;
  const now = Date.now();
  if (!typingActive || now - lastTypingEmit > TYPING_KEEPALIVE_MS) {
    typingActive = true;
    lastTypingEmit = now;
    emitTyping(true);
  }
  if (typingStopTimer) clearTimeout(typingStopTimer);
  typingStopTimer = setTimeout(() => {
    typingActive = false;
    emitTyping(false);
  }, TYPING_STOP_MS);
}

let watcherInstalled = false;
/** প্রথম PresenceBar মাউন্টে একবারই — ক্যাপচার-ফেজ keydown শুধু পড়ে, কখনো preventDefault নয় */
function installTypingWatcher(): void {
  if (watcherInstalled || typeof document === 'undefined') return;
  watcherInstalled = true;
  document.addEventListener(
    'keydown',
    (e) => {
      const el = e.target as HTMLElement | null;
      if (!el) return;
      if (el.isContentEditable || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        notifyTyping();
      }
    },
    { capture: true, passive: true },
  );
}

// ─── হার্টবিট (স্টেল-সুইপ নেট) ───
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
function ensureHeartbeat(): void {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    if (socket?.connected) socket.emit('heartbeat');
  }, HEARTBEAT_MS);
}

// ─── স্টোর ───
export const usePresenceStore = create<PresenceState>((set, get) => ({
  status: 'connecting',
  peers: [],
  identity: null,
  docId: null,

  hydrate: () => {
    if (!get().identity) set({ identity: loadIdentity() });
    const s = getSocket();
    ensureHeartbeat();
    installTypingWatcher();
    // leavePresence() দিয়ে স্পষ্ট disconnect হলে পুনঃসংযোগ
    if (!s.connected) s.connect();
    helloNow();
  },

  join: (docId) => {
    if (get().docId === docId) return;
    // পিয়ার-তালিকা নতুন রুমের জন্য ঝালাই; status 'connect'/'state'-ই ঠিক করবে
    set({ docId, peers: [] });
    helloNow();
  },

  setIdentity: (patch) => {
    const cur = get().identity;
    if (!cur) return;
    const name = (patch.name ?? cur.name).trim().slice(0, 40) || cur.name;
    const color =
      patch.color && PRESENCE_COLORS.includes(patch.color as (typeof PRESENCE_COLORS)[number])
        ? patch.color
        : cur.color;
    const next = { ...cur, name, color };
    saveIdentity(next);
    set({ identity: next });
    helloNow(); // সার্ভারের এন্ট্রি হালনাগাদ + রুম-রিব্রডকাস্ট
  },
}));

/** studio ভিউ ছাড়ার সময় — স্পষ্ট বিচ্ছিন্ন: 'মানুষ চলে গেছে' সঙ্গে সঙ্গে সবার কাছে পৌঁছায় */
export function leavePresence(): void {
  typingActive = false;
  if (typingStopTimer) {
    clearTimeout(typingStopTimer);
    typingStopTimer = null;
  }
  if (socket?.connected) socket.disconnect();
  usePresenceStore.setState({ docId: null, peers: [], status: 'connecting' });
}
