/**
 * দিন ৬৩ — প্রেজেন্স-অনলি সহযোগিতা সার্ভিস (Yjs-ফলব্যাক ধাপ-১)
 *
 * নীতি:
 *  - শুধুই প্রেজেন্স — কে এই ডকুমেন্টে আছে, কে লিখছে। কনটেন্ট কখনো এই সার্ভারে আসে না।
 *    (local-first অক্ষত: সার্ভিস বন্ধ থাকলে অ্যাপ পুরোদমে কাজ করে, প্রেজেন্স-ব্যাজ শুধু চুপচাপ নেই)
 *  - ইন-মেমরি — কোনো ডিস্ক/ডেটাবেস নেই; সার্ভিস রিস্টার্ট = সবাই ২ সেকেন্ডে আবার যুক্ত (অটো-রিকানেক্ট)।
 *  - রুম = `doc:{projectId}`; সানিটাইজড নাম/রং; রুম-ক্যাপ ৫০; স্টেল-সুইপ ১৫ সে; টাইপিং-স্টেল ৪ সে।
 *
 * চলবে: `bun run dev` (bun --hot index.ts) — পোর্ট ৩০০৪ (অপরিবর্তনীয়)
 * গেটওয়ে: ফ্রন্টএন্ড সংযোগ `io("/?XTransformPort=3004")` — Caddy রিভার্স-প্রক্সি (WS আপগ্রেডসহ)
 */

import { createServer } from 'node:http';
import { Server } from 'socket.io';

const PORT = 3004;
const ROOM_PREFIX = 'doc:';
const ROOM_CAP = 50;
const STALE_MS = 15_000; // হার্টবিটহীন পিয়ার বাদ
const TYPING_STALE_MS = 4_000; // টাইপিং নিজে থেকেই বন্ধ
const SWEEP_MS = 2_000;

interface PeerUser {
  id: string;
  name: string;
  color: string;
}
interface Peer {
  user: PeerUser;
  typing: boolean;
  typingAt: number;
  lastSeen: number;
}

/** roomId → (socketId → Peer) */
const rooms = new Map<string, Map<string, Peer>>();

const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const DEFAULT_COLOR = '#059669';
const sanitizeUser = (raw: unknown): PeerUser | null => {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  const id = typeof u.id === 'string' ? u.id.slice(0, 64) : '';
  if (!id) return null;
  const name = typeof u.name === 'string' && u.name.trim() ? u.name.trim().slice(0, 40) : '—';
  const color = typeof u.color === 'string' && COLOR_RE.test(u.color) ? u.color : DEFAULT_COLOR;
  return { id, name, color };
};
const sanitizeDocId = (raw: unknown): string | null => {
  if (typeof raw !== 'string') return null;
  const s = raw.slice(0, 80);
  return /^[a-zA-Z0-9:_-]+$/.test(s) ? s : null;
};

function statePayload(roomId: string): { v: number; users: (PeerUser & { typing: boolean })[] } {
  const peers = rooms.get(roomId);
  return {
    v: 1,
    users: peers ? Array.from(peers.values()).map((p) => ({ ...p.user, typing: p.typing })) : [],
  };
}

/** রুমের পূর্ণ অবস্থা — প্রতিটি পরিবর্তনে রুমে ব্রডকাস্ট */
function broadcastState(io: Server, roomId: string): void {
  io.to(roomId).emit('state', statePayload(roomId));
}

function dropSocket(io: Server, roomId: string, socketId: string): void {
  const peers = rooms.get(roomId);
  if (!peers) return;
  if (peers.delete(socketId)) {
    if (peers.size === 0) rooms.delete(roomId);
    else broadcastState(io, roomId);
  }
}

const httpServer = createServer((req, res) => {
  // সকেট-পথের বাইরে সব কিছু → ছোট হেলথ জেসন (মনিটরিং-এর জন্য)
  res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  const total = Array.from(rooms.values()).reduce((n, m) => n + m.size, 0);
  res.end(
    JSON.stringify({
      ok: true,
      service: 'presence',
      rooms: rooms.size,
      peers: total,
      uptime: Math.round(process.uptime()),
    }),
  );
});

