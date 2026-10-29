import React, { memo } from 'react';
import { View } from 'react-native';
import { StatusChip, chipStatusFor } from '@/components/primitives/Chips';
import { Hairline } from '@/components/primitives/Card';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { PressableScale } from '@/components/primitives/Pressable';
import { Txt } from '@/components/primitives/Txt';
import { StitchProgress } from '@/components/money/StitchRing';
import { loanState, nextInstallmentMonth, paidCount, type YearMonth } from '@/core/months';
import { useT } from '@/i18n';
import { getLoanResults } from '@/state/selectors';
import type { SavedLoan } from '@/state/types';
import { makeStyles } from '@/theme/ThemeProvider';
import { LoanAvatar } from './LoanAvatar';

/** One pressable card per loan: avatar, EMI (big, teal), stitch progress, remaining, next month. */
export const LoanCard = memo(function LoanCardImpl({
  loan,
  today,
  onPress,
}: {
  loan: SavedLoan;
  today: YearMonth;
  onPress: () => void;
}) {
  const s = useStyles();
  const i18n = useT();
  const r = getLoanResults(loan);
  const count = r.actualInstallmentCount;
  const state = loanState(loan.firstInstallmentMonth, count, today);
  const paid = paidCount(loan.firstInstallmentMonth, count, today);
  const dueK = state.kind === 'running' ? state.currentIndex : null;
  const done = dueK ?? paid; // installments done including this month's
  const remaining =
    state.kind === 'running'
      ? r.schedule[state.currentIndex - 1]!.closingPaisa
      : state.kind === 'notStarted'
      ? r.schedule[0]!.openingPaisa
      : 0;
  const next = nextInstallmentMonth(loan.firstInstallmentMonth, count, today);
  const progress = i18n.t('loan.progressOf', { k: i18n.int(done), n: i18n.int(count) });
  const title = loan.nickname ? `${loan.bankName}, ${loan.nickname}` : loan.bankName;
  return (
    <PressableScale
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${i18n.speak(r.bankEmi * 100)}, ${progress}`}
      onPress={onPress}
      style={s.card}
    >
      <View style={s.row}>
        <LoanAvatar name={loan.bankName} accent={loan.accent} />
        <View style={{ flex: 1 }}>
          <Txt v="section" numberOfLines={1}>
            {loan.bankName}
          </Txt>
          {loan.nickname ? (
            <Txt v="caption" color="textSecondary" numberOfLines={1}>
              {loan.nickname}
            </Txt>
          ) : null}
        </View>
        <StatusChip
          status={chipStatusFor(state)}
          monthsUntil={state.kind === 'notStarted' ? state.monthsUntil : 0}
          compact
        />
      </View>
      <View>
        <Txt v="caption" color="textSecondary">
          {i18n.t('calc.bankEmi')}
        </Txt>
        <MoneyValue paisa={r.bankEmi * 100} fontSize={28} weight={800} width="semiExpanded" decimals={0} />
      </View>
      <View style={{ gap: 6 }}>
        <StitchProgress count={count} paid={paid} dueK={dueK} label={progress} />
        <Txt v="caption" color="textSecondary" align="right">
          {progress}
        </Txt>
      </View>
      <Hairline />
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <Txt v="caption" color="textSecondary">
            {i18n.t('card.remaining')}
          </Txt>
          <MoneyValue paisa={remaining} size="md" color="principal" />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Txt v="caption" color="textSecondary">
            {i18n.t('card.next')}
          </Txt>
          <Txt v="figureMd">{next ? i18n.month(next) : '—'}</Txt>
        </View>
      </View>
    </PressableScale>
  );
});

const useStyles = makeStyles(t => ({
  card: {
    backgroundColor: t.c.bgRaised,
    borderRadius: t.radius.section,
    borderWidth: 1,
    borderColor: t.c.line,
    boxShadow: t.shadow.card,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
}));
