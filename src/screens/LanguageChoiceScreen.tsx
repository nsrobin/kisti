import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootScreenProps } from '@/app/navigation-types';
import { BrandMark } from '@/components/primitives/BrandMark';
import { Button } from '@/components/primitives/Button';
import { Icon } from '@/components/primitives/Icon';
import { Txt } from '@/components/primitives/Txt';
import { feedback } from '@/feedback';
import { t as translate, type Lang } from '@/i18n';
import { useStore } from '@/state/store';
import { fontFamily } from '@/theme/fonts';
import { makeStyles, useTheme } from '@/theme/ThemeProvider';
import { alpha } from '@/theme/tokens';

/** S2, first launch only: pick বাংলা or English. Copy is shown in both languages. */
export function LanguageChoiceScreen({ navigation }: RootScreenProps<'Language'>) {
  const s = useStyles();
  const insets = useSafeAreaInsets();
  const setSettings = useStore(st => st.setSettings);
  const [picked, setPicked] = useState<Lang | null>(null);

  const done = () => {
    if (!picked) {
      return;
    }
    feedback.success();
    setSettings({ language: picked, onboarded: true });
    // Defer past the current touch: resetting synchronously let the release land on the new tab bar.
    requestAnimationFrame(() => navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.brand}>
          <BrandMark size={44} />
          <Txt v="title" size={24} style={{ fontFamily: fontFamily('bn', 800, 'expanded') }}>
            কিস্তি
          </Txt>
        </View>
        <View style={{ gap: 2 }}>
          <Txt v="rootTitle" style={{ fontFamily: fontFamily('bn', 700, 'semiExpanded') }} accessibilityRole="header">
            {translate('bn', 'onboarding.title')}
          </Txt>
          <Txt v="body" color="textSecondary" style={{ fontFamily: fontFamily('en', 400) }}>
            {translate('en', 'onboarding.title')}
          </Txt>
        </View>
        <LanguageCard lang="bn" selected={picked === 'bn'} onPress={() => setPicked('bn')} />
        <LanguageCard lang="en" selected={picked === 'en'} onPress={() => setPicked('en')} />
        <Txt v="caption" color="textMuted" style={{ fontFamily: fontFamily('bn', 500) }}>
          {translate('bn', 'onboarding.changeLater')}
        </Txt>
        <Txt v="caption" color="textMuted" style={{ fontFamily: fontFamily('en', 500), marginTop: -12 }}>
          {translate('en', 'onboarding.changeLater')}
        </Txt>
      </ScrollView>
      <View style={{ paddingHorizontal: 20 }}>
        <Button
          label={`${translate('bn', 'action.done')}  ${translate('en', 'action.done')}`}
          disabled={!picked}
          onPress={done}
        />
      </View>
    </View>
  );
}

function LanguageCard({ lang, selected, onPress }: { lang: Lang; selected: boolean; onPress: () => void }) {
  const s = useStyles();
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={lang === 'bn' ? 'বাংলা' : 'English'}
      onPress={() => {
        feedback.tap();
        onPress();
      }}
      style={[s.card, selected && { borderColor: t.c.emi, borderWidth: 2, backgroundColor: alpha(t.c.emi, 0.1) }]}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Txt
          v="hero"
          size={44}
          style={{ fontFamily: fontFamily(lang, 800, 'expanded'), lineHeight: lang === 'bn' ? 60 : 50 }}
        >
          {lang === 'bn' ? 'বাংলা' : 'English'}
        </Txt>
        <Txt v="body" color="textSecondary" style={{ fontFamily: fontFamily(lang, 400) }}>
          {translate(lang, 'app.title')}
        </Txt>
      </View>
      <View style={[s.radio, selected && { backgroundColor: t.c.emi, borderColor: t.c.emi }]}>
        {selected ? <Icon name="check" color={t.c.onEmi} size={18} bold /> : null}
      </View>
    </Pressable>
  );
}

const useStyles = makeStyles(t => ({
  screen: { flex: 1, backgroundColor: t.c.bgBase },
  content: { paddingHorizontal: 20, gap: 16, paddingBottom: 24 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  card: {
    minHeight: 132,
    borderRadius: t.radius.hero,
    paddingVertical: 20,
    paddingHorizontal: 22,
    backgroundColor: t.c.bgRaised,
    borderWidth: 1,
    borderColor: t.c.line,
    boxShadow: t.shadow.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: t.c.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