const io = new Server(httpServer, {
  cors: { origin: true, methods: ['GET', 'POST'] },
  // গেটওয়ে-বান্ধব: পোলিং আগে, পরে WS-আপগ্রেড
  transports: ['polling', 'websocket'],
  pingInterval: 10_000,
  pingTimeout: 20_000,
  maxHttpBufferSize: 4_096, // প্রেজেন্স-পেলোড ক্ষুদ্র — বড় ফ্রেম দরকারই নেই
});

io.on('connection', (socket) => {
  socket.data.docId = null as string | null;

  socket.on('hello', (raw: unknown) => {
    const user = sanitizeUser((raw as { user?: unknown })?.user);
    const docId = sanitizeDocId((raw as { docId?: unknown })?.docId);
    if (!user || !docId) return;
    const roomId = ROOM_PREFIX + docId;

    // পুরনো রুম থেকে বেরোনো (প্রজেক্ট সুইচ)
    if (socket.data.docId && socket.data.docId !== docId) {
      dropSocket(io, ROOM_PREFIX + socket.data.docId, socket.id);
      socket.leave(ROOM_PREFIX + socket.data.docId);
    }

    let peers = rooms.get(roomId);
    if (!peers) {
      peers = new Map();
      rooms.set(roomId, peers);
    }
    if (!peers.has(socket.id) && peers.size >= ROOM_CAP) {
      socket.emit('room-full', { roomId });
      return;
    }

    socket.data.docId = docId;
    socket.join(roomId);
    peers.set(socket.id, { user, typing: false, typingAt: 0, lastSeen: Date.now() });
    broadcastState(io, roomId);
  });

  socket.on('typing', (raw: unknown) => {
    const docId = socket.data.docId as string | null;
    if (!docId) return;
    const peers = rooms.get(ROOM_PREFIX + docId);
    const peer = peers?.get(socket.id);
    if (!peer) return;
    peer.lastSeen = Date.now();
    const typing = raw === true;
    if (typing) {
      peer.typing = true;
      peer.typingAt = Date.now();
      broadcastState(io, ROOM_PREFIX + docId);
    } else if (peer.typing) {
      peer.typing = false;
      broadcastState(io, ROOM_PREFIX + docId);
    }
  });

  // যেকোনো অ্যাপ-লেভেল সিগন্যাল = প্রাণবন্ত প্রমাণ
  socket.on('heartbeat', () => {
    const docId = socket.data.docId as string | null;
    if (!docId) return;
    const peer = rooms.get(ROOM_PREFIX + docId)?.get(socket.id);
    if (peer) peer.lastSeen = Date.now();
  });

  socket.on('disconnect', () => {
    const docId = socket.data.docId as string | null;
    if (docId) dropSocket(io, ROOM_PREFIX + docId, socket.id);
  });
});

// স্টেল-সুইপ: মৃত-সংযোগ/জমবোস প্রক্সির খোঁড়া পিয়ার + মেয়াদোত্তীর্ণ টাইপিং
setInterval(() => {
  const now = Date.now();
  for (const [roomId, peers] of rooms) {
    let dirty = false;
    for (const [sid, peer] of peers) {
      if (now - peer.lastSeen > STALE_MS) {
        peers.delete(sid);
        dirty = true;
      } else if (peer.typing && now - peer.typingAt > TYPING_STALE_MS) {
        peer.typing = false;
        dirty = true;
      }
    }
    if (peers.size === 0) {
      rooms.delete(roomId);
      dirty = false; // খালি রুম — ব্রডকাস্টের দরকার নেই
    }
    if (dirty) broadcastState(io, roomId);
  }
}, SWEEP_MS);

httpServer.listen(PORT, () => {
  console.log(`[presence-service] listening on :${PORT} — rooms are in-memory, content never touches this server`);
});
