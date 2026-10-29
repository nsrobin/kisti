import type { RawLoanInputs } from '@/core/loan/types';
import { isYearMonth } from '@/core/months';
import { defaultState } from './defaults';
import { logDev } from './storage';
import { ACCENTS, type PersistedStateV1, type SavedLoan, type Settings } from './types';

export const SCHEMA_VERSION = 1;

/** Upgrades older persisted shapes. Nothing to do in v1. */
export function migrate(persisted: unknown, version: number): unknown {
  if (version !== SCHEMA_VERSION) {
    logDev(`unknown schema version ${version}; sanitising`);
  }
  return persisted;
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';

function sanitizeSettings(v: unknown, d: Settings): Settings {
  if (!isObj(v)) {
    return d;
  }
  return {
    language: v.language === 'bn' || v.language === 'en' ? v.language : d.language,
    theme: v.theme === 'light' || v.theme === 'dark' || v.theme === 'system' ? v.theme : d.theme,
    bengaliDigits: isBool(v.bengaliDigits) ? v.bengaliDigits : d.bengaliDigits,
    sound: isBool(v.sound) ? v.sound : d.sound,
    haptics: isBool(v.haptics) ? v.haptics : d.haptics,
    onboarded: isBool(v.onboarded) ? v.onboarded : d.onboarded,
  };
}

function isLoan(v: unknown): v is SavedLoan {
  if (!isObj(v) || !isObj(v.deductions)) {
    return false;
  }
  const d = v.deductions;
  return (
    isStr(v.id) &&
    isStr(v.bankName) &&
    (v.nickname === undefined || isStr(v.nickname)) &&
    isNum(v.principal) &&
    v.principal > 0 &&
    isNum(v.annualRatePercent) &&
    isNum(v.tenureMonths) &&
    Number.isInteger(v.tenureMonths) &&
    v.tenureMonths >= 1 &&
    v.tenureMonths <= 360 &&
    (v.tenureUnitShown === 'years' || v.tenureUnitShown === 'months') &&
    isYearMonth(v.firstInstallmentMonth) &&
    [d.settlement, d.insurance, d.bankFees, d.other].every(isNum) &&
    ACCENTS.includes(v.accent as SavedLoan['accent']) &&
    isNum(v.createdAt) &&
    isNum(v.updatedAt)
  );
}

const DRAFT_KEYS: (keyof RawLoanInputs)[] = [
  'principal',
  'annualRatePercent',
  'tenureValue',
  'settlement',
  'insurance',
  'bankFees',
  'other',
];

function sanitizeDraft(v: unknown, d: RawLoanInputs): RawLoanInputs {
  if (!isObj(v) || !DRAFT_KEYS.every(k => isStr(v[k])) || (v.tenureUnit !== 'years' && v.tenureUnit !== 'months')) {
    return d;
  }
  return v as RawLoanInputs;
}

/**
 * Turns whatever was stored into a valid state, field by field. Anything corrupt falls
 * back to the default for that field; a single bad loan is dropped, not the whole list.
 */
export function sanitize(persisted: unknown): PersistedStateV1 {
  const d = defaultState();
  if (!isObj(persisted)) {
    if (persisted !== undefined) {
      logDev('stored state is not an object; using defaults');
    }
    return d;
  }
  const loans = Array.isArray(persisted.loans) ? persisted.loans.filter(isLoan) : [];
  if (Array.isArray(persisted.loans) && loans.length !== persisted.loans.length) {
    logDev(`dropped ${persisted.loans.length - loans.length} corrupt loan(s)`);
  }
  return {
    schemaVersion: 1,
    settings: sanitizeSettings(persisted.settings, d.settings),
    loans,
    calculatorDraft: sanitizeDraft(persisted.calculatorDraft, d.calculatorDraft),
    recentBankNames: Array.isArray(persisted.recentBankNames)
      ? persisted.recentBankNames.filter(isStr).slice(0, 10)
      : [],
  };
}
