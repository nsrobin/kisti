import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RawLoanInputs } from '@/core/loan/types';

export type TabParamList = {
  Calculator: undefined;
  Loans: undefined;
  Settings: undefined;
};

export type RootStackParamList = {
  Language: undefined;
  Tabs: NavigatorScreenParams<TabParamList> | undefined;
  LoanForm: { loanId?: string; prefill?: RawLoanInputs } | undefined;
  LoanDetail: { loanId: string; justSaved?: boolean };
  FullSchedule: { loanId?: string };
};

export type RootScreenProps<K extends keyof RootStackParamList> = NativeStackScreenProps<RootStackParamList, K>;
export type TabScreenProps<K extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, K>,
  NativeStackScreenProps<RootStackParamList>
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
