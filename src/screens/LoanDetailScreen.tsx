import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation-types';
import { useToday } from '@/app/useToday';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { StatusMark } from '@/components/calendar/StatusMark';
import { ConfirmDialog, PopoverMenu, SuccessMoment } from '@/components/feedback/Overlays';
import { LoanAvatar } from '@/components/loans/LoanAvatar';
import { InterestShareBar, SplitBar } from '@/components/money/Bars';
import { StitchRing } from '@/components/money/StitchRing';
import { IconButton } from '@/components/primitives/Button';
import { Hairline, SectionCard, useCardStyle } from '@/components/primitives/Card';
import { StatusChip, chipStatusFor } from '@/components/primitives/Chips';
import { NoteBox } from '@/components/primitives/Feedback';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { DeductionRow, InfoRow, SummaryRow } from '@/components/primitives/Rows';
import { ScreenHeader } from '@/components/primitives/ScreenHeader';
import { Txt } from '@/components/primitives/Txt';
import { FormulaAccordion } from '@/components/schedule/FormulaAccordion';
import { ScheduleAccordion } from '@/components/schedule/ScheduleAccordion';
import { monthSnapshot } from '@/core/loan/snapshot';
import { toPaisa } from '@/core/money';
import {
  defaultSelectedMonth,
  installmentIndexFor,
  loanState,
  monthForInstallment,
  monthStatus,
  paidCount,
  yearOf,
  type YearMonth,
} from '@/core/months';
import { feedback } from '@/feedback';
import { useT } from '@/i18n';
import { getLoanResults } from '@/state/selectors';
import { useStore } from '@/state/store';
import { useUndo } from '@/state/undo';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha, type MoneyColor } from '@/theme/tokens';

