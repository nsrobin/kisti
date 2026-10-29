import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { currentYearMonth, type YearMonth } from '@/core/months';

/** The phone's current month; refreshed when the app returns to the foreground. */
export function useToday(): YearMonth {
  const [today, setToday] = useState(() => currentYearMonth(new Date()));
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s === 'active') {
        setToday(currentYearMonth(new Date()));
      }
    });
    return () => sub.remove();
  }, []);
  return today;
}
