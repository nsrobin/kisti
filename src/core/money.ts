import type { Paisa } from './loan/types';

/** Taka to integer paisa. The only place money crosses from float to integer (§20). */
export const toPaisa = (taka: number): Paisa => Math.round(taka * 100);

export const sum = (values: readonly number[]): number => values.reduce((total, v) => total + v, 0);
