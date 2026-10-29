// Stitch geometry for the ring and linear progress (tokens.stitch, handoff ringSegments).

export type StitchStatus = 'paid' | 'due' | 'upcoming';

export type StitchUnit = { status: StitchStatus; /** 0..1 */ length: number };

/**
 * One unit per installment up to `perInstallmentMax`, otherwise one per year; a partial
 * last year is drawn at half length. `paid` installments are done; `dueK` is today's index.
 */
export function stitchUnits(count: number, paid: number, dueK: number | null, perInstallmentMax: number): StitchUnit[] {
  const yearMode = count > perInstallmentMax;
  const units = yearMode ? Math.ceil(count / 12) : count;
  const out: StitchUnit[] = [];
  for (let u = 0; u < units; u++) {
    let status: StitchStatus;
    if (!yearMode) {
      const k = u + 1;
      status = k <= paid ? 'paid' : k === dueK ? 'due' : 'upcoming';
    } else {
      const a = u * 12 + 1;
      const b = Math.min((u + 1) * 12, count);
      const holdsDue = dueK !== null && dueK >= a && dueK <= b;
      status = paid >= b ? 'paid' : holdsDue || (paid >= a && paid < b) ? 'due' : 'upcoming';
    }
    const partial = yearMode && u === units - 1 && count % 12 !== 0;
    out.push({ status, length: partial ? 0.5 : 1 });
  }
  return out;
}

export type RingGeometry = {
  radius: number;
  stroke: number;
  glowStroke: number;
  segments: { status: StitchStatus; d: string }[];
};

/** SVG arc paths for a ring of `size` pt (tokens.stitch.ring). */
export function ringGeometry(size: number, units: StitchUnit[]): RingGeometry {
  const cx = size / 2;
  const R = size / 2 - size * 0.07;
  const per = (2 * Math.PI * R) / Math.max(units.length, 1);
  const stroke = Math.min(size * 0.032, Math.max(size * 0.016, per * 0.42));
  const arc = Math.max(per * 0.6 - stroke, 0.4);
  const segments = units.map((unit, u) => {
    const len = arc * unit.length;
    const mid = -Math.PI / 2 + ((u + 0.5) * per) / R;
    const h = len / 2 / R;
    const p = (a: number) => `${(cx + R * Math.cos(a)).toFixed(2)} ${(cx + R * Math.sin(a)).toFixed(2)}`;
    return { status: unit.status, d: `M${p(mid - h)} A${R.toFixed(2)} ${R.toFixed(2)} 0 0 1 ${p(mid + h)}` };
  });
  return { radius: R, stroke, glowStroke: stroke * 2.8, segments };
}
