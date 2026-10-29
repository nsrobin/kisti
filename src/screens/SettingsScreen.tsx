import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { TabScreenProps } from '@/app/navigation-types';
import { TAB_BAR_HEIGHT } from '@/app/TabBar';
import { APP_VERSION } from '@/app/version';
import { ConfirmDialog } from '@/components/feedback/Overlays';
import { BrandMark } from '@/components/primitives/BrandMark';
import { useCardStyle } from '@/components/primitives/Card';
import { ListRow, SegmentedControl, SwitchRow } from '@/components/primitives/Controls';
import { StatusBarScrim } from '@/components/primitives/StatusBarScrim';
import { Txt } from '@/components/primitives/Txt';
import { useT } from '@/i18n';
import { useStore } from '@/state/store';
import type { ThemeSetting } from '@/state/types';
import { fontFamily } from '@/theme/fonts';
import { makeStyles } from '@/theme/ThemeProvider';

/** S8: language, theme, digits, sound, vibration, delete all (two confirmations), about. */
export function SettingsScreen({ navigation }: TabScreenProps<'Settings'>) {
  const s = useStyles();
  const card = useCardStyle();
  const i18n = useT();
  const insets = useSafeAreaInsets();
  const settings = useStore(st => st.settings);
  const setSettings = useStore(st => st.setSettings);
  const loanCount = useStore(st => st.loans.length);
  const clearAll = useStore(st => st.clearAllLoans);
  const [step, setStep] = useState<0 | 1 | 2>(0);

  return (
    <View style={s.screen}>
      <ScrollView
        contentContainerStyle={[
          s.content,
          { paddingTop: insets.top + 24, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 32 },
        ]}
      >
        <Txt v="rootTitle" accessibilityRole="header">
          {i18n.t('tab.settings')}
        </Txt>

        <View style={[card.card, { gap: 16 }]}>
          <View style={{ gap: 8 }}>
            <Txt v="body" weight={600}>
              {i18n.t('settings.language')}
            </Txt>
            <SegmentedControl
              label={i18n.t('settings.language')}
              value={settings.language}
              onChange={language => setSettings({ language })}
              options={[
                { value: 'bn', label: 'বাংলা', lang: 'bn' },
                { value: 'en', label: 'English', lang: 'en' },
              ]}
            />
          </View>
          <View style={{ gap: 8 }}>
            <Txt v="body" weight={600}>
              {i18n.t('settings.theme')}
            </Txt>
            <SegmentedControl<ThemeSetting>
              label={i18n.t('settings.theme')}
              value={settings.theme}
              onChange={theme => setSettings({ theme })}
              options={[
                { value: 'system', label: i18n.t('settings.themeSystem'), icon: 'phone' },
                { value: 'light', label: i18n.t('settings.themeLight'), icon: 'sun' },
                { value: 'dark', label: i18n.t('settings.themeDark'), icon: 'moon' },
              ]}
            />
          </View>
          {settings.language === 'bn' ? (
            <SwitchRow
              icon="translate"
              label={i18n.t('settings.bengaliDigits')}
              value={settings.bengaliDigits}
              onChange={bengaliDigits => setSettings({ bengaliDigits })}
            />
          ) : null}
        </View>

        <View style={[card.card, { paddingVertical: 4 }]}>
          <SwitchRow
            icon={settings.sound ? 'speakerHigh' : 'speakerSlash'}
            label={i18n.t('settings.sound')}
            value={settings.sound}
            onChange={sound => setSettings({ sound })}
          />
          <SwitchRow
            icon="vibrate"
            label={i18n.t('settings.vibration')}
            value={settings.haptics}
            onChange={haptics => setSettings({ haptics })}
          />
        </View>

        <View style={[card.card, { paddingVertical: 4 }]}>
          <ListRow icon="trash" label={i18n.t('settings.clearAll')} destructive onPress={() => setStep(1)} />
        </View>

        <View style={[card.card, { gap: 10 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <BrandMark size={36} />
            <View style={{ flex: 1 }}>
              <Txt v="section" style={{ fontFamily: fontFamily(i18n.lang, 800, 'expanded') }}>
                {i18n.t('app.name')}
              </Txt>
              <Txt v="caption" color="textSecondary">
                {i18n.t('settings.version', {
                  version:
                    i18n.lang === 'bn' && i18n.bengaliDigits
                      ? APP_VERSION.replace(/\d/g, d => '০১২৩৪৫৬৭৮৯'[Number(d)] as string)
                      : APP_VERSION,
                })}
              </Txt>
            </View>
          </View>
          <Txt v="caption" color="textSecondary">
            {i18n.t('settings.about')}
          </Txt>
          <Txt v="body" color="textSecondary">
            {i18n.t('settings.disclaimer')}
          </Txt>
        </View>
      </ScrollView>

      <StatusBarScrim />
      <ConfirmDialog
        visible={step === 1}
        step={i18n.t('clear.step', { k: i18n.int(1) })}
        title={i18n.t('clear.confirm1.title')}
        body={i18n.t('clear.confirm1.body', { count: i18n.int(loanCount) })}
        confirmLabel={i18n.t('clear.confirm1.yes')}
        onCancel={() => setStep(0)}
        onConfirm={() => setStep(2)}
      />
      <ConfirmDialog
        visible={step === 2}
        icon="warning"
        step={i18n.t('clear.step', { k: i18n.int(2) })}
        title={i18n.t('clear.confirm2.title')}
        body={i18n.t('clear.confirm2.body')}
        confirmLabel={i18n.t('clear.confirm2.yes')}
        onCancel={() => setStep(0)}
        onConfirm={() => {
          setStep(0);
          clearAll();
          navigation.navigate('Loans');
        }}
      />
    </View>
  );
}

const useStyles = makeStyles(t => ({
  screen: { flex: 1, backgroundColor: t.c.bgBase },
  content: { paddingHorizontal: t.space.screen, gap: 16 },
}));
