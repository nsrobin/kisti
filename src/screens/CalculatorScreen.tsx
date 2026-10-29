import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '@/app/navigation-types';
import { TAB_BAR_HEIGHT } from '@/app/TabBar';
import { InterestShareBar, StackedBar } from '@/components/money/Bars';
import { HeroEmiCard, StickyEmiBar } from '@/components/money/HeroEmiCard';
import { Button } from '@/components/primitives/Button';
import { Hairline, SectionCard } from '@/components/primitives/Card';
import { PresetChip } from '@/components/primitives/Chips';
import { DurationInput } from '@/components/primitives/Controls';
import { NoteBox, WarningBanner } from '@/components/primitives/Feedback';
import { Icon } from '@/components/primitives/Icon';
import { NumberInput, type InputRef } from '@/components/primitives/Inputs';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { DeductionRow, InfoRow, SummaryRow } from '@/components/primitives/Rows';
import { StatusBarScrim } from '@/components/primitives/StatusBarScrim';
import { Txt } from '@/components/primitives/Txt';
import { FormulaAccordion } from '@/components/schedule/FormulaAccordion';
import { ScheduleAccordion } from '@/components/schedule/ScheduleAccordion';
import { calculateLoan } from '@/core/loan/calculate';
import type { ErrorCode, InputField, LoanResults, RawLoanInputs } from '@/core/loan/types';
import { parseNumber } from '@/core/loan/parse';
import { validateInputs } from '@/core/loan/validate';
import { toPaisa } from '@/core/money';
import { feedback } from '@/feedback';
import { MOTION } from '@/feedback/motion';
import { useT, type I18n } from '@/i18n';
import { PRESETS, type PresetId } from '@/state/defaults';
import { useStore } from '@/state/store';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { errorMessage, FIELD_ORDER } from './errors';
import { useDebounced } from './useDebounced';

type Errors = Partial<Record<InputField, ErrorCode>>;
const ZERO_DED = { settlement: 0, insurance: 0, bankFees: 0, other: 0 };
const PRESET_IDS: PresetId[] = ['current', 'topup', 'original'];
const sameInputs = (a: RawLoanInputs, b: RawLoanInputs) =>
  (Object.keys(a) as (keyof RawLoanInputs)[]).every(k => a[k] === b[k]);

