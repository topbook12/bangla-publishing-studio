/**
 * পরিবেশে মাউন্ট করা সব পৃষ্ঠা-এডিটরের রেজিস্ট্রি।
 * রিবন কমান্ড ও অটো-ফ্লো ইঞ্জিন এর মাধ্যমে এডিটর খুঁজে নেয়।
 * (Zustand স্টোরে এডিটর অবজেক্ট রাখা হয় না — রি-রেন্ডার এড়াতে।)
 */

import type { Editor } from '@tiptap/react';

const editors = new Map<string, Editor>();

export function registerEditor(pageId: string, editor: Editor): void {
  editors.set(pageId, editor);
}

export function unregisterEditor(pageId: string): void {
  editors.delete(pageId);
}

export function getEditor(pageId: string | null | undefined): Editor | undefined {
  if (!pageId) return undefined;
  return editors.get(pageId);
}

export function getAllEditors(): Editor[] {
  return Array.from(editors.values());
}
