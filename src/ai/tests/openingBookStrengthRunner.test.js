import { runOpeningBookStrength } from '../../../scripts/ai-opening-book-strength';

test('strength opening book passes paired self-play gate', () => {
  const summary = runOpeningBookStrength();
  expect(summary.positions).toBeGreaterThan(0);
  expect(summary.totalBookHits).toBe(summary.positions);
  expect(summary.regressedPositions).toBe(0);
  expect(summary.scoreDelta).toBeGreaterThanOrEqual(0);
});