/** S3: single scrollable calculator; results update on every valid keystroke (§6). */
export function CalculatorScreen({ navigation }: TabScreenProps<'Calculator'>) {
  const s = useStyles();
  const i18n = useT();
  const insets = useSafeAreaInsets();
  const setDraft = useStore(st => st.setCalculatorDraft);
  const [raw, setRaw] = useState<RawLoanInputs>(() => useStore.getState().calculatorDraft);

  // Draft writes are debounced by 300 ms (§22).
  useEffect(() => {
    const id = setTimeout(() => setDraft(raw), 300);
    return () => clearTimeout(id);
  }, [raw, setDraft]);

  const activePreset = PRESET_IDS.find(id => sameInputs(PRESETS[id], raw)) ?? null;
  const validation = useMemo(() => validateInputs(raw), [raw]);
  const errors: Errors = validation.ok ? {} : validation.errors;
  const inputs = validation.ok ? validation.inputs : null;

  // The schedule ignores deductions, so typing a deduction never recomputes or re-renders it.
  const P = inputs?.principal;
  const rate = inputs?.annualRatePercent;
  const n = inputs?.tenureMonths;
  const core = useMemo(
    () =>
      P !== undefined && rate !== undefined && n !== undefined
        ? calculateLoan({ principal: P, annualRatePercent: rate, tenureMonths: n, deductions: ZERO_DED })
        : null,
    [P, rate, n],
  );
  const settledEmi = useDebounced(core ? core.bankEmi * 100 : null, 250);

  const firstError = FIELD_ORDER.map(f => errorMessage(i18n, f, errors[f])).find(Boolean);
  const set = useCallback((patch: Partial<RawLoanInputs>) => setRaw(r => ({ ...r, ...patch })), []);

  // Sticky mini EMI bar once the hero leaves the screen.
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const scrollY = useSharedValue(0);
  const heroBottom = useSharedValue(400);
  const reduce = useReducedMotion();
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.value = e.contentOffset.y;
  });
  const sticky = useDerivedValue<number>(() =>
    withTiming(scrollY.value > heroBottom.value ? 1 : 0, { duration: reduce ? MOTION.reduced : MOTION.standard }),
  );
  const scrollTop = () => scrollRef.current?.scrollTo({ y: 0, animated: !reduce });

  const refs = {
    rate: useRef<InputRef>(null),
    settlement: useRef<InputRef>(null),
    insurance: useRef<InputRef>(null),
    bankFees: useRef<InputRef>(null),
    other: useRef<InputRef>(null),
  };

  return (
    <View style={s.screen}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? undefined : 'height'}>
        <Animated.ScrollView
          ref={scrollRef}
          onScroll={onScroll}
          scrollEventThrottle={16}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={[
            s.content,
            { paddingTop: insets.top + 24, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 32 },
          ]}
        >
          <View style={{ gap: 2, paddingBottom: 4 }}>
            <Txt v="title" accessibilityRole="header">
              {i18n.t('app.title')}
            </Txt>
            <Txt v="caption" color="textSecondary">
              {i18n.t('app.subtitle')}
            </Txt>
          </View>

          <View onLayout={e => (heroBottom.value = e.nativeEvent.layout.y + e.nativeEvent.layout.height - insets.top)}>
            {core && settledEmi !== null ? (
              <HeroEmiCard
                valid
                bankEmiPaisa={settledEmi}
                exactEmiPaisa={Math.round(core.exactEmi * 100)}
                count={core.installmentCount}
                monthlyRatePct={core.monthlyRate * 100}
              />
            ) : (
              <HeroEmiCard valid={false} error={firstError ?? i18n.t('err.notANumber')} />
            )}
          </View>

          <Presets active={activePreset} onPick={id => setRaw({ ...PRESETS[id] })} i18n={i18n} />

          <LoanDetailsSection
            raw={raw}
            errors={errors}
            core={core}
            set={set}
            rateRef={refs.rate}
            nextRef={refs.settlement}
          />
          <DeductionsSection
            raw={raw}
            errors={errors}
            principal={errors.principal ? null : parseNumber(raw.principal)}
            set={set}
            refs={refs}
          />
          <SummarySection core={core} />

          {core && inputs ? (
            <>
              <MemoFormula
                results={core}
                principalPaisa={toPaisa(inputs.principal)}
                annualRate={inputs.annualRatePercent}
              />
              <MemoSchedule
                results={core}
                onShowAll={() => {
                  setDraft(raw);
                  navigation.navigate('FullSchedule', {});
                }}
              />
            </>
          ) : null}

          <Button
            label={i18n.t('action.saveAsLoan')}
            variant="secondary"
            icon="bank"
            onPress={() => navigation.navigate('LoanForm', { prefill: raw })}
          />
        </Animated.ScrollView>
      </KeyboardAvoidingView>
      <StatusBarScrim />
      <StickyEmiBar
        paisa={core ? core.bankEmi * 100 : null}
        visible={sticky}
        top={insets.top + 10}
        onPress={() => scrollTop()}
      />
    </View>
  );
}

const MemoFormula = memo(FormulaAccordion);
const MemoSchedule = memo(ScheduleAccordion, (a, b) => a.results === b.results);

