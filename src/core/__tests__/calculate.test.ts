import { calculateLoan, monthSnapshot, toBankEmi, type LoanInputs, type LoanResults } from '../loan';

const NO_DED = { settlement: 0, insurance: 0, bankFees: 0, other: 0 };
const loan = (principal: number, rate: number, months: number, deductions = NO_DED): LoanInputs => ({
  principal,
  annualRatePercent: rate,
  tenureMonths: months,
  deductions,
});
const tk = (paisa: number) => (paisa / 100).toFixed(2);

function expectInvariants(r: LoanResults, principal: number) {
  const rows = r.schedule;
  expect(rows[rows.length - 1]?.closingPaisa).toBe(0);
  expect(rows.every(x => x.closingPaisa >= 0 && Number.isFinite(x.paymentPaisa))).toBe(true);
  expect(rows.every(x => Number.isInteger(x.paymentPaisa) && Number.isInteger(x.interestPaisa))).toBe(true);
  expect(rows.reduce((s, x) => s + x.principalPaisa, 0)).toBe(Math.round(principal * 100));
  expect(r.totalInterestPaisa).toBe(r.totalRepaymentPaisa - Math.round(principal * 100));
}

describe('§5.12 presets', () => {
  test('My current loan', () => {
    const r = calculateLoan(loan(1521595.95, 10.47, 60));
    expect(r.monthlyRate).toBeCloseTo(0.008725, 12);
    expect(r.exactEmi.toFixed(6)).toBe('32682.423279');
    expect(r.bankEmi).toBe(32683);
    expect(tk(r.firstMonthInterestPaisa)).toBe('13275.92');
    expect(tk(r.firstMonthPrincipalPaisa)).toBe('19407.08');
    expect(tk(r.balanceAfterFirstPaisa)).toBe('1502188.87');
    expect(tk(r.lastInstallmentPaisa)).toBe('32637.72');
    expect(tk(r.totalRepaymentPaisa)).toBe('1960934.72');
    expect(tk(r.totalInterestPaisa)).toBe('439338.77');
    expect(tk(r.emiTimesNPaisa)).toBe('1960980.00');
    expect(tk(r.lastInstallmentAdjustmentPaisa)).toBe('45.28');
    expect(r.showEmiTimesNCaption).toBe(true);
    expect(tk(r.totalDeductionsPaisa)).toBe('0.00');
    expect(tk(r.netCashPaisa)).toBe('1521595.95');
    expect(Math.round(r.interestShare * 100)).toBe(22);
    expect(r.growthFactor.toFixed(6)).toBe('1.684097');
    expectInvariants(r, 1521595.95);
  });

  test('Top-up example with deductions', () => {
    const r = calculateLoan(
      loan(1300000, 10.57, 60, { settlement: 851000, insurance: 30000, bankFees: 5000, other: 0 }),
    );
    expect(r.monthlyRate).toBeCloseTo(0.0088083333, 9);
    expect(r.exactEmi.toFixed(6)).toBe('27987.171319');
    expect(r.bankEmi).toBe(27988);
    expect(tk(r.firstMonthInterestPaisa)).toBe('11450.83');
    expect(tk(r.firstMonthPrincipalPaisa)).toBe('16537.17');
    expect(tk(r.balanceAfterFirstPaisa)).toBe('1283462.83');
    expect(tk(r.lastInstallmentPaisa)).toBe('27922.86');
    expect(tk(r.totalRepaymentPaisa)).toBe('1679214.86');
    expect(tk(r.totalInterestPaisa)).toBe('379214.86');
    expect(tk(r.emiTimesNPaisa)).toBe('1679280.00');
    expect(tk(r.lastInstallmentAdjustmentPaisa)).toBe('65.14');
    expect(tk(r.totalDeductionsPaisa)).toBe('886000.00');
    expect(tk(r.netCashPaisa)).toBe('414000.00');
    expect(r.deductionsExceedPrincipal).toBe(false);
    expectInvariants(r, 1300000);
  });

  test('Original loan', () => {
    const r = calculateLoan(loan(1200000, 12, 60));
    expect(r.monthlyRate).toBe(0.01);
    expect(r.exactEmi.toFixed(6)).toBe('26693.337222');
    expect(r.bankEmi).toBe(26694);
    expect(tk(r.firstMonthInterestPaisa)).toBe('12000.00');
    expect(tk(r.firstMonthPrincipalPaisa)).toBe('14694.00');
    expect(tk(r.balanceAfterFirstPaisa)).toBe('1185306.00');
    expect(tk(r.lastInstallmentPaisa)).toBe('26639.88');
    expect(tk(r.totalRepaymentPaisa)).toBe('1601585.88');
    expect(tk(r.totalInterestPaisa)).toBe('401585.88');
    expect(tk(r.emiTimesNPaisa)).toBe('1601640.00');
    expect(tk(r.lastInstallmentAdjustmentPaisa)).toBe('54.12');
    expect(tk(r.netCashPaisa)).toBe('1200000.00');
    expectInvariants(r, 1200000);
  });
});

describe('§5.4 ceiling rule', () => {
  test.each([
    [32682.0, 32682],
    [32682.0000000001, 32682],
    [32682.01, 32683],
    [32682.15, 32683],
    [32682.95, 32683],
  ])('toBankEmi(%p) = %p', (exact, bank) => expect(toBankEmi(exact)).toBe(bank));
});

