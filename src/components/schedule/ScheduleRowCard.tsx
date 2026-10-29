import React, { memo } from 'react';
import { Pressable, View } from 'react-native';
import { StatusMark } from '@/components/calendar/StatusMark';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { Txt } from '@/components/primitives/Txt';
import type { ScheduleRow } from '@/core/loan/types';
import type { MonthStatus } from '@/core/months';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';

export const SCHEDULE_ROW_HEIGHT = 112;

type Props = {
  row: ScheduleRow;
  label: string;
  final?: boolean;
  status?: MonthStatus;
  /** due row on S9 */
  current?: boolean;
  selected?: boolean;
  raised?: boolean;
  onPress?: () => void;
};

/** Month label + installment (large) on top; interest, principal repaid and closing below. */
export const ScheduleRowCard = memo(function ScheduleRowCardImpl({
  row,
  label,
  final,
  status,
  current,
  selected,
  raised,
  onPress,
}: Props) {
  const t = useTheme();
  const i18n = useT();
  const border =
    selected || current
      ? { borderColor: t.c.emi, borderWidth: 2 }
      : final
      ? { borderColor: alpha(t.c.interest, 0.45) }
      : null;
  const tag = final ? i18n.t('sum.lastInstallment') : current ? i18n.t('status.due') : null;
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!selected } : undefined}
      style={[
        {
          borderRadius: t.radius.row,
          backgroundColor: raised ? t.c.bgRaised : t.c.bgBase,
          borderWidth: 1,
          borderColor: t.c.line,
          paddingVertical: 10,
          paddingHorizontal: 12,
          gap: 6,
        },
        border,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {status ? <StatusMark status={status} /> : null}
        {final && !status ? (
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: t.c.interest }} />
        ) : null}
        <Txt v="body" weight={600} numberOfLines={1}>
          {label}
        </Txt>
        {tag ? (
          <Txt v="micro" style={{ color: final ? t.c.interest : t.c.emi }} numberOfLines={1}>
            {tag}
          </Txt>
        ) : null}
        <View style={{ flex: 1 }} />
        <MoneyValue paisa={row.paymentPaisa} size="lg" fontSize={20} />
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Cell label={i18n.t('sched.interest')} paisa={row.interestPaisa} color="interest" />
        <Cell label={i18n.t('sched.principal')} paisa={row.principalPaisa} color="principal" />
        <Cell label={i18n.t('sched.closing')} paisa={row.closingPaisa} color="principal" right />
      </View>
    </Pressable>
  );
});

function Cell({
  label,
  paisa,
  color,
  right,
}: {
  label: string;
  paisa: number;
  color: 'interest' | 'principal';
  right?: boolean;
}) {
  return (
    <View style={{ flex: 1, alignItems: right ? 'flex-end' : 'flex-start' }}>
      <Txt v="micro" color="textMuted" numberOfLines={1}>
        {label}
      </Txt>
      <MoneyValue paisa={paisa} size="md" fontSize={14} color={color} align={right ? 'right' : 'left'} />
    </View>
  );
}

export function GapRow() {
  return (
    <Txt v="body" color="textMuted" align="center" accessibilityElementsHidden importantForAccessibility="no">
      …
    </Txt>
  );
}
