import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation-types';
import { useToday } from '@/app/useToday';
import { MonthPickerSheet } from '@/components/calendar/MonthPickerSheet';
import { Button } from '@/components/primitives/Button';
import { useCardStyle } from '@/components/primitives/Card';
import { DurationInput } from '@/components/primitives/Controls';
import { Icon } from '@/components/primitives/Icon';
import { MonthField, NumberInput, TextField, type InputRef } from '@/components/primitives/Inputs';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { ScreenHeader } from '@/components/primitives/ScreenHeader';
import { Txt } from '@/components/primitives/Txt';
import { calculateLoan } from '@/core/loan/calculate';
import type { InputField, RawLoanInputs } from '@/core/loan/types';
import { validateInputs } from '@/core/loan/validate';
import { toPaisa } from '@/core/money';
import { monthForInstallment, type YearMonth } from '@/core/months';
import { feedback } from '@/feedback';
import { useT } from '@/i18n';
import { PRESETS } from '@/state/defaults';
import { nextAccent, useStore } from '@/state/store';
import { ACCENTS, type Accent, type SavedLoan } from '@/state/types';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { errorMessage } from './errors';

const EMPTY: RawLoanInputs = {
  ...PRESETS.current,
  principal: '',
  annualRatePercent: '',
  settlement: '',
  insurance: '',
  bankFees: '',
  other: '',
};
const str = (n: number) => (n ? String(n) : '');

function rawFromLoan(l: SavedLoan): RawLoanInputs {
  return {
    principal: String(l.principal),
    annualRatePercent: String(l.annualRatePercent),
    tenureValue: String(
      l.tenureUnitShown === 'years' && l.tenureMonths % 12 === 0 ? l.tenureMonths / 12 : l.tenureMonths,
    ),
    tenureUnit: l.tenureUnitShown === 'years' && l.tenureMonths % 12 === 0 ? 'years' : 'months',
    settlement: str(l.deductions.settlement),
    insurance: str(l.deductions.insurance),
    bankFees: str(l.deductions.bankFees),
    other: str(l.deductions.other),
  };
}

