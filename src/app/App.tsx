import React from 'react';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { preloadSounds } from '@/feedback/sound';
import { CalculatorScreen } from '@/screens/CalculatorScreen';
import { FullScheduleScreen } from '@/screens/FullScheduleScreen';
import { LanguageChoiceScreen } from '@/screens/LanguageChoiceScreen';
import { LoanDetailScreen } from '@/screens/LoanDetailScreen';
import { LoanFormScreen } from '@/screens/LoanFormScreen';
import { LoansListScreen } from '@/screens/LoansListScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { useStore } from '@/state/store';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import type { RootStackParamList, TabParamList } from './navigation-types';
import { TabBar } from './TabBar';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const renderTabBar = (props: BottomTabBarProps) => <TabBar {...props} />;

function Tabs() {
  return (
    <Tab.Navigator tabBar={renderTabBar} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Calculator" component={CalculatorScreen} />
      <Tab.Screen name="Loans" component={LoansListScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function Navigation() {
  const t = useTheme();
  const onboarded = useStore(s => s.settings.onboarded);
  const base = t.scheme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: t.c.bgBase,
      card: t.c.bgRaised,
      text: t.c.textPrimary,
      border: t.c.line,
      primary: t.c.emi,
    },
  };
  return (
    <NavigationContainer
      theme={navTheme}
      onReady={() => {
        BootSplash.hide({ fade: true });
        preloadSounds();
      }}
    >
      <Stack.Navigator
        initialRouteName={onboarded ? 'Tabs' : 'Language'}
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: t.c.bgBase },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="Language" component={LanguageChoiceScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Tabs" component={Tabs} options={{ animation: 'fade' }} />
        <Stack.Screen name="LoanForm" component={LoanFormScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="LoanDetail" component={LoanDetailScreen} />
        <Stack.Screen name="FullSchedule" component={FullScheduleScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Navigation />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
