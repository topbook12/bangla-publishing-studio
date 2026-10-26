/**
 * ক্লাউড-সিঙ্ক ক্লায়েন্ট — local-first অক্ষুণ্ণ
 *
 * নীতি: ডকুমেন্টের প্রাথমিক স্টোর সবসময় ব্রাউজারের Dexie (IndexedDB)।
 * এই মডিউল শুধু অপশনাল মিরর — সাইন-ইন থাকলে ক্লাউডে তুলে রাখে, শেয়ার
 * লিংক বানায়। অফলাইনে বা 401-এ সব চুপচাপ বাদ — অ্যাপ আগের মতোই চলে।
 */

'use client';

import { useEditorStore } from './store';
import type { DocumentSettings, PageData } from './types';
import { track } from './analytics';

export interface CloudDocMeta {
  id: string;
  title: string;
  version: number;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

/** লোকাল প্রজেক্ট → ক্লাউড ডক আইডি ম্যাপিং (localStorage) */
const MAP_KEY = 'bwp-cloud-map';

function readMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(MAP_KEY) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

function writeMap(map: Record<string, string>): void {
  try { localStorage.setItem(MAP_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}

export function getCloudIdFor(localProjectId: string): string | null {
  return readMap()[localProjectId] ?? null;
}

function setCloudIdFor(localProjectId: string, cloudId: string): void {
  const map = readMap();
  map[localProjectId] = cloudId;
  writeMap(map);
}

export type PushResult =
  | { status: 'saved'; meta: CloudDocMeta }
  | { status: 'conflict'; current: CloudDocMeta & { version: number } }
  | { status: 'signin' | 'offline' | 'error' };

/** বর্তমান ডকুমেন্ট ক্লাউডে সেভ (আপসার্ট) */
export async function pushCurrentDoc(): Promise<PushResult> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { status: 'offline' };

  const { projectId, title, settings, pages } = useEditorStore.getState();
  if (!projectId) return { status: 'error' };

  const payloadData = JSON.stringify({ settings, pages });
  const cloudId = getCloudIdFor(projectId);
  const baseVersion = readVersion(cloudId);

  try {
    const res = await fetch('/api/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cloudId ?? undefined, title, data: payloadData, baseVersion }),
    });
    if (res.status === 401) return { status: 'signin' };
    if (res.status === 409) {
      const body = (await res.json()) as { current?: CloudDocMeta };
      return { status: 'conflict', current: body.current as CloudDocMeta & { version: number } };
    }
    if (!res.ok) return { status: 'error' };
    const body = (await res.json()) as { document: CloudDocMeta };
    setCloudIdFor(projectId, body.document.id);
    writeVersion(body.document.id, body.document.version);
    track('cloud_doc_save');
    return { status: 'saved', meta: body.document };
  } catch {
    return { status: 'error' };
  }
}

/** সংস্করণ-ক্যাশ — baseVersion যাচাইয়ের জন্য */
const VER_KEY = 'bwp-cloud-ver';

function readVersions(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(VER_KEY) ?? '{}') as Record<string, number>;
  } catch {
    return {};
  }
}

function readVersion(cloudId: string | null): number | undefined {
  if (!cloudId) return undefined;
  return readVersions()[cloudId];
}

function writeVersion(cloudId: string, version: number): void {
  try {
    const v = readVersions();
    v[cloudId] = version;
    localStorage.setItem(VER_KEY, JSON.stringify(v));
  } catch { /* ignore */ }
}

export interface CloudDocFull {
  id: string;
  title: string;
  version: number;
  data: string;
  updatedAt: string;
}

/** ক্লাউড তালিকা — 401 হলে null (সাইন-ইন প্রম্পট দেখাবে) */
export async function listCloudDocs(): Promise<CloudDocMeta[] | null> {
  try {
    const res = await fetch('/api/documents');
    if (res.status === 401) return null;
    if (!res.ok) return [];
    const body = (await res.json()) as { documents: CloudDocMeta[] };
    return body.documents;
  } catch {
    return [];
  }
}

/** ক্লাউড ডক খুলে নতুন লোকাল প্রজেক্ট হিসেবে ইমপোর্ট */
export async function pullCloudDoc(cloudId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/documents/${cloudId}`);
    if (!res.ok) return false;
    const body = (await res.json()) as { document: CloudDocFull };
    const parsed = JSON.parse(body.document.data) as {
      settings?: DocumentSettings;
      pages?: PageData[];
    };
    if (!parsed.pages?.length) return false;
    writeVersion(cloudId, body.document.version);
    await useEditorStore.getState().loadCloudProject(
      body.document.title,
      parsed.settings ?? ({} as DocumentSettings),
      parsed.pages,
    );
    return true;
  } catch {
    return false;
  }
}

export async function deleteCloudDoc(cloudId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/documents/${cloudId}`, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

export type ShareResult =
  | { status: 'ok'; isPublic: boolean; shareToken: string | null }
  | { status: 'signin' | 'error' };

/** শেয়ার টগল/রোটেট */
export async function setShare(cloudId: string, enabled: boolean, rotate = false): Promise<ShareResult> {
  try {
    const res = await fetch('/api/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId: cloudId, enabled, rotate }),
    });
    if (res.status === 401) return { status: 'signin' };
    if (!res.ok) return { status: 'error' };
    const body = (await res.json()) as { document: { isPublic: boolean; shareToken: string | null } };
    if (body.document.isPublic) track('share_created');
    return { status: 'ok', isPublic: body.document.isPublic, shareToken: body.document.shareToken };
  } catch {
    return { status: 'error' };
  }
}

/** শেয়ার URL তৈরি (একই origin — ?share=<token>) */
export function shareUrl(token: string): string {
  try {
    return `${window.location.origin}/?share=${encodeURIComponent(token)}`;
  } catch {
    return `/?share=${encodeURIComponent(token)}`;
  }
}

/** অটো-সিঙ্ক — লোকাল সেভ 'saved' হলে প্রতি ৩০ সেকেন্ডে সর্বোচ্চ একবার পুশ */
let lastAutoPush = 0;

export function maybeAutoPush(): void {
  try {
    const flag = localStorage.getItem('bwp-autosync') === '1';
    if (!flag) return;
    const now = Date.now();
    if (now - lastAutoPush < 30_000) return;
    lastAutoPush = now;
    void pushCurrentDoc();
  } catch { /* ignore */ }
}
