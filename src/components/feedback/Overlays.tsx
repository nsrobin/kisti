import React, { useEffect, useMemo, type ReactNode } from 'react';
import { Modal, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Button } from '@/components/primitives/Button';
import { Icon, type IconName } from '@/components/primitives/Icon';
import { Txt } from '@/components/primitives/Txt';
import { MOTION } from '@/feedback/motion';
import { useT } from '@/i18n';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha, auroraGradient } from '@/theme/tokens';

/** Bottom sheet: top radius 28, scrim, grab handle; drag down to dismiss. */
export function BottomSheet({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const reduce = useReducedMotion();
  const y = useSharedValue(0);
  const closeRef = React.useRef(onClose);
  closeRef.current = onClose;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
        onPanResponderMove: (_e, g) => {
          y.value = Math.max(0, g.dy);
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 100 || g.vy > 1) {
            closeRef.current();
          }
          y.value = withTiming(0, { duration: MOTION.micro });
        },
      }),
    [y],
  );
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Modal
      visible={visible}
      transparent
      animationType={reduce ? 'fade' : 'slide'}
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={s.scrim} onPress={onClose} accessibilityLabel={useT().t('a11y.close')} />
      <Animated.View style={[s.sheet, { paddingBottom: 30 + insets.bottom }, anim]} {...pan.panHandlers}>
        <View style={s.handle} />
        {children}
      </Animated.View>
    </Modal>
  );
}

type ConfirmProps = {
  visible: boolean;
  title: string;
  body?: string;
  step?: string;
  confirmLabel: string;
  icon?: IconName;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Centred dialog: icon disc, title, body, Cancel + destructive button. */
export function ConfirmDialog({
  visible,
  title,
  body,
  step,
  confirmLabel,
  icon = 'trash',
  onConfirm,
  onCancel,
}: ConfirmProps) {
  const s = useStyles();
  const t = useTheme();
  const i18n = useT();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View style={s.center}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={s.dialog} accessibilityViewIsModal>
          <View style={s.disc}>
            <Icon name={icon} color={t.c.error} size={28} />
          </View>
          {step ? (
            <Txt v="caption" color="textMuted" align="center">
              {step}
            </Txt>
          ) : null}
          <Txt v="title" align="center" accessibilityRole="header">
            {title}
          </Txt>
          {body ? (
            <Txt v="body" color="textSecondary" align="center">
              {body}
            </Txt>
          ) : null}
          <View style={s.buttons}>
            <Button
              label={i18n.t('action.cancel')}
              variant="secondary"
              onPress={onCancel}
              style={{ flex: 1, paddingHorizontal: 12 }}
              compact
            />
            <Button
              label={confirmLabel}
              variant="destructive"
              onPress={onConfirm}
              style={{ flex: 1, paddingHorizontal: 12 }}
              compact
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

/** Inverse snackbar with an action and a 5 s dashed countdown line. */
export function Snackbar({
  message,
  action,
  onAction,
  onTimeout,
  bottom,
  duration = 5000,
}: {
  message: string;
  action: string;
  onAction: () => void;
  onTimeout: () => void;
  bottom: number;
  duration?: number;
}) {
  const s = useStyles();
  const t = useTheme();
  const reduce = useReducedMotion();
  const progress = useSharedValue(1);
  useEffect(() => {
    progress.value = withTiming(0, { duration, easing: Easing.linear }, done => {
      if (done) {
        runOnJS(onTimeout)();
      }
    });
  }, [progress, duration, onTimeout]);
  const bar = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));
  return (
    <Animated.View
      entering={reduce ? FadeIn.duration(MOTION.reduced) : FadeInDown.duration(MOTION.standard)}
      exiting={FadeOut.duration(MOTION.micro)}
      accessibilityLiveRegion="polite"
      style={[s.snackbar, { bottom }]}
    >
      <Txt v="body" style={{ flex: 1, color: t.c.bgBase }}>
        {message}
      </Txt>
      <Pressable accessibilityRole="button" onPress={onAction} hitSlop={8} style={s.snackAction}>
        <Icon name="undo" color={t.inverseEmi} size={18} />
        <Txt v="body" weight={700} style={{ color: t.inverseEmi }}>
          {action}
        </Txt>
      </Pressable>
      <Animated.View style={[s.countdown, { borderColor: t.inverseEmi }, bar]} />
    </Animated.View>
  );
}

const APath = Animated.createAnimatedComponent(Path);

