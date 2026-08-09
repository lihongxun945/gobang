import assert from 'assert';
import Board from '../src/ai/board';
import { candidateMinmax, clearSearchCache } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depth = Number(process.env.AI_DEPTH || 6);
const rounds = Number(process.env.AI_ROUNDS || 7);
const openings = loadOpeningSet();

const createBoard = (opening) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  return board;
};

const measure = (opening, experimentalPvs) => {
  const board = createBoard(opening);
  clearSearchCache(board);
  const startedAt = performance.now();
  const result = candidateMinmax(board, board.role, depth, false, { experimentalPvs });
  return { result, elapsedMs: performance.now() - startedAt };
};

const samples = [];
for (let round = 0; round < rounds; round += 1) {
  let normalMs = 0;
  let pvsMs = 0;
  for (let index = 0; index < openings.length; index += 1) {
    const opening = openings[index];
    const pvsFirst = (round + index) % 2 === 0;
    const first = measure(opening, pvsFirst);
    const second = measure(opening, !pvsFirst);
    const normal = pvsFirst ? second : first;
    const pvs = pvsFirst ? first : second;
    assert.deepStrictEqual(pvs.result, normal.result, `${opening.id}/round-${round + 1}: PVS drift`);
    normalMs += normal.elapsedMs;
    pvsMs += pvs.elapsedMs;
  }
  samples.push({ round: round + 1, normalMs, pvsMs, speedup: normalMs / pvsMs });
}

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  depth,
  rounds,
  positionsPerRound: openings.length,
  pvsFasterEveryRound: samples.every(({ normalMs, pvsMs }) => pvsMs < normalMs),
  medianSpeedup: median(samples.map(({ speedup }) => speedup)),
  samples,
}, null, 2));
