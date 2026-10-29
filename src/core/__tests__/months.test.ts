import {
  addMonths,
  currentYearMonth,
  defaultSelectedMonth,
  diffMonths,
  fromIndex,
  installmentIndexFor,
  isYearMonth,
  loanState,
  monthForInstallment,
  monthStatus,
  nextInstallmentMonth,
  paidCount,
  toIndex,
} from '../months';

const TODAY = '2026-10';
const A = { first: '2025-10', count: 60 }; // running
const B = { first: '2027-01', count: 60 }; // not started
const C = { first: '2023-06', count: 24 }; // completed

test('index round trip and arithmetic', () => {
  expect(toIndex('2026-10')).toBe(2026 * 12 + 9);
  expect(fromIndex(toIndex('2026-10'))).toBe('2026-10');
  expect(addMonths('2026-11', 3)).toBe('2027-02');
  expect(addMonths('2026-01', -1)).toBe('2025-12');
  expect(diffMonths('2027-01', '2026-10')).toBe(3);
  expect(currentYearMonth(new Date(2026, 9, 29))).toBe('2026-10');
  expect(isYearMonth('2026-10')).toBe(true);
  expect(isYearMonth('2026-13')).toBe(false);
  expect(isYearMonth(42)).toBe(false);
});

test('installment mapping', () => {
  expect(monthForInstallment(A.first, 13)).toBe('2026-10');
  expect(monthForInstallment(A.first, 60)).toBe('2030-09');
  expect(installmentIndexFor(A.first, '2026-10', A.count)).toBe(13);
  expect(installmentIndexFor(A.first, '2025-09', A.count)).toBeNull();
  expect(installmentIndexFor(A.first, '2030-10', A.count)).toBeNull();
});

test('loan states', () => {
  expect(loanState(A.first, A.count, TODAY)).toEqual({ kind: 'running', currentIndex: 13 });
  expect(loanState(B.first, B.count, TODAY)).toEqual({ kind: 'notStarted', monthsUntil: 3 });
  expect(loanState(C.first, C.count, TODAY)).toEqual({ kind: 'completed' });
  expect(paidCount(A.first, A.count, TODAY)).toBe(12);
  expect(paidCount(B.first, B.count, TODAY)).toBe(0);
  expect(paidCount(C.first, C.count, TODAY)).toBe(24);
});

test('month statuses', () => {
  expect(monthStatus(A.first, A.count, '2026-09', TODAY)).toBe('paid');
  expect(monthStatus(A.first, A.count, '2026-10', TODAY)).toBe('due');
  expect(monthStatus(A.first, A.count, '2026-11', TODAY)).toBe('upcoming');
  expect(monthStatus(A.first, A.count, '2025-09', TODAY)).toBe('outside');
  expect(monthStatus(A.first, A.count, '2030-10', TODAY)).toBe('outside');
  expect(monthStatus(B.first, B.count, '2027-01', TODAY)).toBe('upcoming');
  expect(monthStatus(C.first, C.count, '2025-05', TODAY)).toBe('paid');
});

test('default selected month', () => {
  expect(defaultSelectedMonth(A.first, A.count, TODAY)).toBe('2026-10');
  expect(defaultSelectedMonth(B.first, B.count, TODAY)).toBe('2027-01');
  expect(defaultSelectedMonth(C.first, C.count, TODAY)).toBe('2025-05');
});

test('next installment month', () => {
  expect(nextInstallmentMonth(A.first, A.count, TODAY)).toBe('2026-10');
  expect(nextInstallmentMonth(B.first, B.count, TODAY)).toBe('2027-01');
  expect(nextInstallmentMonth(C.first, C.count, TODAY)).toBeNull();
});
