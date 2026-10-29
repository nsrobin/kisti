import React, { useCallback, useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import Animated, { FadeOut, LinearTransition, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '@/app/navigation-types';
import { TAB_BAR_HEIGHT } from '@/app/TabBar';
import { useToday } from '@/app/useToday';
import { Snackbar } from '@/components/feedback/Overlays';
import { EmptyState } from '@/components/loans/EmptyState';
import { LoanCard } from '@/components/loans/LoanCard';
import { SummaryStrip } from '@/components/loans/SummaryStrip';
import { Fab } from '@/components/primitives/Button';
import { StatusBarScrim } from '@/components/primitives/StatusBarScrim';
import { Txt } from '@/components/primitives/Txt';
import { MOTION } from '@/feedback/motion';
import { useT } from '@/i18n';
import { loansSummary, sortLoans } from '@/state/selectors';
import { useStore } from '@/state/store';
import { useUndo } from '@/state/undo';
import { makeStyles } from '@/theme/ThemeProvider';

/** S4: summary strip, sorted loan cards, FAB, and the Undo snackbar after a delete. */
export function LoansListScreen({ navigation }: TabScreenProps<'Loans'>) {
  const s = useStyles();
  const i18n = useT();
  const insets = useSafeAreaInsets();
  const today = useToday();
  const reduce = useReducedMotion();
  const loans = useStore(st => st.loans);
  const restoreLoan = useStore(st => st.restoreLoan);
  const pending = useUndo(u => u.pending);
  const setPending = useUndo(u => u.set);
  const sorted = useMemo(() => sortLoans(loans, today), [loans, today]);
  const summary = useMemo(() => loansSummary(loans, today), [loans, today]);
  const clearPending = useCallback(() => setPending(null), [setPending]);
  const bottom = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12);

  return (
    <View style={s.screen}>
      <ScrollView contentContainerStyle={[s.content, { paddingTop: insets.top + 24, paddingBottom: bottom + 96 }]}>
        <Txt v="rootTitle" accessibilityRole="header">
          {i18n.t('tab.loans')}
        </Txt>
        {summary.runningCount > 0 ? <SummaryStrip summary={summary} /> : null}
        {sorted.length === 0 ? <EmptyState onAdd={() => navigation.navigate('LoanForm')} /> : null}
        {sorted.map(loan => (
          <Animated.View
            key={loan.id}
            layout={reduce ? undefined : LinearTransition.duration(MOTION.standard)}
            exiting={FadeOut.duration(MOTION.standard)}
          >
            <LoanCard
              loan={loan}
              today={today}
              onPress={() => navigation.navigate('LoanDetail', { loanId: loan.id })}
            />
          </Animated.View>
        ))}
      </ScrollView>
      <StatusBarScrim />
      {sorted.length > 0 ? (
        <Fab label={i18n.t('loans.add')} bottom={bottom + 24} onPress={() => navigation.navigate('LoanForm')} />
      ) : null}
      {pending ? (
        <Snackbar
          key={pending.key}
          message={i18n.t('delete.done')}
          action={i18n.t('action.undo')}
          bottom={bottom + 12}
          onTimeout={clearPending}
          onAction={() => {
            restoreLoan(pending.loan, pending.index);
            clearPending();
          }}
        />
      ) : null}
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: { flex: 1, backgroundColor: t.c.bgBase },
  content: { paddingHorizontal: t.space.screen, gap: 14 },
}));
