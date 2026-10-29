export type Paisa = number; // always an integer

export type Deductions = {
  settlement: number;
  insurance: number;
  bankFees: number;
  other: number; // taka
};

export type LoanInputs = {
  principal: number; // taka
  annualRatePercent: number;
  tenureMonths: number; // integer
  deductions: Deductions;
};

export type TenureUnit = 'years' | 'months';

/** Exactly what the user typed. */
export type RawLoanInputs = {
  principal: string;
  annualRatePercent: string;
  tenureValue: string;
  tenureUnit: TenureUnit;
  settlement: string;
  insurance: string;
  bankFees: string;
  other: string;
};

export type InputField = keyof RawLoanInputs;
export type ErrorCode =
  | 'required'
  | 'notNumber'
  | 'mustBePositive'
  | 'tooLarge'
  | 'rateRange'
  | 'durationRange'
  | 'negative';

export type ScheduleRow = {
  index: number; // 1-based
  openingPaisa: Paisa;
  interestPaisa: Paisa;
  principalPaisa: Paisa;
  paymentPaisa: Paisa;
  closingPaisa: Paisa;
};

export type LoanResults = {
  monthlyRate: number;
  installmentCount: number; // n
  actualInstallmentCount: number; // n or fewer (early payoff)
  exactEmi: number; // taka, unrounded
  bankEmi: number; // whole taka, ceiling (§5.4)
  /** (1 + r)^n, shown in the formula section. */
  growthFactor: number;
  lastInstallmentPaisa: Paisa;
  totalDeductionsPaisa: Paisa;
  netCashPaisa: Paisa; // can be negative
  deductionsExceedPrincipal: boolean;
  totalRepaymentPaisa: Paisa; // Σ payment
  totalInterestPaisa: Paisa; // Σ interest
  emiTimesNPaisa: Paisa; // bankEmi × n, caption only (§5.6)
  lastInstallmentAdjustmentPaisa: Paisa; // emiTimesN − total
  /** False on early payoff, or when there is nothing to explain. */
  showEmiTimesNCaption: boolean;
  earlyPayoff: boolean;
  interestShare: number; // 0..1
  firstMonthInterestPaisa: Paisa;
  firstMonthPrincipalPaisa: Paisa;
  balanceAfterFirstPaisa: Paisa;
  schedule: ScheduleRow[];
};

export type MonthSnapshot = {
  index: number;
  row: ScheduleRow;
  paidSoFarPaisa: Paisa;
  interestPaidSoFarPaisa: Paisa;
  principalPaidSoFarPaisa: Paisa;
  stillToPayPaisa: Paisa;
  installmentsLeft: number;
};

export const MAX_PRINCIPAL = 10_00_00_00_000; // 1,000 crore
export const MAX_RATE = 50;
export const MAX_TENURE_MONTHS = 360;
