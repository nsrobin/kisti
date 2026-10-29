import React, { type ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import type { MoneyColor } from '@/theme/tokens';
import { Icon, type IconName } from './Icon';
import { Txt } from './Txt';

type Props = {
  title?: string;
  icon?: IconName;
  iconColor?: MoneyColor;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/** Raised section: radius 20, 1px line, light-mode shadow, padding 16, gap 14. */
export function SectionCard({ title, icon, iconColor = 'emi', children, style }: Props) {
  const s = useStyles();
  const t = useTheme();
  return (
    <View style={[s.card, style]}>
      {title ? (
        <View style={s.titleRow} accessibilityRole="header">
          {icon ? <Icon name={icon} color={t.c[iconColor]} duotone /> : null}
          <Txt v="section" style={{ flex: 1 }}>
            {title}
          </Txt>
        </View>
      ) : null}
      {children}
    </View>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  const t = useTheme();
  return <View style={[{ height: 1, backgroundColor: t.c.line }, style]} />;
}

export const useCardStyle = makeStyles(t => ({
  card: {
    backgroundColor: t.c.bgRaised,
    borderRadius: t.radius.section,
    borderWidth: 1,
    borderColor: t.c.line,
    boxShadow: t.shadow.card,
    padding: t.space.card,
  },
}));

const useStyles = makeStyles(t => ({
  card: {
    backgroundColor: t.c.bgRaised,
    borderRadius: t.radius.section,
    borderWidth: 1,
    borderColor: t.c.line,
    boxShadow: t.shadow.card,
    padding: t.space.card,
    gap: 14,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
}));
