import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './Pressable';
import { Txt } from './Txt';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  disabled?: boolean;
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  compact,
  style,
  accessibilityHint,
}: Props) {
  const t = useTheme();
  const s = useStyles();
  const fg = disabled
    ? t.c.textMuted
    : variant === 'primary' || variant === 'destructive'
    ? t.c.onEmi
    : variant === 'secondary'
    ? t.c.emi
    : t.c.textPrimary;
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.base,
        { minHeight: compact ? t.size.buttonCompact : t.size.button },
        variant === 'primary' && { backgroundColor: pressed ? alpha(t.c.emi, 0.82) : t.c.emi },
        variant === 'destructive' && { backgroundColor: pressed ? alpha(t.c.error, 0.82) : t.c.error },
        variant === 'secondary' && [s.secondary, pressed && { backgroundColor: alpha(t.c.emi, 0.1) }],
        variant === 'ghost' && pressed && { backgroundColor: alpha(t.c.textPrimary, 0.1) },
        disabled && s.disabled,
        style,
      ]}
    >
      {icon ? <Icon name={icon} color={fg} size={20} /> : null}
      <Txt v="body" weight={700} style={{ color: fg }} numberOfLines={2} align="center">
        {label}
      </Txt>
    </PressableScale>
  );
}

const useStyles = makeStyles(t => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
    borderRadius: t.radius.pill,
  },
  secondary: { borderWidth: 1.5, borderColor: t.c.emi },
  disabled: { backgroundColor: t.c.line, borderColor: t.c.line },
}));

type IconButtonProps = {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
  size?: number;
};

/** 48 × 48 round icon button; always carries an accessibility label. */
export function IconButton({ icon, label, onPress, color, disabled, size = 24 }: IconButtonProps) {
  const t = useTheme();
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        iconStyles.btn,
        pressed && { backgroundColor: alpha(t.c.textPrimary, 0.1) },
        disabled && iconStyles.disabled,
      ]}
    >
      <Icon name={icon} color={color ?? t.c.textPrimary} size={size} />
    </PressableScale>
  );
}

const iconStyles = StyleSheet.create({
  btn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: 0.3 },
});

/** Extended FAB: Plus + label, teal with a soft teal glow. */
export function Fab({ label, onPress, bottom }: { label: string; onPress: () => void; bottom: number }) {
  const t = useTheme();
  return (
    <View
      pointerEvents="box-none"
      style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', alignItems: 'flex-end' }]}
    >
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={{
          marginRight: 20,
          marginBottom: bottom,
          height: t.size.fab,
          borderRadius: t.radius.pill,
          backgroundColor: t.c.emi,
          paddingHorizontal: 22,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          boxShadow: t.shadow.fabGlow,
        }}
      >
        <Icon name="plus" color={t.c.onEmi} bold />
        <Txt v="body" weight={700} style={{ color: t.c.onEmi }}>
          {label}
        </Txt>
      </PressableScale>
    </View>
  );
}
