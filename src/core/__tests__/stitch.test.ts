import { ringGeometry, stitchUnits } from '../stitch';

test('one stitch per installment up to the threshold', () => {
  const u = stitchUnits(60, 12, 13, 120);
  expect(u).toHaveLength(60);
  expect(u.filter(x => x.status === 'paid')).toHaveLength(12);
  expect(u[12]?.status).toBe('due');
  expect(u[13]?.status).toBe('upcoming');
});

test('year stitches above the threshold with a half-length partial year', () => {
  const u = stitchUnits(242, 242, null, 120);
  expect(u).toHaveLength(21);
  expect(u.every(x => x.status === 'paid')).toBe(true);
  expect(u[20]?.length).toBe(0.5);
  const running = stitchUnits(242, 30, 31, 120);
  expect(running.slice(0, 2).every(x => x.status === 'paid')).toBe(true);
  expect(running[2]?.status).toBe('due');
  expect(running[3]?.status).toBe('upcoming');
});

test('linear progress switches to years above 60', () => {
  expect(stitchUnits(84, 0, null, 60)).toHaveLength(7);
  expect(stitchUnits(60, 0, null, 60)).toHaveLength(60);
});

test('ring geometry has a path per unit and clamps the stroke', () => {
  const g = ringGeometry(200, stitchUnits(60, 12, 13, 120));
  expect(g.segments).toHaveLength(60);
  expect(g.radius).toBeCloseTo(86);
  expect(g.stroke).toBeGreaterThanOrEqual(3.2);
  expect(g.stroke).toBeLessThanOrEqual(6.4);
  expect(g.segments[0]?.d.startsWith('M')).toBe(true);
});
