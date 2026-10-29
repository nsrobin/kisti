// Built from docs/design-handoff/tokens/tokens.json (§11, with the handoff's deviations).
import type { Accent } from '@/state/types';

const base = {
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, x3: 32, x4: 40, screen: 20, card: 16, hero: 22 },
  radius: { hero: 28, section: 20, cell: 16, input: 14, row: 14, pill: 999, sheet: 28, dialog: 28, snackbar: 16 },
  size: {
    touch: 48,
    input: 52,
    button: 52,
    buttonCompact: 48,
    segment: 44,
    fab: 56,
    tabItem: 56,
    avatar: 44,
    icon: 24,
    iconInRow: 20,
    cellCalendar: 72,
    cellPicker: 56,
  },
  stitch: { dash: 8, gap: 6, stroke: 3 },
};

export type ColorTokens = {
  bgBase: string;
  bgRaised: string;
  bgSunken: string;
  line: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  emi: string;
  principal: string;
  interest: string;
  deduction: string;
  cash: string;
  error: string;
  onEmi: string;
  scrim: string;
  glass: string;
};

export type Theme = typeof base & {
  scheme: 'dark' | 'light';
  c: ColorTokens;
  aurora: readonly [string, string, string];
  accent: Record<Accent, string>;
  /** Snackbar action colour: the other theme's teal on the inverse surface. */
  inverseEmi: string;
  shadow: { card: string | undefined; hero: string; selectedCell: string; fabGlow: string };
};

export const dark: Theme = {
  ...base,
  scheme: 'dark',
  c: {
    bgBase: '#120F2E',
    bgRaised: '#1B1744',
    bgSunken: '#0C0A21',
    line: '#2C2760',
    textPrimary: '#F4F2FF',
    textSecondary: '#B7B2E0',
    textMuted: '#8C86BC',
    emi: '#2EE6D0',
    principal: '#A78BFA',
    interest: '#FFC234',
    deduction: '#FF5C9A',
    cash: '#4BE38A',
    error: '#FF6B6B',
    onEmi: '#120F2E',
    scrim: 'rgba(8,6,24,0.72)',
    glass: 'rgba(27,23,68,0.86)',
  },
  aurora: ['#2EE6D0', '#A78BFA', '#FF5C9A'],
  accent: { nil: '#6C8CFF', shimul: '#FF8A5B', orchid: '#E07BF0', kadam: '#D9E55A', akash: '#5CC8FF' },
  inverseEmi: '#087A6F',
  shadow: {
    card: undefined, // dark mode: no grey shadows, depth comes from the 1px line
    hero: '0px 0px 24px 0px rgba(46,230,208,0.20)',
    selectedCell: '0px 8px 18px 0px rgba(0,0,0,0.45)',
    fabGlow: '0px 6px 24px 0px rgba(46,230,208,0.45)',
  },
};

export const light: Theme = {
  ...base,
  scheme: 'light',
  c: {
    bgBase: '#F5F4FF',
    bgRaised: '#FFFFFF',
    bgSunken: '#ECEAFB',
    line: '#DDD9F5',
    textPrimary: '#1A1640',
    textSecondary: '#4B4680',
    textMuted: '#625E8F', // handoff deviation 1: #6A6696 was 4.48:1 on bg.sunken
    emi: '#087A6F',
    principal: '#6D3FE0',
    interest: '#8F5F00',
    deduction: '#C8235F',
    cash: '#0F7A45',
    error: '#C62828',
    onEmi: '#FFFFFF',
    scrim: 'rgba(26,22,64,0.45)',
    glass: 'rgba(255,255,255,0.88)',
  },
  aurora: ['#0FB5A3', '#7C4DFF', '#E83E8C'],
  accent: { nil: '#3D5BDB', shimul: '#B4501F', orchid: '#9A37B0', kadam: '#5E6C0A', akash: '#1673A6' },
  inverseEmi: '#2EE6D0',
  shadow: {
    card: '0px 4px 16px 0px rgba(46,32,140,0.10)',
    hero: '0px 8px 24px 0px rgba(46,32,140,0.14)',
    selectedCell: '0px 8px 18px 0px rgba(46,32,140,0.22)',
    fabGlow: '0px 6px 24px 0px rgba(8,122,111,0.45)',
  },
};

/** Hex colour at an alpha, for the 10% chip fills and 45% borders. */
export function alpha(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  // eslint-disable-next-line no-bitwise
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const auroraGradient = (t: Theme, angle = 120) =>
  `linear-gradient(${angle}deg, ${t.aurora[0]} 0%, ${t.aurora[1]} 52%, ${t.aurora[2]} 100%)`;

export type MoneyColor = 'emi' | 'principal' | 'interest' | 'deduction' | 'cash' | 'error';
