import React from 'react';
import { View } from 'react-native';
import { Hairline, useCardStyle } from '@/components/primitives/Card';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { Txt } from '@/components/primitives/Txt';
import { useT } from '@/i18n';
import type { LoansSummary } from '@/state/selectors';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';

/** "This month's installments ৳X across N loans" + total remaining principal. */
export function SummaryStrip({ summary }: { summary: LoansSummary }) {
  const card = useCardStyle();
  const t = useTheme();
  const i18n = useT();
  const amount = i18n.taka(summary.thisMonthPaisa, 0);
  const sentence = i18n.tp('loans.thisMonthTotal', summary.runningCount, {
    amount: '\u0000',
    count: i18n.int(summary.runningCount),
  });
  const [before, after] = sentence.split('\u0000');
  return (
    <View style={[card.card, { gap: 12 }]}>
      <Txt v="body" color="textSecondary">
        {before}
        <Txt v="figureLg" style={{ color: t.c.emi, fontFamily: fontFamily(i18n.lang, 700, 'semiExpanded') }}>
          {amount}
        </Txt>
        {after}
      </Txt>
      <Hairline />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <Txt v="body" color="textSecondary" style={{ flex: 1 }}>
          {i18n.t('loans.totalRemaining')}
        </Txt>
        <MoneyValue paisa={summary.remainingPaisa} size="lg" fontSize={20} color="principal" />
      </View>
    </View>
  );
}
