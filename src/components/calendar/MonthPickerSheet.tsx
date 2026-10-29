import React, { useEffect, useState } from 'react';
import { Button } from '@/components/primitives/Button';
import { Txt } from '@/components/primitives/Txt';
import { BottomSheet } from '@/components/feedback/Overlays';
import { addMonths, toIndex, yearOf, type YearMonth } from '@/core/months';
import { useT } from '@/i18n';
import { MonthGrid } from './MonthGrid';

type Props = {
  visible: boolean;
  value: YearMonth | null;
  today: YearMonth;
  onDone: (ym: YearMonth) => void;
  onClose: () => void;
};

/** S6: year header, 4 × 3 picker grid, Done. Range: 30 years ago to 5 years ahead. */
export function MonthPickerSheet({ visible, value, today, onDone, onClose }: Props) {
  const i18n = useT();
  const min = addMonths(today, -30 * 12);
  const max = addMonths(today, 5 * 12);
  const [picked, setPicked] = useState<YearMonth | null>(value);
  const [year, setYear] = useState(yearOf(value ?? today));
  useEffect(() => {
    if (visible) {
      setPicked(value);
      setYear(yearOf(value ?? today));
    }
  }, [visible, value, today]);
  const inRange = (ym: YearMonth) => toIndex(ym) >= toIndex(min) && toIndex(ym) <= toIndex(max);
  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <Txt v="section" accessibilityRole="header">
        {i18n.t('form.firstMonth')}
      </Txt>
      <MonthGrid
        mode="picker"
        year={year}
        onYearChange={setYear}
        minYear={yearOf(min)}
        maxYear={yearOf(max)}
        selected={picked}
        onSelect={setPicked}
        cell={ym => ({ status: 'upcoming', disabled: !inRange(ym) })}
      />
      <Button label={i18n.t('action.done')} disabled={!picked} onPress={() => picked && onDone(picked)} />
    </BottomSheet>
  );
}
