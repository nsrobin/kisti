export type YearMonth = string; // 'YYYY-MM'

export function toIndex(ym: YearMonth): number {
  const [y, m] = ym.split('-').map(Number) as [number, number];
  return y * 12 + (m - 1);
}

export function fromIndex(i: number): YearMonth {
  const y = Math.floor(i / 12);
  const m = (i % 12) + 1;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}`;
}

export const isYearMonth = (s: unknown): s is YearMonth => typeof s === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);

export const yearOf = (ym: YearMonth): number => Number(ym.slice(0, 4));
export const monthOf = (ym: YearMonth): number => Number(ym.slice(5, 7)); // 1…12
export const makeYearMonth = (year: number, month: number): YearMonth => fromIndex(year * 12 + (month - 1));

export const addMonths = (ym: YearMonth, k: number): YearMonth => fromIndex(toIndex(ym) + k);
export const diffMonths = (a: YearMonth, b: YearMonth): number => toIndex(a) - toIndex(b);
export const currentYearMonth = (now: Date): YearMonth => makeYearMonth(now.getFullYear(), now.getMonth() + 1);

/** Installment k (1-based) falls in month F + (k − 1). */
export const monthForInstallment = (first: YearMonth, k: number): YearMonth => addMonths(first, k - 1);

export function installmentIndexFor(first: YearMonth, ym: YearMonth, count: number): number | null {
  const k = diffMonths(ym, first) + 1;
  return k >= 1 && k <= count ? k : null;
}

export type MonthStatus = 'outside' | 'paid' | 'due' | 'upcoming';

/** §5.10 */
export function monthStatus(first: YearMonth, count: number, ym: YearMonth, today: YearMonth): MonthStatus {
  if (installmentIndexFor(first, ym, count) === null) {
    return 'outside';
  }
  const d = diffMonths(ym, today);
  return d < 0 ? 'paid' : d === 0 ? 'due' : 'upcoming';
}

export type LoanState =
  | { kind: 'notStarted'; monthsUntil: number }
  | { kind: 'running'; currentIndex: number }
  | { kind: 'completed' };

export function loanState(first: YearMonth, count: number, today: YearMonth): LoanState {
  const k = diffMonths(today, first) + 1;
  if (k < 1) {
    return { kind: 'notStarted', monthsUntil: 1 - k };
  }
  if (k > count) {
    return { kind: 'completed' };
  }
  return { kind: 'running', currentIndex: k };
}

/** Number of installments assumed paid before today's month (§5.10). */
export function paidCount(first: YearMonth, count: number, today: YearMonth): number {
  const state = loanState(first, count, today);
  return state.kind === 'notStarted' ? 0 : state.kind === 'completed' ? count : state.currentIndex - 1;
}

/** §7.4: today if inside the loan, else the first month (not started) or the final month (completed). */
export function defaultSelectedMonth(first: YearMonth, count: number, today: YearMonth): YearMonth {
  const state = loanState(first, count, today);
  if (state.kind === 'running') {
    return today;
  }
  return state.kind === 'notStarted' ? first : monthForInstallment(first, count);
}

/** The earliest installment month on or after today, or null when the loan is completed. */
export function nextInstallmentMonth(first: YearMonth, count: number, today: YearMonth): YearMonth | null {
  const state = loanState(first, count, today);
  if (state.kind === 'completed') {
    return null;
  }
  return state.kind === 'notStarted' ? first : today;
}