const Presets = memo(function PresetsImpl({
  active,
  onPick,
  i18n,
}: {
  active: PresetId | null;
  onPick: (id: PresetId) => void;
  i18n: I18n;
}) {
  const labels: Record<PresetId, string> = {
    current: i18n.t('preset.current'),
    topup: i18n.t('preset.topup'),
    original: i18n.t('preset.original'),
  };
  return (
    <View style={{ gap: 8 }}>
      <Txt v="caption" color="textSecondary">
        {i18n.t('calc.presets')}
      </Txt>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -20 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        {PRESET_IDS.map(id => (
          <PresetChip
            key={id}
            label={labels[id]}
            active={active === id}
            onPress={() => {
              feedback.tap();
              onPick(id);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
});

type SectionProps = { raw: RawLoanInputs; errors: Errors; set: (p: Partial<RawLoanInputs>) => void };

const LoanDetailsSection = memo(function LoanDetailsSectionImpl({
  raw,
  errors,
  core,
  set,
  rateRef,
  nextRef,
}: SectionProps & {
  core: LoanResults | null;
  rateRef: React.RefObject<InputRef | null>;
  nextRef: React.RefObject<InputRef | null>;
}) {
  const i18n = useT();
  return (
    <SectionCard title={i18n.t('loan.details')} icon="coins" iconColor="emi">
      <NumberInput
        kind="amount"
        label={i18n.t('loan.amount')}
        value={raw.principal}
        onChangeText={v => set({ principal: v })}
        error={errorMessage(i18n, 'principal', errors.principal)}
        returnKeyType="next"
        onSubmitEditing={() => rateRef.current?.focus()}
      />
      <NumberInput
        ref={rateRef}
        kind="rate"
        label={i18n.t('loan.rate')}
        value={raw.annualRatePercent}
        onChangeText={v => set({ annualRatePercent: v })}
        error={errorMessage(i18n, 'annualRatePercent', errors.annualRatePercent)}
        returnKeyType="next"
        onSubmitEditing={() => nextRef.current?.focus()}
      />
      <DurationInput
        label={i18n.t('loan.duration')}
        value={raw.tenureValue}
        unit={raw.tenureUnit}
        onChange={(tenureValue, tenureUnit) => set({ tenureValue, tenureUnit })}
        error={errorMessage(i18n, 'tenureValue', errors.tenureValue)}
      />
      <Hairline />
      <InfoRow label={i18n.t('loan.monthlyRate')} value={core ? `${i18n.percent(core.monthlyRate * 100, 4)}%` : '—'} />
      <InfoRow label={i18n.t('loan.installmentCount')} value={core ? i18n.int(core.installmentCount) : '—'} />
    </SectionCard>
  );
});

const DED_FIELDS = [
  { key: 'settlement', label: 'ded.settlement', icon: 'arrowsClockwise' },
  { key: 'insurance', label: 'ded.insurance', icon: 'shieldCheck' },
  { key: 'bankFees', label: 'ded.fees', icon: 'receipt' },
  { key: 'other', label: 'ded.other', icon: 'coins' },
] as const;

const DeductionsSection = memo(function DeductionsSectionImpl({
  raw,
  errors,
  principal,
  set,
  refs,
}: SectionProps & {
  principal: number | null;
  refs: Record<'settlement' | 'insurance' | 'bankFees' | 'other', React.RefObject<InputRef | null>>;
}) {
  const i18n = useT();
  const t = useTheme();
  // Each deduction parses independently; an invalid one shows "—" and blanks the totals.
  const values = DED_FIELDS.map(f => (errors[f.key] ? null : toPaisa(parseNumber(raw[f.key]) ?? 0)));
  const dedValid = values.every(v => v !== null);
  const total = dedValid ? (values as number[]).reduce((a, b) => a + b, 0) : null;
  const principalPaisa = principal !== null ? toPaisa(principal) : null;
  const net = total !== null && principalPaisa !== null ? principalPaisa - total : null;
  const exceeds = net !== null && net < 0;
  const order = ['settlement', 'insurance', 'bankFees', 'other'] as const;

  return (
    <SectionCard title={i18n.t('ded.title')} icon="receipt" iconColor="deduction">
      {DED_FIELDS.map((f, idx) => (
        <NumberInput
          key={f.key}
          ref={refs[f.key]}
          kind="amount"
          label={i18n.t(f.label)}
          value={raw[f.key]}
          onChangeText={v => set({ [f.key]: v })}
          error={errorMessage(i18n, f.key, errors[f.key])}
          returnKeyType={idx < 3 ? 'next' : 'done'}
          onSubmitEditing={() => (idx < 3 ? refs[order[idx + 1]!].current?.focus() : undefined)}
        />
      ))}
      {exceeds ? <WarningBanner message={i18n.t('err.deductionsExceed', { amount: i18n.taka(-net) })} /> : null}
      <Hairline />
      <SummaryRow label={i18n.t('ded.approved')} paisa={principalPaisa} color="principal" />
      {DED_FIELDS.map((f, idx) => (
        <DeductionRow key={f.key} label={i18n.t(f.label)} icon={f.icon} paisa={values[idx] ?? null} />
      ))}
      <SummaryRow label={i18n.t('ded.total')} paisa={total} color="deduction" />
      {net !== null && total !== null ? (
        <StackedBar
          deductions={total}
          cash={net}
          label={`${i18n.t('ded.total')} ${i18n.speak(total)}, ${i18n.t('ded.cashShort')} ${i18n.speak(net)}`}
          legend={[i18n.t('ded.total'), i18n.t('ded.cashShort')]}
        />
      ) : null}
      <View
        style={{
          borderRadius: t.radius.input,
          padding: 14,
          gap: 4,
          backgroundColor: alpha(exceeds ? t.c.error : t.c.cash, 0.1),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Icon name="handCoins" color={exceeds ? t.c.error : t.c.cash} duotone />
          <Txt v="caption" color="textSecondary" style={{ flex: 1 }}>
            {i18n.t('ded.netCash')}
          </Txt>
        </View>
        <MoneyValue paisa={net} size="xl" color={exceeds ? 'error' : 'cash'} />
      </View>
    </SectionCard>
  );
});

const SummarySection = memo(function SummarySectionImpl({ core }: { core: LoanResults | null }) {
  const i18n = useT();
  const v = (p: number | undefined) => (core && p !== undefined ? p : null);
  const caption = core?.showEmiTimesNCaption
    ? i18n.t('sum.emiTimesN', {
        n: i18n.int(core.installmentCount),
        amount: i18n.taka(core.emiTimesNPaisa, 0),
        diff: i18n.taka(core.lastInstallmentAdjustmentPaisa),
      })
    : undefined;
  return (
    <SectionCard title={i18n.t('sum.title')} icon="chartPie" iconColor="interest">
      <InfoRow label={i18n.t('loan.installmentCount')} value={core ? i18n.int(core.actualInstallmentCount) : '—'} />
      <SummaryRow
        emphasised
        label={i18n.t('sum.totalRepayment')}
        paisa={v(core?.totalRepaymentPaisa)}
        color="emi"
        caption={caption}
      />
      <SummaryRow emphasised label={i18n.t('sum.totalInterest')} paisa={v(core?.totalInterestPaisa)} color="interest" />
      <SummaryRow
        label={i18n.t('sum.principal')}
        paisa={core ? core.schedule[0]!.openingPaisa : null}
        color="principal"
      />
      <SummaryRow label={i18n.t('sum.lastInstallment')} paisa={v(core?.lastInstallmentPaisa)} color="emi" />
      <SummaryRow label={i18n.t('sum.firstInterest')} paisa={v(core?.firstMonthInterestPaisa)} color="interest" />
      <SummaryRow label={i18n.t('sum.firstPrincipal')} paisa={v(core?.firstMonthPrincipalPaisa)} color="principal" />
      <SummaryRow label={i18n.t('sum.balanceAfterFirst')} paisa={v(core?.balanceAfterFirstPaisa)} color="principal" />
      {core ? (
        <InterestShareBar
          interest={core.totalInterestPaisa}
          principal={core.totalRepaymentPaisa - core.totalInterestPaisa}
          text={i18n.t('sum.interestShare', { pct: i18n.int(Math.round(core.interestShare * 100)) })}
          legend={[i18n.t('sched.interest'), i18n.t('sum.principal')]}
        />
      ) : null}
      {core?.earlyPayoff ? (
        <NoteBox text={i18n.t('sched.earlyPayoff', { n: i18n.int(core.actualInstallmentCount) })} />
      ) : null}
      <NoteBox text={i18n.t('sum.estimateNote')} />
    </SectionCard>
  );
});

const useStyles = makeStyles(t => ({
  screen: { flex: 1, backgroundColor: t.c.bgBase },
  content: { paddingHorizontal: t.space.screen, gap: 16 },
}));
