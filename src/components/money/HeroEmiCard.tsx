import React from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, type DerivedValue } from 'react-native-reanimated';
import { InlineError } from '@/components/primitives/Feedback';
import { Icon } from '@/components/primitives/Icon';
import { MoneyValue } from '@/components/primitives/MoneyValue';
import { Pill } from '@/components/primitives/Chips';
import { Txt } from '@/components/primitives/Txt';
import { useT } from '@/i18n';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { auroraGradient } from '@/theme/tokens';

type Props =
  | { valid: true; bankEmiPaisa: number; exactEmiPaisa: number; count: number; monthlyRatePct: number }
  | { valid: false; error: string };

/** Hero card: 1.5 pt aurora border, the bank EMI as the loudest number on screen. */
export function HeroEmiCard(props: Props) {
  const s = useStyles();
  const t = useTheme();
  const i18n = useT();
  return (
    <View style={[s.border, { backgroundImage: auroraGradient(t) }]}>
      <View style={s.inner}>
        <Txt v="caption" color="textSecondary">
          {i18n.t('calc.bankEmi')}
        </Txt>
        {props.valid ? (
          <>
            <MoneyValue paisa={props.bankEmiPaisa} size="hero" decimals={0} roll />
            <Txt v="body" color="textSecondary">
              {i18n.t('calc.exactEmi')}{' '}
              <Txt v="body" weight={600}>
                {i18n.taka(props.exactEmiPaisa)}
              </Txt>
            </Txt>
            <View style={s.note}>
              <Icon name="arrowUp" color={t.c.emi} size={16} />
              <Txt v="caption" color="textMuted" style={{ flex: 1 }}>
                {i18n.t('calc.ceilingNote')}
              </Txt>
            </View>
            <View style={s.pills}>
              <Pill text={i18n.t('calc.installmentsPill', { n: i18n.int(props.count) })} />
              <Pill text={i18n.t('calc.monthlyRatePill', { rate: i18n.percent(props.monthlyRatePct, 4) })} />
            </View>
          </>
        ) : (
          <>
            <MoneyValue paisa={null} size="hero" />
            <InlineError message={props.error} />
          </>
        )}
      </View>
    </View>
  );
}

/** Compact sticky pill: slides down + fades in once the hero leaves the screen. */
export function StickyEmiBar({
  paisa,
  visible,
  top,
  onPress,
}: {
  paisa: number | null;
  visible: DerivedValue<number>;
  top: number;
  onPress: () => void;
}) {
  const s = useStyles();
  const i18n = useT();
  const anim = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateY: (visible.value - 1) * 24 }],
  }));
  return (
    <Animated.View pointerEvents="box-none" style={[s.stickyWrap, { top }, anim]}>
      <Pressable
        accessibilityRole="button"
        accessibilityHint={i18n.t('a11y.scrollTop')}
        onPress={onPress}
        style={s.sticky}
      >
        <Txt v="caption" color="textSecondary">
          {i18n.t('calc.bankEmi')}
        </Txt>
        <MoneyValue paisa={paisa} size="lg" weight={800} width="semiExpanded" decimals={0} />
      </Pressable>
    </Animated.View>
  );
}

const useStyles = makeStyles(t => ({
  border: { borderRadius: t.radius.hero, padding: 1.5, boxShadow: t.shadow.hero },
  inner: {
    borderRadius: t.radius.hero - 1.5,
    backgroundColor: t.c.bgRaised,
    paddingTop: 22,
    paddingHorizontal: 22,
    paddingBottom: 20,
    gap: 6,
  },
  note: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10 },
  stickyWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 10 },
  sticky: {
    minHeight: 48,
    borderRadius: t.radius.pill,
    backgroundColor: t.c.glass,
    borderWidth: 1,
    borderColor: t.c.line,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
}));
