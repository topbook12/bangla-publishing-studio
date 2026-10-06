/**
 * AI বাবল (সিলেকশন টুল) — ছোট স্টেট স্টোর
 * ────────────────────────────────────────
 * কনটেক্সট-মেনু/রিবন থেকে সরাসরি AI বাবল প্যানেল খোলার সেতু।
 * ভাসমান পিল (সিলেকশনে অটো) AiBubbleHost নিজেই ট্র্যাক করে — এই স্টোর
 * শুধু প্রোগ্রামেটিক ওপেন-রিকোয়েস্ট বহন করে।
 */

'use client';

import { create } from 'zustand';
import type { Editor } from '@tiptap/react';

/** বাবলের প্রি-সেট করা চালানোর মোড */
export type AiBubbleMode =
  | 'improve'
  | 'grammar'
  | 'translate-en'
  | 'translate-bn'
  | 'translate-hi'
  | 'shorten'
  | 'expand'
  | 'simplify'
  | 'formal'
  | 'make-table'
  | 'bullets'
  | 'explain'
  | 'verify'
  | 'continue'
  | 'custom'
  | 'image-explain'
  | 'table-edit';

export interface AiBubbleRequest {
  editor: Editor;
  /** স্ক্রিন কোঅর্ডিনেট — প্যানেল এখানেই খুলবে */
  x: number;
  y: number;
  /** প্রি-সেট মোড (দিলে প্যানেল খুলেই সেটা হাইলাইট করবে) */
  mode?: AiBubbleMode;
  /** প্রি-সেট নির্দেশ (custom মোডে ইনপুটে বসবে) */
  instruction?: string;
  /** ক্লিক করা ছবির dataURL (image-explain মোড) */
  imageDataUrl?: string;
  /** টেবিল-এডিট মোডে ধরা টেবিলের সারি (প্রতিটি সারি = সেল-টেক্সট অ্যারে) */
  tableContext?: string[][];
  /** টেবিল-এডিট মোডে বদলানোর টেবিলের ডকুমেন্ট রেঞ্জ */
  tableRange?: { from: number; to: number };
  /** ছবির ঠিক পরে কনটেন্ট বসানোর পজিশন (image-explain) */
  insertAfterPos?: number;
}

interface AiBubbleState {
  req: AiBubbleRequest | null;
  /** বাইরের কোনো মেনু থেকে বাবল খোলা */
  open: (req: AiBubbleRequest) => void;
  close: () => void;
}

export const useAiBubbleStore = create<AiBubbleState>((set) => ({
  req: null,
  open: (req) => set({ req }),
  close: () => set({ req: null }),
}));

/** কনটেক্সট-মেনু ইত্যাদি থেকে এক কলে বাবল খোলার শর্টকাট */
export function openAiBubble(req: AiBubbleRequest): void {
  useAiBubbleStore.getState().open(req);
}
