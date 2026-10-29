import React from 'react';
import { View } from 'react-native';
import { Accordion } from '@/components/primitives/Accordion';
import { Icon } from '@/components/primitives/Icon';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { Txt } from '@/components/primitives/Txt';
import type { LoanResults } from '@/core/loan/types';
import { useT } from '@/i18n';
import { groupLakh } from '@/i18n/format';
import { fontFamily } from '@/theme/fonts';
import { useTheme } from '@/theme/ThemeProvider';
import type { ColorTokens } from '@/theme/tokens';

const trim = (s: string) => (s.includes('.') ? s.replace(/0+$/, '').replace(/\.$/, '') : s);
const grouped = (x: number, decimals: number) => {
  const [int, dec] = x.toFixed(decimals).split('.');
  return groupLakh(int as string) + (dec ? `.${dec}` : '');
};

/** The formula, what P, r and n mean, and the user's own numbers substituted (§6 G). */
export function FormulaAccordion({
  results,
  principalPaisa,
  annualRate,
}: {
  results: LoanResults;
  principalPaisa: number;
  annualRate: number;
}) {
  const t = useTheme();
  const i18n = useT();
  const d = (s: string) =>
    i18n.lang === 'bn' && i18n.bengaliDigits ? s.replace(/[0-9]/g, c => '০১২৩৪৫৬৭৮৯'[Number(c)] as string) : s;
  const r = results.monthlyRate;
  const rs = trim(r.toFixed(8));
  const pow = results.growthFactor.toFixed(6);
  const exact = `৳${d(grouped(results.exactEmi, 6))}`;

  const lines: { k: string; v: string; c: keyof ColorTokens }[] =
    r === 0
      ? [
          { k: 'P =', v: i18n.taka(principalPaisa), c: 'principal' },
          { k: 'n =', v: i18n.int(results.installmentCount), c: 'textPrimary' },
          { k: 'EMI = P ÷ n', v: exact, c: 'emi' },
        ]
      : [
          { k: 'P =', v: i18n.taka(principalPaisa), c: 'principal' },
          { k: 'r =', v: d(`${trim(String(annualRate))} ÷ 12 ÷ 100 = ${rs}`), c: 'textPrimary' },
          { k: 'n =', v: i18n.int(results.installmentCount), c: 'textPrimary' },
          { k: '(1 + r)ⁿ =', v: d(pow), c: 'textPrimary' },
          {
            k: 'EMI =',
            v: d(
              `${grouped(principalPaisa / 100, principalPaisa % 100 ? 2 : 0)} × ${rs} × ${pow} ÷ ${(
                results.growthFactor - 1
              ).toFixed(6)}`,
            ),
            c: 'textPrimary',
          },
          { k: '=', v: exact, c: 'emi' },
        ];

  return (
    <Accordion title={i18n.t('formula.title')} icon="mathOps" iconColor="principal">
      <View
        style={{
          paddingVertical: 16,
          paddingHorizontal: 12,
          borderRadius: t.radius.input,
          backgroundColor: t.c.bgSunken,
        }}
      >
        <Txt v="figureMd" align="center" style={{ fontFamily: fontFamily('en', 600) }}>
          EMI = P × r × (1 + r)ⁿ ÷ ((1 + r)ⁿ − 1)
        </Txt>
      </View>
      <View style={{ gap: 2 }}>
        {(['formula.P', 'formula.r', 'formula.n'] as const).map(k => (
          <Txt key={k} v="body" color="textSecondary">
            {i18n.t(k)}
          </Txt>
        ))}
      </View>
      <Txt v="body" weight={600} style={{ marginTop: 4 }}>
        {i18n.t('formula.yourNumbers')}
      </Txt>
      <View style={{ gap: 6 }}>
        {lines.map(l => (
          <View key={l.k} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <Txt v="body" color="textSecondary" style={{ minWidth: 64, fontFamily: fontFamily('en', 400) }}>
              {l.k}
            </Txt>
            <Txt v="body" weight={600} style={{ flex: 1, color: t.c[l.c], fontVariant: ['tabular-nums'] }}>
              {l.v}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ gap: 4, padding: 14, borderRadius: t.radius.input, borderWidth: 1, borderColor: t.c.line }}>
        <Txt v="caption" color="textSecondary">
          {i18n.t('formula.ceiling')}
        </Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Txt v="figureMd" color="textSecondary">
            {i18n.taka(Math.round(results.exactEmi * 100))}
          </Txt>
          <Icon name="caretRight" color={t.c.emi} size={20} />
          <MoneyValue paisa={results.bankEmi * 100} size="lg" decimals={0} />
        </View>
      </View>
      <Txt v="body" color="textSecondary">
        {i18n.t('formula.whyTotal')}
      </Txt>
    </Accordion>
  );
}
