/**
 * AI চ্যাট স্টেট — সেশন-বহুল কথোপকথন (মেমোরিতে)
 * ─────────────────────────────────────────────
 * গোপনীয়তা: বইয়ের লেখা ও কথোপকথন localStorage-এ সংরক্ষিত হয় না —
 * ট্যাব বন্ধ করলেই মুছে যায়। ব্যবহারকারীর API Key এখানে আসেই না।
 */

'use client';

import { create } from 'zustand';
import type { ChatMessage } from './ai-assistant';

export interface ChatEntry extends ChatMessage {
  id: string;
  ts: number;
  /** বিল্ট-ইন ডেমো দিয়ে উত্তর হয়েছে (কি ছিল না) */
  demo?: boolean;
}

let seq = 0;
const mkId = () => `msg-${Date.now().toString(36)}-${(seq++).toString(36)}`;

interface AiChatState {
  messages: ChatEntry[];
  sending: boolean;
  /** প্যানেলে ইনপুটে প্রি-ফিল (সিলেকশন উদ্ধৃত করতে) */
  draft: string;
  addUser: (text: string) => void;
  addAssistant: (text: string, demo?: boolean) => void;
  setSending: (v: boolean) => void;
  setDraft: (v: string) => void;
  clear: () => void;
}

export const useAiChatStore = create<AiChatState>((set) => ({
  messages: [],
  sending: false,
  draft: '',
  addUser: (text) =>
    set((s) => ({ messages: [...s.messages, { id: mkId(), role: 'user', content: text, ts: Date.now() }] })),
  addAssistant: (text, demo) =>
    set((s) => ({
      messages: [...s.messages, { id: mkId(), role: 'assistant', content: text, ts: Date.now(), demo }],
    })),
  setSending: (sending) => set({ sending }),
  setDraft: (draft) => set({ draft }),
  clear: () => set({ messages: [], draft: '' }),
}));
