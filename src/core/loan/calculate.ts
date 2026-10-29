import { sum, toPaisa } from '../money';
import type { LoanInputs, LoanResults, ScheduleRow } from './types';

/** §5.4: always round up to the next taka; the tolerance absorbs floating-point noise. */
export const toBankEmi = (exactEmi: number): number => Math.ceil(exactEmi - 1e-6);

/** Implements §5.2–§5.8. */
export function calculateLoan(inputs: LoanInputs): LoanResults {
  const { principal, annualRatePercent, tenureMonths: n, deductions } = inputs;
  const r = annualRatePercent / 100 / 12;
  const growthFactor = Math.pow(1 + r, n);
  const exactEmi = r > 0 ? (principal * r * growthFactor) / (growthFactor - 1) : principal / n;
  const bankEmi = toBankEmi(exactEmi);

  const schedule: ScheduleRow[] = [];
  const emi = bankEmi * 100;
  let balance = toPaisa(principal);
  for (let k = 1; k <= n && balance > 0; k++) {
    const interest = Math.round(balance * r); // half-up to the paisa (balance is positive)
    const payment = k === n || balance + interest <= emi ? balance + interest : emi;
    const principalPart = payment - interest;
    const closing = balance - principalPart;
    schedule.push({
      index: k,
      openingPaisa: balance,
      interestPaisa: interest,
      principalPaisa: principalPart,
      paymentPaisa: payment,
      closingPaisa: closing,
    });
    balance = closing;
  }

  const first = schedule[0] as ScheduleRow;
  const last = schedule[schedule.length - 1] as ScheduleRow;
  const totalRepaymentPaisa = sum(schedule.map(row => row.paymentPaisa));
  const totalInterestPaisa = sum(schedule.map(row => row.interestPaisa));
  const emiTimesNPaisa = emi * n;
  const totalDeductionsPaisa = sum([
    toPaisa(deductions.settlement),
    toPaisa(deductions.insurance),
    toPaisa(deductions.bankFees),
    toPaisa(deductions.other),
  ]);
  const netCashPaisa = toPaisa(principal) - totalDeductionsPaisa; // never clamped (§5.8)
  const earlyPayoff = schedule.length < n;

  return {
    monthlyRate: r,
    installmentCount: n,
    actualInstallmentCount: schedule.length,
    exactEmi,
    bankEmi,
    growthFactor,
    lastInstallmentPaisa: last.paymentPaisa,
    totalDeductionsPaisa,
    netCashPaisa,
    deductionsExceedPrincipal: netCashPaisa < 0,
    totalRepaymentPaisa,
    totalInterestPaisa,
    emiTimesNPaisa,
    lastInstallmentAdjustmentPaisa: emiTimesNPaisa - totalRepaymentPaisa,
    showEmiTimesNCaption: !earlyPayoff && emiTimesNPaisa !== totalRepaymentPaisa,
    earlyPayoff,
    interestShare: totalRepaymentPaisa > 0 ? totalInterestPaisa / totalRepaymentPaisa : 0,
    firstMonthInterestPaisa: first.interestPaisa,
    firstMonthPrincipalPaisa: first.principalPaisa,
    balanceAfterFirstPaisa: first.closingPaisa,
    schedule,
  };
}
