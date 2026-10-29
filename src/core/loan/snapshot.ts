import type { LoanResults, MonthSnapshot, ScheduleRow } from './types';

/** Implements §5.9 for installment `index` (1-based). */
export function monthSnapshot(results: LoanResults, index: number): MonthSnapshot {
  const row = results.schedule[index - 1];
  if (!row) {
    throw new RangeError(`Installment ${index} is outside 1…${results.actualInstallmentCount}`);
  }
  let paid = 0;
  let interestPaid = 0;
  let principalPaid = 0;
  let still = 0;
  for (const r of results.schedule as ScheduleRow[]) {
    if (r.index <= index) {
      paid += r.paymentPaisa;
      interestPaid += r.interestPaisa;
      principalPaid += r.principalPaisa;
    } else {
      still += r.paymentPaisa;
    }
  }
  return {
    index,
    row,
    paidSoFarPaisa: paid,
    interestPaidSoFarPaisa: interestPaid,
    principalPaidSoFarPaisa: principalPaid,
    stillToPayPaisa: still,
    installmentsLeft: results.actualInstallmentCount - index,
  };
}
