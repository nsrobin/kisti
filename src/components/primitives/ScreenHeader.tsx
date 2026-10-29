import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeProvider';
import { IconButton } from './Button';
import type { IconName } from './Icon';
import { Txt } from './Txt';

type Props = {
  leading: { icon: IconName; label: string; onPress: () => void };
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  trailing?: ReactNode;
};

/** Stack-screen header: back/close button, title (or custom content), trailing action. */
export function ScreenHeader({ leading, title, subtitle, children, trailing }: Props) {
  const insets = useSafeAreaInsets();
  const t = useTheme();
  return (
    <View
      style={{
        paddingTop: insets.top + 4,
        paddingHorizontal: 8,
        paddingBottom: 4,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: t.c.bgBase,
      }}
    >
      <IconButton icon={leading.icon} label={leading.label} onPress={leading.onPress} />
      <View style={{ flex: 1 }}>
        {children ?? (
          <>
            <Txt v="section" numberOfLines={1} accessibilityRole="header">
              {title}
            </Txt>
            {subtitle ? (
              <Txt v="caption" color="textSecondary" numberOfLines={1}>
                {subtitle}
              </Txt>
            ) : null}
          </>
        )}
      </View>
      {trailing}
    </View>
  );
}
