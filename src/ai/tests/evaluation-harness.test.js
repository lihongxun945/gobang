const {
  Referee, bootstrap, openingPool, parseArgs,
} = require('../../../scripts/ai-evaluate-strength.cjs');

describe('AI evaluation harness', () => {
  test('the independent referee detects five in a row', () => {
    const referee = new Referee(15, [
      [7, 5], [6, 5], [7, 6], [6, 6], [7, 7], [6, 7], [7, 8], [6, 8],
    ]);

    referee.put([7, 9]);

    expect(referee.winner).toBe(1);
    expect(() => referee.put([0, 0])).toThrow('game has ended');
  });

  test('opening positions are exactly deduplicated', () => {
    const positions = openingPool();
    const keys = positions.map(({ size, moves }) => `${size}|${JSON.stringify(moves)}`);

    expect(positions.length).toBeGreaterThan(100);
    expect(new Set(keys).size).toBe(positions.length);
    expect(positions.every(({ familyId }) => familyId)).toBe(true);
  });

  test('bootstrap resamples whole opening families', () => {
    const confidence = bootstrap([
      { familyId: 'strong', score: 2 },
      { familyId: 'strong', score: 2 },
      { familyId: 'weak', score: 0 },
    ], 1000, 7);

    expect(confidence.openingFamilyClusters).toBe(2);
    expect(confidence.scoreRate95[0]).toBe(0);
    expect(confidence.scoreRate95[1]).toBe(1);
  });

  test('CLI parses concurrency and output options', () => {
    expect(parseArgs([
      '--games', '40', '--concurrency', '3', '--output', 'report.json',
      '--baseline-bundle', 'p0.cjs',
    ])).toMatchObject({
      games: 40, concurrency: 3, output: 'report.json', baselineBundle: 'p0.cjs',
    });
  });
});