/** S7: stitch ring hero, month calendar, the selected month's breakdown and the loan overview. */
export function LoanDetailScreen({ navigation, route }: RootScreenProps<'LoanDetail'>) {
  const s = useStyles();
  const card = useCardStyle();
  const t = useTheme();
  const i18n = useT();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const reduce = useReducedMotion();
  const loan = useStore(st => st.loans.find(l => l.id === route.params.loanId));
  const deleteLoan = useStore(st => st.deleteLoan);
  const setUndo = useUndo(u => u.set);

  const results = loan ? getLoanResults(loan) : null;
  const count = results?.actualInstallmentCount ?? 1;
  const first = loan?.firstInstallmentMonth ?? today;
  const [selected, setSelected] = useState<YearMonth>(() => defaultSelectedMonth(first, count, today));
  const [year, setYear] = useState(() => yearOf(selected));
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const scrollRef = useRef<Animated.ScrollView>(null);
  const calendarY = useRef(0);

  // After an edit the range can change; keep the selection inside the loan.
  useEffect(() => {
    if (installmentIndexFor(first, selected, count) === null) {
      const next = defaultSelectedMonth(first, count, today);
      setSelected(next);
      setYear(yearOf(next));
    }
  }, [first, count, today, selected]);

  useEffect(() => {
    if (!loan && !useUndo.getState().pending) {
      navigation.goBack();
    }
  }, [loan, navigation]);

  if (!loan || !results) {
    return <View style={s.screen} />;
  }

  const state = loanState(first, count, today);
  const paid = paidCount(first, count, today);
  const dueK = state.kind === 'running' ? state.currentIndex : null;
  const done = dueK ?? paid;
  const lastMonth = monthForInstallment(first, count);
  const k = installmentIndexFor(first, selected, count) ?? 1;
  const snap = monthSnapshot(results, Math.min(k, count));
  const selStatus = monthStatus(first, count, selected, today);
  const remainingNow =
    state.kind === 'running'
      ? results.schedule[state.currentIndex - 1]!.closingPaisa
      : state.kind === 'notStarted'
      ? toPaisa(loan.principal)
      : 0;

  const select = (ym: YearMonth) => {
    setSelected(ym);
    setYear(yearOf(ym));
  };
  const ded = loan.deductions;
  const dedRows = (
    [
      ['ded.settlement', 'arrowsClockwise', ded.settlement],
      ['ded.insurance', 'shieldCheck', ded.insurance],
      ['ded.fees', 'receipt', ded.bankFees],
      ['ded.other', 'coins', ded.other],
    ] as const
  ).filter(([, , v]) => v > 0);

  return (
    <View style={s.screen}>
      <ScreenHeader
        leading={{ icon: 'caretLeft', label: i18n.t('a11y.back'), onPress: () => navigation.goBack() }}
        trailing={<IconButton icon="dots" label={i18n.t('a11y.more')} onPress={() => setMenu(true)} size={26} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <LoanAvatar name={loan.bankName} accent={loan.accent} size={36} />
          <View style={{ flex: 1 }}>
            <Txt v="section" numberOfLines={1} accessibilityRole="header">
              {loan.bankName}
            </Txt>
            {loan.nickname ? (
              <Txt v="caption" color="textSecondary" numberOfLines={1}>
                {loan.nickname}
              </Txt>
            ) : null}
          </View>
        </View>
      </ScreenHeader>

      <Animated.ScrollView ref={scrollRef} contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={{ gap: 14, alignItems: 'center' }}>
          <StitchRing
            size={200}
            count={count}
            paid={paid}
            dueK={dueK}
            center={`${i18n.int(done)}/${i18n.int(count)}`}
            caption={i18n.t('detail.done')}
            accessibilityLabel={`${i18n.t('loan.progressOf', { k: i18n.int(done), n: i18n.int(count) })} ${i18n.t(
              'detail.done',
            )}`}
          />
          {state.kind !== 'running' ? (
            <StatusChip
              status={chipStatusFor(state)}
              monthsUntil={state.kind === 'notStarted' ? state.monthsUntil : 0}
            />
          ) : null}
          <View style={s.tiles}>
            <View style={[card.card, s.tile]}>
              <Txt v="caption" color="textSecondary">
                {i18n.t('calc.bankEmi')}
              </Txt>
              <MoneyValue paisa={results.bankEmi * 100} fontSize={26} weight={800} decimals={0} />
            </View>
            <View style={[card.card, s.tile]}>
              <Txt v="caption" color="textSecondary">
                {i18n.t('card.remaining')}
              </Txt>
              <MoneyValue paisa={remainingNow} fontSize={20} weight={700} color="principal" />
            </View>
          </View>
        </View>

        <View style={[card.card, { gap: 12 }]} onLayout={e => (calendarY.current = e.nativeEvent.layout.y)}>
          <MonthGrid
            mode="calendar"
            year={year}
            onYearChange={setYear}
            minYear={yearOf(first)}
            maxYear={yearOf(lastMonth)}
            selected={selected}
            onSelect={select}
            cell={ym => {
              const status = monthStatus(first, count, ym, today);
              return { status, final: ym === lastMonth, disabled: status === 'outside' };
            }}
            onThisMonth={() => {
              feedback.stitch();
              select(today);
            }}
            thisMonthDisabled={state.kind !== 'running'}
          />
          <View style={s.legend}>
            {(['paid', 'due', 'upcoming'] as const).map(st => (
              <View key={st} style={s.legendItem}>
                <StatusMark status={st} />
                <Txt v="caption" color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
                  {i18n.t(`status.${st}`)}
                </Txt>
              </View>
            ))}
            <View style={s.legendItem}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.c.interest }} />
              <Txt v="caption" color="textSecondary" numberOfLines={1} style={{ flexShrink: 1 }}>
                {i18n.t('sum.lastInstallment')}
              </Txt>
            </View>
          </View>
          <NoteBox text={i18n.t('status.assumption')} />
        </View>

        <Animated.View key={selected} entering={FadeIn.duration(reduce ? 150 : 180)} style={[card.card, { gap: 14 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
            <View style={{ flex: 1 }}>
              <Txt v="title" accessibilityRole="header">
                {i18n.month(selected)}
              </Txt>
              <Txt v="caption" color="textSecondary">
                {i18n.t('detail.installmentOf', { k: i18n.int(k), n: i18n.int(count) })}
              </Txt>
            </View>
            {selStatus !== 'outside' ? <StatusChip status={selStatus} /> : null}
          </View>
          <View>
            <Txt v="caption" color="textSecondary">
              {i18n.t('detail.thisInstallment')}
            </Txt>
            <MoneyValue paisa={snap.row.paymentPaisa} size="hero" />
          </View>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Txt v="caption" color="textSecondary">
                  {i18n.t('detail.interestPart')}
                </Txt>
                <MoneyValue paisa={snap.row.interestPaisa} size="md" color="interest" />
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Txt v="caption" color="textSecondary">
                  {i18n.t('detail.principalPart')}
                </Txt>
                <MoneyValue paisa={snap.row.principalPaisa} size="md" color="principal" align="right" />
              </View>
            </View>
            <SplitBar
              interest={snap.row.interestPaisa}
              principal={snap.row.principalPaisa}
              label={`${i18n.t('detail.interestPart')} ${i18n.speak(snap.row.interestPaisa)}, ${i18n.t(
                'detail.principalPart',
              )} ${i18n.speak(snap.row.principalPaisa)}`}
            />
          </View>
          <Hairline />
          <View>
            <Txt v="caption" color="textSecondary">
              {i18n.t('detail.remainingPrincipal')}
            </Txt>
            <MoneyValue paisa={snap.row.closingPaisa} size="xl" color="principal" />
          </View>
          <View style={s.grid2}>
            <Tile label={i18n.t('detail.stillToPay')} paisa={snap.stillToPayPaisa} color="emi" />
            <Tile label={i18n.t('detail.paidSoFar')} paisa={snap.paidSoFarPaisa} color="cash" />
            <Tile label={i18n.t('detail.interestPaidSoFar')} paisa={snap.interestPaidSoFarPaisa} color="interest" />
            <View style={s.tile2}>
              <Txt v="caption" color="textSecondary">
                {i18n.t('detail.installmentsLeft')}
              </Txt>
              <Txt v="figureMd">{i18n.int(snap.installmentsLeft)}</Txt>
            </View>
          </View>
        </Animated.View>

        <SectionCard title={i18n.t('detail.overview')} icon="chartPie" iconColor="interest">
          <SummaryRow label={i18n.t('ded.approved')} paisa={toPaisa(loan.principal)} color="principal" />
          {dedRows.map(([label, icon, v]) => (
            <DeductionRow key={label} label={i18n.t(label)} icon={icon} paisa={toPaisa(v)} />
          ))}
          {dedRows.length > 0 ? (
            <SummaryRow label={i18n.t('ded.total')} paisa={results.totalDeductionsPaisa} color="deduction" />
          ) : null}
          <View
            style={{
              borderRadius: t.radius.input,
              padding: 14,
              gap: 2,
              backgroundColor: alpha(results.netCashPaisa < 0 ? t.c.error : t.c.cash, 0.1),
            }}
          >
            <Txt v="caption" color="textSecondary">
              {i18n.t('ded.netCash')}
            </Txt>
            <MoneyValue
              paisa={results.netCashPaisa}
              fontSize={26}
              weight={700}
              color={results.netCashPaisa < 0 ? 'error' : 'cash'}
            />
          </View>
          <SummaryRow label={i18n.t('calc.bankEmi')} paisa={results.bankEmi * 100} decimals={0} color="emi" />
          <SummaryRow label={i18n.t('calc.exactEmi')} paisa={Math.round(results.exactEmi * 100)} />
          <SummaryRow
            label={i18n.t('sum.totalRepayment')}
            paisa={results.totalRepaymentPaisa}
            color="emi"
            emphasised
            caption={
              results.showEmiTimesNCaption
                ? i18n.t('sum.emiTimesN', {
                    n: i18n.int(results.installmentCount),
                    amount: i18n.taka(results.emiTimesNPaisa, 0),
                    diff: i18n.taka(results.lastInstallmentAdjustmentPaisa),
                  })
                : undefined
            }
          />
          <SummaryRow
            label={i18n.t('sum.totalInterest')}
            paisa={results.totalInterestPaisa}
            color="interest"
            emphasised
          />
          <SummaryRow label={i18n.t('sum.lastInstallment')} paisa={results.lastInstallmentPaisa} color="emi" />
          <InfoRow label={i18n.t('detail.lastMonth')} value={i18n.month(lastMonth)} />
          <InterestShareBar
            interest={results.totalInterestPaisa}
            principal={results.totalRepaymentPaisa - results.totalInterestPaisa}
            text={i18n.t('sum.interestShare', { pct: i18n.int(Math.round(results.interestShare * 100)) })}
            legend={[i18n.t('sched.interest'), i18n.t('sum.principal')]}
          />
          {results.earlyPayoff ? <NoteBox text={i18n.t('sched.earlyPayoff', { n: i18n.int(count) })} /> : null}
          <NoteBox text={i18n.t('sum.estimateNote')} />
        </SectionCard>

        <FormulaAccordion
          results={results}
          principalPaisa={toPaisa(loan.principal)}
          annualRate={loan.annualRatePercent}
        />
        <ScheduleAccordion
          results={results}
          onShowAll={() => navigation.navigate('FullSchedule', { loanId: loan.id })}
          loan={{
            first,
            today,
            selected,
            onSelect: ym => {
              feedback.stitch();
              select(ym);
              scrollRef.current?.scrollTo({ y: Math.max(0, calendarY.current - 12), animated: !reduce });
            },
          }}
        />
      </Animated.ScrollView>

      <PopoverMenu
        visible={menu}
        onClose={() => setMenu(false)}
        top={insets.top + 52}
        items={[
          {
            label: i18n.t('menu.edit'),
            icon: 'pencil',
            onPress: () => navigation.navigate('LoanForm', { loanId: loan.id }),
          },
          { label: i18n.t('menu.delete'), icon: 'trash', destructive: true, onPress: () => setConfirm(true) },
        ]}
      />
      <ConfirmDialog
        visible={confirm}
        title={i18n.t('delete.confirm')}
        body={loan.nickname ? `${loan.bankName}, ${loan.nickname}` : loan.bankName}
        confirmLabel={i18n.t('menu.delete')}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          const removed = deleteLoan(loan.id);
          if (removed) {
            setUndo(removed);
          }
          feedback.medium();
          navigation.navigate('Tabs', { screen: 'Loans' });
        }}
      />
      {route.params.justSaved ? (
        <SuccessMoment title={i18n.t('form.saved')} onDone={() => navigation.setParams({ justSaved: false })} />
      ) : null}
      {route.params.justSaved ? <SuccessFeedback /> : null}
    </View>
  );
}

function SuccessFeedback() {
  useEffect(() => {
    feedback.success();
  }, []);
  return null;
}

function Tile({ label, paisa, color }: { label: string; paisa: number; color: MoneyColor }) {
  const s = useStyles();
  return (
    <View style={s.tile2}>
      <Txt v="caption" color="textSecondary" numberOfLines={2}>
        {label}
      </Txt>
      <MoneyValue paisa={paisa} size="md" color={color} />
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: { flex: 1, backgroundColor: t.c.bgBase },
  content: { paddingHorizontal: t.space.screen, paddingTop: 8, gap: 16 },
  tiles: { flexDirection: 'row', gap: 12, alignSelf: 'stretch' },
  tile: { flex: 1, gap: 2, paddingVertical: 12 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8 },
  legendItem: { width: '50%', flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  grid2: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tile2: {
    flexBasis: '46%',
    flexGrow: 1,
    backgroundColor: t.c.bgBase,
    borderRadius: t.radius.row,
    padding: 12,
    gap: 2,
  },
}));
