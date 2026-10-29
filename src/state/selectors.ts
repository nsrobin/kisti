import { calculateLoan } from '@/core/loan/calculate';
import type { LoanInputs, LoanResults } from '@/core/loan/types';
import { loanState, nextInstallmentMonth, toIndex, type YearMonth } from '@/core/months';
import type { SavedLoan } from './types';

export const loanInputs = (loan: SavedLoan): LoanInputs => ({
  principal: loan.principal,
  annualRatePercent: loan.annualRatePercent,
  tenureMonths: loan.tenureMonths,
  deductions: loan.deductions,
});

const cache = new Map<string, { updatedAt: number; results: LoanResults }>();

/** Results are derived, never stored; memoised by id and updatedAt (§22). */
export function getLoanResults(loan: SavedLoan): LoanResults {
  const hit = cache.get(loan.id);
  if (hit && hit.updatedAt === loan.updatedAt) {
    return hit.results;
  }
  const results = calculateLoan(loanInputs(loan));
  cache.set(loan.id, { updatedAt: loan.updatedAt, results });
  return results;
}

const STATE_RANK = { running: 0, notStarted: 1, completed: 2 } as const;

/** §7.1: running (by next due month), then not started, then completed. */
export function sortLoans(loans: SavedLoan[], today: YearMonth): SavedLoan[] {
  const key = (l: SavedLoan) => {
    const count = getLoanResults(l).actualInstallmentCount;
    const next = nextInstallmentMonth(l.firstInstallmentMonth, count, today);
    return [STATE_RANK[loanState(l.firstInstallmentMonth, count, today).kind], next ? toIndex(next) : 0] as const;
  };
  return [...loans].sort((a, b) => {
    const [ra, na] = key(a);
    const [rb, nb] = key(b);
    return ra - rb || na - nb || a.createdAt - b.createdAt;
  });
}

export type LoansSummary = { runningCount: number; thisMonthPaisa: number; remainingPaisa: number };

/**
 * §7.1 summary strip: this month's installments across running loans, and remaining
 * principal = running loans' closing after this month + full principal of loans not started.
 */
export function loansSummary(loans: SavedLoan[], today: YearMonth): LoansSummary {
  let runningCount = 0;
  let thisMonthPaisa = 0;
  let remainingPaisa = 0;
  for (const loan of loans) {
    const r = getLoanResults(loan);
    const state = loanState(loan.firstInstallmentMonth, r.actualInstallmentCount, today);
    if (state.kind === 'running') {
      const row = r.schedule[state.currentIndex - 1];
      runningCount++;
      thisMonthPaisa += row?.paymentPaisa ?? 0;
      remainingPaisa += row?.closingPaisa ?? 0;
    } else if (state.kind === 'notStarted') {
      remainingPaisa += r.schedule[0]?.openingPaisa ?? 0;
    }
  }
  return { runningCount, thisMonthPaisa, remainingPaisa };
}
