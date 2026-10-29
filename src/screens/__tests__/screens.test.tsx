import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { defaultState } from '@/state/defaults';
import { useStore } from '@/state/store';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { CalculatorScreen } from '../CalculatorScreen';
import { LoanDetailScreen } from '../LoanDetailScreen';

jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
jest.mock('@/app/useToday', () => ({ useToday: () => '2026-10' }));

const nav = { navigate: jest.fn(), goBack: jest.fn(), setParams: jest.fn(), popTo: jest.fn(), replace: jest.fn() };
const wrap = (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

beforeEach(() => {
  const d = defaultState();
  useStore.setState({ ...d, settings: { ...d.settings, language: 'en', bengaliDigits: false, onboarded: true } });
});

describe('S3 Calculator', () => {
  const renderCalc = () =>
    wrap(<CalculatorScreen navigation={nav as never} route={{ key: 'c', name: 'Calculator' } as never} />);

  test('shows ৳32,683 and ৳32,682.42 by default', async () => {
    await renderCalc();
    expect(screen.getAllByLabelText('32,683 taka').length).toBeGreaterThan(0); // hero (rolling digits)
    expect(screen.getAllByText('৳32,683').length).toBeGreaterThan(0); // sticky bar + formula
    expect(screen.getByText(/৳32,682\.42/)).toBeTruthy();
    expect(screen.getByText(/EMI × 60 would be ৳19,60,980\. The last installment is ৳45\.28 lower\./)).toBeTruthy();
  });

  test('tapping Top-up shows net cash ৳4,14,000.00', async () => {
    await renderCalc();
    await fireEvent.press(screen.getByText('Top-up example'));
    expect(screen.getAllByText('৳4,14,000.00').length).toBeGreaterThan(0);
    expect(screen.getAllByText('৳27,988').length).toBeGreaterThan(0);
  });

  test('an invalid loan amount shows "—" and the validation message', async () => {
    await renderCalc();
    await fireEvent.changeText(screen.getByLabelText('Loan amount'), '');
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Enter the loan amount').length).toBeGreaterThan(0);
    expect(screen.queryByText(/৳32,682\.42/)).toBeNull(); // no stale numbers
  });

  test('Bengali mode uses Bengali digits and copy', async () => {
    await act(() => useStore.getState().setSettings({ language: 'bn', bengaliDigits: true }));
    await renderCalc();
    expect(screen.getAllByLabelText('৩২,৬৮৩ টাকা').length).toBeGreaterThan(0);
    expect(screen.getByText('লোন ও কিস্তি ক্যালকুলেটর')).toBeTruthy();
  });
});

describe('S7 Loan detail', () => {
  test('Loan A with today = 2026-10 selects October 2026 and shows ৳12,55,664.57', async () => {
    const loan = useStore.getState().addLoan({
      bankName: 'Kantha Bank',
      nickname: 'Home loan',
      principal: 1521595.95,
      annualRatePercent: 10.47,
      tenureMonths: 60,
      tenureUnitShown: 'years',
      firstInstallmentMonth: '2025-10',
      deductions: { settlement: 0, insurance: 0, bankFees: 0, other: 0 },
      accent: 'nil',
    });
    await wrap(
      <LoanDetailScreen
        navigation={nav as never}
        route={{ key: 'd', name: 'LoanDetail', params: { loanId: loan.id } } as never}
      />,
    );
    expect(screen.getByText('October 2026')).toBeTruthy();
    expect(screen.getByText('Installment 13 of 60')).toBeTruthy();
    expect(screen.getAllByText('৳12,55,664.57').length).toBeGreaterThan(0);
    expect(screen.getByText('13/60')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('Sep, Paid'.replace('Sep', 'September 2026')));
    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(screen.getAllByText('৳12,77,203.97').length).toBeGreaterThan(0);
  });
});