/** Check draws over 300 ms, 8 stitch sparks burst over 500 ms, then `onDone`. */
export function SuccessMoment({ title, onDone }: { title: string; onDone: () => void }) {
  const s = useStyles();
  const t = useTheme();
  const reduce = useReducedMotion();
  const check = useSharedValue(reduce ? 1 : 0);
  const burst = useSharedValue(0);
  useEffect(() => {
    check.value = reduce ? 1 : withTiming(1, { duration: 300, easing: MOTION.easing });
    burst.value = reduce ? 0 : withDelay(150, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }));
    const timer = setTimeout(onDone, reduce ? 700 : 1100);
    return () => clearTimeout(timer);
  }, [check, burst, reduce, onDone]);
  const CHECK_LEN = 60;
  const checkProps = useAnimatedProps(() => ({ strokeDashoffset: CHECK_LEN * (1 - check.value) }));
  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent>
      <Pressable style={[s.center, { backgroundColor: t.c.scrim }]} onPress={onDone} accessibilityLabel={title}>
        <View style={{ width: 180, height: 180, alignItems: 'center', justifyContent: 'center' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <Spark key={i} angle={(i * Math.PI) / 4} progress={burst} color={t.aurora[i % 3] as string} />
          ))}
          <View style={[s.discBorder, { backgroundImage: auroraGradient(t) }]}>
            <View style={s.discInner}>
              <Svg width={48} height={48} viewBox="0 0 48 48">
                <APath
                  d="M11 25 L20 34 L37 15"
                  stroke={t.c.cash}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  strokeDasharray={`${CHECK_LEN} ${CHECK_LEN}`}
                  animatedProps={checkProps}
                />
              </Svg>
            </View>
          </View>
        </View>
        <Txt
          v="title"
          accessibilityLiveRegion="assertive"
          style={{ color: t.scheme === 'dark' ? t.c.textPrimary : '#FFFFFF' }}
        >
          {title}
        </Txt>
      </Pressable>
    </Modal>
  );
}

function Spark({ angle, progress, color }: { angle: number; progress: { value: number }; color: string }) {
  const anim = useAnimatedStyle(() => {
    const r = 62 + progress.value * 20;
    return {
      opacity: progress.value === 0 ? 0 : 1 - progress.value * 0.8,
      transform: [{ translateX: Math.cos(angle) * r }, { translateY: Math.sin(angle) * r }, { rotate: `${angle}rad` }],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', width: 12, height: 4, borderRadius: 2, backgroundColor: color }, anim]}
    />
  );
}

/** ⋯ popover menu anchored top-right. */
export function PopoverMenu({
  visible,
  onClose,
  top,
  items,
}: {
  visible: boolean;
  onClose: () => void;
  top: number;
  items: { label: string; icon: IconName; destructive?: boolean; onPress: () => void }[];
}) {
  const s = useStyles();
  const t = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[s.menu, { top }]}>
        {items.map(i => (
          <Pressable
            key={i.label}
            accessibilityRole="menuitem"
            onPress={() => {
              onClose();
              i.onPress();
            }}
            style={({ pressed }) => [s.menuItem, pressed && { backgroundColor: t.c.bgSunken }]}
          >
            <Icon name={i.icon} color={i.destructive ? t.c.error : t.c.textPrimary} size={20} />
            <Txt v="body" weight={600} style={{ color: i.destructive ? t.c.error : t.c.textPrimary }}>
              {i.label}
            </Txt>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

const useStyles = makeStyles(t => ({
  scrim: { flex: 1, backgroundColor: t.c.scrim },
  sheet: {
    backgroundColor: t.c.bgRaised,
    borderTopLeftRadius: t.radius.sheet,
    borderTopRightRadius: t.radius.sheet,
    borderTopWidth: 1,
    borderColor: t.c.line,
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 16,
  },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: t.c.line },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.c.scrim, gap: 16 },
  dialog: {
    marginHorizontal: 24,
    alignSelf: 'stretch',
    borderRadius: t.radius.dialog,
    backgroundColor: t.c.bgRaised,
    borderWidth: 1,
    borderColor: t.c.line,
    padding: 24,
    gap: 12,
    alignItems: 'center',
  },
  disc: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: alpha(t.c.error, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttons: { flexDirection: 'row', gap: 12, alignSelf: 'stretch', marginTop: 8 },
  snackbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    minHeight: 56,
    borderRadius: t.radius.snackbar,
    backgroundColor: t.c.textPrimary,
    paddingLeft: 16,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    overflow: 'hidden',
  },
  snackAction: { minHeight: 48, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  countdown: { position: 'absolute', left: 0, bottom: 0, height: 0, borderBottomWidth: 4, borderStyle: 'dashed' },
  discBorder: { width: 92, height: 92, borderRadius: 46, padding: 4 },
  discInner: {
    flex: 1,
    borderRadius: 42,
    backgroundColor: t.c.bgRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menu: {
    position: 'absolute',
    right: 16,
    width: 220,
    borderRadius: 20,
    backgroundColor: t.c.bgRaised,
    borderWidth: 1,
    borderColor: t.c.line,
    boxShadow: t.shadow.selectedCell,
    paddingVertical: 6,
  },
  menuItem: { minHeight: 52, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
}));
