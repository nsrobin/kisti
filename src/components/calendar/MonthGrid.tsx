import React, { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Icon } from '@/components/primitives/Icon';
import { Txt } from '@/components/primitives/Txt';
import { makeYearMonth, type MonthStatus, type YearMonth } from '@/core/months';
import { feedback } from '@/feedback';
import { MOTION } from '@/feedback/motion';
import { useT } from '@/i18n';
import { monthName } from '@/i18n/format';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { StatusMark } from './StatusMark';

export type CellInfo = { status: MonthStatus; final?: boolean; disabled: boolean };

type Props = {
  mode: 'calendar' | 'picker';
  year: number;
  onYearChange: (year: number) => void;
  minYear: number;
  maxYear: number;
  selected: YearMonth | null;
  onSelect: (ym: YearMonth) => void;
  cell: (ym: YearMonth) => CellInfo;
  /** Calendar mode: the "This month" pill. */
  onThisMonth?: () => void;
  thisMonthDisabled?: boolean;
};

/** 4 × 3 month grid shared by the S7 calendar and the S6 picker. Swipe changes the year. */
export function MonthGrid(p: Props) {
  const s = useStyles();
  const i18n = useT();
  const reduce = useReducedMotion();
  const slide = useSharedValue(0);
  const fade = useSharedValue(1);
  const prevYear = useRef(p.year);

  useEffect(() => {
    if (prevYear.current === p.year) {
      return;
    }
    const dir = p.year > prevYear.current ? 1 : -1;
    prevYear.current = p.year;
    if (reduce) {
      fade.value = 0.3;
      fade.value = withTiming(1, { duration: MOTION.reduced });
    } else {
      slide.value = dir * 48;
      fade.value = 0.2;
      slide.value = withTiming(0, { duration: MOTION.standard, easing: MOTION.easing });
      fade.value = withTiming(1, { duration: MOTION.standard });
    }
  }, [p.year, reduce, slide, fade]);
  const gridAnim = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateX: slide.value }] }));

  const go = (d: number) => {
    const y = p.year + d;
    if (y >= p.minYear && y <= p.maxYear) {
      feedback.stitch();
      p.onYearChange(y);
    }
  };
  const goRef = useRef(go);
  goRef.current = go;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 16 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_e, g) => {
          if (Math.abs(g.dx) > 48) {
            goRef.current(g.dx < 0 ? 1 : -1);
          }
        },
      }),
    [],
  );

  return (
    <View style={{ gap: 12 }}>
      <View style={s.header}>
        <IconBtn
          icon="caretLeft"
          label={i18n.t('a11y.prevYear')}
          disabled={p.year <= p.minYear}
          onPress={() => go(-1)}
        />
        <Txt
          v="title"
          size={20}
          weight={700}
          width="semiExpanded"
          style={{ minWidth: 64 }}
          align="center"
          accessibilityRole="header"
        >
          {i18n.int(p.year)}
        </Txt>
        <IconBtn
          icon="caretRight"
          label={i18n.t('a11y.nextYear')}
          disabled={p.year >= p.maxYear}
          onPress={() => go(1)}
        />
        <View style={{ flex: 1 }} />
        {p.onThisMonth ? (
          <Pressable
            accessibilityRole="button"
            disabled={p.thisMonthDisabled}
            onPress={p.onThisMonth}
            style={[s.thisMonth, p.thisMonthDisabled && { opacity: 0.3 }]}
          >
            <Txt v="caption" weight={600}>
              {i18n.t('cal.thisMonth')}
            </Txt>
          </Pressable>
        ) : null}
      </View>
      <Animated.View {...pan.panHandlers} style={[s.grid, gridAnim]}>
        {Array.from({ length: 12 }, (_, m) => {
          const ym = makeYearMonth(p.year, m + 1);
          return (
            <MonthCell
              key={m}
              mode={p.mode}
              label={monthName(m + 1, i18n.lang, 'short')}
              a11yMonth={i18n.month(ym)}
              info={p.cell(ym)}
              selected={p.selected === ym}
              onPress={() => p.onSelect(ym)}
            />
          );
        })}
      </Animated.View>
    </View>
  );
}

