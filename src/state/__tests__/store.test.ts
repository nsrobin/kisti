import { act } from '@testing-library/react-native';
import { defaultState, PRESETS } from '../defaults';
import { sanitize } from '../migrations';
import { getLoanResults, loansSummary, sortLoans } from '../selectors';
import { mmkvStorage } from '../storage';
import { MAX_RECENT_BANKS, nextAccent, pushRecentBank, useStore } from '../store';
import type { LoanDraft } from '../types';

const D0 = { settlement: 0, insurance: 0, bankFees: 0, other: 0 };
const loanA: LoanDraft = {
  bankName: 'Kantha Bank',
  nickname: 'Home loan',
  principal: 1521595.95,
  annualRatePercent: 10.47,
  tenureMonths: 60,
  tenureUnitShown: 'years',
  firstInstallmentMonth: '2025-10',
  deductions: D0,
  accent: 'nil',
};
const loanB: LoanDraft = {
  ...loanA,
  bankName: 'Dhanshiri Bank',
  nickname: 'Top-up',
  principal: 1300000,
  annualRatePercent: 10.57,
  firstInstallmentMonth: '2027-01',
  deductions: { settlement: 851000, insurance: 30000, bankFees: 5000, other: 0 },
};
const loanC: LoanDraft = {
  ...loanA,
  bankName: 'Moyna Bank',
  nickname: 'Bike loan',
  principal: 200000,
  annualRatePercent: 9,
  tenureMonths: 24,
  firstInstallmentMonth: '2023-06',
};

const reset = () => {
  mmkvStorage.removeItem('kisti-state');
  useStore.setState(defaultState());
};

beforeEach(reset);

test('add, edit, delete and undo', () => {
  const a = useStore.getState().addLoan({ ...loanA, bankName: '  Kantha Bank ', nickname: ' ' });
  expect(a.bankName).toBe('Kantha Bank');
  expect(a.nickname).toBeUndefined();
  const b = useStore.getState().addLoan(loanB);
  expect(useStore.getState().loans.map(l => l.id)).toEqual([a.id, b.id]);

  useStore.getState().updateLoan(a.id, { ...loanA, nickname: 'House' });
  expect(useStore.getState().loans[0]?.nickname).toBe('House');

  const removed = useStore.getState().deleteLoan(a.id);
  expect(removed?.index).toBe(0);
  expect(useStore.getState().loans).toHaveLength(1);
  useStore.getState().restoreLoan(removed!.loan, removed!.index);
  expect(useStore.getState().loans.map(l => l.id)).toEqual([a.id, b.id]);
  // restoring twice is a no-op
  useStore.getState().restoreLoan(removed!.loan, removed!.index);
  expect(useStore.getState().loans).toHaveLength(2);
  expect(useStore.getState().deleteLoan('missing')).toBeNull();

  useStore.getState().clearAllLoans();
  expect(useStore.getState().loans).toEqual([]);
});

test('data persists across a reload', async () => {
  const a = useStore.getState().addLoan(loanA);
  useStore.getState().setSettings({ language: 'bn', theme: 'dark', onboarded: true });
  useStore.getState().setCalculatorDraft({ ...PRESETS.topup, other: '100' });
  const saved = mmkvStorage.getItem('kisti-state') as string;
  expect(saved).toContain('Kantha Bank');

  // Simulate a fresh launch: memory wiped (persist writes that too), storage kept.
  useStore.setState(defaultState());
  mmkvStorage.setItem('kisti-state', saved);
  await act(() => useStore.persist.rehydrate());
  const s = useStore.getState();
  expect(s.loans.map(l => l.id)).toEqual([a.id]);
  expect(s.settings).toMatchObject({ language: 'bn', theme: 'dark', onboarded: true });
  expect(s.calculatorDraft).toEqual({ ...PRESETS.topup, other: '100' }); // draft restored
});

test('corrupt or missing storage falls back to the defaults', async () => {
  mmkvStorage.setItem('kisti-state', '{not json');
  await act(() => useStore.persist.rehydrate());
  expect(useStore.getState().loans).toEqual([]);
  expect(useStore.getState().calculatorDraft).toEqual(PRESETS.current);

  expect(sanitize(undefined)).toEqual(defaultState());
  expect(sanitize(42)).toEqual(defaultState());
  const s = sanitize({
    settings: { language: 'xx', theme: 'dark', sound: 'yes' },
    loans: [{ ...loanA, id: 'ok', createdAt: 1, updatedAt: 1 }, { id: 'bad' }],
    calculatorDraft: { principal: 5 },
    recentBankNames: ['A', 3, 'B'],
  });
  expect(s.settings.theme).toBe('dark');
  expect(s.settings.language).toBe(defaultState().settings.language);
  expect(s.settings.sound).toBe(true);
  expect(s.loans.map(l => l.id)).toEqual(['ok']);
  expect(s.calculatorDraft).toEqual(PRESETS.current);
  expect(s.recentBankNames).toEqual(['A', 'B']);
});

test('recent bank names are de-duplicated, most recent first, capped at 10', () => {
  let list: string[] = [];
  for (let i = 0; i < 15; i++) {
    list = pushRecentBank(list, `Bank ${i}`);
  }
  expect(list).toHaveLength(MAX_RECENT_BANKS);
  expect(list[0]).toBe('Bank 14');
  expect(pushRecentBank(['Kantha Bank', 'X'], 'kantha bank ')).toEqual(['kantha bank', 'X']);
  for (let i = 0; i < 12; i++) {
    useStore.getState().addLoan({ ...loanA, bankName: `B${i}` });
  }
  expect(useStore.getState().recentBankNames).toHaveLength(MAX_RECENT_BANKS);
});

test('accent rotation', () => {
  expect([0, 1, 4, 5].map(nextAccent)).toEqual(['nil', 'shimul', 'akash', 'nil']);
});

test('sorting and summary strip (§13.1, today October 2026)', () => {
  const c = useStore.getState().addLoan(loanC);
  const b = useStore.getState().addLoan(loanB);
  const a = useStore.getState().addLoan(loanA);
  const loans = useStore.getState().loans;
  expect(sortLoans(loans, '2026-10').map(l => l.id)).toEqual([a.id, b.id, c.id]);
  const sum = loansSummary(loans, '2026-10');
  expect(sum.runningCount).toBe(1);
  expect(sum.thisMonthPaisa).toBe(3268300);
  expect(sum.remainingPaisa).toBe(255566457);
});

test('results are memoised by id and updatedAt', () => {
  const a = useStore.getState().addLoan(loanA);
  const r1 = getLoanResults(a);
  expect(getLoanResults(a)).toBe(r1);
  expect(getLoanResults({ ...a, updatedAt: a.updatedAt + 1 })).not.toBe(r1);
  expect(r1.bankEmi).toBe(32683);
});
