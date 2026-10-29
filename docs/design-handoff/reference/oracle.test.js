// Oracle check for the reference engine: every value in SPEC §5.12 and §13.1.
// Run: node docs/design-handoff/reference/oracle.test.js   (also works under Jest)
'use strict';
const assert = require('assert');
const K = require('./kisti-engine');
const tk = (paisa) => (paisa / 100).toFixed(2);
const cases = [];
const t = (name, fn) => cases.push([name, fn]);

t('My current loan (preset 1)', () => {
  const c = K.calcLoan(1521595.95, 10.47, 60);
  assert.strictEqual(c.exactEmi.toFixed(6), '32682.423279');
  assert.strictEqual(c.bankEmi, 32683);
  assert.strictEqual(tk(c.rows[0].interest), '13275.92');
  assert.strictEqual(tk(c.rows[0].principalPart), '19407.08');
  assert.strictEqual(tk(c.rows[0].closing), '1502188.87');
  assert.strictEqual(tk(c.lastInstallment), '32637.72');
  assert.strictEqual(tk(c.totalRepaymentEstimate), '1960934.72');
  assert.strictEqual(tk(c.totalInterestEstimate), '439338.77');
  assert.strictEqual(tk(c.emiTimesN), '1960980.00');
  assert.strictEqual(tk(c.lastInstallmentAdjustment), '45.28');
  assert.strictEqual(Math.round(c.interestShare * 100), 22);
});
t('Top-up example (preset 2) with deductions', () => {
  const c = K.calcLoan(1300000, 10.57, 60);
  assert.strictEqual(c.exactEmi.toFixed(6), '27987.171319');
  assert.strictEqual(c.bankEmi, 27988);
  assert.strictEqual(tk(c.lastInstallment), '27922.86');
  assert.strictEqual(tk(c.totalRepaymentEstimate), '1679214.86');
  assert.strictEqual(tk(c.lastInstallmentAdjustment), '65.14');
  const d = K.deductions(1300000, { settlement: 851000, insurance: 30000, bankFees: 5000, other: 0 });
  assert.strictEqual(tk(d.totalDeductions), '886000.00');
  assert.strictEqual(tk(d.netCashReceived), '414000.00');
});
t('Original loan (preset 3)', () => {
  const c = K.calcLoan(1200000, 12, 60);
  assert.strictEqual(c.bankEmi, 26694);
  assert.strictEqual(tk(c.lastInstallment), '26639.88');
  assert.strictEqual(tk(c.totalRepaymentEstimate), '1601585.88');
  assert.strictEqual(tk(c.lastInstallmentAdjustment), '54.12');
});
t('Month 12 and 13 snapshots (§5.12, §13.1)', () => {
  const c = K.calcLoan(1521595.95, 10.47, 60);
  const s12 = K.monthSnapshot(c, 12);
  assert.deepStrictEqual([s12.interest, s12.principal, s12.opening, s12.remaining, s12.paidSoFar, s12.interestPaidSoFar, s12.principalPaidSoFar, s12.stillToPay, s12.installmentsLeft].map((x, i) => i === 8 ? x : tk(x)),
    ['11329.91', '21353.09', '1298557.06', '1277203.97', '392196.00', '147804.02', '244391.98', '1568738.72', 48]);
  const s13 = K.monthSnapshot(c, 13);
  assert.deepStrictEqual([s13.interest, s13.principal, s13.remaining, s13.paidSoFar, s13.interestPaidSoFar, s13.stillToPay].map(tk),
    ['11143.60', '21539.40', '1255664.57', '424879.00', '158947.62', '1536055.72']);
  assert.strictEqual(s13.installmentsLeft, 47);
});
t('Loan C completed (§13.1)', () => {
  const c = K.calcLoan(200000, 9, 24);
  assert.strictEqual(c.bankEmi, 9137);
  assert.strictEqual(tk(c.lastInstallment), '9135.66');
  assert.strictEqual(tk(c.totalRepaymentEstimate), '219286.66');
  assert.strictEqual(K.loanState(K.ym(2023, 6), 24, K.ym(2026, 10)).state, 'completed');
});
t('Month mapping and states (§5.10)', () => {
  const F = K.ym(2025, 10), now = K.ym(2026, 10);
  assert.deepStrictEqual(K.loanState(F, 60, now), { state: 'running', k: 13 });
  assert.strictEqual(K.monthStatus(F, 60, now, K.ym(2026, 9)), 'paid');
  assert.strictEqual(K.monthStatus(F, 60, now, now), 'due');
  assert.strictEqual(K.monthStatus(F, 60, now, K.ym(2030, 10)), 'outside');
  assert.strictEqual(F + 60 - 1, K.ym(2030, 9)); // final month September 2030
  assert.deepStrictEqual(K.loanState(K.ym(2027, 1), 60, now), { state: 'notStarted', startsInMonths: 3 });
});
t('S4 summary strip (§13.1)', () => {
  const a = K.calcLoan(1521595.95, 10.47, 60);
  const remaining = a.rows[12].closing + Math.round(1300000 * 100);
  assert.strictEqual(tk(remaining), '2555664.57');
});
t('Edge cases (§5.12)', () => {
  let c = K.calcLoan(600000, 0, 60);
  assert.strictEqual(c.bankEmi, 10000); assert.strictEqual(c.lastInstallment, 1000000);
  c = K.calcLoan(1521595.95, 0, 60);
  assert.strictEqual(c.bankEmi, 25360); assert.strictEqual(tk(c.lastInstallment), '25355.95');
  assert.strictEqual(c.totalRepaymentEstimate, 152159595);
  c = K.calcLoan(1000, 12, 360);
  assert.strictEqual(c.bankEmi, 11); assert.strictEqual(c.actualInstallmentCount, 242);
  assert.strictEqual(tk(c.lastInstallment), '0.03'); assert.strictEqual(c.showEmiTimesNCaption, false);
  c = K.calcLoan(1e10, 30, 360);
  assert.strictEqual(c.rows.length, 360); assert.strictEqual(c.rows[359].closing, 0);
  assert.strictEqual(c.rows.reduce((s, x) => s + x.principalPart, 0), 1e12);
  assert.ok(c.rows.every((x) => Number.isFinite(x.payment) && x.closing >= 0));
});
t('Ceiling rule table (§5.4)', () => {
  const ceil = (x) => Math.ceil(x - 1e-6);
  assert.deepStrictEqual([32682.00, 32682.0000000001, 32682.01, 32682.15, 32682.95].map(ceil), [32682, 32682, 32683, 32683, 32683]);
});
t('Formatting (§9.2)', () => {
  assert.strictEqual(K.formatMoney(152159595).full, '৳15,21,595.95');
  assert.strictEqual(K.formatMoney(152159595, { bengaliDigits: true }).full, '৳১৫,২১,৫৯৫.৯৫');
  assert.strictEqual(K.formatMoney(3268300, { whole: true, bengaliDigits: true }).full, '৳৩২,৬৮৩');
  assert.strictEqual(K.formatMoney(-400000).full, '−৳4,000.00');
  assert.strictEqual(K.formatCompact(152159595, 'bn', true), '১৫.২২ লাখ');
  assert.strictEqual(K.formatCompact(1.5e9, 'en', false), '1.5 crore');
  assert.strictEqual(K.formatRate(0.8725, 4, true), '০.৮৭২৫');
  assert.deepStrictEqual(K.parseNumberInput('১৫,২১,৫৯৫.৯৫'), { value: 1521595.95 });
  assert.ok(K.parseNumberInput('12a').invalid);
});

let failed = 0;
for (const [name, fn] of cases) {
  try { fn(); console.log('PASS', name); } catch (e) { failed++; console.log('FAIL', name, '\n ', e.message); }
}
if (typeof test === 'function') { /* Jest: re-register */ for (const [n, f] of cases) test(n, f); }
if (failed) { process.exitCode = 1; } else { console.log(`All ${cases.length} oracle groups pass.`); }
