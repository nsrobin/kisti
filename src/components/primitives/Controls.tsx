import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useDerivedValue, withTiming } from 'react-native-reanimated';
import { fromBengaliDigits, parseNumber } from '@/core/loan/parse';
import { feedback } from '@/feedback';
import { MOTION } from '@/feedback/motion';
import { useT } from '@/i18n';
import { toBengaliDigits } from '@/i18n/format';
import { fontFamily } from '@/theme/fonts';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { FieldShell } from './Inputs';
import { Txt } from './Txt';

type Option<T> = { value: T; label: string; icon?: IconName; lang?: 'bn' | 'en' };

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={s.track} accessibilityRole="radiogroup" accessibilityLabel={label}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                feedback.tap();
                onChange(o.value);
              }
            }}
            style={[s.segment, active && s.active]}
          >
            {o.icon ? <Icon name={o.icon} color={active ? t.c.emi : t.c.textSecondary} size={16} /> : null}
            <Txt
              v="caption"
              weight={active ? 600 : 500}
              color={active ? 'textPrimary' : 'textSecondary'}
              numberOfLines={1}
              style={o.lang ? { fontFamily: fontFamily(o.lang, active ? 600 : 500) } : undefined}
            >
              {o.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

/** 52 × 32 switch; knob slides over 120 ms. */
export function Switch({ value }: { value: boolean }) {
  const t = useTheme();
  const p = useDerivedValue(() => withTiming(value ? 1 : 0, { duration: MOTION.micro }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: 3 + p.value * 20 }] }));
  return (
    <View
      style={{
        width: 52,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        backgroundColor: value ? t.c.emi : t.c.line,
      }}
    >
      <Animated.View
        style={[
          {
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: value ? t.c.onEmi : t.scheme === 'dark' ? t.c.textSecondary : '#FFFFFF',
          },
          knob,
        ]}
      />
    </View>
  );
}

export function SwitchRow({
  icon,
  label,
  value,
  onChange,
}: {
  icon: IconName;
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const s = useStyles();
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel={label}
      onPress={() => {
        feedback.toggle();
        onChange(!value);
      }}
      style={s.row}
    >
      <Icon name={icon} color={t.c.principal} size={22} />
      <Txt v="body" weight={600} style={{ flex: 1 }}>
        {label}
      </Txt>
      <Switch value={value} />
    </Pressable>
  );
}

export function ListRow({
  icon,
  label,
  onPress,
  destructive,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const s = useStyles();
  const t = useTheme();
  const color = destructive ? t.c.error : t.c.textPrimary;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={s.row}>
      <Icon name={icon} color={destructive ? t.c.error : t.c.principal} size={22} />
      <Txt v="body" weight={600} style={{ flex: 1, color }}>
        {label}
      </Txt>
      <Icon name="caretRight" color={destructive ? t.c.error : t.c.textSecondary} size={20} />
    </Pressable>
  );
}

type DurationProps = {
  label: string;
  value: string;
  unit: 'years' | 'months';
  onChange: (value: string, unit: 'years' | 'months') => void;
  error?: string;
};

/**
 * − / + stepper (12 months in Years mode, 1 in Months mode, range 1–360) plus a
 * Years/Months toggle. Switching to Years rounds to whole years (minimum 1).
 */
export function DurationInput({ label, value, unit, onChange, error }: DurationProps) {
  const s = useStyles();
  const t = useT();
  const theme = useTheme();
  const n = parseNumber(value);
  const max = unit === 'years' ? 30 : 360;
  const step = (d: number) => {
    const next = Math.min(max, Math.max(1, Math.round(n ?? 0) + d));
    feedback.tap();
    onChange(String(next), unit);
  };
  const switchUnit = (u: 'years' | 'months') => {
    const months = n === null ? null : unit === 'years' ? n * 12 : n;
    if (months === null) {
      onChange(value, u);
    } else {
      onChange(String(u === 'years' ? Math.max(1, Math.round(months / 12)) : Math.round(months)), u);
    }
  };
  const unitText = t.tp(unit === 'years' ? 'dur.years' : 'dur.months', n ?? 0, { n: '' }).trim();
  return (
    <View style={s.durationWrap}>
      <View style={{ flexGrow: 1, flexBasis: 180 }}>
        <FieldShell label={label} error={error}>
          <StepButton
            icon="minus"
            label={t.t('a11y.decrease')}
            onPress={() => step(-1)}
            disabled={n !== null && n <= 1}
          />
          <View style={s.durationValue}>
            <TextInput
              value={t.lang === 'bn' && t.bengaliDigits ? toBengaliDigits(value) : fromBengaliDigits(value)}
              onChangeText={v => onChange(v.replace(/[^0-9০-৯]/g, ''), unit)}
              keyboardType="number-pad"
              accessibilityLabel={label}
              maxLength={3}
              selectionColor={theme.c.emi}
              maxFontSizeMultiplier={1.5}
              style={[s.durationInput, { fontFamily: fontFamily(t.lang, 600), color: theme.c.textPrimary }]}
            />
            <Txt v="body" color="textSecondary" numberOfLines={1}>
              {unitText}
            </Txt>
          </View>
          <StepButton
            icon="plus"
            label={t.t('a11y.increase')}
            onPress={() => step(1)}
            disabled={n !== null && n >= max}
          />
        </FieldShell>
      </View>
      <View style={{ flexGrow: 1, flexBasis: 150, justifyContent: 'flex-end', paddingBottom: error ? 26 : 4 }}>
        <SegmentedControl
          options={[
            { value: 'years', label: t.t('unit.years') },
            { value: 'months', label: t.t('unit.months') },
          ]}
          value={unit}
          onChange={switchUnit}
        />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  label,
  onPress,
  disabled,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          marginHorizontal: -8,
        },
        pressed && { backgroundColor: t.c.bgRaised },
        disabled && { opacity: 0.3 },
      ]}
    >
      <Icon name={icon} color={t.c.textPrimary} size={20} />
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  track: {
    flexDirection: 'row',
    backgroundColor: t.c.bgSunken,
    borderWidth: 1,
    borderColor: t.c.line,
    borderRadius: t.radius.pill,
    padding: 3,
  },
  segment: {
    flex: 1,
    minHeight: t.size.segment,
    borderRadius: t.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
  },
  active: {
    backgroundColor: t.c.bgRaised,
    borderWidth: t.scheme === 'dark' ? 1 : 0,
    borderColor: t.c.line,
    boxShadow: t.scheme === 'light' ? '0px 2px 6px 0px rgba(46,32,140,0.12)' : undefined,
  },
  row: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  durationWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  durationValue: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 56,
  },
  durationInput: { fontSize: 17, paddingVertical: 0, textAlign: 'right', minWidth: 22, fontVariant: ['tabular-nums'] },
}));
