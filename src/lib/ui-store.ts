/**
 * UI ডায়ালগ স্টেট (আলাদা রাখা হয়েছে এডিটর স্টোর থেকে)
 */

'use client';

import { create } from 'zustand';

export type DialogName = 'headerFooter' | 'cover' | 'projects' | 'review';

interface UiState {
  openDialog: DialogName | null;
  open: (name: DialogName) => void;
  close: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  openDialog: null,
  open: (name) => set({ openDialog: name }),
  close: () => set({ openDialog: null }),
}));