/** S5: add or edit a loan, with a live EMI preview in the sticky footer. */
export function LoanFormScreen({ navigation, route }: RootScreenProps<'LoanForm'>) {
  const s = useStyles();
  const card = useCardStyle();
  const t = useTheme();
  const i18n = useT();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const editing = useStore(st => st.loans.find(l => l.id === route.params?.loanId));
  const loanCount = useStore(st => st.loans.length);
  const recent = useStore(st => st.recentBankNames);
  const addLoan = useStore(st => st.addLoan);
  const updateLoan = useStore(st => st.updateLoan);

  const [bankName, setBankName] = useState(editing?.bankName ?? '');
  const [nickname, setNickname] = useState(editing?.nickname ?? '');
  const [raw, setRaw] = useState<RawLoanInputs>(() =>
    editing ? rawFromLoan(editing) : route.params?.prefill ?? EMPTY,
  );
  const [first, setFirst] = useState<YearMonth | null>(editing?.firstInstallmentMonth ?? null);
  const [accent, setAccent] = useState<Accent>(editing?.accent ?? nextAccent(loanCount));
  const hasDeductions = [raw.settlement, raw.insurance, raw.bankFees, raw.other].some(v => v !== '' && v !== '0');
  const [dedOpen, setDedOpen] = useState(hasDeductions);
  const [picker, setPicker] = useState(false);
  const [touched, setTouched] = useState<Set<string>>(() => new Set(editing ? ['all'] : []));
  const touch = (k: string) => setTouched(prev => (prev.has(k) ? prev : new Set(prev).add(k)));
  const shown = (k: string) => touched.has(k) || touched.has('all');

  const validation = useMemo(() => validateInputs(raw), [raw]);
  const results = useMemo(() => (validation.ok ? calculateLoan(validation.inputs) : null), [validation]);
  const errors = validation.ok ? {} : validation.errors;
  const bankError = bankName.trim() ? undefined : i18n.t('err.bankNameEmpty');
  const valid = validation.ok && !bankError && first !== null;
  const err = (f: InputField) => (shown(f) ? errorMessage(i18n, f, errors[f]) : undefined);
  const set = (patch: Partial<RawLoanInputs>) => {
    setRaw(r => ({ ...r, ...patch }));
    Object.keys(patch).forEach(touch);
  };

  const rateRef = useRef<InputRef>(null);
  const amountRef = useRef<InputRef>(null);
  const suggestions = recent
    .filter(
      n => n.toLowerCase() !== bankName.trim().toLowerCase() && n.toLowerCase().includes(bankName.trim().toLowerCase()),
    )
    .slice(0, 6);

  const save = () => {
    if (!validation.ok || !first || bankError) {
      return;
    }
    const draft = {
      bankName,
      nickname,
      principal: validation.inputs.principal,
      annualRatePercent: validation.inputs.annualRatePercent,
      tenureMonths: validation.inputs.tenureMonths,
      tenureUnitShown: raw.tenureUnit,
      firstInstallmentMonth: first,
      deductions: validation.inputs.deductions,
      accent,
    };
    if (editing) {
      updateLoan(editing.id, draft);
      navigation.popTo('LoanDetail', { loanId: editing.id, justSaved: true });
    } else {
      const loan = addLoan(draft);
      navigation.replace('LoanDetail', { loanId: loan.id, justSaved: true });
    }
  };

  const lastMonth = results && first ? monthForInstallment(first, results.actualInstallmentCount) : null;
  const net = validation.ok ? toPaisa(validation.inputs.principal) - (results?.totalDeductionsPaisa ?? 0) : null;

  return (
    <View style={s.screen}>
      <ScreenHeader
        leading={{ icon: 'x', label: i18n.t('a11y.close'), onPress: () => navigation.goBack() }}
        title={editing ? i18n.t('form.editTitle') : i18n.t('loans.add')}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
          <TextField
            label={i18n.t('form.bankName')}
            icon="bank"
            value={bankName}
            onChangeText={setBankName}
            onBlur={() => touch('bank')}
            error={shown('bank') ? bankError : undefined}
            autoCapitalize="words"
            returnKeyType="next"
            maxLength={60}
          />
          {suggestions.length > 0 ? (
            <View style={{ gap: 6, marginTop: -6 }}>
              {!bankName ? (
                <Txt v="caption" color="textMuted">
                  {i18n.t('form.recentBanks')}
                </Txt>
              ) : null}
              <View style={s.chips}>
                {suggestions.map(n => (
                  <Pressable key={n} accessibilityRole="button" onPress={() => setBankName(n)} style={s.chip}>
                    <Txt v="caption" weight={600}>
                      {n}
                    </Txt>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          <TextField
            label={i18n.t('form.nickname')}
            icon="pencil"
            value={nickname}
            onChangeText={setNickname}
            placeholder={i18n.t('form.nicknamePlaceholder')}
            returnKeyType="next"
            onSubmitEditing={() => amountRef.current?.focus()}
            maxLength={40}
          />
          <NumberInput
            ref={amountRef}
            kind="amount"
            label={i18n.t('loan.amount')}
            helper={i18n.t('form.amountHelp')}
            value={raw.principal}
            onChangeText={v => set({ principal: v })}
            error={err('principal')}
            returnKeyType="next"
            onSubmitEditing={() => rateRef.current?.focus()}
          />
          <NumberInput
            ref={rateRef}
            kind="rate"
            label={i18n.t('loan.rate')}
            value={raw.annualRatePercent}
            onChangeText={v => set({ annualRatePercent: v })}
            error={err('annualRatePercent')}
          />
          <DurationInput
            label={i18n.t('loan.duration')}
            value={raw.tenureValue}
            unit={raw.tenureUnit}
            onChange={(tenureValue, tenureUnit) => set({ tenureValue, tenureUnit })}
            error={err('tenureValue')}
          />
          <MonthField
            label={i18n.t('form.firstMonth')}
            value={first ? i18n.month(first) : null}
            placeholder={i18n.t('form.chooseMonth')}
            onPress={() => setPicker(true)}
            error={shown('month') && !first ? i18n.t('err.firstMonthEmpty') : undefined}
          />

          <View style={[card.card, { padding: 0 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: dedOpen }}
              onPress={() => {
                feedback.toggle();
                setDedOpen(!dedOpen);
              }}
              style={s.dedHeader}
            >
              <Icon name="receipt" color={t.c.deduction} duotone />
              <Txt v="body" weight={600} style={{ flex: 1 }}>
                {i18n.t('form.addDeductions')}
              </Txt>
              <View style={{ transform: [{ rotate: dedOpen ? '180deg' : '0deg' }] }}>
                <Icon name="caretDown" color={t.c.textSecondary} size={20} />
              </View>
            </Pressable>
            {dedOpen ? (
              <Animated.View
                entering={FadeIn}
                exiting={FadeOut}
                style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 14 }}
              >
                {(['settlement', 'insurance', 'bankFees', 'other'] as const).map(k => (
                  <NumberInput
                    key={k}
                    kind="amount"
                    label={i18n.t(k === 'bankFees' ? 'ded.fees' : `ded.${k}`)}
                    value={raw[k]}
                    onChangeText={v => set({ [k]: v })}
                    error={err(k)}
                  />
                ))}
                <View
                  style={{
                    borderRadius: t.radius.input,
                    padding: 14,
                    gap: 4,
                    backgroundColor: alpha(net !== null && net < 0 ? t.c.error : t.c.cash, 0.1),
                  }}
                >
                  <Txt v="caption" color="textSecondary">
                    {i18n.t('ded.netCash')}
                  </Txt>
                  <MoneyValue paisa={net} size="lg" color={net !== null && net < 0 ? 'error' : 'cash'} />
                </View>
              </Animated.View>
            ) : null}
          </View>

          <View style={{ gap: 10 }}>
            <Txt v="caption" color="textSecondary">
              {i18n.t('form.colour')}
            </Txt>
            <View style={s.swatches} accessibilityRole="radiogroup">
              {ACCENTS.map((a, i) => (
                <Pressable
                  key={a}
                  accessibilityRole="radio"
                  accessibilityLabel={i18n.t('a11y.colour', { n: i18n.int(i + 1) })}
                  accessibilityState={{ selected: accent === a }}
                  onPress={() => {
                    feedback.tap();
                    setAccent(a);
                  }}
                  style={[
                    s.swatch,
                    { backgroundColor: t.accent[a] },
                    accent === a && { borderWidth: 3, borderColor: t.c.textPrimary },
                  ]}
                >
                  {accent === a ? <Icon name="check" color={t.c.bgBase} size={20} bold /> : null}
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flex: 1 }}>
            <Txt v="caption" color="textSecondary" numberOfLines={1}>
              {i18n.t('calc.bankEmi')}
            </Txt>
            <MoneyValue paisa={results ? results.bankEmi * 100 : null} fontSize={22} weight={800} decimals={0} />
            {lastMonth ? (
              <Txt v="caption" color="textMuted" numberOfLines={1}>
                {i18n.t('form.lastMonthPreview', { month: i18n.month(lastMonth) })}
              </Txt>
            ) : null}
          </View>
          <Button label={i18n.t('form.save')} onPress={save} disabled={!valid} />
        </View>
      </KeyboardAvoidingView>

      <MonthPickerSheet
        visible={picker}
        value={first}
        today={today}
        onClose={() => {
          setPicker(false);
          touch('month');
        }}
        onDone={ym => {
          feedback.stitch();
          setFirst(ym);
          setPicker(false);
          touch('month');
        }}
      />
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: { flex: 1, backgroundColor: t.c.bgBase },
  content: { paddingHorizontal: t.space.screen, paddingTop: 8, paddingBottom: 32, gap: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 40,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: t.radius.pill,
    backgroundColor: t.c.bgRaised,
    borderWidth: 1,
    borderColor: t.c.line,
  },
  dedHeader: { minHeight: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10 },
  swatches: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  swatch: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: t.space.screen,
    backgroundColor: t.c.glass,
    borderTopWidth: 1,
    borderTopColor: t.c.line,
  },
}));
