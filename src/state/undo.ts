import { create } from 'zustand';
import type { SavedLoan } from './types';

type Pending = { loan: SavedLoan; index: number; key: number };

/** The loan deleted last, kept in memory for the 5 s Undo window (never persisted). */
export const useUndo = create<{ pending: Pending | null; set: (p: Omit<Pending, 'key'> | null) => void }>(set => ({
  pending: null,
  set: p => set({ pending: p ? { ...p, key: Date.now() } : null }),
}));
