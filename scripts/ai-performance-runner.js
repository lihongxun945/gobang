import assert from 'assert';
import Board from '../src/ai/board';
import { baselineMinmax } from '../src/ai/baseline/minmax';
import { candidateMinmax } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depth = Number(process.env.AI_DEPTH || 2);
const rounds = Number(process.env.AI_ROUNDS || 5);
const openings = loadOpeningSet();

const createBoard = (opening) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  return board;
};

const measure = (engine, opening) => {
  const board = createBoard(opening);
  const startedAt = performance.now();
  const result = engine(board, board.role, depth, true);
  const elapsedMs = performance.now() - startedAt;
  assert(result[1], `${opening.id}: engine returned no move`);
  return elapsedMs;
};

const samples = [];
for (let round = 0; round < rounds; round += 1) {
  let candidateMs = 0;
  let baselineMs = 0;
  openings.forEach((opening, index) => {
    const candidateFirst = (round + index) % 2 === 0;
    if (candidateFirst) {
      candidateMs += measure(candidateMinmax, opening);
      baselineMs += measure(baselineMinmax, opening);
    } else {
      baselineMs += measure(baselineMinmax, opening);
      candidateMs += measure(candidateMinmax, opening);
    }
  });
  samples.push({
    round: round + 1,
    candidateMs,
    baselineMs,
    speedup: baselineMs / candidateMs,
  });
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
  candidateFasterEveryRound: samples.every(({ candidateMs, baselineMs }) => candidateMs < baselineMs),
  medianSpeedup: median(samples.map(({ speedup }) => speedup)),
  samples,
}, null, 2));
