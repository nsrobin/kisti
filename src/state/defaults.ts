import type { RawLoanInputs } from '@/core/loan/types';
import type { PersistedStateV1, Settings } from './types';

export type PresetId = 'current' | 'topup' | 'original';

/** The three §5.12 presets, as typed input. */
export const PRESETS: Record<PresetId, RawLoanInputs> = {
  current: {
    principal: '1521595.95',
    annualRatePercent: '10.47',
    tenureValue: '5',
    tenureUnit: 'years',
    settlement: '',
    insurance: '',
    bankFees: '',
    other: '',
  },
  topup: {
    principal: '1300000',
    annualRatePercent: '10.57',
    tenureValue: '5',
    tenureUnit: 'years',
    settlement: '851000',
    insurance: '30000',
    bankFees: '5000',
    other: '',
  },
  original: {
    principal: '1200000',
    annualRatePercent: '12',
    tenureValue: '5',
    tenureUnit: 'years',
    settlement: '',
    insurance: '',
    bankFees: '',
    other: '',
  },
};

function deviceLanguage(): 'bn' | 'en' {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale.toLowerCase().startsWith('bn') ? 'bn' : 'en';
  } catch {
    return 'en';
  }
}

export const defaultSettings = (): Settings => ({
  language: deviceLanguage(),
  theme: 'system',
  bengaliDigits: true,
  sound: true,
  haptics: true,
  onboarded: false,
});

export const defaultState = (): PersistedStateV1 => ({
  schemaVersion: 1,
  settings: defaultSettings(),
  loans: [],
  calculatorDraft: { ...PRESETS.current },
  recentBankNames: [],
});
