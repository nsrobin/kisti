// Kisti reference engine. This is the exact logic every design board runs, so the
// numbers on the canvas and in the app match. Port to TypeScript in src/domain/.
// Money in the schedule is INTEGER PAISA. Spec: §5 (authoritative), §9.2 (formatting).

'use strict';

// ---------- calculation (§5.2 to §5.6) ----------
function calcLoan(principal, annualRatePercent, tenureMonths) {
  const r = annualRatePercent / 100 / 12;
  const n = tenureMonths;
  const pow = Math.pow(1 + r, n);
  const exactEmi = r > 0 ? (principal * r * pow) / (pow - 1) : principal / n;
  const bankEmi = Math.ceil(exactEmi - 1e-6); // §5.4 ceiling rule, never nearest
  let balance = Math.round(principal * 100);
  const emi = bankEmi * 100;
  const rows = [];
  for (let k = 1; k <= n && balance > 0; k++) {
    const interest = Math.round(balance * r); // half-up to the paisa (positive values)
    let payment = emi;
    if (k === n || balance + interest <= emi) payment = balance + interest; // last or early payoff
    const principalPart = payment - interest;
    const closing = balance - principalPart;
    rows.push({ k, opening: balance, interest, principalPart, payment, closing });
    balance = closing;
  }
  let total = 0, totalInterest = 0;
  for (const x of rows) { total += x.payment; totalInterest += x.interest; }
  const emiTimesN = bankEmi * n * 100;
  return {
    r, n, pow, exactEmi, bankEmi, rows,
    actualInstallmentCount: rows.length,
    totalRepaymentEstimate: total,          // paisa, the MAIN total
    totalInterestEstimate: totalInterest,   // paisa
    lastInstallment: rows[rows.length - 1].payment,
    emiTimesN,                              // caption only (§5.6)
    lastInstallmentAdjustment: emiTimesN - total,
    showEmiTimesNCaption: rows.length === n && emiTimesN !== total,
    earlyPayoff: rows.length < n,
    interestShare: totalInterest / total,
  };
}

// §5.8 deductions, amounts in taka
function deductions(principal, d) {
  const p = (x) => Math.round((x || 0) * 100);
  const total = p(d.settlement) + p(d.insurance) + p(d.bankFees) + p(d.other);
  const net = Math.round(principal * 100) - total; // never clamp to 0
  return { totalDeductions: total, netCashReceived: net, deductionsExceedPrincipal: net < 0 };
}

// §5.9 month snapshot for installment k (1-based)
function monthSnapshot(c, k) {
  let paid = 0, interestPaid = 0, principalPaid = 0, still = 0;
  for (const x of c.rows) {
    if (x.k <= k) { paid += x.payment; interestPaid += x.interest; principalPaid += x.principalPart; }
    else still += x.payment;
  }
  const row = c.rows[k - 1];
  return { installment: row.payment, interest: row.interest, principal: row.principalPart, opening: row.opening,
    remaining: row.closing, paidSoFar: paid, interestPaidSoFar: interestPaid, principalPaidSoFar: principalPaid,
    stillToPay: still, installmentsLeft: c.actualInstallmentCount - k };
}

// ---------- year-month (§5.10), months are integers y*12 + (m-1) ----------
const ym = (y, m) => y * 12 + (m - 1);
const ymYear = (i) => Math.floor(i / 12);
const ymMonth = (i) => (i % 12) + 1;
function monthStatus(F, count, current, M) {
  const last = F + count - 1;
  if (M < F || M > last) return 'outside';
  return M < current ? 'paid' : M === current ? 'due' : 'upcoming';
}
function loanState(F, count, current) {
  const last = F + count - 1;
  if (current < F) return { state: 'notStarted', startsInMonths: F - current };
  if (current > last) return { state: 'completed' };
  return { state: 'running', k: current - F + 1 };
}
// S7 default selection (§7.4)
function defaultSelectedMonth(F, count, current) {
  const s = loanState(F, count, current).state;
  return s === 'running' ? current : s === 'notStarted' ? F : F + count - 1;
}

