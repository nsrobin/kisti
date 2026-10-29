import { isBlank, parseNumber } from './parse';
import {
  MAX_PRINCIPAL,
  MAX_RATE,
  MAX_TENURE_MONTHS,
  type Deductions,
  type ErrorCode,
  type InputField,
  type LoanInputs,
  type RawLoanInputs,
} from './types';

export type ValidationResult =
  | { ok: true; inputs: LoanInputs }
  | { ok: false; errors: Partial<Record<InputField, ErrorCode>> };

/** Converts the duration field to whole months, or null when it is not a valid duration. */
export function tenureMonthsFrom(raw: Pick<RawLoanInputs, 'tenureValue' | 'tenureUnit'>): number | null {
  const v = parseNumber(raw.tenureValue);
  if (v === null) {
    return null;
  }
  const months = raw.tenureUnit === 'years' ? v * 12 : v;
  return Number.isInteger(months) ? months : null;
}

const DEDUCTION_FIELDS = ['settlement', 'insurance', 'bankFees', 'other'] as const;

export function validateInputs(raw: RawLoanInputs): ValidationResult {
  const errors: Partial<Record<InputField, ErrorCode>> = {};

  const principal = parseNumber(raw.principal);
  if (isBlank(raw.principal)) {
    errors.principal = 'required';
  } else if (principal === null) {
    errors.principal = 'notNumber';
  } else if (principal <= 0) {
    errors.principal = 'mustBePositive';
  } else if (principal > MAX_PRINCIPAL) {
    errors.principal = 'tooLarge';
  }

  const rate = parseNumber(raw.annualRatePercent);
  if (isBlank(raw.annualRatePercent)) {
    errors.annualRatePercent = 'required';
  } else if (rate === null) {
    errors.annualRatePercent = 'notNumber';
  } else if (rate < 0 || rate > MAX_RATE) {
    errors.annualRatePercent = 'rateRange';
  }

  const tenureMonths = tenureMonthsFrom(raw);
  if (tenureMonths === null || tenureMonths < 1 || tenureMonths > MAX_TENURE_MONTHS) {
    errors.tenureValue = 'durationRange';
  }

  const deductions: Deductions = { settlement: 0, insurance: 0, bankFees: 0, other: 0 };
  for (const field of DEDUCTION_FIELDS) {
    if (isBlank(raw[field])) {
      continue; // an empty deduction counts as 0
    }
    const v = parseNumber(raw[field]);
    if (v === null) {
      errors[field] = 'notNumber';
    } else if (v < 0) {
      errors[field] = 'negative';
    } else {
      deductions[field] = v;
    }
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }
  return {
    ok: true,
    inputs: {
      principal: principal as number,
      annualRatePercent: rate as number,
      tenureMonths: tenureMonths as number,
      deductions,
    },
  };
}
