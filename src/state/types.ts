import type { Deductions, RawLoanInputs } from '@/core/loan/types';
import type { YearMonth } from '@/core/months';

export type ThemeSetting = 'system' | 'light' | 'dark';

export type Settings = {
  language: 'bn' | 'en';
  theme: ThemeSetting;
  bengaliDigits: boolean;
  sound: boolean;
  haptics: boolean;
  onboarded: boolean;
};

/** Card colours from the handoff (tokens.loanAccent), kept apart from the money colours. */
export const ACCENTS = ['nil', 'shimul', 'orchid', 'kadam', 'akash'] as const;
export type Accent = (typeof ACCENTS)[number];

export type SavedLoan = {
  id: string;
  bankName: string;
  nickname?: string;
  principal: number;
  annualRatePercent: number;
  tenureMonths: number;
  tenureUnitShown: 'years' | 'months';
  firstInstallmentMonth: YearMonth;
  deductions: Deductions;
  accent: Accent;
  createdAt: number;
  updatedAt: number;
};

export type LoanDraft = Omit<SavedLoan, 'id' | 'createdAt' | 'updatedAt'>;

export type PersistedStateV1 = {
  schemaVersion: 1;
  settings: Settings;
  loans: SavedLoan[];
  calculatorDraft: RawLoanInputs;
  recentBankNames: string[]; // at most 10, most recent first
};
