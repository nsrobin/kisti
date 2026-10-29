import { bn } from '../bn';
import { en } from '../en';
import {
  formatCompact,
  formatMonth,
  formatPercent,
  formatTaka,
  groupInputText,
  groupLakh,
  speakTaka,
  toBengaliDigits,
} from '../format';
import { t, tp } from '../index';

const EN = { lang: 'en', bengaliDigits: false } as const;
const BN = { lang: 'bn', bengaliDigits: true } as const;

test('lakh grouping', () => {
  expect(formatTaka(196093472, { ...EN, decimals: 2 })).toBe('৳19,60,934.72');
  expect(formatTaka(43933877, { ...EN, decimals: 2 })).toBe('৳4,39,338.77');
  expect(formatTaka(150218887, { ...EN, decimals: 2 })).toBe('৳15,02,188.87');
  expect(formatTaka(1e12, { ...EN, decimals: 2 })).toBe('৳10,00,00,00,000.00');
  expect(groupLakh('1960934')).toBe('19,60,934');
  expect(groupLakh('999')).toBe('999');
  expect(groupLakh('1000')).toBe('1,000');
  expect(formatTaka(3268300, { ...EN, decimals: 0 })).toBe('৳32,683');
  expect(formatTaka(3, { ...EN, decimals: 2 })).toBe('৳0.03');
});

test('Bengali digits and negatives', () => {
  expect(toBengaliDigits('0123456789')).toBe('০১২৩৪৫৬৭৮৯');
  expect(formatTaka(152159595, { ...BN, decimals: 2 })).toBe('৳১৫,২১,৫৯৫.৯৫');
  expect(formatTaka(3268300, { ...BN, decimals: 0 })).toBe('৳৩২,৬৮৩');
  expect(formatTaka(-400000, { ...EN, decimals: 2 })).toBe('−৳4,000.00');
  expect(formatTaka(-400000, { ...BN, decimals: 2 })).toBe('−৳৪,০০০.০০');
  expect(formatTaka(-0, { ...EN, decimals: 2 })).toBe('৳0.00');
  // Bengali digits are off in English mode, and when the setting is off
  expect(formatTaka(3268300, { lang: 'en', bengaliDigits: true, decimals: 0 })).toBe('৳32,683');
  expect(formatTaka(3268300, { lang: 'bn', bengaliDigits: false, decimals: 0 })).toBe('৳32,683');
});

test('compact', () => {
  expect(formatCompact(152159595, 'en', false)).toBe('15.22 lakh');
  expect(formatCompact(152159595, 'bn')).toBe('১৫.২২ লাখ');
  expect(formatCompact(1.5e9, 'en')).toBe('1.5 crore');
  expect(formatCompact(1.5e9, 'bn')).toBe('১.৫ কোটি');
  expect(formatCompact(3268300, 'en')).toBe('৳32,683');
});

test('percent', () => {
  expect(formatPercent(10.47, 2, EN)).toBe('10.47');
  expect(formatPercent(12, 2, EN)).toBe('12');
  expect(formatPercent(0.8725, 4, BN)).toBe('০.৮৭২৫');
  expect(formatPercent(10.57 / 12, 4, EN)).toBe('0.8808');
});

test('months in both forms and languages', () => {
  expect(formatMonth('2027-03', 'long', EN)).toBe('March 2027');
  expect(formatMonth('2027-03', 'short', EN)).toBe('Mar 2027');
  expect(formatMonth('2027-03', 'long', BN)).toBe('মার্চ ২০২৭');
  expect(formatMonth('2025-10', 'short', BN)).toBe('অক্টো ২০২৫');
  expect(formatMonth('2026-01', 'long', BN)).toBe('জানুয়ারি ২০২৬');
  expect(formatMonth('2026-12', 'short', EN)).toBe('Dec 2026');
});

test('screen-reader labels spell out the currency', () => {
  expect(speakTaka(3268300, 'en')).toBe('32,683 taka');
  expect(speakTaka(3268300, 'bn')).toBe('৩২,৬৮৩ টাকা');
  expect(speakTaka(3268242, 'en')).toBe('32,682.42 taka');
  expect(speakTaka(-400000, 'en')).toBe('minus 4,000 taka');
});

test('input grouping on blur', () => {
  expect(groupInputText('1521595.95')).toBe('15,21,595.95');
  expect(groupInputText('1300000')).toBe('13,00,000');
  expect(groupInputText('12.')).toBe('12.');
  expect(groupInputText('abc')).toBe('abc');
});

test('lookups, placeholders and plurals', () => {
  expect(t('en', 'calc.installmentsPill', { n: 60 })).toBe('60 installments');
  expect(t('bn', 'calc.installmentsPill', { n: '৬০' })).toBe('৬০টি কিস্তি');
  expect(t('en', 'calc.installmentsPill')).toBe('{n} installments');
  expect(tp('en', 'loans.thisMonthTotal', 1, { amount: '৳32,683' })).toBe(
    "This month's installments ৳32,683 across 1 loan",
  );
  expect(tp('en', 'loans.thisMonthTotal', 2, { amount: '৳1', count: 2 })).toBe(
    "This month's installments ৳1 across 2 loans",
  );
  expect(tp('bn', 'dur.years', 5, { n: '৫' })).toBe('৫ বছর');
  expect(tp('en', 'dur.years', 1, { n: 1 })).toBe('1 year');
});

test('dictionaries have exactly the same keys', () => {
  expect(Object.keys(bn).sort()).toEqual(Object.keys(en).sort());
  expect(Object.values(bn).every(v => v.length > 0)).toBe(true);
});
