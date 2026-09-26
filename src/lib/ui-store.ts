/**
 * UI ডায়ালগ স্টেট (আলাদা রাখা হয়েছে এডিটর স্টোর থেকে)
 */

'use client';

import { create } from 'zustand';

export type DialogName =
  | 'headerFooter'
  | 'cover'
  | 'projects'
  | 'review'
  | 'pageChrome'
  | 'templates'
  | 'findReplace'
  | 'help';

interface UiState {
  openDialog: DialogName | null;
  /** pageChrome ডায়ালগ কোন পাতার জন্য খোলা হয়েছে */
  pageChromeId: string | null;
  open: (name: DialogName) => void;
  openPageChrome: (pageId: string) => void;
  close: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  openDialog: null,
  pageChromeId: null,
  open: (name) => set({ openDialog: name }),
  openPageChrome: (pageId) => set({ openDialog: 'pageChrome', pageChromeId: pageId }),
  close: () => set({ openDialog: null, pageChromeId: null }),
}));
