import React from 'react';
import { View } from 'react-native';
import { Txt } from '@/components/primitives/Txt';
import { useTheme } from '@/theme/ThemeProvider';
import type { MoneyColor } from '@/theme/tokens';

type Segment = { value: number; color: MoneyColor };

/** Pill track (bg.sunken) with pill-capped segments and a 2 pt gap. */
function Bar({ segments, height, label }: { segments: Segment[]; height: number; label: string }) {
  const t = useTheme();
  const total = segments.reduce((s, x) => s + Math.max(0, x.value), 0);
  const visible = segments.filter(s => s.value > 0);
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      style={{
        height,
        borderRadius: height,
        backgroundColor: t.c.bgSunken,
        flexDirection: 'row',
        gap: 2,
        overflow: 'hidden',
      }}
    >
      {total > 0
        ? visible.map((s, i) => (
            <View key={i} style={{ flex: s.value / total, backgroundColor: t.c[s.color], borderRadius: height }} />
          ))
        : null}
    </View>
  );
}

function Legend({ items }: { items: { label: string; color: MoneyColor }[] }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {items.map(i => (
        <View key={i.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 10, height: 4, borderRadius: 2, backgroundColor: t.c[i.color] }} />
          <Txt v="caption" color="textSecondary">
            {i.label}
          </Txt>
        </View>
      ))}
    </View>
  );
}

/** Deductions vs cash in hand. At or over 100% deductions the bar is all pink. */
export function StackedBar(p: { deductions: number; cash: number; label: string; legend: [string, string] }) {
  return (
    <View style={{ gap: 8 }}>
      <Bar
        height={12}
        label={p.label}
        segments={[
          { value: p.deductions, color: 'deduction' },
          { value: Math.max(0, p.cash), color: 'cash' },
        ]}
      />
      <Legend
        items={[
          { label: p.legend[0], color: 'deduction' },
          { label: p.legend[1], color: 'cash' },
        ]}
      />
    </View>
  );
}

/** Interest vs principal over the whole loan, with "22% … is interest" below. */
export function InterestShareBar(p: { interest: number; principal: number; text: string; legend: [string, string] }) {
  return (
    <View style={{ gap: 8 }}>
      <Bar
        height={12}
        label={p.text}
        segments={[
          { value: p.interest, color: 'interest' },
          { value: p.principal, color: 'principal' },
        ]}
      />
      <Txt v="body" weight={600}>
        {p.text}
      </Txt>
      <Legend
        items={[
          { label: p.legend[0], color: 'interest' },
          { label: p.legend[1], color: 'principal' },
        ]}
      />
    </View>
  );
}

/** One month's interest vs principal. */
export const SplitBar = (p: { interest: number; principal: number; label: string }) => (
  <Bar
    height={10}
    label={p.label}
    segments={[
      { value: p.interest, color: 'interest' },
      { value: p.principal, color: 'principal' },
    ]}
  />
);
