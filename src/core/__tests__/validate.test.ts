import { parseNumber, validateInputs, type RawLoanInputs } from '../loan';

const base: RawLoanInputs = {
  principal: '15,21,595.95',
  annualRatePercent: '10.47',
  tenureValue: '5',
  tenureUnit: 'years',
  settlement: '',
  insurance: '',
  bankFees: '',
  other: '',
};
const errorsOf = (patch: Partial<RawLoanInputs>) => {
  const res = validateInputs({ ...base, ...patch });
  return res.ok ? {} : res.errors;
};

describe('parseNumber', () => {
  test.each([
    ['১৫,২১,৫৯৫.৯৫', 1521595.95],
    ['15,21,595.95', 1521595.95],
    ['৳ 32,683', 32683],
    ['10.47', 10.47],
    ['.5', 0.5],
    ['12.', 12],
    ['-4', -4],
    ['−4', -4],
    ['০', 0],
  ])('%p → %p', (text, value) => expect(parseNumber(text)).toBe(value));

  test.each(['', '   ', '12a', '.', '1.2.3', 'abc', '--1', '1e5'])('%p → null', text =>
    expect(parseNumber(text)).toBeNull(),
  );
});

describe('validateInputs', () => {
  test('valid input', () => {
    const res = validateInputs(base);
    expect(res).toEqual({
      ok: true,
      inputs: {
        principal: 1521595.95,
        annualRatePercent: 10.47,
        tenureMonths: 60,
        deductions: { settlement: 0, insurance: 0, bankFees: 0, other: 0 },
      },
    });
  });

  test('loan amount', () => {
    expect(errorsOf({ principal: '' }).principal).toBe('required');
    expect(errorsOf({ principal: 'abc' }).principal).toBe('notNumber');
    expect(errorsOf({ principal: '0' }).principal).toBe('mustBePositive');
    expect(errorsOf({ principal: '-5' }).principal).toBe('mustBePositive');
    expect(errorsOf({ principal: '10000000001' }).principal).toBe('tooLarge');
    expect(errorsOf({ principal: '10,00,00,00,000' }).principal).toBeUndefined();
  });

  test('rate', () => {
    expect(errorsOf({ annualRatePercent: '' }).annualRatePercent).toBe('required');
    expect(errorsOf({ annualRatePercent: 'x' }).annualRatePercent).toBe('notNumber');
    expect(errorsOf({ annualRatePercent: '50.01' }).annualRatePercent).toBe('rateRange');
    expect(errorsOf({ annualRatePercent: '-1' }).annualRatePercent).toBe('rateRange');
    expect(errorsOf({ annualRatePercent: '0' }).annualRatePercent).toBeUndefined();
    expect(errorsOf({ annualRatePercent: '50' }).annualRatePercent).toBeUndefined();
  });

  test('duration', () => {
    expect(errorsOf({ tenureValue: '0', tenureUnit: 'months' }).tenureValue).toBe('durationRange');
    expect(errorsOf({ tenureValue: '361', tenureUnit: 'months' }).tenureValue).toBe('durationRange');
    expect(errorsOf({ tenureValue: '31', tenureUnit: 'years' }).tenureValue).toBe('durationRange');
    expect(errorsOf({ tenureValue: '1.5', tenureUnit: 'months' }).tenureValue).toBe('durationRange');
    expect(errorsOf({ tenureValue: '', tenureUnit: 'months' }).tenureValue).toBe('durationRange');
    expect(errorsOf({ tenureValue: '360', tenureUnit: 'months' }).tenureValue).toBeUndefined();
    expect(errorsOf({ tenureValue: '1', tenureUnit: 'months' }).tenureValue).toBeUndefined();
  });

  test('deductions', () => {
    expect(errorsOf({ settlement: 'x' }).settlement).toBe('notNumber');
    expect(errorsOf({ bankFees: '-1' }).bankFees).toBe('negative');
    const res = validateInputs({ ...base, settlement: '৮,৫১,০০০', insurance: '30000', bankFees: '5,000' });
    expect(res.ok && res.inputs.deductions).toEqual({
      settlement: 851000,
      insurance: 30000,
      bankFees: 5000,
      other: 0,
    });
  });
});
