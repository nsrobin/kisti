import React from 'react';
import { Accordion } from '@/components/primitives/Accordion';
import { Button } from '@/components/primitives/Button';
import type { LoanResults } from '@/core/loan/types';
import { monthForInstallment, monthStatus, type YearMonth } from '@/core/months';
import { useT } from '@/i18n';
import { GapRow, ScheduleRowCard } from './ScheduleRowCard';

type Props = {
  results: LoanResults;
  onShowAll: () => void;
  /** Loan mode: real month names, status marks, tapping selects the month. */
  loan?: { first: YearMonth; today: YearMonth; selected: YearMonth | null; onSelect: (ym: YearMonth) => void };
};

/** Months 1–12, a gap row and the final month: at most 14 rows with a plain map (§25). */
export function ScheduleAccordion({ results, onShowAll, loan }: Props) {
  const i18n = useT();
  const rows = results.schedule;
  const shown = rows.length <= 13 ? rows : [...rows.slice(0, 12), null, rows[rows.length - 1]!];
  return (
    <Accordion title={i18n.t('sched.title')} icon="listNumbers" iconColor="emi">
      {shown.map(row => {
        if (!row) {
          return <GapRow key="gap" />;
        }
        const final = row.index === results.actualInstallmentCount;
        if (!loan) {
          return (
            <ScheduleRowCard
              key={row.index}
              row={row}
              final={final}
              label={i18n.t('calc.monthLabel', { k: i18n.int(row.index) })}
            />
          );
        }
        const ym = monthForInstallment(loan.first, row.index);
        return (
          <ScheduleRowCard
            key={row.index}
            row={row}
            final={final}
            label={i18n.month(ym, 'short')}
            status={monthStatus(loan.first, results.actualInstallmentCount, ym, loan.today)}
            selected={loan.selected === ym}
            onPress={() => loan.onSelect(ym)}
          />
        );
      })}
      <Button label={i18n.t('sched.showAll')} variant="secondary" onPress={onShowAll} compact />
    </Accordion>
  );
}
