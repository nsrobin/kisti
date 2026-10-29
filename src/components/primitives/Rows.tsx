import React from 'react';
import { View } from 'react-native';
import { useTheme } from '@/theme/ThemeProvider';
import type { MoneyColor } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { MoneyValue } from './MoneyValue';
import { Txt } from './Txt';

type RowProps = {
  label: string;
  paisa: number | null;
  color?: MoneyColor | 'textPrimary';
  decimals?: 0 | 2;
  /** Big variant: caption label above a figure.xl value, optional caption below. */
  emphasised?: boolean;
  caption?: string;
  icon?: IconName;
};

/** Label + value, with a colour dot (normal) or a big figure (emphasised). */
export function SummaryRow({ label, paisa, color = 'textPrimary', decimals = 2, emphasised, caption, icon }: RowProps) {
  const t = useTheme();
  const c = color === 'textPrimary' ? t.c.textPrimary : t.c[color];
  if (emphasised) {
    return (
      <View style={{ gap: 2 }}>
        <Txt v="caption" color="textSecondary">
          {label}
        </Txt>
        <MoneyValue paisa={paisa} size="xl" color={color} decimals={decimals} />
        {caption ? (
          <Txt v="caption" color="textMuted">
            {caption}
          </Txt>
        ) : null}
      </View>
    );
  }
  return (
    <View style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      {icon ? (
        <Icon name={icon} color={c} size={20} />
      ) : (
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
      )}
      <Txt v="body" color="textSecondary" style={{ flex: 1 }}>
        {label}
      </Txt>
      <MoneyValue paisa={paisa} size="md" color={color} decimals={decimals} />
    </View>
  );
}

/** A deduction: pink icon and pink value. */
export const DeductionRow = (p: { label: string; icon: IconName; paisa: number | null }) => (
  <SummaryRow label={p.label} icon={p.icon} paisa={p.paisa} color="deduction" />
);

/** Label + plain text value (counts, rates, months). */
export function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Txt v="body" color="textSecondary" style={{ flex: 1 }}>
        {label}
      </Txt>
      <Txt v="figureMd">{value}</Txt>
    </View>
  );
}