// ---------- formatting (§9.2) ----------
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const toBnDigits = (s) => String(s).replace(/[0-9]/g, (c) => BN_DIGITS[+c]);
const fromBnDigits = (s) => String(s).replace(/[০-৯]/g, (c) => String(BN_DIGITS.indexOf(c)));
function lakhGroup(intStr) { // 1521595 -> 15,21,595
  if (intStr.length <= 3) return intStr;
  const last3 = intStr.slice(-3), rest = intStr.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}
// paisa -> { sign, symbol, number, full }. whole=true drops paisa (bank EMI).
function formatMoney(paisa, { bengaliDigits = false, whole = false } = {}) {
  if (paisa == null || Number.isNaN(paisa)) return { sign: '', symbol: '', number: '—', full: '—' };
  const neg = paisa < 0; const p = Math.abs(Math.round(paisa));
  let n = whole ? lakhGroup(String(Math.round(p / 100)))
                : lakhGroup(String(Math.floor(p / 100))) + '.' + String(p % 100).padStart(2, '0');
  if (bengaliDigits) n = toBnDigits(n);
  const sign = neg ? '−' : ''; // true minus sign
  return { sign, symbol: '৳', number: n, full: sign + '৳' + n };
}
// Compact (cards and chips only, >= 1 lakh): 15.22 lakh / ১৫.২২ লাখ, 1.5 crore
function formatCompact(paisa, lang, bengaliDigits) {
  const t = paisa / 100;
  const trim = (x) => x.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  let s;
  if (t >= 1e7) s = trim(t / 1e7) + (lang === 'bn' ? ' কোটি' : ' crore');
  else if (t >= 1e5) s = trim(t / 1e5) + (lang === 'bn' ? ' লাখ' : ' lakh');
  else return formatMoney(paisa, { bengaliDigits, whole: true }).full;
  return bengaliDigits ? toBnDigits(s) : s;
}
// Rates: 10.47% / ০.৮৭২৫% — trim trailing zeros
function formatRate(pct, decimals, bengaliDigits) {
  let s = pct.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  return bengaliDigits ? toBnDigits(s) : s;
}
// Input parsing (§5.11): accepts 0-9 and ০-৯, ignores grouping commas
function parseNumberInput(raw) {
  const s = fromBnDigits(raw == null ? '' : raw).replace(/,/g, '').trim();
  if (s === '') return { empty: true };
  if (!/^\d*\.?\d*$/.test(s) || s === '.') return { invalid: true };
  return { value: parseFloat(s) };
}

// ---------- stitch geometry (tokens.stitch) ----------
// Returns arc segments per status for an SVG ring of `size` pt.
function ringSegments(size, count, paidCount, dueK) {
  const yearMode = count > 120, units = yearMode ? Math.ceil(count / 12) : count;
  const cx = size / 2, R = size / 2 - size * 0.07, per = (2 * Math.PI * R) / units;
  const stroke = Math.min(size * 0.032, Math.max(size * 0.016, per * 0.42));
  const arc = Math.max(per * 0.6 - stroke, 0.4);
  const segs = [];
  for (let u = 0; u < units; u++) {
    let status;
    if (!yearMode) { const k = u + 1; status = k <= paidCount ? 'paid' : k === dueK ? 'due' : 'upcoming'; }
    else { const a = u * 12 + 1, b = Math.min((u + 1) * 12, count);
      status = paidCount >= b ? 'paid' : ((dueK >= a && dueK <= b) || (paidCount >= a && paidCount < b)) ? 'due' : 'upcoming'; }
    const len = yearMode && u === units - 1 && count % 12 !== 0 ? arc * 0.5 : arc;
    const mid = -Math.PI / 2 + ((u + 0.5) * per) / R, h = len / 2 / R;
    segs.push({ status, x0: cx + R * Math.cos(mid - h), y0: cx + R * Math.sin(mid - h), x1: cx + R * Math.cos(mid + h), y1: cx + R * Math.sin(mid + h) });
  }
  return { R, stroke, glowStroke: stroke * 2.8, segs };
}

module.exports = { calcLoan, deductions, monthSnapshot, ym, ymYear, ymMonth, monthStatus, loanState, defaultSelectedMonth,
  toBnDigits, fromBnDigits, lakhGroup, formatMoney, formatCompact, formatRate, parseNumberInput, ringSegments };
