import React, { forwardRef, useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { feedback } from '@/feedback';
import { useT } from '@/i18n';
import { fromBengaliDigits } from '@/core/loan/parse';
import { groupInputText, toBengaliDigits } from '@/i18n/format';
import { fontFamily, takaFamily } from '@/theme/fonts';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { Icon, type IconName } from './Icon';
import { InlineError } from './Feedback';
import { Txt } from './Txt';

export type InputRef = React.ComponentRef<typeof TextInput>;

/** Shakes twice (6 pt, 200 ms) and plays the warn moment when an error first appears. */
function useShake(error: string | undefined) {
  const x = useSharedValue(0);
  const reduce = useReducedMotion();
  const had = useRef(!!error);
  useEffect(() => {
    if (error && !had.current) {
      feedback.warn();
      if (!reduce) {
        const d = 25;
        x.value = withSequence(...[6, -6, 6, -6, 6, -6, 0, 0].map(v => withTiming(v, { duration: d })));
      }
    }
    had.current = !!error;
  }, [error, reduce, x]);
  return useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
}

type FieldShellProps = {
  label: string;
  error?: string;
  helper?: string;
  focused?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

/** Label above, 52-high sunken box, focus/error rings, InlineError below. */
export function FieldShell({ label, error, helper, focused, disabled, children }: FieldShellProps) {
  const s = useStyles();
  const t = useTheme();
  const shake = useShake(error);
  const ring = error ? t.c.error : focused ? t.c.emi : undefined;
  return (
    <View style={[s.field, disabled && { opacity: 0.45 }]}>
      <Txt v="caption" color="textSecondary">
        {label}
      </Txt>
      <Animated.View style={[s.box, shake, ring && { borderColor: ring, boxShadow: `0px 0px 0px 1px ${ring}` }]}>
        {children}
      </Animated.View>
      {error ? (
        <InlineError message={error} />
      ) : helper ? (
        <Txt v="caption" color="textMuted">
          {helper}
        </Txt>
      ) : null}
    </View>
  );
}

type NumberInputProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  onChangeText: (raw: string) => void;
  kind: 'amount' | 'rate';
  error?: string;
  helper?: string;
};

/** Max decimals while typing: taka to the paisa, rates to 3 places (§5.1). */
const DECIMALS = { amount: 2, rate: 3 };

/**
 * AmountInput (৳ prefix) / RateInput (% suffix). Commas are removed on focus and added on
 * blur; Bengali digits are accepted and kept as typed (parsing handles both).
 */
export const NumberInput = forwardRef<InputRef, NumberInputProps>(function NumberInputImpl(
  { label, value, onChangeText, kind, error, helper, onFocus, onBlur, ...rest },
  ref,
) {
  const s = useStyles();
  const t = useT();
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  const ascii = fromBengaliDigits(value).replace(/,/g, '');
  const shown = focused ? ascii : groupInputText(ascii);
  const display = t.lang === 'bn' && t.bengaliDigits ? toBengaliDigits(shown) : shown;

  const change = (text: string) => {
    const cleaned = text.replace(/[^0-9০-৯.,]/g, '');
    const [, dec] = cleaned.split('.');
    if ((cleaned.match(/\./g)?.length ?? 0) > 1 || (dec !== undefined && dec.length > DECIMALS[kind])) {
      return; // reject the keystroke rather than silently rounding
    }
    onChangeText(cleaned.replace(/,/g, ''));
  };

  return (
    <FieldShell label={label} error={error} helper={helper} focused={focused}>
      {kind === 'amount' ? (
        <Txt v="figureMd" color="textSecondary" style={{ fontFamily: takaFamily(600) }}>
          ৳
        </Txt>
      ) : null}
      <TextInput
        ref={ref}
        {...rest}
        value={display}
        onChangeText={change}
        keyboardType="decimal-pad"
        placeholder={t.int(0)}
        placeholderTextColor={theme.c.textMuted}
        selectionColor={theme.c.emi}
        cursorColor={theme.c.emi}
        accessibilityLabel={label}
        accessibilityHint={error}
        maxFontSizeMultiplier={1.5}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[s.input, { fontFamily: fontFamily(t.lang, 600) }]}
      />
      {kind === 'rate' ? (
        <Txt v="figureMd" color="textSecondary">
          %
        </Txt>
      ) : null}
    </FieldShell>
  );
});

type TextFieldProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  icon?: IconName;
  error?: string;
};

export const TextField = forwardRef<InputRef, TextFieldProps>(function TextFieldImpl(
  { label, value, onChangeText, icon, error, onFocus, onBlur, ...rest },
  ref,
) {
  const s = useStyles();
  const t = useT();
  const theme = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <FieldShell label={label} error={error} focused={focused}>
      {icon ? <Icon name={icon} color={theme.c.principal} size={20} /> : null}
      <TextInput
        ref={ref}
        {...rest}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor={theme.c.textMuted}
        selectionColor={theme.c.emi}
        cursorColor={theme.c.emi}
        accessibilityLabel={label}
        maxFontSizeMultiplier={1.5}
        onFocus={e => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={e => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[s.input, { fontFamily: fontFamily(t.lang, 600) }]}
      />
    </FieldShell>
  );
});

type MonthFieldProps = {
  label: string;
  value: string | null;
  placeholder: string;
  onPress: () => void;
  error?: string;
};

/** Shows "March 2027" and opens the month picker. */
export function MonthField({ label, value, placeholder, onPress, error }: MonthFieldProps) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}, ${value ?? placeholder}`}>
      <FieldShell label={label} error={error}>
        <Icon name="calendar" color={theme.c.principal} size={20} />
        <Txt v="figureMd" color={value ? 'textPrimary' : 'textMuted'} style={{ flex: 1 }}>
          {value ?? placeholder}
        </Txt>
        <Icon name="caretRight" color={theme.c.textSecondary} size={20} />
      </FieldShell>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  field: { gap: 6 },
  box: {
    minHeight: t.size.input,
    borderRadius: t.radius.input,
    backgroundColor: t.c.bgSunken,
    borderWidth: 1,
    borderColor: t.c.line,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: t.size.input - 2,
    fontSize: 17,
    color: t.c.textPrimary,
    paddingVertical: 0,
    fontVariant: ['tabular-nums'],
  },
}));
