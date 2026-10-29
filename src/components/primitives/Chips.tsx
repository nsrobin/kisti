import React from 'react';
import { View } from 'react-native';
import type { LoanState, MonthStatus } from '@/core/months';
import { useT } from '@/i18n';
import { useTheme } from '@/theme/ThemeProvider';
import { alpha, type MoneyColor } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './Pressable';
import { Txt } from './Txt';

/** Preset chip: 48 high pill; active = teal 10% fill + teal border + leading check. */
export function PresetChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 48,
        paddingHorizontal: 16,
        borderRadius: t.radius.pill,
        borderWidth: 1.5,
        borderColor: active ? t.c.emi : t.c.line,
        backgroundColor: active ? alpha(t.c.emi, 0.1) : pressed ? t.c.bgSunken : t.c.bgRaised,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      })}
    >
      {active ? <Icon name="check" color={t.c.emi} size={16} bold /> : null}
      <Txt v="body" weight={500}>
        {label}
      </Txt>
    </PressableScale>
  );
}

/** Small sunken pill (hero card). */
export function Pill({ text }: { text: string }) {
  const t = useTheme();
  return (
    <View
      style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: t.radius.pill, backgroundColor: t.c.bgSunken }}
    >
      <Txt v="caption" color="textSecondary">
        {text}
      </Txt>
    </View>
  );
}

export type ChipStatus = Exclude<MonthStatus, 'outside'> | 'notStarted' | 'completed';

const CHIP: Record<ChipStatus, { icon: IconName; color: MoneyColor }> = {
  paid: { icon: 'checkCircle', color: 'cash' },
  due: { icon: 'target', color: 'emi' },
  upcoming: { icon: 'clock', color: 'principal' },
  notStarted: { icon: 'hourglass', color: 'principal' },
  completed: { icon: 'checkCircle', color: 'cash' },
};

export const chipStatusFor = (state: LoanState): ChipStatus => (state.kind === 'running' ? 'due' : state.kind);

/** Icon + label + colour; never colour alone (§11.4). */
export function StatusChip({
  status,
  monthsUntil = 0,
  compact,
}: {
  status: ChipStatus;
  monthsUntil?: number;
  compact?: boolean;
}) {
  const t = useTheme();
  const i18n = useT();
  const { icon, color } = CHIP[status];
  const label =
    status === 'notStarted' ? i18n.t('status.notStarted', { n: i18n.int(monthsUntil) }) : i18n.t(`status.${status}`);
  return (
    <View
      style={{
        minHeight: compact ? 28 : 32,
        paddingHorizontal: 10,
        borderRadius: t.radius.pill,
        backgroundColor: alpha(t.c[color], 0.1),
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        alignSelf: 'flex-start',
      }}
    >
      <Icon name={icon} color={t.c[color]} size={15} />
      <Txt v="caption" size={13} weight={600} style={{ color: t.c[color] }} numberOfLines={1}>
        {label}
      </Txt>
    </View>
  );
}
