import type { ErrorCode, InputField } from '@/core/loan/types';
import type { I18n, StringKey } from '@/i18n';

const MESSAGES: Partial<Record<InputField, Partial<Record<ErrorCode, StringKey>>>> = {
  principal: { required: 'err.amountEmpty', mustBePositive: 'err.amountZero', tooLarge: 'err.amountMax' },
  annualRatePercent: { required: 'err.rateEmpty', rateRange: 'err.rateRange' },
  tenureValue: { durationRange: 'err.durationRange' },
};

/** §5.11 message for a field's error; non-number (and negative deductions) use err.notANumber. */
export function errorMessage(i18n: I18n, field: InputField, code: ErrorCode | undefined): string | undefined {
  if (!code) {
    return undefined;
  }
  return i18n.t(MESSAGES[field]?.[code] ?? 'err.notANumber');
}

export const FIELD_ORDER: InputField[] = [
  'principal',
  'annualRatePercent',
  'tenureValue',
  'settlement',
  'insurance',
  'bankFees',
  'other',
];
