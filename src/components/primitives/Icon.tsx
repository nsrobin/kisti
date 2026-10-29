import React from 'react';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { ArrowCounterClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowCounterClockwise';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { ArrowUpIcon } from 'phosphor-react-native/src/icons/ArrowUp';
import { BankIcon } from 'phosphor-react-native/src/icons/Bank';
import { CalculatorIcon } from 'phosphor-react-native/src/icons/Calculator';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { CaretDownIcon } from 'phosphor-react-native/src/icons/CaretDown';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { CaretRightIcon } from 'phosphor-react-native/src/icons/CaretRight';
import { ChartPieSliceIcon } from 'phosphor-react-native/src/icons/ChartPieSlice';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { CheckCircleIcon } from 'phosphor-react-native/src/icons/CheckCircle';
import { ClockIcon } from 'phosphor-react-native/src/icons/Clock';
import { CoinsIcon } from 'phosphor-react-native/src/icons/Coins';
import { DeviceMobileIcon } from 'phosphor-react-native/src/icons/DeviceMobile';
import { DotsThreeIcon } from 'phosphor-react-native/src/icons/DotsThree';
import { GearIcon } from 'phosphor-react-native/src/icons/Gear';
import { HandCoinsIcon } from 'phosphor-react-native/src/icons/HandCoins';
import { HourglassMediumIcon } from 'phosphor-react-native/src/icons/HourglassMedium';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { ListNumbersIcon } from 'phosphor-react-native/src/icons/ListNumbers';
import { MathOperationsIcon } from 'phosphor-react-native/src/icons/MathOperations';
import { MinusIcon } from 'phosphor-react-native/src/icons/Minus';
import { MoonIcon } from 'phosphor-react-native/src/icons/Moon';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PercentIcon } from 'phosphor-react-native/src/icons/Percent';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { ReceiptIcon } from 'phosphor-react-native/src/icons/Receipt';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { SpeakerHighIcon } from 'phosphor-react-native/src/icons/SpeakerHigh';
import { SpeakerSlashIcon } from 'phosphor-react-native/src/icons/SpeakerSlash';
import { SunIcon } from 'phosphor-react-native/src/icons/Sun';
import { TargetIcon } from 'phosphor-react-native/src/icons/Target';
import { TranslateIcon } from 'phosphor-react-native/src/icons/Translate';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { VibrateIcon } from 'phosphor-react-native/src/icons/Vibrate';
import { WarningIcon } from 'phosphor-react-native/src/icons/Warning';
import { XIcon } from 'phosphor-react-native/src/icons/X';

// Individual imports keep unused icons out of the bundle (§18).
const ICONS = {
  arrowUp: ArrowUpIcon,
  arrowsClockwise: ArrowsClockwiseIcon,
  bank: BankIcon,
  calculator: CalculatorIcon,
  calendar: CalendarBlankIcon,
  caretDown: CaretDownIcon,
  caretLeft: CaretLeftIcon,
  caretRight: CaretRightIcon,
  chartPie: ChartPieSliceIcon,
  check: CheckIcon,
  checkCircle: CheckCircleIcon,
  clock: ClockIcon,
  coins: CoinsIcon,
  dots: DotsThreeIcon,
  gear: GearIcon,
  handCoins: HandCoinsIcon,
  hourglass: HourglassMediumIcon,
  info: InfoIcon,
  listNumbers: ListNumbersIcon,
  mathOps: MathOperationsIcon,
  minus: MinusIcon,
  moon: MoonIcon,
  pencil: PencilSimpleIcon,
  percent: PercentIcon,
  phone: DeviceMobileIcon,
  plus: PlusIcon,
  receipt: ReceiptIcon,
  shieldCheck: ShieldCheckIcon,
  speakerHigh: SpeakerHighIcon,
  speakerSlash: SpeakerSlashIcon,
  sun: SunIcon,
  target: TargetIcon,
  translate: TranslateIcon,
  trash: TrashIcon,
  undo: ArrowCounterClockwiseIcon,
  vibrate: VibrateIcon,
  warning: WarningIcon,
  x: XIcon,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

type Props = { name: IconName; color: string; size?: number; duotone?: boolean; bold?: boolean };

/** Regular weight for controls; duotone (30% layer in the same colour) for feature icons. */
export function Icon({ name, color, size = 24, duotone, bold }: Props) {
  const C = ICONS[name];
  return (
    <C
      size={size}
      color={color}
      weight={duotone ? 'duotone' : bold ? 'bold' : 'regular'}
      duotoneColor={color}
      duotoneOpacity={0.3}
    />
  );
}