describe('§5.12 edge cases', () => {
  test('integer EMI stays unchanged', () => {
    const r = calculateLoan(loan(600000, 0, 60));
    expect(r.exactEmi).toBe(10000);
    expect(r.bankEmi).toBe(10000);
    expect(r.lastInstallmentPaisa).toBe(1000000);
    expectInvariants(r, 600000);
  });

  test('zero interest on the default principal', () => {
    const r = calculateLoan(loan(1521595.95, 0, 60));
    expect(r.exactEmi).toBeCloseTo(25359.9325, 10);
    expect(r.bankEmi).toBe(25360);
    expect(tk(r.lastInstallmentPaisa)).toBe('25355.95');
    expect(r.totalRepaymentPaisa).toBe(152159595);
    expect(r.interestShare).toBe(0);
    expectInvariants(r, 1521595.95);
  });

  test('early payoff', () => {
    const r = calculateLoan(loan(1000, 12, 360));
    expect(r.exactEmi.toFixed(6)).toBe('10.286126');
    expect(r.bankEmi).toBe(11);
    expect(r.installmentCount).toBe(360);
    expect(r.actualInstallmentCount).toBe(242);
    expect(r.earlyPayoff).toBe(true);
    expect(tk(r.lastInstallmentPaisa)).toBe('0.03');
    expect(r.showEmiTimesNCaption).toBe(false);
    expectInvariants(r, 1000);
  });

  test('large amount', () => {
    const r = calculateLoan(loan(10_00_00_00_000, 30, 360));
    expect(r.schedule).toHaveLength(360);
    expect(Number.isFinite(r.exactEmi)).toBe(true);
    expectInvariants(r, 10_00_00_00_000);
  });

  test('one-month loan', () => {
    const r = calculateLoan(loan(1000, 12, 1));
    expect(r.schedule).toHaveLength(1);
    expect(tk(r.lastInstallmentPaisa)).toBe('1010.00');
    expectInvariants(r, 1000);
  });
});

describe('§5.8 deductions', () => {
  test('exceeding the principal gives negative net cash and sets the flag', () => {
    const r = calculateLoan(
      loan(1300000, 10.57, 60, { settlement: 1269000, insurance: 30000, bankFees: 5000, other: 0 }),
    );
    expect(tk(r.totalDeductionsPaisa)).toBe('1304000.00');
    expect(tk(r.netCashPaisa)).toBe('-4000.00');
    expect(r.deductionsExceedPrincipal).toBe(true);
    expect(r.bankEmi).toBe(27988); // deductions never change the EMI
  });

  test('paisa amounts add exactly', () => {
    const r = calculateLoan(loan(1000, 10, 12, { settlement: 0.1, insurance: 0.2, bankFees: 0.3, other: 0 }));
    expect(r.totalDeductionsPaisa).toBe(60);
    expect(r.netCashPaisa).toBe(99940);
  });
});

describe('§5.9 snapshots', () => {
  const r = calculateLoan(loan(1521595.95, 10.47, 60));

  test('month 12 of My current loan', () => {
    const s = monthSnapshot(r, 12);
    expect(tk(s.row.paymentPaisa)).toBe('32683.00');
    expect(tk(s.row.interestPaisa)).toBe('11329.91');
    expect(tk(s.row.principalPaisa)).toBe('21353.09');
    expect(tk(s.row.openingPaisa)).toBe('1298557.06');
    expect(tk(s.row.closingPaisa)).toBe('1277203.97');
    expect(tk(s.paidSoFarPaisa)).toBe('392196.00');
    expect(tk(s.interestPaidSoFarPaisa)).toBe('147804.02');
    expect(tk(s.principalPaidSoFarPaisa)).toBe('244391.98');
    expect(tk(s.stillToPayPaisa)).toBe('1568738.72');
    expect(s.installmentsLeft).toBe(48);
  });

  test('month 13 (§13.1 Loan A, October 2026)', () => {
    const s = monthSnapshot(r, 13);
    expect(tk(s.row.paymentPaisa)).toBe('32683.00');
    expect(tk(s.row.interestPaisa)).toBe('11143.60');
    expect(tk(s.row.principalPaisa)).toBe('21539.40');
    expect(tk(s.row.closingPaisa)).toBe('1255664.57');
    expect(tk(s.paidSoFarPaisa)).toBe('424879.00');
    expect(tk(s.interestPaidSoFarPaisa)).toBe('158947.62');
    expect(tk(s.stillToPayPaisa)).toBe('1536055.72');
    expect(s.installmentsLeft).toBe(47);
  });

  test('final month and out of range', () => {
    const s = monthSnapshot(r, 60);
    expect(tk(s.row.paymentPaisa)).toBe('32637.72');
    expect(s.row.closingPaisa).toBe(0);
    expect(s.stillToPayPaisa).toBe(0);
    expect(s.installmentsLeft).toBe(0);
    expect(() => monthSnapshot(r, 61)).toThrow(RangeError);
    expect(() => monthSnapshot(r, 0)).toThrow(RangeError);
  });
});

describe('§13.1 Loan C and §3.1 anchors', () => {
  test('Moyna Bank bike loan', () => {
    const r = calculateLoan(loan(200000, 9, 24));
    expect(r.bankEmi).toBe(9137);
    expect(tk(r.lastInstallmentPaisa)).toBe('9135.66');
    expect(tk(r.totalRepaymentPaisa)).toBe('219286.66');
    expect(tk(r.totalInterestPaisa)).toBe('19286.66');
  });

  test('reference installments (§3.1) are reproduced', () => {
    expect(calculateLoan(loan(1521595.95, 10.47, 60)).bankEmi).toBe(32683);
    expect(calculateLoan(loan(1200000, 12, 60)).bankEmi).toBe(26694);
  });

  test('360 months calculate in under 2 ms on average', () => {
    const t0 = Date.now();
    for (let i = 0; i < 100; i++) {
      calculateLoan(loan(10_00_00_00_000, 30, 360));
    }
    expect((Date.now() - t0) / 100).toBeLessThan(2);
  });
});
