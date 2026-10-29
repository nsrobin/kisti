import React, { useCallback, useMemo } from 'react';
import { FlatList, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation-types';
import { useToday } from '@/app/useToday';
import { Hairline } from '@/components/primitives/Card';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { ScreenHeader } from '@/components/primitives/ScreenHeader';
import { Txt } from '@/components/primitives/Txt';
import { ScheduleRowCard } from '@/components/schedule/ScheduleRowCard';
import { calculateLoan } from '@/core/loan/calculate';
import type { LoanResults, ScheduleRow } from '@/core/loan/types';
import { validateInputs } from '@/core/loan/validate';
import { monthForInstallment, monthOf, monthStatus, yearOf, type YearMonth } from '@/core/months';
import { useT } from '@/i18n';
import { getLoanResults } from '@/state/selectors';
import { useStore } from '@/state/store';
import { makeStyles } from '@/theme/ThemeProvider';

type Item = { kind: 'year'; year: number } | { kind: 'row'; row: ScheduleRow; ym: YearMonth | null };

/** S9: every installment in a FlatList with getItemLayout; loan mode adds year headers. */
export function FullScheduleScreen({ navigation, route }: RootScreenProps<'FullSchedule'>) {
  const s = useStyles();
  const i18n = useT();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const { fontScale } = useWindowDimensions();
  const loan = useStore(st => st.loans.find(l => l.id === route.params?.loanId));
  const draft = useStore(st => st.calculatorDraft);

  const results: LoanResults | null = useMemo(() => {
    if (loan) {
      return getLoanResults(loan);
    }
    const v = validateInputs(draft);
    return v.ok ? calculateLoan(v.inputs) : null;
  }, [loan, draft]);

  const items: Item[] = useMemo(() => {
    if (!results) {
      return [];
    }
    if (!loan) {
      return results.schedule.map(row => ({ kind: 'row', row, ym: null }));
    }
    const out: Item[] = [];
    for (const row of results.schedule) {
      const ym = monthForInstallment(loan.firstInstallmentMonth, row.index);
      if (row.index === 1 || monthOf(ym) === 1) {
        out.push({ kind: 'year', year: yearOf(ym) });
      }
      out.push({ kind: 'row', row, ym });
    }
    return out;
  }, [results, loan]);

  // Fixed heights so getItemLayout is exact; scaled with the font (capped like the text).
  const scale = Math.min(fontScale, 1.6);
  const ROW = Math.ceil(98 * scale) + 8;
  const YEAR = Math.ceil(44 * scale);
  const offsets = useMemo(() => {
    const o: number[] = [];
    let y = 0;
    for (const it of items) {
      o.push(y);
      y += it.kind === 'year' ? YEAR : ROW;
    }
    return o;
  }, [items, ROW, YEAR]);
  const getItemLayout = useCallback(
    (_: ArrayLike<Item> | null | undefined, index: number) => ({
      length: items[index]?.kind === 'year' ? YEAR : ROW,
      offset: offsets[index] ?? 0,
      index,
    }),
    [items, offsets, ROW, YEAR],
  );

  const count = results?.actualInstallmentCount ?? 0;
  const initialIndex = loan ? Math.max(0, items.findIndex(it => it.kind === 'row' && it.ym === today) - 1) : 0;

  const subtitle = loan
    ? loan.nickname
      ? `${loan.bankName}, ${loan.nickname}`
      : loan.bankName
    : results
    ? i18n.t('calc.scheduleSubtitle', {
        n: i18n.int(results.installmentCount),
        amount: i18n.taka(results.schedule[0]!.openingPaisa),
        rate: i18n.percent(results.monthlyRate * 1200, 3),
      })
    : undefined;

  const renderItem = ({ item }: { item: Item }) => {
    if (item.kind === 'year') {
      return (
        <View style={{ height: YEAR, justifyContent: 'flex-end', gap: 6, paddingBottom: 8 }}>
          <Txt v="title" size={20} weight={700} width="semiExpanded" accessibilityRole="header">
            {i18n.int(item.year)}
          </Txt>
          <Hairline />
        </View>
      );
    }
    const { row, ym } = item;
    return (
      <View style={{ height: ROW, paddingBottom: 8 }}>
        <ScheduleRowCard
          raised
          row={row}
          final={row.index === count}
          label={ym ? i18n.month(ym, 'short') : i18n.t('calc.monthLabel', { k: i18n.int(row.index) })}
          status={ym && loan ? monthStatus(loan.firstInstallmentMonth, count, ym, today) : undefined}
          current={!!ym && ym === today}
        />
      </View>
    );
  };

  return (
    <View style={s.screen}>
      <ScreenHeader
        leading={{ icon: 'caretLeft', label: i18n.t('a11y.back'), onPress: () => navigation.goBack() }}
        title={i18n.t('sched.title')}
        subtitle={subtitle}
      />
      <FlatList
        data={items}
        keyExtractor={(it, i) => (it.kind === 'year' ? `y${it.year}` : `r${it.row.index}`) + i}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialScrollIndex={initialIndex > 0 ? initialIndex : undefined}
        initialNumToRender={14}
        windowSize={7}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 }}
      />
      {results ? (
        <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={{ flex: 1 }}>
            <Txt v="caption" color="textSecondary" numberOfLines={1}>
              {i18n.t('sum.totalRepayment')}
            </Txt>
            <MoneyValue paisa={results.totalRepaymentPaisa} size="lg" fontSize={18} />
          </View>
          <View style={{ flex: 1, alignItems: 'flex-end' }}>
            <Txt v="caption" color="textSecondary" numberOfLines={1}>
              {i18n.t('sum.totalInterest')}
            </Txt>
            <MoneyValue paisa={results.totalInterestPaisa} size="lg" fontSize={18} color="interest" align="right" />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: { flex: 1, backgroundColor: t.c.bgBase },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    paddingHorizontal: t.space.screen,
    backgroundColor: t.c.glass,
    borderTopWidth: 1,
    borderTopColor: t.c.line,
  },
}));
