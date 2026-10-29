import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { RawLoanInputs } from '@/core/loan/types';
import { defaultState } from './defaults';
import { migrate, sanitize, SCHEMA_VERSION } from './migrations';
import { logDev, mmkvStorage } from './storage';
import { ACCENTS, type Accent, type LoanDraft, type PersistedStateV1, type SavedLoan, type Settings } from './types';

export const MAX_RECENT_BANKS = 10;

type Actions = {
  addLoan: (draft: LoanDraft) => SavedLoan;
  updateLoan: (id: string, draft: LoanDraft) => void;
  /** Removes a loan and returns it with its position, so it can be undone. */
  deleteLoan: (id: string) => { loan: SavedLoan; index: number } | null;
  restoreLoan: (loan: SavedLoan, index?: number) => void;
  clearAllLoans: () => void;
  setSettings: (patch: Partial<Settings>) => void;
  setCalculatorDraft: (draft: RawLoanInputs) => void;
};

export type StoreState = PersistedStateV1 & Actions;

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function pushRecentBank(list: string[], name: string): string[] {
  const trimmed = name.trim();
  const rest = list.filter(n => n.toLowerCase() !== trimmed.toLowerCase());
  return [trimmed, ...rest].slice(0, MAX_RECENT_BANKS);
}

const clean = (draft: LoanDraft): LoanDraft => ({
  ...draft,
  bankName: draft.bankName.trim(),
  nickname: draft.nickname?.trim() || undefined,
});

/** Next card colour, rotating by the number of saved loans. */
export const nextAccent = (count: number): Accent => ACCENTS[count % ACCENTS.length] as Accent;

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      ...defaultState(),

      addLoan: draft => {
        const now = Date.now();
        const loan: SavedLoan = { ...clean(draft), id: newId(), createdAt: now, updatedAt: now };
        set(s => ({ loans: [...s.loans, loan], recentBankNames: pushRecentBank(s.recentBankNames, loan.bankName) }));
        return loan;
      },

      updateLoan: (id, draft) => {
        const c = clean(draft);
        set(s => ({
          loans: s.loans.map(l => (l.id === id ? { ...l, ...c, nickname: c.nickname, updatedAt: Date.now() } : l)),
          recentBankNames: pushRecentBank(s.recentBankNames, c.bankName),
        }));
      },

      deleteLoan: id => {
        const index = get().loans.findIndex(l => l.id === id);
        const loan = get().loans[index];
        if (!loan) {
          return null;
        }
        set(s => ({ loans: s.loans.filter(l => l.id !== id) }));
        return { loan, index };
      },

      restoreLoan: (loan, index) => {
        set(s => {
          if (s.loans.some(l => l.id === loan.id)) {
            return s;
          }
          const loans = [...s.loans];
          loans.splice(index ?? loans.length, 0, loan);
          return { loans };
        });
      },

      clearAllLoans: () => set({ loans: [] }),
      setSettings: patch => set(s => ({ settings: { ...s.settings, ...patch } })),
      setCalculatorDraft: draft => set({ calculatorDraft: draft }),
    }),
    {
      name: 'kisti-state',
      version: SCHEMA_VERSION,
      storage: createJSONStorage(() => mmkvStorage),
      partialize: s => ({
        schemaVersion: s.schemaVersion,
        settings: s.settings,
        loans: s.loans,
        calculatorDraft: s.calculatorDraft,
        recentBankNames: s.recentBankNames,
      }),
      migrate,
      merge: (persisted, current) => ({ ...current, ...sanitize(persisted) }),
      onRehydrateStorage: () => (_state, error) => {
        if (error) {
          logDev('rehydrate failed; using defaults', error);
        }
      },
    },
  ),
);