function IconBtn({
  icon,
  label,
  disabled,
  onPress,
}: {
  icon: 'caretLeft' | 'caretRight';
  label: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.3 : 1 }}
    >
      <Icon name={icon} color={t.c.textPrimary} size={22} />
    </Pressable>
  );
}

type CellProps = {
  mode: 'calendar' | 'picker';
  label: string;
  a11yMonth: string;
  info: CellInfo;
  selected: boolean;
  onPress: () => void;
};

function MonthCell({ mode, label, a11yMonth, info, selected, onPress }: CellProps) {
  const s = useStyles();
  const t = useTheme();
  const i18n = useT();
  const reduce = useReducedMotion();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: selected && mode === 'calendar' ? -2 : 0 }],
  }));

  const press = () => {
    if (!reduce) {
      scale.value = withSequence(withTiming(1.06, { duration: 90 }), withSpring(1, MOTION.spring));
    }
    feedback.stitch();
    onPress();
  };

  const statusLabel = info.status === 'outside' ? i18n.t('a11y.outsideLoan') : i18n.t(`status.${info.status}`);
  const a11y = [
    mode === 'calendar' ? i18n.t('a11y.monthCell', { month: a11yMonth, status: statusLabel }) : a11yMonth,
    info.final ? i18n.t('a11y.final') : '',
  ]
    .filter(Boolean)
    .join(', ');

  if (mode === 'picker') {
    return (
      <Animated.View style={[s.cellWrap, anim]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={a11y}
          accessibilityState={{ selected, disabled: info.disabled }}
          disabled={info.disabled}
          onPress={press}
          style={[
            s.pickerCell,
            selected && { backgroundColor: t.c.emi, borderColor: t.c.emi },
            info.disabled && { opacity: 0.3 },
          ]}
        >
          <Txt v="body" weight={selected ? 700 : 500} style={{ color: selected ? t.c.onEmi : t.c.textPrimary }}>
            {label}
          </Txt>
        </Pressable>
      </Animated.View>
    );
  }

  const due = info.status === 'due';
  return (
    <Animated.View style={[s.cellWrap, anim]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11y}
        accessibilityState={{ selected, disabled: info.disabled }}
        disabled={info.disabled}
        onPress={press}
        style={({ pressed }) => [
          s.calCell,
          due && { backgroundColor: alpha(t.c.emi, 0.1), borderColor: alpha(t.c.emi, 0.45) },
          selected && {
            backgroundColor: t.c.bgRaised,
            borderColor: t.c.textPrimary,
            borderWidth: 2,
            boxShadow: t.shadow.selectedCell,
          },
          pressed && !selected && { backgroundColor: t.c.bgSunken },
          info.disabled && { opacity: 0.3 },
        ]}
      >
        <Txt
          v="caption"
          weight={selected ? 700 : 500}
          color={selected ? 'textPrimary' : 'textSecondary'}
          numberOfLines={1}
        >
          {label}
        </Txt>
        <StatusMark status={info.status} final={info.final} />
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles(t => ({
  header: { flexDirection: 'row', alignItems: 'center' },
  thisMonth: {
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: t.radius.pill,
    borderWidth: 1.5,
    borderColor: t.c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: 8, columnGap: 8 },
  cellWrap: { width: '22.9%', flexGrow: 1 },
  calCell: {
    height: t.size.cellCalendar,
    borderRadius: t.radius.cell,
    backgroundColor: t.c.bgBase,
    borderWidth: 1,
    borderColor: t.c.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pickerCell: {
    height: t.size.cellPicker,
    borderRadius: t.radius.cell,
    backgroundColor: t.c.bgBase,
    borderWidth: 1,
    borderColor: t.c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
