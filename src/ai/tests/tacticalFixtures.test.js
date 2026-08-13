import { tacticalPositions } from '../fixtures/tactics';

describe('tactical fixtures', () => {
  test('have unique ids and legal alternating move histories', () => {
    expect(new Set(tacticalPositions.map(({ id }) => id)).size).toBe(tacticalPositions.length);
    tacticalPositions.forEach((position) => {
      const occupied = new Set();
      position.moves.forEach(([x, y]) => {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(position.size);
        expect(y).toBeLessThan(position.size);
        expect(occupied.has(`${x}:${y}`)).toBe(false);
        occupied.add(`${x}:${y}`);
      });
      expect(['minmax', 'vct']).toContain(position.search);
      expect(['win', 'loss', 'not-win']).toContain(position.expect.outcome);
    });
  });
});
